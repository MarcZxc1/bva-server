# SSO Implementation & Buyer/Seller System Report

**Project:** Business Virtual Assistant (BVA) Backend  
**Date:** December 2024  
**Feature:** Single Sign-On (SSO) Integration with Shopee-Clone & Role-Based User Management

---

## 📋 Executive Summary

This report documents the implementation of Single Sign-On (SSO) functionality that enables seamless authentication between the Shopee-Clone e-commerce platform and the Business Virtual Assistant (BVA) backend. The system now supports role-based user management with distinct implementations for **Sellers** and **Buyers**, each with tailored access and features.

### Key Achievements:
- ✅ SSO integration between Shopee-Clone and BVA
- ✅ Role-based user system (SELLER, BUYER, ADMIN, ANALYST)
- ✅ Automatic shop creation and data seeding for Sellers
- ✅ Google OAuth 2.0 integration
- ✅ Multiple authentication methods support

---

## 🔄 Changes Made

### 1. Database Schema Updates (`server/prisma/schema.prisma`)

#### Role Enum Enhancement
**Before:**
```prisma
enum Role {
  ADMIN
  SELLER
  ANALYST
}
```

**After:**
```prisma
enum Role {
  ADMIN
  SELLER
  BUYER      // ← NEW: Added for buyer role
  ANALYST
}
```

#### User Model Enhancements
**New Fields Added:**
- `googleId` (String?, unique) - For Google OAuth authentication
- `shopeeId` (String?, unique) - For Shopee-Clone SSO integration
- `password` changed to optional (String?) - Supports OAuth users who don't need passwords

**Updated User Model:**
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String?  // Now optional
  googleId  String?  @unique  // NEW
  shopeeId  String?  @unique  // NEW
  name      String?
  firstName String?
  lastName  String?
  role      Role     @default(SELLER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  shops     Shop[]
  notifications Notification[]
}
```

### 2. Service Layer Changes (`server/src/service/user.service.ts`)

#### New Method: `syncShopeeUser()`

**Purpose:** Synchronize users from Shopee-Clone system with role-based initialization.

**Key Features:**
- **Existing User Handling:** Updates `shopeeId` if user already exists
- **New User Creation:** Creates user account with appropriate role
- **Role-Based Logic:**
  - **SELLER:** Automatically creates Shop and seeds with sample data
  - **BUYER:** Creates user account only (no shop)

**Method Signature:**
```typescript
async syncShopeeUser(payload: {
  email: string;
  name?: string;
  role: "SELLER" | "BUYER";
  shopeeId: string;
  password?: string;
})
```

**Implementation Logic:**
1. Check if user exists by email → Update `shopeeId` if missing
2. Check if user exists by `shopeeId` → Update email if changed
3. Create new user if doesn't exist
4. **If SELLER:** Create shop + seed data (async, non-blocking)
5. **If BUYER:** No shop creation

### 3. Controller Changes (`server/src/controllers/user.controller.ts`)

#### New Endpoint: `syncShopeeUser()`

**Responsibilities:**
- Validate incoming payload (email, role, shopeeId required)
- Validate role (must be "SELLER" or "BUYER")
- Call service to sync/create user
- Generate JWT token with userId and role
- Return user data + token for immediate login

**Response Format:**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "SELLER",
    "shopeeId": "shopee_123",
    "createdAt": "2024-12-01T00:00:00.000Z"
  },
  "token": "jwt_token_here",
  "message": "Seller account synced successfully. Shop created and being populated with sample data."
}
```

### 4. Routes Updates (`server/src/routes/user.routes.ts`)

#### New Route Added:
```typescript
// POST /api/users/shopee-sync - Sync user from Shopee-Clone system (SSO)
router.post("/shopee-sync", userController.syncShopeeUser);
```

**Access:** Public (no authentication required for initial sync)

---

## 👥 Buyer vs Seller Implementation

### 🛍️ **SELLER Role**

#### Capabilities:
- ✅ **Full BVA Access** - Complete access to all business management features
- ✅ **Shop Management** - Automatic shop creation upon registration
- ✅ **Product Management** - Manage inventory, products, SKUs
- ✅ **Sales Analytics** - View sales data, forecasts, trends
- ✅ **Campaign Management** - Create and manage marketing campaigns
- ✅ **Inventory Management** - Track stock levels, restocking alerts
- ✅ **AI Features** - Access to AI-powered restocking strategies
- ✅ **Smart Shelf** - At-risk inventory detection
- ✅ **Platform Integrations** - Connect with Shopee, Lazada, TikTok

#### Automatic Initialization:
When a SELLER registers (via SSO or Google OAuth):
1. **User Account Created** with role = SELLER
2. **Shop Created** automatically (Name: "{Name}'s Shop")
3. **Data Seeding Triggered:**
   - 50+ sample products (Filipino grocery items)
   - Inventory records with varying stock levels
   - 60 days of sales history
   - Product categories and pricing
   - At-risk inventory items (low stock, near expiry, slow moving)

#### Shop Seeding Details:
- **Products:** 50+ realistic products across categories:
  - Condiments (UFC Catsup, Datu Puti Soy Sauce, etc.)
  - Beverages (Coke, Sprite, C2 Green Tea, etc.)
  - Snacks (Chippy, Piattos, Nova, etc.)
  - Canned Goods (Century Tuna, Ligo Sardines, etc.)
  - Dairy, Bakery, Household, Personal Care items
- **Inventory:** Stock levels based on product characteristics
- **Sales History:** 60 days of realistic sales patterns with:
  - Weekly seasonality (higher on weekends)
  - Fast-moving vs slow-moving items
  - Random variations for realism

### 🛒 **BUYER Role**

#### Capabilities:
- ✅ **User Account** - Basic account creation
- ✅ **Future Features Ready** - Prepared for:
  - Purchase history tracking
  - Order analysis
  - Personal recommendations
  - Wishlist functionality
  - Review management

#### Limitations:
- ❌ **No Shop Access** - Cannot create or manage shops
- ❌ **No Product Management** - Cannot add/edit products
- ❌ **No Sales Analytics** - Cannot view business metrics
- ❌ **No Campaign Management** - Cannot create marketing campaigns

#### Initialization:
When a BUYER registers (via SSO):
1. **User Account Created** with role = BUYER
2. **No Shop Created** - Buyers don't need shops
3. **No Data Seeding** - Minimal initialization

---

## 🔐 Authentication Methods

The BVA backend now supports **three authentication methods**:

### 1. **Standard Email/Password Authentication**
- **Endpoint:** `POST /api/users/register` and `POST /api/users/login`
- **Use Case:** Direct registration on BVA platform
- **Password:** Required and hashed with bcrypt

### 2. **Google OAuth 2.0**
- **Endpoints:**
  - `GET /api/auth/google` - Initiate OAuth
  - `GET /api/auth/google/callback` - Handle callback
- **Use Case:** Social login with Google account
- **Features:**
  - Automatic user creation if new
  - Automatic shop creation for SELLER role
  - Data seeding for new sellers
  - JWT token generation
  - Redirect to frontend with token

### 3. **Shopee-Clone SSO**
- **Endpoint:** `POST /api/users/shopee-sync`
- **Use Case:** Single Sign-On from Shopee-Clone platform
- **Features:**
  - Role-based initialization (SELLER vs BUYER)
  - Automatic shop creation for SELLER
  - Data seeding for SELLER
  - JWT token for immediate login
  - User sync (updates existing users)

---

## 📡 API Endpoints

### User Management Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/users/register` | Public | Register new user (email/password) |
| POST | `/api/users/login` | Public | Login with email/password |
| GET | `/api/users` | Private | List all users |
| PUT | `/api/users/profile` | Private | Update user profile |
| PUT | `/api/users/password` | Private | Update password |
| **POST** | **`/api/users/shopee-sync`** | **Public** | **Sync user from Shopee-Clone (SSO)** |

### Google OAuth Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/auth/google` | Public | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | Public | Google OAuth callback |

### Standard Auth Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register via auth service |
| POST | `/api/auth/login` | Public | Login via auth service |
| GET | `/api/auth/me` | Private | Get current user profile |
| POST | `/api/auth/logout` | Private | Logout (client-side) |

---

## 🔄 SSO Flow Diagram

```
┌─────────────────┐
│  Shopee-Clone   │
│   Platform      │
└────────┬────────┘
         │
         │ User clicks "Connect to BVA"
         │
         ▼
┌─────────────────────────────────────┐
│  POST /api/users/shopee-sync        │
│  {                                   │
│    email: "user@example.com",        │
│    name: "John Doe",                 │
│    role: "SELLER",                   │
│    shopeeId: "shopee_123"            │
│  }                                   │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  UserService.syncShopeeUser()       │
│                                      │
│  IF user exists:                    │
│    → Update shopeeId                │
│                                      │
│  IF new user:                       │
│    → Create user account            │
│                                      │
│    IF role === "SELLER":           │
│      → Create Shop                  │
│      → Seed shop data (async)       │
│                                      │
│    IF role === "BUYER":             │
│      → No shop creation             │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Generate JWT Token                 │
│  { userId, role }                   │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Return Response                     │
│  {                                   │
│    success: true,                   │
│    data: { user },                   │
│    token: "jwt_token",               │
│    message: "..."                    │
│  }                                   │
└──────────────────────────────────────┘
```

---

## 🗄️ Database Schema Summary

### User Model Fields

| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| `id` | String | Primary Key, UUID | Unique user identifier |
| `email` | String | Unique | User email address |
| `password` | String? | Optional | Hashed password (null for OAuth users) |
| `googleId` | String? | Unique, Optional | Google OAuth identifier |
| `shopeeId` | String? | Unique, Optional | Shopee-Clone user identifier |
| `name` | String? | Optional | Full name |
| `firstName` | String? | Optional | First name |
| `lastName` | String? | Optional | Last name |
| `role` | Role | Default: SELLER | User role (ADMIN, SELLER, BUYER, ANALYST) |
| `createdAt` | DateTime | Auto | Account creation timestamp |
| `updatedAt` | DateTime | Auto | Last update timestamp |

### Role Enum Values

| Role | Description | Shop Access | Data Seeding |
|------|-------------|-------------|--------------|
| **ADMIN** | System administrator | ✅ Yes | ❌ No |
| **SELLER** | Shop owner/seller | ✅ Yes | ✅ Yes (automatic) |
| **BUYER** | Customer/buyer | ❌ No | ❌ No |
| **ANALYST** | Data analyst | ✅ Yes (read-only) | ❌ No |

---

## 🚀 Usage Examples

### Example 1: Sync SELLER from Shopee-Clone

**Request:**
```bash
curl -X POST http://localhost:3000/api/users/shopee-sync \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seller@example.com",
    "name": "John Seller",
    "role": "SELLER",
    "shopeeId": "shopee_seller_123",
    "password": "optional_password"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "seller@example.com",
    "name": "John Seller",
    "role": "SELLER",
    "shopeeId": "shopee_seller_123",
    "createdAt": "2024-12-01T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Seller account synced successfully. Shop created and being populated with sample data."
}
```

**What Happens:**
1. User account created with SELLER role
2. Shop "John Seller's Shop" created automatically
3. Shop seeding starts (async) with 50+ products, inventory, sales history
4. JWT token generated for immediate login

### Example 2: Sync BUYER from Shopee-Clone

**Request:**
```bash
curl -X POST http://localhost:3000/api/users/shopee-sync \
  -H "Content-Type: application/json" \
  -d '{
    "email": "buyer@example.com",
    "name": "Jane Buyer",
    "role": "BUYER",
    "shopeeId": "shopee_buyer_456"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "email": "buyer@example.com",
    "name": "Jane Buyer",
    "role": "BUYER",
    "shopeeId": "shopee_buyer_456",
    "createdAt": "2024-12-01T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Buyer account synced successfully."
}
```

**What Happens:**
1. User account created with BUYER role
2. No shop created
3. No data seeding
4. JWT token generated for immediate login

---

## 🔧 Technical Implementation Details

### Shop Seeding Service

**File:** `server/src/service/shopSeed.service.ts`

**Function:** `seedShopData(shopId: string)`

**What It Does:**
1. Creates 50+ sample products with:
   - Realistic Filipino grocery items
   - Categories: Condiments, Beverages, Snacks, Canned Goods, Dairy, Bakery, Household, Personal Care
   - Pricing and cost information
   - SKU generation
2. Creates inventory records with:
   - Stock levels (0-40 units)
   - Risk-based stock levels (low stock, near expiry, slow moving)
   - Location tracking
3. Generates 60 days of sales history with:
   - Realistic sales patterns
   - Weekly seasonality (weekend boosts)
   - Fast-moving vs slow-moving items
   - Random variations

**Execution:** Runs asynchronously to avoid blocking the SSO response

### Password Handling

- **Standard Users:** Password required and hashed with bcrypt
- **OAuth Users (Google):** Password is null
- **SSO Users (Shopee):** Password optional (can be provided for future direct login)

### Error Handling

- **Validation Errors:** 400 Bad Request with descriptive messages
- **Database Errors:** 500 Internal Server Error with error details
- **Seeding Failures:** Logged but don't fail the user creation (non-blocking)

---

## 📊 Statistics & Metrics

### User Roles Distribution
- **4 Roles:** ADMIN, SELLER, BUYER, ANALYST
- **Default Role:** SELLER (for new registrations)

### Authentication Methods
- **3 Methods:** Email/Password, Google OAuth, Shopee SSO
- **OAuth Providers:** Google (extensible for more)

### Shop Initialization
- **Products Seeded:** 50+ items
- **Sales History:** 60 days
- **Categories:** 8 main categories
- **Seeding Time:** ~2-5 seconds (async, non-blocking)

---

## 🔮 Future Enhancements

### Planned Features for BUYER Role:
1. **Purchase History** - Track orders and purchases
2. **Order Analysis** - Personal spending insights
3. **Wishlist** - Save favorite products
4. **Reviews & Ratings** - Product feedback system
5. **Recommendations** - AI-powered product suggestions

### Potential Improvements:
1. **Role-Based Access Control (RBAC)** - Middleware for route protection
2. **Multi-Shop Support** - Sellers managing multiple shops
3. **Shop Templates** - Pre-configured shop setups
4. **Custom Seeding** - User-selectable product categories
5. **SSO from Other Platforms** - Lazada, TikTok integrations

---

## 🐛 Known Limitations

1. **Seeding is Async:** Shop data may take a few seconds to fully populate
2. **No Role Upgrades:** Users cannot change roles after creation (manual DB update required)
3. **Single Shop per Seller:** Currently one shop per seller (multi-shop support planned)
4. **No Buyer Features Yet:** BUYER role is prepared but features not implemented

---

## 📝 Migration Instructions

To apply these changes to your database:

```bash
cd server

# Option 1: Push schema changes (development)
npx prisma db push

# Option 2: Create migration (production-ready)
npx prisma migrate dev --name add_shopee_sso_and_buyer_role

# Regenerate Prisma Client
npx prisma generate
```

---

## ✅ Testing Checklist

- [x] Database schema updated with BUYER role and shopeeId
- [x] UserService.syncShopeeUser() implemented
- [x] Role-based shop creation working
- [x] Data seeding for SELLER role
- [x] BUYER role creates account only
- [x] JWT token generation
- [x] API endpoint accessible
- [x] Error handling implemented
- [x] Google OAuth integration
- [x] Password optional for OAuth users

---

## 📚 Related Documentation

- **Google OAuth Setup:** See `GEMINI_SETUP_GUIDE.md`
- **Database Schema:** `server/prisma/schema.prisma`
- **API Documentation:** See individual route files
- **Shop Seeding:** `server/src/service/shopSeed.service.ts`

---

## 👥 Contributors

- Backend Development: BVA Team
- SSO Integration: Implemented December 2024
- Role System: SELLER/BUYER distinction

---

**Report Generated:** December 2024  
**Version:** 1.0  
**Status:** ✅ Implementation Complete


