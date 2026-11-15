// Cada ficha mantiene nombre, periodo, descripcion, funcion, datoCurioso y posicion.
export const info = {
  templo: {
    nombre: 'Templete Semisubterráneo', periodo: '500–900 d.C.',
    descripcion: 'Patio ceremonial hundido, de planta cuadrada, cuyos muros escalonados combinan sillares y cabezas clavas. El recinto organiza la mirada hacia monolitos y estelas levantados en su interior.',
    funcion: 'Espacio ceremonial para reuniones y prácticas rituales vinculadas al agua y a los ancestros.',
    datoCurioso: 'Las cabezas empotradas representan rostros de rasgos diversos; algunas llevan tocados o elementos que sugieren identidades distintas.',
    imagen: 'assets/images/templete_semisubterráneo.jpeg',
    posicion: { x: 0, y: -2.8, z: 0 },
    vista: { x: 0, y: 15.0, z: 22.0 },
    puntos: [
      { titulo: 'Escalinata sur', relato: 'El acceso baja desde el nivel de la plaza hasta el patio hundido. La nueva escalera recrea ese desnivel para que el recinto pueda recorrerse a pie.', posicion: { x: 0, y: -2.2, z: 13.5 }, vista: { x: 0, y: 7.5, z: 10.5 } },
      { titulo: 'Cabezas clavas', relato: 'Los rostros de piedra se empotraban en los muros del patio y miraban hacia el interior, rodeando a quienes participaban en las ceremonias.', posicion: { x: -6.5, y: -2.8, z: 8.0 }, vista: { x: 8.5, y: 6.5, z: -5.0 } },
      { titulo: 'Patio hundido', relato: 'El recinto cuadrado se construyó por debajo del terreno exterior. Sus paredes y el piso de losas forman un espacio ceremonial separado de la plaza.', posicion: { x: 0, y: -3.8, z: 0 }, vista: { x: 11.0, y: 10.5, z: 14.0 } },
      { titulo: 'Monolito Ponce', relato: 'La estela antropomorfa se levanta en el centro del patio. Sus bandas y motivos escalonados relacionan la figura con la iconografía ceremonial tiwanakota.', posicion: { x: 0, y: -2.2, z: 0 }, vista: { x: 0, y: 5.5, z: 9.5 } }
    ]
  },
  kalasasaya: {
    nombre: 'Kalasasaya', periodo: '500–900 d.C.',
    descripcion: 'Plataforma ceremonial rectangular delimitada por grandes pilares y muros de piedra labrada.',
    funcion: 'Recinto ceremonial y de observación de los ciclos solares.',
    datoCurioso: 'La Puerta del Sol se encuentra asociada a esta gran plataforma.',
    imagen: 'assets/images/Kalasasaya.jpeg',
    posicion: { x: -42, y: 1.2, z: -3 },
    puntos: [
      { titulo: 'Pilares', relato: 'Grandes monolitos verticales marcan el contorno del recinto y dividen el espacio abierto en un ritmo regular.', posicion: { x: -60, y: 1.4, z: -3 }, vista: { x: -6, y: 3, z: 7 } },
      { titulo: 'Plataforma central', relato: 'El patio interior reunía a los visitantes en un espacio abierto, ordenado por los ejes del conjunto ceremonial.', posicion: { x: -42, y: 0.6, z: -3 }, vista: { x: 7, y: 5, z: 10 } },
      { titulo: 'Orientación solar', relato: 'La disposición de los muros y accesos permite estudiar cómo se observaban los ciclos del sol desde el recinto.', posicion: { x: -42, y: 1, z: -14 }, vista: { x: 0, y: 4, z: -8 } }
    ]
  },
  akapana: {
    nombre: 'Pirámide de Akapana', periodo: '400–1000 d.C.',
    descripcion: 'Gran plataforma escalonada de varios niveles, modelada como una montaña sagrada.',
    funcion: 'Centro ceremonial y político con un sistema de canales y drenaje.',
    datoCurioso: 'Su planta y canales interiores muestran un sofisticado manejo hidráulico.',
    imagen: 'assets/images/Pirámide_de_Akapana,_Tiwanaku.jpeg',
    posicion: { x: -45, y: 4, z: 34 },
    puntos: [
      { titulo: 'Cima ceremonial', relato: 'La plataforma escalonada dominaba el núcleo monumental de Tiwanaku. Su altura y ubicación la convertían en un hito visible desde el conjunto.', posicion: { x: -45, y: 3.6, z: 34 }, vista: { x: 8, y: 6, z: 9 } },
      { titulo: 'Terrazas', relato: 'Los niveles escalonados se revistieron con piedra y sostuvieron espacios de uso ritual en distintas alturas.', posicion: { x: -56, y: 1.5, z: 34 }, vista: { x: -7, y: 4, z: 8 } },
      { titulo: 'Manejo del agua', relato: 'Canales internos conducían el agua a través de la pirámide; el sistema hidráulico formaba parte de la arquitectura de Akapana.', posicion: { x: -45, y: 1, z: 39 }, vista: { x: 6, y: 4, z: 7 } }
    ]
  },
  chachapuma: {
    nombre: 'Chachapuma', periodo: 'Cultura Tiwanaku (fecha exacta no establecida)',
    descripcion: 'La escultura conocida como Chachapuma fue colocada junto al acceso occidental de Akapana. Tallada en basalto, representa una figura humano-felina que sostiene una cabeza trofeo; su sentido ritual exacto sigue en debate.',
    funcion: 'Imagen ceremonial asociada a la escalinata monumental y a los ritos de Akapana.',
    datoCurioso: 'El Museo Lítico de Tiwanaku conserva y exhibe un Chachapuma de basalto.',
    imagen: 'assets/images/chachapuma.png',
    posicion: { x: 28, y: 1.9, z: -5 },
    vista: { x: -12, y: 6, z: 7 },
    puntos: [
      { titulo: 'Figura humano-felina', relato: 'La escultura de basalto combina rasgos humanos y felinos. Se halló junto al acceso occidental de Akapana y hoy se exhibe en el Museo Lítico de Tiwanaku.', posicion: { x: 28, y: 1.9, z: -5 }, vista: { x: -5, y: 2, z: 2 } },
      { titulo: 'Cabeza trofeo', relato: 'La figura sostiene una cabeza trofeo. Este atributo ha llevado a interpretarla como una representación ritual, aunque su significado exacto sigue en debate.', posicion: { x: 28, y: 2.4, z: -5 }, vista: { x: -5, y: 1.8, z: 1.8 } },
      { titulo: 'Basalto', relato: 'La piedra volcánica oscura contrasta con la arenisca y la andesita de otros monumentos del sitio.', posicion: { x: 28, y: 1.1, z: -5 }, vista: { x: -4.5, y: 1.5, z: 2.5 } }
    ]
  },
  pumaPunku: {
    nombre: 'Puma Punku', periodo: '600–1000 d.C.',
    descripcion: 'Complejo de plataformas y bloques de andesita trabajados con gran precisión.',
    funcion: 'Conjunto monumental integrado a la planificación ceremonial de Tiwanaku.',
    datoCurioso: 'Sus bloques en forma de H muestran una notable estandarización de medidas.',
    imagen: 'assets/images/PUMA_PUNKU.jpeg',
    posicion: { x: 43, y: 1, z: 31 },
    puntos: [
      { titulo: 'Plataforma monumental', relato: 'Puma Punku forma parte del gran complejo ceremonial de Tiwanaku y se reconoce por sus plataformas y bloques de piedra trabajada.', posicion: { x: 43, y: 1.5, z: 31 }, vista: { x: 7, y: 4, z: 9 } },
      { titulo: 'Bloques ensamblados', relato: 'Los sillares se tallaron para encajar con precisión. Las piezas en forma de H muestran la estandarización de algunos elementos arquitectónicos.', posicion: { x: 47, y: 1.4, z: 31 }, vista: { x: 5, y: 2, z: 6 } },
      { titulo: 'Cantería', relato: 'El trabajo de andesita y arenisca evidencia la planificación y especialización de quienes construyeron el conjunto.', posicion: { x: 39, y: 1.4, z: 31 }, vista: { x: -5, y: 3, z: 6 } }
    ]
  },
  puertaSol: {
    nombre: 'Puerta del Sol', periodo: '500–900 d.C.',
    descripcion: 'Portal monolítico de andesita con un vano central y un dintel tallado. El friso muestra una figura frontal rodeada por seres alados.',
    funcion: 'Monumento ceremonial y posible marcador de ciclos calendáricos.',
    datoCurioso: 'La figura central sostiene dos báculos y suele identificarse como el Señor de los Báculos.',
    imagen: 'assets/images/sungate.jpg',
    posicion: { x: 0, y: 2, z: -24 },
    vista: { x: 0, y: 6, z: -16 },
    puntos: [
      { titulo: 'Figura central', relato: 'El friso muestra una figura frontal con dos báculos, conocida como el Señor de los Báculos y asociada a la iconografía de Tiwanaku.', posicion: { x: 0, y: 3.7, z: -24 }, vista: { x: 0, y: 2, z: -8 } },
      { titulo: 'Friso', relato: 'La parte superior concentra relieves y figuras aladas que acompañan a la imagen central.', posicion: { x: -1.6, y: 3.5, z: -24 }, vista: { x: -1.5, y: 1.8, z: -7 } },
      { titulo: 'Vano', relato: 'La abertura central convierte el monolito en un portal: la vista pasa a través de la piedra y conecta ambos lados del recinto.', posicion: { x: 0, y: 1.8, z: -24 }, vista: { x: 0, y: 1.5, z: -7 } },
      { titulo: 'Portal de andesita', relato: 'La Puerta del Sol fue tallada en una sola pieza de andesita y se convirtió en uno de los monumentos más reconocibles de Tiwanaku.', posicion: { x: 2.5, y: 2.1, z: -24 }, vista: { x: 2, y: 2, z: -7 } }
    ]
  },
  puertaLuna: {
    nombre: 'Puerta de la Luna', periodo: '500–900 d.C.',
    descripcion: 'Monumento monolítico de andesita que funcionaba como portal ceremonial en el sector norte de Tiwanaku. Presenta finos frisos con relieves antropomorfos y zoomorfos alados.',
    funcion: 'Portal ceremonial y demarcador de senderos rituales vinculados a ciclos astronómicos y lunares.',
    datoCurioso: 'Conserva iconografía de gran antigüedad estilística y se ubicaba originalmente al norte de Kalasasaya.',
    imagen: 'assets/images/Puerta_de_la_Luna.jpeg',
    posicion: { x: 22.0, y: 2.3, z: -24.0 },
    vista: { x: 0, y: 5.5, z: 12.0 },
    puntos: [
      { titulo: 'Dintel y frisos', relato: 'El friso superior exhibe figuras aladas y motivos escalonados tallados en la andesita con gran detalle simbólico.', posicion: { x: 22.0, y: 3.8, z: -24.0 }, vista: { x: 0, y: 2.2, z: 7.5 } },
      { titulo: 'Vano monolítico', relato: 'La abertura central fue labrada en una sola pieza de roca volcánica, enmarcando el horizonte y la cordillera.', posicion: { x: 22.0, y: 1.8, z: -24.0 }, vista: { x: 0, y: 1.8, z: 6.5 } },
      { titulo: 'Alineación ceremonial', relato: 'Formaba parte del eje visual que integraba los portales con las salidas de astros y la geografía sagrada del altiplano.', posicion: { x: 23.6, y: 2.2, z: -24.0 }, vista: { x: 3.5, y: 2.4, z: 7.5 } }
    ]
  },
  bennett: {
    nombre: 'Monolito Bennett (Pachamama)', periodo: 'Época urbana tardía',
    descripcion: 'Estela antropomorfa monumental de cuerpo rectangular, con bandas de relieves y atributos rituales.',
    funcion: 'Representación ceremonial asociada a la autoridad y al culto.',
    datoCurioso: 'Es uno de los monolitos de mayor tamaño hallados en Tiwanaku.',
    imagen: 'assets/images/Monolito_Bennett.jpeg',
    posicion: { x: -42, y: 3.5, z: -3 },
    puntos: [
      { titulo: 'Monolito monumental', relato: 'La estela Bennett supera los siete metros y fue encontrada en Kalasasaya. Hoy se conserva en el Museo Lítico de Tiwanaku.', posicion: { x: -42, y: 5, z: -3 }, vista: { x: 6, y: 4, z: 8 } },
      { titulo: 'Bandas de relieves', relato: 'El cuerpo rectangular reúne bandas y motivos geométricos tallados que se leen de arriba abajo.', posicion: { x: -42, y: 3.5, z: -3 }, vista: { x: 5, y: 2, z: 7 } },
      { titulo: 'Piedra tallada', relato: 'El volumen y la superficie labrada convierten al monolito en una presencia central dentro del recinto de pilares.', posicion: { x: -42, y: 1.5, z: -3 }, vista: { x: 4, y: 1, z: 6 } }
    ]
  },
  kheriKala: {
    nombre: 'Kheri Kala', periodo: '500–900 d.C.',
    descripcion: 'Plataforma baja con recintos de piedra que complementa el paisaje urbano ceremonial.',
    funcion: 'Área de recintos y actividades vinculadas al conjunto monumental.',
    datoCurioso: 'Su planta permite observar cómo los espacios menores se enlazaban con las plazas mayores.',
    posicion: { x: 0, y: 1, z: 43 },
    puntos: [
      { titulo: 'Recintos', relato: 'Kheri Kala conserva plataformas y espacios delimitados que complementaban las plazas y edificios mayores del centro ceremonial.', posicion: { x: -6, y: 1.1, z: 43 }, vista: { x: -5, y: 3, z: 7 } },
      { titulo: 'Altar interior', relato: 'La plataforma central permite observar cómo los recintos menores organizaban actividades dentro del conjunto.', posicion: { x: 0, y: 1.5, z: 43 }, vista: { x: 5, y: 4, z: 7 } }
    ]
  },
  monolito: {
    nombre: 'Monolito Ponce', periodo: '500–900 d.C.',
    descripcion: 'Estela antropomorfa erguida en el centro del Templete, con cuerpo decorado por motivos escalonados y bandas geométricas.',
    funcion: 'Imagen ceremonial que presidía el patio hundido.',
    datoCurioso: 'Sus relieves incluyen un recipiente y elementos asociados a la iconografía ritual tiwanakota.',
    imagen: 'assets/images/Monolito_ponce.jpeg',
    posicion: { x: 0, y: -2.2, z: 0 },
    vista: { x: 0, y: 5.5, z: 9.5 },
    puntos: [
      { titulo: 'Figura antropomorfa', relato: 'El Monolito Ponce representa una figura de pie y ocupaba el centro del Templete Semisubterráneo.', posicion: { x: 0, y: -1.8, z: 0 }, vista: { x: 0, y: 4.5, z: 7.5 } },
      { titulo: 'Bandas geométricas', relato: 'El cuerpo está cubierto por bandas, motivos escalonados y detalles rituales que se distribuyen en toda la estela.', posicion: { x: 0, y: -2.5, z: 0 }, vista: { x: 0, y: 4.0, z: 6.5 } },
      { titulo: 'Centro del patio', relato: 'Su emplazamiento hacía que la estela presidiera el recinto hundido y fuera el foco visual de sus muros con cabezas clavas.', posicion: { x: 0, y: -3.5, z: 0 }, vista: { x: 5.5, y: 5.5, z: 8.0 } }
    ]
  }
};
