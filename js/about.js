/* =========================================================
   NODEX — ABOUT (connecting you)
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const G = window.gsap;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const animated = !!G && !reduce;

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
        .then(() => { ph.appendChild(img); ph.classList.add("is-loaded"); })
        .catch(() => next(k + 1));
    };
    next(0);
  };
  const slotIO = new IntersectionObserver((ents) => ents.forEach((e) => {
    if (e.isIntersecting) { slotIO.unobserve(e.target); loadSlot(e.target); }
  }), { rootMargin: "500px 0px" });
  $$(".ph[data-img]").forEach((ph) => slotIO.observe(ph));

  $("#statItems").textContent = window.NODEX_PRODUCTS.filter((p) => !p.hidden).length;

  /* =========================================================
     THE STORY — edit the messages here
     ========================================================= */
  const MSGS = [
    { when: "2019", from: "THE ATTIC", time: "09:12", txt: "found a box of old tech ads + a Discman that still spins. keeping ALL of it" },
    { when: "2021", from: "ME", time: "23:47", txt: "scanned 400 magazine pages. the folder is called <b>NODEX</b> now, don’t ask" },
    { when: "2024", from: "THE BENCH", time: "16:30", txt: "first restore done: new battery, new foam. the flip phone snaps shut like day one ✦" },
    { when: "2025", from: "MARKET STALL", time: "13:05", txt: "sold 12 phones in 2 hours. people miss real buttons!!" },
    { when: "JAN 2026", from: "NODEX", time: "10:00", txt: "we’re a real shop now. tested, restored, packed like a gift. <b>connecting you</b>" },
    { when: "TODAY", from: "YOU?", time: "now", txt: "your first order could be the next message ♡" },
  ];
  $("#inbox").innerHTML = MSGS.map((m) => `
    <li class="msg">
      <span class="msg__icon" aria-hidden="true">✉</span>
      <div>
        <p class="msg__meta"><span>${m.when} · ${m.from}</span><span>${m.time}</span></p>
        <p class="msg__txt">${m.txt}</p>
      </div>
    </li>`).join("") + `<li class="typing" aria-hidden="true"><i></i><i></i><i></i></li>`;

  /* =========================================================
     HOW WE WORK + PROMISE
     ========================================================= */
  const STEPS = [
    { icon: "◎", title: "FOUND", tag: "SOURCED WITH CARE", txt: "We hunt the good stuff: collectors, shops closing down, auctions in Japan, and the brands we stock brand new." },
    { icon: "✓", title: "TESTED", tag: "40-POINT CHECK", txt: "Every button, port, hinge and speaker. Screens, batteries, discs. If it doesn’t pass, it doesn’t ship." },
    { icon: "✚", title: "RESTORED", tag: "BATTERY ALWAYS NEW", txt: "Fresh batteries and foam, cleaned contacts, polished shells. Original parts wherever we can find them." },
    { icon: "✿", title: "PACKED LIKE A GIFT", tag: "SHIPS IN 48H", txt: "Tissue paper, a sticker sheet and a handwritten note. Every order, every time." },
  ];
  $("#steps").innerHTML = STEPS.map((s, i) => `
    <li class="step">
      <span class="step__no">0${i + 1}</span><span class="step__icon" aria-hidden="true">${s.icon}</span>
      <h3 class="step__title">${s.title}</h3>
      <p class="step__txt">${s.txt}</p>
      <span class="step__tag">${s.tag}</span>
    </li>`).join("");

  const PROMISE = [
    { big: "2YR", title: "Warranty on everything", txt: "Vintage included. If it breaks, we fix it or replace it.", href: "faq.html", link: "READ THE FAQ" },
    { big: "30", title: "Days to change your mind", txt: "Free returns, no questions, refund in 5 working days.", href: "returns.html", link: "RETURNS" },
    { big: "€49", title: "Free shipping over", txt: "Tracked delivery across Europe, in recyclable packaging.", href: "shipping.html", link: "SHIPPING" },
    { big: "48H", title: "Packed and posted", txt: "Orders before 14:00 leave the bench within two working days.", href: "shipping.html", link: "DELIVERY TIMES" },
  ];
  $("#promiseGrid").innerHTML = PROMISE.map((p) => `
    <article class="pr">
      <p class="pr__big">${p.big}</p>
      <h3 class="pr__title">${p.title}</h3>
      <p class="pr__txt">${p.txt}</p>
      <a class="pr__link" href="${p.href}">${p.link} →</a>
    </article>`).join("");

  $("#toStory").addEventListener("click", () => $("#story").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }));

  /* =========================================================
     MOTION
     ========================================================= */
  const msgs = $$(".msg");
  const clock = $("#lcdClock");
  if (!animated) { msgs.forEach((m) => m.classList.add("is-read")); return; }

  // cover
  G.timeline({ delay: .1 })
    .from(".ab-issue span", { y: -20, opacity: 0, stagger: .06, duration: .4, ease: "power2.out", clearProps: "transform,opacity" })
    .from(".ab-cover__kick", { opacity: 0, x: -20, duration: .5, clearProps: "transform,opacity" }, "<.1")
    .from(".ab-cover__title .chrome", { yPercent: 60, opacity: 0, stagger: .12, duration: .8, ease: "power4.out", clearProps: "transform,opacity" }, "<.1")
    .from(".ab-cover__lead, .ab-stats, .ab-cover__ctas", { y: 24, opacity: 0, stagger: .08, duration: .5, ease: "power3.out", clearProps: "transform,opacity" }, "-=.4")
    .from(".disc", { scale: .4, opacity: 0, duration: .9, ease: "power3.out", clearProps: "transform,opacity" }, "<")
    .from(".ab-cover__model", { y: 80, opacity: 0, duration: .9, ease: "power3.out", clearProps: "transform,opacity" }, "<.1")
    .from(".sms--cover", { scale: 0, duration: .5, ease: "back.out(2.4)", clearProps: "transform" }, "-=.2");

  if (fine) {
    $("#abCover").addEventListener("mousemove", (e) => {
      const mx = e.clientX / innerWidth - .5, my = e.clientY / innerHeight - .5;
      G.to("#coverPhoto", { x: mx * 16, y: my * 10, duration: 1.2, overwrite: "auto" });
      G.to("#abCover .bubbles", { x: mx * -30, y: my * -20, duration: 1.4, overwrite: "auto" });
    });
  }

  // the inbox fills up while the handset stays on screen
  const light = (n) => {
    clock.textContent = n && MSGS[n - 1].time !== "now" ? MSGS[n - 1].time : "12:00";
    $("#msgCount").textContent = n;
    msgs.forEach((m, i) => { m.classList.toggle("is-new", i === n - 1); m.classList.toggle("is-read", i < n - 1); });
    $(".typing").style.visibility = n >= msgs.length ? "hidden" : "visible";
  };
  const pinStory = innerWidth > 999 && innerHeight >= 700;
  if (window.ScrollTrigger) G.registerPlugin(ScrollTrigger);
  if (window.ScrollTrigger && !pinStory) {
    // phones: no pinning, each message arrives as it scrolls into view
    G.set(msgs, { opacity: 0, y: 24 });
    let shown = 0;
    msgs.forEach((m, i) => ScrollTrigger.create({ trigger: m, start: "top 85%", once: true, onEnter: () => {
      G.to(m, { opacity: 1, y: 0, duration: .5, ease: "power2.out" });
      shown = Math.max(shown, i + 1); light(shown);
    } }));
  }
  if (window.ScrollTrigger && pinStory) {
    G.set(msgs, { opacity: 0, y: 24 });
    const tl = G.timeline({
      scrollTrigger: {
        trigger: "#story", start: "top top", end: () => "+=" + innerHeight * 1.6, pin: true, scrub: .6,
        onUpdate: () => light(msgs.filter((m) => G.getProperty(m, "opacity") > .5).length),
      },
    });
    msgs.forEach((m) => tl.to(m, { opacity: 1, y: 0, duration: 1, ease: "power2.out" }).to({}, { duration: .4 }));
  }
  if (window.ScrollTrigger) {

    G.from(".back__big", { yPercent: 60, scaleY: .4, transformOrigin: "50% 100%", ease: "none",
      scrollTrigger: { trigger: ".back", start: "top bottom", end: "bottom bottom", scrub: true } });
  }

  // reveals
  const reveal = (els, from, opts = {}) => {
    G.set(els, from);
    const io = new IntersectionObserver((ents) => {
      const vis = ents.filter((e) => e.isIntersecting).map((e) => e.target);
      vis.forEach((el) => io.unobserve(el));
      if (vis.length) G.to(vis, { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, stagger: .08, duration: .7, ease: "power3.out", clearProps: "transform,opacity", ...opts });
    }, { rootMargin: "0px 0px -10% 0px" });
    els.forEach((el) => io.observe(el));
  };
  reveal($$(".ab-sec"), { opacity: 0, y: 30 });
  reveal($$(".step"), { opacity: 0, y: 60, rotate: 3 }, { ease: "back.out(1.4)" });
  reveal([$(".studio__photo")], { opacity: 0, y: 40 });
  reveal([$(".studio__quote")], { opacity: 0, y: 30 });
  reveal($$(".pr"), { opacity: 0, y: 40 });
  reveal([$(".hello__card")], { opacity: 0, y: 50, scale: .96 });
})();
