import * as THREE from 'three';
import { createTemplete } from './templo-semisubterraneo.js';
import { createPuertaSol } from './puerta-sol.js';
import { createKalasasaya } from './kalasasaya.js';
import { createAkapana } from './akapana.js';
import { createPumaPunku } from './puma-punku.js';
import { createPuertaLuna, createPutuni, createKheriKala, createKantatallita, createDoublePerimeter } from './auxiliares.js';

export function createSitio(){
  const site=new THREE.Group();
  site.add(createDoublePerimeter(),createAkapana(),createTemplete(),createKalasasaya(),createPuertaSol(),createPumaPunku(),createPuertaLuna(),createPutuni(),createKheriKala(),createKantatallita());
  return site;
}
