/* =========================================================
   NODEX MAGAZINE — home
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const G = window.gsap;
  const ST = window.ScrollTrigger;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (G && ST) G.registerPlugin(ST);
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  scrollTo(0, 0);

  /* ---------- PLAY: consoles (built before image slots load) ---------- */
  const CONSOLES = [
    { id: "psp", c: "#8fa3c9", draw: "psp", name: "PSP 3000", maker: "SONY · 2008", price: "€139", specs: [["Type", "Handheld"], ["Screen", "4.3\" widescreen"], ["Media", "UMD + Memory Stick"], ["Colour", "Piano Black"]] },
    { id: "wii", c: "#3fb6ff", draw: "wii", name: "Wii", maker: "NINTENDO · 2006", price: "€89", specs: [["Type", "Home console"], ["Control", "Motion remote"], ["Plays", "Wii + GameCube discs"], ["Colour", "White"]] },
    { id: "ds-lite", c: "#9fc4e8", draw: "ds", name: "DS Lite", maker: "NINTENDO · 2006", price: "€79", specs: [["Type", "Handheld"], ["Screens", "Dual, touch"], ["Plays", "DS + GBA carts"], ["Colour", "Ice Blue"]] },
    { id: "gba-sp", c: "#ff8fc4", draw: "gba", name: "Game Boy Advance SP", maker: "NINTENDO · 2003", price: "€69", specs: [["Type", "Handheld"], ["Screen", "Backlit, clamshell"], ["Battery", "Rechargeable"], ["Colour", "Pearl Pink"]] },
    { id: "ps2", c: "#2b2f3a", draw: "ps2", name: "PlayStation 2 Slim", maker: "SONY · 2004", price: "€99", specs: [["Type", "Home console"], ["Media", "DVD + CD"], ["Pads", "1 included"], ["Colour", "Charcoal Black"]] },
    { id: "gamecube", c: "#6a4fd0", draw: "gc", name: "GameCube", maker: "NINTENDO · 2001", price: "€119", specs: [["Type", "Home console"], ["Media", "Mini disc"], ["Pads", "1 included"], ["Colour", "Indigo"]] },
  ];
  const stage = $("#playStage");
  stage.innerHTML = CONSOLES.map((c, i) =>
    `<div class="play__view${i ? "" : " is-on"}"><div class="con con--${c.draw}"></div><div class="ph cut" data-img="img/console-${c.id}.webp" data-label="console-${c.id}"></div></div>`).join("") +
    `<p class="press-start">PRESS START</p>`;
  $("#playThumbs").innerHTML = CONSOLES.map((c, i) =>
    `<button class="pt${i ? "" : " is-on"}" data-i="${i}" style="--c:${c.c}"><span class="pt__img"><span class="con con--${c.draw}"></span><span class="ph cut" data-img="img/console-${c.id}.webp" data-label="${c.id}"></span></span>${c.name}<small>${c.specs[0][1]} · ${c.price}</small></button>`).join("");

  /* ---------- image slots ----------
     loaded (and decoded off the main thread) only when they get close to the screen,
     so scrolling never stalls on a big image */
  const loadSlot = (ph) => {
    if (ph.dataset.state) return;
    ph.dataset.state = "loading";
    const img = new Image();
    img.alt = "";
    img.decoding = "async";
    img.src = ph.dataset.img;
    (img.decode ? img.decode() : new Promise((r) => (img.onload = r)))
      .then(() => { ph.appendChild(img); ph.classList.add("is-loaded"); })
      .catch(() => {});
  };
  const slotIO = new IntersectionObserver((ents) => ents.forEach((e) => {
    if (!e.isIntersecting) return;
    const page = e.target;
    $$(".ph[data-img]", page).forEach(loadSlot);
    slotIO.unobserve(page);
  }), { rootMargin: "150% 0px" });
  $$(".page").forEach((pg) => slotIO.observe(pg));
  $$(".toc-prev .ph").forEach(loadSlot);

  /* ---------- contents: split title + hover preview ---------- */
  const ct = $(".contents__title");
  ct.innerHTML = [...ct.textContent].map((c) => `<span class="ch">${c}</span>`).join("");

  const prev = $("#tocPrev");
  const prevImgs = $$(".ph", prev);
  if (fine) {
    let px = 0, py = 0, tx = 0, ty = 0;
    $$("#toc a").forEach((a) => {
      a.addEventListener("mouseenter", () => {
        prevImgs.forEach((p, k) => p.classList.toggle("is-on", k === +a.dataset.prev));
        prev.style.setProperty("--r", `${(Math.random() * 10 - 5).toFixed(1)}deg`);
        prev.classList.add("is-on");
      });
      a.addEventListener("mouseleave", () => prev.classList.remove("is-on"));
    });
    addEventListener("mousemove", (e) => { tx = e.clientX + 30; ty = e.clientY - 150; });
    const loop = () => {
      px += (tx - px) * .15; py += (ty - py) * .15;
      prev.style.left = px + "px"; prev.style.top = py + "px";
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ---------- disc: colours + add to bag ---------- */
  const prod = $("#discProd");
  $$(".sw").forEach((s) => s.addEventListener("click", () => {
    $$(".sw").forEach((o) => o.classList.remove("is-on"));
    s.classList.add("is-on");
    prod.style.setProperty("--tint", s.style.getPropertyValue("--sw"));
    prod.style.setProperty("--flt", s.dataset.flt || "none");
    $("#discColor").textContent = s.dataset.name;
    if (G) G.fromTo(prod, { rotate: -200, scale: .8 }, { rotate: 0, scale: 1, duration: 1, ease: "expo.out" });
  }));

  const addToBag = (src, id) => NodexBag.fly(src, id);
  $("#addBag").addEventListener("click", () => addToBag(prod, "ndx-751"));

  /* ---------- PLAY: pick a console + bubble actions ---------- */
  let ci = 0;
  const pick = (i) => {
    ci = i;
    const c = CONSOLES[i];
    $$(".play__view", stage).forEach((v, k) => v.classList.toggle("is-on", k === i));
    $$(".pt").forEach((t, k) => t.classList.toggle("is-on", k === i));
    $("#pcMaker").textContent = c.maker;
    $("#pcName").textContent = c.name;
    $("#pcPrice").textContent = c.price;
    $("#pcSpecs").innerHTML = c.specs.map(([k, v]) => `<li><span>${k}</span>${v}</li>`).join("");
    $("#pcNum").textContent = String(i + 1).padStart(2, "0");
    const ghost = $("#pcGhost");
    ghost.textContent = c.name;
    if (G) G.fromTo(ghost, { xPercent: 12, opacity: 0 }, { xPercent: 0, opacity: 1, duration: .9, ease: "expo.out", overwrite: true });
  };
  pick(0);
  $$(".pt").forEach((t) => t.addEventListener("click", () => pick(+t.dataset.i)));
  $("#playPrev").addEventListener("click", () => pick((ci + CONSOLES.length - 1) % CONSOLES.length));
  $("#playNext").addEventListener("click", () => pick((ci + 1) % CONSOLES.length));
  $$(".bub[data-act]").forEach((b) => b.addEventListener("click", () => {
    const act = b.dataset.act;
    if (act === "bag") addToBag($(".play__view.is-on", stage), CONSOLES[ci].id);
    if (act === "specs") { const pc = $("#playCard"); pc.classList.remove("is-pulse"); void pc.offsetWidth; pc.classList.add("is-pulse"); }
    if (act === "next") pick((ci + 1) % CONSOLES.length);
  }));

  /* ---------- j5: 360° view ---------- */
  const views = $$("#j5Stage .ph");
  const thumbs = $$("#j5Thumbs button");
  let vi = 0, auto;
  const show = (i) => {
    vi = (i + views.length) % views.length;
    views.forEach((v, k) => v.classList.toggle("is-on", k === vi));
    thumbs.forEach((t, k) => t.classList.toggle("is-on", k === vi));
  };
  thumbs.forEach((t) => t.addEventListener("click", () => { show(+t.dataset.i); clearInterval(auto); }));
  const startAuto = () => { clearInterval(auto); if (!reduce) auto = setInterval(() => show(vi + 1), 1600); };
  new IntersectionObserver(([e]) => (e.isIntersecting ? startAuto() : clearInterval(auto)), { threshold: .3 }).observe($("#adJ5"));

  /* ---------- coupon ---------- */
  $("#couponForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const st = $("#stamp");
    st.classList.remove("is-on"); void st.offsetWidth; st.classList.add("is-on");
    if (G) G.fromTo("#couponCard", { x: -6 }, { x: 0, duration: .5, ease: "elastic.out(1.2,.2)", delay: .3 });
    e.target.reset();
  });

  /* =========================================================
     MOTION (GSAP)
     ========================================================= */
  const press = $("#press");
  if (!G || !ST || reduce) { press.remove(); return; }

  /* ---------- print intro ---------- */
  document.body.classList.add("is-pressing");
  const mast = $(".cover__mast .mis");
  const pct = { v: 0 };
  G.set(".cover__model", { xPercent: innerWidth < 1000 ? -50 : -46, x: 0 });
  const intro = G.timeline({ onComplete: () => { document.body.classList.remove("is-pressing"); press.remove(); ST.refresh(); } });
  intro
    .from(".press__bars span", { scaleY: 0, duration: .5, stagger: .06, ease: "expo.out" })
    .to(pct, { v: 100, duration: 1, ease: "power2.inOut", onUpdate: () => ($("#pressPct").textContent = String(Math.round(pct.v)).padStart(3, "0")) }, 0)
    .to(".press__bars span", { scaleY: 0, transformOrigin: "bottom", duration: .35, stagger: .04, ease: "power2.in" }, 1)
    .to(press, { yPercent: -100, duration: .9, ease: "expo.inOut" }, 1.25)
    .from("#cover", { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.inOut" }, 1.3)
    .from(".cover__photo", { scale: 1.25, duration: 2.2, ease: "expo.out" }, 1.4)
    .fromTo(mast, { "--mx": "18px", "--my": "-10px" }, { "--mx": "0px", "--my": "0px", duration: 1.6, ease: "expo.out" }, 1.6)
    .from(mast, { yPercent: 40, opacity: 0, duration: 1.1, ease: "expo.out" }, 1.6)
    .from(".cover__model", { yPercent: 35, rotation: -8, opacity: 0, duration: 1.5, ease: "expo.out" }, 1.75)
    .from(".cover__top, .cover__sub", { opacity: 0, y: -12, duration: .6, stagger: .1 }, 1.9)
    .from(".cover__lines .cl", { opacity: 0, x: (i, el) => (el.closest(".cover__lines--l") ? -40 : 40), duration: .8, stagger: .08, ease: "power3.out" }, 2)
    .from(".burst", { scale: 0, rotate: -200, duration: .9, ease: "back.out(2)" }, 2.3)
    .from(".cover__bottom > *", { y: 30, opacity: 0, duration: .7, stagger: .1, ease: "power3.out" }, 2.3)
    .from(".mast, .ticker", { yPercent: -100, duration: .7, ease: "expo.out" }, 2.1)
    .add(() => loop("#cover", G.to(".burst", { rotate: 8, duration: 1.8, yoyo: true, repeat: -1, ease: "sine.inOut" })));

  /* cover: mouse → misregistration + parallax */
  if (fine) {
    $("#cover").addEventListener("mousemove", (e) => {
      if (intro.isActive()) return;
      const mx = e.clientX / innerWidth - .5, my = e.clientY / innerHeight - .5;
      G.to(mast, { "--mx": `${mx * 8}px`, "--my": `${my * 6}px`, duration: .6, overwrite: "auto" });
      G.to(".cover__photo", { x: mx * -20, y: my * -14, duration: 1, overwrite: "auto" });
      G.to(".cover__model", { x: mx * 36, y: my * 18, rotation: mx * 3, duration: 1.2, overwrite: "auto" });
    });
  }

  /* ---------- magazine page stacking (desktop) ---------- */
  const pages = $$(".page");
  const mm = G.matchMedia();
  mm.add("(min-width: 1000px) and (min-height: 640px)", () => {
    const setTops = () => pages.forEach((p) => {
      const over = innerHeight - p.offsetHeight;
      p.style.top = Math.min(0, over) + "px";
      p.style.transformOrigin = over < 0 ? "50% 100%" : "50% 50%";
    });
    setTops();
    addEventListener("resize", setTops);

    pages.forEach((p, i) => {
      const next = pages[i + 1] || $(".back");
      const dim = p.querySelector(":scope > .dim") || p.appendChild(Object.assign(document.createElement("i"), { className: "dim" }));
      const tl = G.timeline({ scrollTrigger: { trigger: next, start: "top bottom", end: "top top", scrub: .4 } });
      tl.to(p, { scale: .93, rotation: i % 2 ? 1 : -1, ease: "none", force3D: true }, 0)
        .to(dim, { opacity: .6, ease: "none" }, 0);
    });
    return () => { removeEventListener("resize", setTops); pages.forEach((p) => (p.style.top = "")); };
  });

  /* pause looping animations of pages that are off screen */
  const loops = {};
  const loop = (page, ...tweens) => (loops[page] = (loops[page] || []).concat(tweens));
  const io = new IntersectionObserver((ents) => ents.forEach((e) => {
    e.target.classList.toggle("in-view", e.isIntersecting);
    (loops["#" + e.target.id] || []).forEach((t) => (e.isIntersecting ? t.resume() : t.pause()));
  }), { rootMargin: "100px 0px" });
  pages.forEach((p) => io.observe(p));

  /* helper: timeline that plays when a page arrives */
  const onPage = (sel, build) => {
    const tl = G.timeline({ paused: true });
    build(tl);
    ST.create({ trigger: sel, start: "top 65%", onEnter: () => tl.play() });
  };

  /* P.002 contents */
  onPage("#contents", (tl) => tl
    .from(".contents__title .ch", { yPercent: 105, duration: 1, stagger: .05, ease: "expo.out" })
    .from(".contents__meta", { opacity: 0, x: 30, duration: .6 }, "<.3")
    .from(".toc li", { clipPath: "inset(0 100% 0 0)", duration: .9, stagger: .08, ease: "expo.inOut" }, "<.1")
    .from(".toc__p", { opacity: 0, y: 20, stagger: .08, duration: .5 }, "<.3")
    .from(".letter > *", { opacity: 0, y: 30, stagger: .1, duration: .7, ease: "power3.out" }, "<"));

  /* P.003 eye */
  onPage("#adEye", (tl) => tl
    .from(".ad-eye__photo", { clipPath: "inset(0 100% 0 0)", duration: 1.3, ease: "expo.inOut" })
    .from(".ad-eye__logo", { opacity: 0, x: 60, duration: .8, ease: "expo.out" }, "<.4")
    .from(".ad-eye__phones", { y: -500, rotate: -20, duration: 1.3, ease: "bounce.out" }, "<.1")
    .from(".ad-eye__caption", { opacity: 0, y: 14, duration: .8 }, "<.6")
    .from(".ad-eye__copy", { opacity: 0, y: 20, duration: .8 }, "<.2"));
  G.fromTo(".ad-eye__num span", { yPercent: 40 }, { yPercent: -40, ease: "none", scrollTrigger: { trigger: "#adEye", start: "top bottom", end: "bottom top", scrub: true } });
  loop("#adEye",
    G.to(".ph--phone:nth-child(1)", { y: -14, rotate: -6, duration: 2.4, yoyo: true, repeat: -1, ease: "sine.inOut" }),
    G.to(".ph--phone:nth-child(2)", { y: 12, rotate: 11, duration: 2.8, yoyo: true, repeat: -1, ease: "sine.inOut" }));

  /* P.004 yellow */
  onPage("#adYel", (tl) => tl
    .from(".ad-yel__main", { scale: 1.2, opacity: 0, duration: 1.4, ease: "expo.out" })
    .from(".pan", { xPercent: -110, duration: .9, stagger: .1, ease: "expo.out" }, "<.1")
    .from(".ad-yel__title span", { yPercent: 110, opacity: 0, duration: 1, stagger: .12, ease: "expo.out" }, "<.3")
    .from(".ad-yel__tr > *", { opacity: 0, y: -12, stagger: .08, duration: .6 }, "<")
    .from(".ad-yel__box", { scale: .6, rotate: -8, opacity: 0, duration: .8, ease: "back.out(2)" }, "<.3"));

  /* P.005 play */
  onPage("#adPlay", (tl) => tl
    .from(".play__photo", { scale: 1.3, opacity: 0, duration: 1.3, ease: "expo.out" })
    .from(".play__logo > *", { x: -60, opacity: 0, stagger: .1, duration: .8, ease: "expo.out" }, "<.2")
    .from(".play__sign", { y: -120, stagger: .15, duration: .9, ease: "bounce.out" }, "<")
    .from(".gem", { y: -200, opacity: 0, duration: 1, ease: "back.out(1.8)" }, "<.2")
    .from(".play__top", { y: -30, opacity: 0, duration: .8, ease: "expo.out" }, "<")
    .from(".play__hero", { y: 80, opacity: 0, duration: 1.1, ease: "expo.out" }, "<.1")
    .from(".bub", { scale: 0, opacity: 0, stagger: .09, duration: .5, ease: "back.out(3)" }, "<.4")
    .from(".play__card", { x: 80, opacity: 0, duration: .8, ease: "expo.out" }, "<")
    .from(".play__shelf, .play__caption", { y: 60, opacity: 0, stagger: .1, duration: .8, ease: "expo.out" }, "<.1")
    .from(".play__legal > *", { scale: 0, stagger: .1, duration: .5, ease: "back.out(2.5)" }, "<.2"));

  /* P.005 disc */
  const y2k = $(".ad-disc .y2k");
  y2k.innerHTML = [...y2k.textContent].map((c) => `<span style="display:inline-block">${c}</span>`).join("");
  onPage("#adDisc", (tl) => tl
    .from(".disc__photo", { clipPath: "inset(0 0 100% 0)", duration: 1.2, ease: "expo.inOut" })
    .from(".y2k span", { scale: 2.4, opacity: 0, filter: "blur(10px)", duration: .8, stagger: .045, ease: "expo.out" }, "<.5")
    .from(".disc__walk", { x: -80, opacity: 0, duration: .8, ease: "expo.out" }, "<.4")
    .from(".disc__script", { scale: 0, rotate: -12, duration: .7, ease: "back.out(2.5)" }, "<.2")
    .from(".disc__head > *", { opacity: 0, y: -16, stagger: .1, duration: .6 }, "<")
    .from(".disc__side, .disc__circle", { opacity: 0, x: 60, stagger: .1, duration: .8, ease: "expo.out" }, "<")
    .from(".disc__bottom", { yPercent: 100, duration: 1, ease: "expo.out" }, "<.1")
    .from("#discProd", { rotate: -360, x: -200, duration: 1.4, ease: "expo.out" }, "<.2")
    .from(".spec tr", { opacity: 0, x: 20, stagger: .06, duration: .5 }, "<.2")
    .from(".sw", { scale: 0, stagger: .08, duration: .5, ease: "back.out(3)" }, "<.3"));

  /* P.006 j5 */
  const j5 = $(".j5__name");
  j5.innerHTML = [...j5.textContent].map((c) => `<span style="display:inline-block">${c}</span>`).join("");
  onPage("#adJ5", (tl) => tl
    .from(".j5__model", { opacity: 0, x: 100, duration: 1.3, ease: "expo.out" })
    .from(".j5__head > *", { opacity: 0, y: 20, stagger: .08, duration: .6 }, "<")
    .from(".j5__name span", { yPercent: 100, rotateX: -90, opacity: 0, transformPerspective: 600, duration: .9, stagger: .07, ease: "expo.out" }, "<.2")
    .from(".j5__views", { rotateY: 180, scale: .5, opacity: 0, transformPerspective: 900, duration: 1.4, ease: "expo.out" }, "<.2")
    .from(".j5__bubble", { scale: 0, duration: .7, ease: "back.out(2)" }, "<.5")
    .from(".j5__new", { scale: 0, rotate: 30, duration: .6, ease: "back.out(3)" }, "<")
    .from(".j5__row > *, .j5__feat > *, .j5__jp", { opacity: 0, y: 40, stagger: .1, duration: .8, ease: "power3.out" }, "<.2")
    .from(".j5__thumbs button", { y: 30, opacity: 0, stagger: .06, duration: .5 }, "<.3"));

  /* P.007 lilac */
  onPage("#adLilac", (tl) => tl
    .from(".lilac__photo", { clipPath: "inset(100% 0 0 0)", duration: 1.3, ease: "expo.inOut" })
    .from(".lilac__col", { xPercent: 100, duration: 1.1, ease: "expo.out" }, "<.2")
    .from(".lilac__col > *", { opacity: 0, y: 24, stagger: .1, duration: .7 }, "<.4")
    .from(".lilac__inset", { opacity: 0, y: -60, rotate: 10, duration: 1, ease: "back.out(1.6)" }, "<")
    .from(".lilac__prod", { opacity: 0, y: 200, duration: 1.2, ease: "expo.out" }, "<.2")
    .from(".lilac__foot > *", { opacity: 0, stagger: .15, duration: .6 }, "<.3"));
  loop("#adLilac", G.to(".lilac__prod", { y: -16, rotate: -9, duration: 2.6, yoyo: true, repeat: -1, ease: "sine.inOut" }));

  /* P.008 split */
  onPage("#adSplit", (tl) => tl
    .from(".split__r", { clipPath: "inset(0 0 0 100%)", duration: 1.2, ease: "expo.inOut" })
    .from(".bubbles", { scale: .4, opacity: 0, duration: 1.2, ease: "back.out(1.5)" }, "<")
    .from(".split__logo > *", { opacity: 0, x: -40, stagger: .12, duration: .8, ease: "expo.out" }, "<.2")
    .from(".split__photo", { yPercent: 30, opacity: 0, duration: 1.1, ease: "expo.out" }, "<.1")
    .from(".split__r > *", { opacity: 0, y: 30, stagger: .08, duration: .7 }, "<.2"));

  /* P.009 coupon */
  onPage("#coupon", (tl) => tl
    .from("#couponCard", { y: 200, rotate: 8, opacity: 0, duration: 1.2, ease: "expo.out" })
    .from(".coupon__off", { scale: 1.6, opacity: 0, duration: .8, ease: "expo.out" }, "<.3")
    .from(".coupon__form > *", { opacity: 0, x: 20, stagger: .08, duration: .5 }, "<.2"));

  /* back cover */
  G.from(".back__big", { yPercent: 60, scaleY: .4, transformOrigin: "50% 100%", ease: "none",
    scrollTrigger: { trigger: ".back", start: "top bottom", end: "bottom bottom", scrub: true } });

  addEventListener("load", () => ST.refresh());
})();
