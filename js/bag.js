/* =========================================================
   NODEX — BAG (gift wrap + receipt)
   Reads the shared bag (localStorage "nodex-bag", keys "id" or
   "id·Colour") through window.NodexBag and re-renders whenever
   it changes — here or in another tab.
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const G = window.gsap;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animated = !!G && !reduce;

  const ALL = window.NODEX_PRODUCTS;
  const CAT = Object.fromEntries(window.NODEX_CATEGORIES.map((c) => [c.id, c.name]));
  const FREE = 49, SHIP = 4.9;
  const money = (n) => "€" + (Math.round(n * 100) / 100).toFixed(Math.round(n * 100) % 100 ? 2 : 0);

  /* ---------- discount codes (same ones as the Deals coupons) ---------- */
  const CODES = {
    NODEX10: { label: "NODEX10 −10%", off: (rows, sub) => sub * .1 },
    RETRO15: { label: "RETRO15 −15% CONSOLES", off: (rows) => rows.filter((r) => r.p.cat === "gaming" && r.p.price > 150).reduce((s, r) => s + r.p.price * r.qty * .15, 0),
      need: "RETRO15 works on consoles over €150" },
    FREESHIP: { label: "FREESHIP", ship: true },
  };
  const CKEY = "nodex-coupon";
  const getCode = () => { try { return localStorage.getItem(CKEY) || ""; } catch { return ""; } };
  const setCode = (c) => { try { c ? localStorage.setItem(CKEY, c) : localStorage.removeItem(CKEY); } catch {} };

  /* ---------- state ---------- */
  const rowsNow = () => Object.entries(NodexBag.items()).filter(([, q]) => q > 0).map(([key, qty]) => {
    const [id, colour] = key.split("·");
    const p = ALL.find((x) => x.id === id);
    return p ? { key, qty, p, colour } : null;
  }).filter(Boolean);
  const totals = (rows) => {
    const sub = rows.reduce((s, r) => s + r.p.price * r.qty, 0);
    const code = CODES[getCode()];
    const off = code && code.off ? Math.min(sub, code.off(rows, sub)) : 0;
    const after = sub - off;
    const ship = !rows.length || after >= FREE || (code && code.ship) ? 0 : SHIP;
    return { sub, off, ship, total: after + ship, count: rows.reduce((s, r) => s + r.qty, 0), code };
  };

  /* ---------- receipt header (date + a number kept for this visit) ---------- */
  const d = new Date();
  $("#rcDate").textContent = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  let no = "";
  try { no = sessionStorage.getItem("nodex-rc") || ""; } catch {}
  if (!no) { no = String(1000 + Math.floor(Math.random() * 9000)); try { sessionStorage.setItem("nodex-rc", no); } catch {} }
  $("#rcNo").textContent = "No. " + no;

  /* =========================================================
     RENDER
     ========================================================= */
  const lineHTML = (r) => {
    const saved = r.p.was ? (r.p.was - r.p.price) * r.qty : 0;
    const kind = r.p.lucky ? "LUCKY BAG" : r.p.bundle ? "SET DEAL" : (CAT[r.p.cat] || "").toUpperCase();
    return `
    <li class="line" data-key="${r.key}">
      <span class="line__img" style="--bg:${r.p.bg || "var(--blush-2)"}"><img src="${r.p.img}" alt="" loading="lazy" /></span>
      <div class="line__info">
        <p class="line__cat">${kind}</p>
        <h3 class="line__name">${r.p.name}</h3>
        <p class="line__opts">${r.colour ? `<span>COLOUR · ${r.colour.toUpperCase()}</span>` : ""}<span>${money(r.p.price)} EACH</span>${r.p.badge ? `<span>${r.p.badge}</span>` : ""}</p>
        <div class="line__bottom">
          <span class="qty"><button data-d="-1" aria-label="One less">−</button><output>${r.qty}</output><button data-d="1" aria-label="One more">+</button></span>
          <button class="line__rm">REMOVE</button>
        </div>
      </div>
      <p class="line__price"><b>${money(r.p.price * r.qty)}</b>${r.p.was ? `<s>${money(r.p.was * r.qty)}</s><small>YOU SAVE ${money(saved)}</small>` : ""}</p>
    </li>`;
  };

  let firstPaint = true;
  const render = () => {
    const rows = rowsNow();
    const t = totals(rows);

    // lines: rebuild, but keep the ones already on screen so only new ones animate
    const list = $("#lines");
    const had = new Set($$(".line", list).map((l) => l.dataset.key));
    list.innerHTML = rows.map(lineHTML).join("");
    if (animated && !firstPaint) $$(".line", list).filter((l) => !had.has(l.dataset.key)).forEach((l) => G.from(l, { y: 30, opacity: 0, duration: .5, ease: "back.out(1.6)", clearProps: "transform,opacity" }));
    $("#empty").hidden = rows.length > 0;
    list.hidden = !rows.length;

    // receipt
    $("#rcLines").innerHTML = rows.length ? rows.map((r) => `<li><span>${r.qty}× ${r.p.name.toUpperCase()}</span><span>${money(r.p.price * r.qty)}</span>${r.colour ? `<small>  ${r.colour.toUpperCase()}</small>` : ""}</li>`).join("")
      : `<li><span>— NO ITEMS —</span><span></span></li>`;
    $("#rcSub").textContent = money(t.sub);
    $("#rcOffRow").hidden = !t.off;
    if (t.code) $("#rcOffLbl").textContent = t.code.label;
    $("#rcOff").textContent = "−" + money(t.off);
    $("#rcShip").textContent = t.ship ? money(t.ship) : rows.length ? "FREE" : "€0";
    $("#rcTotal").textContent = money(t.total);
    $("#rcPay3").textContent = t.total ? `or 3 payments of ${money(t.total / 3)}` : "";
    const left = FREE - (t.sub - t.off);
    $("#shipTxt").innerHTML = !rows.length ? `${money(FREE)} to free shipping` : t.ship ? `<b>${money(left)}</b> to free shipping` : "✦ FREE SHIPPING UNLOCKED ✦";
    $("#shipBar").style.width = (t.ship ? Math.min(100, ((t.sub - t.off) / FREE) * 100) : rows.length ? 100 : 0) + "%";
    $("#checkoutBtn").disabled = !rows.length;

    // cover
    $("#pillItems").textContent = `${t.count} ${t.count === 1 ? "ITEM" : "ITEMS"}`;
    $("#statItems").textContent = t.count;
    $("#statSub").textContent = money(t.sub);
    $("#statShip").textContent = !rows.length || t.ship ? money(Math.max(0, left)) : "FREE";
    $("#statShipLbl").textContent = !rows.length || t.ship ? "TO FREE SHIPPING" : "SHIPPING";
    $("#bagBadge").textContent = t.count;
    $("#coverLead").textContent = rows.length
      ? "Everything you picked, in one place. Check the details, add a code, and we’ll wrap it like a present."
      : "Nothing in here yet. Fill it up and we’ll wrap every order like a present: tissue, stickers and a handwritten note.";
    const peekIds = [...new Set(rows.map((r) => r.p.id))].slice(0, 3);
    const peek = $("#peek");
    const peekKey = peekIds.join(",");
    if (peek.dataset.k !== peekKey) {
      peek.dataset.k = peekKey;
      peek.innerHTML = `<i class="pbag__tissue"></i>` + peekIds.map((id) => `<span class="peek"><img src="${ALL.find((p) => p.id === id).img}" alt="" /></span>`).join("");
      if (animated && !firstPaint) G.from(".peek", { yPercent: 60, opacity: 0, stagger: .08, duration: .6, ease: "back.out(1.8)", clearProps: "transform,opacity" });
    }

    renderMore(rows);
    firstPaint = false;
  };

  /* ---------- goes well with: small extras not already in the bag ---------- */
  const renderMore = (rows) => {
    const inBag = new Set(rows.map((r) => r.p.id));
    const pick = ALL.filter((p) => !p.hidden && !inBag.has(p.id))
      .sort((a, b) => (a.cat === "accessories" ? -1 : 0) - (b.cat === "accessories" ? -1 : 0) || a.price - b.price).slice(0, 4);
    $("#moreRow").innerHTML = pick.map((p) => `
      <article class="mc">
        <span class="mc__img" style="--bg:${p.bg}"><img src="${p.img}" alt="" loading="lazy" /></span>
        <h3 class="mc__name">${p.name}</h3>
        <div class="mc__foot"><span class="mc__price">${money(p.price)}</span><button class="mc__add" data-id="${p.id}">ADD +</button></div>
      </article>`).join("");
  };

  /* =========================================================
     EVENTS
     ========================================================= */
  $("#lines").addEventListener("click", (e) => {
    const line = e.target.closest(".line");
    if (!line) return;
    const key = line.dataset.key;
    const qty = NodexBag.items()[key] || 0;
    const step = e.target.closest(".qty button");
    const rm = e.target.closest(".line__rm");
    if (!step && !rm) return;
    const next = rm ? 0 : qty + +step.dataset.d;
    if (next <= 0 && animated) {
      line.classList.add("is-leaving");
      G.to(line, { x: 60, opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, marginTop: -16, duration: .45, ease: "power2.in" });
      setTimeout(() => NodexBag.set(key, 0), 460);
    } else NodexBag.set(key, next);
  });
  $("#moreRow").addEventListener("click", (e) => {
    const b = e.target.closest(".mc__add");
    if (!b || b.classList.contains("is-added")) return;
    b.classList.add("is-added"); b.textContent = "ADDED ✓";
    NodexBag.fly($("img", b.closest(".mc")), b.dataset.id);
  });
  document.addEventListener("nodex:bag", render);

  const codeMsg = (html, ok) => { const m = $("#codeMsg"); m.innerHTML = html; m.className = "code__msg " + (ok ? "is-ok" : "is-bad"); };
  const showApplied = () => {
    const c = getCode();
    if (c) codeMsg(`<span class="code__applied">✓ ${c} applied <button type="button" id="codeRm">remove</button></span>`, true);
  };
  $("#codeForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const c = $("#codeInput").value.trim().toUpperCase();
    if (!c) return;
    const code = CODES[c];
    if (!code) return codeMsg("That code doesn’t exist (yet).", false);
    if (code.need && !code.off(rowsNow(), 0)) return codeMsg(code.need + ".", false);
    setCode(c); $("#codeInput").value = ""; showApplied(); render();
  });
  $("#codeMsg").addEventListener("click", (e) => {
    if (!e.target.closest("#codeRm")) return;
    setCode(""); codeMsg("", true); render();
  });
  $("#checkoutBtn").addEventListener("click", () => { $("#checkoutNote").hidden = false; });
  $("#toReceipt").addEventListener("click", () => $("#checkout").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }));

  render();
  showApplied();

  /* =========================================================
     MOTION
     ========================================================= */
  if (!animated) return;
  G.timeline({ delay: .1 })
    .from(".bg-issue span", { y: -20, opacity: 0, stagger: .06, duration: .4, ease: "power2.out", clearProps: "transform,opacity" })
    .from(".bg-cover__kick", { opacity: 0, x: -20, duration: .5, clearProps: "transform,opacity" }, "<.1")
    .from(".bg-cover__title span", { yPercent: 70, opacity: 0, stagger: .12, duration: .8, ease: "power4.out", clearProps: "transform,opacity" }, "<.1")
    .from(".bg-cover__lead, .bg-stats, .bg-cover__ctas", { y: 24, opacity: 0, stagger: .08, duration: .5, ease: "power3.out", clearProps: "transform,opacity" }, "-=.4")
    .from(".pbag", { y: -160, rotate: -8, opacity: 0, duration: .9, ease: "bounce.out", clearProps: "transform,opacity" }, "<")
    .from(".peek", { yPercent: 70, opacity: 0, stagger: .1, duration: .6, ease: "back.out(2)", clearProps: "transform,opacity" }, "-=.2")
    .from(".pbag__bow, .pbag__count", { scale: 0, stagger: .1, duration: .5, ease: "back.out(3)", clearProps: "transform" }, "-=.3");

  // the receipt prints out of the till when it comes into view
  G.set(".receipt", { clipPath: "inset(0 0 100% 0)" });
  new IntersectionObserver((ents, io) => ents.forEach((e) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    G.to(".receipt", { clipPath: "inset(0 0 0% 0)", duration: 1.4, ease: "steps(14)", clearProps: "clipPath" });
  }), { rootMargin: "0px 0px -15% 0px" }).observe($(".receipt"));

  const reveal = (els, from) => {
    G.set(els, from);
    const io = new IntersectionObserver((ents) => {
      const vis = ents.filter((e) => e.isIntersecting).map((e) => e.target);
      vis.forEach((el) => io.unobserve(el));
      if (vis.length) G.to(vis, { opacity: 1, y: 0, stagger: .08, duration: .6, ease: "power3.out", clearProps: "transform,opacity" });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => io.observe(el));
  };
  reveal($$(".bg-sec"), { opacity: 0, y: 30 });
  reveal($$(".line"), { opacity: 0, y: 40 });
  reveal($$(".perks li"), { opacity: 0, y: 20 });
  reveal([$("#moreRow")], { opacity: 0, y: 40 });

  if (window.ScrollTrigger) {
    G.registerPlugin(ScrollTrigger);
    G.from(".back__big", { yPercent: 60, scaleY: .4, transformOrigin: "50% 100%", ease: "none",
      scrollTrigger: { trigger: ".back", start: "top bottom", end: "bottom bottom", scrub: true } });
  }
})();
