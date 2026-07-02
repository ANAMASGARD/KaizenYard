const KEY_PREFIX = "kaizenyard-witness-session:";

export function setWitnessSessionUnlocked(witnessGroupId: number): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(`${KEY_PREFIX}${witnessGroupId}`, "unlocked");
}

export function isWitnessSessionUnlocked(witnessGroupId: number): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(`${KEY_PREFIX}${witnessGroupId}`) === "unlocked";
}

export function clearWitnessSession(witnessGroupId: number): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(`${KEY_PREFIX}${witnessGroupId}`);
}

const VAULT_KEY_PREFIX = "kaizenyard-assistant-vault:";

export function setAssistantVaultUnlocked(spaceId: number): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(`${VAULT_KEY_PREFIX}${spaceId}`, "unlocked");
}

export function getAssistantVaultUnlockedIds(): number[] {
  if (typeof window === "undefined") return [];
  const ids: number[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key?.startsWith(VAULT_KEY_PREFIX) && sessionStorage.getItem(key) === "unlocked") {
      const id = Number(key.slice(VAULT_KEY_PREFIX.length));
      if (!Number.isNaN(id)) ids.push(id);
    }
  }
  return ids;
}

export function clearAssistantVaultUnlocked(spaceId: number): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(`${VAULT_KEY_PREFIX}${spaceId}`);
}
