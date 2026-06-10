import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Grid, Map } from "lucide-react";

const ROWS = ["A","B","C","D","E","F","G","H"];
const POSITIONS = Array.from({length: 10}, (_, i) => i + 1);

const STONE_COLORS: Record<string, string> = {
  Quartz: "bg-blue-500/40 border-blue-400/60 text-blue-200",
  Granite: "bg-stone-500/40 border-stone-400/60 text-stone-200",
  Quartzite: "bg-purple-500/40 border-purple-400/60 text-purple-200",
  Marble: "bg-white/20 border-white/40 text-white",
  Porcelain: "bg-cyan-500/40 border-cyan-400/60 text-cyan-200",
  Dolomite: "bg-teal-500/40 border-teal-400/60 text-teal-200",
  Other: "bg-zinc-500/40 border-zinc-400/60 text-zinc-200",
};

export default function YardMap() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [selectedSlab, setSelectedSlab] = useState<any>(null);
  const [form, setForm] = useState({
    material: "", stoneType: "Granite", color: "", bundleNumber: "",
    slabCount: "1", row: "A", position: "1", status: "available", notes: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const { data: slabs = [] } = useQuery({
    queryKey: ["/api/slab-inventory"],
    queryFn: () => fetch("/api/slab-inventory", { credentials: "include" }).then(r => r.json()),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => fetch("/api/slab-inventory", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify(data),
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/slab-inventory"] }); setShowForm(false); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/slab-inventory/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/slab-inventory"] }); setSelectedSlab(null); },
  });

  const resetForm = () => setForm({ material: "", stoneType: "Granite", color: "", bundleNumber: "", slabCount: "1", row: "A", position: "1", status: "available", notes: "" });

  const slabsList = slabs as any[];

  const getSlabAt = (row: string, pos: number) => slabsList.find(s => s.yard_row === row && s.yard_position === pos);

  const handleCellClick = (row: string, pos: number) => {
    const slab = getSlabAt(row, pos);
    if (slab) { setSelectedSlab(slab); }
    else { setSelectedCell(`${row}${pos}`); set("row", row); set("position", String(pos)); setShowForm(true); }
  };

  const totalSlabs = slabsList.length;
  const availableSlabs = slabsList.filter(s => s.status === "available").length;
  const occupiedCells = new Set(slabsList.filter(s => s.yard_row && s.yard_position).map(s => `${s.yard_row}${s.yard_position}`)).size;

  return (
    <div className="p-8 max-w-6xl">
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-zinc-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Place Slab — Row {form.row}, Position {form.position}</h2>
              <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Stone Type</label>
                  <select value={form.stoneType} onChange={e => set("stoneType", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm">
                    {Object.keys(STONE_COLORS).map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Material / Brand</label>
                  <input type="text" placeholder="Calacatta Gold" value={form.material} onChange={e => set("material", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Bundle #</label>
                  <input type="text" placeholder="B-1234" value={form.bundleNumber} onChange={e => set("bundleNumber", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Slab Count</label>
                  <input type="number" placeholder="1" value={form.slabCount} onChange={e => set("slabCount", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-2.5 text-sm">Cancel</button>
                <button onClick={() => mutation.mutate({ ...form, yardRow: form.row, yardPosition: parseInt(form.position) })} disabled={mutation.isPending}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold rounded-lg py-2.5 text-sm">
                  {mutation.isPending ? "Placing..." : "Place Slab"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedSlab && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-zinc-700 rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">{selectedSlab.material_name || selectedSlab.stone_type}</h2>
              <button onClick={() => setSelectedSlab(null)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
            </div>
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">Stone Type</span><span className="text-zinc-300">{selectedSlab.stone_type}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Location</span><span className="text-zinc-300">Row {selectedSlab.yard_row}, Position {selectedSlab.yard_position}</span></div>
              {selectedSlab.bundle_number && <div className="flex justify-between"><span className="text-zinc-500">Bundle</span><span className="text-zinc-300">{selectedSlab.bundle_number}</span></div>}
              {selectedSlab.slab_count && <div className="flex justify-between"><span className="text-zinc-500">Slabs</span><span className="text-zinc-300">{selectedSlab.slab_count}</span></div>}
              {selectedSlab.notes && <div className="bg-zinc-900 rounded-lg p-2 text-zinc-400 text-xs">{selectedSlab.notes}</div>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => deleteMutation.mutate(selectedSlab.id)} className="flex-1 bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400 rounded-lg py-2.5 text-sm">Remove</button>
              <button onClick={() => setSelectedSlab(null)} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg py-2.5 text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Slab Yard Map</h1>
          <p className="text-zinc-500 mt-1">Visual map of your slab yard — click any cell to place or view a slab</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Total Slabs</div>
          <div className="text-white font-mono text-2xl font-bold">{totalSlabs}</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Available</div>
          <div className="text-emerald-400 font-mono text-2xl font-bold">{availableSlabs}</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Cells Occupied</div>
          <div className="text-amber-400 font-mono text-2xl font-bold">{occupiedCells}</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Cells Free</div>
          <div className="text-blue-400 font-mono text-2xl font-bold">{(ROWS.length * POSITIONS.length) - occupiedCells}</div>
        </div>
      </div>

      <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-2xl p-6 overflow-x-auto">
        <div className="flex items-center gap-2 mb-4">
          <Map size={16} className="text-amber-400" />
          <span className="text-zinc-300 font-semibold text-sm">Yard Layout — {ROWS.length} rows × {POSITIONS.length} positions</span>
          <span className="text-zinc-600 text-xs ml-2">Click empty cell to place slab · Click filled cell to view details</span>
        </div>

        <div className="min-w-max">
          <div className="flex gap-1 mb-1 ml-8">
            {POSITIONS.map(p => (
              <div key={p} className="w-16 text-center text-zinc-600 text-xs">{p}</div>
            ))}
          </div>
          {ROWS.map(row => (
            <div key={row} className="flex gap-1 mb-1 items-center">
              <div className="w-6 text-zinc-500 text-xs font-mono text-right mr-2">{row}</div>
              {POSITIONS.map(pos => {
                const slab = getSlabAt(row, pos);
                const colorClass = slab ? (STONE_COLORS[slab.stone_type] || STONE_COLORS.Other) : "";
                return (
                  <button key={pos} onClick={() => handleCellClick(row, pos)}
                    className={`w-16 h-10 rounded border text-xs font-medium transition-all ${slab ? `${colorClass} hover:opacity-80` : "bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-600 text-zinc-700"}`}>
                    {slab ? (
                      <div className="px-1">
                        <div className="truncate text-xs">{slab.stone_type?.slice(0, 3)}</div>
                        {slab.slab_count > 1 && <div className="text-xs opacity-70">×{slab.slab_count}</div>}
                      </div>
                    ) : <span className="text-zinc-700">+</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-zinc-800">
          {Object.entries(STONE_COLORS).map(([type, cls]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className={`w-4 h-4 rounded border ${cls}`} />
              <span className="text-zinc-500 text-xs">{type}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded border bg-zinc-900/50 border-zinc-800" />
            <span className="text-zinc-500 text-xs">Empty</span>
          </div>
        </div>
      </div>
    </div>
  );
}
