import * as THREE from 'three';

const stone = new THREE.MeshStandardMaterial({ color: '#948a73', roughness: 0.96 });
function slab(group, w, d, y = 0.35) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.7, d), stone);
  m.position.y = y;
  m.castShadow = m.receiveShadow = true;
  group.add(m);
  return m;
}

export function createKheriKala() {
  const g = new THREE.Group();
  g.name = 'kheri-kala';
  g.position.set(0, 0, 43);
  g.userData.infoKey = 'kheriKala';

  // Textura pétrea de andesita para Kheri Kala
  const textureLoader = new THREE.TextureLoader();
  const kheriTex = textureLoader.load('assets/textures/GroundDirtRocky020_COL_2K.jpg');
  kheriTex.colorSpace = THREE.SRGBColorSpace;
  kheriTex.wrapS = kheriTex.wrapT = THREE.RepeatWrapping;
  kheriTex.repeat.set(4, 3);

  const kheriStone = new THREE.MeshStandardMaterial({
    map: kheriTex,
    color: '#b8ab91',
    roughness: 0.88,
    metalness: 0.02
  });

  // 1. Plataforma base ceremonial texturizada
  const base = new THREE.Mesh(new THREE.BoxGeometry(19, 0.7, 12), kheriStone);
  base.position.y = 0.35;
  base.castShadow = base.receiveShadow = true;
  g.add(base);

  // 2. Muro perimetral bajo de andesita labrada texturizada
  const wallGeo = new THREE.BoxGeometry(1, 0.9, 0.9);
  const mesh = new THREE.InstancedMesh(wallGeo, kheriStone, Math.ceil(19 + 12) * 2);
  const obj = new THREE.Object3D();
  let n = 0;
  const w = 19, d = 12;
  for (let x = -w / 2; x <= w / 2; x += 1) {
    obj.position.set(x, 0.95, -d / 2);
    obj.scale.set(1, 0.9, 1);
    obj.updateMatrix();
    mesh.setMatrixAt(n++, obj.matrix);
    // Se deja una entrada al sur alineada con el sendero de acceso.
    if (Math.abs(x) > 1.5) {
      obj.position.z = d / 2;
      obj.updateMatrix();
      mesh.setMatrixAt(n++, obj.matrix);
    }
  }
  for (let z = -d / 2 + 1; z < d / 2; z += 1) {
    obj.position.set(-w / 2, 0.95, z);
    obj.rotation.y = Math.PI / 2;
    obj.updateMatrix();
    mesh.setMatrixAt(n++, obj.matrix);
    obj.position.x = w / 2;
    obj.updateMatrix();
    mesh.setMatrixAt(n++, obj.matrix);
    obj.rotation.y = 0;
  }
  mesh.count = n;
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = mesh.receiveShadow = true;
  g.add(mesh);

  // Tres peldaños bajos conectan el terreno con la plataforma por la abertura sur.
  for (let i = 0; i < 3; i++) {
    const height = 0.23 * (i + 1);
    const step = new THREE.Mesh(new THREE.BoxGeometry(3.2, height, 0.75), kheriStone);
    step.position.set(0, height / 2, 7.5 - i * 0.75);
    step.castShadow = step.receiveShadow = true;
    g.add(step);
  }

  // 3. Altar central interior de Kheri Kala con textura de andesita
  const innerAltar = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.35, 3.6), kheriStone);
  innerAltar.position.set(0, 0.85, 0);
  innerAltar.castShadow = innerAltar.receiveShadow = true;
  g.add(innerAltar);

  return g;
}

/**
 * Los muros perimetrales oficiales y taludes ahora se integran directamente
 * desde el modelo 3D assets/models/muros.glb en modelos-sitio.js.
 */
export function createDoublePerimeter() {
  const group = new THREE.Group();
  group.name = 'muro-perimetral';
  return group;
}
