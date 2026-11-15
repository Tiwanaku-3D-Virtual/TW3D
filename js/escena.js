import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { createTerrain } from './ambiente.js';

export function createScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#3d2a1d');

  // Sin niebla artificial para máxima nitidez del horizonte y visión nocturna limpia
  scene.fog = null;

  const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 700);
  camera.position.set(112, 95, 125);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  container.appendChild(renderer.domElement);

  // Controles de órbita con inercia cinematográfica y encuadre elevado hacia el horizonte
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 2.5, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 10;
  controls.maxDistance = 220;
  controls.maxPolarAngle = Math.PI * 0.47;

  // Iluminación hemisférica sutil
  const hemi = new THREE.HemisphereLight(0xe89e5a, 0x3a2818, 0.55);
  hemi.name = 'luz-hemisferica';
  scene.add(hemi);

  // Luz solar direccional principal optimizada (1024x1024 para fluidez en cualquier GPU)
  const sun = new THREE.DirectionalLight(0xffbe73, 3.0);
  sun.name = 'luz-solar-principal';
  sun.position.set(-48, 18, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -110;
  sun.shadow.camera.right = 110;
  sun.shadow.camera.top = 110;
  sun.shadow.camera.bottom = -110;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 350;
  sun.shadow.normalBias = 0.025;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  // Terreno topográfico auténtico desde suelo.glb
  const ground = createTerrain();
  scene.add(ground);

  // OutlinePass para siluetas de monumentos seleccionados
  const outlinePass = new OutlinePass(new THREE.Vector2(innerWidth, innerHeight), scene, camera);
  outlinePass.enabled = false;
  outlinePass.edgeStrength = 4.5;
  outlinePass.edgeGlow = 1.0;
  outlinePass.edgeThickness = 2.0;
  outlinePass.pulsePeriod = 2.6;
  outlinePass.visibleEdgeColor.set('#ffd54f');
  outlinePass.hiddenEdgeColor.set('#6d4c00');

  const resize = () => {
    const w = innerWidth, h = innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    if (outlinePass) outlinePass.resolution.set(w, h);
  };
  addEventListener('resize', resize);

  return { scene, camera, renderer, controls, sun, ground, outlinePass };
}
