import * as THREE from 'three';
import { createScene } from './escena.js';
import { createAmbiente } from './ambiente.js';
import { createSitio } from './estructuras/sitio.js';
import { info } from './info.js';

const container=document.querySelector('#map-canvas');
const {scene,camera,renderer,controls,sun}=createScene(container);
const site=createSitio(); scene.add(site);
const environment=createAmbiente(scene,sun);const clock=new THREE.Clock();
const raycaster=new THREE.Raycaster(); const pointer=new THREE.Vector2();
const modal=document.querySelector('#detail-modal');
let selected='templo';

function showInfo(key,focus=false){
  selected=key; const data=info[key];
  document.querySelector('#info-title').textContent=data.nombre;
  document.querySelector('#info-period').textContent=data.periodo;
  document.querySelector('#info-description').textContent=data.descripcion;
  document.querySelector('#info-function').textContent=data.funcion;
  document.querySelector('#info-curiosity').textContent=data.datoCurioso;
  if(focus){const target=new THREE.Vector3(data.posicion.x,data.posicion.y,data.posicion.z);const direction=camera.position.clone().sub(controls.target).normalize();controls.target.copy(target);camera.position.copy(target).addScaledVector(direction,31);}
}
function openDetail(){const d=info[selected];document.querySelector('#modal-title').textContent=d.nombre;document.querySelector('#modal-period').textContent=d.periodo;document.querySelector('#modal-description').textContent=d.descripcion;document.querySelector('#modal-function').textContent=d.funcion;document.querySelector('#modal-curiosity').textContent=d.datoCurioso;modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.querySelector('#modal-close').focus();}
function closeDetail(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');}
document.querySelector('#btn-detail').addEventListener('click',openDetail);
document.querySelector('#modal-close').addEventListener('click',closeDetail);
modal.addEventListener('click',e=>{if(e.target===modal)closeDetail();});
addEventListener('keydown',e=>{if(e.key==='Escape')closeDetail();});
let pointerStart=null;
renderer.domElement.addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY};});
renderer.domElement.addEventListener('pointerup',e=>{
  if(pointerStart&&Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>7){pointerStart=null;return;}pointerStart=null;
  const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-((e.clientY-rect.top)/rect.height)*2+1);raycaster.setFromCamera(pointer,camera);
  const hit=raycaster.intersectObject(site,true)[0];if(!hit)return;
  let node=hit.object;while(node&&node!==site&&!node.userData.infoKey)node=node.parent;
  if(node&&node.userData.infoKey&&info[node.userData.infoKey])showInfo(node.userData.infoKey,true);
});
const timeButton=document.querySelector('#btn-time');const timeLabels=['☀ Día','🌅 Ocaso','🌙 Noche'];
function cycleTime(){const mode=environment.setTime(environment.mode+1);timeButton.textContent=timeLabels[mode];}
timeButton.addEventListener('click',cycleTime);
addEventListener('keydown',e=>{if(e.key.toLowerCase()==='n'&&!e.repeat)cycleTime();});
function animate(){requestAnimationFrame(animate);controls.update();environment.update(clock.getElapsedTime());renderer.render(scene,camera);}
animate();
showInfo('templo');
