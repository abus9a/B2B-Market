"use client";
import Link from "next/link";
import { Heart, Package } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { favoritesApi } from "@/lib/api";
import { useState } from "react";

interface Product {
  id: number;
  title: string;
  category: string;
  price: number;
  stock: number;
  images: string[];
  seller?: { full_name: string; company_name?: string };
}

export function ProductCard({ product, isFavorited = false }: { product: Product; isFavorited?: boolean }) {
  const [favorited, setFavorited] = useState(isFavorited);
  const [loading, setLoading] = useState(false);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (favorited) {
        await favoritesApi.remove(product.id);
        setFavorited(false);
      } else {
        await favoritesApi.add(product.id);
        setFavorited(true);
      }
    } catch {}
    setLoading(false);
  };

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="group hover:shadow-md transition-shadow h-full flex flex-col">
        <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden flex items-center justify-center">
          {product.images[0] ? (
            <img src={product.images[0]} alt={product.title} className="object-cover w-full h-full" />
          ) : (
            <Package className="h-12 w-12 text-muted-foreground" />
          )}
          <button
            onClick={toggleFavorite}
            disabled={loading}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors"
          >
            <Heart className={`h-4 w-4 ${favorited ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
          </button>
        </div>
        <CardContent className="p-4 flex-1">
          <Badge variant="secondary" className="mb-2 text-xs">{product.category}</Badge>
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">{product.title}</h3>
          {product.seller && (
            <p className="text-xs text-muted-foreground mt-1">{product.seller.company_name || product.seller.full_name}</p>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <span className="font-bold text-primary">{formatPrice(product.price)}</span>
          <span className="text-xs text-muted-foreground">Stock: {product.stock}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
