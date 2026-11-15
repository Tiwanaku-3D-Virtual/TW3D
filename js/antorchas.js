import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { configureDRACO } from './modelos-3d.js';

/**
 * Sistema de Antorchas Ceremoniales (Pebetero.glb)
 * Puntos estratégicos en Templete Semisubterráneo, Kalasasaya y Pirámide de Akapana.
 * Cada pebetero se fija exactamente al suelo o plataforma mediante Raycaster vertical,
 * cuenta con material de piedra andesita oscura rugosa (0x4a3b2c, roughness: 0.9)
 * y una llama HDR con PointLight de amplio alcance nocturno.
 */

const torchLocations = [
  // Antorchas ceremoniales estratégicas situadas con espacio suficiente para no superponerse ni colisionar con los monumentos:
  // 1. Templete Semisubterráneo: en la plaza exterior frente a la escalinata sur (despejada de los muros)
  { pos: [5.8, 0.0, 19.5], groundY: 0.0, name: 'antorcha-templete' },

  // 2. Kalasasaya: en la explanada de acceso, separada 7m del eje de la escalinata
  { pos: [-35.0, 0.0, 16.0], groundY: 0.0, name: 'antorcha-kalasasaya' },

  // 3. Pirámide de Akapana: en la plaza frontal, despejada 6m de las terrazas
  { pos: [-45.0, 0.0, 11.5], groundY: 0.0, name: 'antorcha-akapana' },

  // 4. Puerta del Sol: flanco izquierdo ceremonial adelantado, con 2.6m de luz respecto al sillar y puntos de historia
  { pos: [4.8, 0.0, -21.5], groundY: 0.0, name: 'antorcha-puerta-del-sol' },

  // 5. Puma Punku: en la explanada frontal, separada 6m de las plataformas
  { pos: [35.0, 0.0, 15.0], groundY: 0.0, name: 'antorcha-puma-punku' },

  // 6. Chachapuma: en el cuadrante frontal izquierdo, con 6m de separación del pedestal
  { pos: [22.5, 0.0, -9.5], groundY: 0.0, name: 'antorcha-chachapuma' },

  // 7. Monolito Bennett: en el patio de Kalasasaya, separada 7m de la estela
  { pos: [-35.5, 0.70, 2.5], groundY: 0.70, name: 'antorcha-bennett' },

  // 8. Puerta de la Luna: flanco este ceremonial adelantado, con 4.8m de separación respecto al monolito
  { pos: [26.6, 0.0, -21.0], groundY: 0.0, name: 'antorcha-puerta-luna' }
];

export async function createTorchSystem(scene, camera = null) {
  const group = new THREE.Group();
  group.name = 'sistema-antorchas-ceremoniales';
  scene.add(group);

  const loader = configureDRACO(new GLTFLoader());
  let pebeteroBase = null;

  // Material de piedra andesita oscura rugosa (0x4a3b2c, roughness: 0.9, metalness: 0.05)
  const andesiteMat = new THREE.MeshStandardMaterial({
    color: 0x4a3b2c,
    roughness: 0.90,
    metalness: 0.05
  });

  try {
    const gltf = await loader.loadAsync('assets/models/Pebetero.glb');
    pebeteroBase = gltf.scene;

    pebeteroBase.traverse((child) => {
      if (child.isMesh) {
        child.material = andesiteMat;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Normalizar altura a exactamente ~1.35 unidades
    const box = new THREE.Box3().setFromObject(pebeteroBase);
    const size = new THREE.Vector3();
    box.getSize(size);
    if (size.y > 0.001) {
      const s = 1.35 / size.y;
      pebeteroBase.scale.set(s, s, s);
    }
  } catch (err) {
    console.warn('No se pudo cargar Pebetero.glb, usando respaldo geométrico:', err);
    pebeteroBase = createFallbackPebetero(andesiteMat);
  }

  // Geometría y material de la llama emisiva HDR
  const flameGeo = new THREE.ConeGeometry(0.18, 0.48, 7);
  flameGeo.translate(0, 0.24, 0);

  const flameMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(2.8, 1.3, 0.25),
    transparent: true,
    opacity: 0.95,
    depthWrite: false
  });

  const flameCoreGeo = new THREE.ConeGeometry(0.09, 0.32, 6);
  flameCoreGeo.translate(0, 0.16, 0);
  const flameCoreMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(3.6, 2.5, 0.9),
    transparent: true,
    opacity: 0.98,
    depthWrite: false
  });

  const torches = [];
  let currentTargetIntensity = 1.2;
  let currentDistance = 18;
  let currentDecay = 1.5;
  let flamesVisible = true;

  // Altura del cuenco superior escalado a 1.35m
  const flameY = 1.32;
  let currentAtmosphere = 'sunset';

  // Raycaster vertical para asentar cada pebetero sobre el suelo o plataforma
  function snapPebetero(pebetero, loc) {
    pebetero.position.y = loc.groundY ?? loc.pos[1] ?? 0;
  }

  torchLocations.forEach((loc, index) => {
    const torchObj = pebeteroBase.clone(true);
    torchObj.name = loc.name;
    // Asentamiento inmediato en la cota de suelo del modelo (y = groundY)
    torchObj.position.set(loc.pos[0], loc.groundY, loc.pos[2]);

    snapPebetero(torchObj, loc);

    const flameMesh = new THREE.Mesh(flameGeo, flameMaterial);
    flameMesh.position.set(0, flameY, 0);
    flameMesh.name = 'malla-llama';

    const flameCore = new THREE.Mesh(flameCoreGeo, flameCoreMaterial);
    flameMesh.add(flameCore);
    torchObj.add(flameMesh);

    // PointLight cálida (#ff9038) de gran potencia y alcance
    const light = new THREE.PointLight(0xff9038, 3.2, 24, 1.4);
    light.position.set(0, flameY + 0.15, 0);
    light.castShadow = false;
    torchObj.add(light);

    group.add(torchObj);

    torches.push({
      torchObj,
      flameMesh,
      light,
      phase: index * 1.73 + Math.random() * 0.5,
      loc
    });
  });

  // Re-ajuste tras la carga asíncrona de los modelos del sitio y terreno
  function reSnapAll() {
    torches.forEach(({ torchObj, loc }) => {
      snapPebetero(torchObj, loc);
    });
  }

  // Re-proyecta tras 800ms y 2000ms para asegurar coincidencia con suelo.glb y modelos del sitio
  setTimeout(reSnapAll, 800);
  setTimeout(reSnapAll, 2200);

  function setAtmosphere(modeKey) {
    currentAtmosphere = modeKey;

    if (modeKey === 'day') {
      currentTargetIntensity = 0.0;
      flamesVisible = false;
      camTargetPoint = 0.0;
      camTargetSpot = 0.0;
    } else if (modeKey === 'sunset') {
      currentTargetIntensity = 3.2; // Aumentado para presencia visual clara
      currentDistance = 24;
      currentDecay = 1.4;
      flamesVisible = true;
      camTargetPoint = 2.8;
      camTargetSpot = 2.4;
    } else if (modeKey === 'night') {
      // Noche: iluminación monumental amplia que baña los templos ("iluminen mas aun")
      currentTargetIntensity = 8.5; // Aumentado significativamente
      currentDistance = 38;
      currentDecay = 1.2;
      flamesVisible = true;
      camTargetPoint = 9.5;
      camTargetSpot = 8.0;
    }

    torches.forEach(({ flameMesh, light }) => {
      flameMesh.visible = flamesVisible;
      light.distance = currentDistance;
      light.decay = currentDecay;
      if (!flamesVisible) light.intensity = 0;
    });
  }

  function update(time) {
    // Antorchas fijas de los monumentos (iluminan con potencia y parpadeo orgánico)
    if (flamesVisible || currentTargetIntensity > 0) {
      for (let i = 0; i < torches.length; i++) {
        const { flameMesh, light, phase } = torches[i];
        const flicker =
          Math.sin(time * 8.5 + phase) * 0.14 +
          Math.cos(time * 19.3 + phase * 2.1) * 0.08 +
          Math.sin(time * 33.7 + phase * 0.7) * 0.04;

        const dynamicIntensity = Math.max(0, currentTargetIntensity * (1.0 + flicker));
        light.intensity = dynamicIntensity;

        const scaleXZ = 1.0 + flicker * 0.5;
        const scaleY = 1.0 + flicker * 1.2;
        flameMesh.scale.set(scaleXZ, scaleY, scaleXZ);
      }
    }
  }

  setAtmosphere('sunset');

  return {
    group,
    setAtmosphere,
    reSnapAll,
    update
  };
}

function createFallbackPebetero(mat) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.48, 0.28, 8), mat);
  base.position.y = 0.14;
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.85, 8), mat);
  col.position.y = 0.70;
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.22, 0.35, 8), mat);
  bowl.position.y = 1.18;
  g.add(base, col, bowl);
  return g;
}
