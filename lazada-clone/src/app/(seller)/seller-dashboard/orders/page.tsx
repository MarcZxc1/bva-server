'use client';

import { useAuthStore } from '@/store';
import { useOrders } from '@/hooks/useOrders';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { orderAPI, authAPI } from '@/lib/api';
import { toast } from 'sonner';

// 1. Define types clearly
type OrderStatus = 'all' | 'unpaid' | 'to-ship' | 'shipping' | 'delivered' | 'failed-delivery' | 'cancellation' | 'return-refund';
type OrderType = 'all' | 'normal' | 'pre-sale' | 'coupon' | 'cod' | 'store-pickup' | 'pre-order-by-days' | 'pre-order-by-date' | 'superlink' | 'installation';
type DateFilter = 'today' | 'yesterday' | 'last-7-days' | 'last-30-days' | 'custom';

interface Order {
  id: string;
  orderNumber: string;
  trackingNumber: string;
  productName: string;
  productImage: string;
  variant: string;
  quantity: number;
  totalAmount: number;
  customerName: string;
  shippingAddress: string;
  deliveryOption: string;
  status: OrderStatus;
  orderType: OrderType;
  orderDate: Date;
  paymentMethod: string;
}

export default function OrdersPage() {
  const user = useAuthStore((state) => state.user);
  const shops = useAuthStore((state) => state.shops);
  const setUser = useAuthStore((state) => state.setUser);
  const [profileRefreshed, setProfileRefreshed] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  
  // Refresh profile data on mount to ensure we have latest shop info
  useEffect(() => {
    const refreshProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('❌ No token found');
          setProfileRefreshed(true);
          return;
        }

        console.log('🔄 Refreshing profile...');
        const response = await authAPI.getProfile();
        const userData = response.data;
        const userShops = userData.shops || [];
        
        console.log('✅ Profile refreshed - Email:', userData.email, '| Shops:', userShops.length);
        if (userShops.length > 0) {
          console.log('   Shops:', userShops.map((s: any) => `${s.platform}-${s.id.slice(0, 8)}`).join(', '));
        }
        
        setUser(userData, token, userShops);
        setProfileRefreshed(true);
      } catch (error: any) {
        console.error('❌ Profile refresh failed:', error?.message || error);
        toast.error('Failed to load shop data. Please refresh the page.');
        setProfileRefreshed(true);
      }
    };
    refreshProfile();
  }, [setUser]);
  
  // Get all shops from user.shops or store shops
  const allShops = user?.shops || shops || [];
  
  console.log('🔍 All userShops:', allShops);
  console.log('🔍 First shop detail:', allShops[0]);
  
  // For Lazada Clone: Prioritize LAZADA shops, but fall back to any shop
  const lazadaShops = allShops.filter((s: any) => s.platform === 'LAZADA');
  console.log('🔍 Filtered LAZADA shops:', lazadaShops);
  
  const shopId = lazadaShops[0]?.id || allShops[0]?.id || user?.shopId;
  
  console.log('🔍 Orders Page Debug:', {
    profileRefreshed,
    allShopsCount: allShops.length,
    lazadaShopsCount: lazadaShops.length,
    selectedShopId: shopId,
    userId: user?.id,
    userEmail: user?.email,
    userPlatform: user?.platform,
    fallbackShop: allShops[0]
  });
  
  const { data: ordersData, isLoading, isError } = useOrders(shopId || '');
  const queryClient = useQueryClient();

  useRealtimeOrders({
    shopId: shopId,
    enabled: !!shopId,
    onOrderUpdate: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', shopId] });
    }
  });
  
  const [activeTab, setActiveTab] = useState<OrderStatus>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [orderTypeFilter, setOrderTypeFilter] = useState<OrderType>('all');
  const [orderNumberSearch, setOrderNumberSearch] = useState('');
  const [trackingNumberSearch, setTrackingNumberSearch] = useState('');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    console.log(`🚢 [Seller] Updating order ${orderId} to status: ${newStatus}`);
    try {
      // Map frontend status to backend status
      const statusMap: Record<string, string> = {
        'shipping': 'TO_RECEIVE',
        'delivered': 'COMPLETED',
        'to-ship': 'TO_SHIP',
        'unpaid': 'PENDING',
        'cancellation': 'CANCELLED',
      };
      
      const backendStatus = statusMap[newStatus] || newStatus.toUpperCase().replace('-', '_');
      
      await orderAPI.updateStatus(orderId, backendStatus);
      
      const displayStatus = newStatus.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
      toast.success(`Order status updated to ${displayStatus}`);
      
      queryClient.invalidateQueries({ queryKey: ['orders', shopId] });
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  // 2. Add explicit return type (Order[]) so downstream usage knows the type
  const orders = useMemo((): Order[] => {
    if (!ordersData?.data) {
      return [];
    }
    
    try {
      const processed = ordersData.data.map((order: any) => {
        // Map backend status to frontend format
        const statusMap: Record<string, OrderStatus> = {
          'TO_SHIP': 'to-ship',
          'TO_RECEIVE': 'shipping',
          'COMPLETED': 'delivered',
          'CANCELLED': 'cancellation',
          'PENDING': 'unpaid',
          'RETURNED': 'return-refund',
          'REFUNDED': 'return-refund',
          'FAILED': 'failed-delivery',
        };
        
        return {
          ...order,
          id: order.id,
          status: statusMap[order.status] || order.status?.toLowerCase() || 'to-ship',
          orderDate: new Date(order.createdAt),
          productName: order.items[0]?.productName || 'Unknown Product',
          quantity: order.items[0]?.quantity || 0,
          totalAmount: order.total || 0,
          orderNumber: order.id,
          trackingNumber: order.trackingNumber || '',
          productImage: order.productImage || '',
          variant: order.variant || '',
          customerName: order.customerName || 'Guest',
          shippingAddress: order.shippingAddress || '',
          deliveryOption: order.deliveryOption || 'Standard',
          orderType: order.orderType || 'normal',
          paymentMethod: order.paymentMethod || 'Online',
        };
      });
      
      if (processed.length > 0) {
        console.log('✅ Loaded', processed.length, 'orders');
      }
      return processed;
    } catch (error) {
      console.error('❌ Error processing orders:', error);
      toast.error('Error loading orders');
      return [];
    }
  }, [ordersData]);

  // Filter orders based on date
  const filterByDate = (order: Order) => {
    const now = new Date();
    const orderDate = order.orderDate;
    
    switch (dateFilter) {
      case 'today':
        return orderDate.toDateString() === now.toDateString();
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return orderDate.toDateString() === yesterday.toDateString();
      case 'last-7-days':
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return orderDate >= sevenDaysAgo;
      case 'last-30-days':
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return orderDate >= thirtyDaysAgo;
      case 'custom':
        if (customDateFrom && customDateTo) {
          const from = new Date(customDateFrom);
          const to = new Date(customDateTo);
          return orderDate >= from && orderDate <= to;
        }
        return true;
      default:
        return true;
    }
  };

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (activeTab !== 'all') {
      filtered = filtered.filter(order => order.status === activeTab);
    }

    filtered = filtered.filter(filterByDate);

    if (orderTypeFilter !== 'all') {
      filtered = filtered.filter(order => order.orderType === orderTypeFilter);
    }

    if (orderNumberSearch) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(orderNumberSearch.toLowerCase())
      );
    }

    if (trackingNumberSearch) {
      filtered = filtered.filter(order =>
        order.trackingNumber.toLowerCase().includes(trackingNumberSearch.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.orderDate.getTime() - a.orderDate.getTime();
        case 'oldest':
          return a.orderDate.getTime() - b.orderDate.getTime();
        case 'amount-high':
          return b.totalAmount - a.totalAmount;
        case 'amount-low':
          return a.totalAmount - b.totalAmount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [orders, activeTab, dateFilter, orderTypeFilter, orderNumberSearch, trackingNumberSearch, customDateFrom, customDateTo, sortBy]);

  const getOrderCount = (status: OrderStatus) => {
    if (status === 'all') return orders.length;
    return orders.filter(order => order.status === status).length;
  };

  const tabs = [
    { id: 'all', label: 'All', count: getOrderCount('all') },
    { id: 'unpaid', label: 'Unpaid', count: getOrderCount('unpaid') },
    { id: 'to-ship', label: 'To Ship', count: getOrderCount('to-ship') },
    { id: 'shipping', label: 'Shipping', count: getOrderCount('shipping') },
    { id: 'delivered', label: 'Delivered', count: getOrderCount('delivered') },
    { id: 'failed-delivery', label: 'Failed Delivery', count: getOrderCount('failed-delivery') },
    { id: 'cancellation', label: 'Cancellation', count: getOrderCount('cancellation') },
    { id: 'return-refund', label: 'Return or Refund', count: getOrderCount('return-refund') },
  ];

  // 3. Define pagination BEFORE it is used in toggleSelectAll
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Toggle order selection
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // 4. Now paginatedOrders is available here
  const toggleSelectAll = () => {
    if (selectedOrders.length === paginatedOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(paginatedOrders.map(order => order.id));
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Export orders
  const handleExport = () => {
    console.log('Exporting orders:', selectedOrders.length > 0 ? selectedOrders : 'all');
    alert(`Exporting ${selectedOrders.length > 0 ? selectedOrders.length : filteredOrders.length} orders`);
  };

  // Show loading while profile is being refreshed
  if (!profileRefreshed) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your shop data...</p>
        </div>
      </div>
    );
  }

  // Show error if no shop ID found after refresh
  if (!shopId) {
    const handleClearCacheAndRefresh = () => {
      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('shops');
      localStorage.removeItem('token');
      
      // Show toast
      toast.success('Cache cleared! Reloading...');
      
      // Reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
    };

    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Shop Found</h2>
          <p className="text-gray-600 mb-4">
            We couldn't find a LAZADA shop for your account.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Available shops: {allShops.map((s: any) => s.platform).join(', ') || 'None'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleClearCacheAndRefresh}
              className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Clear Cache & Refresh
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2 text-sm mb-2">
            <Link href="/seller-dashboard" className="text-gray-500 hover:text-blue-600">
              Home
            </Link>
            <span className="text-gray-400">&gt;</span>
            <span className="text-gray-700 font-medium">Order Management</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as OrderStatus)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          {/* Date Filters */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium text-gray-700">Order Date:</span>
            {['today', 'yesterday', 'last-7-days', 'last-30-days', 'custom'].map((filter) => (
              <button
                key={filter}
                onClick={() => setDateFilter(filter as DateFilter)}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  dateFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
            
            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2 ml-2">
                <input
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm"
                />
              </div>
            )}
          </div>

          {/* Order Type Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Order Type:</span>
            {[
              { id: 'all', label: 'All' },
              { id: 'normal', label: 'Normal' },
              { id: 'pre-sale', label: 'Pre-Sale' },
              { id: 'coupon', label: 'Coupon' },
              { id: 'cod', label: 'COD' },
              { id: 'store-pickup', label: 'Store Pickup' },
              { id: 'pre-order-by-days', label: 'Pre-Order(by days)' },
              { id: 'pre-order-by-date', label: 'Pre-Order(by date)' },
              { id: 'superlink', label: 'Superlink' },
              { id: 'installation', label: 'Installation' },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setOrderTypeFilter(type.id as OrderType)}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  orderTypeFilter === type.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search and Actions */}
        <div className="bg-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-2 flex-1">
              {['Order Number', 'Tracking Number'].map((placeholder, idx) => (
                <div key={idx} className="relative flex-1 max-w-xs">
                  <input
                    type="text"
                    value={idx === 0 ? orderNumberSearch : trackingNumberSearch}
                    onChange={(e) => idx === 0 ? setOrderNumberSearch(e.target.value) : setTrackingNumberSearch(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded text-sm font-medium transition-colors"
            >
              More {showMoreFilters ? '▲' : '▼'}
            </button>
          </div>

          {showMoreFilters && (
            <div className="pt-3 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <input type="text" placeholder="Search customer" className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                    <option value="">All</option>
                    <option value="credit-card">Credit Card</option>
                    <option value="cod">Cash on Delivery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Option</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                    <option value="">All</option>
                    <option value="standard">Standard Delivery</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Page {currentPage}, {filteredOrders.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} items
                </span>
                {selectedOrders.length > 0 && (
                  <span className="text-sm text-blue-600 font-medium">
                    {selectedOrders.length} selected
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleExport}
                  className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                  disabled={filteredOrders.length === 0}
                >
                  Export
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Sort By</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="amount-high">Amount (High to Low)</option>
                    <option value="amount-low">Amount (Low to High)</option>
                  </select>
                </div>
              </div>
            </div>

            <table className="w-full">
              <thead className="bg-gray-50 border-y border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Delivery</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-20 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => toggleOrderSelection(order.id)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-3">
                           <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                            {order.productImage ? (
                               <img src={order.productImage} alt={order.productName} className="w-full h-full object-cover rounded"/>
                            ) : (
                               <span className="text-gray-400 text-xs">No Image</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">{order.productName}</p>
                            <p className="text-xs text-gray-500 mt-1">{order.variant}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-blue-600 font-medium">Order: {order.orderNumber.substring(0,8)}...</p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-gray-900">₱{order.totalAmount.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mt-1">{order.paymentMethod}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{order.customerName}</p>
                          <p className="text-gray-400 text-xs mt-1">{formatDate(order.orderDate)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                         <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium w-fit ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'shipping' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'to-ship' ? 'bg-yellow-100 text-yellow-700' :
                            order.status === 'unpaid' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {order.status.replace('-', ' ')}
                          </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2 min-w-[140px]">
                          {/* Unpaid - View only */}
                          {order.status === 'unpaid' && (
                            <button className="text-sm text-blue-600 hover:text-blue-700 text-left font-medium">
                              📋 View Details
                            </button>
                          )}
                          
                          {/* To Ship - Ship Now button */}
                          {order.status === 'to-ship' && (
                            <>
                              <button 
                                onClick={() => handleUpdateStatus(order.id, 'shipping')}
                                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-all flex items-center justify-center gap-2"
                              >
                                🚚 Ship Now
                              </button>
                              <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                                View Details
                              </button>
                            </>
                          )}
                          
                          {/* Shipping - Confirm Delivery button */}
                          {order.status === 'shipping' && (
                            <>
                              <button 
                                onClick={() => handleUpdateStatus(order.id, 'delivered')}
                                className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium shadow-sm transition-all flex items-center justify-center gap-2"
                              >
                                ✓ Confirm Delivery
                              </button>
                              <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                                View Details
                              </button>
                            </>
                          )}
                          
                          {/* Delivered - Completed */}
                          {order.status === 'delivered' && (
                            <div className="flex flex-col gap-1">
                              <span className="text-sm text-green-600 font-semibold flex items-center gap-1">
                                ✓ Delivered
                              </span>
                              <button className="text-xs text-blue-600 hover:text-blue-700 font-medium text-left">
                                View Details
                              </button>
                            </div>
                          )}
                          
                          {/* Other statuses */}
                          {(order.status === 'cancellation' || order.status === 'return-refund' || order.status === 'failed-delivery') && (
                            <button className="text-sm text-blue-600 hover:text-blue-700 text-left font-medium">
                              📋 View Details
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                    Previous
                </button>
                <span className="text-sm text-gray-600">Page {currentPage} of {totalPages || 1}</span>
                <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                    Next
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}