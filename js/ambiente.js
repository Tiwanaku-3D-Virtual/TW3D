import * as THREE from 'three';
import { loadLocalModel } from './modelos-3d.js';

// La ondulación comienza fuera del recinto para conservar una explanada estable.
export function terrainHeight(x,z){
  const edge=Math.max(Math.abs(x)-68,Math.abs(z)-52);
  const t=THREE.MathUtils.clamp(edge/24,0,1);const fade=t*t*(3-2*t);
  const waves=Math.sin(x*.045+z*.018)*.42+Math.cos(z*.052-x*.012)*.28+Math.sin((x+z)*.11)*.11;
  return waves*fade;
}

function createTerrainPatch({size,segments,holeSize=0,patioHole=false}){
  const geometry=new THREE.PlaneGeometry(size,size,segments,segments);
  const positions=geometry.attributes.position;
  const uvs=geometry.attributes.uv;
  const colors=new Float32Array(positions.count*3);
  const normals=new Float32Array(positions.count*3);
  const indices=[];
  const rowSize=segments+1;
  const color=new THREE.Color();
  const sampleStep=.5;
  const worldSize=2000;
  const worldHalf=worldSize/2;

  for(let i=0;i<positions.count;i++){
    const x=positions.getX(i);
    const z=-positions.getY(i);
    const height=terrainHeight(x,z);
    positions.setZ(i,height);

    // Mantiene la misma escala de textura entre el terreno cercano y el lejano.
    uvs.setXY(i,(x+worldHalf)/worldSize,(worldHalf-z)/worldSize);

    const variation=(Math.sin(x*.09)*Math.cos(z*.07)+1)*.035+height*.025;
    color.setRGB(.9+variation*.55,.82+variation*.5,.68+variation*.4);
    colors[i*3]=color.r;colors[i*3+1]=color.g;colors[i*3+2]=color.b;

    // Normales compartidas entre niveles para evitar una costura de iluminación.
    const slopeX=(terrainHeight(x+sampleStep,z)-terrainHeight(x-sampleStep,z))/(sampleStep*2);
    const slopeZ=(terrainHeight(x,z+sampleStep)-terrainHeight(x,z-sampleStep))/(sampleStep*2);
    const normalLength=Math.sqrt(slopeX*slopeX+slopeZ*slopeZ+1);
    normals[i*3]=-slopeX/normalLength;
    normals[i*3+1]=slopeZ/normalLength;
    normals[i*3+2]=1/normalLength;
  }

  for(let row=0;row<segments;row++)for(let col=0;col<segments;col++){
    const a=row*rowSize+col,b=(row+1)*rowSize+col,c=b+1,d=a+1;
    const centerX=(positions.getX(a)+positions.getX(c))*.5;
    const centerZ=-(positions.getY(a)+positions.getY(c))*.5;
    if(holeSize&&Math.abs(centerX)<holeSize&&Math.abs(centerZ)<holeSize)continue;
    if(patioHole&&Math.abs(centerX)<14.1&&Math.abs(centerZ)<14.1)continue;
    indices.push(a,b,d,b,c,d);
  }

  geometry.setIndex(indices);
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));
  geometry.computeBoundingSphere();
  return geometry;
}

export function createTerrain(){
  const texture=new THREE.TextureLoader().load('assets/textures/GroundDirtRocky020_COL_2K.jpg');
  texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(152,152);
  const material=new THREE.MeshStandardMaterial({map:texture,color:'#ffffff',vertexColors:true,roughness:1});
  const ground=new THREE.Group();
  ground.name='terreno-altiplanico';

  const farGround=new THREE.Mesh(createTerrainPatch({size:2000,segments:160,holeSize:150}),material);
  farGround.rotation.x=-Math.PI/2;farGround.position.y=-.18;farGround.receiveShadow=true;farGround.name='terreno-lejano';
  const nearGround=new THREE.Mesh(createTerrainPatch({size:300,segments:60,patioHole:true}),material);
  nearGround.rotation.x=-Math.PI/2;nearGround.position.y=-.18;nearGround.receiveShadow=true;nearGround.name='terreno-cercano';
  ground.add(farGround,nearGround);
  return ground;
}

const skyPaths = [
  'assets/textures/cielos.webp',
  'assets/textures/amanecer.webp',
  'assets/textures/cold-night-equirect.webp'
];

function loadEquirectTexture(path, maxDimension = 2048) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let source = img;
      if (img.width > maxDimension || img.height > maxDimension) {
        const aspect = img.width / img.height;
        const targetW = maxDimension;
        const targetH = Math.round(maxDimension / aspect);
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, targetW, targetH);
        source = canvas;
      }
      const texture = new THREE.CanvasTexture(source);
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      texture.needsUpdate = true;
      resolve(texture);
    };
    img.onerror = (err) => {
      console.warn('Error al cargar textura de cielo:', path, err);
      const tex = new THREE.TextureLoader().load(path);
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      resolve(tex);
    };
    img.src = path;
  });
}

function createStars(scene) {
  const starPositions = [];
  let seed = 91827;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 1500; i++) {
    const y = random() * 2 - 1;
    const angle = random() * Math.PI * 2;
    const radius = 520;
    const planar = Math.sqrt(1 - y * y);
    starPositions.push(Math.cos(angle) * planar * radius, y * radius, Math.sin(angle) * planar * radius);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({
      color: '#fff5d2',
      size: 1.4,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0,
      depthWrite: false
    })
  );
  stars.name = 'estrellas';
  stars.frustumCulled = false;
  scene.add(stars);
  return stars;
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
  return {blades,material,active:true};
}

async function replaceIchuWithModel(scene, fallback){
  try{
    const model=await loadLocalModel('assets/models/ichu.glb',{fitSize:4,tint:'#779c48',tintMode:'replace'});
    model.updateWorldMatrix(true,true);
    const count=120,positions=[];let seed=87231;
    const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<count;i++){
      let x=0,z=0;
      for(let attempt=0;attempt<24;attempt++){
        x=(random()-.5)*220;z=(random()-.5)*180;
        const inTemple=Math.abs(x)<17&&Math.abs(z)<17;
        const inKalasasaya=x>-64&&x<-20&&z>-16&&z<11;
        const inAkapana=x>-64&&x<-25&&z>14&&z<55;
        const inPumaPunku=x>28&&x<59&&z>15&&z<47;
        const inSunGate=x>-5&&x<5&&z>-30&&z<-18;
        if(!inTemple&&!inKalasasaya&&!inAkapana&&!inPumaPunku&&!inSunGate&&z>-103)break;
      }
      positions.push([x,terrainHeight(x,z)-.18,z,random()*Math.PI*2,1.05+random()*.55]);
    }
    const detailMeshes=[];model.traverse((node)=>{if(node.isMesh)detailMeshes.push(node);});
    detailMeshes.forEach((source,index)=>{
      const geometry=source.geometry.clone().applyMatrix4(source.matrixWorld);
      const mesh=new THREE.InstancedMesh(geometry,source.material,count);
      mesh.name=`ichu-glb-instanciado-${index+1}`;
      const dummy=new THREE.Object3D();
      positions.forEach(([x,y,z,rotation,scale],instance)=>{
        dummy.position.set(x,y,z);dummy.rotation.set(0,rotation,0);dummy.scale.setScalar(scale);dummy.updateMatrix();mesh.setMatrixAt(instance,dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=false;mesh.receiveShadow=false;scene.add(mesh);
    });
    fallback.blades.forEach((mesh)=>scene.remove(mesh));
    fallback.blades[0]?.geometry.dispose();fallback.material.dispose();
    fallback.active=false;
  }catch(error){
    console.warn('Se conserva el ichu generado si no se puede cargar el modelo local.',error);
  }
}

export function createAmbiente(scene, sun, onChange = () => {}) {
  const skyTextures = [null, null, null];
  const stars = createStars(scene);
  const grass = createIchu(scene);
  replaceIchuWithModel(scene, grass);
  let mode = 0;

  async function getOrLoadSkyTexture(idx) {
    if (skyTextures[idx]) return skyTextures[idx];
    const tex = await loadEquirectTexture(skyPaths[idx]);
    skyTextures[idx] = tex;
    return tex;
  }

  const applySky = (targetMode) => {
    if (skyTextures[targetMode]) {
      scene.background = skyTextures[targetMode];
      scene.environment = skyTextures[targetMode];
      scene.environmentIntensity = [0.45, 0.40, 0.22][targetMode];
      onChange();
    } else {
      getOrLoadSkyTexture(targetMode).then((tex) => {
        if (mode === targetMode) {
          scene.background = tex;
          scene.environment = tex;
          scene.environmentIntensity = [0.45, 0.40, 0.22][targetMode];
          onChange();
        }
      });
    }
  };

  const setTime = (value) => {
    mode = ((value % 3) + 3) % 3;
    applySky(mode);

    const colors = ['#9cb2be', '#b46644', '#0b1322'];
    if (scene.fog) {
      scene.fog.color.set(colors[mode]);
      scene.fog.near = [140, 130, 110][mode];
      scene.fog.far = [520, 480, 420][mode];
    }

    sun.color.set(['#fff0ce', '#ff9e56', '#7d9bc6'][mode]);
    sun.intensity = [2.2, 1.7, 0.35][mode];
    sun.position.set([-35, -65, -20][mode], [55, 22, -18][mode], [24, -55, 30][mode]);
    stars.material.opacity = mode === 2 ? 0.82 : 0;
    onChange();
    return mode;
  };

  const update = (time) => {
    const windShader = grass.material.userData.windShader;
    if (windShader) windShader.uniforms.uWind.value = time;
    return grass.active;
  };

  // Aplica inmediatamente el cielo diurno
  setTime(0);

  return { setTime, update, get mode() { return mode; } };
}
