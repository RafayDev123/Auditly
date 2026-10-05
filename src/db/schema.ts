import {
  bigint,
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const subscriptionPlanEnum = pgEnum("subscription_plan", ["free", "pro", "agency"]);
export const auditStatusEnum = pgEnum("audit_status", ["queued", "running", "completed", "failed", "partial"]);
export const auditStageStatusEnum = pgEnum("audit_stage_status", ["pending", "running", "completed", "failed"]);
export const categoryEnum = pgEnum("audit_category", ["performance", "seo", "accessibility", "best_practices", "security", "ux", "technology"]);
export const severityEnum = pgEnum("severity", ["critical", "high", "medium", "low", "info"]);
export const findingStatusEnum = pgEnum("finding_status", ["open", "resolved", "dismissed"]);
export const techConfidenceEnum = pgEnum("tech_confidence", ["high", "medium", "low"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    fullName: varchar("full_name", { length: 140 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    avatarUrl: text("avatar_url"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    emailUnique: uniqueIndex("users_email_unique").on(t.email),
  }),
);

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 64 }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("auth_sessions_user_id_idx").on(t.userId),
    tokenUnique: uniqueIndex("auth_sessions_token_hash_unique").on(t.tokenHash),
  }),
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("password_reset_tokens_user_id_idx").on(t.userId),
    tokenUnique: uniqueIndex("password_reset_tokens_token_hash_unique").on(t.tokenHash),
  }),
);

export const websites = pgTable(
  "websites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    domain: varchar("domain", { length: 255 }).notNull(),
    normalizedUrl: text("normalized_url").notNull(),
    latestAuditId: uuid("latest_audit_id"),
    monitoringEnabled: boolean("monitoring_enabled").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("websites_user_id_idx").on(t.userId),
    domainIdx: index("websites_domain_idx").on(t.domain),
    uniquePerUser: uniqueIndex("websites_user_domain_unique").on(t.userId, t.domain),
  }),
);

export const audits = pgTable(
  "audits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    websiteId: uuid("website_id")
      .notNull()
      .references(() => websites.id, { onDelete: "cascade" }),
    targetUrl: text("target_url").notNull(),
    status: auditStatusEnum("status").default("queued").notNull(),
    scoreVersion: varchar("score_version", { length: 16 }).default("1.0").notNull(),
    overallScore: integer("overall_score"),
    performanceScore: integer("performance_score"),
    seoScore: integer("seo_score"),
    accessibilityScore: integer("accessibility_score"),
    securityScore: integer("security_score"),
    uxScore: integer("ux_score"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    errorMessage: text("error_message"),
    scanConfig: jsonb("scan_config").$type<{
      pagesToScan?: number;
      mobile?: boolean;
      deepCrawl?: boolean;
      detectTech?: boolean;
      jsRendering?: boolean;
    }>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("audits_user_id_idx").on(t.userId),
    websiteIdx: index("audits_website_id_idx").on(t.websiteId),
    createdIdx: index("audits_created_at_idx").on(t.createdAt),
    statusIdx: index("audits_status_idx").on(t.status),
  }),
);

export const auditStages = pgTable(
  "audit_stages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditId: uuid("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "cascade" }),
    stageKey: varchar("stage_key", { length: 64 }).notNull(),
    label: varchar("label", { length: 120 }).notNull(),
    sortOrder: integer("sort_order").notNull(),
    status: auditStageStatusEnum("status").default("pending").notNull(),
    details: text("details"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    auditIdx: index("audit_stages_audit_id_idx").on(t.auditId),
    uniqueStage: uniqueIndex("audit_stages_audit_stage_unique").on(t.auditId, t.stageKey),
  }),
);

export const auditMetrics = pgTable(
  "audit_metrics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditId: uuid("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "cascade" }),
    category: categoryEnum("category").notNull(),
    metricKey: varchar("metric_key", { length: 128 }).notNull(),
    metricLabel: varchar("metric_label", { length: 140 }).notNull(),
    numericValue: doublePrecision("numeric_value"),
    unit: varchar("unit", { length: 32 }),
    status: severityEnum("status").notNull(),
    source: varchar("source", { length: 64 }).default("lab").notNull(),
    evidence: jsonb("evidence").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    auditIdx: index("audit_metrics_audit_id_idx").on(t.auditId),
    categoryIdx: index("audit_metrics_category_idx").on(t.category),
  }),
);

export const auditFindings = pgTable(
  "audit_findings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditId: uuid("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "cascade" }),
    category: categoryEnum("category").notNull(),
    severity: severityEnum("severity").notNull(),
    status: findingStatusEnum("status").default("open").notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    summary: text("summary").notNull(),
    whyItMatters: text("why_it_matters").notNull(),
    recommendedFix: text("recommended_fix").notNull(),
    technicalDetails: text("technical_details"),
    aiExplanation: text("ai_explanation"),
    affectedUrl: text("affected_url"),
    evidence: jsonb("evidence").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    auditIdx: index("audit_findings_audit_id_idx").on(t.auditId),
    categoryIdx: index("audit_findings_category_idx").on(t.category),
    severityIdx: index("audit_findings_severity_idx").on(t.severity),
  }),
);

export const technologies = pgTable(
  "technologies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 80 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    category: varchar("category", { length: 80 }).notNull(),
    icon: varchar("icon", { length: 80 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    slugUnique: uniqueIndex("technologies_slug_unique").on(t.slug),
    nameUnique: uniqueIndex("technologies_name_unique").on(t.name),
  }),
);

export const auditTechnologies = pgTable(
  "audit_technologies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditId: uuid("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "cascade" }),
    technologyId: uuid("technology_id").references(() => technologies.id, { onDelete: "set null" }),
    name: varchar("name", { length: 120 }).notNull(),
    category: varchar("category", { length: 80 }).notNull(),
    confidence: techConfidenceEnum("confidence").notNull(),
    evidence: jsonb("evidence").$type<{ signals: string[]; version?: string | null }>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    auditIdx: index("audit_technologies_audit_id_idx").on(t.auditId),
    nameIdx: index("audit_technologies_name_idx").on(t.name),
  }),
);

export const recommendations = pgTable(
  "recommendations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditId: uuid("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "cascade" }),
    findingId: uuid("finding_id").references(() => auditFindings.id, { onDelete: "set null" }),
    priority: integer("priority").notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    description: text("description").notNull(),
    impact: text("impact").notNull(),
    effort: varchar("effort", { length: 32 }).default("medium").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    auditIdx: index("recommendations_audit_id_idx").on(t.auditId),
  }),
);

export const auditAiSummaries = pgTable(
  "audit_ai_summaries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditId: uuid("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "cascade" }),
    model: varchar("model", { length: 120 }),
    summary: text("summary").notNull(),
    topProblems: jsonb("top_problems").$type<string[]>().notNull(),
    quickWins: jsonb("quick_wins").$type<string[]>().notNull(),
    recommendedOrder: jsonb("recommended_order").$type<string[]>().notNull(),
    businessImpact: text("business_impact").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    auditIdx: uniqueIndex("audit_ai_summaries_audit_id_unique").on(t.auditId),
  }),
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    plan: subscriptionPlanEnum("plan").default("free").notNull(),
    status: varchar("status", { length: 40 }).default("active").notNull(),
    auditsPerMonthLimit: integer("audits_per_month_limit").default(10).notNull(),
    websitesLimit: integer("websites_limit").default(3).notNull(),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }).defaultNow().notNull(),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userUnique: uniqueIndex("subscriptions_user_id_unique").on(t.userId),
  }),
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 160 }).notNull(),
    body: text("body").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("notifications_user_id_idx").on(t.userId),
    createdIdx: index("notifications_created_at_idx").on(t.createdAt),
  }),
);
