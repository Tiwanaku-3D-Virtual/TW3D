import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { createTerrain } from './ambiente.js';

export function createScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#a9b4ae');
  scene.fog = null;
  const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, .1, 700);
  camera.position.set(112, 95, 125);
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 3);
  controls.enableDamping = true;
  controls.dampingFactor = .06;
  controls.minDistance = 10;
  controls.maxDistance = 220;
  controls.maxPolarAngle = Math.PI * .47;
  scene.add(new THREE.HemisphereLight('#e4edf5', '#6e624f', 1.25));
  const sun = new THREE.DirectionalLight('#fff2d4', 2.15);
  sun.position.set(-35, 55, 24);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -130; sun.shadow.camera.right = 130;
  sun.shadow.camera.top = 130; sun.shadow.camera.bottom = -130;
  sun.shadow.normalBias = .03;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  const ground = createTerrain(); scene.add(ground);

  // Postprocesamiento: EffectComposer con RenderPass, OutlinePass para siluetas de modelos y FXAA
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const outlinePass = new OutlinePass(new THREE.Vector2(innerWidth, innerHeight), scene, camera);
  outlinePass.enabled = false;
  outlinePass.edgeStrength = 4.5;
  outlinePass.edgeGlow = 1.0;
  outlinePass.edgeThickness = 2.0;
  outlinePass.pulsePeriod = 2.6;
  outlinePass.visibleEdgeColor.set('#ffd54f');
  outlinePass.hiddenEdgeColor.set('#6d4c00');
  composer.addPass(outlinePass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  const fxaaPass = new ShaderPass(FXAAShader);
  const pr = renderer.getPixelRatio();
  fxaaPass.material.uniforms['resolution'].value.x = 1 / (innerWidth * pr);
  fxaaPass.material.uniforms['resolution'].value.y = 1 / (innerHeight * pr);
  composer.addPass(fxaaPass);

  const resize = () => {
    const w = innerWidth, h = innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    outlinePass.resolution.set(w, h);
    const pixelRatio = renderer.getPixelRatio();
    fxaaPass.material.uniforms['resolution'].value.x = 1 / (w * pixelRatio);
    fxaaPass.material.uniforms['resolution'].value.y = 1 / (h * pixelRatio);
  };
  addEventListener('resize', resize);
  return { scene, camera, renderer, controls, sun, ground, composer, outlinePass };
}
