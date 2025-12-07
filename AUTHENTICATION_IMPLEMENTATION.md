# Authentication Implementation Guide

## Overview
Complete authentication system for shopee-clone with Google OAuth 2.0, state management, and performance optimizations.

## Features Implemented

### 1. Enhanced AuthContext (`shopee-clone/src/contexts/AuthContext.tsx`)
- **Google OAuth Integration**: Handles OAuth callback with token extraction
- **State Management**: Memoized context values for performance
- **Error Handling**: Centralized error state management
- **Auto-redirect**: Role-based navigation after login
- **Token Persistence**: Automatic token storage and retrieval

### 2. Protected Routes (`shopee-clone/src/components/ProtectedRoute.tsx`)
- **Role-based Access**: Enforces BUYER/SELLER role requirements
- **Loading States**: Shows spinner during authentication check
- **Redirect Logic**: Redirects to appropriate login page
- **Performance**: Uses React.memo and useMemo for optimization

### 3. Seller Login (`shopee-clone/src/features/auth/components/Login.tsx`)
- **Form Validation**: Real-time validation with disabled states
- **Google OAuth**: Integrated Google login button
- **Error Display**: Inline error messages
- **Loading States**: Disabled form during submission
- **Performance**: useCallback and useMemo hooks

### 4. Buyer Login (`shopee-clone/src/features/buyer/BuyerLogIn.tsx`)
- **Full Integration**: Connected to AuthContext
- **Google OAuth**: Buyer-specific Google login
- **Error Handling**: Display errors from AuthContext
- **Optimized**: React.memo wrapper for performance

### 5. Buyer Sign Up (`shopee-clone/src/features/buyer/BuyerSignUp.tsx`)
- **Multi-step Form**: Phone → Email/Password flow
- **Validation**: Real-time password length validation
- **Google OAuth**: Integrated Google signup
- **Error Display**: Context-aware error messages
- **Performance**: Memoized component with useCallback

### 6. API Client Updates (`shopee-clone/src/services/api.ts`)
- **Server Compatibility**: Matches server's email/password format
- **Shop Fetching**: Automatically includes shops in user data
- **Error Handling**: Proper error unwrapping

### 7. Server Updates (`server/src/controllers/auth.controller.ts`)
- **Shop Inclusion**: getMe endpoint now returns user shops
- **Consistent Response**: Standardized response format

## Google OAuth Flow

1. **User clicks "Google" button** → `handleGoogleAuth('BUYER' | 'SELLER')`
2. **Redirects to** → `http://localhost:3000/api/auth/google?state=<frontend_url>&role=<role>`
3. **Google authenticates** → Redirects to `/api/auth/google/callback`
4. **Server creates/finds user** → Generates JWT token
5. **Redirects back** → `http://localhost:5173/login?token=<jwt_token>`
6. **AuthContext detects token** → Extracts from URL, sets in state
7. **Fetches user data** → Calls `/api/auth/me` with token
8. **Redirects user** → Based on role (SELLER → /dashboard, BUYER → /)

## State Management

### AuthContext Features
- **Memoized Values**: Prevents unnecessary re-renders
- **Optimized Callbacks**: useCallback for stable function references
- **Computed Values**: useMemo for derived state
- **Error State**: Centralized error handling

### useAuthState Hook (`shopee-clone/src/hooks/useAuthState.ts`)
- **Derived Values**: isBuyer, isSeller, isAdmin
- **Shop Info**: shopId, shopName
- **User Info**: userName
- **Performance**: All values memoized

## Performance Optimizations

### 1. React.memo
- ProtectedRoute component
- BuyerLogIn component
- BuyerSignUp component
- LoadingSpinner component

### 2. useCallback
- All event handlers
- API calls
- Navigation functions

### 3. useMemo
- Computed values in AuthContext
- Form validation states
- Error messages

### 4. Code Splitting
- Components are lazy-loadable
- Protected routes prevent unnecessary renders

## Environment Variables

Add to `shopee-clone/.env`:
```env
VITE_API_URL=http://localhost:3000
```

## Usage Examples

### Login (Buyer)
```typescript
const { login, isLoading, error } = useAuth();

await login('user@example.com', 'password123');
// Automatically redirects to '/' for buyers
```

### Login (Seller)
```typescript
const { login, isLoading, error } = useAuth();

await login('seller@example.com', 'password123');
// Automatically redirects to '/dashboard' for sellers
```

### Google OAuth
```typescript
const { handleGoogleAuth } = useAuth();

// Buyer
handleGoogleAuth('BUYER');

// Seller
handleGoogleAuth('SELLER');
```

### Protected Route
```typescript
<ProtectedRoute requiredRole="SELLER">
  <SellerDashboard />
</ProtectedRoute>
```

### Access User State
```typescript
const { user, isAuthenticated, shopId, userName } = useAuthState();
```

## Testing Checklist

- [ ] Buyer can register with email/password
- [ ] Buyer can login with email/password
- [ ] Buyer can login with Google OAuth
- [ ] Seller can login with email/password
- [ ] Seller can login with Google OAuth
- [ ] Protected routes redirect unauthenticated users
- [ ] Role-based access control works
- [ ] Token persists across page refreshes
- [ ] Logout clears token and redirects
- [ ] Error messages display correctly
- [ ] Loading states show during API calls
- [ ] Google OAuth callback handles token correctly

## Security Features

1. **JWT Tokens**: Secure token-based authentication
2. **Password Hashing**: Bcrypt with salt rounds
3. **Token Expiration**: Configurable expiration time
4. **Protected Routes**: Server-side and client-side protection
5. **Role-based Access**: Enforced at route level
6. **HTTPS Ready**: Works with HTTPS in production

## Performance Metrics

- **Initial Load**: AuthContext checks token on mount
- **Re-renders**: Minimized with memoization
- **API Calls**: Cached user data in context
- **Form Validation**: Debounced where appropriate

## Next Steps

1. Add password reset functionality
2. Add email verification
3. Add two-factor authentication (optional)
4. Add session timeout handling
5. Add refresh token rotation

