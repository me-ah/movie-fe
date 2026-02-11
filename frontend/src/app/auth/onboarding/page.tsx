"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import api from "@/lib/apiClient";
import { useRouter } from "next/navigation";

type PrefKey =
  | "pref_action"
  | "pref_adventure"
  | "pref_animation"
  | "pref_comedy"
  | "pref_crime"
  | "pref_documentary"
  | "pref_drama"
  | "pref_family"
  | "pref_fantasy"
  | "pref_history"
  | "pref_horror"
  | "pref_music"
  | "pref_mystery"
  | "pref_romance"
  | "pref_science_fiction"
  | "pref_tv_movie"
  | "pref_thriller"
  | "pref_war"
  | "pref_western";

type PrefState = Record<PrefKey, boolean>;

const initialPrefs: PrefState = {
  pref_action: false,
  pref_adventure: false,
  pref_animation: false,
  pref_comedy: false,
  pref_crime: false,
  pref_documentary: false,
  pref_drama: false,
  pref_family: false,
  pref_fantasy: false,
  pref_history: false,
  pref_horror: false,
  pref_music: false,
  pref_mystery: false,
  pref_romance: false,
  pref_science_fiction: false,
  pref_tv_movie: false,
  pref_thriller: false,
  pref_war: false,
  pref_western: false,
};

const LABELS: Record<PrefKey, string> = {
  pref_action: "액션",
  pref_adventure: "모험",
  pref_animation: "애니메이션",
  pref_comedy: "코미디",
  pref_crime: "범죄",
  pref_documentary: "다큐멘터리",
  pref_drama: "드라마",
  pref_family: "가족",
  pref_fantasy: "판타지",
  pref_history: "역사",
  pref_horror: "공포",
  pref_music: "음악",
  pref_mystery: "미스터리",
  pref_romance: "로맨스",
  pref_science_fiction: "SF",
  pref_tv_movie: "TV 영화",
  pref_thriller: "스릴러",
  pref_war: "전쟁",
  pref_western: "서부",
};

export default function OnBoarding() {
  const router = useRouter();

  const [prefs, setPrefs] = useState<PrefState>(initialPrefs);
  const [saving, setSaving] = useState(false);

  const selectedCount = useMemo(
    () => Object.values(prefs).filter(Boolean).length,
    [prefs]
  );

  const selectedLabels = useMemo(
    () =>
      (Object.keys(prefs) as PrefKey[])
        .filter((k) => prefs[k])
        .map((k) => LABELS[k]),
    [prefs]
  );

  const toggle = (key: PrefKey) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAll = () => {
    setPrefs((prev) => {
      const next = { ...prev };
      (Object.keys(next) as PrefKey[]).forEach((k) => (next[k] = true));
      return next;
    });
  };

  const clearAll = () => setPrefs(initialPrefs);

const passClick = async () => {
  if (saving) return;
  setSaving(true);
  try {
    await api.post("/accounts/onboarding/", {
      ...initialPrefs,
      onboarding: true,
    });

    router.replace("/home");
  } finally {
    setSaving(false);
  }
};


  const handleSubmit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await api.post("/accounts/onboarding/", {
      ...initialPrefs,
      onboarding: true,
    });

      router.replace("/home");
    } finally {
      setSaving(false);
    }
  };

  return (
     <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-3xl p-6">
        <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-zinc-100">온보딩</h1>
            <p className="mt-1 text-sm text-zinc-400">
            좋아하는 장르를 선택하면 추천이 더 정확해져요.
            </p>
        </div>

        <Card className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                onClick={selectAll}
                disabled={saving}
              >
                전체 선택
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                onClick={clearAll}
                disabled={saving}
              >
                초기화
              </Button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {(Object.keys(LABELS) as PrefKey[]).map((key) => {
              const on = prefs[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggle(key)}
                  disabled={saving}
                  className={[
                    "h-11 rounded-xl border px-3 text-sm font-medium transition",
                    "flex items-center justify-center",
                    saving ? "opacity-60 cursor-not-allowed" : "",
                    on
                      ? "border-blue-500/60 bg-blue-500/15 text-blue-200"
                      : "border-zinc-800 bg-zinc-900/40 text-zinc-200 hover:bg-zinc-900",
                  ].join(" ")}
                  aria-pressed={on}
                >
                  {LABELS[key]}
                </button>
              );
            })}
          </div>

          <div className="mt-5">
            <div className="text-xs text-zinc-500">선택한 장르</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedLabels.length === 0 ? (
                <span className="text-sm text-zinc-400">
                  아직 선택한 장르가 없어요.
                </span>
              ) : (
                selectedLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-200"
                  >
                    {label}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
              onClick={passClick}
              disabled={saving}
            >
              {saving ? "처리 중..." : "건너뛰기"}
            </Button>
            <Button
              type="button"
              className="bg-blue-500 hover:bg-blue-600"
              onClick={handleSubmit}
              disabled={saving || selectedCount === 0}
            >
              {saving ? "저장 중..." : "저장하기"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
