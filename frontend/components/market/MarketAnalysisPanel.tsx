"use client";
import { useEffect, useState } from "react";
import { analyticsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface MarketAnalysisPanelProps {
  category: string;
  productId?: number;
}

export function MarketAnalysisPanel({ category, productId }: MarketAnalysisPanelProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    analyticsApi.market(category, productId)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category, productId]);

  if (loading) return <div className="animate-pulse h-48 bg-muted rounded-lg" />;
  if (!data) return null;

  const { stats, histogram, trend, deal_score } = data;

  return (
    <div className="space-y-4">
      {deal_score && (
        <DealScoreBadge score={deal_score} />
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Avg Price" value={formatPrice(stats.avg_price)} />
        <StatCard label="Median" value={formatPrice(stats.median_price)} />
        <StatCard label="Min" value={formatPrice(stats.min_price)} />
        <StatCard label="Max" value={formatPrice(stats.max_price)} />
      </div>

      <Tabs defaultValue="distribution">
        <TabsList>
          <TabsTrigger value="distribution">Price Distribution</TabsTrigger>
          <TabsTrigger value="trend">Price Trend</TabsTrigger>
        </TabsList>
        <TabsContent value="distribution">
          <Card>
            <CardHeader><CardTitle className="text-sm">Price Distribution — {category}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={histogram} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="range_start" tickFormatter={v => `$${v}`} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [v, "Products"]} labelFormatter={l => `$${l}`} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="trend">
          <Card>
            <CardHeader><CardTitle className="text-sm">30-Day Price Trend</CardTitle></CardHeader>
            <CardContent>
              {trend.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No trend data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                    <Tooltip formatter={(v: number) => [formatPrice(v), "Avg Price"]} />
                    <Line type="monotone" dataKey="avg_price" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function DealScoreBadge({ score }: { score: any }) {
  const isGood = score.score >= 70;
  const isFair = score.score >= 40;
  const variant = isGood ? "success" : isFair ? "warning" : "destructive";
  const Icon = score.price_diff_pct < 0 ? TrendingDown : score.price_diff_pct > 0 ? TrendingUp : Minus;

  return (
    <Card className="border-2" style={{ borderColor: isGood ? "#22c55e" : isFair ? "#f59e0b" : "#ef4444" }}>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Deal Score</p>
          <p className="text-2xl font-bold">{score.score}/100</p>
          <Badge variant={variant as any}>{score.label}</Badge>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-sm">
            <Icon className="h-4 w-4" />
            <span className={score.price_diff_pct < 0 ? "text-green-600" : "text-red-600"}>
              {Math.abs(score.price_diff_pct).toFixed(1)}% {score.price_diff_pct < 0 ? "below" : "above"} avg
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Market avg: {formatPrice(score.market_avg)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
