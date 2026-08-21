import * as THREE from 'three';
import gsap from 'gsap'; 
import { createScene } from './scene.js';
import { loadModel } from './loaders/modelLoader.js';
import { loadTexture } from './loaders/textureLoader.js';

const container = document.getElementById('webgl-container');
const { scene, camera, renderer, controls } = createScene(container);

// Referencias a la UI
const panelTitle = document.getElementById('panel-title');
const panelDesc = document.getElementById('panel-desc');

// Variables globales para los modelos
let modelDatabase = {};

async function init() {
    try {
        // Carga de texturas (igual que tu versión anterior)
        const [skyTexture, groundTexture, sgAlbedo, monoTexture, piramideAlbedo, piramideNormal] = await Promise.all([
            loadTexture('assets/textures/cielos.png', { colorSpace: THREE.SRGBColorSpace, mapping: THREE.EquirectangularReflectionMapping }),
            loadTexture('assets/textures/GroundDirtRocky020_COL_2K.jpg', { colorSpace: THREE.SRGBColorSpace, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping, repeat: new THREE.Vector2(40, 40) }),
            loadTexture('assets/textures/SunGate_albedo.png', { colorSpace: THREE.SRGBColorSpace, flipY: false, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping }),
            loadTexture('assets/textures/monolito_texture.jpeg', { colorSpace: THREE.SRGBColorSpace, flipY: false }),
            loadTexture('assets/textures/piramide/509b3feffce3dcdd8a27aa21e92175a3.png', { colorSpace: THREE.SRGBColorSpace, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping, repeat: new THREE.Vector2(2, 2) }),
            loadTexture('assets/textures/piramide/b6da21e5e4fec73c0613b04789ddb478.png', { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping, repeat: new THREE.Vector2(2, 2) }).catch(() => null)
        ]);

        scene.background = skyTexture;
        scene.environment = skyTexture;

        // Entorno (Piso)
        const groundGeometry = new THREE.PlaneGeometry(400, 400); 
        const groundMaterial = new THREE.MeshStandardMaterial({ map: groundTexture, roughness: 0.9, metalness: 0.1 });
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.position.y = 0;
        groundMesh.receiveShadow = true;
        scene.add(groundMesh);

        // Carga de Modelos
        const [sunGate, monolito, chachapuma, piramide] = await Promise.all([
            loadModel('assets/models/SunGate.glb'),
            loadModel('assets/models/monolito_ponce.glb'),
            loadModel('assets/models/chachapuma.glb'),
            loadModel('assets/models/piramide.glb', { autoCenter: true }) 
        ]);

        // --- APLICACIÓN DE TEXTURAS ---
        sunGate.traverse((child) => { if (child.isMesh && child.material) { child.material.map = sgAlbedo; child.material.color.set(0xffffff); child.material.needsUpdate = true; }});
        monolito.traverse((child) => { if (child.isMesh && child.material) { child.material = child.material.clone(); child.material.map = monoTexture; child.material.color.set(0xffffff); child.material.needsUpdate = true; }});
        piramide.traverse((child) => { if (child.isMesh && child.material) { child.material = child.material.clone(); child.material.map = piramideAlbedo; if (piramideNormal) child.material.normalMap = piramideNormal; child.material.roughness = 1; child.material.metalness = 0; child.material.color.set(0xffffff); child.material.needsUpdate = true; }});

        // --- LÓGICA DE CENTRADO Y BASE DE DATOS ---
        // Todos los modelos van al centro (0,0,0) pero ocultos por defecto
        [sunGate, monolito, chachapuma, piramide].forEach(m => {
            m.position.set(0, 0, 0);
            m.visible = false;
            scene.add(m);
        });

        // Guardamos los datos asociados a cada modelo para la UI y la cámara
        modelDatabase = {
            sungate: { 
                mesh: sunGate, 
                title: "Puerta del Sol", 
                text: "Este monumental portal lítico es uno de los íconos más importantes de Tiwanaku. Destaca el 'Señor de los Báculos' en su friso central, rodeado de figuras aladas.", 
                camPos: new THREE.Vector3(8, 2, 0) 
            },
            monolito: { 
                mesh: monolito, 
                title: "Monolito Ponce", 
                text: "Estela antropomorfa de andesita que representa a un dignatario o sacerdote de la cultura Tiwanaku. Está profusamente decorada con iconografía que incluye hombres-cóndor y motivos escalonados.", 
                camPos: new THREE.Vector3(0, 3, 10) 
            },
            chachapuma: { 
                mesh: chachapuma, 
                title: "Chachapuma", 
                text: "Representación del hombre-puma, una deidad guerrera y protectora en la cosmovisión andina. Estas esculturas solían colocarse en las entradas de los templos como guardianes.", 
                camPos: new THREE.Vector3(0, 1.5, 6) 
            },
            piramide: { 
                mesh: piramide, 
                title: "Pirámide de Akapana", 
                text: "Imponente estructura piramidal escalonada, una de las construcciones más grandes del sitio arqueológico. Originalmente diseñada con siete terrazas superpuestas y un complejo sistema de drenaje.", 
                camPos: new THREE.Vector3(0, 15, 45) // Cámara más lejana porque es muy grande
            }
        };

        // Eventos del menú desplegable
        setupMenuEvents();

        // Mostrar el primer modelo por defecto
        switchModel('sungate');

    } catch (error) {
        console.error("Error cargando los recursos:", error);
    }
}

// Función principal que alterna modelos y actualiza la UI
function switchModel(modelKey) {
    const selectedData = modelDatabase[modelKey];
    if (!selectedData) return;

    // 1. Ocultar todas las mallas
    Object.values(modelDatabase).forEach(data => {
        data.mesh.visible = false;
    });

    // 2. Mostrar solo la seleccionada
    selectedData.mesh.visible = true;

    // 3. Actualizar textos en el panel lateral HTML
    panelTitle.innerText = selectedData.title;
    panelDesc.innerText = selectedData.text;

    // 4. Mover la cámara a la posición ideal de este objeto
    gsap.to(camera.position, {
        x: selectedData.camPos.x,
        y: selectedData.camPos.y,
        z: selectedData.camPos.z,
        duration: 1.5,
        ease: "power3.inOut"
    });

    // Asegurarse de que el control de órbita siempre mire al centro
    gsap.to(controls.target, {
        x: 0, y: selectedData.camPos.y / 2, z: 0,
        duration: 1.5,
        ease: "power3.inOut",
        onUpdate: () => controls.update()
    });
}

function setupMenuEvents() {
    document.getElementById('nav-sungate').addEventListener('click', (e) => { e.preventDefault(); switchModel('sungate'); });
    document.getElementById('nav-monolito').addEventListener('click', (e) => { e.preventDefault(); switchModel('monolito'); });
    document.getElementById('nav-chachapuma').addEventListener('click', (e) => { e.preventDefault(); switchModel('chachapuma'); });
    document.getElementById('nav-piramide').addEventListener('click', (e) => { e.preventDefault(); switchModel('piramide'); });
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
animate();