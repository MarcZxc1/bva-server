import React from 'react';
import { Shield, Zap, Gift, Package, Sparkles, Truck, Coins, Star, Percent } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface FeatureIcon {
  id: number;
  icon: LucideIcon;
  label: string;
  bgColor: string;
  iconColor: string;
}

const featureIcons: FeatureIcon[] = [
  { id: 1, icon: Shield, label: 'Siguradong Mura', bgColor: 'bg-gradient-to-br from-red-400 to-pink-500', iconColor: 'text-white' },
  { id: 2, icon: Zap, label: 'Flash Deals', bgColor: 'bg-gradient-to-br from-orange-400 to-red-500', iconColor: 'text-white' },
  { id: 3, icon: Gift, label: '70% Off Holiday Deals', bgColor: 'bg-gradient-to-br from-green-400 to-emerald-500', iconColor: 'text-white' },
  { id: 4, icon: Package, label: 'Millions of Fashion Deals', bgColor: 'bg-gradient-to-br from-blue-400 to-cyan-500', iconColor: 'text-white' },
  { id: 5, icon: Sparkles, label: 'Shopee Beauty', bgColor: 'bg-gradient-to-br from-pink-400 to-rose-500', iconColor: 'text-white' },
  { id: 6, icon: Package, label: 'Fulfilled by Shopee', bgColor: 'bg-gradient-to-br from-purple-400 to-violet-500', iconColor: 'text-white' },
  { id: 7, icon: Truck, label: 'Free Shipping & Vouchers', bgColor: 'bg-gradient-to-br from-yellow-400 to-orange-500', iconColor: 'text-white' },
  { id: 8, icon: Coins, label: 'Coins Rewards', bgColor: 'bg-gradient-to-br from-amber-400 to-yellow-500', iconColor: 'text-white' },
  { id: 9, icon: Star, label: 'Shopee Loyalty', bgColor: 'bg-gradient-to-br from-indigo-400 to-blue-500', iconColor: 'text-white' },
  { id: 10, icon: Percent, label: 'Partner Promos', bgColor: 'bg-gradient-to-br from-teal-400 to-cyan-500', iconColor: 'text-white' },
];

const FeatureIcons: React.FC = () => {
  return (
    <div className="bg-white shadow-sm">
      <div className="max-w-[1200px] mx-auto px-5 py-6">
        <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
          {featureIcons.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={feature.id}
                className="flex flex-col items-center gap-2 cursor-pointer group"
              >
                <div
                  className={`${feature.bgColor} w-14 h-14 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-md`}
                >
                  <IconComponent size={24} className={feature.iconColor} />
                </div>
                <span className="text-[10px] text-center font-normal text-gray-700 leading-tight h-8 flex items-center">
                  {feature.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FeatureIcons;
