import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, User, Shield, Wrench, TrendingUp, Crown, Mail } from "lucide-react";

const ROLES = [
  { value: "owner", label: "Owner", icon: Crown, desc: "Full access to everything", color: "text-amber-400" },
  { value: "manager", label: "Manager", icon: Shield, desc: "All features except billing", color: "text-blue-400" },
  { value: "sales", label: "Sales Rep", icon: TrendingUp, desc: "Jobs, customers, estimates", color: "text-emerald-400" },
  { value: "installer", label: "Installer", icon: Wrench, desc: "Schedule and job status only", color: "text-purple-400" },
];

export default function Team() {
  const qc = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "installer" });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const { data: team = [] } = useQuery({
    queryKey: ["/api/team"],
    queryFn: () => fetch("/api/team", { credentials: "include" }).then(r => r.json()),
  });

  const inviteMutation = useMutation({
    mutationFn: (data: any) => fetch("/api/team/invite", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify(data),
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/team"] }); setShowInvite(false); setForm({ name: "", email: "", password: "", role: "installer" }); },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => fetch(`/api/team/${userId}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/team"] }),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: any) => fetch(`/api/team/${userId}/role`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ role }),
    }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/team"] }),
  });

  const getRoleInfo = (role: string) => ROLES.find(r => r.value === role) || ROLES[3];

  return (
    <div className="p-8 max-w-4xl">
      {showInvite && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-zinc-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Add Team Member</h2>
              <button onClick={() => setShowInvite(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Full Name</label>
                <input type="text" placeholder="John Smith" value={form.name} onChange={e => set("name", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Email</label>
                <input type="email" placeholder="john@yourshop.com" value={form.email} onChange={e => set("email", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Temporary Password</label>
                <input type="text" placeholder="They can change this after login" value={form.password} onChange={e => set("password", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.filter(r => r.value !== 'owner').map(role => {
                    const Icon = role.icon;
                    return (
                      <button key={role.value} onClick={() => set("role", role.value)}
                        className={`flex items-start gap-2 p-3 rounded-lg border text-left transition-colors ${form.role === role.value ? "border-amber-500 bg-amber-500/10" : "border-zinc-700 bg-zinc-900 hover:border-zinc-600"}`}>
                        <Icon size={14} className={`mt-0.5 ${role.color}`} />
                        <div>
                          <div className="text-white text-xs font-medium">{role.label}</div>
                          <div className="text-zinc-500 text-xs">{role.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowInvite(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-2.5 text-sm">Cancel</button>
                <button onClick={() => inviteMutation.mutate(form)} disabled={inviteMutation.isPending || !form.name || !form.email || !form.password}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold rounded-lg py-2.5 text-sm">
                  {inviteMutation.isPending ? "Adding..." : "Add Member"}
                </button>
              </div>
              {inviteMutation.data?.error && <p className="text-red-400 text-xs">{inviteMutation.data.error}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Team</h1>
          <p className="text-zinc-500 mt-1">Manage your shop's team members and their access levels</p>
        </div>
        <button onClick={() => setShowInvite(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2.5 rounded-lg text-sm">
          <Plus size={16} /> Add Team Member
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {ROLES.map(role => {
          const Icon = role.icon;
          const count = (team as any[]).filter((m: any) => m.shop_role === role.value).length;
          return (
            <div key={role.value} className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className={role.color} />
                <span className="text-zinc-400 text-xs">{role.label}</span>
              </div>
              <div className="text-white font-mono text-2xl font-bold">{count}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-zinc-400 text-xs uppercase tracking-wider">Team Members ({(team as any[]).length})</span>
        </div>
        {(team as any[]).length === 0 ? (
          <div className="py-12 text-center">
            <User size={32} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No team members yet</p>
            <button onClick={() => setShowInvite(true)} className="text-amber-400 text-sm mt-2 hover:underline">Add your first team member</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Member</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Role</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Joined</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {(team as any[]).map((member: any) => {
                const roleInfo = getRoleInfo(member.shop_role);
                const Icon = roleInfo.icon;
                return (
                  <tr key={member.id} className="border-b border-zinc-800/40 hover:bg-zinc-900/20">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
                          <span className="text-zinc-300 text-xs font-bold">{member.name?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="text-zinc-200 font-medium">{member.name}</div>
                          <div className="text-zinc-500 text-xs">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <select value={member.shop_role} onChange={e => updateRoleMutation.mutate({ userId: member.id, role: e.target.value })}
                        disabled={member.shop_role === 'owner'}
                        className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 disabled:opacity-50">
                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-zinc-500 text-xs">{new Date(member.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      {member.shop_role !== 'owner' && (
                        <button onClick={() => removeMutation.mutate(member.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                          <X size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6 bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-3">Role Permissions</h3>
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map(role => {
            const Icon = role.icon;
            return (
              <div key={role.value} className="bg-zinc-900/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={13} className={role.color} />
                  <span className="text-zinc-200 text-sm font-medium">{role.label}</span>
                </div>
                <p className="text-zinc-500 text-xs">{role.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
