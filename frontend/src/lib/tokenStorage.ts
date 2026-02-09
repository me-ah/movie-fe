// src/lib/tokenStorage.ts
const accessToken = "accessToken";
const refreshToken = "refreshToken";

export function getAccessToken() {
	return typeof window === "undefined"
		? null
		: localStorage.getItem(accessToken);
}

export function getRefreshToken() {
	return typeof window === "undefined"
		? null
		: localStorage.getItem(refreshToken);
}

export function setTokens(accessToken: string, refreshToken: string) {
	if (typeof window === "undefined") return;

	localStorage.setItem(accessToken, accessToken);
	localStorage.setItem(refreshToken, refreshToken);
}

export function setAccessToken(accessToken: string) {
	if (typeof window === "undefined") return;
	localStorage.setItem(accessToken, accessToken);
}

export function clearTokens() {
	if (typeof window === "undefined") return;

	localStorage.removeItem(accessToken);
	localStorage.removeItem(refreshToken);
}
