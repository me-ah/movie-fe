const USER_ID_KEY = "user_id";
const USER_ROLE_KEY = "app_user";

type StoredUser = {
	user_id: number | string;
	user_superuser?: boolean;
};

export function setUser(user: StoredUser) {
	if (typeof window === "undefined") return;

	localStorage.setItem(USER_ID_KEY, String(user.user_id));
	localStorage.setItem(USER_ROLE_KEY, String(Boolean(user.user_superuser)));
}

export function getUser() {
	if (typeof window === "undefined") return null;

	return {
		user_id: localStorage.getItem(USER_ID_KEY),
	};
}

export function getIsSuperUser(): boolean {
	if (typeof window === "undefined") return false;
	return localStorage.getItem(USER_ROLE_KEY) === "true";
}

export function clearUser() {
	if (typeof window === "undefined") return;

	localStorage.removeItem(USER_ID_KEY);
	localStorage.removeItem(USER_ROLE_KEY);
}
