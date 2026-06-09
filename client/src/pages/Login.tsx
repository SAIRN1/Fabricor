import { useState } from "react";
import { useAuth } from "../App";
import { Zap, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function Login() {
  const { setUser } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(window.location.search.includes("register") ? "register" : "login");
  const [form, setForm] = useState({ email: "", password: "", name: "", shopName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login"
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, name: form.name, shopName: form.shopName };
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Authentication failed");
      setUser(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080810] flex">
      <div className="hidden lg:flex w-1/2 bg-[#0a0a14] border-r border-zinc-800/40 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-black" />
          </div>
          <div>
            <div className="text-white font-bold text-xl tracking-tight">STONEDESK</div>
            <div className="text-zinc-500 text-xs font-mono">Stone Intelligence Platform</div>
          </div>
        </div>

        <div>
          <div className="text-5xl font-bold text-white leading-tight mb-6">
            Know your shop<br />
            <span className="text-amber-400">better than ever.</span>
          </div>
          <p className="text-zinc-400 text-lg leading-relaxed mb-10">
            The only stone fabrication platform with Claude AI built in.
            Track quality issues, analyze margins, and get intelligent
            recommendations — in real time.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "$316/hr", sub: "True cost of a remake" },
              { label: "2,600+", sub: "Shops using Moraware" },
              { label: "0", sub: "Competitors with real AI" },
            ].map(({ label, sub }) => (
              <div key={label} className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                <div className="text-amber-400 font-mono font-bold text-2xl">{label}</div>
                <div className="text-zinc-500 text-xs mt-1">{sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-zinc-700 text-sm font-mono">
          SAIRN Technologies · StoneDesk v2.0
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center">
              <Zap size={17} className="text-black" />
            </div>
            <div className="text-white font-bold text-lg">STONEDESK</div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-zinc-500 mb-8">
            {mode === "login" ? "Sign in to your shop dashboard" : "Start your 14-day free trial"}
          </p>

          <form onSubmit={handle} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="text-zinc-400 text-sm mb-1.5 block">Your name</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Mike Dibert" required
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-zinc-400 text-sm mb-1.5 block">Shop name</label>
                  <input type="text" value={form.shopName} onChange={e => setForm(f => ({ ...f, shopName: e.target.value }))}
                    placeholder="Bradley Stone Industries"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>
              </>
            )}
            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="admin@yourshop.com" required
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">Password</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••" required
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 pr-12 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition-colors">
              {loading
                ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                : <>{mode === "login" ? "Sign in" : "Create account"}<ArrowRight size={16} /></>
              }
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => { setMode(m => m === "login" ? "register" : "login"); setError(""); }}
              className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
              {mode === "login" ? "Don't have an account? Sign up free" : "Already have an account? Sign in"}
            </button>
          </div>

          {mode === "login" && (
            <div className="mt-6 bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3">
              <div className="text-zinc-600 text-xs font-mono mb-1">DEMO CREDENTIALS</div>
              <div className="text-zinc-400 text-sm">admin@fabricor.io / fabricor2026</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
