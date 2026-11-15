import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { terrainHeight } from './ambiente.js';
import { kalasasayaPillarPositions } from './estructuras/kalasasaya.js';

const RADIO = 0.38;
const ALTURA_OJOS = 1.45;

function crearObstaculos() {
  const items = [];
  const add = (x, z, w, d) => items.push({ x, z, w, d });

  // 1. Templete Semisubterráneo: muros del patio hundido con acceso central por la escalinata sur
  add(-13.65, 0, 1.4, 28.4);
  add(13.65, 0, 1.4, 28.4);
  add(0, -13.65, 28.4, 1.4);
  // Muro sur con vano central de 6.4m para la escalinata
  add(-8.5, 13.65, 10.5, 1.4);
  add(8.5, 13.65, 10.5, 1.4);
  // Monolito Ponce erguido en el centro del patio
  add(0, 0, 1.6, 1.6);

  // 2. Puerta del Sol: vano central de 3m completamente libre para cruzar a pie
  add(-2.0, -24.0, 0.9, 1.2);
  add(2.0, -24.0, 0.9, 1.2);

  // 3. Puerta de la Luna monumental: vano central de 3.2m completamente libre para cruzar a pie
  add(20.0, -24.0, 1.0, 1.2);
  add(24.0, -24.0, 1.0, 1.2);

  // 4. Chachapuma: pedestal ceremonial puntual
  add(28.0, -5.0, 1.5, 1.5);

  // 5. Kalasasaya: muros perimetrales reales con vanos de acceso y salida al Norte, Sur, Este y Oeste
  // Muro sur (ingreso): vano de 6.4m centrado en x = -42
  add(-53.5, 9.0, 15.0, 1.1);
  add(-30.5, 9.0, 15.0, 1.1);
  // Muro norte (salida directa hacia adelante): vano de 6.4m centrado en x = -42
  add(-53.5, -15.0, 15.0, 1.1);
  add(-30.5, -15.0, 15.0, 1.1);
  // Flancos laterales este y oeste: con vanos centrales de 5m en z = -3
  add(-61.0, -9.5, 1.1, 9.0);
  add(-61.0, 3.5, 1.1, 9.0);
  add(-23.0, -9.5, 1.1, 9.0);
  add(-23.0, 3.5, 1.1, 9.0);
  // Monolito Bennett en el altar central de Kalasasaya
  add(-42.0, -3.0, 1.8, 1.8);
  // Pilares megalíticos individuales (puntos de 0.8m)
  kalasasayaPillarPositions.forEach((p) => {
    add(p[0] - 42.0, p[2] - 3.0, 0.8, 0.8);
  });

  return items;
}

export function createJugador(camera, renderer, orbitControls, button, site = null, onInvalidate = () => {}, scene = null) {
  const obstacles = crearObstaculos();
  const keys = new Set();
  let walking = false;
  let verticalSpeed = 0;
  let grounded = true;
  let fallbackLook = false;

  // Ángulos de cámara en tercera persona y distancia orbital al personaje
  let yaw = 0;
  let pitch = 0.14;
  let cameraDistance = 3.8;

  const hint = document.querySelector('#interaction-help');
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const moveDir = new THREE.Vector3();
  const playerPos = new THREE.Vector3(3.2, 0, 20.0);
  const lookTarget = new THREE.Vector3();

  // =========================================================================
  // MODELO Y ANIMACIONES DEL PERSONAJE: TIGRE HUMANOIDE
  // =========================================================================
  const characterGroup = new THREE.Group();
  characterGroup.name = 'avatar-tigre-humanoide';
  characterGroup.visible = false;

  const targetScene = scene || site?.parent || site;
  if (targetScene) {
    targetScene.add(characterGroup);
  }

  let mixer = null;
  const actions = {};
  let currentAction = null;
  let characterLoaded = false;
  let characterModel = null;

  const gltfLoader = new GLTFLoader();
  gltfLoader.load(
    'assets/models/tigre_humanoide.glb',
    (gltf) => {
      characterModel = gltf.scene;
      characterModel.name = 'malla-tigre-humanoide';

      // Activar sombras y optimizar materiales PBR
      characterModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.isSkinnedMesh) {
            child.frustumCulled = false; // Evita que desaparezca cuando la cámara está cerca
          }
          if (child.material) {
            child.material.side = THREE.DoubleSide;
            child.material.roughness = 0.85;
            child.material.metalness = 0.04;
            if (child.material.map) {
              child.material.map.colorSpace = THREE.SRGBColorSpace;
            }
          }
        }
      });

      // 1. Normalizar escala monumental (~1.86m de estatura)
      // En tigre_humanoide.glb la altura anatómica del modelo es 0.717 (con cabeza y orejas)
      // y la base de las patas apoya naturalmente en Y = 0.
      const leftToe =
        characterModel.getObjectByName('mixamorigLeftToeBase') ||
        characterModel.getObjectByName('mixamorigLeftFoot');
      const rightToe =
        characterModel.getObjectByName('mixamorigRightToeBase') ||
        characterModel.getObjectByName('mixamorigRightFoot');
      const head = characterModel.getObjectByName('mixamorigHead');

      let rawHeight = 0.717;
      let toeBaseY = 0.0;

      if (head && (leftToe || rightToe)) {
        characterModel.updateMatrixWorld(true);
        const pToeL = new THREE.Vector3();
        const pToeR = new THREE.Vector3();
        const pHead = new THREE.Vector3();
        if (leftToe) leftToe.getWorldPosition(pToeL);
        if (rightToe) rightToe.getWorldPosition(pToeR);
        head.getWorldPosition(pHead);
        const minToeY = Math.min(
          leftToe ? pToeL.y : Infinity,
          rightToe ? pToeR.y : Infinity
        );
        toeBaseY = isFinite(minToeY) ? minToeY : 0.0;
        rawHeight = Math.max(0.4, (pHead.y - toeBaseY) + 0.115);
      }

      const targetHeight = 1.86;
      const scaleFactor = targetHeight / rawHeight;
      characterModel.scale.setScalar(scaleFactor);
      characterModel.updateMatrixWorld(true);

      // 2. Anclaje anatómico exacto al suelo (Y = 0 dentro de characterGroup):
      // Las almohadillas de las garras quedan perfectamente asentadas sobre el terreno,
      // evitando tanto flotar en el aire como enterrarse.
      let footGroundOffset = 0.0;
      if (leftToe) {
        const pToe = new THREE.Vector3();
        leftToe.getWorldPosition(pToe);
        footGroundOffset = -pToe.y;
      }
      const finalY = THREE.MathUtils.clamp(footGroundOffset + 0.01, -0.03, 0.04);
      characterModel.position.set(0, finalY, 0);
      characterModel.updateMatrixWorld(true);

      // Configuración del mezclador de animaciones (Mixer)
      mixer = new THREE.AnimationMixer(characterModel);
      if (gltf.animations && gltf.animations.length > 0) {
        gltf.animations.forEach((clip) => {
          const action = mixer.clipAction(clip);
          actions[clip.name.toLowerCase()] = action;
          actions[clip.name] = action;
        });

        // Configurar acción Idle por defecto
        const idleClip = actions.idle || actions['Idle'];
        if (idleClip) {
          actions.idle = idleClip;
        }

        // Configurar acción Walk
        const walkClip = actions.walk || actions['Walk'];
        if (walkClip) {
          actions.walk = walkClip;
        }

        // Configurar acción Jump
        const jumpClip = actions.jump || actions['Jump'] || actions['jump start'] || actions['Jump Start'];
        if (jumpClip) {
          actions.jump = jumpClip;
        }
      }

      characterGroup.add(characterModel);
      characterLoaded = true;

      // Si el modo a pie ya fue activado antes de completar la descarga
      if (walking) {
        characterGroup.visible = cameraDistance >= 0.6;
        if (actions.idle) {
          actions.idle.reset().play();
          currentAction = actions.idle;
        }
      }
      onInvalidate();
    },
    undefined,
    (err) => console.error('Error cargando modelo tigre_humanoide.glb:', err)
  );

  const walkableModels = [
    { group: site?.getObjectByName('akapana'), minX: -64, maxX: -26, minZ: 14, maxZ: 54 },
    { group: site?.getObjectByName('puma-punku'), minX: 28, maxX: 58, minZ: 19, maxZ: 43 },
    { group: site?.getObjectByName('kalasasaya'), minX: -64, maxX: -20, minZ: -17, maxZ: 11 },
    { group: site?.getObjectByName('kheri-kala'), minX: -11, maxX: 11, minZ: 35, maxZ: 51 }
  ].filter((item) => item.group);

  const surfaceRay = new THREE.Raycaster();
  const surfaceOrigin = new THREE.Vector3();
  const down = new THREE.Vector3(0, -1, 0);

  function groundAt(x, z) {
    // 1. Escalinata sur del Templete Semisubterráneo:
    if (Math.abs(x) < 3.2 && z >= 11.19 && z < 16.93) {
      const step = Math.min(6, Math.floor((z - 11.19) / 0.82));
      return -4.76 + (step + 1) * (4.76 / 7);
    }
    // Patio hundido del Templete (cota de losas de andesita a -4.76m):
    if (Math.abs(x) < 13.2 && Math.abs(z) < 13.2) return -4.76;

    // 2. Escalinatas de Kalasasaya:
    // Escalinata Sur (ingreso frontal desde el Templete):
    if (Math.abs(x - (-42.0)) < 3.4 && z >= 9.0 && z <= 13.5) {
      const t = THREE.MathUtils.clamp((13.5 - z) / 4.5, 0, 1);
      return t * 0.38;
    }
    // Escalinata Norte (salida directa hacia adelante rumbo a Puerta del Sol y de la Luna):
    if (Math.abs(x - (-42.0)) < 3.4 && z >= -15.5 && z <= -11.0) {
      const t = THREE.MathUtils.clamp((z - (-15.5)) / 4.5, 0, 1);
      return t * 0.38;
    }
    // Escalinata Este de Kalasasaya:
    if (Math.abs(z - (-3.0)) < 2.5 && x >= -23.5 && x <= -19.0) {
      const t = THREE.MathUtils.clamp((x - (-19.0)) / 4.5, 0, 1);
      return (1 - t) * 0.38;
    }
    // Escalinata Oeste de Kalasasaya:
    if (Math.abs(z - (-3.0)) < 2.5 && x >= -65.0 && x <= -60.5) {
      const t = THREE.MathUtils.clamp((x - (-65.0)) / 4.5, 0, 1);
      return t * 0.38;
    }

    // 3. Plataforma interior de Kalasasaya:
    if (x >= -61.5 && x <= -22.5 && z >= -15.2 && z <= 9.2) {
      let kFloor = 0.38;
      if (Math.abs(x - (-42.0)) < 5.0 && Math.abs(z - (-3.0)) < 5.0) {
        kFloor = 0.65;
        if (Math.abs(x - (-42.0)) < 3.2 && Math.abs(z - (-3.0)) < 3.2) {
          kFloor = 0.95;
        }
      }
      return kFloor;
    }

    // 4. Suelo general del altiplano:
    const base = Math.abs(x) < 68 && Math.abs(z) < 52 ? 0 : terrainHeight(x, z) - 0.18;
    let floor = base;

    for (const item of walkableModels) {
      if (x < item.minX || x > item.maxX || z < item.minZ || z > item.maxZ) continue;
      surfaceRay.set(surfaceOrigin.set(x, 80, z), down);
      surfaceRay.far = 100;
      const hits = surfaceRay.intersectObject(item.group, true);
      for (const hit of hits) {
        if (hit.point.y > floor + 0.05 && hit.point.y < floor + 3.8) {
          floor = hit.point.y;
          break;
        }
      }
    }
    return floor;
  }

  function blocked(x, z) {
    return obstacles.some((o) => Math.abs(x - o.x) < o.w / 2 + RADIO && Math.abs(z - o.z) < o.d / 2 + RADIO);
  }

  function enter() {
    if (navigator.maxTouchPoints > 0 && !matchMedia('(pointer:fine)').matches) return;
    const x = 3.2;
    const z = 20.0;
    const y = groundAt(x, z);

    playerPos.set(x, y, z);
    characterGroup.position.copy(playerPos);
    characterGroup.rotation.y = Math.PI; // Mirando hacia el norte (hacia el Templete y Kalasasaya)

    walking = true;
    yaw = 0;
    pitch = 0.14;
    cameraDistance = 3.8;

    orbitControls.enabled = false;

    if (characterLoaded) {
      characterGroup.visible = cameraDistance >= 0.6;
      if (actions.idle) {
        actions.idle.reset().play();
        currentAction = actions.idle;
      }
    }

    handleLock();
    try {
      renderer.domElement.requestPointerLock();
    } catch (e) {
      fallbackLook = true;
    }
    updateCamera();
    onInvalidate();
  }

  function exit() {
    if (document.exitPointerLock && document.pointerLockElement === renderer.domElement) {
      document.exitPointerLock();
    }
    handleUnlock();
  }

  function handleLock() {
    walking = true;
    fallbackLook = false;
    keys.clear();
    document.documentElement.classList.add('walk-active');
    button.textContent = 'Pulsa Esc para salir';
    button.setAttribute('aria-label', 'Salir de la exploración a pie con Escape');
    if (hint) {
      hint.textContent = 'WASD: Mover · Rueda: Acercar / Alejar · Espacio: Saltar · V: Vista · Esc: Salir';
    }
    onInvalidate();
  }

  function handleUnlock() {
    if (!walking && orbitControls.enabled) return;
    walking = false;
    keys.clear();
    verticalSpeed = 0;
    document.documentElement.classList.remove('walk-active');

    // Ocultar avatar al salir para mantener el sitio arqueológico como museo panorámico
    characterGroup.visible = false;
    if (currentAction) {
      currentAction.stop();
      currentAction = null;
    }

    const x = playerPos.x;
    const z = playerPos.z;
    const y = groundAt(x, z);

    camera.position.set(x + 21, y + 19, z + 23);
    orbitControls.target.set(x, y + 1.2, z);
    orbitControls.enabled = true;
    orbitControls.update();

    button.textContent = 'Explorar a pie';
    button.setAttribute('aria-label', 'Activar exploración a pie');
    if (hint) {
      hint.textContent = 'Órbita con ratón o gestos';
    }
    onInvalidate();
  }

  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === renderer.domElement) {
      handleLock();
    } else if (walking) {
      handleUnlock();
    }
  });

  document.addEventListener('pointerlockerror', () => {
    fallbackLook = true;
    onInvalidate();
  });

  // Control de cámara orbital alrededor del personaje con el movimiento del ratón
  window.addEventListener('mousemove', (event) => {
    if (!walking) return;
    if (document.pointerLockElement === renderer.domElement || fallbackLook) {
      yaw -= event.movementX * 0.0024;
      pitch = THREE.MathUtils.clamp(pitch + event.movementY * 0.0020, -0.40, 0.82);
      onInvalidate();
    }
  });

  // Soporte universal de zoom con rueda de ratón (acercar/alejar cámara en modo a pie)
  window.addEventListener(
    'wheel',
    (event) => {
      if (!walking) return;
      event.preventDefault();
      // Normalizar según el modo de la rueda (píxeles, líneas o páginas)
      let dy = event.deltaY;
      if (event.deltaMode === 1) dy *= 33;
      else if (event.deltaMode === 2) dy *= 100;

      // Desplazamiento ágil y suave de zoom (RUEDA: Acercar / Alejar)
      const step = Math.sign(dy) * Math.min(Math.abs(dy) * 0.005, 0.65);
      cameraDistance = THREE.MathUtils.clamp(cameraDistance + step, 0.8, 6.8);

      if (characterLoaded) {
        characterGroup.visible = cameraDistance >= 0.6;
      }
      updateCamera();
      onInvalidate();
    },
    { passive: false }
  );

  // Botón principal de entrar/salir a pie
  button.addEventListener('click', () => (walking ? exit() : enter()));

  addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(key)) {
      keys.add(key);
      if (walking) onInvalidate();
    }
    if (event.key === 'Escape' && walking) {
      exit();
      return;
    }
    // Tecla V para alternar distancias de cámara (Tercera persona normal / alejada / primera persona)
    if (key === 'v' && walking) {
      event.preventDefault();
      const presets = [3.8, 5.8, 0.0];
      const curIdx = presets.findIndex((d) => Math.abs(d - cameraDistance) < 0.6);
      cameraDistance = presets[(curIdx + 1) % presets.length];
      if (characterLoaded) {
        characterGroup.visible = cameraDistance >= 0.6;
      }
      onInvalidate();
    }
    // Salto con barra espaciadora
    if (event.code === 'Space' && walking) {
      event.preventDefault();
      if (grounded) {
        verticalSpeed = 6.8;
        grounded = false;
        if (actions.jump) {
          if (currentAction && currentAction !== actions.jump) currentAction.fadeOut(0.15);
          actions.jump.reset().fadeIn(0.15).setLoop(THREE.LoopOnce, 1).play();
          actions.jump.clampWhenFinished = true;
          currentAction = actions.jump;
        }
        onInvalidate();
      }
    }
  });

  addEventListener('keyup', (event) => {
    if (keys.delete(event.key.toLowerCase()) && walking) onInvalidate();
  });

  function updateCamera() {
    if (cameraDistance < 0.6) {
      if (characterLoaded) characterGroup.visible = false;
      const eyeY = playerPos.y + 1.72;
      const lookDist = 12.0;
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);
      const sinY = Math.sin(yaw);
      const cosY = Math.cos(yaw);
      camera.position.set(playerPos.x, eyeY, playerPos.z);
      camera.lookAt(
        playerPos.x - sinY * cosP * lookDist,
        eyeY - sinP * lookDist,
        playerPos.z - cosY * cosP * lookDist
      );
    } else {
      if (characterLoaded) characterGroup.visible = true;
      lookTarget.set(playerPos.x, playerPos.y + ALTURA_OJOS, playerPos.z);

      const cosPitch = Math.cos(pitch);
      const sinPitch = Math.sin(pitch);
      const sinYaw = Math.sin(yaw);
      const cosYaw = Math.cos(yaw);

      const camX = playerPos.x + sinYaw * cosPitch * cameraDistance;
      let camY = lookTarget.y + sinPitch * cameraDistance;
      const camZ = playerPos.z + cosYaw * cosPitch * cameraDistance;

      // Evitar que la cámara pase por debajo del relieve topográfico
      const terrainBelowCam = groundAt(camX, camZ);
      if (camY < terrainBelowCam + 0.35) {
        camY = terrainBelowCam + 0.35;
      }

      camera.position.set(camX, camY, camZ);
      camera.lookAt(lookTarget);
    }
  }

  function update(delta) {
    if (!walking) return;
    const dt = Math.min(delta, 0.05);

    // Actualizar mezclador de animaciones esqueléticas del tigre humanoide
    if (mixer) {
      mixer.update(dt);
    }

    // Vectores direccionales horizontales de la cámara
    forward.set(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
    right.set(Math.cos(yaw), 0, -Math.sin(yaw)).normalize();
    moveDir.set(0, 0, 0);

    if (keys.has('w') || keys.has('arrowup')) moveDir.add(forward);
    if (keys.has('s') || keys.has('arrowdown')) moveDir.sub(forward);
    if (keys.has('d') || keys.has('arrowright')) moveDir.add(right);
    if (keys.has('a') || keys.has('arrowleft')) moveDir.sub(right);

    const isMoving = moveDir.lengthSq() > 0;

    if (isMoving) {
      moveDir.normalize();
      const isRunning = keys.has('shift');
      const speed = isRunning ? 7.6 : 4.6;
      const stepDist = speed * dt;

      const currentFloor = playerPos.y;
      const maxStep = grounded ? 0.88 : Infinity;

      // Desplazamiento independiente en X y Z (wall-sliding fluido sin trabas)
      const nx = playerPos.x + moveDir.x * stepDist;
      const floorX = groundAt(nx, playerPos.z);
      if (!blocked(nx, playerPos.z) && floorX <= currentFloor + maxStep) {
        playerPos.x = nx;
      }

      const nz = playerPos.z + moveDir.z * stepDist;
      const floorZ = groundAt(playerPos.x, nz);
      if (!blocked(playerPos.x, nz) && floorZ <= currentFloor + maxStep) {
        playerPos.z = nz;
      }

      // Rotación suave y fluida del tigre hacia la dirección de avance
      const targetRotationY = Math.atan2(moveDir.x, moveDir.z);
      let angleDiff = targetRotationY - characterGroup.rotation.y;
      angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff)); // Rango [-PI, PI]
      characterGroup.rotation.y += angleDiff * Math.min(1.0, 16.0 * dt);

      // Transición a animación de caminar (Walk)
      if (grounded && actions.walk && currentAction !== actions.walk) {
        if (currentAction) currentAction.fadeOut(0.2);
        actions.walk.reset().fadeIn(0.2).play();
        currentAction = actions.walk;
      }
      if (actions.walk) {
        actions.walk.timeScale = isRunning ? 1.55 : 1.0;
      }
    } else {
      // Transición a animación Idle al detenerse
      if (grounded && actions.idle && currentAction !== actions.idle) {
        if (currentAction) currentAction.fadeOut(0.25);
        actions.idle.reset().fadeIn(0.25).play();
        currentAction = actions.idle;
      }
    }

    // Física vertical (gravedad y apoyo exacto en el suelo)
    const targetFloor = groundAt(playerPos.x, playerPos.z);
    if (!grounded || verticalSpeed > 0) {
      verticalSpeed -= 19.0 * dt;
      playerPos.y += verticalSpeed * dt;
      if (playerPos.y <= targetFloor) {
        playerPos.y = targetFloor;
        verticalSpeed = 0;
        grounded = true;
        // Al aterrizar, reanudar walk o idle
        if (isMoving && actions.walk) {
          if (currentAction !== actions.walk) {
            if (currentAction) currentAction.fadeOut(0.18);
            actions.walk.reset().fadeIn(0.18).play();
            currentAction = actions.walk;
          }
        } else if (actions.idle && currentAction !== actions.idle) {
          if (currentAction) currentAction.fadeOut(0.2);
          actions.idle.reset().fadeIn(0.2).play();
          currentAction = actions.idle;
        }
      }
    } else {
      playerPos.y = targetFloor;
      grounded = true;
    }

    // Actualizar posición del contenedor 3D del personaje
    characterGroup.position.copy(playerPos);

    // Actualizar posición y encuadre de la cámara
    updateCamera();
  }

  return {
    update,
    get walking() {
      return walking;
    },
    get needsUpdate() {
      return walking && (keys.size > 0 || !grounded || Math.abs(verticalSpeed) > 0.0001);
    },
    get position() {
      return playerPos;
    },
    exit
  };
}
