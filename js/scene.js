import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createScene(container) {
    const scene = new THREE.Scene();

    // Cámara con FOV natural y profundidad
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1500);
    camera.position.set(8, 2.5, 8);

    // Renderizador de alta fidelidad
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true // Permite capturas de pantalla HD
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Controles orbitales con inercia y límites suaves
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 1.5, 0);
    controls.enablePan = true;
    controls.minDistance = 2;
    controls.maxDistance = 60;
    controls.minPolarAngle = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.01; // No traspasar el suelo
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.8;

    // --- ILUMINACIÓN CINEMÁTICA ---
    // Luz hemisférica (Cielo andino vs suelo de tierra/piedra)
    const hemiLight = new THREE.HemisphereLight(0xddeeff, 0x5a4833, 0.7);
    scene.add(hemiLight);

    // Luz ambiental suave
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.35);
    scene.add(ambientLight);

    // Sol principal (Luz direccional con sombras de alta resolución)
    const sunLight = new THREE.DirectionalLight(0xfff3d6, 2.4);
    sunLight.position.set(12, 18, 12);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 120;
    const d = 30;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0002;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);

    // Luz de relleno lateral (Rim / Fill Light) para esculpir volúmenes
    const fillLight = new THREE.DirectionalLight(0x88aacc, 0.6);
    fillLight.position.set(-10, 8, -10);
    scene.add(fillLight);

    // Luz cenital suave para resaltar tallados superiores
    const topLight = new THREE.DirectionalLight(0xfffaed, 0.4);
    topLight.position.set(0, 25, 0);
    scene.add(topLight);

    // --- SISTEMA DE PARTÍCULAS ATMOSFÉRICAS (Polvo altiplánico / Chispas) ---
    const particleCount = 600;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = [];

    for (let i = 0; i < particleCount; i++) {
        particlePositions[i * 3] = (Math.random() - 0.5) * 50;
        particlePositions[i * 3 + 1] = Math.random() * 18;
        particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 50;
        particleVelocities.push({
            x: (Math.random() - 0.5) * 0.005,
            y: (Math.random() * 0.004) + 0.001,
            z: (Math.random() - 0.5) * 0.005
        });
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    // Canvas circular para partícula suave
    const particleCanvas = document.createElement('canvas');
    particleCanvas.width = 16;
    particleCanvas.height = 16;
    const pCtx = particleCanvas.getContext('2d');
    const pGrad = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
    pGrad.addColorStop(0, 'rgba(255, 230, 180, 0.9)');
    pGrad.addColorStop(0.5, 'rgba(230, 197, 148, 0.4)');
    pGrad.addColorStop(1, 'rgba(230, 197, 148, 0)');
    pCtx.fillStyle = pGrad;
    pCtx.beginPath();
    pCtx.arc(8, 8, 8, 0, Math.PI * 2);
    pCtx.fill();
    const particleTexture = new THREE.CanvasTexture(particleCanvas);

    const particleMaterial = new THREE.PointsMaterial({
        size: 0.25,
        map: particleTexture,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    function updateParticles() {
        const positions = particleGeometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] += particleVelocities[i].x;
            positions[i * 3 + 1] += particleVelocities[i].y;
            positions[i * 3 + 2] += particleVelocities[i].z;

            // Reiniciar partícula si sube o se aleja demasiado
            if (positions[i * 3 + 1] > 20) {
                positions[i * 3 + 1] = 0.1;
                positions[i * 3] = (Math.random() - 0.5) * 50;
                positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
            }
        }
        particleGeometry.attributes.position.needsUpdate = true;
    }

    // --- CAMBIO DE ATMÓSFERA ---
    function setAtmosphere(mode, originalSkyTexture = null) {
        if (mode === 'day') {
            scene.background = originalSkyTexture;
            scene.environment = originalSkyTexture;
            sunLight.color.setHex(0xfff3d6);
            sunLight.intensity = 2.4;
            sunLight.position.set(12, 18, 12);
            hemiLight.color.setHex(0xddeeff);
            hemiLight.groundColor.setHex(0x5a4833);
            hemiLight.intensity = 0.7;
            ambientLight.color.setHex(0xffeedd);
            ambientLight.intensity = 0.35;
            renderer.toneMappingExposure = 1.15;
            particleMaterial.color.setHex(0xffe6b4);
            particleMaterial.opacity = 0.6;
        } else if (mode === 'sunset') {
            scene.background = null;
            scene.background = new THREE.Color(0x351914);
            scene.environment = null;
            sunLight.color.setHex(0xff7722);
            sunLight.intensity = 2.8;
            sunLight.position.set(20, 6, -10);
            hemiLight.color.setHex(0xff9944);
            hemiLight.groundColor.setHex(0x3a1e12);
            hemiLight.intensity = 0.6;
            ambientLight.color.setHex(0xff6622);
            ambientLight.intensity = 0.25;
            renderer.toneMappingExposure = 1.25;
            particleMaterial.color.setHex(0xff9944);
            particleMaterial.opacity = 0.8;
        } else if (mode === 'night') {
            scene.background = null;
            scene.background = new THREE.Color(0x060913);
            scene.environment = null;
            sunLight.color.setHex(0x7799dd);
            sunLight.intensity = 0.85;
            sunLight.position.set(-10, 15, 10);
            hemiLight.color.setHex(0x223366);
            hemiLight.groundColor.setHex(0x050a14);
            hemiLight.intensity = 0.4;
            ambientLight.color.setHex(0x1a2544);
            ambientLight.intensity = 0.2;
            renderer.toneMappingExposure = 1.0;
            particleMaterial.color.setHex(0x88ccff);
            particleMaterial.opacity = 0.9;
        }
    }

    // --- MODO WIREFRAME / RAYOS X ---
    let isWireframe = false;
    function toggleWireframe(currentModel) {
        isWireframe = !isWireframe;
        if (currentModel) {
            currentModel.traverse((child) => {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.wireframe = isWireframe);
                    } else {
                        child.material.wireframe = isWireframe;
                    }
                }
            });
        }
        return isWireframe;
    }

    return {
        scene,
        camera,
        renderer,
        controls,
        updateParticles,
        setAtmosphere,
        toggleWireframe,
        getIsWireframe: () => isWireframe,
        lights: { sunLight, hemiLight, ambientLight, fillLight }
    };
}