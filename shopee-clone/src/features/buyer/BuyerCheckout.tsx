import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BuyerNavbar from './components/BuyerNavbar';
import BuyerFooter from './components/BuyerFooter';
import { MapPin, MessageCircle, Tag, ShieldCheck } from 'lucide-react';
import shopeeLogo from '/src/assets/LANDING-PAGE-LOGO/buyer-shopee-logo.png';
import { useCart } from '../../contexts/CartContext';
import { useOrders } from '../../contexts/OrderContext';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/api';

const BuyerCheckout: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, removeSelectedItems } = useCart();
  const { addOrder } = useOrders();
  const { isAuthenticated } = useAuth();
  const [merchandiseProtection, setMerchandiseProtection] = useState(true);
  const [messageForSeller, setMessageForSeller] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/buyer-login');
      return;
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const selectedItems = cartItems.filter(item => item.isSelected);

  const groupedByShop = selectedItems.reduce((acc, item) => {
    if (!acc[item.shopName]) {
      acc[item.shopName] = [];
    }
    acc[item.shopName].push(item);
    return acc;
  }, {} as Record<string, typeof selectedItems>);

  const calculateShopTotal = (items: typeof selectedItems) => {
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const protection = merchandiseProtection ? 11 : 0;
    const voucher = 10;
    const shipping = 36;
    return {
      subtotal,
      protection,
      voucher,
      shipping,
      total: subtotal + protection - voucher + shipping,
    };
  };

  const { user } = useAuth();
  
  // Get delivery address from user data
  const deliveryAddress = {
    name: user?.name || user?.username || 'User',
    phone: user?.phoneNumber || 'Not provided',
    address: 'Address not set. Please update your profile.',
    isDefault: true,
  };

  // Calculate shipping info (can be enhanced with real shipping API)
  const shippingInfo = {
    deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    method: 'Standard Local',
    fee: 36,
    voucherNote: `Get a ₱50 voucher if no delivery was attempted by ${new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`,
  };

  // Payment method is set by seller (display only for buyer)
  const paymentMethod = 'Cash on Delivery';

  if (selectedItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BuyerNavbar />
        <div className="max-w-[1200px] mx-auto px-5 py-12 text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">No items selected for checkout</h2>
          <Link
            to="/cart"
            className="inline-block bg-shopee-orange text-white px-8 py-3 rounded-lg font-semibold hover:bg-shopee-orange-dark transition-colors"
          >
            Return to Cart
          </Link>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (selectedItems.length === 0) {
      setError('Please select items to place an order');
      return;
    }

    setIsPlacingOrder(true);
    setError(null);

    try {
      // Validate product IDs
      const invalidItems = selectedItems.filter(item => !item.productId);
      if (invalidItems.length > 0) {
        setError('Some items are missing product information. Please remove them from cart and try again.');
        setIsPlacingOrder(false);
        return;
      }

      // Group items by shop and create orders
      const shopGroups = Object.entries(groupedByShop);
      const createdOrders = [];
      
      for (const [shopName, items] of shopGroups) {
        const orderItems = items.map(item => ({
          productId: String(item.productId), // Ensure it's a string
          quantity: item.quantity,
          price: item.unitPrice,
        }));

        const shopTotal = calculateShopTotal(items);
        
        try {
          const orderResponse = await apiClient.createOrder({
            items: orderItems,
            total: shopTotal.total,
            shippingAddress: deliveryAddress.address,
            paymentMethod: paymentMethod === 'Cash on Delivery' ? 'cash' : 'online',
          });

          createdOrders.push(orderResponse);

          // Also add to local order context for immediate UI update
          items.forEach(item => {
            addOrder({
              product: {
                name: item.name,
                fullName: item.fullName,
                image: item.image,
              },
              price: item.unitPrice,
              quantity: item.quantity,
              totalPrice: item.unitPrice * item.quantity,
              shopName: item.shopName,
              variations: item.variations,
              unitPrice: item.unitPrice,
              paymentMethod: paymentMethod === 'Cash on Delivery' ? 'cash' : 'online',
            });
          });
        } catch (shopError: any) {
          console.error(`Error creating order for shop ${shopName}:`, shopError);
          // Continue with other shops even if one fails
          setError(`Failed to create order for ${shopName}: ${shopError.message || 'Unknown error'}`);
        }
      }

      if (createdOrders.length > 0) {
        removeSelectedItems();
        navigate('/purchase');
      } else {
        setError('Failed to create any orders. Please try again.');
      }
    } catch (err: any) {
      console.error('Error placing order:', err);
      const errorMessage = err.message || err.response?.data?.error || 'An error occurred while placing your order. Please try again.';
      setError(errorMessage);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <BuyerNavbar />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-5 py-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3">
              <img src={shopeeLogo} alt="Shopee" className="h-12 w-auto" />
            </Link>
            <h1 className="text-2xl font-semibold text-gray-800">Checkout</h1>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-5 py-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <MapPin size={24} className="text-red-500 mt-1" />
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Delivery Address</h2>
                <div className="space-y-1 text-gray-700">
                  <div className="font-semibold">{deliveryAddress.name}</div>
                  <div>{deliveryAddress.phone}</div>
                  <div>{deliveryAddress.address}</div>
                </div>
                {deliveryAddress.isDefault && (
                  <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    Default
                  </span>
                )}
              </div>
            </div>
            <button className="px-4 py-2 text-blue-600 hover:text-blue-700 font-semibold border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
              Change
            </button>
          </div>
        </div>

        {Object.entries(groupedByShop).map(([shopName, items]) => {
          const totals = calculateShopTotal(items);
          
          return (
            <div key={shopName} className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Products Ordered</h2>
              
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">
                  {shopName.charAt(0)}
                </div>
                <span className="font-semibold text-gray-800">{shopName}</span>
                <button className="ml-auto px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors flex items-center gap-1">
                  <MessageCircle size={14} />
                  chat now
                </button>
              </div>

              {items.map((item) => (
                <div key={item.id} className="mb-6 pb-6 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0">
                  <div className="flex gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover border border-gray-200 rounded"
                    />
                    <div className="flex-1">
                      <h3 className="text-sm text-gray-800 mb-2">{item.fullName || item.name}</h3>
                      <div className="text-xs text-gray-600 mb-2">Variation: {item.variations}</div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <span>Unit Price: </span>
                          <span className="text-shopee-orange font-semibold">₱{item.unitPrice.toLocaleString()}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span>Quantity: </span>
                          <span className="font-semibold">{item.quantity}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span>Item Subtotal: </span>
                          <span className="text-shopee-orange font-semibold">₱{(item.unitPrice * item.quantity).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={merchandiseProtection}
                    onChange={(e) => setMerchandiseProtection(e.target.checked)}
                    className="w-5 h-5 mt-0.5 text-shopee-orange border-gray-300 rounded focus:ring-shopee-orange"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck size={18} className="text-gray-600" />
                      <span className="font-semibold text-gray-800">Merchandise Protection</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Protect your items from total loss due to accidental damage and liquid damage where the original item is beyond repair
                    </p>
                    <a href="#" className="text-sm text-blue-600 hover:underline">Learn more</a>
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-sm text-gray-600">
                        <span>Price: </span>
                        <span className="text-shopee-orange font-semibold">₱11</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span>Quantity: </span>
                        <span className="font-semibold">1</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span>Item Subtotal: </span>
                        <span className="text-shopee-orange font-semibold">₱{merchandiseProtection ? '11' : '0'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag size={20} className="text-red-500" />
                    <span className="font-semibold text-gray-800">Shop Voucher</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-red-500 font-semibold">-₱{totals.voucher}</span>
                    <button className="px-3 py-1 text-blue-600 hover:text-blue-700 text-sm border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                      Change Voucher
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Message for Sellers:
                </label>
                <input
                  type="text"
                  value={messageForSeller}
                  onChange={(e) => setMessageForSeller(e.target.value)}
                  placeholder="Please leave a message..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-shopee-orange"
                />
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Shipping Option:</h3>
                    <div className="text-sm text-gray-700 mb-1">
                      Get by {shippingInfo.deliveryDate}
                    </div>
                    <div className="text-sm text-gray-700 mb-1">
                      {shippingInfo.method}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {shippingInfo.voucherNote}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button className="px-3 py-1 text-blue-600 hover:text-blue-700 text-sm border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                      Change
                    </button>
                    <div className="text-sm text-gray-600">
                      <span>Shipping fee: </span>
                      <span className="text-shopee-orange font-semibold">₱{shippingInfo.fee}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Tag size={20} className="text-shopee-orange" />
              <span className="font-semibold text-gray-800">Shopee Voucher</span>
            </div>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold hover:underline">
              Select Voucher
            </button>
          </div>

          <div className="flex items-center justify-between py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-shopee-orange flex items-center justify-center">
                <span className="text-white text-xs font-bold">S</span>
              </div>
              <span className="font-semibold text-gray-800">Shopee Coins</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-sm">Coins cannot be redeemed</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-sm">[-₱0]</span>
                <input
                  type="checkbox"
                  disabled
                  className="w-4 h-4 text-shopee-orange border-gray-300 rounded focus:ring-shopee-orange disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-4 border-b border-gray-200">
            <span className="font-semibold text-gray-800">Payment Method</span>
            <div className="flex items-center gap-3">
              <span className="text-gray-700">{paymentMethod}</span>
              <span className="text-xs text-gray-500">(Set by seller)</span>
            </div>
          </div>

          <div className="py-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Merchandise Subtotal</span>
              <span className="text-gray-800 font-semibold">
                ₱{Object.entries(groupedByShop).reduce((sum, [, items]) => {
                  const totals = calculateShopTotal(items);
                  return sum + totals.subtotal;
                }, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Shipping Subtotal</span>
              <span className="text-gray-800 font-semibold">
                ₱{Object.entries(groupedByShop).reduce((sum, [, items]) => {
                  const totals = calculateShopTotal(items);
                  return sum + totals.shipping;
                }, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Voucher Discount</span>
              <span className="text-red-500 font-semibold">
                -₱{Object.entries(groupedByShop).reduce((sum, [, items]) => {
                  const totals = calculateShopTotal(items);
                  return sum + totals.voucher;
                }, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <span className="text-gray-800 font-semibold text-lg">Total Payment:</span>
              <span className="text-red-500 font-bold text-2xl">
                ₱{Object.entries(groupedByShop).reduce((sum, [, items]) => {
                  const totals = calculateShopTotal(items);
                  return sum + totals.total;
                }, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-[1200px] mx-auto px-5 mb-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 font-bold text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="max-w-[1200px] mx-auto px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <div className="text-sm text-gray-600 mb-1">
                Order Total ({selectedItems.length} Item{selectedItems.length !== 1 ? 's' : ''}):
              </div>
              <div className="text-2xl font-bold text-red-500">
                ₱{Object.entries(groupedByShop).reduce((sum, [, items]) => {
                  const totals = calculateShopTotal(items);
                  return sum + totals.total;
                }, 0).toLocaleString()}
              </div>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={selectedItems.length === 0 || isPlacingOrder}
              className={`px-12 py-4 rounded-lg font-semibold text-lg transition-colors ${
                selectedItems.length === 0 || isPlacingOrder
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-shopee-orange text-white hover:bg-shopee-orange-dark cursor-pointer'
              }`}
            >
              {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>

      <div className="h-24"></div>
      <BuyerFooter />
    </div>
  );
};

export default BuyerCheckout;

