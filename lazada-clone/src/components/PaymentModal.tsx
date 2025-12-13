'use client';

interface PaymentModalProps {
  show: boolean;
  onClose: () => void;
  onSelect: (method: 'COD' | 'Online Bank') => void;
}

export function PaymentModal({ show, onClose, onSelect }: PaymentModalProps) {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Select Payment Method</h2>
        <div className="flex gap-4">
          <button
            onClick={() => onSelect('COD')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 flex-1"
          >
            Cash on Delivery
          </button>
          <button
            onClick={() => onSelect('Online Bank')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 flex-1"
          >
            Online Bank
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-4 text-sm text-gray-600 hover:text-gray-900"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
