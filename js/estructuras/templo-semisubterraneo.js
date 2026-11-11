import * as THREE from 'three';

// La piedra se representa con sillares cálidos de andesita y una ligera variación tonal.
export function createTemplete() {
  const group = new THREE.Group(); group.name = 'templo';
  const stoneGeo = new THREE.BoxGeometry(1, 1, 1);
  const stoneMat = new THREE.MeshStandardMaterial({ color: '#a69b82', roughness: .94 });
  const blocks = [];
  const addBlock = (x, y, z, sx, sy, sz, rot = 0, tint = 0) => blocks.push({ x, y, z, sx, sy, sz, rot, tint });
  const span = 28;
  // Tres terrazas descienden hacia el patio; cada nivel retranquea el muro interior.
  for (let level = 0; level < 3; level++) {
    const y0 = -4.8 + level * 1.6;
    const inset = level * .38;
    const edge = span / 2 - inset;
    const courseCount = 2;
    for (let c = 0; c < courseCount; c++) {
      const y = y0 + c * .75;
      const z = edge - .55;
      const x = edge - .55;
      for (let v = -edge + .55; v <= edge - .55; v += 1.25) {
        const variation = (Math.random() - .5) * .14;
        addBlock(v, y, z, 1.25 + variation, .74, 1.1, (Math.random() - .5) * .025, Math.random() * .12);
        addBlock(v, y, -z, 1.25 + variation, .74, 1.1, (Math.random() - .5) * .025, Math.random() * .12);
        addBlock(x, y, v, 1.1, .74, 1.25 + variation, (Math.random() - .5) * .025, Math.random() * .12);
        addBlock(-x, y, v, 1.1, .74, 1.25 + variation, (Math.random() - .5) * .025, Math.random() * .12);
      }
    }
  }
  const wallMesh = new THREE.InstancedMesh(stoneGeo, stoneMat, blocks.length);
  wallMesh.castShadow = wallMesh.receiveShadow = true;
  const dummy = new THREE.Object3D(); const color = new THREE.Color();
  blocks.forEach((b, i) => { dummy.position.set(b.x, b.y, b.z); dummy.rotation.y = b.rot; dummy.scale.set(b.sx, b.sy, b.sz); dummy.updateMatrix(); wallMesh.setMatrixAt(i, dummy.matrix); color.set('#a99d83').offsetHSL(0, 0, b.tint - .05); wallMesh.setColorAt(i, color); });
  wallMesh.instanceMatrix.needsUpdate = true; group.add(wallMesh);

  // Cabezas clavas: cuerpo pétreo y nariz en dos lotes instanciados para ahorrar draw calls.
  const heads = [];
  const perSide = 16;
  for (let i = 0; i < perSide; i++) {
    const u = -12.3 + i * (24.6 / (perSide - 1));
    heads.push({ x: u, z: 13.05, r: Math.PI, hue: Math.random() * .04 - .02 });
    heads.push({ x: u, z: -13.05, r: 0, hue: Math.random() * .04 - .02 });
    if (i > 0 && i < perSide - 1) {
      heads.push({ x: 13.05, z: u, r: -Math.PI / 2, hue: Math.random() * .04 - .02 });
      heads.push({ x: -13.05, z: u, r: Math.PI / 2, hue: Math.random() * .04 - .02 });
    }
  }
  const headMat = new THREE.MeshStandardMaterial({ color: '#b5aa91', roughness: .88 });
  const headGeo = new THREE.SphereGeometry(.48, 10, 8); headGeo.scale(1, .78, .72);
  const noseGeo = new THREE.BoxGeometry(.24, .2, .24);
  const headMesh = new THREE.InstancedMesh(headGeo, headMat, heads.length);
  const noseMesh = new THREE.InstancedMesh(noseGeo, headMat, heads.length);
  headMesh.castShadow = noseMesh.castShadow = true;
  heads.forEach((h, i) => {
    dummy.position.set(h.x, -.66 + (i % 3) * .06, h.z); dummy.rotation.set((Math.random() - .5) * .08, h.r, (Math.random() - .5) * .08); dummy.scale.set(1 + Math.random() * .12, 1, 1); dummy.updateMatrix(); headMesh.setMatrixAt(i, dummy.matrix);
    color.set('#aa9c80').offsetHSL(h.hue, 0, (Math.random() - .5) * .12); headMesh.setColorAt(i, color);
    dummy.position.set(h.x, -.68 + (i % 3) * .06, h.z); dummy.rotation.set(0, h.r, 0); dummy.updateMatrix(); noseMesh.setMatrixAt(i, dummy.matrix); noseMesh.setColorAt(i, color);
  });
  headMesh.instanceMatrix.needsUpdate = noseMesh.instanceMatrix.needsUpdate = true;
  group.add(headMesh, noseMesh);

  // Piso central y zanja perimetral hundida de drenaje.
  const floorMat = new THREE.MeshStandardMaterial({ color: '#817763', roughness: 1 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(24.2, .3, 24.2), floorMat); floor.position.set(0, -5.05, 0); floor.receiveShadow = true; group.add(floor);
  const trenchMat = new THREE.MeshStandardMaterial({ color: '#393b35', roughness: .75 });
  const trenchParts = [[0,-4.86,12.2,24.5,.12,.7],[0,-4.86,-12.2,24.5,.12,.7],[12.2,-4.86,0,.7,.12,24.5],[-12.2,-4.86,0,.7,.12,24.5]];
  trenchParts.forEach(([x,y,z,sx,sy,sz])=>{const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),trenchMat);m.position.set(x,y,z);group.add(m);});
  const tileGeo = new THREE.BoxGeometry(1.35, .12, 1.15);
  const tileMat = new THREE.MeshStandardMaterial({ color: '#958b75', roughness: 1 });
  const tiles = [];
  for (let x=-11.5;x<=11.5;x+=1.48) for(let z=-11.4;z<=11.4;z+=1.38) tiles.push([x,z]);
  const paving = new THREE.InstancedMesh(tileGeo,tileMat,tiles.length); paving.receiveShadow=true;
  tiles.forEach(([x,z],i)=>{dummy.position.set(x,-4.82,z);dummy.rotation.y=(Math.random()-.5)*.1;dummy.scale.set(.8+Math.random()*.35,1,.8+Math.random()*.35);dummy.updateMatrix();paving.setMatrixAt(i,dummy.matrix);color.set('#8f846d').offsetHSL(0,0,(Math.random()-.5)*.18);paving.setColorAt(i,color);});
  paving.instanceMatrix.needsUpdate=true;group.add(paving);

  // Doble escalinata de acceso al norte, con doce peldaños por tramo.
  const stepGeo = new THREE.BoxGeometry(3.5, .45, 1.05);
  const stepMat = new THREE.MeshStandardMaterial({ color:'#a99e86', roughness:.95 });
  const steps = new THREE.InstancedMesh(stepGeo,stepMat,24); steps.castShadow=steps.receiveShadow=true;
  let si=0;
  for(const x of [-3.2,3.2]) for(let i=0;i<12;i++) { dummy.position.set(x,-.22-i*.41,17.3-i*.72);dummy.updateMatrix();steps.setMatrixAt(si++,dummy.matrix); }
  steps.instanceMatrix.needsUpdate=true;group.add(steps);
  const stairSideGeo = new THREE.BoxGeometry(.6,2.7,9.8);
  for(const x of [-5.2,5.2]){const side=new THREE.Mesh(stairSideGeo,stepMat);side.position.set(x,-2.25,13.2);side.rotation.x=-.36;side.castShadow=true;group.add(side);}

  // Monolito antropomorfo central y dos estelas menores laterales.
  const andesite = new THREE.MeshStandardMaterial({ color:'#756d5c', roughness:.93 });
  const relief = new THREE.MeshStandardMaterial({ color:'#918571', roughness:.9 });
  const ponce = new THREE.Group(); ponce.name='monolito-ponce'; ponce.position.y=-4.75;
  const pieces = [
    [new THREE.BoxGeometry(1.8,.35,1.3),0,.2,0], [new THREE.CylinderGeometry(.72,.85,.5,8),0,.62,0],
    [new THREE.BoxGeometry(1.2,2.25,.8),0,1.95,0], [new THREE.BoxGeometry(1.35,1,.95),0,3.5,0],
    [new THREE.BoxGeometry(.35,.55,.45),-.76,2.1,.02], [new THREE.BoxGeometry(.35,.55,.45),.76,2.1,.02],
    [new THREE.BoxGeometry(.28,.28,.22),0,3.58,.58], [new THREE.BoxGeometry(.3,.2,.2),-.28,3.78,.48], [new THREE.BoxGeometry(.3,.2,.2),.28,3.78,.48]
  ];
  pieces.forEach(([geo,x,y,z],i)=>{const mesh=new THREE.Mesh(geo,i<4?andesite:relief);mesh.position.set(x,y,z);mesh.castShadow=true;ponce.add(mesh);});
  for(let y=1.15;y<3.05;y+=.48){const bar=new THREE.Mesh(new THREE.BoxGeometry(.18,.18,.91),relief);bar.position.set(0,y,.48);ponce.add(bar);}
  group.add(ponce);
  for(const x of [-5.5,5.5]){const stele=new THREE.Group();stele.position.set(x,-4.75,0);const body=new THREE.Mesh(new THREE.BoxGeometry(.85,2.5,.55),andesite);body.position.y=1.25;body.castShadow=true;stele.add(body);const cap=new THREE.Mesh(new THREE.BoxGeometry(.95,.55,.62),relief);cap.position.y=2.65;stele.add(cap);group.add(stele);}
  group.userData.infoKey='templo';
  return group;
}
