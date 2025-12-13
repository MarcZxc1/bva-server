'use client';

import Link from 'next/link';

export function Sidebar() {
  const sidebarItems = [
    { icon: '🏠', label: 'Home', href: '/' },
    { icon: '💬', label: 'Feedback', href: '#' },
    { icon: '🤝', label: 'Seller', href: '#' },
    { icon: '👤', label: 'Account', href: '/profile' },
  ];

  return (
    <div className="fixed left-0 bottom-0 w-14 bg-white border-r border-gray-200 border-t border-gray-200 flex flex-col items-center py-3 gap-2 z-40">
      {sidebarItems.map((item, idx) => (
        <Link
          key={idx}
          href={item.href}
          className="flex flex-col items-center justify-center w-10 h-10 rounded hover:bg-gray-100 transition text-lg"
          title={item.label}
        >
          {item.icon}
        </Link>
      ))}
      {/* Scroll Up Arrow */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="flex flex-col items-center justify-center w-10 h-10 rounded hover:bg-gray-100 transition text-lg mt-2 pt-2 border-t border-gray-200"
        title="Back to Top"
      >
        △
      </button>
    </div>
  );
}
