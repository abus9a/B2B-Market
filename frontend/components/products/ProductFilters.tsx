"use client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useState } from "react";

const CATEGORIES = ["Electronics", "Industrial", "Raw Materials", "Textiles", "Chemicals", "Packaging"];

interface Filters {
  search: string;
  category: string;
  min_price: string;
  max_price: string;
}

interface ProductFiltersProps {
  onFilter: (filters: Partial<Filters>) => void;
}

export function ProductFilters({ onFilter }: ProductFiltersProps) {
  const [filters, setFilters] = useState<Filters>({ search: "", category: "", min_price: "", max_price: "" });

  const update = (key: keyof Filters) => (value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
  };

  const apply = () => {
    onFilter({
      ...(filters.search && { search: filters.search }),
      ...(filters.category && filters.category !== "all" && { category: filters.category }),
      ...(filters.min_price && { min_price: filters.min_price }),
      ...(filters.max_price && { max_price: filters.max_price }),
    });
  };

  const clear = () => {
    setFilters({ search: "", category: "", min_price: "", max_price: "" });
    onFilter({});
  };

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search products..."
          value={filters.search}
          onChange={e => update("search")(e.target.value)}
          onKeyDown={e => e.key === "Enter" && apply()}
        />
      </div>
      <Select value={filters.category || "all"} onValueChange={update("category")}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
      <Input
        className="w-[120px]"
        placeholder="Min price"
        type="number"
        value={filters.min_price}
        onChange={e => update("min_price")(e.target.value)}
      />
      <Input
        className="w-[120px]"
        placeholder="Max price"
        type="number"
        value={filters.max_price}
        onChange={e => update("max_price")(e.target.value)}
      />
      <Button onClick={apply}>Apply</Button>
      <Button variant="ghost" onClick={clear}><X className="h-4 w-4" /></Button>
    </div>
  );
}
