import { apiClient } from "./shortsMovie";

export interface WatchHistoryResponse {
	message: string;
	movie_id: string;
	watch_time: number;
}

export const sendWatchHistory = async (
	movieId: string,
	watchTime: number,
): Promise<WatchHistoryResponse> => {
	const safeWatchTime = Math.max(1, Math.floor(watchTime));
	const { data } = await apiClient.post("/accounts/watch-history/", {
		movie_id: movieId,
		watch_time: safeWatchTime,
	});
	return data;
};
