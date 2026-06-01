// ==================== 碰撞检测 ====================

// Circle collision between two entities
function circlesOverlap(x1, y1, r1, x2, y2, r2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  const dist = dx * dx + dy * dy;
  const minDist = r1 + r2;
  return dist < minDist * minDist;
}

// Check if player can eat a specific prey
function checkEatCollision(player, prey) {
  if (!prey.alive || !prey.edible) return false;
  const eatRange = player.getEatRange();
  return circlesOverlap(player.x, player.y, eatRange * 0.8, prey.x, prey.y, prey.size * 0.5);
}

// Check if an enemy damages the player
function checkDamageCollision(player, prey) {
  if (!prey.alive) return false;
  if (prey.edible) return false;
  return circlesOverlap(player.x, player.y, player.size * 0.5, prey.x, prey.y, prey.size * 0.5);
}

// Check if prey enters player's attraction range
function checkAttractRange(player, prey) {
  if (!prey.alive || !prey.edible) return false;
  const range = player.size * 4;
  return circlesOverlap(player.x, player.y, range, prey.x, prey.y, 0);
}

// Check if prey is in stun range (shockwave)
function checkShockwaveRange(player, prey) {
  const range = player.size * 5;
  return circlesOverlap(player.x, player.y, range, prey.x, prey.y, 0);
}

// Check if prey is in vortex range
function checkVortexRange(player, prey) {
  const range = player.size * 4;
  return circlesOverlap(player.x, player.y, range, prey.x, prey.y, 0);
}
