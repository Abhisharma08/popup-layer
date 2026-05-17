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

### Quick Setup

1.  **Clone and Start Infrastructure**:
    ```bash
    docker compose up -d
    ```

2.  **Configure Environment**:
    ```bash
    cp backend/.env.example backend/.env
    # Update values in .env files
    ```

3.  **Install & Build**:
    ```bash
    npm install  # Root install if workspaces are configured, else:
    cd backend && npm install
    cd ../frontend && npm install
    cd ../embed && npm install
    ```

4.  **Database Migration**:
    ```bash
    cd backend
    npm run prisma:generate
    npm run prisma:migrate
    ```

5.  **Run Development Servers**:
    ```bash
    # Terminal 1: Backend
    cd backend && npm run dev
    # Terminal 2: Frontend
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
*   **Rate Limiting**: Integrated Redis-based rate limiting to prevent API abuse.
*   **Validation**: Strict server-side validation of all incoming leads and popup configs.

## 📄 License
This project is licensed under the ISC License.

---

*Built with ❤️ for high-converting marketing teams.*
