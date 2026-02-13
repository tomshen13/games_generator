/**
 * Kid-facing skills screen.
 * Shows curriculum organized by subject tracks with level nodes.
 */
const KidSkills = (() => {
  let activeSubject = 'math';

  function renderStars(count, max) {
    max = max || 3;
    let html = '';
    for (let i = 0; i < max; i++) {
      html += i < count
        ? '<span class="star-filled">★</span>'
        : '<span class="star-empty">★</span>';
    }
    return html;
  }

  function getLevelState(levelStats) {
    if (!levelStats.hasGame) return 'locked';
    const attempted = levelStats.mastered + levelStats.learning + levelStats.struggling;
    if (attempted === 0) return 'available';
    if (levelStats.stars >= 3) return 'mastered';
    return 'in-progress';
  }

  function getLevelDotContent(state, stars) {
    if (state === 'locked') return '🔒';
    if (state === 'mastered') return '⭐';
    if (state === 'in-progress') return stars > 0 ? stars : '◐';
    return '○';
  }

  function renderLevelNode(levelStat, subjectColor) {
    const { level, stats } = levelStat;
    const state = getLevelState(stats);
    const dot = getLevelDotContent(state, stats.stars);

    let starsHtml = '';
    if (stats.hasGame && state !== 'locked') {
      starsHtml = `<div class="level-stars">${renderStars(stats.stars)}</div>`;
    }

    return `
      <div class="level-node ${state}" ${level.gameMapping ? `data-game="${level.gameMapping.gameId}"` : ''}>
        <div class="level-dot">${dot}</div>
        <div class="level-label">${level.name}</div>
        ${starsHtml}
      </div>`;
  }

  function renderSkillCard(skill, skillStats, subjectColor) {
    const allLocked = !skillStats.hasAnyGame;
    const starsText = skillStats.hasAnyGame
      ? `${skillStats.totalStars}/${skillStats.maxStars} ★`
      : '🔒';

    const nodesHtml = skillStats.levelStats
      .map(ls => renderLevelNode(ls, subjectColor))
      .join('');

    return `
      <div class="skill-card ${allLocked ? 'all-locked' : ''} animate-fade-up" style="--subject-color: ${subjectColor}">
        <div class="skill-card-header">
          <span class="skill-card-icon">${skill.icon}</span>
          <span class="skill-card-title">${skill.name}</span>
          <span class="skill-card-phase">${skill.phase.name}</span>
          <span class="skill-card-stars">${starsText}</span>
        </div>
        <div class="level-path">
          ${nodesHtml}
        </div>
      </div>`;
  }

  function render() {
    const profileName = Storage.getProfile();
    if (!profileName) return;

    const allGameData = Storage.getAllForProfile(profileName);
    const subjects = Curriculum.getSubjects();
    const tracks = Curriculum.getSubjectTracks();

    // Render subject tabs
    const tabsEl = document.getElementById('subjectTabs');
    tabsEl.innerHTML = Object.entries(subjects).map(([key, subj]) => {
      const isActive = key === activeSubject;
      return `
        <button class="subject-tab ${isActive ? 'active' : ''}"
                data-subject="${key}"
                style="--tab-color: ${subj.color}22; --tab-border: ${subj.color}">
          ${subj.icon} ${subj.name}
        </button>`;
    }).join('');

    tabsEl.querySelectorAll('.subject-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        activeSubject = btn.dataset.subject;
        render();
      });
    });

    // Render skill cards for active subject
    const content = document.getElementById('skillsContent');
    const skills = tracks[activeSubject] || [];
    const subjectColor = subjects[activeSubject].color;

    if (!skills.length) {
      content.innerHTML = `
        <div class="skills-empty">
          <span class="skills-empty-icon">🌟</span>
          <p>Coming soon!</p>
        </div>`;
      return;
    }

    let html = '';
    for (const skill of skills) {
      const skillStats = Curriculum.computeSkillStats(allGameData, skill);
      html += renderSkillCard(skill, skillStats, subjectColor);
    }

    content.innerHTML = html;

    // Add click handlers for available level nodes
    content.querySelectorAll('.level-node.available, .level-node.in-progress').forEach(node => {
      const gameId = node.dataset.game;
      if (!gameId) return;
      const path = Curriculum.getGamePath(gameId);
      if (!path) return;
      node.style.cursor = 'pointer';
      node.addEventListener('click', () => {
        window.location.href = path;
      });
    });
  }

  return {
    show() {
      document.getElementById('launcherScreen').style.display = 'none';
      const screen = document.getElementById('skillsScreen');
      screen.style.display = '';
      render();
    },

    hide() {
      document.getElementById('skillsScreen').style.display = 'none';
      document.getElementById('launcherScreen').style.display = '';
    },
  };
})();
