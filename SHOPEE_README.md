# 🛒 Shopee Clone - Backend Implementation

Complete backend implementation for a Shopee-style e-commerce platform with **authentication**, **Prisma ORM**, and **PostgreSQL**.

---

## 📦 Files Created

### 1. **Prisma Schema** (`shopee-clone-schema.prisma`)
- ✅ Complete database schema with 20+ models
- ✅ UserRole enum (buyer, seller, admin)
- ✅ All relations properly defined
- ✅ Proper data types (BigInt, Decimal, DateTime)
- ✅ Indexes and constraints

### 2. **Authentication System**

#### **auth.service.ts** - Business Logic
- User registration with validation
- Login with username/email
- Password hashing with bcrypt
- JWT token generation
- Token verification

#### **auth.controller.ts** - Request Handlers
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

#### **auth.routes.ts** - Route Definitions
- Public routes (register, login)
- Protected routes (me, logout)

#### **auth.middleware.ts** - Security
- JWT token verification
- Role-based authorization
- Request protection

### 3. **Configuration Files**
- `shopee-package.json` - Dependencies
- `shopee-tsconfig.json` - TypeScript config
- `SHOPEE_CLONE_SETUP.md` - Setup guide
- `shopee-api-tests.http` - API test examples

---

## 🚀 Quick Start

### Step 1: Copy Files to Your Project

```bash
# Create project directory
mkdir shopee-clone-backend
cd shopee-clone-backend

# Copy Prisma schema
cp shopee-clone-schema.prisma prisma/schema.prisma

# Copy auth files
mkdir -p src/controllers src/services src/routes src/middlewares
cp shopee-auth/auth.controller.ts src/controllers/
cp shopee-auth/auth.service.ts src/services/
cp shopee-auth/auth.routes.ts src/routes/
cp shopee-auth/auth.middleware.ts src/middlewares/

# Copy configs
cp shopee-package.json package.json
cp shopee-tsconfig.json tsconfig.json
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Environment

Create `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/shopee_clone"
JWT_SECRET="your-super-secret-key-change-this"
JWT_EXPIRATION="24h"
PORT=3000
```

### Step 4: Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Optional: Run migrations instead
npx prisma migrate dev --name init
```

### Step 5: Create App Files

**src/app.ts:**
```typescript
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({ 
    message: "Shopee Clone API", 
    status: "running",
    version: "1.0.0"
  });
});

export default app;
```

**src/server.ts:**
```typescript
import app from "./app";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api/auth`);
});
```

### Step 6: Run the Server

```bash
npm run dev
```

---

## 🔐 API Endpoints

### Register
```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "phoneNumber": "09123456789"
}
```

### Login
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "identifier": "john_doe",  # username or email
  "password": "password123"
}
```

### Get Profile (Protected)
```bash
GET http://localhost:3000/api/auth/me
Authorization: Bearer <your-jwt-token>
```

---

## 🗂️ Database Models

| Model | Description |
|-------|-------------|
| **AppUser** | User accounts (buyers, sellers, admins) |
| **Address** | User delivery addresses |
| **Shop** | Seller shops |
| **Product** | Product listings |
| **ProductVariation** | Product variants (size, color, etc) |
| **Category** | Product categories (hierarchical) |
| **CartItem** | Shopping cart items |
| **Order** | Customer orders |
| **OrderItem** | Items in orders |
| **Voucher** | Discount vouchers |
| **ProductReview** | Product ratings & reviews |
| **ChatSession** | Buyer-Seller chat sessions |
| **ChatMessage** | Chat messages |
| **Shipment** | Order shipping info |
| **PaymentMethod** | User payment methods |
| **WishlistItem** | User wishlists |
| **RecentlyViewed** | Browsing history |
| **FollowedShop** | Followed shops |
| **CoinHistory** | Coins transaction history |

---

## 🛡️ Security Features

✅ **bcrypt** - Password hashing (10 rounds)
✅ **JWT** - Stateless authentication
✅ **Zod** - Input validation & sanitization
✅ **Role-based access** - buyer, seller, admin
✅ **Unique constraints** - No duplicate usernames/emails
✅ **Protected routes** - Middleware authentication
✅ **Error handling** - Proper HTTP status codes

---

## 📝 Schema Highlights

### Correct Enum Mapping
```prisma
enum UserRole {
  buyer
  seller
  admin
  @@map("user_role_t")  // Maps to SQL enum
}
```

### Proper Data Types
- `bigserial` → `BigInt @default(autoincrement())`
- `numeric(12,2)` → `Decimal @db.Decimal(12, 2)`
- `timestamp with time zone` → `DateTime @db.Timestamptz(6)`
- `character varying(N)` → `String @db.VarChar(N)`

### Relations Example
```prisma
model CartItem {
  userId BigInt?
  user   AppUser? @relation(fields: [userId], references: [userId], onDelete: Cascade)
}
```

---

## 🧪 Testing

Use the `shopee-api-tests.http` file with REST Client extension in VS Code, or use cURL:

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"pass123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test","password":"pass123"}'
```

---

## 📊 Database Structure

```
PostgreSQL Database: shopee_clone
├── app_user (users with roles)
├── address (delivery addresses)
├── shop (seller shops)
├── product (product listings)
├── product_variation (SKUs, sizes, colors)
├── product_image (product photos)
├── category (hierarchical categories)
├── cart_item (shopping carts)
├── order (customer orders)
├── order_item (order details)
├── voucher (discount codes)
├── user_voucher (claimed vouchers)
├── product_review (ratings & reviews)
├── chat_session (buyer-seller chats)
├── chat_message (chat messages)
├── shipment (delivery tracking)
├── payment_method (saved payments)
├── wishlist_item (saved for later)
├── recently_viewed (browsing history)
├── followed_shop (followed stores)
└── coin_history (loyalty points)
```

---

## 🔧 Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to DB (no migrations)
npx prisma db push

# Create migration
npx prisma migrate dev --name <migration-name>

# Deploy migrations to production
npx prisma migrate deploy

# Open Prisma Studio (GUI)
npx prisma studio

# Seed database
npx prisma db seed
```

---

## 📚 Next Steps

1. ✅ **Authentication** - DONE
2. ⬜ **Product Management** - CRUD operations
3. ⬜ **Shopping Cart** - Add/remove items
4. ⬜ **Order Processing** - Checkout flow
5. ⬜ **Payment Integration** - Stripe/PayPal
6. ⬜ **Image Upload** - Cloudinary/S3
7. ⬜ **Search & Filters** - Elasticsearch
8. ⬜ **Real-time Chat** - Socket.io
9. ⬜ **Admin Dashboard** - Manage platform
10. ⬜ **Seller Dashboard** - Manage shop

---

## 🐛 Troubleshooting

**Issue: Prisma Client not found**
```bash
npx prisma generate
```

**Issue: Database connection failed**
```bash
# Check DATABASE_URL in .env
# Ensure PostgreSQL is running
docker ps  # if using Docker
```

**Issue: BigInt JSON serialization**
```typescript
// Add to server.ts
BigInt.prototype.toJSON = function() {
  return this.toString();
};
```

**Issue: Token expired**
```bash
# Increase JWT_EXPIRATION in .env
JWT_EXPIRATION="7d"
```

---

## 📖 Documentation

- [Prisma Docs](https://www.prisma.io/docs)
- [Express Docs](https://expressjs.com/)
- [JWT Docs](https://jwt.io/)
- [Zod Docs](https://zod.dev/)

---

## 📄 License

MIT

---

## 👨‍💻 Author

Built with ❤️ using TypeScript, Prisma, and Express

---

**🎉 Your Shopee Clone backend is ready to use!**

Start building your e-commerce empire! 🚀
