import * as THREE from 'three';
import gsap from 'gsap';
import { createScene } from './scene.js';
import { loadModel } from './loaders/modelLoader.js';
import { loadTexture } from './loaders/textureLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// --- 1. INICIALIZACIÓN DEL ENTORNO 3D ---
const container = document.getElementById('webgl-container');
const { scene, camera, renderer, controls, setAtmosphere, hdrReady } = createScene(container);

// --- CONFIGURACIÓN DE POSTPROCESAMIENTO (EFFECT COMPOSER) ---
const composer = new EffectComposer(renderer);

// 1. RenderPass principal para la escena y cámara
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// 2. OutlinePass aplicado al modelo del Chachapuma con delineado rojo
const outlinePass = new OutlinePass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    scene,
    camera,
    []
);
// Ajustes del contorno (según especificación con delineado rojo brillante)
outlinePass.edgeStrength = 25.0; // Intensidad
outlinePass.edgeThickness = 5.0; // Grosor
outlinePass.visibleEdgeColor.set("#ff0000"); // Delineado rojo
outlinePass.hiddenEdgeColor.set("#003300"); // Color borde oculto
outlinePass.enabled = false; // Se activa cuando se selecciona el Chachapuma
composer.addPass(outlinePass);

// 3. FilmPass para el modo noche ("cuando todos los objetos están oscuros")
const filmPass = new FilmPass(50, 0, 0, false);
filmPass.enabled = false; // Se activa únicamente con el botón de la noche
composer.addPass(filmPass);

// 4. OutputPass (Aplica mapeo tonal ACESFilmic y conversión a espacio de color sRGB)
const outputPass = new OutputPass();
composer.addPass(outputPass);

// Referencias a elementos del DOM (UI)
const loadingScreen = document.getElementById('loading-screen');
const loadingProgress = document.getElementById('loading-progress-bar');
const loadingPercentage = document.getElementById('loading-percentage');

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

// Estado global de la aplicación
let modelDatabase = {};
let currentModelKey = 'sungate';
let originalSkyTexture = null;
let sunsetSkyTexture = null;
let nightSkyTexture = null;

// Helper para actualizar la barra de progreso de carga
let loadedCount = 0;
const totalResources = 9;

function updateProgress() {
    loadedCount++;
    const percent = Math.min(100, Math.round((loadedCount / totalResources) * 100));
    if (loadingProgress) loadingProgress.style.width = `${percent}%`;
    if (loadingPercentage) loadingPercentage.innerText = `${percent}%`;
}

// --- 2. BASE DE DATOS ARQUEOLÓGICA Y CONFIGURACIÓN DE CÁMARA ---
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
        // La Puerta del Sol tiene el frente en el plano YZ (normal sobre X).
        // Se centra el objetivo en la malla y se mira perpendicularmente desde +X.
        camDefault: { x: 6.0, y: 1.8, z: 0.0 },
        camTarget: { x: -0.34, y: 1.5, z: 0.0 },
        hotspots: [
            {
                id: "sg-viracocha",
                title: "El Señor de los Báculos",
                pos: new THREE.Vector3(0.08, 2.2, 0.0),
                camPos: new THREE.Vector3(1.86, 2.2, 0.0),
                targetPos: new THREE.Vector3(-0.34, 2.2, 0.0),
                desc: "Figura central que representa a Viracocha, la deidad creadora andina. De su cabeza emanan rayos solares y porta dos cetros rematados con cabezas de cóndor."
            },
            {
                id: "sg-winged",
                title: "Friso de Hombres Alados",
                pos: new THREE.Vector3(0.08, 2.0, 1.1),
                camPos: new THREE.Vector3(1.86, 2.0, 1.1),
                targetPos: new THREE.Vector3(-0.34, 2.0, 1.1),
                desc: "48 figuras aladas en 3 niveles, arrodilladas en reverencia hacia la deidad central. Representan sacerdotes y mensajeros celestiales mitad humanos y mitad cóndores."
            },
            {
                id: "sg-calendar",
                title: "Greca Calendárica",
                pos: new THREE.Vector3(0.08, 1.45, 0.0),
                camPos: new THREE.Vector3(1.46, 1.45, 0.0),
                targetPos: new THREE.Vector3(-0.34, 1.45, 0.0),
                desc: "Banda inferior con meandros escalonados y trompetistas solares, interpretada como un sofisticado registro del ciclo anual de 365 días y equinoccios."
            },
            {
                id: "sg-portal",
                title: "Vano y Alineación Solar",
                pos: new THREE.Vector3(0.08, 0.6, 0.0),
                camPos: new THREE.Vector3(3.66, 0.9, 0.0),
                targetPos: new THREE.Vector3(-0.34, 0.8, 0.0),
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
        camDefault: { x: 0, y: 1.8, z: 4.8 },
        camTarget: { x: 0, y: 1.5, z: 0 },
        hotspots: [
            {
                id: "mp-face",
                title: "Rostro y Diadema",
                pos: new THREE.Vector3(0.0, 2.45, 0.38),
                camPos: new THREE.Vector3(0.0, 2.45, 1.8),
                targetPos: new THREE.Vector3(0.0, 2.45, 0.0),
                desc: "Ojos cuadrangulares con lágrimas en forma de aves y una corona o turbante decorado con motivos escalonados y orejeras tubulares sacerdotales."
            },
            {
                id: "mp-kero",
                title: "Vaso Kero Sagrado",
                pos: new THREE.Vector3(0.0, 1.55, 0.38),
                camPos: new THREE.Vector3(0.0, 1.55, 1.7),
                targetPos: new THREE.Vector3(0.0, 1.55, 0.0),
                desc: "Sostiene contra el pecho un vaso ceremonial Kero utilizado en las libaciones rituales de chicha durante festividades astronómicas."
            },
            {
                id: "mp-belt",
                title: "Faja Iconográfica",
                pos: new THREE.Vector3(0.0, 0.95, 0.38),
                camPos: new THREE.Vector3(0.0, 0.95, 1.7),
                targetPos: new THREE.Vector3(0.0, 0.95, 0.0),
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
        image: "assets/images/chachapuma_preview.png",
        imageCaption: "Escultura antropomorfa en basalto negro del Chachapuma sosteniendo una cabeza trofeo.",
        desc: "Fascinante escultura zoomorfa de basalto negro que representa la figura mítica del hombre-puma o guerrero felino. Los Chachapumas custodiaban las escalinatas principales de la pirámide de Akapana, protegiendo el espacio sagrado y simbolizando el poder y sacrificio en la cosmovisión andina.",
        camDefault: { x: 0, y: 1.3, z: 3.4 },
        camTarget: { x: 0, y: 0.85, z: 0 },
        hotspots: [
            {
                id: "cp-fangs",
                title: "Fauces de Felino",
                pos: new THREE.Vector3(0.0, 1.35, 0.35),
                camPos: new THREE.Vector3(0, 1.35, 1.5),
                targetPos: new THREE.Vector3(0, 1.3, 0),
                desc: "Rasgos anatómicos de puma con colmillos cruzados y orejas redondeadas, encarnando la ferocidad del felino andino."
            },
            {
                id: "cp-trophy",
                title: "Cabeza Trofeo",
                pos: new THREE.Vector3(0.0, 0.78, 0.38),
                camPos: new THREE.Vector3(0, 0.78, 1.4),
                targetPos: new THREE.Vector3(0, 0.78, 0),
                desc: "Sostiene entre sus garras una cabeza humana decapitada, símbolo de ofrenda y fecundidad de la tierra en el ritual de Akapana."
            },
            {
                id: "cp-pose",
                title: "Postura Ceremonial",
                pos: new THREE.Vector3(0.38, 0.35, 0.0),
                camPos: new THREE.Vector3(1.6, 0.7, 1.4),
                targetPos: new THREE.Vector3(0, 0.6, 0),
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
        image: "assets/images/piramide_preview.png",
        imageCaption: "Fotografía arqueológica actual de las terrazas escalonadas de la Pirámide de Akapana.",
        desc: "La Pirámide de Akapana es la estructura monumental más imponente de Tiwanaku. Concebida como una montaña artificial sagrada con siete terrazas escalonadas, albergaba en su cima un estanque ceremonial en forma de cruz escalonada (Chakana) y un avanzado sistema hidráulico subterráneo.",
        camDefault: { x: 0, y: 16, z: 44 },
        camTarget: { x: 0, y: 3.5, z: 0 },
        hotspots: [
            {
                id: "ak-temple",
                title: "Templo y Depresión Superior",
                pos: new THREE.Vector3(0.0, 5.2, 0.0),
                camPos: new THREE.Vector3(0, 16, 22),
                targetPos: new THREE.Vector3(0, 5.2, 0),
                desc: "Terraza superior donde se encontraba un recinto sagrado con piscina ceremonial en forma de Chakana para rituales al agua y a los astros."
            },
            {
                id: "ak-terraces",
                title: "Muros Ciclópeos",
                pos: new THREE.Vector3(10.0, 2.5, 10.0),
                camPos: new THREE.Vector3(18, 9, 20),
                targetPos: new THREE.Vector3(10, 2.5, 10),
                desc: "Siete niveles de contención levantados con grandes sillares de andesita y arenisca perfectamente encajados sin mortero."
            },
            {
                id: "ak-drainage",
                title: "Canales Hidráulicos",
                pos: new THREE.Vector3(0.0, 0.6, 20.0),
                camPos: new THREE.Vector3(0, 5, 28),
                targetPos: new THREE.Vector3(0, 0.6, 20),
                desc: "Canales líticos subterráneos que hacían descender el agua de lluvia por el interior de la pirámide, emitiendo un sonido sagrado similar a truenos."
            }
        ]
    }
};

/**
 * Genera un modelo 3D geométrico procedural de respaldo para la Pirámide de Akapana
 * con 7 terrazas escalonadas de arenisca/arcilla andina.
 */
function createFallbackPyramid() {
    const group = new THREE.Group();
    const levels = 7;
    const baseWidth = 36;
    const heightPerLevel = 1.3;
    const material = new THREE.MeshStandardMaterial({
        color: 0x985e3c,
        roughness: 0.9,
        metalness: 0.05
    });

    for (let i = 0; i < levels; i++) {
        const factor = 1 - (i * 0.11);
        const w = baseWidth * factor;
        const geom = new THREE.BoxGeometry(w, heightPerLevel, w);
        const mesh = new THREE.Mesh(geom, material);
        mesh.position.y = (i + 0.5) * heightPerLevel;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
    }
    return group;
}

// --- 3. CARGA ASÍNCRONA DE RECURSOS ---
async function init() {
    try {
        // El HDRI se carga desde createScene y se usa como cielo e iluminación diurna.
        originalSkyTexture = await hdrReady;
        if (!originalSkyTexture) {
            // Mantiene el cielo anterior como respaldo si el archivo HDR no está disponible.
            originalSkyTexture = await loadTexture('assets/textures/cielos.png', {
                colorSpace: THREE.SRGBColorSpace,
                mapping: THREE.EquirectangularReflectionMapping
            });
        }
        scene.background = originalSkyTexture;
        scene.environment = originalSkyTexture;
        updateProgress();

        sunsetSkyTexture = await loadTexture('assets/textures/amanecer.png', {
            colorSpace: THREE.SRGBColorSpace,
            mapping: THREE.EquirectangularReflectionMapping
        });
        updateProgress();

        nightSkyTexture = await loadTexture('assets/textures/Cold Night Equirect.png', {
            colorSpace: THREE.SRGBColorSpace,
            mapping: THREE.EquirectangularReflectionMapping
        });
        updateProgress();

        // Carga de Terreno
        const groundTexture = await loadTexture('assets/textures/GroundDirtRocky020_COL_2K.jpg', {
            colorSpace: THREE.SRGBColorSpace,
            wrapS: THREE.RepeatWrapping,
            wrapT: THREE.RepeatWrapping,
            repeat: new THREE.Vector2(40, 40)
        });

        const groundMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(400, 400),
            new THREE.MeshStandardMaterial({ map: groundTexture, roughness: 0.88, metalness: 0.08 })
        );
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.receiveShadow = true;
        scene.add(groundMesh);
        updateProgress();

        // Carga paralela de texturas de modelos
        const [sgAlbedo, sgNormal, piramideAlbedo, piramideNormal] = await Promise.all([
            loadTexture('assets/textures/SunGate_albedo.png', { colorSpace: THREE.SRGBColorSpace, flipY: false, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping }).catch(() => null),
            loadTexture('assets/textures/SunGate_normal.png', { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping }).catch(() => null),
            loadTexture('assets/textures/piramide/509b3feffce3dcdd8a27aa21e92175a3.png', { colorSpace: THREE.SRGBColorSpace, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping, repeat: new THREE.Vector2(2, 2) }).catch(() => null),
            loadTexture('assets/textures/piramide/b6da21e5e4fec73c0613b04789ddb478.png', { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping, repeat: new THREE.Vector2(2, 2) }).catch(() => null)
        ]);
        updateProgress();

        // Carga de Modelos 3D
        const sunGate = await loadModel('assets/models/SunGate.glb');
        updateProgress();
        const monolito = await loadModel('assets/models/monolito_ponce.glb', { scale: 0.03, autoCenter: true });
        updateProgress();
        const chachapuma = await loadModel('assets/models/chachapuma.glb', { scale: 0.017, autoCenter: true });
        updateProgress();

        // Carga secuencial y tolerante a fallos para la Pirámide de Akapana
        let piramide = null;
        const pyramidCandidates = [
            'assets/models/piramide2.glb.glb',
            'assets/models/piramide2.glb',
            'assets/models/pira.glb',
            'assets/models/piramide.glb'
        ];

        for (const modelPath of pyramidCandidates) {
            try {
                piramide = await loadModel(modelPath, { autoCenter: true, fitSize: 35 });
                if (piramide) {
                    console.log(`Pirámide de Akapana cargada exitosamente desde: ${modelPath}`);
                    break;
                }
            } catch (err) {
                console.warn(`Aviso: No se pudo cargar modelo en ${modelPath}:`, err?.message || err);
            }
        }

        // Si ningún archivo físico se pudo cargar (ej. si fue borrado o renombrado), generar pirámide procedural
        if (!piramide) {
            console.warn("Generando modelo 3D de pirámide escalonada ceremonial procedural como respaldo...");
            piramide = createFallbackPyramid();
        }
        updateProgress();

        // Asignación de Texturas y Materiales PBR
        if (sunGate) {
            sunGate.traverse((child) => {
                if (child.isMesh && child.material) {
                    const processMat = (mat) => {
                        if (!mat) return mat;
                        if (sgAlbedo) mat.map = sgAlbedo;
                        if (sgNormal) {
                            mat.normalMap = sgNormal;
                            if (mat.normalScale) mat.normalScale.set(0.6, 0.6);
                        }
                        if ('roughness' in mat) mat.roughness = 0.9;
                        if ('metalness' in mat) mat.metalness = 0.1;
                        if (mat.color && typeof mat.color.set === 'function') mat.color.set(0xffffff);
                        mat.needsUpdate = true;
                        return mat;
                    };
                    if (Array.isArray(child.material)) {
                        child.material.forEach(processMat);
                    } else {
                        processMat(child.material);
                    }
                }
            });
        }

        if (monolito) {
            monolito.traverse((child) => {
                if (child.isMesh && child.material) {
                    const processMat = (mat) => {
                        if (!mat) return mat;
                        const m = typeof mat.clone === 'function' ? mat.clone() : mat;
                        if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
                        if ('roughness' in m) m.roughness = 0.78;
                        if ('metalness' in m) m.metalness = 0.05;
                        if (sgNormal && 'normalMap' in m) {
                            m.normalMap = sgNormal;
                            if (m.normalScale) m.normalScale.set(0.35, 0.35);
                        }
                        if (m.color && typeof m.color.setHex === 'function') m.color.setHex(0xffffff);
                        m.needsUpdate = true;
                        return m;
                    };
                    if (Array.isArray(child.material)) {
                        child.material = child.material.map(processMat);
                    } else {
                        child.material = processMat(child.material);
                    }
                }
            });
        }

        if (chachapuma) {
            chachapuma.traverse((child) => {
                if (child.isMesh && child.material) {
                    const processMat = (mat) => {
                        if (!mat) return mat;
                        const m = typeof mat.clone === 'function' ? mat.clone() : mat;
                        if ('roughness' in m) m.roughness = 0.62;
                        if ('metalness' in m) m.metalness = 0.15;
                        if (sgNormal && 'normalMap' in m) {
                            m.normalMap = sgNormal;
                            if (m.normalScale) m.normalScale.set(0.4, 0.4);
                        }
                        if (m.color && typeof m.color.setHex === 'function') m.color.setHex(0xd0d2d6);
                        m.needsUpdate = true;
                        return m;
                    };
                    if (Array.isArray(child.material)) {
                        child.material = child.material.map(processMat);
                    } else {
                        child.material = processMat(child.material);
                    }
                }
            });
        }

        if (piramide) {
            piramide.traverse((child) => {
                if (child.isMesh && child.material) {
                    const configureMat = (origMat) => {
                        if (!origMat) return origMat;
                        const mat = typeof origMat.clone === 'function' ? origMat.clone() : origMat;
                        if (piramideAlbedo) mat.map = piramideAlbedo;
                        if (piramideNormal) mat.normalMap = piramideNormal;
                        if ('roughness' in mat) mat.roughness = 0.92;
                        if ('metalness' in mat) mat.metalness = 0.02;
                        if (mat.color && typeof mat.color.set === 'function') {
                            mat.color.set('#985e3c');
                        }
                        mat.needsUpdate = true;
                        return mat;
                    };

                    if (Array.isArray(child.material)) {
                        child.material = child.material.map(configureMat);
                    } else {
                        child.material = configureMat(child.material);
                    }
                }
            });
        }

        // Añadir modelos a la escena (ocultos inicialmente)
        [sunGate, monolito, chachapuma, piramide].forEach(m => {
            if (m) {
                m.position.set(0, 0, 0);
                m.visible = false;
                scene.add(m);
            }
        });

        // Registrar base de datos unificada
        modelDatabase = {
            sungate: { mesh: sunGate, ...ARCHAEOLOGY_DATA.sungate },
            monolito: { mesh: monolito, ...ARCHAEOLOGY_DATA.monolito },
            chachapuma: { mesh: chachapuma, ...ARCHAEOLOGY_DATA.chachapuma },
            piramide: { mesh: piramide, ...ARCHAEOLOGY_DATA.piramide }
        };

        // Configurar listeners de interfaz
        setupUIEvents();

        // Desvanecer pantalla de carga con GSAP
        gsap.to(loadingScreen, {
            opacity: 0,
            duration: 0.8,
            ease: "power2.out",
            onComplete: () => { loadingScreen.style.display = 'none'; }
        });

        // Activar modelo inicial
        switchModel('sungate');

    } catch (error) {
        console.error("Error al inicializar Tiwanaku 3D:", error);
        if (loadingPercentage) {
            loadingPercentage.innerText = "Error cargando recursos 3D. Por favor recarga la página.";
            loadingPercentage.style.color = "#ff6b6b";
        }
    }
}

// --- 4. CAMBIO DE MODELOS Y TRANSICIONES CINEMÁTICAS ---
function switchModel(modelKey) {
    const selectedData = modelDatabase[modelKey];
    if (!selectedData) return;

    currentModelKey = modelKey;

    // 1. Mostrar únicamente la malla 3D activa
    Object.values(modelDatabase).forEach(item => {
        item.mesh.visible = (item === selectedData);
    });

    // Control de OutlinePass con delineado rojo para el modelo Chachapuma
    if (outlinePass) {
        if (modelKey === 'chachapuma' && modelDatabase.chachapuma && modelDatabase.chachapuma.mesh) {
            outlinePass.selectedObjects = [modelDatabase.chachapuma.mesh];
            outlinePass.enabled = true;
        } else {
            outlinePass.selectedObjects = [];
            outlinePass.enabled = false;
        }
    }

    // 2. Actualizar textos de la ficha arqueológica
    if (panelTitle) panelTitle.innerText = selectedData.title;
    if (panelSubtitle) panelSubtitle.innerText = selectedData.subtitle;
    if (panelDesc) panelDesc.innerText = selectedData.desc;
    if (badgeMaterial) badgeMaterial.innerText = selectedData.material;
    if (badgePeriod) badgePeriod.innerText = selectedData.period;
    if (badgeDimensions) badgeDimensions.innerText = selectedData.dimensions;
    if (badgeDiscovery) badgeDiscovery.innerText = selectedData.discovery;
    if (galleryImage) galleryImage.src = selectedData.image;
    if (galleryCaption) galleryCaption.innerText = selectedData.imageCaption;

    // 3. Renderizar Hotspots asociados
    renderHotspots(selectedData.hotspots);

    // 4. Actualizar botones activos del selector inferior
    document.querySelectorAll('.model-card-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.model === modelKey);
    });

    // 5. Animación de cámara y punto de enfoque (GSAP interpola Vector3 suavemente)
    gsap.to(camera.position, {
        x: selectedData.camDefault.x,
        y: selectedData.camDefault.y,
        z: selectedData.camDefault.z,
        duration: 1.6,
        ease: "power3.inOut"
    });

    gsap.to(controls.target, {
        x: selectedData.camTarget.x,
        y: selectedData.camTarget.y,
        z: selectedData.camTarget.z,
        duration: 1.6,
        ease: "power3.inOut",
        onUpdate: () => controls.update()
    });
}

// --- 5. SISTEMA DE HOTSPOTS (PROYECCIÓN 3D A 2D) ---
function renderHotspots(hotspots = []) {
    // 1. Lista textual en la pestaña del panel lateral
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

    // 2. Marcadores interactivos (pines HTML sobre el canvas)
    if (hotspotsOverlay) {
        hotspotsOverlay.innerHTML = '';
        hotspots.forEach((hs, index) => {
            const pin = document.createElement('div');
            pin.className = 'hotspot-pin';
            pin.id = `pin-${hs.id}`;
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

/**
 * Proyección matemática 3D -> 2D para ubicar los pines HTML sobre el canvas WebGL en tiempo real.
 */
const tempVector = new THREE.Vector3();

function updateHotspotsPositions() {
    const currentData = modelDatabase[currentModelKey];
    if (!currentData || !currentData.hotspots || !hotspotsOverlay) return;

    currentData.hotspots.forEach((hs) => {
        const pin = document.getElementById(`pin-${hs.id}`);
        if (!pin) return;

        // Copiamos la coordenada 3D en el espacio mundial
        tempVector.copy(hs.pos);

        // .project(camera) aplica las matrices de Vista y Proyección de la cámara,
        // transformando la posición 3D a Coordenadas de Dispositivo Normalizadas (NDC: [-1, 1])
        tempVector.project(camera);

        // Si z > 1, el punto está detrás del plano de la cámara, por lo que lo ocultamos
        if (tempVector.z > 1) {
            pin.style.display = 'none';
            return;
        }

        // Convertimos el rango NDC [-1, 1] a pixeles reales de la pantalla [0, innerWidth / innerHeight]
        const screenX = (tempVector.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (-(tempVector.y * 0.5) + 0.5) * window.innerHeight;

        pin.style.display = 'block';
        pin.style.transform = `translate(-50%, -50%) translate(${screenX}px, ${screenY}px)`;
    });
}

function focusHotspot(hs) {
    if (!hs) return;

    // Acercamiento cinemático de cámara al detalle iconográfico
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

    // Cambiar automáticamente a la pestaña de puntos clave en el panel
    const tabBtn = document.querySelector('[data-tab="hotspots"]');
    if (tabBtn) tabBtn.click();
}

// --- 6. EVENTOS DE LA INTERFAZ DE USUARIO ---
function setupUIEvents() {
    // Selección de modelo (Tarjetas inferiores)
    document.querySelectorAll('.model-card-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const key = btn.dataset.model;
            if (key) switchModel(key);
        });
    });

    // Pestañas del Panel Lateral
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const target = document.getElementById(`tab-${btn.dataset.tab}`);
            if (target) target.classList.add('active');
        });
    });

    // Ocultar / Mostrar Panel Lateral
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

    // Selector de Atmósfera (Día, Ocaso, Noche)
    document.querySelectorAll('.btn-atmosphere').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-atmosphere').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const mode = btn.dataset.mode;
            const sky = mode === 'sunset' ? sunsetSkyTexture : mode === 'night' ? nightSkyTexture : originalSkyTexture;
            setAtmosphere(mode, sky);

            // Activar FilmPass cuando se pulsa el botón de la noche y todos los objetos están oscuros
            if (filmPass) {
                filmPass.enabled = (mode === 'night');
            }
        });
    });

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

    // Modal de Ubicación e Historia
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

// --- 7. BUCLE DE ANIMACIÓN (TICK DE RENDERIZADO) ---
function animate() {
    // Solicita al navegador ejecutar esta función antes del siguiente repintado de pantalla (~60fps)
    requestAnimationFrame(animate);

    // 1. Actualiza la amortiguación e inercia de los controles del mouse
    controls.update();

    // 2. Proyecta las posiciones 3D de los hotspots a coordenadas 2D de la pantalla
    updateHotspotsPositions();

    // 3. Dibuja la escena con postprocesamiento (RenderPass, OutlinePass, FilmPass y OutputPass)
    composer.render();
}

// Ajuste automático al redimensionar ventana (Responsive 3D)
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    composer.setSize(window.innerWidth, window.innerHeight);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if (outlinePass) {
        outlinePass.setSize(window.innerWidth, window.innerHeight);
    }
});

// Arrancar aplicación
init();
animate();
