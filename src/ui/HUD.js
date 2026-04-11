class HUD {
  constructor() {
    this.fruitPopTimer = 0;
    this.lastFruitCount = 0;
    this.messageText = '';
    this.messageTimer = 0;
    // Echo reminder tooltip — tracks real time so it survives HUD recreations
    this.lastEchoTime = Date.now();
    this.echoTooltipAlpha = 0;
    this.ECHO_REMINDER_MS = 20000; // 20 seconds
  }

  showMessage(text, frames = 150) {
    this.messageText = text;
    this.messageTimer = frames;
  }

  // Call this whenever the player successfully fires echolocation
  notifyEchoUsed() {
    this.lastEchoTime = Date.now();
    this.echoTooltipAlpha = 0;
  }

  update(level) {
    if (this.fruitPopTimer > 0) this.fruitPopTimer--;
    if (this.messageTimer > 0) this.messageTimer--;

    const collected = level.fruitsCollected;
    if (collected > this.lastFruitCount) {
      this.fruitPopTimer = 30;
      this.lastFruitCount = collected;
    }

    // Fade tooltip in/out based on real elapsed time since last echo use
    const elapsed = Date.now() - this.lastEchoTime;
    const shouldShow = elapsed >= this.ECHO_REMINDER_MS;
    const target = shouldShow ? 1 : 0;
    this.echoTooltipAlpha += (target - this.echoTooltipAlpha) * 0.05;
  }

  draw(p, player, level, echoSystem, isTutorial = false) {
    p.push();
    p.resetMatrix();

    const pad = 14;

    // ── Stamina bar ──────────────────────────────────────────────────
    const sbX = pad;
    const sbY = pad;
    const sbW = 130;
    const sbH = 10;
    const stRatio = player.stamina / C.MAX_STAMINA;

    // Background
    p.noStroke();
    p.fill('rgba(10,8,18,0.7)');
    p.rect(sbX - 4, sbY - 14, sbW + 8, sbH + 22, 6);

    // Label
    p.fill(C.TEXT_DIM);
    p.noStroke();
    p.textSize(9);
    p.textAlign(p.LEFT, p.TOP);
    p.textFont('monospace');
    p.text('DIVE STAMINA', sbX, sbY - 11);

    // Bar track
    p.fill('rgba(40,30,60,0.9)');
    p.rect(sbX, sbY, sbW, sbH, 3);

    // Bar fill
    const stColor = stRatio < 0.25 ? C.STAMINA_LOW_C : C.STAMINA_FULL;
    p.fill(stColor);
    p.rect(sbX, sbY, sbW * stRatio, sbH, 3);

    // Bar shimmer
    if (stRatio > 0.05) {
      p.fill('rgba(255,255,255,0.15)');
      p.rect(sbX, sbY, sbW * stRatio, sbH / 2, 3);
    }

    // Hanging indicator
    if (player.isHanging) {
      p.fill(C.HANG_GLOW);
      p.textSize(9);
      p.textAlign(p.LEFT, p.TOP);
      const pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.01);
      p.fill(`rgba(232,82,30,${pulse})`);
      p.text('RECHARGING', sbX, sbY + sbH + 4);
    }

    // ── HP ────────────────────────────────────────────────────────────
    const hpX = pad;
    const hpY = sbY + sbH + 26;
    p.noStroke();
    p.fill('rgba(10,8,18,0.7)');
    p.rect(hpX - 4, hpY - 4, 80, 20, 6);

    for (let i = 0; i < C.MAX_HP; i++) {
      const hx = hpX + i * 22;
      if (i < player.hp) {
        p.fill('#c42a0a');
        p.text('♥', hx, hpY);
      } else {
        p.fill('#2a0a06');
        p.text('♥', hx, hpY);
      }
      p.textSize(13);
      p.textAlign(p.LEFT, p.TOP);
    }

    // ── Echolocation cooldown + charges ──────────────────────────────
    const ecX = p.width - pad - 40;
    const ecY = pad;
    const ecR = 18;

    p.noStroke();
    p.fill('rgba(10,8,18,0.7)');
    p.circle(ecX, ecY + ecR, ecR * 2 + 10);

    // Cooldown arc
    p.noFill();
    p.stroke(echoSystem.isReady ? '#ff6030' : '#5a1a0a');
    p.strokeWeight(3);
    p.arc(ecX, ecY + ecR,
          ecR * 2, ecR * 2,
          -Math.PI / 2,
          -Math.PI / 2 + echoSystem.cooldownProgress * Math.PI * 2);

    // Icon — greyed out when no charges
    p.noStroke();
    p.fill(echoSystem.charges > 0 ? (echoSystem.isReady ? '#f0d5c8' : '#7c6e99') : '#3a1208');
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text('◎', ecX, ecY + ecR);

    // Key hint
    p.textSize(8);
    p.fill(C.TEXT_DIM);
    p.text('[E]', ecX, ecY + ecR + ecR + 4);

    // Charge dots — one dot per max charge, filled if available
    const dotR    = 3;
    const dotGap  = 8;
    const totalDotW = echoSystem.maxCharges * dotGap - 2;
    const dotStartX = ecX - totalDotW / 2 + dotR;
    const dotY = ecY + ecR * 2 + 14;

    for (let i = 0; i < echoSystem.maxCharges; i++) {
      const dx = dotStartX + i * dotGap;
      p.noStroke();
      if (i < echoSystem.charges) {
        p.fill('#ff6030');
      } else {
        p.fill('#3a1208');
      }
      p.circle(dx, dotY, dotR * 2);
    }

    // ── Echo reminder tooltip ─────────────────────────────────────────
    if (this.echoTooltipAlpha > 0.01) {
      const a   = this.echoTooltipAlpha;
      const ttY = dotY + dotR * 2 + 10;
      const ttX = ecX;
      const msg = 'press E to echolocate';

      p.textFont('monospace');
      p.textSize(9);
      p.textAlign(p.CENTER, p.TOP);

      const tw   = p.textWidth(msg);
      const padX = 7;
      const padY = 4;
      const bx   = ttX - tw / 2 - padX;
      const by   = ttY - padY;
      const bw   = tw + padX * 2;
      const bh   = 11 + padY * 2;

      // Background pill
      p.noStroke();
      p.fill(`rgba(15,7,5,${a * 0.85})`);
      p.rect(bx, by, bw, bh, 4);

      // Border
      p.noFill();
      p.stroke(`rgba(255,90,40,${a * 0.4})`);
      p.strokeWeight(1);
      p.rect(bx, by, bw, bh, 4);

      // Small upward arrow toward echo widget
      p.noStroke();
      p.fill(`rgba(255,90,40,${a * 0.5})`);
      p.triangle(ttX - 4, by, ttX + 4, by, ttX, by - 5);

      // Text
      p.noStroke();
      p.fill(`rgba(240,213,200,${a})`);
      p.text(msg, ttX, ttY);
    }

    // ── Fruit counter (hidden in tutorial) ───────────────────────────
    if (!isTutorial) {
      const fX = p.width / 2;
      const fY = pad + 2;
      const pop = this.fruitPopTimer > 0 ? 1 + (this.fruitPopTimer / 30) * 0.3 : 1;

      p.noStroke();
      p.fill('rgba(10,8,18,0.7)');
      p.rect(fX - 55, fY - 6, 110, 26, 8);

      p.textAlign(p.CENTER, p.TOP);
      p.textSize(11 * pop);
      const remaining = level.fruitsRemaining;
      p.fill(remaining === 0 ? '#6bcb77' : C.TEXT_MAIN);
      const label = remaining === 0
        ? '✓ Find the exit!'
        : `🍎 ${level.fruitsCollected} / ${level.data.fruitsNeeded}`;
      p.text(label, fX, fY);
    }

    // ── Level name (hidden in tutorial) ──────────────────────────────
    if (!isTutorial) {
      p.textAlign(p.CENTER, p.BOTTOM);
      p.textSize(10);
      p.fill(C.TEXT_DIM);
      p.text(level.data.name, p.width / 2, p.height - 8);
    }

    // ── Center message ───────────────────────────────────────────────
    if (this.messageTimer > 0) {
      const alpha = Math.min(1, this.messageTimer / 30);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(20);
      p.fill(`rgba(226,217,243,${alpha})`);
      // Shadow
      p.fill(`rgba(0,0,0,${alpha * 0.7})`);
      p.text(this.messageText, p.width / 2 + 1, p.height / 2 + 1);
      p.fill(`rgba(255,90,40,${alpha})`);
      p.text(this.messageText, p.width / 2, p.height / 2);
    }

    p.pop();
  }
}
