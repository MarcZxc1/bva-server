# ✅ FIXED - How to Start ML Service

## The Problem You Had:
```bash
uvicorn app:main:app --host 0.0.0.0 --port 8001 --reload
```
**Error:** `Attribute "main:app" not found in module "app"`

## ✅ The CORRECT Command:

```bash
cd /home/marc/cloned/bva-server/ml-service
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## 🔑 Key Difference:
- ❌ **WRONG:** `app:main:app` (uses colons `:`)
- ✅ **CORRECT:** `app.main:app` (uses dots `.`)

## 📝 Step-by-Step:

1. **Navigate to ml-service directory:**
   ```bash
   cd /home/marc/cloned/bva-server/ml-service
   ```

2. **Activate virtual environment:**
   ```bash
   source venv/bin/activate
   ```

3. **Start the server with CORRECT syntax:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
   ```

## 🎯 Or Use the Script:

```bash
cd /home/marc/cloned/bva-server/ml-service
./start.sh
```

## ✅ Expected Success Output:

```
🚀 Starting ML Service on port 8001...
📚 API Docs will be available at: http://localhost:8001/docs
🏥 Health check: http://localhost:8001/health

⚠️  IMPORTANT: Using correct syntax: app.main:app (with dots, not colons)

📦 Activating virtual environment...
🚀 Starting uvicorn server...
INFO:     Will watch for changes in these directories: ['/home/marc/cloned/bva-server/ml-service']
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
INFO:     Started reloader process [XXXXX] using WatchFiles
INFO:     Started server process [XXXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## 🧪 Test It Works:

Once you see "Application startup complete", test with:

```bash
# In another terminal:
curl http://localhost:8001/health
```

Should return: `{"status":"healthy"}`

Or open in browser: **http://localhost:8001/docs**

---

## 🐛 If You Still Get Errors:

1. **Make sure virtual environment is activated:**
   ```bash
   source venv/bin/activate
   # You should see (venv) in your prompt
   ```

2. **Verify dependencies are installed:**
   ```bash
   pip list | grep fastapi
   # Should show: fastapi
   ```

3. **If dependencies missing, install them:**
   ```bash
   pip install -r requirements.txt
   ```

---

**Remember:** Always use `app.main:app` (dots) NOT `app:main:app` (colons)!

