import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Copy, Mail, CheckCircle, BookOpen } from "lucide-react";

const STONE_CARE: Record<string, string> = {
  Quartz: "engineered quartz — non-porous, heat sensitive, avoid harsh chemicals",
  Granite: "natural granite — porous, needs sealing annually, heat resistant",
  Quartzite: "natural quartzite — very hard, needs sealing, acid sensitive",
  Marble: "natural marble — very porous, acid sensitive, requires frequent sealing",
  Porcelain: "porcelain slab — non-porous, heat resistant, very durable",
  Dolomite: "natural dolomite — similar to marble, acid sensitive",
  Soapstone: "natural soapstone — non-porous, soft surface, mineral oil treatment",
  Travertine: "natural travertine — very porous, needs sealing, acid sensitive",
  Limestone: "natural limestone — porous, acid sensitive, soft surface",
};

export default function CareGuide() {
  const qc = useQueryClient();
  const [stoneType, setStoneType] = useState("Quartz");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [areas, setAreas] = useState("kitchen countertops");
  const [guide, setGuide] = useState("");
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  const { data: guides = [] } = useQuery({
    queryKey: ["/api/care-guides"],
    queryFn: () => fetch("/api/care-guides", { credentials: "include" }).then(r => r.json()),
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const stoneDesc = STONE_CARE[stoneType] || stoneType;
      const prompt = `Create a comprehensive, friendly care guide for ${customerName || "a homeowner"}'s new ${stoneType} ${areas}.

Stone details: ${stoneDesc}

Include:
1. Daily cleaning instructions (what to use, what to avoid)
2. Weekly maintenance tips
3. Monthly care routine
4. What NEVER to use on this stone (specific chemicals, cleaners to avoid)
5. How to handle spills immediately
6. Sealing instructions if needed (frequency, recommended products)
7. What to do if you notice etching or staining
8. Long-term maintenance to keep it looking new
9. When to call a professional

Make it warm, practical, and easy to follow. Format with clear sections. Address the customer by name if provided.`;
      const r = await fetch("/api/claude/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ message: prompt }),
      });
      const data = await r.json();
      return data.response || data.message || "Failed to generate guide";
    },
    onSuccess: (data) => setGuide(data),
  });

  const saveMutation = useMutation({
    mutationFn: () => fetch("/api/care-guides", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ stoneType, guideText: guide, sentTo: customerEmail }),
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/care-guides"] }); setSent(true); setTimeout(() => setSent(false), 3000); },
  });

  const copyGuide = () => { navigator.clipboard.writeText(guide); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Care Guide Generator</h1>
        <p className="text-zinc-500 mt-1">AI-generated personalized care instructions for every stone type — email to customer after installation</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Guide Details</h2>
          <div className="space-y-3">
            <div>
              <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Customer Name</label>
              <input type="text" placeholder="Smith Family" value={customerName} onChange={e => setCustomerName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div>
              <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Customer Email</label>
              <input type="email" placeholder="customer@email.com" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div>
              <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Stone Type</label>
              <select value={stoneType} onChange={e => setStoneType(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm">
                {Object.keys(STONE_CARE).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Areas Installed</label>
              <input type="text" placeholder="kitchen countertops, bathroom vanity" value={areas} onChange={e => setAreas(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              <div className="text-zinc-500 text-xs">{STONE_CARE[stoneType]}</div>
            </div>
            <button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl text-sm transition-colors">
              {generateMutation.isPending ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />Generating...</> : <><Sparkles size={15} />Generate Care Guide</>}
            </button>
          </div>
        </div>

        <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Generated Guide</h2>
            {guide && (
              <div className="flex gap-2">
                <button onClick={copyGuide} className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-xs">
                  {copied ? <CheckCircle size={12} className="text-emerald-400" /> : <Copy size={12} />} {copied ? "Copied!" : "Copy"}
                </button>
                <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black px-3 py-1.5 rounded-lg text-xs font-semibold">
                  {sent ? <CheckCircle size={12} /> : <Mail size={12} />} {sent ? "Saved!" : "Save"}
                </button>
              </div>
            )}
          </div>
          {!guide && !generateMutation.isPending && (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <BookOpen size={32} className="text-zinc-700 mb-3" />
              <p className="text-zinc-500 text-sm">Fill in the details and click Generate</p>
              <p className="text-zinc-600 text-xs mt-1">Claude creates a personalized care guide for this specific stone</p>
            </div>
          )}
          {generateMutation.isPending && (
            <div className="h-64 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-zinc-500 text-sm">Generating care guide...</p>
            </div>
          )}
          {guide && (
            <div className="bg-zinc-900 rounded-xl p-4 max-h-96 overflow-y-auto">
              <pre className="text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap font-sans">{guide}</pre>
            </div>
          )}
        </div>
      </div>

      {(guides as any[]).length > 0 && (
        <div className="mt-6 bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-3">Recent Guides ({(guides as any[]).length})</h3>
          <div className="space-y-2">
            {(guides as any[]).slice(0, 5).map((g: any) => (
              <div key={g.id} className="flex items-center justify-between bg-zinc-900 rounded-lg px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <BookOpen size={13} className="text-amber-400" />
                  <span className="text-zinc-300 text-sm">{g.stone_type}</span>
                  {g.sent_to && <span className="text-zinc-500 text-xs">{g.sent_to}</span>}
                </div>
                <span className="text-zinc-600 text-xs">{new Date(g.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
