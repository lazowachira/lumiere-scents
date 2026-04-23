import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { Product } from "@/types/product";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { formatPrice } from "@/lib/currency";
import { validateProductImage, PLACEHOLDER_IMAGE } from "@/lib/imageValidation";

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWished = useWishlistStore((s) => s.ids.includes(product.id));
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    validateProductImage(product.name, product.image);
  }, [product.name, product.image]);

  return (
    <div
      className="group relative animate-fade-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative overflow-hidden rounded-lg bg-surface aspect-[3/4]">
          <img
            src={imgError ? PLACEHOLDER_IMAGE : product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {product.isNewArrival && (
            <span className="absolute top-3 left-3 px-2 py-1 text-[10px] font-semibold tracking-wider uppercase bg-primary text-primary-foreground rounded-sm">
              New
            </span>
          )}
          {product.isBestSeller && (
            <span className="absolute top-3 left-3 px-2 py-1 text-[10px] font-semibold tracking-wider uppercase bg-gold-dark text-foreground rounded-sm">
              Best Seller
            </span>
          )}
        </div>
      </Link>

      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={() => toggleWishlist(product.id)}
          className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <Heart className={`w-4 h-4 ${isWished ? "fill-primary text-primary" : ""}`} />
        </button>
        <button
          onClick={() => addItem(product)}
          className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 space-y-1">
        <p className="text-xs text-muted-foreground tracking-wider uppercase">{product.brand}</p>
        <Link to={`/products/${product.id}`}>
          <h3 className="font-heading text-sm hover:text-primary transition-colors">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-primary">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
