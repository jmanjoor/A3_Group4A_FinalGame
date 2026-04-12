// ── Playable Tutorial Level ───────────────────────────────────────────────
// Manages the tutorial's trigger zones and message sequencing.
// The tutorial uses the normal gameplay engine — it's a real level,
// just with extra context-sensitive hints layered on top.

class TutorialLevel {
  constructor() {
    this.triggers = this._buildTriggers();
    this.firedSet = new Set();   // which trigger ids have already fired

    // Tracks player actions for condition checks
    this.hasMoved      = false;
    this.hasDived      = false;
    this.hasUsedEcho   = false;
    this.hasCollectedFruit = false;

    // Active message display
    this.message       = '';
    this.messageTimer  = 0;
    this.MESSAGE_HOLD  = 300; // frames a message stays fully visible
    this.MESSAGE_FADE  = 60;  // frames it takes to fade out
  }

  // Each trigger fires once when:
  //   - player.cx passes triggerX (world px)
  //   - condition(player, tutLevel) returns true
  //   - it hasn't fired before
  _buildTriggers() {
    const T = C.TILE;
    return [
      {
        id: 'move_hint',
        triggerX: 2 * T,
        condition: () => true,
        message: 'Use A and D to move left and right',
      },
      {
        id: 'moved_confirm',
        triggerX: 6 * T,
        condition: (pl, tl) => tl.hasMoved,
        message: 'Hold S to dive down, Make sure your stamina doesnt run out!',
      },
      {
        id: 'dive_confirm',
        triggerX: 8 * T,
        condition: (pl, tl) => tl.hasDived,
        message: 'Explore the cave  →',
      },
      {
        id: 'spike_warning',
        triggerX: 14 * T,
        condition: () => true,
        message: 'Spikes deal damage if you touch them - watch out!',
      },
      {
        id: 'echo_hint',
        triggerX: 22 * T,
        condition: () => true,
        message: 'Press E to reveal the rest of the cave',
      },
      {
        id: 'echo_cooldown',
        triggerX: 28 * T,
        condition: (pl, tl) => tl.hasUsedEcho,
        message: 'Echolocation has a cooldown - use it wisely',
      },
      {
        id: 'fruit_hint',
        triggerX: 32 * T,
        condition: () => true,
        message: 'Collect all the fruit to unlock the exit - each fruit has a different effect!',
      },
    ];
  }

  // Called each frame from drawPlaying when isTutorial is true
  update(player, keys, echoUsedThisFrame) {
    // Track player actions
    if (keys.left || keys.right) this.hasMoved = true;
    if (keys.down || keys.space)  this.hasDived = true;
    if (echoUsedThisFrame)        this.hasUsedEcho = true;

    // Check triggers in order — only the first unfired one that passes
    for (const trigger of this.triggers) {
      if (this.firedSet.has(trigger.id)) continue;
      if (player.cx >= trigger.triggerX && trigger.condition(player, this)) {
        this.firedSet.add(trigger.id);
        this._showMessage(trigger.message);
        break; // only one new message per frame
      }
    }

    if (this.messageTimer > 0) this.messageTimer--;
  }

  _showMessage(text) {
    this.message      = text;
    this.messageTimer = this.MESSAGE_HOLD + this.MESSAGE_FADE;
  }

  // Draw the tutorial hint — anchored to the lower safe margin,
  // clear of the gameplay zone
  draw(p) {
    if (this.messageTimer <= 0) return;

    const alpha = this.messageTimer > this.MESSAGE_FADE
      ? 1
      : this.messageTimer / this.MESSAGE_FADE;

    p.push();
    p.resetMatrix();

    const cx      = p.width / 2;
    const cy      = p.height * 0.82;   // lower anchor — more clearance from action
    const msg     = this.message;
    const fontSize = Math.round(p.width * 0.022);  // ~18px — more readable

    p.textFont('monospace');
    p.textSize(fontSize);
    p.textAlign(p.CENTER, p.CENTER);

    // Measure pill dimensions using the actual font size
    const tw   = p.textWidth(msg);
    const padX = 24;
    const padY = 11;
    const lineH = fontSize + 4;

    const pillX = cx - tw / 2 - padX;
    const pillY = cy - lineH / 2 - padY;
    const pillW = tw + padX * 2;
    const pillH = lineH + padY * 2;

    // Dark pill background
    p.noStroke();
    p.fill(`rgba(15,7,5,${alpha * 0.88})`);
    p.rect(pillX, pillY, pillW, pillH, 10);

    // Ember border
    p.noFill();
    p.stroke(`rgba(255,90,40,${alpha * 0.50})`);
    p.strokeWeight(1.5);
    p.rect(pillX, pillY, pillW, pillH, 10);

    // Text shadow
    p.noStroke();
    p.fill(`rgba(0,0,0,${alpha * 0.6})`);
    p.text(msg, cx + 1, cy + 1);

    // Text
    p.fill(`rgba(240,213,200,${alpha})`);
    p.text(msg, cx, cy);

    p.pop();
  }

  markFruitCollected() {
    this.hasCollectedFruit = true;
  }
}

// ── Tutorial level map data ───────────────────────────────────────────────
// Long horizontal scrolling level. Ceiling is solid (bat hangs from top).
// Sections:
//   cols 0–8:   spawn zone — flat ceiling, open space, learn to move
//   cols 9–14:  low ceiling gap — learn to dive
//   cols 15–22: first spike hazard section
//   cols 23–30: darker/complex cave — echo section
//   cols 31–42: fruit + exit section

const TUTORIAL_LEVEL_DATA = {
  name: "Tutorial",
  fruitsNeeded: 2,
  maxEcho: 3,
  cols: 48,
  rows: 14,
  map: [
    // Row 0: solid ceiling all the way across — bat hangs here
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    // Row 1: second ceiling — spawn point and partial ceiling for hanging variety
    [1,1,5,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
    // Row 2: open space
    [1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,1],
    // Row 3: open — first dive area
    [1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    // Row 4: floating platforms — mid level handholds (sprite tiles)
    [1,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,7,7,7,0,0,0,0,0,0,0,0,7,7,7,7,0,0,0,0,0,7,7,7,0,0,0,0,1],
    // Row 5: open
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,41,0,0,0,0,0,1],
    // Row 6: open — lower area, spikes ahead
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,42,0,0,0,0,0,0,0,0,0,0,1],
    // Row 7: open 
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    // Row 8: cave floor platforms — solid cave style (tile 1)
    [1,7,7,7,7,7,7,7,7,7,7,7,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,7,1],
    // Row 9: gap / lower sectio
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    // Row 10: lower platform
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,7,7,0,7,7,7,0,0,0,0,0,0,0,0,7,7,7,0,0,0,0,1],
    // Row 11: spike row — danger zone
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,0,0,3,3,3,0,0,0,0,3,3,3,0,0,0,0,0,0,0,0,1],
    // Row 12: gap before floor
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    // Row 13: solid floor
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ]
};