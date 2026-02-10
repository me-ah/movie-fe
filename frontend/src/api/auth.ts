// src/api/auth.ts
import api from "@/lib/apiClient";
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
	passwordConfirm: string;
	firstName: string;
	lastName: string;
};

export async function login(email: string, password: string) {
	const res = await authClient.post<LoginResponse>("/api/login/", {
		email,
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
	const res = await authClient.post("/api/register/", payload);
	return res.data;
}
