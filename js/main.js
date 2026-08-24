import * as THREE from 'three';
import gsap from 'gsap'; 
import { createScene } from './scene.js';
import { loadModel } from './loaders/modelLoader.js';
import { loadTexture } from './loaders/textureLoader.js';

// Inicialización del motor 3D
const container = document.getElementById('webgl-container');
const sceneManager = createScene(container);
const { scene, camera, renderer, controls, updateParticles, setAtmosphere, toggleWireframe } = sceneManager;

// Elementos de la Interfaz (UI)
const loadingScreen = document.getElementById('loading-screen');
const loadingProgress = document.getElementById('loading-progress-bar');
const loadingPercentage = document.getElementById('loading-percentage');
const loadingStatus = document.getElementById('loading-status');

const panelTitle = document.getElementById('panel-title');
const panelSubtitle = document.getElementById('panel-subtitle');
const panelDesc = document.getElementById('panel-desc');
const badgeMaterial = document.getElementById('badge-material');
const badgePeriod = document.getElementById('badge-period');
const badgeDimensions = document.getElementById('badge-dimensions');
const badgeDiscovery = document.getElementById('badge-discovery');
const galleryImage = document.getElementById('gallery-image');
const galleryCaption = document.getElementById('gallery-caption');
const hotspotsListContainer = document.getElementById('hotspots-list');
const hotspotsOverlay = document.getElementById('hotspots-overlay');

// Variables globales de estado
let modelDatabase = {};
let currentModelKey = 'sungate';
let originalSkyTexture = null;

// Progreso de carga
const loadingState = {
    totalItems: 9,
    loadedItems: 0
};

function updateLoadingStep(message) {
    loadingState.loadedItems++;
    const percent = Math.min(100, Math.round((loadingState.loadedItems / loadingState.totalItems) * 100));
    if (loadingProgress) loadingProgress.style.width = `${percent}%`;
    if (loadingPercentage) loadingPercentage.innerText = `${percent}%`;
    if (loadingStatus && message) loadingStatus.innerText = message;
}

// --- BASE DE DATOS ARQUEOLÓGICA ---
const ARCHAEOLOGY_DATA = {
    sungate: {
        title: "Puerta del Sol",
        subtitle: "Monumento Lítico Sagrado",
        material: "Andesita Gris",
        period: "500 - 900 d.C.",
        dimensions: "3.0m × 3.8m × 0.5m (10 Ton)",
        discovery: "Sitio Kalasasaya, Tiwanaku",
        image: "assets/images/sungate_preview.jpg",
        imageCaption: "Friso tallado en andesita con la deidad central Viracocha.",
        desc: "Este monumental portal lítico monolítico es la cumbre del arte escultórico y astronómico de Tiwanaku. Tallado a partir de una sola pieza de roca andesita de más de 10 toneladas, funcionaba como un calendario solar de alta precisión. En el centro del dintel destaca el 'Señor de los Báculos' (Viracocha), rodeado por 48 figuras aladas en relieve.",
        camDefault: { x: 0, y: 1.8, z: 6.0 },
        camTarget: { x: 0, y: 1.5, z: 0 },
        hotspots: [
            {
                id: "sg-viracocha",
                title: "El Señor de los Báculos",
                pos: new THREE.Vector3(0.0, 2.2, 0.4),
                camPos: new THREE.Vector3(0, 2.2, 2.2),
                targetPos: new THREE.Vector3(0, 2.2, 0),
                desc: "Figura central que representa a Viracocha, la deidad creadora andina. Porta dos cetros o báculos ceremoniales rematados con cabezas de cóndor y de su cabeza emanan rayos solares."
            },
            {
                id: "sg-winged",
                title: "Friso de Hombres Alados",
                pos: new THREE.Vector3(1.1, 2.0, 0.4),
                camPos: new THREE.Vector3(1.1, 2.0, 2.2),
                targetPos: new THREE.Vector3(1.1, 2.0, 0),
                desc: "48 figuras aladas en 3 niveles, arrodilladas en actitud de reverencia hacia la deidad central. Representan sacerdotes y mensajeros celestiales mitad humanos y mitad cóndores."
            },
            {
                id: "sg-calendar",
                title: "Greca Calendárica",
                pos: new THREE.Vector3(0.0, 1.45, 0.4),
                camPos: new THREE.Vector3(0, 1.45, 1.8),
                targetPos: new THREE.Vector3(0, 1.45, 0),
                desc: "Banda inferior con meandros escalonados y trompetistas solares, interpretada como un sofisticado registro del ciclo anual de 365 días y equinoccios."
            },
            {
                id: "sg-portal",
                title: "Vano y Alineación",
                pos: new THREE.Vector3(0.0, 0.6, 0.0),
                camPos: new THREE.Vector3(0, 0.9, 4.0),
                targetPos: new THREE.Vector3(0, 0.8, 0),
                desc: "Vano tallado con perfecta verticalidad que permitía el paso de los rayos solares durante el amanecer ceremonial del solsticio de invierno (Año Nuevo Andino)."
            }
        ]
    },
    monolito: {
        title: "Monolito Ponce",
        subtitle: "Estela Antropomorfa Ceremonial",
        material: "Andesita Tallada",
        period: "600 - 800 d.C.",
        dimensions: "3.0m × 0.85m × 0.6m (3.5 Ton)",
        discovery: "Templo Kalasasaya (1957)",
        image: "assets/images/monolito_preview.jpg",
        imageCaption: "Monolito Ponce erigido en el patio interior del templo de Kalasasaya.",
        desc: "Escultura antropomorfa de una sola pieza descubierta por el arqueólogo boliviano Carlos Ponce Sanginés. Representa a un dignatario o sacerdote en estado de trance ceremonial, sosteniendo un vaso Kero sagrado en una mano y una tableta de rapé en la otra, con iconografía fina de hombres-cóndor y peces.",
        camDefault: { x: 0, y: 2.0, z: 6.0 },
        camTarget: { x: 0, y: 1.5, z: 0 },
        views: {
            front: { cam: { x: 0, y: 2.0, z: 5.0 }, target: { x: 0, y: 1.5, z: 0 } },
            profile: { cam: { x: 4.5, y: 2.0, z: 0 }, target: { x: 0, y: 1.5, z: 0 } },
            detail: { cam: { x: 0, y: 2.5, z: 2.0 }, target: { x: 0, y: 2.5, z: 0 } },
            top: { cam: { x: 0, y: 6.5, z: 0.1 }, target: { x: 0, y: 1.0, z: 0 } }
        },
        hotspots: [
            {
                id: "mp-face",
                title: "Rostro y Diadema",
                pos: new THREE.Vector3(0.0, 2.5, 0.45),
                camPos: new THREE.Vector3(0, 2.5, 2.0),
                targetPos: new THREE.Vector3(0, 2.5, 0),
                desc: "Ojos cuadrangulares con lágrimas en forma de aves y una corona o turbante decorado con motivos escalonados y orejeras tubulares sacerdotales."
            },
            {
                id: "mp-kero",
                title: "Vaso Kero Sagrado",
                pos: new THREE.Vector3(0.0, 1.55, 0.45),
                camPos: new THREE.Vector3(0, 1.55, 1.8),
                targetPos: new THREE.Vector3(0, 1.55, 0),
                desc: "Sostiene firmemente contra el pecho un vaso ceremonial Kero utilizado en las libaciones rituales de chicha durante festividades astronómicas."
            },
            {
                id: "mp-belt",
                title: "Faja Iconográfica",
                pos: new THREE.Vector3(0.0, 0.8, 0.45),
                camPos: new THREE.Vector3(0, 0.8, 1.9),
                targetPos: new THREE.Vector3(0, 0.8, 0),
                desc: "Cinturón grabado con figuras de hombres-pez y cóndores, simbolizando el dominio sobre las aguas del Lago Titicaca y las alturas celestes."
            }
        ]
    },
    chachapuma: {
        title: "Chachapuma",
        subtitle: "Guardián Hombre-Puma",
        material: "Basalto Volcánico Negro",
        period: "700 - 900 d.C.",
        dimensions: "1.3m × 0.7m × 0.8m",
        discovery: "Base de la Pirámide de Akapana",
        image: "assets/images/sungate_preview.jpg",
        imageCaption: "Escultura en bulto redondo de basáltica negra representando al guerrero felino.",
        desc: "Fascinante escultura zoomorfa de basalto negro que representa la figura mítica del hombre-puma o guerrero felino. Los Chachapumas custodiaban las escalinatas principales de la pirámide de Akapana, protegiendo el espacio sagrado y simbolizando el poder y sacrificio en la cosmovisión andina.",
        camDefault: { x: 0, y: 1.5, z: 4.5 },
        camTarget: { x: 0, y: 0.7, z: 0 },
        views: {
            front: { cam: { x: 0, y: 1.2, z: 3.5 }, target: { x: 0, y: 0.7, z: 0 } },
            profile: { cam: { x: 3.2, y: 1.0, z: 0 }, target: { x: 0, y: 0.7, z: 0 } },
            detail: { cam: { x: 0, y: 0.95, z: 1.8 }, target: { x: 0, y: 0.9, z: 0 } },
            top: { cam: { x: 0, y: 4.5, z: 0.1 }, target: { x: 0, y: 0.5, z: 0 } }
        },
        hotspots: [
            {
                id: "cp-fangs",
                title: "Fauces de Felino",
                pos: new THREE.Vector3(0.0, 0.95, 0.4),
                camPos: new THREE.Vector3(0, 0.95, 1.8),
                targetPos: new THREE.Vector3(0, 0.9, 0),
                desc: "Rasgos anatómicos de puma con colmillos cruzados y orejas redondeadas, encarnando la ferocidad del felino andino."
            },
            {
                id: "cp-trophy",
                title: "Cabeza Trofeo",
                pos: new THREE.Vector3(0.0, 0.45, 0.45),
                camPos: new THREE.Vector3(0, 0.45, 1.6),
                targetPos: new THREE.Vector3(0, 0.45, 0),
                desc: "Sostiene entre sus garras una cabeza humana decapitada, símbolo de ofrenda y fecundidad de la tierra en el ritual de Akapana."
            },
            {
                id: "cp-pose",
                title: "Postura Ceremonial",
                pos: new THREE.Vector3(0.3, 0.25, 0.0),
                camPos: new THREE.Vector3(1.6, 0.6, 1.6),
                targetPos: new THREE.Vector3(0, 0.4, 0),
                desc: "Cuerpo humanoide arrodillado en tensión, preparado para la defensa ritual de los templos mayores de Tiwanaku."
            }
        ]
    },
    piramide: {
        title: "Pirámide de Akapana",
        subtitle: "Montaña Sagrada de Tiwanaku",
        material: "Arenisca, Andesita y Arcilla",
        period: "400 - 900 d.C.",
        dimensions: "194m × 182m × 18m de Altura",
        discovery: "Complejo Arqueológico Central",
        image: "assets/images/monolito_preview.jpg",
        imageCaption: "Reconstrucción tridimensional de la estructura piramidal de 7 terrazas.",
        desc: "La Pirámide de Akapana es la estructura monumental más imponente de Tiwanaku. Concebida como una montaña artificial sagrada con siete terrazas escalonadas, albergaba en su cima un estanque ceremonial en forma de cruz escalonada (Chakana) y un avanzado sistema hidráulico subterráneo.",
        camDefault: { x: 0, y: 15, z: 42 },
        camTarget: { x: 0, y: 5, z: 0 },
        views: {
            front: { cam: { x: 0, y: 14, z: 38 }, target: { x: 0, y: 5, z: 0 } },
            profile: { cam: { x: 38, y: 14, z: 0 }, target: { x: 0, y: 5, z: 0 } },
            detail: { cam: { x: 0, y: 18, z: 15 }, target: { x: 0, y: 6, z: 0 } },
            top: { cam: { x: 0, y: 55, z: 0.1 }, target: { x: 0, y: 2, z: 0 } }
        },
        hotspots: [
            {
                id: "ak-temple",
                title: "Templo y Depresión Superior",
                pos: new THREE.Vector3(0.0, 5.0, 0.0),
                camPos: new THREE.Vector3(0, 16, 24),
                targetPos: new THREE.Vector3(0, 5, 0),
                desc: "Terraza superior donde se encontraba un recinto sagrado con piscina ceremonial en forma de Chakana para rituales al agua y a los astros."
            },
            {
                id: "ak-terraces",
                title: "Muros Ciclópeos",
                pos: new THREE.Vector3(6.0, 2.0, 6.0),
                camPos: new THREE.Vector3(14, 8, 18),
                targetPos: new THREE.Vector3(6, 2, 6),
                desc: "Siete niveles de contención levantados con grandes sillares de andesita y arenisca perfectamente encajados sin mortero."
            },
            {
                id: "ak-drainage",
                title: "Canales Hidráulicos",
                pos: new THREE.Vector3(0.0, 0.5, 8.0),
                camPos: new THREE.Vector3(0, 4, 14),
                targetPos: new THREE.Vector3(0, 0.5, 8),
                desc: "Canales líticos subterráneos que hacían descender el agua de lluvia por el interior de la pirámide, emitiendo un sonido sagrado similar a truenos."
            }
        ]
    }
};

// --- INICIALIZACIÓN Y CARGA DE RECURSOS ---
async function init() {
    try {
        // 1. Texturas
        updateLoadingStep("Cargando cielo andino...");
        const skyTexture = await loadTexture('assets/textures/cielos.png', {
            colorSpace: THREE.SRGBColorSpace,
            mapping: THREE.EquirectangularReflectionMapping
        });
        originalSkyTexture = skyTexture;
        scene.background = skyTexture;
        scene.environment = skyTexture;
        updateLoadingStep("Textura de cielo lista");

        updateLoadingStep("Cargando terreno altiplánico...");
        const groundTexture = await loadTexture('assets/textures/GroundDirtRocky020_COL_2K.jpg', {
            colorSpace: THREE.SRGBColorSpace,
            wrapS: THREE.RepeatWrapping,
            wrapT: THREE.RepeatWrapping,
            repeat: new THREE.Vector2(40, 40)
        });
        updateLoadingStep("Terreno listo");

        // Piso 3D
        const groundGeometry = new THREE.PlaneGeometry(400, 400); 
        const groundMaterial = new THREE.MeshStandardMaterial({
            map: groundTexture,
            roughness: 0.88,
            metalness: 0.08
        });
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.position.y = 0;
        groundMesh.receiveShadow = true;
        scene.add(groundMesh);

        // Texturas adicionales
        const [sgAlbedo, sgNormal, monoTexture, piramideAlbedo, piramideNormal] = await Promise.all([
            loadTexture('assets/textures/SunGate_albedo.png', { colorSpace: THREE.SRGBColorSpace, flipY: false, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping }),
            loadTexture('assets/textures/SunGate_normal.png', { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping }).catch(() => null),
            loadTexture('assets/textures/monolito_texture.jpeg', { colorSpace: THREE.SRGBColorSpace, flipY: false }),
            loadTexture('assets/textures/piramide/509b3feffce3dcdd8a27aa21e92175a3.png', { colorSpace: THREE.SRGBColorSpace, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping, repeat: new THREE.Vector2(2, 2) }),
            loadTexture('assets/textures/piramide/b6da21e5e4fec73c0613b04789ddb478.png', { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping, repeat: new THREE.Vector2(2, 2) }).catch(() => null)
        ]);
        updateLoadingStep("Texturas líticas aplicadas");

        // 2. Modelos 3D
        updateLoadingStep("Cargando Puerta del Sol...");
        const sunGate = await loadModel('assets/models/SunGate.glb');
        updateLoadingStep("Cargando Monolito Ponce...");
        const monolito = await loadModel('assets/models/monolito_ponce.glb');
        updateLoadingStep("Cargando Chachapuma...");
        const chachapuma = await loadModel('assets/models/chachapuma.glb');
        updateLoadingStep("Cargando Pirámide de Akapana...");
        const piramide = await loadModel('assets/models/piramide.glb', { autoCenter: true });
        updateLoadingStep("Modelos 3D completados");

        // Aplicación de Texturas y Normales
        sunGate.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.map = sgAlbedo;
                if (sgNormal) {
                    child.material.normalMap = sgNormal;
                    child.material.normalScale.set(0.6, 0.6);
                }
                child.material.roughness = 0.9;
                child.material.metalness = 0.1;
                child.material.color.set(0xffffff);
                child.material.needsUpdate = true;
            }
        });

        monolito.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material = child.material.clone();
                child.material.map = monoTexture;
                child.material.roughness = 0.85;
                child.material.metalness = 0.05;
                child.material.color.set(0xffffff);
                child.material.needsUpdate = true;
            }
        });

        chachapuma.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.roughness = 0.45; // Basalto oscuro más brillante y pulido
                child.material.metalness = 0.2;
                child.material.needsUpdate = true;
            }
        });

        piramide.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material = child.material.clone();
                child.material.map = piramideAlbedo;
                if (piramideNormal) child.material.normalMap = piramideNormal;
                child.material.roughness = 0.95;
                child.material.metalness = 0.0;
                child.material.color.set(0xffffff);
                child.material.needsUpdate = true;
            }
        });

        // Configuración de los modelos en la escena
        [sunGate, monolito, chachapuma, piramide].forEach(m => {
            m.position.set(0, 0, 0);
            m.visible = false;
            scene.add(m);
        });

        // Guardar base de datos conectando malla con arqueología
        modelDatabase = {
            sungate: { mesh: sunGate, ...ARCHAEOLOGY_DATA.sungate },
            monolito: { mesh: monolito, ...ARCHAEOLOGY_DATA.monolito },
            chachapuma: { mesh: chachapuma, ...ARCHAEOLOGY_DATA.chachapuma },
            piramide: { mesh: piramide, ...ARCHAEOLOGY_DATA.piramide }
        };

        // Configurar Eventos de la Interfaz
        setupUIEvents();

        // Ocultar pantalla de carga con animación suave
        gsap.to(loadingScreen, {
            opacity: 0,
            duration: 0.8,
            ease: "power2.out",
            onComplete: () => {
                loadingScreen.style.display = 'none';
            }
        });

        // Mostrar primer modelo
        switchModel('sungate');

    } catch (error) {
        console.error("Error al inicializar la experiencia:", error);
        if (loadingStatus) {
            loadingStatus.innerText = "Error cargando recursos. Por favor recargue la página.";
            loadingStatus.style.color = "#ff6b6b";
        }
    }
}

// --- FUNCIÓN DE CAMBIO DE MODELO ---
function switchModel(modelKey) {
    const selectedData = modelDatabase[modelKey];
    if (!selectedData) return;

    currentModelKey = modelKey;

    // 1. Ocultar todas las mallas
    Object.values(modelDatabase).forEach(data => {
        data.mesh.visible = false;
    });

    // 2. Mostrar la seleccionada
    selectedData.mesh.visible = true;

    // 3. Actualizar textos e información en el panel lateral
    if (panelTitle) panelTitle.innerText = selectedData.title;
    if (panelSubtitle) panelSubtitle.innerText = selectedData.subtitle;
    if (panelDesc) panelDesc.innerText = selectedData.desc;
    if (badgeMaterial) badgeMaterial.innerText = selectedData.material;
    if (badgePeriod) badgePeriod.innerText = selectedData.period;
    if (badgeDimensions) badgeDimensions.innerText = selectedData.dimensions;
    if (badgeDiscovery) badgeDiscovery.innerText = selectedData.discovery;
    if (galleryImage) galleryImage.src = selectedData.image;
    if (galleryCaption) galleryCaption.innerText = selectedData.imageCaption;

    // 4. Actualizar Hotspots en la UI
    renderHotspots(selectedData.hotspots);

    // 5. Actualizar botones activos del selector inferior y dropdown
    updateActiveNavIndicators(modelKey);

    // 6. Transición de cámara hacia la posición por defecto del modelo
    const defCam = selectedData.camDefault;
    const defTarget = selectedData.camTarget;

    gsap.to(camera.position, {
        x: defCam.x,
        y: defCam.y,
        z: defCam.z,
        duration: 1.6,
        ease: "power3.inOut"
    });

    gsap.to(controls.target, {
        x: defTarget.x,
        y: defTarget.y,
        z: defTarget.z,
        duration: 1.6,
        ease: "power3.inOut",
        onUpdate: () => controls.update()
    });
}

// --- RENDERIZADO DE HOTSPOTS 3D & 2D ---
function renderHotspots(hotspots = []) {
    // 1. Limpiar lista en el panel
    if (hotspotsListContainer) {
        hotspotsListContainer.innerHTML = '';
        hotspots.forEach((hs, index) => {
            const item = document.createElement('div');
            item.className = 'hotspot-item';
            item.innerHTML = `
                <div class="hotspot-item-header">
                    <span class="hotspot-badge">${index + 1}</span>
                    <h4>${hs.title}</h4>
                </div>
                <p>${hs.desc}</p>
            `;
            item.addEventListener('click', () => focusHotspot(hs));
            hotspotsListContainer.appendChild(item);
        });
    }

    // 2. Renderizar marcadores flotantes en overlay
    if (hotspotsOverlay) {
        hotspotsOverlay.innerHTML = '';
        hotspots.forEach((hs, index) => {
            const pin = document.createElement('div');
            pin.className = 'hotspot-pin';
            pin.id = `pin-${hs.id}`;
            pin.dataset.id = hs.id;
            pin.innerHTML = `
                <div class="pin-pulse"></div>
                <div class="pin-core">${index + 1}</div>
                <div class="pin-tooltip">
                    <strong>${hs.title}</strong>
                    <span>${hs.desc}</span>
                </div>
            `;
            pin.addEventListener('click', (e) => {
                e.stopPropagation();
                focusHotspot(hs);
            });
            hotspotsOverlay.appendChild(pin);
        });
    }
}

// Actualizar posición 2D de los marcadores en cada fotograma
function updateHotspotsPositions() {
    const currentData = modelDatabase[currentModelKey];
    if (!currentData || !currentData.hotspots || !hotspotsOverlay) return;

    const tempV = new THREE.Vector3();

    currentData.hotspots.forEach((hs) => {
        const pin = document.getElementById(`pin-${hs.id}`);
        if (!pin) return;

        tempV.copy(hs.pos);
        tempV.project(camera);

        // Verificar si está frente a la cámara (Z < 1)
        const isBehind = tempV.z > 1;
        if (isBehind) {
            pin.style.display = 'none';
            return;
        }

        // Convertir coordenadas normalizadas a pixeles
        const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(tempV.y * 0.5) + 0.5) * window.innerHeight;

        pin.style.display = 'block';
        pin.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
    });
}

function focusHotspot(hs) {
    if (!hs) return;

    gsap.to(camera.position, {
        x: hs.camPos.x,
        y: hs.camPos.y,
        z: hs.camPos.z,
        duration: 1.4,
        ease: "power3.inOut"
    });

    gsap.to(controls.target, {
        x: hs.targetPos.x,
        y: hs.targetPos.y,
        z: hs.targetPos.z,
        duration: 1.4,
        ease: "power3.inOut",
        onUpdate: () => controls.update()
    });

    // Abrir pestaña de hotspots en el panel si está en otra
    const tabBtn = document.querySelector('[data-tab="hotspots"]');
    if (tabBtn) tabBtn.click();
}

// --- INDICADORES ACTIVOS DE NAVEGACIÓN ---
function updateActiveNavIndicators(activeKey) {
    // Bottom cards
    document.querySelectorAll('.model-card-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.model === activeKey);
    });
}

// --- CONFIGURACIÓN DE EVENTOS DE INTERFAZ ---
function setupUIEvents() {
    // Menú Superior Dropdown
    document.querySelectorAll('[data-model]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const key = btn.dataset.model;
            if (key) switchModel(key);
        });
    });

    // Pestañas del Panel Lateral (Ficha, Hotspots, Galería)
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            const targetTab = document.getElementById(`tab-${btn.dataset.tab}`);
            if (targetTab) targetTab.classList.add('active');
        });
    });

    // Colapsar / Expandir Panel Lateral
    const togglePanelBtn = document.getElementById('toggle-panel-btn');
    const sidePanel = document.getElementById('side-panel');
    if (togglePanelBtn && sidePanel) {
        togglePanelBtn.addEventListener('click', () => {
            sidePanel.classList.toggle('collapsed');
            togglePanelBtn.innerHTML = sidePanel.classList.contains('collapsed') 
                ? '<span>📖</span> Ver Ficha' 
                : '<span>✕</span> Ocultar';
        });
    }

    // --- BARRA DE HERRAMIENTAS 3D ---
    // Selector de Atmósfera (Día, Atardecer, Noche)
    document.querySelectorAll('.btn-atmosphere').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-atmosphere').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const mode = btn.dataset.mode;
            setAtmosphere(mode, originalSkyTexture);
        });
    });

    // Vistas Rápidas de Cámara
    document.querySelectorAll('.btn-camera-view').forEach(btn => {
        btn.addEventListener('click', () => {
            const viewName = btn.dataset.view;
            const currentData = modelDatabase[currentModelKey];
            if (currentData && currentData.views && currentData.views[viewName]) {
                const view = currentData.views[viewName];
                gsap.to(camera.position, {
                    x: view.cam.x,
                    y: view.cam.y,
                    z: view.cam.z,
                    duration: 1.3,
                    ease: "power2.inOut"
                });
                gsap.to(controls.target, {
                    x: view.target.x,
                    y: view.target.y,
                    z: view.target.z,
                    duration: 1.3,
                    ease: "power2.inOut",
                    onUpdate: () => controls.update()
                });
            }
        });
    });

    // Giro Automático 360° (Turntable)
    const btnTurntable = document.getElementById('btn-turntable');
    if (btnTurntable) {
        btnTurntable.addEventListener('click', () => {
            controls.autoRotate = !controls.autoRotate;
            btnTurntable.classList.toggle('active', controls.autoRotate);
        });
    }

    // Modo Wireframe / Rayos X
    const btnWireframe = document.getElementById('btn-wireframe');
    if (btnWireframe) {
        btnWireframe.addEventListener('click', () => {
            const currentMesh = modelDatabase[currentModelKey]?.mesh;
            const isWf = toggleWireframe(currentMesh);
            btnWireframe.classList.toggle('active', isWf);
        });
    }

    // Captura de Pantalla HD
    const btnScreenshot = document.getElementById('btn-screenshot');
    if (btnScreenshot) {
        btnScreenshot.addEventListener('click', () => {
            // Render limpio antes de capturar
            renderer.render(scene, camera);
            const dataURL = renderer.domElement.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `Tiwanaku_3D_${currentModelKey}_${Date.now()}.png`;
            link.href = dataURL;
            link.click();
        });
    }

    // Pantalla Completa
    const btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => console.log(err));
            } else {
                document.exitFullscreen();
            }
        });
    }

    // Modales (Ubicación y Guía)
    const btnLocation = document.getElementById('nav-location');
    const modalLocation = document.getElementById('modal-location');
    const modalLocationClose = document.getElementById('modal-location-close');

    if (btnLocation && modalLocation) {
        btnLocation.addEventListener('click', (e) => {
            e.preventDefault();
            modalLocation.classList.add('open');
        });
    }

    if (modalLocationClose && modalLocation) {
        modalLocationClose.addEventListener('click', () => {
            modalLocation.classList.remove('open');
        });
        modalLocation.addEventListener('click', (e) => {
            if (e.target === modalLocation) modalLocation.classList.remove('open');
        });
    }
}

// --- BUCLE DE ANIMACIÓN Y RENDER ---
function animate() {
    requestAnimationFrame(animate);
    
    controls.update();
    updateParticles();
    updateHotspotsPositions();

    renderer.render(scene, camera);
}

// Redimensionamiento responsivo de ventana
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Iniciar aplicación
init();
animate();
