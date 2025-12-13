# Lazada Clone - Quick Reference Card

## 🚀 Start Development (2 Terminals)

**Backend (Terminal 1):**
```bash
cd backend && npm run dev
# → http://localhost:5000
```

**Frontend (Terminal 2):**
```bash
npm run dev
# → http://localhost:3000
```

## 🗄️ Database Setup

**MongoDB Running:**
```bash
mongod
```

**Seed Test Data:**
```bash
cd backend && npm run seed
# Users: john@example.com (user) / admin@example.com (admin)
# Password: password123 / admin123
```

## 📁 Key File Locations

| What | File |
|------|------|
| Frontend pages | `src/app/[page]/page.tsx` |
| Components | `src/components/*.tsx` |
| State (Auth/Cart) | `src/store/index.ts` |
| API Client | `src/lib/api.ts` |
| API Routes | `backend/routes/*.js` |
| Controllers | `backend/controllers/*.js` |
| Models | `backend/models/*.js` |
| Middleware | `backend/middleware/auth.js` |
| Main Server | `backend/server.js` |

## 🛠️ Add New Feature Checklist

### Add API Endpoint
- [ ] Create controller function in `backend/controllers/`
- [ ] Create route in `backend/routes/`
- [ ] Mount route in `backend/server.js`
- [ ] Add API method in `src/lib/api.ts`

### Add Frontend Page
- [ ] Create folder in `src/app/[feature]/`
- [ ] Create `page.tsx` file
- [ ] Import Header component
- [ ] Use API functions from `src/lib/api.ts`

### Add Database Field
- [ ] Update model in `backend/models/`
- [ ] Update controller for create/update
- [ ] Update frontend form if needed
- [ ] Test with API call

## 🔑 Environment Variables

**Backend (.env)**
```env
MONGODB_URI=mongodb://localhost:27017/lazada-clone
JWT_SECRET=your-secret-key
PORT=5000
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 📡 Common API Calls

**Login:**
```javascript
const { data } = await authAPI.login({ 
  email: 'user@example.com', 
  password: 'password123' 
});
localStorage.setItem('token', data.token);
```

**Get Products:**
```javascript
const { data } = await productAPI.getAll({ 
  search: 'laptop',
  category: 'Electronics',
  sort: 'price-asc'
});
```

**Add to Cart:**
```javascript
await cartAPI.addItem({ 
  productId: '...', 
  quantity: 1 
});
```

**Create Order:**
```javascript
await orderAPI.create({
  shippingAddress: { ... },
  paymentMethod: 'credit-card'
});
```

## 🎯 Frontend Routing

| Route | Purpose |
|-------|---------|
| `/` | Home (featured products) |
| `/products` | Product listing with filters |
| `/products/:id` | Product detail (ready) |
| `/cart` | Shopping cart |
| `/orders` | Order history |
| `/login` | User login |
| `/register` | User registration |
| `/profile` | User profile |

## 🔐 Authentication Flow

1. Register/Login → Get JWT token
2. Store token in `localStorage`
3. Axios intercepts requests → adds `Authorization: Bearer <token>`
4. Backend validates token in auth middleware
5. User data available in request object
6. Logout → Clear localStorage, reset Zustand store

## 🛒 Cart State (Zustand)

```javascript
import { useCartStore } from '@/store';

// Get cart items
const items = useCartStore((state) => state.items);

// Add item
useCartStore.getState().addItem(product);

// Update quantity
useCartStore.getState().updateQuantity(productId, 5);

// Remove item
useCartStore.getState().removeItem(productId);

// Clear cart
useCartStore.getState().clearCart();
```

## 👤 Auth Store (Zustand)

```javascript
import { useAuthStore } from '@/store';

// Get user and token
const user = useAuthStore((state) => state.user);
const token = useAuthStore((state) => state.token);
const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

// Set user after login
useAuthStore.getState().setUser(userData, tokenString);

// Logout
useAuthStore.getState().logout();
```

## ⚡ Common Issues & Fixes

**"Can't connect to MongoDB"**
- Check: `mongod` is running
- Check: MONGODB_URI in `.env`

**"Token invalid/expired"**
- Solution: Clear localStorage and login again
- In browser console: `localStorage.clear()`

**"CORS error"**
- Check: Backend is running on 5000
- Check: NEXT_PUBLIC_API_URL in `.env.local`

**"Products not loading"**
- Check: Backend `/api/products` returns data
- Check: Network tab for errors
- Check: Token in headers if auth required

**"Build errors"**
- Clear `.next` folder: `rm -r .next`
- Reinstall deps: `npm install`

## 📦 Deployment Checklist

- [ ] Change JWT_SECRET (production value)
- [ ] Use MongoDB Atlas (not local)
- [ ] Set NODE_ENV=production
- [ ] Frontend: `npm run build && npm start`
- [ ] Backend: Deploy to Heroku/Vercel/Railway
- [ ] Update MONGODB_URI in production env
- [ ] Update API_URL in frontend env

## 📚 Documentation Files

- `README.md` - Full project docs
- `SETUP.md` - Installation & troubleshooting
- `PROJECT_SUMMARY.md` - Feature checklist
- `.github/copilot-instructions.md` - AI guidance
- `QUICK_REF.md` - This file

## 💡 Pro Tips

- Use MongoDB Compass to view collections visually
- Test APIs with Postman before building UI
- Keep backend server running during development
- Use `npm run seed` to reset data for testing
- Check browser DevTools for auth token issues
- Use TypeScript for type checking: `npm run build`

## 🎓 Architecture Reminder

```
React Components
      ↓
Zustand Store (State)
      ↓
Axios API Client (with JWT)
      ↓
Express Routes + Auth Middleware
      ↓
Controllers (Business Logic)
      ↓
MongoDB Models (Data)
```

---

**Quick Start:** Terminal 1: `cd backend && npm run dev` | Terminal 2: `npm run dev` | Visit `localhost:3000`

**Questions?** Check SETUP.md or PROJECT_SUMMARY.md
