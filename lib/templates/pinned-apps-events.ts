export const PINNED_APPS_CHANGED_EVENT = "kaizenyard:pinned-apps-changed";

export function notifyPinnedAppsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PINNED_APPS_CHANGED_EVENT));
}
