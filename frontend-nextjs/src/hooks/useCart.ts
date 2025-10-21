'use client';

import { useState, useEffect } from 'react';
import { CartItem, MenuItem } from '@/types';

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('restaurant-cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('restaurant-cart', JSON.stringify(cartItems));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [cartItems, isLoading]);

  // Add item to cart
  const addToCart = (menuItem: MenuItem, quantity: number = 1) => {
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item.menuItem._id === menuItem._id
      );

      if (existingItemIndex >= 0) {
        // Update quantity if item already exists
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;
        return updatedItems;
      } else {
        // Add new item to cart
        return [...prevItems, { menuItem, quantity }];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (menuItemId: string) => {
    setCartItems(prevItems => 
      prevItems.filter(item => item.menuItem._id !== menuItemId)
    );
  };

  // Update item quantity
  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.menuItem._id === menuItemId
          ? { ...item, quantity }
          : item
      )
    );
  };

  // Clear entire cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Get cart totals
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.menuItem.price * item.quantity);
    }, 0);
  };

  const getCartItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  // Get item quantity in cart
  const getItemQuantity = (menuItemId: string) => {
    const item = cartItems.find(item => item.menuItem._id === menuItemId);
    return item ? item.quantity : 0;
  };

  // Check if cart is empty
  const isEmpty = cartItems.length === 0;

  // Format cart items for order submission
  const getOrderItems = () => {
    return cartItems.map(item => ({
      menuItem: item.menuItem._id,
      name: item.menuItem.name,
      price: item.menuItem.price,
      quantity: item.quantity,
    }));
  };

  return {
    cartItems,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount,
    getItemQuantity,
    getOrderItems,
    isEmpty,
  };
};

export default useCart;