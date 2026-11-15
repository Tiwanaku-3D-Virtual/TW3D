import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Topografía del altiplano: ondulación suave hacia los cerros exteriores
export function terrainHeight(x, z) {
  const edge = Math.max(Math.abs(x) - 68, Math.abs(z) - 52);
  const t = THREE.MathUtils.clamp(edge / 24, 0, 1);
  const fade = t * t * (3 - 2 * t);
  const waves =
    Math.sin(x * 0.045 + z * 0.018) * 0.42 +
    Math.cos(z * 0.052 - x * 0.012) * 0.28 +
    Math.sin((x + z) * 0.11) * 0.11;
  return waves * fade;
}

// Referencia global al mesh del terreno para trazado vertical con Raycaster
let globalGroundMesh = null;
const terrainReadyCallbacks = [];

export function onTerrainReady(callback) {
  if (globalGroundMesh) {
    callback(globalGroundMesh);
  } else {
    terrainReadyCallbacks.push(callback);
  }
}

/**
 * Terreno auténtico desde assets/models/suelo.glb con recorte del patio hundido,
 * normalMap 2K con tiling aumentado (40, 40) para textura en los cerros y shader procedural
 * de senderos sutiles sin tonos blancos ni grises.
 */
export function createTerrain() {
  const ground = new THREE.Group();
  ground.name = 'terreno-altiplanico';

  const textureLoader = new THREE.TextureLoader();

  // Textura difusa de suelo altiplánico con tiling (40, 40)
  const groundTexture = textureLoader.load('assets/textures/GroundDirtRocky020_COL_2K.jpg');
  groundTexture.colorSpace = THREE.SRGBColorSpace;
  groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(40, 40);

  // Mapa de normales para relieve granulado en cerros y colinas lejanas
  const groundNormal = textureLoader.load('assets/textures/GroundDirtWeedsPatchy004/GroundDirtWeedsPatchy004_NRM_2K.jpg');
  groundNormal.wrapS = groundNormal.wrapT = THREE.RepeatWrapping;
  groundNormal.repeat.set(40, 40);

  const material = new THREE.MeshStandardMaterial({
    map: groundTexture,
    normalMap: groundNormal,
    normalScale: new THREE.Vector2(1.6, 1.6),
    color: 0x8a7052,
    roughness: 0.94,
    metalness: 0.01
  });

  // Shader procedural: caminos sutiles de tierra compacta cálida (vec3(0.32, 0.24, 0.16)) sobre tierra base (vec3(0.23, 0.17, 0.11))
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
       varying vec3 vWorldPosition;`
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      `#include <worldpos_vertex>
       vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
       varying vec3 vWorldPosition;

       float lineDist(vec2 p, vec2 a, vec2 b) {
         vec2 pa = p - a, ba = b - a;
         float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
         return length(pa - ba * h);
       }`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#ifdef USE_MAP
         // Muestreo con ligero anti-tiling por mezcla UV
         vec2 uvA = vMapUv;
         vec2 uvB = vMapUv * 1.37 + vec2(0.31, 0.47);
         float nNoise = sin(vWorldPosition.x * 0.08) * cos(vWorldPosition.z * 0.08) * 0.5 + 0.5;
         vec4 texA = texture2D(map, uvA);
         vec4 texB = texture2D(map, uvB);
         vec4 blendedMap = mix(texA, texB, nNoise * 0.45 + 0.25);

         // Tierra base árida altiplánica profunda: tonos orgánicos oscuros y cálidos
         vec3 baseTone = vec3(0.23, 0.17, 0.11);
         float macroVar = sin(vWorldPosition.x * 0.022 + 1.2) * cos(vWorldPosition.z * 0.022) * 0.5 + 0.5;
         vec3 baseSoil = blendedMap.rgb * mix(baseTone, baseTone * 1.25, macroVar);

         // Senderos sutiles hacia accesos: tierra compacta cálida (vec3(0.32, 0.24, 0.16)) SIN BLANCO
         vec2 p = vWorldPosition.xz;
         float dPath = 999.0;
         dPath = min(dPath, lineDist(p, vec2(0.0, 13.5), vec2(0.0, 58.0)));     // Sur Templete
         dPath = min(dPath, lineDist(p, vec2(0.0, 0.0), vec2(-42.0, -3.0)));    // Templete a Kalasasaya
         dPath = min(dPath, lineDist(p, vec2(-42.0, -3.0), vec2(0.0, -24.0)));  // Kalasasaya a Puerta del Sol
         dPath = min(dPath, lineDist(p, vec2(0.0, 14.0), vec2(-45.0, 34.0)));   // A Pirámide Akapana
         dPath = min(dPath, lineDist(p, vec2(0.0, 14.0), vec2(43.0, 31.0)));    // A Puma Punku
         dPath = min(dPath, lineDist(p, vec2(0.0, 14.0), vec2(0.0, 43.0)));     // A Kheri Kala
         dPath = min(dPath, lineDist(p, vec2(-22.0, -3.0), vec2(28.0, -5.0)));  // Kalasasaya a Chachapuma

         // Bordes ruidosos naturales para evitar líneas rectas artificiales
         float edgeNoise = sin(vWorldPosition.x * 0.45) * cos(vWorldPosition.z * 0.45) * 0.35;
         float pathFactor = 1.0 - smoothstep(0.8 + edgeNoise, 2.6 + edgeNoise, dPath);
         pathFactor = clamp(pathFactor, 0.0, 1.0);

         vec3 pathSoil = blendedMap.rgb * vec3(0.32, 0.24, 0.16);
         vec3 finalColor = mix(baseSoil, pathSoil, pathFactor * 0.65);

         diffuseColor = vec4(finalColor, 1.0);
       #endif`
    );
  };

  const loader = new GLTFLoader();
  loader.load(
    'assets/models/suelo.glb',
    (gltf) => {
      let groundMesh = null;
      gltf.scene.traverse((child) => {
        if (child.isMesh && !groundMesh) {
          groundMesh = child;
        }
      });

      if (groundMesh) {
        const geo = groundMesh.geometry;
        const pos = geo.attributes.position;
        const index = geo.index;

        // Recorte geométrico del patio hundido del Templete Semisubterráneo y de la escalinata sur
        if (index) {
          const newIndices = [];
          const isInsideTempleteHole = (x, z) => {
            // Patio central hundido
            if (Math.abs(x) < 14.4 && Math.abs(z) < 14.4) return true;
            // Vano y peldaños de la escalinata sur que suben hacia el exterior
            if (Math.abs(x) < 3.4 && z >= 11.0 && z <= 17.5) return true;
            return false;
          };

          for (let i = 0; i < index.count; i += 3) {
            const a = index.getX(i);
            const b = index.getX(i + 1);
            const c = index.getX(i + 2);
            const ax = pos.getX(a), az = pos.getZ(a);
            const bx = pos.getX(b), bz = pos.getZ(b);
            const cx = pos.getX(c), cz = pos.getZ(c);

            const midX = (ax + bx + cx) / 3.0;
            const midZ = (az + bz + cz) / 3.0;

            const inPatio =
              isInsideTempleteHole(midX, midZ) ||
              (isInsideTempleteHole(ax, az) && isInsideTempleteHole(bx, bz)) ||
              (isInsideTempleteHole(ax, az) && isInsideTempleteHole(cx, cz)) ||
              (isInsideTempleteHole(bx, bz) && isInsideTempleteHole(cx, cz));

            if (!inPatio) {
              newIndices.push(a, b, c);
            }
          }
          geo.setIndex(newIndices);
        }

        groundMesh.material = material;
        groundMesh.position.set(0, 0, 0);
        groundMesh.receiveShadow = true;
        groundMesh.name = 'malla-suelo-topografia';
        ground.add(groundMesh);

        globalGroundMesh = groundMesh;
        terrainReadyCallbacks.forEach((cb) => cb(groundMesh));
        terrainReadyCallbacks.length = 0;
      }
    },
    undefined,
    (err) => {
      console.warn('Error al cargar suelo.glb, usando respaldo procedural:', err);
      const fallback = createFallbackTerrainPatch(material);
      ground.add(fallback);
      globalGroundMesh = fallback;
      terrainReadyCallbacks.forEach((cb) => cb(fallback));
      terrainReadyCallbacks.length = 0;
    }
  );

  return ground;
}

function createFallbackTerrainPatch(mat) {
  const geo = new THREE.PlaneGeometry(400, 400, 80, 80);
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

const skyPaths = [
  'assets/textures/amanecer.webp',          // Modo 0: Ocaso / Atardecer
  'assets/textures/cielos.webp',            // Modo 1: Día
  'assets/textures/cold-night-equirect.webp' // Modo 2: Noche
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
    img.onerror = () => {
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

/**
 * Exclusiones: ninguna mata de paja brava dentro del complejo amurallado
 * ni dentro de templos o plataformas.
 */
function isExcludedZone(x, z) {
  // Radio mínimo de 30 unidades desde el centro
  if (Math.hypot(x, z) < 30) return true;
  // Templete Semisubterráneo
  if (Math.abs(x) < 22 && Math.abs(z) < 22) return true;
  // Kalasasaya
  if (x > -72 && x < -16 && z > -24 && z < 18) return true;
  // Pirámide de Akapana
  if (x > -72 && x < -20 && z > 10 && z < 60) return true;
  // Puma Punku
  if (x > 24 && x < 64 && z > 10 && z < 52) return true;
  // Puerta del Sol
  if (x > -10 && x < 10 && z > -36 && z < -14) return true;
  // Puerta de la Luna
  if (x > 14 && x < 30 && z > -32 && z < -16) return true;
  // Kheri Kala
  if (x > -16 && x < 16 && z > 32 && z < 56) return true;
  // Chachapuma
  if (x > 22 && x < 34 && z > -11 && z < 1) return true;
  // Senderos de acceso
  if (Math.abs(x) < 4.0 && z >= 12 && z <= 60) return true;
  // Eje de muros perimetrales
  if ((Math.abs(x) > 42 && Math.abs(x) < 56) || (Math.abs(z) > 42 && Math.abs(z) < 56)) return true;
  return false;
}

/**
 * Distribución de Paja Brava (ichu.glb) utilizando la malla realista detallada (Master_Ichu_Geo, 1400 vértices),
 * normalizada y apoyada con Raycaster sobre el relieve del terreno.
 */
async function createInstancedIchu(scene) {
  const loader = new GLTFLoader();
  const dummy = new THREE.Object3D();

  let seed = 48291;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  try {
    const ichuGltf = await loader.loadAsync('assets/models/ichu.glb');
    let sourceMesh = null;
    ichuGltf.scene.traverse((c) => {
      // Buscar la malla de alta fidelidad con briznas reales (Master_Ichu_Geo / Master_Ichu_Geo.001)
      // evitando expresamente el cono low-poly de 12 vértices (Master_Ichu)
      if (c.isMesh && (c.name.includes('Geo') || c.geometry?.attributes?.position?.count > 100)) {
        if (!sourceMesh) sourceMesh = c;
      }
    });

    if (!sourceMesh) return;

    // Normalizar la escala para que cada mata tenga altura base 1.0 (se escalará a 0.75 - 1.25)
    const ichuGeo = sourceMesh.geometry.clone();
    ichuGeo.computeBoundingBox();
    const box = ichuGeo.boundingBox;
    const bHeight = box.max.y - box.min.y;
    if (bHeight > 0.001) {
      const scaleNorm = 1.0 / bHeight;
      ichuGeo.scale(scaleNorm, scaleNorm, scaleNorm);
    }
    ichuGeo.computeBoundingBox();
    const bCenter = new THREE.Vector3();
    ichuGeo.boundingBox.getCenter(bCenter);
    // Base firmemente asentada en y = 0
    ichuGeo.translate(-bCenter.x, -ichuGeo.boundingBox.min.y, -bCenter.z);

    // Material PBR doble cara para vegetación con respuesta natural a la luz
    const ichuMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Modulado por instancia mediante setColorAt
      roughness: 0.88,
      metalness: 0.0,
      side: THREE.DoubleSide
    });

    // Variaciones cromáticas auténticas de paja brava andina
    const ichuTones = [
      new THREE.Color(0xa48d52), // Paja dorada madura
      new THREE.Color(0x957f46), // Tono ocre seco
      new THREE.Color(0xb29a5a), // Paja expuesta al sol
      new THREE.Color(0x8a773e), // Ocre oscuro
      new THREE.Color(0x9d894b)  // Paja brava estándar
    ];

    const ichuCount = 420;
    const ichuInstanced = new THREE.InstancedMesh(ichuGeo, ichuMat, ichuCount);
    ichuInstanced.castShadow = true;
    ichuInstanced.receiveShadow = true;
    ichuInstanced.name = 'ichu-instanciado-glb';

    // Generar racimos orgánicos fuera del complejo amurallado (radio > 30)
    const clusterCenters = [];
    let attempts = 0;
    while (clusterCenters.length < 26 && attempts < 1500) {
      attempts++;
      const angle = rand() * Math.PI * 2;
      const r = 32 + rand() * 125;
      const cx = Math.cos(angle) * r;
      const cz = Math.sin(angle) * r;
      if (!isExcludedZone(cx, cz) && Math.hypot(cx, cz) > 30) {
        clusterCenters.push({ x: cx, z: cz, spread: 4.5 + rand() * 7.5 });
      }
    }

    const positions = [];
    attempts = 0;
    while (positions.length < ichuCount && attempts < 7000) {
      attempts++;
      const c = clusterCenters[Math.floor(rand() * clusterCenters.length)] || { x: 0, z: 70, spread: 8 };
      const angle = rand() * Math.PI * 2;
      const dist = rand() * c.spread;
      const px = c.x + Math.cos(angle) * dist;
      const pz = c.z + Math.sin(angle) * dist;
      if (!isExcludedZone(px, pz) && Math.hypot(px, pz) > 30) {
        positions.push({ x: px, z: pz });
      }
    }

    // Raycaster vertical hacia abajo sobre el suelo
    const raycaster = new THREE.Raycaster();
    const rayDown = new THREE.Vector3(0, -1, 0);

    function placeInstances(targetGround) {
      positions.forEach((p, i) => {
        let groundY = terrainHeight(p.x, p.z);
        if (targetGround) {
          raycaster.set(new THREE.Vector3(p.x, 60, p.z), rayDown);
          raycaster.far = 120;
          const hits = raycaster.intersectObject(targetGround, false);
          if (hits.length > 0) {
            groundY = hits[0].point.y;
          }
        }

        // Apoyada exactamente sobre el relieve de la tierra
        const finalY = groundY - 0.04;
        dummy.position.set(p.x, finalY, p.z);
        dummy.rotation.set(0, rand() * Math.PI * 2, 0);

        // Altura visible y natural de 0.75 a 1.25 unidades
        const s = 0.75 + rand() * 0.50;
        dummy.scale.set(s * (0.85 + rand() * 0.3), s, s * (0.85 + rand() * 0.3));
        dummy.updateMatrix();
        ichuInstanced.setMatrixAt(i, dummy.matrix);

        // Tonalidad natural por mata
        const tone = ichuTones[Math.floor(rand() * ichuTones.length)];
        ichuInstanced.setColorAt(i, tone);
      });
      ichuInstanced.instanceMatrix.needsUpdate = true;
      if (ichuInstanced.instanceColor) ichuInstanced.instanceColor.needsUpdate = true;
      scene.add(ichuInstanced);
    }

    onTerrainReady((mesh) => {
      placeInstances(mesh);
    });
  } catch (err) {
    console.warn('No se pudo instanciar ichu.glb:', err);
  }
}

/**
 * Relleno natural del campo exterior mediante rocas de piedra andesita (piedra_G.glb),
 * normalizadas con base en el suelo y distribuidas con Raycaster para evitar que floten.
 */
async function createInstancedRocks(scene) {
  const loader = new GLTFLoader();
  const dummy = new THREE.Object3D();

  let seed = 73918;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  try {
    const rockGltf = await loader.loadAsync('assets/models/piedra_G.glb');
    let rockMesh = null;
    rockGltf.scene.traverse((c) => {
      if (c.isMesh && !rockMesh) rockMesh = c;
    });

    if (!rockMesh) return;

    // Normalizar la geometría: centrar X/Z, apoyar la base en y = 0 y normalizar tamaño unitario
    const rockGeo = rockMesh.geometry.clone();
    rockGeo.computeBoundingBox();
    const box = rockGeo.boundingBox;
    const center = new THREE.Vector3();
    box.getCenter(center);
    rockGeo.translate(-center.x, -box.min.y, -center.z);

    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0.001) {
      const norm = 1.0 / maxDim;
      rockGeo.scale(norm, norm, norm);
    }

    // Material de roca andesita / arenisca rugosa altiplánica
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.90,
      metalness: 0.05
    });

    // Variaciones de color de roca andina
    const rockTones = [
      new THREE.Color(0x56473b), // Andesita grisácea oscura
      new THREE.Color(0x624b3c), // Arenisca rojiza
      new THREE.Color(0x4d3e33), // Roca volcánica oscura
      new THREE.Color(0x5d4e41), // Tierra arcillosa
      new THREE.Color(0x6a5647)  // Ocre arenisca
    ];

    const rockCount = 140;
    const rockInstanced = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
    rockInstanced.castShadow = true;
    rockInstanced.receiveShadow = true;
    rockInstanced.name = 'piedras-G-instanciadas';

    // Puntos de racimo dispersos por el paisaje exterior
    const clusterCenters = [];
    let attempts = 0;
    while (clusterCenters.length < 20 && attempts < 1200) {
      attempts++;
      const angle = rand() * Math.PI * 2;
      const r = 34 + rand() * 130;
      const cx = Math.cos(angle) * r;
      const cz = Math.sin(angle) * r;
      if (!isExcludedZone(cx, cz) && Math.hypot(cx, cz) > 30) {
        clusterCenters.push({ x: cx, z: cz, spread: 6.0 + rand() * 12.0 });
      }
    }

    const positions = [];
    attempts = 0;
    while (positions.length < rockCount && attempts < 6000) {
      attempts++;
      const c = clusterCenters[Math.floor(rand() * clusterCenters.length)] || { x: 0, z: 75, spread: 10 };
      const angle = rand() * Math.PI * 2;
      const dist = rand() * c.spread;
      const px = c.x + Math.cos(angle) * dist;
      const pz = c.z + Math.sin(angle) * dist;
      if (!isExcludedZone(px, pz) && Math.hypot(px, pz) > 30) {
        positions.push({ x: px, z: pz });
      }
    }

    const raycaster = new THREE.Raycaster();
    const rayDown = new THREE.Vector3(0, -1, 0);

    function placeRocks(targetGround) {
      positions.forEach((p, i) => {
        let groundY = terrainHeight(p.x, p.z);
        if (targetGround) {
          raycaster.set(new THREE.Vector3(p.x, 60, p.z), rayDown);
          raycaster.far = 120;
          const hits = raycaster.intersectObject(targetGround, false);
          if (hits.length > 0) {
            groundY = hits[0].point.y;
          }
        }

        // Hundir ligeramente (10 a 14 cm) para que la roca asiente sólidamente en el terreno sin flotar
        const finalY = groundY - 0.12;
        dummy.position.set(p.x, finalY, p.z);
        // Rotación Y orgánica con leve inclinación en X/Z según terreno
        dummy.rotation.set((rand() - 0.5) * 0.12, rand() * Math.PI * 2, (rand() - 0.5) * 0.12);

        // Tamaño de bloque de 0.9 a 2.3 metros, con ligero achatamiento vertical
        const baseSize = 0.90 + rand() * 1.40;
        const sy = baseSize * (0.68 + rand() * 0.28);
        const sx = baseSize * (0.85 + rand() * 0.30);
        const sz = baseSize * (0.85 + rand() * 0.30);
        dummy.scale.set(sx, sy, sz);

        dummy.updateMatrix();
        rockInstanced.setMatrixAt(i, dummy.matrix);

        const tone = rockTones[Math.floor(rand() * rockTones.length)];
        rockInstanced.setColorAt(i, tone);
      });
      rockInstanced.instanceMatrix.needsUpdate = true;
      if (rockInstanced.instanceColor) rockInstanced.instanceColor.needsUpdate = true;
      scene.add(rockInstanced);
    }

    onTerrainReady((mesh) => {
      placeRocks(mesh);
    });
  } catch (err) {
    console.warn('No se pudo instanciar piedra_G.glb:', err);
  }
}

export function createAmbiente(scene, sun, onChange = () => {}) {
  const skyTextures = [null, null, null];
  const stars = createStars(scene);
  createInstancedIchu(scene);
  createInstancedRocks(scene);
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
      scene.environmentIntensity = [0.42, 0.38, 0.28][targetMode];
      onChange();
    } else {
      getOrLoadSkyTexture(targetMode).then((tex) => {
        if (mode === targetMode) {
          scene.background = tex;
          scene.environment = tex;
          scene.environmentIntensity = [0.42, 0.38, 0.28][targetMode];
          onChange();
        }
      });
    }
  };

  const setTime = (value) => {
    mode = ((value % 3) + 3) % 3;
    applySky(mode);

    // Sin niebla artificial para evitar velos difusos de lejos y de noche
    scene.fog = null;

    // Configuración solar y lunar
    if (mode === 0) {
      // Ocaso
      sun.color.set('#ffbe73');
      sun.intensity = 3.0;
      sun.position.set(-48, 18, 30);
      stars.material.opacity = 0;
    } else if (mode === 1) {
      // Día
      sun.color.set('#fff3df');
      sun.intensity = 2.8;
      sun.position.set(35, 65, 25);
      stars.material.opacity = 0;
    } else {
      // Noche visible con luz de luna
      sun.color.set('#8ab4f8');
      sun.intensity = 1.45;
      sun.position.set(-25, 45, -30);
      stars.material.opacity = 0.88;
    }

    onChange();
    return mode;
  };

  const update = () => {};

  // Modo inicial: Ocaso (0)
  setTime(0);

  return { setTime, update, get mode() { return mode; } };
}
