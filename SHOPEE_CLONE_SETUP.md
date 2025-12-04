# Shopee Clone - Backend Setup Guide

## 📋 Overview
This is a complete backend implementation for a Shopee-style e-commerce platform with authentication, built using:
- **Node.js** + **Express** + **TypeScript**
- **Prisma ORM** + **PostgreSQL**
- **JWT Authentication** + **bcrypt**
- **Zod** for validation

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install express typescript ts-node @types/node @types/express
npm install prisma @prisma/client
npm install bcrypt jsonwebtoken zod
npm install @types/bcrypt @types/jsonwebtoken
npm install dotenv cors
npm install @types/cors
```

### 2. Set Up Environment Variables
Create `.env` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/shopee_clone"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRATION="24h"
PORT=3000
```

### 3. Initialize Prisma
```bash
# Copy the schema file
cp shopee-clone-schema.prisma prisma/schema.prisma

# Generate Prisma Client
npx prisma generate

# Create the database
npx prisma db push

# OR run migrations
npx prisma migrate dev --name init
```

### 4. Project Structure
```
src/
├── controllers/
│   └── auth.controller.ts
├── services/
│   └── auth.service.ts
├── routes/
│   └── auth.routes.ts
├── middlewares/
│   └── auth.middleware.ts
├── app.ts
└── server.ts
```

### 5. Create Main App File
**src/app.ts**
```typescript
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Shopee Clone API", status: "running" });
});

export default app;
```

**src/server.ts**
```typescript
import app from "./app";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
```

### 6. Run the Server
```bash
# Development
npx ts-node src/server.ts

# OR with ts-node-dev for auto-reload
npm install --save-dev ts-node-dev
npx ts-node-dev src/server.ts
```

---

## 🔐 API Endpoints

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "phoneNumber": "09123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "userId": "1",
      "username": "john_doe",
      "email": "john@example.com",
      "phoneNumber": "09123456789",
      "role": "buyer",
      "coinsBalance": "0.00",
      "createdAt": "2025-12-05T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "john_doe",  // can be username or email
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <your-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "1",
    "username": "john_doe",
    "email": "john@example.com",
    ...
  }
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer <your-token>
```

---

## 🧪 Testing with cURL

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "phoneNumber": "09123456789"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "testuser",
    "password": "password123"
  }'
```

### Get Profile (Protected)
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔒 Security Features

✅ **Password Hashing** - bcrypt with 10 salt rounds
✅ **JWT Tokens** - Secure token-based authentication
✅ **Input Validation** - Zod schema validation
✅ **Role-Based Access** - buyer, seller, admin roles
✅ **Unique Constraints** - Prevents duplicate username/email
✅ **Error Handling** - Proper error messages and status codes

---

## 📝 Database Schema Highlights

- ✅ **user_role_t enum** correctly mapped to `UserRole` enum
- ✅ **numeric(12,2)** mapped to `Decimal`
- ✅ **bigserial** mapped to `BigInt` with `@default(autoincrement())`
- ✅ **timestamp with time zone** mapped to `DateTime @db.Timestamptz(6)`
- ✅ All foreign key relations properly defined
- ✅ Cascade deletes configured where appropriate
- ✅ Indexes preserved from SQL schema

---

## 🛠️ Middleware Usage

### Protect Routes
```typescript
import { authMiddleware } from "./middlewares/auth.middleware";

router.get("/protected", authMiddleware, (req, res) => {
  const userId = (req as any).userId;
  res.json({ message: `Hello user ${userId}` });
});
```

### Role-Based Authorization
```typescript
import { authMiddleware, authorize } from "./middlewares/auth.middleware";

// Only sellers can access
router.post("/products", 
  authMiddleware, 
  authorize("seller", "admin"), 
  productController.create
);
```

---

## 📦 Additional Features to Implement

- [ ] Password reset flow
- [ ] Email verification
- [ ] Refresh tokens
- [ ] Rate limiting
- [ ] Session management
- [ ] OAuth integration (Google, Facebook)
- [ ] Two-factor authentication

---

## 🐛 Common Issues

**Prisma Client not found?**
```bash
npx prisma generate
```

**Database connection error?**
```bash
# Check your DATABASE_URL in .env
# Make sure PostgreSQL is running
```

**BigInt serialization error?**
```typescript
// Add this to handle BigInt in JSON
BigInt.prototype.toJSON = function() {
  return this.toString();
};
```

---

## 📚 Next Steps

1. Implement product management endpoints
2. Add shopping cart functionality
3. Create order processing system
4. Build payment integration
5. Add image upload for products
6. Implement search and filtering
7. Create admin dashboard

---

**🎉 Your Shopee Clone backend is ready!**
