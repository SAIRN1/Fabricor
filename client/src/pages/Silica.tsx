import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, CheckCircle, AlertTriangle, Shield, Download, User } from "lucide-react";

const TRAINING_TYPES = [
  "Initial Silica Safety Training",
  "Annual Refresher Training",
  "Wet Cutting Procedures",
  "Ventilation Systems",
  "PPE Usage and Maintenance",
  "Emergency Procedures",
  "Cal/OSHA Regulations",
];

export default function Silica() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    workerName: "", trainingType: "Initial Silica Safety Training",
    trainingDate: new Date().toISOString().split("T")[0],
    trainer: "", notes: "", certified: false,
  });

  const { data: records = [] } = useQuery({
    queryKey: ["/api/silica"],
    queryFn: () => fetch("/api/silica", { credentials: "include" }).then(r => r.json()),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => fetch("/api/silica", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data), credentials: "include",
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/silica"] }); setShowForm(false); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/silica/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/silica"] }),
  });

  const resetForm = () => setForm({ workerName: "", trainingType: "Initial Silica Safety Training", trainingDate: new Date().toISOString().split("T")[0], trainer: "", notes: "", certified: false });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const workers = Array.from(new Set((records as any[]).map((r: any) => r.workerName)));
  const thisYear = new Date().getFullYear();
  const trainedThisYear = workers.filter(w => (records as any[]).some((r: any) => r.workerName === w && new Date(r.trainingDate).getFullYear() === thisYear));
  const dueForTraining = workers.filter(w => !trainedThisYear.includes(w));


  const printCertificate = (record: any) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Silica Safety Training Certificate</title>
    <style>
      body{margin:0;padding:40px;font-family:Arial,sans-serif;background:#fff;color:#000;}
      .cert{max-width:700px;margin:0 auto;border:8px solid #1e40af;border-radius:16px;padding:48px;text-align:center;}
      .logo{font-size:14px;font-weight:bold;color:#1e40af;letter-spacing:3px;margin-bottom:8px;}
      .title{font-size:32px;font-weight:bold;color:#1e3a8a;margin:24px 0 8px;}
      .sub{font-size:14px;color:#666;margin-bottom:32px;}
      .worker{font-size:28px;font-weight:bold;color:#000;border-bottom:2px solid #1e40af;padding-bottom:8px;margin:0 auto 8px;display:inline-block;min-width:300px;}
      .label{font-size:12px;color:#999;margin-bottom:24px;}
      .details{background:#f0f9ff;border-radius:8px;padding:16px;margin:24px 0;text-align:left;}
      .detail-row{display:flex;justify-content:space-between;padding:4px 0;font-size:13px;}
      .detail-label{color:#666;}
      .detail-value{font-weight:bold;}
      .footer{margin-top:32px;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:16px;}
      .seal{width:80px;height:80px;border-radius:50%;border:4px solid #1e40af;display:inline-flex;align-items:center;justify-content:center;margin:16px auto;font-size:10px;font-weight:bold;color:#1e40af;text-align:center;line-height:1.2;}
      @media print{body{padding:0;}}
    </style></head><body>
    <div class="cert">
      <div class="logo">STONEDESK · SAIRN TECHNOLOGIES</div>
      <div class="title">Certificate of Training</div>
      <div class="sub">Silica Safety & Hazard Communication</div>
      <div class="seal">CAL/OSHA<br>COMPLIANT</div>
      <div style="margin:24px 0;">
        <div style="font-size:14px;color:#666;margin-bottom:8px;">This certifies that</div>
        <div class="worker">${record.workerName}</div>
        <div class="label">has successfully completed the required training</div>
      </div>
      <div class="details">
        <div class="detail-row"><span class="detail-label">Training Type:</span><span class="detail-value">${record.trainingType}</span></div>
        <div class="detail-row"><span class="detail-label">Date Completed:</span><span class="detail-value">${new Date(record.trainingDate).toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'})}</span></div>
        <div class="detail-row"><span class="detail-label">Trainer:</span><span class="detail-value">${record.trainer || 'Shop Owner'}</span></div>
        <div class="detail-row"><span class="detail-label">Certification Status:</span><span class="detail-value">${record.certified ? '✓ Certified & Signed' : 'Completed'}</span></div>
      </div>
      <div class="footer">
        This certificate documents compliance with California SB 20 (STOP Act) and Cal/OSHA silica safety regulations.<br>
        Generated by StoneDesk · ${new Date().toLocaleDateString()} · Keep for your records.
      </div>
    </div>
    <script>window.onload=function(){window.print();}</script>
    </body></html>`);
    win.document.close();
  };

  const exportCSV = () => {
    const rows = (records as any[]).map((r: any) => `"${r.workerName}","${r.trainingType}","${r.trainingDate}","${r.trainer}","${r.certified ? 'Yes' : 'No'}"`);
    const csv = `"Worker Name","Training Type","Training Date","Trainer","Certified"\n${rows.join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `StoneDesk-Silica-Compliance-${thisYear}.csv`;
    a.click();
  };

  return (
    <div className="p-8 max-w-5xl">
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-zinc-700 rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Log Training Record</h2>
              <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Worker Name</label>
                <input type="text" placeholder="John Smith" value={form.workerName} onChange={e => set("workerName", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Training Type</label>
                <select value={form.trainingType} onChange={e => set("trainingType", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500">
                  {TRAINING_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Training Date</label>
                  <input type="date" value={form.trainingDate} onChange={e => set("trainingDate", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Trainer Name</label>
                  <input type="text" placeholder="Jane Doe" value={form.trainer} onChange={e => set("trainer", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Notes</label>
                <textarea rows={2} placeholder="Training details, materials used, etc." value={form.notes} onChange={e => set("notes", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 resize-none" />
              </div>
              <div className="flex items-center gap-3 bg-zinc-900 rounded-lg px-4 py-3">
                <input type="checkbox" id="certified" checked={form.certified} onChange={e => set("certified", e.target.checked)}
                  className="w-4 h-4 accent-amber-500" />
                <label htmlFor="certified" className="text-zinc-300 text-sm cursor-pointer">Worker received certification / signed acknowledgment</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-2.5 text-sm">Cancel</button>
                <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.workerName}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold rounded-lg py-2.5 text-sm">
                  {mutation.isPending ? "Saving..." : "Save Record"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Silica Compliance</h1>
          <p className="text-zinc-500 mt-1">California SB 20 STOP Act — Annual training required by July 1, 2026</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold px-4 py-2.5 rounded-lg text-sm">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2.5 rounded-lg text-sm">
            <Plus size={16} /> Log Training
          </button>
        </div>
      </div>

      <div className="bg-blue-950/20 border border-blue-800/30 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Shield size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-blue-400 font-semibold text-sm mb-1">California SB 20 (STOP Act) — Effective July 1, 2026</div>
            <p className="text-zinc-400 text-xs leading-relaxed">All fabrication shop owners must ensure workers performing high-exposure tasks (cutting, grinding, polishing engineered stone) receive annual silica safety training and sign an attestation. StoneDesk keeps all records in one place for Cal/OSHA inspections.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-white font-mono text-2xl font-bold">{workers.length}</div>
          <div className="text-zinc-500 text-sm mt-1">Total Workers</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-emerald-400 font-mono text-2xl font-bold">{trainedThisYear.length}</div>
          <div className="text-zinc-500 text-sm mt-1">Trained {thisYear}</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-red-400 font-mono text-2xl font-bold">{dueForTraining.length}</div>
          <div className="text-zinc-500 text-sm mt-1">Due for Training</div>
        </div>
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl px-5 py-4">
          <div className="text-amber-400 font-mono text-2xl font-bold">{(records as any[]).length}</div>
          <div className="text-zinc-500 text-sm mt-1">Total Records</div>
        </div>
      </div>

      {dueForTraining.length > 0 && (
        <div className="bg-red-950/20 border border-red-800/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 text-red-400 font-semibold text-sm mb-2">
            <AlertTriangle size={15} /> Workers Due for {thisYear} Training
          </div>
          <div className="flex flex-wrap gap-2">
            {dueForTraining.map(w => (
              <span key={w} className="bg-red-950/40 border border-red-800/40 text-red-300 text-xs px-3 py-1 rounded-full">{w}</span>
            ))}
          </div>
        </div>
      )}

      {(records as any[]).length === 0 ? (
        <div className="py-16 text-center">
          <Shield size={32} className="text-zinc-700 mx-auto mb-3" />
          <div className="text-zinc-500 text-sm">No training records yet</div>
          <button onClick={() => setShowForm(true)} className="text-amber-400 text-sm mt-2 hover:underline">Log your first training record</button>
        </div>
      ) : (
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Worker</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Training Type</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Date</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Trainer</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-mono text-xs uppercase">Certified</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {(records as any[]).map((record: any) => (
                <tr key={record.id} className="border-b border-zinc-800/40 hover:bg-zinc-900/20">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-zinc-800 rounded-full flex items-center justify-center">
                        <User size={12} className="text-zinc-400" />
                      </div>
                      <span className="text-zinc-200 font-medium">{record.workerName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-zinc-400 text-xs">{record.trainingType}</td>
                  <td className="px-5 py-3 text-zinc-300 font-mono text-xs">{new Date(record.trainingDate).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-zinc-400">{record.trainer || "—"}</td>
                  <td className="px-5 py-3">
                    {record.certified ? <CheckCircle size={16} className="text-emerald-400" /> : <span className="text-zinc-600 text-xs">Pending</span>}
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => printCertificate(record)} className="text-amber-400 hover:text-amber-300 text-xs font-medium transition-colors">
                      Print Cert
                    </button>
                  </td>
                  <td className="px-5 py-3">
                  <td className="px-5 py-3">
                    <button onClick={() => deleteMutation.mutate(record.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
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
