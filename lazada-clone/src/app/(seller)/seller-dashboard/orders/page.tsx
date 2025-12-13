'use client';

import { useAuthStore } from '@/store';
import { useOrders } from '@/hooks/useOrders';
import { useState, useMemo } from 'react';
import Link from 'next/link';

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

  const orders = useMemo(() => {
    if (!ordersData?.data) return [];
    return ordersData.data.map((order: any) => ({
      ...order,
      orderDate: new Date(order.createdAt),
      productName: order.items[0]?.productName || 'Unknown Product',
      quantity: order.items[0]?.quantity || 0,
      totalAmount: order.total,
      orderNumber: order.id,
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

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Filter by status tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(order => order.status === activeTab);
    }

    // Filter by date
    filtered = filtered.filter(filterByDate);

    // Filter by order type
    if (orderTypeFilter !== 'all') {
      filtered = filtered.filter(order => order.orderType === orderTypeFilter);
    }

    // Filter by order number search
    if (orderNumberSearch) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(orderNumberSearch.toLowerCase())
      );
    }

    // Filter by tracking number search
    if (trackingNumberSearch) {
      filtered = filtered.filter(order =>
        order.trackingNumber.toLowerCase().includes(trackingNumberSearch.toLowerCase())
      );
    }

    // Sort orders
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

  // Calculate counts for tabs
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

  // Pagination
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
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                dateFilter === 'today'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('yesterday')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                dateFilter === 'yesterday'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => setDateFilter('last-7-days')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                dateFilter === 'last-7-days'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 7 days
            </button>
            <button
              onClick={() => setDateFilter('last-30-days')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                dateFilter === 'last-30-days'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 30 days
            </button>
            <button
              onClick={() => setDateFilter('custom')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                dateFilter === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom
            </button>
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
            {/* Order Number Search */}
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-xs">
                <input
                  type="text"
                  value={orderNumberSearch}
                  onChange={(e) => setOrderNumberSearch(e.target.value)}
                  placeholder="Order Number"
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>

              {/* Tracking Number Search */}
              <div className="relative flex-1 max-w-xs">
                <input
                  type="text"
                  value={trackingNumberSearch}
                  onChange={(e) => setTrackingNumberSearch(e.target.value)}
                  placeholder="Tracking Number"
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded text-sm font-medium transition-colors"
            >
              More {showMoreFilters ? '▲' : '▼'}
            </button>
          </div>

          {/* More Filters (Collapsible) */}
          {showMoreFilters && (
            <div className="pt-3 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    placeholder="Search customer"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                    <option value="">All</option>
                    <option value="credit-card">Credit Card</option>
                    <option value="gcash">GCash</option>
                    <option value="paymaya">PayMaya</option>
                    <option value="cod">Cash on Delivery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Option</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                    <option value="">All</option>
                    <option value="standard">Standard Delivery</option>
                    <option value="express">Express Delivery</option>
                    <option value="same-day">Same Day Delivery</option>
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
                  Page {currentPage}, {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} items
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
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Sort By</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newest">Newest Order Created</option>
                    <option value="oldest">Oldest Order Created</option>
                    <option value="amount-high">Amount (High to Low)</option>
                    <option value="amount-low">Amount (Low to High)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table Header */}
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
                    <td colSpan={6} className="px-4 py-20 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="text-gray-400 text-lg font-medium">Empty Data</div>
                        <p className="text-gray-500 text-sm mt-2">No orders found matching your filters</p>
                      </div>
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
                          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-400 text-xs">No Image</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">{order.productName}</p>
                            <p className="text-xs text-gray-500 mt-1">{order.variant}</p>
                            <p className="text-xs text-gray-500">Qty: {order.quantity}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-blue-600 font-medium">Order: {order.orderNumber}</p>
                              <span className="text-xs text-gray-400">|</span>
                              <p className="text-xs text-gray-500">Track: {order.trackingNumber}</p>
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
                          <p className="text-gray-500 text-xs">{order.shippingAddress}</p>
                          <p className="text-gray-500 text-xs mt-1">{order.deliveryOption}</p>
                          <p className="text-gray-400 text-xs mt-1">{formatDate(order.orderDate)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium w-fit ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'shipping' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'to-ship' ? 'bg-yellow-100 text-yellow-700' :
                            order.status === 'unpaid' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {order.status === 'to-ship' ? 'To Ship' :
                             order.status === 'shipping' ? 'Shipping' :
                             order.status === 'delivered' ? 'Delivered' :
                             order.status === 'unpaid' ? 'Unpaid' :
                             order.status}
                          </span>
                          <span className="text-xs text-gray-600 capitalize">
                            {order.orderType.replace(/-/g, ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          {order.status === 'to-ship' && (
                            <>
                              <button className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">
                                Arrange Shipment
                              </button>
                              <button className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50 transition-colors">
                                Print
                              </button>
                            </>
                          )}
                          {order.status === 'shipping' && (
                            <button className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50 transition-colors">
                              Track Order
                            </button>
                          )}
                          {order.status === 'unpaid' && (
                            <button className="px-3 py-1.5 border border-red-300 text-red-700 text-xs rounded hover:bg-red-50 transition-colors">
                              Cancel Order
                            </button>
                          )}
                          <button className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50 transition-colors">
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                « Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 rounded text-sm transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="text-gray-500 px-2">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next »
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
