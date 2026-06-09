import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Package, AlertCircle, CheckCircle, Search } from "lucide-react";

const STONE_TYPES = ["Quartz","Granite","Quartzite","Marble","Porcelain","Dolomite","Soapstone","Travertine","Limestone"];
const STATUSES = [
  { value: "available", label: "Available", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { value: "reserved", label: "Reserved", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { value: "used", label: "Used", color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" },
  { value: "discarded", label: "Discarded", color: "bg-red-500/20 text-red-400 border-red-500/30" },
];

export default function Remnants() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("available");
  const [form, setForm] = useState({
    material: "", stoneType: "Granite", color: "", lengthInches: "", widthInches: "",
    location: "", status: "available", notes: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const { data: remnants = [] } = useQuery({
    queryKey: ["/api/remnants"],
    queryFn: () => fetch("/api/remnants", { credentials: "include" }).then(r => r.json()),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => fetch("/api/remnants", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify(data),
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/remnants"] }); setShowForm(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: any) => fetch(`/api/remnants/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ status }),
    }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/remnants"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/remnants/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/remnants"] }),
  });

  const resetForm = () => setForm({ material: "", stoneType: "Granite", color: "", lengthInches: "", widthInches: "", location: "", status: "available", notes: "" });

  const allRemnants = remnants as any[];
  const filtered = allRemnants
    .filter(r => filterStatus === "all" ? true : r.status === filterStatus)
    .filter(r => !search || `${r.material} ${r.stone_type} ${r.color} ${r.location}`.toLowerCase().includes(search.toLowerCase()));

  const availableSqft = allRemnants.filter(r => r.status === "available").reduce((s: number, r: any) => s + (r.sqft || 0), 0);
  const totalValue = availableSqft * 15; // avg $15/sqft remnant value

  const getStatusInfo = (status: string) => STATUSES.find(s => s.value === status) || STATUSES[0];

  return (
    <div className="p-8 max-w-6xl">
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-zinc-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Add Remnant</h2>
              <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Stone Type</label>
                  <select value={form.stoneType} onChange={e => set("stoneType", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm">
                    {STONE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Material / Brand</label>
                  <input type="text" placeholder="Calacatta Gold" value={form.material} onChange={e => set("material", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Color Description</label>
                <input type="text" placeholder="White with gold veining" value={form.color} onChange={e => set("color", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Length (inches)</label>
                  <input type="number" placeholder="36" value={form.lengthInches} onChange={e => set("lengthInches", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Width (inches)</label>
                  <input type="number" placeholder="24" value={form.widthInches} onChange={e => set("widthInches", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Yard Location</label>
                <input type="text" placeholder="Row A, Rack 3" value={form.location} onChange={e => set("location", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Notes</label>
                <textarea rows={2} placeholder="Minor chip on one corner..." value={form.notes} onChange={e => set("notes", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-2.5 text-sm">Cancel</button>
                <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.stoneType}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold rounded-lg py-2.5 text-sm">
                  {mutation.isPending ? "Saving..." : "Add Remnant"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Remnant Tracker</h1>
          <p className="text-zinc-500 mt-1">Track leftover stone — never lose track of usable material again</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2.5 rounded-lg text-sm">
          <Plus size={16} /> Add Remnant
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Total Remnants</div>
          <div className="text-white font-mono text-2xl font-bold">{allRemnants.length}</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Available</div>
          <div className="text-emerald-400 font-mono text-2xl font-bold">{allRemnants.filter(r => r.status === "available").length}</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Available Sq Ft</div>
          <div className="text-amber-400 font-mono text-2xl font-bold">{availableSqft.toFixed(0)}</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Est. Value</div>
          <div className="text-blue-400 font-mono text-2xl font-bold">${totalValue.toLocaleString()}</div>
        </div>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input type="text" placeholder="Search stone, color, location..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
        </div>
        {["all", ...STATUSES.map(s => s.value)].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? "bg-zinc-700 text-white" : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Package size={32} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No remnants found</p>
          <button onClick={() => setShowForm(true)} className="text-amber-400 text-sm mt-2 hover:underline">Add your first remnant</button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((r: any) => {
            const statusInfo = getStatusInfo(r.status);
            const sqft = r.sqft || ((r.length_inches * r.width_inches) / 144);
            return (
              <div key={r.id} className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-white font-semibold text-sm">{r.material || r.stone_type}</div>
                    <div className="text-zinc-500 text-xs">{r.stone_type} · {r.color}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded border ${statusInfo.color}`}>{statusInfo.label}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-zinc-900 rounded-lg p-2 text-center">
                    <div className="text-zinc-400 text-xs">{r.length_inches}"</div>
                    <div className="text-zinc-600 text-xs">length</div>
                  </div>
                  <div className="bg-zinc-900 rounded-lg p-2 text-center">
                    <div className="text-zinc-400 text-xs">{r.width_inches}"</div>
                    <div className="text-zinc-600 text-xs">width</div>
                  </div>
                  <div className="bg-zinc-900 rounded-lg p-2 text-center">
                    <div className="text-amber-400 text-xs font-mono">{sqft.toFixed(1)}</div>
                    <div className="text-zinc-600 text-xs">sqft</div>
                  </div>
                </div>
                {r.location && <div className="text-zinc-500 text-xs mb-3">📍 {r.location}</div>}
                {r.notes && <div className="text-zinc-600 text-xs mb-3 italic">{r.notes}</div>}
                <div className="flex gap-1.5">
                  {STATUSES.filter(s => s.value !== r.status).slice(0, 2).map(s => (
                    <button key={s.value} onClick={() => updateMutation.mutate({ id: r.id, status: s.value })}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs py-1.5 rounded-lg transition-colors">
                      {s.label}
                    </button>
                  ))}
                  <button onClick={() => deleteMutation.mutate(r.id)} className="bg-zinc-800 hover:bg-red-950 text-zinc-600 hover:text-red-400 px-2 py-1.5 rounded-lg transition-colors">
                    <X size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
