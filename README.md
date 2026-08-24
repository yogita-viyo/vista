# VividVista (VIYO) — Hotel & Resort Amenities Catalogue

A fast, lightweight HTML + Alpine.js website for VividVista International (VIYO), a manufacturer and bulk supplier of five-star hotel, resort, and hospital room amenities. Built with zero build step and no `npm install` — Tailwind CSS and Alpine.js load from CDN, content lives in `data/products.json`, and static assets deploy as-is.

**Visual Identity & Design System:** Styled with VIYO's official brand palette (sampled directly from printed catalogue collateral) using cream, dark olive, charcoal, and warm gold section bands. Features a fixed green mega-menu sub-nav, live autocomplete search bar, image protection, and smooth scroll motion (parallax, word-mask reveals, and entrance animations).

## Contents

- [Run locally](#run-locally)
- [Pages](#pages)
- [File structure](#file-structure)
- [Design system & components](#design-system--components)
  - [Header & Live Search](#header--live-search)
  - [Green Sub-Nav Mega-Menu](#green-sub-nav-mega-menu)
  - [Footer](#footer)
  - [Image Protection](#image-protection)
- [Editing content](#editing-content)
  - [Main Categories](#main-categories)
  - [Categories](#categories)
  - [Products](#products)
  - [New Arrivals](#new-arrivals)
  - [Client Logos](#client-logos)
  - [Homepage Hero Banners](#homepage-hero-banners)
- [Category banner images](#category-banner-images)
- [Product photography & galleries](#product-photography--galleries)
- [Inquiry form](#inquiry-form)
- [Deploy](#deploy)

---

## Run locally

Product data and shared components load asynchronously via `fetch()`, which modern web browsers block on local `file://` URLs due to CORS security policies. Serve the project folder over a local HTTP server:

```bash
# Python 3 (built-in on Linux & macOS)
python3 -m http.server 8080

# Node.js (if installed)
npx serve .
```

Then open **`http://localhost:8080`** in your browser.

---

## Pages

| Page | Purpose & Key Features |
|---|---|
| `index.html` | **Homepage.** Full-bleed hero banner carousel, "About Us" brand story preview, core values & differentiators band, operational strength counters, interactive sector applications gallery grid (`js/sector-gallery.js`), featured product collection, client-logo marquee, customer testimonials, and inquiry form. |
| `about.html` | **About Us page.** Full company story, core values, manufacturing strengths, quality certifications, and sector coverage — linked from the homepage's "Read More". |
| `categories.html` | **Category Directory page.** Displays all 38 product categories organized under 4 main category groups (`In Room Amenities`, `In Room Bathroom Amenities`, `In Washroom Amenities`, `Common Lobby Accessories`). Supports filtering to a single group via `?mainCategory=<slug>` (e.g., from Best Sellers), active search filtering, and header banner slider. |
| `category.html?slug=...` | **Category landing page.** Multi-banner image carousel (1-3 WebP images), product card grid, sub-section filter badges, and breadcrumb navigation. `slug` corresponds to any category in `data/products.json`. |
| `product.html?slug=...` | **Product detail page.** Spec table with list formatting, dynamic image gallery with thumbnail switcher (supports single images or multi-angle image arrays), related items by section/category, dynamic SEO title & meta sync (`syncTitle`), and quote request button. |
| `contact.html` | **Contact Us page.** Official corporate address, phone numbers, email addresses, interactive Google Maps location embed, and direct inquiry submission form. |

---

## File structure

```
index.html              — Homepage
about.html               — About Us page
categories.html          — Category Directory page (?mainCategory=... or ?search=...)
category.html            — Category landing page (?slug=...)
product.html             — Product detail page (?slug=...)
contact.html             — Contact Us page

css/viyo-theme.css       — VIYO visual theme tokens (section bands, pill buttons,
                           sub-nav styling, glassmorphism, motion keyframes)
styles.css               — Global base styles, Tailwind utility overrides, font setup

js/config.js             — Corporate config: SITE name, contact details, accent color,
                           Google Sheets Apps Script endpoint URL
js/color-utils.js        — Color tint/glow generator derived from primary accent RGB
js/theme-init.js         — Pre-paint theme initializer (light/dark mode custom properties)
js/header.js             — Shared header component: logo, desktop nav, live search
                           bar with autocomplete, green sub-nav mega-menu, mobile menu
js/footer.js             — Shared footer component: single-row contact info, links, copyright
js/app.js                — Alpine.js state & logic: catalogue data fetch, search filter,
                           category directory, product page gallery, inquiry form handler,
                           reveal-on-scroll, count-up stats
js/motion.js             — Motion system: smooth anchor scroll offset, hero parallax,
                           word-mask heading reveals, magnetic buttons, scroll progress
js/sector-gallery.js     — Interactive curved sector/applications gallery for homepage & about
js/image-protect.js      — Protection script disabling context menu & drag on catalogue images
js/analytics.js          — Google Analytics GA4 auto-loader controlled via SITE.googleAnalyticsId

data/products.json       — Central site database: main categories, 38 categories, 150+ products,
                           client logos, hero banners, and new arrivals

robots.txt, sitemap.xml  — Search engine optimization metadata
```

### Image Asset Folders

```
images/banners/         — Homepage hero carousel slides (banner-1.webp, banner-2.webp, ...)
images/categories/      — Category tile images and wide category banner carousels
images/products/        — High-resolution product photography
images/logos/           — Client/hotel brand logos (trusted-by marquee)
images/site/            — Core site chrome (ISO certification badges, QR codes, icons)
```

---

## Design system & components

Every page shares a unified visual system powered by `css/viyo-theme.css`, `js/header.js`, and `js/footer.js`.

- **Section Bands (`css/viyo-theme.css`):** Built with curated color bands (`.band-cream`, `.band-black`, `.band-olive`, `.band-taupe`). CSS custom properties (`--bg`, `--text-primary`, `--heading-color`, `--glass-bg`) automatically update color context per band.
- **Pill Buttons & Stats:** Styled with `.btn-viyo` and `.viyo-stat-card` for interactive hover micro-animations and warm gold glow effects.
- **Scroll Motion (`js/motion.js`):** Native smooth scrolling with dynamic header offset, scroll-progress bar, hero parallax (`.hero-photo`), and word-mask reveals (`[data-text-reveal]`). Respects `prefers-reduced-motion`.
- **Reveal-on-Scroll & Count-Up (`js/app.js`):** Elements with `data-reveal` animate into view, while `data-count-to="135"` triggers counter animations. Works seamlessly on Alpine dynamically rendered products via `MutationObserver`.

### Header & Live Search

`js/header.js` injects the global header into `<div id="site-header"></div>`:

1. **Header Modes:**
   - **Transparent Overlay:** On pages with full-bleed hero photos (`<body data-header-overlay>`, e.g. `index.html` and `about.html`), floats transparently until scrolled.
   - **Sticky Solid:** On all other pages (`categories.html`, `category.html`, `product.html`, `contact.html`), remains solid and sticky at the top.
2. **Live Fuzzy Autocomplete Search:**
   - Real-time search bar with instant autocomplete predictions dropdown as the user types.
   - Groups matching **Categories** (with direct pill links) and **Products** (with thumbnail, title, and section/category badge).
   - Includes popular search chips (`Kettles`, `RFID Door Locks`, `Minibars`, `Digital Safes`, `Hair Dryers`) when input is empty.
   - Full keyboard support: `ESC` clears/closes dropdown, `Enter` submits full search to `categories.html?search=...`.
3. **Cache Busting:** Maintained via `?v=` version query strings on `<script src="/js/header.js?v=...">` tags.

### Green Sub-Nav Mega-Menu

Positioned directly below the header root, the green sub-nav bar (`.viyo-subnav`) features:
- **"Our Products" Button:** Quick anchor link to the full catalogue section (`/#products`).
- **Main Category Segment Pills:** 4 interactive pills representing the main category groups (`In Room Amenities`, `In Room Bathroom Amenities`, `In Washroom Amenities`, `Common Lobby Accessories`).
- **Hover Dropdown Flyouts:** Hovering any main category pill displays a fixed flyout menu listing all sub-categories inside that group.
- **Horizontal Scroll & Safe Alignment:** Uses `overflow-x: auto` and `justify-[safe_center]` so pills remain centered on wide displays while enabling horizontal scrolling on mobile/tablet viewports without clipping flyouts.

### Footer

`js/footer.js` injects the site footer into `<div id="site-footer"></div>`:
- Displays phone numbers and email addresses on dedicated single rows with lead icons, scaled responsively for mobile screens.
- Includes brand description, quick navigation links, main category links, and legal copyright.

### Image Protection

`js/image-protect.js` runs across catalogue pages to safeguard product photography against right-clicking and drag-and-drop downloading.

---

## Editing content

All catalogue data, categories, main groups, hero banners, and client logos live in **`data/products.json`**.

### Main Categories

The 4 primary catalogue divisions that structure the sub-nav mega-menu and category directory:

```json
"mainCategories": [
  {
    "slug": "in-room-amenities",
    "name": "In Room Amenities",
    "description": "Everything inside the guest room — locks, minibar, safe, kettle, hair dryer and room furniture."
  }
]
```

### Categories

The 38 product categories grouped under `mainCategories`:

```json
"categories": [
  {
    "slug": "minibar",
    "name": "Mini Bar Fridge",
    "mainCategory": "in-room-amenities",
    "description": "Silent, compressor-free thermoelectric minibars for standard and suite-tier guest rooms.",
    "image": "/images/categories/minibar.webp",
    "banners": [
      "/images/categories/minibar-banner-1.webp",
      "/images/categories/minibar-banner-2.webp"
    ]
  }
]
```

- `"mainCategory"`: Must match a valid `slug` from `"mainCategories"`.
- `"image"`: Category card cover image tile.
- `"banners"`: Array of 1 to 3 landscape hero banner image paths for `category.html`.

### Products

Catalogue products listed inside `"products"`:

```json
"products": [
  {
    "slug": "thermoelectric-minibar-vymb0011",
    "name": "Thermoelectric Minibar",
    "category": "minibar",
    "section": "Thermo Electric Minibars",
    "featured": true,
    "shortDescription": "Compressor-free thermoelectric minibar, 30L, cooling to 10-12°C.",
    "description": "A compressor-free thermoelectric minibar with a semi-conductor cooling element...",
    "specs": {
      "Model Code": "VYMB0011",
      "Capacity": "30 Ltr.",
      "Max Cooling": "10° to 12°",
      "Features": "Without compressor, semi conductor, reversible door, built-in LED"
    },
    "image": "/images/products/thermoelectric-minibar-vymb0011-12.webp"
  }
]
```

- `"category"`: Must match a valid category `slug`.
- `"section"` *(optional)*: Groups items into sub-sections on `category.html` and `product.html` (e.g. "Thermo Electric Minibars").
- `"featured"`: `true` includes the item in homepage featured showcases.
- `"specs"`: Key-value dictionary. Values with key `"Features"` formatted as comma-separated strings render automatically as bulleted lists.
- `"image"`: Single image path string (e.g. `"/images/products/item.webp"`) or an array of image paths (e.g. `["/images/products/item-1.webp", "/images/products/item-2.webp"]`) for multi-angle product galleries.

### New Arrivals

Temporary showcase for upcoming items before full catalogue specification:

```json
"newArrivals": [
  {
    "name": "Upcoming Product Name",
    "description": "Short introductory summary displayed on the card.",
    "image": "placeholder"
  }
]
```

### Client Logos

Drives the homepage "Trusted By" client marquee:

```json
"clients": [
  {
    "name": "Taj Hotels",
    "logo": "/images/logos/logo-taj.webp"
  }
]
```

### Homepage Hero Banners

Configures the full-bleed hero slides on `index.html`:

```json
"banners": [
  {
    "eyebrow": "B2B Amenities Catalogue",
    "title": "Quiet luxury, delivered to every room",
    "body": "Curated bath, bedding, minibar and spa essentials for five-star properties...",
    "cta": "Browse Catalogue",
    "href": "#products",
    "image": "/images/banners/banner-1.webp"
  }
]
```

---

## Category banner images

`category.html` supports **1 to 3 wide banner images** that play as a carousel with Ken Burns zoom animation:

- **Dimensions:** Landscape orientation, **~1672×650px** (approx. 16:9 aspect ratio).
- **Framing:** Frame shots wide with products off-center or in room settings. Images render with `object-cover`, so avoid putting critical text near the extreme top/bottom edges.
- **Fallback:** If `"banners": []` is empty, `category.html` defaults to displaying the category's portrait product photo (`"image"`) with a blurred background backdrop.

---

## Product photography & galleries

Products using `"image": "placeholder"` display a stylized vector icon tile.

To add real photography:
1. Place `.webp` images into `images/products/` or `images/categories/`.
2. Update the product's `"image"` property in `data/products.json` from `"placeholder"` to the relative path (or an array of paths for multi-shot gallery thumbnails on `product.html`).

---

## Inquiry form

Form submissions across `index.html`, `product.html`, and `contact.html` process via Alpine.js in `js/app.js`.

The form submits payloads via `fetch()` to your Google Sheets Apps Script Web App endpoint specified in `js/config.js` (`googleSheetAppUrl`). Upon submission, the user receives an instant confirmation toast and clear response feedback.

---

## Cache Control & Asset Versioning

To ensure visitors immediately receive updated content, images, and logic without manual browser hard-refreshes, VividVista uses a multi-layered cache management strategy:

1. **Centralized Version Control Constant (`js/app.js`)**:
   - `const CACHE_VERSION = "v=114";` centralizes cache-busting version strings for `fetch('/data/products.json')` requests and image fallbacks across all dynamic Alpine.js components.
   - When updating data or core assets, increment `CACHE_VERSION` in `js/app.js` and update `?v=` query parameters in HTML script/stylesheet links.

2. **HTML Head Cache-Control Meta Tags**:
   - Every HTML page contains `Cache-Control: no-cache, no-store, must-revalidate` meta tags to prevent browsers from holding stale HTML pages in local memory cache.

3. **Static Host Headers (`_headers`)**:
   - Included in the repository root for Cloudflare Pages, Netlify, and compatible edge networks. Instructs servers to enforce `no-cache` revalidation for HTML and JSON data while caching static scripts/styles with background revalidation.

---

## Deploy

This project consists entirely of static web files (HTML, CSS, JavaScript, WebP images, and JSON). It requires no build step, server runtime, or database setup.

Deploy by copying the root workspace directory directly to any static hosting service or web server:
- **Cloud Hosts:** Vercel, Cloudflare Pages, Netlify, AWS S3 + CloudFront
- **Traditional Servers:** Apache, Nginx, LiteSpeed, Hostinger, cPanel / DirectAdmin

