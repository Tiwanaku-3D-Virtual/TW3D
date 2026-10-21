import * as THREE from 'three';
import { createScene } from './scene.js';
import { loadModel } from './loaders/modelLoader.js';
import { loadTexture } from './loaders/textureLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// --- 1. INICIALIZACIÓN DEL ENTORNO REUTILIZANDO SCENE.JS ---
const container = document.getElementById('tour-container');
const { scene, camera, renderer, controls } = createScene(container);

// --- CONFIGURACIÓN DE POSTPROCESAMIENTO ---
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// OutlinePass con delineado rojo para el Chachapuma
const outlinePass = new OutlinePass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    scene,
    camera,
    []
);
outlinePass.edgeStrength = 50.0;
outlinePass.edgeThickness = 15.0;
outlinePass.visibleEdgeColor.set("#ff0000");
outlinePass.hiddenEdgeColor.set("#003300");
composer.addPass(outlinePass);

const outputPass = new OutputPass();
composer.addPass(outputPass);

// Configuración de la cámara y controles para la vista panorámica del conjunto
camera.position.set(0, 5, 22);
controls.target.set(0, 2, -2);
controls.minDistance = 3;
controls.maxDistance = 140;
controls.maxPolarAngle = Math.PI / 2 - 0.02; // No permite descender bajo tierra
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Referencias a la UI de carga
const loadingScreen = document.getElementById('loading-screen');
const loadingBar = document.getElementById('loading-bar');
const loadingPercent = document.getElementById('loading-percent');

let loadedCount = 0;
const totalResources = 9;

function updateProgress() {
    loadedCount++;
    const percent = Math.min(100, Math.round((loadedCount / totalResources) * 100));
    if (loadingBar) loadingBar.style.width = `${percent}%`;
    if (loadingPercent) loadingPercent.innerText = `${percent}%`;

    if (loadedCount >= totalResources) {
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
                setTimeout(() => loadingScreen.style.display = 'none', 800);
            }
        }, 400);
    }
}

/**
 * Pirámide escalonada ceremonial de respaldo por si el archivo .glb falla
 */
function createFallbackPyramid() {
    const group = new THREE.Group();
    const levels = 7;
    const baseWidth = 45;
    const heightPerLevel = 1.6;
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

// --- 2. CARGA ASÍNCRONA DE ELEMENTOS Y TEXTURAS ---
async function initTour() {
    try {
        // 1. Cielo realista de los Andes (Equirectangular)
        const skyTexture = await loadTexture('assets/textures/cielos.png', {
            colorSpace: THREE.SRGBColorSpace,
            mapping: THREE.EquirectangularReflectionMapping
        }).catch((err) => {
            console.warn('No se pudo cargar textura de cielo:', err);
            return null;
        });

        if (skyTexture) {
            scene.background = skyTexture;
            scene.environment = skyTexture;
        }
        updateProgress();

        // 2. Piso de tierra rocosa auténtico de Tiwanaku
        const groundTexture = await loadTexture('assets/textures/GroundDirtRocky020_COL_2K.jpg', {
            colorSpace: THREE.SRGBColorSpace,
            wrapS: THREE.RepeatWrapping,
            wrapT: THREE.RepeatWrapping,
            repeat: new THREE.Vector2(40, 40)
        }).catch(() => null);

        const groundMat = groundTexture
            ? new THREE.MeshStandardMaterial({ map: groundTexture, roughness: 0.88, metalness: 0.08 })
            : new THREE.MeshStandardMaterial({ color: 0x8a5b3a, roughness: 0.95 });

        const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), groundMat);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.position.y = 0;
        groundMesh.receiveShadow = true;
        scene.add(groundMesh);
        updateProgress();

        // 3. Texturas PBR de la Puerta del Sol y de la Pirámide
        const [sgAlbedo, sgNormal, piramideAlbedo, piramideNormal] = await Promise.all([
            loadTexture('assets/textures/SunGate_albedo.png', {
                colorSpace: THREE.SRGBColorSpace,
                flipY: false,
                wrapS: THREE.RepeatWrapping,
                wrapT: THREE.RepeatWrapping
            }).catch(() => null),
            loadTexture('assets/textures/SunGate_normal.png', {
                wrapS: THREE.RepeatWrapping,
                wrapT: THREE.RepeatWrapping
            }).catch(() => null),
            loadTexture('assets/textures/piramide/509b3feffce3dcdd8a27aa21e92175a3.png', {
                colorSpace: THREE.SRGBColorSpace,
                wrapS: THREE.RepeatWrapping,
                wrapT: THREE.RepeatWrapping,
                repeat: new THREE.Vector2(2, 2)
            }).catch(() => null),
            loadTexture('assets/textures/piramide/b6da21e5e4fec73c0613b04789ddb478.png', {
                wrapS: THREE.RepeatWrapping,
                wrapT: THREE.RepeatWrapping,
                repeat: new THREE.Vector2(2, 2)
            }).catch(() => null)
        ]);
        updateProgress();

        // Helper para resolver rutas relativas tolerantes (assets/models o models/)
        const resolveModel = async (relativePath, options = {}) => {
            const paths = [
                `assets/models/${relativePath}`,
                `models/${relativePath}`
            ];
            for (const path of paths) {
                try {
                    const loaded = await loadModel(path, options);
                    if (loaded) return loaded;
                } catch (e) {
                    // Intenta con la siguiente alternativa
                }
            }
            return null;
        };

        // --- 4. CARGA Y DISTRIBUCIÓN DE MODELOS 3D SIMULTÁNEA ---

        // A. Puerta del Sol (Centro de la composición)
        const sunGate = await resolveModel('SunGate.glb', { autoCenter: true });
        if (sunGate) {
            sunGate.position.set(0, 0, 0); // Centro de la explanada
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
                    if (Array.isArray(child.material)) child.material.forEach(processMat);
                    else processMat(child.material);
                }
            });
            scene.add(sunGate);
        }
        updateProgress();

        // B. Monolito Ponce (A la derecha de la Puerta del Sol)
        const monolito = await resolveModel('monolito_ponce.glb', { scale: 0.03, autoCenter: true });
        if (monolito) {
            monolito.position.set(7.5, 0, 2);
            monolito.rotation.y = -Math.PI / 4; // Mirando hacia el centro
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
                    if (Array.isArray(child.material)) child.material = child.material.map(processMat);
                    else child.material = processMat(child.material);
                }
            });
            scene.add(monolito);
        }
        updateProgress();

        // C. Chachapuma (Guardián a la izquierda de la Puerta del Sol)
        const chachapuma = await resolveModel('chachapuma.glb', { scale: 0.017, autoCenter: true });
        if (chachapuma) {
            chachapuma.position.set(-6.5, 0, 3.5);
            chachapuma.rotation.y = Math.PI / 4; // Mirando hacia el centro
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
                    if (Array.isArray(child.material)) child.material = child.material.map(processMat);
                    else child.material = processMat(child.material);
                }
            });
            scene.add(chachapuma);
            if (outlinePass) {
                outlinePass.selectedObjects = [chachapuma];
            }
        }
        updateProgress();

        // D. Pirámide de Akapana (Al fondo, coronando el paisaje arqueológico)
        let piramide = null;
        const pyramidCandidates = [
            'piramide2.glb.glb',
            'piramide2.glb',
            'pira.glb',
            'piramide.glb'
        ];
        for (const candidate of pyramidCandidates) {
            piramide = await resolveModel(candidate, { autoCenter: true, fitSize: 45 });
            if (piramide) break;
        }

        if (!piramide) {
            console.warn('Usando pirámide de Akapana procedural');
            piramide = createFallbackPyramid();
        }

        if (piramide) {
            piramide.position.set(0, 0, -50); // Al fondo de la escena
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
                    if (Array.isArray(child.material)) child.material = child.material.map(configureMat);
                    else child.material = configureMat(child.material);
                }
            });
            scene.add(piramide);
        }
        updateProgress();

        // Actualizaciones finales de recursos
        updateProgress();
        updateProgress();

    } catch (error) {
        console.error('Error inicializando el recorrido escénico de Tiwanaku:', error);
        // En caso de error, ocultar loading para no bloquear la pantalla
        if (loadingScreen) loadingScreen.classList.add('hidden');
    }
}

// Iniciar carga
initTour();

// Adaptación responsiva al cambiar el tamaño de ventana
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

// Bucle de renderizado constante
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    composer.render();
}
animate();
