// src/lib/tokenStorage.ts
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export function getAccessToken() {
	return typeof window === "undefined"
		? null
		: localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
	return typeof window === "undefined"
		? null
		: localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(access: string, refresh: string) {
	if (typeof window === "undefined") return;
	localStorage.setItem(ACCESS_TOKEN_KEY, access);
	localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function setAccessToken(access: string) {
	if (typeof window === "undefined") return;
	localStorage.setItem(ACCESS_TOKEN_KEY, access);
}

export function clearTokens() {
	if (typeof window === "undefined") return;
	localStorage.removeItem(ACCESS_TOKEN_KEY);
	localStorage.removeItem(REFRESH_TOKEN_KEY);
}
