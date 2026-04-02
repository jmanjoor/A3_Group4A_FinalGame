class Level {
  constructor(data) {
    this.data = data;
    this.platforms = [];
    this.spikes    = [];
    this.fruits    = [];
    this.exit      = null;
    this.playerStart     = { x: 100, y: 100 };
    this.fruitsCollected = 0;
    this.complete        = false;
    this.exitEchoAlpha   = 0;  // driven by Echolocation.applyToLevel

    this.worldW = data.cols * C.TILE;
    this.worldH = data.rows * C.TILE;
    this.maxEcho = (data.maxEcho !== undefined) ? data.maxEcho : 5;

    this._buildFromMap(data.map);
    this._mergeHorizontalPlatforms();
  }

  _buildFromMap(map) {
    const T = C.TILE;
    const rawSolid  = [];
    const rawSprite = [];

    for (let row = 0; row < map.length; row++) {
      for (let col = 0; col < map[row].length; col++) {
        const tile = map[row][col];
        const x = col * T;
        const y = row * T;

        if (tile === 1) {
          rawSolid.push({ col, row, x, y });
        } else if (tile === 7) {
          rawSprite.push({ col, row, x, y });
        } else if (tile === 2) {
          this.spikes.push(new Spike(x, y, 'up'));
        } else if (tile === 3) {
          this.spikes.push(new Spike(x, y, 'down'));
        } else if (tile === 4) {
          this.fruits.push(new Fruit(x + T / 2, y + T / 2, 'echo'));    // purple — default
        } else if (tile === 41) {
          this.fruits.push(new Fruit(x + T / 2, y + T / 2, 'echo'));    // purple — +echo charge
        } else if (tile === 42) {
          this.fruits.push(new Fruit(x + T / 2, y + T / 2, 'heart'));   // red    — +1 HP
        } else if (tile === 43) {
          this.fruits.push(new Fruit(x + T / 2, y + T / 2, 'stamina')); // green  — refill stamina
        } else if (tile === 44) {
          this.fruits.push(new Fruit(x + T / 2, y + T / 2, 'none'));    // blue   — no effect
        } else if (tile === 5) {
          this.playerStart = { x: x + T / 2, y: y + T / 2 };
        } else if (tile === 6) {
          this.exit = { x, y, w: T, h: T };
        }
      }
    }

    for (const pl of rawSolid)  this.platforms.push(new Platform(pl.x, pl.y, T, T, false));
    for (const pl of rawSprite) this.platforms.push(new Platform(pl.x, pl.y, T, T, true));
  }

  _mergeHorizontalPlatforms() {
    const T = C.TILE;
    this.platforms.sort((a, b) => a.y - b.y || a.x - b.x);
    const merged = [];
    let current = null;

    for (const p of this.platforms) {
      const canMerge = current &&
                       current.y === p.y &&
                       current.x + current.w === p.x &&
                       current.useSprite === p.useSprite;
      if (canMerge) {
        current.w += T;
      } else {
        if (current) merged.push(current);
        current = new Platform(p.x, p.y, T, T, p.useSprite);
      }
    }
    if (current) merged.push(current);
    this.platforms = merged;
  }

  // Apply fruit effect to player and echoSystem, then mark collected
  collectFruit(fruit, player, echoSystem) {
    fruit.collected = true;
    this.fruitsCollected++;

    switch (fruit.type) {
      case 'echo':
        echoSystem.addCharge();
        break;
      case 'heart':
        player.healHp();
        break;
      case 'stamina':
        player.refillStamina();
        break;
      case 'none':
      default:
        break;
    }
  }

  get fruitsRemaining() {
    return this.data.fruitsNeeded - this.fruitsCollected;
  }

  get exitUnlocked() {
    return this.fruitsCollected >= this.data.fruitsNeeded;
  }

  draw(p) {
    p.background(C.BG);
    for (const plat  of this.platforms) plat.draw(p);
    for (const spike of this.spikes)    spike.draw(p);
    for (const fruit of this.fruits)    if (!fruit.collected) fruit.draw(p);
    if (this.exit) this._drawExit(p);
  }

  _drawExit(p) {
    const ex = this.exit;
    if (this.exitUnlocked) {
      // Glowing portal
      p.noStroke();
      for (let i = 5; i > 0; i--) {
        p.fill(`rgba(180,40,10,${0.04 * i})`);
        p.rect(ex.x - i * 3, ex.y - i * 3, ex.w + i * 6, ex.h + i * 6, 6);
      }
      p.fill('rgba(232,82,30,0.3)');
      p.rect(ex.x, ex.y, ex.w, ex.h, 4);
      p.stroke('#e8521e');
      p.strokeWeight(2);
      p.noFill();
      p.rect(ex.x, ex.y, ex.w, ex.h, 4);

      const bounce = Math.sin(Date.now() * 0.005) * 3;
      p.fill('#e2d9f3');
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(18);
      p.text('▶', ex.x + ex.w / 2, ex.y + ex.h / 2 + bounce);
    } else {
      // Locked — barely visible inside fog
      p.stroke('rgba(92,40,20,0.4)');
      p.strokeWeight(1);
      p.noFill();
      p.rect(ex.x, ex.y, ex.w, ex.h, 4);
    }
  }

  // Called AFTER the fog mask — draws glowing outlines including the exit
  drawEchoOutlines(p) {
    for (const plat  of this.platforms) plat.drawEchoOutline(p);
    for (const spike of this.spikes)    spike.drawEchoOutline(p);
    for (const fruit of this.fruits)    if (!fruit.collected) fruit.drawEchoOutline(p);

    // Exit echo — always show through fog so player knows where to go
    if (this.exit && this.exitEchoAlpha > 0) {
      this._drawExitEcho(p);
    }
  }

  _drawExitEcho(p) {
    const ex = this.exit;
    const a  = this.exitEchoAlpha;

    if (this.exitUnlocked) {
      // Unlocked exit — bright pulsing ember glow
      p.noFill();
      p.stroke(`rgba(255,90,40,${a * 0.2})`);
      p.strokeWeight(10);
      p.rect(ex.x, ex.y, ex.w, ex.h, 4);

      p.stroke(`rgba(255,140,80,${a * 0.6})`);
      p.strokeWeight(3);
      p.rect(ex.x, ex.y, ex.w, ex.h, 4);

      p.stroke(`rgba(255,200,160,${a * 0.95})`);
      p.strokeWeight(1);
      p.rect(ex.x, ex.y, ex.w, ex.h, 4);

      // Arrow hint
      p.noStroke();
      p.fill(`rgba(255,220,180,${a * 0.9})`);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(18);
      p.text('▶', ex.x + ex.w / 2, ex.y + ex.h / 2);
    } else {
      // Locked exit — dim grey outline so player knows it exists but can't use it
      p.noFill();
      p.stroke(`rgba(160,100,80,${a * 0.3})`);
      p.strokeWeight(5);
      p.rect(ex.x, ex.y, ex.w, ex.h, 4);

      p.stroke(`rgba(180,120,100,${a * 0.6})`);
      p.strokeWeight(1);
      p.rect(ex.x, ex.y, ex.w, ex.h, 4);
    }
  }

  checkExitCollision(player) {
    if (!this.exit || !this.exitUnlocked) return false;
    const ex = this.exit;
    return player.x + player.w > ex.x &&
           player.x < ex.x + ex.w &&
           player.y + player.h > ex.y &&
           player.y < ex.y + ex.h;
  }
}
