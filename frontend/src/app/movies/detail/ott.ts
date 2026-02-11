// src/utils/ott.ts

const OTT_LABEL_KO: Record<string, string> = {
  netflix: "넷플릭스",
  watcha: "왓챠",
  wavve: "웨이브",
  tving: "티빙",
  coupangplay: "쿠팡플레이",
  coupang_play: "쿠팡플레이",

  disney: "디즈니+",
  disneyplus: "디즈니+",
  disney_plus: "디즈니+",

  prime: "프라임 비디오",
  primevideo: "프라임 비디오",
  prime_video: "프라임 비디오",
  amazonprime: "프라임 비디오",
  amazon_prime: "프라임 비디오",

  appletv: "Apple TV+",
  apple_tv: "Apple TV+",
  appletvplus: "Apple TV+",
  apple_tv_plus: "Apple TV+",

  paramountplus: "파라마운트+",
  paramount_plus: "파라마운트+",

  laftel: "라프텔",
  crunchyroll: "크런치롤",
};

function normalizeOttKey(ott: string) {
  return String(ott)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[-]/g, "_");
}

export function parseOttKo(ott: string) {
  const key = normalizeOttKey(ott);
  return OTT_LABEL_KO[key] ?? ott;
}
