// src/lib/userStorage.ts
const USER_ID_KEY = "user_id";
const USERNAME_KEY = "username";
const EMAIL_KEY = "email";

export function setUser(user: {
	user_id: number | string;
	username: string;
	email: string;
}) {
	if (typeof window === "undefined") return;

	localStorage.setItem(USER_ID_KEY, String(user.user_id));
	localStorage.setItem(USERNAME_KEY, user.username);
	localStorage.setItem(EMAIL_KEY, user.email);
}

export function getUser() {
	if (typeof window === "undefined") return null;

	return {
		user_id: localStorage.getItem(USER_ID_KEY),
		username: localStorage.getItem(USERNAME_KEY),
		email: localStorage.getItem(EMAIL_KEY),
	};
}

export function clearUser() {
	if (typeof window === "undefined") return;

	localStorage.removeItem(USER_ID_KEY);
	localStorage.removeItem(USERNAME_KEY);
	localStorage.removeItem(EMAIL_KEY);
}
