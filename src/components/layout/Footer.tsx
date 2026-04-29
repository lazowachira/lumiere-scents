const Footer = () => (
  <footer className="border-t border-gold/10 bg-background mt-20">
    <div className="container mx-auto px-4 py-16">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <h3 className="font-heading text-xl text-gradient-gold mb-4">LUMIÈRE</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Curating the world's finest fragrances for the discerning connoisseur.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold tracking-wider uppercase mb-4 text-foreground">Shop</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="hover:text-foreground transition-colors cursor-pointer">New Arrivals</li>
            <li className="hover:text-foreground transition-colors cursor-pointer">Best Sellers</li>
            <li className="hover:text-foreground transition-colors cursor-pointer">For Her</li>
            <li className="hover:text-foreground transition-colors cursor-pointer">For Him</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold tracking-wider uppercase mb-4 text-foreground">About</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="hover:text-foreground transition-colors cursor-pointer">Our Story</li>
            <li className="hover:text-foreground transition-colors cursor-pointer">Craftsmanship</li>
            <li className="hover:text-foreground transition-colors cursor-pointer">Sustainability</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold tracking-wider uppercase mb-4 text-foreground">Support</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="hover:text-foreground transition-colors cursor-pointer">Contact Us</li>
            <li className="hover:text-foreground transition-colors cursor-pointer">Shipping</li>
            <li className="hover:text-foreground transition-colors cursor-pointer">Returns</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gold/10 mt-12 pt-8 text-center text-xs text-muted-foreground">
        © 2026 Lumiere Scents. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
