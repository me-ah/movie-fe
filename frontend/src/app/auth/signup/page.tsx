"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignUp() {
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [passwordConfirm, setPasswordConfirm] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");

	return (
		<div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
			{/* 카드 */}
			<div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.6)] p-8">
				{/* 타이틀 */}
				<h1 className="text-center text-2xl font-semibold mb-8">회원가입</h1>

				{/* 입력 폼 */}
				<div className="space-y-4">
					<Input
						type="text"
						placeholder="아이디"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						className="h-12 rounded-xl bg-zinc-800/60 border-zinc-700"
					/>

					<Input
						type="email"
						placeholder="이메일"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="h-12 rounded-xl bg-zinc-800/60 border-zinc-700"
					/>

					<Input
						type="password"
						placeholder="비밀번호"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="h-12 rounded-xl bg-zinc-800/60 border-zinc-700"
					/>

					<Input
						type="password"
						placeholder="비밀번호 확인"
						value={passwordConfirm}
						onChange={(e) => setPasswordConfirm(e.target.value)}
						className="h-12 rounded-xl bg-zinc-800/60 border-zinc-700"
					/>

					<div className="grid grid-cols-2 gap-4">
						<Input
							type="text"
							placeholder="이름"
							value={firstName}
							onChange={(e) => setFirstName(e.target.value)}
							className="h-12 rounded-xl bg-zinc-800/60 border-zinc-700"
						/>
						<Input
							type="text"
							placeholder="성"
							value={lastName}
							onChange={(e) => setLastName(e.target.value)}
							className="h-12 rounded-xl bg-zinc-800/60 border-zinc-700"
						/>
					</div>

					<Button className="h-12 w-full rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium">
						회원가입
					</Button>
				</div>

				{/* 하단 링크 */}
				<div className="mt-6 text-center text-sm text-zinc-400">
					이미 계정이 있으신가요?{" "}
					<Link
						href="/auth/login"
						className="text-blue-400 hover:text-blue-300 underline underline-offset-4"
					>
						로그인
					</Link>
				</div>
			</div>
		</div>
	);
}
