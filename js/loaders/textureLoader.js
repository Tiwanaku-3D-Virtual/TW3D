import * as THREE from 'three';

const textureLoader = new THREE.TextureLoader();

export function loadTexture(path, options = {}) {
    return new Promise((resolve, reject) => {
        textureLoader.load(
            path,
            (texture) => {
                // Aplicar configuraciones opcionales a la textura
                if (options.colorSpace) texture.colorSpace = options.colorSpace;
                if (options.wrapS) texture.wrapS = options.wrapS;
                if (options.wrapT) texture.wrapT = options.wrapT;
                if (options.repeat) texture.repeat.copy(options.repeat);
                if (options.mapping) texture.mapping = options.mapping;
                if (options.flipY !== undefined) texture.flipY = options.flipY;
                
                resolve(texture);
            },
            undefined,
            (error) => reject(error)
        );
    });
}