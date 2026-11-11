import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { terrainHeight } from './ambiente.js';

const RADIO=.42,ALTURA_OJOS=1.65;

function crearObstaculos(){
  const items=[];const add=(x,z,w,d)=>items.push({x,z,w,d});
  // Muros del patio hundido con un acceso central por la escalinata sur.
  add(-13.65,0,1.4,28.4);add(13.65,0,1.4,28.4);add(0,-13.65,28.4,1.4);
  add(-8.4,13.65,11,1.4);add(8.4,13.65,11,1.4);
  add(0,0,2.1,2.1);
  // Doble perímetro con cuatro pasos centrales.
  for(const x of [-71,-68,68,71]){add(x,-30,1.2,50);add(x,30,1.2,50);}
  for(const z of [-55,-52,52,55]){add(-38,z,66,1.2);add(38,z,66,1.2);}
  // Columnas de la Puerta del Sol: el vano central queda libre para atravesarlo.
  add(-1.45,-24,.8,1.2);add(1.45,-24,.8,1.2);
  // Altares y bloques de ruinas; las plataformas escalonadas quedan transitables.
  add(43,31,5.8,4.8);add(38.5,31,5,5);add(47.5,31,5,5);
  add(0,43,4.8,3.6);
  add(-9.5,43,1,12);add(9.5,43,1,12);add(0,37,19,1);
  add(-5.5,49,8,1);add(5.5,49,8,1);
  add(27,-18,19,14);add(25,8,13,10);
  // Kalasasaya queda transitable: se bloquean sus perímetros y los 13 pilares principales.
  add(-42,-15,40,1);add(-53.5,9,17,1);add(-30.5,9,17,1);add(-54,-3,1,24);add(-30,-3,1,24);
  for(const x of [-60,-51,-42,-33,-24])add(x,-13.5,1.2,1.2);
  for(const x of [-60,-50,-34,-24])add(x,7.5,1.2,1.2);
  for(const x of [-60,-48,-36,-24])add(x,-3,1.2,1.2);
  return items;
}

export function createJugador(camera,renderer,orbitControls,button,site=null,onInvalidate=()=>{}){
  const pointer=new PointerLockControls(camera,renderer.domElement);pointer.pointerSpeed=.85;
  const obstacles=crearObstaculos();const keys=new Set();let walking=false,verticalSpeed=0,grounded=true,fallbackLook=false,yaw=0,pitch=0;
  const hint=document.querySelector('#interaction-help');
  const up=new THREE.Vector3(0,1,0),forward=new THREE.Vector3(),right=new THREE.Vector3(),movement=new THREE.Vector3();
  const walkableModels=[
    {group:site?.getObjectByName('akapana'),minX:-64,maxX:-26,minZ:14,maxZ:54},
    {group:site?.getObjectByName('puma-punku'),minX:28,maxX:58,minZ:19,maxZ:43},
    {group:site?.getObjectByName('kalasasaya'),minX:-64,maxX:-20,minZ:-17,maxZ:11},
    {group:site?.getObjectByName('kheri-kala'),minX:-11,maxX:11,minZ:35,maxZ:51}
  ].filter(item=>item.group);
  const surfaceRay=new THREE.Raycaster();
  const surfaceOrigin=new THREE.Vector3();
  const down=new THREE.Vector3(0,-1,0);

  function groundAt(x,z){
    // La escalera sur del Templete tiene siete descansos desde el patio hasta el terreno.
    if(Math.abs(x)<3.2&&z>=11.19&&z<16.93){
      const step=Math.min(6,Math.floor((z-11.19)/.82));
      return -4.8+(step+1)*(4.8/7);
    }
    if(Math.abs(x)<13.2&&Math.abs(z)<13.2)return -4.82;
    const base=Math.abs(x)<68&&Math.abs(z)<52?0:terrainHeight(x,z)-.18;
    let floor=base;
    for(const item of walkableModels){
      if(x<item.minX||x>item.maxX||z<item.minZ||z>item.maxZ)continue;
      surfaceRay.set(surfaceOrigin.set(x,80,z),down);
      surfaceRay.far=100;
      const hit=surfaceRay.intersectObject(item.group,true).find(result=>result.point.y>floor+.05&&result.point.y<floor+18);
      if(hit)floor=hit.point.y;
    }
    return floor;
  }
  function blocked(x,z){return obstacles.some(o=>Math.abs(x-o.x)<o.w/2+RADIO&&Math.abs(z-o.z)<o.d/2+RADIO);}
  function enter(){
    if(navigator.maxTouchPoints>0&&!matchMedia('(pointer:fine)').matches)return;
    const x=3.2,z=20,y=groundAt(x,z)+ALTURA_OJOS;
    camera.position.set(x,y,z);camera.lookAt(x,y,z-10);camera.updateMatrixWorld();
    orbitControls.target.set(x,y,z-10);orbitControls.enabled=false;
    walking=true;yaw=0;pitch=0;handleLock();fallbackLook=true;
    pointer.lock();
    onInvalidate();
  }
  function exit(){if(pointer.isLocked)pointer.unlock();else handleUnlock();}
  function handleLock(){walking=true;fallbackLook=false;keys.clear();document.documentElement.classList.add('walk-active');button.textContent='Pulsa Esc para salir';button.setAttribute('aria-label','Salir de la exploración a pie con Escape');hint.textContent='WASD mover · Mayús correr · Espacio saltar y subir escalones · Esc salir';onInvalidate();}
  function handleUnlock(){
    if(!walking&&orbitControls.enabled)return;
    walking=false;keys.clear();verticalSpeed=0;document.documentElement.classList.remove('walk-active');
    const x=camera.position.x,z=camera.position.z,y=groundAt(x,z)+ALTURA_OJOS;
    camera.position.set(x+21,y+19,z+23);orbitControls.target.set(x,y-1,z);orbitControls.enabled=true;orbitControls.update();
    button.textContent='Explorar a pie';button.setAttribute('aria-label','Activar exploración a pie');hint.textContent='Órbita con ratón o gestos';onInvalidate();
  }
  pointer.addEventListener('lock',handleLock);pointer.addEventListener('unlock',handleUnlock);
  pointer.addEventListener('change',onInvalidate);
  pointer.addEventListener('error',()=>{fallbackLook=true;onInvalidate();});
  renderer.domElement.addEventListener('mousemove',event=>{
    if(!walking)return;
    if(fallbackLook){yaw-=event.movementX*.0022;pitch=THREE.MathUtils.clamp(pitch-event.movementY*.0022,-1.35,1.35);camera.rotation.set(pitch,yaw,0,'YXZ');}
    onInvalidate();
  });
  button.addEventListener('click',()=>walking?exit():enter());
  addEventListener('keydown',event=>{
    const key=event.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)){keys.add(key);if(walking)onInvalidate();}
    if(event.key==='Escape'&&walking&&!pointer.isLocked){exit();return;}
    if(event.code==='Space'&&walking){event.preventDefault();if(grounded){verticalSpeed=7;grounded=false;onInvalidate();}}
  });
  addEventListener('keyup',event=>{if(keys.delete(event.key.toLowerCase())&&walking)onInvalidate();});

  function update(delta){
    if(!walking)return;
    const dt=Math.min(delta,.05);pointer.getDirection(forward);forward.y=0;forward.normalize();right.crossVectors(forward,up).normalize();movement.set(0,0,0);
    if(keys.has('w')||keys.has('arrowup'))movement.add(forward);
    if(keys.has('s')||keys.has('arrowdown'))movement.sub(forward);
    if(keys.has('d')||keys.has('arrowright'))movement.add(right);
    if(keys.has('a')||keys.has('arrowleft'))movement.sub(right);
    if(movement.lengthSq()>0){
      movement.normalize().multiplyScalar((keys.has('shift')?8.5:5.1)*dt);
      const currentFloor=camera.position.y-ALTURA_OJOS;
      const maxStep=grounded?0.72:Infinity;
      const nx=camera.position.x+movement.x;
      if(!blocked(nx,camera.position.z)&&groundAt(nx,camera.position.z)<=currentFloor+maxStep)camera.position.x=nx;
      const nz=camera.position.z+movement.z;
      if(!blocked(camera.position.x,nz)&&groundAt(camera.position.x,nz)<=currentFloor+maxStep)camera.position.z=nz;
    }
    const floor=groundAt(camera.position.x,camera.position.z);let foot=camera.position.y-ALTURA_OJOS;
    if(!grounded||verticalSpeed>0){verticalSpeed-=19*dt;foot+=verticalSpeed*dt;if(foot<=floor){foot=floor;verticalSpeed=0;grounded=true;}}
    else{foot=floor;grounded=true;}
    camera.position.y=foot+ALTURA_OJOS;
  }
  return {update,get walking(){return walking;},get needsUpdate(){return walking&&(keys.size>0||!grounded||Math.abs(verticalSpeed)>.0001);},get position(){return camera.position;},exit};
}
