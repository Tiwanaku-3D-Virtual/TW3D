export function createNarratorAudio(options = {}) {
  const audio = new Audio('assets/audio/voice_preview_narradora%20de%20god%20of%20war.mp3');
  audio.preload = 'auto';

  const buttons = options.buttons || [];
  const progressBar = options.progressBar || null;
  const progressContainer = options.progressContainer || null;

  function updateButtons(playing) {
    buttons.forEach((btn) => {
      if (!btn) return;
      btn.classList.toggle('is-playing', playing);
      btn.setAttribute('aria-pressed', String(playing));
      const icon = btn.querySelector('.audio-icon');
      const label = btn.querySelector('.audio-label');
      if (icon && label) {
        icon.textContent = playing ? '⏸' : '▶';
        label.textContent = playing ? 'Pausar narración' : 'Escuchar narración de la guía';
      } else {
        btn.textContent = playing ? '⏸️ Pausar voz' : '🎙️ Narradora';
      }
    });
    if (progressContainer) {
      progressContainer.hidden = !playing && audio.currentTime === 0;
    }
  }

  audio.addEventListener('timeupdate', () => {
    if (progressBar && audio.duration) {
      const pct = (audio.currentTime / audio.duration) * 100;
      progressBar.style.width = `${pct}%`;
    }
  });

  audio.addEventListener('play', () => updateButtons(true));
  audio.addEventListener('pause', () => updateButtons(false));
  audio.addEventListener('ended', () => {
    audio.currentTime = 0;
    updateButtons(false);
  });

  async function toggle() {
    if (audio.paused) {
      try {
        await audio.play();
      } catch (err) {
        console.warn('Interacción requerida para audio:', err);
      }
    } else {
      audio.pause();
    }
  }

  buttons.forEach((btn) => {
    if (btn) btn.addEventListener('click', toggle);
  });

  return {
    audio,
    toggle,
    play: async () => {
      try {
        await audio.play();
      } catch (err) {
        console.warn('Interacción requerida:', err);
      }
    },
    pause: () => audio.pause(),
    isPlaying: () => !audio.paused
  };
}

export function createProximityAudio(sources, isNarratorPlaying = () => false) {
  const audio = new Audio();
  audio.preload = 'auto';
  let currentKey = null;
  let pendingKey = null;
  let unlocked = false;
  let unlockPromise = null;

  function unlock() {
    if (unlocked || unlockPromise) return unlockPromise;
    const firstSource = Object.values(sources)[0];
    if (!firstSource) return Promise.resolve();

    audio.muted = true;
    audio.src = firstSource;
    audio.load();
    unlockPromise = audio.play()
      .then(() => {
        audio.pause();
        if (audio.readyState > 0) audio.currentTime = 0;
        audio.muted = false;
        currentKey = null;
        unlocked = true;
      })
      .catch(() => {
        audio.muted = false;
      })
      .finally(() => {
        unlockPromise = null;
      });
    return unlockPromise;
  }

  function pause() {
    audio.pause();
  }

  function stop() {
    audio.pause();
    if (audio.readyState > 0) audio.currentTime = 0;
    currentKey = null;
    pendingKey = null;
  }

  async function playFor(key) {
    const source = sources[key];
    if (!source) {
      stop();
      return;
    }

    pendingKey = key;
    if (isNarratorPlaying()) {
      pause();
      return;
    }
    if (unlockPromise) await unlockPromise;
    if (pendingKey !== key || isNarratorPlaying()) return;
    pendingKey = null;

    if (currentKey === key && !audio.paused) return;
    if (currentKey !== key) {
      audio.pause();
      if (audio.readyState > 0) audio.currentTime = 0;
      audio.src = source;
      audio.load();
      currentKey = key;
    }

    try {
      await audio.play();
    } catch (error) {
      if (currentKey === key) currentKey = null;
      console.warn(`No se pudo reproducir el audio de proximidad para ${key}:`, error);
    }
  }

  audio.addEventListener('ended', () => {
    currentKey = null;
    if (pendingKey && !isNarratorPlaying()) {
      const nextKey = pendingKey;
      pendingKey = null;
      playFor(nextKey);
    }
  });

  return {
    audio,
    unlock,
    playFor,
    pause,
    stop,
    isPlayingFor: (key) => currentKey === key && !audio.paused
  };
}
