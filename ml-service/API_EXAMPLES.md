# API Examples - SmartShelf ML Service

This file contains ready-to-use API examples for testing with curl, PowerShell, or Postman.

---

## 1. Health Check

### curl (bash/Linux)

```bash
curl http://localhost:8000/health
```

### PowerShell

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get
```

### Expected Response

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "components": {
    "cache": "up"
  }
}
```

---

## 2. At-Risk Inventory Detection

### PowerShell

```powershell
$body = @{
    shop_id = "shop_001"
    inventory = @(
        @{
            product_id = "p001"
            sku = "SKU001"
            name = "Fresh Milk"
            quantity = 5
            expiry_date = "2025-11-20T00:00:00Z"
            price = 3.99
        },
        @{
            product_id = "p002"
            sku = "SKU002"
            name = "Bread"
            quantity = 50
            expiry_date = "2025-11-18T00:00:00Z"
            price = 2.49
        }
    )
    sales = @(
        @{
            product_id = "p001"
            date = "2025-11-10"
            qty = 2.0
            revenue = 7.98
        },
        @{
            product_id = "p002"
            date = "2025-11-10"
            qty = 8.0
            revenue = 19.92
        }
    )
    thresholds = @{
        low_stock = 10
        expiry_days = 7
        slow_moving_window = 30
        slow_moving_threshold = 0.5
    }
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/smart-shelf/at-risk" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"

$response | ConvertTo-Json -Depth 10
```

### curl

```bash
curl -X POST "http://localhost:8000/api/v1/smart-shelf/at-risk" \
  -H "Content-Type: application/json" \
  -d '{
    "shop_id": "shop_001",
    "inventory": [
      {
        "product_id": "p001",
        "sku": "SKU001",
        "name": "Fresh Milk",
        "quantity": 5,
        "expiry_date": "2025-11-20T00:00:00Z",
        "price": 3.99
      }
    ],
    "sales": [
      {
        "product_id": "p001",
        "date": "2025-11-10",
        "qty": 2.0
      }
    ],
    "thresholds": {
      "low_stock": 10,
      "expiry_days": 7,
      "slow_moving_window": 30,
      "slow_moving_threshold": 0.5
    }
  }'
```

---

## 3. Demand Forecasting

### PowerShell

```powershell
$body = @{
    shop_id = "shop_001"
    product_id = "p001"
    sales = @(
        @{ product_id = "p001"; date = "2025-11-01"; qty = 10 },
        @{ product_id = "p001"; date = "2025-11-02"; qty = 12 },
        @{ product_id = "p001"; date = "2025-11-03"; qty = 11 },
        @{ product_id = "p001"; date = "2025-11-04"; qty = 13 },
        @{ product_id = "p001"; date = "2025-11-05"; qty = 15 },
        @{ product_id = "p001"; date = "2025-11-06"; qty = 14 },
        @{ product_id = "p001"; date = "2025-11-07"; qty = 16 },
        @{ product_id = "p001"; date = "2025-11-08"; qty = 15 },
        @{ product_id = "p001"; date = "2025-11-09"; qty = 17 },
        @{ product_id = "p001"; date = "2025-11-10"; qty = 18 },
        @{ product_id = "p001"; date = "2025-11-11"; qty = 16 },
        @{ product_id = "p001"; date = "2025-11-12"; qty = 19 },
        @{ product_id = "p001"; date = "2025-11-13"; qty = 20 },
        @{ product_id = "p001"; date = "2025-11-14"; qty = 18 },
        @{ product_id = "p001"; date = "2025-11-15"; qty = 21 }
    )
    periods = 14
    model = "auto"
    confidence_interval = 0.95
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/smart-shelf/forecast" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"

$response | ConvertTo-Json -Depth 10
```

### curl

```bash
curl -X POST "http://localhost:8000/api/v1/smart-shelf/forecast" \
  -H "Content-Type: application/json" \
  -d '{
    "shop_id": "shop_001",
    "product_id": "p001",
    "sales": [
      {"product_id": "p001", "date": "2025-11-01", "qty": 10},
      {"product_id": "p001", "date": "2025-11-02", "qty": 12},
      {"product_id": "p001", "date": "2025-11-03", "qty": 11}
    ],
    "periods": 14,
    "model": "auto"
  }'
```

---

## 4. Promotion Planning

### PowerShell

```powershell
$body = @{
    shop_id = "shop_001"
    items = @(
        @{
            product_id = "p001"
            name = "Fresh Berries"
            expiry_date = "2025-11-20"
            quantity = 30
            price = 5.99
            categories = @("produce", "fresh")
        }
    )
    calendar_events = @(
        @{
            id = "evt_001"
            date = "2025-11-18"
            title = "Weekend Sale"
            audience = "families"
        },
        @{
            id = "evt_002"
            date = "2025-11-22"
            title = "Black Friday"
            audience = "general"
        }
    )
    preferences = @{
        discount_max_pct = 40.0
        min_margin_pct = 10.0
        max_promo_duration_days = 7
    }
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/smart-shelf/promotions" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"

$response | ConvertTo-Json -Depth 10
```

### curl

```bash
curl -X POST "http://localhost:8000/api/v1/smart-shelf/promotions" \
  -H "Content-Type: application/json" \
  -d '{
    "shop_id": "shop_001",
    "items": [
      {
        "product_id": "p001",
        "name": "Fresh Berries",
        "expiry_date": "2025-11-20",
        "quantity": 30,
        "price": 5.99
      }
    ],
    "calendar_events": [
      {
        "id": "evt_001",
        "date": "2025-11-18",
        "title": "Weekend Sale"
      }
    ]
  }'
```

---

## 5. Sales Insights

### PowerShell

```powershell
$body = @{
    shop_id = "shop_001"
    sales = @(
        @{ product_id = "p001"; date = "2025-11-01"; qty = 10; revenue = 50.0 },
        @{ product_id = "p001"; date = "2025-11-02"; qty = 12; revenue = 60.0 },
        @{ product_id = "p002"; date = "2025-11-01"; qty = 8; revenue = 40.0 },
        @{ product_id = "p002"; date = "2025-11-02"; qty = 9; revenue = 45.0 },
        @{ product_id = "p001"; date = "2025-11-03"; qty = 15; revenue = 75.0 },
        @{ product_id = "p002"; date = "2025-11-03"; qty = 7; revenue = 35.0 }
    )
    range = @{
        start = "2025-11-01"
        end = "2025-11-15"
    }
    granularity = "daily"
    top_k = 10
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/smart-shelf/insights" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"

$response | ConvertTo-Json -Depth 10
```

### curl

```bash
curl -X POST "http://localhost:8000/api/v1/smart-shelf/insights" \
  -H "Content-Type: application/json" \
  -d '{
    "shop_id": "shop_001",
    "sales": [
      {"product_id": "p001", "date": "2025-11-01", "qty": 10, "revenue": 50.0}
    ],
    "range": {
      "start": "2025-11-01",
      "end": "2025-11-15"
    },
    "granularity": "daily",
    "top_k": 10
  }'
```

---

## 6. Batch Forecasting

### PowerShell

```powershell
$body = @{
    shop_id = "shop_001"
    product_list = @("p001", "p002", "p003")
    sales = @(
        @{ product_id = "p001"; date = "2025-11-01"; qty = 10 },
        @{ product_id = "p001"; date = "2025-11-02"; qty = 12 },
        @{ product_id = "p002"; date = "2025-11-01"; qty = 8 },
        @{ product_id = "p002"; date = "2025-11-02"; qty = 9 },
        @{ product_id = "p003"; date = "2025-11-01"; qty = 15 },
        @{ product_id = "p003"; date = "2025-11-02"; qty = 14 }
    )
    periods = 7
    model = "auto"
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/smart-shelf/forecast" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"

$response | ConvertTo-Json -Depth 10
```

---

## Testing with Postman

1. **Import into Postman**:

   - Create new collection "SmartShelf ML"
   - Add requests from above examples
   - Set base URL: `http://localhost:8000`

2. **Environment Variables**:

   ```json
   {
     "base_url": "http://localhost:8000",
     "shop_id": "shop_001"
   }
   ```

3. **Collection Tests** (add to each request):

   ```javascript
   pm.test("Status code is 200", function () {
     pm.response.to.have.status(200);
   });

   pm.test("Response has required fields", function () {
     var jsonData = pm.response.json();
     pm.expect(jsonData).to.have.property("meta");
   });
   ```

---

## Python Client Example

```python
import requests

BASE_URL = "http://localhost:8000/api/v1"

# At-risk detection
response = requests.post(
    f"{BASE_URL}/smart-shelf/at-risk",
    json={
        "shop_id": "shop_001",
        "inventory": [
            {
                "product_id": "p001",
                "sku": "SKU001",
                "name": "Fresh Milk",
                "quantity": 5,
                "expiry_date": "2025-11-20T00:00:00Z",
                "price": 3.99
            }
        ],
        "sales": [],
        "thresholds": {
            "low_stock": 10,
            "expiry_days": 7
        }
    }
)

print(response.json())
```

---

## TypeScript/Node.js Client Example

```typescript
import axios from "axios";

const BASE_URL = "http://localhost:8000/api/v1";

async function getAtRiskProducts(shopId: string, inventory: any[]) {
  const response = await axios.post(`${BASE_URL}/smart-shelf/at-risk`, {
    shop_id: shopId,
    inventory: inventory,
    sales: [],
    thresholds: {
      low_stock: 10,
      expiry_days: 7,
      slow_moving_window: 30,
      slow_moving_threshold: 0.5,
    },
  });

  return response.data;
}

// Usage
const result = await getAtRiskProducts("shop_001", [
  {
    product_id: "p001",
    sku: "SKU001",
    name: "Fresh Milk",
    quantity: 5,
    expiry_date: "2025-11-20T00:00:00Z",
    price: 3.99,
  },
]);

console.log(result);
```

---

## Load Testing with Apache Bench

```bash
# Test health endpoint
ab -n 1000 -c 10 http://localhost:8000/health

# Test at-risk endpoint (requires POST data)
ab -n 100 -c 5 -p request.json -T application/json \
   http://localhost:8000/api/v1/smart-shelf/at-risk
```

---

## Troubleshooting

### 422 Validation Error

Check request body matches schema exactly. Common issues:

- Missing required fields
- Wrong data types (string vs number)
- Invalid date format (use ISO 8601: `2025-11-20T00:00:00Z`)

### 500 Internal Server Error

Check server logs:

```powershell
docker-compose logs -f api
```

### Connection Refused

Ensure service is running:

```powershell
curl http://localhost:8000/health
```
