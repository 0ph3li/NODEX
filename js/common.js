/* =========================================================
   NODEX — shared bits for every page (ticker, menu, bag)
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);

  /* ---------- ticker: duplicate for a seamless loop ---------- */
  const tt = $(".ticker__track");
  if (tt) tt.innerHTML += tt.innerHTML;

  /* ---------- mobile menu ---------- */
  const burger = $("#burger");
  if (burger) burger.addEventListener("click", () => {
    const open = $("#menu").classList.toggle("is-open");
    burger.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  });

  /* ---------- bag (kept in this browser, shared by all pages) ---------- */
  const KEY = "nodex-bag";
  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
  };
  const write = (bag) => {
    try { localStorage.setItem(KEY, JSON.stringify(bag)); } catch {}
  };
  const count = () => Object.values(read()).reduce((a, b) => a + b, 0);
  const paint = (bump) => {
    const n = count();
    document.querySelectorAll("[data-bag-count]").forEach((el) => (el.textContent = n));
    const link = $("#bagLink");
    if (bump && link) { link.classList.remove("bump"); void link.offsetWidth; link.classList.add("bump"); }
    document.dispatchEvent(new CustomEvent("nodex:bag"));
  };
  window.NodexBag = {
    count,
    items: read,
    add(id, qty = 1) {
      const bag = read();
      bag[id] = (bag[id] || 0) + qty;
      write(bag);
      paint(true);
      if (document.querySelector(".bagd") && !document.querySelector(".bagd").hidden) renderBag();
    },
    /* set an exact quantity (0 removes the line) */
    set(key, qty) {
      const bag = read();
      if (qty > 0) bag[key] = qty; else delete bag[key];
      write(bag);
      paint(false);
    },
  };
  /* flying product → bag icon, then count it */
  window.NodexBag.fly = (src, id) => {
    const link = $("#bagLink");
    const done = () => window.NodexBag.add(id);
    if (!window.gsap || !link || !src) return done();
    const from = src.getBoundingClientRect();
    const to = link.getBoundingClientRect();
    const fly = src.cloneNode(true);
    fly.removeAttribute("id");
    Object.assign(fly.style, { position: "fixed", left: from.left + "px", top: from.top + "px", width: from.width + "px", height: from.height + "px",
      margin: 0, zIndex: 300, pointerEvents: "none", opacity: 1, transform: "none" });
    document.body.appendChild(fly);
    gsap.to(fly, { left: to.left + to.width / 2 - 20, width: 40, height: 40, duration: .85, ease: "power3.in" });
    gsap.to(fly, { top: to.top - 6, rotation: 540, duration: .85, ease: "back.in(1.2)", onComplete: () => { fly.remove(); done(); } });
  };
  /* =========================================================
     BAG DRAWER — slides in from the right on every page
     keys are "product-id" or "product-id·Colour"
     ========================================================= */
  const FREE = 49;
  const money = (n) => "€" + (Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0);
  const drawer = document.createElement("aside");
  drawer.className = "bagd";
  drawer.setAttribute("aria-label", "Your bag");
  drawer.hidden = true;
  drawer.innerHTML = `
    <div class="bagd__back" data-close></div>
    <div class="bagd__panel" role="dialog" aria-modal="true" aria-labelledby="bagdTitle">
      <header class="bagd__head">
        <h2 id="bagdTitle">YOUR BAG <span data-bag-count>0</span></h2>
        <button class="bagd__x" data-close aria-label="Close bag">✕</button>
      </header>
      <div class="bagd__ship"><p id="bagdShip"></p><div class="bagd__bar"><i id="bagdBar"></i></div></div>
      <ul class="bagd__list" id="bagdList"></ul>
      <div class="bagd__empty" id="bagdEmpty">
        <p class="bagd__big">NO SIGNAL</p>
        <p>Your bag is empty. Go find something shiny.</p>
      </div>
      <footer class="bagd__foot">
        <p class="bagd__sub"><span>SUBTOTAL</span><b id="bagdSub">€0</b></p>
        <p class="bagd__note">Shipping and taxes calculated at checkout · Pay in 3 available</p>
        <a class="bagd__cta" id="bagdCheckout" href="bag.html">VIEW BAG &amp; CHECKOUT →</a>
      </footer>
    </div>`;
  document.body.appendChild(drawer);
  const products = () => window.NODEX_PRODUCTS || [];
  const renderBag = () => {
    const bag = read();
    const rows = Object.entries(bag).filter(([, q]) => q > 0).map(([key, qty]) => {
      const [id, colour] = key.split("·");
      const p = products().find((x) => x.id === id);
      return p ? { key, qty, p, colour } : null;
    }).filter(Boolean);
    const sub = rows.reduce((s, r) => s + r.p.price * r.qty, 0);
    $("#bagdList").innerHTML = rows.map((r) => `
      <li class="bagd__item" data-key="${r.key}">
        <span class="bagd__img" style="--bg:${r.p.bg}"><img src="${r.p.img}" alt="" loading="lazy" /></span>
        <span class="bagd__info"><b>${r.p.name}</b><small>${r.colour ? r.colour.toUpperCase() + " · " : ""}${money(r.p.price)}</small>
          <span class="bagd__qty"><button data-d="-1" aria-label="Less">−</button><output>${r.qty}</output><button data-d="1" aria-label="More">+</button></span>
        </span>
        <span class="bagd__right"><b>${money(r.p.price * r.qty)}</b><button class="bagd__rm" aria-label="Remove">REMOVE</button></span>
      </li>`).join("");
    $("#bagdEmpty").hidden = rows.length > 0;
    drawer.querySelector(".bagd__foot").hidden = !rows.length;
    $("#bagdSub").textContent = money(sub);
    const left = FREE - sub;
    $("#bagdShip").innerHTML = left > 0 ? `You’re <b>${money(left)}</b> away from free shipping` : "✦ You’ve unlocked <b>free shipping</b>";
    $("#bagdBar").style.width = Math.min(100, (sub / FREE) * 100) + "%";
  };
  const setQty = (key, d) => {
    const bag = read();
    bag[key] = Math.max(0, (bag[key] || 0) + d);
    if (!bag[key]) delete bag[key];
    write(bag); paint(false); renderBag();
  };
  let lastFocus = null;
  const openBag = () => {
    lastFocus = document.activeElement;
    renderBag();
    drawer.hidden = false;
    document.body.classList.add("bag-open");
    requestAnimationFrame(() => drawer.classList.add("is-open"));
    drawer.querySelector(".bagd__x").focus();
  };
  const closeBag = () => {
    drawer.classList.remove("is-open");
    document.body.classList.remove("bag-open");
    setTimeout(() => { drawer.hidden = true; lastFocus && lastFocus.focus && lastFocus.focus(); }, 450);
  };
  window.NodexBag.open = openBag;
  const link = $("#bagLink");
  // on bag.html the bag counter is not a link (never link to the current page), so no drawer there
  if (link && link.tagName === "A") link.addEventListener("click", (e) => { e.preventDefault(); openBag(); });
  drawer.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) return closeBag();
    const item = e.target.closest(".bagd__item");
    if (item && e.target.closest(".bagd__qty button")) setQty(item.dataset.key, +e.target.closest("button").dataset.d);
    if (item && e.target.closest(".bagd__rm")) setQty(item.dataset.key, -Infinity);
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !drawer.hidden) closeBag(); });

  paint(false);
  addEventListener("storage", (e) => { if (e.key === KEY) { paint(false); if (!drawer.hidden) renderBag(); } });
})();
