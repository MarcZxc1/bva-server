# Register/Login 400 Error Fix

## 🔍 Issues Identified

1. **React Router Warnings** - Future flag warnings (non-critical)
2. **400 Bad Request on Register/Login** - Frontend getting 400 errors

## ✅ Fixes Applied

### 1. React Router Future Flags (`bva-frontend/src/App.tsx`)

Added future flags to suppress warnings:
```typescript
<BrowserRouter
  future={{
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  }}
>
```

### 2. Enhanced API Client Error Handling (`bva-frontend/src/lib/api-client.ts`)

**Improved:**
- Better error extraction from axios responses
- Proper handling of 400/401/500 errors
- Clear error messages passed to frontend

### 3. Backend Validation (`server/src/controllers/user.controller.ts`)

**Register Endpoint:**
- ✅ Input validation (email, password required)
- ✅ Email format validation
- ✅ Password length validation (min 6 characters)
- ✅ Better error messages
- ✅ Password type checking

**Login Endpoint:**
- ✅ Input validation
- ✅ Better error messages for OAuth users
- ✅ Consistent error response format

### 4. Password Middleware (`server/src/middlewares/hashPassword.middleware.ts`)

**Improved:**
- Type checking for password
- Better error handling
- Consistent error response format

### 5. User Service Login (`server/src/service/user.service.ts`)

**Improved:**
- Better error messages
- Handles OAuth users (no password)
- Clearer "Invalid email or password" messages

## 🧪 Testing

### Test Register:
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"test123","name":"Test User"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "newuser@example.com",
    "name": "Test User",
    "role": "SELLER",
    "shops": [{"id": "...", "name": "Test User's Shop"}]
  },
  "token": "jwt_token_here",
  "message": "User registered successfully"
}
```

### Test Login:
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"test123"}'
```

## 🐛 Common Issues & Solutions

### Issue: "Email already exists"
**Solution:** Use a different email or login with existing account

### Issue: "Password must be at least 6 characters"
**Solution:** Use a password with 6+ characters

### Issue: "This account uses Google OAuth"
**Solution:** Use Google login button instead

### Issue: "Invalid email or password"
**Solution:** Check email/password are correct

## 📝 Response Format

All endpoints now return consistent format:

**Success:**
```json
{
  "success": true,
  "data": {...},
  "token": "...",
  "message": "..."
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

## 🔧 Debugging

If you still get 400 errors:

1. **Check Browser Console:**
   - Open DevTools → Network tab
   - Look at the failed request
   - Check Request Payload and Response

2. **Check Server Logs:**
   - Look for "Registration error:" or "Login error:" messages
   - Check what the actual error is

3. **Verify Request Format:**
   - Email: valid email format
   - Password: string, 6+ characters
   - Name: optional string

4. **Check Database:**
   - User might already exist
   - Try with a different email

## 🚀 Next Steps

1. **Restart Frontend:** The React Router changes need a restart
2. **Clear Browser Cache:** Clear localStorage if needed
3. **Test Registration:** Try registering with a new email
4. **Test Login:** Try logging in with existing credentials

---

**Status:** ✅ Fixed  
**Date:** December 2024

