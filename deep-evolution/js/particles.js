// ==================== 粒子系统 ====================

class Particle {
  constructor(x, y, vx, vy, life, color, size, shrink = true) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.color = color;
    this.size = size;
    this.maxSize = size;
    this.shrink = shrink;
    this.alive = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    if (this.life <= 0) this.alive = false;
    if (this.shrink) {
      this.size = this.maxSize * (this.life / this.maxLife);
    }
  }
}

class BubbleParticle extends Particle {
  constructor(x, y, size) {
    const speed = 0.2 + Math.random() * 0.4;
    const wobble = (Math.random() - 0.5) * 0.3;
    super(x, y, wobble, -speed, 120 + Math.random() * 120, COLORS.bubble, size, false);
    this.wobblePhase = Math.random() * Math.PI * 2;
    this.wobbleAmp = 0.2 + Math.random() * 0.3;
  }

  update() {
    super.update();
    this.wobblePhase += 0.03;
    this.vx = Math.sin(this.wobblePhase) * this.wobbleAmp;
    this.size = this.maxSize * (0.8 + 0.2 * Math.sin(this.wobblePhase * 2));
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawnBubbles(x, y, count, baseSize) {
    for (let i = 0; i < count; i++) {
      const size = (baseSize || 3) + Math.random() * 4;
      this.particles.push(new BubbleParticle(
        x + (Math.random() - 0.5) * 30,
        y + (Math.random() - 0.5) * 20,
        size,
      ));
    }
  }

  spawnEatEffect(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        20 + Math.random() * 15,
        color,
        3 + Math.random() * 4,
      ));
    }
  }

  spawnEvolutionEffect(x, y) {
    const colors = ['#ffdd44', '#ffffff', '#44ccff', '#ff66aa'];
    for (let ring = 0; ring < 3; ring++) {
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2 + ring * 0.3;
        const speed = 2 + ring * 1.5;
        this.particles.push(new Particle(
          x + Math.cos(angle) * ring * 10,
          y + Math.sin(angle) * ring * 10,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          40 + ring * 20,
          colors[ring % colors.length],
          4 + ring * 2,
        ));
      }
    }
  }

  spawnDamageEffect(x, y) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2;
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        15 + Math.random() * 10,
        '#ff3344',
        3 + Math.random() * 3,
      ));
    }
  }

  spawnScorePopup(x, y, text, color = '#ffdd44') {
    this.particles.push(new (class extends Particle {
      constructor() {
        super(x, y, 0, -1.2, 45, color, 16, false);
        this.text = text;
        this.shrink = false;
      }
      update() {
        super.update();
        this.vy *= 0.98;
      }
    })());
  }

  // ---- v2 新增粒子特效 ----

  // 嗜血红光粒子
  spawnBloodlustParticles(x, y, size) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = size * (0.5 + Math.random() * 0.5);
      const speed = 0.5 + Math.random();
      this.particles.push(new Particle(
        x + Math.cos(angle) * dist,
        y + Math.sin(angle) * dist,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        15 + Math.random() * 10,
        '#ff2244',
        2 + Math.random() * 3,
      ));
    }
  }

  // 远古之力金色光粒子
  spawnAncientPowerParticles(x, y, size) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        25 + Math.random() * 15,
        '#ffdd44',
        3 + Math.random() * 3,
      ));
    }
  }

  // 远古甲胄金色光晕粒子
  spawnAncientArmorParticles(x, y, size) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = size * 0.8;
      this.particles.push(new Particle(
        x + Math.cos(angle) * dist,
        y + Math.sin(angle) * dist,
        Math.cos(angle) * 0.3,
        Math.sin(angle) * 0.3 - 0.5,
        30 + Math.random() * 20,
        '#ffcc44',
        2 + Math.random() * 2,
      ));
    }
  }

  // 拟态伪装淡出粒子
  spawnCamouflageParticles(x, y, size) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random();
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        20 + Math.random() * 10,
        'rgba(180, 220, 255, 0.4)',
        2 + Math.random() * 3,
      ));
    }
  }

  // 深渊之歌声波粒子
  spawnAbyssSongParticles(x, y) {
    for (let ring = 0; ring < 3; ring++) {
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const speed = 3 + ring;
        this.particles.push(new Particle(
          x + Math.cos(angle) * ring * 20,
          y + Math.sin(angle) * ring * 20,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          30 + ring * 10,
          '#44aaff',
          3 + Math.random() * 2,
        ));
      }
    }
  }

  // 深海烈焰火焰粒子
  spawnFlameParticles(x, y, angle, distance) {
    for (let i = 0; i < 3; i++) {
      const spread = (Math.random() - 0.5) * 0.4;
      const dist = Math.random() * distance;
      const px = x + Math.cos(angle + spread) * dist;
      const py = y + Math.sin(angle + spread) * dist;
      const colors = ['#ff4400', '#ff8800', '#ffcc00', '#ff2200'];
      this.particles.push(new Particle(
        px, py,
        Math.cos(angle + spread) * 2 + (Math.random() - 0.5),
        Math.sin(angle + spread) * 2 + (Math.random() - 0.5),
        10 + Math.random() * 15,
        colors[Math.floor(Math.random() * colors.length)],
        3 + Math.random() * 5,
      ));
    }
  }

  // 巨尾横扫粒子
  spawnTailWhipParticles(x, y) {
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const speed = 3 + Math.random() * 4;
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        20 + Math.random() * 15,
        '#ffffff',
        3 + Math.random() * 3,
      ));
    }
  }

  // 暴君威压波纹
  spawnTyrantAuraParticles(x, y, frame) {
    const angle = (frame * 0.05) % (Math.PI * 2);
    const dist = 40 + Math.sin(frame * 0.1) * 20;
    this.particles.push(new Particle(
      x + Math.cos(angle) * dist,
      y + Math.sin(angle) * dist,
      0, 0,
      20,
      'rgba(255, 80, 80, 0.3)',
      4,
    ));
  }

  // 海啸冲锋路径粒子
  spawnChargeTrail(x, y, angle) {
    for (let i = 0; i < 5; i++) {
      const spread = (Math.random() - 0.5) * 0.5;
      this.particles.push(new Particle(
        x + Math.cos(angle + spread) * 5,
        y + Math.sin(angle + spread) * 5,
        Math.cos(angle) * 2 + (Math.random() - 0.5) * 2,
        Math.sin(angle) * 2 + (Math.random() - 0.5) * 2,
        15 + Math.random() * 10,
        '#44aaff',
        3 + Math.random() * 3,
      ));
    }
  }

  // 漩涡粒子
  spawnVortexParticles(cx, cy, radius) {
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = radius * (0.3 + Math.random() * 0.7);
      const speed = 2 + Math.random() * 2;
      // 螺旋运动
      this.particles.push(new Particle(
        cx + Math.cos(angle) * dist,
        cy + Math.sin(angle) * dist,
        Math.cos(angle + Math.PI / 2) * speed - Math.cos(angle) * 0.5,
        Math.sin(angle + Math.PI / 2) * speed - Math.sin(angle) * 0.5,
        20 + Math.random() * 15,
        '#4488ff',
        2 + Math.random() * 3,
      ));
    }
  }

  // 回声定位声呐粒子
  spawnEchoLocateParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        25 + Math.random() * 15,
        'rgba(100, 255, 100, 0.3)',
        2 + Math.random() * 2,
      ));
    }
  }

  // 气泡护盾粒子
  spawnBubbleShieldParticles(x, y) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random();
      this.particles.push(new Particle(
        x + Math.cos(angle) * 10,
        y + Math.sin(angle) * 10,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        20 + Math.random() * 10,
        'rgba(180, 220, 255, 0.5)',
        3 + Math.random() * 3,
      ));
    }
  }

  // 团队狩猎 - 虎鲸出现粒子
  spawnAllyAppearParticles(x, y) {
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        20 + Math.random() * 10,
        '#44ccff',
        3 + Math.random() * 4,
      ));
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (!this.particles[i].alive) {
        this.particles.splice(i, 1);
      }
    }
    // 容量限制：超出上限时从最老的粒子开始清除
    this._enforceCap();
  }

  // 粒子容量限制（M-3 修复）
  _enforceCap() {
    const maxParticles = CONFIG.MAX_PARTICLES || 600;
    while (this.particles.length > maxParticles) {
      // 优先清除非文字粒子（保留分数弹出等UI文字）
      const idx = this.particles.findIndex(p => !p.text);
      if (idx >= 0) {
        this.particles.splice(idx, 1);
      } else {
        this.particles.shift();
      }
    }
  }

  draw(ctx, cameraX, cameraY) {
    for (const p of this.particles) {
      const sx = p.x - cameraX;
      const sy = p.y - cameraY;

      if (p.text) {
        ctx.save();
        ctx.font = `bold ${p.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, sx, sy);
        ctx.restore();
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.life / p.maxLife * 0.7;
      ctx.fillStyle = p.color;

      if (p instanceof BubbleParticle) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(sx - p.size * 0.3, sy - p.size * 0.3, p.size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
