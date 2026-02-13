"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
	createMovieReview,
	getMovieReviews,
	type ReviewItem,
} from "@/api/movie_reviews";
import { Button } from "@/components/ui/button";

import MovieReviewCreateDialog from "./MovieReviewCreateDialog";

type CreateReviewPayload = {
	rating?: number;
	content: string;
};

type ReviewTabParams = {
	movieId?: string | string[];
};

export default function MovieReviewsTab({
	movieId,
}: {
	movieId?: string | number;
}) {
	const params = useParams<ReviewTabParams>();
	const [reviews, setReviews] = useState<ReviewItem[]>([]);
	const [loading, setLoading] = useState(false);

	const [open, setOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const normalizedMovieId = useMemo(() => {
		if (movieId != null && String(movieId).trim())
			return String(movieId).trim();
		const raw = params?.movieId;
		const fromParams = Array.isArray(raw) ? raw[0] : raw;
		return String(fromParams ?? "").trim();
	}, [movieId, params]);

	async function refetchReviews() {
		if (!normalizedMovieId) {
			setReviews([]);
			return;
		}
		const data = await getMovieReviews(normalizedMovieId);
		console.log(data);
		setReviews(data);
	}

	useEffect(() => {
		let alive = true;

		if (!normalizedMovieId) {
			setReviews([]);
			setLoading(false);
			return () => {
				alive = false;
			};
		}

		(async () => {
			try {
				setLoading(true);
				const data = await getMovieReviews(normalizedMovieId);
				if (alive) setReviews(data);
			} catch (e) {
				console.error("getMovieReviews failed", e);
				if (alive) setReviews([]);
			} finally {
				if (alive) setLoading(false);
			}
		})();

		return () => {
			alive = false;
		};
	}, [normalizedMovieId]);

	const handleCreate = async (payload: CreateReviewPayload) => {
		try {
			if (!normalizedMovieId) return;

			setSubmitting(true);

			await createMovieReview(normalizedMovieId, payload);

			setOpen(false);
			await refetchReviews();
		} catch (e) {
			throw e.error;
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return <div className="mt-6 text-sm text-zinc-400">리뷰 불러오는 중..</div>;
	}

	return (
		<div className="mt-5 space-y-3">
			<div className="flex items-center justify-between">
				<div className="text-sm font-semibold text-zinc-100">리뷰</div>
				<Button
					type="button"
					className="rounded-xl bg-blue-500 hover:bg-blue-600"
					onClick={() => setOpen(true)}
					disabled={!normalizedMovieId}
				>
					리뷰 작성
				</Button>
			</div>

			<MovieReviewCreateDialog
				open={open}
				onOpenChange={setOpen}
				onSubmit={handleCreate}
				submitting={submitting}
			/>

			{reviews.length === 0 ? (
				<div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4 text-sm text-zinc-400">
					아직 리뷰가 없습니다.
				</div>
			) : (
				reviews.map((r) => (
					<div
						key={r.id}
						className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4"
					>
						<div className="flex items-center justify-between">
							<div className="text-sm font-medium text-zinc-100">{r.user}</div>
							<div className="text-xs text-zinc-400">
								{r.createdAt
									? new Date(r.createdAt).toLocaleDateString("ko-KR")
									: ""}
							</div>
						</div>

						<p className="mt-2 text-sm leading-relaxed text-zinc-200">
							{r.content}
						</p>

						{r.rating != null && (
							<div className="mt-2 text-xs text-zinc-400">평점: {r.rating}</div>
						)}
					</div>
				))
			)}
		</div>
	);
}
