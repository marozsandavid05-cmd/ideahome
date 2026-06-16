// IdeaHome — interakciós réteg (vanilla JS, függőség nélkül)
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- LOADER (első látogatáskor) ---------- */
  (function () {
    var loader = $("#loader");
    if (!loader) return;
    var hide = function () { loader.classList.add("done"); setTimeout(function () { loader.style.display = "none"; }, 950); };
    if (reduce || sessionStorage.getItem("ih_seen")) { loader.style.display = "none"; return; }
    sessionStorage.setItem("ih_seen", "1");
    requestAnimationFrame(function () { loader.classList.add("reveal-mark"); });
    window.addEventListener("load", function () { setTimeout(hide, 650); });
    setTimeout(hide, 2400); // fallback
  })();

  /* ---------- NAV ---------- */
  var nav = $("#nav");
  var onScroll = function () { if (nav) nav.classList.toggle("scrolled", window.scrollY > 24); };
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });

  var burger = $("#burger");
  if (burger) {
    burger.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Menü bezárása" : "Menü megnyitása");
    });
    $$("#mobileMenu a").forEach(function (a) {
      a.addEventListener("click", function () { document.body.classList.remove("menu-open"); burger.setAttribute("aria-expanded", "false"); });
    });
  }

  /* ---------- SERVICES DROPDOWN (touch / keyboard; CSS handles hover) ---------- */
  $$(".nav-dd").forEach(function (dd) {
    var trigger = dd.querySelector(".nav-dd-trigger");
    if (!trigger) return;
    function setOpen(state) {
      dd.classList.toggle("open", state);
      trigger.setAttribute("aria-expanded", String(state));
    }
    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      setOpen(!dd.classList.contains("open"));
    });
    document.addEventListener("click", function (e) {
      if (!dd.contains(e.target)) setOpen(false);
    });
    dd.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { setOpen(false); trigger.focus(); }
    });
  });

  /* ---------- REVEALS ---------- */
  var targets = $$(".reveal, .mask-head, .img-reveal, .pcard, .gallery-item");
  if (reduce || !("IntersectionObserver" in window)) {
    targets.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- CUSTOM CURSOR + MAGNETIC ---------- */
  if (fine && !reduce) {
    var ring = document.createElement("div"); ring.className = "cursor-ring"; ring.innerHTML = '<span class="cl"></span>';
    var dot = document.createElement("div"); dot.className = "cursor-dot";
    document.body.appendChild(ring); document.body.appendChild(dot);
    document.body.classList.add("has-cursor");
    var label = ring.querySelector(".cl");
    var rx = 0, ry = 0, dx = 0, dy = 0, tx = 0, ty = 0, ready = false;
    window.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!ready) { ready = true; document.body.classList.add("cursor-ready"); rx = dx = tx; ry = dy = ty; }
    });
    document.addEventListener("mouseleave", function () { document.body.classList.add("cursor-hide"); });
    document.addEventListener("mouseenter", function () { document.body.classList.remove("cursor-hide"); });
    (function loop() {
      rx += (tx - rx) * 0.16; ry += (ty - ry) * 0.16; dx += (tx - dx) * 0.42; dy += (ty - dy) * 0.42;
      ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      dot.style.transform = "translate(" + dx + "px," + dy + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
    $$("a, button, [data-magnetic]").forEach(function (el) {
      el.addEventListener("mouseenter", function () { document.body.classList.add("cursor-hover"); });
      el.addEventListener("mouseleave", function () { document.body.classList.remove("cursor-hover"); });
    });
    $$("[data-view], .work, .pcard, .gallery-item, .next-project").forEach(function (el) {
      el.addEventListener("mouseenter", function () { document.body.classList.add("cursor-view"); label.textContent = el.getAttribute("data-view") || "Megnézem"; });
      el.addEventListener("mouseleave", function () { document.body.classList.remove("cursor-view"); });
    });
    // magnetic
    $$("[data-magnetic]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var mx = e.clientX - r.left - r.width / 2, my = e.clientY - r.top - r.height / 2;
        el.style.transform = "translate(" + mx * 0.28 + "px," + my * 0.4 + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- PARALLAX (finom) ---------- */
  if (!reduce) {
    var pxEls = $$("[data-parallax]");
    if (pxEls.length) {
      var tick = false;
      var run = function () {
        var vh = window.innerHeight;
        pxEls.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.bottom < 0 || r.top > vh) return;
          var sp = parseFloat(el.getAttribute("data-parallax")) || 0.1;
          var prog = (r.top + r.height / 2 - vh / 2) / vh;
          el.style.transform = "translateY(" + (prog * sp * -100).toFixed(1) + "px)";
        });
        tick = false;
      };
      window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(run); } }, { passive: true });
      run();
    }
  }

  /* ---------- LIGHTBOX (projekt galéria) ---------- */
  var lbItems = $$("[data-lightbox]");
  if (lbItems.length) {
    var lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML =
      '<div class="lightbox-img"><img alt=""></div>' +
      '<button class="lb-btn lb-close" aria-label="Bezárás"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
      '<button class="lb-btn lb-prev" aria-label="Előző"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>' +
      '<button class="lb-btn lb-next" aria-label="Következő"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector(".lightbox-img img");
    var srcs = lbItems.map(function (el) { return el.getAttribute("data-lightbox") || el.querySelector("img").src; });
    var cur = 0;
    var show = function (i) { cur = (i + srcs.length) % srcs.length; lbImg.src = srcs[cur]; };
    var open = function (i) { show(i); lb.classList.add("open"); document.body.style.overflow = "hidden"; };
    var close = function () { lb.classList.remove("open"); document.body.style.overflow = ""; };
    lbItems.forEach(function (el, i) { el.addEventListener("click", function (e) { e.preventDefault(); open(i); }); });
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".lb-next").addEventListener("click", function () { show(cur + 1); });
    lb.querySelector(".lb-prev").addEventListener("click", function () { show(cur - 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") show(cur + 1);
      if (e.key === "ArrowLeft") show(cur - 1);
    });
  }

  /* ---------- PORTFÓLIÓ SZŰRŐ ---------- */
  var chips = $$(".chip[data-filter]");
  if (chips.length) {
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        var f = chip.getAttribute("data-filter");
        $$(".pcard").forEach(function (card) {
          var show = f === "all" || card.getAttribute("data-cat") === f;
          card.classList.toggle("hide", !show);
        });
      });
    });
  }

  /* ---------- ÉV ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- PRÉMIUM MOZGÁS (progressive enhancement: GSAP scrub + Three.js textúra) ----------
     NINCS scroll-hijack (Lenis kivéve, mert a body overflow-x:hidden-nel megfojtotta a görgetést).
     Robosztus: reduced-motion alatt kimarad; CDN-hiba esetén minden marad (natív scroll,
     CSS/IO reveal, pine heró-háttér). A görgetés és a tartalom SOHA nem függ ezektől. */
  (function () {
    if (reduce) return;
    function load(src) {
      return new Promise(function (res, rej) {
        var s = document.createElement("script");
        s.src = src; s.async = true; s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }

    // GSAP + ScrollTrigger — NATÍV scrollon (nincs scroll-hijack), CSAK dekoratív scrub.
    // A görgetés sosem függ ettől; reveal marad IO-n.
    Promise.all([
      load("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"),
      load("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js")
    ]).then(function () {
      if (!window.gsap || !window.ScrollTrigger) return;
      gsap.registerPlugin(ScrollTrigger);
      // signature: heró ív-keret mélység-parallax
      $$(".hero-frame.arch").forEach(function (frame) {
        var hero = frame.closest(".hero");
        if (!hero) return;
        gsap.to(frame, { yPercent: 7, ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
      });
      // finom mélység a galéria-képeken (a belső img reveal-scale-jét nem érinti, a keretet mozgatja)
      $$(".work .ph, .pcard .ph").forEach(function (ph) {
        gsap.fromTo(ph, { yPercent: -3 }, { yPercent: 3, ease: "none",
          scrollTrigger: { trigger: ph, start: "top bottom", end: "bottom top", scrub: true } });
      });
    }).catch(function () {});

    // 3) Three.js finom heró-textúra (dekoratív; a pine háttér a fallback)
    var heroDark = $(".hero-dark");
    if (heroDark && window.innerWidth > 720) {
      load("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js").then(function () {
        if (!window.THREE) return;
        try { initHeroTexture(heroDark); } catch (e) {}
      }).catch(function () {});
    }

    function initHeroTexture(host) {
      var THREE = window.THREE;
      var canvas = document.createElement("canvas");
      canvas.className = "hero-fx";
      host.insertBefore(canvas, host.firstChild);
      var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      var scene = new THREE.Scene();
      var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      var uniforms = { u_time: { value: 0 }, u_res: { value: new THREE.Vector2(1, 1) } };
      var mat = new THREE.ShaderMaterial({
        uniforms: uniforms, transparent: true,
        vertexShader: "void main(){ gl_Position = vec4(position,1.0); }",
        fragmentShader: [
          "precision highp float;",
          "uniform float u_time; uniform vec2 u_res;",
          "float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }",
          "float noise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); vec2 u=f*f*(3.0-2.0*f);",
          " return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y); }",
          "void main(){ vec2 uv=gl_FragCoord.xy/u_res.xy; float t=u_time*0.025;",
          " float n=noise(uv*3.0+vec2(t,t*0.6))*0.6+noise(uv*6.0-vec2(t*0.4,t))*0.4;",
          " float g=hash(gl_FragCoord.xy+vec2(u_time))*0.05;",
          " float glow=smoothstep(0.95,0.15,distance(uv,vec2(0.72,0.4)));",
          " vec3 col=vec3(0.13,0.21,0.17)*n + vec3(0.20,0.30,0.24)*glow*0.5;",
          " float a=(n*0.18+glow*0.10+g);",
          " gl_FragColor=vec4(col, a*0.55); }"
        ].join("\n")
      });
      scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
      function resize() {
        var w = host.clientWidth, h = host.clientHeight;
        renderer.setSize(w, h, false);
        uniforms.u_res.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
      }
      resize();
      window.addEventListener("resize", resize, { passive: true });
      var start = performance.now(), shown = false;
      (function anim() {
        uniforms.u_time.value = (performance.now() - start) / 1000;
        renderer.render(scene, camera);
        if (!shown) { shown = true; canvas.classList.add("on"); }
        requestAnimationFrame(anim);
      })();
    }
  })();
})();
