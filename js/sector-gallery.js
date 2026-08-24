// WebGL "Where We Serve" sector gallery — a drag/scroll horizontal gallery of
// sector cards, adapted from the design handoff's CircularGallery prototype
// (design_handoff_where_we_serve/circular-gallery.js) into a self-contained
// custom element: static sector data, this site's own theme tokens (instead
// of the prototype's JSON-attribute config and hue-tinted placeholder
// swatches), and an <img>-style onerror fallback to the same placeholder-tile
// look used for missing product/category photos elsewhere on the site.
//
// No bundler on this site (Tailwind/Alpine are also loaded from a CDN), so
// `ogl` is imported the same way — swap this for an npm import if a build
// step is ever introduced.
import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from "https://esm.sh/ogl@1.0.6";

// Same 6 sectors everywhere, but each page's <sector-gallery> can point at a
// different photo set via its images-path="" attribute (see
// SectorGalleryElement below) — e.g. index.html uses the default
// /images/sectors/, about.html uses /images/sectors-about/. Drop real
// photography in using these exact filenames and each card picks it up
// automatically on next load — no code changes needed. Until a file exists,
// that card shows the same placeholder-tile look used for missing
// product/category photos elsewhere on the site.
const SECTOR_FILENAMES = [
  { name: "Hotels & Resorts", file: "hotels-resorts.webp" },
  { name: "Airports", file: "airports.webp" },
  { name: "Corporate & IT Parks", file: "corporate-it-parks.webp" },
  { name: "Government", file: "government.webp" },
  { name: "Hospitals", file: "hospitals.webp" },
  { name: "Malls & Cinemas", file: "malls-cinemas.webp" },
];

function lerp(p1, p2, t) {
  return p1 + (p2 - p1) * t;
}
function debounce(fn, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}
function cssVar(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}
// Mirrors the color-derivation this site already applies on load/theme-toggle
// (see js/color-utils.js) so the gallery always matches the live theme/accent
// instead of a fixed copy of the handoff's literal oklch values.
function themeColors() {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  return {
    dark,
    text: cssVar("--text-primary", dark ? "#f5f1e8" : "#1e2a22"),
    // Same stops as .placeholder-tile in css/viyo-theme.css.
    gradientFrom: dark ? "#16251b" : "#f4faf0",
    gradientTo: dark ? "#0d1510" : "#93C572",
    accent: `rgb(${cssVar("--accent-r", "200")}, ${cssVar("--accent-g", "162")}, ${cssVar("--accent-b", "65")})`,
    accentSoft: `rgb(${cssVar("--accent-r", "200")} ${cssVar("--accent-g", "162")} ${cssVar("--accent-b", "65")} / 0.16)`,
  };
}

// Same visual as the site's .placeholder-tile (gradient + accent-tinted photo
// badge), redrawn on <canvas> since a WebGL texture can't consume a DOM
// element/CSS class directly.
function placeholderDataUrl() {
  const { gradientFrom, gradientTo, accent, accentSoft } = themeColors();
  const canvas = document.createElement("canvas");
  canvas.width = 700;
  canvas.height = 900;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, gradientFrom);
  gradient.addColorStop(1, gradientTo);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 90, 0, Math.PI * 2);
  ctx.fillStyle = accentSoft;
  ctx.fill();

  ctx.save();
  ctx.translate(cx - 44, cy - 44);
  ctx.scale(88 / 24, 88 / 24);
  const badgePath = new Path2D(
    "M20.59 13.41 13.41 20.59a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
  );
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke(badgePath);
  ctx.beginPath();
  ctx.arc(7, 7, 1, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.restore();

  return canvas.toDataURL();
}

function getFontSize(font) {
  const match = font.match(/(\d+)px/);
  return match ? parseInt(match[1], 10) : 30;
}

function createTextTexture(gl, text, font, color) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = font;
  const metrics = context.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = Math.ceil(getFontSize(font) * 1.2);
  canvas.width = textWidth + 20;
  canvas.height = textHeight + 20;
  context.font = font;
  context.fillStyle = color;
  context.textBaseline = "middle";
  context.textAlign = "center";
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new Texture(gl, { generateMipmaps: false });
  texture.image = canvas;
  return { texture, width: canvas.width, height: canvas.height };
}

class Title {
  constructor({ gl, plane, text, textColor, font }) {
    this.gl = gl;
    this.plane = plane;
    this.text = text;
    this.textColor = textColor;
    this.font = font;
    this.createMesh();
  }
  createMesh() {
    const { texture, width, height } = createTextTexture(this.gl, this.text, this.font, this.textColor);
    const geometry = new Plane(this.gl);
    const program = new Program(this.gl, {
      vertex: `attribute vec3 position;attribute vec2 uv;uniform mat4 modelViewMatrix;uniform mat4 projectionMatrix;varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragment: `precision highp float;uniform sampler2D tMap;varying vec2 vUv;void main(){vec4 color=texture2D(tMap,vUv);if(color.a<0.1)discard;gl_FragColor=color;}`,
      uniforms: { tMap: { value: texture } },
      transparent: true,
    });
    this.mesh = new Mesh(this.gl, { geometry, program });
    const aspect = width / height;
    const textHeight = this.plane.scale.y * 0.15;
    const textWidth = textHeight * aspect;
    this.mesh.scale.set(textWidth, textHeight, 1);
    this.mesh.position.y = -this.plane.scale.y * 0.5 - textHeight * 0.5 - 0.05;
    this.mesh.setParent(this.plane);
  }
}

class Media {
  constructor({ geometry, gl, image, index, length, scene, screen, text, viewport, textColor, borderRadius, font, reduceMotion, bend }) {
    this.extra = 0;
    Object.assign(this, { geometry, gl, image, index, length, scene, screen, text, viewport, textColor, borderRadius, font, reduceMotion, bend });
    this.createShader();
    this.createMesh();
    this.createTitle();
    this.onResize();
  }
  createShader() {
    const texture = new Texture(this.gl, { generateMipmaps: true });
    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `precision highp float;attribute vec3 position;attribute vec2 uv;uniform mat4 modelViewMatrix;uniform mat4 projectionMatrix;uniform float uTime;uniform float uSpeed;uniform float uAmp;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;p.z=(sin(p.x*4.0+uTime)*1.5+cos(p.y*2.0+uTime)*1.5)*(uAmp+uSpeed*0.5);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
      fragment: `precision highp float;uniform vec2 uImageSizes;uniform vec2 uPlaneSizes;uniform sampler2D tMap;uniform float uBorderRadius;varying vec2 vUv;
        float roundedBoxSDF(vec2 p, vec2 b, float r){vec2 d=abs(p)-b;return length(max(d,vec2(0.0)))+min(max(d.x,d.y),0.0)-r;}
        void main(){
          vec2 ratio=vec2(min((uPlaneSizes.x/uPlaneSizes.y)/(uImageSizes.x/uImageSizes.y),1.0),min((uPlaneSizes.y/uPlaneSizes.x)/(uImageSizes.y/uImageSizes.x),1.0));
          vec2 uv=vec2(vUv.x*ratio.x+(1.0-ratio.x)*0.5, vUv.y*ratio.y+(1.0-ratio.y)*0.5);
          vec4 color=texture2D(tMap,uv);
          float d=roundedBoxSDF(vUv-0.5, vec2(0.5-uBorderRadius), uBorderRadius);
          float edgeSmooth=0.002;
          float alpha=1.0-smoothstep(-edgeSmooth,edgeSmooth,d);
          gl_FragColor=vec4(color.rgb, alpha);
        }`,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [0, 0] },
        uSpeed: { value: 0 },
        uTime: { value: 100 * Math.random() },
        uBorderRadius: { value: this.borderRadius },
        uAmp: { value: this.reduceMotion ? 0 : 0.1 },
      },
      transparent: true,
    });
    this.loadImage(texture, this.image);
  }
  loadImage(texture, src, isFallback = false) {
    const img = new Image();
    if (!src.startsWith("data:")) img.crossOrigin = "anonymous";
    img.onload = () => {
      texture.image = img;
      this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight];
    };
    img.onerror = () => {
      if (isFallback) return;
      this.loadImage(texture, placeholderDataUrl(), true);
    };
    img.src = src;
  }
  createMesh() {
    this.plane = new Mesh(this.gl, { geometry: this.geometry, program: this.program });
    this.plane.setParent(this.scene);
  }
  createTitle() {
    this.title = new Title({ gl: this.gl, plane: this.plane, text: this.text, textColor: this.textColor, font: this.font });
  }
  update(scroll, direction) {
    this.plane.position.x = this.x - scroll.current - this.extra;
    const x = this.plane.position.x;
    if (this.bend === 0) {
      this.plane.position.y = 0;
      this.plane.rotation.z = 0;
    } else {
      const H = this.viewport.width / 2;
      const bendAbs = Math.abs(this.bend);
      const radius = (H * H + bendAbs * bendAbs) / (2 * bendAbs);
      const effectiveX = Math.min(Math.abs(x), H);
      const arc = radius - Math.sqrt(radius * radius - effectiveX * effectiveX);
      if (this.bend > 0) {
        this.plane.position.y = -arc;
        this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / radius);
      } else {
        this.plane.position.y = arc;
        this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / radius);
      }
    }
    this.speed = scroll.current - scroll.last;
    this.program.uniforms.uTime.value += 0.04;
    this.program.uniforms.uSpeed.value = this.speed;
    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
    this.isBefore = this.plane.position.x + planeOffset < -viewportOffset;
    this.isAfter = this.plane.position.x - planeOffset > viewportOffset;
    if (direction === "right" && this.isBefore) {
      this.extra -= this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
    if (direction === "left" && this.isAfter) {
      this.extra += this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
  }
  onResize({ screen, viewport } = {}) {
    if (screen) this.screen = screen;
    if (viewport) this.viewport = viewport;
    this.scale = this.screen.height / 1500;
    this.plane.scale.y = (this.viewport.height * (900 * this.scale)) / this.screen.height;
    this.plane.scale.x = (this.viewport.width * (700 * this.scale)) / this.screen.width;
    this.plane.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];
    this.padding = 2;
    this.width = this.plane.scale.x + this.padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
  }
}

class App {
  constructor(container, { items, textColor, borderRadius, font, scrollSpeed, scrollEase, reduceMotion, autoAdvanceDelay, bend }) {
    this.container = container;
    this.scrollSpeed = scrollSpeed;
    this.autoAdvanceDelay = autoAdvanceDelay;
    this.isHovering = false;
    this.scroll = { ease: scrollEase, current: 0, target: 0, last: 0 };
    this.onCheckDebounce = debounce(this.onCheck.bind(this), 200);
    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.createGeometry();
    this.createMedias(items, textColor, borderRadius, font, reduceMotion, bend);
    this.update = this.update.bind(this);
    this.update();
    this.addEventListeners();
    this.startAutoAdvance();
  }
  // Steps exactly one card per tick and dwells there — a continuous drift
  // (however slow) never gives the label time to actually be read, so this
  // advances like the hero banner's timed slides instead.
  startAutoAdvance() {
    this.stopAutoAdvance();
    this.autoAdvanceTimer = window.setInterval(() => {
      if (this.isDown || this.isHovering) return;
      if (!this.medias || !this.medias[0]) return;
      this.scroll.target += this.medias[0].width;
    }, this.autoAdvanceDelay);
  }
  stopAutoAdvance() {
    window.clearInterval(this.autoAdvanceTimer);
  }
  createRenderer() {
    this.renderer = new Renderer({ alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio || 1, 2) });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    this.container.appendChild(this.gl.canvas);
    this.gl.canvas.style.display = "block";
    this.gl.canvas.style.width = "100%";
    this.gl.canvas.style.height = "100%";
  }
  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 20;
  }
  createScene() {
    this.scene = new Transform();
  }
  createGeometry() {
    this.planeGeometry = new Plane(this.gl, { heightSegments: 50, widthSegments: 100 });
  }
  createMedias(items, textColor, borderRadius, font, reduceMotion, bend) {
    const list = items && items.length ? items : [];
    this.mediasImages = list.concat(list);
    this.medias = this.mediasImages.map(
      (data, index) =>
        new Media({
          geometry: this.planeGeometry,
          gl: this.gl,
          image: data.image,
          index,
          length: this.mediasImages.length,
          scene: this.scene,
          screen: this.screen,
          text: data.name,
          viewport: this.viewport,
          textColor,
          borderRadius,
          font,
          reduceMotion,
          bend,
        })
    );
  }
  onTouchDown(e) {
    this.isDown = true;
    this.scroll.position = this.scroll.current;
    this.start = e.touches ? e.touches[0].clientX : e.clientX;
  }
  onTouchMove(e) {
    if (!this.isDown) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const distance = (this.start - x) * (this.scrollSpeed * 0.025);
    this.scroll.target = this.scroll.position + distance;
  }
  onTouchUp() {
    this.isDown = false;
    this.onCheck();
  }
  onWheel(e) {
    const delta = e.deltaY || e.wheelDelta || e.detail;
    this.scroll.target += (delta > 0 ? this.scrollSpeed : -this.scrollSpeed) * 0.2;
    this.onCheckDebounce();
    e.preventDefault();
  }
  onKeyDown(e) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      this.scroll.target += this.scrollSpeed * 5;
      this.onCheckDebounce();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      this.scroll.target -= this.scrollSpeed * 5;
      this.onCheckDebounce();
    } else if (e.key === "Home") {
      e.preventDefault();
      this.scroll.target = 0;
      this.onCheckDebounce();
    }
  }
  onCheck() {
    if (!this.medias || !this.medias[0]) return;
    const width = this.medias[0].width;
    const itemIndex = Math.round(Math.abs(this.scroll.target) / width);
    const item = width * itemIndex;
    this.scroll.target = this.scroll.target < 0 ? -item : item;
  }
  onResize() {
    this.screen = { width: this.container.clientWidth, height: this.container.clientHeight };
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({ aspect: this.screen.width / this.screen.height });
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { width, height };
    if (this.medias) this.medias.forEach((media) => media.onResize({ screen: this.screen, viewport: this.viewport }));
  }
  update() {
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
    const direction = this.scroll.current > this.scroll.last ? "right" : "left";
    if (this.medias) this.medias.forEach((media) => media.update(this.scroll, direction));
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.scroll.last = this.scroll.current;
    this.raf = window.requestAnimationFrame(this.update);
  }
  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnTouchDown = this.onTouchDown.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchUp = this.onTouchUp.bind(this);
    this.boundOnKeyDown = this.onKeyDown.bind(this);
    this.boundOnHoverStart = () => { this.isHovering = true; };
    this.boundOnHoverEnd = () => { this.isHovering = false; };
    window.addEventListener("resize", this.boundOnResize);
    this.container.addEventListener("wheel", this.boundOnWheel, { passive: false });
    this.container.addEventListener("mousedown", this.boundOnTouchDown);
    window.addEventListener("mousemove", this.boundOnTouchMove);
    window.addEventListener("mouseup", this.boundOnTouchUp);
    this.container.addEventListener("touchstart", this.boundOnTouchDown, { passive: true });
    window.addEventListener("touchmove", this.boundOnTouchMove);
    window.addEventListener("touchend", this.boundOnTouchUp);
    this.container.addEventListener("keydown", this.boundOnKeyDown);
    this.container.addEventListener("mouseenter", this.boundOnHoverStart);
    this.container.addEventListener("mouseleave", this.boundOnHoverEnd);
    this.container.addEventListener("focusin", this.boundOnHoverStart);
    this.container.addEventListener("focusout", this.boundOnHoverEnd);
  }
  destroy() {
    window.cancelAnimationFrame(this.raf);
    this.stopAutoAdvance();
    window.removeEventListener("resize", this.boundOnResize);
    window.removeEventListener("mousemove", this.boundOnTouchMove);
    window.removeEventListener("mouseup", this.boundOnTouchUp);
    window.removeEventListener("touchmove", this.boundOnTouchMove);
    window.removeEventListener("touchend", this.boundOnTouchUp);
    if (this.renderer && this.renderer.gl && this.renderer.gl.canvas.parentNode) {
      this.renderer.gl.canvas.parentNode.removeChild(this.renderer.gl.canvas);
    }
  }
}

let cssInjected = false;
function injectCss() {
  if (cssInjected) return;
  cssInjected = true;
  const style = document.createElement("style");
  style.textContent = `sector-gallery{display:block;position:absolute;inset:0;width:100%;height:100%;overflow:hidden;cursor:grab;outline:none}sector-gallery:active{cursor:grabbing}sector-gallery:focus-visible{outline:2px solid rgb(var(--accent-r) var(--accent-g) var(--accent-b));outline-offset:4px}`;
  document.head.appendChild(style);
}

class SectorGalleryElement extends HTMLElement {
  connectedCallback() {
    injectCss();
    if (this._app) return;
    this.tabIndex = 0;
    this.setAttribute("role", "region");
    this.setAttribute("aria-label", "Sectors we serve. Use left and right arrow keys to navigate.");
    this.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const start = () => {
      if (!this.isConnected || this._app) return;
      this._app = new App(this, this.buildOptions());
    };

    const initLazy = () => {
      if (document.fonts && document.fonts.load) {
        document.fonts
          .load("600 22px Inter")
          .then(() => document.fonts.ready)
          .catch(() => {})
          .then(() => requestAnimationFrame(start));
      } else {
        requestAnimationFrame(start);
      }
    };

    if ("IntersectionObserver" in window) {
      this._observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            this._observer.disconnect();
            this._observer = null;
            initLazy();
          }
        },
        { rootMargin: "200px" }
      );
      this._observer.observe(this);
    } else {
      initLazy();
    }

    // Rebuilds the gallery (fresh title/placeholder colors) when the site's
    // light/dark toggle flips data-theme — cheap since it's a rare, deliberate
    // user action, and simpler/more robust than patching colors into every
    // already-created WebGL texture in place.
    this._themeObserver = new MutationObserver(() => {
      if (!this._app) return;
      const target = this._app.scroll.target;
      this._app.destroy();
      this._app = new App(this, this.buildOptions());
      this._app.scroll.target = target;
      this._app.scroll.current = target;
    });
    this._themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }
  scrollNext() {
    if (!this._app) return;
    const step = (this._app.medias && this._app.medias[0]) ? this._app.medias[0].width : (this._app.scrollSpeed * 5);
    this._app.scroll.ease = 0.08;
    this._app.scroll.target += step;
    this._app.onCheck();
  }
  scrollPrev() {
    if (!this._app) return;
    const step = (this._app.medias && this._app.medias[0]) ? this._app.medias[0].width : (this._app.scrollSpeed * 5);
    this._app.scroll.ease = 0.08;
    this._app.scroll.target -= step;
    this._app.onCheck();
  }
  buildOptions() {
    // Defaults to the homepage's folder so existing pages/markup need no
    // changes — only pages that want a different photo set (e.g. about.html)
    // need to add images-path="/images/sectors-whatever/" to the element.
    const imagesPath = this.getAttribute("images-path") || "/images/sectors/";
    const basePath = imagesPath.endsWith("/") ? imagesPath : `${imagesPath}/`;
    const items = SECTOR_FILENAMES.map((sector) => ({ name: sector.name, image: `${basePath}${sector.file}` }));
    return {
      items,
      textColor: themeColors().text,
      borderRadius: 0.06,
      font: "600 22px Inter, sans-serif",
      scrollSpeed: 1.6,
      scrollEase: 0.035,
      reduceMotion: this.reduceMotion,
      autoAdvanceDelay: 3600,
      // 0 = flat horizontal row (no arc/curve, no per-card tilt) — default
      // keeps the homepage's existing circular look; add bend="0" on the
      // element for a page that wants purely horizontal movement instead.
      bend: this.hasAttribute("bend") ? parseFloat(this.getAttribute("bend")) : 2,
    };
  }
  disconnectedCallback() {
    if (this._app) {
      this._app.destroy();
      this._app = null;
    }
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
    if (this._themeObserver) {
      this._themeObserver.disconnect();
      this._themeObserver = null;
    }
  }
}
if (!customElements.get("sector-gallery")) customElements.define("sector-gallery", SectorGalleryElement);
