export interface Product {
  id: string;
  _id?: string; // Optional for compatibility with some backends
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  // ADD THIS LINE:
  images?: string[]; 
  stock: number;
  category?: string;
  sold?: number;
  rating?: number;
  reviews?: any[];
  originalPrice?: number;
  discount?: number;
  shopId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}