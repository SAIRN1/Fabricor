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
  { name: "Starter", price: 199, color: "border-gray-200", btnColor: "bg-gray-900 hover:bg-gray-700 text-white", features: ["Dashboard & Health Score", "Issue Tracker", "Customer Database", "Job Pipeline", "Schedule & Route Planning", "Up to 2 users"] },
  { name: "Professional", price: 299, color: "border-amber-400", btnColor: "bg-amber-500 hover:bg-amber-400 text-black", popular: true, features: ["Everything in Starter", "AI Email Generator", "Price Estimator", "2D Layout Tool", "Excel Import", "Digital Signatures", "Up to 5 users"] },
  { name: "Enterprise", price: 499, color: "border-emerald-400", btnColor: "bg-emerald-500 hover:bg-emerald-400 text-white", features: ["Everything in Professional", "Unlimited users", "White label option", "Priority support", "Weekly AI reports", "Custom integrations"] },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-black" />
            </div>
            <span className="font-bold text-lg tracking-tight text-gray-900">FABRICOR</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-gray-500 hover:text-gray-900 text-sm transition-colors hidden md:block">Features</a>
            <a href="#compare" className="text-gray-500 hover:text-gray-900 text-sm transition-colors hidden md:block">Compare</a>
            <a href="#pricing" className="text-gray-500 hover:text-gray-900 text-sm transition-colors hidden md:block">Pricing</a>
            <a href="/login?register=true">
              <a className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
                Start Free Trial
              </a>
            </a>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-24 px-6 bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-200 rounded-full px-4 py-1.5 text-amber-700 text-sm font-medium mb-8">
            <Brain size={14} />
            The only stone fabrication platform with Claude AI built in
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 text-gray-900">
            Run your shop<br />
            <span className="text-amber-500">smarter than ever.</span>
          </h1>
          <p className="text-gray-500 text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            Fabricor replaces Moraware, Stone Profit System, Stonify, and your spreadsheets with one AI-powered platform built for stone fabrication shops.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/login?register=true">
              <a className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg shadow-amber-200">
                Start Free Trial <ArrowRight size={20} />
              </a>
            </a>
            <a href="#features" className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-8 py-4 rounded-xl text-lg transition-colors border border-gray-200 shadow-sm">
              See Features
            </a>
          </div>
          <p className="text-gray-400 text-sm mt-4">14-day free trial · No credit card required · Cancel anytime</p>
        </div>
      </section>

      <section className="py-16 px-6 bg-gray-900">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "$316/hr", label: "True cost of a remake" },
            { value: "2,600+", label: "Shops using Moraware" },
            { value: "0", label: "Competitors with real AI" },
            { value: "14 days", label: "Free trial, no card" },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-3xl font-bold text-amber-400 font-mono">{value}</div>
              <div className="text-gray-400 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Everything your shop needs</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Built by people who understand stone fabrication. Every feature solves a real problem.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-amber-300 hover:shadow-lg transition-all shadow-sm">
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 w-fit mb-4">
                  <Icon size={20} className="text-amber-500" />
                </div>
                <h3 className="text-gray-900 font-bold text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-gradient-to-r from-amber-500 to-amber-600">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-4 rounded-2xl bg-white/20 w-fit mx-auto mb-6">
            <Brain size={32} className="text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4 text-white">Institutional Memory</h2>
          <p className="text-amber-50 text-xl leading-relaxed max-w-2xl mx-auto mb-6">
            Fabricor remembers every job, every complaint, every praise, every employee — forever. Before your crew starts a high-value builder job, Claude briefs them: what went wrong last time, which templator caused issues, what the client is sensitive about.
          </p>
          <p className="text-amber-100 text-lg">No more institutional knowledge walking out the door when an employee leaves.</p>
        </div>
      </section>

      <section id="compare" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">How we compare</h2>
            <p className="text-gray-500 text-lg">See why shops are switching from Moraware, Stone Profit System, and Stonify to Fabricor</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-5 gap-0 border-b border-gray-200 px-6 py-4 bg-gray-50">
              <div className="text-gray-500 text-sm font-mono uppercase">Feature</div>
              <div className="text-amber-600 font-bold text-center text-sm">Fabricor</div>
              <div className="text-gray-500 font-semibold text-center text-sm">Moraware</div>
              <div className="text-gray-500 font-semibold text-center text-sm">Stone Profit</div>
              <div className="text-gray-500 font-semibold text-center text-sm">Stonify</div>
            </div>
            {COMPARISON.map(({ feature, fabricor, moraware, stonePro, stonify }) => (
              <div key={feature} className="grid grid-cols-5 gap-0 border-b border-gray-100 px-6 py-3 hover:bg-amber-50/30 transition-colors">
                <div className="text-gray-700 text-sm font-medium">{feature}</div>
                <div className="flex justify-center">{fabricor ? <CheckCircle size={18} className="text-emerald-500" /> : <X size={18} className="text-gray-300" />}</div>
                <div className="flex justify-center">{moraware ? <CheckCircle size={18} className="text-gray-400" /> : <X size={18} className="text-gray-300" />}</div>
                <div className="flex justify-center">{stonePro ? <CheckCircle size={18} className="text-gray-400" /> : <X size={18} className="text-gray-300" />}</div>
                <div className="flex justify-center">{stonify ? <CheckCircle size={18} className="text-gray-400" /> : <X size={18} className="text-gray-300" />}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Simple, transparent pricing</h2>
            <p className="text-gray-500 text-lg">Replace $400/mo Moraware with a smarter platform for less</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div key={plan.name} className={`relative bg-white border-2 ${plan.color} rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow`}>
                {(plan as any).popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <div className="mb-4">
                  <div className="text-gray-900 font-bold text-xl mb-1">{plan.name}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold font-mono text-gray-900">${plan.price}</span>
                    <span className="text-gray-400">/mo</span>
                  </div>
                </div>
                <div className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle size={13} className="text-amber-500 flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <a href="/login?register=true">
                  <a className={`w-full block text-center py-3 rounded-xl font-bold text-sm transition-colors ${plan.btnColor}`}>
                    Start Free Trial
                  </a>
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-400 text-sm mt-6">14-day free trial · No credit card required · Cancel anytime</p>
        </div>
      </section>

      <section className="py-24 px-6 bg-gray-50 border-t border-gray-200">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center gap-1 mb-6">
            {[1,2,3,4,5].map(i => <Star key={i} size={20} className="text-amber-400 fill-amber-400" />)}
          </div>
          <blockquote className="text-2xl font-medium text-gray-700 leading-relaxed mb-6">
            "Fabricor flagged that one of our biggest builder accounts had recurring issues in the primary bath on their last two jobs. We caught it before the third install. That's $316/hr saved before we even walked in the door."
          </blockquote>
          <div className="text-gray-400">Stone Fabrication Shop Owner · Ohio</div>
        </div>
      </section>

      <section className="py-24 px-6 bg-amber-500">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4 text-black">Ready to know your shop better?</h2>
          <p className="text-amber-900 text-lg mb-8">Join the shops replacing Moraware, Stone Profit System, and Stonify with Fabricor. 14-day free trial, no card required.</p>
          <a href="/login?register=true">
            <a className="inline-flex items-center gap-2 bg-black hover:bg-gray-900 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors shadow-xl">
              Start Free Trial <ArrowRight size={20} />
            </a>
          </a>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-500 rounded flex items-center justify-center">
              <Zap size={12} className="text-black" />
            </div>
            <span className="font-bold text-sm text-gray-900">FABRICOR</span>
            <span className="text-gray-400 text-sm">by SAIRN Technologies</span>
          </div>
          <div className="flex gap-6 text-gray-400 text-sm">
            <a href="mailto:hello@sairn.com" className="hover:text-gray-600 transition-colors">hello@sairn.com</a>
            <a href="/login?register=true" className="hover:text-gray-600 transition-colors">Login</a>
          </div>
        </div>
      </footer>
    </div>
  );
}