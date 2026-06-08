import { useState, useRef, useEffect } from "react";
import { Brain, Send, Mic, MicOff, ChevronRight } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "What's my biggest quality cost driver this week?",
  "Compare this week's issues to last week",
  "Which root cause is costing me the most?",
  "Give me 3 ways to reduce rework costs",
  "What would a 50% reduction in remakes save me annually?",
  "Analyze my shop's performance vs industry benchmarks",
  "Which sales rep has the most quality issues?",
  "What's my remake rate trending?",
];

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-4 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isUser ? "bg-zinc-700 text-zinc-300" : "bg-amber-500/20 border border-amber-500/30 text-amber-400"}`}>
        {isUser ? <span className="text-xs font-bold">You</span> : <Brain size={14} />}
      </div>
      <div className={`max-w-[80%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${isUser ? "bg-zinc-800 text-zinc-200 rounded-tr-none" : "bg-[#0d0d1a] border border-zinc-800 text-zinc-200 rounded-tl-none"}`}>
          {message.content.split("\n").map((line, i) => (
            <p key={i} className={line === "" ? "h-2" : ""}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Intelligence() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const content = text || input.trim();
    if (!content || loading) return;
    const userMessage: Message = { role: "user", content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch("/api/claude/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messages: newMessages, includeShopContext: true }),
      });
      const data = await response.json();
      if (data.content) setMessages(msgs => [...msgs, { role: "assistant", content: data.content }]);
    } catch {
      setMessages(msgs => [...msgs, { role: "assistant", content: "I'm having trouble connecting. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) { alert("Voice input requires Chrome."); return; }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.onresult = (e: any) => { setInput(e.results[0][0].transcript); setListening(false); };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
    setListening(true);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="px-8 py-6 border-b border-zinc-800/60 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/20">
            <Brain size={20} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Claude Intelligence</h1>
            <p className="text-zinc-500 text-sm">Your AI shop advisor — knows your data, speaks your language</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs text-zinc-500 font-mono">Shop context loaded</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center pb-20">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6">
              <Brain size={32} className="text-amber-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Talk to me, Claude</h2>
            <p className="text-zinc-500 max-w-md mb-10 text-sm leading-relaxed">
              I have real-time access to your shop data — your issues, costs, trends, and benchmarks. Ask me anything.
            </p>
            <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
              {QUICK_PROMPTS.map(prompt => (
                <button key={prompt} onClick={() => send(prompt)}
                  className="flex items-center gap-3 text-left bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-xl px-4 py-3 text-sm text-zinc-300 transition-all group">
                  <ChevronRight size={14} className="text-amber-500 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
            {loading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                  <Brain size={14} className="text-amber-400 animate-pulse" />
                </div>
                <div className="bg-[#0d0d1a] border border-zinc-800 rounded-xl rounded-tl-none px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 150, 300].map(delay => (
                      <div key={delay} className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-8 pb-8 flex-shrink-0">
        {messages.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {QUICK_PROMPTS.slice(0, 4).map(prompt => (
              <button key={prompt} onClick={() => send(prompt)}
                className="text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-lg px-3 py-1.5 transition-colors">
                {prompt.length > 40 ? prompt.slice(0, 40) + "…" : prompt}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-3 bg-[#0d0d14] border border-zinc-700 rounded-2xl p-3">
          <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder="Ask about your shop's issues, costs, trends..." rows={1}
            className="flex-1 bg-transparent text-white placeholder-zinc-600 text-sm resize-none focus:outline-none max-h-32 min-h-[24px]"
            style={{ scrollbarWidth: "none" }} />
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={startListening}
              className={`p-2 rounded-lg transition-colors ${listening ? "bg-red-500/20 text-red-400" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"}`}>
              {listening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button onClick={() => send()} disabled={!input.trim() || loading}
              className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black transition-colors">
              <Send size={16} />
            </button>
          </div>
        </div>
        <div className="text-center mt-2 text-zinc-700 text-xs">Press Enter to send · Shift+Enter for new line</div>
      </div>
    </div>
  );
}
