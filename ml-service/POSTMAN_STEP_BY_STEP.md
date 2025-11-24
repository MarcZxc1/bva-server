# 📮 Postman Step-by-Step Visual Guide

## Part 1: Import & Setup (First Time Only)

### Step 1: Open Postman

1. Launch **Postman** application
2. If you see "Sign In", you can skip it (click "Skip and go to the app")

---

### Step 2: Import the Collection

1. Click the **"Import"** button (top-left corner)
2. A dialog will appear with multiple tabs
3. Click the **"File"** tab
4. Click **"Choose Files"** or drag and drop
5. Navigate to: `ml-service/BVA_Ad_Generation.postman_collection.json`
6. Click **"Open"**
7. Click **"Import"** button

**✅ Success Indicator:**
You'll see "BVA - Ad Generation API" in your left sidebar under Collections.

---

### Step 3: Verify Collection Structure

Expand the collection in the sidebar:

```
📁 BVA - Ad Generation API
  📁 Original Endpoints
    📄 Generate Ad Copy (Text)
    📄 Generate Ad Image (Playbook)
  📁 New Data-Driven Endpoints
    📄 Generate Bestseller Ad
    📄 Generate Bundle Ad
    📄 Generate Dynamic Ad - Professional Style
    📄 Generate Dynamic Ad - Energetic Style
    📄 Generate Dynamic Ad - Minimalist Style
  📁 Health Check
    📄 Root Endpoint
    📄 API Documentation
```

**Total: 9 requests** ready to use!

---

## Part 2: Start Your Server

### Step 4: Open Terminal/PowerShell

1. Open **PowerShell** or **Terminal**
2. Navigate to your project:
   ```powershell
   cd "C:\Users\QCU\Projects2025\Virtual Business Assistant Server\ml-service"
   ```
3. Activate virtual environment (if needed):
   ```powershell
   venv\Scripts\Activate.ps1
   ```

---

### Step 5: Start the FastAPI Server

Run this command:

```powershell
uvicorn app.main:app --reload --port 8000
```

**✅ Success Indicator:**

```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     🚀 Starting Business Virtual Assistant (BVA) - AI Service
INFO:     ✅ API v1 router registered at /api/v1
```

**Leave this terminal window open!** The server must stay running.

---

## Part 3: Testing Endpoints

### Step 6: Test "Generate Bestseller Ad" (Easiest!)

**In Postman:**

1. **Select Request:**

   - Click on "BVA - Ad Generation API" collection
   - Expand "New Data-Driven Endpoints" folder
   - Click "Generate Bestseller Ad"

2. **Review Request Details:**

   - **Method:** `POST` (should be pre-selected)
   - **URL:** `http://localhost:8000/api/v1/ads/generate-bestseller`
   - **Body:** Empty (this endpoint needs no body!)

3. **Send Request:**

   - Click the blue **"Send"** button (top-right of request panel)
   - Wait ~10 seconds for the AI to generate the image

4. **View Response:**
   - Look at the bottom panel labeled "Response"
   - You should see:
     ```json
     {
       "message": "Bestseller ad generated successfully!",
       "product_name": "Kopiko Coffee",
       "category": "Groceries",
       "image_path": "generated_images/bestseller_Kopiko_Coffee_1730567890.png"
     }
     ```
   - **Status:** `200 OK` (shown in top-right of response panel)

**✅ Success!** Your first ad is generated!

---

### Step 7: Test "Generate Bundle Ad"

**In Postman:**

1. **Select Request:**

   - Click "Generate Bundle Ad" from the collection

2. **Review Pre-filled Body:**

   - Click the **"Body"** tab
   - Ensure **"raw"** is selected
   - Ensure **"JSON"** is selected from dropdown (right side)
   - You'll see:
     ```json
     {
       "main_product": "Phone Case - Old Model",
       "bundle_item": "Premium Phone Charger",
       "final_price": 350.0
     }
     ```

3. **(Optional) Customize:**

   - You can edit the values to test with different products
   - For example, change to:
     ```json
     {
       "main_product": "Coffee Mug",
       "bundle_item": "Coffee Beans",
       "final_price": 250.0
     }
     ```

4. **Send Request:**

   - Click **"Send"**
   - Wait ~10 seconds

5. **View Response:**
   ```json
   {
     "message": "Bundle ad generated successfully!",
     "main_product": "Phone Case - Old Model",
     "bundle_item": "Premium Phone Charger",
     "final_price": 350.0,
     "image_path": "generated_images/bundle_Phone_Case_1730567891.png"
   }
   ```

**✅ Success!** Bundle ad generated!

---

### Step 8: Test "Generate Dynamic Ad" (Most Powerful!)

**In Postman:**

1. **Select Request:**

   - Click "Generate Dynamic Ad - Professional Style"

2. **Review Pre-filled Body:**

   ```json
   {
     "product_data": {
       "name": "SkyFlakes Crackers",
       "price": 50,
       "category": "Snacks",
       "brand": "Monde Nissin"
     },
     "user_prompt": "Make it look professional and modern with blue and gold tones. Target young professionals."
   }
   ```

3. **Understand the Fields:**

   - `product_data`: Can contain ANY fields you want!
   - `user_prompt`: YOUR creative direction (be specific!)

4. **Send Request:**

   - Click **"Send"**
   - Wait ~10 seconds

5. **View Response:**
   ```json
   {
     "message": "Dynamic ad generated successfully!",
     "product_name": "SkyFlakes Crackers",
     "image_path": "generated_images/dynamic_SkyFlakes_Crackers_1730567892.png"
   }
   ```

**✅ Success!** Custom ad with your style created!

---

### Step 9: Try Different Styles

Test all 3 dynamic ad variants:

1. **Professional Style** ✅ (you just did this!)
2. **Energetic Style:**

   - Click "Generate Dynamic Ad - Energetic Style"
   - Click "Send"
   - See bold, dynamic colors!

3. **Minimalist Style:**
   - Click "Generate Dynamic Ad - Minimalist Style"
   - Click "Send"
   - See clean, minimal design!

**Compare the 3 images** to see how the `user_prompt` changes the style!

---

### Step 10: Test Original Endpoints (Backward Compatibility)

1. **Generate Ad Copy (Text):**

   - Click "Generate Ad Copy (Text)"
   - Review body (playbook is required)
   - Click "Send"
   - Response will be text only (no image)

2. **Generate Ad Image (Playbook):**
   - Click "Generate Ad Image (Playbook)"
   - Review body
   - Click "Send"
   - Image generated using fixed template

**✅ All endpoints work!** The system is backward-compatible.

---

## Part 4: Verify Generated Images

### Step 11: Check Your Images

**In File Explorer:**

1. Navigate to:

   ```
   C:\Users\QCU\Projects2025\Virtual Business Assistant Server\ml-service\generated_images\
   ```

2. You should see PNG files:

   ```
   bestseller_Kopiko_Coffee_1730567890.png
   bundle_Phone_Case_1730567891.png
   dynamic_SkyFlakes_Crackers_1730567892.png
   dynamic_Energy_Drink_Max_1730567893.png
   dynamic_Organic_Green_Tea_1730567894.png
   ... (and more)
   ```

3. **Open any PNG file** to view the generated ad!

**✅ Beautiful AI-generated ads!** 🎨

---

## Part 5: Advanced Testing

### Step 12: Create Your Own Custom Request

**In Postman:**

1. **Duplicate a Request:**

   - Right-click "Generate Dynamic Ad - Professional Style"
   - Select **"Duplicate"**
   - A copy appears: "Generate Dynamic Ad - Professional Style Copy"

2. **Rename It:**

   - Right-click the copy
   - Select **"Rename"**
   - Name it: "My Custom Ad"

3. **Edit the Body:**

   ```json
   {
     "product_data": {
       "name": "Your Product Name Here",
       "price": 999,
       "category": "Your Category",
       "brand": "Your Brand",
       "special_feature": "Anything you want to include!"
     },
     "user_prompt": "Create a vibrant, eye-catching design with purple and orange colors. Make it feel exciting and fun. Target teenagers and young adults."
   }
   ```

4. **Send Your Custom Request:**
   - Click **"Send"**
   - Watch your unique ad get created! 🎉

---

### Step 13: Add Auto-Verification Tests

**In Postman (for any request):**

1. Click the **"Tests"** tab (next to Body tab)

2. Paste this code:

   ```javascript
   // Auto-verify the response
   pm.test("Status code is 200 OK", function () {
     pm.response.to.have.status(200);
   });

   pm.test("Response has image_path", function () {
     var jsonData = pm.response.json();
     pm.expect(jsonData).to.have.property("image_path");
   });

   pm.test("Image path contains 'generated_images'", function () {
     var jsonData = pm.response.json();
     pm.expect(jsonData.image_path).to.include("generated_images");
   });

   pm.test("Response time under 30 seconds", function () {
     pm.expect(pm.response.responseTime).to.be.below(30000);
   });

   // Log the image path
   console.log("Image generated at:", pm.response.json().image_path);
   ```

3. Click **"Send"** again

4. Look at **"Test Results"** tab in response

   - You'll see ✅ checkmarks for each passing test!

5. Open **"Console"** (bottom-left icon in Postman)
   - You'll see the logged image path

**Now every request is automatically verified!** ✅

---

### Step 14: Use Collection Runner (Test All at Once)

**In Postman:**

1. **Hover over** "BVA - Ad Generation API" collection

2. Click the **"▶ Run"** button (appears when hovering)

3. **Collection Runner** window opens

4. **Configure:**

   - Iterations: `1`
   - Delay: `2000` ms (2 seconds between requests)
   - Select all requests you want to run

5. Click **"Run BVA - Ad Generation API"**

6. **Watch the magic:**
   - All requests run automatically!
   - See green checkmarks for success
   - View summary at the end

**✅ Automated testing complete!** 🚀

---

## Understanding the Response

### Response Anatomy

```
┌─────────────────────────────────────────────────┐
│ Status: 200 OK                    Time: 12.5s   │ ← Top bar
├─────────────────────────────────────────────────┤
│ Body   Headers   Test Results   Cookies         │ ← Tabs
├─────────────────────────────────────────────────┤
│ {                                               │
│   "message": "...generated successfully!",      │ ← Confirmation
│   "product_name": "SkyFlakes Crackers",         │ ← Product used
│   "category": "Snacks",                         │ ← Extra info
│   "image_path": "generated_images/..."          │ ← Image location
│ }                                               │
└─────────────────────────────────────────────────┘
```

### Status Codes

| Code                 | Meaning         | Action                        |
| -------------------- | --------------- | ----------------------------- |
| **200 OK**           | ✅ Success!     | Check response for image_path |
| **400 Bad Request**  | ❌ Invalid body | Fix JSON in request body      |
| **404 Not Found**    | ❌ Wrong URL    | Check endpoint path           |
| **500 Server Error** | ❌ Server issue | Check server logs             |

---

## Troubleshooting Guide

### Issue: "Could not send request"

**Symptoms:**

- Red error message in Postman
- "Error: connect ECONNREFUSED"

**Solution:**

1. Check if server is running (look at your terminal)
2. If not running, start it:
   ```powershell
   uvicorn app.main:app --reload --port 8000
   ```
3. Verify URL is `http://localhost:8000` (not `https`)

---

### Issue: Status 500 Internal Server Error

**Symptoms:**

- Response says "Failed to generate image"
- Status code is 500

**Solution:**

1. Check server terminal for error messages
2. Verify `.env` file has valid `GEMINI_API_KEY`
3. Check `logs/app.log` for detailed errors
4. Ensure internet connection is working

---

### Issue: Invalid JSON Error

**Symptoms:**

- Postman shows JSON syntax error
- Can't send request

**Solution:**

1. Click **Body** tab
2. Select **raw** and **JSON**
3. Click the **Beautify** button (looks like `</>`)
4. Check for:
   - Missing commas
   - Unclosed quotes
   - Unclosed braces

---

### Issue: Image Not Generated

**Symptoms:**

- 200 OK response
- But no image in `generated_images/` folder

**Solution:**

1. Check response body for `image_path` field
2. Verify the path in the response
3. Look in server terminal for errors
4. Check if `generated_images/` folder exists
5. Verify write permissions on folder

---

## Tips & Tricks

### Tip 1: Save Your Favorite Requests

- Edit a request with your favorite products
- Click **"Save"** (Ctrl+S)
- Now it's always ready to use!

### Tip 2: Organize with Folders

- Create sub-folders for different product categories
- Drag requests into folders
- Keep your collection organized!

### Tip 3: Use Variables

- Create environment variable: `product_name`
- Use in body: `"name": "{{product_name}}"`
- Change once, test everywhere!

### Tip 4: Copy Image Path Quickly

- In response, click on `image_path` value
- Right-click → Copy
- Paste into File Explorer address bar

### Tip 5: Export Collection

- Right-click collection → Export
- Share with your team
- Version control with Git!

---

## Success Checklist

After completing this guide:

- [x] Postman collection imported
- [x] Server running successfully
- [x] Tested bestseller ad endpoint
- [x] Tested bundle ad endpoint
- [x] Tested all 3 dynamic ad styles
- [x] Tested original endpoints
- [x] Verified images in folder
- [x] Created custom request
- [x] Added test scripts
- [x] Ran collection runner

**All checked? You're a Postman pro!** 🏆

---

## Quick Reference

**Collection File:** `BVA_Ad_Generation.postman_collection.json`

**Server Start:**

```powershell
uvicorn app.main:app --reload --port 8000
```

**Base URL:** `http://localhost:8000/api/v1/ads`

**Images Folder:** `ml-service/generated_images/`

**Full Docs:** See `POSTMAN_TESTING_GUIDE.md`

---

**Happy Testing! You're now ready to generate amazing AI-powered ads!** 🎉📮✨
