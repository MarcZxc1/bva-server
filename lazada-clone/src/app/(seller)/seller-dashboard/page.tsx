'use client';

import React, { useState, useEffect } from 'react';
import { IoMailOutline, IoLocationOutline, IoCardOutline, IoStorefrontOutline } from 'react-icons/io5';
import Link from 'next/link';
import { sellerAPI, authAPI } from '@/lib/api';

interface DashboardMetrics {
  revenue: number;
  visitors: number;
  orders: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
}

export default function SellerDashboardPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    revenue: 0,
    visitors: 0,
    orders: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get user profile to get shop info
        const profileResponse = await authAPI.getProfile();
        const userData = profileResponse.data;
        setUser(userData);

        // Get shop ID from user's shops - prioritize LAZADA shops for Lazada Clone
        if (userData.shops && userData.shops.length > 0) {
          // First try to find a LAZADA shop, fall back to first shop
          const lazadaShop = userData.shops.find((s: any) => s.platform === 'LAZADA');
          const shop = lazadaShop || userData.shops[0];
          setShopId(shop.id);

          // Fetch dashboard metrics
          const dashboardResponse = await sellerAPI.getDashboard(shop.id);
          const dashboardData = dashboardResponse.data.data || dashboardResponse.data;

          console.log('📊 Dashboard metrics:', dashboardData.metrics);

          setMetrics({
            revenue: dashboardData.metrics?.totalRevenue || 0,
            visitors: 0, // Visitors tracking not implemented yet
            orders: dashboardData.metrics?.totalOrders || 0,
            totalProducts: dashboardData.metrics?.totalProducts || 0,
            totalOrders: dashboardData.metrics?.totalOrders || 0,
            totalRevenue: dashboardData.metrics?.totalRevenue || 0,
            monthlyRevenue: dashboardData.metrics?.monthlyRevenue || 0,
            weeklyRevenue: dashboardData.metrics?.weeklyRevenue || 0,
          });

          console.log('✅ Metrics set:', {
            totalRevenue: dashboardData.metrics?.totalRevenue || 0,
            totalOrders: dashboardData.metrics?.totalOrders || 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleResetData = async () => {
    if (!confirm('Are you sure you want to reset all product stock? This action cannot be undone.')) {
      return;
    }

    try {
      // This would need a backend endpoint to reset stock
      // For now, we'll just show an alert
      alert('Reset Data feature will be implemented with backend endpoint');
    } catch (error) {
      console.error('Failed to reset data:', error);
      alert('Failed to reset data');
    }
  };

  const steps = [
    { number: 1, label: 'Email', icon: IoMailOutline },
    { number: 2, label: 'Address', icon: IoLocationOutline },
    { number: 3, label: 'ID Bank', icon: IoCardOutline },
    { number: 4, label: 'Product', icon: IoStorefrontOutline },
  ];

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-blue-50 to-gray-100 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f146d] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-gray-100 overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl text-gray-800">
            Good afternoon, <span className="text-[#0f146d] font-semibold">{user?.name || 'Seller'}</span>
          </h1>
        </div>

        {/* Key Metrics Cards - Lazada Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Revenue Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-[#0f146d]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
              <svg className="w-5 h-5 text-[#0f146d]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.314 1.531c.562.649 1.413 1.076 2.461 1.076V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.311-1.531A4.535 4.535 0 0011 5.092V4a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 5.234 6 6.009 6 7c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.314 1.531c.562.649 1.413 1.076 2.461 1.076V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.311-1.531A4.535 4.535 0 0011 5.092V4a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 5.234 6 6.009 6 7c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.314 1.531c.562.649 1.413 1.076 2.461 1.076V11a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 9.766 14 8.991 14 8c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 5.092V3a1 1 0 10-2 0v2.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v2.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.314 1.531c.562.649 1.413 1.076 2.461 1.076V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-[#0f146d]">₱{metrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-xs text-gray-500 mt-1">Monthly: ₱{metrics.monthlyRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>

          {/* Visitors Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-[#f57224]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Visitors</h3>
              <svg className="w-5 h-5 text-[#f57224]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-[#f57224]">{metrics.visitors.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </div>

          {/* Orders Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-[#0f146d]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Orders</h3>
              <svg className="w-5 h-5 text-[#0f146d]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-[#0f146d]">{metrics.orders.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </div>
        </div>

        {/* User Info and Notification in one row */}
        <div className="flex gap-6 mb-6">
          {/* User Info Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 w-64">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#0f146d] to-[#f57224] rounded-full flex items-center justify-center text-white text-xl font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{user?.name || 'Seller'}</h3>
                <p className="text-sm text-gray-500">Seller Full Access</p>
              </div>
            </div>
          </div>

          {/* Notification Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Notification</h2>
                <p className="text-gray-600">
                  <span className="font-semibold">You are updated!</span> There's no new important notification for you.
                </p>
              </div>
              <button className="text-[#0f146d] text-sm hover:underline whitespace-nowrap ml-4">More &gt;</button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/seller-dashboard/add-product" className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0f146d] hover:bg-[#0f146d]/5 transition-colors">
              <svg className="w-8 h-8 text-[#0f146d] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Add Product</span>
            </Link>
            <Link href="/seller-dashboard/manage-products" className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0f146d] hover:bg-[#0f146d]/5 transition-colors">
              <svg className="w-8 h-8 text-[#0f146d] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Manage Products</span>
            </Link>
            <Link href="/seller-dashboard/orders" className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0f146d] hover:bg-[#0f146d]/5 transition-colors">
              <svg className="w-8 h-8 text-[#0f146d] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-sm font-medium text-gray-700">View Orders</span>
            </Link>
            <button
              onClick={handleResetData}
              className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#f57224] hover:bg-[#f57224]/5 transition-colors"
            >
              <svg className="w-8 h-8 text-[#f57224] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Reset Data</span>
            </button>
          </div>
        </div>

        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-[#0f146d] to-[#0f146d]/90 rounded-2xl shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-8">Welcome to Lazada!</h2>

          {/* Steps */}
          <div className="mb-8 flex justify-center">
            <div className="flex items-center max-w-4xl w-full px-8">
              {steps.map((step, index) => (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 font-semibold ${
                        currentStep === step.number
                          ? 'bg-white text-[#0f146d]'
                          : currentStep > step.number
                          ? 'bg-white text-[#0f146d]'
                          : 'bg-white/40 text-white'
                      }`}
                    >
                      {step.number}
                    </div>
                    <span className="text-sm font-medium">{step.label}</span>
                  </div>
                  
                  {/* Line between steps (not on last step) */}
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 bg-white/40 mx-6"></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-48 h-48 bg-[#0f146d]/10 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 bg-white rounded-lg shadow-md mx-auto mb-4 flex items-center justify-center">
                    <IoMailOutline className="text-6xl text-[#0f146d]" />
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Input an email to receive crucial updates and notifications
            </h3>

            <p className="text-gray-500 text-sm mb-6">no video</p>

            <button className="bg-[#0f146d] text-white px-32 py-3 rounded-lg font-medium hover:bg-[#0f146d]/90 transition mb-4">
              Add
            </button>

            <p className="text-gray-600 text-sm">Add Email to protect your account!</p>

            <div className="mt-6 text-left inline-block bg-gray-800 text-white px-4 py-2 rounded-lg text-sm">
              Click here to complete your information and start selling!
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-20 bg-white border-l border-gray-200 flex flex-col items-center py-6 gap-4 flex-shrink-0">
        <button className="w-12 h-12 rounded-full bg-[#0f146d]/10 flex items-center justify-center hover:bg-[#0f146d]/20 transition">
          <svg className="w-6 h-6 text-[#0f146d]" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
            <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
          </svg>
        </button>

        <button className="w-12 h-12 rounded-full bg-[#f57224]/10 flex items-center justify-center hover:bg-[#f57224]/20 transition">
          <svg className="w-6 h-6 text-[#f57224]" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
        </button>

        <button className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center hover:bg-purple-200 transition">
          <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </button>

        <button className="w-12 h-12 rounded-full bg-[#0f146d]/10 flex items-center justify-center hover:bg-[#0f146d]/20 transition">
          <svg className="w-6 h-6 text-[#0f146d]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="flex-1"></div>

        <button className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition rounded-lg">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>

        <button className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition rounded-lg">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
