// ==================== 游戏主循环 ====================

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = CONFIG.WIDTH;
    this.canvas.height = CONFIG.HEIGHT;

    this.input = new InputManager(this.canvas);
    this.particles = new ParticleSystem();
    this.renderer = new Renderer(this.ctx);
    this.ui = new UIManager(this.ctx, CONFIG.WIDTH, CONFIG.HEIGHT);
    this.audio = new AudioManager();
    this.collection = new CollectionManager();

    this.state = 'MENU'; // MENU | PLAYING | EVOLVING | EVOLVE_TRANSITION | GAME_OVER
    this.frame = 0;
    this.player = null;
    this.preyList = [];
    this.difficulty = 'normal';
    this.diffConfig = null;

    // Evolution state
    this.evoState = null;
    this.evoFrame = 0;
    this.newForm = null;
    this.abilityChoices = [];
    this.formChoices = [];

    // ---- v2 能力系统状态 ----
    this.abilityCooldowns = {};  // { abilityId: framesRemaining }
    this.abilityEffects = {};    // { abilityId: framesRemaining }

    // 冲击波
    this.shockwaveActive = 0;
    this.shockwaveRadius = 0;
    // 漩涡
    this.vortexEffects = [];     // [{ x, y, timer, radius }]
    // 回声定位
    this.echoTargets = [];
    // 深海烈焰
    this.flameActive = 0;
    this.flameAngle = 0;
    this.flameTarget = { x: 0, y: 0 };
    this.flameDamageTimer = 0;
    // 海啸冲锋
    this.chargeActive = 0;
    this.chargeAngle = 0;
    this.chargeSpeed = 0;
    // 深渊之歌
    this.abyssSongActive = 0;
    // 暴君威压
    this.tyrantAuraActive = 0;
    // 远古之力
    this.ancientPowerActive = 0;
    // 远古甲胄
    this.ancientArmorActive = 0;
    // 拟态伪装
    this.camouflageState = 'off'; // off | hiding | hidden | striking
    this.camouflageTimer = 0;
    // 深渊巨口
    this.abyssMawActive = 0;
    // 涡流牵引
    this.vortexPullActive = 0;
    // 气泡护盾
    this.bubbleShieldReady = false;

    // 进化动画增强
    this.evoFlash = 0;
    this.evoTextTimer = 0;
    this.evoNewFormName = '';

    // 屏幕闪红
    this.screenFlashRed = 0;
    this.screenFlashWhite = 0;

    // Border bounds for entities
    this.bounds = { w: CONFIG.WIDTH, h: CONFIG.HEIGHT };

    // Track eaten count
    this.totalEaten = 0;

    // Spawn timer
    this.spawnTimer = 0;

    // Screen shake
    this.screenShake = 0;

    // Mouse tracking for abilities
    this.mouseX = CONFIG.WIDTH / 2;
    this.mouseY = CONFIG.HEIGHT / 2;

    // Handle resize
    this._resize();
    window.addEventListener('resize', () => this._resize());

    // Mouse events for UI
    this.canvas.addEventListener('click', (e) => this._onClick(e));
    this.canvas.addEventListener('mousemove', (e) => this._onMove(e));

    // Touch events for UI
    this.canvas.addEventListener('touchstart', (e) => this._onTouch(e), { passive: false });

    // Keyboard for ability activation
    window.addEventListener('keydown', (e) => this._onKeyDown(e));

    // Initialize audio on first interaction
    this._audioInit = false;
    this.canvas.addEventListener('click', () => this._initAudio(), { once: true });
    window.addEventListener('keydown', () => this._initAudio(), { once: true });

    // Start game loop
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  _initAudio() {
    if (this._audioInit) return;
    this._audioInit = true;
    this.audio.tryInit();
  }

  _resize() {
    const container = document.getElementById('gameContainer');
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const ratio = CONFIG.WIDTH / CONFIG.HEIGHT;

    let w, h;
    if (cw / ch > ratio) {
      h = ch;
      w = h * ratio;
    } else {
      w = cw;
      h = w / ratio;
    }
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
  }

  // ============ 游戏状态管理 ============

  startGame(difficulty) {
    this.difficulty = difficulty;
    this.diffConfig = DIFFICULTY[difficulty];
    this.state = 'PLAYING';
    this.frame = 0;
    this.totalEaten = 0;
    this.preyList = [];
    this.screenShake = 0;
    this.shockwaveActive = 0;
    this.vortexEffects = [];
    this.flameActive = 0;
    this.chargeActive = 0;
    this.abyssSongActive = 0;
    this.tyrantAuraActive = 0;
    this.ancientPowerActive = 0;
    this.ancientArmorActive = 0;
    this.camouflageState = 'off';
    this.abyssMawActive = 0;
    this.vortexPullActive = 0;
    this.bubbleShieldReady = false;
    this.screenFlashRed = 0;
    this.screenFlashWhite = 0;
    this.evoFlash = 0;
    this.evoTextTimer = 0;
    this.abilityCooldowns = {};
    this.abilityEffects = {};

    this.player = new Player(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, difficulty);
    this.player.totalEaten = 0;
    this.player.evolutionCount = 0;

    this.particles = new ParticleSystem();
    this.collection.reset();

    // Initial bubble ambiance
    for (let i = 0; i < 15; i++) {
      this.particles.spawnBubbles(
        Math.random() * CONFIG.WIDTH,
        CONFIG.HEIGHT - 20 - Math.random() * 100,
        1, 2 + Math.random() * 3,
      );
    }

    // Spawn initial prey
    this._spawnInitialPrey();

    // Start BGM
    this.audio.startBGM();

    // Discover initial form
    this.collection.discoverForm('clownfish', 0);
  }

  _spawnInitialPrey() {
    const count = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      this._spawnPrey();
    }
  }

  _spawnPrey() {
    if (!this.diffConfig || !this.player) return;
    const counts = this.diffConfig.preyCount;
    const p = this.player;

    // Cap total prey
    const aliveCount = this.preyList.filter(q => q.alive).length;
    if (aliveCount > counts.max + 5) return;

    const isEnemy = Math.random() < this._getEnemySpawnRate(p);
    let type;

    if (isEnemy) {
      const enemyTypes = PREY_TYPES.filter(t => !t.edible);
      type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    } else {
      // 动态权重：根据玩家 size 调整，确保持续有"能吃但需要追"的目标
      type = this._pickPreyType(p);
    }

    if (!type) type = PREY_TYPES[0];

    let x, y;
    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
      case 0: x = Math.random() * CONFIG.WIDTH; y = -20; break;
      case 1: x = CONFIG.WIDTH + 20; y = Math.random() * CONFIG.HEIGHT; break;
      case 2: x = Math.random() * CONFIG.WIDTH; y = CONFIG.HEIGHT + 20; break;
      case 3: x = -20; y = Math.random() * CONFIG.HEIGHT; break;
    }

    const prey = new Prey(x, y, type, this.diffConfig);
    this.preyList.push(prey);
  }

  // 根据玩家 size 动态选择猎物类型
  _pickPreyType(player) {
    const eatLimit = player.size * player.getMaxEatRatio(); // 能吃的最大 size
    const edibleTypes = PREY_TYPES.filter(t => t.edible);

    // 分类猎物
    const easy = edibleTypes.filter(t => t.size < player.size * 0.4);       // 轻松吃（太小，分低）
    const normal = edibleTypes.filter(t => t.size >= player.size * 0.4 && t.size <= eatLimit);  // 能吃（主要食物）
    const tooBig = edibleTypes.filter(t => t.size > eatLimit);               // 吃不到（进化目标）

    // 权重分配：60% 正常 + 25% 简单 + 15% 太大（给进化动力）
    let pool, weight;
    const r = Math.random();
    if (r < 0.60 && normal.length > 0) {
      pool = normal; weight = 'normal';
    } else if (r < 0.85 && easy.length > 0) {
      pool = easy; weight = 'easy';
    } else if (tooBig.length > 0) {
      pool = tooBig; weight = 'tooBig';
    } else if (normal.length > 0) {
      pool = normal; weight = 'normal';
    } else {
      pool = easy.length > 0 ? easy : edibleTypes;
      weight = 'fallback';
    }

    // 在池内按 spawnWeight 随机
    const totalWeight = pool.reduce((s, t) => s + t.spawnWeight, 0);
    let roll = Math.random() * totalWeight;
    for (const t of pool) {
      roll -= t.spawnWeight;
      if (roll <= 0) return t;
    }
    return pool[0];
  }

  // 动态敌人生成率：前期低，后期高
  _getEnemySpawnRate(player) {
    if (!player) return 0.15;
    const stage = player.evolutionStage || 0;
    // 0阶: 10% → 1阶: 18% → 2阶: 28%
    return Math.min(0.28, 0.10 + stage * 0.09);
  }

  // ============ 主游戏循环 ============

  _loop() {
    this.frame++;
    this._update();
    this._render();
    requestAnimationFrame(this._loop);
  }

  _update() {
    switch (this.state) {
      case 'MENU': this._updateMenu(); break;
      case 'PLAYING': this._updatePlaying(); break;
      case 'EVOLVING': this._updateEvolving(); break;
      case 'GAME_OVER': this._updateGameOver(); break;
    }
  }

  // ---- Menu ----
  _updateMenu() {
    if (this.frame % 10 === 0) {
      this.particles.spawnBubbles(
        Math.random() * CONFIG.WIDTH, CONFIG.HEIGHT,
        1, 2 + Math.random() * 3,
      );
    }
    this.particles.update();
  }

  // ---- Playing ----
  _updatePlaying() {
    if (!this.player) return;
    const p = this.player;

    // Input
    const dir = this.input.getMoveDirection(p.x, p.y);
    const sprint = this.input.isSprinting() || this.input.isKeyDown('shift');
    if (sprint && p.sprintCd <= 0) {
      p.sprintCd = 3;
    }

    // Update mouse position for abilities
    this.mouseX = this.input.mouseX || p.x;
    this.mouseY = this.input.mouseY || p.y;

    // ---- 拟态伪装状态更新 ----
    this._updateCamouflageState(p, dir);

    // ---- 海啸冲锋移动 ----
    if (this.chargeActive > 0) {
      this._updateCharge(p);
    } else {
      const speed = p.getEffectiveSpeed() * (sprint ? 1.6 : 1);
      p.x += dir.x * speed;
      p.y += dir.y * speed;
    }

    // Keep in bounds
    p.x = Math.max(p.size, Math.min(CONFIG.WIDTH - p.size, p.x));
    p.y = Math.max(p.size, Math.min(CONFIG.HEIGHT - p.size, p.y));

    // Angle towards movement
    if (dir.x !== 0 || dir.y !== 0) {
      p.targetAngle = Math.atan2(dir.y, dir.x);
    }

    p.update();

    // Spawn prey
    this.spawnTimer++;
    if (this.spawnTimer >= this.diffConfig.spawnRate) {
      this.spawnTimer = 0;
      this._spawnPrey();
    }

    // Bubble ambiance from player
    if (this.frame % 15 === 0) {
      this.particles.spawnBubbles(
        p.x + (Math.random() - 0.5) * 20,
        p.y + (Math.random() - 0.5) * 15,
        1, 1.5 + Math.random() * 2,
      );
    }

    // Random background bubbles
    if (this.frame % 30 === 0) {
      this.particles.spawnBubbles(
        Math.random() * CONFIG.WIDTH, CONFIG.HEIGHT - 10,
        1, 2 + Math.random() * 3,
      );
    }

    // Update prey (with player hidden state)
    const playerHidden = this.camouflageState === 'hidden';
    for (const prey of this.preyList) {
      if (prey.alive) {
        prey._playerHidden = playerHidden;
        // 暴君威压减速
        let speedMul = 1;
        if (this.tyrantAuraActive > 0 && prey.edible) {
          speedMul = 0.5;
        }
        prey.speed = prey.baseSpeed * speedMul;
        prey.update(p.x, p.y, p.size, this.bounds, p.form);
      }
    }

    // Clean up dead prey
    this.preyList = this.preyList.filter(prey => prey.alive);

    // ---- Collision detection ----
    for (const prey of this.preyList) {
      if (!prey.alive) continue;

      // AI 盟友自动吃猎物
      if (prey.isAlly && prey.edible !== undefined) {
        //  allies eat nearby prey automatically
        for (const target of this.preyList) {
          if (!target.alive || !target.edible || target.isAlly) continue;
          if (circlesOverlap(prey.x, prey.y, prey.size * 0.8, target.x, target.y, target.size * 0.5)) {
            p.addScore(Math.floor(target.value * 0.5)); // ally gives half points
            this.particles.spawnEatEffect(target.x, target.y, target.type.color);
            target.alive = false;
            this.collection.recordEat();
            this.totalEaten++;
            this._checkEvolution();
          }
        }
        continue;
      }

      // Check eat collision (海啸冲锋时秒杀)
      if (prey.edible && (
        (this.chargeActive > 0) ||
        checkEatCollision(p, prey)
      )) {
        const isBoss = prey.size >= 35;
        let scoreVal = prey.value;

        // 狂暴撕咬
        if (p.bonus.hasFrenzy && prey.size > p.size * 0.6) {
          scoreVal = Math.floor(scoreVal * 1.5);
          this.screenFlashRed = 8;
        }

        p.addScore(scoreVal);
        p.totalEaten = (p.totalEaten || 0) + 1;
        p.combo = (p.combo || 0) + 1;

        p.heal(0.5);

        this.particles.spawnEatEffect(prey.x, prey.y, prey.type.color);
        this.particles.spawnScorePopup(prey.x, prey.y - 10, `+${scoreVal}`,
          isBoss ? '#ff8844' : '#ffdd44');

        prey.alive = false;

        this.collection.recordEat();
        this.totalEaten++;
        this.audio.playEat();

        this._checkEvolution();

        // 拟态伪装攻击后结束
        if (this.camouflageState === 'striking') {
          this.camouflageState = 'off';
          this.camouflageTimer = 30;
          p.camouflageAlpha = 1.0;
        }

        continue;
      }

      // Check damage collision
      if (!prey.edible && checkDamageCollision(p, prey)) {
        const dmg = this.diffConfig.enemyDamage;
        const result = p.takeDamage(dmg);

        if (result === 'blocked') {
          // 气泡护盾成功
          this.bubbleShieldReady = false;
          prey.stunned = true;
          prey.stunTimer = 60; // 1s
          this.particles.spawnBubbleShieldParticles(p.x, p.y);
          this.audio.playAbility();
          this.screenShake = 3;
        } else if (result === true) {
          // dead
          this._gameOver();
          return;
        } else {
          this.particles.spawnDamageEffect(prey.x, prey.y);
          this.screenShake = 5;
          this.audio.playHurt();
        }

        if (!prey.harmful) {
          prey.alive = false;
        }
      }
    }

    // Attract ability
    if (p.bonus.hasAttract) {
      for (const prey of this.preyList) {
        if (!prey.alive || !prey.edible || prey.isAlly) continue;
        if (checkAttractRange(p, prey)) {
          const dx = p.x - prey.x;
          const dy = p.y - prey.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            prey.x += (dx / dist) * 0.8;
            prey.y += (dy / dist) * 0.8;
          }
        }
      }
    }

    // ---- 能力特效更新 ----
    this._updateAbilityEffects(p);

    // Shockwave visual
    if (this.shockwaveActive > 0) {
      this.shockwaveActive--;
      this.shockwaveRadius += 8;
    }

    // Screen shake decay
    if (this.screenShake > 0) this.screenShake--;

    // Screen flash decay
    if (this.screenFlashRed > 0) this.screenFlashRed--;
    if (this.screenFlashWhite > 0) this.screenFlashWhite--;

    // Evolution flash decay
    if (this.evoFlash > 0) this.evoFlash--;
    if (this.evoTextTimer > 0) this.evoTextTimer--;

    // Combo decay
    if (p.combo > 0 && this.frame % 120 === 0) {
      p.combo = Math.max(0, p.combo - 1);
    }
    this.collection.recordCombo(p.combo || 0);

    // Echo locate visual targets
    if (p.bonus.hasEchoLocate) {
      this.echoTargets = this.preyList
        .filter(prey => prey.alive && prey.edible && !prey.isAlly)
        .sort((a, b) => {
          const da = (a.x - p.x) ** 2 + (a.y - p.y) ** 2;
          const db = (b.x - p.x) ** 2 + (b.y - p.y) ** 2;
          return da - db;
        })
        .slice(0, 3);
    }

    // ---- 能力特效粒子 ----
    this._updateAbilityParticles(p);

    // Update particles
    this.particles.update();

    // Update vortex effects
    for (let i = this.vortexEffects.length - 1; i >= 0; i--) {
      this.vortexEffects[i].timer--;
      if (this.vortexEffects[i].timer <= 0) {
        this.vortexEffects.splice(i, 1);
      } else {
        this.particles.spawnVortexParticles(
          this.vortexEffects[i].x,
          this.vortexEffects[i].y,
          this.vortexEffects[i].radius,
        );
        // Pull prey toward vortex
        const v = this.vortexEffects[i];
        for (const prey of this.preyList) {
          if (!prey.alive || !prey.edible || prey.isAlly) continue;
          if (isInRadius(v.x, v.y, v.radius, prey.x, prey.y)) {
            const dx = v.x - prey.x;
            const dy = v.y - prey.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 5) {
              prey.x += (dx / dist) * 2;
              prey.y += (dy / dist) * 2;
            }
          }
        }
      }
    }
  }

  // ---- 拟态伪装状态机（仅 Mosasaurus 形态可用） ----
  _updateCamouflageState(player, moveDir) {
    if (!player.bonus.hasCamouflage || player.form !== 'mosasaurus') {
      this.camouflageState = 'off';
      player.camouflageAlpha = 1.0;
      return;
    }

    switch (this.camouflageState) {
      case 'off':
        // 等待激活（在 _tryActivateAbility 中设置 'hiding'）
        break;
      case 'hiding':
        this.camouflageTimer--;
        player.camouflageAlpha = Math.max(0.3, 1 - (1 - this.camouflageTimer / 120) * 0.7);
        if (this.camouflageTimer <= 0) {
          this.camouflageState = 'hidden';
          player.camouflageAlpha = 0.3;
        }
        // 移动则取消
        if (Math.abs(moveDir.x) > 0.1 || Math.abs(moveDir.y) > 0.1) {
          this.camouflageState = 'off';
          player.camouflageAlpha = 1.0;
        }
        break;
      case 'hidden':
        player.camouflageAlpha = 0.3;
        // 移动则进入攻击状态
        if (Math.abs(moveDir.x) > 0.1 || Math.abs(moveDir.y) > 0.1) {
          this.camouflageState = 'striking';
          this.camouflageTimer = 60; // 1s 攻击窗口
          this.particles.spawnCamouflageParticles(player.x, player.y, player.size);
        }
        break;
      case 'striking':
        this.camouflageTimer--;
        player.camouflageAlpha = Math.min(1.0, player.camouflageAlpha + 0.02);
        if (this.camouflageTimer <= 0) {
          this.camouflageState = 'off';
          player.camouflageAlpha = 1.0;
        }
        break;
    }
  }

  // ---- 能力效果更新 ----
  _updateAbilityEffects(player) {
    // 深海烈焰
    if (this.flameActive > 0) {
      this.flameActive--;
      this.flameAngle = Math.atan2(this.flameTarget.y - player.y, this.flameTarget.x - player.x);

      this.flameDamageTimer++;
      if (this.flameDamageTimer >= 60) { // 每秒伤害一次
        this.flameDamageTimer = 0;
        for (const prey of this.preyList) {
          if (!prey.alive || !prey.edible || prey.isAlly) continue;
          if (checkFlamePath(player.x, player.y, this.flameAngle, 200, 30, prey.x, prey.y)) {
            prey.fireDamage += 1;
            prey.fireTimer = 120;
          }
        }
      }

      // 火焰粒子
      for (let i = 0; i < 2; i++) {
        this.particles.spawnFlameParticles(player.x, player.y, this.flameAngle, 200);
      }
    }

    // 海啸冲锋
    if (this.chargeActive > 0) {
      this.chargeActive--;
      this.particles.spawnChargeTrail(player.x, player.y, this.chargeAngle);

      // 撞墙检测
      if (player.x <= player.size || player.x >= CONFIG.WIDTH - player.size ||
          player.y <= player.size || player.y >= CONFIG.HEIGHT - player.size) {
        this.chargeActive = 0;
      }
    }

    // 深渊之歌
    if (this.abyssSongActive > 0) {
      this.abyssSongActive--;
      // 标记猎物为混乱
      for (const prey of this.preyList) {
        if (prey.alive && prey.edible && !prey.isAlly && getDistance(player.x, player.y, prey.x, prey.y) < 500) {
          prey.confused = true;
          prey.confusedTimer = this.abyssSongActive;
        }
      }
    }

    // 暴君威压
    if (this.tyrantAuraActive > 0) {
      this.tyrantAuraActive--;
      if (this.frame % 3 === 0) {
        this.particles.spawnTyrantAuraParticles(player.x, player.y, this.frame);
      }
    }

    // 远古之力
    if (this.ancientPowerActive > 0) {
      this.ancientPowerActive--;
      if (this.frame % 5 === 0) {
        this.particles.spawnAncientPowerParticles(player.x, player.y, player.size);
      }
    }

    // 远古甲胄
    if (this.ancientArmorActive > 0) {
      this.ancientArmorActive--;
      if (this.frame % 5 === 0) {
        this.particles.spawnAncientArmorParticles(player.x, player.y, player.size);
      }
    }

    // 深渊巨口
    if (this.abyssMawActive > 0) {
      this.abyssMawActive--;
    }

    // 涡流牵引
    if (this.vortexPullActive > 0) {
      this.vortexPullActive--;
      for (const prey of this.preyList) {
        if (!prey.alive || !prey.edible || prey.isAlly) continue;
        const dist = getDistance(player.x, player.y, prey.x, prey.y);
        if (dist < 300 && dist > 10) {
          const dx = player.x - prey.x;
          const dy = player.y - prey.y;
          const pull = 3 * (1 - dist / 300);
          prey.x += (dx / dist) * pull;
          prey.y += (dy / dist) * pull;
        }
      }
    }

    // 气泡护盾就绪标记（key 必须与 config 一致：bubbleShield）
    if (player.bonus.hasBubbleShield && !player.cooldowns['bubbleShield']) {
      this.bubbleShieldReady = true;
    } else {
      this.bubbleShieldReady = false;
    }
  }

  // ---- 能力粒子效果 ----
  _updateAbilityParticles(player) {
    // 嗜血粒子
    if (player.bonus.hasBloodlust && player.hp / player.maxHp <= 0.3) {
      if (this.frame % 3 === 0) {
        this.particles.spawnBloodlustParticles(player.x, player.y, player.size);
      }
    }

    // 回声定位
    if (player.bonus.hasEchoLocate && this.frame % 15 === 0) {
      this.particles.spawnEchoLocateParticles(player.x, player.y);
    }
  }

  // ---- 键盘事件 - 能力激活 ----
  _onKeyDown(e) {
    if (this.state !== 'PLAYING' || !this.player) return;

    const key = e.key.toLowerCase();
    if (key === 'e' || key === 'E') {
      this._tryActivateAbility();
    }
  }

  // ---- 尝试激活专属能力 ----
  _tryActivateAbility() {
    const p = this.player;
    if (!p) return;

    const formAbilities = p.getFormAbilities();
    if (formAbilities.length === 0) return;

    // 过滤出可主动激活的能力（有 cooldown 且非纯被动）
    const activeAbilities = formAbilities.filter(ab => {
      if (!ab.cooldown) return false;
      if (ab.id === 'bubbleShield' || ab.id === 'frenzy' || ab.id === 'echoLocate') return false;
      return true;
    });

    if (activeAbilities.length === 0) return;

    // 如果有多个能力，显示选择 UI
    if (activeAbilities.length > 1) {
      this._showAbilitySelector(activeAbilities, p);
      return;
    }

    // 只有一个能力，直接激活
    const ab = activeAbilities[0];
    if (p.cooldowns[ab.id] && p.cooldowns[ab.id] > 0) {
      // 冷却中，显示提示
      const cdSec = Math.ceil(p.cooldowns[ab.id] / 60);
      this.particles.spawnScorePopup(p.x, p.y - 30, `⏳ ${cdSec}s`, '#888888');
      return;
    }

    this._activateSingleAbility(ab, p);
  }

  // ---- 显示能力选择面板 ----
  _showAbilitySelector(abilities, player) {
    // 找到第一个不在冷却中的能力
    const available = abilities.filter(ab => !player.cooldowns[ab.id] || player.cooldowns[ab.id] <= 0);
    const onCooldown = abilities.filter(ab => player.cooldowns[ab.id] && player.cooldowns[ab.id] > 0);

    if (available.length === 0) {
      // 全部冷却中，显示冷却信息
      const cdInfo = onCooldown.map(ab => {
        const cd = Math.ceil(player.cooldowns[ab.id] / 60);
        return `${ab.icon}${cd}s`;
      }).join(' ');
      this.particles.spawnScorePopup(player.x, player.y - 30, `⏳ ${cdInfo}`, '#888888');
      return;
    }

    // 循环使用可用的能力（优先使用上次没用过的）
    const lastUsed = this._lastAbilityUsed || '';
    let chosen = available.find(ab => ab.id !== lastUsed) || available[0];
    this._lastAbilityUsed = chosen.id;

    // 显示能力名称 + 冷却信息（M-5 修复：让玩家知道下一个是什么）
    const nextCd = available.length > 1
      ? available.filter(a => a.id !== chosen.id).map(a => {
          if (player.cooldowns[a.id]) return `${a.icon}${Math.ceil(player.cooldowns[a.id]/60)}s`;
          return `${a.icon}就绪`;
        }).join(' ')
      : '';
    const label = `${chosen.icon} ${chosen.name}${nextCd ? ' | ' + nextCd : ''}`;
    this.particles.spawnScorePopup(player.x, player.y - 30, label, '#44ddff');

    this._activateSingleAbility(chosen, player);
  }

  // ---- 激活单个能力 ----
  _activateSingleAbility(ability, player) {
    const cdFrames = ability.cooldown * 60;
    player.cooldowns[ability.id] = cdFrames;
    this.audio.playAbility();

    this._executeAbility(ability.id, player);

    // 记录使用
    const isNew = this.collection.useAbility(ability.id, player.form);
    if (isNew) {
      this.particles.spawnScorePopup(player.x, player.y - 50, '🆕 新能力!', '#44ddff');
    }
  }

  // ---- 执行能力效果 ----
  _executeAbility(abilityId, player) {
    switch (abilityId) {
      case 'shockwave':
        this.shockwaveActive = 40;
        this.shockwaveRadius = 0;
        this.screenShake = 10;
        for (const prey of this.preyList) {
          if (!prey.alive || prey.edible || prey.isAlly) continue;
          if (checkShockwaveRange(player, prey)) {
            prey.stunned = true;
            prey.stunTimer = 120; // 2s
          }
        }
        break;

      case 'bloodlust':
        // 被动能力，但按E可以强制触发5秒狂暴
        player.activeEffects.bloodlust = 300; // 5s
        player.bloodlustActive = true;
        this.screenFlashRed = 15;
        this.particles.spawnBloodlustParticles(player.x, player.y, player.size * 2);
        break;

      case 'frenzy':
        // 被动能力，持续增强下一次吞食
        player.activeEffects.frenzyBoost = 300;
        this.particles.spawnScorePopup(player.x, player.y - 20, '🦈 撕咬强化!', '#ff4444');
        break;

      case 'packHunt': {
        // 召唤2个AI虎鲸
        const dur = (ABILITIES.packHunt.duration || 15) * 60;
        for (let i = 0; i < 2; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 60 + Math.random() * 40;
          const allyType = PREY_TYPES.find(t => t.id === 'turtle');
          const ally = new Prey(
            player.x + Math.cos(angle) * dist,
            player.y + Math.sin(angle) * dist,
            { ...allyType, size: player.size * 0.4, value: 0, speed: 3, color: '#1a1a2e' },
            this.diffConfig,
          );
          ally.isAlly = true;
          ally.allyOwner = player;
          ally.allyLifetime = dur;
          ally.edible = false;
          ally.harmful = false;
          ally.aggroDistance = 0;
          this.preyList.push(ally);
        }
        this.particles.spawnAllyAppearParticles(player.x, player.y);
        break;
      }

      case 'tailSlam': {
        this.screenShake = 8;
        for (const prey of this.preyList) {
          if (!prey.alive || prey.isAlly) continue;
          if (checkTailSlamRange(player, prey)) {
            const dx = prey.x - player.x;
            const dy = prey.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            prey.knockback = {
              x: (dx / dist) * 15,
              y: (dy / dist) * 15,
              timer: 30,
            };
            prey.stunned = true;
            prey.stunTimer = 90; // 1.5s
          }
        }
        this.particles.spawnTailWhipParticles(player.x, player.y);
        break;
      }

      case 'echoLocate':
        // 被动能力 - 已内置
        this.particles.spawnEchoLocateParticles(player.x, player.y);
        break;

      case 'vortex': {
        // 在鼠标位置生成漩涡
        const vx = this.mouseX;
        const vy = this.mouseY;
        this.vortexEffects.push({
          x: vx, y: vy,
          timer: 180, // 3s
          radius: 80,
        });
        this.particles.spawnVortexParticles(vx, vy, 80);
        break;
      }

      case 'camouflage':
        // 开始隐身倒计时
        this.camouflageState = 'hiding';
        this.camouflageTimer = 120; // 2s 静止后隐身
        player.camouflageAlpha = 1.0;
        break;

      case 'ancientPower':
        this.ancientPowerActive = (ABILITIES.ancientPower.duration || 8) * 60;
        player.activeEffects.ancientPower = this.ancientPowerActive;
        this.screenFlashWhite = 10;
        break;

      case 'abyssMaw':
        this.abyssMawActive = (ABILITIES.abyssMaw.duration || 5) * 60;
        player.activeEffects.abyssMaw = this.abyssMawActive;
        this.particles.spawnScorePopup(player.x, player.y - 20, '💥 深渊巨口!', '#ff8844');
        break;

      case 'tsunamiCharge':
        this.chargeActive = 60; // 1s
        this.chargeAngle = player.angle || Math.atan2(this.mouseY - player.y, this.mouseX - player.x);
        this.chargeSpeed = player.getEffectiveSpeed() * 4;
        // 冲刺期间快速移动在 _updatePlaying 中处理
        break;

      case 'ancientArmor':
        this.ancientArmorActive = (ABILITIES.ancientArmor.duration || 5) * 60;
        player.activeEffects.ancientArmor = this.ancientArmorActive;
        this.screenFlashWhite = 10;
        break;

      case 'abyssSong':
        this.abyssSongActive = 180; // 3s
        this.particles.spawnAbyssSongParticles(player.x, player.y);
        // 初始混乱标记也限制在 500px 范围内（M-4 修复：与 _updateAbilityEffects 保持一致）
        for (const prey of this.preyList) {
          if (prey.alive && prey.edible && !prey.isAlly && getDistance(player.x, player.y, prey.x, prey.y) < 500) {
            prey.confused = true;
            prey.confusedTimer = 180;
          }
        }
        break;

      case 'vortexPull':
        this.vortexPullActive = 300; // 5s (Story spec: 大范围吸拉猎物5秒)
        break;

      case 'bubbleShield':
        // 被动 - 在 takeDamage 中处理
        this.bubbleShieldReady = true;
        this.particles.spawnBubbleShieldParticles(player.x, player.y);
        break;

      case 'deepFlame':
        this.flameActive = 120; // 2s
        this.flameTarget = { x: this.mouseX, y: this.mouseY };
        this.flameDamageTimer = 0;
        break;

      case 'tailWhip': {
        this.screenShake = 12;
        for (const prey of this.preyList) {
          if (!prey.alive || prey.isAlly) continue;
          if (checkTailWhipRange(player, prey)) {
            const dx = prey.x - player.x;
            const dy = prey.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            // 击飞距离 x3
            prey.knockback = {
              x: (dx / dist) * 25,
              y: (dy / dist) * 25,
              timer: 40,
            };
            prey.stunned = true;
            prey.stunTimer = 60;
          }
        }
        this.particles.spawnTailWhipParticles(player.x, player.y);
        break;
      }

      case 'tyrantAura':
        this.tyrantAuraActive = (ABILITIES.tyrantAura.duration || 5) * 60;
        player.activeEffects.tyrantAura = this.tyrantAuraActive;
        break;
    }

    // 海啸冲锋：首次触发的秒杀检测（实际移动在 _updatePlaying → _updateCharge 中每帧执行）
    if (abilityId === 'tsunamiCharge') {
      // 秒杀当前玩家位置附近猎物（冲刺路径上的猎物在 _updateCharge 中处理）
      for (const prey of this.preyList) {
        if (!prey.alive || !prey.edible || prey.isAlly) continue;
        if (circlesOverlap(player.x, player.y, player.size * 2, prey.x, prey.y, 0)) {
          prey.alive = false;
          p.addScore(prey.value);
          p.totalEaten++;
          this.collection.recordEat();
          this.totalEaten++;
          this.particles.spawnEatEffect(prey.x, prey.y, prey.type.color);
          this._checkEvolution();
        }
      }
    }
  }

  // ---- 海啸冲锋每帧更新 ----
  _updateCharge(player) {
    const speed = this.chargeSpeed;
    player.x += Math.cos(this.chargeAngle) * speed;
    player.y += Math.sin(this.chargeAngle) * speed;

    // 撞墙停止
    if (player.x <= player.size || player.x >= CONFIG.WIDTH - player.size ||
        player.y <= player.size || player.y >= CONFIG.HEIGHT - player.size) {
      this.chargeActive = 0;
      player.x = Math.max(player.size, Math.min(CONFIG.WIDTH - player.size, player.x));
      player.y = Math.max(player.size, Math.min(CONFIG.HEIGHT - player.size, player.y));
    }

    // 秒杀路径上猎物（用碰撞检测代替固定长度路径检测）
    for (const prey of this.preyList) {
      if (!prey.alive || !prey.edible || prey.isAlly) continue;
      if (circlesOverlap(player.x, player.y, player.size * 0.8, prey.x, prey.y, prey.size * 0.3)) {
        prey.alive = false;
        player.addScore(prey.value);
        player.totalEaten++;
        this.collection.recordEat();
        this.totalEaten++;
        this.particles.spawnEatEffect(prey.x, prey.y, prey.type.color);
        this._checkEvolution();
      }
    }
  }

  _checkEvolution() {
    if (!this.player || !this.diffConfig) return;
    const result = checkEvolutionTrigger(this.player, this.diffConfig);

    if (result) {
      if (result.choices) {
        this.formChoices = result.choices;
        this.evoState = { phase: 'formSelect' };
        this.evoFrame = 0;
        this.state = 'EVOLVING';
      } else if (result.form) {
        this.newForm = result.form;
        this.evoState = { phase: 'transition' };
        this.evoFrame = 0;
        this.state = 'EVOLVING';
      }
    }
  }

  // ---- Evolving ----
  _updateEvolving() {
    this.evoFrame++;

    if (!this.evoState) return;

    switch (this.evoState.phase) {
      case 'formSelect':
        break;

      case 'transition':
        if (this.evoFrame > 80) {
          this.player.evolveTo(this.newForm);
          this.player.evolutionCount = (this.player.evolutionCount || 0) + 1;
          this.particles.spawnEvolutionEffect(this.player.x, this.player.y);
          this.screenShake = 15;
          this.evoFlash = 40;
          this.evoTextTimer = 80;
          this.evoNewFormName = EVOLUTION_FORMS[this.newForm].name;
          this.audio.playEvolve();

          // 记录新形态发现
          this.collection.discoverForm(this.newForm, this.player.totalScore);
          this.collection.recordEvolution();

          // Generate ability choices
          this.abilityChoices = generateAbilityChoices(this.player, this.newForm);

          if (this.abilityChoices.length > 0) {
            this.evoState = { phase: 'abilitySelect' };
            this.evoFrame = 0;
          } else {
            this.state = 'PLAYING';
            this.evoState = null;
          }
        }
        break;

      case 'abilitySelect':
        if (this.evoFrame > 600) {
          this._applyAbilityChoice(this.abilityChoices[0]);
        }
        break;
    }

    if (this.evoFrame % 5 === 0) {
      this.particles.spawnBubbles(
        Math.random() * CONFIG.WIDTH, CONFIG.HEIGHT,
        1, 2 + Math.random() * 3,
      );
    }
    this.particles.update();
  }

  _applyAbilityChoice(abilityId) {
    if (!abilityId || !this.player) return;
    applyAbility(this.player, abilityId);
    this.state = 'PLAYING';
    this.evoState = null;
  }

  _applyFormChoice(formId) {
    if (!formId || !this.player) return;
    this.newForm = formId;
    this.evoState = { phase: 'transition' };
    this.evoFrame = 0;
  }

  // ---- Game Over ----
  _gameOver() {
    this.state = 'GAME_OVER';
    this.player.totalEaten = this.totalEaten || 0;
    this.audio.playDeath();
    this.audio.stopBGM();

    // 保存全局图鉴（跨局持久化）
    this.collection.saveGlobalForms(Object.keys(this.collection.formsDiscovered));
    this.collection.saveGlobalAbilities(Object.keys(this.collection.abilitiesUsed));
    // 最高分由 drawGameOver 负责保存和展示，此处不保存
  }

  _updateGameOver() {
    this.particles.update();
  }

  // ============ 渲染 ============

  _render() {
    const ctx = this.ctx;
    ctx.save();

    // Screen shake offset
    const shakeX = this.screenShake > 0 ? (Math.random() - 0.5) * 8 : 0;
    const shakeY = this.screenShake > 0 ? (Math.random() - 0.5) * 8 : 0;
    ctx.translate(shakeX, shakeY);

    // Background
    this.renderer.drawBackground(this.frame);

    // Decorations
    this.renderer.drawDecorations(this.frame);

    if (this.state === 'PLAYING' || this.state === 'EVOLVING' || this.state === 'GAME_OVER') {
      // Draw prey (non-edible behind edible)
      for (const prey of this.preyList) {
        if (prey.alive && !prey.edible && !prey.isAlly) {
          this.renderer.drawPrey(prey);
        }
      }

      for (const prey of this.preyList) {
        if (prey.alive && prey.edible) {
          // Echo locate highlight
          if (this.player && this.player.bonus.hasEchoLocate &&
              this.echoTargets && this.echoTargets.includes(prey)) {
            ctx.save();
            const pulse = 0.3 + 0.2 * Math.sin(this.frame * 0.1);
            ctx.strokeStyle = `rgba(255, 255, 100, ${pulse})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(prey.x, prey.y, prey.size + 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
          this.renderer.drawPrey(prey);
        }
      }

      // Draw allies
      for (const prey of this.preyList) {
        if (prey.alive && prey.isAlly) {
          this.renderer.drawPrey(prey);
          // 盟友标识
          ctx.save();
          ctx.fillStyle = 'rgba(100, 200, 255, 0.6)';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('🐋', prey.x, prey.y - prey.size - 5);
          ctx.restore();
        }
      }

      // Draw player
      if (this.player) {
        this.renderer.drawPlayer(this.player, this);
      }

      // ---- v2 能力视觉特效 ----

      // Shockwave effect
      if (this.shockwaveActive > 0) {
        ctx.save();
        ctx.strokeStyle = `rgba(200, 230, 255, ${this.shockwaveActive / 40 * 0.5})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, this.shockwaveRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Vortex effects
      for (const v of this.vortexEffects) {
        const alpha = v.timer / 180;
        ctx.save();
        ctx.strokeStyle = `rgba(68, 136, 255, ${alpha * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(v.x, v.y, v.radius * (1 - alpha * 0.3), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 深海烈焰
      if (this.flameActive > 0 && this.player) {
        ctx.save();
        ctx.translate(this.player.x, this.player.y);
        ctx.rotate(this.flameAngle);
        // 火焰锥
        const flameGrad = ctx.createLinearGradient(0, 0, 200, 0);
        flameGrad.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
        flameGrad.addColorStop(0.5, 'rgba(255, 200, 0, 0.4)');
        flameGrad.addColorStop(1, 'rgba(255, 60, 0, 0)');
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(200, -20);
        ctx.quadraticCurveTo(210, 0, 200, 20);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 远古之力发光
      if (this.ancientPowerActive > 0 && this.player) {
        ctx.save();
        const glow = 0.3 + 0.2 * Math.sin(this.frame * 0.1);
        ctx.shadowBlur = 25;
        ctx.shadowColor = `rgba(255, 221, 68, ${glow})`;
        ctx.restore();
      }

      // 远古甲胄金色光晕
      if (this.ancientArmorActive > 0 && this.player) {
        ctx.save();
        const a = 0.2 + 0.1 * Math.sin(this.frame * 0.08);
        ctx.strokeStyle = `rgba(255, 204, 68, ${a})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, this.player.size * 0.9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 暴君威压波纹
      if (this.tyrantAuraActive > 0 && this.player) {
        ctx.save();
        const a = 0.1 + 0.05 * Math.sin(this.frame * 0.05);
        ctx.strokeStyle = `rgba(255, 80, 80, ${a})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, 60 + Math.sin(this.frame * 0.1) * 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 涡流牵引范围
      if (this.vortexPullActive > 0 && this.player) {
        ctx.save();
        const a = 0.1 + 0.05 * Math.sin(this.frame * 0.08);
        ctx.strokeStyle = `rgba(68, 136, 255, ${a})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, 300, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 气泡护盾
      if (this.bubbleShieldReady && this.player) {
        ctx.save();
        const a = 0.15 + 0.1 * Math.sin(this.frame * 0.06);
        ctx.strokeStyle = `rgba(180, 220, 255, ${a})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, this.player.size * 1.1, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Attract range visual (subtle)
      if (this.player && this.player.bonus.hasAttract) {
        ctx.save();
        ctx.fillStyle = 'rgba(100, 200, 255, 0.03)';
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, this.player.size * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Particles
      this.renderer.drawParticles(this.particles);

      // 屏幕闪红
      if (this.screenFlashRed > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 0, 0, ${this.screenFlashRed / 30})`;
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
        ctx.restore();
      }

      // 屏幕闪白
      if (this.screenFlashWhite > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${this.screenFlashWhite / 30})`;
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
        ctx.restore();
      }
    }

    ctx.restore();

    // UI overlay (no shake)
    switch (this.state) {
      case 'MENU':
        this.ui.drawMenu(this.frame);
        break;
      case 'PLAYING':
        if (this.player) this.ui.drawHUD(this.player, this.frame);
        // v2 能力栏
        if (this.player) this._drawAbilityBar(this.player);
        break;
      case 'EVOLVING':
        if (this.player) {
          if (this.evoState.phase === 'formSelect') {
            this.ui.drawEvolutionScreen(this.frame, this.player, {
              type: 'form',
              choices: this.formChoices,
            });
          } else if (this.evoState.phase === 'abilitySelect') {
            this.ui.drawEvolutionScreen(this.frame, this.player, {
              type: 'ability',
              choices: this.abilityChoices,
            });
          } else if (this.evoState.phase === 'transition') {
            this._drawEnhancedEvolutionTransition();
          }
          this.ui.drawHUD(this.player, this.frame);
          // v2 能力栏（进化中也显示）
          this._drawAbilityBar(this.player);
        }
        break;
      case 'GAME_OVER':
        this.renderer.drawBackground(this.frame);
        this.renderer.drawDecorations(this.frame);
        this.renderer.drawParticles(this.particles);
        if (this.player) this.ui.drawGameOver(this.player, this.frame, this.collection);
        break;
    }
  }

  // ---- v2 进化过渡增强动画 ----
  _drawEnhancedEvolutionTransition() {
    const ctx = this.ctx;
    const frame = this.evoFrame;
    const formData = EVOLUTION_FORMS[this.newForm];

    // 白色闪光
    if (frame < 20) {
      const alpha = (20 - frame) / 20;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
      ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    }

    // 渐变到玩家新形态颜色
    if (frame >= 15 && frame < 50) {
      const alpha = 0.15;
      ctx.fillStyle = formData.color + '22';
      ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    }

    // EVOLUTION! 文字动画
    if (frame > 15) {
      ctx.save();
      const scale = frame < 30 ? 1 + (30 - frame) * 0.05 : 1;
      const alpha = Math.min((frame - 15) / 10, 1);
      ctx.globalAlpha = alpha;
      ctx.translate(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 30);
      ctx.scale(scale, scale);

      ctx.shadowBlur = 30;
      ctx.shadowColor = '#ffdd44';
      ctx.fillStyle = '#ffdd44';
      ctx.font = 'bold 48px Arial, "PingFang SC"';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ EVOLUTION!', 0, 0);
      ctx.restore();

      // 新形态名称
      ctx.save();
      const nameAlpha = Math.max(0, (frame - 25) / 15);
      ctx.globalAlpha = nameAlpha;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px Arial, "PingFang SC"';
      ctx.textAlign = 'center';
      ctx.fillText(formData.name, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 20);
      ctx.fillStyle = 'rgba(180, 220, 255, 0.5)';
      ctx.font = '16px Arial';
      ctx.fillText(formData.english, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 45);
      ctx.fillStyle = 'rgba(180, 220, 255, 0.4)';
      ctx.font = '14px Arial, "PingFang SC"';
      ctx.fillText(formData.desc, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 70);
      ctx.restore();
    }

    // 粒子爆发
    if (this.player && frame % 3 === 0 && frame < 60) {
      this.particles.spawnEvolutionEffect(this.player.x, this.player.y);
    }
  }

  // ---- v2 能力栏 ----
  _drawAbilityBar(player) {
    const ctx = this.ctx;
    const formAbilities = player.getFormAbilities();
    if (formAbilities.length === 0) return;

    const barY = CONFIG.HEIGHT - 65;
    const iconSize = 44;
    const gap = 12;
    const totalW = formAbilities.length * iconSize + (formAbilities.length - 1) * gap;
    const startX = (CONFIG.WIDTH - totalW) / 2;

    // 背景面板
    ctx.save();
    ctx.fillStyle = 'rgba(8, 20, 48, 0.7)';
    const padX = 15;
    const padY = 8;
    const panelX = startX - padX;
    const panelY = barY - padY;
    const panelW = totalW + padX * 2;
    const panelH = iconSize + padY * 2;
    this.ui.roundRect(ctx, panelX, panelY, panelW, panelH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(60, 140, 220, 0.3)';
    ctx.lineWidth = 1;
    this.ui.roundRect(ctx, panelX, panelY, panelW, panelH, 12);
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i < formAbilities.length; i++) {
      const ab = formAbilities[i];
      const cx = startX + i * (iconSize + gap);
      const cy = barY;
      const cdKey = ab.id;
      const cdRemaining = player.cooldowns[cdKey] || 0;
      const cdTotal = (ab.cooldown || 30) * 60;
      const isOnCD = cdRemaining > 0;

      // 图标背景
      ctx.save();
      if (isOnCD) {
        ctx.fillStyle = 'rgba(40, 40, 60, 0.6)';
      } else {
        ctx.fillStyle = 'rgba(30, 60, 120, 0.4)';
      }
      this.ui.roundRect(ctx, cx, cy, iconSize, iconSize, 8);
      ctx.fill();

      if (!isOnCD) {
        ctx.strokeStyle = 'rgba(60, 180, 255, 0.5)';
        ctx.lineWidth = 1.5;
        this.ui.roundRect(ctx, cx, cy, iconSize, iconSize, 8);
        ctx.stroke();
      }
      ctx.restore();

      // 图标 emoji
      ctx.save();
      ctx.font = '22px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (isOnCD) ctx.globalAlpha = 0.4;
      ctx.fillText(ab.icon, cx + iconSize / 2, cy + iconSize / 2);
      ctx.restore();

      // CD 遮罩 + 倒计时
      if (isOnCD) {
        const cdRatio = cdRemaining / cdTotal;
        ctx.save();
        // 灰色覆盖
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ui.roundRect(ctx, cx, cy, iconSize, iconSize, 8);
        ctx.fill();
        // CD 进度条（从底部向上）
        ctx.fillStyle = 'rgba(60, 140, 220, 0.3)';
        ctx.fillRect(cx + 2, cy + iconSize - 2 - (iconSize - 4) * cdRatio, iconSize - 4, (iconSize - 4) * cdRatio);
        // 倒计时数字
        const cdSeconds = Math.ceil(cdRemaining / 60);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 0.9;
        ctx.fillText(cdSeconds, cx + iconSize / 2, cy + iconSize / 2);
        ctx.restore();
      }

      // 能力名称
      ctx.save();
      ctx.fillStyle = 'rgba(180, 220, 255, 0.5)';
      ctx.font = '9px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(ab.name, cx + iconSize / 2, cy - 3);
      ctx.restore();
    }

    // E 键提示
    ctx.save();
    ctx.fillStyle = 'rgba(180, 220, 255, 0.3)';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('[E] 激活能力', CONFIG.WIDTH / 2, barY + iconSize + 14);
    ctx.restore();
  }

  // ============ UI 事件处理 ============

  _getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (CONFIG.WIDTH / rect.width),
      y: (e.clientY - rect.top) * (CONFIG.HEIGHT / rect.height),
    };
  }

  _onClick(e) {
    const pos = this._getMousePos(e);
    const result = this.ui.handleClick(pos.x, pos.y, this.state, this.player, this.evoState);

    if (result) {
      switch (result.action) {
        case 'startGame':
          this.startGame(result.difficulty);
          break;
        case 'selectEvolution':
          if (this.evoState) {
            if (this.evoState.phase === 'formSelect') {
              this._applyFormChoice(result.value);
            } else if (this.evoState.phase === 'abilitySelect') {
              this._applyAbilityChoice(result.value);
            }
          }
          break;
        case 'retry':
          this.startGame(this.difficulty);
          break;
        case 'menu':
          this.state = 'MENU';
          break;
      }
    }
  }

  _onMove(e) {
    const pos = this._getMousePos(e);
    this.ui.handleMove(pos.x, pos.y);
  }

  _onTouch(e) {
    e.preventDefault();
    const touch = e.touches[0] || e.changedTouches[0];
    if (!touch) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (CONFIG.WIDTH / rect.width);
    const y = (touch.clientY - rect.top) * (CONFIG.HEIGHT / rect.height);

    const result = this.ui.handleClick(x, y, this.state, this.player, this.evoState);
    if (result) {
      switch (result.action) {
        case 'startGame':
          this.startGame(result.difficulty);
          break;
        case 'selectEvolution':
          if (this.evoState) {
            if (this.evoState.phase === 'formSelect') {
              this._applyFormChoice(result.value);
            } else if (this.evoState.phase === 'abilitySelect') {
              this._applyAbilityChoice(result.value);
            }
          }
          break;
        case 'retry':
          this.startGame(this.difficulty);
          break;
        case 'menu':
          this.state = 'MENU';
          break;
      }
    }
  }
}

// ============ 启动游戏 ============
window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
});
