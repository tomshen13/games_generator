/**
 * Parent Dashboard — shows per-kid mastery stats behind a PIN gate.
 * Organized by curriculum skills with per-level breakdowns.
 */
const Dashboard = (() => {
  const GAME_META = {
    'mario-bros': { title: 'Super Mario Bros', icon: '🍄', type: 'mario' },
  };

  const GAME_DISPLAY = {
    'unicorn-numbers': { icon: '🦄', title: 'Unicorn Numbers' },
    'pokemon-multiply': { icon: '⚡', title: 'Pokemon Math' },
    'mario-bros': { icon: '🍄', title: 'Super Mario Bros' },
    'voice-tutor': { icon: '👩‍🏫', title: 'Voice Tutor' },
  };

  let activeTab = 'Dan';
  let activeGrades = {}; // { subject: phaseId }

  function initDefaultGrade(subject, allGameData) {
    if (activeGrades[subject]) return;
    const grades = Curriculum.getSubjectGrades(subject);
    if (!grades.length) return;
    for (const grade of grades) {
      const skills = Curriculum.getSkillsForSubjectGrade(subject, grade.id);
      for (const skill of skills) {
        const stats = Curriculum.computeSkillStats(allGameData, skill);
        if (stats.hasAnyGame) { activeGrades[subject] = grade.id; return; }
      }
    }
    activeGrades[subject] = grades[0].id;
  }

  function renderDashboardGradeStepper(subject, grades) {
    const currentId = activeGrades[subject];
    const idx = grades.findIndex(g => g.id === currentId);
    const grade = grades[idx] || grades[0];
    const atStart = idx <= 0;
    const atEnd = idx >= grades.length - 1;
    return `<span class="dashboard-grade-stepper" data-subject="${subject}">
      <button class="grade-arrow grade-prev" ${atStart ? 'disabled' : ''}>◀</button>
      <span class="grade-label">${grade.name}</span>
      <button class="grade-arrow grade-next" ${atEnd ? 'disabled' : ''}>▶</button>
    </span>`;
  }

  function renderDonut(pct) {
    const r = 32;
    const circ = 2 * Math.PI * r;
    const fill = (pct / 100) * circ;
    const color = pct >= 70 ? '#4ade80' : pct >= 40 ? '#facc15' : '#f87171';
    return `
      <div class="donut-wrap">
        <svg viewBox="0 0 80 80">
          <circle class="donut-bg" cx="40" cy="40" r="${r}" fill="none" stroke-width="8"/>
          <circle class="donut-fill" cx="40" cy="40" r="${r}" fill="none" stroke="${color}"
            stroke-width="8" stroke-dasharray="${fill} ${circ}" stroke-linecap="round"/>
        </svg>
        <span class="donut-label">${Math.round(pct)}%</span>
      </div>`;
  }

  function renderMasteryBar(mastered, learning, struggling) {
    const total = mastered + learning + struggling;
    if (!total) return '';
    const mPct = (mastered / total * 100).toFixed(1);
    const lPct = (learning / total * 100).toFixed(1);
    const sPct = (struggling / total * 100).toFixed(1);
    return `
      <div class="mastery-bar">
        <div class="mastery-segment mastery-mastered" style="width: ${mPct}%"></div>
        <div class="mastery-segment mastery-learning" style="width: ${lPct}%"></div>
        <div class="mastery-segment mastery-struggling" style="width: ${sPct}%"></div>
      </div>
      <div class="mastery-legend">
        <span class="mastery-legend-item"><span class="mastery-legend-dot" style="background:#4ade80"></span> Mastered (${mastered})</span>
        <span class="mastery-legend-item"><span class="mastery-legend-dot" style="background:#facc15"></span> Learning (${learning})</span>
        <span class="mastery-legend-item"><span class="mastery-legend-dot" style="background:#f87171"></span> Struggling (${struggling})</span>
      </div>`;
  }

  function formatKeyReadable(key, gameId) {
    if (key.includes('x')) return key.replace('x', ' \u00d7 ');
    if (key.includes('+')) return key.replace('+', ' + ');
    if (key.includes('-')) return key.replace('-', ' \u2212 ');
    if (key.includes('<')) return key.replace('<', ' vs ');
    if (gameId === 'unicorn-numbers' || gameId === 'unicorn-counting') return `Number "${key}"`;
    if (gameId === 'unicorn-hebrew') return `Letter "${key}"`;
    return key;
  }

  function getGameTitle(gameId) {
    const titles = {
      'unicorn-numbers': '🦄 Unicorn Numbers',
      'unicorn-counting': '🦄 Unicorn Counting',
      'unicorn-comparison': '🦄 Unicorn Compare',
      'unicorn-addition': '🦄 Unicorn Addition',
      'unicorn-hebrew': '🦄 Unicorn Hebrew',
      'pokemon-multiply': '⚡ Pokemon Math',
    };
    return titles[gameId] || gameId;
  }

  function getItemWord(gameId, count, mode) {
    if (mode === 'add' || mode === 'subtract' || mode === 'addition') {
      return count === 1 ? 'problem' : 'problems';
    }
    if (mode === 'comparison') {
      return count === 1 ? 'pair' : 'pairs';
    }
    if (mode === 'counting') {
      return count === 1 ? 'number' : 'numbers';
    }
    const labels = {
      'unicorn-numbers': ['number', 'numbers'],
      'unicorn-hebrew': ['letter', 'letters'],
      'pokemon-multiply': ['fact', 'facts'],
    };
    const pair = labels[gameId] || ['item', 'items'];
    return count === 1 ? pair[0] : pair[1];
  }

  // ── Curriculum-based skill card ──

  function renderLevelGroup(level, stats) {
    const gameId = level.gameMapping ? level.gameMapping.gameId : null;
    const mode = level.gameMapping ? level.gameMapping.mode : null;
    const total = stats.mastered + stats.learning + stats.struggling;
    const stars = '★'.repeat(stats.stars) + '☆'.repeat(3 - stats.stars);

    // Mastery bar
    const barHtml = total > 0 ? `
      <div class="dashboard-tier-bar">
        <div class="mastery-segment mastery-mastered" style="width: ${(stats.mastered / stats.total * 100)}%"></div>
        <div class="mastery-segment mastery-learning" style="width: ${(stats.learning / stats.total * 100)}%"></div>
        <div class="mastery-segment mastery-struggling" style="width: ${(stats.struggling / stats.total * 100)}%"></div>
      </div>` : '<div class="dashboard-tier-bar"></div>';

    // Compact legend (always visible)
    const legendParts = [];
    if (stats.mastered > 0) legendParts.push(`<span><span class="legend-dot" style="background:#4ade80"></span> ${stats.mastered} ${getItemWord(gameId, stats.mastered, mode)} mastered</span>`);
    if (stats.learning > 0) legendParts.push(`<span><span class="legend-dot" style="background:#facc15"></span> ${stats.learning} still learning</span>`);
    if (stats.struggling > 0) legendParts.push(`<span><span class="legend-dot" style="background:#f87171"></span> ${stats.struggling} needs practice</span>`);
    if (stats.notStarted > 0) legendParts.push(`<span>${stats.notStarted} not tried yet</span>`);
    const legendHtml = legendParts.length ? `<div class="dashboard-level-legend">${legendParts.join('')}</div>` : '';

    // Detail panel (hidden by default)
    let detailHtml = '';
    if (stats.hasGame) {
      // KPI
      const kpiHtml = level.kpi
        ? `<div class="dashboard-level-kpi-text"><strong>Goal:</strong> ${level.kpi}</div>`
        : '';

      // Item grid — show every item color-coded by status
      const statusColors = { mastered: '#4ade80', learning: '#facc15', struggling: '#f87171', 'not-started': 'rgba(255,255,255,0.1)' };
      const statusTitles = { mastered: 'Mastered', learning: 'Still learning', struggling: 'Needs practice', 'not-started': 'Not tried yet' };
      const itemGridHtml = stats.allItems.length ? `
        <div class="dashboard-item-grid">
          ${stats.allItems.map(item => {
            const label = item.key.includes('x') ? item.key.replace('x', '\u00d7') : item.key.includes('-') ? item.key.replace('-', '\u2212') : item.key;
            const acc = item.record ? `${item.record.correct}/${item.record.correct + item.record.wrong}` : '';
            const tooltip = `${statusTitles[item.status]}${acc ? ' (' + acc + ')' : ''}`;
            return `<span class="item-badge item-${item.status}" title="${tooltip}">${label}</span>`;
          }).join('')}
        </div>
        <div class="dashboard-item-grid-legend">
          <span><span class="legend-dot" style="background:#4ade80"></span> Mastered</span>
          <span><span class="legend-dot" style="background:#facc15"></span> Learning</span>
          <span><span class="legend-dot" style="background:#f87171"></span> Needs practice</span>
          <span><span class="legend-dot" style="background:rgba(255,255,255,0.15)"></span> Not tried</span>
        </div>` : '';

      // Game link
      const gameUrl = Curriculum.getGameURL(level.gameMapping);
      const gameTitle = getGameTitle(gameId);
      const gameLinkHtml = gameUrl
        ? `<div class="dashboard-level-game"><span class="dashboard-game-name">${gameTitle}</span><a class="dashboard-play-link" data-href="${gameUrl}">▶ Play</a></div>`
        : '';

      detailHtml = `<div class="dashboard-level-detail">${kpiHtml}${itemGridHtml}${gameLinkHtml}</div>`;
    }

    return `
      <div class="dashboard-level-group">
        <div class="dashboard-level-row expandable">
          <span class="dashboard-level-chevron">▸</span>
          <span class="dashboard-level-num">${level.level}</span>
          <span class="dashboard-level-name">${level.name}</span>
          ${barHtml}
          <span class="dashboard-level-stars">${stars}</span>
        </div>
        ${legendHtml}
        ${detailHtml}
      </div>`;
  }

  function renderSkillCard(skill, skillStats, allGameData) {
    const subjects = Curriculum.getSubjects();
    const subj = subjects[skill.subject] || {};

    // Separate mapped levels from locked ones
    const mappedLevels = skillStats.levelStats.filter(ls => ls.stats.hasGame);
    const lockedCount = skillStats.levelStats.filter(ls => !ls.stats.hasGame).length;

    const levelRows = mappedLevels
      .map(({ level, stats }) => renderLevelGroup(level, stats))
      .join('');

    // Locked levels summary
    const lockedHtml = lockedCount > 0
      ? `<div class="dashboard-locked-summary">🔒 ${mappedLevels.length === 0 ? `All ${lockedCount} levels` : `${lockedCount} more level${lockedCount > 1 ? 's' : ''}`} — no games yet</div>`
      : '';

    // Skill summary line
    const totalMastered = mappedLevels.reduce((s, ls) => s + ls.stats.mastered, 0);
    const totalItems = mappedLevels.reduce((s, ls) => s + ls.stats.total, 0);
    const activeLevels = mappedLevels.length;
    const firstGameId = mappedLevels.length ? mappedLevels[0].level.gameMapping.gameId : null;
    const summaryItemWord = getItemWord(firstGameId, totalItems);
    const summaryHtml = totalItems > 0
      ? `<div class="dashboard-skill-summary">${totalMastered} of ${totalItems} ${summaryItemWord} mastered across ${activeLevels} active level${activeLevels > 1 ? 's' : ''}</div>`
      : '';

    return `
      <div class="game-stat-card">
        <div class="game-stat-header">
          <span class="game-stat-icon">${skill.icon}</span>
          <div style="flex: 1">
            <span class="game-stat-title">${skill.name}</span>
            <div style="display:flex; gap: var(--space-sm); align-items: center; margin-top: 2px;">
              <span class="dashboard-subject-tag" style="background: ${subj.color}22; color: ${subj.color}; border: 1px solid ${subj.color}44">${subj.name}</span>
              <span style="font-size: var(--text-xs); color: var(--color-text-muted)">${skill.phase.name}</span>
            </div>
            ${summaryHtml}
          </div>
          ${skillStats.hasAnyGame ? renderDonut(skillStats.overallPct) : ''}
        </div>
        <div class="dashboard-levels">
          ${levelRows}
          ${lockedHtml}
        </div>
      </div>`;
  }

  // ── Pokemon Math progress card ──

  function renderPokemonMathProgress(allGameData) {
    const pmData = allGameData['pokemon-multiply'];
    if (!pmData) return '';
    const tiers = pmData.tiers;
    if (!tiers) return '';

    const MAX_TIERS = 10;
    const ops = [
      { id: 'multiply', symbol: '×', name: 'Multiplication' },
      { id: 'divide', symbol: '÷', name: 'Division' },
      { id: 'add', symbol: '+', name: 'Addition' },
      { id: 'subtract', symbol: '−', name: 'Subtraction' },
    ];

    const barsHtml = ops.map(op => {
      const tier = tiers[op.id] || 0;
      const pct = ((tier + 1) / MAX_TIERS * 100).toFixed(0);
      return `<div class="pm-tier-row">
        <span class="pm-tier-symbol">${op.symbol}</span>
        <span class="pm-tier-name">${op.name}</span>
        <div class="pm-tier-bar"><div class="pm-tier-fill" style="width: ${pct}%"></div></div>
        <span class="pm-tier-label">Tier ${tier + 1}</span>
      </div>`;
    }).join('');

    const owned = pmData.ownedPokemon ? pmData.ownedPokemon.length : 0;

    return `<div class="game-stat-card pokemon-math-progress">
      <div class="game-stat-header">
        <span class="game-stat-icon">⚡</span>
        <span class="game-stat-title">Pokemon Math — Difficulty Tiers</span>
      </div>
      ${barsHtml}
      <div class="pm-pokemon-count">🎮 ${owned} Pokemon collected</div>
    </div>`;
  }

  // ── Mario card (non-curriculum) ──

  function renderMarioCard(data) {
    const level = data.level || 1;
    const coins = data.coins || 0;
    const score = data.score || 0;
    return `
      <div class="game-stat-card">
        <div class="game-stat-header">
          <span class="game-stat-icon">🍄</span>
          <span class="game-stat-title">Super Mario Bros</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Level</span>
          <div class="stat-bar"><div class="stat-bar-fill" style="width: ${(level / 5) * 100}%; background: #4ade80;"></div></div>
          <span class="stat-value">${level} / 5</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Coins</span>
          <span class="stat-value">🪙 ${coins}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">High Score</span>
          <span class="stat-value">${score}</span>
        </div>
      </div>`;
  }

  // ── Render tab ──

  // ── Data management section ──

  function renderDataManagement(profileName, allGameData) {
    const gameIds = Object.keys(allGameData);
    if (!gameIds.length) return '';

    const rows = gameIds.map(id => {
      const meta = GAME_DISPLAY[id] || { icon: '🎮', title: id };
      return `<div class="data-mgmt-row">
        <span class="data-mgmt-game">${meta.icon} ${meta.title}</span>
        <button class="btn-reset" data-game="${id}">Reset</button>
      </div>`;
    }).join('');

    return `<div class="dashboard-subject-section">
      <h3 class="dashboard-subject-heading" style="color: var(--color-text-muted)">⚙️ Data Management</h3>
      <div class="game-stat-card dashboard-data-mgmt">
        ${rows}
        <button class="btn-reset-all" data-profile="${profileName}">Reset All Data</button>
      </div>
    </div>`;
  }

  async function handleGameReset(profileName, gameId) {
    const meta = GAME_DISPLAY[gameId] || { title: gameId };
    if (!confirm(`Reset all ${meta.title} data for ${profileName}?`)) return;

    Storage.clearGameForProfile(profileName, gameId);

    // Cloud cleanup (best-effort)
    if (typeof SyncEngine !== 'undefined' && SyncEngine.isActive()) {
      const profileId = await SyncEngine.getProfileId(profileName);
      if (profileId) await SyncEngine.deleteGame(profileId, gameId);
    }

    renderTab(profileName);
  }

  async function handleResetAll(profileName) {
    if (!confirm(`Reset ALL game data for ${profileName}? This cannot be undone.`)) return;

    Storage.clearAllForProfile(profileName);

    // Cloud cleanup (best-effort)
    if (typeof SyncEngine !== 'undefined' && SyncEngine.isActive()) {
      const profileId = await SyncEngine.getProfileId(profileName);
      if (profileId) await SyncEngine.deleteAllForProfile(profileId);
    }

    renderTab(profileName);
  }

  // ── Render tab ──

  function renderTab(profileName) {
    const content = document.querySelector('.dashboard-content');
    const allGameData = Storage.getAllForProfile(profileName);

    let html = '';
    let hasData = false;

    // Curriculum skills grouped by subject, filtered by selected grade
    const subjects = Curriculum.getSubjects();

    for (const [subjKey, subjMeta] of Object.entries(subjects)) {
      const grades = Curriculum.getSubjectGrades(subjKey);
      if (!grades.length) continue;

      initDefaultGrade(subjKey, allGameData);
      const gradeId = activeGrades[subjKey] || grades[0].id;
      const skills = Curriculum.getSkillsForSubjectGrade(subjKey, gradeId);

      let subjectHtml = '';
      for (const skill of skills) {
        const skillStats = Curriculum.computeSkillStats(allGameData, skill);
        hasData = true;
        subjectHtml += renderSkillCard(skill, skillStats, allGameData);
      }

      // Add Pokemon Math tier progress at top of math section
      if (subjKey === 'math') {
        subjectHtml = renderPokemonMathProgress(allGameData) + subjectHtml;
      }

      const stepperHtml = grades.length > 1 ? renderDashboardGradeStepper(subjKey, grades) : `<span style="font-size: var(--text-sm); color: var(--color-text-muted); margin-left: var(--space-md)">${grades[0].name}</span>`;

      html += `<div class="dashboard-subject-section">
        <h3 class="dashboard-subject-heading" style="color: ${subjMeta.color}">${subjMeta.icon} ${subjMeta.name} ${stepperHtml}</h3>
        ${subjectHtml}
      </div>`;
    }

    // Mario (non-curriculum)
    if (allGameData['mario-bros']) {
      hasData = true;
      html += `<div class="dashboard-subject-section">
        <h3 class="dashboard-subject-heading" style="color: #4ade80">🎮 Fun Games</h3>
        ${renderMarioCard(allGameData['mario-bros'])}
      </div>`;
    }

    // Data management
    if (hasData) {
      html += renderDataManagement(profileName, allGameData);
    }

    if (!hasData) {
      html = '<div class="no-data">No game data yet for ' + profileName + '. Time to play!</div>';
    }

    content.innerHTML = html;

    // Expand/collapse click handlers
    content.querySelectorAll('.dashboard-level-row.expandable').forEach(row => {
      row.addEventListener('click', () => {
        row.closest('.dashboard-level-group').classList.toggle('expanded');
      });
    });

    // Play link click handlers
    content.querySelectorAll('.dashboard-play-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.stopPropagation();
        const href = link.dataset.href;
        if (href) window.location.href = href;
      });
    });

    // Grade stepper click handlers
    content.querySelectorAll('.dashboard-grade-stepper').forEach(stepper => {
      const subj = stepper.dataset.subject;
      const grades = Curriculum.getSubjectGrades(subj);
      const idx = grades.findIndex(g => g.id === activeGrades[subj]);

      stepper.querySelector('.grade-prev').addEventListener('click', () => {
        if (idx > 0) { activeGrades[subj] = grades[idx - 1].id; renderTab(profileName); }
      });
      stepper.querySelector('.grade-next').addEventListener('click', () => {
        if (idx < grades.length - 1) { activeGrades[subj] = grades[idx + 1].id; renderTab(profileName); }
      });
    });

    // Reset button click handlers
    content.querySelectorAll('.btn-reset').forEach(btn => {
      btn.addEventListener('click', () => handleGameReset(profileName, btn.dataset.game));
    });
    const resetAllBtn = content.querySelector('.btn-reset-all');
    if (resetAllBtn) {
      resetAllBtn.addEventListener('click', () => handleResetAll(profileName));
    }
  }

  return {
    async open() {
      // Sync PIN from cloud so it works cross-device
      await Profile.syncPIN();
      // PIN gate
      if (Profile.hasPIN()) {
        const ok = await Profile.showPINPad(false);
        if (!ok) return;
      } else {
        const ok = await Profile.showPINPad(true);
        if (!ok) return;
      }
      this.show();
    },

    show() {
      document.getElementById('launcherScreen').style.display = 'none';
      const screen = document.querySelector('.dashboard-screen');
      screen.classList.add('active');

      // Set up tabs
      const tabs = screen.querySelectorAll('.dashboard-tab');
      tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.profile === activeTab);
        tab.onclick = () => {
          activeTab = tab.dataset.profile;
          tabs.forEach(t => t.classList.toggle('active', t === tab));
          renderTab(activeTab);
        };
      });

      renderTab(activeTab);
    },

    hide() {
      document.querySelector('.dashboard-screen').classList.remove('active');
      document.getElementById('launcherScreen').style.display = '';
    },
  };
})();
