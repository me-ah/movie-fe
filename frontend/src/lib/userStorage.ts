// src/lib/userStorage.ts

export type StoredUser = {
  user_id: number | string;
  username?: string;
  email?: string;
  // 필요하면 더 추가
};

const KEY = "meahflix_user";

function isBrowser() {
  return typeof window !== "undefined";
}

export function setUser(user: StoredUser) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function getUser(): StoredUser | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function clearUser() {
  if (!isBrowser()) return;
  localStorage.removeItem(KEY);
}

export function getUserId(): string | number | null {
  const u = getUser();
  return u?.user_id ?? null;
}
