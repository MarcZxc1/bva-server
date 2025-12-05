import React from 'react';
import BuyerNavbar from './components/BuyerNavbar';
import { Link, useParams } from 'react-router-dom';
import { Star, Heart, Share2, Truck, ShieldCheck } from 'lucide-react';

const thumbnails = ['🧴','🧪','🎀','🌸','🍑'];

const BuyerProductDetail: React.FC = () => {
  const { id: productId } = useParams();

  return (
    <div className="min-h-screen bg-gray-100">
      <BuyerNavbar />

      <div className="max-w-[1200px] mx-auto px-5 py-6">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 mb-4">
          <Link to="#" className="hover:text-shopee-orange">Shopee</Link>
          <span className="mx-1">›</span>
          <Link to="#" className="hover:text-shopee-orange">Makeup & Fragrances</Link>
          <span className="mx-1">›</span>
          <Link to="#" className="hover:text-shopee-orange">Fragrances</Link>
          <span className="mx-1">›</span>
          <span className="text-gray-700">Body Mist</span>
        </div>

        <div className="bg-white border border-gray-200 p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Gallery */}
            <div>
              <div className="aspect-square bg-gray-50 flex items-center justify-center border border-gray-200">
                <span className="text-6xl">🧴</span>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {thumbnails.map((t, i) => (
                  <div key={i} className="aspect-square border border-gray-200 bg-white flex items-center justify-center cursor-pointer hover:border-shopee-orange">
                    <span className="text-3xl">{t}</span>
                  </div>
                ))}
              </div>

              {/* Share & Favorite */}
              <div className="mt-4 flex items-center gap-4 text-sm">
                <button className="flex items-center gap-2 text-gray-600 hover:text-shopee-orange">
                  <Share2 size={16} /> Share
                </button>
                <button className="flex items-center gap-2 text-gray-600 hover:text-shopee-orange">
                  <Heart size={16} /> Favorite (121)
                </button>
              </div>
            </div>

            {/* Right: Info */}
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                30ml EuniScent Cucumber Melon and Meow Katy Perry Inspired Oil Based Perfume
                <span className="ml-2 text-gray-400 text-sm"># {productId}</span>
              </h1>

              <div className="mt-2 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-green-600">
                  <span className="font-semibold">5.0</span>
                  <Star size={16} className="text-yellow-400" />
                  <span className="text-gray-500">3.4K Ratings</span>
                </div>
                <div className="text-gray-500">10K+ Sold</div>
                <button className="text-gray-400 text-xs hover:text-shopee-orange">Report</button>
              </div>

              {/* Price Box */}
              <div className="mt-4 bg-orange-50 border border-orange-200 rounded p-4">
                <div className="flex items-baseline gap-3">
                  <div className="text-3xl font-bold text-shopee-orange">₱64</div>
                  <span className="text-sm text-gray-400 line-through">₱89</span>
                  <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded">-28%</span>
                </div>
                <div className="mt-2 text-xs text-gray-600">MAS MURA TODAY ONLY!</div>
              </div>

              {/* Badges */}
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-green-600">
                  <ShieldCheck size={16} /> Guaranteed to get by 6 - 9 Dec
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Truck size={16} /> Free & Easy Returns
                </div>
              </div>

              {/* Variations */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Variation</h3>
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-2">
                  {Array.from({ length: 18 }).map((_, idx) => (
                    <button key={idx} className="text-xs border border-gray-300 rounded px-2 py-1 hover:border-shopee-orange text-gray-700">
                      Option {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button className="px-6 py-3 bg-shopee-orange text-white rounded hover:bg-shopee-orange-dark">Add to Cart</button>
                <button className="px-6 py-3 border border-shopee-orange text-shopee-orange rounded hover:bg-orange-50">Buy Now</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerProductDetail;
