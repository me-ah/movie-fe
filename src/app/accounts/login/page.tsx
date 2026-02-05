"use client";
// 공부겸 임의 구현한거라 삭제 예정

import { useState } from "react";
import { login } from "@/api/auth";
import { setTokens } from "@/lib/tokenStorage";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const { accessToken, refreshToken } = await login(email, password);

      setTokens(accessToken, refreshToken);

      alert("로그인 성공");
    } catch (e) {
      alert("로그인 실패");
    }
  };

  return (
    <div>
      <h1 className="text-5xl">여긴 로그인</h1>

      <input
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>로그인</button>
    </div>
  );
}
