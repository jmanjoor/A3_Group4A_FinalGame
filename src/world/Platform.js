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
  // worldW/worldH are passed for solid platforms to pick the right wall sprite
  draw(p, worldW, worldH) {
    if (this.useSprite) {
      this._drawSprite(p);
    } else {
      this._drawSolid(p, worldW, worldH);
    }
  }

  // Solid cave-wall style — draws tile-by-tile using wall sprites for
  // border tiles, solid fill for interior blocks.
  // Priority: top row → bottom row → left col → right col → interior
  _drawSolid(p, worldW, worldH) {
    const T = C.TILE;
    const totalTiles = Math.round(this.w / T);
    const maxCol = Math.round(worldW / T) - 1;
    const maxRow = Math.round(worldH / T) - 1;
    const overlap = 10;  // extra pixels to stretch each tile
    const jitter  = 5;   // max random offset for natural look

    for (let i = 0; i < totalTiles; i++) {
      const tx = this.x + i * T;
      const col = Math.round(tx / T);
      const row = Math.round(this.y / T);

      let sprite = null;
      if (row === 0) {
        sprite = SPRITES.wall.top[col % 2];
      } else if (row === maxRow) {
        sprite = SPRITES.platform.mid[col % 3];
      } else if (col === 0) {
        sprite = SPRITES.wall.left[row % 2];
      } else if (col === maxCol) {
        sprite = SPRITES.wall.right[row % 2];
      }

      // Seeded hash for consistent per-tile randomness
      const hash = (col * 7 + row * 13 + col * row) & 0xFF;
      const _h = (seed) => ((seed * 2654435761) >>> 0) & 0xFFFF;
      const h2 = _h(hash + col * 17 + row * 53);

      if (sprite) {
        // Border tiles — slight overlap and irregular edges
        const bOverlap = 4;
        const bJitter  = 2;
        const box = (hash % (bJitter * 2 + 1)) - bJitter;
        const boy = ((hash >> 3) % (bJitter * 2 + 1)) - bJitter;
        const bx = tx - bOverlap / 2 + box;
        const by = this.y - bOverlap / 2 + boy;
        const bw = T + bOverlap;
        const bh = T + bOverlap;

        const ctx = p.drawingContext;
        ctx.save();

        // Smaller corner cuts for border tiles (2–8px)
        const bc0 = 2 + (_h(h2)      % 7);
        const bc1 = 2 + (_h(h2 + 1)  % 7);
        const bc2 = 2 + (_h(h2 + 2)  % 7);
        const bc3 = 2 + (_h(h2 + 3)  % 7);
        // Subtle midpoint dents (1–4px)
        const bm0 = 1 + (_h(h2 + 4)  % 4);
        const bm1 = 1 + (_h(h2 + 5)  % 4);
        const bm2 = 1 + (_h(h2 + 6)  % 4);
        const bm3 = 1 + (_h(h2 + 7)  % 4);
        const bmx0 = (_h(h2 + 8)  % 7) - 3;
        const bmx1 = (_h(h2 + 9)  % 7) - 3;
        const bmx2 = (_h(h2 + 10) % 7) - 3;
        const bmx3 = (_h(h2 + 11) % 7) - 3;

        ctx.beginPath();
        ctx.moveTo(bx + bc0, by);
        ctx.lineTo(bx + bw * 0.5 + bmx0, by + bm0);
        ctx.lineTo(bx + bw - bc1, by);
        ctx.lineTo(bx + bw, by + bc1);
        ctx.lineTo(bx + bw - bm1, by + bh * 0.5 + bmx1);
        ctx.lineTo(bx + bw, by + bh - bc2);
        ctx.lineTo(bx + bw - bc2, by + bh);
        ctx.lineTo(bx + bw * 0.5 + bmx2, by + bh - bm2);
        ctx.lineTo(bx + bc3, by + bh);
        ctx.lineTo(bx, by + bh - bc3);
        ctx.lineTo(bx + bm3, by + bh * 0.5 + bmx3);
        ctx.lineTo(bx, by + bc0);
        ctx.closePath();
        ctx.clip();

        p.image(sprite, bx, by, bw, bh);
        ctx.restore();
      } else {
        // Interior tiles — overlap, jitter, and irregular corner cuts
        const ox = (hash % (jitter * 2 + 1)) - jitter;
        const oy = ((hash >> 3) % (jitter * 2 + 1)) - jitter;

        const dx = tx - overlap / 2 + ox;
        const dy = this.y - overlap / 2 + oy;
        const dw = T + overlap;
        const dh = T + overlap;

        const ctx = p.drawingContext;
        ctx.save();

        // Random corner cuts (4–14px) — each corner different
        const c0 = 4 + (_h(h2)      % 11);
        const c1 = 4 + (_h(h2 + 1)  % 11);
        const c2 = 4 + (_h(h2 + 2)  % 11);
        const c3 = 4 + (_h(h2 + 3)  % 11);

        // Extra midpoint offsets along each edge for rougher shapes
        const m0 = 2 + (_h(h2 + 4)  % 6);  // top edge
        const m1 = 2 + (_h(h2 + 5)  % 6);  // right edge
        const m2 = 2 + (_h(h2 + 6)  % 6);  // bottom edge
        const m3 = 2 + (_h(h2 + 7)  % 6);  // left edge
        // Midpoint horizontal/vertical wobble
        const mx0 = (_h(h2 + 8)  % 9) - 4;
        const mx1 = (_h(h2 + 9)  % 9) - 4;
        const mx2 = (_h(h2 + 10) % 9) - 4;
        const mx3 = (_h(h2 + 11) % 9) - 4;

        ctx.beginPath();
        // Top edge: corner → midpoint → corner
        ctx.moveTo(dx + c0, dy);
        ctx.lineTo(dx + dw * 0.5 + mx0, dy + m0);
        ctx.lineTo(dx + dw - c1, dy);
        // Right edge
        ctx.lineTo(dx + dw, dy + c1);
        ctx.lineTo(dx + dw - m1, dy + dh * 0.5 + mx1);
        ctx.lineTo(dx + dw, dy + dh - c2);
        // Bottom edge
        ctx.lineTo(dx + dw - c2, dy + dh);
        ctx.lineTo(dx + dw * 0.5 + mx2, dy + dh - m2);
        ctx.lineTo(dx + c3, dy + dh);
        // Left edge
        ctx.lineTo(dx, dy + dh - c3);
        ctx.lineTo(dx + m3, dy + dh * 0.5 + mx3);
        ctx.lineTo(dx, dy + c0);
        ctx.closePath();
        ctx.clip();

        p.image(SPRITES.wall.interior, dx, dy, dw, dh);
        ctx.restore();
      }
    }
  }

  // Sprite tile style (used for floating platforms in the level)
  // Draws: left cap | mid_1, mid_2, mid_3 repeating | right cap
  // Each tile gets slight enlargement, jitter, and irregular edge clipping
  _drawSprite(p) {
    const T = C.TILE;
    const totalTiles = Math.round(this.w / T);
    if (totalTiles <= 0) return;

    const enlarge = 6;   // extra size per tile
    const jit = 2;       // position jitter

    const _h = (seed) => ((seed * 2654435761) >>> 0) & 0xFFFF;

    const _drawTile = (img, tileX, idx) => {
      const col = Math.round(tileX / T);
      const row = Math.round(this.y / T);
      const hash = (col * 7 + row * 13 + col * row + idx) & 0xFF;
      const h2 = _h(hash + col * 17 + row * 53);

      const ox = (hash % (jit * 2 + 1)) - jit;
      const oy = ((hash >> 3) % (jit * 2 + 1)) - jit;
      const dx = tileX - enlarge / 2 + ox;
      const dy = this.y - enlarge / 2 + oy;
      const dw = T + enlarge;
      const dh = T + enlarge;

      const ctx = p.drawingContext;
      ctx.save();

      // Corner cuts (2–7px) and midpoint dents (1–3px)
      const c0 = 2 + (_h(h2)      % 6);
      const c1 = 2 + (_h(h2 + 1)  % 6);
      const c2 = 2 + (_h(h2 + 2)  % 6);
      const c3 = 2 + (_h(h2 + 3)  % 6);
      const m0 = 1 + (_h(h2 + 4)  % 3);
      const m1 = 1 + (_h(h2 + 5)  % 3);
      const m2 = 1 + (_h(h2 + 6)  % 3);
      const m3 = 1 + (_h(h2 + 7)  % 3);
      const mx0 = (_h(h2 + 8)  % 7) - 3;
      const mx1 = (_h(h2 + 9)  % 7) - 3;
      const mx2 = (_h(h2 + 10) % 7) - 3;
      const mx3 = (_h(h2 + 11) % 7) - 3;

      ctx.beginPath();
      ctx.moveTo(dx + c0, dy);
      ctx.lineTo(dx + dw * 0.5 + mx0, dy + m0);
      ctx.lineTo(dx + dw - c1, dy);
      ctx.lineTo(dx + dw, dy + c1);
      ctx.lineTo(dx + dw - m1, dy + dh * 0.5 + mx1);
      ctx.lineTo(dx + dw, dy + dh - c2);
      ctx.lineTo(dx + dw - c2, dy + dh);
      ctx.lineTo(dx + dw * 0.5 + mx2, dy + dh - m2);
      ctx.lineTo(dx + c3, dy + dh);
      ctx.lineTo(dx, dy + dh - c3);
      ctx.lineTo(dx + m3, dy + dh * 0.5 + mx3);
      ctx.lineTo(dx, dy + c0);
      ctx.closePath();
      ctx.clip();

      p.image(img, dx, dy, dw, dh);
      ctx.restore();
    };

    if (totalTiles === 1) {
      _drawTile(SPRITES.platform.left, this.x, 0);
      return;
    }

    if (totalTiles === 2) {
      _drawTile(SPRITES.platform.left,  this.x,     0);
      _drawTile(SPRITES.platform.right, this.x + T, 1);
      return;
    }

    // Three or more tiles — left | mid repeating | right
    _drawTile(SPRITES.platform.left, this.x, 0);
    const midCount = totalTiles - 2;
    for (let i = 0; i < midCount; i++) {
      const variant = i % 3;
      _drawTile(SPRITES.platform.mid[variant], this.x + T * (i + 1), i + 1);
    }
    _drawTile(SPRITES.platform.right, this.x + T * (totalTiles - 1), totalTiles - 1);
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
