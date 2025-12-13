'use client';

import { useState, useMemo } from 'react';

interface Category {
  id: string;
  name: string;
  children?: Category[];
  unauthorized?: boolean;
}

const categoryData: Category[] = [
  {
    id: 'sports',
    name: 'Sports & Outdoors Activities',
    children: [
      {
        id: 'water-sports',
        name: 'Water Sports Equipment',
        children: [
          {
            id: 'swimming',
            name: 'Swimming',
            children: [
              { id: 'swimwear', name: 'Swimwear' },
              { id: 'swim-accessories', name: 'Accessories' },
              { id: 'training-equipment', name: 'Training Equipment' },
              { id: 'floaties', name: 'Floaties & Life Jackets' },
              { id: 'goggles', name: 'Goggles' },
              { id: 'swim-caps', name: 'Swim Caps' },
              { id: 'nose-clips', name: 'Nose Clips & Ear Plugs' },
            ],
          },
          { id: 'boating', name: 'Boating & Kayaking' },
          { id: 'diving', name: 'Diving & Snorkeling' },
          { id: 'surfing', name: 'Surfing & Bodyboarding' },
          { id: 'tubing', name: 'Tubing & Towables' },
        ],
      },
      {
        id: 'outdoor-sports',
        name: 'Outdoor Sports & Activities Equipment',
        children: [
          { id: 'camping', name: 'Camping & Hiking' },
          { id: 'cycling', name: 'Cycling' },
          { id: 'fishing', name: 'Fishing' },
          { id: 'climbing', name: 'Rock Climbing' },
          { id: 'skateboarding', name: 'Skateboarding' },
        ],
      },
      {
        id: 'ball-racket',
        name: 'Ball and Racket Sports Equipment',
        children: [
          { id: 'basketball', name: 'Basketball' },
          { id: 'tennis', name: 'Tennis' },
          { id: 'badminton', name: 'Badminton' },
          { id: 'volleyball', name: 'Volleyball' },
          { id: 'table-tennis', name: 'Table Tennis' },
          { id: 'squash', name: 'Squash' },
        ],
      },
      { id: 'sports-accessories', name: 'Sports Accessories' },
      { id: 'boxing', name: 'Boxing and Martial Arts Equipment' },
      { id: 'yoga', name: 'Yoga & Wellness Equipment' },
      { id: 'exercise', name: 'Exercise & Fitness Equipment' },
      { id: 'golf', name: 'Golf Equipment' },
    ],
  },
  {
    id: 'computers',
    name: 'Computers & Components',
    children: [
      {
        id: 'computer-components',
        name: 'Computer Components',
        children: [
          { id: 'processors', name: 'Processors (CPUs)' },
          { id: 'motherboards', name: 'Motherboards' },
          { id: 'graphics-cards', name: 'Graphics Cards (GPUs)' },
          { id: 'ram', name: 'RAM Memory' },
          { id: 'storage', name: 'Storage (SSD/HDD)' },
          { id: 'power-supply', name: 'Power Supplies' },
          { id: 'cooling', name: 'Cooling Systems' },
          { id: 'cases', name: 'Computer Cases' },
        ],
      },
      {
        id: 'laptops',
        name: 'Laptops',
        children: [
          { id: 'traditional-laptops', name: 'Traditional Laptops' },
          { id: 'gaming-laptops', name: 'Gaming Laptops' },
          { id: '2in1-laptops', name: '2-in-1 Laptops' },
          { id: 'chromebooks', name: 'Chromebooks' },
          { id: 'macbooks', name: 'MacBooks' },
        ],
      },
      { id: 'desktops', name: 'Desktop Computers' },
      { id: 'monitors', name: 'Monitors' },
      { id: 'keyboards', name: 'Keyboards & Mice' },
      { id: 'networking', name: 'Networking Equipment' },
    ],
  },
  {
    id: 'home-appliances',
    name: 'Home Appliances',
    children: [
      {
        id: 'kitchen',
        name: 'Kitchen Appliances',
        children: [
          { id: 'refrigerators', name: 'Refrigerators' },
          { id: 'microwaves', name: 'Microwaves' },
          { id: 'ovens', name: 'Ovens & Stoves' },
          { id: 'blenders', name: 'Juicers & Blenders' },
          { id: 'coffee-makers', name: 'Coffee Makers' },
          { id: 'toasters', name: 'Toasters' },
          { id: 'rice-cookers', name: 'Rice Cookers' },
          { id: 'air-fryers', name: 'Air Fryers' },
        ],
      },
      { id: 'cleaning', name: 'Cleaning Appliances' },
      { id: 'laundry', name: 'Laundry Appliances' },
      { id: 'air-treatment', name: 'Air Treatment' },
      { id: 'water-heaters', name: 'Water Heaters' },
    ],
  },
  {
    id: 'electronics',
    name: 'Consumer Electronics',
    children: [
      {
        id: 'mobile-devices',
        name: 'Mobile Devices',
        children: [
          { id: 'smartphones', name: 'Smartphones' },
          { id: 'tablets', name: 'Tablets' },
          { id: 'smartwatches', name: 'Smartwatches' },
          { id: 'mobile-accessories', name: 'Mobile Accessories' },
        ],
      },
      {
        id: 'audio',
        name: 'Audio',
        children: [
          { id: 'headphones', name: 'Headphones & Earbuds' },
          { id: 'speakers', name: 'Speakers' },
          { id: 'home-audio', name: 'Home Audio Systems' },
          { id: 'microphones', name: 'Microphones' },
        ],
      },
      {
        id: 'cameras',
        name: 'Cameras & Photography',
        children: [
          { id: 'digital-cameras', name: 'Digital Cameras' },
          { id: 'dslr', name: 'DSLR Cameras' },
          { id: 'action-cameras', name: 'Action Cameras' },
          { id: 'camera-accessories', name: 'Camera Accessories' },
          { id: 'lenses', name: 'Lenses' },
        ],
      },
      { id: 'tv-video', name: 'TV & Video' },
      { id: 'smart-home', name: 'Smart Home Devices' },
    ],
  },
  {
    id: 'gaming',
    name: 'Gaming Devices & Software',
    children: [
      {
        id: 'consoles',
        name: 'Gaming Consoles',
        children: [
          { id: 'playstation', name: 'PlayStation' },
          { id: 'xbox', name: 'Xbox' },
          { id: 'nintendo', name: 'Nintendo' },
        ],
      },
      { id: 'pc-gaming', name: 'PC Gaming' },
      {
        id: 'gaming-accessories',
        name: 'Gaming Accessories',
        children: [
          { id: 'controllers', name: 'Controllers' },
          { id: 'gaming-headsets', name: 'Gaming Headsets' },
          { id: 'gaming-chairs', name: 'Gaming Chairs' },
          { id: 'gaming-keyboards', name: 'Gaming Keyboards' },
        ],
      },
      { id: 'vr-ar', name: 'VR & AR Devices' },
    ],
  },
  {
    id: 'fashion',
    name: 'Fashion & Apparel',
    children: [
      {
        id: 'mens-fashion',
        name: "Men's Fashion",
        children: [
          { id: 'mens-clothing', name: 'Clothing' },
          { id: 'mens-shoes', name: 'Shoes' },
          { id: 'mens-accessories', name: 'Accessories' },
        ],
      },
      {
        id: 'womens-fashion',
        name: "Women's Fashion",
        children: [
          { id: 'womens-clothing', name: 'Clothing' },
          { id: 'womens-shoes', name: 'Shoes' },
          { id: 'womens-accessories', name: 'Accessories' },
          { id: 'bags', name: 'Bags & Handbags' },
        ],
      },
      { id: 'kids-fashion', name: "Kids' Fashion" },
      { id: 'watches', name: 'Watches' },
      { id: 'jewelry', name: 'Jewelry' },
    ],
  },
  {
    id: 'beauty',
    name: 'Beauty & Personal Care',
    children: [
      { id: 'skincare', name: 'Skincare' },
      { id: 'makeup', name: 'Makeup' },
      { id: 'haircare', name: 'Hair Care' },
      { id: 'fragrances', name: 'Fragrances' },
      { id: 'personal-care', name: 'Personal Care Appliances' },
    ],
  },
  {
    id: 'health',
    name: 'Health & Wellness',
    children: [
      { id: 'vitamins', name: 'Vitamins & Supplements' },
      { id: 'medical-supplies', name: 'Medical Supplies' },
      { id: 'fitness-nutrition', name: 'Fitness & Nutrition' },
      { id: 'health-monitors', name: 'Health Monitors' },
    ],
  },
  {
    id: 'automotive',
    name: 'Automotive',
    children: [
      {
        id: 'car-parts',
        name: 'Car Parts & Spares',
        children: [
          { id: 'engine-parts', name: 'Engine Parts' },
          { id: 'brake-parts', name: 'Brake Parts' },
          { id: 'suspension', name: 'Suspension Parts' },
          { id: 'electrical', name: 'Electrical Parts' },
        ],
      },
      {
        id: 'car-accessories',
        name: 'Car Accessories',
        children: [
          { id: 'interior-accessories', name: 'Interior Accessories' },
          { id: 'exterior-accessories', name: 'Exterior Accessories' },
          { id: 'car-electronics', name: 'Car Electronics' },
        ],
      },
      { id: 'motorcycle', name: 'Motorcycle Parts & Accessories' },
      { id: 'car-care', name: 'Car Care & Cleaning' },
    ],
  },
  {
    id: 'home-living',
    name: 'Home & Living',
    children: [
      {
        id: 'furniture',
        name: 'Furniture',
        children: [
          { id: 'living-room', name: 'Living Room Furniture' },
          { id: 'bedroom', name: 'Bedroom Furniture' },
          { id: 'office-furniture', name: 'Office Furniture' },
          { id: 'outdoor-furniture', name: 'Outdoor Furniture' },
        ],
      },
      { id: 'home-decor', name: 'Home Decor' },
      { id: 'bedding', name: 'Bedding & Bath' },
      { id: 'lighting', name: 'Lighting' },
      { id: 'storage', name: 'Storage & Organization' },
    ],
  },
  {
    id: 'outdoor-garden',
    name: 'Outdoor & Garden',
    children: [
      { id: 'gardening-tools', name: 'Gardening Tools' },
      { id: 'plants', name: 'Plants & Seeds' },
      { id: 'outdoor-decor', name: 'Outdoor Decor' },
      { id: 'bbq-outdoor', name: 'BBQ & Outdoor Cooking' },
    ],
  },
  {
    id: 'toys-games',
    name: 'Toys & Games',
    children: [
      { id: 'action-figures', name: 'Action Figures & Collectibles' },
      { id: 'dolls', name: 'Dolls & Accessories' },
      { id: 'building-toys', name: 'Building Toys' },
      { id: 'board-games', name: 'Board Games & Puzzles' },
      { id: 'outdoor-toys', name: 'Outdoor Toys' },
      { id: 'educational-toys', name: 'Educational Toys' },
    ],
  },
  {
    id: 'baby-kids',
    name: 'Baby & Kids',
    children: [
      { id: 'baby-gear', name: 'Baby Gear' },
      { id: 'baby-feeding', name: 'Feeding' },
      { id: 'diapers', name: 'Diapers & Potty Training' },
      { id: 'baby-care', name: 'Baby Care & Health' },
      { id: 'nursery', name: 'Nursery' },
    ],
  },
  {
    id: 'books-media',
    name: 'Books & Media',
    children: [
      { id: 'books', name: 'Books' },
      { id: 'ebooks', name: 'E-Books' },
      { id: 'magazines', name: 'Magazines' },
      { id: 'music', name: 'Music' },
      { id: 'movies', name: 'Movies & TV Shows' },
    ],
  },
  {
    id: 'office-supplies',
    name: 'Office Supplies & Stationery',
    children: [
      { id: 'writing', name: 'Writing Instruments' },
      { id: 'paper-products', name: 'Paper Products' },
      { id: 'office-equipment', name: 'Office Equipment' },
      { id: 'school-supplies', name: 'School Supplies' },
    ],
  },
  {
    id: 'printers',
    name: 'Printers & Scanners',
    children: [
      { id: 'inkjet', name: 'Inkjet Printers' },
      { id: 'laser', name: 'Laser Printers' },
      { id: 'scanners', name: 'Scanners' },
      { id: '3d-printers', name: '3D Printers' },
      { id: 'printer-supplies', name: 'Printer Supplies' },
    ],
  },
  {
    id: 'pet-supplies',
    name: 'Pet Supplies',
    children: [
      { id: 'dog-supplies', name: 'Dog Supplies' },
      { id: 'cat-supplies', name: 'Cat Supplies' },
      { id: 'fish-aquatic', name: 'Fish & Aquatic Pets' },
      { id: 'bird-supplies', name: 'Bird Supplies' },
      { id: 'small-animals', name: 'Small Animal Supplies' },
    ],
  },
  {
    id: 'groceries',
    name: 'Groceries & Food',
    children: [
      { id: 'fresh-food', name: 'Fresh Food' },
      { id: 'beverages', name: 'Beverages' },
      { id: 'snacks', name: 'Snacks & Confectionery' },
      { id: 'pantry', name: 'Pantry Staples' },
      { id: 'frozen', name: 'Frozen Food' },
    ],
  },
  {
    id: 'digital-utilities',
    name: 'Digital Utilities',
    unauthorized: true,
    children: [
      { id: 'software', name: 'Software' },
      { id: 'digital-content', name: 'Digital Content' },
      { id: 'gift-cards', name: 'Gift Cards & Vouchers' },
    ],
  },
  {
    id: 'services',
    name: 'Services',
    children: [
      { id: 'home-services', name: 'Home Services' },
      { id: 'professional', name: 'Professional Services' },
      { id: 'event-services', name: 'Event Services' },
      { id: 'repair-services', name: 'Repair & Maintenance' },
    ],
  },
];

interface CategorySelectorProps {
  onSelect: (path: string) => void;
  onClose: () => void;
}

export default function CategorySelector({ onSelect, onClose }: CategorySelectorProps) {
  const [selectedPath, setSelectedPath] = useState<Category[]>([]);
  const [filters, setFilters] = useState<string[]>(['', '', '', '']);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentlyUsed] = useState<string[]>(['Digital Utilities', 'Gaming Devices & Software']);

  const columns = useMemo(() => {
    const cols: Category[][] = [categoryData];
    
    selectedPath.forEach((selected) => {
      if (selected.children) {
        cols.push(selected.children);
      }
    });
    
    return cols;
  }, [selectedPath]);

  const filteredColumns = useMemo(() => {
    return columns.map((col, index) => {
      const filter = filters[index]?.toLowerCase() || '';
      if (!filter) return col;
      return col.filter(item => item.name.toLowerCase().includes(filter));
    });
  }, [columns, filters]);

  const handleCategoryClick = (category: Category, columnIndex: number) => {
    const newPath = selectedPath.slice(0, columnIndex);
    newPath.push(category);
    setSelectedPath(newPath);
    
    // Clear filters for columns after the current one
    const newFilters = [...filters];
    for (let i = columnIndex + 1; i < newFilters.length; i++) {
      newFilters[i] = '';
    }
    setFilters(newFilters);
  };

  const handleFilterChange = (value: string, columnIndex: number) => {
    const newFilters = [...filters];
    newFilters[columnIndex] = value;
    setFilters(newFilters);
  };

  const handleConfirm = () => {
    const path = selectedPath.map(cat => cat.name).join(' > ');
    onSelect(path);
    onClose();
  };

  const breadcrumb = selectedPath.map(cat => cat.name).join(' > ');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search category"
              className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium border border-blue-200">
              Recently used
            </button>
            {recentlyUsed.map((category, idx) => (
              <button
                key={idx}
                onClick={() => {
                  // Find and select the category
                  const found = categoryData.find(c => c.name === category);
                  if (found) {
                    setSelectedPath([found]);
                  }
                }}
                className="px-4 py-1.5 text-gray-600 hover:bg-gray-100 rounded-full text-sm border border-gray-200 hover:border-gray-300 transition-colors"
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Miller Columns */}
        <div className="flex-1 overflow-hidden min-h-0">
          <div className="flex h-full">
            {filteredColumns.map((column, columnIndex) => (
              <div key={columnIndex} className="flex-1 border-r border-gray-200 last:border-r-0 flex flex-col min-w-[200px] h-full">
                {/* Sticky Filter */}
                <div className="sticky top-0 bg-gray-50 p-3 border-b border-gray-200 z-10">
                  <div className="relative">
                    <input
                      type="text"
                      value={filters[columnIndex] || ''}
                      onChange={(e) => handleFilterChange(e.target.value, columnIndex)}
                      placeholder="Filter..."
                      className="w-full px-3 py-1.5 pl-8 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                    />
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {filters[columnIndex] && (
                      <button
                        onClick={() => handleFilterChange('', columnIndex)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Category List */}
                <div 
                  className="flex-1 overflow-y-auto overflow-x-hidden"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#CBD5E0 #F7FAFC'
                  }}
                >
                  {column.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-500">
                      No categories found
                    </div>
                  ) : (
                    column.map((category) => {
                      const isSelected = selectedPath[columnIndex]?.id === category.id;
                      const hasChildren = category.children && category.children.length > 0;
                      
                      return (
                        <button
                          key={category.id}
                          onClick={() => handleCategoryClick(category, columnIndex)}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between group ${
                            isSelected
                              ? 'bg-blue-50 text-blue-600 font-medium border-l-2 border-blue-600'
                              : 'text-gray-700 hover:bg-gray-50 border-l-2 border-transparent'
                          }`}
                        >
                          <span className="truncate flex items-center gap-2">
                            {category.name}
                            {category.unauthorized && (
                              <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                                Unauthorised
                              </span>
                            )}
                          </span>
                          {hasChildren && (
                            <svg className={`w-4 h-4 flex-shrink-0 ml-2 transition-transform ${isSelected ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 flex-1 min-w-0">
              <span className="flex-shrink-0">Current selection:</span>
              <span className="text-blue-600 font-medium truncate">
                {breadcrumb || 'None'}
              </span>
              {breadcrumb && (
                <button
                  onClick={() => setSelectedPath([])}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedPath.length === 0}
              className={`px-6 py-2.5 rounded-lg font-medium ${
                selectedPath.length === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
