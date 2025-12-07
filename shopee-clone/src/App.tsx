import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { OrderProvider } from './contexts/OrderContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './features/auth/components/Login';
import SellerDashboard from './features/seller/components/SellerDashboard';
import MyOrders from './features/seller/components/MyOrders';
import MyIncome from './features/seller/components/MyIncome';
import MyProducts from './features/seller/components/MyProducts';
import ReturnRefundCancel from './features/seller/components/ReturnRefundCancel';
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
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <CartProvider>
          <OrderProvider>
            <Routes>
              {/* Buyer Routes */}
              <Route path="/" element={<BuyerLandingPage />} />
              <Route path="/signup" element={<BuyerSignUp />} />
              <Route path="/buyer-login" element={<BuyerLogIn />} />
              <Route 
                path="/account" 
                element={
                  <ProtectedRoute requiredRole="BUYER">
                    <BuyerAccount />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/purchase" 
                element={
                  <ProtectedRoute requiredRole="BUYER">
                    <BuyerPurchase />
                  </ProtectedRoute>
                } 
              />
              <Route path="/cart" element={<BuyerCart />} />
              <Route 
                path="/checkout" 
                element={
                  <ProtectedRoute requiredRole="BUYER">
                    <BuyerCheckout />
                  </ProtectedRoute>
                } 
              />
              <Route path="/product/:id" element={<BuyerProductDetail />} />
              
              {/* Seller Routes */}
              <Route path="/login" element={<Login />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute requiredRole="SELLER">
                    <SellerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/orders" 
                element={
                  <ProtectedRoute requiredRole="SELLER">
                    <MyOrders />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/income" 
                element={
                  <ProtectedRoute requiredRole="SELLER">
                    <MyIncome />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/products" 
                element={
                  <ProtectedRoute requiredRole="SELLER">
                    <MyProducts />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/return-refund-cancel" 
                element={
                  <ProtectedRoute requiredRole="SELLER">
                    <ReturnRefundCancel />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </OrderProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

