// ==================== UI 界面系统 ====================

class UIManager {
  constructor(ctx, w, h) {
    this.ctx = ctx;
    this.w = w;
    this.h = h;
    this.selectedDifficulty = 'normal';
    this.evolutionFormChoices = [];
    this.evolutionAbilityChoices = [];
    this.evolutionSelectedForm = null;
    this.abilityCards = []; // { id, icon, name, desc, index }
    this.showAttractHint = false;
    this.attractHintTimer = 0;
  }

  // ---- 开始画面 ----
  drawMenu(frame) {
    const ctx = this.ctx;

    // Background overlay
    ctx.fillStyle = 'rgba(6, 14, 34, 0.85)';
    ctx.fillRect(0, 0, this.w, this.h);

    // Title with glow
    const titleY = this.h * 0.18;
    const glow = 0.3 + 0.15 * Math.sin(frame * 0.03);

    ctx.save();
    ctx.shadowBlur = 30 + glow * 20;
    ctx.shadowColor = '#44aaff';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px Arial, "PingFang SC", "Microsoft YaHei"';
    ctx.textAlign = 'center';
    ctx.fillText('🌊 深海进化大冒险', this.w / 2, titleY);
    ctx.restore();

    // Subtitle
    ctx.fillStyle = 'rgba(180, 220, 255, 0.6)';
    ctx.font = '18px Arial, "PingFang SC", "Microsoft YaHei"';
    ctx.fillText('大鱼吃小鱼 · 送给徐浚棋小宝贝', this.w / 2, titleY + 40);

    // Difficulty selection
    const diffY = this.h * 0.38;
    ctx.fillStyle = '#8899bb';
    ctx.font = '16px Arial, "PingFang SC"';
    ctx.fillText('选择难度', this.w / 2, diffY - 20);

    const diffKeys = ['easy', 'normal', 'hard'];
    const cardW = 200;
    const cardH = 120;
    const totalW = diffKeys.length * cardW + (diffKeys.length - 1) * 20;
    const startX = (this.w - totalW) / 2;

    for (let i = 0; i < diffKeys.length; i++) {
      const key = diffKeys[i];
      const diff = DIFFICULTY[key];
      const cx = startX + i * (cardW + 20);
      const cy = diffY + 10;
      const isSelected = this.selectedDifficulty === key;

      // Card background
      ctx.save();
      if (isSelected) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#4499ff';
        ctx.fillStyle = 'rgba(30, 80, 160, 0.4)';
      } else {
        ctx.fillStyle = 'rgba(20, 40, 80, 0.3)';
      }

      this.roundRect(ctx, cx, cy, cardW, cardH, 12);
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#4499ff';
        ctx.lineWidth = 2;
        this.roundRect(ctx, cx, cy, cardW, cardH, 12);
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(60, 140, 220, 0.2)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, cx, cy, cardW, cardH, 12);
        ctx.stroke();
      }
      ctx.restore();

      // Difficulty icon (big)
      ctx.font = '36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(diff.icon, cx + cardW / 2, cy + 45);

      // Label
      ctx.fillStyle = isSelected ? '#ffffff' : '#aabbcc';
      ctx.font = 'bold 18px Arial, "PingFang SC"';
      ctx.fillText(diff.label, cx + cardW / 2, cy + 80);

      // Subtitle
      ctx.fillStyle = 'rgba(150, 180, 210, 0.6)';
      ctx.font = '11px Arial, "PingFang SC"';
      ctx.fillText(diff.subtitle, cx + cardW / 2, cy + 100);

      // Store clickable areas
      diffKeys[i] = { key, cx, cy, cardW, cardH };
    }

    // Store for click detection
    this._difficultyButtons = diffKeys;

    // Start button
    const btnY = this.h * 0.70;
    const pulse = 1 + 0.03 * Math.sin(frame * 0.05);
    ctx.save();
    ctx.translate(this.w / 2, btnY);
    ctx.scale(pulse, pulse);

    ctx.shadowBlur = 20;
    ctx.shadowColor = '#22cc66';

    const btnW = 200;
    const btnH = 55;
    this.roundRect(ctx, -btnW / 2, -btnH / 2, btnW, btnH, 28);
    ctx.fillStyle = '#22aa55';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial, "PingFang SC"';
    ctx.textAlign = 'center';
    ctx.fillText('开始游戏', 0, 8);

    ctx.restore();

    this._startBtnRect = {
      x: this.w / 2 - btnW / 2,
      y: btnY - btnH / 2,
      w: btnW, h: btnH,
    };

    // Bottom hint
    ctx.fillStyle = 'rgba(100, 140, 180, 0.4)';
    ctx.font = '13px Arial, "PingFang SC"';
    ctx.fillText('键盘 WASD / 方向键移动 · 鼠标跟随 · 触屏拖拽', this.w / 2, this.h - 30);

    // Operations hint
    ctx.fillText('Shift 加速冲刺', this.w / 2, this.h - 10);
  }

  // ---- HUD ----
  drawHUD(player, frame) {
    const ctx = this.ctx;

    // Score - top left
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial, "PingFang SC"';
    ctx.textAlign = 'left';
    ctx.fillText(`🏆 ${player.totalScore}`, 20, 32);

    // Evolution stage
    const formData = player.getFormData();
    ctx.fillStyle = 'rgba(180, 220, 255, 0.7)';
    ctx.font = '14px Arial, "PingFang SC"';
    ctx.fillText(`${formData.name} (${formData.english})`, 20, 54);

    // Evolution progress bar
    const diffConfig = DIFFICULTY[player.difficulty];
    const stage = player.evolutionStage;
    if (stage < 2) {
      const threshold = diffConfig.evolutionThreshold[stage];
      const progress = Math.min(player.evolutionScore / threshold, 1);
      const barX = 20;
      const barY = 64;
      const barW = 150;
      const barH = 8;

      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      this.roundRect(ctx, barX, barY, barW, barH, 4);
      ctx.fill();

      const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      grad.addColorStop(0, '#44ddff');
      grad.addColorStop(1, '#4488ff');
      ctx.fillStyle = grad;
      this.roundRect(ctx, barX, barY, barW * progress, barH, 4);
      ctx.fill();

      ctx.fillStyle = 'rgba(180, 220, 255, 0.5)';
      ctx.font = '9px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`进化 ${player.evolutionScore}/${threshold}`, barX, barY + barH + 12);
    } else {
      ctx.fillStyle = '#ffdd44';
      ctx.font = '12px Arial, "PingFang SC"';
      ctx.textAlign = 'left';
      ctx.fillText('⭐ 已至巅峰形态', 20, 78);
    }

    // HP hearts - top right
    ctx.textAlign = 'right';
    let hearts = '';
    for (let i = 0; i < Math.ceil(player.hp); i++) hearts += '❤️';
    ctx.font = '16px Arial';
    ctx.fillText(hearts, this.w - 20, 30);

    // Form icon based on current evolution
    ctx.textAlign = 'right';
    ctx.font = '24px Arial';
    const formIcons = {
      clownfish: '🐠', greatWhiteShark: '🦈', orca: '🐋',
      mosasaurus: '🦎', megalodon: '🦈', basilosaurus: '🐍',
      tylosaurus: '🐉',
    };
    ctx.fillText(formIcons[player.form] || '🐟', this.w - 20, 58);

    // Active abilities indicators
    let abY = 80;
    for (const ab of player.abilities) {
      const def = ABILITIES[ab.id];
      if (def && !def.general) {
        ctx.textAlign = 'right';
        ctx.font = '11px Arial';
        ctx.fillStyle = 'rgba(180, 220, 255, 0.6)';
        ctx.fillText(`${def.icon} ${def.name}`, this.w - 20, abY);
        abY += 16;
      }
    }

    // Combo indicator
    if (player.combo && player.combo > 1) {
      const comboAlpha = 0.6 + 0.4 * Math.sin(frame * 0.1);
      ctx.save();
      ctx.globalAlpha = comboAlpha;
      ctx.fillStyle = '#ffdd44';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`🔥 ${player.combo} 连击!`, this.w / 2, 40);
      ctx.restore();
    }
  }

  // ---- 进化选择界面 ----
  drawEvolutionScreen(frame, player, evolutionData) {
    const ctx = this.ctx;
    const dim = 0.5 + 0.3 * Math.sin(frame * 0.05);

    // Dark overlay
    ctx.fillStyle = `rgba(0, 0, 0, ${0.6 + dim * 0.1})`;
    ctx.fillRect(0, 0, this.w, this.h);

    // Title
    ctx.save();
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#ffdd44';
    ctx.fillStyle = '#ffdd44';
    ctx.font = 'bold 36px Arial, "PingFang SC"';
    ctx.textAlign = 'center';
    ctx.fillText('⭐ 进化 !', this.w / 2, 80);
    ctx.restore();

    // Current form
    const formData = player.getFormData();
    ctx.fillStyle = 'rgba(180, 220, 255, 0.7)';
    ctx.font = '16px Arial, "PingFang SC"';
    ctx.fillText(`${formData.name} → 选择你的进化方向`, this.w / 2, 115);

    if (evolutionData.type === 'form') {
      // Stage 0 → 1: Choose form
      this._drawFormSelection(ctx, frame, evolutionData);
    } else if (evolutionData.type === 'ability') {
      // Stage 1 → 2 or after form: Choose ability
      this._drawAbilitySelection(ctx, frame, player, evolutionData);
    } else if (evolutionData.type === 'autoEvolve') {
      // Single evolution path (stage 1 → 2)
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial, "PingFang SC"';
      ctx.textAlign = 'center';
      ctx.fillText(`进化成 ${EVOLUTION_FORMS[evolutionData.form].name}！`, this.w / 2, this.h / 2 - 20);
      ctx.fillStyle = 'rgba(180, 220, 255, 0.5)';
      ctx.font = '16px Arial, "PingFang SC"';
      ctx.fillText('继续进化...', this.w / 2, this.h / 2 + 20);
    }
  }

  _drawFormSelection(ctx, frame, evolutionData) {
    const choices = evolutionData.choices;
    const cardW = 220;
    const cardH = 260;
    const gap = 30;
    const totalW = choices.length * cardW + (choices.length - 1) * gap;
    const startX = (this.w - totalW) / 2;
    const centerY = this.h / 2 - 20;

    const formIcons = {
      greatWhiteShark: '🦈', orca: '🐋', mosasaurus: '🦎',
      megalodon: '🦈', basilosaurus: '🐍', tylosaurus: '🐉',
    };
    const formImages = {
      greatWhiteShark: ['#7B8D93', '#d4dce0', '大白鲨'],
      orca: ['#1a1a2e', '#ffffff', '虎鲸'],
      mosasaurus: ['#2d6a4f', '#95d5b2', '沧龙'],
    };

    this.abilityCards = [];

    for (let i = 0; i < choices.length; i++) {
      const formId = choices[i];
      const formData = EVOLUTION_FORMS[formId];
      const cx = startX + i * (cardW + gap);

      // Card
      ctx.save();
      const hovered = this._hoveredCard === i;
      ctx.shadowBlur = hovered ? 20 : 5;
      ctx.shadowColor = '#44aaff';

      ctx.fillStyle = hovered ? 'rgba(30, 60, 120, 0.5)' : 'rgba(15, 35, 75, 0.4)';
      this.roundRect(ctx, cx, centerY, cardW, cardH, 16);
      ctx.fill();
      ctx.strokeStyle = hovered ? '#44aaff' : 'rgba(60, 140, 220, 0.3)';
      ctx.lineWidth = hovered ? 2 : 1;
      this.roundRect(ctx, cx, centerY, cardW, cardH, 16);
      ctx.stroke();
      ctx.restore();

      // Icon
      ctx.font = '64px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(formIcons[formId] || '🐟', cx + cardW / 2, centerY + 80);

      // Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Arial, "PingFang SC"';
      ctx.fillText(formData.name, cx + cardW / 2, centerY + 120);

      // English name
      ctx.fillStyle = 'rgba(180, 220, 255, 0.5)';
      ctx.font = '12px Arial';
      ctx.fillText(formData.english, cx + cardW / 2, centerY + 140);

      // Size multiplier
      ctx.fillStyle = '#88ddff';
      ctx.font = '14px Arial';
      ctx.fillText(`体型 x${formData.sizeMul}`, cx + cardW / 2, centerY + 170);

      // Description
      ctx.fillStyle = 'rgba(180, 220, 255, 0.6)';
      ctx.font = '13px Arial, "PingFang SC"';
      ctx.fillText(formData.desc, cx + cardW / 2, centerY + 200);

      // Clickable area
      this.abilityCards.push({
        x: cx, y: centerY, w: cardW, h: cardH, value: formId,
      });
    }
  }

  _drawAbilitySelection(ctx, frame, player, evolutionData) {
    const choices = evolutionData.choices;
    const cardW = 240;
    const cardH = 180;
    const gap = 30;
    const totalW = choices.length * cardW + (choices.length - 1) * gap;
    const startX = (this.w - totalW) / 2;
    const centerY = this.h / 2 - 10;

    this.abilityCards = [];

    for (let i = 0; i < choices.length; i++) {
      const abId = choices[i];
      const info = getAbilityDisplayInfo(abId);
      const def = ABILITIES[abId];
      const cx = startX + i * (cardW + gap);

      // Card
      ctx.save();
      const hovered = this._hoveredCard === i;
      ctx.shadowBlur = hovered ? 20 : 5;
      ctx.shadowColor = info.isGeneral ? '#44dd88' : '#ff8844';

      const bgColor = hovered
        ? (info.isGeneral ? 'rgba(30, 100, 60, 0.4)' : 'rgba(100, 50, 20, 0.4)')
        : 'rgba(15, 35, 75, 0.4)';
      ctx.fillStyle = bgColor;
      this.roundRect(ctx, cx, centerY, cardW, cardH, 16);
      ctx.fill();

      const borderColor = info.isGeneral ? '#44dd88' : '#ff8844';
      ctx.strokeStyle = hovered ? borderColor : 'rgba(60, 140, 220, 0.3)';
      ctx.lineWidth = hovered ? 2 : 1;
      this.roundRect(ctx, cx, centerY, cardW, cardH, 16);
      ctx.stroke();
      ctx.restore();

      // Ability icon
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(info.icon, cx + cardW / 2, centerY + 60);

      // Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Arial, "PingFang SC"';
      ctx.fillText(info.name, cx + cardW / 2, centerY + 95);

      // Description
      ctx.fillStyle = 'rgba(180, 220, 255, 0.7)';
      ctx.font = '14px Arial, "PingFang SC"';
      ctx.fillText(info.desc, cx + cardW / 2, centerY + 125);

      // Type label
      ctx.fillStyle = info.isGeneral ? 'rgba(68, 221, 136, 0.5)' : 'rgba(255, 136, 68, 0.5)';
      ctx.font = '11px Arial';
      ctx.fillText(info.isGeneral ? '通用能力' : '形态专属', cx + cardW / 2, centerY + 150);

      this.abilityCards.push({
        x: cx, y: centerY, w: cardW, h: cardH, value: abId,
      });
    }
  }

  // ---- 游戏结束画面 ----
  drawGameOver(player, frame) {
    const ctx = this.ctx;

    // Dark overlay
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.w, this.h);

    // Game over text
    const titleY = this.h * 0.22;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff4466';
    ctx.fillStyle = '#ff4466';
    ctx.font = 'bold 48px Arial, "PingFang SC"';
    ctx.textAlign = 'center';
    ctx.fillText('💀 游戏结束', this.w / 2, titleY);
    ctx.restore();

    // Stats panel
    const panelX = this.w / 2 - 160;
    const panelY = this.h * 0.30;
    const panelW = 320;

    ctx.fillStyle = 'rgba(8, 20, 48, 0.8)';
    this.roundRect(ctx, panelX, panelY, panelW, 200, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(60, 140, 220, 0.3)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, panelX, panelY, panelW, 200, 16);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Arial, "PingFang SC"';
    ctx.textAlign = 'center';

    const formData = player.getFormData();
    const diffData = DIFFICULTY[player.difficulty];

    const stats = [
      `最终形态：${formData.name}`,
      `总得分：${player.totalScore}`,
      `吞噬数：${player.totalEaten || 0}`,
      `进化次数：${player.evolutionCount || 0}`,
      `难度：${diffData.icon} ${diffData.label}`,
    ];

    let sy = panelY + 35;
    for (const s of stats) {
      ctx.fillStyle = 'rgba(200, 230, 255, 0.8)';
      ctx.fillText(s, this.w / 2, sy);
      sy += 30;
    }

    // High score
    const highScoreKey = `deepEvoHighScore_${player.difficulty}`;
    const prevHigh = parseInt(localStorage.getItem(highScoreKey) || '0');
    if (player.totalScore > prevHigh) {
      localStorage.setItem(highScoreKey, player.totalScore);
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ffdd44';
      ctx.fillStyle = '#ffdd44';
      ctx.font = 'bold 22px Arial, "PingFang SC"';
      ctx.fillText('🎉 新纪录！', this.w / 2, sy + 20);
      ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(150, 180, 210, 0.5)';
      ctx.font = '14px Arial';
      ctx.fillText(`最高记录：${prevHigh}`, this.w / 2, sy + 20);
    }

    // Buttons
    const btnY = this.h * 0.78;
    const btnGap = 30;
    const btnW = 180;
    const btnH = 50;
    const totalBtnW = btnW * 2 + btnGap;
    const btnStartX = (this.w - totalBtnW) / 2;

    // Retry button
    this._drawButton(ctx, btnStartX, btnY, btnW, btnH, '🔄 再来一局');
    this._retryBtnRect = { x: btnStartX, y: btnY, w: btnW, h: btnH };

    // Menu button
    this._drawButton(ctx, btnStartX + btnW + btnGap, btnY, btnW, btnH, '🏠 返回主页');
    this._menuBtnRect = { x: btnStartX + btnW + btnGap, y: btnY, w: btnW, h: btnH };
  }

  _drawButton(ctx, x, y, w, h, text) {
    ctx.save();
    ctx.fillStyle = 'rgba(30, 60, 120, 0.5)';
    this.roundRect(ctx, x, y, w, h, 25);
    ctx.fill();
    ctx.strokeStyle = 'rgba(60, 140, 220, 0.4)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, x, y, w, h, 25);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial, "PingFang SC"';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + w / 2, y + h / 2 + 6);
    ctx.restore();
  }

  // ---- 进化过渡动画 ----
  drawEvolutionTransition(frame, player, newForm) {
    const ctx = this.ctx;
    const progress = Math.min(frame / 60, 1);
    const formData = EVOLUTION_FORMS[newForm];

    if (frame < 30) {
      // Flash
      const alpha = (30 - frame) / 30;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
      ctx.fillRect(0, 0, this.w, this.h);
    }

    // Name reveal
    if (frame > 20) {
      ctx.save();
      const reveal = Math.min((frame - 20) / 30, 1);
      ctx.globalAlpha = reveal;

      ctx.shadowBlur = 30;
      ctx.shadowColor = '#ffdd44';
      ctx.fillStyle = '#ffdd44';
      ctx.font = 'bold 42px Arial, "PingFang SC"';
      ctx.textAlign = 'center';
      ctx.fillText(`⚡ ${formData.name} !`, this.w / 2, this.h / 2);
      ctx.restore();

      ctx.fillStyle = 'rgba(180, 220, 255, 0.6)';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(formData.english, this.w / 2, this.h / 2 + 35);

      ctx.fillStyle = 'rgba(180, 220, 255, 0.4)';
      ctx.font = '14px Arial, "PingFang SC"';
      ctx.fillText(formData.desc, this.w / 2, this.h / 2 + 60);
    }

    return frame >= 80; // done
  }

  // ---- 交互处理 ----
  handleClick(mx, my, gameState, player, evolutionSystemState) {
    // Menu screen clicks
    if (gameState === 'MENU') {
      // Difficulty selection
      if (this._difficultyButtons) {
        for (const btn of this._difficultyButtons) {
          if (mx >= btn.cx && mx <= btn.cx + btn.cardW &&
              my >= btn.cy && my <= btn.cy + btn.cardH) {
            this.selectedDifficulty = btn.key;
            return { action: 'selectDifficulty', value: btn.key };
          }
        }
      }
      // Start button
      if (this._startBtnRect &&
          mx >= this._startBtnRect.x && mx <= this._startBtnRect.x + this._startBtnRect.w &&
          my >= this._startBtnRect.y && my <= this._startBtnRect.y + this._startBtnRect.h) {
        return { action: 'startGame', difficulty: this.selectedDifficulty };
      }
    }

    // Evolution screen clicks
    if (gameState === 'EVOLVING') {
      for (const card of this.abilityCards) {
        if (mx >= card.x && mx <= card.x + card.w &&
            my >= card.y && my <= card.y + card.h) {
          return { action: 'selectEvolution', value: card.value };
        }
      }
    }

    // Game over clicks
    if (gameState === 'GAME_OVER') {
      if (this._retryBtnRect &&
          mx >= this._retryBtnRect.x && mx <= this._retryBtnRect.x + this._retryBtnRect.w &&
          my >= this._retryBtnRect.y && my <= this._retryBtnRect.y + this._retryBtnRect.h) {
        return { action: 'retry' };
      }
      if (this._menuBtnRect &&
          mx >= this._menuBtnRect.x && mx <= this._menuBtnRect.x + this._menuBtnRect.w &&
          my >= this._menuBtnRect.y && my <= this._menuBtnRect.y + this._menuBtnRect.h) {
        return { action: 'menu' };
      }
    }

    return null;
  }

  handleMove(mx, my) {
    this._hoveredCard = -1;
    for (let i = 0; i < this.abilityCards.length; i++) {
      const c = this.abilityCards[i];
      if (mx >= c.x && mx <= c.x + c.w && my >= c.y && my <= c.y + c.h) {
        this._hoveredCard = i;
        break;
      }
    }
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
