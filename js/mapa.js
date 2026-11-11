import * as THREE from 'three';
import { createScene } from './escena.js';
import { createTemplete } from './estructuras/templo-semisubterraneo.js';
import { info } from './info.js';

const container=document.querySelector('#map-canvas');
const {scene,camera,renderer,controls,sun}=createScene(container);
const temple=createTemplete(); scene.add(temple);
const raycaster=new THREE.Raycaster(); const pointer=new THREE.Vector2();
const modal=document.querySelector('#detail-modal');
let selected='templo';

function showInfo(key){
  selected=key; const data=info[key];
  document.querySelector('#info-title').textContent=data.nombre;
  document.querySelector('#info-period').textContent=data.periodo;
  document.querySelector('#info-description').textContent=data.descripcion;
  document.querySelector('#info-function').textContent=data.funcion;
  document.querySelector('#info-curiosity').textContent=data.datoCurioso;
}
function openDetail(){const d=info[selected];document.querySelector('#modal-title').textContent=d.nombre;document.querySelector('#modal-period').textContent=d.periodo;document.querySelector('#modal-description').textContent=d.descripcion;document.querySelector('#modal-function').textContent=d.funcion;document.querySelector('#modal-curiosity').textContent=d.datoCurioso;modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.querySelector('#modal-close').focus();}
function closeDetail(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');}
document.querySelector('#btn-detail').addEventListener('click',openDetail);
document.querySelector('#modal-close').addEventListener('click',closeDetail);
modal.addEventListener('click',e=>{if(e.target===modal)closeDetail();});
addEventListener('keydown',e=>{if(e.key==='Escape')closeDetail();});
renderer.domElement.addEventListener('pointerup',e=>{
  if(e.pointerType==='mouse'&&Math.abs(e.movementX||0)+Math.abs(e.movementY||0)>4)return;
  const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-((e.clientY-rect.top)/rect.height)*2+1);raycaster.setFromCamera(pointer,camera);
  if(raycaster.intersectObject(temple,true).length)showInfo('templo');
});
let night=false;
document.querySelector('#btn-time').addEventListener('click',e=>{night=!night;scene.background.set(night?'#17243c':'#a9b4ae');scene.fog.color.set(night?'#17243c':'#a9b4ae');sun.intensity=night ? 0.32 : 3;document.querySelector('#btn-time').textContent=night?'🌙 Noche':'☀ Día';});
function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera);}
animate();
showInfo('templo');
