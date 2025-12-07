import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import './SellerDashboard.css';

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserDropdown = ({ isOpen, onClose }: UserDropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const userName = user?.name || user?.username || user?.email || 'User';
  const shopName = user?.shops?.[0]?.name || 'My Shop';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="user-dropdown" ref={dropdownRef}>
      <div className="dropdown-header">
        <div className="dropdown-logo">
          <div className="logo-circle">
            <div className="logo-text-top">THE AVID</div>
            <div className="logo-text-bottom">BOOKSHOP</div>
            <div className="logo-books-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#ee4d2d" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="#ee4d2d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="#ee4d2d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 7h8M8 11h8M8 15h4" stroke="#ee4d2d" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>
        <div className="dropdown-username">{userName}</div>
      </div>
      <div className="dropdown-separator"></div>
      <div className="dropdown-menu">
        <div className="dropdown-item">
          <svg className="dropdown-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="9 22 9 12 15 12 15 22" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Shop Information</span>
        </div>
        <div className="dropdown-item">
          <svg className="dropdown-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="3" stroke="#666" strokeWidth="2"/>
            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>Shop Setting</span>
        </div>
        <div className="dropdown-item">
          <svg className="dropdown-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="#666" strokeWidth="2"/>
            <line x1="2" y1="12" x2="22" y2="12" stroke="#666" strokeWidth="2"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="#666" strokeWidth="2"/>
          </svg>
          <span>English</span>
          <span className="dropdown-chevron">&gt;</span>
        </div>
        <div 
          className="dropdown-item" 
          onClick={() => {
            onClose();
            logout();
            navigate('/login');
          }}
        >
          <svg className="dropdown-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="16 17 21 12 16 7" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="21" y1="12" x2="9" y2="12" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>Logout</span>
        </div>
      </div>
    </div>
  );
};

export default UserDropdown;

