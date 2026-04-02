class Platform {
  constructor(x, y, w, h, useSprite = false) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.useSprite = useSprite; // false = cave wall style, true = sprite tiles
    this.echoAlpha = 0;
  }

  // Draw the platform — either sprite tiles or solid cave fill
  draw(p) {
    if (this.useSprite) {
      this._drawSprite(p);
    } else {
      this._drawSolid(p);
    }
  }

  // Solid cave-wall style (used for ceiling, floor, side walls)
  _drawSolid(p) {
    p.noStroke();
    p.fill(C.PLATFORM_COLOR);
    p.rect(this.x, this.y, this.w, this.h);

    p.stroke(C.PLATFORM_EDGE);
    p.strokeWeight(1);
    p.noFill();
    p.rect(this.x, this.y, this.w, this.h);
  }

  // Sprite tile style (used for floating platforms in the level)
  // Draws: left cap | mid_1, mid_2, mid_3 repeating | right cap
  _drawSprite(p) {
    const T = C.TILE;
    const totalTiles = Math.round(this.w / T);

    if (totalTiles <= 0) return;

    // Single tile wide — just draw left cap (no room for right)
    if (totalTiles === 1) {
      p.image(SPRITES.platform.left, this.x, this.y, T, T);
      return;
    }

    // Two tiles wide — left cap + right cap
    if (totalTiles === 2) {
      p.image(SPRITES.platform.left,  this.x,     this.y, T, T);
      p.image(SPRITES.platform.right, this.x + T, this.y, T, T);
      return;
    }

    // Three or more tiles — left | mid repeating | right
    p.image(SPRITES.platform.left, this.x, this.y, T, T);

    const midCount = totalTiles - 2;
    for (let i = 0; i < midCount; i++) {
      const variant = i % 3;  // cycles through mid_1, mid_2, mid_3
      const img = SPRITES.platform.mid[variant];
      p.image(img, this.x + T * (i + 1), this.y, T, T);
    }

    p.image(SPRITES.platform.right, this.x + T * (totalTiles - 1), this.y, T, T);
  }

  // Echo outline — same for both types
  drawEchoOutline(p) {
    if (this.echoAlpha <= 0) return;
    const a = this.echoAlpha;

    p.noFill();
    p.stroke(`rgba(255,90,40,${a * 0.25})`);
    p.strokeWeight(8);
    p.rect(this.x, this.y, this.w, this.h);

    p.stroke(`rgba(255,140,80,${a * 0.5})`);
    p.strokeWeight(3);
    p.rect(this.x, this.y, this.w, this.h);

    p.stroke(`rgba(255,200,160,${a * 0.9})`);
    p.strokeWeight(1);
    p.rect(this.x, this.y, this.w, this.h);
  }

  overlaps(ox, oy, ow, oh) {
    return ox < this.x + this.w &&
           ox + ow > this.x &&
           oy < this.y + this.h &&
           oy + oh > this.y;
  }
}
