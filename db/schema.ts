import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  name: text("name"),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const calendarItems = pgTable(
  "calendar_items",
  {
    id: serial("id").primaryKey(),
    clerkId: text("clerk_id").notNull(),
    title: text("title").notNull(),
    itemType: text("item_type").notNull(),
    category: text("category").notNull(),
    description: text("description"),
    location: text("location"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    durationMin: integer("duration_min").default(60).notNull(),
    recurrenceRule: text("recurrence_rule"),
    bufferBeforeMin: integer("buffer_before_min").default(0).notNull(),
    bufferAfterMin: integer("buffer_after_min").default(0).notNull(),
    isPrivate: boolean("is_private").default(false).notNull(),
    attendeeCount: integer("attendee_count").default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("calendar_items_clerk_scheduled_idx").on(table.clerkId, table.scheduledAt),
  ],
);

export const calendarItemExceptions = pgTable(
  "calendar_item_exceptions",
  {
    id: serial("id").primaryKey(),
    itemId: integer("item_id")
      .notNull()
      .references(() => calendarItems.id, { onDelete: "cascade" }),
    originalStartAt: timestamp("original_start_at", { withTimezone: true }).notNull(),
    status: text("status").notNull(),
    overrideScheduledAt: timestamp("override_scheduled_at", { withTimezone: true }),
    overrideDurationMin: integer("override_duration_min"),
    overrideTitle: text("override_title"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("calendar_item_exceptions_item_original_idx").on(
      table.itemId,
      table.originalStartAt,
    ),
  ],
);

export const calendarSettings = pgTable("calendar_settings", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  weeklyFocusGoalHours: integer("weekly_focus_goal_hours").default(10).notNull(),
  noMeetingWeekdays: integer("no_meeting_weekdays").array().default([]).notNull(),
  workDayStartMin: integer("work_day_start_min").default(540).notNull(),
  workDayEndMin: integer("work_day_end_min").default(1080).notNull(),
  avgHourlyRateCents: integer("avg_hourly_rate_cents").default(7500).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const calendarMeetingPulses = pgTable(
  "calendar_meeting_pulses",
  {
    id: serial("id").primaryKey(),
    ownerClerkId: text("owner_clerk_id").notNull(),
    calendarItemId: integer("calendar_item_id").references(() => calendarItems.id, {
      onDelete: "set null",
    }),
    question: text("question").notNull(),
    shareToken: text("share_token").notNull().unique(),
    isOpen: boolean("is_open").default(true).notNull(),
    closesAt: timestamp("closes_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("calendar_meeting_pulses_item_idx").on(table.calendarItemId)],
);

export const calendarPulseVotes = pgTable(
  "calendar_pulse_votes",
  {
    id: serial("id").primaryKey(),
    pulseId: integer("pulse_id")
      .notNull()
      .references(() => calendarMeetingPulses.id, { onDelete: "cascade" }),
    voterTokenHash: text("voter_token_hash").notNull(),
    vote: text("vote").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("calendar_pulse_votes_pulse_voter_idx").on(
      table.pulseId,
      table.voterTokenHash,
    ),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type CalendarItem = typeof calendarItems.$inferSelect;
export type NewCalendarItem = typeof calendarItems.$inferInsert;
export type CalendarItemException = typeof calendarItemExceptions.$inferSelect;
export type CalendarSettings = typeof calendarSettings.$inferSelect;
export type CalendarMeetingPulse = typeof calendarMeetingPulses.$inferSelect;
export type CalendarPulseVote = typeof calendarPulseVotes.$inferSelect;

export const kanbanBoards = pgTable(
  "kanban_boards",
  {
    id: serial("id").primaryKey(),
    clerkId: text("clerk_id").notNull(),
    name: text("name").notNull(),
    color: text("color").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("kanban_boards_clerk_sort_idx").on(table.clerkId, table.sortOrder)],
);

export const kanbanColumns = pgTable(
  "kanban_columns",
  {
    id: serial("id").primaryKey(),
    boardId: integer("board_id")
      .notNull()
      .references(() => kanbanBoards.id, { onDelete: "cascade" }),
    clerkId: text("clerk_id").notNull(),
    name: text("name").notNull(),
    color: text("color").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("kanban_columns_board_sort_idx").on(table.boardId, table.sortOrder)],
);

export const kanbanTasks = pgTable(
  "kanban_tasks",
  {
    id: serial("id").primaryKey(),
    columnId: integer("column_id")
      .notNull()
      .references(() => kanbanColumns.id, { onDelete: "cascade" }),
    clerkId: text("clerk_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    priority: text("priority").default("medium").notNull(),
    labels: text("labels").array().default([]).notNull(),
    syncCalendar: boolean("sync_calendar").default(false).notNull(),
    linkNotes: boolean("link_notes").default(false).notNull(),
    calendarItemId: integer("calendar_item_id").references(() => calendarItems.id, {
      onDelete: "set null",
    }),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("kanban_tasks_column_sort_idx").on(table.columnId, table.sortOrder)],
);

export type KanbanBoard = typeof kanbanBoards.$inferSelect;
export type NewKanbanBoard = typeof kanbanBoards.$inferInsert;
export type KanbanColumn = typeof kanbanColumns.$inferSelect;
export type NewKanbanColumn = typeof kanbanColumns.$inferInsert;
export type KanbanTask = typeof kanbanTasks.$inferSelect;
export type NewKanbanTask = typeof kanbanTasks.$inferInsert;

export const kanbanTaskPulses = pgTable(
  "kanban_task_pulses",
  {
    id: serial("id").primaryKey(),
    taskId: integer("task_id")
      .notNull()
      .references(() => kanbanTasks.id, { onDelete: "cascade" }),
    ownerClerkId: text("owner_clerk_id").notNull(),
    question: text("question").notNull(),
    shareToken: text("share_token").notNull().unique(),
    isOpen: boolean("is_open").default(true).notNull(),
    closesAt: timestamp("closes_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("kanban_task_pulses_task_idx").on(table.taskId)],
);

export const kanbanTaskPulseVotes = pgTable(
  "kanban_task_pulse_votes",
  {
    id: serial("id").primaryKey(),
    pulseId: integer("pulse_id")
      .notNull()
      .references(() => kanbanTaskPulses.id, { onDelete: "cascade" }),
    voterTokenHash: text("voter_token_hash").notNull(),
    vote: text("vote").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("kanban_task_pulse_votes_pulse_voter_idx").on(
      table.pulseId,
      table.voterTokenHash,
    ),
  ],
);

export const kanbanAutomations = pgTable(
  "kanban_automations",
  {
    id: serial("id").primaryKey(),
    boardId: integer("board_id")
      .notNull()
      .references(() => kanbanBoards.id, { onDelete: "cascade" }),
    clerkId: text("clerk_id").notNull(),
    name: text("name"),
    triggerType: text("trigger_type").notNull(),
    triggerConfig: jsonb("trigger_config").notNull().default({}),
    actionType: text("action_type").notNull(),
    actionConfig: jsonb("action_config").notNull().default({}),
    isEnabled: boolean("is_enabled").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("kanban_automations_board_sort_idx").on(table.boardId, table.sortOrder)],
);

export const kanbanBoardCollaborators = pgTable(
  "kanban_board_collaborators",
  {
    id: serial("id").primaryKey(),
    boardId: integer("board_id")
      .notNull()
      .references(() => kanbanBoards.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    clerkId: text("clerk_id"),
    role: text("role").notNull().default("editor"),
    invitedByClerkId: text("invited_by_clerk_id").notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("kanban_board_collaborators_board_email_idx").on(
      table.boardId,
      table.email,
    ),
    index("kanban_board_collaborators_clerk_id_idx").on(table.clerkId),
  ],
);

export type KanbanTaskPulse = typeof kanbanTaskPulses.$inferSelect;
export type KanbanTaskPulseVote = typeof kanbanTaskPulseVotes.$inferSelect;
export type KanbanAutomation = typeof kanbanAutomations.$inferSelect;
export type KanbanBoardCollaborator = typeof kanbanBoardCollaborators.$inferSelect;

export const notes = pgTable(
  "notes",
  {
    id: serial("id").primaryKey(),
    clerkId: text("clerk_id").notNull(),
    title: text("title").notNull().default("Untitled"),
    color: text("color").notNull().default("yellow"),
    content: jsonb("content").notNull().default({ type: "doc", content: [] }),
    pinned: boolean("pinned").default(false).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("notes_clerk_deleted_idx").on(table.clerkId, table.deletedAt),
    index("notes_clerk_updated_idx").on(table.clerkId, table.updatedAt),
  ],
);

export const noteCollaborators = pgTable(
  "note_collaborators",
  {
    id: serial("id").primaryKey(),
    noteId: integer("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    clerkId: text("clerk_id"),
    role: text("role").notNull().default("editor"),
    invitedByClerkId: text("invited_by_clerk_id").notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("note_collaborators_note_email_idx").on(table.noteId, table.email),
    index("note_collaborators_clerk_id_idx").on(table.clerkId),
  ],
);

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type NoteCollaborator = typeof noteCollaborators.$inferSelect;
