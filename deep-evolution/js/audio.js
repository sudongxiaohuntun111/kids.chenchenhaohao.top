// ==================== 音效系统 (Web Audio API，零外部文件) ====================

class AudioManager {
  constructor() {
    this.enabled = CONFIG.AUDIO_ENABLED;
    this.ctx = null;
    this.masterGain = null;
    this.bgOscillator = null;
    this.bgGain = null;
    this.initialized = false;
  }

  // 延迟初始化（需要用户交互后才能创建 AudioContext）
  _ensureContext() {
    if (this.initialized) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      this.enabled = false;
    }
  }

  // 在首次用户交互时初始化
  tryInit() {
    if (!this.enabled) return;
    this._ensureContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // ---- 吞食音效：短促 pop 音 ----
  playEat() {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  // ---- 受伤音效：低沉 buzz ----
  playHurt() {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {}
  }

  // ---- 进化音效：上升音阶 ----
  playEvolve() {
    if (!this.enabled || !this.ctx) return;
    try {
      const notes = [200, 300, 450, 600, 800];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const t = this.ctx.currentTime + i * 0.1;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.15);
      });
    } catch (e) {}
  }

  // ---- 能力激活音效：清脆 chime ----
  playAbility() {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, this.ctx.currentTime + 0.05);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  }

  // ---- 死亡音效：下降音阶 ----
  playDeath() {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 1.0);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.0);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + 1.0);
    } catch (e) {}
  }

  // ---- 背景深海嗡鸣 ----
  startBGM() {
    if (!this.enabled || !this.ctx) return;
    this._ensureContext();
    if (this.bgOscillator) return; // Already playing
    try {
      this.bgOscillator = this.ctx.createOscillator();
      this.bgGain = this.ctx.createGain();
      this.bgOscillator.type = 'sine';
      this.bgOscillator.frequency.value = 60;
      this.bgGain.gain.value = 0.03;
      this.bgOscillator.connect(this.bgGain);
      this.bgGain.connect(this.masterGain);
      this.bgOscillator.start();
    } catch (e) {}
  }

  stopBGM() {
    if (this.bgOscillator) {
      try { this.bgOscillator.stop(); } catch (e) {}
      this.bgOscillator = null;
      this.bgGain = null;
    }
  }
}
