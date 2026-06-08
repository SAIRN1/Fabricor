import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Plus, X, Send, Brain, Copy, Check } from "lucide-react";

const EMAIL_TYPES = [
  { key: "template_confirmation", label: "Template Confirmation", desc: "Scheduled template appointment" },
  { key: "installation_confirmation", label: "Installation Confirmation", desc: "Upcoming installation details" },
  { key: "completion_followup", label: "Completion Follow-up", desc: "Thank you and care instructions" },
  { key: "dispute_letter", label: "Dispute Letter", desc: "Professional complaint response" },
  { key: "estimate", label: "Estimate", desc: "Formal project quote" },
  { key: "custom", label: "Custom Email", desc: "Write your own prompt" },
] as const;

export default function Emails() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({
    emailType: "template_confirmation",
    customerName: "",
    jobName: "",
    scheduledDate: "",
    stoneType: "",
    areas: "",
    salesRep: "",
    shopName: "",
    customPrompt: "",
  });
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null);

  const { data: emails = [] } = useQuery({
    queryKey: ["/api/emails"],
    queryFn: () => fetch("/api/emails", { credentials: "include" }).then(r => r.json()),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => fetch("/api/emails", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data), credentials: "include",
    }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/emails"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/emails/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/emails"] }),
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const generateEmail = async () => {
    setGenerating(true);
    setGeneratedEmail(null);
    try {
      const r = await fetch("/api/claude/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      const data = await r.json();
      setGeneratedEmail(data);
    } catch { setGeneratedEmail({ subject: "Error", body: "Could not generate email." }); }
    setGenerating(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const saveEmail = () => {
    if (!generatedEmail) return;
    saveMutation.mutate({
      emailType: form.emailType,
      subject: generatedEmail.subject,
      body: generatedEmail.body,
    });
    setGeneratedEmail(null);
    setShowForm(false);
    setForm({ emailType: "template_confirmation", customerName: "", jobName: "", scheduledDate: "", stoneType: "", areas: "", salesRep: "", shopName: "", customPrompt: "" });
  };

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Emails</h1>
          <p className="text-zinc-500 mt-1">Claude-generated professional emails for every stage of the job</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2.5 rounded-lg text-sm">
          <Plus size={16} /> Generate Email
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-zinc-700/60 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800">
              <h2 className="text-white font-semibold text-lg">Generate Email</h2>
              <button onClick={() => { setShowForm(false); setGeneratedEmail(null); }} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Email Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {EMAIL_TYPES.map(t => (
                    <button key={t.key} onClick={() => set("emailType", t.key)}
                      className={`text-left px-3 py-2.5 rounded-lg border transition-all ${form.emailType === t.key ? "bg-amber-500/15 border-amber-500/40 text-amber-400" : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600"}`}>
                      <div className="text-sm font-medium">{t.label}</div>
                      <div className="text-xs opacity-60 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {form.emailType === "custom" ? (
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Custom Prompt</label>
                  <textarea rows={4} placeholder="Describe the email you need Claude to write..." value={form.customPrompt} onChange={e => set("customPrompt", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 resize-none" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ["Customer Name", "customerName", "John Smith"],
                    ["Job Name", "jobName", "Smith Kitchen"],
                    ["Scheduled Date", "scheduledDate", "Tuesday June 10"],
                    ["Stone Type", "stoneType", "Calacatta Quartz"],
                    ["Areas", "areas", "Kitchen, Master Bath"],
                    ["Sales Rep", "salesRep", "Kelley"],
                  ].map(([label, key, ph]) => (
                    <div key={key}>
                      <label className="text-zinc-400 text-xs mb-1.5 block">{label}</label>
                      <input type="text" placeholder={ph} value={(form as any)[key]} onChange={e => set(key, e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                    </div>
                  ))}
                  <div className="col-span-2">
                    <label className="text-zinc-400 text-xs mb-1.5 block">Shop Name</label>
                    <input type="text" placeholder="Bradley Stone Industries" value={form.shopName} onChange={e => set("shopName", e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                  </div>
                </div>
              )}

              {!generatedEmail ? (
                <button onClick={generateEmail} disabled={generating}
                  className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold rounded-lg py-2.5 text-sm flex items-center justify-center gap-2">
                  {generating ? (
                    <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />Generating...</>
                  ) : (
                    <><Brain size={16} />Generate with Claude</>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-zinc-500 text-xs font-mono uppercase">Subject</span>
                      <button onClick={() => copyToClipboard(generatedEmail.subject, "subject")}
                        className="text-zinc-500 hover:text-amber-400 transition-colors">
                        {copied === "subject" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className="text-white text-sm font-medium">{generatedEmail.subject}</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-zinc-500 text-xs font-mono uppercase">Body</span>
                      <button onClick={() => copyToClipboard(generatedEmail.body, "body")}
                        className="text-zinc-500 hover:text-amber-400 transition-colors">
                        {copied === "body" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <pre className="text-zinc-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">{generatedEmail.body}</pre>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setGeneratedEmail(null)}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-2.5 text-sm">
                      Regenerate
                    </button>
                    <button onClick={() => copyToClipboard(`Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`, "all")}
                      className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg py-2.5 text-sm flex items-center justify-center gap-2">
                      {copied === "all" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      Copy All
                    </button>
                    <button onClick={saveEmail}
                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg py-2.5 text-sm flex items-center justify-center gap-2">
                      <Send size={14} /> Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-8">
        {EMAIL_TYPES.slice(0, 5).map(type => (
          <div key={type.key} onClick={() => { setForm(f => ({ ...f, emailType: type.key })); setShowForm(true); }}
            className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-5 cursor-pointer hover:border-amber-500/30 transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                <Mail size={16} className="text-amber-400" />
              </div>
              <div className="text-white font-medium text-sm">{type.label}</div>
            </div>
            <p className="text-zinc-500 text-xs">{type.desc}</p>
            <div className="mt-3 text-amber-400 text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
              <Brain size={11} /> Generate with Claude →
            </div>
          </div>
        ))}
        <div onClick={() => { setForm(f => ({ ...f, emailType: "custom" })); setShowForm(true); }}
          className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-5 cursor-pointer hover:border-amber-500/30 transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 group-hover:bg-amber-500/10 group-hover:border-amber-500/20 transition-colors">
              <Plus size={16} className="text-zinc-400 group-hover:text-amber-400 transition-colors" />
            </div>
            <div className="text-white font-medium text-sm">Custom Email</div>
          </div>
          <p className="text-zinc-500 text-xs">Describe what you need and Claude writes it</p>
          <div className="mt-3 text-amber-400 text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
            <Brain size={11} /> Generate with Claude →
          </div>
        </div>
      </div>

      {(emails as any[]).length > 0 && (
        <div>
          <h2 className="text-white font-semibold mb-4">Saved Emails</h2>
          <div className="space-y-3">
            {(emails as any[]).map((email: any) => (
              <div key={email.id} className="bg-[#0d0d14] border border-zinc-800/60 rounded-xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-950/40 border border-amber-900/60 text-amber-400 font-mono uppercase">
                      {email.emailType.replace(/_/g, " ")}
                    </span>
                    <div className="text-white font-medium mt-2">{email.subject}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => copyToClipboard(`Subject: ${email.subject}\n\n${email.body}`, email.id)}
                      className="p-1.5 text-zinc-500 hover:text-amber-400 transition-colors">
                      {copied === email.id ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                    </button>
                    <button onClick={() => deleteMutation.mutate(email.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors">
                      <X size={15} />
                    </button>
                  </div>
                </div>
                <p className="text-zinc-500 text-sm line-clamp-2">{email.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
