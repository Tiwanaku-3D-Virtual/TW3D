import * as THREE from 'three';

// Distribución optimizada de 13 pilares megalíticos para máxima fluidez y fidelidad arquitectónica
export const kalasasayaPillarPositions = [
  // Muro posterior Norte
  [-18, 0, -10.5],
  [-9, 0, -10.5],
  [0, 0, -10.5],
  [9, 0, -10.5],
  [18, 0, -10.5],
  // Muro frontal Sur (vano de acceso despejado al centro)
  [-18, 0, 10.5],
  [-8, 0, 10.5],
  [8, 0, 10.5],
  [18, 0, 10.5],
  // Flancos laterales Oeste y Este
  [-18, 0, 0],
  [18, 0, 0],
  // Pilares ceremoniales interiores flanqueando el altar central
  [-6, 0, 0],
  [6, 0, 0]
];

export function createKalasasaya() {
  const group = new THREE.Group();
  group.name = 'kalasasaya';
  group.position.set(-42, 0, -3);
  group.userData.infoKey = 'kalasasaya';

  // Carga de textura de andesita para la gran plataforma y muros
  const textureLoader = new THREE.TextureLoader();
  const stoneTex = textureLoader.load('assets/textures/GroundDirtRocky020_COL_2K.jpg');
  stoneTex.colorSpace = THREE.SRGBColorSpace;
  stoneTex.wrapS = stoneTex.wrapT = THREE.RepeatWrapping;
  stoneTex.repeat.set(6, 4);

  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    color: '#c4b79e',
    roughness: 0.85,
    metalness: 0.02
  });

  // Textura y material pulido ceremonial para el gran altar interior
  const altarTex = textureLoader.load('assets/textures/GroundDirtRocky020_COL_2K.jpg');
  altarTex.colorSpace = THREE.SRGBColorSpace;
  altarTex.wrapS = altarTex.wrapT = THREE.RepeatWrapping;
  altarTex.repeat.set(2, 2);

  const altarMat = new THREE.MeshStandardMaterial({
    map: altarTex,
    color: '#d6c8ab',
    roughness: 0.78,
    metalness: 0.03
  });

  // 1. Gran plataforma base de Kalasasaya
  const base = new THREE.Mesh(new THREE.BoxGeometry(40, .65, 25), stoneMat);
  base.position.y = .05;
  base.receiveShadow = true;
  group.add(base);

  // 2. Muros perimetrales de bloques de andesita labrada
  const wallGeo = new THREE.BoxGeometry(1, .65, .8);
  const walls = new THREE.InstancedMesh(wallGeo, stoneMat, 132);
  const d = new THREE.Object3D();
  let n = 0;
  for (const z of [-12, 12]) {
    for (let x = -19; x <= 19; x += 1.25) {
      if (Math.abs(x) < 3 && z === 12) continue;
      d.position.set(x, .65, z);
      d.scale.set(1.3, 1, 1);
      d.updateMatrix();
      walls.setMatrixAt(n++, d.matrix);
    }
  }
  for (const x of [-19, 19]) {
    for (let z = -10; z <= 10; z += 1.25) {
      d.position.set(x, .65, z);
      d.scale.set(1, 1, 1.3);
      d.updateMatrix();
      walls.setMatrixAt(n++, d.matrix);
    }
  }
  walls.count = n;
  walls.instanceMatrix.needsUpdate = true;
  walls.castShadow = walls.receiveShadow = true;
  group.add(walls);

  // 3. Altares ceremoniales de andesita labrada en el centro de Kalasasaya
  // Plataforma escalonada inferior
  const lowerAltar = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.35, 10.0), altarMat);
  lowerAltar.position.set(0, 0.40, 0);
  lowerAltar.castShadow = lowerAltar.receiveShadow = true;
  group.add(lowerAltar);

  // Altar superior elevado sobre el cual preside el Monolito Bennett
  const upperAltar = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.28, 6.5), altarMat);
  upperAltar.position.set(0, 0.68, 0);
  upperAltar.castShadow = upperAltar.receiveShadow = true;
  group.add(upperAltar);

  // 4. Escalinata monumental de acceso sur (conecta cota 0 con la plataforma)
  const stairSteps = 4;
  for (let i = 0; i < stairSteps; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.18, 0.7), altarMat);
    step.position.set(0, 0.08 + i * 0.16, 12.8 - i * 0.65);
    step.castShadow = step.receiveShadow = true;
    group.add(step);
  }

  return group;
}

