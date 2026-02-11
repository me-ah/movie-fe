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
			clientSecret?: string;
			redirectUri: string;
	  }
	| { error: MissingEnvResponse } {
	const appUrl = process.env.NEXT_PUBLIC_APP_URL;
	const backendBase = process.env.NEXT_PUBLIC_API_BASE_URL;
	const clientId = process.env.KAKAO_REST_API_KEY;
	const clientSecret = process.env.KAKAO_CLIENT_SECRET;
	const redirectUri = process.env.KAKAO_REDIRECT_URI;
	const missing: string[] = [];

	if (!appUrl) missing.push("NEXT_PUBLIC_APP_URL");
	if (!backendBase) missing.push("NEXT_PUBLIC_API_BASE_URL");
	if (!clientId) missing.push("KAKAO_REST_API_KEY");
	if (!redirectUri) missing.push("KAKAO_REDIRECT_URI");

	if (missing.length > 0) {
		return { error: { error: "missing_env", missing } };
	}

	return {
		appUrl,
		backendBase,
		clientId,
		clientSecret: clientSecret || undefined,
		redirectUri,
	};
}

export async function GET(req: Request) {
	const url = new URL(req.url);
	const code = url.searchParams.get("code");
	const error = url.searchParams.get("error");

	const env = getRequiredEnv();
	if ("error" in env) {
		return NextResponse.json(env.error, { status: 500 });
	}

	const { appUrl, backendBase, clientId, clientSecret, redirectUri } = env;

	if (error) {
		return NextResponse.redirect(`${appUrl}/auth?error=kakao_${error}`);
	}
	if (!code) {
		return NextResponse.redirect(`${appUrl}/auth?error=no_code`);
	}

	// 1) 카카오 토큰 교환
	const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
		},
		body: new URLSearchParams({
			grant_type: "authorization_code",
			client_id: clientId,
			redirect_uri: redirectUri,
			code,
			...(clientSecret ? { client_secret: clientSecret } : {}),
		}),
	});

	if (!tokenRes.ok) {
		const text = await tokenRes.text();
		console.error("Kakao token error:", tokenRes.status, text);
		return NextResponse.redirect(`${appUrl}/auth?error=token_failed`);
	}

	const tokenJson = await tokenRes.json();
	const kakaoAccessToken = tokenJson.access_token as string | undefined;

	if (!kakaoAccessToken) {
		return NextResponse.redirect(`${appUrl}/auth?error=missing_kakao_token`);
	}

	// 2) 카카오 사용자 정보 조회 (선택)
	const meRes = await fetch("https://kapi.kakao.com/v2/user/me", {
		headers: { Authorization: `Bearer ${kakaoAccessToken}` },
	});
	if (!meRes.ok) {
		console.error("Kakao me error:", await meRes.text());
		return NextResponse.redirect(`${appUrl}/auth?error=me_failed`);
	}
	const me = await meRes.json();

	// 3) 백엔드에 카카오 토큰 전달 → 서비스 JWT 발급
	const backendRes = await fetch(`${backendBase}/accounts/login/kakao/`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			access_token: kakaoAccessToken,
			kakaoId: me?.id,
			email: me?.kakao_account?.email,
			nickname: me?.kakao_account?.profile?.nickname,
		}),
	});
	console.log(backendRes);
	if (!backendRes.ok) {
		console.error("Backend social error:", await backendRes.text());
		return NextResponse.redirect(`${appUrl}/auth?error=backend_failed`);
	}

	const data = await backendRes.json();
	const accessToken = data.token as string | undefined;
	const refreshToken = data.refresh as string | undefined;

	if (!accessToken || !refreshToken) {
		return NextResponse.redirect(`${appUrl}/auth?error=missing_app_tokens`);
	}

	// 4) 프론트 콜백 페이지로 이동하여 토큰 저장
	const redirect = new URL(`${appUrl}/auth/callback`);
	redirect.searchParams.set("access", accessToken);
	redirect.searchParams.set("refresh", refreshToken);

	return NextResponse.redirect(redirect.toString());
}
