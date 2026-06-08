import { useRef, useState, useEffect } from "react";
import { Check, RotateCcw, X } from "lucide-react";

interface SignatureCaptureProps {
  jobName: string;
  customerName: string;
  onSave: (signatureData: string) => void;
  onClose: () => void;
}

export default function SignatureCapture({ jobName, customerName, onSave, onClose }: SignatureCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    setIsEmpty(false);
    const pos = getPos(e, canvas);
    setLastPos(pos);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
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

  const stopDraw = () => setIsDrawing(false);

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
    onSave(canvas.toDataURL("image/png"));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-gray-900 font-bold text-lg">Customer Sign-Off</h2>
            <p className="text-gray-500 text-sm">{jobName} — {customerName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4">
          <p className="text-gray-600 text-sm mb-4 text-center">
            By signing below, I confirm that the work described above has been completed to my satisfaction.
          </p>
          <div className="border-2 border-gray-300 rounded-xl overflow-hidden touch-none">
            <canvas
              ref={canvasRef}
              width={480}
              height={200}
              className="w-full cursor-crosshair"
              style={{ touchAction: "none" }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
          </div>
          <div className="flex items-center justify-center mt-2">
            <div className="w-48 h-px bg-gray-300" />
            <span className="text-gray-400 text-xs mx-3">Sign above</span>
            <div className="w-48 h-px bg-gray-300" />
          </div>
          <p className="text-gray-400 text-xs text-center mt-1">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={clear}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors">
            <RotateCcw size={15} /> Clear
          </button>
          <button onClick={save} disabled={isEmpty}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold rounded-xl text-sm transition-colors">
            <Check size={15} /> Confirm & Save Signature
          </button>
        </div>
      </div>
    </div>
  );
}
