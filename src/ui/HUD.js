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

    // ── Consistent spacing base — all sizes derived from canvas width ──
    const PAD       = Math.round(p.width * 0.020);  // ~16px at 800w
    const FONT_XS   = Math.round(p.width * 0.013);  // ~10px — tiny labels
    const FONT_SM   = Math.round(p.width * 0.016);  // ~13px — secondary
    const FONT_MD   = Math.round(p.width * 0.022);  // ~18px — primary

    p.textFont('monospace');
    p.noStroke();

    // ── Left panel: Stamina + HP (grouped) ───────────────────────────
    const sbX  = PAD;
    const sbW  = Math.round(p.width * 0.190);  // ~152px
    const sbH  = Math.round(p.width * 0.015);  // ~12px — thicker bar
    const sbY  = PAD + FONT_XS + 5;            // below the label
    const stRatio = player.stamina / C.MAX_STAMINA;

    // Unified panel background (covers label + bar + hearts)
    p.fill('rgba(10,8,18,0.78)');
    p.rect(sbX - 6, PAD - 6, sbW + 18, sbH + FONT_XS + 52, 9);

    // Label
    p.fill(C.TEXT_DIM);
    p.textSize(FONT_XS);
    p.textAlign(p.LEFT, p.TOP);
    p.text('DIVE STAMINA', sbX, PAD);

    // Bar track
    p.fill('rgba(40,30,60,0.9)');
    p.rect(sbX, sbY, sbW, sbH, 4);

    // Bar fill
    const stColor = stRatio < 0.25 ? C.STAMINA_LOW_C : C.STAMINA_FULL;
    p.fill(stColor);
    if (sbW * stRatio > 0) p.rect(sbX, sbY, sbW * stRatio, sbH, 4);

    // Bar shimmer
    if (stRatio > 0.05) {
      p.fill('rgba(255,255,255,0.15)');
      p.rect(sbX, sbY, sbW * stRatio, sbH / 2, 4);
    }

    // Hanging indicator — replaces space below bar while active
    if (player.isHanging) {
      const pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.01);
      p.fill(`rgba(232,82,30,${pulse})`);
      p.textSize(FONT_XS);
      p.textAlign(p.LEFT, p.TOP);
      p.text('RECHARGING', sbX, sbY + sbH + 5);
    }

    // ── HP hearts ────────────────────────────────────────────────────
    const hpY      = sbY + sbH + 24;
    const heartSz  = Math.round(p.width * 0.022);  // ~18px — larger hearts
    const heartGap = heartSz + 5;

    p.textSize(heartSz);
    p.textAlign(p.LEFT, p.TOP);
    for (let i = 0; i < C.MAX_HP; i++) {
      p.fill(i < player.hp ? '#c42a0a' : '#2a0a06');
      p.text('♥', sbX + i * heartGap, hpY);
    }

    // ── Echolocation (top-right) ──────────────────────────────────────
    const ecR = Math.round(p.width * 0.030);   // ~24px radius
    const ecX = p.width - PAD - ecR;
    const ecY = PAD + ecR;

    // Background
    p.noStroke();
    p.fill('rgba(10,8,18,0.78)');
    p.circle(ecX, ecY, (ecR + 9) * 2);

    // Cooldown arc
    p.noFill();
    p.stroke(echoSystem.isReady ? '#ff6030' : '#5a1a0a');
    p.strokeWeight(3.5);
    p.arc(ecX, ecY,
          ecR * 2, ecR * 2,
          -Math.PI / 2,
          -Math.PI / 2 + echoSystem.cooldownProgress * Math.PI * 2);

    // Icon
    p.noStroke();
    p.fill(echoSystem.charges > 0 ? (echoSystem.isReady ? '#f0d5c8' : '#7c6e99') : '#3a1208');
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(FONT_MD);
    p.text('◎', ecX, ecY);

    // Key hint
    p.textSize(FONT_XS);
    p.fill(C.TEXT_DIM);
    p.text('[E]', ecX, ecY + ecR + 11);

    // Charge dots
    const dotR      = 3.5;
    const dotGap    = 9;
    const totalDotW = echoSystem.maxCharges * dotGap - 2;
    const dotStartX = ecX - totalDotW / 2 + dotR;
    const dotY      = ecY + ecR + 22;

    for (let i = 0; i < echoSystem.maxCharges; i++) {
      p.noStroke();
      p.fill(i < echoSystem.charges ? '#ff6030' : '#3a1208');
      p.circle(dotStartX + i * dotGap, dotY, dotR * 2);
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

    // ── Fruit counter (top-center, hidden in tutorial) ────────────────
    if (!isTutorial) {
      const fX       = p.width / 2;
      const fY       = PAD;
      const popScale = this.fruitPopTimer > 0 ? 1 + (this.fruitPopTimer / 30) * 0.22 : 1;
      const fruitSz  = Math.round(FONT_SM * popScale);

      p.textSize(fruitSz);
      const remaining = level.fruitsRemaining;
      const label = remaining === 0
        ? '✓ Find the exit!'
        : `🍎 ${level.fruitsCollected} / ${level.data.fruitsNeeded}`;

      const tw = p.textWidth(label);
      p.noStroke();
      p.fill('rgba(10,8,18,0.78)');
      p.rect(fX - tw / 2 - 14, fY - 5, tw + 28, fruitSz + 14, 9);

      p.textAlign(p.CENTER, p.TOP);
      p.fill(remaining === 0 ? '#6bcb77' : C.TEXT_MAIN);
      p.text(label, fX, fY + 2);
    }

    // ── Level name (bottom-center, hidden in tutorial) ────────────────
    if (!isTutorial) {
      p.textSize(FONT_SM);
      p.textAlign(p.CENTER, p.BOTTOM);

      // Pill background sized to actual text
      const lw = p.textWidth(level.data.name);
      p.noStroke();
      p.fill('rgba(10,8,18,0.65)');
      p.rect(
        p.width / 2 - lw / 2 - 12,
        p.height - FONT_SM - PAD - 6,
        lw + 24,
        FONT_SM + 12,
        6
      );

      p.fill(C.TEXT_DIM);
      p.text(level.data.name, p.width / 2, p.height - PAD / 2);
    }

    // ── Center message ────────────────────────────────────────────────
    if (this.messageTimer > 0) {
      const alpha = Math.min(1, this.messageTimer / 30);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(Math.round(p.width * 0.030));  // ~24px

      // Shadow drawn first so it sits behind
      p.noStroke();
      p.fill(`rgba(0,0,0,${alpha * 0.7})`);
      p.text(this.messageText, p.width / 2 + 1, p.height / 2 + 1);

      p.fill(`rgba(255,90,40,${alpha})`);
      p.text(this.messageText, p.width / 2, p.height / 2);
    }

    p.pop();
  }
}
