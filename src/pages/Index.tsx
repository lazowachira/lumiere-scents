import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import { products } from "@/data/products";
import ProductCard from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";

const HomePage = () => {
  const featured = products.filter((p) => p.isFeatured);
  const bestSellers = products.filter((p) => p.isBestSeller);
  const newArrivals = products.filter((p) => p.isNewArrival);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background z-10" />
        <img
          src="https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=1920&h=1080&fit=crop"
          alt="Luxury perfume collection"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="relative z-20 text-center px-4 max-w-3xl mx-auto animate-fade-in">
          <p className="text-xs tracking-[0.3em] uppercase text-primary mb-6">The Art of Fragrance</p>
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl leading-tight mb-6">
            <span className="text-gradient-gold">Discover</span>
            <br />
            Your Signature
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto mb-10 leading-relaxed">
            Curated luxury fragrances crafted by the world's most renowned perfumers. Find the scent that defines you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/products">
              <Button size="lg" className="bg-gradient-gold text-primary-foreground font-semibold px-8 hover:opacity-90 transition-opacity">
                Explore Collection
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/recommendations">
              <Button size="lg" variant="outline" className="border-gold/30 text-foreground hover:bg-surface hover:border-gold/50 px-8">
                <Sparkles className="w-4 h-4 mr-2 text-primary" />
                Find Your Scent
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="container mx-auto px-4 py-20">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-primary mb-2">Curated Selection</p>
            <h2 className="font-heading text-3xl md:text-4xl">Featured</h2>
          </div>
          <Link to="/products" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* Banner */}
      <section className="container mx-auto px-4">
        <div className="relative rounded-2xl overflow-hidden bg-surface p-10 md:p-16 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <p className="text-xs tracking-[0.2em] uppercase text-primary mb-3">AI-Powered</p>
            <h2 className="font-heading text-3xl md:text-4xl mb-4">Find Your Perfect Perfume</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-md">
              Answer a few questions about your preferences and let our recommendation engine find fragrances tailored just for you.
            </p>
            <Link to="/recommendations">
              <Button className="bg-gradient-gold text-primary-foreground font-semibold hover:opacity-90">
                <Sparkles className="w-4 h-4 mr-2" />
                Take the Quiz
              </Button>
            </Link>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="w-48 h-48 rounded-full bg-gradient-gold opacity-20 blur-3xl absolute right-10" />
            <Sparkles className="w-24 h-24 text-primary opacity-30" />
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="container mx-auto px-4 py-20">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-primary mb-2">Most Loved</p>
            <h2 className="font-heading text-3xl md:text-4xl">Best Sellers</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {bestSellers.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="container mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-primary mb-2">Just In</p>
            <h2 className="font-heading text-3xl md:text-4xl">New Arrivals</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {newArrivals.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section className="container mx-auto px-4 pb-20 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center gap-1 mb-4">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-primary text-primary" />)}
          </div>
          <blockquote className="font-heading text-xl md:text-2xl italic text-foreground/80 mb-4">
            "Midnight Oud is the most captivating fragrance I've ever worn. The compliments are endless."
          </blockquote>
          <p className="text-sm text-muted-foreground">— Sophia M., Verified Buyer</p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
