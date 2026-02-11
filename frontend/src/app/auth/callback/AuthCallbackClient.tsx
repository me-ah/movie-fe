"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { setTokens } from "@/lib/tokenStorage";

export default function AuthCallbackClient() {
	const router = useRouter();
	const sp = useSearchParams();

	useEffect(() => {
		const access = sp.get("access");
		const refresh = sp.get("refresh");

		if (!access || !refresh) {
			router.replace("/auth?error=missing_app_tokens");
			return;
		}

		setTokens(access, refresh);

		router.replace("/");
	}, [router, sp]);

	return <div className="p-6 text-zinc-400">로그인 처리 중...</div>;
}
