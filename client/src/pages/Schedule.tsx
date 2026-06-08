import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, MapPin, Clock, User, Navigation } from "lucide-react";
import { Loader } from "@googlemaps/js-api-loader";

const STOP_TYPES = ["template", "installation", "delivery", "service"] as const;

const stopColors: Record<string, string> = {
  template: "text-blue-400 bg-blue-950/40 border-blue-900/60",
  installation: "text-emerald-400 bg-emerald-950/40 border-emerald-900/60",
  delivery: "text-amber-400 bg-amber-950/40 border-amber-900/60",
  service: "text-red-400 bg-red-950/40 border-red-900/60",
};

export default function Schedule() {
  const qc = useQueryClient();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [form, setForm] = useState({
    stopType: "installation" as any,
    address: "", city: "", state: "OH", zip: "",
    tech: "", estimatedDuration: "60", notes: "",
    scheduledDate: new Date().toISOString().split("T")[0],
  });

  const { data: stops = [] } = useQuery({
    queryKey: ["/api/schedule", selectedDate],
    queryFn: () => fetch(`/api/schedule?date=${selectedDate}`, { credentials: "include" }).then(r => r.json()),
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

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !mapRef.current) return;
    const loader = new Loader({ apiKey, version: "weekly" });
    loader.load().then(() => {
      const m = new (window as any).google.maps.Map(mapRef.current, {
        center: { lat: 41.4534, lng: -81.8385 },
        zoom: 10,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#0d0d14" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#0d0d14" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
          { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a1a2e" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a0a14" }] },
          { featureType: "poi", stylers: [{ visibility: "off" }] },
        ],
      });
      setMap(m);
    });
  }, []);

  useEffect(() => {
    if (!map || !(stops as any[]).length) return;
    markers.forEach(m => m.setMap(null));
    const newMarkers: any[] = [];
    const bounds = new (window as any).google.maps.LatLngBounds();
    (stops as any[]).forEach((stop: any, i: number) => {
      if (!stop.lat || !stop.lng) return;
      const marker = new (window as any).google.maps.Marker({
        position: { lat: stop.lat, lng: stop.lng },
        map,
        label: { text: String(i + 1), color: "black", fontWeight: "bold" },
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 18,
          fillColor: stop.stopType === "installation" ? "#10b981" : stop.stopType === "template" ? "#3b82f6" : "#f59e0b",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      const infoWindow = new (window as any).google.maps.InfoWindow({
        content: `<div style="color:#000;padding:8px;font-family:sans-serif"><strong>${stop.stopType.toUpperCase()}</strong><br/>${stop.address}<br/>${stop.city}, ${stop.state}<br/>Tech: ${stop.tech || "Unassigned"}</div>`,
      });
      marker.addListener("click", () => infoWindow.open(map, marker));
      newMarkers.push(marker);
      bounds.extend({ lat: stop.lat, lng: stop.lng });
    });
    if (newMarkers.length > 0) map.fitBounds(bounds);
    setMarkers(newMarkers);
  }, [map, stops]);

  const openInGoogleMaps = () => {
    const stopsWithCoords = (stops as any[]).filter((s: any) => s.lat && s.lng);
    if (stopsWithCoords.length === 0) return;
    const waypoints = stopsWithCoords.slice(1, -1).map((s: any) => `${s.lat},${s.lng}`).join("|");
    const origin = `${stopsWithCoords[0].lat},${stopsWithCoords[0].lng}`;
    const dest = `${stopsWithCoords[stopsWithCoords.length - 1].lat},${stopsWithCoords[stopsWithCoords.length - 1].lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&waypoints=${waypoints}&travelmode=driving`;
    window.open(url, "_blank");
  };

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="flex h-screen">
      <div className="w-96 bg-[#0d0d14] border-r border-zinc-800/60 flex flex-col flex-shrink-0">
        <div className="px-5 py-5 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white">Schedule</h1>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-3 py-1.5 rounded-lg text-xs">
              <Plus size={13} /> Add Stop
            </button>
          </div>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {(stops as any[]).length === 0 ? (
            <div className="text-center py-12">
              <MapPin size={24} className="text-zinc-700 mx-auto mb-2" />
              <div className="text-zinc-600 text-sm">No stops scheduled</div>
              <button onClick={() => setShowForm(true)} className="text-amber-400 text-xs mt-1 hover:underline">Add a stop</button>
            </div>
          ) : (stops as any[]).map((stop: any, i: number) => (
            <div key={stop.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold text-xs flex-shrink-0">
                    {i + 1}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded border font-mono uppercase ${stopColors[stop.stopType]}`}>
                    {stop.stopType}
                  </span>
                </div>
                <button onClick={() => deleteMutation.mutate(stop.id)} className="text-zinc-700 hover:text-red-400 transition-colors">
                  <X size={14} />
                </button>
              </div>
              <div className="flex items-start gap-1.5 text-zinc-300 text-sm">
                <MapPin size={12} className="text-zinc-500 mt-0.5 flex-shrink-0" />
                <span>{stop.address}, {stop.city}</span>
              </div>
              {stop.tech && (
                <div className="flex items-center gap-1.5 text-zinc-500 text-xs mt-1">
                  <User size={11} />
                  <span>{stop.tech}</span>
                </div>
              )}
              {stop.estimatedDuration && (
                <div className="flex items-center gap-1.5 text-zinc-500 text-xs mt-0.5">
                  <Clock size={11} />
                  <span>{stop.estimatedDuration} min</span>
                </div>
              )}
              {stop.notes && <div className="text-zinc-600 text-xs mt-1 truncate">{stop.notes}</div>}
              <a href={`https://maps.apple.com/?address=${encodeURIComponent(`${stop.address} ${stop.city} ${stop.state}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="mt-2 flex items-center gap-1 text-xs text-amber-400 hover:underline">
                <Navigation size={10} /> Open in Maps
              </a>
            </div>
          ))}
        </div>

        {(stops as any[]).length > 1 && (
          <div className="p-4 border-t border-zinc-800">
            <button onClick={openInGoogleMaps}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg py-2.5 text-sm flex items-center justify-center gap-2">
              <Navigation size={15} /> Open Full Route in Google Maps
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />
        {!(import.meta.env.VITE_GOOGLE_MAPS_API_KEY) && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
            <div className="text-center">
              <MapPin size={32} className="text-zinc-600 mx-auto mb-3" />
              <div className="text-zinc-400">Google Maps API key not configured</div>
            </div>
          </div>
        )}
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