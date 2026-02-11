"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { setTokens } from "@/lib/tokenStorage";
import { setUser } from "@/lib/userStorage";

export default function AuthCallbackClient() {
	const router = useRouter();
	const sp = useSearchParams();

	useEffect(() => {
		const run = async () => {
			const access = sp.get("access");
			const refresh = sp.get("refresh");
			const userId = sp.get("userid");
			const isonboarding = sp.get("isonboarding");

			if (!access || !refresh) {
				router.replace("/auth?error=missing_app_tokens");
				return;
			}

			setTokens(access, refresh);
			setUser({ user_id: userId });

			if (isonboarding === "true") {
				router.push("/home");
			} else {
				router.push("/auth/onboarding");
			}
		};

		run();
	}, [router, sp]);

	return <div className="p-6 text-zinc-400">로그인 처리 중...</div>;
}
