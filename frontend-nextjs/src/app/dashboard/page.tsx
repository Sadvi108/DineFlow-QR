'use client';

import React, { useState, useEffect } from 'react';
import { Order } from '@/types';
import { apiService } from '@/utils/api';
import { useSocket } from '@/hooks/useSocket';
import { OrderCard, LoadingSpinner } from '@/components';

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | Order['status']>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'table'>('newest');

  const { 
    joinDashboard, 
    onNewOrder, 
    onOrderUpdate, 
    onOrderStatusChange,
    updateOrderStatus,
    isConnected 
  } = useSocket();

  // Load orders
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const ordersData = await apiService.getOrders();
        setOrders(ordersData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  // Join dashboard room for real-time updates
  useEffect(() => {
    joinDashboard();

    // Listen for new orders
    onNewOrder((newOrder) => {
      setOrders(prev => [newOrder, ...prev]);
    });

    // Listen for order updates
    onOrderUpdate((updatedOrder) => {
      setOrders(prev => prev.map(order => 
        order.orderNumber === updatedOrder.orderNumber ? updatedOrder : order
      ));
    });

    // Listen for order status changes
    onOrderStatusChange((data) => {
      setOrders(prev => prev.map(order => 
        order.orderNumber === data.orderNumber 
          ? { ...order, status: data.status, estimatedTime: data.estimatedTime }
          : order
      ));
    });
  }, [joinDashboard, onNewOrder, onOrderUpdate, onOrderStatusChange]);

  const handleStatusUpdate = async (orderNumber: string, status: Order['status'], estimatedTime?: number) => {
    try {
      await apiService.updateOrderStatus(orderNumber, status, estimatedTime);
      updateOrderStatus(orderNumber, status, estimatedTime);
    } catch (err) {
      console.error('Failed to update order status:', err);
      // You might want to show a toast notification here
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'table':
        return a.tableNumber - b.tableNumber;
      default:
        return 0;
    }
  });

  const getOrderCounts = () => {
    return {
      all: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      served: orders.filter(o => o.status === 'served').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };
  };

  const counts = getOrderCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kitchen Dashboard</h1>
              <p className="text-sm text-gray-500">Real-time order management</p>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className="text-sm text-gray-500">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { key: 'all', label: 'Total', color: 'bg-gray-500' },
            { key: 'pending', label: 'Pending', color: 'bg-yellow-500' },
            { key: 'preparing', label: 'Preparing', color: 'bg-blue-500' },
            { key: 'ready', label: 'Ready', color: 'bg-green-500' },
            { key: 'served', label: 'Served', color: 'bg-purple-500' },
            { key: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
          ].map(({ key, label, color }) => (
            <div
              key={key}
              className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-transform hover:scale-105 ${
                filter === key ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setFilter(key as typeof filter)}
            >
              <div className={`w-4 h-4 rounded-full ${color} mb-2`} />
              <div className="text-2xl font-bold text-gray-900">{counts[key as keyof typeof counts]}</div>
              <div className="text-sm text-gray-600">{label}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              {[
                { key: 'all', label: 'All Orders' },
                { key: 'pending', label: 'Pending' },
                { key: 'preparing', label: 'Preparing' },
                { key: 'ready', label: 'Ready' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as typeof filter)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="table">Table Number</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        {sortedOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'No orders have been placed yet.' 
                : `No ${filter} orders at the moment.`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedOrders.map((order) => (
              <OrderCard
                key={order.orderNumber}
                order={order}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions Floating Button */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors"
          title="Refresh Dashboard"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  );
}