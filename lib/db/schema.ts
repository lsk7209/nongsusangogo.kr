import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const pageStatuses = [
  "draft",
  "enriched",
  "quality_passed",
  "published",
  "demoted",
  "rejected",
] as const;

export const unitTypes = ["unknown", "weight", "count", "volume"] as const;
export const ranks = ["high", "middle", "low", "unknown"] as const;
export const wsrtKinds = ["wholesale", "retail"] as const;
export const gateRunSources = ["mock", "http", "manual"] as const;
export const gateRunStatuses = ["success", "failed"] as const;
export const gateStatuses = ["pass", "fail", "pending", "branch"] as const;

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
};

export const dataSources = sqliteTable("data_sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  baseUrl: text("base_url"),
  licenseStatus: text("license_status").notNull().default("unconfirmed"),
  ...timestamps,
});

export const itemCodes = sqliteTable("item_codes", {
  itemCode: text("item_code").primaryKey(),
  itemName: text("item_name").notNull(),
  kindCode: text("kind_code").notNull(),
  kindName: text("kind_name").notNull(),
  category: text("category").notNull(),
  sourceId: integer("source_id").references(() => dataSources.id),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

export const itemMeta = sqliteTable("item_meta", {
  itemCode: text("item_code")
    .primaryKey()
    .references(() => itemCodes.itemCode),
  unit: text("unit").notNull(),
  unitType: text("unit_type", { enum: unitTypes }).notNull().default("unknown"),
  weightG: real("weight_g"),
  isDiscountCapable: integer("is_discount_capable", {
    mode: "boolean",
  })
    .notNull()
    .default(false),
  category: text("category").notNull(),
  ...timestamps,
});

export const priceDaily = sqliteTable(
  "price_daily",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: text("date").notNull(),
    itemCode: text("item_code")
      .notNull()
      .references(() => itemCodes.itemCode),
    kindCode: text("kind_code").notNull(),
    rank: text("rank", { enum: ranks }).notNull().default("unknown"),
    wsrt: text("wsrt", { enum: wsrtKinds }).notNull(),
    regionCode: text("region_code"),
    price: integer("price"),
    pricePerKg: real("price_per_kg"),
    isDiscount: integer("is_discount", { mode: "boolean" })
      .notNull()
      .default(false),
    prevDay: integer("prev_day"),
    m1Ma5: real("m1_ma5"),
    y1Ma5: real("y1_ma5"),
    normal3yr: real("normal_3yr"),
    rawPayload: text("raw_payload", { mode: "json" }),
    ...timestamps,
  },
  (table) => ({
    itemDateIdx: index("price_daily_item_date_idx").on(
      table.itemCode,
      table.date,
    ),
    uniqueObservation: uniqueIndex("price_daily_unique_observation").on(
      table.date,
      table.itemCode,
      table.kindCode,
      table.rank,
      table.wsrt,
      table.regionCode,
    ),
  }),
);

export const priceMonthly = sqliteTable("price_monthly", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  month: text("month").notNull(),
  itemCode: text("item_code")
    .notNull()
    .references(() => itemCodes.itemCode),
  kindCode: text("kind_code").notNull(),
  rank: text("rank", { enum: ranks }).notNull().default("unknown"),
  wsrt: text("wsrt", { enum: wsrtKinds }).notNull(),
  regionCode: text("region_code"),
  price: integer("price"),
  rawPayload: text("raw_payload", { mode: "json" }),
  ...timestamps,
});

export const priceYearly = sqliteTable("price_yearly", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  year: text("year").notNull(),
  itemCode: text("item_code")
    .notNull()
    .references(() => itemCodes.itemCode),
  kindCode: text("kind_code").notNull(),
  rank: text("rank", { enum: ranks }).notNull().default("unknown"),
  wsrt: text("wsrt", { enum: wsrtKinds }).notNull(),
  regionCode: text("region_code"),
  price: integer("price"),
  rawPayload: text("raw_payload", { mode: "json" }),
  ...timestamps,
});

export const substitutes = sqliteTable(
  "substitutes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    itemCode: text("item_code")
      .notNull()
      .references(() => itemCodes.itemCode),
    subItemCode: text("sub_item_code")
      .notNull()
      .references(() => itemCodes.itemCode),
    relation: text("relation").notNull(),
    ...timestamps,
  },
  (table) => ({
    uniqueSubstitute: uniqueIndex("substitutes_unique_pair").on(
      table.itemCode,
      table.subItemCode,
    ),
  }),
);

export const seasonCalendar = sqliteTable("season_calendar", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  event: text("event").notNull(),
  leadWeeks: integer("lead_weeks").notNull(),
  targetItems: text("target_items", { mode: "json" }).notNull(),
  targetHubs: text("target_hubs", { mode: "json" }).notNull(),
  ...timestamps,
});

export const hubs = sqliteTable("hubs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  category: text("category"),
  regionCode: text("region_code"),
  status: text("status", { enum: pageStatuses }).notNull().default("draft"),
  ...timestamps,
});

export const pages = sqliteTable("pages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  itemCode: text("item_code").references(() => itemCodes.itemCode),
  hubId: integer("hub_id").references(() => hubs.id),
  title: text("title").notNull(),
  status: text("status", { enum: pageStatuses }).notNull().default("draft"),
  qualityScore: real("quality_score"),
  gatePassed: integer("gate_passed", { mode: "boolean" })
    .notNull()
    .default(false),
  activeSections: text("active_sections", { mode: "json" }).notNull(),
  uniquePoints: text("unique_points", { mode: "json" }).notNull(),
  firstPublishedAt: integer("first_published_at", { mode: "timestamp" }),
  rawData: text("raw_data", { mode: "json" }),
  aiCommentary: text("ai_commentary"),
  faq: text("faq", { mode: "json" }),
  ...timestamps,
});

export const fillers = sqliteTable("fillers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  status: text("status", { enum: pageStatuses }).notNull().default("draft"),
  ...timestamps,
});

export const evergreens = sqliteTable("evergreens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  status: text("status", { enum: pageStatuses }).notNull().default("draft"),
  ...timestamps,
});

export const publishLog = sqliteTable("publish_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pageId: integer("page_id")
    .notNull()
    .references(() => pages.id),
  fromStatus: text("from_status", { enum: pageStatuses }).notNull(),
  toStatus: text("to_status", { enum: pageStatuses }).notNull(),
  reason: text("reason").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const collectCheckpoints = sqliteTable(
  "collect_checkpoints",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sourceCode: text("source_code").notNull(),
    scopeKey: text("scope_key").notNull(),
    cursor: text("cursor"),
    lastSuccessAt: integer("last_success_at", { mode: "timestamp" }),
    state: text("state", { mode: "json" }),
    ...timestamps,
  },
  (table) => ({
    uniqueScope: uniqueIndex("collect_checkpoints_unique_scope").on(
      table.sourceCode,
      table.scopeKey,
    ),
  }),
);

export const gateRuns = sqliteTable(
  "gate_runs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    source: text("source", { enum: gateRunSources }).notNull(),
    status: text("status", { enum: gateRunStatuses }).notNull(),
    rawReport: text("raw_report", { mode: "json" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    createdAtIdx: index("gate_runs_created_at_idx").on(table.createdAt),
  }),
);

export const gateDecisions = sqliteTable(
  "gate_decisions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    checkId: text("check_id").notNull().unique(),
    label: text("label").notNull(),
    status: text("status", { enum: gateStatuses }).notNull(),
    decision: text("decision").notNull(),
    measuredValue: text("measured_value"),
    sourceRunId: integer("source_run_id").references(() => gateRuns.id),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    checkStatusIdx: index("gate_decisions_status_idx").on(table.status),
  }),
);

export const itemRelations = relations(itemCodes, ({ one, many }) => ({
  meta: one(itemMeta, {
    fields: [itemCodes.itemCode],
    references: [itemMeta.itemCode],
  }),
  dailyPrices: many(priceDaily),
  pages: many(pages),
}));

export const itemMetaRelations = relations(itemMeta, ({ one }) => ({
  item: one(itemCodes, {
    fields: [itemMeta.itemCode],
    references: [itemCodes.itemCode],
  }),
}));

export const gateRunRelations = relations(gateRuns, ({ many }) => ({
  decisions: many(gateDecisions),
}));

export const gateDecisionRelations = relations(gateDecisions, ({ one }) => ({
  sourceRun: one(gateRuns, {
    fields: [gateDecisions.sourceRunId],
    references: [gateRuns.id],
  }),
}));
