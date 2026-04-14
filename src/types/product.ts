export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  category: string;
  gender: 'men' | 'women' | 'unisex';
  description: string;
  image: string;
  images: string[];
  notesTop: string[];
  notesMiddle: string[];
  notesBase: string[];
  longevity: string;
  sillage: string;
  occasion: string[];
  personality: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  scentFamily: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}
