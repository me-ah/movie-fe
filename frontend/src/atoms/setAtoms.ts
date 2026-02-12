import { atom } from "jotai";
import type { ShortsComment } from "@/api/comment";
import type { ShortsMovie } from "@/api/shortsMovie";

export const countAtom = atom(0);

export const shortsListAtom = atom<ShortsMovie[]>([]);
export const activeMovieAtom = atom<ShortsMovie | null>(null);
export const isCommentOpenAtom = atom(false);
export const isShareModalOpenAtom = atom(false);

export const commentsAtom = atom<ShortsComment[]>([]);
