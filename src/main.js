// ── State machine ─────────────────────────────────────────────────────────
const STATE = {
  WELCOME:   'welcome',
  PLAYING:   'playing',
  DEAD:      'dead',
  LEVEL_WIN: 'level_win',
  GAME_WIN:  'game_win',
};

let state = STATE.WELCOME;

let welcomeScreen;
let level, player, camera, echoSystem, visSystem, hud;
let tutorialLevel = null;   // non-null only while playing the tutorial

const keys = { left: false, right: false, up: false, down: false, space: false };
const audioManager = new AudioManager();
let currentLevelIndex = 0;  // -1 = tutorial, 0+ = real levels
let transitionTimer = 0;
let respawnTimer = 0;
let echoFiredThisFrame = false;

// ── p5 instance mode ──────────────────────────────────────────────────────
const sketch = (p) => {

  p.preload = () => {
    SPRITES.load(p);
  };

  p.setup = () => {
    const canvas = p.createCanvas(C.WIDTH, C.HEIGHT);
    canvas.parent('game-container');
    p.frameRate(60);
    p.textFont('monospace');

    welcomeScreen = new WelcomeScreen();
    visSystem     = new Visibility();
    hud           = new HUD();
  };

  p.draw = () => {
    echoFiredThisFrame = false;

    // Normalise elapsed time to 1.0 at the 60 fps target.
    // Clamped to 2.0 so a long stall (tab backgrounded, GC pause) never
    // causes a physics explosion on the next frame.
    const dt = Math.min(p.deltaTime / (1000 / 60), 2.0);

    switch (state) {
      case STATE.WELCOME:   drawWelcome(p);      break;
      case STATE.PLAYING:   drawPlaying(p, dt);  break;
      case STATE.DEAD:      drawDead(p);         break;
      case STATE.LEVEL_WIN: drawLevelWin(p);     break;
      case STATE.GAME_WIN:  drawGameWin(p);      break;
    }
  };

  p.keyPressed = () => {
    const k  = p.key;
    const kc = p.keyCode;

    audioManager.unlock();

    if (kc === p.LEFT_ARROW  || k === 'a' || k === 'A') keys.left  = true;
    if (kc === p.RIGHT_ARROW || k === 'd' || k === 'D') keys.right = true;
    if (kc === p.UP_ARROW    || k === 'w' || k === 'W') keys.up    = true;
    if (kc === p.DOWN_ARROW  || k === 's' || k === 'S') keys.down  = true;
    if (k === ' ') keys.space = true;

    if ((k === 'e' || k === 'E') && state === STATE.PLAYING) {
      echoSystem.pulseX = player.cx;
      echoSystem.pulseY = player.cy;
      if (echoSystem.trigger(player.cx, player.cy)) {
        echoFiredThisFrame = true;
        hud.notifyEchoUsed();
        audioManager.playSonar();
      }
    }

    if (kc === p.ENTER || kc === 13) {
      if (state === STATE.WELCOME) {
        loadTutorial();
        state = STATE.PLAYING;
      } else if (state === STATE.DEAD && respawnTimer > 80) {
        if (currentLevelIndex === -1) {
          loadTutorial();
        } else {
          loadLevel(currentLevelIndex);
        }
        state = STATE.PLAYING;
      } else if (state === STATE.LEVEL_WIN && transitionTimer > 100) {
        loadLevel(currentLevelIndex + 1);
        state = STATE.PLAYING;
      } else if (state === STATE.GAME_WIN && transitionTimer > 120) {
        currentLevelIndex = 0;
        welcomeScreen = new WelcomeScreen();
        state = STATE.WELCOME;
      }
    }
    return false;
  };

  p.keyReleased = () => {
    const k  = p.key;
    const kc = p.keyCode;
    if (kc === p.LEFT_ARROW  || k === 'a' || k === 'A') keys.left  = false;
    if (kc === p.RIGHT_ARROW || k === 'd' || k === 'D') keys.right = false;
    if (kc === p.UP_ARROW    || k === 'w' || k === 'W') keys.up    = false;
    if (kc === p.DOWN_ARROW  || k === 's' || k === 'S') keys.down  = false;
    if (k === ' ') keys.space = false;
    return false;
  };
};

new p5(sketch);

// ── Loaders ───────────────────────────────────────────────────────────────
function loadTutorial() {
  currentLevelIndex = -1;
  tutorialLevel = new TutorialLevel();
  level  = new Level(TUTORIAL_LEVEL_DATA);
  player = new Player(level.playerStart.x - 11, level.playerStart.y - 8);
  camera = new Camera();
  camera.snap(player, level.worldW, level.worldH, C.WIDTH, C.HEIGHT);
  echoSystem = new Echolocation(level.maxEcho);
  hud = new HUD();
  audioManager.startBgm();
}

function loadLevel(index) {
  currentLevelIndex = index;
  tutorialLevel = null;
  level  = new Level(LEVELS[index]);
  player = new Player(level.playerStart.x - 11, level.playerStart.y - 8);
  camera = new Camera();
  camera.snap(player, level.worldW, level.worldH, C.WIDTH, C.HEIGHT);
  echoSystem = new Echolocation(level.maxEcho);
  hud = new HUD();
  hud.showMessage(level.data.name, 120);
  audioManager.startBgm();
}

// ── State draw functions ──────────────────────────────────────────────────

function drawWelcome(p) {
  welcomeScreen.update();
  welcomeScreen.draw(p);
}

function drawPlaying(p, dt) {
  // Update tutorial triggers if in tutorial
  if (tutorialLevel) {
    tutorialLevel.update(player, keys, echoFiredThisFrame);
    // Track fruit collection for tutorial
    if (level.fruitsCollected > 0) tutorialLevel.markFruitCollected();
  }

  // Pass dt so physics accumulation is frame-rate independent
  player.update(keys, level.platforms, dt);
  audioManager.update(player);

  // Fruit collection
  for (const fruit of level.fruits) {
    if (!fruit.collected && fruit.collidesWith(player)) {
      level.collectFruit(fruit, player, echoSystem);
      audioManager.playCrunch();
      if (level.fruitsRemaining === 0 && !tutorialLevel) {
        hud.showMessage('Find the exit! ▶', 150);
      }
    }
  }

  // Spike damage
  for (const spike of level.spikes) {
    if (spike.collidesWith(player)) {
      if (player.invincibleTimer === 0) audioManager.playHurt();
      player.takeDamage();
    }
  }

  // Death
  if (player.dead && player.deathTimer > 60) {
    audioManager.stopAll();
    state = STATE.DEAD;
    respawnTimer = 0;
  }

  // Exit — tutorial exits into level 0, normal levels chain forward
  if (level.checkExitCollision(player)) {
    transitionTimer = 0;
    if (currentLevelIndex === -1) {
      // Tutorial complete — go straight into level 0
      loadLevel(0);
      hud.showMessage(level.data.name, 120);
      // Stay in PLAYING state, no win screen for tutorial
    } else {
      state = currentLevelIndex + 1 < LEVELS.length ? STATE.LEVEL_WIN : STATE.GAME_WIN;
    }
  }

  camera.update(player, level.worldW, level.worldH, C.WIDTH, C.HEIGHT, dt);
  echoSystem.update();
  echoSystem.applyToLevel(level);
  hud.update(level);

  // ── Draw ──
  p.background(C.BG);

  p.push();
  camera.apply(p);
  level.draw(p);
  p.pop();

  // Distance-based darkening — platforms fade darker toward edges of vision
  const ps = camera.worldToScreen(player.cx, player.cy);
  p.push();
  p.resetMatrix();
  const dCtx = p.drawingContext;
  const darkGrad = dCtx.createRadialGradient(
    ps.x, ps.y, C.VISION_RADIUS * 0.2,
    ps.x, ps.y, C.VISION_RADIUS * 2.5
  );
  darkGrad.addColorStop(0,   'rgba(10,5,3,0.15)');
  darkGrad.addColorStop(0.2, 'rgba(10,5,3,0.5)');
  darkGrad.addColorStop(0.5, 'rgba(10,5,3,0.8)');
  darkGrad.addColorStop(1,   'rgba(10,5,3,0.95)');
  dCtx.fillStyle = darkGrad;
  dCtx.fillRect(0, 0, C.WIDTH, C.HEIGHT);
  p.pop();

  // Fog
  visSystem.apply(p, ps.x, ps.y, C.WIDTH, C.HEIGHT);

  // Echo outlines after fog
  if (echoSystem.active) {
    p.push();
    camera.apply(p);
    level.drawEchoOutlines(p);
    p.pop();
  }

  // Player + pulse on top
  p.push();
  camera.apply(p);
  echoSystem.drawPulse(p);
  player.draw(p);
  p.pop();

  // HUD — skip fruit counter and level name during tutorial
  hud.draw(p, player, level, echoSystem, !!tutorialLevel);

  // Tutorial hint overlay
  if (tutorialLevel) tutorialLevel.draw(p);
}

function drawDead(p) {
  respawnTimer++;
  p.background(C.BG);
  p.push(); camera.apply(p); level.draw(p); p.pop();

  p.noStroke();
  p.fill('rgba(15,7,5,0.78)');
  p.rect(0, 0, C.WIDTH, C.HEIGHT);
  p.textAlign(p.CENTER, p.CENTER);

  p.textSize(36); p.fill('#ff6030');
  p.text('YOU FELL', C.WIDTH / 2, C.HEIGHT / 2 - 30);

  p.textSize(14); p.fill(C.TEXT_DIM);
  p.text('The bat tumbles into the dark...', C.WIDTH / 2, C.HEIGHT / 2 + 12);

  if (respawnTimer > 80 && Math.floor(respawnTimer / 20) % 2 === 0) {
    p.textSize(14); p.fill('#e8521e');
    p.text('Press ENTER to try again', C.WIDTH / 2, C.HEIGHT / 2 + 52);
  }
}

function drawLevelWin(p) {
  transitionTimer++;
  p.background(C.BG);
  p.push(); camera.apply(p); level.draw(p); player.draw(p); p.pop();

  const alpha = Math.min(0.85, transitionTimer / 60);
  p.noStroke(); p.fill(`rgba(15,7,5,${alpha})`); p.rect(0, 0, C.WIDTH, C.HEIGHT);

  if (transitionTimer > 40) {
    const a = Math.min(1, (transitionTimer - 40) / 30);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40); p.fill(`rgba(255,90,40,${a})`);
    p.text('LEVEL CLEAR', C.WIDTH / 2, C.HEIGHT / 2 - 30);
    p.textSize(16); p.fill(`rgba(107,203,119,${a})`);
    p.text(`Fruits: ${level.fruitsCollected} / ${level.data.fruitsNeeded}  ✓`, C.WIDTH / 2, C.HEIGHT / 2 + 16);
    if (transitionTimer > 100 && Math.floor(transitionTimer / 20) % 2 === 0) {
      p.textSize(14); p.fill(`rgba(232,82,30,${a})`);
      p.text('Press ENTER for next level →', C.WIDTH / 2, C.HEIGHT / 2 + 60);
    }
  }
}

function drawGameWin(p) {
  transitionTimer++;
  p.background(C.BG);
  for (let i = 0; i < 4; i++) {
    const col = C.FRUIT_COLORS[p.floor(p.random(C.FRUIT_COLORS.length))];
    p.noStroke(); p.fill(col + '99');
    p.circle(p.random(C.WIDTH), p.random(C.HEIGHT), p.random(4, 12));
  }
  const a = Math.min(1, transitionTimer / 60);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(50); p.fill(`rgba(255,90,40,${a})`);
  p.text('YOU ESCAPED!', C.WIDTH / 2, C.HEIGHT / 2 - 50);
  p.textSize(18); p.fill(`rgba(240,213,200,${a})`);
  p.text('The bat soars into the moonlit sky...', C.WIDTH / 2, C.HEIGHT / 2);
  p.textSize(13); p.fill(`rgba(107,203,119,${a})`);
  p.text('All levels complete!', C.WIDTH / 2, C.HEIGHT / 2 + 36);
  if (transitionTimer > 120 && Math.floor(transitionTimer / 25) % 2 === 0) {
    p.textSize(14); p.fill(`rgba(232,82,30,${a})`);
    p.text('Press ENTER to play again', C.WIDTH / 2, C.HEIGHT / 2 + 80);
  }
}
