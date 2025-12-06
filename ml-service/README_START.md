# 🚨 IMPORTANT: How to Start the ML Service

## ❌ NEVER USE THIS (WRONG):
```bash
uvicorn app:main:app --host 0.0.0.0 --port 8001 --reload
```
**This will ALWAYS fail!**

## ✅ ALWAYS USE THIS (CORRECT):
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```
**Notice: DOTS (.) not COLONS (:)**

---

## 🎯 EASIEST WAY - Use the Script:

```bash
cd /home/marc/cloned/bva-server/ml-service
./run.sh
```

This script:
- ✅ Activates virtual environment automatically
- ✅ Uses the CORRECT syntax
- ✅ Checks dependencies
- ✅ Prevents mistakes

---

## 📝 Manual Start (If you must):

```bash
cd /home/marc/cloned/bva-server/ml-service
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

**Remember:**
- `app.main:app` ✅ (dots between app and main)
- `app:main:app` ❌ (colons - WRONG!)

---

## 🔍 Visual Difference:

```
CORRECT:  app.main:app
          ^^^^ ^^^^
          dots  colon (only one colon, at the end)

WRONG:    app:main:app
          ^^^ ^^^^
          colon colon (two colons - WRONG!)
```

---

## 🧠 Memory Trick:

Think of it as: **"app dot main colon app"**
- `app.main` = Python module path (uses dots)
- `:app` = The variable name (uses colon)

---

## ✅ Success Output:

When it works, you'll see:
```
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
INFO:     Started reloader process [XXXXX] using WatchFiles
INFO:     Started server process [XXXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

---

## 🐛 If You Still Get Errors:

1. **Copy and paste this EXACT command:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
   ```

2. **Or just use the script:**
   ```bash
   ./run.sh
   ```

3. **Check you're in the right directory:**
   ```bash
   pwd
   # Should show: /home/marc/cloned/bva-server/ml-service
   ```

---

**TL;DR: Use `./run.sh` or remember `app.main:app` (dots, not colons!)**

