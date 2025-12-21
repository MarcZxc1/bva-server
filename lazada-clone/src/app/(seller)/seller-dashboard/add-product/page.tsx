'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

import { sellerAPI } from '@/lib/api';

interface ProductData {
  productName: string;
  price: string;
  cost?: string;
  stock: string;
  imageUrl?: string;
  description?: string;
}

export default function AddProductPage() {
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    priceStock: true,
  });

  // Form submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Handle form submission
  const handleSubmit = async (isDraft: boolean = false) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setValidationErrors([]);
    // Basic validation
    const errors: string[] = [];
    if (!productName.trim()) errors.push('Product name is required');
    if (!price || Number.isNaN(parseFloat(price)) || parseFloat(price) <= 0) errors.push('Price must be a number greater than 0');
    if (cost && (Number.isNaN(parseFloat(cost)) || parseFloat(cost) < 0)) errors.push('Cost must be a non-negative number');
    if (stock === '' || Number.isNaN(parseInt(stock)) || parseInt(stock) < 0) errors.push('Stock must be a non-negative integer');

    if (errors.length > 0) {
      setValidationErrors(errors);
      setSubmitStatus('error');
      setSubmitMessage('Please fix validation errors');
      setIsSubmitting(false);
      // Scroll to top to show messages
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Prepare product data
    const productData = {
      name: productName.trim(),
      price: parseFloat(price),
      cost: cost ? parseFloat(cost) : undefined,
      stock: parseInt(stock, 10),
      imageUrl: imageUrl?.trim() || undefined,
      description: description?.trim() || undefined,
      expiryDate: expiryDate?.trim() || undefined,
    };

    try {
      const res = await sellerAPI.createProduct(productData);
      const resData = res.data as any;
      const created = resData?.data || resData;
      
      // Note: Product is already created via API and socket.io will emit real-time update
      // No need to send webhook - webhooks are for external systems, not direct API calls
      // This prevents duplicate product creation

      setSubmitStatus('success');
      setSubmitMessage(isDraft ? 'Product saved as draft successfully!' : 'Product submitted successfully!');
      // Redirect shortly after success
      setTimeout(() => {
        if (window.location.pathname.includes('add-product')) {
          window.location.href = '/seller-dashboard/manage-products';
        }
      }, 1100);
      console.log('Created product:', created);
    } catch (error: any) {
      console.error('Submission error:', error);
      setSubmitStatus('error');
      setSubmitMessage(error.response?.data?.error || 'Failed to submit product. Please try again.');
      if (error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (submitStatus === 'success') {
      const timer = setTimeout(() => {
        setSubmitStatus('idle');
        if (window.location.pathname.includes('add-product')) {
          window.location.href = '/seller-dashboard/manage-products';
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [submitStatus]);


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
            <Link href="/seller-dashboard/manage-products" className="text-gray-500 hover:text-blue-600">
              Manage Products
            </Link>
            <span className="text-gray-400">&gt;</span>
            <span className="text-gray-700 font-medium">Add Product</span>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-800">Add Product</h1>
          </div>
        </div>

        {/* Success/Error Messages */}
        {submitStatus !== 'idle' && (
          <div className={`mx-8 mt-4 p-4 rounded-lg ${
            submitStatus === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {submitStatus === 'success' ? (
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <div className="flex-1">
                <p className={`font-medium ${submitStatus === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                  {submitMessage}
                </p>
              </div>
              <button 
                onClick={() => {
                  setSubmitStatus('idle');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mx-8 mt-2 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="text-yellow-800 font-medium mb-2">Please fix the following:</div>
            <ul className="list-disc pl-5 text-sm text-yellow-800">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Main Content */}
        <div className="p-8">
          <div className="flex gap-8">
            {/* Left Side - Form */}
            <div className="flex-1 bg-white rounded-lg shadow">
              {/* Basic Information Section */}
              <div id="section-basicInfo" className="border-b border-gray-200">
                <button
                  onClick={() => toggleSection('basicInfo')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-blue-600 bg-blue-600 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h2 className="text-base font-semibold text-gray-900">Basic Information</h2>
                  </div>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.basicInfo ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandedSections.basicInfo && (
                  <div className="px-6 pb-6">
                    <div className="grid grid-cols-12 gap-6">
                      {/* Product Name (left) */}
                      <div className="col-span-8">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <span className="text-red-500">*</span> Product Name
                        </label>
                        <input
                          type="text"
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                          placeholder="Enter product name (e.g., Wireless Bluetooth Headphones)"
                          className={`w-full px-4 py-2.5 border rounded text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            !productName.trim() ? 'border-red-300' : 'border-gray-300'
                          }`}
                          maxLength={255}
                          required
                        />
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-500">
                            {productName.trim() ? '✓ Valid' : '⚠ Required field'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {productName.length}/255
                          </span>
                        </div>
                      </div>

                      {/* Description (right) */}
                      <div className="col-span-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Short description (optional)"
                          className="w-full px-4 py-3 border rounded text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300"
                          rows={4}
                        />
                        <p className="text-xs text-gray-500 mt-1">Optional — helpful for testing product details.</p>
                      </div>
                    </div>

                    {/* Product Image / URL (full width below) */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Product Image URL</label>
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg or leave blank"
                        className={`w-full px-4 py-2.5 border rounded text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300`}
                        maxLength={1000}
                      />
                      <p className="text-xs text-gray-500 mt-1">Optional — you can paste an image URL for quick testing.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Price, Stock & Variants Section */}
              <div id="section-priceStock" className="border-b border-gray-200">
                <button
                  onClick={() => toggleSection('priceStock')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                    <h2 className="text-base font-semibold text-gray-900">Price, Stock & Variants</h2>
                  </div>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.priceStock ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandedSections.priceStock && (
                  <div className="px-6 pb-6">
                    {/* Price, Stock & Expiration */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        <span className="text-red-500">*</span> Price, Stock & Expiration
                      </label>

                      <div className="bg-gray-50 rounded-lg overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-100 border-b border-gray-200 text-sm font-medium text-gray-700">
                          <div className="col-span-3">
                            <span className="text-red-500">*</span> Price
                          </div>
                          <div className="col-span-3">
                            Cost (Optional)
                          </div>
                          <div className="col-span-2">
                            Stock
                          </div>
                          <div className="col-span-4">
                            Expiration Date
                          </div>
                        </div>

                        {/* Table Row */}
                        <div className="grid grid-cols-12 gap-4 px-4 py-4 items-center">
                          <div className="col-span-3">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                              <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className={`w-full pl-8 pr-3 py-2 border rounded text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                  !price || parseFloat(price) <= 0 ? 'border-red-300' : 'border-gray-300'
                                }`}
                                required
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Selling price</p>
                          </div>
                          <div className="col-span-3">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                              <input
                                type="number"
                                value={cost}
                                onChange={(e) => setCost(e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className={`w-full pl-8 pr-3 py-2 border rounded text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                  cost && (Number.isNaN(parseFloat(cost)) || parseFloat(cost) < 0) ? 'border-red-300' : 'border-gray-300'
                                }`}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Product cost (for profit calculation)</p>
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              value={stock}
                              onChange={(e) => setStock(e.target.value)}
                              placeholder="0"
                              min="0"
                              step="1"
                              className={`w-full px-3 py-2 border rounded text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                !stock || parseInt(stock) < 0 ? 'border-red-300' : 'border-gray-300'
                              }`}
                              required
                            />
                            <p className="text-xs text-gray-500 mt-1">Available quantity</p>
                          </div>
                          <div className="col-span-4">
                            <input
                              type="date"
                              value={expiryDate}
                              onChange={(e) => setExpiryDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full px-3 py-2 border rounded text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300"
                            />
                            <p className="text-xs text-gray-500 mt-1">Optional — for perishable products</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              

              {/* Submit Buttons */}
              <div className="px-6 py-4 flex justify-between items-center">
                <button 
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all form data?')) {
                      window.location.reload();
                    }
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear Form
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleSubmit(true)}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Save as draft (Ctrl+S)"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Draft'}
                  </button>
                  <button 
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title='Submit product (Ctrl+Enter)'
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
