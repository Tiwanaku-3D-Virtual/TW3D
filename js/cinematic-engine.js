import * as THREE from 'three';

export class CinematicUpgrade {
  /**
   * @param {Object} params
   * @param {THREE.Scene} params.scene
   * @param {THREE.PerspectiveCamera} params.camera
   * @param {THREE.WebGLRenderer} params.renderer
   * @param {Object} [params.controls] - OrbitControls
   * @param {Object} [params.torchSystem] - Sistema de antorchas ceremoniales
   */
  constructor({ scene, camera, renderer, controls, torchSystem = null }) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.controls = controls;
    this.torchSystem = torchSystem;
    this.clock = new THREE.Clock();

    this.presets = {
      sunset: {
        label: '🌅 Ocaso',
        sunColor: 0xffbe73,
        sunIntensity: 3.0,
        sunPosition: new THREE.Vector3(-48, 18, 30),
        ambientColor: 0x8a674e,
        ambientIntensity: 0.38,
        hemiSky: 0xe89e5a,
        hemiGround: 0x3a2818,
        hemiIntensity: 0.55,
        exposure: 1.15
      },
      day: {
        label: '☀ Día',
        sunColor: 0xfff3df,
        sunIntensity: 2.8,
        sunPosition: new THREE.Vector3(35, 65, 25),
        ambientColor: 0x9ea6a2,
        ambientIntensity: 0.55,
        hemiSky: 0xdce5ec,
        hemiGround: 0x5a4d38,
        hemiIntensity: 0.70,
        exposure: 1.10
      },
      night: {
        label: '🌙 Noche',
        sunColor: 0x8ab4f8, // Luz de luna azul visible
        sunIntensity: 1.45,
        sunPosition: new THREE.Vector3(-25, 45, -30),
        ambientColor: 0x2b3d63, // Iluminación ambiental nocturna visible
        ambientIntensity: 0.70,
        hemiSky: 0x3b558c, // Cielo azul nocturno
        hemiGround: 0x1e1916,
        hemiIntensity: 1.05,
        exposure: 1.02
      }
    };

    this.currentMode = 'sunset'; // Inicia en Ocaso

    this.initRenderer();
    this.initControls();
    this.initLightsAndAtmosphere();
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

  initLightsAndAtmosphere() {
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

  /**
   * Aplica uno de los 3 modos: 'sunset' (Ocaso), 'day' (Día), 'night' (Noche)
   */
  applyAtmosphere(modeKey) {
    const preset = this.presets[modeKey] || this.presets.sunset;
    this.currentMode = modeKey;

    // Sin niebla artificial para evitar manchas o velos falsos de lejos y de noche
    this.scene.fog = null;

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

  render() {
    const elapsed = this.clock.getElapsedTime();
    if (this.torchSystem) {
      this.torchSystem.update(elapsed);
    }
    this.renderer.render(this.scene, this.camera);
  }
}
