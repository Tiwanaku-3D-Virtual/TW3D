import * as THREE from 'three';
import { createScene } from './escena.js';
import { createAmbiente } from './ambiente.js';
import { createWindToggle } from './ambiente-sonoro.js';
import { createSitio } from './estructuras/sitio.js';
import { createJugador } from './jugador.js';
import { info } from './info.js';

const container=document.querySelector('#map-canvas');
const {scene,camera,renderer,controls,sun}=createScene(container);
const site=createSitio();scene.add(site);
const environment=createAmbiente(scene,sun);const clock=new THREE.Clock();
const visited=new Set();let selected='templo';let nearbyKey=null;
const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();
const modal=document.querySelector('#detail-modal');const nearby=document.querySelector('#nearby-card');
const nearbyButton=document.querySelector('#nearby-detail');
const player=createJugador(camera,renderer,controls,document.querySelector('#btn-walk'));
createWindToggle(document.querySelector('#btn-mute'));

function showInfo(key,focus=false){
  const data=info[key];if(!data)return;selected=key;
  document.querySelector('#info-title').textContent=data.nombre;
  document.querySelector('#info-period').textContent=data.periodo;
  document.querySelector('#info-description').textContent=data.descripcion;
  document.querySelector('#info-function').textContent=data.funcion;
  document.querySelector('#info-curiosity').textContent=data.datoCurioso;
  if(focus){const target=new THREE.Vector3(data.posicion.x,data.posicion.y,data.posicion.z);const direction=camera.position.clone().sub(controls.target).normalize();controls.target.copy(target);camera.position.copy(target).addScaledVector(direction,31);controls.update();}
}
function openDetail(){
  const data=info[selected];document.querySelector('#modal-title').textContent=data.nombre;
  document.querySelector('#modal-period').textContent=data.periodo;document.querySelector('#modal-description').textContent=data.descripcion;
  document.querySelector('#modal-function').textContent=data.funcion;document.querySelector('#modal-curiosity').textContent=data.datoCurioso;
  modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.querySelector('#modal-close').focus();
}
function closeDetail(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');}
document.querySelector('#btn-detail').addEventListener('click',openDetail);
nearbyButton.addEventListener('click',()=>{if(nearbyKey)showInfo(nearbyKey);openDetail();});
document.querySelector('#modal-close').addEventListener('click',closeDetail);
modal.addEventListener('click',event=>{if(event.target===modal)closeDetail();});
addEventListener('keydown',event=>{if(event.key==='Escape')closeDetail();});

let pointerStart=null;
renderer.domElement.addEventListener('pointerdown',event=>{pointerStart={x:event.clientX,y:event.clientY};});
renderer.domElement.addEventListener('pointerup',event=>{
  if(player.walking){pointerStart=null;return;}
  if(pointerStart&&Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>7){pointerStart=null;return;}pointerStart=null;
  const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-((event.clientY-rect.top)/rect.height)*2+1);raycaster.setFromCamera(pointer,camera);
  const hit=raycaster.intersectObject(site,true)[0];if(!hit)return;
  let node=hit.object;while(node&&node!==site&&!node.userData.infoKey)node=node.parent;
  if(node&&node.userData.infoKey&&info[node.userData.infoKey]){visited.add(node.userData.infoKey);showInfo(node.userData.infoKey,true);}
});

const timeButton=document.querySelector('#btn-time');const timeLabels=['☀ Día','🌅 Ocaso','🌙 Noche'];
function cycleTime(){const mode=environment.setTime(environment.mode+1);timeButton.textContent=timeLabels[mode];}
timeButton.addEventListener('click',cycleTime);
addEventListener('keydown',event=>{if(event.key.toLowerCase()==='n'&&!event.repeat)cycleTime();});

const mapCanvas=document.querySelector('#mini-map');const mapContext=mapCanvas.getContext('2d');
const mapStructures=[
  ['templo',0,0,28,28],['kalasasaya',-42,-3,40,25],['akapana',-45,34,36,36],['pumaPunku',43,31,27,19],
  ['puertaSol',-42,7.5,9.5,1.2],['bennett',-42,-10.5,2,1],['puertaLuna',0,-24,4.5,1],
  ['putuni',27,-18,19,14],['kheriKala',0,43,19,12],['kantatallita',25,8,13,10]
];
const proximityBounds={
  templo:[0,0,14,14],kalasasaya:[-42,-3,20,12.5],akapana:[-45,34,18,18],pumaPunku:[43,31,13.5,9.5],
  puertaSol:[-42,7.5,4.75,.5],bennett:[-42,-10.5,1,.5],puertaLuna:[0,-24,2.25,.5],
  putuni:[27,-18,9.5,7],kheriKala:[0,43,9.5,6],kantatallita:[25,8,6.5,5],monolito:[0,0,1,1]
};
function drawMinimap(){
  const ctx=mapContext,w=mapCanvas.width,h=mapCanvas.height;ctx.clearRect(0,0,w,h);
  ctx.fillStyle='rgba(38,43,38,.72)';ctx.fillRect(0,0,w,h);
  const mx=x=>16+(x+80)/160*(w-32),mz=z=>16+(z+65)/130*(h-32);
  ctx.strokeStyle='rgba(234,208,153,.55)';ctx.lineWidth=1.4;ctx.strokeRect(mx(-71),mz(-55),mx(71)-mx(-71),mz(55)-mz(-55));ctx.strokeRect(mx(-68),mz(-52),mx(68)-mx(-68),mz(52)-mz(-52));
  mapStructures.forEach(([key,x,z,ww,dd])=>{
    const px=mx(x),py=mz(z),pw=Math.max(ww/160*(w-32),3),ph=Math.max(dd/130*(h-32),3);
    ctx.fillStyle=visited.has(key)?'#efd08d':'rgba(211,207,190,.78)';ctx.fillRect(px-pw/2,py-ph/2,pw,ph);
    if(visited.has(key)){ctx.fillStyle='#fff4d5';ctx.font='bold 12px sans-serif';ctx.fillText('✔',px+pw/2,py-ph/2);}
  });
  if(player.walking){const px=mx(player.position.x),py=mz(player.position.z);ctx.beginPath();ctx.fillStyle='#68d8f0';ctx.arc(px,py,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#eafcff';ctx.lineWidth=1.5;ctx.stroke();}
  ctx.fillStyle='#fff4d5';ctx.font='bold 10px sans-serif';ctx.fillText('N',w/2-3,11);
}
function updateNearby(){
  if(!player.walking){nearby.hidden=true;nearbyKey=null;return;}
  let nearest=null,nearestDistance=Infinity,nearestArea=Infinity;
  for(const [key,data] of Object.entries(info)){
    const [x,z,halfW,halfD]=proximityBounds[key]||[data.posicion.x,data.posicion.z,.8,.8];
    const dx=Math.max(Math.abs(player.position.x-x)-halfW,0),dz=Math.max(Math.abs(player.position.z-z)-halfD,0),d=Math.hypot(dx,dz),area=halfW*halfD;
    if(d<nearestDistance||(d===nearestDistance&&area<nearestArea)){nearestDistance=d;nearestArea=area;nearest=key;}
  }
  if(nearestDistance>=8||!nearest){nearby.hidden=true;nearbyKey=null;return;}
  visited.add(nearest);
  if(nearbyKey!==nearest){
    nearbyKey=nearest;showInfo(nearest);
    const data=info[nearest];document.querySelector('#nearby-title').textContent=data.nombre;
    document.querySelector('#nearby-period').textContent=data.periodo;document.querySelector('#nearby-description').textContent=data.descripcion;
    document.querySelector('#nearby-function').textContent=data.funcion;document.querySelector('#nearby-curiosity').textContent=data.datoCurioso;
  }
  nearby.hidden=false;
}

let minimapTimer=0;
function animate(){
  requestAnimationFrame(animate);const delta=Math.min(clock.getDelta(),.05);if(!player.walking)controls.update();player.update(delta);environment.update(clock.elapsedTime);updateNearby();
  minimapTimer+=delta;if(minimapTimer>.1){drawMinimap();minimapTimer=0;}
  renderer.render(scene,camera);
}
drawMinimap();animate();showInfo('templo');
