"use client";

import { useAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer"; // [추가] 스크롤 감지용
import { fetchShorts } from "@/api/shortsMovie"; // [추가] 이전에 만든 API 함수
import {
	isCommentOpenAtom,
	isShareModalOpenAtom,
	shortsListAtom,
} from "@/atoms/setAtoms";
import CommentPanel from "./commentPanel";
import ShareModal from "./shareModal";
import ShortsItem from "./shortsItem";

export default function ShortsPage() {
	const [shortsList, setShortsList] = useAtom(shortsListAtom);
	const [_isCommentOpen] = useAtom(isCommentOpenAtom);
	const [_isShareModalOpen] = useAtom(isShareModalOpenAtom);

	const [cursor, setCursor] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const { ref, inView } = useInView({ threshold: 0.1 });

	const loadMoreShorts = useCallback(async () => {
		if (isLoading) return;

		setIsLoading(true);
		try {
			const response = await fetchShorts(cursor); //

			setShortsList((prev) => [...prev, ...response.results]);
			setCursor(response.next_cursor);
		} catch (error) {
			console.error("영상 로드 실패:", error);
		} finally {
			setIsLoading(false);
		}
	}, [cursor, isLoading, setShortsList]);

	useEffect(() => {
		if (inView && (cursor !== null || shortsList.length === 0)) {
			loadMoreShorts();
		}
		console.log("trigger");
	}, [inView, cursor, shortsList.length, loadMoreShorts]);

	return (
		<main className="relative h-screen overflow-y-scroll snap-y snap-mandatory bg-black scrollbar-hide">
			{shortsList.map((movie) => (
				<ShortsItem key={movie.movie_id} movie={movie} />
			))}

			<div
				ref={ref}
				className="h-10 w-full bg-black flex items-center justify-center"
			>
				{isLoading && (
					<p className="text-white text-xs">더 많은 영상 로드 중...</p>
				)}
			</div>

			<CommentPanel />
			<ShareModal />
		</main>
	);
}
