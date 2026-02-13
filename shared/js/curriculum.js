/**
 * Curriculum logic module.
 * Reads CURRICULUM_DATA and provides helpers to organize by subject,
 * resolve adaptive keys, and compute mastery stats.
 */
const Curriculum = (() => {

  // ── Multiplication key generation ──

  /** Generate "AxB" key with smaller factor first (matches pokemon-multiply convention) */
  function factKey(a, b) {
    return `${Math.min(a, b)}x${Math.max(a, b)}`;
  }

  /**
   * Resolve a factorRule into an array of adaptive keys.
   *
   * Rules:
   *   { include: [2,5,10], maxFactor: 10 }
   *     → all "AxB" where at least one of A,B is in include, and both ≤ maxFactor
   *
   *   { include: [3,4], maxFactor: 10, exclude: [2,5,10] }
   *     → at least one factor in include, neither factor in exclude, both ≤ maxFactor
   *
   *   { squares: true, minFactor: 1, maxFactor: 9 }
   *     → "1x1", "2x2", ..., "9x9"
   */
  function resolveFactorRule(rule) {
    const keys = new Set();

    if (rule.squares) {
      const min = rule.minFactor || 1;
      const max = rule.maxFactor || 9;
      for (let n = min; n <= max; n++) {
        keys.add(factKey(n, n));
      }
      return [...keys];
    }

    const include = new Set(rule.include || []);
    const exclude = new Set(rule.exclude || []);
    const max = rule.maxFactor || 10;

    for (let a = 1; a <= max; a++) {
      for (let b = a; b <= max; b++) {
        // At least one factor must be in include set
        if (!include.has(a) && !include.has(b)) continue;
        // Neither factor in exclude set
        if (exclude.has(a) || exclude.has(b)) continue;
        keys.add(factKey(a, b));
      }
    }
    return [...keys];
  }

  /**
   * Resolve the adaptive keys for a level's game mapping.
   * Returns an array of key strings, or empty array if no mapping.
   */
  function resolveAdaptiveKeys(gameMapping) {
    if (!gameMapping) return [];
    if (gameMapping.adaptiveKeys) return gameMapping.adaptiveKeys;
    if (gameMapping.factorRule) return resolveFactorRule(gameMapping.factorRule);
    return [];
  }

  // ── Subject tracks ──

  /**
   * Group all skills by subject across all phases, ordered by phase progression.
   * Returns: { math: [skill, skill, ...], hebrew: [...], english: [...], logic: [...] }
   * Each skill is augmented with .phase (reference to parent phase).
   */
  function getSubjectTracks() {
    const tracks = {};
    for (const subj of Object.keys(CURRICULUM_DATA.subjects)) {
      tracks[subj] = [];
    }
    for (const phase of CURRICULUM_DATA.phases) {
      for (const skill of phase.skills) {
        if (tracks[skill.subject]) {
          tracks[skill.subject].push({ ...skill, phase });
        }
      }
    }
    return tracks;
  }

  // ── Stats computation ──

  /**
   * Compute stats for a single curriculum level from adaptive records.
   * @param {Object} allGameData  — { [gameId]: { adaptive: {...}, ... } }
   * @param {Object} level        — curriculum level object
   * @returns {{ mastered, learning, struggling, notStarted, total, pct, stars, strugglingItems[] }}
   */
  function computeLevelStats(allGameData, level) {
    const keys = resolveAdaptiveKeys(level.gameMapping);
    if (!keys.length) {
      return { mastered: 0, learning: 0, struggling: 0, notStarted: 0, total: 0, pct: 0, stars: 0, strugglingItems: [], hasGame: false };
    }

    const gameId = level.gameMapping.gameId;
    const adaptive = (allGameData[gameId] && allGameData[gameId].adaptive) || {};

    let mastered = 0, learning = 0, struggling = 0, notStarted = 0;
    const strugglingItems = [];
    const allItems = [];

    for (const key of keys) {
      const rec = adaptive[key];
      if (!rec || (rec.correct === 0 && rec.wrong === 0)) {
        notStarted++;
        allItems.push({ key, status: 'not-started', record: rec || null });
      } else if (rec.box >= 3) {
        mastered++;
        allItems.push({ key, status: 'mastered', record: rec });
      } else if (rec.box >= 1) {
        learning++;
        allItems.push({ key, status: 'learning', record: rec });
      } else {
        struggling++;
        strugglingItems.push({ key, record: rec });
        allItems.push({ key, status: 'struggling', record: rec });
      }
    }

    const total = keys.length;
    const pct = total > 0 ? (mastered / total) * 100 : 0;

    let stars = 0;
    if (pct >= 90) stars = 3;
    else if (pct >= 60) stars = 2;
    else if (pct >= 25) stars = 1;

    // Sort struggling items by accuracy ascending (worst first)
    strugglingItems.sort((a, b) => {
      const aAcc = a.record.correct / Math.max(1, a.record.correct + a.record.wrong);
      const bAcc = b.record.correct / Math.max(1, b.record.correct + b.record.wrong);
      return aAcc - bAcc;
    });

    return { mastered, learning, struggling, notStarted, total, pct, stars, strugglingItems, allItems, hasGame: true };
  }

  /**
   * Compute stats for an entire skill (aggregates its 5 levels).
   */
  function computeSkillStats(allGameData, skill) {
    const levelStats = skill.levels.map(level => ({
      level,
      stats: computeLevelStats(allGameData, level),
    }));

    const mapped = levelStats.filter(ls => ls.stats.hasGame);
    const totalStars = mapped.reduce((sum, ls) => sum + ls.stats.stars, 0);
    const maxStars = mapped.length * 3;

    const totals = mapped.reduce((acc, ls) => {
      acc.mastered += ls.stats.mastered;
      acc.total += ls.stats.total;
      return acc;
    }, { mastered: 0, total: 0 });

    const overallPct = totals.total > 0 ? (totals.mastered / totals.total) * 100 : 0;
    const hasAnyGame = mapped.length > 0;

    return { levelStats, totalStars, maxStars, overallPct, hasAnyGame };
  }

  /**
   * Compute stats for a subject track.
   */
  function computeTrackStats(allGameData, subject) {
    const tracks = getSubjectTracks();
    const skills = tracks[subject] || [];
    const skillStats = skills.map(skill => ({
      skill,
      stats: computeSkillStats(allGameData, skill),
    }));

    const totalStars = skillStats.reduce((sum, ss) => sum + ss.stats.totalStars, 0);
    const maxStars = skillStats.reduce((sum, ss) => sum + ss.stats.maxStars, 0);

    return { skillStats, totalStars, maxStars };
  }

  // ── Game URL lookup (for "Play" buttons on level nodes) ──

  /** Find the game path from the GAMES array in index.html */
  function getGamePath(gameId) {
    if (typeof GAMES !== 'undefined') {
      const game = GAMES.find(g => g.id === gameId);
      if (game && game.path) return game.path;
    }
    return null;
  }

  // ── Public API ──

  return {
    getSubjects: () => CURRICULUM_DATA.subjects,
    getPhases: () => CURRICULUM_DATA.phases,
    getSubjectTracks,
    resolveAdaptiveKeys,
    computeLevelStats,
    computeSkillStats,
    computeTrackStats,
    getGamePath,
  };
})();
