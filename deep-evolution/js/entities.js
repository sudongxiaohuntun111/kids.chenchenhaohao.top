// ==================== 游戏实体 ====================

class Player {
  constructor(x, y, difficulty) {
    this.x = x;
    this.y = y;
    this.difficulty = difficulty;
    this.diffConfig = DIFFICULTY[difficulty];

    const baseForm = EVOLUTION_FORMS.clownfish;
    this.baseSize = 44;
    this.size = this.baseSize * baseForm.sizeMul;
    this.form = 'clownfish';
    this.evolutionStage = 0;
    this.speed = 2.5;
    this.sprintSpeed = 4.5;
    this.sprintCd = 0;
    this.maxSprintCd = 90;

    this.maxHp = this.diffConfig.initialHp;
    this.hp = this.maxHp;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.score = 0;
    this.totalScore = 0;
    this.evolutionScore = 0; // Score accumulated for next evolution

    this.angle = 0;
    this.targetAngle = 0;
    this.bodyWave = 0;

    this.bonus = {
      eatRange: 0,
      speedMul: 1.0,
      viewRange: 1.0,
      hasAttract: false,
      regen: 0,
      hasShockwave: false,
      hasBloodlust: false,
      hasFrenzy: false,
      hasPackHunt: false,
      hasTailSlam: false,
      hasEchoLocate: false,
      hasVortex: false,
      hasCamouflage: false,
      hasAncientPower: false,
      hasAbyssMaw: false,
      hasTsunamiCharge: false,
      hasAncientArmor: false,
      hasAbyssSong: false,
      hasVortexPull: false,
      hasBubbleShield: false,
      hasDeepFlame: false,
      hasTailWhip: false,
      hasTyrantAura: false,
    };

    this.abilities = []; // { id, level }
    this.cooldowns = {};
    this.activeEffects = {};

    // Animation
    this.eatAnim = 0;
    this.damageFlash = 0;
    this.evolutionFlash = 0;

    // v2 能力状态
    this.camouflageState = 'off'; // 'off' | 'hiding' | 'hidden' | 'striking'
    this.camouflageTimer = 0;
    this.bloodlustActive = false;
    this.abyssMawActive = false;
    this.camouflageAlpha = 1.0;
    this.ancientArmorActive = false;
    this.ancientPowerActive = false;
    this.tyrantAuraActive = false;
    this.tyrantAuraTimer = 0;
    this.bubbleShieldReady = false;
  }

  getFormData() {
    return EVOLUTION_FORMS[this.form];
  }

  getEffectiveSpeed() {
    let base = this.speed * (this.getFormData().speedMul || 1.0) * this.bonus.speedMul;
    // 嗜血狂暴加速
    if (this.bloodlustActive) base *= 2;
    if (this.sprintCd > 0) base *= 1.6;
    return base;
  }

  getEatRange() {
    let range = this.size * 0.7 * (1 + this.bonus.eatRange);
    // 远古之力翻倍
    if (this.ancientPowerActive) range *= 2;
    // 拟态伪装隐身后攻击范围 x3
    if (this.camouflageState === 'striking') range *= 3;
    // 深渊巨口：允许吞更大猎物，效果上是 eatRange 提升
    if (this.abyssMawActive) range *= 1.5;
    return range;
  }

  getMaxEatRatio() {
    // 返回玩家能吃猎物 size / 玩家 size 的最大比例
    // 默认能吃 size <= 玩家 size * 0.8 的鱼
    // 深渊巨口可吃 size <= 玩家 size * 1.2 的鱼
    let ratio = 0.8;
    if (this.abyssMawActive) ratio = 1.2;
    return ratio;
  }

  getViewRange() {
    return this.bonus.viewRange;
  }

  takeDamage(amount) {
    if (this.invincible || this.damageFlash > 0) return false;

    // 远古甲胄免疫
    if (this.ancientArmorActive) return false;

    // 嗜血伤害免疫（低血量狂暴期间）
    if (this.bloodlustActive) return false;

    // 检查气泡护盾
    if (this.bonus.hasBubbleShield && !this.cooldowns['bubbleShield']) {
      this.cooldowns['bubbleShield'] = ABILITIES.bubbleShield.cooldown * 60;
      // 反弹：眩晕攻击者
      return 'blocked';
    }

    this.hp -= amount;
    this.damageFlash = 10;
    if (this.hp <= 0) {
      this.hp = 0;
      return true; // dead
    }
    this.invincible = true;
    this.invincibleTimer = 30;
    return false;
  }

  heal(amount) {
    this.hp = Math.min(this.hp + amount, this.maxHp);
  }

  addScore(amount) {
    // 狂暴撕咬已在 main.js 中处理，此处不再重复叠加
    // 远古之力：吞噬积分翻倍
    if (this.ancientPowerActive) {
      amount *= 2;
    }

    this.score += amount;
    this.totalScore += amount;
    this.evolutionScore += amount;
  }

  evolveTo(formId) {
    const formData = EVOLUTION_FORMS[formId];
    this.form = formId;
    this.evolutionStage = formData.stage;
    this.size = this.baseSize * formData.sizeMul;
    this.hp = this.maxHp; // Full heal on evolution
    this.evolutionScore = 0;
    this.evolutionFlash = 60;
    this.invincible = true;
    this.invincibleTimer = 120;
  }

  update() {
    // Sprint cooldown
    if (this.sprintCd > 0) this.sprintCd--;

    // Invincibility timer
    if (this.invincible) {
      this.invincibleTimer--;
      if (this.invincibleTimer <= 0) this.invincible = false;
    }

    // Animations
    if (this.damageFlash > 0) this.damageFlash--;
    if (this.evolutionFlash > 0) this.evolutionFlash--;
    if (this.eatAnim > 0) this.eatAnim--;

    // Body wave
    this.bodyWave += 0.05;

    // Regen
    if (this.bonus.regen > 0) {
      this.heal(this.bonus.regen * 0.01);
    }

    // Cooldowns
    for (const key in this.cooldowns) {
      if (this.cooldowns[key] > 0) this.cooldowns[key]--;
      else delete this.cooldowns[key];
    }

    // Active effects
    for (const key in this.activeEffects) {
      this.activeEffects[key]--;
      if (this.activeEffects[key] <= 0) delete this.activeEffects[key];
    }

    // Smooth angle
    if (Math.abs(this.angle - this.targetAngle) > 0.05) {
      this.angle += (this.targetAngle - this.angle) * 0.1;
    } else {
      this.angle = this.targetAngle;
    }

    // ---- v2 能力状态更新 ----
    this._updateBloodlust();
    this._updateActiveEffects();
  }

  // 嗜血：HP≤30% 时自动狂暴 + 保护 E 键强制激活覆盖
  _updateBloodlust() {
    if (!this.bonus.hasBloodlust) {
      this.bloodlustActive = false;
      return;
    }
    // 主动激活效果（E 键触发）优先于被动
    if (this.activeEffects.bloodlust && this.activeEffects.bloodlust > 0) {
      this.bloodlustActive = true;
      return;
    }
    const hpRatio = this.hp / this.maxHp;
    this.bloodlustActive = hpRatio <= 0.3;
  }

  // 拟态伪装由 Game._updateCamouflageState() 管理状态机
  // Player 端仅维护 alpha 渲染属性

  // 更新主动效果的标记
  _updateActiveEffects() {
    this.ancientArmorActive = !!this.activeEffects.ancientArmor;
    this.ancientPowerActive = !!this.activeEffects.ancientPower;
    this.tyrantAuraActive = !!this.activeEffects.tyrantAura;
    this.abyssMawActive = !!this.activeEffects.abyssMaw;
  }

  getAbilityLevel(id) {
    const ab = this.abilities.find(a => a.id === id);
    return ab ? ab.level : 0;
  }

  hasAbility(id) {
    return this.getAbilityLevel(id) > 0;
  }

  addAbility(id) {
    const ab = this.abilities.find(a => a.id === id);
    const def = ABILITIES[id];
    if (!def) return;

    if (ab) {
      if (ab.level < def.maxLevel) {
        ab.level++;
        def.apply(this, ab.level);
      }
    } else {
      this.abilities.push({ id, level: 1 });
      def.apply(this, 1);
    }
  }

  // 获取当前形态的专属能力列表
  getFormAbilities() {
    const result = [];
    for (const [id, def] of Object.entries(ABILITIES)) {
      if (!def.general && def.form === this.form) {
        result.push({ id, ...def });
      }
    }
    return result;
  }
}

// ==================== 猎物/敌人 ====================

class Prey {
  constructor(x, y, type, difficultyConfig) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.diffConfig = difficultyConfig;

    this.size = type.size;
    this.value = type.value;
    this.edible = type.edible;
    this.harmful = type.harmful;
    this.baseSpeed = type.speed;

    // Difficulty modifiers
    if (this.edible) {
      this.baseSpeed *= difficultyConfig.preySpeedMul;
    } else {
      this.baseSpeed *= difficultyConfig.enemySpeedMul;
    }

    this.speed = this.baseSpeed;
    this.angle = Math.random() * Math.PI * 2;
    this.targetAngle = this.angle;
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;

    this.alive = true;
    this.bodyWave = Math.random() * Math.PI * 2;
    this.wanderTimer = 0;
    this.wanderInterval = 60 + Math.random() * 120;

    // For harmful creatures (jellyfish, puffer)
    this.pulsePhase = Math.random() * Math.PI * 2;

    // Aggro: only bigger-fish enemies chase player, not jellyfish/puffer
    this.aggroDistance = (!this.edible && !this.harmful) ? difficultyConfig.aggroRange : 0;
    this.stunned = false;
    this.stunTimer = 0;

    // v2 额外状态
    this.confused = false;     // 混乱状态（深渊之歌）
    this.confusedTimer = 0;
    this.vortexTarget = null;  // 被漩涡牵引的目标点
    this.vortexPullSpeed = 0;
    this.fireDamage = 0;       // 火焰持续伤害
    this.fireTimer = 0;
    this.knockback = { x: 0, y: 0, timer: 0 }; // 击退
    this.hp = type.harmful ? 3 : 1; // v2 猎物血量
    this.isAlly = false;       // AI 盟友
    this.allyOwner = null;     // 盟友归属
    this.allyLifetime = 0;     // 盟友剩余生命
  }

  update(playerX, playerY, playerSize, bounds, playerForm) {
    this.bodyWave += 0.03;

    // ---- 火焰伤害 ----
    if (this.fireTimer > 0) {
      this.fireTimer--;
      this.hp -= this.fireDamage * 0.016; // 每秒伤害按帧分配
      if (this.hp <= 0) {
        this.alive = false;
        return;
      }
    }

    // ---- 击退 ----
    if (this.knockback.timer > 0) {
      this.knockback.timer--;
      this.x += this.knockback.x;
      this.y += this.knockback.y;
      this.knockback.x *= 0.9;
      this.knockback.y *= 0.9;
      // 击退期间继续处理眩晕
      if (this.stunned) {
        this.stunTimer--;
        if (this.stunTimer <= 0) this.stunned = false;
      }
      return;
    }

    // Stun
    if (this.stunned) {
      this.stunTimer--;
      if (this.stunTimer <= 0) this.stunned = false;
      // 眩晕期间缓慢移动
      this.x += Math.cos(this.angle) * this.speed * 0.2;
      this.y += Math.sin(this.angle) * this.speed * 0.2;
      return;
    }

    // ---- AI 盟友行为 ----
    if (this.isAlly) {
      this.allyLifetime--;
      if (this.allyLifetime <= 0) {
        this.alive = false;
        return;
      }
      // 跟随玩家并自动吃猎物
      const dx = playerX - this.x;
      const dy = playerY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 80) {
        this.targetAngle = Math.atan2(dy, dx);
        this.speed = this.baseSpeed * 1.5;
      } else {
        this.speed = this.baseSpeed;
        this.wander();
      }
      this._applyMovement(bounds);
      return;
    }

    // ---- 暴君威压：全屏减速 ----
    let speedMul = 1;
    // (在 main.js 中处理)

    // ---- 混乱状态 ----
    if (this.confused) {
      this.confusedTimer--;
      if (this.confusedTimer <= 0) this.confused = false;
      // 随机游动
      this.wander();
      this.speed = this.baseSpeed * 0.5;
      this._applyMovement(bounds);
      return;
    }

    // ---- 漩涡牵引 ----
    if (this.vortexTarget) {
      const dx = this.vortexTarget.x - this.x;
      const dy = this.vortexTarget.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 5 && dist > 0) {
        this.x += (dx / dist) * this.vortexPullSpeed;
        this.y += (dy / dist) * this.vortexPullSpeed;
      }
    }

    // Check aggro towards player (only enemies)
    if (!this.edible && this.aggroDistance > 0) {
      const dx = playerX - this.x;
      const dy = playerY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.aggroDistance && dist > 0) {
        // 拟态伪装隐身时敌人忽略玩家
        if (playerForm === 'mosasaurus' && this._isPlayerHidden()) {
          this.speed = this.baseSpeed;
          this.wander();
        } else {
          this.targetAngle = Math.atan2(dy, dx);
          this.speed = this.baseSpeed * (1 + 0.5 * (1 - dist / this.aggroDistance));
        }
      } else {
        this.speed = this.baseSpeed;
        this.wander();
      }
    } else if (this.edible) {
      // Prey flees from player if too close
      const dx = this.x - playerX;
      const dy = this.y - playerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // 隐身时不逃跑
      if (this._isPlayerHidden()) {
        this.speed = this.baseSpeed;
        this.wander();
      } else if (dist < playerSize * 3 && dist > 0) {
        this.targetAngle = Math.atan2(dy, dx);
        this.speed = this.baseSpeed * 2;
      } else {
        this.speed = this.baseSpeed;
        this.wander();
      }
    }

    this._applyMovement(bounds);
  }

  _isPlayerHidden() {
    // This will be set by main.js
    return this._playerHidden || false;
  }

  _applyMovement(bounds) {
    // Smooth angle
    let angleDiff = this.targetAngle - this.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.angle += angleDiff * 0.05;

    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;

    this.x += this.vx;
    this.y += this.vy;

    // Bounds
    const margin = 50;
    if (this.x < margin) { this.x = margin; this.targetAngle = Math.PI - this.targetAngle; }
    if (this.x > bounds.w - margin) { this.x = bounds.w - margin; this.targetAngle = Math.PI - this.targetAngle; }
    if (this.y < margin) { this.y = margin; this.targetAngle = -this.targetAngle; }
    if (this.y > bounds.h - margin) { this.y = bounds.h - margin; this.targetAngle = -this.targetAngle; }
  }

  wander() {
    this.wanderTimer++;
    if (this.wanderTimer > this.wanderInterval) {
      this.wanderTimer = 0;
      this.wanderInterval = 60 + Math.random() * 120;
      this.targetAngle = this.angle + (Math.random() - 0.5) * Math.PI;
    }
  }

  getPulseSize() {
    return this.size + Math.sin(this.pulsePhase) * 2;
  }

  isEatableBy(player) {
    if (!this.alive) return false;
    if (!this.edible) return false;
    const maxPreySize = player.size * player.getMaxEatRatio();
    return this.size < maxPreySize;
  }

  canDamage(player) {
    if (!this.alive) return false;
    if (this.harmful) return true;
    if (!this.edible && this.size > player.size) return true;
    return false;
  }
}

// ==================== 装饰物 ====================

class Decoration {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 'seaweed', 'shell', 'treasure', 'coral', 'rock'
    this.variant = Math.floor(Math.random() * (DECORATION_TYPES[type]?.variants || 1));
    this.phase = Math.random() * Math.PI * 2;
    this.swaySpeed = 0.01 + Math.random() * 0.02;
    this.swayAmp = 2 + Math.random() * 3;
  }

  update() {
    this.phase += this.swaySpeed;
  }
}
