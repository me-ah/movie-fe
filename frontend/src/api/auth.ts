import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import api from "@/lib/apiClient";
import { clearTokens, setTokens } from "@/lib/tokenStorage";
import { clearUser, setUser } from "@/lib/userStorage";

export type LoginResponse = {
	message: string;
	user: {
		userid: number;
		username: string;
		useremail: string;
		firstname: string;
		lastname: string;
		is_superuser: boolean;
		onboarding: boolean;
	};
	token: string;
	refresh: string;
};

export type SignupRequest = {
	username: string;
	email: string;
	password: string;
	password_confirm: string;
	first_name: string;
	last_name: string;

	user_superuser?: boolean; // ✅ optional 로
};

export async function login(username: string, password: string) {
	const res = await api.post<LoginResponse>("/accounts/login/", {
		username,
		password,
	});

	const { user, token, refresh } = res.data;

	setUser({
		user_id: user.userid,
		user_superuser: user.is_superuser,
	});

	setTokens(token, refresh);
	return res.data;
}

export async function signup(payload: SignupRequest) {
	const res = await api.post("/accounts/register/", payload);
	return res.data;
}

export function logout(router: AppRouterInstance) {
	clearTokens();
	clearUser();
	router.replace("/auth/");
}
export async function oauthcheck(access_token: string) {
	const res = await api.post("/accounts/login/google/", { access_token });
	return res.data;
}

export type ChangePasswordPayload = {
	old_password: string;
	new_password: string;
	new_password_confirm: string;
};

export async function changePassword(payload: ChangePasswordPayload) {
	const res = await api.post("/accounts/change_password/", payload);
	return res.data;
}
