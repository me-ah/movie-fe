"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
	type AdminUserDetail,
	type UpdateAdminUserParams,
	updateAdminUser,
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
import { useToast } from "@/hooks/use-toast";

type EditMemberDialogProps = {
	user: AdminUserDetail;
	onUserUpdated: () => void;
};

const NON_MODIFIABLE_FIELDS: string[] = [];

export default function EditMemberDialog({
	user,
	onUserUpdated,
}: EditMemberDialogProps) {
	const [open, setOpen] = useState(false);
	const { toast } = useToast();
	const {
		register,
		handleSubmit,
		reset,
		formState: { isSubmitting, dirtyFields },
	} = useForm<UpdateAdminUserParams>({
		defaultValues: {
			email: user.email,
			first_name: user.first_name,
			last_name: user.last_name,
			is_staff: user.is_staff,
			is_active: user.is_active,
			is_onboarding_completed: user.is_onboarding_completed,
			...Object.fromEntries(
				Object.entries(user)
					.filter(([key]) => key.startsWith("pref_"))
					.map(([key, val]) => [key, val]),
			),
		},
	});

	useEffect(() => {
		if (open) {
			reset({
				email: user.email,
				first_name: user.first_name,
				last_name: user.last_name,
				is_staff: user.is_staff,
				is_active: user.is_active,
				is_onboarding_completed: user.is_onboarding_completed,
				...Object.fromEntries(
					Object.entries(user)
						.filter(([key]) => key.startsWith("pref_"))
						.map(([key, val]) => [key, val]),
				),
			});
		}
	}, [open, user, reset]);

	const onSubmit = async (data: UpdateAdminUserParams) => {
		try {
			const changedFields = Object.keys(dirtyFields) as Array<
				keyof UpdateAdminUserParams
			>;

			const isInvalidModification = changedFields.some((field) =>
				NON_MODIFIABLE_FIELDS.includes(String(field)),
			);

			if (isInvalidModification) {
				toast({
					variant: "destructive",
					title: "수정 불가",
					description: "수정이 불가한 항목입니다.",
				});
				return;
			}

			if (changedFields.length === 0) {
				toast({
					title: "변경 사항 없음",
					description: "수정된 정보가 없습니다.",
				});
				setOpen(false);
				return;
			}

			const changedData: UpdateAdminUserParams = {};
			changedFields.forEach((field) => {
				const value = data[field];
				changedData[field] = value;
			});

			Object.keys(changedData).forEach((key) => {
				if (key.startsWith("pref_")) {
					changedData[key] = Number(changedData[key]);
				}
			});

			await updateAdminUser(user.id, changedData);
			toast({
				title: "수정 성공",
				description: "회원 정보가 수정되었습니다.",
			});
			setOpen(false);
			onUserUpdated();
		} catch {
			toast({
				variant: "destructive",
				title: "수정 실패",
				description: "회원 정보 수정 중 오류가 발생했습니다.",
			});
		}
	};

	const prefKeys = Object.keys(user).filter((k) => k.startsWith("pref_"));

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					className="border-zinc-700 hover:bg-zinc-800 text-zinc-300"
				>
					회원 수정
				</Button>
			</DialogTrigger>
			<DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>회원 정보 수정</DialogTitle>
					<DialogDescription className="text-zinc-400">
						회원의 정보를 수정합니다. 변경사항을 저장하려면 저장 버튼을
						누르세요.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
					<div className="space-y-4">
						<h3 className="text-lg font-medium border-b border-zinc-800 pb-2">
							기본 정보
						</h3>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="email">이메일</Label>
								<Input
									id="email"
									{...register("email")}
									className="bg-zinc-950 border-zinc-800 text-zinc-100"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="password">비밀번호 (변경 시 입력)</Label>
								<Input
									id="password"
									type="password"
									placeholder="변경하지 않으려면 비워두세요"
									{...register("password")}
									className="bg-zinc-950 border-zinc-800 text-zinc-100"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="last_name">성 (Last Name)</Label>
								<Input
									id="last_name"
									{...register("last_name")}
									className="bg-zinc-950 border-zinc-800 text-zinc-100"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="first_name">이름 (First Name)</Label>
								<Input
									id="first_name"
									{...register("first_name")}
									className="bg-zinc-950 border-zinc-800 text-zinc-100"
								/>
							</div>
						</div>
					</div>

					<div className="space-y-4">
						<h3 className="text-lg font-medium border-b border-zinc-800 pb-2">
							권한 및 상태
						</h3>
						<div className="flex gap-6">
							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id="is_staff"
									{...register("is_staff")}
									className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-emerald-600 focus:ring-emerald-600 focus:ring-offset-zinc-900"
								/>
								<Label htmlFor="is_staff">관리자 (Staff)</Label>
							</div>
							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id="is_active"
									{...register("is_active")}
									className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-emerald-600 focus:ring-emerald-600 focus:ring-offset-zinc-900"
								/>
								<Label htmlFor="is_active">활성 (Active)</Label>
							</div>
							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id="is_onboarding_completed"
									{...register("is_onboarding_completed")}
									className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-emerald-600 focus:ring-emerald-600 focus:ring-offset-zinc-900"
								/>
								<Label htmlFor="is_onboarding_completed">온보딩 완료</Label>
							</div>
						</div>
					</div>

					<div className="space-y-4">
						<h3 className="text-lg font-medium border-b border-zinc-800 pb-2">
							선호 장르 점수
						</h3>
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
							{prefKeys.map((key) => {
								const genreName = key
									.replace("pref_", "")
									.replace("_", " ")
									.toUpperCase();
								return (
									<div key={key} className="space-y-1">
										<Label htmlFor={key} className="text-xs text-zinc-400">
											{genreName}
										</Label>
										<Input
											id={key}
											type="number"
											{...register(key)}
											className="bg-zinc-950 border-zinc-800 text-zinc-100 h-8"
										/>
									</div>
								);
							})}
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
