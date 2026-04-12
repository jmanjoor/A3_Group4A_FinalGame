// Player movement states — mutually exclusive
const PSTATE = {
  HANGING: "hanging", // gripping ceiling or wall, stamina recharging
  PLATFORM_TOP: "platform_top", // standing on top of a platform, slow walk
  AIRBORNE: "airborne", // free flight, gravity active
  DIVING: "diving", // actively pressing dive key
};

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 22;
    this.h = 16;
    this.vx = 0;
    this.vy = 0;

    // Stats
    this.hp = C.MAX_HP;
    this.stamina = C.MAX_STAMINA;
    this.invincibleTimer = 0;

    // Single explicit state — no overlapping boolean flags
    this.pstate = PSTATE.AIRBORNE;
    this.facingRight = true;
    this.dead = false;
    this.deathTimer = 0;

    // Raw collision results from physics (set each frame in _move)
    this.onCeiling = false;
    this.onFloor = false;
    this.onWall = 0;

    // Coyote time
    this.coyoteTimer = 0;

    // Track whether dive key was already held when landing,
    // so we require a fresh press to release from platform top
    this._diveHeldLastFrame = false;

    // Animation
    this.animTimer = 0;
    this.animFrame = 0;
    this.keysActive = false;
  }

  // ── Convenience getters derived from pstate ───────────────────────────
  get isHanging() {
    return this.pstate === PSTATE.HANGING;
  }
  get isOnPlatformTop() {
    return this.pstate === PSTATE.PLATFORM_TOP;
  }
  get isDiving() {
    return this.pstate === PSTATE.DIVING;
  }
  get isAirborne() {
    return this.pstate === PSTATE.AIRBORNE;
  }

  // ── Update ────────────────────────────────────────────────────────────
  // dt: normalised elapsed time (1.0 = one frame at 60 fps).
  // Defaults to 1.0 so callers that don't pass it stay identical.
  update(keys, platforms, dt = 1.0) {
    if (this.dead) {
      this.deathTimer++;
      return;
    }

    // If position or velocity has somehow become NaN/Infinity, recover
    // immediately rather than letting it compound into permanent corruption
    if (!isFinite(this.x) || !isFinite(this.y)) {
      this.x = platforms.length > 0 ? platforms[0].x + 32 : 100;
      this.y = platforms.length > 0 ? platforms[0].y + 32 : 100;
    }
    if (!isFinite(this.vx)) this.vx = 0;
    if (!isFinite(this.vy)) this.vy = 0;

    this.keysActive = keys.left || keys.right || keys.down || keys.space;
    this._handleInput(keys, dt);
    this._applyGravity(dt);
    this._move(platforms, dt);
    this._resolveState(keys);
    this._updateStamina(dt);
    this._updateAnimation();
    if (this.invincibleTimer > 0) this.invincibleTimer--;
  }

  _handleInput(keys, dt) {
    // vx is SET to a fixed speed each frame (not accumulated), so the
    // speed value itself doesn't need dt scaling. The per-frame displacement
    // is applied as vx*dt inside _move, keeping movement rate consistent.
    if (keys.left) {
      this.vx = -C.MOVE_SPEED;
      this.facingRight = false;
    } else if (keys.right) {
      this.vx = C.MOVE_SPEED;
      this.facingRight = true;
    } else {
      // dt-aware friction: Math.pow(factor, dt) gives the same deceleration
      // curve per second regardless of frame rate.
      // At dt=1 (60 fps) these equal the original 0.5 / 0.7 exactly.
      const fric =
        this.pstate === PSTATE.PLATFORM_TOP
          ? Math.pow(0.5, dt)
          : Math.pow(0.7, dt);
      this.vx *= fric;
    }

    // Clamp walk speed on platform top
    if (this.pstate === PSTATE.PLATFORM_TOP) {
      this.vx = Math.max(-C.WALK_SPEED, Math.min(C.WALK_SPEED, this.vx));
    }

    // Dive input — dt-scaled impulse so dive acceleration is frame-rate
    // independent. The vy cap (6) is on the raw velocity, which is then
    // applied as vy*dt inside _move — terminal dive speed stays the same.
    const wantsDive = keys.down || keys.space;
    if (wantsDive && this.stamina > 0) {
      this.vy += C.FLY_FORCE * dt;
      if (this.vy > 6) this.vy = 6;
    }
  }

  _applyGravity(dt) {
    // Gravity suspended while resting on a surface
    if (this.pstate === PSTATE.HANGING || this.pstate === PSTATE.PLATFORM_TOP)
      return;
    // dt-scaled so vy accumulates at the same rate per second at any frame rate
    this.vy += C.GRAVITY * dt;
    if (this.vy < -C.MAX_FALL_SPEED) this.vy = -C.MAX_FALL_SPEED;
  }

  _move(platforms, dt) {
    // Multiply velocities by dt so the per-frame displacement scales with
    // elapsed time. Physics.moveX/Y receive a distance (px), not a velocity,
    // so the collision logic inside them is unaffected by this change.
    const infoX = Physics.moveX(this, platforms, this.vx * dt);
    this.onWall = infoX.left ? -1 : infoX.right ? 1 : 0;

    const infoY = Physics.moveY(this, platforms, this.vy * dt);
    this.onCeiling = infoY.top;
    this.onFloor = infoY.bottom;

    if (this.onCeiling) this.coyoteTimer = C.COYOTE_FRAMES;
    else if (this.coyoteTimer > 0) this.coyoteTimer--;
  }

  _resolveState(keys) {
    const diveHeld = keys.down || keys.space;
    // A "fresh" dive press means the key is down NOW but was not down last frame
    const diveFreshPress = diveHeld && !this._diveHeldLastFrame;
    this._diveHeldLastFrame = diveHeld;

    // ── Priority order — first matching condition wins ────────────────

    // 1. Currently on platform top — stay there until a FRESH dive press
    //    This prevents the bat from immediately bouncing off because the
    //    player was already holding dive when they landed
    if (this.pstate === PSTATE.PLATFORM_TOP) {
      if (this.onFloor && !diveFreshPress) {
        // Stay on platform — just walk
        this.vy = 0;
        return;
      }
      // Fresh dive press or no longer touching floor — leave platform
      this.pstate = PSTATE.AIRBORNE;
    }

    // 2. On ceiling — hang (unless actively diving away)
    if (this.onCeiling && !diveHeld) {
      this.pstate = PSTATE.HANGING;
      this.vy = 0;
      return;
    }

    // 3. On wall — hang (unless actively diving away)
    if (this.onWall !== 0 && !diveHeld) {
      this.pstate = PSTATE.HANGING;
      if (this.vy > C.WALL_SLIDE_SPEED) this.vy = C.WALL_SLIDE_SPEED;
      return;
    }

    // 4. Landed on platform top — only enter this state if dive is NOT held
    //    (prevents landing and instantly bouncing off)
    if (this.onFloor && !diveHeld) {
      this.pstate = PSTATE.PLATFORM_TOP;
      this.vy = 0;
      return;
    }

    // 5. Actively pressing dive with stamina
    if (diveHeld && this.stamina > 0) {
      this.pstate = PSTATE.DIVING;
      return;
    }

    // 6. Default — airborne
    this.pstate = PSTATE.AIRBORNE;
  }

  _updateStamina(dt) {
    // dt-scaled so stamina drains and recharges at the same real-world rate
    // regardless of how many frames per second are being rendered
    if (this.pstate === PSTATE.DIVING) {
      this.stamina = Math.max(0, this.stamina - C.STAMINA_DRAIN * dt);
    } else if (
      this.pstate === PSTATE.HANGING ||
      this.pstate === PSTATE.PLATFORM_TOP
    ) {
      this.stamina = Math.min(
        C.MAX_STAMINA,
        this.stamina + C.STAMINA_REGEN * dt,
      );
    }
  }

  _updateAnimation() {
    this.animTimer++;
    switch (this.pstate) {
      case PSTATE.PLATFORM_TOP:
        if (this.animTimer % 14 === 0)
          this.animFrame = (this.animFrame + 1) % 2;
        break;
      case PSTATE.DIVING:
        if (this.animTimer % 6 === 0) this.animFrame = (this.animFrame + 1) % 4;
        break;
      default:
        if (this.animTimer % 12 === 0)
          this.animFrame = (this.animFrame + 1) % 2;
    }
  }

  takeDamage() {
    if (this.invincibleTimer > 0 || this.dead) return;
    this.hp--;
    this.invincibleTimer = C.INVINCIBLE_FRAMES;
    // Knock upward and force airborne so no surface state interferes
    this.vy = -4;
    this.pstate = PSTATE.AIRBORNE;
    if (this.hp <= 0) {
      this.dead = true;
      this.deathTimer = 0;
    }
  }

  healHp() {
    this.hp = Math.min(C.MAX_HP, this.hp + 1);
  }
  refillStamina() {
    this.stamina = C.MAX_STAMINA;
  }

  respawn(x, y) {
    this.x = x - this.w / 2;
    this.y = y - this.h / 2;
    this.vx = 0;
    this.vy = 0;
    this.hp = C.MAX_HP;
    this.stamina = C.MAX_STAMINA;
    this.invincibleTimer = C.INVINCIBLE_FRAMES;
    this.dead = false;
    this.deathTimer = 0;
    this.pstate = PSTATE.AIRBORNE;
    this.onCeiling = false;
    this.onFloor = false;
    this.onWall = 0;
    this.coyoteTimer = 0;
    this._diveHeldLastFrame = false;
  }

  get cx() {
    return this.x + this.w / 2;
  }
  get cy() {
    return this.y + this.h / 2;
  }

  // ── Drawing ───────────────────────────────────────────────────────────
  draw(p) {
    if (this.dead) {
      this._drawDeath(p);
      return;
    }
    const blink =
      this.invincibleTimer > 0 &&
      Math.floor(this.invincibleTimer / 5) % 2 === 0;
    if (blink) return;
    p.push();
    p.translate(this.cx, this.cy);
    if (!this.facingRight) p.scale(-1, 1);
    this._drawBat(p);
    p.pop();
  }

  _drawBat(p) {
    const t = Date.now() * 0.001;

    // GIF is naturally oriented for hanging; flip when on platform top
    if (this.pstate === PSTATE.PLATFORM_TOP) {
      p.scale(1, -1);
    }

    // Recharge glow
    if (
      (this.pstate === PSTATE.HANGING || this.pstate === PSTATE.PLATFORM_TOP) &&
      this.stamina < C.MAX_STAMINA
    ) {
      p.noStroke();
      p.fill(`rgba(232,82,30,${0.1 + 0.1 * Math.sin(t * 4)})`);
      p.ellipse(0, 0, 40, 20);
    }

    // Animation only when vertical velocity is non-zero
    const img = this.vy !== 0 ? SPRITES.bat.animation : SPRITES.bat.idle;

    // Draw GIF centered on the player
    const sw = 72;
    const sh = 64;
    if (this.invincibleTimer > 0) p.tint(255, 140, 100, 230);
    p.image(img, -sw / 2, -sh / 2, sw, sh);
    p.noTint();

    // Low stamina warning
    if (this.stamina < C.STAMINA_LOW) {
      const pulse = 0.3 + 0.3 * Math.sin(t * 8);
      p.noFill();
      p.stroke(`rgba(239,68,68,${pulse})`);
      p.strokeWeight(1.5);
      p.ellipse(0, 0, 30, 22);
    }
  }

  _drawDeath(p) {
    const progress = this.deathTimer / 60;
    const alpha = Math.max(0, 1 - progress);
    p.push();
    p.translate(this.cx, this.cy);
    p.rotate(progress * Math.PI * 3);
    p.scale(1 - progress * 0.5);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + progress;
      const dist = progress * 30;
      p.fill(`rgba(220,80,40,${alpha})`);
      p.noStroke();
      p.circle(Math.cos(angle) * dist, Math.sin(angle) * dist, 6);
    }
    p.fill(`rgba(80,20,10,${alpha})`);
    p.ellipse(0, 0, 20 * (1 - progress), 16 * (1 - progress));
    p.pop();
  }
}
