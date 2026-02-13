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

  function formatKey(key, gameId) {
    if (gameId === 'pokemon-multiply') return key.replace('x', ' × ');
    return key;
  }

  // ── Curriculum-based skill card ──

  function renderSkillCard(skill, skillStats, allGameData) {
    const subjects = Curriculum.getSubjects();
    const subj = subjects[skill.subject] || {};

    // Separate mapped levels from locked ones
    const mappedLevels = skillStats.levelStats.filter(ls => ls.stats.hasGame);
    const lockedCount = skillStats.levelStats.filter(ls => !ls.stats.hasGame).length;

    const levelRows = mappedLevels.map(({ level, stats }) => {
      const total = stats.mastered + stats.learning + stats.struggling;
      const barHtml = total > 0 ? `
        <div class="dashboard-tier-bar">
          <div class="mastery-segment mastery-mastered" style="width: ${(stats.mastered / stats.total * 100)}%"></div>
          <div class="mastery-segment mastery-learning" style="width: ${(stats.learning / stats.total * 100)}%"></div>
          <div class="mastery-segment mastery-struggling" style="width: ${(stats.struggling / stats.total * 100)}%"></div>
        </div>` : '<div class="dashboard-tier-bar"></div>';

      // Struggling items for this level
      let strugglingHtml = '';
      if (stats.strugglingItems.length) {
        const gameId = level.gameMapping.gameId;
        const chips = stats.strugglingItems.slice(0, 8).map(s => {
          const t = s.record.correct + s.record.wrong;
          return `<span class="struggling-chip"><span class="chip-problem">${formatKey(s.key, gameId)}</span><span class="chip-accuracy">(${s.record.correct}/${t})</span></span>`;
        }).join('');
        strugglingHtml = `<div class="struggling-section"><div class="struggling-title">Needs practice:</div><div class="struggling-chips">${chips}</div></div>`;
      }

      const stars = '★'.repeat(stats.stars) + '☆'.repeat(3 - stats.stars);
      return `
        <div class="dashboard-level-row">
          <span class="dashboard-level-num">${level.level}</span>
          <span class="dashboard-level-name">${level.name}</span>
          ${barHtml}
          <span class="dashboard-level-pct">${Math.round(stats.pct)}%</span>
          <span class="dashboard-level-stars">${stars}</span>
        </div>
        ${strugglingHtml}`;
    }).join('');

    // Collapsed locked levels summary
    const lockedHtml = lockedCount > 0
      ? `<div class="dashboard-locked-summary">🔒 ${lockedCount} more level${lockedCount > 1 ? 's' : ''} coming soon</div>`
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
