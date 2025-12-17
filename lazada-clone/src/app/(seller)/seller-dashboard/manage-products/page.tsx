'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { sellerAPI } from '@/lib/api';
import { useRealtimeProducts } from '@/hooks/useRealtimeProducts';
import { useAuthStore } from '@/store';
import Link from 'next/link';

export default function ManageProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = useAuthStore((state) => state.user);
  const shopId = user?.shops?.[0]?.id;
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await sellerAPI.getProducts();
      const fetchedProducts = response.data?.data || response.data?.products || response.data || [];
      
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
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setError(err.response?.data?.error || 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced handler for real-time updates
  const handleProductUpdate = useCallback(() => {
    console.log('🔄 Refreshing products due to real-time update...');
    // Clear any pending timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    // Debounce to prevent multiple rapid calls
    fetchTimeoutRef.current = setTimeout(() => {
      fetchProducts();
    }, 300);
  }, [fetchProducts]);

  // Set up real-time product updates
  useRealtimeProducts({
    shopId: shopId,
    enabled: !!shopId,
    onProductUpdate: handleProductUpdate,
  });

  useEffect(() => {
    fetchProducts();
    
    // Cleanup timeout on unmount
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [fetchProducts]);

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 overflow-y-auto">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200 px-8 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/seller-dashboard" className="text-gray-500 hover:text-blue-600">
              Home
            </Link>
            <span className="text-gray-400">&gt;</span>
            <span className="text-gray-700 font-medium">Manage Products</span>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-800">Manage Products</h1>
            <Link href="/seller-dashboard/add-product" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
              Add Product
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8">
          {error && (
            <div className="bg-red-50 border-2 border-red-500 text-red-800 px-4 py-3 rounded mb-4">
              <p className="font-semibold">Error: {error}</p>
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-lg shadow p-8">
              <div className="text-center text-gray-600">Loading products...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8">
              <div className="text-center text-gray-600">
                <p className="text-lg mb-4">No products found</p>
                <Link href="/seller-dashboard/add-product" className="text-blue-600 hover:text-blue-800 font-medium">
                  Add your first product
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow">
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id || product._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img className="h-10 w-10 rounded-full object-cover" src={product.imageUrl || 'https://via.placeholder.com/150'} alt={product.name} />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500">{product.description || 'No description'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">₱{product.price?.toFixed(2) || '0.00'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.stock || 0}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <a href="#" className="text-indigo-600 hover:text-indigo-900">Edit</a>
                          <a href="#" className="ml-4 text-red-600 hover:text-red-900">Delete</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}