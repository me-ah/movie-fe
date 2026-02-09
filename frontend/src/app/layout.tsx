import type { ReactNode } from "react";
import "@/styles/global.css";

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="ko">
			<body className="bg-black">{children}</body>
		</html>
	);
}
