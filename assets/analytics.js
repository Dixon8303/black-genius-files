/* ============================================================================
   ANALYTICS — GA4 + cross-site UTM passthrough.

   Mirrors the pattern already used by the "What History Buried" book site
   (ImaginariumOzone/site/assets/site.js): same measurement ID, so both
   sites report into one GA4 property and a visitor's traffic source
   survives a click from one E.A.T. Media property to another.

   Reads window.BGF_CONFIG.gaMeasurementId (set in assets/app.js). Loads
   nothing and tags nothing if that's blank.
   ============================================================================ */
(function () {
  "use strict";
  var cfg = window.BGF_CONFIG || {};
  var gaId = cfg.gaMeasurementId || "";

  /* ---- GA4 ------------------------------------------------------------- */
  if (/^G-[A-Z0-9]{4,}$/.test(gaId)) {
    var ga = document.createElement("script");
    ga.async = true;
    ga.src = "https://www.googletagmanager.com/gtag/js?id=" + gaId;
    document.head.appendChild(ga);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", gaId);

    /* Any element carrying data-track fires a GA4 event of that name on
       click — covers Subscribe buttons, the book CTA, and the Genius Index
       link today; add the same attribute to any new cross-site link. */
    document.addEventListener("click", function (ev) {
      var el = ev.target.closest("[data-track]");
      if (!el || typeof window.gtag !== "function") return;
      window.gtag("event", el.dataset.track, {
        destination: el.dataset.trackDest || "",
        link_url: el.href || ""
      });
    });
  }

  /* ---- UTM passthrough --------------------------------------------------
     Capture inbound utm_* params once, remember them for the visit, and
     append them to outbound links toward the other E.A.T. Media properties
     (the book site and Genius Index, both on dixon8303.github.io) so
     attribution survives the click between sites — same mechanism as the
     book site's site.js, applied in the other direction. */
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  var STORE_KEY = "bgf_utm";

  function currentUtms() {
    var params = new URLSearchParams(window.location.search);
    var found = {};
    UTM_KEYS.forEach(function (k) { if (params.get(k)) found[k] = params.get(k); });
    return found;
  }
  function storedUtms() {
    try { return JSON.parse(sessionStorage.getItem(STORE_KEY) || "{}"); } catch (e) { return {}; }
  }
  var inbound = currentUtms();
  if (Object.keys(inbound).length) {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(inbound)); } catch (e) {}
  }
  function utms() {
    var merged = storedUtms();
    Object.keys(inbound).forEach(function (k) { merged[k] = inbound[k]; });
    return merged;
  }
  function withUtms(url) {
    var tags = utms();
    if (!Object.keys(tags).length) return url;
    try {
      var u = new URL(url, window.location.href);
      UTM_KEYS.forEach(function (k) { if (tags[k] && !u.searchParams.has(k)) u.searchParams.set(k, tags[k]); });
      return u.toString();
    } catch (e) { return url; }
  }
  var OUTBOUND_HOST = "dixon8303.github.io"; // covers both the book site and Genius Index

  function tagOutbound() {
    document.querySelectorAll('a[href^="http"]').forEach(function (a) {
      try {
        if (new URL(a.href).hostname === OUTBOUND_HOST) a.href = withUtms(a.href);
      } catch (e) {}
    });
  }
  // Re-tag after boot() renders dynamic links (book/Genius Index hrefs are
  // set at runtime from config, not present in the initial HTML).
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(tagOutbound, 0); });
  } else {
    setTimeout(tagOutbound, 0);
  }
})();
