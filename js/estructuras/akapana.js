import * as THREE from 'three';

export function createAkapana(){
  const group=new THREE.Group();group.name='akapana';group.position.set(-45,0,34);group.userData.infoKey='akapana';
  const stone=new THREE.MeshStandardMaterial({color:'#92856d',roughness:.96});
  const sizes=[36,32,28,24,20,16];
  sizes.forEach((size,i)=>{const h=i===0 ? .9 : 1.12;const tier=new THREE.Mesh(new THREE.BoxGeometry(size,h,size),stone);tier.position.y=h/2+i*1.08;tier.castShadow=tier.receiveShadow=true;group.add(tier);});
  const top=new THREE.Mesh(new THREE.BoxGeometry(12,.7,12),new THREE.MeshStandardMaterial({color:'#a3987e',roughness:.9}));top.position.y=7.3;top.castShadow=true;group.add(top);
  const stairGeo=new THREE.BoxGeometry(5,.42,1.45);const steps=new THREE.InstancedMesh(stairGeo,stone,10);const d=new THREE.Object3D();
  for(let i=0;i<10;i++){d.position.set(0,.45+i*.68,19.8-i*1.4);d.updateMatrix();steps.setMatrixAt(i,d.matrix);}
  steps.instanceMatrix.needsUpdate=true;steps.castShadow=true;group.add(steps);return group;
}
