'use client';

import { useAuthStore } from '@/store';
import { useOrders } from '@/hooks/useOrders';
import { useState, useMemo } from 'react';
import Link from 'next/link';

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
  const shopId = user?.shopId;
  const { data: ordersData, isLoading, isError } = useOrders(shopId || '');
  
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

  // 2. Add explicit return type (Order[]) so downstream usage knows the type
  const orders = useMemo((): Order[] => {
    if (!ordersData?.data) return [];
    return ordersData.data.map((order: any) => ({
      ...order,
      orderDate: new Date(order.createdAt),
      productName: order.items[0]?.productName || 'Unknown Product',
      quantity: order.items[0]?.quantity || 0,
      totalAmount: order.total,
      orderNumber: order.id,
      // Ensure required fields exist or have defaults
      trackingNumber: order.trackingNumber || '',
      productImage: order.productImage || '',
      variant: order.variant || '',
      customerName: order.customerName || 'Guest',
      shippingAddress: order.shippingAddress || '',
      deliveryOption: order.deliveryOption || 'Standard',
      orderType: order.orderType || 'normal',
      paymentMethod: order.paymentMethod || 'Online',
    }));
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
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
        <div className="flex-1 overflow-auto bg-white">
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
                        <button className="text-blue-600 text-sm hover:underline">View</button>
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