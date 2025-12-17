'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { productAPI, authAPI } from '@/lib/api';
import Image from 'next/image';
import { useRealtimeProducts } from '@/hooks/useRealtimeProducts';
import { useAuthStore } from '@/store';
import { useRouter } from 'next/navigation';
export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

const user = useAuthStore((state) => state.user);
const isHydrated = useAuthStore((state) => state.isHydrated);
const setUser = useAuthStore((state: any) => state.setUser);



  const bannerImages = [
    {
      src: '/images/whp.jpg',
      title: 'SAVE UP TO 14% OFF',
      subtitle: 'Free Shipping + Shop Voucher'
    },
    {
      src: '/images/download.jfif',
      title: 'NEW COLLECTION',
      subtitle: 'Up to 50% Discount'
    },
    {
      src: '/images/download (1).jfif',
      title: 'FLASH SALE',
      subtitle: 'Limited Time Only'
    },
    {
      src: '/globe.svg',
      title: 'FREE SHIPPING',
      subtitle: 'On orders over 500'
    },
  ];

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response: any = await productAPI.getAll();
      const fetchedProducts = response.data?.data || response.data?.products || response.data;
      
      // Deduplicate products by ID to prevent duplicates
      const uniqueProducts = Array.isArray(fetchedProducts) 
        ? fetchedProducts.reduce((acc: any[], product: any) => {
            const productId = product.id || product._id;
            const exists = acc.some((p: any) => (p.id || p._id) === productId);
            if (!exists) {
              acc.push(product);
            }
            return acc;
          }, [] as any[])
        : [];
      
      setProducts(uniqueProducts);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce refetch to prevent multiple rapid calls
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleProductUpdate = useCallback(() => {
    console.log('🔄 Refreshing products due to real-time update...');
    // Clear any pending timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    // Use a small delay to debounce multiple rapid updates
    updateTimeoutRef.current = setTimeout(() => {
      fetchProducts();
    }, 300);
  }, [fetchProducts]);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  useRealtimeProducts({
    enabled: true,
    onProductUpdate: handleProductUpdate,
  });

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [bannerImages.length]);

  // Handle OAuth callback - process token from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const errorParam = urlParams.get('error');
    const errorDetails = urlParams.get('details');
    const callbackUrl = urlParams.get('callbackUrl');

    if (token) {
      console.log('🔑 OAuth token received on home page:', token);
      // Store token
      localStorage.setItem('token', token);
      
      // Get callbackUrl from localStorage (stored before OAuth) or URL
      const storedCallbackUrl = localStorage.getItem('oauth_callback_url');
      const finalCallbackUrl = callbackUrl || storedCallbackUrl;
      // Clear stored callbackUrl
      if (storedCallbackUrl) {
        localStorage.removeItem('oauth_callback_url');
      }
      
      // Fetch user profile
      authAPI.getProfile()
        .then((response: any) => {
          console.log('👤 User profile fetched:', response.data);
          const userData = response.data as { shops?: any[]; role?: string; [key: string]: any };
          const shops = userData.shops || [];
          setUser(userData, token, shops);
          console.log('✅ User state updated on home page');
          
          // Clean URL
          window.history.replaceState({}, '', window.location.pathname);
          
          // Redirect to callbackUrl if provided, otherwise stay on home
          if (finalCallbackUrl) {
            router.push(finalCallbackUrl);
          } else if (userData.role === 'SELLER') {
            router.push('/seller-dashboard');
          }
          // If buyer and no callbackUrl, stay on home page
        })
        .catch((err) => {
          console.error('❌ Failed to fetch user profile:', err);
          // Clean URL even on error
          window.history.replaceState({}, '', window.location.pathname);
        });
    } else if (errorParam) {
      console.error('OAuth error:', errorDetails || errorParam);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [router, setUser]);

  return (
    <div className="min-h-screen bg-gray-100">
      
      {/* Main Banner Carousel */}
      <div className="w-full">
        <div className="relative w-full max-w-7xl mx-auto h-96 bg-white overflow-hidden rounded-lg shadow-md">
          {/* Carousel Slides */}
          {bannerImages.map((banner, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="relative w-full h-full flex items-center bg-gradient-to-r from-gray-100 to-gray-50">
                <div className="w-1/2 pl-12">
                  <h2 className="text-4xl font-black text-gray-900 mb-3">{banner.title}</h2>
                  <p className="text-lg text-gray-700 mb-6">{banner.subtitle}</p>
                  <p className="text-xs text-gray-500 mb-6">*T&Cs apply</p>
                  <button className="bg-black text-white px-8 py-3 rounded-sm font-bold hover:bg-gray-800 transition">
                    SHOP NOW &gt;
                  </button>
                </div>
                <div className="w-1/2 relative h-full">
                  <Image
                    src={banner.src}
                    alt={banner.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                    priority={index === 0}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Carousel Indicators */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
            {bannerImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`transition-all ${
                  index === currentSlide
                    ? 'bg-white w-8 h-2 rounded-full'
                    : 'bg-white/50 w-2 h-2 rounded-full hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={() => setCurrentSlide((prev) => (prev - 1 + bannerImages.length) % bannerImages.length)}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/40 text-white p-3 rounded-full hover:bg-black/60 transition z-10 text-xl"
          >
            ❮
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % bannerImages.length)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/40 text-white p-3 rounded-full hover:bg-black/60 transition z-10 text-xl"
          >
            ❯
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Category/Features Section */}
        <div className="grid grid-cols-4 gap-4 mb-12">
          <div className="bg-white p-6 rounded-lg shadow text-center hover:shadow-lg transition cursor-pointer">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="font-bold text-gray-900">Flash Sale</h3>
            <p className="text-sm text-gray-600">Limited Time Deals</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center hover:shadow-lg transition cursor-pointer">
            <div className="text-4xl mb-3">📦</div>
            <h3 className="font-bold text-gray-900">Shipping</h3>
            <p className="text-sm text-gray-600">Free on Orders 500+</p>
          </div>
        </div>

        {/* Featured Products Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
            <a href="/products" className="text-red-600 hover:text-red-800 font-semibold text-sm">
              View All &gt;
            </a>
          </div>
          
          {loading && (
            <div className="flex justify-center py-12">
              <div className="text-gray-700 text-lg">Loading products...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-500 text-red-800 px-4 py-3 rounded mb-4">
              <p className="font-semibold">Error: {error}</p>
              <p className="text-sm mt-2">Make sure your backend is running on port 5000</p>
            </div>
          )}

          {!loading && products.length === 0 && !error && (
            <div className="text-center py-12">
              <p className="text-gray-700 text-lg">No products available</p>
            </div>
          )}

          {!loading && products.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {products.slice(0, 10).map((product) => (
                <ProductCard key={product.id || product._id} product={product} />
              ))}
            </div>
          )}
        </div>

        {/* Another Carousel Section for More Banners */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-8 rounded-lg text-center">
            <h3 className="text-xl font-bold mb-2">🎁 Special Deals</h3>
            <p className="text-sm mb-4">Up to 70% Off</p>
            <button className="bg-white text-red-600 px-6 py-2 rounded font-bold text-sm hover:bg-gray-100 transition">
              Shop Now
            </button>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-8 rounded-lg text-center">
            <h3 className="text-xl font-bold mb-2">📱 New Tech</h3>
            <p className="text-sm mb-4">Latest Gadgets</p>
            <button className="bg-white text-blue-600 px-6 py-2 rounded font-bold text-sm hover:bg-gray-100 transition">
              Explore
            </button>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-8 rounded-lg text-center">
            <h3 className="text-xl font-bold mb-2">🏃 Fashion</h3>
            <p className="text-sm mb-4">Trending Styles</p>
            <button className="bg-white text-green-600 px-6 py-2 rounded font-bold text-sm hover:bg-gray-100 transition">
              Browse
            </button>
          </div>
        </div>

        {/* More Products */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">More Products</h2>
            <a href="/products" className="text-red-600 hover:text-red-800 font-semibold text-sm">
              View All &gt;
            </a>
          </div>
          
          {!loading && products.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {products.slice(10, 20).map((product) => (
                  <ProductCard key={product.id || product._id} product={product} />
                ))}
              </div>

              {/* Load More Button */}
              <div className="flex justify-center mb-12">
                <button className="text-blue-600 font-semibold border-b-2 border-blue-600 pb-2 px-8 hover:text-blue-800 transition">
                  LOAD MORE
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
