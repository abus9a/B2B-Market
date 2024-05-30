"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { productsApi } from "@/lib/api";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Package } from "lucide-react";

export default function SellerProductsPage() {
  const user = useAuthStore((s) => s.user);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!user) return;
    productsApi.list({ seller_id: user.id, page_size: 100 })
      .then(r => setProducts(r.data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    await productsApi.delete(id);
    setProducts(p => p.filter(x => x.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Products</h1>
        <Link href="/seller/products/new">
          <Button>+ New Product</Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No products yet.</p>
          <Link href="/seller/products/new">
            <Button className="mt-4">Create your first product</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                  {p.images[0] ? <img src={p.images[0]} alt="" className="object-cover w-full h-full" /> : <Package className="h-6 w-6 text-muted-foreground" />}
                </div>
                <div>
                  <p className="font-medium text-sm">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.category} · ${p.price} · {p.view_count} views</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/products/${p.id}`}><Button variant="ghost" size="sm">View</Button></Link>
                <Link href={`/seller/products/${p.id}/edit`}><Button variant="outline" size="sm">Edit</Button></Link>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
