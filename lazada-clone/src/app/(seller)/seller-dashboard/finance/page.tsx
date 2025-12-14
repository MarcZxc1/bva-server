'use client';

import { useAuthStore } from '@/store';
import { useState, useEffect } from 'react';
import { sellerAPI, authAPI } from '@/lib/api';
import { toast } from 'sonner';
import { IoWalletOutline, IoTrendingUpOutline, IoCalendarOutline, IoStatsChartOutline } from 'react-icons/io5';

type DateFilter = 'thisweek' | 'lastweek' | 'thismonth' | 'lastmonth';

interface IncomeData {
  pending: {
    total: number;
    orders: number; // This is a count, not an array
  };
  released: {
    total: number;
    thisWeek: number;
    thisMonth: number;
    orders: number; // This is a count, not an array
  };
  orders: any[]; // This is the array of order objects
}

export default function FinancePage() {
  const user = useAuthStore((state) => state.user);
  const shops = useAuthStore((state) => state.shops);
  const setUser = useAuthStore((state) => state.setUser);
  const [profileRefreshed, setProfileRefreshed] = useState(false);
  const [incomeData, setIncomeData] = useState<IncomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('thisweek');

  // Refresh profile data on mount
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

  // Get shop ID
  const allShops = user?.shops || shops || [];
  const lazadaShops = allShops.filter((s: any) => s.platform === 'LAZADA');
  const shopId = lazadaShops[0]?.id || allShops[0]?.id || user?.shopId;

  // Fetch income data
  useEffect(() => {
    const fetchIncome = async () => {
      if (!shopId || !profileRefreshed) return;

      try {
        setIsLoading(true);
        console.log('💰 Fetching income for shop:', shopId);
        
        const response = await sellerAPI.getIncome(shopId);
        console.log('✅ Income data:', response.data);
        
        // Extract data from response - handle both response.data and response.data.data
        const data = response.data.data || response.data;
        setIncomeData(data);
      } catch (error: any) {
        console.error('❌ Failed to fetch income:', error);
        toast.error('Failed to load income data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncome();
  }, [shopId, profileRefreshed]);

  // Filter orders by date
  const filteredOrders = incomeData?.orders?.filter((order) => {
    if (!order.createdAt) return false;

    const orderDate = new Date(order.createdAt);
    const now = new Date();
    const daysSinceOrder = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));

    switch (dateFilter) {
      case 'thisweek':
        return daysSinceOrder <= 7;
      case 'lastweek':
        return daysSinceOrder > 7 && daysSinceOrder <= 14;
      case 'thismonth':
        return daysSinceOrder <= 30;
      case 'lastmonth':
        return daysSinceOrder > 30 && daysSinceOrder <= 60;
      default:
        return true;
    }
  }) || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase().replace('_', '-');
    switch (statusLower) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'to-receive':
        return 'bg-blue-100 text-blue-700';
      case 'to-ship':
        return 'bg-yellow-100 text-yellow-700';
      case 'pending':
        return 'bg-gray-100 text-gray-700';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusLower = status.toLowerCase().replace('_', '-');
    return statusLower
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (!profileRefreshed || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!shopId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Shop Found</h2>
          <p className="text-gray-600">Please connect your shop first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Finance & Sales</h1>
        <p className="text-gray-600">Track your income and sales performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Pending Income */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-yellow-700 font-medium">Pending Income</span>
            <IoWalletOutline className="text-yellow-600 text-xl" />
          </div>
          <p className="text-2xl font-bold text-yellow-800">
            {formatCurrency(incomeData?.pending?.total || 0)}
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            {incomeData?.pending?.orders || 0} orders
          </p>
        </div>

        {/* Released Income */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-700 font-medium">Released Income</span>
            <IoStatsChartOutline className="text-green-600 text-xl" />
          </div>
          <p className="text-2xl font-bold text-green-800">
            {formatCurrency(incomeData?.released?.total || 0)}
          </p>
          <p className="text-xs text-green-600 mt-1">
            {incomeData?.released?.orders || 0} orders
          </p>
        </div>

        {/* This Week */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-700 font-medium">This Week</span>
            <IoTrendingUpOutline className="text-blue-600 text-xl" />
          </div>
          <p className="text-2xl font-bold text-blue-800">
            {formatCurrency(incomeData?.released?.thisWeek || 0)}
          </p>
          <p className="text-xs text-blue-600 mt-1">Released this week</p>
        </div>

        {/* This Month */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-purple-700 font-medium">This Month</span>
            <IoCalendarOutline className="text-purple-600 text-xl" />
          </div>
          <p className="text-2xl font-bold text-purple-800">
            {formatCurrency(incomeData?.released?.thisMonth || 0)}
          </p>
          <p className="text-xs text-purple-600 mt-1">Released this month</p>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Filter by:</span>
          <div className="flex gap-2">
            {[
              { value: 'thisweek', label: 'This Week' },
              { value: 'lastweek', label: 'Last Week' },
              { value: 'thismonth', label: 'This Month' },
              { value: 'lastmonth', label: 'Last Month' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setDateFilter(filter.value as DateFilter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateFilter === filter.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Sales Orders</h2>
          <p className="text-sm text-gray-600 mt-1">
            Showing {filteredOrders.length} orders
          </p>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <IoWalletOutline className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Sales Yet</h3>
            <p className="text-gray-600">Orders will appear here once customers make purchases.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {order.orderNumber || order.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {formatDate(order.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {order.buyer?.name || order.buyer?.email || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
