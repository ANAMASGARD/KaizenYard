"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useThreads } from "@liveblocks/react/suspense";

type TaskThreadCountsContextValue = {
  getCommentCount: (taskId: number) => number;
};

const TaskThreadCountsContext = createContext<TaskThreadCountsContextValue>({
  getCommentCount: () => 0,
});

export function TaskThreadCountsProvider({ children }: { children: ReactNode }) {
  const { threads } = useThreads();

  const countsByTaskId = useMemo(() => {
    const map = new Map<number, number>();
    for (const thread of threads) {
      const taskId = thread.metadata.taskId;
      if (typeof taskId !== "number") continue;
      const count = thread.comments.length;
      map.set(taskId, (map.get(taskId) ?? 0) + count);
    }
    return map;
  }, [threads]);

  const value = useMemo(
    () => ({
      getCommentCount: (taskId: number) => countsByTaskId.get(taskId) ?? 0,
    }),
    [countsByTaskId],
  );

  return (
    <TaskThreadCountsContext.Provider value={value}>
      {children}
    </TaskThreadCountsContext.Provider>
  );
}

export function useTaskCommentCount(taskId: number): number {
  const { getCommentCount } = useContext(TaskThreadCountsContext);
  return getCommentCount(taskId);
}
