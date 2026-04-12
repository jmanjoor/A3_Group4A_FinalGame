// ── Sprite loader ─────────────────────────────────────────────────────────
// All game sprites are loaded here and stored on a global SPRITES object.
// Call SPRITES.load(p) inside p5's preload() before anything else runs.
//
// Expected files in assets/sprites/:
//   platform_left.png   — left cap of a floating platform
//   platform_mid_1.png  — middle tile variant 1
//   platform_mid_2.png  — middle tile variant 2
//   platform_mid_3.png  — middle tile variant 3
//   platform_right.png  — right cap of a floating platform
//   spike_down.png      — downward spike, image is 2× wide (covers 2 tiles)

const SPRITES = {
  platform: {
    left:  null,
    mid:   [null, null, null],  // variants 1, 2, 3
    right: null,
  },
  titleLogo: null,

  // Call inside p5 preload()
  load(p) {
    const base = 'assets/sprites/';
    this.platform.left   = p.loadImage(base + 'platform_EndTile_Cave_Left.png');
    this.platform.mid[0] = p.loadImage(base + 'platform_Tile_Cave_1.png');
    this.platform.mid[1] = p.loadImage(base + 'platform_Tile_Cave_2.png');
    this.platform.mid[2] = p.loadImage(base + 'platform_Tile_Cave_3.png');
    this.platform.right  = p.loadImage(base + 'platform_EndTile_Cave_Right.png');
    this.titleLogo       = p.loadImage('assets/Title/logo.png');
  },
};
