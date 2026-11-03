// Celebrations for right answers and silly commiserations for wrong ones.
//
// Each answer builds a fresh effect: a random main act plus a random set of
// extras, a random colour palette, phrase, paths, speeds and sizes, so no two
// look alike. Particles come from canvas-confetti; the moving GIFs are
// Google's Noto animated emoji (CC BY 4.0), loaded from fonts.gstatic.com.
// Everything sits in a full-screen layer that ignores taps, so the page stays
// usable while it plays.
(() => {
  const NOTO = c => `https://fonts.gstatic.com/s/e/notoemoji/latest/${c}/512.webp`;
  const HAPPY_GIFS = ("1f389 1f38a 1f973 1f929 1f525 1f680 1f4af 1f44f 1f64c 1f60e 1f984 1f431 1f42e " +
    "1f40d 1f422 2728 1f31f 1f308 1f483 1f43e 1f386 1f388 1f3c6 1f947 1f451 1f4aa 1f913 1f9e0 1f60d " +
    "1f970 1f61c 1f92a 1f911 1f40e 1f42c 1f41d 1f98b 1f989 1f427 1f996").split(" ");
  const SAD_GIFS = ("1f62d 1f62c 1f97a 1fae0 1f480 1f47b 1f327_fe0f 1f4a7 1f635_200d_1f4ab 1f921 1f648 " +
    "1f630 1f605 1f644 1f62b 1f629 1f4a9 1f40c 1f300 1f9a5 1f62e_200d_1f4a8 1f925 1f912").split(" ");
  const ANIMALS = [..."🐶🐱🐴🐮🐷🐑🐐🐔🦜🐍🐢🐇🐹🦎🐟🐠🦙🐄🐎🐖🐓🦆🦉🐈🐕🐩🐁🦔🐿️🦩"]
    .filter(c => c.trim() && c !== "️");
  const PARTY = [..."🎉🎊✨⭐🌟💫🎈💥🔥💯🏆🥇👑🦄🌈🍀💖💜💙💚🧡💛"];
  const GLOOM = [..."💧☔🌧️🥀💔🫠😵🙈🤡🐌🍂"].filter(c => c !== "️");

  const YAY = ["Nailed it!", "Pawsome!", "Vet-tastic!", "Doctor material!", "Udderly correct!",
    "Hoof-ray!", "Purr-fect!", "Fin-tastic!", "Neigh-ver doubted you!", "Moo-velous!",
    "Quackin' good!", "Owl-standing!", "Shell yeah!", "Hiss-terical genius!", "Bow-WOW!",
    "Unbe-leaf-able!", "Ewe did it!", "Cluck yeah!", "Llama-zing!", "Hop-tastic!",
    "Diagnosis: GENIUS", "Board certified!", "Chef's kiss!", "Big brain energy!"];
  const NAY = ["Womp womp", "So close!", "Oopsie daisy", "Not quite, doc", "Back to the books!",
    "The patient says: hmm", "Plot twist!", "Close, but no biscuit", "Swing and a miss!",
    "Ruh-roh!", "That's a paws for thought", "Moo-stake!", "Not this time, champ",
    "Neigh!", "Let's call that practice", "Bless your heart"];

  // ---------------------------------------------------------------- helpers
  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const chance = p => Math.random() < p;
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const charOf = c => String.fromCodePoint(...c.split("_").map(h => parseInt(h, 16)));
  const W = () => innerWidth, H = () => innerHeight;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  let layer;
  function stage() {
    if (!layer) {
      layer = document.createElement("div");
      Object.assign(layer.style, { position: "fixed", inset: "0", pointerEvents: "none",
        zIndex: "50", overflow: "hidden" });
      document.body.append(layer);
    }
    if (layer.childElementCount > 150) layer.replaceChildren();
    return layer;
  }

  function el(html, style) {
    const e = document.createElement("div");
    e.textContent = html;
    Object.assign(e.style, { position: "absolute", left: "0", top: "0", willChange: "transform, opacity",
      userSelect: "none" }, style);
    stage().append(e);
    return e;
  }

  // Animate, then remove. Returns the finished promise.
  function play(e, frames, opts) {
    const a = e.animate(frames, { fill: "forwards", ...opts });
    a.finished.then(() => e.remove(), () => e.remove());
    return a.finished.catch(() => {});
  }

  function palette() {
    const base = rand(0, 360), spread = rand(25, 90);
    return Array.from({ length: 6 }, (_, i) =>
      `hsl(${(base + i * spread) % 360} ${randInt(75, 100)}% ${randInt(50, 65)}%)`);
  }

  // GIFs: keep a few loaded ahead so they show up the moment they're needed.
  const ready = { happy: [], sad: [] }, loading = new Set();
  function warm(kind, n) {
    const pool = kind === "happy" ? HAPPY_GIFS : SAD_GIFS;
    shuffle(pool).filter(c => !ready[kind].includes(c) && !loading.has(c)).slice(0, n).forEach(c => {
      loading.add(c);
      const img = new Image();
      img.onload = () => { ready[kind].push(c); loading.delete(c); };
      img.onerror = () => loading.delete(c);
      img.src = NOTO(c);
    });
  }
  function gif(kind, size, style) {
    warm(kind, 1);  // a new one for next time
    const c = ready[kind].length ? pick(ready[kind]) : null;
    const e = c ? document.createElement("img") : document.createElement("div");
    if (c) { e.src = NOTO(c); e.alt = ""; }
    else { e.textContent = pick(kind === "happy" ? PARTY : GLOOM); e.style.fontSize = size * 0.8 + "px";
      e.style.lineHeight = "1"; }
    Object.assign(e.style, { position: "absolute", left: "0", top: "0", width: size + "px",
      height: size + "px", willChange: "transform, opacity" }, style);
    stage().append(e);
    return e;
  }

  const center = card => {
    const r = card ? card.getBoundingClientRect() : { left: 0, top: 0, width: W(), height: H() };
    return { x: (r.left + r.width / 2) / W(), y: Math.min(0.9, (r.top + Math.min(r.height, H()) / 2) / H()) };
  };
  const boom = opts => { if (window.confetti) window.confetti({ disableForReducedMotion: true, ...opts }); };

  // ---------------------------------------------------------- shared acts
  function phrase(text, colors, mood) {
    const size = Math.min(W() * 0.13, 110);
    const box = el("", { left: "50%", top: rand(18, 38) + "%", whiteSpace: "nowrap",
      fontWeight: "900", fontSize: size + "px", lineHeight: "1.1", textAlign: "center",
      fontFamily: pick(["system-ui, sans-serif", "'Comic Sans MS', 'Chalkboard SE', cursive",
        "Impact, 'Arial Black', sans-serif", "Georgia, serif", "'Trebuchet MS', sans-serif"]),
      filter: "drop-shadow(0 4px 0 rgba(0,0,0,.25))" });
    box.style.transform = "translate(-50%, -50%)";
    const fit = Math.min(1, (W() * 0.94) / (text.length * size * 0.62));
    const style = mood === "sad" ? pick(["droop", "wobble", "slump"]) : pick(["slam", "spin", "wave", "drop", "rubber"]);
    [...text].forEach((ch, i) => {
      const s = document.createElement("span");
      s.textContent = ch;
      Object.assign(s.style, { display: "inline-block", whiteSpace: "pre", color: colors[i % colors.length],
        WebkitTextStroke: mood === "sad" ? "2px rgba(15,23,42,.85)" : "2px rgba(255,255,255,.85)",
        paintOrder: "stroke fill" });
      box.append(s);
      const d = { duration: rand(700, 1100), delay: i * rand(25, 60), easing: "cubic-bezier(.2,1.6,.4,1)", fill: "both" };
      if (style === "wave") s.animate([{ transform: "translateY(60px) scale(0)" },
        { transform: "translateY(-30px) scale(1.3)" }, { transform: "translateY(0) scale(1)" }], d);
      if (style === "droop") s.animate([{ transform: "translateY(0) rotate(0)" },
        { transform: `translateY(${rand(20, 70)}px) rotate(${rand(-40, 40)}deg)` }],
        { duration: 1400, delay: 600 + i * 70, easing: "ease-in", fill: "both" });
    });
    const k = {
      slam: [{ transform: `translate(-50%,-50%) scale(${4 * fit})`, opacity: 0 }, { transform: `translate(-50%,-50%) scale(${fit})`, opacity: 1, offset: 0.25 }],
      spin: [{ transform: `translate(-50%,-50%) rotate(-720deg) scale(0)` }, { transform: `translate(-50%,-50%) rotate(0) scale(${fit})`, offset: 0.35 }],
      wave: [{ transform: `translate(-50%,-50%) scale(${fit})` }, { transform: `translate(-50%,-50%) scale(${fit})`, offset: 0.3 }],
      drop: [{ transform: `translate(-50%,-300%) scale(${fit})` }, { transform: `translate(-50%,-50%) scale(${fit})`, offset: 0.3, easing: "ease-out" },
        { transform: `translate(-50%,-62%) scale(${fit})`, offset: 0.38 }, { transform: `translate(-50%,-50%) scale(${fit})`, offset: 0.45 }],
      rubber: [{ transform: `translate(-50%,-50%) scale(0)` }, { transform: `translate(-50%,-50%) scaleX(${1.4 * fit}) scaleY(${0.6 * fit})`, offset: 0.2 },
        { transform: `translate(-50%,-50%) scaleX(${0.8 * fit}) scaleY(${1.2 * fit})`, offset: 0.3 }, { transform: `translate(-50%,-50%) scale(${fit})`, offset: 0.4 }],
      droop: [{ transform: `translate(-50%,-50%) scale(${fit})`, opacity: 0 }, { opacity: 1, offset: 0.15, transform: `translate(-50%,-50%) scale(${fit})` }],
      wobble: [{ transform: `translate(-50%,-50%) rotate(0) scale(${fit})`, opacity: 0 }, { transform: `translate(-50%,-50%) rotate(-12deg) scale(${fit})`, opacity: 1, offset: 0.15 },
        { transform: `translate(-50%,-50%) rotate(10deg) scale(${fit})`, offset: 0.3 }, { transform: `translate(-50%,-50%) rotate(-6deg) scale(${fit})`, offset: 0.45 }],
      slump: [{ transform: `translate(-50%,-50%) scale(${fit})`, opacity: 0 }, { transform: `translate(-50%,-50%) scale(${fit})`, opacity: 1, offset: 0.15 },
        { transform: `translate(-50%,-50%) scaleY(${0.55 * fit}) scaleX(${1.2 * fit}) translateY(40%)`, offset: 0.7 }],
    }[style];
    const last = k[k.length - 1];
    play(box, [...k, { ...last, offset: 0.85, opacity: 1 }, { ...last, offset: 1, opacity: 0 }],
      { duration: rand(2300, 3000) });
  }

  // A GIF travelling along one of several random paths.
  function flyer(kind, slow) {
    const size = rand(70, 170) * (slow ? 1.1 : 1);
    const e = gif(kind, size);
    const w = W(), h = H(), y = rand(0.1, 0.75) * h, dir = chance(0.5) ? 1 : -1;
    const x0 = dir > 0 ? -size : w, x1 = dir > 0 ? w : -size;
    const path = pick(slow ? ["sink", "crawl", "peek", "float"] : ["cross", "bounce", "zoom", "orbit", "diagonal", "peek", "boomerang"]);
    const flip = dir < 0 ? " scaleX(-1)" : "";
    let frames;
    if (path === "cross") frames = Array.from({ length: 9 }, (_, i) => ({
      transform: `translate(${x0 + (x1 - x0) * i / 8}px, ${y + Math.sin(i * 1.4) * rand(30, 90)}px) rotate(${dir * i * rand(10, 50)}deg)` }));
    if (path === "bounce") { const x = rand(0.1, 0.8) * w; frames = [
      { transform: `translate(${x}px, ${h}px)` }, { transform: `translate(${x + dir * 80}px, ${rand(0.05, 0.3) * h}px) rotate(${dir * 180}deg)`, easing: "ease-in" },
      { transform: `translate(${x + dir * 160}px, ${h * 0.75}px) rotate(${dir * 360}deg)`, easing: "ease-out" },
      { transform: `translate(${x + dir * 220}px, ${h * 0.45}px) rotate(${dir * 450}deg)`, easing: "ease-in" },
      { transform: `translate(${x + dir * 280}px, ${h + size}px) rotate(${dir * 540}deg)` }]; }
    if (path === "zoom") { const x = rand(0.15, 0.7) * w; frames = [
      { transform: `translate(${x}px, ${y}px) scale(0) rotate(-180deg)` }, { transform: `translate(${x}px, ${y}px) scale(${rand(1.5, 2.6)}) rotate(15deg)`, offset: 0.3 },
      { transform: `translate(${x}px, ${y}px) scale(${rand(1.2, 2)}) rotate(-10deg)`, offset: 0.7 }, { transform: `translate(${x}px, ${y}px) scale(0) rotate(360deg)` }]; }
    if (path === "orbit") { const cx = w / 2 - size / 2, cy = h * 0.4, r = Math.min(w, h) * rand(0.25, 0.4), s = rand(0, 6.28);
      frames = Array.from({ length: 13 }, (_, i) => ({ transform: `translate(${cx + r * Math.cos(s + dir * i / 2)}px, ${cy + r * 0.7 * Math.sin(s + dir * i / 2)}px) scale(${0.6 + i / 15})`,
        opacity: i === 12 ? 0 : 1 })); }
    if (path === "diagonal") frames = [{ transform: `translate(${x0}px, ${dir > 0 ? h : -size}px) rotate(0)` },
      { transform: `translate(${x1}px, ${dir > 0 ? -size : h}px) rotate(${dir * 720}deg)` }];
    if (path === "peek") { const x = rand(0.05, 0.85) * w; frames = [
      { transform: `translate(${x}px, ${h}px)${flip}` }, { transform: `translate(${x}px, ${h - size * 0.9}px)${flip}`, offset: 0.2, easing: "ease-out" },
      { transform: `translate(${x}px, ${h - size * 0.9}px) rotate(${slow ? -8 : 12}deg)${flip}`, offset: 0.6 }, { transform: `translate(${x}px, ${h}px)${flip}` }]; }
    if (path === "boomerang") frames = [{ transform: `translate(${x0}px, ${y}px) rotate(0)` },
      { transform: `translate(${w / 2}px, ${y - 120}px) rotate(${dir * 540}deg) scale(1.5)`, offset: 0.5 },
      { transform: `translate(${x0}px, ${y + 80}px) rotate(${dir * 1080}deg)` }];
    if (path === "sink") { const x = rand(0.15, 0.7) * w; frames = [
      { transform: `translate(${x}px, ${-size}px) rotate(0)` }, { transform: `translate(${x + 30}px, ${h * 0.35}px) rotate(${dir * 15}deg)`, offset: 0.4 },
      { transform: `translate(${x - 20}px, ${h * 0.45}px) rotate(${-dir * 10}deg)`, offset: 0.6 }, { transform: `translate(${x}px, ${h + size}px) rotate(${dir * 40}deg)`, easing: "ease-in" }]; }
    if (path === "crawl") frames = [{ transform: `translate(${x0}px, ${h - size}px)${flip}` },
      { transform: `translate(${(x0 + x1) / 2}px, ${h - size}px)${flip}` }];
    if (path === "float") frames = Array.from({ length: 7 }, (_, i) => ({
      transform: `translate(${x0 + (x1 - x0) * i / 6}px, ${y + Math.sin(i) * 40}px)${flip}`, opacity: i === 0 || i === 6 ? 0 : 0.95 }));
    play(e, frames, { duration: slow ? rand(2600, 4000) : rand(1600, 2800), delay: rand(0, 400), easing: path === "cross" || path === "orbit" ? "linear" : "ease-in-out" });
  }

  function rain(chars, n, gloomy) {
    for (let i = 0; i < n; i++) {
      const e = el(pick(chars), { fontSize: rand(22, gloomy ? 34 : 54) + "px" });
      const x = rand(0, W()), sway = rand(-80, 80);
      play(e, [{ transform: `translate(${x}px, -60px) rotate(0)` },
        { transform: `translate(${x + sway}px, ${H() * 0.5}px) rotate(${rand(-200, 200)}deg)` },
        { transform: `translate(${x - sway}px, ${H() + 60}px) rotate(${rand(-400, 400)}deg)` }],
        { duration: gloomy ? rand(1400, 2200) : rand(1600, 3000), delay: rand(0, 900), easing: "ease-in" });
    }
  }

  function wobble(card, kind) {
    if (!card) return;
    const k = {
      jump: [{ transform: "none" }, { transform: "translateY(-24px) scale(1.04, .96)" }, { transform: "translateY(0) scale(.97, 1.03)" }, { transform: "none" }],
      spin: [{ transform: "none" }, { transform: "rotateY(360deg)" }],
      pulse: [{ transform: "none" }, { transform: "scale(1.05)" }, { transform: "scale(.98)" }, { transform: "none" }],
      shake: [0, -14, 12, -10, 8, -4, 0].map(x => ({ transform: `translateX(${x}px) rotate(${x / 6}deg)` })),
      jelly: [{ transform: "none" }, { transform: "scale(1.12, .88)" }, { transform: "scale(.9, 1.1)" }, { transform: "scale(1.05, .95)" }, { transform: "none" }],
      tilt: [{ transform: "none" }, { transform: "rotate(-3deg) translateY(6px)" }, { transform: "rotate(2deg) translateY(4px)" }, { transform: "none" }],
    }[kind];
    card.animate(k, { duration: kind === "spin" ? 900 : 650, easing: "ease-in-out" });
  }

  function flash(colors, gloomy) {
    const e = el("", { inset: "0", width: "100%", height: "100%", mixBlendMode: gloomy ? "multiply" : "screen",
      background: gloomy ? "radial-gradient(circle, transparent 30%, rgba(40,50,80,.55))"
        : `radial-gradient(circle at ${rand(20, 80)}% ${rand(20, 80)}%, ${colors[0]}, ${colors[2]} 45%, transparent 75%)` });
    play(e, [{ opacity: 0 }, { opacity: gloomy ? 0.9 : 0.45 }, { opacity: 0 }], { duration: gloomy ? 1800 : 900 });
  }

  // ---------------------------------------------------- right-answer acts
  const HAPPY_MAIN = {
    cannons(c, colors) {
      const go = side => boom({ particleCount: randInt(60, 120), angle: side ? 60 : 120, spread: rand(45, 80),
        origin: { x: side ? 0 : 1, y: rand(0.6, 0.9) }, colors, startVelocity: rand(45, 70), scalar: rand(0.8, 1.4) });
      const rounds = randInt(1, 3);
      for (let i = 0; i < rounds; i++) setTimeout(() => { go(true); go(false); }, i * rand(250, 450));
    },
    fireworks(c, colors) {
      const n = randInt(3, 7);
      for (let i = 0; i < n; i++) setTimeout(() => boom({ particleCount: randInt(40, 90), spread: 360,
        startVelocity: rand(20, 40), ticks: 80, gravity: rand(0.4, 1), colors: shuffle(colors).slice(0, 3),
        origin: { x: rand(0.1, 0.9), y: rand(0.1, 0.5) }, shapes: [pick(["circle", "square", "star"])] }), i * rand(150, 350));
    },
    emojiBlast(c, colors) {
      if (!window.confetti || !confetti.shapeFromText) return HAPPY_MAIN.cannons(c, colors);
      const set = shuffle([...PARTY, ...ANIMALS]).slice(0, randInt(2, 5));
      const shapes = set.map(text => confetti.shapeFromText({ text, scalar: 3 }));
      const o = center(c);
      boom({ shapes, scalar: 3, particleCount: randInt(25, 50), spread: rand(90, 360), startVelocity: rand(30, 55), origin: o, ticks: 140 });
      setTimeout(() => boom({ shapes, scalar: 2.2, particleCount: randInt(15, 30), spread: 160, origin: o }), 350);
    },
    starBurst(c, colors) {
      const o = center(c);
      [0, 120, 240].forEach((d, i) => setTimeout(() => boom({ particleCount: randInt(30, 60), spread: 360, startVelocity: 30 + i * 8,
        shapes: ["star"], colors: ["#FFE400", "#FFBD00", "#E89400", "#FFCA6C", "#FDFFB8", ...colors.slice(0, 2)],
        origin: o, scalar: rand(1, 1.8), ticks: 90, gravity: 0.6 }), d));
    },
    snowstorm(c, colors) {
      const end = Date.now() + rand(1200, 2000);
      (function frame() {
        boom({ particleCount: 6, startVelocity: 0, ticks: 300, gravity: rand(0.4, 0.9), origin: { x: Math.random(), y: -0.05 },
          colors, shapes: [pick(["circle", "square"])], scalar: rand(0.8, 1.6), drift: rand(-1, 1) });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    },
    stampede() {
      const dir = chance(0.5) ? 1 : -1, n = randInt(5, 11), herd = shuffle(ANIMALS).slice(0, randInt(1, 4));
      const speed = rand(1600, 2600), ground = H() - rand(60, 140);
      for (let i = 0; i < n; i++) {
        const s = rand(36, 70), e = el(pick(herd), { fontSize: s + "px" });
        const x0 = dir > 0 ? -s - i * rand(40, 90) : W() + i * rand(40, 90), x1 = dir > 0 ? W() + s + 400 : -s - 400;
        const hop = rand(20, 60), flip = dir > 0 ? " scaleX(-1)" : "";
        play(e, Array.from({ length: 11 }, (_, k) => ({
          transform: `translate(${x0 + (x1 - x0) * k / 10}px, ${ground - (k % 2 ? hop : 0)}px)${flip}` })),
          { duration: speed, delay: i * rand(30, 120), easing: "linear" });
      }
      if (chance(0.5)) flyer("happy");
    },
    balloons(c, colors) {
      const n = randInt(8, 16);
      for (let i = 0; i < n; i++) {
        const e = el(pick(["🎈", "🎈", "🎈", "🪁", "🫧", "🎀"]), { fontSize: rand(36, 72) + "px",
          filter: `hue-rotate(${randInt(0, 360)}deg)` });
        const x = rand(0, W()), sway = rand(30, 90);
        play(e, Array.from({ length: 6 }, (_, k) => ({ transform: `translate(${x + Math.sin(k) * sway}px, ${H() + 80 - (H() + 200) * k / 5}px) rotate(${Math.sin(k) * 15}deg)` })),
          { duration: rand(2200, 3400), delay: rand(0, 600), easing: "ease-in" });
      }
    },
    partyRain() { rain(shuffle([...PARTY, ...ANIMALS]).slice(0, randInt(3, 8)), randInt(25, 45)); },
    gifParty() { for (let i = 0, n = randInt(3, 6); i < n; i++) flyer("happy"); },
  };

  const HAPPY_EXTRA = [
    c => flyer("happy"),
    c => { flyer("happy"); flyer("happy"); },
    (c, colors) => flash(colors),
    c => wobble(c, pick(["jump", "spin", "pulse", "jelly"])),
    c => { // giant GIF that pops right in your face
      const s = Math.min(W(), H()) * rand(0.45, 0.7), e = gif("happy", s);
      const x = (W() - s) / 2 + rand(-40, 40), y = (H() - s) / 2 + rand(-60, 20);
      play(e, [{ transform: `translate(${x}px, ${y}px) scale(0) rotate(${rand(-90, 90)}deg)`, opacity: 1 },
        { transform: `translate(${x}px, ${y}px) scale(1.1) rotate(0)`, offset: 0.25 },
        { transform: `translate(${x}px, ${y}px) scale(1) rotate(${rand(-8, 8)}deg)`, offset: 0.7, opacity: 1 },
        { transform: `translate(${x}px, ${y}px) scale(1.6)`, opacity: 0 }], { duration: rand(1800, 2400), easing: "ease-out" });
    },
    c => { // disco card
      if (c) c.animate([{ filter: "none" }, { filter: "hue-rotate(180deg) saturate(2)" }, { filter: "hue-rotate(360deg)" }, { filter: "none" }],
        { duration: 1200, iterations: randInt(1, 2) });
    },
    c => { // the whole screen does a little hop
      document.querySelector("main").animate([{ transform: "none" }, { transform: `rotate(${pick([-2, 2])}deg) scale(1.02)` }, { transform: "none" }],
        { duration: 500, easing: "ease-in-out" });
    },
    (c, colors) => { // sparkle ring around the card
      const o = center(c), n = randInt(10, 18), r = Math.min(W(), H()) * rand(0.2, 0.35);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 6.28, e = el(pick(["✨", "⭐", "💫", "🌟", "💖"]), { fontSize: rand(20, 40) + "px" });
        const cx = o.x * W(), cy = o.y * H();
        play(e, [{ transform: `translate(${cx}px, ${cy}px) scale(0)` },
          { transform: `translate(${cx + Math.cos(a) * r}px, ${cy + Math.sin(a) * r}px) scale(1.4) rotate(180deg)`, offset: 0.5 },
          { transform: `translate(${cx + Math.cos(a + 1) * r * 1.3}px, ${cy + Math.sin(a + 1) * r * 1.3}px) scale(0) rotate(360deg)` }],
          { duration: rand(1200, 1700), easing: "ease-out" });
      }
    },
  ];

  // ---------------------------------------------------- wrong-answer acts
  const SAD_MAIN = {
    rainCloud(c) {
      const o = center(c), cx = o.x * W(), top = Math.max(10, (c ? c.getBoundingClientRect().top : 100) - 120);
      const cloud = gif("sad", rand(110, 160));
      cloud.src = cloud.tagName === "IMG" ? NOTO("1f327_fe0f") : cloud.src;
      play(cloud, [{ transform: `translate(${cx - 70}px, -160px)` }, { transform: `translate(${cx - 70}px, ${top}px)`, offset: 0.2 },
        { transform: `translate(${cx - 40}px, ${top}px)`, offset: 0.8 }, { transform: `translate(${cx}px, -160px)` }], { duration: 3000 });
      for (let i = 0; i < 30; i++) {
        const e = el(pick(["💧", "💧", "💦"]), { fontSize: rand(14, 24) + "px" }), x = cx + rand(-80, 80);
        play(e, [{ transform: `translate(${x}px, ${top + 90}px)`, opacity: 1 }, { transform: `translate(${x}px, ${top + rand(250, 450)}px)`, opacity: 0 }],
          { duration: rand(500, 900), delay: 500 + rand(0, 1800), easing: "ease-in" });
      }
    },
    sadDrizzle(c) {
      boom({ particleCount: randInt(30, 60), spread: 60, startVelocity: rand(5, 15), gravity: 1.5, ticks: 120,
        colors: ["#8a8f98", "#6b7280", "#9ca3af", "#4b5563"], origin: center(c), scalar: rand(0.6, 1), shapes: ["circle"] });
    },
    gloomRain() { rain(shuffle(GLOOM).slice(0, randInt(2, 4)), randInt(15, 25), true); },
    meltdown(c) {
      const s = Math.min(W(), H()) * rand(0.35, 0.55), e = gif("sad", s);
      if (e.tagName === "IMG" && chance(0.5)) e.src = NOTO("1fae0");
      const x = (W() - s) / 2, y = (H() - s) / 2;
      play(e, [{ transform: `translate(${x}px, ${y}px) scale(0)` }, { transform: `translate(${x}px, ${y}px) scale(1)`, offset: 0.2 },
        { transform: `translate(${x}px, ${y}px) scale(1)`, offset: 0.6 },
        { transform: `translate(${x}px, ${y + s * 0.6}px) scaleX(1.5) scaleY(0.1)`, opacity: 0 }], { duration: rand(2200, 2800), easing: "ease-in" });
    },
    snailParade() {
      for (let i = 0, n = randInt(1, 3); i < n; i++) {
        const e = el(pick(["🐌", "🐢", "🦥"]), { fontSize: rand(40, 64) + "px" }), y = H() - rand(50, 110) - i * 50;
        play(e, [{ transform: `translate(-80px, ${y}px) scaleX(-1)` }, { transform: `translate(${W() * rand(0.3, 0.5)}px, ${y}px) scaleX(-1)` }],
          { duration: rand(3200, 4200), delay: i * 300, easing: "linear" });
      }
      flyer("sad", true);
    },
    sadParade() { for (let i = 0, n = randInt(2, 4); i < n; i++) flyer("sad", true); },
    bonk(c) {
      const o = center(c), e = el("💥", { fontSize: rand(80, 130) + "px" });
      play(e, [{ transform: `translate(${o.x * W() - 50}px, ${o.y * H() - 60}px) scale(0)` },
        { transform: `translate(${o.x * W() - 50}px, ${o.y * H() - 60}px) scale(1.4) rotate(20deg)`, offset: 0.3 },
        { transform: `translate(${o.x * W() - 50}px, ${o.y * H() - 60}px) scale(0)` }], { duration: 700 });
      wobble(c, "shake");
      setTimeout(() => { for (let i = 0; i < 5; i++) {
        const s = el(pick(["⭐", "💫", "🐤"]), { fontSize: "26px" }), a = i * 1.26;
        play(s, Array.from({ length: 9 }, (_, k) => ({ transform: `translate(${o.x * W() + Math.cos(a + k) * 70}px, ${o.y * H() - 120 + Math.sin(a + k) * 22}px)` })),
          { duration: 1600, easing: "linear" });
      } }, 250);
    },
  };

  const SAD_EXTRA = [
    c => flyer("sad", true),
    c => wobble(c, pick(["shake", "jelly", "tilt"])),
    (c, colors) => flash(colors, true),
    c => { // the card briefly loses its colour
      if (c) c.animate([{ filter: "none" }, { filter: "grayscale(1) brightness(.9)" }, { filter: "grayscale(1)", offset: 0.7 }, { filter: "none" }],
        { duration: 1600 });
    },
    c => { // a tiny violin plays
      const e = el(pick(["🎻", "🎺", "🪗"]), { fontSize: "48px" }), x = rand(0.1, 0.8) * W();
      play(e, [{ transform: `translate(${x}px, ${H()}px) rotate(0)` }, { transform: `translate(${x}px, ${H() - 110}px) rotate(-15deg)`, offset: 0.25 },
        { transform: `translate(${x + 10}px, ${H() - 120}px) rotate(15deg)`, offset: 0.5 }, { transform: `translate(${x}px, ${H() - 110}px) rotate(-15deg)`, offset: 0.75 },
        { transform: `translate(${x}px, ${H()}px)` }], { duration: 2400 });
    },
  ];

  // ------------------------------------------------------------- the show
  function show(good, card) {
    if (reduced()) {  // motion-sensitive setting: just the words, no flying things
      const e = el(pick(good ? YAY : NAY), { left: "50%", top: "30%", fontSize: "40px", fontWeight: "800" });
      e.style.transform = "translate(-50%, -50%)";
      return play(e, [{ opacity: 0 }, { opacity: 1 }, { opacity: 1 }, { opacity: 0 }], { duration: 1600 });
    }
    const colors = good ? palette() : ["#64748b", "#94a3b8", "#475569", "#a3a3a3", "#7c8aa5"];
    const main = good ? HAPPY_MAIN : SAD_MAIN, extras = good ? HAPPY_EXTRA : SAD_EXTRA;
    const acts = shuffle(Object.keys(main)).slice(0, good ? randInt(1, 2) : 1);
    acts.forEach(k => main[k](card, colors));
    shuffle(extras).slice(0, randInt(1, good ? 3 : 2)).forEach(f => f(card, colors));
    if (chance(0.85)) phrase(pick(good ? YAY : NAY), good ? colors : ["#cbd5e1", "#93c5fd", "#a5b4fc", "#e2e8f0"], good ? "happy" : "sad");
  }

  window.FX = {
    correct: card => show(true, card),
    wrong: card => show(false, card),
    // Have a few GIFs ready before the first answer.
    prime: () => { warm("happy", 4); warm("sad", 3); },
  };
})();
