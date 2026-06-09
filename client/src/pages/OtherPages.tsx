import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ── RESOURCES ──────────────────────────────────────────────────────────────
export function Resources() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ resourceName: "", resourceType: "fabricator", templatesCompleted: "", jobsInstalled: "", hoursWorked: "" });

  const { data: activities = [] } = useQuery({
    queryKey: ["/api/resources"],
    queryFn: () => fetch("/api/resources", { credentials: "include" }).then(r => r.json()),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => fetch("/api/resources", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data), credentials: "include",
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/resources"] }); setShowForm(false); },
  });

  const byResource: Record<string, any> = {};
  (activities as any[]).forEach((a: any) => {
    if (!byResource[a.resourceName]) byResource[a.resourceName] = { name: a.resourceName, type: a.resourceType, totalHours: 0, totalTemplates: 0, totalJobs: 0 };
    byResource[a.resourceName].totalHours += a.hoursWorked || 0;
    byResource[a.resourceName].totalTemplates += a.templatesCompleted || 0;
    byResource[a.resourceName].totalJobs += a.jobsInstalled || 0;
  });

  return (
    <div className="p-8">
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-zinc-700 rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold">Log Resource Activity</h2>
              <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs mb-1.5 block">Resource Name</label>
                  <input type="text" placeholder="John Smith" value={form.resourceName} onChange={e => setForm(f => ({ ...f, resourceName: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs mb-1.5 block">Role</label>
                  <select value={form.resourceType} onChange={e => setForm(f => ({ ...f, resourceType: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500">
                    {["fabricator", "templator", "installer", "polisher"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[["Templates", "templatesCompleted", "0"], ["Jobs", "jobsInstalled", "0"], ["Hours", "hoursWorked", "8"]].map(([label, key, ph]) => (
                  <div key={key}>
                    <label className="text-zinc-400 text-xs mb-1.5 block">{label}</label>
                    <input type="number" placeholder={ph} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-2.5 text-sm">Cancel</button>
                <button onClick={() => mutation.mutate({ ...form, templatesCompleted: +form.templatesCompleted, jobsInstalled: +form.jobsInstalled, hoursWorked: +form.hoursWorked })}
                  disabled={mutation.isPending} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg py-2.5 text-sm">
                  {mutation.isPending ? "Saving..." : "Log Activity"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Resource Analytics</h1>
          <p className="text-zinc-500 mt-1">Track team productivity and identify outliers</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2.5 rounded-lg text-sm">
          <Plus size={16} /> Log Activity
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Object.values(byResource).map((r: any) => (
          <div key={r.name} className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <span className="text-zinc-300 font-bold text-sm">{r.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}</span>
              </div>
              <div>
                <div className="text-white font-medium">{r.name}</div>
                <div className="text-zinc-500 text-xs capitalize">{r.type}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><div className="text-amber-400 font-mono text-lg font-bold">{r.totalHours.toFixed(1)}</div><div className="text-zinc-600 text-xs">Hours</div></div>
              <div><div className="text-emerald-400 font-mono text-lg font-bold">{r.totalTemplates}</div><div className="text-zinc-600 text-xs">Templates</div></div>
              <div><div className="text-blue-400 font-mono text-lg font-bold">{r.totalJobs}</div><div className="text-zinc-600 text-xs">Jobs</div></div>
            </div>
          </div>
        ))}
        {Object.keys(byResource).length === 0 && (
          <div className="col-span-3 bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-12 text-center">
            <Users size={32} className="text-zinc-700 mx-auto mb-3" />
            <div className="text-zinc-500">No resource data yet</div>
            <button onClick={() => setShowForm(true)} className="text-amber-400 text-sm mt-2 hover:underline">Log first activity</button>
          </div>
        )}
    </div>
  );
}
// ── SALES ──────────────────────────────────────────────────────────────────
export function Sales() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ repName: "", revenue: "", jobCount: "", squareFeet: "", issueCount: "", remakeCount: "", margin: "" });

  const { data: sales = [] } = useQuery({
    queryKey: ["/api/sales"],
    queryFn: () => fetch("/api/sales", { credentials: "include" }).then(r => r.json()),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => fetch("/api/sales", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data), credentials: "include",
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/sales"] }); setShowForm(false); },
  });

  const byRep: Record<string, any> = {};
  (sales as any[]).forEach((s: any) => {
    if (!byRep[s.repName]) byRep[s.repName] = { name: s.repName, revenue: 0, jobs: 0, issues: 0, remakes: 0 };
    byRep[s.repName].revenue += s.revenue || 0;
    byRep[s.repName].jobs += s.jobCount || 0;
    byRep[s.repName].issues += s.issueCount || 0;
    byRep[s.repName].remakes += s.remakeCount || 0;
  });

  const chartData = Object.values(byRep).map((r: any) => ({
    name: r.name.split(" ")[0],
    revenue: Math.round(r.revenue),
    issueRate: r.jobs > 0 ? Math.round((r.issues / r.jobs) * 100) : 0,
  }));

  return (
    <div className="p-8">
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-zinc-700 rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold">Log Sales Entry</h2>
              <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-zinc-400 text-xs mb-1.5 block">Sales Rep Name</label>
                <input type="text" placeholder="Jane Smith" value={form.repName} onChange={e => setForm(f => ({ ...f, repName: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[["Revenue ($)", "revenue", "12500"], ["Job Count", "jobCount", "5"], ["Square Feet", "squareFeet", "250"], ["Issues", "issueCount", "0"], ["Remakes", "remakeCount", "0"], ["Margin (%)", "margin", "45"]].map(([label, key, ph]) => (
                  <div key={key}>
                    <label className="text-zinc-400 text-xs mb-1.5 block">{label}</label>
                    <input type="number" placeholder={ph} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-2.5 text-sm">Cancel</button>
                <button onClick={() => mutation.mutate({ ...form, revenue: +form.revenue, jobCount: +form.jobCount, squareFeet: +form.squareFeet, issueCount: +form.issueCount, remakeCount: +form.remakeCount, margin: +form.margin / 100 })}
                  disabled={mutation.isPending} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg py-2.5 text-sm">
                  {mutation.isPending ? "Saving..." : "Log Entry"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Sales Intelligence</h1>
          <p className="text-zinc-500 mt-1">Rep performance, revenue, and quality correlation</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2.5 rounded-lg text-sm">
          <Plus size={16} /> Log Entry
        </button>
      </div>
      {chartData.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-6">
            <h3 className="text-white font-medium mb-4">Revenue by Rep</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#3f3f4e" tick={{ fill: "#71717a", fontSize: 11 }} />
                <YAxis stroke="#3f3f4e" tick={{ fill: "#71717a", fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "#0d0d14", border: "1px solid #27272a", borderRadius: 8, color: "#e4e4e7" }} formatter={(v: any) => [`$${v.toLocaleString()}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-6">
            <h3 className="text-white font-medium mb-4">Issue Rate by Rep (%)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#3f3f4e" tick={{ fill: "#71717a", fontSize: 11 }} />
                <YAxis stroke="#3f3f4e" tick={{ fill: "#71717a", fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={{ background: "#0d0d14", border: "1px solid #27272a", borderRadius: 8, color: "#e4e4e7" }} formatter={(v: any) => [`${v}%`, "Issue Rate"]} />
                <Bar dataKey="issueRate" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl overflow-hidden">
        <div className="grid grid-cols-6 gap-4 px-5 py-3 border-b border-zinc-800 text-xs font-mono uppercase text-zinc-500">
          <div className="col-span-2">Rep</div>
          <div className="text-right">Revenue</div>
          <div className="text-right">Jobs</div>
          <div className="text-right">Issues</div>
          <div className="text-right">Avg Job</div>
        </div>
        {Object.values(byRep).length === 0 ? (
          <div className="py-12 text-center text-zinc-600 text-sm">No sales data yet</div>
        ) : Object.values(byRep).map((rep: any) => (
          <div key={rep.name} className="grid grid-cols-6 gap-4 px-5 py-4 border-b border-zinc-800/40 hover:bg-zinc-900/20">
            <div className="col-span-2 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">
                {rep.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </div>
              <span className="text-zinc-200 text-sm">{rep.name}</span>
            </div>
            <div className="text-right font-mono text-sm text-emerald-400">${rep.revenue.toLocaleString()}</div>
            <div className="text-right font-mono text-sm text-zinc-300">{rep.jobs}</div>
            <div className="text-right font-mono text-sm text-red-400">{rep.issues}</div>
            <div className="text-right font-mono text-sm text-amber-400">${rep.jobs > 0 ? (rep.revenue / rep.jobs).toFixed(0) : "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PRICE BOOK ─────────────────────────────────────────────────────────────
export function PriceBook() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [form, setForm] = useState({ category: "countertop", name: "", unit: "sqft", basePrice: "", materialCost: "", laborCost: "" });

  const { data: items = [] } = useQuery({
    queryKey: ["/api/pricebook"],
    queryFn: () => fetch("/api/pricebook", { credentials: "include" }).then(r => r.json()),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => fetch("/api/pricebook", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data), credentials: "include",
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/pricebook"] }); setShowForm(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/pricebook/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/pricebook"] }),
  });

  const categories = ["all", ...Array.from(new Set((items as any[]).map((i: any) => i.category)))];
  const filtered = activeTab === "all" ? items : (items as any[]).filter((i: any) => i.category === activeTab);

  return (
    <div className="p-8">
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-zinc-700 rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold">Add Price Book Item</h2>
              <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs mb-1.5 block">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500">
                    {["countertop", "edge", "sink_cutout", "faucet_hole", "backsplash", "service"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 text-xs mb-1.5 block">Name</label>
                  <input type="text" placeholder="Eased Edge" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs mb-1.5 block">Unit</label>
                  <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500">
                    {["sqft", "lf", "each", "hour"].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[["Base Price ($)", "basePrice"], ["Material ($)", "materialCost"], ["Labor ($)", "laborCost"]].map(([label, key]) => (
                  <div key={key}>
                    <label className="text-zinc-400 text-xs mb-1.5 block">{label}</label>
                    <input type="number" step="0.01" value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500" />
                  </div>
                ))}
              </div>
              {form.basePrice && form.materialCost && form.laborCost && (
                <div className="bg-zinc-900 rounded-lg px-4 py-3">
                  <span className="text-zinc-500 text-sm">Margin: </span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {(((+form.basePrice - +form.materialCost - +form.laborCost) / +form.basePrice) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-2.5 text-sm">Cancel</button>
                <button onClick={() => mutation.mutate({ ...form, basePrice: +form.basePrice, materialCost: +form.materialCost, laborCost: +form.laborCost })}
                  disabled={mutation.isPending} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg py-2.5 text-sm">
                  {mutation.isPending ? "Saving..." : "Add Item"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Price Book</h1>
          <p className="text-zinc-500 mt-1">Manage pricing, costs, and margins for all services</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2.5 rounded-lg text-sm">
          <Plus size={16} /> Add Item
        </button>
      </div>
      <div className="flex gap-2 mb-5">
        {(categories as string[]).map(c => (
          <button key={c} onClick={() => setActiveTab(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-colors ${activeTab === c ? "bg-amber-500 text-black font-semibold" : "bg-zinc-900 text-zinc-400 border border-zinc-700 hover:text-zinc-200"}`}>
            {c === "all" ? "All Items" : c.replace("_", " ")}
          </button>
        ))}
      </div>
      <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl overflow-hidden">
        <div className="grid grid-cols-6 gap-4 px-5 py-3 border-b border-zinc-800 text-xs font-mono uppercase text-zinc-500">
          <div className="col-span-2">Item</div>
          <div>Unit</div>
          <div className="text-right">Base Price</div>
          <div className="text-right">Margin</div>
          <div className="text-right">Actions</div>
        </div>
        {(filtered as any[]).length === 0 ? (
          <div className="py-12 text-center text-zinc-600 text-sm">No items yet — add your first entry</div>
        ) : (filtered as any[]).map((item: any) => {
          const margin = item.basePrice && item.materialCost && item.laborCost
            ? ((item.basePrice - item.materialCost - item.laborCost) / item.basePrice * 100).toFixed(1) : null;
          return (
            <div key={item.id} className="grid grid-cols-6 gap-4 px-5 py-4 border-b border-zinc-800/40 hover:bg-zinc-900/20">
              <div className="col-span-2">
                <div className="text-zinc-200 text-sm">{item.name}</div>
                <div className="text-zinc-600 text-xs capitalize">{item.category?.replace("_", " ")}</div>
              </div>
              <div className="text-zinc-400 text-sm font-mono">{item.unit}</div>
              <div className="text-right font-mono text-sm text-amber-400">${item.basePrice?.toFixed(2)}</div>
              <div className="text-right font-mono text-sm">
                {margin ? <span className={+margin >= 40 ? "text-emerald-400" : +margin >= 25 ? "text-yellow-400" : "text-red-400"}>{margin}%</span> : <span className="text-zinc-600">—</span>}
              </div>
              <div className="text-right">
                <button onClick={() => { if (confirm("Remove item?")) deleteMutation.mutate(item.id); }}
                  className="text-zinc-600 hover:text-red-400 text-xs transition-colors">Remove</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SETTINGS ───────────────────────────────────────────────────────────────
export function Settings() {
  const qc = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: ["/api/settings/costs"],
    queryFn: () => fetch("/api/settings/costs", { credentials: "include" }).then(r => r.json()),
  });

  const [form, setForm] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  if (settings && !form) setForm(settings);

  const mutation = useMutation({
    mutationFn: (data: any) => fetch("/api/settings/costs", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data), credentials: "include",
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/settings/costs"] }); setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
      <p className="text-zinc-500 mb-8">Configure cost rates and shop parameters</p>
      <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-6 mb-6">
        <h2 className="text-white font-semibold mb-1">Cost Rate Configuration</h2>
        <p className="text-zinc-500 text-sm mb-6">These rates power all cost calculations across Fabricor</p>
        {form && (
          <div className="space-y-4">
            {[
              ["Labor Cost / Hour", "laborCostPerHour", "$", "Direct labor cost including benefits"],
              ["Opportunity Cost / Hour", "opportunityCostPerHour", "$", "Revenue lost when technicians are on rework"],
              ["Material Cost / Sq Ft", "materialCostPerSqFt", "$", "Average slab material cost per square foot"],
              ["Overhead Rate", "overheadRate", "%", "Shop overhead as % of revenue"],
              ["Target Gross Margin", "targetMargin", "%", "Your target gross margin percentage"],
            ].map(([label, key, prefix, desc]) => (
              <div key={key} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-zinc-300 text-sm font-medium">{label}</div>
                  <div className="text-zinc-600 text-xs">{desc}</div>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">{prefix}</span>
                  <input type="number" step="0.01"
                    value={prefix === "%" ? Math.round((form[key as string] || 0) * 100) : (form[key as string] || 0)}
                    onChange={e => setForm((f: any) => ({ ...f, [key as string]: prefix === "%" ? +e.target.value / 100 : +e.target.value }))}
                    className="bg-zinc-900 border border-zinc-700 rounded-lg pl-7 pr-3 py-2 w-28 text-white font-mono text-sm focus:outline-none focus:border-amber-500" />
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-zinc-800 mt-4">
              <div className="bg-zinc-900 rounded-lg px-4 py-3 mb-4">
                <div className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-2">Total Impact Rate</div>
                <div className="text-amber-400 font-mono text-2xl font-bold">
                  ${((form.laborCostPerHour || 0) + (form.opportunityCostPerHour || 0)).toFixed(0)}/hr
                </div>
                <div className="text-zinc-600 text-xs mt-1">The true cost of 1 hour of rework</div>
              </div>
              <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}
                className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors ${saved ? "bg-emerald-500 text-white" : "bg-amber-500 hover:bg-amber-400 text-black"}`}>
                {mutation.isPending ? "Saving..." : saved ? "✓ Saved" : "Save Settings"}
              <button onClick={async () => { const r = await fetch("/api/admin/send-weekly-report", { method: "POST", credentials: "include" }); const d = await r.json(); alert(d.message || d.error); }} className="w-full mt-2 py-2.5 rounded-lg font-semibold text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors">📧 Send Test Weekly Report</button>
              <button onClick={async () => { const r = await fetch("/api/admin/send-test-email", { method: "POST", credentials: "include" }); const d = await r.json(); alert(JSON.stringify(d)); }} className="w-full mt-2 py-2.5 rounded-lg font-semibold text-sm bg-blue-800 hover:bg-blue-700 text-white transition-colors">🧪 Send Direct Test Email</button>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
      <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-6 mb-6">
        <h2 className="text-white font-semibold mb-1">Google Reviews</h2>
        <p className="text-zinc-500 text-sm mb-4">Auto-send a review request when a job is marked complete</p>
        <div className="space-y-3">
          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Google Business Review URL</label>
            <input type="text" placeholder="https://g.page/r/YOUR_REVIEW_LINK" value={form?.googleReviewUrl || ""} onChange={e => setForm((f: any) => ({ ...f, googleReviewUrl: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
            <p className="text-zinc-600 text-xs mt-1">Find in Google Business Profile - Get more reviews - Share review form</p>
          </div>
          <button onClick={() => mutation.mutate(form)} className="w-full py-2.5 rounded-lg font-semibold text-sm bg-amber-500 hover:bg-amber-400 text-black transition-colors">Save Review Link</button>
        </div>
      </div>
      <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-6 mb-6">
        <h2 className="text-white font-semibold mb-1">SMS Notifications — Coming Soon</h2>
        <p className="text-zinc-500 text-sm mb-4">Text customers automatically when their job reaches key stages</p>
        <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg p-3">
          <p className="text-zinc-500 text-xs">Twilio integration coming soon. Customers will be texted at each key stage.</p>
        </div>
      </div>
      <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-6 mb-6">
        <h2 className="text-white font-semibold mb-1">Silica Safety Compliance</h2>
        <p className="text-zinc-500 text-sm mb-4">California SB 20 STOP Act — effective July 1 2026</p>
        <div className="bg-blue-950/20 border border-blue-800/30 rounded-lg p-4">
          <p className="text-blue-400 text-xs font-medium mb-2">All shops must annually train workers on silica safety.</p>
          <p className="text-zinc-500 text-xs">Coming: Worker training log, attestation records, Cal/OSHA inspection docs.</p>
        </div>
      </div>
  );
}
