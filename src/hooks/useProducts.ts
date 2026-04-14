import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";

const mapDbProduct = (p: any): Product => ({
  id: p.id,
  name: p.name,
  brand: p.brand,
  price: Number(p.price),
  originalPrice: p.original_price ? Number(p.original_price) : undefined,
  category: p.category,
  gender: p.gender,
  description: p.description,
  image: p.image,
  images: p.images || [p.image],
  notesTop: p.notes_top || [],
  notesMiddle: p.notes_middle || [],
  notesBase: p.notes_base || [],
  longevity: p.longevity || "",
  sillage: p.sillage || "",
  occasion: p.occasion || [],
  personality: p.personality || [],
  rating: Number(p.rating),
  reviewCount: p.review_count || 0,
  stock: p.stock || 0,
  isFeatured: p.is_featured,
  isBestSeller: p.is_best_seller,
  isNewArrival: p.is_new_arrival,
  scentFamily: p.scent_family || "",
});

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase.from("products").select("*");
      if (error) throw error;
      return (data || []).map(mapDbProduct);
    },
  });
};

export const useProduct = (id: string | undefined) => {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async (): Promise<Product | null> => {
      if (!id) return null;
      const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
      if (error) return null;
      return mapDbProduct(data);
    },
    enabled: !!id,
  });
};
