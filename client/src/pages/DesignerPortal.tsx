import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Palette, Copy, CheckCircle, ExternalLink } from "lucide-react";

export default function DesignerPortal() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [copied, setCopied] = useState("");
  const [form, setForm] = useState({ contactName: "", companyName: "", email: "", phone: "" });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const { data: designers = [] } = useQuery({
    queryKey: ["/api/designers"],
    queryFn: () => fetch("/api/designers", { credentials: "include" }).then(r => r.json()),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => fetch("/api/designers", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify(data),
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/designers"] }); setShowAdd(false); setForm({ contactName: "", companyName: "", email: "", phone: "" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/designers/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/designers"] }),
  });

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/designer/${code}`);
    setCopied(code);
    setTimeout(() => setCopied(""), 2000);
  };

  const designersList = designers as any[];

  return (
    <div className="p-8 max-w-5xl">
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-zinc-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Add Designer</h2>
              <button onClick={() => setShowAdd(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Designer / Contact Name</label>
                <input type="text" placeholder="Sarah Johnson" value={form.contactName} onChange={e => set("contactName", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Firm / Company (optional)</label>
                <input type="text" placeholder="Johnson Interior Design" value={form.companyName} onChange={e => set("companyName", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Email</label>
                  <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Phone</label>
                  <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
                </div>
              </div>
              <div className="bg-purple-950/20 border border-purple-800/30 rounded-lg p-3">
                <p className="text-purple-400 text-xs font-medium mb-1">Designer Portal Access</p>
                <p className="text-zinc-500 text-xs">A unique link will be generated. The designer can submit project specifications and track their clients' jobs through your portal.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAdd(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-2.5 text-sm">Cancel</button>
                <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.contactName}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold rounded-lg py-2.5 text-sm">
                  {mutation.isPending ? "Adding..." : "Add Designer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Designer Portal</h1>
          <p className="text-zinc-500 mt-1">Give interior designers and architects direct access to submit and track projects</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2.5 rounded-lg text-sm">
          <Plus size={16} /> Add Designer
        </button>
      </div>

      <div className="bg-purple-950/20 border border-purple-800/30 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Palette size={16} className="text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-purple-400 font-semibold text-sm mb-1">Why Designers Love This</div>
            <p className="text-zinc-400 text-xs leading-relaxed">Interior designers and architects specify stone for multiple clients at once. By giving them their own portal, they submit project specs directly to you — no phone tag, no emails back and forth. They can track all their clients' jobs in one place. Designers who use StoneDesk shops refer more clients.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Designers</div>
          <div className="text-white font-mono text-2xl font-bold">{designersList.length}</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Active Portals</div>
          <div className="text-purple-400 font-mono text-2xl font-bold">{designersList.filter(d => d.active).length}</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Potential Referrals</div>
          <div className="text-emerald-400 font-mono text-2xl font-bold">{designersList.length * 5}+</div>
          <div className="text-zinc-600 text-xs mt-1">Est. clients per designer</div>
        </div>
      </div>

      {designersList.length === 0 ? (
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-2xl p-12 text-center">
          <Palette size={40} className="text-zinc-700 mx-auto mb-4" />
          <h3 className="text-white font-semibold text-lg mb-2">Add Your First Designer</h3>
          <p className="text-zinc-500 text-sm max-w-md mx-auto mb-6">Every interior designer you add becomes a referral source. Give them their portal link and they'll send their clients directly to you.</p>
          <button onClick={() => setShowAdd(true)} className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-xl text-sm">Add Designer</button>
        </div>
      ) : (
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Designer</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Contact</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Status</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Portal Link</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {designersList.map((d: any) => (
                <tr key={d.id} className="border-b border-zinc-800/40 hover:bg-zinc-900/20">
                  <td className="px-5 py-3">
                    <div className="text-zinc-200 font-medium">{d.contact_name}</div>
                    <div className="text-zinc-500 text-xs">{d.company_name}</div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-zinc-300 text-xs">{d.email}</div>
                    <div className="text-zinc-500 text-xs">{d.phone}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded border ${d.active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'}`}>
                      {d.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => copyLink(d.access_code)}
                      className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-xs">
                      {copied === d.access_code ? <CheckCircle size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      {copied === d.access_code ? "Copied!" : "Copy Link"}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => deleteMutation.mutate(d.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
