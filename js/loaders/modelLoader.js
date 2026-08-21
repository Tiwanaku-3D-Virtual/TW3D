import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const gltfLoader = new GLTFLoader();

export function loadModel(path, options = {}) {
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
            undefined,
            (error) => reject(error)
        );
    });
}

function setupShadowsAndMaterials(child) {
    if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Evitar que el shader se rompa si la malla no tiene coordenadas UV
        if (!child.geometry.attributes.uv && child.material) {
            child.material.map = null;
            child.material.needsUpdate = true;
        }
    }
}