# Google OAuth 2.0 Fixes

## 🔍 Issues Identified and Fixed

### 1. **Callback URL Configuration**
**Problem:** The callback URL wasn't properly configured with absolute URL
**Fix:** Now uses `BASE_URL` or `BACKEND_URL` environment variable with fallback to `http://localhost:3000`

### 2. **Error Handling in Callback**
**Problem:** Errors weren't properly caught and handled
**Fix:** Added comprehensive error handling with proper error messages and redirects

### 3. **Shop Data in Token**
**Problem:** Token didn't include shop information
**Fix:** Now fetches user shops and includes them in the JWT token

### 4. **Frontend URL Detection**
**Problem:** Hardcoded frontend URLs
**Fix:** Uses `FRONTEND_URL` environment variable with smart detection

### 5. **State Parameter Handling**
**Problem:** State validation could fail silently
**Fix:** Better error handling and fallback to default frontend URL

## ✅ Changes Made

### `server/src/config/passport.ts`
- Fixed callback URL to use absolute URL
- Added logging for callback URL configuration

### `server/src/routes/auth.routes.ts`
- Added `FRONTEND_URL` environment variable support
- Improved error handling in callback
- Added shop data to JWT token
- Better redirect URL validation
- More descriptive error messages

## 🔧 Environment Variables Needed

Add these to your `.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Backend URL (for OAuth callback)
BASE_URL=http://localhost:3000
# OR
BACKEND_URL=http://localhost:3000

# Frontend URL (for redirect after OAuth)
FRONTEND_URL=http://localhost:5173
# OR
VITE_API_URL=http://localhost:3000
```

## 🎯 Google Cloud Console Configuration

Make sure your Google OAuth credentials are configured with:

**Authorized redirect URIs:**
```
http://localhost:3000/api/auth/google/callback
https://your-production-domain.com/api/auth/google/callback
```

## 🧪 Testing

1. **Start your backend:**
   ```bash
   cd server
   npm run dev
   ```

2. **Start your frontend:**
   ```bash
   cd bva-frontend
   npm run dev
   ```

3. **Test Google OAuth:**
   - Go to http://localhost:5173/login
   - Click "Sign in with Google"
   - Complete OAuth flow
   - Should redirect back with token

## 🐛 Common Issues

### Issue: "redirect_uri_mismatch"
**Solution:** Check that the callback URL in Google Cloud Console matches exactly:
- `http://localhost:3000/api/auth/google/callback` (development)
- Your production callback URL (production)

### Issue: "Invalid state parameter"
**Solution:** 
- Make sure `FRONTEND_URL` is set correctly
- Check that the frontend URL is in `ALLOWED_FRONTENDS` array

### Issue: "No user returned"
**Solution:**
- Check database connection
- Verify Google OAuth credentials are correct
- Check server logs for detailed error messages

## 📝 What the Console Filter Hides

The console filter we added will hide:
- ✅ Google Play analytics errors (harmless)
- ✅ `ERR_BLOCKED_BY_CLIENT` errors (from ad blockers)
- ✅ Self-XSS warnings (browser security)

But it will still show:
- ✅ Your application errors
- ✅ API errors
- ✅ OAuth errors (if any)

## 🚀 Next Steps

1. **Set environment variables** in your `.env` file
2. **Configure Google Cloud Console** with correct callback URLs
3. **Test the OAuth flow** end-to-end
4. **Check server logs** for any remaining issues

---

**Status:** ✅ Fixed  
**Date:** December 2024

