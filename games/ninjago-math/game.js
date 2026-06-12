/**
 * Ninjago Spinjitzu Math — main game logic.
 * Defend the dojo: typed answers to multiplication problems fire elemental
 * attacks; chained correct answers charge the Spinjitzu meter; a powers
 * (exponent) question unleashes the tornado. Belt ranks gate difficulty,
 * boss duels are the belt tests.
 */
const Game = (() => {
  const GAME_ID = 'ninjago-math';

  // ===== PACING / TUNING — adjust these first when playtesting =====
  const TUNING = {
    lungePx: 14,            // wrong answer: enemy jumps this far forward
    meterSize: 5,           // first-try corrects to fill the Spinjitzu meter
    powersTimerMs: 18000,   // soft timer for tornado powers question
    typingMsPerDigit: 400,  // response-time allowance per answer digit (typed input is slower than tapping a choice)
    engageDelayMs: 380,     // pause between kill and engaging the next enemy
    waveBannerMs: 1500,
    speedJitter: 0.2,       // enemy speed varies ±this fraction
  };

  const NINJA_ROSTER = [
    { id: 'kai',   name: 'Kai',   element: 'Fire',      price: 0 },
    { id: 'jay',   name: 'Jay',   element: 'Lightning', price: 150 },
    { id: 'cole',  name: 'Cole',  element: 'Earth',     price: 200 },
    { id: 'zane',  name: 'Zane',  element: 'Ice',       price: 250 },
    { id: 'lloyd', name: 'Lloyd', element: 'Energy',    price: 400 },
  ];

  const state = {
    screen: 'title',
    belt: 0,
    selectedNinja: 'kai',
    ownedNinjas: ['kai'],
    seenPowers: {},
    // session
    phase: 'idle',         // waves | powers | boss | done
    wave: 0,
    spawnedInWave: 0,
    hearts: 3,
    asked: 0,              // problems resolved (answered correctly or breached)
    firstTry: 0,
    wrongOnCurrent: 0,
    streak: 0,
    meter: 0,
    sessionCoins: 0,
    multPool: [],
    powersPool: [],
    nextSpawnAt: 0,
    engageAt: 0,
    waveBannerUntil: 0,
    questionStart: 0,
    buffer: '',
    // powers question
    powersKey: null,
    powersProblem: null,
    powersIntro: false,
    powersDeadline: 0,
    // boss
    bossDef: null,
    bossHp: 0,
    bossKey: null,
    bossProblem: null,
    bossDeadline: 0,
    bossLocked: true,
    sessionStars: 0,
    failed: false,
    sessionId: 0,   // increments per session — stale setTimeout callbacks check it
  };

  /** Wrap a delayed callback so it dies silently if the session changed. */
  function later(fn, ms) {
    const sid = state.sessionId;
    setTimeout(() => { if (state.sessionId === sid) fn(); }, ms);
  }

  let els = {};

  // ─── Init ───────────────────────────────────────────────
  function init() {
    Audio.init();
    cacheDOM();
    Particles.init(els.particleCanvas);
    Engine.initCanvas(els.gameCanvas);
    bindEvents();
    loadProgress();
    Adaptive.load(GAME_ID);
    renderTitle();
    showScreen('title');
  }

  function cacheDOM() {
    els.container = document.querySelector('.game-container');
    els.particleCanvas = document.querySelector('.particle-canvas');
    els.gameCanvas = document.querySelector('.arena-canvas');

    els.screens = {
      title: document.querySelector('.title-screen'),
      select: document.querySelector('.select-screen'),
      game: document.querySelector('.game-screen'),
      sessionComplete: document.querySelector('.session-complete-screen'),
      ceremony: document.querySelector('.ceremony-screen'),
    };

    els.titleBelt = document.querySelector('.title-belt');
    els.titleCoins = document.querySelector('.title-coin-count');
    els.titleNinjaPreview = document.querySelector('.title-ninja-preview');

    els.hudBelt = document.querySelector('.hud-belt');
    els.hudHearts = document.querySelector('.hud-hearts');
    els.hudCoins = document.querySelector('.hud-coin-count');
    els.hudWave = document.querySelector('.hud-wave');
    els.hudStreak = document.querySelector('.hud-streak-count');

    els.problemBar = document.querySelector('.problem-bar');
    els.problemText = document.querySelector('.problem-text');
    els.answerBuffer = document.querySelector('.answer-buffer');
    els.meterFill = document.querySelector('.meter-fill');
    els.meterWrap = document.querySelector('.spinjitzu-meter');
    els.numpad = document.querySelector('.numpad');

    els.waveBanner = document.querySelector('.wave-banner');
    els.damageFlash = document.querySelector('.damage-flash');

    els.powersModal = document.querySelector('.powers-modal');
    els.powersTitle = document.querySelector('.powers-title');
    els.powersProblem = document.querySelector('.powers-problem');
    els.powersExpansion = document.querySelector('.powers-expansion');
    els.powersTimerFill = document.querySelector('.powers-timer-fill');
    els.powersTimerBar = document.querySelector('.powers-timer-bar');

    els.wuOverlay = document.querySelector('.wu-overlay');
    els.wuText = document.querySelector('.wu-text');

    els.bossBar = document.querySelector('.boss-bar');
    els.bossName = document.querySelector('.boss-name');
    els.bossPips = document.querySelector('.boss-pips');

    els.selectGrid = document.querySelector('.ninja-grid');
    els.selectCoins = document.querySelector('.select-coin-count');

    els.scTitle = document.querySelector('.sc-title');
    els.scSubtitle = document.querySelector('.sc-subtitle');
    els.scStars = document.querySelectorAll('.sc-star');
    els.scCoins = document.querySelector('.sc-coins-earned');

    els.cerBeltName = document.querySelector('.cer-belt-name');
    els.cerBeltStrip = document.querySelector('.cer-belt-strip');
  }

  function bindEvents() {
    document.querySelector('.btn-play').addEventListener('click', () => {
      Audio.SFX.tap();
      startSession();
    });
    document.querySelector('.btn-ninjas').addEventListener('click', () => {
      Audio.SFX.tap();
      renderSelect();
      showScreen('select');
    });
    document.querySelector('.select-back').addEventListener('click', () => {
      Audio.SFX.tap();
      renderTitle();
      showScreen('title');
    });
    document.querySelector('.game-back').addEventListener('click', () => {
      Audio.SFX.tap();
      endToTitle();
    });
    document.querySelector('.btn-sc-again').addEventListener('click', () => {
      Audio.SFX.tap();
      startSession();
    });
    document.querySelector('.btn-sc-home').addEventListener('click', () => {
      Audio.SFX.tap();
      endToTitle();
    });
    document.querySelector('.btn-cer-continue').addEventListener('click', () => {
      Audio.SFX.tap();
      showSessionComplete();
    });
    document.querySelector('.wu-continue').addEventListener('click', () => {
      Audio.SFX.tap();
      dismissWu();
    });

    // Numpad (pointer)
    els.numpad.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('pointerdown', e => {
        e.preventDefault();
        const d = btn.dataset.d;
        const act = btn.dataset.act;
        if (d != null) pushDigit(d);
        else if (act === 'back') popDigit();
        else if (act === 'enter') submit();
      });
    });

    // Desktop keyboard
    document.addEventListener('keydown', e => {
      if (state.screen !== 'game') return;
      if (e.key >= '0' && e.key <= '9') pushDigit(e.key);
      else if (e.key === 'Backspace') { e.preventDefault(); popDigit(); }
      else if (e.key === 'Enter') submit();
    });
  }

  // ─── Persistence ────────────────────────────────────────
  function loadProgress() {
    state.belt = Storage.load(GAME_ID, 'belt', 0);
    state.selectedNinja = Storage.load(GAME_ID, 'selectedNinja', 'kai');
    state.ownedNinjas = Storage.load(GAME_ID, 'ownedNinjas', ['kai']);
    state.seenPowers = Storage.load(GAME_ID, 'seenPowers', {});
  }

  function saveProgress() {
    Storage.save(GAME_ID, 'belt', state.belt);
    Storage.save(GAME_ID, 'selectedNinja', state.selectedNinja);
    Storage.save(GAME_ID, 'ownedNinjas', state.ownedNinjas);
    Storage.save(GAME_ID, 'seenPowers', state.seenPowers);
  }

  function beltDef() { return BELTS[Math.min(state.belt, BELTS.length - 1)]; }

  /**
   * Mirror multiplication answers into pokemon-multiply's adaptive store so
   * ninjago play counts toward the existing g3-math-mastery curriculum levels
   * (mapped to that game). Same Leitner update as shared/js/adaptive.js:34-47.
   * Powers keys are NOT mirrored — they belong to this game's curriculum skill.
   */
  function mirrorMultToPokemon(key, correct, fastEnough) {
    const recs = Storage.load('pokemon-multiply', 'adaptive', {});
    const r = recs[key] || { box: 0, correct: 0, wrong: 0 };
    if (correct) {
      r.correct++;
      if (fastEnough) r.box = Math.min(r.box + 1, 3);
    } else {
      r.wrong++;
      r.box = Math.max(r.box - 1, 0);
    }
    recs[key] = r;
    Storage.save('pokemon-multiply', 'adaptive', recs);
  }

  /** Typed answers take longer than tapping a choice — subtract a per-digit
   *  allowance so multi-digit answers (1024!) aren't unfairly marked slow. */
  function adjustedResponseMs(answer) {
    const raw = Date.now() - state.questionStart;
    const digits = String(answer).length;
    return Math.max(0, raw - TUNING.typingMsPerDigit * digits);
  }

  // ─── Screens ────────────────────────────────────────────
  function showScreen(name) {
    state.screen = name;
    for (const [key, el] of Object.entries(els.screens)) {
      el.classList.toggle('active', key === name);
    }
    if (name === 'game') {
      requestAnimationFrame(() => Engine.resize());
    } else {
      Engine.stopLoop();
    }
  }

  function renderNinjaPreview(canvas, charId, scale = 5) {
    const sprite = (SPRITES.NINJAS[charId] || SPRITES.NINJAS.kai).idle;
    canvas.width = sprite.w * scale;
    canvas.height = sprite.h * scale;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < sprite.h; y++) {
      for (let x = 0; x < sprite.w; x++) {
        const c = sprite.pixels[y * sprite.w + x];
        if (c) {
          ctx.fillStyle = c;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
  }

  function renderTitle() {
    const b = beltDef();
    els.titleBelt.textContent = b.name;
    els.titleBelt.style.setProperty('--belt-color', b.color);
    els.titleCoins.textContent = SharedCoins.get();
    renderNinjaPreview(els.titleNinjaPreview, state.selectedNinja, 7);
  }

  function renderSelect() {
    els.selectCoins.textContent = SharedCoins.get();
    els.selectGrid.innerHTML = '';
    for (const n of NINJA_ROSTER) {
      const owned = state.ownedNinjas.includes(n.id);
      const selected = state.selectedNinja === n.id;
      const card = Utils.createElement('button', {
        className: `card ninja-card${selected ? ' selected' : ''}${owned ? '' : ' locked'}`,
      });
      const cv = document.createElement('canvas');
      cv.className = 'ninja-preview';
      card.appendChild(cv);
      const nameEl = Utils.createElement('span', { className: 'ninja-name' });
      nameEl.textContent = n.name;
      card.appendChild(nameEl);
      const elEl = Utils.createElement('span', { className: `ninja-element el-${n.id}` });
      elEl.textContent = n.element;
      card.appendChild(elEl);
      const status = Utils.createElement('span', { className: 'ninja-status' });
      status.textContent = selected ? '✓ SELECTED' : owned ? 'SELECT' : `🪙 ${n.price}`;
      card.appendChild(status);

      card.addEventListener('click', () => {
        if (owned) {
          Audio.SFX.tap();
          state.selectedNinja = n.id;
          saveProgress();
          renderSelect();
        } else if (SharedCoins.spend(n.price)) {
          Audio.SFX.powerup();
          state.ownedNinjas.push(n.id);
          state.selectedNinja = n.id;
          saveProgress();
          const rect = card.getBoundingClientRect();
          Particles.confetti(40);
          Particles.sparkle(rect.left + rect.width / 2, rect.top + rect.height / 2, 14, '#FFD54F');
          renderSelect();
        } else {
          Audio.SFX.wrong();
          card.classList.add('animate-wobble');
          setTimeout(() => card.classList.remove('animate-wobble'), 500);
        }
      });
      els.selectGrid.appendChild(card);
      renderNinjaPreview(cv, n.id, 4);
    }
  }

  // ─── Session flow ───────────────────────────────────────
  function buildPools() {
    // Mult: combined pool from belt 0..current (older facts stay in rotation;
    // the adaptive weights keep struggling items frequent) — mirrors pokemon's
    // combined-tier pool approach.
    const keys = new Set();
    for (let i = 0; i <= Math.min(state.belt, BELTS.length - 1); i++) {
      MATH_MODES.multiply.buildPool(BELTS[i]).forEach(k => keys.add(k));
    }
    state.multPool = [...keys];
    // Powers: current belt only — this is the new content being taught.
    state.powersPool = MATH_MODES.powers.buildPool(beltDef());
  }

  function startSession() {
    state.sessionId++;
    buildPools();
    state.phase = 'waves';
    state.wave = 0;
    state.hearts = 3;
    state.asked = 0;
    state.firstTry = 0;
    state.wrongOnCurrent = 0;
    state.streak = 0;
    state.meter = 0;
    state.sessionCoins = 0;
    state.buffer = '';
    state.failed = false;
    state.bossDef = null;

    Arena.reset(state.selectedNinja, {
      onKill: handleKill,
      onBreach: handleBreach,
      onTornadoDone: handleTornadoDone,
      onBossReady: handleBossReady,
      onBossGone: handleBossGone,
    });

    showScreen('game');
    updateHUD();
    renderMeter();
    setProblemIdle();
    els.bossBar.style.display = 'none';
    els.powersModal.classList.remove('active');
    els.wuOverlay.classList.remove('active');

    Engine.startLoop(update, render);
    startWave();
  }

  function startWave() {
    state.wave++;
    state.spawnedInWave = 0;
    state.waveBannerUntil = Date.now() + TUNING.waveBannerMs;
    state.nextSpawnAt = Date.now() + TUNING.waveBannerMs + 300;
    els.waveBanner.textContent = `⚔️ Wave ${state.wave} of ${beltDef().wavesPerSession}`;
    els.waveBanner.classList.add('show');
    setTimeout(() => els.waveBanner.classList.remove('show'), TUNING.waveBannerMs);
    Audio.SFX.whoosh();
    updateHUD();
  }

  function spawnEnemy() {
    const b = beltDef();
    const type = b.enemyTypes[Utils.randInt(0, b.enemyTypes.length - 1)];
    const key = Adaptive.pickItem(state.multPool);
    if (!key) return;
    const [a, bb] = MATH_MODES.multiply.keyToProblem(key);
    const jitter = 1 - TUNING.speedJitter / 2 + Math.random() * TUNING.speedJitter;
    Arena.spawnEnemy({
      type, key,
      problem: {
        a, b: bb,
        answer: MATH_MODES.multiply.compute(a, bb),
        badge: `${a}×${bb}`,
      },
      speed: b.enemySpeed * jitter,
    });
    state.spawnedInWave++;
  }

  function engageNext() {
    const e = Arena.engageFront();
    if (!e) return;
    state.questionStart = Date.now();
    state.wrongOnCurrent = 0;
    state.buffer = '';
    els.problemText.innerHTML = `${MATH_MODES.multiply.displayHTML(e.problem.a, e.problem.b)} <span class="eq">=</span>`;
    renderBuffer();
  }

  function setProblemIdle() {
    els.problemText.innerHTML = '<span class="problem-idle">Get ready…</span>';
    els.answerBuffer.textContent = '';
  }

  // ─── Per-frame update (60fps fixed step) ────────────────
  function update() {
    Arena.update();

    const now = Date.now();
    if (state.phase === 'waves') {
      const b = beltDef();
      // spawn — immediately if the field is empty (no dead air between kills)
      const fieldEmpty = Arena.enemyCount() === 0 && now >= state.waveBannerUntil;
      if (
        state.spawnedInWave < b.enemiesPerWave &&
        Arena.enemyCount() < b.maxConcurrent &&
        (now >= state.nextSpawnAt || fieldEmpty)
      ) {
        spawnEnemy();
        state.nextSpawnAt = now + b.spawnGapMs;
      }
      // engage
      if (!Arena.getEngaged() && Arena.enemyCount() > 0 && now >= state.engageAt) {
        engageNext();
      }
      // wave / session end
      if (state.spawnedInWave >= b.enemiesPerWave && Arena.enemyCount() === 0) {
        if (state.wave >= b.wavesPerSession) {
          state.phase = 'done';
          later(completeSession, 600);
        } else {
          state.phase = 'between';
          later(() => {
            if (state.screen === 'game') {
              state.phase = 'waves';
              startWave();
            }
          }, 800);
        }
      }
    } else if (state.phase === 'powers') {
      if (!state.powersIntro && state.powersDeadline && now > state.powersDeadline) {
        powersFail(true);
      }
    } else if (state.phase === 'boss') {
      if (!state.bossLocked && state.bossDeadline && now > state.bossDeadline) {
        bossWrong(true);
      }
    }
  }

  function render(ctx, t) {
    Arena.render(ctx, t);
  }

  // ─── Input ──────────────────────────────────────────────
  function inputActive() {
    if (state.screen !== 'game') return false;
    if (state.phase === 'waves') return !!Arena.getEngaged();
    if (state.phase === 'powers') return !els.wuOverlay.classList.contains('active');
    if (state.phase === 'boss') return !state.bossLocked;
    return false;
  }

  function pushDigit(d) {
    if (!inputActive() || state.buffer.length >= 4) return;
    state.buffer += d;
    Audio.SFX.tap();
    if (state.phase === 'waves') Arena.setEngagedSlowed(true);
    renderBuffer();
  }

  function popDigit() {
    if (!inputActive() || !state.buffer.length) return;
    state.buffer = state.buffer.slice(0, -1);
    if (state.phase === 'waves' && !state.buffer.length) Arena.setEngagedSlowed(false);
    renderBuffer();
  }

  function renderBuffer() {
    const target = state.phase === 'powers'
      ? els.powersProblem.querySelector('.powers-buffer')
      : els.answerBuffer;
    if (state.phase === 'powers' && target) {
      target.textContent = state.buffer || '?';
    } else {
      els.answerBuffer.textContent = state.buffer;
      els.answerBuffer.classList.toggle('empty', !state.buffer.length);
    }
  }

  function submit() {
    if (!inputActive() || !state.buffer.length) return;
    const val = parseInt(state.buffer, 10);
    if (state.phase === 'waves') submitWave(val);
    else if (state.phase === 'powers') submitPowers(val);
    else if (state.phase === 'boss') submitBoss(val);
  }

  // ─── Waves: answers ─────────────────────────────────────
  function submitWave(val) {
    const e = Arena.getEngaged();
    if (!e) return;

    if (val === e.problem.answer) {
      const ms = adjustedResponseMs(e.problem.answer);
      Adaptive.recordAnswer(e.key, true, ms);
      mirrorMultToPokemon(e.key, true, ms < 5000);

      const b = beltDef();
      let earned = b.coinsPerCorrect;
      state.streak++;
      if (state.streak >= 5) earned += 2;
      else if (state.streak >= 3) earned += 1;
      SharedCoins.add(earned);
      state.sessionCoins += earned;

      state.asked++;
      if (state.wrongOnCurrent === 0) {
        state.firstTry++;
        state.meter = Math.min(state.meter + 1, TUNING.meterSize);
        Audio.SFX.star();
      }
      Audio.SFX.correct();

      Arena.attackEngaged();
      state.buffer = '';
      setProblemIdle();
      state.engageAt = Date.now() + TUNING.engageDelayMs;
      renderMeter();
      updateHUD();

      if (state.meter >= TUNING.meterSize) {
        later(startPowersQuestion, 450);
      }
    } else {
      state.wrongOnCurrent++;
      state.streak = 0;
      // forgiving: a wrong answer drains one meter segment, not the whole chain
      state.meter = Math.max(0, state.meter - 1);
      Adaptive.recordAnswer(e.key, false, Date.now() - state.questionStart);
      mirrorMultToPokemon(e.key, false, false);
      checkBeltRegression();

      Audio.SFX.wrong();
      Arena.lungeEngaged(TUNING.lungePx);
      state.buffer = '';
      Arena.setEngagedSlowed(false);
      renderBuffer();
      els.problemBar.classList.add('animate-wobble');
      setTimeout(() => els.problemBar.classList.remove('animate-wobble'), 500);
      renderMeter();
      updateHUD();
    }
  }

  function handleKill() {
    // visual kill resolved (projectile landed or tornado) — nothing to score here
  }

  function handleBreach(enemy) {
    state.hearts--;
    Arena.setDojoHp(state.hearts);
    state.asked++;
    state.streak = 0;
    state.meter = 0;
    Adaptive.recordAnswer(enemy.key, false, null);
    mirrorMultToPokemon(enemy.key, false, false);
    checkBeltRegression();
    Audio.SFX.hurt();
    flashDamage();
    state.buffer = '';
    setProblemIdle();
    state.engageAt = Date.now() + TUNING.engageDelayMs;
    renderMeter();
    updateHUD();

    if (state.hearts <= 0) {
      state.failed = true;
      state.phase = 'done';
      later(completeSession, 700);
    }
  }

  function flashDamage() {
    els.damageFlash.classList.add('show');
    setTimeout(() => els.damageFlash.classList.remove('show'), 350);
  }

  // ─── Spinjitzu powers question ──────────────────────────
  function startPowersQuestion() {
    if (state.screen !== 'game' || state.phase !== 'waves') return;
    state.phase = 'powers';
    Arena.setFrozen(true);
    Audio.SFX.powerup();

    state.powersKey = Adaptive.pickItem(state.powersPool);
    const [base, exp] = MATH_MODES.powers.keyToProblem(state.powersKey);
    state.powersProblem = { base, exp, answer: MATH_MODES.powers.compute(base, exp) };
    state.powersIntro = !state.seenPowers[state.powersKey];
    state.buffer = '';

    els.powersTitle.textContent = state.powersIntro ? '🥋 Sensei Wu teaches…' : '🌀 SPINJITZU TIME!';
    els.powersProblem.innerHTML =
      `${MATH_MODES.powers.displayHTML(base, exp)} <span class="eq">=</span> <span class="powers-buffer">?</span>`;

    if (state.powersIntro) {
      els.powersExpansion.textContent = `${base}^${exp} means ${MATH_MODES.powers.expansion(base, exp)}`;
      els.powersExpansion.style.display = 'block';
      els.powersTimerBar.style.display = 'none';
      state.powersDeadline = 0;
    } else {
      els.powersExpansion.style.display = 'none';
      els.powersTimerBar.style.display = 'block';
      state.powersDeadline = Date.now() + TUNING.powersTimerMs;
      els.powersTimerFill.style.transition = 'none';
      els.powersTimerFill.style.width = '100%';
      requestAnimationFrame(() => {
        els.powersTimerFill.style.transition = `width ${TUNING.powersTimerMs}ms linear`;
        els.powersTimerFill.style.width = '0%';
      });
    }

    els.powersModal.classList.add('active');
  }

  function submitPowers(val) {
    const p = state.powersProblem;
    if (val === p.answer) {
      const ms = state.powersIntro ? null : adjustedResponseMs(p.answer);
      Adaptive.recordAnswer(state.powersKey, true, ms);
      state.seenPowers[state.powersKey] = true;
      saveProgress();

      const earned = beltDef().coinsPerCorrect * 3;
      SharedCoins.add(earned);
      state.sessionCoins += earned;

      state.meter = 0;
      state.buffer = '';
      els.powersModal.classList.remove('active');
      Audio.SFX.celebration();
      Arena.setFrozen(false);
      Arena.startTornado();
      Particles.confetti(50);
      renderMeter();
      updateHUD();
      // phase returns to 'waves' in handleTornadoDone
    } else {
      Adaptive.recordAnswer(state.powersKey, false, null);
      powersFail(false);
    }
  }

  function powersFail(timedOut) {
    if (timedOut) Adaptive.recordAnswer(state.powersKey, false, null);
    const p = state.powersProblem;
    state.meter = 0;
    state.buffer = '';
    state.seenPowers[state.powersKey] = true;
    saveProgress();
    els.powersModal.classList.remove('active');
    Audio.SFX.wrong();

    els.wuText.innerHTML =
      `${timedOut ? '⏳ Time flows like a river…' : '🍵 Not yet, young ninja.'}<br>` +
      `<strong>${p.base}<sup>${p.exp}</sup> = ${MATH_MODES.powers.expansion(p.base, p.exp)} = ${p.answer}</strong>`;
    els.wuOverlay.classList.add('active');
    renderMeter();
  }

  function dismissWu() {
    els.wuOverlay.classList.remove('active');
    if (state.phase === 'powers') {
      state.phase = 'waves';
      Arena.setFrozen(false);
      state.engageAt = Date.now() + 300;
      setProblemIdle();
    }
  }

  function handleTornadoDone() {
    if (state.phase === 'powers') {
      state.phase = 'waves';
      state.engageAt = Date.now() + 300;
      setProblemIdle();
    }
  }

  // ─── Belt progression ───────────────────────────────────
  function promotionEligible() {
    if (state.belt >= BELTS.length - 1) return false;
    const b = beltDef();
    const records = Adaptive.getRecords();
    const ok = pool => {
      if (!pool.length) return false;
      const n = pool.filter(k => records[k] && records[k].box >= 1).length;
      return n / pool.length >= 0.5;
    };
    return ok(MATH_MODES.multiply.buildPool(b)) && ok(b.powers);
  }

  function checkBeltRegression() {
    if (state.belt <= 0) return;
    const b = beltDef();
    const pool = MATH_MODES.multiply.buildPool(b);
    const records = Adaptive.getRecords();
    const atBox0 = pool.filter(k => !records[k] || records[k].box === 0).length;
    if (pool.length && atBox0 / pool.length >= 0.7) {
      state.belt--;
      saveProgress();
      updateHUD();
    }
  }

  // ─── Session complete / boss / ceremony ─────────────────
  function completeSession() {
    if (state.screen !== 'game') return;

    if (state.failed) {
      state.sessionStars = 0;
      saveProgress();
      showSessionComplete();
      return;
    }

    const ratio = state.asked > 0 ? state.firstTry / state.asked : 0;
    state.sessionStars = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1;
    if (state.sessionStars === 3) {
      const bonus = beltDef().bonusCoins;
      SharedCoins.add(bonus);
      state.sessionCoins += bonus;
    }
    saveProgress();
    Energy.earnMinutes(1);

    if (promotionEligible()) {
      const b = beltDef();
      if (b.boss) {
        startBossFight(BOSSES[b.boss]);
        return;
      }
      promote();
      return;
    }
    showSessionComplete();
  }

  function startBossFight(bossDefArg) {
    state.phase = 'boss';
    state.bossDef = bossDefArg;
    state.bossHp = bossDefArg.hp;
    state.bossLocked = true;
    state.buffer = '';
    Arena.clearEnemies();
    Arena.startBoss(bossDefArg);

    els.bossBar.style.display = 'flex';
    els.bossName.textContent = `⚔️ ${bossDefArg.name}`;
    renderBossPips();

    els.waveBanner.textContent = `⚔️ BELT TEST: ${bossDefArg.name}!`;
    els.waveBanner.classList.add('show');
    setTimeout(() => els.waveBanner.classList.remove('show'), 2000);
    els.problemText.innerHTML = `<span class="problem-idle">${bossDefArg.intro}</span>`;
    els.answerBuffer.textContent = '';
    Audio.SFX.die();
    Audio.speak(bossDefArg.intro, 0.95);
  }

  function handleBossReady() {
    askBossQuestion();
  }

  function askBossQuestion() {
    state.bossKey = Adaptive.pickItem(state.powersPool);
    const [base, exp] = MATH_MODES.powers.keyToProblem(state.bossKey);
    state.bossProblem = { base, exp, answer: MATH_MODES.powers.compute(base, exp) };
    state.buffer = '';
    state.bossLocked = false;
    state.questionStart = Date.now();
    state.bossDeadline = Date.now() + state.bossDef.timerMs;

    els.problemText.innerHTML =
      `<span class="boss-q">${MATH_MODES.powers.displayHTML(base, exp)} <span class="eq">=</span></span>`;
    renderBuffer();

    els.powersTimerBar.style.display = 'block';
    els.powersTimerFill.style.transition = 'none';
    els.powersTimerFill.style.width = '100%';
    requestAnimationFrame(() => {
      els.powersTimerFill.style.transition = `width ${state.bossDef.timerMs}ms linear`;
      els.powersTimerFill.style.width = '0%';
    });
  }

  function submitBoss(val) {
    if (val === state.bossProblem.answer) {
      state.bossLocked = true;
      state.bossDeadline = 0;
      const ms = adjustedResponseMs(state.bossProblem.answer);
      Adaptive.recordAnswer(state.bossKey, true, ms);
      state.seenPowers[state.bossKey] = true;

      state.bossHp--;
      renderBossPips();
      Audio.SFX.correct();
      Arena.bossHit();
      state.buffer = '';
      els.answerBuffer.textContent = '';

      if (state.bossHp <= 0) {
        els.powersTimerBar.style.display = 'none';
        els.problemText.innerHTML = '<span class="problem-idle">🏆 Victory!</span>';
        Audio.SFX.fanfare();
        later(() => Arena.bossDie(), 500);
      } else {
        const taunt = state.bossDef.taunts[Utils.randInt(0, state.bossDef.taunts.length - 1)];
        els.problemText.innerHTML = `<span class="problem-idle">${taunt}</span>`;
        later(() => { if (state.phase === 'boss') askBossQuestion(); }, 1200);
      }
    } else {
      bossWrong(false);
    }
  }

  function bossWrong(timedOut) {
    state.bossLocked = true;
    state.bossDeadline = 0;
    Adaptive.recordAnswer(state.bossKey, false, null);
    state.buffer = '';
    els.answerBuffer.textContent = '';

    state.hearts--;
    Arena.setDojoHp(state.hearts);
    Audio.SFX.hurt();
    Arena.bossAttack();
    flashDamage();
    updateHUD();

    const p = state.bossProblem;
    els.problemText.innerHTML =
      `<span class="problem-idle">${timedOut ? '⏳ Too slow!' : '💥 Blocked!'} ` +
      `${p.base}<sup>${p.exp}</sup> = ${p.answer}</span>`;

    if (state.hearts <= 0) {
      state.failed = true;
      els.powersTimerBar.style.display = 'none';
      later(() => {
        state.sessionStars = Math.max(1, state.sessionStars); // session itself was earned
        showSessionComplete();
      }, 1200);
    } else {
      later(() => { if (state.phase === 'boss') askBossQuestion(); }, 1500);
    }
  }

  function handleBossGone() {
    promote();
  }

  function promote() {
    state.belt = Math.min(state.belt + 1, BELTS.length - 1);
    saveProgress();
    const b = beltDef();
    els.cerBeltName.textContent = b.name;
    els.cerBeltName.style.color = b.color === '#212121' ? '#9E9E9E' : b.color;
    els.cerBeltStrip.style.background = b.color;
    showScreen('ceremony');
    Audio.SFX.fanfare();
    Particles.confetti(80);
    Audio.speak(`Amazing! You earned the ${b.name}!`, 0.95);
  }

  function showSessionComplete() {
    state.phase = 'idle';
    els.powersTimerBar.style.display = 'none';
    els.bossBar.style.display = 'none';

    if (state.failed && state.sessionStars === 0) {
      els.scTitle.textContent = '🏯 The Dojo Has Fallen!';
      els.scSubtitle.textContent = 'Train harder and defend it again!';
    } else {
      els.scTitle.textContent = '🥋 Training Complete!';
      els.scSubtitle.textContent = state.sessionStars === 3 ? 'Flawless ninja skills!' : 'The dojo stands strong!';
    }

    els.scStars.forEach((star, i) => {
      star.textContent = i < state.sessionStars ? '⭐' : '☆';
      star.classList.toggle('earned', i < state.sessionStars);
    });
    els.scCoins.textContent = `🪙 +${state.sessionCoins}`;
    showScreen('sessionComplete');
    if (state.sessionStars >= 2) Audio.SFX.celebration();
  }

  function endToTitle() {
    state.sessionId++;
    state.phase = 'idle';
    Engine.stopLoop();
    renderTitle();
    showScreen('title');
  }

  // ─── HUD ────────────────────────────────────────────────
  function updateHUD() {
    const b = beltDef();
    els.hudBelt.textContent = b.name;
    els.hudBelt.style.setProperty('--belt-color', b.color);
    els.hudHearts.textContent = '❤️'.repeat(Math.max(0, state.hearts)) + '🖤'.repeat(Math.max(0, 3 - state.hearts));
    els.hudCoins.textContent = SharedCoins.get();
    els.hudWave.textContent = `Wave ${state.wave}/${b.wavesPerSession}`;
    els.hudStreak.textContent = state.streak;
  }

  function renderMeter() {
    const pct = (state.meter / TUNING.meterSize) * 100;
    els.meterFill.style.width = pct + '%';
    els.meterWrap.classList.toggle('full', state.meter >= TUNING.meterSize);
  }

  function renderBossPips() {
    els.bossPips.innerHTML = '';
    for (let i = 0; i < state.bossDef.hp; i++) {
      const pip = document.createElement('span');
      pip.className = 'boss-pip' + (i < state.bossHp ? ' alive' : '');
      els.bossPips.appendChild(pip);
    }
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', Game.init);
