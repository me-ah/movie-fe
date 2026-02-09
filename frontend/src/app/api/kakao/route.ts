import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.KAKAO_REST_API_KEY!;
  const redirectUri = process.env.KAKAO_REDIRECT_URI!;

  const state = crypto.randomUUID();

  const authorizeUrl = new URL("https://kauth.kakao.com/oauth/authorize");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", state);

  return NextResponse.redirect(authorizeUrl.toString());
}
