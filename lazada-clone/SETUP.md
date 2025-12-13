# Lazada Clone - Setup & Quick Start Guide

## Prerequisites Checklist
- [ ] Node.js 16+ installed
- [ ] MongoDB running locally (or have Atlas URL)
- [ ] npm or yarn installed
- [ ] Git installed (optional)

## Step-by-Step Setup

### 1. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
npm install
cd ..
```

### 2. Configure Environment Variables

**Backend (.env)**
```bash
cd backend
# Copy example to actual .env file
cp .env.example .env

# Edit .env with your MongoDB URI and JWT secret
# Change MONGODB_URI if needed, change JWT_SECRET to something secure
```

**Frontend (optional)**
```bash
# Copy example to actual .env.local file
cp .env.example .env.local
# Default API URL is http://localhost:5000/api
```

### 3. Setup MongoDB (if running locally)

**Windows (using MongoDB Community):**
```powershell
# Start MongoDB service
net start MongoDB

# Or run mongod directly
mongod
```

**Mac/Linux:**
```bash
# Start MongoDB
mongod
```

**Or use MongoDB Atlas (Cloud):**
- Go to https://www.mongodb.com/cloud/atlas
- Create free account and cluster
- Get connection string
- Update `MONGODB_URI` in `backend/.env`

### 4. Seed Sample Data (Recommended)

This creates test users and products:

```bash
cd backend
npm run seed
cd ..
```

**Test Credentials Created:**
- User: john@example.com / password123
- Admin: admin@example.com / admin123

### 5. Start the Application

**Option A: Two Terminals (Recommended for Development)**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

Terminal 2 - Frontend:
```bash
npm run dev
# Runs on http://localhost:3000
```

**Option B: One Terminal with Concurrently (if installed)**
```bash
npm run dev:all
```

### 6. Verify Everything Works

✅ Backend running: Visit http://localhost:5000/api/products  
✅ Frontend running: Visit http://localhost:3000  
✅ Can register/login  
✅ Can view products  
✅ Can add to cart  

## Detailed Feature Testing

### User Registration & Authentication
1. Go to http://localhost:3000/register
2. Fill in name, email, password
3. Click Register
4. You should be logged in and redirected to home

### Browsing Products
1. Click "Products" in navigation or go to /products
2. Use filters: search, category, sort
3. Click "Add to Cart" or "View" on a product

### Shopping Cart
1. Add items from products page
2. Go to /cart
3. Update quantities or remove items
4. Click "Proceed to Checkout"
5. Order is created and cart is emptied

### User Profile
1. Go to /profile (after login)
2. View and update your information
3. Changes save to database

### Order History
1. Go to /orders (after login)
2. See all your orders with status
3. Click "View Details" for order info

## Troubleshooting

### Backend won't start - Port 5000 in use
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Or use different port:
PORT=5001 npm run dev
```

### Frontend won't load
- Check if backend is running
- Check network tab in DevTools
- Clear browser cache
- Try incognito mode

### MongoDB connection fails
```bash
# Test MongoDB connection
mongo mongodb://localhost:27017/lazada-clone

# If local MongoDB not running:
mongod  # Start it first
```

### Seed data fails
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- Make sure collections don't exist (deleted by seed script)

### Authentication issues
- Clear localStorage: F12 > Application > Storage > Clear All
- Login again
- Check token in localStorage after login

## Common Development Tasks

### Add a new product category
1. Edit `backend/models/Product.js` to add to enum if needed
2. Edit `src/app/products/page.tsx` select options
3. Product category already filterable

### Create admin account manually
```bash
cd backend
node -e "
const mongoose = require('mongoose');
const User = require('./models/User');
mongoose.connect('mongodb://localhost:27017/lazada-clone');
User.create({
  name: 'New Admin',
  email: 'newadmin@example.com',
  password: 'password',
  isAdmin: true
}).then(() => {
  console.log('Admin created');
  process.exit();
});
"
```

### Reset database
```bash
cd backend
# Drop all collections
mongo mongodb://localhost:27017/lazada-clone
# > db.dropDatabase()

# Reseed data
npm run seed
```

## API Testing with Postman/Insomnia

### 1. Register User
```
POST http://localhost:5000/api/auth/register
Body (JSON):
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

### 2. Login
```
POST http://localhost:5000/api/auth/login
Body (JSON):
{
  "email": "test@example.com",
  "password": "password123"
}
Response includes token - copy it
```

### 3. Get Products
```
GET http://localhost:5000/api/products?search=headphones&sort=price-asc
```

### 4. Add to Cart (requires token)
```
POST http://localhost:5000/api/cart/add
Headers: Authorization: Bearer YOUR_TOKEN_HERE
Body (JSON):
{
  "productId": "PRODUCT_ID_FROM_DB",
  "quantity": 1
}
```

## Production Deployment Checklist

### Before Deploying
- [ ] Change JWT_SECRET to strong random string
- [ ] Use MongoDB Atlas (not local)
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Update CORS settings if needed
- [ ] Set up environment variables on hosting platform
- [ ] Build frontend: `npm run build`
- [ ] Test in production mode locally first

### Deploy Frontend (Vercel recommended)
```bash
# Vercel auto-detects Next.js
vercel --prod
```

### Deploy Backend (Heroku, Railway, Render, etc.)
```bash
# Example with Heroku:
heroku login
heroku create your-app-name
git push heroku main
heroku config:set MONGODB_URI=your_atlas_url
heroku config:set JWT_SECRET=your_secret
```

## Performance Tips

- Use MongoDB indexes on `email` and `user` fields
- Implement pagination for product listings
- Cache featured products (consider Redis)
- Compress images for product catalog
- Use CDN for static assets

## Next Steps

1. **Payment Integration**: Add Stripe or PayPal
2. **Email Notifications**: Add transactional emails
3. **Admin Dashboard**: Build admin UI for stats
4. **Product Search**: Implement full-text search
5. **Reviews System**: Add product reviews
6. **Wishlist**: User wishlist feature

## Support & Resources

- Next.js Docs: https://nextjs.org/docs
- Express Docs: https://expressjs.com/
- MongoDB Docs: https://docs.mongodb.com/
- Zustand: https://github.com/pmndrs/zustand
- Tailwind CSS: https://tailwindcss.com/docs

---

**Happy Coding!** 🚀
