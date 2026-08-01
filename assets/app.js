/* ============================================================================
   SITE CONFIG — the block you edit for launch settings, retailer links, and
   community doors. Everything else in this file is behavior; edit content
   in assets/data.js.

   SECURITY NOTE: youtubeApiKey below is a client-visible YouTube Data API v3
   key. It's restricted in Google Cloud Console to this site's origin
   (HTTP referrer restriction under Application restrictions), so it can't be
   used from other websites even though the value itself is visible in this
   file. If the site ever moves to a new domain, add that origin under the
   key's restrictions too, or the live sync will start failing referrer
   checks. Leaving this blank makes the site fall back to the no-key RSS
   sync path automatically.
   ============================================================================ */
window.BGF_CONFIG = {
  youtubeApiKey: "AIzaSyApoG7-xvqvNJ-TLbXt7mYq3dzQadhZX48",
  liveSync: true,
  showCountdown: true,
  factSeconds: 10,
  trailerVideoId: "",
  subscriberCount: "",
  bookStatus: "available", // "available" | "preorder" | "coming"
  bookUrl: "https://dixon8303.github.io/ImaginariumOzone/book/",
  bnUrl: "",
  kindleUrl: "",
  geniusIndexUrl: "https://dixon8303.github.io/genius-index-booksite/",
  discordUrl: "",
  patreonUrl: "",
  newsletterAction: "",
  // Same live Kit (ConvertKit) form the official "What History Buried" site
  // uses for its "Read Chapter 1 Free" capture — one shared Recovery List,
  // one incentive email that delivers Chapter 1. Kit's configured success
  // redirect sends readers to that site's check-your-email.html, which is
  // the intended cross-link back to the book site.
  chapterOneFormAction: "https://app.kit.com/forms/9748584/subscriptions"
};
/* ========================== end of config block ============================ */

(function () {
  "use strict";
  var CFG = window.BGF_CONFIG;
  var D = window.BGF_DATA;
  var YT = D.YT, FIGURES = D.FIGURES, TIMELINE = D.TIMELINE, QUIZ = D.QUIZ, BONUS_Q = D.BONUS_Q,
      CIPHERS = D.CIPHERS, CHAPTERS = D.CHAPTERS, FACTS = D.FACTS, ARCHDEF = D.ARCHDEF, ERAS = D.ERAS,
      ACCENTS = D.ACCENTS, TOTAL_FRAGS = D.TOTAL_FRAGS;
  var pad2 = D.pad2, fmtDur = D.fmtDur, fmtWhen = D.fmtWhen, eraLabel = D.eraLabel, initials = D.initials,
      dayKey = D.dayKey, yesterKey = D.yesterKey, daySeed = D.daySeed, drawQuiz = D.drawQuiz, reduced = D.reduced;

  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
  function $(id) { return document.getElementById(id); }
  function storeGet(k, fallback) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? fallback : v; } catch (e) { return fallback; } }
  function storeSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var SEED = D.SEED;
  var state = {
    episodes: SEED, live: false, netState: "seed",
    latestVid: "", heroVid: storeGet("bgf_hero", "") || "",
    epFilter: "All", epQuery: "",
    tlFilter: "All", openTl: null,
    arch: "All", pfQuery: "",
    modal: null, mShare: "Share this file ↗",
    player: null,
    qi: 0, score: 0, streak: 0, best: parseInt(localStorage.getItem("bgf_best") || "0", 10) || 0,
    answered: false, chosen: -1, qShare: "Share my rank ↗",
    subscribed: false,
    navOpen: false, trailerOpen: false,
    seen: storeGet("bgf_seen", []) || [],
    soundOn: localStorage.getItem("bgf_sound") === "1",
    cipher: storeGet("bgf_cipher", null)
  };
  var revealed = new Set(storeGet("bgf_frags", []) || []);
  var durs = storeGet("bgf_durations", {}) || {};
  var quizSet = drawQuiz(QUIZ);
  var lastFocus = null;
  var alive = true;

  // ---------------------------------------------------------------- Rank / clearance
  function rank() {
    var d = revealed.size;
    return d >= TOTAL_FRAGS ? "CUSTODIAN OF THE RECORD" : d >= 12 ? "ARCHIVIST" : d >= 8 ? "KEEPER" : d >= 4 ? "READER" : "INITIATE";
  }
  function nextUnlockText() {
    var d = revealed.size;
    return d >= TOTAL_FRAGS ? "ARCHIVE COMPLETE — LETTER UNSEALED"
      : d >= 12 ? "NEXT: CUSTODIAN AT 16 · THE LETTER"
      : d >= 8 ? "NEXT: ARCHIVIST AT 12 · TRIAL Nº 11"
      : d >= 4 ? "NEXT: KEEPER AT 8 · CODEX Nº 12"
      : "NEXT: READER AT 4 FRAGMENTS";
  }
  function bestCipherStreak() {
    var ck = dayKey(), c = state.cipher;
    if (!c) return 0;
    if (c.d === ck) return c.streak;
    if (c.d === yesterKey() && c.ok) return c.streak;
    return 0;
  }
  function file021Unlocked() {
    return revealed.size >= 12 || (state.best || 0) >= 8 || bestCipherStreak() >= 5;
  }

  // ---------------------------------------------------------------- Sound synth
  var ac = null;
  function sfx(kind) {
    if (!state.soundOn) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") ac.resume();
      var t = ac.currentTime;
      function tone(f0, f1, dur, type, vol, at) {
        var o = ac.createOscillator(), g = ac.createGain();
        o.type = type; o.frequency.setValueAtTime(f0, t + at);
        o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + at + dur);
        g.gain.setValueAtTime(vol, t + at); g.gain.exponentialRampToValueAtTime(.0001, t + at + dur);
        o.connect(g); g.connect(ac.destination); o.start(t + at); o.stop(t + at + dur + .02);
      }
      if (kind === "stamp") {
        tone(150, 46, .15, "square", .10, 0);
        var b = ac.createBuffer(1, 2205, 22050), d = b.getChannelData(0);
        for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
        var n = ac.createBufferSource(); n.buffer = b;
        var g2 = ac.createGain(); g2.gain.setValueAtTime(.05, t); g2.gain.exponentialRampToValueAtTime(.0001, t + .1);
        n.connect(g2); g2.connect(ac.destination); n.start(t);
      } else if (kind === "right") { tone(523, 523, .09, "sine", .08, 0); tone(784, 784, .16, "sine", .08, .09); }
      else if (kind === "wrong") { tone(196, 128, .22, "sawtooth", .06, 0); }
    } catch (e) {}
  }

  // ---------------------------------------------------------------- Field-memo declassify
  function paintReveal(el) {
    el.style.color = "#f2d391"; el.style.background = "rgba(201,168,76,.10)";
    el.style.boxShadow = "inset 0 0 0 1px rgba(201,168,76,.45)"; el.style.textShadow = "0 0 22px rgba(232,192,112,.5)";
    el.style.cursor = "default"; el.style.animation = "none";
  }
  function syncFragDom() {
    document.querySelectorAll("[data-frag]").forEach(function (el) {
      if (revealed.has(el.dataset.frag)) paintReveal(el);
    });
  }
  function reveal(el) {
    var id = el.dataset.frag;
    if (!id || revealed.has(id)) return;
    revealed.add(id); paintReveal(el); sfx("stamp");
    storeSet("bgf_frags", Array.from(revealed));
    onClearanceChanged();
  }
  function onClearanceChanged() {
    renderHud();
    renderDossierFeaturedAndGrid(); // file021 slot depends on clearance
    renderCodexKeeperSlot();
    renderSealedLetter();
  }
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-frag]");
    if (el) reveal(el);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var el = e.target.closest && e.target.closest("[data-frag]");
    if (el) { e.preventDefault(); reveal(el); }
  });

  // ---------------------------------------------------------------- HUD widget
  function renderHud() {
    var d = revealed.size, pct = Math.round((d / TOTAL_FRAGS) * 100);
    $("hud-rank").textContent = rank();
    $("hud-bar").style.width = pct + "%";
    $("hud-count").textContent = d;
    $("hud-next").textContent = nextUnlockText();
    var btn = $("hud-sound");
    btn.setAttribute("aria-label", state.soundOn ? "Sound on — click to mute" : "Sound off — click to enable");
    btn.title = btn.getAttribute("aria-label");
    btn.style.color = state.soundOn ? "#e8c070" : "#666c74";
    btn.style.borderColor = "rgba(201,168,76," + (state.soundOn ? ".6" : ".3") + ")";
  }
  $("bgf-hud").addEventListener("click", function (e) {
    if (e.target.closest("#hud-sound")) return;
    var el = $("bgf-memo"); if (el) window.scrollTo({top: el.offsetTop - 80, behavior: "smooth"});
  });
  $("bgf-hud").addEventListener("keydown", function (e) { if (e.key === "Enter") $("bgf-hud").click(); });
  $("hud-sound").addEventListener("click", function (e) {
    e.stopPropagation();
    state.soundOn = !state.soundOn;
    localStorage.setItem("bgf_sound", state.soundOn ? "1" : "0");
    renderHud();
    if (state.soundOn) sfx("right");
  });

  // ---------------------------------------------------------------- Fact ticker
  var tickerIdx = 0;
  function scheduleTicker() {
    var secs = Math.max(3, CFG.factSeconds || 7);
    setTimeout(function () {
      if (!alive) return;
      var el = $("bgf-ticker");
      if (el) {
        el.style.opacity = 0;
        setTimeout(function () {
          tickerIdx = (tickerIdx + 1) % FACTS.length;
          if (el) { el.textContent = FACTS[tickerIdx]; el.style.opacity = 1; }
        }, 450);
      }
      scheduleTicker();
    }, secs * 1000);
  }

  // ---------------------------------------------------------------- Countdown
  function nextDrop() {
    var ny;
    try { ny = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"})); } catch (e) { ny = new Date(); }
    for (var i = 0; i < 10; i++) {
      var d = new Date(ny.getFullYear(), ny.getMonth(), ny.getDate() + i, 14, 0, 0);
      if ((d.getDay() === 2 || d.getDay() === 5) && d > ny) {
        var ms = d - ny;
        return {d: Math.floor(ms / 864e5), h: Math.floor(ms / 36e5) % 24, m: Math.floor(ms / 6e4) % 60, s: Math.floor(ms / 1e3) % 60};
      }
    }
    return {d: 0, h: 0, m: 0, s: 0};
  }
  function tick() {
    var t = nextDrop();
    $("bgf-cd-d").textContent = pad2(t.d); $("bgf-cd-h").textContent = pad2(t.h);
    $("bgf-cd-m").textContent = pad2(t.m); $("bgf-cd-s").textContent = pad2(t.s);
  }

  // ---------------------------------------------------------------- Dust canvas
  function initDust() {
    var c = $("bgf-dust"); if (!c || reduced()) return;
    var ctx = c.getContext("2d"), stars = [];
    function resize() {
      c.width = innerWidth; c.height = innerHeight;
      stars = Array.from({length: Math.min(130, innerWidth / 12 | 0)}, function () {
        return {x: Math.random() * c.width, y: Math.random() * c.height, r: Math.random() * 1.3 + .2, a: Math.random() * 6, s: Math.random() * .02 + .004};
      });
    }
    function draw() {
      if (!alive) return;
      ctx.clearRect(0, 0, c.width, c.height);
      stars.forEach(function (st) {
        st.a += st.s;
        var al = (Math.sin(st.a) + 1) / 2 * .55 + .08;
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 7);
        ctx.fillStyle = "rgba(232,192,112," + al.toFixed(3) + ")"; ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    resize(); draw(); addEventListener("resize", resize);
  }

  // ---------------------------------------------------------------- Scroll color grade
  function initGrade() {
    if (reduced()) return;
    var m = $("bgf-grade"); if (!m) return;
    m.style.transition = "filter 1.2s ease";
    var F = {bw: "saturate(.28) contrast(1.05) brightness(.94)", "return": "saturate(1.12)", amber: "none"};
    var queued = false;
    function apply() {
      queued = false;
      var mid = innerHeight / 2, grade = "amber";
      var secs = m.querySelectorAll("[data-screen-label]");
      for (var i = 0; i < secs.length; i++) {
        var r = secs[i].getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) { grade = secs[i].dataset.grade || "amber"; break; }
      }
      var f = F[grade] || "none";
      if (m.style.filter !== f) m.style.filter = f;
    }
    var onGrade = function () { if (!queued) { queued = true; requestAnimationFrame(apply); } };
    addEventListener("scroll", onGrade, {passive: true});
    addEventListener("resize", onGrade);
    onGrade();
  }

  // ---------------------------------------------------------------- Hero "EDITED." reveal
  function revealEditedHero() {
    function go() {
      var el = $("bgf-edited"); if (!el) return;
      el.style.color = "inherit"; el.style.background = "rgba(201,168,76,.10)"; el.style.boxShadow = "inset 0 0 0 1px rgba(201,168,76,.45)";
    }
    if (reduced()) go(); else setTimeout(go, 900);
  }

  // ---------------------------------------------------------------- Nav (mobile menu)
  var burger = $("bgf-burger"), mobileMenu = $("bgf-mobilemenu");
  function setNav(open) {
    state.navOpen = open;
    mobileMenu.hidden = !open;
    burger.setAttribute("aria-expanded", String(open));
  }
  burger.addEventListener("click", function () { setNav(!state.navOpen); });
  mobileMenu.querySelectorAll("[data-close-nav]").forEach(function (a) { a.addEventListener("click", function () { setNav(false); }); });

  // ---------------------------------------------------------------- Chip style helper
  function chipStyleAttr(active) {
    return active
      ? "background:linear-gradient(92deg,#e8c070,#9a6a20);color:#141519;font-weight:700;border:1px solid transparent;padding:8px 15px;border-radius:999px;font-size:13px;cursor:pointer;font-family:'Work Sans',sans-serif;white-space:nowrap"
      : "background:#121316;color:#c4c9d0;font-weight:500;border:1px solid rgba(201,168,76,.2);padding:8px 15px;border-radius:999px;font-size:13px;cursor:pointer;font-family:'Work Sans',sans-serif;white-space:nowrap";
  }
  function sealStyleAttr(i, size) {
    var pair = ACCENTS[i % ACCENTS.length], c1 = pair[0], c2 = pair[1];
    return "width:" + size + "px;height:" + size + "px;border-radius:50%;position:relative;overflow:hidden;display:grid;place-items:center;font-family:'Bebas Neue',sans-serif;font-size:" + Math.round(size * .3) + "px;letter-spacing:2px;color:" + c1 + ";flex-shrink:0;margin:0 auto;" +
      "background:radial-gradient(circle at 35% 28%, rgba(232,192,112,.16), #000000 62%);" +
      "border:1px dashed " + c1 + "88;" +
      "box-shadow:inset 0 0 0 3px #000000, inset 0 0 0 4px " + c1 + "66, inset 0 0 0 12px rgba(201,168,76,.06), 0 12px 34px rgba(0,0,0,.5), 0 0 0 1px " + c2 + "44";
  }

  // ---------------------------------------------------------------- Hero: trailer + latest + counts
  function heroTrailerVid() { return (CFG.trailerVideoId || "").trim() || state.heroVid || state.latestVid || ""; }
  function renderTrailer() {
    var slot = $("bgf-trailer-slot"), tvid = heroTrailerVid();
    if (state.trailerOpen && tvid) {
      slot.innerHTML = '<div style="aspect-ratio:16/9;border-radius:14px;overflow:hidden;border:1px solid rgba(201,168,76,.4);box-shadow:0 24px 60px rgba(0,0,0,.6);background:#000">' +
        '<iframe src="https://www.youtube-nocookie.com/embed/' + tvid + '?autoplay=1&rel=0" title="The Black Genius Files — watch on this page" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="width:100%;height:100%;border:0;display:block"></iframe></div>';
    } else {
      var thumb = tvid ? '<img src="https://i.ytimg.com/vi/' + tvid + '/hqdefault.jpg" alt="" loading="lazy" referrerpolicy="no-referrer" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">' : "";
      slot.innerHTML = '<button id="bgf-trailer-btn" aria-label="Play the latest file on this page" class="hv-trailer" style="position:relative;display:block;width:100%;aspect-ratio:16/9;border-radius:14px;overflow:hidden;border:1px solid rgba(201,168,76,.4);cursor:pointer;padding:0;background:#010101;box-shadow:0 24px 60px rgba(0,0,0,.55);transition:transform .2s,border-color .2s">' +
        '<div style="position:absolute;inset:0;background:radial-gradient(340px 200px at 30% 20%,rgba(150,16,20,.42),transparent 65%),linear-gradient(150deg,#30353c,#121316)"></div>' + thumb +
        '<div style="position:absolute;inset:0;background:repeating-linear-gradient(180deg,rgba(0,0,0,0) 0 3px,rgba(0,0,0,.14) 3px 4px)"></div>' +
        '<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.1) 30%,rgba(0,0,0,.72))"></div>' +
        '<span style="position:absolute;top:44%;left:50%;transform:translate(-50%,-50%);width:64px;height:64px;border-radius:50%;background:rgba(0,0,0,.5);border:2px solid #e8c070;display:grid;place-items:center;color:#e8c070;font-size:22px">▶</span>' +
        '<span style="position:absolute;left:14px;right:14px;bottom:11px;font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:2px;color:#e8c070;text-align:center">PLAY THE LATEST FILE — RIGHT HERE</span></button>';
      var btn = $("bgf-trailer-btn");
      btn.addEventListener("click", function () {
        var v = heroTrailerVid();
        if (v) { state.trailerOpen = true; renderTrailer(); } else window.open(YT.url, "_blank", "noopener,noreferrer");
      });
    }
  }
  function renderLatest() {
    var latest = state.episodes[0] || {};
    $("bgf-latest-num").textContent = pad2(latest.id || 0);
    $("bgf-latest-title").textContent = latest.title || "—";
    var img = $("bgf-latest-thumb");
    if (latest.thumb) { img.src = latest.thumb; img.hidden = false; } else { img.hidden = true; }
  }
  $("bgf-latest").addEventListener("click", function () {
    var latest = state.episodes[0] || {};
    if (latest.vid) openPlayerObj({vid: latest.vid, title: latest.title, num: pad2(latest.id)});
    else window.open(latest.url || YT.url, "_blank", "noopener,noreferrer");
  });
  $("bgf-latest").addEventListener("keydown", function (e) { if (e.key === "Enter") $("bgf-latest").click(); });

  function renderHeroStats() {
    $("bgf-epcount").textContent = state.episodes.length;
    $("bgf-figcount").textContent = FIGURES.length;
    var sub = (CFG.subscriberCount || "").trim();
    if (sub) { $("bgf-subcount").textContent = sub; $("bgf-subcount-wrap").hidden = false; } else { $("bgf-subcount-wrap").hidden = true; }
    $("bgf-countdown-wrap").hidden = !(CFG.showCountdown ?? true);
  }

  // ---------------------------------------------------------------- Episode archive
  var posterGrads = ["#30353c", "#3a4048", "#2a2f36", "#23272e", "#2e333b", "#1e1f23"];
  function durOf(e) { return (e.vid && durs[e.vid] != null) ? durs[e.vid] : null; }
  function isShort(e) { var d = durOf(e); return d != null && d > 0 && d < 120; }
  function figOf(id) { return FIGURES.filter(function (f) { return f.id === id; })[0]; }
  function photoOf(id) { return "assets/dossiers/" + id + ".jpg"; }

  function epCardHtml(e, isSeenSet) {
    var seen = isSeenSet.has(e.vid);
    var stampText = seen ? "REVIEWED ✓" : (e.live ? "DECLASSIFIED" : "ON FILE");
    var stampColor = seen ? "#9ccc9f" : "#c9a84c";
    var stampBorder = seen ? "rgba(129,199,132,.55)" : "rgba(201,168,76,.5)";
    var fig = e.figureId ? figOf(e.figureId) : null;
    var feat = fig ? "Featuring " + esc(fig.name) : "The Black Genius Files";
    var face = fig ? '<img src="' + photoOf(fig.id) + '" alt="Portrait of ' + esc(fig.name) + '" loading="lazy" onerror="this.style.display=\'none\'" style="position:absolute;left:12px;top:12px;width:46px;height:46px;border-radius:50%;object-fit:cover;object-position:center 25%;border:2px solid rgba(232,192,112,.8);box-shadow:0 6px 18px rgba(0,0,0,.65);filter:sepia(.28) saturate(.9)">' : "";
    var dur = fmtDur(durOf(e));
    var when = fmtWhen(e.published);
    var thumbImg = e.thumb ? '<img src="' + e.thumb + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 7s cubic-bezier(.19,.6,.32,1)">' : "";
    return '<article class="hv-lift-card hv-thumb" data-open-ep="' + esc(e.vid || "") + '" data-open-url="' + esc(e.url || "") + '" data-title="' + esc(e.title) + '" data-num="' + pad2(e.id) + '" role="link" aria-label="Watch on YouTube" tabindex="0" style="cursor:pointer;border:1px solid rgba(201,168,76,.14);border-radius:14px;overflow:hidden;background:linear-gradient(165deg,#121316,#000000);display:flex;flex-direction:column;transition:transform .22s cubic-bezier(.22,.61,.36,1),border-color .2s,box-shadow .25s">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 14px;border-bottom:1px solid rgba(201,168,76,.12)">' +
        '<span style="font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:2px;color:#a9aeb6">FILE Nº ' + pad2(e.id) + '</span>' +
        '<span style="font-family:\'Special Elite\',monospace;font-size:9.5px;letter-spacing:1.5px;border-radius:4px;padding:1px 7px;transform:rotate(3deg);white-space:nowrap;border:1.5px solid ' + stampBorder + ';color:' + stampColor + '">' + stampText + '</span>' +
      '</div>' +
      '<div style="position:relative;aspect-ratio:16/9;overflow:hidden;display:grid;place-items:center">' +
        '<div style="position:absolute;inset:0;background:linear-gradient(150deg,' + posterGrads[Math.abs(e.id) % 6] + ',#000000)"></div>' + thumbImg +
        '<div style="position:absolute;inset:0;background:repeating-linear-gradient(180deg,rgba(0,0,0,0) 0 3px,rgba(0,0,0,.12) 3px 4px)"></div>' +
        '<div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 34%,rgba(0,0,0,.72))"></div>' +
        '<span class="hv-play" style="position:absolute;top:42%;left:50%;transform:translate(-50%,-50%);width:52px;height:52px;border-radius:50%;background:rgba(0,0,0,.45);border:2px solid #9e1418;display:grid;place-items:center;color:#9e1418;font-size:17px;transition:transform .2s,background .2s">▶</span>' +
        (dur ? '<span style="position:absolute;right:10px;top:10px;background:rgba(0,0,0,.82);color:#eef1f4;font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.5px;padding:2px 7px;border-radius:5px;border:1px solid rgba(201,168,76,.4)">' + dur + '</span>' : "") +
        face +
        '<h4 style="font-family:\'Playfair Display\',Georgia,serif;font-weight:800;font-size:17px;color:#fff;text-shadow:0 2px 18px rgba(0,0,0,.85);position:absolute;left:15px;right:15px;bottom:12px;margin:0;line-height:1.25">' + esc(e.title) + '</h4>' +
      '</div>' +
      '<div style="padding:14px 16px 18px;display:flex;flex-direction:column;gap:8px;flex:1">' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
          '<span style="font-size:10.5px;letter-spacing:2px;text-transform:uppercase;color:#c9a84c;font-weight:700">' + esc((e.tag || "File").toUpperCase()) + '</span>' +
          (e.hook ? '<span style="font-size:9.5px;letter-spacing:1.5px;text-transform:uppercase;color:#cdd2d8;border:1px solid rgba(201,168,76,.25);padding:2px 9px;border-radius:999px;white-space:nowrap">' + esc(e.hook) + '</span>' : "") +
          (when ? '<span style="margin-left:auto;font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:1px;color:#8b9099;white-space:nowrap">' + esc(when) + '</span>' : "") +
        '</div>' +
        '<p style="font-family:\'Crimson Pro\',Georgia,serif;font-size:14.5px;color:#adb2ba;margin:0;flex:1;line-height:1.55">' + esc(e.desc) + '</p>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:4px;font-size:12px;color:#969ba3"><span>' + esc(feat) + '</span><span style="color:#e8c070;font-weight:700">WATCH ▶</span></div>' +
      '</div></article>';
  }
  function shortCardHtml(e, isSeenSet) {
    var reviewed = isSeenSet.has(e.vid);
    var dur = fmtDur(durOf(e));
    var thumbImg = e.thumb ? '<img src="' + e.thumb + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">' : "";
    return '<article class="hv-lift-tile" data-open-ep="' + esc(e.vid || "") + '" data-open-url="' + esc(e.url || "") + '" data-title="' + esc(e.title) + '" data-num="' + pad2(e.id) + '" role="button" aria-label="Play short" tabindex="0" style="flex:0 0 164px;scroll-snap-align:start;position:relative;aspect-ratio:9/16;border-radius:14px;overflow:hidden;border:1px solid rgba(201,168,76,.16);cursor:pointer;background:#010101;transition:transform .2s,border-color .2s">' +
      '<div style="position:absolute;inset:0;background:linear-gradient(150deg,' + posterGrads[Math.abs(e.id) % 6] + ',#000000)"></div>' + thumbImg +
      '<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05) 38%,rgba(0,0,0,.85))"></div>' +
      '<span style="position:absolute;top:14px;left:14px;font-family:\'Special Elite\',monospace;font-size:9px;letter-spacing:1.5px;color:#e8c070;background:rgba(0,0,0,.5);border:1px solid rgba(201,168,76,.4);border-radius:4px;padding:1px 6px">SHORT</span>' +
      (reviewed ? '<span style="position:absolute;top:13px;right:12px;color:#9ccc9f;font-size:14px">✓</span>' : "") +
      '<span class="hv-play" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:46px;height:46px;border-radius:50%;background:rgba(0,0,0,.5);border:2px solid #9e1418;display:grid;place-items:center;color:#9e1418;font-size:15px;transition:background .2s,color .2s">▶</span>' +
      (dur ? '<span style="position:absolute;right:10px;bottom:46px;background:rgba(0,0,0,.82);color:#eef1f4;font-family:\'Special Elite\',monospace;font-size:10px;padding:1px 6px;border-radius:4px;border:1px solid rgba(201,168,76,.35)">' + dur + '</span>' : "") +
      '<h4 style="position:absolute;left:12px;right:12px;bottom:10px;margin:0;font-family:\'Playfair Display\',Georgia,serif;font-weight:700;font-size:13px;color:#fff;line-height:1.25;text-shadow:0 2px 12px rgba(0,0,0,.9);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">' + esc(e.title) + '</h4>' +
    '</article>';
  }

  function renderEpisodes() {
    var epTags = ["All"].concat(Array.from(new Set(state.episodes.map(function (e) { return e.tag; }).filter(Boolean))));
    var q = state.epQuery.trim().toLowerCase();
    var seenSet = new Set(state.seen || []);
    var eps = state.episodes.filter(function (e) {
      return (state.epFilter === "All" || e.tag === state.epFilter) &&
        (!q || (e.title + " " + e.desc + " " + (e.tag || "")).toLowerCase().indexOf(q) !== -1);
    });
    var films = eps.filter(function (e) { return !isShort(e); });
    var shortsAll = state.episodes.filter(isShort);
    var shorts = shortsAll.slice(0, 30);
    var showShorts = shorts.length > 0 && !q && state.epFilter === "All";
    var showChips = epTags.length > 2;

    var note = state.netState === "live"
      ? "◆ LIVE ARCHIVE — " + state.episodes.length + " files" + (shortsAll.length ? " incl. " + shortsAll.length + " shorts" : "") + ", synced live from @theblackgeniusfiles."
      : state.netState === "cache"
      ? "◆ CACHED ARCHIVE — showing your last synced files; reconnecting to @theblackgeniusfiles…"
      : "◆ CONNECTED TO @THEBLACKGENIUSFILES — live files load when online. Below: the launch slate from the 100-episode production Bible.";
    $("ep-syncnote").textContent = note;

    $("ep-chips").innerHTML = showChips ? epTags.map(function (t) {
      return '<button data-ep-chip="' + esc(t) + '" style="' + chipStyleAttr(t === state.epFilter) + '">' + esc(t) + '</button>';
    }).join("") : "";

    $("ep-grid").innerHTML = films.map(function (e) { return epCardHtml(e, seenSet); }).join("");
    $("ep-none").hidden = !(films.length === 0 && !showShorts);

    $("ep-shorts-wrap").hidden = !showShorts;
    if (showShorts) {
      $("ep-shorts-note").textContent = "◆ " + shortsAll.length + " SHORT FILES · SCROLL →";
      $("ep-shorts-rail").innerHTML = shorts.map(function (e) { return shortCardHtml(e, seenSet); }).join("");
    }
  }
  $("ep-search").addEventListener("input", function (e) { state.epQuery = e.target.value; renderEpisodes(); });
  $("ep-chips").addEventListener("click", function (e) {
    var b = e.target.closest("[data-ep-chip]"); if (!b) return;
    state.epFilter = b.dataset.epChip; renderEpisodes();
  });
  function wireEpisodeOpens(container) {
    container.addEventListener("click", function (e) {
      var card = e.target.closest("[data-open-ep]"); if (!card) return;
      var vid = card.dataset.openEp;
      if (vid) openPlayerObj({vid: vid, title: card.dataset.title, num: card.dataset.num});
      else window.open(card.dataset.openUrl || YT.url, "_blank", "noopener,noreferrer");
    });
    container.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      var card = e.target.closest("[data-open-ep]"); if (card) card.click();
    });
  }
  wireEpisodeOpens($("ep-grid"));
  wireEpisodeOpens($("ep-shorts-rail"));

  // ---------------------------------------------------------------- Timeline
  function renderTimelineChips() {
    $("tl-chips").innerHTML = ERAS.map(function (pair) {
      return '<button data-tl-chip="' + esc(pair[0]) + '" style="' + chipStyleAttr(pair[0] === state.tlFilter) + '">' + esc(pair[1]) + '</button>';
    }).join("");
  }
  function renderTimeline() {
    renderTimelineChips();
    var items = TIMELINE.map(function (t, i) { return {t: t, i: i}; }).filter(function (o) { return state.tlFilter === "All" || o.t.era === state.tlFilter; });
    $("tl-list").innerHTML = items.map(function (o) {
      var t = o.t, i = o.i, open = state.openTl === i, g = t.g;
      var yr = "font-family:'Bebas Neue',sans-serif;font-size:24px;text-align:right;padding-right:14px;line-height:1.2;color:" + (g === "bw" ? "#8b9099" : "#e8c070") + ";text-shadow:" + (g === "return" ? "0 0 18px rgba(232,192,112,.45)" : "none");
      var dot = "width:14px;height:14px;border-radius:50%;display:block;background:" + (g === "return" ? "#c9a84c" : "#000000") + ";border:3px solid " + (g === "bw" ? "#8b9099" : g === "return" ? "#e8c070" : "#c9a84c") + ";box-shadow:0 0 0 4px rgba(201,168,76,.12);transition:transform .2s;transform:" + (open ? "scale(1.2)" : "none");
      var card = "background:#101114;border:1px solid " + (open ? "rgba(232,192,112,.45)" : g === "bw" ? "rgba(255,255,255,.09)" : "rgba(201,168,76,.15)") + ";border-radius:13px;padding:14px 18px;transition:border-color .2s, transform .2s;filter:" + (g === "bw" ? "saturate(.3)" : "none") + ";transform:" + (open ? "translateX(4px)" : "none");
      var detail = "max-height:" + (open ? "240px" : "0") + ";overflow:hidden;transition:max-height .38s cubic-bezier(.22,.61,.36,1), margin-top .3s;margin-top:" + (open ? "10px" : "0");
      var figLink = t.fig ? '<span data-open-fig="' + esc(t.fig) + '" role="button" style="color:#e8c070;font-weight:600;border-bottom:1px solid rgba(201,168,76,.4);cursor:pointer;white-space:nowrap">Open the Genius File ↗</span>' : "";
      return '<div data-tl-toggle="' + i + '" role="button" aria-expanded="' + open + '" tabindex="0" style="display:grid;grid-template-columns:112px 34px 1fr;align-items:start;padding-bottom:24px;cursor:pointer">' +
        '<div style="' + yr + '">' + esc(t.y) + '</div>' +
        '<div style="display:flex;justify-content:center;padding-top:7px;position:relative;z-index:2"><span style="' + dot + '"></span></div>' +
        '<div style="' + card + '">' +
          '<div style="font-family:\'Special Elite\',monospace;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#c9a84c;margin-bottom:6px">' + esc(eraLabel(t.era).toUpperCase()) + '</div>' +
          '<h3 style="font-family:\'Playfair Display\',Georgia,serif;font-size:17px;color:#fff;font-weight:700;margin:0">' + esc(t.t) + '</h3>' +
          '<div style="' + detail + '"><p style="font-family:\'Crimson Pro\',Georgia,serif;font-size:15px;color:#c4c9d0;line-height:1.6;margin:0">' + esc(t.d) + ' ' + figLink + '</p></div>' +
        '</div></div>';
    }).join("");
  }
  $("tl-chips").addEventListener("click", function (e) {
    var b = e.target.closest("[data-tl-chip]"); if (!b) return;
    state.tlFilter = b.dataset.tlChip; state.openTl = null; renderTimeline();
  });
  $("tl-list").addEventListener("click", function (e) {
    var figEl = e.target.closest("[data-open-fig]");
    if (figEl) { e.stopPropagation(); openModal(figEl.dataset.openFig); return; }
    var row = e.target.closest("[data-tl-toggle]"); if (!row) return;
    var i = parseInt(row.dataset.tlToggle, 10);
    state.openTl = state.openTl === i ? null : i;
    renderTimeline();
  });
  $("tl-list").addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    var row = e.target.closest("[data-tl-toggle]"); if (row) row.click();
  });

  // ---------------------------------------------------------------- Lineages + dossiers
  function scrollToDossiers() {
    var el = $("dossiers"); if (el) window.scrollTo({top: el.offsetTop - 70, behavior: "smooth"});
  }
  function renderLineages() {
    var archCounts = {};
    FIGURES.forEach(function (f) { archCounts[f.arch] = (archCounts[f.arch] || 0) + 1; });
    $("lineage-grid").innerHTML = Object.keys(ARCHDEF).map(function (k) {
      var active = state.arch === k;
      var style = "text-align:left;background:" + (active ? "rgba(201,168,76,.12)" : "linear-gradient(165deg,#121316,#000000)") + ";border:1px solid " + (active ? "rgba(232,192,112,.6)" : "rgba(201,168,76,.16)") + ";border-radius:14px;padding:20px 18px;cursor:pointer;font-family:'Work Sans',sans-serif;transition:border-color .2s, transform .2s";
      return '<button data-lineage="' + esc(k) + '" style="' + style + '">' +
        '<span style="font-family:\'Bebas Neue\',sans-serif;font-size:21px;letter-spacing:2.5px;color:#e8c070;display:block">' + esc(k.toUpperCase()) + 'S</span>' +
        '<span style="font-family:\'Special Elite\',monospace;font-size:9.5px;letter-spacing:2px;color:#969ba3;display:block;margin:4px 0 8px">' + (archCounts[k] || 0) + ' DOSSIERS</span>' +
        '<span style="font-family:\'Crimson Pro\',Georgia,serif;font-style:italic;font-size:13.5px;color:#adb2ba;display:block;line-height:1.5">' + esc(ARCHDEF[k]) + '</span>' +
      '</button>';
    }).join("");
  }
  $("lineage-grid").addEventListener("click", function (e) {
    var b = e.target.closest("[data-lineage]"); if (!b) return;
    var k = b.dataset.lineage;
    state.arch = state.arch === k ? "All" : k;
    renderLineages(); renderDossierFeaturedAndGrid();
    if (state.arch !== "All") scrollToDossiers();
  });

  function renderDossierChips() {
    var opts = ["All"].concat(Object.keys(ARCHDEF));
    $("pf-chips").innerHTML = opts.map(function (a) {
      return '<button data-pf-chip="' + esc(a) + '" style="' + chipStyleAttr(state.arch === a) + '">' + (a === "All" ? "All Lineages" : esc(a) + "s") + '</button>';
    }).join("");
  }
  function dossierCardHtml(f, i) {
    return '<article class="hv-lift-card" data-open-fig="' + esc(f.id) + '" role="button" aria-label="Open dossier" tabindex="0" style="background:linear-gradient(165deg,#121316,#000000);border:1px solid rgba(201,168,76,.14);border-radius:14px;padding:24px 18px;cursor:pointer;text-align:center;transition:transform .22s cubic-bezier(.22,.61,.36,1),border-color .2s,box-shadow .25s">' +
      '<div style="' + sealStyleAttr(i, 92) + '">' + esc(initials(f.name)) + '<img src="' + photoOf(f.id) + '" alt="' + esc(f.name) + ' — archival portrait" loading="lazy" onerror="this.style.display=\'none\'" style="position:absolute;inset:5px;width:calc(100% - 10px);height:calc(100% - 10px);border-radius:50%;object-fit:cover;object-position:center 25%;filter:sepia(.3) saturate(.88) contrast(1.06) brightness(.96)"></div>' +
      '<h3 style="font-family:\'Playfair Display\',Georgia,serif;font-size:16px;color:#fff;font-weight:700;margin:14px 0 0">' + esc(f.name) + '</h3>' +
      '<div style="font-size:11px;color:#c9a84c;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin:5px 0 4px">' + esc(f.field) + '</div>' +
      '<div style="font-size:12px;color:#969ba3">' + esc(f.years) + '</div>' +
      '<span style="display:inline-block;font-family:\'Special Elite\',monospace;font-size:9px;letter-spacing:1.5px;color:#cdd2d8;border:1px solid rgba(201,168,76,.4);padding:2px 9px;border-radius:999px;margin-top:10px">' + esc(f.arch.toUpperCase()) + '</span>' +
    '</article>';
  }
  function file021SlotHtml() {
    if (file021Unlocked()) {
      var reason = revealed.size >= 12 ? "ARCHIVIST CLEARANCE" : (state.best || 0) >= 8 ? "A TRIALS STREAK OF " + state.best : "A CIPHER STREAK OF " + bestCipherStreak() + (bestCipherStreak() === 1 ? " DAY" : " DAYS");
      return '<article aria-label="File Nº 021 — Season Two teaser, unsealed" style="background:radial-gradient(360px 200px at 30% 15%,rgba(130,12,16,.28),transparent 62%),linear-gradient(165deg,#17181c,#0e0f11);border:1px solid rgba(232,192,112,.5);border-radius:14px;padding:24px 18px;text-align:center;position:relative;overflow:hidden;box-shadow:0 0 44px rgba(232,192,112,.12)">' +
        '<span style="position:absolute;top:12px;right:12px;font-family:\'Special Elite\',monospace;font-size:8.5px;letter-spacing:1.5px;color:#e8c070;border:1.5px solid rgba(201,168,76,.6);border-radius:4px;padding:1px 7px;transform:rotate(6deg)">CLEARANCE GRANTED</span>' +
        '<div style="width:92px;height:92px;border-radius:50%;border:1.5px solid rgba(232,192,112,.6);display:grid;place-items:center;margin:0 auto;font-family:\'Bebas Neue\',sans-serif;font-size:30px;color:#e8c070;background:radial-gradient(circle at 35% 28%,rgba(232,192,112,.22),#000000 66%)">◆</div>' +
        '<div style="font-size:11px;color:#c9a84c;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin:14px 0 4px">File Nº 021 · Season Two</div>' +
        '<p style="font-family:\'Crimson Pro\',Georgia,serif;font-size:13.5px;color:#c4c9d0;line-height:1.5;margin:0 0 12px;text-wrap:pretty">You cleared the threshold. Nº 021 opens the next season — a mind the record buried twice. Identity stays sealed until launch; you\'ll be first through the door.</p>' +
        '<button data-scroll-subscribe style="display:inline-flex;align-items:center;gap:7px;color:#e8c070;font-weight:700;font-size:13px;border:1px solid rgba(201,168,76,.4);padding:8px 16px;border-radius:999px;background:none;cursor:pointer;font-family:\'Work Sans\',sans-serif;transition:background .2s,color .2s" class="hv-fill">Get the drop →</button>' +
        '<div style="font-family:\'Special Elite\',monospace;font-size:8.5px;letter-spacing:1.5px;color:#7c828b;margin-top:12px">UNSEALED BY ' + esc(reason) + '</div>' +
      '</article>';
    }
    return '<article aria-label="Sealed dossier — coming in Season Two" style="background:rgba(0,0,0,.5);border:1px dashed rgba(201,168,76,.35);border-radius:14px;padding:24px 18px;text-align:center;position:relative;overflow:hidden">' +
      '<div style="width:92px;height:92px;border-radius:50%;border:1.5px dashed rgba(201,168,76,.5);display:grid;place-items:center;margin:0 auto;font-family:\'Bebas Neue\',sans-serif;font-size:26px;color:#727880">?</div>' +
      '<h3 style="font-family:\'Playfair Display\',Georgia,serif;font-size:16px;color:#969ba3;font-weight:700;margin:14px 0 0">█████ ████████</h3>' +
      '<div style="font-size:11px;color:#c9a84c;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin:5px 0 4px">File Nº 021</div>' +
      '<div style="font-size:12px;color:#969ba3">Raise clearance to unseal</div>' +
      '<span style="display:inline-block;font-family:\'Special Elite\',monospace;font-size:9px;letter-spacing:1.5px;color:#c25c3a;border:1px solid rgba(194,92,58,.5);padding:2px 9px;border-radius:999px;margin-top:10px">SEALED · SEASON TWO</span>' +
    '</article>';
  }
  function renderDossierFeaturedAndGrid() {
    renderDossierChips();
    var day = Math.floor(Date.now() / 864e5);
    var fi = ((day % FIGURES.length) + FIGURES.length) % FIGURES.length, ff = FIGURES[fi];
    $("dossier-featured").innerHTML =
      '<div data-open-fig="' + esc(ff.id) + '" style="cursor:pointer;' + sealStyleAttr(fi, 140).replace("margin:0 auto", "margin:0") + '">' + esc(initials(ff.name)) + '<img src="' + photoOf(ff.id) + '" alt="' + esc(ff.name) + ' — archival portrait" loading="lazy" onerror="this.style.display=\'none\'" style="position:absolute;inset:6px;width:calc(100% - 12px);height:calc(100% - 12px);border-radius:50%;object-fit:cover;object-position:center 25%;filter:sepia(.3) saturate(.88) contrast(1.06) brightness(.96)"></div>' +
      '<div style="flex:1;min-width:260px">' +
        '<div style="font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:3px;color:#c9a84c;margin-bottom:6px">◆ GENIUS OF THE DAY</div>' +
        '<h3 style="font-family:\'Playfair Display\',Georgia,serif;font-size:27px;color:#fff;font-weight:800;margin:0 0 4px">' + esc(ff.name) + '</h3>' +
        '<div style="font-size:11.5px;color:#c9a84c;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:10px">' + esc(ff.field) + ' · ' + esc(ff.arch) + ' · ' + esc(ff.era === "CivilRights" ? "Civil Rights" : ff.era) + ' · ' + esc(ff.years) + '</div>' +
        '<p style="font-family:\'Crimson Pro\',Georgia,serif;color:#c4c9d0;font-size:15.5px;line-height:1.6;margin:0 0 14px;text-wrap:pretty">' + esc(ff.bio) + '</p>' +
        '<button data-open-fig="' + esc(ff.id) + '" style="display:inline-flex;align-items:center;gap:8px;color:#e8c070;font-weight:700;font-size:14px;cursor:pointer;background:none;border:1px solid rgba(201,168,76,.35);padding:10px 18px;border-radius:999px;font-family:\'Work Sans\',sans-serif;transition:background .2s,color .2s" class="hv-fill">Open the full dossier ↗</button>' +
      '</div>';
    var pq = state.pfQuery.trim().toLowerCase();
    var figs = FIGURES.map(function (f, i) { return {f: f, i: i}; }).filter(function (o) {
      var f = o.f;
      return (state.arch === "All" || f.arch === state.arch) &&
        (!pq || (f.name + " " + f.field + " " + f.era + " " + f.bio + " " + f.arch).toLowerCase().indexOf(pq) !== -1);
    });
    $("dossier-grid").innerHTML = figs.map(function (o) { return dossierCardHtml(o.f, o.i); }).join("") + file021SlotHtml();
    $("dossier-none").hidden = figs.length !== 0;
  }
  $("pf-search").addEventListener("input", function (e) { state.pfQuery = e.target.value; renderDossierFeaturedAndGrid(); });
  $("pf-chips").addEventListener("click", function (e) {
    var b = e.target.closest("[data-pf-chip]"); if (!b) return;
    state.arch = b.dataset.pfChip; renderLineages(); renderDossierFeaturedAndGrid();
  });
  function wireDossierOpens(container) {
    container.addEventListener("click", function (e) {
      if (e.target.closest("[data-scroll-subscribe]")) { var el = $("subscribe"); if (el) window.scrollTo({top: el.offsetTop - 70, behavior: "smooth"}); return; }
      var card = e.target.closest("[data-open-fig]"); if (!card) return;
      openModal(card.dataset.openFig);
    });
    container.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      var card = e.target.closest("[data-open-fig]"); if (card) card.click();
    });
  }
  wireDossierOpens($("dossier-featured"));
  wireDossierOpens($("dossier-grid"));

  // ---------------------------------------------------------------- Book chapters
  function renderChapters() {
    $("book-chapters").innerHTML = CHAPTERS.map(function (c, i) {
      var barW = (56 + ((i * 37) % 64)) + "px";
      var body = c.t
        ? '<span style="font-family:\'Crimson Pro\',Georgia,serif;font-size:15px;color:#dfe3e8">' + esc(c.t) + '</span>'
        : '<span aria-label="Chapter title sealed" style="display:inline-block;height:12px;border-radius:3px;background:linear-gradient(180deg,#111215,#000000);box-shadow:inset 0 0 0 1px rgba(201,168,76,.22);width:' + barW + '"></span>';
      return '<div style="display:flex;gap:12px;align-items:center;padding:8px 2px;border-bottom:1px dashed rgba(201,168,76,.16)">' +
        '<span style="font-family:\'Special Elite\',monospace;font-size:11px;color:#c9a84c;width:28px;flex-shrink:0">' + esc(c.n) + '</span>' + body + '</div>';
    }).join("");
  }
  function renderBook() {
    var bookSt = CFG.bookStatus || "available";
    $("book-stamp").textContent = bookSt === "preorder" ? "PRE-ORDER OPEN" : bookSt === "coming" ? "COMING SOON" : "AVAILABLE NOW";
    var cta = $("book-cta");
    cta.textContent = (bookSt === "preorder" ? "Pre-order the Book" : "Get the Book") + " ↗";
    cta.href = CFG.bookUrl || "https://www.amazon.com/s?k=What+History+Buried+D.+Antione+Dixon";
    $("book-retail").style.display = bookSt === "coming" ? "none" : "flex";
    if (CFG.bnUrl) { $("book-bn").href = CFG.bnUrl; $("book-bn").hidden = false; }
    if (CFG.kindleUrl) { $("book-kindle").href = CFG.kindleUrl; $("book-kindle").hidden = false; }
    var gi = CFG.geniusIndexUrl;
    $("gi-cover-link").href = gi; $("gi-visit-link").href = gi; $("custodian-gi-link").href = gi; $("footer-gi-link").href = gi;
    $("book-cover-link").href = CFG.bookUrl;
    $("footer-yt-link").href = YT.url;
    document.querySelectorAll("[data-yt-sub]").forEach(function (a) { a.href = YT.sub; });
    renderChapters();
  }
  // Matches the official "What History Buried" site's Chapter 1 capture exactly:
  // a real (non-fetch) form POST to Kit, so Kit's own success redirect takes the
  // reader to that site's check-your-email.html — the delivery email carries the
  // Chapter 1 PDF, there is nothing to open client-side.
  $("ch-one-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var input = e.target.elements.email_address;
    var email = input ? input.value.trim() : "";
    var action = (CFG.chapterOneFormAction || "").trim();
    if (!action) { alert("Signup opens soon — the Recovery List isn't connected yet."); return; }
    if (!email || email.indexOf("@") < 1) { if (input) input.focus(); return; }
    var f = document.createElement("form");
    f.method = "post"; f.action = action; f.style.display = "none";
    var em = document.createElement("input"); em.name = "email_address"; em.value = email;
    f.appendChild(em);
    document.body.appendChild(f); f.submit();
  });

  // ---------------------------------------------------------------- Codex / cipher
  function cipherComputed() {
    var ck = dayKey(), cSeed = daySeed(ck), len = CIPHERS.length, cIdx = cSeed % len;
    var d1 = 1 + (cSeed % (len - 1)), d2 = 1 + ((cSeed >> 3) % (len - 1));
    if (d2 === d1) d2 = (d2 % (len - 1)) + 1;
    var cOptIdx = [cIdx, (cIdx + d1) % len, (cIdx + d2) % len];
    cOptIdx.sort(function (a, b) { return ((a * 7 + cSeed) % 13) - ((b * 7 + cSeed) % 13); });
    return {ck: ck, cSeed: cSeed, cIdx: cIdx, cOptIdx: cOptIdx};
  }
  function renderCodexKeeperSlot() {
    var unlocked = revealed.size >= 8;
    $("codex-keeper-slot").innerHTML = unlocked
      ? '<div style="background:linear-gradient(165deg,#17181c,#0e0f11);border:1px solid rgba(232,192,112,.5);border-radius:14px;padding:20px 14px;text-align:center;box-shadow:0 0 40px rgba(232,192,112,.1)"><svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true"><g stroke="#e8c070" stroke-width="1.6" stroke-linecap="round"><line x1="8" y1="11" x2="36" y2="11" opacity=".45"></line><line x1="8" y1="33" x2="30" y2="33" opacity=".45"></line><line x1="8" y1="39" x2="24" y2="39" opacity=".3"></line></g><rect x="8" y="17" width="28" height="9" rx="2" fill="#e8c070"></rect></svg><h4 style="font-family:\'Bebas Neue\',sans-serif;font-size:15px;letter-spacing:2px;color:#eef1f4;font-weight:400;margin:10px 0 2px">THE BLACK BAR</h4><p style="font-family:\'Crimson Pro\',Georgia,serif;font-style:italic;font-size:12.5px;color:#e8c070;margin:0">The edit, made visible</p></div>'
      : '<div style="background:rgba(0,0,0,.5);border:1px dashed rgba(201,168,76,.3);border-radius:14px;padding:20px 14px;text-align:center"><div style="font-size:22px;color:#c9a84c;height:44px;display:grid;place-items:center">◆</div><h4 style="font-family:\'Bebas Neue\',sans-serif;font-size:15px;letter-spacing:2px;color:#969ba3;font-weight:400;margin:10px 0 2px">SEALED</h4><p style="font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:1px;color:#969ba3;margin:0">KEEPER CLEARANCE — 8 FRAGMENTS</p></div>';
  }
  function renderCipher() {
    var c = cipherComputed(), cSym = CIPHERS[c.cIdx];
    var cSaved = state.cipher && state.cipher.d === c.ck ? state.cipher : null;
    var streak = bestCipherStreak();
    $("cipher-glyph").innerHTML = '<svg viewBox="0 0 44 44" width="42" height="42" aria-hidden="true">' + cSym.svg + "</svg>";
    $("cipher-date").textContent = c.ck;
    $("cipher-streak").textContent = streak + (streak === 1 ? " DAY" : " DAYS");
    $("cipher-open").hidden = !!cSaved;
    $("cipher-done").hidden = !cSaved;
    if (cSaved) {
      $("cipher-result").textContent = cSaved.ok
        ? "◆ Decoded. " + cSym.n + " — " + cSym.m.toLowerCase() + "."
        : "◆ Not this time. The symbol was " + cSym.n + " — " + cSym.m.toLowerCase() + ".";
    } else {
      $("cipher-opts").innerHTML = c.cOptIdx.map(function (ix) {
        var right = ix === c.cIdx, done = !!cSaved, pickedThis = cSaved && cSaved.pick === ix;
        var style = "background:#17181c;border:1px solid rgba(201,168,76,.25);color:#dfe3e8;padding:9px 16px;border-radius:999px;font-size:13.5px;cursor:" + (done ? "default" : "pointer") + ";font-family:'Work Sans',sans-serif;transition:border-color .2s,background .2s";
        if (done) {
          if (right) style = "background:rgba(46,125,50,.18);border:1px solid rgba(129,199,132,.6);color:#c8e6c9;" + style;
          else if (pickedThis) style = "background:rgba(183,28,28,.18);border:1px solid rgba(229,115,115,.55);color:#ffcdd2;" + style;
          else style += ";opacity:.5";
        }
        return '<button data-cipher-pick="' + ix + '" style="' + style + '">' + esc(CIPHERS[ix].m) + '</button>';
      }).join("");
    }
    renderCodexKeeperSlot();
  }
  $("cipher-opts").addEventListener("click", function (e) {
    var b = e.target.closest("[data-cipher-pick]"); if (!b) return;
    var ix = parseInt(b.dataset.cipherPick, 10);
    var c = cipherComputed();
    if (state.cipher && state.cipher.d === c.ck) return;
    var ok = ix === c.cIdx;
    var prev = state.cipher;
    var streak = ok ? (((prev && prev.d === yesterKey() && prev.ok && prev.streak) || 0) + 1) : 0;
    state.cipher = {d: c.ck, pick: ix, ok: ok, streak: streak};
    storeSet("bgf_cipher", state.cipher);
    sfx(ok ? "right" : "wrong");
    renderCipher();
    renderDossierFeaturedAndGrid(); // file021 depends on cipher streak
  });

  // ---------------------------------------------------------------- Quiz / Trials
  function currentQuizPool() { return revealed.size >= 12 ? quizSet.concat([BONUS_Q]) : quizSet; }
  function renderQuiz() {
    var QZ = currentQuizPool();
    var quizDone = state.qi >= QZ.length;
    var panel = $("quiz-panel");
    if (!quizDone) {
      var item = QZ[Math.min(state.qi, QZ.length - 1)];
      var keys = ["A", "B", "C", "D"];
      var optsHtml = item.opts.map(function (o, i) {
        var style = "text-align:left;background:#17181c;border:1px solid rgba(201,168,76,.16);color:#eef1f4;padding:14px 17px;border-radius:12px;font-size:15px;cursor:pointer;font-family:'Work Sans',sans-serif;display:flex;align-items:center;gap:12px;transition:border-color .18s, transform .18s, background .18s";
        if (state.answered) {
          style += ";cursor:default";
          if (i === item.correct) style += ";border:1px solid #c9a84c;background:rgba(201,168,76,.15)";
          else if (i === state.chosen) style += ";border:1px solid #b3382a;background:rgba(179,56,42,.15)";
          else style += ";opacity:.55";
        }
        return '<button data-quiz-pick="' + i + '" ' + (state.answered ? "disabled" : "") + ' style="' + style + '"><span style="width:26px;height:26px;border-radius:7px;background:#000000;border:1px solid rgba(201,168,76,.25);display:grid;place-items:center;font-size:13px;font-weight:700;color:#e8c070;flex-shrink:0">' + keys[i] + '</span>' + esc(o) + '</button>';
      }).join("");
      var barPct = (state.qi / QZ.length) * 100;
      var fbHead = state.chosen === item.correct ? "◆ Correct." : "◆ Not quite.";
      var nextLabel = state.qi === QZ.length - 1 ? "See Results" : "Next Question";
      panel.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:1.5px;color:#969ba3"><span>QUESTION ' + Math.min(state.qi + 1, QZ.length) + ' OF ' + QZ.length + '</span><span style="color:#e8c070">STREAK · ' + state.streak + '</span></div>' +
        '<div style="height:6px;background:#1e1f23;border-radius:999px;overflow:hidden;margin-bottom:22px;border:1px solid rgba(201,168,76,.15)"><i style="display:block;height:100%;background:linear-gradient(92deg,#c9a84c,#e8c070);width:' + barPct + '%;transition:width .4s"></i></div>' +
        '<div style="font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:2.5px;color:#c9a84c;margin-bottom:10px;text-transform:uppercase">' + esc(item.cat) + '</div>' +
        '<div style="font-size:21px;font-weight:700;color:#fff;margin-bottom:20px;font-family:\'Playfair Display\',Georgia,serif;line-height:1.32">' + esc(item.q) + '</div>' +
        '<div style="display:flex;flex-direction:column;gap:11px" role="group" aria-label="Answers">' + optsHtml + '</div>' +
        (state.answered ? '<div style="margin-top:16px;padding:14px 18px;border-radius:12px;font-size:14.5px;color:#c4c9d0;background:#17181c;border:1px solid rgba(201,168,76,.2);font-family:\'Crimson Pro\',Georgia,serif" role="status"><b style="color:#e8c070;font-family:\'Work Sans\',sans-serif;font-size:13.5px">' + fbHead + '</b> ' + esc(item.fact) + '</div>' +
          '<div style="margin-top:20px;display:flex;justify-content:flex-end"><button data-quiz-next class="hv-lift-sm" style="display:inline-flex;align-items:center;gap:10px;padding:13px 24px;border-radius:999px;font-weight:700;font-size:14.5px;cursor:pointer;border:1px solid rgba(255,255,255,.18);background:linear-gradient(92deg,#e8c070,#9a6a20);color:#141519;font-family:\'Work Sans\',sans-serif;transition:transform .15s">' + nextLabel + ' →</button></div>' : "");
    } else {
      var pct = Math.round((state.score / QZ.length) * 100);
      var resTitle = pct === 100 ? "Archivist Supreme" : pct >= 75 ? "Keeper of the Files" : pct >= 50 ? "Rising Scholar" : "New Initiate";
      var resMsg = pct === 100 ? "Flawless. You carry the long memory." : pct >= 75 ? "Sharp. The ancestors are proud." : pct >= 50 ? "Solid ground — keep digging into the archive." : "Every genius started somewhere. Explore the files and run it back.";
      panel.innerHTML = '<div style="text-align:center">' +
        '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:64px;color:#e8c070;line-height:1;text-shadow:0 0 34px rgba(232,192,112,.3)">' + state.score + '/' + QZ.length + '</div>' +
        '<h3 style="font-size:25px;color:#fff;margin:10px 0 8px;font-weight:800;font-family:\'Playfair Display\',Georgia,serif">' + resTitle + '</h3>' +
        '<p style="color:#c4c9d0;margin:0 0 22px;font-family:\'Crimson Pro\',Georgia,serif;font-size:16px">' + resMsg + ' · ' + pct + '% · Best streak ' + state.best + '</p>' +
        '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">' +
          '<button data-quiz-retry class="hv-lift-sm" style="display:inline-flex;align-items:center;gap:10px;padding:13px 24px;border-radius:999px;font-weight:700;font-size:14.5px;cursor:pointer;border:1px solid rgba(255,255,255,.18);background:linear-gradient(92deg,#e8c070,#9a6a20);color:#141519;font-family:\'Work Sans\',sans-serif;transition:transform .15s">↻ Run the Trials Again</button>' +
          '<button data-quiz-share class="hv-outline" style="display:inline-flex;align-items:center;gap:10px;padding:13px 24px;border-radius:999px;font-weight:700;font-size:14.5px;cursor:pointer;background:rgba(255,255,255,.04);border:1px solid rgba(201,168,76,.32);color:#eef1f4;font-family:\'Work Sans\',sans-serif;transition:border-color .2s,color .2s">' + esc(state.qShare) + '</button>' +
        '</div></div>';
      window._bgfQuizResTitle = resTitle;
    }
  }
  $("quiz-panel").addEventListener("click", function (e) {
    var pick = e.target.closest("[data-quiz-pick]");
    if (pick) {
      if (state.answered) return;
      var QZ = currentQuizPool(), item = QZ[Math.min(state.qi, QZ.length - 1)];
      var i = parseInt(pick.dataset.quizPick, 10);
      var right = i === item.correct;
      sfx(right ? "right" : "wrong");
      var streak = right ? state.streak + 1 : 0;
      var best = Math.max(state.best, streak);
      localStorage.setItem("bgf_best", String(best));
      state.answered = true; state.chosen = i; state.score += right ? 1 : 0; state.streak = streak; state.best = best;
      renderQuiz();
      renderDossierFeaturedAndGrid(); // file021 may unlock from best streak
      return;
    }
    if (e.target.closest("[data-quiz-next]")) { state.qi += 1; state.answered = false; state.chosen = -1; renderQuiz(); return; }
    if (e.target.closest("[data-quiz-retry]")) { quizSet = drawQuiz(QUIZ); state.qi = 0; state.score = 0; state.streak = 0; state.answered = false; state.chosen = -1; renderQuiz(); return; }
    if (e.target.closest("[data-quiz-share]")) {
      var QZ2 = currentQuizPool();
      doShare("I ranked \"" + (window._bgfQuizResTitle || "") + "\" (" + state.score + "/" + QZ2.length + ") on The Black Genius Files Trials. Test your knowledge:", function (label) { state.qShare = label; renderQuiz(); }, "Share my rank ↗");
    }
  });

  // ---------------------------------------------------------------- Sealed letter
  function renderSealedLetter() { $("sealed-letter").hidden = revealed.size < TOTAL_FRAGS; }

  // ---------------------------------------------------------------- Reading room doors
  function doorHtml(url, label) {
    return url
      ? '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" class="hv-fill" style="display:inline-flex;align-items:center;gap:8px;color:#e8c070;font-weight:700;font-size:14px;border:1px solid rgba(201,168,76,.35);padding:10px 20px;border-radius:999px;transition:background .2s,color .2s">' + label + '</a>'
      : '<span style="display:inline-block;font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:2px;color:#c25c3a;border:2px solid rgba(194,92,58,.6);border-radius:6px;padding:4px 12px;transform:rotate(-2deg)">DOOR SEALED — OPENING SOON</span>';
  }
  function renderDoors() {
    $("door-discord").innerHTML = doorHtml((CFG.discordUrl || "").trim(), "Enter the Reading Room ↗");
    $("door-patreon").innerHTML = doorHtml((CFG.patreonUrl || "").trim(), "Claim a desk ↗");
  }

  // ---------------------------------------------------------------- Newsletter
  $("subscribe-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var form = e.target, em = (form.elements.email || {}).value || "";
    if (!em.trim()) return;
    var url = (CFG.newsletterAction || "").trim();
    if (url) { try { fetch(url, {method: "POST", mode: "no-cors", body: new FormData(form)}); } catch (err) {} }
    state.subscribed = true;
    form.hidden = true; $("subscribe-success").hidden = false;
  });

  // ---------------------------------------------------------------- Sharing
  function doShare(text, onDone, label, url) {
    url = url || YT.url;
    if (navigator.share) {
      navigator.share({title: "The Black Genius Files", text: text, url: url}).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text + " " + url).then(function () {
        onDone("Copied ✓");
        setTimeout(function () { if (alive) onDone(label); }, 1600);
      }).catch(function () {});
    }
  }

  // ---------------------------------------------------------------- Print
  function figSheet(list) {
    var cards = list.map(function (f) {
      return '<article><div class="k">THE BLACK GENIUS FILES · DECLASSIFIED RECORD · FILE Nº ' + String(FIGURES.indexOf(f) + 1).padStart(2, "0") + '</div><h2>' + esc(f.name) + '</h2><div class="m">' + esc(f.field) + " · " + esc(f.arch) + " · " + esc(f.years) + '</div><p class="b">' + esc(f.bio) + '</p><p><span class="k">WHAT WAS BUILT — </span>' + esc(f.built) + '</p><p><span class="k">WHAT STOOD AGAINST IT — </span>' + esc(f.against) + '</p><p><span class="k">WHAT IT COST — </span>' + esc(f.cost) + '</p><div class="f">PRINTED FROM THEBLACKGENIUSFILES.COM · AN E.A.T. MEDIA PRODUCTION</div></article>';
    }).join("");
    var one = list.length === 1;
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>The Black Genius Files — Dossier</title><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@800&family=Special+Elite&display=swap" rel="stylesheet"><style>@page{margin:14mm}body{font-family:\'Special Elite\',\'Courier New\',monospace;color:#101114;margin:0}article{border:2px solid #101114;padding:' + (one ? "34px 38px" : "20px 26px") + ';margin:0 0 16px;page-break-inside:avoid;break-inside:avoid}article:nth-of-type(2n){page-break-after:always}.k{font-size:9.5px;letter-spacing:2.5px;margin-bottom:5px}h2{font-family:\'Playfair Display\',Georgia,serif;font-size:' + (one ? 30 : 21) + 'px;margin:0 0 2px}.m{font-size:10.5px;letter-spacing:1.5px;margin-bottom:10px}p{font-family:Georgia,serif;font-size:' + (one ? 13.5 : 11.5) + 'px;line-height:1.6;margin:0 0 7px}p .k{font-size:9px;letter-spacing:1.5px}.f{margin-top:12px;font-size:8.5px;letter-spacing:2px}</style></head><body>' + cards + "</body></html>";
  }
  function printSheet(list) {
    var old = $("bgf-printframe"); if (old) old.remove();
    var f = document.createElement("iframe");
    f.id = "bgf-printframe"; f.setAttribute("aria-hidden", "true");
    f.style.cssText = "position:fixed;left:-10000px;top:0;width:816px;height:1056px;border:0";
    document.body.appendChild(f);
    var doc = f.contentDocument; doc.open(); doc.write(figSheet(list)); doc.close();
    var fired = false;
    function go() { if (fired) return; fired = true; try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) {} }
    try { doc.fonts.ready.then(function () { setTimeout(go, 80); }); } catch (e) {}
    setTimeout(go, 1000);
  }
  $("print-all").addEventListener("click", function () { printSheet(FIGURES); });

  // ---------------------------------------------------------------- Modals: dossier
  function focusTrap(e) {
    if (e.key === "Escape") {
      if (state.player) closePlayer(); else if (state.modal) closeModal(); else if (state.navOpen) setNav(false);
      return;
    }
    if (e.key === "Tab") {
      var dlg = document.querySelector("[role=dialog]:not([hidden])"); if (!dlg) return;
      var f = Array.prototype.filter.call(dlg.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])'), function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  document.addEventListener("keydown", focusTrap);

  function dossierModalHtml(mf) {
    var mi = FIGURES.indexOf(mf);
    var relTlIdx = TIMELINE.findIndex(function (t) { return t.fig === mf.id; });
    var achHtml = mf.ach.map(function (a) { return '<li style="display:flex;gap:10px;font-size:14px;color:#c4c9d0;align-items:flex-start;font-family:\'Crimson Pro\',Georgia,serif"><span style="color:#c9a84c;font-size:10px;margin-top:5px;flex-shrink:0">◆</span>' + esc(a) + '</li>'; }).join("");
    var relTlBtn = relTlIdx >= 0 ? '<button data-open-tl-link="' + relTlIdx + '" style="display:inline-flex;align-items:center;gap:7px;font-size:13px;color:#c4c9d0;border:1px solid rgba(201,168,76,.28);padding:8px 15px;border-radius:999px;background:none;cursor:pointer;font-family:\'Work Sans\',sans-serif;transition:border-color .2s,color .2s" class="hv-outline">⇧ On the timeline</button>' : "";
    return '<div style="display:flex;gap:18px;align-items:center;margin-bottom:18px;flex-wrap:wrap">' +
        '<div style="' + sealStyleAttr(mi, 84).replace("margin:0 auto", "margin:0") + '">' + esc(initials(mf.name)) + '<img src="' + photoOf(mf.id) + '" alt="' + esc(mf.name) + ' — archival portrait" loading="lazy" onerror="this.style.display=\'none\'" style="position:absolute;inset:5px;width:calc(100% - 10px);height:calc(100% - 10px);border-radius:50%;object-fit:cover;object-position:center 25%;filter:sepia(.3) saturate(.88) contrast(1.06) brightness(.96)"></div>' +
        '<div style="min-width:200px"><h3 style="font-size:24px;color:#fff;font-family:\'Playfair Display\',Georgia,serif;font-weight:800;margin:0">' + esc(mf.name) + '</h3>' +
          '<div style="font-size:11.5px;color:#c9a84c;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-top:6px">' + esc(mf.field) + ' · ' + esc(mf.arch) + ' · ' + esc(mf.era === "CivilRights" ? "Civil Rights" : mf.era) + '</div>' +
          '<div style="font-size:12.5px;color:#969ba3;margin-top:3px">' + esc(mf.years) + '</div></div></div>' +
      '<p style="font-family:\'Crimson Pro\',Georgia,serif;color:#c4c9d0;font-size:15.5px;line-height:1.6;margin:0 0 18px;text-wrap:pretty">' + esc(mf.bio) + '</p>' +
      '<div style="margin:0 0 6px;border-left:2px solid #3a4048;padding:2px 0 2px 14px"><h5 style="font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#c9a84c;margin:0 0 3px">What Was Built</h5><p style="font-family:\'Crimson Pro\',Georgia,serif;font-size:14.5px;color:#c4c9d0;line-height:1.55;margin:0">' + esc(mf.built) + '</p></div>' +
      '<div style="margin:12px 0 6px;border-left:2px solid #3a4048;padding:2px 0 2px 14px"><h5 style="font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#c9a84c;margin:0 0 3px">What Stood Against It</h5><p style="font-family:\'Crimson Pro\',Georgia,serif;font-size:14.5px;color:#c4c9d0;line-height:1.55;margin:0">' + esc(mf.against) + '</p></div>' +
      '<div style="margin:12px 0 16px;border-left:2px solid #3a4048;padding:2px 0 2px 14px"><h5 style="font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#c9a84c;margin:0 0 3px">What It Cost to Ignore It</h5><p style="font-family:\'Crimson Pro\',Georgia,serif;font-size:14.5px;color:#c4c9d0;line-height:1.55;margin:0">' + esc(mf.cost) + '</p></div>' +
      '<ul style="list-style:none;display:flex;flex-direction:column;gap:9px;margin:0 0 20px;padding:0">' + achHtml + '</ul>' +
      '<div style="margin:0 0 16px;padding-top:14px;border-top:1px dashed rgba(201,168,76,.22)"><div style="font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:2px;color:#c9a84c;margin-bottom:9px">TRACE THIS GENIUS</div>' +
        '<div style="display:flex;gap:9px;flex-wrap:wrap"><a href="' + YT.url + '/search?query=' + encodeURIComponent(mf.name) + '" target="_blank" rel="noopener noreferrer" class="hv-outline" style="display:inline-flex;align-items:center;gap:7px;font-size:13px;color:#c4c9d0;border:1px solid rgba(201,168,76,.28);padding:8px 15px;border-radius:999px;transition:border-color .2s,color .2s">▶ Their file on YouTube ↗</a>' +
        '<button data-open-lineage="' + esc(mf.arch) + '" style="display:inline-flex;align-items:center;gap:7px;font-size:13px;color:#c4c9d0;border:1px solid rgba(201,168,76,.28);padding:8px 15px;border-radius:999px;background:none;cursor:pointer;font-family:\'Work Sans\',sans-serif;transition:border-color .2s,color .2s" class="hv-outline">◆ All ' + esc(mf.arch) + 's</button>' + relTlBtn + '</div></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap"><a href="' + esc(mf.learn) + '" target="_blank" rel="noopener noreferrer" class="hv-fill" style="display:inline-flex;align-items:center;gap:8px;color:#e8c070;font-weight:700;font-size:14px;border:1px solid rgba(201,168,76,.35);padding:10px 18px;border-radius:999px;transition:background .2s,color .2s">Open Full Record ↗</a>' +
        '<button data-share-modal style="display:inline-flex;align-items:center;gap:8px;color:#e8c070;font-weight:700;font-size:14px;border:1px solid rgba(201,168,76,.35);padding:10px 18px;border-radius:999px;background:none;cursor:pointer;font-family:\'Work Sans\',sans-serif;transition:background .2s,color .2s" class="hv-fill">' + esc(state.mShare) + '</button>' +
        '<button data-print-modal style="display:inline-flex;align-items:center;gap:8px;color:#969ba3;font-weight:600;font-size:13.5px;border:1px solid rgba(150,156,164,.3);padding:10px 18px;border-radius:999px;background:none;cursor:pointer;font-family:\'Work Sans\',sans-serif;transition:border-color .2s,color .2s" class="hv-outline">⎙ Print this file</button></div>';
  }
  var dossierModalEl = $("dossier-modal"), playerModalEl = $("player-modal");
  function openModal(id, fromHash) {
    if (!FIGURES.some(function (f) { return f.id === id; })) return;
    lastFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    state.modal = id; state.mShare = "Share this file ↗";
    $("dossier-modal-body").innerHTML = dossierModalHtml(figOf(id));
    dossierModalEl.hidden = false;
    if (!fromHash) setHash("dossier/" + id);
    setTimeout(function () { var b = dossierModalEl.querySelector("button"); if (b) b.focus(); }, 40);
  }
  function closeModal() {
    document.body.style.overflow = "";
    state.modal = null; dossierModalEl.hidden = true;
    clearHash("dossiers");
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
  }
  $("dossier-modal-close").addEventListener("click", closeModal);
  dossierModalEl.addEventListener("click", function (e) { if (e.target === dossierModalEl) closeModal(); });
  $("dossier-modal-body").addEventListener("click", function (e) {
    if (e.target.closest("[data-print-modal]")) { var mf = figOf(state.modal); if (mf) printSheet([mf]); return; }
    if (e.target.closest("[data-share-modal]")) {
      var f = figOf(state.modal);
      if (f) doShare(f.name + " — a genius file from The Black Genius Files.", function (label) { state.mShare = label; var btn = $("dossier-modal-body").querySelector("[data-share-modal]"); if (btn) btn.textContent = label; }, "Share this file ↗", location.href);
      return;
    }
    var lineageBtn = e.target.closest("[data-open-lineage]");
    if (lineageBtn) { closeModal(); state.arch = lineageBtn.dataset.openLineage; renderLineages(); renderDossierFeaturedAndGrid(); scrollToDossiers(); return; }
    var tlBtn = e.target.closest("[data-open-tl-link]");
    if (tlBtn) {
      var idx = parseInt(tlBtn.dataset.openTlLink, 10), t = TIMELINE[idx];
      closeModal();
      state.tlFilter = t ? t.era : "All"; state.openTl = idx; renderTimeline();
      var el = $("timeline"); if (el) window.scrollTo({top: el.offsetTop - 70, behavior: "smooth"});
    }
  });

  // ---------------------------------------------------------------- Modals: player
  function markSeen(vid) {
    if (!vid || (state.seen || []).includes(vid)) return;
    state.seen = (state.seen || []).concat([vid]);
    storeSet("bgf_seen", state.seen);
  }
  function openPlayerObj(obj, fromHash) {
    if (!obj || !obj.vid) return;
    lastFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    markSeen(obj.vid);
    state.player = obj;
    $("player-num").textContent = obj.num || "";
    $("player-title").textContent = obj.title || "";
    $("player-iframe").src = "https://www.youtube-nocookie.com/embed/" + obj.vid + "?autoplay=1&rel=0";
    $("player-open-yt").href = "https://www.youtube.com/watch?v=" + obj.vid;
    playerModalEl.hidden = false;
    if (!fromHash) setHash("file/" + obj.vid);
    renderEpisodes(); // "seen" stamps may change
    setTimeout(function () { var b = playerModalEl.querySelector("button"); if (b) b.focus(); }, 40);
  }
  function closePlayer() {
    document.body.style.overflow = "";
    state.player = null; playerModalEl.hidden = true;
    $("player-iframe").src = "";
    clearHash("files");
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
  }
  $("player-modal-close").addEventListener("click", closePlayer);
  playerModalEl.addEventListener("click", function (e) { if (e.target === playerModalEl) closePlayer(); });

  // ---------------------------------------------------------------- Hash routing
  function setHash(h) { try { history.replaceState(null, "", location.pathname + location.search + "#" + h); } catch (e) {} }
  function clearHash(back) { try { history.replaceState(null, "", location.pathname + location.search + (back ? "#" + back : "")); } catch (e) {} }
  function applyHash() {
    var h = (location.hash || "").replace(/^#/, "");
    var md = /^dossier\/(.+)$/.exec(h);
    if (md && FIGURES.some(function (f) { return f.id === md[1]; })) { if (state.modal !== md[1]) openModal(md[1], true); return; }
    var mv = /^file\/([A-Za-z0-9_-]{11})$/.exec(h);
    if (mv) {
      var vid = mv[1];
      if (!state.player || state.player.vid !== vid) {
        var ep = (state.episodes || []).filter(function (e) { return e.vid === vid; })[0];
        openPlayerObj({vid: vid, title: ep ? ep.title : "The Black Genius Files", num: pad2(ep ? ep.id : 0)}, true);
      }
    }
  }
  addEventListener("hashchange", applyHash);

  // ---------------------------------------------------------------- YouTube sync
  function isoToSec(iso) {
    var m = /P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || "");
    if (!m) return null;
    return (+(m[1] || 0)) * 86400 + (+(m[2] || 0)) * 3600 + (+(m[3] || 0)) * 60 + (+(m[4] || 0));
  }
  var lastSync = 0;
  function applyEpisodes(mapped) {
    lastSync = Date.now();
    storeSet("bgf_episodes", mapped);
    state.episodes = mapped; state.live = true; state.netState = "live"; state.epFilter = "All"; state.latestVid = mapped[0] ? (mapped[0].vid || "") : "";
    renderHeroStats(); renderLatest(); renderEpisodes();
    selectHero(mapped);
  }
  function apiSync() {
    var key = (CFG.youtubeApiKey || "").trim();
    if (!key) return Promise.resolve(false);
    var uploads = "UU" + YT.channelId.slice(2);
    var plUrl = "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=25&playlistId=" + uploads + "&key=" + encodeURIComponent(key);
    return fetch(plUrl).then(function (r) { return r.ok ? r.json() : null; }).then(function (pl) {
      var items = (pl && pl.items) || [];
      if (!items.length) return false;
      var rows = items.map(function (it) {
        var vid = (it.contentDetails && it.contentDetails.videoId) || (it.snippet && it.snippet.resourceId && it.snippet.resourceId.videoId) || "";
        return {vid: vid, title: (it.snippet && it.snippet.title) || "Untitled", desc: ((it.snippet && it.snippet.description) || "").trim(), published: (it.contentDetails && it.contentDetails.videoPublishedAt) || (it.snippet && it.snippet.publishedAt) || ""};
      }).filter(function (r) { return /^[A-Za-z0-9_-]{11}$/.test(r.vid); });
      if (!rows.length) return false;
      var ids = rows.map(function (r) { return r.vid; });
      var vUrl = "https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=" + ids.join(",") + "&key=" + encodeURIComponent(key);
      return fetch(vUrl).then(function (r) { return r.ok ? r.json() : null; }).then(function (vj) {
        ((vj && vj.items) || []).forEach(function (it) { var s = isoToSec(it.contentDetails && it.contentDetails.duration); if (s != null) durs[it.id] = s; });
        storeSet("bgf_durations", durs);
        var mapped = rows.map(function (r, i) {
          return {id: rows.length - i, title: r.title, tag: "Documentary", hook: "", live: true, vid: r.vid, published: r.published,
            desc: r.desc ? r.desc.slice(0, 140) + (r.desc.length > 140 ? "…" : "") : "A new file from the archive.",
            thumb: "https://i.ytimg.com/vi/" + r.vid + "/hqdefault.jpg", url: "https://www.youtube.com/watch?v=" + r.vid};
        });
        if (alive) applyEpisodes(mapped);
        return true;
      });
    }).catch(function () { return false; });
  }
  function rssSync() {
    var feed = "https://www.youtube.com/feeds/videos.xml?channel_id=" + YT.channelId;
    var chain = Promise.resolve(false);
    YT.proxies.forEach(function (make) {
      chain = chain.then(function (done) {
        if (done) return done;
        var ctrl = new AbortController(), to = setTimeout(function () { ctrl.abort(); }, 7000);
        return fetch(make(feed), {signal: ctrl.signal}).then(function (res) {
          clearTimeout(to);
          if (!res.ok) return false;
          return res.text().then(function (text) {
            var xml = new DOMParser().parseFromString(text, "text/xml");
            var entries = Array.prototype.slice.call(xml.getElementsByTagName("entry"));
            if (!entries.length) return false;
            var mapped = entries.slice(0, 24).map(function (e, i) {
              var vidEl = e.getElementsByTagName("yt:videoId")[0];
              var vid = vidEl ? vidEl.textContent : "";
              if (!/^[A-Za-z0-9_-]{11}$/.test(vid)) return null;
              var titleEl = e.getElementsByTagName("title")[0];
              var title = titleEl ? titleEl.textContent : "Untitled";
              var descEl = e.getElementsByTagName("media:description")[0];
              var desc = (descEl ? descEl.textContent : "").trim();
              var pubEl = e.getElementsByTagName("published")[0];
              var pub = pubEl ? pubEl.textContent : "";
              return {id: entries.length - i, title: title, tag: "Documentary", hook: "", live: true, vid: vid, published: pub,
                desc: desc ? desc.slice(0, 140) + (desc.length > 140 ? "…" : "") : "A new file from the archive.",
                thumb: "https://i.ytimg.com/vi/" + vid + "/hqdefault.jpg", url: "https://www.youtube.com/watch?v=" + vid};
            }).filter(Boolean);
            if (mapped.length && alive) { applyEpisodes(mapped); return true; }
            return false;
          });
        }).catch(function () { return false; });
      });
    });
    return chain;
  }
  function syncYT() { return apiSync().then(function (ok) { if (!ok) return rssSync(); }); }
  function selectHero(list) {
    var key = (CFG.youtubeApiKey || "").trim();
    if (!key || !list || !list.length) return;
    var ids = list.slice(0, 20).map(function (e) { return e.vid; }).filter(Boolean);
    var need = ids.filter(function (id) { return durs[id] == null; });
    var p = Promise.resolve();
    if (need.length) {
      var url = "https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=" + need.join(",") + "&key=" + encodeURIComponent(key);
      p = fetch(url).then(function (res) { return res.ok ? res.json() : null; }).then(function (j) {
        ((j && j.items) || []).forEach(function (it) { var s = isoToSec(it.contentDetails && it.contentDetails.duration); if (s != null) durs[it.id] = s; });
        storeSet("bgf_durations", durs);
      }).catch(function () {});
    }
    p.then(function () {
      for (var i = 0; i < ids.length; i++) {
        var secs = durs[ids[i]];
        if (secs != null && secs >= 120) {
          if (alive && state.heroVid !== ids[i]) { state.heroVid = ids[i]; storeSet("bgf_hero", ids[i]); renderTrailer(); }
          return;
        }
      }
    });
  }

  // ---------------------------------------------------------------- Boot
  function boot() {
    syncFragDom();
    renderHud();
    renderHeroStats();
    renderTrailer();
    renderLatest();
    renderEpisodes();
    renderTimeline();
    renderLineages();
    renderDossierFeaturedAndGrid();
    renderBook();
    renderCipher();
    renderQuiz();
    renderSealedLetter();
    renderDoors();
    $("footer-year").textContent = new Date().getFullYear();
    tick(); setInterval(tick, 1000);
    scheduleTicker();
    initDust();
    initGrade();
    revealEditedHero();
    applyHash();
    if (CFG.liveSync ?? true) {
      syncYT();
      setInterval(function () { if (!document.hidden) syncYT(); }, 6e5);
      document.addEventListener("visibilitychange", function () {
        if (!document.hidden && Date.now() - lastSync > 12e4) syncYT();
      });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  addEventListener("beforeunload", function () { alive = false; });
})();
