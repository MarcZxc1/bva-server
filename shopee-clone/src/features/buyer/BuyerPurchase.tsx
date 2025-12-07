import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, XCircle, RotateCw, User, MessageCircle, Store, Bell, Gift, Coins } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import BuyerNavbar from './components/BuyerNavbar';
import BuyerFooter from './components/BuyerFooter';
import { useOrders, OrderStatus, Order } from '../../contexts/OrderContext';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/api';

const BuyerPurchase: React.FC = () => {
  const { updateOrderStatus } = useOrders();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<OrderStatus>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'online' | null>(null);
  
  const userName = user?.name || user?.username || user?.email || 'Guest User';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/buyer-login');
      return;
    }
    // Fetch orders from API and sync with context
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const apiOrders = await apiClient.getMyOrders();
        // Transform API orders to OrderContext format
        if (apiOrders && Array.isArray(apiOrders)) {
          const transformedOrders: Order[] = apiOrders.map((apiOrder: any) => {
            const items = Array.isArray(apiOrder.items) ? apiOrder.items : [];
            const firstItem = items[0] || {};
            return {
              id: apiOrder.id,
              product: {
                name: firstItem.productName || 'Product',
                fullName: firstItem.productName || 'Product',
                image: '📦',
              },
              status: (apiOrder.status || 'to-pay') as OrderStatus,
              price: firstItem.price || apiOrder.total || 0,
              quantity: firstItem.quantity || 1,
              totalPrice: apiOrder.total || 0,
              date: new Date(apiOrder.createdAt).toISOString().split('T')[0],
              shopName: apiOrder.shopName || 'Shop',
              variations: '',
              unitPrice: firstItem.price || apiOrder.total || 0,
              paymentMethod: 'cash',
            };
          });
          setOrders(transformedOrders);
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setIsLoading(false);
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

  const handlePayNow = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedOrderId || !selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }

    try {
      await apiClient.updateOrderStatus(selectedOrderId, 'to-ship');
      updateOrderStatus(selectedOrderId, 'to-ship');
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === selectedOrderId ? { ...order, status: 'to-ship', paymentMethod: selectedPaymentMethod } : order
        )
      );
      setShowPaymentModal(false);
      setSelectedOrderId(null);
      setSelectedPaymentMethod(null);
      alert('Payment confirmed! Your order is now being processed.');
    } catch (err: any) {
      alert(err.message || 'Failed to process payment');
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
  }, {} as Record<string, Order[]>);

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
              {isLoading ? (
                <div className="bg-white rounded-lg p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-shopee-orange mb-4"></div>
                  <p className="text-gray-500 text-lg">Loading orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
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
                                          onClick={() => handlePayNow(order.id)}
                                          className="px-4 py-2 bg-shopee-orange text-white rounded text-sm font-medium hover:bg-shopee-orange-dark transition-colors"
                                        >
                                          Pay Now
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
                                        <div className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded text-sm font-medium text-center">
                                          Waiting for seller to ship
                                        </div>
                                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition-colors">
                                          Contact Seller
                                        </button>
                                      </>
                                    )}
                                    {order.status === 'to-receive' && (
                                      <>
                                        <div className="px-4 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded text-sm font-medium text-center">
                                          Waiting for seller to confirm delivery
                                        </div>
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

      {/* Payment Method Selection Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Select Payment Method</h2>
            <div className="space-y-3 mb-6">
              <button
                onClick={() => setSelectedPaymentMethod('cash')}
                className={`w-full px-4 py-3 border-2 rounded-lg text-left transition-colors ${
                  selectedPaymentMethod === 'cash'
                    ? 'border-shopee-orange bg-orange-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-800">Cash on Delivery (COD)</div>
                    <div className="text-sm text-gray-600">Pay when you receive the item</div>
                  </div>
                  {selectedPaymentMethod === 'cash' && (
                    <div className="w-5 h-5 rounded-full bg-shopee-orange flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </button>
              <button
                onClick={() => setSelectedPaymentMethod('online')}
                className={`w-full px-4 py-3 border-2 rounded-lg text-left transition-colors ${
                  selectedPaymentMethod === 'online'
                    ? 'border-shopee-orange bg-orange-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-800">Online Payment</div>
                    <div className="text-sm text-gray-600">Pay via credit card, e-wallet, etc.</div>
                  </div>
                  {selectedPaymentMethod === 'online' && (
                    <div className="w-5 h-5 rounded-full bg-shopee-orange flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedOrderId(null);
                  setSelectedPaymentMethod(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={!selectedPaymentMethod}
                className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
                  selectedPaymentMethod
                    ? 'bg-shopee-orange text-white hover:bg-shopee-orange-dark'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <BuyerFooter />
    </div>
  );
};

export default BuyerPurchase;
