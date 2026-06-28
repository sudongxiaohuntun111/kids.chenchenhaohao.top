const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const GROUND_Y = 456;
const ARENA_LEFT = 88;
const ARENA_RIGHT = 912;
const PLAYER_START_X = 305;
const ENEMY_START_X = 695;
const BASE_REACH = 62;
const MOVE_SPEED = 0.25;
const DASH_SPEED = 1.05;
const DASH_TIME = 170;
const DASH_COST = 22;

const ASSET_ROOT = 'assets/overhaul';
const FIGHTER_SPRITES = [
  'player-idle', 'player-attack1', 'player-attack2', 'player-defend', 'player-dash', 'player-hit',
  'enemy-idle', 'enemy-attack1', 'enemy-attack2', 'enemy-defend', 'enemy-hit',
  'victory', 'defeat'
];

const WEAPONS = [
  { id: 'longsword', name: '长剑', range: 132, damage: 12, cooldown: 520, stamina: 12, swingSpeed: 0.075, activeStart: 0.2, activeEnd: 0.72, color: '#ffd66b', desc: '攻守平衡' },
  { id: 'dagger', name: '短刀', range: 104, damage: 8, cooldown: 220, stamina: 7, swingSpeed: 0.065, activeStart: 0.14, activeEnd: 0.52, color: '#7deaff', desc: '快攻连击' },
  { id: 'spear', name: '长矛', range: 196, damage: 10, cooldown: 650, stamina: 13, swingSpeed: 0.052, activeStart: 0.25, activeEnd: 0.68, color: '#69d2ff', desc: '控距强势' },
  { id: 'battleaxe', name: '巨斧', range: 124, damage: 21, cooldown: 920, stamina: 22, swingSpeed: 0.095, activeStart: 0.2, activeEnd: 0.8, color: '#ff6b5c', desc: '破防重击' },
  { id: 'mace', name: '狼牙棒', range: 112, damage: 15, cooldown: 750, stamina: 17, swingSpeed: 0.085, activeStart: 0.2, activeEnd: 0.72, color: '#ff9c38', desc: '格挡也痛' },
  { id: 'nunchaku', name: '双节棍', range: 102, damage: 7, cooldown: 185, stamina: 6, swingSpeed: 0.058, activeStart: 0.1, activeEnd: 0.52, color: '#b175ff', desc: '压制节奏' },
  { id: 'greatsword', name: '大剑', range: 164, damage: 29, cooldown: 1180, stamina: 28, swingSpeed: 0.112, activeStart: 0.2, activeEnd: 0.82, color: '#ff5757', desc: '慢但致命' },
  { id: 'dualdagger', name: '双持短刀', range: 108, damage: 10, cooldown: 270, stamina: 9, swingSpeed: 0.06, activeStart: 0.14, activeEnd: 0.55, color: '#5fe8b0', desc: '左右开弓' },
  { id: 'glaive', name: '长柄刀', range: 176, damage: 16, cooldown: 730, stamina: 16, swingSpeed: 0.084, activeStart: 0.2, activeEnd: 0.72, color: '#ff9c38', desc: '横扫反打' },
  { id: 'gauntlet', name: '拳套', range: 94, damage: 9, cooldown: 205, stamina: 7, swingSpeed: 0.052, activeStart: 0.1, activeEnd: 0.45, color: '#f5d15c', desc: '完美格挡' }
];

const images = {};
const particles = [];
let gameState = 'SELECT';
let playerWeapon = null;
let enemyWeapon = null;
let playerHP = 100;
let enemyHP = 100;
let playerX = PLAYER_START_X;
let enemyX = ENEMY_START_X;
let playerStamina = 100;
let enemyStamina = 100;
let playerAttack = null;
let enemyAttack = null;
let playerDefending = false;
let enemyDefending = false;
let playerDashTimer = 0;
let enemyDashTimer = 0;
let playerHitTimer = 0;
let enemyHitTimer = 0;
let playerPerfectBlockTimer = 0;
let enemyPerfectBlockTimer = 0;
let lastPlayerAttackTime = 0;
let lastEnemyAttackTime = 0;
let gameTime = 0;
let lastTime = 0;
let gameoverTimer = 0;
let aiDecisionTimer = 0;
let aiDefendTimer = 0;
let battleMessage = '选择武器';
let battleMessageTimer = 0;
let playerCombo = 0;
let comboTimer = 0;
let moveLeft = false;
let moveRight = false;
let attackHeld = false;
let blockHeld = false;
let dashQueued = false;
let screenShake = { x: 0, y: 0, intensity: 0 };

function loadImage(key, src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      images[key] = img;
      computeAlphaTrim(img);
      resolve();
    };
    img.onerror = () => { console.warn('asset failed', src); resolve(); };
    img.src = src;
  });
}

function computeAlphaTrim(img) {
  try {
    const scratch = document.createElement('canvas');
    scratch.width = img.naturalWidth;
    scratch.height = img.naturalHeight;
    const sctx = scratch.getContext('2d', { willReadFrequently: true });
    sctx.drawImage(img, 0, 0);
    const data = sctx.getImageData(0, 0, scratch.width, scratch.height).data;
    let minX = scratch.width, minY = scratch.height, maxX = -1, maxY = -1;
    for (let y = 0; y < scratch.height; y++) {
      for (let x = 0; x < scratch.width; x++) {
        if (data[(y * scratch.width + x) * 4 + 3] > 8) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    if (maxX >= minX) img.trim = { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  } catch (err) {
    img.trim = null;
  }
}

async function loadAssets() {
  const jobs = [
    loadImage('logo', `${ASSET_ROOT}/ui/logo.png`),
    loadImage('arenaBg', `${ASSET_ROOT}/effects/arena-bg.png`),
    loadImage('slashTrail', `${ASSET_ROOT}/effects/slash-trail.png`),
    loadImage('hitSpark', `${ASSET_ROOT}/effects/hit-spark.png`),
    loadImage('attackIcon', `${ASSET_ROOT}/ui/attack.png`),
    loadImage('blockIcon', `${ASSET_ROOT}/ui/block.png`),
    loadImage('dashIcon', `${ASSET_ROOT}/ui/dash.png`),
    loadImage('leftIcon', `${ASSET_ROOT}/ui/left.png`),
    loadImage('rightIcon', `${ASSET_ROOT}/ui/right.png`)
  ];
  FIGHTER_SPRITES.forEach(id => jobs.push(loadImage(id, `${ASSET_ROOT}/fighters/${id}.png`)));
  WEAPONS.forEach(w => jobs.push(loadImage(`weapon_${w.id}`, `${ASSET_ROOT}/weapons/${w.id}.png`)));
  await Promise.all(jobs);
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function choose(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function setBattleMessage(text, ms = 900) { battleMessage = text; battleMessageTimer = ms; }

function buildWeaponUI() {
  const grid = document.getElementById('weaponGrid');
  grid.innerHTML = '';
  WEAPONS.forEach(w => {
    const card = document.createElement('button');
    card.className = 'weapon-card';
    card.type = 'button';
    card.innerHTML = `
      <span class="weapon-art" aria-hidden="true"><img src="${ASSET_ROOT}/weapons/${w.id}.png" alt=""></span>
      <span class="name">${w.name}</span>
      <span class="stats">伤害 ${w.damage} · 范围 ${w.range}<br>耗力 ${w.stamina} · ${(1000 / w.cooldown).toFixed(1)} 次/秒<br>${w.desc}</span>
    `;
    card.addEventListener('click', () => startGame(w));
    grid.appendChild(card);
  });
}

function startGame(weapon) {
  playerWeapon = weapon;
  enemyWeapon = choose(WEAPONS.filter(w => w.id !== weapon.id));
  playerHP = 100; enemyHP = 100;
  playerX = PLAYER_START_X; enemyX = ENEMY_START_X;
  playerStamina = 100; enemyStamina = 100;
  playerAttack = null; enemyAttack = null;
  playerDefending = false; enemyDefending = false;
  playerDashTimer = 0; enemyDashTimer = 0;
  playerHitTimer = 0; enemyHitTimer = 0;
  playerPerfectBlockTimer = 0; enemyPerfectBlockTimer = 0;
  lastPlayerAttackTime = 0; lastEnemyAttackTime = 0;
  aiDecisionTimer = 0; aiDefendTimer = 0;
  playerCombo = 0; comboTimer = 0;
  particles.length = 0;
  screenShake = { x: 0, y: 0, intensity: 0 };
  gameTime = 0;
  gameoverTimer = 0;
  setBattleMessage(`${weapon.name} 对 ${enemyWeapon.name}`, 1600);
  document.getElementById('weaponSelect').classList.add('hidden');
  gameState = 'FIGHT';
}

function showWeaponSelect() {
  document.getElementById('weaponSelect').classList.remove('hidden');
  gameState = 'SELECT';
  gameoverTimer = 0;
}

function bindHoldButton(id, onDown, onUp) {
  const btn = document.getElementById(id);
  const down = e => { e.preventDefault(); btn.classList.add('active'); onDown(); };
  const up = e => { e.preventDefault(); btn.classList.remove('active'); onUp(); };
  btn.addEventListener('pointerdown', down);
  btn.addEventListener('pointerup', up);
  btn.addEventListener('pointercancel', up);
  btn.addEventListener('pointerleave', up);
}

bindHoldButton('leftBtn', () => { moveLeft = true; }, () => { moveLeft = false; });
bindHoldButton('rightBtn', () => { moveRight = true; }, () => { moveRight = false; });
bindHoldButton('attackBtn', () => { attackHeld = true; }, () => { attackHeld = false; });
bindHoldButton('blockBtn', () => { blockHeld = true; }, () => { blockHeld = false; });
bindHoldButton('dashBtn', () => { dashQueued = true; }, () => {});

window.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  if (key === 'a' || e.key === 'arrowleft') moveLeft = true;
  if (key === 'd' || e.key === 'arrowright') moveRight = true;
  if (key === 'j' || key === ' ') { attackHeld = true; e.preventDefault(); }
  if (key === 'k') blockHeld = true;
  if (key === 'l') dashQueued = true;
});

window.addEventListener('keyup', e => {
  const key = e.key.toLowerCase();
  if (key === 'a' || e.key === 'arrowleft') moveLeft = false;
  if (key === 'd' || e.key === 'arrowright') moveRight = false;
  if (key === 'j' || key === ' ') attackHeld = false;
  if (key === 'k') blockHeld = false;
});

canvas.addEventListener('click', () => {
  if (gameState === 'GAMEOVER' && gameoverTimer <= 0) showWeaponSelect();
});

function canStartAttack(weapon, lastAttackTime, stamina) {
  return gameTime - lastAttackTime > weapon.cooldown && stamina >= weapon.stamina;
}

function startPlayerAttack() {
  if (playerDefending || playerAttack || !canStartAttack(playerWeapon, lastPlayerAttackTime, playerStamina)) return;
  playerAttack = { progress: 0, hasHit: false };
  playerStamina -= playerWeapon.stamina;
  lastPlayerAttackTime = gameTime;
  burst(playerX + 34, GROUND_Y - 96, playerWeapon.color, 6, 'slash');
}

function startEnemyAttack() {
  if (enemyDefending || enemyAttack || !canStartAttack(enemyWeapon, lastEnemyAttackTime, enemyStamina)) return;
  enemyAttack = { progress: 0, hasHit: false };
  enemyStamina -= enemyWeapon.stamina;
  lastEnemyAttackTime = gameTime;
  burst(enemyX - 34, GROUND_Y - 96, enemyWeapon.color, 6, 'slash');
}

function tryDash(isPlayer) {
  if (isPlayer) {
    if (playerDashTimer > 0 || playerStamina < DASH_COST || playerAttack) return;
    playerStamina -= DASH_COST;
    playerDashTimer = DASH_TIME;
    setBattleMessage('疾影冲刺');
    burst(playerX, GROUND_Y - 50, '#5fe8b0', 16, 'dash');
  } else {
    if (enemyDashTimer > 0 || enemyStamina < DASH_COST || enemyAttack) return;
    enemyStamina -= DASH_COST;
    enemyDashTimer = DASH_TIME;
    burst(enemyX, GROUND_Y - 50, '#b175ff', 12, 'dash');
  }
}

function checkHit(attackerX, defenderX, weapon, progress) {
  return progress >= weapon.activeStart && progress <= weapon.activeEnd && Math.abs(attackerX - defenderX) < BASE_REACH + weapon.range;
}

function applyDamage(target, weapon, defending, perfectTimer, comboBonus = 1) {
  const base = Math.round(weapon.damage * comboBonus);
  const x = target === 'enemy' ? enemyX : playerX;
  const y = GROUND_Y - 96;
  if (defending) {
    if (perfectTimer > 0) {
      burst(x, y, '#f5d15c', 28, 'block');
      shake(5);
      return { damage: 0, blocked: true, perfect: true };
    }
    const reduced = Math.max(1, Math.ceil(base * (weapon.id === 'mace' || weapon.id === 'battleaxe' ? 0.34 : 0.18)));
    if (target === 'enemy') enemyHP -= reduced; else playerHP -= reduced;
    if (target === 'enemy') enemyHitTimer = 220; else playerHitTimer = 220;
    damageNumber(x, y, reduced, '#9bd6ff');
    burst(x, y, '#79c8ff', 18, 'block');
    shake(4);
    return { damage: reduced, blocked: true, perfect: false };
  }
  if (target === 'enemy') enemyHP -= base; else playerHP -= base;
  if (target === 'enemy') enemyHitTimer = 280; else playerHitTimer = 280;
  damageNumber(x, y, base, weapon.color);
  burst(x, y, weapon.color, 30, 'hit');
  shake(8 + Math.min(10, base * 0.35));
  return { damage: base, blocked: false, perfect: false };
}

function shake(intensity) {
  screenShake.intensity = Math.max(screenShake.intensity, intensity);
}

function burst(x, y, color, count, type) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const speed = 0.06 + Math.random() * 0.28;
    particles.push({
      x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 0.05,
      size: type === 'dash' ? 10 + Math.random() * 22 : 3 + Math.random() * 8,
      life: 420 + Math.random() * 320, maxLife: 720, color, type, text: null
    });
  }
}

function damageNumber(x, y, amount, color) {
  particles.push({ x, y, vx: 0, vy: -0.12, size: 26, life: 820, maxLife: 820, color, type: 'text', text: `-${amount}` });
}

function updateParticles(dt) {
  for (const p of particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += p.type === 'text' ? 0 : 0.00016 * dt;
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].life <= 0) particles.splice(i, 1);
  }
}

function updateAI(dt) {
  const dist = Math.abs(enemyX - playerX);
  const preferred = BASE_REACH + enemyWeapon.range * 0.72;
  if (!enemyAttack && !enemyDefending && enemyDashTimer <= 0) {
    if (dist > preferred + 24) enemyX -= MOVE_SPEED * dt;
    if (dist < Math.max(105, preferred - 50)) enemyX += MOVE_SPEED * dt;
  }
  if (dist > preferred + 150 && enemyStamina > 55 && Math.random() < 0.008 * (dt / 16)) tryDash(false);
  if (playerAttack && playerAttack.progress < 0.55 && !enemyDefending && !enemyAttack && enemyStamina > 12) {
    if (dist < BASE_REACH + playerWeapon.range + 26 && Math.random() < 0.035 * (dt / 16)) {
      enemyDefending = true;
      enemyPerfectBlockTimer = 180;
      enemyStamina -= 8;
      aiDefendTimer = 520 + Math.random() * 420;
    }
  }
  if (enemyDefending) {
    aiDefendTimer -= dt;
    if (aiDefendTimer <= 0) enemyDefending = false;
  }
  aiDecisionTimer += dt;
  if (aiDecisionTimer > 280 + Math.random() * 540) {
    aiDecisionTimer = 0;
    if (!enemyAttack && !enemyDefending && dist < BASE_REACH + enemyWeapon.range + 34 && Math.random() < 0.64) startEnemyAttack();
  }
}

function updateAttack(actor, dt) {
  const isPlayer = actor === 'player';
  const attack = isPlayer ? playerAttack : enemyAttack;
  const weapon = isPlayer ? playerWeapon : enemyWeapon;
  if (!attack) return;
  attack.progress += weapon.swingSpeed;
  if (!attack.hasHit && checkHit(isPlayer ? playerX : enemyX, isPlayer ? enemyX : playerX, weapon, attack.progress)) {
    const result = isPlayer
      ? applyDamage('enemy', weapon, enemyDefending, enemyPerfectBlockTimer, 1 + Math.min(0.3, playerCombo * 0.06))
      : applyDamage('player', weapon, playerDefending, playerPerfectBlockTimer);
    if (isPlayer) {
      if (result.perfect) {
        playerCombo = 0;
        setBattleMessage('敌方完美格挡');
      } else {
        playerCombo += result.blocked ? 0 : 1;
        comboTimer = 1500;
        setBattleMessage(result.blocked ? '被挡住了' : `${playerCombo} 连击`);
      }
    } else {
      if (result.perfect) {
        playerStamina = clamp(playerStamina + 16, 0, 100);
        lastPlayerAttackTime = Math.max(0, lastPlayerAttackTime - 320);
        setBattleMessage('完美格挡！反击！');
      } else {
        playerCombo = 0;
        setBattleMessage(result.blocked ? '防住了部分伤害' : '被击中');
      }
    }
    attack.hasHit = true;
  }
  if (!attack.hasHit && attack.progress > weapon.activeEnd) {
    attack.hasHit = true;
    if (isPlayer) setBattleMessage('距离不够，打空了');
  }
  if (attack.progress >= 1) {
    if (isPlayer) playerAttack = null; else enemyAttack = null;
  }
}

function update(dt) {
  if (gameState === 'GAMEOVER') {
    gameoverTimer -= dt;
    updateParticles(dt);
    return;
  }
  if (gameState !== 'FIGHT') return;
  gameTime += dt;
  battleMessageTimer = Math.max(0, battleMessageTimer - dt);
  comboTimer = Math.max(0, comboTimer - dt);
  if (comboTimer <= 0) playerCombo = 0;
  playerStamina = clamp(playerStamina + dt * (playerDefending ? 0.012 : 0.032), 0, 100);
  enemyStamina = clamp(enemyStamina + dt * (enemyDefending ? 0.01 : 0.028), 0, 100);
  playerPerfectBlockTimer = Math.max(0, playerPerfectBlockTimer - dt);
  enemyPerfectBlockTimer = Math.max(0, enemyPerfectBlockTimer - dt);
  playerHitTimer = Math.max(0, playerHitTimer - dt);
  enemyHitTimer = Math.max(0, enemyHitTimer - dt);
  if (dashQueued) { tryDash(true); dashQueued = false; }
  if (playerDashTimer > 0) {
    const dir = moveLeft ? -1 : 1;
    playerX += dir * DASH_SPEED * dt;
    playerDashTimer -= dt;
  } else if (!playerAttack && !playerDefending) {
    playerX += (moveRight ? 1 : 0) * MOVE_SPEED * dt;
    playerX -= (moveLeft ? 1 : 0) * MOVE_SPEED * dt;
  }
  if (enemyDashTimer > 0) {
    const dir = Math.abs(enemyX - playerX) > BASE_REACH + enemyWeapon.range ? -1 : 1;
    enemyX += dir * DASH_SPEED * dt;
    enemyDashTimer -= dt;
  }
  playerX = clamp(playerX, ARENA_LEFT, enemyX - 78);
  enemyX = clamp(enemyX, playerX + 78, ARENA_RIGHT);
  if (attackHeld) startPlayerAttack();
  const wasDefending = playerDefending;
  playerDefending = blockHeld && !playerAttack && playerStamina > 2;
  if (playerDefending) {
    playerStamina = clamp(playerStamina - dt * 0.018, 0, 100);
    if (!wasDefending) {
      playerPerfectBlockTimer = playerWeapon.id === 'gauntlet' ? 320 : 210;
      setBattleMessage('精准格挡窗口');
      burst(playerX + 24, GROUND_Y - 100, '#7deaff', 18, 'block');
    }
  }
  updateAttack('player', dt);
  updateAttack('enemy', dt);
  updateAI(dt);
  updateParticles(dt);
  if (screenShake.intensity > 0.5) {
    screenShake.x = (Math.random() - 0.5) * screenShake.intensity * 2;
    screenShake.y = (Math.random() - 0.5) * screenShake.intensity * 2;
    screenShake.intensity *= 0.88;
  } else {
    screenShake = { x: 0, y: 0, intensity: 0 };
  }
  if (playerHP <= 0 || enemyHP <= 0) {
    playerHP = Math.max(0, playerHP);
    enemyHP = Math.max(0, enemyHP);
    gameState = 'GAMEOVER';
    gameoverTimer = 1300;
    const won = enemyHP <= 0;
    for (let i = 0; i < 120; i++) burst(W / 2 + (Math.random() - 0.5) * 420, H / 2 + (Math.random() - 0.5) * 150, won ? '#ffd66b' : '#ff5757', 1, 'hit');
  }
}

function drawArena() {
  if (images.arenaBg) {
    const img = images.arenaBg;
    const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    ctx.fillStyle = 'rgba(9, 14, 20, 0.08)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(18, 24, 31, 0.16)';
    ctx.beginPath();
    ctx.ellipse(W / 2, GROUND_Y + 18, 410, 62, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  const wall = ctx.createLinearGradient(0, 0, 0, GROUND_Y + 20);
  wall.addColorStop(0, '#f7fbff');
  wall.addColorStop(0.62, '#dce8f1');
  wall.addColorStop(1, '#b9c9d2');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.strokeStyle = 'rgba(69, 85, 102, 0.12)';
  ctx.lineWidth = 2;
  for (let x = 70; x < W; x += 70) {
    ctx.beginPath();
    ctx.moveTo(x, 70);
    ctx.lineTo(x, GROUND_Y + 4);
    ctx.stroke();
  }
  for (let y = 86; y < GROUND_Y; y += 54) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = '#2b3542';
  ctx.fillRect(0, GROUND_Y - 8, W, 10);

  const floor = ctx.createLinearGradient(0, GROUND_Y, 0, H);
  floor.addColorStop(0, '#f5d58a');
  floor.addColorStop(1, '#b87c42');
  ctx.fillStyle = floor;
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

  ctx.save();
  ctx.strokeStyle = 'rgba(85, 49, 24, 0.22)';
  ctx.lineWidth = 3;
  for (let y = GROUND_Y + 28; y < H; y += 36) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  for (let x = -180; x < W + 180; x += 92) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y);
    ctx.lineTo(x + 130, H);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = 'rgba(35, 42, 51, 0.16)';
  ctx.beginPath();
  ctx.ellipse(W / 2, GROUND_Y + 18, 410, 62, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.72)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(ARENA_LEFT, GROUND_Y + 5);
  ctx.lineTo(ARENA_RIGHT, GROUND_Y + 5);
  ctx.stroke();

  ctx.fillStyle = 'rgba(43,53,66,0.82)';
  ctx.font = '900 28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('STICKMAN DOJO', W / 2, 104);
}

function drawTrimmedSprite(img, centerX, footY, maxW, maxH) {
  if (!img) return;
  const trim = img.trim || { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
  const scale = Math.min(maxW / trim.w, maxH / trim.h);
  const dw = trim.w * scale;
  const dh = trim.h * scale;
  ctx.drawImage(img, trim.x, trim.y, trim.w, trim.h, centerX - dw / 2, footY - dh, dw, dh);
}

function fighterSpriteKey(isPlayer, attack, defending, dashTimer, hitTimer) {
  const side = isPlayer ? 'player' : 'enemy';
  if (gameState === 'GAMEOVER') {
    const won = enemyHP <= 0;
    return (isPlayer ? won : !won) ? 'victory' : 'defeat';
  }
  if (hitTimer > 0) return isPlayer ? 'player-hit' : 'enemy-hit';
  if (defending) return `${side}-defend`;
  if (dashTimer > 0) return isPlayer ? 'player-dash' : 'enemy-idle';
  if (attack) return `${side}-attack${attack.progress < 0.48 ? '1' : '2'}`;
  return `${side}-idle`;
}

function drawFighter(x, isPlayer, attack, defending, dashTimer, hitTimer) {
  const bob = Math.sin(gameTime * 0.004 + (isPlayer ? 0 : 1.6)) * 4;
  const attackOffset = attack ? Math.sin(Math.min(1, attack.progress) * Math.PI) * 28 : 0;
  const accent = isPlayer ? '#7deaff' : '#ff9cbd';
  const key = fighterSpriteKey(isPlayer, attack, defending, dashTimer, hitTimer);
  const img = images[key];

  ctx.save();
  ctx.translate(x + (isPlayer ? attackOffset : -attackOffset), GROUND_Y + bob);
  if (!isPlayer) ctx.scale(-1, 1);
  if (dashTimer > 0) {
    for (let i = 4; i > 0; i--) {
      ctx.save();
      ctx.globalAlpha = 0.08 + i * 0.035;
      ctx.translate(-i * 22, 0);
      drawTrimmedSprite(img, 0, 0, 172, 202);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  if (defending) drawBlockEffect(36, -108, accent);
  drawTrimmedSprite(img, 0, 0, 185, 218);
  ctx.restore();
}

function drawBlockEffect(x, y, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = i === 0 ? color : '#ffffff';
    ctx.globalAlpha = (0.42 - i * 0.1) + Math.sin(gameTime * 0.018 + i) * 0.08;
    ctx.lineWidth = 4 - i * 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, 48 + i * 10, -1.15, 1.15);
    ctx.stroke();
  }
  ctx.restore();
}

function drawAttackEffect(x, y, weapon, progress, isPlayer) {
  if (!progress || progress < 0.1 || progress > 0.86) return;
  ctx.save();
  ctx.translate(x, y);
  if (!isPlayer) ctx.scale(-1, 1);
  ctx.globalCompositeOperation = 'lighter';
  const active = Math.sin(progress * Math.PI);
  const reach = weapon.range * (0.92 + active * 0.42);
  const img = images.slashTrail;
  if (img) {
    ctx.globalAlpha = 0.76 * active;
    ctx.translate(60 + reach * 0.18, -118);
    ctx.rotate(-0.18 + progress * 0.38);
    drawTrimmedSprite(img, reach * 0.24, 76, reach * 1.22, 138);
  } else {
    ctx.strokeStyle = weapon.color;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = (0.5 - i * 0.12) * active;
      ctx.lineWidth = 12 - i * 3;
      ctx.beginPath();
      ctx.arc(38, -108, reach * (0.62 + i * 0.12), -0.9 + progress * 0.85, -0.12 + progress * 1.12);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawBar(x, y, w, h, pct, fillA, fillB, label, flip = false) {
  ctx.save();
  ctx.fillStyle = 'rgba(9, 14, 20, 0.54)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h + 24, 6);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.font = '800 13px Arial';
  ctx.textAlign = flip ? 'right' : 'left';
  ctx.fillText(label, flip ? x + w - 9 : x + 9, y + 16);
  const bx = x + 9, by = y + 24, bw = w - 18;
  ctx.fillStyle = 'rgba(255,255,255,0.24)';
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, h, 3);
  ctx.fill();
  const grad = ctx.createLinearGradient(bx, by, bx + bw, by);
  grad.addColorStop(0, fillA);
  grad.addColorStop(1, fillB);
  ctx.fillStyle = grad;
  const fw = bw * clamp(pct, 0, 1);
  ctx.beginPath();
  if (flip) ctx.roundRect(bx + bw - fw, by, fw, h, 3);
  else ctx.roundRect(bx, by, fw, h, 3);
  ctx.fill();
  ctx.restore();
}

function drawHUD() {
  drawBar(18, 14, 330, 13, playerHP / 100, '#277cff', '#7deaff', `蓝方  ${playerWeapon.name}`);
  drawBar(W - 348, 14, 330, 13, enemyHP / 100, '#ff5f5f', '#ff9cbd', `${enemyWeapon.name}  红方`, true);
  drawMiniBar(28, 62, 310, playerStamina / 100, '#21c78a');
  drawMiniBar(W - 338, 62, 310, enemyStamina / 100, '#ff8aa5', true);
  ctx.textAlign = 'center';
  ctx.font = '900 24px Arial';
  ctx.fillStyle = '#15191f';
  ctx.fillText('VS', W / 2, 38);
  ctx.font = '800 14px Arial';
  ctx.fillStyle = 'rgba(21,25,31,0.62)';
  ctx.fillText(`${Math.round(Math.abs(enemyX - playerX))} px`, W / 2, 60);
  if (playerCombo > 1) {
    ctx.fillStyle = '#ee3b3b';
    ctx.font = '900 28px Arial';
    ctx.fillText(`${playerCombo} HIT`, W / 2, 104);
  }
  if (battleMessageTimer > 0) {
    ctx.fillStyle = 'rgba(21,25,31,0.82)';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 150, 112, 300, 34, 8);
    ctx.fill();
    ctx.fillStyle = '#f9fbff';
    ctx.font = '800 16px Arial';
    ctx.fillText(battleMessage, W / 2, 135);
  }
}

function drawMiniBar(x, y, w, pct, color, flip = false) {
  ctx.fillStyle = 'rgba(9,14,20,0.36)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, 6, 3);
  ctx.fill();
  ctx.fillStyle = color;
  const fw = w * clamp(pct, 0, 1);
  ctx.beginPath();
  ctx.roundRect(flip ? x + w - fw : x, y, fw, 6, 3);
  ctx.fill();
}

function drawParticles() {
  for (const p of particles) {
    const a = clamp(p.life / p.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.strokeStyle = '#fff';
    if (p.type === 'text') {
      ctx.font = `900 ${p.size}px Arial`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillText(p.text, p.x, p.y);
    } else if (p.type === 'dash') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      ctx.roundRect(p.x - p.size, p.y - p.size * 0.25, p.size * 2.2, p.size * 0.5, p.size * 0.25);
      ctx.fill();
    } else if ((p.type === 'hit' || p.type === 'block') && images.hitSpark) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(p.x, p.y);
      ctx.rotate((p.x + p.y + p.life) * 0.02);
      drawTrimmedSprite(images.hitSpark, 0, p.size * 1.2, p.size * 6.2, p.size * 6.2);
    } else {
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 - a * 0.2), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawGameOver() {
  const won = enemyHP <= 0;
  ctx.save();
  ctx.fillStyle = won ? 'rgba(17, 30, 43, 0.58)' : 'rgba(35, 17, 25, 0.62)';
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 28; i++) {
    const x = (i * 113 + gameTime * 0.05) % W;
    const y = 74 + Math.sin(gameTime * 0.004 + i) * 132 + (i % 6) * 54;
    ctx.fillStyle = won ? 'rgba(125,234,255,0.16)' : 'rgba(255,95,95,0.13)';
    ctx.beginPath();
    ctx.arc(x, y, 4 + (i % 4) * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  ctx.save();
  ctx.translate(W / 2 - 102, H / 2 + 132);
  drawTrimmedSprite(images[won ? 'victory' : 'defeat'], 0, 0, 180, 208);
  ctx.restore();
  ctx.save();
  ctx.translate(W / 2 + 102, H / 2 + 132);
  ctx.scale(-1, 1);
  drawTrimmedSprite(images[won ? 'defeat' : 'victory'], 0, 0, 180, 208);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f9fbff';
  ctx.strokeStyle = won ? '#277cff' : '#ee3b3b';
  ctx.lineWidth = 7;
  ctx.font = '900 58px Arial';
  const title = won ? '胜利' : '败北';
  ctx.strokeText(title, W / 2, H / 2 - 34);
  ctx.fillText(title, W / 2, H / 2 - 34);
  ctx.fillStyle = won ? '#7deaff' : '#ffb1c2';
  ctx.font = '800 22px Arial';
  ctx.fillText(won ? '你击败了对手' : '再选一把武器复仇', W / 2, H / 2 + 12);
  ctx.fillStyle = 'rgba(255,255,255,0.86)';
  ctx.font = '700 16px Arial';
  ctx.fillText(gameoverTimer > 0 ? `${Math.ceil(gameoverTimer / 1000)} 秒后可重新开始` : '点击战场重新开始', W / 2, H / 2 + 52);
  ctx.restore();
}

function render() {
  ctx.save();
  ctx.translate(screenShake.x, screenShake.y);
  drawArena();
  if (gameState === 'FIGHT' || gameState === 'GAMEOVER') {
    drawAttackEffect(playerX, GROUND_Y, playerWeapon, playerAttack && playerAttack.progress, true);
    drawAttackEffect(enemyX, GROUND_Y, enemyWeapon, enemyAttack && enemyAttack.progress, false);
    drawFighter(playerX, true, playerAttack, playerDefending, playerDashTimer, playerHitTimer);
    drawFighter(enemyX, false, enemyAttack, enemyDefending, enemyDashTimer, enemyHitTimer);
    drawParticles();
    drawHUD();
    if (gameState === 'GAMEOVER') drawGameOver();
  }
  ctx.restore();
}

function gameLoop(timestamp) {
  let dt = timestamp - lastTime;
  if (dt > 100) dt = 16;
  lastTime = timestamp;
  update(dt);
  render();
  requestAnimationFrame(gameLoop);
}

function decorateControls() {
  const mapping = { leftBtn: 'leftIcon', rightBtn: 'rightIcon', attackBtn: 'attackIcon', blockBtn: 'blockIcon', dashBtn: 'dashIcon' };
  Object.entries(mapping).forEach(([id, key]) => {
    const img = document.createElement('img');
    img.src = images[key].src;
    img.alt = '';
    document.getElementById(id).prepend(img);
  });
}

buildWeaponUI();

loadAssets().then(() => {
  decorateControls();
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
});
