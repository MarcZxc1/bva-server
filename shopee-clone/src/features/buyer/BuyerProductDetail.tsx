import React, { useState, useEffect } from 'react';
import BuyerNavbar from './components/BuyerNavbar';
import BuyerFooter from './components/BuyerFooter';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Star, Heart, Truck, ShieldCheck, ShoppingCart, MessageCircle, Store, Facebook, MessageSquare, Twitter, Play } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import apiClient from '../../services/api';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  stock?: number;
  imageUrl?: string;
  category?: string;
  sku?: string;
  shop?: {
    id: string;
    name: string;
  };
}

const BuyerProductDetail: React.FC = () => {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [countdown, setCountdown] = useState({ hours: 4, minutes: 7, seconds: 3 });

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setError('Product ID is required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await apiClient.getProductById(productId);
        setProduct(data);
        
        // Fetch related products (same category or shop)
        if (data.category || data.shop?.id) {
          try {
            const allProducts = await apiClient.getProducts();
            const related = allProducts
              .filter((p: Product) => 
                p.id !== productId && 
                (p.category === data.category || p.shop?.id === data.shop?.id)
              )
              .slice(0, 6);
            setRelatedProducts(related);
          } catch (err) {
            console.error('Error fetching related products:', err);
          }
        }
      } catch (err: any) {
        console.error('Error fetching product:', err);
        setError(err.message || 'Failed to load product');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Set initial variation (moved before early returns)
  useEffect(() => {
    const variations: string[] = [];
    if (variations.length > 0 && !selectedVariation) {
      setSelectedVariation(variations[0]);
    }
  }, [selectedVariation]);

  // Countdown timer (moved before early returns)
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
          if (minutes < 0) {
            minutes = 59;
            hours--;
            if (hours < 0) {
              hours = 0;
              minutes = 0;
              seconds = 0;
            }
          }
        }
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Scroll to top on product change (moved before early returns)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [productId]);

  // Early returns after all hooks
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BuyerNavbar />
        <div className="max-w-[1200px] mx-auto px-5 py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-shopee-orange"></div>
          <p className="mt-4 text-gray-500">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BuyerNavbar />
        <div className="max-w-[1200px] mx-auto px-5 py-12 text-center">
          <p className="text-red-500 mb-4">{error || 'Product not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="text-shopee-orange hover:text-shopee-orange-dark"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const variations: string[] = [];

  const handleAddToCart = () => {
    if (!product) return;
    
    // Check stock availability
    if (product.stock === undefined || product.stock === null) {
      alert('Stock information is not available for this product.');
      return;
    }
    
    if (product.stock === 0) {
      alert('This product is out of stock.');
      return;
    }
    
    if (quantity > product.stock) {
      alert(`Only ${product.stock} units available in stock.`);
      setQuantity(product.stock);
      return;
    }
    
    const productImage = product.imageUrl || '📦';
    const shopName = product.shop?.name || 'Shop';
    const productPrice = product.price;
    
    addToCart({
      productId: product.id as any, // Temporary fix: product.id is string, CartItem accepts string | number
      name: product.name,
      fullName: product.name,
      image: productImage,
      shopName: shopName,
      unitPrice: productPrice,
      quantity: quantity,
      variations: selectedVariation || 'Standard',
    });
  };

  const handleBuyNow = () => {
    if (!product) return;
    
    // Check stock availability
    if (product.stock === undefined || product.stock === null) {
      alert('Stock information is not available for this product.');
      return;
    }
    
    if (product.stock === 0) {
      alert('This product is out of stock.');
      return;
    }
    
    if (quantity > product.stock) {
      alert(`Only ${product.stock} units available in stock.`);
      setQuantity(product.stock);
      return;
    }
    
    handleAddToCart();
    navigate('/cart');
  };

  const formatTime = (value: number) => {
    return value.toString().padStart(2, '0');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <BuyerNavbar />

      <div className="max-w-[1200px] mx-auto px-5 py-6">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 mb-4">
          <Link to="/" className="hover:text-shopee-orange">Shopee</Link>
          <span className="mx-1">›</span>
          <Link to="/" className="hover:text-shopee-orange">Makeup & Fragrances</Link>
          <span className="mx-1">›</span>
          <Link to="/" className="hover:text-shopee-orange">Tools & Accessories</Link>
          <span className="mx-1">›</span>
          <span className="text-gray-700">False Eyelashes</span>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Gallery */}
            <div>
              <div className="aspect-square bg-white flex items-center justify-center border border-gray-200 mb-3 relative overflow-hidden">
                {product.imageUrl && (product.imageUrl.startsWith('http') || product.imageUrl.startsWith('/') || product.imageUrl.startsWith('data:')) ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.image-fallback')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'image-fallback w-full h-full flex items-center justify-center bg-gray-100';
                        fallback.innerHTML = '<span class="text-5xl opacity-50">📦</span>';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <span className="text-5xl opacity-50">{product.imageUrl || '📦'}</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {[product.imageUrl || '📦', product.imageUrl || '📦', product.imageUrl || '📦', product.imageUrl || '📦', product.imageUrl || '📦'].map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`aspect-square border-2 bg-white flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden ${
                      selectedImage === i
                        ? 'border-shopee-orange'
                        : 'border-gray-200 hover:border-shopee-orange'
                    }`}
                  >
                    {img && (img.startsWith('http') || img.startsWith('/') || img.startsWith('data:')) ? (
                      <img 
                        src={img} 
                        alt={`${product.name} ${i + 1}`} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.image-fallback')) {
                            const fallback = document.createElement('span');
                            fallback.className = 'text-2xl mb-1 image-fallback';
                            fallback.textContent = '📦';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <span className="text-2xl mb-1">{img}</span>
                    )}
                    <span className="text-[10px] text-gray-500 absolute bottom-1">{i + 1}</span>
                  </div>
                ))}
              </div>

              {/* Share & Favorite */}
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">Share:</span>
                <div className="flex items-center gap-2">
                  <button className="p-2 border border-gray-300 rounded hover:bg-gray-50">
                    <Facebook size={16} className="text-blue-600" />
                  </button>
                  <button className="p-2 border border-gray-300 rounded hover:bg-gray-50">
                    <MessageSquare size={16} className="text-blue-500" />
                  </button>
                  <button className="p-2 border border-gray-300 rounded hover:bg-gray-50">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-red-600">
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.619 11.174-.105-.949-.2-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.222.083.343-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
                    </svg>
                  </button>
                  <button className="p-2 border border-gray-300 rounded hover:bg-gray-50">
                    <Twitter size={16} className="text-blue-400" />
                  </button>
                </div>
                <button className="flex items-center gap-2 text-gray-600 hover:text-shopee-orange ml-4">
                  <Heart size={16} /> Favorite (0)
                </button>
              </div>
            </div>

            {/* Right: Info */}
            <div>
              <h1 className="text-lg font-semibold text-gray-800 leading-tight">
                {product.name}
              </h1>

              <div className="mt-3 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-shopee-orange">4.5</span>
                  <Star size={16} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-gray-500">(0 Ratings)</span>
                </div>
                <div className="text-gray-500">0+ Sold</div>
              </div>

              {/* Flash Deals Section */}
              <div className="mt-4 bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded">
                <div className="text-xs font-semibold mb-2">FLASH DEALS</div>
                <div className="flex items-baseline gap-3 mb-2">
                  <div className="text-3xl font-bold">₱{product.price.toLocaleString()}</div>
                  {product.cost && product.cost > product.price && (
                    <span className="text-sm line-through opacity-80">₱{product.cost.toLocaleString()}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span>ENDS IN</span>
                  <div className="bg-white/20 px-2 py-1 rounded font-mono font-bold">
                    {formatTime(countdown.hours)} : {formatTime(countdown.minutes)} : {formatTime(countdown.seconds)}
                  </div>
                </div>
              </div>

              {/* Shop Vouchers */}
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">Shop Vouchers</span>
                  <span className="text-shopee-orange font-bold ml-2">₱9 OFF</span>
                </div>
              </div>

              {/* Delivery and Protection Info */}
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-green-600">
                  <ShieldCheck size={16} /> Guaranteed to get by 6-10 Dec <span className="text-gray-400">&gt;</span>
                </div>
                <div className="text-gray-700">
                  Get a ₱50 voucher if your order arrives late.
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Truck size={16} /> Free & Easy Returns Merchandise Protection
                </div>
              </div>

              {/* Variations */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Variation</h3>
                <div className="grid grid-cols-2 gap-2">
                  {variations.map((variation) => (
                    <button
                      key={variation}
                      onClick={() => setSelectedVariation(variation)}
                      className={`text-xs border-2 rounded px-3 py-2 text-left transition-all ${
                        selectedVariation === variation
                          ? 'border-shopee-orange bg-orange-50 text-shopee-orange'
                          : 'border-gray-300 hover:border-shopee-orange text-gray-700'
                      }`}
                    >
                      {variation}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mt-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700">Quantity</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={quantity <= 1 || (product.stock !== undefined && product.stock === 0)}
                    >
                      <span className="text-lg">−</span>
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const newQuantity = Math.max(1, parseInt(e.target.value) || 1);
                        const maxQuantity = product.stock !== undefined ? product.stock : Infinity;
                        setQuantity(Math.min(newQuantity, maxQuantity));
                      }}
                      className="w-16 h-8 border border-gray-300 rounded text-center text-sm"
                      min="1"
                      max={product.stock !== undefined ? product.stock : undefined}
                      disabled={product.stock !== undefined && product.stock === 0}
                    />
                    <button
                      onClick={() => {
                        const maxQuantity = product.stock !== undefined ? product.stock : Infinity;
                        setQuantity(Math.min(quantity + 1, maxQuantity));
                      }}
                      className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={product.stock !== undefined && (quantity >= product.stock || product.stock === 0)}
                    >
                      <span className="text-lg">+</span>
                    </button>
                  </div>
                  <span className={`text-sm font-semibold ${
                    product.stock === undefined || product.stock === null
                      ? 'text-gray-500'
                      : product.stock === 0
                      ? 'text-red-600'
                      : product.stock <= 5
                      ? 'text-orange-600'
                      : 'text-green-600'
                  }`}>
                    {product.stock === undefined || product.stock === null
                      ? 'STOCK UNKNOWN'
                      : product.stock === 0
                      ? 'OUT OF STOCK'
                      : product.stock <= 5
                      ? `LOW STOCK (${product.stock} left)`
                      : `IN STOCK (${product.stock} available)`
                    }
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock !== undefined && product.stock === 0}
                  className="flex-1 px-6 py-3 border-2 border-shopee-orange bg-white text-shopee-orange rounded-lg font-semibold hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400"
                >
                  <ShoppingCart size={20} className="text-shopee-orange" />
                  <span>{product.stock === 0 ? 'Out of Stock' : 'Add To Cart'}</span>
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock !== undefined && product.stock === 0}
                  className="flex-1 px-6 py-4 bg-shopee-orange text-white rounded-lg font-semibold hover:bg-shopee-orange-dark transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {product.stock === 0 ? 'Out of Stock' : `Buy With Voucher ₱${product.price.toLocaleString()}`}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Store Profile Section */}
        <div className="bg-white border border-gray-200 rounded-lg mt-6 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold">
                {(product.shop?.name || 'Shop').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{product.shop?.name || 'Shop'}</h3>
                <p className="text-sm text-gray-500">Active Now</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-shopee-orange text-white rounded-lg font-semibold hover:bg-shopee-orange-dark transition-colors flex items-center gap-2">
                <MessageCircle size={18} />
                Chat Now
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Store size={18} />
                View Shop
              </button>
            </div>
          </div>

          {/* Store Statistics */}
          <div className="mt-6 grid grid-cols-3 md:grid-cols-6 gap-4 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-shopee-orange font-bold text-lg">4K</div>
              <div className="text-xs text-gray-600">Ratings</div>
            </div>
            <div className="text-center">
              <div className="text-shopee-orange font-bold text-lg">4</div>
              <div className="text-xs text-gray-600">Products</div>
            </div>
            <div className="text-center">
              <div className="text-shopee-orange font-bold text-lg">93%</div>
              <div className="text-xs text-gray-600">Response Rate</div>
            </div>
            <div className="text-center">
              <div className="text-shopee-orange font-bold text-lg">within hours</div>
              <div className="text-xs text-gray-600">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-shopee-orange font-bold text-lg">3 months ago</div>
              <div className="text-xs text-gray-600">Joined</div>
            </div>
            <div className="text-center">
              <div className="text-shopee-orange font-bold text-lg">728</div>
              <div className="text-xs text-gray-600">Follower</div>
            </div>
          </div>
        </div>

        {/* Product Specifications & Shop Vouchers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Product Specifications */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Product Specifications</h2>
            <div className="space-y-3 text-sm">
              <div className="flex">
                <span className="w-40 text-gray-600">Category:</span>
                <span className="text-gray-800">{product.category || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="w-40 text-gray-600">Stock Status:</span>
                <span className="text-green-600 font-semibold">
                  {product.stock && product.stock > 0 ? 'IN STOCK' : 'OUT OF STOCK'}
                </span>
              </div>
              {product.stock !== undefined && (
                <div className="flex">
                  <span className="w-40 text-gray-600">Stock Quantity:</span>
                  <span className="text-gray-800">{product.stock}</span>
                </div>
              )}
              {product.sku && (
                <div className="flex">
                  <span className="w-40 text-gray-600">SKU:</span>
                  <span className="text-gray-800">{product.sku}</span>
                </div>
              )}
              <div className="flex">
                <span className="w-40 text-gray-600">Condition:</span>
                <span className="text-gray-800">New</span>
              </div>
              <div className="flex">
                <span className="w-40 text-gray-600">Ships From:</span>
                <span className="text-gray-800">{product.shop?.name || 'Shop'}</span>
              </div>
            </div>
          </div>

          {/* Shop Vouchers */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Shop Vouchers</h2>
            <div className="border-2 border-shopee-orange rounded-lg p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-shopee-orange font-bold text-lg">P9 off</div>
                  <div className="text-xs text-gray-600">Min. Spend P0</div>
                </div>
              </div>
              <div className="text-xs text-gray-500 mb-3">Specific Product...</div>
              <div className="text-xs text-gray-500 mb-3">Valid Till 31.12.2025</div>
              <button className="w-full py-2 bg-shopee-orange text-white rounded font-semibold hover:bg-shopee-orange-dark transition-colors">
                Claim
              </button>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div className="bg-white border border-gray-200 rounded-lg mt-6 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Product Description</h2>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">{product.name}</h3>
              <p className="text-gray-700 leading-relaxed">{product.description || 'No description available.'}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">What's included:</h4>
              <p>100/120 Cluster of self-adhesive false eyelashes</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Material:</h4>
              <p>Premium synthetic fibers, Proprietary self-adhesive lash band</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Reusable:</h4>
              <p>Yes, for multiple uses (depending on care)</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Simple Application Process:</h4>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Lift - Gently remove the lash from its tray.</li>
                <li>Place - Position the adhesive band along your natural lash line.</li>
                <li>Press & Go! - Gently press to secure. You're done!</li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Features:</h4>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  <span className="font-semibold">Transparent & Flexible Band:</span> The innovative adhesive band is transparent and ultra-flexible, disappearing seamlessly onto your lash line for an undetectable finish.
                </li>
                <li>
                  <span className="font-semibold">Feather-light Comfort:</span> Once applied you'll barely feel you're wearing them offering all-day comfort without heaviness or irritation.
                </li>
                <li>
                  <span className="font-semibold">Reusable Wear:</span> With careful handling each pair can be reused multiple times, maintaining its adhesive power.
                </li>
              </ul>
            </div>

            {/* Promotional Section */}
            <div className="mt-6 bg-gradient-to-r from-purple-400 to-pink-400 text-white p-8 rounded-lg text-center">
              <div className="text-3xl font-bold mb-2">Natural Stereo</div>
              <div className="text-xl mb-4">Ingenuity To Polish The Details Of Beauty</div>
              <div className="text-sm opacity-90">Strong Stereoscopic Impression Of Eyelashes, Neat, Beautiful And Light Without Eye Pressure</div>
              <div className="mt-4 pt-4 border-t border-white/30 flex items-center justify-center gap-2 text-xs">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                <span>Eyelashes detail</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Ratings */}
        <div className="bg-white border border-gray-200 rounded-lg mt-6 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Product Ratings</h2>
          
          <div className="flex items-start gap-8 mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-shopee-orange mb-2">4.5</div>
              <div className="text-sm text-gray-600 mb-2">out of 5</div>
              <div className="flex items-center gap-1 justify-center">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={20} 
                    className={i < 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} 
                  />
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-2">(0 Ratings)</div>
            </div>
            
            <div className="flex-1">
              <div className="flex gap-2 mb-4 flex-wrap">
                <button className="px-4 py-2 border-2 border-shopee-orange bg-orange-50 text-shopee-orange rounded font-semibold text-sm">
                  All
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-600 rounded font-semibold text-sm hover:bg-gray-50">
                  5 Star (0)
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-600 rounded font-semibold text-sm hover:bg-gray-50">
                  4 Star (0)
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-600 rounded font-semibold text-sm hover:bg-gray-50">
                  3 Star (0)
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-600 rounded font-semibold text-sm hover:bg-gray-50">
                  2 Star (0)
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-600 rounded font-semibold text-sm hover:bg-gray-50">
                  1 Star (0)
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-600 rounded font-semibold text-sm hover:bg-gray-50">
                  With Comments (0)
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-600 rounded font-semibold text-sm hover:bg-gray-50">
                  With Media (0)
                </button>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          {false ? (
            <div className="space-y-6">
              {[].map((review: any) => (
                <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold">
                      {review.userName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-800">{review.userName}</span>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">{review.date}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{review.comment}</p>
                      {review.hasMedia && (
                        <div className="flex gap-2 mb-2">
                          <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200"></div>
                        </div>
                      )}
                      {review.helpful !== undefined && (
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <button className="hover:text-shopee-orange">Helpful ({review.helpful})</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-block mb-4">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="text-gray-300">
                  <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <circle cx="45" cy="50" r="3" fill="currentColor"/>
                  <circle cx="75" cy="50" r="3" fill="currentColor"/>
                  <path d="M 40 70 Q 60 80 80 70" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <circle cx="30" cy="30" r="2" fill="currentColor" opacity="0.5"/>
                  <circle cx="90" cy="30" r="2" fill="currentColor" opacity="0.5"/>
                  <circle cx="25" cy="60" r="2" fill="currentColor" opacity="0.5"/>
                  <circle cx="95" cy="60" r="2" fill="currentColor" opacity="0.5"/>
                  <circle cx="30" cy="90" r="2" fill="currentColor" opacity="0.5"/>
                  <circle cx="90" cy="90" r="2" fill="currentColor" opacity="0.5"/>
                  <path d="M 35 25 L 37 27 M 85 25 L 87 27 M 35 95 L 37 93 M 85 95 L 87 93" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
                </svg>
              </div>
              <p className="text-gray-500 text-lg">No ratings yet</p>
            </div>
          )}
        </div>

        {/* YOU MAY ALSO LIKE Section */}
        <div className="bg-white border border-gray-200 rounded-lg mt-6 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6">YOU MAY ALSO LIKE</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              {
                id: 13,
                name: 'Cluster Self-Adhesive... Bermazzi 100-120 Cluster Self-...',
                price: 24,
                originalPrice: 80,
                discount: 70,
                rating: 4.9,
                sold: 10000,
                hasVideo: true,
                badges: [],
                showShipping: false,
              },
              {
                id: 14,
                name: 'Preferred KOREMAZ Eyelash Extensions...',
                price: 39,
                originalPrice: 230,
                discount: 83,
                rating: 4.9,
                sold: 10000,
                hasVideo: true,
                badges: ['Preferred'],
                showShipping: false,
              },
              {
                id: 15,
                name: 'BABELASH 100-160 Cluster Self-...',
                price: 39,
                originalPrice: 300,
                discount: 87,
                rating: 5.0,
                sold: 10000,
                hasVideo: true,
                badges: [],
                showShipping: true,
              },
              {
                id: 16,
                name: 'Complete Eyelash... Prefered [Gift Tweezer] 24 Rows...',
                price: 116,
                originalPrice: 270,
                discount: 57,
                rating: 4.8,
                sold: 786,
                hasVideo: true,
                badges: [],
                showShipping: false,
              },
              {
                id: 17,
                name: 'Preferred 288 Cluster False Eyelashes wit...',
                price: 26,
                originalPrice: 60,
                discount: 57,
                rating: 4.8,
                sold: 2000,
                hasVideo: true,
                badges: ['Preferred'],
                showShipping: true,
              },
              {
                id: 18,
                name: '[No Need Glue!] BABELASH 100-16...',
                price: 39,
                originalPrice: 300,
                discount: 87,
                rating: 4.9,
                sold: 10000,
                hasVideo: true,
                badges: [],
                showShipping: true,
              },
              {
                id: 19,
                name: 'False Eyelashes... Preferred Glue-Free False Eyelashes, 10...',
                price: 38,
                originalPrice: 49,
                discount: 22,
                rating: 4.7,
                sold: 10000,
                hasVideo: true,
                badges: ['Preferred'],
                showShipping: false,
              },
              {
                id: 20,
                name: 'Preferred 120 Cluster BQI No Glue Neede...',
                price: 134,
                originalPrice: 200,
                discount: 33,
                rating: 4.9,
                sold: 10000,
                hasVideo: true,
                badges: ['Preferred'],
                showShipping: true,
              },
              {
                id: 21,
                name: '[COD Free Tweezers] BQI 12...',
                price: 24,
                originalPrice: 80,
                discount: 70,
                rating: 4.8,
                sold: 2000,
                hasVideo: true,
                badges: ['COD'],
                showShipping: false,
              },
              {
                id: 22,
                name: 'Complete Set... [Gift Glue Tweezers]...',
                price: 29,
                originalPrice: 100,
                discount: 71,
                rating: 4.8,
                sold: 4000,
                hasVideo: true,
                badges: [],
                showShipping: true,
              },
              {
                id: 23,
                name: 'BABALASH Segmented False...',
                price: 39,
                originalPrice: 100,
                discount: 61,
                rating: 4.9,
                sold: 10000,
                hasVideo: true,
                badges: [],
                showShipping: true,
              },
              {
                id: 24,
                name: 'Prefemed [Gift Tweezer] 24 Rows...',
                price: 29,
                originalPrice: 58,
                discount: 50,
                rating: 4.7,
                sold: 410,
                hasVideo: true,
                badges: ['Preferred'],
                showShipping: true,
              },
            ].map((item) => (
              <Link
                key={item.id}
                to={`/product/${item.id}`}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow group flex flex-col"
              >
                {/* Product Image */}
                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <span className="text-5xl opacity-50">👁️</span>
                  </div>
                  
                  {/* Discount Badge */}
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    -{item.discount}%
                  </div>
                  
                  {/* Video Play Icon */}
                  {item.hasVideo && (
                    <div className="absolute bottom-2 left-2 bg-black/60 rounded-full p-1.5">
                      <Play size={14} className="text-white" fill="white" />
                    </div>
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {item.badges.includes('Preferred') && (
                      <span className="bg-yellow-400 text-yellow-900 text-[10px] font-semibold px-1.5 py-0.5 rounded">Preferred</span>
                    )}
                    {item.badges.includes('COD') && (
                      <span className="bg-blue-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">COD</span>
                    )}
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-2 flex-1 flex flex-col">
                  {/* Product Title */}
                  <div className="text-[11px] text-gray-800 line-clamp-2 mb-1.5 min-h-[2.5rem]">
                    {item.name}
                  </div>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-0.5 mb-1">
                    {[...Array(5)].map((_, i) => {
                      const isFull = i < Math.floor(item.rating);
                      const isHalf = !isFull && i < item.rating;
                      
                      if (isHalf) {
                        return (
                          <div key={i} className="relative inline-block">
                            <Star size={10} className="text-gray-300" />
                            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                              <Star size={10} className="text-yellow-400 fill-yellow-400" />
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <Star
                          key={i}
                          size={10}
                          className={isFull ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                        />
                      );
                    })}
                    <span className="text-[10px] text-gray-600 ml-1">{item.rating}</span>
                  </div>
                  
                  {/* Price */}
                  <div className="mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-shopee-orange font-bold text-sm">₱{item.price}</span>
                      <span className="text-gray-400 text-[10px] line-through">₱{item.originalPrice}</span>
                    </div>
                  </div>
                  
                  {/* Sold Count */}
                  <div className="text-[10px] text-gray-500 mb-1">
                    {item.sold >= 10000 ? '10K++++' : item.sold}+ sold
                  </div>
                  
                  {/* Shipping Badge */}
                  {item.showShipping && (
                    <div className="text-[10px] text-shopee-orange font-semibold mt-auto">
                      Feat Shipping
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* See More Button */}
        <div className="flex justify-center mt-6">
          <button className="px-8 py-2 bg-gray-200 text-gray-700 rounded font-medium hover:bg-gray-300 transition-colors">
            See More
          </button>
        </div>

        {/* Orange Divider */}
        <div className="mt-6 border-t-2 border-shopee-orange"></div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg mt-6 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6">Related Products</h2>
            
            <div className="space-y-3">
              {relatedProducts.map((product, index) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-gray-500 text-sm font-medium w-6">{index + 1}.</span>
                    <span className="text-gray-800 text-sm flex-1">{product.name}</span>
                  </div>
                  <span className="text-shopee-orange font-semibold text-sm ml-4">₱{product.price.toLocaleString()}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Other Products You Might Like Section */}
        <div className="bg-white border border-gray-200 rounded-lg mt-6 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Other Products You Might Like</h2>
          
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
            <span className="hover:text-shopee-orange cursor-pointer transition-colors">lip tint</span>
            <span className="text-gray-300">|</span>
            <span className="hover:text-shopee-orange cursor-pointer transition-colors">penshoppe cologne</span>
            <span className="text-gray-300">|</span>
            <span className="hover:text-shopee-orange cursor-pointer transition-colors">maybelline primer</span>
            <span className="text-gray-300">|</span>
            <span className="hover:text-shopee-orange cursor-pointer transition-colors">sexy man paris perfume</span>
            <span className="text-gray-300">|</span>
            <span className="hover:text-shopee-orange cursor-pointer transition-colors">otwoo</span>
            <span className="text-gray-300">|</span>
            <span className="hover:text-shopee-orange cursor-pointer transition-colors">bb loose powder</span>
            <span className="text-gray-300">|</span>
            <span className="hover:text-shopee-orange cursor-pointer transition-colors">vt cosmetics pdrn reedle shot hair ampoule</span>
            <span className="text-gray-300">|</span>
            <span className="hover:text-shopee-orange cursor-pointer transition-colors">dream cloud perfume</span>
            <span className="text-gray-300">|</span>
            <span className="hover:text-shopee-orange cursor-pointer transition-colors">vt cosmetics reedle shot mask</span>
            <span className="text-gray-300">|</span>
            <span className="hover:text-shopee-orange cursor-pointer transition-colors">perfume refill</span>
            <span className="text-gray-300">|</span>
            <span className="hover:text-shopee-orange cursor-pointer transition-colors">aficionado perfume</span>
            <span className="text-gray-300">|</span>
            <span className="hover:text-shopee-orange cursor-pointer transition-colors">benetton perfume</span>
            <span className="text-gray-300">|</span>
            <span className="hover:text-shopee-orange cursor-pointer transition-colors">3ce</span>
            <span className="text-gray-300">|</span>
            <span className="hover:text-shopee-orange cursor-pointer transition-colors">collagen neutroskin</span>
            <span className="text-gray-300">|</span>
            <span className="hover:text-shopee-orange cursor-pointer transition-colors">ascof lagundi capsule</span>
          </div>
        </div>
      </div>

      <BuyerFooter />
    </div>
  );
};

export default BuyerProductDetail;
