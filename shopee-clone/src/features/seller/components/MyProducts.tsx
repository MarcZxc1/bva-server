import React, { useState, useEffect } from 'react';
import SellerLayout from './SellerLayout';
import Breadcrumb from './Breadcrumb';
import { useAuth } from '../../../contexts/AuthContext';
import apiClient from '../../../services/api';
import { useRealtimeProducts } from '../../../hooks/useRealtimeProducts';
import { Plus, Edit, Trash2, Package, Search, Filter, Wifi, WifiOff } from 'lucide-react';
import './MyProducts.css';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  stock?: number;
  sku?: string;
  category?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

const MyProducts: React.FC = () => {
  const { user } = useAuth();
  const shopId = user?.shops?.[0]?.id;
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    stock: '',
    sku: '',
    category: '',
  });

  useEffect(() => {
    if (shopId) {
      fetchProducts();
    }
  }, [shopId]);

  // Real-time updates
  const { isConnected } = useRealtimeProducts({
    shopId: shopId || undefined,
    enabled: !!shopId,
    onProductUpdate: fetchProducts,
  });

  const fetchProducts = async () => {
    if (!shopId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getProducts(shopId);
      setProducts(data || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      cost: '',
      stock: '',
      sku: '',
      category: '',
    });
    setShowAddModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      cost: product.cost?.toString() || '',
      stock: product.stock?.toString() || '',
      sku: product.sku || '',
      category: product.category || '',
    });
    setShowAddModal(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await apiClient.deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;

    setIsSubmitting(true);
    try {
      const productData = {
        shopId,
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        stock: formData.stock ? parseInt(formData.stock) : undefined,
        sku: formData.sku || undefined,
        category: formData.category || undefined,
      };

      if (editingProduct) {
        await apiClient.updateProduct(editingProduct.id, productData);
      } else {
        await apiClient.createProduct(productData);
      }

      setShowAddModal(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SellerLayout>
      <Breadcrumb />
      <div className="my-products-container">
        <div className="products-header">
          <div className="header-left">
            <div className="flex items-center gap-3">
              <h1 className="page-title">My Products</h1>
              {isConnected && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Wifi size={16} />
                  <span>Live</span>
                </div>
              )}
            </div>
            <p className="page-subtitle">Manage your product inventory</p>
          </div>
          <button
            onClick={handleAddProduct}
            className="btn-add-product"
          >
            <Plus size={20} />
            Add New Product
          </button>
        </div>

        {/* Search and Filter */}
        <div className="products-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="products-stats">
            <span>Total Products: {products.length}</span>
            <span>In Stock: {products.filter(p => (p.stock || 0) > 0).length}</span>
            <span>Out of Stock: {products.filter(p => (p.stock || 0) === 0).length}</span>
          </div>
        </div>

        {/* Products List */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading products...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={fetchProducts} className="btn-retry">Retry</button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <Package size={48} />
            <p>No products found</p>
            <button onClick={handleAddProduct} className="btn-add-first">
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} />
                  ) : (
                    <div className="product-placeholder">
                      <Package size={32} />
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div className="out-of-stock-badge">Out of Stock</div>
                  )}
                </div>
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-description">
                    {product.description || 'No description'}
                  </p>
                  <div className="product-details">
                    <div className="detail-row">
                      <span>Price:</span>
                      <span className="price">₱{product.price.toLocaleString()}</span>
                    </div>
                    {product.cost && (
                      <div className="detail-row">
                        <span>Cost:</span>
                        <span>₱{product.cost.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span>Stock:</span>
                      <span className={product.stock === 0 ? 'low-stock' : ''}>
                        {product.stock || 0} units
                      </span>
                    </div>
                    {product.sku && (
                      <div className="detail-row">
                        <span>SKU:</span>
                        <span>{product.sku}</span>
                      </div>
                    )}
                    {product.category && (
                      <div className="detail-row">
                        <span>Category:</span>
                        <span>{product.category}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="product-actions">
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="btn-edit"
                    title="Edit Product"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="btn-delete"
                    title="Delete Product"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Product Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="btn-close"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit} className="product-form">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter product name"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter product description"
                    rows={3}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price (₱) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>Cost (₱)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Stock Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>SKU</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="SKU-001"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Electronics, Fashion"
                  />
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-submit"
                  >
                    {isSubmitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SellerLayout>
  );
};

export default MyProducts;

