"use client";

import { Clock, Heart, KeyRound, LogOut, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { type BackendMyPageResponse, getMyPage } from "@/api/user";
import EditModal from "@/app/auth/mypage/edit_modal";
import { Button } from "@/components/ui/button";
import { clearTokens } from "@/lib/tokenStorage";
import { clearUser, getUser } from "@/lib/userStorage";
import ChangePasswordDialog from "./ChangePasswordDialog";
import MyListSection, { type PosterItem } from "./my_list_section";
import StatCard from "./my_statcard";

type MyPageUser = {
	userid: string;
	username: string;
	useremail: string;
	firstname: string;
	lastname: string;
	login_type: string; 
	stats: {
		watchtime: number;
		usermylist: number;
	};
};

function toNumber(v: unknown, fallback = 0) {
	const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
	return Number.isFinite(n) ? n : fallback;
}

function mapRecordMovie(
	recordmovie?: BackendMyPageResponse["recordmovie"],
): PosterItem[] {
	if (!recordmovie) return [];
	return Object.entries(recordmovie).map(([id, v]) => ({
		id,
		title: v?.recordmovie_name ?? "Untitled",
		posterUrl: v?.recordmovie_poster ?? null,
	}));
}

function mapMyListMovie(
	mylistmovie?: BackendMyPageResponse["mylistmovie"],
): PosterItem[] {
	if (!mylistmovie) return [];
	return Object.entries(mylistmovie).map(([id, v]) => ({
		id,
		title: v?.mylistmovie_name ?? "Untitled",
		posterUrl: v?.mylistmovie_poster ?? null,
	}));
}

function formatWatchTime(totalSeconds: number) {
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	return { hours, minutes, seconds };
}


function normalize(data: BackendMyPageResponse) {
	const u = data.userdata;

	const user: MyPageUser = {
		userid: String(u.userid ?? ""),
		username: u.username ?? "Unknown",
		useremail: u.useremail ?? "",
		firstname: u.firstname ?? "",
		lastname: u.lastname ?? "",
		login_type: data.login_type ?? "", 
		stats: {
			watchtime: toNumber(data.watchtime, 0),
			usermylist: toNumber(data.usermylist, 0),
		},
	};

	return {
		user,
		recordItems: mapRecordMovie(data.recordmovie),
		myListItems: mapMyListMovie(data.mylistmovie),
	};
}


export default function MyPage() {
	const [user, setUser] = useState<MyPageUser | null>(null);
	const [recordItems, setRecordItems] = useState<PosterItem[]>([]);
	const [myListItems, setMyListItems] = useState<PosterItem[]>([]);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const router = useRouter();
	const [pwOpen, setPwOpen] = useState(false);
	const handleLogout = () => {
		clearTokens();
		clearUser();
		router.replace("/auth"); 
	};
	
	useEffect(() => {
		let cancelled = false;

		const load = async () => {
			try {
				const storedUser = getUser();
				const data = await getMyPage({ userid: storedUser.user_id });
				if (cancelled) return;

				const norm = normalize(data);
				setUser(norm.user);
				setRecordItems(norm.recordItems);
				setMyListItems(norm.myListItems);
			} catch {
				if (!cancelled) {
					setUser(null);
					setRecordItems([]);
					setMyListItems([]);
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
				userid: "",
				username: "Loading...",
				useremail: "",
				firstname: "",
				lastname: "",
				login_type: "",
				stats: { watchtime: 0, usermylist: 0 },
			},
		[user],
	);	

	
	const displayName = useMemo(() => {
		const full = `${userView.firstname}${userView.lastname}`.trim();
		return full || userView.username || "Unknown";
	}, [userView.firstname, userView.lastname, userView.username]);
	const time = formatWatchTime(userView.stats.watchtime);

	return (
		<div className="min-h-screen bg-zinc-950 text-zinc-100">
			<header className="sticky top-0 z-20 border-b border-zinc-800/70 bg-zinc-950/70 backdrop-blur">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
					<Link href="/home" className="text-xl font-semibold tracking-tight">
						<span className="text-red-500">Me:ah</span>Flix
					</Link>
				</div>
			</header>

			<main className="mx-auto max-w-6xl px-6 pb-16 pt-10">
				<section className="flex flex-col gap-8 md:flex-row md:items-center md:gap-10">
					<div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full ring-4 ring-zinc-800 md:h-36 md:w-36">
						<Image
							src={"/images/profile.jpg"}
							alt={displayName}
							fill
							className="object-cover"
							sizes="144px"
							priority
						/>
					</div>

					<div className="flex-1">
						<h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
							{displayName}
						</h1>
						<p className="mt-2 text-lg text-zinc-400">{userView.useremail}</p>

						<div className="mt-6 flex flex-wrap gap-3">
							<Button
								type="button"
								variant="secondary"
								onClick={() => setSettingsOpen(true)}
								className="h-11 rounded-xl bg-zinc-800/70 text-zinc-100 hover:bg-zinc-800 border border-zinc-700"
							>
								<Settings className="mr-2 h-4 w-4" />
								Settings
							</Button>

							{userView.login_type === "email" && (
							<Button
								type="button"
								variant="secondary"
								onClick={() => setPwOpen(true)}
								className="h-11 rounded-xl bg-zinc-800/70 text-zinc-100 hover:bg-zinc-800 border border-zinc-700"
							>
								<KeyRound className="mr-2 h-4 w-4" />
								비밀번호 변경
							</Button>
							)}

							<Button
								type="button"
								variant="secondary"
								onClick={handleLogout}
								className="h-11 rounded-xl bg-red-900/40 text-red-300 hover:bg-red-900/60 border border-red-800"
							>
								<LogOut className="mr-2 h-4 w-4" />
								Logout
							</Button>
						</div>
					</div>
				</section>

				<section className="mt-10 grid gap-6 md:grid-cols-3">
					<StatCard
						icon={<Clock className="h-5 w-5 text-red-500" />}
						label="Watch Time"
						value={`${time.hours}h ${time.minutes}m`}
					/>
					<StatCard
						icon={<Heart className="h-5 w-5 text-red-500" />}
						label="My List"
						value={`${userView.stats.usermylist} titles`}
					/>
				</section>

				<MyListSection
					title="시청기록"
					items={recordItems}
					emptyText="시청기록이 없습니다."
				/>
				<MyListSection
					title="찜한 리스트"
					items={myListItems}
					emptyText="찜한 콘텐츠가 없습니다."
				/>
			</main>

			{/* EditModal 저장 성공 시: 다시 getMyPage()로 전체 리프레시 권장 */}
			<EditModal
				open={settingsOpen}
				onOpenChange={setSettingsOpen}
				onSaved={async () => {
					const storedUser = getUser();
					if (!storedUser?.user_id) return;

					const data = await getMyPage({ userid: storedUser.user_id });
					const norm = normalize(data);
					setUser(norm.user);
					setRecordItems(norm.recordItems);
					setMyListItems(norm.myListItems);
				}}
				onWithdraw={() => setSettingsOpen(false)}
			/>
			<ChangePasswordDialog open={pwOpen} onOpenChange={setPwOpen} />
		</div>
	);
}
