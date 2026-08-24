// Shared RGB/HSL helpers — used by theme-init.js to apply the configured
// accent color on load.
window.ColorUtils = (function () {
  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let hue = 0;
    let saturation = 0;
    const lightness = (max + min) / 2;
    if (max !== min) {
      const delta = max - min;
      saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
      switch (max) {
        case r:
          hue = (g - b) / delta + (g < b ? 6 : 0);
          break;
        case g:
          hue = (b - r) / delta + 2;
          break;
        default:
          hue = (r - g) / delta + 4;
      }
      hue /= 6;
    }
    return [hue * 360, saturation * 100, lightness * 100];
  }

  function hslToRgb(hue, saturation, lightness) {
    hue /= 360;
    saturation /= 100;
    lightness /= 100;
    let red, green, blue;
    if (saturation === 0) {
      red = green = blue = lightness;
    } else {
      const hueToChannel = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
      const p = 2 * lightness - q;
      red = hueToChannel(p, q, hue + 1 / 3);
      green = hueToChannel(p, q, hue);
      blue = hueToChannel(p, q, hue - 1 / 3);
    }
    return [Math.round(red * 255), Math.round(green * 255), Math.round(blue * 255)];
  }

  function deriveAccentShades(r, g, b) {
    const [hue, saturation, lightness] = rgbToHsl(r, g, b);
    // Deep/hover shade is a fraction of the base lightness rather than a
    // fixed target — a fixed target (e.g. always L35) lightens accents that
    // are already darker than that, which inverts "hover darkens" into
    // "hover lightens" for a dark accent like the brand green (L~23.5).
    const [deepR, deepG, deepB] = hslToRgb(hue, saturation, lightness * 0.75);
    const [lightR, lightG, lightB] = hslToRgb(hue, saturation, Math.min(lightness + 12, 100));
    return {
      base: [r, g, b],
      deep: [deepR, deepG, deepB],
      light: [lightR, lightG, lightB],
    };
  }

  function rgbToHex(r, g, b) {
    const toHex = (channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  function hexToRgb(hex) {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex).trim());
    if (!match) return null;
    return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
  }

  // WCAG relative luminance — used to pick readable text over an accent
  // background regardless of how light or dark that accent turns out to be.
  function relativeLuminance(r, g, b) {
    const linearize = (channel) => {
      const proportion = channel / 255;
      return proportion <= 0.03928 ? proportion / 12.92 : Math.pow((proportion + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
  }

  function contrastRatio(luminanceA, luminanceB) {
    const lighter = Math.max(luminanceA, luminanceB);
    const darker = Math.min(luminanceA, luminanceB);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // Returns whichever of the site's ink colors reads better on top of the
  // given background, so accent-colored buttons/badges stay legible no
  // matter which accent color is configured.
  function getReadableTextColor(r, g, b) {
    const backgroundLuminance = relativeLuminance(r, g, b);
    const darkInkLuminance = relativeLuminance(0x1e, 0x2a, 0x22); // matches --text-primary (light theme)
    const lightInkLuminance = relativeLuminance(0xf5, 0xf1, 0xe8); // matches --text-primary (dark theme)
    const contrastWithDarkInk = contrastRatio(backgroundLuminance, darkInkLuminance);
    const contrastWithLightInk = contrastRatio(backgroundLuminance, lightInkLuminance);
    return contrastWithDarkInk >= contrastWithLightInk ? "#1e2a22" : "#f5f1e8";
  }

  // Nudges [r,g,b] darker or lighter (preserving hue/saturation) until it
  // clears minRatio contrast against the given background, so accent text
  // sitting directly on the page background stays legible even if the
  // configured accent is close in tone to --bg.
  function ensureContrast(r, g, b, backgroundR, backgroundG, backgroundB, minRatio) {
    const backgroundLuminance = relativeLuminance(backgroundR, backgroundG, backgroundB);
    let ratio = contrastRatio(relativeLuminance(r, g, b), backgroundLuminance);
    if (ratio >= minRatio) return [r, g, b];

    const [hue, saturation, startLightness] = rgbToHsl(r, g, b);
    const goingDarker = backgroundLuminance > 0.5;
    let lightness = startLightness;
    let shade = [r, g, b];
    while (ratio < minRatio && lightness > 0 && lightness < 100) {
      lightness = goingDarker ? Math.max(0, lightness - 1) : Math.min(100, lightness + 1);
      shade = hslToRgb(hue, saturation, lightness);
      ratio = contrastRatio(relativeLuminance(shade[0], shade[1], shade[2]), backgroundLuminance);
    }
    return shade;
  }

  // Matches --bg in styles.css for each theme.
  const PAGE_BACKGROUND = {
    light: [255, 255, 255],
    dark: [18, 18, 18],
  };

  // Single entry point for applying the configured accent color to the
  // page: derives the shades, the readable text color for solid-accent
  // buttons, and a page-background-safe text color for accent-colored
  // labels/links. Called on load, on theme toggle (background changes),
  // and from the settings live preview.
  function applyAccentTheme(rootStyle, accentColor, mode) {
    const { r, g, b } = accentColor;
    const shades = deriveAccentShades(r, g, b);
    const background = PAGE_BACKGROUND[mode] || PAGE_BACKGROUND.light;

    rootStyle.setProperty("--accent-r", shades.base[0]);
    rootStyle.setProperty("--accent-g", shades.base[1]);
    rootStyle.setProperty("--accent-b", shades.base[2]);
    rootStyle.setProperty("--accent-deep-r", shades.deep[0]);
    rootStyle.setProperty("--accent-deep-g", shades.deep[1]);
    rootStyle.setProperty("--accent-deep-b", shades.deep[2]);
    rootStyle.setProperty("--accent-light-r", shades.light[0]);
    rootStyle.setProperty("--accent-light-g", shades.light[1]);
    rootStyle.setProperty("--accent-light-b", shades.light[2]);

    rootStyle.setProperty("--on-accent", getReadableTextColor(...shades.base));
    rootStyle.setProperty("--on-accent-deep", getReadableTextColor(...shades.deep));

    const textShade = ensureContrast(shades.base[0], shades.base[1], shades.base[2], background[0], background[1], background[2], 4.5);
    const textShadeLight = ensureContrast(shades.light[0], shades.light[1], shades.light[2], background[0], background[1], background[2], 3);
    rootStyle.setProperty("--accent-text-r", textShade[0]);
    rootStyle.setProperty("--accent-text-g", textShade[1]);
    rootStyle.setProperty("--accent-text-b", textShade[2]);
    rootStyle.setProperty("--accent-text-light-r", textShadeLight[0]);
    rootStyle.setProperty("--accent-text-light-g", textShadeLight[1]);
    rootStyle.setProperty("--accent-text-light-b", textShadeLight[2]);
  }

  // Reads back whichever accent is currently applied (the saved SITE accent,
  // or a settings-page draft) so a theme toggle can reapply it against the
  // new background instead of assuming SITE.theme.accentColor.
  function getCurrentAccentColor(rootElement) {
    const computed = getComputedStyle(rootElement);
    return {
      r: parseFloat(computed.getPropertyValue("--accent-r")),
      g: parseFloat(computed.getPropertyValue("--accent-g")),
      b: parseFloat(computed.getPropertyValue("--accent-b")),
    };
  }

  return {
    rgbToHsl,
    hslToRgb,
    deriveAccentShades,
    rgbToHex,
    hexToRgb,
    getReadableTextColor,
    ensureContrast,
    applyAccentTheme,
    getCurrentAccentColor,
  };
})();
