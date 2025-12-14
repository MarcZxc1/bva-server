// marczxc1/bva-server/bva-server-feature-order-fulfillment/lazada-clone/src/app/(buyer)/cart/page.tsx

'use client';

import { useCartStore } from '@/store';
import { orderAPI } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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

  const total = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

  const handleInitialCheckout = () => {
    // Require login before showing payment modal
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      toast.error('Please login before checking out');
      router.push('/login');
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSelect = async (method: 'COD' | 'Online Bank') => {
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
      });
      
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
          <div className="bg-white rounded-lg shadow">
            {cartItems.map((item: any) => (
              <div key={item._id} className="flex items-center gap-4 p-4 border-b">
                 <div className="w-20 h-20 bg-gray-100 rounded flex-shrink-0">
                    {/* Placeholder for image */}
                    {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded" />}
                 </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-gray-600">₱{item.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item._id, Math.max(1, item.quantity - 1))}
                    className="px-2 py-1 border rounded hover:bg-gray-50"
                  >
                    -
                  </button>
                  <span className="px-4 font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                    className="px-2 py-1 border rounded hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
                <p className="font-semibold w-24 text-right">₱{(item.price * item.quantity).toFixed(2)}</p>
                <button
                  onClick={() => removeItem(item._id)}
                  className="text-red-600 hover:text-red-900 px-2"
                >
                  Remove
                </button>
              </div>
            ))}
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
            disabled={loading}
            className="w-full bg-orange-500 text-white py-3 rounded font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Processing...' : 'Proceed to Checkout'}
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
        onClose={() => setShowPaymentModal(false)}
        onSelect={handlePaymentSelect}
      />
    </main>
  );
}