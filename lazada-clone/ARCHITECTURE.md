# Lazada Clone - Visual Architecture & Feature Guide

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER BROWSER                             │
│                 (Next.js Frontend)                           │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  Pages:                                              │  │
│   │  • Home (/)              • Login                     │  │
│   │  • Products              • Register                  │  │
│   │  • Cart                  • Profile                   │  │
│   │  • Orders                                            │  │
│   └──────────────────────────────────────────────────────┘  │
│                      ↓ (HTTP/REST)                          │
│         Zustand State Management                            │
│         • Auth Store (user, token)                          │
│         • Cart Store (items, total)                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    (Axios + JWT Token)
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              EXPRESS.JS API SERVER (5000)                   │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  Auth Middleware                                    │  │
│   │  (Verify JWT Token)                                │  │
│   └──────────────────────────────────────────────────────┘  │
│                           ↓                                 │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  API Routes:                                         │  │
│   │  /api/auth        /api/cart       /api/admin        │  │
│   │  /api/products    /api/orders                       │  │
│   └──────────────────────────────────────────────────────┘  │
│                           ↓                                 │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  Controllers (Business Logic)                        │  │
│   │  • authController    • cartController               │  │
│   │  • productController • orderController              │  │
│   │  • adminController                                  │  │
│   └──────────────────────────────────────────────────────┘  │
│                           ↓                                 │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  Models (Mongoose Schemas)                           │  │
│   │  • User      • Product     • Order      • Cart       │  │
│   └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    MONGODB DATABASE                         │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  Collections:                                        │  │
│   │  users      → user accounts & credentials           │  │
│   │  products   → product catalog                       │  │
│   │  orders     → customer orders & history             │  │
│   │  carts      → shopping carts by user                │  │
│   └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 User Journey Map

### New User Journey

```
1. ARRIVE
   ├─→ Visit localhost:3000
   └─→ See home page with featured products

2. REGISTER
   ├─→ Click "Register"
   ├─→ Fill registration form
   ├─→ POST /api/auth/register
   └─→ Logged in, stored in localStorage

3. EXPLORE
   ├─→ Click "Products"
   ├─→ Filter by category/search
   ├─→ GET /api/products?filters
   └─→ See matching products

4. ADD TO CART
   ├─→ Click "Add to Cart" on product
   ├─→ Item added to Zustand cart store
   ├─→ (Can update qty or remove)
   └─→ Cart persisted in localStorage

5. CHECKOUT
   ├─→ Click "Cart" navigation
   ├─→ Review items and total
   ├─→ Click "Proceed to Checkout"
   ├─→ POST /api/orders (with items)
   ├─→ Order created in MongoDB
   ├─→ Cart cleared from Zustand
   └─→ Redirected to orders page

6. TRACK ORDER
   ├─→ Click "Orders" in nav
   ├─→ GET /api/orders
   ├─→ See all user's orders
   └─→ Click to view details
```

---

## 🔐 Authentication Flow

```
REGISTER/LOGIN
    ↓
User submits credentials
    ↓
Backend hashes password (bcryptjs)
    ↓
Stores in MongoDB (User collection)
    ↓
Generates JWT token (signed with JWT_SECRET)
    ↓
Returns token to frontend
    ↓
Frontend stores in localStorage
    ↓
Zustand store updated (user, token, isLoggedIn)
    ↓
SUBSEQUENT REQUESTS
    ↓
Axios interceptor adds: Authorization: Bearer <token>
    ↓
Backend auth middleware verifies token
    ↓
Extracts userId from token
    ↓
Passes to controller as req.userId
    ↓
Request processed with user context
```

---

## 📦 Data Model Relationships

```
USER
├─ id (primary)
├─ email (unique)
├─ password (hashed)
├─ name, phone, address
└─ isAdmin (boolean)

                    ↓ references via user_id
                
CART
├─ id (primary)
├─ user_id (foreign key → USER)
├─ items: [
│   ├─ product_id (foreign key → PRODUCT)
│   └─ quantity
│]
└─ updatedAt

ORDER
├─ id (primary)
├─ user_id (foreign key → USER)
├─ items: [
│   ├─ product_id (foreign key → PRODUCT)
│   ├─ quantity
│   └─ price
│]
├─ totalPrice
├─ status
├─ shippingAddress
└─ createdAt

PRODUCT (shared by CART & ORDER)
├─ id (primary)
├─ name
├─ description
├─ price
├─ category
├─ image
├─ stock
├─ rating
└─ sold (count)
```

---

## 🎯 Feature Matrix

### User Features
| Feature | Status | Pages | API Endpoints |
|---------|--------|-------|---------------|
| Register | ✅ Ready | /register | POST /auth/register |
| Login | ✅ Ready | /login | POST /auth/login |
| Profile View/Edit | ✅ Ready | /profile | GET/PUT /auth/profile |
| Browse Products | ✅ Ready | /products | GET /products |
| Search/Filter | ✅ Ready | /products | GET /products?search&category&sort |
| View Product | ✅ Ready | /products/[id] | GET /products/:id |
| Add to Cart | ✅ Ready | /cart | POST /cart/add |
| Update Cart | ✅ Ready | /cart | PUT /cart/update |
| Remove from Cart | ✅ Ready | /cart | POST /cart/remove |
| Checkout | ✅ Ready | /cart | POST /orders |
| View Orders | ✅ Ready | /orders | GET /orders |
| Cancel Order | ✅ Ready | /orders | PUT /orders/:id/cancel |

### Admin Features
| Feature | Status | API Endpoints |
|---------|--------|---------------|
| Add Product | ✅ Ready | POST /admin/products |
| Edit Product | ✅ Ready | PUT /admin/products/:id |
| Delete Product | ✅ Ready | DELETE /admin/products/:id |
| View All Orders | ✅ Ready | GET /admin/orders |
| Update Order Status | ✅ Ready | PUT /admin/orders/:id/status |
| Dashboard Stats | ✅ Ready | GET /admin/dashboard/stats |

---

## 🗂️ File Organization

```
FRONTEND (Next.js)
src/
├── app/
│   ├── page.tsx                 (Home - featured products)
│   ├── login/page.tsx           (User login)
│   ├── register/page.tsx        (User registration)
│   ├── products/page.tsx        (Product listing with filters)
│   ├── cart/page.tsx            (Shopping cart)
│   ├── orders/page.tsx          (Order history)
│   ├── profile/page.tsx         (User profile)
│   └── globals.css              (Tailwind styles)
├── components/
│   ├── Header.tsx               (Navigation & auth)
│   └── ProductCard.tsx          (Product display)
├── store/
│   └── index.ts                 (Zustand: auth & cart)
├── lib/
│   └── api.ts                   (Axios client + methods)
└── package.json                 (Dependencies)

BACKEND (Express)
backend/
├── controllers/
│   ├── authController.js        (Register, login, profile)
│   ├── productController.js     (Get products, filtering)
│   ├── cartController.js        (Cart CRUD)
│   ├── orderController.js       (Order creation & tracking)
│   └── adminController.js       (Product & order mgmt)
├── models/
│   ├── User.js                  (User schema + validation)
│   ├── Product.js               (Product schema)
│   ├── Order.js                 (Order schema)
│   └── Cart.js                  (Cart schema)
├── routes/
│   ├── auth.js                  (Auth endpoints)
│   ├── products.js              (Product endpoints)
│   ├── cart.js                  (Cart endpoints)
│   ├── orders.js                (Order endpoints)
│   └── admin.js                 (Admin endpoints)
├── middleware/
│   └── auth.js                  (JWT verification)
├── server.js                    (Express setup)
├── seed.js                      (Test data generator)
├── package.json                 (Dependencies)
├── .env                         (Configuration)
└── .env.example                 (Template)
```

---

## 🚀 Deployment Target Locations

```
FRONTEND (Next.js)
• Vercel (recommended - native Next.js support)
• Netlify (works but manual config)
• AWS S3 + CloudFront
• Heroku (with custom build)

BACKEND (Express)
• Heroku (easiest - git push deploy)
• Railway (modern alternative)
• Render (free tier available)
• AWS EC2
• DigitalOcean
• Google Cloud Run

DATABASE (MongoDB)
• MongoDB Atlas (cloud - recommended)
• AWS DocumentDB
• Self-hosted MongoDB (VPS)
```

---

## 📊 API Response Examples

### Login Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "ObjectId",
    "name": "John Doe",
    "email": "john@example.com",
    "isAdmin": false
  }
}
```

### Products List Response
```json
{
  "products": [
    {
      "_id": "ObjectId",
      "name": "Wireless Headphones",
      "price": 99.99,
      "originalPrice": 149.99,
      "discount": 33,
      "image": "url",
      "rating": 4.5
    }
  ],
  "total": 150,
  "pages": 3
}
```

### Order Response
```json
{
  "_id": "ObjectId",
  "user": "ObjectId",
  "items": [
    {
      "product": "ObjectId",
      "quantity": 2,
      "price": 99.99
    }
  ],
  "totalPrice": 199.98,
  "status": "pending",
  "createdAt": "2024-12-04T..."
}
```

---

## 🔄 State Management Flow

### Adding Item to Cart
```
User clicks "Add to Cart"
        ↓
ProductCard component calls addItem()
        ↓
Zustand store updates items[]
        ↓
Component re-renders with new quantity
        ↓
Cart is persisted in client memory
        ↓
(When checkout clicked)
        ↓
Items sent to backend via POST /orders
        ↓
Order created in MongoDB
        ↓
Cart cleared from Zustand
```

---

## 🎓 Key Technology Decisions

| Decision | Why |
|----------|-----|
| **Next.js** | File-based routing, SSR ready, TypeScript support |
| **Express.js** | Lightweight, fast, excellent middleware system |
| **MongoDB** | Document-based, flexible schema, JSON-like data |
| **Zustand** | Lightweight state management, simple API |
| **JWT** | Stateless auth, scalable, industry standard |
| **Tailwind CSS** | Utility-first, responsive, rapid development |
| **TypeScript** | Type safety, better DX, fewer runtime errors |

---

## ✨ Ready to Build!

This architecture supports:
- ✅ Thousands of users
- ✅ Multiple payment providers
- ✅ Advanced search & recommendations
- ✅ Real-time notifications
- ✅ Mobile apps (API reuse)
- ✅ Analytics & reporting

**Start with:** `npm run dev` in both terminals!
