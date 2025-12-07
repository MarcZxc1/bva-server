import { useState } from 'react';
import shopeeLogo from '../../../assets/Seller/Shopee-logo .png';
import UserDropdown from './UserDropdown';
import './SellerDashboard.css';

const DashboardHeader = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <img src={shopeeLogo} alt="Shopee" className="shopee-logo" />
        <span className="seller-centre-text">
          <span className="shopee-text">Shopee</span>
          <span className="seller-centre-label"> Seller Centre</span>
        </span>
      </div>
      <div className="header-right">
        <div className="profile-dropdown-wrapper">
          <div className="profile-dropdown" onClick={toggleDropdown}>
            <div className="profile-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="8" r="4" fill="#8B5CF6" stroke="#8B5CF6" strokeWidth="1"/>
                <path d="M6 21c0-4 2.5-6 6-6s6 2 6 6" fill="#8B5CF6" stroke="#8B5CF6" strokeWidth="1"/>
              </svg>
            </div>
            <span className="username">theavidbookshop</span>
            <span className="dropdown-arrow">▼</span>
          </div>
          <UserDropdown isOpen={isDropdownOpen} onClose={closeDropdown} />
        </div>
        <div className="header-icons">
          <div className="icon-wrapper">
            <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#ee4d2d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#ee4d2d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="notification-badge">1</span>
          </div>
          <div className="icon-wrapper">
            <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="#ee4d2d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="#ee4d2d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="19" x2="12" y2="23" stroke="#ee4d2d" strokeWidth="2" strokeLinecap="round"/>
              <line x1="8" y1="23" x2="16" y2="23" stroke="#ee4d2d" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="icon-wrapper">
            <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#ee4d2d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="notification-badge">7</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;

