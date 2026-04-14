import { useState, useMemo } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/product/ProductCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ProductsPage = () => {
  const { data: products = [], isLoading } = useProducts();
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("all");
  const [category, setCategory] = useState("all");
  const [scent, setScent] = useState("all");
  const [brand, setBrand] = useState("all");
  const [sort, setSort] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);

  const brands = useMemo(() => [...new Set(products.map(p => p.brand))], [products]);
  const scentFamilies = useMemo(() => [...new Set(products.map(p => p.scentFamily).filter(Boolean))], [products]);
  const categories = useMemo(() => [...new Set(products.map(p => p.category))], [products]);

  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.brand.toLowerCase().includes(search.toLowerCase())) return false;
      if (gender !== "all" && p.gender !== gender) return false;
      if (category !== "all" && p.category !== category) return false;
      if (scent !== "all" && p.scentFamily !== scent) return false;
      if (brand !== "all" && p.brand !== brand) return false;
      return true;
    });

    switch (sort) {
      case "price-asc": result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "rating": result.sort((a, b) => b.rating - a.rating); break;
      case "newest": result.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0)); break;
    }
    return result;
  }, [products, search, gender, category, scent, brand, sort]);

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4">
        <div className="mb-10">
          <p className="text-xs tracking-[0.2em] uppercase text-primary mb-2">Our Collection</p>
          <h1 className="font-heading text-4xl md:text-5xl">Fragrances</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search perfumes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-surface border-gold/10 focus:border-primary"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
          <div className={`flex flex-wrap gap-3 ${showFilters ? "flex" : "hidden md:flex"}`}>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="w-[130px] bg-surface border-gold/10"><SelectValue placeholder="Gender" /></SelectTrigger>
              <SelectContent className="bg-card border-gold/10">
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="men">Men</SelectItem>
                <SelectItem value="women">Women</SelectItem>
                <SelectItem value="unisex">Unisex</SelectItem>
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[130px] bg-surface border-gold/10"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent className="bg-card border-gold/10">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={scent} onValueChange={setScent}>
              <SelectTrigger className="w-[130px] bg-surface border-gold/10"><SelectValue placeholder="Scent" /></SelectTrigger>
              <SelectContent className="bg-card border-gold/10">
                <SelectItem value="all">All Scents</SelectItem>
                {scentFamilies.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[140px] bg-surface border-gold/10"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent className="bg-card border-gold/10">
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price-asc">Price: Low-High</SelectItem>
                <SelectItem value="price-desc">Price: High-Low</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">{filtered.length} fragrances</p>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-surface rounded-lg aspect-[3/4] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No fragrances match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
