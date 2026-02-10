import { Suspense } from "react";
import AuthCallbackClient from "./AuthCallbackClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-zinc-400">로그인 처리 중...</div>}>
      <AuthCallbackClient />
    </Suspense>
  );
}
