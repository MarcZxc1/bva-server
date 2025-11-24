# 📮 Postman Quick Reference Card

## 🚀 3-Step Setup

```
1. Import Collection
   Postman → Import → BVA_Ad_Generation.postman_collection.json

2. Start Server
   uvicorn app.main:app --reload --port 8000

3. Send Request
   Select endpoint → Click "Send" → View response
```

---

## 📋 All Endpoints at a Glance

| #   | Endpoint Name       | URL                       | Body?  | Time |
| --- | ------------------- | ------------------------- | ------ | ---- |
| 1   | **Bestseller Ad**   | `/generate-bestseller`    | ❌ No  | ~10s |
| 2   | **Bundle Ad**       | `/generate-bundle`        | ✅ Yes | ~10s |
| 3   | **Dynamic Ad**      | `/generate-dynamic-image` | ✅ Yes | ~10s |
| 4   | Ad Copy (Original)  | `/generate-ad`            | ✅ Yes | ~5s  |
| 5   | Ad Image (Original) | `/generate-ad-image`      | ✅ Yes | ~10s |

---

## 📝 Request Body Templates

### Bestseller (No Body!)

```
(Leave body empty)
```

### Bundle Ad

```json
{
  "main_product": "Phone Case",
  "bundle_item": "Charger",
  "final_price": 350
}
```

### Dynamic Ad

```json
{
  "product_data": {
    "name": "Product Name",
    "price": 100
  },
  "user_prompt": "Your style here"
}
```

### Ad Copy (Original)

```json
{
  "product_name": "Product",
  "playbook": "Flash Sale",
  "discount": "20% off"
}
```

---

## ✅ Success Response Example

```json
{
  "message": "...generated successfully!",
  "product_name": "...",
  "image_path": "generated_images/..."
}
```

**Status:** `200 OK`

---

## ❌ Common Errors & Fixes

| Error              | Fix                     |
| ------------------ | ----------------------- |
| Connection refused | Start server            |
| 500 Error          | Check API key in `.env` |
| 404 Not Found      | Check URL path          |
| Invalid JSON       | Format body correctly   |

---

## 🎨 User Prompt Ideas

```
Professional: "Modern minimalist with blue and gold"
Energetic: "Bold colors, red and yellow, dynamic"
Minimalist: "Clean design, green and white"
Luxury: "Elegant black and gold, high-end"
Fun: "Colorful, playful, for families"
```

---

## 🔍 Quick Checks

✅ Server running? → `http://localhost:8000/`  
✅ API docs? → `http://localhost:8000/docs`  
✅ Collection imported? → Check Postman sidebar  
✅ Images generated? → Check `generated_images/`

---

## 🎯 Testing Order

```
1. Root endpoint (health check)
2. Generate Bestseller (easiest)
3. Generate Bundle
4. Generate Dynamic (3 variants)
5. Original endpoints
6. Check generated images
```

**Total Time: ~5 minutes** ⚡

---

## 💡 Postman Tips

- **Save responses:** Right-click → Save as example
- **Duplicate request:** Right-click → Duplicate
- **Beautify JSON:** Click beautify icon in body
- **Environment:** Set `base_url` variable
- **Tests:** Add auto-verification scripts

---

## 🆘 Emergency Checklist

```
□ Server running on port 8000?
□ GEMINI_API_KEY in .env file?
□ Collection imported in Postman?
□ Request URL correct?
□ Request body valid JSON?
□ Content-Type: application/json?
```

---

## 📊 Expected Results

After testing all endpoints:

```
generated_images/
├── bestseller_*.png
├── bundle_*.png
├── dynamic_*.png (3+ files)
└── [original]_*.png
```

**All endpoints → 200 OK → Success!** 🎉

---

**Base URL:** `http://localhost:8000/api/v1/ads`

**Full Guide:** `POSTMAN_TESTING_GUIDE.md`

---

_Print this card for quick reference!_
