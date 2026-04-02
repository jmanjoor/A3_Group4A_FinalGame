// Fruit types and their effects:
//   'echo'    — purple  — adds 1 echolocation charge
//   'heart'   — red     — restores 1 HP
//   'stamina' — green   — fully refills stamina
//   'none'    — blue    — no special effect (still counts toward exit unlock)

const FRUIT_TYPES = [
  { type: 'echo',    color: '#b06aff', label: '+Echo'    },
  { type: 'heart',   color: '#ff3a3a', label: '+Heart'   },
  { type: 'stamina', color: '#3dcc55', label: '+Stamina' },
  { type: 'none',    color: '#4d96ff', label: ''         },
];

class Fruit {
  constructor(x, y, type = null) {
    this.x = x;
    this.y = y;
    this.collected  = false;
    this.echoAlpha  = 0;
    this.bobOffset  = Math.random() * Math.PI * 2;
    this.radius     = 9;

    // If no type specified, pick randomly
    const def = type
      ? FRUIT_TYPES.find(f => f.type === type) || FRUIT_TYPES[3]
      : FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];

    this.type  = def.type;
    this.color = def.color;
    this.label = def.label;

    // Pop-up label timer (shown briefly on collection)
    this.popTimer = 0;
  }

  // Draw full fruit — only visible inside vision circle
  draw(p) {
    const bob = Math.sin(Date.now() * 0.003 + this.bobOffset) * 3;
    const cy  = this.y + bob;

    p.push();
    p.noStroke();
    p.fill(this.color);
    p.circle(this.x, cy, this.radius * 2);

    // Shine
    p.fill('rgba(255,255,255,0.45)');
    p.circle(this.x - this.radius * 0.3, cy - this.radius * 0.3, this.radius * 0.7);

    // Stem
    p.stroke(this._darken(this.color));
    p.strokeWeight(1.5);
    p.line(this.x, cy - this.radius, this.x + 3, cy - this.radius - 5);

    // Small type indicator dot in center
    p.noStroke();
    p.fill('rgba(255,255,255,0.3)');
    p.circle(this.x, cy, 5);

    p.pop();
  }

  // Draw glowing echo outline — called AFTER fog
  drawEchoOutline(p) {
    if (this.echoAlpha <= 0) return;

    const bob = Math.sin(Date.now() * 0.003 + this.bobOffset) * 3;
    const cy  = this.y + bob;
    const a   = this.echoAlpha;
    const rgb = this._hexToRgb(this.color);

    p.push();
    p.noStroke();

    // Outer bloom
    p.fill(`rgba(${rgb},${a * 0.12})`);
    p.circle(this.x, cy, (this.radius + 10) * 2);

    // Mid glow ring
    p.fill(`rgba(${rgb},${a * 0.25})`);
    p.circle(this.x, cy, (this.radius + 4) * 2);

    // Sharp outline
    p.noFill();
    p.stroke(`rgba(${rgb},${a * 0.9})`);
    p.strokeWeight(1.5);
    p.circle(this.x, cy, this.radius * 2);

    // Center dot
    p.noStroke();
    p.fill(`rgba(255,255,255,${a * 0.6})`);
    p.circle(this.x, cy, 3);

    p.pop();
  }

  _hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
  }

  _darken(hex) {
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 60);
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 60);
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 60);
    return `rgb(${r},${g},${b})`;
  }

  collidesWith(player) {
    const dx = (player.x + player.w / 2) - this.x;
    const dy = (player.y + player.h / 2) - this.y;
    return Math.sqrt(dx * dx + dy * dy) < this.radius + 12;
  }
}
