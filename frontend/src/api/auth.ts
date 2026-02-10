// src/api/auth.ts
import { setUser } from "@/lib/userStorage";
import authClient from "@/lib/authClient";

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
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
	const { user } = res.data;

	
  setUser({
    user_id: user.id,  
    username: user.username,
    email: user.email,
  });

	return res.data;
}

export async function signup(payload: SignupRequest) {
	const res = await authClient.post("/accounts/register/", payload);
	console.log(res.data)
	return res.data;
}
