import "@/styles/global.css";
import { Toaster } from "@/components/ui/toaster";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ko">
			<body className="bg-zinc-950 text-zinc-100 antialiased">
				{children}
				<Toaster />
			</body>
		</html>
	);
}
