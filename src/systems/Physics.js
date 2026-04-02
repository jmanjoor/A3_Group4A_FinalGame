const Physics = {

  resolve(player, platforms) {
    const info = { bottom: false, top: false, left: false, right: false };

    for (const plat of platforms) {
      if (!plat.overlaps(player.x, player.y, player.w, player.h)) continue;

      const overlapLeft  = (player.x + player.w) - plat.x;
      const overlapRight = (plat.x + plat.w)     - player.x;
      const overlapTop   = (player.y + player.h)  - plat.y;
      const overlapDown  = (plat.y + plat.h)      - player.y;

      const minX = Math.min(overlapLeft, overlapRight);
      const minY = Math.min(overlapTop,  overlapDown);

      if (minX < minY) {
        if (overlapLeft < overlapRight) {
          player.x = plat.x - player.w;
          info.right = true;
        } else {
          player.x = plat.x + plat.w;
          info.left = true;
        }
        player.vx = 0;
      } else {
        if (overlapTop < overlapDown) {
          player.y = plat.y - player.h;
          player.vy = Math.min(player.vy, 0);
          info.bottom = true;
        } else {
          player.y = plat.y + plat.h;
          player.vy = Math.max(player.vy, 0);
          info.top = true;
        }
      }
    }

    return info;
  },

  moveX(player, platforms, dx) {
    const info = { left: false, right: false };

    // Guard: skip move entirely if dx is not a valid finite number
    if (!isFinite(dx) || dx === 0) {
      player.vx = 0;
      return info;
    }

    const steps = Math.max(1, Math.ceil(Math.abs(dx) / (C.TILE * 0.5)));
    const step  = dx / steps;

    for (let i = 0; i < steps; i++) {
      player.x += step;
      // Safety: if position becomes invalid, snap back and abort
      if (!isFinite(player.x)) {
        player.x -= step;
        player.vx = 0;
        break;
      }
      const r = this.resolve(player, platforms);
      if (r.left)  info.left  = true;
      if (r.right) info.right = true;
      if (r.left || r.right) break;
    }
    return info;
  },

  moveY(player, platforms, dy) {
    const info = { top: false, bottom: false };

    // Guard: skip move entirely if dy is not a valid finite number
    if (!isFinite(dy) || dy === 0) {
      player.vy = 0;
      return info;
    }

    const steps = Math.max(1, Math.ceil(Math.abs(dy) / (C.TILE * 0.5)));
    const step  = dy / steps;

    for (let i = 0; i < steps; i++) {
      player.y += step;
      // Safety: if position becomes invalid, snap back and abort
      if (!isFinite(player.y)) {
        player.y -= step;
        player.vy = 0;
        break;
      }
      const r = this.resolve(player, platforms);
      if (r.top)    info.top    = true;
      if (r.bottom) info.bottom = true;
      if (r.top || r.bottom) break;
    }
    return info;
  }
};
