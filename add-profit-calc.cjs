const fs = require('fs');
let c = fs.readFileSync('client/src/pages/Dashboard.tsx', 'utf8');

// Add profit calc after staleJobs query
c = c.replace(
  '  const { data: staleJobs = [] } = useQuery({',
  `  const { data: jobsData = [] } = useQuery({
    queryKey: ["/api/jobs"],
    queryFn: () => fetch("/api/jobs", { credentials: "include" }).then(r => r.json()),
  });
  const activeJobs = (jobsData as any[]).filter((j: any) => j.stage !== 'complete');
  const totalRevenue = activeJobs.reduce((s: number, j: any) => s + (j.estimatedRevenue || 0), 0);
  const totalMaterial = activeJobs.reduce((s: number, j: any) => s + (j.materialCost || 0), 0);
  const grossProfit = totalRevenue - totalMaterial;
  const grossMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0.0';
  const { data: staleJobs = [] } = useQuery({`
);

// Add profit section after stale jobs alert
c = c.replace(
  '      <div className="mb-8">',
  `      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Active Pipeline</div>
          <div className="text-amber-400 font-mono text-2xl font-bold">\${totalRevenue.toLocaleString()}</div>
          <div className="text-zinc-600 text-xs mt-1">{activeJobs.length} active jobs</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Gross Profit</div>
          <div className="text-emerald-400 font-mono text-2xl font-bold">\${grossProfit.toLocaleString()}</div>
          <div className="text-zinc-600 text-xs mt-1">After material costs</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Gross Margin</div>
          <div className={\`font-mono text-2xl font-bold \${+grossMargin >= 40 ? 'text-emerald-400' : +grossMargin >= 25 ? 'text-amber-400' : 'text-red-400'}\`}>{grossMargin}%</div>
          <div className="text-zinc-600 text-xs mt-1">Target: 40%+</div>
        </div>
      </div>
      <div className="mb-8">`
);

fs.writeFileSync('client/src/pages/Dashboard.tsx', c);
console.log('done, length:', c.length);
