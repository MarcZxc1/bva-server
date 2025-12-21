'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuthStore } from '@/store';
import { authAPI } from '@/lib/api';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const setUser = useAuthStore((state: any) => state.setUser);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const errorParam = urlParams.get('error');
    const errorDetails = urlParams.get('details');

    if (token) {
      console.log('🔑 OAuth token received:', token);
      // Store token
      localStorage.setItem('token', token);
      
      // Fetch user profile
      authAPI.getProfile()
        .then((response) => {
          console.log('👤 User profile fetched:', response.data);
          const userData = response.data as any;
          const shops = userData.shops || [];
          setUser(userData, token, shops);
          console.log('✅ User state updated in register');
          
          // Redirect based on role and callback URL
          if (callbackUrl) {
            router.push(callbackUrl);
          } else if (userData.role === 'SELLER') {
            router.push('/seller-dashboard');
          } else {
            router.push('/');
          }
        })
        .catch((err) => {
          console.error('❌ Failed to fetch user profile:', err);
          setError('Failed to fetch user profile');
        });
      
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (errorParam) {
      setError(errorDetails || 'Authentication failed');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [router, setUser, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password || !name) {
      setError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({ 
        email, 
        password, 
        name, 
        role: 'BUYER',
        platform: 'LAZADA_CLONE' 
      });
      const responseData = response.data as any;
      const { token, user, shops } = responseData.data;
      setUser(user, token, shops);
      localStorage.setItem('token', token);
      localStorage.setItem('shops', JSON.stringify(shops));
      
      // Redirect logic
      if (callbackUrl) {
        router.push(callbackUrl);
      } else if (user.role === 'SELLER') {
        router.push('/seller-dashboard');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed');
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
          <span className="text-sm text-gray-600">Sign Up</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Name Input */}
          <div>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          {/* Email Input */}
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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

          {/* Confirm Password Input */}
          <div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'SIGN UP'}
          </button>

          {/* Login Link */}
          <p className="text-center text-sm text-gray-600 mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-orange-500 hover:text-orange-600 font-semibold">
              Sign In
            </Link>
          </p>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">OR</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Social Login */}
        <div className="space-y-3">
          <button 
            type="button"
            onClick={() => {
              const baseUrl = window.location.origin;
              const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
              window.location.href = `${API_URL}/auth/buyer-register?redirectUrl=${encodeURIComponent(baseUrl)}`;
            }}
            className="w-full flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm">Google</span>
          </button>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-200 flex items-center justify-center"><div className="text-gray-600">Loading...</div></div>}>
      <RegisterForm />
    </Suspense>
  );
}