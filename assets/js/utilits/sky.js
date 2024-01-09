

class SkyTexture {
  constructor(width, height) {
    this.canvas;
    this.ctx;
    this.width = width;
    this.height = height;

    this.topColor = 'rgb(175, 236, 236)';
    this.bottomColor = 'rgb(255, 182, 188)';

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'skyTexture';
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d');
    //document.body.appendChild(this.canvas);     // don't need to do this!
  }

  render() {
    // Create gradient
    const grd = this.ctx.createLinearGradient(0, 0, 0, this.height);
    grd.addColorStop(0.8, this.topColor);
    grd.addColorStop(0.2, this.bottomColor);

    // Fill with gradient
    this.ctx.fillStyle = grd;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
export { SkyTexture };
