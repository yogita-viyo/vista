// Lightweight scroll-reveal: fades/lifts any [data-reveal] element into place
// the first time it enters the viewport. Independent of Alpine's lifecycle
// (works whether the element started hidden behind x-cloak or not) so it's
// safe to sprinkle onto static sections across any page.
//
// A MutationObserver watches for [data-reveal] elements added *after* this
// runs — e.g. product/category/testimonial cards rendered by an Alpine
// x-for once its async fetch resolves, which happens after DOMContentLoaded
// and would otherwise never get picked up by a single querySelectorAll pass.
// This is what makes per-card stagger delays on dynamically-rendered grids
// actually animate instead of just snapping into place already visible.
document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const observer = reduceMotion
    ? null
    : new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.01, rootMargin: "50px 0px 50px 0px" }
      );

  const reveal = (el) => {
    if (reduceMotion) {
      el.classList.add("is-visible");
    } else {
      observer.observe(el);
    }
  };

  document.querySelectorAll("[data-reveal]").forEach(reveal);

  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.matches?.("[data-reveal]")) reveal(node);
        node.querySelectorAll?.("[data-reveal]").forEach(reveal);
      });
    }
  }).observe(document.body, { childList: true, subtree: true });
});

// Count-up stat numbers: any element with [data-count-to="135"] animates from 0 up
// to that value (with an optional [data-count-suffix]) the first time it scrolls
// into view. Runs once per element, independent of Alpine.
document.addEventListener("DOMContentLoaded", () => {
  const counters = document.querySelectorAll("[data-count-to]");
  if (!counters.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const animateCount = (el) => {
    const target = parseInt(el.dataset.countTo, 10);
    const suffix = el.dataset.countSuffix || "";
    if (reduceMotion || Number.isNaN(target)) {
      el.textContent = `${target}${suffix}`;
      return;
    }
    const duration = 1600;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = `${Math.round(eased * target)}${suffix}`;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((el) => observer.observe(el));
});

// Homepage variants that carry their own on-page anchors (#products, #about,
// #inquire) distinct from the default index.html — a "back to catalogue"
// style link on category.html/product.html needs to know which one sent the
// visitor here. Keep this in sync with the actual index*.html files present.
const HOMEPAGE_VARIANTS = [];

const CACHE_VERSION = "v=114";

// A product's `image` field is normally a single path, but can be an array
// (e.g. two colour variants) when the product detail page shows more than
// one shot. Card grids and thumbnails everywhere else only ever need one
// representative image, so they all pull it through this helper.
function firstImage(image) {
  const img = Array.isArray(image) ? image[0] : image;
  if (!img || img === "placeholder") return img;
  return img.includes("?") ? img : `${img}?${CACHE_VERSION}`;
}
function hasRealImage(image) {
  const img = firstImage(image);
  return Boolean(img) && img !== "placeholder";
}

// SEO: updates title, meta description, canonical link, and OG/Twitter tags
// to match dynamically-loaded content (a specific product or category). The
// static tags in each page's <head> are just a fallback for the instant
// before this runs and for crawlers that don't execute JS. Domain is
// hardcoded to match the <head> fallbacks — update both if it ever changes.
const SITE_ORIGIN = "https://www.viyoindia.com";
function updateSeoTags({ title, description, path, image, jsonLd }) {
  document.title = title;
  const setAttr = (selector, attr, value) => {
    const el = document.querySelector(selector);
    if (el) el.setAttribute(attr, value);
  };
  const url = `${SITE_ORIGIN}${path}`;
  setAttr('meta[name="description"]', "content", description);
  setAttr('link[rel="canonical"]', "href", url);
  setAttr('meta[property="og:title"]', "content", title);
  setAttr('meta[property="og:description"]', "content", description);
  setAttr('meta[property="og:url"]', "content", url);
  setAttr('meta[name="twitter:title"]', "content", title);
  setAttr('meta[name="twitter:description"]', "content", description);
  if (image) {
    const imageUrl = image.startsWith("http") ? image : `${SITE_ORIGIN}${image}`;
    setAttr('meta[property="og:image"]', "content", imageUrl);
    setAttr('meta[name="twitter:image"]', "content", imageUrl);
  }
  if (jsonLd) {
    let script = document.querySelector('script[data-dynamic-seo-jsonld]');
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-dynamic-seo-jsonld', 'true');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd, null, 2);
  }
}

document.addEventListener("alpine:init", () => {
  // Header: scroll state, dark/light toggle, and the "Our Products" mega
  // dropdown (main categories + their subcategories). Fetches its own copy
  // of products.json — the header is a sibling of whichever page component
  // owns the "real" fetch (catalog/categoryPage/productPage), and the
  // browser cache makes a second request effectively free.
  Alpine.data("siteHeader", () => ({
    scrolled: false,
    dark: false,
    mainCategories: [],
    categories: [],
    allProducts: [],
    mobileMenuOpen: false,
    searchOpen: false,
    searchQuery: "",
    isFocused: false,

    get searchResults() {
      const q = this.searchQuery.trim();
      if (!q) return { products: [], categories: [], totalProducts: 0 };
      const matchedProducts = this.allProducts.filter((p) => matchText(p.name, q));
      const matchedCategories = this.categories.filter((c) => matchText(c.name, q));
      return {
        products: matchedProducts.slice(0, 4),
        totalProducts: matchedProducts.length,
        categories: matchedCategories.slice(0, 2),
      };
    },

    firstImage(img) {
      return firstImage(img);
    },

    submitSearch(customQuery) {
      const query = (customQuery !== undefined ? customQuery : this.searchQuery).trim();
      if (!query) return;
      const isCategories = location.pathname.endsWith("/categories.html");
      if (isCategories) {
        window.dispatchEvent(new CustomEvent("header:search", { detail: query }));
      } else {
        window.location.href = `/categories.html?search=${encodeURIComponent(query)}`;
      }
      this.searchOpen = false;
      this.isFocused = false;
      this.mobileMenuOpen = false;
    },
    // Only pages with a full-bleed photo hero (marked via
    // <body data-header-overlay>) get the transparent-over-photo header
    // state — everywhere else (category/product pages, no hero photo to
    // sit on) the header is always solid, so white-on-white text can't happen.
    overlayCapable: document.body.hasAttribute("data-header-overlay"),
    init() {
      const savedMode = localStorage.getItem("aurelia-theme") || "light";
      this.dark = savedMode === "dark";
      document.documentElement.setAttribute("data-theme", savedMode);

      // rAF-throttled scroll listener
      let ticking = false;
      window.addEventListener(
        "scroll",
        () => {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(() => {
            this.scrolled = window.scrollY > 20;
            ticking = false;
          });
        },
        { passive: true }
      );
      fetch(`/data/products.json?${CACHE_VERSION}`)
        .then((res) => res.json())
        .then((data) => {
          this.mainCategories = data.mainCategories || [];
          this.categories = data.categories || [];
          this.allProducts = data.products || [];
        })
        .catch((e) => console.error("Failed to load categories:", e));
    },
    categoriesFor(mainCategorySlug) {
      return this.categories.filter((c) => c.mainCategory === mainCategorySlug);
    },
    toggleTheme() {
      this.dark = !this.dark;
      const mode = this.dark ? "dark" : "light";
      localStorage.setItem("aurelia-theme", mode);
      document.documentElement.setAttribute("data-theme", mode);
      if (window.ColorUtils && typeof SITE !== "undefined" && SITE.theme) {
        window.ColorUtils.applyAccentTheme(document.documentElement.style, SITE.theme.accentColor, mode);
      }
    },
  }));

function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function matchText(text, query) {
  if (!text || !query) return false;
  const cleanText = String(text).toLowerCase();
  const cleanQuery = String(query).toLowerCase().trim();
  if (!cleanQuery) return false;

  // Exact or direct substring match
  if (cleanText.includes(cleanQuery)) return true;

  // Compact match (ignoring spaces & hyphens for terms like "mini bar" vs "minibar")
  const compactText = cleanText.replace(/[\s\-_]+/g, "");
  const compactQuery = cleanQuery.replace(/[\s\-_]+/g, "");
  if (compactQuery.length >= 3 && compactText.includes(compactQuery)) return true;

  const queryWords = cleanQuery.split(/\s+/).filter((w) => w.length > 0);
  const textWords = cleanText.split(/[\s,.\-\/()]+/).filter((w) => w.length > 0);

  return queryWords.every((qW) => {
    // Check if query word is a substring of cleanText or compactText
    if (cleanText.includes(qW)) return true;
    const compactQW = qW.replace(/[\s\-_]+/g, "");
    if (compactQW.length >= 3 && compactText.includes(compactQW)) return true;

    return textWords.some((tW) => {
      // Target word starts with query word or contains it
      if (tW.includes(qW)) return true;
      // Fuzzy match for query words of length >= 4 with similar length target word
      if (qW.length >= 4 && Math.abs(qW.length - tW.length) <= 2) {
        const maxDist = qW.length <= 5 ? 1 : 2;
        if (levenshtein(qW, tW) <= maxDist) return true;
      }
      return false;
    });
  });
}

  // Catalog grid: fetches products.json, handles category filtering
  Alpine.data("catalog", () => ({
    loading: true,
    mainCategories: [],
    categories: [],
    products: [],
    banners: [],
    clients: [],
    get displayClients() {
      if (this.clients && this.clients.length) return this.clients;
      return [
        { name: 'Taj', logo: '/images/logos/logo-taj.webp' },
        { name: 'Lemon Tree Premier', logo: '/images/logos/logo-lemon-tree-premier.webp' },
        { name: 'Radisson Blu', logo: '/images/logos/logo-radisson-blu.webp' },
        { name: 'Hyatt', logo: '/images/logos/logo-hyatt.webp' },
        { name: 'Hilton', logo: '/images/logos/logo-hilton.webp' },
        { name: 'Marriott', logo: '/images/logos/logo-marriott.webp' },
        { name: 'The Park Hotels', logo: '/images/logos/logo-the-park-hotels.webp' },
        { name: 'IHG', logo: '/images/logos/logo-ihg.webp' }
      ];
    },
    newArrivals: [],
    activeCategory: "all",
    bannerIndex: 0,
    searchQuery: "",
    bestSellerModal: null,

    // "The VIYO Collection" homepage section (see
    // design_handoff_viyo_collection/README.md) — a featured product card
    // plus a 5-item strip; clicking a strip item swaps it into the featured
    // slot. Keyed by exact product slug (not category) since some categories
    // have several SKUs (e.g. minibar has 5) and the featured copy/specs must
    // match the specific homepage photo shown. Name/description/specs are
    // pulled live from `products` below via activeCollectionProduct — only
    // the caption, dedicated homepage photo, and category eyebrow are
    // hardcoded here, since the eyebrow copy ("In-Room Minibar", "Lobby &
    // Queue Systems", ...) is design-specific marketing copy from the
    // handoff, not the site's actual category names (categoryName() would
    // return "Mini Bar Fridge" etc. instead).
    activeCollectionSlug: "digital-safe-locker-vydsl0021",
    viyoCollectionItems: [
      { slug: "thermoelectric-minibar-vymb0011", caption: "Thermoelectric Minibar", eyebrow: "In-Room Minibar", image: "/images/home_page_viyo_collections/minibar.webp" },
      { slug: "queue-manager-ribbon-silver-vyqm0161", caption: "Queue Manager", eyebrow: "Lobby & Queue Systems", image: "/images/home_page_viyo_collections/queue_manager.webp" },
      { slug: "digital-safe-locker-vydsl0021", caption: "Safe Locker", eyebrow: "In-Room Security", image: "/images/home_page_viyo_collections/safe_locker.webp" },
      { slug: "hand-dryer-vyhand0081", caption: "Hand Dryer", eyebrow: "Washroom Fixtures", image: "/images/home_page_viyo_collections/hand_dryer.webp" },
      { slug: "shoe-polish-machine-vyssm0166", caption: "Shoe Polisher", eyebrow: "Guest Services", image: "/images/home_page_viyo_collections/shoe_shinner.webp" }
    ],

    get activeCollectionItem() {
      return this.viyoCollectionItems.find((i) => i.slug === this.activeCollectionSlug);
    },

    get activeCollectionProduct() {
      return this.products.find((p) => p.slug === this.activeCollectionSlug);
    },

    get collectionStripItems() {
      return this.viyoCollectionItems.filter((i) => i.slug !== this.activeCollectionSlug);
    },

    // categories.html can be scoped to a single main category via
    // ?mainCategory=<slug> — used by the Best Sellers quick-view modal's
    // "View Details" link so clicking the Minibar panel, say, lands on just
    // "In Room Amenities" instead of the full 5-group directory. Read
    // straight from location.search (not a stored/reactive property) since
    // it never changes without a full navigation on this page.
    get selectedMainCategorySlug() {
      return new URLSearchParams(window.location.search).get("mainCategory") || "";
    },

    get visibleMainCategories() {
      let list = this.mainCategories;
      if (this.selectedMainCategorySlug) {
        list = list.filter((mc) => mc.slug === this.selectedMainCategorySlug);
      }
      if (this.searchQuery.trim()) {
        list = list.filter((mc) => this.categoriesFor(mc.slug).length > 0);
      }
      return list;
    },

    get categoriesPageBanners() {
      const targetMainCategories = this.visibleMainCategories;
      const targetMainCatSlugs = targetMainCategories.map((mc) => mc.slug);
      const matchingCategories = this.categories.filter((c) => targetMainCatSlugs.includes(c.mainCategory));

      const bannerList = [];
      matchingCategories.forEach((cat) => {
        if (Array.isArray(cat.banners)) {
          cat.banners.forEach((b) => {
            if (b && !bannerList.includes(b)) {
              bannerList.push(b.includes("?") ? b : `${b}?${CACHE_VERSION}`);
            }
          });
        }
      });

      if (!bannerList.length) {
        bannerList.push(`/images/products/hotel-rfid-door-lock-vylgm0001-02.webp?${CACHE_VERSION}`);
      }
      return bannerList;
    },



    firstImage(image) {
      return firstImage(image);
    },

    categoriesFor(mainCategorySlug) {
      const cats = this.categories.filter((c) => c.mainCategory === mainCategorySlug);
      const query = this.searchQuery.trim();
      if (!query) return cats;
      return cats.filter((cat) => {
        const nameMatch = matchText(cat.name, query);
        const hasMatchingProduct = this.products.some(
          (p) => p.category === cat.slug && matchText(p.name, query)
        );
        return nameMatch || hasMatchingProduct;
      });
    },

    // Most categories don't have a dedicated category.image yet (still
    // "placeholder") — falls back to the first real product photo in that
    // category instead, so category card grids (categories.html) show an
    // actual product instead of a plain monogram tile wherever possible.
    categoryImage(categorySlug) {
      const category = this.categories.find((c) => c.slug === categorySlug);
      if (category && hasRealImage(category.image)) return firstImage(category.image);
      const product = this.products.find((p) => p.category === categorySlug && hasRealImage(p.image));
      return product ? firstImage(product.image) : null;
    },

    // Homepage shows only a curated handful (data/products.json products[].featured)
    // so the grid doesn't dump the entire catalogue — the rest is one click away via
    // the category tiles/pills. Falls back to the first 8 products if none are flagged.
    // Photographed products are sorted first — most of the catalogue is still
    // "placeholder" pending real photography, and a showcase grid that opens
    // with real photos reads far better than one that opens with letter tiles.
    get featuredProducts() {
      const featured = this.products.filter((p) => p.featured);
      const pool = featured.length ? featured : this.products.slice(0, 8);
      return [...pool].sort((a, b) => Number(hasRealImage(b.image)) - Number(hasRealImage(a.image)));
    },

    get searchedProducts() {
      const query = this.searchQuery.trim();
      if (!query) return [];
      return this.products.filter((p) => matchText(p.name, query));
    },

    async init() {
      // Search from the header (any page) lands here as /?search=...#products
      // — pick the query up before the fetch even starts so the grid opens
      // pre-filtered instead of flashing the full list first.
      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get("search");
      if (searchParam) this.searchQuery = searchParam;

      // Already on the homepage — header search dispatches this instead of
      // a full navigation, so update + re-scroll without a reload.
      window.addEventListener("header:search", (event) => {
        this.searchQuery = event.detail;
        this.$nextTick(() => {
          const target = document.getElementById("products");
          if (!target) return;
          const headerOffset = (document.querySelector("header")?.offsetHeight || 0) + 20;
          const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset;
          window.scrollTo({ top: targetTop, behavior: "smooth" });
        });
      });

      try {
        const res = await fetch(`/data/products.json?${CACHE_VERSION}`);
        const data = await res.json();
        this.mainCategories = data.mainCategories || [];
        this.categories = data.categories;
        this.products = data.products;
        this.banners = data.banners || [];
        this.clients = data.clients || [];
        this.newArrivals = data.newArrivals || [];
      } catch (e) {
        console.error("Failed to load products:", e);
      } finally {
        this.loading = false;
        // The catalog grid is x-cloak'd until this fetch resolves, so a
        // #products or #inquire link followed here lands before the grid
        // expands and pushes everything below it down — the browser's
        // native anchor jump ends up scrolled short. Re-jump once the grid
        // has its real height.
        this.$nextTick(() => {
          if (window.location.hash === "#products" || window.location.hash === "#inquire") {
            const target = document.getElementById(window.location.hash.slice(1));
            if (!target) return;
            const headerOffset = (document.querySelector("header")?.offsetHeight || 0) + 20;
            const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset;
            window.scrollTo({ top: targetTop });
          }
        });
      }
    },

    get visibleProducts() {
      if (this.activeCategory === "all") return this.products;
      return this.products.filter((p) => p.category === this.activeCategory);
    },



    categoryName(slug) {
      const cat = this.categories.find((c) => c.slug === slug);
      return cat ? cat.name : slug;
    },

    // Best Sellers accordion quick-view — clicking a panel opens this instead
    // of navigating straight to the product page; "View Details" inside is
    // the real link. Locks page scroll while open since this is the only
    // modal on the homepage and nothing else manages body overflow.
    openBestSellerModal(product) {
      this.bestSellerModal = product;
      document.body.style.overflow = "hidden";
    },

    closeBestSellerModal() {
      this.bestSellerModal = null;
      document.body.style.overflow = "";
    },

    // `length` lets pages cycle a different list than `categories` (e.g.
    // index.html's fixed-length banner carousel) — defaults to categories.length.
    bannerNext(length) {
      const total = length ?? (this.categories.length || this.categoriesPageBanners?.length || 0);
      if (!total) return;
      this.bannerIndex = (this.bannerIndex + 1) % total;
    },

    bannerPrev(length) {
      const total = length ?? this.categories.length;
      if (!total) return;
      this.bannerIndex = (this.bannerIndex - 1 + total) % total;
    },
  }));

  // Inquiry form: submits to /api/inquiry (Cloudflare Pages Function)
  Alpine.data("inquiryForm", () => ({
    submitting: false,
    success: false,
    error: false,
    form: { name: "", email: "", phone: "", product: "", message: "", website: "" },
    errors: { name: "", email: "", phone: "" },
    // "Product of Interest" is a custom multi-select (see markup) — selectedProducts
    // drives the UI, form.product (comma-joined) is what actually submits to Netlify.
    selectedProducts: [],
    productSearch: "",
    productDropdownOpen: false,

    init() {
      const params = new URLSearchParams(window.location.search);
      const product = params.get("product");
      if (product) {
        this.selectedProducts = [product];
        this.form.product = product;
      }
    },

    toggleProduct(name) {
      const index = this.selectedProducts.indexOf(name);
      if (index === -1) this.selectedProducts.push(name);
      else this.selectedProducts.splice(index, 1);
      this.form.product = this.selectedProducts.join(", ");
    },

    validate() {
      this.errors = { name: "", email: "", phone: "" };

      // Name validation
      if (!this.form.name.trim()) {
        this.errors.name = "Please enter your full name.";
      }

      // Strict Email validation
      const email = this.form.email.trim();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!email) {
        this.errors.email = "Please enter your email address.";
      } else if (!emailRegex.test(email) || email.includes("..") || email.endsWith(".")) {
        this.errors.email = "Please enter a valid email address (e.g. name@company.com).";
      }

      // Indian Phone Number validation
      const phone = this.form.phone.trim();
      if (phone) {
        let digits = phone.replace(/\D/g, "");
        if (digits.startsWith("91") && digits.length === 12) {
          digits = digits.slice(2);
        } else if (digits.startsWith("0") && digits.length === 11) {
          digits = digits.slice(1);
        }

        const isIndianMobile = /^[6-9]\d{9}$/.test(digits);
        if (!isIndianMobile) {
          this.errors.phone = "Please enter a valid 10-digit Indian mobile number (e.g. +91 98765 43210).";
        }
      }

      return !this.errors.name && !this.errors.email && !this.errors.phone;
    },

    async submit() {
      if (!this.validate()) return;

      this.submitting = true;
      this.error = false;

      try {
        if (typeof SITE === "undefined" || !SITE.googleSheetAppUrl) {
          throw new Error("Google Sheets Web App URL is not configured in SITE config.");
        }

        await fetch(SITE.googleSheetAppUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ ...this.form, submittedAt: new Date().toISOString() }),
        });

        this.success = true;
        this.form = { name: "", email: "", phone: "", product: "", message: "" };
        this.selectedProducts = [];
        this.errors = { name: "", email: "", phone: "" };
      } catch (e) {
        console.error("Form submission failed:", e);
        this.error = true;
      } finally {
        this.submitting = false;
      }
    },
  }));

  // Product detail page: reads ?slug= from URL, finds the product, loads related items
  Alpine.data("productPage", () => ({
    loading: true,
    notFound: false,
    product: null,
    category: null,
    related: [],
    // Which homepage variant the visitor arrived from (or "" for default index.html)
    // — carried forward so links return to the right homepage variant if configured.
    home: "",

    async init() {
      const params = new URLSearchParams(window.location.search);
      const slug = params.get("slug");
      const home = params.get("home");
      if (HOMEPAGE_VARIANTS.includes(home)) this.home = home;

      try {
        const res = await fetch(`/data/products.json?${CACHE_VERSION}`);
        const data = await res.json();

        const product = data.products.find((p) => p.slug === slug);
        if (!product) {
          this.notFound = true;
          this.loading = false;
          return;
        }

        this.product = product;
        this.category = data.categories.find((c) => c.slug === product.category) || null;

        // Prioritize products from the exact same section first, then backfill from category
        const sameSection = product.section
          ? data.products.filter(
              (p) => p.category === product.category && p.section === product.section && p.slug !== product.slug
            )
          : [];

        const otherCategoryProducts = data.products.filter(
          (p) => p.category === product.category && p.slug !== product.slug && (!product.section || p.section !== product.section)
        );

        this.related = [...sameSection, ...otherCategoryProducts].slice(0, 4);

        this.$nextTick(() => {
          const img = hasRealImage(product.image) ? firstImage(product.image) : null;
          const fullImgUrl = img ? (img.startsWith("http") ? img : `${SITE_ORIGIN}${img}`) : undefined;
          updateSeoTags({
            title: `${product.name} — ${SITE.name}`,
            description: product.shortDescription || product.description,
            path: `/product.html?slug=${product.slug}`,
            image: img,
            jsonLd: {
              "@context": "https://schema.org/",
              "@type": "Product",
              "name": product.name,
              "image": fullImgUrl ? [fullImgUrl] : undefined,
              "description": product.shortDescription || product.description,
              "brand": {
                "@type": "Brand",
                "name": SITE.name
              },
              "offers": {
                "@type": "AggregateOffer",
                "priceCurrency": "INR",
                "availability": "https://schema.org/InStock",
                "seller": {
                  "@type": "Organization",
                  "name": SITE.fullName || SITE.name
                }
              }
            }
          });
        });
      } catch (e) {
        console.error("Failed to load product:", e);
        this.notFound = true;
      } finally {
        this.loading = false;
      }
    },

    specEntries() {
      return this.product && this.product.specs ? Object.entries(this.product.specs) : [];
    },

    get relatedSectionTitle() {
      if (this.product && this.product.section) {
        return this.product.section;
      }
      return this.category ? this.category.name : "this collection";
    },

    // product.image is normally a single path; normalized here to a flat,
    // placeholder-free list so the gallery can treat one image and several
    // the same way (a single-item list just renders with no thumbnail row).
    get images() {
      if (!this.product) return [];
      const list = Array.isArray(this.product.image) ? this.product.image : [this.product.image];
      return list.filter((img) => img && img !== "placeholder");
    },

    get homeHref() {
      return this.home ? `/${this.home}.html` : "/";
    },

    get catalogueHref() {
      return `${this.homeHref}#products`;
    },

    get inquireHref() {
      const productName = this.product ? encodeURIComponent(this.product.name) : "";
      return `/contact.html?product=${productName}#inquire`;
    },

    relatedHref(slug) {
      const homeParam = this.home ? `&home=${this.home}` : "";
      return `/product.html?slug=${slug}${homeParam}`;
    },
  }));

  // Category landing page: reads ?slug= (+ optional &home=) from the URL,
  // shows that category's banner + its products. Switching categories via
  // the pill row updates the URL in place (no reload) so it stays smooth.
  Alpine.data("categoryPage", () => ({
    loading: true,
    notFound: false,
    categories: [],
    allProducts: [],
    activeSlug: "",
    home: "",
    bannerIndex: 0,

    async init() {
      const params = new URLSearchParams(window.location.search);
      const slug = params.get("slug");
      const home = params.get("home");
      if (HOMEPAGE_VARIANTS.includes(home)) this.home = home;

      try {
        const res = await fetch(`/data/products.json?${CACHE_VERSION}`);
        const data = await res.json();
        this.categories = data.categories || [];
        this.allProducts = data.products || [];

        const match = this.categories.find((c) => c.slug === slug);
        if (!match) {
          this.notFound = true;
          this.loading = false;
          return;
        }
        this.activeSlug = slug;
        this.syncTitle();
      } catch (e) {
        console.error("Failed to load category:", e);
        this.notFound = true;
      } finally {
        this.loading = false;
      }
    },

    get category() {
      return this.categories.find((c) => c.slug === this.activeSlug) || null;
    },

    get visibleProducts() {
      return this.allProducts.filter((p) => p.category === this.activeSlug);
    },

    // Groups visibleProducts by their optional `section` field (e.g. "Foldable
    // Ironing Table" vs "Iron Board Hanger" within the Iron Board Stand category),
    // preserving first-seen section order. Products with no section fall back to
    // the category's own name, so every group — even a single-product category —
    // always renders with a title banner.
    get groupedProducts() {
      const groups = [];
      const groupsBySection = new Map();
      const fallbackTitle = this.category ? this.category.name : "";
      for (const product of this.visibleProducts) {
        const sectionKey = product.section || fallbackTitle;
        let group = groupsBySection.get(sectionKey);
        if (!group) {
          group = { section: sectionKey, products: [] };
          groupsBySection.set(sectionKey, group);
          groups.push(group);
        }
        group.products.push(product);
      }
      return groups;
    },

    // 1-3 dedicated wide banner images for the active category (data/products.json
    // categories[].banners). Empty until a category has been given real banner art —
    // the template falls back to the portrait product photo when this is empty.
    get bannerImages() {
      const banners = this.category && Array.isArray(this.category.banners) ? this.category.banners : [];
      return banners.map((b) => (b ? (b.includes("?") ? b : `${b}?${CACHE_VERSION}`) : b));
    },

    bannerNext() {
      const total = this.bannerImages.length;
      if (!total) return;
      this.bannerIndex = (this.bannerIndex + 1) % total;
    },

    bannerPrev() {
      const total = this.bannerImages.length;
      if (!total) return;
      this.bannerIndex = (this.bannerIndex - 1 + total) % total;
    },

    syncTitle() {
      if (!this.category) return;
      this.$nextTick(() => {
        updateSeoTags({
          title: `${this.category.name} — ${SITE.name}`,
          description: this.category.description || SITE.description,
          path: `/category.html?slug=${this.category.slug}`,
          image: this.category.image !== "placeholder" ? this.category.image : null,
          jsonLd: {
            "@context": "https://schema.org/",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": SITE_ORIGIN
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Categories",
                "item": `${SITE_ORIGIN}/categories.html`
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": this.category.name,
                "item": `${SITE_ORIGIN}/category.html?slug=${this.category.slug}`
              }
            ]
          }
        });
      });
    },

    get homeHref() {
      return this.home ? `/${this.home}.html` : "/";
    },

    get catalogueHref() {
      return `${this.homeHref}#products`;
    },

    get inquireHref() {
      return `${this.homeHref}#inquire`;
    },

    productHref(slug) {
      const homeParam = this.home ? `&home=${this.home}` : "";
      return `/product.html?slug=${slug}${homeParam}`;
    },
  }));
});
