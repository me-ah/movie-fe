import { NextResponse } from "next/server";

export async function GET(req: Request) {
	const url = new URL(req.url);
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	const error = url.searchParams.get("error");

	if (error) {
		return NextResponse.redirect(
			`${process.env.NEXT_PUBLIC_APP_URL}/auth?error=google_${error}`,
		);
	}
	if (!code || !state) {
		return NextResponse.redirect(
			`${process.env.NEXT_PUBLIC_APP_URL}/auth?error=no_code_or_state`,
		);
	}

	// state 체크
	const cookieState =
		req.headers.get("cookie")?.match(/oauth_state=([^;]+)/)?.[1] ?? null;
	if (!cookieState || cookieState !== state) {
		return NextResponse.redirect(
			`${process.env.NEXT_PUBLIC_APP_URL}/auth?error=invalid_state`,
		);
	}

	const clientId = process.env.GOOGLE_CLIENT_ID!;
	const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
	const redirectUri = process.env.GOOGLE_REDIRECT_URI!;

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
		return NextResponse.redirect(
			`${process.env.NEXT_PUBLIC_APP_URL}/auth?error=google_token_failed`,
		);
	}

	const tokenJson = await tokenRes.json();
	const idToken = tokenJson.id_token as string | undefined;

	if (!idToken) {
		return NextResponse.redirect(
			`${process.env.NEXT_PUBLIC_APP_URL}/auth?error=no_id_token`,
		);
	}

	// 2) 우리 백엔드에 전달 → 우리 JWT 발급 받기
	// 백엔드 엔드포인트는 예시야. 너희 서버 스펙에 맞춰 경로/바디 키만 바꾸면 됨.
	const backendRes = await fetch(
		`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id_token: idToken }),
		},
	);

	if (!backendRes.ok) {
		return NextResponse.redirect(
			`${process.env.NEXT_PUBLIC_APP_URL}/auth?error=backend_auth_failed`,
		);
	}

	const backendJson = await backendRes.json();
	const access = backendJson.accessToken ?? backendJson.access;
	const refresh = backendJson.refreshToken ?? backendJson.refresh;

	if (!access) {
		return NextResponse.redirect(
			`${process.env.NEXT_PUBLIC_APP_URL}/auth?error=no_app_token`,
		);
	}

	// 3) 쿠키로 저장(권장: httpOnly)
	const res = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/`);

	res.cookies.set("accessToken", access, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: 60 * 30,
	});

	if (refresh) {
		res.cookies.set("refreshToken", refresh, {
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			path: "/",
			maxAge: 60 * 60 * 24 * 14,
		});
	}

	// state 쿠키 정리
	res.cookies.set("oauth_state", "", { path: "/", maxAge: 0 });

	return res;
}
