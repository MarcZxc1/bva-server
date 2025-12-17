# Facebook Developer App Setup Guide

This guide will help you set up your Facebook Developer App for MarketMate's Facebook publishing feature.

## Prerequisites

- A Facebook account
- A Facebook Page (where you want to publish ads)
- Access to Facebook Developers (https://developers.facebook.com/)

## Step 1: Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **"My Apps"** in the top right
3. Click **"Create App"**
4. Select **"Business"** as the app type
5. Fill in:
   - **App Name**: e.g., "MarketMate" or "Your Business Name"
   - **App Contact Email**: Your email address
   - **Business Account**: Select or create one
6. Click **"Create App"**

## Step 2: Add Facebook Login Product

1. In your app dashboard, go to **"Add Products"** or find **"Facebook Login"** in the left sidebar
2. Click **"Set Up"** on Facebook Login
3. Select **"Web"** as the platform
4. You'll be taken to the Facebook Login settings

## Step 3: Configure OAuth Settings

1. In **Facebook Login > Settings**, add your OAuth Redirect URIs:
   ```
   http://localhost:3000/api/auth/facebook/page-callback
   https://your-domain.com/api/auth/facebook/page-callback
   ```
   (Replace `your-domain.com` with your actual production domain)

2. **Valid OAuth Redirect URIs** should include:
   - Your backend URL + `/api/auth/facebook/page-callback`
   - Both HTTP (for local development) and HTTPS (for production)

## Step 4: Request Required Permissions

1. Go to **"App Review"** in the left sidebar
2. Click **"Permissions and Features"**
3. Request the following permissions:
   - `pages_manage_posts` - To publish posts to Facebook Pages
   - `pages_read_engagement` - To read post engagement metrics
   - `pages_show_list` - To list user's Facebook Pages

4. For each permission:
   - Click **"Request"** or **"Add"**
   - Fill out the required use case description
   - Submit for review (or use in development mode for testing)

## Step 5: Get Your App Credentials

1. Go to **"Settings" > "Basic"** in the left sidebar
2. You'll find:
   - **App ID** - This is your `FACEBOOK_APP_ID`
   - **App Secret** - Click "Show" to reveal, this is your `FACEBOOK_APP_SECRET`

## Step 6: Configure Your Backend

Add these environment variables to your server `.env` file:

```env
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
BASE_URL=http://localhost:3000  # or your production URL
FRONTEND_URL=http://localhost:5173  # or your production frontend URL
```

## Step 7: Test Your Setup

### Development Mode

1. Make sure your app is in **Development Mode** (default for new apps)
2. Add test users in **"Roles" > "Test Users"** if needed
3. Test the connection flow in MarketMate

### Production Mode

1. Submit your app for review (required for public use)
2. Provide:
   - App privacy policy URL
   - Terms of service URL
   - Data deletion instructions URL
   - Use case videos/screenshots
3. Wait for Facebook's approval

## Important Notes

### App Review Process

- **Development Mode**: Only you and test users can use the app
- **Live Mode**: Requires Facebook's approval for public use
- Review typically takes 1-3 business days

### Permissions Explained

- `pages_manage_posts`: Allows publishing posts to your Facebook Pages
- `pages_read_engagement`: Allows reading likes, comments, shares on your posts
- `pages_show_list`: Allows listing all Facebook Pages you manage

### Security Best Practices

1. **Never commit** your App Secret to version control
2. Use environment variables for all credentials
3. Keep your App Secret secure and rotate it if compromised
4. Use HTTPS in production

### Troubleshooting

**Error: "Invalid OAuth Redirect URI"**
- Make sure your redirect URI exactly matches what's configured in Facebook
- Check for trailing slashes
- Ensure protocol (http/https) matches

**Error: "App Not Setup"**
- Make sure Facebook Login product is added
- Verify OAuth redirect URIs are configured
- Check that your app is not in restricted mode

**Error: "Permissions Not Granted"**
- Ensure all required permissions are requested
- Check that permissions are approved (for production)
- Verify user has granted permissions during OAuth flow

**Error: "Page Access Token Invalid"**
- Tokens expire - user may need to reconnect
- Check token expiration in your database
- Re-authenticate if token is expired

## Additional Resources

- [Facebook Graph API Documentation](https://developers.facebook.com/docs/graph-api)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [Page Access Tokens](https://developers.facebook.com/docs/pages/access-tokens)
- [App Review Guide](https://developers.facebook.com/docs/app-review)

## Support

If you encounter issues:
1. Check Facebook's [Status Dashboard](https://developers.facebook.com/status/)
2. Review error messages in your server logs
3. Check Facebook's [Developer Community](https://developers.facebook.com/community/)

