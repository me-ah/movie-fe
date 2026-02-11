import axios from "axios";
import {
	clearTokens,
	getAccessToken,
	getRefreshToken,
	setAccessToken,
} from "./tokenStorage";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const api = axios.create({
	baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
	const accessToken = getAccessToken();

	if (accessToken) {
		config.headers.Authorization = `Bearer ${accessToken}`;
	}

	return config;
});

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		if (error.response?.status === 401 && !originalRequest?._retry) {
			originalRequest._retry = true;

			const refreshToken = getRefreshToken();
			if (!refreshToken) {
				clearTokens();
				return Promise.reject(error);
			}

			if (!isRefreshing) {
				isRefreshing = true;

				refreshPromise = axios
					.post(`${BASE_URL}/auth/refresh`, {
						refreshToken,
					})
					.then((res) => {
						const newAccessToken = res.data.accessToken as string;
						setAccessToken(newAccessToken);
						return newAccessToken;
					})
					.catch((err) => {
						clearTokens();
						throw err;
					})
					.finally(() => {
						isRefreshing = false;
					});
			}

			const newToken = await refreshPromise;
			originalRequest.headers.Authorization = `Bearer ${newToken}`;

			return api(originalRequest);
		}

		return Promise.reject(error);
	},
);

export default api;
