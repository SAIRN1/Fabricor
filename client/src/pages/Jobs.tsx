import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Briefcase, ChevronRight, PenLine } from "lucide-react";
import SignatureModal from "./../components/SignatureModal";

const STAGES = [
  { key: "inquiry", label: "Inquiry", color: "border-zinc-600 text-zinc-400" },
  { key: "estimate", label: "Estimate", color: "border-blue-600 text-blue-400" },
  { key: "stone_selected", label: "Stone Selected", color: "border-purple-600 text-purple-400" },
  { key: "template_scheduled", label: "Template Scheduled", color: "border-yellow-600 text-yellow-400" },
  { key: "template_complete", label: "Template Complete", color: "border-orange-600 text-orange-400" },
  { key: "layout", label: "Layout", color: "border-amber-600 text-amber-400" },
  { key: "fabrication", label: "Fabrication", color: "border-red-600 text-red-400" },
  { key: "installation", label: "Installation", color: "border-emerald-600 text-emerald-400" },
  { key: "complete", label: "Complete", color: "border-green-600 text-green-400" },
];

export default function Jobs() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [showSig, setShowSig] = useState(false);
  const [form, setForm] = useState({
    jobNumber: "", jobName: "", jobAddress: "", jobCity: "",
    jobState: "OH", jobZip: "", jobType: "Hard Surface",
    areas: "", stoneType: "", stoneColor: "", totalSqft: "",
    estimatedRevenue: "", materialCost: "", salesRep: "",
    templateTech: "", fabricationTech: "", installTech: "",
    notes: "", stage: "inquiry",
  });

  const { data: jobList = [], isLoading } = useQuery({
    queryKey: ["/api/jobs"],
    queryFn: () => fetch("/api/jobs", { credentials: "include" }).then(r => r.json()),
  });

  const { data: customerList = [] } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: () => fetch("/api/customers", { credentials: "include" }).then(r => r.json()),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => fetch("/api/jobs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data), credentials: "include",
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/jobs"] }); setShowForm(false); },
  });

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: any) => fetch(`/api/jobs/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }), credentials: "include",
    }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/jobs"] }),
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const jobsByStage = STAGES.reduce((acc: Record<string, any[]>, s) => {
    acc[s.key] = (jobList as any[]).filter((j: any) => j.stage === s.key);
    return acc;
  }, {});

  const advanceStage = (job: any) => {
    const currentIndex = STAGES.findIndex(s => s.key === job.stage);
    if (currentIndex < STAGES.length - 1) {
      stageMutation.mutate({ id: job.id, stage: STAGES[currentIndex + 1].key });
    }
  };

  return (
    <div className="p-8">
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-zinc-700/60 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800">
              <h2 className="text-white font-semibold text-lg">New Job</h2>
              <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Job Number</label>
                  <input type="text" placeholder="5372" value={form.jobNumber} onChange={e => set("jobNumber", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Job Name</label>
                  <input type="text" placeholder="Smith Kitchen" value={form.jobName} onChange={e => set("jobName", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Customer</label>
                  <select onChange={e => set("customerId", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500">
                    <option value="">Select customer...</option>
                    {(customerList as any[]).map((c: any) => (
                      <option key={c.id} value={c.id}>{c.firstName} {c.lastName} {c.company ? `(${c.company})` : ""}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Stage</label>
                  <select value={form.stage} onChange={e => set("stage", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500">
                    {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Job Address</label>
                <input type="text" placeholder="123 Main Street" value={form.jobAddress} onChange={e => set("jobAddress", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">City</label>
                  <input type="text" placeholder="Westlake" value={form.jobCity} onChange={e => set("jobCity", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">State</label>
                  <input type="text" placeholder="OH" value={form.jobState} onChange={e => set("jobState", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Zip</label>
                  <input type="text" placeholder="44145" value={form.jobZip} onChange={e => set("jobZip", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Stone Type</label>
                  <input type="text" placeholder="Quartzite" value={form.stoneType} onChange={e => set("stoneType", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Stone Color</label>
                  <input type="text" placeholder="Calacatta Gold" value={form.stoneColor} onChange={e => set("stoneColor", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Sq Ft</label>
                  <input type="number" placeholder="65.5" value={form.totalSqft} onChange={e => set("totalSqft", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Est. Revenue</label>
                  <input type="number" placeholder="8500" value={form.estimatedRevenue} onChange={e => set("estimatedRevenue", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Material Cost</label>
                  <input type="number" placeholder="1200" value={form.materialCost} onChange={e => set("materialCost", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[["Sales Rep", "salesRep", "Kelley"], ["Templator", "templateTech", "John"], ["Installer", "installTech", "Mike"]].map(([label, key, ph]) => (
                  <div key={key}>
                    <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">{label}</label>
                    <input type="text" placeholder={ph} value={(form as any)[key]} onChange={e => set(key, e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Areas</label>
                <input type="text" placeholder="Kitchen, Master Bath, Laundry" value={form.areas} onChange={e => set("areas", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Notes</label>
                <textarea rows={2} placeholder="Customer wants waterfall edge on island..." value={form.notes} onChange={e => set("notes", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-2.5 text-sm">Cancel</button>
                <button onClick={() => mutation.mutate({ ...form, totalSqft: parseFloat(form.totalSqft) || 0, estimatedRevenue: parseFloat(form.estimatedRevenue) || 0, materialCost: parseFloat(form.materialCost) || 0 })}
                  disabled={mutation.isPending || !form.jobName}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold rounded-lg py-2.5 text-sm">
                  {mutation.isPending ? "Creating..." : "Create Job"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Job Pipeline</h1>
          <p className="text-zinc-500 mt-1">9-stage job lifecycle from inquiry to completion</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2.5 rounded-lg text-sm">
          <Plus size={16} /> New Job
        </button>
      </div>

      <div className="grid grid-cols-9 gap-2 min-h-96">
        {STAGES.map(stage => (
          <div key={stage.key} className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-3">
            <div className={`text-xs font-mono uppercase font-semibold mb-3 pb-2 border-b border-zinc-800 ${stage.color.split(" ")[1]}`}>
              {stage.label}
              <span className="ml-1 text-zinc-600">({jobsByStage[stage.key]?.length || 0})</span>
            </div>
            <div className="space-y-2">
              {(jobsByStage[stage.key] || []).map((job: any) => (
                <div key={job.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 cursor-pointer hover:border-amber-500/30 transition-all"
                  onClick={() => setSelected(job)}>
                  <div className="text-zinc-200 text-xs font-medium truncate">{job.jobName}</div>
                  {job.jobCity && <div className="text-zinc-600 text-xs mt-0.5 truncate">{job.jobCity}</div>}
                  {job.estimatedRevenue > 0 && (
                    <div className="text-amber-400 text-xs font-mono mt-1">${job.estimatedRevenue.toLocaleString()}</div>
                  )}
                  {stage.key !== "complete" && (
                    <button onClick={e => { e.stopPropagation(); advanceStage(job); }}
                      className="mt-2 w-full flex items-center justify-center gap-1 text-xs text-zinc-500 hover:text-amber-400 transition-colors">
                      <ChevronRight size={10} /> Advance
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showSig && selected && (
        <SignatureModal
          jobName={selected.jobName}
          customerName={selected.jobAddress || "Customer"}
          onSave={(stage, sig) => { setShowSig(false); alert(`✓ ${stage} sign-off saved!`); }}
          onClose={() => setShowSig(false)}
        />
      )}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-zinc-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800">
              <div>
                <h2 className="text-white font-semibold">{selected.jobName}</h2>
                <div className="text-zinc-500 text-sm">Job #{selected.jobNumber}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900 rounded-lg p-3">
                  <div className="text-zinc-500 text-xs mb-1">Stage</div>
                  <div className="text-white text-sm font-medium">{STAGES.find(s => s.key === selected.stage)?.label}</div>
                </div>
                <div className="bg-zinc-900 rounded-lg p-3">
                  <div className="text-zinc-500 text-xs mb-1">Revenue</div>
                  <div className="text-amber-400 text-sm font-mono font-bold">${(selected.estimatedRevenue || 0).toLocaleString()}</div>
                </div>
                <div className="bg-zinc-900 rounded-lg p-3">
                  <div className="text-zinc-500 text-xs mb-1">Square Feet</div>
                  <div className="text-white text-sm font-mono">{selected.totalSqft || 0} SF</div>
                </div>
                <div className="bg-zinc-900 rounded-lg p-3">
                  <div className="text-zinc-500 text-xs mb-1">Material Cost</div>
                  <div className="text-white text-sm font-mono">${(selected.materialCost || 0).toLocaleString()}</div>
                </div>
              </div>
              {selected.stoneType && (
                <div className="bg-zinc-900 rounded-lg p-3">
                  <div className="text-zinc-500 text-xs mb-1">Stone</div>
                  <div className="text-white text-sm">{selected.stoneType} — {selected.stoneColor}</div>
                </div>
              )}
              {selected.areas && (
                <div className="bg-zinc-900 rounded-lg p-3">
                  <div className="text-zinc-500 text-xs mb-1">Areas</div>
                  <div className="text-white text-sm">{selected.areas}</div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                {selected.salesRep && <div className="bg-zinc-900 rounded-lg p-3"><div className="text-zinc-500 text-xs mb-1">Sales Rep</div><div className="text-white text-sm">{selected.salesRep}</div></div>}
                {selected.templateTech && <div className="bg-zinc-900 rounded-lg p-3"><div className="text-zinc-500 text-xs mb-1">Templator</div><div className="text-white text-sm">{selected.templateTech}</div></div>}
                {selected.installTech && <div className="bg-zinc-900 rounded-lg p-3"><div className="text-zinc-500 text-xs mb-1">Installer</div><div className="text-white text-sm">{selected.installTech}</div></div>}
              </div>
              {selected.jobAddress && (
                <div className="bg-zinc-900 rounded-lg p-3">
                  <div className="text-zinc-500 text-xs mb-1">Address</div>
                  <div className="text-white text-sm">{selected.jobAddress}, {selected.jobCity}, {selected.jobState}</div>
                </div>
              )}
              {selected.notes && (
                <div className="bg-zinc-900 rounded-lg p-3">
                  <div className="text-zinc-500 text-xs mb-1">Notes</div>
                  <div className="text-zinc-300 text-sm">{selected.notes}</div>
                </div>
              )}
              <div className="flex gap-2 mb-3">
              <button onClick={() => setShowSig(true)} className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-2.5 text-sm"><PenLine size={14} /> Get Signature</button>
            </div>
            {selected.stage !== "complete" && (
                <button onClick={() => { advanceStage(selected); setSelected(null); }}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg py-2.5 text-sm flex items-center justify-center gap-2">
                  <ChevronRight size={16} />
                  Advance to {STAGES[STAGES.findIndex(s => s.key === selected.stage) + 1]?.label}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}