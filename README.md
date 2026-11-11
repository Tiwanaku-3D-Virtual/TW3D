# Tiwanaku 3D — Museo Virtual Inmersivo

Experiencia arqueológica para GitHub Pages, construida con HTML, CSS y JavaScript nativos. Three.js se carga desde CDN mediante `importmap`; no requiere npm ni proceso de compilación. Las estructuras y piezas de las páginas activas se generan por código con geometrías Three.js.

## Páginas

- `map.html`: recorrido 3D del sitio arqueológico.
- `index.html`: sala virtual de piezas arqueológicas.
- `recorrido.html`: alias que redirige a `map.html` para conservar enlaces antiguos.

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
- `js/galeria.js`: sala 3D, modelos de las once piezas, foco de museo y selección para examinarlas.
- `map.css`: interfaz responsive del mapa.
- `galeria.css`: interfaz responsive de la sala de piezas.

## Controles

- Ratón o dedo: orbitar la vista.
- Rueda o gesto de pellizco: acercar y alejar.
- Toca o haz clic en una estructura: abrir su ficha.
- Botón de atmósfera o tecla `N`: recorrer día, ocaso y noche.
- Escritorio: `Explorar a pie`, `WASD`, `Mayús` para correr, `Espacio` para saltar y `Esc` para volver a órbita.
- Minimapa: posición actual y estructuras visitadas con una marca.
- Botón `Viento`: activar o silenciar el sonido ambiental generado en el navegador.
- `Esc`: cerrar la ficha ampliada.
- Sala de piezas: selecciona cualquiera de las once tarjetas inferiores o toca/clic en un modelo; arrastra para orbitar y usa la rueda o el pellizco para acercar.
- `Ver en el sitio`: abrir el recorrido arqueológico desde la ficha de una pieza.

Abre `map.html` mediante un servidor estático o GitHub Pages. El CDN de Three.js requiere conexión a internet.
