/* =========================================================
   NODEX — DEALS (the weekly flyer)
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const G = window.gsap;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const animated = !!G && !reduce;

  const ALL = window.NODEX_PRODUCTS;
  const P = ALL.filter((p) => !p.hidden);
  const CATS = window.NODEX_CATEGORIES;
  const byId = (id) => ALL.find((p) => p.id === id);
  const catName = (id) => (CATS.find((c) => c.id === id) || {}).name || id;
  const money = (n) => "€" + (n % 1 ? n.toFixed(2) : n);
  const pct = (p) => Math.round((1 - p.price / p.was) * 100);
  const SALE = P.filter((p) => p.was);

  /* ---------- lazy image slots (webp/jpg/png, so photos can be dropped in) ---------- */
  const EXT = [".webp", ".jpg", ".png", ".jpeg"];
  const loadSlot = (ph) => {
    if (ph.dataset.state) return;
    ph.dataset.state = "loading";
    const src = ph.dataset.img;
    const tries = /\.\w{3,4}$/.test(src) ? [src] : EXT.map((e) => src + e);
    const next = (k) => {
      if (k >= tries.length) return;
      const img = new Image();
      img.alt = ""; img.decoding = "async"; img.src = tries[k];
      (img.decode ? img.decode() : new Promise((r, x) => { img.onload = r; img.onerror = x; }))
        .then(() => { ph.appendChild(img); ph.classList.add("is-loaded"); })
        .catch(() => next(k + 1));
    };
    next(0);
  };
  const slotIO = new IntersectionObserver((ents) => ents.forEach((e) => {
    if (e.isIntersecting) { slotIO.unobserve(e.target); loadSlot(e.target); }
  }), { rootMargin: "500px 0px" });
  const watch = (root) => $$(".ph[data-img]", root).forEach((ph) => slotIO.observe(ph));
  const addBtn = (btn, id, src, label = "ADD TO BAG") => {
    NodexBag.fly(src, id);
    btn.classList.add("is-added"); btn.textContent = "ADDED ✓";
    setTimeout(() => { btn.classList.remove("is-added"); btn.textContent = label; }, 1400);
  };

  /* ---------- time sale: resets every night at midnight ---------- */
  const midnight = () => { const d = new Date(); d.setHours(24, 0, 0, 0); return d; };
  const clock = $$("#saleClock b");
  const tickSale = () => {
    const s = Math.max(0, Math.floor((midnight() - Date.now()) / 1000));
    [Math.floor(s / 3600), Math.floor(s % 3600 / 60), s % 60].forEach((v, i) => {
      const t = String(v).padStart(2, "0"); if (clock[i].textContent !== t) clock[i].textContent = t;
    });
  };
  tickSale(); setInterval(tickSale, 1000);
  watch($("#flHead"));

  /* ---------- deal of the day: a different sale item every day ---------- */
  const dayIndex = Math.floor(Date.now() / 864e5);
  const top = [...SALE].sort((a, b) => pct(b) - pct(a));
  const dd = top[dayIndex % top.length];
  const elapsed = 1 - (midnight() - Date.now()) / 864e5;
  const claimed = Math.min(96, Math.round(18 + elapsed * 72));
  $("#dotd").innerHTML = `
    <div class="dotd__stage" style="--bg:${dd.bg}"><span class="ph cut" data-img="${dd.img}"></span></div>
    <div class="dotd__info">
      <p class="dotd__label">DEAL OF THE DAY <span class="kanji">本日限り</span></p>
      <h2 class="dotd__name">${dd.name}</h2>
      <p class="dotd__blurb">${dd.blurb}</p>
      <div class="dotd__prices">
        <span class="dotd__price">${money(dd.price)}</span>
        <span class="strike">${money(dd.was)}</span>
        <span class="dotd__save">-${pct(dd)}%</span>
      </div>
      <div class="claimed">
        <p class="claimed__txt"><span>${claimed}% CLAIMED</span><span>ONLY TODAY</span></p>
        <div class="claimed__bar"><i id="claimedBar"></i></div>
      </div>
      <button class="dl-btn" id="ddAdd">ADD TO BAG</button>
    </div>`;
  watch($("#dotd"));
  $("#ddAdd").addEventListener("click", (e) => addBtn(e.currentTarget, dd.id, $("#dotd .ph")));
  new IntersectionObserver(([e], io) => { if (e.isIntersecting) { $("#claimedBar").style.width = claimed + "%"; io.disconnect(); } }, { threshold: .4 }).observe($("#dotd"));

  /* ---------- price tags ---------- */
  const chipsData = [{ id: "all", name: "All" }, ...CATS].map((c) => ({ ...c, n: SALE.filter((p) => c.id === "all" || p.cat === c.id).length })).filter((c) => c.n);
  const chips = $("#saleChips");
  chips.innerHTML = chipsData.map((c, i) => `<button class="chip-btn${i ? "" : " is-on"}" data-cat="${c.id}">${c.name}<sup>${c.n}</sup></button>`).join("");
  const grid = $("#saleGrid");
  const tags = SALE.map((p) => {
    const el = document.createElement("article");
    el.className = "tag";
    el.dataset.id = p.id;
    el.style.setProperty("--bg", p.bg);
    el.innerHTML = `
      <span class="tag__pct">-${pct(p)}%</span>
      <div class="tag__img"><span class="ph cut" data-img="${p.img}"></span></div>
      <p class="tag__cat">${catName(p.cat).toUpperCase()}</p>
      <h3 class="tag__name">${p.name}</h3>
      <div class="tag__prices"><span class="tag__price">${money(p.price)}</span><span class="strike">${money(p.was)}</span></div>
      <p class="tag__save">YOU SAVE ${money(Math.round((p.was - p.price) * 100) / 100)}</p>
      <button class="dl-btn">ADD TO BAG</button>`;
    return el;
  });
  tags.forEach((t) => grid.appendChild(t));
  watch(grid);
  const state = { cat: "all", sort: "save" };
  const sorters = { save: (a, b) => pct(b) - pct(a), low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price };
  let busy = false;
  const applyTags = () => {
    const list = SALE.filter((p) => state.cat === "all" || p.cat === state.cat).sort(sorters[state.sort]);
    const vis = list.map((p) => tags.find((t) => t.dataset.id === p.id));
    tags.forEach((t) => { t.hidden = !vis.includes(t); });
    vis.forEach((t) => grid.appendChild(t));
    return vis;
  };
  const render = (animate) => {
    if (!animate || !animated) return applyTags();
    if (busy) return;
    busy = true;
    const current = tags.filter((t) => !t.hidden);
    G.to(current, { opacity: 0, y: -20, duration: .2, stagger: .01, ease: "power2.in", onComplete: () => {
      const vis = applyTags();
      vis.forEach((t) => { t.dataset.revealed = "1"; });
      G.fromTo(vis, { opacity: 0, y: -40 }, { opacity: 1, y: 0, duration: .6, ease: "back.out(1.6)", stagger: .04, clearProps: "transform,translate,opacity",
        onComplete: () => { busy = false; } });
    } });
  };
  chips.addEventListener("click", (e) => {
    const b = e.target.closest(".chip-btn"); if (!b) return;
    $$(".chip-btn", chips).forEach((c) => c.classList.toggle("is-on", c === b));
    state.cat = b.dataset.cat; render(true);
  });
  $("#saleSort").addEventListener("change", (e) => { state.sort = e.target.value; render(true); });
  grid.addEventListener("click", (e) => {
    const b = e.target.closest(".dl-btn"); if (!b) return;
    const t = b.closest(".tag");
    addBtn(b, t.dataset.id, $(".tag__img .ph", t));
  });
  render(false);

  /* ---------- set deals ---------- */
  const SETS = ALL.filter((p) => p.bundle);
  $("#setGrid").innerHTML = SETS.map((s) => `
    <article class="set" data-id="${s.id}">
      <div class="set__row">${s.bundle.map(byId).filter(Boolean).map((p, i) => `${i ? '<span class="set__plus">+</span>' : ""}<span class="set__img" style="--bg:${p.bg}"><span class="ph cut" data-img="${p.img}"></span></span>`).join("")}</div>
      <div class="set__buy">
        <span class="strike">${money(s.was)}</span>
        <span class="set__price">${money(s.price)}</span>
        <span class="set__save">SAVE ${money(Math.round((s.was - s.price) * 100) / 100)}</span>
        <button class="dl-btn dl-btn--yellow">ADD THE SET</button>
      </div>
      <h3 class="set__name">${s.name}</h3>
      <p class="set__blurb">${s.blurb}</p>
    </article>`).join("");
  watch($("#sets"));
  $("#setGrid").addEventListener("click", (e) => {
    const b = e.target.closest(".dl-btn"); if (!b) return;
    const s = b.closest(".set");
    addBtn(b, s.dataset.id, $(".set__row", s), "ADD THE SET");
  });

  /* ---------- lucky bags: shake to peek at what it could hold ---------- */
  const LUCKY = ALL.filter((p) => p.lucky);
  const pool = P.filter((p) => p.price <= 60);
  $("#luckyRow").innerHTML = LUCKY.map((l, i) => `
    <article class="bagcard" data-id="${l.id}">
      <span class="bagcard__size">${"SML"[i]}</span>
      <div class="bagcard__stage">
        <img class="bagcard__bag" src="${l.img}" alt="${l.name}" style="--w:${[52, 64, 78][i]}%" />
        ${[0, 1, 2].map(() => `<img class="bagcard__pop" alt="" />`).join("")}
      </div>
      <h3 class="bagcard__name">${l.name}</h3>
      <p class="bagcard__value">worth €${l.value}+ inside!!</p>
      <p class="bagcard__price">${money(l.price)}</p>
      <p class="bagcard__peek">SHAKE IT TO PEEK ↓</p>
      <div class="bagcard__btns">
        <button class="dl-btn dl-btn--yellow bagcard__shake">SHAKE ★</button>
        <button class="dl-btn bagcard__add">ADD TO BAG</button>
      </div>
    </article>`).join("");
  $("#luckyRow").addEventListener("click", (e) => {
    const card = e.target.closest(".bagcard"); if (!card) return;
    if (e.target.closest(".bagcard__add")) return addBtn(e.target.closest(".bagcard__add"), card.dataset.id, $(".bagcard__bag", card));
    if (!e.target.closest(".bagcard__shake")) return;
    const picks = [...pool].sort(() => Math.random() - .5).slice(0, 3);
    $(".bagcard__peek", card).textContent = "COULD HOLD: " + picks.map((p) => p.name).join(" · ");
    const pops = $$(".bagcard__pop", card);
    pops.forEach((img, k) => { img.src = picks[k].img; });
    if (!animated) return;
    G.timeline()
      .to($(".bagcard__bag", card), { rotation: 8, duration: .08, yoyo: true, repeat: 7, ease: "power1.inOut" })
      .set($(".bagcard__bag", card), { rotation: 0 })
      .fromTo(pops, { opacity: 0, y: 0, x: 0, scale: .3, rotation: 0 },
        { opacity: 1, y: (k) => -120 - k * 10, x: (k) => (k - 1) * 90, scale: 1, rotation: (k) => (k - 1) * 18, duration: .6, stagger: .08, ease: "back.out(2)" })
      .to(pops, { opacity: 0, y: "+=40", duration: .4, delay: 1.4, stagger: .05 });
  });

  /* ---------- coupons: tap to copy ---------- */
  const COUPONS = [
    { off: "10%", code: "NODEX10", txt: "off your first order, on everything.", fine: "One per customer." },
    { off: "15%", code: "RETRO15", txt: "off any console over €150.", fine: "Gaming department only." },
    { off: "€0", sub: "SHIP", code: "FREESHIP", txt: "free shipping, no minimum, all weekend.", fine: "Fri–Sun only." },
  ];
  $("#couponRow").innerHTML = COUPONS.map((c) => `
    <button class="cpn" data-code="${c.code}" aria-label="Copy code ${c.code}">
      <span class="cpn__cut" aria-hidden="true">✂</span>
      <span class="cpn__off">${c.off}<small>${c.sub || "OFF"}</small></span>
      <span class="cpn__txt">${c.txt}</span>
      <span class="cpn__code">${c.code}</span>
      <span class="cpn__fine">${c.fine} Codes apply at checkout.</span>
      <span class="cpn__stamp">COPIED!</span>
    </button>`).join("");
  $("#couponRow").addEventListener("click", (e) => {
    const c = e.target.closest(".cpn"); if (!c) return;
    const code = c.dataset.code;
    (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).catch(() => {
      const t = document.createElement("textarea"); t.value = code; document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); } catch {} t.remove();
    });
    $$(".cpn").forEach((x) => x.classList.remove("is-copied"));
    void c.offsetWidth; c.classList.add("is-copied");
    setTimeout(() => c.classList.remove("is-copied"), 1800);
  });

  /* =========================================================
     MOTION
     ========================================================= */
  if (!animated) return;
  const word = $(".fl-head__word");
  word.innerHTML = [...word.textContent].map((c) => `<span class="ch">${c}</span>`).join("");
  G.timeline({ delay: .1 })
    .from(".fl-head__top span", { y: -16, opacity: 0, stagger: .07, duration: .45 })
    .from(".fl-head__word .ch", { yPercent: -120, rotation: () => G.utils.random(-25, 25), opacity: 0, stagger: .07, duration: .8, ease: "bounce.out" }, "<.1")
    .from(".fl-head__marker", { scale: 0, rotation: -20, duration: .5, ease: "back.out(3)", clearProps: "transform,rotate,scale" }, "-=.3")
    .from(".fl-head__lead, .timesale", { y: 30, opacity: 0, stagger: .1, duration: .6, ease: "power3.out", clearProps: "transform,rotate,translate" }, "<.1")
    .from(".torn", { y: 140, rotation: 20, opacity: 0, duration: 1, ease: "back.out(1.4)", clearProps: "transform,rotate,translate" }, .3)
    .from(".tape", { scale: 0, stagger: .1, duration: .4, ease: "back.out(3)", clearProps: "transform,rotate,scale" }, "-=.3")
    .from(".burst--big", { scale: 0, rotation: -200, duration: .7, ease: "back.out(2)", clearProps: "transform,rotate,scale" }, "<");
  if (fine) {
    const fig = $(".fl-head__photo");
    $("#flHead").addEventListener("mousemove", (e) => {
      const mx = e.clientX / innerWidth - .5, my = e.clientY / innerHeight - .5;
      G.to(fig, { x: mx * 22, y: my * 14, duration: 1.2, overwrite: "auto" });
    });
  }

  const reveal = (els, from, opts = {}) => {
    G.set(els, from);
    const io = new IntersectionObserver((ents) => {
      const vis = ents.filter((e) => e.isIntersecting && e.target.dataset.revealed !== "1").map((e) => e.target);
      vis.forEach((el) => { el.dataset.revealed = "1"; io.unobserve(el); });
      if (vis.length) G.to(vis, { opacity: 1, x: 0, y: 0, scale: 1, stagger: .07, duration: .7, ease: "back.out(1.5)",
        clearProps: "transform,translate,rotate,scale,opacity", ...opts });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => io.observe(el));
  };
  reveal($$(".fl-sec"), { opacity: 0, y: 40 });
  reveal([$(".dotd__stage"), $(".dotd__info")], { opacity: 0, y: 50 });
  reveal(tags, { opacity: 0, y: -60 });
  reveal($$(".set, .sets__banner"), { opacity: 0, y: 50 });
  reveal($$(".bagcard"), { opacity: 0, y: 60 });
  reveal($$(".cpn"), { opacity: 0, y: 40, scale: .9 });

  if (window.ScrollTrigger) {
    G.registerPlugin(ScrollTrigger);
    G.from(".back__big", { yPercent: 60, scaleY: .4, transformOrigin: "50% 100%", ease: "none",
      scrollTrigger: { trigger: ".back", start: "top bottom", end: "bottom bottom", scrub: true } });
  }
})();
