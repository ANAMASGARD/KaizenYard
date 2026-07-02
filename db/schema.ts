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
    pulseType: text("pulse_type").notNull().default("meeting"),
    witnessGroupId: integer("witness_group_id"),
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
    witnessAttestationHash: text("witness_attestation_hash"),
    delegateAddress: text("delegate_address"),
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
    categoryKey: text("category_key"),
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

export const whiteboards = pgTable(
  "whiteboards",
  {
    id: serial("id").primaryKey(),
    clerkId: text("clerk_id").notNull(),
    title: text("title").notNull().default("Untitled"),
    color: text("color").notNull().default("yellow"),
    content: jsonb("content")
      .notNull()
      .default({ elements: [], appState: {}, files: {} }),
    pinned: boolean("pinned").default(false).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("whiteboards_clerk_deleted_idx").on(table.clerkId, table.deletedAt),
    index("whiteboards_clerk_updated_idx").on(table.clerkId, table.updatedAt),
  ],
);

export const whiteboardCollaborators = pgTable(
  "whiteboard_collaborators",
  {
    id: serial("id").primaryKey(),
    whiteboardId: integer("whiteboard_id")
      .notNull()
      .references(() => whiteboards.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    clerkId: text("clerk_id"),
    role: text("role").notNull().default("editor"),
    invitedByClerkId: text("invited_by_clerk_id").notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("whiteboard_collaborators_board_email_idx").on(
      table.whiteboardId,
      table.email,
    ),
    index("whiteboard_collaborators_clerk_id_idx").on(table.clerkId),
  ],
);

export type Whiteboard = typeof whiteboards.$inferSelect;
export type NewWhiteboard = typeof whiteboards.$inferInsert;
export type WhiteboardCollaborator = typeof whiteboardCollaborators.$inferSelect;

export const spaces = pgTable(
  "spaces",
  {
    id: serial("id").primaryKey(),
    clerkId: text("clerk_id").notNull(),
    name: text("name").notNull().default("Untitled Space"),
    description: text("description"),
    color: text("color").notNull().default("yellow"),
    isVault: boolean("is_vault").default(false).notNull(),
    vaultCommitment: text("vault_commitment"),
    vaultSalt: text("vault_salt"),
    stellarNullifierRoot: text("stellar_nullifier_root"),
    pinned: boolean("pinned").default(false).notNull(),
    isFavorite: boolean("is_favorite").default(false).notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("spaces_clerk_deleted_idx").on(table.clerkId, table.deletedAt),
    index("spaces_clerk_updated_idx").on(table.clerkId, table.updatedAt),
  ],
);

export const spaceCollaborators = pgTable(
  "space_collaborators",
  {
    id: serial("id").primaryKey(),
    spaceId: integer("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    clerkId: text("clerk_id"),
    role: text("role").notNull().default("editor"),
    invitedByClerkId: text("invited_by_clerk_id").notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("space_collaborators_space_email_idx").on(table.spaceId, table.email),
    index("space_collaborators_clerk_id_idx").on(table.clerkId),
  ],
);

export const pages = pgTable(
  "pages",
  {
    id: serial("id").primaryKey(),
    spaceId: integer("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    clerkId: text("clerk_id").notNull(),
    title: text("title").notNull().default("Untitled"),
    template: text("template").notNull().default("blank"),
    content: jsonb("content").notNull().default({ type: "doc", content: [] }),
    isFavorite: boolean("is_favorite").default(false).notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    sortOrder: integer("sort_order").default(0).notNull(),
    lastEditedByClerkId: text("last_edited_by_clerk_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("pages_space_deleted_idx").on(table.spaceId, table.deletedAt),
    index("pages_clerk_updated_idx").on(table.clerkId, table.updatedAt),
  ],
);

export const spaceFiles = pgTable(
  "space_files",
  {
    id: serial("id").primaryKey(),
    spaceId: integer("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    pageId: integer("page_id").references(() => pages.id, { onDelete: "set null" }),
    clerkId: text("clerk_id").notNull(),
    name: text("name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    dataBase64: text("data_base64").notNull(),
    isFavorite: boolean("is_favorite").default(false).notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("space_files_space_deleted_idx").on(table.spaceId, table.deletedAt),
    index("space_files_clerk_idx").on(table.clerkId),
  ],
);

export const generatedApps = pgTable(
  "generated_apps",
  {
    id: serial("id").primaryKey(),
    clerkId: text("clerk_id").notNull(),
    appName: text("app_name").notNull(),
    description: text("description").notNull().default(""),
    icon: text("icon").notNull().default("LayoutTemplate"),
    color: text("color").notNull().default("#F97316"),
    layout: text("layout").notNull().default("single-page"),
    definition: jsonb("definition").notNull(),
    runtimeState: jsonb("runtime_state").notNull().default({}),
    sidebarPinned: boolean("sidebar_pinned").notNull().default(false),
    sidebarOrder: integer("sidebar_order"),
    shareToken: text("share_token").unique(),
    shareEnabled: boolean("share_enabled").notNull().default(false),
    shareMode: text("share_mode").notNull().default("private"),
    isZkShare: boolean("is_zk_share").notNull().default(false),
    shareCommitment: text("share_commitment"),
    shareSalt: text("share_salt"),
    shareNullifierRoot: text("share_nullifier_root"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("generated_apps_clerk_idx").on(table.clerkId),
    index("generated_apps_clerk_pinned_idx").on(table.clerkId, table.sidebarPinned),
  ],
);

export const generatedAppCollaborators = pgTable(
  "generated_app_collaborators",
  {
    id: serial("id").primaryKey(),
    appId: integer("app_id")
      .notNull()
      .references(() => generatedApps.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    clerkId: text("clerk_id"),
    role: text("role").notNull(),
    invitedByClerkId: text("invited_by_clerk_id").notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("generated_app_collaborators_app_email_idx").on(table.appId, table.email),
    index("generated_app_collaborators_clerk_idx").on(table.clerkId),
  ],
);

export type Space = typeof spaces.$inferSelect;
export type NewSpace = typeof spaces.$inferInsert;
export type SpaceCollaborator = typeof spaceCollaborators.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
export type SpaceFile = typeof spaceFiles.$inferSelect;
export type NewSpaceFile = typeof spaceFiles.$inferInsert;
export type GeneratedApp = typeof generatedApps.$inferSelect;
export type NewGeneratedApp = typeof generatedApps.$inferInsert;
export type GeneratedAppCollaborator =
  typeof generatedAppCollaborators.$inferSelect;
export type NewGeneratedAppCollaborator =
  typeof generatedAppCollaborators.$inferInsert;

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  defaultCalendarView: text("default_calendar_view").default("week").notNull(),
  defaultTaskPriority: text("default_task_priority").default("medium").notNull(),
  dateFormat: text("date_format").default("MMM d, yyyy").notNull(),
  timeFormat: text("time_format").default("12h").notNull(),
  weekStartsOn: integer("week_starts_on").default(0).notNull(),
  autoSave: boolean("auto_save").default(true).notNull(),
  compactMode: boolean("compact_mode").default(false).notNull(),
  showCompletedTasks: boolean("show_completed_tasks").default(true).notNull(),
  timezone: text("timezone").default("UTC").notNull(),
  locale: text("locale").default("en").notNull(),
  accentColor: text("accent_color").default("yellow").notNull(),
  aiModel: text("ai_model").default("qwen/qwen3.5-flash-02-23").notNull(),
  aiBehavior: text("ai_behavior").default("balanced").notNull(),
  aiTone: text("ai_tone").default("friendly").notNull(),
  aiOutputLanguage: text("ai_output_language").default("en").notNull(),
  aiFeatures: jsonb("ai_features")
    .notNull()
    .default({
      refine: true,
      assistant: true,
      templates: true,
      autoSuggestions: true,
      summarization: true,
      notesAi: true,
      tasksAi: true,
    }),
  allowAiDataUsage: boolean("allow_ai_data_usage").default(true).notNull(),
  notifications: jsonb("notifications")
    .notNull()
    .default({
      email: true,
      taskReminders: true,
      comments: true,
      marketing: false,
      systemUpdates: true,
      push: false,
      dueDateAlertOffset: "1d",
    }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userCategories = pgTable(
  "user_categories",
  {
    id: serial("id").primaryKey(),
    clerkId: text("clerk_id").notNull(),
    module: text("module").notNull(),
    key: text("key").notNull(),
    name: text("name").notNull(),
    color: text("color").notNull().default("blue"),
    icon: text("icon").notNull().default("tag"),
    sortOrder: integer("sort_order").default(0).notNull(),
    isSystem: boolean("is_system").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_categories_clerk_module_key_idx").on(
      table.clerkId,
      table.module,
      table.key,
    ),
    index("user_categories_clerk_module_sort_idx").on(
      table.clerkId,
      table.module,
      table.sortOrder,
    ),
  ],
);

export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
export type UserCategory = typeof userCategories.$inferSelect;
export type NewUserCategory = typeof userCategories.$inferInsert;

export const assistantSessions = pgTable(
  "assistant_sessions",
  {
    id: serial("id").primaryKey(),
    clerkId: text("clerk_id").notNull(),
    title: text("title").notNull().default("New chat"),
    privacyMode: text("privacy_mode").notNull().default("standard"),
    agentSessionId: text("agent_session_id").notNull().unique(),
    delegateAddress: text("delegate_address"),
    witnessGroupId: integer("witness_group_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    llmViewSnapshot: text("llm_view_snapshot"),
    llmViewUpdatedAt: timestamp("llm_view_updated_at", { withTimezone: true }),
  },
  (table) => [
    index("assistant_sessions_clerk_updated_idx").on(table.clerkId, table.lastMessageAt),
    index("assistant_sessions_agent_session_idx").on(table.agentSessionId),
  ],
);

export const assistantMessages = pgTable(
  "assistant_messages",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
      .notNull()
      .references(() => assistantSessions.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    parts: jsonb("parts").notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("assistant_messages_session_idx").on(table.sessionId, table.createdAt)],
);

export const assistantPrivacyMaps = pgTable(
  "assistant_privacy_maps",
  {
    id: serial("id").primaryKey(),
    agentSessionId: text("agent_session_id").notNull(),
    clerkId: text("clerk_id").notNull(),
    encryptedMap: text("encrypted_map").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("assistant_privacy_maps_agent_session_idx").on(table.agentSessionId),
    index("assistant_privacy_maps_expires_idx").on(table.expiresAt),
  ],
);

export const witnessGroups = pgTable(
  "witness_groups",
  {
    id: serial("id").primaryKey(),
    ownerClerkId: text("owner_clerk_id").notNull(),
    name: text("name").notNull(),
    commitment: text("commitment"),
    merkleRoot: text("merkle_root"),
    boardId: integer("board_id").references(() => kanbanBoards.id, { onDelete: "set null" }),
    calendarPulseId: integer("calendar_pulse_id").references(() => calendarMeetingPulses.id, {
      onDelete: "set null",
    }),
    boardPulseId: integer("board_pulse_id"),
    isOpen: boolean("is_open").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("witness_groups_owner_idx").on(table.ownerClerkId)],
);

export const witnessAttestations = pgTable(
  "witness_attestations",
  {
    id: serial("id").primaryKey(),
    witnessGroupId: integer("witness_group_id")
      .notNull()
      .references(() => witnessGroups.id, { onDelete: "cascade" }),
    clerkId: text("clerk_id").notNull(),
    nullifier: text("nullifier").notNull(),
    actionHash: text("action_hash").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: integer("resource_id"),
    txHash: text("tx_hash"),
    privacyMode: text("privacy_mode").notNull().default("witness"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("witness_attestations_nullifier_idx").on(table.nullifier),
    index("witness_attestations_group_idx").on(table.witnessGroupId),
  ],
);

export const kanbanBoardPulses = pgTable(
  "kanban_board_pulses",
  {
    id: serial("id").primaryKey(),
    boardId: integer("board_id")
      .notNull()
      .references(() => kanbanBoards.id, { onDelete: "cascade" }),
    ownerClerkId: text("owner_clerk_id").notNull(),
    question: text("question").notNull(),
    pulseType: text("pulse_type").notNull().default("retro"),
    shareToken: text("share_token").notNull().unique(),
    witnessGroupId: integer("witness_group_id").references(() => witnessGroups.id, {
      onDelete: "set null",
    }),
    isOpen: boolean("is_open").default(true).notNull(),
    closesAt: timestamp("closes_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("kanban_board_pulses_board_idx").on(table.boardId)],
);

export type AssistantSession = typeof assistantSessions.$inferSelect;
export type NewAssistantSession = typeof assistantSessions.$inferInsert;
export type AssistantMessage = typeof assistantMessages.$inferSelect;
export type AssistantPrivacyMap = typeof assistantPrivacyMaps.$inferSelect;
export type WitnessGroup = typeof witnessGroups.$inferSelect;
export type WitnessAttestation = typeof witnessAttestations.$inferSelect;
export type KanbanBoardPulse = typeof kanbanBoardPulses.$inferSelect;
