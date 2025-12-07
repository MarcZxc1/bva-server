import React, { useState, useEffect } from 'react';
import { User, LogOut, FileText, Bell, Gift, Coins } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import BuyerNavbar from './components/BuyerNavbar';
import BuyerFooter from './components/BuyerFooter';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/api';

const BuyerAccount: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'banks' | 'addresses' | 'password' | 'privacy' | 'notifications'>('profile');
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    phone: '',
    gender: 'other',
    dateOfBirth: '',
    profileImage: null as string | null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/buyer-login');
      return;
    }

    if (user) {
      setFormData({
        username: user.username || '',
        name: user.name || '',
        email: user.email || '',
        phone: user.phoneNumber || '',
        gender: 'other',
        dateOfBirth: '',
        profileImage: null,
      });
    }
  }, [user, isAuthenticated, navigate]);

  React.useEffect(() => {
    // Add style to make navbar static on this page
    const style = document.createElement('style');
    style.textContent = `
      .buyer-account-page nav {
        position: relative !important;
        top: auto !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageSelect = () => {
    // Simulate file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
          setFormData(prev => ({
            ...prev,
            profileImage: event.target.result
          }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.updateProfile({
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phone,
      });
      // Show success message (you can use a toast library here)
      alert('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col buyer-account-page">
      {/* Static Navbar - scrolls away */}
      <div className="relative z-30">
        <BuyerNavbar />
      </div>
      
      <div className="flex-1">
        <div className="max-w-[1200px] mx-auto px-5 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            {/* User Info Card */}
            <div className="bg-white rounded-lg p-6 mb-6">
              <div className="text-center mb-4">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                  {formData.profileImage ? (
                    <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={48} className="text-gray-400" />
                  )}
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{formData.username}</h3>
                <p className="text-sm text-gray-500">✏️ Edit Profile</p>
              </div>
            </div>

            {/* Menu Items */}
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 px-6 py-4 flex items-center gap-2">
                  <User size={18} className="text-shopee-orange" />
                  My Account
                </h4>
              </div>

              <div className="space-y-0">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-6 py-3 text-sm transition-colors ${
                    activeTab === 'profile'
                      ? 'text-shopee-orange font-medium bg-orange-50'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('banks')}
                  className={`w-full text-left px-6 py-3 text-sm transition-colors border-t border-gray-100 ${
                    activeTab === 'banks'
                      ? 'text-shopee-orange font-medium bg-orange-50'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Banks & Cards
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full text-left px-6 py-3 text-sm transition-colors border-t border-gray-100 ${
                    activeTab === 'addresses'
                      ? 'text-shopee-orange font-medium bg-orange-50'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Addresses
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`w-full text-left px-6 py-3 text-sm transition-colors border-t border-gray-100 ${
                    activeTab === 'password'
                      ? 'text-shopee-orange font-medium bg-orange-50'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Change Password
                </button>
                <button
                  onClick={() => setActiveTab('privacy')}
                  className={`w-full text-left px-6 py-3 text-sm transition-colors border-t border-gray-100 ${
                    activeTab === 'privacy'
                      ? 'text-shopee-orange font-medium bg-orange-50'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Privacy Settings
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full text-left px-6 py-3 text-sm transition-colors border-t border-gray-100 ${
                    activeTab === 'notifications'
                      ? 'text-shopee-orange font-medium bg-orange-50'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Notification Settings
                </button>
              </div>

              <div className="border-t border-gray-200 mt-4 pt-4">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-6 py-3 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>

            {/* Additional Menu */}
            <div className="bg-white rounded-lg overflow-hidden mt-6">
              <div className="space-y-0">
                <Link to="/purchase" className="px-6 py-3 border-b border-gray-100 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <FileText size={16} className="text-gray-400" />
                  <span>My Purchase</span>
                </Link>
                <a href="#" className="px-6 py-3 border-b border-gray-100 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <Bell size={16} className="text-gray-400" />
                  <span>Notifications</span>
                </a>
                <a href="#" className="px-6 py-3 border-b border-gray-100 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <Gift size={16} className="text-gray-400" />
                  <span>My Vouchers</span>
                </a>
                <a href="#" className="px-6 py-3 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <Coins size={16} className="text-gray-400" />
                  <span>My Shopee Coins</span>
                </a>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg p-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">My Profile</h2>
                <p className="text-gray-500 mb-8">Manage and protect your account</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Form */}
                  <div className="space-y-6">
                    {/* Username */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-shopee-orange focus:border-transparent"
                      />
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-shopee-orange focus:border-transparent"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="flex-1 px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-shopee-orange focus:border-transparent"
                        />
                        <a href="#" className="text-shopee-orange text-sm font-medium hover:text-shopee-orange-dark">Change</a>
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="flex-1 px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-shopee-orange focus:border-transparent"
                        />
                        <a href="#" className="text-shopee-orange text-sm font-medium hover:text-shopee-orange-dark">Change</a>
                      </div>
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Gender</label>
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            value="male"
                            checked={formData.gender === 'male'}
                            onChange={handleInputChange}
                            className="w-4 h-4"
                          />
                          <span className="text-gray-700">Male</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            value="female"
                            checked={formData.gender === 'female'}
                            onChange={handleInputChange}
                            className="w-4 h-4"
                          />
                          <span className="text-gray-700">Female</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            value="other"
                            checked={formData.gender === 'other'}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-shopee-orange"
                          />
                          <span className="text-gray-700">Other</span>
                        </label>
                      </div>
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date of birth</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleInputChange}
                          placeholder="MM/DD/YYYY"
                          className="flex-1 px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-shopee-orange focus:border-transparent"
                        />
                        <a href="#" className="text-shopee-orange text-sm font-medium hover:text-shopee-orange-dark">Change</a>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="pt-4">
                      <button
                        onClick={handleSave}
                        className="bg-shopee-orange text-white px-12 py-3 rounded font-medium hover:bg-shopee-orange-dark transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  {/* Profile Picture */}
                  <div className="flex flex-col items-center">
                    <div className="w-40 h-40 bg-gray-100 rounded-lg mb-6 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                      {formData.profileImage ? (
                        <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User size={64} className="text-gray-300" />
                      )}
                    </div>
                    <button
                      onClick={handleImageSelect}
                      className="text-shopee-orange font-medium hover:text-shopee-orange-dark mb-3"
                    >
                      Select Image
                    </button>
                    <p className="text-xs text-gray-500 text-center">
                      File size: maximum 1 MB<br />
                      File extension: .JPEG, .PNG
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'banks' && (
              <div className="bg-white rounded-lg p-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Banks & Cards</h2>
                <p className="text-gray-500 mb-8">Manage your payment methods</p>
                <div className="text-center py-12 text-gray-500">
                  <p>No payment methods added yet</p>
                  <button className="mt-4 bg-shopee-orange text-white px-8 py-2 rounded font-medium hover:bg-shopee-orange-dark transition-colors">
                    Add Payment Method
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="bg-white rounded-lg p-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Addresses</h2>
                <p className="text-gray-500 mb-8">Manage your delivery addresses</p>
                <div className="text-center py-12 text-gray-500">
                  <p>No addresses added yet</p>
                  <button className="mt-4 bg-shopee-orange text-white px-8 py-2 rounded font-medium hover:bg-shopee-orange-dark transition-colors">
                    Add Address
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="bg-white rounded-lg p-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Change Password</h2>
                <p className="text-gray-500 mb-8">Update your password to keep your account secure</p>
                <div className="max-w-md space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-shopee-orange focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-shopee-orange focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-shopee-orange focus:border-transparent"
                    />
                  </div>
                  <button className="bg-shopee-orange text-white px-12 py-3 rounded font-medium hover:bg-shopee-orange-dark transition-colors">
                    Update Password
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="bg-white rounded-lg p-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Privacy Settings</h2>
                <p className="text-gray-500 mb-8">Control your privacy and data sharing preferences</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded">
                    <div>
                      <h3 className="font-medium text-gray-800">Profile Visibility</h3>
                      <p className="text-sm text-gray-500">Allow others to see your profile</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded">
                    <div>
                      <h3 className="font-medium text-gray-800">Activity Status</h3>
                      <p className="text-sm text-gray-500">Show when you're online</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white rounded-lg p-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Notification Settings</h2>
                <p className="text-gray-500 mb-8">Manage how you receive notifications</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded">
                    <div>
                      <h3 className="font-medium text-gray-800">Order Updates</h3>
                      <p className="text-sm text-gray-500">Get notified about your orders</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded">
                    <div>
                      <h3 className="font-medium text-gray-800">Promotions</h3>
                      <p className="text-sm text-gray-500">Receive promotional messages</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded">
                    <div>
                      <h3 className="font-medium text-gray-800">New Messages</h3>
                      <p className="text-sm text-gray-500">Get notified of new messages</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Footer */}
      <BuyerFooter />
    </div>
  );
};

export default BuyerAccount;
