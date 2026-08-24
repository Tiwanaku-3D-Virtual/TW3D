import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const gltfLoader = new GLTFLoader();

export function loadModel(path, options = {}, onProgress = null) {
    return new Promise((resolve, reject) => {
        gltfLoader.load(
            path,
            (gltf) => {
                const model = gltf.scene;

                // Centrar automáticamente si el modelo viene desfasado de Blender
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
                    if (xhr.total > 0) {
                        onProgress(xhr.loaded / xhr.total, xhr.loaded, xhr.total);
                    } else {
                        onProgress(null, xhr.loaded, 0);
                    }
                }
            },
            (error) => reject(error)
        );
    });
}

function setupShadowsAndMaterials(child) {
    if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Optimizar materiales
        if (child.material) {
            if (child.material.map) {
                child.material.map.colorSpace = THREE.SRGBColorSpace;
            }
        }
        
        // Evitar que el shader se rompa si la malla no tiene coordenadas UV
        if (!child.geometry.attributes.uv && child.material) {
            child.material.map = null;
            child.material.needsUpdate = true;
        }
    }
}