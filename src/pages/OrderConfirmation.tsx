import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, ArrowRight, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];

interface OrderItemWithProduct extends OrderItemRow {
  products: Pick<ProductRow, "name" | "brand" | "image"> | null;
}

const OrderConfirmation = () => {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<OrderItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;

    const fetchOrder = async () => {
      const { data: orderData } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!orderData) {
        setLoading(false);
        return;
      }

      const { data: itemsData } = await supabase
        .from("order_items")
        .select("*, products(name, brand, image)")
        .eq("order_id", id);

      setOrder(orderData);
      setItems(itemsData || []);
      setLoading(false);
    };

    fetchOrder();
  }, [user, id]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-20 flex items-center justify-center">
        <div className="animate-pulse text-primary font-heading text-xl">Loading...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen pt-24 pb-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Order not found.</p>
          <Link to="/orders">
            <Button className="bg-gradient-gold text-primary-foreground">View All Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  const orderId = order.id.slice(0, 8).toUpperCase();

  const copyOrderId = () => {
    navigator.clipboard.writeText(order.id);
    toast({ title: "Copied", description: "Order ID copied to clipboard." });
  };

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-heading text-4xl md:text-5xl mb-3">
            <span className="text-gradient-gold">Order Confirmed!</span>
          </h1>
          <p className="text-muted-foreground">
            Thank you for shopping with Lumiere Scents. Your order has been placed successfully.
          </p>
        </div>

        {/* Order ID Card */}
        <div className="bg-surface rounded-xl p-6 mb-6 border border-border animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-1">Order ID</p>
              <p className="font-heading text-2xl text-foreground">#{orderId}</p>
            </div>
            <button
              onClick={copyOrderId}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors bg-card px-3 py-2 rounded-lg"
            >
              <Copy className="w-3 h-3" /> Copy Full ID
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Date</p>
              <p>{new Date(order.created_at).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Status</p>
              <span className="inline-flex items-center gap-1.5 text-primary font-medium capitalize">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {order.status}
              </span>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Payment</p>
              <p className="capitalize">{order.payment_method || "Card"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Shipping To</p>
              <p>{order.shipping_name}</p>
            </div>
          </div>
          {order.shipping_address && (
            <div className="mt-4 pt-4 border-t border-border text-sm">
              <p className="text-muted-foreground text-xs mb-1">Delivery Address</p>
              <p>{order.shipping_address}, {order.shipping_city} {order.shipping_postal_code}, {order.shipping_country}</p>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-surface rounded-xl p-6 mb-6 border border-border animate-fade-in" style={{ animationDelay: "200ms" }}>
          <h2 className="font-heading text-lg mb-4">Items Ordered</h2>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <img
                  src={item.products?.image}
                  alt={item.products?.name}
                  className="w-14 h-14 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{item.products?.brand}</p>
                  <p className="text-sm font-medium truncate">{item.products?.name}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-primary">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-border mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(Number(order.total))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-primary">Free</span>
            </div>
            <div className="flex justify-between font-heading text-lg pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-gradient-gold">{formatPrice(Number(order.total))}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <Link to="/orders" className="flex-1">
            <Button className="w-full bg-gradient-gold text-primary-foreground font-semibold hover:opacity-90">
              <Package className="w-4 h-4 mr-2" />
              Track My Orders
            </Button>
          </Link>
          <Link to="/products" className="flex-1">
            <Button variant="outline" className="w-full border-border hover:bg-surface">
              Continue Shopping
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
