"use client";

import { Bell, Clock, Heart, Settings, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type MyPageUser = {
	name: string;
	email: string;
	avatarUrl?: string | null;
	badgeText?: string | null;
	isAdmin: boolean;
	stats: {
		watchHours: number;
		myListCount: number;
		followingSeries: number;
	};
};

type UpdateMePayload = {
	name: string;
	email: string;
	avatarUrl?: string | null;
};

export default function MyPage() {
	const [user, setUser] = useState<MyPageUser | null>(null);

	// Settings modal state
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [editName, setEditName] = useState("");
	const [editEmail, setEditEmail] = useState("");
	const [editAvatarUrl, setEditAvatarUrl] = useState("");
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		const load = async () => {
			try {
				const res = await fetch("/me", { credentials: "include" });
				if (!res.ok) throw new Error("Failed to load user");

				const data = await res.json();

				if (!cancelled) {
					const name = data?.name ?? "Unknown";
					setUser({
						name,
						email: data?.email ?? "",
						avatarUrl: data?.avatarUrl ?? null,
						badgeText:
							data?.badgeText ?? name.slice(0, 2).toUpperCase() ?? "ME",
						isAdmin: Boolean(data?.isAdmin),
						stats: {
							watchHours: Number(data?.stats?.watchHours ?? 0),
							myListCount: Number(data?.stats?.myListCount ?? 0),
							followingSeries: Number(data?.stats?.followingSeries ?? 0),
						},
					});
				}
			} catch {
				if (!cancelled) {
					setUser({
						name: "Unknown",
						email: "",
						avatarUrl: null,
						badgeText: "ME",
						isAdmin: false,
						stats: { watchHours: 0, myListCount: 0, followingSeries: 0 },
					});
				}
			}
		};

		load();
		return () => {
			cancelled = true;
		};
	}, []);

	const userView = useMemo<MyPageUser>(
		() =>
			user ?? {
				name: "Loading...",
				email: "",
				avatarUrl: null,
				badgeText: "LD",
				isAdmin: false,
				stats: { watchHours: 0, myListCount: 0, followingSeries: 0 },
			},
		[user],
	);

	// 모달 열 때 현재 값 채우기
	const openSettings = () => {
		setSaveError(null);
		setEditName(userView.name === "Loading..." ? "" : userView.name);
		setEditEmail(userView.email);
		setEditAvatarUrl(userView.avatarUrl ?? "");
		setSettingsOpen(true);
	};

	const handleSaveSettings = async () => {
		if (!editName.trim() || !editEmail.trim()) {
			setSaveError("이름과 이메일은 필수입니다.");
			return;
		}

		try {
			setSaving(true);
			setSaveError(null);

			// TODO: 백엔드에 맞게 PUT/PATCH + 엔드포인트 수정
			const payload: UpdateMePayload = {
				name: editName.trim(),
				email: editEmail.trim(),
				avatarUrl: editAvatarUrl.trim() ? editAvatarUrl.trim() : null,
			};

			const res = await fetch("/me", {
				method: "PATCH", // 서버가 PUT이면 PUT으로 변경
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(payload),
			});

			if (!res.ok) throw new Error("Failed to save");

			// 서버가 업데이트된 유저를 반환한다면 그걸 쓰고,
			// 아니면 로컬 state만 갱신해도 됨.
			const saved = await res.json().catch(() => null);

			setUser((prev) => {
				const nextName = saved?.name ?? payload.name;
				const nextEmail = saved?.email ?? payload.email;
				const nextAvatar = saved?.avatarUrl ?? payload.avatarUrl ?? null;

				return {
					...(prev ?? userView),
					name: nextName,
					email: nextEmail,
					avatarUrl: nextAvatar,
					badgeText: nextName.slice(0, 2).toUpperCase(),
					// stats/isAdmin은 기존 유지
					isAdmin: (prev ?? userView).isAdmin,
					stats: (prev ?? userView).stats,
				};
			});

			setSettingsOpen(false);
		} catch {
			setSaveError("저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="min-h-screen bg-zinc-950 text-zinc-100">
			{/* Top bar */}
			<header className="sticky top-0 z-20 border-b border-zinc-800/70 bg-zinc-950/70 backdrop-blur">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
					<Link href="/" className="text-xl font-semibold tracking-tight">
						<span className="text-red-500">Me:ah</span>Flix
					</Link>

					<div className="flex items-center gap-3">
						<div className="hidden text-sm text-zinc-400 sm:block">
							{userView.email}
						</div>
					</div>
				</div>
			</header>

			<main className="mx-auto max-w-6xl px-6 pb-16 pt-10">
				{/* Profile hero */}
				<section className="flex flex-col gap-8 md:flex-row md:items-center md:gap-10">
					<div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full ring-4 ring-zinc-800 md:h-36 md:w-36">
						<Image
							src={userView.avatarUrl ?? "/images/profile.jpg"}
							alt={userView.name}
							fill
							className="object-cover"
							sizes="144px"
							priority
						/>
					</div>

					<div className="flex-1">
						<h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
							{userView.name}
						</h1>
						<p className="mt-2 text-lg text-zinc-400">{userView.email}</p>

						<div className="mt-6 flex flex-wrap gap-3">
							<Button
								type="button"
								variant="secondary"
								onClick={openSettings}
								className="h-11 rounded-xl bg-zinc-800/70 text-zinc-100 hover:bg-zinc-800 border border-zinc-700"
							>
								<Settings className="mr-2 h-4 w-4" />
								Settings
							</Button>

							{userView.isAdmin && (
								<Button
									type="button"
									className="h-11 rounded-xl bg-red-600 text-white hover:bg-red-700"
								>
									<Shield className="mr-2 h-4 w-4" />
									Admin
								</Button>
							)}
						</div>
					</div>
				</section>

				{/* Stats cards */}
				<section className="mt-10 grid gap-6 md:grid-cols-3">
					<StatCard
						icon={<Clock className="h-5 w-5 text-red-500" />}
						label="Watch Time"
						value={`${userView.stats.watchHours} hrs`}
					/>
					<StatCard
						icon={<Heart className="h-5 w-5 text-red-500" />}
						label="My List"
						value={`${userView.stats.myListCount} titles`}
					/>
					<StatCard
						icon={<Bell className="h-5 w-5 text-red-500" />}
						label="Following"
						value={`${userView.stats.followingSeries} series`}
					/>
				</section>

				<section className="mt-14">
					<h2 className="text-3xl font-semibold tracking-tight">
						Continue Watching
					</h2>
					<div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 text-zinc-400">
						이어보기 콘텐츠 영역 (추후 리스트/캐러셀로 연결)
					</div>
				</section>
			</main>

			{/* Settings Modal */}
			<Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
				<DialogContent className="sm:max-w-[520px] rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100">
					<DialogHeader>
						<DialogTitle className="text-xl">프로필 수정</DialogTitle>
						<DialogDescription className="text-zinc-400">
							표시 이름과 이메일(및 아바타 URL)을 수정할 수 있습니다.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div className="space-y-2">
							<div className="text-sm text-zinc-300">이름</div>
							<Input
								value={editName}
								onChange={(e) => setEditName(e.target.value)}
								disabled={saving}
								className="h-11 rounded-xl bg-zinc-900/60 border-zinc-800"
								placeholder="이름"
							/>
						</div>

						<div className="space-y-2">
							<div className="text-sm text-zinc-300">성</div>
							<Input
								value={editName}
								onChange={(e) => setEditName(e.target.value)}
								disabled={saving}
								className="h-11 rounded-xl bg-zinc-900/60 border-zinc-800"
								placeholder="성"
							/>
						</div>

						<div className="space-y-2">
							<div className="text-sm text-zinc-300">이메일</div>
							<Input
								value={editEmail}
								onChange={(e) => setEditEmail(e.target.value)}
								disabled={saving}
								className="h-11 rounded-xl bg-zinc-900/60 border-zinc-800"
								placeholder="email@example.com"
								type="email"
							/>
						</div>

						{/* <div className="space-y-2">
              <div className="text-sm text-zinc-300">아바타 URL (선택)</div>
              <Input
                value={editAvatarUrl}
                onChange={(e) => setEditAvatarUrl(e.target.value)}
                disabled={saving}
                className="h-11 rounded-xl bg-zinc-900/60 border-zinc-800"
                placeholder="https://..."
              />
              <div className="text-xs text-zinc-500">
                빈 값이면 기본 이미지로 표시됩니다.
              </div>
            </div> */}

						{saveError && <p className="text-sm text-red-400">{saveError}</p>}
					</div>

					<DialogFooter className="flex items-center justify-between">
						{/* 왼쪽: 회원탈퇴 */}
						<Button
							type="button"
							variant="secondary"
							onClick={() => setSettingsOpen(false)}
							disabled={saving}
							className="rounded-xl bg-red-500 text-white border border-red-600 hover:bg-red-600"
						>
							회원탈퇴
						</Button>

						{/* 오른쪽: 취소 / 저장 */}
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="secondary"
								onClick={() => setSettingsOpen(false)}
								disabled={saving}
								className="rounded-xl bg-white text-black border border-zinc-300 hover:bg-gray-200"
							>
								취소
							</Button>

							<Button
								type="button"
								onClick={handleSaveSettings}
								disabled={saving}
								className="rounded-xl bg-blue-500 hover:bg-blue-600 text-white"
							>
								{saving ? "저장 중..." : "저장"}
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

function StatCard({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
}) {
	return (
		<Card className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
			<div className="flex items-center gap-3 text-zinc-300">
				<div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-950/40 ring-1 ring-zinc-800">
					{icon}
				</div>
				<div className="text-lg">{label}</div>
			</div>

			<div className="mt-4 text-4xl font-semibold tracking-tight">{value}</div>
		</Card>
	);
}
