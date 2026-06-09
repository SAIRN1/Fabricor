import { Link } from "wouter";
import { Zap, Brain, MapPin, FileSpreadsheet, PenTool, Mail, Calculator, CheckCircle, X, ArrowRight, Star } from "lucide-react";

const FEATURES = [
  { icon: Brain, title: "Claude AI Built In", desc: "Not a chatbot add-on — Claude is woven into every page. It analyzes your issues, writes your emails, briefs you before every job, and learns your shop over time." },
  { icon: MapPin, title: "Smart Route Optimization", desc: "Add all your installations and templates for the day. One tap reorders them for the most efficient driving route. Open in Apple Maps or Google Maps on any phone." },
  { icon: PenTool, title: "2D Layout Drawing Tool", desc: "Draw countertop shapes, place seams, mark cutouts — right in the browser. Auto-calculates square footage. Export to PNG and send to the client before you cut a single slab." },
  { icon: Mail, title: "AI Email Generator", desc: "Template confirmations, installation reminders, completion follow-ups, dispute letters — Claude writes them in seconds. You review and send. Professional every time." },
  { icon: Calculator, title: "Price Estimator", desc: "Build accurate estimates with real-time cost calculation. Add areas, edge types, cutouts, and set your margin. Copy the full estimate with one click." },
  { icon: FileSpreadsheet, title: "Excel Import", desc: "Upload your existing Moraware export or any spreadsheet. Fabricor maps the columns automatically and creates all your jobs and customers in seconds." },
];

const COMPARISON = [
  { feature: "Job Pipeline", fabricor: true, moraware: true, stonePro: true, stonify: true },
  { feature: "Customer Database", fabricor: true, moraware: true, stonePro: true, stonify: true },
  { feature: "Scheduling", fabricor: true, moraware: true, stonePro: false, stonify: true },
  { feature: "Route Optimization", fabricor: true, moraware: false, stonePro: false, stonify: false },
  { feature: "AI Intelligence", fabricor: true, moraware: false, stonePro: false, stonify: false },
  { feature: "AI Email Generator", fabricor: true, moraware: false, stonePro: false, stonify: false },
  { feature: "2D Layout Tool", fabricor: true, moraware: false, stonePro: false, stonify: false },
  { feature: "Digital Signatures", fabricor: true, moraware: false, stonePro: false, stonify: false },
  { feature: "Price Estimator", fabricor: true, moraware: false, stonePro: true, stonify: true },
  { feature: "Excel Import", fabricor: true, moraware: true, stonePro: false, stonify: false },
  { feature: "Mobile Optimized", fabricor: true, moraware: false, stonePro: false, stonify: true },
  { feature: "Weekly AI Reports", fabricor: true, moraware: false, stonePro: false, stonify: false },
  { feature: "Institutional Memory", fabricor: true, moraware: false, stonePro: false, stonify: false },
];

const PLANS = [
  { name: "Starter", price: 199, color: "border-zinc-700", btnColor: "bg-zinc-700 hover:bg-zinc-600 text-white", features: ["Dashboard & Health Score", "Issue Tracker", "Customer Database", "Job Pipeline", "Schedule & Route Planning", "Up to 2 users"] },
  { name: "Professional", price: 299, color: "border-amber-500", btnColor: "bg-amber-500 hover:bg-amber-400 text-black", popular: true, features: ["Everything in Starter", "AI Email Generator", "Price Estimator", "2D Layout Tool", "Excel Import", "Digital Signatures", "Up to 5 users"] },
  { name: "Enterprise", price: 499, color: "border-emerald-500", btnColor: "bg-emerald-500 hover:bg-emerald-400 text-black", features: ["Everything in Professional", "Unlimited users", "White label option", "Priority support", "Weekly AI reports", "Custom integrations"] },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#080810] text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#080810]/90 backdrop-blur-sm border-b border-zinc-800/60 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-black" />
            </div>
            <span className="font-bold text-lg tracking-tight">FABRICOR</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-zinc-400 hover:text-white text-sm transition-colors hidden md:block">Features</a>
            <a href="#compare" className="text-zinc-400 hover:text-white text-sm transition-colors hidden md:block">Compare</a>
            <a href="#pricing" className="text-zinc-400 hover:text-white text-sm transition-colors hidden md:block">Pricing</a>
            <Link href="/login">
              <a className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
                Start Free Trial
              </a>
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 text-amber-400 text-sm font-medium mb-8">
            <Brain size={14} />
            The only stone fabrication platform with Claude AI built in
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            Run your shop<br />
            <span className="text-amber-400">smarter than ever.</span>
          </h1>
          <p className="text-zinc-400 text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            Fabricor replaces Moraware, Stone Profit System, Stonify, and your spreadsheets with one AI-powered platform built for stone fabrication shops.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <a className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-4 rounded-xl text-lg transition-colors">
                Start Free Trial <ArrowRight size={20} />
              </a>
            </Link>
            <a href="#features" className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors">
              See Features
            </a>
          </div>
          <p className="text-zinc-600 text-sm mt-4">14-day free trial · No credit card required · Cancel anytime</p>
        </div>
      </section>

      <section className="py-16 px-6 border-y border-zinc-800/60">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "$316/hr", label: "True cost of a remake" },
            { value: "2,600+", label: "Shops using Moraware" },
            { value: "0", label: "Competitors with real AI" },
            { value: "14 days", label: "Free trial, no card" },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-3xl font-bold text-amber-400 font-mono">{value}</div>
              <div className="text-zinc-500 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything your shop needs</h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">Built by people who understand stone fabrication. Every feature solves a real problem.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-[#0d0d14] border border-zinc-800/60 rounded-2xl p-6 hover:border-amber-500/30 transition-colors">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 w-fit mb-4">
                  <Icon size={20} className="text-amber-400" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-r from-amber-950/20 to-zinc-900/20 border-y border-amber-800/20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 w-fit mx-auto mb-6">
            <Brain size={32} className="text-amber-400" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Institutional Memory</h2>
          <p className="text-zinc-300 text-xl leading-relaxed max-w-2xl mx-auto mb-8">
            Fabricor remembers every job, every complaint, every praise, every employee — forever. Before your crew starts a high-value builder job, Claude briefs them: what went wrong last time, which templator caused issues, what the client is sensitive about.
          </p>
          <p className="text-zinc-500 text-lg">No more institutional knowledge walking out the door when an employee leaves.</p>
        </div>
      </section>

      <section id="compare" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">How we compare</h2>
            <p className="text-zinc-400 text-lg">See why shops are switching from Moraware, Stone Profit System, and Stonify to Fabricor</p>
          </div>
          <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-5 gap-0 border-b border-zinc-800 px-6 py-4">
              <div className="text-zinc-500 text-sm font-mono uppercase">Feature</div>
              <div className="text-amber-400 font-bold text-center text-sm">Fabricor</div>
              <div className="text-zinc-400 font-semibold text-center text-sm">Moraware</div>
              <div className="text-zinc-400 font-semibold text-center text-sm">Stone Profit</div>
              <div className="text-zinc-400 font-semibold text-center text-sm">Stonify</div>
            </div>
            {COMPARISON.map(({ feature, fabricor, moraware, stonePro, stonify }) => (
              <div key={feature} className="grid grid-cols-5 gap-0 border-b border-zinc-800/40 px-6 py-3 hover:bg-zinc-900/20">
                <div className="text-zinc-300 text-sm">{feature}</div>
                <div className="flex justify-center">{fabricor ? <CheckCircle size={18} className="text-emerald-400" /> : <X size={18} className="text-zinc-700" />}</div>
                <div className="flex justify-center">{moraware ? <CheckCircle size={18} className="text-zinc-500" /> : <X size={18} className="text-zinc-700" />}</div>
                <div className="flex justify-center">{stonePro ? <CheckCircle size={18} className="text-zinc-500" /> : <X size={18} className="text-zinc-700" />}</div>
                <div className="flex justify-center">{stonify ? <CheckCircle size={18} className="text-zinc-500" /> : <X size={18} className="text-zinc-700" />}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-zinc-400 text-lg">Replace $400/mo Moraware with a smarter platform for less</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div key={plan.name} className={`relative bg-[#0d0d14] border-2 ${plan.color} rounded-2xl p-6`}>
                {(plan as any).popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <div className="mb-4">
                  <div className="text-white font-bold text-xl mb-1">{plan.name}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold font-mono">${plan.price}</span>
                    <span className="text-zinc-500">/mo</span>
                  </div>
                </div>
                <div className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                      <CheckCircle size={13} className="text-amber-400 flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <Link href="/login">
                  <a className={`w-full block text-center py-3 rounded-xl font-bold text-sm transition-colors ${plan.btnColor}`}>
                    Start Free Trial
                  </a>
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-zinc-600 text-sm mt-6">14-day free trial · No credit card required · Cancel anytime</p>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-zinc-800/60">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center gap-1 mb-6">
            {[1,2,3,4,5].map(i => <Star key={i} size={20} className="text-amber-400 fill-amber-400" />)}
          </div>
          <blockquote className="text-2xl font-medium text-zinc-200 leading-relaxed mb-6">
            "Fabricor flagged that one of our biggest builder accounts had recurring issues in the primary bath on their last two jobs. We caught it before the third install. That's $316/hr saved before we even walked in the door."
          </blockquote>
          <div className="text-zinc-500">Stone Fabrication Shop Owner · Ohio</div>
        </div>
      </section>

      <section className="py-20 px-6 bg-amber-500/5 border-t border-amber-500/10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to know your shop better?</h2>
          <p className="text-zinc-400 text-lg mb-8">Join the shops replacing Moraware, Stone Profit System, and Stonify with Fabricor. 14-day free trial, no card required.</p>
          <Link href="/login">
            <a className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-4 rounded-xl text-lg transition-colors">
              Start Free Trial <ArrowRight size={20} />
            </a>
          </Link>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-zinc-800/60">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-500 rounded flex items-center justify-center">
              <Zap size={12} className="text-black" />
            </div>
            <span className="font-bold text-sm">FABRICOR</span>
            <span className="text-zinc-600 text-sm">by SAIRN Technologies</span>
          </div>
          <div className="flex gap-6 text-zinc-600 text-sm">
            <a href="mailto:hello@sairn.com" className="hover:text-zinc-400 transition-colors">hello@sairn.com</a>
            <Link href="/login"><a className="hover:text-zinc-400 transition-colors">Login</a></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}