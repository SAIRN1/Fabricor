import express from "express";
import session from "express-session";
import cors from "cors";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  users, sessions, issues, weeklyReports, resourceActivities,
  salesEntries, priceBookItems, costSettings, industryBenchmarks,
  claudeConversations, customers, jobs, jobPhases, jobFeedback,
  scheduleStops, aiEmails,
  calculateTotalInternalCost, calculateOpportunityCost, calculateTotalImpact,
  getWeekNumber, BUSINESS_CONSTANTS
} from "../shared/schema.js";

const app = express();
const PORT = parseInt(process.env.PORT || "5000");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/fabricor",
});
const db = drizzle(pool);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));

const PgSession = (await import("connect-pg-simple")).default(session);
app.use(session({
  store: new PgSession({ pool, createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET || "fabricor-secret-2026",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 },
}));

const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
};

async function seedAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@fabricor.io";
    const adminPass = process.env.ADMIN_PASSWORD || "fabricor2026";
    const existing = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
    if (existing.length === 0) {
      const hash = await bcrypt.hash(adminPass, 12);
      await db.insert(users).values({
        email: adminEmail, password: hash, name: "Admin",
        role: "admin", plan: "enterprise", shopName: "SAIRN Demo Shop",
      });
      console.log("Admin seeded:", adminEmail);
    }
    const adminUser = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
    if (adminUser[0]) {
      const existing = await db.select().from(costSettings).where(eq(costSettings.userId, adminUser[0].id)).limit(1);
      if (existing.length === 0) await db.insert(costSettings).values({ userId: adminUser[0].id });
    }
    const benchmarks = await db.select().from(industryBenchmarks).limit(1);
    if (benchmarks.length === 0) {
      await db.insert(industryBenchmarks).values([
        { metric: "remake_rate", category: "quality", p25: 0.02, p50: 0.04, p75: 0.07, p90: 0.12, unit: "%" },
        { metric: "labor_productivity", category: "resource", p25: 45, p50: 55, p75: 65, p90: 78, unit: "sqft/hr" },
        { metric: "gross_margin", category: "financial", p25: 0.35, p50: 0.42, p75: 0.50, p90: 0.58, unit: "%" },
        { metric: "issue_cost_per_job", category: "quality", p25: 85, p50: 175, p75: 320, p90: 580, unit: "$" },
        { metric: "avg_job_value", category: "sales", p25: 1800, p50: 2600, p75: 3800, p90: 5500, unit: "$" },
      ]);
    }
  } catch (e) {
    console.log("Seed skipped:", (e as Error).message);
  }
}

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    (req.session as any).userId = user.id;
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, plan: user.plan, shopName: user.shopName } });
  } catch (e) { res.status(500).json({ error: "Login failed" }); }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name, shopName } = req.body;
    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) return res.status(400).json({ error: "Email already registered" });
    const hash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(users).values({
      email: email.toLowerCase(), password: hash, name, shopName, role: "admin", plan: "starter",
    }).returning();
    await db.insert(costSettings).values({ userId: user.id });
    (req.session as any).userId = user.id;
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, plan: user.plan, shopName: user.shopName } });
  } catch (e) { res.status(500).json({ error: "Registration failed" }); }
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/auth/me", async (req, res) => {
  const userId = (req.session as any)?.userId;
  if (!userId) return res.status(401).json({ error: "Not authenticated" });
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(401).json({ error: "User not found" });
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, plan: user.plan, shopName: user.shopName } });
  } catch (e) { res.status(500).json({ error: "Auth check failed" }); }
});

app.get("/api/dashboard/summary", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { week, year } = getWeekNumber(new Date());
    const prevWeek = week > 1 ? week - 1 : 52;
    const prevYear = week > 1 ? year : year - 1;
    const thisWeekIssues = await db.select().from(issues).where(and(eq(issues.userId, userId), eq(issues.weekNumber, week), eq(issues.year, year)));
    const prevWeekIssues = await db.select().from(issues).where(and(eq(issues.userId, userId), eq(issues.weekNumber, prevWeek), eq(issues.year, prevYear)));
    const thisWeekReport = await db.select().from(weeklyReports).where(and(eq(weeklyReports.userId, userId), eq(weeklyReports.weekNumber, week), eq(weeklyReports.year, year))).limit(1);
    const prevWeekReport = await db.select().from(weeklyReports).where(and(eq(weeklyReports.userId, userId), eq(weeklyReports.weekNumber, prevWeek), eq(weeklyReports.year, prevYear))).limit(1);
    const thisCost = thisWeekIssues.reduce((sum, i) => sum + (i.totalImpact || 0), 0);
    const prevCost = prevWeekIssues.reduce((sum, i) => sum + (i.totalImpact || 0), 0);
    const remakeRate = thisWeekReport[0]?.totalJobs ? ((thisWeekReport[0].remakeCount || 0) / thisWeekReport[0].totalJobs) : 0;
    const margin = thisWeekReport[0]?.grossMargin || 0;
    let healthScore = 100;
    healthScore -= Math.min(40, remakeRate * 400);
    healthScore -= Math.min(20, thisWeekIssues.length * 3);
    if (margin < 0.35) healthScore -= 20;
    else if (margin < 0.42) healthScore -= 10;
    healthScore = Math.max(0, Math.round(healthScore));
    const atRisk = thisWeekIssues.filter(i => !i.resolved && (i.totalImpact || 0) > 500);
    res.json({
      currentWeek: { week, year }, healthScore,
      thisWeek: { issueCount: thisWeekIssues.length, totalImpact: thisCost, remakeCount: thisWeekIssues.filter(i => i.issueType === "remake").length, repairCount: thisWeekIssues.filter(i => i.issueType === "repair").length, reworkCount: thisWeekIssues.filter(i => i.issueType === "rework").length, report: thisWeekReport[0] || null },
      prevWeek: { issueCount: prevWeekIssues.length, totalImpact: prevCost, remakeCount: prevWeekIssues.filter(i => i.issueType === "remake").length, report: prevWeekReport[0] || null },
      atRisk, deltas: { issueCount: thisWeekIssues.length - prevWeekIssues.length, totalImpact: thisCost - prevCost },
    });
  } catch (e) { res.status(500).json({ error: "Dashboard failed" }); }
});

app.get("/api/issues", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const limit = parseInt(req.query.limit as string) || 50;
    const allIssues = await db.select().from(issues).where(eq(issues.userId, userId)).orderBy(desc(issues.createdAt)).limit(limit);
    res.json(allIssues);
  } catch (e) { res.status(500).json({ error: "Failed to fetch issues" }); }
});

app.post("/api/issues", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const body = req.body;
    const { week, year } = getWeekNumber(new Date());
    const laborHours = body.laborHours || 0;
    const materialCost = body.materialCost || 0;
    const totalInternalCost = calculateTotalInternalCost(laborHours, materialCost);
    const opportunityCost = calculateOpportunityCost(laborHours);
    const totalImpact = calculateTotalImpact(laborHours, materialCost);
    const [issue] = await db.insert(issues).values({ ...body, userId, weekNumber: body.weekNumber || week, year: body.year || year, totalInternalCost, opportunityCost, totalImpact }).returning();
    res.json(issue);
  } catch (e) { res.status(500).json({ error: "Failed to create issue" }); }
});

app.patch("/api/issues/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const [issue] = await db.update(issues).set({ ...req.body }).where(and(eq(issues.id, req.params.id), eq(issues.userId, userId))).returning();
    res.json(issue);
  } catch (e) { res.status(500).json({ error: "Failed to update issue" }); }
});

app.delete("/api/issues/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    await db.delete(issues).where(and(eq(issues.id, req.params.id), eq(issues.userId, userId)));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to delete issue" }); }
});

app.get("/api/resources", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const activities = await db.select().from(resourceActivities).where(eq(resourceActivities.userId, userId)).orderBy(desc(resourceActivities.year), desc(resourceActivities.weekNumber));
    res.json(activities);
  } catch (e) { res.status(500).json({ error: "Failed to fetch resources" }); }
});

app.post("/api/resources", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const [activity] = await db.insert(resourceActivities).values({ ...req.body, userId }).returning();
    res.json(activity);
  } catch (e) { res.status(500).json({ error: "Failed to create resource" }); }
});

app.get("/api/sales", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const sales = await db.select().from(salesEntries).where(eq(salesEntries.userId, userId)).orderBy(desc(salesEntries.year), desc(salesEntries.weekNumber));
    res.json(sales);
  } catch (e) { res.status(500).json({ error: "Failed to fetch sales" }); }
});

app.post("/api/sales", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const [entry] = await db.insert(salesEntries).values({ ...req.body, userId }).returning();
    res.json(entry);
  } catch (e) { res.status(500).json({ error: "Failed to create sales entry" }); }
});

app.get("/api/pricebook", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const items = await db.select().from(priceBookItems).where(and(eq(priceBookItems.userId, userId), eq(priceBookItems.active, true))).orderBy(priceBookItems.category, priceBookItems.name);
    res.json(items);
  } catch (e) { res.status(500).json({ error: "Failed to fetch price book" }); }
});

app.post("/api/pricebook", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const [item] = await db.insert(priceBookItems).values({ ...req.body, userId }).returning();
    res.json(item);
  } catch (e) { res.status(500).json({ error: "Failed to create price book item" }); }
});

app.patch("/api/pricebook/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const [item] = await db.update(priceBookItems).set(req.body).where(and(eq(priceBookItems.id, req.params.id), eq(priceBookItems.userId, userId))).returning();
    res.json(item);
  } catch (e) { res.status(500).json({ error: "Failed to update price book item" }); }
});

app.delete("/api/pricebook/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    await db.update(priceBookItems).set({ active: false }).where(and(eq(priceBookItems.id, req.params.id), eq(priceBookItems.userId, userId)));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to delete price book item" }); }
});

app.get("/api/settings/costs", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const [settings] = await db.select().from(costSettings).where(eq(costSettings.userId, userId)).limit(1);
    res.json(settings || BUSINESS_CONSTANTS);
  } catch (e) { res.status(500).json({ error: "Failed to fetch settings" }); }
});

app.patch("/api/settings/costs", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const existing = await db.select().from(costSettings).where(eq(costSettings.userId, userId)).limit(1);
    if (existing.length === 0) {
      const [s] = await db.insert(costSettings).values({ ...req.body, userId }).returning();
      return res.json(s);
    }
    const [s] = await db.update(costSettings).set({ ...req.body, updatedAt: new Date() }).where(eq(costSettings.userId, userId)).returning();
    res.json(s);
  } catch (e) { res.status(500).json({ error: "Failed to update settings" }); }
});

app.get("/api/benchmarks", requireAuth, async (req, res) => {
  try {
    const benchmarks = await db.select().from(industryBenchmarks);
    res.json(benchmarks);
  } catch (e) { res.status(500).json({ error: "Failed to fetch benchmarks" }); }
});

app.get("/api/analytics/trends", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const weeks = parseInt(req.query.weeks as string) || 12;
    const reports = await db.select().from(weeklyReports).where(eq(weeklyReports.userId, userId)).orderBy(weeklyReports.year, weeklyReports.weekNumber).limit(weeks);
    const issuesByWeek = await db.select({
      weekNumber: issues.weekNumber, year: issues.year,
      count: sql<number>`count(*)`,
      totalImpact: sql<number>`sum(${issues.totalImpact})`,
      remakes: sql<number>`sum(case when ${issues.issueType} = 'remake' then 1 else 0 end)`,
    }).from(issues).where(eq(issues.userId, userId)).groupBy(issues.weekNumber, issues.year).orderBy(issues.year, issues.weekNumber).limit(weeks);
    res.json({ reports, issuesByWeek });
  } catch (e) { res.status(500).json({ error: "Failed to fetch analytics" }); }
});

app.post("/api/claude/chat", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { messages, includeShopContext = true } = req.body;
    let shopContext = "";
    if (includeShopContext) {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const { week, year } = getWeekNumber(new Date());
      const recentIssues = await db.select().from(issues).where(eq(issues.userId, userId)).orderBy(desc(issues.createdAt)).limit(20);
      const [settings] = await db.select().from(costSettings).where(eq(costSettings.userId, userId)).limit(1);
      const totalImpact = recentIssues.reduce((s, i) => s + (i.totalImpact || 0), 0);
      const remakeCount = recentIssues.filter(i => i.issueType === "remake").length;
      const topRootCauses = recentIssues.reduce((acc: Record<string, number>, i) => { acc[i.rootCause] = (acc[i.rootCause] || 0) + 1; return acc; }, {});
      shopContext = `SHOP CONTEXT FOR ${user?.shopName || "This Shop"} (Week ${week}, ${year}):
- Recent issues (last 20): ${recentIssues.length} total, ${remakeCount} remakes
- Total financial impact: $${totalImpact.toFixed(0)}
- Top root causes: ${Object.entries(topRootCauses).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k}(${v})`).join(", ")}
- Labor cost: $${settings?.laborCostPerHour || 66}/hr | Opportunity cost: $${settings?.opportunityCostPerHour || 250}/hr`;
    }
    const systemPrompt = `You are Fabricor's AI intelligence layer — a stone fabrication business analyst embedded directly in the shop's operations platform.

${shopContext}

You are a specialist who deeply understands stone fabrication workflows, quality cost accounting, resource productivity, sales performance, and industry benchmarks. Speak like a trusted advisor. Be direct, specific, and actionable. Reference actual numbers from the shop context when relevant. Never give generic advice when you have real data to work with.`;

    const response = await fetch("https://sairn.vercel.app/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1500, system: systemPrompt, messages }),
    });
    const data = await response.json();
    const content = data.content?.[0]?.text || "I couldn't generate a response. Please try again.";
    res.json({ content, usage: data.usage });
  } catch (e) { res.status(500).json({ error: "Claude AI request failed" }); }
});

app.post("/api/claude/analyze-issues", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { week, year } = getWeekNumber(new Date());
    const weekIssues = await db.select().from(issues).where(and(eq(issues.userId, userId), eq(issues.weekNumber, week), eq(issues.year, year)));
    if (weekIssues.length === 0) return res.json({ analysis: "No issues logged this week. Keep it up — a clean week is a profitable week." });
    const totalImpact = weekIssues.reduce((s, i) => s + (i.totalImpact || 0), 0);
    const byType = weekIssues.reduce((acc: Record<string, number>, i) => { acc[i.issueType] = (acc[i.issueType] || 0) + 1; return acc; }, {});
    const byRootCause = weekIssues.reduce((acc: Record<string, number>, i) => { acc[i.rootCause] = (acc[i.rootCause] || 0) + 1; return acc; }, {});
    const prompt = `Analyze this week's quality issues for a stone fabrication shop:
Week ${week}, ${year}: ${weekIssues.length} total issues, $${totalImpact.toFixed(0)} total impact
By type: ${JSON.stringify(byType)}
By root cause: ${JSON.stringify(byRootCause)}

Provide a concise analysis (3-4 sentences): name the biggest cost driver, identify the pattern, give one specific actionable recommendation. Be direct. Use real numbers.`;
    const response = await fetch("https://sairn.vercel.app/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 400, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await response.json();
    res.json({ analysis: data.content?.[0]?.text || "Analysis unavailable" });
  } catch (e) { res.status(500).json({ error: "Analysis failed" }); }
});

app.get("/api/customers", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const allCustomers = await db.select().from(customers).where(eq(customers.userId, userId)).orderBy(desc(customers.createdAt));
    res.json(allCustomers);
  } catch (e) { res.status(500).json({ error: "Failed to fetch customers" }); }
});

app.post("/api/customers", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const [customer] = await db.insert(customers).values({ ...req.body, userId }).returning();
    res.json(customer);
  } catch (e) { res.status(500).json({ error: "Failed to create customer" }); }
});

app.patch("/api/customers/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const [customer] = await db.update(customers).set({ ...req.body, updatedAt: new Date() }).where(and(eq(customers.id, req.params.id), eq(customers.userId, userId))).returning();
    res.json(customer);
  } catch (e) { res.status(500).json({ error: "Failed to update customer" }); }
});

app.post("/api/claude/customer-briefing", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { customerId } = req.body;
    const [customer] = await db.select().from(customers).where(and(eq(customers.id, customerId), eq(customers.userId, userId))).limit(1);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    const customerJobs = await db.select().from(jobs).where(and(eq(jobs.customerId, customerId), eq(jobs.userId, userId))).orderBy(desc(jobs.createdAt)).limit(20);
    const feedback = await db.select().from(jobFeedback).where(eq(jobFeedback.customerId, customerId)).orderBy(desc(jobFeedback.createdAt)).limit(10);
    const prompt = `Generate a pre-job briefing for this stone fabrication customer:

Customer: ${customer.firstName} ${customer.lastName}
Type: ${customer.customerType}
Company: ${customer.company || "N/A"}
Total Jobs: ${customer.totalJobs || 0}
Total Revenue: $${customer.totalRevenue || 0}
Praise Count: ${customer.praiseCount || 0}
Complaint Count: ${customer.complaintCount || 0}
Notes: ${customer.notes || "None"}

Recent Jobs: ${customerJobs.length > 0 ? customerJobs.map(j => `${j.jobName} (${j.stage}) - $${j.estimatedRevenue || 0}`).join(", ") : "No jobs yet"}
Feedback History: ${feedback.length > 0 ? feedback.map(f => `${f.feedbackType}: ${f.description}`).join("; ") : "No feedback yet"}

Provide a concise 3-4 sentence briefing covering: customer history, any patterns or issues to watch for, preferences, and recommendations for the next job.`;

    const response = await fetch("https://sairn.vercel.app/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 500, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await response.json();
    res.json({ briefing: data.content?.[0]?.text || "Could not generate briefing." });
  } catch (e) { res.status(500).json({ error: "Briefing failed" }); }
});

app.get("/api/jobs", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const allJobs = await db.select().from(jobs).where(eq(jobs.userId, userId)).orderBy(desc(jobs.createdAt));
    res.json(allJobs);
  } catch (e) { res.status(500).json({ error: "Failed to fetch jobs" }); }
});

app.post("/api/jobs", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const [job] = await db.insert(jobs).values({ ...req.body, userId }).returning();
    if (job.customerId) {
      await db.update(customers).set({ totalJobs: sql`${customers.totalJobs} + 1`, updatedAt: new Date() }).where(eq(customers.id, job.customerId));
    }
    res.json(job);
  } catch (e) { res.status(500).json({ error: "Failed to create job" }); }
});

app.patch("/api/jobs/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const [job] = await db.update(jobs).set({ ...req.body, updatedAt: new Date() }).where(and(eq(jobs.id, req.params.id), eq(jobs.userId, userId))).returning();
    res.json(job);
  } catch (e) { res.status(500).json({ error: "Failed to update job" }); }
});

app.get("/api/jobs/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const [job] = await db.select().from(jobs).where(and(eq(jobs.id, req.params.id), eq(jobs.userId, userId))).limit(1);
    if (!job) return res.status(404).json({ error: "Job not found" });
    const phases = await db.select().from(jobPhases).where(eq(jobPhases.jobId, job.id)).orderBy(jobPhases.phaseNumber);
    const feedback = await db.select().from(jobFeedback).where(eq(jobFeedback.jobId, job.id)).orderBy(desc(jobFeedback.createdAt));
    res.json({ ...job, phases, feedback });
  } catch (e) { res.status(500).json({ error: "Failed to fetch job" }); }
});

app.post("/api/jobs/:id/feedback", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const [job] = await db.select().from(jobs).where(and(eq(jobs.id, req.params.id), eq(jobs.userId, userId))).limit(1);
    if (!job) return res.status(404).json({ error: "Job not found" });
    const [feedback] = await db.insert(jobFeedback).values({ ...req.body, jobId: job.id, customerId: job.customerId, userId }).returning();
    if (job.customerId) {
      if (req.body.feedbackType === "praise") {
        await db.update(customers).set({ praiseCount: sql`${customers.praiseCount} + 1` }).where(eq(customers.id, job.customerId));
      } else if (req.body.feedbackType === "complaint") {
        await db.update(customers).set({ complaintCount: sql`${customers.complaintCount} + 1` }).where(eq(customers.id, job.customerId));
      }
    }
    res.json(feedback);
  } catch (e) { res.status(500).json({ error: "Failed to create feedback" }); }
});

app.get("/api/schedule", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const allStops = await db.select().from(scheduleStops).where(eq(scheduleStops.userId, userId)).orderBy(scheduleStops.stopOrder, scheduleStops.scheduledDate);
    res.json(allStops);
  } catch (e) { res.status(500).json({ error: "Failed to fetch schedule" }); }
});

app.post("/api/schedule", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const body = req.body;
    let lat = null;
    let lng = null;
    if (body.address && body.city) {
      try {
        const address = encodeURIComponent(`${body.address} ${body.city} ${body.state} ${body.zip}`);
        const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.VITE_GOOGLE_MAPS_API_KEY}`);
        const geoData = await geoRes.json();
        if (geoData.results?.[0]?.geometry?.location) {
          lat = geoData.results[0].geometry.location.lat;
          lng = geoData.results[0].geometry.location.lng;
        }
      } catch (e) { console.log("Geocoding failed:", e); }
    }
    const [stop] = await db.insert(scheduleStops).values({ ...body, userId, lat, lng, scheduledDate: new Date(body.scheduledDate) }).returning();
    res.json(stop);
  } catch (e) { res.status(500).json({ error: "Failed to create stop" }); }
});

app.patch("/api/schedule/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const [stop] = await db.update(scheduleStops).set(req.body).where(and(eq(scheduleStops.id, req.params.id), eq(scheduleStops.userId, userId))).returning();
    res.json(stop);
  } catch (e) { res.status(500).json({ error: "Failed to update stop" }); }
});

app.delete("/api/schedule/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    await db.delete(scheduleStops).where(and(eq(scheduleStops.id, req.params.id), eq(scheduleStops.userId, userId)));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to delete stop" }); }
});

app.liimport { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distPath = join(__dirname, "../dist/public");

if (existsSync(distPath)) {
  const serveStatic = (await import("serve-static")).default;
  app.use(serveStatic(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(join(distPath, "index.html"));
  });
}sten(PORT, "0.0.0.0", async () => {
  console.log(`Fabricor API running on port ${PORT}`);
  await seedAdmin();
});

export default app;