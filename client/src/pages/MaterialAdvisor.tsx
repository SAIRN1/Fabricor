import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Home, Palette, ChevronRight, RefreshCw } from "lucide-react";

const QUESTIONS = [
  { key: "cabinetColor", label: "Cabinet Color", options: ["White", "Off-White/Cream", "Gray", "Navy/Blue", "Green", "Black", "Wood/Natural", "Two-tone"] },
  { key: "flooringType", label: "Flooring Type", options: ["Light Wood", "Dark Wood", "White Tile", "Gray Tile", "Beige/Neutral Tile", "Concrete", "Carpet"] },
  { key: "lightingStyle", label: "Kitchen Lighting", options: ["Very bright/lots of windows", "Moderate natural light", "Mostly artificial light", "Dark/moody space"] },
  { key: "designStyle", label: "Design Style", options: ["Modern/Contemporary", "Traditional/Classic", "Farmhouse/Rustic", "Transitional", "Industrial", "Coastal/Light"] },
  { key: "primaryUse", label: "Primary Use", options: ["Heavy cooking daily", "Moderate cooking", "Light cooking/entertaining", "Rental/investment property"] },
  { key: "budget", label: "Budget Range", options: ["Value ($40-60/sqft)", "Mid-range ($60-90/sqft)", "Premium ($90-130/sqft)", "Luxury ($130+/sqft)"] },
  { key: "maintenance", label: "Maintenance Preference", options: ["Zero maintenance", "Minimal (annual sealing ok)", "Moderate (regular care)", "Happy to maintain natural stone"] },
  { key: "priority", label: "Top Priority", options: ["Durability above all", "Looks/aesthetics", "Unique/natural variation", "Easy cleaning", "Heat resistance"] },
];

export default function MaterialAdvisor() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState("");
  const [step, setStep] = useState(0);

  const isComplete = QUESTIONS.every(q => answers[q.key]);

  const mutation = useMutation({
    mutationFn: async () => {
      const prompt = `You are an expert stone fabrication consultant helping a homeowner choose the perfect countertop material.

Customer's answers:
- Cabinet color: ${answers.cabinetColor}
- Flooring type: ${answers.flooringType}
- Lighting: ${answers.lightingStyle}
- Design style: ${answers.designStyle}
- Primary use: ${answers.primaryUse}
- Budget: ${answers.budget}
- Maintenance preference: ${answers.maintenance}
- Top priority: ${answers.priority}

Provide:
1. Your TOP recommendation (specific material + 2-3 color/pattern suggestions that match their space)
2. Why it's perfect for their specific situation
3. Your SECOND recommendation as an alternative
4. One material to AVOID and why
5. Estimated price range for their budget
6. Care tips specific to your recommendation

Be specific, practical, and enthusiastic. Name actual stone colors/patterns like "Calacatta Laza Quartz" or "White Ice Granite". Format with clear sections.`;

      const r = await fetch("/api/claude/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ message: prompt }),
      });
      const data = await r.json();
      return data.response || data.message;
    },
    onSuccess: (data) => setResult(data),
  });

  const currentQuestion = QUESTIONS[step];
  const progress = (Object.keys(answers).length / QUESTIONS.length) * 100;

  const handleAnswer = (key: string, value: string) => {
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);
    if (step < QUESTIONS.length - 1) setTimeout(() => setStep(s => s + 1), 300);
  };

  const reset = () => { setAnswers({}); setResult(""); setStep(0); };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">AI Material Advisor</h1>
        <p className="text-zinc-500 mt-1">Answer 8 questions — Claude recommends the perfect stone for your customer's space</p>
      </div>

      {!result ? (
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-400 text-xs uppercase tracking-wider">Progress</span>
                <span className="text-zinc-400 text-xs">{Object.keys(answers).length}/{QUESTIONS.length}</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-6">
                <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>

              <h2 className="text-white font-semibold text-lg mb-4">{currentQuestion.label}</h2>
              <div className="space-y-2">
                {currentQuestion.options.map(option => (
                  <button key={option} onClick={() => handleAnswer(currentQuestion.key, option)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${answers[currentQuestion.key] === option ? "border-amber-500 bg-amber-500/10 text-amber-300" : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500"}`}>
                    {option}
                  </button>
                ))}
              </div>

              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)} className="mt-4 text-zinc-500 text-xs hover:text-zinc-300">← Back</button>
              )}
            </div>

            {isComplete && (
              <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-3.5 rounded-xl text-sm transition-colors">
                {mutation.isPending ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />Analyzing space...</> : <><Sparkles size={16} />Get AI Recommendation</>}
              </button>
            )}
          </div>

          <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-2xl p-6">
            <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-4">Your Answers So Far</h3>
            <div className="space-y-2">
              {QUESTIONS.map((q, i) => (
                <div key={q.key} className={`flex items-center justify-between py-2 border-b border-zinc-800/40 cursor-pointer hover:bg-zinc-900/30 px-2 rounded-lg transition-colors ${i === step ? 'bg-zinc-900/30' : ''}`}
                  onClick={() => setStep(i)}>
                  <span className="text-zinc-500 text-xs">{q.label}</span>
                  <span className={`text-xs ${answers[q.key] ? 'text-amber-400 font-medium' : 'text-zinc-700'}`}>
                    {answers[q.key] || "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="bg-[#0d0d14] border border-zinc-800/60 rounded-2xl p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-amber-400" />
              <h2 className="text-white font-semibold">AI Stone Recommendation</h2>
            </div>
            <div className="bg-zinc-900 rounded-xl p-4 max-h-[600px] overflow-y-auto">
              <pre className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">{result}</pre>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={reset} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold px-5 py-3 rounded-xl text-sm">
              <RefreshCw size={14} /> Start Over
            </button>
            <button onClick={() => { navigator.clipboard.writeText(result); }}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-3 rounded-xl text-sm">
              Copy Recommendation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
