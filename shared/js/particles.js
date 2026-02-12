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
   * Fire burst particles — big dramatic explosion with embers and glow.
   */
  function fireBurst(x, y, count = 20) {
    const coreColors = ['#ff4500', '#ff6b35', '#ff9f1c', '#ffd700', '#ffffff'];
    const emberColors = ['#ff4500', '#ff6b35', '#cc3300', '#ff8800'];

    // Central flash
    particles.push({
      x, y, vx: 0, vy: 0, life: 1, decay: 0.04,
      gravity: 0, rotation: 0, spin: 0,
      size: 40 + Math.random() * 20,
      color: '#fff8e0',
      draw(ctx, p) {
        const r = p.size * p.life;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        grad.addColorStop(0, 'rgba(255, 255, 255, ' + p.life + ')');
        grad.addColorStop(0.3, 'rgba(255, 200, 50, ' + (p.life * 0.8) + ')');
        grad.addColorStop(1, 'rgba(255, 69, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
      },
    });

    // Main flame burst — fast, large
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      const size = 4 + Math.random() * 8;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        decay: 0.015 + Math.random() * 0.01,
        gravity: -0.06,
        rotation: 0,
        spin: 0,
        size,
        color: coreColors[Math.floor(Math.random() * coreColors.length)],
        draw(ctx, p) {
          const r = p.size * (0.5 + p.life * 0.5);
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
          grad.addColorStop(0, p.color);
          grad.addColorStop(1, 'rgba(255, 69, 0, 0)');
          ctx.fillStyle = grad;
          ctx.globalAlpha = p.life;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
        },
      });
    }

    // Floating embers — slower, linger longer, drift upward
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2;
      const size = 1.5 + Math.random() * 3;
      particles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed,
        vy: -0.5 - Math.random() * 2,
        life: 1,
        decay: 0.008 + Math.random() * 0.006,
        gravity: -0.02,
        rotation: 0,
        spin: (Math.random() - 0.5) * 0.3,
        size,
        color: emberColors[Math.floor(Math.random() * emberColors.length)],
        draw(ctx, p) {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life * 0.9;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
          // Tiny bright center
          ctx.fillStyle = '#ffe0a0';
          ctx.globalAlpha = p.life;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.4, 0, Math.PI * 2);
          ctx.fill();
        },
      });
    }

    // Second wave — delayed ring of fire
    setTimeout(() => {
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        const speed = 3 + Math.random() * 2;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          life: 1,
          decay: 0.02 + Math.random() * 0.01,
          gravity: -0.04,
          rotation: 0, spin: 0,
          size: 5 + Math.random() * 4,
          color: '#ffd700',
          draw(ctx, p) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life * 0.7;
            ctx.beginPath();
            ctx.arc(0, 0, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
          },
        });
      }
    }, 100);

    start();
  }

  /**
   * Water splash particles — big dramatic splash with droplets, mist, and waves.
   */
  function waterSplash(x, y, count = 20) {
    const coreColors = ['#00d4ff', '#00e5ff', '#40c4ff', '#80d8ff', '#ffffff'];
    const dropColors = ['#00b0ff', '#7b68ee', '#00bcd4', '#4dd0e1'];

    // Central splash flash
    particles.push({
      x, y, vx: 0, vy: 0, life: 1, decay: 0.035,
      gravity: 0, rotation: 0, spin: 0,
      size: 35 + Math.random() * 20,
      color: '#e0f7ff',
      draw(ctx, p) {
        const r = p.size * p.life;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        grad.addColorStop(0, 'rgba(255, 255, 255, ' + p.life + ')');
        grad.addColorStop(0.3, 'rgba(0, 212, 255, ' + (p.life * 0.7) + ')');
        grad.addColorStop(1, 'rgba(0, 150, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
      },
    });

    // Main fountain burst — shoots upward then arcs down
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 3 + Math.random() * 6;
      const size = 3 + Math.random() * 7;
      particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.012 + Math.random() * 0.008,
        gravity: 0.12,
        rotation: 0,
        spin: 0,
        size,
        color: coreColors[Math.floor(Math.random() * coreColors.length)],
        draw(ctx, p) {
          // Teardrop shape
          const r = p.size * (0.5 + p.life * 0.5);
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
          grad.addColorStop(0, 'rgba(255, 255, 255, ' + (p.life * 0.8) + ')');
          grad.addColorStop(0.5, p.color);
          grad.addColorStop(1, 'rgba(0, 100, 255, 0)');
          ctx.fillStyle = grad;
          ctx.globalAlpha = p.life;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
        },
      });
    }

    // Tiny scattered droplets — many small fast ones
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      const size = 1 + Math.random() * 2.5;
      particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1,
        decay: 0.01 + Math.random() * 0.008,
        gravity: 0.08,
        rotation: 0,
        spin: 0,
        size,
        color: dropColors[Math.floor(Math.random() * dropColors.length)],
        draw(ctx, p) {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life * 0.8;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        },
      });
    }

    // Spreading ripple ring
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16;
      const speed = 2 + Math.random();
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.3,
        life: 1,
        decay: 0.02 + Math.random() * 0.01,
        gravity: 0,
        rotation: 0, spin: 0,
        size: 3 + Math.random() * 2,
        color: '#80d8ff',
        draw(ctx, p) {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life * 0.5;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * p.life, 0, Math.PI * 2);
          ctx.fill();
        },
      });
    }

    // Second wave — delayed upward burst
    setTimeout(() => {
      for (let i = 0; i < 10; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
        const speed = 2 + Math.random() * 3;
        particles.push({
          x: x + (Math.random() - 0.5) * 40,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: 0.015 + Math.random() * 0.01,
          gravity: 0.1,
          rotation: 0, spin: 0,
          size: 3 + Math.random() * 4,
          color: '#00e5ff',
          draw(ctx, p) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life * 0.9;
            ctx.beginPath();
            ctx.arc(0, 0, p.size * (0.5 + p.life * 0.5), 0, Math.PI * 2);
            ctx.fill();
          },
        });
      }
    }, 120);

    start();
  }

  /**
   * Rainbow explosion (fire + water + sparkles combined).
   */
  function rainbowExplosion(x, y) {
    fireBurst(x, y, 20);
    waterSplash(x, y, 20);
    sparkle(x, y, 25, '#ff69b4');
    setTimeout(() => sparkle(x, y, 20, '#FFD700'), 150);
    setTimeout(() => sparkle(x, y, 15, '#4ade80'), 300);
    setTimeout(() => sparkle(x, y, 15, '#c44dff'), 450);
  }

  /**
   * Electric bolt particles — yellow lightning sparks.
   */
  function electricBolt(x, y, count = 20) {
    const colors = ['#F8D030', '#FFD700', '#FFF8DC', '#FFFF00'];

    // Central flash
    particles.push({
      x, y, vx: 0, vy: 0, life: 1, decay: 0.05,
      gravity: 0, rotation: 0, spin: 0,
      size: 30 + Math.random() * 15,
      color: '#fffbe0',
      draw(ctx, p) {
        const r = p.size * p.life;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        grad.addColorStop(0, 'rgba(255, 255, 255, ' + p.life + ')');
        grad.addColorStop(0.3, 'rgba(248, 208, 48, ' + (p.life * 0.8) + ')');
        grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
      },
    });

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      const size = 2 + Math.random() * 4;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.025 + Math.random() * 0.015,
        gravity: 0,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.4,
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        draw(ctx, p) {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size * 0.5;
          ctx.globalAlpha = p.life;
          ctx.beginPath();
          ctx.moveTo(-p.size, -p.size);
          ctx.lineTo(p.size * 0.3, 0);
          ctx.lineTo(-p.size * 0.3, 0);
          ctx.lineTo(p.size, p.size);
          ctx.stroke();
        },
      });
    }
    start();
  }

  /**
   * Leaf storm particles — green leaf ellipses floating upward.
   */
  function leafStorm(x, y, count = 20) {
    const colors = ['#78C850', '#00C853', '#4CAF50', '#8BC34A', '#CDDC39'];

    // Central green flash
    particles.push({
      x, y, vx: 0, vy: 0, life: 1, decay: 0.04,
      gravity: 0, rotation: 0, spin: 0,
      size: 30 + Math.random() * 15,
      color: '#e8f5e9',
      draw(ctx, p) {
        const r = p.size * p.life;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        grad.addColorStop(0, 'rgba(255, 255, 255, ' + p.life + ')');
        grad.addColorStop(0.3, 'rgba(120, 200, 80, ' + (p.life * 0.7) + ')');
        grad.addColorStop(1, 'rgba(0, 200, 83, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
      },
    });

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      const size = 3 + Math.random() * 5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1,
        decay: 0.01 + Math.random() * 0.008,
        gravity: -0.02,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.15,
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        draw(ctx, p) {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life * 0.8;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();
          // Leaf vein
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(-p.size * 0.7, 0);
          ctx.lineTo(p.size * 0.7, 0);
          ctx.stroke();
        },
      });
    }
    start();
  }

  return { init, clear, sparkle, confetti, fireBurst, waterSplash, rainbowExplosion, electricBolt, leafStorm };
})();
