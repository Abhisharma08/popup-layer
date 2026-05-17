# PopLayer Dashboard 🎨

This is the frontend application for the PopLayer SaaS platform. It provides a modern, intuitive dashboard for managing workspaces, building popups, and analyzing lead conversion performance.

## 🚀 Key Modules

- **Dashboard**: High-level overview of active popups and recent activity.
- **Popup Builder**: A sophisticated visual editor with template support, A/B testing controls, and live preview.
- **Analytics Engine**: Real-time charts showing impressions, clicks, and conversions using Recharts.
- **Lead Manager**: View, filter, and export leads captured across all your embedded popups.
- **Workspace Settings**: Manage team members, API keys, and global preferences.

## 🛠️ Tech Stack

- **React 19**: The latest React features for a responsive UI.
- **Vite 8**: Ultra-fast build tool and development server.
- **Tailwind CSS 4**: Utility-first styling for a premium aesthetic.
- **Zustand**: Lightweight state management for the popup builder and user sessions.
- **React Router 7**: Robust routing and navigation.
- **Axios**: Promised-based HTTP client for API communication.

## 📦 Project Structure

```text
src/
├── api/          # API client and interceptors
├── components/   # Reusable UI components & Builder parts
├── pages/        # Main route components (Dashboard, Builder, etc.)
├── store/        # Zustand state stores
├── assets/       # Global styles and static assets
└── App.jsx       # Main application entry and routing
```

## 🏃 Local Development

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Setup**:
    Create a `.env` file based on `.env.example`:
    ```env
    VITE_API_URL=http://localhost:4000/api
    VITE_EMBED_URL=http://localhost:4000/embed/poplayer.iife.js
    ```

3.  **Start Dev Server**:
    ```bash
    npm run dev
    ```

4.  **Build for Production**:
    ```bash
    npm run build
    ```

---

*Part of the PopLayer SaaS Ecosystem.*
