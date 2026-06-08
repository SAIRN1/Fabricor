import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, MapPin, Clock, User, Navigation } from "lucide-react";

const STOP_TYPES = ["template", "installation", "delivery", "service"] as const;

const stopColors: Record<string, string> = {
  template: "text-blue-400 bg-blue-950/40 border-blue-900/60",
  installation: "text-emerald-400 bg-emerald-950/40 border-emerald-900/60",
  delivery: "text-amber-400 bg-amber-950/40 border-amber-900/60",
  service: "text-red-400 bg-red-950/40 border-red-900/60",
};

export default function Schedule() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [form, setForm] = useState({
    stopType: "installation" as any,
    address: "", city: "", state: "OH", zip: "",
    tech: "", estimatedDuration: "60", notes: "",
    scheduledDate: new Date().toISOString().split("T")[0],
  });

  const { data: stops = [] } = useQuery({
    queryKey: ["/api/schedule"],
queryFn: async () => {
      try {
        const r = await fetch(`/api/schedule`, { credentials: "include" });
        if (!r.ok) return [];
        return r.json();
      } catch { return []; }
    },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => fetch("/api/schedule", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data), credentials: "include",
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/schedule"] }); setShowForm(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/schedule/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/schedule"] }),
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const openInGoogleMaps = () => {
    const stopsArr = stops as any[];
    if (stopsArr.length === 0) return;
    const addresses = stopsArr.map((s: any) => encodeURIComponent(`${s.address} ${s.city} ${s.state}`));
    const url = `https://www.google.com/maps/dir/${addresses.join("/")}`;
    window.open(url, "_blank");
  };

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Schedule</h1>
          <p className="text-zinc-500 mt-1">Daily route planning and stop management</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2.5 rounded-lg text-sm">
          <Plus size={16} /> Add Stop
        </button>
      </div>

      <div className="mb-5">
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
      </div>

      {(stops as any[]).length > 1 && (
        <button onClick={openInGoogleMaps}
          className="mb-5 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2.5 rounded-lg text-sm">
          <Navigation size={15} /> Open Full Route in Google Maps
        </button>
      )}

      <div className="grid grid-cols-3 gap-4">
        {(stops as any[]).length === 0 ? (
          <div className="col-span-3 py-16 text-center">
            <MapPin size={32} className="text-zinc-700 mx-auto mb-3" />
            <div className="text-zinc-500 text-sm">No stops scheduled for this date</div>
            <button onClick={() => setShowForm(true)} className="text-amber-400 text-sm mt-2 hover:underline">Add a stop</button>
          </div>
        ) : (stops as any[]).map((stop: any, i: number) => (
          <div key={stop.id} className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold text-xs">
                  {i + 1}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded border font-mono uppercase ${stopColors[stop.stopType]}`}>
                  {stop.stopType}
                </span>
              </div>
              <button onClick={() => deleteMutation.mutate(stop.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="flex items-start gap-2 text-zinc-300 text-sm mb-2">
              <MapPin size={13} className="text-zinc-500 mt-0.5 flex-shrink-0" />
              <span>{stop.address}, {stop.city}, {stop.state}</span>
            </div>
            {stop.tech && (
              <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                <User size={11} /><span>{stop.tech}</span>
              </div>
            )}
            {stop.estimatedDuration && (
              <div className="flex items-center gap-2 text-zinc-500 text-xs mb-2">
                <Clock size={11} /><span>{stop.estimatedDuration} min</span>
              </div>
            )}
            {stop.notes && <div className="text-zinc-600 text-xs mb-3">{stop.notes}</div>}
            <div className="flex gap-2">
              <a href={`https://maps.apple.com/?address=${encodeURIComponent(`${stop.address} ${stop.city} ${stop.state}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-amber-400 hover:underline">
                <Navigation size={10} /> Apple Maps
              </a>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${stop.address} ${stop.city} ${stop.state}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-400 hover:underline">
                <Navigation size={10} /> Google Maps
              </a>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-zinc-700 rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold">Add Schedule Stop</h2>
              <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs mb-1.5 block">Stop Type</label>
                  <select value={form.stopType} onChange={e => set("stopType", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500">
                    {STOP_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 text-xs mb-1.5 block">Date</label>
                  <input type="date" value={form.scheduledDate} onChange={e => set("scheduledDate", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500" />
                </div>
              </div>
              <div>
                <label className="text-zinc-400 text-xs mb-1.5 block">Address</label>
                <input type="text" placeholder="123 Main Street" value={form.address} onChange={e => set("address", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-400 text-xs mb-1.5 block">City</label>
                  <input type="text" placeholder="Westlake" value={form.city} onChange={e => set("city", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs mb-1.5 block">State</label>
                  <input type="text" placeholder="OH" value={form.state} onChange={e => set("state", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs mb-1.5 block">Zip</label>
                  <input type="text" placeholder="44145" value={form.zip} onChange={e => set("zip", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs mb-1.5 block">Technician</label>
                  <input type="text" placeholder="John Smith" value={form.tech} onChange={e => set("tech", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs mb-1.5 block">Duration (min)</label>
                  <input type="number" placeholder="60" value={form.estimatedDuration} onChange={e => set("estimatedDuration", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
              </div>
              <div>
                <label className="text-zinc-400 text-xs mb-1.5 block">Notes</label>
                <textarea rows={2} placeholder="Special instructions..." value={form.notes} onChange={e => set("notes", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-2.5 text-sm">Cancel</button>
                <button onClick={() => mutation.mutate({ ...form, estimatedDuration: parseInt(form.estimatedDuration) || 60, scheduledDate: new Date(form.scheduledDate).toISOString() })}
                  disabled={mutation.isPending || !form.address}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold rounded-lg py-2.5 text-sm">
                  {mutation.isPending ? "Adding..." : "Add Stop"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}