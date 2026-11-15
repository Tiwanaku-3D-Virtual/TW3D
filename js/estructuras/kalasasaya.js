import * as THREE from 'three';

// Distribución optimizada de pilares megalíticos con accesos ceremoniales libres al Norte y Sur
export const kalasasayaPillarPositions = [
  // Muro posterior Norte (vano de salida despejado en el centro)
  [-18, 0, -10.5],
  [-9, 0, -10.5],
  [-4.5, 0, -10.5],
  [4.5, 0, -10.5],
  [9, 0, -10.5],
  [18, 0, -10.5],
  // Muro frontal Sur (vano de acceso despejado en el centro)
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

  // 2. Muros perimetrales de bloques de andesita labrada con vanos de acceso y salida al Norte, Sur, Este y Oeste
  const wallGeo = new THREE.BoxGeometry(1, .65, .8);
  const walls = new THREE.InstancedMesh(wallGeo, stoneMat, 132);
  const d = new THREE.Object3D();
  let n = 0;
  for (const z of [-12, 12]) {
    for (let x = -19; x <= 19; x += 1.25) {
      // Vano ceremonial de 6.4m tanto en el Sur (ingreso) como en el Norte (salida recta)
      if (Math.abs(x) < 3.2) continue;
      d.position.set(x, .65, z);
      d.scale.set(1.3, 1, 1);
      d.updateMatrix();
      walls.setMatrixAt(n++, d.matrix);
    }
  }
  for (const x of [-19, 19]) {
    for (let z = -10; z <= 10; z += 1.25) {
      // Vanos laterales en Este y Oeste para circulación fluida
      if (Math.abs(z) < 2.5) continue;
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

  // 4. Escalinatas monumentales de acceso y salida (conectan cota 0 con la plataforma de Kalasasaya)
  const stairSteps = 4;
  for (let i = 0; i < stairSteps; i++) {
    // Escalinata sur (ingreso principal desde el Templete)
    const southStep = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.18, 0.75), altarMat);
    southStep.position.set(0, 0.08 + i * 0.16, 12.8 - i * 0.65);
    southStep.castShadow = southStep.receiveShadow = true;
    group.add(southStep);

    // Escalinata norte (salida directa al continuar caminando hacia adelante hacia la Puerta del Sol y la Luna)
    const northStep = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.18, 0.75), altarMat);
    northStep.position.set(0, 0.08 + i * 0.16, -12.8 + i * 0.65);
    northStep.castShadow = northStep.receiveShadow = true;
    group.add(northStep);
  }

  // Escalinatas laterales menores en Este y Oeste
  for (let i = 0; i < 2; i++) {
    const eastStep = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.22, 4.4), altarMat);
    eastStep.position.set(19.8 - i * 0.7, 0.12 + i * 0.20, 0);
    eastStep.castShadow = eastStep.receiveShadow = true;
    group.add(eastStep);

    const westStep = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.22, 4.4), altarMat);
    westStep.position.set(-19.8 + i * 0.7, 0.12 + i * 0.20, 0);
    westStep.castShadow = westStep.receiveShadow = true;
    group.add(westStep);
  }

  return group;
}

