(function () {
  var root = document.documentElement;
  var btn = document.getElementById("themeToggle");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============================================================
     LIGHT / DARK TOGGLE
     ============================================================ */
  function label() {
    btn.textContent = root.getAttribute("data-theme") === "light" ? "Dark mode" : "Light mode";
  }
  label();
  btn.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    label();
  });

  /* ============================================================
     HERO ENTRANCE ANIMATION (GSAP)
     ============================================================ */
  if (window.gsap && !reduce) {
    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from("h1", { y: 40, opacity: 0, duration: .9 }, .2)
      .from(".lead", { y: 24, opacity: 0, duration: .7 }, "-=.5")
      .from(".cta .btn", { y: 16, opacity: 0, stagger: .12, duration: .5 }, "-=.4")
      .from(".me", { y: 80, opacity: 0, duration: 1.1, ease: "power3.out" }, .5);
  }

  /* ============================================================
     PORTRAIT VIDEO — follows cursor left/right, tilts with pointer Y
     ============================================================ */
  var v = document.getElementById("me");
  if (v) {
    var T_LEFT = 0.25, T_L_END = 1.5, T_R_START = 3.0, T_RIGHT = 4.0, T_FRONT = 2.2;
    var cur = T_FRONT, goal = T_FRONT, tilt = 0, tiltT = 0, active = false;

    if (reduce) { v.pause(); v.currentTime = T_FRONT; } // no idle loop, still follows the mouse

    window.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      if (!active) { active = true; cur = v.currentTime; v.pause(); }
      var r = v.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2);
      var pos = Math.max(-1, Math.min(1, dx / (innerWidth * 0.45)));
      if (Math.abs(pos) < 0.06) goal = T_FRONT;
      else if (pos < 0) goal = T_L_END + pos * (T_L_END - T_LEFT);
      else goal = T_R_START + pos * (T_RIGHT - T_R_START);
      tiltT = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * 0.2)) / (innerHeight * 0.6)));
    });

    document.documentElement.addEventListener("mouseleave", function () {
      active = false;
      if (!reduce) {
        var pl = v.play();
        if (pl && pl.catch) pl.catch(function () {});
      }
    });

    (function loop() {
      if (active) {
        cur += (goal - cur) * 0.18;
        tilt += (tiltT - tilt) * 0.1;
        if (Math.abs(v.currentTime - cur) > 0.01) v.currentTime = cur;
        v.style.transform = "perspective(900px) rotateX(" + (-tilt * 4).toFixed(2) + "deg)";
      }
      requestAnimationFrame(loop);
    })();
  }

  /* ============================================================
     SCROLL FADE-IN (sections, facts, timeline, skills, project headers)
     ============================================================ */
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "50px" });

    document.querySelectorAll("section h2,.facts,.path li,.skills,.pc-head").forEach(function (el) {
      el.classList.add("fade");
      if (el.matches(".path li")) {
        el.style.transitionDelay = (Array.prototype.indexOf.call(el.parentNode.children, el) * 0.1) + "s";
      }
      io.observe(el);
    });
  }

  /* ============================================================
     MAGNETIC HOVER — hero buttons, theme toggle, portrait, contact buttons
     ============================================================ */
  var mags = [].slice.call(document.querySelectorAll(".cta .btn,.toggle,.me,.contact .btn")).map(function (el) {
    var big = el.classList.contains("me");
    el.classList.add("magnet");
    return { el: el, pad: big ? 120 : 80, str: big ? 14 : 3 };
  });

  window.addEventListener("pointermove", function (e) {
    if (reduce || e.pointerType === "touch") return;
    mags.forEach(function (m) {
      var r = m.el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var near = Math.abs(e.clientX - cx) < r.width / 2 + m.pad && Math.abs(e.clientY - cy) < r.height / 2 + m.pad;
      m.el.style.translate = near
        ? ((e.clientX - cx) / m.str).toFixed(1) + "px " + ((e.clientY - cy) / m.str).toFixed(1) + "px"
        : "0px 0px";
    });
  });

  /* ============================================================
     ABOUT SECTION — letters light up as you scroll
     ============================================================ */
  var rv = [].slice.call(document.querySelectorAll(".about p")).map(function (p) {
    var txt = p.textContent, chars = [];
    p.setAttribute("aria-label", txt);
    p.classList.add("reveal");
    p.textContent = "";
    txt.split(" ").forEach(function (w, wi, arr) {
      var word = document.createElement("span");
      word.className = "w";
      word.setAttribute("aria-hidden", "true");
      w.split("").forEach(function (c) {
        var sp = document.createElement("span");
        sp.textContent = c;
        sp.style.opacity = reduce ? 1 : 0.2;
        word.appendChild(sp);
        chars.push(sp);
      });
      p.appendChild(word);
      if (wi < arr.length - 1) p.appendChild(document.createTextNode(" "));
    });
    return { p: p, chars: chars };
  });

  function revealTick() {
    var vh = innerHeight;
    rv.forEach(function (o) {
      var r = o.p.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      var pr = Math.max(0, Math.min(1, (vh * 0.8 - r.top) / (vh * 0.6 + r.height))), n = o.chars.length;
      for (var i = 0; i < n; i++) {
        o.chars[i].style.opacity = (0.2 + 0.8 * Math.max(0, Math.min(1, pr * n - i))).toFixed(2);
      }
    });
  }
  if (!reduce) {
    window.addEventListener("scroll", revealTick, { passive: true });
    revealTick();
  }

  /* ============================================================
     PROJECT CARDS — stack/shrink effect as the next card slides over
     ============================================================ */
  var items = [].slice.call(document.querySelectorAll(".stack-item"));
  function stackTick() {
    var vh = innerHeight, ps = items.map(function (it, i) {
      var r = it.getBoundingClientRect();
      return Math.max(0, Math.min(1, (vh - r.top) / (vh - (88 + i * 26))));
    });
    items.forEach(function (it, i) {
      var sum = 0;
      for (var j = i + 1; j < items.length; j++) sum += ps[j];
      it.firstElementChild.style.transform = "scale(" + (1 - 0.035 * sum).toFixed(4) + ")";
    });
  }
  if (items.length && !reduce) {
    window.addEventListener("scroll", stackTick, { passive: true });
    window.addEventListener("resize", stackTick);
    stackTick();
  }

  /* ============================================================
     PROJECT CARDS — wire up Live/Code buttons from data-url / data-code
     ============================================================ */
  document.querySelectorAll(".pcard").forEach(function (c) {
    [["data-url", ".live"], ["data-code", ".code"]].forEach(function (x) {
      var v = c.getAttribute(x[0]), a = c.querySelector(x[1]);
      if (v && a) { a.href = v; a.hidden = false; }
    });
  });

})();

/* ============================================================
   PROJECT CARDS — click anywhere on the live preview to open the site
   ============================================================ */
document.querySelectorAll(".pcard").forEach(function (card) {
  var overlay = card.querySelector(".pc-overlay");
  var url = card.dataset.url;
  if (overlay && url) {
    overlay.addEventListener("click", function () {
      window.open(url, "_blank", "noopener");
    });
  }
});