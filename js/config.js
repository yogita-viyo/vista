// Central config — change these and the whole site updates.
// This is the ONLY file you should need to touch to rebrand the site.
// Loaded via a plain <script> tag, so it defines a global SITE object.

const SITE = {
  name: "VIYO | VividVista",
  fullName: "VIYO (VividVista International)",
  tagline: "Amenities for hotels that don't compromise.",
  heroSubline: "Certified hotel amenities — RFID door locks, minibars, kettle & tray sets, bath accessories and more — sourced, tested, and ready to inquire.",
  description: "VIYO (VividVista International) manufactures certified hotel & resort amenities — RFID locks, minibars, bath accessories and lobby fixtures — supplied across India.",

  // Real contact details, matching the printed brochure (VividVista International).
  contact: {
    // Primary email — used anywhere only a single address fits (e.g. the
    // JSON-LD contact point, form error fallback text).
    email: "info@vividvista.in",
    // Shown together in places with room for both (site footer, contact.html)
    // — emails[0] always matches `email` above.
    emails: ["info@vividvista.in", "sales@vividvista.in"],
    // Primary number — used for the WhatsApp link below and anywhere only a
    // single phone fits (e.g. JSON-LD contact point).
    phone: "+91 88669 10551",
    // Shown together in places with room for both (site footer, contact.html)
    // — phones[0] always matches `phone` above.
    phones: ["+91 88669 10551", "+91 96017 10551"],
    location: "1, Vaidwadi, B/H Dmart Mall, Gondal Road, Rajkot - 360004, Gujarat, India",
    // wa.me click-to-chat link — same primary number as `phone` above, digits only
    // (no "+", no spaces). QR code for this exact link lives at images/site/whatsapp-qr.webp
    // (regenerate it with the `qrcode` Python package if this number ever changes).
    whatsapp: "https://wa.me/918866910551?text=" + encodeURIComponent("Hi VIYO, I'd like to enquire about your hotel amenities catalogue."),
  },

  social: {
    instagram: "https://www.instagram.com/viyo_india_?igsh=MWVhZzMzemt0YXBy",
    linkedin: "https://www.linkedin.com/company/viyoindia/",
    facebook: "https://www.facebook.com/share/1BC3oH5qrA/",
    youtube: "https://youtube.com/@viyobyvv?si=PCBTIbrcDJnWH6Ul",
  },

  // Google Sheets integration — paste your Google Apps Script Web App URL here
  googleSheetAppUrl: "https://script.google.com/macros/s/AKfycbxg6H-32VzyQ_gT8qxvoRpr19tY0pqTZvToN2DHOCXe_x2ZkiKrTFqI1-LTUv9aNupS/exec",

  // Google Analytics GA4 Measurement ID
  googleAnalyticsId: "G-9DV61CF3S8",


  // Theme accent — RGB numbers only. Everything else (light/dark, glass tints,
  // hover states, glows) derives from this one color automatically.
  // Examples: gold 200,162,65 | blue-teal 46,138,184 | emerald 56,148,102
  // Current: VIYO Premium Hospitality Color System primary green (#2E4A3D),
  // per the homepage redesign color handoff.
  theme: {
    accentColor: { r: 147, g: 197, b: 114 },
    defaultMode: "light", // "light" only
  },
};
