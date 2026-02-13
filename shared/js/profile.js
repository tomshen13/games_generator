/**
 * Profile selector and PIN management.
 * Used in launcher (index.html) and auto-inits in game pages.
 */
const Profile = (() => {
  const PIN_HASH_KEY = 'kids_games__parent_pin_hash';
  const PROFILES = [
    { name: 'Dan', emoji: '\uD83D\uDC66', color: '#4a9eff' },
    { name: 'Emma', emoji: '\uD83D\uDC67', color: '#d946ef' },
  ];

  async function hashPin(pin) {
    const data = new TextEncoder().encode(pin);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function getStoredPinHash() {
    return localStorage.getItem(PIN_HASH_KEY);
  }

  return {
    PROFILES,

    /** Initialize profile from localStorage (for game pages) */
    autoInit() {
      const name = Storage.getProfile();
      if (name) {
        this.addGameBadge(name);
      }
    },

    addGameBadge(name) {
      if (document.querySelector('.game-profile-badge')) return;
      const badge = document.createElement('div');
      badge.className = 'game-profile-badge';
      badge.textContent = name;
      document.body.appendChild(badge);
    },

    /** Select a profile (called from launcher) */
    selectProfile(name) {
      Storage.migrateUnprefixed(name);
      Storage.setProfile(name);
      // Pull cloud data in background — don't block UI
      Storage.pullFromCloud().catch(() => {});
    },

    /** Check if a PIN has been set */
    hasPIN() {
      return getStoredPinHash() !== null;
    },

    /** Set a new PIN */
    async setPIN(pin) {
      const hash = await hashPin(pin);
      localStorage.setItem(PIN_HASH_KEY, hash);
    },

    /** Verify a PIN */
    async verifyPIN(pin) {
      const stored = getStoredPinHash();
      if (!stored) return true;
      const hash = await hashPin(pin);
      return hash === stored;
    },

    /** Show PIN pad modal and return a promise that resolves to true/false */
    showPINPad(isSetup = false) {
      return new Promise(resolve => {
        const overlay = document.getElementById('pinOverlay');
        const title = overlay.querySelector('h3');
        const dots = overlay.querySelectorAll('.pin-dot');
        const errorEl = overlay.querySelector('.pin-error');
        const cancelBtn = overlay.querySelector('.pin-cancel');
        let pin = '';
        let confirmPin = '';
        let stage = isSetup ? 'set' : 'verify'; // set → confirm → done

        title.textContent = isSetup ? 'Set a 4-digit Parent PIN' : 'Enter Parent PIN';
        errorEl.textContent = '';
        dots.forEach(d => d.classList.remove('filled'));
        overlay.hidden = false;

        function updateDots() {
          const current = stage === 'confirm' ? confirmPin : pin;
          dots.forEach((d, i) => d.classList.toggle('filled', i < current.length));
        }

        async function handleComplete() {
          if (stage === 'set') {
            stage = 'confirm';
            confirmPin = '';
            title.textContent = 'Confirm your PIN';
            errorEl.textContent = '';
            updateDots();
          } else if (stage === 'confirm') {
            if (confirmPin === pin) {
              await Profile.setPIN(pin);
              cleanup(true);
            } else {
              errorEl.textContent = 'PINs don\'t match. Try again.';
              pin = '';
              confirmPin = '';
              stage = 'set';
              title.textContent = 'Set a 4-digit Parent PIN';
              updateDots();
            }
          } else {
            const ok = await Profile.verifyPIN(pin);
            if (ok) {
              cleanup(true);
            } else {
              errorEl.textContent = 'Wrong PIN. Try again.';
              pin = '';
              updateDots();
            }
          }
        }

        function onKey(e) {
          const btn = e.target.closest('.pin-key');
          if (!btn) return;
          const val = btn.dataset.val;
          const ref = stage === 'confirm' ? 'confirmPin' : 'pin';

          if (val === 'back') {
            if (stage === 'confirm') confirmPin = confirmPin.slice(0, -1);
            else pin = pin.slice(0, -1);
            updateDots();
            return;
          }

          if (stage === 'confirm') {
            if (confirmPin.length < 4) confirmPin += val;
          } else {
            if (pin.length < 4) pin += val;
          }
          updateDots();

          const current = stage === 'confirm' ? confirmPin : pin;
          if (current.length === 4) {
            setTimeout(handleComplete, 200);
          }
        }

        function cleanup(result) {
          overlay.hidden = true;
          overlay.querySelector('.pin-numpad').removeEventListener('click', onKey);
          cancelBtn.removeEventListener('click', onCancel);
          resolve(result);
        }

        function onCancel() {
          cleanup(false);
        }

        overlay.querySelector('.pin-numpad').addEventListener('click', onKey);
        cancelBtn.addEventListener('click', onCancel);
      });
    },
  };
})();
