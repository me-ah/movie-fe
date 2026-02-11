"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { setTokens } from "@/lib/tokenStorage";
import { setUser } from "@/lib/userStorage";

export default function AuthCallbackClient() {
	const router = useRouter();
	const sp = useSearchParams();

	useEffect(() => {
		const access = sp.get("access");
		const refresh = sp.get("refresh");
		const userId = sp.get("userid");

		if (!access || !refresh) {
			router.replace("/auth?error=missing_app_tokens");
			return;
		}

		console.log(userId);
		console.log("12345678");
		setTokens(access, refresh);
		setUser({ user_id: userId });

		router.replace("/");
	}, [router, sp]);

	return <div className="p-6 text-zinc-400">로그인 처리 중...</div>;
}
