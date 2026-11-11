import * as THREE from 'three';
import { createScene } from './escena.js';
import { createAmbiente } from './ambiente.js';
import { createNarratorAudio, createProximityAudio } from './ambiente-sonoro.js';
import { createSitio } from './estructuras/sitio.js';
import { createJugador } from './jugador.js';
import { createGuideNPC } from './guia.js';
import { addExistingSiteModels } from './modelos-sitio.js';
import { info } from './info.js';

let animationFrame = null;
function requestRender() {
  if (animationFrame === null) animationFrame = requestAnimationFrame(animate);
}

// Paleta de colores temáticos para el outline de cada modelo arqueológico
// (El Templete y sus paredes no llevan delineado por solicitud directa para conservar su estética limpia)
export const structureOutlineColors = {
  puertaSol: { edge: '#ffd54f', hidden: '#6d4c00' },   // Oro Solar resplandeciente
  akapana: { edge: '#ff6e40', hidden: '#8c2500' },     // Terracota / Cobre andino
  chachapuma: { edge: '#8d6e63', hidden: '#3e2723' },  // Basalto volcánico
  monolito: { edge: '#42a5f5', hidden: '#0d47a1' },    // Lapislázuli / Azul ceremonial (Monolito Ponce)
  kalasasaya: { edge: '#ffb300', hidden: '#663c00' },  // Ámbar solsticial
  bennett: { edge: '#ec407a', hidden: '#700836' },     // Arenisca roja / Rubí ceremonial (Monolito Bennett)
  pumaPunku: { edge: '#ab47bc', hidden: '#3d0875' },   // Amatista cósmica
  kheriKala: { edge: '#66bb6a', hidden: '#1b5e20' }    // Esmeralda / Verde altiplano
};

// Elementos de la pantalla de carga
const loadingScreen = document.querySelector('#loading-screen');
const loadingBar = document.querySelector('#loading-bar');
const loadingStatus = document.querySelector('#loading-status');

function setLoadProgress(percent, text) {
  const p = Math.min(Math.max(percent, 0), 100);
  if (loadingBar) loadingBar.style.width = `${p}%`;
  if (loadingStatus && text) loadingStatus.textContent = text;
}

function finishLoading() {
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
const { scene, camera, renderer, controls, sun, composer, outlinePass } = createScene(container);
controls.addEventListener('change', requestRender);
controls.addEventListener('start', requestRender);
controls.addEventListener('end', requestRender);
addEventListener('resize', requestRender);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) requestRender();
});
const site = createSitio();
scene.add(site);

// Carga asíncrona de los modelos 3D y finalización de la pantalla de carga
addExistingSiteModels(site).then(() => {
  finishLoading();
  setModelOutline(selected);
}).catch((err) => {
  console.warn('Carga parcial de modelos:', err);
  finishLoading();
  setModelOutline(selected);
});

// Respaldo de seguridad por si la red retrasa recursos externos
setTimeout(finishLoading, 6000);

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
  bennett: encodeURI('assets/audio/Monolito Bennett.mp3'),
  kheriKala: encodeURI('assets/audio/Kheri Kala.mp3'),
  monolito: encodeURI('assets/audio/Monolito Ponce.mp3')
}, narrator.isPlaying);
const walkButton = document.querySelector('#btn-walk');
walkButton.addEventListener('click', () => proximityAudio.unlock());
const player = createJugador(camera, renderer, controls, walkButton, site, requestRender);
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
document.querySelector('#guide-close').addEventListener('click', () => {
  document.querySelector('#guide-dialogue').hidden = true;
});

// Localizador de objetos en la escena para aplicar el OutlinePass
function findTargetModel(key) {
  if (!key || key === 'templo') return null; // Las paredes del Templete nunca se delinean
  const directNames = [
    `${key}-modelo-local`,
    key === 'puertaSol' ? 'puerta-del-sol' : null,
    key === 'monolito' ? 'monolito-ponce' : null,
    key === 'bennett' ? 'monolito-bennett' : null,
    key === 'kalasasaya' ? 'kalasasaya' : null,
    key === 'akapana' ? 'akapana' : null,
    key === 'chachapuma' ? 'chachapuma' : null,
    key === 'pumaPunku' ? 'puma-punku' : null,
    key === 'kheriKala' ? 'kheri-kala' : null
  ].filter(Boolean);

  for (const name of directNames) {
    const obj = site.getObjectByName(name);
    if (obj) return obj;
  }
  let fallback = null;
  site.traverse((node) => {
    if (!fallback && node.userData?.infoKey === key && node !== site) {
      fallback = node;
    }
  });
  return fallback;
}

function setModelOutline(key) {
  if (!outlinePass) return;
  if (!key || key === 'templo') {
    outlinePass.selectedObjects = [];
    outlinePass.enabled = false;
    requestRender();
    return;
  }
  const colors = structureOutlineColors[key];
  if (!colors) {
    outlinePass.selectedObjects = [];
    outlinePass.enabled = false;
    requestRender();
    return;
  }
  outlinePass.visibleEdgeColor.set(colors.edge);
  outlinePass.hiddenEdgeColor.set(colors.hidden);
  const target = findTargetModel(key);
  if (target) {
    outlinePass.selectedObjects = [target];
  } else {
    outlinePass.selectedObjects = [];
  }
  outlinePass.enabled = Boolean(target);
  requestRender();
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
    button.addEventListener('click', () => focusStoryPoint(key, index));
    storyLayer.append(button);
    storyPointButtons.push({ button, point, index });
  });
}

function updateInfoCard(key, point = null) {
  const data = info[key];
  document.querySelector('#info-title').textContent = point ? `${data.nombre} · ${point.titulo}` : data.nombre;
  document.querySelector('#info-period').textContent = data.periodo;
  document.querySelector('#info-description').textContent = point?.relato || data.descripcion;
  document.querySelector('#info-function').textContent = data.funcion;
  document.querySelector('#info-curiosity').textContent = data.datoCurioso;
}

function syncOrbitControlsToCamera() {
  const savedPosition = camera.position.clone();
  const savedTarget = controls.target.clone();
  const dampingEnabled = controls.enableDamping;
  const autoRotateEnabled = controls.autoRotate;

  // Descarta el giro residual del ratón y recalcula la órbita desde el encuadre actual.
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

  camera.position.lerpVectors(transition.startPosition, transition.endPosition, eased);
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
  setModelOutline(key);
}

function updateStoryPointPositions() {
  const rect = renderer.domElement.getBoundingClientRect();
  storyPointButtons.forEach(({ button, point }) => {
    const projected = new THREE.Vector3(point.posicion.x, point.posicion.y, point.posicion.z).project(camera);
    const visible = projected.z >= -1 && projected.z <= 1 && Math.abs(projected.x) <= 1.08 && Math.abs(projected.y) <= 1.08;
    button.hidden = !visible;
    if (!visible) return;
    button.style.left = `${rect.left + (projected.x + 1) * rect.width / 2}px`;
    button.style.top = `${rect.top + (1 - projected.y) * rect.height / 2}px`;
  });
}

function showInfo(key, focus = false) {
  const data = info[key];
  if (!data) return;
  selected = key;
  selectedStoryIndex = -1;
  updateInfoCard(key);
  renderStoryPoints(key);

  setModelOutline(key);

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
  const point = data.puntos?.[selectedStoryIndex];
  document.querySelector('#modal-title').textContent = point ? `${data.nombre} · ${point.titulo}` : data.nombre;
  document.querySelector('#modal-period').textContent = data.periodo;
  document.querySelector('#modal-description').textContent = point?.relato || data.descripcion;
  document.querySelector('#modal-function').textContent = data.funcion;
  document.querySelector('#modal-curiosity').textContent = data.datoCurioso;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.querySelector('#modal-close').focus();
}

function closeDetail() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

const infoToggle = document.querySelector('#btn-toggle-info');
infoToggle.addEventListener('click', () => {
  const hidden = infoCard.classList.toggle('is-hidden');
  nearby.classList.toggle('is-hidden', hidden);
  infoToggle.textContent = hidden ? 'Mostrar info' : 'Ocultar info';
  infoToggle.setAttribute('aria-expanded', String(!hidden));
  infoToggle.setAttribute('aria-label', hidden ? 'Mostrar la ficha de información' : 'Ocultar la ficha de información');
});

const fullscreenButton = document.querySelector('#btn-fullscreen');
function updateFullscreenButton() {
  const active = Boolean(document.fullscreenElement);
  fullscreenButton.textContent = active ? '⛶ Salir de pantalla completa' : '⛶ Pantalla completa';
  fullscreenButton.setAttribute('aria-label', active ? 'Salir de pantalla completa' : 'Activar pantalla completa');
  fullscreenButton.setAttribute('aria-pressed', String(active));
}

fullscreenButton.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
  } catch (error) {
    console.warn('No se pudo cambiar a pantalla completa:', error);
  }
});
document.addEventListener('fullscreenchange', () => {
  updateFullscreenButton();
  requestRender();
});

document.querySelector('#btn-detail').addEventListener('click', openDetail);
document.querySelector('#modal-close').addEventListener('click', closeDetail);
modal.addEventListener('click', (event) => {
  if (event.target === modal) closeDetail();
});
addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeDetail();
});

// Efecto interactivo de hover en la escena para resaltar modelos
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
    if (node && node.userData.infoKey && structureOutlineColors[node.userData.infoKey]) {
      setModelOutline(node.userData.infoKey);
      return;
    }
  }
  setModelOutline(selected);
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
const timeLabels = ['☀ Día', '🌅 Ocaso', '🌙 Noche'];
function cycleTime() {
  const mode = environment.setTime(environment.mode + 1);
  timeButton.textContent = timeLabels[mode];
}
timeButton.addEventListener('click', cycleTime);
addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'n' && !event.repeat) cycleTime();
});

const mapCanvas = document.querySelector('#mini-map');
const mapContext = mapCanvas.getContext('2d');
const mapStructures = [
  ['templo', 0, 0, 28, 28],
  ['kalasasaya', -42, -3, 40, 25],
  ['akapana', -45, 34, 36, 36],
  ['chachapuma', 28, -5, 4, 4],
  ['pumaPunku', 43, 31, 27, 19],
  ['puertaSol', 0, -24, 5, 3],
  ['bennett', -42, -3, 2, 1],
  ['kheriKala', 0, 43, 19, 12]
];
const proximityBounds = {
  templo: [0, 0, 14, 14],
  kalasasaya: [-42, -3, 20, 12.5],
  akapana: [-45, 34, 18, 18],
  chachapuma: [28, -5, 2, 2],
  pumaPunku: [43, 31, 13.5, 9.5],
  puertaSol: [0, -24, 2.5, 1.5],
  bennett: [-42, -3, 1, 0.5],
  kheriKala: [0, 43, 9.5, 6],
  monolito: [0, 0, 1, 1]
};

function drawMinimap() {
  const ctx = mapContext,
    w = mapCanvas.width,
    h = mapCanvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(38,43,38,.72)';
  ctx.fillRect(0, 0, w, h);
  const mx = (x) => 16 + ((x + 80) / 160) * (w - 32),
    mz = (z) => 16 + ((z + 65) / 130) * (h - 32);
  ctx.strokeStyle = 'rgba(234,208,153,.55)';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(mx(-71), mz(-55), mx(71) - mx(-71), mz(55) - mz(-55));
  ctx.strokeRect(mx(-68), mz(-52), mx(68) - mx(-68), mz(52) - mz(-52));
  mapStructures.forEach(([key, x, z, ww, dd]) => {
    const px = mx(x),
      py = mz(z),
      pw = Math.max((ww / 160) * (w - 32), 3),
      ph = Math.max((dd / 130) * (h - 32), 3);
    ctx.fillStyle = visited.has(key) ? '#efd08d' : 'rgba(211,207,190,.78)';
    ctx.fillRect(px - pw / 2, py - ph / 2, pw, ph);
    if (visited.has(key)) {
      ctx.fillStyle = '#fff4d5';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('✔', px + pw / 2, py - ph / 2);
    }
  });
  if (player.walking) {
    const px = mx(player.position.x),
      py = mz(player.position.z);
    ctx.beginPath();
    ctx.fillStyle = '#68d8f0';
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#eafcff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.fillStyle = '#fff4d5';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('N', w / 2 - 3, 11);
}

let wasWalking = false;
function updateNearby() {
  if (!player.walking) {
    if (wasWalking || nearbyKey !== null) proximityAudio.stop();
    wasWalking = false;
    nearby.hidden = true;
    nearbyKey = null;
    updateNearbyPrompt();
    return;
  }
  if (!wasWalking) {
    wasWalking = true;
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
  animationFrame = null;
  const delta = Math.min(clock.getDelta(), 0.05);
  const movingCamera = updateCameraTransition(delta);
  if (!movingCamera && !player.walking) controls.update();
  const playerWasMoving = player.needsUpdate;
  player.update(delta);
  updateNearby();
  const environmentAnimating = environment.update(clock.elapsedTime);
  updateStoryPointPositions();
  minimapTimer += delta;
  if (minimapTimer > 0.1 || (player.walking && !playerWasMoving)) {
    drawMinimap();
    minimapTimer = 0;
  }
  if (composer) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }

  // Continúa solo durante transiciones, movimiento a pie o animación visible del ichu.
  if (movingCamera || player.needsUpdate || environmentAnimating) requestRender();
}

const urlFocus = new URLSearchParams(window.location.search).get('focus');
const initialKey = urlFocus && info[urlFocus] ? urlFocus : 'templo';
drawMinimap();
showInfo(initialKey, initialKey !== 'templo');
requestRender();
