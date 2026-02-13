# Frontend Cleanup Report

This report summarizes the analysis of the `frontend` folder and which files were **kept** vs **moved to backup** (`frontend_backup_unused`). Nothing is deleted permanently.

---

## How to run the cleanup

From the **frontend** folder, run:

```powershell
cd c:\coding\jansoir\frontend
.\run-cleanup.ps1
```

This creates `frontend_backup_unused` and moves all unused files there (preserving relative paths). To undo, move files back from `frontend_backup_unused` into `frontend`.

---

## 1. Files / folders KEPT (actively used)

### Entry & config
- `index.html` – app entry
- `vite.config.js`, `postcss.config.js`, `tailwind.config.js`, `eslint.config.js`
- `package.json`, `package-lock.json`
- `.gitignore`, `vercel.json`

### Source (src/)
- **Entry:** `main.jsx`, `App.jsx`, `index.css`, `App.css`
- **Contexts:** `AuthContext.jsx`, `CartContext.jsx`, `CategoryContext.jsx`, `FavoriteContext.jsx`, `ProductContext.jsx`
- **API:** All files in `api/` (apiConfig, adminApi, analyticsApi, authApi, cartApi, categoryApi, couponApi, customizeApi, favoriteApi, historyApi, orderApi, productApi, settingsApi, shippingApi)
- **Analytics:** `analytics/analyticsClient.js`
- **Localization:** `localization/governorates.js`, `localization/governorates.ar-EG.json`
- **Utils:** `utils/pricing.js`
- **Layout:** `components/layout/Navbar.jsx`, `components/layout/Footer.jsx`
- **Admin:** `components/admin/AdminLayout.jsx`, `components/admin/Sidebar.jsx`
- **Common (used):** `Button.jsx`, `CustomizeButton.jsx`, `FavoriteHeart.jsx`, `GovernorateSelect.jsx`, `Loader.jsx`, `ProductCard.jsx`, `Rating.jsx`, `ScrollManager.jsx`, `SocialMediaBar.jsx`
- **Pages:** All under `pages/` and `pages/admin/` (Home, Products, ProductDetails, Cart, Favorites, Login, Register, Customize; admin: Orders, Categories, AdminProducts, AdminManagement, CartManagement, History, Analytics, Settings, CustomizeRequests)

### Public
- `public/robots.txt`, `public/site.webmanifest`, `public/sitemap.xml`
- **Images in use:**
  - Hero: `hero-section-1-480w.webp`, `hero-section-1-768w.webp`, `hero-section-1-1200w.webp` (and same for 2, 3)
  - Banners: `b-1`, `b-2`, `b-3`, `b-4` (only `-480w.webp`, `-768w.webp`, `-1200w.webp` used)
  - Icons: `icon-title.png`, `icon-title-64.png` (favicon and OG/manifest)

### Scripts
- `scripts/optimize-images.mjs` – kept as a manual utility (not in npm scripts but useful for image optimization).

---

## 2. Files / folders MOVED to backup (unused)

### Root – debug / Lighthouse artifacts (not used by build or app)
- `cls-debug.mjs`, `inject-cls-debug.mjs`, `remove-shell.mjs`
- `lh-*.json` (e.g. lh-cls-fix.json, lh-desktop.json, lh-mobile.json, lh-result.json, …)
- `lighthouse*.json` (e.g. lighthouse-desktop.json, lighthouse.after*.json, lighthouse.home.*.json, …)

### Unused components (never imported)
- `src/components/common/Carousel.jsx`
- `src/components/common/ProductCardSlider.jsx`
- `src/components/common/ProtectedRoute.jsx`

### Unused public assets
- `public/vite.svg` (favicon is `icon-title-64.png`)
- **Images:** `b-1.png`, `b-2.png`, `b-3.png`, `b-4.png` (only .webp variants are used)
- **Images:** `hero-section-1.jpg`, `hero-section-2.jpg`, `hero-section-3.jpg`, `hero-section-3-gg.jpg`, `hero-section-gg.jpg` (only .webp used)
- **Images:** `icon-title-opt.png`, `ChatGPT Image Jan 30, 2026, 09_23_19 PM.png`
- **Folder:** `public/images/New folder/` (duplicates and unused hero/icon files)

---

## 3. Optional: unused npm dependencies

These are **not** removed by the script; removing them is optional and can reduce install size and build time. Only remove after confirming you do not need them:

- `@react-oauth/google` – not imported in `src`
- `@react-three/drei`, `@react-three/fiber`, `@react-three/rapier`, `meshline`, `three` – no 3D usage in `src`
- `lodash.debounce` – debouncing is done manually (e.g. in Navbar); package is unused

To remove (run from `frontend`):

```powershell
npm uninstall @react-oauth/google @react-three/drei @react-three/fiber @react-three/rapier meshline three lodash.debounce
```

---

## 4. Summary counts

| Category              | Kept | Moved to backup |
|-----------------------|------|------------------|
| Root debug/Lighthouse | 0    | 33 files         |
| Unused components     | 0    | 3 files          |
| Unused public images  | 0    | 11 files + 1 folder |
| **Total moved**       |      | **47+ items**    |

All moved items are under `frontend_backup_unused` with the same relative paths as in `frontend`, so you can restore any file or folder if needed.
