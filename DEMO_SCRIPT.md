# BVA Demo Script: SmartShelf, Restock Planner, and MarketMate

## Table of Contents
1. [Introduction to BVA Features](#introduction-to-bva-features)
2. [SmartShelf Demo](#smartshelf-demo)
3. [Restock Planner Demo](#restock-planner-demo)
4. [MarketMate Demo](#marketmate-demo)
5. [Integration Flow Demo](#integration-flow-demo)

---

## Introduction to BVA Features

### What is Business Virtual Assistant (BVA)?

BVA is an AI-powered business management platform designed specifically for Filipino SMBs selling on multiple e-commerce platforms like Shopee and Lazada. It provides intelligent inventory management, demand forecasting, and marketing automation to help sellers optimize their business operations.

### The Three Core Features

#### 1. SmartShelf - Intelligent Inventory Management
**What it is:**
SmartShelf is an AI-powered inventory monitoring system that automatically detects at-risk products in your inventory. It uses machine learning to analyze your stock levels, expiry dates, and sales velocity to identify products that need immediate attention.

**How it works:**
- **Risk Detection**: Analyzes three key factors:
  - **Low Stock**: Products running below safe threshold levels
  - **Near Expiry**: Products approaching expiration dates (critical for food items)
  - **Slow Moving**: Products with poor sales velocity
- **Risk Scoring**: Each product gets a risk score from 0-100:
  - **Critical (80-100)**: Red badge - Immediate action required
  - **High (60-79)**: Orange badge - Action needed soon
  - **Medium (40-59)**: Yellow badge - Monitor closely
  - **Low (0-39)**: Green badge - Healthy status
- **Product Trends**: Automatically categorizes products:
  - **Best Seller** (Top 20%): High sales velocity products
  - **Trending** (Top 50%): Good performing products
  - **Normal**: Average performance
  - **Slow Moving** (Bottom 20%): Low sales velocity
  - **Flop**: Zero sales products
- **Actionable Recommendations**: Provides specific actions:
  - Restock quantities for low stock items
  - Discount percentages for near-expiry items
  - Bundle suggestions for slow movers
  - Clearance recommendations for expired items

#### 2. Restock Planner - AI-Powered Restocking Strategy
**What it is:**
Restock Planner is an intelligent tool that optimizes your restocking decisions based on your budget, business goals, and AI-powered demand forecasts. It helps you make data-driven decisions about what to restock and in what quantities.

**How it works:**
- **Demand Forecasting**: Uses multiple ML algorithms (Linear, Exponential Smoothing, XGBoost) to predict future sales
- **Context-Aware Adjustments**: Considers:
  - **Payday Cycles**: +20% demand increase on 15th and month-end
  - **Holidays**: +30-50% demand boost for relevant categories
  - **Weather**: Seasonal adjustments for weather-sensitive products
- **Optimization Strategies**:
  - **Profit Maximization**: Prioritizes high-margin, fast-moving items
  - **Volume Maximization**: Maximizes inventory turnover and units sold
  - **Balanced Growth**: Hybrid approach balancing profit and volume
- **Budget Optimization**: Takes your available budget and suggests the most profitable product mix
- **Forecast Calendar**: Visual calendar showing demand spikes and special events

#### 3. MarketMate - AI Marketing Automation
**What it is:**
MarketMate is an AI-powered marketing automation tool that generates contextual marketing campaigns and provides one-click publishing to social media platforms. It uses playbooks to create targeted advertisements based on your inventory and sales data.

**How it works:**
- **AI Advertisement Generation**: Uses Google Gemini 2.0 Flash to generate marketing copy
- **Playbooks**: Four strategic campaign types:
  - **Flash Sale**: For low stock or expiring items
  - **New Arrival**: For newly added products
  - **Best Seller Spotlight**: For top-performing products
  - **Bundle Up!**: For slow-moving or flop products
- **Image Generation**: Uses Google Imagen to create ad images with product context
- **Campaign Management**: Create, schedule, and publish campaigns to Facebook
- **Smart Integration**: Deep linking from SmartShelf and Restock Planner

---

## SmartShelf Demo

### Opening Statement
"Let me show you how SmartShelf helps you stay on top of your inventory. With our demo data, we have products from both Shopee and Lazada platforms."

### Step 1: Navigate to SmartShelf
1. Click on "SmartShelf" in the navigation menu
2. Show the platform filter buttons (All Platforms, Shopee Only, Lazada Only)

**Talking Point:**
"Notice how you can filter by platform. This is especially useful when managing multiple shops across different platforms."

### Step 2: Show At-Risk Products
1. Point out the risk score badges (Critical, High, Medium, Low)
2. Show products with different risk levels

**Talking Point:**
"SmartShelf automatically analyzes all your products and assigns risk scores. Products with red badges need immediate attention - these could be low stock, expiring soon, or slow-moving items."

**Example from Demo Data:**
- "Look at this product - it has a Critical risk score of 85. This means it's either running very low on stock or expiring soon."
- "Here's a product with a High risk score - it needs attention but isn't urgent yet."

### Step 3: Show Product Trends
1. Point out the trend badges (Best Seller, Trending, Slow Moving, Flop)
2. Click on a Best Seller product

**Talking Point:**
"SmartShelf also categorizes your products by performance. Best Sellers are your top 20% performers - these are products you want to keep well-stocked. Flop products have zero sales and might need marketing help."

**Example from Demo Data:**
- "This 'Premium Cotton T-Shirt' is marked as Best Seller - it's one of your top performers."
- "This product is marked as Flop - it has zero sales. We can use MarketMate to create a bundle campaign for it."

### Step 4: Show Product Details
1. Click on an at-risk product to see details
2. Show the risk breakdown, expiry date, and recommendations

**Talking Point:**
"Each product shows detailed information. For food items from Shopee, you'll see expiry dates. The system provides specific recommendations - like 'Restock 50 units' or 'Apply 30% discount'."

**Example from Demo Data:**
- "This Filipino pasalubong product shows it's expiring in 30 days - SmartShelf recommends a 15-25% discount to move it quickly."
- "This clothing item is low on stock - SmartShelf suggests restocking 30 units."

### Step 5: Integration with MarketMate
1. Click on a "Best Seller" badge
2. Show how it navigates to MarketMate with pre-filled data

**Talking Point:**
"One of the powerful features is the integration between SmartShelf and MarketMate. When you click on a Best Seller badge, it automatically opens MarketMate with the 'Best Seller Spotlight' playbook selected, ready to create a campaign."

---

## Restock Planner Demo

### Opening Statement
"Now let's see how Restock Planner helps you make intelligent restocking decisions. This tool uses AI to predict demand and optimize your restocking strategy."

### Step 1: Navigate to Restock Planner
1. Click on "Restock Planner" in the navigation menu
2. Show the main interface with budget input and goal selection

**Talking Point:**
"Restock Planner takes your budget and business goals to create an optimized restocking plan. You can choose to maximize profit, maximize volume, or use a balanced approach."

### Step 2: Set Budget and Goals
1. Enter a budget (e.g., ₱10,000)
2. Select "Profit Maximization" goal
3. Set restock days (e.g., 30 days)
4. Toggle "Payday" context if applicable

**Talking Point:**
"Let's say you have ₱10,000 to spend on restocking. You want to maximize profit, and you're planning for the next 30 days. The system will consider payday cycles - demand typically increases by 20% on the 15th and month-end."

**Example from Demo Data:**
- "With our demo data, we have products from both Shopee and Lazada. Shopee has Filipino pasalubong items, while Lazada has clothing. The system will recommend the most profitable mix."

### Step 3: Generate Restock Plan
1. Click "Generate Restock Plan"
2. Show the loading state
3. Display the recommendations

**Talking Point:**
"The AI analyzes your sales history, profit margins, and demand forecasts to create an optimized plan. It considers which products are selling well, which have good profit margins, and which need restocking."

**Example Recommendations:**
- "The system recommends restocking 50 units of 'Chicharon' - it's a best seller with good profit margin."
- "It suggests 30 units of 'Premium Cotton T-Shirt' - high sales velocity and profitable."
- "Notice how it avoids products that are slow-moving or near expiry."

### Step 4: Show Forecast Calendar
1. Click on the "Forecast Calendar" tab
2. Show the monthly calendar with demand spikes
3. Click on a date with high demand

**Talking Point:**
"The Forecast Calendar shows you when demand is expected to spike. Paydays and holidays are highlighted. You can click on any date to see detailed forecasts."

**Example:**
- "See how the 15th and 30th are highlighted? Those are paydays when demand typically increases."
- "Click on a date to see which products are expected to sell more on that day."

### Step 5: Show ROI and Projections
1. Point out the expected profit, revenue, and ROI
2. Show the reasoning for each recommendation

**Talking Point:**
"Each recommendation shows expected profit, revenue, and ROI. The system also provides reasoning - like 'High sales velocity' or 'Best profit margin' - so you understand why it's recommending this product."

**Example:**
- "This restock plan is expected to generate ₱15,000 in revenue with ₱7,500 profit - that's a 75% ROI on your ₱10,000 investment."

### Step 6: Integration with MarketMate
1. Show how you can create campaigns from the forecast calendar
2. Click on a high-demand date and show "Create Campaign" option

**Talking Point:**
"You can create marketing campaigns directly from the forecast calendar. If you see a high-demand day coming up, you can create a campaign in MarketMate to capitalize on it."

---

## MarketMate Demo

### Opening Statement
"Finally, let's see how MarketMate automates your marketing. It uses AI to generate ad copy and images, and can publish directly to Facebook."

### Step 1: Navigate to MarketMate
1. Click on "MarketMate" in the navigation menu
2. Show the campaigns list

**Talking Point:**
"MarketMate shows all your campaigns - drafts, scheduled, and published. You can see which campaigns are performing well."

**Example from Demo Data:**
- "We have some demo campaigns already created. This one is published, this one is scheduled for tomorrow."

### Step 2: Create a New Campaign - Best Seller Spotlight
1. Click "Create Campaign"
2. Select a best seller product (e.g., "Chicharon" or "Premium Cotton T-Shirt")
3. Select "Best Seller Spotlight" playbook
4. Show the AI-generated ad copy

**Talking Point:**
"Let's create a campaign for a best seller. MarketMate uses AI to generate compelling ad copy. The 'Best Seller Spotlight' playbook is designed to highlight your top-performing products."

**Example:**
- "The AI generated: '🔥 BEST SELLER! Our most popular Chicharon - trusted by thousands! Perfect pasalubong!'"
- "Notice how it automatically includes relevant keywords and emojis to make it engaging."

### Step 3: Generate AI Image
1. Click "Generate Image"
2. Show the image generation process
3. Display the generated image

**Talking Point:**
"MarketMate can generate ad images using AI. It uses your product image as context to create professional-looking advertisements."

**Example:**
- "The AI created an image that matches your product style and includes marketing elements."

### Step 4: Create a Bundle Campaign for Flop Product
1. Navigate from SmartShelf (click on a Flop badge)
2. Show how it pre-fills MarketMate with "Bundle Up!" playbook
3. Generate ad copy

**Talking Point:**
"Remember that flop product from SmartShelf? We can create a bundle campaign for it. The 'Bundle Up!' playbook is designed to move slow-moving products by bundling them with best sellers."

**Example:**
- "The AI suggests bundling the slow-moving product with a best seller at a discount."
- "This helps clear inventory while still making a profit."

### Step 5: Schedule and Publish
1. Show scheduling options
2. Show Facebook publishing (if connected)
3. Demonstrate publishing a campaign

**Talking Point:**
"You can schedule campaigns for later or publish immediately. If you've connected your Facebook page, you can publish directly from MarketMate."

**Example:**
- "Let's schedule this campaign for tomorrow at 2 PM - that's when your target audience is most active."
- "Or publish it now to Facebook with one click."

### Step 6: Show Campaign Analytics
1. Click on a published campaign
2. Show engagement metrics

**Talking Point:**
"After publishing, you can track how your campaigns are performing. See likes, shares, and comments to understand what resonates with your audience."

---

## Integration Flow Demo

### Complete Workflow Demonstration

**Talking Point:**
"Now let me show you how these three features work together in a complete workflow."

### Scenario: Managing a Low Stock Best Seller

1. **Start in SmartShelf**
   - "You notice a best seller is running low on stock - it has a High risk score."
   - "SmartShelf recommends restocking 50 units."

2. **Move to Restock Planner**
   - "You go to Restock Planner and set your budget."
   - "The system confirms this product should be restocked and includes it in your plan."
   - "You approve the restock plan."

3. **Create Marketing Campaign in MarketMate**
   - "After restocking, you want to promote this product."
   - "You click the Best Seller badge in SmartShelf, which opens MarketMate."
   - "MarketMate generates a 'Best Seller Spotlight' campaign."
   - "You schedule it for the next payday to maximize sales."

**Talking Point:**
"This is the power of BVA - it connects inventory management, demand forecasting, and marketing automation into one seamless workflow."

### Scenario: Clearing Expired Inventory

1. **SmartShelf Detection**
   - "SmartShelf detects a product that's expired or expiring soon."
   - "It shows a Critical risk score and recommends a clearance sale."

2. **MarketMate Clearance Campaign**
   - "You create a 'Flash Sale' campaign in MarketMate."
   - "The AI generates ad copy emphasizing urgency: '⚠️ CLEARANCE SALE! Limited time offer!'"
   - "You publish it immediately to move the inventory quickly."

**Talking Point:**
"Instead of losing money on expired products, you can quickly create campaigns to clear them at a discount, minimizing losses."

---

## Closing Statement

"BVA's three core features - SmartShelf, Restock Planner, and MarketMate - work together to help you:
- **Stay on top of inventory** with AI-powered risk detection
- **Make smart restocking decisions** with demand forecasting
- **Automate marketing** with AI-generated campaigns

All of this is designed specifically for Filipino SMBs selling on Shopee, Lazada, and other platforms. The system learns from your sales data and gets smarter over time.

Thank you for watching this demo. Are there any questions?"

---

## Quick Reference: Demo Data Highlights

### Shopee (Filipino Pasalubong)
- **Total Products**: 21 products
- **Best Sellers**: Chicharon, Dried Mangoes, Banana Chips, Polvoron
- **Expired Item**: Buko Pie (expired 2 days ago) - for clearance demo
- **Total Sales**: ₱30,000
- **Revenue**: ₱15,000 (50% margin)

### Lazada (Clothing & Apparel)
- **Total Products**: 21 products
- **Products with Sales**: 7 products (1/3)
- **Best Sellers**: Premium Cotton T-Shirt, V-Neck T-Shirt, Premium Pullover Hoodie
- **Flop Products**: 14 products with zero sales - for bundle campaigns
- **Total Sales**: ₱50,000
- **Revenue**: ₱17,000 (34% margin)

### Key Demo Points
- **SmartShelf**: Show risk scores, trends, and recommendations
- **Restock Planner**: Demonstrate budget optimization and forecast calendar
- **MarketMate**: Show AI-generated campaigns and Facebook integration
- **Integration**: Demonstrate workflow between all three features

