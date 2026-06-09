import express from "express";
import session from "express-session";
import cors from "cors";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and, desc, sql } from "drizzle-orm";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";
import cron from "node-cron";
import { Resend } from "resend";
import Stripe from "stripe";
import {
  users, issues, weeklyReports, resourceActivities,
  salesEntries, priceBookItems, costSettings, industryBenchmarks,
  claudeConversations, customers, jobs, jobPhases, jobFeedback,
  scheduleStops, aiEmails, slabInventory, jobPhotos,
  calculateTotalInternalCost, calculateOpportunityCost, calculateTotalImpact,
  getWeekNumber, BUSINESS_CONSTANTS
} from "../shared/schema.js";

const app = express();
const PORT = parseInt(process.env.PORT || "5000");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/fabricor",
});
const db = drizzle(pool);
const resend = new Resend(process.env.RESEND_API_KEY || "placeholder");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2026-05-27.dahlia" });

const STRIPE_PRICES: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER || "price_starter",
  professional: process.env.STRIPE_PRICE_PROFESSIONAL || "price_professional",
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || "price_enterprise",
};

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
      await db.insert(users).values({ email: adminEmail, password: hash, name: "Admin", role: "admin", plan: "enterprise", shopName: "SAIRN Demo Shop" });
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
  } catch (e) { console.log("Seed skipped:", (e as Error).message); }
}

async function sendWeeklyReport() {
  try {
    const allUsers = await db.select().from(users).where(eq(users.role, "admin"));
    for (const user of allUsers) {
      const { week, year } = getWeekNumber(new Date());
      const prevWeek = week > 1 ? week - 1 : 52;
      const prevYear = week > 1 ? year : year - 1;
      const weekIssues = await db.select().from(issues).where(and(eq(issues.userId, user.id), eq(issues.weekNumber, prevWeek), eq(issues.year, prevYear)));
      const totalImpact = weekIssues.reduce((s, i) => s + (i.totalImpact || 0), 0);
      const remakes = weekIssues.filter(i => i.issueType === "remake").length;
      const byRootCause = weekIssues.reduce((acc: Record<string, number>, i) => { acc[i.rootCause] = (acc[i.rootCause] || 0) + 1; return acc; }, {});
      const topCause = Object.entries(byRootCause).sort((a, b) => b[1] - a[1])[0];
      let aiInsight = "No issues logged last week — great job!";
      if (weekIssues.length > 0) {
        try {
          const r = await fetch("https://sairn.vercel.app/api/claude", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 300, messages: [{ role: "user", content: `Weekly summary: ${weekIssues.length} issues, $${totalImpact.toFixed(0)} impact, ${remakes} remakes. Top cause: ${topCause?.[0]}. Write 2-3 sentences with one action item.` }] }),
          });
          const data = await r.json();
          aiInsight = data.content?.[0]?.text || aiInsight;
        } catch (e) { console.log("Claude insight failed:", e); }
      }
      const healthScore = Math.max(0, Math.min(100, 100 - (weekIssues.length * 5) - (remakes * 10)));
      const emailHtml = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif;color:#e4e4e7;"><div style="max-width:600px;margin:0 auto;padding:40px 20px;"><div style="background:#f59e0b;display:inline-block;padding:8px 16px;border-radius:8px;margin-bottom:16px;"><span style="color:#000;font-weight:bold;font-size:18px;">⚡ STONEDESK</span></div><h1 style="color:#fff;font-size:24px;margin:0 0 8px;">Weekly Shop Report</h1><p style="color:#71717a;margin:0 0 24px;">Week ${prevWeek}, ${prevYear} · ${user.shopName || "Your Shop"}</p><div style="background:#0d0d14;border:1px solid #27272a;border-radius:16px;padding:24px;margin-bottom:16px;text-align:center;"><div style="display:inline-block;margin:0 20px;"><div style="color:#f59e0b;font-size:32px;font-weight:bold;">${healthScore}</div><div style="color:#71717a;font-size:12px;">Health Score</div></div><div style="display:inline-block;margin:0 20px;"><div style="color:#ef4444;font-size:32px;font-weight:bold;">${weekIssues.length}</div><div style="color:#71717a;font-size:12px;">Issues</div></div><div style="display:inline-block;margin:0 20px;"><div style="color:#f59e0b;font-size:32px;font-weight:bold;">$${totalImpact.toFixed(0)}</div><div style="color:#71717a;font-size:12px;">Impact</div></div></div><div style="background:#1a0a00;border:1px solid #78350f;border-radius:16px;padding:24px;margin-bottom:24px;"><div style="color:#f59e0b;font-weight:bold;margin-bottom:8px;">🧠 Claude Analysis</div><p style="color:#d4d4d8;line-height:1.6;margin:0;">${aiInsight}</p></div><div style="text-align:center;"><a href="https://fabricor-production.up.railway.app" style="background:#f59e0b;color:#000;font-weight:bold;padding:12px 32px;border-radius:8px;text-decoration:none;display:inline-block;">Open StoneDesk</a></div><p style="color:#3f3f46;font-size:12px;text-align:center;margin-top:24px;">StoneDesk by SAIRN Technologies · Every Monday 7am ET</p></div></body></html>`;
      await resend.emails.send({
        from: "StoneDesk <reports@sairn.com>",
        to: user.email,
        subject: `Week ${prevWeek} Report — ${weekIssues.length} issues, $${totalImpact.toFixed(0)} impact`,
        html: emailHtml,
      });
      console.log("Weekly report sent to:", user.email);
    }
  } catch (e) { console.error("Weekly report error:", e); }
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
    const [user] = await db.insert(users).values({ email: email.toLowerCase(), password: hash, name, shopName, role: "admin", plan: "starter" }).returning();
    await db.insert(costSettings).values({ userId: user.id });
    (req.session as any).userId = user.id;
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, plan: user.plan, shopName: user.shopName } });
  } catch (e) { res.status(500).json({ error: "Registration failed" }); }
});

app.post("/api/auth/logout", (req, res) => { req.session.destroy(() => res.json({ ok: true })); });

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
      shopContext = `SHOP CONTEXT FOR ${user?.shopName || "This Shop"} (Week ${week}, ${year}):\n- Recent issues: ${recentIssues.length} total, ${remakeCount} remakes\n- Total impact: $${totalImpact.toFixed(0)}\n- Top root causes: ${Object.entries(topRootCauses).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k}(${v})`).join(", ")}\n- Labor: $${settings?.laborCostPerHour || 66}/hr`;
    }
    const systemPrompt = `You are StoneDesk's AI intelligence layer — a stone fabrication business analyst.\n\n${shopContext}\n\nBe direct, specific, and actionable.`;
    const response = await fetch("https://sairn.vercel.app/api/claude", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1500, system: systemPrompt, messages }),
    });
    const data = await response.json();
    res.json({ content: data.content?.[0]?.text || "Try again.", usage: data.usage });
  } catch (e) { res.status(500).json({ error: "Claude AI request failed" }); }
});

app.post("/api/claude/analyze-issues", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { week, year } = getWeekNumber(new Date());
    const weekIssues = await db.select().from(issues).where(and(eq(issues.userId, userId), eq(issues.weekNumber, week), eq(issues.year, year)));
    if (weekIssues.length === 0) return res.json({ analysis: "No issues logged this week." });
    const totalImpact = weekIssues.reduce((s, i) => s + (i.totalImpact || 0), 0);
    const byType = weekIssues.reduce((acc: Record<string, number>, i) => { acc[i.issueType] = (acc[i.issueType] || 0) + 1; return acc; }, {});
    const byRootCause = weekIssues.reduce((acc: Record<string, number>, i) => { acc[i.rootCause] = (acc[i.rootCause] || 0) + 1; return acc; }, {});
    const prompt = `Analyze week ${week} ${year}: ${weekIssues.length} issues, $${totalImpact.toFixed(0)} impact. By type: ${JSON.stringify(byType)}. By cause: ${JSON.stringify(byRootCause)}. Give 3-4 sentence analysis with actionable recommendation.`;
    const response = await fetch("https://sairn.vercel.app/api/claude", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 400, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await response.json();
    res.json({ analysis: data.content?.[0]?.text || "Analysis unavailable" });
  } catch (e) { res.status(500).json({ error: "Analysis failed" }); }
});

app.post("/api/claude/generate-email", requireAuth, async (req, res) => {
  try {
    const { emailType, customerName, jobName, scheduledDate, stoneType, areas, salesRep, shopName, customPrompt } = req.body;
    const prompts: Record<string, string> = {
      template_confirmation: `Write a professional but warm email confirming a stone countertop template appointment. Shop: ${shopName || "our shop"}. Customer: ${customerName}. Job: ${jobName}. Date: ${scheduledDate}. Stone: ${stoneType}. Areas: ${areas}. Rep: ${salesRep}. Include what to expect during the template, how long it takes, and ask them to have the space cleared.`,
      installation_confirmation: `Write a professional but warm email confirming a stone countertop installation. Shop: ${shopName || "our shop"}. Customer: ${customerName}. Job: ${jobName}. Date: ${scheduledDate}. Stone: ${stoneType}. Areas: ${areas}. Include what to expect, how long it takes, plumbing reconnect info, and care instructions.`,
      completion_followup: `Write a warm thank you email after completing a stone countertop installation. Shop: ${shopName || "our shop"}. Customer: ${customerName}. Job: ${jobName}. Stone: ${stoneType}. Areas: ${areas}. Include care and maintenance tips, invite questions, and ask for a Google review.`,
      dispute_letter: `Write a professional dispute resolution email. Shop: ${shopName || "our shop"}. Customer: ${customerName}. Job: ${jobName}. Be empathetic, outline steps to resolve the issue, provide a clear timeline.`,
      estimate: `Write a formal estimate email. Shop: ${shopName || "our shop"}. Customer: ${customerName}. Job: ${jobName}. Stone: ${stoneType}. Areas: ${areas}. Rep: ${salesRep}. Include project scope, 30-day validity, next steps.`,
      custom: customPrompt || "Write a professional email for a stone fabrication shop.",
    };
    const response = await fetch("https://sairn.vercel.app/api/claude", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 800, system: "You are an expert email writer for a stone fabrication shop. Professional but warm. Always start with 'Subject: [subject]' on its own line, then blank line, then body.", messages: [{ role: "user", content: prompts[emailType] || prompts.custom }] }),
    });
    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    const lines = text.split("\n");
    const subjectLine = lines.find((l: string) => l.startsWith("Subject:")) || "Subject: Regarding Your Project";
    const subject = subjectLine.replace("Subject:", "").trim();
    const body = lines.slice(lines.indexOf(subjectLine) + 2).join("\n").trim();
    res.json({ subject, body });
  } catch (e) { res.status(500).json({ error: "Email generation failed" }); }
});

app.post("/api/claude/customer-briefing", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { customerId } = req.body;
    const [customer] = await db.select().from(customers).where(and(eq(customers.id, customerId), eq(customers.userId, userId))).limit(1);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    const customerJobs = await db.select().from(jobs).where(and(eq(jobs.customerId, customerId), eq(jobs.userId, userId))).orderBy(desc(jobs.createdAt)).limit(20);
    const feedback = await db.select().from(jobFeedback).where(eq(jobFeedback.customerId, customerId)).orderBy(desc(jobFeedback.createdAt)).limit(10);
    const prompt = `Stone fabrication pre-job briefing for ${customer.firstName} ${customer.lastName} (${customer.customerType}${customer.company ? `, ${customer.company}` : ""}). Jobs: ${customer.totalJobs || 0}, Revenue: $${customer.totalRevenue || 0}, Praise: ${customer.praiseCount || 0}, Complaints: ${customer.complaintCount || 0}. Notes: ${customer.notes || "None"}. Recent jobs: ${customerJobs.map(j => `${j.jobName}(${j.stage})`).join(", ") || "None"}. Feedback: ${feedback.map(f => `${f.feedbackType}: ${f.description}`).join("; ") || "None"}. Give 3-4 sentence briefing with specific recommendations.`;
    const response = await fetch("https://sairn.vercel.app/api/claude", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 500, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await response.json();
    res.json({ briefing: data.content?.[0]?.text || "Could not generate briefing." });
  } catch (e) { res.status(500).json({ error: "Briefing failed" }); }
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
    const allStops = await db.select().from(scheduleStops).where(eq(scheduleStops.userId, userId)).orderBy(desc(scheduleStops.scheduledDate));
    res.json(allStops);
  } catch (e) {
    console.error("Schedule error:", e);
    res.json([]);
  }
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

app.post("/api/optimize-route", requireAuth, async (req, res) => {
  try {
    const { stops } = req.body;
    if (!stops || stops.length < 2) return res.json({ optimizedOrder: stops.map((s: any) => s.id), totalDriveMinutes: 0 });
    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return res.json({ optimizedOrder: stops.map((s: any) => s.id), totalDriveMinutes: 0 });
    const origin = encodeURIComponent(`${stops[0].address} ${stops[0].city} ${stops[0].state}`);
    const destination = encodeURIComponent(`${stops[stops.length - 1].address} ${stops[stops.length - 1].city} ${stops[stops.length - 1].state}`);
    const waypoints = stops.slice(1, -1).map((s: any) => encodeURIComponent(`${s.address} ${s.city} ${s.state}`)).join("|");
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}${waypoints ? `&waypoints=optimize:true|${waypoints}` : ""}&key=${apiKey}`;
    const geoRes = await fetch(url);
    const data = await geoRes.json();
    if (data.status !== "OK") return res.json({ optimizedOrder: stops.map((s: any) => s.id), totalDriveMinutes: 0 });
    const order = data.routes[0].waypoint_order;
    const middle = stops.slice(1, -1);
    const reordered = [stops[0], ...order.map((i: number) => middle[i]), stops[stops.length - 1]];
    const totalSeconds = data.routes[0].legs.reduce((sum: number, leg: any) => sum + leg.duration.value, 0);
    res.json({ optimizedOrder: reordered.map((s: any) => s.id), totalDriveMinutes: Math.round(totalSeconds / 60) });
  } catch (e) {
    res.json({ optimizedOrder: req.body.stops.map((s: any) => s.id), totalDriveMinutes: 0 });
  }
});

app.get("/api/emails", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const allEmails = await db.select().from(aiEmails).where(eq(aiEmails.userId, userId)).orderBy(desc(aiEmails.createdAt));
    res.json(allEmails);
  } catch (e) { res.json([]); }
});

app.post("/api/emails", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const [email] = await db.insert(aiEmails).values({ ...req.body, userId }).returning();
    res.json(email);
  } catch (e) { res.status(500).json({ error: "Failed to save email" }); }
});

app.delete("/api/emails/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    await db.delete(aiEmails).where(and(eq(aiEmails.id, req.params.id), eq(aiEmails.userId, userId)));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to delete email" }); }
});

app.post("/api/billing/create-checkout", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });
    const { plan } = req.body;
    const priceId = STRIPE_PRICES[plan];
    if (!priceId || priceId.startsWith("price_s") || priceId.startsWith("price_p") || priceId.startsWith("price_e")) {
      return res.status(400).json({ error: "Invalid plan configuration" });
    }
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.origin}/billing?success=true`,
      cancel_url: `${req.headers.origin}/billing?canceled=true`,
      metadata: { userId: user.id, plan },
    });
    res.json({ url: session.url });
  } catch (e) { res.status(500).json({ error: "Checkout failed: " + String(e) }); }
});

app.post("/api/billing/portal", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user?.stripeCustomerId) return res.status(400).json({ error: "No billing account" });
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${req.headers.origin}/billing`,
    });
    res.json({ url: session.url });
  } catch (e) { res.status(500).json({ error: "Portal failed" }); }
});

app.post("/api/billing/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || "");
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const { userId, plan } = session.metadata;
      await db.update(users).set({ plan, stripeCustomerId: session.customer, stripeSubscriptionId: session.subscription }).where(eq(users.id, userId));
    }
    res.json({ received: true });
  } catch (e) { res.status(400).json({ error: "Webhook failed" }); }
});

app.post("/api/admin/send-weekly-report", requireAuth, async (req, res) => {
  try {
    await sendWeeklyReport();
    res.json({ ok: true, message: "Weekly report sent!" });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/admin/send-test-email", requireAuth, async (req, res) => {
  try {
    const targetEmail = process.env.ADMIN_EMAIL_NOTIFY || process.env.ADMIN_EMAIL || "mikied68@gmail.com";
    console.log("Sending test email to:", targetEmail);
    const result = await resend.emails.send({
      from: "StoneDesk <reports@sairn.com>",
      to: targetEmail,
      subject: "StoneDesk Test Email ⚡",
      html: "<div style='font-family:Arial;padding:40px;background:#0a0a0f;color:#e4e4e7;'><h1 style='color:#f59e0b'>⚡ STONEDESK</h1><p>Your weekly reports are configured correctly!</p><p style='color:#71717a;font-size:12px;'>Sent from reports@sairn.com via Resend</p></div>",
    });
    console.log("Resend result:", JSON.stringify(result));
    res.json({ ok: true, result, email: targetEmail });
  } catch (e) {
    console.error("Test email error:", e);
    res.status(500).json({ error: String(e) });
  }
});

cron.schedule("0 7 * * 1", sendWeeklyReport, { timezone: "America/New_York" });
console.log("Weekly cron scheduled — every Monday 7am ET");

const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = dirname(__filename2);
const distPath = join(__dirname2, "../dist/public");

if (existsSync(distPath)) {
  const { default: serveStatic } = await import("serve-static");
  app.use(serveStatic(distPath));
  app.get("*", (_req: any, res: any) => {
    res.sendFile(join(distPath, "index.html"));
  });
}

app.get("/api/jobs/:id/photos", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const photos = await db.select().from(jobPhotos).where(and(eq(jobPhotos.jobId, req.params.id), eq(jobPhotos.userId, userId))).orderBy(desc(jobPhotos.createdAt));
    res.json(photos);
  } catch (e) { res.json([]); }
});
app.post("/api/jobs/:id/photos", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { dataUrl, photoType, caption } = req.body;
    const [photo] = await db.insert(jobPhotos).values({ userId, jobId: req.params.id, dataUrl, photoType: photoType || "general", caption }).returning();
    res.json(photo);
  } catch (e) { res.status(500).json({ error: "Failed to save photo" }); }
});
app.delete("/api/jobs/:id/photos/:photoId", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    await db.delete(jobPhotos).where(and(eq(jobPhotos.id, req.params.photoId), eq(jobPhotos.userId, userId)));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to delete photo" }); }
});
app.get("/api/inventory", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const items = await db.select().from(slabInventory).where(eq(slabInventory.userId, userId)).orderBy(desc(slabInventory.createdAt));
    res.json(items);
  } catch (e) { res.json([]); }
});
app.post("/api/inventory", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const [item] = await db.insert(slabInventory).values({ ...req.body, userId }).returning();
    res.json(item);
  } catch (e) { res.status(500).json({ error: "Failed to add slab" }); }
});
app.patch("/api/inventory/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const [item] = await db.update(slabInventory).set({ ...req.body, updatedAt: new Date() }).where(and(eq(slabInventory.id, req.params.id), eq(slabInventory.userId, userId))).returning();
    res.json(item);
  } catch (e) { res.status(500).json({ error: "Failed to update slab" }); }
});
app.delete("/api/inventory/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    await db.delete(slabInventory).where(and(eq(slabInventory.id, req.params.id), eq(slabInventory.userId, userId)));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to delete slab" }); }
});
app.patch("/api/auth/update-profile", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { shopName, adminEmail } = req.body;
    const [user] = await db.update(users).set({ shopName, email: adminEmail || undefined }).where(eq(users.id, userId)).returning();
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, plan: user.plan, shopName: user.shopName } });
  } catch (e) { res.status(500).json({ error: "Failed to update profile" }); }
});

app.post("/api/jobs/:id/send-review-request", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const [job] = await db.select().from(jobs).where(and(eq(jobs.id, req.params.id), eq(jobs.userId, userId))).limit(1);
    if (!job) return res.status(404).json({ error: "Job not found" });
    const [settings] = await db.select().from(costSettings).where(eq(costSettings.userId, userId)).limit(1);
    const reviewUrl = (settings as any)?.googleReviewUrl;
    if (!reviewUrl) return res.json({ ok: false, message: "No review URL configured" });
    let customerEmail = "";
    if (job.customerId) {
      const [customer] = await db.select().from(customers).where(eq(customers.id, job.customerId)).limit(1);
      customerEmail = customer?.email || "";
    }
    if (!customerEmail) return res.json({ ok: false, message: "No customer email" });
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const emailHtml = `<!DOCTYPE html><html><body style="margin:0;padding:40px;background:#ffffff;font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;"><h2 style="color:#1a1a1a;">Thank you for choosing ${user?.shopName || "us"}!</h2><p style="color:#555;line-height:1.6;">Your ${job.stoneType || "stone"} project is now complete. We hope you love your new countertops!</p><p style="color:#555;line-height:1.6;">If you had a great experience, we'd really appreciate a quick Google review. It only takes 30 seconds and helps other homeowners find us.</p><a href="${reviewUrl}" style="display:inline-block;background:#f59e0b;color:#000;font-weight:bold;padding:12px 32px;border-radius:8px;text-decoration:none;margin:16px 0;">Leave a Google Review ⭐</a><p style="color:#999;font-size:12px;margin-top:32px;">Thank you from the team at ${user?.shopName || "StoneDesk"}</p></div></body></html>`;
    await resend.emails.send({
      from: "StoneDesk <reports@sairntech.com>",
      to: customerEmail,
      subject: `How was your experience with ${user?.shopName || "us"}? Leave a review!`,
      html: emailHtml,
    });
    res.json({ ok: true, message: `Review request sent to ${customerEmail}` });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});


app.get("/api/portal/job", async (req, res) => {
  try {
    const { jobNumber, email } = req.query as { jobNumber: string; email: string };
    if (!jobNumber || !email) return res.status(400).json({ error: "Job number and email required" });
    const customer = await db.select().from(customers).where(eq(customers.email, email.toLowerCase())).limit(1);
    if (!customer[0]) return res.json({ job: null });
    const job = await db.select().from(jobs).where(and(eq(jobs.customerId, customer[0].id), eq(jobs.jobNumber, jobNumber))).limit(1);
    if (!job[0]) return res.json({ job: null });
    res.json({ job: { id: job[0].id, jobName: job[0].jobName, jobNumber: job[0].jobNumber, stage: job[0].stage, stoneType: job[0].stoneType, areas: job[0].areas, jobCity: job[0].jobCity, jobState: job[0].jobState } });
  } catch (e) { res.status(500).json({ error: "Failed to fetch job" }); }
});


app.get("/api/silica", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const result = await db.execute(sql`SELECT * FROM silica_records WHERE user_id = ${userId} ORDER BY training_date DESC`);
    res.json(result.rows);
  } catch (e) { res.json([]); }
});
app.post("/api/silica", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { workerName, trainingType, trainingDate, trainer, notes, certified } = req.body;
    const result = await db.execute(sql`INSERT INTO silica_records (user_id, worker_name, training_type, training_date, trainer, notes, certified) VALUES (${userId}, ${workerName}, ${trainingType}, ${trainingDate}, ${trainer}, ${notes}, ${certified}) RETURNING *`);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: "Failed to save record" }); }
});
app.delete("/api/silica/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    await db.execute(sql`DELETE FROM silica_records WHERE id = ${req.params.id} AND user_id = ${userId}`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to delete record" }); }
});


app.get("/api/jobs/:id/notes", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const result = await db.execute(sql`SELECT * FROM job_notes WHERE job_id = ${req.params.id} AND user_id = ${userId} ORDER BY created_at ASC`);
    res.json(result.rows);
  } catch (e) { res.json([]); }
});
app.post("/api/jobs/:id/notes", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { note, author } = req.body;
    const result = await db.execute(sql`INSERT INTO job_notes (user_id, job_id, note, author) VALUES (${userId}, ${req.params.id}, ${note}, ${author || 'Shop'}) RETURNING *`);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: "Failed to save note" }); }
});
app.delete("/api/jobs/:id/notes/:noteId", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    await db.execute(sql`DELETE FROM job_notes WHERE id = ${req.params.noteId} AND user_id = ${userId}`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to delete note" }); }
});


app.get("/api/jobs/stale", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const result = await db.execute(sql`
      SELECT id, job_name, job_number, stage,
        EXTRACT(DAY FROM NOW() - updated_at)::int AS days_in_stage
      FROM jobs
      WHERE user_id = ${userId}
        AND stage != 'complete'
        AND stage != 'inquiry'
        AND EXTRACT(DAY FROM NOW() - updated_at) > 5
      ORDER BY days_in_stage DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (e) { res.json([]); }
});


async function sendAnniversaryReminders() {
  try {
    const allUsers = await db.select().from(users);
    for (const user of allUsers) {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const start = new Date(oneYearAgo);
      start.setDate(start.getDate() - 7);
      const end = new Date(oneYearAgo);
      end.setDate(end.getDate() + 7);
      const result = await db.execute(sql`
        SELECT j.*, c.email as customer_email, c.first_name, c.last_name
        FROM jobs j
        JOIN customers c ON j.customer_id = c.id
        WHERE j.user_id = ${user.id}
          AND j.stage = 'complete'
          AND j.updated_at BETWEEN ${start.toISOString()} AND ${end.toISOString()}
          AND c.email IS NOT NULL
          AND c.email != ''
      `);
      for (const job of result.rows as any[]) {
        const emailHtml = `<!DOCTYPE html><html><body style="margin:0;padding:40px;background:#ffffff;font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;"><h2 style="color:#1a1a1a;">Happy Anniversary, ${job.first_name}!</h2><p style="color:#555;line-height:1.6;">It's been one year since we installed your ${job.stone_type || 'stone'} countertops — we hope you're still loving them!</p><p style="color:#555;line-height:1.6;">If you have any questions about care and maintenance, or if you're thinking about another project, we'd love to hear from you.</p><p style="color:#555;line-height:1.6;">And if you've been happy with our work, a quick Google review means the world to us and helps other homeowners find us.</p><p style="color:#999;font-size:12px;margin-top:32px;">Warm regards,<br/>${user.shopName || 'StoneDesk'}</p></div></body></html>`;
        await resend.emails.send({
          from: "StoneDesk <reports@sairntech.com>",
          to: job.customer_email,
          subject: `Happy 1-Year Anniversary with your new countertops!`,
          html: emailHtml,
        });
        console.log(`[Anniversary] Sent to ${job.customer_email} for job ${job.job_name}`);
      }
    }
  } catch (e) { console.error("[Anniversary] Error:", e); }
}
cron.schedule("0 9 * * 1", sendAnniversaryReminders, { timezone: "America/New_York" });
console.log("Anniversary cron scheduled — every Monday 9am ET");


app.get("/api/team", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const userResult = await db.execute(sql`SELECT id, name, email, shop_id, shop_role FROM users WHERE id = ${userId}`);
    const user = userResult.rows[0] as any;
    if (!user?.shop_id) return res.json([]);
    const result = await db.execute(sql`SELECT id, name, email, shop_role, created_at FROM users WHERE shop_id = ${user.shop_id} ORDER BY created_at ASC`);
    res.json(result.rows);
  } catch (e) { res.json([]); }
});
app.post("/api/team/invite", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const curResult = await db.execute(sql`SELECT id, shop_id FROM users WHERE id = ${userId}`);
    const currentUser = curResult.rows[0] as any;
    if (!currentUser?.shop_id) return res.status(400).json({ error: "No shop found" });
    const { name, email, password, role } = req.body;
    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing[0]) return res.status(400).json({ error: "Email already in use" });
    const bcrypt = await import("bcryptjs");
    const hashed = await bcrypt.default.hash(password, 10);
    const [newUser] = await db.insert(users).values({
      name, email: email.toLowerCase(), password: hashed,
      role: "viewer", plan: "starter",
      shopId: currentUser.shop_id, shopRole: role,
    } as any).returning();
    res.json({ ok: true, user: { id: newUser.id, name: newUser.name, email: newUser.email } });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
app.patch("/api/team/:userId/role", requireAuth, async (req, res) => {
  try {
    const currentUserId = (req.session as any).userId;
    const curRes = await db.execute(sql`SELECT shop_id FROM users WHERE id = ${currentUserId}`);
    const cu = curRes.rows[0] as any;
    const { role } = req.body;
    await db.execute(sql`UPDATE users SET shop_role = ${role} WHERE id = ${req.params.userId} AND shop_id = ${cu.shop_id}`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to update role" }); }
});
app.delete("/api/team/:userId", requireAuth, async (req, res) => {
  try {
    const currentUserId = (req.session as any).userId;
    const delRes = await db.execute(sql`SELECT shop_id FROM users WHERE id = ${currentUserId}`);
    const du = delRes.rows[0] as any;
    await db.execute(sql`DELETE FROM users WHERE id = ${req.params.userId} AND shop_id = ${du.shop_id} AND shop_role != 'owner'`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Failed to remove member" }); }
});


app.get("/api/leads", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const result = await db.execute(sql`SELECT * FROM leads WHERE user_id = ${userId} ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (e) { res.json([]); }
});
app.post("/api/leads", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { firstName, lastName, email, phone, city, state, projectType, stoneType, estimatedSqft, estimatedValue, source, status, notes, followUpDate } = req.body;
    const result = await db.execute(sql`INSERT INTO leads (user_id, first_name, last_name, email, phone, city, state, project_type, stone_type, estimated_sqft, estimated_value, source, status, notes, follow_up_date) VALUES (${userId}, ${firstName}, ${lastName}, ${email||null}, ${phone||null}, ${city||null}, ${state||null}, ${projectType}, ${stoneType}, ${estimatedSqft||null}, ${estimatedValue||null}, ${source}, ${status||'new'}, ${notes||null}, ${followUpDate||null}) RETURNING *`);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
app.patch("/api/leads/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { status, notes, followUpDate } = req.body;
    const result = await db.execute(sql`UPDATE leads SET status = COALESCE(${status||null}, status), notes = COALESCE(${notes||null}, notes), follow_up_date = COALESCE(${followUpDate||null}::date, follow_up_date), updated_at = NOW() WHERE id = ${req.params.id} AND user_id = ${userId} RETURNING *`);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
app.delete("/api/leads/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    await db.execute(sql`DELETE FROM leads WHERE id = ${req.params.id} AND user_id = ${userId}`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});


app.get("/api/remnants", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const result = await db.execute(sql`SELECT *, (length_inches * width_inches / 144) as sqft FROM remnants WHERE user_id = ${userId} ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (e) { res.json([]); }
});
app.post("/api/remnants", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { material, stoneType, color, lengthInches, widthInches, location, status, notes } = req.body;
    const sqft = (parseFloat(lengthInches)||0) * (parseFloat(widthInches)||0) / 144;
    const result = await db.execute(sql`INSERT INTO remnants (user_id, material, stone_type, color, length_inches, width_inches, sqft, location, status, notes) VALUES (${userId}, ${material||null}, ${stoneType}, ${color||null}, ${lengthInches||null}, ${widthInches||null}, ${sqft}, ${location||null}, ${status||'available'}, ${notes||null}) RETURNING *`);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
app.patch("/api/remnants/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { status } = req.body;
    const result = await db.execute(sql`UPDATE remnants SET status = ${status} WHERE id = ${req.params.id} AND user_id = ${userId} RETURNING *`);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
app.delete("/api/remnants/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    await db.execute(sql`DELETE FROM remnants WHERE id = ${req.params.id} AND user_id = ${userId}`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
app.get("/api/care-guides", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const result = await db.execute(sql`SELECT * FROM care_guides WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 20`);
    res.json(result.rows);
  } catch (e) { res.json([]); }
});
app.post("/api/care-guides", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { stoneType, guideText, sentTo, jobId } = req.body;
    const result = await db.execute(sql`INSERT INTO care_guides (user_id, job_id, stone_type, guide_text, sent_to) VALUES (${userId}, ${jobId||null}, ${stoneType}, ${guideText}, ${sentTo||null}) RETURNING *`);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
app.get("/api/tax-credits", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const result = await db.execute(sql`SELECT * FROM tax_credits WHERE user_id = ${userId} ORDER BY purchase_date DESC`);
    res.json(result.rows);
  } catch (e) { res.json([]); }
});
app.post("/api/tax-credits", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { description, amount, category, purchaseDate, taxYear, notes } = req.body;
    const result = await db.execute(sql`INSERT INTO tax_credits (user_id, description, amount, category, purchase_date, tax_year, notes) VALUES (${userId}, ${description}, ${parseFloat(amount)||0}, ${category}, ${purchaseDate}, ${parseInt(taxYear)||new Date().getFullYear()}, ${notes||null}) RETURNING *`);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
app.delete("/api/tax-credits/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    await db.execute(sql`DELETE FROM tax_credits WHERE id = ${req.params.id} AND user_id = ${userId}`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`StoneDesk API running on port ${PORT}`);
  await seedAdmin();
});

export default app;
