"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { setTokens } from "@/lib/tokenStorage";

export default function AuthCallbackClient() {
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
