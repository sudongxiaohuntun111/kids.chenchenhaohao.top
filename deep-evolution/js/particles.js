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
    // Oscillate size slightly
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

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (!this.particles[i].alive) {
        this.particles.splice(i, 1);
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
        // Bubbles have a shine
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
