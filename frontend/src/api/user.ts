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

export async function getMe() {
	const res = await api.get<MeResponse>("/me");
	return res.data;
}
