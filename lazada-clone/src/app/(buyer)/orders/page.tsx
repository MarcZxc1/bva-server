// marczxc1/bva-server/bva-server-feature-order-fulfillment/lazada-clone/src/app/(buyer)/orders/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { orderAPI } from '@/lib/api';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuthStore } from '@/store';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { useRouter } from 'next/navigation';

const TABS = ['all', 'to-pay', 'to-ship', 'shipping', 'delivered', 'completed'] as const;
type TabType = typeof TABS[number];

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  // Check authentication
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      if (!storedToken && !token) {
        toast.error('Please login to view your orders');
        router.push('/login');
      }
    }
  }, [token, router]);
  
  // Clear any stale order cache on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('orders_cache');
    }
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getAll();
      // Ensure we treat the response correctly based on your API structure
      let data = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response?.data) {
        data = Array.isArray(response.data) ? response.data : [];
      }
      console.log('📦 Fetched orders:', data);
      setOrders(data);
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again');
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        toast.error('Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial Fetch
  useEffect(() => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (storedToken || token) {
      console.log('🔄 Fetching orders on page load...');
      fetchOrders();
    }
  }, [token]);
  
  // Force refresh when coming back to orders page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Page became visible, refreshing orders...');
        fetchOrders();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  
  // Real-time updates for buyer orders
  useRealtimeOrders({
    userId: user?.id?.toString(),
    enabled: !!user?.id,
    onOrderUpdate: (data) => {
      console.log('Order update received:', data);
      toast.info(`Order status updated`);
      fetchOrders();
    }
  });

  // Action: Buyer pays for the order
  const handlePayNow = async (orderId: string) => {
    try {
      // Transition from PENDING -> TO_SHIP (backend expects uppercase with underscores)
      await orderAPI.updateStatus(orderId, 'TO_SHIP');
      toast.success('Payment confirmed! Waiting for seller to ship.');
      fetchOrders();
    } catch (error) {
      toast.error('Payment failed. Try again.');
    }
  };

  // Action: Buyer confirms receipt (Optional, usually implied by delivery)
  const handleOrderReceived = async (orderId: string) => {
     try {
       // Backend expects COMPLETED status
       await orderAPI.updateStatus(orderId, 'COMPLETED');
       toast.success('Order completed!');
       fetchOrders();
     } catch (error) {
       toast.error('Failed to update status.');
     }
  };

  // Filter orders by active tab
  // Note: Backend might use 'to-receive' or 'shipping'. Let's map them.
  const filteredOrders = Array.isArray(orders) ? orders.filter(order => {
    // Normalize status from backend
    const normalizedStatus = order.status?.toLowerCase().replace('_', '-');
    
    if (activeTab === 'all') return true; // Show all orders
    if (activeTab === 'to-pay') return normalizedStatus === 'to-pay' || normalizedStatus === 'pending';
    if (activeTab === 'to-ship') return normalizedStatus === 'to-ship';
    if (activeTab === 'shipping') return normalizedStatus === 'shipping' || normalizedStatus === 'to-receive';
    if (activeTab === 'delivered') return normalizedStatus === 'delivered' || normalizedStatus === 'completed';
    if (activeTab === 'completed') return normalizedStatus === 'completed';
    return normalizedStatus === activeTab;
  }) : [];

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-semibold text-sm whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-orange-500 text-orange-600 bg-orange-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.replace('-', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2].map((i) => <div key={i} className="bg-white h-48 rounded-lg shadow" />)}
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-5">
            {filteredOrders.map((order) => (
              <div key={order.id || order._id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <span className="font-black text-xl text-black">{order.shopName || 'Shop'}</span>
                      <span className="text-sm font-semibold text-black">| Order ID: {(order.id || order._id).slice(0, 8)}...</span>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${
                      order.status === 'COMPLETED' || order.status === 'completed' ? 'bg-green-500 text-white' : 
                      order.status === 'PENDING' || order.status === 'pending' ? 'bg-yellow-500 text-white' :
                      order.status === 'TO_SHIP' || order.status === 'to-ship' ? 'bg-blue-500 text-white' :
                      order.status === 'TO_RECEIVE' || order.status === 'to-receive' ? 'bg-purple-500 text-white' :
                      'bg-orange-500 text-white'
                    }`}>
                      {order.status.replace('_', ' ').replace('-', ' ')}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-black mt-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Placed on: {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>

                {/* Items */}
                <div className="px-6 py-5 space-y-4">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-4 items-center">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="Product" className="w-full h-full object-cover"/>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-lg text-black truncate">{item.productName || item.product?.name || 'Unknown Product'}</p>
                        <p className="text-base font-semibold text-black mt-1">Quantity: <span className="font-bold text-black">x{item.quantity}</span></p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-xl text-black">₱{Number(item.price).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer / Actions */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                      <p className="text-sm font-semibold text-black mb-1">Order Total</p>
                      <p className="text-3xl font-black text-orange-600">₱{order.total?.toFixed(2)}</p>
                    </div>
                    
                    <div className="flex gap-3 flex-wrap">
                      {/* Pay Now button for PENDING orders */}
                      {(order.status?.toUpperCase() === 'PENDING' || order.status?.toLowerCase() === 'to-pay' || order.status?.toLowerCase() === 'pending') && (
                        <button 
                          onClick={() => handlePayNow(order.id || order._id)}
                          className="bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition-all font-bold shadow-md hover:shadow-lg flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          Pay Now
                        </button>
                      )}

                      {/* Logic for 'To Receive' / 'Shipping' Tab */}
                      {(order.status === 'shipping' || order.status === 'to-receive' || order.status === 'TO_RECEIVE') && (
                        <button 
                           onClick={() => handleOrderReceived(order.id || order._id)}
                           className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-all font-bold shadow-md hover:shadow-lg flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Order Received
                        </button>
                      )}

                      <Link
                        href={`/orders/${order.id || order._id}`}
                        className="border-2 border-gray-300 bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold shadow-sm flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md text-center py-20">
            <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p className="text-xl font-semibold text-black mb-2">No Orders Found</p>
            <p className="text-black mb-6">You don't have any orders in this tab.</p>
            <Link href="/products" className="bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition-all font-bold inline-flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Start Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}