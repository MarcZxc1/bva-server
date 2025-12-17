'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { authAPI } from '@/lib/api';

export default function SellerLoginPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((state: any) => state.setUser);
  const router = useRouter();

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const errorParam = urlParams.get('error');
    const errorDetails = urlParams.get('details');

    if (token) {
      // Store token and fetch user
      localStorage.setItem('token', token);
      setUser({ token }, token);
      
      // Fetch user profile
      authAPI.getProfile()
        .then((response: any) => {
          const userData = response.data as { shops?: any[]; role?: string; [key: string]: any };
          const shops = userData.shops || [];
          setUser(userData, token, shops);
          router.push('/seller-dashboard');
        })
        .catch((err) => {
          console.error('Failed to fetch user profile:', err);
          setError('Failed to fetch user profile');
        });
      
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (errorParam) {
      setError(errorDetails || 'Authentication failed');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [router, setUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!identifier || !password) {
      setError('Email/Phone and password are required');
      setLoading(false);
      return;
    }

    try {
      // Login - server will check if user is SELLER
      const response: any = await authAPI.login({ 
        email: identifier, // Can be email or phone
        password: password,
        platform: 'LAZADA_CLONE' // Specify Lazada platform
      });
      
      // Server returns { success: true, data: { user, shops, token } }
      const responseData = response.data as { data?: { token: string; user: any; shops: any[] }; [key: string]: any };
      const { token, user, shops } = responseData.data || responseData;
      
      // Check if user is a seller
      if (user.role !== 'SELLER') {
        setError('This account is not a seller account. Please use buyer login.');
        setLoading(false);
        return;
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user, token, shops);
      
      // Redirect to seller dashboard
      router.push('/seller-dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-white overflow-hidden">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 py-3 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <img src="/seller-img/lazada-seller-logo.png" alt="Lazada Seller Center" className="h-8" />
              <div className="flex flex-col leading-tight">
                <span className="text-blue-900 font-bold text-xl">Lazada</span>
                <span className="text-blue-600 text-sm font-semibold">Seller Center</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <button className="flex items-center gap-1 text-gray-600 text-sm">
              <img src="/seller-img/philippines-flag.png" alt="Philippines" className="w-5 h-5" />
              <span>Pilipinas</span>
              <span className="text-xs">▼</span>
            </button>
            <button className="flex items-center gap-1 text-gray-600 text-sm">
              <span>English</span>
              <span className="text-xs">▼</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sticky Need Help Button */}
      <button className="fixed right-0 top-22 z-40 bg-white text-gray-600 px-10 py-4 rounded-l-full shadow-md hover:shadow-lg transition flex items-center gap-1.5 text-xs font-medium border border-gray-200">
        <span className="text-sm">💬</span>
        <span>Need Help</span>
      </button>

      <div className="h-[calc(100vh-64px)] bg-gradient-to-br from-pink-600 via-purple-600 to-pink-500 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-cyan-300 rounded-lg rotate-45 animate-bounce"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-yellow-300 rounded-full animate-pulse"></div>
          <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-purple-300 rounded-full opacity-50"></div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 w-full max-w-5xl flex items-center justify-between gap-12">
        {/* Left Side - Promotional Banner */}
        <div className="flex-1 text-white hidden lg:block">
          <div className="bg-gradient-to-br from-purple-700 to-pink-600 rounded-3xl p-8 text-center shadow-2xl border-4 border-white">
            <h1 className="text-6xl font-black mb-4 text-white drop-shadow-lg" style={{ textShadow: '3px 3px 0px rgba(0,0,0,0.3)' }}>
              Register Now!
            </h1>
            <div className="text-8xl font-black mb-2 text-white" style={{ textShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}>
              12.12
            </div>
            <div className="text-3xl font-bold mb-2 text-yellow-300">ALL OUT PASKO SALE</div>
            <div className="text-2xl font-bold text-cyan-300 mb-4">DEC 11 (8PM) - DEC 14</div>
            <div className="flex justify-center gap-4 mt-6">
              <div className="bg-white text-purple-600 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                <span>🚚</span> FREE SHIPPING
              </div>
              <div className="bg-pink-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                <span>🎫</span> PLATFORM VOUCHER
              </div>
              <div className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                <span>👁️</span> SPECIAL VISIBILITY
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Login with Password</h2>
            <Link href="/seller-signup" className="text-blue-600 hover:underline text-base flex items-center gap-3 whitespace-nowrap">
              <span className="whitespace-nowrap">Log in with QR Code</span>
              <div className="relative w-12 h-12 flex-shrink-0">
                <img src="/seller-img/qr-code-icon.png.png" alt="QR Code" className="w-12 h-12" />
                <img src="/seller-img/lazada-seller-logo.png" alt="Lazada" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6" />
              </div>
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Mobile Number / Email"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                required
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <button
              type="button"
              className="w-full border-2 border-blue-600 text-blue-600 py-2.5 rounded-lg font-medium hover:bg-blue-50 transition"
            >
              Login with OTP
            </button>

            <div className="text-right">
              <a href="#" className="text-blue-600 hover:underline text-sm">
                Reset password
              </a>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Connect with</span>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                type="button"
                className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                <img src="/seller-img/lazada-app-icon.png" alt="Lazada Buyer APP" className="w-5 h-5" />
                <span className="text-sm text-gray-700">Lazada Buyer APP</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const baseUrl = window.location.origin;
                  const state = encodeURIComponent(JSON.stringify({ 
                    redirectUrl: baseUrl,
                    role: 'SELLER',
                    platform: 'LAZADA_CLONE',
                  }));
                  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
                  window.location.href = `${API_URL}/auth/google?state=${state}&role=SELLER`;
                }}
                className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                <img src="/seller-img/google-icon.png" alt="Google" className="w-5 h-5" />
                <span className="text-sm text-gray-700">Google</span>
              </button>
            </div>

            <div className="text-center mt-4">
              <span className="text-gray-600 text-sm">Don't have an account yet? </span>
              <Link href="/seller-signup" className="text-blue-600 hover:underline text-sm font-medium">
                Create a new account!
              </Link>
            </div>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}
