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
    p.fill("#0d0b14");
    p.beginShape();
    p.vertex(0, 0);
    for (let x = 0; x <= p.width; x += 30) {
      const h =
        40 +
        Math.sin(x * 0.04 + this.timer * 0.005) * 20 +
        Math.sin(x * 0.09) * 15;
      p.vertex(x, h);
    }
    p.vertex(p.width, 0);
    p.endShape(p.CLOSE);

    // Cave floor silhouette
    p.fill("#0d0b14");
    p.beginShape();
    p.vertex(0, p.height);
    for (let x = 0; x <= p.width; x += 30) {
      const h =
        p.height -
        40 -
        Math.sin(x * 0.04 + this.timer * 0.007 + 2) * 20 -
        Math.sin(x * 0.1) * 10;
      p.vertex(x, h);
    }
    p.vertex(p.width, p.height);
    p.endShape(p.CLOSE);

    // Animated bat in center
    this._drawCenterBat(p);

    // Title logo — fills ~65% of canvas width for a dominant presence
    const logo = SPRITES.titleLogo;
    const maxLogoW = p.width * 0.65;
    const logoScale = Math.min(1, maxLogoW / logo.width);
    const logoW = logo.width * logoScale;
    const logoH = logo.height * logoScale;
    // Place center slightly above midpoint for visual balance
    const titleY = p.height * 0.26;
    p.imageMode(p.CENTER);
    p.image(logo, p.width / 2, titleY, logoW, logoH);
    p.imageMode(p.CORNER);

    // Subtitle — sized relative to canvas width, sits just below logo
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(p.width * 0.024);
    p.fill(C.TEXT_DIM);
    p.text(
      "A bat platformer",
      p.width / 2,
      titleY + logoH / 2 + p.width * 0.022,
    );

    // Blinking start prompt
    if (Math.floor(this.timer / 30) % 2 === 0) {
      p.textSize(p.width * 0.024);
      p.fill("#e8521e");
      p.text("Press ENTER to begin", p.width / 2, p.height * 0.76);
    }

    // Controls preview
    p.textSize(p.width * 0.017);
    p.fill(C.TEXT_DIM);
    p.text(
      "WASD - Move & Dive   |   E - Echolocation",
      p.width / 2,
      p.height * 0.87,
    );
  }

  _drawCenterBat(p) {
    const t = this.batAnim * 0.025;
    const cx = p.width / 2 + Math.sin(t) * 30;
    const cy = p.height * 0.55 + Math.sin(t * 1.3) * 15;
    const wingFlap = Math.sin(t * 6) * 0.5 + 0.5;
    const scale = 2.2;

    p.push();
    p.translate(cx, cy);

    // Shadow/glow under the bat
    p.noStroke();
    p.fill("rgba(180,40,10,0.15)");
    p.ellipse(0, 10, 110, 40);

    p.image(SPRITES.bat.animation, -sw / 2, -sh / 2, sw, sh);
    p.pop();
  }
}
