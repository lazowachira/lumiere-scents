import { Heart } from "lucide-react";
import { products } from "@/data/products";
import { useWishlistStore } from "@/store/wishlistStore";
import ProductCard from "@/components/product/ProductCard";

const Wishlist = () => {
  const ids = useWishlistStore((s) => s.ids);
  const wished = products.filter((p) => ids.includes(p.id));

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4">
        <div className="mb-10">
          <p className="text-xs tracking-[0.2em] uppercase text-primary mb-2">Your Favorites</p>
          <h1 className="font-heading text-4xl md:text-5xl flex items-center gap-3">
            Wishlist <Heart className="w-8 h-8 text-primary" />
          </h1>
        </div>

        {wished.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Your wishlist is empty. Browse our collection to find fragrances you love.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {wished.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
