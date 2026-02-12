"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Auth() {
	const router = useRouter();

	return (
		<main className="min-h-screen flex items-center justify-center">
			<div className="w-full max-w-xl flex flex-col items-center gap-8">
				<header className="text-center space-y-3">
					<h1 className="text-3xl font-bold text-white">
						여러분을 위한 영화 추천 사이트
						<br />
						<span className="text-white">미아릭스</span>
					</h1>
					<p className="text-muted-foreground text-sm leading-relaxed">
						넷플릭스, 라프텔, 영화관까지
						<br />
						당신이 좋아하는 영화의 정보를 제공합니다.
					</p>
				</header>

				<section className="w-full space-y-3">
					<Button
						type="button"
						className="
            w-full h-14
            bg-[#FEE500] text-black
            hover:bg-[#fada0a]
            flex items-center justify-center gap-2
            font-medium text-lg
          "
						onClick={() => {
							window.location.href = "/auth/callback/kakao";
						}}
					>
						<Image
							src="/icons/kakao.svg"
							alt="kakao"
							width={20}
							height={20}
							className="w-5 h-5"
						/>
						카카오 계정으로 로그인
					</Button>

					<Button
						variant="outline"
						type="button"
						className="
            w-full h-14
            border border-[#DADCE0]
            text-[#1F1F1F]
            hover:bg-[#f8f9fa]
            flex items-center justify-center gap-2
            font-medium text-lg
          "
						onClick={() => {
							window.location.href = "/auth/callback/google";
						}}
					>
						<Image
							src="/icons/google.svg"
							alt="google"
							width={20}
							height={20}
							className="w-5 h-5"
						/>
						Google 계정으로 로그인
					</Button>

					<Button
						variant="outline"
						type="button"
						className="w-full h-15 text-lg"
						onClick={() => router.push("/auth/login")}
					>
						일반 계정으로 로그인
					</Button>
				</section>

				<section className="flex gap-4 text-sm">
					<Button
						variant="outline"
						size="sm"
						onClick={() => router.push("/auth/signup")}
					>
						회원가입하기
					</Button>
					<Button variant="outline" size="sm">
						아이디/ 비번 찾기
					</Button>
				</section>
			</div>
		</main>
	);
}
