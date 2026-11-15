import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/**
 * Shader Cinematográfico: Grano de película orgánico + Viñeta suave de lente + Color grading cálido
 */
const CinematicFilmShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0.0 },
    uGrainIntensity: { value: 0.025 },
    uVignetteDarkness: { value: 0.35 },
    uWarmth: { value: 0.07 },
    uContrast: { value: 1.05 }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGrainIntensity;
    uniform float uVignetteDarkness;
    uniform float uWarmth;
    uniform float uContrast;
    varying vec2 vUv;

    float random(vec2 p) {
      return fract(sin(dot(p.xy, vec2(12.9898, 78.233)) + fract(uTime * 3.5)) * 43758.5453);
    }

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 color = texel.rgb;

      // 1. Color Grading cálido en altas luces
      color.r += uWarmth * 0.75;
      color.g += uWarmth * 0.30;
      color.b -= uWarmth * 0.35;

      // 2. Contraste cinematográfico sutil
      color = (color - 0.5) * uContrast + 0.5;

      // 3. Viñeta suave de lente anamórfico en los bordes
      vec2 uv = (vUv - 0.5) * 2.0;
      float vig = clamp(1.0 - dot(uv, uv) * uVignetteDarkness * 0.42, 0.0, 1.0);
      color *= vig;

      // 4. Grano de película imperceptible (0.025)
      float grain = (random(vUv) - 0.5) * uGrainIntensity;
      color += vec3(grain);

      gl_FragColor = vec4(max(color, vec3(0.0)), texel.a);
    }
  `
};

export class CinematicUpgrade {
  /**
   * @param {Object} params
   * @param {THREE.Scene} params.scene
   * @param {THREE.PerspectiveCamera} params.camera
   * @param {THREE.WebGLRenderer} params.renderer
   * @param {Object} [params.controls] - OrbitControls
   * @param {Object} [params.outlinePass] - OutlinePass para siluetas
   * @param {Object} [params.torchSystem] - Sistema de antorchas ceremoniales
   * @param {boolean} [params.enableDoF=false]
   */
  constructor({ scene, camera, renderer, controls, outlinePass = null, torchSystem = null, enableDoF = false }) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.controls = controls;
    this.outlinePass = outlinePass;
    this.torchSystem = torchSystem;
    this.clock = new THREE.Clock();

    this.presets = {
      sunset: {
        label: '🌅 Ocaso',
        fogColor: 0x422a1c,
        sunColor: 0xffbe73,
        sunIntensity: 3.0,
        sunPosition: new THREE.Vector3(-48, 18, 30),
        ambientColor: 0x8a674e,
        ambientIntensity: 0.38,
        hemiSky: 0xe89e5a,
        hemiGround: 0x3a2818,
        hemiIntensity: 0.55,
        exposure: 1.15,
        warmth: 0.07,
        bloomStrength: 0.24
      },
      day: {
        label: '☀ Día',
        fogColor: 0x887b68,
        sunColor: 0xfff3df,
        sunIntensity: 2.8,
        sunPosition: new THREE.Vector3(35, 65, 25),
        ambientColor: 0x9ea6a2,
        ambientIntensity: 0.55,
        hemiSky: 0xdce5ec,
        hemiGround: 0x5a4d38,
        hemiIntensity: 0.70,
        exposure: 1.10,
        warmth: 0.02,
        bloomStrength: 0.18
      },
      night: {
        label: '🌙 Noche',
        fogColor: 0x090f1d,
        sunColor: 0x8ab4f8, // Luz de luna azul visible
        sunIntensity: 1.45,
        sunPosition: new THREE.Vector3(-25, 45, -30),
        ambientColor: 0x2b3d63, // Iluminación ambiental nocturna visible
        ambientIntensity: 0.70,
        hemiSky: 0x3b558c, // Cielo azul nocturno
        hemiGround: 0x1e1916,
        hemiIntensity: 1.05,
        exposure: 1.02,
        warmth: -0.02,
        bloomStrength: 0.35
      }
    };

    this.currentMode = 'sunset'; // Inicia en Ocaso

    this.initRenderer();
    this.initControls();
    this.initLightsAndFog();
    this.initPostProcessing(enableDoF);
    this.bindResize();
  }

  initRenderer() {
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  initControls() {
    if (!this.controls) return;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 2.5, 0);
    this.controls.rotateSpeed = 0.75;
    this.controls.zoomSpeed = 0.85;
    this.controls.maxPolarAngle = Math.PI * 0.47;
  }

  initLightsAndFog() {
    this.sunLight = null;
    this.ambientLight = null;
    this.hemiLight = null;

    this.scene.traverse((child) => {
      if (child.isDirectionalLight && !this.sunLight) {
        this.sunLight = child;
      } else if (child.isAmbientLight && !this.ambientLight) {
        this.ambientLight = child;
      } else if (child.isHemisphereLight && !this.hemiLight) {
        this.hemiLight = child;
      }
    });

    if (!this.sunLight) {
      this.sunLight = new THREE.DirectionalLight(0xffbe73, 3.0);
      this.sunLight.position.set(-48, 18, 30);
      this.scene.add(this.sunLight);
    }

    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 350;
    const d = 110;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.normalBias = 0.025;
    this.sunLight.shadow.bias = -0.0005;

    if (!this.ambientLight) {
      this.ambientLight = new THREE.AmbientLight(0x8a674e, 0.38);
      this.scene.add(this.ambientLight);
    }

    if (!this.hemiLight) {
      this.hemiLight = new THREE.HemisphereLight(0xe89e5a, 0x3a2818, 0.55);
      this.scene.add(this.hemiLight);
    }

    this.applyAtmosphere(this.currentMode);
  }

  initPostProcessing(enableDoF) {
    this.composer = new EffectComposer(this.renderer);

    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    if (this.outlinePass) {
      this.composer.addPass(this.outlinePass);
    }

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.24,
      0.40,
      0.85
    );
    this.composer.addPass(this.bloomPass);

    if (enableDoF) {
      this.bokehPass = new BokehPass(this.scene, this.camera, {
        focus: 28.0,
        aperture: 0.00012,
        maxblur: 0.004
      });
      this.composer.addPass(this.bokehPass);
    }

    this.filmShaderPass = new ShaderPass(CinematicFilmShader);
    this.composer.addPass(this.filmShaderPass);

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  /**
   * Aplica uno de los 3 modos: 'sunset' (Ocaso), 'day' (Día), 'night' (Noche)
   */
  applyAtmosphere(modeKey) {
    const preset = this.presets[modeKey] || this.presets.sunset;
    this.currentMode = modeKey;

    // Niebla solo en el horizonte lejano (near = 110, far = 280) para nitidez absoluta en el complejo
    if (this.scene.fog) {
      this.scene.fog.color.setHex(preset.fogColor);
      this.scene.fog.near = 110;
      this.scene.fog.far = 280;
    } else {
      this.scene.fog = new THREE.Fog(preset.fogColor, 110, 280);
    }

    if (this.sunLight) {
      this.sunLight.color.setHex(preset.sunColor);
      this.sunLight.intensity = preset.sunIntensity;
      this.sunLight.position.copy(preset.sunPosition);
    }

    if (this.ambientLight) {
      this.ambientLight.color.setHex(preset.ambientColor);
      this.ambientLight.intensity = preset.ambientIntensity;
    }
    if (this.hemiLight) {
      this.hemiLight.color.setHex(preset.hemiSky);
      this.hemiLight.groundColor.setHex(preset.hemiGround);
      this.hemiLight.intensity = preset.hemiIntensity;
    }

    this.renderer.toneMappingExposure = preset.exposure;
    if (this.bloomPass) {
      this.bloomPass.strength = preset.bloomStrength;
    }
    if (this.filmShaderPass) {
      this.filmShaderPass.uniforms.uWarmth.value = preset.warmth;
    }

    // Sincroniza el sistema de antorchas ceremoniales
    if (this.torchSystem) {
      this.torchSystem.setAtmosphere(modeKey);
    }

    return preset.label;
  }

  cycleAtmosphere() {
    const order = ['sunset', 'day', 'night'];
    const nextIndex = (order.indexOf(this.currentMode) + 1) % order.length;
    return this.applyAtmosphere(order[nextIndex]);
  }

  bindResize() {
    window.addEventListener('resize', () => {
      if (!this.composer) return;
      const w = window.innerWidth, h = window.innerHeight;
      this.composer.setSize(w, h);
      if (this.outlinePass) {
        this.outlinePass.resolution.set(w, h);
      }
    });
  }

  render() {
    const elapsed = this.clock.getElapsedTime();
    if (this.filmShaderPass) {
      this.filmShaderPass.uniforms.uTime.value = elapsed;
    }
    if (this.torchSystem) {
      this.torchSystem.update(elapsed);
    }
    this.composer.render();
  }
}
