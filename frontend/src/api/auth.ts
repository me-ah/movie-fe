// src/api/auth.ts
import api from "@/lib/apiClient";

type LoginResponse = {
	accessToken: string;
	refreshToken: string;
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
	const res = await api.post<LoginResponse>("/auth/login", {
		email,
		password,
	});

	return res.data;
}


export async function signup(payload: SignupRequest) {
  const res = await api.post("/auth/register", payload);
  return res.data;
}