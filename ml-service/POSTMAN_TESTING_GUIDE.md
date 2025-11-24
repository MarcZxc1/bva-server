# 📮 Postman Testing Guide - BVA Ad Generation API

Complete guide for testing all ad generation endpoints using Postman.

---

## 🚀 Quick Start (3 Steps)

### Step 1: Import the Collection

1. **Open Postman**
2. Click **"Import"** button (top left)
3. Select **"File"** tab
4. Choose `BVA_Ad_Generation.postman_collection.json`
5. Click **"Import"**

✅ You now have all 7 endpoints ready to test!

---

### Step 2: Start Your Server

Make sure your FastAPI server is running:

```powershell
cd ml-service
uvicorn app.main:app --reload --port 8000
```

**Expected Output:**

```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

---

### Step 3: Test an Endpoint

1. In Postman, expand **"BVA - Ad Generation API"** collection
2. Expand **"New Data-Driven Endpoints"** folder
3. Click **"Generate Bestseller Ad"**
4. Click the blue **"Send"** button
5. See the response! 🎉

---

## 📋 Collection Overview

The collection includes **7 endpoints** organized in 3 folders:

### 📁 Folder 1: Original Endpoints (2 endpoints)

- Generate Ad Copy (Text)
- Generate Ad Image (Playbook)

### 📁 Folder 2: New Data-Driven Endpoints (5 endpoints)

- Generate Bestseller Ad
- Generate Bundle Ad
- Generate Dynamic Ad - Professional Style
- Generate Dynamic Ad - Energetic Style
- Generate Dynamic Ad - Minimalist Style

### 📁 Folder 3: Health Check (2 endpoints)

- Root Endpoint
- API Documentation

---

## 🎯 How to Test Each Endpoint

### 1️⃣ **Generate Bestseller Ad** (Easiest!)

**What it does:** Auto-generates an ad for the #1 bestselling product.

**Steps:**

1. Select **"Generate Bestseller Ad"** request
2. Click **"Send"** (No body needed!)
3. View response in the bottom panel

**Expected Response:**

```json
{
  "message": "Bestseller ad generated successfully!",
  "product_name": "Kopiko Coffee",
  "category": "Groceries",
  "image_path": "generated_images/bestseller_Kopiko_Coffee_1234567890.png"
}
```

**Status Code:** `200 OK`

---

### 2️⃣ **Generate Bundle Ad**

**What it does:** Creates a "Bundle Up & Save" promotional ad.

**Steps:**

1. Select **"Generate Bundle Ad"** request
2. Review the pre-filled request body:
   ```json
   {
     "main_product": "Phone Case - Old Model",
     "bundle_item": "Premium Phone Charger",
     "final_price": 350.0
   }
   ```
3. _Optional:_ Edit the values to test with different products
4. Click **"Send"**

**Expected Response:**

```json
{
  "message": "Bundle ad generated successfully!",
  "main_product": "Phone Case - Old Model",
  "bundle_item": "Premium Phone Charger",
  "final_price": 350.0,
  "image_path": "generated_images/bundle_Phone_Case_1234567890.png"
}
```

**Status Code:** `200 OK`

---

### 3️⃣ **Generate Dynamic Ad** (Most Flexible!)

**What it does:** Creates custom ads with YOUR creative direction.

We have **3 pre-configured examples** for different styles:

#### A. Professional Style

**Steps:**

1. Select **"Generate Dynamic Ad - Professional Style"**
2. Review the request body:
   ```json
   {
     "product_data": {
       "name": "SkyFlakes Crackers",
       "price": 50,
       "category": "Snacks",
       "brand": "Monde Nissin"
     },
     "user_prompt": "Make it professional with blue and gold tones."
   }
   ```
3. Click **"Send"**

#### B. Energetic Style

1. Select **"Generate Dynamic Ad - Energetic Style"**
2. Click **"Send"**

#### C. Minimalist Style

1. Select **"Generate Dynamic Ad - Minimalist Style"**
2. Click **"Send"**

**Expected Response:**

```json
{
  "message": "Dynamic ad generated successfully!",
  "product_name": "SkyFlakes Crackers",
  "image_path": "generated_images/dynamic_SkyFlakes_Crackers_1234567890.png"
}
```

**Status Code:** `200 OK`

---

### 4️⃣ **Generate Ad Copy** (Original - Text Only)

**What it does:** Generates marketing text (no image).

**Steps:**

1. Select **"Generate Ad Copy (Text)"** request
2. Review the pre-filled body with playbook selection
3. Click **"Send"**

**Expected Response:**

```json
{
  "playbook_used": "Flash Sale",
  "product_name": "Lucky Me Pancit Canton",
  "generated_ad_copy": "🔥 FLASH SALE ALERT! 🔥\n\nGet Lucky Me Pancit Canton at 20% off..."
}
```

---

### 5️⃣ **Generate Ad Image** (Original - Playbook)

**What it does:** Generates an image using fixed playbook templates.

**Steps:**

1. Select **"Generate Ad Image (Playbook)"** request
2. Review the playbook options in the body
3. Click **"Send"**

**Available Playbooks:**

- `"Flash Sale"`
- `"New Arrival"`
- `"Bestseller Spotlight"`
- `"Bundle Up!"`

---

## ✏️ Customizing Requests

### Change the Product

Edit the request body before clicking "Send":

**Before:**

```json
{
  "product_data": {
    "name": "SkyFlakes Crackers",
    "price": 50
  },
  "user_prompt": "Professional blue theme"
}
```

**After (Your Product):**

```json
{
  "product_data": {
    "name": "Your Product Name",
    "price": 100,
    "category": "Your Category",
    "custom_field": "Any data you want!"
  },
  "user_prompt": "Your creative style here"
}
```

---

## 🎨 Creative Prompt Examples

Try these in the `user_prompt` field:

### Professional Corporate

```
"Modern minimalist design with navy blue and gold. Clean typography. Target professionals."
```

### Fun & Playful

```
"Colorful and fun with cartoon-like elements. Target families with young children."
```

### Luxury Premium

```
"Elegant, luxurious look with black and gold. High-end feel. Target affluent customers."
```

### Fresh & Natural

```
"Clean design with green and white. Organic, eco-friendly vibe. Emphasize sustainability."
```

### Bold & Dramatic

```
"High contrast with red and black. Bold typography. Create urgency and excitement."
```

---

## 🔍 Understanding Responses

### Success Response (200 OK)

```json
{
  "message": "Dynamic ad generated successfully!",
  "product_name": "SkyFlakes Crackers",
  "image_path": "generated_images/dynamic_SkyFlakes_Crackers_1234567890.png"
}
```

**Key Fields:**

- ✅ `message`: Confirmation message
- ✅ `product_name`: Product used
- ✅ `image_path`: Where to find the generated image

---

### Error Response (500 Internal Server Error)

```json
{
  "detail": "Failed to generate dynamic ad image"
}
```

**Common Causes:**

- ❌ Gemini API key invalid
- ❌ Network issues
- ❌ API quota exceeded
- ❌ Server not running

---

## 🔧 Troubleshooting in Postman

### Problem: "Could not send request"

**Solution:**

- ✅ Check if server is running: `http://localhost:8000/`
- ✅ Verify port 8000 is not blocked
- ✅ Check firewall settings

---

### Problem: 500 Error Response

**Solution:**

1. Check server terminal for error logs
2. Verify `.env` file has valid `GEMINI_API_KEY`
3. Check `logs/app.log` for details
4. Ensure `google-genai` package is installed

---

### Problem: 404 Not Found

**Solution:**

- ✅ Check the URL is correct: `http://localhost:8000/api/v1/ads/...`
- ✅ Ensure you included `/api/v1/ads/` prefix
- ✅ Verify endpoint name is spelled correctly

---

### Problem: "Invalid JSON"

**Solution:**

1. Click **"Body"** tab
2. Select **"raw"** and **"JSON"** from dropdown
3. Ensure JSON is properly formatted (use Postman's beautify button)

---

## 🎓 Advanced Postman Features

### Using Environment Variables

1. Create a new environment:

   - Click "Environments" icon (top right)
   - Click "+" to create new environment
   - Name it "BVA Local"

2. Add variable:

   - Variable: `base_url`
   - Initial Value: `http://localhost:8000`
   - Current Value: `http://localhost:8000`

3. Select environment from dropdown

Now you can easily switch between local, staging, and production!

---

### Adding Tests (Auto-verify responses)

Click the **"Tests"** tab and add:

```javascript
// Test that response is successful
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

// Test that response contains image_path
pm.test("Response has image_path", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("image_path");
});

// Test that message indicates success
pm.test("Success message received", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.message).to.include("successfully");
});
```

Now when you click "Send", tests run automatically! ✅

---

### Pre-request Scripts

Add dynamic data before sending:

```javascript
// Generate timestamp
pm.environment.set("timestamp", Date.now());

// Generate random product
const products = ["Coca-Cola", "Pepsi", "Sprite", "Royal"];
const randomProduct = products[Math.floor(Math.random() * products.length)];
pm.environment.set("randomProduct", randomProduct);
```

Then use in body: `"product_name": "{{randomProduct}}"`

---

## 📊 Testing Workflow

### Complete Test Run (5 minutes)

1. **Health Check:**

   - Send "Root Endpoint" → Should return welcome message
   - Open "API Documentation" in browser → Should show Swagger UI

2. **Original Endpoints:**

   - Send "Generate Ad Copy" → Check text response
   - Send "Generate Ad Image" → Check image_path

3. **New Data-Driven Endpoints:**

   - Send "Generate Bestseller Ad" → Check success
   - Send "Generate Bundle Ad" → Check success
   - Send all 3 Dynamic Ad variants → Check different styles

4. **Verify Images:**
   - Check `generated_images/` folder
   - Open PNG files to view generated ads

✅ **All green checkmarks = Success!**

---

## 🎯 Quick Reference

| Endpoint                  | Method | Body Required | Purpose                     |
| ------------------------- | ------ | ------------- | --------------------------- |
| `/generate-bestseller`    | POST   | ❌ No         | Auto-generate bestseller ad |
| `/generate-bundle`        | POST   | ✅ Yes        | Create bundle promotion     |
| `/generate-dynamic-image` | POST   | ✅ Yes        | Custom ad with user prompt  |
| `/generate-ad`            | POST   | ✅ Yes        | Generate ad copy (text)     |
| `/generate-ad-image`      | POST   | ✅ Yes        | Generate ad with playbook   |

---

## 📝 Postman Collection Features

✅ **7 ready-to-use requests** - Just click Send!  
✅ **Pre-filled example data** - Test immediately  
✅ **Multiple style variants** - See different creative approaches  
✅ **Health check included** - Verify server status  
✅ **Environment variable** - Easy URL management  
✅ **Organized folders** - Clean structure  
✅ **Documentation** - Each request has description

---

## 🎊 Pro Tips

### Tip 1: Save Responses

Click **"Save Response"** → **"Save as example"**  
Now you have a reference for future tests!

### Tip 2: Duplicate Requests

Right-click any request → **"Duplicate"**  
Test variations without losing original!

### Tip 3: Use Collection Runner

Click **"Run"** in collection → **"Run BVA - Ad Generation"**  
Test all endpoints at once automatically!

### Tip 4: Export & Share

Right-click collection → **"Export"**  
Share with your team!

### Tip 5: View in Browser

Copy `image_path` from response  
Open in browser: `http://localhost:8000/generated_images/...`  
_(Requires static file serving)_

---

## 📸 Expected Output

After running all tests, check your `generated_images/` folder:

```
generated_images/
├── bestseller_Kopiko_Coffee_1730000000.png
├── bundle_Phone_Case_1730000001.png
├── dynamic_SkyFlakes_Crackers_1730000002.png
├── dynamic_Energy_Drink_Max_1730000003.png
├── dynamic_Organic_Green_Tea_1730000004.png
└── ... (more images)
```

**Each image should be a unique AI-generated advertisement!** 🎨

---

## 🆘 Getting Help

### Check These First:

1. ✅ Server running? Check terminal
2. ✅ Collection imported? Check Postman sidebar
3. ✅ Correct URL? Should be `localhost:8000`
4. ✅ JSON valid? Use Postman beautify button

### Still Having Issues?

1. Check server logs in terminal
2. Review `logs/app.log`
3. Test with browser: `http://localhost:8000/docs`
4. Verify `.env` file has `GEMINI_API_KEY`

---

## 🎉 Success Checklist

Test complete when:

- [x] Collection imported successfully
- [x] Server running on port 8000
- [x] All 7 requests return 200 status
- [x] Images generated in `generated_images/` folder
- [x] No error messages in server logs
- [x] Response times < 30 seconds

**All checked? You're ready for production! 🚀**

---

## 📚 Additional Resources

- **API Documentation:** `http://localhost:8000/docs`
- **Full Guide:** `DATA_DRIVEN_ADS_README.md`
- **Quick Start:** `QUICK_START.md`
- **Architecture:** `ARCHITECTURE.md`

---

**Happy Testing! 📮✨**

_Last Updated: November 2, 2025_
