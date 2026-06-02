// ==================== 输入系统 ====================

class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = false;
    this.touchX = 0;
    this.touchY = 0;
    this.touching = false;
    this.usingMouse = false;
    this.moveDir = { x: 0, y: 0 };
    this.sprintPressed = false;
    this.mobileControlsRoot = document.getElementById('mobileControls');
    this.isCoarsePointer = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    this.hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.isMobile = this.isCoarsePointer || this.hasTouch;
    this.joystickActive = false;
    this.joystickPointerId = null;
    this.joystickVector = { x: 0, y: 0 };
    this.joystickKnob = null;
    this.joystickBase = null;
    this.sprintButton = null;
    this.abilityButton = null;

    this._bindEvents();
    this._setupMobileControls();
  }

  _bindEvents() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.code] = true;
      if (e.key === 'Shift') this.sprintPressed = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      this.keys[e.code] = false;
      if (e.key === 'Shift') this.sprintPressed = false;
    });

    // Mouse
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) * (CONFIG.WIDTH / rect.width);
      this.mouseY = (e.clientY - rect.top) * (CONFIG.HEIGHT / rect.height);
      this.usingMouse = true;
    });
    this.canvas.addEventListener('mousedown', (e) => {
      this.mouseDown = true;
      this.usingMouse = true;
    });
    this.canvas.addEventListener('mouseup', () => { this.mouseDown = false; });
    this.canvas.addEventListener('mouseleave', () => { this.mouseDown = false; });

    // Touch
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.touchX = (t.clientX - rect.left) * (CONFIG.WIDTH / rect.width);
      this.touchY = (t.clientY - rect.top) * (CONFIG.HEIGHT / rect.height);
      this.touching = true;
      this.usingMouse = false;
    }, { passive: false });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.touchX = (t.clientX - rect.left) * (CONFIG.WIDTH / rect.width);
      this.touchY = (t.clientY - rect.top) * (CONFIG.HEIGHT / rect.height);
    }, { passive: false });
    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.touching = false;
    }, { passive: false });
  }

  _setupMobileControls() {
    if (!this.mobileControlsRoot || !this.isMobile) return;

    this.mobileControlsRoot.innerHTML = `
      <div class="mobile-controls-panel">
        <div class="mobile-joystick" aria-label="移动摇杆">
          <div class="mobile-stick">
            <div class="mobile-knob"></div>
          </div>
          <div class="mobile-stick-label">移动</div>
        </div>
        <div class="mobile-actions">
          <button type="button" class="mobile-action-button sprint-button">⚡ 冲刺</button>
          <button type="button" class="mobile-action-button ability-button">✨ 技能</button>
        </div>
      </div>
    `;

    this.joystickBase = this.mobileControlsRoot.querySelector('.mobile-stick');
    this.joystickKnob = this.mobileControlsRoot.querySelector('.mobile-knob');
    this.sprintButton = this.mobileControlsRoot.querySelector('.sprint-button');
    this.abilityButton = this.mobileControlsRoot.querySelector('.ability-button');

    this._bindJoystickEvents();
    this._bindMobileButtons();
    this._resetJoystick();
  }

  _bindJoystickEvents() {
    if (!this.joystickBase || !this.joystickKnob) return;

    const onDown = (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      this.joystickActive = true;
      this.joystickPointerId = e.pointerId;
      this.joystickBase.setPointerCapture?.(e.pointerId);
      this._updateJoystickFromEvent(e);
    };

    const onMove = (e) => {
      if (!this.joystickActive || this.joystickPointerId !== e.pointerId) return;
      e.preventDefault();
      this._updateJoystickFromEvent(e);
    };

    const onUp = (e) => {
      if (this.joystickPointerId !== null && this.joystickPointerId !== e.pointerId) return;
      e.preventDefault();
      this._resetJoystick();
    };

    this.joystickBase.addEventListener('pointerdown', onDown, { passive: false });
    this.joystickBase.addEventListener('pointermove', onMove, { passive: false });
    this.joystickBase.addEventListener('pointerup', onUp, { passive: false });
    this.joystickBase.addEventListener('pointercancel', onUp, { passive: false });
    this.joystickBase.addEventListener('lostpointercapture', onUp, { passive: false });
  }

  _bindMobileButtons() {
    if (!this.sprintButton || !this.abilityButton) return;

    const releaseSprint = () => {
      this.sprintPressed = false;
      this.sprintButton.classList.remove('is-active');
    };

    this.sprintButton.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.sprintPressed = true;
      this.sprintButton.classList.add('is-active');
      this.sprintButton.setPointerCapture?.(e.pointerId);
    }, { passive: false });
    this.sprintButton.addEventListener('pointerup', (e) => {
      e.preventDefault();
      releaseSprint();
    }, { passive: false });
    this.sprintButton.addEventListener('pointercancel', releaseSprint);
    this.sprintButton.addEventListener('lostpointercapture', releaseSprint);

    const fireAbility = (e) => {
      e.preventDefault();
      this.abilityButton.classList.add('is-active');
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'e',
        code: 'KeyE',
        bubbles: true,
      });
      window.dispatchEvent(keyEvent);
      window.setTimeout(() => this.abilityButton.classList.remove('is-active'), 120);
    };

    this.abilityButton.addEventListener('pointerdown', fireAbility, { passive: false });
    this.abilityButton.addEventListener('click', (e) => e.preventDefault());
  }

  _updateJoystickFromEvent(e) {
    if (!this.joystickBase || !this.joystickKnob) return;
    const rect = this.joystickBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const radius = Math.max(1, rect.width / 2 - 14);
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamped = dist > radius ? radius / dist : 1;
    const nx = (dx / radius) * clamped;
    const ny = (dy / radius) * clamped;
    this.joystickVector.x = Math.max(-1, Math.min(1, nx));
    this.joystickVector.y = Math.max(-1, Math.min(1, ny));

    const knobRadius = Math.min(18, radius * 0.46);
    this.joystickKnob.style.transform = `translate(-50%, -50%) translate(${this.joystickVector.x * radius * 0.62}px, ${this.joystickVector.y * radius * 0.62}px)`;
    this.joystickKnob.style.width = `${knobRadius * 2}px`;
    this.joystickKnob.style.height = `${knobRadius * 2}px`;
  }

  _resetJoystick() {
    this.joystickActive = false;
    this.joystickPointerId = null;
    this.joystickVector.x = 0;
    this.joystickVector.y = 0;
    if (this.joystickKnob) {
      this.joystickKnob.style.transform = 'translate(-50%, -50%)';
    }
  }

  getMoveDirection(playerX, playerY) {
    let dx = 0, dy = 0;

    // Keyboard
    if (this.keys['w'] || this.keys['arrowup']) dy = -1;
    if (this.keys['s'] || this.keys['arrowdown']) dy = 1;
    if (this.keys['a'] || this.keys['arrowleft']) dx = -1;
    if (this.keys['d'] || this.keys['arrowright']) dx = 1;

    // Mouse follow (only when holding mouse button)
    if (this.usingMouse && this.mouseDown) {
      const mx = this.mouseX - playerX;
      const my = this.mouseY - playerY;
      const dist = Math.sqrt(mx * mx + my * my);
      if (dist > 10) {
        dx = mx / dist;
        dy = my / dist;
      }
    }

    // Touch drag
    if (this.touching) {
      const tx = this.touchX - playerX;
      const ty = this.touchY - playerY;
      const dist = Math.sqrt(tx * tx + ty * ty);
      if (dist > 15) {
        dx = tx / dist;
        dy = ty / dist;
      }
    }

    // Mobile virtual joystick
    if (this.joystickActive) {
      dx = this.joystickVector.x;
      dy = this.joystickVector.y;
    }

    // Normalize
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      dx /= len;
      dy /= len;
    }

    return { x: dx, y: dy };
  }

  isSprinting() {
    return this.sprintPressed || (this.touching && this.keys['shift']);
  }

  // Check for key just pressed (used for UI navigation)
  isKeyDown(key) {
    return this.keys[key] === true;
  }
}
