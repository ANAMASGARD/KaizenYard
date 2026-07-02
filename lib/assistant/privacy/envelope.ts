import { createHash } from "node:crypto";

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_RE = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;

export type PrivacyEnvelopeState = {
  map: Record<string, string>;
  reverse: Record<string, string>;
};

export function createPrivacyEnvelopeState(
  existing?: Record<string, string>,
): PrivacyEnvelopeState {
  const map = { ...(existing ?? {}) };
  const reverse: Record<string, string> = {};
  for (const [token, value] of Object.entries(map)) {
    reverse[value] = token;
  }
  return { map, reverse };
}

function nextToken(prefix: string, state: PrivacyEnvelopeState): string {
  const count = Object.keys(state.map).filter((k) => k.startsWith(`{{${prefix}_`)).length + 1;
  return `{{${prefix}_${count}}}`;
}

function tokenizeValue(
  value: string,
  prefix: string,
  state: PrivacyEnvelopeState,
): string {
  if (state.reverse[value]) {
    return state.reverse[value];
  }
  const token = nextToken(prefix, state);
  state.map[token] = value;
  state.reverse[value] = token;
  return token;
}

export function tokenizeText(text: string, state: PrivacyEnvelopeState): string {
  let result = text.replace(EMAIL_RE, (match) => tokenizeValue(match, "EMAIL", state));
  result = result.replace(PHONE_RE, (match) => tokenizeValue(match, "PHONE", state));
  return result;
}

export function tokenizeKnownNames(
  text: string,
  names: string[],
  state: PrivacyEnvelopeState,
): string {
  let result = text;
  for (const name of names.sort((a, b) => b.length - a.length)) {
    if (!name.trim()) continue;
    const token = tokenizeValue(name, "CONTACT", state);
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(escaped, "gi"), token);
  }
  return result;
}

export function detokenizeText(text: string, map: Record<string, string>): string {
  let result = text;
  for (const [token, value] of Object.entries(map)) {
    result = result.split(token).join(value);
  }
  return result;
}

export function tokenizeObject<T>(value: T, state: PrivacyEnvelopeState): T {
  if (typeof value === "string") {
    return tokenizeText(value, state) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => tokenizeObject(item, state)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      out[key] = tokenizeObject(v, state);
    }
    return out as T;
  }
  return value;
}

export function detokenizeObject<T>(value: T, map: Record<string, string>): T {
  if (typeof value === "string") {
    return detokenizeText(value, map) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => detokenizeObject(item, map)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      out[key] = detokenizeObject(v, map);
    }
    return out as T;
  }
  return value;
}

export function hashActionSummary(summary: string): string {
  return createHash("sha256").update(summary).digest("hex");
}
