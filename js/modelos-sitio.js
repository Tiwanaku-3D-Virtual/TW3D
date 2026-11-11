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
    normalPath: 'assets/textures/SunGate_normal.png'
  },
  {
    path: 'assets/models/piramide2.glb.glb',
    infoKey: 'akapana',
    parentName: 'akapana',
    position: [0, 0, 0],
    fitSize: 36,
    albedoPath: 'assets/textures/akapana/509b3feffce3dcdd8a27aa21e92175a3.png',
    textureRepeat: 3,
    tint: '#d28b64',
    tintMode: 'replace'
  },
  {
    path: 'assets/models/chachapuma.glb',
    infoKey: 'chachapuma',
    parentName: 'chachapuma',
    position: [0, 0.64, 0],
    fitSize: 2.7,
    rotationY: -Math.PI / 2
  },
  {
    path: 'assets/models/monolito_ponce.glb',
    infoKey: 'monolito',
    parentName: 'templo',
    position: [0, -4.8, 0],
    fitSize: 5.2
  },
  {
    path: 'assets/models/pared.glb',
    infoKey: 'templo',
    parentName: 'templo',
    position: [0, -4.8, 0],
    fitSize: 28.4,
    albedoPath: 'assets/textures/GroundDirtRocky020_COL_2K.jpg',
    textureRepeat: 4,
    tint: '#d8cbb1',
    tintMode: 'replace',
    spawnClava: true,
    perimeter: true,
    excludeNames: ['Master_Ichu', 'Master_Ichu_Geo', 'Master_Ichu_Geo.001']
  },
  {
    path: 'assets/models/Monolito.glb',
    infoKey: 'bennett',
    parentName: 'kalasasaya',
    position: [0, 0.82, 0],
    fitSize: 6.8
  }
];

const pumaRuins = [
  { path: 'assets/models/ruina_pumapunku1.glb', position: [-4.5, 1.2, 0], fitSize: 8.0, rotationY: -0.12 },
  { path: 'assets/models/ruina_pumapunku2.glb', position: [4.5, 1.2, 0], fitSize: 8.0, rotationY: 0.08 }
];

function removeNamed(parent, names = []) {
  const wanted = new Set(names);
  const matches = [];
  parent.traverse((object) => { if (wanted.has(object.name)) matches.push(object); });
  matches.forEach((object) => object.parent?.remove(object));
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
    // Muros perimetrales completos del templete a radio D = 13.65 (se cruzan y cierran a 28.4m de ancho)
    const sides = [
      { position: [0, -4.8, 13.65], rotation: 0 },
      { position: [13.65, -4.8, 0], rotation: Math.PI / 2 },
      { position: [0, -4.8, -13.65], rotation: Math.PI },
      { position: [-13.65, -4.8, 0], rotation: -Math.PI / 2 }
    ];
    sides.forEach(({ position, rotation }, index) => {
      const side = index === 0 ? model : model.clone(true);
      side.position.set(...position);
      side.rotation.y = rotation;
      if (index === 0) createSouthEntryOpening(side);
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
  wall.updateWorldMatrix(true, true);
  const blocksToRemove = [];
  const headsToRemove = [];
  wall.traverse((object) => {
    const position = wall.worldToLocal(object.getWorldPosition(new THREE.Vector3()));
    if (/^Bloque_F\d+_B\d+$/.test(object.name) && Math.abs(position.x) < 4.0) {
      blocksToRemove.push(object);
    }
    if (object.name.startsWith('cabeza-clava-modelo-') && Math.abs(position.x) < 3.6) {
      headsToRemove.push(object);
    }
  });
  [...blocksToRemove, ...headsToRemove].forEach((object) => object.parent?.remove(object));
}

async function addAsset(site, asset) {
  try {
    const model = await loadLocalModel(asset.path, asset);
    if (asset.spawnClava) await addSpawnedClavas(model);
    attach(site, asset, model);
  } catch (error) {
    console.warn(`Error al cargar modelo 3D local para ${asset.path}:`, error);
  }
}

async function addSpawnedClavas(wall) {
  const headPath = 'assets/models/cabeza_clava.glb';
  const base = await loadLocalModel(headPath, { fitSize: 1.15 });

  // Franja interior a media altura para que los rostros queden empotrados y visibles desde el patio.
  const headLayout = [
    { x: -10, y: 2.35 },
    { x: -5, y: 2.70 },
    { x: 0, y: 2.45 },
    { x: 5, y: 2.70 },
    { x: 10, y: 2.35 }
  ];

  headLayout.forEach(({ x, y }, index) => {
    const head = base.clone(true);
    // La pared tiene su cara interior hacia -Z; se empotra el centro de cada cabeza en esa cara.
    head.position.set(x, y, -0.38);
    // Rostro hacia el interior y girado 90° a la izquierda respecto a esa orientación.
    head.rotation.set(0, Math.PI + Math.PI / 2, 0);
    head.name = `cabeza-clava-modelo-${index + 1}`;
    head.userData.infoKey = 'templo';
    wall.add(head);
  });
}

async function replacePillars(site) {
  try {
    const base = await loadLocalModel('assets/models/pilar.glb', { fitSize: 3.6 });
    const group = site.getObjectByName('kalasasaya');
    if (!group) return;
    removeNamed(group, ['pilares-procedurales-kalasasaya']);
    kalasasayaPillarPositions.forEach((position, index) => {
      const pillar = base.clone(true);
      pillar.position.set(position[0], .35, position[2]);
      pillar.rotation.y = (index % 3 - 1) * .025;
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
