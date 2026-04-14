import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Package, Clock } from "lucide-react";

const Orders = () => {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("*, order_items(*, products(name, image, brand))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders(data || []);
        setFetching(false);
      });
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="font-heading text-4xl mb-8 flex items-center gap-3">
          <Package className="w-8 h-8 text-primary" /> My Orders
        </h1>

        {fetching ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No orders yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-surface rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                    </p>
                    <p className="text-sm font-medium mt-1">Order #{order.id.slice(0, 8)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-primary" />
                    <span className="text-xs capitalize text-primary font-medium">{order.status}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <img
                        src={item.products?.image}
                        alt={item.products?.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-sm">{item.products?.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-sm text-primary">${item.price}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gold/10 pt-3 flex justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-semibold text-primary">${order.total}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
