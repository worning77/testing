import * as THREE from '../libs/three/three.module.js';
import { inFORM_Pin } from './inFORM-Pin.js';

class inFORM {
  constructor(app) {
    this.app = app;
    this.Pins = [];
    this.PinMeshes = [];
    this.grid_x = 24; // 24x24 grid
    this.grid_y = 24; // 24x24 grid
  }

  createInFORM() {
    const app = this.app;
    const InFORM = new THREE.Group();

    const pinSide = 9.525; // side length in mm
    const pinHeight = 110; // initial height in mm
    const spacing = 3.175; // spacing in mm

    const totalWidth = this.grid_x * pinSide + (this.grid_x - 1) * spacing;
    const totalWidth2 = this.grid_x * pinSide + (this.grid_x + 1) * spacing;
    this.createBox(totalWidth2, app);
    const offset = totalWidth / 2;

    var axisHelper = new THREE.AxesHelper(50);
    axisHelper.position.set(-offset - 15, 0, -offset - 15);
    app.scene.add(axisHelper);

    for (let j = 0; j < this.grid_y; j++) {
      for (let i = 0; i < this.grid_x; i++) {
        const x = i * (pinSide + spacing) - offset;
        const z = j * (pinSide + spacing) - offset;
        let id = j * this.grid_y + i;

        const pin = new inFORM_Pin(this);
        pin.createPin(x, z, pinSide, pinHeight, id);
        pin.setPos(0);
        this.Pins.push(pin);
        this.PinMeshes.push(pin.getMesh());
        InFORM.add(pin.getMesh());
      }
    }
    //InFORM.rotation.y = -Math.PI / 2;
    app.scene.add(InFORM);
  }
  createBox(totalWidth, app) {
    const plateWidth = totalWidth * 1.3;
    const plateHeight = totalWidth * 1.3;
    const plateDepth = 500;
    const holeWidth = totalWidth;
    const holeHeight = totalWidth;

    const plateShape = new THREE.Shape();
    plateShape.moveTo(0, 0);
    plateShape.lineTo(0, plateHeight);
    plateShape.lineTo(plateWidth, plateHeight);
    plateShape.lineTo(plateWidth, 0);
    plateShape.lineTo(0, 0);

    // Create a hole in the shape
    const holeShape = new THREE.Shape();
    holeShape.moveTo(
      (plateWidth - holeWidth) / 2,
      (plateHeight - holeHeight) / 2
    );
    holeShape.lineTo(
      (plateWidth + holeWidth) / 2,
      (plateHeight - holeHeight) / 2
    );
    holeShape.lineTo(
      (plateWidth + holeWidth) / 2,
      (plateHeight + holeHeight) / 2
    );
    holeShape.lineTo(
      (plateWidth - holeWidth) / 2,
      (plateHeight + holeHeight) / 2
    );
    holeShape.lineTo(
      (plateWidth - holeWidth) / 2,
      (plateHeight - holeHeight) / 2
    );

    plateShape.holes.push(holeShape);

    const extrudeSettings = {
      steps: 2,
      depth: plateDepth,
      bevelEnabled: false,
    };

    const plateGeometry = new THREE.ExtrudeGeometry(
      plateShape,
      extrudeSettings
    );

    const plateMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const acrylicPlate_top = new THREE.Mesh(plateGeometry, plateMaterial);
    const spacing = 3.175; // spacing in mm

    acrylicPlate_top.rotation.x = -Math.PI / 2;
    //acrylicPlate_top.rotation.y = Math.PI;
    // Position the plate above the pins
    acrylicPlate_top.position.set(
      -plateWidth / 2 - 1.5 * spacing,
      -plateDepth,
      plateHeight / 2 - 1.5 * spacing
    );

    app.scene.add(acrylicPlate_top);
  }
}
export { inFORM };
