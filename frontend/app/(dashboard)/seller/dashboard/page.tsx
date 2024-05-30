"use client";
import { useEffect, useState } from "react";
import { analyticsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { Package, Eye, MessageSquare, BarChart3 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SellerDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.sellerDashboard()
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Seller Dashboard</h1>
        <Link href="/seller/products/new">
          <Button>+ New Product</Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Package} label="Products" value={stats?.total_products || 0} />
            <StatCard icon={Eye} label="Total Views" value={stats?.total_views || 0} />
            <Link href="/chat"><StatCard icon={MessageSquare} label="Inquiries" value={stats?.total_inquiries || 0} /></Link>
            <StatCard icon={BarChart3} label="Revenue" value={formatPrice(stats?.total_revenue || 0)} />
          </div>

          <Card>
            <CardHeader><CardTitle>Top Products by Views</CardTitle></CardHeader>
            <CardContent>
              {(!stats?.top_products || stats.top_products.length === 0) ? (
                <p className="text-muted-foreground text-sm">No products yet. <Link href="/seller/products/new" className="text-primary underline">Create one</Link></p>
              ) : (
                <div className="space-y-2">
                  {stats.top_products.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{p.views} views</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatPrice(p.price)}</p>
                        <Link href={`/products/${p.id}`} className="text-xs text-primary hover:underline">View</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <Icon className="h-8 w-8 text-primary/20" />
        </div>
      </CardContent>
    </Card>
  );
}
