"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signup } from "@/api/auth";

export default function SignUp() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    if (
      !username ||
      !email ||
      !password ||
      !passwordConfirm ||
      !firstName ||
      !lastName
    ) {
      setError("모든 항목을 입력해주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await signup({
        username,
        email,
        password,
        passwordConfirm,
        firstName,
        lastName,
      });

      // ✅ 회원가입 성공 → 로그인 페이지
      router.push("/auth/login");
    } catch {
      setError("회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.6)] p-8">
        <h1 className="text-center text-2xl font-semibold mb-8">회원가입</h1>

        <div className="space-y-4">
          <Input
            type="text"
            placeholder="아이디"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            className="h-12 rounded-xl bg-zinc-800/60 border-zinc-700"
          />

          <Input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="h-12 rounded-xl bg-zinc-800/60 border-zinc-700"
          />

          <Input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="h-12 rounded-xl bg-zinc-800/60 border-zinc-700"
          />

          <Input
            type="password"
            placeholder="비밀번호 확인"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            disabled={loading}
            className="h-12 rounded-xl bg-zinc-800/60 border-zinc-700"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="text"
              placeholder="이름"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={loading}
              className="h-12 rounded-xl bg-zinc-800/60 border-zinc-700"
            />
            <Input
              type="text"
              placeholder="성"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={loading}
              className="h-12 rounded-xl bg-zinc-800/60 border-zinc-700"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button
            type="button"
            onClick={handleSignup}
            disabled={loading}
            className="h-12 w-full rounded-xl bg-blue-500 hover:bg-blue-600"
          >
            {loading ? "가입 중..." : "회원가입"}
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-zinc-400">
          이미 계정이 있으신가요?{" "}
          <Link
            href="/auth/login"
            className="text-blue-400 hover:text-blue-300 underline underline-offset-4"
          >
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
