import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Search, Phone, Mail, MapPin, Building, Star, AlertTriangle, Brain } from "lucide-react";

const CUSTOMER_TYPES = ["retail", "contractor", "builder", "designer", "commercial"] as const;

const typeColors: Record<string, string> = {
  retail: "text-blue-400 bg-blue-950/40 border-blue-900/60",
  contractor: "text-orange-400 bg-orange-950/40 border-orange-900/60",
  builder: "text-emerald-400 bg-emerald-950/40 border-emerald-900/60",
  designer: "text-purple-400 bg-purple-950/40 border-purple-900/60",
  commercial: "text-amber-400 bg-amber-950/40 border-amber-900/60",
};

export default function Customers() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const [briefing, setBriefing] = useState("");
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", city: "", state: "OH", zip: "",
    customerType: "retail", company: "", notes: "",
  });
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: any) => fetch("/api/customers", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data), credentials: "include",
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/customers"] }); setShowForm(false); setForm({ firstName: "", lastName: "", email: "", phone: "", address: "", city: "", state: "OH", zip: "", customerType: "retail", company: "", notes: "" }); },
  });

  const { data: customerList = [], isLoading } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: () => fetch("/api/customers", { credentials: "include" }).then(r => r.json()),
  });

  const filtered = (customerList as any[])
    .filter((c: any) => filter === "all" || c.customerType === filter)
    .filter((c: any) => !search || [c.firstName, c.lastName, c.company, c.email, c.phone, c.city].some((f: any) => f?.toLowerCase().includes(search.toLowerCase())));

  const getBriefing = async (customer: any) => {
    setLoadingBriefing(true);
    setBriefing("");
    try {
      const r = await fetch("/api/claude/customer-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customer.id }),
        credentials: "include",
      });
      const data = await r.json();
      setBriefing(data.briefing || "No briefing available.");
    } catch { setBriefing("Could not generate briefing."); }
    setLoadingBriefing(false);
  };

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="p-8">
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-zinc-700/60 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800">
              <h2 className="text-white font-semibold text-lg">Add Customer</h2>
              <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">First Name</label>
                  <input type="text" placeholder="John" value={form.firstName} onChange={e => set("firstName", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Last Name</label>
                  <input type="text" placeholder="Smith" value={form.lastName} onChange={e => set("lastName", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Customer Type</label>
                  <select value={form.customerType} onChange={e => set("customerType", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500">
                    {CUSTOMER_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Company</label>
                  <input type="text" placeholder="Kopf Builders" value={form.company} onChange={e => set("company", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Phone</label>
                  <input type="text" placeholder="(440) 555-0123" value={form.phone} onChange={e => set("phone", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Email</label>
                  <input type="email" placeholder="john@email.com" value={form.email} onChange={e => set("email", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Address</label>
                <input type="text" placeholder="123 Main Street" value={form.address} onChange={e => set("address", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">City</label>
                  <input type="text" placeholder="Westlake" value={form.city} onChange={e => set("city", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">State</label>
                  <input type="text" placeholder="OH" value={form.state} onChange={e => set("state", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Zip</label>
                  <input type="text" placeholder="44145" value={form.zip} onChange={e => set("zip", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Notes</label>
                <textarea rows={3} placeholder="VIP customer, prefers Kelley as rep..." value={form.notes} onChange={e => set("notes", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-2.5 text-sm">Cancel</button>
                <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.firstName || !form.lastName}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold rounded-lg py-2.5 text-sm">
                  {mutation.isPending ? "Saving..." : "Add Customer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-zinc-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800">
              <div>
                <h2 className="text-white font-semibold text-lg">{selected.firstName} {selected.lastName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded border font-mono uppercase ${typeColors[selected.customerType]}`}>{selected.customerType}</span>
                  {selected.company && <span className="text-zinc-500 text-sm">{selected.company}</span>}
                </div>
              </div>
              <button onClick={() => { setSelected(null); setBriefing(""); }} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {selected.phone && (
                  <a href={`tel:${selected.phone}`} className="flex items-center gap-3 bg-zinc-900 rounded-xl px-4 py-3 hover:bg-zinc-800 transition-colors">
                    <Phone size={16} className="text-amber-400" />
                    <span className="text-zinc-300 text-sm">{selected.phone}</span>
                  </a>
                )}
                {selected.email && (
                  <a href={`mailto:${selected.email}`} className="flex items-center gap-3 bg-zinc-900 rounded-xl px-4 py-3 hover:bg-zinc-800 transition-colors">
                    <Mail size={16} className="text-amber-400" />
                    <span className="text-zinc-300 text-sm truncate">{selected.email}</span>
                  </a>
                )}
              </div>
              {selected.address && (
                <div className="flex items-center gap-3 bg-zinc-900 rounded-xl px-4 py-3">
                  <MapPin size={16} className="text-amber-400 flex-shrink-0" />
                  <span className="text-zinc-300 text-sm">{selected.address}, {selected.city}, {selected.state} {selected.zip}</span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-900 rounded-xl p-4 text-center">
                  <div className="text-2xl font-mono font-bold text-white">{selected.totalJobs || 0}</div>
                  <div className="text-zinc-500 text-xs mt-1">Total Jobs</div>
                </div>
                <div className="bg-zinc-900 rounded-xl p-4 text-center">
                  <div className="text-2xl font-mono font-bold text-emerald-400">${(selected.totalRevenue || 0).toLocaleString()}</div>
                  <div className="text-zinc-500 text-xs mt-1">Revenue</div>
                </div>
                <div className="bg-zinc-900 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Star size={14} className="text-amber-400" />
                    <span className="text-xl font-mono font-bold text-amber-400">{selected.praiseCount || 0}</span>
                    <AlertTriangle size={14} className="text-red-400" />
                    <span className="text-xl font-mono font-bold text-red-400">{selected.complaintCount || 0}</span>
                  </div>
                  <div className="text-zinc-500 text-xs mt-1">Praise / Issues</div>
                </div>
              </div>
              {selected.notes && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                  <div className="text-zinc-500 text-xs font-mono uppercase mb-2">Notes</div>
                  <p className="text-zinc-300 text-sm">{selected.notes}</p>
                </div>
              )}
              <div className="bg-amber-950/30 border border-amber-800/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Brain size={16} className="text-amber-400" />
                    <span className="text-amber-400 font-semibold text-sm">Claude Pre-Job Briefing</span>
                  </div>
                  <button onClick={() => getBriefing(selected)}
                    className="text-xs bg-amber-500 hover:bg-amber-400 text-black font-semibold px-3 py-1.5 rounded-lg transition-colors">
                    Generate Briefing
                  </button>
                </div>
                {loadingBriefing ? (
                  <div className="flex items-center gap-2 text-zinc-500 text-sm">
                    <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    Analyzing customer history...
                  </div>
                ) : briefing ? (
                  <p className="text-zinc-300 text-sm leading-relaxed">{briefing}</p>
                ) : (
                  <p className="text-zinc-600 text-sm">Click Generate Briefing for Claude's analysis of this customer's history and any issues to watch for.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Customers</h1>
          <p className="text-zinc-500 mt-1">Complete customer database with institutional memory</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2.5 rounded-lg text-sm">
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input type="text" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
        </div>
        <div className="flex gap-2">
          {["all", ...CUSTOMER_TYPES].map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-2 rounded-lg text-xs font-mono uppercase transition-colors ${filter === t ? "bg-amber-500 text-black font-semibold" : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-700"}`}>
              {t === "all" ? "All" : t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 py-12 text-center text-zinc-600">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-3 py-16 text-center">
            <Building size={32} className="text-zinc-700 mx-auto mb-3" />
            <div className="text-zinc-500 text-sm">No customers yet</div>
            <button onClick={() => setShowForm(true)} className="text-amber-400 text-sm mt-2 hover:underline">Add your first customer</button>
          </div>
        ) : filtered.map((customer: any) => (
          <div key={customer.id} onClick={() => setSelected(customer)}
            className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-5 cursor-pointer hover:border-amber-500/30 hover:bg-zinc-900/30 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <span className="text-zinc-300 font-bold text-sm">{customer.firstName[0]}{customer.lastName[0]}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded border font-mono uppercase ${typeColors[customer.customerType]}`}>{customer.customerType}</span>
            </div>
            <div className="text-white font-medium">{customer.firstName} {customer.lastName}</div>
            {customer.company && <div className="text-zinc-500 text-sm">{customer.company}</div>}
            {customer.city && <div className="text-zinc-600 text-xs mt-1">{customer.city}, {customer.state}</div>}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-800">
              <div>
                <div className="text-amber-400 font-mono text-sm font-bold">{customer.totalJobs || 0}</div>
                <div className="text-zinc-600 text-xs">Jobs</div>
              </div>
              <div>
                <div className="text-emerald-400 font-mono text-sm font-bold">${(customer.totalRevenue || 0).toLocaleString()}</div>
                <div className="text-zinc-600 text-xs">Revenue</div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {customer.praiseCount > 0 && <div className="flex items-center gap-1"><Star size={11} className="text-amber-400" /><span className="text-amber-400 text-xs font-mono">{customer.praiseCount}</span></div>}
                {customer.complaintCount > 0 && <div className="flex items-center gap-1"><AlertTriangle size={11} className="text-red-400" /><span className="text-red-400 text-xs font-mono">{customer.complaintCount}</span></div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}