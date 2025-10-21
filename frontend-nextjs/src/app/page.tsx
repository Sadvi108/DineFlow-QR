'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if there's a table parameter in the URL
    const table = searchParams.get('table');
    if (table) {
      router.push(`/table/${table}`);
      return;
    }

    // Check if there's an order parameter in the URL
    const order = searchParams.get('order');
    if (order) {
      router.push(`/order/${order}`);
      return;
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🍽️</span>
              <h1 className="text-2xl font-bold text-gray-900">Restaurant QR System</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Our Restaurant
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Scan the QR code at your table to start ordering, or use the options below
          </p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Customer Options */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Order from Table</h3>
            <p className="text-gray-600 mb-4">
              Enter your table number to browse our menu and place orders
            </p>
            <div className="space-y-3">
              <input
                type="number"
                placeholder="Table Number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const tableNumber = (e.target as HTMLInputElement).value;
                    if (tableNumber) {
                      router.push(`/table/${tableNumber}`);
                    }
                  }
                }}
              />
              <p className="text-sm text-gray-500">Press Enter to continue</p>
            </div>
          </div>

          {/* Order Tracking */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Track Your Order</h3>
            <p className="text-gray-600 mb-4">
              Enter your order number to check the status of your order
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Order Number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const orderNumber = (e.target as HTMLInputElement).value;
                    if (orderNumber) {
                      router.push(`/order/${orderNumber}`);
                    }
                  }
                }}
              />
              <p className="text-sm text-gray-500">Press Enter to track</p>
            </div>
          </div>

          {/* Staff Access */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl mb-4">👨‍🍳</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Staff Dashboard</h3>
            <p className="text-gray-600 mb-4">
              Access the kitchen dashboard to manage orders and operations
            </p>
            <Link
              href="/login"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Staff Login
            </Link>
          </div>
        </div>

        {/* QR Code Demo */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">📱</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">1. Scan QR Code</h4>
              <p className="text-gray-600">
                Use your phone camera to scan the QR code at your table
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🍕</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">2. Browse & Order</h4>
              <p className="text-gray-600">
                Browse our menu, add items to cart, and place your order
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">⏰</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">3. Track Progress</h4>
              <p className="text-gray-600">
                Get real-time updates on your order status until it's ready
              </p>
            </div>
          </div>
        </div>

        {/* Demo Links */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Demo Links</h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/table/1"
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Demo Table 1
            </Link>
            <Link
              href="/table/5"
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Demo Table 5
            </Link>
            <Link
              href="/qr-generator"
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Generate QR Codes
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Restaurant QR Ordering System. All rights reserved.</p>
            <p className="mt-2 text-sm">
              Powered by Next.js, Socket.io, and modern web technologies
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
