import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvasHost=document.querySelector('#gallery-canvas');
const scene=new THREE.Scene();scene.background=new THREE.Color('#141613');scene.fog=new THREE.Fog('#141613',48,105);
const camera=new THREE.PerspectiveCamera(46,innerWidth/innerHeight,.1,180);camera.position.set(0,15,39);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;canvasHost.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,2.6,0);controls.enableDamping=true;controls.dampingFactor=.06;controls.enablePan=false;controls.minDistance=8;controls.maxDistance=72;controls.minPolarAngle=.28;controls.maxPolarAngle=2.05;
scene.add(new THREE.HemisphereLight('#e5dcc7','#2b2a24',1.2));
const keyLight=new THREE.DirectionalLight('#f5dfb1',2.3);keyLight.position.set(-18,24,20);keyLight.castShadow=true;keyLight.shadow.mapSize.set(1024,1024);keyLight.shadow.camera.left=-32;keyLight.shadow.camera.right=32;keyLight.shadow.camera.top=30;keyLight.shadow.camera.bottom=-20;scene.add(keyLight);

const floorMat=new THREE.MeshStandardMaterial({color:'#373831',roughness:.86});
const wallMat=new THREE.MeshStandardMaterial({color:'#20231f',roughness:.95});
const stone=new THREE.MeshStandardMaterial({color:'#777365',roughness:.91});
const stoneLight=new THREE.MeshStandardMaterial({color:'#99917d',roughness:.88});
const darkStone=new THREE.MeshStandardMaterial({color:'#49483f',roughness:.94});
const clay=new THREE.MeshStandardMaterial({color:'#a95f3c',roughness:.7});
const creamClay=new THREE.MeshStandardMaterial({color:'#c38b61',roughness:.72});
const gold=new THREE.MeshStandardMaterial({color:'#d8a943',metalness:.83,roughness:.24});
const darkInset=new THREE.MeshStandardMaterial({color:'#29251e',roughness:.95});
const floor=new THREE.Mesh(new THREE.PlaneGeometry(60,34),floorMat);floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
for(const [geo,pos] of [[new THREE.BoxGeometry(60,13,.8),[0,6.4,-17]],[new THREE.BoxGeometry(.8,13,34),[-30,6.4,0]],[new THREE.BoxGeometry(.8,13,34),[30,6.4,0]],[new THREE.BoxGeometry(60,.5,.8),[0,12.8,-17]]]){const wall=new THREE.Mesh(geo,wallMat);wall.position.set(...pos);wall.receiveShadow=true;scene.add(wall);}

const positions=[];
for(let i=0;i<11;i++){
  const row=i<6?0:1,col=row===0?i:i-6;
  positions.push({x:(row===0?-16+col*6.4:-12.8+col*6.4)+5,z:row===0?6.4:-7});
}
const pedestalBase=new THREE.InstancedMesh(new THREE.CylinderGeometry(1.3,1.3,.18,20),darkStone,11);
const pedestalStem=new THREE.InstancedMesh(new THREE.CylinderGeometry(.92,.98,1.25,12),stone,11);
const pedestalTop=new THREE.InstancedMesh(new THREE.CylinderGeometry(1.18,1.1,.2,20),stoneLight,11);
const dummy=new THREE.Object3D();
positions.forEach(({x,z},i)=>{
  dummy.position.set(x,.09,z);dummy.updateMatrix();pedestalBase.setMatrixAt(i,dummy.matrix);
  dummy.position.set(x,.79,z);dummy.updateMatrix();pedestalStem.setMatrixAt(i,dummy.matrix);
  dummy.position.set(x,1.51,z);dummy.updateMatrix();pedestalTop.setMatrixAt(i,dummy.matrix);
});
for(const mesh of [pedestalBase,pedestalStem,pedestalTop]){mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);}

const galleryLights=[];
positions.forEach(({x,z})=>{
  const light=new THREE.SpotLight('#ffe6af',42,18,.58,.78,2);light.position.set(x,10,z+1);light.target.position.set(x,2.1,z);light.castShadow=false;scene.add(light,light.target);galleryLights.push(light);
});

function addMesh(group,geometry,material,x,y,z,rotation=[0,0,0],scale=[1,1,1]){
  const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.rotation.set(...rotation);mesh.scale.set(...scale);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
}
function box(group,material,x,y,z,sx,sy,sz,rotation=[0,0,0]){return addMesh(group,new THREE.BoxGeometry(sx,sy,sz),material,x,y,z,rotation);}

function createSunGate(){
  const g=new THREE.Group();box(g,stone,-1.45,1.35,0,.72,2.7,.56);box(g,stone,1.45,1.35,0,.72,2.7,.56);box(g,stoneLight,0,2.72,0,3.75,.66,.74);box(g,stoneLight,0,.15,0,4.2,.25,.82);
  const frieze=new THREE.InstancedMesh(new THREE.BoxGeometry(.16,.3,.14),stoneLight,17),d=new THREE.Object3D();for(let i=0;i<17;i++){d.position.set(-1.56+i*.195,2.75+(i%2)*.08,.43);d.scale.set(1,1+(i%3)*.2,1);d.updateMatrix();frieze.setMatrixAt(i,d.matrix);}frieze.instanceMatrix.needsUpdate=true;frieze.castShadow=true;g.add(frieze);
  addMesh(g,new THREE.CylinderGeometry(.38,.38,.18,12),gold,0,2.74,.48,[Math.PI/2,0,0]);
  for(const x of [-.3,.3])box(g,stoneLight,x,2.18,.49,.1,.55,.1,[0,0,x<0?-.15:.15]);
  return g;
}
function createPonce(){
  const g=new THREE.Group();box(g,stone,0,1.65,0,1.35,3.2,.75);box(g,stoneLight,0,3.62,0,1.48,.92,.88);
  box(g,stoneLight,0,2.15,.46,.35,.27,.2);box(g,stoneLight,-.25,3.75,.47,.18,.13,.12);box(g,stoneLight,.25,3.75,.47,.18,.13,.12);
  for(let y=.65;y<3.1;y+=.45)box(g,stoneLight,0,y,.4,1.03,.12,.12);
  return g;
}
function createChakana(){
  const g=new THREE.Group();
  for(let level=0;level<3;level++){
    const s=1.1-level*.18,y=.28+level*.35;
    box(g,stoneLight,0,y,0,.82+s*1.55,.3,.72);
    box(g,stoneLight,0,y,0,.72,.3,.82+s*1.55);
  }
  box(g,gold,0,1.45,.39,.42,.22,.08);
  return g;
}
function createFraile(){
  const g=new THREE.Group();box(g,stone,0,1.4,0,1.1,2.7,.72);box(g,stoneLight,0,3.12,0,1.25,.8,.82);
  box(g,stoneLight,-.8,2.1,0,.55,.5,.62,[0,0,-.18]);box(g,stoneLight,.8,2.1,0,.55,.5,.62,[0,0,.18]);
  box(g,stoneLight,0,2.83,.44,.2,.24,.16);box(g,darkInset,-.23,3.2,.43,.1,.09,.08);box(g,darkInset,.23,3.2,.43,.1,.09,.08);
  for(let y=.6;y<2.5;y+=.5)box(g,stoneLight,0,y,.38,.82,.12,.1);
  return g;
}
function createQero(){
  const g=new THREE.Group();const points=[new THREE.Vector2(0,0),new THREE.Vector2(.5,.08),new THREE.Vector2(.65,.35),new THREE.Vector2(.73,1.25),new THREE.Vector2(.66,1.8),new THREE.Vector2(.57,2.05),new THREE.Vector2(.54,2.13)];
  addMesh(g,new THREE.LatheGeometry(points,24),clay,0,.1,0);addMesh(g,new THREE.CylinderGeometry(.58,.58,.1,24),gold,0,.35,0);addMesh(g,new THREE.CylinderGeometry(.56,.55,.09,24),creamClay,0,2.12,0);
  return g;
}
function createVasija(){
  const g=new THREE.Group();const points=[new THREE.Vector2(0,0),new THREE.Vector2(.55,.1),new THREE.Vector2(.95,.55),new THREE.Vector2(1.02,1.25),new THREE.Vector2(.78,1.8),new THREE.Vector2(.45,2.05),new THREE.Vector2(.4,2.15)];
  addMesh(g,new THREE.LatheGeometry(points,24),creamClay,0,.05,0);
  const lid=new THREE.Group();lid.position.set(0,2.25,0);addMesh(lid,new THREE.SphereGeometry(.55,14,10),clay,0,.2,0,[0,0,0],[1,1.2,.9]);box(lid,stoneLight,0,.12,.48,.18,.15,.18);box(lid,darkInset,-.19,.23,.4,.09,.07,.07);box(lid,darkInset,.19,.23,.4,.09,.07,.07);box(lid,clay,0,.65,0,.18,.5,.16);g.add(lid);
  return g;
}
function createTextile(){
  const g=new THREE.Group();const canvas=document.createElement('canvas');canvas.width=256;canvas.height=384;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#9d4e35';ctx.fillRect(0,0,256,384);ctx.fillStyle='#d9bb7b';ctx.fillRect(10,10,236,364);
  ctx.fillStyle='#7e3529';ctx.fillRect(20,20,216,344);const palette=['#d8bb79','#263c35','#ba6841','#efe0ae'];
  for(let row=0;row<8;row++)for(let col=0;col<5;col++){
    const x=28+col*41,y=28+row*41,c=palette[(row+col)%palette.length];ctx.fillStyle=c;ctx.fillRect(x,y,29,29);ctx.fillStyle='#572f2a';ctx.fillRect(x+7,y+7,15,15);ctx.fillStyle=c;ctx.fillRect(x+11,y+3,7,23);ctx.fillRect(x+3,y+11,23,7);
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const fabric=new THREE.MeshStandardMaterial({map:texture,roughness:1,side:THREE.DoubleSide});
  addMesh(g,new THREE.PlaneGeometry(2.45,3.25),fabric,0,1.78,0);const rod=addMesh(g,new THREE.CylinderGeometry(.07,.07,2.7,8),gold,0,3.45,0,[0,0,Math.PI/2]);return g;
}
function createSnuffTablet(){
  const g=new THREE.Group();addMesh(g,new THREE.TorusGeometry(.92,.1,8,32,Math.PI*1.45),stoneLight,0,1.05,0,[Math.PI/2,0,-Math.PI*.22]);
  box(g,stone,0,.25,0,1.8,.2,.55);box(g,stoneLight,0,.68,0,.38,.85,.35);box(g,stoneLight,0,1.28,.03,.68,.43,.48);box(g,darkInset,-.15,1.35,.28,.08,.07,.04);box(g,darkInset,.15,1.35,.28,.08,.07,.04);
  return g;
}
function createPectoral(){
  const g=new THREE.Group();addMesh(g,new THREE.SphereGeometry(1,24,16),gold,0,1.25,0,[0,0,0],[1.05,1.2,.22]);addMesh(g,new THREE.TorusGeometry(.97,.08,8,32),gold,0,1.25,.03,[0,0,0],[1.05,1.2,1]);
  for(let i=0;i<12;i++){const angle=i*Math.PI/6;const ray=addMesh(g,new THREE.BoxGeometry(.1,.34,.08),gold,Math.sin(angle)*1.17,1.25+Math.cos(angle)*1.35,.04,[0,0,-angle]);}
  addMesh(g,new THREE.CylinderGeometry(.2,.2,.16,8),darkInset,0,1.25,.25,[Math.PI/2,0,0]);return g;
}
function createSkull(){
  const g=new THREE.Group();const bone=new THREE.MeshStandardMaterial({color:'#c8b99a',roughness:.83});addMesh(g,new THREE.SphereGeometry(1,18,14),bone,0,1.25,0,[0,0,0],[.86,.78,1.02]);box(g,bone,0,.6,.16,1.08,.42,.74);
  for(const x of [-.29,.29])addMesh(g,new THREE.SphereGeometry(.12,8,6),darkInset,x,.87,.68);
  addMesh(g,new THREE.CylinderGeometry(.24,.24,.025,16),darkInset,.06,1.98,.12);addMesh(g,new THREE.TorusGeometry(.27,.055,6,20),bone,.06,1.98,.14,[Math.PI/2,0,0]);
  return g;
}
function createClava(){
  const g=new THREE.Group();box(g,stone,0,.7,0,.72,1.38,.48);addMesh(g,new THREE.SphereGeometry(.76,14,10),stoneLight,0,1.75,0,[0,0,0],[1,.78,.72]);
  box(g,stoneLight,0,1.75,.58,.2,.22,.23);box(g,darkInset,-.28,1.93,.49,.11,.09,.07);box(g,darkInset,.28,1.93,.49,.11,.09,.07);box(g,stoneLight,0,1.35,.49,.36,.12,.1);
  for(const x of [-.18,.18])box(g,stoneLight,x,2.25,.05,.14,.4,.14,[0,0,x<0?-.12:.12]);
  return g;
}

const pieces=[
  {id:'puerta-sol',title:'Puerta del Sol',period:'500–900 d.C.',material:'Andesita gris',description:'Portal monumental con vano central, dintel tallado y una figura frontal acompañada por relieves de seres alados.',build:createSunGate},
  {id:'ponce',title:'Monolito Ponce',period:'500–900 d.C.',material:'Andesita',description:'Estela antropomorfa de cuerpo erguido, con bandas geométricas y atributos rituales tallados en la piedra.',build:createPonce},
  {id:'chakana',title:'Chakana',period:'Tradición andina',material:'Piedra',description:'Cruz escalonada de cuatro brazos, recreada con volúmenes geométricos de piedra.',build:createChakana},
  {id:'fraile',title:'Estela Fraile',period:'500–900 d.C.',material:'Arenisca',description:'Figura monolítica con rostro y brazos indicados en relieve.',build:createFraile},
  {id:'qero',title:'Qero cerámico',period:'Época Tiwanaku',material:'Cerámica',description:'Vaso de perfil abierto recreado con una silueta torneada y bandas de color.',build:createQero},
  {id:'vasija',title:'Vasija eferjete con cabeza-tapa',period:'Época Tiwanaku',material:'Cerámica',description:'Vasija globular con una tapa modelada como cabeza, elaborada aquí mediante superficies de revolución y relieves.',build:createVasija},
  {id:'manto',title:'Manto con motivos tokapu',period:'Tradición textil andina',material:'Textil',description:'Paño con retícula de motivos geométricos, generado con una textura dibujada en el navegador.',build:createTextile},
  {id:'tableta',title:'Tableta para rapé',period:'Época Tiwanaku',material:'Piedra tallada',description:'Objeto ritual recreado con una placa, un arco parcial y una figura en relieve.',build:createSnuffTablet},
  {id:'pectoral',title:'Pectoral de oro',period:'Época Tiwanaku',material:'Oro',description:'Adorno metálico circular con borde, centro elevado y motivos radiales.',build:createPectoral},
  {id:'craneo',title:'Cráneo deformado',period:'Época Tiwanaku',material:'Hueso',description:'Modelo educativo que muestra una forma craneal alargada y una marca ilustrativa de trepanación.',build:createSkull},
  {id:'clava',title:'Cabeza clava',period:'500–900 d.C.',material:'Andesita',description:'Cabeza de piedra empotrada, con rasgos faciales y tocado modelados en relieve.',build:createClava}
];
const groups=new Map();let selectedId='puerta-sol';let pointerStart=null;
pieces.forEach((piece,i)=>{
  const group=piece.build();group.position.set(positions[i].x,1.62,positions[i].z);group.userData.pieceId=piece.id;groups.set(piece.id,group);scene.add(group);
  const light=galleryLights[i];light.userData.pieceId=piece.id;
});

function selectPiece(id,focus=true){
  const piece=pieces.find(item=>item.id===id);if(!piece)return;selectedId=id;
  document.querySelector('#piece-title').textContent=piece.title;document.querySelector('#piece-period').textContent=piece.period;
  document.querySelector('#piece-material').textContent=piece.material;document.querySelector('#piece-description').textContent=piece.description;
  document.querySelector('#gallery-count').textContent=`${String(pieces.indexOf(piece)+1).padStart(2,'0')} / ${String(pieces.length).padStart(2,'0')}`;
  document.querySelectorAll('.piece-card').forEach(button=>{const active=button.dataset.piece===id;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  if(focus){const pos=positions[pieces.indexOf(piece)];controls.target.set(pos.x,3.1,pos.z);camera.position.set(pos.x+8.8,8.2,pos.z+11.2);controls.minDistance=4;controls.maxDistance=16;controls.update();}
}
document.querySelectorAll('.piece-card').forEach(button=>button.addEventListener('click',()=>selectPiece(button.dataset.piece)));

const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown',event=>{pointerStart={x:event.clientX,y:event.clientY};});
renderer.domElement.addEventListener('pointerup',event=>{
  if(pointerStart&&Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>7){pointerStart=null;return;}pointerStart=null;
  const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-((event.clientY-rect.top)/rect.height)*2+1);raycaster.setFromCamera(pointer,camera);
  const roots=[...groups.values()];const hit=raycaster.intersectObjects(roots,true)[0];if(!hit)return;let node=hit.object;while(node&&!node.userData.pieceId)node=node.parent;if(node)selectPiece(node.userData.pieceId);
});

const clock=new THREE.Clock();
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);for(const group of groups.values())group.rotation.y+=dt*.045;controls.update();renderer.render(scene,camera);}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);});
selectPiece('puerta-sol',false);animate();
