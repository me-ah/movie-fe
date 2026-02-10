import { NextResponse } from "next/server";

export async function GET() {
	const clientId = process.env.GOOGLE_CLIENT_ID!;
	const redirectUri = process.env.GOOGLE_REDIRECT_URI!;

	// CSRF 방지용 state (간단 버전)
	const state = crypto.randomUUID();

	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: redirectUri,
		response_type: "code",
		scope: "openid email profile",
		access_type: "offline",
		prompt: "consent",
		state,
	});

	const res = NextResponse.redirect(
		`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
	);

	// state 저장(쿠키)
	res.cookies.set("oauth_state", state, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: 60 * 10,
	});

	return res;
}
