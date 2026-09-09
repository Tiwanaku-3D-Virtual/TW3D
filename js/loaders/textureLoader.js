import * as THREE from 'three';

// Instancia única y reutilizable del cargador de texturas de Three.js
const textureLoader = new THREE.TextureLoader();

/**
 * Carga asíncrona de texturas 2D en una Promesa para uso con async/await.
 * @param {string} path - Ruta de la imagen.
 * @param {Object} options - Parámetros de textura (colorSpace, wrap, repeat, mapping, flipY).
 * @param {Function} onProgress - Callback opcional para porcentaje de carga.
 */
export function loadTexture(path, options = {}, onProgress = null) {
    return new Promise((resolve, reject) => {
        textureLoader.load(
            path,
            (texture) => {
                // Configurar espacio de color (sRGB para imágenes de color, lineal para normales/rugosidad)
                if (options.colorSpace) texture.colorSpace = options.colorSpace;

                // Repetición y envolvimiento de textura (tiling)
                if (options.wrapS) texture.wrapS = options.wrapS;
                if (options.wrapT) texture.wrapT = options.wrapT;
                if (options.repeat) texture.repeat.copy(options.repeat);

                // Mapeo esférico/equirectangular (para fondos HDR o panoramas 360)
                if (options.mapping) texture.mapping = options.mapping;

                // Inversión del eje Y según el formato de origen
                if (options.flipY !== undefined) texture.flipY = options.flipY;

                resolve(texture);
            },
            (xhr) => {
                if (onProgress && xhr.total > 0) {
                    onProgress(xhr.loaded / xhr.total);
                }
            },
            (error) => reject(error)
        );
    });
}