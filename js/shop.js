/* =========================================================
   NODEX STORE — the online catalogue
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const G = window.gsap;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const animated = !!G && !reduce;

  const P = window.NODEX_PRODUCTS.filter((p) => !p.hidden);
  const CATS = window.NODEX_CATEGORIES;
  const catName = (id) => (CATS.find((c) => c.id === id) || {}).name || id;
  const money = (n) => "€" + (n % 1 ? n.toFixed(2) : n);
  const no = (i) => "No." + String(i + 1).padStart(3, "0");

  /* =========================================================
     COLOURS — every swatch really recolours the product photo.
     The first colour of a product is the one in the photo; the
     others are reached with a CSS filter worked out from HSL.
     ========================================================= */
  const hsl = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
    const d = max - min;
    if (!d) return { h: 0, s: 0, l, d };
    const s = l > .5 ? d / (2 - max - min) : d / (max + min);
    const h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return { h: h * 60, s, l, d };
  };
  const neutral = (c) => c.d < .085 || c.l < .12; // low chroma = white / silver / black
  const colorName = (hex) => {
    const c = hsl(hex);
    if (neutral(c)) return c.l < .22 ? "Black" : c.l < .5 ? "Graphite" : c.l > .93 ? "White" : "Silver";
    const h = c.h;
    if (c.l < .25) return "Black";
    if (c.l > .84) return h > 280 || h < 20 ? "Blush" : h < 70 ? "Cream" : h < 200 ? "Mint" : "Ice";
    return h < 15 ? "Red" : h < 45 ? "Orange" : h < 70 ? "Yellow" : h < 160 ? "Lime" : h < 200 ? "Aqua"
      : h < 245 ? "Blue" : h < 270 ? "Indigo" : h < 300 ? "Lilac" : h < 345 ? "Pink" : "Rose";
  };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  // → { flt: CSS filter on the photo, tint: colour multiplied over the product's own shape }
  const recolor = (baseHex, targetHex) => {
    const none = { flt: "none", tint: "transparent" };
    if (baseHex === targetHex) return none;
    const b = hsl(baseHex), t = hsl(targetHex);
    if (neutral(t)) {
      if (t.l < .25) return { flt: "grayscale(1) brightness(.42) contrast(1.25)", tint: "transparent" };
      if (b.l < .25) return { flt: "grayscale(1) invert(.86) brightness(1.04)", tint: "transparent" };
      return { flt: `grayscale(1) brightness(${(0.92 + t.l * .16).toFixed(2)})`, tint: "transparent" };
    }
    if (neutral(b) && b.l >= .25) // white / silver product → a colour: paint it with a multiply layer
      return { flt: "none", tint: targetHex };
    if (neutral(b)) // black product → a colour
      return { flt: `invert(.8) sepia(1) hue-rotate(${Math.round(t.h - 35)}deg) saturate(${(1.4 + t.s * 2.4).toFixed(2)})`, tint: "transparent" };
    const dh = Math.round((((t.h - b.h) % 360) + 360) % 360);
    return { flt: `hue-rotate(${dh}deg) saturate(${clamp(t.s / b.s, .45, 2.2).toFixed(2)}) brightness(${clamp(t.l / b.l, .5, 1.5).toFixed(2)})`, tint: "transparent" };
  };
  const paint = (el, base, target) => { const r = recolor(base, target); el.style.setProperty("--flt", r.flt); el.style.setProperty("--tint", r.tint); };
  const slot = (p) => `<span class="ph cut" data-img="${p.img}" data-label="${p.img.replace("img/", "")}"><span class="tint" style="-webkit-mask-image:url(${p.img});mask-image:url(${p.img})"></span></span>`;
  const swatchName = (p, k) => (p.colorNames && p.colorNames[k]) || colorName(p.colors[k]);

  /* ---------- lazy image slots (decoded before they appear) ---------- */
  const slotIO = new IntersectionObserver((ents) => ents.forEach((e) => {
    if (!e.isIntersecting) return;
    slotIO.unobserve(e.target);
    loadSlot(e.target);
  }), { rootMargin: "400px 0px" });
  function loadSlot(ph) {
    if (ph.dataset.state) return;
    ph.dataset.state = "loading";
    const img = new Image();
    img.alt = "";
    img.decoding = "async";
    img.src = ph.dataset.img;
    (img.decode ? img.decode() : new Promise((r, x) => { img.onload = r; img.onerror = x; }))
      .then(() => { ph.appendChild(img); ph.classList.add("is-loaded"); })
      .catch(() => {});
  }

  /* ---------- build cards ---------- */
  const grid = $("#grid");
  const cards = P.map((p, i) => {
    const el = document.createElement("article");
    el.className = "card";
    el.dataset.id = p.id;
    el.dataset.color = "0";
    el.style.setProperty("--bg", p.bg);
    const badge = p.badge ? `<span class="card__badge card__badge--${p.badge.toLowerCase()}">${p.badge === "SALE" && p.was ? "-" + Math.round((1 - p.price / p.was) * 100) + "%" : p.badge}</span>` : "";
    const dots = p.colors.length > 1
      ? p.colors.map((c, k) => `<button class="${k ? "" : "is-on"}" style="--c:${c}" data-k="${k}" aria-label="${swatchName(p, k)}" title="${swatchName(p, k)}"></button>`).join("")
      : "";
    el.innerHTML = `
      <button class="card__look" aria-label="Quick look: ${p.name}">
        <span class="card__top"><span class="card__no">ITEM ${String(i + 1).padStart(3, "0")}</span><span class="card__catchip">${catName(p.cat).toUpperCase()}</span></span>
        <span class="card__panel frame">
          <span class="grid-bg"></span><span class="floor"></span>
          ${slot(p)}${badge}
          <span class="card__hint">QUICK LOOK +</span>
        </span>
      </button>
      <div class="card__body">
        <p class="card__cat">EST. ${p.year}${p.was ? " · ON SALE" : ""}</p>
        <h3 class="card__name">${p.name}</h3>
        <p class="card__blurb">${p.blurb}</p>
        <span class="card__colorname">${p.colors.length > 1 ? swatchName(p, 0) : ""}</span>
        <div class="card__foot">
          <p class="card__price${p.was ? " is-sale" : ""}">${money(p.price)}${p.was ? `<small>was ${money(p.was)}</small>` : ""}</p>
          <span class="card__dots">${dots}</span>
          <button class="card__add" aria-label="Add ${p.name} to bag">ADD +</button>
        </div>
      </div>`;
    return el;
  });

  /* ---------- editorial tiles (only in the full, featured view) ---------- */
  const tile = (cls, html, at, cat) => {
    const el = document.createElement("button");
    el.className = "tile " + cls;
    el.innerHTML = html;
    el.dataset.at = at;
    el.dataset.cat = cat;
    const h = $(".tile__title", el);
    h.innerHTML = [...h.textContent].map((c) => (c === " " ? " " : `<span class="ch">${c}</span>`)).join("");
    return el;
  };
  const tiles = [
    tile("tile--tall", `
      <span class="ph" data-img="img/j5-model.webp" data-label="j5-model"></span>
      <span class="tile__kick chip">FLIPS · SLIDERS · BAR PHONES</span>
      <p class="tile__title">hello future</p>
      <p class="tile__txt">Flip it, slide it, swivel it. Phones that actually feel like something.</p>
      <span class="tile__cta">SHOW MOBILE →</span>`, 2, "mobile"),
    tile("tile--wide", `
      <span class="ph" data-img="img/gaming-model.webp" data-label="gaming-model"></span>
      <span class="tile__kick chip">RETRO CONSOLES · CLEANED · TESTED</span>
      <p class="tile__title tile__title--lime">PRESS START</p>
      <p class="tile__txt">PSP, Wii, DS Lite, GBA SP, PS2 and GameCube — ready for round two.</p>
      <span class="tile__cta">SHOW CONSOLES →</span>`, 9, "gaming"),
    tile("tile--tall", `
      <span class="ph" data-img="img/disc-model.webp" data-label="disc-model"></span>
      <span class="tile__kick chip">WALKMAN · BOOMBOX · CD</span>
      <p class="tile__title">music play</p>
      <p class="tile__txt">Pocket players, boomboxes and headphones. Press play, loudly.</p>
      <span class="tile__cta">SHOW AUDIO →</span>`, 17, "audio"),
  ];

  const all = [...cards, ...tiles];
  all.forEach((el) => grid.appendChild(el));
  $$(".ph[data-img]", grid).forEach((ph) => slotIO.observe(ph));

  /* ---------- tabs ---------- */
  const tabs = $("#tabs");
  const inCat = (p, cat) => cat === "all" || (cat === "sale" ? !!p.was : p.cat === cat);
  const tabData = [{ id: "all", name: "All" }, { id: "sale", name: "Sale ●" }, ...CATS];
  tabs.innerHTML = tabData.map((c) => {
    const n = P.filter((p) => inCat(p, c.id)).length;
    return `<button class="tab" role="tab" data-cat="${c.id}">${c.name}<sup>${n}</sup></button>`;
  }).join("");
  $("#factCount").textContent = String(P.length).padStart(2, "0");

  /* ---------- state ---------- */
  const url = new URL(location.href);
  const state = {
    cat: tabData.some((c) => c.id === url.searchParams.get("cat")) ? url.searchParams.get("cat") : "all",
    q: "",
    sort: "featured",
    brand: (window.NODEX_BRANDS || []).some((b) => b.id === url.searchParams.get("brand")) ? url.searchParams.get("brand") : "",
  };
  const brandName = (id) => ((window.NODEX_BRANDS || []).find((b) => b.id === id) || {}).name || id;
  const featuredRank = {};
  CATS.forEach((c, ci) => P.filter((p) => p.cat === c.id).forEach((p, k) => (featuredRank[p.id] = k * 10 + ci)));
  const sorters = {
    featured: (a, b) => featuredRank[a.id] - featuredRank[b.id],
    new: (a, b) => b.year - a.year,
    low: (a, b) => a.price - b.price,
    high: (a, b) => b.price - a.price,
    az: (a, b) => a.name.localeCompare(b.name),
  };

  function compute() {
    const q = state.q.trim().toLowerCase();
    const list = P
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => inCat(p, state.cat))
      .filter(({ p }) => !state.brand || p.brand === state.brand)
      .filter(({ p }) => !q || (p.name + " " + p.cat + " " + p.blurb).toLowerCase().includes(q))
      .sort((a, b) => sorters[state.sort](a.p, b.p) || a.i - b.i);
    const visible = list.map(({ i }) => cards[i]);
    if (state.cat === "all" && !q && !state.brand && state.sort === "featured") tiles.forEach((t) => visible.splice(Math.min(+t.dataset.at, visible.length), 0, t));
    return { list, visible, q };
  }

  function apply({ list, visible, q }) {
    const hidden = all.filter((el) => !visible.includes(el));
    visible.forEach((el) => { el.hidden = false; grid.appendChild(el); });
    hidden.forEach((el) => { el.hidden = true; grid.appendChild(el); });
    $$(".tab", tabs).forEach((t) => {
      const on = t.dataset.cat === state.cat;
      t.classList.toggle("is-on", on);
      t.setAttribute("aria-selected", on);
    });
    $("#resultCount").textContent = list.length;
    $("#resultLabel").textContent = `${list.length === 1 ? "item" : "items"} ${state.cat === "all" ? "in all departments" : state.cat === "sale" ? "on sale" : "in " + catName(state.cat)}${state.brand ? ` by ${brandName(state.brand)}` : ""}${q ? ` matching “${state.q.trim()}”` : ""}`;
    let pill = $("#brandPill");
    if (state.brand) {
      if (!pill) { pill = document.createElement("button"); pill.id = "brandPill"; pill.className = "chip chip--dark brand-pill"; $(".result-line").appendChild(pill); }
      pill.textContent = brandName(state.brand).toUpperCase() + " ✕";
    } else if (pill) pill.remove();
    $("#empty").hidden = list.length > 0;
  }

  /* ---------- smooth filter change ----------
     1) what's on screen fades down, 2) grid swaps while its height glides
     to the new size (no collapse / page jump), 3) new items fade up in order */
  let busy = false, queued = false;
  function render(animate) {
    const next = compute();
    if (!animate || !animated) { apply(next); return; }
    if (busy) { queued = true; return; }
    busy = true;

    const current = all.filter((el) => !el.hidden);
    const h0 = grid.offsetHeight;
    grid.style.height = h0 + "px";
    const swap = () => {
        apply(next);
        G.set(next.visible, { opacity: 0, y: 18 });
        grid.style.height = "auto";
        const h1 = grid.offsetHeight;
        grid.style.height = h0 + "px";
        G.to(grid, { height: h1, duration: .45, ease: "power3.inOut", onComplete: () => (grid.style.height = "") });

        // keep the top of the results in view
        const barH = $("#filters").offsetHeight + parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--top") || 84);
        const top = grid.getBoundingClientRect().top;
        if (top < barH) scrollTo({ top: scrollY + top - barH - 60, behavior: "smooth" });

        next.visible.forEach((el) => { el.dataset.revealed = "1"; revealIO.unobserve(el); });
        G.to(next.visible, {
          opacity: 1, y: 0, duration: .5, ease: "power3.out", delay: .08,
          stagger: Math.min(.04, .6 / Math.max(1, next.visible.length)), clearProps: "transform",
          onComplete() { busy = false; if (queued) { queued = false; render(true); } },
        });
        if (!next.visible.length) { busy = false; if (queued) { queued = false; render(true); } }
    };
    if (current.length) G.to(current, { opacity: 0, y: 12, duration: .2, ease: "power2.in", stagger: Math.min(.012, .15 / current.length), overwrite: true, onComplete: swap });
    else swap();
  }

  function setCat(cat) {
    if (state.cat === cat) return;
    state.cat = cat;
    const u = new URL(location.href);
    cat === "all" ? u.searchParams.delete("cat") : u.searchParams.set("cat", cat);
    history.replaceState(null, "", u);
    render(true);
  }

  $(".result-line").addEventListener("click", (e) => {
    if (!e.target.closest("#brandPill")) return;
    state.brand = "";
    const u = new URL(location.href); u.searchParams.delete("brand"); history.replaceState(null, "", u);
    render(true);
  });
  tabs.addEventListener("click", (e) => { const t = e.target.closest(".tab"); if (t) setCat(t.dataset.cat); });
  tiles.forEach((t) => t.addEventListener("click", () => setCat(t.dataset.cat)));
  let qTimer;
  $("#search").addEventListener("input", (e) => {
    clearTimeout(qTimer);
    qTimer = setTimeout(() => { state.q = e.target.value; render(true); }, 220);
  });
  const focusSearch = () => {
    $("#filters").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    setTimeout(() => $("#search").focus({ preventScroll: true }), reduce ? 0 : 500);
  };
  const sb = $("#searchBtn");
  if (sb) sb.addEventListener("click", focusSearch);
  if (url.searchParams.get("search")) setTimeout(focusSearch, 900);
  // shop.html?item=<id> (from search results) opens that product's quick look
  const itemParam = url.searchParams.get("item");
  if (P.some((p) => p.id === itemParam)) setTimeout(() => openQV(itemParam), 900);
  $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; render(true); });
  $("#resetBtn").addEventListener("click", () => {
    state.cat = "all"; state.q = ""; state.sort = "featured"; state.brand = "";
    $("#search").value = ""; $("#sort").value = "featured";
    history.replaceState(null, "", location.pathname);
    render(true);
  });

  /* ---------- card actions ---------- */
  const setCardColor = (card, k) => {
    const p = P.find((x) => x.id === card.dataset.id);
    card.dataset.color = k;
    paint(card, p.colors[0], p.colors[k]);
    $$(".card__dots button", card).forEach((b) => b.classList.toggle("is-on", +b.dataset.k === k));
    $(".card__colorname", card).textContent = swatchName(p, k);
  };
  const bagKey = (p, k) => (p.colors.length > 1 ? `${p.id}·${swatchName(p, k)}` : p.id);

  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;
    const p = P.find((x) => x.id === card.dataset.id);
    const dot = e.target.closest(".card__dots button");
    if (dot) { setCardColor(card, +dot.dataset.k); return; }
    if (e.target.closest(".card__add")) {
      const btn = e.target.closest(".card__add");
      NodexBag.fly($(".card__panel .ph", card), bagKey(p, +card.dataset.color));
      btn.classList.add("is-added"); btn.textContent = "ADDED ✓";
      setTimeout(() => { btn.classList.remove("is-added"); btn.textContent = "ADD +"; }, 1400);
    } else if (e.target.closest(".card__look")) {
      openQV(p.id, e.target.closest(".card__look"), +card.dataset.color);
    }
  });

  /* ---------- quick look ---------- */
  const qv = $("#qv");
  let qvProduct = null, qvColor = 0, qty = 1, lastFocus = null, qvTl = null;
  const paintQVColor = () => {
    const p = qvProduct;
    paint($("#qvImg"), p.colors[0], p.colors[qvColor]);
    $$("#qvColors button").forEach((b) => b.classList.toggle("is-on", +b.dataset.k === qvColor));
    $("#qvColorName").textContent = swatchName(p, qvColor);
  };
  function openQV(id, from, color = 0) {
    const i = P.findIndex((p) => p.id === id);
    const p = P[i];
    if (!p) return;
    qvProduct = p; qvColor = color; qty = 1; lastFocus = from || document.activeElement;
    $("#qvPanel").style.setProperty("--bg", p.bg);
    $("#qvNo").textContent = no(i);
    $("#qvCat").textContent = `${catName(p.cat).toUpperCase()} · ${p.year}${p.badge ? " · " + p.badge : ""}`;
    $("#qvName").textContent = p.name;
    $("#qvBlurb").textContent = p.blurb;
    $("#qvSpec").innerHTML = p.specs.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("");
    $("#qvColors").innerHTML = p.colors.map((c, k) => `<button style="--c:${c}" data-k="${k}" aria-label="${swatchName(p, k)}" title="${swatchName(p, k)}"></button>`).join("") + `<em id="qvColorName"></em>`;
    $("#qvPrice").innerHTML = money(p.price) + (p.was ? `<small>was ${money(p.was)}</small>` : "");
    $("#qtyVal").textContent = qty;
    $("#qvAdd").textContent = "ADD TO BAG";
    $("#qvImg").innerHTML = slot(p);
    loadSlot($("#qvImg .ph"));
    paintQVColor();

    qv.hidden = false;
    document.body.classList.add("qv-open");
    $(".qv__x", qv).focus();
    if (animated) {
      qvTl && qvTl.kill();
      qvTl = G.timeline()
        .fromTo(".qv__backdrop", { opacity: 0 }, { opacity: 1, duration: .3 })
        .fromTo(".qv__sheet", { clipPath: "inset(48% 0 48% 0 round 22px)", y: 30 }, { clipPath: "inset(0% 0 0% 0 round 22px)", y: 0, duration: .7, ease: "expo.out" }, "<")
        .fromTo("#qvImg", { scale: .6, rotation: -18, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: .9, ease: "back.out(1.6)" }, "<.15")
        .fromTo(".qv__info > *", { opacity: 0, x: 24 }, { opacity: 1, x: 0, stagger: .05, duration: .5, ease: "power3.out" }, "<.1");
    }
  }
  function closeQV() {
    if (qv.hidden) return;
    const done = () => { qv.hidden = true; document.body.classList.remove("qv-open"); lastFocus && lastFocus.focus && lastFocus.focus(); };
    if (animated) {
      qvTl && qvTl.kill();
      G.timeline({ onComplete: done })
        .to(".qv__sheet", { clipPath: "inset(48% 0 48% 0 round 22px)", duration: .4, ease: "power3.in" })
        .to(".qv__backdrop", { opacity: 0, duration: .25 }, "<.15");
    } else done();
  }
  qv.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeQV(); });
  addEventListener("keydown", (e) => {
    if (qv.hidden) return;
    if (e.key === "Escape") closeQV();
    if (e.key === "Tab") { // keep focus inside the sheet
      const f = $$("button, select, input", $(".qv__sheet"));
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  $("#qvColors").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    qvColor = +b.dataset.k;
    paintQVColor();
    if (animated) G.fromTo("#qvImg", { rotation: -6, scale: .96 }, { rotation: 0, scale: 1, duration: .6, ease: "elastic.out(1, .5)" });
    // keep the card in sync with what was chosen here
    const card = cards.find((c) => c.dataset.id === qvProduct.id);
    if (card) setCardColor(card, qvColor);
  });
  $("#qtyMinus").addEventListener("click", () => { qty = Math.max(1, qty - 1); $("#qtyVal").textContent = qty; });
  $("#qtyPlus").addEventListener("click", () => { qty = Math.min(9, qty + 1); $("#qtyVal").textContent = qty; });
  $("#qvAdd").addEventListener("click", () => {
    if (!qvProduct) return;
    const src = $("#qvImg .ph") || $("#qvImg");
    for (let k = 0; k < qty; k++) setTimeout(() => NodexBag.fly(src, bagKey(qvProduct, qvColor)), k * 120);
    $("#qvAdd").textContent = `ADDED ✓ (${qty})`;
  });

  /* ---------- reveal on scroll (IntersectionObserver: never leaves anything invisible) ---------- */
  const revealIO = new IntersectionObserver((ents) => {
    const els = ents.filter((e) => e.isIntersecting && e.target.dataset.revealed !== "1").map((e) => e.target);
    els.forEach((el) => { el.dataset.revealed = "1"; revealIO.unobserve(el); });
    if (els.length && animated) G.to(els, { opacity: 1, y: 0, stagger: .06, duration: .7, ease: "expo.out", clearProps: "transform" });
  }, { rootMargin: "0px 0px -6% 0px" });

  /* ---------- first render ---------- */
  render(false);
  if (animated) {
    G.set(all, { opacity: 0, y: 40 });
    all.forEach((el) => revealIO.observe(el));
  }

  /* =========================================================
     MOTION — header
     ========================================================= */
  if (!animated) return;
  if (window.ScrollTrigger) G.registerPlugin(ScrollTrigger);

  const name = $(".logo-lockup__name");
  name.innerHTML = [...name.textContent].map((c) => `<span class="ch">${c}</span>`).join("");
  const orbit = $(".logo-lockup__orbit ellipse");
  const len = orbit.getTotalLength ? orbit.getTotalLength() : 1900;
  G.set(orbit, { strokeDasharray: len, strokeDashoffset: len });
  G.timeline({ delay: .1 })
    .from(".store-head__bar > *", { y: -14, opacity: 0, stagger: .08, duration: .5 })
    .from(".logo-lockup__kick", { x: -30, opacity: 0, duration: .6, ease: "expo.out" }, "<.1")
    .from(".logo-lockup__name .ch", { yPercent: 80, scale: .4, opacity: 0, stagger: .06, duration: .9, ease: "back.out(2)" }, "<.1")
    .to(orbit, { strokeDashoffset: 0, duration: 1.2, ease: "power3.inOut" }, "<.2")
    .from(".logo-lockup__orbit .star", { scale: 0, transformOrigin: "50% 50%", duration: .5, ease: "back.out(3)" }, "-=.3")
    .from(".logo-lockup__store", { letterSpacing: "1.4em", opacity: 0, duration: 1, ease: "expo.out" }, "<")
    .from(".spark, .logo-lockup__jp", { scale: 0, stagger: .08, duration: .5, ease: "back.out(3)" }, "<")
    .from(".store-head__intro, .store-head__lcd li", { y: 24, opacity: 0, stagger: .08, duration: .7, ease: "power3.out" }, "<.1")
    .from(".store-head__model", { y: 80, opacity: 0, duration: 1.1, ease: "expo.out" }, .5)
    .from(".win", { opacity: 0, y: -40, stagger: .15, duration: .8, ease: "back.out(1.6)" }, "<.3")
    .from(".tag", { scale: 0, opacity: 0, stagger: .12, duration: .5, ease: "back.out(2.5)" }, "<.4")
    .from(".filters", { y: -20, opacity: 0, duration: .6 }, "<.2");
  if (fine) {
    const fig = $(".store-head__model");
    $("#storeHead").addEventListener("mousemove", (e) => {
      const mx = e.clientX / innerWidth - .5, my = e.clientY / innerHeight - .5;
      G.to(fig, { x: mx * 24, y: my * 14, duration: 1.2, overwrite: "auto" });
    });
  }

  if (window.ScrollTrigger) {
    G.from(".perk", { y: 40, opacity: 0, stagger: .1, duration: .7, scrollTrigger: { trigger: ".perks", start: "top 90%" } });
    G.from(".back__big", { yPercent: 60, scaleY: .4, transformOrigin: "50% 100%", ease: "none",
      scrollTrigger: { trigger: ".back", start: "top bottom", end: "bottom bottom", scrub: true } });
  }
})();
