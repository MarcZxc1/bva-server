import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './SellerDashboard.css';

const Sidebar = () => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({
    order: true,
    product: true,
    fbs: true,
    marketing: true,
    customerService: true,
    finance: true,
    data: true,
    shop: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div 
            className="nav-section-header"
            onClick={() => toggleSection('order')}
          >
            <span>Order</span>
            <span className="section-arrow">
              {expandedSections.order ? '▲' : '▼'}
            </span>
          </div>
          {expandedSections.order && (
            <ul className="nav-items">
              <li>
                <Link 
                  to="/orders" 
                  className={`nav-item ${isActive('/orders') ? 'active' : ''}`}
                >
                  My Orders
                </Link>
              </li>
              <li className="nav-item">Mass Ship</li>
              <li className="nav-item">Handover Centre</li>
              <li className="nav-item">Return/Refund/Cancel</li>
              <li className="nav-item">Shipping Setting</li>
            </ul>
          )}
        </div>

        <div className="nav-section">
          <div 
            className="nav-section-header"
            onClick={() => toggleSection('product')}
          >
            <span>Product</span>
            <span className="section-arrow">
              {expandedSections.product ? '▲' : '▼'}
            </span>
          </div>
          {expandedSections.product && (
            <ul className="nav-items">
              <li className="nav-item">My Products</li>
              <li className="nav-item">Add New Product</li>
              <li className="nav-item">Shopee Standard Product</li>
            </ul>
          )}
        </div>

        <div className="nav-section">
          <div 
            className="nav-section-header"
            onClick={() => toggleSection('fbs')}
          >
            <span>FBS</span>
            <span className="section-arrow">
              {expandedSections.fbs ? '▲' : '▼'}
            </span>
          </div>
          {expandedSections.fbs && (
            <ul className="nav-items">
              <li className="nav-item">Fulfilled by Shopee</li>
            </ul>
          )}
        </div>

        <div className="nav-section">
          <div 
            className="nav-section-header"
            onClick={() => toggleSection('marketing')}
          >
            <span>Marketing Centre</span>
            <span className="section-arrow">
              {expandedSections.marketing ? '▲' : '▼'}
            </span>
          </div>
          {expandedSections.marketing && (
            <ul className="nav-items">
              <li className="nav-item">Marketing Centre</li>
              <li className="nav-item">Shopee Ads</li>
              <li className="nav-item">Affiliate Marketing</li>
              <li className="nav-item">Live & Video</li>
              <li className="nav-item">Discount</li>
              <li className="nav-item">My Shop's Flash Deals</li>
              <li className="nav-item">Vouchers</li>
              <li className="nav-item">Campaign</li>
              <li className="nav-item">Best Price in Shopee</li>
            </ul>
          )}
        </div>

        <div className="nav-section">
          <div 
            className="nav-section-header"
            onClick={() => toggleSection('customerService')}
          >
            <span>Customer Service</span>
            <span className="section-arrow">
              {expandedSections.customerService ? '▲' : '▼'}
            </span>
          </div>
          {expandedSections.customerService && (
            <ul className="nav-items">
              <li className="nav-item">Chat Management</li>
              <li className="nav-item">Review Management</li>
            </ul>
          )}
        </div>

        <div className="nav-section">
          <div 
            className="nav-section-header"
            onClick={() => toggleSection('finance')}
          >
            <span>Finance</span>
            <span className="section-arrow">
              {expandedSections.finance ? '▲' : '▼'}
            </span>
          </div>
          {expandedSections.finance && (
            <ul className="nav-items">
              <li>
                <Link 
                  to="/income" 
                  className={`nav-item ${isActive('/income') ? 'active' : ''}`}
                >
                  My Income
                </Link>
              </li>
              <li className="nav-item">My Balance</li>
              <li className="nav-item">Bank Accounts</li>
              <li className="nav-item">SLoan for Sellers</li>
            </ul>
          )}
        </div>

        <div className="nav-section">
          <div 
            className="nav-section-header"
            onClick={() => toggleSection('data')}
          >
            <span>Data</span>
            <span className="section-arrow">
              {expandedSections.data ? '▲' : '▼'}
            </span>
          </div>
          {expandedSections.data && (
            <ul className="nav-items">
              <li className="nav-item">Business Insights</li>
              <li className="nav-item">Account Health</li>
            </ul>
          )}
        </div>

        <div className="nav-section">
          <div 
            className="nav-section-header"
            onClick={() => toggleSection('shop')}
          >
            <span>Shop</span>
            <span className="section-arrow">
              {expandedSections.shop ? '▲' : '▼'}
            </span>
          </div>
          {expandedSections.shop && (
            <ul className="nav-items">
              <li className="nav-item">Shop Information</li>
              <li className="nav-item">Shop Decoration</li>
              <li className="nav-item">Shop Setting</li>
              <li className="nav-item">Appeal Management</li>
            </ul>
          )}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;

