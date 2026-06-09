const fs = require('fs');
let c = fs.readFileSync('client/src/pages/Dashboard.tsx', 'utf8');

// Add stale jobs query after trendsData query
const afterTrends = `  const { data: trendsData } = useQuery({
    queryKey: ["/api/analytics/trends"],
    queryFn: () => fetch("/api/analytics/trends?weeks=8", { credentials: "include" }).then(r => r.json()),
  });`;

const withAlerts = `  const { data: trendsData } = useQuery({
    queryKey: ["/api/analytics/trends"],
    queryFn: () => fetch("/api/analytics/trends?weeks=8", { credentials: "include" }).then(r => r.json()),
  });
  const { data: staleJobs = [] } = useQuery({
    queryKey: ["/api/jobs/stale"],
    queryFn: () => fetch("/api/jobs/stale", { credentials: "include" }).then(r => r.json()),
  });`;

c = c.replace(afterTrends, withAlerts);

// Add stale jobs alert section after the opening div of the return
const afterOpenDiv = `  return (
    <div className="p-8">
      <div className="mb-8">`;

const withAlertsSection = `  return (
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
      <div className="mb-8">`;

c = c.replace(afterOpenDiv, withAlertsSection);
fs.writeFileSync('client/src/pages/Dashboard.tsx', c);
console.log('done, length:', c.length);
