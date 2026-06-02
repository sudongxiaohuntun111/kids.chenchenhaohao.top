// ==================== 渲染器（Canvas 纯绘制）====================

class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = CONFIG.WIDTH;
    this.h = CONFIG.HEIGHT;
    this.decorations = [];
    this._initDecorations();
  }

  _initDecorations() {
    const decoDefs = [
      { type: 'seaweed', count: 6, yOff: 0 },
      { type: 'shell', count: 5, yOff: 15 },
      { type: 'treasure', count: 2, yOff: 20 },
      { type: 'coral', count: 4, yOff: 25 },
      { type: 'rock', count: 4, yOff: 10 },
    ];
    for (const d of decoDefs) {
      for (let i = 0; i < d.count; i++) {
        this.decorations.push({
          x: 50 + Math.random() * (this.w - 100),
          y: this.h - d.yOff - Math.random() * 15,
          type: d.type,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  // ============ 背景 ============

  drawBackground(frame) {
    const ctx = this.ctx;

    // Deep sea gradient
    const grad = ctx.createLinearGradient(0, 0, 0, this.h);
    grad.addColorStop(0, '#0a1628');
    grad.addColorStop(0.3, '#0d2444');
    grad.addColorStop(0.6, '#0f3460');
    grad.addColorStop(0.85, '#164a6b');
    grad.addColorStop(1, '#1a5a7a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.w, this.h);

    // 水面光照效果：动态光条纹（模拟水面光线投射到深海）
    ctx.save();
    const time = frame * 0.002;
    for (let i = 0; i < 8; i++) {
      const x = 80 + i * 145 + Math.sin(time + i * 1.8) * 40;
      const width = 15 + i * 4 + Math.sin(time * 0.7 + i * 2.1) * 8;
      const alpha = 0.03 + 0.02 * Math.sin(time * 0.5 + i * 1.3);
      const g2 = ctx.createLinearGradient(x, 0, x + width, this.h * 0.3);
      g2.addColorStop(0, `rgba(120, 200, 255, ${alpha + 0.01})`);
      g2.addColorStop(0.5, `rgba(120, 200, 255, ${alpha * 0.5})`);
      g2.addColorStop(1, 'rgba(120, 200, 255, 0)');
      ctx.fillStyle = g2;
      ctx.beginPath();
      ctx.moveTo(x - 12, 0);
      ctx.lineTo(x + width, this.h);
      ctx.lineTo(x - 12 - width * 0.5, this.h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 水面波浪光效（顶部波动光带模拟水面闪烁）
    ctx.save();
    ctx.globalAlpha = 0.03 + 0.02 * Math.sin(time * 0.3);
    for (let i = 0; i < 5; i++) {
      const wx = (i * 280 + Math.sin(time + i * 2.5) * 60) % (this.w + 100) - 50;
      const ww = 100 + Math.sin(time * 0.4 + i * 1.1) * 40;
      const grad = ctx.createLinearGradient(wx, 0, wx + ww, 20);
      grad.addColorStop(0, 'rgba(180, 230, 255, 0)');
      grad.addColorStop(0.3, 'rgba(180, 230, 255, 0.06)');
      grad.addColorStop(0.7, 'rgba(180, 230, 255, 0.06)');
      grad.addColorStop(1, 'rgba(180, 230, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(wx + ww / 2, 5 + Math.sin(time * 0.6 + i * 1.7) * 4, ww / 2, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Sandy bottom
    ctx.save();
    const sand = ctx.createLinearGradient(0, this.h - 50, 0, this.h);
    sand.addColorStop(0, 'rgba(194, 163, 102, 0)');
    sand.addColorStop(0.2, 'rgba(194, 163, 102, 0.2)');
    sand.addColorStop(1, 'rgba(194, 163, 102, 0.4)');
    ctx.fillStyle = sand;
    ctx.fillRect(0, this.h - 50, this.w, 50);
    ctx.restore();

    // Floating particles
    ctx.save();
    for (let i = 0; i < 30; i++) {
      const sx = (i * 137.5 + 50) % this.w;
      const sy = (i * 97.3 + 20) % (this.h * 0.5);
      const b = 0.15 + 0.15 * Math.sin(frame * 0.01 + i * 3.7);
      ctx.globalAlpha = b;
      ctx.fillStyle = 'rgba(180, 220, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(sx, sy, 1 + Math.sin(i * 2.1) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ============ 装饰物 ============

  drawDecorations(frame) {
    const ctx = this.ctx;
    for (const d of this.decorations) {
      const sway = d.type === 'seaweed'
        ? Math.sin(frame * 0.02 + d.phase) * 4 : 0;

      switch (d.type) {
        case 'seaweed':
          this._drawSeaweed(ctx, d.x + sway, d.y, d.phase);
          break;
        case 'shell':
          this._drawShell(ctx, d.x, d.y);
          break;
        case 'treasure':
          this._drawTreasure(ctx, d.x, d.y, frame);
          break;
        case 'coral':
          this._drawCoral(ctx, d.x, d.y);
          break;
        case 'rock':
          this._drawRock(ctx, d.x, d.y);
          break;
      }
    }
  }

  _drawSeaweed(ctx, x, y, phase) {
    const h = 60 + Math.sin(phase * 2) * 15;
    ctx.strokeStyle = '#2d8a4e';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 8, y - h * 0.5, x + Math.sin(phase) * 5, y - h);
    ctx.stroke();
    ctx.strokeStyle = '#3daa5e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 3, y);
    ctx.quadraticCurveTo(x - 8, y - h * 0.4, x - 4 + Math.sin(phase + 1) * 4, y - h * 0.7);
    ctx.stroke();
  }

  _drawShell(ctx, x, y) {
    ctx.fillStyle = '#f0d0a0';
    ctx.beginPath();
    ctx.ellipse(x, y, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d4b080';
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * 3, y - 4);
      ctx.lineTo(x + i * 2, y + 4);
      ctx.stroke();
    }
  }

  _drawTreasure(ctx, x, y, frame) {
    const sparkle = 0.5 + 0.5 * Math.sin(frame * 0.05);
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(x - 12, y - 8, 24, 16);
    ctx.fillStyle = '#c89030';
    ctx.fillRect(x - 10, y - 10, 20, 6);
    ctx.fillStyle = `rgba(255, 220, 50, ${sparkle * 0.3})`;
    ctx.beginPath();
    ctx.arc(x + 2, y + 4, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawCoral(ctx, x, y) {
    ctx.fillStyle = '#e06050';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 8, y - 30);
    ctx.lineTo(x - 4, y - 28);
    ctx.lineTo(x, y - 20);
    ctx.lineTo(x + 4, y - 28);
    ctx.lineTo(x + 8, y - 30);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c04040';
    ctx.beginPath();
    ctx.moveTo(x - 2, y);
    ctx.lineTo(x - 6, y - 22);
    ctx.lineTo(x - 3, y - 20);
    ctx.lineTo(x, y - 15);
    ctx.closePath();
    ctx.fill();
  }

  _drawRock(ctx, x, y) {
    ctx.fillStyle = '#6b7280';
    ctx.beginPath();
    ctx.ellipse(x, y, 14, 8, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4b5563';
    ctx.beginPath();
    ctx.ellipse(x - 3, y - 2, 6, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ============ 玩家鱼类绘制 ============

  drawPlayer(player) {
    const ctx = this.ctx;
    const s = player.size;
    const wave = Math.sin(player.bodyWave * 2) * 2;
    const isDamaged = player.damageFlash > 0 && Math.floor(player.damageFlash / 3) % 2 === 0;
    const isEvolving = player.evolutionFlash > 0;
    const form = player.form;

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    if (isEvolving) {
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#ffffff';
    }
    if (isDamaged) ctx.globalAlpha = 0.6;

    if (form === 'clownfish') this._drawClownfish(ctx, s, wave);
    else if (form === 'greatWhiteShark' || form === 'megalodon') {
      const c1 = form === 'megalodon' ? '#4a5559' : '#7B8D93';
      const c2 = form === 'megalodon' ? '#8a9aa0' : '#d4dce0';
      this._drawShark(ctx, s, wave, c1, c2);
    } else if (form === 'orca') this._drawOrca(ctx, s, wave);
    else if (form === 'mosasaurus') this._drawMosasaurus(ctx, s, wave);
    else if (form === 'basilosaurus') this._drawBasilosaurus(ctx, s, wave);
    else if (form === 'tylosaurus') this._drawTylosaurus(ctx, s, wave);

    ctx.restore();

    // HP bar above player
    const barW = Math.max(50, player.size * 1.2);
    const hpX = player.x - barW / 2;
    const hpY = player.y - player.size - 10;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(hpX - 1, hpY - 1, barW + 2, 7);
    const hpRatio = player.hp / player.maxHp;
    ctx.fillStyle = hpRatio > 0.5 ? '#44dd66' : hpRatio > 0.25 ? '#ffdd44' : '#ff4466';
    ctx.fillRect(hpX, hpY, barW * hpRatio, 5);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(hpX - 1, hpY - 1, barW + 2, 7);
  }

  _drawClownfish(ctx, s, wave) {
    ctx.fillStyle = '#ff6633';
    ctx.beginPath();
    ctx.ellipse(0, wave, s * 0.6, s * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    for (let i = -1; i <= 1; i++) {
      ctx.fillRect(i * s * 0.2 - 2, -s * 0.3 + wave, 4, s * 0.6);
    }
    ctx.fillStyle = '#ff6633';
    ctx.beginPath();
    ctx.moveTo(-s * 0.55, wave);
    ctx.lineTo(-s * 0.85, -s * 0.25 + wave);
    ctx.lineTo(-s * 0.85, s * 0.25 + wave);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s * 0.3, -s * 0.08 + wave, s * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(s * 0.32, -s * 0.08 + wave, s * 0.045, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawShark(ctx, s, wave, color1, color2) {
    ctx.fillStyle = color1;
    ctx.beginPath();
    ctx.moveTo(s * 0.5, wave);
    ctx.quadraticCurveTo(s * 0.4, -s * 0.3, 0, -s * 0.28 + wave);
    ctx.quadraticCurveTo(-s * 0.3, -s * 0.25 + wave, -s * 0.5, -s * 0.1 + wave);
    ctx.lineTo(-s * 0.5, s * 0.1 + wave);
    ctx.quadraticCurveTo(-s * 0.3, s * 0.25 + wave, 0, s * 0.28 + wave);
    ctx.quadraticCurveTo(s * 0.4, s * 0.3 + wave, s * 0.5, wave);
    ctx.fill();
    ctx.fillStyle = color2;
    ctx.beginPath();
    ctx.moveTo(s * 0.4, s * 0.05 + wave);
    ctx.quadraticCurveTo(s * 0.3, s * 0.2, 0, s * 0.2 + wave);
    ctx.quadraticCurveTo(-s * 0.3, s * 0.18 + wave, -s * 0.45, s * 0.05 + wave);
    ctx.lineTo(-s * 0.35, s * 0.22 + wave);
    ctx.quadraticCurveTo(-s * 0.25, s * 0.28 + wave, 0, s * 0.28 + wave);
    ctx.quadraticCurveTo(s * 0.3, s * 0.28 + wave, s * 0.4, s * 0.05 + wave);
    ctx.fill();
    ctx.fillStyle = color1;
    ctx.beginPath();
    ctx.moveTo(s * 0.05, -s * 0.25 + wave);
    ctx.quadraticCurveTo(-s * 0.05, -s * 0.55, -s * 0.2, -s * 0.25 + wave);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-s * 0.48, wave);
    ctx.lineTo(-s * 0.85, -s * 0.35 + wave);
    ctx.lineTo(-s * 0.75, -s * 0.05 + wave);
    ctx.lineTo(-s * 0.85, s * 0.35 + wave);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(s * 0.25, -s * 0.1 + wave, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(s * 0.27, -s * 0.1 + wave, s * 0.04, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawOrca(ctx, s, wave) {
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.moveTo(s * 0.5, wave);
    ctx.quadraticCurveTo(s * 0.4, -s * 0.32, 0, -s * 0.3 + wave);
    ctx.quadraticCurveTo(-s * 0.35, -s * 0.28 + wave, -s * 0.5, -s * 0.1 + wave);
    ctx.lineTo(-s * 0.5, s * 0.1 + wave);
    ctx.quadraticCurveTo(-s * 0.35, s * 0.28 + wave, 0, s * 0.3 + wave);
    ctx.quadraticCurveTo(s * 0.4, s * 0.32 + wave, s * 0.5, wave);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(s * 0.4, s * 0.08 + wave);
    ctx.quadraticCurveTo(s * 0.25, s * 0.25, 0, s * 0.25 + wave);
    ctx.quadraticCurveTo(-s * 0.3, s * 0.23 + wave, -s * 0.45, s * 0.08 + wave);
    ctx.lineTo(-s * 0.4, s * 0.15 + wave);
    ctx.quadraticCurveTo(-s * 0.25, s * 0.28 + wave, 0, s * 0.28 + wave);
    ctx.quadraticCurveTo(s * 0.3, s * 0.28 + wave, s * 0.4, s * 0.08 + wave);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(s * 0.2, -s * 0.08 + wave, s * 0.06, s * 0.08, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.moveTo(s * 0.05, -s * 0.28 + wave);
    ctx.quadraticCurveTo(-s * 0.05, -s * 0.65, -s * 0.15, -s * 0.28 + wave);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-s * 0.48, wave);
    ctx.lineTo(-s * 0.9, -s * 0.25 + wave);
    ctx.lineTo(-s * 0.8, wave);
    ctx.lineTo(-s * 0.9, s * 0.25 + wave);
    ctx.closePath();
    ctx.fill();
  }

  _drawMosasaurus(ctx, s, wave) {
    ctx.fillStyle = '#2d6a4f';
    ctx.beginPath();
    ctx.moveTo(s * 0.55, wave);
    ctx.quadraticCurveTo(s * 0.4, -s * 0.2, 0, -s * 0.22 + wave);
    ctx.quadraticCurveTo(-s * 0.3, -s * 0.2 + wave, -s * 0.6, -s * 0.05 + wave);
    ctx.lineTo(-s * 0.6, s * 0.05 + wave);
    ctx.quadraticCurveTo(-s * 0.3, s * 0.2 + wave, 0, s * 0.22 + wave);
    ctx.quadraticCurveTo(s * 0.4, s * 0.2 + wave, s * 0.55, wave);
    ctx.fill();
    ctx.fillStyle = '#95d5b2';
    ctx.beginPath();
    ctx.moveTo(s * 0.45, s * 0.05 + wave);
    ctx.quadraticCurveTo(s * 0.3, s * 0.17, 0, s * 0.17 + wave);
    ctx.quadraticCurveTo(-s * 0.35, s * 0.15 + wave, -s * 0.55, s * 0.03 + wave);
    ctx.lineTo(-s * 0.4, s * 0.17 + wave);
    ctx.quadraticCurveTo(-s * 0.35, s * 0.2 + wave, 0, s * 0.2 + wave);
    ctx.quadraticCurveTo(s * 0.35, s * 0.17 + wave, s * 0.45, s * 0.05 + wave);
    ctx.fill();
    ctx.fillStyle = '#ffdd44';
    ctx.beginPath();
    ctx.arc(s * 0.3, -s * 0.06 + wave, s * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(s * 0.31, -s * 0.06 + wave, s * 0.035, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawBasilosaurus(ctx, s, wave) {
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.moveTo(s * 0.55, wave);
    ctx.quadraticCurveTo(s * 0.3, -s * 0.18, 0, -s * 0.2 + wave);
    ctx.quadraticCurveTo(-s * 0.4, -s * 0.18 + wave, -s * 0.7, -s * 0.05 + wave);
    ctx.quadraticCurveTo(-s * 0.85, wave, -s * 0.9, wave);
    ctx.lineTo(-s * 0.9, s * 0.05 + wave);
    ctx.quadraticCurveTo(-s * 0.85, s * 0.05 + wave, -s * 0.7, s * 0.18 + wave);
    ctx.quadraticCurveTo(-s * 0.4, s * 0.2 + wave, 0, s * 0.2 + wave);
    ctx.quadraticCurveTo(s * 0.3, s * 0.18 + wave, s * 0.55, wave);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(s * 0.35, -s * 0.08 + wave, s * 0.04, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawTylosaurus(ctx, s, wave) {
    ctx.fillStyle = '#1a4a20';
    ctx.beginPath();
    ctx.moveTo(s * 0.55, wave);
    ctx.quadraticCurveTo(s * 0.4, -s * 0.25, 0, -s * 0.26 + wave);
    ctx.quadraticCurveTo(-s * 0.35, -s * 0.24 + wave, -s * 0.6, -s * 0.08 + wave);
    ctx.lineTo(-s * 0.6, s * 0.08 + wave);
    ctx.quadraticCurveTo(-s * 0.35, s * 0.24 + wave, 0, s * 0.26 + wave);
    ctx.quadraticCurveTo(s * 0.4, s * 0.25 + wave, s * 0.55, wave);
    ctx.fill();
    ctx.fillStyle = '#ddaa22';
    ctx.beginPath();
    ctx.arc(s * 0.3, -s * 0.1 + wave, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(s * 0.31, -s * 0.1 + wave, s * 0.04, 0, Math.PI * 2);
    ctx.fill();
  }

  // ============ 猎物绘制 ============

  drawPrey(prey) {
    const ctx = this.ctx;
    const s = prey.size || 20;
    const wave = Math.sin(prey.bodyWave * 2) * 1.5;

    ctx.save();
    ctx.translate(prey.x, prey.y);
    ctx.rotate(prey.angle);

    const type = prey.type.id;
    if (type === 'jellyfish') {
      this._drawPreyJellyfish(ctx, s);
    } else if (type === 'puffer') {
      this._drawPreyPuffer(ctx, s);
    } else {
      this._drawPreyGeneric(ctx, s, wave, prey.type.color);
    }

    ctx.restore();
  }

  _drawPreyGeneric(ctx, s, wave, color) {
    // Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, wave, s * 0.5, s * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tail
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.45, wave);
    ctx.lineTo(-s * 0.7, -s * 0.2 + wave);
    ctx.lineTo(-s * 0.7, s * 0.2 + wave);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(s * 0.25, -s * 0.05 + wave, s * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(s * 0.27, -s * 0.05 + wave, s * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawPreyJellyfish(ctx, s) {
    const pulse = Math.sin(ctx.canvas ? performance.now() * 0.004 : 0) * 2;

    // Dome
    ctx.fillStyle = 'rgba(180, 120, 220, 0.6)';
    ctx.beginPath();
    ctx.arc(0, -2 + pulse, s * 0.4, Math.PI, 0);
    ctx.fill();

    // Tentacles
    ctx.strokeStyle = 'rgba(180, 120, 220, 0.4)';
    ctx.lineWidth = 1.5;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * s * 0.1, pulse);
      ctx.quadraticCurveTo(i * s * 0.15, s * 0.3, i * s * 0.05, s * 0.5);
      ctx.stroke();
    }

    // Inner glow
    ctx.fillStyle = 'rgba(200, 160, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(0, -2 + pulse, s * 0.2, Math.PI, 0);
    ctx.fill();
  }

  _drawPreyPuffer(ctx, s) {
    const inflate = 1 + 0.1 * Math.sin(ctx.canvas ? performance.now() * 0.005 : 0);

    // Body (round)
    ctx.fillStyle = '#88dd44';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.35 * inflate, 0, Math.PI * 2);
    ctx.fill();

    // Spikes
    ctx.strokeStyle = '#66aa33';
    ctx.lineWidth = 2;
    const spikeCount = 8;
    for (let i = 0; i < spikeCount; i++) {
      const a = (i / spikeCount) * Math.PI * 2;
      const inner = s * 0.35 * inflate;
      const outer = s * 0.45 * inflate;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
      ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
      ctx.stroke();
    }

    // Belly
    ctx.fillStyle = '#aaf066';
    ctx.beginPath();
    ctx.arc(0, s * 0.08, s * 0.2 * inflate, 0, Math.PI * 2);
    ctx.fill();

    // Eye (angry)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(s * 0.12, -s * 0.08, s * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(s * 0.14, -s * 0.08, s * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }

  drawParticles(particles) {
    particles.draw(this.ctx, 0, 0);
  }
}
