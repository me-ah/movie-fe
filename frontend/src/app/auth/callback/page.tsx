"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setTokens } from "@/lib/tokenStorage"; // 너 경로에 맞게

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const access = params.get("access");
    const refresh = params.get("refresh");

    if (access && refresh) {
      setTokens(access, refresh);

      router.replace("/");
      return;
    }

    router.replace("/auth?error=missing_tokens");
  }, [params, router]);

  return null;
}
