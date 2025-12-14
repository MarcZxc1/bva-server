// marczxc1/bva-server/bva-server-feature-order-fulfillment/lazada-clone/src/app/(buyer)/orders/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { orderAPI } from '@/lib/api';
import Link from 'next/link';
import { toast } from 'sonner';
import { io } from 'socket.io-client';

const TABS = ['to-pay', 'to-ship', 'shipping', 'delivered', 'completed'] as const;
type TabType = typeof TABS[number];

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('to-pay');

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getAll();
      // Ensure we treat the response correctly based on your API structure
      const data = Array.isArray(response) ? response : response.data || [];
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial Fetch & Socket Setup
  useEffect(() => {
    fetchOrders();

    // Initialize Socket
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
    
    socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    // Listen for global order updates (Buyer specific)
    socket.on('order_status_changed', (data: any) => {
        console.log('Order update received:', data);
        toast.info(`Order status updated to ${data.status.replace('-', ' ')}`);
        // Refresh orders list
        fetchOrders(); 
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Action: Buyer pays for the order
  const handlePayNow = async (orderId: string) => {
    try {
      // Transition from 'to-pay' -> 'to-ship'
      await orderAPI.updateStatus(orderId, 'to-ship');
      toast.success('Payment confirmed! Waiting for seller to ship.');
      fetchOrders();
    } catch (error) {
      toast.error('Payment failed. Try again.');
    }
  };

  // Action: Buyer confirms receipt (Optional, usually implied by delivery)
  const handleOrderReceived = async (orderId: string) => {
     try {
       await orderAPI.updateStatus(orderId, 'completed');
       toast.success('Order completed!');
       fetchOrders();
     } catch (error) {
       toast.error('Failed to update status.');
     }
  };

  // Filter orders by active tab
  // Note: Backend might use 'to-receive' or 'shipping'. Let's map them.
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'shipping') return order.status === 'shipping' || order.status === 'to-receive';
    return order.status === activeTab;
  });

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      {/* Tabs */}
      <div className="flex border-b mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.replace('-', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map((i) => <div key={i} className="bg-gray-100 h-40 rounded-lg" />)}
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id || order._id} className="bg-white rounded-lg shadow border p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{order.shopName || 'Shop'}</span>
                    <span className="text-sm text-gray-500">| Order ID: {order.id || order._id}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Placed on: {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase 
                  ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                  {order.status.replace('-', ' ')}
                </span>
              </div>

              {/* Items */}
              <div className="border-t border-b py-4 space-y-3">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
                       {item.imageUrl && <img src={item.imageUrl} alt="Product" className="w-full h-full object-cover"/>}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.productName || item.product?.name}</p>
                      <p className="text-sm text-gray-500">x{item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₱{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer / Actions */}
              <div className="mt-4 flex justify-between items-center">
                <p className="text-xl font-bold">Total: ₱{order.total?.toFixed(2)}</p>
                
                <div className="flex gap-3">
                  {/* Logic for 'To Pay' Tab */}
                  {order.status === 'to-pay' && (
                    <button 
                      onClick={() => handlePayNow(order.id || order._id)}
                      className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 transition"
                    >
                      Pay Now
                    </button>
                  )}

                  {/* Logic for 'To Receive' / 'Shipping' Tab */}
                  {(order.status === 'shipping' || order.status === 'to-receive') && (
                    <button 
                       onClick={() => handleOrderReceived(order.id || order._id)}
                       className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
                    >
                      Order Received
                    </button>
                  )}

                  <Link
                    href={`/orders/${order.id || order._id}`}
                    className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 text-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-lg">
           <p className="text-gray-500 mb-4">No orders found in this tab.</p>
           <Link href="/products" className="text-blue-600 hover:underline">Go Shopping</Link>
        </div>
      )}
    </main>
  );
}