"use client";

import { Film, Home, Shield, SquarePlay, User, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getIsSuperUser } from "@/lib/userStorage";
import { cn } from "@/lib/utils";

const items = [
	{ title: "홈", url: "/home", icon: Home },
	{ title: "쇼츠", url: "/short", icon: SquarePlay },
	{ title: "커뮤니티", url: "/community", icon: Users },
];

export function Sidebar() {
	const pathname = usePathname();
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		const admin = getIsSuperUser();
		setIsAdmin(admin);
	}, []);

	return (
		<aside className="fixed left-0 top-0 z-50 flex h-screen w-20 flex-col items-center border-r border-white/10 bg-[#0A0B10] py-6">
			<div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-[#3B66FF] to-[#2451E5] shadow-lg">
				<Film className="size-8 text-white" />
			</div>

			{/* 상단 메뉴 */}
			<nav className="flex flex-1 flex-col items-center gap-4">
				{items.map((item) => {
					const isActive = pathname === item.url;
					return (
						<Link
							key={item.title}
							href={item.url}
							className={cn(
								"flex w-14 flex-col items-center gap-1 rounded-2xl py-3 transition-all",
								isActive
									? "bg-gradient-to-b from-[#3B66FF] to-[#2451E5] text-white shadow-md"
									: "text-gray-400 hover:bg-white/10 hover:text-white",
							)}
						>
							<item.icon className="!size-6" />
							<span className="text-[12px] font-medium mt-1">{item.title}</span>
						</Link>
					);
				})}
			</nav>

			{/* 하단 메뉴 */}
			<div className="mt-auto flex flex-col items-center gap-2">
				{/* ✅ 관리자만 표시 */}
				{isAdmin && (
					<Link
						href="/admin"
						className={cn(
							"flex w-14 flex-col items-center gap-1 rounded-2xl py-3 transition-all",
							pathname === "/admin"
								? "bg-gradient-to-b from-[#3B66FF] to-[#2451E5] text-white shadow-md"
								: "text-gray-400 hover:bg-white/10 hover:text-white",
						)}
					>
						<Shield className="!size-6" />
						<span className="text-[12px] font-medium mt-1">관리자</span>
					</Link>
				)}

				{/* 마이페이지는 항상 표시 */}
				<Link
					href="/auth/mypage"
					className={cn(
						"flex w-14 flex-col items-center gap-1 rounded-2xl py-3 transition-all",
						pathname === "/auth/mypage"
							? "bg-gradient-to-b from-[#3B66FF] to-[#2451E5] text-white shadow-md"
							: "text-gray-400 hover:bg-white/10 hover:text-white",
					)}
				>
					<User className="!size-6" />
					<span className="text-[12px] font-medium mt-1">마이</span>
				</Link>
			</div>
		</aside>
	);
}
