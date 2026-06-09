import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../App";
import { Building2, DollarSign, ArrowRight, Check } from "lucide-react";

const STEPS = [
  { id: 1, title: "Your Shop", icon: Building2, desc: "Tell us about your business" },
  { id: 2, title: "Labor Rate", icon: DollarSign, desc: "Set your shop hourly cost" },
];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { user, setUser } = useAuth();
  const [step, setStep] = useState(1);
  const [shopName, setShopName] = useState(user?.shopName || "");
  const [laborRate, setLaborRate] = useState("66");
  const [adminEmail, setAdminEmail] = useState(user?.email || "");

  const saveMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/settings/costs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ laborCostPerHour: parseFloat(laborRate) || 66 }),
      });
      const r = await fetch("/api/auth/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ shopName, adminEmail }),
      });
      return r.json();
    },
    onSuccess: (data) => {
      if (data.user) setUser(data.user);
      onComplete();
    },
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <span className="text-black font-bold text-lg">S</span>
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">StoneDesk</span>
          </div>
          <p className="text-zinc-500 text-sm">Let's get your shop set up in 2 minutes</p>
        </div>
        <div className="flex items-center justify-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step > s.id ? "bg-emerald-500 text-white" : step === s.id ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-500"}`}>
                {step > s.id ? <Check size={14} /> : s.id}
              </div>
              {i < STEPS.length - 1 && <div className={`w-12 h-px ${step > s.id ? "bg-emerald-500" : "bg-zinc-800"}`} />}
            </div>
          ))}
        </div>
        {step === 1 && (
          <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <Building2 size={20} className="text-amber-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Your Shop</h2>
                <p className="text-zinc-500 text-sm">This appears on all your reports and emails</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Shop Name</label>
                <input type="text" placeholder="e.g. Columbus Stone and Tile" value={shopName} onChange={e => setShopName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-base" autoFocus />
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Weekly Report Email</label>
                <input type="email" placeholder="owner@yourshop.com" value={adminEmail} onChange={e => setAdminEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-base" />
                <p className="text-zinc-600 text-xs mt-1.5">You will receive weekly AI shop reports at this address</p>
              </div>
            </div>
            <button onClick={() => setStep(2)} disabled={!shopName.trim()}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3.5 rounded-xl text-base transition-colors">
              Continue <ArrowRight size={18} />
            </button>
          </div>
        )}
        {step === 2 && (
          <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <DollarSign size={20} className="text-amber-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Labor Rate</h2>
                <p className="text-zinc-500 text-sm">Used to calculate the true cost of every issue and remake</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Shop Labor Cost Per Hour</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-lg">$</span>
                  <input type="number" placeholder="66" value={laborRate} onChange={e => setLaborRate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-8 pr-12 py-3 text-white font-mono text-base focus:outline-none focus:border-amber-500" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">/hr</span>
                </div>
                <p className="text-zinc-600 text-xs mt-1.5">Industry average is $66/hr. Include all overhead costs.</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="text-zinc-400 text-xs mb-2">At ${laborRate || 66}/hr, a 2-hour remake costs:</div>
                <div className="text-amber-400 font-mono font-bold text-2xl">${((parseFloat(laborRate) || 66) * 2).toFixed(0)} true cost</div>
                <div className="text-zinc-600 text-xs mt-1">StoneDesk tracks this automatically for every issue</div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="px-5 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-semibold transition-colors">
                Back
              </button>
              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-3.5 rounded-xl text-base transition-colors">
                {saveMutation.isPending ? "Setting up..." : <><Check size={18} /> Complete Setup</>}
              </button>
            </div>
          </div>
        )}
        <p className="text-center text-zinc-700 text-xs mt-6">StoneDesk by SAIRN Technologies</p>
      </div>
    </div>
  );
}
