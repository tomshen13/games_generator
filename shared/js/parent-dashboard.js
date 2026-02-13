/**
 * Parent Dashboard — shows per-kid mastery stats behind a PIN gate.
 * Organized by curriculum skills with per-level breakdowns.
 */
const Dashboard = (() => {
  const GAME_META = {
    'mario-bros': { title: 'Super Mario Bros', icon: '🍄', type: 'mario' },
  };

  let activeTab = 'Dan';

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
    if (gameId === 'pokemon-multiply') return key.replace('x', ' × ');
    if (gameId === 'unicorn-numbers') return `Number "${key}"`;
    if (gameId === 'unicorn-hebrew') return `Letter "${key}"`;
    return key;
  }

  function getGameTitle(gameId) {
    const titles = {
      'unicorn-numbers': '🦄 Unicorn Numbers',
      'unicorn-hebrew': '🦄 Unicorn Hebrew',
      'pokemon-multiply': '⚡ Pokemon Multiply',
    };
    return titles[gameId] || gameId;
  }

  function getItemWord(gameId, count) {
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
    if (stats.mastered > 0) legendParts.push(`<span><span class="legend-dot" style="background:#4ade80"></span> ${stats.mastered} ${getItemWord(gameId, stats.mastered)} mastered</span>`);
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
            const label = gameId === 'pokemon-multiply' ? item.key.replace('x', '×') : item.key;
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
      const gamePath = Curriculum.getGamePath(gameId);
      const gameTitle = getGameTitle(gameId);
      const gameLinkHtml = gamePath
        ? `<div class="dashboard-level-game"><span class="dashboard-game-name">${gameTitle}</span><a class="dashboard-play-link" data-href="${gamePath}">▶ Play</a></div>`
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

    // Collapsed locked levels summary
    const lockedHtml = lockedCount > 0
      ? `<div class="dashboard-locked-summary">🔒 ${lockedCount} more level${lockedCount > 1 ? 's' : ''} coming soon</div>`
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

  function renderTab(profileName) {
    const content = document.querySelector('.dashboard-content');
    const allGameData = Storage.getAllForProfile(profileName);

    let html = '';
    let hasData = false;

    // Curriculum skills grouped by subject
    const tracks = Curriculum.getSubjectTracks();
    const subjects = Curriculum.getSubjects();

    for (const [subjKey, subjMeta] of Object.entries(subjects)) {
      const skills = tracks[subjKey] || [];
      let subjectHtml = '';
      let subjectHasData = false;

      for (const skill of skills) {
        const skillStats = Curriculum.computeSkillStats(allGameData, skill);
        if (!skillStats.hasAnyGame) continue; // Skip fully locked skills in dashboard

        subjectHasData = true;
        hasData = true;
        subjectHtml += renderSkillCard(skill, skillStats, allGameData);
      }

      if (subjectHasData) {
        html += `<div class="dashboard-subject-section">
          <h3 class="dashboard-subject-heading" style="color: ${subjMeta.color}">${subjMeta.icon} ${subjMeta.name}</h3>
          ${subjectHtml}
        </div>`;
      }
    }

    // Mario (non-curriculum)
    if (allGameData['mario-bros']) {
      hasData = true;
      html += `<div class="dashboard-subject-section">
        <h3 class="dashboard-subject-heading" style="color: #4ade80">🎮 Fun Games</h3>
        ${renderMarioCard(allGameData['mario-bros'])}
      </div>`;
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
