# Data Journey Analysis: BVA System Architecture
## White Box Analysis for Junior Developers & Product Managers

**Author:** Senior System Architect  
**Date:** December 7, 2025  
**Purpose:** Trace data flow through Frontend → Backend → Database → ML Service to understand WHY data transforms at each layer

---

## Architecture Overview

```
┌─────────────────┐
│  BVA Frontend   │  React/TypeScript (Port 8080)
│  (React Query)   │
└────────┬────────┘
         │ HTTP/JSON
         │ Authorization: Bearer <JWT>
         ▼
┌─────────────────┐
│  Node.js API    │  Express/TypeScript (Port 3000)
│  Gateway        │  - Authentication & Authorization
│                 │  - Request Validation
│                 │  - Data Aggregation
└────────┬────────┘
         │ HTTP/JSON
         │ Internal Service Call
         ▼
┌─────────────────┐      ┌─────────────────┐
│  PostgreSQL     │      │  Python ML       │
│  Database       │◄─────┤  Service         │
│  (Prisma ORM)   │      │  (FastAPI)       │
│                 │      │  Port 8001       │
└─────────────────┘      └─────────────────┘
```

**Why This Architecture?**
- **API Gateway Pattern:** All ML operations route through Node.js backend for security, rate limiting, and consistent error handling
- **Separation of Concerns:** Frontend handles UI, Backend handles business logic, ML Service handles AI/ML computations
- **Type Safety:** TypeScript interfaces ensure data contracts are maintained across layers

---

## Flow 1: SmartShelf At-Risk Inventory Detection

### **Purpose:** Identify products that need immediate attention (low stock, near expiry, slow-moving)

---

### **Stage 1: Frontend Initiation**

**INPUT:**
```typescript
{
  shopId: "shop-uuid-123",
  enabled: true  // React Query flag
}
```

**PROCESS:**
```typescript
// File: bva-frontend/src/hooks/useSmartShelf.ts
useQuery({
  queryKey: ["at-risk-inventory", shopId],
  queryFn: () => analyticsService.getAtRiskInventory(shopId),
  refetchInterval: 60000  // WHY: Auto-refresh every minute for real-time alerts
})
```

**WHY:** React Query caches the response and automatically refetches every 60 seconds. This ensures users see updated risk status without manual refresh, critical for time-sensitive inventory issues.

**OUTPUT:** HTTP GET request to `/api/smart-shelf/${shopId}/at-risk`

---

### **Stage 2: Backend Controller (Request Handler)**

**INPUT:**
```http
GET /api/smart-shelf/:shopId/at-risk
Headers: { Authorization: "Bearer <JWT>" }
```

**PROCESS:**
```typescript
// File: server/src/controllers/smartShelf.controller.ts
export const getAtRiskInventory = async (req: Request, res: Response) => {
  const { shopId } = req.params;  // Extract from URL path
  
  // WHY: Validate shopId exists before expensive DB queries
  if (!shopId) {
    return res.status(400).json({ error: "Shop ID required" });
  }
  
  // Fetch products and sales data (see Stage 3)
  // Call ML service (see Stage 4)
  // Transform response (see Stage 5)
}
```

**WHY:** Controllers are thin - they validate input, delegate to services, and format HTTP responses. This separation allows business logic to be tested independently of HTTP concerns.

**OUTPUT:** Delegates to service layer, awaits response

---

### **Stage 3: Backend Service (Data Aggregation)**

**INPUT:**
```typescript
shopId: "shop-uuid-123"
```

**PROCESS:**
```typescript
// File: server/src/controllers/smartShelf.controller.ts (lines 62-112)

// Step 3.1: Fetch Products with Inventory
const products = await prisma.product.findMany({
  where: { shopId },
  include: { inventories: { take: 1 } }  // WHY: Only latest inventory record needed
});

// Step 3.2: Fetch Sales History (last 90 days)
const ninetyDaysAgo = new Date();
ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

const sales = await prisma.sale.findMany({
  where: {
    shopId,
    createdAt: { gte: ninetyDaysAgo }  // WHY: ML needs recent sales patterns
  },
  select: { items: true, createdAt: true }
});

// Step 3.3: Transform Database Models → ML Service Format
const inventoryItems = products.map(p => ({
  product_id: p.id,           // WHY: ML service uses snake_case
  sku: p.sku,
  name: p.name,
  quantity: p.inventories[0]?.quantity ?? p.stock ?? 0,  // WHY: Fallback chain ensures we always have a quantity
  expiry_date: p.expiryDate?.toISOString(),  // WHY: ISO format for date parsing in Python
  price: p.price,
  categories: p.description ? [p.description] : []
}));

const salesRecords = [];
sales.forEach(sale => {
  const items = typeof sale.items === "string" 
    ? JSON.parse(sale.items)  // WHY: Prisma stores JSON as string, need to parse
    : sale.items;
    
  items.forEach(item => {
    salesRecords.push({
      product_id: item.productId,
      date: sale.createdAt.toISOString(),
      qty: item.quantity || 1,
      revenue: (item.price || 0) * (item.quantity || 1)  // WHY: ML calculates velocity, needs revenue for profit analysis
    });
  });
});
```

**WHY:** 
- **Data Aggregation:** We combine products, inventory, and sales into a single request to minimize ML service round-trips
- **Format Transformation:** Database uses camelCase (TypeScript convention), ML service uses snake_case (Python convention)
- **Fallback Logic:** `p.inventories[0]?.quantity ?? p.stock ?? 0` ensures we never send `null` to ML service, which would cause errors

**OUTPUT:**
```typescript
{
  shop_id: "shop-uuid-123",
  inventory: [
    {
      product_id: "prod-1",
      sku: "SKU-001",
      name: "Product Name",
      quantity: 5,
      expiry_date: "2025-12-14T00:00:00Z",
      price: 29.99,
      categories: ["Electronics"]
    },
    // ... more products
  ],
  sales: [
    {
      product_id: "prod-1",
      date: "2025-12-01T10:30:00Z",
      qty: 2,
      revenue: 59.98
    },
    // ... more sales records
  ],
  thresholds: {
    low_stock: 5,
    expiry_days: 7,
    slow_moving_window: 30
  }
}
```

---

### **Stage 4: ML Service (Risk Computation)**

**INPUT:**
```python
# File: ml-service/app/routes/smart_shelf.py
request: AtRiskRequest = {
    shop_id: str,
    inventory: List[InventoryItem],
    sales: List[SalesRecord],
    thresholds: AtRiskThresholds
}
```

**PROCESS:**
```python
# Step 4.1: Validate Payload Size
if len(request.inventory) > settings.MAX_PAYLOAD_ROWS:
    raise HTTPException(413, "Payload too large")
# WHY: Prevent memory exhaustion attacks

# Step 4.2: Convert to Pandas DataFrames
inv_df = prepare_inventory_dataframe([item.dict() for item in inventory])
sales_df = prepare_sales_dataframe([sale.dict() for sale in sales])
# WHY: Pandas enables vectorized operations (100x faster than Python loops)

# Step 4.3: Compute Sales Velocity
velocity_df = compute_daily_sales_velocity(
    sales_df,
    window_days=thresholds.slow_moving_window  # 30 days
)
# WHY: Calculate average daily sales per product to detect slow-moving items

# Step 4.4: Merge Inventory with Velocity
inv_df = inv_df.merge(
    velocity_df[['product_id', 'avg_daily_sales']],
    on='product_id',
    how='left'  # WHY: Keep all products even if no sales (left join)
)
inv_df['avg_daily_sales'] = inv_df['avg_daily_sales'].fillna(0)
# WHY: Products with no sales get 0 velocity (critical for slow-moving detection)

# Step 4.5: Detect Risk Types (Vectorized)
inv_df = _detect_low_stock(inv_df, thresholds.low_stock)      # qty <= 5
inv_df = _detect_near_expiry(inv_df, thresholds.expiry_days)   # expires <= 7 days
inv_df = _detect_slow_moving(inv_df, thresholds.slow_moving_threshold)  # velocity < 0.5/day

# Step 4.6: Compute Risk Scores
# WHY: Scores combine multiple risk factors into single priority metric
# Formula: risk_score = low_stock_score + near_expiry_score + slow_moving_score
# - Low stock (qty=0): 0.8 (80 points)
# - Near expiry (1-2 days): 0.7-0.8 (70-80 points)
# - Multiple risks: 1.1x multiplier

# Step 4.7: Filter & Sort
at_risk_df = inv_df[inv_df['is_at_risk']].copy()
at_risk_df = at_risk_df.sort_values('risk_score', ascending=False)
# WHY: Only return items needing attention, sorted by urgency

# Step 4.8: Generate Recommendations
for _, row in at_risk_df.iterrows():
    recommendation = _compute_recommendation(row, thresholds)
    # WHY: Each risk type gets specific action (restock, discount, bundle)
```

**WHY:**
- **Vectorized Operations:** Pandas processes thousands of products in milliseconds vs seconds with loops
- **Risk Scoring:** Combines multiple signals (stock level, expiry, velocity) into actionable priority
- **Recommendations:** ML generates specific actions (e.g., "Restock 31 units for 30-day supply") not just flags

**OUTPUT:**
```python
{
    "at_risk": [
        {
            "product_id": "prod-1",
            "sku": "SKU-001",
            "name": "Product Name",
            "reasons": ["low_stock", "near_expiry"],
            "score": 0.88,  # 0-1 range
            "current_quantity": 0,
            "days_to_expiry": 3,
            "avg_daily_sales": 1.2,
            "recommended_action": {
                "action_type": "restock",
                "restock_qty": 36,
                "reasoning": "Low stock with 0.0 days remaining. Restock 36 units for 30-day supply."
            }
        }
    ],
    "meta": {
        "shop_id": "shop-uuid-123",
        "total_products": 15,
        "flagged_count": 3,
        "analysis_date": "2025-12-07T06:17:00Z",
        "thresholds_used": {...}
    }
}
```

---

### **Stage 5: Backend Response Transformation**

**INPUT:** ML Service response (scores 0-1 range)

**PROCESS:**
```typescript
// File: server/src/controllers/smartShelf.controller.ts (lines 127-131)

// Convert scores from 0-1 to 0-100 for frontend display
const atRiskItems = (atRiskResult.at_risk || []).map(item => ({
  ...item,
  score: Math.round(item.score * 100)  // WHY: Frontend expects 0-100 for percentage display
}));
```

**WHY:** Frontend displays scores as percentages (e.g., "Risk Score: 88%"), so we multiply by 100. This transformation happens in the backend to keep frontend code simple.

**OUTPUT:**
```typescript
{
  success: true,
  data: {
    at_risk: [
      {
        product_id: "prod-1",
        score: 88,  // Converted from 0.88
        // ... rest of fields
      }
    ],
    meta: {
      shop_id: "shop-uuid-123",
      total_products: 15,
      flagged_count: 3,
      analysis_date: "2025-12-07T06:17:00Z"
    }
  }
}
```

---

### **Stage 6: Frontend Display**

**INPUT:** HTTP Response with at-risk items

**PROCESS:**
```typescript
// File: bva-frontend/src/pages/SmartShelf.tsx

// React Query automatically caches and updates UI
const { data: atRiskData, isLoading } = useAtRiskInventory(shopId);

// Display logic
{atRiskData?.at_risk.map(item => (
  <Card>
    <Badge variant={getRiskColor(item.score)}>  // WHY: Color coding (red/yellow/gray) for visual priority
      {getRiskLabel(item.score)} - {item.score}
    </Badge>
    <div>Stock: {item.current_quantity} units</div>
    <div>Expires in: {item.days_to_expiry} days</div>
    <div>{item.recommended_action.reasoning}</div>  // WHY: Show actionable recommendation
  </Card>
))}
```

**WHY:**
- **Visual Hierarchy:** Color coding (red=critical, yellow=high risk) helps users prioritize
- **Actionable UI:** Each item shows recommended action (restock qty, discount range) so users can act immediately
- **Auto-refresh:** React Query refetches every 60 seconds, ensuring real-time updates

**OUTPUT:** Rendered UI showing critical items with risk scores, recommendations, and action buttons

---

## Flow 2: MarketMate Ad Generation

### **Purpose:** Generate AI-powered ad copy and images for product promotions

---

### **Stage 1: Frontend User Input**

**INPUT:**
```typescript
{
  productName: "Wireless Headphones",
  playbook: "Flash Sale",
  discount: "20%"
}
```

**PROCESS:**
```typescript
// File: bva-frontend/src/pages/MarketMate.tsx
const handleGenerate = async () => {
  setIsLoading(true);
  try {
    const response = await aiService.generateAdCopy({
      product_name: productName,
      playbook: playbook,
      discount: discount
    });
    setAdCopy(response.data.generated_ad_copy);
  } catch (error) {
    showErrorToast(error.message);
  } finally {
    setIsLoading(false);
  }
};
```

**WHY:** Frontend handles user interaction, loading states, and error display. Business logic stays in backend.

**OUTPUT:** HTTP POST to `/api/v1/ads/generate-ad`

---

### **Stage 2: Backend Controller**

**INPUT:**
```http
POST /api/v1/ads/generate-ad
Body: {
  product_name: "Wireless Headphones",
  playbook: "Flash Sale",
  discount: "20%"
}
```

**PROCESS:**
```typescript
// File: server/src/controllers/ad.controller.ts
public async generatedAd(req: Request, res: Response) {
  const requestData: AdRequest = req.body;
  
  // Validate required fields
  if (!requestData.product_name || !requestData.playbook) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  
  // Delegate to service
  const adCopy = await adService.generateAdCopy(requestData);
  
  return res.json({
    success: true,
    data: {
      playbookUsed: requestData.playbook,
      product_name: requestData.product_name,
      generated_ad_copy: adCopy
    }
  });
}
```

**WHY:** Controller validates input format, delegates to service layer, formats HTTP response. Keeps HTTP concerns separate from business logic.

**OUTPUT:** Calls `adService.generateAdCopy()`

---

### **Stage 3: Backend Service (ML Gateway)**

**INPUT:**
```typescript
{
  product_name: "Wireless Headphones",
  playbook: "Flash Sale",
  discount: "20%"
}
```

**PROCESS:**
```typescript
// File: server/src/service/ad.service.ts
async generateAdCopy(request: AdRequest): Promise<string> {
  try {
    // Forward to ML service
    const response = await mlClient.generateAdCopy({
      product_name: request.product_name,
      playbook: request.playbook,
      discount: request.discount
    });
    return response.ad_copy;
  } catch (error) {
    // Fallback to template-based copy if ML service unavailable
    if (error.message.includes("AI Service Unavailable")) {
      return this.generateFallbackCopy(request);
    }
    throw error;
  }
}
```

**WHY:** 
- **API Gateway Pattern:** All ML calls go through backend for security (API keys stay server-side)
- **Graceful Degradation:** If ML service is down, fallback to template-based copy ensures users aren't blocked

**OUTPUT:** HTTP POST to ML service `/api/v1/ads/generate-copy`

---

### **Stage 4: ML Service (AI Generation)**

**INPUT:**
```python
# File: ml-service/app/routes/ads.py
{
    "product_name": "Wireless Headphones",
    "playbook": "Flash Sale",
    "discount": "20%"
}
```

**PROCESS:**
```python
# Step 4.1: Build Prompt
prompt = f"""
Generate a {playbook} ad copy for {product_name}.
Discount: {discount}
Tone: Urgent, exciting
Include: Benefits, call-to-action, emojis
"""

# Step 4.2: Call Gemini API
response = self.client.models.generate_content(
    model="gemini-2.0-flash-exp",
    contents=[prompt],
    config=types.GenerateContentConfig(
        temperature=0.9,  # WHY: Higher creativity for marketing copy
        top_p=0.95,
        max_output_tokens=300
    )
)

# Step 4.3: Extract & Clean
ad_copy = response.text.strip()
hashtags = extract_hashtags(ad_copy)  # WHY: Extract hashtags for social media

# Step 4.4: Handle Errors
if "429 RESOURCE_EXHAUSTED" in str(error):
    return generate_fallback_copy()  # WHY: Quota exceeded, use template
```

**WHY:**
- **Temperature 0.9:** High creativity needed for marketing copy (vs 0.3 for factual data)
- **Token Limit 300:** Keeps ad copy concise and focused
- **Error Handling:** Quota limits are common with free-tier APIs, fallback ensures reliability

**OUTPUT:**
```python
{
    "ad_copy": "🎧 FLASH SALE! Get 20% OFF Wireless Headphones! 🎧\n\nExperience crystal-clear sound and all-day comfort. Limited time offer - don't miss out!\n\nShop now! ⚡",
    "hashtags": ["#WirelessHeadphones", "#FlashSale", "#Deals"]
}
```

---

### **Stage 5: Frontend Display**

**INPUT:** Generated ad copy response

**PROCESS:**
```typescript
// File: bva-frontend/src/pages/MarketMate.tsx
<div className="ad-preview">
  <textarea value={adCopy} readOnly />
  <div className="hashtags">
    {hashtags.map(tag => <Badge>#{tag}</Badge>)}
  </div>
  <Button onClick={handleCopyToClipboard}>Copy Ad</Button>
</div>
```

**WHY:** Read-only textarea allows users to review and copy ad copy. Hashtags displayed separately for easy social media posting.

**OUTPUT:** Rendered UI with ad copy, hashtags, and copy button

---

## Flow 3: Smart Restock Planner

### **Purpose:** Calculate optimal restocking quantities based on budget, sales history, and profit margins

---

### **Stage 1: Frontend User Input**

**INPUT:**
```typescript
{
  shopId: "shop-uuid-123",
  budget: 5000,
  goal: "profit",  // or "volume" or "balanced"
  restockDays: 30
}
```

**PROCESS:**
```typescript
// File: bva-frontend/src/pages/RestockPlanner.tsx
const handleCalculate = async () => {
  const response = await restockApi.getRestockStrategy({
    shopId: user.shops[0].id,
    budget: parseFloat(budget),
    goal: selectedGoal,
    restockDays: 30
  });
  setRecommendations(response.data.recommendations);
};
```

**WHY:** Frontend collects user preferences (budget, goal) and sends to backend. Business logic stays server-side.

**OUTPUT:** HTTP POST to `/api/ai/restock-strategy`

---

### **Stage 2: Backend Service (Data Preparation)**

**INPUT:**
```typescript
{
  shopId: "shop-uuid-123",
  budget: 5000,
  goal: "profit",
  restockDays: 30
}
```

**PROCESS:**
```typescript
// File: server/src/service/restock.service.ts

// Step 2.1: Fetch Products with Inventory
const products = await prisma.product.findMany({
  where: { shopId },
  include: { inventories: { take: 1 } }
});

// Step 2.2: Calculate Average Daily Sales (60-day window)
const sixtyDaysAgo = new Date();
sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

const sales = await prisma.sale.findMany({
  where: {
    shopId,
    createdAt: { gte: sixtyDaysAgo }
  },
  select: { items: true, createdAt: true }
});

// Step 2.3: Aggregate Sales per Product
products.forEach(product => {
  let totalQuantitySold = 0;
  const salesDates = new Set<string>();
  
  sales.forEach(sale => {
    const items = JSON.parse(sale.items);
    items.forEach(item => {
      if (item.productId === product.id) {
        totalQuantitySold += item.quantity;
        salesDates.add(sale.createdAt.toISOString().split("T")[0]);
      }
    });
  });
  
  // WHY: Calculate average daily sales (not just total)
  const daysWithSales = salesDates.size || 1;  // Prevent division by zero
  const avgDailySales = totalQuantitySold / daysWithSales;
  
  // WHY: Calculate profit margin for ML optimization
  const profitMargin = ((product.price - product.cost) / product.price) * 100;
  
  productInputs.push({
    product_id: product.id,
    name: product.name,
    price: product.price,
    cost: product.cost,
    stock: product.inventories[0]?.quantity || 0,
    avg_daily_sales: avgDailySales,
    profit_margin: profitMargin
  });
});
```

**WHY:**
- **60-Day Window:** Recent sales patterns are more predictive than older data
- **Average Daily Sales:** ML needs velocity (units/day) not just total sales
- **Profit Margin:** ML optimizes for profit goal by prioritizing high-margin products

**OUTPUT:**
```typescript
{
  shop_id: "shop-uuid-123",
  budget: 5000,
  goal: "profit",
  restock_days: 30,
  products: [
    {
      product_id: "prod-1",
      name: "Product A",
      price: 29.99,
      cost: 15.00,
      stock: 10,
      avg_daily_sales: 2.5,
      profit_margin: 49.98
    },
    // ... more products
  ]
}
```

---

### **Stage 3: ML Service (Optimization Algorithm)**

**INPUT:** Restock request with products and budget

**PROCESS:**
```python
# File: ml-service/app/services/restock_service.py

# Step 3.1: Select Strategy Based on Goal
if goal == "profit":
    strategy = profit_maximization(products, budget, restock_days)
elif goal == "volume":
    strategy = volume_maximization(products, budget, restock_days)
else:
    strategy = balanced_strategy(products, budget, restock_days)

# Step 3.2: Profit Maximization Algorithm
def profit_maximization(products, budget, restock_days):
    # WHY: Sort by profit margin × velocity (highest ROI first)
    products_sorted = sorted(
        products,
        key=lambda p: (p.price - p.cost) * p.avg_daily_sales,
        reverse=True
    )
    
    recommendations = []
    remaining_budget = budget
    
    for product in products_sorted:
        # Calculate optimal restock quantity
        days_of_stock = product.stock / max(product.avg_daily_sales, 0.1)
        target_days = restock_days
        
        if days_of_stock < target_days:
            qty_needed = (target_days - days_of_stock) * product.avg_daily_sales
            total_cost = qty_needed * product.cost
            
            if total_cost <= remaining_budget:
                recommendations.append({
                    "product_id": product.product_id,
                    "qty": int(qty_needed),
                    "total_cost": total_cost,
                    "expected_profit": qty_needed * (product.price - product.cost),
                    "days_of_stock": target_days,
                    "priority_score": calculate_priority(product)
                })
                remaining_budget -= total_cost
            else:
                # WHY: If can't afford full restock, buy what budget allows
                affordable_qty = int(remaining_budget / product.cost)
                if affordable_qty > 0:
                    recommendations.append({
                        "qty": affordable_qty,
                        "total_cost": remaining_budget,
                        # ... rest of fields
                    })
                    break
    
    return recommendations
```

**WHY:**
- **Greedy Algorithm:** Prioritizes highest ROI products first (profit margin × velocity)
- **Budget Constraint:** Stops when budget exhausted, ensures recommendations are actionable
- **Days of Stock Calculation:** Ensures 30-day supply (prevents stockouts)

**OUTPUT:**
```python
{
    "strategy": "profit",
    "shop_id": "shop-uuid-123",
    "budget": 5000,
    "items": [
        {
            "product_id": "prod-1",
            "name": "Product A",
            "qty": 50,
            "unit_cost": 15.00,
            "total_cost": 750.00,
            "expected_profit": 749.50,
            "expected_revenue": 1499.50,
            "days_of_stock": 30,
            "priority_score": 0.95,
            "reasoning": "High profit margin (49.98%) with strong sales velocity (2.5/day)"
        },
        // ... more recommendations
    ],
    "totals": {
        "total_items": 8,
        "total_qty": 320,
        "total_cost": 4850.00,
        "budget_used_pct": 97.0,
        "expected_revenue": 12500.00,
        "expected_profit": 6250.00,
        "expected_roi": 128.87,
        "avg_days_of_stock": 28.5
    },
    "insights": [
        "Focus on high-margin products (Product A, Product C)",
        "Budget utilization: 97% - excellent efficiency"
    ]
}
```

---

### **Stage 4: Frontend Display**

**INPUT:** Restock recommendations with priority scores

**PROCESS:**
```typescript
// File: bva-frontend/src/pages/RestockPlanner.tsx
{recommendations.map((item, index) => (
  <TableRow key={item.product_id}>
    <TableCell>{index + 1}</TableCell>  // WHY: Show priority order
    <TableCell>
      <Badge variant={item.priority_score > 0.8 ? "destructive" : "default"}>
        {item.productName}
      </Badge>
    </TableCell>
    <TableCell>{item.currentStock} → {item.recommendedQty}</TableCell>  // WHY: Show before/after
    <TableCell>${item.totalCost.toFixed(2)}</TableCell>
    <TableCell>${item.expectedProfit.toFixed(2)}</TableCell>
    <TableCell>{item.reasoning}</TableCell>  // WHY: Explain WHY this product was recommended
  </TableRow>
))}

<div className="summary">
  <Card>
    <div>Total Cost: ${summary.totalCost}</div>
    <div>Expected Profit: ${summary.expectedProfit}</div>
    <div>ROI: {summary.expectedROI.toFixed(1)}%</div>
    <div>Budget Used: {summary.budgetUtilization.toFixed(1)}%</div>
  </Card>
</div>
```

**WHY:**
- **Priority Ordering:** Highest ROI products shown first
- **Before/After Stock:** Visual comparison helps users understand impact
- **Reasoning Column:** Explains ML decision (builds trust)
- **Summary Card:** Quick overview of total investment and expected returns

**OUTPUT:** Rendered table with prioritized recommendations, summary metrics, and action buttons

---

## Key Data Transformations Summary

| Layer | Input Format | Output Format | Why Transform? |
|-------|-------------|---------------|----------------|
| **Frontend** | User input (strings, numbers) | HTTP JSON | Standardize communication protocol |
| **Backend Controller** | HTTP request | Service DTOs | Validate & sanitize before business logic |
| **Backend Service** | Database models (camelCase) | ML format (snake_case) | Match Python/ML service conventions |
| **ML Service** | JSON arrays | Pandas DataFrames | Enable vectorized operations (100x faster) |
| **ML Service** | Risk scores (0-1) | Risk scores (0-100) | Frontend expects percentage display |
| **Frontend** | API response | UI components | Transform data into visual representations |

---

## Why These Patterns Matter

### **1. API Gateway Pattern**
**Why:** All ML service calls route through Node.js backend
- **Security:** API keys (Gemini, etc.) stay server-side, never exposed to frontend
- **Rate Limiting:** Backend can throttle requests before hitting ML service
- **Error Handling:** Consistent error format across all ML features
- **Caching:** Backend can cache expensive ML responses

### **2. Data Aggregation in Backend**
**Why:** Backend combines multiple database queries before sending to ML
- **Performance:** Single HTTP call to ML service vs multiple calls
- **Cost:** ML service calls are expensive (API quotas), minimize round-trips
- **Consistency:** All related data sent together ensures ML has complete context

### **3. Format Transformation**
**Why:** Each layer uses its native conventions
- **TypeScript (camelCase):** Matches JavaScript ecosystem standards
- **Python (snake_case):** Matches Python/Pandas conventions
- **Database (camelCase):** Prisma uses TypeScript conventions
- **Transformation Layer:** Backend service handles conversion, keeps layers decoupled

### **4. Fallback Mechanisms**
**Why:** System degrades gracefully when ML service unavailable
- **Ad Generation:** Falls back to template-based copy if Gemini API fails
- **Risk Detection:** Returns empty array if ML service down (better than error)
- **User Experience:** Users can still use system even if AI features unavailable

---

## Common Pitfalls & Solutions

### **Pitfall 1: Sending Null Values to ML Service**
**Problem:** Database may have `null` for optional fields (expiry_date, inventory quantity)
**Solution:** Use fallback chain: `p.inventories[0]?.quantity ?? p.stock ?? 0`
**Why:** ML service expects numbers, not null. Fallback ensures we always send valid data.

### **Pitfall 2: Date Format Mismatches**
**Problem:** JavaScript Date objects vs ISO strings vs Python datetime
**Solution:** Always convert to ISO string: `date.toISOString()`
**Why:** ISO format is unambiguous and works across all systems.

### **Pitfall 3: Score Range Mismatches**
**Problem:** ML returns 0-1, frontend expects 0-100
**Solution:** Transform in backend: `score * 100`
**Why:** Keep frontend simple, handle transformation in one place.

### **Pitfall 4: JSON String vs Object**
**Problem:** Prisma stores JSON as string, need to parse before use
**Solution:** `typeof sale.items === "string" ? JSON.parse(sale.items) : sale.items`
**Why:** Prisma's JSON type can be string or object depending on how it was inserted.

---

## Performance Considerations

### **Database Query Optimization**
- **Why:** Use `include` to fetch related data in single query (reduces round-trips)
- **Example:** `include: { inventories: { take: 1 } }` fetches product + inventory together

### **ML Service Timeout**
- **Why:** ML operations can take 5-30 seconds, set timeout appropriately
- **Example:** `timeout: 60000` (60 seconds) prevents hanging requests

### **React Query Caching**
- **Why:** Cache API responses to avoid unnecessary requests
- **Example:** `refetchInterval: 60000` auto-refreshes but uses cache for instant UI updates

### **Pandas Vectorization**
- **Why:** Process thousands of products in milliseconds vs seconds
- **Example:** `df['risk_score'] = df['low_stock_score'] + df['near_expiry_score']` (vectorized) vs Python loops

---

## Conclusion

Understanding the data journey helps developers:
1. **Debug Issues:** Know where data transforms, easier to trace bugs
2. **Optimize Performance:** Identify bottlenecks (DB queries, ML calls, transformations)
3. **Maintain Code:** Understand WHY patterns exist, easier to extend
4. **Build Features:** Know which layer handles what responsibility

**Key Takeaway:** Each layer has a specific responsibility. Frontend handles UI, Backend handles business logic & data aggregation, ML Service handles AI/ML computations. Data transforms at boundaries to match each layer's conventions.

---

**End of Analysis**

