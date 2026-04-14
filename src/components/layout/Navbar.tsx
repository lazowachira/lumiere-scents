import { Link } from "react-router-dom";
import { ShoppingBag, Heart, Search, Menu, X } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useState } from "react";

const Navbar = () => {
  const itemCount = useCartStore((s) => s.itemCount());
  const toggleCart = useCartStore((s) => s.toggleCart);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-gold/10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-heading text-2xl tracking-wider text-gradient-gold">
          LUMIÈRE
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm tracking-wide text-muted-foreground hover:text-foreground transition-colors">Home</Link>
          <Link to="/products" className="text-sm tracking-wide text-muted-foreground hover:text-foreground transition-colors">Collection</Link>
          <Link to="/recommendations" className="text-sm tracking-wide text-muted-foreground hover:text-foreground transition-colors">Find Your Scent</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/products" className="text-muted-foreground hover:text-foreground transition-colors">
            <Search className="w-5 h-5" />
          </Link>
          <Link to="/wishlist" className="text-muted-foreground hover:text-foreground transition-colors">
            <Heart className="w-5 h-5" />
          </Link>
          <button onClick={toggleCart} className="relative text-muted-foreground hover:text-foreground transition-colors">
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-muted-foreground">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-background border-b border-gold/10 px-4 py-4 space-y-3 animate-fade-in">
          <Link to="/" onClick={() => setMobileOpen(false)} className="block text-sm tracking-wide text-muted-foreground hover:text-foreground">Home</Link>
          <Link to="/products" onClick={() => setMobileOpen(false)} className="block text-sm tracking-wide text-muted-foreground hover:text-foreground">Collection</Link>
          <Link to="/recommendations" onClick={() => setMobileOpen(false)} className="block text-sm tracking-wide text-muted-foreground hover:text-foreground">Find Your Scent</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
