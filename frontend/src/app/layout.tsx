import type { ReactNode } from "react";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import "@/styles/global.css";

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="ko">
			<body className="bg-black">
				<LayoutWrapper>{children}</LayoutWrapper>
			</body>
		</html>
	);
}
