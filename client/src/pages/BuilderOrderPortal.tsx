import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { CheckCircle, Package, Clock, Wrench, Send } from "lucide-react";

const STONE_TYPES = ["Quartz","Granite","Quartzite","Marble","Porcelain","Dolomite","Soapstone"];
const EDGES = ["Eased","Beveled","Bullnose","Ogee","Waterfall","Mitered"];

export default function BuilderOrderPortal() {
  const [, params] = useRoute("/builder/:code");
  const code = params?.code || "";
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    projectName: "", unitNumber: "", address: "", stoneType: "Quartz",
    color: "", estimatedSqft: "", edgeProfile: "Eased", cutouts: "",
    requestedDate: "", priority: "normal", notes: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const { data: builder, isLoading, error } = useQuery({
    queryKey: ["/api/builder-portal", code],
    queryFn: () => fetch(`/api/builder-portal/${code}`).then(r => r.json()),
    enabled: !!code,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/builder-portal", code, "orders"],
    queryFn: () => fetch(`/api/builder-portal/${code}/orders`).then(r => r.json()),
    enabled: !!code && !!builder?.id,
  });

  const submitMutation = useMutation({
    mutationFn: () => fetch(`/api/builder-portal/${code}/orders`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).then(r => r.json()),
    onSuccess: () => setSubmitted(true),
  });

  if (isLoading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!builder?.id) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="text-center">
        <div className="text-red-400 text-lg font-semibold mb-2">Invalid Access Code</div>
        <div className="text-zinc-500 text-sm">This builder portal link is not valid. Please contact your stone fabricator.</div>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
        <h2 className="text-white text-2xl font-bold mb-2">Order Submitted!</h2>
        <p className="text-zinc-400 text-sm mb-6">Your countertop order has been sent to {builder.shop_name}. They will review and contact you with pricing and scheduling.</p>
        <button onClick={() => { setSubmitted(false); setForm({ projectName: "", unitNumber: "", address: "", stoneType: "Quartz", color: "", estimatedSqft: "", edgeProfile: "Eased", cutouts: "", requestedDate: "", priority: "normal", notes: "" }); }}
          className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-xl text-sm">Submit Another Order</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <span className="text-black font-bold text-lg">S</span>
            </div>
            <span className="text-white font-bold text-xl">StoneDesk</span>
          </div>
          <h1 className="text-white text-2xl font-bold">{builder.company_name}</h1>
          <p className="text-zinc-500 text-sm mt-1">Submit countertop orders directly to {builder.shop_name}</p>
        </div>

        {(orders as any[]).length > 0 && (
          <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-2xl p-5 mb-6">
            <h3 className="text-white font-semibold mb-3 text-sm">Your Recent Orders</h3>
            <div className="space-y-2">
              {(orders as any[]).slice(0, 5).map((o: any) => (
                <div key={o.id} className="flex items-center justify-between bg-zinc-900 rounded-lg px-3 py-2">
                  <div>
                    <span className="text-zinc-200 text-sm">{o.project_name}</span>
                    {o.unit_number && <span className="text-zinc-500 text-xs ml-2">Unit {o.unit_number}</span>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded border ${
                    o.status === "complete" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                    o.status === "in_production" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                    "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  }`}>{o.status?.replace(/_/g, " ")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-5">New Countertop Order</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Project Name / Subdivision</label>
                <input type="text" placeholder="Oakwood Estates" value={form.projectName} onChange={e => set("projectName", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Unit / Lot Number</label>
                <input type="text" placeholder="Lot 42 / Unit 3B" value={form.unitNumber} onChange={e => set("unitNumber", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Job Site Address</label>
              <input type="text" placeholder="123 Main St, Columbus, OH 43215" value={form.address} onChange={e => set("address", e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Stone Type</label>
                <select value={form.stoneType} onChange={e => set("stoneType", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm">
                  {STONE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Color / Material Name</label>
                <input type="text" placeholder="Calacatta Laza" value={form.color} onChange={e => set("color", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Est. Sq Ft</label>
                <input type="number" placeholder="45" value={form.estimatedSqft} onChange={e => set("estimatedSqft", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Edge Profile</label>
                <select value={form.edgeProfile} onChange={e => set("edgeProfile", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm">
                  {EDGES.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Priority</label>
                <select value={form.priority} onChange={e => set("priority", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm">
                  <option value="normal">Normal</option>
                  <option value="rush">Rush</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Cutouts</label>
              <input type="text" placeholder="1 undermount sink, 1 cooktop" value={form.cutouts} onChange={e => set("cutouts", e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div>
              <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Requested Date</label>
              <input type="date" value={form.requestedDate} onChange={e => set("requestedDate", e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div>
              <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Notes</label>
              <textarea rows={3} placeholder="Special instructions, access codes, HOA requirements..." value={form.notes} onChange={e => set("notes", e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm resize-none" />
            </div>
            <button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || !form.projectName || !form.address}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold py-3.5 rounded-xl text-sm transition-colors">
              {submitMutation.isPending ? "Submitting..." : <><Send size={15} /> Submit Order</>}
            </button>
          </div>
        </div>
        <p className="text-center text-zinc-700 text-xs mt-6">Powered by StoneDesk · SAIRN Technologies</p>
      </div>
    </div>
  );
}
