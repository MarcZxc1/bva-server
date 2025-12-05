import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Bell, HelpCircle, Facebook, Instagram, User } from 'lucide-react';
import shopeeLogo from '/src/assets/LANDING-PAGE-LOGO/buyer-shopee-logo.png';

const BuyerNavbar: React.FC = () => {
  const [user, setUser] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('demoUser');
    setUser(stored);
  }, []);

  const logout = () => {
    localStorage.removeItem('demoUser');
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="bg-shopee-orange text-white sticky top-0 z-50">
      {/* Top Row */}
      <div className="border-b border-white/20">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="flex justify-between items-center py-2 text-xs">
            {/* Left Side */}
            <div className="flex items-center gap-3">
              <Link to="/login" className="hover:text-gray-200">Seller Centre</Link>
              <span className="text-white/40">|</span>
              <Link to="/login" className="hover:text-gray-200">Start Selling</Link>
              <span className="text-white/40">|</span>
              <a href="#" className="hover:text-gray-200">Download</a>
              <span className="text-white/40">|</span>
              <div className="flex items-center gap-1">
                <span>Follow us on</span>
                <a href="#" className="hover:text-gray-200">
                  <Facebook size={14} />
                </a>
                <a href="#" className="hover:text-gray-200">
                  <Instagram size={14} />
                </a>
              </div>
            </div>
            
            {/* Right Side */}
            <div className="flex items-center gap-3">
              <a href="#" className="hover:text-gray-200 flex items-center gap-1">
                <Bell size={14} />
                <span>Notifications</span>
              </a>
              <a href="#" className="hover:text-gray-200 flex items-center gap-1">
                <HelpCircle size={14} />
                <span>Help</span>
              </a>
              <a href="#" className="hover:text-gray-200 flex items-center gap-1">
                <HelpCircle size={14} />
                <span>Help</span>
              </a>
              {!user && (
                <>
                  <Link to="/signup" className="hover:text-gray-200">Sign Up</Link>
                  <span className="text-white/40">|</span>
                  <Link to="/buyer-login" className="hover:text-gray-200">Login</Link>
                </>
              )}
              {user && (
                <div className="relative group">
                  <div className="flex items-center gap-2 cursor-pointer">
                    <User size={16} className="opacity-90" />
                    <span className="font-medium">{user}</span>
                  </div>
                  <div className="absolute right-0 mt-0 w-40 bg-white text-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 invisible group-hover:visible z-[100] top-full pt-2">
                    <div className="relative">
                      <div className="absolute -top-2 right-4 w-3 h-3 rotate-45 bg-white border-t border-l border-gray-200"></div>
                      <div className="py-2">
                        <Link to="/account" className="block px-4 py-2 hover:bg-green-100 transition-colors">My Account</Link>
                        <Link to="/purchase" className="block px-4 py-2 hover:bg-green-100 transition-colors">My Purchase</Link>
                        <button onClick={logout} className="block w-full text-left px-4 py-2 hover:bg-green-100 transition-colors">Logout</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="bg-shopee-orange py-4">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div className="flex-shrink-0">
              <div className="flex items-center gap-3">
                <img 
                  src={shopeeLogo} 
                  alt="Shopee" 
                  className="h-14 w-auto object-contain" 
                />
                <a href="#" className="text-white text-3xl font-bold tracking-tight hover:opacity-90">
                  Shopee
                </a>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative flex">
                <input
                  type="text"
                  placeholder="Sign up and get 100% off on your first order"
                  className="w-full px-4 py-2.5 text-sm text-gray-800 focus:outline-none placeholder:text-gray-400"
                />
                <button className="bg-shopee-orange-dark px-6 py-2 hover:opacity-90 transition-opacity">
                  <Search size={20} />
                </button>
              </div>
              {/* Popular searches */}
              <div className="mt-2 flex gap-3 text-xs">
                <a href="#" className="hover:text-gray-200">Baggy Pants For Women</a>
                <a href="#" className="hover:text-gray-200">One Peso Cellphone</a>
                <a href="#" className="hover:text-gray-200">Jsu Mini Fan</a>
                <a href="#" className="hover:text-gray-200">Piso Shoes</a>
                <a href="#" className="hover:text-gray-200">Aqua Flash</a>
                <a href="#" className="hover:text-gray-200">Denim Baggy Pants For Men</a>
              </div>
            </div>

            {/* Shopping Cart */}
            <div className="flex-shrink-0">
              <a href="#" className="relative hover:opacity-80 transition-opacity">
                <ShoppingCart size={30} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default BuyerNavbar;
