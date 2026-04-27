import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Package, ShoppingBag, Edit, DollarSign, AlertTriangle, Image as ImageIcon, ImageOff, CheckCircle2, Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { validateProductImage, PLACEHOLDER_IMAGE } from "@/lib/imageValidation";

interface FlaggedImage {
  url: string;
  reason: "missing" | "mismatch";
  field: "image" | "images";
  index?: number;
}

interface FlaggedProduct {
  id: string;
  name: string;
  brand: string;
  primaryImage: string;
  flagged: FlaggedImage[];
}

const auditProduct = (p: any): FlaggedProduct | null => {
  const flagged: FlaggedImage[] = [];

  if (!p.image || !String(p.image).trim()) {
    flagged.push({ url: "", reason: "missing", field: "image" });
  } else if (!validateProductImage(p.name, p.image)) {
    flagged.push({ url: p.image, reason: "mismatch", field: "image" });
  }

  const images: string[] = Array.isArray(p.images) ? p.images : [];
  images.forEach((url, i) => {
    if (!url || !String(url).trim()) {
      flagged.push({ url: "", reason: "missing", field: "images", index: i });
    } else if (!validateProductImage(p.name, url)) {
      flagged.push({ url, reason: "mismatch", field: "images", index: i });
    }
  });

  if (flagged.length === 0) return null;
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    primaryImage: p.image || PLACEHOLDER_IMAGE,
    flagged,
  };
};

const Admin = () => {
  const { user, loading, isAdmin } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [fixedKeys, setFixedKeys] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = localStorage.getItem("admin:image-audit:fixed");
      return new Set(saved ? JSON.parse(saved) : []);
    } catch {
      return new Set();
    }
  });
  const [form, setForm] = useState({
    name: "", brand: "", price: "", category: "luxury", gender: "unisex",
    description: "", image: "", scent_family: "woody", stock: "0",
  });

  const flaggedProducts = useMemo(
    () => products.map(auditProduct).filter((p): p is FlaggedProduct => p !== null),
    [products]
  );
  const totalFlagged = flaggedProducts.reduce((sum, p) => sum + p.flagged.length, 0);
  const fixedCount = Array.from(fixedKeys).filter((k) =>
    flaggedProducts.some((p) => p.flagged.some((f) => `${p.id}:${f.field}:${f.index ?? "main"}` === k))
  ).length;

  const toggleFixed = (key: string) => {
    setFixedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        localStorage.setItem("admin:image-audit:fixed", JSON.stringify(Array.from(next)));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const buildAuditRows = () =>
    flaggedProducts.flatMap((p) =>
      p.flagged.map((f) => {
        const key = `${p.id}:${f.field}:${f.index ?? "main"}`;
        return {
          productId: p.id,
          product: p.name,
          brand: p.brand,
          field: f.field === "image" ? "Primary" : `Gallery #${(f.index ?? 0) + 1}`,
          issue: f.reason === "missing" ? "Missing URL" : "Slug mismatch",
          url: f.url || "",
          expectedUrl: p.primaryImage || "",
          status: fixedKeys.has(key) ? "Fixed" : "Open",
        };
      })
    );

  const fetchImageAsDataUrl = async (url: string): Promise<{ data: string; format: "JPEG" | "PNG" } | null> => {
    if (!url) return null;
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) return null;
      const blob = await res.blob();
      const format = blob.type.includes("png") ? "PNG" : "JPEG";
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      return { data, format };
    } catch {
      return null;
    }
  };

  const exportCSV = () => {
    const rows = buildAuditRows();
    if (rows.length === 0) {
      toast({ title: "Nothing to export", description: "No flagged image issues to report." });
      return;
    }
    const headers = ["Product", "Brand", "Field", "Issue", "Status", "Flagged Image URL", "Expected Primary URL"];
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        [r.product, r.brand, r.field, r.issue, r.status, r.url || "(none)", r.expectedUrl || "(none)"]
          .map(escape)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `image-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported", description: `${rows.length} issue(s) downloaded.` });
  };

  const exportPDF = async () => {
    const rows = buildAuditRows();
    if (rows.length === 0) {
      toast({ title: "Nothing to export", description: "No flagged image issues to report." });
      return;
    }

    toast({ title: "Generating PDF…", description: "Fetching thumbnails for preview." });

    // Pre-fetch unique image URLs once
    const uniqueUrls = Array.from(new Set(rows.flatMap((r) => [r.url, r.expectedUrl]).filter(Boolean)));
    const cache = new Map<string, { data: string; format: "JPEG" | "PNG" } | null>();
    await Promise.all(
      uniqueUrls.map(async (u) => {
        cache.set(u, await fetchImageAsDataUrl(u));
      })
    );

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Product Image Audit Report", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(
      `Generated ${new Date().toLocaleString()} · ${fixedCount}/${totalFlagged} fixed`,
      14,
      25
    );

    const THUMB = 18; // mm

    autoTable(doc, {
      startY: 32,
      head: [["Product", "Field", "Issue", "Status", "Flagged", "Expected"]],
      body: rows.map((r) => [
        `${r.product}\n${r.brand}`,
        r.field,
        r.issue,
        r.status,
        "", // image cell
        "", // image cell
      ]),
      styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak", minCellHeight: THUMB + 2, valign: "middle" },
      headStyles: { fillColor: [30, 30, 30], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 38 },
        1: { cellWidth: 22 },
        2: { cellWidth: 22 },
        3: { cellWidth: 18 },
        4: { cellWidth: 30, halign: "center" },
        5: { cellWidth: 30, halign: "center" },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 3) {
          data.cell.styles.textColor =
            data.cell.raw === "Fixed" ? [22, 128, 80] : [200, 60, 60];
          data.cell.styles.fontStyle = "bold";
        }
      },
      didDrawCell: (data) => {
        if (data.section !== "body") return;
        const row = rows[data.row.index];
        if (!row) return;
        const url = data.column.index === 4 ? row.url : data.column.index === 5 ? row.expectedUrl : null;
        if (!url) return;
        const img = cache.get(url);
        if (!img) {
          doc.setFontSize(7);
          doc.setTextColor(160);
          doc.text("n/a", data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, {
            align: "center",
            baseline: "middle",
          });
          doc.setTextColor(0);
          return;
        }
        const x = data.cell.x + (data.cell.width - THUMB) / 2;
        const y = data.cell.y + (data.cell.height - THUMB) / 2;
        try {
          doc.addImage(img.data, img.format, x, y, THUMB, THUMB);
        } catch {
          /* skip if image can't be added */
        }
      },
    });

    doc.save(`image-audit-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast({ title: "PDF exported", description: `${rows.length} issue(s) downloaded with thumbnails.` });
  };

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
            <TabsTrigger value="image-audit" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ImageOff className="w-4 h-4 mr-2" /> Image Audit
              {totalFlagged > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-destructive/20 text-destructive text-[10px] px-1.5 py-0.5">
                  {totalFlagged}
                </span>
              )}
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

          <TabsContent value="image-audit">
            <div className="bg-surface rounded-lg p-6 border border-border mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading text-xl mb-1">Product Image Audit</h3>
                  <p className="text-sm text-muted-foreground">
                    Lists products whose primary or gallery image URLs are missing or do not match the product label slug.
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-heading text-2xl text-foreground">
                      {fixedCount}<span className="text-muted-foreground text-base">/{totalFlagged}</span>
                    </p>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1">Fixed</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={exportCSV}
                      disabled={totalFlagged === 0}
                      className="border-gold/10"
                    >
                      <Download className="w-3 h-3 mr-1.5" /> Export CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={exportPDF}
                      disabled={totalFlagged === 0}
                      className="border-gold/10"
                    >
                      <FileText className="w-3 h-3 mr-1.5" /> Export PDF
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {flaggedProducts.length === 0 ? (
              <div className="bg-surface rounded-lg p-10 text-center border border-border">
                <CheckCircle2 className="w-10 h-10 mx-auto text-primary mb-3" />
                <p className="font-heading text-lg">All product images look good</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No missing or mismatched image URLs detected across the catalog.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {flaggedProducts.map((p) => {
                  const allFixed = p.flagged.every((f) =>
                    fixedKeys.has(`${p.id}:${f.field}:${f.index ?? "main"}`)
                  );
                  return (
                    <div
                      key={p.id}
                      className={`bg-surface rounded-lg p-5 border ${allFixed ? "border-primary/40" : "border-destructive/30"}`}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <img
                          src={p.primaryImage || PLACEHOLDER_IMAGE}
                          alt={p.name}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
                          className="w-14 h-20 rounded object-cover bg-card"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-heading text-lg truncate">{p.name}</p>
                            {allFixed && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {p.brand} · {p.flagged.length} issue{p.flagged.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(products.find((prod) => prod.id === p.id))}
                          className="border-gold/10"
                        >
                          <Edit className="w-3 h-3 mr-1" /> Fix in editor
                        </Button>
                      </div>

                      <ul className="space-y-2">
                        {p.flagged.map((f) => {
                          const key = `${p.id}:${f.field}:${f.index ?? "main"}`;
                          const isFixed = fixedKeys.has(key);
                          return (
                            <li
                              key={key}
                              className="flex items-start gap-3 p-3 rounded bg-card/50 border border-border"
                            >
                              <Checkbox
                                checked={isFixed}
                                onCheckedChange={() => toggleFixed(key)}
                                className="mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                                    {f.field === "image" ? "Primary image" : `Gallery image #${(f.index ?? 0) + 1}`}
                                  </span>
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                                      f.reason === "missing"
                                        ? "bg-destructive/20 text-destructive"
                                        : "bg-primary/20 text-primary"
                                    }`}
                                  >
                                    {f.reason === "missing" ? "Missing URL" : "Slug mismatch"}
                                  </span>
                                </div>
                                <p
                                  className={`text-xs mt-1 break-all ${
                                    isFixed ? "line-through text-muted-foreground" : "text-foreground/80"
                                  }`}
                                >
                                  {f.url || "— (no URL set)"}
                                </p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
