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

    this._bindEvents();
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
