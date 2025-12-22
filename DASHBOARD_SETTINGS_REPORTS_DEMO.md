# BVA Demo Script: Dashboard, Settings, and Reports

## Table of Contents
1. [Introduction to BVA Features](#introduction-to-bva-features)
2. [Dashboard Demo](#dashboard-demo)
3. [Settings Demo](#settings-demo)
4. [Reports Demo](#reports-demo)
5. [Complete Workflow Demo](#complete-workflow-demo)

---

## Introduction to BVA Features

### What is Business Virtual Assistant (BVA)?

BVA is an AI-powered business management platform designed specifically for Filipino SMBs selling on multiple e-commerce platforms like Shopee and Lazada. It provides real-time business insights, platform integration management, and comprehensive analytics to help sellers make data-driven decisions.

### Solving the "Lack of Visibility on Purchasing Patterns" Problem

**The Problem:**
Traditional small businesses struggle with limited visibility into customer purchasing patterns. Without proper analytics, sellers can't answer critical questions:
- Which products do customers buy most frequently?
- When do customers make purchases (time of day, day of week, paydays)?
- What seasonal or holiday patterns exist?
- Which platform do customers prefer for different product categories?
- How do purchasing patterns change over time?
- What drives customer buying decisions?

**BVA's Solution:**
BVA provides comprehensive purchasing pattern visibility through Dashboard, Settings, and Reports:

1. **Dashboard - Real-Time Pattern Visualization**:
   - Sales forecast chart showing predicted purchasing patterns
   - Real-time metrics revealing current trends
   - Platform filtering showing where customers buy
   - Stock alerts indicating what customers are buying now

2. **Reports - Comprehensive Pattern Analysis**:
   - Sales trends over time (daily, weekly, monthly) showing when customers buy
   - Platform comparison revealing where customers prefer to shop
   - Profit analysis showing which products customers value most
   - Stock turnover showing purchase frequency patterns

3. **Settings - Data Foundation**:
   - Platform integration bringing in all sales data
   - Data synchronization ensuring accurate pattern analysis
   - Multi-platform support enabling cross-platform pattern comparison

**How It Works:**
All three features work together to reveal purchasing patterns:
- **What customers buy**: Product performance rankings, best sellers, trending items
- **When customers buy**: Time-based trends, payday cycles, holiday patterns
- **Where customers buy**: Platform preferences, Shopee vs Lazada performance
- **How much customers buy**: Sales velocity, quantity patterns, frequency analysis
- **Why patterns exist**: Context-aware insights (paydays, holidays, seasons)

### The Three Core Features

#### 1. Dashboard - Real-Time Business Overview
**What it is:**
The Dashboard is the central hub of BVA, providing real-time business metrics, sales trends, and actionable insights at a glance. It serves as the first point of contact for users after logging in, giving them an immediate understanding of their business performance.

**How it works:**
- **Business Metrics Cards**: Displays key performance indicators:
  - **Total Revenue**: Lifetime revenue with trend indicators
  - **Total Orders**: Number of completed transactions
  - **Active Products**: Total products in inventory
  - **Stock Alerts**: Number of items needing attention
- **Sales Forecast Chart**: 
  - 14-day AI-powered demand forecast
  - Visual trend representation using line charts
  - Confidence intervals for risk management
  - Aggregated predictions from all products
- **Stock Alerts Section**:
  - Top 5 at-risk products from SmartShelf
  - Risk scores and status indicators (Critical, High, Medium, Low)
  - Quick action buttons to navigate to SmartShelf
- **Platform Filtering**:
  - View metrics for all platforms combined
  - Filter by Shopee only
  - Filter by Lazada only
  - Real-time aggregation across platforms

#### 2. Settings - Platform Integration Management
**What it is:**
Settings is the control center for managing API integrations with e-commerce platforms. It handles authentication, data synchronization, and platform connection management, allowing sellers to connect their Shopee, Lazada, and TikTok Shop accounts.

**How it works:**
- **Platform Integration**:
  - Connect Shopee-Clone accounts via OAuth
  - Connect Lazada-Clone accounts via JWT authentication
  - Connect TikTok Shop accounts (planned)
  - Display connection status for each platform
- **Data Synchronization**:
  - Manual sync button to refresh data
  - Automatic sync on initial connection
  - Sync status indicators (Last synced, Products synced, Sales synced)
  - Error handling and retry mechanisms
- **Terms & Conditions**:
  - Terms acceptance required before integration
  - Data privacy information
  - Platform-specific terms and conditions
  - Clear consent for data usage
- **Shop Management**:
  - Link existing shops from e-commerce platforms
  - Create new shops manually
  - Platform-specific shop configuration
  - View connected shops and their status

#### 3. Reports - Comprehensive Business Analytics
**What it is:**
Reports provides comprehensive business analytics and exportable reports. It helps sellers make quick decisions without manually compiling data from multiple platforms, offering detailed insights into sales, profit, inventory, and platform performance.

**How it works:**
- **Sales Reports**:
  - Sales over time (daily, weekly, monthly views)
  - Revenue trends and patterns
  - Order count analysis
  - Platform-specific filtering
- **Profit Analysis**:
  - Total revenue and profit calculations
  - Cost of Goods Sold (COGS) breakdown
  - Profit margin percentages
  - Profit trends over time
- **Stock Turnover Report**:
  - Inventory turnover rates
  - Slow-moving product identification
  - Stock level analysis
  - Days of inventory on hand
- **Platform Comparison**:
  - Revenue comparison across Shopee, Lazada, TikTok Shop
  - Order count by platform
  - Profit margin by platform
  - Performance comparison charts
- **Export Functionality**:
  - PDF export for all report types
  - Includes charts and data tables
  - Professional formatting
  - Date range and filters included in PDF

---

## Dashboard Demo

### Opening Statement
"Let me show you the Dashboard - your command center for monitoring business performance across all your e-commerce platforms."

### Step 1: Navigate to Dashboard
1. Show the Dashboard as the default landing page after login
2. Point out the welcome message and user information

**Talking Point:**
"The Dashboard is the first thing you see when you log in. It gives you an immediate overview of your business performance across all platforms - Shopee, Lazada, and more."

### Step 2: Show Platform Filter
1. Point out the platform filter buttons (All Platforms, Shopee Only, Lazada Only)
2. Demonstrate switching between filters

**Talking Point:**
"Notice the platform filter buttons at the top. You can view metrics for all platforms combined, or filter to see just Shopee or just Lazada. This is especially useful when you want to compare performance across platforms."

**Example from Demo Data:**
- "With our demo data, we have products and sales from both Shopee and Lazada."
- "When I select 'All Platforms', I see combined metrics: ₱80,000 total revenue (₱50,000 from Lazada + ₱30,000 from Shopee)."
- "When I select 'Shopee Only', I see ₱30,000 revenue from Filipino pasalubong products."
- "When I select 'Lazada Only', I see ₱50,000 revenue from clothing products."

### Step 3: Show Business Metrics Cards
1. Point out each metric card:
   - Total Sales (Revenue)
   - Total Orders
   - Active Products
   - Stock Alerts

**Talking Point:**
"These four metric cards give you the key numbers at a glance. Total Sales shows your lifetime revenue. Total Orders shows how many transactions you've completed. Active Products shows how many items you have in inventory. And Stock Alerts shows how many products need your attention."

**Example from Demo Data:**
- "With our demo data, you can see:
  - Total Sales: ₱80,000 (combined from both platforms)
  - Total Orders: [number of sales from both platforms]
  - Active Products: 42 products (21 from Shopee + 21 from Lazada)
  - Stock Alerts: [number of at-risk items]"

### Step 4: Show Sales Forecast Chart (Purchasing Pattern Prediction)
1. Point out the Sales Forecast chart
2. Explain the 14-day forecast
3. Show how it aggregates predictions from all products
4. Point out pattern recognition (paydays, trends)

**Talking Point:**
"This chart shows a 14-day AI-powered sales forecast. More importantly, it reveals purchasing patterns by analyzing your historical sales data. The system uses machine learning to recognize patterns you might miss."

**Purchasing Pattern Insights:**
"This is how BVA solves the visibility problem - the forecast chart shows:
- **Time-Based Patterns**: You can see when customers typically buy more (paydays, weekends, holidays)
- **Trend Patterns**: The line shows if purchasing is increasing, decreasing, or stable
- **Demand Spikes**: These reveal special events or patterns (like payday shopping)
- **Predictive Patterns**: The system predicts future purchasing based on past behavior"

**Example:**
- "The line shows predicted sales for the next 14 days, but more importantly, it reveals purchasing patterns."
- "See these spikes? The system learned from your sales data that customers buy 20% more on the 15th and 30th - these are payday purchasing patterns."
- "The upward trend shows customers are buying more over time - this is a growth pattern."
- "The forecast helps you understand not just what will sell, but when customers will buy it."

### Step 5: Show Stock Alerts
1. Point out the Stock Alerts section
2. Show the top 5 at-risk products
3. Explain risk scores and status indicators

**Talking Point:**
"The Stock Alerts section shows your top 5 at-risk products from SmartShelf. These are products that need immediate attention - they might be low on stock, expiring soon, or slow-moving. Each product shows a risk score and status."

**Example from Demo Data:**
- "This product has a Critical risk score - it's either very low on stock or expiring soon."
- "This one has a High risk score - it needs attention but isn't urgent yet."
- "You can click 'View All' to see all at-risk products in SmartShelf."

### Step 6: Show Real-Time Connection Status
1. Point out the "Live" or "Offline" indicator
2. Explain real-time updates

**Talking Point:**
"Notice the connection status indicator. When it shows 'Live', you're receiving real-time updates. The Dashboard automatically refreshes when new sales come in or inventory changes."

---

## Settings Demo

### Opening Statement
"Now let's look at Settings - where you manage your platform integrations and data synchronization."

### Step 1: Navigate to Settings
1. Click on "Settings" in the navigation menu
2. Show the Settings page layout

**Talking Point:**
"Settings is where you connect your e-commerce platform accounts and manage data synchronization. This is the foundation that powers all other BVA features."

### Step 2: Show Platform Integration Cards
1. Point out the integration cards for each platform:
   - Shopee-Clone
   - Lazada-Clone
   - TikTok Shop (if available)
2. Show connection status badges

**Talking Point:**
"Each platform has its own integration card. You can see the connection status - Connected, Not Connected, or Error. For our demo, we have both Shopee and Lazada connected."

**Example:**
- "Shopee-Clone shows 'Connected' - this means your Shopee account is linked and data is syncing."
- "Lazada-Clone also shows 'Connected' - your Lazada account is linked."
- "Each platform shows when it was last synced."

### Step 3: Show Connection Flow (If Not Connected)
1. Click "Connect" button for a platform
2. Show the OAuth flow (if applicable)
3. Show terms acceptance

**Talking Point:**
"When you click 'Connect', you'll be redirected to the platform's authentication page. After logging in, you'll need to accept the terms and conditions. This ensures you understand how your data will be used."

**Important Points:**
- "BVA only accesses data you explicitly authorize."
- "You can disconnect at any time."
- "Data is securely stored and encrypted."

### Step 4: Show Data Synchronization
1. Point out the "Sync Now" button
2. Show sync status indicators
3. Demonstrate manual sync

**Talking Point:**
"After connecting, BVA automatically syncs your data. You can also manually sync by clicking 'Sync Now'. The sync brings in your products, orders, and sales data from the platform."

**Example:**
- "When you click 'Sync Now', you'll see a progress indicator."
- "After sync completes, you'll see how many products and sales were synced."
- "For our demo data, we have 21 products from Shopee and 21 from Lazada."

### Step 5: Show Sync Results
1. Show the sync results notification
2. Point out products and sales counts

**Talking Point:**
"After syncing, you'll see a summary: 'Sync completed! X products, Y sales synced.' This tells you exactly what data was imported."

**Example from Demo Data:**
- "Shopee sync: 21 products, [number] sales synced"
- "Lazada sync: 21 products, [number] sales synced"
- "Total: 42 products across both platforms"

### Step 6: Show Shop Management
1. Show connected shops list
2. Explain shop linking

**Talking Point:**
"If you have multiple shops on a platform, you can link them all. Each shop's data is kept separate, but you can view everything in one dashboard."

---

## Reports Demo

### Opening Statement
"Finally, let's explore Reports - your comprehensive business analytics tool that helps you understand your business performance in detail."

### Step 1: Navigate to Reports
1. Click on "Reports" in the navigation menu
2. Show the Reports page layout

**Talking Point:**
"Reports provides detailed analytics that help you make informed business decisions. Instead of manually compiling data from multiple platforms, Reports does it automatically."

### Step 2: Show Report Tabs
1. Point out the four report tabs:
   - Sales
   - Profit
   - Stock
   - Platform
2. Explain what each report shows

**Talking Point:**
"Reports has four main sections. Sales shows your revenue trends over time. Profit shows your profit margins and COGS. Stock shows inventory turnover and slow-moving products. Platform compares performance across Shopee, Lazada, and TikTok Shop."

### Step 3: Show Date Range Selector
1. Point out the date range dropdown
2. Show available options: 7d, 30d, 90d, 1y, Custom
3. Demonstrate changing date ranges

**Talking Point:**
"You can view reports for different time periods. The 7-day view shows recent trends. The 30-day view shows monthly performance. The 90-day and 1-year views show longer-term patterns. You can also select a custom date range."

**Example:**
- "Let's select '30d' to see the last month's performance."
- "This gives us a good overview of recent business trends."

### Step 4: Show Platform Filter
1. Point out the platform filter
2. Demonstrate filtering by platform

**Talking Point:**
"Just like the Dashboard, you can filter reports by platform. This lets you compare performance between Shopee and Lazada, or view combined data."

**Example from Demo Data:**
- "With 'All Platforms' selected, we see combined data from Shopee and Lazada."
- "With 'Shopee Only', we see only Filipino pasalubong sales."
- "With 'Lazada Only', we see only clothing sales."

### Step 5: Sales Report Demo (Purchasing Pattern Analysis)
1. Click on "Sales" tab
2. Show the sales chart
3. Point out revenue trends
4. Highlight time-based patterns

**Talking Point:**
"The Sales report is one of the most powerful tools for understanding purchasing patterns. It shows your revenue over time, revealing when, how much, and how often customers buy."

**Purchasing Pattern Insights:**
"This report solves the visibility problem by showing:
- **Time-Based Patterns**: Daily, weekly, or monthly views reveal when customers buy
- **Trend Patterns**: The chart shows if purchasing is increasing, decreasing, or seasonal
- **Spike Patterns**: Demand spikes reveal payday shopping, holiday shopping, or promotional effects
- **Frequency Patterns**: How often customers make purchases
- **Quantity Patterns**: How much customers spend per period"

**Example from Demo Data:**
- "With our demo data, you can see sales from the past month."
- "Notice these spikes on the 15th and 30th? These are payday purchasing patterns - customers buy more when they receive their salary."
- "The upward trend shows customers are buying more over time - this is a growth pattern."
- "When you filter by platform, you can see different purchasing patterns - Shopee customers might buy more on weekends, while Lazada customers buy more on weekdays."
- "This visibility helps you understand exactly when to stock up and when to run promotions."

### Step 6: Profit Report Demo
1. Click on "Profit" tab
2. Show profit metrics
3. Explain profit margin calculation

**Talking Point:**
"The Profit report shows your actual profitability. It calculates revenue minus cost of goods sold to show your profit. The profit margin percentage tells you how much profit you make per peso of revenue."

**Example from Demo Data:**
- "Total Revenue: ₱80,000 (₱50,000 Lazada + ₱30,000 Shopee)"
- "Total Profit: ₱32,000 (₱17,000 Lazada + ₱15,000 Shopee)"
- "Profit Margin: 40% overall"
- "Notice how Shopee has a 50% margin while Lazada has a 34% margin - this helps you understand which platform is more profitable."

### Step 7: Stock Turnover Report Demo
1. Click on "Stock" tab
2. Show inventory turnover metrics
3. Point out slow-moving products

**Talking Point:**
"The Stock Turnover report shows how quickly your inventory is moving. High turnover means products sell fast. Low turnover means products are sitting in inventory. This helps you identify slow-moving products that might need marketing help."

**Example from Demo Data:**
- "Best sellers like Chicharon and Premium Cotton T-Shirt have high turnover."
- "Slow-moving products might need bundle campaigns or discounts."
- "The report shows days of inventory on hand - how long current stock will last at current sales rates."

### Step 8: Platform Comparison Report Demo (Platform Preference Patterns)
1. Click on "Platform" tab
2. Show platform comparison charts
3. Compare Shopee vs Lazada performance
4. Highlight customer preference patterns

**Talking Point:**
"The Platform Comparison report reveals one of the most important purchasing patterns - where customers prefer to buy. This solves the visibility problem by showing platform-specific customer behavior."

**Purchasing Pattern Insights:**
"This report shows:
- **Platform Preference Patterns**: Which platform customers prefer for different product categories
- **Spending Patterns**: How much customers spend on each platform
- **Frequency Patterns**: How often customers buy from each platform
- **Product Preference Patterns**: Which products perform better on which platform
- **Profit Patterns**: Which platform generates better margins"

**Example from Demo Data:**
- "Shopee: ₱30,000 revenue, [X] orders, 50% profit margin - Customers prefer Shopee for Filipino pasalubong items"
- "Lazada: ₱50,000 revenue, [Y] orders, 34% profit margin - Customers prefer Lazada for clothing and apparel"
- "This reveals a clear purchasing pattern: customers buy food items on Shopee but clothing on Lazada."
- "The 50% margin on Shopee vs 34% on Lazada shows customers are willing to pay more for pasalubong items."
- "This visibility helps you understand where to focus inventory and marketing efforts based on actual customer preferences."

### Step 9: Export to PDF
1. Click "Generate Report" button
2. Show the report dialog
3. Click "Export PDF"
4. Demonstrate PDF generation

**Talking Point:**
"One of the most useful features is PDF export. You can export any report as a professional PDF document. This is perfect for sharing with partners, investors, or for your own records."

**Example:**
- "Click 'Generate Report' to see a detailed view."
- "Then click 'Export PDF' to download a professional PDF."
- "The PDF includes all charts, data tables, and your selected filters."
- "Perfect for monthly business reviews or financial planning."

### Step 10: Show Report Details
1. Show the detailed report view
2. Point out key metrics and insights

**Talking Point:**
"When you generate a report, you get a detailed view with key metrics, trends, and insights. This gives you everything you need to make informed business decisions."

---

## Complete Workflow Demo

### Scenario: Setting Up BVA for the First Time

**Talking Point:**
"Let me show you a complete workflow - from setting up BVA to analyzing your business performance."

### Step 1: Initial Setup in Settings
1. Navigate to Settings
2. Connect Shopee account
3. Accept terms and conditions
4. Sync data

**Talking Point:**
"First, you connect your e-commerce platform accounts in Settings. After connecting and accepting terms, BVA automatically syncs your products and sales data."

**Example:**
- "Connect Shopee account → Accept terms → Sync data"
- "Connect Lazada account → Accept terms → Sync data"
- "Now you have 42 products and sales data from both platforms"

### Step 2: View Dashboard Overview
1. Navigate to Dashboard
2. Show combined metrics
3. Filter by platform

**Talking Point:**
"After syncing, the Dashboard immediately shows your business overview. You can see total revenue, orders, products, and stock alerts across all platforms."

**Example:**
- "Dashboard shows: ₱80,000 revenue, [X] orders, 42 products, [Y] stock alerts"
- "Filter to see Shopee-only or Lazada-only metrics"

### Step 3: Analyze Performance in Reports
1. Navigate to Reports
2. Generate Sales report
3. Generate Profit report
4. Generate Platform Comparison

**Talking Point:**
"Next, you dive into Reports to understand your business performance. The Sales report shows revenue trends. The Profit report shows profitability. The Platform Comparison shows which platform performs better."

**Example:**
- "Sales Report: See revenue trends over the last 30 days"
- "Profit Report: See that Shopee has 50% margin vs Lazada's 34% margin"
- "Platform Comparison: Understand which platform is more profitable"

### Step 4: Take Action Based on Insights
1. Identify best sellers from Reports
2. Check stock alerts in Dashboard
3. Navigate to SmartShelf for details

**Talking Point:**
"Based on the insights, you can take action. If Reports show certain products are best sellers, check if they need restocking. If Dashboard shows stock alerts, go to SmartShelf to see details and recommendations."

**Example:**
- "Reports show Chicharon is a best seller"
- "Dashboard shows it has a stock alert"
- "Navigate to SmartShelf to see it needs restocking"
- "Use Restock Planner to plan the restock"
- "Use MarketMate to create a campaign"

### Step 5: Export Reports for Records
1. Generate comprehensive report
2. Export to PDF
3. Save for records

**Talking Point:**
"Finally, export your reports as PDFs for your records. This is useful for monthly reviews, tax preparation, or sharing with partners."

---

## Purchasing Pattern Visibility - Complete Solution

### How Dashboard, Settings, and Reports Solve the "Lack of Visibility" Problem

**Talking Point:**
"One of the biggest challenges for small businesses is understanding customer purchasing patterns. Dashboard, Settings, and Reports work together to provide complete visibility."

### Pattern 1: Time-Based Purchasing Patterns
**Where to Show:**
- Dashboard sales forecast
- Reports Sales tab

**Talking Point:**
"BVA reveals when customers buy:
- **Payday Patterns**: System detects 20% increase on 15th and 30th - Filipino customers shop more on paydays
- **Day of Week Patterns**: Some products sell more on weekends
- **Holiday Patterns**: Increased demand during holidays
- **Seasonal Patterns**: Weather-related purchasing changes"

**Example:**
- "The sales forecast shows payday spikes - this is a purchasing pattern learned from your data."
- "Reports show daily trends - you can see customers buy more on weekends for certain products."

### Pattern 2: Product Preference Patterns
**Where to Show:**
- Dashboard stock alerts (best sellers)
- Reports Profit and Stock tabs

**Talking Point:**
"BVA shows which products customers prefer:
- Best sellers reveal top preferences
- Profit margins show what customers value
- Stock turnover shows purchase frequency
- Trending products show changing preferences"

**Example:**
- "From our demo data, customers prefer Chicharon (high sales) and Premium Cotton T-Shirt (best seller)."
- "Profit analysis shows customers are willing to pay more for certain products."

### Pattern 3: Platform Preference Patterns
**Where to Show:**
- Dashboard platform filter
- Reports Platform Comparison

**Talking Point:**
"BVA reveals where customers prefer to buy:
- Platform comparison shows Shopee vs Lazada preferences
- Different product categories perform better on different platforms
- Profit margins vary by platform, showing customer willingness to pay"

**Example:**
- "Platform comparison shows customers buy pasalubong on Shopee but clothing on Lazada."
- "This is a clear purchasing pattern that helps you decide where to focus."

### Pattern 4: Quantity and Frequency Patterns
**Where to Show:**
- Dashboard metrics (orders, revenue)
- Reports Sales and Stock tabs

**Talking Point:**
"BVA tracks how much and how often customers buy:
- Order counts show purchase frequency
- Revenue shows spending amounts
- Stock turnover shows how quickly products move
- Sales velocity reveals demand intensity"

**Example:**
- "Dashboard shows [X] total orders - this reveals how frequently customers make purchases."
- "Reports show daily sales - you can see if customers buy daily, weekly, or monthly."

### Pattern 5: Trend and Growth Patterns
**Where to Show:**
- Dashboard sales forecast trend
- Reports Sales tab trends

**Talking Point:**
"BVA identifies trends and growth patterns:
- Upward trends show growing customer base
- Downward trends show declining interest
- Seasonal trends show cyclical patterns
- Forecast predictions show future patterns"

**Example:**
- "The sales forecast shows an upward trend - customers are buying more over time."
- "Reports show monthly trends - you can see if business is growing or declining."

## Closing Statement

"Dashboard, Settings, and Reports work together to solve the critical problem of lack of visibility on purchasing patterns:

- **Dashboard** shows real-time purchasing patterns through forecasts and metrics
- **Settings** ensures all sales data is synced for accurate pattern analysis
- **Reports** provides deep insights into purchasing patterns over time

All three features use your actual sales and inventory data to reveal:
- **What customers buy**: Product preferences, best sellers, trending items
- **When customers buy**: Payday patterns, holiday spikes, time-based trends
- **Where customers buy**: Platform preferences, Shopee vs Lazada
- **How much customers buy**: Quantity patterns, spending amounts, frequency
- **Why patterns exist**: Context-aware insights (paydays, holidays, seasons)

Instead of guessing what customers want, you now have complete visibility into their purchasing patterns. The platform filtering lets you compare patterns across Shopee and Lazada, helping you make data-driven decisions based on actual customer behavior.

Thank you for watching this demo. Are there any questions?"

---

## Quick Reference: Demo Data Highlights

### Combined Metrics (All Platforms)
- **Total Revenue**: ₱80,000
  - Shopee: ₱30,000 (Filipino Pasalubong)
  - Lazada: ₱50,000 (Clothing)
- **Total Profit**: ₱32,000
  - Shopee: ₱15,000 (50% margin)
  - Lazada: ₱17,000 (34% margin)
- **Total Products**: 42
  - Shopee: 21 products (all with sales)
  - Lazada: 21 products (7 with sales, 14 flop)
- **Total Orders**: [Number of sales from both platforms]

### Shopee (Filipino Pasalubong)
- **Products**: 21 products
- **Best Sellers**: Chicharon, Dried Mangoes, Banana Chips, Polvoron
- **Revenue**: ₱30,000
- **Profit**: ₱15,000 (50% margin)
- **Key Insight**: Higher profit margin per sale

### Lazada (Clothing & Apparel)
- **Products**: 21 products
- **Products with Sales**: 7 products (1/3)
- **Best Sellers**: Premium Cotton T-Shirt, V-Neck T-Shirt, Premium Pullover Hoodie
- **Revenue**: ₱50,000
- **Profit**: ₱17,000 (34% margin)
- **Key Insight**: Higher revenue but lower margin per sale

### Key Demo Points
- **Dashboard**: Show platform filtering, metrics cards, sales forecast, stock alerts
- **Settings**: Show platform connections, data sync, shop management
- **Reports**: Show all four report types, platform comparison, PDF export
- **Integration**: Demonstrate complete workflow from setup to analysis

---

## Presentation Tips

### Timing
- **Dashboard Demo**: 3-4 minutes
- **Settings Demo**: 2-3 minutes
- **Reports Demo**: 5-6 minutes
- **Complete Workflow**: 2-3 minutes
- **Total**: 12-16 minutes

### Key Messages to Emphasize
1. **Real-Time Data**: Emphasize that all data is live and up-to-date
2. **Multi-Platform**: Highlight the ability to manage multiple platforms in one place
3. **Data-Driven Decisions**: Show how insights lead to actionable decisions
4. **Easy Setup**: Emphasize how simple it is to connect platforms
5. **Comprehensive Analytics**: Highlight the depth of reporting available

### Visual Highlights
- Use platform filter to show the difference between combined and individual platform views
- Show the contrast between Shopee's 50% margin and Lazada's 34% margin
- Demonstrate PDF export to show professional reporting
- Use stock alerts to show integration with SmartShelf

### Common Questions
- **Q: How often does data sync?**
  - A: Data syncs automatically when you connect, and you can manually sync anytime. Real-time updates come through when new sales occur.

- **Q: Can I disconnect a platform?**
  - A: Yes, you can disconnect any platform at any time from Settings. Your historical data remains, but new data won't sync.

- **Q: How accurate are the forecasts?**
  - A: Forecasts use machine learning algorithms trained on your historical data. Accuracy improves as you have more sales history.

- **Q: Can I export reports in other formats?**
  - A: Currently, PDF export is available. CSV export for data tables is planned for future releases.

