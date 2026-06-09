import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../App";
import { AlertTriangle, DollarSign, Activity, ArrowUpRight, ArrowDownRight, Brain, CheckCircle, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const fmt = (n: number) => n?.toLocaleString("en-US", { maximumFractionDigits: 0 }) ?? "—";
const fmtCurrency = (n: number) => n != null ? `$${fmt(n)}` : "—";

function HealthGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Critical";
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#1c1c27" strokeWidth="8" />
          <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl font-bold text-white">{score}</span>
          <span className="text-xs text-zinc-500">/ 100</span>
        </div>
      </div>
      <div className="mt-2 text-sm font-medium" style={{ color }}>{label}</div>
    </div>
  );
}

function KPICard({ label, value, delta, format = "number", icon: Icon, accent }: any) {
  const isPositive = delta > 0;
  const isNeutral = delta === 0 || delta === undefined;
  const deltaColor = format === "currency"
    ? (isPositive ? "text-red-400" : "text-emerald-400")
    : (isPositive ? "text-emerald-400" : "text-red-400");
  return (
    <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-lg bg-zinc-900">
          <Icon size={16} className={accent || "text-amber-400"} />
        </div>
        {!isNeutral && (
          <div className={`flex items-center gap-1 text-xs font-mono ${deltaColor}`}>
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(delta)}
          </div>
        )}
      </div>
      <div className="font-mono text-2xl font-bold text-white">
        {format === "currency" ? fmtCurrency(value) : fmt(value)}
      </div>
      <div className="text-zinc-500 text-sm mt-1">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  const { data: summary, isLoading } = useQuery({
    queryKey: ["/api/dashboard/summary"],
    queryFn: () => fetch("/api/dashboard/summary", { credentials: "include" }).then(r => r.json()),
    refetchInterval: 60000,
  });

  const { data: analysis } = useQuery({
    queryKey: ["/api/claude/analyze-issues"],
    queryFn: () => fetch("/api/claude/analyze-issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      credentials: "include",
    }).then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const { data: trendsData } = useQuery({
    queryKey: ["/api/analytics/trends"],
    queryFn: () => fetch("/api/analytics/trends?weeks=8", { credentials: "include" }).then(r => r.json()),
  });
  const { data: staleJobs = [] } = useQuery({
    queryKey: ["/api/jobs/stale"],
    queryFn: () => fetch("/api/jobs/stale", { credentials: "include" }).then(r => r.json()),
  });

  if (isLoading) return (
    <div className="p-8 flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { healthScore, thisWeek, prevWeek, atRisk, deltas, currentWeek } = summary || {};
  const chartData = trendsData?.issuesByWeek?.map((w: any) => ({
    name: `Wk ${w.weekNumber}`,
    impact: Math.round(w.totalImpact || 0),
  })) || [];

  return (
    <div className="p-8">
      {(staleJobs as any[]).length > 0 && (
        <div className="mb-6 bg-red-950/20 border border-red-800/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-400 font-semibold text-sm mb-3">
            <span>⚠️</span> {(staleJobs as any[]).length} Job{(staleJobs as any[]).length > 1 ? 's' : ''} Need Attention
          </div>
          <div className="space-y-2">
            {(staleJobs as any[]).map((job: any) => (
              <div key={job.id} className="flex items-center justify-between bg-red-950/20 rounded-lg px-3 py-2">
                <div>
                  <span className="text-zinc-200 text-sm font-medium">{job.job_name}</span>
                  <span className="text-zinc-500 text-xs ml-2">#{job.job_number}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 text-xs capitalize">{job.stage?.replace(/_/g, ' ')}</span>
                  <span className="text-red-400 text-xs font-mono">{job.days_in_stage} days</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-zinc-500 text-sm font-mono mb-2">
          <Activity size={13} />
          <span>Week {currentWeek?.week} · {currentWeek?.year}</span>
        </div>
        <h1 className="text-3xl font-bold text-white">
          Good morning, <span className="text-amber-400">{user?.name?.split(" ")[0]}</span>
        </h1>
        <p className="text-zinc-500 mt-1">Here's what's happening at {user?.shopName || "your shop"} this week.</p>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="col-span-1 bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-6 flex flex-col items-center justify-center">
          <div className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-4">Shop Health</div>
          <HealthGauge score={healthScore || 0} />
        </div>
        <div className="col-span-4 grid grid-cols-4 gap-4">
          <KPICard label="Issues This Week" value={thisWeek?.issueCount || 0} delta={deltas?.issueCount} icon={AlertTriangle} accent="text-red-400" />
          <KPICard label="Total Impact" value={thisWeek?.totalImpact || 0} delta={deltas?.totalImpact} format="currency" icon={DollarSign} accent="text-amber-400" />
          <KPICard label="Remakes" value={thisWeek?.remakeCount || 0} delta={(thisWeek?.remakeCount || 0) - (prevWeek?.remakeCount || 0)} icon={Clock} accent="text-orange-400" />
          <KPICard label="At Risk Jobs" value={atRisk?.length || 0} icon={CheckCircle} accent="text-emerald-400" />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="col-span-3 bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-1">Issue Impact Trend</h2>
          <p className="text-zinc-500 text-sm mb-6">8-week financial impact of quality issues</p>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="impactGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#3f3f4e" tick={{ fill: "#71717a", fontSize: 11 }} />
                <YAxis stroke="#3f3f4e" tick={{ fill: "#71717a", fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ background: "#0d0d14", border: "1px solid #27272a", borderRadius: 8, color: "#e4e4e7" }}
                  formatter={(v: any) => [`$${fmt(v)}`, "Impact"]} />
                <Area type="monotone" dataKey="impact" stroke="#f59e0b" strokeWidth={2} fill="url(#impactGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-zinc-600 text-sm">
              Start logging issues to see your trend data
            </div>
          )}
        </div>

        <div className="col-span-2 bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle size={15} className="text-red-400" />
            <h2 className="text-white font-semibold">At Risk This Week</h2>
            {atRisk?.length > 0 && (
              <span className="ml-auto text-xs bg-red-950 text-red-400 border border-red-900 px-2 py-0.5 rounded-full font-mono">
                {atRisk.length}
              </span>
            )}
          </div>
          {atRisk?.length > 0 ? (
            <div>
              {atRisk.slice(0, 5).map((issue: any) => (
                <div key={issue.id} className="flex items-center gap-3 py-3 border-b border-zinc-800/40 last:border-0">
                  <span className="text-xs px-2 py-0.5 rounded border font-mono uppercase text-red-400 bg-red-950/40 border-red-900/60">
                    {issue.issueType.replace("_", " ")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-zinc-200 truncate">{issue.jobName || "Unnamed"}</div>
                    <div className="text-xs text-zinc-500">{issue.rootCause?.replace("_", " ")}</div>
                  </div>
                  <div className="text-sm font-mono text-red-400 font-semibold">${fmt(issue.totalImpact)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <CheckCircle size={32} className="text-emerald-500 mb-3" />
              <div className="text-zinc-300 text-sm font-medium">No at-risk jobs</div>
              <div className="text-zinc-600 text-xs mt-1">Clean week so far</div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-950/40 to-zinc-900/40 border border-amber-800/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/20 flex-shrink-0">
            <Brain size={20} className="text-amber-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-amber-400 font-semibold text-sm">Claude Intelligence</span>
              <span className="text-xs text-zinc-600 font-mono">· This week's analysis</span>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed">
              {analysis?.analysis || "No issues logged this week — start tracking to unlock AI-powered insights about your shop's quality patterns and cost drivers."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
