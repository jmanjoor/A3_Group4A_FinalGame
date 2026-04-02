class WelcomeScreen {
  constructor() {
    this.timer = 0;
    this.batAnim = 0;
    this.stars = Array.from({ length: 60 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 2 + 0.5,
      twinkle: Math.random() * Math.PI * 2,
    }));
  }

  update() {
    this.timer++;
    this.batAnim = this.timer;
  }

  draw(p) {
    p.background(C.BG);

    // Stars
    for (const s of this.stars) {
      const alpha = 0.3 + 0.3 * Math.sin(this.timer * 0.02 + s.twinkle);
      p.noStroke();
      p.fill(`rgba(226,217,243,${alpha})`);
      p.circle(s.x * p.width, s.y * p.height, s.size);
    }

    // Cave ceiling silhouette
    p.noStroke();
    p.fill('#0d0b14');
    p.beginShape();
    p.vertex(0, 0);
    for (let x = 0; x <= p.width; x += 30) {
      const h = 40 + Math.sin(x * 0.04 + this.timer * 0.005) * 20 + Math.sin(x * 0.09) * 15;
      p.vertex(x, h);
    }
    p.vertex(p.width, 0);
    p.endShape(p.CLOSE);

    // Cave floor silhouette
    p.fill('#0d0b14');
    p.beginShape();
    p.vertex(0, p.height);
    for (let x = 0; x <= p.width; x += 30) {
      const h = p.height - 40 - Math.sin(x * 0.04 + this.timer * 0.007 + 2) * 20 - Math.sin(x * 0.1) * 10;
      p.vertex(x, h);
    }
    p.vertex(p.width, p.height);
    p.endShape(p.CLOSE);

    // Animated bat in center
    this._drawCenterBat(p);

    // Title
    const titleY = p.height * 0.35;
    p.textAlign(p.CENTER, p.CENTER);

    // Title shadow / glow
    p.textSize(52);
    p.fill('rgba(180,40,10,0.3)');
    p.text('BLIND FLIGHT', p.width / 2 + 2, titleY + 2);

    p.fill('#ff6030');
    p.text('BLIND FLIGHT', p.width / 2, titleY);

    // Subtitle
    p.textSize(16);
    p.fill(C.TEXT_DIM);
    p.text('A bat platformer', p.width / 2, titleY + 46);

    // Blinking start prompt
    if (Math.floor(this.timer / 30) % 2 === 0) {
      p.textSize(15);
      p.fill('#e8521e');
      p.text('Press ENTER to begin', p.width / 2, p.height * 0.72);
    }

    // Controls preview
    p.textSize(11);
    p.fill(C.TEXT_DIM);
    p.text('WASD - Move & Dive   |   E - Echolocation', p.width / 2, p.height * 0.82);
  }

  _drawCenterBat(p) {
    const t = this.batAnim * 0.025;
    const cx = p.width / 2 + Math.sin(t) * 30;
    const cy = p.height * 0.55 + Math.sin(t * 1.3) * 15;
    const wingFlap = Math.sin(t * 6) * 0.5 + 0.5;
    const scale = 2.2;

    p.push();
    p.translate(cx, cy);
    p.scale(scale);

    // Wing shadow/glow
    p.noStroke();
    p.fill('rgba(180,40,10,0.15)');
    p.ellipse(0, 4, 50, 20);

    const wColor = '#9a1f08';

    // Wings
    p.fill(wColor);
    const lWingY = -4 + wingFlap * 10;
    p.beginShape();
    p.vertex(0, -2);
    p.vertex(-8, lWingY);
    p.vertex(-18, lWingY - 3);
    p.vertex(-14, lWingY + 7);
    p.vertex(-4, lWingY + 9);
    p.vertex(0, 2);
    p.endShape(p.CLOSE);

    const rWingY = -4 - wingFlap * 10;
    p.beginShape();
    p.vertex(0, -2);
    p.vertex(8, rWingY);
    p.vertex(18, rWingY - 3);
    p.vertex(14, rWingY + 7);
    p.vertex(4, rWingY + 9);
    p.vertex(0, 2);
    p.endShape(p.CLOSE);

    // Body
    p.fill('#2a0a06');
    p.ellipse(0, 2, 14, 12);

    // Head
    p.fill('#2a0a06');
    p.circle(0, -5, 12);

    // Ears
    p.fill('#2a0a06');
    p.triangle(-3, -9, -7, -16, -1, -11);
    p.triangle(3, -9, 7, -16, 1, -11);
    p.fill('rgba(220,140,200,0.6)');
    p.triangle(-3, -9, -6, -14, -2, -11);
    p.triangle(3, -9, 6, -14, 2, -11);

    // Eyes glow
    p.fill('rgba(255,90,40,0.4)');
    p.circle(-3, -5, 7);
    p.circle(3, -5, 7);
    p.fill('#e2d9f3');
    p.circle(-3, -5, 4);
    p.circle(3, -5, 4);
    p.fill('#120504');
    p.circle(-2.5, -5, 2.5);
    p.circle(3.5, -5, 2.5);

    p.pop();
  }
}
