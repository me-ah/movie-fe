import { atom } from "jotai";
import type { ShortsComment } from "@/api/comment";
import type { ShortsMovie } from "@/api/shortsMovie";

export const countAtom = atom(0);

// 쇼츠 목록 데이터
export const shortsListAtom = atom<ShortsMovie[]>([]);
// 쇼츠 현재 화면에 보이는 영상 정보
export const activeMovieAtom = atom<ShortsMovie | null>(null);
// 쇼츠 댓글 패널 열림 상태
export const isCommentOpenAtom = atom(false);
// 쇼츠 공유 모달 열림 상태(공유 버튼 클릭 시 링크 뜨는 모달)
export const isShareModalOpenAtom = atom(false);
// 쇼츠 현재 선택된 영상의 댓글 목록

export const commentsAtom = atom<ShortsComment[]>([]);
