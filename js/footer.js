// Single source of truth for the site footer, injected into the
// `#site-footer` placeholder present on every page — mirrors js/header.js.
// Kept as a plain (non-deferred) script so it runs immediately where the
// placeholder sits, before the deferred Alpine bundle initializes
// `x-data` on the injected markup.
//
// homeHref: category.html/product.html need to know which homepage variant
// sent the visitor here (see HOMEPAGE_VARIANTS in js/app.js) so "back to
// catalogue"-style links return to the right place instead of always
// defaulting to "/". On index.html/about.html this just resolves to "/",
// which is what they want anyway.
document.getElementById("site-footer").outerHTML = `
    <footer
      id="footer" class="band-black"
      x-data="{
        home: (() => { const h = new URLSearchParams(window.location.search).get('home'); return HOMEPAGE_VARIANTS.includes(h) ? h : ''; })(),
        get homeHref() { return this.home ? \`/\${this.home}.html\` : '/'; },
      }"
    >
      <div class="max-w-6xl mx-auto px-6 pt-16 pb-12">
        <div class="grid md:grid-cols-3 gap-10 items-start pb-12 border-b border-divider">
          <div>
            <p class="font-label text-sm font-bold uppercase tracking-[0.2em] text-accent mb-4">Certificate</p>
            <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 rounded-lg p-3">
              <img src="/images/site/cert-ce-quality.webp" alt="CE Quality Certificate" loading="lazy" decoding="async" class="h-14 md:h-10 lg:h-16 w-auto flex-none" />
              <img src="/images/site/cert-iso-9001.webp" alt="Certified ISO 9001 Company" loading="lazy" decoding="async" class="h-14 md:h-10 lg:h-16 w-auto flex-none" />
              <img src="/images/site/cert-tuv-sud.webp" alt="TÜV SÜD" loading="lazy" decoding="async" class="h-14 md:h-10 lg:h-16 w-auto flex-none" />
              <img src="/images/site/cert-zed-bronze.webp" alt="MSME Zed Bronze — Zero Defect Zero Effect" loading="lazy" decoding="async" class="h-14 md:h-10 lg:h-16 w-auto flex-none" />
              <img src="/images/site/cert-iso.webp" alt="ISO Certified" loading="lazy" decoding="async" class="h-14 md:h-10 lg:h-16 w-auto flex-none" />
            </div>
          </div>

          <div class="flex flex-col items-center gap-4">
            <img src="/images/logo-dark.png" alt="Vividvista" width="314" height="146" class="h-14 w-auto" />
            <div class="flex items-center gap-3">
              <a :href="SITE.social.instagram" target="_blank" rel="noopener" aria-label="Instagram" class="w-11 h-11 rounded-lg flex items-center justify-center hover:text-accent transition-colors" style="background: rgba(255,255,255,0.1);">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" class="w-5 h-5"><rect x="2" y="2" width="20" height="20" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1"></circle></svg>
              </a>
              <a :href="SITE.social.linkedin" target="_blank" rel="noopener" aria-label="LinkedIn" class="w-11 h-11 rounded-lg flex items-center justify-center hover:text-accent transition-colors" style="background: rgba(255,255,255,0.1);">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.95 1.8-1.95 3.7-1.95 3.95 0 4.68 2.5 4.68 5.75V21H17v-5.6c0-1.35-.02-3.08-1.87-3.08-1.87 0-2.16 1.46-2.16 2.98V21H9z"/></svg>
              </a>
              <a :href="SITE.social.facebook" target="_blank" rel="noopener" aria-label="Facebook" class="w-11 h-11 rounded-lg flex items-center justify-center hover:text-accent transition-colors" style="background: rgba(255,255,255,0.1);">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M13.5 21v-7.5h2.5l.5-3h-3V8.5c0-.9.25-1.5 1.55-1.5H16.5V4.3c-.27-.04-1.2-.11-2.28-.11-2.26 0-3.8 1.38-3.8 3.9V10.5H8v3h2.42V21h3.08z"/></svg>
              </a>
              <a :href="SITE.social.youtube" target="_blank" rel="noopener" aria-label="YouTube" class="w-11 h-11 rounded-lg flex items-center justify-center hover:text-accent transition-colors" style="background: rgba(255,255,255,0.1);">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
          </div>

          <div class="md:text-right">
            <p class="font-label text-sm font-bold uppercase tracking-[0.2em] text-accent mb-4">Get In Touch</p>
            <span class="inline-block px-3.5 py-1.5 rounded font-label text-xs font-bold uppercase tracking-wide mb-3" style="background: rgb(var(--accent-r) var(--accent-g) var(--accent-b)); color: var(--on-accent);">India</span>
            <p class="flex flex-nowrap items-center justify-center md:justify-end gap-x-1.5 text-[13.5px] sm:text-xl font-bold whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-none text-accent" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              <template x-for="(number, index) in SITE.contact.phones" :key="number">
                <span class="flex items-center gap-x-1.5">
                  <a :href="\`tel:\${number}\`" class="hover:text-accent transition-colors" x-text="number"></a>
                  <span x-show="index < SITE.contact.phones.length - 1" class="opacity-40" aria-hidden="true">/</span>
                </span>
              </template>
            </p>
            <p class="flex flex-nowrap items-center justify-center md:justify-end gap-x-1.5 text-[12.5px] sm:text-base font-semibold mt-2 whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 flex-none text-accent" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 6-10 7L2 6"></path></svg>
              <template x-for="(address, index) in SITE.contact.emails" :key="address">
                <span class="flex items-center gap-x-1.5 whitespace-nowrap">
                  <a :href="\`mailto:\${address}\`" class="hover:text-accent transition-colors" x-text="address"></a>
                  <span x-show="index < SITE.contact.emails.length - 1" class="opacity-40 px-0.5" aria-hidden="true">/</span>
                </span>
              </template>
            </p>
          </div>
        </div>

        <div class="text-center py-10 border-b border-divider">
          <a :href="SITE.contact.whatsapp" target="_blank" rel="noopener" class="btn-viyo text-base">
            <span class="btn-viyo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.33 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2zm5.8 14.16c-.24.68-1.4 1.3-1.93 1.35-.53.06-1.02.24-3.45-.72-2.91-1.16-4.75-4.14-4.9-4.33-.14-.19-1.17-1.56-1.17-2.98 0-1.42.74-2.11 1-2.4.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.41-.07.64.49.24.58.81 2 .88 2.15.07.15.12.32.02.52-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.75 1.24 1.62 2.01 1.11 1 2.05 1.31 2.34 1.46.29.15.46.12.63-.07.17-.19.72-.84.92-1.13.19-.29.38-.24.65-.14.26.1 1.68.79 1.97.94.29.14.48.21.55.33.07.12.07.68-.17 1.36z"/></svg>
            </span>
            Join our WhatsApp channel
          </a>
          <p class="text-sm font-medium mt-4" style="opacity: 0.85;">Scan the QR below or tap to open a chat</p>
          <div
            id="whatsapp-qr" role="img" aria-label="Scan to chat on WhatsApp"
            class="w-32 h-32 rounded-lg mx-auto mt-3 bg-white p-2"
          ></div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-10 pt-10">
          <div>
            <p class="font-label text-sm font-bold uppercase tracking-[0.14em] text-accent mb-4">Company</p>
            <div class="flex flex-col gap-3">
              <a href="/about.html" class="text-base font-medium hover:text-accent transition-colors">About</a>
              <span class="text-base font-medium" style="opacity: 0.9;" x-text="SITE.contact.location"></span>
            </div>
          </div>
          <div>
            <p class="font-label text-sm font-bold uppercase tracking-[0.14em] text-accent mb-4">Find Us</p>
            <div class="rounded-xl overflow-hidden" style="border: 1px solid var(--divider);">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3692.134868680961!2d70.7968525!3d22.2728804!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3959cbb09fff28b5%3A0x3caf786cf2fbf70d!2sVIYO%20BY%20VIVIDVISTA%20INTERNATIONAL%20%7C%20Hotel%20%26%20Resort%20Room%20Amenities!5e0!3m2!1sen!2sin!4v1785684677675!5m2!1sen!2sin"
                width="100%" height="200" style="border: 0; display: block;"
                allowfullscreen="" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"
                title="VIYO by VividVista International — location map"
              ></iframe>
            </div>
          </div>
        </div>

        <div class="mt-10 pt-8 border-t border-divider text-center">
          <div class="inline-flex items-center justify-center gap-3">
            <!-- Decorative star -->
            <span
              class="text-accent text-2xl opacity-90"
              aria-hidden="true"
            >✦</span>

            <!-- Coming Soon -->
            <span
              class="font-label sm:text-[11px] text-2xl font-bold uppercase tracking-[0.22em] text-accent"
            >
              Ready For
            </span>

            <!-- Divider -->
            <span
              class="w-px h-4 opacity-30"
              style="background: rgb(var(--accent-r) var(--accent-g) var(--accent-b));"
              aria-hidden="true"
            ></span>

            <!-- Branch -->
            <span
              class="font-label text-2xl font-semibold tracking-wide"
            >
              Ahmedabad
            </span>

            <!-- Decorative star -->
            <span
              class="text-accent text-2xl opacity-90"
              aria-hidden="true"
            >✦</span>

          </div>
        </div>
      </div>

      <div class="border-t border-divider">
        <div class="max-w-6xl mx-auto px-6 py-[22px] flex flex-wrap gap-3 justify-between items-center">
          <p class="font-label text-sm font-medium" style="opacity: 0.9;">&copy; <span x-text="new Date().getFullYear()"></span> <span x-text="SITE.fullName"></span>. All rights reserved.</p>
          <p class="font-label text-sm font-medium" style="opacity: 0.9;" x-text="SITE.tagline"></p>
        </div>
      </div>

    </footer>
`;

// Renders the WhatsApp QR client-side from SITE.contact.whatsapp instead of a
// pre-baked image — it always matches the real link/number in js/config.js,
// nothing to manually regenerate with the `qrcode` Python package anymore.
// Loaded from a CDN like the rest of this site's dependencies (Tailwind,
// Alpine, ogl) since there's no build step/npm install here.
(function renderWhatsappQr() {
  const container = document.getElementById("whatsapp-qr");
  if (!container) return;
  const draw = () => {
    const qr = window.qrcode(0, "M");
    qr.addData(SITE.contact.whatsapp);
    qr.make();
    container.innerHTML = qr.createSvgTag({ scalable: true });
    const svg = container.querySelector("svg");
    if (svg) {
      svg.style.width = "100%";
      svg.style.height = "100%";
      svg.style.display = "block";
    }
  };
  if (window.qrcode) {
    draw();
    return;
  }
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js";
  script.onload = draw;
  document.head.appendChild(script);
})();
