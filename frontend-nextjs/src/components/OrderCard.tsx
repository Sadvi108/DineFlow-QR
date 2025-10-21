'use client';

import React from 'react';
import { Order } from '@/types';
import StatusBadge from './StatusBadge';

interface OrderCardProps {
  order: Order;
  onStatusUpdate?: (orderId: string, status: Order['status']) => void;
  showActions?: boolean;
  className?: string;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onStatusUpdate,
  showActions = false,
  className = '',
}) => {
  const handleStatusChange = (newStatus: Order['status']) => {
    if (onStatusUpdate) {
      onStatusUpdate(order._id, newStatus);
    }
  };

  const getStatusActions = (currentStatus: Order['status']) => {
    switch (currentStatus) {
      case 'pending':
        return [
          { status: 'preparing' as const, label: 'Start Preparing', color: 'bg-yellow-600 hover:bg-yellow-700' },
          { status: 'cancelled' as const, label: 'Cancel', color: 'bg-red-600 hover:bg-red-700' },
        ];
      case 'preparing':
        return [
          { status: 'ready' as const, label: 'Mark Ready', color: 'bg-green-600 hover:bg-green-700' },
        ];
      case 'ready':
        return [
          { status: 'served' as const, label: 'Mark Served', color: 'bg-blue-600 hover:bg-blue-700' },
        ];
      default:
        return [];
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeElapsed = () => {
    const now = new Date();
    const orderTime = new Date(order.createdAt);
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else {
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      return `${hours}h ${minutes}m ago`;
    }
  };

  const statusActions = getStatusActions(order.status);

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Order #{order.orderNumber}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
            <span>Table {order.tableNumber}</span>
            <span>•</span>
            <span>{formatTime(order.createdAt)}</span>
            <span>•</span>
            <span>{getTimeElapsed()}</span>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Order Items */}
      <div className="space-y-2 mb-4">
        {order.items.map((item, index) => (
          <div key={index} className="flex justify-between items-center py-1">
            <div className="flex-1">
              <span className="font-medium">{item.quantity}x</span>
              <span className="ml-2">{item.name}</span>
            </div>
            <span className="text-gray-600">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Customer Notes */}
      {order.customerNotes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">Special Instructions:</p>
              <p className="text-sm text-yellow-700 mt-1">{order.customerNotes}</p>
            </div>
          </div>
        </div>
      )}

      {/* Estimated Time */}
      {order.estimatedTime && (
        <div className="flex items-center text-sm text-gray-600 mb-4">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Estimated time: {order.estimatedTime} minutes</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
        <div className="text-lg font-semibold text-gray-900">
          Total: ${order.totalAmount.toFixed(2)}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Payment Status */}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            order.paymentStatus === 'paid' 
              ? 'bg-green-100 text-green-800' 
              : order.paymentStatus === 'failed'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {order.paymentStatus === 'paid' ? 'Paid' : 
             order.paymentStatus === 'failed' ? 'Payment Failed' : 'Payment Pending'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && statusActions.length > 0 && (
        <div className="flex space-x-2 mt-4 pt-3 border-t border-gray-200">
          {statusActions.map((action) => (
            <button
              key={action.status}
              onClick={() => handleStatusChange(action.status)}
              className={`flex-1 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm ${action.color}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderCard;