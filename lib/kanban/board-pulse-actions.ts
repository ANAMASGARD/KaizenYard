"use server";

import {
  createBoardRetroPulse as createBoardRetroPulseCore,
  getBoardPulseByToken as getBoardPulseByTokenCore,
} from "@/lib/witness/retro-pulse";

export type { BoardPulseRecord } from "@/lib/witness/retro-pulse";

export async function createBoardRetroPulse(
  boardId: number,
  question?: string,
) {
  return createBoardRetroPulseCore(boardId, question);
}

export async function getBoardPulseByToken(shareToken: string) {
  return getBoardPulseByTokenCore(shareToken);
}
