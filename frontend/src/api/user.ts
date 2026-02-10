import api from "@/lib/apiClient";
export type MeResponse = {
	id: number;
	username: string;
	email: string;
	firstName: string;
	lastName: string;
	role: "USER" | "ADMIN";
	avatarUrl?: string;
};

export type UpdateMePayload = {
	firstname: string;
	lastname: string;
	useremail: string;
};

export type BackendMyPageResponse = {
	userdata: {
		userid: string | number;
		username: string;
		useremail: string;
		firstname: string;
		lastname: string;
	};
	watchtime: string | number;
	usermylist: string | number;

	recordmovie?: Record<
		string,
		{ recordmovie_name?: string; recordmovie_poster?: string }
	>;

	mylistmovie?: Record<
		string,
		{ mylistmovie_name?: string; mylistmovie_poster?: string }
	>;
};

// 내 정보 (/me) - 백엔드 라우트에 맞게 필요 시 수정
export async function getMe() {
	const res = await api.get<MeResponse>("/me");
	return res.data;
}

// 마이페이지 조회 (보통 GET)
export async function getMyPage() {
	const res = await api.get<BackendMyPageResponse>("/accounts/mypage/");
	return res.data;
}

// 마이페이지 수정 (PATCH)
export async function patchMe(payload: UpdateMePayload) {
	const res = await api.patch("/accounts/mypage/", payload);
	return res.data;
}
