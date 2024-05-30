"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { productsApi } from "@/lib/api";
import { ProductForm } from "@/components/products/ProductForm";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsApi.get(Number(id))
      .then(r => setProduct(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="animate-pulse h-96 bg-muted rounded-lg" />;
  if (!product) return <p className="text-muted-foreground">Product not found</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Product</h1>
      <ProductForm initialData={product} />
    </div>
  );
}
