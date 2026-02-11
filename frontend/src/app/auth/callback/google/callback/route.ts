import { NextResponse } from "next/server";

type MissingEnvResponse = {
	error: "missing_env";
	missing: string[];
};

function getRequiredEnv():
	| {
			appUrl: string;
			backendBase: string;
			clientId: string;
			clientSecret: string;
			redirectUri: string;
	  }
	| { error: MissingEnvResponse } {
	const appUrl = process.env.NEXT_PUBLIC_APP_URL;
	const backendBase = process.env.NEXT_PUBLIC_API_BASE_URL;

	const clientId = process.env.GOOGLE_CLIENT_ID;
	const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
	const redirectUri = process.env.GOOGLE_REDIRECT_URI;

	const missing: string[] = [];
	if (!appUrl) missing.push("NEXT_PUBLIC_APP_URL");
	if (!backendBase) missing.push("NEXT_PUBLIC_API_BASE_URL");
	if (!clientId) missing.push("GOOGLE_CLIENT_ID");
	if (!clientSecret) missing.push("GOOGLE_CLIENT_SECRET");
	if (!redirectUri) missing.push("GOOGLE_REDIRECT_URI");

	if (missing.length > 0) {
		return { error: { error: "missing_env", missing } };
	}

	return {
		appUrl,
		backendBase,
		clientId,
		clientSecret,
		redirectUri,
	};
}

export async function GET(req: Request) {
	const url = new URL(req.url);
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	const error = url.searchParams.get("error");

	const env = getRequiredEnv();
	if ("error" in env) {
		return NextResponse.json(env.error, { status: 500 });
	}

	const { appUrl, backendBase, clientId, clientSecret, redirectUri } = env;

	if (error) {
		return NextResponse.redirect(`${appUrl}/auth?error=google_${error}`);
	}
	if (!code) {
		return NextResponse.redirect(`${appUrl}/auth?error=no_code`);
	}

	// (선택이지만 권장) state 체크
	// 카카오 코드엔 없었지만, 구글은 state를 보낸다면 검증하는 게 안전함
	if (state) {
		const cookieState =
			req.headers.get("cookie")?.match(/oauth_state=([^;]+)/)?.[1] ?? null;

		if (!cookieState || cookieState !== state) {
			return NextResponse.redirect(`${appUrl}/auth?error=invalid_state`);
		}
	}

	// 1) Google token 교환
	const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			code,
			client_id: clientId,
			client_secret: clientSecret,
			redirect_uri: redirectUri,
			grant_type: "authorization_code",
		}),
	});

	if (!tokenRes.ok) {
		console.error("Google token error:", await tokenRes.text());
		return NextResponse.redirect(`${appUrl}/auth?error=token_failed`);
	}

	const tokenJson = await tokenRes.json();
	// 백엔드가 id_token 받는 스펙이면 이걸 넘겨
	const idToken = tokenJson.id_token as string | undefined;
	// 백엔드가 access_token 받는 스펙이면 이걸 넘겨
	const googleAccessToken = tokenJson.access_token as string | undefined;

	if (!idToken && !googleAccessToken) {
		return NextResponse.redirect(`${appUrl}/auth?error=missing_google_token`);
	}

	// 2) Google 사용자 정보 조회 (선택)
	// access_token이 있어야 호출 가능
	if (googleAccessToken) {
		const meRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
			headers: { Authorization: `Bearer ${googleAccessToken}` },
		});

		if (!meRes.ok) {
			console.error("Google me error:", await meRes.text());
			return NextResponse.redirect(`${appUrl}/auth?error=me_failed`);
		}

		await meRes.json();
	}

	// 3) 백엔드에 구글 토큰 전달 → 서비스 JWT 발급
	// ✅ 너희 백엔드 스펙에 맞춰 body 키만 맞추면 됨
	// - id_token 기반이면: { id_token: idToken }
	// - access_token 기반이면: { accessToken: googleAccessToken }
	const backendRes = await fetch(`${backendBase}/accounts/login/google/`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			access_token: googleAccessToken,
			// 또는 id_token: idToken (백엔드 스펙에 맞게)
		}),
	});
	if (!backendRes.ok) {
		console.error("Backend social error:", await backendRes.text());
		return NextResponse.redirect(`${appUrl}/auth?error=backend_failed`);
	}

	const data = await backendRes.json();
	const accessToken = (data.token ?? data.access) as string | undefined;
	const refreshToken = (data.refresh ?? data.refresh) as string | undefined;

	if (!accessToken || !refreshToken) {
		return NextResponse.redirect(`${appUrl}/auth?error=missing_app_tokens`);
	}

	const redirect = new URL(`${appUrl}/auth/callback`);
	redirect.searchParams.set("access", accessToken);
	redirect.searchParams.set("refresh", refreshToken);

	const res = NextResponse.redirect(redirect.toString());
	res.cookies.set("oauth_state", "", { path: "/", maxAge: 0 });
	return res;
}
