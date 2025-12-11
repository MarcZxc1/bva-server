import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Login from '../features/auth/components/Login';

const BVAIntegrationCheck: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

  useEffect(() => {
    // Check if we're in an iframe (BVA integration context)
    const isInIframe = window.self !== window.top;
    
    if (!isInIframe) {
      // If not in iframe, redirect to home
      window.location.href = '/';
      return;
    }

    // If user is authenticated and is a seller with a shop
    if (isAuthenticated && user) {
      if (user.role === 'SELLER' && user.shops && user.shops.length > 0) {
        // Show permission modal first
        if (!hasRequestedPermission) {
          setShowPermissionModal(true);
          return;
        }
      } else {
        // User is logged in but not a seller or has no shop
        const message = {
          type: 'SHOPEE_CLONE_AUTH_ERROR',
          error: user.role !== 'SELLER' 
            ? 'User is not a seller. Please login with a seller account.'
            : 'User does not have a shop. Please create a shop first.',
        };
        
        if (window.parent) {
          window.parent.postMessage(message, '*');
        }
      }
    } else {
      // User is not authenticated
      const message = {
        type: 'SHOPEE_CLONE_AUTH_REQUIRED',
        message: 'Please login to Shopee-Clone to continue.',
      };
      
      if (window.parent) {
        window.parent.postMessage(message, '*');
      }
    }
  }, [isAuthenticated, user, hasRequestedPermission]);

  const handleGrantPermission = () => {
    if (isAuthenticated && user && user.role === 'SELLER' && user.shops && user.shops.length > 0) {
      const shop = user.shops[0];
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        const message = {
          type: 'SHOPEE_CLONE_AUTH_ERROR',
          error: 'Authentication token not found. Please login again.',
        };
        if (window.parent) {
          window.parent.postMessage(message, '*');
        }
        return;
      }
      
      // Send shop info and token to parent window (BVA Frontend)
      const message = {
        type: 'SHOPEE_CLONE_AUTH_SUCCESS',
        shop: {
          id: shop.id,
          name: shop.name,
        },
        user: {
          id: user.id,
          email: user.email,
          name: user.name || user.username,
        },
        token: token, // Include the Shopee-Clone JWT token
      };
      
      // Send to parent window
      if (window.parent) {
        window.parent.postMessage(message, '*');
        console.log('✅ Sent shop info and token to BVA');
      }
      
      setShowPermissionModal(false);
      setHasRequestedPermission(true);
    }
  };

  const handleDenyPermission = () => {
    const message = {
      type: 'SHOPEE_CLONE_AUTH_ERROR',
      error: 'Permission denied. BVA cannot access your shop data without your consent.',
    };
    
    if (window.parent) {
      window.parent.postMessage(message, '*');
    }
    
    setShowPermissionModal(false);
  };


  // If not authenticated, show login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">
              Login to Shopee-Clone
            </h2>
            <p className="text-sm text-center text-gray-600 mb-6">
              Please login with your seller account to connect with BVA
            </p>
            <Login />
          </div>
        </div>
      </div>
    );
  }

  // Show permission modal when authenticated
  if (showPermissionModal && isAuthenticated && user && user.role === 'SELLER' && user.shops && user.shops.length > 0) {
    const shop = user.shops[0];
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
              <strong>Account:</strong> {user.email}
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
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Grant Permission
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated and permission granted, show connecting
  if (isAuthenticated && user && hasRequestedPermission) {
    if (user.role === 'SELLER' && user.shops && user.shops.length > 0) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-700">Connecting to BVA...</p>
          </div>
        </div>
      );
    }
  }

  // Show login if not seller or no shop
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">
            Login to Shopee-Clone
          </h2>
          <p className="text-sm text-center text-gray-600 mb-6">
            Please login with your seller account to connect with BVA
          </p>
          <Login />
        </div>
      </div>
    </div>
  );
};

export default BVAIntegrationCheck;

