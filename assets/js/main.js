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

  /* ---------- Animated network topology (cybersecurity-themed backdrop) ----------
     A monitored-node graph: circles are endpoints, lines are the network,
     rings ping outward from each node (an endpoint reporting in), and small
     packets travel a subset of edges (log/telemetry flow). Built once as an
     SVG string and injected into every page's .bg-network container. */
  var BGN_NODES = [
    { x: 120, y: 140, r: 3 }, { x: 340, y: 90, r: 2.5 }, { x: 560, y: 220, r: 3.5 },
    { x: 780, y: 60, r: 2 }, { x: 980, y: 180, r: 3 }, { x: 1200, y: 100, r: 2.5 },
    { x: 1420, y: 220, r: 3 }, { x: 60, y: 420, r: 2.5 }, { x: 300, y: 480, r: 3 },
    { x: 540, y: 400, r: 2 }, { x: 760, y: 520, r: 3.5 }, { x: 1000, y: 440, r: 2.5 },
    { x: 1240, y: 500, r: 3 }, { x: 1480, y: 420, r: 2 }, { x: 180, y: 700, r: 3 },
    { x: 460, y: 760, r: 2.5 }, { x: 700, y: 680, r: 3 }, { x: 940, y: 760, r: 2 },
    { x: 1180, y: 700, r: 3.5 }, { x: 1420, y: 760, r: 2.5 }
  ];
  var BGN_EDGES = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
    [0, 7], [1, 8], [2, 9], [4, 11], [5, 12], [6, 13],
    [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13],
    [7, 14], [8, 15], [9, 16], [10, 17], [11, 18], [12, 19],
    [14, 15], [15, 16], [16, 17], [17, 18], [18, 19],
    [2, 10], [8, 16]
  ];
  var BGN_PACKET_EDGES = [0, 4, 8, 12, 16, 20, 24, 28];

  function buildNetworkSVG(reduce) {
    var edgesSVG = BGN_EDGES.map(function (e) {
      var a = BGN_NODES[e[0]], b = BGN_NODES[e[1]];
      return '<line class="bgn-edge" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>';
    }).join("");

    var nodesSVG = BGN_NODES.map(function (n, i) {
      var ping = reduce
        ? ""
        : '<circle class="bgn-ping" cx="' + n.x + '" cy="' + n.y + '" r="' + n.r +
          '" style="animation-delay:' + ((i % 7) * 0.55).toFixed(2) + "s\"/>";
      return '<circle class="bgn-node" cx="' + n.x + '" cy="' + n.y + '" r="' + n.r + '"/>' + ping;
    }).join("");

    var packetsSVG = reduce
      ? ""
      : BGN_PACKET_EDGES.map(function (edgeIdx, i) {
          var e = BGN_EDGES[edgeIdx % BGN_EDGES.length];
          var a = BGN_NODES[e[0]], b = BGN_NODES[e[1]];
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

  function initBgNetwork() {
    var mount = document.querySelector(".bg-network");
    if (!mount) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    mount.innerHTML = buildNetworkSVG(reduce);
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
    "linux-essentials": "terminal-window"
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
    initBgNetwork();
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
