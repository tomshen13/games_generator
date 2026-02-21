/**
 * Kid-facing skills screen.
 * Shows curriculum organized by subject tracks with level nodes.
 * Each subject has a grade stepper to navigate between grades.
 */
const KidSkills = (() => {
  let activeSubject = 'math';
  let activeGrades = {}; // { subject: phaseId }

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

    const gameAttrs = level.gameMapping
      ? `data-game="${level.gameMapping.gameId}" data-mode="${level.gameMapping.mode || ''}"`
      : '';

    return `
      <div class="level-node ${state}" ${gameAttrs}>
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
          <span class="skill-card-stars">${starsText}</span>
        </div>
        <div class="level-path">
          ${nodesHtml}
        </div>
      </div>`;
  }

  function renderGradeStepper(subject) {
    const grades = Curriculum.getSubjectGrades(subject);
    if (!grades.length) return '';

    const currentId = activeGrades[subject];
    const idx = grades.findIndex(g => g.id === currentId);
    const grade = grades[idx] || grades[0];
    const atStart = idx <= 0;
    const atEnd = idx >= grades.length - 1;

    return `
      <div class="grade-stepper" data-subject="${subject}">
        <button class="grade-arrow grade-prev" ${atStart ? 'disabled' : ''}>◀</button>
        <span class="grade-label">${grade.name} (${grade.hebrewName})</span>
        <button class="grade-arrow grade-next" ${atEnd ? 'disabled' : ''}>▶</button>
      </div>`;
  }

  function initDefaultGrade(subject, allGameData) {
    if (activeGrades[subject]) return;
    const grades = Curriculum.getSubjectGrades(subject);
    if (!grades.length) return;

    // Default to first grade with game data, or first grade
    for (const grade of grades) {
      const skills = Curriculum.getSkillsForSubjectGrade(subject, grade.id);
      for (const skill of skills) {
        const stats = Curriculum.computeSkillStats(allGameData, skill);
        if (stats.hasAnyGame) {
          activeGrades[subject] = grade.id;
          return;
        }
      }
    }
    activeGrades[subject] = grades[0].id;
  }

  function renderPokemonMathTiers(allGameData) {
    const pmData = allGameData['pokemon-multiply'];
    if (!pmData || !pmData.tiers) return '';

    const tiers = pmData.tiers;
    const ops = [
      { id: 'multiply', symbol: '×' },
      { id: 'divide', symbol: '÷' },
      { id: 'add', symbol: '+' },
      { id: 'subtract', symbol: '−' },
    ];

    const badges = ops.map(op => {
      const tier = tiers[op.id] || 0;
      return `<span class="pm-tier-badge">${op.symbol} <strong>${tier + 1}</strong></span>`;
    }).join('');

    return `<div class="pm-tiers-bar">
      <span class="pm-tiers-label">⚡ Tier</span>
      ${badges}
    </div>`;
  }

  function render() {
    const profileName = Storage.getProfile();
    if (!profileName) return;

    const allGameData = Storage.getAllForProfile(profileName);
    const subjects = Curriculum.getSubjects();

    // Init default grades
    for (const subj of Object.keys(subjects)) {
      initDefaultGrade(subj, allGameData);
    }

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

    // Render grade stepper + skill cards for active subject
    const content = document.getElementById('skillsContent');
    const grades = Curriculum.getSubjectGrades(activeSubject);
    const subjectColor = subjects[activeSubject].color;

    if (!grades.length) {
      content.innerHTML = `
        <div class="skills-empty">
          <span class="skills-empty-icon">🌟</span>
          <p>Coming soon!</p>
        </div>`;
      return;
    }

    const gradeId = activeGrades[activeSubject] || grades[0].id;
    const skills = Curriculum.getSkillsForSubjectGrade(activeSubject, gradeId);

    let html = renderGradeStepper(activeSubject);

    // Show Pokemon Math tier indicators for math tab
    if (activeSubject === 'math') {
      html += renderPokemonMathTiers(allGameData);
    }

    for (const skill of skills) {
      const skillStats = Curriculum.computeSkillStats(allGameData, skill);
      html += renderSkillCard(skill, skillStats, subjectColor);
    }

    content.innerHTML = html;

    // Grade stepper click handlers
    const stepper = content.querySelector('.grade-stepper');
    if (stepper) {
      const prevBtn = stepper.querySelector('.grade-prev');
      const nextBtn = stepper.querySelector('.grade-next');
      const idx = grades.findIndex(g => g.id === gradeId);

      prevBtn.addEventListener('click', () => {
        if (idx > 0) {
          activeGrades[activeSubject] = grades[idx - 1].id;
          render();
        }
      });
      nextBtn.addEventListener('click', () => {
        if (idx < grades.length - 1) {
          activeGrades[activeSubject] = grades[idx + 1].id;
          render();
        }
      });
    }

    // Add click handlers for available level nodes
    content.querySelectorAll('.level-node.available, .level-node.in-progress').forEach(node => {
      const gameId = node.dataset.game;
      if (!gameId) return;
      const mode = node.dataset.mode;
      const path = Curriculum.getGamePath(gameId);
      if (!path) return;
      const url = mode ? `${path}?mode=${encodeURIComponent(mode)}` : path;
      node.style.cursor = 'pointer';
      node.addEventListener('click', () => {
        window.location.href = url;
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
