import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const backendBase = process.env.NEXT_PUBLIC_API_BASE_URL!;

  if (error) return NextResponse.redirect(`${appUrl}/auth?error=kakao_${error}`);
  if (!code) return NextResponse.redirect(`${appUrl}/auth?error=no_code`);

  const clientId = process.env.KAKAO_REST_API_KEY!;
  const clientSecret = process.env.KAKAO_CLIENT_SECRET;
  const redirectUri = process.env.KAKAO_REDIRECT_URI!;

  // 1) 카카오 토큰 교환
  const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      redirect_uri: redirectUri,
      code,
      ...(clientSecret ? { client_secret: clientSecret } : {}),
    }),
  });

  if (!tokenRes.ok) {
    console.error("Kakao token error:", await tokenRes.text());
    return NextResponse.redirect(`${appUrl}/auth?error=token_failed`);
  }

  const tokenJson = await tokenRes.json();
  const kakaoAccessToken = tokenJson.access_token as string;

  // 2) (선택) 카카오 me 조회 (디버깅/추가정보용)
  const meRes = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${kakaoAccessToken}` },
  });
  if (!meRes.ok) {
    console.error("Kakao me error:", await meRes.text());
    return NextResponse.redirect(`${appUrl}/auth?error=me_failed`);
  }
  const me = await meRes.json(); // 필요 없으면 삭제해도 됨

  // 3) ✅ 우리 백엔드에 “카카오 로그인” 요청 → 우리 JWT 발급받기
  // 백엔드가 kakaoAccessToken으로 검증하고 access/refreshToken을 내려준다고 가정
  const backendRes = await fetch(`${backendBase}/auth/social/kakao`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kakaoAccessToken,
      // 필요하면 같이 보내기 (백엔드 구현에 맞춰 선택)
      kakaoId: me?.id,
      email: me?.kakao_account?.email,
      nickname: me?.kakao_account?.profile?.nickname,
    }),
  });

  if (!backendRes.ok) {
    console.error("Backend social error:", await backendRes.text());
    return NextResponse.redirect(`${appUrl}/auth?error=backend_failed`);
  }

  const data = await backendRes.json();
  const accessToken = data.accessToken as string;
  const refreshToken = data.refreshToken as string;

  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(`${appUrl}/auth?error=missing_app_tokens`);
  }

  // 4) 프론트 콜백 페이지로 토큰 전달(임시) → 프론트에서 tokenStorage 저장
  const redirect = new URL(`${appUrl}/auth/callback`);
  redirect.searchParams.set("access", accessToken);
  redirect.searchParams.set("refresh", refreshToken);

  return NextResponse.redirect(redirect.toString());
}
