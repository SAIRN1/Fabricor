import { useState, useRef, useEffect, useCallback } from "react";
import { Trash2, Download, Plus, Minus, RotateCcw, Square, Circle, Move } from "lucide-react";

interface Point { x: number; y: number; }
interface Shape {
  id: string;
  points: Point[];
  label: string;
  color: string;
}
interface Cutout {
  id: string;
  type: "sink" | "cooktop" | "faucet";
  x: number; y: number;
  width: number; height: number;
}
interface Seam {
  id: string;
  x1: number; y1: number;
  x2: number; y2: number;
}

const SCALE = 40; // pixels per foot
const COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444"];

const CUTOUT_DEFAULTS = {
  sink: { width: 2.5, height: 1.5, label: "Sink" },
  cooktop: { width: 2.0, height: 1.5, label: "Cooktop" },
  faucet: { width: 0.3, height: 0.3, label: "Faucet" },
};

function polygonArea(points: Point[]): number {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

function snapToGrid(val: number, grid: number = 0.5): number {
  return Math.round(val / grid) * grid;
}

export default function Layout() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<"draw" | "cutout" | "seam" | "select">("draw");
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [cutouts, setCutouts] = useState<Cutout[]>([]);
  const [seams, setSeams] = useState<Seam[]>([]);
  const [activeShape, setActiveShape] = useState(0);
  const [cutoutType, setCutoutType] = useState<"sink" | "cooktop" | "faucet">("sink");
  const [jobName, setJobName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [pan, setPan] = useState({ x: 50, y: 50 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPan, setLastPan] = useState({ x: 0, y: 0 });
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null);
  const [seamStart, setSeamStart] = useState<Point | null>(null);

  const totalSqft = shapes.reduce((sum, s) => {
    if (s.points.length < 3) return sum;
    return sum + polygonArea(s.points);
  }, 0);

  const cutoutSqft = cutouts.reduce((sum, c) => sum + c.width * c.height, 0);
  const netSqft = Math.max(0, totalSqft - cutoutSqft);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 1;
    const gridSize = SCALE * 0.5;
    for (let x = pan.x % gridSize; x < canvas.width; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = pan.y % gridSize; y < canvas.height; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // 1ft grid lines darker
    ctx.strokeStyle = "#27272a";
    for (let x = pan.x % SCALE; x < canvas.width; x += SCALE) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = pan.y % SCALE; y < canvas.height; y += SCALE) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Shapes
    shapes.forEach((shape, si) => {
      if (shape.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(shape.points[0].x * SCALE + pan.x, shape.points[0].y * SCALE + pan.y);
      shape.points.forEach(p => ctx.lineTo(p.x * SCALE + pan.x, p.y * SCALE + pan.y));
      ctx.closePath();
      ctx.fillStyle = shape.color + "20";
      ctx.fill();
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Dimension labels
      for (let i = 0; i < shape.points.length; i++) {
        const a = shape.points[i];
        const b = shape.points[(i + 1) % shape.points.length];
        const mx = (a.x + b.x) / 2 * SCALE + pan.x;
        const my = (a.y + b.y) / 2 * SCALE + pan.y;
        const dist = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
        if (dist > 0.3) {
          ctx.fillStyle = "#e4e4e7";
          ctx.font = "11px JetBrains Mono, monospace";
          ctx.textAlign = "center";
          ctx.fillText(`${dist.toFixed(1)}'`, mx, my - 6);
        }
      }

      // Area label
      if (shape.points.length >= 3) {
        const cx = shape.points.reduce((s, p) => s + p.x, 0) / shape.points.length * SCALE + pan.x;
        const cy = shape.points.reduce((s, p) => s + p.y, 0) / shape.points.length * SCALE + pan.y;
        const area = polygonArea(shape.points);
        ctx.fillStyle = shape.color;
        ctx.font = "bold 12px DM Sans, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(shape.label, cx, cy - 8);
        ctx.font = "11px JetBrains Mono, monospace";
        ctx.fillStyle = "#a1a1aa";
        ctx.fillText(`${area.toFixed(2)} sf`, cx, cy + 8);
      }

      // Points
      shape.points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x * SCALE + pan.x, p.y * SCALE + pan.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = shape.color;
        ctx.fill();
      });
    });

    // Current drawing
    if (currentPoints.length > 0) {
      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x * SCALE + pan.x, currentPoints[0].y * SCALE + pan.y);
      currentPoints.forEach(p => ctx.lineTo(p.x * SCALE + pan.x, p.y * SCALE + pan.y));
      if (hoverPoint) ctx.lineTo(hoverPoint.x * SCALE + pan.x, hoverPoint.y * SCALE + pan.y);
      ctx.strokeStyle = COLORS[activeShape % COLORS.length];
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      currentPoints.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x * SCALE + pan.x, p.y * SCALE + pan.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = COLORS[activeShape % COLORS.length];
        ctx.fill();
      });
    }

    // Hover point
    if (hoverPoint && tool === "draw") {
      ctx.beginPath();
      ctx.arc(hoverPoint.x * SCALE + pan.x, hoverPoint.y * SCALE + pan.y, 5, 0, Math.PI * 2);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#0a0a0f";
      ctx.fill();
      ctx.fillStyle = "#f59e0b";
      ctx.font = "10px JetBrains Mono";
      ctx.textAlign = "left";
      ctx.fillText(`${hoverPoint.x.toFixed(1)}', ${hoverPoint.y.toFixed(1)}'`, hoverPoint.x * SCALE + pan.x + 8, hoverPoint.y * SCALE + pan.y - 8);
    }

    // Cutouts
    cutouts.forEach(c => {
      const px = c.x * SCALE + pan.x;
      const py = c.y * SCALE + pan.y;
      const pw = c.width * SCALE;
      const ph = c.height * SCALE;
      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(px, py, pw, ph);
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(px, py, pw, ph);
      ctx.setLineDash([]);
      ctx.fillStyle = "#ef4444";
      ctx.font = "10px DM Sans";
      ctx.textAlign = "center";
      ctx.fillText(CUTOUT_DEFAULTS[c.type].label, px + pw / 2, py + ph / 2 + 4);
    });

    // Seams
    seams.forEach(s => {
      ctx.beginPath();
      ctx.moveTo(s.x1 * SCALE + pan.x, s.y1 * SCALE + pan.y);
      ctx.lineTo(s.x2 * SCALE + pan.x, s.y2 * SCALE + pan.y);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Seam in progress
    if (seamStart && hoverPoint) {
      ctx.beginPath();
      ctx.moveTo(seamStart.x * SCALE + pan.x, seamStart.y * SCALE + pan.y);
      ctx.lineTo(hoverPoint.x * SCALE + pan.x, hoverPoint.y * SCALE + pan.y);
      ctx.strokeStyle = "#f59e0b80";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [shapes, currentPoints, cutouts, seams, pan, hoverPoint, seamStart, tool, activeShape]);

  useEffect(() => { draw(); }, [draw]);

  const getPos = (e: React.MouseEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: snapToGrid((e.clientX - rect.left - pan.x) / SCALE),
      y: snapToGrid((e.clientY - rect.top - pan.y) / SCALE),
    };
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const pos = getPos(e);

    if (tool === "draw") {
      if (currentPoints.length >= 3) {
        const first = currentPoints[0];
        const dist = Math.sqrt((pos.x - first.x) ** 2 + (pos.y - first.y) ** 2);
        if (dist < 0.5) {
          setShapes(s => [...s, { id: Date.now().toString(), points: currentPoints, label: `Area ${s.length + 1}`, color: COLORS[activeShape % COLORS.length] }]);
          setCurrentPoints([]);
          setActiveShape(a => a + 1);
          return;
        }
      }
      setCurrentPoints(pts => [...pts, pos]);
    } else if (tool === "cutout") {
      const def = CUTOUT_DEFAULTS[cutoutType];
      setCutouts(cs => [...cs, { id: Date.now().toString(), type: cutoutType, x: pos.x - def.width / 2, y: pos.y - def.height / 2, width: def.width, height: def.height }]);
    } else if (tool === "seam") {
      if (!seamStart) {
        setSeamStart(pos);
      } else {
        setSeams(ss => [...ss, { id: Date.now().toString(), x1: seamStart.x, y1: seamStart.y, x2: pos.x, y2: pos.y }]);
        setSeamStart(null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
      return;
    }
    setHoverPoint(getPos(e));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) { setIsPanning(true); }
  };

  const handleMouseUp = () => setIsPanning(false);

  const cancelDraw = () => { setCurrentPoints([]); setSeamStart(null); };
  const undoLastPoint = () => { setCurrentPoints(pts => pts.slice(0, -1)); };

  const exportPDF = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${jobName || "layout"}-fabricor.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const reset = () => { setShapes([]); setCurrentPoints([]); setCutouts([]); setSeams([]); setActiveShape(0); setSeamStart(null); };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-72 bg-[#0d0d14] border-r border-zinc-800 flex flex-col flex-shrink-0 overflow-y-auto">
        <div className="px-5 py-5 border-b border-zinc-800">
          <h1 className="text-lg font-bold text-white mb-1">Layout Tool</h1>
          <p className="text-zinc-500 text-xs">Click to draw — close shape by clicking first point</p>
        </div>

        <div className="px-4 py-4 border-b border-zinc-800 space-y-3">
          <div>
            <label className="text-zinc-500 text-xs mb-1 block">Customer</label>
            <input type="text" placeholder="John Smith" value={customerName} onChange={e => setCustomerName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
          </div>
          <div>
            <label className="text-zinc-500 text-xs mb-1 block">Job Name</label>
            <input type="text" placeholder="Smith Kitchen" value={jobName} onChange={e => setJobName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
          </div>
        </div>

        <div className="px-4 py-4 border-b border-zinc-800">
          <div className="text-zinc-500 text-xs font-mono uppercase mb-3">Tool</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: "draw", icon: Square, label: "Draw" },
              { key: "cutout", icon: Circle, label: "Cutout" },
              { key: "seam", icon: Minus, label: "Seam" },
              { key: "select", icon: Move, label: "Pan" },
            ].map(({ key, icon: Icon, label }) => (
              <button key={key} onClick={() => { setTool(key as any); cancelDraw(); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${tool === key ? "bg-amber-500 text-black font-semibold" : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-700"}`}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
          {tool === "cutout" && (
            <div className="mt-3">
              <div className="text-zinc-500 text-xs mb-2">Cutout Type</div>
              <div className="space-y-1">
                {(["sink", "cooktop", "faucet"] as const).map(t => (
                  <button key={t} onClick={() => setCutoutType(t)}
                    className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${cutoutType === t ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-zinc-500 hover:text-zinc-300"}`}>
                    {CUTOUT_DEFAULTS[t].label} ({CUTOUT_DEFAULTS[t].width}' × {CUTOUT_DEFAULTS[t].height}')
                  </button>
                ))}
              </div>
            </div>
          )}
          {tool === "seam" && seamStart && (
            <div className="mt-3 bg-amber-950/30 border border-amber-800/30 rounded-lg px-3 py-2 text-xs text-amber-400">
              Seam started — click endpoint to finish
            </div>
          )}
          {currentPoints.length > 0 && (
            <div className="mt-3 space-y-2">
              <button onClick={undoLastPoint} className="w-full text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg px-3 py-2 transition-colors">↩ Undo Last Point</button>
              <button onClick={cancelDraw} className="w-full text-xs text-zinc-500 hover:text-red-400 transition-colors">Cancel Shape</button>
            </div>
          )}
        </div>

        <div className="px-4 py-4 border-b border-zinc-800">
          <div className="text-zinc-500 text-xs font-mono uppercase mb-3">Measurements</div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Gross Sq Ft</span>
              <span className="text-white font-mono">{totalSqft.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Cutouts</span>
              <span className="text-red-400 font-mono">-{cutoutSqft.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-zinc-800 pt-2">
              <span className="text-zinc-300 font-medium">Net Sq Ft</span>
              <span className="text-amber-400 font-mono font-bold text-lg">{netSqft.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Seams</span>
              <span className="text-blue-400 font-mono">{seams.length}</span>
            </div>
          </div>
        </div>

        {shapes.length > 0 && (
          <div className="px-4 py-4 border-b border-zinc-800">
            <div className="text-zinc-500 text-xs font-mono uppercase mb-3">Areas</div>
            <div className="space-y-2">
              {shapes.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.color }} />
                    <input type="text" value={s.label} onChange={e => setShapes(ss => ss.map(sh => sh.id === s.id ? { ...sh, label: e.target.value } : sh))}
                      className="bg-transparent text-zinc-300 text-xs focus:outline-none border-b border-transparent focus:border-zinc-600 w-24" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-xs font-mono">{polygonArea(s.points).toFixed(2)} sf</span>
                    <button onClick={() => setShapes(ss => ss.filter(sh => sh.id !== s.id))} className="text-zinc-700 hover:text-red-400 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 py-4 space-y-2 mt-auto">
          <button onClick={exportPDF}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg py-2.5 text-sm">
            <Download size={14} /> Export PNG
          </button>
          <button onClick={reset}
            className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-2.5 text-sm">
            <RotateCcw size={14} /> Clear All
          </button>
        </div>

        <div className="px-4 pb-4">
          <div className="bg-zinc-900 rounded-lg p-3 text-xs text-zinc-500 space-y-1">
            <div>• Click to place points</div>
            <div>• Click first point to close shape</div>
            <div>• Grid snaps to 0.5 ft</div>
            <div>• Alt+drag or middle click to pan</div>
            <div>• Yellow dashes = seams</div>
            <div>• Red dashes = cutouts</div>
          </div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={window.innerWidth - 288}
        height={window.innerHeight}
        className="flex-1 cursor-crosshair"
        style={{ background: "#0a0a0f" }}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setHoverPoint(null)}
      />
    </div>
  );
}
