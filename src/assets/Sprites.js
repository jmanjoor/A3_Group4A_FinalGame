// ── Sprite loader ─────────────────────────────────────────────────────────
// All game sprites are loaded here and stored on a global SPRITES object.
// Call SPRITES.load(p) inside p5's preload() before anything else runs.

const SPRITES = {
  platform: {
    left:  null,
    mid:   [null, null, null],  // variants 1, 2, 3
    right: null,
  },
  titleLogo: null,

  spike: {
    left:  null,
    right: null,
    mid:   [null, null],        // variants 1, 2
    leftFlipped:  null,
    rightFlipped: null,
    midFlipped:   [null, null],
  },

  wall: {
    top:    [null, null],       // variants 1, 2
    left:   [null, null],
    right:  [null, null],
    interior: null,             // interior / multi-touch tile
  },

  bat: {
    idle:      null,            // Bat Idle.gif
    animation: null,            // Bat Animation.gif
  },

  background: null,

  // Call inside p5 preload()
  load(p) {
    const base = 'assets/sprites/';

    // Platform sprites
    this.platform.left   = p.loadImage(base + 'platform_EndTile_Cave_Left.png');
    this.platform.mid[0] = p.loadImage(base + 'platform_Tile_Cave_1.png');
    this.platform.mid[1] = p.loadImage(base + 'platform_Tile_Cave_2.png');
    this.platform.mid[2] = p.loadImage(base + 'platform_Tile_Cave_3.png');
    this.platform.right  = p.loadImage(base + 'platform_EndTile_Cave_Right.png');
    this.titleLogo       = p.loadImage('assets/Title/logo.png');

    // Spike sprites — normal (attached to platform)
    this.spike.left      = p.loadImage(base + 'Platform_EndSpikes_Cave_Left.png');
    this.spike.right     = p.loadImage(base + 'Platform_EndSpikes_Cave_Right.png');
    this.spike.mid[0]    = p.loadImage(base + 'Platform_Spikes_Cave_1.png');
    this.spike.mid[1]    = p.loadImage(base + 'Platform_Spikes_Cave_2.png');

    // Spike sprites — flipped (not attached to platform)
    this.spike.leftFlipped   = p.loadImage(base + 'Platform_EndSpikes_Cave_Left_Flipped.png');
    this.spike.rightFlipped  = p.loadImage(base + 'Platform_EndSpikes_Cave_Right_Flipped.png');
    this.spike.midFlipped[0] = p.loadImage(base + 'Platform_Spikes_Cave_1_Flipped.png');
    this.spike.midFlipped[1] = p.loadImage(base + 'Platform_Spikes_Cave_2_Flipped.png');

    // Wall sprites
    this.wall.top[0]   = p.loadImage(base + 'Platform_Tile_Wall_Top_1.png');
    this.wall.top[1]   = p.loadImage(base + 'Platform_Tile_Wall_Top_2.png');
    this.wall.left[0]  = p.loadImage(base + 'Platform_Tile_Wall_Left_1.png');
    this.wall.left[1]  = p.loadImage(base + 'Platform_Tile_Wall_Left_2.png');
    this.wall.right[0]  = p.loadImage(base + 'Platform_Tile_Wall_Right_1.png');
    this.wall.right[1]  = p.loadImage(base + 'Platform_Tile_Wall_Right_2.png');
    this.wall.interior  = p.loadImage(base + 'Platform_Tile_Cave_Middle_2.png');

    // Bat sprites (animated GIFs via p5 loadImage)
    this.bat.idle      = p.loadImage(base + 'Bat Idle.gif');
    this.bat.animation = p.loadImage(base + 'Bat Animation.gif');

    // Level background
    this.background = p.loadImage(base + 'background2.png');
  },
};
