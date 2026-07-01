export const TASK_PULSE_VOTE_TYPES = ["on_track", "at_risk", "blocked"] as const;
export type TaskPulseVoteType = (typeof TASK_PULSE_VOTE_TYPES)[number];

export type TaskPulseTally = {
  onTrack: number;
  atRisk: number;
  blocked: number;
  total: number;
};

export type TaskPulseNote = {
  vote: TaskPulseVoteType;
  note: string;
};

export type TaskPulseRecord = {
  id: number;
  taskId: number;
  taskTitle: string;
  question: string;
  shareToken: string;
  isOpen: boolean;
  closesAt: string | null;
  tally: TaskPulseTally;
  notes: TaskPulseNote[];
  hasVoted: boolean;
  userVote: TaskPulseVoteType | null;
};

export type TaskPulseRiskSummary = {
  atRisk: number;
  blocked: number;
};

export function isTaskPulseVoteType(value: string): value is TaskPulseVoteType {
  return TASK_PULSE_VOTE_TYPES.includes(value as TaskPulseVoteType);
}

export const DEFAULT_TASK_PULSE_QUESTION =
  "How confident are you this will be done on time? Anything blocking you that's hard to raise directly?";
