# Business Virtual Assistant (BVA) - Architecture & Engineering Guide

> **For Students Moving Beyond "Vibe Coding" to Deep Engineering Mastery**

This guide uses the BVA codebase as a living textbook to explain enterprise software architecture patterns, data flow, state management, real-time systems, authentication, machine learning integration, and problem-solving strategies.

---

## Table of Contents

1. [High-Level Architecture Overview](#high-level-architecture-overview)
2. [Data Flow & Request Lifecycle](#data-flow--request-lifecycle)
3. [State & UI Management](#state--ui-management)
4. [Real-Time Systems (Socket.io)](#real-time-systems-socketio)
5. [Authentication & OAuth](#authentication--oauth)
6. [Machine Learning Logic](#machine-learning-logic)
7. [Architectural Challenges & Solutions](#architectural-challenges--solutions)
8. [How-To: Applying These Patterns](#how-to-applying-these-patterns)

---

## High-Level Architecture Overview

BVA is a **microservices architecture** with three main components:

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   React Frontend│         │  Express Server │         │  Python ML      │
│   (Port 8080)   │◄───────►│  (Port 3000)   │◄───────►│  Service        │
│                 │  HTTP   │                 │  HTTP   │  (Port 8000)     │
│  - React Query  │         │  - JWT Auth     │         │  - FastAPI      │
│  - Shadcn UI    │         │  - Prisma ORM    │         │  - Pandas/NumPy │
│  - Socket.io    │         │  - PostgreSQL    │         │  - Gemini AI    │
└─────────────────┘         └─────────────────┘         └─────────────────┘
         │                           │                           │
         │                           │                           │
         └───────────────────────────┴───────────────────────────┘
                                    │
                           ┌────────▼────────┐
                           │   PostgreSQL    │
                           │   Database     │
                           └────────────────┘
```

### Key Architectural Decisions

1. **Separation of Concerns**: Frontend (UI), Backend (Business Logic), ML Service (Intelligence)
2. **API-First Design**: All communication via REST APIs with JSON
3. **Real-Time Updates**: WebSocket (Socket.io) for live dashboard updates
4. **Type Safety**: TypeScript on frontend/backend, Pydantic on ML service
5. **State Management**: React Query for server state, React Context for auth state

---

## Data Flow & Request Lifecycle

### Example: Fetching At-Risk Inventory (SmartShelf)

Let's trace a complete request from React component → Express → Python ML → Back to React.

#### Step 1: React Component Initiates Request

**File**: `bva-frontend/src/pages/SmartShelf.tsx`

```typescript
// Component uses a custom hook that wraps React Query
const { data: atRiskData, isLoading } = useAtRiskInventory(shopId, true);
```

**File**: `bva-frontend/src/hooks/useSmartShelf.ts`

```typescript
export function useAtRiskInventory(shopId: string, enabled: boolean = true) {
  return useQuery<AtRiskResponse>({
    queryKey: ["at-risk-inventory", shopId],  // Cache key
    queryFn: async () => {
      return await smartShelfApi.getAtRiskInventory(shopId);
    },
    enabled: enabled && !!shopId,
    staleTime: 30 * 1000,  // Cache for 30 seconds
    refetchOnWindowFocus: true,  // Refetch when user returns to tab
  });
}
```

**Key Concept**: React Query automatically handles:
- Caching (stores response with key `["at-risk-inventory", shopId]`)
- Deduplication (multiple components requesting same data = 1 API call)
- Background refetching (when data becomes "stale")
- Loading/error states

#### Step 2: API Client Adds Authentication Token

**File**: `bva-frontend/src/lib/api-client.ts`

```typescript
class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: { "Content-Type": "application/json" },
    });

    // Request interceptor: Automatically attach JWT token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }
}
```

**HTTP Request Sent**:
```
GET /api/smart-shelf/at-risk?shopId=abc123
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
```

#### Step 3: Express Middleware Validates Token

**File**: `server/src/middlewares/auth.middleware.ts`

```typescript
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];  // Extract "Bearer <token>"
  
  try {
    const decoded = verifyToken(token);  // Verify JWT signature
    (req as any).user = decoded;  // Attach user info to request
    (req as any).userId = decoded.userId;
    next();  // Continue to route handler
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};
```

**Key Concept**: Middleware runs **before** route handlers. It:
- Extracts token from `Authorization` header
- Verifies JWT signature (prevents tampering)
- Attaches user data to `req.user` for downstream use
- Blocks unauthorized requests (401) before they reach business logic

#### Step 4: Route Handler Processes Request

**File**: `server/src/routes/smartShelf.routes.ts`

```typescript
router.get("/at-risk", authMiddleware, async (req, res) => {
  const shopId = req.query.shopId as string;
  const userId = (req as any).userId;  // From auth middleware
  
  const result = await smartShelfService.getAtRiskInventory(shopId);
  res.json(result);
});
```

#### Step 5: Service Layer Calls ML Service

**File**: `server/src/service/smartShelf.service.ts`

```typescript
export async function getAtRiskInventory(shopId: string): Promise<AtRiskResponse> {
  // 1. Fetch products and sales from PostgreSQL
  const products = await prisma.product.findMany({
    where: { shopId },
    include: { Inventory: true },
  });

  const sales = await prisma.sale.findMany({
    where: { shopId, createdAt: { gte: thirtyDaysAgo } },
  });

  // 2. Transform to ML service format
  const inventoryItems: InventoryItem[] = products.map(p => ({
    product_id: p.id,
    name: p.name,
    quantity: p.Inventory?.[0]?.quantity || 0,
    threshold: p.Inventory?.[0]?.threshold || 10,
    expiry_date: p.expiryDate?.toISOString() || null,
    category: p.category || "Unknown",
  }));

  const salesRecords: SalesRecord[] = sales.map(s => ({
    product_id: s.items[0]?.productId || "",
    quantity: s.items[0]?.quantity || 0,
    sale_date: s.createdAt.toISOString(),
  }));

  // 3. Call Python ML service
  const request: AtRiskRequest = {
    shop_id: shopId,
    inventory: inventoryItems,
    sales: salesRecords,
    thresholds: {
      low_stock: 10,
      expiry_days: 7,
      slow_moving_threshold: 0.5,
      slow_moving_window: 14,
    },
  };

  const response = await mlClient.post<AtRiskResponse>(
    "/api/v1/smart-shelf/at-risk",
    request
  );

  return response;
}
```

**Key Concept**: Service layer acts as an **Adapter**:
- Converts Prisma models → ML service schemas
- Handles data transformation (dates, nested objects)
- Makes HTTP call to ML service (separate process)
- Returns normalized response

#### Step 6: Python ML Service Computes Risk Scores

**File**: `ml-service/app/services/inventory_service.py`

```python
def compute_risk_scores(
    inventory: List[InventoryItem],
    sales: List[SalesRecord],
    thresholds: AtRiskThresholds
) -> List[AtRiskItem]:
    """
    Vectorized risk scoring using Pandas (no Python loops).
    Performance: O(n log n) for 10K+ products in <100ms.
    """
    # Convert to DataFrames for vectorized operations
    inv_df = prepare_inventory_dataframe([item.dict() for item in inventory])
    sales_df = prepare_sales_dataframe([sale.dict() for sale in sales])
    
    # Compute sales velocity (vectorized)
    velocity_df = compute_daily_sales_velocity(sales_df, window_days=14)
    
    # Merge with inventory
    inv_df = inv_df.merge(velocity_df, on='product_id', how='left')
    
    # Detect risks (vectorized boolean operations)
    inv_df = _detect_low_stock(inv_df, thresholds.low_stock)
    inv_df = _detect_near_expiry(inv_df, thresholds.expiry_days)
    inv_df = _detect_slow_moving(inv_df, thresholds.slow_moving_threshold)
    
    # Compute combined risk score (vectorized arithmetic)
    inv_df = _compute_risk_score(inv_df, thresholds)
    
    # Filter and sort
    at_risk_df = inv_df[inv_df['is_at_risk']].sort_values('risk_score', ascending=False)
    
    return [AtRiskItem(**row.to_dict()) for _, row in at_risk_df.iterrows()]
```

**Key Concept**: **Vectorized Operations** (Pandas/NumPy):
- Instead of `for product in products: score = calculate(product)`, we do:
  ```python
  df['risk_score'] = (df['low_stock_score'] + df['near_expiry_score'] + df['slow_moving_score'])
  ```
- All products scored in one operation (parallelized by NumPy)
- 100x faster than Python loops for large datasets

#### Step 7: Response Flows Back to React

**Response Path**:
```
Python ML Service → Express Service → API Client → React Query → Component
```

**File**: `bva-frontend/src/pages/SmartShelf.tsx`

```typescript
// React Query automatically updates component when data arrives
if (isLoading) return <Skeleton />;
if (atRiskData) {
  return (
    <div>
      {atRiskData.at_risk.map(item => (
        <ProductCard key={item.product_id} item={item} />
      ))}
    </div>
  );
}
```

**Key Concept**: **Declarative UI Updates**
- Component doesn't manually call `setState` when data arrives
- React Query's `useQuery` hook automatically triggers re-render when:
  - Data is fetched
  - Cache is invalidated
  - Window regains focus (if `refetchOnWindowFocus: true`)

---

## State & UI Management

### React Query: Server State Management

React Query (TanStack Query) manages **server state** (data from APIs), not **client state** (form inputs, UI toggles).

#### Why React Query Instead of `useState` + `useEffect`?

**❌ Without React Query (Manual Approach)**:
```typescript
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  setLoading(true);
  fetchProducts(shopId)
    .then(data => setProducts(data))
    .catch(err => setError(err))
    .finally(() => setLoading(false));
}, [shopId]);
```

**Problems**:
- No caching (refetches on every mount)
- No deduplication (multiple components = multiple API calls)
- Manual loading/error state management
- No automatic refetching when data becomes stale

**✅ With React Query**:
```typescript
const { data: products, isLoading, error } = useQuery({
  queryKey: ["products", shopId],
  queryFn: () => productService.fetchProducts(shopId),
  staleTime: 30 * 1000,  // Cache for 30 seconds
});
```

**Benefits**:
- Automatic caching (stores by `queryKey`)
- Deduplication (same `queryKey` = 1 API call, shared across components)
- Built-in loading/error states
- Background refetching when stale
- Optimistic updates support

#### Cache Invalidation Pattern

**File**: `bva-frontend/src/pages/Dashboard.tsx`

```typescript
const syncIntegrationMutation = useMutation({
  mutationFn: (id: string) => integrationService.syncIntegration(id),
  onSuccess: (data) => {
    // Invalidate related queries to force refetch
    queryClient.invalidateQueries({ queryKey: ["dashboard-analytics"] });
    queryClient.invalidateQueries({ queryKey: ["at-risk-inventory"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["sales"] });
    
    toast.success(`Sync completed! ${data.products} products synced.`);
  },
});
```

**Key Concept**: **Cache Invalidation**
- After a mutation (POST/PUT/DELETE), related queries are marked "stale"
- React Query automatically refetches stale queries in the background
- UI updates without manual `setState` calls

#### Optimistic Updates

**File**: `bva-frontend/src/hooks/useRealtimeDashboard.ts`

```typescript
const handleNewOrder = (orderData: {
  orderId: string;
  total: number;
  revenue: number;
}) => {
  // Optimistically update cache BEFORE refetch
  queryClient.setQueryData(["dashboard-analytics"], (oldData: any) => {
    if (!oldData) return oldData;
    
    return {
      ...oldData,
      totalRevenue: (oldData.totalRevenue || 0) + orderData.revenue,
      totalProfit: (oldData.totalProfit || 0) + orderData.profit,
      totalSales: (oldData.totalSales || 0) + 1,
    };
  });
  
  // Then invalidate to get fresh data from server
  queryClient.invalidateQueries({ queryKey: ["dashboard-analytics"] });
};
```

**Key Concept**: **Optimistic Updates**
- Update UI immediately (feels instant to user)
- Then refetch from server to ensure consistency
- If server data differs, React Query overwrites optimistic update

### Shadcn UI: Declarative Modal/Dialog System

Shadcn UI uses **Radix UI** primitives, which follow a **declarative state** pattern.

#### How to Trigger a Modal

**File**: `bva-frontend/src/components/AdGeneratorDialog.tsx`

```typescript
export function AdGeneratorDialog({ 
  open: controlledOpen,
  onOpenChange: setControlledOpen 
}: AdGeneratorDialogProps) {
  // Controlled vs Uncontrolled pattern
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen : setInternalOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Generate Ad</Button>
      </DialogTrigger>
      <DialogContent>
        {/* Modal content */}
      </DialogContent>
    </Dialog>
  );
}
```

**Key Concept**: **Declarative State**
- You don't "open" a modal with `modal.open()`
- You change state: `setOpen(true)`
- UI reacts to state change (React re-renders)
- Dialog component reads `open` prop and shows/hides accordingly

**Usage**:
```typescript
// Parent component controls modal
const [isOpen, setIsOpen] = useState(false);

<AdGeneratorDialog 
  open={isOpen} 
  onOpenChange={setIsOpen}
  trigger={<Button onClick={() => setIsOpen(true)}>Open</Button>}
/>
```

---

## Real-Time Systems (Socket.io)

### Pub/Sub Pattern for Live Updates

Socket.io implements a **Publish/Subscribe** pattern:
- **Server** "publishes" events (emits)
- **Clients** "subscribe" to events (listen)
- Multiple clients can receive the same event

### Server-Side: Emitting Events

**File**: `server/src/services/socket.service.ts`

```typescript
export function initializeSocketIO(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: ["http://localhost:8080", "http://localhost:5173"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // Client joins a "room" (like a chat channel)
    socket.on("join_shop", (shopId: string) => {
      const room = `shop_${shopId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined shop room: ${room}`);
    });
  });

  return io;
}

// Emit event to all clients in a room
export function notifyNewOrder(order: any): void {
  if (!io) return;
  
  // Emit to specific shop room
  io.to(`shop_${order.shopId}`).emit("dashboard_update", {
    type: "new_order",
    data: order
  });
}
```

**File**: `server/src/controllers/webhook.controller.ts`

```typescript
async handleOrderCreated(req: Request, res: Response) {
  const sale = await webhookService.handleOrderCreated(shopId, req.body);
  
  // Emit real-time update via Socket.io
  const io = getSocketIO();
  if (io) {
    io.to(`shop_${shopId}`).emit("dashboard_update", {
      type: "new_order",
      data: {
        orderId: sale.id,
        total: sale.total,
        revenue: sale.revenue,
      }
    });
  }
  
  res.status(200).json({ success: true, data: sale });
}
```

**Key Concept**: **Rooms**
- Clients join rooms (e.g., `shop_abc123`)
- Server emits to room → all clients in that room receive event
- Enables targeted updates (only relevant users get notified)

### Client-Side: Listening for Events

**File**: `bva-frontend/src/hooks/useRealtimeDashboard.ts`

```typescript
export function useRealtimeDashboard({ shopId, enabled = true }) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !shopId) return;

    // Initialize socket connection
    const socket = io(API_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socketRef.current = socket;

    // Join shop room
    socket.emit("join_shop", shopId);

    // Listen for dashboard updates
    socket.on("dashboard_update", (update: DashboardUpdate) => {
      console.log("📊 Dashboard update received:", update);

      switch (update.type) {
        case "new_order":
          handleNewOrder(update.data);
          break;
        case "low_stock":
          handleLowStock(update.data);
          break;
      }
    });

    // Cleanup on unmount
    return () => {
      socket.emit("leave_shop", shopId);
      socket.disconnect();
    };
  }, [shopId, enabled]);

  const handleNewOrder = (orderData: any) => {
    // Show toast notification
    toast.success("New Order Received! 💰", {
      description: `Order #${orderData.orderId.slice(-8)} - ₱${orderData.total}`,
    });

    // Invalidate queries to refetch fresh data
    queryClient.invalidateQueries({ queryKey: ["dashboard-analytics"] });
    queryClient.invalidateQueries({ queryKey: ["at-risk-inventory"] });
  };
}
```

**Key Concept**: **Event-Driven Updates**
- Server emits event → Client receives event → Client updates UI
- No polling (no `setInterval` checking for updates)
- Instant updates when events occur
- Automatic reconnection if connection drops

---

## Authentication & OAuth

### Manual JWT Authentication (Google OAuth)

**Flow**: User clicks "Login with Google" → Redirects to Google → Google redirects back with code → Server exchanges code for token → Server creates JWT → Frontend stores JWT

#### Backend: JWT Generation

**File**: `server/src/routes/auth.routes.ts`

```typescript
router.get("/google/callback", async (req, res) => {
  const { code, state } = req.query;
  
  // Exchange code for Google user info
  const googleUser = await exchangeCodeForUser(code);
  
  // Find or create user in database
  let user = await prisma.user.findUnique({
    where: { googleId: googleUser.id },
  });
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.id,
        role: "BUYER",
      },
    });
  }
  
  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  
  // Redirect to frontend with token
  res.redirect(`${redirectUrl}?token=${token}`);
});
```

**File**: `server/src/utils/jwt.ts`

```typescript
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
```

**Key Concept**: **JWT (JSON Web Token)**
- Self-contained (user info encoded in token)
- Stateless (server doesn't store session)
- Signed (prevents tampering)
- Expires (security)

#### Frontend: Token Storage & Usage

**File**: `bva-frontend/src/contexts/AuthContext.tsx`

```typescript
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Initialize: Restore from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("user");
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Set token and update state
  const setAuthToken = async (newToken: string) => {
    localStorage.setItem("auth_token", newToken);
    setToken(newToken);
    
    // Fetch user data from server
    const userData = await apiClient.get("/api/auth/me");
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ token, user, setToken: setAuthToken }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**File**: `bva-frontend/src/lib/api-client.ts`

```typescript
// Request interceptor: Automatically attach token to all requests
this.client.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Key Concept**: **Token-Based Authentication**
- Token stored in `localStorage` (persists across page refreshes)
- Token automatically attached to all API requests
- Server validates token on each request (via `authMiddleware`)
- No server-side session storage needed

### Supabase-Handled OAuth (Facebook)

**Flow**: User clicks "Connect Facebook" → Supabase handles OAuth → Supabase redirects back with session → BVA receives verified user metadata → BVA stores access token

#### Frontend: Supabase OAuth Initiation

**File**: `bva-frontend/src/lib/supabase.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      flowType: "pkce",  // PKCE for better security
    },
  }
);

export async function connectFacebook() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "facebook",
    options: {
      redirectTo: `${window.location.origin}/marketmate?facebook_connected=true`,
      scopes: "pages_manage_posts,pages_read_engagement",
    },
  });
  
  return { data, error };
}
```

**Key Concept**: **Supabase as OAuth Proxy**
- Supabase handles OAuth handshake with Facebook
- BVA doesn't need to manage OAuth flow
- Supabase returns verified user metadata + access token
- BVA just stores the token

#### Backend: Receiving Supabase Callback

**File**: `server/src/routes/auth.routes.ts`

```typescript
router.post("/facebook/supabase-connect", async (req, res) => {
  const { provider_token, provider_refresh_token } = req.body;
  
  // Supabase already verified the user, we just store the token
  const userId = (req as any).userId;  // From auth middleware
  
  await prisma.socialMediaAccount.upsert({
    where: { userId_platform: { userId, platform: "FACEBOOK" } },
    create: {
      userId,
      platform: "FACEBOOK",
      accessToken: provider_token,
      refreshToken: provider_refresh_token,
    },
    update: {
      accessToken: provider_token,
      refreshToken: provider_refresh_token,
    },
  });
  
  res.json({ success: true, message: "Facebook connected" });
});
```

**Key Concept**: **OAuth Delegation**
- Supabase handles OAuth complexity (redirects, token exchange)
- BVA receives pre-verified tokens
- Simpler implementation, but depends on Supabase

---

## Machine Learning Logic

### Greedy Optimization (Restock Planner)

The Restock Planner uses a **Greedy Algorithm** to solve a **Knapsack Problem** variation: "Given a budget, which products should I restock to maximize profit/volume?"

#### Algorithm Overview

**File**: `ml-service/app/services/restock_service.py`

```python
def profit_maximization(
    products: List[ProductInput],
    budget: float,
    restock_days: int
) -> Tuple[List[RestockItem], List[str]]:
    """
    Greedy Algorithm:
    1. Calculate profit score for each product
    2. Sort by score (descending)
    3. Greedily select products until budget exhausted
    """
    scored_products = []
    
    for p in products:
        # Profit score = (price - cost) × daily_sales × urgency
        unit_profit = max(0.0, p.price - p.cost)
        daily_demand = p.avg_daily_sales
        
        # Urgency multiplier (higher when stock is low)
        current_days_of_stock = p.stock / daily_demand if daily_demand > 0 else 999
        if current_days_of_stock < 3:
            urgency = 3.0  # Critical
        elif current_days_of_stock < 7:
            urgency = 2.0  # High
        else:
            urgency = 1.0  # Normal
        
        profit_score = unit_profit * daily_demand * urgency
        
        # Calculate quantity needed
        needed_qty = max(0, int((daily_demand * restock_days) - p.stock))
        
        scored_products.append({
            'product': p,
            'score': profit_score,
            'qty': needed_qty,
        })
    
    # Sort by profit score (descending)
    scored_products.sort(key=lambda x: x['score'], reverse=True)
    
    # Greedily select products within budget
    selected_items = []
    remaining_budget = budget
    
    for item in scored_products:
        p = item['product']
        qty = item['qty']
        total_cost = p.cost * qty
        
        if total_cost <= remaining_budget:
            selected_items.append(RestockItem(
                product_id=p.product_id,
                name=p.name,
                qty=qty,
                total_cost=total_cost,
                expected_profit=qty * (p.price - p.cost),
            ))
            remaining_budget -= total_cost
            
            if remaining_budget < 1:
                break  # Budget exhausted
    
    return selected_items, reasoning
```

**Key Concept**: **Greedy Algorithm**
- Makes locally optimal choice at each step
- Doesn't backtrack (doesn't reconsider previous choices)
- Fast (O(n log n) due to sorting)
- May not be globally optimal, but "good enough" for this use case

**Why Greedy Works Here**:
- Products are independent (buying one doesn't affect others)
- Budget constraint is linear (not combinatorial)
- Profit score is additive (total profit = sum of individual profits)

### Vectorized Risk Scoring (SmartShelf)

SmartShelf uses **Vectorized Operations** (Pandas/NumPy) to compute risk scores for thousands of products in milliseconds.

#### Algorithm Overview

**File**: `ml-service/app/services/inventory_service.py`

```python
def compute_risk_scores(
    inventory: List[InventoryItem],
    sales: List[SalesRecord],
    thresholds: AtRiskThresholds
) -> List[AtRiskItem]:
    """
    Vectorized risk scoring using Pandas.
    Performance: O(n log n) for 10K+ products in <100ms.
    """
    # Convert to DataFrames (vectorized data structures)
    inv_df = prepare_inventory_dataframe([item.dict() for item in inventory])
    sales_df = prepare_sales_dataframe([sale.dict() for sale in sales])
    
    # Compute sales velocity (vectorized groupby)
    velocity_df = compute_daily_sales_velocity(sales_df, window_days=14)
    
    # Merge with inventory (vectorized join)
    inv_df = inv_df.merge(velocity_df, on='product_id', how='left')
    
    # Detect risks (vectorized boolean operations)
    inv_df = _detect_low_stock(inv_df, thresholds.low_stock)
    inv_df = _detect_near_expiry(inv_df, thresholds.expiry_days)
    inv_df = _detect_slow_moving(inv_df, thresholds.slow_moving_threshold)
    
    # Compute combined risk score (vectorized arithmetic)
    inv_df = _compute_risk_score(inv_df, thresholds)
    
    # Filter and sort
    at_risk_df = inv_df[inv_df['is_at_risk']].sort_values('risk_score', ascending=False)
    
    return [AtRiskItem(**row.to_dict()) for _, row in at_risk_df.iterrows()]

def _compute_risk_score(df: pd.DataFrame, thresholds: AtRiskThresholds) -> pd.DataFrame:
    """
    Vectorized risk score calculation.
    Score = (0.3 × low_stock) + (0.4 × near_expiry) + (0.3 × slow_moving)
    """
    # Vectorized arithmetic (all products at once)
    df['risk_score'] = (
        df['low_stock_score'] +
        df['near_expiry_score'] +
        df['slow_moving_score']
    )
    
    # Boost for items with multiple risk factors (vectorized)
    risk_factor_count = (
        df['low_stock_flag'].astype(int) +
        df['near_expiry_flag'].astype(int) +
        df['slow_moving_flag'].astype(int)
    )
    df['risk_score'] = np.where(
        risk_factor_count >= 2,
        df['risk_score'] * 1.1,  # 10% boost
        df['risk_score']
    )
    
    # Normalize to 0-1 range
    df['risk_score'] = df['risk_score'].clip(0, 1)
    
    return df
```

**Key Concept**: **Vectorization**
- Instead of looping: `for product in products: score = calculate(product)`
- We do: `df['risk_score'] = df['low_stock_score'] + df['near_expiry_score']`
- NumPy/Pandas execute operations in parallel (SIMD)
- 100x faster than Python loops for large datasets

**Performance Comparison**:
```python
# ❌ Slow: Python loop (O(n))
scores = []
for product in products:
    score = calculate_score(product)
    scores.append(score)

# ✅ Fast: Vectorized (O(1) per operation, parallelized)
df['risk_score'] = df['low_stock_score'] + df['near_expiry_score']
```

---

## Architectural Challenges & Solutions

### Challenge 1: API Quota Limits (Gemini/Imagen)

**Problem**: External APIs (Google Gemini, Imagen) rate-limit requests. Hitting quota limits causes 429 errors and potential API key bans.

**Solution**: Cooldown Manager with Error Caching

**File**: `ml-service/app/services/ad_service.py`

```python
class AdService:
    def __init__(self):
        self._quota_error_cache = {}  # {model: {timestamp, retry_after}}
        self._default_cooldown_seconds = 60
    
    def _is_quota_exceeded(self, model: str, allow_bypass: bool = False) -> bool:
        """Check if we recently hit quota limit for this model."""
        if model not in self._quota_error_cache:
            return False
        
        error_info = self._quota_error_cache[model]
        last_error_time = error_info.get("timestamp", 0)
        retry_after = error_info.get("retry_after", self._default_cooldown_seconds)
        
        elapsed = time.time() - last_error_time
        
        # If cooldown period has passed, clear the cache
        if elapsed > retry_after:
            del self._quota_error_cache[model]
            return False
        
        return True  # Still in cooldown period
    
    def _record_quota_error(self, model: str, error_message: str = ""):
        """Record a quota error and extract retry_after from error message."""
        retry_after = self._default_cooldown_seconds
        
        # Try to extract retry_after from error message
        if "retry after" in error_message.lower():
            # Parse "retry after 30 seconds"
            import re
            match = re.search(r'retry after (\d+)', error_message.lower())
            if match:
                retry_after = int(match.group(1))
        
        self._quota_error_cache[model] = {
            "timestamp": time.time(),
            "retry_after": retry_after,
        }
    
    async def generate_ad_copy(self, product_name: str, playbook: str) -> str:
        """Generate ad copy with quota protection."""
        model = "gemini-2.0-flash"
        
        # Check if we're in cooldown
        if self._is_quota_exceeded(model):
            raise QuotaExceededError("API quota exceeded. Please try again later.")
        
        try:
            response = await self._call_gemini_api(product_name, playbook)
            return response.text
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                self._record_quota_error(model, str(e))
                raise QuotaExceededError("API quota exceeded. Please try again later.")
            raise
```

**Key Concept**: **Circuit Breaker Pattern**
- Detects failures (429 errors)
- Enters "cooldown" state (blocks requests for X seconds)
- Prevents API key from being banned
- Automatically recovers after cooldown expires

### Challenge 2: Data Silos (Shopee vs Lazada)

**Problem**: Shopee and Lazada have different data formats. BVA needs a unified data model.

**Solution**: Adapter Pattern with Integration Services

**File**: `server/src/service/shopeeIntegration.service.ts`

```typescript
class ShopeeIntegrationService {
  async syncProducts(shopId: string, token: string): Promise<number> {
    // 1. Fetch from Shopee-Clone API (Shopee format)
    const response = await fetch(`${SHOPEE_CLONE_API_URL}/api/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const shopeeProducts = await response.json();
    
    // 2. Transform to BVA standard format
    const bvaProducts = shopeeProducts.map((sp: ShopeeProduct) => ({
      name: sp.productName,  // Shopee uses "productName"
      price: sp.price,
      stock: sp.quantity,
      externalId: sp.id,  // Store Shopee ID for future syncs
      platform: "SHOPEE",
      shopId,
    }));
    
    // 3. Save to BVA database (unified format)
    for (const product of bvaProducts) {
      await prisma.product.upsert({
        where: { externalId_shopId: { externalId: product.externalId, shopId } },
        create: product,
        update: product,
      });
    }
    
    return bvaProducts.length;
  }
}
```

**File**: `server/src/service/lazadaIntegration.service.ts`

```typescript
class LazadaIntegrationService {
  async syncProducts(shopId: string, token: string): Promise<number> {
    // 1. Fetch from Lazada-Clone API (Lazada format)
    const response = await fetch(`${LAZADA_CLONE_API_URL}/api/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const lazadaProducts = await response.json();
    
    // 2. Transform to BVA standard format (same as Shopee!)
    const bvaProducts = lazadaProducts.map((lp: LazadaProduct) => ({
      name: lp.title,  // Lazada uses "title" instead of "productName"
      price: lp.unitPrice,
      stock: lp.stockQuantity,
      externalId: lp.productId,  // Lazada uses "productId"
      platform: "LAZADA",
      shopId,
    }));
    
    // 3. Save to BVA database (unified format)
    for (const product of bvaProducts) {
      await prisma.product.upsert({
        where: { externalId_shopId: { externalId: product.externalId, shopId } },
        create: product,
        update: product,
      });
    }
    
    return bvaProducts.length;
  }
}
```

**Key Concept**: **Adapter Pattern**
- Each integration service adapts platform-specific format → BVA format
- BVA business logic works with unified format (doesn't care about platform)
- New platforms can be added by creating a new adapter service

### Challenge 3: Notification Duplication

**Problem**: Rapid sync operations or repeated connection attempts create duplicate notifications.

**Solution**: Deduplication Helper with Time Window

**File**: `server/src/utils/notificationHelper.ts`

```typescript
export async function createNotificationWithDeduplication(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  deduplicationWindowMs: number = 3600000  // 1 hour default
): Promise<Notification | null> {
  // Check for existing notification within time window
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      type,
      title,
      message,
      createdAt: {
        gte: new Date(Date.now() - deduplicationWindowMs),
      },
    },
  });
  
  // If duplicate found, skip creation
  if (existing) {
    console.log(`⏭️ Skipping duplicate notification: ${title}`);
    return null;
  }
  
  // Create new notification
  return await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
    },
  });
}
```

**Usage**:
```typescript
// In integration service
await createNotificationWithDeduplication(
  userId,
  "success",
  "Shopee Sync Completed",
  `Synced ${productsCount} products and ${salesCount} sales`,
  3600000  // Deduplicate for 1 hour
);
```

**Key Concept**: **Deduplication Window**
- Checks for identical notifications within time window
- Prevents spam (multiple notifications for same event)
- Configurable window (1 hour default, can be adjusted per use case)

---

## How-To: Applying These Patterns

### 1. How to Trigger a Modal (Frontend)

**Pattern**: Declarative State

**Application**: Use Shadcn UI Dialog component with controlled state.

```typescript
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      </DialogTrigger>
      <DialogContent>
        <p>Modal content</p>
      </DialogContent>
    </Dialog>
  );
}
```

**Key Points**:
- Don't call `modal.open()` - change state instead
- `open` prop controls visibility
- `onOpenChange` handles close (user clicks outside, presses ESC, etc.)

### 2. Sending Requests & Response Handling

**Pattern**: React Query + Axios

**Application**: Use `useQuery` for GET requests, `useMutation` for POST/PUT/DELETE.

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// GET request
function useProducts(shopId: string) {
  return useQuery({
    queryKey: ["products", shopId],
    queryFn: async () => {
      return await apiClient.get(`/api/products?shopId=${shopId}`);
    },
    enabled: !!shopId,
    staleTime: 30 * 1000,  // Cache for 30 seconds
  });
}

// POST request
function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ProductData) => {
      return await apiClient.post("/api/products", data);
    },
    onSuccess: () => {
      // Invalidate cache to refetch
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created!");
    },
  });
}
```

**Key Points**:
- `useQuery` for fetching (automatic caching, refetching)
- `useMutation` for mutations (manual trigger, success/error callbacks)
- Always invalidate related queries after mutations

### 3. Real-Time Updates (Socket.io)

**Pattern**: Pub/Sub

**Application**: Server emits events, client listens and updates UI.

**Server**:
```typescript
import { getSocketIO } from "../services/socket.service";

// Emit event to shop room
const io = getSocketIO();
io.to(`shop_${shopId}`).emit("dashboard_update", {
  type: "new_order",
  data: orderData,
});
```

**Client**:
```typescript
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

function useRealtimeUpdates(shopId: string) {
  const socketRef = useRef<Socket | null>(null);
  
  useEffect(() => {
    const socket = io(API_URL);
    socketRef.current = socket;
    
    // Join room
    socket.emit("join_shop", shopId);
    
    // Listen for events
    socket.on("dashboard_update", (update) => {
      console.log("Update received:", update);
      // Update UI (e.g., invalidate React Query cache)
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    });
    
    // Cleanup
    return () => {
      socket.emit("leave_shop", shopId);
      socket.disconnect();
    };
  }, [shopId]);
}
```

**Key Points**:
- Server emits to rooms (targeted updates)
- Client joins room on mount, leaves on unmount
- Use React Query invalidation to update UI when events arrive

### 4. OAuth 2.0 (Google vs. Facebook)

**Google (Manual JWT)**:
- Server handles OAuth flow
- Server generates JWT token
- Frontend stores token in `localStorage`
- Token attached to all API requests

**Facebook (Supabase)**:
- Supabase handles OAuth flow
- Frontend receives session from Supabase
- Frontend sends `provider_token` to BVA backend
- Backend stores token in database

**Key Points**:
- JWT = stateless (no server session)
- Supabase = managed OAuth (less code, more dependency)

### 5. Machine Learning Concepts

**Greedy Optimization**:
- Sort by score (profit/volume)
- Greedily select until budget exhausted
- Fast, "good enough" solution

**Vectorized Operations**:
- Use Pandas/NumPy instead of Python loops
- Operations execute in parallel (SIMD)
- 100x faster for large datasets

**Key Points**:
- Greedy = fast, approximate solution
- Vectorization = use libraries (Pandas/NumPy), not loops

### 6. Architectural Problems & Solutions

**API Quota Limits**:
- Implement cooldown manager
- Cache errors with timestamps
- Block requests during cooldown period

**Data Silos**:
- Use Adapter Pattern
- Transform platform format → unified format
- Business logic works with unified format

**Notification Duplication**:
- Check for existing notifications within time window
- Skip creation if duplicate found
- Configurable deduplication window

---

## Deep-Dive Feature Selection

Choose a feature to explore in detail:

1. **SmartShelf**: At-risk inventory detection, vectorized risk scoring, real-time alerts
2. **Restock Planner**: Greedy optimization, context-aware demand forecasting, budget allocation
3. **MarketMate**: AI ad generation, Facebook integration, campaign scheduling

Which feature would you like to deep-dive into first?

---

## Key Takeaways

1. **React Query**: Manages server state (caching, deduplication, refetching)
2. **Shadcn UI**: Declarative modals (state-driven, not imperative)
3. **Socket.io**: Pub/Sub for real-time updates (rooms, events)
4. **JWT**: Stateless authentication (token in localStorage, validated on each request)
5. **Supabase OAuth**: Managed OAuth (less code, more dependency)
6. **Greedy Algorithm**: Fast, approximate optimization (sort + select)
7. **Vectorization**: Pandas/NumPy operations (parallel, 100x faster than loops)
8. **Adapter Pattern**: Transform platform formats → unified format
9. **Circuit Breaker**: Cooldown manager for API quota protection
10. **Deduplication**: Time-window checks to prevent duplicate notifications

---

*This guide is a living document. As the codebase evolves, update examples to reflect current implementation.*

