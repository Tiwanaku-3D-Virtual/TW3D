# Tiwanaku 3D — Museo Virtual Inmersivo

Experiencia arqueológica para GitHub Pages, construida con HTML, CSS y JavaScript nativos. Three.js se carga desde CDN mediante `importmap`; no requiere npm ni proceso de compilación. Las nuevas estructuras se generan mediante geometrías Three.js.

## Páginas

- `map.html`: recorrido 3D del sitio arqueológico.
- `index.html`: sala virtual de piezas arqueológicas.
- `recorrido.html`: vista escénica anterior, conservada como página complementaria.

## Estructura del código

- `js/escena.js`: cámara, renderizador, controles y luz base del mapa.
- `js/info.js`: fichas arqueológicas del sitio.
- `js/estructuras/templo-semisubterraneo.js`: patio hundido, muros, cabezas clavas, escalinatas y monolitos.
- `js/estructuras/sitio.js`: composición del recinto y sus estructuras.
- `js/estructuras/puerta-sol.js`, `kalasasaya.js`, `akapana.js` y `puma-punku.js`: monumentos principales.
- `js/estructuras/auxiliares.js`: Puerta de la Luna, Putuni, Kheri Kala, Kantatallita y muros de acceso.
- `js/mapa.js`: interacción y ciclo de luz del recorrido.
- `map.css`: interfaz responsive del mapa.

## Controles

- Ratón o dedo: orbitar la vista.
- Rueda o gesto de pellizco: acercar y alejar.
- Toca o haz clic en una estructura: abrir su ficha.
- Botón `☀ Día`: alternar luz de día y de noche.
- `Esc`: cerrar la ficha ampliada.

Abre `map.html` mediante un servidor estático o GitHub Pages. El CDN de Three.js requiere conexión a internet.
