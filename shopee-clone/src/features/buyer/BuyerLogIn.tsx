import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import shopeeLogo from '../../assets/LANDING-PAGE-LOGO/buyer-shopee-logo-sign-log.png';
import { QrCode, Eye, EyeOff } from 'lucide-react';

// Payment Methods
import spayImg from '../../assets/PAYMENTS/buyer-spay.png';
import spaylaterImg from '../../assets/PAYMENTS/buyer-spaylater.png';
import maribankImg from '../../assets/PAYMENTS/buyer-maribank.png';
import dragonpayImg from '../../assets/PAYMENTS/buyer-dragonpay.png';
import mastercardImg from '../../assets/PAYMENTS/buyer-mastercard.png';
import visaImg from '../../assets/PAYMENTS/buyer-visa.png';
import jcbImg from '../../assets/PAYMENTS/buyer-jcb.png';
import bpiImg from '../../assets/PAYMENTS/buyer-bpi.png';
import mayaImg from '../../assets/PAYMENTS/buyer-maya.png';

// Logistics
import spxImg from '../../assets/LOGISTICS/buyer-spx.png';
import flashExpressImg from '../../assets/LOGISTICS/buyer-flash-express.png';
import jntExpressImg from '../../assets/LOGISTICS/buyer-jnt-express.png';
import twogoExpressImg from '../../assets/LOGISTICS/buyer-2go-express.png';
import xdeImg from '../../assets/LOGISTICS/buyer-xde.png';
import ytoExpressImg from '../../assets/LOGISTICS/buyer-yto-express.png';
import worklinkDeliveryImg from '../../assets/LOGISTICS/buyer-worklink-delivery.png';

// App Download
import qrCodeImg from '../../assets/APP-DOWNLOAD/buyer-qr-code.png';
import appStoreImg from '../../assets/APP-DOWNLOAD/buyer-app-store.png';
import googlePlayImg from '../../assets/APP-DOWNLOAD/buyer-google-play.png';
import appGalleryImg from '../../assets/APP-DOWNLOAD/buyer-app-gallery.png';

const BuyerLogIn: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const { login, loginWithGoogle, isLoading, isAuthenticated, setAuthFromToken } = useAuth();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const navigate = useNavigate();

  // Check for OAuth callback token or error in URL
  useEffect(() => {
    const token = searchParams.get('token');
    const urlError = searchParams.get('error');

    if (urlError) {
      setError(decodeURIComponent(urlError).replace(/_/g, ' '));
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (token) {
      setAuthFromToken(token)
        .then(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          navigate('/');
        })
        .catch((err) => {
          setError('Failed to authenticate. Please try again.');
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    }
  }, [searchParams, setAuthFromToken, navigate]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <div className="bg-white py-4 px-8 border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 ml-20">
            <Link to="/" className="flex items-center gap-1">
              <img src={shopeeLogo} alt="Shopee" className="h-10 w-auto" />
              <span className="text-shopee-orange text-3xl font-bold tracking-tight hover:opacity-90">Shopee</span>
            </Link>
            <span className="text-2xl font-medium text-gray-800">Log In</span>
          </div>
          <a href="#" className="text-shopee-orange hover:underline text-sm mr-20">Need help?</a>
        </div>
      </div>

      {/* Main Content with scrollable area */}
      <div className="flex-1 bg-gradient-to-br from-shopee-orange via-orange-400 to-orange-300 relative overflow-y-auto">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Stars */}
          <div className="absolute top-20 left-32 text-yellow-300 text-4xl animate-pulse">⭐</div>
          <div className="absolute top-40 right-48 text-yellow-200 text-3xl animate-pulse">⭐</div>
          <div className="absolute bottom-32 left-24 text-yellow-300 text-2xl animate-pulse">⭐</div>
          {/* Gifts and decorations */}
          <div className="absolute top-32 left-64 text-6xl animate-bounce">🎁</div>
          <div className="absolute top-28 left-48 text-5xl">🕶️</div>
          <div className="absolute top-20 right-64 text-6xl">💄</div>
          <div className="absolute bottom-40 left-48 text-5xl">🏷️</div>
          <div className="absolute bottom-32 right-32 text-5xl">🎀</div>
        </div>

        {/* Centered Content Container */}
        <div className="max-w-7xl mx-auto px-8 py-16 relative z-10">
          <div className="flex items-center justify-center gap-16">
            {/* Left Side - Promotional Banner */}
            <div className="flex-shrink-0">
              <div className="text-center relative">
                {/* Main Sale Banner */}
                <div className="relative">
                  <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 rounded-3xl p-8 shadow-2xl transform -rotate-2">
                    <div className="bg-white rounded-2xl p-6 transform rotate-2">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="bg-shopee-orange text-white px-3 py-1 rounded-full text-xs font-bold">
                          🎄 Shopee 12th CHRISTMAS
                        </span>
                      </div>
                      <h1 className="text-white text-8xl font-black mb-2" style={{
                        WebkitTextStroke: '3px #ff6b00',
                        textShadow: '4px 4px 0px rgba(0,0,0,0.2)'
                      }}>
                        12.12
                      </h1>
                      <p className="text-3xl font-bold text-red-600 mb-4">MEGA PAMASKO SALE</p>
                      <div className="flex gap-4 justify-center items-center mb-4">
                        <div className="bg-yellow-400 text-red-600 px-4 py-2 rounded-lg font-bold text-sm">
                          Sigurado sa<br />Shopee Mall
                        </div>
                        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm">
                          Use 🔥 SPayLater<br />0% INTEREST<br />ON ALL ITEMS
                        </div>
                        <div className="bg-yellow-300 text-red-600 px-4 py-2 rounded-lg font-bold text-sm">
                          ₱1,200<br />VOUCHER PAMASKO
                        </div>
                      </div>
                      <div className="bg-shopee-orange text-white px-6 py-2 rounded-full font-bold text-xl">
                        DEC 1 - 17
                      </div>
                    </div>
                  </div>
                  {/* Floating badges */}
                  <div className="absolute -bottom-8 -left-8 bg-blue-500 text-white rounded-full w-24 h-24 flex items-center justify-center transform -rotate-12 shadow-lg">
                    <div className="text-center">
                      <div className="text-3xl font-black">0%</div>
                      <div className="text-xs">INTEREST</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Log In Form */}
            <div className="flex-shrink-0">
              <div className="bg-white rounded-lg shadow-2xl p-8 w-[400px] relative">
                <h2 className="text-2xl font-medium text-gray-800 mb-6">Log In</h2>
                <button
                  type="button"
                  className="absolute top-6 right-6 flex items-center gap-2 border border-yellow-400 text-yellow-500 px-3 py-1 rounded shadow-sm hover:bg-yellow-50"
                >
                  <span className="text-sm">Log in with QR</span>
                  <QrCode size={18} className="text-yellow-500" />
                </button>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <input
                      type="text"
                      placeholder="Phone number / Username / Email"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-shopee-orange text-gray-700"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded focus:outline-none focus:border-shopee-orange text-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-shopee-orange text-white py-3 rounded font-medium hover:bg-shopee-orange-dark transition-colors uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Logging in...' : 'Log In'}
                  </button>

                  <div>
                    <a href="#" className="text-sm text-blue-600 hover:underline">Forgot Password</a>
                  </div>

                  <div className="relative flex items-center justify-center my-6">
                    <div className="border-t border-gray-300 flex-1"></div>
                    <span className="px-4 text-gray-400 text-sm">OR</span>
                    <div className="border-t border-gray-300 flex-1"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span className="text-sm text-gray-700">Facebook</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span className="text-sm text-gray-700">Google</span>
                    </button>
                  </div>

                  <div className="text-center text-sm text-gray-600 mt-4">
                    New to Shopee?{' '}
                    <Link to="/signup" className="text-shopee-orange hover:underline font-medium">Sign Up</Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* White Space for Scrolling */}
        <div className="bg-white pt-16">
          <footer className="bg-white border-t border-gray-200">
            <div className="max-w-[1200px] mx-auto px-5 py-10">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 text-xs">
                {/* Customer Service */}
                <div>
                  <h4 className="font-bold text-gray-800 mb-4 uppercase">Customer Service</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li><a href="#" className="hover:text-shopee-orange">Help Centre</a></li>
                    <li><a href="#" className="hover:text-shopee-orange">Shopee Cares PH</a></li>
                    <li><a href="#" className="hover:text-shopee-orange">Payment Methods</a></li>
                    <li><a href="#" className="hover:text-shopee-orange">ShopeePay</a></li>
                    <li><a href="#" className="hover:text-shopee-orange">Shopee Coins</a></li>
                    <li><a href="#" className="hover:text-shopee-orange">Order Tracking</a></li>
                    <li><a href="#" className="hover:text-shopee-orange">Free Shipping</a></li>
                    <li><a href="#" className="hover:text-shopee-orange">Return & Refund</a></li>
                    <li><a href="#" className="hover:text-shopee-orange">Shopee Guarantee</a></li>
                    <li><a href="#" className="hover:text-shopee-orange">Overseas Product</a></li>
                    <li><a href="#" className="hover:text-shopee-orange">Contact Us</a></li>
                  </ul>
                </div>
                {/* About Shopee */}
                <div>
                  <h4 className="font-bold text-gray-800 mb-4 uppercase">About Shopee</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li><a href="#" className="hover:text-shopee-orange">About Us</a></li>
                    <li><a href="#" className="hover:text-shopee-orange">Shopee Blog</a></li>
                    <li><a href="#" className="hover:text-shopee-orange">Shopee Careers</a></li>
                    <li><a href="#" className="hover:text-shopee-orange">Policies</a></li>
                    <li><a href="#" className="hover:text-shopee-orange">Shopee Privacy Policy</a></li>
                    <li><a href="#" className="hover:text-shopee-orange">Shopee Mall</a></li>
                    <li><a href="#" className="hover:text-shopee-orange">Seller Centre</a></li>
                    <li><a href="#" className="hover:text-shopee-orange">Flash Deals</a></li>
                    <li><a href="#" className="hover:text-shopee-orange">Media Contact</a></li>
                  </ul>
                </div>
                {/* Payment */}
                <div>
                  <h4 className="font-bold text-gray-800 mb-4 uppercase">Payment</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                      <img src={spayImg} alt="SPay" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                      <img src={spaylaterImg} alt="SPayLater" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                      <img src={maribankImg} alt="MariBank" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                      <img src={dragonpayImg} alt="Dragonpay" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                      <img src={mastercardImg} alt="Mastercard" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                      <img src={visaImg} alt="VISA" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                      <img src={jcbImg} alt="JCB" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                      <img src={bpiImg} alt="BPI" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                      <img src={mayaImg} alt="Maya" className="max-h-full max-w-full object-contain" />
                    </div>
                  </div>
                  <h4 className="font-bold text-gray-800 mb-4 mt-6 uppercase">Logistics</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                      <img src={spxImg} alt="SPX" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                      <img src={flashExpressImg} alt="Flash Express" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                      <img src={jntExpressImg} alt="J&T Express" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                      <img src={twogoExpressImg} alt="2GO Express" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                      <img src={xdeImg} alt="XDE" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                      <img src={ytoExpressImg} alt="YTO Express" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                      <img src={worklinkDeliveryImg} alt="WorkLink Delivery" className="max-h-full max-w-full object-contain" />
                    </div>
                  </div>
                </div>
                {/* Follow Us */}
                <div>
                  <h4 className="font-bold text-gray-800 mb-4 uppercase">Follow Us</h4>
                  <ul className="space-y-3 text-gray-600">
                    <li>
                      <a href="#" className="hover:text-shopee-orange flex items-center gap-2">
                        <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-[10px]">f</span>
                        </div>
                        Facebook
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-shopee-orange flex items-center gap-2">
                        <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-[10px]">📷</span>
                        </div>
                        Instagram
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-shopee-orange flex items-center gap-2">
                        <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-[10px]">𝕏</span>
                        </div>
                        Twitter
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-shopee-orange flex items-center gap-2">
                        <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-[10px]">in</span>
                        </div>
                        LinkedIn
                      </a>
                    </li>
                  </ul>
                </div>
                {/* Shopee App Download */}
                <div>
                  <h4 className="font-bold text-gray-800 mb-4 uppercase">Shopee App Download</h4>
                  <div className="flex gap-2 mb-4">
                    <img src={qrCodeImg} alt="QR Code" className="w-16 h-16 border border-gray-200" />
                    <div className="flex flex-col gap-1">
                      <img src={appStoreImg} alt="App Store" className="h-5 object-contain" />
                      <img src={googlePlayImg} alt="Google Play" className="h-5 object-contain" />
                      <img src={appGalleryImg} alt="AppGallery" className="h-5 object-contain" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default BuyerLogIn;
