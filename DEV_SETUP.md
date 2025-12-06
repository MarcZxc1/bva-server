# Development Setup - Running All Services

## 🚀 Quick Start

### Option 1: Using Root Package.json (Recommended)

```bash
# Install dependencies (one-time setup)
npm install

# Run all services at once
npm run dev
```

This will start:
- **Server** (Backend API) on `http://localhost:3000`
- **BVA Frontend** on `http://localhost:5173`
- **Shopee Clone** on `http://localhost:5174` (or next available port)

### Option 2: Run Services Individually

```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - BVA Frontend
cd bva-frontend && npm run dev

# Terminal 3 - Shopee Clone
cd shopee-clone && npm run dev
```

## 📋 Available Commands

### Root Level Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Run all services concurrently |
| `npm run dev:server` | Run only backend server |
| `npm run dev:frontend` | Run only BVA frontend |
| `npm run dev:shopee` | Run only Shopee clone |
| `npm run install:all` | Install dependencies for all workspaces |
| `npm run build` | Build all services |

### Individual Service Commands

Each service has its own commands in their respective directories.

## ⚙️ Configuration

### Port Configuration

If you need to change ports, update the following:

**BVA Frontend** (`bva-frontend/vite.config.ts`):
```typescript
server: {
  port: 5173
}
```

**Shopee Clone** (`shopee-clone/vite.config.ts`):
```typescript
server: {
  port: 5174
}
```

**Backend Server** (`.env` file in `server/`):
```env
PORT=3000
```

## 🔧 Troubleshooting

### Port Already in Use

If a port is already in use, Vite will automatically try the next available port. Check the console output for the actual port.

### Concurrently Not Found

```bash
npm install -g concurrently
# or
npm install --save-dev concurrently
```

### Workspace Issues

If npm workspaces cause issues, you can use the individual commands or install concurrently globally:

```bash
npm install -g concurrently
concurrently "cd server && npm run dev" "cd bva-frontend && npm run dev" "cd shopee-clone && npm run dev"
```

