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

    /* ---- Outbound click attribution -------------------------------------
       One delegated listener classifies EVERY link that leaves this site, so
       a new link is measured the moment it is added — no data-track attribute
       required. (It previously only fired for tagged elements, which left the
       archival-source links, the podcast link and the player's YouTube link
       reporting nothing at all.)

       "Leaves this site" cannot be a hostname comparison here: the book site,
       the Genius Index and the assessment all share dixon8303.github.io with
       this site, so comparing hostnames would silently drop exactly the
       cross-property clicks worth measuring. Compare the path prefix instead —
       every page of this site sits directly under one base path. */
    var SITE_BASE = location.pathname.replace(/[^/]*$/, "");

    function isOutbound(a) {
      if (!/^https?:$/i.test(a.protocol)) return false;
      if (a.hostname !== location.hostname) return true;
      return a.pathname.indexOf(SITE_BASE) !== 0;
    }

    // Order matters: a subscribe link is also a youtube.com link, and the
    // subscribe intent is the one worth counting.
    function classify(href) {
      if (/sub_confirmation/.test(href)) return "subscribe_click";
      if (/payhip\.com/.test(href)) return "buy_click";
      if (/ImaginariumOzone\/book/.test(href)) return "book_click";
      if (/youtube\.com|youtu\.be/.test(href)) return "youtube_click";
      if (/podcasts\.apple\.com/.test(href)) return "podcast_click";
      if (/calendly\.com/.test(href)) return "interview_click";
      return "outbound_click";
    }

    document.addEventListener("click", function (ev) {
      var a = ev.target.closest && ev.target.closest("a[href]");
      if (!a || typeof window.gtag !== "function") return;
      if (!isOutbound(a)) return;
      // One event per click: the classifier replaces the old data-track
      // dispatch rather than firing alongside it. data-track-dest is kept as
      // a parameter so the hand-labelled destinations aren't lost.
      window.gtag("event", classify(a.href), {
        link_url: a.href,
        link_text: (a.innerText || "").trim().slice(0, 80),
        destination: (a.dataset && a.dataset.trackDest) || "",
        transport_type: "beacon"
      });
    }, true);
  }

  /* Email capture. Both captures navigate away on submit (a real POST to
     Kit), so this needs the beacon transport to survive the unload. */
  window.BGF_TRACK_LEAD = function (method) {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", "lead", {method: method, transport_type: "beacon"});
  };

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
