import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Download, DollarSign } from "lucide-react";

export default function Profitability() {
  const [sortBy, setSortBy] = useState("margin");

  const { data: jobs = [] } = useQuery({
    queryKey: ["/api/jobs"],
    queryFn: () => fetch("/api/jobs", { credentials: "include" }).then(r => r.json()),
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/settings/costs"],
    queryFn: () => fetch("/api/settings/costs", { credentials: "include" }).then(r => r.json()),
  });

  const laborRate = (settings as any)?.laborCostPerHour || 66;
  const oppRate = (settings as any)?.opportunityCostPerHour || 250;

  const jobsList = (jobs as any[]).map((j: any) => {
    const revenue = j.estimated_revenue || 0;
    const material = j.material_cost || 0;
    const laborHours = j.labor_hours || 0;
    const laborCost = laborHours * laborRate;
    const totalCost = material + laborCost;
    const grossProfit = revenue - totalCost;
    const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const pricePerSqft = j.total_sqft > 0 ? revenue / j.total_sqft : 0;
    const costPerSqft = j.total_sqft > 0 ? totalCost / j.total_sqft : 0;
    return { ...j, material, laborCost, totalCost, grossProfit, margin, pricePerSqft, costPerSqft, laborHours };
  });

  const sorted = [...jobsList].sort((a, b) => {
    if (sortBy === "margin") return b.margin - a.margin;
    if (sortBy === "profit") return b.grossProfit - a.grossProfit;
    if (sortBy === "revenue") return b.estimated_revenue - a.estimated_revenue;
    return 0;
  });

  const totalRevenue = jobsList.reduce((s, j) => s + (j.estimated_revenue || 0), 0);
  const totalCost = jobsList.reduce((s, j) => s + j.totalCost, 0);
  const totalProfit = totalRevenue - totalCost;
  const avgMargin = jobsList.length > 0 ? jobsList.reduce((s, j) => s + j.margin, 0) / jobsList.length : 0;
  const highMarginJobs = jobsList.filter(j => j.margin >= 40).length;
  const lowMarginJobs = jobsList.filter(j => j.margin < 20 && j.estimated_revenue > 0).length;

  const exportCSV = () => {
    const rows = sorted.map(j => `"${j.job_name}","${j.stone_type||''}","${j.total_sqft||0}","${j.estimated_revenue||0}","${j.material.toFixed(0)}","${j.laborCost.toFixed(0)}","${j.totalCost.toFixed(0)}","${j.grossProfit.toFixed(0)}","${j.margin.toFixed(1)}%"`);
    const csv = `"Job","Stone","Sq Ft","Revenue","Material","Labor","Total Cost","Gross Profit","Margin"\n${rows.join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `StoneDesk-Profitability-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Job Profitability</h1>
          <p className="text-zinc-500 mt-1">Actual margin and profit per job — know which jobs make money</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold px-4 py-2.5 rounded-lg text-sm">
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Total Revenue</div>
          <div className="text-amber-400 font-mono text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Gross Profit</div>
          <div className={`font-mono text-2xl font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>${totalProfit.toLocaleString()}</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Avg Margin</div>
          <div className={`font-mono text-2xl font-bold ${avgMargin >= 40 ? 'text-emerald-400' : avgMargin >= 25 ? 'text-amber-400' : 'text-red-400'}`}>{avgMargin.toFixed(1)}%</div>
          <div className="text-zinc-600 text-xs mt-1">Target: 40%+</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">High Margin Jobs</div>
          <div className="text-emerald-400 font-mono text-2xl font-bold">{highMarginJobs}</div>
          <div className="text-zinc-600 text-xs mt-1">{lowMarginJobs} below 20%</div>
        </div>
      </div>

      {lowMarginJobs > 0 && (
        <div className="bg-red-950/20 border border-red-800/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 text-red-400 font-semibold text-sm mb-1">
            <TrendingDown size={14} /> {lowMarginJobs} job{lowMarginJobs > 1 ? 's' : ''} below 20% margin
          </div>
          <p className="text-zinc-400 text-xs">These jobs may be underpriced or have higher than expected material costs. Review pricing on similar future jobs.</p>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <span className="text-zinc-500 text-xs self-center mr-2">Sort by:</span>
        {[["margin", "Margin"], ["profit", "Profit"], ["revenue", "Revenue"]].map(([val, label]) => (
          <button key={val} onClick={() => setSortBy(val)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sortBy === val ? "bg-amber-500 text-black" : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Job</th>
              <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Revenue</th>
              <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Material</th>
              <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Labor</th>
              <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Profit</th>
              <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Margin</th>
              <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">$/Sqft</th>
            </tr>
          </thead>
          <tbody>
            {sorted.filter(j => j.estimated_revenue > 0).map((j: any) => (
              <tr key={j.id} className="border-b border-zinc-800/40 hover:bg-zinc-900/20">
                <td className="px-5 py-3">
                  <div className="text-zinc-200 font-medium">{j.job_name}</div>
                  <div className="text-zinc-500 text-xs">{j.stone_type} · {j.total_sqft} sf</div>
                </td>
                <td className="px-5 py-3 text-zinc-300 font-mono text-sm">${(j.estimated_revenue||0).toLocaleString()}</td>
                <td className="px-5 py-3 text-zinc-400 font-mono text-sm">${j.material.toFixed(0)}</td>
                <td className="px-5 py-3 text-zinc-400 font-mono text-sm">${j.laborCost.toFixed(0)}</td>
                <td className={`px-5 py-3 font-mono text-sm ${j.grossProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>${j.grossProfit.toFixed(0)}</td>
                <td className="px-5 py-3">
                  <div className={`text-xs font-bold px-2 py-0.5 rounded inline-block ${j.margin >= 40 ? 'bg-emerald-500/20 text-emerald-400' : j.margin >= 25 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                    {j.margin.toFixed(1)}%
                  </div>
                </td>
                <td className="px-5 py-3 text-zinc-400 font-mono text-sm">${j.pricePerSqft.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.filter(j => j.estimated_revenue > 0).length === 0 && (
          <div className="py-12 text-center">
            <DollarSign size={32} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Add revenue to your jobs to see profitability data</p>
          </div>
        )}
      </div>
    </div>
  );
}
