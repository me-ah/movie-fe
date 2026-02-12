"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type AdminUserDetail, getAdminUserDetail } from "@/api/admin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function DetailRow({
	label,
	value,
}: {
	label: string;
	value: React.ReactNode;
}) {
	return (
		<div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4 border-b border-zinc-800 last:border-0">
			<dt className="font-medium text-zinc-400">{label}</dt>
			<dd className="text-zinc-100 sm:col-span-2">{value ?? "-"}</dd>
		</div>
	);
}

function BoolBadge({ value }: { value: boolean }) {
	return (
		<span
			className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
				value
					? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
					: "bg-zinc-700/40 text-zinc-400 border border-zinc-700"
			}`}
		>
			{value ? "Yes" : "No"}
		</span>
	);
}

export default function UserDetailPage() {
	const router = useRouter();
	const params = useParams();
	const idStr = String(params?.id || "");
	const id = parseInt(idStr, 10);

	const [user, setUser] = useState<AdminUserDetail | null>(null);
	const [loading, setLoading] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	useEffect(() => {
		if (!id) return;

		let mounted = true;
		async function fetchData() {
			setLoading(true);
			try {
				const data = await getAdminUserDetail(id);
				if (mounted) setUser(data);
			} catch {
				if (mounted) setErr("사용자 정보를 불러오지 못했습니다.");
			} finally {
				if (mounted) setLoading(false);
			}
		}

		fetchData();
		return () => {
			mounted = false;
		};
	}, [id]);

	if (!id) return <div className="p-10 text-zinc-400">잘못된 접근입니다.</div>;
	if (loading && !user)
		return <div className="p-10 text-zinc-400">로딩 중...</div>;
	if (err) return <div className="p-10 text-rose-400">{err}</div>;
	if (!user) return null;

	const prefKeys = Object.keys(user).filter((k) =>
		k.startsWith("pref_"),
	) as (keyof AdminUserDetail)[];

	return (
		<div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 sm:p-10">
			<div className="mx-auto max-w-4xl">
				<header className="mb-6 flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-semibold tracking-tight">
							사용자 상세 정보
						</h1>
						<p className="mt-1 text-sm text-zinc-400">
							ID: {user.id} / {user.username}
						</p>
					</div>
					<Button
						variant="outline"
						onClick={() => router.back()}
						className="border-zinc-700 hover:bg-zinc-800 text-zinc-300"
					>
						목록으로
					</Button>
				</header>

				<div className="grid gap-6">
					{/* 기본 정보 */}
					<Card className="border border-zinc-800 bg-zinc-900/30 p-6">
						<h2 className="mb-4 text-lg font-medium border-b border-zinc-800 pb-2">
							기본 프로필
						</h2>
						<div className="text-sm">
							<DetailRow label="Username" value={user.username} />
							<DetailRow label="Email" value={user.email} />
							<DetailRow
								label="이름"
								value={`${user.last_name}${user.first_name}`}
							/>
							<DetailRow label="가입일" value={user.date_joined} />
							<DetailRow label="마지막 로그인" value={user.last_login} />
							<DetailRow label="가입 유형" value={user.login_type} />
						</div>
					</Card>

					{/* 권한 및 상태 */}
					<Card className="border border-zinc-800 bg-zinc-900/30 p-6">
						<h2 className="mb-4 text-lg font-medium border-b border-zinc-800 pb-2">
							권한 및 상태
						</h2>
						<div className="text-sm">
							<DetailRow
								label="관리자 여부 (Staff)"
								value={<BoolBadge value={user.is_staff} />}
							/>
							<DetailRow
								label="슈퍼유저 여부"
								value={<BoolBadge value={user.is_superuser} />}
							/>
							<DetailRow
								label="활성 상태 (Active)"
								value={<BoolBadge value={user.is_active} />}
							/>
							<DetailRow
								label="온보딩 완료"
								value={<BoolBadge value={user.is_onboarding_completed} />}
							/>
						</div>
					</Card>

					{/* 선호 장르 점수 */}
					<Card className="border border-zinc-800 bg-zinc-900/30 p-6">
						<h2 className="mb-4 text-lg font-medium border-b border-zinc-800 pb-2">
							선호 장르 (Preferences)
						</h2>
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
							{prefKeys.map((key) => {
								const genreName = key
									.replace("pref_", "")
									.replace("_", " ")
									.toUpperCase();
								const val = user[key] as number;
								return (
									<div
										key={key}
										className="bg-zinc-950/50 rounded p-3 border border-zinc-800"
									>
										<div className="text-xs text-zinc-500 mb-1">
											{genreName}
										</div>
										<div className="font-mono text-lg font-semibold text-zinc-200">
											{val}
										</div>
									</div>
								);
							})}
						</div>
					</Card>
				</div>
			</div>
		</div>
	);
}
