import * as THREE from '../libs/three/three.module.js';

class background {
  constructor() {
    this.worldSize = 3000;
    this.createSkySphere = function(texture) {
      texture = new THREE.CanvasTexture(texture);
      const skySphere_geom = new THREE.SphereGeometry(this.worldSize, 100, 100);
      const skySphere_mat = new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        map: texture,
        fog: false,
      });
      this.skySphere = new THREE.Mesh(skySphere_geom, skySphere_mat);
      this.skySphere.material.map.needsUpdate = true;
      return this.skySphere;
    };
  }
}
export { background };
