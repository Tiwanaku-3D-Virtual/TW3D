import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Instancia única y reutilizable del cargador GLTF
const gltfLoader = new GLTFLoader();

/**
 * Carga asíncrona de modelos 3D (.gltf / .glb) encapsulada en una Promesa.
 * @param {string} path - Ruta del archivo 3D.
 * @param {Object} options - Opciones adicionales (ej. autoCenter: true).
 * @param {Function} onProgress - Callback opcional para monitorear el progreso de descarga.
 */
export function loadModel(path, options = {}, onProgress = null) {
    return new Promise((resolve, reject) => {
        gltfLoader.load(
            path,
            (gltf) => {
                const model = gltf.scene;

                // Aplicar escala fija personalizada si se define en las opciones
                if (options.scale !== undefined) {
                    if (typeof options.scale === 'number') {
                        model.scale.setScalar(options.scale);
                    } else if (options.scale && options.scale.isVector3) {
                        model.scale.copy(options.scale);
                    }
                    model.updateMatrixWorld(true);
                }

                // Ajuste automático proporcional al tamaño objetivo en unidades 3D
                if (options.fitSize !== undefined) {
                    const currentBbox = new THREE.Box3().setFromObject(model);
                    const size = new THREE.Vector3();
                    currentBbox.getSize(size);
                    const maxDim = Math.max(size.x, size.y, size.z);
                    if (maxDim > 0) {
                        const targetScale = options.fitSize / maxDim;
                        model.scale.multiplyScalar(targetScale);
                        model.updateMatrixWorld(true);
                    }
                }

                // Si el modelo requiere pivote centrado sobre el suelo (y=0)
                if (options.autoCenter) {
                    const bbox = new THREE.Box3().setFromObject(model);
                    const center = new THREE.Vector3();
                    bbox.getCenter(center);

                    const wrapper = new THREE.Group();
                    model.position.set(-center.x, -bbox.min.y, -center.z);
                    wrapper.add(model);

                    wrapper.traverse(setupShadowsAndMaterials);
                    resolve(wrapper);
                    return;
                }

                model.traverse(setupShadowsAndMaterials);
                resolve(model);
            },
            (xhr) => {
                if (onProgress) {
                    const progress = xhr.total > 0 ? xhr.loaded / xhr.total : null;
                    onProgress(progress, xhr.loaded, xhr.total);
                }
            },
            (error) => reject(error)
        );
    });
}

/**
 * Recorre la jerarquía del modelo para activar sombras y configurar el espacio de color.
 */
function setupShadowsAndMaterials(child) {
    if (!child || !child.isMesh) return;

    child.castShadow = true;
    child.receiveShadow = true;

    const hasUV = Boolean(child.geometry && child.geometry.attributes && child.geometry.attributes.uv);

    const sanitizeMaterial = (mat) => {
        if (!mat) return;
        if (mat.map) {
            mat.map.colorSpace = THREE.SRGBColorSpace;
            if (!hasUV) {
                mat.map = null;
                mat.needsUpdate = true;
            }
        }
    };

    if (Array.isArray(child.material)) {
        child.material.forEach(sanitizeMaterial);
    } else if (child.material) {
        sanitizeMaterial(child.material);
    }
}