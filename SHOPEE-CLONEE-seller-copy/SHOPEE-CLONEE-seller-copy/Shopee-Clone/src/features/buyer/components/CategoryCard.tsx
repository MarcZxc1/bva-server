import React from 'react';

interface CategoryCardProps {
  name: string;
  image: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ name, image }) => {
  return (
    <div className="bg-white border border-gray-200 cursor-pointer hover:shadow-md transition-all group">
      <div className="aspect-square bg-white flex items-center justify-center overflow-hidden p-3">
        <div className="text-5xl group-hover:scale-110 transition-transform">
          {image}
        </div>
      </div>
      <div className="px-2 py-2 text-center border-t border-gray-100">
        <h3 className="text-xs font-normal text-gray-700 line-clamp-2 leading-tight">
          {name}
        </h3>
      </div>
    </div>
  );
};

export default CategoryCard;
