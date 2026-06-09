import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Copy, Download, CheckCircle } from "lucide-react";

export default function QuoteGenerator() {
  const [form, setForm] = useState({
    customerName: "", projectType: "Kitchen Countertops", stoneType: "Quartz",
    sqft: "", edgeProfile: "Eased", cutouts: "1 undermount sink",
    specialNotes: "", laborRate: "66",
  });
  const [quote, setQuote] = useState("");
  const [copied, setCopied] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: async () => {
      const prompt = `Generate a professional stone fabrication quote for the following project:

Customer: ${form.customerName}
Project Type: ${form.projectType}
Stone Material: ${form.stoneType}
Square Footage: ${form.sqft} sf
Edge Profile: ${form.edgeProfile}
Cutouts: ${form.cutouts}
Special Notes: ${form.specialNotes}
Labor Rate: $${form.laborRate}/hr

Create a complete, professional quote that includes:
1. A professional greeting and project summary
2. Detailed line items with pricing (material, fabrication, installation, edge work, cutouts)
3. Payment terms (50% deposit, balance due at installation)
4. Timeline estimate
5. What is included and what is not included
6. A professional closing with contact information placeholder

Format it as a ready-to-send document. Use realistic stone fabrication pricing based on the material type. Make it sound professional and build customer confidence.`;

      const r = await fetch("/api/claude/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: prompt }),
      });
      const data = await r.json();
      return data.response || data.message || "Failed to generate quote";
    },
    onSuccess: (data) => setQuote(data),
  });

  const copyQuote = () => {
    navigator.clipboard.writeText(quote);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQuote = () => {
    const blob = new Blob([quote], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Quote-${form.customerName.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">AI Quote Generator</h1>
        <p className="text-zinc-500 mt-1">Describe the project — Claude generates a complete professional quote instantly</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">Project Details</h2>
            <div className="space-y-3">
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Customer Name</label>
                <input type="text" placeholder="John & Jane Smith" value={form.customerName} onChange={e => set("customerName", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Project Type</label>
                  <select value={form.projectType} onChange={e => set("projectType", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm">
                    <option>Kitchen Countertops</option>
                    <option>Bathroom Vanity</option>
                    <option>Island Only</option>
                    <option>Full Kitchen + Bathrooms</option>
                    <option>Commercial Project</option>
                    <option>Fireplace Surround</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Stone Type</label>
                  <select value={form.stoneType} onChange={e => set("stoneType", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm">
                    <option>Quartz</option>
                    <option>Granite</option>
                    <option>Quartzite</option>
                    <option>Marble</option>
                    <option>Porcelain</option>
                    <option>Dolomite</option>
                    <option>Soapstone</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Square Footage</label>
                  <input type="number" placeholder="45" value={form.sqft} onChange={e => set("sqft", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Edge Profile</label>
                  <select value={form.edgeProfile} onChange={e => set("edgeProfile", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm">
                    <option>Eased</option>
                    <option>Beveled</option>
                    <option>Bullnose</option>
                    <option>Ogee</option>
                    <option>Waterfall</option>
                    <option>Mitered</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Cutouts</label>
                <input type="text" placeholder="1 undermount sink, 1 cooktop" value={form.cutouts} onChange={e => set("cutouts", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Special Notes</label>
                <textarea rows={3} placeholder="Book matched veining, waterfall island, specific color preference..." value={form.specialNotes} onChange={e => set("specialNotes", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm resize-none" />
              </div>
            </div>
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.customerName || !form.sqft}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold py-3 rounded-xl text-sm transition-colors">
              {mutation.isPending ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />Generating Quote...</> : <><Sparkles size={16} />Generate AI Quote</>}
            </button>
          </div>
        </div>

        <div>
          <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-2xl p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Generated Quote</h2>
              {quote && (
                <div className="flex gap-2">
                  <button onClick={copyQuote} className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-medium">
                    {copied ? <CheckCircle size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button onClick={downloadQuote} className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-medium">
                    <Download size={12} /> Download
                  </button>
                </div>
              )}
            </div>
            {!quote && !mutation.isPending && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Sparkles size={32} className="text-zinc-700 mb-3" />
                <p className="text-zinc-500 text-sm">Fill in the project details and click Generate</p>
                <p className="text-zinc-600 text-xs mt-1">Claude will create a complete professional quote</p>
              </div>
            )}
            {mutation.isPending && (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-zinc-500 text-sm">Claude is writing your quote...</p>
              </div>
            )}
            {quote && (
              <div className="bg-zinc-900 rounded-xl p-4 max-h-[500px] overflow-y-auto">
                <pre className="text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap font-sans">{quote}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
