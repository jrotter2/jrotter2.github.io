(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel) => document.querySelector(sel);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (s) => s[Math.floor(Math.random() * s.length)];

  /* =========================================================
   * Starfield background
   * ========================================================= */
  const Stars = (() => {
    const canvas = $("#stars");
    const ctx = canvas.getContext("2d");
    let stars = [], w = 0, h = 0, dpr = 1, shooting = null, nextShoot = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round((w * h) / 3800);
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() < 0.08 ? rand(1, 1.6) : rand(0.3, 0.9),
        a: rand(0.25, 0.9),
        tw: rand(0.5, 2.5),
        ph: rand(0, Math.PI * 2),
        depth: rand(0.02, 0.25),
        teal: Math.random() < 0.08,
      }));
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      const sy = window.scrollY;
      for (const s of stars) {
        const tw = reducedMotion ? 1 : 0.65 + 0.35 * Math.sin(t * 0.001 * s.tw + s.ph);
        let y = (s.y - sy * s.depth) % h;
        if (y < 0) y += h;
        ctx.globalAlpha = s.a * tw;
        ctx.fillStyle = s.teal ? "#4fd1c5" : "#e6edf3";
        ctx.beginPath();
        ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reducedMotion) {
        if (!shooting && t > nextShoot) {
          shooting = { x: rand(w * 0.2, w), y: rand(0, h * 0.4), vx: -rand(6, 10), vy: rand(2, 4), life: 1 };
        }
        if (shooting) {
          const s = shooting;
          const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 12, s.y - s.vy * 12);
          grad.addColorStop(0, "rgba(230,237,243,0.9)");
          grad.addColorStop(1, "rgba(230,237,243,0)");
          ctx.globalAlpha = s.life;
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - s.vx * 12, s.y - s.vy * 12);
          ctx.stroke();
          s.x += s.vx; s.y += s.vy; s.life -= 0.012;
          if (s.life <= 0 || s.x < -200 || s.y > h + 200) {
            shooting = null;
            nextShoot = t + rand(5000, 11000);
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    function loop(t) {
      draw(t);
      requestAnimationFrame(loop);
    }

    function start() {
      resize();
      nextShoot = performance.now() + 2500;
      window.addEventListener("resize", resize);
      if (reducedMotion) {
        draw(0);
        window.addEventListener("scroll", () => draw(0), { passive: true });
      } else {
        requestAnimationFrame(loop);
      }
    }

    return { start };
  })();

  /* =========================================================
   * ASCII orbit: planet + moon + satellite, ray-cast per cell
   * ========================================================= */
  const Orbit = (() => {
    const el = $("#orbit");
    const W = 80, H = 30;
    const A = 0.6;                 // cell width / cell height for the mono font
    const R = 10.5;                // planet radius in rows
    const cx = W / 2, cy = H / 2;
    const L = norm([-0.6, -0.45, 0.66]);
    const TILT = 0.38;

    const SEA = " .,:;-=+";
    const LAND = ".:-=+*#%@";
    const MOON = ".:;=+*#%";

    const chars = new Array(W * H);
    const cls = new Array(W * H);
    const zbuf = new Float32Array(W * H);

    const bgStars = Array.from({ length: 46 }, () => ({
      i: Math.floor(Math.random() * W),
      j: Math.floor(Math.random() * H),
      c: pick(".....+*"),
      ph: Math.random() * 10,
    }));

    let visible = true, last = 0, t0 = performance.now();

    function norm(v) {
      const m = Math.hypot(v[0], v[1], v[2]);
      return [v[0] / m, v[1] / m, v[2] / m];
    }

    // Scene-space (planet radii) -> screen cells
    const toCol = (x) => cx + (x * R) / A;
    const toRow = (y) => cy + y * R;

    function put(i, j, ch, c, z) {
      if (i < 0 || j < 0 || i >= W || j >= H) return;
      const k = j * W + i;
      if (z < zbuf[k]) return;
      zbuf[k] = z;
      chars[k] = ch;
      cls[k] = c;
    }

    function terrain(lon, lat) {
      return Math.sin(lon * 2 + 1.3) * Math.cos(lat * 3) +
        0.6 * Math.sin(lon * 5 + lat * 4 + 0.7) +
        0.35 * Math.sin(lon * 9 - lat * 7) +
        0.25 * Math.cos(lat * 11 + lon * 3);
    }

    // Point on a tilted circular orbit, in planet radii
    function orbitPoint(radius, a, inc, phi) {
      const x0 = radius * Math.cos(a);
      const z0 = radius * Math.sin(a);
      const y = -z0 * Math.sin(inc);
      const z = z0 * Math.cos(inc);
      return [x0 * Math.cos(phi) - y * Math.sin(phi), x0 * Math.sin(phi) + y * Math.cos(phi), z];
    }

    function drawStars(t) {
      for (const s of bgStars) {
        const on = Math.sin(t * 0.8 + s.ph) > -0.6;
        if (on) put(s.i, s.j, s.c, "o-star", -1e9);
      }
    }

    function drawPlanet(t) {
      const spin = t * 0.22;
      const cT = Math.cos(TILT), sT = Math.sin(TILT);
      for (let j = 0; j < H; j++) {
        const Y = (j + 0.5 - cy) / R;
        for (let i = 0; i < W; i++) {
          const X = ((i + 0.5 - cx) * A) / R;
          const r2 = X * X + Y * Y;
          if (r2 > 1) {
            // thin atmosphere halo on the day side
            if (r2 < 1.16) {
              const r = Math.sqrt(r2);
              const lit = (X / r) * L[0] + (Y / r) * L[1];
              if (lit > 0.15) put(i, j, r2 < 1.07 ? ":" : ".", "o-atm", -0.01);
            }
            continue;
          }
          const Z = Math.sqrt(1 - r2);
          const Xt = X * cT + Y * sT;
          const Yt = -X * sT + Y * cT;
          const lon = Math.atan2(Xt, Z) + spin;
          const lat = Math.asin(Math.max(-1, Math.min(1, Yt)));
          const b = X * L[0] + Y * L[1] + Z * L[2];
          const land = terrain(lon, lat) > 0.35;
          const ice = Math.abs(lat) > 1.18;

          let ch, c;
          if (b <= 0.04) {
            // night side: sparse amber city lights on land
            const q = Math.sin(Math.floor(lon * 9) * 12.9898 + Math.floor(lat * 9) * 78.233) * 43758.5;
            const city = land && !ice && q - Math.floor(q) > 0.82;
            ch = city ? "." : " ";
            c = city ? "o-sat" : "o-sea";
          } else if (ice) {
            ch = LAND[Math.min(LAND.length - 1, Math.floor(b * LAND.length))];
            c = "o-ice";
          } else if (land) {
            ch = LAND[Math.min(LAND.length - 1, Math.floor(b * LAND.length))];
            c = "o-land";
          } else {
            ch = SEA[Math.min(SEA.length - 1, 1 + Math.floor(b * (SEA.length - 1)))];
            c = "o-sea";
          }
          put(i, j, ch, c, Z);
        }
      }
    }

    function drawMoon(t) {
      const [px, py, pz] = orbitPoint(1.85, t * 0.28 + 2.2, 0.32, -0.22);
      const rm = 0.26;
      const i0 = Math.floor(toCol(px - rm)) - 1, i1 = Math.ceil(toCol(px + rm)) + 1;
      const j0 = Math.floor(toRow(py - rm)) - 1, j1 = Math.ceil(toRow(py + rm)) + 1;
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          const mx = (((i + 0.5 - cx) * A) / R - px) / rm;
          const my = ((j + 0.5 - cy) / R - py) / rm;
          const r2 = mx * mx + my * my;
          if (r2 > 1) continue;
          const mz = Math.sqrt(1 - r2);
          let b = mx * L[0] + my * L[1] + mz * L[2];
          // a couple of craters
          const crater = Math.hypot(mx - 0.25, my + 0.2) < 0.22 || Math.hypot(mx + 0.35, my - 0.3) < 0.16;
          if (crater) b *= 0.55;
          if (b <= 0.05) put(i, j, ".", "o-moon-d", pz + mz * rm);
          else put(i, j, MOON[Math.min(MOON.length - 1, Math.floor(b * MOON.length))], "o-moon", pz + mz * rm);
        }
      }
    }

    function drawSatellite(t) {
      const a = -t * 0.85 + 1.0;
      const inc = 1.05, phi = 0.55, rad = 1.32;
      // trail of where it just was
      for (let s = 1; s < 70; s++) {
        const [x, y, z] = orbitPoint(rad, a + s * 0.035, inc, phi);
        const i = Math.round(toCol(x) - 0.5), j = Math.round(toRow(y) - 0.5);
        const k = j * W + i;
        if (i < 0 || j < 0 || i >= W || j >= H) continue;
        if (chars[k] === " " || cls[k] === "o-star" || cls[k] === "o-atm") put(i, j, s < 25 ? "." : "·", "o-trail", z);
        else if (z > zbuf[k]) put(i, j, "·", "o-trail", z);
      }
      const [x, y, z] = orbitPoint(rad, a, inc, phi);
      const i = Math.round(toCol(x) - 0.5), j = Math.round(toRow(y) - 0.5);
      const glyph = "=[#]=";
      for (let g = 0; g < glyph.length; g++) put(i - 2 + g, j, glyph[g], "o-sat", z + 0.05);
    }

    function render(t) {
      chars.fill(" ");
      cls.fill("");
      zbuf.fill(-Infinity);
      drawStars(t);
      drawPlanet(t);
      drawMoon(t);
      drawSatellite(t);

      let html = "";
      for (let j = 0; j < H; j++) {
        let run = "", runCls = null;
        for (let i = 0; i < W; i++) {
          const k = j * W + i;
          const c = chars[k] === " " ? "" : cls[k];
          if (c !== runCls) {
            if (run) html += runCls ? `<span class="${runCls}">${run}</span>` : run;
            run = "";
            runCls = c;
          }
          run += chars[k];
        }
        if (run) html += runCls ? `<span class="${runCls}">${run}</span>` : run;
        html += "\n";
      }
      el.innerHTML = html;
    }

    function fit() {
      const avail = el.parentElement.clientWidth - 16;
      el.style.fontSize = Math.max(5, Math.min(13, avail / (W * A))) + "px";
    }

    function loop(now) {
      if (visible && !document.hidden && now - last > 50) {
        last = now;
        render((now - t0) / 1000);
      }
      requestAnimationFrame(loop);
    }

    function start() {
      fit();
      window.addEventListener("resize", fit);
      document.fonts?.ready.then(fit);
      render(4);
      // Small, slow and contained, so it runs even with reduced motion on.
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(el);
      requestAnimationFrame(loop);
    }

    return { start };
  })();

  /* =========================================================
   * HUD telemetry
   * ========================================================= */
  function startHud() {
    const clock = $("#hud-clock"), alt = $("#hud-alt"), vel = $("#hud-vel");
    const tick = () => {
      const d = new Date();
      clock.textContent = d.toISOString().slice(11, 19);
      alt.textContent = (408 + Math.sin(d.getTime() / 9000) * 3).toFixed(0);
      vel.textContent = (7.66 + Math.sin(d.getTime() / 7000) * 0.01).toFixed(2);
    };
    tick();
    setInterval(tick, 1000);
  }

  /* =========================================================
   * Scrambling text roller (a nod to v1)
   * ========================================================= */
  function startRoller() {
    const el = $("#roller");
    const phrases = [
      "products people actually use",
      "fast, then make them better",
      "with great people",
      "and learn something every time",
      "from first principles",
      "and ship them",
    ];
    const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#*+=";
    let idx = 0;

    function scrambleTo(next) {
      let frame = 0;
      const total = next.length * 2 + 6;
      const timer = setInterval(() => {
        frame++;
        const shown = Math.floor((frame / total) * next.length);
        let out = next.slice(0, shown);
        if (shown < next.length) out += pick(glyphs).toLowerCase();
        el.textContent = out;
        if (frame >= total) {
          clearInterval(timer);
          el.textContent = next;
        }
      }, 28);
    }

    setInterval(() => {
      idx = (idx + 1) % phrases.length;
      scrambleTo(phrases[idx]);
    }, 3400);
  }

  /* =========================================================
   * Launch sequence
   * ========================================================= */
  const Launch = (() => {
    const root = $("#launch");
    const log = $("#launch-log");
    const rocket = $("#launch-rocket");
    let pad = null, timers = [], raf = 0, running = false;

    const BODY = [
      "      /\\      ",
      "     /  \\     ",
      "    /    \\    ",
      "    |    |    ",
      "    | () |    ",
      "    |    |    ",
      "    | JR |    ",
      "    |    |    ",
      "   /|    |\\   ",
      "  / |    | \\  ",
      " /__|____|__\\ ",
      "    /_/\\_\\    ",
    ];

    function flame(rows) {
      const widths = [6, 6, 4, 4, 2, 2, 1].slice(0, rows);
      return widths.map((wd) => {
        const pad = " ".repeat((14 - wd) / 2 | 0);
        let s = "";
        for (let i = 0; i < wd; i++) s += pick("*^'\":;!|");
        return `<span class="flame">${pad}${s}</span>`;
      }).join("\n");
    }

    function rocketHtml(rows) {
      return `<span class="body">${BODY.join("\n")}</span>\n${rows ? flame(rows) : ""}`;
    }

    function smokeHtml(spread) {
      const width = Math.min(70, 14 + spread);
      const lines = [];
      for (let r = 0; r < 3; r++) {
        let s = "";
        const w = width - r * 6;
        for (let i = 0; i < w; i++) s += Math.random() < 0.55 ? pick("()oO0.") : " ";
        lines.push(" ".repeat(Math.max(0, (70 - w) / 2 | 0)) + s);
      }
      return `<span class="smoke">${lines.reverse().join("\n")}</span>\n<span class="dim">${"=".repeat(70)}</span>`;
    }

    function line(html, delay) {
      timers.push(setTimeout(() => { log.innerHTML += html + "\n"; }, delay));
    }

    function finish() {
      if (!running) return;
      running = false;
      timers.forEach(clearTimeout);
      timers = [];
      cancelAnimationFrame(raf);
      root.classList.add("done");
      document.body.classList.remove("launching");
      document.removeEventListener("keydown", finish);
      setTimeout(() => root.classList.remove("show", "done"), 900);
    }

    function play() {
      if (running) return;
      running = true;
      timers.forEach(clearTimeout);
      timers = [];
      log.innerHTML = "";
      root.classList.remove("done");
      root.classList.add("show");
      document.body.classList.add("launching");
      rocket.style.transform = "translate(-50%, 0)";

      if (!pad) {
        pad = document.createElement("pre");
        pad.className = "launch-pad";
        pad.style.zIndex = 2;
        pad.setAttribute("aria-hidden", "true");
        root.appendChild(pad);
      }
      pad.innerHTML = smokeHtml(0);
      const padH = () => pad.getBoundingClientRect().height;
      rocket.style.bottom = padH() + "px";
      rocket.innerHTML = rocketHtml(0);

      const steps = [
        "<span class='dim'>jrotter.sys v2.0</span>",
        "&gt; loading personality ........ <span class='ok'>[ OK ]</span>",
        "&gt; calibrating ascii renderer . <span class='ok'>[ OK ]</span>",
        "&gt; checking coffee levels ..... <span class='ok'>[ OK ]</span>",
        "&gt; go / no-go poll ............ <span class='hl'>GO</span>",
      ];
      steps.forEach((s, n) => line(s, 150 + n * 260));

      const t0 = 150 + steps.length * 260 + 150;
      let flicker = 0;
      timers.push(setTimeout(() => {
        flicker = setInterval(() => { rocket.innerHTML = rocketHtml(2); }, 90);
        timers.push(flicker);
      }, t0));
      ["T-3", "T-2", "T-1"].forEach((s, n) => line(`<span class='big'>${s}</span>`, t0 + n * 380));

      const liftoff = t0 + 3 * 380;
      line("<span class='big'>LIFTOFF &#x2197;</span>", liftoff);
      timers.push(setTimeout(() => {
        clearInterval(flicker);
        const start = performance.now();
        const base = padH();
        const fly = (now) => {
          const s = (now - start) / 1000;
          const y = 120 * s * s + 30 * s;   // gentle then fast
          rocket.style.transform = `translate(-50%, ${-y * 3}px)`;
          rocket.innerHTML = rocketHtml(Math.min(7, 3 + Math.floor(s * 6)));
          pad.innerHTML = smokeHtml(Math.floor(s * 50));
          rocket.style.bottom = base + "px";
          if (s < 1.7 && running) raf = requestAnimationFrame(fly);
          else finish();
        };
        raf = requestAnimationFrame(fly);
      }, liftoff + 120));

      document.addEventListener("keydown", finish);
    }

    function init() {
      $("#launch-skip").addEventListener("click", finish);
      root.addEventListener("click", (e) => { if (e.target === root) finish(); });
      $("#replay").addEventListener("click", play);

      let seen = false;
      try { seen = sessionStorage.getItem("jr-launched") === "1"; } catch (_) {}
      const forced = new URLSearchParams(location.search).has("launch");
      if (forced || (!seen && !reducedMotion)) {
        try { sessionStorage.setItem("jr-launched", "1"); } catch (_) {}
        play();
      }
    }

    return { init, play };
  })();

  /* =========================================================
   * Terminal
   * ========================================================= */
  function startTerminal() {
    const out = $("#term-out");
    const input = $("#term-in");
    const body = $("#term-body");
    const history = [];
    let hIdx = 0;

    const print = (html, cls) => {
      const div = document.createElement("div");
      if (cls) div.className = cls;
      div.innerHTML = html;
      out.appendChild(div);
      body.scrollTop = body.scrollHeight;
    };
    const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

    const files = {
      "mission.txt": "Build the product at Chalk. Ship fast, learn faster.\nThen build something of my own.",
      "skills.txt": "python  c++  javascript  sql  java  php\nml: tensorflow, keras, sklearn, BDTs\ninfra: docker, kubernetes, real-time feature pipelines\nsoft: talking to customers, explaining hard things simply",
      "fun.txt": "ascii art, terminals, rockets, and over-engineering personal websites.\ncurrently learning: whatever I needed yesterday.",
    };

    const commands = {
      help: () => print(
        [
          ["whoami", "who is this guy"],
          ["mission", "what I'm doing now"],
          ["trajectory", "experience, in order"],
          ["payloads", "things I've built"],
          ["papers", "publications"],
          ["ls / cat <file>", "poke around"],
          ["contact", "open a channel"],
          ["launch", "replay the launch"],
          ["ping", "check latency"],
          ["clear", "clear the screen"],
        ].map(([c, d]) => `  <span class="hl">${c.padEnd(16)}</span><span class="muted">${d}</span>`).join("\n")
      ),
      whoami: () => print("John Rotter\nForward Deployed Engineering Manager @ Chalk (New York), an early-stage AI startup. Ph.D. in physics.\nPhysics + software engineering. I build things, ship them, and keep learning."),
      mission: () => print("CURRENT MISSION: building the product at Chalk, an early-stage AI startup.\nRole: forward deployed engineering manager, leading the forward deployed engineers in New York.\nWe write product code, ship it to production, and iterate with the teams who use it."),
      trajectory: () => print(
        "<span class='hl'>2026-now </span>  Forward Deployed Engineering Manager @ Chalk, NY\n" +
        "<span class='hl'>2025-2026</span>  Forward Deployed Engineer @ Chalk\n" +
        "<span class='hl'>2021-2024</span>  Ph.D. Physics @ Rice University\n" +
        "<span class='hl'>2020-2024</span>  Full-Stack Developer @ PureNerd LLC\n" +
        "<span class='hl'>2019-2021</span>  Graduate Researcher @ University of Florida\n" +
        "<span class='hl'>2019     </span>  B.S. Physics + B.S. Math @ Norwich University"
      ),
      payloads: () => print(
        "PL-01  Nanosecond ML on FPGAs     <span class='muted'>&lt;25 ns per decision</span>\n" +
        "PL-02  Commerce Automation        <span class='muted'>full-stack, shipped for 4 yrs</span>\n" +
        "PL-03  Signal vs. Background      <span class='muted'>deep learning</span>\n" +
        "PL-04  Anomaly Detection          <span class='muted'>data quality</span>\n" +
        "PL-05  Measuring the Higgs Width  <span class='muted'>the thesis</span>"
      ),
      papers: () => print(
        "<span class='hl'>2026</span>  Higgs boson total decay width, H&rarr;WW&rarr;e&nu;&mu;&nu;  <span class='muted'>Phys. Rev. D 113, 092014</span>\n" +
        "      <a href='https://doi.org/10.1103/rny9-zby1' target='_blank' rel='noopener'>doi:10.1103/rny9-zby1</a>\n" +
        "<span class='hl'>2017</span>  An X-Ray Study of Two B+B Binaries  <span class='muted'>ApJ 850, 82</span>\n" +
        "<span class='hl'>more</span>  <a href='https://inspirehep.net/authors/1796344' target='_blank' rel='noopener'>inspirehep.net/authors/1796344</a>"
      ),
      ls: () => print(Object.keys(files).map((f) => `<span class="hl">${f}</span>`).join("  ")),
      cat: (args) => {
        const f = args[0];
        if (!f) return print("usage: cat &lt;file&gt;", "muted");
        if (files[f]) return print(esc(files[f]));
        print(`cat: ${esc(f)}: no such file`, "muted");
      },
      contact: () => print(
        "email   <a href='mailto:johnrotter.physics@gmail.com'>johnrotter.physics@gmail.com</a>\n" +
        "github  <a href='https://github.com/jrotter2' target='_blank' rel='noopener'>github.com/jrotter2</a>"
      ),
      launch: () => { print("initiating launch sequence...", "muted"); setTimeout(Launch.play, 300); },
      ping: () => print("pong <span class='muted'>(25 ns, FPGA-grade)</span>"),
      date: () => print(new Date().toUTCString()),
      echo: (args) => print(esc(args.join(" "))),
      clear: () => { out.innerHTML = ""; },
      sudo: () => print("permission denied. but you can <a href='mailto:johnrotter.physics@gmail.com'>email me</a> for access.", "muted"),
      hire: () => print("Excellent decision. Channel open: <a href='mailto:johnrotter.physics@gmail.com'>johnrotter.physics@gmail.com</a>"),
      exit: () => print("there is no escape velocity from this terminal.", "muted"),
    };
    commands.chalk = commands.mission;
    commands.experience = commands.trajectory;
    commands.projects = commands.payloads;
    commands.publications = commands.papers;
    commands.about = commands.whoami;

    function run(raw) {
      const line = raw.trim();
      print(`<span class="prompt">guest@orbit:~$</span> <span class="cmd">${esc(line)}</span>`);
      if (!line) return;
      history.push(line);
      hIdx = history.length;
      const [cmd, ...args] = line.split(/\s+/);
      const fn = commands[cmd.toLowerCase()];
      if (fn) fn(args);
      else print(`command not found: ${esc(cmd)}. try <span class="hl">help</span>`, "muted");
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        run(input.value);
        input.value = "";
      } else if (e.key === "ArrowUp") {
        if (hIdx > 0) input.value = history[--hIdx];
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        hIdx = Math.min(history.length, hIdx + 1);
        input.value = history[hIdx] || "";
        e.preventDefault();
      }
    });
    body.addEventListener("click", () => {
      if (!window.getSelection().toString()) input.focus({ preventScroll: true });
    });

    print("Welcome aboard, guest. Type <span class='hl'>help</span> to list commands.", "muted");
    run("whoami");
  }

  /* =========================================================
   * Reveal on scroll, card glow, misc
   * ========================================================= */
  function startReveal() {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  }

  function startCardGlow() {
    document.querySelectorAll(".project").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });
  }

  $("#year").textContent = new Date().getFullYear();
  Launch.init();
  Stars.start();
  Orbit.start();
  startHud();
  startRoller();
  startTerminal();
  startReveal();
  startCardGlow();
})();
