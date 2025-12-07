import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import shopeeLogo from '../../../assets/Seller/Shopee-logo .png';
import sellerIllustration from '../../../assets/Seller/Untitled-removebg-preview.png';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(phoneOrEmail, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  return (
    <div className="login-container">
      {/* Header */}
      <header className="login-header">
        <div className="header-left">
          <img src={shopeeLogo} alt="Shopee" className="shopee-logo" />
          <span className="seller-centre-text">
            <span className="shopee-text">Shopee</span>
            <span className="seller-centre-label"> Seller Centre</span>
          </span>
        </div>
        <a href="#" className="help-link">Need help?</a>
      </header>

      {/* Main Content */}
      <main className="login-main">
        {/* Left Section - Promotional */}
        <div className="login-left">
          <h1 className="power-seller-title">Be a Power Seller</h1>
          <p className="power-seller-description">
            Manage your shop efficiently on Shopee with our Shopee Seller Centre
          </p>
          <div className="illustration-container">
            <img 
              src={sellerIllustration} 
              alt="Seller illustration" 
              className="seller-illustration"
            />
          </div>
        </div>

        {/* Right Section - Login Form */}
        <div className="login-right">
          <div className="login-card">
            <div className="login-card-header">
              <h2 className="login-title">Log In</h2>
              <button className="qr-login-btn" type="button">
                <svg className="qr-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="7" height="7" stroke="#ee4d2d" strokeWidth="2" fill="none"/>
                  <rect x="14" y="3" width="7" height="7" stroke="#ee4d2d" strokeWidth="2" fill="none"/>
                  <rect x="3" y="14" width="7" height="7" stroke="#ee4d2d" strokeWidth="2" fill="none"/>
                  <rect x="11" y="11" width="2" height="2" fill="#ee4d2d"/>
                  <rect x="15" y="11" width="2" height="2" fill="#ee4d2d"/>
                  <rect x="11" y="15" width="2" height="2" fill="#ee4d2d"/>
                  <rect x="19" y="15" width="2" height="2" fill="#ee4d2d"/>
                  <rect x="15" y="19" width="2" height="2" fill="#ee4d2d"/>
                  <rect x="19" y="19" width="2" height="2" fill="#ee4d2d"/>
                </svg>
                Log in with QR
              </button>
            </div>

            {error && (
              <div className="error-message" style={{ color: 'red', marginBottom: '1rem', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Phone number / Username / Email"
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                />
                <button
                  type="button"
                  className="eye-icon-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="1" y1="1" x2="23" y2="23" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="3" stroke="#666" strokeWidth="2"/>
                      </>
                    )}
                  </svg>
                </button>
              </div>

              <button type="submit" className="login-btn" disabled={isLoading}>
                {isLoading ? 'LOGGING IN...' : 'LOG IN'}
              </button>
            </form>

            <a href="#" className="forgot-password-link">
              Forgot Password
            </a>

            <div className="divider">
              <span className="divider-text">OR</span>
            </div>

            <div className="social-login">
              <button className="social-btn facebook-btn" type="button">
                <svg className="facebook-icon" width="20" height="20" viewBox="0 0 24 24" fill="#1877f2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>
              <button 
                className="social-btn google-btn" 
                type="button"
                onClick={handleGoogleLogin}
              >
                <svg className="google-icon" width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
            </div>

            <div className="signup-section">
              <span className="signup-text">New to Shopee?</span>
              <a href="#" className="signup-link">Sign Up</a>
            </div>

            <button className="main-sub-account-btn" type="button">
              Login with Main/Sub Account
              <span className="arrow-icon">&gt;</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="login-footer">
        <p>© 2025 Shopee. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default Login;

