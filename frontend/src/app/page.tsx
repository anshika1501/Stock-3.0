import Navigation from "@/components/Navigation";
import Link from "next/link";
import { Briefcase, BarChart2, Activity, GitCompare, Bitcoin, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default function Home() {
  const cards = [
    {
      title: "Portfolios",
      description: "Access curated industry portfolios and track performance.",
      icon: Briefcase,
      href: "/portfolios",
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      title: "Nifty 50",
      description: "Real-time metrics and insights for top 50 Indian companies.",
      icon: BarChart2,
      href: "/stocks",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
    {
      title: "Stock Analysis",
      description: "Advanced PCA and K-Means clustering for Nifty 50 stocks.",
      icon: Activity,
      href: "/nifty50-pca",
      color: "text-indigo-500",
      bg: "bg-indigo-500/10"
    },
    {
      title: "Compare",
      description: "Side-by-side comparison of multiple stocks and metrics.",
      icon: GitCompare,
      href: "/compare",
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    },
    {
      title: "Bitcoin, Gold & Silver",
      description: "Live prices, predictive trajectory, and ML forecasting.",
      icon: Bitcoin,
      href: "/gold-silver",
      color: "text-rose-500",
      bg: "bg-rose-500/10"
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navigation />

      <main className="container mx-auto px-4 mt-20 max-w-6xl">
        <section className="text-center mb-20 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
          <h1 className="text-5xl md:text-7xl font-bold font-headline text-primary mb-6 tracking-tight relative z-10">
            Navigate the markets with <span className="text-accent text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">StockCompass</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto relative z-10">
            Your all-in-one platform for AI-powered market insights, advanced stock clustering, and predictive trajectory forecasting.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {cards.map((card, idx) => (
            <Link key={idx} href={card.href} className="block group">
              <Card className="h-full hover:shadow-xl transition-all duration-300 hover:border-primary/40 relative overflow-hidden bg-white/60 backdrop-blur-md">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${card.bg}`}>
                    <card.icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-muted-foreground mb-6">
                    {card.description}
                  </CardDescription>
                  <div className="flex items-center text-sm font-semibold text-primary mt-auto">
                    Explore <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
