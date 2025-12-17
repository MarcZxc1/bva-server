// marczxc1/bva-server/bva-server-feature-order-fulfillment/lazada-clone/src/app/(buyer)/cart/page.tsx

'use client';

import { useCartStore } from '@/store';
import { orderAPI, productAPI } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { PaymentModal } from '@/components/PaymentModal';
import { webhookService } from '@/services/webhook.service';

export default function CartPage() {
  const router = useRouter();
  const cartItems = useCartStore((state: any) => state.items);
  const removeItem = useCartStore((state: any) => state.removeItem);
  const updateQuantity = useCartStore((state: any) => state.updateQuantity);
  const clearCart = useCartStore((state: any) => state.clearCart);
  
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [productStocks, setProductStocks] = useState<Record<string, number>>({});
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  // Fetch current stock for all cart items
  useEffect(() => {
    const fetchStocks = async () => {
      const stockMap: Record<string, number> = {};
      for (const item of cartItems) {
        try {
          const productId = item.id || item._id;
          const response = await productAPI.getById(productId) as any;
          const product = response.data?.data || response.data;
          if (product && product.stock !== undefined) {
            stockMap[productId] = product.stock;
          }
        } catch (error) {
          console.error(`Failed to fetch stock for product ${item.id || item._id}:`, error);
        }
      }
      setProductStocks(stockMap);
    };

    if (cartItems.length > 0) {
      fetchStocks();
    }
  }, [cartItems]);

  const handleQuantityUpdate = (itemId: string, newQuantity: number) => {
    const item = cartItems.find((i: any) => (i.id || i._id) === itemId);
    if (!item) {
      console.error('Item not found in cart:', itemId);
      return;
    }

    const productId = item.id || item._id;
    const availableStock = productStocks[productId] ?? item.stock;

    if (availableStock !== undefined && newQuantity > availableStock) {
      toast.warning(`Only ${availableStock} items available in stock`);
      // Use the correct ID format that matches the cart store
      const correctId = item._id || item.id;
      updateQuantity(correctId, availableStock);
    } else if (newQuantity < 1) {
      toast.warning('Quantity must be at least 1');
      const correctId = item._id || item.id;
      updateQuantity(correctId, 1);
    } else {
      const correctId = item._id || item.id;
      updateQuantity(correctId, newQuantity);
    }
  };

  const total = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

  const handleInitialCheckout = () => {
    // Require login before showing payment modal
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      toast.error('Please login before checking out');
      // Pass current path as callbackUrl so user returns to cart after login
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/cart';
      router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSelect = async (method: 'COD' | 'Online Bank') => {
    // Prevent duplicate order creation
    if (isProcessingOrder) {
      console.warn('Order is already being processed, ignoring duplicate request');
      return;
    }

    setIsProcessingOrder(true);
    setShowPaymentModal(false);
    setLoading(true);
    
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        toast.error('Session expired. Please login again');
        router.push('/login');
        return;
      }
      
      // Validate cart has items
      if (!cartItems || cartItems.length === 0) {
        toast.error('Your cart is empty');
        setLoading(false);
        setIsProcessingOrder(false);
        return;
      }

      // Create order with status 'to-pay' and platform info
      const orderResponse = await orderAPI.create({
        items: cartItems.map((item: any) => ({
          productId: item.id || item._id,
          quantity: item.quantity || 1,
          price: item.price || 0,
        })),
        total,
        shippingAddress: {
          name: 'User Name', // In a real app, fetch from profile
          phone: '1234567890',
          address: 'Sample Address',
          city: 'Sample City',
          zipCode: '12345',
        },
        paymentMethod: method, // 'COD' or 'Online Bank'
        platform: 'LAZADA', // Ensure platform is set for Lazada
      }) as any;
      
      const createdOrder = orderResponse.data?.data || orderResponse.data;
      
      if (!createdOrder) {
        throw new Error('Order creation failed: No order returned from server');
      }
      
      // Send webhook to BVA Server for real-time sync
      if (createdOrder) {
        try {
          await webhookService.sendOrderCreated(createdOrder);
          console.log('✅ Webhook sent to BVA: Order created');
        } catch (webhookError) {
          console.warn('⚠️ Failed to send webhook to BVA:', webhookError);
          // Don't fail the order creation if webhook fails
        }
      }

      clearCart();
      toast.success('Order placed! Please confirm payment.');
      router.push('/orders'); // Redirect to Orders page ("To Pay" tab)
    } catch (error: any) {
      console.error('Checkout failed:', error);
      // Check if it's an authentication error
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Your session has expired. Please login again.');
        localStorage.removeItem('token');
        router.push('/login');
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error(error.message || 'Checkout failed. Please try again.');
      }
    } finally {
      setLoading(false);
      setIsProcessingOrder(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg mb-4">Your cart is empty</p>
          <Link href="/products" className="text-blue-600 hover:text-blue-900">
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Header Row */}
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">
              <div className="col-span-4">Product</div>
              <div className="col-span-3 text-center">Quantity</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>
            
            {/* Cart Items */}
            {cartItems.map((item: any) => {
              const productId = item.id || item._id;
              const availableStock = productStocks[productId] ?? item.stock;
              const isOutOfStock = availableStock !== undefined && availableStock === 0;
              const isLowStock = availableStock !== undefined && item.quantity > availableStock;
              
              return (
                <div key={item._id || item.id} className="flex items-center gap-4 p-6 border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  {/* Product Image */}
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                    <p className="text-lg font-bold text-red-600 mb-2">₱{Number(item.price).toFixed(2)}</p>
                    {availableStock !== undefined && (
                      <p className={`text-xs font-medium ${
                        isOutOfStock 
                          ? 'text-red-600' 
                          : isLowStock 
                          ? 'text-orange-600' 
                          : 'text-green-600'
                      }`}>
                        {isOutOfStock 
                          ? '⚠️ Out of stock' 
                          : isLowStock 
                          ? `⚠️ Only ${availableStock} available (you have ${item.quantity})` 
                          : `✓ ${availableStock} in stock`}
                      </p>
                    )}
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex flex-col items-center gap-2 px-4">
                    <label className="text-xs text-gray-500 font-medium mb-1">Quantity</label>
                    <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
                      <button
                        onClick={() => handleQuantityUpdate(item._id || item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-colors min-w-[40px]"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="px-6 py-2 border-l border-r border-gray-300 min-w-[60px] text-center font-bold text-lg bg-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityUpdate(item._id || item.id, item.quantity + 1)}
                        disabled={availableStock !== undefined && item.quantity >= availableStock}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-colors min-w-[40px]"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    {availableStock !== undefined && availableStock > 0 && (
                      <span className="text-xs text-gray-500 font-medium">Stock: {availableStock}</span>
                    )}
                  </div>
                  
                  {/* Price */}
                  <div className="text-right min-w-[100px]">
                    <p className="text-lg font-bold text-gray-900">₱{(Number(item.price) * item.quantity).toFixed(2)}</p>
                    {item.quantity > 1 && (
                      <p className="text-xs text-gray-500">₱{Number(item.price).toFixed(2)} each</p>
                    )}
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item._id || item.id)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors font-medium text-sm"
                    aria-label="Remove item"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow p-6 h-fit sticky top-4">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span>₱{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping:</span>
              <span>Free</span>
            </div>
            <div className="border-t pt-4 mt-4 flex justify-between font-bold text-xl text-blue-600">
              <span>Total:</span>
              <span>₱{total.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={handleInitialCheckout}
            disabled={loading || cartItems.some((item: any) => {
              const productId = item.id || item._id;
              const availableStock = productStocks[productId] ?? item.stock;
              return availableStock !== undefined && (availableStock === 0 || item.quantity > availableStock);
            })}
            className="w-full bg-orange-500 text-white py-3 rounded font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processing...' : cartItems.some((item: any) => {
              const productId = item.id || item._id;
              const availableStock = productStocks[productId] ?? item.stock;
              return availableStock !== undefined && availableStock === 0;
            }) ? 'Some items out of stock' : 'Proceed to Checkout'}
          </button>
          <Link
            href="/products"
            className="block text-center mt-4 text-sm text-blue-600 hover:text-blue-900"
          >
            Continue Shopping
          </Link>
        </div>
      </div>

      <PaymentModal 
        show={showPaymentModal} 
        onClose={() => !isProcessingOrder && setShowPaymentModal(false)}
        onSelect={handlePaymentSelect}
        disabled={isProcessingOrder || loading}
      />
    </main>
  );
}