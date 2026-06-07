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
  }

  getFormData() {
    return EVOLUTION_FORMS[this.form];
  }

  getEffectiveSpeed() {
    const base = this.speed * (this.getFormData().speedMul || 1.0) * this.bonus.speedMul;
    if (this.sprintCd > 0) return base * 1.6;
    return base;
  }

  getEatRange() {
    return this.size * 0.7 * (1 + this.bonus.eatRange);
  }

  getViewRange() {
    return this.bonus.viewRange;
  }

  takeDamage(amount) {
    if (this.invincible || this.damageFlash > 0) return false;

    // Check bubble shield
    if (this.bonus.hasBubbleShield && !this.cooldowns['bubbleShield']) {
      this.cooldowns['bubbleShield'] = 180; // 3 sec CD after block
      return false; // blocked
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
    // Apply frenzy bonus
    if (this.bonus.hasFrenzy && amount >= 5) {
      amount = Math.floor(amount * 1.5);
    }
    // Apply ancient power
    if (this.activeEffects.ancientPower) {
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
  }

  update(playerX, playerY, playerSize, bounds) {
    this.bodyWave += 0.03;

    // Stun
    if (this.stunned) {
      this.stunTimer--;
      if (this.stunTimer <= 0) this.stunned = false;
      return;
    }

    // Check aggro towards player (only enemies)
    if (!this.edible && this.aggroDistance > 0) {
      const dx = playerX - this.x;
      const dy = playerY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.aggroDistance && dist > 0) {
        // Move towards player
        this.targetAngle = Math.atan2(dy, dx);
        this.speed = this.baseSpeed * (1 + 0.5 * (1 - dist / this.aggroDistance));
      } else {
        this.speed = this.baseSpeed;
        this.wander();
      }
    } else if (this.edible) {
      // Prey flees from player if too close
      const dx = this.x - playerX;
      const dy = this.y - playerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < playerSize * 3 && dist > 0) {
        this.targetAngle = Math.atan2(dy, dx);
        this.speed = this.baseSpeed * 2;
      } else {
        this.speed = this.baseSpeed;
        this.wander();
      }
    }

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
    // For jellyfish/puffer - pulsing effect
    return this.size + Math.sin(this.pulsePhase) * 2;
  }

  // Check if this prey can be eaten by the player
  isEatableBy(player) {
    if (!this.alive) return false;
    if (!this.edible) return false;
    const playerEatRange = player.getEatRange();
    return this.size < playerEatRange;
  }

  // Check if this enemy can damage the player
  canDamage(player) {
    if (!this.alive) return false;
    if (this.harmful) return true; // jellyfish, puffer always damage
    if (!this.edible && this.size > player.size) return true; // bigger fish
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
