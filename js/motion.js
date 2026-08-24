// Motion layer for the "Dolphy-style" pages (index.html, about.html, and any
// future page built the same way) — everything here is additive on top of
// the site-wide reveal-on-scroll / count-up scripts in js/app.js. Skips all
// of it under prefers-reduced-motion instead of just shortening durations.
document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Word-by-word heading reveal --------------------------------------
  // Splits [data-text-reveal] elements into per-word masked spans BEFORE
  // js/app.js's IntersectionObserver evaluates them, so when it adds
  // .is-visible the CSS in viyo-theme.css has individual words to animate
  // instead of one flat block of text.
  document.querySelectorAll("[data-text-reveal]").forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words
      .map(
        (word, i) =>
          `<span class="word-mask"><span class="word-inner" style="transition-delay:${(i * 0.05).toFixed(2)}s">${word}</span></span>`
      )
      .join(" ");
  });

  if (reduceMotion) return;

  // ---- Smooth scroll (native — no Lenis) ----------------------------------
  // Lenis was pulled out entirely: it intercepts wheel/touch input on the
  // main thread to drive its own JS animation, which meant scrolling was
  // only ever as responsive as the main thread happened to be — right after
  // the catalog's products.json fetch resolves, Alpine builds the whole
  // homepage's dynamic content in one synchronous burst, and any scrolling
  // attempted during that burst got stuck behind it. Plain native scrolling
  // (behavior: "smooth" for anchor links, instant native scroll for
  // wheel/touch/drag) is compositor-driven and doesn't have that problem —
  // less inertia flourish, but it can't hang.
  //
  // The offset is read from the actual <header> height at scroll time
  // (rather than a guessed constant) so it's correct whether the header is
  // in its taller unscrolled state or the shorter scrolled one, and stays
  // correct if the header's height ever changes. CSS scroll-margin-top
  // (see css/viyo-theme.css) gives native jumps a reasonable default
  // offset even before this runs.
  // The +50 (not just a small buffer) absorbs layout still settling from
  // images loading in above the target while a smooth scroll is mid-flight
  // — the target's position is computed once at click time, so if it drifts
  // slightly by the time the animation finishes, this margin keeps the
  // section heading from ending up partly behind the header instead of
  // requiring a second, more complex re-correction pass.
  const headerOffset = () => (document.querySelector("header")?.offsetHeight || 0) + 50;

  const scrollToTarget = (target, immediate = false) => {
    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset();
    window.scrollTo({ top, behavior: immediate ? "auto" : "smooth" });
  };

  // Same-page hash links ("#products" or "/#products" while already on "/")
  // — animate smoothly with the dynamic header offset instead of the
  // browser's instant default jump. Links to a hash on a *different* page
  // (e.g. "/#inquire" clicked from about.html) are left alone — those are
  // real navigations.
  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href*="#"]');
    if (!link) return;
    const url = new URL(link.href, window.location.href);
    if (url.pathname !== window.location.pathname || !url.hash) return;
    const target = document.querySelector(url.hash);
    if (!target) return;
    event.preventDefault();
    scrollToTarget(target);
    history.pushState(null, "", url.hash);
  });

  // Landed on this page with a hash already in the URL. The browser's own
  // instant jump (CSS scroll-margin-top-aware) already happened before this
  // ran, so this is a precision correction using the real, current header
  // height rather than the CSS default.
  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) scrollToTarget(target, true);
  }

  // ---- Parallax --------------------------------------------------------
  const parallaxEls = document.querySelectorAll(".hero-parallax");
  const updateParallax = () => {
    parallaxEls.forEach((el) => {
      const rect = el.parentElement.getBoundingClientRect();
      el.style.transform = `translateY(${rect.top * 0.22}px)`;
    });
  };

  const updateScrollEffects = () => {
    if (parallaxEls.length) updateParallax();
  };
  updateScrollEffects();

  // rAF-throttled so the getBoundingClientRect() read in updateParallax
  // (forces a layout recalc) happens at most once per animation frame,
  // instead of once per raw scroll event.
  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateScrollEffects();
        ticking = false;
      });
    },
    { passive: true }
  );

  // ---- Magnetic pill buttons ----------------------------------------------
  document.querySelectorAll(".btn-viyo").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const relX = e.clientX - rect.left - rect.width / 2;
      const relY = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${relX * 0.25}px, ${relY * 0.3}px) scale(1.04)`;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "";
    });
  });

  // ---- Cursor spotlight on full-bleed photo sections -----------------------
  document.querySelectorAll(".hero-photo").forEach((img) => {
    const section = img.closest("section");
    if (!section) return;
    section.style.position = section.style.position || "relative";
    const glow = document.createElement("div");
    glow.className = "cursor-glow";
    section.appendChild(glow);
    section.addEventListener("mousemove", (e) => {
      const rect = section.getBoundingClientRect();
      glow.style.left = `${e.clientX - rect.left}px`;
      glow.style.top = `${e.clientY - rect.top}px`;
      glow.style.opacity = "1";
    });
    section.addEventListener("mouseleave", () => {
      glow.style.opacity = "0";
    });
  });
});
