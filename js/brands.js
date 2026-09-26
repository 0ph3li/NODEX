/* =========================================================
   NODEX — BRANDS (street snap on the crossing)
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const G = window.gsap;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const animated = !!G && !reduce;

  const P = window.NODEX_PRODUCTS.filter((p) => !p.hidden);
  const B = window.NODEX_BRANDS;
  const byId = (id) => P.find((p) => p.id === id);
  const money = (n) => "€" + (n % 1 ? n.toFixed(2) : n);
  const GLOW = { sony: "#4f8bff", nintendo: "#ff3040", canon: "#ffb020", panasonic: "#29c8ff", lg: "#ff3fa6",
    nodex: "#9b6bff", "nodex-vintage": "#ff7a2f", "nodex-charms": "#ff7ccf" };
  const FLOOR = { "nodex-vintage": "B1", nodex: "1F", "nodex-charms": "2F", sony: "3F", nintendo: "4F", canon: "5F", panasonic: "6F", lg: "7F" };
  const WHAT = { sony: "Consoles · Walkman · Laptops · Camcorders", nintendo: "Home consoles · Handhelds", canon: "Digital cameras",
    panasonic: "Laptops · Camcorders", lg: "Mobile phones", nodex: "NX phones · Pocket Disc · Headphones · Keyboards",
    "nodex-vintage": "Retro audio · Phones · Camcorders", "nodex-charms": "Charms · Cases · Pouches · Pets" };

  /* ---------- logos: official marks for makers, the NODEX wordmark family for our lines ---------- */
  const SUB = { "nodex-vintage": "VINTAGE", "nodex-charms": "CHARMS" };
  const logo = (b) => b.house
    ? `<span class="nxm" aria-label="${b.name}"><b>NODEX<sup>®</sup></b>${SUB[b.id] ? `<small>${SUB[b.id]}</small>` : ""}</span>`
    : `<img src="img/logos/${b.id}.svg" alt="${b.name}" />`;

  /* ---------- lazy image slots ---------- */
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
        .then(() => {
          ph.appendChild(img); ph.classList.add("is-loaded");
          if (img.naturalWidth / img.naturalHeight > 1.7) ph.closest(".item")?.classList.add("is-wide");
        })
        .catch(() => next(k + 1));
    };
    next(0);
  };
  const slotIO = new IntersectionObserver((ents) => ents.forEach((e) => {
    if (e.isIntersecting) { slotIO.unobserve(e.target); loadSlot(e.target); }
  }), { rootMargin: "500px 0px" });
  const watch = (root) => $$(".ph[data-img]", root).forEach((ph) => slotIO.observe(ph));

  /* =========================================================
     COVER
     ========================================================= */
  // title as single sticker letters (animated one by one)
  const word = $("#coverWord");
  word.innerHTML = [...word.textContent].map((c) => `<span>${c}</span>`).join("");
  // brand billboards either side of the photo: four left, four right
  const bill = (b) => `<button class="bill" data-go="${b.id}" aria-label="Go to the ${b.name} store">
      <span class="lbx" style="--glow:${GLOW[b.id]}">${logo(b)}</span><span class="bill__floor">${FLOOR[b.id]}</span></button>`;
  $("#billsL").innerHTML = B.slice(0, 4).map(bill).join("");
  $("#billsR").innerHTML = B.slice(4).map(bill).join("");
  $("#statItems").textContent = P.filter((p) => p.brand).length;
  watch($("#xsCover"));

  /* =========================================================
     FLOOR GUIDE
     ========================================================= */
  const order = [...B].sort((a, b) => {
    const n = (f) => (f === "B1" ? 0 : parseInt(f, 10));
    return n(FLOOR[b.id]) - n(FLOOR[a.id]);
  });
  $("#guideList").innerHTML = order.map((b) => `
    <li><button class="floor" data-go="${b.id}" style="--c:${GLOW[b.id]}">
      <span class="floor__no">${FLOOR[b.id]}</span>
      <span class="floor__logo">${logo(b)}</span>
      <span class="floor__what"><b>${b.name}</b>${WHAT[b.id] || b.known}</span>
      <span class="floor__go">${b.items.length} ITEMS →</span>
    </button></li>`).join("");

  /* =========================================================
     STORES
     ========================================================= */
  const pop = (p, i) => p.was
    ? `<span class="pop pop--sale"><span class="pop__tag">SALE!</span><span class="pop__price">${money(p.price)}</span><span class="pop__was">${money(p.was)}</span></span>`
    : `<span class="pop"><span class="pop__tag">${p.badge === "NEW" ? "NEW IN!" : i === 0 ? "BEST SELLER" : "OUR PICK"}</span><span class="pop__price">${money(p.price)}</span></span>`;
  $("#stores").innerHTML = B.map((b) => {
    const items = b.items.map(byId).filter(Boolean);
    const flag = (side) => `<div class="nobori nobori--${side}" aria-hidden="true"><span class="nobori__cloth kanji">${b.jp}<small>SINCE ${b.since}</small></span></div>`;
    return `
      <article class="store" id="store-${b.id}" style="--glow:${GLOW[b.id]}">
        ${flag("l")}
        <div class="shopfront">
          <div class="store__sign"><span class="lbx" style="--glow:${GLOW[b.id]}">${logo(b)}</span></div>
          <div class="awning" aria-hidden="true"></div>
          <div class="window">
            <div class="shelves" style="--cols:${items.length <= 5 ? items.length : Math.ceil(items.length / 2)};--cw:${items.length <= 2 ? "300px" : "190px"}">
              ${items.map((p, i) => `
                <div class="item">
                  ${pop(p, i)}
                  <div class="item__img"><span class="ph" data-img="${p.img}"></span></div>
                  <p class="item__name">${p.name}</p>
                  <button class="item__add" data-id="${p.id}">ADD TO BAG</button>
                </div>`).join("")}
            </div>
          </div>
          <div class="plate">
            <span class="plate__floor">${FLOOR[b.id]}</span>
            <h2 class="plate__name">${b.name}</h2>
            <p class="plate__jp kanji" aria-hidden="true">${b.jp}</p>
            <p class="plate__blurb">${b.blurb}</p>
            <dl>
              <div><dt>SINCE</dt><dd>${b.since}</dd></div>
              <div><dt>FROM</dt><dd>${b.hq.toUpperCase()}</dd></div>
              <div><dt>KNOWN FOR</dt><dd>${b.known.toUpperCase()}</dd></div>
              <div><dt>IN STOCK</dt><dd>${items.length} ITEMS</dd></div>
            </dl>
            <a class="enter" href="shop.html?brand=${b.id}">ENTER THE STORE →</a>
          </div>
        </div>
        ${flag("r")}
      </article>`;
  }).join("");
  watch($("#stores"));

  /* ---------- interactions ---------- */
  const goTo = (id) => {
    const s = $(`#store-${id}`);
    s.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    s.classList.remove("is-flash"); void s.offsetWidth; s.classList.add("is-flash");
  };
  document.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (go) return goTo(go.dataset.go);
    const add = e.target.closest(".item__add");
    if (add) {
      NodexBag.fly($(".item__img .ph", add.closest(".item")), add.dataset.id);
      add.classList.add("is-added"); add.textContent = "ADDED ✓";
      setTimeout(() => { add.classList.remove("is-added"); add.textContent = "ADD TO BAG"; }, 1400);
    }
  });
  $("#toGuide").addEventListener("click", () => $("#guideSec").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }));

  /* =========================================================
     MOTION
     ========================================================= */
  if (!animated) return;

  // cover: letters drop in like stickers, the snap zooms out of the lens, billboards slide in from the sides
  G.timeline({ delay: .1 })
    .from(".xs-issue span", { y: -20, opacity: 0, stagger: .06, duration: .4, ease: "power2.out", clearProps: "transform,opacity" })
    .from("#coverWord > span", { yPercent: -80, rotate: (i) => (i % 2 ? 14 : -14), opacity: 0, stagger: .06, duration: .6, ease: "back.out(2.2)", clearProps: "transform,opacity" }, "<.1")
    .from(".xs-cover__hand", { scale: 0, duration: .5, ease: "back.out(2.5)", clearProps: "transform" }, "-=.2")
    .from(".lens .ph", { scale: 1.25, duration: 1.1, ease: "power3.out", clearProps: "transform" }, "<")
    .from(".lens", { y: 50, opacity: 0, duration: .8, ease: "power3.out", clearProps: "transform,opacity" }, "<")
    .from(".bills--l .bill", { x: -60, opacity: 0, stagger: .07, duration: .6, ease: "power3.out", clearProps: "transform,opacity" }, "<.2")
    .from(".bills--r .bill", { x: 60, opacity: 0, stagger: .07, duration: .6, ease: "power3.out", clearProps: "transform,opacity" }, "<")
    .from(".clip, .deco, .xs-cover__stamp", { scale: 0, stagger: .06, duration: .45, ease: "back.out(3)", clearProps: "transform" }, "-=.3")
    .from(".xs-cover__foot > *", { y: 24, opacity: 0, stagger: .08, duration: .5, ease: "power3.out", clearProps: "transform,opacity" }, "-=.4")
    .add(() => $$(".bill .lbx").forEach((l, i) => setTimeout(() => l.classList.add("is-flicker"), i * 110)));

  if (fine) {
    $("#xsCover").addEventListener("mousemove", (e) => {
      const mx = e.clientX / innerWidth - .5, my = e.clientY / innerHeight - .5;
      G.to("#coverPhoto", { x: mx * 12, y: my * 8, rotate: mx * 2, duration: 1.2, overwrite: "auto" });
      G.to("#billsL", { x: mx * -18, duration: 1.2, overwrite: "auto" });
      G.to("#billsR", { x: mx * -18, duration: 1.2, overwrite: "auto" });
    });
  }
  // the crossing slides past as you scroll
  if (window.ScrollTrigger) {
    G.registerPlugin(ScrollTrigger);
    G.fromTo(".zebra", { "--shift": "0px" }, { "--shift": "-260px", ease: "none",
      scrollTrigger: { trigger: ".zebra", start: "top bottom", end: "bottom top", scrub: true } });
  }

  const reveal = (els, from, opts = {}) => {
    G.set(els, from);
    const io = new IntersectionObserver((ents) => {
      const vis = ents.filter((e) => e.isIntersecting).map((e) => e.target);
      vis.forEach((el) => io.unobserve(el));
      if (vis.length) G.to(vis, { opacity: 1, x: 0, y: 0, scale: 1, stagger: .06, duration: .6, ease: "power3.out", clearProps: "transform,opacity", ...opts });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => io.observe(el));
  };
  reveal([$(".guide")], { opacity: 0, y: 50 });
  reveal($$(".floor"), { opacity: 0, x: -30 });
  reveal($$(".item"), { opacity: 0, y: 30 }, { ease: "back.out(1.6)" });
  reveal($$(".plate"), { opacity: 0, y: 30 });
  // each store's sign flickers on when you walk past it
  const signIO = new IntersectionObserver((ents) => ents.forEach((e) => {
    if (!e.isIntersecting) return;
    signIO.unobserve(e.target);
    $(".store__sign .lbx", e.target).classList.add("is-flicker");
  }), { rootMargin: "0px 0px -25% 0px" });
  $$(".store").forEach((s) => signIO.observe(s));

  if (window.ScrollTrigger) {
    G.registerPlugin(ScrollTrigger);
    G.from(".back__big", { yPercent: 60, scaleY: .4, transformOrigin: "50% 100%", ease: "none",
      scrollTrigger: { trigger: ".back", start: "top bottom", end: "bottom bottom", scrub: true } });
  }
})();
