# Tiwanaku 3D — Museo Virtual Inmersivo

Experiencia arqueológica para GitHub Pages, construida con HTML, CSS y JavaScript nativos. Three.js se carga desde CDN mediante `importmap`; no requiere npm ni proceso de compilación. La mayoría de las estructuras se genera con geometrías Three.js; la Puerta del Sol, Akapana, Monolito Ponce y Chachapuma reutilizan modelos 3D locales del proyecto.

## Páginas

- `index.html`: entrada principal que abre directamente el recorrido 3D del sitio arqueológico con pantalla de carga, postprocesamiento de siluetas temáticas y selector de modelos.
- `map.html` y `recorrido.html`: conservan acceso directo al recorrido sin redirecciones innecesarias.

## Estructura del código

- `js/escena.js`: cámara, renderizador, controles y luz base del mapa.
- `js/info.js`: fichas arqueológicas del sitio.
- `js/estructuras/templo-semisubterraneo.js`: patio hundido, muros, cabezas clavas, escalinatas y monolitos.
- `js/estructuras/sitio.js`: composición del recinto y sus estructuras.
- `js/estructuras/puerta-sol.js`, `kalasasaya.js`, `akapana.js` y `puma-punku.js`: monumentos principales.
- `js/estructuras/auxiliares.js`: Kheri Kala y muros de acceso.
- `js/ambiente.js`: terreno ondulado, cielo, ichu instanciado y llamas animadas.
- `js/jugador.js`: modo a pie, movimiento, salto y colisiones sencillas.
- `js/ambiente-sonoro.js`: narración y audio de proximidad de los monumentos.
- `js/modelos-3d.js` y `js/modelos-sitio.js`: carga, escala y colocación de modelos GLB ya incluidos en `assets/models/`.
- `js/guia.js`: personaje guía low-poly.
- `js/mapa.js`: interacción y ciclo de luz del recorrido.
- `map.css`: interfaz responsive del mapa.

## Controles

- Ratón o dedo: orbitar la vista.
- Rueda o gesto de pellizco: acercar y alejar.
- Toca o haz clic en una estructura: abrir su ficha.
- Botón de atmósfera o tecla `N`: recorrer día, ocaso y noche.
- Escritorio: `Explorar a pie`, `WASD`, `Mayús` para correr, `Espacio` para saltar y `Esc` para volver a órbita.
- Minimapa: posición actual y estructuras visitadas con una marca.
- `Esc`: cerrar la ficha ampliada.
- Selector `Ver modelos`: enfoca una estructura en el paisaje del Altiplano; arrastra para orbitar y usa la rueda o el pellizco para acercar.
- `Ver en el sitio`: abrir el recorrido arqueológico desde la ficha de una pieza.

Abre `map.html` mediante un servidor estático o GitHub Pages. El CDN de Three.js requiere conexión a internet.
