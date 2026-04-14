import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const CartDrawer = () => {
  const { items, isOpen, setOpen, removeItem, updateQuantity, total, clearCart } = useCartStore();

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="bg-card border-l border-gold/10 w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-heading text-xl text-foreground flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Your Cart
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 mt-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-3 p-3 bg-surface rounded-lg">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-20 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{item.product.brand}</p>
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-sm text-primary font-semibold mt-1">${item.product.price}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 rounded bg-muted flex items-center justify-center hover:bg-surface-hover transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 rounded bg-muted flex items-center justify-center hover:bg-surface-hover transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.product.id)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t border-gold/10 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-primary">${total().toFixed(2)}</span>
              </div>
              <Button className="w-full bg-gradient-gold text-primary-foreground font-semibold hover:opacity-90">
                Checkout
              </Button>
              <button onClick={clearCart} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
                Clear Cart
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
