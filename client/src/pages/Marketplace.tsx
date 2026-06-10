import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Search, Store, Package, Wrench, Users, Phone, Mail, MapPin, Filter } from "lucide-react";

const LISTING_TYPES = [
  { value: "slab_for_sale", label: "Slab for Sale", icon: Package, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { value: "remnant_for_sale", label: "Remnant for Sale", icon: Package, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { value: "capacity_available", label: "Capacity Available", icon: Wrench, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { value: "capacity_needed", label: "Capacity Needed", icon: Wrench, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  { value: "equipment_for_sale", label: "Equipment for Sale", icon: Wrench, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  { value: "job_opportunity", label: "Job Opportunity", icon: Users, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
];

const STONE_TYPES = ["Quartz","Granite","Quartzite","Marble","Porcelain","Dolomite","Travertine","Limestone","Other"];

export default function Marketplace() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({
    listingType: "slab_for_sale", title: "", description: "", stoneType: "Granite",
    color: "", quantity: "", unit: "slabs", price: "",
    locationCity: "", locationState: "", contactEmail: "", contactPhone: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const { data: listings = [] } = useQuery({
    queryKey: ["/api/marketplace"],
    queryFn: () => fetch("/api/marketplace", { credentials: "include" }).then(r => r.json()),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => fetch("/api/marketplace", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify(data),
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/marketplace"] }); setShowForm(false); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/marketplace/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/marketplace"] }); setSelected(null); },
  });

  const resetForm = () => setForm({ listingType: "slab_for_sale", title: "", description: "", stoneType: "Granite", color: "", quantity: "", unit: "slabs", price: "", locationCity: "", locationState: "", contactEmail: "", contactPhone: "" });

  const allListings = listings as any[];
  const filtered = allListings
    .filter(l => filterType === "all" || l.listing_type === filterType)
    .filter(l => !search || `${l.title} ${l.stone_type} ${l.color} ${l.location_city}`.toLowerCase().includes(search.toLowerCase()));

  const getTypeInfo = (type: string) => LISTING_TYPES.find(t => t.value === type) || LISTING_TYPES[0];

  return (
    <div className="p-8 max-w-6xl">
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-zinc-700 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Post Listing</h2>
              <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Listing Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {LISTING_TYPES.map(t => {
                    const Icon = t.icon;
                    return (
                      <button key={t.value} onClick={() => set("listingType", t.value)}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-colors ${form.listingType === t.value ? "border-amber-500 bg-amber-500/10" : "border-zinc-700 bg-zinc-900 hover:border-zinc-600"}`}>
                        <Icon size={13} className={t.color} />
                        <span className="text-zinc-300 text-xs">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Title</label>
                <input type="text" placeholder="48 slabs Calacatta Laza quartz available" value={form.title} onChange={e => set("title", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
              </div>
              {["slab_for_sale", "remnant_for_sale"].includes(form.listingType) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Stone Type</label>
                    <select value={form.stoneType} onChange={e => set("stoneType", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm">
                      {STONE_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Color / Material</label>
                    <input type="text" placeholder="Calacatta Laza" value={form.color} onChange={e => set("color", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Quantity</label>
                  <input type="number" placeholder="10" value={form.quantity} onChange={e => set("quantity", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Unit</label>
                  <select value={form.unit} onChange={e => set("unit", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm">
                    {["slabs","sqft","pieces","bundles","jobs"].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Price ($)</label>
                  <input type="number" placeholder="500" value={form.price} onChange={e => set("price", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Description</label>
                <textarea rows={2} placeholder="Additional details, condition, specs..." value={form.description} onChange={e => set("description", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">City</label>
                  <input type="text" value={form.locationCity} onChange={e => set("locationCity", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">State</label>
                  <input type="text" placeholder="OH" value={form.locationState} onChange={e => set("locationState", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Contact Email</label>
                  <input type="email" value={form.contactEmail} onChange={e => set("contactEmail", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Contact Phone</label>
                  <input type="tel" value={form.contactPhone} onChange={e => set("contactPhone", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-2.5 text-sm">Cancel</button>
                <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.title}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold rounded-lg py-2.5 text-sm">
                  {mutation.isPending ? "Posting..." : "Post Listing"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-zinc-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
            </div>
            <div className="space-y-2 mb-4">
              {selected.stone_type && <div className="flex justify-between text-sm"><span className="text-zinc-500">Stone</span><span className="text-zinc-300">{selected.stone_type} — {selected.color}</span></div>}
              {selected.quantity && <div className="flex justify-between text-sm"><span className="text-zinc-500">Quantity</span><span className="text-zinc-300">{selected.quantity} {selected.unit}</span></div>}
              {selected.price && <div className="flex justify-between text-sm"><span className="text-zinc-500">Price</span><span className="text-amber-400 font-mono">${Number(selected.price).toLocaleString()}</span></div>}
              {selected.location_city && <div className="flex items-center gap-2 text-sm"><MapPin size={12} className="text-zinc-500" /><span className="text-zinc-300">{selected.location_city}, {selected.location_state}</span></div>}
              {selected.description && <div className="bg-zinc-900 rounded-lg p-3 text-zinc-400 text-xs">{selected.description}</div>}
              <div className="border-t border-zinc-800 pt-3">
                {selected.contact_email && <div className="flex items-center gap-2 text-sm mb-1"><Mail size={12} className="text-zinc-500" /><a href={`mailto:${selected.contact_email}`} className="text-amber-400 hover:underline">{selected.contact_email}</a></div>}
                {selected.contact_phone && <div className="flex items-center gap-2 text-sm"><Phone size={12} className="text-zinc-500" /><a href={`tel:${selected.contact_phone}`} className="text-amber-400 hover:underline">{selected.contact_phone}</a></div>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => deleteMutation.mutate(selected.id)} className="flex-1 bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400 rounded-lg py-2.5 text-sm">Remove My Listing</button>
              <button onClick={() => setSelected(null)} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg py-2.5 text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">StoneDesk Marketplace</h1>
          <p className="text-zinc-500 mt-1">Buy and sell slabs, trade capacity, find jobs — the stone industry marketplace</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2.5 rounded-lg text-sm">
          <Plus size={16} /> Post Listing
        </button>
      </div>

      <div className="grid grid-cols-6 gap-3 mb-6">
        {LISTING_TYPES.map(t => {
          const count = allListings.filter(l => l.listing_type === t.value).length;
          const Icon = t.icon;
          return (
            <div key={t.value} className={`border rounded-xl px-3 py-3 text-center cursor-pointer transition-all ${filterType === t.value ? t.bg + " border-opacity-60" : "bg-[#0d0d14] border-zinc-800/60 hover:border-zinc-700"}`}
              onClick={() => setFilterType(filterType === t.value ? "all" : t.value)}>
              <Icon size={16} className={`${t.color} mx-auto mb-1`} />
              <div className="text-white font-mono text-lg font-bold">{count}</div>
              <div className="text-zinc-500 text-xs leading-tight">{t.label}</div>
            </div>
          );
        })}
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input type="text" placeholder="Search listings..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Store size={40} className="text-zinc-700 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No listings yet</h3>
          <p className="text-zinc-500 text-sm mb-4">Be the first to post — sell excess slabs, find capacity, or list equipment</p>
          <button onClick={() => setShowForm(true)} className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-xl text-sm">Post First Listing</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((listing: any) => {
            const typeInfo = getTypeInfo(listing.listing_type);
            const Icon = typeInfo.icon;
            return (
              <div key={listing.id} onClick={() => setSelected(listing)}
                className="bg-[#0d0d14] border border-zinc-800/60 hover:border-zinc-700 rounded-xl p-4 cursor-pointer transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded border ${typeInfo.bg} ${typeInfo.color}`}>{typeInfo.label}</span>
                  {listing.price && <span className="text-amber-400 font-mono text-sm font-bold">${Number(listing.price).toLocaleString()}</span>}
                </div>
                <div className="text-white font-semibold text-sm mb-1">{listing.title}</div>
                {listing.stone_type && <div className="text-zinc-400 text-xs mb-1">{listing.stone_type} · {listing.color}</div>}
                {listing.quantity && <div className="text-zinc-500 text-xs mb-2">{listing.quantity} {listing.unit}</div>}
                {listing.description && <div className="text-zinc-600 text-xs mb-2 line-clamp-2">{listing.description}</div>}
                <div className="flex items-center justify-between">
                  {listing.location_city && (
                    <div className="flex items-center gap-1 text-zinc-500 text-xs">
                      <MapPin size={10} />{listing.location_city}, {listing.location_state}
                    </div>
                  )}
                  <span className="text-zinc-700 text-xs">{new Date(listing.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
