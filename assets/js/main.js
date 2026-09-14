(function () {
  "use strict";

  var ICON = function (name) {
    /* --icon-url is consumed by mask-image inside style.css, so the url()
       resolves relative to that stylesheet's location, not the page's. */
    return "../icons/" + name + ".svg";
  };

  function iconSpan(name, extraClass) {
    return (
      '<span class="icon' + (extraClass ? " " + extraClass : "") +
      '" style="--icon-url:url(\'' + ICON(name) + "')\" aria-hidden=\"true\"></span>"
    );
  }
  window.iconSpan = iconSpan;

  /* ---------- Theme toggle ---------- */
  function initTheme() {
    var root = document.documentElement;
    var toggle = document.getElementById("themeToggle");
    var stored = null;
    try {
      stored = localStorage.getItem("mh-theme");
    } catch (e) {
      /* private mode or blocked storage: fall back to system preference */
    }
    if (stored === "light" || stored === "dark") {
      root.setAttribute("data-theme", stored);
    }
    if (!toggle) return;
    toggle.addEventListener("click", function () {
      var current = root.getAttribute("data-theme");
      var isDark = current
        ? current === "dark"
        : window.matchMedia("(prefers-color-scheme: dark)").matches;
      var next = isDark ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try {
        localStorage.setItem("mh-theme", next);
      } catch (e) {
        /* ignore */
      }
      if (window.__refreshBgNetworkColor) window.__refreshBgNetworkColor();
    });
  }

  /* ---------- Mobile nav ---------- */
  function initNav() {
    var btn = document.getElementById("navToggle");
    var links = document.getElementById("navLinks");
    if (!btn || !links) return;
    btn.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Carved-panel reveal ---------- */
  /* Position of `el` among its siblings that also carry `attr`, capped so a
     long grid doesn't produce a multi-second cascade. Drives a per-element
     transition-delay so grids of cards/stats visibly cascade in together. */
  function staggerIndex(el, attr) {
    var siblings = el.parentElement
      ? Array.prototype.filter.call(el.parentElement.children, function (c) {
          return c.hasAttribute(attr);
        })
      : [el];
    var idx = siblings.indexOf(el);
    return Math.min(idx < 0 ? 0 : idx, 5);
  }

  function initReveal() {
    var panels = document.querySelectorAll("[data-reveal]");
    if (!panels.length) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      panels.forEach(function (p) {
        p.classList.add("is-raised");
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var el = entry.target;
            el.style.transitionDelay = staggerIndex(el, "data-reveal") * 70 + "ms";
            el.classList.add("is-raised");
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -40px 0px" }
    );
    panels.forEach(function (p) {
      io.observe(p);
    });
  }

  /* ---------- Entrance choreography (hero art/text, page-header copy) ---------- */
  function initEntranceReveal() {
    var items = document.querySelectorAll("[data-hero-reveal]");
    if (!items.length) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    items.forEach(function (p, i) {
      if (reduce) {
        p.classList.add("is-raised");
      } else {
        window.setTimeout(
          function () {
            p.classList.add("is-raised");
          },
          110 * i + 60
        );
      }
    });
  }

  /* ---------- Nav gains depth once the page scrolls ---------- */
  function initNavScroll() {
    var nav = document.querySelector(".site-nav");
    if (!nav) return;
    var ticking = false;
    function update() {
      nav.classList.toggle("is-scrolled", window.scrollY > 8);
      ticking = false;
    }
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
    update();
  }

  /* ---------- Count-up stats ---------- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (isNaN(target)) return;
    var suffix = el.getAttribute("data-suffix") || "";
    var duration = 1100;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased).toLocaleString("en-US") + suffix;
      if (progress < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  function initCounts() {
    var counters = document.querySelectorAll("[data-count]");
    if (!counters.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      counters.forEach(function (el) {
        var target = parseInt(el.getAttribute("data-count"), 10);
        el.textContent = target.toLocaleString("en-US") + (el.getAttribute("data-suffix") || "");
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ---------- Cursor trail (fine-pointer desktop only) ---------- */
  function initCursorRing() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    var ring = document.querySelector(".cursor-ring");
    if (!ring) return;
    var x = 0,
      y = 0,
      rx = 0,
      ry = 0,
      started = false;
    function loop() {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      var scale = ring.classList.contains("is-pointer") ? 1.6 : 1;
      ring.style.transform = "translate(" + (rx - 17) + "px," + (ry - 17) + "px) scale(" + scale + ")";
      window.requestAnimationFrame(loop);
    }
    window.addEventListener(
      "pointermove",
      function (e) {
        if (e.pointerType && e.pointerType !== "mouse") return;
        x = e.clientX;
        y = e.clientY;
        if (!started) {
          rx = x;
          ry = y;
          started = true;
        }
        ring.classList.add("is-active");
        ring.classList.toggle("is-pointer", !!e.target.closest("a, button, .panel"));
      },
      { passive: true }
    );
    document.addEventListener(
      "pointerleave",
      function () {
        ring.classList.remove("is-active");
      },
      { passive: true }
    );
    window.requestAnimationFrame(loop);
  }

  /* ---------- Background style system (cybersecurity-themed backdrops) ----------
     More than one visual for the .bg-network canvas/SVG layer, switchable at
     runtime and persisted in localStorage, independent of the light/dark
     color theme. Each entry is a "mount(container, reduce) -> {stop,
     refreshColor}" function: mount builds and starts the visual, stop tears
     down whatever it added (timers, listeners, DOM), refreshColor re-reads
     the current --accent when the color theme flips. Adding a new backdrop
     later is just one more entry in BG_THEMES; nothing else needs to change. */

  /* ---- Theme: "dynamic" -- drifting particle mesh with routed, pulsating
     messages that occasionally get denied (the current default). ---- */
  function mountDynamicBg(mount, reduce) {
    var canvas = document.createElement("canvas");
    mount.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    if (!ctx) return { stop: function () {}, refreshColor: function () {} };

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = 0, height = 0, linkDist = 140;
    var REPEL_DIST = 130, REPEL_FORCE = 1.9;
    var particles = [];
    var mouse = { x: -9999, y: -9999 };
    var rgb = "58,102,144";
    var deniedRgb = "196,90,90";
    var frameT = 0;

    /* Messages hop node to node like routed packets: each arrival rolls a
       chance of denial (turns red, drops there) or continues to a new
       neighbor, up to MAX_HOPS before it simply expires (TTL exceeded). */
    var messages = [], bursts = [];
    var MAX_MESSAGES = 22, MAX_HOPS = 256, DENY_CHANCE = 0.05;

    function readColor() {
      var raw = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
      var hex = raw.replace("#", "");
      if (hex.length === 3) hex = hex.split("").map(function (c) { return c + c; }).join("");
      var num = parseInt(hex, 16);
      if (!isNaN(num) && hex.length === 6) {
        rgb = ((num >> 16) & 255) + "," + ((num >> 8) & 255) + "," + (num & 255);
      }
    }
    readColor();

    function seed() {
      var count = Math.max(46, Math.min(140, Math.round((width * height) / 12000)));
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: 1.1 + Math.random() * 2.1
        });
      }
    }

    function sizeCanvas() {
      width = mount.clientWidth;
      height = mount.clientHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      linkDist = Math.max(160, Math.min(300, width / 5.5));
    }

    sizeCanvas();
    seed();

    function pickNeighbor(idx, excludeIdx) {
      var candidates = [];
      var pi = particles[idx];
      for (var k = 0; k < particles.length; k++) {
        if (k === idx || k === excludeIdx || !particles[k]) continue;
        var dx = particles[k].x - pi.x, dy = particles[k].y - pi.y;
        if (Math.sqrt(dx * dx + dy * dy) < linkDist) candidates.push(k);
      }
      if (candidates.length) return candidates[Math.floor(Math.random() * candidates.length)];
      var r = idx, tries = 0;
      while ((r === idx || r === excludeIdx) && tries < 10) {
        r = Math.floor(Math.random() * particles.length);
        tries++;
      }
      return r;
    }

    function spawnMessage() {
      if (reduce || particles.length < 2 || messages.length >= MAX_MESSAGES) return;
      var from = Math.floor(Math.random() * particles.length);
      var to = pickNeighbor(from, -1);
      if (to !== from && to !== -1) {
        messages.push({ from: from, to: to, t: 0, hops: 0, speed: 0.008 + Math.random() * 0.012 });
      }
    }

    var spawnTimer = null;
    function scheduleSpawn() {
      spawnTimer = window.setTimeout(function () {
        spawnMessage();
        scheduleSpawn();
      }, 260 + Math.random() * 380);
    }

    function drawMessages() {
      var m, msg, pa, pb, mx, my, pulse;
      for (m = messages.length - 1; m >= 0; m--) {
        msg = messages[m];
        pa = particles[msg.from];
        pb = particles[msg.to];
        if (!pa || !pb) { messages.splice(m, 1); continue; }

        msg.t += msg.speed;
        if (msg.t >= 1) {
          msg.hops++;
          if (msg.hops >= MAX_HOPS) {
            bursts.push({ x: pb.x, y: pb.y, age: 0, max: 0.5, r: 9, color: "accent" });
            messages.splice(m, 1);
            continue;
          }
          if (Math.random() < DENY_CHANCE) {
            bursts.push({ x: pb.x, y: pb.y, age: 0, max: 0.65, r: 15, color: "denied" });
            messages.splice(m, 1);
            continue;
          }
          var next = pickNeighbor(msg.to, msg.from);
          msg.from = msg.to;
          msg.to = next;
          msg.t = 0;
          msg.speed = 0.008 + Math.random() * 0.012;
          pa = particles[msg.from];
          pb = particles[msg.to];
          if (!pa || !pb) { messages.splice(m, 1); continue; }
        }

        mx = pa.x + (pb.x - pa.x) * msg.t;
        my = pa.y + (pb.y - pa.y) * msg.t;
        pulse = 1.7 + Math.sin(frameT * 0.22 + m) * 0.9;

        ctx.beginPath();
        ctx.arc(mx, my, pulse, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + rgb + ",0.9)";
        ctx.shadowColor = "rgba(" + rgb + ",0.75)";
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      for (var b = bursts.length - 1; b >= 0; b--) {
        var burst = bursts[b];
        burst.age += 0.045;
        if (burst.age >= burst.max) { bursts.splice(b, 1); continue; }
        var pct = burst.age / burst.max;
        var col = burst.color === "denied" ? deniedRgb : rgb;
        ctx.beginPath();
        ctx.arc(burst.x, burst.y, burst.r * pct, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(" + col + "," + (0.6 * (1 - pct)).toFixed(3) + ")";
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
    }

    function drawFrame() {
      frameT++;
      ctx.clearRect(0, 0, width, height);
      var i, a, b, dx, dy, dist;

      for (i = 0; i < particles.length; i++) {
        a = particles[i];
        if (!reduce) {
          a.x += a.vx;
          a.y += a.vy;

          dx = a.x - mouse.x;
          dy = a.y - mouse.y;
          dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < REPEL_DIST) {
            var force = (1 - dist / REPEL_DIST) * REPEL_FORCE;
            var inv = 1 / (dist || 1);
            a.x += dx * inv * force;
            a.y += dy * inv * force;
          }

          if (a.x < -20) a.x = width + 20;
          if (a.x > width + 20) a.x = -20;
          if (a.y < -20) a.y = height + 20;
          if (a.y > height + 20) a.y = -20;
        }
      }

      for (i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          a = particles[i];
          b = particles[j];
          dx = a.x - b.x;
          dy = a.y - b.y;
          dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < linkDist) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = "rgba(" + rgb + "," + (0.16 * (1 - dist / linkDist)).toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      for (i = 0; i < particles.length; i++) {
        a = particles[i];
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + rgb + ",0.5)";
        ctx.fill();
      }

      if (!reduce) drawMessages();
    }

    var rafId = null;
    function loop() {
      drawFrame();
      rafId = window.requestAnimationFrame(loop);
    }
    function start() {
      if (reduce) { drawFrame(); return; }
      if (!rafId) rafId = window.requestAnimationFrame(loop);
      if (!spawnTimer) scheduleSpawn();
    }
    function stopAnim() {
      if (rafId) { window.cancelAnimationFrame(rafId); rafId = null; }
      if (spawnTimer) { window.clearTimeout(spawnTimer); spawnTimer = null; }
    }

    function onResize() {
      sizeCanvas();
      seed();
      messages = [];
      bursts = [];
      if (reduce) drawFrame();
    }
    function onPointerMove(e) {
      var rect = mount.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }
    function onMouseOut(e) {
      if (!e.relatedTarget) { mouse.x = -9999; mouse.y = -9999; }
    }
    function onVisibility() {
      if (document.hidden) stopAnim();
      else start();
    }

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("mouseout", onMouseOut, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    start();

    return {
      refreshColor: readColor,
      stop: function () {
        stopAnim();
        window.removeEventListener("resize", onResize);
        window.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("mouseout", onMouseOut);
        document.removeEventListener("visibilitychange", onVisibility);
      }
    };
  }

  /* ---- Theme: "classic" -- the original hand-placed constellation (static
     layout, CSS/SMIL-driven pings and packets, no per-frame JS at all). ---- */
  var BGN_NODES_CLASSIC = [
    { x: 120, y: 140, r: 3 }, { x: 340, y: 90, r: 2.5 }, { x: 560, y: 220, r: 3.5 },
    { x: 780, y: 60, r: 2 }, { x: 980, y: 180, r: 3 }, { x: 1200, y: 100, r: 2.5 },
    { x: 1420, y: 220, r: 3 }, { x: 60, y: 420, r: 2.5 }, { x: 300, y: 480, r: 3 },
    { x: 540, y: 400, r: 2 }, { x: 760, y: 520, r: 3.5 }, { x: 1000, y: 440, r: 2.5 },
    { x: 1240, y: 500, r: 3 }, { x: 1480, y: 420, r: 2 }, { x: 180, y: 700, r: 3 },
    { x: 460, y: 760, r: 2.5 }, { x: 700, y: 680, r: 3 }, { x: 940, y: 760, r: 2 },
    { x: 1180, y: 700, r: 3.5 }, { x: 1420, y: 760, r: 2.5 }
  ];
  var BGN_EDGES_CLASSIC = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
    [0, 7], [1, 8], [2, 9], [4, 11], [5, 12], [6, 13],
    [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13],
    [7, 14], [8, 15], [9, 16], [10, 17], [11, 18], [12, 19],
    [14, 15], [15, 16], [16, 17], [17, 18], [18, 19],
    [2, 10], [8, 16]
  ];
  var BGN_PACKET_EDGES_CLASSIC = [0, 4, 8, 12, 16, 20, 24, 28];

  function buildClassicNetworkSVG(reduce) {
    var edgesSVG = BGN_EDGES_CLASSIC.map(function (e) {
      var a = BGN_NODES_CLASSIC[e[0]], b = BGN_NODES_CLASSIC[e[1]];
      return '<line class="bgn-edge" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>';
    }).join("");

    var nodesSVG = BGN_NODES_CLASSIC.map(function (n, i) {
      var ping = reduce
        ? ""
        : '<circle class="bgn-ping" cx="' + n.x + '" cy="' + n.y + '" r="' + n.r +
          '" style="animation-delay:' + ((i % 7) * 0.55).toFixed(2) + "s\"/>";
      return '<circle class="bgn-node" cx="' + n.x + '" cy="' + n.y + '" r="' + n.r + '"/>' + ping;
    }).join("");

    var packetsSVG = reduce
      ? ""
      : BGN_PACKET_EDGES_CLASSIC.map(function (edgeIdx, i) {
          var e = BGN_EDGES_CLASSIC[edgeIdx % BGN_EDGES_CLASSIC.length];
          var a = BGN_NODES_CLASSIC[e[0]], b = BGN_NODES_CLASSIC[e[1]];
          var dur = 3.5 + (i % 4) * 0.8;
          var delay = i * 0.7;
          return (
            '<circle class="bgn-packet" r="2.2">' +
            '<animateMotion dur="' + dur + 's" begin="' + delay + 's" repeatCount="indefinite" ' +
            'path="M' + a.x + "," + a.y + " L" + b.x + "," + b.y + '"/>' +
            "</circle>"
          );
        }).join("");

    return (
      '<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      edgesSVG + nodesSVG + packetsSVG +
      "</svg>"
    );
  }

  function mountClassicBg(mount, reduce) {
    mount.innerHTML = buildClassicNetworkSVG(reduce);
    /* Colors are plain CSS (var(--accent) on .bgn-*), so they already track
       the light/dark toggle with no JS refresh needed. */
    return { stop: function () {}, refreshColor: function () {} };
  }

  /* ---- Registry: add a new { id, label, mount } entry here for a future
     backdrop. Nothing else in initBgTheme needs to change. ---- */
  var BG_THEMES = [
    { id: "dynamic", label: "Dynamic mesh", mount: mountDynamicBg },
    { id: "classic", label: "Classic network", mount: mountClassicBg }
  ];

  function initBgTheme() {
    var mount = document.querySelector(".bg-network");
    if (!mount) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var btn = document.getElementById("bgThemeToggle");
    var current = null;
    var idx = 0;

    var stored = null;
    try {
      stored = localStorage.getItem("mh-bg-theme");
    } catch (e) {
      /* private mode or blocked storage */
    }
    for (var i = 0; i < BG_THEMES.length; i++) {
      if (BG_THEMES[i].id === stored) idx = i;
    }

    function activate(nextIdx) {
      if (current && current.stop) current.stop();
      mount.innerHTML = "";
      idx = ((nextIdx % BG_THEMES.length) + BG_THEMES.length) % BG_THEMES.length;
      var theme = BG_THEMES[idx];
      current = theme.mount(mount, reduce) || {};
      window.__refreshBgNetworkColor = current.refreshColor || function () {};
      try {
        localStorage.setItem("mh-bg-theme", theme.id);
      } catch (e) {
        /* ignore */
      }
      if (btn) btn.setAttribute("aria-label", "Background style: " + theme.label + ". Click to switch.");
    }

    if (btn) {
      btn.addEventListener("click", function () {
        activate(idx + 1);
      });
    }

    activate(idx);
  }

  /* ---------- Ambient background drift (mouse drag or touch drag) ---------- */
  function initBgField() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var root = document.documentElement;
    var raf = null;
    function apply(x, y) {
      if (raf) return;
      raf = window.requestAnimationFrame(function () {
        var tx = (x / window.innerWidth - 0.5) * 60;
        var ty = (y / window.innerHeight - 0.5) * 60;
        root.style.setProperty("--tx", tx.toFixed(1));
        root.style.setProperty("--ty", ty.toFixed(1));
        raf = null;
      });
    }
    window.addEventListener(
      "pointermove",
      function (e) {
        apply(e.clientX, e.clientY);
      },
      { passive: true }
    );
  }

  /* ---------- Panel spotlight: tracks pointer/touch position per card ---------- */
  function initSpotlight() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.PointerEvent) return;
    var active = null;

    function place(panel, x, y) {
      var rect = panel.getBoundingClientRect();
      panel.style.setProperty("--mx", ((x - rect.left) / rect.width) * 100 + "%");
      panel.style.setProperty("--my", ((y - rect.top) / rect.height) * 100 + "%");
    }

    document.addEventListener(
      "pointermove",
      function (e) {
        var panel = e.target.closest && e.target.closest(".panel");
        if (panel) {
          place(panel, e.clientX, e.clientY);
          if (panel !== active) {
            if (active) active.classList.remove("spotlight-active");
            panel.classList.add("spotlight-active");
            active = panel;
          }
        } else if (active) {
          active.classList.remove("spotlight-active");
          active = null;
        }
      },
      { passive: true }
    );

    document.addEventListener(
      "pointerdown",
      function (e) {
        var panel = e.target.closest && e.target.closest(".panel");
        if (panel) {
          place(panel, e.clientX, e.clientY);
          panel.classList.add("spotlight-active");
          active = panel;
        }
      },
      { passive: true }
    );

    document.addEventListener(
      "pointerup",
      function (e) {
        if (e.pointerType === "touch" && active) {
          var el = active;
          window.setTimeout(function () {
            el.classList.remove("spotlight-active");
            if (active === el) active = null;
          }, 250);
        }
      },
      { passive: true }
    );
  }

  /* ---------- Tilt: hero tiles and project cards follow the pointer ---------- */
  function initTilt(selector, maxDeg) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.PointerEvent) return;
    document.querySelectorAll(selector).forEach(function (el) {
      el.addEventListener(
        "pointermove",
        function (e) {
          var rect = el.getBoundingClientRect();
          var px = (e.clientX - rect.left) / rect.width - 0.5;
          var py = (e.clientY - rect.top) / rect.height - 0.5;
          el.style.setProperty("--tilt-y", (px * maxDeg).toFixed(2) + "deg");
          el.style.setProperty("--tilt-x", (-py * maxDeg).toFixed(2) + "deg");
        },
        { passive: true }
      );
      el.addEventListener(
        "pointerleave",
        function () {
          el.style.setProperty("--tilt-x", "0deg");
          el.style.setProperty("--tilt-y", "0deg");
        },
        { passive: true }
      );
    });
  }

  /* Re-applies tilt tracking to project cards after they're rendered by JS */
  function initProjectTilt() {
    initTilt(".project-card", 3);
  }

  /* ---------- Clipboard copy (contact page) ---------- */
  function initCopy() {
    document.querySelectorAll("[data-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var text = btn.getAttribute("data-copy");
        var done = function () {
          var original = btn.getAttribute("data-label") || btn.textContent;
          btn.textContent = "Copied";
          window.setTimeout(function () {
            btn.textContent = original;
          }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () {});
        }
      });
    });
  }

  /* ---------- Project card rendering ---------- */
  function projectCardHTML(p, opts) {
    opts = opts || {};
    var tags = p.stack
      .map(function (t) {
        return '<span class="tag">' + t + "</span>";
      })
      .join("");

    var media = "";
    if (p.thumb) {
      media =
        '<div class="project-media"><img src="' + p.thumb + '" alt="' +
        p.name + ' live screenshot" loading="lazy" width="640" height="400"></div>';
    } else if (p.diagram && window.TOPOLOGY_DIAGRAM) {
      media =
        '<div class="project-media project-media-diagram"><pre>' +
        window.TOPOLOGY_DIAGRAM + "</pre></div>";
    } else {
      media =
        '<div class="project-media project-media-icon">' +
        iconSpan(opts.icon || "terminal-window") +
        "</div>";
    }

    var links =
      '<a class="btn btn-ghost btn-small" href="' + p.repo +
      '" target="_blank" rel="noopener">' +
      iconSpan("github-logo") + "Source Code</a>";
    if (p.demo) {
      links +=
        '<a class="btn btn-secondary btn-small" href="' + p.demo +
        '" target="_blank" rel="noopener">' +
        iconSpan("arrow-square-out") + "Live Demo</a>";
    }

    var size = opts.lead ? " project-card-lead" : "";

    return (
      '<article class="panel project-card' + size + '" data-reveal>' +
      media +
      '<div class="project-body">' +
      "<h3>" + p.name + "</h3>" +
      '<p class="project-tagline">' + p.tagline + "</p>" +
      "<p>" + p.description + "</p>" +
      '<div class="tag-row">' + tags + "</div>" +
      '<div class="project-links">' + links + "</div>" +
      "</div></article>"
    );
  }
  window.projectCardHTML = projectCardHTML;

  var ICON_BY_ID = {
    "soc-log-analyzer": "chart-line",
    "security-lab-reports": "certificate",
    "linux-essentials": "terminal-window",
    "postgres-ha-cluster": "database"
  };

  function renderProjects() {
    var featuredMount = document.getElementById("featured-projects");
    var allMount = document.getElementById("all-projects");
    if (!window.PROJECTS) return;

    if (featuredMount) {
      var featured = window.PROJECTS.filter(function (p) {
        return p.featured;
      });
      featuredMount.innerHTML = featured
        .map(function (p, i) {
          return projectCardHTML(p, { lead: i === 0, icon: ICON_BY_ID[p.id] });
        })
        .join("");
    }

    if (allMount) {
      allMount.innerHTML = window.PROJECTS.map(function (p, i) {
        return projectCardHTML(p, { lead: i === 0, icon: ICON_BY_ID[p.id] });
      }).join("");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initNav();
    renderProjects();
    initReveal();
    initEntranceReveal();
    initCopy();
    initBgTheme();
    initBgField();
    initSpotlight();
    initTilt(".hero-tile", 6);
    initProjectTilt();
    initNavScroll();
    initCounts();
    initCursorRing();

    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
  });
})();
