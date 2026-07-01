import {
  boolean,
  index,
  integer,
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
