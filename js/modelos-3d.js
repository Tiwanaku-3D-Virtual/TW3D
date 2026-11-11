import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Activa la caché interna de archivos de Three.js para acelerar recargas y reutilizar datos
THREE.Cache.enabled = true;

const loader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

const textureCache = new Map();

async function loadCachedTexture(path, textureRepeat = 1, isColor = false) {
  if (!path) return null;
  const key = `${path}?repeat=${textureRepeat}&color=${isColor}`;
  if (textureCache.has(key)) {
    return textureCache.get(key).clone();
  }
  const texture = await textureLoader.loadAsync(path);
  if (isColor) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }
  texture.flipY = false;
  if (textureRepeat > 1) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(textureRepeat, textureRepeat);
  } else {
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  }
  textureCache.set(key, texture);
  return texture.clone();
}

export async function loadLocalModel(path, {
  scale = 1,
  fitSize,
  center = true,
  albedoPath,
  normalPath,
  textureRepeat = 1,
  tint,
  tintMode = 'multiply',
  excludeNames = []
} = {}) {
  const [gltf, albedo, normal] = await Promise.all([
    loader.loadAsync(path),
    albedoPath ? loadCachedTexture(albedoPath, textureRepeat, true) : Promise.resolve(null),
    normalPath ? loadCachedTexture(normalPath, textureRepeat, false) : Promise.resolve(null)
  ]);
  const model = gltf.scene;

  // Elimina nodos excluidos antes de calcular cotas, escalado y centrado
  if (excludeNames?.length) {
    const wanted = new Set(excludeNames);
    const matches = [];
    model.traverse((object) => { if (wanted.has(object.name)) matches.push(object); });
    matches.forEach((object) => object.parent?.remove(object));
  }

  if (albedo) {
    albedo.colorSpace = THREE.SRGBColorSpace;
    albedo.flipY = false;
    albedo.wrapS = albedo.wrapT = textureRepeat > 1 ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
    albedo.repeat.set(textureRepeat, textureRepeat);
  }
  if (normal) {
    normal.wrapS = normal.wrapT = textureRepeat > 1 ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
    normal.repeat.set(textureRepeat, textureRepeat);
  }
  model.scale.setScalar(scale);
  model.updateWorldMatrix(true, true);

  let bounds = new THREE.Box3().setFromObject(model);
  if (fitSize) {
    const size = new THREE.Vector3();
    bounds.getSize(size);
    const largestSide = Math.max(size.x, size.y, size.z);
    if (largestSide > 0) model.scale.multiplyScalar(fitSize / largestSide);
    model.updateWorldMatrix(true, true);
    bounds = new THREE.Box3().setFromObject(model);
  }

  if (center) {
    const centerPoint = new THREE.Vector3();
    bounds.getCenter(centerPoint);
    model.position.x -= centerPoint.x;
    model.position.y -= bounds.min.y;
    model.position.z -= centerPoint.z;
  }
  model.updateWorldMatrix(true, true);

  model.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (!material) return;
      if (albedo) material.map = albedo;
      if (normal) material.normalMap = normal;
      if (normal && material.normalScale) material.normalScale.set(1.1, 1.1);
      if (tint && material.color) {
        if (tintMode === 'replace') material.color.set(tint);
        else material.color.multiply(new THREE.Color(tint));
      }
      if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
      if ('roughness' in material && !material.roughnessMap) {
        material.roughness = Math.max(material.roughness ?? 0, .78);
      }
      if ('metalness' in material && !material.metalnessMap) {
        material.metalness = Math.min(material.metalness ?? 0, .04);
      }
      material.needsUpdate = true;
    });
  });

  const root = new THREE.Group();
  root.name = model.name || 'modelo-3d-local';
  root.add(model);
  return root;
}
