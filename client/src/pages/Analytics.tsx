import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#f97316"];

export default function Analytics() {
  const { data: jobs = [] } = useQuery({
    queryKey: ["/api/jobs"],
    queryFn: () => fetch("/api/jobs", { credentials: "include" }).then(r => r.json()),
  });
  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: () => fetch("/api/customers", { credentials: "include" }).then(r => r.json()),
  });
  const { data: leads = [] } = useQuery({
    queryKey: ["/api/leads"],
    queryFn: () => fetch("/api/leads", { credentials: "include" }).then(r => r.json()),
  });

  const jobsList = jobs as any[];
  const leadsList = leads as any[];

  // Revenue by month (last 6 months)
  const revenueByMonth: Record<string, number> = {};
  jobsList.forEach((j: any) => {
    if (!j.created_at) return;
    const month = new Date(j.created_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    revenueByMonth[month] = (revenueByMonth[month] || 0) + (j.estimated_revenue || 0);
  });
  const revenueData = Object.entries(revenueByMonth).slice(-6).map(([name, value]) => ({ name, value }));

  // Jobs by stone type
  const byStone: Record<string, number> = {};
  jobsList.forEach((j: any) => { if (j.stone_type) byStone[j.stone_type] = (byStone[j.stone_type] || 0) + 1; });
  const stoneData = Object.entries(byStone).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));

  // Jobs by stage
  const byStage: Record<string, number> = {};
  jobsList.forEach((j: any) => { if (j.stage) byStage[j.stage] = (byStage[j.stage] || 0) + 1; });
  const stageData = Object.entries(byStage).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

  // Leads by source
  const bySource: Record<string, number> = {};
  leadsList.forEach((l: any) => { if (l.source) bySource[l.source] = (bySource[l.source] || 0) + 1; });
  const sourceData = Object.entries(bySource).map(([name, value]) => ({ name, value }));

  // KPIs
  const totalRevenue = jobsList.reduce((s: number, j: any) => s + (j.estimated_revenue || 0), 0);
  const completedJobs = jobsList.filter((j: any) => j.stage === "complete").length;
  const avgJobValue = jobsList.length > 0 ? totalRevenue / jobsList.length : 0;
  const totalSqft = jobsList.reduce((s: number, j: any) => s + (j.total_sqft || 0), 0);

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Shop Analytics</h1>
        <p className="text-zinc-500 mt-1">Revenue, jobs, leads, and stone trends</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Total Revenue</div>
          <div className="text-amber-400 font-mono text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
          <div className="text-zinc-600 text-xs mt-1">{jobsList.length} total jobs</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Avg Job Value</div>
          <div className="text-emerald-400 font-mono text-2xl font-bold">${Math.round(avgJobValue).toLocaleString()}</div>
          <div className="text-zinc-600 text-xs mt-1">Per job average</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Completed Jobs</div>
          <div className="text-blue-400 font-mono text-2xl font-bold">{completedJobs}</div>
          <div className="text-zinc-600 text-xs mt-1">of {jobsList.length} total</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Total Sq Ft</div>
          <div className="text-purple-400 font-mono text-2xl font-bold">{Math.round(totalSqft).toLocaleString()}</div>
          <div className="text-zinc-600 text-xs mt-1">Fabricated</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Revenue by Month</h3>
          {revenueData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-zinc-600 text-sm">No revenue data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 11 }} />
                <YAxis tick={{ fill: "#71717a", fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Revenue"]} contentStyle={{ background: "#0d0d14", border: "1px solid #27272a", borderRadius: "8px" }} />
                <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Jobs by Stone Type</h3>
          {stoneData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-zinc-600 text-sm">No stone data yet</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={stoneData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                    {stoneData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0d0d14", border: "1px solid #27272a", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {stoneData.map((s: any, i: number) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-zinc-300 text-xs">{s.name}</span>
                    </div>
                    <span className="text-zinc-500 text-xs font-mono">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Jobs by Stage</h3>
          {stageData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-zinc-600 text-sm">No jobs yet</div>
          ) : (
            <div className="space-y-2">
              {stageData.sort((a, b) => b.value - a.value).map((s: any, i: number) => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="text-zinc-400 text-xs w-32 capitalize">{s.name}</div>
                  <div className="flex-1 bg-zinc-900 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${(s.value / jobsList.length) * 100}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                  <div className="text-zinc-400 text-xs font-mono w-6 text-right">{s.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Lead Sources</h3>
          {sourceData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-zinc-600 text-sm">No leads yet — add leads to see source data</div>
          ) : (
            <div className="space-y-2">
              {sourceData.sort((a, b) => b.value - a.value).map((s: any, i: number) => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="text-zinc-400 text-xs w-32">{s.name}</div>
                  <div className="flex-1 bg-zinc-900 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${(s.value / leadsList.length) * 100}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                  <div className="text-zinc-400 text-xs font-mono w-6 text-right">{s.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
