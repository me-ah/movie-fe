import type { ReactNode } from "react";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import "@/styles/global.css";
import { Toaster } from "@/components/ui/toaster";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ko">
			<body className="bg-black">
				<LayoutWrapper>{children}</LayoutWrapper>
			</body>
		</html>
	);
}
