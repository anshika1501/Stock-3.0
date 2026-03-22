"use client";

import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle, ShieldAlert, Sparkles } from "lucide-react";
import { chatWithStocks, ChatResponse } from "@/lib/stock-data";

const starterPrompts = [
  "What is the risk level for TCS vs INFY this month?",
  "Compare HDFCBANK.NS and ICICIBANK.NS and tell me which is better to buy now.",
  "Give me a diversified portfolio suggestion across 3 sectors.",
  "Is RELIANCE.NS overvalued? Should I buy or wait?",
];

export default function ChatbotPage() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = async () => {
    if (!query.trim()) {
      setError("Ask a question about one or more stocks.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await chatWithStocks(query.trim());
      setAnswer(res);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <main className="max-w-5xl mx-auto px-4 pb-20 pt-10">
        <Card className="border-none shadow-lg">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2 text-slate-700">
              <MessageCircle className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-xl">StockCompass Chatbot</CardTitle>
            </div>
            <p className="text-sm text-slate-500">
              Powered by pgvector + Gemini. Ask about risk, predictions, comparisons, and buy/hold/sell ideas.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Compare RELIANCE.NS and TCS.NS for the next month and suggest buy/hold/sell."
              rows={4}
            />
            <div className="flex flex-wrap gap-2">
              {starterPrompts.map((p) => (
                <Button
                  key={p}
                  variant="secondary"
                  size="sm"
                  onClick={() => setQuery(p)}
                  className="text-left"
                >
                  <Sparkles className="h-4 w-4 mr-1 text-amber-500" />
                  {p}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={ask} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ask"}
              </Button>
              {error && <span className="text-sm text-red-600">{error}</span>}
            </div>
            {answer && (
              <div className="mt-4 space-y-3">
                <div className="rounded-lg border bg-white p-4 prose max-w-none">
                  {answer.answer.split("\n").map((line, idx) => (
                    <p key={idx} className="text-slate-700 leading-relaxed">
                      {line}
                    </p>
                  ))}
                </div>
                <div className="rounded-lg border bg-slate-900 text-slate-50 p-3">
                  <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-wide text-slate-300">
                    <ShieldAlert className="h-4 w-4 text-amber-300" />
                    Sources (nearest stocks)
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {answer.sources.map((s) => (
                      <div key={s.symbol} className="rounded-md bg-slate-800/60 p-3 text-sm">
                        <div className="font-semibold">{s.symbol} — {s.name}</div>
                        <div className="text-slate-300 text-xs">Sector: {s.sector}</div>
                        <div className="text-slate-400 text-xs">Similarity: {(1 - s.distance).toFixed(3)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
