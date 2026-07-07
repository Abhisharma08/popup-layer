# PopLayer 🚀

PopLayer is a powerful, enterprise-grade Popup & Lead Capture SaaS platform designed to help businesses convert visitors into customers. With a visual drag-and-drop builder, advanced triggering logic, and robust A/B testing, PopLayer provides everything you need to capture leads, announce sales, and reduce exit abandonment.

![PopLayer Dashboard](https://via.placeholder.com/1200x600/4F46E5/FFFFFF?text=PopLayer+SaaS+Platform+Dashboard)

## ✨ Core Features

### 🎨 Visual Popup Builder
*   **Drag-and-Drop Fields**: Support for Text, Email, Phone, Number, Textarea, and Dropdowns.
*   **Premium Templates**: Choose from pre-built templates like Newsletter Signup, Exit Intent, Black Friday Sales, and more.
*   **Side-by-Side Layouts**: Add high-quality imagery next to your forms for better conversion.
*   **Live Preview**: Real-time visualization of your popup as you design it.

### ⚡ Smart Triggers & Logic
*   **Exit Intent**: Catch users right before they leave your site.
*   **Scroll-based**: Trigger popups when a user reaches a certain depth on your page.
*   **Time Delay**: Show offers after a specific duration of engagement.
*   **Frequency Control**: Set popups to show once per session, daily, or only once per user.

### 🧪 Advanced Conversion Optimization
*   **A/B Testing**: Create multiple variants (A/B) to test headlines, colors, and layouts. PopLayer automatically tracks which one performs better.
*   **Webhook Integration**: Send lead data directly to Zapier, HubSpot, or your custom CRM via secure webhooks.
*   **Detailed Analytics**: Monitor impressions, clicks, and conversion rates with beautiful charts.

### 🛠️ Developer-First Integration
*   **Lightweight Embed Script**: A single line of JavaScript integrates PopLayer with any website (WordPress, Shopify, Webflow, or custom HTML).
*   **High Performance**: The embed widget is optimized for zero impact on your site's LCP (Largest Contentful Paint).

---

## 🏗️ Technical Architecture

PopLayer is built with a modern, high-performance stack:

*   **Frontend**: React 19 + Vite 8 + Tailwind CSS 4.
*   **State Management**: Zustand for fast, predictable state updates.
*   **Backend**: Node.js & Express 5 (Next-gen Express).
*   **Database**: PostgreSQL with Prisma ORM for type-safe queries.
*   **Caching & Security**: Redis for high-performance rate limiting and session management.
*   **Analytics**: Recharts for dynamic data visualization.

---

## 🚀 Getting Started

### Prerequisites
*   Docker & Docker Compose
*   Node.js 18+

### Local Docker Setup

1.  **Configure Environment**:
    ```bash
    cp .env.example .env
    ```
    For local Docker use these values:
    ```env
    POSTGRES_PASSWORD="poplayer_local_password"
    JWT_SECRET="poplayer_local_jwt_secret_change_me"
    ALLOW_SIGNUP="true"
    FRONTEND_URL="http://localhost:8080"
    PUBLIC_API_URL="http://localhost:4000/api"
    PUBLIC_EMBED_URL="http://localhost:4000/embed/poplayer.iife.js"
    VITE_API_URL="http://localhost:4000/api"
    VITE_EMBED_URL="http://localhost:4000/embed/poplayer.iife.js"
    ```

2.  **Start the stack**:
    ```bash
    docker compose up -d --build
    ```

3.  **Open the app**:
    Dashboard: `http://localhost:8080`
    API: `http://localhost:4000`
    Health: `http://localhost:4000/health`

4.  **Create the first user**:
    Open `http://localhost:8080/signup`

5.  **Useful Docker commands**:
    ```bash
    docker compose ps
    docker compose logs -f api
    docker compose logs -f web
    docker compose down
    ```

### Local Non-Docker Development

1.  **Create env files**:
    ```bash
    cp backend/.env.example backend/.env
    cp frontend/.env.example frontend/.env
    cp embed/.env.example embed/.env
    ```

2.  **Install dependencies**:
    ```bash
    cd backend && npm install
    cd ../frontend && npm install
    cd ../embed && npm install
    ```

3.  **Run local servers**:
    ```bash
    cd backend && npm run dev
    cd frontend && npm run dev
    ```

---

## 📦 Deployment

PopLayer is containerized and ready for VPS deployment.

1.  Set your production environment variables in the root `.env`.
2.  Run: `docker compose up -d --build`
3.  Access your dashboard at `http://<your-ip>:8080`.

---

## 🛡️ Security
*   **JWT Authentication**: Secure user sessions.
*   **Rate Limiting**: API and public ingestion endpoints are rate limited.
*   **Validation**: Server-side validation is applied to incoming leads and popup configs.
*   **Live Hardening**: Domain allowlisting, webhook delivery logging, webhook retry support, and safer CSV export are included in the current codebase.

## 📄 License
This project is licensed under the ISC License.

---

*Built with ❤️ for high-converting marketing teams.*
