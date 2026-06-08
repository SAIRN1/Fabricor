import { useState } from "react";
import { Calculator, Plus, X, Brain, Copy, Check, Trash2 } from "lucide-react";

const EDGE_TYPES = [
  { name: "Eased", price: 8 },
  { name: "Beveled", price: 10 },
  { name: "Bullnose", price: 12 },
  { name: "Ogee", price: 18 },
  { name: "Dupont", price: 20 },
  { name: "Waterfall", price: 45 },
  { name: "Mitered", price: 55 },
];

const CUTOUT_TYPES = [
  { name: "Sink (Undermount)", price: 150 },
  { name: "Sink (Drop-in)", price: 100 },
  { name: "Cooktop", price: 125 },
  { name: "Faucet Hole", price: 35 },
  { name: "Soap Dispenser", price: 25 },
];

const STONE_PRICES: Record<string, number> = {
  "Granite": 45,
  "Quartzite": 65,
  "Quartz (Engineered)": 55,
  "Marble": 75,
  "Soapstone": 70,
  "Dolomite": 80,
  "Porcelain": 50,
};

interface LineItem {
  id: string;
  area: string;
  sqft: number;
  pricePerSqft: number;
}

interface EdgeItem {
  id: string;
  type: string;
  lf: number;
  price: number;
}

interface CutoutItem {
  id: string;
  type: string;
  qty: number;
  price: number;
}

export default function Estimator() {
  const [customerName, setCustomerName] = useState("");
  const [jobName, setJobName] = useState("");
  const [stoneType, setStoneType] = useState("Quartz (Engineered)");
  const [customStonePrice, setCustomStonePrice] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", area: "Kitchen", sqft: 0, pricePerSqft: 55 },
  ]);
  const [edges, setEdges] = useState<EdgeItem[]>([]);
  const [cutouts, setCutouts] = useState<CutoutItem[]>([]);
  const [margin, setMargin] = useState(45);
  const [copied, setCopied] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  const stonePrice = customStonePrice ? parseFloat(customStonePrice) : (STONE_PRICES[stoneType] || 55);

  const totalSqft = lineItems.reduce((s, i) => s + (i.sqft || 0), 0);
  const materialCost = lineItems.reduce((s, i) => s + (i.sqft || 0) * i.pricePerSqft, 0);
  const edgeCost = edges.reduce((s, e) => s + (e.lf || 0) * e.price, 0);
  const cutoutCost = cutouts.reduce((s, c) => s + (c.qty || 0) * c.price, 0);
  const subtotal = materialCost + edgeCost + cutoutCost;
  const marginAmount = subtotal / (1 - margin / 100) - subtotal;
  const total = subtotal + marginAmount;
  const pricePerSqft = totalSqft > 0 ? total / totalSqft : 0;

  const addLineItem = () => {
    setLineItems(items => [...items, { id: Date.now().toString(), area: "", sqft: 0, pricePerSqft: stonePrice }]);
  };

  const addEdge = () => {
    setEdges(e => [...e, { id: Date.now().toString(), type: "Eased", lf: 0, price: 8 }]);
  };

  const addCutout = () => {
    setCutouts(c => [...c, { id: Date.now().toString(), type: "Sink (Undermount)", qty: 1, price: 150 }]);
  };

  const generateSummary = async () => {
    setLoadingAI(true);
    try {
      const r = await fetch("/api/claude/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          includeShopContext: false,
          messages: [{
            role: "user",
            content: `Generate a brief professional estimate summary for a stone fabrication project:
Customer: ${customerName || "TBD"}
Job: ${jobName || "TBD"}
Stone: ${stoneType}
Total Sq Ft: ${totalSqft.toFixed(2)}
Areas: ${lineItems.map(i => `${i.area}(${i.sqft}sf)`).join(", ")}
Edges: ${edges.map(e => `${e.type}(${e.lf}lf)`).join(", ") || "Standard eased"}
Cutouts: ${cutouts.map(c => `${c.type}(${c.qty})`).join(", ") || "None"}
Total: $${total.toFixed(2)}
Price/sqft: $${pricePerSqft.toFixed(2)}

Write 2-3 sentences summarizing this estimate professionally, noting key details and value. Keep it warm and confident.`
          }]
        }),
      });
      const data = await r.json();
      setAiSummary(data.content || "");
    } catch { setAiSummary("Unable to generate summary."); }
    setLoadingAI(false);
  };

  const copyEstimate = () => {
    const text = `ESTIMATE — ${jobName || "Stone Project"}
Customer: ${customerName || "TBD"}
Stone: ${stoneType}
Date: ${new Date().toLocaleDateString()}

AREAS:
${lineItems.map(i => `  ${i.area}: ${i.sqft} sf @ $${i.pricePerSqft}/sf = $${(i.sqft * i.pricePerSqft).toFixed(2)}`).join("\n")}

${edges.length > 0 ? `EDGES:\n${edges.map(e => `  ${e.type}: ${e.lf} lf @ $${e.price}/lf = $${(e.lf * e.price).toFixed(2)}`).join("\n")}\n` : ""}
${cutouts.length > 0 ? `CUTOUTS:\n${cutouts.map(c => `  ${c.type}: ${c.qty} @ $${c.price} = $${(c.qty * c.price).toFixed(2)}`).join("\n")}\n` : ""}
TOTAL SQUARE FEET: ${totalSqft.toFixed(2)} sf
PRICE PER SQ FT: $${pricePerSqft.toFixed(2)}/sf
TOTAL ESTIMATE: $${total.toFixed(2)}

${aiSummary ? `\nNOTES:\n${aiSummary}` : ""}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Price Estimator</h1>
          <p className="text-zinc-500 mt-1">Build accurate estimates with real-time cost calculation</p>
        </div>
        <button onClick={copyEstimate}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2.5 rounded-lg text-sm">
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copied!" : "Copy Estimate"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-5">
          <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">Project Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-zinc-400 text-xs mb-1.5 block">Customer Name</label>
                <input type="text" placeholder="John Smith" value={customerName} onChange={e => setCustomerName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-zinc-400 text-xs mb-1.5 block">Job Name</label>
                <input type="text" placeholder="Smith Kitchen" value={jobName} onChange={e => setJobName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-zinc-400 text-xs mb-1.5 block">Stone Type</label>
                <select value={stoneType} onChange={e => { setStoneType(e.target.value); setLineItems(items => items.map(i => ({ ...i, pricePerSqft: STONE_PRICES[e.target.value] || 55 }))); }}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500">
                  {Object.keys(STONE_PRICES).map(s => <option key={s}>{s}</option>)}
                  <option value="Custom">Custom Price</option>
                </select>
              </div>
              <div>
                <label className="text-zinc-400 text-xs mb-1.5 block">Material $/sqft</label>
                <input type="number" placeholder={String(STONE_PRICES[stoneType] || 55)} value={customStonePrice} onChange={e => setCustomStonePrice(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
              </div>
            </div>
          </div>

          <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Areas & Square Footage</h2>
              <button onClick={addLineItem} className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300">
                <Plus size={13} /> Add Area
              </button>
            </div>
            <div className="space-y-2">
              {lineItems.map((item, i) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
                    <input type="text" placeholder="Kitchen" value={item.area}
                      onChange={e => setLineItems(items => items.map(li => li.id === item.id ? { ...li, area: e.target.value } : li))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                  </div>
                  <div className="col-span-3">
                    <input type="number" placeholder="Sq Ft" value={item.sqft || ""}
                      onChange={e => setLineItems(items => items.map(li => li.id === item.id ? { ...li, sqft: parseFloat(e.target.value) || 0 } : li))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                  </div>
                  <div className="col-span-3">
                    <input type="number" placeholder="$/sqft" value={item.pricePerSqft || ""}
                      onChange={e => setLineItems(items => items.map(li => li.id === item.id ? { ...li, pricePerSqft: parseFloat(e.target.value) || 0 } : li))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                  </div>
                  <div className="col-span-1 text-right font-mono text-sm text-amber-400">
                    ${(item.sqft * item.pricePerSqft).toFixed(0)}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {lineItems.length > 1 && (
                      <button onClick={() => setLineItems(items => items.filter(li => li.id !== item.id))}
                        className="text-zinc-600 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Edge Work</h2>
              <button onClick={addEdge} className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300">
                <Plus size={13} /> Add Edge
              </button>
            </div>
            {edges.length === 0 ? (
              <div className="text-zinc-600 text-sm text-center py-4">No edge work added — click Add Edge</div>
            ) : (
              <div className="space-y-2">
                {edges.map(edge => (
                  <div key={edge.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <select value={edge.type}
                        onChange={e => {
                          const found = EDGE_TYPES.find(et => et.name === e.target.value);
                          setEdges(eds => eds.map(ed => ed.id === edge.id ? { ...ed, type: e.target.value, price: found?.price || ed.price } : ed));
                        }}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500">
                        {EDGE_TYPES.map(et => <option key={et.name}>{et.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input type="number" placeholder="Lin Ft" value={edge.lf || ""}
                        onChange={e => setEdges(eds => eds.map(ed => ed.id === edge.id ? { ...ed, lf: parseFloat(e.target.value) || 0 } : ed))}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                    </div>
                    <div className="col-span-3">
                      <input type="number" placeholder="$/lf" value={edge.price || ""}
                        onChange={e => setEdges(eds => eds.map(ed => ed.id === edge.id ? { ...ed, price: parseFloat(e.target.value) || 0 } : ed))}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                    </div>
                    <div className="col-span-1 text-right font-mono text-sm text-amber-400">${(edge.lf * edge.price).toFixed(0)}</div>
                    <div className="col-span-1 flex justify-end">
                      <button onClick={() => setEdges(eds => eds.filter(ed => ed.id !== edge.id))} className="text-zinc-600 hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Cutouts</h2>
              <button onClick={addCutout} className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300">
                <Plus size={13} /> Add Cutout
              </button>
            </div>
            {cutouts.length === 0 ? (
              <div className="text-zinc-600 text-sm text-center py-4">No cutouts added — click Add Cutout</div>
            ) : (
              <div className="space-y-2">
                {cutouts.map(cutout => (
                  <div key={cutout.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <select value={cutout.type}
                        onChange={e => {
                          const found = CUTOUT_TYPES.find(ct => ct.name === e.target.value);
                          setCutouts(cs => cs.map(c => c.id === cutout.id ? { ...c, type: e.target.value, price: found?.price || c.price } : c));
                        }}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500">
                        {CUTOUT_TYPES.map(ct => <option key={ct.name}>{ct.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input type="number" placeholder="Qty" value={cutout.qty || ""}
                        onChange={e => setCutouts(cs => cs.map(c => c.id === cutout.id ? { ...c, qty: parseInt(e.target.value) || 0 } : c))}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                    </div>
                    <div className="col-span-3">
                      <input type="number" placeholder="$/each" value={cutout.price || ""}
                        onChange={e => setCutouts(cs => cs.map(c => c.id === cutout.id ? { ...c, price: parseFloat(e.target.value) || 0 } : c))}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                    </div>
                    <div className="col-span-1 text-right font-mono text-sm text-amber-400">${(cutout.qty * cutout.price).toFixed(0)}</div>
                    <div className="col-span-1 flex justify-end">
                      <button onClick={() => setCutouts(cs => cs.filter(c => c.id !== cutout.id))} className="text-zinc-600 hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-5 sticky top-8">
            <h2 className="text-white font-semibold mb-4">Estimate Summary</h2>
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Total Sq Ft</span>
                <span className="text-white font-mono">{totalSqft.toFixed(2)} sf</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Material</span>
                <span className="text-zinc-300 font-mono">${materialCost.toFixed(2)}</span>
              </div>
              {edgeCost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Edge Work</span>
                  <span className="text-zinc-300 font-mono">${edgeCost.toFixed(2)}</span>
                </div>
              )}
              {cutoutCost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Cutouts</span>
                  <span className="text-zinc-300 font-mono">${cutoutCost.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm border-t border-zinc-800 pt-3">
                <span className="text-zinc-500">Subtotal</span>
                <span className="text-zinc-300 font-mono">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Margin</span>
                <div className="flex items-center gap-2">
                  <input type="number" value={margin} onChange={e => setMargin(parseInt(e.target.value) || 0)}
                    className="w-16 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white font-mono text-xs text-right focus:outline-none focus:border-amber-500" />
                  <span className="text-zinc-500 text-xs">%</span>
                </div>
              </div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
              <div className="text-zinc-400 text-xs font-mono uppercase mb-1">Total Estimate</div>
              <div className="text-amber-400 font-mono text-3xl font-bold">${total.toFixed(2)}</div>
              <div className="text-zinc-500 text-xs mt-1">${pricePerSqft.toFixed(2)}/sqft installed</div>
            </div>
            <button onClick={generateSummary} disabled={loadingAI}
              className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 mb-2">
              {loadingAI ? <><div className="w-3 h-3 border border-zinc-500 border-t-zinc-200 rounded-full animate-spin" />Generating...</> : <><Brain size={14} className="text-amber-400" />AI Summary</>}
            </button>
            {aiSummary && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 mt-3">
                <p className="text-zinc-300 text-xs leading-relaxed">{aiSummary}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
