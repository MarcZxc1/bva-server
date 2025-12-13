'use client';

import { useEffect, useState } from 'react';
import { orderAPI } from '@/lib/api';
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await orderAPI.getAll();
        setOrders(response.data);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded animate-pulse" />
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Order ID: {order._id}</p>
                    <p className="text-2xl font-bold">${order.totalPrice.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`inline-block px-4 py-2 rounded font-semibold ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </p>
                  </div>
                </div>

                <div className="mb-4 pb-4 border-b">
                  <p className="text-sm text-gray-600 mb-2">Items:</p>
                  {order.items.map((item: any) => (
                    <div key={item._id} className="text-sm">
                      {item.product?.name} (x{item.quantity}) - ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  <Link
                    href={`/orders/${order._id}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">No orders yet</p>
            <Link href="/products" className="text-blue-600 hover:text-blue-900">
              Start Shopping
            </Link>
          </div>
        )}
      </main>
  );
}
