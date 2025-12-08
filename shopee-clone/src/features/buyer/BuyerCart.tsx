import React from 'react';
import BuyerNavbar from './components/BuyerNavbar';
import BuyerFooter from './components/BuyerFooter';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ChevronDown, MessageCircle, Minus, Plus } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import apiClient from '../../services/api';

const BuyerCart: React.FC = () => {
  const { cartItems, updateCartItem, removeFromCart, toggleItemSelection, toggleShopSelection, toggleSelectAll, removeSelectedItems } = useCart();
  const navigate = useNavigate();

  const groupedItems = cartItems.reduce((acc, item) => {
    (acc[item.shopName] = acc[item.shopName] || []).push(item);
    return acc;
  }, {} as Record<string, typeof cartItems>);

  const subtotal = cartItems.reduce((sum, item) => item.isSelected ? sum + item.unitPrice * item.quantity : sum, 0);
  const totalSelectedItems = cartItems.filter(item => item.isSelected).length;
  const isAnyItemSelected = totalSelectedItems > 0;
  const isAllItemsSelected = cartItems.length > 0 && cartItems.every(item => item.isSelected);

  const handleQuantityChange = async (id: string, delta: number) => {
    const item = cartItems.find(i => i.id === id);
    if (!item) return;

    const newQuantity = Math.max(1, item.quantity + delta);
    
    // Validate stock availability
    try {
      const productData = await apiClient.getProductById(String(item.productId));
      if (productData.stock !== undefined && productData.stock !== null) {
        if (productData.stock === 0) {
          alert(`${item.name} is out of stock. Please remove it from your cart.`);
          return;
        }
        if (newQuantity > productData.stock) {
          alert(`Only ${productData.stock} units available for ${item.name}.`);
          updateCartItem(id, { quantity: productData.stock });
          return;
        }
      }
    } catch (err) {
      console.error('Error validating stock:', err);
      // Continue with update if stock check fails (non-blocking)
    }

    updateCartItem(id, { quantity: newQuantity });
  };

  const handleQuantityInput = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const item = cartItems.find(i => i.id === id);
    if (!item) return;

    const value = parseInt(e.target.value) || 1;
    const newQuantity = Math.max(1, value);
    
    // Validate stock availability
    try {
      const productData = await apiClient.getProductById(String(item.productId));
      if (productData.stock !== undefined && productData.stock !== null) {
        if (productData.stock === 0) {
          alert(`${item.name} is out of stock. Please remove it from your cart.`);
          return;
        }
        if (newQuantity > productData.stock) {
          alert(`Only ${productData.stock} units available for ${item.name}.`);
          updateCartItem(id, { quantity: productData.stock });
          return;
        }
      }
    } catch (err) {
      console.error('Error validating stock:', err);
      // Continue with update if stock check fails (non-blocking)
    }

    updateCartItem(id, { quantity: newQuantity });
  };

  const handleCheckout = () => {
    if (isAnyItemSelected) {
      navigate('/checkout');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <BuyerNavbar />

      <div className="bg-white py-4 border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-5 flex items-center gap-4">
          <ShoppingCart size={30} className="text-shopee-orange" />
          <h1 className="text-2xl font-bold text-gray-800">Shopping Cart</h1>
        </div>
      </div>

      <div className="flex-1 max-w-[1200px] mx-auto px-5 py-6">
        {cartItems.length === 0 ? (
          <div className="text-center py-20 text-gray-500 text-lg">Your shopping cart is empty.</div>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-4 items-center text-sm text-gray-500 font-semibold py-3 border-b border-gray-200">
              <div className="col-span-5 flex items-center gap-2">
                <input
                  type="checkbox"
                  className="form-checkbox text-shopee-orange rounded"
                  checked={isAllItemsSelected}
                  onChange={toggleSelectAll}
                />
                <span>Product</span>
              </div>
              <div className="col-span-2 text-center">Unit Price</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-center">Total Price</div>
              <div className="col-span-1 text-center">Actions</div>
            </div>

            {Object.entries(groupedItems).map(([shopName, items]) => (
              <div key={shopName} className="bg-white rounded-lg shadow-sm mb-4 mt-4">
                <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                  <input
                    type="checkbox"
                    className="form-checkbox text-shopee-orange rounded"
                    checked={items.every(item => item.isSelected)}
                    onChange={() => toggleShopSelection(shopName)}
                  />
                  <MessageCircle size={18} className="text-gray-500" />
                  <span className="font-semibold text-gray-800">{shopName}</span>
                  <button className="ml-auto px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
                    Chat Now
                  </button>
                </div>

                {items.map(item => (
                  <div key={item.id} className="grid grid-cols-12 gap-4 items-center py-4 px-4 border-b border-gray-100 last:border-b-0">
                    <div className="col-span-5 flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="form-checkbox text-shopee-orange rounded"
                        checked={item.isSelected}
                        onChange={() => toggleItemSelection(item.id)}
                      />
                      <Link to={`/product/${item.productId}`} className="flex items-center gap-3 group">
                        <div className="relative w-20 h-20 flex-shrink-0 border border-gray-200 rounded overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div>
                          <h3 className="text-sm text-gray-800 mb-1 line-clamp-2">{item.fullName || item.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                            <span>Variations:</span>
                            <span className="text-gray-800">{item.variations}</span>
                            <ChevronDown size={14} className="text-gray-400" />
                          </div>
                        </div>
                      </Link>
                    </div>

                    <div className="col-span-2 text-center">
                      <div className="text-shopee-orange font-semibold">₱{item.unitPrice.toLocaleString()}</div>
                      {item.originalPrice && (
                        <div className="text-xs text-gray-400 line-through mt-1">
                          ₱{item.originalPrice.toLocaleString()}
                        </div>
                      )}
                    </div>

                    <div className="col-span-2 text-center">
                      <div className="flex items-center justify-center border border-gray-300 rounded w-28 mx-auto">
                        <button
                          onClick={() => handleQuantityChange(item.id, -1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={14} className={item.quantity <= 1 ? 'text-gray-300' : ''} />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleQuantityInput(item.id, e)}
                          min="1"
                          className="w-12 h-8 text-center border-x border-gray-300 focus:outline-none focus:ring-0 text-gray-700 text-sm"
                        />
                        <button
                          onClick={() => handleQuantityChange(item.id, 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="col-span-2 text-center text-shopee-orange font-semibold">
                      ₱{(item.unitPrice * item.quantity).toLocaleString()}
                    </div>

                    <div className="col-span-1 text-center text-sm">
                      <button onClick={() => removeFromCart(item.id)} className="text-gray-500 hover:text-shopee-orange">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="max-w-[1200px] mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <input
              type="checkbox"
              className="form-checkbox text-shopee-orange rounded"
              checked={isAllItemsSelected}
              onChange={toggleSelectAll}
            />
            <span className="text-gray-700 text-sm">Select All ({totalSelectedItems})</span>
            <button onClick={removeSelectedItems} className="text-gray-500 text-sm hover:text-shopee-orange">
              Delete
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-lg text-gray-700">
              Total ({totalSelectedItems} item{totalSelectedItems !== 1 ? 's' : ''}):
              <span className="text-shopee-orange font-bold text-3xl ml-2">₱{subtotal.toLocaleString()}</span>
            </div>
            <button
              onClick={handleCheckout}
              className={`px-12 py-3 rounded-lg font-semibold text-white text-lg transition-colors ${
                isAnyItemSelected ? 'bg-shopee-orange hover:bg-shopee-orange-dark' : 'bg-gray-300 cursor-not-allowed'
              }`}
              disabled={!isAnyItemSelected}
            >
              Check Out
            </button>
          </div>
        </div>
      </div>
      <BuyerFooter />
    </div>
  );
};

export default BuyerCart;

