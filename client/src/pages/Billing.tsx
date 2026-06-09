import { useState } from "react";
import { useAuth } from "../App";
import { Check, Zap, Star, Building2 } from "lucide-react";

const PLANS = [
  {
    key: "starter",
    name: "Starter",
    price: 199,
    priceId: "price_starter",
    icon: Zap,
    color: "border-zinc-700",
    headerColor: "bg-zinc-800",
    features: [
      "Dashboard & Shop Health Score",
      "Issue Tracker with cost accounting",
      "Customer Database",
      "Job Pipeline (9 stages)",
      "Schedule & Route Planning",
      "Resources & Sales Analytics",
      "Price Book",
      "Up to 2 users",
    ],
    notIncluded: ["AI Email Generator", "Price Estimator", "2D Layout Tool", "Excel Import"],
  },
  {
    key: "professional",
    name: "Professional",
    price: 299,
    priceId: "price_professional",
    icon: Star,
    color: "border-amber-500",
    headerColor: "bg-amber-500/10",
    popular: true,
    features: [
      "Everything in Starter",
      "AI Email Generator",
      "Price Estimator with margins",
      "2D Layout Drawing Tool",
      "Excel & CSV Import",
      "Digital Signature Capture",
      "Route Optimization",
      "Up to 5 users",
    ],
    notIncluded: ["White label", "Priority support"],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: 499,
    priceId: "price_enterprise",
    icon: Building2,
    color: "border-emerald-500",
    headerColor: "bg-emerald-500/10",
    features: [
      "Everything in Professional",
      "Unlimited users",
      "White label option",
      "Priority support",
      "Custom onboarding",
      "Weekly AI email reports",
      "API access",
      "Custom integrations",
    ],
    notIncluded: [],
  },
];

export default function Billing() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const subscribe = async (plan: typeof PLANS[0]) => {
    setLoading(plan.key);
    try {
      const r = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan: plan.key, priceId: plan.priceId }),
      });
      const data = await r.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Could not create checkout session. Please try again.");
      }
    } catch (e) {
      alert("Billing error. Please try again.");
    }
    setLoading(null);
  };

  const manage = async () => {
    try {
      const r = await fetch("/api/billing/portal", {
        method: "POST",
        credentials: "include",
      });
      const data = await r.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      alert("Could not open billing portal.");
    }
  };

  return (
    <div className="p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-3">Simple, Transparent Pricing</h1>
        <p className="text-zinc-400 text-lg max-w-xl mx-auto">
          Replace Moraware, Stone Profit System, and your spreadsheets — with one AI-powered platform.
        </p>
        {user?.plan && user.plan !== "starter" && (
          <div className="mt-4">
            <span className="text-zinc-400 text-sm">Current plan: </span>
            <span className="text-amber-400 font-semibold capitalize">{user.plan}</span>
            <button onClick={manage} className="ml-3 text-zinc-500 hover:text-zinc-300 text-sm underline">
              Manage subscription
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PLANS.map(plan => {
          const Icon = plan.icon;
          const isCurrent = user?.plan === plan.key;
          return (
            <div key={plan.key} className={`relative bg-[#0d0d14] border-2 ${plan.color} rounded-2xl overflow-hidden`}>
              {plan.popular && (
                <div className="absolute top-4 right-4 bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}
              <div className={`${plan.headerColor} px-6 py-6 border-b border-zinc-800`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-zinc-900/50">
                    <Icon size={18} className={plan.key === "professional" ? "text-amber-400" : plan.key === "enterprise" ? "text-emerald-400" : "text-zinc-400"} />
                  </div>
                  <span className="text-white font-bold text-lg">{plan.name}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white font-mono">${plan.price}</span>
                  <span className="text-zinc-500">/month</span>
                </div>
                <p className="text-zinc-500 text-xs mt-1">Billed monthly · Cancel anytime</p>
              </div>

              <div className="px-6 py-5">
                <div className="space-y-2.5 mb-6">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-start gap-2.5">
                      <Check size={14} className={`flex-shrink-0 mt-0.5 ${plan.key === "professional" ? "text-amber-400" : plan.key === "enterprise" ? "text-emerald-400" : "text-zinc-400"}`} />
                      <span className="text-zinc-300 text-sm">{f}</span>
                    </div>
                  ))}
                  {plan.notIncluded.map(f => (
                    <div key={f} className="flex items-start gap-2.5 opacity-40">
                      <div className="w-3.5 h-px bg-zinc-600 flex-shrink-0 mt-2" />
                      <span className="text-zinc-500 text-sm">{f}</span>
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  <div className="w-full py-3 rounded-xl text-center text-sm font-semibold bg-zinc-800 text-zinc-400">
                    Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => subscribe(plan)}
                    disabled={loading === plan.key}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${
                      plan.key === "professional"
                        ? "bg-amber-500 hover:bg-amber-400 text-black"
                        : plan.key === "enterprise"
                        ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                        : "bg-zinc-700 hover:bg-zinc-600 text-white"
                    } disabled:opacity-50`}
                  >
                    {loading === plan.key ? "Loading..." : `Get ${plan.name}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <p className="text-zinc-500 text-sm">
          All plans include a 14-day free trial · No credit card required to start
        </p>
        <p className="text-zinc-600 text-xs mt-2">
          Questions? Email us at hello@sairntechnologies.com
        </p>
      </div>
    </div>
  );
}
