import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, Trash2 } from "lucide-react";

export default function JobNotes({ jobId }: { jobId: string }) {
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const { data: notes = [] } = useQuery({
    queryKey: ["/api/jobs", jobId, "notes"],
    queryFn: () => fetch(`/api/jobs/${jobId}/notes`, { credentials: "include" }).then(r => r.json()),
  });
  const addMutation = useMutation({
    mutationFn: (note: string) => fetch(`/api/jobs/${jobId}/notes`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ note, author: "Shop" }),
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/jobs", jobId, "notes"] }); setNote(""); },
  });
  const deleteMutation = useMutation({
    mutationFn: (noteId: string) => fetch(`/api/jobs/${jobId}/notes/${noteId}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/jobs", jobId, "notes"] }),
  });
  const handleSubmit = () => { if (note.trim()) addMutation.mutate(note.trim()); };
  return (
    <div className="mt-4">
      <h3 className="text-zinc-300 font-semibold text-sm flex items-center gap-2 mb-3">
        <MessageSquare size={14} className="text-amber-400" /> Notes ({(notes as any[]).length})
      </h3>
      <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
        {(notes as any[]).length === 0 && (
          <div className="text-zinc-600 text-xs py-2">No notes yet — add internal notes for your team</div>
        )}
        {(notes as any[]).map((n: any) => (
          <div key={n.id} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 group">
            <div className="flex items-start justify-between gap-2">
              <p className="text-zinc-300 text-xs leading-relaxed flex-1">{n.note}</p>
              <button onClick={() => deleteMutation.mutate(n.id)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all flex-shrink-0">
                <Trash2 size={11} />
              </button>
            </div>
            <div className="text-zinc-600 text-xs mt-1">{n.author} · {new Date(n.created_at).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="text" placeholder="Add a note for your team..." value={note} onChange={e => setNote(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-xs" />
        <button onClick={handleSubmit} disabled={!note.trim() || addMutation.isPending}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black p-2 rounded-lg transition-colors">
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}
