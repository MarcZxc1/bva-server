'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function DecorateProductsPage() {
  const [displayInProductPage, setDisplayInProductPage] = useState(false);
  const [linkToPage, setLinkToPage] = useState('');

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 overflow-y-auto">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200 px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Products</span>
            <span>&gt;</span>
            <span>Decorate Product</span>
            <span>&gt;</span>
            <span className="text-gray-900 font-medium">Store Campaign Banner</span>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Store Campaign Banner</h1>
        </div>

        {/* Main Content */}
        <div className="p-8">
          <div className="flex gap-8">
            {/* Left Side - Form */}
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-gray-700">
                    Campaign banner size : 690 px * 204 px
                  </p>
                </div>

                {/* Daily Campaign Section */}
                <div className="mb-6">
                  <h3 className="text-blue-600 font-medium mb-4">Daily Campaign</h3>

                  {/* Toggle */}
                  <div className="flex items-center gap-3 mb-6">
                    <button
                      onClick={() => setDisplayInProductPage(!displayInProductPage)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        displayInProductPage ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          displayInProductPage ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-sm text-gray-700">Display in product detail page</span>
                  </div>

                  {/* Banner Preview */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6">
                    <img
                      src="/api/placeholder/690/204"
                      alt="Campaign Banner"
                      className="w-full rounded"
                      style={{ 
                        background: 'linear-gradient(135deg, #e0f2f1 0%, #80cbc4 100%)',
                        minHeight: '204px'
                      }}
                    />
                    <div className="mt-4 text-center">
                      <div className="inline-block bg-teal-500 text-white px-8 py-3 rounded-lg">
                        <span className="text-2xl font-bold">INSERT COMMECIAL CONTENT HERE</span>
                        <p className="text-sm mt-1">Benefit Points Here Subtitle</p>
                        <button className="mt-2 bg-red-400 text-white px-6 py-2 rounded-full text-sm font-medium">
                          Shop Now ▶
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Link to Page */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link to Page
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={linkToPage}
                        onChange={(e) => setLinkToPage(e.target.value)}
                        placeholder="URL"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                      <button className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium">
                        Select Link
                      </button>
                    </div>
                  </div>

                  {/* Publish Button */}
                  <button className="px-6 py-2 bg-gray-200 text-gray-500 rounded-lg font-medium cursor-not-allowed">
                    Publish to All
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side - Preview */}
            <div className="w-96">
              <div className="bg-white rounded-lg shadow p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Where Does it appear</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This clickable banner will be displayed on all product detail pages
                </p>

                {/* Product Preview */}
                <div className="space-y-4">
                  {/* Product Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border border-gray-200 rounded p-2">
                        <div className="bg-gray-100 aspect-square rounded mb-2"></div>
                        <p className="text-xs text-gray-600 truncate">Product {i}</p>
                        <p className="text-sm font-bold text-red-600">$11</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <span>⭐⭐⭐⭐⭐</span>
                          <span>(12)</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Banner Preview in Context */}
                  <div className="bg-blue-100 rounded p-4">
                    <p className="text-xs text-blue-900 mb-2">Up to</p>
                    <p className="text-2xl font-bold text-blue-900">36% Off</p>
                    <p className="text-xs text-blue-700">Cracking Easter Savings</p>
                  </div>

                  {/* Product Details Section */}
                  <div className="bg-gray-100 rounded p-4">
                    <p className="text-sm font-semibold text-gray-900 mb-2">Product details</p>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-700 font-semibold">Highlights</p>
                      <p className="text-xs text-gray-600">• 12 feet feet,Type-A</p>
                      <p className="text-xs text-gray-600">• Laptop , Printer , Modem , DVD Player , PC</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-20 bg-white border-l border-gray-200 flex flex-col items-center py-6 gap-4 flex-shrink-0">
        <button className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition">
          <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
            <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
          </svg>
        </button>

        <button className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center hover:bg-orange-200 transition">
          <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
        </button>

        <button className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center hover:bg-purple-200 transition">
          <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </button>

        <button className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition">
          <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="flex-1"></div>

        <button className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition rounded-lg">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>

        <button className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition rounded-lg">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
