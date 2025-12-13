'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  IoStorefrontOutline, 
  IoReceiptOutline, 
  IoMegaphoneOutline, 
  IoStatsChartOutline, 
  IoTrophyOutline, 
  IoSchoolOutline, 
  IoChatbubblesOutline, 
  IoBusinessOutline, 
  IoWalletOutline, 
  IoHelpCircleOutline,
  IoPersonOutline 
} from 'react-icons/io5';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hasNotification?: boolean;
  subItems?: string[];
}

const menuItems: MenuItem[] = [
  { 
    id: 'products', 
    label: 'Products', 
    icon: IoStorefrontOutline, 
    subItems: [
      'Manage Products',
      'Add Products',
      'Decorate Products',
      'Fulfilment By Lazada',
      'Opportunity Center',
      'Assortment Growth Center'
    ] 
  },
  { 
    id: 'orders', 
    label: 'Orders', 
    icon: IoReceiptOutline, 
    subItems: [
      'Orders',
      'Logistics',
      'Return Orders',
      'Reviews'
    ] 
  },
  { id: 'marketing', label: 'Marketing Center', icon: IoMegaphoneOutline, subItems: [] },
  { id: 'data', label: 'Data Insight', icon: IoStatsChartOutline, subItems: [] },
  { id: 'privilege', label: 'Shop Privilege', icon: IoTrophyOutline, subItems: [] },
  { id: 'learn', label: 'Learn and Grow', icon: IoSchoolOutline, subItems: [] },
  { id: 'engagement', label: 'Engagement Center', icon: IoChatbubblesOutline, subItems: [] },
  { id: 'store', label: 'Store', icon: IoBusinessOutline, subItems: [] },
  { id: 'finance', label: 'Finance', icon: IoWalletOutline, subItems: [] },
  { id: 'support', label: 'Support', icon: IoHelpCircleOutline, subItems: [] },
];

export default function SellerDashboardNavbar() {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [activeItem, setActiveItem] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [showCommonTools, setShowCommonTools] = useState(false);

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <>
      <style jsx>{`
        nav::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <Link href="/seller-dashboard" className="flex items-center gap-2 mb-4">
          <img
            src="/seller-img/lazada-seller-logo.png"
            alt="Lazada Seller Center"
            className="h-8"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-blue-900 font-bold text-xl">Lazada</span>
            <span className="text-blue-600 text-sm font-semibold">Seller Center</span>
          </div>
        </Link>

        {/* Search Bar */}
        <div className="relative mb-1 mt-4 translate-y-6 w-[242px] -translate-x-4">
          <div className="flex items-center gap-2 px-4 py-2.5 border-2 border-blue-400 rounded-full bg-white">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs">🤖</span>
            </div>
            <input
              type="text"
              placeholder="Search with Ctrl + K"
              className="flex-1 text-sm text-gray-400 outline-none bg-transparent"
              readOnly
            />
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 pb-20 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* Common Tools */}
        <div>
          <button 
            onClick={() => setShowCommonTools(!showCommonTools)}
            className="w-full flex items-center justify-between px-6 py-2.5 text-left transition-colors bg-blue-50 hover:bg-blue-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                </svg>
              </div>
              <span className="text-blue-600 font-semibold text-sm">Common Tools</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <svg 
                className={`w-4 h-4 text-blue-600 transition-transform ${showCommonTools ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Common Tools Submenu */}
          {showCommonTools && (
            <div className="bg-gray-50">
              <Link
                href="/seller-dashboard/manage-products"
                className="block px-6 py-2 pl-16 text-sm text-black hover:text-blue-600 hover:bg-gray-100"
              >
                Manage Products
              </Link>
              <Link
                href="/seller-dashboard/orders"
                className="block px-6 py-2 pl-16 text-sm text-black hover:text-blue-600 hover:bg-gray-100"
              >
                Orders
              </Link>
              <Link
                href="/seller-dashboard/promotions"
                className="block px-6 py-2 pl-16 text-sm text-black hover:text-blue-600 hover:bg-gray-100"
              >
                Promotions
              </Link>
            </div>
          )}
        </div>

        {menuItems.map((item) => (
          <div key={item.id}>
            {item.subItems && item.subItems.length > 0 ? (
              <button
                onClick={() => {
                  if (activeItem === item.id) {
                    setActiveItem('');
                  } else {
                    setActiveItem(item.id);
                    setShowSettings(false);
                  }
                  toggleExpand(item.id);
                }}
                className={`w-full flex items-center justify-between px-6 py-2.5 text-left transition-colors ${
                  activeItem === item.id
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                    : 'text-black hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="text-lg opacity-60" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <svg 
                  className={`w-4 h-4 transition-transform ${activeItem === item.id ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            ) : (
              <Link
                href={`/seller-dashboard/${item.id === 'marketing' ? 'marketing' : 
                       item.id === 'data' ? 'data-insight' :
                       item.id === 'privilege' ? 'shop-privilege' :
                       item.id === 'learn' ? 'learn-and-grow' :
                       item.id === 'engagement' ? 'engagement-center' :
                       item.id}`}
                className="w-full flex items-center justify-between px-6 py-2.5 text-left transition-colors text-black hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="text-lg opacity-60" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              </Link>
            )}
            
            {/* Submenu items would go here if needed */}
            {item.subItems && expandedItems.includes(item.id) && (
              <div className="bg-gray-50">
                {item.subItems.map((subItem, index) => {
                  // Special handling for specific routes
                  let href;
                  if (subItem === 'Manage Products') {
                    href = '/seller-dashboard/manage-products';
                  } else if (subItem === 'Add Products') {
                    href = '/seller-dashboard/add-product';
                  } else if (subItem === 'Decorate Products') {
                    href = '/seller-dashboard/decorate-products';
                  } else if (subItem === 'Orders' && item.id === 'orders') {
                    href = '/seller-dashboard/orders';
                  } else if (subItem === 'Logistics') {
                    href = '/seller-dashboard/logistics';
                  } else if (subItem === 'Return Orders') {
                    href = '/seller-dashboard/return-orders';
                  } else if (subItem === 'Reviews') {
                    href = '/seller-dashboard/reviews';
                  } else {
                    // For other items, create coming soon pages
                    href = `/seller-dashboard/${subItem.toLowerCase().replace(/\s+/g, '-').replace(/\(/g, '').replace(/\)/g, '')}`;
                  }
                  
                  return (
                    <Link
                      key={index}
                      href={href}
                      className="block px-6 py-2 pl-16 text-sm text-black hover:text-blue-600 hover:bg-gray-100"
                    >
                      {subItem}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {/* My Account & Settings */}
        <div>
          <button
            onClick={() => {
              if (activeItem === 'account') {
                setActiveItem('');
              } else {
                setActiveItem('account');
              }
              setShowSettings(!showSettings);
            }}
            className={`w-full flex items-center justify-between px-6 py-2.5 text-left transition-colors ${
              activeItem === 'account'
                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                : 'text-black hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <IoPersonOutline className="text-lg opacity-60" />
              <span className="text-sm font-medium">My Account</span>
            </div>
            <svg 
              className={`w-4 h-4 transition-transform ${activeItem === 'account' ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showSettings && (
            <>
              <Link
                href="/seller-dashboard/settings"
                className="block px-6 py-2 pl-16 text-sm text-black hover:text-blue-600 hover:bg-gray-100"
              >
                Settings
              </Link>
              
              <Link
                href="/seller-login"
                className="block px-6 py-2 pl-16 text-sm text-black hover:text-blue-600 hover:bg-gray-100"
              >
                Logout
              </Link>
            </>
          )}
        </div>
      </nav>
    </aside>
    </>
  );
}
