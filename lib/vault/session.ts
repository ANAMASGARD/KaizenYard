const VAULT_SESSION_PREFIX = "kaizenyard-vault-unlock:";
const VAULT_SESSION_TTL_MS = 15 * 60 * 1000;

type VaultSession = {
  spaceId: number;
  unlockedAt: number;
  txHash?: string;
};

function sessionKey(spaceId: number): string {
  return `${VAULT_SESSION_PREFIX}${spaceId}`;
}

export function isVaultUnlocked(spaceId: number): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = sessionStorage.getItem(sessionKey(spaceId));
    if (!raw) return false;
    const session = JSON.parse(raw) as VaultSession;
    if (session.spaceId !== spaceId) return false;
    return Date.now() - session.unlockedAt < VAULT_SESSION_TTL_MS;
  } catch {
    return false;
  }
}

export function getVaultSession(spaceId: number): VaultSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(sessionKey(spaceId));
    if (!raw) return null;
    const session = JSON.parse(raw) as VaultSession;
    if (session.spaceId !== spaceId) return null;
    if (Date.now() - session.unlockedAt >= VAULT_SESSION_TTL_MS) {
      sessionStorage.removeItem(sessionKey(spaceId));
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function setVaultUnlocked(spaceId: number, txHash?: string): void {
  if (typeof window === "undefined") return;
  const session: VaultSession = {
    spaceId,
    unlockedAt: Date.now(),
    txHash,
  };
  sessionStorage.setItem(sessionKey(spaceId), JSON.stringify(session));
}

export function clearVaultUnlock(spaceId: number): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(sessionKey(spaceId));
}

export function lockAllVaults(): void {
  if (typeof window === "undefined") return;
  const keys: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key?.startsWith(VAULT_SESSION_PREFIX)) keys.push(key);
  }
  for (const key of keys) sessionStorage.removeItem(key);
}
