import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import BuyerLandingPage from './features/buyer/BuyerLandingPage';
import BuyerSignUp from './features/buyer/BuyerSignUp';
import BuyerLogIn from './features/buyer/BuyerLogIn';
import BuyerProductDetail from './features/buyer/BuyerProductDetail';
import BuyerAccount from './features/buyer/BuyerAccount';
import BuyerPurchase from './features/buyer/BuyerPurchase';
import Login from './features/auth/components/Login';
import AuthCallback from './features/auth/components/AuthCallback';
import SellerDashboard from './features/seller/components/SellerDashboard';
import MyOrders from './features/seller/components/MyOrders';
import MyIncome from './features/seller/components/MyIncome';

const App: React.FC = () => {
  console.log('App component rendering...');
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Buyer Routes */}
          <Route path="/" element={<BuyerLandingPage />} />
          <Route path="/signup" element={<BuyerSignUp />} />
          <Route path="/buyer-login" element={<BuyerLogIn />} />
          <Route path="/account" element={<BuyerAccount />} />
          <Route path="/purchase" element={<BuyerPurchase />} />
          <Route path="/product/:id" element={<BuyerProductDetail />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Seller Routes */}
          <Route path="/dashboard" element={<SellerDashboard />} />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/income" element={<MyIncome />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;

