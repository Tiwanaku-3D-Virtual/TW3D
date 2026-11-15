import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createKalasasaya } from './estructuras/kalasasaya.js';
import { createKheriKala } from './estructuras/auxiliares.js';
import { createTemplete } from './estructuras/templo-semisubterraneo.js';
import { loadLocalModel } from './modelos-3d.js';

// ==========================================================================
// CATÁLOGO DE LOS 10 MONUMENTOS HISTÓRICOS DE TIWANAKU
// ==========================================================================
const MONUMENTOS = [
  {
    key: 'puertaSol',
    nombre: 'Puerta del Sol',
    subtitulo: 'Portal del Señor de los Báculos',
    icono: '☀️',
    periodo: '500–900 d.C.',
    modelType: 'gltf',
    path: 'assets/models/SunGate.glb',
    albedoPath: 'assets/textures/SunGate_albedo.png',
    normalPath: 'assets/textures/SunGate_normal.png',
    rotationY: -Math.PI / 2,
    fitSize: 4.8,
    targetY: 2.0,
    camDist: 8.5,
    pitchAngle: 0.16,
    audio: 'assets/audio/Puerta del Sol.mp3',
    imagen: 'assets/images/sungate.jpg',
    descripcion: 'Portal ceremonial monolítico labrado en una sola pieza de andesita de más de diez toneladas. Es la cúspide de la litoescultura y cosmología tiwanakota.',
    funcion: 'Monumento ceremonial y marcador calendárico de los solsticios y equinoccios andinos.',
    datoCurioso: 'El friso superior exhibe a la divinidad central sosteniendo dos báculos, rodeada por 48 seres alados en actitud ritual.',
    puntos: [
      {
        titulo: 'Figura central (Señor de los Báculos)',
        relato: 'El friso exhibe a la divinidad solar sosteniendo báculos sagrados con remates de cabezas de cóndor, rodeada por 48 seres alados en actitud ritual.',
        posicion: { x: 0, y: 2.75, z: 0.52 },
        vista: { x: 0, y: 2.75, z: 3.0 }
      },
      {
        titulo: 'Friso y seres alados',
        relato: 'Tres hileras de bajorrelieves representan personajes con máscaras de aves y atributos solares que convergen hacia el eje ceremonial.',
        posicion: { x: 1.4, y: 2.65, z: 0.52 },
        vista: { x: 1.2, y: 2.65, z: 2.8 }
      },
      {
        titulo: 'Vano monolítico',
        relato: 'Abertura tallada en el bloque macizo de andesita que enmarcaba el horizonte y el paso ritual hacia el interior de Kalasasaya.',
        posicion: { x: 0, y: 1.15, z: 0 },
        vista: { x: 0, y: 1.15, z: 3.2 }
      },
      {
        titulo: 'Portal de andesita',
        relato: 'Pieza única de roca volcánica de más de 10 toneladas, labrada con tal precisión geométrica que asombró a los primeros cronistas.',
        posicion: { x: -1.55, y: 1.7, z: 0.52 },
        vista: { x: -1.5, y: 1.7, z: 3.0 }
      }
    ]
  },
  {
    key: 'puertaLuna',
    nombre: 'Puerta de la Luna',
    subtitulo: 'Portal ceremonial norte',
    icono: '🌙',
    periodo: '500–900 d.C.',
    modelType: 'gltf',
    path: 'assets/models/luna.glb',
    fitSize: 4.8,
    targetY: 2.2,
    camDist: 8.5,
    pitchAngle: 0.16,
    audio: 'assets/audio/puerta_luna.mp3',
    imagen: 'assets/images/Puerta_de_la_Luna.jpeg',
    descripcion: 'Monumento monolítico de andesita ubicado en el sector norte de Tiwanaku. Conserva bajorrelieves de figuras zoomorfas y antropomorfas aladas.',
    funcion: 'Portal ceremonial vinculado a los senderos sagrados y ciclos astronómicos lunares.',
    datoCurioso: 'Sus motivos iconográficos guardan una notable antigüedad estilística y conectan los ejes sagrados con la cordillera.',
    puntos: [
      {
        titulo: 'Dintel y relieves alados',
        relato: 'El friso superior conserva figuras aladas y motivos escalonados tallados con gran detalle simbólico en la andesita.',
        posicion: { x: 0, y: 2.7, z: 0.2 },
        vista: { x: 0, y: 2.7, z: 2.8 }
      },
      {
        titulo: 'Vano ceremonial',
        relato: 'El umbral central comunicaba los senderos ceremoniales del sector norte con los grandes templos centrales.',
        posicion: { x: 0, y: 1.2, z: 0 },
        vista: { x: 0, y: 1.2, z: 3.0 }
      },
      {
        titulo: 'Alineación astronómica',
        relato: 'Su orientación fija guardaba relación directa con los ciclos astronómicos y lunares del altiplano andino.',
        posicion: { x: 1.4, y: 1.8, z: 0.2 },
        vista: { x: 1.3, y: 1.8, z: 2.8 }
      }
    ]
  },
  {
    key: 'bennett',
    nombre: 'Monolito Bennett',
    subtitulo: 'Colosal estela Pachamama',
    icono: '🗿',
    periodo: 'Época urbana tardía',
    modelType: 'gltf',
    path: 'assets/models/Monolito.glb',
    fitSize: 7.4,
    targetY: 3.6,
    camDist: 10.8,
    pitchAngle: 0.15,
    audio: 'assets/audio/Monolito Bennett.mp3',
    imagen: 'assets/images/Monolito_Bennett.jpeg',
    descripcion: 'La escultura antropomorfa más imponente hallada en Tiwanaku, con 7.3 metros de altura, esculpida en una sola pieza de arenisca roja.',
    funcion: 'Emblema sagrado de fertilidad cósmica, autoridad y linaje ceremonial.',
    datoCurioso: 'Descubierto en 1932 por Wendell Bennett en el patio de Kalasasaya; hoy se preserva en el Museo Lítico de Tiwanaku.',
    puntos: [
      {
        titulo: 'Corona y tocado ceremonial',
        relato: 'En la parte superior se observa un tocado complejo con motivos geométricos y ojos radiantes con lágrimas de serpientes.',
        posicion: { x: 0, y: 6.3, z: 0.8 },
        vista: { x: 0, y: 6.3, z: 3.6 }
      },
      {
        titulo: 'Bandas de relieves y faja',
        relato: 'El torso está cubierto de 30 bandas de figuras antropomorfas, llamas sagradas, felinos y plantas andinas labradas con minucia.',
        posicion: { x: 0, y: 4.3, z: 0.85 },
        vista: { x: 0, y: 4.3, z: 3.5 }
      },
      {
        titulo: 'Coloso de arenisca roja',
        relato: 'Con 7.3 metros de altura y 20 toneladas de peso, es la mayor escultura monolítica de toda la región de los Andes sur.',
        posicion: { x: 0, y: 1.8, z: 0.8 },
        vista: { x: 0, y: 2.2, z: 4.2 }
      }
    ]
  },
  {
    key: 'monolito',
    nombre: 'Monolito Ponce',
    subtitulo: 'Estela antropomorfa de andesita',
    icono: '🗿',
    periodo: '500–900 d.C.',
    modelType: 'gltf',
    path: 'assets/models/monolito_ponce.glb',
    fitSize: 5.6,
    targetY: 2.7,
    camDist: 8.8,
    pitchAngle: 0.16,
    audio: 'assets/audio/Monolito Ponce.mp3',
    imagen: 'assets/images/Monolito_ponce.jpeg',
    descripcion: 'Estela de andesita grisácea finamente pulida que presidía el centro del Templete Semisubterráneo, cubierta por bandas geométricas.',
    funcion: 'Imagen ritual que ordenaba la mirada y el recogimiento en el patio hundido.',
    datoCurioso: 'Sus manos sostienen un vaso ceremonial kero y una tableta ritual finamente cincelada.',
    puntos: [
      {
        titulo: 'Rostro y orejeras rituales',
        relato: 'Rostro frontal imponente con lágrimas grabadas en las mejillas y bandas cefálicas que distinguían a la nobleza teocrática.',
        posicion: { x: 0, y: 4.7, z: 0.65 },
        vista: { x: 0, y: 4.7, z: 3.0 }
      },
      {
        titulo: 'Vaso kero y tableta',
        relato: 'Las manos sostienen a la altura del pecho un vaso ceremonial de libación (kero) y una tableta de sahumerio ritual.',
        posicion: { x: 0, y: 3.1, z: 0.7 },
        vista: { x: 0, y: 3.1, z: 2.8 }
      },
      {
        titulo: 'Vestimenta y faja sagrada',
        relato: 'El faldellín inferior exhibe iconografía escalonada de montañas y meandros de agua representativos del ciclo vital.',
        posicion: { x: 0, y: 1.4, z: 0.65 },
        vista: { x: 0, y: 1.8, z: 3.2 }
      }
    ]
  },
  {
    key: 'chachapuma',
    nombre: 'Chachapuma',
    subtitulo: 'Guardián felino de basalto',
    icono: '🐆',
    periodo: 'Cultura Tiwanaku',
    modelType: 'gltf',
    path: 'assets/models/chachapuma.glb',
    fitSize: 3.8,
    targetY: 1.8,
    camDist: 6.8,
    pitchAngle: 0.18,
    audio: 'assets/audio/Chachapuma.mp3',
    imagen: 'assets/images/chachapuma.png',
    descripcion: 'Escultura de basalto volcánico oscuro que conjuga rasgos humanos y felinos en actitud de acecho y recogimiento ceremonial.',
    funcion: 'Imagen de custodia ritual colocada al pie de la escalinata occidental de Akapana.',
    datoCurioso: 'La figura sostiene entre sus garras una cabeza trofeo, símbolo de ofrenda y poder sagrado en el altiplano.',
    puntos: [
      {
        titulo: 'Máscara y fauces felinas',
        relato: 'Híbrido mítico humano-puma esculpido en basalto negro con ojos almendrados y fauces felinas en actitud de rugido ceremonial.',
        posicion: { x: 0, y: 2.7, z: 0.65 },
        vista: { x: 0, y: 2.7, z: 2.4 }
      },
      {
        titulo: 'Cabeza trofeo',
        relato: 'Sostiene sobre sus rodillas una cabeza humana cercenada, simbolizando el pacto sagrado de la vida, muerte y fertilidad.',
        posicion: { x: 0, y: 1.7, z: 0.75 },
        vista: { x: 0, y: 1.7, z: 2.2 }
      },
      {
        titulo: 'Basalto pulido de Akapana',
        relato: 'Custodiaba el acceso principal de la gran pirámide de Akapana, tallado en piedra volcánica extraída de canteras lejanas.',
        posicion: { x: 0, y: 0.6, z: 0.6 },
        vista: { x: 0, y: 1.0, z: 2.6 }
      }
    ]
  },
  {
    key: 'akapana',
    nombre: 'Pirámide de Akapana',
    subtitulo: 'Montaña sagrada escalonada',
    icono: '⛰️',
    periodo: '400–1000 d.C.',
    modelType: 'gltf',
    path: 'assets/models/piramide2.glb.glb',
    albedoPath: 'assets/textures/akapana/509b3feffce3dcdd8a27aa21e92175a3.png',
    tint: '#7a5639',
    fitSize: 32.0,
    scaleY: 2.1,
    targetY: 3.2,
    camDist: 38.0,
    pitchAngle: 0.16,
    audio: 'assets/audio/Pirámide de Akapana.mp3',
    imagen: 'assets/images/Pirámide_de_Akapana,_Tiwanaku.jpeg',
    descripcion: 'Colosal estructura piramidal de 7 terrazas superpuestas que emula los cerros tutelares sagrados (Achachilas) del altiplano.',
    funcion: 'Centro ritual supremo, político y astronómico con una compleja red de canales hidráulicos interiores.',
    datoCurioso: 'Durante las lluvias ceremoniales, el agua circulaba por ductos líticos ocultos vertiéndose en cascadas sonoras rituales.',
    puntos: [
      {
        titulo: 'Cima ceremonial',
        relato: 'La plataforma superior dominaba todo el valle sagrado de Tiwanaku y albergaba recintos sagrados dedicados al culto solar.',
        posicion: { x: 0, y: 7.0, z: 0 },
        vista: { x: 0, y: 8.2, z: 16.0 }
      },
      {
        titulo: 'Terrazas escalonadas',
        relato: 'Siete plataformas superpuestas revestidas con sillares de andesita y arenisca que evocan la forma de una montaña sagrada.',
        posicion: { x: -8.5, y: 3.8, z: 2.0 },
        vista: { x: -11.0, y: 5.2, z: 13.0 }
      },
      {
        titulo: 'Sistema hidráulico de drenaje',
        relato: 'Red subterránea de ductos de piedra que conducía el agua de lluvia desde la cima en cascadas ceremoniales interiores.',
        posicion: { x: 0, y: 1.2, z: 14.5 },
        vista: { x: 0, y: 3.0, z: 22.0 }
      }
    ]
  },
  {
    key: 'kalasasaya',
    nombre: 'Kalasasaya',
    subtitulo: 'Templo de las piedras paradas',
    icono: '🏛️',
    periodo: '500–900 d.C.',
    modelType: 'composite-kalasasaya',
    fitSize: 26.0,
    targetY: 2.2,
    camDist: 30.0,
    pitchAngle: 0.22,
    audio: 'assets/audio/Kalasasaya.mp3',
    imagen: 'assets/images/Kalasasaya.jpeg',
    descripcion: 'Gran plataforma ceremonial rectangular delimitada por pilares megalíticos verticales y muros de sillares de andesita labrada.',
    funcion: 'Observatorio solar de alta precisión y recinto de grandes celebraciones comunitarias.',
    datoCurioso: 'Sus accesos y pilares perimetrales permitían fijar los solsticios de junio y diciembre con exactitud milimétrica.',
    puntos: [
      {
        titulo: 'Pilares megalíticos',
        relato: 'Grandes monolitos verticales de arenisca y andesita que delimitaban el perímetro ceremonial a intervalos regulares.',
        posicion: { x: -12.0, y: 2.4, z: 0 },
        vista: { x: -13.0, y: 3.2, z: 8.0 }
      },
      {
        titulo: 'Patio interior y estela',
        relato: 'Espacio ceremonial central donde se congregaban los sacerdotes y observadores durante las solemnidades públicas.',
        posicion: { x: 0, y: 1.8, z: 0 },
        vista: { x: 0, y: 3.5, z: 7.5 }
      },
      {
        titulo: 'Escalinata monumental',
        relato: 'Acceso oriental labrado en seis peldaños de andesita monolítica orientado exactamente al orto solar de los equinoccios.',
        posicion: { x: 0, y: 1.6, z: 9.8 },
        vista: { x: 0, y: 3.0, z: 14.0 }
      }
    ]
  },
  {
    key: 'pumaPunku',
    nombre: 'Puma Punku',
    subtitulo: 'Bloques H y cantería de precisión',
    icono: '🧩',
    periodo: '600–1000 d.C.',
    modelType: 'composite-pumapunku',
    fitSize: 12.0,
    targetY: 1.8,
    camDist: 14.5,
    pitchAngle: 0.18,
    audio: 'assets/audio/Puma Punku.mp3',
    imagen: 'assets/images/PUMA_PUNKU.jpeg',
    descripcion: 'Complejo de plataformas monumentales célebre por sus bloques en forma de H tallados con cortes rectos y ensambles precisos.',
    funcion: 'Conjunto monumental de asambleas sagradas y recepción de peregrinaciones altiplánicas.',
    datoCurioso: 'Sus bloques de andesita utilizaban grapas metálicas fundidas in situ para amortiguar movimientos sísmicos.',
    puntos: [
      {
        titulo: 'Bloques en forma de H',
        relato: 'Sillares milimétricamente tallados con ángulos rectos perfectos, estrías y rebajes diseñados para acoplarse modularmente.',
        posicion: { x: -3.8, y: 1.8, z: 0 },
        vista: { x: -3.8, y: 2.2, z: 4.8 }
      },
      {
        titulo: 'Cantería de andesita',
        relato: 'Bloques pétreos de extrema dureza trabajados con herramientas líticas y abrasivos de cuarzo hasta lograr superficies pulidas.',
        posicion: { x: 3.8, y: 1.8, z: 0 },
        vista: { x: 3.8, y: 2.2, z: 4.8 }
      },
      {
        titulo: 'Plataforma y grapas metálicas',
        relato: 'Los cimientos incluían cajas de espigas talladas donde se vertía bronce arsenical para unir los sillares contra sismos.',
        posicion: { x: 0, y: 0.8, z: 0 },
        vista: { x: 0, y: 1.8, z: 5.5 }
      }
    ]
  },
  {
    key: 'templo',
    nombre: 'Templete Semisubterráneo',
    subtitulo: 'Patio hundido con cabezas clavas',
    icono: '🏺',
    periodo: '500–900 d.C.',
    modelType: 'composite-templete',
    fitSize: 22.0,
    targetY: 1.2,
    camDist: 26.0,
    pitchAngle: 0.22,
    audio: 'assets/audio/Templete Semisubterráneo.mp3',
    imagen: 'assets/images/templete_semisubterráneo.jpeg',
    descripcion: 'Patio ceremonial cuadrangular excavado bajo el nivel del terreno, cuyos muros reúnen decenas de rostros de piedra empotrados.',
    funcion: 'Espacio de comunión sagrada con los ancestros, el agua subterránea y la fertilidad de la tierra.',
    datoCurioso: 'Las cabezas clavas exhiben rasgos diversos, tocados y ornamentos representativos de múltiples pueblos de la región andina.',
    puntos: [
      {
        titulo: 'Escalinata sur de acceso',
        relato: 'Siete peldaños líticos que descienden más de dos metros hacia el interior del patio sagrado bajo el nivel del suelo.',
        posicion: { x: 0, y: 1.8, z: 12.5 },
        vista: { x: 0, y: 3.2, z: 16.0 }
      },
      {
        titulo: 'Cabezas clavas empotradas',
        relato: 'Decenas de rostros de piedra caliza esculpidos con diversos rasgos étnicos andinos, fijos en las paredes del patio.',
        posicion: { x: -5.5, y: 1.5, z: 3.5 },
        vista: { x: -6.5, y: 2.5, z: 8.5 }
      },
      {
        titulo: 'Patio hundido ceremonial',
        relato: 'Recinto cuadrangular con piso de losas pulidas donde se realizaban ofrendas al agua subterránea y a los ancestros.',
        posicion: { x: 0, y: 0.6, z: -1.2 },
        vista: { x: 0, y: 3.0, z: 8.5 }
      },
      {
        titulo: 'Monolito Ponce central',
        relato: 'La estela antropomorfa se elevaba erguida en el centro del patio como eje del cosmos y punto focal del templo.',
        posicion: { x: 0, y: 2.5, z: 0 },
        vista: { x: 0, y: 3.5, z: 6.5 }
      }
    ]
  },
  {
    key: 'kheriKala',
    nombre: 'Kheri Kala',
    subtitulo: 'Recinto ceremonial de patios',
    icono: '🧱',
    periodo: '500–900 d.C.',
    modelType: 'composite-kherikala',
    fitSize: 18.0,
    targetY: 1.4,
    camDist: 22.0,
    pitchAngle: 0.20,
    audio: 'assets/audio/Kheri Kala.mp3',
    imagen: null,
    descripcion: 'Plataforma con recintos y patios delimitados por sillares de piedra que complementaban el tejido cívico y religioso de Tiwanaku.',
    funcion: 'Área de recintos para dignatarios y ceremonias vinculadas a los templos mayores.',
    datoCurioso: 'Su diseño ordenado demuestra la planificación urbana integral de las áreas que rodeaban a las plazas principales.',
    puntos: [
      {
        titulo: 'Recintos ceremoniales',
        relato: 'Estructuras de muros dobles de piedra que albergaban habitaciones rituales y áreas de descanso para dignatarios.',
        posicion: { x: -4.5, y: 1.4, z: 0 },
        vista: { x: -4.5, y: 2.2, z: 6.0 }
      },
      {
        titulo: 'Patios y altares líticos',
        relato: 'Espacios abiertos adoquinados que conectaban el complejo de Kheri Kala con la gran plaza de Kalasasaya.',
        posicion: { x: 4.5, y: 1.4, z: 0 },
        vista: { x: 4.5, y: 2.2, z: 6.0 }
      }
    ]
  }
];

// ==========================================================================
// CONFIGURACIÓN DE ESCENA THREE.JS Y RENDERIZADOR CINEMATOGRÁFICO
// ==========================================================================
const container = document.querySelector('#exhibicion-canvas');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3.2, 12);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.04; // Impide que la cámara pase por debajo del podio
controls.minDistance = 2.0;
controls.maxDistance = 65.0;
controls.autoRotate = false;
controls.autoRotateSpeed = 0.8;

// ==========================================================================
// SISTEMA DE POST-PROCESAMIENTO: EFECTO OUTLINE DORADO CEREMONIAL
// ==========================================================================
const composer = new EffectComposer(renderer);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const outlinePass = new OutlinePass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  scene,
  camera
);
outlinePass.edgeStrength = 4.2;
outlinePass.edgeGlow = 0.95;
outlinePass.edgeThickness = 1.8;
outlinePass.pulsePeriod = 0; // Contorno dorado nítido y constante como en la referencia
outlinePass.visibleEdgeColor.set('#ffd54f'); // Resplandor dorado ceremonial
outlinePass.hiddenEdgeColor.set('#7a5200');  // Tono ámbar profundo
composer.addPass(outlinePass);

const outputPass = new OutputPass();
composer.addPass(outputPass);

// ==========================================================================
// SISTEMA DE ILUMINACIÓN DE EXHIBICIÓN (LUZ PRINCIPAL, RIM LIGHT, FILL)
// ==========================================================================
const sunLight = new THREE.DirectionalLight(0xfff8e7, 2.4);
sunLight.position.set(20, 24, 18);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 85;
sunLight.shadow.camera.left = -22;
sunLight.shadow.camera.right = 22;
sunLight.shadow.camera.top = 22;
sunLight.shadow.camera.bottom = -22;
sunLight.shadow.bias = -0.00035;
scene.add(sunLight);

// Luz de contorno (Rim Light) colocada detrás del modelo para resaltar la silueta y tallados
const rimLight = new THREE.DirectionalLight(0xffbe6a, 2.0);
rimLight.position.set(-18, 16, -22);
scene.add(rimLight);

// Luz de relleno suave (Fill Light)
const fillLight = new THREE.DirectionalLight(0xc2ad93, 0.8);
fillLight.position.set(-20, 10, 15);
scene.add(fillLight);

// Luz ambiental hemisférica para conservar detalle en las sombras
const hemiLight = new THREE.HemisphereLight(0xe8d2b0, 0x423326, 0.85);
scene.add(hemiLight);

// Niebla atmosférica sutil
scene.fog = new THREE.FogExp2(0x281813, 0.0035);

// ==========================================================================
// PODIO Y EXPLANADA CEREMONIAL DE EXHIBICIÓN
// ==========================================================================
const textureLoader = new THREE.TextureLoader();
const podiumTex = textureLoader.load('assets/textures/GroundDirtRocky020_COL_2K.jpg');
podiumTex.colorSpace = THREE.SRGBColorSpace;
podiumTex.wrapS = podiumTex.wrapT = THREE.RepeatWrapping;
podiumTex.repeat.set(12, 12);

const podiumMat = new THREE.MeshStandardMaterial({
  map: podiumTex,
  color: 0x5a483a,
  roughness: 0.90,
  metalness: 0.03
});

// Gran plataforma circular ceremonial que recibe las sombras
const podiumGeo = new THREE.CylinderGeometry(42, 44, 0.6, 64);
const podium = new THREE.Mesh(podiumGeo, podiumMat);
podium.position.y = -0.3;
podium.receiveShadow = true;
scene.add(podium);

// Borde biselado ceremonial de andesita con resplandor dorado sutil
const rimRingGeo = new THREE.TorusGeometry(42, 0.18, 16, 96);
rimRingGeo.rotateX(Math.PI / 2);
const rimRingMat = new THREE.MeshStandardMaterial({
  color: 0xd4a737,
  roughness: 0.6,
  metalness: 0.25
});
const rimRing = new THREE.Mesh(rimRingGeo, rimRingMat);
rimRing.position.y = 0.01;
scene.add(rimRing);

// Dos pebeteros de exhibición flanqueando la vista
let torchGroup = new THREE.Group();
scene.add(torchGroup);

function createDisplayTorch(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);

  const baseGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.35, 16);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x4a3b2c, roughness: 0.9 });
  const b = new THREE.Mesh(baseGeo, baseMat);
  b.position.y = 0.675;
  b.castShadow = b.receiveShadow = true;
  g.add(b);

  const flameGeo = new THREE.ConeGeometry(0.16, 0.45, 8);
  flameGeo.translate(0, 0.22, 0);
  const flameMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.0, 1.4, 0.3) });
  const f = new THREE.Mesh(flameGeo, flameMat);
  f.position.y = 1.35;
  g.add(f);

  const light = new THREE.PointLight(0xff8c3b, 1.8, 18, 1.6);
  light.position.set(0, 1.5, 0);
  g.add(light);

  g.userData = { flame: f, light, baseIntensity: 1.8 };
  torchGroup.add(g);
  return g;
}

const displayTorch1 = createDisplayTorch(-8.5, 6.0);
const displayTorch2 = createDisplayTorch(8.5, 6.0);

// ==========================================================================
// GESTIÓN DE ATMÓSFERAS (DÍA, OCASO, NOCHE) CON TEXTURAS PANORÁMICAS REALES
// ==========================================================================
const skyTextures = {
  day: null,
  sunset: null,
  night: null
};

const skyConfigs = {
  day: 'assets/textures/cielos.webp',
  sunset: 'assets/textures/amanecer.webp',
  night: 'assets/textures/cold-night-equirect.webp'
};

for (const [key, path] of Object.entries(skyConfigs)) {
  textureLoader.load(
    path,
    (tex) => {
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      skyTextures[key] = tex;
      if (currentAtmoKey === key) {
        scene.background = tex;
        scene.environment = tex;
      }
    },
    undefined,
    (err) => console.warn(`Aviso al cargar cielo ${key}:`, err)
  );
}

const ATMOSFERAS = {
  day: {
    name: 'Día',
    bg: 0x82a9cc,
    fog: 0x8ca8bf,
    fogDensity: 0.0022,
    sunColor: 0xfffaee,
    sunIntensity: 2.4,
    sunPos: [20, 28, 20],
    rimColor: 0xc4e2ff,
    rimIntensity: 1.3,
    rimPos: [-18, 18, -24],
    fillColor: 0xd8caa8,
    fillIntensity: 0.95,
    hemiSky: 0xd9ecff,
    hemiGround: 0x6e5c46,
    hemiIntensity: 1.0,
    exposure: 1.15,
    torches: 0.35
  },
  sunset: {
    name: 'Ocaso',
    bg: 0x22130e,
    fog: 0x2a1711,
    fogDensity: 0.0035,
    sunColor: 0xff9843,
    sunIntensity: 2.7,
    sunPos: [24, 13, 19],
    rimColor: 0xffbe6a,
    rimIntensity: 2.1,
    rimPos: [-20, 16, -22],
    fillColor: 0x543224,
    fillIntensity: 0.8,
    hemiSky: 0xe68c4d,
    hemiGround: 0x281812,
    hemiIntensity: 0.9,
    exposure: 1.20,
    torches: 1.6
  },
  night: {
    name: 'Noche',
    bg: 0x060913,
    fog: 0x070c17,
    fogDensity: 0.0045,
    sunColor: 0x8ab8e6,
    sunIntensity: 0.95,
    sunPos: [16, 26, 18],
    rimColor: 0x9ed1ff,
    rimIntensity: 1.9,
    rimPos: [-16, 18, -22],
    fillColor: 0x1b283d,
    fillIntensity: 0.55,
    hemiSky: 0x1b2a47,
    hemiGround: 0x0a0e17,
    hemiIntensity: 0.55,
    exposure: 1.1,
    torches: 2.8
  }
};

let currentAtmoKey = 'sunset';

function applyAtmosphere(key) {
  const cfg = ATMOSFERAS[key];
  if (!cfg) return;
  currentAtmoKey = key;

  // Asignar textura panorámica equirrectangular o color de respaldo
  if (skyTextures[key]) {
    scene.background = skyTextures[key];
    scene.environment = skyTextures[key];
  } else {
    scene.background = new THREE.Color(cfg.bg);
    scene.environment = null;
  }

  scene.fog.color.set(cfg.fog);
  scene.fog.density = cfg.fogDensity;

  sunLight.color.set(cfg.sunColor);
  sunLight.intensity = cfg.sunIntensity;
  sunLight.position.set(...cfg.sunPos);

  rimLight.color.set(cfg.rimColor);
  rimLight.intensity = cfg.rimIntensity;
  rimLight.position.set(...cfg.rimPos);

  fillLight.color.set(cfg.fillColor);
  fillLight.intensity = cfg.fillIntensity;

  hemiLight.color.set(cfg.hemiSky);
  hemiLight.groundColor.set(cfg.hemiGround);
  hemiLight.intensity = cfg.hemiIntensity;

  renderer.toneMappingExposure = cfg.exposure;

  // Antorchas
  [displayTorch1, displayTorch2].forEach((t) => {
    t.userData.baseIntensity = cfg.torches;
    t.userData.light.intensity = cfg.torches;
    t.userData.flame.visible = cfg.torches > 0.5;
  });

  // Actualizar botones de atmósfera en la UI
  document.querySelectorAll('[data-atmo]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.atmo === key);
  });
}

// ==========================================================================
// GESTIÓN DE MEMORIA Y CICLO DE VIDA (DISPOSE COMPLETO)
// ==========================================================================
let currentMonumentGroup = null;

function disposeHierarchy(node) {
  if (!node) return;
  node.traverse((child) => {
    if (child.isMesh) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => {
          if (m.map) m.map.dispose();
          if (m.normalMap) m.normalMap.dispose();
          if (m.roughnessMap) m.roughnessMap.dispose();
          if (m.metalnessMap) m.metalnessMap.dispose();
          m.dispose();
        });
      }
    }
  });
  if (node.parent) {
    node.parent.remove(node);
  }
}

// ==========================================================================
// CARGA Y PRESENTACIÓN MONUMENTAL DE CADA MODELO (BOX3)
// ==========================================================================
const loadingIndicator = document.querySelector('#model-loading');

function showLoading(show, label = '') {
  if (!loadingIndicator) return;
  loadingIndicator.classList.toggle('visible', show);
  const textEl = loadingIndicator.querySelector('.loading-label');
  if (textEl && label) textEl.textContent = label;
}

function bakeExhibicionWallCentering(model) {
  model.position.set(0, 0, 0);
  model.rotation.set(0, 0, 0);
  model.updateWorldMatrix(true, true);

  const bounds = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  bounds.getCenter(center);
  const minY = bounds.min.y;

  const offset = new THREE.Vector3(-center.x, -minY, -center.z);
  model.children.forEach((child) => {
    child.position.add(offset);
  });

  model.position.set(0, 0, 0);
  model.rotation.set(0, 0, 0);
  model.updateWorldMatrix(true, true);
  return model;
}

function createExhibicionSouthEntry(wall) {
  wall.updateMatrixWorld(true);
  const toRemove = [];
  wall.traverse((object) => {
    if (object === wall) return;
    const localPos = wall.worldToLocal(object.getWorldPosition(new THREE.Vector3()));
    if (Math.abs(localPos.x) < 3.4) {
      if (/^Bloque_F\d+_B\d+$/.test(object.name) || object.name.startsWith('cabeza-clava-exhibicion-')) {
        toRemove.push(object);
      }
    }
  });
  toRemove.forEach((object) => object.parent?.remove(object));
}

async function buildMonumentModel(config) {
  if (config.modelType === 'gltf') {
    const model = await loadLocalModel(config.path, {
      fitSize: config.fitSize,
      albedoPath: config.albedoPath,
      normalPath: config.normalPath,
      tint: config.tint,
      tintMode: config.tint ? 'replace' : 'multiply',
      center: true
    });
    if (config.scaleY) {
      model.scale.y *= config.scaleY;
      model.updateWorldMatrix(true, true);
    }
    if (config.rotationY) model.rotation.y = config.rotationY;
    return model;
  }

  if (config.modelType === 'composite-kalasasaya') {
    const group = createKalasasaya();
    // Añadir pilares megalíticos locales
    try {
      const pilarBase = await loadLocalModel('assets/models/pilar.glb', { fitSize: 3.6 });
      const kalasasayaPositions = [
        [-18, 0, -10.5], [-9, 0, -10.5], [-4.5, 0, -10.5], [4.5, 0, -10.5], [9, 0, -10.5], [18, 0, -10.5],
        [-18, 0, 10.5], [-8, 0, 10.5], [8, 0, 10.5], [18, 0, 10.5],
        [-18, 0, 0], [18, 0, 0], [-6, 0, 0], [6, 0, 0]
      ];
      kalasasayaPositions.forEach(([px, py, pz], idx) => {
        const p = pilarBase.clone(true);
        p.position.set(px, 0.35, pz);
        p.name = `pilar-exhibicion-${idx + 1}`;
        group.add(p);
      });
    } catch (e) {
      console.warn('Pilares kalasasaya exhibicion:', e);
    }
    // Añadir Monolito Bennett al altar central
    try {
      const bennett = await loadLocalModel('assets/models/Monolito.glb', { fitSize: 6.8 });
      bennett.position.set(0, 0.82, 0);
      group.add(bennett);
    } catch (e) {
      console.warn('Monolito kalasasaya exhibicion:', e);
    }
    return group;
  }

  if (config.modelType === 'composite-kherikala') {
    return createKheriKala();
  }

  if (config.modelType === 'composite-pumapunku') {
    const group = new THREE.Group();
    group.name = 'puma-punku-exhibicion';
    try {
      const [r1, r2] = await Promise.all([
        loadLocalModel('assets/models/ruina_pumapunku1.glb', { fitSize: 8.5 }),
        loadLocalModel('assets/models/ruina_pumapunku2.glb', { fitSize: 8.5 })
      ]);
      r1.position.set(-4.2, 0, 0);
      r1.rotation.y = -0.1;
      r2.position.set(4.2, 0, 0);
      r2.rotation.y = 0.08;
      group.add(r1, r2);
    } catch (e) {
      console.warn('Ruinas puma punku exhibicion:', e);
    }
    return group;
  }

  if (config.modelType === 'composite-templete') {
    const group = new THREE.Group();
    group.name = 'templete-exhibicion';

    // Base del patio y pavimento
    const baseTemplete = createTemplete();
    group.add(baseTemplete);

    // Muros perimetrales y cabezas clavas de pared a pared
    try {
      const wallBase = await loadLocalModel('assets/models/pared.glb', {
        fitSize: 28.4,
        albedoPath: 'assets/textures/GroundDirtRocky020_COL_2K.jpg',
        textureRepeat: 4,
        tint: '#d8cbb1',
        tintMode: 'replace',
        center: false
      });
      bakeExhibicionWallCentering(wallBase);

      // Añadir cabezas clavas empotradas de pared a pared en dos hileras simétricas
      try {
        const headBase = await loadLocalModel('assets/models/cabeza_clava.glb', { fitSize: 1.15, center: true });
        headBase.traverse((c) => { if (c.isMesh) c.material.side = THREE.DoubleSide; });

        const heads = [];
        // Fila superior (y = 2.85m): 13 cabezas distribuidas de -12.0m a +12.0m cada 2.0m
        for (let x = -12.0; x <= 12.05; x += 2.0) heads.push({ x: Math.round(x * 10) / 10, y: 2.85 });
        // Fila inferior (y = 1.75m): 12 cabezas intercaladas de -11.0m a +11.0m cada 2.0m
        for (let x = -11.0; x <= 11.05; x += 2.0) heads.push({ x: Math.round(x * 10) / 10, y: 1.75 });

        heads.forEach(({ x, y }, i) => {
          const h = headBase.clone(true);
          h.position.set(x, y, -0.42);
          h.rotation.set(0, Math.PI + Math.PI / 2, 0);
          h.name = `cabeza-clava-exhibicion-${i}`;
          wallBase.add(h);
        });
      } catch (err) {
        console.warn('Cabezas clavas exhibicion:', err);
      }

      // 4 lados del patio de pared a pared
      const perimeter = new THREE.Group();
      const sides = [
        { pos: [0, -4.8, 13.65], rot: 0, isSouth: true },
        { pos: [13.65, -4.8, 0], rot: Math.PI / 2, isSouth: false },
        { pos: [0, -4.8, -13.65], rot: Math.PI, isSouth: false },
        { pos: [-13.65, -4.8, 0], rot: -Math.PI / 2, isSouth: false }
      ];

      sides.forEach(({ pos, rot, isSouth }, idx) => {
        const s = idx === 0 ? wallBase : wallBase.clone(true);
        s.position.set(...pos);
        s.rotation.y = rot;
        if (isSouth) {
          createExhibicionSouthEntry(s);
        }
        perimeter.add(s);
      });
      group.add(perimeter);
    } catch (e) {
      console.warn('Muros templete exhibicion:', e);
    }

    // Monolito Ponce en el centro del patio hundido
    try {
      const ponce = await loadLocalModel('assets/models/monolito_ponce.glb', { fitSize: 5.2, center: true });
      ponce.position.set(0, -4.8, 0);
      group.add(ponce);
    } catch (e) {
      console.warn('Ponce templete exhibicion:', e);
    }

    return group;
  }

  return new THREE.Group();
}

// Transición suave de cámara (OrbitControls)
let cameraTransition = null;

function transitionCamera(targetLook, targetCamPos, duration = 1.1) {
  cameraTransition = {
    startTarget: controls.target.clone(),
    endTarget: targetLook.clone(),
    startPos: camera.position.clone(),
    endPos: targetCamPos.clone(),
    elapsed: 0,
    duration
  };
}

function updateCameraTransition(dt) {
  if (!cameraTransition) return;
  const t = cameraTransition;
  t.elapsed = Math.min(t.elapsed + dt, t.duration);
  const p = t.elapsed / t.duration;
  // EaseInOutCubic
  const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

  controls.target.lerpVectors(t.startTarget, t.endTarget, ease);
  camera.position.lerpVectors(t.startPos, t.endPos, ease);

  if (p >= 1) {
    controls.target.copy(t.endTarget);
    camera.position.copy(t.endPos);
    cameraTransition = null;
  }
}

// ==========================================================================
// CAPA INTERACTIVA DE PUNTOS DE HISTORIA Y DETALLES ARQUEOLÓGICOS (3D)
// ==========================================================================
const storyLayer = document.querySelector('#story-points');
const pointTag = document.querySelector('#point-tag');
const panelEyebrow = document.querySelector('#panel-eyebrow');

let activeStoryPoints = []; // [{ button, point, pos, viewCamPos, index }]
let activeStoryIndex = -1;

function clearStoryPoints() {
  if (storyLayer) storyLayer.replaceChildren();
  activeStoryPoints = [];
  activeStoryIndex = -1;
  if (pointTag) pointTag.style.display = 'none';
  if (panelEyebrow) panelEyebrow.textContent = 'SALA DE EXHIBICIÓN';
}

function renderStoryPoints(config) {
  clearStoryPoints();
  if (!storyLayer || !config.puntos?.length) return;

  config.puntos.forEach((point, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'story-point';
    btn.textContent = String(idx + 1);
    btn.title = `${idx + 1}. ${point.titulo}`;
    btn.setAttribute('aria-label', `${idx + 1}. ${point.titulo}: ${point.relato}`);
    btn.setAttribute('aria-pressed', 'false');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      focusStoryPoint(config, idx);
    });

    storyLayer.appendChild(btn);

    const pos = new THREE.Vector3(point.posicion.x, point.posicion.y, point.posicion.z);
    const viewCamPos = point.vista
      ? new THREE.Vector3(point.vista.x, point.vista.y, point.vista.z)
      : pos.clone().add(new THREE.Vector3(0, 0.4, 3.2));

    activeStoryPoints.push({ button: btn, point, pos, viewCamPos, index: idx });
  });
}

function focusStoryPoint(config, index) {
  if (index === activeStoryIndex) {
    // Si ya está activo, volver a la vista panorámica general
    resetToOverview(config);
    return;
  }

  activeStoryIndex = index;
  const item = activeStoryPoints[index];
  if (!item) return;

  // Actualizar estado activo en los botones
  activeStoryPoints.forEach(({ button, index: i }) => {
    const isActive = i === index;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  // Actualizar ficha lateral con los datos del punto arqueológico
  if (panelEyebrow) panelEyebrow.textContent = 'SALA DE EXHIBICIÓN · DETALLE ARQUEOLÓGICO';
  if (pointTag) {
    pointTag.style.display = 'inline-flex';
    pointTag.innerHTML = `📍 Detalle ${index + 1} de ${config.puntos.length}: ${item.point.titulo} <span style="opacity:0.75;margin-left:6px;">✕</span>`;
    pointTag.onclick = () => resetToOverview(config);
  }
  if (panelTitle) panelTitle.textContent = `${config.nombre} · ${item.point.titulo}`;
  if (panelDesc) panelDesc.textContent = item.point.relato;

  // Transición suave de cámara al detalle seleccionado
  transitionCamera(item.pos, item.viewCamPos, 0.95);
}

function resetToOverview(config) {
  activeStoryIndex = -1;
  activeStoryPoints.forEach(({ button }) => {
    button.classList.remove('is-active');
    button.setAttribute('aria-pressed', 'false');
  });

  if (pointTag) pointTag.style.display = 'none';
  if (panelEyebrow) panelEyebrow.textContent = 'SALA DE EXHIBICIÓN';
  updateSidePanel(config);

  // Volver a la vista general cinematográfica del monumento
  if (!currentMonumentGroup) return;
  const box = new THREE.Box3().setFromObject(currentMonumentGroup);
  const size = new THREE.Vector3();
  box.getSize(size);
  const targetY = config.targetY || Math.max(1.8, size.y * 0.45);
  const camDist = config.camDist || Math.max(7.5, size.y * 1.6);
  const pitchOffset = config.pitchAngle ? Math.tan(config.pitchAngle) * camDist : 1.2;

  transitionCamera(
    new THREE.Vector3(0, targetY, 0),
    new THREE.Vector3(0, targetY - pitchOffset * 0.45, camDist),
    1.0
  );
}

const _projVector = new THREE.Vector3();

function updateStoryPointPositions() {
  if (!activeStoryPoints.length) return;
  const w = window.innerWidth;
  const h = window.innerHeight;

  for (let i = 0; i < activeStoryPoints.length; i++) {
    const { button, pos } = activeStoryPoints[i];
    _projVector.copy(pos).project(camera);

    const isVisible =
      _projVector.z >= -1 &&
      _projVector.z <= 1 &&
      Math.abs(_projVector.x) <= 1.05 &&
      Math.abs(_projVector.y) <= 1.05;

    if (!isVisible) {
      button.style.opacity = '0';
      button.style.pointerEvents = 'none';
    } else {
      button.style.opacity = '1';
      button.style.pointerEvents = 'auto';
      const screenX = (_projVector.x + 1) * w * 0.5;
      const screenY = (1 - _projVector.y) * h * 0.5;
      button.style.left = `${screenX}px`;
      button.style.top = `${screenY}px`;
    }
  }
}

let activeMonumentIndex = 0;

async function selectMonument(index) {
  if (index < 0 || index >= MONUMENTOS.length) return;
  const config = MONUMENTOS[index];
  activeMonumentIndex = index;

  // Actualizar UI del dock inferior
  document.querySelectorAll('.monument-dock-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === index);
  });

  // Asegurar que el botón activo sea visible en el scroll del dock
  const activeBtn = document.querySelectorAll('.monument-dock-btn')[index];
  if (activeBtn) {
    activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  // Actualizar Audio y UI lateral
  updateAudioPlayer(config);
  updateSidePanel(config);

  showLoading(true, `Cargando ${config.nombre}…`);

  try {
    // 1. Dispose completo del modelo anterior para evitar sobrecarga de memoria
    if (currentMonumentGroup) {
      if (outlinePass) outlinePass.selectedObjects = [];
      clearStoryPoints();
      disposeHierarchy(currentMonumentGroup);
      currentMonumentGroup = null;
    }

    // 2. Construcción / Carga del nuevo modelo
    const model = await buildMonumentModel(config);
    model.updateWorldMatrix(true, true);

    // 3. Auto-Escala y Anclaje exacto con Box3
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);

    // Centrar en (0, 0) y apoyar base exactamente en Y = 0
    const center = new THREE.Vector3();
    box.getCenter(center);
    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= box.min.y;
    model.updateWorldMatrix(true, true);

    // Activar sombras en todas las mallas
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    currentMonumentGroup = model;
    scene.add(model);

    // 4. Efecto de post-procesamiento de outline dorado en todos los modelos
    if (outlinePass) {
      outlinePass.selectedObjects = [model];
    }

    // 5. Instanciar los puntos de historia e información arqueológica en 3D
    renderStoryPoints(config);

    // 6. Encuadre de cámara épico y contrapicado
    const targetY = config.targetY || Math.max(1.8, size.y * 0.45);
    const camDist = config.camDist || Math.max(7.5, size.y * 1.6);
    const pitchOffset = config.pitchAngle ? Math.tan(config.pitchAngle) * camDist : 1.2;

    const targetLook = new THREE.Vector3(0, targetY, 0);
    const targetCamPos = new THREE.Vector3(0, targetY - pitchOffset * 0.45, camDist);

    transitionCamera(targetLook, targetCamPos);
  } catch (err) {
    console.error(`Error al cargar el monumento ${config.nombre}:`, err);
  } finally {
    showLoading(false);
  }
}

// ==========================================================================
// SISTEMA DE AUDIO GUÍA [TECLA E]
// ==========================================================================
const audioPlayer = new Audio();
const audioBtn = document.querySelector('#btn-audio-guide');
const audioProgressBar = document.querySelector('#audio-progress-bar');

function updateAudioPlayer(config) {
  audioPlayer.pause();
  audioPlayer.currentTime = 0;
  if (audioProgressBar) audioProgressBar.style.width = '0%';
  if (audioBtn) {
    audioBtn.classList.remove('is-playing');
    const labelSpan = audioBtn.querySelector('.audio-label');
    if (labelSpan) labelSpan.textContent = '🔊 Escuchar explicación';
  }

  if (config.audio) {
    audioPlayer.src = encodeURI(config.audio);
    if (audioBtn) audioBtn.style.display = 'flex';
  } else {
    if (audioBtn) audioBtn.style.display = 'none';
  }
}

function toggleAudio() {
  if (!audioPlayer.src || audioPlayer.src === window.location.href) return;
  if (audioPlayer.paused) {
    audioPlayer.play().then(() => {
      if (audioBtn) {
        audioBtn.classList.add('is-playing');
        const labelSpan = audioBtn.querySelector('.audio-label');
        if (labelSpan) labelSpan.textContent = '⏸ Pausar explicación';
      }
    }).catch((e) => console.warn('Audio play prevenido:', e));
  } else {
    audioPlayer.pause();
    if (audioBtn) {
      audioBtn.classList.remove('is-playing');
      const labelSpan = audioBtn.querySelector('.audio-label');
      if (labelSpan) labelSpan.textContent = '🔊 Escuchar explicación';
    }
  }
}

audioPlayer.addEventListener('timeupdate', () => {
  if (!audioProgressBar || !audioPlayer.duration) return;
  const pct = (audioPlayer.currentTime / audioPlayer.duration) * 100;
  audioProgressBar.style.width = `${pct}%`;
});

audioPlayer.addEventListener('ended', () => {
  if (audioProgressBar) audioProgressBar.style.width = '0%';
  if (audioBtn) {
    audioBtn.classList.remove('is-playing');
    const labelSpan = audioBtn.querySelector('.audio-label');
    if (labelSpan) labelSpan.textContent = '🔊 Escuchar explicación';
  }
});

if (audioBtn) {
  audioBtn.addEventListener('click', toggleAudio);
}

// Control de volumen y silencio para la explicación de exhibición
const volSlider = document.querySelector('#audio-volume-slider');
const muteBtn = document.querySelector('#btn-audio-mute');

if (volSlider) {
  const savedVol = localStorage.getItem('tiwanaku_audio_vol');
  if (savedVol !== null) {
    volSlider.value = savedVol;
    audioPlayer.volume = parseFloat(savedVol) / 100;
  } else {
    audioPlayer.volume = 0.85;
  }
  volSlider.style.setProperty('--range-pct', `${volSlider.value}%`);

  volSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    audioPlayer.volume = val / 100;
    audioPlayer.muted = (val === 0);
    volSlider.style.setProperty('--range-pct', `${val}%`);
    localStorage.setItem('tiwanaku_audio_vol', String(val));
    if (muteBtn) muteBtn.textContent = audioPlayer.muted ? '🔇' : '🔊';
    updateExhibicionWindVolume();
  });
}

if (muteBtn) {
  muteBtn.addEventListener('click', () => {
    audioPlayer.muted = !audioPlayer.muted;
    muteBtn.textContent = audioPlayer.muted ? '🔇' : '🔊';
    updateExhibicionWindVolume();
  });
}

// Sonido de ambiente de viento andino en exhibición 3D
const exhibicionWind = new Audio('assets/audio/sonido_de_viento_ambiente.mp3');
exhibicionWind.loop = true;
exhibicionWind.preload = 'auto';

let exhibicionWindStarted = false;
function updateExhibicionWindVolume() {
  const baseVol = audioPlayer.muted ? 0 : audioPlayer.volume;
  const isNarrating = !audioPlayer.paused && audioPlayer.currentTime > 0;
  exhibicionWind.volume = THREE.MathUtils.clamp(baseVol * (isNarrating ? 0.22 : 0.45), 0, 1);
  exhibicionWind.muted = audioPlayer.muted;
}

function startExhibicionWind() {
  if (exhibicionWindStarted) return;
  updateExhibicionWindVolume();
  exhibicionWind.play().then(() => {
    exhibicionWindStarted = true;
  }).catch(() => {});
}

['pointerdown', 'keydown', 'click', 'touchstart'].forEach((evt) => {
  window.addEventListener(evt, startExhibicionWind, { passive: true });
});

audioPlayer.addEventListener('play', updateExhibicionWindVolume);
audioPlayer.addEventListener('pause', updateExhibicionWindVolume);
audioPlayer.addEventListener('ended', updateExhibicionWindVolume);

// Evento de teclado tecla E para reproducir o pausar
window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'e' && !event.repeat) {
    event.preventDefault();
    toggleAudio();
  }
});

// ==========================================================================
// PANEL LATERAL IZQUIERDO Y LIGHTBOX DE FOTOGRAFÍA REAL
// ==========================================================================
const panelTitle = document.querySelector('#panel-title');
const panelPeriod = document.querySelector('#panel-period');
const panelImageWrap = document.querySelector('#panel-image-wrap');
const panelImage = document.querySelector('#panel-image');
const panelDesc = document.querySelector('#panel-desc');
const panelFunction = document.querySelector('#panel-function');
const panelCuriosity = document.querySelector('#panel-curiosity');

const lightboxModal = document.querySelector('#lightbox-modal');
const lightboxImg = document.querySelector('#lightbox-img');
const lightboxCaption = document.querySelector('#lightbox-caption');
const lightboxClose = document.querySelector('#lightbox-close');

function updateSidePanel(config) {
  if (panelTitle) panelTitle.textContent = config.nombre;
  if (panelPeriod) panelPeriod.textContent = config.periodo;
  if (panelDesc) panelDesc.textContent = config.descripcion;
  if (panelFunction) panelFunction.textContent = config.funcion;
  if (panelCuriosity) panelCuriosity.textContent = config.datoCurioso;

  if (panelImageWrap && panelImage) {
    if (config.imagen) {
      panelImage.src = config.imagen;
      panelImage.alt = `Fotografía arqueológica de ${config.nombre}`;
      panelImageWrap.style.display = 'block';
    } else {
      panelImageWrap.style.display = 'none';
    }
  }
}

if (panelImageWrap) {
  panelImageWrap.addEventListener('click', () => {
    const config = MONUMENTOS[activeMonumentIndex];
    if (!config?.imagen || !lightboxModal || !lightboxImg) return;
    lightboxImg.src = config.imagen;
    lightboxImg.alt = config.nombre;
    if (lightboxCaption) lightboxCaption.textContent = `${config.nombre} · Fotografía Arqueológica`;
    lightboxModal.classList.add('open');
  });
}

function closeLightbox() {
  if (lightboxModal) lightboxModal.classList.remove('open');
}

if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
if (lightboxModal) {
  lightboxModal.addEventListener('click', (e) => {
    if (e.target === lightboxModal) closeLightbox();
  });
}
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});

// ==========================================================================
// CONSTRUCCIÓN DEL DOCK INFERIOR (CARRUSEL DE 10 MONUMENTOS)
// ==========================================================================
const dockScroll = document.querySelector('#dock-scroll');
const dockPrev = document.querySelector('#dock-prev');
const dockNext = document.querySelector('#dock-next');

function buildDock() {
  if (!dockScroll) return;
  dockScroll.replaceChildren();

  MONUMENTOS.forEach((m, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `monument-dock-btn ${idx === 0 ? 'active' : ''}`;
    btn.setAttribute('aria-label', `Exhibir ${m.nombre}`);
    btn.innerHTML = `
      <span class="dock-icon">${m.icono}</span>
      <div class="dock-info">
        <span class="dock-title">${m.nombre}</span>
        <span class="dock-subtitle">${m.subtitulo}</span>
      </div>
    `;
    btn.addEventListener('click', () => selectMonument(idx));
    dockScroll.appendChild(btn);
  });
}

if (dockPrev) {
  dockPrev.addEventListener('click', () => {
    dockScroll.scrollBy({ left: -240, behavior: 'smooth' });
  });
}

if (dockNext) {
  dockNext.addEventListener('click', () => {
    dockScroll.scrollBy({ left: 240, behavior: 'smooth' });
  });
}

// Botones de atmósfera en barra superior
document.querySelectorAll('[data-atmo]').forEach((btn) => {
  btn.addEventListener('click', () => {
    applyAtmosphere(btn.dataset.atmo);
  });
});

// Botón de rotación automática
const btnAutoRotate = document.querySelector('#btn-auto-rotate');
if (btnAutoRotate) {
  btnAutoRotate.addEventListener('click', () => {
    controls.autoRotate = !controls.autoRotate;
    btnAutoRotate.classList.toggle('active', controls.autoRotate);
    btnAutoRotate.textContent = controls.autoRotate ? '⏸ Detener Giro' : '🔄 Giro Automático';
  });
}

// ==========================================================================
// BUCLE PRINCIPAL DE ANIMACIÓN Y RENDERIZADO CON POST-PROCESAMIENTO (60 FPS)
// ==========================================================================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const time = clock.getElapsedTime();

  // Animación del parpadeo orgánico de las llamas en los pebeteros de exhibición
  const flicker1 = Math.sin(time * 6.5) * 0.15 + Math.cos(time * 11.2) * 0.08;
  const flicker2 = Math.sin(time * 5.8 + 1.2) * 0.15 + Math.cos(time * 9.7) * 0.08;

  displayTorch1.userData.light.intensity = Math.max(0.2, displayTorch1.userData.baseIntensity + flicker1);
  displayTorch2.userData.light.intensity = Math.max(0.2, displayTorch2.userData.baseIntensity + flicker2);

  updateCameraTransition(dt);
  controls.update();
  updateStoryPointPositions();
  composer.render();
}

// Redimensionamiento responsivo
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  outlinePass.resolution.set(w, h);
});

// ==========================================================================
// INICIALIZACIÓN
// ==========================================================================
buildDock();
applyAtmosphere('sunset');
selectMonument(0);
animate();
