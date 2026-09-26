(function () {
  "use strict";

  // Certificate filter chips
  var chips = document.querySelectorAll("[data-filter]");
  var cards = document.querySelectorAll("[data-issuer]");
  var count = document.getElementById("certCount");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var f = chip.getAttribute("data-filter");
      chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
      var shown = 0;
      cards.forEach(function (card) {
        var ok = f === "all" || card.getAttribute("data-issuer") === f;
        card.hidden = !ok;
        if (ok) shown++;
      });
      if (count) count.textContent = shown;
    });
  });

  // Resume scroll-spy
  var toc = document.querySelectorAll(".resume-toc a");
  if (toc.length && "IntersectionObserver" in window) {
    var map = {};
    toc.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          toc.forEach(function (a) { a.classList.remove("is-current"); });
          if (map[e.target.id]) map[e.target.id].classList.add("is-current");
        }
      });
    }, { rootMargin: "-25% 0px -65% 0px" });
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  // Print button
  document.querySelectorAll("[data-print]").forEach(function (b) {
    b.addEventListener("click", function () { window.print(); });
  });

  // Rank meter + streak grid animate in when visible
  var targets = document.querySelectorAll(".rank-meter, .streak");
  if ("IntersectionObserver" in window) {
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io2.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    targets.forEach(function (t) { io2.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add("is-in"); });
  }
})();
