"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setTokens } from "@/lib/tokenStorage";
import { ArrowLeft } from "lucide-react";

export default function Login() {
	const router = useRouter();

	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleLogin = async () => {
		if (!username || !password) {
			setError("이메일과 비밀번호를 입력해주세요.");
			return;
		}

		try {
			setLoading(true);
			setError(null);

			const { accessToken, refreshToken } = await login(username, password);

			setTokens(accessToken, refreshToken);
			router.push("/");
		} catch (err: unknown) {
			console.error("Login failed:", err);
			setError("로그인에 실패했습니다. 정보를 확인해주세요.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
			<div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.6)] p-8">
				<Button
					className="absolute left-6 top-6 text-white-800  "
					variant="ghost"
					onClick={() => router.back()}
				>
					<ArrowLeft className="!w-8 !h-8" />
				</Button>
				
				<h1 className="text-center text-2xl font-semibold mb-8">미아릭스</h1>

				<div className="space-y-4">
					<Input
						type="text"
						placeholder="아이디"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						disabled={loading}
						className="h-12 rounded-xl bg-zinc-800/60 border-zinc-700"
					/>

					<Input
						type="password"
						placeholder="비밀번호"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						disabled={loading}
						className="h-12 rounded-xl bg-zinc-800/60 border-zinc-700"
					/>

					{error && <p className="text-sm text-red-400">{error}</p>}

					<Button
						onClick={handleLogin}
						disabled={loading}
						className="h-12 w-full rounded-xl bg-blue-500 hover:bg-blue-600"
					>
						{loading ? "로그인 중..." : "로그인"}
					</Button>
				</div>
				{/* 
				<div className="my-6 flex items-center gap-4">
					<div className="h-px flex-1 bg-zinc-700/70" />
					<span className="text-xs text-zinc-400">다른 계정으로 로그인</span>
					<div className="h-px flex-1 bg-zinc-700/70" />
				</div> */}

				<div className="mt-6 text-center text-sm text-zinc-400">
					계정이 없으신가요? 바로 가입하세요!{" "}
					<Link
						href="/auth/signup"
						className="text-blue-400 hover:text-blue-300 underline underline-offset-4"
					>
						무료 회원가입
					</Link>
				</div>
			</div>
		</div>
	);
}
