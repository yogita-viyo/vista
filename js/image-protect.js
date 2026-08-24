// Casual-user deterrent only — blocks right-click "Save Image As" and
// drag-to-desktop on <img> elements. Not real protection: dev tools, view
// source, and screenshots all bypass this. A single document-level listener
// (rather than one per <img>) so it still covers images Alpine renders
// after this script runs.
document.addEventListener("contextmenu", (event) => {
  if (event.target.tagName === "IMG") event.preventDefault();
});
document.addEventListener("dragstart", (event) => {
  if (event.target.tagName === "IMG") event.preventDefault();
});
