"use client";
import { useState } from "react";
import { MarketAnalysisPanel } from "@/components/market/MarketAnalysisPanel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const CATEGORIES = ["Electronics", "Industrial", "Raw Materials", "Textiles", "Chemicals", "Packaging"];

export default function SellerAnalyticsPage() {
  const [category, setCategory] = useState("Electronics");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Market Analytics</h1>
        <div className="flex items-center gap-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <MarketAnalysisPanel category={category} />
    </div>
  );
}
