/**
 * Parent Dashboard — shows per-kid mastery stats behind a PIN gate.
 */
const Dashboard = (() => {
  const GAME_META = {
    'unicorn-numbers': { title: 'Unicorn Numbers', icon: '\uD83E\uDD84', type: 'unicorn' },
    'pokemon-multiply': { title: 'Pokemon Multiply', icon: '\u26A1', type: 'pokemon' },
    'mario-bros': { title: 'Super Mario Bros', icon: '\uD83C\uDF44', type: 'mario' },
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

  function formatStrugglingItem(key, record, gameType) {
    const total = record.correct + record.wrong;
    if (gameType === 'pokemon') {
      return `<span class="chip-problem">${key.replace('*', '\u00D7')}</span><span class="chip-accuracy">(${record.correct}/${total})</span>`;
    }
    return `<span class="chip-problem">${key}</span><span class="chip-accuracy">(${record.correct}/${total})</span>`;
  }

  function renderGameCard(gameId, data) {
    const meta = GAME_META[gameId];
    if (!meta) return '';

    const adaptive = data.adaptive || {};
    const keys = Object.keys(adaptive);

    // Skip games with no adaptive data (mario-bros has no adaptive system)
    if (meta.type === 'mario') {
      const level = data.level || 1;
      const coins = data.coins || 0;
      const score = data.score || 0;
      return `
        <div class="game-stat-card">
          <div class="game-stat-header">
            <span class="game-stat-icon">${meta.icon}</span>
            <span class="game-stat-title">${meta.title}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Level</span>
            <div class="stat-bar"><div class="stat-bar-fill" style="width: ${(level / 5) * 100}%; background: #4ade80;"></div></div>
            <span class="stat-value">${level} / 5</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Coins</span>
            <span class="stat-value">\uD83E\uDE99 ${coins}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">High Score</span>
            <span class="stat-value">${score}</span>
          </div>
        </div>`;
    }

    // For educational games with adaptive data
    let mastered = 0, learning = 0, struggling = 0;
    const strugglingItems = [];

    keys.forEach(k => {
      const rec = adaptive[k];
      if (rec.box >= 3) mastered++;
      else if (rec.box >= 1) learning++;
      else {
        struggling++;
        strugglingItems.push({ key: k, record: rec });
      }
    });

    const total = mastered + learning + struggling;
    const masteryPct = total > 0 ? (mastered / total * 100) : 0;

    // Game-specific stats
    let extraStats = '';
    if (meta.type === 'pokemon') {
      const level = data.level || 1;
      const coins = data.coins || 0;
      const collection = data.collection ? (Array.isArray(data.collection) ? data.collection.length : 0) : 0;
      extraStats = `
        <div class="stat-row">
          <span class="stat-label">Level</span>
          <div class="stat-bar"><div class="stat-bar-fill" style="width: ${(level / 10) * 100}%; background: #4a9eff;"></div></div>
          <span class="stat-value">${level} / 10</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Coins</span>
          <span class="stat-value">\uD83E\uDE99 ${coins}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Pokemon</span>
          <span class="stat-value">${collection} caught</span>
        </div>`;
    } else if (meta.type === 'unicorn') {
      const level = data.level || 1;
      const stars = data.stars || 0;
      extraStats = `
        <div class="stat-row">
          <span class="stat-label">Level</span>
          <div class="stat-bar"><div class="stat-bar-fill" style="width: ${(level / 20) * 100}%; background: #d946ef;"></div></div>
          <span class="stat-value">${level} / 20</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Stars</span>
          <span class="stat-value">\u2B50 ${stars}</span>
        </div>`;
    }

    let strugglingHTML = '';
    if (strugglingItems.length) {
      const chips = strugglingItems
        .sort((a, b) => (a.record.correct / Math.max(1, a.record.correct + a.record.wrong)) -
                        (b.record.correct / Math.max(1, b.record.correct + b.record.wrong)))
        .slice(0, 12)
        .map(s => `<span class="struggling-chip">${formatStrugglingItem(s.key, s.record, meta.type)}</span>`)
        .join('');
      strugglingHTML = `
        <div class="struggling-section">
          <div class="struggling-title">Needs Practice (${strugglingItems.length})</div>
          <div class="struggling-chips">${chips}</div>
        </div>`;
    }

    return `
      <div class="game-stat-card">
        <div class="game-stat-header">
          <span class="game-stat-icon">${meta.icon}</span>
          <span class="game-stat-title">${meta.title}</span>
          ${renderDonut(masteryPct)}
        </div>
        ${extraStats}
        ${total > 0 ? renderMasteryBar(mastered, learning, struggling) : ''}
        ${strugglingHTML}
      </div>`;
  }

  function renderTab(profileName) {
    const content = document.querySelector('.dashboard-content');
    const data = Storage.getAllForProfile(profileName);

    const gameIds = Object.keys(GAME_META);
    let html = '';
    let hasData = false;

    gameIds.forEach(gid => {
      if (data[gid]) {
        hasData = true;
        html += renderGameCard(gid, data[gid]);
      }
    });

    if (!hasData) {
      html = '<div class="no-data">No game data yet for ' + profileName + '. Time to play!</div>';
    }

    content.innerHTML = html;
  }

  return {
    async open() {
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
      document.querySelector('.launcher').style.display = 'none';
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
      document.querySelector('.launcher').style.display = '';
    },
  };
})();
