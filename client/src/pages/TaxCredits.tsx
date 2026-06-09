import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, DollarSign, Download, AlertCircle } from "lucide-react";

const CATEGORIES = [
  "CNC Equipment", "Waterjet Equipment", "Digital Templating", "Polishing Equipment",
  "Safety Equipment", "Vehicle/Truck", "Computer/Software", "Building Improvement",
  "Tools & Supplies", "Training & Education", "Other Equipment"
];

const TAX_TIPS = [
  { title: "Section 179 Deduction", desc: "Deduct the full cost of qualifying equipment in the year purchased. Limit: $1,160,000 in 2023.", icon: "💡" },
  { title: "Bonus Depreciation", desc: "100% bonus depreciation on new equipment purchases. Phases down to 60% in 2024.", icon: "📉" },
  { title: "R&D Tax Credit", desc: "If you develop new fabrication processes or techniques, you may qualify for the R&D credit.", icon: "🔬" },
  { title: "Work Opportunity Tax Credit", desc: "Hiring employees from certain target groups (veterans, ex-felons) can generate credits.", icon: "👥" },
  { title: "Energy Efficiency Credits", desc: "Energy-efficient equipment upgrades may qualify for the Energy Investment Tax Credit.", icon: "⚡" },
];

export default function TaxCredits() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [form, setForm] = useState({
    description: "", amount: "", category: "CNC Equipment",
    purchaseDate: new Date().toISOString().split("T")[0],
    taxYear: new Date().getFullYear().toString(), notes: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const { data: credits = [] } = useQuery({
    queryKey: ["/api/tax-credits"],
    queryFn: () => fetch("/api/tax-credits", { credentials: "include" }).then(r => r.json()),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => fetch("/api/tax-credits", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify(data),
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/tax-credits"] }); setShowForm(false); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/tax-credits/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/tax-credits"] }),
  });

  const resetForm = () => setForm({ description: "", amount: "", category: "CNC Equipment", purchaseDate: new Date().toISOString().split("T")[0], taxYear: new Date().getFullYear().toString(), notes: "" });

  const allCredits = credits as any[];
  const yearCredits = allCredits.filter((c: any) => c.tax_year === filterYear);
  const totalAmount = yearCredits.reduce((s: number, c: any) => s + (c.amount || 0), 0);
  const estimatedSavings = totalAmount * 0.25; // approx 25% tax rate

  const exportCSV = () => {
    const rows = yearCredits.map((c: any) => `"${c.description}","${c.category}","${c.purchase_date}","${c.amount}","${c.notes || ''}"`);
    const csv = `"Description","Category","Purchase Date","Amount","Notes"\n${rows.join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `StoneDesk-TaxCredits-${filterYear}.csv`;
    a.click();
  };

  const years = Array.from(new Set([new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2]));

  return (
    <div className="p-8 max-w-5xl">
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-zinc-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Add Equipment Purchase</h2>
              <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Description</label>
                <input type="text" placeholder="Park Industries CNC Saw" value={form.description} onChange={e => set("description", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Amount ($)</label>
                  <input type="number" placeholder="45000" value={form.amount} onChange={e => set("amount", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Category</label>
                  <select value={form.category} onChange={e => set("category", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Purchase Date</label>
                  <input type="date" value={form.purchaseDate} onChange={e => set("purchaseDate", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Tax Year</label>
                  <select value={form.taxYear} onChange={e => set("taxYear", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm">
                    {years.map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Notes</label>
                <textarea rows={2} placeholder="Serial number, vendor, purpose..." value={form.notes} onChange={e => set("notes", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-2.5 text-sm">Cancel</button>
                <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.description || !form.amount}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold rounded-lg py-2.5 text-sm">
                  {mutation.isPending ? "Saving..." : "Add Purchase"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Tax Credit Tracker</h1>
          <p className="text-zinc-500 mt-1">Track equipment purchases and deductions — share with your accountant at year end</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold px-4 py-2.5 rounded-lg text-sm">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2.5 rounded-lg text-sm">
            <Plus size={16} /> Add Purchase
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {years.map(y => (
          <button key={y} onClick={() => setFilterYear(y)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterYear === y ? "bg-amber-500 text-black" : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"}`}>
            {y}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Total Purchases {filterYear}</div>
          <div className="text-amber-400 font-mono text-2xl font-bold">${totalAmount.toLocaleString()}</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Est. Tax Savings</div>
          <div className="text-emerald-400 font-mono text-2xl font-bold">${estimatedSavings.toLocaleString()}</div>
          <div className="text-zinc-600 text-xs mt-1">At 25% tax rate</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Items Tracked</div>
          <div className="text-blue-400 font-mono text-2xl font-bold">{yearCredits.length}</div>
        </div>
      </div>

      <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-2">
          <AlertCircle size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-zinc-400 text-xs">StoneDesk is not a tax advisor. Always consult a CPA or tax professional before making deduction decisions. This tracker helps you organize information to share with your accountant.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {TAX_TIPS.map(tip => (
          <div key={tip.title} className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span>{tip.icon}</span>
              <span className="text-zinc-200 text-sm font-medium">{tip.title}</span>
            </div>
            <p className="text-zinc-500 text-xs">{tip.desc}</p>
          </div>
        ))}
      </div>

      {yearCredits.length === 0 ? (
        <div className="py-12 text-center">
          <DollarSign size={32} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No purchases tracked for {filterYear}</p>
          <button onClick={() => setShowForm(true)} className="text-amber-400 text-sm mt-2 hover:underline">Add your first equipment purchase</button>
        </div>
      ) : (
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Description</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Category</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Date</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Amount</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {yearCredits.map((c: any) => (
                <tr key={c.id} className="border-b border-zinc-800/40 hover:bg-zinc-900/20">
                  <td className="px-5 py-3">
                    <div className="text-zinc-200">{c.description}</div>
                    {c.notes && <div className="text-zinc-600 text-xs">{c.notes}</div>}
                  </td>
                  <td className="px-5 py-3 text-zinc-400 text-xs">{c.category}</td>
                  <td className="px-5 py-3 text-zinc-400 text-xs">{new Date(c.purchase_date).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-amber-400 font-mono">${Number(c.amount).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => deleteMutation.mutate(c.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
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
