"use client";

import { useEffect, useMemo, useState } from "react";
import { type AdminUserItem, getAdminUserList } from "@/api/admin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Member = {
	no: number;
	username: string;
	name: string;
	joinedAt: string;
	role: "관리자" | "일반";
	active: boolean;
};

function StatusBadge({ active }: { active: boolean }) {
	return (
		<span
			className={[
				"inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border",
				active
					? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
					: "bg-rose-500/15 text-rose-300 border-rose-500/30",
			].join(" ")}
		>
			{active ? "ON" : "OFF"}
		</span>
	);
}

function RoleBadge({ role }: { role: Member["role"] }) {
	return (
		<span
			className={[
				"inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border",
				role === "관리자"
					? "bg-blue-500/15 text-blue-300 border-blue-500/30"
					: "bg-zinc-700/40 text-zinc-200 border-zinc-700",
			].join(" ")}
		>
			{role}
		</span>
	);
}

export default function MembersPanel() {
	const [page, setPage] = useState(1);
	const pageSize = 10;

	const [rawUsers, setRawUsers] = useState<AdminUserItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;

		async function fetchUsers() {
			setLoading(true);
			setErr(null);
			try {
				const data = await getAdminUserList(); // ✅ 배열로 옴
				if (!mounted) return;
				setRawUsers(Array.isArray(data) ? data : []);
			} catch {
				if (!mounted) return;
				setErr("회원 목록을 불러오지 못했습니다.");
			} finally {
				if (mounted) {
					setLoading(false);
				}
			}
		}

		fetchUsers();
		return () => {
			mounted = false;
		};
	}, []);

	const totalPages = useMemo(() => {
		return Math.max(1, Math.ceil(rawUsers.length / pageSize));
	}, [rawUsers.length]);

	const members: Member[] = useMemo(() => {
		const start = (page - 1) * pageSize;
		const sliced = rawUsers.slice(start, start + pageSize);

		return sliced.map((u, idx) => {
			const fullName = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
			const joinedAt = (u.date_joined ?? "").slice(0, 10) || "-";

			const role: Member["role"] = u.is_staff ? "관리자" : "일반";
			const active = u.is_active;

			return {
				no: start + idx + 1,
				username: u.username,
				name: fullName || u.username,
				joinedAt,
				role,
				active,
			};
		});
	}, [rawUsers, page]);

	return (
		<>
			<header className="mb-5">
				<h1 className="text-3xl font-semibold tracking-tight">회원정보 관리</h1>
				<p className="mt-2 text-sm text-zinc-400">
					회원 목록을 확인하고 상태를 관리합니다.
				</p>
			</header>

			<Card className="border border-zinc-800 bg-zinc-900/30">
				{/* header row */}
				<div className="border-b border-zinc-800 px-5 py-4">
					<div className="flex items-center justify-between">
						<div className="text-sm font-medium text-zinc-200">
							회원 목록{" "}
							<span className="ml-2 text-xs text-zinc-500">
								총 {rawUsers.length}명
							</span>
						</div>

						<div className="flex items-center gap-2">
							<Button className="bg-blue-500 hover:bg-blue-600">
								회원 추가
							</Button>
						</div>
					</div>
				</div>

				{err && <div className="px-6 py-4 text-sm text-rose-300">{err}</div>}

				{/* table */}
				<div className="overflow-x-auto">
					<table className="w-full min-w-[760px]">
						<thead>
							<tr className="bg-zinc-950/40">
								<th className="px-6 py-3 text-left text-xs font-medium text-zinc-400">
									번호
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-zinc-400">
									아이디
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-zinc-400">
									이름
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-zinc-400">
									가입일
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-zinc-400">
									권한
								</th>
								<th className="px-6 py-3 text-right text-xs font-medium text-zinc-400">
									상태
								</th>
							</tr>
						</thead>

						<tbody>
							{loading ? (
								<tr>
									<td
										colSpan={6}
										className="px-6 py-10 text-center text-sm text-zinc-400"
									>
										불러오는 중...
									</td>
								</tr>
							) : members.length === 0 ? (
								<tr>
									<td
										colSpan={6}
										className="px-6 py-10 text-center text-sm text-zinc-400"
									>
										회원이 없습니다.
									</td>
								</tr>
							) : (
								members.map((m) => (
									<tr
										key={`${m.username}-${m.no}`}
										className="border-t border-zinc-800/80 hover:bg-zinc-950/30"
									>
										<td className="px-6 py-4 text-sm text-zinc-200">{m.no}</td>
										<td className="px-6 py-4 text-sm text-zinc-200">
											{m.username}
										</td>
										<td className="px-6 py-4 text-sm text-zinc-200">
											{m.name}
										</td>
										<td className="px-6 py-4 text-sm text-zinc-300">
											{m.joinedAt}
										</td>
										<td className="px-6 py-4">
											<RoleBadge role={m.role} />
										</td>
										<td className="px-6 py-4 text-right">
											<div className="inline-flex items-center gap-2">
												<StatusBadge active={m.active} />
												<Button
													variant="ghost"
													size="sm"
													className="text-zinc-300 hover:text-zinc-100"
												>
													관리
												</Button>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* pagination */}
				<div className="flex items-center justify-center gap-2 border-t border-zinc-800 px-5 py-4">
					<Button
						variant="secondary"
						className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200"
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={page <= 1 || loading}
					>
						이전
					</Button>

					<Button
						type="button"
						variant="secondary"
						className="h-8 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-200"
						disabled
					>
						{page} / {totalPages}
					</Button>

					<Button
						variant="secondary"
						className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200"
						onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
						disabled={page >= totalPages || loading}
					>
						다음
					</Button>
				</div>
			</Card>
		</>
	);
}
