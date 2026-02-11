// src/lib/userStorage.ts
const USER_ID_KEY = "user_id";

export function setUser(user: {
	user_id: number | string;
}) {
	if (typeof window === "undefined") return;

	localStorage.setItem(USER_ID_KEY, String(user.user_id));
}

export function getUser() {
	if (typeof window === "undefined") return null;

	return {
		user_id: localStorage.getItem(USER_ID_KEY),
	};
}

export function clearUser() {
	if (typeof window === "undefined") return;

	localStorage.removeItem(USER_ID_KEY);
}
