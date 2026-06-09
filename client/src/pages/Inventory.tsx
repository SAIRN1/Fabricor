import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Search, Package, AlertTriangle, CheckCircle, MapPin, Layers } from "lucide-react";

const STONE_TYPES = ["Granite", "Quartzite", "Quartz (Engineered)", "Marble", "Dolomite", "Soapstone", "Porcelain", "Limestone", "Travertine", "Other"];
const SLAB_STATUS = ["available", "allocated", "partial", "remnant", "sold"] as const;

const statusColors: Record<string, string> = {
  available: "text-emerald-600 bg-emerald-50 border-emerald-200",
  allocated: "text-blue-600 bg-blue-50 border-blue-200",
  partial: "text-amber-600 bg-amber-50 border-amber-200",
  remnant: "text-purple-600 bg-purple-50 border-purple-200",
  sold: "text-gray-400 bg-gray-50 border-gray-200",
};

export default function Inventory() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({
    stoneType: "Granite",
    color: "",
    supplier: "",
    lotNumber: "",
    bundleNumber: "",
    lengthInches: "",
    widthInches: "",
    thickness: "3cm",
    costPerSqFt: "",
    totalCost: "",
    yardLocation: "",
    jobAllocated: "",
    notes: "",
    status: "available",
    finish: "Polished",
  });

  const { data: slabs = [], isLoading } = useQuery({
    queryKey: ["/api/inventory"],
    queryFn: () => fetch("/api/inventory", { credentials: "include" }).then(r => r.json()),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => fetch("/api/inventory", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data), credentials: "include",
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/inventory"] }); setShowForm(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => fetch(`/api/inventory/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data), credentials: "include",
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/inventory"] }); setSelected(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/inventory/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/inventory"] }); setSelected(null); },
  });

  const resetForm = () => setForm({ stoneType: "Granite", color: "", supplier: "", lotNumber: "", bundleNumber: "", lengthInches: "", widthInches: "", thickness: "3cm", costPerSqFt: "", totalCost: "", yardLocation: "", jobAllocated: "", notes: "", status: "available", finish: "Polished" });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const sqft = (l: string, w: string) => {
    const lf = parseFloat(l) || 0;
    const wf = parseFloat(w) || 0;
    return ((lf * wf) / 144).toFixed(2);
  };

  const filtered = (slabs as any[])
    .filter((s: any) => filterStatus === "all" || s.status === filterStatus)
    .filter((s: any) => filterType === "all" || s.stoneType === filterType)
    .filter((s: any) => !search || [s.color, s.stoneType, s.supplier, s.lotNumber, s.yardLocation, s.jobAllocated].some((f: any) => f?.toLowerCase().includes(search.toLowerCase())));

  const totalAvailableSqft = (slabs as any[]).filter((s: any) => s.status === "available" || s.status === "partial").reduce((sum: number, s: any) => sum + (s.sqft || 0), 0);
  const totalSlabs = (slabs as any[]).length;
  const availableSlabs = (slabs as any[]).filter((s: any) => s.status === "available").length;
  const allocatedSlabs = (slabs as any[]).filter((s: any) => s.status === "allocated").length;
  const totalValue = (slabs as any[]).reduce((sum: number, s: any) => sum + (s.totalCost || 0), 0);

  const stoneTypes = ["all", ...Array.from(new Set((slabs as any[]).map((s: any) => s.stoneType).filter(Boolean)))];

  return (
    <div className="p-8">
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-zinc-700/60 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800">
              <h2 className="text-white font-semibold text-lg">Add Slab to Inventory</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Stone Type</label>
                  <select value={form.stoneType} onChange={e => set("stoneType", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500">
                    {STONE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Color / Name</label>
                  <input type="text" placeholder="Calacatta Gold" value={form.color} onChange={e => set("color", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Supplier</label>
                  <input type="text" placeholder="MSI Stone" value={form.supplier} onChange={e => set("supplier", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Lot Number</label>
                  <input type="text" placeholder="LOT-2024-001" value={form.lotNumber} onChange={e => set("lotNumber", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Bundle #</label>
                  <input type="text" placeholder="B-001" value={form.bundleNumber} onChange={e => set("bundleNumber", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Length (inches)</label>
                  <input type="number" placeholder="120" value={form.lengthInches} onChange={e => set("lengthInches", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Width (inches)</label>
                  <input type="number" placeholder="66" value={form.widthInches} onChange={e => set("widthInches", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Thickness</label>
                  <select value={form.thickness} onChange={e => set("thickness", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500">
                    {["2cm", "3cm", "4cm"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              {(form.lengthInches || form.widthInches) && (
                <div className="bg-zinc-900 rounded-lg px-4 py-3">
                  <span className="text-zinc-500 text-sm">Calculated Sq Ft: </span>
                  <span className="text-amber-400 font-mono font-bold text-lg">{sqft(form.lengthInches, form.widthInches)} sf</span>
                  <span className="text-zinc-600 text-xs ml-2">({form.lengthInches}" × {form.widthInches}")</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Finish</label>
                  <select value={form.finish} onChange={e => set("finish", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500">
                    {["Polished", "Honed", "Leathered", "Brushed", "Sandblasted"].map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Status</label>
                  <select value={form.status} onChange={e => set("status", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500">
                    {SLAB_STATUS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Cost Per Sq Ft ($)</label>
                  <input type="number" step="0.01" placeholder="28.50" value={form.costPerSqFt} onChange={e => set("costPerSqFt", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Total Cost ($)</label>
                  <input type="number" step="0.01" placeholder="1850.00" value={form.totalCost} onChange={e => set("totalCost", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Yard Location</label>
                  <input type="text" placeholder="Row A, Rack 3" value={form.yardLocation} onChange={e => set("yardLocation", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Allocated to Job</label>
                  <input type="text" placeholder="Smith Kitchen" value={form.jobAllocated} onChange={e => set("jobAllocated", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Notes</label>
                <textarea rows={2} placeholder="Any damage, special characteristics, veining notes..." value={form.notes} onChange={e => set("notes", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowForm(false); resetForm(); }} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-2.5 text-sm">Cancel</button>
                <button onClick={() => mutation.mutate({ ...form, lengthInches: parseFloat(form.lengthInches) || 0, widthInches: parseFloat(form.widthInches) || 0, sqft: parseFloat(sqft(form.lengthInches, form.widthInches)), costPerSqFt: parseFloat(form.costPerSqFt) || 0, totalCost: parseFloat(form.totalCost) || 0 })}
                  disabled={mutation.isPending || !form.color}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold rounded-lg py-2.5 text-sm">
                  {mutation.isPending ? "Adding..." : "Add Slab"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-zinc-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800">
              <div>
                <h2 className="text-white font-semibold">{selected.color}</h2>
                <div className="text-zinc-500 text-sm">{selected.stoneType} · {selected.thickness} · {selected.finish}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900 rounded-lg p-3">
                  <div className="text-zinc-500 text-xs mb-1">Size</div>
                  <div className="text-white text-sm font-mono">{selected.lengthInches}" × {selected.widthInches}"</div>
                  <div className="text-amber-400 text-lg font-mono font-bold">{selected.sqft} sf</div>
                </div>
                <div className="bg-zinc-900 rounded-lg p-3">
                  <div className="text-zinc-500 text-xs mb-1">Value</div>
                  <div className="text-white text-sm">${selected.costPerSqFt}/sf</div>
                  <div className="text-emerald-400 text-lg font-mono font-bold">${(selected.totalCost || 0).toLocaleString()}</div>
                </div>
              </div>
              {selected.supplier && <div className="bg-zinc-900 rounded-lg p-3"><div className="text-zinc-500 text-xs mb-1">Supplier</div><div className="text-white text-sm">{selected.supplier}</div></div>}
              <div className="grid grid-cols-2 gap-3">
                {selected.lotNumber && <div className="bg-zinc-900 rounded-lg p-3"><div className="text-zinc-500 text-xs mb-1">Lot #</div><div className="text-white text-sm font-mono">{selected.lotNumber}</div></div>}
                {selected.bundleNumber && <div className="bg-zinc-900 rounded-lg p-3"><div className="text-zinc-500 text-xs mb-1">Bundle #</div><div className="text-white text-sm font-mono">{selected.bundleNumber}</div></div>}
              </div>
              {selected.yardLocation && <div className="bg-zinc-900 rounded-lg p-3 flex items-center gap-2"><MapPin size={14} className="text-amber-400" /><div><div className="text-zinc-500 text-xs">Yard Location</div><div className="text-white text-sm">{selected.yardLocation}</div></div></div>}
              {selected.jobAllocated && <div className="bg-blue-950/30 border border-blue-800/30 rounded-lg p-3"><div className="text-zinc-500 text-xs mb-1">Allocated to Job</div><div className="text-blue-400 text-sm font-medium">{selected.jobAllocated}</div></div>}
              {selected.notes && <div className="bg-zinc-900 rounded-lg p-3"><div className="text-zinc-500 text-xs mb-1">Notes</div><div className="text-zinc-300 text-sm">{selected.notes}</div></div>}
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Update Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {SLAB_STATUS.map(s => (
                    <button key={s} onClick={() => updateMutation.mutate({ id: selected.id, status: s })}
                      className={`py-2 rounded-lg text-xs font-semibold transition-colors border ${selected.status === s ? statusColors[s] : "bg-zinc-900 text-zinc-500 border-zinc-700 hover:border-zinc-500"}`}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => { if (confirm("Delete this slab?")) deleteMutation.mutate(selected.id); }}
                className="w-full py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-950/30 transition-colors border border-red-900/30">
                Delete Slab
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Slab Inventory</h1>
          <p className="text-zinc-500 mt-1">Track every slab, remnant, and bundle in your yard</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2.5 rounded-lg text-sm">
          <Plus size={16} /> Add Slab
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Slabs", value: totalSlabs, color: "text-white" },
          { label: "Available", value: availableSlabs, color: "text-emerald-400" },
          { label: "Allocated", value: allocatedSlabs, color: "text-blue-400" },
          { label: "Available Sq Ft", value: `${totalAvailableSqft.toFixed(0)} sf`, color: "text-amber-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
            <div className={`font-mono text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-zinc-500 text-sm mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input type="text" placeholder="Search slabs..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", ...SLAB_STATUS].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-lg text-xs font-mono uppercase transition-colors ${filterStatus === s ? "bg-amber-500 text-black font-semibold" : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-700"}`}>
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-400 text-xs focus:outline-none focus:border-amber-500">
          {stoneTypes.map(t => <option key={t} value={t}>{t === "all" ? "All Types" : t}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-zinc-600">Loading inventory...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Layers size={32} className="text-zinc-700 mx-auto mb-3" />
          <div className="text-zinc-500 text-sm">No slabs in inventory</div>
          <button onClick={() => setShowForm(true)} className="text-amber-400 text-sm mt-2 hover:underline">Add your first slab</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((slab: any) => (
            <div key={slab.id} onClick={() => setSelected(slab)}
              className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-5 cursor-pointer hover:border-amber-500/30 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-white font-semibold">{slab.color}</div>
                  <div className="text-zinc-500 text-sm">{slab.stoneType} · {slab.thickness}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-lg border font-semibold ${statusColors[slab.status]}`}>
                  {slab.status.charAt(0).toUpperCase() + slab.status.slice(1)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <div className="text-amber-400 font-mono font-bold">{slab.sqft} sf</div>
                  <div className="text-zinc-600 text-xs">Square Ft</div>
                </div>
                <div>
                  <div className="text-zinc-300 font-mono text-sm">{slab.lengthInches}"×{slab.widthInches}"</div>
                  <div className="text-zinc-600 text-xs">Size</div>
                </div>
                <div>
                  <div className="text-emerald-400 font-mono text-sm">${(slab.totalCost || 0).toLocaleString()}</div>
                  <div className="text-zinc-600 text-xs">Cost</div>
                </div>
              </div>
              {slab.supplier && <div className="text-zinc-500 text-xs mb-1">📦 {slab.supplier} {slab.lotNumber ? `· ${slab.lotNumber}` : ""}</div>}
              {slab.yardLocation && <div className="text-zinc-500 text-xs mb-1">📍 {slab.yardLocation}</div>}
              {slab.jobAllocated && <div className="text-blue-400 text-xs">🔗 {slab.jobAllocated}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
