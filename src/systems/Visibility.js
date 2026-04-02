class Visibility {
  constructor() {
    this._maskCanvas = null;
    this._ctx = null;
  }

  _ensureCanvas(w, h) {
    if (!this._maskCanvas || this._maskCanvas.width !== w || this._maskCanvas.height !== h) {
      this._maskCanvas = document.createElement('canvas');
      this._maskCanvas.width = w;
      this._maskCanvas.height = h;
      this._ctx = this._maskCanvas.getContext('2d');
    }
  }

  apply(p, playerScreenX, playerScreenY, viewW, viewH) {
    this._ensureCanvas(viewW, viewH);
    const ctx = this._ctx;

    // Always reset composite mode first — if a previous frame threw mid-draw
    // this ensures we never start a frame in destination-out mode
    ctx.globalCompositeOperation = 'source-over';

    // Guard against NaN/Infinity coordinates (can happen during death or
    // level transitions before the camera has a valid position)
    const safeX = isFinite(playerScreenX) ? playerScreenX : viewW / 2;
    const safeY = isFinite(playerScreenY) ? playerScreenY : viewH / 2;

    try {
      ctx.clearRect(0, 0, viewW, viewH);

      // Fill with dark fog
      ctx.fillStyle = 'rgba(15,7,5,0.97)';
      ctx.fillRect(0, 0, viewW, viewH);

      // Cut out vision circle around the player
      ctx.globalCompositeOperation = 'destination-out';
      const grad = ctx.createRadialGradient(
        safeX, safeY, C.VISION_RADIUS * 0.3,
        safeX, safeY, C.VISION_RADIUS + C.VISION_SOFTNESS
      );
      grad.addColorStop(0,   'rgba(0,0,0,1)');
      grad.addColorStop(0.6, 'rgba(0,0,0,0.95)');
      grad.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(safeX, safeY, C.VISION_RADIUS + C.VISION_SOFTNESS, 0, Math.PI * 2);
      ctx.fill();

    } catch (e) {
      // If anything goes wrong, draw a fully opaque fog so the game
      // stays playable rather than revealing the whole level
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(15,7,5,0.97)';
      ctx.fillRect(0, 0, viewW, viewH);
    } finally {
      // Always restore composite mode before drawing to the p5 canvas
      ctx.globalCompositeOperation = 'source-over';
    }

    // Reset p5's transform before writing directly to the underlying context,
    // then restore so subsequent p5 draw calls aren't affected
    p.push();
    p.resetMatrix();
    p.drawingContext.drawImage(this._maskCanvas, 0, 0);
    p.pop();
  }
}
