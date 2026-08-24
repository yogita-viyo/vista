// Google Analytics 4 (GA4) auto-loader based on SITE.googleAnalyticsId in js/config.js
(function () {
  if (typeof SITE === "undefined" || !SITE.googleAnalyticsId) return;

  var id = SITE.googleAnalyticsId.trim();
  if (!id || id === "G-XXXXXXXXXX") return;

  // Set up global dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', id);

  // Inject Google Tag script tag dynamically into head
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
  document.head.appendChild(script);
})();
