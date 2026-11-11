import * as THREE from 'three';

// La ondulación comienza fuera del recinto para conservar una explanada estable.
export function terrainHeight(x,z){
  const edge=Math.max(Math.abs(x)-68,Math.abs(z)-52);
  const t=THREE.MathUtils.clamp(edge/24,0,1);const fade=t*t*(3-2*t);
  const waves=Math.sin(x*.045+z*.018)*.42+Math.cos(z*.052-x*.012)*.28+Math.sin((x+z)*.11)*.11;
  return waves*fade;
}

export function createTerrain(){
  const geometry=new THREE.PlaneGeometry(500,500,180,180);
  const pos=geometry.attributes.position;const colors=[];const color=new THREE.Color();
  const indices=[];const rowSize=181;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),z=-pos.getY(i),height=terrainHeight(x,z);
    pos.setZ(i,height);
    const variation=(Math.sin(x*.09)*Math.cos(z*.07)+1)*.035+height*.025;
    color.setRGB(.48+variation,.43+variation*.82,.32+variation*.52);colors.push(color.r,color.g,color.b);
  }
  // Se deja abierta la huella del patio para que el terreno no tape su interior hundido.
  for(let row=0;row<180;row++)for(let col=0;col<180;col++){
    const a=row*rowSize+col,b=(row+1)*rowSize+col,c=b+1,d=a+1;
    const centerX=(pos.getX(a)+pos.getX(c))*.5,centerZ=-(pos.getY(a)+pos.getY(c))*.5;
    if(Math.abs(centerX)<14.1&&Math.abs(centerZ)<14.1)continue;
    indices.push(a,b,d,b,c,d);
  }
  geometry.setIndex(indices);
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:1});
  const ground=new THREE.Mesh(geometry,material);ground.rotation.x=-Math.PI/2;ground.position.y=-.18;ground.receiveShadow=true;ground.name='terreno-altiplanico';return ground;
}

function createSky(scene){
  const material=new THREE.ShaderMaterial({
    uniforms:{uMode:{value:0}},side:THREE.BackSide,depthWrite:false,toneMapped:true,
    vertexShader:`varying vec3 vDirection; void main(){ vec4 worldPosition=modelMatrix*vec4(position,1.0); vDirection=normalize(worldPosition.xyz-cameraPosition); gl_Position=projectionMatrix*viewMatrix*worldPosition; }`,
    fragmentShader:`uniform float uMode; varying vec3 vDirection; void main(){
      float h=clamp(vDirection.y*.5+.5,0.0,1.0);
      vec3 dayH=vec3(.72,.79,.80),dayZ=vec3(.18,.43,.67);
      vec3 eveH=vec3(.96,.56,.32),eveZ=vec3(.22,.27,.48);
      vec3 nightH=vec3(.10,.16,.25),nightZ=vec3(.015,.035,.09);
      vec3 horizon=mix(mix(dayH,eveH,step(.5,uMode)),nightH,step(1.5,uMode));
      vec3 zenith=mix(mix(dayZ,eveZ,step(.5,uMode)),nightZ,step(1.5,uMode));
      float blend=smoothstep(.05,.92,h);vec3 sky=mix(horizon,zenith,blend);
      float glow=exp(-pow((h-.50)*9.0,2.0));
      sky+=mix(vec3(.10,.08,.04),mix(vec3(.38,.14,.04),vec3(0.0),step(1.5,uMode)),uMode>1.0?1.0:0.0)*glow;
      gl_FragColor=vec4(sky,1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
  });
  const dome=new THREE.Mesh(new THREE.SphereGeometry(800,32,16),material);dome.name='cielo-gradiente';dome.frustumCulled=false;dome.renderOrder=-1000;scene.add(dome);
  const starPositions=[];let seed=91827;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<1500;i++){const y=random()*2-1;const angle=random()*Math.PI*2;const radius=520;const planar=Math.sqrt(1-y*y);starPositions.push(Math.cos(angle)*planar*radius,y*radius,Math.sin(angle)*planar*radius);}
  const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));
  const stars=new THREE.Points(starGeo,new THREE.PointsMaterial({color:'#fff5d2',size:1.4,sizeAttenuation:false,transparent:true,opacity:0,depthWrite:false}));stars.name='estrellas';stars.frustumCulled=false;scene.add(stars);
  return {material,stars};
}

function createLake(scene){
  const geometry=new THREE.PlaneGeometry(260,92,78,28);geometry.rotateX(-Math.PI/2);
  const base=geometry.attributes.position.array.slice();
  const material=new THREE.MeshBasicMaterial({color:'#588da1',transparent:true,opacity:.78,side:THREE.DoubleSide,depthWrite:false,fog:false});
  const lake=new THREE.Mesh(geometry,material);lake.position.set(-20,1.05,-148);lake.name='lago-titicaca';lake.receiveShadow=false;lake.frustumCulled=true;scene.add(lake);
  return {geometry,base};
}

function createIchu(scene){
  const count=600;const geometry=new THREE.ConeGeometry(.10,1,5);
  const material=new THREE.MeshStandardMaterial({color:'#78804b',roughness:.94});
  material.onBeforeCompile=shader=>{
    shader.uniforms.uWind={value:0};
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float uWind;');
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING\ntransformed.x += sin(uWind + instanceMatrix[3][0] * 0.027) * 0.065 * max(position.y + 0.5, 0.0);\n#endif');
    material.userData.windShader=shader;
  };
  const blades=[0,1,2].map(()=>new THREE.InstancedMesh(geometry,material,count));
  const d=new THREE.Object3D();const color=new THREE.Color();let seed=54421;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<count;i++){
    let x=0,z=0;for(let tryN=0;tryN<20;tryN++){x=(rand()-.5)*285;z=(rand()-.5)*290;if(!(Math.abs(x)<71&&Math.abs(z)<57)&&z>-103)break;}
    const y=terrainHeight(x,z)-.18;
    for(let b=0;b<3;b++){
      const height=.8+rand()*.78;d.position.set(x+(rand()-.5)*.34,y+height*.47,z+(rand()-.5)*.34);d.rotation.set((rand()-.5)*.18,rand()*Math.PI*2,(rand()-.5)*.14);d.scale.set(.62+rand()*.4,height,.62+rand()*.4);d.updateMatrix();blades[b].setMatrixAt(i,d.matrix);
      color.setHSL(.17+rand()*.055,.28,.32+rand()*.12);blades[b].setColorAt(i,color);
    }
  }
  blades.forEach(mesh=>{mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=false;mesh.receiveShadow=false;mesh.name='ichu-instanciado';scene.add(mesh);});
  return {blades,material};
}

function createLlamas(scene){
  const centers=[[-77,-30],[-77,30],[77,-30],[77,30],[-30,-60],[30,-60],[-30,60],[30,60]];
  const fur=new THREE.MeshStandardMaterial({color:'#c7b99a',roughness:.9});
  const dark=new THREE.MeshStandardMaterial({color:'#554638',roughness:.95});
  const body=new THREE.InstancedMesh(new THREE.BoxGeometry(1.45,.95,.78),fur,centers.length);
  const neck=new THREE.InstancedMesh(new THREE.CylinderGeometry(.18,.25,1.12,6),fur,centers.length);
  const head=new THREE.InstancedMesh(new THREE.BoxGeometry(.48,.42,.48),fur,centers.length);
  const muzzle=new THREE.InstancedMesh(new THREE.BoxGeometry(.30,.22,.3),dark,centers.length);
  const ears=new THREE.InstancedMesh(new THREE.ConeGeometry(.12,.55,5),dark,centers.length*2);
  const legs=new THREE.InstancedMesh(new THREE.BoxGeometry(.18,.78,.2),dark,centers.length*4);
  const matrices=[];const d=new THREE.Object3D();
  centers.forEach(([x,z],i)=>{
    const y=terrainHeight(x,z)-.18;const baseY=y+.65;
    d.position.set(x,baseY,z);d.rotation.set(0,(i%5)*.72,0);d.updateMatrix();body.setMatrixAt(i,d.matrix);
    d.position.set(x+.38,baseY+.69,z);d.rotation.set(.08,0,.12);d.updateMatrix();neck.setMatrixAt(i,d.matrix);
    const headPos=new THREE.Vector3(x+.39,baseY+1.27,z);matrices.push({x,z,baseY,angle:(i%2)*Math.PI,headPos});
    d.position.copy(headPos);d.rotation.set(0,(i%5)*.72,0);d.updateMatrix();head.setMatrixAt(i,d.matrix);
    d.position.set(x+.55,baseY+1.22,z);d.updateMatrix();muzzle.setMatrixAt(i,d.matrix);
    for(let ear=0;ear<2;ear++){d.position.set(x+.30,baseY+1.68,z+(ear?-.14:.14));d.rotation.set(.1,0,ear?-.12:.12);d.updateMatrix();ears.setMatrixAt(i*2+ear,d.matrix);}
    for(let leg=0;leg<4;leg++){const lx=x+(leg<2?-.45:.45),lz=z+(leg%2?-.22:.22);d.position.set(lx,y+.39,lz);d.rotation.set(0,0,0);d.updateMatrix();legs.setMatrixAt(i*4+leg,d.matrix);}
  });
  [body,neck,head,muzzle,ears,legs].forEach(mesh=>{mesh.castShadow=true;mesh.receiveShadow=true;mesh.name='llamas-instanciadas';mesh.instanceMatrix.needsUpdate=true;scene.add(mesh);});
  return {head,matrices};
}

export function createAmbiente(scene,sun){
  const sky=createSky(scene);const lake=createLake(scene);const grass=createIchu(scene);const llamas=createLlamas(scene);
  let mode=0;
  const setTime=value=>{
    mode=((value%3)+3)%3;sky.material.uniforms.uMode.value=mode;
    const colors=['#a9b4ae','#bb8165','#17243c'];scene.fog.color.set(colors[mode]);
    sun.color.set(['#fff0ce','#ffb56d','#94aeda'][mode]);sun.intensity=[2,1.55,.18][mode];
    sun.position.set([-35,-65,-20][mode],[55,22,-18][mode],[24,-55,30][mode]);
    sky.stars.material.opacity=mode===2 ? .82 : 0;
    return mode;
  };
  const update=time=>{
    const windShader=grass.material.userData.windShader;if(windShader)windShader.uniforms.uWind.value=time;
    const pos=lake.geometry.attributes.position;const base=lake.base;
    for(let i=0;i<pos.count;i++)pos.setY(i,base[i*3+1]+Math.sin(time*1.15+base[i*3]*.055+base[i*3+2]*.035)*.035);
    pos.needsUpdate=true;lake.geometry.computeVertexNormals();
    const d=new THREE.Object3D();llamas.matrices.forEach(({x,z,baseY,angle,headPos},i)=>{d.position.copy(headPos);d.rotation.set(Math.sin(time*.8+i)*.06,angle,Math.sin(time*1.25+i*1.7)*.14);d.updateMatrix();llamas.head.setMatrixAt(i,d.matrix);});llamas.head.instanceMatrix.needsUpdate=true;
  };
  setTime(0);
  return {setTime,update,get mode(){return mode;}};
}
