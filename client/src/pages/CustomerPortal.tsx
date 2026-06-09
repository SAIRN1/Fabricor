import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Clock, Truck, PenLine, Package, Wrench, Star } from "lucide-react";

const STAGE_INFO: Record<string, { label: string; icon: any; desc: string; color: string }> = {
  inquiry:          { label: "Inquiry Received",     icon: Clock,        desc: "We have received your inquiry and will be in touch shortly.",         color: "text-zinc-400" },
  quote_sent:       { label: "Quote Sent",           icon: Star,         desc: "We have sent you a quote. Please review and let us know.",            color: "text-blue-400" },
  quote_approved:   { label: "Quote Approved",       icon: CheckCircle,  desc: "Your quote has been approved. We are scheduling your template.",      color: "text-emerald-400" },
  template_scheduled: { label: "Template Scheduled", icon: Clock,        desc: "Your template appointment is scheduled. We will measure your space.", color: "text-amber-400" },
  template_complete:  { label: "Template Complete",  icon: CheckCircle,  desc: "Your template is complete. We are fabricating your countertops.",    color: "text-emerald-400" },
  fabricating:      { label: "Fabricating",          icon: Wrench,       desc: "Your countertops are being cut and finished in our shop.",            color: "text-purple-400" },
  ready:            { label: "Ready for Install",    icon: Package,      desc: "Your countertops are ready! We are scheduling your installation.",   color: "text-amber-400" },
  installation_scheduled: { label: "Install Scheduled", icon: Truck,     desc: "Your installation is scheduled. We will see you soon!",             color: "text-blue-400" },
  complete:         { label: "Complete",             icon: CheckCircle,  desc: "Your project is complete. Thank you for choosing us!",               color: "text-emerald-400" },
};

const STAGE_ORDER = ["inquiry","quote_sent","quote_approved","template_scheduled","template_complete","fabricating","ready","installation_scheduled","complete"];

export default function CustomerPortal() {
  const [jobNumber, setJobNumber] = useState("");
  const [email, setEmail] = useState("");
  const [searched, setSearched] = useState(false);

  const { data: result, isLoading, refetch } = useQuery({
    queryKey: ["/api/portal/job", jobNumber, email],
    queryFn: async () => {
      if (!jobNumber || !email) return null;
      const r = await fetch(`/api/portal/job?jobNumber=${encodeURIComponent(jobNumber)}&email=${encodeURIComponent(email)}`);
      return r.json();
    },
    enabled: false,
  });

  const handleSearch = () => {
    setSearched(true);
    refetch();
  };

  const job = result?.job;
  const currentStageIndex = job ? STAGE_ORDER.indexOf(job.stage) : -1;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <span className="text-black font-bold text-lg">S</span>
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">StoneDesk</span>
          </div>
          <h1 className="text-white text-2xl font-bold mb-2">Track Your Project</h1>
          <p className="text-zinc-500 text-sm">Enter your job number and email to see your project status</p>
        </div>

        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Job Number</label>
              <input type="text" placeholder="e.g. 1234" value={jobNumber} onChange={e => setJobNumber(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                onKeyDown={e => e.key === "Enter" && handleSearch()} />
            </div>
            <div>
              <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Your Email</label>
              <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                onKeyDown={e => e.key === "Enter" && handleSearch()} />
            </div>
          </div>
          <button onClick={handleSearch} disabled={isLoading || !jobNumber || !email}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold py-3 rounded-xl transition-colors">
            {isLoading ? "Searching..." : "Track My Project"}
          </button>
        </div>

        {searched && !isLoading && !job && (
          <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-2xl p-6 text-center">
            <p className="text-zinc-400">No project found. Please check your job number and email address.</p>
          </div>
        )}

        {job && (
          <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-2xl p-6">
            <div className="mb-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-white font-bold text-xl">{job.jobName}</h2>
                  <p className="text-zinc-500 text-sm">Job #{job.jobNumber} · {job.jobCity}, {job.jobState}</p>
                </div>
                {job.stage === "complete" && (
                  <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg px-3 py-1.5">
                    <span className="text-emerald-400 text-xs font-bold">COMPLETE</span>
                  </div>
                )}
              </div>
              {job.stoneType && (
                <div className="text-zinc-400 text-sm mt-1">
                  <span className="text-zinc-600">Material: </span>{job.stoneType} {job.areas ? `· ${job.areas}` : ""}
                </div>
              )}
            </div>

            {/* Current Status */}
            {STAGE_INFO[job.stage] && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                <div className={`font-bold text-lg mb-1 ${STAGE_INFO[job.stage].color}`}>
                  {STAGE_INFO[job.stage].label}
                </div>
                <p className="text-zinc-400 text-sm">{STAGE_INFO[job.stage].desc}</p>
              </div>
            )}

            {/* Progress Timeline */}
            <div className="space-y-2">
              <div className="text-zinc-500 text-xs uppercase tracking-wider mb-3">Project Timeline</div>
              {STAGE_ORDER.map((stage, i) => {
                const info = STAGE_INFO[stage];
                if (!info) return null;
                const isComplete = i < currentStageIndex;
                const isCurrent = i === currentStageIndex;
                const Icon = info.icon;
                return (
                  <div key={stage} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isCurrent ? "bg-amber-500/10 border border-amber-500/20" : isComplete ? "opacity-60" : "opacity-30"}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isComplete ? "bg-emerald-500" : isCurrent ? "bg-amber-500" : "bg-zinc-800"}`}>
                      {isComplete ? <CheckCircle size={14} className="text-white" /> : <Icon size={14} className={isCurrent ? "text-black" : "text-zinc-600"} />}
                    </div>
                    <div className={`text-sm font-medium ${isCurrent ? "text-amber-400" : isComplete ? "text-zinc-300" : "text-zinc-600"}`}>
                      {info.label}
                    </div>
                    {isCurrent && <div className="ml-auto text-amber-400 text-xs font-bold">CURRENT</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-center text-zinc-700 text-xs mt-6">StoneDesk by SAIRN Technologies</p>
      </div>
    </div>
  );
}
