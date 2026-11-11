import * as THREE from 'three';

export function createKalasasaya() {
  const group=new THREE.Group();group.name='kalasasaya';group.position.set(-42,0,-3);group.userData.infoKey='kalasasaya';
  const stone=new THREE.MeshStandardMaterial({color:'#827a68',roughness:.95});
  const base=new THREE.Mesh(new THREE.BoxGeometry(40,.65,25),stone);base.position.y=.05;base.receiveShadow=true;group.add(base);
  const wallGeo=new THREE.BoxGeometry(1,.65,.8);const walls=new THREE.InstancedMesh(wallGeo,stone,132);const d=new THREE.Object3D();let n=0;
  for(const z of [-12,12])for(let x=-19;x<=19;x+=1.25){if(Math.abs(x)<3&&z===12)continue;d.position.set(x,.65,z);d.scale.set(1.3,1,1);d.updateMatrix();walls.setMatrixAt(n++,d.matrix);}
  for(const x of [-19,19])for(let z=-10;z<=10;z+=1.25){d.position.set(x,.65,z);d.scale.set(1,1,1.3);d.updateMatrix();walls.setMatrixAt(n++,d.matrix);}
  walls.count=n;walls.instanceMatrix.needsUpdate=true;walls.castShadow=walls.receiveShadow=true;group.add(walls);
  const pillarGeo=new THREE.CylinderGeometry(.62,.75,3.5,10);const pillars=new THREE.InstancedMesh(pillarGeo,stone,34);let p=0;
  for(let x=-18;x<=18;x+=3.6)for(const z of [-10.5,10.5]){d.position.set(x,2.1,z);d.scale.set(1,.88+Math.random()*.22,1);d.updateMatrix();pillars.setMatrixAt(p++,d.matrix);}
  for(let z=-8;z<=8;z+=4)for(const x of [-17.5,17.5]){d.position.set(x,2.1,z);d.updateMatrix();pillars.setMatrixAt(p++,d.matrix);}
  pillars.count=p;pillars.instanceMatrix.needsUpdate=true;pillars.castShadow=true;group.add(pillars);
  // Monolito Bennett, estela de gran tamaño con rostro y bandas de relieve.
  const bennett=new THREE.Group();bennett.name='monolito-bennett';bennett.userData.infoKey='bennett';bennett.position.set(0,0,-7.5);
  const andesite=new THREE.MeshStandardMaterial({color:'#6f685a',roughness:.94});const details=new THREE.MeshStandardMaterial({color:'#978b74',roughness:.9});
  const slab=new THREE.Mesh(new THREE.BoxGeometry(1.8,6.8,.85),andesite);slab.position.y=3.4;slab.castShadow=true;bennett.add(slab);
  const head=new THREE.Mesh(new THREE.BoxGeometry(1.5,1.45,.95),andesite);head.position.set(0,6.45,.02);head.castShadow=true;bennett.add(head);
  for(let y=1.1;y<5.8;y+=.72){const band=new THREE.Mesh(new THREE.BoxGeometry(1.52,.18,.95),details);band.position.set(0,y,.49);bennett.add(band);}
  const nose=new THREE.Mesh(new THREE.BoxGeometry(.28,.35,.25),details);nose.position.set(0,6.45,.57);bennett.add(nose);
  group.add(bennett);
  return group;
}
