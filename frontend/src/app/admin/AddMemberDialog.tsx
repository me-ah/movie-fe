"use client";

import { useState } from "react";
// import { useForm } from "react-hook-form";
import { type CreateAdminUserParams, createAdminUser } from "@/api/admin";
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

interface AddMemberDialogProps {
	onSuccess: () => void;
	trigger?: React.ReactNode;
}

export default function AddMemberDialog({
	onSuccess,
	trigger,
}: AddMemberDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { register, handleSubmit, reset } = useForm<CreateAdminUserParams>({
		defaultValues: {
			login_type: "email",
		},
	});

	const onSubmit = async (data: CreateAdminUserParams) => {
		setLoading(true);
		setError(null);
		try {
			await createAdminUser(data);
			setOpen(false);
			reset();
			onSuccess();
		} catch {
			setError("회원 추가에 실패했습니다. 입력 값을 확인해주세요.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button className="bg-blue-500 hover:bg-blue-600">회원 추가</Button>
				)}
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-zinc-100">
				<DialogHeader>
					<DialogTitle>새 회원 추가</DialogTitle>
					<DialogDescription className="text-zinc-400">
						새로운 관리자 또는 사용자를 추가합니다.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
					{error && <div className="text-sm text-rose-400">{error}</div>}

					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="username" className="text-right text-zinc-300">
							아이디
						</Label>
						<Input
							id="username"
							className="col-span-3 bg-zinc-800 border-zinc-700 text-zinc-100"
							{...register("username", { required: true })}
						/>
					</div>

					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="password" className="text-right text-zinc-300">
							비밀번호
						</Label>
						<Input
							id="password"
							type="password"
							className="col-span-3 bg-zinc-800 border-zinc-700 text-zinc-100"
							{...register("password", { required: true })}
						/>
					</div>

					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="email" className="text-right text-zinc-300">
							이메일
						</Label>
						<Input
							id="email"
							type="email"
							className="col-span-3 bg-zinc-800 border-zinc-700 text-zinc-100"
							{...register("email", { required: true })}
						/>
					</div>

					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="last_name" className="text-right text-zinc-300">
							성
						</Label>
						<Input
							id="last_name"
							className="col-span-3 bg-zinc-800 border-zinc-700 text-zinc-100"
							{...register("last_name", { required: true })}
						/>
					</div>

					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="first_name" className="text-right text-zinc-300">
							이름
						</Label>
						<Input
							id="first_name"
							className="col-span-3 bg-zinc-800 border-zinc-700 text-zinc-100"
							{...register("first_name", { required: true })}
						/>
					</div>

					<DialogFooter>
						<Button
							type="submit"
							disabled={loading}
							className="bg-blue-600 hover:bg-blue-700 text-white"
						>
							{loading ? "추가 중..." : "추가하기"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
