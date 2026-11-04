import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

/**
 * Inicializa y configura el núcleo del entorno 3D (Escena, Cámara, Renderizador, Luces y Partículas).
 * @param {HTMLElement} container - Elemento contenedor del canvas WebGL.
 */
export function createScene(container) {
    // 1. Escena principal
    const scene = new THREE.Scene();

    // HDRI equirectangular: sirve como fondo visible y como iluminación ambiental.
    let hdrEnvironment = null;
    const hdrReady = new RGBELoader()
        .loadAsync('assets/textures/monta%C3%B1as.hdr')
        .then((texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            hdrEnvironment = texture;
            scene.background = texture;
            scene.environment = texture;
            return texture;
        })
        .catch((error) => {
            console.error('No se pudo cargar assets/textures/montañas.hdr:', error);
            return null;
        });

    // 2. Cámara de perspectiva (FOV: 45°, Aspecto adaptativo, Planos de corte: 0.1m a 1500m)
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1500);
    camera.position.set(8, 2.5, 8);

    // 3. Configuración del WebGLRenderer (Motor gráfico)
    const renderer = new THREE.WebGLRenderer({
        antialias: true,             // Suavizado de bordes geométricos
        alpha: true,                 // Permite fondo transparente si se requiere
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Limitamos el pixel ratio a máximo 2 para mantener alto rendimiento en pantallas Retina/4K
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Mapeo tonal cinematográfico (filtra altas luces y evita que los blancos se quemen)
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Sombras suaves de alta calidad
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 4. Controles de Cámara (OrbitControls con inercia física)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;      // Suavizado con inercia al soltar el mouse
    controls.dampingFactor = 0.05;
    controls.target.set(0, 1.5, 0);     // Punto focal inicial
    controls.minDistance = 2;
    controls.maxDistance = 100;
    controls.maxPolarAngle = Math.PI / 2 - 0.01; // Evita que la cámara traspase el suelo

    // 5. Sistema de Iluminación
    // Luz hemisférica: simula la luz del cielo (arriba) y el rebote cálido del suelo (abajo)
    const hemiLight = new THREE.HemisphereLight(0xddeeff, 0x5a4833, 0.7);
    scene.add(hemiLight);

    // Luz ambiental suave para elevar las sombras oscuras
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.35);
    scene.add(ambientLight);

    // Sol principal (DirectionalLight con proyección de sombras de alta resolución)
    const sunLight = new THREE.DirectionalLight(0xfff3d6, 2.4);
    sunLight.position.set(12, 18, 12);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 120;
    const shadowDist = 36;
    sunLight.shadow.camera.left = -shadowDist;
    sunLight.shadow.camera.right = shadowDist;
    sunLight.shadow.camera.top = shadowDist;
    sunLight.shadow.camera.bottom = -shadowDist;
    sunLight.shadow.bias = -0.0002;
    sunLight.shadow.normalBias = 0.02; // Corrige artefactos de sombra en mallas curvas (shadow acne)
    scene.add(sunLight);

    // Luz de relleno lateral (Fill Light) para esculpir detalles en los relieves de la piedra
    const fillLight = new THREE.DirectionalLight(0x88aacc, 0.6);
    fillLight.position.set(-10, 8, -10);
    scene.add(fillLight);

    /**
     * Cambia la iluminación, cielo y tonalidad general según el modo atmosférico seleccionado.
     */
    function setAtmosphere(mode, skyTexture = null) {
        const selectedSky = skyTexture || hdrEnvironment;
        scene.background = selectedSky;
        scene.environment = mode === 'day' ? selectedSky : null;

        if (mode === 'day') {
            sunLight.color.setHex(0xfff3d6);
            sunLight.intensity = 2.4;
            sunLight.position.set(12, 18, 12);
            hemiLight.color.setHex(0xddeeff);
            hemiLight.groundColor.setHex(0x5a4833);
            hemiLight.intensity = 0.7;
            ambientLight.color.setHex(0xffeedd);
            ambientLight.intensity = 0.35;
            fillLight.intensity = 0.6;
            renderer.toneMappingExposure = 1.15;
        } else if (mode === 'sunset') {
            sunLight.color.setHex(0xff7722);
            sunLight.intensity = 2.8;
            sunLight.position.set(20, 6, -10);
            hemiLight.color.setHex(0xff9944);
            hemiLight.groundColor.setHex(0x3a1e12);
            hemiLight.intensity = 0.7;
            ambientLight.color.setHex(0xff6622);
            ambientLight.intensity = 0.35;
            fillLight.intensity = 0.5;
            renderer.toneMappingExposure = 1.25;
        } else if (mode === 'night') {
            sunLight.color.setHex(0x4466aa);
            sunLight.intensity = 0.3; // Noche oscura para resaltar el efecto FilmPass
            sunLight.position.set(-10, 15, 10);
            hemiLight.color.setHex(0x18223c);
            hemiLight.groundColor.setHex(0x050810);
            hemiLight.intensity = 0.3;
            ambientLight.color.setHex(0x0e1726);
            ambientLight.intensity = 0.15;
            fillLight.intensity = 0.1;
            renderer.toneMappingExposure = 0.85;
        }
    }

    return {
        scene,
        camera,
        renderer,
        controls,
        setAtmosphere,
        hdrReady
    };
}
