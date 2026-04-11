class Spike {
  constructor(x, y, direction = 'up', w = C.TILE, attached = false) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.w = w;
    this.h = C.TILE;
    this.attached = attached;
    this.echoAlpha = 0;
  }

  draw(p) {
    const T = C.TILE;
    const totalTiles = Math.round(this.w / T);
    if (totalTiles <= 0) return;

    // Pick normal or flipped sprite set based on platform attachment
    const spr = this.attached
      ? { left: SPRITES.spike.left, right: SPRITES.spike.right, mid: SPRITES.spike.mid }
      : { left: SPRITES.spike.leftFlipped, right: SPRITES.spike.rightFlipped, mid: SPRITES.spike.midFlipped };

    p.push();

    // Nudge sprites so they make contact with the adjacent platform
    const nudge = 6;
    const drawY = this.direction === 'down' ? this.y - nudge : this.y + nudge;

    // Sprites are naturally down-pointing; flip for up-pointing spikes
    if (this.direction === 'up') {
      p.translate(0, 2 * drawY + T);
      p.scale(1, -1);
    }

    if (totalTiles === 1) {
      p.image(spr.left, this.x, drawY, T, T);
    } else if (totalTiles === 2) {
      p.image(spr.left, this.x, drawY, T, T);
      p.image(spr.right, this.x + T, drawY, T, T);
    } else {
      // 3+ tiles: left cap | mid cycling 1,2 | right cap
      p.image(spr.left, this.x, drawY, T, T);
      const midCount = totalTiles - 2;
      for (let i = 0; i < midCount; i++) {
        p.image(spr.mid[i % 2], this.x + T * (i + 1), drawY, T, T);
      }
      p.image(spr.right, this.x + T * (totalTiles - 1), drawY, T, T);
    }

    p.pop();
  }

  drawEchoOutline(p) {
    if (this.echoAlpha <= 0) return;
    const T = C.TILE;
    const totalTiles = Math.round(this.w / T);
    const numSpikes = 3;
    const spikeW = T / numSpikes;
    const a = this.echoAlpha;

    p.push();
    for (let t = 0; t < totalTiles; t++) {
      for (let i = 0; i < numSpikes; i++) {
        const sx = this.x + t * T + i * spikeW + spikeW / 2;
        let x1, y1, x2, y2, tipX, tipY;
        if (this.direction === 'up') {
          x1 = sx - spikeW * 0.5; y1 = this.y + T;
          x2 = sx + spikeW * 0.5; y2 = this.y + T;
          tipX = sx; tipY = this.y + 4;
        } else {
          x1 = sx - spikeW * 0.5; y1 = this.y;
          x2 = sx + spikeW * 0.5; y2 = this.y;
          tipX = sx; tipY = this.y + T - 4;
        }

        p.noFill();
        p.stroke(`rgba(255,80,80,${a * 0.2})`);   p.strokeWeight(6);
        p.triangle(x1, y1, x2, y2, tipX, tipY);
        p.stroke(`rgba(255,120,120,${a * 0.55})`); p.strokeWeight(2);
        p.triangle(x1, y1, x2, y2, tipX, tipY);
        p.stroke(`rgba(255,200,200,${a * 0.9})`);  p.strokeWeight(1);
        p.line(x1, y1, tipX, tipY);
        p.line(x2, y2, tipX, tipY);
      }
    }
    p.pop();
  }

  getHitbox() {
    const T = C.TILE;
    const shrink = 6;
    if (this.direction === 'up') {
      return { x: this.x + shrink, y: this.y + T / 2, w: this.w - shrink * 2, h: T / 2 };
    } else {
      return { x: this.x + shrink, y: this.y, w: this.w - shrink * 2, h: T / 2 };
    }
  }

  collidesWith(player) {
    const hb = this.getHitbox();
    return player.x < hb.x + hb.w &&
           player.x + player.w > hb.x &&
           player.y < hb.y + hb.h &&
           player.y + player.h > hb.y;
  }
}
