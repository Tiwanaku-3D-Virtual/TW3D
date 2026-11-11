import * as THREE from 'three';

const stone=new THREE.MeshStandardMaterial({color:'#948a73',roughness:.96});
function slab(group,w,d,y=.35){const m=new THREE.Mesh(new THREE.BoxGeometry(w,.7,d),stone);m.position.y=y;m.castShadow=m.receiveShadow=true;group.add(m);return m;}
function lowEnclosure(group,w,d){
  const wallGeo=new THREE.BoxGeometry(1,.9,.9);const mesh=new THREE.InstancedMesh(wallGeo,stone,Math.ceil(w+d)*2);const obj=new THREE.Object3D();let n=0;
  for(let x=-w/2;x<=w/2;x+=1){obj.position.set(x,.95,-d/2);obj.scale.set(1,.9,1);obj.updateMatrix();mesh.setMatrixAt(n++,obj.matrix);obj.position.z=d/2;obj.updateMatrix();mesh.setMatrixAt(n++,obj.matrix);}
  for(let z=-d/2+1;z<d/2;z+=1){obj.position.set(-w/2,.95,z);obj.rotation.y=Math.PI/2;obj.updateMatrix();mesh.setMatrixAt(n++,obj.matrix);obj.position.x=w/2;obj.updateMatrix();mesh.setMatrixAt(n++,obj.matrix);obj.rotation.y=0;}
  mesh.count=n;mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;group.add(mesh);
}
function makeCompound(name,key,x,z,w,d,open=false){
  const g=new THREE.Group();g.name=name;g.position.set(x,0,z);g.userData.infoKey=key;slab(g,w,d);
  if(open)lowEnclosure(g,w,d);return g;
}
export function createPuertaLuna(){
  const g=new THREE.Group();g.name='puerta-de-la-luna';g.position.set(0,0,-24);g.userData.infoKey='puertaLuna';
  const stone=new THREE.MeshStandardMaterial({color:'#8e8572',roughness:.92});
  for(const [x,y,w,h] of [[-1.65,1.45,1,2.9],[1.65,1.45,1,2.9],[0,2.8,4.3,.55]]){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,.55),stone);m.position.set(x,y,0);m.castShadow=true;g.add(m);}
  const curved=new THREE.Mesh(new THREE.TorusGeometry(1.35,.14,5,14,Math.PI),stone);curved.position.set(0,2.3,.05);curved.rotation.z=Math.PI;g.add(curved);return g;
}
export function createPutuni(){const g=makeCompound('putuni','putuni',27,-18,19,14,true);return g;}
export function createKheriKala(){const g=makeCompound('kheri-kala','kheriKala',0,43,19,12,true);return g;}
export function createKantatallita(){const g=makeCompound('kantatallita','kantatallita',25,8,13,10,false);const mon=new THREE.Mesh(new THREE.BoxGeometry(1.1,2.6,.8),new THREE.MeshStandardMaterial({color:'#766c5d',roughness:.9}));mon.position.set(0,1.65,0);mon.castShadow=true;g.add(mon);return g;}

export function createDoublePerimeter(){
  const group=new THREE.Group();group.name='muro-perimetral';
  const mat=new THREE.MeshStandardMaterial({color:'#92866d',roughness:.98});
  const blocks=[];const add=(x,y,z,sx,sy,sz)=>blocks.push([x,y,z,sx,sy,sz]);
  const makeSide=(halfX,halfZ,y,gap,inner=false)=>{
    for(let x=-halfX;x<=halfX;x+=2.1){if(Math.abs(x)<gap/2)continue;for(let h=0;h<3;h++)add(x,y+h*.85,halfZ,2.1,.82,1.1);}
    for(let x=-halfX;x<=halfX;x+=2.1){if(Math.abs(x)<gap/2)continue;for(let h=0;h<3;h++)add(x,y+h*.85,-halfZ,2.1,.82,1.1);}
    for(let z=-halfZ+2;z<halfZ;z+=2.1){if(Math.abs(z)<gap/2)continue;for(let h=0;h<3;h++)add(halfX,y+h*.85,z,1.1,.82,2.1);}
    for(let z=-halfZ+2;z<halfZ;z+=2.1){if(Math.abs(z)<gap/2)continue;for(let h=0;h<3;h++)add(-halfX,y+h*.85,z,1.1,.82,2.1);}
  };
  makeSide(71,55,0,10);makeSide(68,52,0,10,true);
  const geo=new THREE.BoxGeometry(1,1,1);const mesh=new THREE.InstancedMesh(geo,mat,blocks.length);const d=new THREE.Object3D();const color=new THREE.Color();
  blocks.forEach(([x,y,z,sx,sy,sz],i)=>{d.position.set(x,y+.4,z);d.scale.set(sx,sy,sz);d.rotation.y=(Math.random()-.5)*.03;d.updateMatrix();mesh.setMatrixAt(i,d.matrix);color.set('#91866f').offsetHSL(0,0,(Math.random()-.5)*.12);mesh.setColorAt(i,color);});
  mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);
  // Jambas de piedra señalan las entradas abiertas sin bloquear el paso.
  for(const x of [-5.2,5.2])for(const z of [-53,53]){const jamb=new THREE.Mesh(new THREE.BoxGeometry(.9,2.8,1.2),mat);jamb.position.set(x,1.4,z);jamb.castShadow=true;group.add(jamb);}
  for(const z of [-5.2,5.2])for(const x of [-69,69]){const jamb=new THREE.Mesh(new THREE.BoxGeometry(1.2,2.8,.9),mat);jamb.position.set(x,1.4,z);jamb.castShadow=true;group.add(jamb);}
  return group;
}
