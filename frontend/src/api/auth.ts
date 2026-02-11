// src/api/auth.ts

import { useRouter } from "next/navigation";
import api from "@/lib/authClient";
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
	};
	token: string;
	refresh: string;
	onboding: boolean;
};

export type SignupRequest = {
	username: string;
	email: string;
	password: string;
	password_confirm: string;
	first_name: string;
	last_name: string;
};

export async function login(username: string, password: string) {
	const res = await api.post<LoginResponse>("/accounts/login/", {
		username,
		password,
	});

	const { user, token, refresh } = res.data;

	setUser({
		user_id: user.userid,
	});

	setTokens(token, refresh);

	return res.data;
}

export async function signup(payload: SignupRequest) {
	const res = await api.post("/accounts/register/", payload);
	return res.data;
}

export async function logout() {
	const router = useRouter();

	clearTokens();
	clearUser();
	router.replace("/auth/");
}

export async function oauthcheck(access_token: string) {
	const res = await api.post("/accounts/login/google/", { access_token });
	return res.data;
}
