// ==================== 碰撞检测 ====================

// Circle collision between two entities
function circlesOverlap(x1, y1, r1, x2, y2, r2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  const dist = dx * dx + dy * dy;
  const minDist = r1 + r2;
  return dist < minDist * minDist;
}

// Get distance between two points
function getDistance(x1, y1, x2, y2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

// Check if player can eat a specific prey（含大小比例检查）
function checkEatCollision(player, prey) {
  if (!prey.alive || !prey.edible) return false;
  // 大小比例检查：默认能吃 size <= 玩家 size * 0.8 的鱼
  // 深渊巨口可吞 size <= 玩家 size * 1.2 的鱼
  const maxPreySize = player.size * player.getMaxEatRatio();
  if (prey.size > maxPreySize) return false;
  const eatRange = player.getEatRange();
  return circlesOverlap(player.x, player.y, eatRange * 0.8, prey.x, prey.y, prey.size * 0.5);
}

// Check if an enemy damages the player
function checkDamageCollision(player, prey) {
  if (!prey.alive) return false;
  if (prey.edible) return false;
  // AI 盟友不伤害玩家
  if (prey.isAlly) return false;
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

// v2: Check if prey is in radius around point
function isInRadius(px, py, radius, tx, ty) {
  return circlesOverlap(px, py, radius, tx, ty, 0);
}

// v2: Check tail slam range (for orca)
function checkTailSlamRange(player, prey) {
  const range = 150;
  return circlesOverlap(player.x, player.y, range, prey.x, prey.y, 0);
}

// v2: Check tail whip range (for tylosaurus)
function checkTailWhipRange(player, prey) {
  const range = 100;
  return circlesOverlap(player.x, player.y, range, prey.x, prey.y, 0);
}

// v2: Check vortex pull range (for basilosaurus)
function checkVortexPullRange(player, prey) {
  const range = 300;
  return circlesOverlap(player.x, player.y, range, prey.x, prey.y, 0);
}

// v2: Check flame path collision
function checkFlamePath(fx, fy, angle, length, width, tx, ty) {
  // Project target onto flame direction
  const dx = tx - fx;
  const dy = ty - fy;
  const proj = dx * Math.cos(angle) + dy * Math.sin(angle);
  if (proj < 0 || proj > length) return false;
  // Perpendicular distance
  const perpDist = Math.abs(dx * Math.sin(angle) - dy * Math.cos(angle));
  return perpDist < width;
}
