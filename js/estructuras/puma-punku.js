import * as THREE from 'three';

export function createPumaPunku() {
  const group = new THREE.Group();
  group.name = 'puma-punku';
  group.position.set(43, 0, 31);
  group.userData.infoKey = 'pumaPunku';

  // Textura pétrea de andesita 2K para las terrazas y el altar ceremonial de Puma Punku
  const textureLoader = new THREE.TextureLoader();
  const stoneTex = textureLoader.load('assets/textures/GroundDirtRocky020_COL_2K.jpg');
  stoneTex.colorSpace = THREE.SRGBColorSpace;
  stoneTex.wrapS = stoneTex.wrapT = THREE.RepeatWrapping;
  stoneTex.repeat.set(5, 4);

  const andesiteMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    color: '#a39987',
    roughness: 0.82,
    metalness: 0.03
  });

  // Textura para el altar ceremonial central (losas pulidas)
  const altarTex = textureLoader.load('assets/textures/GroundDirtRocky020_COL_2K.jpg');
  altarTex.colorSpace = THREE.SRGBColorSpace;
  altarTex.wrapS = altarTex.wrapT = THREE.RepeatWrapping;
  altarTex.repeat.set(2, 2);

  const altarMat = new THREE.MeshStandardMaterial({
    map: altarTex,
    color: '#b8ab96',
    roughness: 0.75,
    metalness: 0.03
  });

  // 1. Plataformas escalonadas de andesita labrada que sirven de basamento monumental
  const platforms = [
    { w: 28, d: 20, y: 0.25 },
    { w: 24, d: 16, y: 0.65 },
    { w: 19, d: 12, y: 0.95 }
  ];

  platforms.forEach(({ w, d, y }, index) => {
    const platform = new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, d), andesiteMat);
    platform.name = `plataforma-pumapunku-${index + 1}`;
    platform.position.y = y;
    platform.castShadow = platform.receiveShadow = true;
    group.add(platform);
  });

  // 2. Altar ceremonial central texturizado donde se exhiben los megalitos de Puma Punku
  const centralAltar = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.35, 3.8), altarMat);
  centralAltar.position.set(0, 1.35, 0);
  centralAltar.castShadow = centralAltar.receiveShadow = true;
  group.add(centralAltar);

  // Basamento escalonado bajo el altar central
  const altarBase = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.22, 5.2), altarMat);
  altarBase.position.set(0, 1.22, 0);
  altarBase.castShadow = altarBase.receiveShadow = true;
  group.add(altarBase);

  // 3. Escalinata frontal monumental de acceso a las terrazas de Puma Punku
  const stepCount = 3;
  for (let i = 0; i < stepCount; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.22, 0.8), altarMat);
    step.position.set(0, 0.12 + i * 0.24, 10.8 - i * 0.75);
    step.castShadow = step.receiveShadow = true;
    group.add(step);
  }

  return group;
}

