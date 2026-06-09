import { pgTable, text, integer, real, boolean, timestamp, uuid, pgEnum, varchar, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const issueTypeEnum = pgEnum("issue_type", ["repair", "remake", "rework", "paid_repair"]);
export const rootCauseEnum = pgEnum("root_cause", [
  "templating", "material_handling", "cutting", "fabrication",
  "installation", "sales_expectations", "material_defect"
]);
export const userRoleEnum = pgEnum("user_role", ["admin", "manager", "viewer"]);
export const planEnum = pgEnum("plan", ["starter", "professional", "enterprise"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("viewer"),
  plan: planEnum("plan").notNull().default("starter"),
  shopName: text("shop_name"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export const issues = pgTable("issues", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  weekNumber: integer("week_number").notNull(),
  year: integer("year").notNull(),
  issueType: issueTypeEnum("issue_type").notNull(),
  rootCause: rootCauseEnum("root_cause").notNull(),
  description: text("description"),
  jobName: text("job_name"),
  customerName: text("customer_name"),
  salesRep: text("sales_rep"),
  squareFeet: real("square_feet"),
  laborHours: real("labor_hours"),
  materialCost: real("material_cost"),
  totalInternalCost: real("total_internal_cost"),
  opportunityCost: real("opportunity_cost"),
  totalImpact: real("total_impact"),
  resolved: boolean("resolved").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const weeklyReports = pgTable("weekly_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  weekNumber: integer("week_number").notNull(),
  year: integer("year").notNull(),
  totalJobs: integer("total_jobs").default(0),
  totalRevenue: real("total_revenue").default(0),
  totalMaterialCost: real("total_material_cost").default(0),
  totalLaborCost: real("total_labor_cost").default(0),
  grossMargin: real("gross_margin").default(0),
  issueCount: integer("issue_count").default(0),
  remakeCount: integer("remake_count").default(0),
  repairCount: integer("repair_count").default(0),
  reworkCount: integer("rework_count").default(0),
  totalIssueCost: real("total_issue_cost").default(0),
  shopHealthScore: integer("shop_health_score"),
  claudeInsights: text("claude_insights"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const resourceActivities = pgTable("resource_activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  weekNumber: integer("week_number").notNull(),
  year: integer("year").notNull(),
  resourceName: text("resource_name").notNull(),
  resourceType: text("resource_type").notNull(),
  templatesCompleted: integer("templates_completed").default(0),
  jobsInstalled: integer("jobs_installed").default(0),
  hoursWorked: real("hours_worked").default(0),
  productivity: real("productivity"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const salesEntries = pgTable("sales_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  weekNumber: integer("week_number").notNull(),
  year: integer("year").notNull(),
  repName: text("rep_name").notNull(),
  revenue: real("revenue").default(0),
  jobCount: integer("job_count").default(0),
  squareFeet: real("square_feet").default(0),
  issueCount: integer("issue_count").default(0),
  remakeCount: integer("remake_count").default(0),
  margin: real("margin"),
  closeRate: real("close_rate"),
  avgJobValue: real("avg_job_value"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const priceBookItems = pgTable("price_book_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  category: text("category").notNull(),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  basePrice: real("base_price").notNull(),
  materialCost: real("material_cost"),
  laborCost: real("labor_cost"),
  margin: real("margin"),
  active: boolean("active").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const costSettings = pgTable("cost_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  laborCostPerHour: real("labor_cost_per_hour").notNull().default(66),
  opportunityCostPerHour: real("opportunity_cost_per_hour").notNull().default(250),
  materialCostPerSqFt: real("material_cost_per_sq_ft").notNull().default(11),
  overheadRate: real("overhead_rate").default(0.15),
  targetMargin: real("target_margin").default(0.45),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const industryBenchmarks = pgTable("industry_benchmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  metric: text("metric").notNull(),
  category: text("category").notNull(),
  p25: real("p25"),
  p50: real("p50"),
  p75: real("p75"),
  p90: real("p90"),
  unit: text("unit"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const claudeConversations = pgTable("claude_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  messages: text("messages").notNull(),
  context: text("context"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const BUSINESS_CONSTANTS = {
  LABOR_COST_PER_HOUR: 66,
  OPPORTUNITY_COST_PER_HOUR: 250,
  TOTAL_IMPACT_PER_HOUR: 316,
  MATERIAL_COST_PER_SQFT: 11,
} as const;

export function calculateTotalInternalCost(laborHours: number, materialCost: number): number {
  return (laborHours * BUSINESS_CONSTANTS.LABOR_COST_PER_HOUR) + materialCost;
}

export function calculateOpportunityCost(laborHours: number): number {
  return laborHours * BUSINESS_CONSTANTS.OPPORTUNITY_COST_PER_HOUR;
}

export function calculateTotalImpact(laborHours: number, materialCost: number): number {
  return (laborHours * BUSINESS_CONSTANTS.TOTAL_IMPACT_PER_HOUR) + materialCost;
}

export function getWeekNumber(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return {
    week: Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7),
    year: d.getUTCFullYear(),
  };
}

export type User = typeof users.$inferSelect;
export type Issue = typeof issues.$inferSelect;
export type WeeklyReport = typeof weeklyReports.$inferSelect;
export type ResourceActivity = typeof resourceActivities.$inferSelect;
export type SalesEntry = typeof salesEntries.$inferSelect;
export type PriceBookItem = typeof priceBookItems.$inferSelect;
export type CostSettings = typeof costSettings.$inferSelect;
export type IndustryBenchmark = typeof industryBenchmarks.$inferSelect;
export type ClaudeConversation = typeof claudeConversations.$inferSelect;

// ── CUSTOMERS ──────────────────────────────────────────────────────────────
export const customerTypeEnum = pgEnum("customer_type", ["retail", "contractor", "builder", "designer", "commercial"]);

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  customerType: customerTypeEnum("customer_type").notNull().default("retail"),
  company: text("company"),
  notes: text("notes"),
  totalJobs: integer("total_jobs").default(0),
  totalRevenue: real("total_revenue").default(0),
  praiseCount: integer("praise_count").default(0),
  complaintCount: integer("complaint_count").default(0),
  claudeSummary: text("claude_summary"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── JOB STAGES ─────────────────────────────────────────────────────────────
export const jobStageEnum = pgEnum("job_stage", [
  "inquiry", "estimate", "stone_selected", "template_scheduled",
  "template_complete", "layout", "fabrication", "installation", "complete"
]);

// ── JOBS ───────────────────────────────────────────────────────────────────
export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  jobNumber: text("job_number").notNull(),
  customerId: uuid("customer_id").references(() => customers.id),
  stage: jobStageEnum("stage").notNull().default("inquiry"),
  jobName: text("job_name").notNull(),
  jobAddress: text("job_address"),
  jobCity: text("job_city"),
  jobState: text("job_state"),
  jobZip: text("job_zip"),
  jobType: text("job_type"),
  areas: text("areas"),
  stoneType: text("stone_type"),
  stoneColor: text("stone_color"),
  stoneSupplier: text("stone_supplier"),
  totalSqft: real("total_sqft"),
  estimatedRevenue: real("estimated_revenue"),
  actualRevenue: real("actual_revenue"),
  materialCost: real("material_cost"),
  salesRepId: text("sales_rep"),
  templateDate: timestamp("template_date"),
  templateTech: text("template_tech"),
  fabricationDate: timestamp("fabrication_date"),
  fabricationTech: text("fabrication_tech"),
  installDate: timestamp("install_date"),
  installTech: text("install_tech"),
  completionDate: timestamp("completion_date"),
  estimatedTime: real("estimated_time"),
  actualTime: real("actual_time"),
  onTime: boolean("on_time"),
  clientSignOff: boolean("client_sign_off").default(false),
  notes: text("notes"),
  claudeBriefing: text("claude_briefing"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── JOB PHASES ─────────────────────────────────────────────────────────────
export const jobPhases = pgTable("job_phases", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").references(() => jobs.id),
  phaseNumber: integer("phase_number").notNull(),
  phaseName: text("phase_name"),
  areas: text("areas"),
  sqft: real("sqft"),
  materialCost: real("material_cost"),
  salePrice: real("sale_price"),
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  tech: text("tech"),
  onTime: boolean("on_time"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── JOB FEEDBACK ───────────────────────────────────────────────────────────
export const feedbackTypeEnum = pgEnum("feedback_type", ["praise", "complaint", "note"]);

export const jobFeedback = pgTable("job_feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").references(() => jobs.id),
  customerId: uuid("customer_id").references(() => customers.id),
  userId: uuid("user_id").references(() => users.id),
  feedbackType: feedbackTypeEnum("feedback_type").notNull(),
  category: text("category"),
  description: text("description").notNull(),
  employee: text("employee"),
  resolved: boolean("resolved").default(false),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── SCHEDULE STOPS ─────────────────────────────────────────────────────────
export const stopTypeEnum = pgEnum("stop_type", ["template", "installation", "delivery", "service"]);

export const scheduleStops = pgTable("schedule_stops", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  jobId: uuid("job_id").references(() => jobs.id),
  customerId: uuid("customer_id").references(() => customers.id),
  stopType: stopTypeEnum("stop_type").notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  address: text("address").notNull(),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  lat: real("lat"),
  lng: real("lng"),
  tech: text("tech"),
  estimatedDuration: integer("estimated_duration").default(60),
  stopOrder: integer("stop_order").default(0),
  completed: boolean("completed").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── AI EMAILS ──────────────────────────────────────────────────────────────
export const emailTypeEnum = pgEnum("email_type", [
  "template_confirmation", "installation_confirmation",
  "completion_followup", "dispute_letter", "estimate", "custom"
]);

export const aiEmails = pgTable("ai_emails", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  jobId: uuid("job_id").references(() => jobs.id),
  customerId: uuid("customer_id").references(() => customers.id),
  emailType: emailTypeEnum("email_type").notNull(),
  subject: text("subject"),
  body: text("body").notNull(),
  sent: boolean("sent").default(false),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Customer = typeof customers.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type JobPhase = typeof jobPhases.$inferSelect;
export type JobFeedback = typeof jobFeedback.$inferSelect;
export type ScheduleStop = typeof scheduleStops.$inferSelect;
export type AiEmail = typeof aiEmails.$inferSelect;

export const slabInventory = pgTable("slab_inventory", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  stoneType: varchar("stone_type", { length: 100 }).notNull(),
  color: varchar("color", { length: 200 }).notNull(),
  supplier: varchar("supplier", { length: 200 }),
  lotNumber: varchar("lot_number", { length: 100 }),
  bundleNumber: varchar("bundle_number", { length: 100 }),
  lengthInches: numeric("length_inches"),
  widthInches: numeric("width_inches"),
  sqft: numeric("sqft"),
  thickness: varchar("thickness", { length: 20 }),
  finish: varchar("finish", { length: 50 }),
  costPerSqFt: numeric("cost_per_sq_ft"),
  totalCost: numeric("total_cost"),
  yardLocation: varchar("yard_location", { length: 200 }),
  jobAllocated: varchar("job_allocated", { length: 200 }),
  status: varchar("status", { length: 50 }).default("available"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
