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
const HEROES = ['hero_sword', 'hero_spear', 'hero_staff', 'hero_bow'];
const ENEMIES = ['enemy_brawl', 'enemy_club', 'enemy_slash', 'enemy_dual'];
const EFFECT_ROWS = {
  longsword: 0, dagger: 1, spear: 1, battleaxe: 2, mace: 6,
  nunchaku: 3, greatsword: 2, dualdagger: 4, glaive: 6, gauntlet: 7
};

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
let playerSprite = null;
let enemySprite = null;
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
    img.onload = () => { images[key] = img; resolve(); };
    img.onerror = () => { console.warn('asset failed', src); resolve(); };
    img.src = src;
  });
}

async function loadAssets() {
  const jobs = [
    loadImage('logo', `${ASSET_ROOT}/ui/logo.png`),
    loadImage('effects', `${ASSET_ROOT}/effects/attack_effects.png`),
    loadImage('attackIcon', `${ASSET_ROOT}/ui/attack.png`),
    loadImage('blockIcon', `${ASSET_ROOT}/ui/block.png`),
    loadImage('dashIcon', `${ASSET_ROOT}/ui/dash.png`),
    loadImage('leftIcon', `${ASSET_ROOT}/ui/left.png`),
    loadImage('rightIcon', `${ASSET_ROOT}/ui/right.png`)
  ];
  HEROES.concat(ENEMIES).forEach(id => jobs.push(loadImage(id, `${ASSET_ROOT}/fighters/${id}.png`)));
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
  playerSprite = choose(HEROES);
  enemySprite = choose(ENEMIES);
  playerHP = 100; enemyHP = 100;
  playerX = PLAYER_START_X; enemyX = ENEMY_START_X;
  playerStamina = 100; enemyStamina = 100;
  playerAttack = null; enemyAttack = null;
  playerDefending = false; enemyDefending = false;
  playerDashTimer = 0; enemyDashTimer = 0;
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
    damageNumber(x, y, reduced, '#9bd6ff');
    burst(x, y, '#79c8ff', 18, 'block');
    shake(4);
    return { damage: reduced, blocked: true, perfect: false };
  }
  if (target === 'enemy') enemyHP -= base; else playerHP -= base;
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
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#8fdfff');
  sky.addColorStop(0.34, '#d7fbff');
  sky.addColorStop(0.35, '#77d26d');
  sky.addColorStop(1, '#2d7d56');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = 0.34;
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = i % 2 ? '#fff6c7' : '#b8f0ff';
    ctx.beginPath();
    ctx.ellipse(90 + i * 145, 92 + Math.sin(i) * 22, 76, 22, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(28, 80, 52, 0.28)';
  ctx.beginPath();
  ctx.ellipse(W / 2, GROUND_Y + 64, 470, 92, 0, 0, Math.PI * 2);
  ctx.fill();
  const floor = ctx.createRadialGradient(W / 2, GROUND_Y + 10, 60, W / 2, GROUND_Y + 20, 520);
  floor.addColorStop(0, '#fff1a8');
  floor.addColorStop(0.45, '#e7cb74');
  floor.addColorStop(0.48, '#69bd64');
  floor.addColorStop(1, '#246c4f');
  ctx.fillStyle = floor;
  ctx.beginPath();
  ctx.ellipse(W / 2, GROUND_Y + 22, 465, 96, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.58)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(W / 2, GROUND_Y + 22, 360, 66, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawFighter(x, spriteId, weapon, isPlayer, attack, defending, dashTimer) {
  const img = images[spriteId];
  const bob = Math.sin(gameTime * 0.004 + (isPlayer ? 0 : 1.6)) * 4;
  const attackOffset = attack ? Math.sin(Math.min(1, attack.progress) * Math.PI) * 28 : 0;
  ctx.save();
  ctx.translate(x + (isPlayer ? attackOffset : -attackOffset), GROUND_Y + bob);
  if (!isPlayer) ctx.scale(-1, 1);
  if (dashTimer > 0) {
    ctx.globalAlpha = 0.22;
    for (let i = 4; i > 0; i--) drawSpriteImage(img, -i * 18, -148, 150, 188);
    ctx.globalAlpha = 1;
  }
  if (defending) drawBlockEffect(34, -112, isPlayer ? '#7deaff' : '#b175ff');
  drawSpriteImage(img, -78, -198, 156, 204);
  drawHeldWeapon(weapon, attack ? attack.progress : 0, defending);
  ctx.restore();
}

function drawSpriteImage(img, x, y, w, h) {
  if (img && img.complete && img.naturalWidth > 0) ctx.drawImage(img, x, y, w, h);
}

function drawHeldWeapon(weapon, progress, defending) {
  if (defending) return;
  const img = images[`weapon_${weapon.id}`];
  const windup = progress ? Math.sin(progress * Math.PI) : 0;
  ctx.save();
  ctx.translate(48, -118);
  ctx.rotate((-0.5 + progress * 1.45) * windup);
  const scale = weapon.id === 'gauntlet' ? 0.44 : 0.52;
  if (img) ctx.drawImage(img, -34, -80, 150 * scale, 150 * scale);
  ctx.restore();
}

function drawBlockEffect(x, y, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.28 + Math.sin(gameTime * 0.018) * 0.12;
  ctx.beginPath();
  ctx.roundRect(-18, -44, 44, 82, 22);
  ctx.fill();
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function drawAttackEffect(x, y, weapon, progress, isPlayer) {
  const sheet = images.effects;
  if (!sheet || !progress || progress < 0.1 || progress > 0.86) return;
  const row = EFFECT_ROWS[weapon.id] || 0;
  const frame = clamp(Math.floor(progress * 4), 0, 3);
  ctx.save();
  ctx.translate(x, y);
  if (!isPlayer) ctx.scale(-1, 1);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.82;
  ctx.drawImage(sheet, frame * 256, row * 120, 256, 120, -20, -175, weapon.range * 1.35, 136);
  ctx.restore();
}

function drawBar(x, y, w, h, pct, fillA, fillB, label, flip = false) {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 253, 245, 0.92)';
  ctx.strokeStyle = '#24324d';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h + 31, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#24324d';
  ctx.font = '800 15px Arial';
  ctx.textAlign = flip ? 'right' : 'left';
  ctx.fillText(label, flip ? x + w - 12 : x + 12, y + 20);
  const bx = x + 12, by = y + 30, bw = w - 24;
  ctx.fillStyle = '#dfe7ef';
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, h, h / 2);
  ctx.fill();
  const grad = ctx.createLinearGradient(bx, by, bx + bw, by);
  grad.addColorStop(0, fillA);
  grad.addColorStop(1, fillB);
  ctx.fillStyle = grad;
  const fw = bw * clamp(pct, 0, 1);
  ctx.beginPath();
  if (flip) ctx.roundRect(bx + bw - fw, by, fw, h, h / 2);
  else ctx.roundRect(bx, by, fw, h, h / 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  drawBar(18, 14, 342, 17, playerHP / 100, '#42d96b', '#b6ff7d', `我方  ${playerWeapon.name}`);
  drawBar(W - 360, 14, 342, 17, enemyHP / 100, '#b175ff', '#ff5f91', `${enemyWeapon.name}  敌方`, true);
  drawMiniBar(30, 70, 318, playerStamina / 100, '#5fe8b0');
  drawMiniBar(W - 348, 70, 318, enemyStamina / 100, '#ff9cbd', true);
  ctx.textAlign = 'center';
  ctx.font = '900 28px Arial';
  ctx.fillStyle = '#24324d';
  ctx.fillText('VS', W / 2, 42);
  ctx.font = '800 14px Arial';
  ctx.fillStyle = '#35617d';
  ctx.fillText(`距离 ${Math.round(Math.abs(enemyX - playerX))}`, W / 2, 64);
  if (playerCombo > 1) {
    ctx.fillStyle = '#ff6b5c';
    ctx.font = '900 28px Arial';
    ctx.fillText(`${playerCombo} HIT`, W / 2, 104);
  }
  if (battleMessageTimer > 0) {
    ctx.fillStyle = 'rgba(36,50,77,0.84)';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 160, 112, 320, 38, 19);
    ctx.fill();
    ctx.fillStyle = '#fff7ca';
    ctx.font = '800 16px Arial';
    ctx.fillText(battleMessage, W / 2, 137);
  }
}

function drawMiniBar(x, y, w, pct, color, flip = false) {
  ctx.fillStyle = 'rgba(36,50,77,0.25)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, 8, 4);
  ctx.fill();
  ctx.fillStyle = color;
  const fw = w * clamp(pct, 0, 1);
  ctx.beginPath();
  ctx.roundRect(flip ? x + w - fw : x, y, fw, 8, 4);
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
  ctx.fillStyle = won ? 'rgba(20, 48, 62, 0.78)' : 'rgba(42, 18, 38, 0.82)';
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 36; i++) {
    const x = (i * 97 + gameTime * 0.04) % W;
    const y = 70 + Math.sin(gameTime * 0.003 + i) * 150 + (i % 7) * 54;
    ctx.fillStyle = won ? 'rgba(255,214,107,0.18)' : 'rgba(255,87,87,0.14)';
    ctx.beginPath();
    ctx.arc(x, y, 18 + (i % 5) * 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fffdf5';
  ctx.strokeStyle = won ? '#ff9c38' : '#7deaff';
  ctx.lineWidth = 8;
  ctx.font = '900 62px Arial';
  const title = won ? '胜利' : '败北';
  ctx.strokeText(title, W / 2, H / 2 - 34);
  ctx.fillText(title, W / 2, H / 2 - 34);
  ctx.fillStyle = won ? '#ffd66b' : '#ff9cbd';
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
    drawFighter(playerX, playerSprite, playerWeapon, true, playerAttack, playerDefending, playerDashTimer);
    drawFighter(enemyX, enemySprite, enemyWeapon, false, enemyAttack, enemyDefending, enemyDashTimer);
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
