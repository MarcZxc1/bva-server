export interface Product {
  id: string;
  _id?: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  description?: string;
  category?: string;
  originalPrice?: number;
  discount?: number;
  reviews?: any[];
  sold?: number;
}
