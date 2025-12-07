import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import BuyerNavbar from './components/BuyerNavbar';
import HeroBanner from './components/HeroBanner';
import FeatureIcons from './components/FeatureIcons';
import CategoryCard from './components/CategoryCard';
import apiClient from '../../services/api';

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

interface Category {
  id: number;
  name: string;
  image: string;
}

const categories: Category[] = [
  { id: 1, name: "Men's Apparel", image: '👔' },
  { id: 2, name: "Mobiles & Gadgets", image: '📱' },
  { id: 3, name: 'Mobiles Accessories', image: '🎧' },
  { id: 4, name: 'Home Entertainment', image: '📺' },
  { id: 5, name: 'Babies & Kids', image: '🍼' },
  { id: 6, name: 'Home & Living', image: '🏠' },
  { id: 7, name: 'Groceries', image: '🛒' },
  { id: 8, name: 'Toys, Games & Collectibles', image: '🎮' },
  { id: 9, name: "Women's Apparel", image: '👗' },
  { id: 10, name: 'Health & Personal Care', image: '💄' },
  { id: 11, name: 'Makeup & Fragrances', image: '💅' },
  { id: 12, name: 'Home Appliances', image: '🔌' },
  { id: 13, name: 'Laptops & Computers', image: '💻' },
  { id: 14, name: 'Cameras', image: '📷' },
  { id: 15, name: 'Sports & Travel', image: '⚽' },
  { id: 16, name: "Men's Bags & Accessories", image: '👜' },
  { id: 17, name: "Men's Shoes", image: '👞' },
  { id: 18, name: 'Motors', image: '🏍️' },
];

interface ApiProduct {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  shopName?: string;
  category?: string | null;
  stock?: number;
  description?: string | null;
}

interface DisplayProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  sold: number;
  image: string;
  shopName: string;
  badges: string[];
  hasVideo: boolean;
}

const BuyerLandingPage: React.FC = () => {
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const apiProducts: ApiProduct[] = await apiClient.getProducts();
        
        // Transform API products to match the original design structure
        const transformedProducts: DisplayProduct[] = apiProducts.map((product, index) => {
          // Calculate discount (random 10-50% for demo, or based on cost if available)
          const discount = Math.floor(Math.random() * 40) + 10;
          const originalPrice = Math.round(product.price * (1 + discount / 100));
          
          // Generate sold count (random for demo, or use actual sales data if available)
          const sold = Math.floor(Math.random() * 5000) + 100;
          
          // Determine badges based on product properties
          const badges: string[] = [];
          if (product.stock && product.stock > 50) {
            badges.push('Preferred');
          }
          if (Math.random() > 0.7) {
            badges.push('COD');
          }
          if (Math.random() > 0.8) {
            badges.push('SPayLater');
          }
          
          // Use imageUrl if available, otherwise use emoji fallback
          const image = product.imageUrl || '📦';
          
          return {
            id: product.id,
            name: product.name,
            price: product.price,
            originalPrice,
            discount,
            sold,
            image,
            shopName: product.shopName || 'Shop',
            badges,
            hasVideo: Math.random() > 0.9, // 10% chance of having video
          };
        });
        
        setProducts(transformedProducts);
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Failed to load products');
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <BuyerNavbar />

      {/* Hero Banner Section */}
      <HeroBanner />

      {/* Feature Icons */}
      <FeatureIcons />

      {/* Categories Section */}
      <div className="bg-white mt-3 py-6">
        <div className="max-w-[1200px] mx-auto px-5">
          {/* Section Header */}
          <div className="mb-5">
            <h2 className="text-base font-normal text-gray-500 uppercase tracking-wider">CATEGORIES</h2>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2">
            {categories.map((category) => (
              <CategoryCard key={category.id} name={category.name} image={category.image} />
            ))}
          </div>
        </div>
      </div>

      {/* Flash Sale Section */}
      <div className="bg-white mt-3 py-6">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-base font-normal text-gray-500 uppercase tracking-wider">FLASH SALE</h2>
              <div className="flex gap-1 items-center">
                <div className="bg-black text-white px-1.5 py-0.5 text-xs font-semibold">
                  02
                </div>
                <span className="font-semibold text-sm">:</span>
                <div className="bg-black text-white px-1.5 py-0.5 text-xs font-semibold">
                  45
                </div>
                <span className="font-semibold text-sm">:</span>
                <div className="bg-black text-white px-1.5 py-0.5 text-xs font-semibold">
                  33
                </div>
              </div>
            </div>
            <a href="#" className="text-shopee-orange hover:text-shopee-orange-dark text-sm">
              See All
            </a>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="bg-white border border-gray-200 hover:border-shopee-orange transition-all cursor-pointer group"
              >
                <div className="aspect-square bg-gray-50 flex items-center justify-center relative overflow-hidden">
                  <span className="text-gray-300 text-4xl">🎁</span>
                  <div className="absolute top-0 right-0 bg-yellow-400 text-xs font-bold px-2 py-0.5 text-red-600">
                    50% OFF
                  </div>
                </div>
                <div className="p-2">
                  <div className="text-shopee-orange text-lg font-medium">₱499</div>
                  <div className="bg-shopee-orange h-1 w-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-shopee-orange-dark" style={{width: '40%'}}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Discover Section */}
      <div className="bg-white mt-3 py-6" id="about-section">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="mb-5 text-center sticky top-[120px] bg-white z-40 py-4 -mt-3">
            <h2 className="text-base font-normal text-gray-500 uppercase tracking-wider">DAILY DISCOVER</h2>
            <div className="h-1 bg-shopee-orange w-full mt-3"></div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-shopee-orange"></div>
              <p className="mt-4 text-gray-500">Loading products...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 text-shopee-orange hover:text-shopee-orange-dark"
              >
                Retry
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No products available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {products.map((product) => (
                <Link
                  to={`/product/${product.id}`}
                  key={product.id}
                  className="bg-white border border-gray-200 hover:border-shopee-orange transition-all cursor-pointer group flex flex-col"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    {product.image && (product.image.startsWith('http') || product.image.startsWith('/') || product.image.startsWith('data:')) ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback to emoji if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.image-fallback')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'image-fallback w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200';
                            fallback.innerHTML = '<span class="text-5xl opacity-50">📦</span>';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <span className="text-5xl opacity-50">{product.image || '📦'}</span>
                      </div>
                    )}
                    
                    {/* Discount Badge */}
                    {product.discount && product.discount > 0 && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded z-10">
                        -{product.discount}%
                      </div>
                    )}
                    
                    {/* Video Play Icon */}
                    {product.hasVideo && (
                      <div className="absolute bottom-2 left-2 bg-black/60 rounded-full p-1.5 z-10">
                        <Play size={14} className="text-white" fill="white" />
                      </div>
                    )}
                    
                    {/* Badges */}
                    {product.badges && product.badges.length > 0 && (
                      <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                        {product.badges.includes('Preferred') && (
                          <span className="bg-yellow-400 text-yellow-900 text-[10px] font-semibold px-1.5 py-0.5 rounded">Preferred</span>
                        )}
                        {product.badges.includes('COD') && (
                          <span className="bg-blue-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">COD</span>
                        )}
                        {product.badges.includes('SPayLater') && (
                          <span className="bg-purple-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">SPayLater</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-2 flex-1 flex flex-col">
                    <div className="text-shopee-orange text-lg font-medium mb-1">
                      ₱{product.price.toLocaleString()}
                    </div>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-gray-400 text-[10px] line-through">₱{product.originalPrice.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="text-xs text-gray-600 line-clamp-2 flex-1 mb-1">
                      {product.name}
                    </div>
                    {/* Sold Count */}
                    <div className="text-xs text-gray-400 mt-auto">
                      {product.sold >= 10000 ? '10K++++' : product.sold}+ sold
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* See More Button */}
          <div className="mt-8 text-center">
            <button className="bg-gray-200 text-gray-700 px-12 py-3 hover:bg-gray-300 transition-colors text-sm rounded">
              See More
            </button>
            <div className="h-1 bg-shopee-orange w-full mt-8"></div>
          </div>
        </div>
      </div>

      {/* About Shopee Section */}
      <div className="bg-white mt-3 py-8">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="prose max-w-none text-sm text-gray-600 leading-relaxed space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Buy and Sell Online on Shopee Philippines</h2>
            
            <p>
              Shopee is a fun, free, and trusted way to buy and sell instantly online. We are a leading mobile-first marketplace platform in Southeast Asia Singapore, Malaysia, Thailand, Indonesia, Vietnam, the Philippines, Taiwan, Brazil, Mexico, Colombia, and Chile. Join millions of others on Shopee to list products and shop for deals online. Doing your Shopee online shopping is safe and we make sure of it. Get the item you ordered or get your money back with Shopee Guarantee. Create and browse listings for free, at no extra charge. Join our Shopee community and start shopping today!
            </p>

            <p>
              Shopee Philippines is dedicated to bringing the best Shopee online shopping experience to every Filipino household. Known for the numerous campaigns all year round, the company aims to make shopping a fun and memorable experience for all. From free shipping specials to discount vouchers, Shopee Philippines never fails to impress loyal fans and new shopping enthusiasts. Download the Shopee app now and visit the Shopee website too!
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-4">Experience a Shopping Spree of a Lifetime on Shopee</h3>
            
            <p>
              Join Shopee to find everything you need at the best prices. Doing your Shopee online shopping at the Philippines' best marketplace cannot get any easier. Shopee is a social marketplace where you can enjoy instant and personalized updates from your friends and favorite community members. If you spot great products or deals while you're doing your Shopee online shopping, Shopee enables you to share these deals with your friends via a simple tap.
            </p>

            <p>
              Buy the products you want in a worry-free manner. Refer to shop ratings and reviews to find trusted sellers easily. We value our safe online marketplace! With Shopee Guarantee, you can get your money back if you did not get what you ordered. Take note of your Shopee Guarantee period so that you can choose to extend it if the seller has not shipped your product or if you want to request a return or refund. Shopee Guarantee is here to ensure that you have a fun shopping experience. You can rest easy knowing that Shopee Guarantee has your back!
            </p>

            <p>
              Not sure what to buy? Our new hashtags allow you to stay up-to-date with trending products. Browse effortlessly through our product categories including jewelry from women's accessories like necklaces that are perfect gifts for moms. Mobiles for your dad that you can find in mobiles and gadgets. Get fan-favorite mobile phones like Poco F3, Poco X3 Pro, Redmi Note 11, and Realme C35. Then amp up the music in your phone with volume master! Look for the best stroller for your newborn, and surprise the kids with new toys, games & collectibles. Buy your sister the most volumizing or lengthening mascara or hair tie. You can never go wrong with buying a cap for your brother. Purchase flowers and plants that your aunt and uncle or grandparents will surely love! Start your fitness journey with exercise and fitness equipment and get health and personal care items too like Gloxi and more! Show love to your little pet by giving it the best pet essentials from Shopee's wide array of pet care items and many more! Spruce up your home with products inspired by Ikea Philippines and other amazing home and living brands. Find trending Youtube products on Shopee Philippines too!
            </p>

            <p>
              Eager to find out what's trending? Shopee has all the latest trending products, including Piso Wifi which is all the rage nowadays! Find out what the buzz is all about and discover the wonders of Piso Wifi. While shopping, use our smart search or look through a range of personalized recommendations to find the perfect buy. Plus, enjoy additional benefits such as free shipping for selected products. Start shopping on Shopee now!
            </p>

            <p>
              So what are you waiting for? Open your Shopee app or visit the Shopee website and get on with your shopping!
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-4">Enjoy Special Deals, Sales, Promos, and Discounts on Shopee Philippines</h3>
            
            <p>
              Doing your Shopee online shopping is not only easy and safe, but it's also tons of fun. Enjoy big sales like the 9.9 Super Shopping Day, 10.10 Brands Festival Sale, 11.11 Christmas Sale and the 12.12 Mega Pamasko Sale to score the biggest and best discounts and special prices on your favorite products. Treat yourself during payday with Shopee's Payday Sale on the 15th and 30th of every month. With special promotions from shops such as Shopee's free shipping vouchers, deals, and flash sales, to weekly offers - you're sure to become a true Shopeeholic. Catch the Shopee fever with regular deals on your favorite categories only on Shopee Philippines! Download the app on your mobile phone now. If you're new to the Shopee fam, you get the chance to enjoy Shopee New User vouchers too! Shopee New User vouchers are the perfect way to welcome you into your favorite shopping destination.
            </p>

            <p>
              This is your sign to create a Shopee account and start shopping on the Shopee website or Shopee app! Don't miss out on the amazing sales with affordable prices that are waiting for you!
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-4">Get Free Shipping on Shopee</h3>
            
            <p>
              Aside from Shopee New User vouchers, you can also enjoy Shopee's free shipping vouchers today! For buyers, shop to your heart's content and enjoy lower prices for your purchases with the help of Shopee's free shipping vouchers. Make sure to keep an eye out for Shopee's free shipping vouchers so you can say goodbye to added delivery fees! You don't have to worry about the price going up because of shipping. Selling can't get any easier on Shopee.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-4">Select Your Payment Method of Choice on Shopee</h3>
            
            <p>
              Banks, e-wallets, ShopeePay - the choice is all up to you! If you have a preferred payment method, rest assured that it's available on Shopee! Upon checking out your products, all you have to do is select a payment method that is most convenient for you. Whether you're on the Shopee app or the Shopee website, you can find a wide array of payment methods. Give ShopeePay a try! Activate your ShopeePay account now so that you can top up your wallet and pay. On top of that, you can enjoy exclusive ShopeePay vouchers including Shopee's free shipping vouchers with ShopeePay! If it's your first time placing an order, make sure to maximize your Shopee New User vouchers upon checkout!
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-4">Join in on the Fun with Shopee Prizes</h3>
            
            <p>
              To bring you even more entertainment, don't miss out on Shopee Prizes! Play your favorite games on the Shopee app like Shopee Bubble and Shopee Candy to win mind-blowing prizes. To give you a hand, discover a few tips, tricks, and hacks when playing Shopee's most popular games! Take note that you can only play these games on the Shopee app, not the Shopee website.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-4">Sell Online Effortlessly on Shopee</h3>
            
            <p>
              Shopee provides the right tools to support all our sellers on our marketplace platform. List your products in less than 30 seconds! Sell better and get more exposure for your products by participating in our campaigns and promotions. Use Shopee Seller Centre to organize your products, track orders, manage customers, and measure shop performance. Share your products easily on social media platforms, including Facebook, Twitter, and Instagram. You can even build up your online reputation by gathering positive ratings and reviews from your buyers. Shopee is completely free to download, so join us and start selling today!
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-4">Visit Shopee Blog</h3>
            
            <p>
              Want to know more about the latest must-have products, popular trends, tips and tricks on various topics, and even gift guides for special occasions? Proceed to Shopee Blog where you can find a ton of articles on Fashion and Beauty, Food, Parenting, Lifestyle, Tech, Shopee News, and Shopping! Stay on top of the latest trends and tune in on what's coming up on Shopee with Shopee Blog! From Shopee News like the latest Shopee New User vouchers to the most popular trend on social media like TikTok, we've got you covered!
            </p>
          </div>
        </div>
      </div>

      {/* Trending Pages Section */}
      <div className="bg-white mt-3 py-8 border-t border-gray-200">
        <div className="max-w-[1200px] mx-auto px-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Trending Pages</h3>
          <div className="text-xs text-gray-600 leading-relaxed">
            <a href="#" className="text-shopee-orange hover:underline">something soft gift ideas worth 50 pesos</a> | <a href="#" className="hover:text-shopee-orange">rtx 4060</a> | <a href="#" className="hover:text-shopee-orange">saladmaster</a> | <a href="#" className="hover:text-shopee-orange">calendar advent</a> | <a href="#" className="hover:text-shopee-orange">anko</a> | <a href="#" className="hover:text-shopee-orange">dtf printer</a> | <a href="#" className="hover:text-shopee-orange">posee</a> | <a href="#" className="hover:text-shopee-orange">uniqlo</a> | <a href="#" className="hover:text-shopee-orange">unisex gift ideas</a> | <a href="#" className="hover:text-shopee-orange">toys girls</a> | <a href="#" className="hover:text-shopee-orange">filipiniana modern</a> | <a href="#" className="hover:text-shopee-orange">80s outfit men</a> | <a href="#" className="hover:text-shopee-orange">sofa cover</a> | <a href="#" className="hover:text-shopee-orange">radeon rx 580</a> | <a href="#" className="hover:text-shopee-orange">butterfly knife</a> | <a href="#" className="hover:text-shopee-orange">sofa bed</a> | <a href="#" className="hover:text-shopee-orange">koorui monitor</a> | <a href="#" className="hover:text-shopee-orange">pickleball paddle</a> | <a href="#" className="hover:text-shopee-orange">floor lamp</a> | <a href="#" className="hover:text-shopee-orange">parisian</a> | <a href="#" className="hover:text-shopee-orange">christy-ng willow chain baguette - tan</a> | <a href="#" className="hover:text-shopee-orange">christy-ng malia shoulder bag - deep maroon</a> | <a href="#" className="hover:text-shopee-orange">christy-ng barcelona mini tote bag - stone blue</a> | <a href="#" className="hover:text-shopee-orange">christy-ng hannah bucket bag - olive</a> | <a href="#" className="hover:text-shopee-orange">Her Hyness Philippines</a> | <a href="#" className="hover:text-shopee-orange">PinkflashCosmeticsPH</a> | <a href="#" className="hover:text-shopee-orange">Dear Face Main</a> | <a href="#" className="hover:text-shopee-orange">xiaomi mi max 16gb</a> | <a href="#" className="hover:text-shopee-orange">Langsdom Philippines</a> | <a href="#" className="hover:text-shopee-orange">christy-ng rae tote bag - nude</a>
          </div>
        </div>
      </div>

      {/* Categories Footer Section */}
      <div className="bg-white mt-3 py-8 border-t border-gray-200">
        <div className="max-w-[1200px] mx-auto px-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-6">Categories</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-6 text-xs">
            {/* Men's Apparel */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">MEN'S APPAREL</h4>
              <div className="text-gray-600 leading-relaxed">
                <a href="#" className="hover:text-shopee-orange">Tops</a> | <a href="#" className="hover:text-shopee-orange">Shorts</a> | <a href="#" className="hover:text-shopee-orange">Pants</a> | <a href="#" className="hover:text-shopee-orange">Jeans</a> | <a href="#" className="hover:text-shopee-orange">Underwear</a> | <a href="#" className="hover:text-shopee-orange">Socks</a> | <a href="#" className="hover:text-shopee-orange">Hoodies & Sweatshirts</a> | <a href="#" className="hover:text-shopee-orange">Jackets & Sweaters</a> | <a href="#" className="hover:text-shopee-orange">Sleepwear</a> | <a href="#" className="hover:text-shopee-orange">Suits</a> | <a href="#" className="hover:text-shopee-orange">Sets</a> | <a href="#" className="hover:text-shopee-orange">Occupational Attire</a> | <a href="#" className="hover:text-shopee-orange">Traditional Wear</a> | <a href="#" className="hover:text-shopee-orange">Costumes</a> | <a href="#" className="hover:text-shopee-orange">Others</a>
              </div>
            </div>

            {/* Makeup & Fragrances */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">MAKEUP & FRAGRANCES</h4>
              <div className="text-gray-600 leading-relaxed">
                <a href="#" className="hover:text-shopee-orange">Palettes & Makeup Sets</a> | <a href="#" className="hover:text-shopee-orange">Tools & Accessories</a> | <a href="#" className="hover:text-shopee-orange">Nails</a> | <a href="#" className="hover:text-shopee-orange">Fragrances</a> | <a href="#" className="hover:text-shopee-orange">Face Makeup</a> | <a href="#" className="hover:text-shopee-orange">Lip Makeup</a> | <a href="#" className="hover:text-shopee-orange">Eye Makeup</a> | <a href="#" className="hover:text-shopee-orange">Others</a>
              </div>
            </div>

            {/* Home & Living */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">HOME & LIVING</h4>
              <div className="text-gray-600 leading-relaxed">
                <a href="#" className="hover:text-shopee-orange">Hand Warmers, Hot Water Bags & Ice Bags</a> | <a href="#" className="hover:text-shopee-orange">Home Maintenance</a> | <a href="#" className="hover:text-shopee-orange">Furniture</a> | <a href="#" className="hover:text-shopee-orange">Lighting</a> | <a href="#" className="hover:text-shopee-orange">Party Supplies</a> | <a href="#" className="hover:text-shopee-orange">Beddings</a> | <a href="#" className="hover:text-shopee-orange">Bath</a> | <a href="#" className="hover:text-shopee-orange">Glassware & Drinkware</a> | <a href="#" className="hover:text-shopee-orange">Dinnerware</a> | <a href="#" className="hover:text-shopee-orange">Bakeware</a> | <a href="#" className="hover:text-shopee-orange">Kitchenware</a> | <a href="#" className="hover:text-shopee-orange">Sinkware</a> | <a href="#" className="hover:text-shopee-orange">Power Tools</a> | <a href="#" className="hover:text-shopee-orange">Home Improvement</a> | <a href="#" className="hover:text-shopee-orange">Storage & Organization</a> | <a href="#" className="hover:text-shopee-orange">Home Decor</a> | <a href="#" className="hover:text-shopee-orange">Garden Decor</a> | <a href="#" className="hover:text-shopee-orange">Outdoor & Garden</a> | <a href="#" className="hover:text-shopee-orange">Others</a>
              </div>
            </div>

            {/* Men's Bags & Accessories */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">MEN'S BAGS & ACCESSORIES</h4>
              <div className="text-gray-600 leading-relaxed">
                <a href="#" className="hover:text-shopee-orange">Hats & Caps</a> | <a href="#" className="hover:text-shopee-orange">Wallets</a> | <a href="#" className="hover:text-shopee-orange">Eyewear</a> | <a href="#" className="hover:text-shopee-orange">Accessories</a> | <a href="#" className="hover:text-shopee-orange">Jewelry</a> | <a href="#" className="hover:text-shopee-orange">Watches</a> | <a href="#" className="hover:text-shopee-orange">Men's Bags</a> | <a href="#" className="hover:text-shopee-orange">Accessories Sets & Packages</a>
              </div>
            </div>

            {/* Women's Shoes */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">WOMEN'S SHOES</h4>
              <div className="text-gray-600 leading-relaxed">
                <a href="#" className="hover:text-shopee-orange">Flats</a> | <a href="#" className="hover:text-shopee-orange">Heels</a> | <a href="#" className="hover:text-shopee-orange">Flip Flops</a> | <a href="#" className="hover:text-shopee-orange">Sneakers</a> | <a href="#" className="hover:text-shopee-orange">Wedges & Platforms</a> | <a href="#" className="hover:text-shopee-orange">Boots</a> | <a href="#" className="hover:text-shopee-orange">Shoe Care & Accessories</a> | <a href="#" className="hover:text-shopee-orange">Others</a>
              </div>
            </div>

            {/* Women's Apparel */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">WOMEN'S APPAREL</h4>
              <div className="text-gray-600 leading-relaxed">
                <a href="#" className="hover:text-shopee-orange">Dresses</a> | <a href="#" className="hover:text-shopee-orange">Tops</a> | <a href="#" className="hover:text-shopee-orange">Tees</a> | <a href="#" className="hover:text-shopee-orange">Shorts</a> | <a href="#" className="hover:text-shopee-orange">Pants</a> | <a href="#" className="hover:text-shopee-orange">Jeans</a> | <a href="#" className="hover:text-shopee-orange">Skirts</a> | <a href="#" className="hover:text-shopee-orange">Jumpsuits & Rompers</a> | <a href="#" className="hover:text-shopee-orange">Lingerie & Nightwear</a> | <a href="#" className="hover:text-shopee-orange">Sets</a> | <a href="#" className="hover:text-shopee-orange">Swimsuit</a> | <a href="#" className="hover:text-shopee-orange">Jackets & Outerwear</a> | <a href="#" className="hover:text-shopee-orange">Plus Size</a> | <a href="#" className="hover:text-shopee-orange">Sweater & Cardigans</a> | <a href="#" className="hover:text-shopee-orange">Maternity Wear</a> | <a href="#" className="hover:text-shopee-orange">Socks & Stockings</a> | <a href="#" className="hover:text-shopee-orange">Costumes</a> | <a href="#" className="hover:text-shopee-orange">Traditional Wear</a> | <a href="#" className="hover:text-shopee-orange">Fabric</a>
              </div>
            </div>

            {/* Home Entertainment */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">HOME ENTERTAINMENT</h4>
              <div className="text-gray-600 leading-relaxed">
                <a href="#" className="hover:text-shopee-orange">Projectors</a> | <a href="#" className="hover:text-shopee-orange">TV Accessories</a> | <a href="#" className="hover:text-shopee-orange">Television</a> | <a href="#" className="hover:text-shopee-orange">Others</a>
              </div>
            </div>

            {/* Cameras */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">CAMERAS</h4>
              <div className="text-gray-600 leading-relaxed">
                <a href="#" className="hover:text-shopee-orange">Car / Dash Camera</a> | <a href="#" className="hover:text-shopee-orange">Drones</a> | <a href="#" className="hover:text-shopee-orange">CCTV / IP Camera</a> | <a href="#" className="hover:text-shopee-orange">Action Camera</a> | <a href="#" className="hover:text-shopee-orange">Camera Accessories</a> | <a href="#" className="hover:text-shopee-orange">Digital Camera</a> | <a href="#" className="hover:text-shopee-orange">Others</a>
              </div>
            </div>

            {/* Women's Bags */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">WOMEN'S BAGS</h4>
              <div className="text-gray-600 leading-relaxed">
                <a href="#" className="hover:text-shopee-orange">Shoulder Bags</a> | <a href="#" className="hover:text-shopee-orange">Tote Bags</a> | <a href="#" className="hover:text-shopee-orange">Handbags</a> | <a href="#" className="hover:text-shopee-orange">Clutches</a> | <a href="#" className="hover:text-shopee-orange">Backpacks</a> | <a href="#" className="hover:text-shopee-orange">Drawstrings</a> | <a href="#" className="hover:text-shopee-orange">Accessories</a> | <a href="#" className="hover:text-shopee-orange">Others</a>
              </div>
            </div>

            {/* Hobbies & Stationery */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">HOBBIES & STATIONERY</h4>
              <div className="text-gray-600 leading-relaxed">
                <a href="#" className="hover:text-shopee-orange">E-Books</a> | <a href="#" className="hover:text-shopee-orange">Books and Magazines</a> | <a href="#" className="hover:text-shopee-orange">Paper Supplies</a> | <a href="#" className="hover:text-shopee-orange">Writing Materials</a> | <a href="#" className="hover:text-shopee-orange">Religious Artifacts</a> | <a href="#" className="hover:text-shopee-orange">Packaging & Wrapping</a> | <a href="#" className="hover:text-shopee-orange">Arts & Crafts</a> | <a href="#" className="hover:text-shopee-orange">School & Office Supplies</a> | <a href="#" className="hover:text-shopee-orange">Musical Instruments</a> | <a href="#" className="hover:text-shopee-orange">Others</a>
              </div>
            </div>

            {/* Home Appliances */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">HOME APPLIANCES</h4>
              <div className="text-gray-600 leading-relaxed">
                <a href="#" className="hover:text-shopee-orange">Small Household Appliances</a> | <a href="#" className="hover:text-shopee-orange">Home Appliance Parts & Accessories</a> | <a href="#" className="hover:text-shopee-orange">Large Appliances</a> | <a href="#" className="hover:text-shopee-orange">Vacuum Cleaners & Floor Care</a> | <a href="#" className="hover:text-shopee-orange">Humidifier & Air Purifier</a> | <a href="#" className="hover:text-shopee-orange">Cooling & Heating</a> | <a href="#" className="hover:text-shopee-orange">Specialty Appliances</a> | <a href="#" className="hover:text-shopee-orange">Small kitchen Appliances</a> | <a href="#" className="hover:text-shopee-orange">Garment Care</a> | <a href="#" className="hover:text-shopee-orange">Others</a>
              </div>
            </div>

            {/* Groceries */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">GROCERIES</h4>
              <div className="text-gray-600 leading-relaxed">
                <a href="#" className="hover:text-shopee-orange">Seasoning, Staple Foods & Baking Ingredients</a> | <a href="#" className="hover:text-shopee-orange">Gift Set & Hampers</a> | <a href="#" className="hover:text-shopee-orange">Dairy & Eggs</a> | <a href="#" className="hover:text-shopee-orange">Cigarettes</a> | <a href="#" className="hover:text-shopee-orange">Superfoods & Healthy Foods</a> | <a href="#" className="hover:text-shopee-orange">Breakfast Food</a> | <a href="#" className="hover:text-shopee-orange">Snack & Sweets</a> | <a href="#" className="hover:text-shopee-orange">Frozen & Fresh foods</a> | <a href="#" className="hover:text-shopee-orange">Alcoholic Beverages</a> | <a href="#" className="hover:text-shopee-orange">Laundry & Household Care</a> | <a href="#" className="hover:text-shopee-orange">Beverages</a> | <a href="#" className="hover:text-shopee-orange">Others</a>
              </div>
            </div>

            {/* Men's Shoes */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">MEN'S SHOES</h4>
              <div className="text-gray-600 leading-relaxed">
                <a href="#" className="hover:text-shopee-orange">Loafer & Boat Shoes</a> | <a href="#" className="hover:text-shopee-orange">Sneakers</a> | <a href="#" className="hover:text-shopee-orange">Sandals & Flip Flops</a> | <a href="#" className="hover:text-shopee-orange">Boots</a> | <a href="#" className="hover:text-shopee-orange">Formal</a> | <a href="#" className="hover:text-shopee-orange">Shoe Care & Accessories</a> | <a href="#" className="hover:text-shopee-orange">Others</a>
              </div>
            </div>

            {/* Pet Care */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">PET CARE</h4>
              <div className="text-gray-600 leading-relaxed">
                <a href="#" className="hover:text-shopee-orange">Toys & Accessories</a> | <a href="#" className="hover:text-shopee-orange">Litter & Toilet</a> | <a href="#" className="hover:text-shopee-orange">Pet Essentials</a> | <a href="#" className="hover:text-shopee-orange">Pet Clothing & Accessories</a> | <a href="#" className="hover:text-shopee-orange">Pet Grooming Supplies</a> | <a href="#" className="hover:text-shopee-orange">Pet Toys & Accessories</a> | <a href="#" className="hover:text-shopee-orange">Pet Food & Treats</a> | <a href="#" className="hover:text-shopee-orange">Others</a>
              </div>
            </div>

            {/* Babies & Kids */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">BABIES & KIDS</h4>
              <div className="text-gray-600 leading-relaxed">
                <a href="#" className="hover:text-shopee-orange">Baby Detergent</a> | <a href="#" className="hover:text-shopee-orange">Babies' Fashion</a> | <a href="#" className="hover:text-shopee-orange">Rain Gear</a> | <a href="#" className="hover:text-shopee-orange">Nursery</a> | <a href="#" className="hover:text-shopee-orange">Moms & Maternity</a> | <a href="#" className="hover:text-shopee-orange">Baby Gear</a> | <a href="#" className="hover:text-shopee-orange">Health & Safety</a> | <a href="#" className="hover:text-shopee-orange">Bath & Skin Care</a> | <a href="#" className="hover:text-shopee-orange">Boys' Fashion</a> | <a href="#" className="hover:text-shopee-orange">Girls' Fashion</a> | <a href="#" className="hover:text-shopee-orange">Feeding & Nursing</a> | <a href="#" className="hover:text-shopee-orange">Feeding</a> | <a href="#" className="hover:text-shopee-orange">Diapers & Wipes</a> | <a href="#" className="hover:text-shopee-orange">Others</a>
              </div>
            </div>

            {/* Health & Personal Care */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">HEALTH & PERSONAL CARE</h4>
              <div className="text-gray-600 leading-relaxed">
                <a href="#" className="hover:text-shopee-orange">Sexual Wellness</a> | <a href="#" className="hover:text-shopee-orange">Medical Supplies</a> | <a href="#" className="hover:text-shopee-orange">Men's Grooming</a> | <a href="#" className="hover:text-shopee-orange">Health Supplements</a> | <a href="#" className="hover:text-shopee-orange">Slimming</a> | <a href="#" className="hover:text-shopee-orange">Suncare</a> | <a href="#" className="hover:text-shopee-orange">Whitening</a> | <a href="#" className="hover:text-shopee-orange">Personal Care</a> | <a href="#" className="hover:text-shopee-orange">Bath & Body</a> | <a href="#" className="hover:text-shopee-orange">Hair Care</a> | <a href="#" className="hover:text-shopee-orange">Skin Care</a> | <a href="#" className="hover:text-shopee-orange">Others</a>
              </div>
            </div>

            {/* Sports & Travel */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">SPORTS & TRAVEL</h4>
              <div className="text-gray-600 leading-relaxed">
                <a href="#" className="hover:text-shopee-orange">Travel Bags</a> | <a href="#" className="hover:text-shopee-orange">Travel Accessories</a> | <a href="#" className="hover:text-shopee-orange">Travel Organizer</a> | <a href="#" className="hover:text-shopee-orange">Kid's Activewear</a> | <a href="#" className="hover:text-shopee-orange">Boxing & MMA</a> | <a href="#" className="hover:text-shopee-orange">Weather Protection</a> | <a href="#" className="hover:text-shopee-orange">WinterSports Gear</a> | <a href="#" className="hover:text-shopee-orange">Outdoor Recreation</a> | <a href="#" className="hover:text-shopee-orange">Leisure Sports & Game Room</a> | <a href="#" className="hover:text-shopee-orange">Golf</a> | <a href="#" className="hover:text-shopee-orange">Racket Sports</a> | <a href="#" className="hover:text-shopee-orange">Sports Bags</a> | <a href="#" className="hover:text-shopee-orange">Women's Activewear</a> | <a href="#" className="hover:text-shopee-orange">Men's Activewear</a> | <a href="#" className="hover:text-shopee-orange">Cycling, Skates & Scooters</a> | <a href="#" className="hover:text-shopee-orange">Team Sports</a> | <a href="#" className="hover:text-shopee-orange">Water Sports</a> | <a href="#" className="hover:text-shopee-orange">Camping & Hiking</a> | <a href="#" className="hover:text-shopee-orange">Weightlifting</a> | <a href="#" className="hover:text-shopee-orange">Fitness Accessory</a> | <a href="#" className="hover:text-shopee-orange">Yoga</a> | <a href="#" className="hover:text-shopee-orange">Exercise & Fitness</a> | <a href="#" className="hover:text-shopee-orange">Others</a>
              </div>
            </div>

            {/* Women Accessories */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">WOMEN ACCESSORIES</h4>
              <div className="text-gray-600 leading-relaxed">
                <a href="#" className="hover:text-shopee-orange">Jewelry</a> | <a href="#" className="hover:text-shopee-orange">Watches</a> | <a href="#" className="hover:text-shopee-orange">Hair Accessories</a> | <a href="#" className="hover:text-shopee-orange">Eyewear</a> | <a href="#" className="hover:text-shopee-orange">Wallets & Pouches</a> | <a href="#" className="hover:text-shopee-orange">Hats & Caps</a> | <a href="#" className="hover:text-shopee-orange">Belts & Scarves</a> | <a href="#" className="hover:text-shopee-orange">Gloves</a> | <a href="#" className="hover:text-shopee-orange">Accessories Sets & Packages</a> | <a href="#" className="hover:text-shopee-orange">Additional Accessories</a> | <a href="#" className="hover:text-shopee-orange">Watch & Jewelry Organizers</a> | <a href="#" className="hover:text-shopee-orange">Others</a>
              </div>
            </div>

            {/* Gaming */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">GAMING</h4>
              <div className="text-gray-600 leading-relaxed">
                <a href="#" className="hover:text-shopee-orange">Computer Gaming</a> | <a href="#" className="hover:text-shopee-orange">Mobile Gaming</a> | <a href="#" className="hover:text-shopee-orange">Console Gaming</a> | <a href="#" className="hover:text-shopee-orange">Others</a>
              </div>
            </div>

            {/* Mobiles Accessories */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">MOBILES ACCESSORIES</h4>
              <div className="text-gray-600 leading-relaxed">
                <a href="#" className="hover:text-shopee-orange">Others Mobile Accessories</a> | <a href="#" className="hover:text-shopee-orange">Attachments</a> | <a href="#" className="hover:text-shopee-orange">Cases & Covers</a> | <a href="#" className="hover:text-shopee-orange">Powerbanks & Chargers</a>
              </div>
            </div>

            {/* Laptops & Computers */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">LAPTOPS & COMPUTERS</h4>
              <div className="text-gray-600 leading-relaxed">
                <a href="#" className="hover:text-shopee-orange">USB Gadgets</a> | <a href="#" className="hover:text-shopee-orange">Computer Hardware</a> | <a href="#" className="hover:text-shopee-orange">Software</a> | <a href="#" className="hover:text-shopee-orange">Printers and Inks</a> | <a href="#" className="hover:text-shopee-orange">Storage</a> | <a href="#" className="hover:text-shopee-orange">Computer Accessories</a> | <a href="#" className="hover:text-shopee-orange">Network Components</a> | <a href="#" className="hover:text-shopee-orange">Laptops and Desktops</a> | <a href="#" className="hover:text-shopee-orange">Others</a>
              </div>
            </div>

            {/* Toys, Games & Collectibles */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">TOYS, GAMES & COLLECTIBLES</h4>
              <div className="text-gray-600 leading-relaxed">
                <a href="#" className="hover:text-shopee-orange">Celebrity Merchandise</a> | <a href="#" className="hover:text-shopee-orange">Dress Up & Pretend</a> | <a href="#" className="hover:text-shopee-orange">Blasters & Toy Guns</a> | <a href="#" className="hover:text-shopee-orange">Sports & Outdoor Toys</a> | <a href="#" className="hover:text-shopee-orange">Dolls</a> | <a href="#" className="hover:text-shopee-orange">Educational Toys</a> | <a href="#" className="hover:text-shopee-orange">Electronic Toys</a> | <a href="#" className="hover:text-shopee-orange">Boards & Family Games</a> | <a href="#" className="hover:text-shopee-orange">Collectibles</a> | <a href="#" className="hover:text-shopee-orange">Character</a> | <a href="#" className="hover:text-shopee-orange">Action Figure</a> | <a href="#" className="hover:text-shopee-orange">Others</a>
              </div>
            </div>

            {/* Motors */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">MOTORS</h4>
              <div className="text-gray-600 leading-relaxed">
                <a href="#" className="hover:text-shopee-orange">Car Care & Detailing</a> | <a href="#" className="hover:text-shopee-orange">Automotive Parts</a> | <a href="#" className="hover:text-shopee-orange">Engine Parts</a> | <a href="#" className="hover:text-shopee-orange">Ignition</a> | <a href="#" className="hover:text-shopee-orange">Exterior Car Accessories</a> | <a href="#" className="hover:text-shopee-orange">Oils, Coolants, & Fluids</a> | <a href="#" className="hover:text-shopee-orange">Car Electronics</a> | <a href="#" className="hover:text-shopee-orange">Moto Riding & Protective Gear</a> | <a href="#" className="hover:text-shopee-orange">Tools & Garage</a> | <a href="#" className="hover:text-shopee-orange">Motorcycle Accessories</a> | <a href="#" className="hover:text-shopee-orange">Motorcycle & ATV Parts</a> | <a href="#" className="hover:text-shopee-orange">Interior Car Accessories</a> | <a href="#" className="hover:text-shopee-orange">Others</a> | <a href="#" className="hover:text-shopee-orange">Motorcycles</a>
              </div>
            </div>

            {/* Audio */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">AUDIO</h4>
              <div className="text-gray-600 leading-relaxed">
                <a href="#" className="hover:text-shopee-orange">Audio & Video Cables & Converters</a> | <a href="#" className="hover:text-shopee-orange">Earphones, Headphones & Headsets</a> | <a href="#" className="hover:text-shopee-orange">Amplifiers & Mixers</a> | <a href="#" className="hover:text-shopee-orange">Speakers and Karaoke</a> | <a href="#" className="hover:text-shopee-orange">Home Audio & Speakers</a> | <a href="#" className="hover:text-shopee-orange">Media Players</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
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

        {/* Bottom Footer */}
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="max-w-[1200px] mx-auto px-5 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
              <div>
                © 2025 Shopee. All Rights Reserved.
              </div>
              <div className="flex items-center gap-2">
                <span>Country & Region:</span>
                <a href="#" className="hover:text-shopee-orange">Argentina</a> |
                <a href="#" className="hover:text-shopee-orange">Singapore</a> |
                <a href="#" className="hover:text-shopee-orange">Indonesia</a> |
                <a href="#" className="hover:text-shopee-orange">Thailand</a> |
                <a href="#" className="hover:text-shopee-orange">Malaysia</a> |
                <a href="#" className="hover:text-shopee-orange">Vietnam</a> |
                <a href="#" className="hover:text-shopee-orange font-semibold">Philippines</a> |
                <a href="#" className="hover:text-shopee-orange">Brazil</a> |
                <a href="#" className="hover:text-shopee-orange">México</a> |
                <a href="#" className="hover:text-shopee-orange">Taiwan</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BuyerLandingPage;
