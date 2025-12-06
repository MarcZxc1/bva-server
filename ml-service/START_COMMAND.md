# 🚀 CORRECT START COMMAND

## ❌ WRONG (What you're using):
```bash
uvicorn app:main:app --host 0.0.0.0 --port 8001 --reload
```
**Error:** `Attribute "main:app" not found in module "app"`

## ✅ CORRECT (What you should use):
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## 🔑 Key Difference:
- **WRONG:** `app:main:app` (uses colons `:`)
- **CORRECT:** `app.main:app` (uses dots `.`)

## 📝 Full Command with Virtual Environment:

```bash
cd /home/marc/cloned/bva-server/ml-service
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## 🎯 Or Use the Script:

```bash
cd /home/marc/cloned/bva-server/ml-service
./start.sh
```

## ✅ Success Output:

When it works, you'll see:
```
INFO:     Will watch for changes in these directories: ['/home/marc/cloned/bva-server/ml-service']
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
INFO:     Started reloader process [XXXXX] using WatchFiles
INFO:     Started server process [XXXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## 🧪 Test It:

Once running, test with:
```bash
curl http://localhost:8001/health
```

Or open in browser: http://localhost:8001/docs

