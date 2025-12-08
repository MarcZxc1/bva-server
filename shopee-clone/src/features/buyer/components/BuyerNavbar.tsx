import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, Bell, HelpCircle, Facebook, Instagram, User } from 'lucide-react';
import shopeeLogo from '/src/assets/LANDING-PAGE-LOGO/buyer-shopee-logo.png';
import { useCart } from '../../../contexts/CartContext';
import { useAuth } from '../../../contexts/AuthContext';

const BuyerNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems } = useCart();
  const { user, logout: authLogout, isAuthenticated } = useAuth();

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const isProductDetailPage = location.pathname.startsWith('/product/');
  const isCheckoutPage = location.pathname === '/checkout';

  const logout = () => {
    authLogout();
    navigate('/');
  };

  const userName = user?.name || user?.username || user?.email || null;

  return (
    <nav 
      className={`bg-shopee-orange text-white z-50 ${isProductDetailPage || isCheckoutPage ? 'static' : 'sticky top-0'}`}
      style={isProductDetailPage || isCheckoutPage ? { position: 'static', zIndex: 50 } : { position: 'sticky', top: 0, zIndex: 50 }}
    >
      {/* Top Row */}
      <div className="border-b border-white/20">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="flex justify-between items-center py-2 text-xs">
            {/* Left Side - Seller Login */}
            <div className="flex items-center gap-3">
              <Link 
                to="/login" 
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105 border border-white/20 hover:border-white/40"
              >
                Seller Centre
              </Link>
              <Link 
                to="/login" 
                className="px-3 py-1.5 bg-shopee-orange-dark hover:bg-shopee-orange-dark/90 rounded-md text-sm font-semibold transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
              >
                Start Selling
              </Link>
              <span className="text-white/40">|</span>
              <a href="#" className="hover:text-gray-200 text-sm transition-colors">Download</a>
              <span className="text-white/40">|</span>
              <div className="flex items-center gap-1 text-sm">
                <span>Follow us on</span>
                <a href="#" className="hover:text-gray-200 transition-colors">
                  <Facebook size={14} />
                </a>
                <a href="#" className="hover:text-gray-200 transition-colors">
                  <Instagram size={14} />
                </a>
              </div>
            </div>
            
            {/* Right Side - Buyer Login */}
            <div className="flex items-center gap-3">
              <a href="#" className="hover:text-gray-200 flex items-center gap-1">
                <Bell size={14} />
                <span>Notifications</span>
              </a>
              <a href="#" className="hover:text-gray-200 flex items-center gap-1">
                <HelpCircle size={14} />
                <span>Help</span>
              </a>
              {!isAuthenticated && (
                <>
                  <Link 
                    to="/signup" 
                    className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105 border border-white/20 hover:border-white/40"
                  >
                    Sign Up
                  </Link>
                  <Link 
                    to="/buyer-login" 
                    className="px-4 py-1.5 bg-white text-shopee-orange hover:bg-gray-50 rounded-md text-sm font-semibold transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                  >
                    Login
                  </Link>
                </>
              )}
              {isAuthenticated && userName && (
                <div className="relative group">
                  <div className="flex items-center gap-2 cursor-pointer">
                    <User size={16} className="opacity-90" />
                    <span className="font-medium">{userName}</span>
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
              <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                <img 
                  src={shopeeLogo} 
                  alt="Shopee" 
                  className="h-14 w-auto object-contain" 
                />
                <span className="text-white text-3xl font-bold tracking-tight">
                  Shopee
                </span>
              </Link>
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
              <Link to="/cart" className="relative hover:opacity-80 transition-opacity">
                <ShoppingCart size={30} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default BuyerNavbar;
