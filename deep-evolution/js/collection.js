// ==================== 图鉴与成就系统 ====================

class CollectionManager {
  constructor() {
    this.formsDiscovered = {};    // { formId: { frame, score } }
    this.abilitiesUsed = {};      // { abilityId: { frame, form } }
    this.totalEaten = 0;
    this.maxCombo = 0;
    this.evolutionCount = 0;
    this.startTime = 0;
  }

  reset() {
    this.formsDiscovered = {};
    this.abilitiesUsed = {};
    this.totalEaten = 0;
    this.maxCombo = 0;
    this.evolutionCount = 0;
    this.startTime = Date.now();
  }

  discoverForm(formId, score) {
    if (!this.formsDiscovered[formId]) {
      this.formsDiscovered[formId] = { frame: 0, score: score, isNew: true };
      return true;
    }
    this.formsDiscovered[formId].isNew = false;
    return false;
  }

  useAbility(abilityId, formId) {
    if (!this.abilitiesUsed[abilityId]) {
      this.abilitiesUsed[abilityId] = { frame: 0, form: formId, isNew: true };
      return true;
    }
    return false;
  }

  recordEat() {
    this.totalEaten++;
  }

  recordCombo(combo) {
    if (combo > this.maxCombo) this.maxCombo = combo;
  }

  recordEvolution() {
    this.evolutionCount++;
  }

  getPlayTime() {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  // 获取本次收集到的新形态列表
  getNewForms() {
    return Object.entries(this.formsDiscovered)
      .filter(([, v]) => v.isNew)
      .map(([id]) => id);
  }

  // 获取本次使用过的新能力列表
  getNewAbilities() {
    return Object.entries(this.abilitiesUsed)
      .filter(([, v]) => v.isNew)
      .map(([id]) => id);
  }

  // ---- localStorage 持久化 ----
  getHighScore(difficulty) {
    const key = `deepEvoHighScore_${difficulty}`;
    return parseInt(localStorage.getItem(key) || '0');
  }

  setHighScore(difficulty, score) {
    const key = `deepEvoHighScore_${difficulty}`;
    const prev = this.getHighScore(difficulty);
    if (score > prev) {
      localStorage.setItem(key, score);
      return true;
    }
    return false;
  }

  // 全局图鉴（跨局持久化）
  getGlobalForms() {
    try {
      return JSON.parse(localStorage.getItem('deepEvoForms') || '{}');
    } catch (e) {
      return {};
    }
  }

  saveGlobalForms(forms) {
    const global = this.getGlobalForms();
    for (const f of forms) {
      if (!global[f]) {
        global[f] = { firstSeen: Date.now() };
      }
    }
    localStorage.setItem('deepEvoForms', JSON.stringify(global));
  }

  getGlobalAbilities() {
    try {
      return JSON.parse(localStorage.getItem('deepEvoAbilities') || '{}');
    } catch (e) {
      return {};
    }
  }

  saveGlobalAbilities(abilities) {
    const global = this.getGlobalAbilities();
    for (const a of abilities) {
      if (!global[a]) {
        global[a] = { firstUsed: Date.now() };
      }
    }
    localStorage.setItem('deepEvoAbilities', JSON.stringify(global));
  }
}
