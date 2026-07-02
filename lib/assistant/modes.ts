import type { PrivacyMode } from "@/lib/assistant/types";

export function isPrivacyModeEnabled(mode: PrivacyMode): boolean {
  return mode !== "standard";
}

export function requiresTokenization(mode: PrivacyMode): boolean {
  return mode === "blind" || mode === "witness" || mode === "vault" || mode === "delegate";
}

export function requiresOnChainAnchor(mode: PrivacyMode): boolean {
  return mode === "witness" || mode === "delegate";
}

export function requiresVaultGate(mode: PrivacyMode): boolean {
  return mode === "vault";
}

export function requiresWallet(mode: PrivacyMode): boolean {
  return mode === "delegate" || mode === "vault";
}

export function privacyModeLabel(mode: PrivacyMode): string {
  switch (mode) {
    case "standard":
      return "Standard";
    case "blind":
      return "Blind Copilot";
    case "witness":
      return "Witness";
    case "vault":
      return "Vault Witness";
    case "delegate":
      return "DAO Delegate";
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}
