// Celebrations for right answers and silly commiserations for wrong ones.
//
// Each answer builds a fresh effect: a random main act plus a random set of
// extras, a random colour palette, phrase, paths, speeds and sizes, so no two
// look alike. Wrong answers sometimes bring a natural disaster (tornado,
// volcano, explosion, lightning, tsunami...). Hand-drawn SVG mascots (a dog,
// cat or cow) cheer or panic along with you. Particles come from
// canvas-confetti; the moving GIFs are Google's Noto animated emoji
// (CC BY 4.0), loaded from fonts.gstatic.com.
// Everything sits in a full-screen layer that ignores taps, so the page stays
// usable while it plays.
(() => {
  const NOTO = c => `https://fonts.gstatic.com/s/e/notoemoji/latest/${c}/512.webp`;
  const HAPPY_GIFS = ("1f389 1f38a 1f973 1f929 1f525 1f680 1f4af 1f44f 1f64c 1f60e 1f984 1f431 1f42e " +
    "1f40d 1f422 2728 1f31f 1f308 1f483 1f43e 1f386 1f388 1f3c6 1f947 1f451 1f4aa 1f913 1f9e0 1f60d " +
    "1f970 1f61c 1f92a 1f911 1f40e 1f42c 1f41d 1f98b 1f989 1f427 1f996").split(" ");
  const SAD_GIFS = ("1f62d 1f62c 1f97a 1fae0 1f480 1f47b 1f327_fe0f 1f4a7 1f635_200d_1f4ab 1f921 1f648 " +
    "1f630 1f605 1f644 1f62b 1f629 1f4a9 1f40c 1f300 1f9a5 1f62e_200d_1f4a8 1f925 1f912").split(" ");
  // Animated animals, cheerful and gloomy.
  const CRITTER_GIFS = ("1f415 1f416 1f410 1f413 1f423 1f424 1f407 1f43b 1f43c 1f981 1f98a 1f99d 1f994 " +
    "1f99a 1f9a9 1f433 1f419 1f980 1f421 1f438 1f995 1f41e 1f412 1f63a 1f639 1f63b 1f63c 1f9a6 1f426 " +
    "1f54a_fe0f 1f425 1f429 1f415_200d_1f9ba 1f402 1f40e 1f431 1f42e 1f422 1f42c 1f41d 1f98b 1f989 " +
    "1f427 1f996").split(" ");
  const GLOOM_CRITTER_GIFS = ("1f63f 1f640 1f63e 1f649 1f64a 1f40a 1f988 1f99f 1f9a0 1f577_fe0f 1f43a " +
    "1f987 1f997 1f40c 1f9a5").split(" ");
  const POOLS = { happy: HAPPY_GIFS, sad: SAD_GIFS, critter: CRITTER_GIFS, gloomCritter: GLOOM_CRITTER_GIFS };
  // Disaster art, by name.
  const DISASTER = { fire: "1f525", boom: "1f4a5", bomb: "1f4a3", tornado: "1f32a_fe0f", volcano: "1f30b",
    bolt: "26a1", wave: "1f30a", comet: "2604_fe0f", storm: "1f329_fe0f", siren: "1f6a8", snow: "2744_fe0f",
    mindblown: "1f92f", scream: "1f631", hot: "1f975", cold: "1f976", earth: "1f30d" };
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
  const DOOM = ["This is fine.", "Code red!", "Category 5 wrong", "Total meltdown", "Mayday! Mayday!",
    "Evacuate the clinic!", "Well, that escalated", "Disaster-ific!", "Abandon ship!", "Oh, the humanity!",
    "Not the vibe", "Run for the hills!"];

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

  // Animate, then remove. Returns the finished promise. "both" holds the
  // first frame during any delay, so nothing flashes at the top-left corner.
  function play(e, frames, opts) {
    const a = e.animate(frames, { fill: "both", ...opts });
    a.finished.then(() => e.remove(), () => e.remove());
    return a.finished.catch(() => {});
  }

  function palette() {
    const base = rand(0, 360), spread = rand(25, 90);
    return Array.from({ length: 6 }, (_, i) =>
      `hsl(${(base + i * spread) % 360} ${randInt(75, 100)}% ${randInt(50, 65)}%)`);
  }

  // GIFs: keep a few loaded ahead so they show up the moment they're needed.
  const ready = { happy: [], sad: [], critter: [], gloomCritter: [] }, loaded = new Set(), loading = new Set();
  function load(c, kind) {
    if (loaded.has(c) || loading.has(c)) return;
    loading.add(c);
    const img = new Image();
    img.onload = () => { loaded.add(c); loading.delete(c); if (kind) ready[kind].push(c); };
    img.onerror = () => loading.delete(c);
    img.src = NOTO(c);
  }
  function warm(kind, n) {
    if (kind === "disaster") return shuffle(Object.values(DISASTER)).filter(c => !loaded.has(c)).slice(0, n).forEach(c => load(c));
    shuffle(POOLS[kind]).filter(c => !loaded.has(c) && !loading.has(c)).slice(0, n).forEach(c => load(c, kind));
  }
  function imgOf(c, size, fallback, style) {
    const e = c && loaded.has(c) ? document.createElement("img") : document.createElement("div");
    if (e.tagName === "IMG") { e.src = NOTO(c); e.alt = ""; }
    else { e.textContent = fallback; e.style.fontSize = size * 0.8 + "px"; e.style.lineHeight = "1"; }
    Object.assign(e.style, { position: "absolute", left: "0", top: "0", width: size + "px",
      height: size + "px", willChange: "transform, opacity" }, style);
    stage().append(e);
    return e;
  }
  function gif(kind, size, style) {
    warm(kind, 1);  // a new one for next time
    const c = ready[kind].length ? pick(ready[kind]) : null;
    const fallback = pick({ happy: PARTY, sad: GLOOM, critter: ANIMALS, gloomCritter: GLOOM }[kind]);
    return imgOf(c, size, c ? charOf(c) : fallback, style);
  }
  // A specific disaster GIF; until it has loaded, the plain emoji stands in.
  function art(name, size, style) {
    const c = DISASTER[name];
    if (!loaded.has(c)) load(c);
    return imgOf(c, size, charOf(c), style);
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
    if (kind === "happy" && chance(0.45)) kind = "critter";
    if (kind === "sad" && chance(0.35)) kind = "gloomCritter";
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

  // ------------------------------------------------------- drawn mascots
  // A cartoon dog, cat or cow drawn in SVG, with a random coat. Happy ones
  // hop, wave and wag; sad ones droop and cry; panicked ones tremble and run.
  const MASCOT_CSS = `
.fxm-tail{transform-box:fill-box;transform-origin:0% 100%;animation:fxm-wag .22s ease-in-out infinite alternate}
.fxm-sad .fxm-tail{animation-duration:1.6s}
.fxm-eye{transform-box:fill-box;transform-origin:center;animation:fxm-blink 2.4s infinite}
.fxm-tear{transform-box:fill-box;animation:fxm-tear .9s ease-in infinite}
.fxm-happy .fxm-body{animation:fxm-hop .42s ease-in-out infinite alternate}
.fxm-panic .fxm-body{animation:fxm-tremble .07s linear infinite alternate}
.fxm-sad .fxm-body{animation:fxm-sigh 1.4s ease-in-out infinite alternate}
.fxm-arm{transform-box:fill-box;animation:fxm-wave .28s ease-in-out infinite alternate}
.fxm-arm.l{transform-origin:100% 100%}.fxm-arm.r{transform-origin:0% 100%;animation-direction:alternate-reverse}
.fxm-happy .fxm-head{transform-box:fill-box;transform-origin:50% 90%;animation:fxm-tilt .8s ease-in-out infinite alternate}
@keyframes fxm-wag{from{transform:rotate(-22deg)}to{transform:rotate(28deg)}}
@keyframes fxm-blink{0%,92%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}
@keyframes fxm-tear{from{transform:translateY(0);opacity:1}to{transform:translateY(34px);opacity:0}}
@keyframes fxm-hop{from{transform:translateY(0)}to{transform:translateY(-12px)}}
@keyframes fxm-tremble{from{transform:translate(-2px,1px)}to{transform:translate(2px,-1px)}}
@keyframes fxm-sigh{from{transform:translateY(0)}to{transform:translateY(5px) scaleY(.97)}}
@keyframes fxm-wave{from{transform:rotate(-28deg)}to{transform:rotate(22deg)}}
@keyframes fxm-tilt{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}`;
  let mascotCss = false;
  const SAYS = {
    happy: { dog: ["Woof!", "Good human!", "Bark bark!", "*tail wags*", "Treat time!"],
      cat: ["Purrfect.", "Meow-velous!", "Adequate.", "Mrrp!", "I'll allow it."],
      cow: ["Moo-velous!", "Udderly right!", "MOOO!", "Holy cow!"] },
    sad: { dog: ["Ruh-roh", "*whimper*", "Awoo...", "No treat?"],
      cat: ["Hiss.", "Disappointed.", "*knocks your coffee over*", "Meh."],
      cow: ["Mooo...", "Udderly wrong", "*sad moo*"] },
    panic: { dog: ["AAAAH!", "RUN!", "Save the treats!"], cat: ["NOPE!", "HISSSS!", "I'm out!"],
      cow: ["MOOOOO!", "Not again!", "HELP!"] },
  };

  function mascotSvg(species, mood) {
    const coat = species === "cow" ? "#fbfbf8" : pick(["#d9a066", "#c98b4f", "#f2c38b", "#8d6e63", "#bdbdbd",
      "#3f3a36", "#f5f0e6", "#e0763c", `hsl(${randInt(0, 360)} 55% 62%)`]);
    const dark = species === "cow" ? pick(["#2b2b2b", "#6d4c41"]) : "rgba(0,0,0,.28)";
    const belly = "#fff7ea", ink = "#222";
    const happy = mood === "happy", panic = mood === "panic";
    const earTilt = happy ? 0 : 28;
    const ears = {
      dog: `<ellipse cx="56" cy="78" rx="15" ry="32" fill="${species === "dog" ? dark : coat}" transform="rotate(${18 + earTilt} 56 60)"/>
            <ellipse cx="144" cy="78" rx="15" ry="32" fill="${dark}" transform="rotate(${-18 - earTilt} 144 60)"/>`,
      cat: `<path d="M56 74 L64 ${happy ? 22 : 36} L92 52 Z" fill="${coat}"/><path d="M64 64 L67 ${happy ? 36 : 46} L83 55 Z" fill="#ffb3c1"/>
            <path d="M144 74 L136 ${happy ? 22 : 36} L108 52 Z" fill="${coat}"/><path d="M136 64 L133 ${happy ? 36 : 46} L117 55 Z" fill="#ffb3c1"/>`,
      cow: `<path d="M66 48 q-16 -18 -8 -34" stroke="#e8dcc0" stroke-width="9" fill="none" stroke-linecap="round"/>
            <path d="M134 48 q16 -18 8 -34" stroke="#e8dcc0" stroke-width="9" fill="none" stroke-linecap="round"/>
            <ellipse cx="50" cy="${78 + earTilt / 3}" rx="18" ry="9" fill="${coat}" stroke="${dark}" stroke-width="2"/>
            <ellipse cx="150" cy="${78 + earTilt / 3}" rx="18" ry="9" fill="${coat}" stroke="${dark}" stroke-width="2"/>`,
    }[species];
    const spots = species === "cow" ? Array.from({ length: randInt(3, 5) }, () =>
      `<ellipse cx="${randInt(60, 140)}" cy="${randInt(140, 190)}" rx="${randInt(8, 16)}" ry="${randInt(6, 12)}" fill="${dark}"/>`).join("") +
      `<ellipse cx="${pick([78, 122])}" cy="66" rx="13" ry="10" fill="${dark}"/>` : "";
    const eyes = panic
      ? `<g class="fxm-eye"><circle cx="80" cy="80" r="13" fill="#fff" stroke="${ink}" stroke-width="2"/><circle cx="82" cy="82" r="4" fill="${ink}"/></g>
         <g class="fxm-eye"><circle cx="120" cy="80" r="13" fill="#fff" stroke="${ink}" stroke-width="2"/><circle cx="118" cy="82" r="4" fill="${ink}"/></g>`
      : happy && chance(0.5)
      ? `<path d="M70 82 q10 -13 20 0" stroke="${ink}" stroke-width="5" fill="none" stroke-linecap="round"/>
         <path d="M110 82 q10 -13 20 0" stroke="${ink}" stroke-width="5" fill="none" stroke-linecap="round"/>`
      : `<g class="fxm-eye"><circle cx="80" cy="80" r="8" fill="${ink}"/><circle cx="82.5" cy="77" r="2.8" fill="#fff"/></g>
         <g class="fxm-eye"><circle cx="120" cy="80" r="8" fill="${ink}"/><circle cx="122.5" cy="77" r="2.8" fill="#fff"/></g>`;
    // Worried brows: inner ends raised.
    const brows = happy ? "" : `<path d="M68 ${panic ? 62 : 70} L90 ${panic ? 54 : 62}" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>
      <path d="M132 ${panic ? 62 : 70} L110 ${panic ? 54 : 62}" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>`;
    const muzzle = species === "cow"
      ? `<ellipse cx="100" cy="110" rx="32" ry="20" fill="#f6b8c4"/><ellipse cx="88" cy="108" rx="4" ry="5" fill="#a85b6b"/><ellipse cx="112" cy="108" rx="4" ry="5" fill="#a85b6b"/>`
      : species === "dog"
      ? `<ellipse cx="100" cy="104" rx="26" ry="19" fill="${belly}"/><ellipse cx="100" cy="95" rx="8.5" ry="6" fill="#3a2a2a"/>`
      : `<path d="M94 94 L106 94 L100 101 Z" fill="#ff8fa3"/>
         <path d="M60 98 L84 100 M60 108 L84 104 M140 98 L116 100 M140 108 L116 104" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`;
    const my = species === "cow" ? 122 : species === "cat" ? 106 : 112;
    const mouth = panic
      ? `<ellipse cx="100" cy="${my + 4}" rx="10" ry="13" fill="#5a1f1f"/>`
      : happy
      ? `<path d="M84 ${my} q16 20 32 0 Z" fill="#7a2b2b"/><ellipse cx="100" cy="${my + 9}" rx="7" ry="5" fill="#ff8fa3"/>`
      : `<path d="M86 ${my + 8} q14 -12 28 0" stroke="${ink}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    const cheeks = happy ? `<circle cx="64" cy="100" r="8" fill="#ff9fb2" opacity=".6"/><circle cx="136" cy="100" r="8" fill="#ff9fb2" opacity=".6"/>` : "";
    const tears = mood === "sad" ? `<ellipse class="fxm-tear" cx="78" cy="94" rx="3.5" ry="5.5" fill="#6ec6ff"/>
      <ellipse class="fxm-tear" cx="122" cy="94" rx="3.5" ry="5.5" fill="#6ec6ff" style="animation-delay:.45s"/>`
      : panic ? `<path class="fxm-tear" d="M146 54 q7 11 0 15 q-7 -4 0 -15" fill="#8fd3ff"/>` : "";
    const tail = species === "cat"
      ? `<path class="fxm-tail" d="M148 176 q40 -8 34 -60" stroke="${coat}" stroke-width="12" fill="none" stroke-linecap="round"/>`
      : species === "cow"
      ? `<path class="fxm-tail" d="M150 170 q24 -4 22 -36" stroke="${coat}" stroke-width="6" fill="none" stroke-linecap="round"/>`
      : `<path class="fxm-tail" d="M150 172 q30 -8 26 -40" stroke="${coat}" stroke-width="14" fill="none" stroke-linecap="round"/>`;
    const arms = happy
      ? `<path class="fxm-arm l" d="M60 152 q-26 -26 -22 -54" stroke="${coat}" stroke-width="15" fill="none" stroke-linecap="round"/>
         <path class="fxm-arm r" d="M140 152 q26 -26 22 -54" stroke="${coat}" stroke-width="15" fill="none" stroke-linecap="round"/>`
      : panic
      ? `<path class="fxm-arm l" d="M60 150 q-30 -10 -34 -40" stroke="${coat}" stroke-width="15" fill="none" stroke-linecap="round"/>
         <path class="fxm-arm r" d="M140 150 q30 -10 34 -40" stroke="${coat}" stroke-width="15" fill="none" stroke-linecap="round"/>`
      : `<path d="M62 150 q-14 18 -8 34" stroke="${coat}" stroke-width="15" fill="none" stroke-linecap="round"/>
         <path d="M138 150 q14 18 8 34" stroke="${coat}" stroke-width="15" fill="none" stroke-linecap="round"/>`;
    return `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;width:100%;height:100%">
      <g class="fxm-body">
        ${tail}
        <ellipse cx="100" cy="168" rx="52" ry="42" fill="${coat}" stroke="rgba(0,0,0,.15)" stroke-width="2"/>
        <ellipse cx="100" cy="176" rx="30" ry="26" fill="${belly}" opacity="${species === "cow" ? 0 : 1}"/>
        ${spots}
        <ellipse cx="76" cy="208" rx="15" ry="9" fill="${belly}" stroke="rgba(0,0,0,.2)"/>
        <ellipse cx="124" cy="208" rx="15" ry="9" fill="${belly}" stroke="rgba(0,0,0,.2)"/>
        ${arms}
        <g class="fxm-head">
          ${ears}
          <circle cx="100" cy="86" r="48" fill="${coat}" stroke="rgba(0,0,0,.15)" stroke-width="2"/>
          ${species === "cow" ? `<ellipse cx="${pick([78, 122])}" cy="66" rx="13" ry="10" fill="${dark}"/>` : ""}
          ${cheeks}${brows}${eyes}${muzzle}${mouth}${tears}
        </g>
      </g></svg>`;
  }

  function mascot(mood) {
    if (!mascotCss) { const st = document.createElement("style"); st.textContent = MASCOT_CSS; document.head.append(st); mascotCss = true; }
    const species = pick(["dog", "cat", "cow"]);
    const size = Math.max(110, Math.min(200, Math.min(W(), H()) * 0.34));
    const box = document.createElement("div");
    box.className = "fxm-" + mood;
    Object.assign(box.style, { position: "absolute", left: "0", top: "0", width: size + "px", height: size * 1.1 + "px" });
    box.innerHTML = mascotSvg(species, mood);
    const bubble = document.createElement("div");
    bubble.textContent = pick(SAYS[mood][species]);
    Object.assign(bubble.style, { position: "absolute", left: "50%", bottom: "100%", transform: "translateX(-50%)",
      background: "#fff", color: "#111", border: "3px solid #111", borderRadius: "16px", padding: "4px 12px",
      font: "800 17px/1.2 system-ui, sans-serif", whiteSpace: "nowrap", boxShadow: "3px 3px 0 #111" });
    box.append(bubble);
    bubble.animate([{ transform: "translateX(-50%) scale(0)" }, { transform: "translateX(-50%) scale(1.15)" },
      { transform: "translateX(-50%) scale(1)" }], { duration: 400, delay: 350, fill: "both", easing: "ease-out" });
    stage().append(box);
    const w = W(), h = H(), left = chance(0.5), x = left ? rand(0.02, 0.2) * w : w - size - rand(0.02, 0.2) * w;
    const y = h - size * 1.1 - rand(10, 50);
    let frames, duration = rand(2600, 3400);
    const route = mood === "panic" ? "flee" : pick(mood === "happy" ? ["peek", "leap", "parachute", "slide"] : ["peek", "slump", "slide"]);
    if (route === "peek") frames = [{ transform: `translate(${x}px, ${h}px)` }, { transform: `translate(${x}px, ${y}px)`, offset: 0.15, easing: "ease-out" },
      { transform: `translate(${x}px, ${y}px)`, offset: 0.85 }, { transform: `translate(${x}px, ${h}px)` }];
    if (route === "leap") { const x0 = left ? -size : w; frames = [{ transform: `translate(${x0}px, ${y}px) rotate(0)` },
      { transform: `translate(${(x0 + x) / 2}px, ${y - h * 0.3}px) rotate(${left ? 200 : -200}deg)`, offset: 0.15 },
      { transform: `translate(${x}px, ${y}px) rotate(${left ? 360 : -360}deg)`, offset: 0.3 },
      { transform: `translate(${x}px, ${y}px) rotate(${left ? 360 : -360}deg)`, offset: 0.85 },
      { transform: `translate(${x}px, ${h}px) rotate(${left ? 360 : -360}deg)` }]; }
    if (route === "parachute") { const b = el("🎈🎈🎈", { fontSize: size * 0.32 + "px", left: "50%", top: "-30%", transform: "translateX(-50%)", position: "absolute" });
      box.append(b); bubble.style.bottom = "130%";
      frames = [{ transform: `translate(${x}px, ${-size * 1.6}px) rotate(-6deg)` }, { transform: `translate(${x + 30}px, ${y * 0.5}px) rotate(6deg)`, offset: 0.35 },
        { transform: `translate(${x}px, ${y}px) rotate(-3deg)`, offset: 0.6 }, { transform: `translate(${x}px, ${y}px)`, offset: 0.85 },
        { transform: `translate(${x}px, ${h}px)` }]; }
    if (route === "slide" || route === "slump") { const x0 = left ? -size * 1.2 : w + 10; frames = [{ transform: `translate(${x0}px, ${y}px)` },
      { transform: `translate(${x}px, ${y}px)`, offset: 0.18, easing: "ease-out" },
      { transform: `translate(${x}px, ${y + (route === "slump" ? 30 : 0)}px) rotate(${route === "slump" ? (left ? 6 : -6) : 0}deg)`, offset: 0.85 },
      { transform: `translate(${x0}px, ${y}px)` }]; }
    if (route === "flee") { const x0 = left ? -size : w + size, x1 = left ? w + size : -size * 1.5; duration = rand(1800, 2400);
      frames = Array.from({ length: 9 }, (_, k) => ({ transform: `translate(${x0 + (x1 - x0) * k / 8}px, ${y - (k % 2 ? 26 : 0)}px) rotate(${k % 2 ? -6 : 6}deg)` })); }
    play(box, frames, { duration, delay: rand(100, 500), easing: route === "flee" ? "linear" : "ease-in-out" });
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


  // ------------------------------------------------- natural disasters
  const FIRE = ["#ff2d00", "#ff7a00", "#ffb300", "#ffe066", "#d62828"];
  function screenShake(ms, power) {
    const m = document.querySelector("main");
    m.animate(Array.from({ length: 14 }, (_, i) => ({ transform: i === 13 ? "none"
      : `translate(${rand(-power, power)}px, ${rand(-power, power)}px) rotate(${rand(-power / 8, power / 8)}deg)` })),
      { duration: ms, easing: "linear" });
  }
  function tint(color, ms, peak) {
    const e = el("", { inset: "0", width: "100%", height: "100%", background: color });
    play(e, [{ opacity: 0 }, { opacity: peak }, { opacity: 0 }], { duration: ms });
  }
  const DISASTER_MAIN = {
    tornado(c) {
      const s = rand(180, 260), w = W(), h = H(), dir = chance(0.5) ? 1 : -1, top = h - s - rand(20, 120);
      const x0 = dir > 0 ? -s : w, x1 = dir > 0 ? w + s : -s * 2, dur = rand(2600, 3400);
      const px = k => x0 + (x1 - x0) * k / 12, py = k => top + Math.sin(k * 1.3) * 30;
      const t = art("tornado", s);
      play(t, Array.from({ length: 13 }, (_, k) => ({ transform: `translate(${px(k)}px, ${py(k)}px) rotate(${Math.sin(k) * 8}deg)` })), { duration: dur, easing: "linear" });
      const junk = ["🐄", "🌳", "🏠", "🚗", "📚", "🐔", "🪑", "🐖", "🧳", "🩺", "🐑", "💉"];
      for (let i = 0, n = randInt(5, 9); i < n; i++) {
        const e = el(pick(junk), { fontSize: rand(26, 48) + "px" }), a0 = rand(0, 6.28), r = rand(40, 110), lift = rand(20, s * 0.8);
        play(e, Array.from({ length: 13 }, (_, k) => ({ transform: `translate(${px(k) + s / 2 + Math.cos(a0 + k * 1.1) * r}px, ${py(k) + s - lift - k * 6 + Math.sin(a0 + k * 1.1) * 20}px) rotate(${k * 70}deg)` })),
          { duration: dur, easing: "linear" });
      }
      wobble(c, "shake");
      tint("rgba(60,70,90,.35)", dur, 1);
    },
    earthquake(c) {
      screenShake(1500, 16);
      tint("rgba(120,80,40,.25)", 1500, 1);
      for (let i = 0, n = randInt(10, 18); i < n; i++) {
        const e = el(pick(["🪨", "🪨", "🧱", "🏚️", "📚"]), { fontSize: rand(24, 46) + "px" }), x = rand(0, W());
        play(e, [{ transform: `translate(${x}px, -60px) rotate(0)` }, { transform: `translate(${x + rand(-40, 40)}px, ${H() + 60}px) rotate(${rand(-360, 360)}deg)` }],
          { duration: rand(900, 1600), delay: rand(100, 900), easing: "ease-in" });
      }
      const g = art("earth", rand(110, 150)), x = (W() - 130) / 2;
      play(g, [{ transform: `translate(${x}px, ${H()}px)` }, { transform: `translate(${x}px, ${H() - 160}px) rotate(-15deg)`, offset: 0.25 },
        { transform: `translate(${x}px, ${H() - 160}px) rotate(15deg)`, offset: 0.5 }, { transform: `translate(${x}px, ${H() - 160}px) rotate(-15deg)`, offset: 0.75 },
        { transform: `translate(${x}px, ${H()}px)` }], { duration: 2200 });
    },
    volcano(c) {
      const s = rand(190, 250), x = (W() - s) / 2 + rand(-60, 60), y = H() - s * 0.9;
      const v = art("volcano", s);
      play(v, [{ transform: `translate(${x}px, ${H()}px)` }, { transform: `translate(${x}px, ${y}px)`, offset: 0.15, easing: "ease-out" },
        { transform: `translate(${x}px, ${y}px)`, offset: 0.88 }, { transform: `translate(${x}px, ${H()}px)` }], { duration: 3200 });
      const origin = { x: (x + s / 2) / W(), y: (y + s * 0.2) / H() };
      [450, 800, 1200, 1600].forEach(d => setTimeout(() => boom({ particleCount: randInt(50, 90), angle: 90, spread: rand(35, 60),
        startVelocity: rand(45, 70), colors: FIRE, origin, gravity: 1.1, ticks: 160, scalar: rand(0.9, 1.4) }), d));
      for (let i = 0; i < 10; i++) {
        const e = el(pick(["🔥", "🔥", "🪨", "💨"]), { fontSize: rand(24, 44) + "px" }), x0 = x + s / 2;
        play(e, [{ transform: `translate(${x0}px, ${y}px)`, opacity: 1 }, { transform: `translate(${x0 + rand(-200, 200)}px, ${y - rand(200, H() * 0.6)}px) rotate(${rand(-300, 300)}deg)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${x0 + rand(-300, 300)}px, ${H() + 50}px)`, opacity: 0.6 }], { duration: rand(1600, 2400), delay: 500 + rand(0, 900), easing: "ease-out" });
      }
      tint("rgba(255,90,0,.28)", 2600, 1);
      screenShake(800, 6);
    },
    inferno(c) {
      const n = Math.ceil(W() / 90) + 1;
      for (let i = 0; i < n; i++) {
        const s = rand(90, 150), e = art("fire", s), x = i * (W() / (n - 1)) - s / 2, y = H() - s * 0.85;
        play(e, [{ transform: `translate(${x}px, ${H()}px) scale(.6)` }, { transform: `translate(${x}px, ${y}px) scale(1.1)`, offset: 0.2 },
          { transform: `translate(${x}px, ${y + 10}px) scale(.95)`, offset: 0.5 }, { transform: `translate(${x}px, ${y - 10}px) scale(1.15)`, offset: 0.8 },
          { transform: `translate(${x}px, ${H()}px) scale(.6)` }], { duration: rand(2600, 3200), delay: rand(0, 300) });
      }
      tint("radial-gradient(circle at 50% 100%, rgba(255,120,0,.55), rgba(255,0,0,.15) 60%, transparent)", 2800, 1);
      if (c) c.animate([{ filter: "none" }, { filter: "sepia(.8) saturate(2.5) hue-rotate(-20deg)" }, { filter: "none" }], { duration: 2000 });
      if (chance(0.6)) { const h = art("hot", 120), x = rand(0.2, 0.7) * W();
        play(h, [{ transform: `translate(${x}px, ${H() * 0.25}px) scale(0)` }, { transform: `translate(${x}px, ${H() * 0.25}px) scale(1.2)`, offset: 0.3 },
          { transform: `translate(${x}px, ${H() * 0.25}px) scale(1)`, offset: 0.8 }, { transform: `translate(${x}px, ${H() * 0.25}px) scale(0)` }], { duration: 2200 }); }
    },
    kaboom(c) {
      const o = center(c), cx = o.x * W(), cy = o.y * H(), b = art("bomb", 110);
      play(b, [{ transform: `translate(${cx - 55}px, -140px) rotate(0)` }, { transform: `translate(${cx - 55}px, ${cy - 55}px) rotate(${rand(-120, 120)}deg)`, easing: "ease-in" }],
        { duration: 600 });
      setTimeout(() => {
        const s = Math.min(W(), H()) * 0.6, x = cx - s / 2, y = cy - s / 2, e = art("boom", s);
        play(e, [{ transform: `translate(${x}px, ${y}px) scale(0)` }, { transform: `translate(${x}px, ${y}px) scale(1.3)`, offset: 0.25 },
          { transform: `translate(${x}px, ${y}px) scale(1)`, offset: 0.6 }, { transform: `translate(${x}px, ${y}px) scale(1.8)`, opacity: 0 }], { duration: 1400, easing: "ease-out" });
        boom({ particleCount: randInt(140, 220), spread: 360, startVelocity: rand(45, 65), colors: [...FIRE, "#222", "#555"], origin: o, ticks: 120, scalar: rand(1, 1.5) });
        tint("#fff", 350, 0.9);
        screenShake(700, 14);
        for (let i = 0; i < 12; i++) { const d = el(pick(["💥", "🔥", "💨", "🪨", "⭐"]), { fontSize: rand(24, 44) + "px" }), a = rand(0, 6.28), r = rand(150, 400);
          play(d, [{ transform: `translate(${cx}px, ${cy}px)` }, { transform: `translate(${cx + Math.cos(a) * r}px, ${cy + Math.sin(a) * r}px) rotate(${rand(-360, 360)}deg)`, opacity: 0 }],
            { duration: rand(700, 1200), easing: "ease-out" }); }
      }, 600);
    },
    meteors() {
      for (let i = 0, n = randInt(5, 9); i < n; i++) {
        const s = rand(60, 120), e = art("comet", s), x0 = rand(0.3, 1.2) * W(), x1 = x0 - rand(0.5, 0.9) * W(), y1 = rand(0.5, 0.95) * H();
        const d = rand(700, 1200), delay = i * rand(150, 300);
        play(e, [{ transform: `translate(${x0}px, ${-s}px)` }, { transform: `translate(${x1}px, ${y1}px)` }], { duration: d, delay, easing: "ease-in" });
        setTimeout(() => boom({ particleCount: 40, spread: 360, startVelocity: 25, colors: FIRE, ticks: 60,
          origin: { x: Math.max(0, (x1 + s / 2) / W()), y: (y1 + s / 2) / H() } }), d + delay);
      }
      setTimeout(() => screenShake(900, 8), 900);
    },
    lightning(c) {
      const s = rand(150, 210), x = (W() - s) / 2 + rand(-80, 80), cl = art("storm", s);
      play(cl, [{ transform: `translate(${x}px, ${-s}px)` }, { transform: `translate(${x}px, 10px)`, offset: 0.2 },
        { transform: `translate(${x + 30}px, 10px)`, offset: 0.85 }, { transform: `translate(${x}px, ${-s}px)` }], { duration: 3000 });
      const r = c ? c.getBoundingClientRect() : { top: H() / 2, left: W() / 2, width: 0 };
      [600, 1100, 1700].slice(0, randInt(2, 3)).forEach(d => setTimeout(() => {
        tint("#fff", 220, 0.85);
        const bs = rand(110, 170), bolt = art("bolt", bs), bx = r.left + r.width * rand(0.2, 0.8) - bs / 2, by = Math.max(60, r.top - bs * 0.6);
        play(bolt, [{ transform: `translate(${bx}px, ${by}px) scale(1.3)`, opacity: 1 }, { transform: `translate(${bx}px, ${by}px) scale(1)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${bx}px, ${by}px) scale(1)`, opacity: 0 }], { duration: 450 });
        wobble(c, "shake");
      }, d));
      if (c) c.animate([{ filter: "none" }, { filter: "grayscale(1) contrast(1.3)" }, { filter: "none" }], { duration: 2200 });
      tint("rgba(20,25,50,.45)", 2600, 1);
    },
    tsunami() {
      const n = Math.ceil(W() / 110) + 3, base = H() * rand(0.55, 0.7), dur = rand(2200, 2800);
      for (let i = 0; i < n; i++) {
        const s = rand(120, 170), e = art("wave", s), off = i * 100;
        play(e, Array.from({ length: 7 }, (_, k) => ({ transform: `translate(${-s * 2 - off + (W() + s * 3) * k / 6}px, ${base + Math.sin(k + i) * 25}px)` })),
          { duration: dur, easing: "linear" });
      }
      for (let i = 0; i < 8; i++) { const f = el(pick(["🐟", "🐠", "🐙", "🦀", "🐬", "🦭", "🐡", "🛟"]), { fontSize: rand(26, 44) + "px" }), x = rand(0, W());
        play(f, [{ transform: `translate(${x}px, ${base + 40}px)` }, { transform: `translate(${x + rand(-60, 60)}px, ${base - rand(100, 220)}px) rotate(${rand(-180, 180)}deg)`, offset: 0.5, easing: "ease-out" },
          { transform: `translate(${x + rand(-100, 100)}px, ${base + 60}px) rotate(${rand(-360, 360)}deg)`, easing: "ease-in" }], { duration: rand(900, 1400), delay: rand(300, 1500) }); }
      tint("linear-gradient(to top, rgba(0,110,255,.4), transparent 70%)", dur, 1);
    },
    blizzard(c) {
      const end = Date.now() + 1800;
      (function frame() {
        boom({ particleCount: 8, startVelocity: 0, ticks: 260, gravity: 0.5, drift: rand(-2, 2), origin: { x: Math.random(), y: -0.05 },
          colors: ["#ffffff", "#e0f2fe", "#bae6fd"], shapes: ["circle"], scalar: rand(0.8, 1.6) });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
      for (let i = 0; i < 5; i++) { const sz = rand(50, 90), e = art("snow", sz), x = rand(0, W());
        play(e, [{ transform: `translate(${x}px, ${-sz}px) rotate(0)` }, { transform: `translate(${x + rand(-120, 120)}px, ${H()}px) rotate(${rand(-360, 360)}deg)` }],
          { duration: rand(2000, 3000), delay: rand(0, 800), easing: "linear" }); }
      if (c) c.animate([{ filter: "none" }, { filter: "brightness(1.15) saturate(.4) hue-rotate(180deg) blur(1px)" }, { filter: "none" }], { duration: 2400 });
      tint("rgba(180,220,255,.35)", 2600, 1);
      if (chance(0.6)) { const f = art("cold", 120), x = rand(0.1, 0.7) * W();
        play(f, [{ transform: `translate(${x}px, ${H()}px)` }, { transform: `translate(${x}px, ${H() - 150}px)`, offset: 0.25 },
          { transform: `translate(${x + 6}px, ${H() - 150}px)`, offset: 0.8 }, { transform: `translate(${x}px, ${H()}px)` }], { duration: 2400 }); }
    },
  };

  // ------------------------------------------------------------- the show
  function show(good, card) {
    if (reduced()) {  // motion-sensitive setting: just the words, no flying things
      const e = el(pick(good ? YAY : NAY), { left: "50%", top: "30%", fontSize: "40px", fontWeight: "800" });
      e.style.transform = "translate(-50%, -50%)";
      return play(e, [{ opacity: 0 }, { opacity: 1 }, { opacity: 1 }, { opacity: 0 }], { duration: 1600 });
    }
    const colors = good ? palette() : ["#64748b", "#94a3b8", "#475569", "#a3a3a3", "#7c8aa5"];
    // About half of wrong answers are a natural disaster instead of a mope.
    const disaster = !good && chance(0.5);
    const main = good ? HAPPY_MAIN : disaster ? DISASTER_MAIN : SAD_MAIN, extras = good ? HAPPY_EXTRA : SAD_EXTRA;
    const acts = shuffle(Object.keys(main)).slice(0, good ? randInt(1, 2) : 1);
    acts.forEach(k => main[k](card, colors));
    shuffle(extras).slice(0, disaster ? randInt(0, 1) : randInt(1, good ? 3 : 2)).forEach(f => f(card, colors));
    if (chance(0.55)) mascot(good ? "happy" : disaster ? "panic" : "sad");
    if (!good) warm("disaster", 1);
    if (chance(0.85)) phrase(pick(good ? YAY : disaster && chance(0.7) ? DOOM : NAY),
      good ? colors : disaster ? FIRE : ["#cbd5e1", "#93c5fd", "#a5b4fc", "#e2e8f0"], good || disaster ? "happy" : "sad");
  }

  window.FX = {
    correct: card => show(true, card),
    wrong: card => show(false, card),
    // Have a few GIFs ready before the first answer.
    // Run one named act, e.g. FX.demo("tornado") or FX.demo("mascot:panic"), for trying them out.
    demo: (name, card = document.querySelector(".card")) => {
      if (name.startsWith("mascot:")) return mascot(name.slice(7));
      const act = HAPPY_MAIN[name] || SAD_MAIN[name] || DISASTER_MAIN[name];
      if (act) act(card, palette());
      return Object.keys({ ...HAPPY_MAIN, ...SAD_MAIN, ...DISASTER_MAIN });
    },
    prime: () => { warm("happy", 3); warm("critter", 2); warm("sad", 2); warm("gloomCritter", 1); warm("disaster", 3); },
  };
})();
