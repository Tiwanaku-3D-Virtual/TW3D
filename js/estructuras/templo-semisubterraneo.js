import * as THREE from 'three';

/**
 * Templete Semisubterráneo de Tiwanaku:
 * Patio ceremonial hundido a cota -4.8m.
 * Base del piso de losas y sellado perimetral rasante al terreno exterior (y = -0.18m).
 * Los 4 muros completos con cabezas clavas se integran desde assets/models/pared.glb.
 * Sin elementos procedurales toscos ni superposiciones que desordenen el conjunto.
 */
export function createTemplete() {
  const group = new THREE.Group();
  group.name = 'templo';
  group.userData.infoKey = 'templo';

  // Textura pétrea de andesita cálida para losas y albardilla perimetral
  const textureLoader = new THREE.TextureLoader();
  const stoneTex = textureLoader.load('assets/textures/GroundDirtRocky020_COL_2K.jpg');
  stoneTex.colorSpace = THREE.SRGBColorSpace;
  stoneTex.wrapS = stoneTex.wrapT = THREE.RepeatWrapping;
  stoneTex.repeat.set(6, 2);

  const andesiteMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    color: '#d6caa7',
    roughness: 0.85,
    metalness: 0.02
  });

  const floorMat = new THREE.MeshStandardMaterial({
    color: '#8f8570',
    roughness: 0.95,
    metalness: 0.02
  });

  // 1. Losa de cimentación del patio hundido: 29.0 x 29.0 a cota y = -5.05
  // Se extiende por debajo de los 4 muros 3D (que se asientan a radio 13.65) sellando la base
  const floor = new THREE.Mesh(new THREE.BoxGeometry(29.0, 0.45, 29.0), floorMat);
  floor.position.set(0, -5.05, 0);
  floor.receiveShadow = true;
  group.add(floor);

  // 2. Pavimento interior de losas de andesita labrada en el patio ceremonial (26m x 26m)
  const tileGeo = new THREE.BoxGeometry(1.35, 0.12, 1.15);
  const tileMat = new THREE.MeshStandardMaterial({ color: '#918772', roughness: 0.92 });
  const tiles = [];
  for (let x = -13.0; x <= 13.0; x += 1.45) {
    for (let z = -13.0; z <= 13.0; z += 1.35) {
      tiles.push([x, z]);
    }
  }
  const paving = new THREE.InstancedMesh(tileGeo, tileMat, tiles.length);
  paving.receiveShadow = true;
  const dummy = new THREE.Object3D();
  const tileColor = new THREE.Color();
  const stairWidth = 5.8;
  let pavingCount = 0;
  tiles.forEach(([x, z]) => {
    if (Math.abs(x) < 3.65 && z > 10.5) return;
    dummy.position.set(x, -4.82, z);
    dummy.rotation.y = (Math.random() - 0.5) * 0.06;
    dummy.scale.set(0.88 + Math.random() * 0.22, 1, 0.88 + Math.random() * 0.22);
    dummy.updateMatrix();
    paving.setMatrixAt(pavingCount, dummy.matrix);
    tileColor.set('#8e846f').offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);
    paving.setColorAt(pavingCount, tileColor);
    pavingCount++;
  });
  paving.count = pavingCount;
  paving.instanceMatrix.needsUpdate = true;
  if (paving.instanceColor) paving.instanceColor.needsUpdate = true;
  group.add(paving);

  // 3. Bloques subterráneos de contención y relleno exterior ("para que no se vea el piso de abajo")
  // Se ubican detrás de los muros 3D (desde radio 13.8 hasta 17.4) y sellan la zanja desde -4.9m hasta -0.18m
  // Su cara superior queda a y = -0.18m, exactamente rasante con la malla del terreno altiplánico.
  const earthMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    color: '#ab9f86',
    roughness: 0.96,
    metalness: 0.01
  });

  const trenchSlabs = [
    // Norte: z de -13.8 a -17.4 (ancho en X = 35.0, altura = 4.8, grosor = 3.6)
    { pos: [0, -2.55, -15.6], size: [35.0, 4.8, 3.6] },
    // Sur: se deja libre la abertura central para que la escalera llegue al terreno.
    { pos: [-10.25, -2.55, 15.6], size: [14.5, 4.8, 3.6] },
    { pos: [10.25, -2.55, 15.6], size: [14.5, 4.8, 3.6] },
    // Este: x de 13.8 a 17.4 (largo en Z = 27.6 entre los tramos norte y sur)
    { pos: [15.6, -2.55, 0], size: [3.6, 4.8, 27.6] },
    // Oeste: x de -13.8 a -17.4
    { pos: [-15.6, -2.55, 0], size: [3.6, 4.8, 27.6] }
  ];

  trenchSlabs.forEach(({ pos, size }) => {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(...size), earthMat);
    slab.position.set(...pos);
    slab.receiveShadow = true;
    group.add(slab);
  });

  // 4. Albardilla / acera perimetral de piedra labrada a cota de terreno (al ras, y = -0.10m, grosor 0.16m)
  // Bordea exteriormente el templete de forma limpia, elegante y simétrica en los 4 lados.
  const rimSlabs = [
    { pos: [0, -0.10, -14.3], size: [30.4, 0.16, 1.2] },
    { pos: [-9.1, -0.10, 14.3], size: [12.2, 0.16, 1.2] },
    { pos: [9.1, -0.10, 14.3], size: [12.2, 0.16, 1.2] },
    { pos: [14.3, -0.10, 0], size: [1.2, 0.16, 28.0] },
    { pos: [-14.3, -0.10, 0], size: [1.2, 0.16, 28.0] }
  ];

  rimSlabs.forEach(({ pos, size }) => {
    const rim = new THREE.Mesh(new THREE.BoxGeometry(...size), andesiteMat);
    rim.position.set(...pos);
    rim.receiveShadow = true;
    group.add(rim);
  });

  // Escalinata de acceso sur: siete peldaños conectan el patio a -4.8 m con el exterior.
  const stepCount = 7;
  const stepRise = 4.8 / stepCount;
  const stepDepth = 0.82;
  for (let i = 0; i < stepCount; i++) {
    const height = stepRise * (i + 1);
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(stairWidth, height, stepDepth),
      andesiteMat
    );
    step.position.set(0, -4.8 + height / 2, 11.6 + i * stepDepth);
    step.castShadow = step.receiveShadow = true;
    step.name = `escalon-acceso-templete-${i + 1}`;
    step.userData.infoKey = 'templo';
    group.add(step);
  }

  return group;
}
