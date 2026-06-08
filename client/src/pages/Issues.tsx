import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Search, Trash2, CheckCircle } from "lucide-react";

const ISSUE_TYPES = ["remake", "repair", "rework", "paid_repair"] as const;
const ROOT_CAUSES = ["templating", "material_handling", "cutting", "fabrication", "installation", "sales_expectations", "material_defect"] as const;

const typeColors: Record<string, string> = {
  remake: "text-red-400 bg-red-950/40 border-red-900/60",
  repair: "text-orange-400 bg-orange-950/40 border-orange-900/60",
  rework: "text-yellow-400 bg-yellow-950/40 border-yellow-900/60",
  paid_repair: "text-blue-400 bg-blue-950/40 border-blue-900/60",
};

const fmt = (n: number) => n?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "—";

function IssueForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    issueType: "remake" as any, rootCause: "cutting" as any,
    jobName: "", customerName: "", salesRep: "",
    laborHours: "", materialCost: "", squareFeet: "", description: "",
  });

  const mutation = useMutation({
    mutationFn: (data: any) => fetch("/api/issues", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data), credentials: "include",
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/issues"] }); qc.invalidateQueries({ queryKey: ["/api/dashboard/summary"] }); onClose(); },
  });

  const laborHours = parseFloat(form.laborHours) || 0;
  const materialCost = parseFloat(form.materialCost) || 0;
  const totalImpact = (laborHours * 316) + materialCost;
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d0d14] border border-zinc-700/60 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800">
          <h2 className="text-white font-semibold text-lg">Log Issue</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Issue Type</label>
              <select value={form.issueType} onChange={e => set("issueType", e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500">
                {ISSUE_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ").toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Root Cause</label>
              <select value={form.rootCause} onChange={e => set("rootCause", e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500">
                {ROOT_CAUSES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ").toUpperCase()}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[["Job Name", "jobName", "Smith kitchen"], ["Customer", "customerName", "John Smith"], ["Sales Rep", "salesRep", "Rep name"]].map(([label, key, placeholder]) => (
              <div key={key}>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">{label}</label>
                <input type="text" placeholder={placeholder} value={(form as any)[key]} onChange={e => set(key, e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[["Labor Hours", "laborHours", "2.5"], ["Material Cost ($)", "materialCost", "0.00"], ["Square Feet", "squareFeet", "15"]].map(([label, key, placeholder]) => (
              <div key={key}>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">{label}</label>
                <input type="number" step="0.5" placeholder={placeholder} value={(form as any)[key]} onChange={e => set(key, e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
              </div>
            ))}
          </div>
          {(laborHours > 0 || materialCost > 0) && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <div className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-3">Cost Preview</div>
              <div className="grid grid-cols-3 gap-4">
                <div><div className="text-zinc-400 text-xs mb-1">Internal Cost</div><div className="text-white font-mono text-lg">${fmt((laborHours * 66) + materialCost)}</div></div>
                <div><div className="text-zinc-400 text-xs mb-1">Opportunity Cost</div><div className="text-orange-400 font-mono text-lg">${fmt(laborHours * 250)}</div></div>
                <div><div className="text-zinc-400 text-xs mb-1">Total Impact</div><div className="text-red-400 font-mono text-lg font-bold">${fmt(totalImpact)}</div></div>
              </div>
            </div>
          )}
          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Description</label>
            <textarea rows={2} placeholder="What happened?" value={form.description} onChange={e => set("description", e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-2.5 text-sm">Cancel</button>
            <button onClick={() => mutation.mutate({ ...form, laborHours: parseFloat(form.laborHours) || 0, materialCost: parseFloat(form.materialCost) || 0, squareFeet: parseFloat(form.squareFeet) || 0 })}
              disabled={mutation.isPending}
              className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold rounded-lg py-2.5 text-sm">
              {mutation.isPending ? "Logging..." : "Log Issue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Issues() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const { data: issueList = [], isLoading } = useQuery({
    queryKey: ["/api/issues"],
    queryFn: () => fetch("/api/issues?limit=100", { credentials: "include" }).then(r => r.json()),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, resolved }: any) => fetch(`/api/issues/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved }), credentials: "include",
    }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/issues"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/issues/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/issues"] }); qc.invalidateQueries({ queryKey: ["/api/dashboard/summary"] }); },
  });

  const filtered = (issueList as any[])
    .filter((i: any) => filter === "all" || i.issueType === filter)
    .filter((i: any) => !search || [i.jobName, i.customerName, i.salesRep, i.description].some((f: any) => f?.toLowerCase().includes(search.toLowerCase())));

  const totalImpact = filtered.reduce((s: number, i: any) => s + (i.totalImpact || 0), 0);

  return (
    <div className="p-8">
      {showForm && <IssueForm onClose={() => setShowForm(false)} />}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Issue Tracker</h1>
          <p className="text-zinc-500 mt-1">Track remakes, repairs, and reworks with true cost accounting</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2.5 rounded-lg text-sm">
          <Plus size={16} /> Log Issue
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Issues", value: filtered.length, color: "text-white" },
          { label: "Remakes", value: filtered.filter((i: any) => i.issueType === "remake").length, color: "text-red-400" },
          { label: "Unresolved", value: filtered.filter((i: any) => !i.resolved).length, color: "text-orange-400" },
          { label: "Total Impact", value: `$${totalImpact.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, color: "text-amber-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
            <div className={`font-mono text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-zinc-500 text-sm mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input type="text" placeholder="Search issues..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
        </div>
        <div className="flex gap-2">
          {["all", ...ISSUE_TYPES].map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-2 rounded-lg text-xs font-mono uppercase transition-colors ${filter === t ? "bg-amber-500 text-black font-semibold" : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-700"}`}>
              {t === "all" ? "All" : t.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-zinc-800 text-xs font-mono uppercase text-zinc-500 tracking-wider">
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Job / Customer</div>
          <div className="col-span-2">Root Cause</div>
          <div className="col-span-1 text-right">Hours</div>
          <div className="col-span-1 text-right">Material</div>
          <div className="col-span-2 text-right">Total Impact</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        {isLoading ? (
          <div className="py-12 text-center text-zinc-600">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-zinc-600 text-sm">No issues found</div>
            <button onClick={() => setShowForm(true)} className="text-amber-400 text-sm mt-2 hover:underline">Log your first issue</button>
          </div>
        ) : filtered.map((issue: any) => (
          <div key={issue.id} className={`grid grid-cols-12 gap-4 px-5 py-4 border-b border-zinc-800/40 hover:bg-zinc-900/30 transition-colors ${issue.resolved ? "opacity-50" : ""}`}>
            <div className="col-span-2">
              <span className={`text-xs px-2 py-0.5 rounded border font-mono uppercase ${typeColors[issue.issueType]}`}>
                {issue.issueType.replace("_", " ")}
              </span>
            </div>
            <div className="col-span-2">
              <div className="text-sm text-zinc-200 truncate">{issue.jobName || "—"}</div>
              <div className="text-xs text-zinc-500 truncate">{issue.customerName || "—"}</div>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">{issue.rootCause?.replace(/_/g, " ")}</span>
            </div>
            <div className="col-span-1 text-right font-mono text-sm text-zinc-300">{issue.laborHours || 0}h</div>
            <div className="col-span-1 text-right font-mono text-sm text-zinc-300">${(issue.materialCost || 0).toFixed(0)}</div>
            <div className="col-span-2 text-right">
              <div className="font-mono text-sm font-semibold text-red-400">${(issue.totalImpact || 0).toFixed(2)}</div>
              <div className="text-xs text-zinc-600">at $316/hr</div>
            </div>
            <div className="col-span-2 flex items-center justify-end gap-2">
              <button onClick={() => resolveMutation.mutate({ id: issue.id, resolved: !issue.resolved })}
                className={`p-1.5 rounded transition-colors ${issue.resolved ? "text-emerald-400 hover:text-zinc-400" : "text-zinc-600 hover:text-emerald-400"}`}>
                <CheckCircle size={16} />
              </button>
              <button onClick={() => { if (confirm("Delete this issue?")) deleteMutation.mutate(issue.id); }}
                className="p-1.5 rounded text-zinc-600 hover:text-red-400 transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
