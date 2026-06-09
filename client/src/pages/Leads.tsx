import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Phone, Mail, MapPin, TrendingUp, Clock, CheckCircle, XCircle, ChevronRight } from "lucide-react";

const STATUSES = [
  { value: "new", label: "New", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "contacted", label: "Contacted", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { value: "quoted", label: "Quoted", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { value: "won", label: "Won", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { value: "lost", label: "Lost", color: "bg-red-500/20 text-red-400 border-red-500/30" },
];

const SOURCES = ["Website", "Referral", "Google", "Facebook", "Instagram", "Walk-in", "Builder", "Repeat customer", "Other"];
const PROJECT_TYPES = ["Kitchen Countertops", "Bathroom Vanity", "Island Only", "Full Kitchen + Bath", "Commercial", "Fireplace", "Outdoor Kitchen"];

export default function Leads() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", address: "", city: "", state: "",
    projectType: "Kitchen Countertops", stoneType: "Quartz", estimatedSqft: "",
    estimatedValue: "", source: "Referral", status: "new", notes: "", followUpDate: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const { data: leads = [] } = useQuery({
    queryKey: ["/api/leads"],
    queryFn: () => fetch("/api/leads", { credentials: "include" }).then(r => r.json()),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => fetch("/api/leads", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify(data),
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/leads"] }); setShowForm(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => fetch(`/api/leads/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify(data),
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/leads"] }); setSelected(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/leads/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/leads"] }); setSelected(null); },
  });

  const resetForm = () => setForm({ firstName: "", lastName: "", email: "", phone: "", address: "", city: "", state: "", projectType: "Kitchen Countertops", stoneType: "Quartz", estimatedSqft: "", estimatedValue: "", source: "Referral", status: "new", notes: "", followUpDate: "" });

  const filtered = filterStatus === "all" ? (leads as any[]) : (leads as any[]).filter((l: any) => l.status === filterStatus);
  const totalValue = (leads as any[]).reduce((s: number, l: any) => s + (l.estimated_value || 0), 0);
  const wonValue = (leads as any[]).filter((l: any) => l.status === "won").reduce((s: number, l: any) => s + (l.estimated_value || 0), 0);
  const conversionRate = (leads as any[]).length > 0 ? (((leads as any[]).filter((l: any) => l.status === "won").length / (leads as any[]).length) * 100).toFixed(0) : 0;

  const getStatusInfo = (status: string) => STATUSES.find(s => s.value === status) || STATUSES[0];

  return (
    <div className="p-8 max-w-6xl">
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-zinc-700 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Add Lead</h2>
              <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">First Name</label>
                  <input type="text" placeholder="John" value={form.firstName} onChange={e => set("firstName", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" /></div>
                <div><label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Last Name</label>
                  <input type="text" placeholder="Smith" value={form.lastName} onChange={e => set("lastName", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Phone</label>
                  <input type="tel" placeholder="(614) 555-1234" value={form.phone} onChange={e => set("phone", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" /></div>
                <div><label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Email</label>
                  <input type="email" placeholder="john@email.com" value={form.email} onChange={e => set("email", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">City</label>
                  <input type="text" placeholder="Columbus" value={form.city} onChange={e => set("city", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" /></div>
                <div><label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">State</label>
                  <input type="text" placeholder="OH" value={form.state} onChange={e => set("state", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Project Type</label>
                  <select value={form.projectType} onChange={e => set("projectType", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm">
                    {PROJECT_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                <div><label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Stone Type</label>
                  <select value={form.stoneType} onChange={e => set("stoneType", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm">
                    {["Quartz","Granite","Quartzite","Marble","Porcelain","Dolomite"].map(t => <option key={t}>{t}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Est. Sq Ft</label>
                  <input type="number" placeholder="45" value={form.estimatedSqft} onChange={e => set("estimatedSqft", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" /></div>
                <div><label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Est. Value ($)</label>
                  <input type="number" placeholder="3500" value={form.estimatedValue} onChange={e => set("estimatedValue", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Source</label>
                  <select value={form.source} onChange={e => set("source", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm">
                    {SOURCES.map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Follow Up Date</label>
                  <input type="date" value={form.followUpDate} onChange={e => set("followUpDate", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm" /></div>
              </div>
              <div><label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Notes</label>
                <textarea rows={2} placeholder="Customer wants white quartz, has existing cabinets..." value={form.notes} onChange={e => set("notes", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm resize-none" /></div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-2.5 text-sm">Cancel</button>
                <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.firstName}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold rounded-lg py-2.5 text-sm">
                  {mutation.isPending ? "Saving..." : "Add Lead"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Lead Management</h1>
          <p className="text-zinc-500 mt-1">Track prospects from first call to signed contract</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2.5 rounded-lg text-sm">
          <Plus size={16} /> Add Lead
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Total Leads</div>
          <div className="text-white font-mono text-2xl font-bold">{(leads as any[]).length}</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Pipeline Value</div>
          <div className="text-amber-400 font-mono text-2xl font-bold">${totalValue.toLocaleString()}</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Won Value</div>
          <div className="text-emerald-400 font-mono text-2xl font-bold">${wonValue.toLocaleString()}</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Conversion Rate</div>
          <div className="text-blue-400 font-mono text-2xl font-bold">{conversionRate}%</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setFilterStatus("all")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === "all" ? "bg-zinc-700 text-white" : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"}`}>
          All ({(leads as any[]).length})
        </button>
        {STATUSES.map(s => (
          <button key={s.value} onClick={() => setFilterStatus(s.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s.value ? "bg-zinc-700 text-white" : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"}`}>
            {s.label} ({(leads as any[]).filter((l: any) => l.status === s.value).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <TrendingUp size={32} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No leads yet — add your first prospect</p>
        </div>
      ) : (
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Lead</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Project</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Value</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Source</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Status</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Follow Up</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead: any) => {
                const statusInfo = getStatusInfo(lead.status);
                const isOverdue = lead.follow_up_date && new Date(lead.follow_up_date) < new Date() && lead.status !== 'won' && lead.status !== 'lost';
                return (
                  <tr key={lead.id} className="border-b border-zinc-800/40 hover:bg-zinc-900/20 cursor-pointer" onClick={() => setSelected(lead)}>
                    <td className="px-5 py-3">
                      <div className="text-zinc-200 font-medium">{lead.first_name} {lead.last_name}</div>
                      <div className="text-zinc-500 text-xs">{lead.phone || lead.email}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-zinc-300 text-xs">{lead.project_type}</div>
                      <div className="text-zinc-500 text-xs">{lead.stone_type} {lead.estimated_sqft ? `· ${lead.estimated_sqft} sf` : ''}</div>
                    </td>
                    <td className="px-5 py-3 text-amber-400 font-mono text-sm">{lead.estimated_value ? `$${Number(lead.estimated_value).toLocaleString()}` : '—'}</td>
                    <td className="px-5 py-3 text-zinc-400 text-xs">{lead.source}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded border ${statusInfo.color}`}>{statusInfo.label}</span>
                    </td>
                    <td className="px-5 py-3">
                      {lead.follow_up_date ? (
                        <span className={`text-xs ${isOverdue ? 'text-red-400 font-semibold' : 'text-zinc-400'}`}>
                          {isOverdue ? '⚠️ ' : ''}{new Date(lead.follow_up_date).toLocaleDateString()}
                        </span>
                      ) : <span className="text-zinc-600 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3"><ChevronRight size={14} className="text-zinc-600" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-zinc-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">{selected.first_name} {selected.last_name}</h2>
              <button onClick={() => setSelected(null)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
            </div>
            <div className="space-y-3 mb-4">
              {selected.phone && <div className="flex items-center gap-2 text-zinc-300 text-sm"><Phone size={13} className="text-zinc-500" />{selected.phone}</div>}
              {selected.email && <div className="flex items-center gap-2 text-zinc-300 text-sm"><Mail size={13} className="text-zinc-500" />{selected.email}</div>}
              {selected.city && <div className="flex items-center gap-2 text-zinc-300 text-sm"><MapPin size={13} className="text-zinc-500" />{selected.city}, {selected.state}</div>}
              <div className="bg-zinc-900 rounded-lg p-3 text-xs space-y-1">
                <div className="flex justify-between"><span className="text-zinc-500">Project</span><span className="text-zinc-300">{selected.project_type}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Stone</span><span className="text-zinc-300">{selected.stone_type}</span></div>
                {selected.estimated_sqft && <div className="flex justify-between"><span className="text-zinc-500">Sq Ft</span><span className="text-zinc-300">{selected.estimated_sqft} sf</span></div>}
                {selected.estimated_value && <div className="flex justify-between"><span className="text-zinc-500">Value</span><span className="text-amber-400 font-mono">${Number(selected.estimated_value).toLocaleString()}</span></div>}
                <div className="flex justify-between"><span className="text-zinc-500">Source</span><span className="text-zinc-300">{selected.source}</span></div>
              </div>
              {selected.notes && <div className="bg-zinc-900 rounded-lg p-3 text-zinc-400 text-xs">{selected.notes}</div>}
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Update Status</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {STATUSES.map(s => (
                    <button key={s.value} onClick={() => updateMutation.mutate({ id: selected.id, status: s.value })}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${selected.status === s.value ? s.color : 'border-zinc-700 bg-zinc-900 text-zinc-500 hover:text-zinc-300'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => deleteMutation.mutate(selected.id)} className="flex-1 bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400 rounded-lg py-2.5 text-sm transition-colors">Delete</button>
              <button onClick={() => setSelected(null)} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg py-2.5 text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
