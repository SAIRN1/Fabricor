import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, MapPin, Users, TrendingUp, Building2, Phone, CheckCircle } from "lucide-react";

export default function Locations() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", city: "", state: "", phone: "", managerName: "" });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations"],
    queryFn: () => fetch("/api/locations", { credentials: "include" }).then(r => r.json()),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["/api/jobs"],
    queryFn: () => fetch("/api/jobs", { credentials: "include" }).then(r => r.json()),
  });

  const { data: team = [] } = useQuery({
    queryKey: ["/api/team"],
    queryFn: () => fetch("/api/team", { credentials: "include" }).then(r => r.json()),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => fetch("/api/locations", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify(data),
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/locations"] }); setShowForm(false); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/locations/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/locations"] }),
  });

  const resetForm = () => setForm({ name: "", address: "", city: "", state: "", phone: "", managerName: "" });

  const locationsList = locations as any[];
  const jobsList = jobs as any[];
  const teamList = team as any[];

  const getLocationStats = (locationId: string) => {
    const locJobs = jobsList.filter(j => j.location_id === locationId);
    const locTeam = teamList.filter(m => m.location_id === locationId);
    const revenue = locJobs.reduce((s, j) => s + (j.estimated_revenue || 0), 0);
    const activeJobs = locJobs.filter(j => j.stage !== "complete").length;
    return { jobCount: locJobs.length, teamCount: locTeam.length, revenue, activeJobs };
  };

  const totalRevenue = jobsList.reduce((s, j) => s + (j.estimated_revenue || 0), 0);
  const totalActiveJobs = jobsList.filter(j => j.stage !== "complete").length;

  return (
    <div className="p-8 max-w-6xl">
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-zinc-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Add Location</h2>
              <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Location Name</label>
                <input type="text" placeholder="North Columbus Shop" value={form.name} onChange={e => set("name", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Address</label>
                <input type="text" placeholder="1234 Industrial Pkwy" value={form.address} onChange={e => set("address", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">City</label>
                  <input type="text" placeholder="Columbus" value={form.city} onChange={e => set("city", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">State</label>
                  <input type="text" placeholder="OH" value={form.state} onChange={e => set("state", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Phone</label>
                  <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Manager Name</label>
                  <input type="text" placeholder="Jane Smith" value={form.managerName} onChange={e => set("managerName", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-2.5 text-sm">Cancel</button>
                <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.name}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold rounded-lg py-2.5 text-sm">
                  {mutation.isPending ? "Adding..." : "Add Location"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Locations</h1>
          <p className="text-zinc-500 mt-1">Manage multiple shop locations from one dashboard</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2.5 rounded-lg text-sm">
          <Plus size={16} /> Add Location
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Locations</div>
          <div className="text-white font-mono text-2xl font-bold">{locationsList.length}</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Total Revenue</div>
          <div className="text-amber-400 font-mono text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Active Jobs</div>
          <div className="text-emerald-400 font-mono text-2xl font-bold">{totalActiveJobs}</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Team Members</div>
          <div className="text-blue-400 font-mono text-2xl font-bold">{teamList.length}</div>
        </div>
      </div>

      {locationsList.length === 0 ? (
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-2xl p-12 text-center">
          <Building2 size={40} className="text-zinc-700 mx-auto mb-4" />
          <h3 className="text-white font-semibold text-lg mb-2">Add Your First Location</h3>
          <p className="text-zinc-500 text-sm max-w-md mx-auto mb-6">Once you have multiple locations, you can track revenue, jobs, and team performance across all of them from this dashboard.</p>
          <button onClick={() => setShowForm(true)} className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-xl text-sm">Add Location</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {locationsList.map((loc: any) => {
            const stats = getLocationStats(loc.id);
            return (
              <div key={loc.id} className="bg-[#0d0d14] border border-zinc-800/60 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-bold text-lg">{loc.name}</h3>
                    <div className="flex items-center gap-1.5 text-zinc-500 text-xs mt-1">
                      <MapPin size={11} />
                      <span>{loc.city}, {loc.state}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className="text-emerald-400 text-xs">Active</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-zinc-900 rounded-lg p-3 text-center">
                    <div className="text-amber-400 font-mono text-lg font-bold">${stats.revenue.toLocaleString()}</div>
                    <div className="text-zinc-600 text-xs">Revenue</div>
                  </div>
                  <div className="bg-zinc-900 rounded-lg p-3 text-center">
                    <div className="text-blue-400 font-mono text-lg font-bold">{stats.activeJobs}</div>
                    <div className="text-zinc-600 text-xs">Active Jobs</div>
                  </div>
                  <div className="bg-zinc-900 rounded-lg p-3 text-center">
                    <div className="text-purple-400 font-mono text-lg font-bold">{stats.teamCount}</div>
                    <div className="text-zinc-600 text-xs">Team</div>
                  </div>
                </div>
                {loc.manager_name && (
                  <div className="flex items-center gap-2 text-zinc-400 text-xs mb-2">
                    <Users size={11} /> Manager: {loc.manager_name}
                  </div>
                )}
                {loc.phone && (
                  <div className="flex items-center gap-2 text-zinc-400 text-xs mb-3">
                    <Phone size={11} /> {loc.phone}
                  </div>
                )}
                <button onClick={() => deleteMutation.mutate(loc.id)}
                  className="w-full bg-zinc-800 hover:bg-red-950 text-zinc-500 hover:text-red-400 text-xs py-2 rounded-lg transition-colors">
                  Remove Location
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
