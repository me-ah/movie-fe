"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { signup } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";

type FieldErrors = Partial<{
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
  firstName: string;
  lastName: string;
  form: string;
}>;

const USERNAME_RE = /^[a-zA-Z0-9_]{4,20}$/;
const NAME_RE = /^[가-힣a-zA-Z\s]{1,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateAll(values: {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
  firstName: string;
  lastName: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  // username
  if (!values.username.trim()) {
    errors.username = "아이디를 입력해주세요.";
  } else if (!USERNAME_RE.test(values.username)) {
    errors.username = "아이디는 4~20자, 영문/숫자/언더스코어(_)만 가능합니다.";
  }

  // email
  if (!values.email.trim()) {
    errors.email = "이메일을 입력해주세요.";
  } else if (!EMAIL_RE.test(values.email)) {
    errors.email = "이메일 형식이 올바르지 않습니다.";
  }

  // password
  if (!values.password) {
    errors.password = "비밀번호를 입력해주세요.";
  } else {
    if (values.password.length < 8) {
      errors.password = "비밀번호는 8자 이상이어야 합니다.";
    } else {
      // 최소한의 강도 체크: 대문자/소문자/숫자/특수문자 중 3종 이상
      const groups = [
        /[a-z]/.test(values.password),
        /[A-Z]/.test(values.password),
        /[0-9]/.test(values.password),
        /[^a-zA-Z0-9]/.test(values.password),
      ].filter(Boolean).length;

      if (groups < 3) {
        errors.password =
          "비밀번호는 영문 대/소문자, 숫자, 특수문자 중 3종 이상을 포함하는 것을 권장합니다.";
      }
    }
  }

  // passwordConfirm
  if (!values.passwordConfirm) {
    errors.passwordConfirm = "비밀번호 확인을 입력해주세요.";
  } else if (values.passwordConfirm !== values.password) {
    errors.passwordConfirm = "비밀번호가 일치하지 않습니다.";
  }

  // firstName
  if (!values.firstName.trim()) {
    errors.firstName = "이름을 입력해주세요.";
  } else if (!NAME_RE.test(values.firstName.trim())) {
    errors.firstName = "이름은 한글/영문만 입력 가능합니다.";
  }

  // lastName
  if (!values.lastName.trim()) {
    errors.lastName = "성을 입력해주세요.";
  } else if (!NAME_RE.test(values.lastName.trim())) {
    errors.lastName = "성은 한글/영문만 입력 가능합니다.";
  }

  return errors;
}

export default function SignUp() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [loading, setLoading] = useState(false);

  // 서버/제출 에러 (폼 상단)
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 필드별 에러 + touched
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const values = useMemo(
    () => ({
      username,
      email,
      password,
      passwordConfirm,
      firstName,
      lastName,
    }),
    [username, email, password, passwordConfirm, firstName, lastName]
  );

  // 전체 유효성 (버튼 disable에도 사용)
  const currentErrors = useMemo(() => validateAll(values), [values]);
  const isValid = useMemo(
    () => Object.keys(currentErrors).length === 0,
    [currentErrors]
  );

  const markTouched = (key: keyof FieldErrors) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const showError = (key: keyof FieldErrors) => {
    // touched 된 것만 보여주고 싶으면 아래처럼
    if (!touched[key as string]) return null;
    return errors[key] ?? null;
  };

  const validateAndSet = () => {
    const next = validateAll(values);
    setErrors(next);
    return next;
  };

  const handleSignup = async () => {
    setSubmitError(null);

    // 제출 시 전부 touched 처리
    setTouched({
      username: true,
      email: true,
      password: true,
      passwordConfirm: true,
      firstName: true,
      lastName: true,
    });

    const nextErrors = validateAndSet();
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setLoading(true);

      await signup({
        username,
        email,
        password,
        passwordConfirm,
        firstName,
        lastName,
      });

      router.push("/auth/login");
    } catch {
      setSubmitError("회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.6)] p-8">
        <Button
          className="absolute left-6 top-6 p-3 hover:bg-zinc-800/60"
          variant="ghost"
          onClick={() => router.back()}
          type="button"
        >
          <ArrowLeft className="!w-8 !h-8" />
        </Button>

        <h1 className="text-center text-2xl font-semibold mb-8">회원가입</h1>

        {submitError && (
          <p className="mb-4 text-sm text-red-400">{submitError}</p>
        )}

        <div className="space-y-4">
          <div className="space-y-1">
            <Input
              type="text"
              placeholder="아이디 (4~20자, 영문/숫자/_)"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                // 입력 중에도 에러 갱신 (실시간)
                setErrors(validateAll({ ...values, username: e.target.value }));
              }}
              onBlur={() => markTouched("username")}
              disabled={loading}
              className="h-12 rounded-xl bg-zinc-800/60 border-zinc-700"
            />
            {showError("username") && (
              <p className="text-xs text-red-400">{showError("username")}</p>
            )}
          </div>

          <div className="space-y-1">
            <Input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors(validateAll({ ...values, email: e.target.value }));
              }}
              onBlur={() => markTouched("email")}
              disabled={loading}
              className="h-12 rounded-xl bg-zinc-800/60 border-zinc-700"
            />
            {showError("email") && (
              <p className="text-xs text-red-400">{showError("email")}</p>
            )}
          </div>

          <div className="space-y-1">
            <Input
              type="password"
              placeholder="비밀번호 (8자 이상)"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors(validateAll({ ...values, password: e.target.value }));
              }}
              onBlur={() => markTouched("password")}
              disabled={loading}
              className="h-12 rounded-xl bg-zinc-800/60 border-zinc-700"
            />
            {showError("password") && (
              <p className="text-xs text-red-400">{showError("password")}</p>
            )}
          </div>

          <div className="space-y-1">
            <Input
              type="password"
              placeholder="비밀번호 확인"
              value={passwordConfirm}
              onChange={(e) => {
                setPasswordConfirm(e.target.value);
                setErrors(
                  validateAll({ ...values, passwordConfirm: e.target.value })
                );
              }}
              onBlur={() => markTouched("passwordConfirm")}
              disabled={loading}
              className="h-12 rounded-xl bg-zinc-800/60 border-zinc-700"
            />
            {showError("passwordConfirm") && (
              <p className="text-xs text-red-400">
                {showError("passwordConfirm")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Input
                type="text"
                placeholder="이름"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setErrors(
                    validateAll({ ...values, firstName: e.target.value })
                  );
                }}
                onBlur={() => markTouched("firstName")}
                disabled={loading}
                className="h-12 rounded-xl bg-zinc-800/60 border-zinc-700"
              />
              {showError("firstName") && (
                <p className="text-xs text-red-400">{showError("firstName")}</p>
              )}
            </div>

            <div className="space-y-1">
              <Input
                type="text"
                placeholder="성"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  setErrors(
                    validateAll({ ...values, lastName: e.target.value })
                  );
                }}
                onBlur={() => markTouched("lastName")}
                disabled={loading}
                className="h-12 rounded-xl bg-zinc-800/60 border-zinc-700"
              />
              {showError("lastName") && (
                <p className="text-xs text-red-400">{showError("lastName")}</p>
              )}
            </div>
          </div>

          <Button
            type="button"
            onClick={handleSignup}
            disabled={loading || !isValid}
            className="h-12 w-full rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-60"
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
