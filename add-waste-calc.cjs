const fs = require('fs');
let c = fs.readFileSync('client/src/pages/Estimator.tsx', 'utf8');

// Add slabWidth and slabHeight state after margin state
c = c.replace(
  'const [margin, setMargin] = useState(45);',
  'const [margin, setMargin] = useState(45);\n  const [slabWidth, setSlabWidth] = useState(63);\n  const [slabHeight, setSlabHeight] = useState(126);'
);

// Add waste calculations after pricePerSqft
c = c.replace(
  'const pricePerSqft = totalSqft > 0 ? total / totalSqft : 0;',
  'const pricePerSqft = totalSqft > 0 ? total / totalSqft : 0;\n  const slabSqft = (slabWidth * slabHeight) / 144;\n  const slabsNeeded = totalSqft > 0 ? Math.ceil((totalSqft * 1.15) / slabSqft) : 0;\n  const wasteSqft = slabsNeeded > 0 ? (slabsNeeded * slabSqft) - totalSqft : 0;\n  const wastePercent = slabsNeeded > 0 ? ((wasteSqft / (slabsNeeded * slabSqft)) * 100).toFixed(1) : 0;\n  const wasteCost = wasteSqft * (stonePrice || 10);'
);

// Add waste calculator section after Total Estimate block
const afterTotal = `            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
              <div className="text-zinc-400 text-xs font-mono uppercase mb-1">Total Estimate</div>
              <div className="text-amber-400 font-mono text-3xl font-bold">\${total.toFixed(2)}</div>
              <div className="text-zinc-500 text-xs mt-1">\${pricePerSqft.toFixed(2)}/sqft installed</div>
            </div>`;

const withWaste = `            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
              <div className="text-zinc-400 text-xs font-mono uppercase mb-1">Total Estimate</div>
              <div className="text-amber-400 font-mono text-3xl font-bold">\${total.toFixed(2)}</div>
              <div className="text-zinc-500 text-xs mt-1">\${pricePerSqft.toFixed(2)}/sqft installed</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4">
              <div className="text-zinc-400 text-xs font-mono uppercase mb-3">Material Waste Calculator</div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <div className="text-zinc-500 text-xs mb-1">Slab Width (in)</div>
                  <input type="number" value={slabWidth} onChange={e => setSlabWidth(+e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-white font-mono text-sm focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <div className="text-zinc-500 text-xs mb-1">Slab Height (in)</div>
                  <input type="number" value={slabHeight} onChange={e => setSlabHeight(+e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-white font-mono text-sm focus:outline-none focus:border-amber-500" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs"><span className="text-zinc-500">Slab size</span><span className="text-zinc-300 font-mono">{slabSqft.toFixed(1)} sf</span></div>
                <div className="flex justify-between text-xs"><span className="text-zinc-500">Slabs needed</span><span className="text-zinc-300 font-mono">{slabsNeeded} slabs</span></div>
                <div className="flex justify-between text-xs"><span className="text-zinc-500">Waste</span><span className="text-red-400 font-mono">{wasteSqft.toFixed(1)} sf ({wastePercent}%)</span></div>
                <div className="flex justify-between text-xs border-t border-zinc-800 pt-1.5"><span className="text-zinc-500">Waste cost</span><span className="text-red-400 font-mono font-bold">\${wasteCost.toFixed(2)}</span></div>
              </div>
            </div>`;

c = c.replace(afterTotal, withWaste);
fs.writeFileSync('client/src/pages/Estimator.tsx', c);
console.log('done, length:', c.length);
