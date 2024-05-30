"use client";
import { useEffect, useState } from "react";
import { requestsApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, formatDate } from "@/lib/utils";
import { ClipboardList } from "lucide-react";

const STATUS_VARIANTS: Record<string, any> = {
  PENDING: "warning",
  QUOTED: "secondary",
  ACCEPTED: "success",
  REJECTED: "destructive",
  COMPLETED: "default",
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestsApi.list()
      .then(r => setRequests(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Purchase Requests</h1>
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No requests yet. Find products to request quotes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <Card key={r.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">Request #{r.id} · Product #{r.product_id}</p>
                  <p className="text-sm text-muted-foreground">Qty: {r.quantity} · {formatDate(r.created_at)}</p>
                  {r.message && <p className="text-sm mt-1 italic">{r.message}</p>}
                </div>
                <div className="text-right space-y-1">
                  <Badge variant={STATUS_VARIANTS[r.status]}>{r.status}</Badge>
                  {r.quoted_price && (
                    <p className="text-sm font-semibold">{formatPrice(r.quoted_price)}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
