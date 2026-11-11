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
- `js/ambiente.js`: terreno ondulado, cielo, lago, ichu instanciado y llamas animadas.
- `js/jugador.js`: modo a pie, movimiento, salto y colisiones sencillas.
- `js/ambiente-sonoro.js`: viento ambiental sintetizado con Web Audio.
- `js/mapa.js`: interacción y ciclo de luz del recorrido.
- `map.css`: interfaz responsive del mapa.

## Controles

- Ratón o dedo: orbitar la vista.
- Rueda o gesto de pellizco: acercar y alejar.
- Toca o haz clic en una estructura: abrir su ficha.
- Botón de atmósfera o tecla `N`: recorrer día, ocaso y noche.
- Escritorio: `Explorar a pie`, `WASD`, `Mayús` para correr, `Espacio` para saltar y `Esc` para volver a órbita.
- Minimapa: posición actual y estructuras visitadas con una marca.
- Botón `Viento`: activar o silenciar el sonido ambiental generado en el navegador.
- `Esc`: cerrar la ficha ampliada.

Abre `map.html` mediante un servidor estático o GitHub Pages. El CDN de Three.js requiere conexión a internet.
