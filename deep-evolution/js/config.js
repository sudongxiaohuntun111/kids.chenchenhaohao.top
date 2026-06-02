// ==================== 游戏全局配置 ====================

const CONFIG = {
  WIDTH: 1200,
  HEIGHT: 750,
  FPS: 60,
  GRAVITY: 0,
  MAX_PARTICLES: 700,
};

// ==================== 难度配置 ====================

const DIFFICULTY = {
  easy: {
    label: '简单',
    icon: '🌿',
    subtitle: '海星模式 · 轻松愉快',
    evolutionThreshold: [30, 100],
    initialHp: 7,
    preyCount: { min: 10, max: 18 },
    enemyCount: { min: 1, max: 2 },
    enemyDamage: 0.5,
    spawnRate: 45,
    preySpeedMul: 0.7,
    enemySpeedMul: 0.8,
    aggroRange: 200,
    harmfulChance: 0.1,
  },
  normal: {
    label: '普通',
    icon: '⚡',
    subtitle: '船锚模式 · 平衡挑战',
    evolutionThreshold: [50, 150],
    initialHp: 5,
    preyCount: { min: 8, max: 14 },
    enemyCount: { min: 2, max: 4 },
    enemyDamage: 1,
    spawnRate: 60,
    preySpeedMul: 1.0,
    enemySpeedMul: 1.0,
    aggroRange: 300,
    harmfulChance: 0.2,
  },
  hard: {
    label: '困难',
    icon: '🔥',
    subtitle: '三叉戟模式 · 浚棋难度',
    evolutionThreshold: [80, 200],
    initialHp: 5,
    preyCount: { min: 5, max: 10 },
    enemyCount: { min: 3, max: 6 },
    enemyDamage: 1.5,
    spawnRate: 80,
    preySpeedMul: 1.3,
    enemySpeedMul: 1.3,
    aggroRange: 450,
    harmfulChance: 0.3,
  },
};

// ==================== 颜色配置 ====================

const COLORS = {
  deepWater1: '#0a1628',
  deepWater2: '#0d2b4e',
  deepWater3: '#144272',
  lightRay: 'rgba(200, 230, 255, 0.04)',
  sand: '#c2a366',
  sandDark: '#8b7a4d',
  seaweed: '#2d8a4e',
  seaweedLight: '#3daa5e',
  coral: '#e06050',
  coralDark: '#c04040',
  shell: '#f0d0a0',
  treasure: '#c89030',
  bubble: 'rgba(180, 220, 255, 0.4)',
  hp: '#ff4466',
  hpBg: '#442233',
  score: '#ffdd44',
  textLight: '#e8f0ff',
  textDim: '#8899bb',
  uiPanel: 'rgba(8, 20, 48, 0.85)',
  uiBorder: 'rgba(60, 140, 220, 0.4)',
  uiGlow: 'rgba(60, 180, 255, 0.15)',
};

// ==================== 进化数据 ====================

const EVOLUTION_FORMS = {
  // ---- 初始 ----
  clownfish: {
    name: '小丑鱼',
    english: 'Clownfish',
    sizeMul: 1.0,
    speedMul: 1.0,
    stage: 0,
    color: '#ff6633',
    color2: '#ffffff',
    desc: '勇敢的小不点',
    drawOrder: 0,
  },
  // ---- 一阶进化 ----
  greatWhiteShark: {
    name: '大白鲨',
    english: 'Great White Shark',
    sizeMul: 2.0,
    speedMul: 1.1,
    stage: 1,
    color: '#7B8D93',
    color2: '#d4dce0',
    desc: '海洋的顶级猎手',
    drawOrder: 1,
  },
  orca: {
    name: '虎鲸',
    english: 'Orca',
    sizeMul: 2.2,
    speedMul: 1.2,
    stage: 1,
    color: '#1a1a2e',
    color2: '#ffffff',
    desc: '黑白双煞',
    drawOrder: 1,
  },
  mosasaurus: {
    name: '沧龙',
    english: 'Mosasaurus',
    sizeMul: 2.5,
    speedMul: 0.9,
    stage: 1,
    color: '#2d6a4f',
    color2: '#95d5b2',
    desc: '远古深海霸主',
    drawOrder: 1,
  },
  // ---- 二阶进化 ----
  megalodon: {
    name: '巨齿鲨',
    english: 'Megalodon',
    sizeMul: 3.5,
    speedMul: 1.2,
    stage: 2,
    color: '#4a5559',
    color2: '#8a9aa0',
    desc: '史上最强鲨鱼',
    drawOrder: 2,
  },
  basilosaurus: {
    name: '龙王鲸',
    english: 'Basilosaurus',
    sizeMul: 4.0,
    speedMul: 1.3,
    stage: 2,
    color: '#2c3e50',
    color2: '#5d7a8c',
    desc: '深海之龙',
    drawOrder: 2,
  },
  tylosaurus: {
    name: '海底霸王龙',
    english: 'Tylosaurus',
    sizeMul: 4.5,
    speedMul: 1.0,
    stage: 2,
    color: '#1b4332',
    color2: '#74c69d',
    desc: '海洋的暴君',
    drawOrder: 2,
  },
};

// 进化路径映射
const EVOLUTION_PATHS = {
  clownfish: ['greatWhiteShark', 'orca', 'mosasaurus'],
  greatWhiteShark: ['megalodon'],
  orca: ['basilosaurus'],
  mosasaurus: ['tylosaurus'],
};

// ==================== 能力系统 ====================

const ABILITIES = {
  // ---- 通用能力 ----
  sharpTeeth: {
    name: '利齿', icon: '🦷', general: true, maxLevel: 3, stackable: true,
    description: '吞噬范围 +15%',
    apply: (player, level) => { player.bonus.eatRange += 0.15 * level; },
  },
  quickFin: {
    name: '神速', icon: '⚡', general: true, maxLevel: 3, stackable: true,
    description: '移动速度 +10%',
    apply: (player, level) => { player.bonus.speedMul += 0.10 * level; },
  },
  hardScale: {
    name: '硬鳞', icon: '🛡️', general: true, maxLevel: 3, stackable: true,
    description: '最大生命 +1',
    apply: (player, level) => { player.maxHp += 1; player.hp = Math.min(player.hp + 1, player.maxHp); },
  },
  eagleEye: {
    name: '鹰眼', icon: '👁️', general: true, maxLevel: 3, stackable: true,
    description: '视野范围 +10%',
    apply: (player, level) => { player.bonus.viewRange += 0.10 * level; },
  },
  attract: {
    name: '引力', icon: '💫', general: true, maxLevel: 1, stackable: false,
    description: '自动吸引附近小猎物',
    apply: (player) => { player.bonus.hasAttract = true; },
  },
  regen: {
    name: '再生', icon: '❤️', general: true, maxLevel: 3, stackable: true,
    description: '每秒回复少量生命',
    apply: (player, level) => { player.bonus.regen += 0.5 * level; },
  },

  // ---- 大白鲨专属 ----
  shockwave: {
    name: '冲击波', icon: '🌊', general: false, form: 'greatWhiteShark', maxLevel: 1,
    cooldown: 30, duration: 2,
    description: '震晕周围小猎物 2 秒',
    apply: (player) => { player.bonus.hasShockwave = true; },
  },
  bloodlust: {
    name: '嗜血', icon: '🩸', general: false, form: 'greatWhiteShark', maxLevel: 1,
    cooldown: 30,
    description: '低血量时狂暴加速+伤害免疫 5 秒',
    apply: (player) => { player.bonus.hasBloodlust = true; },
  },
  frenzy: {
    name: '狂暴撕咬', icon: '🦈', general: false, form: 'greatWhiteShark', maxLevel: 1,
    description: '吞噬大鱼获得 50% 额外积分',
    apply: (player) => { player.bonus.hasFrenzy = true; },
  },

  // ---- 虎鲸专属 ----
  packHunt: {
    name: '团队狩猎', icon: '🧠', general: false, form: 'orca', maxLevel: 1,
    cooldown: 45, duration: 15,
    description: '召唤 AI 虎鲸协助 15 秒',
    apply: (player) => { player.bonus.hasPackHunt = true; },
  },
  tailSlam: {
    name: '回旋尾击', icon: '🎯', general: false, form: 'orca', maxLevel: 1,
    cooldown: 20,
    description: '击退周围敌人并眩晕',
    apply: (player) => { player.bonus.hasTailSlam = true; },
  },
  echoLocate: {
    name: '回声定位', icon: '📡', general: false, form: 'orca', maxLevel: 1,
    description: '高亮最近的猎物',
    apply: (player) => { player.bonus.hasEchoLocate = true; },
  },

  // ---- 沧龙专属 ----
  vortex: {
    name: '深海漩涡', icon: '🌀', general: false, form: 'mosasaurus', maxLevel: 1,
    cooldown: 25,
    description: '制造漩涡拉近猎物',
    apply: (player) => { player.bonus.hasVortex = true; },
  },
  camouflage: {
    name: '拟态伪装', icon: '🃏', general: false, form: 'mosasaurus', maxLevel: 1,
    cooldown: 15,
    description: '静止后隐身，下次攻击必中',
    apply: (player) => { player.bonus.hasCamouflage = true; },
  },
  ancientPower: {
    name: '远古之力', icon: '🐚', general: false, form: 'mosasaurus', maxLevel: 1,
    cooldown: 40, duration: 8,
    description: '吞噬效果翻倍 8 秒',
    apply: (player) => { player.bonus.hasAncientPower = true; },
  },

  // ---- 巨齿鲨专属 ----
  abyssMaw: {
    name: '深渊巨口', icon: '💥', general: false, form: 'megalodon', maxLevel: 1,
    cooldown: 60, duration: 5,
    description: '可吞略大的鱼，持续 5 秒',
    apply: (player) => { player.bonus.hasAbyssMaw = true; },
  },
  tsunamiCharge: {
    name: '海啸冲锋', icon: '🌪️', general: false, form: 'megalodon', maxLevel: 1,
    cooldown: 40,
    description: '直线冲刺，路径猎物秒杀',
    apply: (player) => { player.bonus.hasTsunamiCharge = true; },
  },
  ancientArmor: {
    name: '远古甲胄', icon: '🦴', general: false, form: 'megalodon', maxLevel: 1,
    cooldown: 45, duration: 5,
    description: '免疫伤害 5 秒',
    apply: (player) => { player.bonus.hasAncientArmor = true; },
  },

  // ---- 龙王鲸专属 ----
  abyssSong: {
    name: '深渊之歌', icon: '🌊', general: false, form: 'basilosaurus', maxLevel: 1,
    cooldown: 50,
    description: '全屏小猎物混乱 3 秒',
    apply: (player) => { player.bonus.hasAbyssSong = true; },
  },
  vortexPull: {
    name: '涡流牵引', icon: '🌀', general: false, form: 'basilosaurus', maxLevel: 1,
    cooldown: 35,
    description: '大范围吸拉猎物',
    apply: (player) => { player.bonus.hasVortexPull = true; },
  },
  bubbleShield: {
    name: '气泡护盾', icon: '🫧', general: false, form: 'basilosaurus', maxLevel: 1,
    cooldown: 30,
    description: '抵挡并反弹一次伤害',
    apply: (player) => { player.bonus.hasBubbleShield = true; },
  },

  // ---- 海底霸王龙专属 ----
  deepFlame: {
    name: '深海烈焰', icon: '🔥', general: false, form: 'tylosaurus', maxLevel: 1,
    cooldown: 35,
    description: '喷射火焰灼烧猎物',
    apply: (player) => { player.bonus.hasDeepFlame = true; },
  },
  tailWhip: {
    name: '巨尾横扫', icon: '⛓️', general: false, form: 'tylosaurus', maxLevel: 1,
    cooldown: 25,
    description: '360° 击飞周围所有单位',
    apply: (player) => { player.bonus.hasTailWhip = true; },
  },
  tyrantAura: {
    name: '暴君威压', icon: '🦖', general: false, form: 'tylosaurus', maxLevel: 1,
    cooldown: 45, duration: 5,
    description: '全屏猎物减速 50%',
    apply: (player) => { player.bonus.hasTyrantAura = true; },
  },
};

// 归类通用的能力ID列表
const GENERAL_ABILITY_IDS = Object.keys(ABILITIES).filter(id => ABILITIES[id].general);

// ==================== 猎物类型 ====================

const PREY_TYPES = [
  // ---- 可食用猎物（size 连续梯度，确保玩家始终有鱼可吃） ----
  { id: 'micro', name: '浮游小鱼', size: 10, value: 1, speed: 2.0, color: '#aaddff', edible: true, harmful: false, spawnWeight: 35 },
  { id: 'tiny', name: '小丑鱼苗', size: 16, value: 1, speed: 1.8, color: '#ff8844', edible: true, harmful: false, spawnWeight: 35 },
  { id: 'small', name: '小黄鱼', size: 24, value: 2, speed: 1.5, color: '#ffcc44', edible: true, harmful: false, spawnWeight: 25 },
  { id: 'medium', name: '鲷鱼', size: 32, value: 3, speed: 1.2, color: '#ff6688', edible: true, harmful: false, spawnWeight: 18 },
  { id: 'turtle', name: '小海龟', size: 34, value: 4, speed: 0.8, color: '#66aa55', edible: true, harmful: false, spawnWeight: 8 },
  { id: 'big', name: '金枪鱼', size: 44, value: 5, speed: 1.5, color: '#4488ff', edible: true, harmful: false, spawnWeight: 10 },
  { id: 'manta', name: '魔鬼鱼', size: 56, value: 6, speed: 1.8, color: '#8866cc', edible: true, harmful: false, spawnWeight: 4 },
  // ---- 危险生物（不可食用） ----
  { id: 'puffer', name: '刺豚', size: 28, value: 0, speed: 0.7, color: '#88dd44', edible: false, harmful: true, spawnWeight: 6 },
  { id: 'jellyfish', name: '水母', size: 32, value: 0, speed: 0.6, color: '#cc88ff', edible: false, harmful: true, spawnWeight: 8 },
];

// ==================== 装饰物类型 ====================

const DECORATION_TYPES = {
  seaweed: { label: '水草', variants: 3 },
  shell: { label: '贝壳', variants: 2 },
  treasure: { label: '宝箱', variants: 1 },
  coral: { label: '珊瑚', variants: 2 },
  rock: { label: '岩石', variants: 2 },
};

// ==================== v2 新增配置 ====================

CONFIG.AUDIO_ENABLED = true;

// 能力激活键
CONFIG.ABILITY_KEY = 'e';
