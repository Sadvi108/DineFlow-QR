'use client';

import React from 'react';
import Image from 'next/image';
import { MenuItem } from '@/types';
import { useCart } from '@/hooks/useCart';

interface MenuItemCardProps {
  item: MenuItem;
  className?: string;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, className = '' }) => {
  const { addToCart, getItemQuantity, updateQuantity } = useCart();
  const quantity = getItemQuantity(item._id);

  const handleAddToCart = () => {
    addToCart(item, 1);
  };

  const handleIncrement = () => {
    updateQuantity(item._id, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      updateQuantity(item._id, quantity - 1);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105 ${className}`}>
      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        <Image
          src={item.image || '/images/placeholder.svg'}
          alt={item.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/images/placeholder.svg';
          }}
        />
        
        {/* Availability badge */}
        {!item.available && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Unavailable
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
          <span className="text-lg font-bold text-green-600">${item.price.toFixed(2)}</span>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full capitalize">
            {item.category.replace(/-/g, ' ')}
          </span>
        </div>

        {/* Add to cart controls */}
        {item.available ? (
          <div className="flex items-center justify-between">
            {quantity === 0 ? (
              <button
                onClick={handleAddToCart}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Add to Cart
              </button>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleDecrement}
                    className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                  >
                    <span className="text-lg font-medium">−</span>
                  </button>
                  <span className="font-medium text-lg min-w-[2rem] text-center">{quantity}</span>
                  <button
                    onClick={handleIncrement}
                    className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <span className="text-lg font-medium">+</span>
                  </button>
                </div>
                <span className="text-sm font-medium text-gray-600">
                  ${(item.price * quantity).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        ) : (
          <button
            disabled
            className="w-full bg-gray-300 text-gray-500 font-medium py-2 px-4 rounded-lg cursor-not-allowed"
          >
            Currently Unavailable
          </button>
        )}
      </div>
    </div>
  );
};

export default MenuItemCard;