import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { OrderProvider } from './contexts/OrderContext';
import Login from './features/auth/components/Login';
import SellerDashboard from './features/seller/components/SellerDashboard';
import MyOrders from './features/seller/components/MyOrders';
import MyIncome from './features/seller/components/MyIncome';
import BuyerLandingPage from './features/buyer/BuyerLandingPage';
import BuyerSignUp from './features/buyer/BuyerSignUp';
import BuyerLogIn from './features/buyer/BuyerLogIn';
import BuyerProductDetail from './features/buyer/BuyerProductDetail';
import BuyerAccount from './features/buyer/BuyerAccount';
import BuyerPurchase from './features/buyer/BuyerPurchase';
import BuyerCart from './features/buyer/BuyerCart';
import BuyerCheckout from './features/buyer/BuyerCheckout';

function App() {
  return (
    <CartProvider>
      <OrderProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            {/* Buyer Routes */}
            <Route path="/" element={<BuyerLandingPage />} />
            <Route path="/signup" element={<BuyerSignUp />} />
            <Route path="/buyer-login" element={<BuyerLogIn />} />
            <Route path="/account" element={<BuyerAccount />} />
            <Route path="/purchase" element={<BuyerPurchase />} />
            <Route path="/cart" element={<BuyerCart />} />
            <Route path="/checkout" element={<BuyerCheckout />} />
            <Route path="/product/:id" element={<BuyerProductDetail />} />
            
            {/* Seller Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<SellerDashboard />} />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/income" element={<MyIncome />} />
          </Routes>
        </Router>
      </OrderProvider>
    </CartProvider>
  );
}

export default App;

