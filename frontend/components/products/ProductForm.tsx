"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { productsApi } from "@/lib/api";

const CATEGORIES = ["Electronics", "Industrial", "Raw Materials", "Textiles", "Chemicals", "Packaging"];

interface ProductFormProps {
  initialData?: {
    id?: number;
    title: string;
    description: string;
    category: string;
    price: number;
    stock: number;
    images: string[];
    specs: Record<string, string>;
  };
  onSuccess?: () => void;
}

export function ProductForm({ initialData, onSuccess }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!initialData?.id;

  const [form, setForm] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    category: initialData?.category || "",
    price: initialData?.price?.toString() || "",
    stock: initialData?.stock?.toString() || "",
    images: initialData?.images?.join(", ") || "",
    specs: Object.entries(initialData?.specs || {}).map(([k, v]) => `${k}:${v}`).join(", "),
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const specs: Record<string, string> = {};
    form.specs.split(",").forEach(pair => {
      const [k, v] = pair.split(":").map(s => s.trim());
      if (k && v) specs[k] = v;
    });

    const data = {
      title: form.title,
      description: form.description,
      category: form.category,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
      images: form.images.split(",").map(s => s.trim()).filter(Boolean),
      specs,
    };

    try {
      if (isEdit) {
        await productsApi.update(initialData!.id!, data);
      } else {
        await productsApi.create(data);
      }
      onSuccess?.();
      router.push("/seller/products");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label>Title</Label>
          <Input value={form.title} onChange={set("title")} required placeholder="Product title" />
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Description</Label>
          <Textarea value={form.description} onChange={set("description")} required placeholder="Detailed description" rows={4} />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Price (USD)</Label>
          <Input type="number" step="0.01" value={form.price} onChange={set("price")} required placeholder="0.00" />
        </div>
        <div className="space-y-2">
          <Label>Stock</Label>
          <Input type="number" value={form.stock} onChange={set("stock")} required placeholder="0" />
        </div>
        <div className="space-y-2">
          <Label>Images (comma-separated URLs)</Label>
          <Input value={form.images} onChange={set("images")} placeholder="https://..." />
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Specs (key:value, comma-separated)</Label>
          <Input value={form.specs} onChange={set("specs")} placeholder="weight:10kg, color:red" />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
