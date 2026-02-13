"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
	type AdminMovieDetail,
	type UpdateAdminMovieParams,
	updateAdminMovie,
} from "@/api/admin";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type EditMovieDialogProps = {
	movie: AdminMovieDetail;
	onMovieUpdated: () => void;
};

export default function EditMovieDialog({
	movie,
	onMovieUpdated,
}: EditMovieDialogProps) {
	const [open, setOpen] = useState(false);
	const { toast } = useToast();
	const {
		register,
		handleSubmit,
		reset,
		formState: { isSubmitting },
	} = useForm<UpdateAdminMovieParams>({
		defaultValues: {
			title: movie.title,
			release_date: movie.release_date,
			overview: movie.overview,
			vote_average: movie.vote_average,
			poster_path: movie.poster_path,
			youtube_key: movie.youtube_key,
			is_in_theaters: movie.is_in_theaters,
		},
	});

	useEffect(() => {
		if (open) {
			reset({
				title: movie.title,
				release_date: movie.release_date,
				overview: movie.overview,
				vote_average: movie.vote_average,
				poster_path: movie.poster_path,
				youtube_key: movie.youtube_key,
				is_in_theaters: movie.is_in_theaters,
			});
		}
	}, [open, movie, reset]);

	const onSubmit = async (data: UpdateAdminMovieParams) => {
		try {
			const payload = {
				...data,
				// 숫자로 변환 필요한 필드들 처리
				vote_average: data.vote_average ? Number(data.vote_average) : 0,
			};

			await updateAdminMovie(movie.id, payload);
			toast({
				title: "수정 성공",
				description: "영화 정보가 수정되었습니다.",
			});
			setOpen(false);
			onMovieUpdated();
		} catch (error) {
			console.error(error);
			toast({
				variant: "destructive",
				title: "수정 실패",
				description: "영화 정보 수정 중 오류가 발생했습니다.",
			});
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					className="bg-white text-black hover:bg-zinc-200 border-zinc-200"
				>
					정보 수정
				</Button>
			</DialogTrigger>
			<DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>영화 정보 수정</DialogTitle>
					<DialogDescription className="text-zinc-400">
						영화 정보를 수정합니다. 변경사항을 저장하려면 저장 버튼을 누르세요.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="title">영화 제목</Label>
								<Input
									id="title"
									{...register("title")}
									className="bg-zinc-950 border-zinc-800 text-zinc-100"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="release_date">개봉일</Label>
								<Input
									id="release_date"
									placeholder="YYYY-MM-DD"
									{...register("release_date")}
									className="bg-zinc-950 border-zinc-800 text-zinc-100"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="overview">줄거리</Label>
							<Textarea
								id="overview"
								{...register("overview")}
								className="bg-zinc-950 border-zinc-800 text-zinc-100 min-h-[100px]"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="poster_path">포스터 경로</Label>
								<Input
									id="poster_path"
									{...register("poster_path")}
									className="bg-zinc-950 border-zinc-800 text-zinc-100"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="youtube_key">유튜브 Key</Label>
								<Input
									id="youtube_key"
									{...register("youtube_key")}
									className="bg-zinc-950 border-zinc-800 text-zinc-100"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="vote_average">평점</Label>
								<Input
									id="vote_average"
									type="number"
									step="0.1"
									{...register("vote_average")}
									className="bg-zinc-950 border-zinc-800 text-zinc-100"
								/>
							</div>
							<div className="flex items-center space-x-2 pt-8">
								<input
									type="checkbox"
									id="is_in_theaters"
									{...register("is_in_theaters")}
									className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-emerald-600 focus:ring-emerald-600 focus:ring-offset-zinc-900"
								/>
								<Label htmlFor="is_in_theaters">현재 상영 중</Label>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="ghost"
							onClick={() => setOpen(false)}
							className="text-zinc-400 hover:text-zinc-100"
						>
							취소
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting}
							className="bg-emerald-600 hover:bg-emerald-700 text-white"
						>
							{isSubmitting ? "저장 중..." : "저장"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
