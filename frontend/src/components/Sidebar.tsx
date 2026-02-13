"use client";

import { Film, Home, SquarePlay, User, Users, Shield  } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
	{
		title: "홈",
		url: "/home",
		icon: Home,
	},
	{
		title: "쇼츠",
		url: "/short",
		icon: SquarePlay,
	},
	{
		title: "커뮤니티",
		url: "/community",
		icon: Users,
	},
];

const footerItems = [
	{
		title: "관리자",
		url: "/admin",
		icon: Shield,
	},
	{
		title: "마이",
		url: "/auth/mypage",
		icon: User,
	},
];

export function Sidebar() {
	const pathname = usePathname();

	return (
		<aside className="fixed left-0 top-0 z-50 flex h-screen w-20 flex-col items-center border-r border-white/10 bg-[#0A0B10] py-6">
			<div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-[#3B66FF] to-[#2451E5] shadow-lg">
				<Film className="size-8 text-white" />
			</div>

			<nav className="flex flex-1 flex-col items-center gap-4">
				{items.map((item) => {
					const isActive = pathname === item.url;
					return (
						<Link
							key={item.title}
							href={item.url}
							className={cn(
								"flex h-auto w-14 flex-col items-center gap-1 rounded-2xl py-3 transition-all",
								isActive
									? "bg-gradient-to-b from-[#3B66FF] to-[#2451E5] text-white shadow-md hover:bg-gradient-to-b hover:from-[#3B66FF] hover:to-[#2451E5] hover:text-white"
									: "text-gray-400 hover:bg-white/10 hover:text-white",
							)}
						>
							<item.icon className="!size-6" />
							<span className="text-[12px] font-medium mt-1">{item.title}</span>
						</Link>
					);
				})}
			</nav>

			<div className="mt-auto flex flex-col items-center">
				{footerItems.map((item) => {
					const isActive = pathname === item.url;
					return (
						<Link
							key={item.title}
							href={item.url}
							className={cn(
								"flex h-auto w-14 flex-col items-center gap-1 rounded-2xl py-3 transition-all",
								isActive
									? "bg-gradient-to-b from-[#3B66FF] to-[#2451E5] text-white shadow-md hover:bg-gradient-to-b hover:from-[#3B66FF] hover:to-[#2451E5] hover:text-white"
									: "text-gray-400 hover:bg-white/10 hover:text-white",
							)}
						>
							<item.icon className="!size-6" />
							<span className="text-[12px] font-medium mt-1">{item.title}</span>
						</Link>
					);
				})}
			</div>
		</aside>
	);
}
