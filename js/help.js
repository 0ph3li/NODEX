/* =========================================================
   NODEX — HELP pages (FAQ, Shipping, Returns, Privacy, Terms)
   Contents + scroll spy, FAQ search/filter/accordion,
   and the "clear my data" tool on the privacy page.
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const G = window.gsap;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const animated = !!G && !reduce;
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  $("#toManual").addEventListener("click", () => $("#manual").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }));

  /* ---------- contents + scroll spy ---------- */
  const toc = $("#toc");
  const chapters = $$(".chapter[id]");
  if (toc && chapters.length) {
    toc.innerHTML = chapters.map((c, i) => `<li><a href="#${c.id}"><span>${String(i + 1).padStart(2, "0")}</span>${c.dataset.toc}</a></li>`).join("");
    const links = $$("a", toc);
    const spy = new IntersectionObserver((ents) => ents.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((l) => l.classList.toggle("is-on", l.getAttribute("href") === "#" + e.target.id));
      const on = links.find((l) => l.classList.contains("is-on"));
      if (on && innerWidth < 1000) on.scrollIntoView({ block: "nearest", inline: "center" });
    }), { rootMargin: "-30% 0px -60% 0px" });
    chapters.forEach((c) => spy.observe(c));
  }

  /* ---------- accordion ---------- */
  const setOpen = (qa, open, instant) => {
    const a = $(".qa__a", qa);
    qa.classList.toggle("is-open", open);
    $(".qa__q", qa).setAttribute("aria-expanded", open);
    if (animated && !instant) G.to(a, { height: open ? "auto" : 0, duration: .45, ease: "power3.inOut" });
    else a.style.height = open ? "auto" : "0";
  };
  document.addEventListener("click", (e) => {
    const q = e.target.closest(".qa__q");
    if (q) setOpen(q.parentElement, !q.parentElement.classList.contains("is-open"));
  });

  /* ---------- FAQ: search + topics ---------- */
  const list = $("#faqList");
  if (list) {
    const groups = $$(".faq-group", list);
    const items = $$(".qa", list);
    items.forEach((qa) => {
      // wrap the question text so matches can be highlighted in it
      const qb = $(".qa__q", qa), txt = qb.firstChild, lbl = document.createElement("span");
      lbl.className = "qa__lbl"; lbl.textContent = txt.nodeValue; qb.replaceChild(lbl, txt);
      qa.dataset.q = lbl.textContent; qa.dataset.a = $(".qa__a", qa).innerHTML;
    });
    $("#faqTotal").textContent = items.length;
    let topic = "all";
    $("#faqChips").innerHTML = `<button class="is-on" data-g="all">All</button>` + groups.map((g) => `<button data-g="${g.dataset.group}">${$("h2", g).lastChild.textContent}</button>`).join("");
    const run = () => {
      const q = $("#faqQ").value.trim().toLowerCase();
      const words = q.split(/\s+/).filter((w) => w.length > 1);
      const re = words.length ? new RegExp(`(${words.map(esc).join("|")})`, "gi") : null;
      let shown = 0;
      items.forEach((qa) => {
        const inTopic = topic === "all" || qa.closest(".faq-group").dataset.group === topic;
        const text = (qa.dataset.q + " " + qa.dataset.a.replace(/<[^>]+>/g, " ")).toLowerCase();
        const hit = inTopic && words.every((w) => text.includes(w));
        qa.hidden = !hit;
        // highlight matches (in text only, never inside tags)
        const mark = (html) => re ? html.replace(/(<[^>]+>)|([^<]+)/g, (m, tag, txt) => tag || txt.replace(re, "<mark>$1</mark>")) : html;
        $(".qa__a", qa).innerHTML = mark(qa.dataset.a);
        $(".qa__lbl", qa).innerHTML = mark(qa.dataset.q);
        if (hit) shown++;
        if (hit && words.length && !qa.classList.contains("is-open")) setOpen(qa, true, true);
        if (!words.length && qa.classList.contains("is-open") && qa.dataset.auto) setOpen(qa, false, true);
        if (words.length) qa.dataset.auto = 1; else delete qa.dataset.auto;
      });
      groups.forEach((g) => (g.hidden = !$$(".qa:not([hidden])", g).length));
      $("#faqNone").hidden = shown > 0;
      $("#faqCount").textContent = words.length || topic !== "all" ? `${shown} FOUND` : `${items.length} QUESTIONS`;
    };
    $("#faqQ").addEventListener("input", run);
    $("#faqChips").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      topic = b.dataset.g;
      $$("#faqChips button").forEach((x) => x.classList.toggle("is-on", x === b));
      run();
    });
    run();
    // open a question from the URL: faq.html#q-where-s-my-order
    const target = location.hash && $(location.hash);
    if (target && target.classList.contains("qa")) { setOpen(target, true, true); setTimeout(() => target.scrollIntoView({ block: "center" }), 60); }
  }

  /* ---------- privacy: what this site keeps on your device ---------- */
  const tool = $("#dataTool");
  if (tool) {
    const KEYS = [
      ["local", "nodex-bag", "the products in your bag"],
      ["local", "nodex-coupon", "the discount code you applied"],
      ["local", "nodex-recent", "your recent searches"],
      ["local", "nodex-letter", "a draft of your message on the contact page"],
      ["local", "nodex-notify", "the drops you asked to be reminded of"],
      ["session", "nodex-rc", "your receipt number, until you close the tab"],
    ];
    const store = (t) => { try { return t === "local" ? localStorage : sessionStorage; } catch { return null; } };
    const paint = () => {
      $("#dataList").innerHTML = KEYS.map(([t, k, what]) => {
        const s = store(t); const has = s && s.getItem(k) !== null;
        return `<li><code>${k}</code>${what} — <b>${has ? "saved now" : "empty"}</b></li>`;
      }).join("");
    };
    paint();
    $("#dataClear").addEventListener("click", () => {
      KEYS.forEach(([t, k]) => { const s = store(t); if (s) s.removeItem(k); });
      document.dispatchEvent(new CustomEvent("nodex:bag"));
      document.querySelectorAll("[data-bag-count]").forEach((el) => (el.textContent = "0"));
      paint();
      $("#dataMsg").textContent = "✓ Done. Everything NODEX saved on this device has been deleted.";
    });
  }

  /* =========================================================
     MOTION
     ========================================================= */
  if (!animated) return;
  G.timeline({ delay: .1 })
    .from(".hp-issue span", { y: -20, opacity: 0, stagger: .06, duration: .4, ease: "power2.out", clearProps: "transform,opacity" })
    .from(".hp-cover__kick", { opacity: 0, x: -20, duration: .5, clearProps: "transform,opacity" }, "<.1")
    .from(".hp-cover__title", { yPercent: 40, opacity: 0, duration: .8, ease: "power4.out", clearProps: "transform,opacity" }, "<.1")
    .from(".hp-cover__lead, .hp-stats, .hp-cover__ctas", { y: 24, opacity: 0, stagger: .08, duration: .5, ease: "power3.out", clearProps: "transform,opacity" }, "-=.4")
    .from(".booklet", { y: 120, rotate: 16, opacity: 0, duration: .9, ease: "power3.out", clearProps: "transform,opacity" }, "<")
    .from(".callout", { opacity: 0, x: (i) => (i % 2 ? 20 : -20), stagger: .1, duration: .4, clearProps: "transform,opacity" }, "-=.3")
    .from(".hp-cover__sticker", { scale: 0, rotate: -90, duration: .6, ease: "back.out(2.2)", clearProps: "transform" }, "-=.2");

  if (fine) {
    $("#hpCover").addEventListener("mousemove", (e) => {
      const mx = e.clientX / innerWidth - .5, my = e.clientY / innerHeight - .5;
      G.to("#coverArt", { x: mx * 18, y: my * 12, rotate: mx * 3, duration: 1.2, overwrite: "auto" });
    });
  }
  const reveal = (els, from) => {
    G.set(els, from);
    const io = new IntersectionObserver((ents) => {
      const vis = ents.filter((e) => e.isIntersecting).map((e) => e.target);
      vis.forEach((el) => io.unobserve(el));
      if (vis.length) G.to(vis, { opacity: 1, y: 0, stagger: .08, duration: .6, ease: "power3.out", clearProps: "transform,opacity" });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => io.observe(el));
  };
  reveal($$(".chapter, .faq-group, .stuck"), { opacity: 0, y: 40 });

  if (window.ScrollTrigger) {
    G.registerPlugin(ScrollTrigger);
    G.from(".back__big", { yPercent: 60, scaleY: .4, transformOrigin: "50% 100%", ease: "none",
      scrollTrigger: { trigger: ".back", start: "top bottom", end: "bottom bottom", scrub: true } });
  }
})();
