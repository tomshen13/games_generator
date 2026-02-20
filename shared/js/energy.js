/**
 * Energy — Daily time-gating for non-educational games (Mario).
 * Kids get BASE_MINUTES free daily. Completing educational sessions earns more.
 * Parent PIN grants unlimited for the day.
 */
const Energy = (() => {
  const GAME_ID = '_shared';
  const FIELD = 'energy';
  const BASE_MINUTES = 0;
  const MAX_MINUTES = 60;
  const EARN_PER_SESSION = 5;
  const MIN_PLAY_MINUTES = 5;

  let timerInterval = null;
  let sessionStart = null;
  let onTickCb = null;
  let onDepletedCb = null;

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function getState() {
    const saved = Storage.load(GAME_ID, FIELD, null);
    if (!saved || saved.date !== today()) {
      // New day — reset to base
      const fresh = { date: today(), remaining: BASE_MINUTES, unlimited: false };
      saveState(fresh);
      return fresh;
    }
    return saved;
  }

  function saveState(s) {
    Storage.save(GAME_ID, FIELD, s);
  }

  /** Returns remaining minutes (Infinity if unlimited) */
  function getRemaining() {
    const s = getState();
    if (s.unlimited) return Infinity;
    // Account for currently running timer
    if (sessionStart) {
      const elapsed = (Date.now() - sessionStart) / 60000;
      return Math.max(0, s.remaining - elapsed);
    }
    return s.remaining;
  }

  function isUnlimited() {
    return getState().unlimited;
  }

  /**
   * Start tracking elapsed time for a fun-game session.
   * @param {function} onTick — called every 1s with remaining minutes
   * @param {function} onDepleted — called when energy hits 0
   */
  function startTimer(onTick, onDepleted) {
    stopTimer(); // clean up any previous timer
    const s = getState();
    if (s.unlimited) return; // no timer needed

    sessionStart = Date.now();
    onTickCb = onTick;
    onDepletedCb = onDepleted;

    timerInterval = setInterval(() => {
      const elapsed = (Date.now() - sessionStart) / 60000;
      const remaining = Math.max(0, s.remaining - elapsed);

      if (onTickCb) onTickCb(remaining);

      if (remaining <= 0) {
        stopTimer();
        s.remaining = 0;
        saveState(s);
        if (onDepletedCb) onDepletedCb();
      }
    }, 1000);
  }

  /** Stop the timer and persist elapsed time. */
  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    if (sessionStart) {
      const elapsed = (Date.now() - sessionStart) / 60000;
      const s = getState();
      if (!s.unlimited) {
        s.remaining = Math.max(0, s.remaining - elapsed);
        saveState(s);
      }
      sessionStart = null;
    }
    onTickCb = null;
    onDepletedCb = null;
  }

  /** Check if there's enough energy to play a fun game. */
  function canPlay() {
    return getRemaining() >= MIN_PLAY_MINUTES;
  }

  /** Earn energy from completing an educational session. */
  function earnMinutes(n) {
    if (typeof n !== 'number') n = EARN_PER_SESSION;
    const s = getState();
    s.remaining = Math.min(MAX_MINUTES, s.remaining + n);
    saveState(s);
    console.log(`[Energy] Earned +${n} min, now ${s.remaining.toFixed(1)} min`);
  }

  /**
   * Parent PIN bypass — shows PIN pad and grants unlimited for today.
   * @returns {Promise<boolean>} true if bypass granted
   */
  async function parentBypass() {
    if (typeof Profile === 'undefined') return false;

    let ok;
    if (Profile.hasPIN()) {
      ok = await Profile.showPINPad(false); // verify existing PIN
    } else {
      ok = await Profile.showPINPad(true);  // first time: set up PIN
    }

    if (ok) {
      const s = getState();
      s.unlimited = true;
      saveState(s);
      console.log('[Energy] Parent bypass granted — unlimited for today');
      return true;
    }
    return false;
  }

  return {
    getRemaining,
    isUnlimited,
    canPlay,
    startTimer,
    stopTimer,
    earnMinutes,
    parentBypass,
    BASE_MINUTES,
    MAX_MINUTES,
    EARN_PER_SESSION,
    MIN_PLAY_MINUTES,
  };
})();
