import * as THREE from 'three';

const stone = new THREE.MeshStandardMaterial({ color: '#948a73', roughness: .96 });
function slab(group, w, d, y = .35) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, .7, d), stone);
  m.position.y = y;
  m.castShadow = m.receiveShadow = true;
  group.add(m);
  return m;
}

export function createKheriKala() {
  const g = new THREE.Group();
  g.name = 'kheri-kala';
  g.position.set(0, 0, 43);
  g.userData.infoKey = 'kheriKala';

  // Textura pétrea de andesita para Kheri Kala
  const textureLoader = new THREE.TextureLoader();
  const kheriTex = textureLoader.load('assets/textures/GroundDirtRocky020_COL_2K.jpg');
  kheriTex.colorSpace = THREE.SRGBColorSpace;
  kheriTex.wrapS = kheriTex.wrapT = THREE.RepeatWrapping;
  kheriTex.repeat.set(4, 3);

  const kheriStone = new THREE.MeshStandardMaterial({
    map: kheriTex,
    color: '#b8ab91',
    roughness: 0.88,
    metalness: 0.02
  });

  // 1. Plataforma base ceremonial texturizada
  const base = new THREE.Mesh(new THREE.BoxGeometry(19, 0.7, 12), kheriStone);
  base.position.y = 0.35;
  base.castShadow = base.receiveShadow = true;
  g.add(base);

  // 2. Muro perimetral bajo de andesita labrada texturizada
  const wallGeo = new THREE.BoxGeometry(1, 0.9, 0.9);
  const mesh = new THREE.InstancedMesh(wallGeo, kheriStone, Math.ceil(19 + 12) * 2);
  const obj = new THREE.Object3D();
  let n = 0;
  const w = 19, d = 12;
  for (let x = -w / 2; x <= w / 2; x += 1) {
    obj.position.set(x, 0.95, -d / 2);
    obj.scale.set(1, 0.9, 1);
    obj.updateMatrix();
    mesh.setMatrixAt(n++, obj.matrix);
    // Se deja una entrada al sur alineada con el sendero de acceso.
    if (Math.abs(x) > 1.5) {
      obj.position.z = d / 2;
      obj.updateMatrix();
      mesh.setMatrixAt(n++, obj.matrix);
    }
  }
  for (let z = -d / 2 + 1; z < d / 2; z += 1) {
    obj.position.set(-w / 2, 0.95, z);
    obj.rotation.y = Math.PI / 2;
    obj.updateMatrix();
    mesh.setMatrixAt(n++, obj.matrix);
    obj.position.x = w / 2;
    obj.updateMatrix();
    mesh.setMatrixAt(n++, obj.matrix);
    obj.rotation.y = 0;
  }
  mesh.count = n;
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = mesh.receiveShadow = true;
  g.add(mesh);

  // Tres peldaños bajos conectan el terreno con la plataforma por la abertura sur.
  for (let i = 0; i < 3; i++) {
    const height = 0.23 * (i + 1);
    const step = new THREE.Mesh(new THREE.BoxGeometry(3.2, height, 0.75), kheriStone);
    step.position.set(0, height / 2, 7.5 - i * 0.75);
    step.castShadow = step.receiveShadow = true;
    g.add(step);
  }

  // 3. Altar central interior de Kheri Kala con textura de andesita
  const innerAltar = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.35, 3.6), kheriStone);
  innerAltar.position.set(0, 0.85, 0);
  innerAltar.castShadow = innerAltar.receiveShadow = true;
  g.add(innerAltar);

  return g;
}

export function createDoublePerimeter(){
  const group=new THREE.Group();group.name='muro-perimetral';
  const stoneTexture=new THREE.TextureLoader().load('assets/textures/GroundDirtRocky020_COL_2K.jpg');
  stoneTexture.colorSpace=THREE.SRGBColorSpace;
  stoneTexture.wrapS=stoneTexture.wrapT=THREE.RepeatWrapping;
  stoneTexture.repeat.set(2,2);
  const mat=new THREE.MeshStandardMaterial({map:stoneTexture,color:'#c8b99a',roughness:.98});
  const jambMat=new THREE.MeshStandardMaterial({map:stoneTexture,color:'#ad9e80',roughness:.96});
  const blocks=[];const add=(x,y,z,sx,sy,sz)=>blocks.push([x,y,z,sx,sy,sz]);
  const makeSide=(halfX,halfZ,y,gap,inner=false)=>{
    for(let x=-halfX;x<=halfX;x+=2.1){if(Math.abs(x)<gap/2)continue;for(let h=0;h<3;h++)add(x,y+h*.85,halfZ,2.1,.82,1.1);}
    for(let x=-halfX;x<=halfX;x+=2.1){if(Math.abs(x)<gap/2)continue;for(let h=0;h<3;h++)add(x,y+h*.85,-halfZ,2.1,.82,1.1);}
    for(let z=-halfZ+2;z<halfZ;z+=2.1){if(Math.abs(z)<gap/2)continue;for(let h=0;h<3;h++)add(halfX,y+h*.85,z,1.1,.82,2.1);}
    for(let z=-halfZ+2;z<halfZ;z+=2.1){if(Math.abs(z)<gap/2)continue;for(let h=0;h<3;h++)add(-halfX,y+h*.85,z,1.1,.82,2.1);}
  };
  makeSide(71,55,0,10);makeSide(68,52,0,10,true);
  const geo=new THREE.BoxGeometry(1,1,1);const mesh=new THREE.InstancedMesh(geo,mat,blocks.length);const d=new THREE.Object3D();const color=new THREE.Color();
  blocks.forEach(([x,y,z,sx,sy,sz],i)=>{d.position.set(x,y+.4,z);d.scale.set(sx,sy,sz);d.rotation.y=(Math.random()-.5)*.03;d.updateMatrix();mesh.setMatrixAt(i,d.matrix);color.set('#b7a987').offsetHSL(0,0,(Math.random()-.5)*.08);mesh.setColorAt(i,color);});
  mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);
  // Jambas de piedra señalan las entradas abiertas sin bloquear el paso.
  for(const x of [-5.2,5.2])for(const z of [-53,53]){const jamb=new THREE.Mesh(new THREE.BoxGeometry(.9,2.8,1.2),jambMat);jamb.position.set(x,1.4,z);jamb.castShadow=true;group.add(jamb);}
  for(const z of [-5.2,5.2])for(const x of [-69,69]){const jamb=new THREE.Mesh(new THREE.BoxGeometry(1.2,2.8,.9),jambMat);jamb.position.set(x,1.4,z);jamb.castShadow=true;group.add(jamb);}
  return group;
}
