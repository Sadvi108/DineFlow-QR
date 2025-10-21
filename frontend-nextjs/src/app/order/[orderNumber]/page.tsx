'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Order } from '@/types';
import { apiService } from '@/utils/api';
import { useSocket } from '@/hooks/useSocket';
import { StatusBadge, LoadingSpinner } from '@/components';

export default function OrderTrackingPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const { joinTable, leaveTable, onOrderUpdate, isConnected } = useSocket();

  // Load order details
  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        const orderData = await apiService.getOrder(orderNumber);
        setOrder(orderData);
        setLastUpdate(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    if (orderNumber) {
      loadOrder();
    }
  }, [orderNumber]);

  // Join table room for real-time updates
  useEffect(() => {
    if (order?.tableNumber) {
      joinTable(order.tableNumber);
      
      // Listen for order updates
      onOrderUpdate((updatedOrder) => {
        if (updatedOrder.orderNumber === orderNumber) {
          setOrder(updatedOrder);
          setLastUpdate(new Date());
        }
      });

      return () => {
        leaveTable(order.tableNumber);
      };
    }
  }, [order?.tableNumber, orderNumber, joinTable, leaveTable, onOrderUpdate]);

  const getStatusMessage = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'Your order has been received and is waiting to be prepared.';
      case 'preparing':
        return 'Our kitchen team is preparing your delicious meal!';
      case 'ready':
        return 'Your order is ready! Please collect it from the counter.';
      case 'served':
        return 'Your order has been served. Enjoy your meal!';
      case 'cancelled':
        return 'Your order has been cancelled. Please contact staff for assistance.';
      default:
        return 'Order status unknown.';
    }
  };

  const getEstimatedTime = () => {
    if (!order || order.status === 'served' || order.status === 'cancelled') {
      return null;
    }

    const orderTime = new Date(order.createdAt);
    const now = new Date();
    const elapsedMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    
    if (order.estimatedTime) {
      const remainingTime = Math.max(0, order.estimatedTime - elapsedMinutes);
      return remainingTime;
    }

    return null;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading order details..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || 'We couldn\'t find an order with this number.'}
          </p>
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg inline-block"
          >
            Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  const estimatedTime = getEstimatedTime();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
              <p className="text-sm text-gray-500">Table {order.tableNumber}</p>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-500">
                {isConnected ? 'Live updates' : 'Reconnecting...'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order Status Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <StatusBadge status={order.status} size="lg" />
            <div className="text-right text-sm text-gray-500">
              <div>Last updated: {lastUpdate.toLocaleTimeString()}</div>
              <div>Ordered at: {formatTime(order.createdAt)}</div>
            </div>
          </div>

          <p className="text-gray-700 mb-4">{getStatusMessage(order.status)}</p>

          {/* Estimated Time */}
          {estimatedTime !== null && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-blue-800 font-medium">
                  {estimatedTime > 0 
                    ? `Estimated time remaining: ${estimatedTime} minutes`
                    : 'Your order should be ready any moment!'
                  }
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Order Progress */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Progress</h2>
          
          <div className="space-y-4">
            {[
              { status: 'pending', label: 'Order Received', icon: '📝' },
              { status: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
              { status: 'ready', label: 'Ready for Pickup', icon: '🔔' },
              { status: 'served', label: 'Served', icon: '✅' },
            ].map((step, index) => {
              const isCompleted = ['pending', 'preparing', 'ready', 'served'].indexOf(order.status) >= index;
              const isCurrent = order.status === step.status;
              const isCancelled = order.status === 'cancelled';
              
              return (
                <div key={step.status} className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-lg
                    ${isCancelled ? 'bg-gray-200 text-gray-400' :
                      isCompleted ? 'bg-green-500 text-white' :
                      isCurrent ? 'bg-blue-500 text-white' :
                      'bg-gray-200 text-gray-400'}
                  `}>
                    {isCancelled ? '❌' : step.icon}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className={`font-medium ${
                      isCancelled ? 'text-gray-400' :
                      isCompleted ? 'text-green-700' :
                      isCurrent ? 'text-blue-700' :
                      'text-gray-500'
                    }`}>
                      {step.label}
                    </div>
                    {isCurrent && !isCancelled && (
                      <div className="text-sm text-blue-600">In progress...</div>
                    )}
                  </div>
                  {index < 3 && (
                    <div className={`w-px h-8 ml-5 ${
                      isCancelled ? 'bg-gray-200' :
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
          
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <span className="font-medium">{item.quantity}x</span>
                  <span className="ml-2">{item.name}</span>
                </div>
                <span className="text-gray-600">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {order.customerNotes && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm font-medium text-yellow-800">Special Instructions:</div>
              <div className="text-sm text-yellow-700 mt-1">{order.customerNotes}</div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total:</span>
              <span className="text-green-600">${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-4">
          <Link
            href={`/table/${order.tableNumber}`}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg text-center transition-colors"
          >
            Order More Items
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
}