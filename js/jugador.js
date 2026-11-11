import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { terrainHeight } from './ambiente.js';

const RADIO=.42,ALTURA_OJOS=1.65;

function crearObstaculos(){
  const items=[];const add=(x,z,w,d)=>items.push({x,z,w,d});
  // Muros del patio hundido; el tramo norte conserva una abertura para las escalinatas.
  add(-13.35,0,1.2,28);add(13.35,0,1.2,28);add(0,-13.35,28,1.2);
  add(-9.5,13.35,9,1.2);add(9.5,13.35,9,1.2);
  add(0,0,2.1,2.1);add(-5.5,0,1.1,1.1);add(5.5,0,1.1,1.1);
  // Doble perímetro con cuatro pasos centrales.
  for(const x of [-71,-68,68,71]){add(x,-30,1.2,50);add(x,30,1.2,50);}
  for(const z of [-55,-52,52,55]){add(-38,z,66,1.2);add(38,z,66,1.2);}
  // Límites simples para las plataformas y portales del conjunto.
  add(-45,34,36,36);add(43,31,27,19);add(-42,7.5,9.5,1.2);add(0,-24,4.5,1.1);
  add(27,-18,19,14);add(0,43,19,12);add(25,8,13,10);
  // Kalasasaya queda transitable: se bloquean sus perímetros y las columnas principales.
  add(-42,-15,40,1);add(-42,9,15,1);add(-54,-3,1,24);add(-30,-3,1,24);
  for(let x=-60;x<=-24;x+=3.6)for(const z of [-13.5,7.5])add(x,z,1.1,1.1);
  for(let z=-11;z<=5;z+=4)add(-59.5,z,1.1,1.1),add(-24.5,z,1.1,1.1);
  return items;
}

export function createJugador(camera,renderer,orbitControls,button){
  const pointer=new PointerLockControls(camera,renderer.domElement);pointer.pointerSpeed=.85;
  const obstacles=crearObstaculos();const keys=new Set();let walking=false,verticalSpeed=0,grounded=true,fallbackLook=false,yaw=0,pitch=0;
  const hint=document.querySelector('#interaction-help');
  const up=new THREE.Vector3(0,1,0),forward=new THREE.Vector3(),right=new THREE.Vector3(),movement=new THREE.Vector3();

  function groundAt(x,z){
    if(Math.abs(x)<5.2&&z<18&&z>9)return -5.05*THREE.MathUtils.clamp((18-z)/9,0,1);
    if(Math.abs(x)<12.25&&Math.abs(z)<12.25)return -5.05;
    if(Math.abs(x)<14.1&&Math.abs(z)<14.1)return -4.82;
    if(Math.abs(x)<68&&Math.abs(z)<52)return 0;
    return terrainHeight(x,z)-.18;
  }
  function blocked(x,z){return obstacles.some(o=>Math.abs(x-o.x)<o.w/2+RADIO&&Math.abs(z-o.z)<o.d/2+RADIO);}
  function enter(){
    if(navigator.maxTouchPoints>0&&!matchMedia('(pointer:fine)').matches)return;
    const x=3.2,z=20,y=groundAt(x,z)+ALTURA_OJOS;
    camera.position.set(x,y,z);camera.lookAt(x,y,z-10);camera.updateMatrixWorld();
    orbitControls.target.set(x,y,z-10);orbitControls.enabled=false;
    walking=true;yaw=0;pitch=0;handleLock();fallbackLook=true;
    pointer.lock();
  }
  function exit(){if(pointer.isLocked)pointer.unlock();else handleUnlock();}
  function handleLock(){walking=true;fallbackLook=false;keys.clear();document.documentElement.classList.add('walk-active');button.textContent='Pulsa Esc para salir';button.setAttribute('aria-label','Salir de la exploración a pie con Escape');hint.textContent='WASD mover · Mayús correr · Espacio saltar · Esc salir';}
  function handleUnlock(){
    if(!walking&&orbitControls.enabled)return;
    walking=false;keys.clear();verticalSpeed=0;document.documentElement.classList.remove('walk-active');
    const x=camera.position.x,z=camera.position.z,y=groundAt(x,z)+ALTURA_OJOS;
    camera.position.set(x+21,y+19,z+23);orbitControls.target.set(x,y-1,z);orbitControls.enabled=true;orbitControls.update();
    button.textContent='Explorar a pie';button.setAttribute('aria-label','Activar exploración a pie');hint.textContent='Órbita con ratón o gestos';
  }
  pointer.addEventListener('lock',handleLock);pointer.addEventListener('unlock',handleUnlock);
  pointer.addEventListener('error',()=>{fallbackLook=true;});
  renderer.domElement.addEventListener('mousemove',event=>{
    if(!walking||!fallbackLook)return;yaw-=event.movementX*.0022;pitch=THREE.MathUtils.clamp(pitch-event.movementY*.0022,-1.35,1.35);camera.rotation.set(pitch,yaw,0,'YXZ');
  });
  button.addEventListener('click',()=>walking?exit():enter());
  addEventListener('keydown',event=>{
    const key=event.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key))keys.add(key);
    if(event.key==='Escape'&&walking&&!pointer.isLocked){exit();return;}
    if(event.code==='Space'&&walking){event.preventDefault();if(grounded){verticalSpeed=7;grounded=false;}}
  });
  addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));

  function update(delta){
    if(!walking)return;
    const dt=Math.min(delta,.05);pointer.getDirection(forward);forward.y=0;forward.normalize();right.crossVectors(forward,up).normalize();movement.set(0,0,0);
    if(keys.has('w')||keys.has('arrowup'))movement.add(forward);
    if(keys.has('s')||keys.has('arrowdown'))movement.sub(forward);
    if(keys.has('d')||keys.has('arrowright'))movement.add(right);
    if(keys.has('a')||keys.has('arrowleft'))movement.sub(right);
    if(movement.lengthSq()>0){movement.normalize().multiplyScalar((keys.has('shift')?8.5:5.1)*dt);const nx=camera.position.x+movement.x,nz=camera.position.z+movement.z;if(!blocked(nx,camera.position.z))camera.position.x=nx;if(!blocked(camera.position.x,nz))camera.position.z=nz;}
    const floor=groundAt(camera.position.x,camera.position.z);let foot=camera.position.y-ALTURA_OJOS;
    if(!grounded||verticalSpeed>0){verticalSpeed-=19*dt;foot+=verticalSpeed*dt;if(foot<=floor){foot=floor;verticalSpeed=0;grounded=true;}}
    else{foot=floor;grounded=true;}
    camera.position.y=foot+ALTURA_OJOS;
  }
  return {update,get walking(){return walking;},get position(){return camera.position;},exit};
}
