# Shopee-Clone Full Integration Guide

## Overview
This document outlines the complete integration of shopee-clone with the BVA server, making both buyer and seller features fully functional.

## Architecture

```
shopee-clone (Frontend) → API Service Layer → BVA Server → PostgreSQL Database
```

## Completed Integrations

### 1. API Service Layer (`shopee-clone/src/services/api.ts`)
- Centralized API client with authentication
- Handles token management
- Supports all CRUD operations
- Error handling and response unwrapping

### 2. Authentication Context (`shopee-clone/src/contexts/AuthContext.tsx`)
- Global auth state management
- Token persistence
- User session management
- Auto-fetch user on mount

### 3. Server Endpoints

#### Products (`/api/products`)
- `GET /api/products` - Get all products (public)
- `GET /api/products/:id` - Get product by ID (public)
- `GET /api/products/shop/:shopId` - Get products by shop (protected)
- `POST /api/products` - Create product (protected, seller)
- `PUT /api/products/:id` - Update product (protected, seller)
- `DELETE /api/products/:id` - Delete product (protected, seller)

#### Orders (`/api/orders`)
- `POST /api/orders` - Create order (protected, buyer)
- `GET /api/orders/my` - Get my orders (protected)
- `GET /api/orders/:id` - Get order by ID (protected)
- `GET /api/orders/seller/:shopId` - Get seller orders (protected)
- `PATCH /api/orders/:id/status` - Update order status (protected, seller)

#### Seller (`/api/seller`)
- `GET /api/seller/:shopId/dashboard` - Get seller dashboard data
- `GET /api/seller/:shopId/income` - Get seller income/revenue

## Integration Steps for Frontend Components

### Buyer Features

#### 1. Buyer Landing Page (`BuyerLandingPage.tsx`)
```typescript
// Add to component:
import { useEffect, useState } from 'react';
import apiClient from '../services/api';

const [products, setProducts] = useState([]);

useEffect(() => {
  apiClient.getProducts().then(setProducts).catch(console.error);
}, []);
```

#### 2. Buyer Login (`BuyerLogIn.tsx`)
```typescript
// Update form submit handler:
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { login } = useAuth();
const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await login(username, password);
    navigate('/');
  } catch (error) {
    alert('Login failed: ' + error.message);
  }
};
```

#### 3. Buyer Sign Up (`BuyerSignUp.tsx`)
```typescript
// Add registration logic:
import { useAuth } from '../../contexts/AuthContext';

const { register } = useAuth();

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await register({
      username: phoneNumber,
      email: `${phoneNumber}@shopee.local`,
      password: 'default123', // In production, add password field
      role: 'BUYER',
      phoneNumber,
    });
    navigate('/');
  } catch (error) {
    alert('Registration failed: ' + error.message);
  }
};
```

#### 4. Buyer Cart (`BuyerCart.tsx`)
- Already uses CartContext
- On checkout, call `apiClient.createOrder()` with cart items

#### 5. Buyer Account (`BuyerAccount.tsx`)
```typescript
// Add API integration:
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/api';

const { user, updateUser } = useAuth();

const handleSave = async () => {
  try {
    await apiClient.updateProfile(formData);
    updateUser(formData);
    alert('Profile updated!');
  } catch (error) {
    alert('Update failed: ' + error.message);
  }
};
```

#### 6. Buyer Purchase History (`BuyerPurchase.tsx`)
```typescript
// Fetch orders:
import { useEffect, useState } from 'react';
import apiClient from '../services/api';

const [orders, setOrders] = useState([]);

useEffect(() => {
  apiClient.getMyOrders().then(setOrders).catch(console.error);
}, []);
```

### Seller Features

#### 1. Seller Login (`Login.tsx`)
```typescript
// Update form submit:
import { useAuth } from '../../../contexts/AuthContext';

const { login } = useAuth();

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await login(phoneOrEmail, password);
    navigate('/dashboard');
  } catch (error) {
    alert('Login failed: ' + error.message);
  }
};
```

#### 2. Seller Dashboard (`SellerDashboard.tsx`)
```typescript
// Fetch dashboard data:
import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import apiClient from '../../../services/api';

const { user } = useAuth();
const shopId = user?.shops?.[0]?.id;
const [dashboardData, setDashboardData] = useState(null);

useEffect(() => {
  if (shopId) {
    apiClient.getSellerDashboard(shopId).then(setDashboardData);
  }
}, [shopId]);
```

#### 3. Seller Orders (`MyOrders.tsx`)
```typescript
// Fetch orders:
import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import apiClient from '../../../services/api';

const { user } = useAuth();
const shopId = user?.shops?.[0]?.id;
const [orders, setOrders] = useState([]);

useEffect(() => {
  if (shopId) {
    apiClient.getSellerOrders(shopId, {
      status: activeTab === 'all' ? undefined : activeTab,
    }).then(setOrders);
  }
}, [shopId, activeTab]);
```

#### 4. Seller Income (`MyIncome.tsx`)
```typescript
// Fetch income data:
import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import apiClient from '../../../services/api';

const { user } = useAuth();
const shopId = user?.shops?.[0]?.id;
const [incomeData, setIncomeData] = useState(null);

useEffect(() => {
  if (shopId) {
    apiClient.getSellerIncome(shopId, {
      status: activeTab,
      startDate,
      endDate,
    }).then(setIncomeData);
  }
}, [shopId, activeTab, startDate, endDate]);
```

## Environment Variables

Add to `shopee-clone/.env`:
```
VITE_API_URL=http://localhost:3000
```

## Testing Checklist

### Buyer Features
- [ ] User can register as buyer
- [ ] User can login as buyer
- [ ] Landing page displays products from server
- [ ] Product detail page shows real product data
- [ ] Cart persists and syncs
- [ ] Checkout creates order in database
- [ ] Purchase history shows user's orders
- [ ] Account page can update profile

### Seller Features
- [ ] Seller can login
- [ ] Dashboard shows real metrics (revenue, orders, products)
- [ ] Orders page displays seller's orders
- [ ] Orders can be filtered by status
- [ ] Order status can be updated
- [ ] Income page shows revenue breakdown
- [ ] Products can be created/updated/deleted

## Next Steps

1. Update each component file with API integration code
2. Add loading states and error handling
3. Add form validation
4. Test end-to-end flows
5. Add protected routes (redirect to login if not authenticated)

## Notes

- The server uses JWT tokens for authentication
- Tokens are stored in localStorage
- All protected routes require `Authorization: Bearer <token>` header
- The API client automatically adds the token to requests
- On 401 errors, the user is redirected to login

