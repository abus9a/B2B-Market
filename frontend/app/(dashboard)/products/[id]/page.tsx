"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { productsApi, requestsApi, reviewsApi, chatApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MarketAnalysisPanel } from "@/components/market/MarketAnalysisPanel";
import { formatPrice, formatDate } from "@/lib/utils";
import { Package, MessageSquare, Star } from "lucide-react";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestForm, setRequestForm] = useState({ quantity: "1", message: "" });
  const [reviewForm, setReviewForm] = useState({ rating: "5", comment: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    Promise.all([
      productsApi.get(Number(id)),
      reviewsApi.forProduct(Number(id)),
    ]).then(([prodRes, revRes]) => {
      setProduct(prodRes.data);
      setReviews(revRes.data);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await requestsApi.create({
        product_id: product.id,
        quantity: parseInt(requestForm.quantity),
        message: requestForm.message || undefined,
      });
      setSuccess("Quote request sent!");
      setRequestForm({ quantity: "1", message: "" });
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to send request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const rev = await reviewsApi.create({
        product_id: product.id,
        rating: parseInt(reviewForm.rating),
        comment: reviewForm.comment || undefined,
      });
      setReviews(r => [...r, rev.data]);
      setReviewForm({ rating: "5", comment: "" });
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const startChat = async () => {
    if (!product) return;
    try {
      const { data } = await chatApi.start(product.seller_id);
      router.push(`/chat?conv=${data.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to start chat");
    }
  };

  if (loading) return (
    <div className="space-y-4">
      <div className="h-64 bg-muted animate-pulse rounded-lg" />
      <div className="h-40 bg-muted animate-pulse rounded-lg" />
    </div>
  );

  if (!product) return <p className="text-muted-foreground">Product not found.</p>;

  const isBuyer = user?.role === "BUYER";
  const isSeller = user?.role === "SELLER";
  const isOwnProduct = isSeller && product.seller_id === user?.id;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="aspect-video rounded-lg bg-muted overflow-hidden flex items-center justify-center">
          {product.images[0] ? (
            <img src={product.images[0]} alt={product.title} className="object-cover w-full h-full" />
          ) : (
            <Package className="h-16 w-16 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-3">
          <Badge variant="secondary">{product.category}</Badge>
          <h1 className="text-2xl font-bold">{product.title}</h1>
          <p className="text-3xl font-bold text-primary">{formatPrice(product.price)}</p>
          <p className="text-sm text-muted-foreground">
            by {product.seller?.company_name || product.seller?.full_name}
          </p>
          <p className="text-sm">
            Stock: <strong>{product.stock}</strong> units
            · <span className="text-muted-foreground">{product.view_count} views</span>
          </p>
          <p className="text-sm leading-relaxed">{product.description}</p>

          {Object.keys(product.specs || {}).length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-semibold">Specifications</p>
              {Object.entries(product.specs).map(([k, v]) => (
                <div key={k} className="flex gap-2 text-sm">
                  <span className="text-muted-foreground capitalize">{k}:</span>
                  <span>{String(v)}</span>
                </div>
              ))}
            </div>
          )}

          {isBuyer && (
            <div className="flex gap-2 pt-2">
              <Button onClick={startChat} variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />Contact Seller
              </Button>
            </div>
          )}
          {isOwnProduct && (
            <Button variant="outline" onClick={() => router.push(`/seller/products/${product.id}/edit`)}>
              Edit Product
            </Button>
          )}
        </div>
      </div>

      {/* Market Analysis */}
      <Card>
        <CardHeader><CardTitle>Market Analysis — {product.category}</CardTitle></CardHeader>
        <CardContent>
          <MarketAnalysisPanel category={product.category} productId={product.id} />
        </CardContent>
      </Card>

      {/* Quote Request (buyers only) */}
      {isBuyer && (
        <Card>
          <CardHeader><CardTitle>Request a Quote</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleRequest} className="space-y-3 max-w-sm">
              <div className="space-y-1">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={requestForm.quantity}
                  onChange={e => setRequestForm(f => ({ ...f, quantity: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Message (optional)</Label>
                <Textarea
                  value={requestForm.message}
                  onChange={e => setRequestForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Any specific requirements..."
                  rows={3}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}
              <Button type="submit" disabled={submitting}>
                {submitting ? "Sending..." : "Send Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reviews */}
      <Card>
        <CardHeader><CardTitle>Reviews ({reviews.length})</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
          {reviews.map(r => (
            <div key={r.id} className="border-b pb-3 last:border-0">
              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                ))}
                <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
              </div>
              {r.comment && <p className="text-sm mt-1">{r.comment}</p>}
            </div>
          ))}

          {isBuyer && (
            <form onSubmit={handleReview} className="space-y-3 pt-4 border-t">
              <p className="font-medium text-sm">Write a Review</p>
              <div className="space-y-1">
                <Label>Rating (1–5)</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={reviewForm.rating}
                  onChange={e => setReviewForm(f => ({ ...f, rating: e.target.value }))}
                  className="w-24"
                />
              </div>
              <div className="space-y-1">
                <Label>Comment</Label>
                <Textarea
                  value={reviewForm.comment}
                  onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                  placeholder="Your experience..."
                  rows={2}
                />
              </div>
              <Button type="submit" size="sm" disabled={submitting}>Submit Review</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
