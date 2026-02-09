/**
 * Canvas-based particle system for visual effects.
 * Supports sparkles, confetti, fire particles, and water droplets.
 */
const Particles = (() => {
  let canvas = null;
  let ctxCanvas = null;
  let particles = [];
  let animFrame = null;
  let running = false;

  function init(canvasEl) {
    canvas = canvasEl;
    ctxCanvas = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    if (!canvas) return;
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctxCanvas.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  function start() {
    if (running) return;
    running = true;
    loop();
  }

  function stop() {
    running = false;
    if (animFrame) cancelAnimationFrame(animFrame);
  }

  function clear() {
    particles = [];
    running = false;
    if (animFrame) cancelAnimationFrame(animFrame);
    animFrame = null;
    if (ctxCanvas && canvas) {
      ctxCanvas.setTransform(1, 0, 0, 1, 0, 0);
      ctxCanvas.clearRect(0, 0, canvas.width, canvas.height);
      ctxCanvas.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }

  function loop() {
    if (!running) return;
    ctxCanvas.setTransform(1, 0, 0, 1, 0, 0);
    ctxCanvas.clearRect(0, 0, canvas.width, canvas.height);
    ctxCanvas.scale(window.devicePixelRatio, window.devicePixelRatio);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= p.decay;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity || 0;
      p.rotation += p.spin || 0;

      ctxCanvas.save();
      ctxCanvas.translate(p.x, p.y);
      ctxCanvas.rotate(p.rotation);
      ctxCanvas.globalAlpha = p.life;
      p.draw(ctxCanvas, p);
      ctxCanvas.restore();
    }

    if (particles.length > 0) {
      animFrame = requestAnimationFrame(loop);
    } else {
      running = false;
    }
  }

  /**
   * Emit sparkle particles at a position.
   */
  function sparkle(x, y, count = 12, color = '#FFD700') {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 1.5 + Math.random() * 3;
      const size = 2 + Math.random() * 4;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.015 + Math.random() * 0.01,
        gravity: 0.05,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2,
        size,
        color,
        draw(ctx, p) {
          // Four-pointed star
          ctx.fillStyle = p.color;
          ctx.beginPath();
          for (let j = 0; j < 4; j++) {
            const a = (Math.PI / 2) * j;
            ctx.lineTo(Math.cos(a) * p.size, Math.sin(a) * p.size);
            ctx.lineTo(Math.cos(a + Math.PI / 4) * p.size * 0.4, Math.sin(a + Math.PI / 4) * p.size * 0.4);
          }
          ctx.closePath();
          ctx.fill();
        },
      });
    }
    start();
  }

  /**
   * Emit confetti rain across the screen.
   */
  function confetti(count = 60) {
    const w = canvas.offsetWidth;
    const colors = ['#ff6b9d', '#c44dff', '#00d4ff', '#ff6b35', '#ff9f1c', '#4ade80', '#FFD700'];
    for (let i = 0; i < count; i++) {
      const size = 4 + Math.random() * 6;
      particles.push({
        x: Math.random() * w,
        y: -10 - Math.random() * 50,
        vx: (Math.random() - 0.5) * 2,
        vy: 1.5 + Math.random() * 3,
        life: 1,
        decay: 0.003 + Math.random() * 0.003,
        gravity: 0.02,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.15,
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        draw(ctx, p) {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        },
      });
    }
    start();
  }

  /**
   * Fire burst particles.
   */
  function fireBurst(x, y, count = 20) {
    const colors = ['#ff4500', '#ff6b35', '#ff9f1c', '#ffd700'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      const size = 3 + Math.random() * 5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1,
        decay: 0.02 + Math.random() * 0.015,
        gravity: -0.03,
        rotation: 0,
        spin: 0,
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        draw(ctx, p) {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life * 0.8;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * p.life, 0, Math.PI * 2);
          ctx.fill();
        },
      });
    }
    start();
  }

  /**
   * Water splash particles.
   */
  function waterSplash(x, y, count = 20) {
    const colors = ['#00d4ff', '#7b68ee', '#00ffff', '#87ceeb'];
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
      const speed = 2 + Math.random() * 4;
      const size = 2 + Math.random() * 4;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.015 + Math.random() * 0.01,
        gravity: 0.1,
        rotation: 0,
        spin: 0,
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        draw(ctx, p) {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * p.life, 0, Math.PI * 2);
          ctx.fill();
        },
      });
    }
    start();
  }

  /**
   * Rainbow explosion (fire + water + sparkles combined).
   */
  function rainbowExplosion(x, y) {
    fireBurst(x, y, 15);
    waterSplash(x, y, 15);
    sparkle(x, y, 20, '#ff69b4');
    setTimeout(() => sparkle(x, y, 15, '#FFD700'), 150);
    setTimeout(() => sparkle(x, y, 10, '#4ade80'), 300);
  }

  return { init, clear, sparkle, confetti, fireBurst, waterSplash, rainbowExplosion };
})();
