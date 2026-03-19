"use client";

import { useState } from "react";
import { Search, Loader2, TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";

export default function SentimentAnalysisPage() {
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [analyzedTicker, setAnalyzedTicker] = useState("");
  const [history, setHistory] = useState<any[]>([]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim()) return;

    setLoading(true);
    setError(null);
    setSummary(null);
    setHistory([]);

    const sentimentApiUrl = process.env.NEXT_PUBLIC_SENTIMENT_API_URL;
    if (!sentimentApiUrl) {
      setError("Sentiment API URL is not configured in .env");
      setLoading(false);
      return;
    }

    try {
      const analyzeRes = await fetch(`${sentimentApiUrl}/api/analyze-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock_name: ticker.toUpperCase() }),
      });

      if (!analyzeRes.ok) {
        let errorMsg = "Error analyzing stock. Server returned: " + analyzeRes.status;
        try {
            const errData = await analyzeRes.json();
            errorMsg = errData.error || errData.message || errorMsg;
        } catch (e) {
            // It might be HTML if backend returns a debug page or 404 proxy
        }
        throw new Error(errorMsg);
      }

      const analyzeData = await analyzeRes.json();
      setSummary(analyzeData.summary);
      setAnalyzedTicker(ticker.toUpperCase());

      const historyRes = await fetch(`${sentimentApiUrl}/api/get-analysis/${ticker.toUpperCase()}`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData.history || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch sentiment analysis.");
    } finally {
      setLoading(false);
    }
  };

  const renderTrendIcon = (trend: string) => {
    if (trend === "BULLISH") return <TrendingUp className="text-emerald-500 h-8 w-8" />;
    if (trend === "BEARISH") return <TrendingDown className="text-rose-500 h-8 w-8" />;
    return <Minus className="text-slate-500 h-8 w-8" />;
  };

  const renderTrendColor = (trend: string) => {
    if (trend === "BULLISH") return "text-emerald-500";
    if (trend === "BEARISH") return "text-rose-500";
    return "text-slate-500";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-headline font-black tracking-tight text-primary">
              AI Market Sentiment
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
              Analyze the latest financial news and discover hidden market trends powered by advanced NLP models.
            </p>
          </div>

          <Card className="border-border/60 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
            <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
            <CardContent className="p-8">
              <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Search className="h-6 w-6" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Enter stock ticker (e.g. AAPL, NVDA, TSLA)"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    className="pl-14 h-16 text-xl border-2 rounded-xl transition-all shadow-sm focus-visible:ring-primary focus-visible:border-primary bg-secondary/20"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="h-16 px-8 text-lg font-bold rounded-xl shadow-md transition-all sm:w-auto w-full group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center">
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    ) : (
                      <>
                        Analyze 
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                </Button>
              </form>
            </CardContent>
          </Card>

          {error && (
            <Card className="border-rose-500/30 bg-rose-500/10 shadow-sm animate-in fade-in slide-in-from-bottom-4">
              <CardContent className="p-6">
                <p className="text-rose-600 font-semibold text-center flex items-center justify-center gap-2 text-lg">
                  <span className="bg-rose-500 p-1 rounded-full text-white">!</span>
                  {error}
                </p>
              </CardContent>
            </Card>
          )}

          {summary && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
              <Card className="border-border/50 shadow-lg overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
                <CardHeader className="text-center pb-2 pt-8">
                  <CardDescription className="text-lg font-medium tracking-wide uppercase text-primary/80">
                    Live Sentiment Analysis
                  </CardDescription>
                  <CardTitle className="text-4xl font-black">{analyzedTicker}</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24">
                    <div className="text-center space-y-2">
                      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Daily Trend</p>
                      <div className="flex flex-col items-center gap-3">
                        <div className={`p-4 rounded-full bg-secondary/50 shadow-sm ${renderTrendColor(summary.daily_trend)}/10`}>
                          {renderTrendIcon(summary.daily_trend)}
                        </div>
                        <h3 className={`text-4xl font-black tracking-tight ${renderTrendColor(summary.daily_trend)}`}>
                          {summary.daily_trend}
                        </h3>
                      </div>
                    </div>
                    
                    <div className="hidden md:block w-px h-32 bg-border/60"></div>
                    
                    <div className="text-center space-y-2">
                      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Average Score</p>
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 rounded-full bg-secondary/50 shadow-sm text-primary">
                           <span className="text-3xl">🎯</span>
                        </div>
                        <h3 className="text-4xl font-black tracking-tight text-foreground">
                          {summary.avg_sentiment?.toFixed(2) || "N/A"}
                        </h3>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {history.length > 0 && (
                <Card className="border-border/50 shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Sentiment History
                    </CardTitle>
                    <CardDescription>Recent daily sentiment aggregations for {analyzedTicker}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {history.map((item, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-5 rounded-xl bg-card border border-border/40 hover:border-primary/30 transition-colors shadow-sm"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-secondary">
                              {renderTrendIcon(item.daily_trend)}
                            </div>
                            <div>
                              <p className="font-bold text-lg">{new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                              <p className={`text-sm font-bold tracking-wide uppercase ${renderTrendColor(item.daily_trend)}`}>
                                {item.daily_trend}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Score</p>
                            <p className="font-black text-xl">{item.avg_sentiment?.toFixed(2) || "N/A"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
