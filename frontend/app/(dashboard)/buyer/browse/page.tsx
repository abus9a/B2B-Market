"use client";
import { useEffect, useState } from "react";
import { productsApi, favoritesApi } from "@/lib/api";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductFilters } from "@/components/products/ProductFilters";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

export default function BrowsePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);

  const load = (f = filters, p = 1) => {
    setLoading(true);
    productsApi.list({ ...f, page: p, page_size: 20 })
      .then(r => {
        setProducts(r.data.items);
        setTotal(r.data.total);
        setPages(r.data.pages);
        setPage(p);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    favoritesApi.list().then(r => setFavorites(new Set(r.data.map((p: any) => p.id)))).catch(() => {});
  }, []);

  const handleFilter = (f: object) => {
    setFilters(f);
    load(f, 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Browse Products</h1>
        <span className="text-sm text-muted-foreground">{total} products</span>
      </div>

      <ProductFilters onFilter={handleFilter} />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No products found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map(p => (
              <ProductCard key={p.id} product={p} isFavorited={favorites.has(p.id)} />
            ))}
          </div>
          {pages > 1 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => load(filters, page - 1)}>
                Previous
              </Button>
              <span className="text-sm self-center">Page {page} of {pages}</span>
              <Button variant="outline" size="sm" disabled={page === pages} onClick={() => load(filters, page + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
