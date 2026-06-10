import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search, Package, ExternalLink, Sparkles, Globe } from "lucide-react";

const SUPPLIERS = [
  { name: "MSI Surfaces", url: "https://www.msisurfaces.com", logo: "MSI", colors: "text-blue-400", desc: "Largest slab importer in North America. 125M+ sq ft inventory. 50+ distribution centers.", products: "Quartz, Granite, Quartzite, Marble, Porcelain" },
  { name: "Cambria", url: "https://www.cambriausa.com", logo: "CAM", colors: "text-emerald-400", desc: "Family-owned American quartz manufacturer. Premium quality, made in USA.", products: "Quartz only — 300+ designs" },
  { name: "Caesarstone", url: "https://www.caesarstone.com", logo: "CES", colors: "text-purple-400", desc: "Israeli quartz manufacturer. Pioneer of engineered stone. Sold in 50+ countries.", products: "Quartz, Porcelain" },
  { name: "Silestone by Cosentino", url: "https://www.silestone.com", logo: "SIL", colors: "text-amber-400", desc: "Spanish manufacturer with HybriQ+ technology. Antimicrobial surface.", products: "Quartz, Ultra Compact" },
  { name: "Vicostone", url: "https://vicostone.com", logo: "VIC", colors: "text-pink-400", desc: "Vietnamese quartz manufacturer. Value pricing with Breton technology.", products: "Quartz" },
  { name: "Arizona Tile", url: "https://www.arizonatile.com", logo: "AZT", colors: "text-orange-400", desc: "Multi-regional US distributor. Natural stone and porcelain slabs.", products: "Granite, Marble, Quartzite, Porcelain" },
];

const MATERIAL_GUIDES: Record<string, { supplier: string; note: string; priceRange: string }> = {
  "Quartz": { supplier: "Cambria, Caesarstone, MSI Q Premium", note: "Non-porous, consistent color, no sealing needed", priceRange: "$55-120/sqft installed" },
  "Granite": { supplier: "MSI, Arizona Tile", note: "Natural variation, annual sealing required, heat resistant", priceRange: "$40-85/sqft installed" },
  "Quartzite": { supplier: "MSI, Arizona Tile", note: "Hardest natural stone, needs sealing, acid resistant", priceRange: "$65-150/sqft installed" },
  "Marble": { supplier: "MSI, Arizona Tile, Cosentino", note: "Acid sensitive, needs frequent sealing, classic look", priceRange: "$60-200/sqft installed" },
  "Porcelain": { supplier: "MSI, Caesarstone Porcelain, Silestone", note: "Non-porous, UV resistant, outdoor capable", priceRange: "$55-130/sqft installed" },
};

export default function Suppliers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [aiResult, setAiResult] = useState("");

  const aiMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/claude/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: `You are a stone fabrication expert. Answer this question about stone suppliers, materials, or pricing: ${aiQuery}. Be specific, practical, and mention relevant suppliers when applicable. Keep it concise.` }),
      });
      const data = await r.json();
      return data.response || data.message;
    },
    onSuccess: (data) => setAiResult(data),
  });

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Supplier Intelligence</h1>
        <p className="text-zinc-500 mt-1">Know your suppliers, materials, and pricing — AI-powered stone sourcing research</p>
      </div>

      <div className="bg-[#0d0d14] border border-amber-800/30 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-amber-400" />
          <span className="text-white font-semibold text-sm">AI Supplier Assistant</span>
        </div>
        <p className="text-zinc-500 text-xs mb-3">Ask anything about stone suppliers, material specs, pricing, availability, or sourcing strategy</p>
        <div className="flex gap-2">
          <input type="text" placeholder="Which supplier has the best Calacatta marble pricing? What's the difference between quartz brands?..."
            value={aiQuery} onChange={e => setAiQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && aiQuery.trim() && aiMutation.mutate()}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm" />
          <button onClick={() => aiMutation.mutate()} disabled={aiMutation.isPending || !aiQuery.trim()}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-semibold px-4 py-2.5 rounded-lg text-sm">
            {aiMutation.isPending ? "..." : <><Sparkles size={14} /> Ask</>}
          </button>
        </div>
        {aiResult && (
          <div className="mt-3 bg-zinc-900 rounded-xl p-4">
            <p className="text-zinc-300 text-sm leading-relaxed">{aiResult}</p>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-white font-semibold mb-4">Material Pricing Guide</h2>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(MATERIAL_GUIDES).map(([material, info]) => (
            <div key={material} className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-semibold text-sm">{material}</span>
                <span className="text-amber-400 text-xs font-mono">{info.priceRange}</span>
              </div>
              <div className="text-zinc-500 text-xs mb-1">{info.note}</div>
              <div className="text-zinc-600 text-xs">Source: {info.supplier}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-white font-semibold mb-4">Major Suppliers</h2>
        <div className="space-y-3">
          {SUPPLIERS.map(supplier => (
            <div key={supplier.name} className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center font-bold text-xs ${supplier.colors} flex-shrink-0`}>
                    {supplier.logo}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{supplier.name}</div>
                    <div className="text-zinc-400 text-xs mt-0.5 mb-1">{supplier.desc}</div>
                    <div className="text-zinc-600 text-xs">Products: {supplier.products}</div>
                  </div>
                </div>
                <a href={supplier.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-xs flex-shrink-0">
                  <Globe size={11} /> Visit
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-blue-950/20 border border-blue-800/30 rounded-xl p-4">
        <div className="text-blue-400 font-semibold text-sm mb-2">🔗 Direct Supplier Integration — Coming Soon</div>
        <p className="text-zinc-400 text-xs leading-relaxed">We are building direct API connections to MSI, Cambria, and Arizona Tile so you can check live slab availability, reserve slabs, and place orders without leaving StoneDesk. Contact us to be notified when this launches.</p>
      </div>
    </div>
  );
}
