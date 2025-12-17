'use client';

import { useState } from 'react';

interface PaymentModalProps {
  show: boolean;
  onClose: () => void;
  onSelect: (method: 'COD' | 'Online Bank') => void;
  disabled?: boolean;
}

export function PaymentModal({ show, onClose, onSelect, disabled = false }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!show) {
    return null;
  }

  const handleSelect = (method: 'COD' | 'Online Bank') => {
    if (disabled || isProcessing) {
      return;
    }
    setIsProcessing(true);
    onSelect(method);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Select Payment Method</h2>
        <div className="flex gap-4">
          <button
            onClick={() => handleSelect('COD')}
            disabled={disabled || isProcessing}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Cash on Delivery'}
          </button>
          <button
            onClick={() => handleSelect('Online Bank')}
            disabled={disabled || isProcessing}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Online Bank'}
          </button>
        </div>
        <button
          onClick={onClose}
          disabled={disabled || isProcessing}
          className="mt-4 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
