// ==================== 进化系统 ====================

// Check if player should evolve
function checkEvolutionTrigger(player, difficultyConfig) {
  const stage = player.evolutionStage;
  if (stage >= 2) return null; // Max stage

  const threshold = difficultyConfig.evolutionThreshold[stage];
  if (player.evolutionScore >= threshold) {
    // Determine possible evolutions
    const currentForm = player.form;
    const nextForms = EVOLUTION_PATHS[currentForm];

    if (!nextForms || nextForms.length === 0) return null;

    // For stage 0 -> stage 1: pick 3 random from available
    // For stage 1 -> stage 2: only one option
    if (nextForms.length === 1) {
      return { form: nextForms[0], choices: null }; // Will auto-evolve
    }

    // Pick 3 random choices for evolution screen
    const shuffled = [...nextForms].sort(() => Math.random() - 0.5);
    const formChoices = shuffled.slice(0, 3);

    return { form: null, choices: formChoices };
  }
  return null;
}

// Generate 3 ability choices for evolution reward (one per evolution)
function generateAbilityChoices(player, newForm) {
  const choices = [];
  const candidates = [];

  // Add general abilities
  for (const id of GENERAL_ABILITY_IDS) {
    const def = ABILITIES[id];
    if (!def) continue;

    // Check max level
    const currentLevel = player.getAbilityLevel(id);
    if (currentLevel >= def.maxLevel) continue;

    // Weight: prefer abilities player hasn't taken yet
    const weight = currentLevel === 0 ? 10 : 5;
    candidates.push({ id, weight });
  }

  // Add form-specific abilities
  if (newForm) {
    const formSpecific = Object.entries(ABILITIES)
      .filter(([, def]) => def.form === newForm && !def.general);

    for (const [id, def] of formSpecific) {
      const currentLevel = player.getAbilityLevel(id);
      if (currentLevel >= def.maxLevel) continue;
      candidates.push({ id, weight: 15 }); // Higher weight for new form abilities
    }
  }

  // Weighted random selection
  const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return [];

  while (choices.length < 3 && candidates.length > 0) {
    let rand = Math.random() * totalWeight;
    let idx = 0;
    for (let i = 0; i < candidates.length; i++) {
      rand -= candidates[i].weight;
      if (rand <= 0) {
        idx = i;
        break;
      }
    }

    const chosen = candidates[idx];
    choices.push(chosen.id);
    candidates.splice(idx, 1);
  }

  return choices;
}

// Apply a chosen ability to player
function applyAbility(player, abilityId) {
  player.addAbility(abilityId);
}

// Get ability description for display
function getAbilityDisplayInfo(abilityId) {
  const def = ABILITIES[abilityId];
  if (!def) return { name: '未知', icon: '❓', desc: '', level: 0, maxLevel: 1 };

  return {
    name: def.name,
    icon: def.icon,
    desc: def.description,
    level: 1,
    maxLevel: def.maxLevel,
    isGeneral: def.general,
  };
}

// Check if player can activate a special ability
function tryActivateAbility(player, abilityKey, currentFrame) {
  const cdKey = abilityKey.charAt(0).toLowerCase() + abilityKey.slice(1);
  if (player.cooldowns[cdKey] && player.cooldowns[cdKey] > 0) return false;

  const def = ABILITIES[abilityKey];
  if (!def) return false;

  player.cooldowns[cdKey] = def.cooldown * 60; // Convert seconds to frames
  if (def.duration) {
    player.activeEffects[cdKey] = def.duration * 60;
  }

  return true;
}
