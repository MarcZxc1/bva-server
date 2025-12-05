import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * AuthCallback component handles OAuth redirects
 * When Google OAuth completes, BVA redirects here with a token in the URL
 */
const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuthFromToken, isAuthenticated } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/buyer-login?error=' + encodeURIComponent(error));
        return;
      }

      if (token) {
        try {
          await setAuthFromToken(token);
          // Redirect to dashboard after successful auth
          navigate('/dashboard');
        } catch (err) {
          console.error('Failed to authenticate:', err);
          navigate('/buyer-login?error=auth_failed');
        }
      } else {
        // No token, redirect to login
        navigate('/buyer-login');
      }
    };

    handleCallback();
  }, [searchParams, setAuthFromToken, navigate]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shopee-orange mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
