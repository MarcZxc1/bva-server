# Copilot Instructions for Lazada Clone

## Project Overview
Full-stack e-commerce platform built with Next.js (frontend), Express.js (backend), and MongoDB. Implements product catalog, shopping cart, user authentication, and order management.

## Architecture at a Glance

**Frontend (Next.js + TypeScript)**
- App Router for file-based routing
- Zustand for client state (auth, cart)
- Tailwind CSS for styling
- Axios with JWT interceptors for API calls

**Backend (Express.js)**
- RESTful API with JWT authentication
- MongoDB models for Users, Products, Orders, Carts
- Role-based access (user vs admin)
- Middleware for auth verification

**Data Flow**: React components → Zustand store → Axios API calls → Express routes → MongoDB

## Critical Developer Workflows

### Start Full Application
```bash
# Terminal 1 - Backend
cd backend && npm run dev
# Runs on port 5000

# Terminal 2 - Frontend  
npm run dev
# Runs on port 3000
```

### Add New API Endpoint
1. Create controller function in `backend/controllers/`
2. Define route in `backend/routes/`
3. Add API client method in `src/lib/api.ts`
4. Create/use component with API call

### Add Frontend Page
1. Create folder in `src/app/[page]/`
2. Create `page.tsx` inside folder
3. Import `Header` component for consistency
4. Use API functions from `src/lib/api.ts`

### Work with Database
- Mongoose schemas in `backend/models/`
- Models auto-populate references via `.populate()`
- Always hash passwords with bcryptjs before saving

## Project-Specific Patterns

### Authentication Pattern
- JWT tokens stored in localStorage on client
- Axios interceptor automatically adds `Authorization: Bearer <token>` header
- Backend validates token in auth middleware
- Roles: regular user vs `isAdmin: true`

### Cart State Management
- Client-side cart in Zustand (temporary)
- Synced to backend on checkout via `orderAPI.create()`
- Cart cleared after successful order
- Real cart persists in `Cart` collection (user-based)

### Product Filtering
- Query params: `search`, `category`, `sort`, `page`, `limit`
- Backend aggregates MongoDB filters
- Frontend passes params from filter form to API

### Error Handling Convention
- Backend returns: `{ error: "message" }` with appropriate HTTP status
- Frontend catches errors and alerts user
- No global error toast setup yet (consider adding)

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/store/index.ts` | Auth & Cart state stores |
| `src/lib/api.ts` | API client with interceptors |
| `backend/middleware/auth.js` | JWT verification middleware |
| `backend/models/*.js` | MongoDB schemas (single source of truth for data) |
| `backend/controllers/*.js` | Business logic for routes |
| `src/app/[page]/page.tsx` | Client pages (always import Header) |

## Common Tasks

**Add Product Field**
1. Update schema in `backend/models/Product.js`
2. Update admin create/edit endpoints in `backend/controllers/adminController.js`
3. Update ProductCard display in `src/components/ProductCard.tsx`

**Create New API Route**
1. Controller: `backend/controllers/[feature]Controller.js`
2. Route: `backend/routes/[feature].js`
3. Register in `backend/server.js`: `app.use('/api/[feature]', require('./routes/[feature]'))`
4. Client: Add method to `src/lib/api.ts`

**Implement Feature Requiring Auth**
- Use `auth` middleware for regular users
- Use `adminAuth` middleware for admin-only endpoints
- Frontend: Check `useAuthStore.isLoggedIn` before showing UI

## Integration Points

- **Token Persistence**: localStorage synced on app load in `Header.tsx` `useEffect`
- **Cart API**: `cartAPI.getCart()` fetches server cart; Zustand is client-side preview
- **Real Product Data**: All products from MongoDB via `productAPI.getAll()`
- **Order Creation**: Cart items → Order document → Cart cleared → New empty Cart created

## TypeScript Conventions

- Zustand stores typed with interfaces (see `src/store/index.ts`)
- Zustand selectors use `(state: any)` due to zustand typing complexity
- Components imported from `@/` alias (configured in tsconfig)
- API responses typed minimally; use `any` for dynamic product/order objects

## Environment Setup

**Frontend** (`NEXT_PUBLIC_API_URL`):
- Default: `http://localhost:5000/api`
- Used in `src/lib/api.ts` baseURL

**Backend** (`backend/.env`):
- `MONGODB_URI`: Connection string (default: local MongoDB)
- `JWT_SECRET`: Signing key (change in production)
- `PORT`: Server port (default: 5000)

## Testing & Debugging

- **Backend logs**: Console output from Express (check terminal)
- **Frontend errors**: Browser console + network tab (F12)
- **MongoDB**: Use MongoDB Compass to inspect collections
- **Auth issues**: Check `localStorage.getItem('token')` in browser console

## Production Considerations

- Change `JWT_SECRET` to strong random string
- Use MongoDB Atlas for cloud database
- Enable HTTPS in production
- Implement token refresh mechanism
- Add rate limiting to API endpoints
- Validate file uploads (multer config)
- Consider CDN for product images

## Known Limitations & TODOs

- Payment integration not implemented (currently just creates order)
- No email notifications
- No product reviews implemented
- Cart synced to server only on checkout (not real-time)
- Admin dashboard UI not created (API exists)
- Image upload not fully configured
