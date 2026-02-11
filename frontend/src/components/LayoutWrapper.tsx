"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

const HIDDEN_SIDEBAR_PATHS = ["/auth/login", "/auth/signup", "/auth"];

export function LayoutWrapper({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const isSidebarHidden = HIDDEN_SIDEBAR_PATHS.includes(pathname);

	if (isSidebarHidden) {
		return <main className="w-full">{children}</main>;
	}

	return (
		<>
			<Sidebar />
			<main className="w-full pl-20">{children}</main>
		</>
	);
}
