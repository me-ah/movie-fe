"use client";

import type React from "react";
import { Card } from "@/components/ui/card";

type Props = {
	icon: React.ReactNode;
	label: string;
	value: string;
};

export default function StatCard({ icon, label, value }: Props) {
	return (
		<Card className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
			<div className="flex items-center gap-3 text-zinc-300">
				<div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-950/40 ring-1 ring-zinc-800">
					{icon}
				</div>
				<div className="text-lg">{label}</div>
			</div>

			<div className="mt-4 text-4xl font-semibold tracking-tight text-zinc-300">
				{value}
			</div>
		</Card>
	);
}
