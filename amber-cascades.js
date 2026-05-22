/**
 * Amber matrix background — ported from Yeni klasör (8) amber-cascades.tsx
 */
function initAmberCascades(canvas) {
  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let dpr = 1;
  let animationFrameId = 0;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const FALL_SPEED = 1.0;
  const COLUMN_DENSITY = 0.7;
  const FONT_SIZE = Math.max(14, Math.round(16));
  const WAVE_RESOLUTION = 4;
  const MAX_RIPPLES = 40;
  const BRAND_TEXT = canvas.dataset.brandName || "BlackStoneRockSoft";

  const mathSymbols = "×÷∆ΣΠ√∞≈≠≤≥∫∂αβγθφψω";
  const numbers = "0123456789";
  const allChars = numbers + mathSymbols;
  const randomChar = () => allChars[Math.floor(Math.random() * allChars.length)];
  const nextBrandChar = (ch) => {
    const i = BRAND_TEXT.indexOf(ch);
    return BRAND_TEXT[(i + 1) % BRAND_TEXT.length];
  };

  let columns = [];
  let waterSurface = 0;
  const ripples = [];
  let wavePoints = [];

  function createBrandColumn(index, letterOffset, clickY, stagger = 0) {
    const length = 14 + Math.floor(Math.random() * 10);
    const chars = Array.from({ length: length + 8 }, (_, j) => ({
      char: BRAND_TEXT[(letterOffset + j) % BRAND_TEXT.length],
      cycleTimer: Math.random() * 0.5,
      cycleRate: 0.5 + Math.random() * 0.8,
    }));

    const startY = Math.min(clickY - stagger * FONT_SIZE * 0.6, waterSurface - FONT_SIZE * 2);

    return {
      x: index * FONT_SIZE,
      y: startY,
      speed: 2 + Math.random() * 1.2,
      length,
      chars,
      active: true,
      restartDelay: 0,
      opacity: 0.92 + Math.random() * 0.08,
      hitWater: false,
      isBrand: true,
    };
  }

  function spawnBrandCascade(clickX, clickY) {
    const centerCol = Math.floor(clickX / FONT_SIZE);
    const streamCount = 2 + Math.floor(Math.random() * 2);
    const used = new Set();

    for (let n = 0; n < streamCount; n++) {
      let colIdx = centerCol + Math.floor(Math.random() * 5) - 2;
      colIdx = Math.max(0, Math.min(columns.length - 1, colIdx));

      if (used.has(colIdx)) {
        colIdx = Math.max(0, Math.min(columns.length - 1, centerCol + (n - 1)));
      }
      used.add(colIdx);

      const letterOffset = Math.floor(Math.random() * BRAND_TEXT.length);
      Object.assign(columns[colIdx], createBrandColumn(colIdx, letterOffset, clickY, n));
    }
  }

  function createColumn(index, scatter) {
    const length = 12 + Math.floor(Math.random() * 20);
    const chars = Array.from({ length: length + 5 }, () => ({
      char: randomChar(),
      cycleTimer: Math.random() * 3,
      cycleRate: 0.5 + Math.random() * 2,
    }));

    let y;
    if (scatter) {
      if (Math.random() < COLUMN_DENSITY) {
        y = Math.random() * (waterSurface + length * FONT_SIZE) - length * FONT_SIZE * 0.3;
      } else {
        y = -length * FONT_SIZE - Math.random() * height * 0.5;
      }
    } else {
      y = -length * FONT_SIZE * Math.random() * 0.3;
    }

    return {
      x: index * FONT_SIZE,
      y,
      speed: 1.2 + Math.random() * 2.5,
      length,
      chars,
      active: scatter ? Math.random() < COLUMN_DENSITY + 0.2 : Math.random() < COLUMN_DENSITY,
      restartDelay: 0,
      opacity: 0.6 + Math.random() * 0.4,
      hitWater: false,
      isBrand: false,
    };
  }

  function initSystems() {
    waterSurface = height * 0.78;
    const colCount = Math.floor(width / FONT_SIZE);
    columns = Array.from({ length: colCount }, (_, i) => createColumn(i, true));
    const waveCount = Math.ceil(width / WAVE_RESOLUTION) + 1;
    wavePoints = Array.from({ length: waveCount }, () => ({ y: 0, vy: 0 }));
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initSystems();
  }

  function spawnRipple(x, y) {
    if (ripples.length >= MAX_RIPPLES) ripples.shift();
    ripples.push({
      x,
      y,
      radius: 0,
      maxRadius: 30 + Math.random() * 50,
      speed: 20 + Math.random() * 30,
      life: 1.0,
      decay: 0.3 + Math.random() * 0.2,
    });
  }

  function disturbWave(x, force) {
    const idx = Math.floor(x / WAVE_RESOLUTION);
    const spread = 3;
    for (let i = -spread; i <= spread; i++) {
      const wi = idx + i;
      if (wi >= 0 && wi < wavePoints.length) {
        wavePoints[wi].vy += force * (1 - Math.abs(i) / (spread + 1));
      }
    }
  }

  let lastTime = 0;

  function render(timestamp) {
    const dt = Math.min((timestamp - (lastTime || timestamp)) / 1000, 0.05);
    lastTime = timestamp;
    const time = timestamp / 1000;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, width, height);

    if (!prefersReduced) {
      for (const col of columns) {
        if (!col.active) {
          col.restartDelay -= dt;
          if (col.restartDelay <= 0) {
            if (Math.random() < COLUMN_DENSITY) {
              Object.assign(col, createColumn(Math.floor(col.x / FONT_SIZE), false), { active: true });
            } else {
              col.restartDelay = 0.3 + Math.random() * 1.5;
            }
          }
          continue;
        }

        const prevY = col.y;
        col.y += col.speed * FALL_SPEED * dt * 60;

        for (const c of col.chars) {
          c.cycleTimer -= dt;
          if (c.cycleTimer <= 0) {
            c.char = col.isBrand ? nextBrandChar(c.char) : randomChar();
            c.cycleTimer = c.cycleRate;
          }
        }

        if (!col.hitWater && col.y >= waterSurface && prevY < waterSurface) {
          col.hitWater = true;
          spawnRipple(col.x + FONT_SIZE * 0.5, waterSurface);
          disturbWave(col.x + FONT_SIZE * 0.5, -2 - Math.random() * 3);
        }

        if (col.y - col.length * FONT_SIZE > waterSurface + 30) {
          col.active = false;
          col.restartDelay = 0.2 + Math.random() * 2;
        }
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed * dt;
        r.life -= r.decay * dt;
        if (r.life <= 0 || r.radius > r.maxRadius) {
          ripples.splice(i, 1);
        }
      }

      for (const p of wavePoints) {
        p.vy += -0.03 * p.y;
        p.vy *= 0.97;
        p.y += p.vy;
      }

      for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < wavePoints.length; i++) {
          if (i > 0) wavePoints[i].vy += 0.25 * (wavePoints[i - 1].y - wavePoints[i].y);
          if (i < wavePoints.length - 1) wavePoints[i].vy += 0.25 * (wavePoints[i + 1].y - wavePoints[i].y);
        }
      }
    }

    ctx.font = `${FONT_SIZE}px "Fira Code", "SF Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    for (const col of columns) {
      if (!col.active) continue;
      for (let j = 0; j < col.length; j++) {
        const charY = col.y - j * FONT_SIZE;
        if (charY > waterSurface || charY < -FONT_SIZE) continue;

        let brightness;
        if (j === 0) brightness = 1.0;
        else if (j === 1) brightness = 0.9;
        else if (j < 4) brightness = 0.75 - (j - 2) * 0.08;
        else brightness = Math.max(0, 0.6 * (1 - j / col.length));

        const distToWater = waterSurface - charY;
        if (distToWater < FONT_SIZE * 3) brightness *= Math.max(0, distToWater / (FONT_SIZE * 3));
        brightness *= col.opacity;
        if (brightness < 0.02) continue;

        let r;
        let g;
        let b;
        if (col.isBrand) {
          if (j === 0) {
            r = 255;
            g = 252;
            b = 245;
          } else if (j < 3) {
            r = 255;
            g = 235;
            b = 190;
          } else {
            r = 232;
            g = 196;
            b = 150;
          }
          brightness = Math.min(1, brightness * 1.15);
        } else if (j === 0) {
          r = 255;
          g = 245;
          b = 220;
        } else if (j < 3) {
          r = 240;
          g = 200;
          b = 140;
        } else {
          r = 200;
          g = 149;
          b = 108;
        }

        ctx.fillStyle = `rgba(${r},${g},${b},${brightness})`;
        if (j === 0) {
          ctx.shadowColor = "rgba(255, 220, 160, 0.6)";
          ctx.shadowBlur = 8;
        }
        ctx.fillText(col.chars[j % col.chars.length].char, col.x + FONT_SIZE * 0.5, charY);
        if (j === 0) ctx.shadowBlur = 0;
      }
    }

    const waterGrad = ctx.createLinearGradient(0, waterSurface, 0, height);
    waterGrad.addColorStop(0, "rgba(15, 13, 11, 0.6)");
    waterGrad.addColorStop(1, "rgba(10, 10, 10, 0.95)");
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, waterSurface - 2, width, height - waterSurface + 2);

    ctx.beginPath();
    for (let x = 0; x <= width; x += WAVE_RESOLUTION) {
      const idx = Math.floor(x / WAVE_RESOLUTION);
      const waveY = idx < wavePoints.length ? wavePoints[idx].y : 0;
      const ambient = Math.sin(x * 0.01 + time * 0.8) * 1.5 + Math.sin(x * 0.023 + time * 0.5);
      const py = waterSurface + waveY + ambient;
      if (x === 0) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }
    ctx.strokeStyle = "rgba(200, 170, 130, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    for (const r of ripples) {
      const alpha = r.life * 0.3;
      for (let ring = 0; ring < 3; ring++) {
        const ringRadius = r.radius - ring * 8;
        if (ringRadius <= 0) continue;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y + ring * 2, ringRadius, ringRadius * 0.3, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200, 170, 130, ${alpha * (1 - ring * 0.3)})`;
        ctx.lineWidth = 1 - ring * 0.2;
        ctx.stroke();
      }
    }

    animationFrameId = requestAnimationFrame(render);
  }

  function handleInteractAt(x, y) {
    disturbWave(x, -4 - Math.random() * 3);
    spawnRipple(x, waterSurface);
    spawnBrandCascade(x, y);
  }

  function handleClick(e) {
    handleInteractAt(e.clientX, e.clientY);
  }

  const TAP_THRESHOLD_PX = 14;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchActive = false;

  function handleTouchStart(e) {
    if (e.touches.length !== 1) return;
    touchActive = true;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  function handleTouchEnd(e) {
    if (!touchActive) return;
    touchActive = false;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    if (dx * dx + dy * dy <= TAP_THRESHOLD_PX * TAP_THRESHOLD_PX) {
      handleInteractAt(t.clientX, t.clientY);
    }
  }

  window.addEventListener("resize", resize);
  canvas.addEventListener("click", handleClick);
  canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
  canvas.addEventListener("touchend", handleTouchEnd, { passive: true });
  canvas.addEventListener("touchcancel", () => {
    touchActive = false;
  });
  resize();
  animationFrameId = requestAnimationFrame(render);

  window.BrandCascade = { trigger: handleInteractAt };

  return () => {
    delete window.BrandCascade;
    window.removeEventListener("resize", resize);
    canvas.removeEventListener("click", handleClick);
    canvas.removeEventListener("touchstart", handleTouchStart);
    canvas.removeEventListener("touchend", handleTouchEnd);
    cancelAnimationFrame(animationFrameId);
  };
}

function initPageCascadeClicks(trigger) {
  const page = document.querySelector(".page");
  if (!page) return;

  const skipTarget = (el) => el.closest("a");
  const isCanvas = (el) => el.id === "amber-bg" || el.closest("#amber-bg");

  page.addEventListener("click", (e) => {
    if (isCanvas(e.target)) return;
    if (skipTarget(e.target)) return;
    trigger(e.clientX, e.clientY);
  });

  let touchStartX = 0;
  let touchStartY = 0;
  let touchActive = false;

  page.addEventListener(
    "touchstart",
    (e) => {
      if (isCanvas(e.target) || skipTarget(e.target)) return;
      if (e.touches.length !== 1) return;
      touchActive = true;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    },
    { passive: true }
  );

  page.addEventListener(
    "touchend",
    (e) => {
      if (!touchActive || isCanvas(e.target) || skipTarget(e.target)) return;
      touchActive = false;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      if (dx * dx + dy * dy <= 14 * 14) {
        trigger(t.clientX, t.clientY);
      }
    },
    { passive: true }
  );

  page.addEventListener("touchcancel", () => {
    touchActive = false;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("amber-bg");
  if (!canvas) return;
  initAmberCascades(canvas);
  if (window.BrandCascade) {
    initPageCascadeClicks(window.BrandCascade.trigger);
  }
});
