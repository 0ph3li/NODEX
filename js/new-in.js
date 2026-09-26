/* =========================================================
   NODEX — NEW IN (Shibuya street snaps)
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
  const byId = (id) => P.find((p) => p.id === id);
  const catName = (id) => (CATS.find((c) => c.id === id) || {}).name || id;
  const money = (n) => "€" + (n % 1 ? n.toFixed(2) : n);

  /* =========================================================
     STREET SNAPS — each photo + the pieces you can see in it.
     x / y = where the heart sits on the photo, in %.
     ========================================================= */
  // Hearts only on things you can actually see in the photo (measured on the images, in %).
  // "extra" = pieces that go with the look, listed without a heart.
  const SNAPS = [
    { img: "img/newin-snap-01-crop.webp", ar: "3 / 4", label: "SHIBUYA · NIGHT", jp: "渋谷",
      title: "Night out deco", hand: "all that bling ♡",
      profile: [["SPOT", "Shibuya crossing"], ["TIME", "22:14"], ["STYLE", "Hime gyaru"], ["MUST-HAVE", "a deco phone"]],
      pieces: [
        { id: "nx-72-pink", x: 36, y: 40, note: "her pink deco phone → our pink pick" },
        { id: "charm-pack", x: 19, y: 59, note: "the charm strap hanging from it" },
      ],
      extra: ["clear-keychain", "bunny-pouch"] },
    { img: "img/newin-snap-02.webp", ar: "2 / 3", label: "SHIMBASHI · DAY", jp: "新橋",
      title: "Bus stop bling", hand: "pearls + pink, always",
      profile: [["SPOT", "Shimbashi bus stop"], ["TIME", "15:30"], ["STYLE", "Pink bling"], ["MUST-HAVE", "a blinged flip"]],
      pieces: [
        { id: "nx-k1", x: 47, y: 45, note: "the ice blue flip at her ear" },
        { id: "clear-keychain", x: 48, y: 58, note: "a little charm to hang, like her bear" },
      ],
      extra: ["bunny-case", "charm-pack"] },
    { img: "img/newin-snap-03.webp", ar: "3 / 2", wide: true, label: "SHIBUYA 109 · AFTERNOON", jp: "109",
      title: "Leopard duo", hand: "two girls, two flips",
      profile: [["SPOT", "Outside 109"], ["TIME", "17:05"], ["STYLE", "Leopard duo"], ["MUST-HAVE", "flip phones ×2"]],
      pieces: [
        { id: "nx-flip-silver", x: 43, y: 66, note: "the silver flip on the left" },
        { id: "nx-7250", x: 75, y: 77, note: "the lilac flip with the gold rim" },
      ],
      extra: ["digicam-y2k", "charm-pack"] },
  ];


  /* ---------- lazy image slots ---------- */
  const loadSlot = (ph) => {
    if (ph.dataset.state) return;
    ph.dataset.state = "loading";
    const img = new Image();
    img.alt = "";
    img.decoding = "async";
    img.src = ph.dataset.img;
    (img.decode ? img.decode() : new Promise((r, x) => { img.onload = r; img.onerror = x; }))
      .then(() => {
        ph.appendChild(img); ph.classList.add("is-loaded");
      })
      .catch(() => {});
  };
  const slotIO = new IntersectionObserver((ents) => ents.forEach((e) => {
    if (e.isIntersecting) { slotIO.unobserve(e.target); loadSlot(e.target); }
  }), { rootMargin: "500px 0px" });
  const watch = (root) => $$(".ph[data-img]", root).forEach((ph) => slotIO.observe(ph));

  /* ---------- the new pieces ---------- */
  const NEW = P.filter((p) => p.badge === "NEW" || p.year >= 2026);
  $("#heroCount").textContent = `${NEW.length} NEW ITEMS`;
  $("#stripTrack").innerHTML = [...NEW, ...NEW].map((p) => `<span>${p.name}</span><i>♥</i>`).join("");
  const coverPiece = byId(SNAPS[0].pieces[0].id);
  $("#coverCalloutTxt").innerHTML = `${coverPiece.name}<b>${money(coverPiece.price)}</b>`;
  watch($("#gyCover"));

  /* ---------- snaps ---------- */
  const snapList = $("#snapList");
  snapList.innerHTML = SNAPS.map((S, si) => {
    const items = S.pieces.map((pc) => ({ ...pc, p: byId(pc.id) })).filter((x) => x.p);
    const extras = (S.extra || []).map(byId).filter(Boolean);
    const total = [...items.map((x) => x.p), ...extras].reduce((s, p) => s + p.price, 0);
    return `
      <article class="snap${S.wide ? " snap--wide" : ""}" data-snap="${si}">
        <div class="snap__photo">
          <span class="snap__big">SNAP <b>0${si + 1}</b></span>
          <div class="snap__frame">
            <div class="snap__img" style="--ar:${S.ar}">
              <div class="ph" data-img="${S.img}" data-label="${S.img.replace("img/", "")}"></div>
              ${items.map((x, k) => `<button class="hot" style="left:${x.x}%;top:${x.y}%" data-k="${k}" aria-label="${x.p.name}">${k + 1}<span class="hot__tip">${x.p.name}<b>${money(x.p.price)}</b></span></button>`).join("")}
              <span class="snap__place">${S.label}<span class="kanji">${S.jp}</span></span>
            </div>
          </div>
        </div>
        <div class="snap__info">
          <div>
            <div class="profile">
              <p class="profile__title">♡ LOOK PROFILE ♡</p>
              ${S.profile.map(([k, v]) => `<p><span>${k}</span>${v}</p>`).join("")}
            </div>
            <h3 class="snap__title">${S.title}</h3>
            <p class="snap__hand">${S.hand}</p>
          </div>
          <div>
            <p class="checks__head">CHECK POINT!</p>
            <ul class="pieces">
              ${items.map((x, k) => `
                <li class="piece" data-k="${k}" style="--bg:${x.p.bg}">
                  <span class="piece__n">${k + 1}</span>
                  <span class="piece__img"><span class="ph cut" data-img="${x.p.img}"></span></span>
                  <span class="piece__name">${x.p.name}<small>${x.note}</small></span>
                  <span class="piece__price">${money(x.p.price)}</span>
                  <button class="piece__add" data-id="${x.p.id}" aria-label="Add ${x.p.name} to bag">+</button>
                </li>`).join("")}
            </ul>
            ${extras.length ? `<p class="goes__head">+ GOES WITH</p>
            <ul class="pieces pieces--extra">
              ${extras.map((p) => `
                <li class="piece piece--extra" style="--bg:${p.bg}">
                  <span class="piece__n piece__n--plus">+</span>
                  <span class="piece__img"><span class="ph cut" data-img="${p.img}"></span></span>
                  <span class="piece__name">${p.name}<small>${catName(p.cat).toLowerCase()}</small></span>
                  <span class="piece__price">${money(p.price)}</span>
                  <button class="piece__add" data-id="${p.id}" aria-label="Add ${p.name} to bag">+</button>
                </li>`).join("")}
            </ul>` : ""}
            <div class="snap__all">
              <p class="snap__total">THE WHOLE LOOK <b>${money(Math.round(total * 100) / 100)}</b></p>
              <button class="gy-btn gy-btn--pink snap__addall">ADD IT ALL ♡</button>
            </div>
          </div>
        </div>
      </article>`;
  }).join("");
  watch(snapList);

  // hearts ↔ list
  $$(".snap").forEach((snap) => {
    const hots = $$(".hot", snap), rows = $$(".piece:not(.piece--extra)", snap), all = $$(".piece", snap);
    const on = (k) => { hots.forEach((h, i) => h.classList.toggle("is-on", i === k)); rows.forEach((r, i) => r.classList.toggle("is-on", i === k)); };
    hots.forEach((h, k) => {
      h.addEventListener("mouseenter", () => on(k));
      h.addEventListener("mouseleave", () => on(-1));
      h.addEventListener("click", () => {
        on(k);
        if (!fine) rows[k].scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
    rows.forEach((r, k) => { r.addEventListener("mouseenter", () => on(k)); r.addEventListener("mouseleave", () => on(-1)); });
    $(".snap__addall", snap).addEventListener("click", (e) => {
      all.forEach((r, k) => setTimeout(() => NodexBag.fly($(".piece__img .ph", r), $(".piece__add", r).dataset.id), k * 160));
      e.currentTarget.textContent = "ADDED ✓";
    });
  });
  snapList.addEventListener("click", (e) => {
    const b = e.target.closest(".piece__add");
    if (!b) return;
    NodexBag.fly($(".piece__img .ph", b.closest(".piece")), b.dataset.id);
    b.classList.add("is-added"); b.textContent = "✓";
    setTimeout(() => { b.classList.remove("is-added"); b.textContent = "+"; }, 1400);
  });

  /* ---------- just landed ---------- */
  const landed = $("#landedGrid");
  landed.innerHTML = NEW.map((p) => `
    <article class="nw" style="--bg:${p.bg}">
      <span class="nw__burst">NEW!!</span>
      <div class="nw__img"><span class="ph cut" data-img="${p.img}"></span></div>
      <div class="nw__body">
        <p class="nw__cat">${catName(p.cat).toUpperCase()}</p>
        <h3 class="nw__name">${p.name}</h3>
        <div class="nw__foot">
          <span class="nw__price">${money(p.price)}</span>
          <button class="nw__add" data-id="${p.id}">ADD ♡</button>
        </div>
      </div>
    </article>`).join("");
  watch(landed);
  landed.addEventListener("click", (e) => {
    const b = e.target.closest(".nw__add");
    if (!b) return;
    NodexBag.fly($(".nw__img .ph", b.closest(".nw")), b.dataset.id);
    b.classList.add("is-added"); b.textContent = "ADDED ✓";
    setTimeout(() => { b.classList.remove("is-added"); b.textContent = "ADD ♡"; }, 1400);
  });

  /* ---------- coming soon: every Friday at 18:00 ---------- */
  const nextFriday = (from) => {
    const d = new Date(from);
    d.setHours(18, 0, 0, 0);
    let add = (5 - d.getDay() + 7) % 7;
    if (add === 0 && from >= d) add = 7;
    d.setDate(d.getDate() + add);
    return d;
  };
  const DROPS = [
    { name: "Chrome Angel restock", kick: "DROP 10 · AUDIO", txt: "The Studio Max Angel Edition sold out in a day. It’s back — with a second charm.", tease: "img/shop-studio-max.webp" },
    { name: "Deco phone kits", kick: "DROP 11 · ACCESSORIES", txt: "Rhinestones, pearls and bows to deco your own phone, Shibuya style.", tease: "img/charms.webp" },
    { name: "Candy Flips vol. 2", kick: "DROP 12 · MOBILE", txt: "New shells for the NX-72: mint, lemon and a very loud orange.", tease: "img/mobile-phone-1.webp" },
  ];
  let d = nextFriday(new Date());
  DROPS.forEach((drop) => { drop.date = new Date(d); d = nextFriday(new Date(d.getTime() + 60000)); });
  const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const NKEY = "nodex-notify";
  const notified = (() => { try { return JSON.parse(localStorage.getItem(NKEY)) || []; } catch { return []; } })();
  $("#dropRow").innerHTML = DROPS.map((drop, i) => `
    <article class="strip">
      <span class="strip__stamp">SOON<br/>!!</span>
      <div class="strip__frames">${[0, 1, 2].map(() => `<span><span class="ph cut" data-img="${drop.tease}"></span></span>`).join("")}</div>
      <div class="strip__info">
        <p class="strip__date">${String(drop.date.getDate()).padStart(2, "0")}.${String(drop.date.getMonth() + 1).padStart(2, "0")}<small>${MON[drop.date.getMonth()]} · FRI 18:00</small></p>
        <p class="strip__kick">${drop.kick}</p>
        <h3 class="strip__name">${drop.name}</h3>
        <p class="strip__txt">${drop.txt}</p>
        <button class="notify${notified.includes(i) ? " is-on" : ""}" data-i="${i}">${notified.includes(i) ? "ON THE LIST ♡" : "NOTIFY ME"}</button>
      </div>
    </article>`).join("");
  watch($("#dropRow"));
  $("#dropRow").addEventListener("click", (e) => {
    const b = e.target.closest(".notify");
    if (!b) return;
    const i = +b.dataset.i;
    const k = notified.indexOf(i);
    k >= 0 ? notified.splice(k, 1) : notified.push(i);
    try { localStorage.setItem(NKEY, JSON.stringify(notified)); } catch {}
    const on = notified.includes(i);
    b.classList.toggle("is-on", on);
    b.textContent = on ? "ON THE LIST ♡" : "NOTIFY ME";
    if (animated) G.fromTo(b, { scale: .85 }, { scale: 1, duration: .5, ease: "back.out(3)" });
  });

  /* ---------- countdown ---------- */
  const cd = $$("#countdown b");
  const tick = () => {
    const s = Math.max(0, Math.floor((DROPS[0].date - Date.now()) / 1000));
    [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60]
      .forEach((v, i) => { const t = String(v).padStart(2, "0"); if (cd[i].textContent !== t) cd[i].textContent = t; });
  };
  tick(); setInterval(tick, 1000);

  $("#toSnaps").addEventListener("click", () => $("#snaps").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }));

  /* =========================================================
     MOTION
     ========================================================= */
  if (!animated) return;

  G.timeline({ delay: .1 })
    .from(".gy-issue span", { y: -14, opacity: 0, stagger: .07, duration: .5 })
    .from(".gy-cover__kick", { scale: 0, rotation: -20, duration: .6, ease: "back.out(2.5)", clearProps: "transform,translate,rotate,scale" }, "<.1")
    .from(".gy-cover__new", { yPercent: 70, opacity: 0, duration: .9, ease: "back.out(1.6)" }, "<.1")
    .from(".gy-cover__in", { xPercent: 40, opacity: 0, duration: .9, ease: "back.out(1.6)" }, "<.12")
    .from(".gy-cover__hand", { opacity: 0, x: -30, duration: .7 }, "<.3")
    .from(".gy-cover__lead, .gy-count, .gy-cover__ctas", { y: 30, opacity: 0, stagger: .1, duration: .7, ease: "power3.out" }, "<.1")
    .from(".puri", { y: 120, rotation: 18, opacity: 0, duration: 1.1, ease: "back.out(1.4)", clearProps: "transform,translate,rotate,scale" }, .35)
    .from(".stk, .sparkle", { scale: 0, stagger: .08, duration: .5, ease: "back.out(3)", clearProps: "transform,translate,rotate,scale" }, "-=.4")
    .from(".callout--cover", { scale: 0, rotation: -30, duration: .6, ease: "back.out(2.5)", clearProps: "transform,translate,rotate,scale" }, "<.2")
    .from(".gy-cover__jp", { opacity: 0, y: -30, duration: .6 }, "<");

  if (fine) {
    const fig = $(".gy-cover__photo");
    $("#gyCover").addEventListener("mousemove", (e) => {
      const mx = e.clientX / innerWidth - .5, my = e.clientY / innerHeight - .5;
      G.to(fig, { x: mx * 24, y: my * 16, duration: 1.2, overwrite: "auto" });
    });
  }

  // reveal on scroll (IntersectionObserver: never leaves anything hidden)
  const reveal = (els, from, opts = {}) => {
    G.set(els, from);
    const io = new IntersectionObserver((ents) => {
      const vis = ents.filter((e) => e.isIntersecting).map((e) => e.target);
      vis.forEach((el) => io.unobserve(el));
      if (vis.length) G.to(vis, { opacity: 1, x: 0, y: 0, scale: 1, rotation: 0, stagger: .08, duration: .8, ease: "back.out(1.4)",
        clearProps: "transform,translate,rotate,scale,opacity", ...opts });
    }, { rootMargin: "0px 0px -10% 0px" });
    els.forEach((el) => io.observe(el));
  };
  reveal($$(".gy-head"), { opacity: 0, y: 40 });
  reveal($$(".snap__frame"), { opacity: 0, y: 60 });
  reveal($$(".snap__big"), { opacity: 0, scale: 0 });
  reveal($$(".snap__info"), { opacity: 0, y: 40 });
  reveal($$(".hot"), { opacity: 0, scale: 0 }, { ease: "back.out(3)", duration: .6, stagger: .12, delay: .4 });
  reveal($$(".nw"), { opacity: 0, y: 40 });
  reveal($$(".strip"), { opacity: 0, y: 50 });

  if (window.ScrollTrigger) {
    G.registerPlugin(ScrollTrigger);
    G.from(".back__big", { yPercent: 60, scaleY: .4, transformOrigin: "50% 100%", ease: "none",
      scrollTrigger: { trigger: ".back", start: "top bottom", end: "bottom bottom", scrub: true } });
  }
})();
