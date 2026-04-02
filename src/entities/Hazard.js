class Spike {
  constructor(x, y, direction = 'up') {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.echoAlpha = 0;
    this.w = C.TILE;
    this.h = C.TILE;
  }

  draw(p) {
    const T = C.TILE;
    const numSpikes = 3;
    const spikeW = T / numSpikes;

    p.push();
    p.noStroke();
    for (let i = 0; i < numSpikes; i++) {
      const sx = this.x + i * spikeW + spikeW / 2;
      p.fill(C.SPIKE_COLOR);
      if (this.direction === 'up') {
        p.triangle(sx - spikeW * 0.5, this.y + T, sx + spikeW * 0.5, this.y + T, sx, this.y + 4);
      } else {
        p.triangle(sx - spikeW * 0.5, this.y, sx + spikeW * 0.5, this.y, sx, this.y + T - 4);
      }
    }
    p.pop();
  }

  drawEchoOutline(p) {
    if (this.echoAlpha <= 0) return;
    const T = C.TILE;
    const numSpikes = 3;
    const spikeW = T / numSpikes;
    const a = this.echoAlpha;

    p.push();
    for (let i = 0; i < numSpikes; i++) {
      const sx = this.x + i * spikeW + spikeW / 2;
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
    p.pop();
  }

  getHitbox() {
    const T = C.TILE;
    const shrink = 6;
    if (this.direction === 'up') {
      return { x: this.x + shrink, y: this.y + T / 2, w: T - shrink * 2, h: T / 2 };
    } else {
      return { x: this.x + shrink, y: this.y, w: T - shrink * 2, h: T / 2 };
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
