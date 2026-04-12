class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.lerpSpeed = 0.1;
  }

  update(player, worldW, worldH, viewW, viewH, dt = 1.0) {
    // Guard against NaN player position corrupting the camera
    const px = isFinite(player.x) ? player.x : this.x;
    const py = isFinite(player.y) ? player.y : this.y;

    this.targetX = px + player.w / 2 - viewW / 2;
    this.targetY = py + player.h / 2 - viewH / 2;

    this.targetX = Math.max(0, Math.min(this.targetX, worldW - viewW));
    this.targetY = Math.max(0, Math.min(this.targetY, worldH - viewH));

    // dt-aware lerp: 1 - (1 - speed)^dt gives the same lag feel at any
    // frame rate. At dt=1 (60 fps) this equals lerpSpeed exactly.
    const lerpFactor = 1 - Math.pow(1 - this.lerpSpeed, dt);
    this.x += (this.targetX - this.x) * lerpFactor;
    this.y += (this.targetY - this.y) * lerpFactor;

    // Final safety: if camera position is somehow still invalid, reset to 0
    if (!isFinite(this.x)) this.x = 0;
    if (!isFinite(this.y)) this.y = 0;
  }

  apply(p) {
    const tx = isFinite(this.x) ? -Math.round(this.x) : 0;
    const ty = isFinite(this.y) ? -Math.round(this.y) : 0;
    p.translate(tx, ty);
  }

  // Convert screen coords to world coords
  screenToWorld(sx, sy) {
    return { x: sx + this.x, y: sy + this.y };
  }

  // Convert world coords to screen coords
  worldToScreen(wx, wy) {
    return { x: wx - this.x, y: wy - this.y };
  }

  // Snap instantly (e.g., on level load)
  snap(player, worldW, worldH, viewW, viewH) {
    this.update(player, worldW, worldH, viewW, viewH);
    this.x = this.targetX;
    this.y = this.targetY;
  }
}
