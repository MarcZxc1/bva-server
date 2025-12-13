'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store';

export function Header() {
  const user = useAuthStore((state: any) => state.user);
  const isLoggedIn = useAuthStore((state: any) => state.isLoggedIn);
  const logout = useAuthStore((state: any) => state.logout);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedShops = localStorage.getItem('shops');
    if (token && storedUser) {
      useAuthStore.setState({
        user: JSON.parse(storedUser),
        token,
        isLoggedIn: true,
        shops: storedShops ? JSON.parse(storedShops) : [],
      });
    }

    // Handle scroll to hide top bar
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white">
      {/* Top Bar - Hides on scroll */}
      <div
        className={`bg-white border-b border-gray-200 transition-all duration-300 overflow-hidden ${
          isScrolled ? 'max-h-0' : 'max-h-12'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-xs text-gray-600">
          <div className="flex gap-6">
            <a href="#" className="hover:text-blue-600">FEEDBACK</a>
            <a href="#" className="hover:text-blue-600">SAVE MORE ON APP</a>
            <Link href="/seller-signup" className="hover:text-blue-600">SELL ON LAZADA</Link>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-blue-600">CUSTOMER CARE</a>
            <a href="#" className="hover:text-blue-600">TRACK MY ORDER</a>
            {isLoggedIn ? (
              <>
                <Link href="/orders" className="hover:text-blue-600">ORDERS</Link>
                <Link href="/profile" className="hover:text-blue-600">{user?.name?.toUpperCase()}</Link>
                <button
                  onClick={() => {
                    logout();
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                  }}
                  className="text-red-600 hover:text-red-900"
                >
                  LOGOUT
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-blue-600 hover:text-blue-900">LOGIN</Link>
                <Link href="/register" className="text-blue-600 hover:text-blue-900">SIGNUP</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-blue-600 flex-shrink-0">
            Lazada
          </Link>

          {/* Search Bar */}
          <div className="flex-1 mx-6 flex items-center">
            <input
              type="text"
              placeholder="Search in Lazada"
              className="flex-1 bg-gray-100 px-4 py-2 rounded-l-sm text-sm text-gray-900 placeholder-gray-500 focus:outline-none"
            />
            <button className="bg-orange-500 text-white px-6 py-2 rounded-r-sm font-bold hover:bg-orange-600 transition">
              🔍
            </button>
          </div>

          {/* Right Icons */}
          <div className="flex gap-6 ml-6 items-center flex-shrink-0">
            <Link href="/cart" className="text-gray-600 hover:text-gray-900 text-2xl">
              🛒
            </Link>
            <button className="bg-pink-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-pink-600 transition">
              APPLY NOW
            </button>
            <Link href="#" className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-xs">
              ❤️ Lazada Loans
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
