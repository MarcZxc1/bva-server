'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { useRouter } from 'next/navigation';

export default function BVAIntegrationCheck() {
  const { user, shops, token, isHydrated } = useAuthStore();
  const router = useRouter();
  const [showPermission, setShowPermission] = useState(false);
  const [shop, setShop] = useState<any>(null);

  useEffect(() => {
    // Wait for store to hydrate
    if (!isHydrated) return;

    if (user && shops && shops.length > 0 && token) {
      // User is authenticated and has a shop
      setShop(shops[0]); // Use first shop
      setShowPermission(true);
    } else {
      // Not authenticated, redirect to seller login
      console.log('User not authenticated, redirecting to login...');
      router.push('/seller-login');
    }
  }, [user, shops, token, isHydrated, router]);

  const handleGrantPermission = () => {
    console.log('✅ User granted BVA permission');
    
    window.parent.postMessage({
      type: 'LAZADA_CLONE_AUTH_SUCCESS',
      shop: { 
        id: shop.id, 
        name: shop.name 
      },
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name 
      },
      token: token // Lazada JWT token for API access
    }, '*'); // Send to any origin (BVA Frontend)

    console.log('📤 Permission granted, message sent to BVA');
  };

  const handleDeny = () => {
    console.log('❌ User denied BVA permission');
    
    window.parent.postMessage({
      type: 'LAZADA_CLONE_AUTH_DENIED'
    }, '*');
  };

  if (!isHydrated || !showPermission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (showPermission && shop && user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg 
                className="w-8 h-8 text-orange-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 10V3L4 14h7v7l9-11h-7z" 
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              BVA Integration
            </h1>
            <p className="text-sm text-gray-600">
              Business Virtual Assistant
            </p>
          </div>

          {/* Shop Info */}
          <div className="bg-orange-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Connecting shop:</p>
            <p className="font-semibold text-gray-900">{shop?.name}</p>
            <p className="text-xs text-gray-500 mt-1">Owner: {user?.email}</p>
          </div>

          {/* Permission Details */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-900 mb-3">
              BVA would like to access:
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>View products and inventory</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>View sales and orders</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Receive real-time updates</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Generate analytics and insights</span>
              </li>
            </ul>
          </div>

          {/* Important Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>📌 Important:</strong> BVA will only <strong>read</strong> your data. 
              It will never modify, delete, or create products/orders in Lazada.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleGrantPermission}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
            >
              Grant Permission
            </button>
            <button
              onClick={handleDeny}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              Deny
            </button>
          </div>

          {/* Footer */}
          <p className="text-xs text-center text-gray-500 mt-6">
            You can disconnect this integration at any time from BVA Settings
          </p>
        </div>
      </div>
    );
  }

  return null;
}

