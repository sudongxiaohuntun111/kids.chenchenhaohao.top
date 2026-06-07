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

    // Cooldown for abilities
    this.shockwaveActive = 0;
    this.shockwaveRadius = 0;
    this.vortexActive = 0;
    this.vortexRadius = 0;
    this.echoTargets = [];

    // Border bounds for entities
    this.bounds = { w: CONFIG.WIDTH, h: CONFIG.HEIGHT };

    // Track eaten count
    this.totalEaten = 0;

    // Spawn timer
    this.spawnTimer = 0;

    // Screen shake
    this.screenShake = 0;

    // Handle resize
    this._resize();
    window.addEventListener('resize', () => this._resize());

    // Mouse events for UI
    this.canvas.addEventListener('click', (e) => this._onClick(e));
    this.canvas.addEventListener('mousemove', (e) => this._onMove(e));

    // Touch events for UI
    this.canvas.addEventListener('touchstart', (e) => this._onTouch(e), { passive: false });

    // Start game loop
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
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
    this.vortexActive = 0;

    this.player = new Player(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, difficulty);
    this.player.totalEaten = 0;
    this.player.evolutionCount = 0;

    this.particles = new ParticleSystem();

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
  }

  _spawnInitialPrey() {
    const count = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      this._spawnPrey();
    }
  }

  _spawnPrey() {
    if (!this.diffConfig) return;
    const counts = this.diffConfig.preyCount;

    // Cap total prey
    if (this.preyList.filter(p => p.alive).length > counts.max + 5) return;

    const isEnemy = Math.random() < 0.2;
    let type;

    if (isEnemy) {
      // Spawn an enemy bigger than player (if player exists)
      if (this.player) {
        const enemyTypes = PREY_TYPES.filter(t => !t.edible);
        type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      } else {
        type = PREY_TYPES.find(t => t.id === 'jellyfish');
      }
    } else {
      // Weighted random prey
      const totalWeight = PREY_TYPES.filter(t => t.edible).reduce((s, t) => s + t.spawnWeight, 0);
      let r = Math.random() * totalWeight;
      for (const t of PREY_TYPES) {
        if (!t.edible) continue;
        r -= t.spawnWeight;
        if (r <= 0) { type = t; break; }
      }
    }

    if (!type) type = PREY_TYPES[0];

    // Spawn at random edge
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
    // Background bubbles
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

    const speed = p.getEffectiveSpeed() * (sprint ? 1.6 : 1);
    p.x += dir.x * speed;
    p.y += dir.y * speed;

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

    // Update prey
    for (const prey of this.preyList) {
      if (prey.alive) {
        prey.update(p.x, p.y, p.size, this.bounds);
      }
    }

    // Remove dead prey after a delay
    this.preyList = this.preyList.filter(prey => prey.alive || prey.bodyWave > -100);
    // Actually clean up fully dead ones
    this.preyList = this.preyList.filter(prey => prey.alive);

    // ---- Collision detection ----
    for (const prey of this.preyList) {
      if (!prey.alive) continue;

      // Check eat collision
      if (prey.edible && checkEatCollision(p, prey)) {
        const isBoss = prey.size >= 35;
        p.addScore(prey.value);
        p.totalEaten = (p.totalEaten || 0) + 1;
        p.combo = (p.combo || 0) + 1;

        // Heal a bit
        p.heal(0.5);

        // Visual feedback
        this.particles.spawnEatEffect(prey.x, prey.y, prey.type.color);
        this.particles.spawnScorePopup(prey.x, prey.y - 10, `+${prey.value}`,
          isBoss ? '#ff8844' : '#ffdd44');

        prey.alive = false;

        // Check evolution
        this._checkEvolution();

        continue;
      }

      // Check damage collision
      if (!prey.edible && checkDamageCollision(p, prey)) {
        const dmg = this.diffConfig.enemyDamage;

        const isDead = p.takeDamage(dmg);
        this.particles.spawnDamageEffect(prey.x, prey.y);
        this.screenShake = 5;

        if (isDead) {
          this._gameOver();
          return;
        }

        // Jellyfish/puffer doesn't die on contact, but bigger enemies do
        if (!prey.harmful) {
          prey.alive = false;
        }
      }
    }

    // Attract ability
    if (p.bonus.hasAttract) {
      for (const prey of this.preyList) {
        if (!prey.alive || !prey.edible) continue;
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

    // Active ability: Shockwave
    if (p.bonus.hasShockwave && this.input.isKeyDown(' ') && p.cooldowns.shockwave === undefined) {
      p.cooldowns.shockwave = 1800; // 30s
      this.shockwaveActive = 40;
      this.shockwaveRadius = 0;
      this.screenShake = 10;
      for (const prey of this.preyList) {
        if (!prey.alive || prey.edible) continue;
        if (checkShockwaveRange(p, prey)) {
          prey.stunned = true;
          prey.stunTimer = 120; // 2s
        }
      }
    }

    // Active ability: Vortex (mosasaurus)
    if (p.bonus.hasVortex && this.input.isKeyDown(' ') && p.cooldowns.vortex === undefined) {
      // Use space for vortex too? Let me use a different key - actually let's auto-activate or use ability key
      // For simplicity, specific abilities activate automatically
    }

    // Shockwave visual
    if (this.shockwaveActive > 0) {
      this.shockwaveActive--;
      this.shockwaveRadius += 8;
    }

    // Screen shake decay
    if (this.screenShake > 0) this.screenShake--;

    // Combo decay
    if (p.combo > 0 && this.frame % 120 === 0) {
      p.combo = Math.max(0, p.combo - 1);
    }

    // Echo locate visual targets
    if (p.bonus.hasEchoLocate) {
      this.echoTargets = this.preyList
        .filter(prey => prey.alive && prey.edible)
        .sort((a, b) => {
          const da = (a.x - p.x) ** 2 + (a.y - p.y) ** 2;
          const db = (b.x - p.x) ** 2 + (b.y - p.y) ** 2;
          return da - db;
        })
        .slice(0, 3);
    }

    // Update particles
    this.particles.update();
  }

  _checkEvolution() {
    if (!this.player || !this.diffConfig) return;
    const result = checkEvolutionTrigger(this.player, this.diffConfig);

    if (result) {
      if (result.choices) {
        // Stage 0 → 1: Form selection
        this.formChoices = result.choices;
        this.evoState = { phase: 'formSelect' };
        this.evoFrame = 0;
        this.state = 'EVOLVING';
      } else if (result.form) {
        // Stage 1 → 2: Auto-evolve
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
        // Waiting for player to click a form card
        break;

      case 'transition':
        // Evolution animation
        if (this.evoFrame > 80) {
          // Apply evolution
          this.player.evolveTo(this.newForm);
          this.player.evolutionCount = (this.player.evolutionCount || 0) + 1;
          this.particles.spawnEvolutionEffect(this.player.x, this.player.y);
          this.screenShake = 15;

          // Generate ability choices for the new form
          this.abilityChoices = generateAbilityChoices(this.player, this.newForm);

          if (this.abilityChoices.length > 0) {
            this.evoState = { phase: 'abilitySelect' };
            this.evoFrame = 0;
          } else {
            // No abilities to choose
            this.state = 'PLAYING';
            this.evoState = null;
          }
        }
        break;

      case 'abilitySelect':
        // Waiting for player to click an ability card
        // Timeout after 10s (auto-pick first)
        if (this.evoFrame > 600) {
          this._applyAbilityChoice(this.abilityChoices[0]);
        }
        break;
    }

    // Particles
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
        if (prey.alive && !prey.edible) {
          this.renderer.drawPrey(prey);
        }
      }

      for (const prey of this.preyList) {
        if (prey.alive && prey.edible) {
          // Echo locate highlight
          if (this.player && this.player.bonus.hasEchoLocate &&
              this.echoTargets && this.echoTargets.includes(prey)) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 100, 0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(prey.x, prey.y, prey.size + 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
          this.renderer.drawPrey(prey);
        }
      }

      // Draw player
      if (this.player) {
        this.renderer.drawPlayer(this.player);
      }

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
    }

    ctx.restore();

    // UI overlay (no shake)
    switch (this.state) {
      case 'MENU':
        this.ui.drawMenu(this.frame);
        break;
      case 'PLAYING':
        if (this.player) this.ui.drawHUD(this.player, this.frame);
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
            this.ui.drawEvolutionTransition(this.evoFrame, this.player, this.newForm);
          }
          this.ui.drawHUD(this.player, this.frame);
        }
        break;
      case 'GAME_OVER':
        this.renderer.drawBackground(this.frame);
        this.renderer.drawDecorations(this.frame);
        this.renderer.drawParticles(this.particles);
        if (this.player) this.ui.drawGameOver(this.player, this.frame);
        break;
    }
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
