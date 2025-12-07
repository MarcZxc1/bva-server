import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, XCircle, RotateCw, User, MessageCircle, Store, Bell, Gift, Coins } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import BuyerNavbar from './components/BuyerNavbar';
import BuyerFooter from './components/BuyerFooter';
import { useOrders, OrderStatus } from '../../contexts/OrderContext';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/api';

const BuyerPurchase: React.FC = () => {
  const { orders, updateOrderStatus } = useOrders();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<OrderStatus>('all');
  
  const userName = user?.name || user?.username || user?.email || 'Guest User';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/buyer-login');
      return;
    }
    // Fetch orders from API and sync with context
    const fetchOrders = async () => {
      try {
        const apiOrders = await apiClient.getMyOrders();
        // Transform API orders to OrderContext format
        if (apiOrders && Array.isArray(apiOrders)) {
          // Note: Orders are managed in OrderContext for now
          // The API orders will be synced when orders are created via checkout
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      }
    };
    fetchOrders();
  }, [isAuthenticated, navigate]);

  React.useEffect(() => {
    // Add style to make navbar static on this page
    const style = document.createElement('style');
    style.textContent = `
      .buyer-purchase-page nav {
        position: relative !important;
        top: auto !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const getTabCount = (status: OrderStatus) => {
    if (status === 'all') return orders.length;
    return orders.filter(order => order.status === status).length;
  };

  const tabs: { label: string; value: OrderStatus; color: string }[] = [
    { label: 'All', value: 'all', color: 'text-gray-600' },
    { label: 'To Pay', value: 'to-pay', color: 'text-shopee-orange' },
    { label: 'To Ship', value: 'to-ship', color: 'text-blue-500' },
    { label: 'To Receive', value: 'to-receive', color: 'text-purple-500' },
    { label: 'Completed', value: 'completed', color: 'text-green-500' },
    { label: 'Cancelled', value: 'cancelled', color: 'text-red-500' },
    { label: 'Return Refund', value: 'return-refund', color: 'text-yellow-500' },
  ];

  const filteredOrders = activeTab === 'all' 
    ? orders 
    : orders.filter(order => order.status === activeTab);

  const handlePayNow = async (orderId: string) => {
    try {
      await apiClient.updateOrderStatus(orderId, 'pending');
      updateOrderStatus(orderId, 'to-ship');
    } catch (err: any) {
      alert(err.message || 'Failed to process payment');
    }
  };

  const handleRiderPickup = async (orderId: string) => {
    try {
      await apiClient.updateOrderStatus(orderId, 'shipping');
      updateOrderStatus(orderId, 'to-receive');
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const handleConfirmDelivery = async (orderId: string) => {
    try {
      await apiClient.updateOrderStatus(orderId, 'completed');
      updateOrderStatus(orderId, 'completed');
    } catch (err: any) {
      alert(err.message || 'Failed to confirm delivery');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      await apiClient.updateOrderStatus(orderId, 'cancelled');
      updateOrderStatus(orderId, 'cancelled');
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order');
    }
  };

  const handleReturnRefund = async (orderId: string, type: 'return' | 'refund') => {
    const reason = prompt(`Please provide a reason for ${type}:`);
    if (!reason) return;

    try {
      // Update order status to return-refund
      await apiClient.updateOrderStatus(orderId, 'return-refund');
      updateOrderStatus(orderId, 'return-refund');
      alert(`Your ${type} request has been submitted. The seller will review it shortly.`);
    } catch (err: any) {
      alert(err.message || `Failed to submit ${type} request`);
    }
  };

  // Group orders by shop
  const groupedOrders = filteredOrders.reduce((acc, order) => {
    if (!acc[order.shopName]) {
      acc[order.shopName] = [];
    }
    acc[order.shopName].push(order);
    return acc;
  }, {} as Record<string, typeof filteredOrders>);

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'to-pay':
        return <Package size={18} className="text-shopee-orange" />;
      case 'to-ship':
        return <Package size={18} className="text-blue-500" />;
      case 'to-receive':
        return <Truck size={18} className="text-purple-500" />;
      case 'completed':
        return <CheckCircle size={18} className="text-green-500" />;
      case 'cancelled':
        return <XCircle size={18} className="text-red-500" />;
      case 'return-refund':
        return <RotateCw size={18} className="text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'to-pay':
        return 'To Pay';
      case 'to-ship':
        return 'To Ship';
      case 'to-receive':
        return 'To Receive';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'return-refund':
        return 'Return/Refund';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col buyer-purchase-page">
      {/* Navbar - Static (not sticky) */}
      <BuyerNavbar />

      {/* Main Content */}
      <div className="flex-1">
        <div className="max-w-[1200px] mx-auto px-5 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Left Sidebar */}
            <div className="md:col-span-1">
              {/* User Info Card */}
              <div className="bg-white rounded-lg p-6 mb-6">
                <div className="text-center mb-4">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                    <User size={48} className="text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">{userName}</h3>
                  <Link to="/account" className="text-sm text-gray-500 hover:text-shopee-orange">✏️ Edit Profile</Link>
                </div>
              </div>

              {/* Menu Items */}
              <div className="bg-white rounded-lg overflow-hidden">
                <Link
                  to="/account"
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User size={20} />
                  <span>My Account</span>
                </Link>
                <Link
                  to="/purchase"
                  className="flex items-center gap-3 px-4 py-3 bg-orange-50 text-shopee-orange border-l-4 border-shopee-orange transition-colors"
                >
                  <Package size={20} />
                  <span className="font-semibold">My Purchase</span>
                </Link>
                <Link
                  to="#"
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Bell size={20} />
                  <span>Notifications</span>
                </Link>
                <Link
                  to="#"
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Gift size={20} />
                  <span>My Vouchers</span>
                </Link>
                <Link
                  to="#"
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Coins size={20} />
                  <span>My Shopee Coins</span>
                </Link>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="md:col-span-3">
              {/* Sticky Tab Bar */}
              <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm mb-6">
                <div className="flex items-center gap-8 overflow-x-auto">
                  {tabs.map(tab => {
                    const count = getTabCount(tab.value);
                    return (
                      <button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={`px-4 py-4 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                          activeTab === tab.value
                            ? 'text-shopee-orange border-shopee-orange'
                            : 'text-gray-600 border-transparent hover:text-gray-800 border-b-2'
                        }`}
                      >
                        {tab.label} {count > 0 && `(${count})`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Orders List */}
              {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-lg p-12 text-center">
                  <Package size={64} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedOrders).map(([shopName, shopOrders]) => (
                    <div key={shopName} className="bg-white rounded-lg overflow-hidden">
                      {/* Shop Header */}
                      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-800">{shopName}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
                            <MessageCircle size={16} />
                            Chat
                          </button>
                          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
                            <Store size={16} />
                            View Shop
                          </button>
                        </div>
                      </div>

                      {/* Orders for this shop */}
                      <div className="divide-y divide-gray-200">
                        {shopOrders.map(order => {
                          const originalPrice = order.unitPrice * 1.1; // Calculate approximate original price
                          return (
                            <div key={order.id} className="p-6">
                              <div className="flex items-start gap-4">
                                {/* Product Image */}
                                <div className="flex-shrink-0">
                                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                                    {order.product.image.startsWith('http') || order.product.image.startsWith('/') ? (
                                      <img src={order.product.image} alt={order.product.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-4xl">{order.product.image}</span>
                                    )}
                                  </div>
                                </div>

                                {/* Product Details */}
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-gray-800 mb-2">{order.product.fullName || order.product.name}</h3>
                                  {order.variations && (
                                    <p className="text-sm text-gray-600 mb-1">Variation: {order.variations}</p>
                                  )}
                                  <p className="text-sm text-gray-600 mb-3">x{order.quantity}</p>

                                  {/* Pricing */}
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-gray-400 text-sm line-through">₱{Math.round(originalPrice)}</span>
                                    <span className="text-shopee-orange font-semibold text-lg">₱{order.unitPrice}</span>
                                  </div>
                                </div>

                                {/* Status and Actions */}
                                <div className="flex-shrink-0 flex flex-col items-end gap-4">
                                  {/* Status Badge */}
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(order.status)}
                                    <span className={`font-semibold text-sm ${
                                      order.status === 'to-pay' ? 'text-shopee-orange' :
                                      order.status === 'to-ship' ? 'text-blue-500' :
                                      order.status === 'to-receive' ? 'text-purple-500' :
                                      order.status === 'completed' ? 'text-green-500' :
                                      order.status === 'cancelled' ? 'text-red-500' :
                                      order.status === 'return-refund' ? 'text-yellow-500' :
                                      'text-gray-600'
                                    }`}>
                                      {getStatusLabel(order.status).toUpperCase()}
                                    </span>
                                  </div>

                                  {/* Amount Payable */}
                                  <div className="text-right">
                                    <p className="text-xs text-gray-500 mb-1">Amount Payable:</p>
                                    <p className="text-lg font-bold text-red-600">₱{order.totalPrice.toLocaleString()}</p>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex flex-col gap-2 w-full">
                                    {order.status === 'to-pay' && (
                                      <>
                                        <button
                                          disabled
                                          className="px-4 py-2 bg-gray-200 text-gray-500 rounded text-sm font-medium cursor-not-allowed"
                                        >
                                          Pending
                                        </button>
                                        <button
                                          onClick={() => handlePayNow(order.id)}
                                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
                                        >
                                          Contact Seller
                                        </button>
                                        <button
                                          onClick={() => handleCancelOrder(order.id)}
                                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
                                        >
                                          Cancel Order
                                        </button>
                                      </>
                                    )}
                                    {order.status === 'to-ship' && (
                                      <>
                                        <button
                                          onClick={() => handleRiderPickup(order.id)}
                                          className="px-4 py-2 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 transition-colors"
                                        >
                                          Track Order
                                        </button>
                                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition-colors">
                                          Contact Seller
                                        </button>
                                      </>
                                    )}
                                    {order.status === 'to-receive' && (
                                      <>
                                        <button
                                          onClick={() => handleConfirmDelivery(order.id)}
                                          className="px-4 py-2 bg-shopee-orange text-white rounded text-sm font-medium hover:bg-shopee-orange-dark transition-colors"
                                        >
                                          Confirm Delivery
                                        </button>
                                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition-colors">
                                          Contact Seller
                                        </button>
                                      </>
                                    )}
                                    {order.status === 'completed' && (
                                      <>
                                        <button className="px-4 py-2 border border-shopee-orange text-shopee-orange rounded text-sm font-medium hover:bg-orange-50 transition-colors">
                                          Review
                                        </button>
                                        <button
                                          onClick={() => handleReturnRefund(order.id, 'return')}
                                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
                                        >
                                          Return
                                        </button>
                                        <button
                                          onClick={() => handleReturnRefund(order.id, 'refund')}
                                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
                                        >
                                          Refund
                                        </button>
                                      </>
                                    )}
                                    {order.status === 'return-refund' && (
                                      <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded text-sm font-medium text-center">
                                        Return/Refund Requested
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <BuyerFooter />
    </div>
  );
};

export default BuyerPurchase;
