'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store';

const BVAIntegrationCheck = () => {
  const { user, token, isLoggedIn } = useAuthStore();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Get token from localStorage as fallback (in case auth store isn't updated)
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return token || localStorage.getItem('token') || localStorage.getItem('authToken');
    }
    return token;
  };

  // Fetch shop information from API
  useEffect(() => {
    const fetchShop = async () => {
      const authToken = getToken();
      if (!isLoggedIn || !authToken) {
        setLoading(false);
        return;
      }

      try {
        // Get API URL from environment or use default (main server)
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
        
        // Try to get shop from API
        const response = await fetch(`${API_URL}/shops/my`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const shopData = await response.json();
          setShop(shopData);
        } else if (response.status === 404) {
          // User doesn't have a shop yet
          setShop(null);
        } else {
          console.error('Error fetching shop:', response.status);
        }
      } catch (error) {
        console.error('Error fetching shop:', error);
      } finally {
        setLoading(false);
      }
    };

    const authToken = getToken();
    if (isLoggedIn && authToken) {
      fetchShop();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, token]);

  useEffect(() => {
    // Check if we're in an iframe (BVA integration context)
    const isInIframe = window.self !== window.top;
    
    if (!isInIframe) {
      // If not in iframe, redirect to home
      window.location.href = '/';
      return;
    }

    if (loading) {
      return; // Wait for shop data to load
    }

    const authToken = getToken();
    
    // If user is authenticated and has a shop
    if (isLoggedIn && user && authToken && shop) {
      // Show permission modal first
      if (!hasRequestedPermission) {
        setShowPermissionModal(true);
        return;
      }
    } else if (isLoggedIn && user && authToken && !shop) {
      // User is logged in but has no shop
      const message = {
        type: 'LAZADA_CLONE_AUTH_ERROR',
        error: 'User does not have a shop. Please create a shop first.',
      };
      
      if (window.parent) {
        window.parent.postMessage(message, '*');
      }
    } else if (!isLoggedIn || !authToken) {
      // User is not authenticated
      const message = {
        type: 'LAZADA_CLONE_AUTH_REQUIRED',
        message: 'Please login to Lazada-Clone to continue.',
      };
      
      if (window.parent) {
        window.parent.postMessage(message, '*');
      }
    }
  }, [isLoggedIn, user, token, shop, hasRequestedPermission, loading]);

  const handleGrantPermission = () => {
    const authToken = getToken();
    if (isLoggedIn && user && authToken && shop) {
      // Send shop info and token to parent window (BVA Frontend)
      const message = {
        type: 'LAZADA_CLONE_AUTH_SUCCESS',
        shop: {
          id: shop.id || shop._id?.toString(),
          name: shop.name,
        },
        user: {
          id: (user as any).id || (user as any)._id?.toString(),
          email: (user as any).email,
          name: (user as any).name || (user as any).username,
        },
        token: authToken, // Include the Lazada-Clone JWT token
      };
      
      // Send to parent window
      if (window.parent) {
        window.parent.postMessage(message, '*');
        console.log('✅ Sent shop info and token to BVA');
      }
      
      setShowPermissionModal(false);
      setHasRequestedPermission(true);
    } else {
      const message = {
        type: 'LAZADA_CLONE_AUTH_ERROR',
        error: 'Shop information not found. Please create a shop first.',
      };
      if (window.parent) {
        window.parent.postMessage(message, '*');
      }
    }
  };

  const handleDenyPermission = () => {
    const message = {
      type: 'LAZADA_CLONE_AUTH_ERROR',
      error: 'Permission denied. BVA cannot access your shop data without your consent.',
    };
    
    if (window.parent) {
      window.parent.postMessage(message, '*');
    }
    
    setShowPermissionModal(false);
  };

  // If not authenticated, show login redirect
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">
              Login to Lazada-Clone
            </h2>
            <p className="text-sm text-center text-gray-600 mb-6">
              Please login with your seller account to connect with BVA
            </p>
            <div className="text-center">
              <a 
                href="/seller-login" 
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Login
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  // Show permission modal when authenticated
  const authToken = getToken();
  if (showPermissionModal && isLoggedIn && user && authToken && shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Grant Permission to BVA
            </h2>
            <p className="text-sm text-gray-600">
              BVA wants to access your shop data
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Shop:</strong> {shop.name}
            </p>
            <p className="text-sm text-gray-700 mb-3">
              <strong>Account:</strong> {(user as any).email}
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <h3 className="font-semibold text-gray-800">BVA will be able to:</h3>
            <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
              <li>Access your product catalog and inventory</li>
              <li>View your sales data and order information</li>
              <li>Sync data for analytics and forecasting</li>
              <li>Generate AI-powered recommendations</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> Your data will be processed securely. You can revoke this permission at any time from BVA Settings.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDenyPermission}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Deny
            </button>
            <button
              onClick={handleGrantPermission}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Grant Permission
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated and permission granted, show connecting
  if (isLoggedIn && user && hasRequestedPermission && shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700">Connecting to BVA...</p>
        </div>
      </div>
    );
  }

  // Show login if no shop
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">
            Login to Lazada-Clone
          </h2>
          <p className="text-sm text-center text-gray-600 mb-6">
            Please login with your seller account to connect with BVA
          </p>
          <div className="text-center">
            <a 
              href="/seller-login" 
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BVAIntegrationCheck;

