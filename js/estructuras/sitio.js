import * as THREE from 'three';
import { createTemplete } from './templo-semisubterraneo.js';
import { createKalasasaya } from './kalasasaya.js';
import { createAkapana } from './akapana.js';
import { createChachapuma } from './chachapuma.js';
import { createPumaPunku } from './puma-punku.js';
import { createKheriKala, createDoublePerimeter } from './auxiliares.js';

export function createSitio(){
  const site=new THREE.Group();
  site.add(createDoublePerimeter(),createAkapana(),createChachapuma(),createTemplete(),createKalasasaya(),createPumaPunku(),createKheriKala());
  return site;
}
