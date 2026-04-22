import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCartStore } from "@/store/cartStore";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/currency";

const Checkout = () => {
  const { user, loading } = useAuth();
  const { items, total, clearCart } = useCartStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", address: "", city: "", postalCode: "", country: "",
  });

  if (loading) return null;
  if (!user) return <Navigate to="/auth?redirect=/checkout" replace />;
  if (items.length === 0) return <Navigate to="/products" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        total: total(),
        shipping_name: form.name,
        shipping_address: form.address,
        shipping_city: form.city,
        shipping_postal_code: form.postalCode,
        shipping_country: form.country,
        payment_method: "card",
      })
      .select()
      .single();

    if (orderError || !order) {
      toast({ title: "Error", description: "Failed to place order.", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.product.price,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

    if (itemsError) {
      toast({ title: "Error", description: "Failed to save order items.", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    clearCart();
    setSubmitting(false);
    navigate(`/order-confirmation/${order.id}`, { replace: true });
  };

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="font-heading text-4xl mb-8">Checkout</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="font-heading text-xl mb-2">Shipping Details</h2>
            {[
              { key: "name", label: "Full Name" },
              { key: "address", label: "Address" },
              { key: "city", label: "City" },
              { key: "postalCode", label: "Postal Code" },
              { key: "country", label: "Country" },
            ].map(({ key, label }) => (
              <Input
                key={key}
                placeholder={label}
                required
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="bg-surface border-gold/10 focus:border-primary"
              />
            ))}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-gold text-primary-foreground font-semibold hover:opacity-90"
            >
              {submitting ? "Placing Order..." : `Place Order — ${formatPrice(total())}`}
            </Button>
          </form>

          <div>
            <h2 className="font-heading text-xl mb-4">Order Summary</h2>
            <div className="bg-surface rounded-lg p-4 space-y-3">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span>{item.product.name} × {item.quantity}</span>
                  <span className="text-primary">{formatPrice(item.product.price * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-gold/10 pt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(total())}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
