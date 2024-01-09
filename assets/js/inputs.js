import * as THREE from './libs/three/three.module.js';

class Inputs {
  constructor(app) {


    app.onMouseDown((controller) => {
      this._onMouseDownL(app, controller);
      this._onMouseDownT(app, controller);
      this._onMouseDownZ(app, controller);
      this._onMouseDelete(app, controller);
    });


  }
}
export { Inputs };
