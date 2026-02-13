import { useCallback, useRef } from "react";
import { sendWatchHistory } from "@/api/watchHistory";

export const useWatchHistory = (movieId: string) => {
	const startTimeRef = useRef<number | null>(null);

	const startTracking = useCallback(() => {
		startTimeRef.current = Date.now();
	}, []);

	const stopTracking = useCallback(async () => {
		if (startTimeRef.current) {
			const durationMs = Date.now() - startTimeRef.current;

			const watchTime = Math.round(durationMs / 1000);

			await sendWatchHistory(movieId, watchTime);

			startTimeRef.current = null;
		}
	}, [movieId]);

	return { startTracking, stopTracking };
};
