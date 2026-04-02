class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.lerpSpeed = 0.1;
  }

  update(player, worldW, worldH, viewW, viewH) {
    // Guard against NaN player position corrupting the camera
    const px = isFinite(player.x) ? player.x : this.x;
    const py = isFinite(player.y) ? player.y : this.y;

    this.targetX = px + player.w / 2 - viewW / 2;
    this.targetY = py + player.h / 2 - viewH / 2;

    this.targetX = Math.max(0, Math.min(this.targetX, worldW - viewW));
    this.targetY = Math.max(0, Math.min(this.targetY, worldH - viewH));

    this.x += (this.targetX - this.x) * this.lerpSpeed;
    this.y += (this.targetY - this.y) * this.lerpSpeed;

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
