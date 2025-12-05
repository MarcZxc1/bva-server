import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  bgColor: string;
}

const mainBanners: Banner[] = [
  { 
    id: 1, 
    title: 'BASTA TRENDING,', 
    subtitle: 'NASA SHOPEE!',
    bgColor: 'bg-gradient-to-r from-cyan-300 via-blue-200 to-blue-100' 
  },
  { 
    id: 2, 
    title: 'PAYDAY SALE', 
    subtitle: 'UP TO 50% OFF',
    bgColor: 'bg-gradient-to-r from-orange-400 to-pink-500' 
  },
  { 
    id: 3, 
    title: 'FREE SHIPPING', 
    subtitle: 'NO MINIMUM SPEND',
    bgColor: 'bg-gradient-to-r from-purple-400 to-indigo-500' 
  },
];

const sideBanners = [
  { 
    id: 1, 
    title: '12.12', 
    subtitle: 'HONOR UP TO ₱18,000 OFF',
    bgColor: 'bg-gradient-to-br from-orange-100 to-orange-200',
    textColor: 'text-orange-600'
  },
  { 
    id: 2, 
    title: 'BANK OF COMMERCE', 
    subtitle: 'UP TO ₱2,000 OFF',
    bgColor: 'bg-gradient-to-br from-red-100 to-red-200',
    textColor: 'text-red-700'
  },
];

const HeroBanner: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % mainBanners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % mainBanners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + mainBanners.length) % mainBanners.length);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* Main Carousel */}
        <div className="lg:col-span-2 relative overflow-hidden">
          <div className="relative h-60 md:h-72">
            {mainBanners.map((banner, index) => (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className={`${banner.bgColor} h-full flex flex-col items-center justify-center p-8 relative overflow-hidden`}>
                  {index === 0 && (
                    <div className="absolute top-0 right-0 w-1/2 h-full">
                      <div className="text-9xl opacity-20 absolute -right-10 top-1/2 -translate-y-1/2">📱</div>
                    </div>
                  )}
                  <h2 className="text-4xl md:text-5xl font-black text-blue-900 mb-2 text-center relative z-10" 
                      style={{textShadow: '3px 3px 0px white, -1px -1px 0px white, 1px -1px 0px white, -1px 1px 0px white'}}>
                    {banner.title}
                  </h2>
                  <h3 className="text-4xl md:text-5xl font-black text-orange-600 text-center relative z-10"
                      style={{textShadow: '3px 3px 0px white, -1px -1px 0px white, 1px -1px 0px white, -1px 1px 0px white'}}>
                    {banner.subtitle}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-sm p-1.5 shadow-md transition-all z-10"
          >
            <ChevronLeft size={20} className="text-gray-700" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-sm p-1.5 shadow-md transition-all z-10"
          >
            <ChevronRight size={20} className="text-gray-700" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {mainBanners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide ? 'bg-white w-5' : 'bg-white/60 w-2'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Side Banners */}
        <div className="flex flex-col gap-2">
          {sideBanners.map((banner) => (
            <div
              key={banner.id}
              className={`${banner.bgColor} h-[calc(50%-4px)] flex flex-col items-center justify-center cursor-pointer hover:opacity-90 transition-opacity p-4`}
            >
              <div className="text-center">
                <div className={`text-2xl font-bold ${banner.textColor} mb-1`}>
                  {banner.title}
                </div>
                <div className={`text-sm font-semibold ${banner.textColor}`}>
                  {banner.subtitle}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
