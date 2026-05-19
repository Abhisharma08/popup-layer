# PopLayer Embed Widget 🛠️

The PopLayer embed widget is a high-performance, vanilla JavaScript client designed to be injected into any website. It handles triggering logic, rendering the popup UI, and communicating lead data back to the PopLayer API.

## 🚀 Key Features

- **Zero Dependencies**: Pure vanilla JavaScript for maximum compatibility and minimal bundle size.
- **Vite Bundling**: Built into a single IIFE (Immediately Invoked Function Expression) for easy distribution.
- **Smart Triggering**: Handles Exit Intent, Scroll Depth, and Time Delays client-side.
- **Frequency Logic**: Manages cookies/local storage to respect "Once per session" or "Once per user" settings.
- **Responsive Design**: Auto-adapts to mobile and desktop viewports.
- **Analytics Tracking**: Automatically reports impressions and conversions.

## 🛠️ Build Process

The widget is built using Vite to ensure a compact, optimized bundle.

1.  **Installation**:
    ```bash
    npm install
    ```

2.  **Configuration**:
    Set the `VITE_API_URL` in your build environment to point to your production API.

3.  **Build**:
    ```bash
    npm run build
    ```
    This generates `dist/poplayer.iife.js`.

## 📦 Usage

To use PopLayer on a website, include the following script tag:

```html
<script src="https://your-api.com/embed/poplayer.iife.js?siteId=YOUR_SITE_ID" data-site-id="YOUR_SITE_ID"></script>
```

For Google Tag Manager Custom HTML tags, prefer query parameters because GTM can recreate script
tags without preserving custom `data-*` attributes:

```html
<script src="https://your-api.com/embed/poplayer.iife.js?popupId=YOUR_POPUP_ID&apiUrl=https%3A%2F%2Fyour-api.com%2Fapi"></script>
```

---

*Connecting PopLayer to the World.*
