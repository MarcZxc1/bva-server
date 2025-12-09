# TikTok Shop Seller Clone - Complete Project Overview

## 🎯 Project Summary

A full-featured TikTok Shop Seller Center clone built with React, TypeScript, and Vite. This application provides a comprehensive seller dashboard for managing products, orders, shipping, finances, and business operations. The UI is designed to match the authentic TikTok Shop seller interface with all major features implemented.

**Tech Stack:**
- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Custom CSS (no framework)
- **Backend:** Express.js (Node.js)
- **State Management:** React useState hooks
- **File Upload:** FileReader API with base64 encoding

---

## 📁 Project Structure

```
tiktokshop-clone/
├── src/
│   ├── App.tsx          # Main application (2,527 lines)
│   ├── App.css          # Complete styling (4,768 lines)
│   ├── main.tsx         # React entry point
│   └── vite-env.d.ts    # TypeScript definitions
├── server/
│   └── index.js         # Express API server
├── public/              # Static assets
├── dist/                # Production build output
├── .github/
│   └── copilot-instructions.md  # Development checklist
├── Backend.md           # API specification document
├── PROJECT_OVERVIEW.md  # This file
├── package.json         # Dependencies
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript config
└── index.html           # HTML entry point
```

---

## 🚀 Application Flow

### 1. **Entry Point** (`index.html` → `main.tsx` → `App.tsx`)

The application starts with a single-page React app that renders the main `App` component.

---

## 📱 Core Application Views

### **View States:**
The application has 3 main views controlled by state:
1. **Signup** - New seller registration
2. **Login** - Existing seller authentication  
3. **Dashboard** - Main seller center (post-authentication)

---

## 🔐 Authentication Flow

### **Signup View**
Located in `App.tsx` lines 2433-2520

**Features:**
- **Phone or Email Registration:** Toggle between phone/email signup modes
- **Phone Input:**
  - Country code selector (+63 Philippines)
  - Phone number input field
- **Email Input:**
  - Email address field
- **API Integration:** 
  - Calls `POST /api/signup`
  - Sends mode (phone/email) and credentials
  - Receives submission ID on success
- **State Management:**
  ```tsx
  const [signupMode, setSignupMode] = useState<SignupMode>('phone')
  const [phoneCode, setPhoneCode] = useState('+63')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupStatus, setSignupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  ```
- **UI Elements:**
  - TikTok Shop branding
  - Feature list (LIVE streams, no minimum followers)
  - Toggle link to switch to Login view
  - Form submission with loading states

### **Login View**  
Located in `App.tsx` lines 2310-2432

**Features:**
- **Phone or Email Login:** Toggle between modes
- **Demo Credentials Hint:**
  - Email: demo@tiktokshop.com
  - Password: Demo123!
- **Form Fields:**
  - Phone: Country code + number
  - Email: Email + password
- **API Integration:**
  - Calls `POST /api/login`
  - Returns JWT token and profile on success
  - Auto-navigates to Dashboard on successful login
- **State Management:**
  ```tsx
  const [loginMode, setLoginMode] = useState<LoginMode>('phone')
  const [loginEmail, setLoginEmail] = useState(sampleCredentials.email)
  const [password, setPassword] = useState(sampleCredentials.password)
  const [loginStatus, setLoginStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [profile, setProfile] = useState<DashboardProfile | null>(null)
  ```

**Authentication Success:**
- Stores user profile:
  ```tsx
  profile: {
    name: "Demo Seller",
    email: "demo@tiktokshop.com",
    region: "Philippines"
  }
  ```
- Changes view to 'dashboard'
- Passes profile to Dashboard component

---

## 🏠 Dashboard Component

Located in `App.tsx` lines 1766-2197

The main seller center interface with sidebar navigation and dynamic content area.

### **Dashboard State:**
```tsx
const [activeSection, setActiveSection] = useState('homepage')
const [productsExpanded, setProductsExpanded] = useState(false)
const [ordersExpanded, setOrdersExpanded] = useState(false)
const [shippingExpanded, setShippingExpanded] = useState(false)
const [financeExpanded, setFinanceExpanded] = useState(false)
const [activeProductsTab, setActiveProductsTab] = useState('manage-products')
const [activeOrdersTab, setActiveOrdersTab] = useState('manage-orders')
const [activeShippingTab, setActiveShippingTab] = useState('shipping-options')
const [activeFinanceTab, setActiveFinanceTab] = useState('withdrawals')
const [activeAccountTab, setActiveAccountTab] = useState('seller-profile')
```

---

## 🧭 Sidebar Navigation

### **Main Navigation Items:**
Located in `App.tsx` lines 1782-1791

1. **🏠 Homepage** - Dashboard overview
2. **📦 Products** - Product management (expandable)
3. **📋 Orders** - Order management (expandable)
4. **🚚 Shipping** - Shipping options (expandable)
5. **📢 Promotions** - Marketing tools (expandable)
6. **🏪 Store Design** - Shop customization
7. **💰 Finance** - Financial management (expandable)
8. **📊 Data Compass** - Analytics (expandable)
9. **🚀 Growth Center** - Growth tools (expandable)
10. **❓ Help Center** - Support resources
11. **👤 My Account** - Account settings (expandable)

### **Submenu Items:**

**Products Submenu** (lines 1793-1799):
- Manage products
- Sales accelerator
- Product ratings
- Price bidding
- Product opportunities
- Price diagnosis

**Orders Submenu** (lines 1801-1805):
- Manage Orders
- Manage Cancellations
- Manage Returns

**Shipping Submenu** (lines 1807-1811):
- Batch shipping
- Shipping Options
- Shipping Template

**Finance Submenu** (lines 1813-1817):
- Withdrawals
- Transactions
- Invoice Center

**Account Submenu** (lines 1819-1823):
- Seller Profile
- Billing Management

---

## 📄 Main Content Pages

### 1. **Homepage** (Default Dashboard View)
Located in `App.tsx` lines 1986-2195

**Sections:**

#### **Hero Banner**
- Welcome message
- Call-to-action text
- Illustration placeholder (📦 🎨 👕)

#### **Action Needed Section**
Displays urgent tasks requiring seller attention:
- **Pending Orders:** 122
- **Pending Return:** 354
- **Out of Stock SKUs:** 6,789
- **Quality Check Failed Products:** 8,732

Each item is clickable (link: true) to navigate to details.

#### **Complete Missions Section**
Gamified tasks to encourage seller activity:

**Mission Cards:**
1. **More products, more customers**
   - Icon: 📦
   - Criterion: Upload 50 products and pass QC
   - Reward: Free Shipping Reward
   - Button: "Add Product" 
   - **Click Action:** Navigates to Products → Manage Products tab
   
2. **Post a video**
   - Icon: ▶️
   - Criterion: Publish 15+ second e-commerce video
   - Reward: Free Shipping Reward
   - Button: "Post Video"

3. **Go live for the first time**
   - Icon: ▶️
   - Criterion: Livestream 1+ hour with 10+ products
   - Reward: Free Shipping Reward
   - Button: "Go Live"

#### **Data Compass Section**
Business analytics dashboard:

- **Today's Revenue:** Rp999,999,999
- **Self-Promotion:** Rp999,999,999
- **Affiliate:** Rp999,999,999
- **Revenue Breakdown:**
  - Live: 55.3%
  - Video: 25.3%
  - Cart: 25.3%
- **Donut Chart Visualization** (SVG circles)

#### **LIVE Ranking Top Section**
Leaderboard of live stream performances:

```tsx
[
  { rank: 1, name: 'Live room name...', revenue: 'Rp99.9K', pv: '239,506', status: 'Live Stream' },
  { rank: 2, name: 'Live room name...', revenue: 'Rp99.9K', pv: '239,506', status: 'Live Stream' },
  { rank: 3, name: 'Live room name...', revenue: 'Rp99.9K', pv: '239,506', status: 'Live Stream' }
]
```

#### **Sidebar Widgets:**

**Announcements:**
- Seller Promotion Product Discount Update (14/07/2022)
- "Invite Only" categories visibility (22/06/2022)

**Quick Links:**
- Creative center
- Shop performance
- Invite-only products
- Promotional materials

---

### 2. **Manage Products Page**
Located in `App.tsx` lines 1424-1764

**Component:** `ManageProducts()`

**State Management:**
```tsx
const [activeTab, setActiveTab] = useState('All')
const [searchQuery, setSearchQuery] = useState('')
const [showAddProduct, setShowAddProduct] = useState(false)
const [selectedProducts, setSelectedProducts] = useState<number[]>([])
const [priceFilter, setPriceFilter] = useState('all')
const [categoryFilter, setCategoryFilter] = useState('all')
const [products, setProducts] = useState([...])
```

**Sample Products Data:**
```tsx
{
  id: 1,
  name: 'LGNE_NO_MOCK]qne-qa-tools-qne-qa-...',
  sku: 'Variants',
  productId: 'ID:1732185887765792379',
  quantity: 297,
  price: '฿30.00',
  sales: 1,
  updated: '09/03/2025 11:29 AM',
  status: 'Live',
  hasVariants: true,
  skus: 3
}
```

**Features:**

#### **Header Actions:**
- **Product Bundles** button
- **Bulk action** dropdown
- **Add new product** button → Opens Add Product form

#### **Action Cards Section:**
Promotional cards with progress tracking:
- Upload new products (49/100 progress)
- Advertise your shop (GMV Max)
- Reprice to gain benefits
- Restock SKUs to avoid missing sales

#### **Product Status Tabs:**
Dynamic tabs with real-time counts:
- **All:** Shows all products (count updated dynamically)
- **Live:** Active products on sale
- **Deactivated:** Temporarily disabled products
- **Reviewing:** Products under quality review
- **Suspended:** Flagged products
- **Draft:** Unpublished products
- **Deleted:** Removed products

**Tab Functionality:**
```tsx
const getTabCount = (status: string) => {
  if (status === 'All') return products.length
  return products.filter(p => p.status === status).length
}
```

#### **Search & Filters:**
- **Search Box:** Filter by product name, ID, or seller SKU
- **Price Filter:** Sort by price (Low to High, High to Low)
- **Category Filter:** Filter by product category
- **Filter Button:** Advanced filters
- **Reset Button:** Clear all filters

**Search Implementation:**
```tsx
const filteredProducts = products.filter(product => {
  if (activeTab !== 'All' && product.status !== activeTab) return false
  if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !product.productId?.toLowerCase().includes(searchQuery.toLowerCase())) {
    return false
  }
  return true
})
```

#### **Bulk Actions Bar:**
- **Selected Count:** Shows number of selected products
- **Activate Button:** Set status to 'Live'
- **Deactivate Button:** Set status to 'Deactivated'
- **Delete Button:** Remove products with confirmation
- **Set Discount Button:** Apply bulk discounts (disabled)
- **Set Alert Button:** Configure alerts (disabled)

**Bulk Action Handlers:**
```tsx
const handleActivateProducts = () => {
  setProducts(products.map(p => 
    selectedProducts.includes(p.id) ? { ...p, status: 'Live' } : p
  ))
  setSelectedProducts([])
}
```

#### **Products Table:**
Columns:
1. **Checkbox:** Select products for bulk actions
2. **Product:** Image, name, and product ID
3. **SKU:** Product SKU or variant indicator
4. **Quantity:** Stock quantity
5. **Price:** Product price (฿)
6. **Sales:** Total sales count
7. **Updated:** Last update timestamp
8. **Status:** Badge with status (Live/Suspended/etc.)
9. **Actions:** Edit, Duplicate, Create ad, More dropdown

**Table Features:**
- **Select All Checkbox:** Toggle all visible products
- **Individual Selection:** Click checkboxes to select
- **Eye Icon:** Preview product (not implemented)
- **Edit Button:** Navigate to edit form (not implemented)
- **Duplicate Button:** Clone product with "(Copy)" suffix
- **Expand Variants:** Show SKU variants for multi-variant products

**Duplicate Handler:**
```tsx
const handleDuplicateProduct = (product: any) => {
  const duplicated = {
    ...product,
    id: Date.now(),
    name: product.name + ' (Copy)',
    productId: `ID:${Date.now()}`,
    updated: new Date().toLocaleString('en-GB', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true 
    })
  }
  setProducts([duplicated, ...products])
}
```

#### **Chat Button:**
Floating chat button (💬) in bottom-right corner

---

### 3. **Add New Product Page**
Located in `App.tsx` lines 907-1423

**Component:** `AddNewProduct({ onBack, onSubmit })`

**Props:**
- `onBack: () => void` - Navigate back to Manage Products
- `onSubmit: (product: any) => void` - Handle product creation

**State Management:**
```tsx
const [productName, setProductName] = useState('')
const [selectedCategory, setSelectedCategory] = useState('')
const [uploadedImages, setUploadedImages] = useState<string[]>([])
const [activeFormSection, setActiveFormSection] = useState('basic')
const [activePreviewTab, setActivePreviewTab] = useState('details')
const [description, setDescription] = useState('')
const [price, setPrice] = useState('')
const [stock, setStock] = useState('')
const [sku, setSku] = useState('')
const [weight, setWeight] = useState('')
const [packageLength, setPackageLength] = useState('')
const [packageWidth, setPackageWidth] = useState('')
const [packageHeight, setPackageHeight] = useState('')
```

**Layout:**
Three-column layout:
1. Left sidebar (navigation + preview)
2. Main content (form fields)
3. Fixed header (actions)

#### **Header Section:**

**Buttons:**
1. **← Add new product** - Back button (calls `onBack()`)
2. **ⓘ Help** - Help icon
3. **Save as a draft** - Save with 'Draft' status
4. **✓ Submit for review** - Submit with 'Reviewing' status

**Probation Notice Banner:**
- Information icon
- "You're currently in the Shop Probation Period..."
- "View Details" link
- Close button (×)

#### **Left Sidebar:**

**Suggestions Section:**
- 💡 icon
- "Complete product information can help increase your product exposure."

**Form Navigation:**
Four navigation buttons with smooth scroll:
1. **Basic information** → Scrolls to #basic
2. **Product details** → Scrolls to #details
3. **Sales information** → Scrolls to #sales
4. **Shipping** → Scrolls to #shipping

**Scroll Implementation:**
```tsx
const scrollToSection = (sectionId: string) => {
  setActiveFormSection(sectionId)
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
```

**Preview Section:**
Four preview tabs showing different views:

1. **Product details:** 
   - Main image
   - Product name
   - Price (฿)

2. **🛍 Shop view:**
   - Card-style layout
   - Product image + info
   - Shop display format

3. **🖊 Edit view:**
   - Summary of all form data
   - Name, Price, Stock, Category

4. **🖼 Gallery:**
   - Grid of all uploaded images (2 columns)
   - Empty state if no images

**Preview Updates:**
Real-time preview as user types:
```tsx
{activePreviewTab === 'details' && (
  <div className="preview-content">
    {uploadedImages[0] && <img src={uploadedImages[0]} />}
    {productName && <div className="preview-name">{productName}</div>}
    {price && <div className="preview-price">฿{price}</div>}
  </div>
)}
```

#### **Main Form Content:**

### **Section 1: Basic Information** (id="basic")

**Image Upload:**
- **AI Optimize Button:** ✨ AI optimize (not implemented)
- **Upload Grid:** 9 image slots
  - 1 main image (2×2 grid span)
  - 8 thumbnail images
- **File Input Validation:**
  - Formats: JPG, JPEG, PNG only
  - Max size: 10 MB
  - Dimensions: 600×600px recommended

**Image Upload Implementation:**
```tsx
const handleImageUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0]
  if (file) {
    if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
      alert('Please upload only JPG, JPEG, or PNG images')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must not exceed 10 MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const newImages = [...uploadedImages]
      newImages[index] = e.target?.result as string
      setUploadedImages(newImages)
    }
    reader.readAsDataURL(file)
  }
}
```

**File Input Refs:**
```tsx
const fileInputRefs = Array(9).fill(null).map(() => 
  ({ current: null as HTMLInputElement | null })
)
```

**Upload Boxes:**
- Click to open file picker
- Hidden file input elements
- Preview shows uploaded image with object-fit: cover
- Base64 data URL storage

**Product Name:**
- Text input
- Character counter: 0/255
- Required field indicator (*)

**Category Selection:**
- "Recently used categories" badge (🔄)
- List of 3 recent categories (clickable):
  1. Home Supplies > Home Organizers > Storage Bottles & Jars
  2. Home Supplies > Home Organizers > Storage Bags
  3. Sports & Outdoor > Sports Accessories > Water Bottles
- "Select category ▼" button (opens category tree - not implemented)

### **Section 2: Product Details** (id="details")

**Description:**
- Textarea input
- Character limit: 5000
- Resizable vertically
- Character counter: 0/5000

**Product Highlights:**
- 3 text input fields (Highlight 1, 2, 3)
- "+ Add highlight" button (not implemented)

### **Section 3: Sales Information** (id="sales")

**Layout:** Two-column grid for Price and Stock

**Price:**
- Number input
- Currency symbol: ฿ (Thai Baht)
- Placeholder: 0.00
- Min: 0, Step: 0.01
- Required field (*)

**Stock:**
- Number input
- Placeholder: 0
- Min: 0
- Required field (*)

**SKU (Stock Keeping Unit):**
- Text input
- Optional field
- Placeholder: "Enter SKU"

**Enable Variants:**
- Checkbox input
- Label: "Enable variants (size, color, etc.)"
- Not implemented (checkbox only)

### **Section 4: Shipping** (id="shipping")

**Package Weight:**
- Number input (kg)
- Min: 0, Step: 0.1
- Required field (*)
- Info icon (ⓘ)

**Package Dimensions:**
- Three inputs in row: Length × Width × Height (cm)
- Number inputs with min: 0
- Visual separators: × symbol
- Info icon (ⓘ)

**Shipping Template:**
- Select dropdown
- Options:
  - Standard Shipping
  - Express Shipping
  - Free Shipping

**Dangerous Goods:**
- Checkbox input
- Label: "Dangerous goods"
- Hint: "Check if this product contains hazardous materials"

#### **Form Submission Handlers:**

**Save as Draft:**
```tsx
const handleSaveDraft = () => {
  if (!productName.trim()) {
    alert('Please enter a product name')
    return
  }
  const product = {
    id: Date.now(),
    name: productName,
    sku: '--',
    productId: `ID:${Date.now()}`,
    quantity: 0,
    price: '฿0.00',
    sales: 0,
    updated: new Date().toLocaleString('en-GB', {...}),
    status: 'Draft',
    category: selectedCategory,
    images: uploadedImages.filter(img => img)
  }
  onSubmit(product)
  onBack()
}
```

**Submit for Review:**
```tsx
const handleSubmitReview = () => {
  // Validation
  if (!productName.trim()) {
    alert('Please enter a product name')
    return
  }
  if (!selectedCategory) {
    alert('Please select a category')
    return
  }
  if (uploadedImages.filter(img => img).length === 0) {
    alert('Please upload at least one image')
    return
  }
  
  const product = {
    id: Date.now(),
    name: productName,
    sku: 'Variants',
    productId: `ID:${Date.now()}`,
    quantity: 100,
    price: '฿99.00',
    sales: 0,
    updated: new Date().toLocaleString('en-GB', {...}),
    status: 'Reviewing',
    category: selectedCategory,
    images: uploadedImages.filter(img => img)
  }
  onSubmit(product)
  onBack()
}
```

**Product Addition Flow:**
1. User fills form
2. Clicks "Submit for review" or "Save as draft"
3. Validation runs
4. Product object created with current timestamp
5. `onSubmit(product)` called → adds to products array
6. `onBack()` called → returns to Manage Products
7. New product appears in table immediately

---

### 4. **Manage Orders Page**
Located in `App.tsx` lines 264-381

**Component:** `ManageOrders()`

**State:**
```tsx
const [activeTab, setActiveTab] = useState('All')
const [orderStatus, setOrderStatus] = useState('Awaiting Shipment')
const [searchQuery, setSearchQuery] = useState('')
const [showBatchShipping, setShowBatchShipping] = useState(false)
```

**Features:**

**Header:**
- Title: "Manage Orders"
- **Export Orders** link
- **Export History** link
- **Bulk Print** button
- **📦 Batch shipping** button → Opens Batch Shipping page

**Tabs:**
- All
- Unpaid
- To Ship
- Shipped
- Completed
- Cancelled

**Filters:**

**Order Status:**
- All
- Awaiting Shipment
- Awaiting Collection

**Urgency Filters:**
- Ship within 24 hours
- Cancelling within 24 hours
- Shipment overdue yet to ship

**Additional Filters:**
- Order Scenario
- Shipping Option
- Logistics Provider
- Store/Platform
- Date Range (From/To date pickers)

**Search Bar:**
- Placeholder: "Search by Order ID, Product, Buyer or Tracking No."
- Tag button (🏷)
- Filter button (🔽)
- Sort dropdown: "Time paid (newest/oldest)"

**Orders Table:**
Columns:
- Order ID
- Order Status
- Payment
- Delivery
- Action

**Empty State:**
- "No orders found" message

**Chat Button:** 💬 (floating)

**Batch Shipping Toggle:**
```tsx
if (showBatchShipping) {
  return <BatchShipping onBack={() => setShowBatchShipping(false)} />
}
```

---

### 5. **Batch Shipping Page**
Located in `App.tsx` lines 81-263

**Component:** `BatchShipping({ onBack })`

**Props:**
- `onBack: () => void` - Return to Manage Orders

**State:**
```tsx
const [activeTab, setActiveTab] = useState('Arrange Shipping')
const [deliveryOption, setDeliveryOption] = useState('Standard shipping')
const [collectionMethod, setCollectionMethod] = useState('Pick-up')
const [packageType, setPackageType] = useState('All')
const [searchQuery, setSearchQuery] = useState('')
```

**Header:**
- **← Back** button
- Title: "Batch shipping"
- Description: "Generate shipping documents or arrange shipping in bulk..."

**Tabs:**
1. **Arrange Shipping** (active by default)
2. **Generate Documents**

**Filters:**

**Delivery Option:**
- Radio buttons:
  - Standard shipping (default)
  - Shipped from seller

**Collection Method:**
- Radio buttons:
  - Pick-up (default)
  - Drop-off

**Package Type:**
- Radio buttons:
  - All (default)
  - Combined package
  - Single order package
  - Split order package

**Search & Actions:**
- Search input: "Search by Order ID"
- **Select all packages** checkbox
- **Confirm Shipment** button
- **Generate Documents** button

**Packages Table:**
Columns:
- Checkbox
- Order ID
- Logistics provider
- Tracking no.
- Buyer
- Shipping address
- Recipient/Contact
- Package ID
- Action

**Empty State:**
- "No packages to ship"

---

### 6. **Finance Section**

#### **6A. Withdrawals Page**
Located in `App.tsx` lines 382-490

**Component:** `Withdrawals()`

**State:**
```tsx
const [activeTab, setActiveTab] = useState('All')
const [showDatePicker, setShowDatePicker] = useState(false)
```

**Features:**

**Header:**
- Title: "Withdrawals"
- **Date filter** button with calendar icon
- **Export** link

**Balance Cards:**
1. **Available Balance**
   - Amount: Rp999,999,999
   - "Last updated: 14 Nov 2024 3:00 PM"
   - **Withdraw** button

2. **Processing Balance**
   - Amount: Rp999,999,999
   - Info icon (ⓘ)
   - "View details" link

**Tabs:**
- All
- Withdrawal in progress
- Withdrawal success
- Withdrawal failed

**Withdrawals Table:**
Columns:
- Withdrawal ID
- Time
- Withdrawal amount
- Transfer to
- Status

**Sample Data:**
```tsx
[
  { id: 'E1234567890', time: '2024-11-13 14:25:41', 
    amount: 'Rp999,999,999', transferTo: 'Bank BCA', status: 'Successful' },
  { id: 'E0987654321', time: '2024-11-10 09:15:22', 
    amount: 'Rp500,000,000', transferTo: 'Bank Mandiri', status: 'Processing' }
]
```

**Empty State:**
- "No withdrawals found"

---

#### **6B. Transactions Page**
Located in `App.tsx` lines 491-610

**Component:** `Transactions()`

**State:**
```tsx
const [activeTab, setActiveTab] = useState('Settled')
```

**Tabs:**
1. **Settled** (default)
2. **To Settle**

**Transactions Table:**
Columns:
- Transaction ID
- Date
- Settlement Date
- Amount
- Revenue
- Status
- Type
- Note

**Sample Data:**
```tsx
[
  { id: '72458745869485725', date: '09/06/2023', settlementDate: '16/06/2023',
    amount: 'Rp300,000', revenue: 'Rp45.000', status: 'Settled', 
    type: 'Sale', note: 'Order #12345' },
  { id: '79460853485369769453', date: '09/06/2023', settlementDate: '/',
    amount: 'Rp200.000', revenue: '/', status: 'Adjustment', 
    note: 'Shipping fee rebate' }
]
```

---

#### **6C. Invoice Center**
Located in `App.tsx` lines 791-801

**Component:** `InvoiceCenter()`

**Simple placeholder:**
- Title: "Invoice Center"
- Description: "Manage your invoices here"

---

### 7. **Shipping Section**

#### **Shipping Options Page**
Located in `App.tsx` lines 802-906

**Component:** `ShippingOptions()`

**State:**
```tsx
const [standardShippingEnabled, setStandardShippingEnabled] = useState(true)
const [shippedFromSellerEnabled, setShippedFromSellerEnabled] = useState(false)
const [invoiceMethod, setInvoiceMethod] = useState('package-id')
```

**Features:**

**Info Banner:**
- ℹ️ icon
- "You can now select the delivery option for your shop and products."
- "Learn more" link
- Close button (×)

**Sections:**

**1. Shipped via Platform:**
- Description: "Fulfil your orders using TikTok Shop's selected provider..."
- **Standard Shipping:**
  - Toggle switch (enabled by default)
  - Info icon with details
  - "Learn more" link

**2. Shipped from Seller:**
- Description: "Fulfil orders yourself or use third-party logistics..."
- Toggle switch (disabled by default)
- "Learn more" link

**3. Invoice Generation Method:**
- Description: "Select generation method for default electronic invoices"
- Radio buttons:
  1. **Generate invoices based on package ID** (default)
     - Info: "Each package ID will have a separate invoice"
  2. **Generate invoices based on delivery ID**
     - Info: "Multiple packages in one delivery will have one invoice"
  3. **Generate invoices based on order ID**
     - Info: "Split packages from the same order will have one invoice"

---

### 8. **Account Section**

#### **Seller Profile Page**
Located in `App.tsx` lines 611-790

**Component:** `SellerProfile()`

**State:**
```tsx
const [activeTab, setActiveTab] = useState('Account information')
const [textMessageEnabled, setTextMessageEnabled] = useState(false)
```

**Features:**

**Info Banners:**
1. Shop Probation Period notice
2. Compliance requirements notice

**Tabs:**
- Account information
- Shop information
- Account security

**Account Information Tab:**

**Sections:**

**1. Identity Verification:**
- Status badge: "Verified" (green checkmark)
- User info display

**2. Login Methods:**
- Email section:
  - demo@tiktokshop.com
  - "Change" link
- Phone number section:
  - "+63 912 345 6789"
  - "Change" link

**3. Permissions:**
- Information: "Only the shop owner can give permissions"

**4. Notification Settings:**
- Text message notification toggle
  ```tsx
  <input
    type="checkbox"
    checked={textMessageEnabled}
    onChange={(e) => setTextMessageEnabled(e.target.checked)}
  />
  ```
- Push notification section (link)
- Email notification section (link)

**5. Shop Information:**
- Shop name: "Demo Shop"
- Region: "Philippines"
- Business type: "Individual"
- Shop logo placeholder
- "Edit" buttons for each field

**6. Deactivation:**
- "Deactivate Shop" link
- Warning icon and text

---

## 🎨 Styling & Design System

### **Color Palette:**
Located throughout `App.css`

**Primary Colors:**
- Purple/Indigo: `#6366f1` (buttons, links, active states)
- Teal/Cyan: `#00b8a9` (primary action buttons)
- Red: `#ef4444` (delete, warnings, required indicators)
- Green: `#10b981` (success states, Live status)
- Orange: `#f59e0b` (warnings, alerts)

**Neutral Colors:**
- White: `#ffffff` (backgrounds, cards)
- Light gray: `#f7f8fa`, `#f9fafb` (page backgrounds)
- Border gray: `#e5e7eb`, `#d1d5db`
- Text dark: `#1a1a1a`, `#1a1d29`
- Text medium: `#666`, `#6b7280`
- Text light: `#999`

### **Typography:**
- Font family: System fonts (inherited)
- Base font size: 14px
- Headings:
  - Page title: 24px, font-weight 700
  - Section heading: 20px, font-weight 600
  - Card title: 16px, font-weight 600

### **Layout Patterns:**

**Dashboard Grid:**
```css
.dashboard {
  display: grid;
  grid-template-columns: 240px 1fr;
  height: 100vh;
}
```

**Sidebar:**
- Width: 240px
- Fixed left position
- Vertical scroll
- White background

**Main Content:**
- Flexible width (1fr)
- Background: #f7f8fa
- Padding: 24px 32px

**Cards:**
```css
.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
```

**Buttons:**
```css
/* Primary button */
.btn-primary {
  background: #00b8a9;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
}

/* Secondary button */
.btn-secondary {
  background: white;
  color: #1a1a1a;
  border: 1px solid #e5e7eb;
  padding: 8px 16px;
  border-radius: 6px;
}
```

**Forms:**
```css
.text-input {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
}

.text-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
```

**Status Badges:**
```css
.status-badge.live { background: #dcfce7; color: #16a34a; }
.status-badge.reviewing { background: #fef3c7; color: #d97706; }
.status-badge.suspended { background: #fee2e2; color: #dc2626; }
.status-badge.draft { background: #f3f4f6; color: #6b7280; }
```

### **Responsive Design:**
- Fixed sidebar layout (not mobile-optimized)
- Designed for desktop/tablet viewports (1024px+)
- No media queries for mobile

### **CSS Organization:**
Total: 4,768 lines organized by component:

1. Global styles (lines 1-100)
2. Auth pages (Signup/Login) (lines 101-500)
3. Dashboard layout (lines 501-700)
4. Sidebar navigation (lines 701-900)
5. Homepage sections (lines 901-1500)
6. Manage Orders (lines 1501-1900)
7. Batch Shipping (lines 1901-2300)
8. Finance pages (lines 2301-2900)
9. Seller Profile (lines 2901-3400)
10. Shipping Options (lines 3401-3600)
11. Manage Products (lines 3601-4200)
12. Add New Product (lines 4201-4768)

---

## 🔌 Backend API Server

### **Server File:** `server/index.js`
Located at lines 1-65

**Framework:** Express.js  
**Port:** 4000 (default) or process.env.PORT

**Middleware:**
```javascript
app.use(cors())           // Enable CORS
app.use(express.json())   // Parse JSON bodies
```

**Demo User Credentials:**
```javascript
const demoUser = {
  email: 'demo@tiktokshop.com',
  password: 'Demo123!',
  name: 'Demo Seller',
  region: 'Philippines',
}
```

### **Endpoints:**

#### **GET `/api/health`**
Health check endpoint
```javascript
Response: { status: 'ok', service: 'tiktokshop-clone-api' }
```

#### **POST `/api/signup`**
User registration
```javascript
Request: {
  mode: 'phone' | 'email',
  phoneCode: '+63',
  phoneNumber: '9123456789',
  email: 'user@example.com'
}

Response: {
  ok: true,
  submissionId: 'random-6-char-string'
}
```

**Validation:**
- Phone mode: Requires phoneCode and phoneNumber
- Email mode: Requires email
- Returns 400 if validation fails

#### **POST `/api/login`**
User authentication
```javascript
Request: {
  email: 'demo@tiktokshop.com',
  password: 'Demo123!'
}

Response (success): {
  ok: true,
  token: 'demo-token-123',
  profile: {
    name: 'Demo Seller',
    email: 'demo@tiktokshop.com',
    region: 'Philippines'
  }
}

Response (failure): {
  ok: false,
  message: 'Invalid credentials'
}
```

**Authentication Logic:**
- Compares email and password with demoUser
- Returns 401 if credentials don't match
- No actual JWT token generation (returns static string)

**Server Start:**
```javascript
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`)
})
```

---

## 📦 Dependencies

### **Frontend Dependencies** (package.json):
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@eslint/js": "^9.17.0",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "eslint": "^9.17.0",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react-refresh": "^0.4.16",
    "globals": "^15.14.0",
    "typescript": "~5.6.2",
    "typescript-eslint": "^8.18.2",
    "vite": "^6.0.5"
  }
}
```

### **Backend Dependencies:**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
```

### **NPM Scripts:**
```json
{
  "scripts": {
    "dev": "vite",              // Development server
    "build": "tsc -b && vite build",  // Production build
    "lint": "eslint .",         // Linting
    "preview": "vite preview"   // Preview production build
  }
}
```

---

## 🔄 Data Flow

### **Product Creation Flow:**

1. **User navigates to Add Product**
   - Dashboard → Products → Manage products
   - Click "Add new product" button
   - `setShowAddProduct(true)`

2. **User fills form**
   - Upload images (FileReader → base64)
   - Enter product details
   - Real-time preview updates

3. **User submits**
   - Click "Submit for review" or "Save as draft"
   - Form validation runs
   - Product object created

4. **Product added to state**
   - `handleAddProduct(newProduct)` called
   - `setProducts([newProduct, ...products])`
   - Products array updated

5. **Navigation back**
   - `onBack()` called
   - `setShowAddProduct(false)`
   - Return to Manage Products view

6. **Product appears in table**
   - Filtered products recalculated
   - Table re-renders
   - New product visible with status badge

### **Product Filtering Flow:**

1. **User interaction**
   - Click tab (All/Live/Draft/etc.)
   - Type in search box
   - Select filter dropdown

2. **State updates**
   - `setActiveTab(status)`
   - `setSearchQuery(value)`
   - `setPriceFilter(value)`

3. **Filter calculation**
   ```tsx
   const filteredProducts = products.filter(product => {
     if (activeTab !== 'All' && product.status !== activeTab) return false
     if (searchQuery && !product.name.includes(searchQuery)) return false
     return true
   })
   ```

4. **UI updates**
   - Table re-renders with filtered results
   - Tab counts recalculate
   - Empty state shows if no results

### **Bulk Actions Flow:**

1. **User selects products**
   - Click individual checkboxes
   - Or click "Select all"
   - `setSelectedProducts([...ids])`

2. **User clicks action**
   - Activate / Deactivate / Delete

3. **Confirmation (for Delete)**
   - `confirm()` dialog shown
   - User confirms or cancels

4. **State update**
   ```tsx
   // Activate
   setProducts(products.map(p => 
     selectedProducts.includes(p.id) ? { ...p, status: 'Live' } : p
   ))
   
   // Delete
   setProducts(products.filter(p => !selectedProducts.includes(p.id)))
   ```

5. **Selection cleared**
   - `setSelectedProducts([])`

6. **UI updates**
   - Products reflect new status
   - Tab counts update
   - Selection checkboxes reset

---

## 🧪 Current Implementation Status

### **✅ Fully Implemented:**
- User authentication (Login/Signup UI + API)
- Dashboard navigation structure
- Homepage with all sections
- Manage Products with full CRUD (frontend only)
- Add Product form (all sections + validation)
- Real image upload (FileReader with base64)
- Product filtering and search (frontend)
- Bulk product actions (frontend)
- Product duplication
- Manage Orders UI
- Batch Shipping UI
- Finance pages (Withdrawals, Transactions, Invoice)
- Shipping Options configuration
- Seller Profile management
- Complete responsive styling

### **⚠️ Partially Implemented:**
- Image upload (base64 only, no CDN)
- Product search (client-side only)
- Product filters (no backend)
- Category selection (hardcoded)

### **❌ Not Implemented:**
- Backend product CRUD endpoints
- Database persistence
- Product edit functionality
- Product preview modal
- AI image optimization
- Product variants system
- Advanced filtering UI
- Export functionality
- Category management API
- Analytics/stats API
- Order management backend
- Shipping provider integration
- Payment processing
- Real-time notifications

---

## 🚀 How to Run

### **Development:**
```bash
# Install dependencies
npm install

# Run frontend dev server (port 5173)
npm run dev

# Run backend API server (port 4000)
cd server
node index.js
```

### **Production Build:**
```bash
# Build for production
npm run build

# Output: dist/ folder
# - dist/index.html
# - dist/assets/index-[hash].css
# - dist/assets/index-[hash].js
```

### **Preview Production Build:**
```bash
npm run preview
```

---

## 🎯 Key Features Summary

### **Product Management:**
- ✅ Create products with comprehensive form
- ✅ Upload up to 9 images per product
- ✅ Real-time preview (4 different views)
- ✅ Save as draft or submit for review
- ✅ Filter by status (All, Live, Draft, etc.)
- ✅ Search by name, ID, SKU
- ✅ Bulk activate/deactivate/delete
- ✅ Duplicate products
- ✅ Form validation
- ✅ Character counters
- ✅ Category selection

### **Order Management:**
- ✅ Multiple order status tabs
- ✅ Order filtering (status, urgency, date)
- ✅ Batch shipping interface
- ✅ Package type selection
- ✅ Search orders
- ✅ Export functionality UI

### **Finance Management:**
- ✅ Withdrawal management
- ✅ Transaction history
- ✅ Balance display
- ✅ Invoice center

### **Shipping:**
- ✅ Shipping options configuration
- ✅ Multiple shipping methods
- ✅ Invoice generation methods

### **Account:**
- ✅ Seller profile display
- ✅ Login methods management
- ✅ Notification settings
- ✅ Shop information

### **Analytics:**
- ✅ Data Compass dashboard
- ✅ Revenue breakdown
- ✅ LIVE ranking
- ✅ Action needed alerts
- ✅ Mission progress tracking

---

## 🔮 Future Enhancements

### **High Priority:**
1. Backend API implementation (see Backend.md)
2. Database integration (PostgreSQL/MongoDB)
3. Image upload to CDN (AWS S3/Cloudinary)
4. Product edit functionality
5. Real authentication (JWT tokens)
6. Product persistence across sessions

### **Medium Priority:**
7. Product variants system
8. Advanced search and filtering
9. Analytics and reporting
10. Category management system
11. Export to CSV/Excel
12. Product preview modal
13. Order processing backend

### **Low Priority:**
14. AI image optimization
15. Mobile responsive design
16. Dark mode
17. Multi-language support
18. Real-time notifications (WebSocket)
19. Live chat integration
20. TikTok video/livestream integration

---

## 📝 Code Quality

### **TypeScript Usage:**
- Type definitions for props
- Interface definitions for data models
- Type safety for state management
- Proper typing for event handlers

**Example:**
```tsx
type DashboardProfile = {
  name: string
  email: string
  region: string
}

function Dashboard({ profile }: { profile: DashboardProfile }) {
  // Component implementation
}
```

### **React Best Practices:**
- Functional components with hooks
- Proper state management
- Component composition
- Props drilling (could be improved with Context API)
- Event handler patterns

### **Code Organization:**
- Single App.tsx file (2,527 lines - could be split)
- Component functions clearly defined
- Consistent naming conventions
- Clear separation of concerns

### **Potential Improvements:**
1. **Split into multiple files:**
   - components/
   - pages/
   - hooks/
   - utils/
   - types/

2. **State management:**
   - Context API for global state
   - Custom hooks for logic extraction
   - React Query for API calls

3. **Testing:**
   - Unit tests (Jest + React Testing Library)
   - Integration tests
   - E2E tests (Playwright/Cypress)

4. **Performance:**
   - Code splitting
   - Lazy loading
   - Memoization (useMemo, useCallback)
   - Virtual scrolling for large lists

---

## 🎓 Learning Outcomes

This project demonstrates:
- ✅ Full-stack application architecture
- ✅ React + TypeScript development
- ✅ Complex state management
- ✅ Form handling and validation
- ✅ File upload with FileReader API
- ✅ RESTful API design
- ✅ Component composition
- ✅ Event handling patterns
- ✅ CSS styling (no frameworks)
- ✅ Responsive layouts (grid, flexbox)
- ✅ Mock data management
- ✅ UI/UX design principles

---

## 📄 License & Credits

**Project:** TikTok Shop Seller Clone  
**Purpose:** Educational/Portfolio demonstration  
**UI Reference:** TikTok Shop Seller Center  
**Built by:** [Your Name]  
**Date:** December 9, 2025

---

*This is a clone project for learning purposes. TikTok Shop and all related trademarks belong to their respective owners.*
