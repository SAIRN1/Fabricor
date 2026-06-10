import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Minus, Award, AlertCircle } from "lucide-react";

const INDUSTRY_BENCHMARKS = {
  avgJobValue: 3200,
  grossMargin: 42,
  jobsPerMonth: 18,
  avgSqftPerJob: 48,
  leadConversionRate: 35,
  avgDaysToComplete: 14,
  remakeRate: 3.2,
  avgLaborHoursPerJob: 6.5,
  revenuePerSqft: 67,
  customerSatisfaction: 4.6,
};

const BENCHMARK_LABELS: Record<string, { label: string; unit: string; higherIsBetter: boolean; description: string }> = {
  avgJobValue: { label: "Avg Job Value", unit: "$", higherIsBetter: true, description: "Average revenue per completed job" },
  grossMargin: { label: "Gross Margin", unit: "%", higherIsBetter: true, description: "Revenue minus material and labor costs" },
  jobsPerMonth: { label: "Jobs per Month", unit: "", higherIsBetter: true, description: "Average completed jobs per month" },
  avgSqftPerJob: { label: "Avg Sq Ft / Job", unit: "sf", higherIsBetter: true, description: "Average square footage per job" },
  leadConversionRate: { label: "Lead Conversion", unit: "%", higherIsBetter: true, description: "Percentage of leads that become jobs" },
  avgDaysToComplete: { label: "Days to Complete", unit: "days", higherIsBetter: false, description: "Average days from intake to complete" },
  remakeRate: { label: "Remake Rate", unit: "%", higherIsBetter: false, description: "Percentage of jobs requiring remake" },
  revenuePerSqft: { label: "Revenue / Sq Ft", unit: "$", higherIsBetter: true, description: "Average revenue per square foot" },
};

export default function Benchmarking() {
  const { data: jobs = [] } = useQuery({
    queryKey: ["/api/jobs"],
    queryFn: () => fetch("/api/jobs", { credentials: "include" }).then(r => r.json()),
  });
  const { data: leads = [] } = useQuery({
    queryKey: ["/api/leads"],
    queryFn: () => fetch("/api/leads", { credentials: "include" }).then(r => r.json()),
  });
  const { data: issues = [] } = useQuery({
    queryKey: ["/api/issues"],
    queryFn: () => fetch("/api/issues", { credentials: "include" }).then(r => r.json()),
  });

  const jobsList = jobs as any[];
  const leadsList = leads as any[];
  const issuesList = issues as any[];

  const completedJobs = jobsList.filter(j => j.stage === "complete");
  const totalRevenue = jobsList.reduce((s, j) => s + (j.estimated_revenue || 0), 0);
  const totalSqft = jobsList.reduce((s, j) => s + (j.total_sqft || 0), 0);
  const wonLeads = leadsList.filter(l => l.status === "won").length;

  // Calculate months active
  const firstJob = jobsList.length > 0 ? new Date(jobsList[jobsList.length - 1].created_at) : new Date();
  const monthsActive = Math.max(1, Math.round((new Date().getTime() - firstJob.getTime()) / (1000 * 60 * 60 * 24 * 30)));

  const myMetrics: Record<string, number> = {
    avgJobValue: completedJobs.length > 0 ? totalRevenue / completedJobs.length : 0,
    grossMargin: (() => {
      const rev = jobsList.reduce((s, j) => s + (j.estimated_revenue || 0), 0);
      const cost = jobsList.reduce((s, j) => s + (j.material_cost || 0), 0);
      return rev > 0 ? ((rev - cost) / rev) * 100 : 0;
    })(),
    jobsPerMonth: Math.round(jobsList.length / monthsActive),
    avgSqftPerJob: jobsList.length > 0 ? totalSqft / jobsList.length : 0,
    leadConversionRate: leadsList.length > 0 ? (wonLeads / leadsList.length) * 100 : 0,
    avgDaysToComplete: (() => {
      const completed = completedJobs.filter(j => j.created_at && j.updated_at);
      if (!completed.length) return 0;
      const avg = completed.reduce((s, j) => s + (new Date(j.updated_at).getTime() - new Date(j.created_at).getTime()) / (1000 * 60 * 60 * 24), 0);
      return Math.round(avg / completed.length);
    })(),
    remakeRate: jobsList.length > 0 ? (issuesList.filter(i => i.issue_type === "remake").length / jobsList.length) * 100 : 0,
    revenuePerSqft: totalSqft > 0 ? totalRevenue / totalSqft : 0,
  };

  const getScore = (key: string, myVal: number): "above" | "below" | "at" => {
    const bench = INDUSTRY_BENCHMARKS[key as keyof typeof INDUSTRY_BENCHMARKS];
    const higherIsBetter = BENCHMARK_LABELS[key]?.higherIsBetter;
    if (myVal === 0) return "below";
    const ratio = myVal / bench;
    if (ratio > 1.05) return higherIsBetter ? "above" : "below";
    if (ratio < 0.95) return higherIsBetter ? "below" : "above";
    return "at";
  };

  const aboveCount = Object.keys(BENCHMARK_LABELS).filter(k => getScore(k, myMetrics[k] || 0) === "above").length;
  const belowCount = Object.keys(BENCHMARK_LABELS).filter(k => getScore(k, myMetrics[k] || 0) === "below").length;
  const overallScore = Math.round((aboveCount / Object.keys(BENCHMARK_LABELS).length) * 100);

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Industry Benchmarking</h1>
        <p className="text-zinc-500 mt-1">See how your shop compares to industry averages across 2,600+ stone fabrication shops</p>
      </div>

      <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-2">
          <AlertCircle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-zinc-400 text-xs">Industry benchmarks are based on published data from the Stone Fabricators Alliance, Stone World Magazine, and industry research. Your metrics are calculated from your StoneDesk data and may need more jobs to be meaningful.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4 text-center">
          <div className="text-5xl font-bold text-amber-400 font-mono mb-1">{overallScore}</div>
          <div className="text-zinc-400 text-sm">Performance Score</div>
          <div className="text-zinc-600 text-xs mt-1">vs. industry average</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4 text-center">
          <div className="text-4xl font-bold text-emerald-400 font-mono mb-1">{aboveCount}</div>
          <div className="text-zinc-400 text-sm">Above Average</div>
          <div className="text-zinc-600 text-xs mt-1">metrics beating industry</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4 text-center">
          <div className="text-4xl font-bold text-red-400 font-mono mb-1">{belowCount}</div>
          <div className="text-zinc-400 text-sm">Below Average</div>
          <div className="text-zinc-600 text-xs mt-1">metrics to improve</div>
        </div>
      </div>

      <div className="space-y-3">
        {Object.entries(BENCHMARK_LABELS).map(([key, info]) => {
          const myVal = myMetrics[key] || 0;
          const benchVal = INDUSTRY_BENCHMARKS[key as keyof typeof INDUSTRY_BENCHMARKS];
          const score = getScore(key, myVal);
          const hasData = myVal > 0;

          return (
            <div key={key} className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-white font-semibold text-sm">{info.label}</span>
                  <span className="text-zinc-600 text-xs ml-2">{info.description}</span>
                </div>
                <div className="flex items-center gap-2">
                  {score === "above" && <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold"><TrendingUp size={12} /> Above Avg</span>}
                  {score === "below" && <span className="flex items-center gap-1 text-red-400 text-xs font-semibold"><TrendingDown size={12} /> Below Avg</span>}
                  {score === "at" && <span className="flex items-center gap-1 text-zinc-400 text-xs"><Minus size={12} /> On Target</span>}
                </div>
              </div>
              <div className="flex items-end gap-6">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-500">Your Shop</span>
                    <span className={`font-mono font-bold ${score === "above" ? "text-emerald-400" : score === "below" ? "text-red-400" : "text-zinc-300"}`}>
                      {hasData ? `${info.unit === "$" ? "$" : ""}${myVal.toFixed(info.unit === "%" || info.unit === "days" ? 1 : 0)}${info.unit !== "$" ? info.unit : ""}` : "No data yet"}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 mb-1">
                    <div className={`h-2 rounded-full transition-all ${score === "above" ? "bg-emerald-500" : score === "below" ? "bg-red-500" : "bg-amber-500"}`}
                      style={{ width: hasData ? `${Math.min(100, (myVal / (benchVal * 2)) * 100)}%` : "0%" }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-600">Industry Avg: {info.unit === "$" ? "$" : ""}{benchVal}{info.unit !== "$" ? info.unit : ""}</span>
                    <div className="w-0.5 h-2 bg-zinc-500 -mt-2" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Award size={16} className="text-amber-400" /> Top Performer Benchmarks</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Revenue/Sqft", value: "$85+", desc: "Top 25% of shops" },
            { label: "Gross Margin", value: "50%+", desc: "Elite fabricators" },
            { label: "Conversion Rate", value: "45%+", desc: "Top sales teams" },
            { label: "Days to Complete", value: "<10 days", desc: "Fastest shops" },
          ].map(b => (
            <div key={b.label} className="bg-zinc-900 rounded-lg p-3 text-center">
              <div className="text-amber-400 font-mono font-bold">{b.value}</div>
              <div className="text-zinc-300 text-xs mt-0.5">{b.label}</div>
              <div className="text-zinc-600 text-xs">{b.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
