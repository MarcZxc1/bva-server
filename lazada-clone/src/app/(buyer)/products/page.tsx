'use client';

import { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { productAPI } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { useRealtimeProducts } from '@/hooks/useRealtimeProducts';

function ProductsContent() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await productAPI.getAll({ search, category, sort });
      const fetchedProducts = response.data.data || response.data.products || response.data;
      
      // Deduplicate products by ID to prevent duplicates
      const uniqueProducts = Array.isArray(fetchedProducts)
        ? fetchedProducts.reduce((acc, product) => {
            const productId = product.id || product._id;
            const exists = acc.some(p => (p.id || p._id) === productId);
            if (!exists) {
              acc.push(product);
            }
            return acc;
          }, [] as any[])
        : [];
      
      setProducts(uniqueProducts);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, sort]);
  
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
    const q = searchParams.get('search') || '';
    setSearch(q);
  }, [searchParams]);

  return (
    <>
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Fashion">Fashion</option>
              <option value="Home">Home</option>
              <option value="Sports">Sports</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Sort By</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-64 rounded animate-pulse" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product._id || product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No products found</p>
        </div>
      )}
    </>
  );
}

export default function ProductsPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <Suspense fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-64 rounded animate-pulse" />
          ))}
        </div>
      }>
        <ProductsContent />
      </Suspense>
    </main>
  );
}
