/* =========================================================
   NODEX — CONTACT (airmail)
   The letter keeps a draft in this browser while you type.
   NOTE: there is no mail server yet — "POST IT" only plays
   the animation and clears the draft. Hook the submit handler
   up to a form service / backend before going live.
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const G = window.gsap;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const animated = !!G && !reduce;
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- dates ---------- */
  const d = new Date();
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  $("#letterDate").textContent = `Milano, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  $("#pmDate").textContent = [d.getDate(), d.getMonth() + 1, d.getFullYear() % 100].map((n) => String(n).padStart(2, "0")).join("·");

  /* ---------- lazy image slot (the stamp photo) ---------- */
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

  /* =========================================================
     THE LETTER
     ========================================================= */
  const TOPICS = [
    { id: "order", label: "My order", needsOrder: true },
    { id: "returns", label: "A return", needsOrder: true },
    { id: "product", label: "A product" },
    { id: "trade", label: "Selling you a gadget" },
    { id: "visit", label: "Visiting the showroom" },
    { id: "press", label: "Press & collabs" },
    { id: "other", label: "Something else" },
  ];
  $("#topics").innerHTML = TOPICS.map((t, i) => `
    <label class="topic"><input type="radio" name="topic" value="${t.id}"${i === 0 ? " checked" : ""} /><span>${t.label}</span></label>`).join("");

  const form = $("#letter");
  const F = { name: $("#fName"), email: $("#fEmail"), order: $("#fOrder"), message: $("#fMsg") };
  const topic = () => (form.querySelector("input[name=topic]:checked") || {}).value || "order";
  const setTopic = (id) => { const r = form.querySelector(`input[name=topic][value="${id}"]`); if (r) { r.checked = true; syncTopic(); } };
  const syncTopic = () => { $("#orderField").hidden = !TOPICS.find((t) => t.id === topic()).needsOrder; };
  const syncSign = () => { $("#signName").textContent = F.name.value.trim() || "…"; };
  const syncCount = () => {
    if (F.message.value.length > 1000) F.message.value = F.message.value.slice(0, 1000);
    $("#msgCount").textContent = F.message.value.length;
  };

  // draft: kept only in this browser
  const DKEY = "nodex-letter";
  let saveT = null;
  const saveDraft = () => {
    try { localStorage.setItem(DKEY, JSON.stringify({ topic: topic(), name: F.name.value, email: F.email.value, order: F.order.value, message: F.message.value })); } catch {}
  };
  const loadDraft = () => {
    let dr = null;
    try { dr = JSON.parse(localStorage.getItem(DKEY)); } catch {}
    if (!dr) return;
    ["name", "email", "order", "message"].forEach((k) => (F[k].value = dr[k] || ""));
    if (dr.topic) setTopic(dr.topic);
  };
  loadDraft();
  const qTopic = new URL(location.href).searchParams.get("topic");
  if (qTopic) setTopic(qTopic);
  syncTopic(); syncSign(); syncCount();

  form.addEventListener("input", (e) => {
    if (e.target === F.name) syncSign();
    if (e.target === F.message) syncCount();
    if (e.target.name === "topic") syncTopic();
    e.target.closest(".field")?.classList.remove("is-bad");
    clearTimeout(saveT); saveT = setTimeout(saveDraft, 300);
  });
  form.addEventListener("change", (e) => { if (e.target.name === "topic") { syncTopic(); saveDraft(); } });

  const validate = () => {
    const bad = [];
    if (F.name.value.trim().length < 2) bad.push([F.name, "your name"]);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(F.email.value.trim())) bad.push([F.email, "an email we can reply to"]);
    if (F.message.value.trim().length < 10) bad.push([F.message, "a few words in the message"]);
    $$(".field", form).forEach((f) => f.classList.remove("is-bad"));
    bad.forEach(([el]) => el.closest(".field").classList.add("is-bad"));
    $("#letterErr").textContent = bad.length ? `Almost! We still need ${bad.map((b) => b[1]).join(", ")}.` : "";
    if (bad.length) bad[0][0].focus();
    return !bad.length;
  };

  const showSent = () => {
    $("#sentTxt").innerHTML = `Thanks, ${esc(F.name.value.trim().split(" ")[0])}! We’ll reply to <b>${esc(F.email.value.trim())}</b> within 24 hours.`;
    form.hidden = true; $("#sent").hidden = false;
    clearTimeout(saveT);
    try { localStorage.removeItem(DKEY); } catch {}
    if (animated) G.from("#sent > *", { y: 30, opacity: 0, stagger: .1, duration: .6, ease: "back.out(1.8)", clearProps: "transform,opacity" });
  };
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) return;
    // (no backend yet: this is where the message would be sent)
    if (!animated) return showSent();
    $("#sendBtn").disabled = true;
    G.timeline({ onComplete: () => { showSent(); G.set(form, { clearProps: "all" }); $("#sendBtn").disabled = false; } })
      .to(form, { scaleY: .5, transformOrigin: "50% 0%", duration: .35, ease: "power2.in" })
      .to(form, { scaleY: .25, scaleX: .6, rotate: -6, duration: .3, ease: "power2.in" })
      .to(form, { x: "60vw", y: "-60vh", rotate: 25, opacity: 0, duration: .7, ease: "power3.in" });
  });
  $("#another").addEventListener("click", () => {
    form.reset(); setTopic("order"); syncSign(); syncCount();
    $("#sent").hidden = true; form.hidden = false;
    if (animated) G.from(form, { y: 40, opacity: 0, duration: .5, ease: "power3.out", clearProps: "transform,opacity" });
    F.name.focus();
  });

  /* ---------- jump to the letter (cover button + postcards) ---------- */
  const toLetter = (topicId) => {
    if (topicId) setTopic(topicId);
    if (!$("#sent").hidden) $("#another").click();
    $("#write").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    setTimeout(() => (F.name.value ? F.message : F.name).focus({ preventScroll: true }), reduce ? 0 : 700);
  };
  $("#toWrite").addEventListener("click", () => toLetter());
  $$("[data-topic]").forEach((b) => b.addEventListener("click", () => toLetter(b.dataset.topic)));

  /* =========================================================
     QUICK ANSWERS
     ========================================================= */
  const QA = [
    ["Where’s my order?", "Orders placed before 14:00 leave the bench within two working days. You get a tracking link by email as soon as the parcel is scanned."],
    ["Can I return something?", "Yes: you have 30 days, and returns are free. Write to us with your order number and we’ll send you a label."],
    ["Do vintage gadgets really work?", "Every single one is tested, cleaned and fitted with a new battery where it takes one. They’re covered by the same 2-year warranty as new products."],
    ["Will an old phone take my SIM?", "Most of our phones take a standard SIM with an adapter and work on 2G/3G where it’s still available. Ask us about a specific model before you buy."],
  ];
  $("#qaList").innerHTML = QA.map(([q, a], i) => `
    <div class="qa__item">
      <button class="qa__q" aria-expanded="false" aria-controls="qa${i}">${q}<i aria-hidden="true">+</i></button>
      <div class="qa__a" id="qa${i}" role="region"><p>${a}</p></div>
    </div>`).join("");
  $("#qaList").addEventListener("click", (e) => {
    const q = e.target.closest(".qa__q");
    if (!q) return;
    const item = q.parentElement, a = $(".qa__a", item);
    const open = !item.classList.contains("is-open");
    item.classList.toggle("is-open", open);
    q.setAttribute("aria-expanded", open);
    if (animated) G.to(a, { height: open ? "auto" : 0, duration: .45, ease: "power3.inOut" });
    else a.style.height = open ? "auto" : "0";
  });

  /* =========================================================
     MOTION
     ========================================================= */
  if (!animated) return;
  G.timeline({ delay: .1 })
    .from(".ct-issue span", { y: -20, opacity: 0, stagger: .06, duration: .4, ease: "power2.out", clearProps: "transform,opacity" })
    .from(".ct-cover__kick", { opacity: 0, x: -20, duration: .5, clearProps: "transform,opacity" }, "<.1")
    .from(".ct-cover__title span", { yPercent: 70, opacity: 0, stagger: .12, duration: .8, ease: "power4.out", clearProps: "transform,opacity" }, "<.1")
    .from(".ct-cover__lead, .ct-stats, .ct-cover__ctas", { y: 24, opacity: 0, stagger: .08, duration: .5, ease: "power3.out", clearProps: "transform,opacity" }, "-=.4")
    .from(".env", { x: 200, y: -120, rotate: 20, opacity: 0, duration: 1, ease: "power3.out", clearProps: "transform,opacity" }, "<")
    .from(".pstamp", { scale: 1.6, opacity: 0, duration: .5, ease: "power3.in", clearProps: "transform,opacity" }, "-=.2")
    .from(".postmark", { scale: 2, opacity: 0, duration: .35, ease: "power4.in", clearProps: "transform,opacity" }, "+=.05");

  if (fine) {
    $("#ctCover").addEventListener("mousemove", (e) => {
      const mx = e.clientX / innerWidth - .5, my = e.clientY / innerHeight - .5;
      G.to("#coverArt", { x: mx * 20, y: my * 14, rotate: mx * 3, duration: 1.2, overwrite: "auto" });
    });
  }

  const reveal = (els, from) => {
    G.set(els, from);
    const io = new IntersectionObserver((ents) => {
      const vis = ents.filter((e) => e.isIntersecting).map((e) => e.target);
      vis.forEach((el) => io.unobserve(el));
      if (vis.length) G.to(vis, { opacity: 1, y: 0, stagger: .1, duration: .7, ease: "power3.out", clearProps: "transform,opacity" });
    }, { rootMargin: "0px 0px -10% 0px" });
    els.forEach((el) => io.observe(el));
  };
  reveal($$(".ct-sec"), { opacity: 0, y: 30 });
  reveal([$(".desk")], { opacity: 0, y: 60 });
  reveal($$(".pcard"), { opacity: 0, y: 60 });
  reveal($$(".qa__item"), { opacity: 0, y: 20 });

  if (window.ScrollTrigger) {
    G.registerPlugin(ScrollTrigger);
    G.from(".back__big", { yPercent: 60, scaleY: .4, transformOrigin: "50% 100%", ease: "none",
      scrollTrigger: { trigger: ".back", start: "top bottom", end: "bottom bottom", scrub: true } });
  }
})();
