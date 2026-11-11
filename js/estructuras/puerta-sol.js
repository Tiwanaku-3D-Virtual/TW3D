import * as THREE from 'three';

export function createPuertaSol() {
  const group = new THREE.Group(); group.name = 'puerta-del-sol'; group.position.set(0, 0, -24); group.userData.infoKey = 'puertaSol';
  const stone = new THREE.MeshStandardMaterial({ color: '#777264', roughness: .88 });
  const relief = new THREE.MeshStandardMaterial({ color: '#918a78', roughness: .86 });
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x,y,z); m.castShadow = m.receiveShadow = true; group.add(m); return m; };
  add(new THREE.BoxGeometry(5.2,3.2,.62),stone,-2.15,1.6,0);
  add(new THREE.BoxGeometry(5.2,3.2,.62),stone,2.15,1.6,0);
  add(new THREE.BoxGeometry(9.5,.72,.82),stone,0,3.16,0);
  add(new THREE.BoxGeometry(4.1,.28,.7),relief,0,2.68,.04);
  // Friso: relieves pequeños generados en una sola malla instanciada.
  const glyphGeo = new THREE.BoxGeometry(.18,.28,.18);
  const glyphs = new THREE.InstancedMesh(glyphGeo,relief,25); const d = new THREE.Object3D();
  for(let i=0;i<25;i++){const x=-4.1+i*.34;d.position.set(x,3.16+(i%2)*.08,.47);d.rotation.z=(i%3-1)*.08;d.scale.set(i%4===0?1.35:1,1+(i%3)*.2,1);d.updateMatrix();glyphs.setMatrixAt(i,d.matrix);}
  glyphs.instanceMatrix.needsUpdate=true;glyphs.castShadow=true;group.add(glyphs);
  // Figura central esquemática con rostro, tocado y báculos.
  const emblem = new THREE.Group(); emblem.position.set(0,3.08,.56); group.add(emblem);
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.16,12),relief);disk.rotation.x=Math.PI/2;disk.castShadow=true;emblem.add(disk);
  for(let i=0;i<7;i++){const ray=new THREE.Mesh(new THREE.BoxGeometry(.13,.42,.12),relief);ray.position.set((i-3)*.17,.49,.01);ray.castShadow=true;emblem.add(ray);}
  for(const x of [-.28,.28]){const staff=new THREE.Mesh(new THREE.BoxGeometry(.12,.9,.12),relief);staff.position.set(x,-.32,.05);staff.rotation.z=x<0?-.15:.15;emblem.add(staff);}
  for(const x of [-2.15,2.15]){const base=add(new THREE.BoxGeometry(5.6,.22,.95),relief,x,.12,0);base.position.y=.11;}
  return group;
}
