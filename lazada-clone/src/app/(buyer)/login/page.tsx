'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store';
import { authAPI } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
        .then((response) => {
          const userData = response.data;
          const shops = userData.shops || [];
          setUser(userData, token, shops);
          
          // Redirect based on role
          if (userData.role === 'SELLER') {
            router.push('/seller-dashboard');
          } else {
            router.push('/');
          }
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

    try {
      const response = await authAPI.login({ email, password });
      // Server returns { success: true, data: { user, shops, token } }
      const { token, user, shops } = response.data.data;
      setUser(user, token, shops);
      localStorage.setItem('shops', JSON.stringify(shops));
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
      {/* Modal */}
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8 relative">
        {/* Close Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
        >
          ✕
        </button>

        {/* Logo/Header */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center mr-2">
            <span className="text-gray-600">📦</span>
          </div>
          <span className="text-sm text-gray-600">Sign In / Sign Up</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button className="pb-3 font-semibold text-gray-900 border-b-2 border-orange-500">Password</button>
          <button className="pb-3 text-gray-600 hover:text-gray-900">Phone Number</button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Please enter your Phone or Email"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-orange-500 text-sm"
            />
          </div>

          {/* Password Input */}
          <div className="mb-4 relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Please enter your password"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-orange-500 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? '👁️' : '✓'}
            </button>
          </div>

          {/* Forgot Password */}
          <div className="text-right mb-6">
            <Link href="#" className="text-sm text-gray-600 hover:text-blue-600">
              Forgot password?
            </Link>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-3 rounded font-semibold hover:bg-orange-600 disabled:opacity-50 mb-4 text-sm"
          >
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="text-center text-sm mb-6 text-gray-600">
          Don't have an account?{' '}
          <Link href="/register" className="text-blue-600 hover:text-blue-900 font-semibold">
            Sign up
          </Link>
        </p>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <hr className="flex-1 border-gray-300" />
          <span className="text-sm text-gray-500">Or, login with</span>
          <hr className="flex-1 border-gray-300" />
        </div>

        {/* Social Login */}
        <div className="flex gap-4">
          <button 
            type="button"
            onClick={() => {
              const baseUrl = window.location.origin;
              const state = encodeURIComponent(JSON.stringify({ 
                redirectUrl: baseUrl,
                role: 'BUYER',
              }));
              const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
              window.location.href = `${API_URL}/auth/google?state=${state}&role=BUYER`;
            }}
            className="flex-1 flex items-center justify-center gap-2 border border-gray-300 py-2 rounded hover:bg-gray-50 text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 border border-gray-300 py-2 rounded hover:bg-gray-50 text-sm">
            <span>📘</span>
            Facebook
          </button>
        </div>
      </div>
    </main>
  );
}
