import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './AddProductModal.css';

interface Product {
  id?: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  stock?: number;
  sku?: string;
  category?: string;
  imageUrl?: string;
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (productData: Omit<Product, 'id'>) => Promise<void>;
  editingProduct?: Product | null;
  isSubmitting?: boolean;
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingProduct,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    stock: '',
    sku: '',
    category: '',
    imageUrl: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or editing product changes
  useEffect(() => {
    if (isOpen) {
      if (editingProduct) {
        setFormData({
          name: editingProduct.name,
          description: editingProduct.description || '',
          price: editingProduct.price.toString(),
          cost: editingProduct.cost?.toString() || '',
          stock: editingProduct.stock?.toString() || '',
          sku: editingProduct.sku || '',
          category: editingProduct.category || '',
          imageUrl: editingProduct.imageUrl || '',
        });
      } else {
        setFormData({
          name: '',
          description: '',
          price: '',
          cost: '',
          stock: '',
          sku: '',
          category: '',
          imageUrl: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, editingProduct]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else {
      const priceValue = parseFloat(formData.price);
      if (isNaN(priceValue) || priceValue < 0) {
        newErrors.price = 'Price must be a valid positive number';
      }
    }

    if (formData.cost && formData.cost.trim()) {
      const costValue = parseFloat(formData.cost);
      if (isNaN(costValue) || costValue < 0) {
        newErrors.cost = 'Cost must be a valid positive number';
      }
    }

    if (formData.stock && formData.stock.trim()) {
      const stockValue = parseInt(formData.stock);
      if (isNaN(stockValue) || stockValue < 0) {
        newErrors.stock = 'Stock must be a valid non-negative integer';
      }
    }

    if (formData.imageUrl && formData.imageUrl.trim()) {
      try {
        new URL(formData.imageUrl);
      } catch {
        newErrors.imageUrl = 'Please enter a valid URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const productData: Omit<Product, 'id'> = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: parseFloat(formData.price),
        cost: formData.cost?.trim() ? parseFloat(formData.cost) : undefined,
        stock: formData.stock?.trim() ? parseInt(formData.stock) : undefined,
        sku: formData.sku.trim() || undefined,
        category: formData.category.trim() || undefined,
        imageUrl: formData.imageUrl.trim() || undefined,
      };

      await onSubmit(productData);
      // Only close modal on success
      onClose();
    } catch (error: any) {
      console.error('Error submitting product:', error);
      // Show user-friendly error message
      const errorMessage = error?.message || 'Failed to save product. Please try again.';
      alert(errorMessage);
      // Don't close modal on error so user can fix and retry
      // Re-throw so parent component can handle it
      throw error;
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="add-product-modal-overlay" onClick={handleClose}>
      <div className="add-product-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="add-product-modal-header">
          <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
          <button
            onClick={handleClose}
            className="add-product-modal-close"
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-product-form">
          <div className="add-product-form-group">
            <label htmlFor="name">
              Product Name <span className="required">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              placeholder="Enter product name"
              className={errors.name ? 'error' : ''}
              disabled={isSubmitting}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="add-product-form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter product description"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="add-product-form-row">
            <div className="add-product-form-group">
              <label htmlFor="price">
                Price (₱) <span className="required">*</span>
              </label>
              <input
                id="price"
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => {
                  setFormData({ ...formData, price: e.target.value });
                  if (errors.price) setErrors({ ...errors, price: '' });
                }}
                placeholder="0.00"
                className={errors.price ? 'error' : ''}
                disabled={isSubmitting}
              />
              {errors.price && <span className="error-message">{errors.price}</span>}
            </div>

            <div className="add-product-form-group">
              <label htmlFor="cost">Cost (₱)</label>
              <input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.cost}
                onChange={(e) => {
                  setFormData({ ...formData, cost: e.target.value });
                  if (errors.cost) setErrors({ ...errors, cost: '' });
                }}
                placeholder="0.00"
                className={errors.cost ? 'error' : ''}
                disabled={isSubmitting}
              />
              {errors.cost && <span className="error-message">{errors.cost}</span>}
            </div>
          </div>

          <div className="add-product-form-row">
            <div className="add-product-form-group">
              <label htmlFor="stock">Stock Quantity</label>
              <input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => {
                  setFormData({ ...formData, stock: e.target.value });
                  if (errors.stock) setErrors({ ...errors, stock: '' });
                }}
                placeholder="0"
                className={errors.stock ? 'error' : ''}
                disabled={isSubmitting}
              />
              {errors.stock && <span className="error-message">{errors.stock}</span>}
            </div>

            <div className="add-product-form-group">
              <label htmlFor="sku">SKU</label>
              <input
                id="sku"
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="SKU-001"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="add-product-form-group">
            <label htmlFor="category">Category</label>
            <input
              id="category"
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Electronics, Fashion"
              disabled={isSubmitting}
            />
          </div>

          <div className="add-product-form-group">
            <label htmlFor="imageUrl">Image URL</label>
            <input
              id="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={(e) => {
                setFormData({ ...formData, imageUrl: e.target.value });
                if (errors.imageUrl) setErrors({ ...errors, imageUrl: '' });
              }}
              placeholder="https://example.com/image.jpg"
              className={errors.imageUrl ? 'error' : ''}
              disabled={isSubmitting}
            />
            {errors.imageUrl && <span className="error-message">{errors.imageUrl}</span>}
            {formData.imageUrl && (
              <div className="image-preview">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="add-product-form-actions">
            <button
              type="button"
              onClick={handleClose}
              className="add-product-btn-cancel"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="add-product-btn-submit"
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-small"></span>
                  {editingProduct ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                editingProduct ? 'Update Product' : 'Add Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;

