import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { configureDRACO } from './modelos-3d.js';

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

  const loader = configureDRACO(new GLTFLoader());
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

export function createAmbiente(scene, sun, onChange = () => {}) {
  const skyTextures = [null, null, null];
  const stars = createStars(scene);
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
