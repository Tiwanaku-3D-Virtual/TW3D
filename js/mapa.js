import * as THREE from 'three';
import { createScene } from './escena.js';
import { createAmbiente } from './ambiente.js';
import { createNarratorAudio, createProximityAudio } from './ambiente-sonoro.js';
import { createSitio } from './estructuras/sitio.js';
import { createJugador } from './jugador.js';
import { addExistingSiteModels } from './modelos-sitio.js';
import { info } from './info.js';
import { CinematicUpgrade } from './cinematic-engine.js';
import { createTorchSystem } from './antorchas.js';

let animationFrame = null;
function requestRender() {
  if (animationFrame === null) animationFrame = requestAnimationFrame(animate);
}

// Elementos de la pantalla de carga
const loadingScreen = document.querySelector('#loading-screen');
const loadingBar = document.querySelector('#loading-bar');
const loadingStatus = document.querySelector('#loading-status');

function setLoadProgress(percent, text) {
  const p = Math.min(Math.max(percent, 0), 100);
  if (loadingBar) {
    loadingBar.style.transform = `scaleX(${p / 100})`;
  }
  if (loadingStatus && text) loadingStatus.textContent = text;
}

let loadingFinished = false;
function finishLoading() {
  if (loadingFinished) return;
  loadingFinished = true;
  setLoadProgress(100, '¡Sitio arqueológico listo!');
  setTimeout(() => {
    if (loadingScreen) {
      loadingScreen.classList.add('fade-out');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 750);
    }
  }, 350);
}

// Progreso nativo del LoadingManager de Three.js
THREE.DefaultLoadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
  const pct = Math.min((itemsLoaded / itemsTotal) * 85 + 10, 95);
  const name = url.split('/').pop().split('?')[0] || 'recursos';
  setLoadProgress(pct, `Cargando ${name}… ${Math.round(pct)}%`);
};
THREE.DefaultLoadingManager.onLoad = requestRender;

const container = document.querySelector('#map-canvas');
const { scene, camera, renderer, controls, sun } = createScene(container);

// Motor de iluminación y atmósfera ceremonial (nitidez nativa sin pases de difuminación/film)
const cinematic = new CinematicUpgrade({
  scene,
  camera,
  renderer,
  controls
});

// Inicialización asíncrona del sistema de antorchas ceremoniales tras el primer render
setTimeout(() => {
  createTorchSystem(scene, camera).then((torches) => {
    cinematic.torchSystem = torches;
    torches.setAtmosphere(cinematic.currentMode);
    requestRender();
  }).catch((e) => console.warn('Aviso en antorchas:', e));
}, 120);

controls.addEventListener('change', requestRender);
controls.addEventListener('start', requestRender);
controls.addEventListener('end', requestRender);
addEventListener('resize', requestRender);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) requestRender();
});
const site = createSitio();
scene.add(site);

// Carga asíncrona y progresiva por fases con cesión del hilo principal
// Se difiere el arranque para garantizar que el DOM inicial y pantalla de carga pinten primero (FCP < 100ms)
function startProgressiveLoading() {
  addExistingSiteModels(site, () => {
    requestRender();
  }).then(async () => {
    if (renderer && typeof renderer.compileAsync === 'function') {
      try {
        await renderer.compileAsync(scene, camera);
      } catch (e) {
        console.warn('compileAsync omitido:', e);
      }
    }
    finishLoading();
  }).catch((err) => {
    console.warn('Carga progresiva completada con avisos:', err);
    finishLoading();
  });
}

// Respaldo de seguridad prolongado (25s) para conexiones móviles lentas
setTimeout(finishLoading, 25000);

// Difiere el inicio de descargas y procesamiento hasta después del primer pintado del DOM (FCP < 100ms)
requestAnimationFrame(() => {
  requestRender();
  setTimeout(startProgressiveLoading, 60);
});

const environment = createAmbiente(scene, sun, requestRender);
const clock = new THREE.Clock();

const visited = new Set();
let selected = 'templo';
let selectedStoryIndex = -1;
let nearbyKey = null;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const modal = document.querySelector('#detail-modal');
const nearby = document.querySelector('#nearby-card');
const nearbyPrompt = document.querySelector('#nearby-prompt');
const infoCard = document.querySelector('#info-card');
const storyLayer = document.querySelector('#story-points');
const storyPointButtons = [];
let cameraTransition = null;
let controlsEnabledBeforeTransition = true;

const narrator = createNarratorAudio({
  buttons: [
    document.querySelector('#btn-narrator'),
    document.querySelector('#btn-guide-audio')
  ],
  progressBar: document.querySelector('#narrator-progress-bar'),
  progressContainer: document.querySelector('#narrator-progress-container')
});

const proximityAudio = createProximityAudio({
  templo: encodeURI('assets/audio/Templete Semisubterráneo.mp3'),
  kalasasaya: encodeURI('assets/audio/Kalasasaya.mp3'),
  akapana: encodeURI('assets/audio/Pirámide de Akapana.mp3'),
  chachapuma: encodeURI('assets/audio/Chachapuma.mp3'),
  pumaPunku: encodeURI('assets/audio/Puma Punku.mp3'),
  puertaSol: encodeURI('assets/audio/Puerta del Sol.mp3'),
  puertaLuna: encodeURI('assets/audio/puerta_luna.mp3'),
  bennett: encodeURI('assets/audio/Monolito Bennett.mp3'),
  kheriKala: encodeURI('assets/audio/Kheri Kala.mp3'),
  monolito: encodeURI('assets/audio/Monolito Ponce.mp3')
}, narrator.isPlaying);

const walkButton = document.querySelector('#btn-walk');
walkButton.addEventListener('click', () => proximityAudio.unlock());
const player = createJugador(camera, renderer, controls, walkButton, site, requestRender, scene);

function updateNearbyPrompt() {
  if (!nearbyPrompt) return;
  if (nearbyKey && proximityAudio.isPlayingFor(nearbyKey)) {
    nearbyPrompt.textContent = 'Reproduciendo explicación · pulsa E para pausar.';
  } else if (narrator.isPlaying() && nearbyKey) {
    nearbyPrompt.textContent = 'Pulsa E para detener la narración y escuchar este monumento.';
  } else {
    nearbyPrompt.textContent = '¿Quieres escuchar la explicación? Pulsa E.';
  }
}

narrator.audio.addEventListener('play', () => {
  proximityAudio.pause();
  updateNearbyPrompt();
  document.querySelector('#btn-narrator')?.classList.add('active');
});

narrator.audio.addEventListener('pause', () => {
  document.querySelector('#btn-narrator')?.classList.remove('active');
});

narrator.audio.addEventListener('ended', () => {
  document.querySelector('#btn-narrator')?.classList.remove('active');
});

proximityAudio.audio.addEventListener('play', updateNearbyPrompt);
proximityAudio.audio.addEventListener('pause', updateNearbyPrompt);
proximityAudio.audio.addEventListener('ended', updateNearbyPrompt);

addEventListener('keydown', (event) => {
  if (event.repeat || event.key.toLowerCase() !== 'e' || !player.walking || !nearbyKey) return;
  event.preventDefault();
  if (proximityAudio.isPlayingFor(nearbyKey)) {
    proximityAudio.pause();
    return;
  }
  if (narrator.isPlaying()) narrator.pause();
  proximityAudio.playFor(nearbyKey);
});

// Control de cierre y reapertura de la guía de la narradora
const guideCloseBtn = document.querySelector('#guide-close');
const guideDialogueEl = document.querySelector('#guide-dialogue');
if (guideCloseBtn && guideDialogueEl) {
  const closeGuideHandler = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    guideDialogueEl.hidden = true;
    guideDialogueEl.classList.add('is-hidden');
    guideDialogueEl.style.display = 'none';
  };
  guideCloseBtn.addEventListener('click', closeGuideHandler);
  guideCloseBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
  guideCloseBtn.addEventListener('mousedown', (e) => e.stopPropagation());
  guideCloseBtn.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
}

// Al pulsar el botón de narradora en la barra superior, si la guía estaba oculta se vuelve a mostrar
const topNarratorBtn = document.querySelector('#btn-narrator');
if (topNarratorBtn && guideDialogueEl) {
  topNarratorBtn.addEventListener('click', () => {
    if (guideDialogueEl.hidden || guideDialogueEl.style.display === 'none' || guideDialogueEl.classList.contains('is-hidden')) {
      guideDialogueEl.hidden = false;
      guideDialogueEl.classList.remove('is-hidden');
      guideDialogueEl.style.display = '';
    }
  });
}

function renderStoryPoints(key) {
  storyLayer.replaceChildren();
  storyPointButtons.length = 0;
  (info[key]?.puntos || []).forEach((point, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'story-point';
    button.textContent = String(index + 1);
    button.title = `${index + 1}. ${point.titulo}`;
    button.setAttribute('aria-label', `${index + 1}. ${point.titulo}: ${point.relato}`);
    button.setAttribute('aria-pressed', 'false');
    button.hidden = true;
    button.style.display = 'none';
    button.style.opacity = '0';
    button.addEventListener('click', () => focusStoryPoint(key, index));
    storyLayer.append(button);
    storyPointButtons.push({ button, point, index });
  });
  updateStoryPointPositions();
}

function updateInfoCard(key, point = null) {
  const data = info[key];
  if (!data) return;
  document.querySelector('#info-title').textContent = point ? `${data.nombre} · ${point.titulo}` : data.nombre;
  document.querySelector('#info-period').textContent = data.periodo;
  document.querySelector('#info-description').textContent = point?.relato || data.descripcion;
  document.querySelector('#info-function').textContent = data.funcion;
  document.querySelector('#info-curiosity').textContent = data.datoCurioso;

  const mediaContainer = document.querySelector('#info-media-container');
  const mediaImg = document.querySelector('#info-image');
  if (mediaContainer && mediaImg) {
    if (data.imagen) {
      mediaImg.src = data.imagen;
      mediaImg.alt = `Fotografía arqueológica de ${data.nombre}`;
      mediaImg.loading = 'lazy';
      mediaImg.decoding = 'async';
      mediaContainer.hidden = false;
    } else {
      mediaContainer.hidden = true;
      mediaImg.removeAttribute('src');
    }
  }
}

function syncOrbitControlsToCamera() {
  const savedPosition = camera.position.clone();
  const savedTarget = controls.target.clone();
  const dampingEnabled = controls.enableDamping;
  const autoRotateEnabled = controls.autoRotate;

  controls.enableDamping = false;
  controls.autoRotate = false;
  controls.update();
  camera.position.copy(savedPosition);
  controls.target.copy(savedTarget);
  camera.lookAt(savedTarget);
  controls.update();
  controls.enableDamping = dampingEnabled;
  controls.autoRotate = autoRotateEnabled;
}

function moveCameraTo(target, destination, duration = 1.25) {
  if (!cameraTransition) controlsEnabledBeforeTransition = controls.enabled;
  controls.minDistance = 2.5;

  // Garantizar que la posición de destino nunca quede enterrada en el terreno exterior
  const isOutsidePatio = Math.abs(destination.x) > 14.5 || Math.abs(destination.z) > 14.5;
  if (isOutsidePatio && destination.y < 1.8) {
    destination.y = 1.8;
  }

  if (controlsEnabledBeforeTransition) syncOrbitControlsToCamera();
  controls.enabled = false;
  cameraTransition = {
    startPosition: camera.position.clone(),
    endPosition: destination.clone(),
    startTarget: controls.target.clone(),
    endTarget: target.clone(),
    elapsed: 0,
    duration
  };
  requestRender();
}

function updateCameraTransition(delta) {
  if (!cameraTransition) return false;
  const transition = cameraTransition;
  transition.elapsed = Math.min(transition.elapsed + delta, transition.duration);
  const progress = transition.elapsed / transition.duration;
  const eased = progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

  // Arco parabólico suave para sobrevolar el terreno y los muros sin tocar la tierra
  const horizontalDist = Math.hypot(
    transition.endPosition.x - transition.startPosition.x,
    transition.endPosition.z - transition.startPosition.z
  );
  const arcHeight = Math.max(3.2, Math.min(horizontalDist * 0.16, 12.0));
  const arc = Math.sin(progress * Math.PI) * arcHeight;

  camera.position.lerpVectors(transition.startPosition, transition.endPosition, eased);
  camera.position.y += arc;
  controls.target.lerpVectors(transition.startTarget, transition.endTarget, eased);
  camera.lookAt(controls.target);

  if (progress >= 1) {
    camera.position.copy(transition.endPosition);
    controls.target.copy(transition.endTarget);
    camera.lookAt(controls.target);
    cameraTransition = null;
    if (controlsEnabledBeforeTransition) syncOrbitControlsToCamera();
    controls.enabled = controlsEnabledBeforeTransition;
  }
  return true;
}

function focusStoryPoint(key, index) {
  const data = info[key];
  const point = data?.puntos?.[index];
  if (!point) return;

  selected = key;
  selectedStoryIndex = index;
  visited.add(key);
  updateInfoCard(key, point);
  storyPointButtons.forEach(({ button, index: buttonIndex }) => {
    const active = buttonIndex === index;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  const target = new THREE.Vector3(point.posicion.x, point.posicion.y, point.posicion.z);
  const view = point.vista || { x: 0, y: 4, z: 8 };
  moveCameraTo(target, target.clone().add(new THREE.Vector3(view.x, view.y, view.z)));
  updateMinimapHotspotChips();
  drawMinimap();
}

let cachedRect = { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
function updateCachedRect() {
  if (renderer && renderer.domElement) {
    cachedRect = renderer.domElement.getBoundingClientRect();
  }
}
addEventListener('resize', updateCachedRect);
updateCachedRect();

const _projVector = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _toPoint = new THREE.Vector3();

function updateStoryPointPositions() {
  if (storyPointButtons.length === 0) return;
  const rw = cachedRect.width;
  const rh = cachedRect.height;
  const rl = cachedRect.left;
  const rt = cachedRect.top;

  camera.updateMatrixWorld();
  camera.getWorldDirection(_camDir);

  for (let i = 0; i < storyPointButtons.length; i++) {
    const { button, point } = storyPointButtons[i];

    // 1. Vector desde la cámara hacia el punto 3D
    _toPoint.set(point.posicion.x, point.posicion.y, point.posicion.z).sub(camera.position);

    // 2. Verificar que el punto esté estrictamente DELANTE del plano de la cámara
    // Si la cámara gira hacia otro lado o el punto queda a la espalda, se oculta de inmediato.
    const inFront = _toPoint.dot(_camDir) > 0.1;
    let visible = false;
    let px = 0;
    let py = 0;

    if (inFront) {
      _projVector.set(point.posicion.x, point.posicion.y, point.posicion.z).project(camera);
      // Validar profundidad del frustum (near..far) y márgenes de pantalla para evitar puntos congelados en los bordes
      const inDepth = _projVector.z >= -1 && _projVector.z <= 1;
      const inScreen = Math.abs(_projVector.x) <= 0.98 && Math.abs(_projVector.y) <= 0.98;

      if (inDepth && inScreen) {
        px = Math.round(rl + (_projVector.x + 1) * rw / 2);
        py = Math.round(rt + (1 - _projVector.y) * rh / 2);
        if (px >= rl + 16 && px <= rl + rw - 16 && py >= rt + 16 && py <= rt + rh - 16) {
          visible = true;
        }
      }
    }

    if (!visible) {
      if (!button.hidden) button.hidden = true;
      button.style.display = 'none';
      button.style.opacity = '0';
      button.style.pointerEvents = 'none';
      continue;
    }

    if (button.hidden) button.hidden = false;
    button.style.display = '';
    button.style.opacity = '1';
    button.style.pointerEvents = 'auto';
    button.style.left = `${px}px`;
    button.style.top = `${py}px`;
  }
}

function showInfo(key, focus = false) {
  const data = info[key];
  if (!data) return;
  selected = key;
  selectedStoryIndex = -1;
  updateInfoCard(key);
  renderStoryPoints(key);
  updateMinimapHotspotChips();
  drawMinimap();

  if (focus) {
    const target = new THREE.Vector3(data.posicion.x, data.posicion.y, data.posicion.z);
    const direction = camera.position.clone().sub(controls.target).normalize();
    const view = data.vista
      ? new THREE.Vector3(data.vista.x, data.vista.y, data.vista.z)
      : direction.multiplyScalar(31);
    moveCameraTo(target, target.clone().add(view));
  }
}

const modelMenu = document.querySelector('#model-menu');
document.querySelectorAll('[data-model-focus]').forEach((button) =>
  button.addEventListener('click', () => {
    const key = button.dataset.modelFocus;
    visited.add(key);
    showInfo(key, true);
    modelMenu.open = false;
  })
);

function openDetail() {
  const data = info[selected];
  if (!data) return;
  const point = data.puntos?.[selectedStoryIndex];
  document.querySelector('#modal-title').textContent = point ? `${data.nombre} · ${point.titulo}` : data.nombre;
  document.querySelector('#modal-period').textContent = data.periodo;
  document.querySelector('#modal-description').textContent = point?.relato || data.descripcion;
  document.querySelector('#modal-function').textContent = data.funcion;
  document.querySelector('#modal-curiosity').textContent = data.datoCurioso;

  const modalMedia = document.querySelector('#modal-media-container');
  const modalImg = document.querySelector('#modal-image');
  if (modalMedia && modalImg) {
    if (data.imagen) {
      modalImg.src = data.imagen;
      modalImg.alt = `Detalle ampliado de ${data.nombre}`;
      modalImg.loading = 'lazy';
      modalImg.decoding = 'async';
      modalMedia.hidden = false;
    } else {
      modalMedia.hidden = true;
      modalImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 460 260'%3E%3Crect width='460' height='260' fill='%231a1d19'/%3E%3C/svg%3E";
    }
  }

  modal.hidden = false;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.querySelector('#modal-close')?.focus();
}

function closeDetail() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  modal.hidden = true;
  document.querySelector('#btn-detail')?.focus();
}

const infoToggle = document.querySelector('#btn-toggle-info');
const collapseInfoBtn = document.querySelector('#btn-collapse-info');

function setInfoCardVisibility(hidden) {
  infoCard.classList.toggle('is-hidden', hidden);
  nearby.classList.toggle('is-hidden', hidden);
  if (infoToggle) {
    infoToggle.textContent = hidden ? 'Mostrar info' : 'Ocultar info';
    infoToggle.setAttribute('aria-expanded', String(!hidden));
    infoToggle.setAttribute('aria-label', hidden ? 'Mostrar la ficha de información' : 'Ocultar la ficha de información');
  }
  if (collapseInfoBtn) {
    collapseInfoBtn.textContent = hidden ? '›' : '‹';
    collapseInfoBtn.setAttribute('aria-label', hidden ? 'Expandir panel de información' : 'Colapsar panel de información');
    collapseInfoBtn.title = hidden ? 'Expandir panel' : 'Colapsar panel';
  }
}

if (infoToggle) {
  infoToggle.addEventListener('click', () => {
    const isHidden = !infoCard.classList.contains('is-hidden');
    setInfoCardVisibility(isHidden);
  });
}

if (collapseInfoBtn) {
  collapseInfoBtn.addEventListener('click', () => {
    const isHidden = !infoCard.classList.contains('is-hidden');
    setInfoCardVisibility(isHidden);
  });
}

const fullscreenButton = document.querySelector('#btn-fullscreen');
const panelFullscreenButton = document.querySelector('#btn-panel-fullscreen');

function updateFullscreenButton() {
  const active = Boolean(document.fullscreenElement);
  if (fullscreenButton) {
    if (fullscreenButton.classList.contains('icon-only')) {
      fullscreenButton.textContent = '⛶';
    } else {
      fullscreenButton.textContent = active ? '⛶ Salir de pantalla completa' : '⛶ Pantalla completa';
    }
    fullscreenButton.setAttribute('aria-label', active ? 'Salir de pantalla completa' : 'Activar pantalla completa');
    fullscreenButton.setAttribute('title', active ? 'Salir de pantalla completa' : 'Pantalla completa');
    fullscreenButton.setAttribute('aria-pressed', String(active));
    fullscreenButton.classList.toggle('active', active);
  }
  if (panelFullscreenButton) {
    panelFullscreenButton.textContent = active ? '⛶ SALIR DE PANTALLA COMPLETA' : '⛶ PANTALLA COMPLETA';
  }
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
  } catch (error) {
    console.warn('No se pudo alternar pantalla completa:', error);
  }
}

if (fullscreenButton) fullscreenButton.addEventListener('click', toggleFullscreen);
if (panelFullscreenButton) panelFullscreenButton.addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', () => {
  updateFullscreenButton();
  requestRender();
});

// ==========================================================================
// PANEL FLOTANTE DE AUDIO, VOLUMEN E ILUMINACIÓN (ESTILO POTOSÍ / TIWANAKU)
// ==========================================================================
const audioSettingsCard = document.querySelector('#audio-settings-card');
const btnAudioSettingsToggle = document.querySelector('#btn-audio-settings');
const btnCloseAudioPanel = document.querySelector('#btn-close-audio-panel');
const volumeSlider = document.querySelector('#volume-slider');
const btnAudioPlay = document.querySelector('#btn-audio-play');
const btnAudioPause = document.querySelector('#btn-audio-pause');
const btnAudioMute = document.querySelector('#btn-audio-mute');
const audioStatusText = document.querySelector('#audio-status-text');
const lightingSlider = document.querySelector('#lighting-slider');
const lightingValue = document.querySelector('#lighting-value');

let isAudioMuted = false;
let currentVolumeVal = 0.85;

const ambientWind = new Audio('assets/audio/sonido_de_viento_ambiente.mp3');
ambientWind.loop = true;
ambientWind.preload = 'none';

let windStarted = false;
function tryStartAmbientWind() {
  if (windStarted || isAudioMuted) return;
  ambientWind.play().then(() => {
    windStarted = true;
    updateAudioCardStatus();
  }).catch(() => {});
}
['pointerdown', 'keydown', 'click', 'touchstart'].forEach((evt) => {
  window.addEventListener(evt, tryStartAmbientWind, { passive: true });
});

const savedVolVal = localStorage.getItem('tiwanaku_audio_vol');
if (savedVolVal !== null) {
  currentVolumeVal = parseFloat(savedVolVal) / 100;
}

function applyAppVolume(vol) {
  currentVolumeVal = THREE.MathUtils.clamp(vol, 0, 1);
  const effectiveVol = isAudioMuted ? 0 : currentVolumeVal;
  narrator.audio.volume = effectiveVol;
  proximityAudio.audio.volume = effectiveVol;
  ambientWind.volume = effectiveVol * 0.55;
  ambientWind.muted = isAudioMuted;

  if (volumeSlider) {
    const pct = Math.round(currentVolumeVal * 100);
    volumeSlider.value = pct;
    volumeSlider.setAttribute('aria-valuenow', pct);
    volumeSlider.setAttribute('aria-valuetext', `${pct} por ciento`);
    volumeSlider.style.setProperty('--range-pct', `${pct}%`);
  }
  localStorage.setItem('tiwanaku_audio_vol', String(Math.round(currentVolumeVal * 100)));
  updateAudioCardStatus();
}

function updateAudioCardStatus() {
  const isPlaying = !narrator.audio.paused || !proximityAudio.audio.paused || !ambientWind.paused;
  if (audioStatusText) {
    if (isAudioMuted) {
      audioStatusText.textContent = `Silenciado (0%) · ${isPlaying ? 'En reproducción' : 'Pausado'}`;
    } else {
      audioStatusText.textContent = `${isPlaying ? 'En reproducción' : 'Música en pausa'} · Vol. ${Math.round(currentVolumeVal * 100)}%`;
    }
  }
  if (btnAudioMute) {
    btnAudioMute.textContent = isAudioMuted ? '🔇' : '🔊';
  }
  if (btnAudioPlay) btnAudioPlay.classList.toggle('active', isPlaying);
  if (btnAudioPause) btnAudioPause.classList.toggle('active', !isPlaying);
}

if (btnAudioSettingsToggle && audioSettingsCard) {
  btnAudioSettingsToggle.addEventListener('click', () => {
    audioSettingsCard.classList.toggle('is-hidden');
    updateAudioCardStatus();
  });
}
if (btnCloseAudioPanel && audioSettingsCard) {
  btnCloseAudioPanel.addEventListener('click', () => {
    audioSettingsCard.classList.add('is-hidden');
  });
}

if (volumeSlider) {
  applyAppVolume(currentVolumeVal);
  volumeSlider.addEventListener('input', (e) => {
    isAudioMuted = false;
    applyAppVolume(parseFloat(e.target.value) / 100);
  });
}

if (btnAudioPlay) {
  btnAudioPlay.addEventListener('click', () => {
    isAudioMuted = false;
    applyAppVolume(currentVolumeVal || 0.85);
    ambientWind.play().catch(() => {});
    if (nearbyKey && player.walking) {
      proximityAudio.playFor(nearbyKey);
    } else {
      narrator.play();
    }
    updateAudioCardStatus();
  });
}

if (btnAudioPause) {
  btnAudioPause.addEventListener('click', () => {
    ambientWind.pause();
    narrator.pause();
    proximityAudio.pause();
    updateAudioCardStatus();
  });
}

if (btnAudioMute) {
  btnAudioMute.addEventListener('click', () => {
    isAudioMuted = !isAudioMuted;
    applyAppVolume(currentVolumeVal);
  });
}

narrator.audio.addEventListener('play', updateAudioCardStatus);
narrator.audio.addEventListener('pause', updateAudioCardStatus);
proximityAudio.audio.addEventListener('play', updateAudioCardStatus);
proximityAudio.audio.addEventListener('pause', updateAudioCardStatus);
ambientWind.addEventListener('play', updateAudioCardStatus);
ambientWind.addEventListener('pause', updateAudioCardStatus);

// Regulación de iluminación general (exposición ACES Filmic)
const baseToneExposure = 1.15;
const savedLightPct = localStorage.getItem('tiwanaku_light_pct');
let currentLightPct = savedLightPct !== null ? parseInt(savedLightPct, 10) : 100;

function applyAppLighting(pct) {
  currentLightPct = THREE.MathUtils.clamp(pct, 30, 220);
  if (lightingSlider) {
    lightingSlider.value = currentLightPct;
    lightingSlider.setAttribute('aria-valuenow', currentLightPct);
    lightingSlider.setAttribute('aria-valuetext', `${currentLightPct} por ciento`);
    lightingSlider.style.setProperty('--range-pct', `${((currentLightPct - 30) / (220 - 30)) * 100}%`);
  }
  if (lightingValue) {
    lightingValue.textContent = `${currentLightPct}%`;
  }
  renderer.toneMappingExposure = (currentLightPct / 100) * baseToneExposure;
  localStorage.setItem('tiwanaku_light_pct', String(currentLightPct));
  requestRender();
}

if (lightingSlider) {
  applyAppLighting(currentLightPct);
  lightingSlider.addEventListener('input', (e) => {
    applyAppLighting(parseInt(e.target.value, 10));
  });
}

document.querySelector('#btn-detail').addEventListener('click', openDetail);
document.querySelector('#modal-close').addEventListener('click', closeDetail);
modal.addEventListener('click', (event) => {
  if (event.target === modal) closeDetail();
});
addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeDetail();
});

// Efecto interactivo de cursor en la escena al pasar sobre modelos interactivos
renderer.domElement.addEventListener('pointermove', (event) => {
  if (player.walking) return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObject(site, true)[0];
  if (hit) {
    let node = hit.object;
    while (node && node !== site && !node.userData.infoKey) node = node.parent;
    if (node && node.userData.infoKey && info[node.userData.infoKey]) {
      renderer.domElement.style.cursor = 'pointer';
      return;
    }
  }
  renderer.domElement.style.cursor = 'default';
});

renderer.domElement.addEventListener('pointerleave', () => {
  renderer.domElement.style.cursor = 'default';
});

let pointerStart = null;
renderer.domElement.addEventListener('pointerdown', (event) => {
  pointerStart = { x: event.clientX, y: event.clientY };
});

renderer.domElement.addEventListener('pointerup', (event) => {
  if (player.walking) {
    pointerStart = null;
    return;
  }
  if (pointerStart && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 7) {
    pointerStart = null;
    return;
  }
  pointerStart = null;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );
  raycaster.setFromCamera(pointer, camera);

  const hit = raycaster.intersectObject(site, true)[0];
  if (!hit) return;
  let node = hit.object;
  while (node && node !== site && !node.userData.infoKey) node = node.parent;
  if (node && node.userData.infoKey && info[node.userData.infoKey]) {
    visited.add(node.userData.infoKey);
    showInfo(node.userData.infoKey, true);
  }
});

const timeButton = document.querySelector('#btn-time');
const envModeMap = { sunset: 0, day: 1, night: 2 };

function applyAtmosphereMode(modeKey) {
  const label = cinematic.applyAtmosphere(modeKey);
  environment.setTime(envModeMap[modeKey] ?? 0);
  if (timeButton) {
    timeButton.textContent = label;
    timeButton.classList.add('active');
  }
  requestRender();
  return label;
}

function cycleAtmosphereMode() {
  const nextLabel = cinematic.cycleAtmosphere();
  environment.setTime(envModeMap[cinematic.currentMode] ?? 0);
  if (timeButton) {
    timeButton.textContent = nextLabel;
    timeButton.classList.add('active');
  }
  requestRender();
}

if (timeButton) {
  timeButton.addEventListener('click', (e) => {
    e.stopImmediatePropagation();
    cycleAtmosphereMode();
  });
}
addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'n' && !event.repeat) {
    cycleAtmosphereMode();
  }
});

// Sincroniza la atmósfera inicial cinematográfica (Ocaso)
applyAtmosphereMode('sunset');

// --------------------------------------------------------------------------
// Minimapa en Rombo (45°) y Lista Rápida de Hotspots Clicables
// --------------------------------------------------------------------------
const mapCanvas = document.querySelector('#mini-map');
const mapContext = mapCanvas.getContext('2d');
const mapStructures = [
  ['templo', 0, 0, 28, 28],
  ['kalasasaya', -42, -3, 40, 25],
  ['akapana', -45, 34, 36, 36],
  ['chachapuma', 28, -5, 4, 4],
  ['pumaPunku', 43, 31, 27, 19],
  ['puertaSol', 0, -24, 5, 3],
  ['puertaLuna', 22, -24, 5, 3],
  ['bennett', -42, -3, 3, 2],
  ['kheriKala', 0, 43, 19, 12],
  ['monolito', 0, 0, 2, 2]
];
const proximityBounds = {
  templo: [0, 0, 14, 14],
  kalasasaya: [-42, -3, 20, 12.5],
  akapana: [-45, 34, 18, 18],
  chachapuma: [28, -5, 2, 2],
  pumaPunku: [43, 31, 13.5, 9.5],
  puertaSol: [0, -24, 2.5, 1.5],
  puertaLuna: [22, -24, 2.5, 1.5],
  bennett: [-42, -3, 1.5, 1.0],
  kheriKala: [0, 43, 9.5, 6],
  monolito: [0, 0, 1.2, 1.2]
};

const quickHotspotItems = [
  { key: 'templo', label: 'Templete' },
  { key: 'kalasasaya', label: 'Kalasasaya' },
  { key: 'puertaSol', label: 'Puerta Sol' },
  { key: 'puertaLuna', label: 'Puerta Luna' },
  { key: 'akapana', label: 'Akapana' },
  { key: 'chachapuma', label: 'Chachapuma' },
  { key: 'pumaPunku', label: 'Puma Punku' },
  { key: 'monolito', label: 'Ponce' },
  { key: 'bennett', label: 'Bennett' },
  { key: 'kheriKala', label: 'Kheri Kala' }
];

const hotspotContainer = document.querySelector('#minimap-hotspots');
const hotspotChips = [];

function initMinimapHotspots() {
  if (!hotspotContainer) return;
  hotspotContainer.replaceChildren();
  quickHotspotItems.forEach(({ key, label }) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `hotspot-chip ${key === selected ? 'active' : ''}`;
    chip.textContent = label;
    chip.setAttribute('aria-label', `Observar ${label}`);
    chip.addEventListener('click', () => {
      visited.add(key);
      showInfo(key, true);
      updateMinimapHotspotChips();
    });
    hotspotContainer.appendChild(chip);
    hotspotChips.push({ key, chip });
  });
}

function updateMinimapHotspotChips() {
  hotspotChips.forEach(({ key, chip }) => {
    chip.classList.toggle('active', key === selected);
  });
}

function drawMinimap() {
  const ctx = mapContext;
  const w = mapCanvas.width;
  const h = mapCanvas.height;
  ctx.clearRect(0, 0, w, h);

  // Fondo oscuro con efecto translúcido
  ctx.fillStyle = 'rgba(16, 14, 11, 0.78)';
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  // Rota el plano interno 45° para coincidir con la orientación diagonal de la vista 3D
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 4);
  ctx.scale(0.82, 0.82);

  const scaleX = (w - 32) / 160;
  const scaleZ = (h - 32) / 130;
  const mx = (x) => x * scaleX;
  const mz = (z) => z * scaleZ;

  // Muros perimetrales en rombo estilizados en dorado translúcido
  ctx.strokeStyle = 'rgba(229, 193, 88, 0.48)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(mx(-71), mz(-55), mx(71) - mx(-71), mz(55) - mz(-55));
  ctx.strokeStyle = 'rgba(229, 193, 88, 0.22)';
  ctx.strokeRect(mx(-68), mz(-52), mx(68) - mx(-68), mz(52) - mz(-52));

  // Estructuras del sitio
  mapStructures.forEach(([key, x, z, ww, dd]) => {
    const px = mx(x);
    const py = mz(z);
    const pw = Math.max(ww * scaleX, 4);
    const ph = Math.max(dd * scaleZ, 4);

    const isSelected = key === selected;
    const isVisited = visited.has(key);

    if (isSelected) {
      // Monumento activo: resalta en dorado brillante con resplandor
      ctx.fillStyle = '#ffd54f';
      ctx.shadowColor = '#ffd54f';
      ctx.shadowBlur = 9;
      ctx.fillRect(px - pw / 2, py - ph / 2, pw, ph);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#fff8e0';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(px - pw / 2, py - ph / 2, pw, ph);
    } else if (isVisited) {
      ctx.fillStyle = 'rgba(229, 193, 88, 0.45)';
      ctx.fillRect(px - pw / 2, py - ph / 2, pw, ph);
      ctx.strokeStyle = 'rgba(229, 193, 88, 0.75)';
      ctx.lineWidth = 1.0;
      ctx.strokeRect(px - pw / 2, py - ph / 2, pw, ph);
    } else {
      ctx.fillStyle = 'rgba(180, 172, 155, 0.32)';
      ctx.fillRect(px - pw / 2, py - ph / 2, pw, ph);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(px - pw / 2, py - ph / 2, pw, ph);
    }

    if (isVisited) {
      ctx.fillStyle = '#fff4d5';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('✔', px + pw / 2 - 2, py - ph / 2 + 9);
    }
  });

  // Indicador del jugador a pie
  if (player.walking) {
    const px = mx(player.position.x);
    const py = mz(player.position.z);
    ctx.beginPath();
    ctx.fillStyle = '#5de4ff';
    ctx.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Indicador de dirección de la cámara sincronizado con la rotación
  const camAngle = Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z);
  ctx.save();
  ctx.translate(mx(controls.target.x), mz(controls.target.z));
  ctx.rotate(camAngle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-5, 9);
  ctx.lineTo(0, 6.5);
  ctx.lineTo(5, 9);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 220, 120, 0.75)';
  ctx.fill();
  ctx.restore();

  ctx.restore();

  // Indicador de orientación norte (rotado a 45°)
  ctx.save();
  ctx.translate(w - 20, 20);
  ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = '#ffd54f';
  ctx.font = 'bold 10px Outfit, sans-serif';
  ctx.fillText('N', -4, -6);
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(3, 4);
  ctx.lineTo(0, 1);
  ctx.lineTo(-3, 4);
  ctx.closePath();
  ctx.fillStyle = '#ffd54f';
  ctx.fill();
  ctx.restore();
}

let wasWalking = false;
function updateNearby() {
  if (!player.walking) {
    if (wasWalking || nearbyKey !== null) proximityAudio.stop();
    if (wasWalking) {
      walkButton.classList.remove('active');
    }
    wasWalking = false;
    nearby.hidden = true;
    nearbyKey = null;
    updateNearbyPrompt();
    return;
  }
  if (!wasWalking) {
    wasWalking = true;
    walkButton.classList.add('active');
    if (narrator.isPlaying()) narrator.pause();
  }
  let nearest = null,
    nearestDistance = Infinity,
    nearestArea = Infinity;
  for (const [key, data] of Object.entries(info)) {
    const [x, z, halfW, halfD] = proximityBounds[key] || [data.posicion.x, data.posicion.z, 0.8, 0.8];
    const dx = Math.max(Math.abs(player.position.x - x) - halfW, 0),
      dz = Math.max(Math.abs(player.position.z - z) - halfD, 0),
      d = Math.hypot(dx, dz),
      area = halfW * halfD;
    if (d < nearestDistance || (d === nearestDistance && area < nearestArea)) {
      nearestDistance = d;
      nearestArea = area;
      nearest = key;
    }
  }
  if (nearestDistance >= 8 || !nearest) {
    if (nearbyKey !== null) proximityAudio.stop();
    nearby.hidden = true;
    nearbyKey = null;
    updateNearbyPrompt();
    return;
  }
  visited.add(nearest);
  if (nearbyKey !== nearest) {
    proximityAudio.stop();
    nearbyKey = nearest;
    showInfo(nearest);
    const data = info[nearest];
    document.querySelector('#nearby-title').textContent = data.nombre;
    updateNearbyPrompt();
  }
  nearby.hidden = false;
}

let minimapTimer = 0;
function animate() {
  animationFrame = requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const movingCamera = updateCameraTransition(delta);
  if (!movingCamera && !player.walking) {
    controls.update();
    // Clamp de seguridad: evitar que la cámara descienda por debajo de la cota de tierra fuera del patio
    const outsidePatio = Math.abs(camera.position.x) > 14.5 || Math.abs(camera.position.z) > 14.5;
    if (outsidePatio && camera.position.y < 1.6) {
      camera.position.y = 1.6;
    }
  }
  const playerWasMoving = player.needsUpdate;
  player.update(delta);
  updateNearby();
  environment.update(clock.elapsedTime);
  updateStoryPointPositions();
  minimapTimer += delta;
  if (minimapTimer > 0.1 || (player.walking && !playerWasMoving)) {
    drawMinimap();
    minimapTimer = 0;
  }
  cinematic.render();
}

initMinimapHotspots();
const urlFocus = new URLSearchParams(window.location.search).get('focus');
const initialKey = urlFocus && info[urlFocus] ? urlFocus : 'templo';
drawMinimap();
showInfo(initialKey, initialKey !== 'templo');
animate();
