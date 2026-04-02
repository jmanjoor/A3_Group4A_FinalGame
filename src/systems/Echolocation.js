class Echolocation {
  constructor(maxCharges = 5) {
    this.maxCharges    = maxCharges;
    this.charges       = maxCharges;  // current uses remaining
    this.cooldownTimer = 0;
    this.echoTimer     = 0;
    this.pulseRadius   = 0;
    this.pulseActive   = false;
    this.pulseX        = 0;
    this.pulseY        = 0;
    this.active        = false;
  }

  trigger(playerCX, playerCY) {
    if (this.cooldownTimer > 0) return false;
    if (this.charges <= 0)      return false;

    this.charges--;
    this.cooldownTimer = C.ECHO_COOLDOWN;
    this.echoTimer     = C.ECHO_DURATION;
    this.pulseRadius   = 0;
    this.pulseActive   = true;
    this.pulseX        = playerCX;
    this.pulseY        = playerCY;
    this.active        = true;
    return true;
  }

  // Called when player collects a purple fruit
  addCharge() {
    this.charges = Math.min(this.maxCharges, this.charges + 1);
  }

  update() {
    if (this.cooldownTimer > 0) this.cooldownTimer--;

    if (this.echoTimer > 0) {
      this.echoTimer--;
      this.active = true;
    } else {
      this.active = false;
    }

    if (this.pulseActive) {
      this.pulseRadius += C.ECHO_RADIUS_GROWTH;
      if (this.pulseRadius > Math.max(C.WIDTH, C.HEIGHT) * 1.5) {
        this.pulseActive = false;
      }
    }
  }

  get echoAlpha() {
    if (this.echoTimer <= 0) return 0;
    if (this.echoTimer > C.ECHO_FADE_START) return 1;
    return this.echoTimer / C.ECHO_FADE_START;
  }

  get cooldownProgress() {
    if (this.cooldownTimer <= 0) return 1;
    return 1 - (this.cooldownTimer / C.ECHO_COOLDOWN);
  }

  get isReady() {
    return this.cooldownTimer <= 0 && this.charges > 0;
  }

  applyToLevel(level) {
    const alpha = this.echoAlpha;
    for (const p of level.platforms) p.echoAlpha = alpha;
    for (const s of level.spikes)    s.echoAlpha = alpha;
    for (const f of level.fruits)    if (!f.collected) f.echoAlpha = alpha;
    // Also light up the exit
    if (level.exit) level.exitEchoAlpha = alpha;
  }

  drawPulse(p) {
    if (!this.pulseActive) return;
    const alpha = Math.max(0, 1 - this.pulseRadius / 600);
    p.noFill();
    p.stroke(`rgba(255,90,40,${alpha * 0.7})`);
    p.strokeWeight(3);
    p.circle(this.pulseX, this.pulseY, this.pulseRadius * 2);
    p.stroke(`rgba(255,140,80,${alpha * 0.3})`);
    p.strokeWeight(8);
    p.circle(this.pulseX, this.pulseY, this.pulseRadius * 2 - 10);
  }
}
