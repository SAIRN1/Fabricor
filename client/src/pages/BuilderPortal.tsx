import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Building2, ClipboardList, CheckCircle, Clock, AlertCircle, Copy, ExternalLink } from "lucide-react";

const ORDER_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { value: "reviewing", label: "Reviewing", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "quoted", label: "Quoted", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { value: "approved", label: "Approved", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { value: "in_production", label: "In Production", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { value: "complete", label: "Complete", color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" },
];

export default function BuilderPortal() {
  const qc = useQueryClient();
  const [showAddBuilder, setShowAddBuilder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "builders">("orders");
  const [copied, setCopied] = useState("");
  const [builderForm, setBuilderForm] = useState({ companyName: "", contactName: "", email: "", phone: "", city: "", state: "" });
  const setB = (k: string, v: string) => setBuilderForm(f => ({ ...f, [k]: v }));

  const { data: builders = [] } = useQuery({
    queryKey: ["/api/builders"],
    queryFn: () => fetch("/api/builders", { credentials: "include" }).then(r => r.json()),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/builder-orders"],
    queryFn: () => fetch("/api/builder-orders", { credentials: "include" }).then(r => r.json()),
  });

  const addBuilderMutation = useMutation({
    mutationFn: (data: any) => fetch("/api/builders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify(data),
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/builders"] }); setShowAddBuilder(false); setBuilderForm({ companyName: "", contactName: "", email: "", phone: "", city: "", state: "" }); },
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, status }: any) => fetch(`/api/builder-orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ status }),
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/builder-orders"] }); setSelectedOrder(null); },
  });

  const copyAccessCode = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/builder/${code}`);
    setCopied(code);
    setTimeout(() => setCopied(""), 2000);
  };

  const ordersList = orders as any[];
  const buildersList = builders as any[];
  const pendingOrders = ordersList.filter(o => o.status === "pending").length;
  const getStatusInfo = (status: string) => ORDER_STATUSES.find(s => s.value === status) || ORDER_STATUSES[0];

  return (
    <div className="p-8 max-w-6xl">
      {showAddBuilder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-zinc-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Add Builder Account</h2>
              <button onClick={() => setShowAddBuilder(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Company Name</label>
                <input type="text" placeholder="Heartland Homes LLC" value={builderForm.companyName} onChange={e => setB("companyName", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Contact Name</label>
                  <input type="text" placeholder="John Smith" value={builderForm.contactName} onChange={e => setB("contactName", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Phone</label>
                  <input type="tel" placeholder="(614) 555-1234" value={builderForm.phone} onChange={e => setB("phone", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Email</label>
                <input type="email" placeholder="john@heartlandhomes.com" value={builderForm.email} onChange={e => setB("email", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">City</label>
                  <input type="text" value={builderForm.city} onChange={e => setB("city", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">State</label>
                  <input type="text" placeholder="OH" value={builderForm.state} onChange={e => setB("state", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
                </div>
              </div>
              <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg p-3">
                <p className="text-amber-400 text-xs font-medium mb-1">Access Code Auto-Generated</p>
                <p className="text-zinc-500 text-xs">A unique access code will be generated. Share it with the builder to give them access to their portal at your StoneDesk URL.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAddBuilder(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-2.5 text-sm">Cancel</button>
                <button onClick={() => addBuilderMutation.mutate(builderForm)} disabled={addBuilderMutation.isPending || !builderForm.companyName}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold rounded-lg py-2.5 text-sm">
                  {addBuilderMutation.isPending ? "Adding..." : "Add Builder"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-zinc-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">{selectedOrder.project_name}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
            </div>
            <div className="space-y-2 mb-4 text-sm">
              {selectedOrder.unit_number && <div className="flex justify-between"><span className="text-zinc-500">Unit</span><span className="text-zinc-300">{selectedOrder.unit_number}</span></div>}
              <div className="flex justify-between"><span className="text-zinc-500">Address</span><span className="text-zinc-300">{selectedOrder.address}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Stone</span><span className="text-zinc-300">{selectedOrder.stone_type} — {selectedOrder.color}</span></div>
              {selectedOrder.estimated_sqft && <div className="flex justify-between"><span className="text-zinc-500">Sq Ft</span><span className="text-zinc-300">{selectedOrder.estimated_sqft} sf</span></div>}
              {selectedOrder.edge_profile && <div className="flex justify-between"><span className="text-zinc-500">Edge</span><span className="text-zinc-300">{selectedOrder.edge_profile}</span></div>}
              {selectedOrder.cutouts && <div className="flex justify-between"><span className="text-zinc-500">Cutouts</span><span className="text-zinc-300">{selectedOrder.cutouts}</span></div>}
              {selectedOrder.notes && <div className="bg-zinc-900 rounded-lg p-2 text-zinc-400 text-xs">{selectedOrder.notes}</div>}
            </div>
            <div className="mb-4">
              <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Update Status</label>
              <div className="grid grid-cols-2 gap-1.5">
                {ORDER_STATUSES.map(s => (
                  <button key={s.value} onClick={() => updateOrderMutation.mutate({ id: selectedOrder.id, status: s.value })}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${selectedOrder.status === s.value ? s.color : 'border-zinc-700 bg-zinc-900 text-zinc-500 hover:text-zinc-300'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setSelectedOrder(null)} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg py-2.5 text-sm">Close</button>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Builder Portal</h1>
          <p className="text-zinc-500 mt-1">Manage builder accounts and incoming countertop orders</p>
        </div>
        <button onClick={() => setShowAddBuilder(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2.5 rounded-lg text-sm">
          <Plus size={16} /> Add Builder
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Builders</div>
          <div className="text-white font-mono text-2xl font-bold">{buildersList.length}</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Total Orders</div>
          <div className="text-amber-400 font-mono text-2xl font-bold">{ordersList.length}</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Pending Review</div>
          <div className="text-red-400 font-mono text-2xl font-bold">{pendingOrders}</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">In Production</div>
          <div className="text-emerald-400 font-mono text-2xl font-bold">{ordersList.filter(o => o.status === "in_production").length}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab("orders")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "orders" ? "bg-amber-500 text-black" : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"}`}>
          Orders ({ordersList.length})
        </button>
        <button onClick={() => setActiveTab("builders")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "builders" ? "bg-amber-500 text-black" : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"}`}>
          Builders ({buildersList.length})
        </button>
      </div>

      {activeTab === "orders" && (
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl overflow-hidden">
          {ordersList.length === 0 ? (
            <div className="py-12 text-center">
              <ClipboardList size={32} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No builder orders yet</p>
              <p className="text-zinc-600 text-xs mt-1">Share a builder's access code so they can submit orders</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Project</th>
                  <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Stone</th>
                  <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Sq Ft</th>
                  <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Priority</th>
                  <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {ordersList.map((order: any) => {
                  const statusInfo = getStatusInfo(order.status);
                  return (
                    <tr key={order.id} className="border-b border-zinc-800/40 hover:bg-zinc-900/20 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                      <td className="px-5 py-3">
                        <div className="text-zinc-200 font-medium">{order.project_name}</div>
                        <div className="text-zinc-500 text-xs">{order.address}</div>
                      </td>
                      <td className="px-5 py-3 text-zinc-300 text-xs">{order.stone_type}<br/><span className="text-zinc-500">{order.color}</span></td>
                      <td className="px-5 py-3 text-zinc-400 font-mono text-sm">{order.estimated_sqft || "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded border ${order.priority === 'rush' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'}`}>
                          {order.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded border ${statusInfo.color}`}>{statusInfo.label}</span>
                      </td>
                      <td className="px-5 py-3 text-zinc-600 text-xs">{new Date(order.created_at).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "builders" && (
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl overflow-hidden">
          {buildersList.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 size={32} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No builders yet</p>
              <button onClick={() => setShowAddBuilder(true)} className="text-amber-400 text-sm mt-2 hover:underline">Add your first builder</button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Builder</th>
                  <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Contact</th>
                  <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Orders</th>
                  <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Portal Link</th>
                </tr>
              </thead>
              <tbody>
                {buildersList.map((builder: any) => (
                  <tr key={builder.id} className="border-b border-zinc-800/40 hover:bg-zinc-900/20">
                    <td className="px-5 py-3">
                      <div className="text-zinc-200 font-medium">{builder.company_name}</div>
                      <div className="text-zinc-500 text-xs">{builder.city}, {builder.state}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-zinc-300 text-xs">{builder.contact_name}</div>
                      <div className="text-zinc-500 text-xs">{builder.email}</div>
                    </td>
                    <td className="px-5 py-3 text-zinc-400 font-mono text-sm">
                      {ordersList.filter(o => o.builder_id === builder.id).length}
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => copyAccessCode(builder.access_code)}
                        className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-xs">
                        {copied === builder.access_code ? <CheckCircle size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        {copied === builder.access_code ? "Copied!" : "Copy Link"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
