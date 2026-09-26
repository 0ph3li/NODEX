/* =========================================================
   NODEX — SEARCH
   Instant search over js/products.js: names, brands,
   departments, blurbs and specs, with synonyms, price words
   ("under €50") and "did you mean" suggestions.
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
  const BRANDS = window.NODEX_BRANDS || [];
  const catName = (id) => (CATS.find((c) => c.id === id) || {}).name || id;
  const brandOf = (p) => BRANDS.find((b) => b.id === p.brand);
  const money = (n) => "€" + (Math.round(n * 100) / 100).toFixed(Math.round(n * 100) % 100 ? 2 : 0);
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const CAT_C = { audio: "#ff8ad0", mobile: "#7fe7ff", gaming: "#d6ff3a", computers: "#ffd36b", cameras: "#c7a6ff", accessories: "#ffb38a" };

  /* ---------- words people type → words we use ---------- */
  const SYN = {
    discman: "cd", cdplayer: "cd", phone: "mobile", phones: "mobile", cellphone: "mobile", cell: "mobile", flip: "flip", console: "gaming", consoles: "gaming",
    game: "gaming", games: "gaming", handheld: "gaming", camera: "cameras", cam: "cameras", camcorder: "cameras", video: "cameras", laptop: "computers",
    notebook: "computers", pc: "computers", computer: "computers", headphone: "headphones", earbuds: "buds", earphones: "buds", charm: "charm", charms: "charm",
    keychain: "keychain", mp3: "mp3", music: "audio", speaker: "audio", boombox: "boombox", cheap: "__cheap",
  };
  const DEAL_WORDS = new Set(["sale", "deal", "deals", "discount", "offer", "offers"]);

  const hay = P.map((p, i) => {
    const b = brandOf(p);
    return {
      p, i,
      name: p.name.toLowerCase(),
      brand: b ? `${b.name} ${b.id}`.toLowerCase() : "",
      cat: `${p.cat} ${catName(p.cat)}`.toLowerCase(),
      blurb: (p.blurb || "").toLowerCase(),
      spec: [(p.specs || []).map(([k, v]) => `${k} ${v}`).join(" "), p.badge || "", p.year].join(" ").toLowerCase(),
    };
  });
  const vocab = [...new Set(hay.flatMap((h) => `${h.name} ${h.brand} ${h.cat}`.split(/[^a-z0-9]+/)).filter((w) => w.length > 2))];

  /* ---------- parse + score ---------- */
  const parse = (raw) => {
    let q = raw.toLowerCase().replace(/[€$]/g, " ").trim();
    let max = Infinity, min = 0, deal = false;
    q = q.replace(/\b(?:under|below|less than|max)\s*(\d+)/g, (_, n) => { max = +n; return " "; });
    q = q.replace(/\b(?:over|above|more than|min)\s*(\d+)/g, (_, n) => { min = +n; return " "; });
    const tokens = q.split(/[^a-z0-9]+/).filter(Boolean).filter((t) => {
      if (DEAL_WORDS.has(t)) { deal = true; return false; }
      if (t === "cheap") { max = Math.min(max, 50); return false; }
      return !["the", "a", "an", "and", "for", "with", "in", "of"].includes(t);
    });
    return { tokens, max, min, deal };
  };
  const alts = (t) => [...new Set([t, SYN[t], t.replace(/s$/, "")].filter(Boolean))];
  const FIELDS = [["name", 6], ["brand", 4], ["cat", 3], ["blurb", 2], ["spec", 1]];
  const match = (h, tokens) => {
    let score = 0; const why = new Set();
    for (const t of tokens) {
      let best = 0;
      for (const a of alts(t)) for (const [f, w] of FIELDS) {
        const at = h[f].indexOf(a);
        if (at < 0) continue;
        const s = w + (at === 0 || /[^a-z0-9]/.test(h[f][at - 1]) ? 1 : 0);
        if (s > best) best = s;
        why.add(f);
      }
      if (!best) return null;
      score += best;
    }
    return { score, why };
  };

  /* ---------- state + URL ---------- */
  const url = new URL(location.href);
  const state = { q: url.searchParams.get("q") || "", cat: "all", sort: "best" };
  $("#q").value = state.q;
  $("#pillCount").textContent = `${P.length} ITEMS`;

  const compute = () => {
    const { tokens, max, min, deal } = parse(state.q);
    let list = hay.map((h) => {
      if (h.p.price > max || h.p.price < min || (deal && !h.p.was)) return null;
      if (!tokens.length) return { h, score: 0, why: new Set() };
      const m = match(h, tokens);
      return m && { h, ...m };
    }).filter(Boolean);
    const byCat = {};
    list.forEach((r) => (byCat[r.h.p.cat] = (byCat[r.h.p.cat] || 0) + 1));
    if (state.cat !== "all") list = list.filter((r) => r.h.p.cat === state.cat);
    const sorters = {
      best: (a, b) => b.score - a.score || a.h.i - b.h.i,
      low: (a, b) => a.h.p.price - b.h.p.price,
      high: (a, b) => b.h.p.price - a.h.p.price,
      new: (a, b) => b.h.p.year - a.h.p.year,
    };
    list.sort(sorters[state.sort]);
    return { list, byCat, tokens, max, min, deal };
  };

  /* ---------- highlighting ---------- */
  const markUp = (text, tokens) => {
    let out = esc(text);
    const words = [...new Set(tokens.flatMap(alts))].filter((w) => w.length > 1).sort((a, b) => b.length - a.length);
    if (!words.length) return out;
    const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
    return out.replace(re, "<mark>$1</mark>");
  };

  /* ---------- "did you mean" ---------- */
  const lev = (a, b) => {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      // swapped letters ("pnik" → "pink") count as one typo
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[a.length][b.length];
  };
  const suggest = (tokens) => {
    const out = new Set();
    tokens.forEach((t) => vocab.map((w) => [w, lev(t, w)]).filter(([, d]) => d > 0 && d <= (t.length > 5 ? 2 : 1)).sort((a, b) => a[1] - b[1]).slice(0, 3).forEach(([w]) => out.add(w)));
    return [...out];
  };

  /* =========================================================
     RENDER
     ========================================================= */
  const POPULAR = ["flip phone", "pink", "Discman", "PSP", "under €50", "sale", "Sony", "charms"];
  const chip = (label, attr = "data-q") => `<button class="chip" type="button" ${attr}="${esc(label)}">${esc(label)}</button>`;
  $("#popular").innerHTML = POPULAR.map((q) => chip(q)).join("");

  const RKEY = "nodex-recent";
  const recentGet = () => { try { return JSON.parse(localStorage.getItem(RKEY)) || []; } catch { return []; } };
  const recentAdd = (q) => {
    q = q.trim(); if (q.length < 2) return;
    const list = [q, ...recentGet().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 6);
    try { localStorage.setItem(RKEY, JSON.stringify(list)); } catch {}
    paintRecent();
  };
  const paintRecent = () => {
    const r = recentGet();
    $("#recentWrap").hidden = !r.length;
    $("#recent").innerHTML = r.map((q) => chip(q)).join("");
  };
  paintRecent();

  let firstRender = true;
  const render = () => {
    const { list, byCat, tokens, max, min, deal } = compute();
    const q = state.q.trim();
    const total = Object.values(byCat).reduce((a, b) => a + b, 0);

    // count line
    const filters = [deal && "on sale", max < Infinity && `under ${money(max)}`, min > 0 && `over ${money(min)}`, state.cat !== "all" && `in ${catName(state.cat)}`].filter(Boolean).join(" · ");
    $("#resCount").innerHTML = q
      ? `${list.length} ${list.length === 1 ? "result" : "results"} for <span class="hl">“${esc(q)}”</span>${filters ? `<small>${esc(filters.toUpperCase())}</small>` : ""}`
      : `Everything we stock<small>${list.length} ITEMS${state.cat !== "all" ? " · " + catName(state.cat).toUpperCase() : ""} · START TYPING TO NARROW IT DOWN</small>`;

    // departments
    $("#cats").innerHTML = `<button class="chip${state.cat === "all" ? " is-on" : ""}" data-cat="all" role="tab">All<sup>${total}</sup></button>` +
      CATS.filter((c) => byCat[c.id] || state.cat === c.id).map((c) => `<button class="chip${state.cat === c.id ? " is-on" : ""}" data-cat="${c.id}" role="tab">${c.name}<sup>${byCat[c.id] || 0}</sup></button>`).join("");

    // shortcuts to a brand store or a department
    const sc = [];
    if (tokens.length) {
      BRANDS.filter((b) => tokens.some((t) => b.name.toLowerCase().includes(t) || b.id.includes(t))).slice(0, 2)
        .forEach((b) => sc.push(`<a class="shortcut" href="brands.html#store-${b.id}"><span class="shortcut__k">BRAND</span>${esc(b.name)} store →</a>`));
      CATS.filter((c) => tokens.some((t) => alts(t).some((a) => c.id.startsWith(a) || c.name.toLowerCase().startsWith(a)))).slice(0, 2)
        .forEach((c) => sc.push(`<a class="shortcut" href="shop.html?cat=${c.id}"><span class="shortcut__k">DEPARTMENT</span>All ${esc(c.name)} →</a>`));
    }
    $("#shortcuts").innerHTML = sc.join("");

    // cards
    const WHY = { name: "NAME", brand: "BRAND", cat: "DEPARTMENT", blurb: "DESCRIPTION", spec: "SPECS" };
    $("#cards").innerHTML = list.map(({ h, why }) => {
      const p = h.p, b = brandOf(p);
      return `
      <li class="card" style="--c:${CAT_C[p.cat] || "var(--hi)"}">
        <span class="card__tab">${catName(p.cat).toUpperCase()}</span>
        <p class="card__head"><span>${b ? markUp(b.name.toUpperCase(), tokens) : "NODEX"} · ${p.year}</span><span class="card__no">No.${String(h.i + 1).padStart(2, "0")}</span></p>
        <span class="card__img"><img src="${p.img}" alt="" loading="lazy" /></span>
        <div class="card__body">
          <h3 class="card__name">${markUp(p.name, tokens)}</h3>
          <p class="card__blurb">${markUp(p.blurb || "", tokens)}</p>
          ${why.size ? `<p class="card__why">✎ FOUND IN ${[...why].map((w) => WHY[w]).join(" · ")}</p>` : ""}
          <div class="card__foot">
            <p class="card__price"><b>${money(p.price)}</b>${p.was ? `<s>${money(p.was)}</s>` : ""}</p>
            <div class="card__btns"><a href="shop.html?item=${p.id}">VIEW</a><button type="button" data-add="${p.id}">ADD +</button></div>
          </div>
        </div>
      </li>`;
    }).join("");

    // nothing found
    const none = !list.length;
    $("#none").hidden = !none;
    if (none) {
      const s = suggest(tokens);
      $("#noneTxt").textContent = s.length ? "Did you mean:" : "Nothing matches that. Try a shorter word or one of these:";
      $("#didYou").innerHTML = (s.length ? s : POPULAR.slice(0, 5)).map((w) => chip(w)).join("");
    }

    if (animated && !firstRender) {
      G.fromTo($$(".card").slice(0, 12), { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: .03, duration: .4, ease: "power2.out", clearProps: "transform,opacity" });
    }
    firstRender = false;

    // keep the URL shareable
    const u = new URL(location.href);
    q ? u.searchParams.set("q", q) : u.searchParams.delete("q");
    history.replaceState(null, "", u);
  };

  /* =========================================================
     EVENTS
     ========================================================= */
  let t = null, recentT = null;
  $("#q").addEventListener("input", (e) => {
    clearTimeout(t); clearTimeout(recentT);
    t = setTimeout(() => { state.q = e.target.value; state.cat = "all"; render(); }, 140);
    recentT = setTimeout(() => recentAdd(e.target.value), 1600);
  });
  $("#sbox").addEventListener("submit", (e) => {
    e.preventDefault();
    state.q = $("#q").value; state.cat = "all"; render(); recentAdd(state.q);
    $("#results").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  });
  document.addEventListener("click", (e) => {
    const c = e.target.closest("[data-q]");
    if (c) {
      $("#q").value = state.q = c.dataset.q; state.cat = "all"; render(); recentAdd(state.q);
      $("#results").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      return;
    }
    const cat = e.target.closest("[data-cat]");
    if (cat) { state.cat = cat.dataset.cat; render(); return; }
    const add = e.target.closest("[data-add]");
    if (add && !add.classList.contains("is-added")) {
      add.classList.add("is-added"); add.textContent = "ADDED ✓";
      NodexBag.fly($("img", add.closest(".card")), add.dataset.add);
      setTimeout(() => { add.classList.remove("is-added"); add.textContent = "ADD +"; }, 1600);
    }
  });
  $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
  $("#recentClear").addEventListener("click", () => { try { localStorage.removeItem(RKEY); } catch {} paintRecent(); });
  $("#lucky").addEventListener("click", () => { location.href = "shop.html?item=" + P[Math.floor(Math.random() * P.length)].id; });
  addEventListener("keydown", (e) => {
    if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); $("#q").focus(); }
  });

  /* ---------- lazy image slot (the lens photo) ---------- */
  const EXT = [".webp", ".jpg", ".png", ".jpeg"];
  $$(".ph[data-img]").forEach((ph) => {
    const src = ph.dataset.img;
    const tries = /\.\w{3,4}$/.test(src) ? [src] : EXT.map((x) => src + x);
    const next = (k) => {
      if (k >= tries.length) return;
      const img = new Image(); img.alt = ""; img.src = tries[k];
      (img.decode ? img.decode() : new Promise((r, x) => { img.onload = r; img.onerror = x; }))
        .then(() => { ph.appendChild(img); ph.classList.add("is-loaded"); }).catch(() => next(k + 1));
    };
    next(0);
  });

  render();
  if (state.q) setTimeout(() => $("#results").scrollIntoView({ behavior: "auto" }), 50);

  /* =========================================================
     MOTION
     ========================================================= */
  if (!animated) return;
  G.timeline({ delay: .1 })
    .from(".sr-issue span", { y: -20, opacity: 0, stagger: .06, duration: .4, ease: "power2.out", clearProps: "transform,opacity" })
    .from(".sr-cover__kick", { opacity: 0, x: -20, duration: .5, clearProps: "transform,opacity" }, "<.1")
    .from(".sr-cover__title", { yPercent: 50, opacity: 0, duration: .7, ease: "power4.out", clearProps: "transform,opacity" }, "<.1")
    .fromTo(".hl-word", { "--hx": 0 }, { "--hx": 1, duration: .6, ease: "power2.inOut" }, "-=.2")
    .from(".sbox, .sr-cover__chips, .sr-lucky", { y: 24, opacity: 0, stagger: .08, duration: .5, ease: "power3.out", clearProps: "transform,opacity" }, "-=.3")
    .from(".lens", { x: 120, rotate: 30, opacity: 0, duration: 1, ease: "power3.out", clearProps: "transform,opacity" }, "<")
    .from(".scribble", { scale: 0, stagger: .12, duration: .5, ease: "back.out(2.5)", clearProps: "transform" }, "-=.4");

  if (fine) {
    $("#srCover").addEventListener("mousemove", (e) => {
      const mx = e.clientX / innerWidth - .5, my = e.clientY / innerHeight - .5;
      G.to(".lens", { x: mx * 30, y: my * 20, duration: 1, overwrite: "auto" });
    });
  }
  if (window.ScrollTrigger) {
    G.registerPlugin(ScrollTrigger);
    G.from(".back__big", { yPercent: 60, scaleY: .4, transformOrigin: "50% 100%", ease: "none",
      scrollTrigger: { trigger: ".back", start: "top bottom", end: "bottom bottom", scrub: true } });
  }
})();
