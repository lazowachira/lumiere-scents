import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Heart, ShoppingBag, Star, Clock, Wind, AlertTriangle } from "lucide-react";
import { useProduct, useProducts } from "@/hooks/useProducts";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/product/ProductCard";
import { formatPrice } from "@/lib/currency";
import { validateProductImages, PLACEHOLDER_IMAGE } from "@/lib/imageValidation";

const ProductDetail = () => {
  const { id } = useParams();
  const { data: product, isLoading } = useProduct(id);
  const { data: allProducts = [] } = useProducts();
  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useCartStore((s) => s.setOpen);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWished = useWishlistStore((s) => s.ids.includes(id || ""));
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  useEffect(() => {
    setSelectedImage(0);
    setImageErrors(new Set());
  }, [id]);

  useEffect(() => {
    if (product) {
      validateProductImages(product.name, product.images);
    }
  }, [product]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-pulse text-primary font-heading text-xl">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <p className="text-muted-foreground">Product not found.</p>
      </div>
    );
  }

  const related = allProducts
    .filter((p) => p.id !== product.id && (p.scentFamily === product.scentFamily || p.gender === product.gender))
    .slice(0, 4);

  const handleAddToCart = () => {
    addItem(product);
    setCartOpen(true);
  };

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  };

  const galleryImages = product.images.length > 0 ? product.images : [product.image];
  const currentImage = imageErrors.has(selectedImage)
    ? PLACEHOLDER_IMAGE
    : galleryImages[selectedImage] || product.image;

  return (
    <div className="min-h-screen pt-20 pb-20">
      <div className="container mx-auto px-4">
        <Link to="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Collection
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Image Gallery */}
          <div className="space-y-4 animate-fade-in">
            <div className="relative rounded-2xl overflow-hidden bg-surface aspect-[3/4]">
              <img
                src={currentImage}
                alt={`${product.name} - View ${selectedImage + 1}`}
                className="w-full h-full object-cover transition-opacity duration-300"
                onError={() => handleImageError(selectedImage)}
              />
              {imageErrors.has(selectedImage) && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface/80">
                  <div className="text-center text-muted-foreground">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-destructive" />
                    <p className="text-xs">Image unavailable</p>
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="flex gap-3">
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative rounded-lg overflow-hidden w-20 h-20 border-2 transition-all ${
                      selectedImage === i
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent hover:border-muted-foreground/30"
                    }`}
                  >
                    <img
                      src={imageErrors.has(i) ? PLACEHOLDER_IMAGE : img}
                      alt={`${product.name} thumbnail ${i + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={() => handleImageError(i)}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
            <p className="text-xs tracking-[0.2em] uppercase text-primary mb-2">{product.brand}</p>
            <h1 className="font-heading text-4xl md:text-5xl mb-2">{product.name}</h1>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-primary text-primary" />
                <span className="text-sm font-medium">{product.rating}</span>
              </div>
              <span className="text-sm text-muted-foreground">({product.reviewCount} reviews)</span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground capitalize">{product.gender}</span>
            </div>

            <div className="flex items-baseline gap-3 mb-8">
              <span className="text-3xl font-heading text-gradient-gold">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
              )}
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mb-8">{product.description}</p>

            <div className="space-y-4 mb-8">
              <h3 className="text-sm font-semibold tracking-wider uppercase">Fragrance Notes</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Top", notes: product.notesTop },
                  { label: "Heart", notes: product.notesMiddle },
                  { label: "Base", notes: product.notesBase },
                ].map(({ label, notes }) => (
                  <div key={label} className="bg-surface rounded-lg p-4">
                    <p className="text-[10px] tracking-wider uppercase text-primary mb-2">{label}</p>
                    {notes.map((n) => (
                      <p key={n} className="text-xs text-muted-foreground">{n}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-6 mb-8">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Longevity</p>
                  <p className="text-sm">{product.longevity}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sillage</p>
                  <p className="text-sm">{product.sillage}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleAddToCart} size="lg" className="flex-1 bg-gradient-gold text-primary-foreground font-semibold hover:opacity-90">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
              <Button
                onClick={() => toggleWishlist(product.id)}
                size="lg"
                variant="outline"
                className="border-gold/30 hover:bg-surface"
              >
                <Heart className={`w-4 h-4 ${isWished ? "fill-primary text-primary" : ""}`} />
              </Button>
            </div>

            {product.stock <= 10 && (
              <p className="text-xs text-destructive mt-3">Only {product.stock} left in stock</p>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="font-heading text-2xl mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
