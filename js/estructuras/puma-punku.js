import * as THREE from 'three';

export function createPumaPunku(){
  const group=new THREE.Group();group.name='puma-punku';group.position.set(43,0,31);group.userData.infoKey='pumaPunku';
  const andesite=new THREE.MeshStandardMaterial({color:'#85877f',roughness:.8,metalness:.04});
  for(const [w,d,y] of [[27,19,.5],[24,16,1.25],[20,13,1.9]]){const platform=new THREE.Mesh(new THREE.BoxGeometry(w,.72,d),andesite);platform.position.y=y;platform.castShadow=platform.receiveShadow=true;group.add(platform);}
  // Piezas H de corte nítido, con algunas tumbadas como vestigios en superficie.
  const columns=new THREE.InstancedMesh(new THREE.BoxGeometry(.62,1.45,.72),andesite,30);
  const crossbars=new THREE.InstancedMesh(new THREE.BoxGeometry(1.35,.42,.72),andesite,15);
  const d=new THREE.Object3D();let a=0,b=0;
  const positions=[[-8,2.8,-4],[-3,2.8,-4],[2,2.8,-4],[7,2.8,-4],[-8,2.8,1],[-3,2.8,1],[2,2.8,1],[7,2.8,1],[-7,2.65,6],[0,2.65,6],[7,2.65,6]];
  positions.forEach(([x,y,z],i)=>{
    const fallen=i>=8;const rotation=fallen?new THREE.Euler((Math.random()-.5)*.18,Math.random()*Math.PI,(Math.random()-.5)*.5):new THREE.Euler(0,(i%4)*.08,0);const q=new THREE.Quaternion().setFromEuler(rotation);const center=new THREE.Vector3(x,y,z);
    for(const dx of [-.95,.95]){const local=new THREE.Vector3(dx,fallen ? .35 : .75,0).applyQuaternion(q);d.position.copy(center).add(local);d.quaternion.copy(q);d.updateMatrix();columns.setMatrixAt(a++,d.matrix);}
    const local=new THREE.Vector3(0,fallen ? .78 : 1.15,0).applyQuaternion(q);d.position.copy(center).add(local);d.quaternion.copy(q);d.updateMatrix();crossbars.setMatrixAt(b++,d.matrix);
  });
  columns.count=a;crossbars.count=b;columns.instanceMatrix.needsUpdate=true;crossbars.instanceMatrix.needsUpdate=true;columns.castShadow=crossbars.castShadow=true;group.add(columns,crossbars);return group;
}
