import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Package, ShoppingBag, Edit, DollarSign, AlertTriangle, Image as ImageIcon } from "lucide-react";

const Admin = () => {
  const { user, loading, isAdmin } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({
    name: "", brand: "", price: "", category: "luxury", gender: "unisex",
    description: "", image: "", scent_family: "woody", stock: "0",
  });

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const pendingOrders = orders.filter((order) => order.status === "pending").length;
  const lowStockProducts = products.filter((product) => Number(product.stock || 0) <= 10).length;
  const productsWithImages = products.filter((product) => typeof product.image === "string" && product.image.trim().length > 0).length;
  const filteredOrders = statusFilter === "all"
    ? orders
    : orders.filter((order) => order.status === statusFilter);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
  };

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(quantity, price, products(name))")
      .order("created_at", { ascending: false });
    setOrders(data || []);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
      fetchOrders();
    }
  }, [isAdmin]);

  if (loading) return null;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const handleSave = async () => {
    const payload = {
      name: form.name,
      brand: form.brand,
      price: parseFloat(form.price),
      category: form.category,
      gender: form.gender,
      description: form.description,
      image: form.image || "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&h=800&fit=crop",
      scent_family: form.scent_family,
      stock: parseInt(form.stock),
    };

    if (editId) {
      const { error } = await supabase.from("products").update(payload).eq("id", editId);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Product updated" });
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Product added" });
    }

    setShowForm(false);
    setEditId(null);
    setForm({ name: "", brand: "", price: "", category: "luxury", gender: "unisex", description: "", image: "", scent_family: "woody", stock: "0" });
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Product deleted" });
    fetchProducts();
  };

  const handleEdit = (p: any) => {
    setEditId(p.id);
    setForm({
      name: p.name, brand: p.brand, price: String(p.price), category: p.category,
      gender: p.gender, description: p.description, image: p.image,
      scent_family: p.scent_family || "woody", stock: String(p.stock),
    });
    setShowForm(true);
  };

  const handleOrderStatusChange = async (orderId: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Order updated", description: `Order marked as ${status}.` });
    fetchOrders();
  };

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4">
        <h1 className="font-heading text-4xl mb-8 text-gradient-gold">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface rounded-lg p-5 border border-border">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Revenue</p>
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <p className="font-heading text-3xl text-foreground">${totalRevenue.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-2">From {orders.length} total orders</p>
          </div>

          <div className="bg-surface rounded-lg p-5 border border-border">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Pending</p>
              <ShoppingBag className="w-4 h-4 text-primary" />
            </div>
            <p className="font-heading text-3xl text-foreground">{pendingOrders}</p>
            <p className="text-sm text-muted-foreground mt-2">Orders awaiting fulfillment</p>
          </div>

          <div className="bg-surface rounded-lg p-5 border border-border">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Low Stock</p>
              <AlertTriangle className="w-4 h-4 text-primary" />
            </div>
            <p className="font-heading text-3xl text-foreground">{lowStockProducts}</p>
            <p className="text-sm text-muted-foreground mt-2">Products with 10 or fewer left</p>
          </div>

          <div className="bg-surface rounded-lg p-5 border border-border">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Catalog Images</p>
              <ImageIcon className="w-4 h-4 text-primary" />
            </div>
            <p className="font-heading text-3xl text-foreground">{productsWithImages}/{products.length}</p>
            <p className="text-sm text-muted-foreground mt-2">Products currently have image URLs</p>
          </div>
        </div>

        <Tabs defaultValue="products">
          <TabsList className="bg-surface border border-gold/10 mb-8">
            <TabsTrigger value="products" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Package className="w-4 h-4 mr-2" /> Products
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ShoppingBag className="w-4 h-4 mr-2" /> Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Button onClick={() => { setShowForm(true); setEditId(null); }} className="bg-gradient-gold text-primary-foreground mb-6">
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>

            {showForm && (
              <div className="bg-surface rounded-lg p-6 mb-6 space-y-4 animate-fade-in">
                <h3 className="font-heading text-lg">{editId ? "Edit Product" : "New Product"}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-card border-gold/10" />
                  <Input placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="bg-card border-gold/10" />
                  <Input placeholder="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-card border-gold/10" />
                  <Input placeholder="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="bg-card border-gold/10" />
                  <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                    <SelectTrigger className="bg-card border-gold/10"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-gold/10">
                      <SelectItem value="men">Men</SelectItem>
                      <SelectItem value="women">Women</SelectItem>
                      <SelectItem value="unisex">Unisex</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger className="bg-card border-gold/10"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-gold/10">
                      <SelectItem value="luxury">Luxury</SelectItem>
                      <SelectItem value="niche">Niche</SelectItem>
                      <SelectItem value="designer">Designer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="bg-card border-gold/10 md:col-span-2" />
                  <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-card border-gold/10 md:col-span-2" />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleSave} className="bg-gradient-gold text-primary-foreground">
                    {editId ? "Update" : "Add"} Product
                  </Button>
                  <Button variant="outline" onClick={() => { setShowForm(false); setEditId(null); }} className="border-gold/10">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {products.map((p) => (
                <div key={p.id} className="bg-surface rounded-lg p-4 flex items-center gap-4">
                  <img src={p.image} alt={p.name} className="w-12 h-16 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.brand} · ${p.price} · Stock: {p.stock}</p>
                    {Number(p.stock || 0) <= 10 && (
                      <p className="text-[11px] text-primary mt-1">Low stock alert</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(p)} className="text-muted-foreground hover:text-foreground">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="flex justify-end mb-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-surface border-gold/10">
                  <SelectValue placeholder="Filter orders" />
                </SelectTrigger>
                <SelectContent className="bg-card border-gold/10">
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {orders.length === 0 ? (
              <p className="text-muted-foreground">No orders yet.</p>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="bg-surface rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()} · {order.shipping_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-primary font-semibold">${order.total}</p>
                        <div className="mt-2">
                          <Select value={order.status} onValueChange={(value) => handleOrderStatusChange(order.id, value)}>
                            <SelectTrigger className="w-[140px] ml-auto bg-card border-gold/10 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-gold/10">
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.order_items?.map((i: any) => (
                        <span key={i.id} className="mr-3">{i.products?.name} ×{i.quantity}</span>
                      ))}
                    </div>
                  </div>
                ))}

                {filteredOrders.length === 0 && (
                  <p className="text-sm text-muted-foreground">No orders match the selected status.</p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
