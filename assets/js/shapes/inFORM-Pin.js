import * as THREE from '../libs/three/three.module.js';

class inFORM_Pin {
  constructor(inFORM) {
    this.parent = inFORM.app;
    this.isInitialized = false;
    this.isButton = false;
    this.isPressing = false;
    this.maxHeight = 100;
    this.targetY = 0;
  }

  createPin(x, z, baseSide, height, id) {
    this.baseSide = baseSide;
    const geometry = new THREE.BoxGeometry(baseSide, height, baseSide);
    geometry.translate(0, -height / 2, 0);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.mesh = new THREE.Mesh(geometry, material);

    // Edge mesh
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const wireframeGeometry = new THREE.BufferGeometry();
    const positions = edges.attributes.position.array;
    // Manipulate positions or create multiple lines here to simulate thickness
    wireframeGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(positions), 3)
    );

    const lineSegments = new THREE.LineSegments(
      wireframeGeometry,
      lineMaterial
    );
    this.mesh.add(lineSegments);

    // Outline mesh
    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.BackSide,
    }); // Black color
    const outlineMesh = new THREE.Mesh(geometry, outlineMaterial);
    outlineMesh.scale.multiplyScalar(1.14); // Slightly larger
    this.mesh.add(outlineMesh); // Add outline mesh as a child of the original mesh

    this.mesh.position.set(x, 0, z);

    // * ID text
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.createIDMesh(textMaterial, id);
    this.mesh.userData.pinInstance = this;
  }

  createIDMesh(textMaterial, id) {
    const textGeometry = new THREE.TextGeometry(id.toString(), {
      font: this.parent.id_font,
      size: 2,
      height: 0.1,
    });
    this.id_text = new THREE.Mesh(textGeometry, textMaterial);
    this.id_text.position.set(-3, 1, 0);
    this.id_text.rotation.x = -Math.PI / 2;
    this.id_text.visible = false;
    this.mesh.add(this.id_text);
  }

  resetFlags() {
    this.isInitialized = false;
    this.isButton = false;
    this.isPressing = false;
  }

  // Method to get the mesh for adding to the scene
  getMesh() {
    return this.mesh;
  }

  getPos(){
    return this.mesh.position.y;
    //this.targetY;
  }

  // Method to update the height of the pin
  setPos(newY) {
    this.targetY = newY <= this.maxHeight ? newY : this.maxHeight;
    if (newY < 0) this.targetY = 0;
  }

  updatePos(deltaTime) {
    //console.log(this.targetY);
    if (this.mesh.position.y !== this.targetY) {
      const lerpFactor = 2.55;
      this.mesh.position.y +=
        (this.targetY - this.mesh.position.y) * lerpFactor * deltaTime;
    }
  }
  //* color
  updateMaterial() {
    if (this.isButton && this.mesh.material.color.getHex() != '0xffa500')
      this.setAsButton();
    if (!this.isButton && this.mesh.material.color.getHex() != '0xffffff')
      this.reset();
  }

  reset() {
    const newMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.mesh.material = newMaterial;
    this.mesh.needsUpdate = true;
  }

  setAsButton() {
    const newMaterial = new THREE.MeshBasicMaterial({ color: 0xffa500 });
    this.mesh.material = newMaterial;
    this.mesh.needsUpdate = true;
  }
}

export { inFORM_Pin };
