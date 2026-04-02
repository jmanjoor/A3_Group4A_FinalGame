const C = {
  // Display
  TILE: 32,
  WIDTH: 800,
  HEIGHT: 500,

  // Physics
  GRAVITY: -0.45,            // pulls UP (negative = toward ceiling)
  JUMP_FORCE: 7,             // unused but kept for reference
  FLY_FORCE: 0.6,            // dives DOWN (positive = away from ceiling)
  MAX_FALL_SPEED: 10,        // max speed in either direction
  MOVE_SPEED: 3.2,
  WALL_SLIDE_SPEED: 1.2,

  // Stamina
  MAX_STAMINA: 100,
  STAMINA_DRAIN: 0.35,      // per frame while flying
  STAMINA_REGEN: 0.8,       // per frame while hanging
  STAMINA_LOW: 25,          // threshold for warning color

  // Echolocation
  ECHO_COOLDOWN: 180,       // frames (~3s at 60fps)
  ECHO_DURATION: 240,       // frames visible
  ECHO_FADE_START: 160,     // when to start fading
  ECHO_RADIUS_GROWTH: 6,    // px per frame during pulse expand

  // Vision
  VISION_RADIUS: 70,        // px around player always visible
  VISION_SOFTNESS: 35,      // px of gradient edge

  // Player
  MAX_HP: 3,
  INVINCIBLE_FRAMES: 90,
  COYOTE_FRAMES: 8,

  // Colors (cave red theme)
  BG: '#0f0705',
  CAVE_DARK: '#120806',
  PLATFORM_COLOR: '#3a1208',
  PLATFORM_EDGE: '#7a2e10',
  PLATFORM_ECHO: '#ff6030',
  SPIKE_COLOR: '#8b1a1a',
  SPIKE_ECHO: '#ff4444',
  FRUIT_COLORS: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff922b'],
  HUD_BG: 'rgba(15,7,5,0.85)',
  STAMINA_FULL: '#c42a0a',
  STAMINA_LOW_C: '#ff2200',
  ECHO_PULSE_COLOR: 'rgba(255,90,40,',
  TEXT_MAIN: '#f0d5c8',
  TEXT_DIM: '#8a4a36',
  HANG_GLOW: '#e8521e',
};
