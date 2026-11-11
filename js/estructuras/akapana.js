import * as THREE from 'three';

export function createAkapana() {
  const group = new THREE.Group();
  group.name = 'akapana';
  group.position.set(-45, 0, 34);
  group.userData.infoKey = 'akapana';
  return group;
}

