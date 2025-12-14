'use client';

import { useEffect, useState } from 'react';
import { orderAPI, productAPI } from '@/lib/api';
import { useParams, useRouter, usePathname } from 'next/navigation'; // Added usePathname
import Image from 'next/image';
import Link from 'next/link';
import { useAuthStore } from '@/store';
// Removed shallow import (Atomic selectors are better)

import { useProductStore } from '@/store/products';
import { Product } from '@/lib/types';
import { toast } from 'sonner';
import { webhookService } from '@/services/webhook.service';

export default function ProductDetailsPage() {
  const { productId } = useParams();
  const router = useRouter();
  const pathname = usePathname(); // Get current URL path
  
  const products = useProductStore((state) => state.products);
  
  // FIX 1: Atomic Selectors (Safe & Stable)
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mainImage, setMainImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (productId) {
      const fetchProduct = async () => {
        try {
          setLoading(true);
          const response = await productAPI.getById(productId as string);
          console.log('📦 Fetched product:', response.data);
          setProduct(response.data);
          if (response.data.images && response.data.images.length > 0) {
            setMainImage(response.data.images[0]);
          } else if (response.data.imageUrl) {
            setMainImage(response.data.imageUrl);
          }
          setError('');
        } catch (err: any) {
          const localProduct = products.find(p => p.id === productId);
          if (localProduct) {
            setProduct(localProduct);
            if(localProduct.imageUrl) {
              setMainImage(localProduct.imageUrl);
            }
            setError('');
          } else {
            setError(err.response?.data?.error || 'Failed to load product');
            setProduct(null);
          }
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [productId, products]);

  const handleBuyNow = async () => {
    if (!isHydrated) {
      toast.info('Please wait...');
      return;
    }
    
    // FIX 2: Smart Redirect
    if (!user) {
      toast.error('You must be logged in to buy a product.');
      // Send the current page URL as a query parameter (callbackUrl)
      // Example: /login?callbackUrl=/products/123
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    // Check token
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      toast.error('Your session has expired. Please login again.');
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    
    if (!product) {
      toast.error('Product information is missing');
      return;
    }

    // Validate stock
    if (product.stock !== undefined && product.stock < quantity) {
      toast.error(`Only ${product.stock} items available in stock`);
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('🛒 Creating order with data:', {
        items: [{ 
          productId: product.id || product._id, 
          quantity: quantity, 
          price: product.price 
        }],
        total: product.price * quantity,
        platform: 'LAZADA',
      });
      
      const orderResponse = await orderAPI.create({
        items: [{ 
          productId: product.id || product._id, 
          quantity: quantity, 
          price: product.price 
        }],
        total: product.price * quantity,
        shippingAddress: {
          name: user.name || 'User',
          phone: '1234567890',
          address: '123 Main St, Anytown, USA',
          city: 'Sample City',
          zipCode: '12345',
        },
        paymentMethod: 'Credit Card',
        platform: 'LAZADA', // Ensure platform is set for Lazada
      });
      
      console.log('📦 Order creation response:', orderResponse);
      
      let createdOrders = orderResponse.data?.data || orderResponse.data;
      
      // Handle both single order and array of orders
      if (!createdOrders) {
        console.error('❌ No order returned from server. Response:', orderResponse);
        throw new Error('Order creation failed: No order returned from server');
      }
      
      // Ensure it's an array
      if (!Array.isArray(createdOrders)) {
        createdOrders = [createdOrders];
      }
      
      if (createdOrders.length === 0) {
        console.error('❌ Empty orders array returned from server');
        throw new Error('Order creation failed: No orders created');
      }
      
      console.log('✅ Order(s) created successfully:', createdOrders);
      
      // Send webhook to BVA Server for real-time sync for each order
      for (const order of createdOrders) {
        try {
          await webhookService.sendOrderCreated(order);
          console.log('✅ Webhook sent to BVA: Order created', order.id);
        } catch (webhookError) {
          console.warn('⚠️ Failed to send webhook to BVA:', webhookError);
          // Don't fail the order creation if webhook fails
        }
      }
      
      toast.success('Order placed successfully!');
      
      // Small delay to ensure order is saved before redirecting
      await new Promise(resolve => setTimeout(resolve, 500));
      
      router.push('/orders');
    } catch (err: any) {
      console.error('Failed to create order:', err);
      // Check if it's an authentication error
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error('Your session has expired. Please login again.');
        localStorage.removeItem('token');
        router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      } else if (err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error(err.message || 'Failed to place order. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuantityChange = (amount: number) => {
    setQuantity(prev => {
      const newQuantity = prev + amount;
      if (newQuantity < 1) return 1;
      // Check stock limit
      if (product?.stock !== undefined && product.stock !== null) {
        if (newQuantity > product.stock) {
          toast.warning(`Only ${product.stock} items available`);
          return product.stock;
        }
      }
      return newQuantity;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-gray-700 text-lg">Loading product details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-500 text-red-800 px-4 py-3 rounded mb-4 max-w-7xl mx-auto mt-8">
        <p className="font-semibold">Error: {error}</p>
        <p className="text-sm mt-2">Make sure your backend is running and the product ID is valid.</p>
      </div>
    );
  };

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-700 text-lg">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-white shadow-lg rounded-lg mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center mb-4">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.name}
                fill
                className="object-contain"
              />
            ) : (
              <div className="text-gray-500">No Image Available</div>
            )}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {product.images?.map((img: string, index: number) => (
              <div
                key={index}
                className={`relative w-full h-20 bg-gray-100 rounded-lg overflow-hidden cursor-pointer ${mainImage === img ? 'border-2 border-orange-500' : ''}`}
                onClick={() => setMainImage(img)}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-yellow-400 text-sm">★★★★☆</span>
            <span className="text-gray-600 text-sm">({product.reviews?.length || 0} reviews)</span>
            {typeof product.sold === 'number' && (
              <span className="text-gray-600 text-sm ml-4">{product.sold} sold</span>
            )}
          </div>

          <div className="text-4xl font-bold text-red-600 mb-2">₱{Number(product.price).toFixed(2)}</div>
          {product.originalPrice && (
            <div className="text-lg text-gray-500 line-through mb-4">
              ₱{Number(product.originalPrice).toFixed(2)}
              {product.discount && (
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm ml-2">
                  -{product.discount}%
                </span>
              )}
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
            <p className="text-gray-700 text-sm leading-relaxed">{product.description}</p>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Delivery Options:</h3>
            <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
              <span>📍</span> Metro Manila-Quezon City, Project 6 <Link href="#" className="text-blue-600 hover:underline">CHANGE</Link>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
              <span>🚚</span> Guaranteed by Tomorrow (6 Dec)
            </div>
            <div className="text-xs text-gray-500 pl-6">Priority 24H with shipping fee ₱40.00</div>
            <div className="text-xs text-gray-500 pl-6">FREE SHIPPING with ₱999.00 minimum spend from <Link href="#" className="text-blue-600 hover:underline">Sinocare Official Store</Link></div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Return & Warranty:</h3>
            <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
              <span>✔️</span> 100% Authentic - 30 Days Free Return - 1 Year International Manufacturer Warranty
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <h3 className="font-semibold text-gray-800">Quantity:</h3>
            <div className="flex items-center border border-gray-300 rounded">
              <button 
                onClick={() => handleQuantityChange(-1)} 
                disabled={quantity <= 1}
                className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                -
              </button>
              <span className="px-3 py-1 border-l border-r border-gray-300 min-w-[3rem] text-center">{quantity}</span>
              <button 
                onClick={() => handleQuantityChange(1)} 
                disabled={product?.stock !== undefined && quantity >= product.stock}
                className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
            {product?.stock !== undefined && (
              <span className="text-sm text-gray-600">
                {product.stock} available
              </span>
            )}
          </div>

          <div className="flex gap-4">
            <button 
              onClick={handleBuyNow}
              disabled={isSubmitting || !isHydrated}
              className="bg-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-pink-600 flex-1 disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : 'Buy Now'}
            </button>
            <button className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 flex-1">Add to Cart</button>
          </div>
        </div>
      </div>
    </div>
  );
}