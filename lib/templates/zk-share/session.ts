const KEY_PREFIX = "kaizenyard-template-share:";

export function setAppShareUnlocked(appId: number): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(`${KEY_PREFIX}${appId}`, "unlocked");
}

export function isAppShareUnlocked(appId: number): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(`${KEY_PREFIX}${appId}`) === "unlocked";
}

export function clearAppShareUnlocked(appId: number): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(`${KEY_PREFIX}${appId}`);
}
