# Business Virtual Assistant (BVA) - Project Documentation

## 1. Project Overview
**Business Virtual Assistant (BVA)** is an AI-powered platform designed to help e-commerce sellers automate and optimize their operations. It integrates inventory management, sales forecasting, restocking planning, and marketing automation into a single dashboard.

The system leverages machine learning to provide actionable insights, such as identifying at-risk inventory, calculating optimal restocking strategies based on budget, and generating marketing content.

## 2. System Architecture
The project follows a microservices-inspired architecture consisting of three main components:

1.  **Frontend (Client)**: A modern React application providing the user interface.
2.  **Backend API (Server)**: A Node.js/Express server handling business logic, data persistence, and authentication.
3.  **ML Service (AI Engine)**: A Python/FastAPI service dedicated to heavy data processing and machine learning tasks.

### High-Level Data Flow
1.  **User Interaction**: Users interact with the Frontend (e.g., requesting a restock plan).
2.  **API Request**: The Frontend sends a request to the Backend API.
3.  **Data Retrieval**: The Backend fetches necessary data (sales history, current inventory) from the PostgreSQL database via Prisma.
4.  **AI Processing**: For intelligent features, the Backend forwards the data to the ML Service.
5.  **Computation**: The ML Service processes the data (e.g., runs forecasting models) and returns the results.
6.  **Response**: The Backend formats the response and sends it back to the Frontend for display.

## 3. Technology Stack

### Frontend (`bva-frontend`)
*   **Framework**: React 18 with Vite
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **UI Library**: ShadCN/UI (Radix UI based)
*   **State Management**: TanStack Query (React Query)
*   **Routing**: React Router DOM
*   **Icons**: Lucide React

### Backend (`server`)
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Language**: TypeScript
*   **Database ORM**: Prisma
*   **Database**: PostgreSQL
*   **Authentication**: JWT (JSON Web Tokens)

### ML Service (`ml-service`)
*   **Framework**: FastAPI
*   **Language**: Python 3.11+
*   **Data Processing**: Pandas, NumPy
*   **Machine Learning**: Scikit-learn
*   **Task Queue**: Celery (configured structure)

## 4. Key Features & Modules

### 📊 Dashboard
*   **Overview**: Provides a high-level view of business health.
*   **Metrics**: Displays total revenue, profit margins, and stock turnover rates.

### 📦 SmartShelf (Inventory Management)
*   **Real-time Tracking**: Monitors stock levels across connected platforms.
*   **At-Risk Detection**: Identifies products that are low in stock or nearing expiration.
*   **Actionable Insights**: Suggests promotions or clearance sales for slow-moving items.

### 🔄 Restock Planner
*   **AI Optimization**: Calculates the optimal restocking strategy based on a user-defined budget and goal (Profit vs. Volume vs. Balanced).
*   **Forecasting**: Uses historical sales data to predict future demand.
*   **Recommendations**: Provides specific quantity recommendations for each product to maximize ROI.

### 📢 MarketMate (Marketing Automation)
*   **Ad Generation**: Generates ad copy and hashtags using AI templates ("Playbooks").
*   **Image Generation**: Creates product marketing images (placeholder/mock integration).
*   **Campaign Management**: Helps structure marketing campaigns based on inventory needs.

### 📈 Reports
*   **Analytics**: Detailed breakdown of sales performance.
*   **Visualizations**: Charts and graphs for revenue trends and sales summaries.

## 5. Directory Structure

```
bva-server/
├── bva-frontend/          # React Frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Main application views
│   │   ├── lib/           # API clients and utilities
│   │   └── contexts/      # React Context (Auth, Theme)
│   └── ...
│
├── server/                # Node.js Backend
│   ├── prisma/            # Database schema and migrations
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── routes/        # API route definitions
│   │   ├── service/       # Business logic
│   │   └── utils/         # Utilities (including mlClient)
│   └── ...
│
└── ml-service/            # Python ML Service
    ├── app/
    │   ├── routes/        # FastAPI endpoints
    │   ├── services/      # ML logic and data processing
    │   └── models/        # ML models
    └── ...
```

## 6. API Overview

### Backend API (`server`)
*   `/api/users`: Authentication (Login, Register, Profile).
*   `/api/products`: Product management.
*   `/api/smart-shelf`: Inventory analysis and at-risk items.
*   `/api/ai/restock-strategy`: Restock planning (proxies to ML service).
*   `/api/v1/ads`: Ad generation (proxies to ML service).
*   `/api/reports`: Dashboard metrics and sales summaries.

### ML Service API (`ml-service`)
*   `/api/v1/smart-shelf/at-risk`: Analyzes inventory for risks.
*   `/api/v1/restock/strategy`: Computes restocking logic.
*   `/api/v1/ads/generate`: Generates marketing content.

## 7. Setup & Running

### Prerequisites
*   Node.js & npm
*   Python 3.11+
*   PostgreSQL Database

### Steps
1.  **Database**: Ensure PostgreSQL is running and update `.env` in `server/` with `DATABASE_URL`.
2.  **Backend**:
    ```bash
    cd server
    npm install
    npx prisma migrate dev
    npm run dev
    ```
3.  **ML Service**:
    ```bash
    cd ml-service
    python -m venv venv
    source venv/bin/activate  # or venv\Scripts\activate on Windows
    pip install -r requirements.txt
    uvicorn app.main:app --reload --port 8001
    ```
4.  **Frontend**:
    ```bash
    cd bva-frontend
    npm install
    npm run dev
    ```

## 8. Future Improvements
*   **Real Integration**: Connect `MarketMate` to real Image Generation APIs (e.g., OpenAI DALL-E or Stable Diffusion).
*   **Platform Sync**: Implement actual API connections to Shopee/Lazada/TikTok (currently mocked/simulated).
*   **Advanced ML**: Train custom models on user-specific data for better forecasting accuracy.
