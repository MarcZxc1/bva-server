'use client';

import { useCartStore, useAuthStore } from '@/store';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { orderAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState } from 'react';

export function ProductCard({ product }: { product: Product }) {
  const addItemToCart = useCartStore((state: any) => state.addItem);
  const user = useAuthStore((state: any) => state.user);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBuyNow = async () => {
    if (!user) {
      toast.error('You must be logged in to buy a product.');
      router.push('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      await orderAPI.create({
        items: [{ productId: product.id || product._id, quantity: 1, price: product.price }],
        total: product.price,
        shippingAddress: '123 Main St, Anytown, USA', // Example address
        paymentMethod: 'Credit Card',
      });
      toast.success('Order placed successfully!');
      router.push('/orders');
    } catch (err) {
      console.error('Failed to create order:', err);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showLazMall = product.category === 'Electronics';
  const showTop = (product.discount || 0) >= 30;
  const showVoucher = (product.discount || 0) >= 35;

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-4 flex flex-col justify-between">
      <div>
        <div className="relative mb-4 bg-gray-200 rounded overflow-hidden h-48 flex items-center justify-center">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={300}
              height={300}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500">
              No Image
            </div>
          )}
          <div className="absolute left-2 top-2 flex gap-2">
            {showLazMall && (
              <span className="bg-pink-600 text-white text-[10px] px-2 py-1 rounded">LazMall</span>
            )}
            {showTop && (
              <span className="bg-orange-500 text-white text-[10px] px-2 py-1 rounded">TOP</span>
            )}
            {showVoucher && (
              <span className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded">Voucher</span>
            )}
          </div>
        </div>

        <h3 className="font-semibold text-sm mb-2 line-clamp-2 h-10">{product.name}</h3>

        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xl font-bold text-red-600">₱{Number(product.price).toFixed(2)}</span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through ml-2">
                ₱{Number(product.originalPrice).toFixed(2)}
              </span>
            )}
          </div>
          {product.discount && (
            <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm">
              -{product.discount}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-yellow-400 text-sm">★★★★☆</span>
          <span className="text-xs text-gray-600">{product.reviews?.length || 0} reviews</span>
          {typeof product.sold === 'number' && (
            <span className="text-xs text-gray-600 ml-2">{product.sold} sold</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => addItemToCart(product)}
            className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
          >
            Add to Cart
          </button>
          <Link
            href={`/products/${product.id || product._id}`}
            className="flex-1 bg-gray-200 text-gray-900 py-2 rounded hover:bg-gray-300 text-center"
          >
            View
          </Link>
        </div>
        <button
          onClick={handleBuyNow}
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Processing...' : 'Buy Now'}
        </button>
      </div>
    </div>
  );
}
