import type { UIMessage } from "ai";

export const PRIVACY_MODES = [
  "standard",
  "blind",
  "witness",
  "vault",
  "delegate",
] as const;

export type PrivacyMode = (typeof PRIVACY_MODES)[number];

export type AssistantSessionRecord = {
  id: number;
  clerkId: string;
  title: string;
  privacyMode: PrivacyMode;
  agentSessionId: string;
  delegateAddress: string | null;
  witnessGroupId: number | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
};

export type AssistantMessageRecord = {
  id: number;
  sessionId: number;
  role: string;
  parts: unknown;
  createdAt: string;
};

export type ChatMessage = UIMessage;

export type WitnessGroupRecord = {
  id: number;
  ownerClerkId: string;
  name: string;
  commitment: string | null;
  merkleRoot: string | null;
  boardId: number | null;
  calendarPulseId: number | null;
  boardPulseId: number | null;
  isOpen: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WitnessAggregate = {
  groupId: number;
  name: string;
  attestationCount: number;
  taskCount: number;
  recentThemes: string[];
};

export type ProductivityOverview = {
  calendarItemCount: number;
  boardCount: number;
  taskCount: number;
  noteCount: number;
  whiteboardCount: number;
  spaceCount: number;
  pageCount: number;
  generatedAppCount: number;
};

export type AssistantToolContext = {
  clerkId: string;
  privacyMode: PrivacyMode;
  agentSessionId: string;
  witnessGroupId?: number | null;
  delegateAddress?: string | null;
  vaultUnlockedSpaceIds?: number[];
};
