// src/api/auth.ts

import authClient from "@/lib/authClient";
import { setTokens } from "@/lib/tokenStorage";
import { setUser } from "@/lib/userStorage";

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
	const res = await authClient.post<LoginResponse>("/accounts/login/", {
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
	const res = await authClient.post("/accounts/register/", payload);
	console.log(res.data);
	return res.data;
}
