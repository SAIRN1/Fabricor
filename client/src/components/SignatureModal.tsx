import { useRef, useState, useEffect } from "react";
import { Check, RotateCcw, X } from "lucide-react";

const SIGNOFF_STAGES = [
  { key: "pricing", label: "Preliminary Pricing" },
  { key: "template", label: "Template Approval" },
  { key: "slab_choice", label: "Slab Selection" },
  { key: "slab_layout", label: "Slab Layout" },
  { key: "installation", label: "Installation Complete" },
];

interface Props {
  jobName: string;
  customerName: string;
  onSave: (stage: string, signatureData: string) => void;
  onClose: () => void;
}

export default function SignatureModal({ jobName, customerName, onSave, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [stage, setStage] = useState("installation");
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    setIsEmpty(false);
    setLastPos(getPos(e, canvas));
  };

  const draw = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setLastPos(pos);
  };

  const stopDraw = (e: any) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;
    onSave(stage, canvas.toDataURL("image/png"));
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.85)" }}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-gray-900 font-bold text-base">Customer Sign-Off</h2>
            <p className="text-gray-500 text-sm">{jobName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="mb-4">
            <label className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-2 block">Sign-Off Stage</label>
            <div className="grid grid-cols-1 gap-1.5">
              {SIGNOFF_STAGES.map(s => (
                <button key={s.key} onClick={() => setStage(s.key)}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${stage === s.key ? "bg-amber-50 border border-amber-300 text-amber-800 font-semibold" : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
                  {stage === s.key ? "✓ " : ""}{s.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-gray-500 text-xs mb-2 text-center">
            I approve the <strong>{SIGNOFF_STAGES.find(s => s.key === stage)?.label}</strong> for {jobName}
          </p>

          <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white" style={{ touchAction: "none" }}>
            <canvas
              ref={canvasRef}
              width={480}
              height={160}
              className="w-full block"
              style={{ touchAction: "none", userSelect: "none" }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
          </div>
          <p className="text-gray-400 text-xs text-center mt-1">
            {customerName} · {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="px-5 pb-6 flex gap-3">
          <button onClick={clear}
            className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium">
            <RotateCcw size={15} /> Clear
          </button>
          <button onClick={save} disabled={isEmpty}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold rounded-xl text-sm">
            <Check size={15} /> Save Signature
          </button>
        </div>
      </div>
    </div>
  );
}
