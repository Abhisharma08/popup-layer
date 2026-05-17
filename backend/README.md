# PopLayer Backend API ⚡

The core API service for PopLayer, responsible for popup management, analytics tracking, lead capture, and serving the embeddable widget.

## 🚀 Features

- **RESTful API**: Clean Express-based endpoints for the dashboard and widget.
- **ORM Integration**: Type-safe database operations using Prisma.
- **Analytics Ingestion**: High-performance tracking of impressions and clicks.
- **Lead Capture & Webhooks**: Secure lead processing with outbound webhook support.
- **Rate Limiting**: Built-in protection using Redis.
- **Static Asset Serving**: Serves the compiled embed script and uploaded assets.

## 🛠️ Tech Stack

- **Node.js 22+**: Modern JavaScript runtime.
- **Express 5**: The next generation of Express for better performance.
- **Prisma**: Database toolkit for PostgreSQL.
- **Redis**: Fast in-memory data store for rate limiting.
- **JWT**: Stateless authentication for secure dashboard access.

## 📦 API Overview

- `/api/auth`: Login, Signup, and Profile management.
- `/api/popups`: CRUD operations for popup configurations and A/B variants.
- `/api/workspaces`: Manage multi-tenant workspaces.
- `/api/analytics`: Fetch performance metrics for popups.
- `/api/leads`: Access and export captured lead data.
- `/api/embed`: Endpoint for serving the dynamic embed script.

## 🏃 Local Development

1.  **Environment Setup**:
    ```bash
    cp .env.example .env
    # Configure DATABASE_URL and REDIS_URL
    ```

2.  **Database Migration**:
    ```bash
    npm run prisma:generate
    npm run prisma:migrate
    ```

3.  **Start Server**:
    ```bash
    npm run dev
    ```

4.  **Run Tests**:
    ```bash
    npm test
    ```

---

*Powering the PopLayer Ecosystem.*
