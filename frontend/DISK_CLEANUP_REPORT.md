# dist Folder Cleanup Report

This report documents the cleanup of the **build output** folder `dist` (requested as “disk”) in the frontend project.

- All changes are **non-destructive**: files are **moved** to `frontend_backup_disk`, not deleted.
- JS bundles, `.gz`, `.br`, and other hashed build artifacts are **left untouched**.

---

## How to run the cleanup

From the frontend directory:

```powershell
cd c:\coding\jansoir\frontend
.\run-disk-cleanup.ps1
```

If PowerShell blocks script execution in your session:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\run-disk-cleanup.ps1
```

This will:

- Verify that `dist` exists.
- Create `frontend_backup_disk` if needed.
- Move only the unused files listed below into `frontend_backup_disk` (preserving relative paths).

To undo, move any file back from `frontend_backup_disk` to the original location under `dist`.

---

## Scope and assumptions

- “disk” is interpreted as the Vite build output folder **`dist`**.
- Only **original assets** in `dist` (HTML, images, favicon-like files) are analyzed.
- **Ignored / always kept**:
  - `dist/assets/**/*.js` (hashed JS bundles)
  - `dist/**/*.gz`, `dist/**/*.br` (compressed variants)
  - The main `dist/index.html`, `robots.txt`, `site.webmanifest`, `sitemap*.xml`

Used/unused status is based on:

- JS/JSX imports and references in `src/`
- References in `public/` and `index.html`

If a source asset is not referenced anywhere, its built copy in `dist` is treated as unused.

---

## Files kept (relative to project root)

These are required for a normal production build or are transient build artifacts that should not be touched.

### dist root

- `dist/index.html`
- `dist/robots.txt`
- `dist/site.webmanifest`
- `dist/sitemap.xml`, `dist/sitemap.xml.gz`, `dist/sitemap.xml.br`
- All other `dist/*.gz`, `dist/*.br` files

### dist/assets

- All files under `dist/assets/` (JS bundles and their `.gz`/`.br` variants)  
  These are referenced from `dist/index.html` and are essential for the app to run.

### dist/images (kept)

These images are actively used by the application (through `index.html`, `App.jsx`, `Home.jsx`, and other components):

- Hero images:
  - `dist/images/hero-section-1-480w.webp`
  - `dist/images/hero-section-1-768w.webp`
  - `dist/images/hero-section-1-1200w.webp`
  - Same pattern for `hero-section-2-*` and `hero-section-3-*` in `.webp`
- Banner images:
  - `dist/images/b-1-480w.webp`, `dist/images/b-1-768w.webp`, `dist/images/b-1-1200w.webp`
  - Same pattern for `b-2-*`, `b-3-*`, `b-4-*` in `.webp`
- Icons:
  - `dist/images/icon-title.png` (Open Graph / manifest image)
  - `dist/images/icon-title-64.png` (favicon)

---

## Files moved to backup (unused)

These files are **not referenced** by any JS/JSX in `src/`, nor by `public/index.html`, `site.webmanifest`, or other public config files.
They are moved to:

- `frontend_backup_disk/dist/...`

### dist root

- `dist/vite.svg`  
  Vite’s default favicon; the app uses `/images/icon-title-64.png` as favicon and `/images/icon-title.png` for OG/meta, so this is unused.

### dist/images – unused variants and extras

- Duplicate PNG banners (only `.webp` variants are used):
  - `dist/images/b-1.png`
  - `dist/images/b-2.png`
  - `dist/images/b-3.png`
  - `dist/images/b-4.png`

- JPG hero variants and extra images (only `.webp` are referenced):
  - `dist/images/hero-section-1.jpg`
  - `dist/images/hero-section-2.jpg`
  - `dist/images/hero-section-3.jpg`
  - `dist/images/hero-section-3-gg.jpg`
  - `dist/images/hero-section-gg.jpg`

- Unused icon variant:
  - `dist/images/icon-title-opt.png`

- Miscellaneous / temporary asset:
  - `dist/images/ChatGPT Image Jan 30, 2026, 09_23_19 PM.png`

- Entire folder of unused duplicates:
  - `dist/images/New folder/` (and all of its contents)

---

## Suspicious but kept

The following groups of files might look redundant but are intentionally **kept** to avoid breaking the build:

- All `dist/assets/**/*.js`, `.gz`, `.br` – even though names are hashed, they are part of the current build graph and referenced from `dist/index.html`.
- All `dist/*.gz`, `dist/*.br` where the corresponding original file is in use (`index.html`, `sitemap.xml`, etc.).

If you run a new production build (`npm run build`), the `dist` folder will be regenerated and may repopulate some of these assets. You can safely re-run `run-disk-cleanup.ps1` after each build to reapply the same pruning logic.

---

## Safety notes

- No files are deleted; everything is moved under `frontend_backup_disk`.
- All **runtime-critical** assets (HTML, JS bundles, CSS, used images, manifests, robots/sitemap) are untouched.
- Cleaning can be re-applied after future builds.

If you notice something missing in production after running this cleanup, you can restore it by copying the file back from `frontend_backup_disk` to its original location in `dist`.

