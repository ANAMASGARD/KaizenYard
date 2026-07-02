"use client";

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { LayoutGrid, PanelLeft, Plus, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import { KaizenLoadingScreen } from "@/components/loading/kaizen-loading";
import { ActiveCollaborators } from "@/components/kanban/active-collaborators";
import { AutomationPanel } from "@/components/kanban/automation-panel";
import { WitnessRetroPanel } from "@/components/kanban/witness-retro-panel";
import { BoardDialog } from "@/components/kanban/board-dialog";
import { BoardSidebar } from "@/components/kanban/board-sidebar";
import { CollaborationPanel } from "@/components/kanban/collaboration-panel";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { KanbanCard } from "@/components/kanban/kanban-card";
import { TaskDialog } from "@/components/kanban/task-dialog";
import { Button } from "@/components/retroui/Button";
import { Drawer } from "@/components/retroui/Drawer";
import {
  deleteColumn,
  listBoardData,
  listBoards,
  moveTaskWithReorder,
  reorderColumns,
  updateColumn,
} from "@/lib/kanban/actions";
import { kanbanBoardRoomId, type BoardRole } from "@/lib/kanban/room";
import type { KanbanColor } from "@/lib/kanban/colors";
import { useBoardRealtimeSync } from "@/lib/kanban/use-board-realtime-sync";
import "@/lib/liveblocks/config";
import type {
  BoardData,
  BoardRecord,
  ColumnRecord,
  TaskDialogDefaults,
  TaskRecord,
} from "@/lib/kanban/types";
import {
  parseColumnDropId,
  parseTaskDragId,
} from "@/lib/kanban/types";
import { usePersistedSidebarOpen } from "@/lib/use-persisted-sidebar-open";
import { cn } from "@/lib/utils";

function getColumnTasks(tasks: TaskRecord[], columnId: number): TaskRecord[] {
  return tasks
    .filter((t) => t.columnId === columnId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
}

function findColumnForTask(
  tasks: TaskRecord[],
  taskId: number,
): number | null {
  const task = tasks.find((t) => t.id === taskId);
  return task?.columnId ?? null;
}

function findContainerId(
  overId: string,
  tasks: TaskRecord[],
): number | null {
  const columnId = parseColumnDropId(overId);
  if (columnId !== null) return columnId;

  const taskId = parseTaskDragId(overId);
  if (taskId !== null) return findColumnForTask(tasks, taskId);

  return null;
}

type KanbanLiveBoardProps = {
  notifyRef: MutableRefObject<(() => void) | null>;
  boardId: number;
  boardRole: BoardRole;
  activeBoard: BoardRecord;
  columns: ColumnRecord[];
  tasks: TaskRecord[];
  pulseRiskByTaskId: Record<number, { atRisk: number; blocked: number }>;
  collaborationOpen: boolean;
  onCollaborationOpenChange: (open: boolean) => void;
  onAutomationPanelOpenChange: (open: boolean) => void;
  taskDialogOpen: boolean;
  onTaskDialogOpenChange: (open: boolean) => void;
  taskDefaults: TaskDialogDefaults | null;
  activeDragTask: TaskRecord | null;
  onDragStart: (event: DragStartEvent) => void;
  onDragOver: (event: DragOverEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragCancel: () => void;
  onAddTask: (columnId: number) => void;
  onEditTask: (task: TaskRecord) => void;
  onColumnCreated: (column: ColumnRecord) => void;
  onRenameColumn: (columnId: number, name: string) => void;
  onChangeColumnColor: (columnId: number, color: KanbanColor) => void;
  onMoveColumnLeft: (columnId: number) => void;
  onMoveColumnRight: (columnId: number) => void;
  onDeleteColumn: (columnId: number) => void;
  onTaskSaved: (task: TaskRecord) => void;
  onTaskDeleted: (taskId: number) => void;
  onRemoteRefresh: () => void;
  sensors: ReturnType<typeof useSensors>;
};

function KanbanLiveBoard({
  notifyRef,
  boardId,
  boardRole,
  activeBoard,
  columns,
  tasks,
  pulseRiskByTaskId,
  collaborationOpen,
  onCollaborationOpenChange,
  onAutomationPanelOpenChange,
  taskDialogOpen,
  onTaskDialogOpenChange,
  taskDefaults,
  activeDragTask,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDragCancel,
  onAddTask,
  onEditTask,
  onColumnCreated,
  onRenameColumn,
  onChangeColumnColor,
  onMoveColumnLeft,
  onMoveColumnRight,
  onDeleteColumn,
  onTaskSaved,
  onTaskDeleted,
  onRemoteRefresh,
  sensors,
}: KanbanLiveBoardProps) {
  const { notifyBoardChanged } = useBoardRealtimeSync(onRemoteRefresh);

  useEffect(() => {
    notifyRef.current = notifyBoardChanged;
  }, [notifyBoardChanged, notifyRef]);

  const readOnly = boardRole === "viewer";

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b-2 border-border pb-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <h2 className="font-head text-lg">{activeBoard.name}</h2>
          <ActiveCollaborators />
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onCollaborationOpenChange(true)}
          >
            <Users className="size-4 text-violet-600" />
            Collaborate
          </Button>
          {!readOnly ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAutomationPanelOpenChange(true)}
            >
              <Zap className="size-4 text-amber-600" />
              Automations
            </Button>
          ) : null}
        </div>
      </div>

      <DndContext
        sensors={readOnly ? [] : sensors}
        collisionDetection={closestCorners}
        onDragStart={readOnly ? undefined : onDragStart}
        onDragOver={readOnly ? undefined : onDragOver}
        onDragEnd={readOnly ? undefined : (e) => onDragEnd(e)}
        onDragCancel={onDragCancel}
      >
        <KanbanBoard
          boardId={boardId}
          boardRole={boardRole}
          columns={columns}
          tasks={tasks}
          pulseRiskByTaskId={pulseRiskByTaskId}
          onAddTask={onAddTask}
          onEditTask={onEditTask}
          onColumnCreated={onColumnCreated}
          onRenameColumn={onRenameColumn}
          onChangeColumnColor={onChangeColumnColor}
          onMoveColumnLeft={onMoveColumnLeft}
          onMoveColumnRight={onMoveColumnRight}
          onDeleteColumn={onDeleteColumn}
        />

        <DragOverlay>
          {activeDragTask ? (
            (() => {
              const col =
                columns.find((c) => c.id === activeDragTask.columnId) ??
                columns[0];
              if (!col) return null;
              return (
                <KanbanCard
                  task={activeDragTask}
                  column={col}
                  onEdit={() => {}}
                  showDragHandle={false}
                  overlay
                />
              );
            })()
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={onTaskDialogOpenChange}
        defaults={taskDefaults}
        boardRole={boardRole}
        onSaved={onTaskSaved}
        onDeleted={onTaskDeleted}
      />

      <CollaborationPanel
        boardId={boardId}
        isOwner={boardRole === "owner"}
        open={collaborationOpen}
        onOpenChange={onCollaborationOpenChange}
      />
    </>
  );
}

export function KanbanPage() {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <KanbanPageContent />
    </LiveblocksProvider>
  );
}

function KanbanPageContent() {
  const [boards, setBoards] = useState<BoardRecord[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<number | null>(null);
  const [columns, setColumns] = useState<ColumnRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [pulseRiskByTaskId, setPulseRiskByTaskId] = useState<
    Record<number, { atRisk: number; blocked: number }>
  >({});
  const [loading, setLoading] = useState(true);
  const [boardRole, setBoardRole] = useState<BoardRole>("owner");
  const [boardDialogOpen, setBoardDialogOpen] = useState(false);
  const [automationPanelOpen, setAutomationPanelOpen] = useState(false);
  const [collaborationPanelOpen, setCollaborationPanelOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<BoardRecord | null>(null);
  const [mobileBoardsOpen, setMobileBoardsOpen] = useState(false);
  const { open: desktopSidebarOpen, setOpen: setDesktopSidebarOpen } =
    usePersistedSidebarOpen("kaizenyard-kanban-sidebar-open");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskDefaults, setTaskDefaults] = useState<TaskDialogDefaults | null>(
    null,
  );
  const [activeDragTask, setActiveDragTask] = useState<TaskRecord | null>(null);
  const tasksSnapshotRef = useRef<TaskRecord[]>([]);
  const tasksRef = useRef<TaskRecord[]>([]);
  const notifyBoardChangedRef = useRef<(() => void) | null>(null);

  function notifyBoardChanged() {
    notifyBoardChangedRef.current?.();
  }

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeBoard = boards.find((b) => b.id === activeBoardId) ?? null;

  const loadBoardData = useCallback(async (boardId: number) => {
    const data = await listBoardData(boardId);
    setBoardRole(data.role);
    setColumns(data.columns);
    setTasks(data.tasks);
    setPulseRiskByTaskId(data.pulseRiskByTaskId);
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const boardList = await listBoards();
        if (cancelled) return;
        setBoards(boardList);
        if (boardList.length > 0) {
          const firstId = boardList[0].id;
          setActiveBoardId(firstId);
          await loadBoardData(firstId);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadBoardData]);

  async function selectBoard(boardId: number) {
    const board = boards.find((b) => b.id === boardId);
    if (board) {
      setBoardRole(board.role);
    }
    setActiveBoardId(boardId);
    setMobileBoardsOpen(false);
    await loadBoardData(boardId);
  }

  function showUndo(message: string, snapshot: TaskRecord[]) {
    toast(message, {
      action: {
        label: "Undo",
        onClick: () => setTasks(snapshot),
      },
    });
  }

  function upsertTask(saved: TaskRecord) {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === saved.id);
      if (idx === -1) return [...prev, saved];
      const next = [...prev];
      next[idx] = saved;
      return next;
    });
  }

  function removeTask(taskId: number) {
    const snapshot = [...tasks];
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    showUndo("Task deleted", snapshot);
  }

  function openCreateBoard() {
    setEditingBoard(null);
    setBoardDialogOpen(true);
  }

  function openEditBoard(board: BoardRecord) {
    setEditingBoard(board);
    setBoardDialogOpen(true);
  }

  function handleBoardSaved(result: BoardData | BoardRecord) {
    if ("columns" in result) {
      setBoards((prev) => [...prev, result.board]);
      setActiveBoardId(result.board.id);
      setBoardRole(result.role);
      setColumns(result.columns);
      setTasks(result.tasks);
      return;
    }

    setBoards((prev) =>
      prev.map((b) => (b.id === result.id ? result : b)),
    );
  }

  async function handleBoardDeleted(boardId: number) {
    const nextBoards = boards.filter((b) => b.id !== boardId);
    setBoards(nextBoards);
    if (activeBoardId === boardId) {
      if (nextBoards.length > 0) {
        await selectBoard(nextBoards[0].id);
      } else {
        setActiveBoardId(null);
        setColumns([]);
        setTasks([]);
      }
    }
  }

  function openCreateTask(columnId: number) {
    if (boardRole === "viewer") return;
    setTaskDefaults({ columnId });
    setTaskDialogOpen(true);
  }

  function openEditTask(task: TaskRecord) {
    setTaskDefaults({ task });
    setTaskDialogOpen(true);
  }

  async function handleRenameColumn(columnId: number, name: string) {
    const saved = await updateColumn(columnId, { name });
    setColumns((prev) =>
      prev.map((c) => (c.id === columnId ? saved : c)),
    );
    notifyBoardChanged();
  }

  async function handleChangeColumnColor(columnId: number, color: KanbanColor) {
    const saved = await updateColumn(columnId, { color });
    setColumns((prev) =>
      prev.map((c) => (c.id === columnId ? saved : c)),
    );
    notifyBoardChanged();
  }

  async function handleMoveColumn(columnId: number, direction: "left" | "right") {
    if (boardRole === "viewer") return;
    const sorted = [...columns].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.id - b.id,
    );
    const index = sorted.findIndex((c) => c.id === columnId);
    if (index === -1) return;
    const swapIndex = direction === "left" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;

    const reordered = arrayMove(sorted, index, swapIndex);
    const updated = await reorderColumns(
      activeBoardId!,
      reordered.map((c) => c.id),
    );
    setColumns(updated);
    notifyBoardChanged();
  }

  async function handleDeleteColumn(columnId: number) {
    if (boardRole === "viewer") return;
    if (!confirm("Delete this column? Tasks will move to another column.")) return;
    await deleteColumn(columnId);
    if (activeBoardId) {
      await loadBoardData(activeBoardId);
      notifyBoardChanged();
    }
  }

  function handleDragStart(event: DragStartEvent) {
    if (boardRole === "viewer") return;
    const taskId = parseTaskDragId(String(event.active.id));
    if (taskId === null) return;
    const task = tasks.find((t) => t.id === taskId) ?? null;
    setActiveDragTask(task);
    tasksSnapshotRef.current = [...tasks];
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeTaskId = parseTaskDragId(String(active.id));
    if (activeTaskId === null) return;

    const activeColumnId = findColumnForTask(tasks, activeTaskId);
    const overColumnId = findContainerId(String(over.id), tasks);
    if (activeColumnId === null || overColumnId === null) return;
    if (activeColumnId === overColumnId) return;

    setTasks((prev) => {
      const activeTask = prev.find((t) => t.id === activeTaskId);
      if (!activeTask) return prev;

      const withoutActive = prev.filter((t) => t.id !== activeTaskId);
      const targetTasks = getColumnTasks(withoutActive, overColumnId);

      let insertIndex = targetTasks.length;
      const overTaskId = parseTaskDragId(String(over.id));
      if (overTaskId !== null) {
        const overIndex = targetTasks.findIndex((t) => t.id === overTaskId);
        if (overIndex >= 0) insertIndex = overIndex;
      }

      const movedTask: TaskRecord = {
        ...activeTask,
        columnId: overColumnId,
        sortOrder: insertIndex,
      };

      const nextTarget = [...targetTasks];
      nextTarget.splice(insertIndex, 0, movedTask);

      const reindexedTarget = nextTarget.map((t, i) => ({
        ...t,
        sortOrder: i,
      }));

      const sourceTasks = getColumnTasks(withoutActive, activeColumnId).map(
        (t, i) => ({ ...t, sortOrder: i }),
      );

      const otherTasks = withoutActive.filter(
        (t) => t.columnId !== activeColumnId && t.columnId !== overColumnId,
      );

      return [...otherTasks, ...sourceTasks, ...reindexedTarget];
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    if (boardRole === "viewer") return;
    setActiveDragTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeTaskId = parseTaskDragId(String(active.id));
    if (activeTaskId === null) return;

    const currentTasks = tasksRef.current;
    const activeColumnId = findColumnForTask(currentTasks, activeTaskId);
    const overColumnId = findContainerId(String(over.id), currentTasks);
    if (activeColumnId === null || overColumnId === null) return;

    let nextTasks = [...currentTasks];

    if (activeColumnId === overColumnId) {
      const columnTasks = getColumnTasks(nextTasks, activeColumnId);
      const oldIndex = columnTasks.findIndex((t) => t.id === activeTaskId);
      const overTaskId = parseTaskDragId(String(over.id));
      let newIndex = columnTasks.length - 1;
      if (overTaskId !== null) {
        const overIndex = columnTasks.findIndex((t) => t.id === overTaskId);
        if (overIndex >= 0) newIndex = overIndex;
      }
      if (oldIndex === newIndex) return;

      const reordered = arrayMove(columnTasks, oldIndex, newIndex).map(
        (t, i) => ({ ...t, sortOrder: i }),
      );

      nextTasks = [
        ...nextTasks.filter((t) => t.columnId !== activeColumnId),
        ...reordered,
      ];
    } else {
      const columnTasks = getColumnTasks(nextTasks, overColumnId);
      const orderedIds = columnTasks.map((t) => t.id);
      nextTasks = nextTasks.map((t) => {
        const idx = orderedIds.indexOf(t.id);
        if (idx >= 0) return { ...t, sortOrder: idx };
        return t;
      });
    }

    const snapshot = tasksSnapshotRef.current;
    setTasks(nextTasks);

    try {
      const targetTasks = getColumnTasks(nextTasks, overColumnId);
      const orderedIds = targetTasks.map((t) => t.id);
      const updated = await moveTaskWithReorder(
        activeTaskId,
        overColumnId,
        orderedIds,
      );
      setTasks((prev) => {
        const others = prev.filter((t) => t.columnId !== overColumnId);
        return [...others, ...updated];
      });
      if (activeBoardId) {
        void loadBoardData(activeBoardId);
      }
      notifyBoardChanged();
    } catch {
      setTasks(snapshot);
      toast.error("Failed to move task");
    }
  }

  if (loading) {
    return (
      <KaizenLoadingScreen
        label="Loading kanban"
        className="min-h-[24rem]"
      />
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-4 lg:min-h-[calc(100vh-6rem)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-head text-2xl font-bold tracking-tight">
            Tasks / Kanban
          </h1>
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            Visual workflow boards with calendar sync.
          </p>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <Drawer open={mobileBoardsOpen} onOpenChange={setMobileBoardsOpen}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMobileBoardsOpen(true)}
            >
              <LayoutGrid className="size-4" />
              Boards
            </Button>
            <Drawer.Content className="inset-y-0 left-0 right-auto mt-0 h-full max-h-screen w-[min(18rem,85vw)] max-w-none rounded-none border-r-2 border-t-0 p-4">
              <BoardSidebar
                boards={boards}
                activeBoardId={activeBoardId}
                onSelectBoard={(id) => void selectBoard(id)}
                onNewBoard={openCreateBoard}
                onEditBoard={openEditBoard}
                onBoardDeleted={(id) => void handleBoardDeleted(id)}
                className="w-full border-0 p-0 shadow-none"
              />
            </Drawer.Content>
          </Drawer>
          <Button type="button" onClick={openCreateBoard}>
            <Plus className="size-4" />
            New board
          </Button>
        </div>
      </div>

      {boards.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded border-2 border-border bg-background p-8 text-center shadow-md">
          <p className="font-sans text-muted-foreground">
            Create your first board to start organizing tasks.
          </p>
          <Button type="button" onClick={openCreateBoard}>
            <Plus className="size-4" />
            Create board
          </Button>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
          {desktopSidebarOpen ? (
            <BoardSidebar
              boards={boards}
              activeBoardId={activeBoardId}
              onSelectBoard={(id) => void selectBoard(id)}
              onNewBoard={openCreateBoard}
              onEditBoard={openEditBoard}
              onBoardDeleted={(id) => void handleBoardDeleted(id)}
              onCollapse={() => setDesktopSidebarOpen(false)}
              className="hidden lg:flex"
            />
          ) : (
            <div className="hidden shrink-0 lg:flex">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-full w-9 rounded border-2 border-border p-0 shadow-none"
                onClick={() => setDesktopSidebarOpen(true)}
                aria-label="Show board list"
                title="Show boards"
              >
                <PanelLeft className="size-4" />
              </Button>
            </div>
          )}

          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col rounded border-2 border-border bg-background p-3 shadow-md sm:p-4">
            {!desktopSidebarOpen ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="absolute left-3 top-3 z-10 hidden h-7 w-7 p-0 shadow-none lg:flex sm:left-4 sm:top-4"
                onClick={() => setDesktopSidebarOpen(true)}
                aria-label="Show board list"
                title="Show boards"
              >
                <PanelLeft className="size-3.5" />
              </Button>
            ) : null}
            <div
              className={cn(
                "flex min-h-0 min-w-0 flex-1 flex-col",
                !desktopSidebarOpen && "pt-10 lg:pt-11",
              )}
            >
            {activeBoard && activeBoardId ? (
              <RoomProvider
                id={kanbanBoardRoomId(activeBoardId)}
                key={activeBoardId}
              >
                <ClientSideSuspense
                  fallback={
                    <KaizenLoadingScreen
                      label="Connecting"
                      fullHeight={false}
                      className="min-h-[16rem]"
                    />
                  }
                >
                  <KanbanLiveBoard
                    notifyRef={notifyBoardChangedRef}
                    boardId={activeBoardId}
                    boardRole={boardRole}
                    activeBoard={activeBoard}
                    columns={columns}
                    tasks={tasks}
                    pulseRiskByTaskId={pulseRiskByTaskId}
                    collaborationOpen={collaborationPanelOpen}
                    onCollaborationOpenChange={setCollaborationPanelOpen}
                    onAutomationPanelOpenChange={setAutomationPanelOpen}
                    taskDialogOpen={taskDialogOpen}
                    onTaskDialogOpenChange={setTaskDialogOpen}
                    taskDefaults={taskDefaults}
                    activeDragTask={activeDragTask}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={(e) => void handleDragEnd(e)}
                    onDragCancel={() => setActiveDragTask(null)}
                    onAddTask={openCreateTask}
                    onEditTask={openEditTask}
                    onColumnCreated={(col) => {
                      setColumns((prev) => [...prev, col]);
                      notifyBoardChanged();
                    }}
                    onRenameColumn={(id, name) =>
                      void handleRenameColumn(id, name)
                    }
                    onChangeColumnColor={(id, color) =>
                      void handleChangeColumnColor(id, color)
                    }
                    onMoveColumnLeft={(id) =>
                      void handleMoveColumn(id, "left")
                    }
                    onMoveColumnRight={(id) =>
                      void handleMoveColumn(id, "right")
                    }
                    onDeleteColumn={(id) => void handleDeleteColumn(id)}
                    onTaskSaved={(saved) => {
                      upsertTask(saved);
                      if (activeBoardId) void loadBoardData(activeBoardId);
                      notifyBoardChanged();
                    }}
                    onTaskDeleted={(taskId) => {
                      removeTask(taskId);
                      notifyBoardChanged();
                    }}
                    onRemoteRefresh={() => {
                      if (activeBoardId) void loadBoardData(activeBoardId);
                    }}
                    sensors={sensors}
                  />
                </ClientSideSuspense>
              </RoomProvider>
            ) : null}
            </div>
          </div>
        </div>
      )}

      <BoardDialog
        open={boardDialogOpen}
        onOpenChange={setBoardDialogOpen}
        editing={editingBoard}
        onSaved={handleBoardSaved}
      />

      {activeBoardId ? (
        <>
          <AutomationPanel
            open={automationPanelOpen}
            onOpenChange={setAutomationPanelOpen}
            boardId={activeBoardId}
            columns={columns}
          />
          <div className="fixed bottom-4 right-4 z-20 hidden max-w-xs lg:block">
            <WitnessRetroPanel boardId={activeBoardId} />
          </div>
        </>
      ) : null}
    </div>
  );
}
