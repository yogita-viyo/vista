(function () {
  var savedMode = localStorage.getItem("aurelia-theme") || "light";
  document.documentElement.setAttribute("data-theme", savedMode);
  if (window.ColorUtils && typeof SITE !== "undefined" && SITE.theme) {
    window.ColorUtils.applyAccentTheme(document.documentElement.style, SITE.theme.accentColor, savedMode);
  }
})();
