import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Upload, X, Trash2, Image } from "lucide-react";

const PHOTO_TYPES = ["before", "after", "issue", "material", "general"];

export default function PhotoUpload({ jobId }: { jobId: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [photoType, setPhotoType] = useState("before");
  const [caption, setCaption] = useState("");

  const { data: photos = [] } = useQuery({
    queryKey: ["/api/jobs", jobId, "photos"],
    queryFn: () => fetch(`/api/jobs/${jobId}/photos`, { credentials: "include" }).then(r => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (photoId: string) => fetch(`/api/jobs/${jobId}/photos/${photoId}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/jobs", jobId, "photos"] }),
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const dataUrl = evt.target?.result as string;
        await fetch(`/api/jobs/${jobId}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ dataUrl, photoType, caption }),
        });
        qc.invalidateQueries({ queryKey: ["/api/jobs", jobId, "photos"] });
        setCaption("");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch { setUploading(false); }
    e.target.value = "";
  };

  const typeColors: Record<string, string> = {
    before: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    after: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    issue: "bg-red-500/20 text-red-400 border-red-500/30",
    material: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    general: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-zinc-300 font-semibold text-sm flex items-center gap-2">
          <Image size={14} className="text-amber-400" /> Photos ({(photos as any[]).length})
        </h3>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        <select value={photoType} onChange={e => setPhotoType(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500">
          {PHOTO_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <input type="text" placeholder="Caption (optional)" value={caption} onChange={e => setCaption(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold px-3 py-1.5 rounded-lg text-xs">
          {uploading ? "Uploading..." : <><Camera size={12} /> Add Photo</>}
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

      {(photos as any[]).length === 0 ? (
        <div className="border border-dashed border-zinc-700 rounded-xl p-6 text-center cursor-pointer hover:border-amber-500/40 transition-colors" onClick={() => fileRef.current?.click()}>
          <Camera size={24} className="text-zinc-600 mx-auto mb-2" />
          <div className="text-zinc-600 text-xs">Tap to add photos from camera or library</div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {(photos as any[]).map((photo: any) => (
            <div key={photo.id} className="relative group rounded-xl overflow-hidden aspect-square bg-zinc-900">
              <img src={photo.dataUrl} alt={photo.caption || photo.photoType} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button onClick={() => deleteMutation.mutate(photo.id)} className="p-1.5 bg-red-500 rounded-full">
                  <Trash2 size={12} className="text-white" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-1.5">
                <span className={`text-xs px-1.5 py-0.5 rounded border ${typeColors[photo.photoType] || typeColors.general}`}>
                  {photo.photoType}
                </span>
              </div>
            </div>
          ))}
          <div className="aspect-square border border-dashed border-zinc-700 rounded-xl flex items-center justify-center cursor-pointer hover:border-amber-500/40 transition-colors" onClick={() => fileRef.current?.click()}>
            <Camera size={20} className="text-zinc-600" />
          </div>
        </div>
      )}
    </div>
  );
}
