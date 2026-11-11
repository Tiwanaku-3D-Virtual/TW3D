import * as THREE from 'three';

export function createChachapuma() {
  const group = new THREE.Group();
  group.name = 'chachapuma';
  group.position.set(28, 0, -5);
  group.userData.infoKey = 'chachapuma';

  const stone = new THREE.TextureLoader().load('assets/textures/GroundDirtRocky020_COL_2K.jpg');
  stone.colorSpace = THREE.SRGBColorSpace;
  stone.wrapS = stone.wrapT = THREE.RepeatWrapping;
  stone.repeat.set(2, 2);
  const pedestalMaterial = new THREE.MeshStandardMaterial({
    map: stone,
    color: '#b0a38b',
    roughness: 0.85,
    metalness: 0.02
  });

  const lower = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.36, 3.6), pedestalMaterial);
  lower.position.y = 0.18;
  lower.castShadow = lower.receiveShadow = true;
  group.add(lower);

  const upper = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.28, 2.8), pedestalMaterial);
  upper.position.y = 0.50;
  upper.castShadow = upper.receiveShadow = true;
  group.add(upper);

  return group;
}
