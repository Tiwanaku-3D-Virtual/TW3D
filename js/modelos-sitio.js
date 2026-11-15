import * as THREE from 'three';
import { loadLocalModel } from './modelos-3d.js';
import { kalasasayaPillarPositions } from './estructuras/kalasasaya.js';

const siteAssets = [
  {
    path: 'assets/models/SunGate.glb',
    infoKey: 'puertaSol',
    position: [0, 0, -24],
    rotationY: Math.PI / 2,
    scale: 1.25,
    center: false,
    albedoPath: 'assets/textures/SunGate_albedo.png',
    normalPath: 'assets/textures/SunGate_normal.png',
    roughness: 0.84,
    metalness: 0.03
  },
  {
    path: 'assets/models/luna.glb',
    infoKey: 'puertaLuna',
    position: [22.0, 0, -24.0],
    rotationY: 0,
    fitSize: 4.8,
    center: false,
    roughness: 0.88,
    metalness: 0.02
  },
  {
    path: 'assets/models/piramide2.glb.glb',
    infoKey: 'akapana',
    parentName: 'akapana',
    position: [0, 0, 0],
    fitSize: 36,
    albedoPath: 'assets/textures/akapana/509b3feffce3dcdd8a27aa21e92175a3.png',
    textureRepeat: 3,
    tint: '#7a5639', // Tono unificado de piedra arenisca/terracota andina
    tintMode: 'replace',
    roughness: 0.88,
    metalness: 0.04
  },
  {
    path: 'assets/models/chachapuma.glb',
    infoKey: 'chachapuma',
    parentName: 'chachapuma',
    position: [0, 0.64, 0],
    fitSize: 2.7,
    rotationY: -Math.PI / 2,
    roughness: 0.80,
    metalness: 0.04
  },
  {
    path: 'assets/models/monolito_ponce.glb',
    infoKey: 'monolito',
    parentName: 'templo',
    position: [0, -4.8, 0],
    fitSize: 5.2,
    roughness: 0.82,
    metalness: 0.03
  },
  {
    path: 'assets/models/pared.glb',
    infoKey: 'templo',
    parentName: 'templo',
    position: [0, -4.8, 0],
    fitSize: 28.4,
    center: false,
    albedoPath: 'assets/textures/GroundDirtRocky020_COL_2K.jpg',
    textureRepeat: 4,
    tint: '#d8cbb1',
    tintMode: 'replace',
    roughness: 0.86,
    metalness: 0.02,
    spawnClava: true,
    perimeter: true,
    excludeNames: ['Master_Ichu', 'Master_Ichu_Geo', 'Master_Ichu_Geo.001']
  },
  {
    path: 'assets/models/Monolito.glb',
    infoKey: 'bennett',
    parentName: 'kalasasaya',
    position: [0, 0.82, 0],
    fitSize: 6.8,
    roughness: 0.84,
    metalness: 0.03
  },
  // Muros perimetrales monumentales (muros.glb): escala vertical 1.72x y perímetro ampliado para rodear Akapana
  {
    path: 'assets/models/muros.glb',
    infoKey: 'muros',
    position: [-6.0, 0, 8.0],
    scale: [1.46, 1.72, 1.24],
    center: false,
    albedoPath: 'assets/textures/GroundDirtRocky020_COL_2K.jpg',
    textureRepeat: 6,
    tint: '#7a5639', // Unificado con Pirámide de Akapana
    tintMode: 'replace',
    roughness: 0.88,
    metalness: 0.04
  }
];

const pumaRuins = [
  { path: 'assets/models/ruina_pumapunku1.glb', position: [-4.5, 1.2, 0], fitSize: 8.0, rotationY: -0.12, roughness: 0.82, metalness: 0.03 },
  { path: 'assets/models/ruina_pumapunku2.glb', position: [4.5, 1.2, 0], fitSize: 8.0, rotationY: 0.08, roughness: 0.82, metalness: 0.03 }
];

function removeNamed(parent, names = []) {
  const wanted = new Set(names);
  const matches = [];
  parent.traverse((object) => { if (wanted.has(object.name)) matches.push(object); });
  matches.forEach((object) => object.parent?.remove(object));
}

function bakeWallCentering(model) {
  model.position.set(0, 0, 0);
  model.rotation.set(0, 0, 0);
  model.updateWorldMatrix(true, true);

  const bounds = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  bounds.getCenter(center);
  const minY = bounds.min.y;

  // Desplaza cada elemento para que (0, 0, 0) sea el centro horizontal, base inferior y centro de espesor
  const offset = new THREE.Vector3(-center.x, -minY, -center.z);
  model.children.forEach((child) => {
    child.position.add(offset);
  });

  model.position.set(0, 0, 0);
  model.rotation.set(0, 0, 0);
  model.updateWorldMatrix(true, true);
  return model;
}

function attach(site, asset, model) {
  const previous = (asset.oldName || asset.replaceName) ? site.getObjectByName(asset.oldName || asset.replaceName) : null;
  const parent = asset.parentName ? site.getObjectByName(asset.parentName) : previous?.parent || site;
  if (!parent) return;
  if (previous) previous.parent.remove(previous);
  if (asset.removeNames?.length) removeNamed(parent, asset.removeNames);

  if (asset.perimeter) {
    const perimeter = new THREE.Group();
    perimeter.name = 'templete-muros-modelos-locales';
    // Cuatro muros perimetrales de pared a pared (cerrando las 4 esquinas a radio 13.65m)
    const sides = [
      { position: [0, -4.8, 13.65], rotation: 0, isSouth: true },
      { position: [13.65, -4.8, 0], rotation: Math.PI / 2, isSouth: false },
      { position: [0, -4.8, -13.65], rotation: Math.PI, isSouth: false },
      { position: [-13.65, -4.8, 0], rotation: -Math.PI / 2, isSouth: false }
    ];
    sides.forEach(({ position, rotation, isSouth }, index) => {
      const side = index === 0 ? model : model.clone(true);
      side.position.set(...position);
      side.rotation.y = rotation;
      if (isSouth) {
        createSouthEntryOpening(side);
      }
      side.name = `muro-templete-modelo-${index + 1}`;
      side.userData.infoKey = asset.infoKey;
      perimeter.add(side);
    });
    parent.add(perimeter);
    return;
  }

  model.position.set(...asset.position);
  model.rotation.y = asset.rotationY || 0;
  model.userData.infoKey = asset.infoKey;
  model.name = `${asset.infoKey}-modelo-local`;
  parent.add(model);
}

function createSouthEntryOpening(wall) {
  wall.updateMatrixWorld(true);
  const toRemove = [];
  wall.traverse((object) => {
    if (object === wall) return;
    const localPos = wall.worldToLocal(object.getWorldPosition(new THREE.Vector3()));
    // Apertura exacta para la escalinata sur: deja libre el pasillo de 6.8m (|x| < 3.4m)
    if (Math.abs(localPos.x) < 3.4) {
      if (/^Bloque_F\d+_B\d+$/.test(object.name) || object.name.startsWith('cabeza-clava-modelo-') || object.name.startsWith('cabeza-clava-exhibicion-')) {
        toRemove.push(object);
      }
    }
  });
  toRemove.forEach((object) => object.parent?.remove(object));
}

function createFallbackTempleteWall(asset) {
  const wallGroup = new THREE.Group();
  wallGroup.name = 'muro-templete-base-grupo';

  const textureLoader = new THREE.TextureLoader();
  const stoneTex = textureLoader.load('assets/textures/GroundDirtRocky020_COL_2K.jpg');
  stoneTex.colorSpace = THREE.SRGBColorSpace;
  stoneTex.wrapS = stoneTex.wrapT = THREE.RepeatWrapping;
  stoneTex.repeat.set(6, 2);

  const mat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    color: '#d8cbb1',
    roughness: 0.86,
    metalness: 0.02
  });

  const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(28.4, 4.8, 0.8), mat);
  wallMesh.position.set(0, 2.4, 0);
  wallMesh.castShadow = true;
  wallMesh.receiveShadow = true;
  wallMesh.name = 'muro-bloques-templete-base';
  wallGroup.add(wallMesh);

  return wallGroup;
}

async function addAsset(site, asset) {
  try {
    let model;
    try {
      model = await loadLocalModel(asset.path, asset);
    } catch (err) {
      if (asset.perimeter) {
        console.warn(`Activando muro de respaldo para Templete (${asset.path}):`, err);
        model = createFallbackTempleteWall(asset);
      } else {
        throw err;
      }
    }
    if (asset.perimeter) {
      bakeWallCentering(model);
    }
    if (asset.spawnClava) await addSpawnedClavas(model);
    attach(site, asset, model);
  } catch (error) {
    console.warn(`Error al cargar modelo 3D local para ${asset.path}:`, error);
  }
}

async function addSpawnedClavas(wall) {
  const headPath = 'assets/models/cabeza_clava.glb';
  let base = null;
  try {
    base = await loadLocalModel(headPath, { fitSize: 1.15, roughness: 0.85, metalness: 0.03, center: true });
    base.traverse((child) => {
      if (child.isMesh) {
        child.material.side = THREE.DoubleSide;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  } catch (error) {
    console.warn('No se pudo cargar cabeza_clava.glb:', error);
    return;
  }

  // Distribución arqueológica monumental de pared a pared en dos hileras simétricas
  const headLayout = [];
  // Fila superior (y = 2.85m): 13 cabezas distribuidas de -12.0m a +12.0m cada 2.0m
  for (let x = -12.0; x <= 12.05; x += 2.0) {
    headLayout.push({ x: Math.round(x * 10) / 10, y: 2.85 });
  }
  // Fila inferior (y = 1.75m): 12 cabezas intercaladas de -11.0m a +11.0m cada 2.0m
  for (let x = -11.0; x <= 11.05; x += 2.0) {
    headLayout.push({ x: Math.round(x * 10) / 10, y: 1.75 });
  }

  headLayout.forEach(({ x, y }, index) => {
    const head = base.clone(true);
    // z = -0.42 coloca la cabeza clava perfectamente empotrada en el paramento interior
    head.position.set(x, y, -0.42);
    head.rotation.set(0, Math.PI + Math.PI / 2, 0);
    head.name = `cabeza-clava-modelo-${index + 1}`;
    head.userData.infoKey = 'templo';
    wall.add(head);
  });
}

async function replacePillars(site) {
  try {
    const base = await loadLocalModel('assets/models/pilar.glb', { fitSize: 3.6, roughness: 0.84, metalness: 0.03 });
    const group = site.getObjectByName('kalasasaya');
    if (!group) return;
    removeNamed(group, ['pilares-procedurales-kalasasaya']);
    kalasasayaPillarPositions.forEach((position, index) => {
      const pillar = base.clone(true);
      pillar.position.set(position[0], 0.35, position[2]);
      pillar.rotation.y = (index % 3 - 1) * 0.025;
      pillar.name = `pilar-kalasasaya-${index + 1}`;
      pillar.userData.infoKey = 'kalasasaya';
      group.add(pillar);
    });
  } catch (error) {
    console.warn('Se conservan los pilares existentes de Kalasasaya.', error);
  }
}

async function replacePumaPunku(site) {
  const group = site.getObjectByName('puma-punku');
  if (!group) return;
  try {
    const loaded = await Promise.all(
      pumaRuins.map(async (asset) => {
        try {
          const model = await loadLocalModel(asset.path, asset);
          return { asset, model };
        } catch (err) {
          console.warn(`No se pudo cargar ${asset.path}:`, err);
          return null;
        }
      })
    );
    removeNamed(group, ['columnas-procedurales-puma-punku', 'dinteles-procedurales-puma-punku']);
    loaded.forEach((item, index) => {
      if (!item) return;
      const { asset, model } = item;
      model.position.set(...asset.position);
      model.rotation.y = asset.rotationY ?? 0;
      model.name = `ruina-pumapunku-${index + 1}`;
      model.userData.infoKey = 'pumaPunku';
      group.add(model);
    });
  } catch (error) {
    console.warn('Error al cargar ruinas de Puma Punku:', error);
  }
}

export async function addExistingSiteModels(site) {
  await Promise.all([
    ...siteAssets.map((asset) => addAsset(site, asset)),
    replacePillars(site),
    replacePumaPunku(site)
  ]);
}
