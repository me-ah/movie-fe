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

	// [추가] 커서 및 로딩 상태 관리
	const [cursor, setCursor] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// [추가] 리스트 하단 감지용 Hook
	const { ref, inView } = useInView({ threshold: 0.1 });

	// [추가] 데이터 페칭 함수
	const loadMoreShorts = useCallback(async () => {
		if (isLoading) return;

		setIsLoading(true);
		try {
			const response = await fetchShorts(cursor); //

			// 기존 리스트에 새로운 결과를 이어 붙입니다.
			setShortsList((prev) => [...prev, ...response.results]);
			// 다음 페이지를 위한 커서를 업데이트합니다.
			setCursor(response.next_cursor);
		} catch (error) {
			console.error("영상 로드 실패:", error);
		} finally {
			setIsLoading(false);
		}
	}, [cursor, isLoading, setShortsList]);

	// [추가] 초기 로드 및 스크롤 감지 시 로드
	useEffect(() => {
		// 맨 처음 데이터가 없거나, 스크롤이 끝에 닿았을 때 실행
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

			{/* [추가] 무한 스크롤 트리거 영역 */}
			{/* 이 div가 화면에 보이면(inView) 다음 페이지를 불러옵니다. */}
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
