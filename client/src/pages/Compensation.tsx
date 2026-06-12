import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../App";
import { DollarSign, TrendingUp, CheckCircle, AlertTriangle, Clock,
  ChevronDown, ChevronUp, Plus, X, Eye, EyeOff, FileText, Award } from "lucide-react";

const fmt = (n: number) => n != null ? `$${(n||0).toLocaleString("en-US", {minimumFractionDigits:2,maximumFractionDigits:2})}` : "—";
const fmtPct = (n: number) => `${((n||0)*100).toFixed(2)}%`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "—";

const STATUS_COLORS: Record<string,string> = {
  pending:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  disputed: "bg-red-500/10 text-red-400 border-red-500/20",
  paid:     "bg-blue-500/10 text-blue-400 border-blue-500/20",
};
const STATUS_ICONS: Record<string,any> = {
  pending: Clock, approved: CheckCircle, disputed: AlertTriangle, paid: DollarSign
};

function canManage(role: string) { return ["owner","admin"].includes(role); }
function canViewAll(role: string) { return ["owner","admin","manager"].includes(role); }

// ── PAY STRUCTURE BADGE ──────────────────────────────────────
function CompTypeBadge({ type }: { type: string }) {
  const styles: Record<string,string> = {
    salary:     "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    commission: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    hybrid:     "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  };
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${styles[type]||styles.commission}`}>{type}</span>;
}

// ── PLAN SETUP MODAL ─────────────────────────────────────────
function PlanModal({ teamMembers, onClose, onSave }: any) {
  const [form, setForm] = useState({
    targetUserId: "", repName: "", compType: "commission",
    baseSalary: "", commissionRate: "", drawAmount: "",
    tier1Rate: "", tier1Threshold: "",
    tier2Rate: "", tier2Threshold: "",
    bonusQuota: "", bonusAmount: "",
    notes: "", endOldPlan: true,
  });

  const set = (k: string, v: any) => setForm(f => ({...f, [k]: v}));

  const handleSave = () => {
    const tiers = [];
    if (form.tier1Rate) tiers.push({ threshold: 0, rate: parseFloat(form.tier1Rate)/100 });
    if (form.tier2Rate && form.tier2Threshold) tiers.push({ threshold: parseFloat(form.tier2Threshold), rate: parseFloat(form.tier2Rate)/100 });
    const bonus = form.bonusQuota && form.bonusAmount
      ? { quota: parseFloat(form.bonusQuota), bonusAmount: parseFloat(form.bonusAmount) } : null;
    onSave({
      targetUserId: form.targetUserId,
      repName: form.repName,
      compType: form.compType,
      baseSalary: parseFloat(form.baseSalary)||0,
      commissionRate: parseFloat(form.commissionRate)/100||0,
      commissionTiers: tiers.length ? tiers : null,
      bonusStructure: bonus,
      drawAmount: parseFloat(form.drawAmount)||0,
      notes: form.notes,
      endOldPlan: form.endOldPlan,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d0d14] border border-zinc-700 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-lg">Set Pay Structure</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300"><X size={18}/></button>
        </div>

        <div className="space-y-4">
          {/* Rep selector */}
          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Sales Rep</label>
            <select value={form.targetUserId}
              onChange={e => {
                const m = teamMembers.find((t:any)=>t.id===e.target.value);
                set("targetUserId", e.target.value);
                if(m) set("repName", m.name);
              }}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm">
              <option value="">Select rep...</option>
              {teamMembers.filter((m:any)=>["sales","admin","manager","owner"].includes(m.role)).map((m:any)=>(
                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
              ))}
            </select>
          </div>

          {/* Comp type */}
          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Compensation Type</label>
            <div className="grid grid-cols-3 gap-2">
              {["salary","commission","hybrid"].map(t=>(
                <button key={t} onClick={()=>set("compType",t)}
                  className={`py-2 rounded-lg text-sm font-semibold capitalize border transition-all ${
                    form.compType===t ? "bg-amber-500 text-black border-amber-500" : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500"
                  }`}>{t}</button>
              ))}
            </div>
          </div>

          {/* Salary (if salary or hybrid) */}
          {(form.compType==="salary"||form.compType==="hybrid") && (
            <div>
              <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Annual Base Salary ($)</label>
              <input type="number" placeholder="e.g. 48000" value={form.baseSalary}
                onChange={e=>set("baseSalary",e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"/>
            </div>
          )}

          {/* Commission (if commission or hybrid) */}
          {(form.compType==="commission"||form.compType==="hybrid") && (
            <>
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
                <div className="text-zinc-300 text-xs font-bold uppercase tracking-wider mb-2">Commission Tiers</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-500 text-xs mb-1 block">Tier 1 Rate (% of revenue)</label>
                    <input type="number" step="0.1" placeholder="e.g. 3.0" value={form.tier1Rate}
                      onChange={e=>set("tier1Rate",e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"/>
                    <div className="text-zinc-600 text-xs mt-1">From $0</div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-xs mb-1 block">Tier 2 Rate (% of revenue)</label>
                    <input type="number" step="0.1" placeholder="e.g. 4.0" value={form.tier2Rate}
                      onChange={e=>set("tier2Rate",e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"/>
                    <input type="number" placeholder="Above $ threshold" value={form.tier2Threshold}
                      onChange={e=>set("tier2Threshold",e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm mt-1.5"/>
                  </div>
                </div>
                <div>
                  <label className="text-zinc-500 text-xs mb-1 block">Or flat commission rate (%)</label>
                  <input type="number" step="0.1" placeholder="e.g. 3.5 (overrides tiers if set)" value={form.commissionRate}
                    onChange={e=>set("commissionRate",e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"/>
                </div>
              </div>

              {/* Draw */}
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Monthly Draw Against Commission ($)</label>
                <input type="number" placeholder="0 if no draw" value={form.drawAmount}
                  onChange={e=>set("drawAmount",e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"/>
                <div className="text-zinc-600 text-xs mt-1">Draw is advanced monthly and deducted from commission earnings</div>
              </div>
            </>
          )}

          {/* Bonus */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="text-zinc-300 text-xs font-bold uppercase tracking-wider mb-2">Bonus Structure (optional)</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-500 text-xs mb-1 block">Monthly Revenue Quota ($)</label>
                <input type="number" placeholder="e.g. 80000" value={form.bonusQuota}
                  onChange={e=>set("bonusQuota",e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"/>
              </div>
              <div>
                <label className="text-zinc-500 text-xs mb-1 block">Bonus Amount if Hit ($)</label>
                <input type="number" placeholder="e.g. 500" value={form.bonusAmount}
                  onChange={e=>set("bonusAmount",e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"/>
              </div>
            </div>
          </div>

          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Internal Notes</label>
            <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} rows={2}
              placeholder="Any notes about this pay structure..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm resize-none"/>
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
            <input type="checkbox" checked={form.endOldPlan}
              onChange={e=>set("endOldPlan",e.target.checked)}
              className="rounded"/>
            End and replace any existing active plan for this rep
          </label>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-sm font-semibold hover:bg-zinc-700">Cancel</button>
          <button onClick={handleSave} disabled={!form.targetUserId}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-bold hover:bg-amber-400 disabled:opacity-40">
            Save Pay Structure
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PAY PERIOD DETAIL ────────────────────────────────────────
function PeriodDetail({ period, lineItems, role, onAction }: any) {
  const [showLines, setShowLines] = useState(false);
  const [disputeNote, setDisputeNote] = useState("");
  const [resolution, setResolution] = useState("");
  const [adjustment, setAdjustment] = useState("");
  const [adjNote, setAdjNote] = useState("");
  const [disputing, setDisputing] = useState(false);
  const [resolving, setResolving] = useState(false);

  const StatusIcon = STATUS_ICONS[period.status] || Clock;

  return (
    <div className="bg-[#111118] border border-zinc-800 rounded-xl p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-white font-bold">{period.periodLabel}</div>
          <div className="text-zinc-500 text-xs mt-0.5">{period.repName} · {period.jobCount} jobs · {fmt(period.totalRevenue)} revenue</div>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${STATUS_COLORS[period.status]||STATUS_COLORS.pending}`}>
          <StatusIcon size={11}/> {period.status.charAt(0).toUpperCase()+period.status.slice(1)}
        </span>
      </div>

      {/* Pay breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {label:"Base Pay",    val:period.basePay,       show: period.basePay > 0},
          {label:"Commission",  val:period.commissionEarned, show: true},
          {label:"Bonus",       val:period.bonusEarned,   show: period.bonusEarned > 0},
          {label:"Draw Balance",val:-(period.drawBalance||0), show: period.drawBalance > 0, neg:true},
          {label:"Adjustments", val:period.adjustments,   show: period.adjustments !== 0},
        ].filter(i=>i.show).map(item=>(
          <div key={item.label} className="bg-zinc-900/60 rounded-lg p-3">
            <div className="text-zinc-500 text-xs">{item.label}</div>
            <div className={`font-bold text-sm mt-1 ${item.neg?"text-red-400":"text-white"}`}>{fmt(Math.abs(item.val||0))}</div>
          </div>
        ))}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <div className="text-amber-400/70 text-xs">Gross Pay</div>
          <div className="font-bold text-lg text-amber-400 mt-1">{fmt(period.grossPay)}</div>
        </div>
      </div>

      {/* Adjustment note */}
      {period.adjustmentNotes && (
        <div className="text-xs text-zinc-500 bg-zinc-900 rounded-lg px-3 py-2">
          <span className="font-semibold text-zinc-400">Adjustment note:</span> {period.adjustmentNotes}
        </div>
      )}

      {/* Dispute info */}
      {period.disputeNote && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-lg px-3 py-2 text-xs">
          <div className="text-red-400 font-semibold mb-1">Dispute: {period.disputeNote}</div>
          {period.disputeResolution && <div className="text-zinc-400">Resolution: {period.disputeResolution}</div>}
        </div>
      )}

      {/* Line items toggle */}
      <button onClick={()=>setShowLines(s=>!s)}
        className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
        {showLines ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
        {lineItems?.length||0} commission line items
      </button>
      {showLines && lineItems?.length > 0 && (
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead><tr className="bg-zinc-900 text-zinc-500">
              <th className="text-left px-3 py-2 font-semibold">Job</th>
              <th className="text-left px-3 py-2 font-semibold">Customer</th>
              <th className="text-right px-3 py-2 font-semibold">Revenue</th>
              <th className="text-right px-3 py-2 font-semibold">Rate</th>
              <th className="text-right px-3 py-2 font-semibold">Commission</th>
            </tr></thead>
            <tbody>
              {lineItems.map((li: any) => (
                <tr key={li.id} className="border-t border-zinc-800">
                  <td className="px-3 py-2 text-zinc-300 font-mono">{li.jobNumber || "—"}</td>
                  <td className="px-3 py-2 text-zinc-400">{li.customerName || li.jobName || "—"}</td>
                  <td className="px-3 py-2 text-right text-zinc-300">{fmt(li.revenueAmount)}</td>
                  <td className="px-3 py-2 text-right text-zinc-500">{fmtPct(li.commissionRate)}</td>
                  <td className="px-3 py-2 text-right text-emerald-400 font-semibold">{fmt(li.commissionAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rep actions — pending or disputed */}
      {period.status === "pending" && (
        <div className="flex gap-2 pt-2 border-t border-zinc-800">
          <button onClick={()=>onAction(period.id,"approve")}
            className="flex-1 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2">
            <CheckCircle size={14}/> Approve
          </button>
          <button onClick={()=>setDisputing(true)}
            className="flex-1 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2">
            <AlertTriangle size={14}/> Dispute
          </button>
        </div>
      )}

      {/* Dispute input */}
      {disputing && (
        <div className="space-y-2 pt-2 border-t border-zinc-800">
          <textarea value={disputeNote} onChange={e=>setDisputeNote(e.target.value)} rows={2}
            placeholder="Describe your dispute (which jobs, which amounts, what's incorrect)..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm resize-none"/>
          <div className="flex gap-2">
            <button onClick={()=>{onAction(period.id,"dispute",{disputeNote});setDisputing(false);}}
              className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600">Submit Dispute</button>
            <button onClick={()=>setDisputing(false)} className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Admin actions */}
      {canManage(role) && period.status === "disputed" && (
        <div className="space-y-2 pt-2 border-t border-zinc-800">
          {!resolving ? (
            <button onClick={()=>setResolving(true)}
              className="w-full py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold hover:bg-amber-500/20">
              Resolve Dispute
            </button>
          ) : (
            <div className="space-y-2">
              <textarea value={resolution} onChange={e=>setResolution(e.target.value)} rows={2}
                placeholder="Resolution notes..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm resize-none"/>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={adjustment} onChange={e=>setAdjustment(e.target.value)}
                  placeholder="Adjustment $ (+ or -)"
                  className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"/>
                <input value={adjNote} onChange={e=>setAdjNote(e.target.value)}
                  placeholder="Adjustment reason"
                  className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"/>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>{onAction(period.id,"resolve",{disputeResolution:resolution,adjustments:parseFloat(adjustment)||0,adjustmentNotes:adjNote});setResolving(false);}}
                  className="flex-1 py-2 rounded-lg bg-amber-500 text-black text-sm font-bold hover:bg-amber-400">Resolve & Approve</button>
                <button onClick={()=>setResolving(false)} className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin mark paid */}
      {canManage(role) && period.status === "approved" && (
        <div className="pt-2 border-t border-zinc-800">
          <button onClick={()=>onAction(period.id,"paid")}
            className="w-full py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold hover:bg-blue-500/20 flex items-center justify-center gap-2">
            <DollarSign size={14}/> Mark as Paid
          </button>
        </div>
      )}

      {period.paidAt && (
        <div className="text-xs text-blue-400/60 text-center">Paid {fmtDate(period.paidAt)}</div>
      )}
    </div>
  );
}

// ── MAIN COMPENSATION PAGE ───────────────────────────────────
export default function Compensation() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const role = user?.role || "viewer";
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedRep, setSelectedRep] = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState<"overview"|"periods"|"plans">("overview");

  // Access gate — only owner, admin, manager, or sales can see this page
  if (!["owner","admin","manager","sales"].includes(role)) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <div className="text-center">
          <EyeOff size={32} className="text-zinc-600 mx-auto mb-3"/>
          <div className="text-zinc-400 font-semibold">Access Restricted</div>
          <div className="text-zinc-600 text-sm mt-1">Compensation data is not available for your role.</div>
        </div>
      </div>
    );
  }

  const { data: summary = [] } = useQuery({
    queryKey: ["/api/compensation/summary"],
    queryFn: () => fetch("/api/compensation/summary", { credentials:"include" }).then(r=>r.json()),
  });

  const { data: periods = [] } = useQuery({
    queryKey: ["/api/compensation/periods", selectedRep],
    queryFn: () => {
      const url = selectedRep ? `/api/compensation/periods?userId=${selectedRep}` : "/api/compensation/periods";
      return fetch(url, { credentials:"include" }).then(r=>r.json());
    },
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["/api/compensation/plans"],
    queryFn: () => fetch("/api/compensation/plans", { credentials:"include" }).then(r=>r.json()),
    enabled: ["owner","admin"].includes(role),
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["/api/team"],
    queryFn: () => fetch("/api/team", { credentials:"include" }).then(r=>r.json()),
    enabled: canManage(role),
  });

  const { data: lineItems = [] } = useQuery({
    queryKey: ["/api/compensation/lineitems"],
    queryFn: () => fetch("/api/compensation/lineitems", { credentials:"include" }).then(r=>r.json()),
  });

  const actionMutation = useMutation({
    mutationFn: ({id, action, extra}: any) => fetch(`/api/compensation/periods/${id}`, {
      method:"PATCH", headers:{"Content-Type":"application/json"}, credentials:"include",
      body: JSON.stringify({ action, ...extra }),
    }).then(r=>r.json()),
    onSuccess: () => { qc.invalidateQueries({queryKey:["/api/compensation/periods"]}); qc.invalidateQueries({queryKey:["/api/compensation/summary"]}); },
  });

  const planMutation = useMutation({
    mutationFn: (data: any) => fetch("/api/compensation/plans", {
      method:"POST", headers:{"Content-Type":"application/json"}, credentials:"include",
      body: JSON.stringify(data),
    }).then(r=>r.json()),
    onSuccess: () => { qc.invalidateQueries({queryKey:["/api/compensation/plans"]}); setShowPlanModal(false); },
  });

  const handleAction = (id: string, action: string, extra?: any) => {
    actionMutation.mutate({ id, action, extra: extra||{} });
  };

  // YTD totals
  const ytdGross = (summary as any[]).reduce((s:number,r:any)=>s+(r.ytdGross||0),0);
  const ytdComm  = (summary as any[]).reduce((s:number,r:any)=>s+(r.ytdCommission||0),0);
  const pending  = (periods as any[]).filter((p:any)=>p.status==="pending").length;
  const disputed = (periods as any[]).filter((p:any)=>p.status==="disputed").length;

  const displayPeriods = canViewAll(role)
    ? (selectedRep ? (periods as any[]).filter((p:any)=>p.userId===selectedRep) : periods as any[])
    : periods as any[];

  return (
    <div className="p-8 max-w-5xl space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white font-bold text-2xl">
            {canViewAll(role) ? "Compensation Management" : "My Compensation"}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            {canViewAll(role)
              ? "Pay structures, period approvals, and dispute resolution — visible to management and ownership only."
              : "Your pay structure, earnings history, and period approvals."}
          </p>
          {/* Confidentiality notice */}
          <div className="mt-2 flex items-center gap-2 text-xs text-amber-400/70">
            <Eye size={12}/>
            <span>Compensation data is confidential — visible only to you, HR, and ownership.</span>
          </div>
        </div>
        {canManage(role) && (
          <button onClick={()=>setShowPlanModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-black rounded-xl text-sm font-bold hover:bg-amber-400 transition-colors">
            <Plus size={16}/> Set Pay Structure
          </button>
        )}
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {canViewAll(role) && <>
          <div className="bg-[#111118] border border-zinc-800 rounded-xl p-4">
            <div className="text-zinc-500 text-xs uppercase tracking-wider">YTD Payroll</div>
            <div className="text-white font-bold text-xl mt-1">{fmt(ytdGross)}</div>
            <div className="text-zinc-600 text-xs mt-0.5">{(summary as any[]).length} reps</div>
          </div>
          <div className="bg-[#111118] border border-zinc-800 rounded-xl p-4">
            <div className="text-zinc-500 text-xs uppercase tracking-wider">YTD Commission</div>
            <div className="text-amber-400 font-bold text-xl mt-1">{fmt(ytdComm)}</div>
          </div>
        </>}
        <div className={`bg-[#111118] border rounded-xl p-4 ${pending>0?"border-amber-500/30":"border-zinc-800"}`}>
          <div className="text-zinc-500 text-xs uppercase tracking-wider">Pending Approval</div>
          <div className={`font-bold text-xl mt-1 ${pending>0?"text-amber-400":"text-white"}`}>{pending}</div>
          <div className="text-zinc-600 text-xs mt-0.5">periods awaiting sign-off</div>
        </div>
        <div className={`bg-[#111118] border rounded-xl p-4 ${disputed>0?"border-red-500/30":"border-zinc-800"}`}>
          <div className="text-zinc-500 text-xs uppercase tracking-wider">Disputed</div>
          <div className={`font-bold text-xl mt-1 ${disputed>0?"text-red-400":"text-white"}`}>{disputed}</div>
          <div className="text-zinc-600 text-xs mt-0.5">pending resolution</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900/60 rounded-xl p-1 w-fit">
        {(["overview","periods",canManage(role)?"plans":null] as any[]).filter(Boolean).map((tab:string)=>(
          <button key={tab} onClick={()=>setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
              activeTab===tab ? "bg-amber-500 text-black" : "text-zinc-400 hover:text-zinc-200"
            }`}>{tab}</button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab==="overview" && (
        <div className="space-y-4">
          {(summary as any[]).length === 0 ? (
            <div className="bg-[#111118] border border-zinc-800 rounded-xl p-12 text-center">
              <Award size={36} className="text-zinc-700 mx-auto mb-3"/>
              <div className="text-zinc-400 font-semibold">No compensation data yet</div>
              <div className="text-zinc-600 text-sm mt-1">
                {canManage(role) ? "Set up pay structures for your sales team to get started." : "Your manager will set up your compensation plan."}
              </div>
            </div>
          ) : (summary as any[]).map((rep: any)=>(
            <div key={rep.userId}
              onClick={()=>canViewAll(role)?setSelectedRep(rep.userId===selectedRep?null:rep.userId):null}
              className={`bg-[#111118] border rounded-xl p-5 transition-all ${
                canViewAll(role)?"cursor-pointer hover:border-zinc-600":"cursor-default"
              } ${selectedRep===rep.userId?"border-amber-500/40":"border-zinc-800"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-400 font-bold text-sm">
                    {rep.repName.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{rep.repName}</div>
                    <div className="text-zinc-500 text-xs">
                      {rep.pendingPeriods>0 && <span className="text-amber-400 mr-2">{rep.pendingPeriods} pending</span>}
                      {rep.disputedPeriods>0 && <span className="text-red-400 mr-2">{rep.disputedPeriods} disputed</span>}
                      {rep.periods} total periods
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 text-right">
                  <div><div className="text-zinc-500 text-xs">YTD Base</div><div className="text-white font-semibold text-sm">{fmt(rep.ytdBase)}</div></div>
                  <div><div className="text-zinc-500 text-xs">YTD Commission</div><div className="text-amber-400 font-semibold text-sm">{fmt(rep.ytdCommission)}</div></div>
                  <div><div className="text-zinc-500 text-xs">YTD Gross</div><div className="text-white font-bold text-lg">{fmt(rep.ytdGross)}</div></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PAY PERIODS TAB ── */}
      {activeTab==="periods" && (
        <div className="space-y-4">
          {canViewAll(role) && (summary as any[]).length > 1 && (
            <div className="flex gap-2 flex-wrap">
              <button onClick={()=>setSelectedRep(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${!selectedRep?"bg-amber-500 text-black":"bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
                All Reps
              </button>
              {(summary as any[]).map((r:any)=>(
                <button key={r.userId} onClick={()=>setSelectedRep(r.userId===selectedRep?null:r.userId)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedRep===r.userId?"bg-amber-500 text-black":"bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
                  {r.repName}
                </button>
              ))}
            </div>
          )}

          {displayPeriods.length === 0 ? (
            <div className="bg-[#111118] border border-zinc-800 rounded-xl p-12 text-center">
              <FileText size={36} className="text-zinc-700 mx-auto mb-3"/>
              <div className="text-zinc-400 font-semibold">No pay periods yet</div>
              <div className="text-zinc-600 text-sm mt-1">Pay periods will appear here once management creates them.</div>
            </div>
          ) : displayPeriods.map((period: any)=>(
            <PeriodDetail key={period.id} period={period} role={role}
              lineItems={(lineItems as any[]).filter((li:any)=>li.payPeriodId===period.id)}
              onAction={handleAction}/>
          ))}
        </div>
      )}

      {/* ── PLANS TAB (owner/admin only) ── */}
      {activeTab==="plans" && canManage(role) && (
        <div className="space-y-4">
          {(plans as any[]).length === 0 ? (
            <div className="bg-[#111118] border border-zinc-800 rounded-xl p-12 text-center">
              <TrendingUp size={36} className="text-zinc-700 mx-auto mb-3"/>
              <div className="text-zinc-400 font-semibold">No pay structures configured</div>
              <div className="text-zinc-600 text-sm mt-1">Click "Set Pay Structure" to configure compensation for your sales team.</div>
            </div>
          ) : (plans as any[]).map((plan: any)=>(
            <div key={plan.id} className="bg-[#111118] border border-zinc-800 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-white font-bold">{plan.repName}</div>
                    <CompTypeBadge type={plan.compType}/>
                    {!plan.endDate && <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Active</span>}
                  </div>
                  <div className="text-zinc-500 text-xs mt-1">Effective {fmtDate(plan.effectiveDate)}</div>
                </div>
                <div className="grid grid-cols-3 gap-6 text-right text-sm">
                  {plan.baseSalary > 0 && (
                    <div><div className="text-zinc-500 text-xs">Annual Base</div><div className="text-white font-semibold">{fmt(plan.baseSalary)}</div></div>
                  )}
                  {plan.commissionRate > 0 && (
                    <div><div className="text-zinc-500 text-xs">Commission Rate</div><div className="text-amber-400 font-semibold">{fmtPct(plan.commissionRate)}</div></div>
                  )}
                  {plan.drawAmount > 0 && (
                    <div><div className="text-zinc-500 text-xs">Monthly Draw</div><div className="text-blue-400 font-semibold">{fmt(plan.drawAmount)}</div></div>
                  )}
                </div>
              </div>
              {plan.commissionTiers && (()=>{
                try {
                  const tiers = JSON.parse(plan.commissionTiers);
                  return (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {tiers.map((t:any, i:number)=>(
                        <span key={i} className="text-xs bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-lg text-zinc-400">
                          {i===0?"$0+":fmt(t.threshold)+"+"} → {fmtPct(t.rate)}
                        </span>
                      ))}
                    </div>
                  );
                } catch { return null; }
              })()}
              {plan.bonusStructure && (()=>{
                try {
                  const b = JSON.parse(plan.bonusStructure);
                  return <div className="mt-2 text-xs text-purple-400">Bonus: {fmt(b.bonusAmount)} if monthly quota {fmt(b.quota)} hit</div>;
                } catch { return null; }
              })()}
              {plan.notes && <div className="mt-2 text-xs text-zinc-600 italic">{plan.notes}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Plan modal */}
      {showPlanModal && (
        <PlanModal
          teamMembers={teamMembers}
          onClose={()=>setShowPlanModal(false)}
          onSave={(data:any)=>planMutation.mutate(data)}
        />
      )}
    </div>
  );
}
