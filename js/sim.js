// Lei tai duel simulation: a circular platform, posture-based melee combat.
// The fighter and humanoid foes share one move set: strike, heavy, guard (block / parry), kick, roll.
// Foes are grouped into combat roles (how they fight) and each has its own passive and active ability.
// World origin is the ring centre. Deterministic for a given seed + controller.

const W = 256, H = 144;
const R = 92;
const DT = 1 / 60;

const PARRY_WIN = 0.16;       // guard pressed this recently when a hit lands = parry
const GUARD_REPRESS = 0.35;   // re-pressing guard faster than this gives no parry window (no mashing)
const POSTURE_MAX = 100;      // default posture cap; the fighter's can be changed
const ENERGY_COST = { strike: 10, heavy: 22, kick: 18, roll: 20 };
const PARRY_ENERGY = 25;      // a parry refunds this much energy
const DEFAULT_FIGHTER = { hp: 100, energy: 100, energyRegen: 18, posture: 100 };
const STUN_TIME = 1.6;
const STUN_DMG = 1.5;         // damage multiplier against a posture-broken target
const COMBO_GAP = 1.2;
const COMBO_STEP = 0.02, COMBO_CAP = 0.30;

const BASE_MOVES = {
  strike: { id: 'strike', kind: 'melee', wind: 0.14, recover: 0.22, range: 15, dmg: 10, blockPosture: 12, hitPosture: 6, parryPosture: 22, kb: 40 },
  heavy: { id: 'heavy', kind: 'melee', wind: 0.42, recover: 0.38, range: 17, dmg: 22, blockPosture: 0, hitPosture: 16, parryPosture: 38, kb: 110, breaksGuard: true },
  kick: { id: 'kick', kind: 'melee', wind: 0.16, recover: 0.32, range: 16, dmg: 4, hitPosture: 28, kb: 230, ignoresGuard: true },
};

const P = { speed: 70, r: 5, kickCd: 0.9, rollTime: 0.22, rollSpeed: 200, rollCd: 0.7 };

function moveSet(over = {}) {
  const m = {};
  for (const k in BASE_MOVES) m[k] = { ...BASE_MOVES[k], ...(over[k] || {}) };
  return m;
}

// ---------- combat roles: the habit every member shares ----------
// aggr: attack frequency; heavyP/kickP: move choice; blockP/parryP: how they defend your wind-ups;
// react: reaction time; counterP: chance to jab into your heavy wind-up.
const ROLES = {
  bruiser: {
    name: 'Bruisers', habit: 'Rush in and keep the pressure on. Chain strikes, throw heavies at your guard, rarely defend.',
    ai: 'press', humanoid: true, aggr: 0.85, heavyP: 0.3, kickP: 0.1, blockP: 0.15, parryP: 0.1, react: 0.32, counterP: 0.15, chainP: 0.45, maxChain: 2,
  },
  duelist: {
    name: 'Duelists', habit: 'Hold their reach and circle. Parry and counter your wind-ups, punish whiffs.',
    ai: 'duel', humanoid: true, aggr: 0.65, heavyP: 0.3, kickP: 0.12, blockP: 0.5, parryP: 0.55, react: 0.2, counterP: 0.35, chainP: 0.4, maxChain: 2,
  },
  guardian: {
    name: 'Guardians', habit: 'Guard always up, advance slowly, soak posture, counter after blocking. Break them with heavies and kicks.',
    ai: 'duel', humanoid: true, shield: true, counterOnBlock: true, aggr: 0.5, heavyP: 0.35, kickP: 0.15, blockP: 0.5, parryP: 0.45, react: 0.22, counterP: 0.15, chainP: 0.25, maxChain: 1,
  },
  trickster: {
    name: 'Tricksters', habit: 'Erratic footwork. Teleport, dash, strike from odd angles, then run.',
    ai: 'trick', humanoid: true, aggr: 0.75, heavyP: 0.2, kickP: 0.15, blockP: 0.3, parryP: 0.35, react: 0.22, counterP: 0.35, chainP: 0.45, maxChain: 3,
  },
  marksman: {
    name: 'Marksmen', habit: 'Keep max range and kite. Reposition when you close in. Shots are telegraphed and can be parried back.',
    ai: 'kite', near: 75, far: 125, humanoid: true, aggr: 0.4, heavyP: 0, kickP: 0.4, blockP: 0.2, parryP: 0.1, react: 0.3, counterP: 0.1,
  },
  caster: {
    name: 'Casters', habit: 'Hang back, control the stage with unblockable zones and summons, flee when pressed.',
    ai: 'kite', near: 85, far: 130, flee: true, humanoid: true, aggr: 0.3, heavyP: 0, kickP: 0.2, blockP: 0.15, parryP: 0.1, react: 0.3, counterP: 0,
  },
  colossus: {
    name: 'Colossi', habit: 'Huge, slow, never flinch. Area attacks you have to move out of, and a constant ring-out threat.',
    ai: 'press', humanoid: false, noFlinch: true, aggr: 0.55,
  },
  beast: {
    name: 'Summoned beasts', habit: 'Called in by the Druid.',
    ai: 'press', humanoid: false, aggr: 0.6,
  },
};

const foe = (role, o) => ({ ...ROLES[role], role, moves: moveSet(), specials: [], ...o });

const ENEMY_TYPES = {
  // ---- bruisers ----
  bandit: foe('bruiser', {
    name: 'Bandit', hp: 50, r: 5, speed: 46, mass: 1, postureMul: 1.1, aggr: 0.65, cheapShot: true,
    moves: moveSet({ strike: { wind: 0.2 }, heavy: { wind: 0.5 } }),
    passive: ['Cheap Shot', 'Kicks far more when you hold guard.'],
    active: ['Rush Tackle', 'A short charge that shoves and drains posture.'],
    specials: [{ id: 'tackle', kind: 'pounce', minRange: 20, maxRange: 60, wind: 0.45, recover: 0.6, dmg: 8, kb: 150, lunge: 220, lungeTime: 0.25, cd: 4, blockPosture: 30, hitPosture: 20, parryPosture: 30 }],
  }),
  berserker: foe('bruiser', {
    name: 'Berserker', hp: 80, r: 6, speed: 44, mass: 1.5, postureMul: 0.9, bloodrage: true,
    moves: moveSet({ strike: { dmg: 12 }, heavy: { dmg: 26, range: 19 } }),
    passive: ['Bloodrage', 'Hits harder as its HP drops; cannot be flinched below half HP.'],
    active: ['Whirlwind', 'A 3-hit spin that breaks guard.'],
    specials: [{ id: 'whirl', kind: 'slam', radius: 22, hits: 3, interval: 0.28, wind: 0.5, recover: 0.8, dmg: 9, kb: 60, cd: 5, breaksGuard: true, hitPosture: 10, parryPosture: 20 }],
  }),
  werewolf: foe('bruiser', {
    name: 'Werewolf', hp: 75, r: 6, speed: 56, mass: 1.4, postureMul: 0.9, regen: true,
    moves: moveSet({ strike: { dmg: 11, wind: 0.16 } }),
    passive: ['Feral Regen', 'Slowly heals, and heals more when it lands a hit.'],
    active: ['Maul Lunge', 'A pounce that breaks guard.'],
    specials: [{ id: 'maul', kind: 'pounce', minRange: 18, maxRange: 70, wind: 0.4, recover: 0.6, dmg: 16, kb: 120, lunge: 240, lungeTime: 0.3, cd: 3, breaksGuard: true, hitPosture: 20, parryPosture: 40 }],
  }),
  zombie: foe('bruiser', {
    name: 'Zombie', hp: 70, r: 5, speed: 42, mass: 1.2, postureMul: 1, humanoid: false, undying: true, aggr: 0.85, chainP: 0.4, maxChain: 2,
    moves: moveSet({ strike: { dmg: 15, wind: 0.28 } }),
    passive: ['Undying', 'Gets back up once at 30% HP unless finished by a posture break or ring-out.'],
    active: ['Grab & Bite', 'An unblockable grab that drains HP.'],
    specials: [{ id: 'bite', kind: 'melee', range: 13, wind: 0.45, recover: 0.6, dmg: 17, heal: 12, kb: 20, hitPosture: 18, cd: 2.5, unblockable: true }],
  }),
  oni: foe('bruiser', {
    name: 'Oni', hp: 110, r: 7, speed: 40, mass: 2.2, postureMul: 0.7, aggr: 0.8, heavyP: 0.45, kickP: 0.05, chainP: 0.3, maxChain: 1,
    moves: moveSet({ strike: { dmg: 15, range: 19, wind: 0.3, kb: 90, blockPosture: 18 }, heavy: { dmg: 32, range: 21, wind: 0.6, kb: 170 }, kick: { dmg: 6, hitPosture: 32 } }),
    passive: ['Kanabo', 'An iron club: slow swings that crush a guard and send you flying.'],
    active: ['Demon Rage', 'Super armor for 4s: cannot be flinched, takes 45% less damage, moves faster. Also a three-swing club combo and a ground-cracking smash.'],
    specials: [
      { id: 'onirage', kind: 'armor', maxRange: 90, wind: 0.5, recover: 0.2, dur: 4, dr: 0.45, haste: 0.15, cd: 10 },
      { id: 'clubcombo', kind: 'flurry', reach: 22, range: 22, arc: 0.9, hits: 3, interval: 0.38, step: 40, wind: 0.45, recover: 0.7, dmg: 12, kb: 70, blockPosture: 22, hitPosture: 12, parryPosture: 30, cd: 5,
        finisher: { dmg: 24, kb: 220, breaksGuard: true, hitPosture: 26 } },
      { id: 'onismash', kind: 'slam', radius: 26, wind: 0.8, recover: 0.9, dmg: 22, kb: 180, cd: 6, breaksGuard: true, hitPosture: 22, parryPosture: 40, variant: 'quake' },
    ],
  }),
  mutant: foe('bruiser', {
    name: 'Mutant', hp: 95, r: 6, speed: 44, mass: 1.6, postureMul: 0.9, humanoid: false, mutates: true, aggr: 0.8,
    moves: moveSet({ strike: { dmg: 12, range: 15, wind: 0.24 }, heavy: { dmg: 24, range: 16 } }),
    passive: ['Unstable Genes', 'Every 20% of health it loses, it grows a random mutation: an extra arm, bone spikes, acid blood, a tentacle, a carapace, a second maw, a toxic sac or extra legs.'],
    active: ['Lunge', 'A lurching pounce. Its mutations add a tentacle lash and a toxic spew.'],
    specials: [{ id: 'mlunge', kind: 'pounce', minRange: 18, maxRange: 65, wind: 0.42, recover: 0.6, dmg: 13, kb: 120, lunge: 230, lungeTime: 0.28, cd: 3.5, hitPosture: 18, parryPosture: 30 }],
  }),

  // ---- duelists ----
  samurai: foe('duelist', {
    name: 'Samurai', hp: 72, r: 5, speed: 44, mass: 1.2, postureMul: 0.85, iaido: true,
    moves: moveSet({ strike: { range: 20, dmg: 13 }, heavy: { range: 22, dmg: 26 } }),
    passive: ['Iaido Stance', 'The first strike after standing still is faster and stronger.'],
    active: ['Iai Dash-Cut', 'Crosses the gap in one cut. Parryable.'],
    specials: [{ id: 'iai', kind: 'pounce', minRange: 22, maxRange: 75, wind: 0.75, recover: 0.8, dmg: 20, kb: 120, lunge: 300, lungeTime: 0.28, cd: 3.2, breaksGuard: true, hitPosture: 25, parryPosture: 50 }],
  }),
  fencer: foe('duelist', {
    name: 'Fencer', hp: 60, r: 5, speed: 52, mass: 1, postureMul: 1, riposte: true, parryP: 0.65, chainP: 0.55, maxChain: 3,
    moves: moveSet({ strike: { range: 20, dmg: 11, wind: 0.12 }, heavy: { range: 22, dmg: 20 } }),
    passive: ['Riposte', 'After parrying you, an instant free counter-thrust.'],
    active: ['Fleche', 'A very fast long lunge.'],
    specials: [{ id: 'fleche', kind: 'pounce', minRange: 25, maxRange: 80, wind: 0.35, recover: 0.5, dmg: 14, kb: 50, lunge: 320, lungeTime: 0.22, cd: 2.8, hitPosture: 10, blockPosture: 15, parryPosture: 30 }],
  }),
  spearmaster: foe('duelist', {
    name: 'Spear Master', hp: 70, r: 5, speed: 44, mass: 1.1, postureMul: 0.85, reach: true, aggr: 0.75,
    moves: moveSet({ strike: { range: 30, dmg: 15, wind: 0.2 }, heavy: { range: 32, dmg: 26 } }),
    passive: ['Reach', 'The longest melee range; keeps you at the tip of the spear.'],
    active: ['Sweeping Dragon', 'A 360-degree sweep that crushes a held guard.'],
    specials: [{ id: 'sweep', kind: 'slam', radius: 30, wind: 0.55, recover: 0.6, dmg: 14, kb: 100, cd: 3.5, blockPosture: 38, hitPosture: 20, parryPosture: 30 }],
  }),
  cultivator: foe('duelist', {
    name: 'Sword Cultivator', hp: 65, r: 5, speed: 46, mass: 1, postureMul: 0.9, swordQi: true,
    moves: moveSet({ strike: { range: 18, dmg: 12 } }),
    passive: ['Sword Qi', 'Its strikes send a short slash wave.'],
    active: ['Flying Swords', 'Three orbiting swords fire one by one. Parryable.'],
    specials: [{ id: 'swords', kind: 'swords', minRange: 25, maxRange: 200, count: 3, wind: 0.5, recover: 0.4, dmg: 10, cd: 5 }],
  }),
  boxer: foe('duelist', {
    name: 'Boxer', hp: 70, r: 5, speed: 58, mass: 1, postureMul: 0.95, momentum: true, slipCounter: true, dodgeP: 0.45, kickP: 0, heavyP: 0.25, parryP: 0.3, blockP: 0.35, counterP: 0.45, aggr: 0.85, chainP: 0.6, maxChain: 3,
    moves: moveSet({ strike: { dmg: 8, range: 13, wind: 0.11, recover: 0.16, kb: 20, hitPosture: 7 }, heavy: { dmg: 18, range: 14, wind: 0.32, kb: 90, hitPosture: 16 } }),
    passive: ['Momentum', 'Slips your attacks and counterpunches. Every punch it lands makes the next faster and harder (up to 10 stacks); it cools off when it stops landing.'],
    active: ['Rush', 'With 4+ momentum it spends it all on a flurry of punches ending in an uppercut. Also a body blow that goes through a guard.'],
    specials: [
      { id: 'rush', kind: 'flurry', minMomentum: 4, reach: 18, range: 14, arc: 0.7, hits: 5, interval: 0.1, step: 70, wind: 0.25, recover: 0.6, dmg: 6, kb: 15, hitPosture: 6, blockPosture: 10, parryPosture: 20, cd: 4, consume: 'momentum',
        finisher: { id: 'uppercut', dmg: 18, kb: 200, hitPosture: 30, breaksGuard: true } },
      { id: 'bodyblow', kind: 'melee', range: 13, wind: 0.22, recover: 0.4, dmg: 9, kb: 30, hitPosture: 28, ignoresGuard: true, cd: 3 },
    ],
  }),
  reaper: foe('duelist', {
    name: 'Scythe Reaper', hp: 76, r: 6, speed: 46, mass: 1.2, postureMul: 0.85, cleave: true, soulHarvest: true, aggr: 0.7,
    moves: moveSet({ strike: { range: 24, dmg: 12, wind: 0.22 }, heavy: { range: 26, dmg: 24, wind: 0.5 } }),
    passive: ['Grim Reach', 'Its scythe sweeps a wide arc and reaps a little health from every hit.'],
    active: ['Reaping Hook', 'Hooks you and drags you straight into a sweeping combo that ends in a full spin. Also throws a crescent of soul energy.'],
    specials: [
      { id: 'reaphook', kind: 'shoot', proj: 'scythehook', shots: 1, speed: 250, dmg: 8, minRange: 28, maxRange: 130, wind: 0.45, recover: 0.35, cd: 5, pull: true, reap: true, life: 0.7 },
      { id: 'reap', kind: 'flurry', reach: 26, range: 24, arc: 1.25, hits: 4, interval: 0.3, step: 55, wind: 0.4, recover: 0.7, dmg: 11, kb: 50, hitPosture: 10, blockPosture: 18, parryPosture: 28, cd: 5,
        finisher: { id: 'deathspin', arc: 3.2, range: 28, dmg: 18, kb: 170, hitPosture: 24, breaksGuard: true } },
      { id: 'crescent', kind: 'shoot', proj: 'crescent', shots: 1, speed: 150, dmg: 13, radius: 6, minRange: 30, maxRange: 160, wind: 0.5, recover: 0.4, cd: 4, pierce: true, life: 1.4, hitPosture: 12 },
    ],
  }),

  // ---- guardians ----
  paladin: foe('guardian', {
    name: 'Paladin', hp: 85, r: 6, speed: 32, mass: 1.8, postureMul: 0.6,
    moves: moveSet({ strike: { dmg: 12, range: 18 }, heavy: { dmg: 26, range: 20 }, kick: { dmg: 8, hitPosture: 32 } }),
    passive: ['Holy Shield', 'Blocks from the front automatically while idle.'],
    active: ['Smite', 'An overhead blow that leaves an unblockable holy burst.'],
    specials: [{ id: 'smite', kind: 'melee', range: 20, wind: 0.6, recover: 0.6, dmg: 20, kb: 100, cd: 4.5, breaksGuard: true, hitPosture: 18, parryPosture: 40,
      burst: { r: 14, delay: 0.35, dmg: 10, variant: 'smite' } }],
  }),
  buddhist: foe('guardian', {
    name: 'Buddhist', hp: 80, r: 5, speed: 46, mass: 1.3, postureMul: 0.6, shield: false, parryP: 0.6, blockP: 0.75, aggr: 0.75, heavyP: 0.4,
    moves: moveSet({ strike: { dmg: 13 }, heavy: { dmg: 26 }, kick: { hitPosture: 32 } }),
    passive: ['Iron Body', 'Takes 40% less posture damage.'],
    active: ['Palm of Buddha', 'Fires a giant golden palm that shoves you toward the edge.'],
    specials: [{ id: 'palm', kind: 'shoot', proj: 'palm', shots: 1, speed: 115, radius: 9, life: 2.2, minRange: 12, maxRange: 170, wind: 0.6, recover: 0.6, dmg: 18, kb: 260, cd: 3.5, blockPosture: 32, hitPosture: 24 }],
  }),
  taichi: foe('guardian', {
    name: 'Tai Chi Master', hp: 85, r: 5, speed: 46, mass: 1.2, postureMul: 0.7, shield: false, redirect: true, parryP: 0.7, blockP: 0.7, aggr: 0.68, heavyP: 0.4,
    passive: ['Redirect', 'Its parries knock you off balance (heavy posture damage to you).'],
    active: ['Push Hands', 'Catches your heavy and throws you toward the edge.'],
    moves: moveSet({ strike: { dmg: 14 }, heavy: { dmg: 26 } }),
    specials: [{ id: 'push', kind: 'melee', range: 14, wind: 0.22, recover: 0.5, dmg: 10, kb: 280, pushOut: true, hitPosture: 35, cd: 2.5, unblockable: true, vsHeavy: true }],
  }),
  cyborg: foe('guardian', {
    name: 'Combat Cyborg', hp: 100, r: 6, speed: 36, mass: 2, postureMul: 0.6, plating: true,
    moves: moveSet({ strike: { dmg: 12 }, heavy: { dmg: 24 } }),
    passive: ['Plating', 'Strikes do not flinch it; only heavies and kicks do.'],
    active: ['Rocket Fist', 'A long-range punch projectile.'],
    specials: [{ id: 'rocket', kind: 'shoot', minRange: 35, maxRange: 200, wind: 0.5, recover: 0.4, dmg: 14, shots: 1, speed: 120, proj: 'rocket', cd: 2.6 }],
  }),
  crab: foe('guardian', {
    name: 'Crab Warrior', hp: 95, r: 7, speed: 48, mass: 2.4, postureMul: 0.6, shield: false, shell: true, molts: true, ai: 'crab', blockP: 0.4, parryP: 0.4, aggr: 0.6,
    moves: moveSet({ strike: { dmg: 12, range: 16, wind: 0.2 }, heavy: { dmg: 24, range: 18 } }),
    passive: ['Shell', 'Takes half damage unless caught mid-attack (wind-up or recovery), and scuttles sideways. At 35% health it molts: heals, gets faster and hits harder, but the shell is gone.'],
    active: ['Pincer Grip', 'An unblockable grab that crushes your posture, then hurls you toward the edge. Also bubbles that slow and a spinning shell.'],
    specials: [
      { id: 'pincer', kind: 'melee', closeIn: true, range: 13, wind: 0.5, recover: 0.6, dmg: 6, kb: 0, cd: 5, unblockable: true, grab: { hold: 0.8, dmg: 12, kb: 240, hitPosture: 32, pushOut: true } },
      { id: 'shellspin', kind: 'slam', radius: 20, hits: 4, interval: 0.22, wind: 0.45, recover: 0.7, dmg: 7, kb: 70, cd: 6, hitPosture: 8, parryPosture: 20, variant: 'water' },
      { id: 'bubbles', kind: 'shoot', proj: 'bubble', shots: 4, spread: 0.22, speed: 95, dmg: 5, minRange: 25, maxRange: 140, wind: 0.4, recover: 0.4, cd: 3.5, slow: 1.6, life: 2.2, radius: 3 },
    ],
  }),

  // ---- tricksters ----
  ninja: foe('trickster', {
    name: 'Ninja', hp: 48, r: 5, speed: 62, mass: 0.9, postureMul: 1.1, evasive: true,
    moves: moveSet({ strike: { dmg: 11, wind: 0.11 } }),
    passive: ['Evasive', 'Often rolls away from your heavies.'],
    active: ['Vanish', 'Reappears behind you and strikes; also throws shuriken.'],
    specials: [
      { id: 'vanish', kind: 'vanish', minRange: 35, maxRange: 200, wind: 0.3, recover: 0, cd: 4 },
      { id: 'stars', kind: 'shoot', minRange: 40, maxRange: 160, wind: 0.35, recover: 0.3, dmg: 8, shots: 3, spread: 0.18, speed: 160, proj: 'star', cd: 2 },
    ],
  }),
  drunk: foe('trickster', {
    name: 'Drunken Master', hp: 72, r: 5, speed: 48, mass: 1.1, postureMul: 0.8, sway: true, parryP: 0.5,
    moves: moveSet({ strike: { dmg: 11 }, heavy: { dmg: 22 } }),
    passive: ['Sway', 'Lurches at random; some of your strikes miss it.'],
    active: ['Wine Spray', 'A short unblockable fire cone.'],
    specials: [{ id: 'spray', kind: 'cone', range: 30, angle: 0.6, wind: 0.4, recover: 0.5, dmg: 12, kb: 40, hitPosture: 10, cd: 4, unblockable: true, variant: 'fire' }],
  }),
  vampire: foe('trickster', {
    name: 'Vampire', hp: 80, r: 5, speed: 52, mass: 1.1, postureMul: 0.9, lifesteal: true,
    moves: moveSet({ strike: { dmg: 12 }, heavy: { dmg: 24 } }),
    passive: ['Lifesteal', 'Heals for half the damage it deals.'],
    active: ['Bat Dash', 'Turns into bats, cannot be hit mid-dash, then strikes.'],
    specials: [{ id: 'bats', kind: 'pounce', minRange: 25, maxRange: 90, wind: 0.35, recover: 0.5, dmg: 14, kb: 60, lunge: 260, lungeTime: 0.35, cd: 3.5, untargetable: true, hitPosture: 12, parryPosture: 30 }],
  }),
  djinn: foe('trickster', {
    name: 'Djinn', hp: 70, r: 5, speed: 44, mass: 1, postureMul: 1, floating: true,
    moves: moveSet({ strike: { dmg: 12, range: 17 } }),
    passive: ['Floating', 'Immune to ring-outs and kick knockback.'],
    active: ['Sand Vortex', 'A whirlpool that pulls you in, then bursts.'],
    specials: [{ id: 'vortex', kind: 'vortex', maxRange: 160, wind: 0.6, recover: 0.5, radius: 30, duration: 2.2, pull: 45, dmg: 14, cd: 6 }],
  }),
  spider: foe('trickster', {
    name: 'Spider Demon', hp: 78, r: 7, speed: 60, mass: 1.4, postureMul: 0.85, humanoid: false, wallCrawler: true, aggr: 0.7,
    moves: moveSet({ strike: { dmg: 11, range: 14, wind: 0.18, poison: 3, poisonT: 2 } }),
    passive: ['Wall Crawler', 'Knocked off the stage, it climbs straight back up. Its bites are venomous.'],
    active: ['Web and Cocoon', 'Shoots webs that root you and lays web traps; wraps anyone caught in a web in a cocoon. Climbs over the edge of the stage and bursts up beside you.'],
    specials: [
      { id: 'cocoon', kind: 'melee', closeIn: true, range: 14, wind: 0.35, recover: 0.5, dmg: 8, kb: 0, cd: 5, unblockable: true, vsRooted: true, cocoon: 1.4, poison: 4, poisonT: 3 },
      { id: 'ambush', kind: 'climb', minRange: 35, maxRange: 220, wind: 0.3, recover: 0.6, dmg: 16, radius: 14, root: 0.8, kb: 90, hitPosture: 18, cd: 10 },
      { id: 'webtrap', kind: 'lob', proj: 'webball', minRange: 20, maxRange: 160, wind: 0.4, recover: 0.4, flight: 0.6, height: 22, cd: 5,
        land: { r: 4, dmg: 0, zone: { variant: 'web', r: 16, life: 7 } } },
      { id: 'webshot', kind: 'shoot', proj: 'web', shots: 1, speed: 190, dmg: 4, minRange: 22, maxRange: 150, wind: 0.35, recover: 0.35, cd: 3.2, root: 1.1, radius: 3 },
    ],
  }),
  shifter: foe('trickster', {
    name: 'Shapeshifter', hp: 76, r: 5, speed: 50, mass: 1.1, postureMul: 0.9, shifts: true,
    moves: moveSet({ strike: { dmg: 11 }, heavy: { dmg: 22 } }),
    passive: ['Thousand Skins', 'Spends most of the fight as a beast: an enhanced form with its own body, reach and moves, chosen at random.'],
    active: ['Shift', 'Becomes a Thunder Tiger, Ironhide Bear, Venom Serpent, Storm Roc or Ember Drake, with 50% more health and 35% more damage, and shifts into a different one every 6 seconds, healing 15% each time.'],
    specials: [
      { id: 'shift', kind: 'shift', maxRange: 999, wind: 0.5, recover: 0.2, cd: 3 },
      { id: 'feral', kind: 'pounce', minRange: 18, maxRange: 70, wind: 0.35, recover: 0.5, dmg: 12, kb: 90, lunge: 250, lungeTime: 0.26, cd: 3, hitPosture: 15, parryPosture: 30 },
    ],
  }),
  magician: foe('trickster', {
    name: 'Magician', hp: 62, r: 5, speed: 48, mass: 1, postureMul: 1, substitute: true, parryP: 0.4,
    moves: moveSet({ strike: { dmg: 10, wind: 0.14 } }),
    passive: ['Now You See Me', 'The first hit every 7 seconds strikes a decoy: it was never there. At half health the act ends and its true form appears, a nine-tailed kitsune.'],
    active: ['Mirror Mirage', 'Splits into identical decoys and shuffles among them. Also turns you into a rabbit for a moment, and throws razor cards.'],
    specials: [
      { id: 'mirage', kind: 'decoy', maxRange: 160, wind: 0.5, recover: 0.3, count: 2, cd: 9 },
      { id: 'hex', kind: 'shoot', proj: 'hex', shots: 1, speed: 150, dmg: 2, minRange: 20, maxRange: 150, wind: 0.5, recover: 0.4, cd: 7, poly: 1.6, radius: 3 },
      { id: 'cards', kind: 'shoot', proj: 'card', shots: 3, spread: 0.14, speed: 190, dmg: 6, minRange: 25, maxRange: 150, wind: 0.3, recover: 0.35, cd: 2.2 },
    ],
    trueForm: { name: 'Kitsune', color: '#7fd0ff', sprite: 'kitsune', humanoid: false, speed: 58, r: 6, heal: 0.25,
      moves: { strike: { dmg: 12, range: 14, wind: 0.14 } },
      specials: [
        { id: 'foxfire', kind: 'shoot', proj: 'foxfire', shots: 3, spread: 0.5, speed: 110, dmg: 8, minRange: 20, maxRange: 170, wind: 0.4, recover: 0.4, cd: 2.6, homing: 1.8, burn: true, burnVariant: 'foxfire' },
        { id: 'charm', kind: 'shoot', proj: 'heart', shots: 1, speed: 140, dmg: 2, minRange: 20, maxRange: 140, wind: 0.45, recover: 0.4, cd: 7, charm: 1.4, radius: 3 },
        { id: 'tails', kind: 'slam', radius: 22, wind: 0.4, recover: 0.5, dmg: 10, kb: 110, hits: 2, interval: 0.25, cd: 4, hitPosture: 12, variant: 'foxfire' },
        { id: 'mirage', kind: 'decoy', maxRange: 160, wind: 0.4, recover: 0.3, count: 3, cd: 8 },
      ] },
  }),

  // ---- marksmen ----
  gunslinger: foe('marksman', {
    name: 'Gunslinger', hp: 48, r: 5, speed: 42, mass: 1, postureMul: 1.2,
    passive: ['Quickdraw', 'Its first shot after you close in is instant.'],
    active: ['Fan the Hammer', 'A six-shot spread.'],
    specials: [
      { id: 'quick', kind: 'shoot', minRange: 0, maxRange: 60, wind: 0.1, recover: 0.4, dmg: 11, shots: 1, speed: 200, cd: 4 },
      { id: 'fan', kind: 'shoot', minRange: 30, maxRange: 150, wind: 0.7, recover: 0.6, dmg: 7, shots: 6, spread: 0.12, speed: 170, cd: 4 },
      { id: 'shot', kind: 'shoot', minRange: 30, maxRange: 170, wind: 0.45, recover: 0.35, dmg: 11, shots: 2, spread: 0.04, cd: 1.4 },
    ],
  }),
  sniper: foe('marksman', {
    name: 'Sniper', hp: 50, r: 5, speed: 40, mass: 1, postureMul: 1.2, near: 100, far: 150, flee: true,
    passive: ['Steady Aim', 'A long laser-sight tell, then a shot that breaks guard. Parry it back.'],
    active: ['Trap Mine', 'Plants unblockable mines.'],
    specials: [
      { id: 'mine', kind: 'mine', maxRange: 200, wind: 0.4, recover: 0.4, radius: 12, dmg: 22, arm: 0.7, life: 12, cd: 4 },
      { id: 'aim', kind: 'shoot', minRange: 30, maxRange: 240, wind: 1.0, recover: 0.5, dmg: 30, shots: 1, speed: 320, laser: true, breaksGuard: true, cd: 2.2 },
    ],
  }),
  archer: foe('marksman', {
    name: 'Archer', hp: 74, r: 5, speed: 52, mass: 1, postureMul: 1, near: 65, far: 130, dodgeP: 0.3, kickP: 0.15, parryP: 0.35, blockP: 0.35, aggr: 0.55,
    moves: moveSet({ strike: { dmg: 12, range: 13, wind: 0.09, recover: 0.18 } }),
    passive: ['Hunting Knife', 'Up close it fights with a fast knife, then backflips away and shoots as it lands.'],
    active: ['Trick Arrows', 'A charged arrow that pierces and breaks guard; net, explosive and splitting arrows in turn; an arcing volley that rains down on you.'],
    specials: [
      { id: 'backflip', kind: 'flip', near: 16, maxRange: 999, wind: 0.12, recover: 0.3, dmg: 12, cd: 4 },
      { id: 'powershot', kind: 'shoot', proj: 'bigarrow', shots: 1, speed: 380, dmg: 28, minRange: 30, maxRange: 240, wind: 0.85, recover: 0.4, laser: true, breaksGuard: true, pierce: true, kb: 150, hitPosture: 25, cd: 4.5, radius: 3 },
      { id: 'trick', kind: 'trick', minRange: 25, maxRange: 180, wind: 0.4, recover: 0.35, cd: 3 },
      { id: 'volley', kind: 'lob', proj: 'arrowlob', count: 6, scatter: 26, minRange: 40, maxRange: 220, flight: 0.9, height: 40, wind: 0.6, recover: 0.4, cd: 6, land: { r: 7, dmg: 10, kb: 30, hitPosture: 8 } },
      { id: 'arrow', kind: 'shoot', proj: 'arrow', shots: 1, speed: 260, dmg: 10, minRange: 30, maxRange: 200, wind: 0.32, recover: 0.3, cd: 1.3 },
    ],
  }),

  // ---- casters ----
  talisman: foe('caster', {
    name: 'Talisman Master', hp: 48, r: 5, speed: 34, mass: 1, postureMul: 1.2, ward: true, blinks: true, blinkCd: 6,
    moves: moveSet({ strike: { dmg: 6 } }),
    passive: ['Ward', 'A talisman absorbs the first hit every 8 seconds.'],
    active: ['Sigil Field', 'Delayed unblockable blasts, plus homing talismans.'],
    specials: [
      { id: 'sigil', kind: 'sigil', maxRange: 180, wind: 0.5, recover: 0.5, dmg: 22, radius: 15, delay: 0.85, cd: 2.8, unblockable: true },
      { id: 'orb', kind: 'orb', maxRange: 180, minRange: 30, wind: 0.5, recover: 0.4, dmg: 14, cd: 1.4 },
    ],
  }),
  druid: foe('caster', {
    name: 'Druid', hp: 58, r: 5, speed: 36, mass: 1, postureMul: 1.1,
    passive: ["Nature's Call", 'Summons a tiger, bear or bunny companion.'],
    active: ['Wood Magic', 'Roots that pin you in place, then thorns.'],
    specials: [
      { id: 'call', kind: 'summon', wind: 0.8, recover: 0.6, cd: 6, energy: 35, minions: ['tiger', 'bear', 'bunny'], pick: 1, cap: 2 },
      { id: 'roots', kind: 'sigil', maxRange: 180, wind: 0.45, recover: 0.5, dmg: 14, radius: 16, delay: 0.7, root: 1.6, cd: 3.2, unblockable: true, variant: 'roots' },
    ],
  }),
  necromancer: foe('caster', {
    name: 'Necromancer', hp: 58, r: 5, speed: 34, mass: 1, postureMul: 1.1, raiseDead: true,
    passive: ['Raise Dead', 'Fallen foes come back as zombies.'],
    active: ['Bone Spikes', 'A line of unblockable spikes.'],
    specials: [
      { id: 'spikes', kind: 'sigil', pattern: 'line', count: 7, spacing: 12, step: 0.07, maxRange: 200, wind: 0.45, recover: 0.5, dmg: 18, radius: 8, delay: 0.5, cd: 3, unblockable: true, variant: 'spikes' },
      { id: 'raise', kind: 'summon', wind: 0.9, recover: 0.6, cd: 8, energy: 35, minions: ['zombie'], pick: 1, cap: 2 },
    ],
  }),
  angel: foe('caster', {
    name: 'Angel', hp: 60, r: 5, speed: 40, mass: 1, postureMul: 1, floating: true, blessing: true,
    passive: ['Blessing', 'Heals its allies, and flies (no ring-out).'],
    active: ['Holy Lance', 'An unblockable column strike from the sky.'],
    specials: [
      { id: 'lance', kind: 'sigil', pattern: 'scatter', count: 2, maxRange: 200, wind: 0.4, recover: 0.5, dmg: 24, radius: 12, delay: 0.85, cd: 2.6, unblockable: true, variant: 'lance' },
      { id: 'light', kind: 'orb', maxRange: 180, minRange: 30, wind: 0.5, recover: 0.4, dmg: 12, cd: 1.8 },
    ],
  }),
  alchemist: foe('caster', {
    name: 'Alchemist', hp: 60, r: 5, speed: 38, mass: 1, postureMul: 1.1, volatile: true,
    moves: moveSet({ strike: { dmg: 7 } }),
    passive: ['Elixir, Volatile', 'Drinks a healing elixir once when hurt. When it falls, the flasks on its belt break open around it.'],
    active: ['Flask Toss', 'Lobs fire, venom, frost, acid and explosive flasks: a burst where they land, and whatever they leave behind.'],
    specials: [
      { id: 'elixir', kind: 'elixir', maxRange: 999, wind: 0.6, recover: 0.3, heal: 0.3, cd: 99 },
      { id: 'barrage', kind: 'flask', count: 3, scatter: 24, minRange: 30, maxRange: 170, wind: 0.6, recover: 0.5, cd: 8 },
      { id: 'flask', kind: 'flask', count: 1, minRange: 20, maxRange: 170, wind: 0.4, recover: 0.35, cd: 1.6 },
    ],
  }),
  gravmage: foe('caster', {
    name: 'Gravity Mage', hp: 62, r: 5, speed: 38, mass: 1.5, postureMul: 1, floating: true, horizon: true,
    moves: moveSet({ strike: { dmg: 8 } }),
    passive: ['Event Horizon', 'Floats, and bends incoming projectiles away from itself.'],
    active: ['Gravity Control', 'A well that drags you in, a repulse that hurls you toward the edge, a field of crushing gravity that slows you and stops your rolls, and a lift that holds you helpless in the air, then slams you down.'],
    specials: [
      { id: 'repulse', kind: 'slam', radius: 26, wind: 0.4, recover: 0.5, dmg: 6, kb: 320, cd: 5, unblockable: true, hitPosture: 18, variant: 'repulse' },
      { id: 'levitate', kind: 'sigil', maxRange: 170, wind: 0.45, recover: 0.4, dmg: 0, kb: 1, radius: 11, delay: 0.75, cd: 7, unblockable: true, variant: 'levitate', lift: 1.0, liftDmg: 18 },
      { id: 'crush', kind: 'zone', maxRange: 170, wind: 0.5, recover: 0.4, cd: 8, zone: { variant: 'heavy', r: 26, life: 4.5 } },
      { id: 'gravwell', kind: 'vortex', variant: 'gravwell', maxRange: 170, wind: 0.5, recover: 0.4, radius: 26, duration: 1.4, pull: 90, dmg: 16, cd: 5 },
    ],
  }),
  formation: foe('caster', {
    name: 'Formation Master', hp: 64, r: 5, speed: 36, mass: 1, postureMul: 1,
    moves: moveSet({ strike: { dmg: 8 } }),
    passive: ['Array Mastery', 'Raises a barrier array: allies inside take 40% less damage and enemy projectiles shatter against it.'],
    active: ['Eight Trigrams', 'Draws a bagua formation around you that detonates everywhere except its one life gate. Also a sealing array that locks you in place, and a formation that swaps your places.'],
    specials: [
      { id: 'wardarray', kind: 'zone', self: true, maxRange: 140, wind: 0.6, recover: 0.4, cd: 11, zone: { variant: 'wardarray', r: 28, life: 6, ally: true } },
      { id: 'bagua', kind: 'formation', maxRange: 170, wind: 0.5, recover: 0.4, radius: 30, delay: 1.5, dmg: 24, kb: 90, cd: 6 },
      { id: 'seal', kind: 'sigil', maxRange: 170, wind: 0.4, recover: 0.4, dmg: 8, radius: 12, delay: 0.75, cd: 4.5, unblockable: true, variant: 'seal', root: 1.4 },
      { id: 'swap', kind: 'swap', minRange: 40, maxRange: 170, wind: 0.4, recover: 0.4, delay: 0.75, cd: 10 },
    ],
  }),

  // ---- colossi ----
  demon: foe('colossus', {
    name: 'Demon', hp: 150, r: 8, speed: 30, mass: 3, postureMul: 0.5, aura: true,
    moves: moveSet({ strike: { dmg: 14, range: 18, wind: 0.5, kb: 70 } }),
    passive: ['Hellfire Aura', 'Standing close burns you.'],
    active: ['Ground Slam', 'An unblockable slam, and fire breath.'],
    specials: [
      { id: 'slam', kind: 'slam', radius: 28, wind: 0.9, recover: 1.0, dmg: 26, kb: 220, cd: 4, unblockable: true },
      { id: 'breath', kind: 'cone', range: 40, angle: 0.7, wind: 0.7, recover: 0.8, dmg: 16, kb: 60, hitPosture: 10, cd: 5, unblockable: true, variant: 'fire' },
    ],
  }),
  eastdragon: foe('colossus', {
    name: 'Eastern Dragon', hp: 150, r: 9, speed: 34, mass: 4, postureMul: 0.45, floating: true, ai: 'serpent', orbit: 60,
    moves: moveSet({ strike: { dmg: 14, range: 20, wind: 0.45, kb: 90 } }),
    passive: ['Serpentine', 'Flies in arcs and cannot be ringed out.'],
    active: ['Thunder Call', 'Lightning strikes marked spots on the stage.'],
    specials: [{ id: 'thunder', kind: 'sigil', pattern: 'scatter', count: 4, maxRange: 999, wind: 0.6, recover: 0.6, dmg: 18, radius: 12, delay: 1.0, cd: 5, unblockable: true, variant: 'lightning' }],
  }),
  westdragon: foe('colossus', {
    name: 'Western Dragon', hp: 170, r: 10, speed: 28, mass: 5, postureMul: 0.4, scales: true,
    moves: moveSet({ strike: { dmg: 16, range: 22, wind: 0.5, kb: 100 } }),
    passive: ['Scales', 'Strikes do half damage; heavies do full.'],
    active: ['Fire Breath', 'A sweeping fire cone, and a wing gust that shoves you toward the edge.'],
    specials: [
      { id: 'gust', kind: 'cone', range: 60, angle: 0.9, wind: 0.6, recover: 0.6, dmg: 2, kb: 280, hitPosture: 15, cd: 6, unblockable: true, variant: 'wind' },
      { id: 'breath', kind: 'cone', range: 50, angle: 0.55, wind: 0.8, recover: 0.9, dmg: 18, kb: 60, hitPosture: 10, cd: 4.5, unblockable: true, variant: 'fire' },
    ],
  }),
  golem: foe('colossus', {
    name: 'Stone Golem', hp: 190, r: 10, scale: 1.3, speed: 22, mass: 6, postureMul: 0.35, harden: true, ai: 'golem',
    moves: moveSet({ strike: { dmg: 18, range: 20, wind: 0.55, kb: 140 } }),
    passive: ['Stoneskin', 'Standing still, it hardens: each layer (up to 5) cuts damage and posture damage by 12%. Moving sheds layers; heavies and kicks crack them off.'],
    active: ['Boulder Toss', 'Hurls boulders that crash down where you stood and leave rubble. Up close, an unblockable stomp.'],
    specials: [
      { id: 'stomp', kind: 'slam', radius: 30, wind: 0.85, recover: 0.9, dmg: 22, kb: 200, cd: 4.5, unblockable: true, hitPosture: 25, variant: 'quake' },
      { id: 'boulder', kind: 'lob', proj: 'boulder', minRange: 30, maxRange: 200, flight: 0.85, height: 34, wind: 0.75, recover: 0.6, cd: 2.8,
        land: { r: 15, dmg: 20, kb: 110, hitPosture: 20, zone: { variant: 'rubble', r: 12, life: 3.5 } } },
    ],
  }),
  hydra: foe('colossus', {
    name: 'Hydra', hp: 180, r: 10, scale: 1.25, speed: 28, mass: 5, postureMul: 0.45, hydra: { heads: 3, max: 7 },
    moves: moveSet({ strike: { dmg: 14, range: 18, wind: 0.5, kb: 90 } }),
    passive: ['Many Heads', 'Each head bites, spits acid or breathes fire on its own. Hurt it enough and a head is severed, but the stump grows back as two (up to 7). A heavy or fire on an open stump seals it for good; with no heads left it takes 50% more damage.'],
    active: ['Tail Sweep', 'A wide, low sweep of the tail.'],
    specials: [{ id: 'tailsweep', kind: 'slam', radius: 28, wind: 0.6, recover: 0.8, dmg: 16, kb: 170, cd: 5, hitPosture: 20, parryPosture: 30, variant: 'water' }],
  }),
  phoenix: foe('colossus', {
    name: 'Phoenix', hp: 130, r: 8, scale: 1.15, speed: 40, mass: 2.5, postureMul: 0.6, floating: true, rebirth: 2, phoenix: true, ai: 'circle', orbit: 46,
    moves: moveSet({ strike: { dmg: 13, range: 16, wind: 0.3, kb: 80 } }),
    passive: ['Rebirth', 'Burns hotter the longer it fights. When it falls it becomes an egg: break it within 4 seconds or it rises again, reborn hotter (twice).'],
    active: ['Fire Feathers', 'Volleys of burning feathers, a flaring wing of fire, a blazing dive, and at high heat a sunburst.'],
    specials: [
      { id: 'sunburst', kind: 'slam', minHeat: 60, radius: 32, wind: 0.8, recover: 0.8, dmg: 22, kb: 180, cd: 6, unblockable: true, hitPosture: 20, variant: 'sun', fire: true },
      { id: 'phoenixdive', kind: 'pounce', minRange: 25, maxRange: 110, wind: 0.5, recover: 0.6, dmg: 16, kb: 140, lunge: 300, lungeTime: 0.32, cd: 4, breaksGuard: true, hitPosture: 20, parryPosture: 40, trail: 'hellfire', fire: true },
      { id: 'flare', kind: 'cone', range: 40, angle: 0.65, wind: 0.5, recover: 0.6, dmg: 14, kb: 60, hitPosture: 10, cd: 4, unblockable: true, variant: 'fire', fire: true },
      { id: 'feathers', kind: 'shoot', proj: 'feather', shots: 3, spread: 0.2, speed: 170, dmg: 8, minRange: 25, maxRange: 170, wind: 0.4, recover: 0.4, cd: 2.4, burn: true, fire: true },
    ],
  }),

  // ---- the Druid's companions ----
  tiger: foe('beast', {
    name: 'Tiger', hp: 60, r: 6, speed: 58, mass: 1.5, postureMul: 0.8, ai: 'circle', orbit: 46, summon: true,
    moves: moveSet({ strike: { dmg: 11, range: 13 } }),
    specials: [{ id: 'pounce', kind: 'pounce', maxRange: 60, minRange: 15, wind: 0.45, recover: 0.6, dmg: 16, kb: 150, lunge: 230, lungeTime: 0.32, cd: 1.6, breaksGuard: true, hitPosture: 20, parryPosture: 40 }],
  }),
  bear: foe('beast', {
    name: 'Bear', hp: 80, r: 7, speed: 34, mass: 2.2, postureMul: 0.6, summon: true,
    moves: moveSet({ strike: { dmg: 18, range: 16, wind: 0.4, kb: 130 } }),
  }),
  bunny: foe('beast', {
    name: 'Bunny', hp: 14, r: 3, speed: 72, mass: 0.4, postureMul: 2, summon: true, ai: 'circle', orbit: 20,
    moves: moveSet({ strike: { dmg: 3, range: 10, wind: 0.12 } }),
  }),
  // the Magician's decoys: they look exactly like the real one and pop at the first touch
  mirage: foe('trickster', {
    name: 'Mirage', hp: 1, r: 5, speed: 48, mass: 1, postureMul: 1, summon: true, decoy: true, noClaim: true, lifespan: 9, aggr: 0.5, sprite: 'magician',
    moves: moveSet({ strike: { dmg: 3 } }),
    specials: [{ id: 'cards', kind: 'shoot', proj: 'card', shots: 2, spread: 0.14, speed: 190, dmg: 2, minRange: 25, maxRange: 150, wind: 0.3, recover: 0.35, cd: 3 }],
  }),
};

// ---------- the worlds' own: foes for the worlds of the jar that had too few ----------
Object.assign(ENEMY_TYPES, {
  // Red Dust Temple
  staffmonk: foe('duelist', {
    name: 'Staff Monk', hp: 66, r: 5, speed: 48, mass: 1.1, postureMul: 0.9, parryP: 0.45, chainP: 0.5, maxChain: 2,
    moves: moveSet({ strike: { dmg: 10, range: 24, wind: 0.18 }, heavy: { dmg: 20, range: 26 } }),
    passive: ['Long Reach', 'A staff outreaches a fist: it strikes from further away than you can.'],
    active: ['Sweeping Forms', 'A wide staff sweep that knocks you back, and a long thrust that crosses the gap.'],
    specials: [
      { id: 'staffsweep', kind: 'slam', radius: 26, wind: 0.45, recover: 0.6, dmg: 10, kb: 120, cd: 4, hitPosture: 14, parryPosture: 24, variant: 'staffquake' },
      { id: 'staffthrust', kind: 'pounce', minRange: 22, maxRange: 70, wind: 0.4, recover: 0.5, dmg: 12, kb: 90, lunge: 260, lungeTime: 0.24, cd: 3.5, hitPosture: 16, parryPosture: 30 },
    ],
  }),
  arhat: foe('guardian', {
    name: 'Bronze Arhat', hp: 115, r: 6, speed: 34, mass: 3, postureMul: 0.4, dr: 0.25,
    moves: moveSet({ strike: { dmg: 13, range: 16, wind: 0.3 }, heavy: { dmg: 26, range: 18, wind: 0.55 } }),
    passive: ['Golden Bell', 'A body of bronze: takes 25% less damage and barely moves when struck.'],
    active: ['Bell Toll', 'Strikes its chest like a temple bell; the toll throws everyone around it back. Also an iron palm that breaks guard.'],
    specials: [
      { id: 'belltoll', kind: 'slam', radius: 30, wind: 0.7, recover: 0.8, dmg: 12, kb: 200, cd: 6, unblockable: true, hitPosture: 22, variant: 'quake' },
      { id: 'ironpalm', kind: 'melee', range: 16, wind: 0.5, recover: 0.6, dmg: 18, kb: 140, cd: 4, breaksGuard: true, hitPosture: 26, parryPosture: 40 },
    ],
  }),
  // Night Country
  gargoyle: foe('trickster', {
    name: 'Gargoyle', hp: 78, r: 6, speed: 50, mass: 2, postureMul: 0.6, harden: true, humanoid: false,
    moves: moveSet({ strike: { dmg: 13, range: 15, wind: 0.24 } }),
    passive: ['Perched in Stone', 'Standing still it turns to stone, layer by layer: less damage and posture damage with each. Moving sheds them; heavies and kicks crack them.'],
    active: ['Dive', 'Leaps high and dives onto you, cracking your guard.'],
    specials: [{ id: 'gdive', kind: 'pounce', minRange: 30, maxRange: 110, wind: 0.6, recover: 0.6, dmg: 18, kb: 150, lunge: 320, lungeTime: 0.32, cd: 4, breaksGuard: true, hitPosture: 22, parryPosture: 34 }],
  }),
  ghoul: foe('bruiser', {
    name: 'Ghoul', hp: 44, r: 5, speed: 60, mass: 0.9, postureMul: 1.1, humanoid: false, aggr: 0.9, corpseEater: true,
    moves: moveSet({ strike: { dmg: 9, range: 13, wind: 0.14 } }),
    passive: ['Corpse Eater', 'When anything falls nearby, it feeds: it heals 40% of its health.'],
    active: ['Rend', 'A leaping rake of claws.'],
    specials: [{ id: 'rend', kind: 'pounce', minRange: 15, maxRange: 60, wind: 0.3, recover: 0.5, dmg: 10, kb: 70, lunge: 280, lungeTime: 0.22, cd: 2.6, hitPosture: 12, parryPosture: 24 }],
  }),
  // Myriad Sword Peaks
  disciple: foe('duelist', {
    name: 'Outer Disciple', hp: 40, r: 5, speed: 46, mass: 1, postureMul: 1.1, parryP: 0.3,
    moves: moveSet({ strike: { dmg: 9, range: 17 } }),
    passive: ['Shared Formation', 'Disciples fly their swords together: when one looses its sword, the others near it follow.'],
    active: ['Flying Sword', 'A single flying sword. Parryable.'],
    specials: [{ id: 'dswords', kind: 'swords', minRange: 25, maxRange: 180, count: 1, wind: 0.5, recover: 0.4, dmg: 8, cd: 4.5, together: true }],
  }),
  // Netherworld Abyss
  imp: foe('trickster', {
    name: 'Imp', hp: 26, r: 3, speed: 66, mass: 0.6, postureMul: 1.4, humanoid: false, evasive: true,
    moves: moveSet({ strike: { dmg: 6, range: 11, wind: 0.12 } }),
    passive: ['Underfoot', 'Small and quick; it slips aside from blows.'],
    active: ['Fire Darts', 'Flicks three little darts of fire.'],
    specials: [{ id: 'firedart', kind: 'shoot', proj: 'magma', shots: 3, spread: 0.25, speed: 170, dmg: 5, minRange: 20, maxRange: 140, wind: 0.35, recover: 0.4, cd: 2.4, burn: true }],
  }),
  hellhound: foe('bruiser', {
    name: 'Hellhound', hp: 54, r: 5, speed: 64, mass: 1.1, postureMul: 1, humanoid: false, aggr: 0.85, fireImmune: true, ai: 'circle', orbit: 30,
    moves: moveSet({ strike: { dmg: 10, range: 13, wind: 0.16 } }),
    passive: ['Born of Fire', 'Fire does not hurt it.'],
    active: ['Burning Bite', 'A lunging bite that sets you burning.'],
    specials: [{ id: 'burnbite', kind: 'pounce', minRange: 14, maxRange: 60, wind: 0.32, recover: 0.5, dmg: 11, kb: 60, lunge: 280, lungeTime: 0.24, cd: 2.8, poison: 4, poisonT: 3, hitPosture: 14, parryPosture: 26 }],
  }),
  // Eastern Isles
  yukionna: foe('caster', {
    name: 'Yuki-onna', hp: 60, r: 5, speed: 40, mass: 1, postureMul: 1,
    moves: moveSet({ strike: { dmg: 9, wind: 0.16 } }),
    passive: ['Winter Breath', 'Everything she touches slows.'],
    active: ['Frost and Mirrors', 'A freezing breath, a ring of ice that bursts under you, and mirrors of ice that look just like her.'],
    specials: [
      { id: 'frostbreath', kind: 'cone', range: 40, angle: 0.6, wind: 0.5, recover: 0.5, dmg: 9, kb: 20, cd: 4, unblockable: true, variant: 'frost', slow: 1.6 },
      { id: 'icering', kind: 'sigil', pattern: 'scatter', count: 3, maxRange: 160, wind: 0.5, recover: 0.4, dmg: 10, radius: 11, delay: 0.9, cd: 6, unblockable: true, variant: 'frost', slow: 1.4 },
      { id: 'icemirror', kind: 'decoy', maxRange: 160, wind: 0.5, recover: 0.3, count: 2, cd: 10 },
    ],
  }),
  tengu: foe('trickster', {
    name: 'Tengu', hp: 64, r: 5, speed: 58, mass: 1, postureMul: 1, blinks: true, dodgeP: 0.3,
    moves: moveSet({ strike: { dmg: 11, range: 15, wind: 0.14 } }),
    passive: ['Mountain Wind', 'Blinks about on gusts of wind.'],
    active: ['Fan Gust and Feathers', 'A great fan gust that throws you toward the edge, and a spread of feather darts.'],
    specials: [
      { id: 'fangust', kind: 'cone', range: 55, angle: 0.8, wind: 0.55, recover: 0.6, dmg: 3, kb: 300, hitPosture: 14, cd: 5, unblockable: true, variant: 'wind' },
      { id: 'featherdarts', kind: 'shoot', proj: 'feather', shots: 4, spread: 0.18, speed: 190, dmg: 6, minRange: 25, maxRange: 160, wind: 0.35, recover: 0.4, cd: 2.8 },
    ],
  }),
  // Timestream
  swarmdrone: foe('beast', {
    name: 'Drone Swarm', hp: 16, r: 3, speed: 70, mass: 0.4, postureMul: 2, humanoid: false, floating: true, ai: 'circle', orbit: 34,
    moves: moveSet({ strike: { dmg: 5, range: 11, wind: 0.12 } }),
    passive: ['Swarm', 'Tiny and fast; they come in fours and take turns.'],
    active: ['Dive', 'Dives at you, then pulls away.'],
    specials: [{ id: 'dronedive', kind: 'pounce', minRange: 20, maxRange: 80, wind: 0.35, recover: 0.6, dmg: 7, kb: 50, lunge: 320, lungeTime: 0.22, cd: 3, hitPosture: 8 }],
  }),
  sentry: foe('marksman', {
    name: 'Sentry Drone', hp: 46, r: 4, speed: 38, mass: 0.8, postureMul: 1.2, humanoid: false, floating: true, near: 90, far: 140,
    passive: ['Hover', 'Floats at range and keeps it.'],
    active: ['Laser and Burst', 'Paints you with a laser sight, then fires a round that breaks guard; also a quick three-round burst.'],
    specials: [
      { id: 'sentrylaser', kind: 'shoot', proj: 'rail', minRange: 30, maxRange: 240, wind: 0.9, recover: 0.5, dmg: 20, shots: 1, speed: 330, laser: true, breaksGuard: true, cd: 3 },
      { id: 'sentryburst', kind: 'shoot', proj: 'plasma', shots: 3, spread: 0.08, speed: 220, dmg: 6, minRange: 20, maxRange: 170, wind: 0.35, recover: 0.4, cd: 2.2 },
    ],
  }),
  chronomancer: foe('caster', {
    name: 'Chronomancer', hp: 58, r: 5, speed: 36, mass: 1, postureMul: 1, chronoRewind: true,
    moves: moveSet({ strike: { dmg: 8, wind: 0.18 } }),
    passive: ['Turn Back', 'Once a fight, when an ally falls near it, it turns the ally\'s clock back: the ally returns at half health.'],
    active: ['Time Mines, Slow Time, Haste', 'Plants mines that freeze whoever steps on them, slows you in a field of slow time, and hastens its allies.'],
    specials: [
      { id: 'timemine', kind: 'mine', maxRange: 200, wind: 0.4, recover: 0.4, radius: 11, dmg: 8, arm: 0.6, life: 12, cd: 4.5, freeze: 1.2 },
      { id: 'slowfield', kind: 'sigil', maxRange: 180, wind: 0.5, recover: 0.4, dmg: 4, radius: 22, delay: 0.8, cd: 6, unblockable: true, variant: 'gravity', slow: 2.4 },
      { id: 'haste', kind: 'hasteallies', radius: 90, dur: 4, wind: 0.4, recover: 0.3, cd: 8 },
    ],
  }),
  glitch: foe('trickster', {
    name: 'Glitch', hp: 56, r: 5, speed: 56, mass: 1, postureMul: 1, blinks: true,
    moves: moveSet({ strike: { dmg: 10, wind: 0.14 } }),
    passive: ['Copy Error', 'It watches what you use.'],
    active: ['Copied', 'Casts the last ability you used, back at you. With nothing to copy, it glitches forward and cuts.'],
    specials: [
      { id: 'glitchcopy', kind: 'copycat', maxRange: 160, wind: 0.5, recover: 0.5, cd: 5 },
      { id: 'glitchcut', kind: 'pounce', minRange: 20, maxRange: 80, wind: 0.3, recover: 0.5, dmg: 12, kb: 60, lunge: 340, lungeTime: 0.2, cd: 3, hitPosture: 14, parryPosture: 26 },
    ],
  }),
  twin: foe('duelist', {
    name: 'Paradox Twin', hp: 60, r: 5, speed: 52, mass: 1, postureMul: 1, paradox: true, parryP: 0.4,
    moves: moveSet({ strike: { dmg: 11, range: 16, wind: 0.15 } }),
    passive: ['Paradox', 'Always two. When one falls, the other brings it back three seconds later, unless both fall within those three seconds.'],
    active: ['Mirror Cut', 'A crossing dash-cut.'],
    specials: [{ id: 'mirrorcut', kind: 'pounce', minRange: 20, maxRange: 75, wind: 0.4, recover: 0.5, dmg: 13, kb: 80, lunge: 300, lungeTime: 0.24, cd: 3.2, hitPosture: 16, parryPosture: 30 }],
  }),
  // Cursed Domain
  flyhead: foe('beast', {
    name: 'Fly Head', hp: 14, r: 3, speed: 68, mass: 0.4, postureMul: 2, humanoid: false, floating: true, ai: 'circle', orbit: 26,
    moves: moveSet({ strike: { dmg: 5, range: 10, wind: 0.12 } }),
    passive: ['Grade Four', 'The smallest curse: a buzzing head with wings. Never alone.'],
    active: ['Bite', 'Darts in to bite.'],
    specials: [{ id: 'flybite', kind: 'pounce', minRange: 14, maxRange: 60, wind: 0.25, recover: 0.5, dmg: 6, kb: 30, lunge: 300, lungeTime: 0.2, cd: 2.4, hitPosture: 6 }],
  }),
  cspirit: foe('bruiser', {
    name: 'Cursed Spirit', hp: 48, r: 5, speed: 54, mass: 1, postureMul: 1, humanoid: false, aggr: 0.85,
    moves: moveSet({ strike: { dmg: 10, range: 14, wind: 0.18 } }),
    passive: ['Grade Three', 'A curse born of a crowd\'s fear. They come in packs.'],
    active: ['Lunge and Spit', 'A lunging grab, and a gob of cursed acid from range that corrodes.'],
    specials: [
      { id: 'cslunge', kind: 'pounce', minRange: 16, maxRange: 65, wind: 0.35, recover: 0.5, dmg: 11, kb: 80, lunge: 260, lungeTime: 0.25, cd: 3, hitPosture: 14, parryPosture: 26 },
      { id: 'csspit', kind: 'shoot', proj: 'acid', shots: 1, speed: 150, dmg: 8, minRange: 30, maxRange: 140, wind: 0.4, recover: 0.4, cd: 3.5, corrode: 2 },
    ],
  }),
  ccorpse: foe('guardian', {
    name: 'Cursed Corpse', hp: 88, r: 6, speed: 32, mass: 2, postureMul: 0.7, humanoid: false, undying: true,
    moves: moveSet({ strike: { dmg: 13, range: 16, wind: 0.32 }, heavy: { dmg: 24, range: 17 } }),
    passive: ['Cursed Core', 'A sorcerer\'s puppet: it gets back up once, unless its core is broken by a posture break or it is thrown off the stage.'],
    active: ['Stitched Fists', 'A heavy two-fisted slam that breaks guard.'],
    specials: [{ id: 'corpseslam', kind: 'slam', radius: 22, wind: 0.6, recover: 0.7, dmg: 16, kb: 140, cd: 4.5, breaksGuard: true, hitPosture: 22, parryPosture: 34, variant: 'quake' }],
  }),
  strawdoll: foe('marksman', {
    name: 'Straw Doll Sorcerer', hp: 52, r: 5, speed: 42, mass: 1, postureMul: 1.1, near: 80, far: 130,
    passive: ['Resonance', 'Every nail that lands stays in you (up to six).'],
    active: ['Nails and Doll', 'Hammers nails at you; then strikes its straw doll, and every nail in you resonates. Nothing blocks it.'],
    specials: [
      { id: 'nails', kind: 'shoot', proj: 'spine', shots: 2, spread: 0.1, speed: 210, dmg: 5, minRange: 20, maxRange: 170, wind: 0.35, recover: 0.4, cd: 2, nail: 1 },
      { id: 'resonance', kind: 'resonance', maxRange: 999, wind: 0.6, recover: 0.5, cd: 5, per: 6 },
    ],
  }),
  cspeech: foe('caster', {
    name: 'Cursed Speech Sorcerer', hp: 54, r: 5, speed: 40, mass: 1, postureMul: 1,
    passive: ['Binding Words', 'Each command costs it health; weakened, it stops speaking.'],
    active: ['"Don\'t move." "Blast away."', 'A spoken command roots you where you stand, or throws you across the stage. Nothing blocks a word.'],
    specials: [
      { id: 'dontmove', kind: 'speech', word: 'DON\'T MOVE', maxRange: 160, wind: 0.5, recover: 0.5, cd: 6, root: 1.3, cost: 0.05 },
      { id: 'blastaway', kind: 'speech', word: 'BLAST AWAY', maxRange: 110, wind: 0.5, recover: 0.5, cd: 7, kb: 330, dmg: 6, cost: 0.06 },
    ],
  }),
  shikigami: foe('beast', {
    name: 'Shikigami Hound', hp: 58, r: 5, speed: 62, mass: 1.1, postureMul: 1, humanoid: false, ai: 'circle', orbit: 32, aggr: 0.85,
    moves: moveSet({ strike: { dmg: 11, range: 13, wind: 0.15 } }),
    passive: ['Ten Shadows', 'Comes in pairs, one light and one dark, and melts into its shadow to close in.'],
    active: ['Shadow Pounce', 'Sinks into its shadow and leaps out at you, breaking guard.'],
    specials: [{ id: 'shadowpounce', kind: 'pounce', minRange: 18, maxRange: 90, wind: 0.4, recover: 0.5, dmg: 14, kb: 90, lunge: 320, lungeTime: 0.25, cd: 3, breaksGuard: true, hitPosture: 18, parryPosture: 30 }],
  }),
  // The Pallid Kingdom
  cultist: foe('caster', {
    name: 'Hastur Cultist', hp: 56, r: 5, speed: 38, mass: 1, postureMul: 1,
    moves: moveSet({ strike: { dmg: 8, wind: 0.18 } }),
    passive: ['Unspeakable', 'It speaks the name, and madness spreads from where it stands.'],
    active: ['The Yellow Sign', 'A sign that burns under you and fills you with fear, and a whispered bolt.'],
    specials: [
      { id: 'yellowsign', kind: 'sigil', maxRange: 170, wind: 0.6, recover: 0.4, dmg: 8, radius: 16, delay: 1.0, cd: 6, unblockable: true, variant: 'seal', fear: 1.3 },
      { id: 'whisper', kind: 'shoot', proj: 'hex', shots: 1, speed: 150, dmg: 9, minRange: 25, maxRange: 160, wind: 0.4, recover: 0.4, cd: 2.6 },
    ],
  }),
  byakhee: foe('bruiser', {
    name: 'Byakhee', hp: 82, r: 7, speed: 54, mass: 1.6, postureMul: 0.8, humanoid: false, floating: true, ai: 'circle', orbit: 48, aggr: 0.75,
    moves: moveSet({ strike: { dmg: 12, range: 16, wind: 0.2 } }),
    passive: ['Between the Stars', 'A winged thing that flies the void; it circles before it strikes.'],
    active: ['Swoop', 'A long swooping dive with claws out.'],
    specials: [{ id: 'swoop', kind: 'pounce', minRange: 30, maxRange: 120, wind: 0.5, recover: 0.6, dmg: 16, kb: 160, lunge: 340, lungeTime: 0.3, cd: 3.5, hitPosture: 20, parryPosture: 32 }],
  }),
  dancer: foe('trickster', {
    name: 'Pallid Dancer', hp: 58, r: 5, speed: 60, mass: 0.9, postureMul: 1, sway: true, blinks: true, dodgeP: 0.35,
    moves: moveSet({ strike: { dmg: 10, wind: 0.13 } }),
    passive: ['Hypnotic Step', 'Sways out of the way of blows.'],
    active: ['Pale Kiss and Turn', 'A pale kiss that draws you helplessly toward her, and a spinning double kick.'],
    specials: [
      { id: 'palekiss', kind: 'shoot', proj: 'heart', shots: 1, speed: 140, dmg: 2, minRange: 20, maxRange: 140, wind: 0.45, recover: 0.4, cd: 7, charm: 1.4, radius: 3 },
      { id: 'spinkick', kind: 'slam', radius: 20, wind: 0.35, recover: 0.5, dmg: 10, kb: 120, hits: 2, interval: 0.2, cd: 3.5, hitPosture: 14 },
    ],
  }),
  pknight: foe('guardian', {
    name: 'Pallid Knight', hp: 100, r: 6, speed: 36, mass: 2.4, postureMul: 0, masked: 3,
    moves: moveSet({ strike: { dmg: 13, range: 18, wind: 0.3 }, heavy: { dmg: 26, range: 20 } }),
    passive: ['The Pallid Mask', 'While its mask is intact its posture can\'t be broken. Three heavies or kicks that land crack it off.'],
    active: ['Tarnished Blade', 'A wide two-handed cleave, twice, that breaks guard.'],
    specials: [{ id: 'tarnished', kind: 'flurry', reach: 20, range: 20, arc: 1.1, hits: 2, interval: 0.4, step: 30, wind: 0.5, recover: 0.7, dmg: 13, kb: 90, cd: 5, breaksGuard: true, hitPosture: 16, parryPosture: 30 }],
  }),
  horror: foe('colossus', {
    name: 'Lake Hali Horror', hp: 170, r: 10, scale: 1.2, speed: 14, mass: 8, postureMul: 0.35,
    moves: moveSet({ strike: { dmg: 16, range: 20, wind: 0.55, kb: 140 } }),
    passive: ['From the Lake', 'Most of it is under the cloud-lake: it barely moves.'],
    active: ['Tentacles', 'Tentacles rise from the lake at the edge of the stage, near you, and drag whatever they catch toward the edge. Up close, a crushing slam.'],
    specials: [
      { id: 'edgetentacles', kind: 'edgetentacles', maxRange: 999, wind: 0.6, recover: 0.5, count: 3, dmg: 14, radius: 12, delay: 0.9, cd: 4.5 },
      { id: 'horrorslam', kind: 'slam', radius: 28, wind: 0.8, recover: 0.9, dmg: 20, kb: 180, cd: 5, unblockable: true, hitPosture: 24, variant: 'quake' },
    ],
  }),
});

// ---------- what the newer foes are made of ----------
// The Shapeshifter's beasts: enhanced forms with their own bodies and moves.
const SHIFT_FORMS = {
  tiger: { name: 'Thunder Tiger', color: '#6fc3ff', sprite: 'sf_tiger', r: 6, mass: 1.6, speed: 66, postureMul: 0.8, humanoid: false, ai: 'circle', orbit: 40,
    moves: { strike: { dmg: 13, range: 14, wind: 0.14 } },
    specials: [
      { id: 'thunderpounce', kind: 'pounce', minRange: 15, maxRange: 75, wind: 0.35, recover: 0.5, dmg: 16, kb: 140, lunge: 300, lungeTime: 0.28, cd: 2.2, breaksGuard: true, hitPosture: 20, parryPosture: 40 },
      { id: 'stormclaw', kind: 'flurry', reach: 16, range: 14, arc: 0.8, hits: 3, interval: 0.14, step: 60, wind: 0.3, recover: 0.5, dmg: 8, kb: 30, hitPosture: 8, cd: 4, finisher: { dmg: 12, kb: 120 } },
      { id: 'tigerbolt', kind: 'sigil', pattern: 'scatter', count: 2, maxRange: 140, wind: 0.4, recover: 0.4, dmg: 14, radius: 10, delay: 0.7, cd: 5, unblockable: true, variant: 'lightning' },
    ] },
  bear: { name: 'Ironhide Bear', color: '#c8ccd2', sprite: 'sf_bear', r: 8, mass: 3.2, speed: 36, postureMul: 0.4, humanoid: false, noFlinch: true, scales: true,
    moves: { strike: { dmg: 20, range: 17, wind: 0.38, kb: 150 } },
    specials: [
      { id: 'bearslam', kind: 'slam', radius: 26, wind: 0.7, recover: 0.8, dmg: 22, kb: 200, cd: 4.5, unblockable: true, hitPosture: 25, variant: 'quake' },
      { id: 'ironmaul', kind: 'flurry', reach: 20, range: 17, arc: 0.9, hits: 2, interval: 0.35, step: 30, wind: 0.45, recover: 0.6, dmg: 14, kb: 80, hitPosture: 15, breaksGuard: true, cd: 4 },
    ] },
  serpent: { name: 'Venom Serpent', color: '#9ad04a', sprite: 'sf_serpent', r: 6, mass: 1.4, speed: 52, postureMul: 0.9, humanoid: false, ai: 'circle', orbit: 34,
    moves: { strike: { dmg: 9, range: 18, wind: 0.16, poison: 3, poisonT: 3 } },
    specials: [
      { id: 'venomspit', kind: 'shoot', proj: 'venom', shots: 3, spread: 0.2, speed: 160, dmg: 6, minRange: 25, maxRange: 150, wind: 0.35, recover: 0.35, cd: 2.5, poison: 4, poisonT: 3 },
      { id: 'fangstrike', kind: 'pounce', minRange: 14, maxRange: 60, wind: 0.3, recover: 0.45, dmg: 12, kb: 40, lunge: 280, lungeTime: 0.2, cd: 2.4, poison: 6, poisonT: 3, hitPosture: 10 },
      { id: 'toxiccloud', kind: 'lob', proj: 'venomball', minRange: 10, maxRange: 140, flight: 0.5, height: 16, wind: 0.4, recover: 0.4, cd: 6, land: { r: 6, dmg: 4, zone: { variant: 'poison', r: 18, life: 4, dps: 5 } } },
    ] },
  roc: { name: 'Storm Roc', color: '#e8f0f8', sprite: 'sf_roc', r: 7, mass: 2, speed: 54, postureMul: 0.8, humanoid: false, floating: true, ai: 'circle', orbit: 50,
    moves: { strike: { dmg: 12, range: 15, wind: 0.2 } },
    specials: [
      { id: 'rocgust', kind: 'cone', range: 55, angle: 0.8, wind: 0.55, recover: 0.6, dmg: 4, kb: 300, hitPosture: 15, cd: 4.5, unblockable: true, variant: 'wind' },
      { id: 'rocdive', kind: 'pounce', minRange: 25, maxRange: 100, wind: 0.45, recover: 0.6, dmg: 18, kb: 160, lunge: 320, lungeTime: 0.3, cd: 3.5, breaksGuard: true, hitPosture: 22, parryPosture: 40 },
      { id: 'stormfeathers', kind: 'shoot', proj: 'feather', shots: 5, spread: 0.16, speed: 180, dmg: 6, minRange: 30, maxRange: 160, wind: 0.4, recover: 0.4, cd: 3 },
    ] },
  drake: { name: 'Ember Drake', color: '#ff5a1a', sprite: 'sf_drake', r: 8, mass: 2.6, speed: 40, postureMul: 0.6, humanoid: false, noFlinch: true,
    moves: { strike: { dmg: 15, range: 18, wind: 0.32, kb: 100 } },
    specials: [
      { id: 'drakebreath', kind: 'cone', range: 44, angle: 0.55, wind: 0.6, recover: 0.7, dmg: 16, kb: 50, hitPosture: 10, cd: 4, unblockable: true, variant: 'fire' },
      { id: 'tailswipe', kind: 'slam', radius: 22, wind: 0.45, recover: 0.6, dmg: 14, kb: 160, cd: 3.5, hitPosture: 18, parryPosture: 30 },
      { id: 'magma', kind: 'lob', proj: 'magma', minRange: 30, maxRange: 150, flight: 0.7, height: 26, wind: 0.5, recover: 0.4, cd: 5, land: { r: 12, dmg: 14, kb: 80, zone: { variant: 'fire', r: 13, life: 3, dps: 6 } } },
    ] },
};

// ---------- the Primordial Forest: wild beasts (the forms Thousand Skins borrows, still wild), dinosaurs, the elves ----------
const wild = (f, scale) => f.specials.map(s => ({ ...s, dmg: s.dmg && Math.round(s.dmg * scale), cd: s.cd * 1.25, ...(s.land ? { land: { ...s.land, dmg: Math.round(s.land.dmg * scale) } } : {}) }));
Object.assign(ENEMY_TYPES, {
  serpent: foe('beast', {
    name: 'Serpent', hp: 52, r: 5, speed: 50, mass: 1.2, postureMul: 0.9, ai: 'circle', orbit: 34, sprite: 'sf_serpent',
    moves: moveSet({ strike: { dmg: 8, range: 16, wind: 0.18, poison: 3, poisonT: 3 } }),
    passive: ['Venom', 'Its bite poisons.'], active: ['Spit and Strike', 'Spits venom from range, lunges with its fangs, and lobs a poison cloud.'],
    specials: wild(SHIFT_FORMS.serpent, 0.75),
  }),
  roc: foe('beast', {
    name: 'Roc', hp: 66, r: 6, speed: 52, mass: 1.8, postureMul: 0.85, floating: true, ai: 'circle', orbit: 52, sprite: 'sf_roc',
    moves: moveSet({ strike: { dmg: 10, range: 15, wind: 0.22 } }),
    passive: ['Sky Hunter', 'Flies, and cannot be ringed out.'], active: ['Gust, Dive, Feathers', 'A gust that shoves you toward the edge, a diving strike, and a spread of feathers.'],
    specials: wild(SHIFT_FORMS.roc, 0.75),
  }),
  drake: foe('colossus', {
    name: 'Ember Drake', hp: 140, r: 7, speed: 36, mass: 2.6, postureMul: 0.55, sprite: 'sf_drake',
    moves: moveSet({ strike: { dmg: 14, range: 18, wind: 0.34, kb: 100 } }),
    passive: ['Hot Blood', 'Its scales shrug off a flinch.'], active: ['Breath, Tail, Magma', 'A fire breath, a tail swipe, and lobbed magma that leaves burning ground.'],
    noFlinch: true, specials: wild(SHIFT_FORMS.drake, 0.8),
  }),
  tortoise: foe('colossus', {
    name: 'Mossback Tortoise', hp: 170, r: 8, speed: 22, mass: 6, postureMul: 0.35, harden: true, ai: 'golem',
    moves: moveSet({ strike: { dmg: 14, range: 18, wind: 0.5, kb: 120 } }),
    passive: ['Mossback', 'Standing still, its shell hardens, layer on layer; moving sheds them, and heavies and kicks crack them.'],
    active: ['Shell Slam, Serpent Tail, Tide', 'Drops its whole weight on the ground, bites with the snake coiled round its tail, and breathes a tide that soaks you.'],
    specials: [
      { id: 'shellslam', kind: 'slam', radius: 26, wind: 0.8, recover: 0.9, dmg: 18, kb: 170, cd: 5, unblockable: true, hitPosture: 22, variant: 'quake' },
      { id: 'tailbite', kind: 'pounce', minRange: 12, maxRange: 50, wind: 0.35, recover: 0.5, dmg: 10, kb: 40, lunge: 220, lungeTime: 0.2, cd: 3, poison: 4, poisonT: 3, hitPosture: 10 },
      { id: 'tide', kind: 'cone', range: 46, angle: 0.7, wind: 0.6, recover: 0.6, dmg: 6, kb: 200, hitPosture: 12, cd: 6, unblockable: true, variant: 'wind', wet: 5 },
    ],
  }),
  raptor: foe('beast', {
    name: 'Raptor', hp: 36, r: 4, speed: 68, mass: 0.9, postureMul: 1.1, ai: 'circle', orbit: 34,
    moves: moveSet({ strike: { dmg: 7, range: 13, wind: 0.12 } }),
    passive: ['Pack Hunter', 'Hunts in packs and circles before it strikes.'], active: ['Leap and Rake', 'A leaping kick with its sickle claw, then a quick flurry.'],
    specials: [
      { id: 'raptorleap', kind: 'pounce', minRange: 18, maxRange: 70, wind: 0.32, recover: 0.5, dmg: 10, kb: 90, lunge: 300, lungeTime: 0.24, cd: 2.4, hitPosture: 14, parryPosture: 30 },
      { id: 'rake', kind: 'flurry', reach: 14, range: 13, arc: 0.8, hits: 3, interval: 0.12, step: 50, wind: 0.25, recover: 0.45, dmg: 4, kb: 20, hitPosture: 6, cd: 4 },
    ],
  }),
  triceratops: foe('colossus', {
    name: 'Triceratops', hp: 160, r: 8, speed: 30, mass: 5, postureMul: 0.45,
    moves: moveSet({ strike: { dmg: 14, range: 18, wind: 0.45, kb: 140 } }),
    passive: ['Frill', 'Hard to stagger from the front.'], active: ['Charge, Horn Toss', 'Lowers its horns and charges through your guard; tosses whatever is close.'],
    specials: [
      { id: 'tricharge', kind: 'pounce', minRange: 30, maxRange: 120, wind: 0.75, recover: 0.8, dmg: 20, kb: 260, lunge: 280, lungeTime: 0.45, cd: 5, breaksGuard: true, hitPosture: 30, parryPosture: 40 },
      { id: 'horntoss', kind: 'slam', radius: 20, wind: 0.5, recover: 0.6, dmg: 12, kb: 220, cd: 3.5, hitPosture: 18 },
    ],
  }),
  trex: foe('colossus', {
    name: 'Tyrant Lizard', hp: 230, r: 9, scale: 1.2, speed: 34, mass: 7, postureMul: 0.35, noFlinch: true,
    moves: moveSet({ strike: { dmg: 18, range: 20, wind: 0.5, kb: 150 } }),
    passive: ['Apex', 'Nothing flinches it.'], active: ['Roar, Crushing Bite, Stomp', 'A roar that sends you running, a lunging bite that breaks guard, and a stomp that shakes the ground.'],
    specials: [
      { id: 'roar', kind: 'cone', range: 60, angle: 0.9, wind: 0.7, recover: 0.6, dmg: 2, kb: 60, hitPosture: 10, cd: 9, unblockable: true, variant: 'wind', fear: 1.2 },
      { id: 'crushbite', kind: 'pounce', minRange: 14, maxRange: 60, wind: 0.6, recover: 0.7, dmg: 26, kb: 160, lunge: 260, lungeTime: 0.28, cd: 3.5, breaksGuard: true, hitPosture: 30, parryPosture: 50 },
      { id: 'tstomp', kind: 'slam', radius: 30, wind: 0.85, recover: 0.8, dmg: 18, kb: 180, cd: 5, unblockable: true, hitPosture: 22, variant: 'quake' },
    ],
  }),
  elfranger: foe('marksman', {
    name: 'Elf Ranger', hp: 60, r: 5, speed: 56, mass: 0.9, postureMul: 1, near: 70, far: 140, dodgeP: 0.4, kickP: 0.1, parryP: 0.3, blockP: 0.3, aggr: 0.5,
    moves: moveSet({ strike: { dmg: 10, range: 13, wind: 0.1, recover: 0.2 } }),
    passive: ['Among the Trees', 'Keeps its distance, and slips out of sight when you close in.'], active: ['Volley', 'Three arrows at once, and a long aimed shot.'],
    specials: [
      { id: 'leafstep', kind: 'vanish', minRange: 0, maxRange: 40, wind: 0.2, recover: 0, cd: 6 },
      { id: 'elfvolley', kind: 'shoot', proj: 'arrow', shots: 3, spread: 0.22, speed: 270, dmg: 7, minRange: 30, maxRange: 200, wind: 0.4, recover: 0.35, cd: 2.4 },
      { id: 'aimedshot', kind: 'shoot', proj: 'bigarrow', shots: 1, speed: 380, dmg: 18, minRange: 40, maxRange: 240, wind: 0.75, recover: 0.4, laser: true, pierce: true, kb: 100, hitPosture: 18, cd: 5, radius: 3 },
    ],
  }),
  elfsentinel: foe('guardian', {
    name: 'Elf Sentinel', hp: 92, r: 5, speed: 44, mass: 1.4, postureMul: 0.7,
    moves: moveSet({ strike: { dmg: 11, range: 24, wind: 0.22 }, heavy: { dmg: 20, range: 26 } }),
    passive: ['Leafshield', 'Holds a shield up, and counters off a block.'], active: ['Spear Line', 'A long spear thrust that crosses the gap, and a sweep that keeps you out.'],
    specials: [
      { id: 'spearline', kind: 'pounce', minRange: 22, maxRange: 72, wind: 0.42, recover: 0.5, dmg: 13, kb: 100, lunge: 260, lungeTime: 0.24, cd: 3.5, hitPosture: 16, parryPosture: 30 },
      { id: 'spearsweep', kind: 'slam', radius: 26, wind: 0.45, recover: 0.6, dmg: 9, kb: 130, cd: 4.5, hitPosture: 14, parryPosture: 24 },
    ],
  }),
  elfspellweaver: foe('caster', {
    name: 'Elf Spellweaver', hp: 54, r: 5, speed: 36, mass: 1, postureMul: 1.1, blessing: true,
    passive: ['Song of Growing', 'Heals nearby allies every second.'], active: ['Roots and Thorns', 'Roots that pin you, and a spray of thorns.'],
    specials: [
      { id: 'elfroots', kind: 'sigil', maxRange: 180, wind: 0.45, recover: 0.5, dmg: 10, radius: 15, delay: 0.75, root: 1.3, cd: 4, unblockable: true, variant: 'roots' },
      { id: 'thorns', kind: 'shoot', proj: 'feather', shots: 4, spread: 0.3, speed: 180, dmg: 5, minRange: 20, maxRange: 160, wind: 0.35, recover: 0.35, cd: 2.6 },
    ],
  }),
  treant: foe('colossus', {
    name: 'Elder Treant', hp: 210, r: 9, scale: 1.2, speed: 20, mass: 7, postureMul: 0.35, harden: true, ai: 'golem',
    moves: moveSet({ strike: { dmg: 16, range: 20, wind: 0.55, kb: 140 } }),
    passive: ['Barkskin', 'Rooted, its bark thickens, layer on layer; moving sheds it, and heavies and kicks crack it.'],
    active: ['Grasping Roots, Vine Lash', 'Roots burst up under you and pin you; a vine lashes out and drags you in.'],
    specials: [
      { id: 'grasp', kind: 'sigil', pattern: 'scatter', count: 3, maxRange: 200, wind: 0.6, recover: 0.6, dmg: 12, radius: 13, delay: 0.85, root: 1.4, cd: 5, unblockable: true, variant: 'roots' },
      { id: 'vinelash', kind: 'shoot', proj: 'tentacle', shots: 1, speed: 230, dmg: 9, minRange: 18, maxRange: 90, wind: 0.4, recover: 0.45, cd: 4, pull: true, life: 0.5 },
      { id: 'treeslam', kind: 'slam', radius: 26, wind: 0.85, recover: 0.9, dmg: 18, kb: 180, cd: 5, unblockable: true, hitPosture: 22, variant: 'quake' },
    ],
  }),
});

// ---------- the Red Dust Temple's monkeys and its sweeper; the Nine Heavens' cold and shadow ----------
Object.assign(ENEMY_TYPES, {
  macaque: foe('trickster', {
    name: 'Temple Macaque', hp: 34, r: 4, speed: 66, mass: 0.7, postureMul: 1.2, aggr: 0.8, dodgeP: 0.4,
    moves: moveSet({ strike: { dmg: 6, range: 12, wind: 0.1 } }),
    passive: ['Peach Thief', 'Quick, cheeky, and never alone; dodges on instinct.'], active: ['Somersault, Stolen Fruit', 'A somersault kick over your guard, and a peach pit thrown at your head.'],
    specials: [
      { id: 'somersault', kind: 'pounce', minRange: 16, maxRange: 60, wind: 0.25, recover: 0.4, dmg: 8, kb: 80, lunge: 280, lungeTime: 0.22, cd: 2.6, breaksGuard: true, hitPosture: 12, parryPosture: 24 },
      { id: 'peachpit', kind: 'shoot', proj: 'boulder', shots: 1, speed: 200, dmg: 5, minRange: 30, maxRange: 150, wind: 0.3, recover: 0.3, cd: 2.2, radius: 2 },
    ],
  }),
  greatape: foe('bruiser', {
    name: 'Mountain Ape', hp: 120, r: 7, speed: 40, mass: 3, postureMul: 0.6,
    moves: moveSet({ strike: { dmg: 14, range: 16, wind: 0.32, kb: 120 }, heavy: { dmg: 24, range: 18 } }),
    passive: ['Brute Strength', 'Big and heavy; its blows throw you back.'], active: ['Chest Beat, Leaping Smash', 'Beats its chest to hit harder, then leaps and smashes the ground.'],
    specials: [
      { id: 'apesmash', kind: 'pounce', minRange: 25, maxRange: 90, wind: 0.6, recover: 0.7, dmg: 18, kb: 200, lunge: 260, lungeTime: 0.4, cd: 4.5, hitPosture: 24, parryPosture: 36, shock: { radius: 20, dmg: 10 } },
      { id: 'apeslam', kind: 'slam', radius: 22, wind: 0.55, recover: 0.6, dmg: 14, kb: 170, cd: 4, unblockable: true, hitPosture: 18, variant: 'quake' },
    ],
  }),
  sweepingmonk: foe('duelist', {
    name: 'Sweeping Monk', hp: 140, r: 5, speed: 46, mass: 1.6, postureMul: 0.4, parryP: 0.75, blockP: 0.5, counterP: 0.55, chainP: 0.5, maxChain: 3, riposte: true,
    moves: moveSet({ strike: { dmg: 12, range: 24, wind: 0.16 }, heavy: { dmg: 24, range: 26 } }),
    passive: ['Nothing to Prove', 'Parries almost everything, and answers a parry at once.'], active: ['The Broom, Dust Cloud', 'A sweep that clears the courtyard (and you with it), and a cloud of dust that hides him for a moment.'],
    specials: [
      { id: 'broomsweep', kind: 'slam', radius: 30, wind: 0.4, recover: 0.5, dmg: 14, kb: 180, cd: 4, hitPosture: 20, parryPosture: 30, variant: 'staffquake' },
      { id: 'dustcloud', kind: 'vanish', minRange: 0, maxRange: 60, wind: 0.2, recover: 0, cd: 7 },
      { id: 'broomthrust', kind: 'pounce', minRange: 22, maxRange: 80, wind: 0.35, recover: 0.45, dmg: 14, kb: 110, lunge: 280, lungeTime: 0.24, cd: 3, breaksGuard: true, hitPosture: 20, parryPosture: 34 },
    ],
  }),
  frostmaiden: foe('caster', {
    name: 'Frost Maiden of the Cold Palace', hp: 60, r: 5, speed: 38, mass: 1, postureMul: 1.1,
    passive: ['Cold Palace', 'Her cold slows whatever it touches.'], active: ['Frost Lotus, Moonlit Shards', 'Lotuses of ice that bloom under you and freeze you, and shards of moonlit ice.'],
    specials: [
      { id: 'frostlotus', kind: 'sigil', maxRange: 180, wind: 0.5, recover: 0.5, dmg: 10, radius: 14, delay: 0.8, cd: 4, unblockable: true, variant: 'seal', slow: 2, freeze: 0.8 },
      { id: 'iceshards', kind: 'shoot', proj: 'feather', shots: 3, spread: 0.25, speed: 190, dmg: 6, minRange: 25, maxRange: 170, wind: 0.35, recover: 0.35, cd: 2.4, slow: 1.2 },
    ],
  }),
  qilin: foe('colossus', {
    name: 'Qilin', hp: 180, r: 8, speed: 46, mass: 4, postureMul: 0.45,
    moves: moveSet({ strike: { dmg: 15, range: 18, wind: 0.4, kb: 130 } }),
    passive: ['Auspicious', 'Walks without bending the grass; a glow about it.'], active: ['Thunder Hooves, Trample', 'A charging gallop that leaves thunder in its hoofprints, and a trampling stomp.'],
    specials: [
      { id: 'thunderhooves', kind: 'pounce', minRange: 30, maxRange: 120, wind: 0.6, recover: 0.7, dmg: 18, kb: 220, lunge: 320, lungeTime: 0.4, cd: 4.5, breaksGuard: true, hitPosture: 26, parryPosture: 40, trail: 'hellfire' },
      { id: 'trample', kind: 'slam', radius: 26, wind: 0.6, recover: 0.7, dmg: 16, kb: 180, cd: 4, unblockable: true, hitPosture: 20, variant: 'quake' },
      { id: 'qilinbolt', kind: 'sigil', pattern: 'scatter', count: 3, maxRange: 999, wind: 0.5, recover: 0.5, dmg: 14, radius: 11, delay: 0.9, cd: 6, unblockable: true, variant: 'goldlightning' },
    ],
  }),
  jadetoad: foe('colossus', {
    name: 'Jade Toad of the Cold Palace', hp: 170, r: 8, speed: 28, mass: 4.5, postureMul: 0.45,
    moves: moveSet({ strike: { dmg: 14, range: 16, wind: 0.45, kb: 120 } }),
    passive: ['Three-Legged', 'Hops instead of walking, and lands heavily.'], active: ['Frost Breath, Freezing Hop', 'A cone of frost that slows you, and a hop that freezes the ground where it lands.'],
    specials: [
      { id: 'frostbreath', kind: 'cone', range: 46, angle: 0.65, wind: 0.6, recover: 0.6, dmg: 12, kb: 60, hitPosture: 12, cd: 4.5, unblockable: true, variant: 'wind', slow: 2.5 },
      { id: 'frosthop', kind: 'lob', proj: 'boulder', minRange: 30, maxRange: 140, flight: 0.7, height: 30, wind: 0.5, recover: 0.5, cd: 5, land: { r: 16, dmg: 14, kb: 120, slow: 2, zone: { variant: 'frost', r: 15, life: 3 } } },
    ],
  }),
  tiangou: foe('trickster', {
    name: 'Tiangou', hp: 58, r: 5, speed: 62, mass: 1.1, postureMul: 0.9, ai: 'circle', orbit: 40,
    moves: moveSet({ strike: { dmg: 10, range: 14, wind: 0.14 } }),
    passive: ['Eclipse Hound', 'Slips from shadow to shadow; hard to pin down.'], active: ['Shadow Step, Eclipse Bite', 'Vanishes and reappears beside you, then bites through your guard.'],
    specials: [
      { id: 'shadowstep', kind: 'vanish', minRange: 30, maxRange: 200, wind: 0.25, recover: 0, cd: 4 },
      { id: 'eclipsebite', kind: 'pounce', minRange: 12, maxRange: 60, wind: 0.3, recover: 0.45, dmg: 13, kb: 70, lunge: 300, lungeTime: 0.22, cd: 2.8, breaksGuard: true, hitPosture: 16, parryPosture: 30 },
    ],
  }),
  shadeattendant: foe('guardian', {
    name: 'Shade Attendant', hp: 90, r: 5, speed: 42, mass: 1.3, postureMul: 0.7, dr: 0.15,
    moves: moveSet({ strike: { dmg: 11, range: 16, wind: 0.24 }, heavy: { dmg: 20, range: 18 } }),
    passive: ['Only a Shadow', 'Takes 15% less damage; blocks and counters.'], active: ['Bow, Long Shadow', 'Bows, and its shadow stretches across the floor and cuts.'],
    specials: [
      { id: 'longshadow', kind: 'sigil', pattern: 'line', count: 6, spacing: 12, step: 0.07, maxRange: 160, wind: 0.5, recover: 0.5, dmg: 12, radius: 8, delay: 0.5, cd: 4, unblockable: true, variant: 'soulspikes' },
    ],
  }),
});

// The Mutant's mutations: one more every 20% of health it loses.
const MUTATIONS = {
  arm:      { name: 'Extra Arm', tal: { asura: 1 } },
  spikes:   { name: 'Bone Spikes', tal: { thorns: 0.3 } },
  acid:     { name: 'Acid Blood' },
  tentacle: { name: 'Tentacle', reach: 10,
    add: { id: 'lash', kind: 'shoot', proj: 'tentacle', shots: 1, speed: 230, dmg: 8, minRange: 18, maxRange: 80, wind: 0.35, recover: 0.4, cd: 3.5, pull: true, life: 0.45 } },
  carapace: { name: 'Carapace', tal: { dmgTaken: -0.25 } },
  maw:      { name: 'Second Maw', tal: { lifesteal: 0.3 } },
  sac:      { name: 'Toxic Sac',
    add: { id: 'spew', kind: 'cone', range: 32, angle: 0.55, wind: 0.5, recover: 0.5, dmg: 6, kb: 30, hitPosture: 8, cd: 4.5, unblockable: true, variant: 'poison', poison: 5, poisonT: 3 } },
  legs:     { name: 'Extra Legs', speed: 0.3 },
};

// The Alchemist's flasks: what each one does where it lands.
const FLASKS = {
  fire:  { r: 13, dmg: 10, kb: 40, zone: { variant: 'fire', r: 14, life: 3.5, dps: 6 } },
  venom: { r: 10, dmg: 4, zone: { variant: 'poison', r: 18, life: 4.5, dps: 5 } },
  frost: { r: 15, dmg: 8, slow: 2.5, zone: { variant: 'frost', r: 15, life: 3 } },
  acid:  { r: 13, dmg: 8, hitPosture: 30, corrode: 4, zone: { variant: 'acid', r: 12, life: 3 } },
  blast: { r: 18, dmg: 20, kb: 170, hitPosture: 18, variant: 'blast' },
};

const HEAD_KINDS = ['bite', 'spit', 'flame'];
// lingering conditions an attack can carry onto whoever it hits
const STATUS_KEYS = ['poison', 'poisonT', 'slow', 'poly', 'charm', 'cocoon', 'lift', 'liftDmg', 'corrode', 'root', 'grab', 'fear', 'freeze', 'nail', 'wet'];
// What the true dragons (and anything given `nemesis`) hunt hardest: the dead that walk, and the things that should not be.
const UNDEAD_TYPES = new Set(['zombie', 'skeleton', 'lich', 'lichhead', 'lichtorso', 'lichleg', 'vampire', 'vampirelord', 'bonedragon', 'ghoul']);
const STRANGE_TYPES = new Set(['yellowking', 'courtier', 'byakhee', 'horror', 'cultist', 'zergqueen', 'zergling', 'spitter', 'bloater', 'brute', 'broodling', 'mutant', 'shifter', 'scholar', 'inkdragon', 'rollinghead']);
const isUndead = f => !!f && (UNDEAD_TYPES.has(f.type) || !!(f.def && f.def.undead));
const isStrange = f => !!f && (STRANGE_TYPES.has(f.type) || !!(f.def && f.def.strange));
const statusOf = o => { const s = {}; for (const k of STATUS_KEYS) if (o[k]) s[k] = o[k]; return s; };

// ---------- bosses: one per role, with a second phase at half health ----------
const boss = (base, o) => {
  const b = ENEMY_TYPES[base];
  return { ...b, boss: true, phaseGate: true, scale: 1, specials: b.specials.slice(), ...o }; // every boss shows every form
};
Object.assign(ENEMY_TYPES, {
  warlord: boss('berserker', {
    name: 'Bandit Warlord', hp: 256, r: 10, mass: 3, speed: 40, postureMul: 0.5, kbOut: 0.3, sprite: 'b_warlord', sprite2: 'b_warlord2', form2: 'Blood Tyrant', color: '#ff3a2a',
    moves: moveSet({ strike: { dmg: 14, range: 20 }, heavy: { dmg: 28, range: 22 } }),
    specials: [ENEMY_TYPES.bandit.specials[0], ENEMY_TYPES.berserker.specials[0]],
    phase2: { speedMul: 1.25, cdMul: 0.65, dmgMul: 1.25, add: [{ id: 'gang', kind: 'summon', wind: 0.8, recover: 0.6, cd: 10, energy: 40, minions: ['bandit', 'bandit'], cap: 3 }] },
    passive: ['Bloodrage', 'Hits harder as it weakens.'], active: ['Rush, Whirlwind, Call the Gang', 'Calls bandits in phase two.'],
  }),
  swordsaint: boss('cultivator', {
    name: 'Sword Saint', hp: 240, r: 9, sprite: 'b_swordsaint', sprite2: 'b_swordsaint2', form2: 'Sword Immortal', color: '#9fd8ff', mass: 2, speed: 48, postureMul: 0.45, iaido: true, riposte: true,
    moves: moveSet({ strike: { dmg: 13, range: 22 }, heavy: { dmg: 26, range: 24 } }),
    specials: [ENEMY_TYPES.samurai.specials[0], { ...ENEMY_TYPES.cultivator.specials[0], count: 4 }],
    phase2: { speedMul: 1.2, cdMul: 0.55, dmgMul: 1.25, add: [ENEMY_TYPES.fencer.specials[0]] },
    passive: ['Sword Qi, Iaido, Riposte', 'Every duelist trick at once.'], active: ['Iai, Flying Swords, Fleche', 'Adds the fleche in phase two.'],
  }),
  abbot: boss('buddhist', {
    name: 'Grand Abbot', hp: 400, r: 9, kbOut: 0.45, dr: 0.2, dr2: 0.4, sprite: 'b_abbot', sprite2: 'b_abbot2', form2: 'Golden Arhat', color: '#ffd84a', mass: 3, speed: 40, postureMul: 0.25, redirect: true,
    specials: [ENEMY_TYPES.buddhist.specials[0], ENEMY_TYPES.taichi.specials[0]],
    phase2: { speedMul: 1.2, cdMul: 0.5, dmgMul: 1.4, heal: 0.3, add: [] },
    passive: ['Iron Body, Redirect', 'Takes 20% less damage (40% as the Golden Arhat, far less during his ultimates); barely moves when struck; parries throw you off balance.'], active: ['Palm of Buddha, Push Hands', 'Heals once at half health.'],
  }),
  vampirelord: boss('vampire', {
    name: 'Vampire Lord', hp: 224, r: 9, sprite: 'b_vampire', sprite2: 'b_vampire2', form2: 'Nosferatu', color: '#ff2a3a', mass: 2, speed: 52, postureMul: 0.5, lifesteal: true, sway: true, bloodRevive: true,
    specials: [ENEMY_TYPES.vampire.specials[0], ENEMY_TYPES.ninja.specials[0]],
    phase2: { speedMul: 1.25, cdMul: 0.55, dmgMul: 1.25, add: [{ id: 'blood', kind: 'sigil', pattern: 'scatter', count: 3, maxRange: 999, wind: 0.5, recover: 0.5, dmg: 14, radius: 13, delay: 0.9, cd: 5, unblockable: true, variant: 'blood' }] },
    passive: ['Lifesteal, Sway, Undeath', 'Heals as it bites and slips your strikes. Once, it rises from death at 10% health with double lifesteal for 6s.'], active: ['Bat Dash, Vanish, Blood Rain', 'Blood rain in phase two.'],
  }),
  deadeye: boss('gunslinger', {
    name: 'Deadeye', hp: 275, r: 9, camo: true, sprite: 'b_deadeye', sprite2: 'b_deadeye2', form2: 'Reaper of the West', color: '#ff8a3a', mass: 2, speed: 48, postureMul: 0.55,
    specials: [
      { ...ENEMY_TYPES.gunslinger.specials[0], dmg: 14, kb: 120 },
      { id: 'ricochet', kind: 'shoot', shots: 3, spread: 0.5, speed: 210, dmg: 12, minRange: 25, maxRange: 170, wind: 0.5, recover: 0.4, cd: 3.2, bounce: 2, life: 2.4 },
      { ...ENEMY_TYPES.sniper.specials[1], dmg: 32 },
      { id: 'highnoon', kind: 'sigil', maxRange: 999, wind: 0.4, recover: 0.3, dmg: 26, radius: 9, delay: 1.5, cd: 6, unblockable: true, variant: 'crosshair', follow: true, kb: 90 },
    ],
    phase2: { speedMul: 1.2, cdMul: 0.55, dmgMul: 1.4, add: [{ id: 'dynamite', kind: 'sigil', pattern: 'scatter', count: 3, maxRange: 180, wind: 0.45, recover: 0.4, dmg: 20, radius: 16, delay: 1.1, cd: 5, unblockable: true, variant: 'dynamite', kb: 150 }] },
    passive: ['Quickdraw, Steady Aim, Heat Haze', 'Point-blank shots knock you back; laser-sighted shots break guard. Half-invisible: anyone aiming at him aims at a shimmer, until he fires or gets hit.'], active: ['Ricochet, High Noon, Dynamite', 'Bullets bounce off the ring edge; a crosshair hunts you before the shot; dynamite in phase two.'],
  }),
  lich: boss('necromancer', {
    name: 'Lich', hp: 208, r: 9, sprite: 'b_lich', sprite2: 'b_lich2', form2: 'Lich King', color: '#5dff9a', mass: 2, speed: 34, postureMul: 0.6, raiseDead: true, ward: true,
    minionCap: 4, minionScale: 0.55, // a small, frail retinue
    specials: [ENEMY_TYPES.necromancer.specials[0], ENEMY_TYPES.talisman.specials[0], { ...ENEMY_TYPES.necromancer.specials[1], minions: ['zombie'], cap: 2, cd: 12 }],
    phase2: { speedMul: 1.15, cdMul: 0.55, dmgMul: 1.25, add: [ENEMY_TYPES.talisman.specials[1]] },
    passive: ['Raise Dead, Ward', 'Raises the fallen; a ward absorbs a hit every 8s.'], active: ['Bone Spikes, Sigils, Zombies', 'Adds homing talismans in phase two.'],
  }),
  // Three stages: a man on a cloud, the Celestial Dragon, and the true body with the dragon pearl. A true bloodline:
  // whatever stands near him is slower, softer and weaker against him (Dragon Majesty), and he is the bane of the
  // dead and of things that should not be.
  emperor: boss('eastdragon', {
    name: 'Dragon Emperor', hp: 900, r: 8, mass: 8, speed: 34, postureMul: 0.3, scales: true, sprite: 'b_emperor', sprite2: 'b_emperor2', form2: 'Celestial Dragon', form3: 'True Dragon, Golden Body', color: '#ffd84a',
    phase2At: 0.65, rainHeal: 0.005, goldenBody: true,
    pressure: [{ r: 80, dmg: 0.1, slow: 0.1, def: 0.1 }, { r: 130, dmg: 0.2, slow: 0.15, def: 0.15 }, { r: 999, dmg: 0.3, slow: 0.25, def: 0.25 }],
    nemesis: [1.5, 1.75, 2],
    specials: [
      { ...ENEMY_TYPES.eastdragon.specials[0], id: 'thunder', variant: 'goldlightning' },                                                       // Heavenly Edict
      { id: 'dragonclaw', kind: 'cone', range: 34, angle: 0.6, wind: 0.45, recover: 0.5, dmg: 14, kb: 90, hitPosture: 16, cd: 3, unblockable: true, variant: 'wind' }, // Dragon's Claw
      { id: 'jadeseal', kind: 'slam', radius: 26, wind: 0.7, recover: 0.8, dmg: 20, kb: 190, cd: 5, unblockable: true, hitPosture: 24, variant: 'quake' },          // Jade Seal Suppresses the World
      { id: 'clouds', kind: 'cloudhop', minRange: 30, maxRange: 160, wind: 0.35, recover: 0.5, dmg: 16, kb: 140, radius: 20, cd: 7, hitPosture: 20 },            // Riding the Clouds
      { id: 'court', kind: 'summon', wind: 0.8, recover: 0.6, cd: 12, minions: ['general', 'general'], cap: 2 },                                                  // Summon Heavenly Soldiers
    ],
    phase2: { speedMul: 1.15, cdMul: 0.55, dmgMul: 1.25, heal: 0.2, add: [] },
    phase3: { at: 0.3, dur: 2.2, speedMul: 1.1, cdMul: 0.45, dmgMul: 1.6, heal: 0.3, flags: { r: 26, mass: 40, giant: true }, replace: {},
      add: [
        { id: 'wuxing', kind: 'wuxing', maxRange: 999, wind: 0.55, recover: 0.5, cd: 3 },                                                                           // Breath of the Five Phases
        { id: 'pearlorbs', kind: 'shoot', proj: 'orb', shots: 5, spread: 1.1, speed: 120, dmg: 10, minRange: 0, maxRange: 220, wind: 0.4, recover: 0.4, cd: 5, homing: 1.4 }, // Dragon Pearl Barrage
        { id: 'ninesons', kind: 'summon', wind: 0.8, recover: 0.6, cd: 14, minions: ['eastdragon', 'eastdragon'], cap: 2 },                                        // Nine Sons of the Dragon
      ] },
    passive: ['Dragon Majesty, Mandate of Heaven, Thunder Scales, Golden Body', 'A true bloodline: near him you move slower, take more and deal less to him (the whole arena in his true body); he does extra damage to the undead and the strange. As a man his decrees cannot be interrupted. As the dragon he flies, strikes do half damage, lightning bites back and he heals while his rain falls. In his true body strikes barely scratch him, but when an ultimate ends his pearl dims and he is open.'],
    active: ['Edict, Claw, Jade Seal, Clouds; Rain, Tide, Dragonfire; the Five Phases', 'As a man: golden lightning, a raking claw, the jade seal brought down, a leap across the clouds, heavenly soldiers. As the dragon: rain that soaks you for his thunder, a tide that throws you, dragonfire, a wing gust, generals and dragon guards. In his true body: the pearl breathes wood, fire, earth, metal and water in turn, its light hunts you, and the dragon\'s nine sons come down.'],
  }),
});

// ---------- boss ultimates: a charge-up, then a scripted barrage of steps [time, kind, params] ----------
const DASH = { dmg: 16, speed: 330, time: 0.32, breaksGuard: true, hitPosture: 25, parryPosture: 30, kb: 160, shock: { radius: 22, dmg: 12 } };
const ULTS = {
  warlord: { name: 'Rampage of the Horde', charge: 1.0, dur: 4.0, cd: 16, dark: 'rgba(60,0,0,0.45)',
    steps: [[0, 'summon', { minions: ['bandit', 'bandit'] }], [0.2, 'dash', DASH], [1.1, 'dash', DASH], [2.0, 'dash', DASH], [2.9, 'dash', { ...DASH, dmg: 22, shock: { radius: 32, dmg: 18 } }]] },
  swordsaint: { name: 'Ten Thousand Swords Return', charge: 1.2, dur: 4.2, cd: 16, dark: 'rgba(0,10,40,0.5)',
    steps: [[0, 'swordRing', { count: 16, dmg: 10, first: 0.5, gap: 0.13 }], [2.6, 'sigil', { variant: 'sword', radius: 24, dmg: 30, delay: 1.1, kb: 160 }]] },
  abbot: { name: 'Descent of the Golden Buddha', dr: 0.7, charge: 1.2, dur: 3.6, cd: 16, dark: 'rgba(40,30,0,0.45)',
    steps: [[0, 'sigil', { variant: 'buddha', radius: 36, dmg: 34, delay: 1.6, kb: 260 }], [1.8, 'radial', { count: 8, kind: 'palm', dmg: 14, speed: 100, radius: 8, kb: 200 }],
      [2.6, 'radial', { count: 8, kind: 'palm', dmg: 14, speed: 100, radius: 8, kb: 200, offset: 0.39 }]] },
  vampirelord: { name: 'Crimson Eclipse', charge: 1.0, dur: 3.4, cd: 16, dark: 'rgba(70,0,10,0.55)',
    steps: [[0, 'bats', {}], [0.3, 'sigil', { variant: 'blood', pattern: 'scatter', count: 3, radius: 13, dmg: 16, delay: 0.8 }],
      [1.0, 'sigil', { variant: 'blood', pattern: 'scatter', count: 3, radius: 13, dmg: 16, delay: 0.8 }], [1.7, 'sigil', { variant: 'blood', pattern: 'scatter', count: 3, radius: 13, dmg: 16, delay: 0.8 }],
      [2.6, 'reform', {}], [2.95, 'bigStrike', { range: 24, dmg: 30, lifesteal: true, breaksGuard: true, kb: 140, hitPosture: 30, parryPosture: 60 }]] },
  deadeye: { name: "Dead Man's Hand", charge: 1.4, dur: 2.4, cd: 15, dark: 'rgba(40,15,0,0.45)', laser: true,
    steps: [[0, 'mines', { count: 4, ring: 28 }], ...[0.3, 0.5, 0.7, 0.9, 1.1, 1.3].map(t => [t, 'shot', { dmg: 14, speed: 340, breaksGuard: true }]),
      [1.7, 'radial', { count: 12, kind: 'bullet', dmg: 10, speed: 170 }]] },
  lich: { name: 'Night of the Dead', charge: 1.2, dur: 3.0, cd: 16, dark: 'rgba(0,30,15,0.55)',
    steps: [[0, 'summonEdge', { type: 'zombie', count: 2 }], [0.6, 'cross', { rot: 0 }], [1.4, 'cross', { rot: Math.PI / 4 }], [2.2, 'orbs', { count: 4, dmg: 14 }]] },
  emperor: { name: 'Nine Heavens Thunder Tribulation', charge: 1.4, dur: 3.4, cd: 16, dark: 'rgba(0,0,20,0.6)',
    steps: [[0, 'lightning', { count: 3, variant: 'goldlightning', dmg: 20 }], [0.5, 'lightning', { count: 3, variant: 'goldlightning', dmg: 20 }], [1.0, 'lightning', { count: 3, variant: 'goldlightning', dmg: 20 }],
      [1.8, 'sigil', { variant: 'seal', radius: 24, dmg: 28, delay: 1.0, kb: 200 }]] },
};
for (const [b, u] of Object.entries(ULTS)) ENEMY_TYPES[b].ult = u;

// ---------- summons that only bosses call ----------
Object.assign(ENEMY_TYPES, {
  general: foe('duelist', {
    name: 'Heavenly General', hp: 55, r: 6, speed: 46, mass: 1.4, postureMul: 0.8, summon: true,
    moves: moveSet({ strike: { range: 24, dmg: 12 }, heavy: { range: 26, dmg: 22 } }),
  }),
  skeleton: foe('bruiser', {
    name: 'Skeleton Warrior', hp: 32, r: 5, speed: 46, mass: 0.9, postureMul: 1.2, summon: true,
    moves: moveSet({ strike: { dmg: 9 } }),
  }),
  bonedragon: foe('colossus', {
    name: 'Bone Dragon', hp: 110, r: 10, speed: 30, mass: 5, postureMul: 0.4, summon: true, floating: true,
    moves: moveSet({ strike: { range: 26, dmg: 16 }, heavy: { range: 28, dmg: 26 } }),
  }),
});

// ---------- second forms: skills that change, flags that switch on, and a new ultimate ----------
const BLOOD_DASH = { ...DASH, dmg: 18, speed: 360 };
const SWORD_DASH = { dmg: 18, speed: 400, time: 0.26, breaksGuard: true, hitPosture: 25, parryPosture: 40, kb: 140 };
const PHASE2 = {
  warlord: {
    replace: {
      tackle: { id: 'tackle', kind: 'pounce', minRange: 18, maxRange: 80, wind: 0.4, recover: 0.5, dmg: 18, kb: 180, lunge: 300, lungeTime: 0.3, cd: 3, breaksGuard: true, hitPosture: 25, parryPosture: 30 },
      whirl: { id: 'whirl', kind: 'slam', radius: 28, hits: 5, interval: 0.22, wind: 0.45, recover: 0.8, dmg: 8, kb: 60, cd: 5, breaksGuard: true, lifesteal: true, hitPosture: 8, parryPosture: 20, variant: 'blood' },
    },
    ult: { name: "Tyrant's Massacre", charge: 1.0, dur: 4.0, cd: 15, dark: 'rgba(80,0,0,0.5)',
      steps: [[0, 'radial', { count: 8, kind: 'axe', dmg: 14, speed: 130, radius: 4 }], [0.6, 'dash', BLOOD_DASH], [1.4, 'dash', BLOOD_DASH],
        [2.2, 'radial', { count: 12, kind: 'axe', dmg: 14, speed: 140, offset: 0.26, radius: 4 }], [2.8, 'dash', { ...BLOOD_DASH, dmg: 26, shock: { radius: 36, dmg: 20 } }]] },
  },
  swordsaint: {
    flags: { unity: true },
    replace: {
      iai: { id: 'iai', kind: 'pounce', minRange: 15, maxRange: 110, wind: 0.35, recover: 0.4, dmg: 22, kb: 120, lunge: 380, lungeTime: 0.3, cd: 2.2,
        breaksGuard: true, untargetable: true, swordForm: true, hitPosture: 25, parryPosture: 40 },
      swords: { id: 'swords', kind: 'swords', minRange: 25, maxRange: 200, count: 6, wind: 0.4, recover: 0.4, dmg: 12, cd: 3.5 },
    },
    ult: { name: 'Invincible Under Heaven', charge: 1.0, dur: 4.4, cd: 15, dark: 'rgba(0,20,60,0.55)',
      steps: [[0, 'swordform', { on: true }], ...[0.1, 0.55, 1.0, 1.45, 1.9, 2.35].map(t => [t, 'dash', SWORD_DASH]),
        [2.8, 'swordform', { on: false }], [2.9, 'swordRing', { count: 12, dmg: 12, first: 0.3, gap: 0.08 }]] },
  },
  abbot: {
    replace: { palm: { id: 'palm', kind: 'shoot', proj: 'palm', shots: 1, speed: 135, radius: 12, life: 2.2, minRange: 12, maxRange: 170, wind: 0.45, recover: 0.45, dmg: 26, kb: 280, cd: 2.4, blockPosture: 38, hitPosture: 30 } },
    ult: { name: 'Ten Thousand Hands of the Buddha', dr: 0.8, charge: 1.2, dur: 4.8, cd: 16, dark: 'rgba(50,35,0,0.5)',
      steps: [[0, 'apparition', { dur: 4.8 }], ...Array.from({ length: 24 }, (_, i) => [0.3 + i * 0.15, 'palmrain', {}]),
        [2.0, 'radial', { count: 12, kind: 'palm', dmg: 14, speed: 110, radius: 8, kb: 200 }], [3.8, 'radial', { count: 12, kind: 'palm', dmg: 14, speed: 110, radius: 8, kb: 200, offset: 0.26 }]] },
  },
  vampirelord: {
    replace: { bats: { id: 'bats', kind: 'pounce', minRange: 25, maxRange: 110, wind: 0.3, recover: 0.4, dmg: 18, kb: 70, lunge: 300, lungeTime: 0.35, cd: 2.8, untargetable: true, hitPosture: 14, parryPosture: 30 } },
    add: [{ id: 'swarm', kind: 'shoot', proj: 'bat', shots: 3, spread: 0.4, speed: 120, dmg: 9, minRange: 25, maxRange: 180, wind: 0.4, recover: 0.4, cd: 3.5, homing: 1.4, lifesteal: true }],
    ult: { name: 'Blood Moon', charge: 1.0, dur: 4.5, cd: 16, dark: 'rgba(90,0,10,0.55)',
      steps: [[0, 'bloodmoon', { dur: 6, clone: true }], ...[0.3, 0.8, 1.3, 1.8, 2.3, 2.8, 3.3, 3.8, 4.3].map(t => [t, 'drain', { range: 90, dmg: 4 }]),
        [0.8, 'radial', { count: 8, kind: 'bat', dmg: 9, speed: 110, homing: 1.2, lifesteal: true }], [2.4, 'radial', { count: 8, kind: 'bat', dmg: 9, speed: 110, homing: 1.2, lifesteal: true, offset: 0.39 }],
        [1.5, 'sigil', { variant: 'blood', pattern: 'scatter', count: 4, radius: 13, dmg: 16, delay: 0.8 }], [3.2, 'sigil', { variant: 'blood', pattern: 'scatter', count: 4, radius: 13, dmg: 16, delay: 0.8 }]] },
  },
  deadeye: {
    flags: { steed: true },
    replace: {
      quick: { id: 'quick', kind: 'shoot', proj: 'chain', shots: 1, speed: 230, dmg: 8, minRange: 20, maxRange: 150, wind: 0.35, recover: 0.5, cd: 4, pull: true },
      aim: { id: 'aim', kind: 'shoot', proj: 'hellfire', shots: 1, speed: 300, dmg: 28, minRange: 30, maxRange: 240, wind: 0.9, recover: 0.5, cd: 2.4, laser: true, breaksGuard: true, burn: true },
      ricochet: { id: 'ricochet', kind: 'shoot', proj: 'hellfire', shots: 4, spread: 0.45, speed: 220, dmg: 10, minRange: 25, maxRange: 170, wind: 0.45, recover: 0.4, cd: 3, bounce: 2, life: 2.4, burn: true },
      highnoon: { id: 'highnoon', kind: 'sigil', maxRange: 999, wind: 0.35, recover: 0.3, dmg: 30, radius: 11, delay: 1.3, cd: 5, unblockable: true, variant: 'crosshair', follow: true, kb: 110, burnAfter: true },
    },
    ult: { name: 'Hellride', charge: 1.0, dur: 4.0, cd: 15, dark: 'rgba(60,20,0,0.55)',
      steps: [[0, 'ride', {}], [0.55, 'ride', {}], [1.1, 'ride', {}], [1.65, 'ride', {}], [2.3, 'chainpull', {}],
        ...[2.7, 2.9, 3.1, 3.3, 3.5].map(t => [t, 'shot', { dmg: 14, speed: 320, breaksGuard: true, proj: 'hellfire', burn: true }])] },
  },
  lich: {
    replace: {
      raise: { id: 'raise', kind: 'summon', wind: 0.8, recover: 0.6, cd: 12, energy: 35, minions: ['skeleton'], cap: 2 },
      spikes: { id: 'spikes', kind: 'sigil', pattern: 'line', count: 8, spacing: 12, step: 0.06, maxRange: 200, wind: 0.4, recover: 0.5, dmg: 20, radius: 9, delay: 0.5, cd: 2.6, unblockable: true, variant: 'soulspikes' },
    },
    ult: { name: 'Wyrm of the Dead', charge: 1.2, dur: 4.2, cd: 16, dark: 'rgba(0,40,20,0.6)',
      steps: [[0, 'bonedragon', {}], [0.2, 'summonEdge', { type: 'skeleton', count: 1 }], [0.6, 'cross', { rot: 0, variant: 'soulspikes' }],
        [1.2, 'dragonbreath', { range: 90, angle: 0.6, dmg: 20 }], [2.1, 'dragonbreath', { range: 90, angle: 0.6, dmg: 20 }], [2.4, 'cross', { rot: Math.PI / 4, variant: 'soulspikes' }],
        [3.0, 'dragonbreath', { range: 90, angle: 0.6, dmg: 20 }], [3.5, 'orbs', { count: 8, dmg: 14 }]] },
  },
  emperor: {
    flags: { court: true, r: 13 },
    // the Celestial Dragon: the edict becomes a chain of thunder; the claw, the seal and the cloud-leap give way to rain, tide and fire
    replace: {
      thunder: { id: 'thunder', kind: 'sigil', pattern: 'scatter', count: 6, maxRange: 999, wind: 0.5, recover: 0.5, dmg: 22, radius: 13, delay: 0.85, cd: 4, unblockable: true, variant: 'goldlightning' }, // Thunder Chain
      dragonclaw: { id: 'tide', kind: 'cone', range: 56, angle: 0.75, wind: 0.6, recover: 0.6, dmg: 10, kb: 260, hitPosture: 14, cd: 5, unblockable: true, variant: 'wind', wet: 5 },              // Dragon Tide
      jadeseal: { ...ENEMY_TYPES.westdragon.specials[1], id: 'dragonfire', dmg: 20 },                                                                                                           // Dragonfire
      clouds: { id: 'rain', kind: 'rain', maxRange: 999, wind: 0.6, recover: 0.4, dur: 8, cd: 14 },                                                                                             // Calling Wind and Rain
      court: { id: 'court', kind: 'summon', wind: 0.8, recover: 0.6, cd: 12, minions: ['general', 'general', 'general', 'general'], cap: 4 },                                                   // generals and dragon guards
    },
    add: [ENEMY_TYPES.westdragon.specials[0]],
    ult: { name: 'Overturning Rivers and Seas', charge: 1.4, dur: 4.2, cd: 16, dark: 'rgba(10,20,40,0.55)',
      steps: [[0, 'rain', { dur: 8 }], [0.3, 'breath', { range: 90, angle: 0.95, dmg: 14, variant: 'wind', wet: 5 }], [1.0, 'lightning', { count: 9, variant: 'goldlightning', dmg: 20 }],
        [1.8, 'lightning', { count: 9, variant: 'goldlightning', dmg: 20 }], [2.6, 'lightning', { count: 9, variant: 'goldlightning', dmg: 20 }], [3.4, 'breath', { range: 85, angle: 0.85, dmg: 28, variant: 'gold' }]] },
  },
};
for (const [b, ph] of Object.entries(PHASE2)) {
  const p2 = ENEMY_TYPES[b].phase2;
  p2.replace = ph.replace || {}; p2.flags = ph.flags || {};
  p2.add = (p2.add || []).concat(ph.add || []);
  ENEMY_TYPES[b].ult2 = ph.ult;
}
// The true body's ultimate: the pearl breathes all five phases from the four quarters and the centre, then one beam of its own light.
ENEMY_TYPES.emperor.stage3Ult = { name: 'Dragon Pearl Transforms the Five Phases', charge: 1.6, dur: 4.0, cd: 16, dark: 'rgba(30,24,0,0.6)',
  steps: [...['wood', 'fire', 'earth', 'metal', 'water'].map((v, i) => [i * 0.4, 'beam', { variant: 'wx_' + v, len: 300, width: 14, dmg: 18, kb: 120, delay: 0.8, aimed: true, turn: i * 1.2566 }]),
    [2.6, 'beam', { variant: 'pillar', len: 320, width: 30, dmg: 34, kb: 220, delay: 0.9, aimed: true }]] };
// what each of the five phases does when the pearl breathes it (Breath of the Five Phases, in generating order)
const WUXING = [
  ['wood', [['sigil', { variant: 'roots', pattern: 'scatter', count: 4, radius: 12, dmg: 12, delay: 0.8, root: 1.2 }]]],
  ['fire', [['beam', { variant: 'wx_fire', len: 200, width: 12, dmg: 18, kb: 100, delay: 0.6, aimed: true, turn: 0.4 }], ['beam', { variant: 'wx_fire', len: 200, width: 12, dmg: 18, kb: 100, delay: 0.6, aimed: true, turn: -0.4 }]]],
  ['earth', [['sigil', { variant: 'staffquake', pattern: 'scatter', count: 5, radius: 14, dmg: 16, delay: 0.85, kb: 160 }]]],
  ['metal', [['beam', { variant: 'wx_metal', len: 320, width: 8, dmg: 22, kb: 80, delay: 0.5, aimed: true, pierceAll: true }]]],
  ['water', [['beam', { variant: 'wx_water', len: 240, width: 22, dmg: 14, kb: 240, delay: 0.7, aimed: true }], ['breath', { range: 60, angle: 0.7, dmg: 6, variant: 'wind', wet: 5 }]]],
];

// ---------- the Primordial Forest's bosses: a rabbit, and the tree the elves keep ----------
ENEMY_TYPES.jaderabbit = boss('tiger', {
  name: 'Rabbit', summon: false, hp: 230, r: 4, scale: 1.4, mass: 0.8, speed: 74, postureMul: 0.7, ai: 'circle', orbit: 30, strange: true,
  sprite: 'b_rabbit', sprite2: 'b_rabbit2', form2: 'Ink-Stained Jade Rabbit', color: '#e8e8f0', lore: 'IT FELL FROM THE MOON',
  moves: moveSet({ strike: { dmg: 4, range: 11, wind: 0.12 } }),
  specials: [
    { id: 'pestle', kind: 'slam', radius: 16, hits: 2, interval: 0.25, wind: 0.4, recover: 0.5, dmg: 6, kb: 80, cd: 3, hitPosture: 8, variant: 'quake' },
    { id: 'hop', kind: 'pounce', minRange: 18, maxRange: 70, wind: 0.25, recover: 0.4, dmg: 5, kb: 60, lunge: 300, lungeTime: 0.22, cd: 2.4, hitPosture: 8 },
  ],
  phase2: { speedMul: 1.25, cdMul: 0.6, dmgMul: 1.3, heal: 0.2, flags: {},
    replace: { pestle: { id: 'pestle', kind: 'slam', radius: 20, hits: 3, interval: 0.2, wind: 0.35, recover: 0.45, dmg: 8, kb: 110, cd: 3, hitPosture: 12, variant: 'quake' } },
    add: [
      { id: 'inkblots', kind: 'sigil', pattern: 'scatter', count: 3, maxRange: 999, wind: 0.5, recover: 0.4, dmg: 12, radius: 11, delay: 0.8, cd: 4, unblockable: true, variant: 'inkrain' },
      { id: 'moonbite', kind: 'pounce', minRange: 10, maxRange: 60, wind: 0.7, recover: 0.6, dmg: 6, maxHpPct: 0.08, kb: 120, lunge: 320, lungeTime: 0.22, cd: 5, breaksGuard: true, hitPosture: 20, parryPosture: 40 },
    ] },
  passive: ['Harmless', 'Small, fast and polite. Its second form is none of those: ink comes through the fur, and its bite takes a share of your health.'],
  active: ['Pounding the Elixir, Moon-Devouring Bite', 'A pestle that shakes the ground, a hop. Then ink blots that burst where you stand, and a bite with a twitch of the ears before it.'],
  ult: { name: 'Elixir of the Moon', charge: 1.0, dur: 2.0, cd: 16, dark: 'rgba(20,20,40,0.35)',
    steps: [[0, 'radial', { count: 8, kind: 'orb', dmg: 8, speed: 100 }], [1.0, 'radial', { count: 8, kind: 'orb', dmg: 8, speed: 100, offset: 0.39 }]] },
  ult2: { name: 'The Moon Devoured', charge: 1.1, dur: 2.8, cd: 15, dark: 'rgba(0,0,0,0.5)',
    steps: [[0, 'sigil', { variant: 'inkrain', pattern: 'scatter', count: 5, radius: 12, dmg: 14, delay: 0.8 }], [0.9, 'sigil', { variant: 'inkrain', pattern: 'scatter', count: 5, radius: 12, dmg: 14, delay: 0.8 }],
      [1.8, 'dash', { ...DASH, dmg: 14, speed: 380 }]] },
});
ENEMY_TYPES.lifetree = boss('golem', {
  name: 'The Life Tree', hp: 300, r: 13, mass: 99, speed: 0, postureMul: 0.25, kbOut: 0.6, noFlinch: true, harden: false, blessing: true,
  sprite: 'b_lifetree', sprite2: 'b_lifetree2', form2: 'The World Tree Awakens', color: '#a8e070', lore: 'THE ELVES PLANTED THEMSELVES AROUND IT',
  moves: moveSet({ strike: { dmg: 14, range: 24, wind: 0.5, kb: 160 } }),
  specials: [
    { id: 'grasp', kind: 'sigil', pattern: 'scatter', count: 3, maxRange: 999, wind: 0.6, recover: 0.6, dmg: 12, radius: 13, delay: 0.85, root: 1.3, cd: 4.5, unblockable: true, variant: 'roots' },
    { id: 'vinelash', kind: 'shoot', proj: 'tentacle', shots: 1, speed: 240, dmg: 9, minRange: 20, maxRange: 140, wind: 0.4, recover: 0.45, cd: 3.5, pull: true, life: 0.7 },
    { id: 'guardians', kind: 'summon', wind: 0.8, recover: 0.6, cd: 12, minions: ['elfsentinel', 'elfranger'], cap: 2 },
  ],
  phase2: { speedMul: 1, cdMul: 0.6, dmgMul: 1.25, heal: 0.2, flags: {}, replace: {},
    add: [{ id: 'rootline', kind: 'sigil', pattern: 'line', count: 8, spacing: 12, step: 0.06, maxRange: 999, wind: 0.45, recover: 0.5, dmg: 14, radius: 9, delay: 0.55, root: 0.9, cd: 3.5, unblockable: true, variant: 'roots' }] },
  passive: ['Rooted, Spring Blessing', 'It never moves and cannot be thrown; it heals its elves every second.'],
  active: ['Grasping Roots, Vine Lash, Guardians', 'Roots that pin you, a vine that drags you in, and elves that come to its defence. Awake, roots erupt in lines across the floor.'],
  ult: { name: 'Spring Returns to the Earth', charge: 1.2, dur: 2.8, cd: 18, dark: 'rgba(20,40,10,0.35)',
    steps: [[0, 'summon', { minions: ['elfspellweaver', 'elfsentinel'] }], [0.4, 'sigil', { variant: 'roots', pattern: 'scatter', count: 6, radius: 13, dmg: 12, delay: 0.8 }], [1.6, 'radial', { count: 12, kind: 'feather', dmg: 7, speed: 140 }]] },
});
ENEMY_TYPES.lifetree.ult2 = ENEMY_TYPES.lifetree.ult;
for (const t of ['elfranger', 'elfsentinel', 'elfspellweaver']) ENEMY_TYPES[t].keepSkills = true; // the tree's guardians keep their arts

// ---------- the super boss: the Time Administrator ----------
ENEMY_TYPES.timeadmin = boss('ninja', {
  name: 'Time Administrator', hp: 340, pastRevive: true, r: 9, scale: 1.2, mass: 2.5, speed: 50, postureMul: 0.4, superBoss: true, glitch: true, phasing: 0.3, phasing2: 0.5, evasive: false, timeImmune: true,
  sprite: 'b_timeadmin', sprite2: 'b_future', form2: 'You, From the Future', color: '#7fe0ff', kbOut: 0.6,
  moves: moveSet({ strike: { dmg: 14, range: 20 }, heavy: { dmg: 26, range: 22 } }),
  specials: [
    { id: 'timestop', kind: 'timestop', maxRange: 170, wind: 0.6, recover: 0.2, dur: 1.6, cd: 11 },
    { id: 'rift', kind: 'summon', random: true, minions: [], cap: 3, wind: 0.6, recover: 0.4, cd: 9 },
    { id: 'rewind', kind: 'rewind', wind: 0.25, recover: 0.3, back: 4, cd: 7 },
    { id: 'hands', kind: 'shoot', proj: 'clockhand', shots: 2, spread: 0.3, speed: 200, dmg: 12, minRange: 20, maxRange: 160, wind: 0.4, recover: 0.4, cd: 2.8 },
  ],
  phase2: { speedMul: 1.25, cdMul: 0.6, dmgMul: 1.3, heal: 0.2, add: [{ id: 'arsenal', kind: 'arsenal', cd: 4 }], replace: {}, flags: {} },
  anyUlt: true, // its second form wields every boss's ultimate
  passive: ['Phase, Rewind', 'Some attacks pass straight through it; it can turn its own clock back to how it was 4s ago.'],
  active: ['Time Stop, Rift, Clock Hands', 'Freezes everyone else, calls a random foe through a rift (up to 3).'],
});
ENEMY_TYPES.timeadmin.ult = { name: 'The Stopped Clock', charge: 1.0, dur: 3.2, cd: 15, dark: 'rgba(10,30,60,0.55)',
  steps: [[0, 'timefreeze', { dur: 2.6 }], ...[0.3, 0.55, 0.8, 1.05, 1.3].map(t => [t, 'shot', { dmg: 12, speed: 360, breaksGuard: true, proj: 'clockhand' }]),
    [1.7, 'radial', { count: 12, kind: 'clockhand', dmg: 12, speed: 150 }], [2.2, 'rift', {}], [2.5, 'radial', { count: 12, kind: 'clockhand', dmg: 12, speed: 150, offset: 0.26 }]] };

// The Yellow Court uses the same boss lifecycle and combat accounting as other foes.
ENEMY_TYPES.courtier = foe('beast', {
  name: 'Courtier Puppet', hp: 20, r: 4, speed: 62, mass: 1, postureMul: 1,
  summon: true, puppet: true, sprite: 'courtier', floating: true, lifespan: 10,
  passive: ['Marionette', 'Latches onto a nearby enemy and drains health.'],
  active: ['Yellow Strings', 'Drains 2 health every 0.5s while attached; never interrupts. Fades after 10s.'],
});
ENEMY_TYPES.yellowking = boss('talisman', {
  name: 'King in Yellow', hp: 400, r: 9, mass: 4, speed: 40, scale: 1,
  sprite: 'b_yellowking', sprite2: 'b_yellowking2', form2: 'True Form Descends',
  color: '#fff23c', superBoss: true, yellowKing: true, statusImmune: true,
  pierceIframes: true, floating: true, noFlinch: true, ward: false, minionCap: 4,
  moves: moveSet({ strike: { range: 22, dmg: 13 }, heavy: { range: 26, dmg: 24 } }),
  specials: [
    { id: 'silkflight', kind: 'silkflight', wind: 0.65, recover: 0.45, cd: 6, maxRange: 999 },
    { id: 'yellowcourt', kind: 'summon', wind: 0.9, recover: 0.6, cd: 11, energy: 35, minions: ['courtier'], cap: 3 },
  ],
  phase2: { speedMul: 1.15, cdMul: 0.7, dmgMul: 1.25, flags: {}, replace: {},
    add: [{ id: 'cosmiceye', kind: 'cosmiceye', wind: 1.2, recover: 0.8, cd: 12, maxRange: 999 }] },
  passive: ['Sovereign of Carcosa', 'All summoned creatures join his court. Immune to control and time stop; attacks pierce invulnerability. True form drains 0.75% enemy max health each second.'],
  active: ['Silken Exodus / Yellow Court', 'Dissolves into birds, heals 4% max health, and leaves a 2-second dust clone; summons clinging puppets. True form opens an eye: 12% max-health damage and 1.6s fear.'],
  ult: { name: 'Twin Black Stars', mobile: true, dr: 0.3, charge: 1.3, dur: 6, cd: 18, dark: 'rgba(4,7,20,0.7)', steps: [[0, 'blackstars', {}]] },
  ult2: { name: 'A Galaxy Falls on Carcosa', dr: 0.75, charge: 1.6, dur: 4, cd: 20, dark: 'rgba(2,4,15,0.85)', steps: [[0, 'galaxyfall', {}]] },
});

// ---------- the super boss "???": a jack of all trades who rolls a die for every cast ----------
ENEMY_TYPES.unknown = boss('ninja', {
  name: '???', hp: 260, r: 7, scale: 1.2, mass: 2, speed: 56, postureMul: 0.5, superBoss: true,
  sprite: 'b_mystery', sprite2: 'b_yunxi', form2: 'Yun Xi, Gambler of Fate', color: '#ffffff', lore: 'WAIT... DO I KNOW HER?', mystery: true, dmgScale: 0.5, dmgScale2: 0.65, resist2: 0.75, minionCap: 4, lastGamble: true,
  multicast: true, infiniteMana: true, tal: { shadowStep: 1 }, dodgeP: 0.45, dodgeP2: 0.85, evasive: false,
  unstoppable: true, // a 50% chance to shrug off any stun, root, scare or interrupt (time stop always lands)
  moves: moveSet({ strike: { dmg: 12, range: 18 }, heavy: { dmg: 22, range: 20 } }),
  specials: [{ id: 'multicast', kind: 'multicast', cd: 1, wind: 0.4, recover: 0.4 }],
  phase2: { speedMul: 1.3, cdMul: 0.8, dmgMul: 1.2, heal: 0.25, add: [], replace: {}, flags: { instinct: true } },
  passive: ['Shadow Step, Unstoppable, Against the Odds', 'The lower her health, the less damage gets through (up to 90%) and the faster she casts (down to every 0.5s). Untouchable while rolling and dodges on instinct. Half of all stuns, roots, scares and interrupts simply fail (time stop always lands). Never runs out of energy.'],
  active: ['Multi-cast', 'Every second: picks any regular foe skill at random and rolls a die to cast it 1-6 times at once. Second form: rolls at least a 4 and casts only boss skills, including Gojo techniques.'],
});

// ---------- super boss: Satoru Gojo, the Limitless ----------
const GOJO_BLUE = { id: 'blue', kind: 'vortex', variant: 'blue', maxRange: 160, wind: 0.5, recover: 0.35, radius: 26, duration: 1.2, pull: 150, dmg: 16, cd: 4 };
const GOJO_RED = { id: 'red', kind: 'shoot', proj: 'red', shots: 1, speed: 260, dmg: 20, kb: 340, radius: 5, minRange: 0, maxRange: 150, wind: 0.55, recover: 0.4, breaksGuard: true, hitPosture: 25, cd: 4.5 };
const GOJO_PURPLE = { id: 'purple', kind: 'shoot', proj: 'purple', shots: 1, speed: 150, dmg: 40, radius: 13, life: 2.8, minRange: 20, maxRange: 260, wind: 1.3, recover: 0.6,
  unblockable: true, pierce: true, erase: true, kb: 200, hitPosture: 40, cd: 14 };
ENEMY_TYPES.gojo = boss('taichi', {
  name: 'Satoru Gojo', hp: 360, r: 7, scale: 1.15, mass: 2, speed: 54, postureMul: 0.45, superBoss: true,
  sprite: 'b_gojo', sprite2: 'b_gojo2', form2: 'The Strongest', lore: 'THE BLINDFOLD COMES OFF', color: '#7fd0ff',
  infinity: true, strainMax: 120, honoredRevive: true, redirect: false, kbOut: 0.7,
  moves: moveSet({ strike: { dmg: 13, range: 18, wind: 0.14 }, heavy: { dmg: 24, range: 20 } }),
  specials: [
    { id: 'rct', kind: 'rct', wind: 0.4, recover: 0.3, heal: 0.08, cd: 14 },
    { id: 'tp', kind: 'gojotp', minRange: 30, maxRange: 220, wind: 0.12, recover: 0.08, cd: 3 },
    GOJO_PURPLE, GOJO_BLUE, GOJO_RED,
  ],
  phase2: { speedMul: 1.2, cdMul: 0.7, dmgMul: 1.25, heal: 0, add: [], flags: {},
    replace: {
      blue: { ...GOJO_BLUE, radius: 40, duration: 1.8, pull: 230, dmg: 26, wind: 0.45 },  // Maximum Output: Blue
      red: { ...GOJO_RED, speed: 300, dmg: 28, kb: 440, radius: 7, wind: 0.45 },         // Maximum Output: Red
      purple: { ...GOJO_PURPLE, radius: 17, dmg: 48, wind: 0.75, cd: 11 },               // Unlimited Hollow Purple: no hands needed
    } },
  passive: ['Infinity, Six Eyes', 'Hits stop just short of him while Infinity is up; it drops while he is casting or recovering, and too many blocked hits burn it out for 3s. Heals himself with Reverse Cursed Technique.'],
  active: ['Blue, Red, Hollow Purple, Teleport', 'Blue drags you in, Red blasts you away, Purple erases everything in a line. Second form: Maximum Output. Rises once from death as the Honored One.'],
});
ENEMY_TYPES.gojo.ult = { name: 'Unlimited Void', charge: 1.0, dur: 3.6, cd: 18, dark: 'rgba(0,0,0,0.3)',
  steps: [[0, 'domain', { dur: 3.6, freeze: 3.0 }], ...Array.from({ length: 12 }, (_, i) => [0.4 + i * 0.18, 'voidstrike', { dmg: 3.6 }]), [2.8, 'voidstrike', { dmg: 16, kb: 320 }]] };
ENEMY_TYPES.gojo.ult2 = { name: 'Unlimited Void', charge: 0.8, dur: 4.0, cd: 16, dark: 'rgba(0,0,0,0.3)',
  steps: [[0, 'domain', { dur: 4.0, freeze: 2.8 }], ...Array.from({ length: 10 }, (_, i) => [0.35 + i * 0.17, 'voidstrike', { dmg: 6, black: true }]), [2.3, 'purplecharge', {}], [3.0, 'purpleult', { radius: 20, dmg: 44, speed: 170 }]] };
ENEMY_TYPES.gojo.ult3 = { name: 'Hollow Purple 200%', charge: 1.4, dur: 2.8, cd: 14, dark: 'rgba(20,0,40,0.55)',
  steps: [[0, 'purplecharge', {}], [1.0, 'purpleult', { radius: 30, dmg: 64, speed: 120 }]] };

// The future self's arsenal: weapons from years ahead, each one used once.
const FUTURE_ARSENAL = [
  { weapon: 'Plasma Rifle', id: 'plasma', kind: 'shoot', proj: 'plasma', shots: 5, spread: 0.07, speed: 300, dmg: 8, breaksGuard: true, wind: 0.35, recover: 0.4 },
  { weapon: 'Railgun', id: 'railgun', kind: 'shoot', proj: 'rail', shots: 1, speed: 520, dmg: 32, laser: true, breaksGuard: true, pierce: true, radius: 3, kb: 160, hitPosture: 30, wind: 0.9, recover: 0.5 },
  { weapon: 'Orbital Strike', id: 'orbital', kind: 'sigil', variant: 'orbital', radius: 18, dmg: 30, delay: 1.5, follow: true, unblockable: true, kb: 120, wind: 0.3, recover: 0.3 },
  { weapon: 'Gravity Grenade', id: 'gravity', kind: 'vortex', variant: 'gravity', radius: 28, duration: 1.3, pull: 180, dmg: 22, wind: 0.35, recover: 0.3 },
  { weapon: 'Drone Swarm', id: 'drones', kind: 'swords', proj: 'drone', count: 5, dmg: 8, wind: 0.4, recover: 0.3 },
  { weapon: 'EMP Grenade', id: 'emp', kind: 'sigil', variant: 'emp', radius: 24, dmg: 10, delay: 0.6, kb: 60, unblockable: true, wind: 0.3, recover: 0.3 },
  { weapon: 'Phase Shield', id: 'shield', kind: 'shield', amount: 50, dur: 6, wind: 0.2, recover: 0.2 },
];

const FUTURE_PROJ = new Set(['plasma', 'rail', 'drone']);

// The Time Administrator's third form: you, from the past. Weaker, but it reaches back in time.
const PAST_SPECIALS = [
  { id: 'pastecho', kind: 'pastecho', maxRange: 999, wind: 0.45, recover: 0.35, dmg: 20, cd: 3.5 },  // strike your younger self; the wound arrives now
  { id: 'yesterday', kind: 'rewindfoe', maxRange: 999, wind: 0.4, recover: 0.4, cd: 9 },        // drag you back to where you stood 3s ago
  { id: 'hands', kind: 'shoot', proj: 'clockhand', shots: 3, spread: 0.25, speed: 190, dmg: 12, minRange: 20, maxRange: 150, wind: 0.4, recover: 0.35, cd: 2.8 },
];
const PAST_ULT = { name: 'Paradox', charge: 0.9, dur: 2.8, cd: 16, dark: 'rgba(30,20,60,0.5)',
  steps: [[0, 'pastechoall', { dmg: 14 }], [0.7, 'pastechoall', { dmg: 14 }], [1.4, 'pastechoall', { dmg: 14 }], [1.8, 'rewindall', {}], [2.2, 'radial', { count: 12, kind: 'clockhand', dmg: 12, speed: 150 }]] };
const spriteOfDef = f => (f.def && f.def.boss && f.phase === 2 && f.def.sprite2) || (f.def && f.def.sprite) || f.type;
// Skills worth copying six times over in ???'s last gamble
const MULTI_ULT_STEPS = new Set(['sigil', 'lightning', 'palmrain', 'shot', 'breath', 'cross', 'dragonbreath', 'radial', 'voidstrike', 'purpleult', 'orbs', 'drain', 'swordRing']);
const JITTER_ULT_STEPS = new Set(['sigil', 'lightning', 'palmrain', 'shot', 'breath', 'cross', 'dragonbreath', 'purpleult']);

// what's left of the Lich when it falls: three pieces that keep fighting, and answer to no king
Object.assign(ENEMY_TYPES, {
  lichhead: foe('caster', {
    name: "Lich's Head", hp: 45, r: 4, speed: 34, mass: 0.6, postureMul: 1.2, floating: true, noClaim: true, lichPart: true, sprite: 'lichhead',
    moves: moveSet({ strike: { dmg: 8 } }),
    specials: [{ id: 'orb', kind: 'orb', minRange: 20, maxRange: 180, wind: 0.5, recover: 0.4, dmg: 12, cd: 3 },
      { id: 'spikes', kind: 'sigil', pattern: 'line', count: 6, spacing: 12, step: 0.06, maxRange: 160, wind: 0.5, recover: 0.5, dmg: 14, radius: 8, delay: 0.5, cd: 4.5, unblockable: true, variant: 'soulspikes' }],
    passive: ['Crowned Skull', 'Floats out of reach and keeps casting.'], active: ['Soul Orb, Soul Spikes', 'What the Lich could still do with only its head.'],
  }),
  lichtorso: foe('guardian', {
    name: "Lich's Torso", hp: 75, r: 6, speed: 20, mass: 3, postureMul: 0.6, noClaim: true, lichPart: true, sprite: 'lichtorso',
    moves: moveSet({ strike: { dmg: 12, range: 16 }, heavy: { dmg: 20, range: 18 } }),
    specials: [{ id: 'gravepulse', kind: 'slam', radius: 24, wind: 0.6, recover: 0.6, dmg: 12, kb: 120, cd: 4, unblockable: true, hitPosture: 20, variant: 'blood' }],
    passive: ['Ribcage', 'Slow and heavy; drags itself toward you.'], active: ['Grave Pulse', 'A soul-green shockwave from the ribs.'],
  }),
  lichleg: foe('bruiser', {
    name: "Lich's Leg", hp: 40, r: 4, speed: 78, mass: 0.8, postureMul: 1.2, noClaim: true, lichPart: true, sprite: 'lichleg', aggr: 0.95,
    moves: moveSet({ strike: { dmg: 10, wind: 0.15 }, heavy: { dmg: 18 } }),
    specials: [{ id: 'tackle', kind: 'pounce', minRange: 16, maxRange: 70, wind: 0.3, recover: 0.4, dmg: 12, kb: 160, lunge: 280, lungeTime: 0.25, cd: 3, hitPosture: 20 }],
    passive: ['Restless Bone', 'Fast, hopping, never stops kicking.'], active: ['Bone Stomp', 'A leaping kick that knocks you back.'],
  }),
});
ENEMY_TYPES.lich.splitInto = ['lichhead', 'lichtorso', 'lichleg'];


// ---------- four more super bosses: the Blind Gentleman, the Monkey King, Mahoraga, the Zerg Queen ----------
// a flash of steel from behind the target; a long staff; a beam is any long straight strike
const SPACE_CUT = { variant: 'cut', len: 70, width: 5, dmg: 4, delay: 0.22, trueDmg: true, pierceAll: true, kb: 30 };
ENEMY_TYPES.blind = boss('fencer', {
  name: 'The Blind Gentleman', hp: 140, r: 6, mass: 1.3, speed: 56, postureMul: 0.7, superBoss: true, kbOut: 0.8,
  sprite: 'b_blind', sprite2: 'b_blind2', form2: 'Undying Heart', color: '#ffb7d5', lore: 'HIS HEART REFUSES TO STOP',
  trueDamage: true, focusGain: true, undyingHeart: 4, riposte: true, evasive: false, mikiri: true,
  parryP: 0.8, blockP: 0.75, dodgeP: 0.35, dodgeP2: 0.5, counterP: 0.6, react: 0.15, aggr: 0.6, chainP: 0.5, maxChain: 2,
  moves: moveSet({ strike: { dmg: 12, range: 18, wind: 0.12 }, heavy: { dmg: 22, range: 20, wind: 0.36 } }),
  specials: [
    { id: 'iaidraw', kind: 'iaidraw', minRange: 12, maxRange: 120, wind: 0.42, recover: 0.35, dmg: 18, kb: 60, hitPosture: 25, parryPosture: 50, cd: 3.5 },
    { id: 'sakurafall', kind: 'sigil', pattern: 'scatter', count: 4, maxRange: 999, wind: 0.3, recover: 0.3, dmg: 7, radius: 7, delay: 0.9, cd: 6, unblockable: true, variant: 'sakura', trueDmg: true },
  ],
  passive: ['Undying Heart, Clear Mind, Mikiri', 'Frail, but parries, slips and counters almost everything (summons and multi-hit attacks are deflected most of the time); each parry, dodge and counter sharpens him (more damage, speed and petals). Everything he does is true damage. He dies four times before he truly dies: each life is stronger, with half the health.'],
  active: ['Iaijutsu', 'A draw so fast you only see the line it leaves. Sakura falls over the arena as cold blades. Ultimates: a thousand cuts in the air; in his last lives he draws once, invincible, cuts through every defense and splits the sky in two.'],
  ult: { name: 'Judgment of a Thousand Cuts', unbreakable: true, charge: 0.8, dur: 2.6, cd: 15, dark: 'rgba(20,0,30,0.6)',
    steps: [[0, 'vanish', { dur: 2.3 }], ...Array.from({ length: 12 }, (_, i) => [0.15 + i * 0.11, 'spacecut', {}]), [1.8, 'beam', { ...SPACE_CUT, variant: 'bigcut', len: 160, width: 14, dmg: 16, delay: 0.25, aimed: true }],
      [2.35, 'reappear', {}]] },
  ult2: { name: 'Severing the Heavens', unbreakable: true, untouchable: true, charge: 1.0, dur: 3.1, cd: 13, dark: 'rgba(0,0,0,0.78)',
    steps: [[0, 'vanish', { dur: 3.0 }], [0.1, 'skysplit', {}], [0.85, 'beam', { ...SPACE_CUT, variant: 'sever', len: 320, width: 22, dmg: 26, maxHpPct: 0.07, delay: 0.01, aimed: true, kb: 160 }],
      ...Array.from({ length: 8 }, (_, i) => [1.2 + i * 0.12, 'spacecut', { dmg: 6 }]), [2.8, 'reappear', {}]] },
});

ENEMY_TYPES.wukong = boss('ninja', {
  name: 'Sun Wukong', phase2At: 0.3, hp: 520, r: 6, mass: 2.5, speed: 60, postureMul: 0.35, superBoss: true, kbOut: 0.3, minionCap: 10, dr: 0.25, dr2: 0.45,
  sprite: 'b_wukong', sprite2: 'b_wukong2', form2: 'Victorious Fighting Buddha', color: '#ffd84a', lore: 'THE GREAT SAGE, EQUAL OF HEAVEN',
  fireImmune: true, trueSight: true, evasive: true, dodgeP: 0.35, parryP: 0.5, blockP: 0.5, counterP: 0.4, aggr: 0.75,
  moves: moveSet({ strike: { range: 26, dmg: 13, wind: 0.16 }, heavy: { range: 30, dmg: 24, wind: 0.4, kb: 150 } }),
  specials: [
    { id: 'hairclones', kind: 'summon', wind: 0.5, recover: 0.3, cd: 7, minions: ['monkeyclone', 'monkeyclone', 'monkeyclone', 'monkeyclone'], cap: 9 },
    { id: 'ruyi', kind: 'beam', minRange: 18, maxRange: 140, wind: 0.45, recover: 0.4, len: 140, width: 6, dmg: 18, kb: 170, hitPosture: 22, cd: 3.5, variant: 'ruyi', delay: 0.05 },
    { id: 'somersault', kind: 'cloudhop', minRange: 50, maxRange: 999, wind: 0.25, recover: 0.25, dmg: 14, kb: 90, cd: 5 },
    { id: 'skyslam', kind: 'leap', minRange: 30, maxRange: 140, wind: 0.5, recover: 0.6, lunge: 300, lungeTime: 0.55, radius: 24, dmg: 26, kb: 200, hitPosture: 25, cd: 5.5, unblockable: true },
    { id: 'staffspin', kind: 'spinguard', wind: 0.15, recover: 0.1, dur: 1.6, cd: 6 },
  ],
  phase2: { speedMul: 1, cdMul: 0.7, dmgMul: 1.4, heal: 1, flags: { giant: true, r: 14, mass: 12 },
    replace: { hairclones: { id: 'hairclones', kind: 'summon', wind: 0.5, recover: 0.3, cd: 8, minions: ['gorillaclone', 'gorillaclone', 'gorillaclone'], cap: 9 },
      ruyi: { id: 'ruyi', kind: 'beam', minRange: 10, maxRange: 300, wind: 0.6, recover: 0.5, len: 300, width: 16, dmg: 28, kb: 220, hitPosture: 30, cd: 3, variant: 'ruyi', delay: 0.05, unblockable: true } },
    add: [{ id: 'skyslam', kind: 'leap', minRange: 20, maxRange: 200, wind: 0.6, recover: 0.7, lunge: 320, lungeTime: 0.6, radius: 40, dmg: 34, kb: 260, hitPosture: 30, cd: 5, unblockable: true },
      { id: 'giantsweep', kind: 'slam', radius: 46, wind: 0.75, recover: 0.7, dmg: 24, kb: 260, unblockable: true, hitPosture: 25, variant: 'ruyisweep', cd: 4 }] },
  passive: ['Diamond Body, Fiery Golden Eyes', 'He ate the peaches of immortality and survived the Eight Trigrams Furnace: 25% less damage (45% as the giant), immune to fire, and eyes that see through every illusion and decoy.'],
  active: ['Hair Clones, Ruyi Jingu Bang, Cloud Somersault, Sky Slam, Staff Spin', 'Plucks hairs that become monkeys, extends his staff across the stage, somersaults on a cloud to land behind you, leaps and brings the staff down, spins the staff into a wheel that sends projectiles back. At 30% health he becomes a huge gorilla, back to full health, and his clones become gorillas too.'],
  // both ultimates are cast on the move: he keeps fighting while the staff falls, and nothing touches him as they open
  ult: { name: 'Ten Thousand Monkeys', mobile: true, iframes: 1.5, dr: 0.4, charge: 1.0, dur: 3.2, cd: 16, dark: 'rgba(40,25,0,0.5)',
    steps: [[0, 'monkeyswarm', { count: 8 }], [0.3, 'skystaff', { r: 26, dmg: 32 }], [1.4, 'skystaff', { r: 26, dmg: 32 }], [2.4, 'monkeyswarm', { count: 4 }]] },
  ult2: { name: 'The Pillar That Holds Up Heaven', mobile: true, iframes: 2.2, dr: 0.5, charge: 1.2, dur: 4.0, cd: 15, dark: 'rgba(50,30,0,0.6)',
    steps: [[0, 'beam', { variant: 'pillar', len: 320, width: 26, dmg: 34, kb: 240, delay: 0.9, aimed: true }], [0.4, 'monkeyswarm', { count: 6 }],
      [1.2, 'beam', { variant: 'pillar', len: 320, width: 26, dmg: 34, kb: 240, delay: 0.9, aimed: true, turn: 1.0 }],
      [2.2, 'beam', { variant: 'pillar', len: 320, width: 26, dmg: 34, kb: 240, delay: 0.9, aimed: true, turn: -1.0 }], [2.9, 'skystaff', { r: 44, dmg: 52, quake: true }]] },
});

ENEMY_TYPES.mahoraga = boss('berserker', {
  name: 'Mahoraga', hp: 460, r: 9, mass: 6, speed: 42, postureMul: 0.3, superBoss: true, kbOut: 0.7, dr: 0.1, bloodrage: false, adaptSlots: 3,
  sprite: 'b_mahoraga', sprite2: 'b_mahoraga2', form2: 'Eight-Handled Sword Divergent Sila Divine General', color: '#ece4d2', lore: 'THE WHEEL TURNS',
  adapts: true, noFlinch: true,
  moves: moveSet({ strike: { dmg: 16, range: 22, wind: 0.3, kb: 120 }, heavy: { dmg: 30, range: 24, wind: 0.6, kb: 200 } }),
  specials: [
    { id: 'extermination', kind: 'flurry', reach: 26, range: 24, arc: 1.0, hits: 3, interval: 0.28, step: 60, wind: 0.45, recover: 0.6, dmg: 14, kb: 90, hitPosture: 14, cd: 4.5,
      finisher: { id: 'exterminate', dmg: 26, kb: 220, breaksGuard: true, trueDmg: true } },
    { id: 'divinefist', kind: 'pounce', minRange: 25, maxRange: 110, wind: 0.5, recover: 0.6, dmg: 22, kb: 240, lunge: 320, lungeTime: 0.32, cd: 5, breaksGuard: true, hitPosture: 30, parryPosture: 50 },
    { id: 'mquake', kind: 'slam', radius: 34, wind: 0.8, recover: 0.8, dmg: 20, kb: 200, cd: 6, unblockable: true, hitPosture: 25, variant: 'quake' },
  ],
  phase2: { speedMul: 1.25, cdMul: 0.7, dmgMul: 1.35, heal: 0.2, flags: {}, replace: {}, add: [] },
  passive: ['Adaptation', 'The Dharma wheel over its head turns each time a phenomenon hurts it: a quarter turn heals it a little, and after a full turn it is adapted (75% less damage from that kind of attack; adapted to projectiles it sends them back, adapted to a blow it counters it). The wheel only holds three kinds at once: a fourth makes it forget the oldest. It slowly adapts to everything over time, shrugs off conditions more each time, and even adapts to Infinity and stopped time.'],
  active: ['Sword of Extermination', 'A three-cut combo ending in a true-damage cleave, a divine fist, an unblockable stomp. Its ultimate turns the wheel on everything at once and brings the sword down.'],
  ult: { name: 'Divine General\'s Judgment', charge: 1.1, dur: 2.8, cd: 16, dark: 'rgba(30,25,10,0.55)',
    steps: [[0, 'wheelspin', {}], [0.4, 'beam', { variant: 'exterminate', len: 170, width: 14, dmg: 30, kb: 200, delay: 0.5, aimed: true, trueDmg: true }],
      [1.3, 'beam', { variant: 'exterminate', len: 170, width: 14, dmg: 30, kb: 200, delay: 0.5, aimed: true, turn: 1.57, trueDmg: true }], [2.2, 'radial', { count: 10, kind: 'qi', dmg: 12, speed: 170 }]] },
});

const ZERG_BROOD = ['zergling', 'zergling', 'zergling', 'zergling', 'spitter', 'spitter', 'bloater', 'brute'];
ENEMY_TYPES.zergqueen = boss('necromancer', {
  name: 'Zerg Queen', hp: 300, r: 8, mass: 3, speed: 36, postureMul: 0.5, superBoss: true, minionCap: 11, raiseDead: false,
  broodOnSpawn: ['zergling', 'zergling', 'zergling', 'spitter', 'brute'], broodBound: true, broodFeeds: true,
  sprite: 'b_queen', sprite2: 'b_queen2', form2: 'Mother of the Swarm', color: '#b84aff', lore: 'THE SWARM IS ENDLESS',
  specials: [
    { id: 'transfuse', kind: 'transfuse', wind: 0.3, recover: 0.3, heal: 25, cd: 5 },
    { id: 'carapace', kind: 'shield', amountPct: 0.2, dur: 8, wind: 0.5, recover: 0.3, cd: 14 },
    { id: 'brood', kind: 'summon', wind: 0.4, recover: 0.3, cd: 2.0, minions: ZERG_BROOD, pick: 1, picks: 2, cap: 11 },
    { id: 'desperation', kind: 'summon', desperate: true, wind: 0.15, recover: 0.1, cd: 0.8, minions: ['bladeguard'], pick: 1, picks: 1, cap: 13 },
    { id: 'creep', kind: 'zone', self: true, maxRange: 999, wind: 0.4, recover: 0.3, cd: 9, zone: { variant: 'creep', r: 32, life: 10, ally: true } },
    { id: 'acidspines', kind: 'shoot', proj: 'spine', shots: 5, spread: 0.15, speed: 200, dmg: 7, minRange: 20, maxRange: 170, wind: 0.4, recover: 0.4, cd: 2.5, poison: 3, poisonT: 2 },
  ],
  phase2: { speedMul: 1.3, cdMul: 0.55, dmgMul: 1.25, heal: 0.2, flags: { r: 6 },
    replace: { brood: { id: 'brood', kind: 'summon', wind: 0.4, recover: 0.3, cd: 2.8, minions: ['brute', 'bladeguard', 'bladeguard'], pick: 1, picks: 1, cap: 9 } },
    add: [{ id: 'queenblades', kind: 'flurry', reach: 18, range: 16, arc: 1.1, hits: 4, interval: 0.14, step: 90, wind: 0.35, recover: 0.5, dmg: 9, kb: 40, hitPosture: 10, cd: 4, finisher: { dmg: 16, kb: 180, breaksGuard: true } },
      { id: 'empower', kind: 'broodbuff', wind: 0.5, recover: 0.3, cd: 7, hpPct: 0.4, dmg: 1.4 }] },
  passive: ['Brood-Bound, Creep, Carapace', 'She hardens her carapace into a shield worth 20% of her health for 8s. She heals a little whenever one of her brood dies (more for brutes, most for bladeguards). She cannot die while any of her true brood lives. Once it is all that holds her up, she spills out a stream of elite bladeguards instead: they fight hard, but they can\'t keep her alive. Creep heals her swarm and slows you. She tops up wounded swarmlings.'],
  active: ['The Endless Brood', 'Arrives with a brood and keeps spawning zerglings, spitters, bloaters that burst into acid, and armored brutes. Her second form is a tall humanoid with bladed limbs who hatches only brutes and elite bladeguards and empowers her brood (+40% health and damage). At the brink of death she spills out elite bladeguards without pause; they fight, but cannot keep her alive.'],
  ult: { name: 'The Swarm Hungers', charge: 1.0, dur: 2.6, cd: 16, dark: 'rgba(30,0,40,0.55)',
    steps: [[0, 'swarm', { n: 8 }], [0.5, 'radial', { count: 14, kind: 'spine', dmg: 8, speed: 150 }], [1.6, 'swarm', { n: 4 }]] },
});

// ---------- super boss: the Headless Scholar, a polluted thing from a world painted in ink ----------
const SCHOLAR_RULES = [
  { rule: 'noenergy', name: 'NO BREATH IS DRAWN' },          // energy can't be spent or regained (plain strikes still land)
  { rule: 'exposed', name: 'NOTHING SHIELDS THE FLESH' },    // no defense, damage reduction or status resistance
  { rule: 'nomove', name: 'NO STEP IS TAKEN', dur: 3 },      // no movement or rolling
  { rule: 'noblock', name: 'NO GUARD STANDS' },              // no blocking, so no parrying
  { rule: 'nosummon', name: 'NONE STANDS BESIDE YOU' },      // no new summons or clones; the ones already out are bound in ink
];
const HEAD_FIGHTERS = ['chessist', 'lampbearer', 'butcher', 'coffinbearer', 'flutist'];
ENEMY_TYPES.scholar = boss('fencer', {
  name: 'The Headless Scholar', hp: 70, r: 5, scale: 1, mass: 1.5, speed: 50, postureMul: 0.6, superBoss: true, kbOut: 0.6,
  sprite: 'b_scholar1', sprite2: 'b_scholar', form2: 'World Within a Painting', color: '#ece4d2', lore: 'THE PAINTING OPENS',
  conceptual: true, scholar: true, riposte: false, evasive: false, minionCap: 10,
  parryP: 0.5, blockP: 0.4, dodgeP: 0.2, counterP: 0.4, react: 0.18, aggr: 0.75, chainP: 0.4, maxChain: 2,
  moves: moveSet({ strike: { dmg: 11, range: 18, wind: 0.14, hitPosture: 14 }, heavy: { dmg: 20, range: 22, hitPosture: 30 } }),
  specials: [
    { id: 'umbrellashield', kind: 'inkshield', form: 'shield', wind: 0.06, recover: 0.1, dur: 1.4, cd: 7 },
    { id: 'recitation', kind: 'summon', form: 'closed', wind: 0.5, recover: 0.3, cd: 9, minions: ['recitinghead'], cap: 3 },
    { id: 'scholarstep', kind: 'scholarstep', form: 'closed', minRange: 0, maxRange: 999, wind: 0.2, recover: 0.15, cd: 4 },
    { id: 'umbrellasword', kind: 'flurry', form: 'sword', reach: 20, range: 18, arc: 0.9, hits: 4, interval: 0.16, step: 70, wind: 0.3, recover: 0.5, dmg: 7, kb: 20, hitPosture: 14, blockPosture: 16, parryPosture: 25, cd: 4,
      finisher: { dmg: 12, kb: 90, hitPosture: 35 } },
    { id: 'umbrellaspear', kind: 'melee', form: 'spear', range: 32, wind: 0.35, recover: 0.4, dmg: 14, kb: 120, hitPosture: 28, breaksGuard: true, parryPosture: 40, cd: 3.5 },
    { id: 'umbrellafan', kind: 'cone', form: 'fan', range: 52, angle: 0.6, wind: 0.45, recover: 0.4, dmg: 8, kb: 200, hitPosture: 22, unblockable: true, variant: 'ink', cd: 5 },
    { id: 'umbrellahook', kind: 'shoot', form: 'hook', proj: 'inkhook', shots: 1, speed: 240, dmg: 6, minRange: 30, maxRange: 140, wind: 0.35, recover: 0.3, pull: true, life: 0.7, hitPosture: 18, cd: 6 },
  ],
  phase2: { speedMul: 1.15, cdMul: 0.75, dmgMul: 1.25, heal: 0, flags: { painting: true }, replace: {}, add: [] },
  passive: ['Conceptual Dislocation; in the painting: Polluted Scripture, The Painting Remembers', 'Every damage instance against him deals exactly 1, whatever it is; he has little health, so it is the number of hits that matters. His second form opens a world within a painting (silent, ink rain, ink dragons, heads that roll off him and grow into fighters), rewrites the rules of combat every few seconds, and casts back the techniques you keep repeating.'],
  active: ['Umbrella of Ten Thousand Uses', 'Sword and spear for stunning combos, a fan of ink wind, a hook, a shield that stops even what cannot be stopped. Scholar\'s Step: one step that crosses half the stage. Headless Recitation: chanting heads.'],
  ult: { name: 'One Stroke to End the Chapter', unbreakable: true, charge: 1.0, dur: 2.6, cd: 15, dark: 'rgba(20,16,10,0.5)',
    steps: [[0, 'brushform', {}], [0.1, 'beam', { variant: 'inkstroke', len: 340, width: 26, dmg: 36, kb: 200, delay: 1.8, aimed: true }]] },
  ult2: { name: 'The Dragon Devours the Sun', unbreakable: true, untouchable: true, charge: 1.0, dur: 6.4, cd: 18, dark: 'rgba(0,0,0,0.2)',
    steps: [[0, 'dragonmerge', {}], [1.4, 'redeye', {}],
      [1.8, 'beam', { variant: 'dragonstrike', len: 320, width: 30, dmg: 22, kb: 160, delay: 0.9, aimed: true, turn: 0.6 }],
      [2.6, 'beam', { variant: 'dragonstrike', len: 320, width: 30, dmg: 22, kb: 160, delay: 0.9, aimed: true, turn: -0.9 }],
      [3.4, 'beam', { variant: 'dragonstrike', len: 320, width: 30, dmg: 22, kb: 160, delay: 0.9, aimed: true, turn: 1.6 }],
      [4.0, 'dragonbite', { delay: 2.0, dmg: 40, pct: 0.2 }]] },
});
// what the painting brings with it: heads, the fighters they grow into, ink dragons
Object.assign(ENEMY_TYPES, {
  recitinghead: foe('caster', {
    name: 'Reciting Head', noClaim: true, hp: 14, r: 3, speed: 30, mass: 0.6, postureMul: 1.5, summon: true, keepSkills: true, floating: true, lifespan: 14, near: 50, far: 100, aggr: 0.3,
    moves: moveSet({ strike: { dmg: 3 } }),
    specials: [{ id: 'recite', kind: 'shoot', proj: 'inkorb', shots: 1, speed: 110, dmg: 7, minRange: 10, maxRange: 170, wind: 0.5, recover: 0.4, homing: 1.6, cd: 1.6 }],
  }),
  rollinghead: foe('beast', {
    name: 'Rolling Head', noClaim: true, hp: 10, r: 3, speed: 34, mass: 0.5, postureMul: 2, summon: true, keepSkills: true, humanoid: false, rollingHead: true, aggr: 0.1, ai: 'kite', near: 40, far: 80,
    moves: moveSet({ strike: { dmg: 2, range: 8 } }),
  }),
  chessist: foe('duelist', {
    name: 'Chessboard Scholar', noClaim: true, hp: 26, r: 5, speed: 40, mass: 1, postureMul: 1, summon: true, keepSkills: true, aggr: 0.6,
    moves: moveSet({ strike: { dmg: 8, kb: 60 } }),
    specials: [{ id: 'chesspieces', kind: 'shoot', proj: 'chesspiece', shots: 3, spread: 0.25, speed: 160, dmg: 6, minRange: 20, maxRange: 150, wind: 0.4, recover: 0.4, cd: 2.5 }],
  }),
  lampbearer: foe('caster', {
    name: 'Lamp Bearer', noClaim: true, hp: 22, r: 5, speed: 38, mass: 1, postureMul: 1, summon: true, keepSkills: true, aggr: 0.5,
    moves: moveSet({ strike: { dmg: 6 } }),
    specials: [{ id: 'lampfire', kind: 'cone', range: 34, angle: 0.5, wind: 0.45, recover: 0.4, dmg: 9, kb: 40, hitPosture: 8, unblockable: true, variant: 'fire', cd: 3.5 }],
  }),
  butcher: foe('bruiser', {
    name: 'Headsman Butcher', noClaim: true, hp: 32, r: 5, speed: 46, mass: 1.4, postureMul: 0.8, summon: true, keepSkills: true, aggr: 0.85,
    moves: moveSet({ strike: { dmg: 11, range: 15 } }),
    specials: [{ id: 'cleave', kind: 'melee', range: 15, wind: 0.45, recover: 0.5, dmg: 18, kb: 120, hitPosture: 30, breaksGuard: true, cd: 3 }],
  }),
  coffinbearer: foe('guardian', {
    name: 'Coffin Bearer', noClaim: true, hp: 45, r: 6, speed: 30, mass: 3, postureMul: 0.5, summon: true, keepSkills: true, noFlinch: true, aggr: 0.5,
    moves: moveSet({ strike: { dmg: 10, kb: 120 } }),
    specials: [{ id: 'coffinslam', kind: 'slam', radius: 22, wind: 0.6, recover: 0.6, dmg: 14, kb: 150, hitPosture: 20, unblockable: true, variant: 'quake', cd: 4 }],
  }),
  flutist: foe('caster', {
    name: 'Flutist', noClaim: true, hp: 20, r: 5, speed: 40, mass: 1, postureMul: 1, summon: true, keepSkills: true, aggr: 0.4,
    moves: moveSet({ strike: { dmg: 5 } }),
    specials: [{ id: 'melody', kind: 'shoot', proj: 'note', shots: 2, spread: 0.3, speed: 120, dmg: 5, minRange: 15, maxRange: 160, wind: 0.35, recover: 0.35, homing: 1.2, slow: 1.0, cd: 2 }],
  }),
  inkdragon: foe('colossus', {
    name: 'Ink Dragon', noClaim: true, hp: 30, r: 7, speed: 42, mass: 3, postureMul: 0.6, summon: true, keepSkills: true, floating: true, ai: 'serpent', orbit: 50,
    moves: moveSet({ strike: { dmg: 10, range: 18, wind: 0.35, kb: 90 } }),
    specials: [{ id: 'inkbreath', kind: 'cone', range: 40, angle: 0.5, wind: 0.5, recover: 0.5, dmg: 10, kb: 60, hitPosture: 10, unblockable: true, variant: 'ink', cd: 4 }],
  }),
});

// the swarm and the monkeys: summons only these bosses call
Object.assign(ENEMY_TYPES, {
  shadowclone: foe('trickster', {
    name: 'Shadow Clone', hp: 12, r: 5, speed: 70, mass: 1, postureMul: 1.5, summon: true, hairClone: true, noClaim: true, sprite: 'hero', aggr: 0.95,
    moves: moveSet({ strike: { dmg: 7, wind: 0.12 } }),
  }),
  monkeyclone: foe('trickster', {
    name: 'Hair Clone', kbOut: 0.2, hp: 24, r: 5, speed: 64, mass: 0.8, postureMul: 1.2, summon: true, hairClone: true, sprite: 'b_wukong', scale: 0.8, lifespan: 12, aggr: 0.9,
    moves: moveSet({ strike: { dmg: 7, range: 20, wind: 0.16 } }),
  }),
  gorillaclone: foe('bruiser', {
    name: 'Gorilla Clone', kbOut: 0.25, hp: 48, r: 6, speed: 50, mass: 2.5, postureMul: 0.8, summon: true, hairClone: true, humanoid: false, sprite: 'b_wukong2', scale: 0.5, lifespan: 12, aggr: 0.9,
    moves: moveSet({ strike: { dmg: 12, range: 18, wind: 0.3, kb: 130 } }),
  }),
  zergling: foe('beast', {
    name: 'Zergling', hp: 14, r: 3, speed: 78, mass: 0.5, postureMul: 2, summon: true, zerg: true, ai: 'circle', orbit: 12, aggr: 0.95,
    moves: moveSet({ strike: { dmg: 4, range: 9, wind: 0.1, recover: 0.15 } }),
  }),
  spitter: foe('beast', {
    name: 'Spitter', hp: 22, r: 4, speed: 40, mass: 0.9, postureMul: 1.5, summon: true, zerg: true, keepSkills: true, ai: 'kite', near: 45, far: 95, aggr: 0.4,
    moves: moveSet({ strike: { dmg: 5, range: 10 } }),
    specials: [{ id: 'spinespit', kind: 'shoot', proj: 'spine', shots: 1, speed: 190, dmg: 7, minRange: 15, maxRange: 140, wind: 0.35, recover: 0.4, cd: 1.6 }],
  }),
  bloater: foe('beast', {
    name: 'Bloater', hp: 12, r: 4, speed: 52, mass: 0.7, postureMul: 2, summon: true, zerg: true, keepSkills: true, aggr: 0.9, burstOnDeath: true,
    moves: moveSet({ strike: { dmg: 2, range: 8 } }),
    specials: [{ id: 'detonate', kind: 'detonate', range: 6, wind: 0.35, recover: 0, radius: 18, dmg: 16, cd: 0 }],
  }),
  broodling: foe('beast', {
    name: 'Broodling', hp: 6, r: 3, speed: 82, mass: 0.4, postureMul: 2, summon: true, zerg: true, inferior: true, sprite: 'zergling', scale: 0.7, ai: 'circle', orbit: 10, aggr: 1, lifespan: 8,
    moves: moveSet({ strike: { dmg: 3, range: 8, wind: 0.1, recover: 0.12 } }),
  }),
  bladeguard: foe('beast', {
    name: 'Bladeguard', broodValue: 0.045, hp: 55, r: 6, speed: 62, mass: 1.6, postureMul: 0.7, summon: true, zerg: true, keepSkills: true, aggr: 0.9,
    moves: moveSet({ strike: { dmg: 10, range: 16, wind: 0.18 } }),
    specials: [{ id: 'scythes', kind: 'flurry', reach: 18, range: 16, arc: 0.9, hits: 3, interval: 0.15, step: 80, wind: 0.3, recover: 0.5, dmg: 7, kb: 30, hitPosture: 8, cd: 3.5, finisher: { dmg: 12, kb: 140 } }],
  }),
  brute: foe('beast', {
    name: 'Brute', broodValue: 0.03, hp: 70, r: 7, speed: 30, mass: 4, postureMul: 0.4, summon: true, zerg: true, keepSkills: true, noFlinch: true, aggr: 0.7,
    moves: moveSet({ strike: { dmg: 14, range: 16, wind: 0.4, kb: 140 } }),
    specials: [{ id: 'gore', kind: 'pounce', minRange: 18, maxRange: 70, wind: 0.55, recover: 0.7, dmg: 16, kb: 200, lunge: 230, lungeTime: 0.3, cd: 4, breaksGuard: true, hitPosture: 25, parryPosture: 40 }],
  }),
});

// a boss's summons fight with their bare hands: no abilities, no passives
const PASSIVE_FLAGS = ['ward', 'sway', 'redirect', 'riposte', 'counterOnBlock', 'bloodrage', 'lifesteal', 'regen', 'scales', 'plating',
  'iaido', 'swordQi', 'evasive', 'blinks', 'raiseDead', 'aura', 'blessing', 'undying', 'cheapShot'];

// ---------- talents: passives bought with jade, white (common) to black (mythic) ----------
const TIERS = [
  { name: 'White', color: '#d8d8d8', odds: 40 }, { name: 'Green', color: '#4caf50', odds: 28 }, { name: 'Blue', color: '#3f8ae0', odds: 18 },
  { name: 'Purple', color: '#9b59d6', odds: 9 }, { name: 'Red', color: '#e0412b', odds: 4 }, { name: 'Black', color: '#141414', odds: 1 },
];
// Races are a separate collection; their modifiers stack with equipped talents.
// Races are a separate collection, and deliberately small: each is a lineage's leaning, not a power. A race gives
// one or two modest strengths for a modest cost, uses no talent's signature effect, and no single number reaches
// the size of the talent that grants it. Rarer races are more particular, not much stronger.
const RACES = [
  { id: 'unformed', name: 'Unformed', tier: -1, desc: 'The Gu before it takes a lineage. No bonuses or drawbacks.', mods: {} },
  { id: 'human', name: 'Human', tier: 0, desc: 'Adaptable: +6 energy and +5% energy regeneration.', mods: { energy: 6, regen: 0.05 } },
  { id: 'stoneborn', name: 'Stoneborn', tier: 0, desc: 'A clay body: +8 posture and +5 health, but 4% slower.', mods: { posture: 8, hp: 5, speed: -0.04 } },
  { id: 'windkin', name: 'Windkin', tier: 1, desc: 'Light on its feet: +4% speed and 10% shorter roll cooldown, but -6 health.', mods: { speed: 0.04, rollCd: -0.1, hp: -6 } },
  { id: 'ironblood', name: 'Ironblood', tier: 1, desc: 'Hard-hitting: +7% heavy damage and +10% kick posture damage, but 5% slower energy regeneration.', mods: { heavyDmg: 0.07, kickPosture: 0.1, regen: -0.05 } },
  { id: 'moonfang', name: 'Moonfang', tier: 2, desc: 'Hungry: heals 3% of damage dealt, but takes 4% more damage.', mods: { lifesteal: 0.03, dmgTaken: 0.04 } },
  { id: 'riverfolk', name: 'Riverfolk', tier: 2, desc: 'Yielding: guarding costs 10% less posture and parry windows are 10% longer, but heavies deal 5% less.', mods: { blockPosture: -0.1, parryWin: 0.1, heavyDmg: -0.05 } },
  { id: 'ashen', name: 'Ashen', tier: 3, desc: 'Burns low: +10% damage below 40% health and +5% energy regeneration, but -8 health.', mods: { lowHpDmg: 0.1, regen: 0.05, hp: -8 } },
  { id: 'mirrorborn', name: 'Mirrorborn', tier: 3, desc: 'Answers in kind: +5% strike damage and +3% combo cap, but -8 posture.', mods: { strikeDmg: 0.05, comboCap: 0.03, posture: -8 } },
  { id: 'dragonkin', name: 'Dragonkin', tier: 4, desc: 'Scaled: +8 health, +6% heavy damage and +6% posture damage, but rolls recover 10% slower.', mods: { hp: 8, heavyDmg: 0.06, postureDmg: 0.06, rollCd: 0.1 } },
  { id: 'voidwalker', name: 'Voidborn', tier: 4, desc: 'Half elsewhere: abilities recover 10% faster and +4% speed, but -10 health.', mods: { abilityCd: -0.1, speed: 0.04, hp: -10 } },
  { id: 'celestial', name: 'Celestial', tier: 5, desc: 'Of the upper heavens: +5% damage and 5% less damage taken, but 10% slower energy regeneration.', mods: { allDmg: 0.05, dmgTaken: -0.05, regen: -0.1 } },
  { id: 'hollow', name: 'Hollow Gu', tier: 5, desc: 'Feeds as it fights: heals 4% of damage dealt and abilities recover 8% faster, but takes 6% more damage.', mods: { lifesteal: 0.04, abilityCd: -0.08, dmgTaken: 0.06 } },
];
const RACE_BY_ID = Object.fromEntries(RACES.map(r => [r.id, r]));

const TALENTS = [
  { id: 'ironskin', tier: 0, name: 'Iron Skin', desc: '+15 max health', mods: { hp: 15 } },
  { id: 'deepbreath', tier: 0, name: 'Deep Breath', desc: '+15 max energy', mods: { energy: 15 } },
  { id: 'stance', tier: 0, name: 'Steady Stance', desc: '+15 max posture', mods: { posture: 15 } },
  { id: 'quickfeet', tier: 0, name: 'Quick Feet', desc: '+6% move speed', mods: { speed: 0.06 } },
  { id: 'lightfists', tier: 0, name: 'Light Fists', desc: '+6% strike damage', mods: { strikeDmg: 0.06 } },
  { id: 'secondwind', tier: 1, name: 'Second Wind', desc: '+25% energy regeneration', mods: { regen: 0.25 } },
  { id: 'thickhide', tier: 1, name: 'Thick Hide', desc: '-8% damage taken', mods: { dmgTaken: -0.08 } },
  { id: 'heavyhands', tier: 1, name: 'Heavy Hands', desc: '+15% heavy damage', mods: { heavyDmg: 0.15 } },
  { id: 'swiftroll', tier: 1, name: 'Swift Roll', desc: 'Roll cooldown -30%', mods: { rollCd: -0.3 } },
  { id: 'kickmaster', tier: 1, name: 'Kick Master', desc: 'Kicks deal +35% posture damage', mods: { kickPosture: 0.35 } },
  { id: 'vampfist', tier: 2, name: 'Vampiric Fist', desc: 'Heal 8% of damage you deal', mods: { lifesteal: 0.08 } },
  { id: 'parrymaster', tier: 2, name: 'Parry Master', desc: 'Parry window +50%', mods: { parryWin: 0.5 } },
  { id: 'breaker', tier: 2, name: 'Posture Breaker', desc: '+25% posture damage dealt', mods: { postureDmg: 0.25 } },
  { id: 'focus', tier: 2, name: 'Battle Focus', desc: 'Combo bonus cap +10%', mods: { comboCap: 0.1 } },
  { id: 'adept', tier: 2, name: 'Ability Adept', desc: 'Ability cooldowns -25%', mods: { abilityCd: -0.25 } },
  { id: 'berserk', tier: 3, name: 'Berserker Blood', desc: '+35% damage below 40% health', mods: { lowHpDmg: 0.35 } },
  { id: 'phoenix', tier: 3, name: 'Phoenix Feather', desc: 'Once per life, rise again at 30% health', mods: { phoenix: 1 } },
  { id: 'ironwall', tier: 3, name: 'Iron Wall', desc: 'Blocking costs 40% less posture', mods: { blockPosture: -0.4 } },
  { id: 'riposte', tier: 3, name: 'Riposte', desc: 'After a parry, your next hit within 1s deals double damage', mods: { riposte: 1 } },
  { id: 'thorns', tier: 3, name: 'Thorns', desc: 'Melee attackers take 30% of their damage back', mods: { thorns: 0.3 } },
  { id: 'dragonbreath', tier: 4, name: "Dragon's Breath", desc: 'Strikes have a 20% chance to breathe fire', mods: { dragonBreath: 1 } },
  { id: 'thunderpalm', tier: 4, name: 'Thunder Palm', desc: 'Heavies call golden lightning onto the target', mods: { thunderPalm: 1 } },
  { id: 'immortal', tier: 4, name: 'Immortal Body', desc: '-25% damage taken, +25 max health', mods: { dmgTaken: -0.25, hp: 25 } },
  { id: 'shadowstep', tier: 4, name: 'Shadow Step', desc: 'Nothing can touch you while you roll', mods: { shadowStep: 1 } },
  { id: 'bloodmoon', tier: 4, name: 'Feast of Souls', desc: 'Each kill heals 20 health and restores 30 energy', mods: { killHeal: 1 } },
  { id: 'dao', tier: 5, name: 'Heavenly Dao', desc: '+25% damage, +25% max health, +50% energy regeneration', mods: { allDmg: 0.25, hpPct: 0.25, regen: 0.5 } },
  { id: 'swordheart', tier: 5, name: 'Sword Heart', desc: 'Strikes are 30% faster; every 2nd strike sends a piercing sword qi wave', mods: { swordHeart: 1 } },
  { id: 'asura', tier: 5, name: "Asura's Arms", desc: 'Every strike lands twice', mods: { asura: 1 } },
  { id: 'voidwalk', tier: 5, name: 'Void Walker', desc: 'Every 4 seconds, the next attack phases you out for 0.8s: it and every hit after it pass through', mods: { voidWalk: 1 } },
  // borrowed from stories: builds of their own
  { id: 'ripple', tier: 1, name: 'Ripple Breathing', desc: 'Heal 2 health a second while guarding; +25% damage to the undead', mods: { ripple: 1 }, from: 'JoJo' },
  { id: 'glasscannon', tier: 1, name: 'Glass Cannon', desc: '+50% damage, but 35% less max health', mods: { allDmg: 0.5, hpPct: -0.35 } },
  { id: 'flashstep', tier: 2, name: 'Flash Step', desc: 'Rolls go twice as far; near a foe, a roll ends right behind it', mods: { flashStep: 1 }, from: 'Bleach' },
  { id: 'spidersense', tier: 2, name: 'Spider-Sense', desc: 'Unblockable attacks hurt 40% less', mods: { spiderSense: 1 }, slots: 1 },
  { id: 'healing', tier: 2, name: 'Healing Factor', desc: 'Regenerate 1.5 health a second', mods: { healing: 1 }, slots: 2 },
  { id: 'observation', tier: 3, name: 'Observation Haki', desc: '20% of the blows aimed at you simply miss: you saw them coming', mods: { observation: 1 }, from: 'One Piece' },
  { id: 'armament', tier: 3, name: 'Armament Haki', desc: 'Your blows ignore half of what shells, stone, armor and arrays would take off, and crush guards 50% harder', mods: { armament: 1 }, from: 'One Piece' },
  { id: 'juggernaut', tier: 3, name: 'Juggernaut', desc: 'Nothing knocks you back or off the stage; 10% slower', mods: { juggernaut: 1 } },
  { id: 'gearsecond', tier: 3, name: 'Gear Second', desc: '+25% speed and 25% faster strikes, but energy refills 25% slower', mods: { speed: 0.25, regen: -0.25, gear2: 1 }, from: 'One Piece' },
  { id: 'kaioken', tier: 4, name: 'Kaioken', desc: '+40% damage and +25% speed while above 30% health, but it burns 1.5% of your health a second', mods: { kaioken: 1 }, from: 'Dragon Ball' },
  { id: 'sharingan', tier: 4, name: 'Copy Wheel Eye', desc: 'Parry window doubled; whoever you parry is slowed for 1.5s', mods: { parryWin: 1, sharingan: 1 }, from: 'Naruto' },
  { id: 'onepunch', tier: 4, name: 'Serious Punch', desc: 'Every 5th heavy that lands deals 5x damage', mods: { onePunch: 1 }, from: 'One Punch Man' },
  { id: 'avatar', tier: 4, name: 'Four Elements', desc: 'Strikes cycle the elements: fire burns, water slows, earth crushes posture, air hurls them away', mods: { elements: 1 }, from: 'Avatar' },
  { id: 'shadowclone', tier: 4, name: 'Shadow Clone', desc: 'Every roll leaves a shadow clone that fights beside you for 4 seconds (two at most)', mods: { shadowClone: 1 }, slots: 3, from: 'Naruto' },
  { id: 'shapeshift', tier: 5, name: 'Thousand Skins', desc: 'A beast for 9s of every 11s of fighting, each new skin healing 10%: any skin is +20% damage, -20% damage taken and 6% lifesteal, and Thunder Tiger (claws), Ironhide Bear (armor), Venom Serpent (poison), Storm Roc (untouchable rolls) or Ember Drake (fire) add their own', mods: { shapeshift: 1 } },
  { id: 'starplatinum', tier: 5, name: 'Stand Rush', desc: 'Every 4th strike that lands unleashes a phantom barrage of six blows', mods: { standRush: 1 }, from: 'JoJo' },
  { id: 'berserkarmor', tier: 5, name: 'Berserker Armor', desc: 'Once per fight, a killing blow leaves you at 1 health, unkillable for 4s and hitting 60% harder', mods: { berserkArmor: 1 }, from: 'Berserk' },
  { id: 'zawarudo', tier: 5, name: 'The World', desc: 'Falling below 35% health stops time for everyone else for 5s (again every 35s): it restores 20% health and all your energy, and in stopped time you hit 60% harder', mods: { theWorld: 1 }, from: 'JoJo' },
];
// how many of the ten talent slots each one fills: stronger talents take more room
const TIER_SLOTS = [1, 1, 1, 2, 2, 3];
for (const t of TALENTS) t.slots = t.slots || TIER_SLOTS[t.tier];
const TALENT_SLOTS = 10;
// the beasts a fighter with Thousand Skins becomes, and what each one gives it
const BEAST_MODS = {
  tiger: { speed: 0.12, strikeDmg: 0.4, lifesteal: 0.06, asura: 1 },
  bear: { dmgTaken: -0.25, heavyDmg: 0.6, unflinching: 1, hpRegen: 2 },
  serpent: { venomStrike: 1, allDmg: 0.2, parryWin: 0.5 },
  roc: { speed: 0.12, shadowStep: 1, rollCd: -0.5, allDmg: 0.15 },
  drake: { dragonBreath: 1, allDmg: 0.3 },
};
// what every skin gives, on top of its own (speed stays close to normal: big swings throw a trained fighter's spacing off)
const BEAST_ALL = { allDmg: 0.2, dmgTaken: -0.2, lifesteal: 0.06 };
const TALENT_BY_ID = Object.fromEntries(TALENTS.map(t => [t.id, t]));

// ---------- the fighter's own identity: an Awakening and an Ultimate Special that grow out of how it fights ----------
const TRAITS = ['aggression', 'defense', 'mobility', 'precision', 'endurance', 'versatility'];
const AWAKENINGS = {
  aggression:  { name: 'Crimson Surge', prefix: 'Crimson', color: '#ff3a2a', desc: '+35% damage, 10% lifesteal, a little faster',
    mods: { allDmg: 0.35, lifesteal: 0.1, speed: 0.1 }, finisher: 'nova' },
  defense:     { name: 'Still Water', prefix: 'Still', color: '#7fd0ff', desc: 'Parry window doubled, blocking barely strains posture, every parry readies a double-damage riposte',
    mods: { parryWin: 1.0, blockPosture: -0.8, riposte: 1 }, finisher: 'tide' },
  mobility:    { name: 'Gale Step', prefix: 'Gale', color: '#bfffd8', desc: '+45% speed, untouchable while rolling, rolls recharge far faster',
    mods: { speed: 0.45, shadowStep: 1, rollCd: -0.6 }, finisher: 'blitz' },
  precision:   { name: 'Hawk Eye', prefix: 'Piercing', color: '#ffd84a', desc: '+60% posture damage, +20% strike and +50% heavy damage',
    mods: { postureDmg: 0.6, strikeDmg: 0.2, heavyDmg: 0.5 }, finisher: 'pierce' },
  endurance:   { name: 'Unbroken', prefix: 'Iron', color: '#c8ccd2', desc: '45% less damage taken and hits no longer interrupt it',
    mods: { dmgTaken: -0.45, unflinching: 1 }, finisher: 'bulwark' },
  versatility: { name: 'Myriad Forms', prefix: 'Myriad', color: '#d8a0ff', desc: 'Ability cooldowns -70% and abilities cost no energy',
    mods: { abilityCd: -0.7, abilityFree: 1 }, finisher: 'myriad' },
};
const SPECIAL_SUFFIX = { shoot: 'Barrage', cone: 'Tempest', sigil: 'Seal', pounce: 'Rush', slam: 'Cyclone', summon: 'Legion', orb: 'Constellation',
  vortex: 'Maelstrom', melee: 'Fang', swords: 'Array', mine: 'Field', leap: 'Meteor', vanish: 'Phantom',
  flurry: 'Onslaught', lob: 'Bombard', flask: 'Alchemy', armor: 'Bastion' };
// Build the special from what the fighter actually uses most: primary, secondary, and its awakening's finisher.
function makeSpecial(awakenKey, primary, secondary) {
  const A = AWAKENINGS[awakenKey], P1 = HERO_ABILITIES[primary], P2 = HERO_ABILITIES[secondary];
  if (!A || !P1 || !P2) return null;
  const cap = w => w.charAt(0).toUpperCase() + w.slice(1);
  return { awaken: awakenKey, primary, secondary, name: `${A.prefix} ${cap(P1.atk.id)} ${SPECIAL_SUFFIX[P2.atk.kind] || 'Art'}` };
}

// jade a fallen foe is worth to the hero who felled it
const bountyOf = f => f.def && f.def.superBoss ? 300 : f.def && f.def.boss ? 120 : Math.max(2, Math.round(f.maxHp / 12));


// ---------- the Sword Immortal and the Thirteen Swords of Heaven's End ----------
// A manual that begins with mortal technique and ends with a sword even Heaven cannot withstand.
const SWORD_NAMES = ['Drawing the Sword', 'Chasing the Wind', 'Falling Rain', 'Sweeping the Moon', 'Returning Swallow', 'Hundred Shadows', 'Severing the River',
  'Piercing the Heavens', 'Ten Thousand Swords Return to One', 'A Sword Without Form', 'Severing Cause and Effect', 'Man and Sword as One', 'Heaven and Earth, One Sword'];
const SWORD_ORD = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth', 'Thirteenth'];
// each sword as he wields it; `adv` is the advanced form he can afford with enough Sword Intent
const THIRTEEN = {
  1: { kind: 'melee', range: 26, wind: 0.12, recover: 0.3, dmg: 16, kb: 80, hitPosture: 20, parryPosture: 30, cd: 3, adv: { wind: 0.05, dmg: 22, breaksGuard: true } },
  2: { kind: 'pounce', minRange: 20, maxRange: 90, wind: 0.3, recover: 0.4, dmg: 12, kb: 60, lunge: 320, lungeTime: 0.26, afterimages: 3, hitPosture: 12, parryPosture: 25, cd: 4, adv: { afterimages: 6 } },
  3: { kind: 'sigil', pattern: 'scatter', count: 10, maxRange: 999, wind: 0.45, recover: 0.4, dmg: 6, radius: 6, delay: 0.7, cd: 6, unblockable: true, variant: 'swordrain', adv: { count: 14, homingBlades: 6 } },
  4: { kind: 'shoot', proj: 'moonblade', shots: 1, speed: 150, dmg: 14, radius: 8, pierce: true, life: 1.8, minRange: 20, maxRange: 200, wind: 0.4, recover: 0.4, hitPosture: 15, cd: 3.5, adv: { shots: 3, spread: 0.35 } },
  5: { kind: 'shoot', proj: 'swallow', shots: 1, speed: 170, dmg: 13, minRange: 25, maxRange: 200, wind: 0.35, recover: 0.35, swallow: true, life: 2.4, cd: 4, adv: { shots: 3, spread: 1.0 } },
  6: { kind: 'hundredshadows', maxRange: 160, wind: 0.5, recover: 0.4, count: 5, dmg: 8, cd: 6, adv: { count: 9 } },
  7: { kind: 'beam', variant: 'riverwave', maxRange: 200, len: 300, width: 16, dmg: 20, kb: 220, hitPosture: 20, delay: 0.55, wind: 0.55, recover: 0.6, cd: 7, unblockable: true, adv: { width: 26, dmg: 26 } },
  8: { kind: 'sigil', maxRange: 999, wind: 0.5, recover: 0.5, dmg: 26, radius: 20, delay: 1.1, kb: 180, cd: 8, unblockable: true, variant: 'sword', follow: true, adv: { pattern: 'scatter', count: 3 } }, // it hunts you down until the last moment
  9: { kind: 'swordformation', maxRange: 999, wind: 0.5, recover: 0.5, count: 14, radius: 56, delay: 1.1, dmg: 5, cd: 9, steadfast: true },
  // the last three are beyond the mortal realm: each one plays out like an ultimate
  10: { kind: 'cleaves', maxRange: 999, wind: 0.9, recover: 0.5, count: 26, dmg: 4, gap: 0.07, delay: 0.38, cd: 8, steadfast: true, adv: { count: 40 } },          // he raises a hand; the air itself cuts, endlessly
  11: { kind: 'karma', maxRange: 999, wind: 0.8, recover: 0.5, lines: 5, dmg: 6, every: 1.0, heal: 0.05, cd: 10, steadfast: true, adv: { lines: 8 } },                // the cause is cut; the effects arrive one a second, and each one feeds him
  12: { kind: 'swordlight', minRange: 0, maxRange: 160, wind: 0.35, recover: 0.6, dmg: 7, cuts: 10, slowmo: 2.6, cd: 9, steadfast: true,
        crescent: { r0: 16, r1: 58, dur: 2.6, dps: 12 }, adv: { dmg: 9, crescent: { r0: 16, r1: 70, dur: 3.2, dps: 15 } } },                 // the world slows; ten cuts; then the moon
};
const swordOf = n => ({ ...THIRTEEN[n], id: 'sword' + n, sword: n, swordName: SWORD_ORD[n - 1] + ' Sword: ' + SWORD_NAMES[n - 1] });
// the swords he likes to string together
const SWORD_CHAINS = { 1: 5, 2: 4, 3: 8, 4: 2, 5: 6, 6: 7 };
// held up only by the swords he has yet to draw, he draws them bigger and with far more cuts
const UNFINISHED = {
  9: { count: 54, delay: 1.2 },
  10: { count: 48, gap: 0.05, lenMul: 1.5 },
  11: { lines: 10, every: 0.6 },
  12: { cuts: 16, crescent: { r0: 16, r1: 86, dur: 3.6, dps: 19 } },
};
// his second form draws the swords beyond the mortal realm in order, without end (13 is his ultimate)
const SWORD_CYCLE = [10, 11, 12, 13, 9];
// As a teacher (the campaign's Myriad Sword Peaks) his second form is a lesson: the Ninth to the Twelfth, smaller,
// and never the Thirteenth at you. Every sword he draws is a demonstration, slower to leave the sheath.
const LESSON_CYCLE = [9, 10, 11, 12];
const LESSON = { 9: { count: 16, radius: 64 }, 10: { count: 14 }, 11: { lines: 3 }, 12: { cuts: 6 } };
const TEACHER_WIND = 1.35;
const YIELD_T = 4.2, YIELD_DRAW = 1.9; // after he yields: how long until he goes, and when (before that) he draws into the sky
ENEMY_TYPES.swordsaint = boss('cultivator', {
  name: 'Sword Immortal', hp: 260, r: 6, mass: 2, speed: 92, postureMul: 0.45, trueDamage: true, floating: true, manual: true, swordRider: true, iaido: false, riposte: true,
  sprite: 'b_swordsaint', sprite2: 'b_swordsaint2', form2: 'Perfect Sword Intent', color: '#9fd8ff', lore: 'THE SWORD NEEDS NO HAND',
  parryP: 0.6, blockP: 0.55, counterP: 0.45, aggr: 0.7,
  moves: moveSet({ strike: { dmg: 13, range: 22 }, heavy: { dmg: 24, range: 24 } }),
  specials: [1, 2, 3, 4, 5, 6, 7, 8].map(swordOf),
  phase2: { speedMul: 1.15, cdMul: 0.7, dmgMul: 1.25, heal: 0, flags: { unity: true, cycle: 0, cycleWait: 1.2 },
    only: [{ ...swordOf(9), count: 36, radius: 88, delay: 1.4, dmg: 4 }, ...[10, 11, 12].map(swordOf)] }, // only the swords beyond the mortal realm; the Ninth grown vast
  passive: ['Sword Intent', 'Stands on a flying sword. Every sword he lands builds Sword Intent (a different sword far more than a repeated one), and he strings his swords together. With enough intent he spends it on an advanced form: a storm of homing blades, swallows from every side, a hundred shadows instead of five. In his second form he draws only the swords beyond the mortal realm, always in order (X, XI, XII, XIII, IX, and round again). The Unfinished Manual: in his second form he cannot fall until he has drawn the Thirteenth Sword; a killing blow leaves him standing, and he hurries to finish it.'],
  active: ['The Thirteen Swords of Heaven\'s End', 'First through Eighth Swords: a draw, a lunge with afterimages, a rain of swords, a crescent of moonlight, a returning swallow, a hundred shadows, a wave that severs the river, a celestial sword from above. Second form: a sword without form, a cut that severs cause from effect, man and sword as one. You can learn the manual, sword by sword.'],
  ult: { name: 'Ninth Sword: Ten Thousand Swords Return to One', unbreakable: true, charge: 1.0, dur: 3.0, cd: 15, dark: 'rgba(0,10,40,0.5)',
    steps: [[0, 'swordformation', { count: 24, radius: 84, delay: 1.5, dmg: 5 }], [1.85, 'beam', { variant: 'onethrust', len: 220, width: 10, dmg: 24, kb: 200, delay: 0.3 }]] },
  ult2: { name: 'Thirteenth Sword: Heaven and Earth, One Sword', unbreakable: true, untouchable: true, charge: 1.4, dur: 3.0, cd: 22, dark: 'rgba(0,0,0,0.45)',
    steps: [[0, 'stillness', {}], [0.9, 'onesword', { dmg: 45, pct: 0.15 }], [2.6, 'forbidden', {}]] },
});

// every ultimate's beats run in time order (the runner walks them in sequence, so one out of place holds back the rest)
for (const d of Object.values(ENEMY_TYPES)) for (const k of ['ult', 'ult2', 'ult3']) if (d[k]) d[k].steps.sort((a, b) => a[0] - b[0]);

const ROLE_ORDER = ['bruiser', 'duelist', 'guardian', 'trickster', 'marksman', 'caster', 'colossus'];
const ROSTER = Object.keys(ENEMY_TYPES).filter(t => !ENEMY_TYPES[t].boss && !ENEMY_TYPES[t].summon);
const BOSSES = Object.keys(ENEMY_TYPES).filter(t => ENEMY_TYPES[t].boss);

// Skills ??? can multi-cast: any regular foe's (no dashes or teleports); her second form adds bosses' non-ultimate skills.
const MULTICAST_KINDS = new Set(['shoot', 'cone', 'sigil', 'orb', 'mine', 'vortex', 'swords', 'slam', 'summon', 'lob', 'flask', 'zone', 'formation', 'trick']);
const BOSS_MULTICAST_KINDS = new Set([...MULTICAST_KINDS, 'timestop', 'silkflight', 'cosmiceye', 'rct', 'gojotp', 'beam', 'iaidraw']);
// skills a foe only has in another shape: the Shapeshifter's beasts, the Kitsune, the Mutant's growths
const SHAPE_SKILLS = [...Object.values(SHIFT_FORMS).flatMap(f => f.specials), ...ENEMY_TYPES.magician.trueForm.specials,
  ...Object.values(MUTATIONS).filter(m => m.add).map(m => m.add),
  { id: 'acidspit', kind: 'shoot', proj: 'acid', shots: 3, spread: 0.18, speed: 160, dmg: 6, minRange: 20, maxRange: 150, wind: 0.35, recover: 0.35, poison: 4, poisonT: 3 }];
let MC_POOL = null;
function multicastPool(withBosses) {
  if (!MC_POOL) {
    const base = ROSTER.flatMap(t => ENEMY_TYPES[t].specials).concat(SHAPE_SKILLS)
      .filter(s => MULTICAST_KINDS.has(s.kind) && !s.vsHeavy && !s.self && !s.minHeat && !s.minMomentum);
    const bossSkills = BOSSES.filter(b => !ENEMY_TYPES[b].multicast).flatMap(b => {
      const bd = ENEMY_TYPES[b], ph = bd.phase2 || {};
      return [...bd.specials, ...(ph.add || []), ...Object.values(ph.replace || {})];
    }).filter(s => BOSS_MULTICAST_KINDS.has(s.kind) && !s.vsHeavy);
    MC_POOL = [base, bossSkills]; // her second form casts only bosses' skills
  }
  return MC_POOL[withBosses ? 1 : 0];
}
const BOSS_OF = Object.fromEntries(ROLE_ORDER.map(role => [role, BOSSES.find(b => ENEMY_TYPES[b].role === role)]));

// ---------- abilities the hero can learn: one per foe, keyed by that foe ----------
// tags: r ranged, a area, m mobility, s sustain (heal / summon). The brain sees the tags of what is equipped.
const HERO_ABILITIES = {
  bandit:      { tags: 'm',  cost: 15, cd: 4,   atk: { id: 'tackle', kind: 'pounce', wind: 0.25, recover: 0.4, dmg: 8, kb: 150, lunge: 240, lungeTime: 0.25, blockPosture: 30, hitPosture: 20, parryPosture: 30 } },
  berserker:   { tags: 'a',  cost: 30, cd: 7,   atk: { id: 'whirl', kind: 'slam', radius: 22, hits: 3, interval: 0.26, wind: 0.35, recover: 0.5, dmg: 9, kb: 60, breaksGuard: true, hitPosture: 10, parryPosture: 20 } },
  werewolf:    { tags: 'm',  cost: 22, cd: 5,   atk: { id: 'maul', kind: 'pounce', wind: 0.3, recover: 0.45, dmg: 16, kb: 120, lunge: 250, lungeTime: 0.28, breaksGuard: true, hitPosture: 20, parryPosture: 40 } },
  zombie:      { tags: 's',  cost: 20, cd: 6,   atk: { id: 'bite', kind: 'melee', range: 12, wind: 0.3, recover: 0.5, dmg: 12, heal: 12, kb: 20, hitPosture: 15, unblockable: true } },
  samurai:     { tags: 'm',  cost: 28, cd: 6,   atk: { id: 'iai', kind: 'pounce', wind: 0.45, recover: 0.5, dmg: 24, kb: 120, lunge: 300, lungeTime: 0.28, breaksGuard: true, hitPosture: 25, parryPosture: 50 } },
  fencer:      { tags: 'm',  cost: 15, cd: 3.5, atk: { id: 'fleche', kind: 'pounce', wind: 0.22, recover: 0.4, dmg: 14, kb: 50, lunge: 320, lungeTime: 0.22, hitPosture: 10, blockPosture: 15, parryPosture: 30 } },
  spearmaster: { tags: 'a',  cost: 22, cd: 5,   atk: { id: 'sweep', kind: 'slam', radius: 28, wind: 0.35, recover: 0.45, dmg: 12, kb: 100, blockPosture: 38, hitPosture: 20, parryPosture: 30 } },
  cultivator:  { tags: 'r',  cost: 25, cd: 7,   atk: { id: 'swords', kind: 'swords', count: 3, wind: 0.35, recover: 0.3, dmg: 10 } },
  paladin:     { tags: 'a',  cost: 25, cd: 6,   atk: { id: 'smite', kind: 'melee', range: 18, wind: 0.4, recover: 0.5, dmg: 20, kb: 100, breaksGuard: true, hitPosture: 18, parryPosture: 40, burst: { r: 14, delay: 0.35, dmg: 10, variant: 'smite' } } },
  buddhist:    { tags: 'ra', cost: 28, cd: 7,   atk: { id: 'palm', kind: 'shoot', proj: 'palm', shots: 1, speed: 115, radius: 10, life: 2.2, wind: 0.4, recover: 0.4, dmg: 16, kb: 260, blockPosture: 30, hitPosture: 22 } },
  taichi:      { tags: 'a',  cost: 20, cd: 5,   atk: { id: 'push', kind: 'melee', range: 14, wind: 0.2, recover: 0.4, dmg: 6, kb: 280, pushOut: true, hitPosture: 30, unblockable: true } },
  cyborg:      { tags: 'r',  cost: 15, cd: 3,   atk: { id: 'rocket', kind: 'shoot', wind: 0.3, recover: 0.3, dmg: 14, shots: 1, speed: 130, proj: 'rocket' } },
  ninja:       { tags: 'm',  cost: 20, cd: 6,   atk: { id: 'vanish', kind: 'vanish', wind: 0.2, recover: 0 } },
  drunk:       { tags: 'a',  cost: 18, cd: 5,   atk: { id: 'spray', kind: 'cone', range: 30, angle: 0.6, wind: 0.3, recover: 0.4, dmg: 12, kb: 40, hitPosture: 10, unblockable: true, variant: 'fire' } },
  vampire:     { tags: 'ms', cost: 22, cd: 6,   atk: { id: 'bats', kind: 'pounce', wind: 0.25, recover: 0.4, dmg: 14, kb: 60, lunge: 260, lungeTime: 0.35, untargetable: true, lifesteal: true, hitPosture: 12, parryPosture: 30 } },
  djinn:       { tags: 'a',  cost: 28, cd: 8,   atk: { id: 'vortex', kind: 'vortex', wind: 0.4, recover: 0.4, radius: 30, duration: 1.8, pull: 55, dmg: 16 } },
  gunslinger:  { tags: 'r',  cost: 20, cd: 5,   atk: { id: 'fan', kind: 'shoot', wind: 0.35, recover: 0.4, dmg: 6, shots: 6, spread: 0.14, speed: 180 } },
  sniper:      { tags: 'r',  cost: 18, cd: 5,   name: 'Steady Shot', desc: 'A guard-breaking aimed shot.', atk: { id: 'aim', kind: 'shoot', wind: 0.7, recover: 0.4, dmg: 22, shots: 1, speed: 300, laser: true, breaksGuard: true } },
  talisman:    { tags: 'ra', cost: 18, cd: 4,   atk: { id: 'sigil', kind: 'sigil', wind: 0.3, recover: 0.3, dmg: 20, radius: 16, delay: 0.8, unblockable: true } },
  druid:       { tags: 's',  cost: 35, cd: 12,  name: "Nature's Call", desc: 'A tiger, bear or bunny fights beside you for 7 seconds.', atk: { id: 'call', kind: 'summon', wind: 0.5, recover: 0.4, minions: ['tiger', 'bear', 'bunny'], pick: 1, life: 7 } },
  necromancer: { tags: 'ra', cost: 22, cd: 5,   atk: { id: 'spikes', kind: 'sigil', pattern: 'line', count: 6, spacing: 12, step: 0.07, wind: 0.3, recover: 0.4, dmg: 14, radius: 7, delay: 0.4, unblockable: true, variant: 'spikes' } },
  angel:       { tags: 'r',  cost: 22, cd: 5,   atk: { id: 'lance', kind: 'sigil', wind: 0.3, recover: 0.4, dmg: 24, radius: 12, delay: 0.7, unblockable: true, variant: 'lance' } },
  demon:       { tags: 'a',  cost: 35, cd: 8,   atk: { id: 'slam', kind: 'slam', radius: 28, wind: 0.5, recover: 0.6, dmg: 22, kb: 200, unblockable: true } },
  eastdragon:  { tags: 'ra', cost: 30, cd: 8,   atk: { id: 'thunder', kind: 'sigil', pattern: 'scatter', count: 3, wind: 0.4, recover: 0.4, dmg: 18, radius: 12, delay: 0.8, unblockable: true, variant: 'lightning' } },
  westdragon:  { tags: 'a',  cost: 28, cd: 6,   atk: { id: 'breath', kind: 'cone', range: 46, angle: 0.55, wind: 0.45, recover: 0.5, dmg: 18, kb: 60, hitPosture: 10, unblockable: true, variant: 'fire' } },
  oni:         { tags: 's',  cost: 25, cd: 12,  atk: { id: 'onirage', kind: 'armor', wind: 0.25, recover: 0.1, dur: 3.5, dr: 0.4, haste: 0.1 } },
  mutant:      { tags: 'a',  cost: 20, cd: 6,   name: 'Toxic Spew', desc: 'A cone of poison that keeps burning.', atk: { id: 'spew', kind: 'cone', range: 30, angle: 0.55, wind: 0.3, recover: 0.4, dmg: 6, kb: 30, hitPosture: 8, unblockable: true, variant: 'poison', poison: 5, poisonT: 3 } },
  boxer:       { tags: 'm',  cost: 25, cd: 6,   atk: { id: 'rush', kind: 'flurry', range: 14, arc: 0.7, hits: 5, interval: 0.09, step: 80, wind: 0.2, recover: 0.4, dmg: 5, kb: 15, hitPosture: 6, finisher: { id: 'uppercut', dmg: 12, kb: 200, hitPosture: 26, breaksGuard: true } } },
  reaper:      { tags: 'r',  cost: 18, cd: 5,   name: 'Reaping Hook', desc: 'Hooks a foe and drags it in.', atk: { id: 'reaphook', kind: 'shoot', proj: 'scythehook', shots: 1, speed: 260, dmg: 8, wind: 0.3, recover: 0.3, pull: true, life: 0.7 } },
  crab:        { tags: 'r',  cost: 15, cd: 4,   name: 'Bubble Burst', desc: 'Bubbles that slow whoever they pop on.', atk: { id: 'bubbles', kind: 'shoot', proj: 'bubble', shots: 4, spread: 0.22, speed: 110, dmg: 4, wind: 0.3, recover: 0.3, slow: 1.6, life: 2, radius: 3 } },
  spider:      { tags: 'r',  cost: 15, cd: 4,   name: 'Web Shot', desc: 'A strand of web that roots its target.', atk: { id: 'webshot', kind: 'shoot', proj: 'web', shots: 1, speed: 210, dmg: 4, wind: 0.25, recover: 0.3, root: 1.1, radius: 3 } },
  shifter:     { tags: 'm',  cost: 20, cd: 5,   name: 'Thunder Pounce', desc: "A beast's pounce that breaks guard.", atk: { id: 'thunderpounce', kind: 'pounce', wind: 0.25, recover: 0.4, dmg: 14, kb: 140, lunge: 300, lungeTime: 0.26, breaksGuard: true, hitPosture: 20, parryPosture: 40 } },
  magician:    { tags: 'r',  cost: 20, cd: 8,   name: 'Polymorph', desc: 'Turns a foe into a harmless rabbit for a moment.', atk: { id: 'hex', kind: 'shoot', proj: 'hex', shots: 1, speed: 170, dmg: 2, wind: 0.3, recover: 0.3, poly: 1.4, radius: 3 } },
  archer:      { tags: 'r',  cost: 22, cd: 5,   name: 'Power Shot', desc: 'A charged arrow that pierces and breaks guard.', atk: { id: 'powershot', kind: 'shoot', proj: 'bigarrow', shots: 1, speed: 380, dmg: 20, wind: 0.55, recover: 0.35, laser: true, breaksGuard: true, pierce: true, kb: 150, hitPosture: 25, radius: 3 } },
  alchemist:   { tags: 'ra', cost: 18, cd: 4,   atk: { id: 'flask', kind: 'flask', count: 1, wind: 0.3, recover: 0.3 } },
  gravmage:    { tags: 'a',  cost: 25, cd: 7,   name: 'Gravity Well', desc: 'A well that drags foes in, then implodes.', atk: { id: 'gravwell', kind: 'vortex', variant: 'gravwell', wind: 0.35, recover: 0.35, radius: 26, duration: 1.3, pull: 90, dmg: 14 } },
  formation:   { tags: 'a',  cost: 18, cd: 5,   name: 'Sealing Array', desc: 'Locks a foe in place.', atk: { id: 'seal', kind: 'sigil', wind: 0.3, recover: 0.3, dmg: 8, radius: 12, delay: 0.6, unblockable: true, variant: 'seal', root: 1.4 } },
  golem:       { tags: 'ra', cost: 24, cd: 6,   atk: { id: 'boulder', kind: 'lob', proj: 'boulder', flight: 0.7, height: 30, wind: 0.4, recover: 0.4, land: { r: 14, dmg: 18, kb: 110, hitPosture: 20 } } },
  hydra:       { tags: 'r',  cost: 18, cd: 4,   name: 'Acid Spit', desc: 'Three globs of venom that poison.', atk: { id: 'acidspit', kind: 'shoot', proj: 'acid', shots: 3, spread: 0.18, speed: 170, dmg: 5, wind: 0.3, recover: 0.3, poison: 4, poisonT: 3 } },
  phoenix:     { tags: 'a',  cost: 22, cd: 6,   name: 'Flare', desc: 'A wing of fire.', atk: { id: 'flare', kind: 'cone', range: 38, angle: 0.65, wind: 0.3, recover: 0.4, dmg: 14, kb: 60, hitPosture: 10, unblockable: true, variant: 'fire', fire: true } },
};
// the worlds' own foes teach too
Object.assign(HERO_ABILITIES, {
  staffmonk:    { tags: 'a',  cost: 20, cd: 5,   name: 'Staff Sweep', desc: 'A wide sweep that knocks everything around you back.', atk: { id: 'staffsweep', kind: 'slam', radius: 26, wind: 0.3, recover: 0.4, dmg: 10, kb: 130, hitPosture: 14, parryPosture: 24, variant: 'staffquake' } },
  arhat:        { tags: 'as', cost: 26, cd: 7,   name: 'Bell Toll', desc: 'An unblockable toll that throws everyone around you away.', atk: { id: 'belltoll', kind: 'slam', radius: 30, wind: 0.45, recover: 0.5, dmg: 12, kb: 210, unblockable: true, hitPosture: 22, variant: 'quake' } },
  gargoyle:     { tags: 'm',  cost: 22, cd: 5,   name: 'Dive', desc: 'A long dive that breaks guard.', atk: { id: 'gdive', kind: 'pounce', wind: 0.4, recover: 0.45, dmg: 18, kb: 150, lunge: 320, lungeTime: 0.32, breaksGuard: true, hitPosture: 22, parryPosture: 34 } },
  ghoul:        { tags: 'm',  cost: 14, cd: 3,   name: 'Rend', desc: 'A leaping rake of claws.', atk: { id: 'rend', kind: 'pounce', wind: 0.22, recover: 0.4, dmg: 10, kb: 70, lunge: 280, lungeTime: 0.22, hitPosture: 12, parryPosture: 24 } },
  disciple:     { tags: 'r',  cost: 12, cd: 3,   name: 'Flying Sword', desc: 'A single flying sword.', atk: { id: 'dswords', kind: 'swords', count: 1, wind: 0.3, recover: 0.3, dmg: 8 } },
  imp:          { tags: 'r',  cost: 14, cd: 3,   name: 'Fire Darts', desc: 'Three little darts of fire.', atk: { id: 'firedart', kind: 'shoot', proj: 'magma', shots: 3, spread: 0.25, speed: 170, dmg: 5, wind: 0.25, recover: 0.3, burn: true } },
  hellhound:    { tags: 'm',  cost: 18, cd: 4,   name: 'Burning Bite', desc: 'A lunging bite that sets the target burning.', atk: { id: 'burnbite', kind: 'pounce', wind: 0.25, recover: 0.4, dmg: 11, kb: 60, lunge: 280, lungeTime: 0.24, poison: 4, poisonT: 3, hitPosture: 14, parryPosture: 26 } },
  yukionna:     { tags: 'a',  cost: 20, cd: 5,   name: 'Frost Breath', desc: 'A freezing cone that slows.', atk: { id: 'frostbreath', kind: 'cone', range: 40, angle: 0.6, wind: 0.35, recover: 0.4, dmg: 9, kb: 20, unblockable: true, variant: 'frost', slow: 1.6 } },
  tengu:        { tags: 'a',  cost: 22, cd: 6,   name: 'Fan Gust', desc: 'A great gust that throws foes toward the edge.', atk: { id: 'fangust', kind: 'cone', range: 55, angle: 0.8, wind: 0.4, recover: 0.5, dmg: 3, kb: 300, hitPosture: 14, unblockable: true, variant: 'wind' } },
  swarmdrone:   { tags: 'm',  cost: 10, cd: 2.5, name: 'Dive', desc: 'A quick diving strike.', atk: { id: 'dronedive', kind: 'pounce', wind: 0.22, recover: 0.4, dmg: 7, kb: 50, lunge: 320, lungeTime: 0.22, hitPosture: 8 } },
  sentry:       { tags: 'r',  cost: 20, cd: 4,   name: 'Laser Shot', desc: 'A laser-sighted round that breaks guard.', atk: { id: 'sentrylaser', kind: 'shoot', proj: 'rail', wind: 0.6, recover: 0.4, dmg: 20, shots: 1, speed: 330, laser: true, breaksGuard: true } },
  chronomancer: { tags: 'ra', cost: 20, cd: 6,   name: 'Slow Time', desc: 'A field of slow time that bursts under the target.', atk: { id: 'slowfield', kind: 'sigil', wind: 0.35, recover: 0.3, dmg: 4, radius: 22, delay: 0.8, unblockable: true, variant: 'gravity', slow: 2.4 } },
  glitch:       { tags: 'm',  cost: 16, cd: 3.5, name: 'Glitch Cut', desc: 'A skip forward and a cut.', atk: { id: 'glitchcut', kind: 'pounce', wind: 0.2, recover: 0.4, dmg: 12, kb: 60, lunge: 340, lungeTime: 0.2, hitPosture: 14, parryPosture: 26 } },
  twin:         { tags: 'm',  cost: 18, cd: 4,   name: 'Mirror Cut', desc: 'A crossing dash-cut.', atk: { id: 'mirrorcut', kind: 'pounce', wind: 0.28, recover: 0.4, dmg: 13, kb: 80, lunge: 300, lungeTime: 0.24, hitPosture: 16, parryPosture: 30 } },
  flyhead:      { tags: 'm',  cost: 10, cd: 2.5, name: 'Bite', desc: 'A darting bite.', atk: { id: 'flybite', kind: 'pounce', wind: 0.18, recover: 0.4, dmg: 6, kb: 30, lunge: 300, lungeTime: 0.2, hitPosture: 6 } },
  cspirit:      { tags: 'r',  cost: 14, cd: 3.5, name: 'Cursed Spit', desc: 'A gob of acid that corrodes.', atk: { id: 'csspit', kind: 'shoot', proj: 'acid', shots: 1, speed: 150, dmg: 8, wind: 0.3, recover: 0.3, corrode: 2 } },
  ccorpse:      { tags: 'a',  cost: 22, cd: 5,   name: 'Stitched Fists', desc: 'A two-fisted slam that breaks guard.', atk: { id: 'corpseslam', kind: 'slam', radius: 22, wind: 0.4, recover: 0.5, dmg: 16, kb: 140, breaksGuard: true, hitPosture: 22, parryPosture: 34, variant: 'quake' } },
  strawdoll:    { tags: 'r',  cost: 12, cd: 2.5, name: 'Nails', desc: 'Two nails that stay in the target.', atk: { id: 'nails', kind: 'shoot', proj: 'spine', shots: 2, spread: 0.1, speed: 210, dmg: 5, wind: 0.25, recover: 0.3, nail: 1 } },
  cspeech:      { tags: 'r',  cost: 26, cd: 8,   name: 'Blast Away', desc: 'A spoken command that throws the target across the stage.', atk: { id: 'blastaway', kind: 'speech', word: 'BLAST AWAY', maxRange: 110, wind: 0.35, recover: 0.4, kb: 330, dmg: 6 } },
  shikigami:    { tags: 'm',  cost: 20, cd: 4,   name: 'Shadow Pounce', desc: 'A leap out of your own shadow that breaks guard.', atk: { id: 'shadowpounce', kind: 'pounce', wind: 0.28, recover: 0.4, dmg: 14, kb: 90, lunge: 320, lungeTime: 0.25, breaksGuard: true, hitPosture: 18, parryPosture: 30 } },
  cultist:      { tags: 'ra', cost: 22, cd: 6,   name: 'The Yellow Sign', desc: 'A sign that burns under the target and fills it with fear.', atk: { id: 'yellowsign', kind: 'sigil', wind: 0.4, recover: 0.3, dmg: 8, radius: 16, delay: 1.0, unblockable: true, variant: 'seal', fear: 1.3 } },
  byakhee:      { tags: 'm',  cost: 20, cd: 4.5, name: 'Swoop', desc: 'A long swooping dive.', atk: { id: 'swoop', kind: 'pounce', wind: 0.35, recover: 0.45, dmg: 16, kb: 160, lunge: 340, lungeTime: 0.3, hitPosture: 20, parryPosture: 32 } },
  dancer:       { tags: 'a',  cost: 16, cd: 4,   name: 'Spin Kick', desc: 'A spinning double kick.', atk: { id: 'spinkick', kind: 'slam', radius: 20, wind: 0.25, recover: 0.4, dmg: 10, kb: 120, hits: 2, interval: 0.2, hitPosture: 14 } },
  pknight:      { tags: 'a',  cost: 24, cd: 6,   name: 'Tarnished Blade', desc: 'Two wide cleaves that break guard.', atk: { id: 'tarnished', kind: 'flurry', reach: 20, range: 20, arc: 1.1, hits: 2, interval: 0.35, step: 30, wind: 0.35, recover: 0.5, dmg: 13, kb: 90, breaksGuard: true, hitPosture: 16, parryPosture: 30 } },
  horror:       { tags: 'ra', cost: 26, cd: 6,   name: 'Tentacles', desc: 'Tentacles rise at the edge of the stage near the target and drag it toward the edge.', atk: { id: 'edgetentacles', kind: 'edgetentacles', count: 3, dmg: 14, radius: 12, delay: 0.9, wind: 0.4, recover: 0.4 } },
});
// the Primordial Forest's techniques
Object.assign(HERO_ABILITIES, {
  serpent:        { tags: 'r',  cost: 16, cd: 4,   name: 'Venom Spit', desc: 'Three globs of venom that poison.', atk: { id: 'venomspit', kind: 'shoot', proj: 'venom', shots: 3, spread: 0.2, speed: 160, dmg: 5, wind: 0.3, recover: 0.3, poison: 4, poisonT: 3 } },
  roc:            { tags: 'a',  cost: 20, cd: 6,   name: 'Roc Gust', desc: 'A gust that throws foes toward the edge.', atk: { id: 'rocgust', kind: 'cone', range: 55, angle: 0.8, wind: 0.4, recover: 0.5, dmg: 4, kb: 300, hitPosture: 15, unblockable: true, variant: 'wind' } },
  drake:          { tags: 'a',  cost: 22, cd: 5,   name: 'Drake Breath', desc: 'A short cone of fire.', atk: { id: 'drakebreath', kind: 'cone', range: 40, angle: 0.55, wind: 0.45, recover: 0.5, dmg: 13, kb: 50, hitPosture: 10, unblockable: true, variant: 'fire' } },
  tortoise:       { tags: 'a',  cost: 24, cd: 6,   name: 'Shell Slam', desc: 'Drop your whole weight on the ground around you.', atk: { id: 'shellslam', kind: 'slam', radius: 24, wind: 0.5, recover: 0.6, dmg: 14, kb: 160, hitPosture: 20, unblockable: true, variant: 'quake' } },
  raptor:         { tags: 'm',  cost: 15, cd: 3.5, name: 'Raptor Leap', desc: 'A leaping sickle-claw kick.', atk: { id: 'raptorleap', kind: 'pounce', wind: 0.22, recover: 0.4, dmg: 10, kb: 90, lunge: 300, lungeTime: 0.24, hitPosture: 14, parryPosture: 30 } },
  triceratops:    { tags: 'm',  cost: 26, cd: 6,   name: 'Horn Charge', desc: 'A charge that breaks guard and throws.', atk: { id: 'tricharge', kind: 'pounce', wind: 0.45, recover: 0.6, dmg: 16, kb: 240, lunge: 280, lungeTime: 0.4, breaksGuard: true, hitPosture: 28, parryPosture: 40 } },
  trex:           { tags: 'a',  cost: 28, cd: 9,   name: 'Apex Roar', desc: 'A roar that sends foes running.', atk: { id: 'roar', kind: 'cone', range: 55, angle: 0.9, wind: 0.4, recover: 0.5, dmg: 2, kb: 60, hitPosture: 10, unblockable: true, variant: 'wind', fear: 1.2 } },
  elfranger:      { tags: 'r',  cost: 16, cd: 3,   name: 'Elven Volley', desc: 'Three arrows at once.', atk: { id: 'elfvolley', kind: 'shoot', proj: 'arrow', shots: 3, spread: 0.22, speed: 270, dmg: 7, wind: 0.3, recover: 0.3 } },
  elfsentinel:    { tags: 'm',  cost: 18, cd: 4,   name: 'Spear Line', desc: 'A long spear thrust across the gap.', atk: { id: 'spearline', kind: 'pounce', wind: 0.3, recover: 0.4, dmg: 12, kb: 100, lunge: 260, lungeTime: 0.24, hitPosture: 16, parryPosture: 30 } },
  elfspellweaver: { tags: 'a',  cost: 22, cd: 5,   name: 'Elven Roots', desc: 'Roots that pin a foe in place.', atk: { id: 'elfroots', kind: 'sigil', wind: 0.35, recover: 0.4, dmg: 10, radius: 15, delay: 0.7, root: 1.3, unblockable: true, variant: 'roots' } },
  treant:         { tags: 'r',  cost: 18, cd: 5,   name: 'Vine Lash', desc: 'A vine that drags a foe to you.', atk: { id: 'vinelash', kind: 'shoot', proj: 'tentacle', shots: 1, speed: 230, dmg: 9, wind: 0.3, recover: 0.35, pull: true, life: 0.5 } },
});
Object.assign(HERO_ABILITIES, {
  macaque:        { tags: 'm',  cost: 14, cd: 3,   name: 'Somersault Kick', desc: 'A flip over a guard.', atk: { id: 'somersault', kind: 'pounce', wind: 0.2, recover: 0.35, dmg: 8, kb: 80, lunge: 280, lungeTime: 0.22, breaksGuard: true, hitPosture: 12, parryPosture: 24 } },
  greatape:       { tags: 'a',  cost: 22, cd: 5,   name: 'Ape Slam', desc: 'Both fists into the ground around you.', atk: { id: 'apeslam', kind: 'slam', radius: 22, wind: 0.4, recover: 0.5, dmg: 13, kb: 170, hitPosture: 18, unblockable: true, variant: 'quake' } },
  sweepingmonk:   { tags: 'a',  cost: 20, cd: 4,   name: 'Courtyard Sweep', desc: 'A broad sweep that clears everything round you.', atk: { id: 'broomsweep', kind: 'slam', radius: 28, wind: 0.3, recover: 0.4, dmg: 12, kb: 170, hitPosture: 18, parryPosture: 28, variant: 'staffquake' } },
  frostmaiden:    { tags: 'ra', cost: 22, cd: 5,   name: 'Frost Lotus', desc: 'Ice that blooms under a foe and slows it.', atk: { id: 'frostlotus', kind: 'sigil', wind: 0.35, recover: 0.4, dmg: 10, radius: 14, delay: 0.7, unblockable: true, variant: 'seal', slow: 2 } },
  qilin:          { tags: 'm',  cost: 24, cd: 5,   name: 'Thunder Hooves', desc: 'A galloping charge that breaks guard.', atk: { id: 'thunderhooves', kind: 'pounce', wind: 0.4, recover: 0.5, dmg: 15, kb: 220, lunge: 320, lungeTime: 0.36, breaksGuard: true, hitPosture: 24, parryPosture: 40 } },
  jadetoad:       { tags: 'a',  cost: 20, cd: 5,   name: 'Frost Breath', desc: 'A cone of frost that slows.', atk: { id: 'frostbreath', kind: 'cone', range: 44, angle: 0.65, wind: 0.4, recover: 0.5, dmg: 10, kb: 60, hitPosture: 12, unblockable: true, variant: 'wind', slow: 2.5 } },
  tiangou:        { tags: 'm',  cost: 18, cd: 4,   name: 'Eclipse Bite', desc: 'A lunging bite through a guard.', atk: { id: 'eclipsebite', kind: 'pounce', wind: 0.22, recover: 0.4, dmg: 12, kb: 70, lunge: 300, lungeTime: 0.22, breaksGuard: true, hitPosture: 16, parryPosture: 30 } },
  shadeattendant: { tags: 'r',  cost: 20, cd: 5,   name: 'Long Shadow', desc: 'Your shadow stretches out along the floor and cuts.', atk: { id: 'longshadow', kind: 'sigil', pattern: 'line', count: 6, spacing: 12, step: 0.07, wind: 0.35, recover: 0.4, dmg: 11, radius: 8, delay: 0.5, unblockable: true, variant: 'soulspikes' } },
});
const MANUAL_TAGS = { 1: '', 2: 'm', 3: 'ra', 4: 'r', 5: 'r', 6: 'a', 7: 'a', 8: 'a', 9: 'ra', 10: 'r', 11: 'r', 12: 'm' };
for (let n = 1; n <= 12; n++) {
  const { adv, cd, ...atk } = swordOf(n);
  HERO_ABILITIES['sword' + n] = { tags: MANUAL_TAGS[n], cost: 10 + n * 2, cd: Math.max(3, cd * 0.9), manual: n, foe: 'swordsaint',
    name: atk.swordName, desc: 'From the Sword Immortal\'s manual, the Thirteen Swords of Heaven\'s End.', atk: { ...atk, wind: atk.wind * 0.8, dmg: atk.dmg && Math.round(atk.dmg * 0.75) } };
}
for (const [type, ab] of Object.entries(HERO_ABILITIES)) {
  ab.from = type;
  ab.name = ab.name || ENEMY_TYPES[type].active[0];
  ab.desc = ab.desc || ENEMY_TYPES[type].active[1];
  // learned techniques hit harder than the basics and cost a little less than the foe paid
  ab.cost = Math.round(ab.cost * 0.8);
  ab.atk = { ...ab.atk, abilityId: type, hero: true };
  if (ab.atk.dmg) ab.atk.dmg = Math.round(ab.atk.dmg * 1.5);
  if (ab.atk.burst) ab.atk.burst = { ...ab.atk.burst, dmg: Math.round(ab.atk.burst.dmg * 1.5) };
  if (ab.atk.land && ab.atk.land.dmg) ab.atk.land = { ...ab.atk.land, dmg: Math.round(ab.atk.land.dmg * 1.5) };
}

// ---------- training grounds and trials ----------
const SCENARIOS = {
  custom: {
    name: 'Open Duels', custom: true,
    wave: (n, opts, rand) => {
      const roster = opts.roster && opts.roster.length ? opts.roster : ['bandit'];
      const pool = [];
      return Array.from({ length: opts.atOnce || 1 }, () => {
        if (!pool.length) pool.push(...roster);
        return pool.splice(Math.floor(rand() * pool.length), 1)[0];
      });
    },
  },
  // a room of a world in the jar: its waves come with the sim (opts.waves), each foe a type or { type, hp, dmg } tuned for the campaign
  room: { name: 'Room', pass: s => s.result === 'clear' },
};
for (const role of ROLE_ORDER) {
  const members = ROSTER.filter(t => ENEMY_TYPES[t].role === role);
  SCENARIOS['role_' + role] = {
    name: ROLES[role].name, timeLimit: 45 * members.length, goal: 'BEAT ALL ' + members.length,
    desc: 'Each ' + ROLES[role].name.toLowerCase().replace(/s$/, '') + ', one at a time: ' + members.map(t => ENEMY_TYPES[t].name).join(', ') + '.',
    waves: members.map(t => [t]),
    pass: s => s.result === 'clear',
  };
}
for (const role of ROLE_ORDER) {
  const b = BOSS_OF[role];
  SCENARIOS['boss_' + b] = {
    name: 'Boss: ' + ENEMY_TYPES[b].name, timeLimit: 150, goal: 'DEFEAT ' + ENEMY_TYPES[b].name.toUpperCase(), boss: true,
    desc: ENEMY_TYPES[b].active[1],
    waves: [[b]],
    pass: s => s.result === 'clear',
  };
}

const INPUT_LABELS = ['hp', 'post', 'nrg', 'free', 'grd', 'pWin', 'myWnd', 'myHvy', 'combo', 'kick', 'roll', 'posX', 'posY', 'edge', 'cnt'];
for (let i = 1; i <= 2; i++) INPUT_LABELS.push(`e${i}?`, `e${i}dx`, `e${i}dy`, `e${i}d`, `e${i}wnd`, `e${i}hvy`, `e${i}red`, `e${i}kck`, `e${i}grd`, `e${i}opn`, `e${i}pst`, `e${i}hp`, `e${i}rng`, `e${i}big`);
INPUT_LABELS.push('shot?', 'shotX', 'shotY', 'shotVx', 'shotVy', 'zone?', 'zoneX', 'zoneY', 'zoneT');
for (let i = 1; i <= 2; i++) INPUT_LABELS.push(`ab${i}`, `a${i}rng`, `a${i}aoe`, `a${i}mob`, `a${i}sus`);
const OUTPUT_LABELS = ['moveX', 'moveY', 'STRIKE', 'HEAVY', 'GUARD', 'KICK', 'ROLL', 'ABIL1', 'ABIL2'];
const N_INPUTS = INPUT_LABELS.length, N_OUTPUTS = OUTPUT_LABELS.length;

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
// Shared by simulation and visual previews: accelerating orbits collapse at 4.6s.
const BLACK_STAR_MERGE = 4.6, BLACK_STAR_BLAST_RADIUS = 90;
function blackStarPositions(age) {
  const radius = 48 * Math.pow(Math.max(0, 1 - age / BLACK_STAR_MERGE), 0.65);
  const angle = age * 3 + age * age * 2.4;
  return [0, Math.PI].map(offset => ({ x: Math.cos(angle + offset) * radius, y: Math.sin(angle + offset) * radius }));
}
const KB_DECAY = Math.exp(-6 * DT);
const NO_INTENT = { mx: 0, my: 0, strike: false, heavy: false, guard: false, kick: false, roll: false, ab1: false, ab2: false };

// Battle mode: up to 10 fighters, any mix of the trained hero, the keyboard and any foe, on any teams.
SCENARIOS.battle = { name: 'Battle', battle: true };
const TEAM_COLORS = ['#ff4d4d', '#4da6ff', '#6cd96c', '#ffd84a', '#c48aff', '#5fe0e0', '#ff9a3a', '#ff7ac8', '#e8e8e8', '#8a8f9c'];

class Sim {
  constructor(scenarioId, seed, opts = {}) {
    this.scenarioId = scenarioId;
    this.sc = SCENARIOS[scenarioId];
    this.opts = opts;
    this.battle = !!this.sc.battle;
    this.timeLimit = this.sc.timeLimit || opts.timeLimit || 40;
    this.rand = mulberry32(seed);
    this.t = 0;
    this.fx = opts.visual ? [] : null;
    this.fighter = { ...DEFAULT_FIGHTER, ...(opts.fighter || {}) };
    this.nextId = 1;
    this.heroes = [];     // bare-fisted fighters driven by a brain or the keyboard
    this.enemies = [];    // fighters driven by foe AI (on any team, summons included)
    this.revives = [];    // minions rising again for their summoner
    this.rewinds = [];    // foes whose clocks are being turned back (the Chronomancer's ally, a Paradox Twin)
    this.exposure = {};   // seconds spent fighting each foe type (how the hero learns their abilities)
    this.proj = [];
    this.hazards = [];
    this.cosmicFields = [];
    this.echoes = []; // wounds struck in the past, arriving in the present
    this.grabs = [];  // fighters held in a grip, waiting to be thrown
    this.waveIdx = 0;
    this.waveDelay = 0.4;
    this.done = false;
    this.deaths = 0;
    this.stats = {
      dmgDealt: 0, dmgTaken: 0, kills: 0, ringOuts: 0, waves: 0, parries: 0, blocks: 0, postureBreaks: 0,
      stunned: 0, evades: 0, whiffs: 0, fell: 0, died: 0, time: 0, result: null,
      abilUses: {}, abilDmg: {}, bounty: 0, reach: 0,
      strikes: 0, heavies: 0, kicks: 0, rolls: 0, dist: 0, lowHpT: 0, guardT: 0, awakenings: 0, specials: 0, specialLands: 0, synthLands: 0, bossKills: {}, killsByType: {},
    };
    this.observation = { foes: {}, ranged: {}, bosses: {} };
    this.input = new Float32Array(N_INPUTS);
    this.lastOut = new Float32Array(N_OUTPUTS);
    if (this.battle) this.setupBattle(opts.battle || { slots: [] });
    else {
      this.p = this.addHero(0, 0, 0, 'ext');
    }
  }

  addHero(x, y, team, controller, card) {
    const h = this.makeFighter(null, x, y, team), o = card || this.opts; // an online player's fighter brings its own loadout, talents, special and skin
    h.controller = controller; h.card = card || null;
    h.abilities = [0, 1].map(i => HERO_ABILITIES[(o.loadout || [])[i]] || null);
    h.skin = o.skin || null; // its look, bought with jade
    if (card && card.fighter) { // a saved iteration keeps the body it trained with
      const f = { ...DEFAULT_FIGHTER, ...card.fighter };
      h.maxHp = h.hp = f.hp; h.energyMax = h.energy = f.energy;
      h.energyRegen = f.energyRegen; h.postureMax = f.posture;
    }
    this.applyTalents(h, o.talents || [], o.race);
    const id = o.identity || {};
    h.awaken = AWAKENINGS[id.awaken] || null; h.awakenKey = id.awaken || null;
    h.special = id.special || null;
    h.awakenGauge = 0; h.ultGauge = 0; h.awakeT = 0; h.awakenCount = 0; h.tier = 0; h.awakenPower = 1; h.fxScale = 1;
    this.heroes.push(h);
    return h;
  }

  // Sum up equipped talents into one modifier table and apply the stat ones.
  applyTalents(h, ids, raceId) {
    const race = RACE_BY_ID[raceId] || RACE_BY_ID.unformed;
    h.race = race.id;
    const tal = { ...race.mods };
    for (const id of ids) {
      const t = TALENT_BY_ID[id];
      if (t) for (const [k, v] of Object.entries(t.mods)) tal[k] = (tal[k] || 0) + v;
    }
    h.tal = tal;
    h.maxHp = Math.max(1, Math.round((h.maxHp + (tal.hp || 0)) * (1 + (tal.hpPct || 0)))); h.hp = h.maxHp;
    h.energyMax += tal.energy || 0; h.energy = h.energyMax;
    h.postureMax += tal.posture || 0;
    h.energyRegen *= 1 + (tal.regen || 0);
  }

  // Fighters stand around the ring, teammates side by side.
  setupBattle(cfg) {
    const slots = cfg.slots.map((s, i) => ({ ...s, slot: i })).filter(s => s.kind && s.kind !== 'empty');
    slots.sort((a, b) => a.team - b.team || a.slot - b.slot);
    this.timeLimit = cfg.timeLimit || 120;
    slots.forEach((s, i) => {
      const a = i / slots.length * Math.PI * 2 - Math.PI / 2, rr = R - 22;
      const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
      let f;
      if (s.kind === 'ai' || s.kind === 'you') f = this.addHero(x, y, s.team, s.kind === 'ai' ? 'agent' : 'key');
      else if (s.kind === 'net') f = this.addHero(x, y, s.team, 'agent', s.card); // a player's fighter, online
      else { f = this.spawnEnemy(s.kind, x, y, s.team); f.st = 0.9; }
      f.slot = s.slot;
      f.label = s.kind === 'net' ? s.card.name : s.kind === 'ai' ? 'Your AI' : s.kind === 'you' ? 'You' : ENEMY_TYPES[s.kind].name;
      const d = Math.hypot(x, y) || 1;
      f.fx = -x / d; f.fy = -y / d;
    });
    const all = this.fighters();
    this.roster = all.slice(); // everyone who started, for the scoreboard
    // the camera and HUD follow you if you are in it, else your AI, else whoever is first
    this.p = all.find(f => f.controller === 'key') || all.find(f => f.controller === 'agent') || all[0] || this.makeFighter(null, 0, 0, 99);
    this.emit('wave', 0, 0, { n: 1, boss: null, battle: true });
  }

  makeFighter(type, x, y, team = 1) {
    const def = type ? ENEMY_TYPES[type] : null;
    const fs = def ? { hp: def.hp, energy: 100, energyRegen: 22, posture: POSTURE_MAX } : this.fighter;
    return {
      isPlayer: !type, type: type || 'hero', def, id: this.nextId++, team,
      x, y, r: def ? def.r : P.r, hp: fs.hp, maxHp: fs.hp,
      energy: fs.energy, energyMax: fs.energy, energyRegen: fs.energyRegen, postureMax: fs.posture,
      mass: def ? def.mass : 1, postureMul: def ? def.postureMul : 1, moves: def ? def.moves : BASE_MOVES,
      specials: def ? def.specials.slice() : [], speedMul: 1, cdMul: 1, phase: 1,
      posture: 0, state: type ? 'spawn' : 'idle', st: type ? 0.6 : 0, atk: null, windT: 0,
      guard: false, guardStart: -9, lastGuardPress: -9, combo: 0, lastHitT: -9, lastHurtT: -9,
      kvx: 0, kvy: 0, fx: 1, fy: 0, mvx: 0, mvy: 0, rdx: 0, rdy: 0, hurtT: 0, flash: 0, rootT: 0,
      cds: { kick: 0, roll: 0, ai: 0.6 }, windId: 0, engaged: false, lungeHit: false, abilities: [null, null], abCd: [0, 0],
      action: null, kills: 0, dmgOut: 0, dmgIn: 0, dead: false,
      // ai and passives
      seenWind: 0, plan: null, strafe: 1, blinkCd: 2, counterAt: 0, counterFast: false, stillT: 0,
      wardAt: 0, revived: false, auraT: 0, blessT: 0, spinLeft: 0, spinT: 0,
    };
  }

  emit(type, x, y, extra) { if (this.fx) this.fx.push(Object.assign({ type, x, y }, this.tintNow ? { tint: this.tintNow } : null, extra)); }

  // a talent value for a fighter (0 for anyone without talents)
  T(f, k) {
    if (!f) return 0;
    let v = f.tal ? f.tal[k] || 0 : 0;
    if (f.beastT > 0 && BEAST_MODS[f.beast]) v += (BEAST_MODS[f.beast][k] || 0) + (f.skinTalent ? BEAST_ALL[k] || 0 : 0); // in a beast's skin (the talent's skins are stronger)
    if (f.awakeT > 0 && f.awaken) { const m = f.awaken.mods[k] || 0; v += m === 1 ? 1 : m * f.awakenPower; } // awakened: stronger with every awakening this fight
    return v;
  }

  active(e) { return e.state !== 'spawn' && !e.dead; }

  airborne(f, source) {
    if (source && source.def && source.def.pierceIframes) return false;
    return (f.state === 'act' && f.atk && (f.atk.kind === 'leap' || f.atk.untargetable)) || !!f.batForm || !!f.swordForm || f.state === 'transform' || f.state === 'morph' || !!f.climbing
      || (f.state === 'roll' && this.T(f, 'shadowStep') > 0)
      || (f.state === 'heroult' && f.special && (f.special.stage || 1) >= 2 && (f.special.mods || []).includes('phase'));
  }

  fighters() { return this.heroes.concat(this.enemies); }

  // everyone on another team who can be fought right now
  hostiles(f) { return this.fighters().filter(o => o.team !== f.team && this.active(o)); }

  nearestTo(list, x, y) {
    let best = null, bd = Infinity;
    for (const o of list) { const d = (o.x - x) ** 2 + (o.y - y) ** 2; if (d < bd) { bd = d; best = o; } }
    return best;
  }

  nearestEnemy(f = this.p) { return f ? this.nearestTo(this.hostiles(f), f.x, f.y) : null; }

  // Who a fighter aims at: the nearest hostile, but it sticks with its current target unless another is clearly closer.
  targetOf(f) {
    let hs = this.hostiles(f);
    if (f.def && f.def.trueSight) { const real = hs.filter(o => !(o.def && o.def.decoy)); if (real.length) hs = real; }
    if (!hs.length) { f.tgt = null; return null; }
    let best = this.nearestTo(hs, f.x, f.y);
    if (f.tgt && f.tgt !== best && hs.includes(f.tgt)) {
      const dCur = Math.hypot(f.tgt.x - f.x, f.tgt.y - f.y), dBest = Math.hypot(best.x - f.x, best.y - f.y);
      if (dCur < dBest * 1.3 + 10) best = f.tgt;
    }
    f.tgt = best;
    return best;
  }

  victims(f) { return this.hostiles(f); }

  // classic training: is this fighter on the hero's side?
  friendlyToHero(f) { return this.p && f.team === this.p.team; }

  comboMult(f) { return 1 + Math.min(COMBO_CAP + this.T(f, 'comboCap'), COMBO_STEP * Math.max(0, f.combo - 1)); }

  sense(f = this.p) {
    const p = f, inp = this.input;
    let k = 0;
    const winding = p.state === 'wind';
    inp[k++] = p.hp / p.maxHp;
    inp[k++] = p.posture / p.postureMax;
    inp[k++] = p.energy / p.energyMax;
    inp[k++] = p.state === 'idle' ? 1 : 0;
    inp[k++] = p.guard ? 1 : 0;
    inp[k++] = p.guard && this.t - p.guardStart <= PARRY_WIN ? 1 : 0;
    inp[k++] = winding ? p.windT / p.atk.wind : 0;
    inp[k++] = winding && p.atk.id === 'heavy' ? 1 : 0;
    inp[k++] = this.t - p.lastHitT < COMBO_GAP ? Math.min(p.combo / 4, 1) : 0;
    inp[k++] = p.cds.kick <= 0 ? 1 : 0;
    inp[k++] = p.cds.roll <= 0 && p.rootT <= 0 ? 1 : 0;
    inp[k++] = p.x / R;
    inp[k++] = p.y / R;
    inp[k++] = Math.hypot(p.x, p.y) / R;
    const near = this.hostiles(p);
    inp[k++] = Math.min(near.length / 4, 1);

    for (const e of near) e._d = Math.hypot(e.x - p.x, e.y - p.y);
    near.sort((a, b) => a._d - b._d);
    for (let i = 0; i < 2; i++) {
      const e = near[i];
      if (!e) { for (let j = 0; j < 14; j++) inp[k++] = 0; continue; }
      const ew = e.state === 'wind';
      const ulting = e.state === 'ult' || e.state === 'transform';
      inp[k++] = 1;
      inp[k++] = clamp((this.seenX(e) - p.x) / 120, -1, 1);
      inp[k++] = clamp((this.seenY(e) - p.y) / 120, -1, 1);
      inp[k++] = Math.min((e._d - e.r - p.r) / 160, 1);
      inp[k++] = ew ? e.windT / e.atk.wind : e.state === 'act' || ulting ? 1 : 0;
      inp[k++] = ew && e.atk.breaksGuard ? 1 : 0;
      inp[k++] = (ew && e.atk.unblockable) || ulting ? 1 : 0;
      inp[k++] = ew && e.atk.ignoresGuard ? 1 : 0;
      inp[k++] = e.guard ? 1 : 0;
      inp[k++] = e.state === 'stun' || e.state === 'recoil' ? 1 : 0;
      inp[k++] = e.posture / e.postureMax;
      inp[k++] = e.hp / e.maxHp;
      inp[k++] = e.def && e.def.ai === 'kite' ? 1 : 0;
      inp[k++] = e.mass >= 3 ? 1 : 0;
    }

    let bp = null, bd = Infinity;
    for (const pr of this.proj) {
      if (pr.team === p.team) continue;
      const d = (pr.x - p.x) ** 2 + (pr.y - p.y) ** 2;
      if (d < bd) { bd = d; bp = pr; }
    }
    if (bp) {
      inp[k++] = 1;
      inp[k++] = clamp((bp.x - p.x) / 100, -1, 1);
      inp[k++] = clamp((bp.y - p.y) / 100, -1, 1);
      inp[k++] = bp.delay > 0 ? 0 : bp.vx / 170;
      inp[k++] = bp.delay > 0 ? 0 : bp.vy / 170;
    } else { for (let j = 0; j < 5; j++) inp[k++] = 0; }

    // nearest danger zone on the floor (sigil, mine, vortex, roots...)
    let bh = null; bd = Infinity;
    for (const h of this.hazards) {
      if (h.team === p.team) continue;
      const d = (h.x - p.x) ** 2 + (h.y - p.y) ** 2;
      if (d < bd) { bd = d; bh = h; }
    }
    if (bh) {
      inp[k++] = 1;
      inp[k++] = clamp((bh.x - p.x) / 60, -1, 1);
      inp[k++] = clamp((bh.y - p.y) / 60, -1, 1);
      inp[k++] = bh.kind === 'mine' ? (bh.arm > 0 ? 0.5 : 1) : bh.t / bh.delay;
    } else { for (let j = 0; j < 4; j++) inp[k++] = 0; }

    // equipped abilities: ready, and what kind they are
    for (let i = 0; i < 2; i++) {
      const ab = p.abilities[i];
      inp[k++] = ab && p.abCd[i] <= 0 && p.energy >= ab.cost && !this.ruled(p, 'noenergy') ? 1 : 0;
      for (const tag of 'rams') inp[k++] = ab && ab.tags.includes(tag) ? 1 : 0;
    }
    return inp;
  }

  // action (for the main hero in training): [moveX, moveY, strike, heavy, guard, kick, roll, ability1, ability2].
  // In battles each hero carries its own `action`, set before stepping.
  step(action) {
    if (this.done) return;
    if (action) {
      this.p.action = action;
      for (let i = 0; i < N_OUTPUTS; i++) this.lastOut[i] = action[i];
    }
    this.t += DT;
    if (this.timeStopT > 0) this.timeStopT -= DT;
    if (this.domainT > 0) this.domainT -= DT;
    if (this.heroDomain && (this.heroDomain.t -= DT) <= 0) this.heroDomain = null;
    if (this.skySplit && (this.skySplit.t -= DT) <= 0) this.skySplit = null;
    if (this.scripture && (this.scripture.t -= DT) <= 0) this.scripture = null;
    if (this.bigDragon && (this.bigDragon.t += DT) >= this.bigDragon.dur) this.bigDragon = null;
    for (const m of this.enemies) if (!m.dead && m.summoner != null) this.claimSummon(m);

    for (const f of this.fighters()) if (!f.dead) this.updateStatus(f);
    this.frameN = (this.frameN || 0) + 1;
    if (this.slowmo && (this.slowmo.t -= DT) <= 0) this.slowmo = null;
    const slowed = f => this.slowmo && f.team !== this.slowmo.team && this.frameN % 2 === 1; // half speed: they move every other tick
    for (const h of this.heroes) if (!slowed(h)) this.updateHero(h);
    for (const e of this.enemies.slice()) {
      if (e.dead) continue;
      if (!slowed(e)) this.updateEnemy(e);
      if (!this.battle && this.active(e) && !this.friendlyToHero(e) && !e.def.summon && (!e.def.boss || e.def.manual)) this.exposure[e.type] = (this.exposure[e.type] || 0) + DT;
    }
    this.updateYellowCourt();
    this.updateProjectiles();
    this.updateHazards();
    this.updateGrabs();
    this.updatePast();
    this.separate();
    this.resolveFalls();
    this.updateRevives();
    this.updateRewinds();
    if (this.done) return;

    if (this.battle) this.checkBattleOver();
    else {
      this.updateWaves();
      if (!this.done && this.t >= this.timeLimit) this.finish('time');
    }
  }

  updateHero(h) {
    if (h.dead) return;
    if (h.frozenT > 0) { h.frozenT -= DT; return; } // caught in stopped time
    if (h === this.p) {
      const ranged = {};
      for (const e of this.enemies) if (!e.dead && this.active(e) && !this.friendlyToHero(e)) {
        this.observation.foes[e.type] = 1;
        if (e.def.boss && e.summoner == null) this.observation.bosses[e.type] = 1;
        if (e.def.role === 'marksman' || (e.def.specials || []).some(a => ['shoot', 'lob'].includes(a.kind))) {
          const close = Math.hypot(e.x - h.x, e.y - h.y) - e.r - h.r < BASE_MOVES.strike.range + 2;
          ranged[e.type] = ranged[e.type] || close;
        }
      }
      for (const [type, close] of Object.entries(ranged)) {
        const v = this.observation.ranged[type] || (this.observation.ranged[type] = { time: 0, close: 0 });
        v.time += DT;
        if (close) v.close += DT;
      }
      if (h.hp > 0 && h.hp < h.maxHp * 0.05) this.stats.belowFive = true;
      if (h.hp < h.maxHp * 0.35) this.stats.lowHpT += DT;
      if (h.guard) this.stats.guardT += DT;
      const near = this.nearestEnemy(h);
      if (near) {
        const gap = Math.max(0, Math.hypot(near.x - h.x, near.y - h.y) - near.r - h.r);
        if (gap < BASE_MOVES.strike.range + 2) this.stats.reach += DT;
        // Pay for closing the gap too; reversing direction gives the progress back.
        // Reset on a target change so a newly spawned or nearer foe isn't a free reward.
        const distance = Math.min(200, gap);
        if (this.reachTarget === near) this.stats.reach += (this.reachDistance - distance) / 80;
        this.reachTarget = near; this.reachDistance = distance;
      } else this.reachTarget = null;
    }
    if (h.awakeT > 0 && (h.awakeT -= DT) <= 0) { h.fxScale = 1; this.emit('awakenEnd', h.x, h.y); }
    this.heroTalents(h);
    if (h.swordForm && h.state !== 'act') h.swordForm = false;
    if (h.state === 'heroult') return this.updateHeroUlt(h);
    // Awakening and the Ultimate Special fire on their own once their gauges fill
    if (h.awaken && h.awakenGauge >= 100 && h.state !== 'stun' && h.state !== 'act') {
      h.awakenGauge = 0; h.awakeT = 8;
      // every awakening in a fight comes back stronger and larger, up to the third
      h.awakenCount++; h.tier = Math.min(3, h.awakenCount);
      h.awakenPower = 1 + 0.3 * (h.tier - 1); h.fxScale = 1 + 0.2 * h.tier;
      if (h === this.p) this.stats.awakenings++;
      this.emit('awaken', h.x, h.y, { name: h.awaken.name, color: h.awaken.color, tier: h.tier });
    }
    if (h.special && h.awakeT > 0 && h.ultGauge >= 100 && (h.state === 'idle' || h.state === 'recover')) { // only while awakened
      const tgt0 = this.nearestEnemy(h);
      if (tgt0 && Math.hypot(tgt0.x - h.x, tgt0.y - h.y) < 140) return this.startHeroUlt(h);
    }
    const a = h.action || [0, 0, -1, -1, -1, -1, -1, -1, -1];
    let mx = a[0], my = a[1];
    const mag = Math.hypot(mx, my);
    if (mag > 1) { mx /= mag; my /= mag; }
    if (mag < 0.15) { mx = 0; my = 0; }
    const tgt = this.nearestEnemy(h);
    if (h.state === 'act' || h.state === 'roll') { /* committed: keep heading */ }
    else if (tgt) {
      const d = Math.hypot(tgt.x - h.x, tgt.y - h.y) || 1;
      h.fx = (tgt.x - h.x) / d; h.fy = (tgt.y - h.y) / d;
    } else if (mx || my) {
      const d = Math.hypot(mx, my); h.fx = mx / d; h.fy = my / d;
    }
    if (h.state === 'act') return this.updateAct(h);
    const x0 = h.x, y0 = h.y;
    this.updateFighter(h, {
      mx, my, strike: a[2] > 0, heavy: a[3] > 0, guard: a[4] > 0, kick: a[5] > 0, roll: a[6] > 0, ab1: a[7] > 0, ab2: a[8] > 0,
    }, P.speed * (1 + this.T(h, 'speed')));
    if (h === this.p) this.stats.dist += Math.hypot(h.x - x0, h.y - y0);
  }

  // The fighter's Ultimate Special. Its shape depends on how far it has evolved:
  // 1 Manifestation: its awakening's rhythm over two favourite abilities.
  // 2 Specialization: modifiers from its second trait and its talents.
  // 3 Synthesis: a third tradition joins and the techniques fuse.
  // 4 Transcendence: a domain of its own, a storm of fused casts and a finale drawn from its history.
  startHeroUlt(h) {
    const sp = h.special, stage = sp.stage || 1, mods = sp.mods || [];
    const ab = k => HERO_ABILITIES[k];
    const P = [sp.primary, sp.secondary, stage >= 3 ? sp.third : null].filter(k => k && ab(k)).map(ab);
    const pick = i => ({ ab: P[i % P.length] });
    let seq;
    if (stage >= 4) {
      seq = [[0, 'domain']];
      for (let i = 0; i < 10; i++) seq.push([0.3 + i * 0.13, { ...pick(i), blink: i % 2 === 0 }]);
      seq.push([1.75, 'finale'], [2.25, 'finisher']);
    } else {
      seq = this.specialRhythm(sp.awaken, pick);
      if (stage >= 2 && mods.includes('extraCast')) seq.splice(seq.length - 1, 0, [seq[seq.length - 1][0] - 0.1, { ...pick(0), mult: 1.3 }]);
      if (stage >= 2 && mods.includes('thirdCast') && sp.extra && ab(sp.extra)) seq.splice(1, 0, [seq[1][0] - 0.05, { ab: ab(sp.extra) }]);
    }
    h.state = 'heroult'; h.ultT = -0.5; h.ultIdx = 0; h.ultSeq = seq; h.ultDur = seq[seq.length - 1][0] + 0.45;
    if (stage >= 2) { // talents that reshape the special
      if (mods.includes('timestop')) this.stopTime(h, 1.2);
      if (mods.includes('clones')) { this.shadowClone(h, true); this.shadowClone(h, true); }
      if (mods.includes('beast')) { const k = Object.keys(BEAST_MODS)[Math.floor(this.rand() * 5)]; h.skinTalent = false; h.beast = k; h.beastT = h.ultDur + 2.5; this.emit('shiftform', h.x, h.y, { name: SHIFT_FORMS[k].name, color: SHIFT_FORMS[k].color }); }
      if (mods.includes('kaioken')) { h.hp = Math.max(1, h.hp - h.maxHp * 0.05); this.emit('kaioken', h.x, h.y); }
    }
    h.ultGauge = 0; h.guard = false; h.ultDmg = 0; h.nextMult = 1; h.stored = 0;
    if (h === this.p) this.stats.specials++;
    this.emit('heroUlt', h.x, h.y, { name: sp.name, stage, color: (AWAKENINGS[sp.awaken] || {}).color || '#ffffff' });
  }

  // Each awakening plays its special to its own rhythm.
  specialRhythm(awaken, pick) {
    switch (awaken) {
      case 'aggression': return [[0, pick(0)], [0.12, pick(0)], [0.24, pick(1)], [0.36, pick(0)], [0.48, pick(1)], [0.6, pick(2)], [0.85, 'finisher']];  // a flurry
      case 'defense': return [[0, 'stance'], [0.8, pick(0)], [1.0, pick(1)], [1.2, pick(2)], [1.5, 'finisher']];                                       // absorb, then answer
      case 'mobility': return [0, 1, 2, 3, 4].map(i => [i * 0.2, { ...pick(i), blink: true }]).concat([[1.1, 'finisher']]);                               // blinking round the target
      case 'precision': return [[0, 'charge'], [0.6, { ...pick(0), mult: 2.2 }], [0.9, { ...pick(1), mult: 1.6 }], [1.15, pick(2)], [1.4, 'finisher']];    // one perfect cut
      case 'endurance': return [[0, pick(0)], [0.35, 'quake'], [0.6, pick(1)], [0.95, 'quake'], [1.2, pick(2)], [1.5, 'finisher']];                       // slow, heavy
      default: return [[0, pick(0)], [0.2, pick(1)], [0.4, pick(2)], [0.6, pick(3)], [0.9, 'finisher']];                                                // every form in turn
    }
  }

  updateHeroUlt(h) {
    const tgt = this.nearestEnemy(h), sp = h.special;
    if (tgt) { const d = Math.hypot(tgt.x - h.x, tgt.y - h.y) || 1; h.fx = (tgt.x - h.x) / d; h.fy = (tgt.y - h.y) / d; }
    h.ultT += DT;
    if (h.stanceT > 0) h.stanceT -= DT;
    const tint = (AWAKENINGS[sp.awaken] || {}).color, np = this.proj.length, nh = this.hazards.length;
    this.tintNow = tint; // everything the special makes wears its awakening's colour
    while (h.ultT >= 0 && h.ultIdx < h.ultSeq.length && h.ultT >= h.ultSeq[h.ultIdx][0]) {
      const [, part] = h.ultSeq[h.ultIdx++];
      const ring = (radius, dmg, kb) => this.heroRing(h, radius, dmg, kb);
      if (part === 'finisher') this.heroFinisher(h, tgt);
      else if (part === 'stance') { h.stanceT = 0.8; this.emit('herostance', h.x, h.y); }
      else if (part === 'charge') { h.nextMult = 1; this.emit('herocharge', h.x, h.y); }
      else if (part === 'quake') { ring(32, 10 * (h.awakenPower || 1), 140); this.emit('heroquake', h.x, h.y); }
      else if (part === 'domain') { this.heroDomain = { t: 2.7, color: (AWAKENINGS[sp.awaken] || {}).color || '#ffffff' }; this.emit('herodomain', h.x, h.y, { color: this.heroDomain.color, title: sp.title }); }
      else if (part === 'finale') this.heroFinale(h, tgt);
      else this.heroComponent(h, part, tgt, h.ultIdx);
    }
    this.tintNow = null;
    for (let i = np; i < this.proj.length; i++) { this.proj[i].tint = tint; this.proj[i].fromSpecial = true; }
    for (let i = nh; i < this.hazards.length; i++) { this.hazards[i].tint = tint; this.hazards[i].fromSpecial = true; }
    if (h.ultT >= h.ultDur) {
      h.state = 'recover'; h.st = 0.3; h.stanceT = 0;
      if (h === this.p && h.ultDmg > 0) { this.stats.specialLands++; if ((sp.stage || 1) >= 3) this.stats.synthLands++; }
    }
  }

  // One step of the special: maybe a blink first, the empowered cast, then whatever its modifiers and fusions add.
  heroComponent(h, part, tgt, i) {
    const sp = h.special, mods = sp.mods || [], fusion = (sp.stage || 1) >= 3 ? sp.fusion || [] : [];
    const atk0 = part.ab.atk, dash = ['pounce', 'leap', 'melee', 'vanish', 'flurry', 'swordlight'].includes(atk0.kind);
    let blinked = false;
    if (tgt && !dash && (part.blink || ((sp.stage || 1) >= 2 && mods.includes('blinkAll')))) { this.heroBlink(h, tgt, i); blinked = true; }
    let mult = (part.mult || 1) * (h.nextMult || 1);
    if ((sp.stage || 1) >= 2 && mods.includes('crit')) mult *= 1.4;
    if ((sp.stage || 1) >= 2 && mods.includes('kaioken')) mult *= 1.3;
    h.nextMult = 1;
    this.castCore(h, atk0, tgt, i, mult);
    if (dash) blinked = true;
    // Synthesis: the traditions feed each other
    const P = [sp.primary, sp.secondary, sp.third].map(k => HERO_ABILITIES[k]).filter(Boolean);
    const of = kind => P.find(a => a.atk.kind === kind);
    if (fusion.includes('blinkshots') && blinked && of('shoot')) for (let j = 0; j < 3; j++) this.castCore(h, of('shoot').atk, tgt, i + j, 0.5);
    if (fusion.includes('landseals') && blinked && of('sigil')) this.castCore(h, { ...of('sigil').atk, pattern: 'single' }, { x: h.x, y: h.y, r: 0 }, i, 0.7);
    if (fusion.includes('firewell') && atk0.kind === 'cone' && tgt) this.hazards.push({ kind: 'vortex', variant: 'gravity', team: h.team, src: h, x: tgt.x, y: tgt.y, r: 20, t: 0.8, delay: 0.8, pull: 140, dmg: 10 });
    if (fusion.includes('weave') && P[2] && part.ab !== P[2]) this.castCore(h, P[2].atk, tgt, i, 0.5);
    // Specialization: what its talents add
    if ((sp.stage || 1) >= 2 && tgt) {
      if (mods.includes('breath')) { this.emit('cone', h.x, h.y, { fx: h.fx, fy: h.fy, range: 26, angle: 0.6, variant: 'fire' }); this.heroRing(h, 26, 6, 40, 0.6); }
      if (mods.includes('thunder')) this.hazards.push({ kind: 'sigil', variant: 'goldlightning', x: tgt.x, y: tgt.y, r: 10, t: 0.3, delay: 0.3, dmg: 10, team: h.team, src: h });
      if (mods.includes('qi')) { const pr = this.fire(h, h.fx, h.fy, 200, 10, 'qi'); pr.life = 0.5; }
      if (mods.includes('ora') && tgt.id) this.standRush(h, tgt, 3);
      if (mods.includes('beast') && tgt.id) this.receiveHit(tgt, h, { id: 'claw', dmg: 6 * (h.awakenPower || 1), kb: 30, hitPosture: 8, unblockable: true }, h.fx, h.fy);
      if (mods.includes('elements')) this.elementBurst(h, tgt, (h.elemN = (h.elemN || 0) + 1));
      if (mods.includes('copy')) { // the copy wheel eye: casts what the target itself knows
        const known = (tgt.specials || []).filter(s => MULTICAST_KINDS.has(s.kind) && s.kind !== 'summon');
        if (known.length) { const keep = h.atk; h.atk = { ...known[Math.floor(this.rand() * known.length)], energy: 0, abilityId: null, copy: i }; this.special(h); h.atk = keep; h.state = 'heroult'; this.emit('sharingan', h.x, h.y); }
      }
    }
  }

  heroBlink(h, tgt, i) {
    const a = Math.atan2(h.y - tgt.y, h.x - tgt.x) + (i % 2 ? 1.6 : -1.6) + i * 0.4;
    this.emit('blink', h.x, h.y);
    h.x = tgt.x + Math.cos(a) * 14; h.y = tgt.y + Math.sin(a) * 14;
    const r = Math.hypot(h.x, h.y); if (r > R - 8) { h.x *= (R - 8) / r; h.y *= (R - 8) / r; }
    const d = Math.hypot(tgt.x - h.x, tgt.y - h.y) || 1; h.fx = (tgt.x - h.x) / d; h.fy = (tgt.y - h.y) / d;
    this.emit('blink', h.x, h.y);
  }

  // One empowered cast of a learned ability. Lunges and bites become a blink straight to the target.
  castCore(h, atk0, tgt, i, mult = 1) {
    const m = 1 + (h.tier || 1) / 6;
    const sm = (h.special && (h.special.stage || 1) >= 2 && h.special.mods) || [];
    const parts = atk0.pattern ? atk0.count || 1 : atk0.shots || atk0.count || 1; // a cast that splits into many pieces shares the boost between them
    const atk = { ...atk0, dmg: (atk0.dmg || 0) * 1.1 * (h.awakenPower || 1) * mult / Math.sqrt(parts), radius: atk0.radius && atk0.radius * m, range: atk0.range && atk0.range * m, hits: 1, energy: 0, copy: i % 2 ? 0 : i, abilityId: null,
      trueDmg: sm.includes('haki') || atk0.trueDmg };
    if (['pounce', 'leap', 'melee', 'vanish', 'flurry', 'swordlight'].includes(atk.kind)) {
      if (!tgt || !tgt.id) return;
      this.heroBlink(h, tgt, i);
      this.emit('release', h.x, h.y, { id: atk.id, fx: h.fx, fy: h.fy, hero: true, range: 20, angle: 0, scale: h.fxScale || 1 });
      this.receiveHit(tgt, h, { ...atk, kind: 'melee' }, h.fx, h.fy);
      return;
    }
    const keep = h.atk;
    h.atk = atk;
    this.special(h);
    h.atk = keep; h.state = 'heroult';
  }

  heroRing(h, radius, dmg, kb, posture = 1) {
    for (const v of this.victims(h)) {
      const d = Math.hypot(v.x - h.x, v.y - h.y) || 1;
      if (d <= radius + v.r && !this.airborne(v)) this.receiveHit(v, h, { id: 'finisher', dmg, kb, unblockable: true, hitPosture: 30 * posture }, (v.x - h.x) / d, (v.y - h.y) / d);
    }
  }

  // The closing move depends on the fighter's awakening.
  heroFinisher(h, tgt) {
    const sp = h.special, key = sp.awaken, P = h.awakenPower || 1, mods = (sp.stage || 1) >= 2 ? sp.mods || [] : [];
    this.emit('heroFinisher', h.x, h.y, { kind: AWAKENINGS[key] ? AWAKENINGS[key].finisher : 'nova', color: AWAKENINGS[key] ? AWAKENINGS[key].color : '#fff', scale: h.fxScale || 1 });
    switch (key) {
      case 'aggression': this.heroRing(h, 34, 26 * P * (mods.includes('serious') ? 2 : 1), 220); break;
      case 'defense': { // answers with everything it soaked in its stance
        const n = h.maxHp * 0.2; h.hp = Math.min(h.maxHp, h.hp + n); this.emit('heal', h.x, h.y, { n: Math.round(n) });
        this.heroRing(h, 28, 14 * P + (h.stored || 0), 160); h.stored = 0; break;
      }
      case 'mobility': if (tgt) for (let i = 0; i < 4; i++) this.castCore(h, { id: 'finisher', kind: 'melee', dmg: 7, kb: 30, hitPosture: 8 }, tgt, i + 10); break;
      case 'precision': { const pr = this.fire(h, h.fx, h.fy, 420, 40 * P * (mods.includes('serious') ? 2 : 1), 'rail'); pr.pierce = true; pr.breaksGuard = true; pr.radius = 4; pr.kb = 180; pr.hitPosture = 50; break; }
      case 'endurance': this.heroRing(h, 30, 18 * P, 200); h.awakeT = Math.max(h.awakeT, 3); break;
      default: for (const ab of h.abilities.filter(Boolean)) this.castCore(h, ab.atk, tgt, 7); break;
    }
    if (mods.includes('serious') && key !== 'aggression' && key !== 'precision') this.heroRing(h, 30, 24 * P, 260); // one serious punch to close
    if (mods.includes('phoenixFin')) { const n = h.maxHp * 0.15; h.hp = Math.min(h.maxHp, h.hp + n); this.emit('phoenix', h.x, h.y); }
  }

  // Transcendence: a finale borrowed from the boss it has beaten most.
  heroFinale(h, tgt) {
    const p = tgt || { x: h.x + h.fx * 40, y: h.y + h.fy * 40, fx: h.fx, fy: h.fy, r: 0, team: -1 };
    this.emit('herofinale', h.x, h.y, { boss: h.special.finale });
    switch (h.special.finale) {
      case 'swordsaint': if (h.special.swordUpgrade) this.ultStep(h, 'onesword', { dmg: 45, pct: 0.15 }, p); else this.ultStep(h, 'swordRing', { count: 12, dmg: 12, first: 0.2, gap: 0.06 }, p); break;
      case 'abbot': for (let i = 0; i < 8; i++) this.ultStep(h, 'palmrain', {}, p); break;
      case 'vampirelord': this.ultStep(h, 'drain', { range: 90, dmg: 10 }, p); break;
      case 'deadeye': this.ultStep(h, 'radial', { count: 16, kind: 'bullet', dmg: 10, speed: 220 }, p); break;
      case 'lich': this.ultStep(h, 'cross', { rot: 0, variant: 'soulspikes' }, p); this.ultStep(h, 'cross', { rot: Math.PI / 4, variant: 'soulspikes' }, p); break;
      case 'emperor': this.ultStep(h, 'lightning', { count: 7, variant: 'goldlightning', dmg: 20 }, p); break;
      case 'timeadmin': this.ultStep(h, 'timefreeze', { dur: 1.5 }, p); break;
      case 'yellowking': this.ultStep(h, 'radial', { count: 12, kind: 'orb', dmg: 12, speed: 120 }, p); break;
      case 'gojo': this.ultStep(h, 'purpleult', { radius: 18, dmg: 40, speed: 170 }, p); break;
      case 'unknown': this.ultStep(h, 'radial', { count: 18, kind: 'clockhand', dmg: 9, speed: 160 }, p); break;
      case 'blind': for (let i = 0; i < 6; i++) this.ultStep(h, 'spacecut', { dmg: 10 }, p); this.ultStep(h, 'beam', { ...SPACE_CUT, variant: 'bigcut', len: 160, width: 14, dmg: 28, delay: 0.25, aimed: true }, p); break;
      case 'wukong': this.ultStep(h, 'monkeyswarm', { count: 6 }, p); this.ultStep(h, 'beam', { variant: 'pillar', len: 260, width: 20, dmg: 26, kb: 200, delay: 0.5, aimed: true }, p); break;
      case 'mahoraga': this.ultStep(h, 'beam', { variant: 'exterminate', len: 170, width: 14, dmg: 30, kb: 200, delay: 0.3, aimed: true, trueDmg: true }, p); this.ultStep(h, 'beam', { variant: 'exterminate', len: 170, width: 14, dmg: 30, kb: 200, delay: 0.5, aimed: true, turn: 1.57, trueDmg: true }, p); break;
      case 'zergqueen': this.ultStep(h, 'swarm', { n: 6 }, p); break;
      case 'warlord': // a smaller Tyrant's Massacre: two rings of spinning axes
        this.ultStep(h, 'radial', { count: 10, kind: 'axe', dmg: 9, speed: 150 }, p);
        this.ultStep(h, 'radial', { count: 10, kind: 'axe', dmg: 9, speed: 110, offset: Math.PI / 10 }, p);
        break;
      case 'scholar': // a smaller One Stroke to End the Chapter: a single great brush stroke, laid down and then struck
        this.ultStep(h, 'beam', { variant: 'inkstroke', len: 200, width: 18, dmg: 26, kb: 160, delay: 0.6, aimed: true }, p);
        break;
      default: this.heroRing(h, 46, 30 * (h.awakenPower || 1), 260); break; // no boss beaten yet: one enormous blast
    }
  }

  // Knockback, ring-outs and deaths for everyone.
  resolveFalls() {
    for (const f of this.fighters()) {
      if (f.dead) continue;
      const fell = this.applyKnockback(f, f.isPlayer ? 70 : 40);
      if (!fell && f.hp > 0) continue;
      // Wall Crawler: off the edge, and straight back up the side of the stage
      if (fell && f.hp > 0 && f.def && f.def.wallCrawler) {
        const d = Math.hypot(f.x, f.y) || 1, k = (R - f.r) / d;
        f.x *= k; f.y *= k; f.kvx = f.kvy = 0; f.state = 'recover'; f.st = 0.7; f.climbUpT = 0.7;
        this.emit('climbback', f.x, f.y);
        continue;
      }
      // Undying Heart: the Blind Gentleman rises four times, stronger each time and with half the life
      if (!fell && f.def && f.def.undyingHeart && (f.lives || 0) < f.def.undyingHeart) {
        f.lives = (f.lives || 0) + 1;
        f.maxHp = Math.max(10, Math.round(f.maxHp * 0.5)); f.hp = f.maxHp; f.posture = 0; f.state = 'recover'; f.st = 0.6; f.invulnT = 1.5;
        f.dmgMul = (f.dmgMul || 1) * 1.4; f.speedMul *= 1.12; f.cdMul *= 0.85; f.cds.ult = 1.2;
        if (f.lives >= 2) f.phase = 2; // the blindfold is gone; his ultimate changes
        this.emit('undying', f.x, f.y, { n: f.lives, color: f.def.color });
        continue;
      }
      // Rebirth: the Phoenix falls as an egg, and hatches again unless it is broken
      if (!fell && f.def && f.def.rebirth && (f.rebirths || 0) < f.def.rebirth && f.state !== 'egg') {
        f.state = 'egg'; f.eggT = 4; f.hp = f.maxHp * 0.3; f.posture = 0; f.guard = false; f.plan = null; f.chainAt = 0; f.heat = 0; f.spriteNow = 'phoenix_egg';
        f.fearT = f.charmT = f.polyT = 0;
        this.emit('egg', f.x, f.y);
        continue;
      }
      // Phoenix Feather: the hero rises once per life
      // Berserker Armor: the killing blow doesn't take
      if (!fell && this.T(f, 'berserkArmor') && !f.berserkUsed) {
        f.berserkUsed = true; f.hp = 1; f.berserkT = 4; f.state = 'idle'; f.posture = 0;
        this.emit('berserk', f.x, f.y);
        continue;
      }
      if (!fell && this.T(f, 'phoenix') && !f.phoenixUsed) {
        f.phoenixUsed = true; f.hp = f.maxHp * 0.3; f.posture = 0; f.state = 'idle';
        this.emit('phoenix', f.x, f.y);
        continue;
      }
      // The Honored One: Gojo masters Reverse Cursed Technique at death's door and comes back stronger
      if (!fell && f.def && f.def.honoredRevive && !f.honored) {
        f.honored = true; f.hp = f.maxHp * 0.6; f.posture = 0; f.state = 'recover'; f.st = 0.6; f.burnoutT = 0; f.strain = 0;
        f.dmgMul = (f.dmgMul || 1) * 1.3; f.speedMul = (f.speedMul || 1) * 1.2; f.cds.ult = 2;
        f.invulnT = 3; // nothing touches him for 3 seconds after he comes back
        this.emit('honored', f.x, f.y);
        continue;
      }
      // The Time Administrator falls... and what's left is you, from the past
      if (!fell && f.def && f.def.pastRevive && !f.pastUsed) {
        f.pastUsed = true;
        f.def = { ...f.def, sprite: 'b_past', sprite2: 'b_past', form2: 'You, From the Past', phasing: 0.15, phasing2: 0.15, glitch: false, anyUlt: false, ult: PAST_ULT, ult2: PAST_ULT, pastRevive: false, statusImmune: true, noFlinch: true }; // what's already happened can't be stunned
        if (f.finalKeeper) {
          const paradox = { name: 'The Life Before', charge: 1.1, dur: 3.4, cd: 14, dark: 'rgba(45,24,38,0.6)', steps: [[0.2, 'pastechoall', { dmg: 17 }], [0.9, 'pastechoall', { dmg: 17 }], [1.6, 'rewindall', {}], [2.0, 'radial', { count: 14, kind: 'clockhand', dmg: 14, speed: 155 }], [2.8, 'pastechoall', { dmg: 17 }]] };
          f.def = { ...f.def, ult: paradox, ult2: paradox };
        }
        f.specials = PAST_SPECIALS.map(s => f.finalKeeper ? { ...s, dmg: s.dmg ? Math.round(s.dmg * 1.2) : s.dmg, cd: s.cd * 0.8 } : { ...s });
        if (f.finalKeeper) f.specials.push({ id: 'bossrift', kind: 'summon', projection: true, cap: 4, wind: 0.9, recover: 0.55, cd: 11, maxRange: 999 });
        f.cds = { ult: 4, bossrift: 2.5 }; f.hist = [];
        f.maxHp = Math.round(f.maxHp * (f.finalKeeper ? 0.7 : 0.5)); f.hp = f.maxHp; f.posture = 0; f.state = 'recover'; f.st = 0.8;
        f.dmgMul = 1.35; f.speedMul = 1.1; f.cdMul = 1; f.past = true; f.phase = 2;
        this.emit('pastself', f.x, f.y, { name: 'YOU, FROM THE PAST', color: '#ffd8a0', lore: 'BEFORE ANY OF IT HAPPENED' });
        continue;
      }
      // ???'s last gamble: at 0 health, two seconds of casting something new every tenth of a second
      if (!fell && f.def && f.def.lastGamble && !f.gambleUsed) {
        f.gambleUsed = true; f.lastStand = true; f.hp = 1;
        f.state = 'gamble'; f.gambleT = 2; f.gambleNext = 0; f.runners = []; f.guard = false; f.plan = null; f.frozenT = 0; f.dashT = 0;
        this.emit('lastgamble', f.x, f.y);
        continue;
      }
      // Undeath: the Vampire Lord rises once at 10%, frenzied and drinking twice as deep
      if (!fell && f.def && f.def.bloodRevive && !f.bloodRevived) {
        f.bloodRevived = true; f.hp = f.maxHp * 0.1; f.posture = 0; f.state = 'recover'; f.st = 0.4; f.frenzyT = 6;
        this.emit('bloodrise', f.x, f.y);
        continue;
      }
      // Undying: rises once unless it went down while posture-broken (or off the stage)
      if (!fell && f.def && f.def.undying && !f.revived && f.state !== 'stun') {
        f.revived = true; f.hp = f.maxHp * 0.3; f.state = 'spawn'; f.st = 1.2; f.posture = 0;
        this.emit('revive', f.x, f.y);
        continue;
      }
      this.kill(f, fell);
      if (!fell && f.def && f.def.splitInto) { // the Lich breaks apart; its pieces fight on
        f.def.splitInto.forEach((type, i) => {
          const a = i / 3 * Math.PI * 2, [x, y] = [f.x + Math.cos(a) * 12, f.y + Math.sin(a) * 12];
          const m = this.spawnEnemy(type, x, y, f.team); m.state = 'idle'; m.st = 0;
        });
        this.emit('lichsplit', f.x, f.y);
      }
      if (this.done) return;
    }
    this.enemies = this.enemies.filter(e => !e.dead);
    this.heroes = this.heroes.filter(h => !h.dead || h === this.p);
  }

  kill(f, fell) {
    f.dead = true; f.hp = Math.max(0, f.hp);
    if (f.summoner != null && f.def && f.def.zerg && !f.def.inferior && !f.spilled) { // the Queen takes back a little of what she spent on it
      const q = this.enemies.find(o => o.id === f.summoner && !o.dead && o.def.broodFeeds);
      if (q) { const n = Math.min(q.maxHp - q.hp, q.maxHp * (f.def.broodValue || 0.015)); if (n > 0) { q.hp += n; this.emit('heal', q.x, q.y, { n: Math.round(n) }); this.emit('broodfeed', f.x, f.y, { tx: q.x, ty: q.y }); } }
    }
    f.place = this.deaths++;
    f.diedAt = this.t;
    const by = f.lastHitBy;
    if (by && by.team !== f.team) {
      by.kills++;
      // jade for the hero's side (its summons count; summoned foes are worth nothing)
      if ((by.isPlayer || by.ally) && f.def && f.def.boss && f.summoner == null) this.stats.bossKills[f.type] = (this.stats.bossKills[f.type] || 0) + 1;
      if ((by.isPlayer || by.ally) && f.type && !f.projection) this.stats.killsByType[f.type] = (this.stats.killsByType[f.type] || 0) + 1; // the record of everything it has felled
      if ((by.isPlayer || by.ally) && f.summoner == null) { this.stats.bounty += bountyOf(f); by.bounty = (by.bounty || 0) + bountyOf(f); }
      if (this.T(by, 'killHeal')) { by.hp = Math.min(by.maxHp, by.hp + 20); by.energy = Math.min(by.energyMax, by.energy + 30); this.emit('heal', by.x, by.y, { n: 20 }); }
    }
    const poof = f.def && (f.def.decoy || f.def.hairClone);
    this.emit(poof ? 'poof' : fell ? 'fall' : 'death', f.x, f.y, { etype: f.type, hero: f.isPlayer, team: f.team, decoy: !!(f.def && f.def.decoy), hair: !!(f.def && f.def.hairClone) });
    if (f.def && f.def.burstOnDeath && !f.burst) this.bloaterBurst(f);
    if (!f.isPlayer && !fell) this.feedGhouls(f);
    if (!f.isPlayer) this.turnBack(f);
    if (f.def && f.def.volatile && !fell) { // the belt of flasks breaks open
      const keys = Object.keys(FLASKS);
      for (let i = 0; i < 3; i++) {
        const a = i / 3 * Math.PI * 2 + this.rand(), k = keys[Math.floor(this.rand() * keys.length)];
        this.lob(f, f.x + Math.cos(a) * 20, f.y + Math.sin(a) * 20, { proj: 'flask', flask: k, flight: 0.4, height: 14 }, FLASKS[k]);
      }
    }
    if (!this.battle) {
      if (f === this.p) {
        this.stats.died = 1;
        if (fell) this.stats.fell = 1;
        return this.finish(fell ? 'fell' : 'dead');
      }
      if (!this.friendlyToHero(f)) { this.stats.kills++; if (fell) this.stats.ringOuts++; }
    }
    if (f.summoner == null && !f.isPlayer && f.def && f.def.summon !== true && this.battle) this.emit('eliminated', f.x, f.y, { label: f.label, team: f.team });
    if (f.isPlayer && this.battle) this.emit('eliminated', f.x, f.y, { label: f.label, team: f.team });
    if (!fell && !f.isPlayer && this.claimFallen(f, by)) return;
    if (!fell && !f.isPlayer && !this.reviveMinion(f)) this.raiseDead(f);
  }

  // Ghouls feed on whatever falls near them.
  feedGhouls(f) {
    for (const o of this.enemies) {
      if (o === f || o.dead || !o.def.corpseEater || o.hp >= o.maxHp || Math.hypot(o.x - f.x, o.y - f.y) > 70) continue;
      const n = Math.min(o.maxHp - o.hp, o.maxHp * 0.4);
      o.hp += n; this.emit('heal', o.x, o.y, { n: Math.round(n) }); this.emit('feast', f.x, f.y, { tx: o.x, ty: o.y });
    }
  }

  // Clocks turned back: a Paradox Twin returns three seconds after it falls, unless its other falls first; once a
  // fight, a Chronomancer returns an ally that falls near it, at half health.
  turnBack(f) {
    const keep = r => ({ type: f.type, x: f.x, y: f.y, team: f.team, maxHp: f.maxHp, tuneDmg: f.tuneDmg, elite: f.elite });
    if (f.def.paradox) {
      this.rewinds = this.rewinds.filter(r => r.partner !== f); // its other was waiting on it: too late now
      if (f.partner && !f.partner.dead) { this.rewinds.push({ ...keep(), t: 3, hp: 1, partner: f.partner }); this.emit('paradox', f.x, f.y); return; }
    }
    if (f.summoner != null || (f.def && f.def.boss)) return;
    const chrono = this.enemies.find(o => !o.dead && o !== f && o.team === f.team && o.def.chronoRewind && !o.rewound && Math.hypot(o.x - f.x, o.y - f.y) < 130);
    if (chrono) { chrono.rewound = true; this.rewinds.push({ ...keep(), t: 1.2, hp: 0.5 }); this.emit('rewindally', f.x, f.y, { tx: chrono.x, ty: chrono.y }); }
  }

  updateRewinds() {
    for (const r of this.rewinds) {
      if ((r.t -= DT) > 0) continue;
      if (r.partner && r.partner.dead) continue;
      const e = this.spawnEnemy(r.type, r.x, r.y, r.team);
      e.maxHp = r.maxHp; e.hp = Math.max(1, Math.round(r.maxHp * r.hp)); e.tuneDmg = r.tuneDmg; e.elite = r.elite; e.st = 0.4;
      if (r.partner) { e.partner = r.partner; r.partner.partner = e; }
      this.emit('rewind', r.x, r.y, { tx: r.x, ty: r.y });
    }
    this.rewinds = this.rewinds.filter(r => r.t > 0 && !(r.partner && r.partner.dead));
  }

  // A summon felled by a necromancer rises again on the necromancer's side.
  claimFallen(f, by) {
    if (f.summoner == null || !by || by.dead || !by.def || !by.def.raiseDead || by.team === f.team || (f.def && (f.def.decoy || f.def.noClaim || f.def.boss)) || this.fighters().length >= 14) return false;
    const m = this.spawnMinion(f.type, f.x, f.y, by);
    if (!m) return false;
    m.hp = Math.round(m.maxHp * 0.6); m.st = 0.8; m.revived = true; m.def = { ...m.def, sprite: spriteOfDef(f) };
    this.emit('raise', f.x, f.y); this.emit('claimed', f.x, f.y, { name: f.def.name });
    return true;
  }

  // A battle ends when one team (summons aside) is left standing, or time runs out.
  checkBattleOver() {
    const alive = this.fighters().filter(f => !f.dead && f.summoner == null);
    const teams = new Set(alive.map(f => f.team));
    if (teams.size <= 1) { this.winner = alive.length ? alive[0].team : null; return this.finish('clear'); }
    if (this.t >= this.timeLimit) {
      // the team with the most health left takes it
      const hp = {};
      for (const f of alive) hp[f.team] = (hp[f.team] || 0) + f.hp / f.maxHp;
      this.winner = +Object.keys(hp).sort((a, b) => hp[b] - hp[a])[0];
      this.finish('time');
    }
  }

  // ---------- shared fighter mechanics ----------

  updateFighter(f, it, speed) {
    f.cds.kick -= DT; f.cds.roll -= DT; f.hurtT -= DT; f.flash -= DT; f.rootT -= DT;
    f.abCd[0] -= DT; f.abCd[1] -= DT;
    f.mvx = 0; f.mvy = 0;
    speed *= this.speedFactor(f);
    if (f.charmT > 0 && f.charmBy && !f.charmBy.dead) { // charmed: drawn helplessly toward the charmer
      const s = f.charmBy, dx = s.x - f.x, dy = s.y - f.y, d = Math.hypot(dx, dy) || 1;
      f.guard = false; f.state = 'idle'; f.chainAt = 0;
      if (d > s.r + f.r + 4) this.move(f, dx / d, dy / d, speed * 0.5);
      return;
    }
    if (f.polyT > 0) { // a rabbit can only hop about
      if (f.state === 'wind' || f.state === 'recover' || f.state === 'flinch' || f.state === 'recoil') f.state = 'idle';
      f.guard = false;
      if (f.state === 'idle') this.move(f, it.mx, it.my, speed * 0.6);
      return;
    }
    if (f.gravT > 0) it = { ...it, roll: false }; // too heavy to roll
    if (this.ruled(f, 'nomove')) { it = { ...it, mx: 0, my: 0, roll: false }; } // no step is taken
    if (this.ruled(f, 'noblock')) it = { ...it, guard: false };                  // no guard stands: no block, no parry
    if (f.fearT > 0 && !(f.def && f.def.statusImmune)) {
      f.fearT -= DT;
      const source = f.fearSource;
      const dx = f.x - source.x, dy = f.y - source.y, d = Math.hypot(dx, dy) || 1;
      f.guard = false; f.state = 'idle'; f.chainAt = 0;
      this.move(f, dx / d, dy / d, speed * 0.65); return;
    }
    if (f.rootT > 0) { it = { ...it, mx: 0, my: 0, roll: false }; }

    if (f.state !== 'stun') {
      const regen = f.guard ? 5 : this.t - f.lastHurtT > 1 ? 14 : 4;
      f.posture = Math.max(0, f.posture - regen * DT * f.postureMax / POSTURE_MAX);
    }
    if (f.state !== 'wind' && f.state !== 'roll' && !this.ruled(f, 'noenergy')) {
      f.energy = Math.min(f.energyMax, f.energy + f.energyRegen * (f.guard ? 0.5 : 1) * DT);
    }

    switch (f.state) {
      case 'wind':
        f.windT += DT; f.st -= DT;
        if (f.st <= 0) { this.resolveAttack(f); break; }
        this.move(f, it.mx, it.my, speed * 0.3);
        return;
      case 'roll':
        f.st -= DT;
        f.x += f.rdx * P.rollSpeed * (f.rollMul || 1) * DT; f.y += f.rdy * P.rollSpeed * (f.rollMul || 1) * DT;
        if (f.st <= 0) f.state = 'idle';
        return;
      case 'stun':
        f.st -= DT;
        if (f.st <= 0) { f.state = 'idle'; f.posture = f.postureMax * 0.35; }
        return;
      case 'recover': case 'flinch': case 'recoil':
        f.st -= DT;
        if (f.st <= 0) f.state = 'idle';
        this.move(f, it.mx, it.my, speed * 0.3);
        return;
      case 'idle':
        break;
      default:
        return;
    }
    if (f.state !== 'idle') return;

    if (it.guard) {
      if (!f.guard) {
        f.guardStart = this.t - f.lastGuardPress > GUARD_REPRESS ? this.t : -9;
        f.lastGuardPress = this.t;
      }
      f.guard = true;
    } else f.guard = false;

    if (!f.guard) {
      if (it.ab1 && this.useAbility(f, 0)) return;
      if (it.ab2 && this.useAbility(f, 1)) return;
      if (it.roll && f.cds.roll <= 0 && this.spend(f, 'roll')) {
        let dx = it.mx, dy = it.my;
        if (!dx && !dy) { dx = -f.fx; dy = -f.fy; }
        const d = Math.hypot(dx, dy) || 1;
        f.rdx = dx / d; f.rdy = dy / d;
        f.state = 'roll'; f.st = P.rollTime; f.cds.roll = P.rollCd * Math.max(0.1, 1 + this.T(f, 'rollCd')); f.rollMul = 1;
        if (this.T(f, 'flashStep')) this.flashStep(f);
        if (this.T(f, 'shadowClone')) this.shadowClone(f);
        if (f === this.p) this.stats.rolls++;
        this.emit('roll', f.x, f.y);
        return;
      }
      if (it.kick && f.cds.kick <= 0 && this.spend(f, 'kick')) return this.startAttack(f, f.moves.kick);
      if (it.heavy && this.spend(f, 'heavy')) return this.startAttack(f, f.moves.heavy);
      if (it.strike && this.spend(f, 'strike')) return this.startAttack(f, f.moves.strike);
    }
    this.move(f, it.mx, it.my, speed * (f.guard ? 0.45 : 1));
  }

  // Fires a learned ability from a slot if it is off cooldown and affordable.
  useAbility(f, slot) {
    const ab = f.abilities[slot];
    if (!ab || f.abCd[slot] > 0 || !this.spend(f, this.T(f, 'abilityFree') ? 0 : ab.cost)) return false;
    f.abCd[slot] = ab.cd * Math.max(0.1, 1 + this.T(f, 'abilityCd'));
    if (f === this.p) { const u = this.stats.abilUses; u[ab.from] = (u[ab.from] || 0) + 1; }
    f.lastAbility = ab; // (the Glitch is watching)
    this.startAttack(f, ab.atk);
    return true;
  }

  // Pays a move's energy cost (by name or amount) if the fighter can afford it.
  spend(f, move) {
    const cost = typeof move === 'number' ? move : ENERGY_COST[move];
    if (this.ruled(f, 'noenergy')) return move === 'strike'; // no breath is drawn: only a plain strike, and it costs nothing
    if (f.energy < cost) return false;
    f.energy -= cost;
    return true;
  }

  move(f, mx, my, speed) {
    f.mvx = mx; f.mvy = my;
    f.x += mx * speed * DT; f.y += my * speed * DT;
  }

  startAttack(f, atk) {
    // Iaido: a strike drawn from stillness comes out faster and harder
    if (!f.isPlayer && f.def.iaido && atk.id === 'strike' && f.stillT > 0.8) {
      atk = { ...atk, wind: atk.wind * 0.5, dmg: atk.dmg * 1.4 };
      this.emit('iaido', f.x, f.y);
    }
    if (atk.id === 'strike' && this.T(f, 'swordHeart')) atk = { ...atk, wind: atk.wind * 0.7 };
    if (atk.id === 'strike' && this.T(f, 'gear2')) atk = { ...atk, wind: atk.wind * 0.75 };
    if (f.momentum && (atk.id === 'strike' || atk.id === 'heavy')) atk = { ...atk, wind: atk.wind * (1 - 0.04 * f.momentum), dmg: atk.dmg * (1 + 0.06 * f.momentum) }; // the Boxer's rhythm
    if (f.isPlayer && f.awakeT > 0 && f.tier) { // awakened: every move reaches further
      const m = 1 + f.tier / 6;
      atk = { ...atk, range: atk.range && atk.range * m, radius: atk.radius && atk.radius * m, maxRange: atk.maxRange && atk.maxRange * m };
    }
    f.state = 'wind'; f.atk = atk; f.st = atk.wind; f.windT = 0;
    if (atk.form) f.umbrella = atk.form;
    if (f === this.p) { if (atk.id === 'strike') this.stats.strikes++; else if (atk.id === 'heavy') this.stats.heavies++; else if (atk.id === 'kick') this.stats.kicks++; }
    f.guard = false;
    f.windId++;
    if (!BASE_MOVES[atk.id]) this.emit('charge', f.x, f.y, { id: atk.id, ab: atk.abilityId, fx: f.fx, fy: f.fy, hero: f.isPlayer, wind: atk.wind });
    if (atk.id === 'kick') f.cds.kick = P.kickCd;
    if (f.def && f.def.camo) f.revealT = 0.3; // firing gives him away, briefly
    if (!f.isPlayer) {
      const p = this.targetOf(f);
      if (!p) return;
      const dx = this.seenX(p) - f.x, dy = this.seenY(p) - f.y, d = Math.hypot(dx, dy) || 1;
      f.fx = dx / d; f.fy = dy / d;
      const gap = d - f.r - p.r;
      f.engaged = (atk.kind === 'melee' && gap <= atk.range * 1.3) || (atk.kind === 'slam' && d <= atk.radius * 1.3 + p.r)
        || (atk.kind === 'cone' && gap <= atk.range * 1.2);
    }
  }

  // an enemy's attack that missed the training hero counts as an evade
  countEvade(f) { if (!this.battle && !f.isPlayer && f.engaged && f.tgt === this.p) this.stats.evades++; }

  resolveAttack(f) {
    const atk = f.atk;
    f.state = 'recover'; f.st = atk.recover;
    if (!f.isPlayer && (atk.id === 'strike' || atk.id === 'heavy')) {
      if (f.def.chainP && (f.chain || 0) < (f.def.maxChain || 1) && this.rand() < f.def.chainP) {
        f.chain = (f.chain || 0) + 1; f.chainAt = this.t + Math.min(atk.recover, 0.18);
      } else f.chain = 0;
    }
    if (atk.kind !== 'melee') return this.special(f);
    let hits = 0;
    for (const t of this.victims(f)) {
      if (this.airborne(t, f)) continue;
      const dx = t.x - f.x, dy = t.y - f.y, d = Math.hypot(dx, dy) || 1;
      if (d - t.r - f.r > atk.range) continue;
      if ((dx * f.fx + dy * f.fy) / d < (f.def && f.def.cleave ? -0.3 : 0.2)) continue; // a scythe sweeps wide
      if (this.hidden(t) && this.rand() < 0.4) { this.emit('hazemiss', t.x, t.y); continue; } // swung at the shimmer
      let ux = dx / d, uy = dy / d;
      // Push Hands throws its target outward, toward the edge
      if (atk.pushOut) { const r = Math.hypot(t.x, t.y) || 1; ux = t.x / r; uy = t.y / r; }
      const res = this.receiveHit(t, f, atk, ux, uy);
      hits++;
      if (f.tal && res === 'hit' && atk.id === 'strike') this.strikeTalents(f, t, ux, uy);
      if (f.tal && res === 'hit') {
        if (atk.id === 'strike' && f.tal.asura && !t.dead) this.receiveHit(t, f, { ...atk, dmg: atk.dmg * 0.5, hitPosture: (atk.hitPosture || 0) * 0.5, kb: 10 }, ux, uy);
        if (atk.id === 'heavy' && f.tal.thunderPalm) {
          this.hazards.push({ kind: 'sigil', variant: 'goldlightning', x: t.x, y: t.y, r: 10, t: 0.25, delay: 0.25, dmg: 15, team: f.team, src: f });
        }
      }
    }
    this.emit(atk.id, f.x + f.fx * 9, f.y + f.fy * 9, { fx: f.fx, fy: f.fy, by: f.type, scale: f.fxScale || 1 });
    if (f.tal && atk.id === 'strike') this.heroStrikeProcs(f);
    if (atk.burst) {
      const b = atk.burst;
      this.hazards.push({ kind: 'sigil', variant: b.variant, x: f.x + f.fx * atk.range * 0.8, y: f.y + f.fy * atk.range * 0.8, r: b.r, t: b.delay, delay: b.delay, dmg: b.dmg,
        team: f.team, src: f, abilityId: atk.abilityId });
    }
    if (!f.isPlayer && f.def.swordQi && atk.id === 'strike') {
      const pr = this.fire(f, f.fx, f.fy, 170, 6, 'qi');
      pr.life = 0.35;
    }
    if (!hits) {
      if (f === this.p) this.stats.whiffs++;
      else this.countEvade(f);
    }
  }

  // Talents that trigger on the hero's strikes.
  heroStrikeProcs(f) {
    if (f.tal.swordHeart && (f.strikeN = (f.strikeN || 0) + 1) % 2 === 0) {
      const pr = this.fire(f, f.fx, f.fy, 220, 22, 'qi');
      pr.life = 0.6; pr.pierce = true; pr.hitPosture = 14;
    }
    if (f.tal.dragonBreath && this.rand() < 0.2) {
      this.emit('cone', f.x, f.y, { fx: f.fx, fy: f.fy, range: 28, angle: 0.7, variant: 'fire' });
      for (const v of this.victims(f)) {
        const vx = v.x - f.x, vy = v.y - f.y, vd = Math.hypot(vx, vy) || 1;
        if (vd - v.r <= 28 && (vx * f.fx + vy * f.fy) / vd > Math.cos(0.7) && !this.airborne(v)) {
          this.receiveHit(v, f, { id: 'breath', dmg: 10, kb: 40, hitPosture: 8, unblockable: true }, vx / vd, vy / vd);
        }
      }
    }
  }

  // Time Stop: everyone hostile to e freezes in place.
  stopTime(e, dur) {
    for (const f of this.hostiles(e)) {
      if (f.def && (f.def.statusImmune || f.def.timeImmune)) continue;
      if (f.adapt && this.adaptTo(f, 'timestop', 0.35) >= 1) { this.emit('adaptblock', f.x, f.y, { cat: 'timestop' }); continue; }
      f.frozenT = dur; f.guard = false;
    }
    this.timeStopT = Math.max(this.timeStopT || 0, dur); this.timeStopTint = this.tintNow || null;
    this.emit('timestop', e.x, e.y, { dur });
  }

  // Where everyone stood over the last 3 seconds, and wounds on the way from the past.
  updatePast() {
    if (this.t >= (this.trailAt || 0)) {
      this.trailAt = this.t + 0.25;
      for (const f of this.fighters()) { (f.trail = f.trail || []).push({ x: f.x, y: f.y }); if (f.trail.length > 12) f.trail.shift(); }
    }
    for (const w of this.echoes) {
      w.t -= DT;
      if (w.t > 0) continue;
      const f = w.target;
      if (f.dead) continue;
      f.lastHitBy = w.src;
      if (w.rush) { const d = Math.hypot(f.x - w.src.x, f.y - w.src.y) || 1; this.receiveHit(f, w.src, { id: 'ora', dmg: w.dmg, unblockable: true, kb: 12, hitPosture: 4 }, (f.x - w.src.x) / d, (f.y - w.src.y) / d, true); this.emit('orahit', f.x, f.y); continue; }
      this.receiveHit(f, w.src, { id: 'pastwound', dmg: w.dmg, unblockable: true, kb: 0, hitPosture: 6 }, 0, 0, true); this.emit('pastwound', f.x, f.y);
    }
    this.echoes = this.echoes.filter(w => w.t > 0);
    for (const k of this.karmas || []) {
      const v = k.target;
      if (v.dead || k.left <= 0) { k.left = 0; continue; }
      if ((k.t -= DT) > 0) continue;
      k.t = k.every; k.left--;
      v.lastHitBy = k.src;
      const dealt = this.dealDamage(v, k.dmg, k.src && k.src.isPlayer ? k.src : null, 0, 0, 0); // no guard, parry, dodge, form or resistance stands between a cause and its effect
      v.hurtT = 0.25; v.flash = 0.12;
      this.emit('karmasnap', v.x, v.y, { id: v.id, left: k.left, dmg: Math.round(dealt) });
      const src = k.src;
      if (k.heal && src && !src.dead && src.hp < src.maxHp) { const n = Math.round(src.maxHp * k.heal); src.hp = Math.min(src.maxHp, src.hp + n); this.emit('heal', src.x, src.y, { n }); } // the effect lands on them; its cause returns to him
    }
    if (this.karmas) this.karmas = this.karmas.filter(k => k.left > 0);
  }

  // Strike a foe's younger self where it stood 3s ago; the wound reaches the present a moment later.
  pastEcho(e, f, dmg) {
    const past = f.trail && f.trail[0];
    if (!past || f.dead) return;
    this.emit('pastecho', past.x, past.y, { sprite: f.isPlayer ? 'hero' : spriteOfDef(f), flip: f.fx < 0 });
    this.echoes.push({ t: 0.9, target: f, src: e, dmg });
  }

  // Pull a foe back to where it stood 3s ago.
  rewindFoe(f) {
    const past = f.trail && f.trail[0];
    if (!past || f.dead || (f.def && (f.def.statusImmune || f.def.timeImmune))) return;
    this.emit('rewindfoe', f.x, f.y, { tx: past.x, ty: past.y });
    f.x = past.x; f.y = past.y; f.kvx = f.kvy = 0; f.trail = [];
  }

  // The future self pulls a one-time weapon out of nowhere.
  drawWeapon(e) {
    if (!e.arsenal) e.arsenal = FUTURE_ARSENAL.slice();
    if (!e.arsenal.length) return null;
    const w = e.arsenal.splice(Math.floor(this.rand() * e.arsenal.length), 1)[0];
    this.emit('arsenal', e.x, e.y, { name: w.weapon });
    return { ...w, energy: 0, abilityId: null };
  }

  // ???'s last gamble: a new ordinary skill every 0.1s for 2s, then she falls.
  gamblePool() {
    if (!this.constructor.GAMBLE) {
      const bad = new Set(['dash', 'ride', 'bats', 'reform', 'bigStrike', 'swordform']); // steps that need her to be mid-ultimate
      const ults = BOSSES.filter(b => !ENEMY_TYPES[b].multicast).map(b => ENEMY_TYPES[b].ult).filter(u => u && !u.steps.some(s => bad.has(s[1])));
      const skills = multicastPool(false).concat(multicastPool(true)).filter(s => !['rct', 'gojotp', 'silkflight'].includes(s.kind));
      this.constructor.GAMBLE = { ults, skills };
    }
    return this.constructor.GAMBLE;
  }

  updateGamble(e) {
    const p = this.targetOf(e) || { x: 0, y: 0, fx: 1, fy: 0, r: 0, team: -1 };
    if (p.id) { const d = Math.hypot(p.x - e.x, p.y - e.y) || 1; e.fx = (p.x - e.x) / d; e.fy = (p.y - e.y) / d; }
    e.gambleT -= DT; e.gambleNext -= DT;
    if (e.gambleT > 0 && e.gambleNext <= 0) {
      e.gambleNext = 0.1;
      const { skills } = this.gamblePool();
      const s = skills[Math.floor(this.rand() * skills.length)], keep = e.atk; // ordinary skills only, never ultimates or dashes
      e.atk = { ...s, energy: 0, hits: 1 };
      this.special(e);
      e.atk = keep;
      this.emit('gamblecast', e.x, e.y, { name: s.id });
    }
    for (const r of e.runners) { // every ultimate she threw keeps playing out
      r.t += DT;
      while (r.idx < r.u.steps.length && r.t >= r.u.steps[r.idx][0]) { const [, kind, o] = r.u.steps[r.idx++]; this.ultStep(e, kind, o, p); }
    }
    e.runners = e.runners.filter(r => r.t < r.u.dur);
    e.state = 'gamble';
    if (e.gambleT <= 0 && (!e.runners.length || e.gambleT < -3)) { e.lastStand = false; e.hp = 0; } // the gamble is spent
  }

  // ???: pick any skill that fits the distance, roll a die for how many copies.
  rollMulticast(e, d, gap) {
    const fits = multicastPool(e.phase === 2).filter(s =>
      s.kind === 'slam' ? d < s.radius * 0.9 + 4 : s.kind === 'cone' ? gap < s.range * 0.8 : s.kind === 'summon' || s.kind === 'timestop' || s.kind === 'cosmiceye' ? true
        : d < (s.maxRange || 999) && gap > (s.minRange || 0) * 0.5);
    if (!fits.length) return null;
    const s = fits[Math.floor(this.rand() * fits.length)];
    const n = e.phase === 2 ? 4 + Math.floor(this.rand() * 3) : 1 + Math.floor(this.rand() * 6);
    this.emit('dice', e.x, e.y, { n, skill: s.id });
    return { ...s, energy: 0, multi: n, hits: 1, wind: Math.max(0.2, (s.wind || 0.4) * (e.phase === 2 ? 0.7 : 1)), recover: Math.min(s.recover || 0.4, 0.5) };
  }

  // Rift: a random foe from anywhere steps through to help.
  openRift(e) {
    const a = this.rand() * Math.PI * 2;
    const [x, y] = [e.x + Math.cos(a) * 18, e.y + Math.sin(a) * 18].map(v => v);
    const r = Math.hypot(x, y), k = r > R - 10 ? (R - 10) / r : 1;
    const m = this.spawnMinion(ROSTER[Math.floor(this.rand() * ROSTER.length)], x * k, y * k, e);
    if (m) this.emit('rift', m.x, m.y);
    return m;
  }

  // Rewind: back to where it stood, and how healthy it was, a few seconds ago.
  rewind(e) {
    const old = e.hist && e.hist[0];
    if (!old) return;
    this.emit('rewind', e.x, e.y, { tx: old.x, ty: old.y, gain: Math.max(0, Math.round(old.hp - e.hp)) });
    e.hp = Math.max(e.hp, old.hp); e.x = old.x; e.y = old.y; e.posture = 0; e.kvx = e.kvy = 0;
    e.hist = [];
  }

  // ???'s Unstoppable: half the time, a stun, root, scare or interrupt just doesn't take.
  resists(t) {
    if (!(t.def && t.def.unstoppable) || this.rand() >= (t.phase === 2 && t.def.resist2 ? t.def.resist2 : 0.5)) return false;
    this.emit('resist', t.x, t.y);
    return true;
  }

  // Heat Haze: a half-invisible fighter is seen a little off from where it really is, until it shows itself.
  hidden(f) { return !!(f && f.def && f.def.camo && !(f.revealT > 0)); }
  seenX(f) { return this.hidden(f) ? f.x + (f.camoOx || 0) : f.x; }
  seenY(f) { return this.hidden(f) ? f.y + (f.camoOy || 0) : f.y; }

  // Gojo's Infinity holds unless he's mid-technique, recovering, stunned or burnt out.
  infinityUp(t) {
    return !(t.burnoutT > 0) && !['wind', 'act', 'recover', 'stun', 'ult', 'spawn', 'flinch'].includes(t.state);
  }

  // The heart of the duel: guard, parry, guard break, posture and combos.
  receiveHit(t, a, atk, ux, uy, proj) {
    const st = this.stats, me = t === this.p && !this.battle;
    const by = a || atk.src || null;
    const piercing = (by && by.def && by.def.pierceIframes) || atk.pierceAll; // Severing the Heavens cuts through everything
    if (t.inkShieldT > 0 && !t.dead) { this.emit('inkblock', t.x, t.y); if (a && !proj && a.state !== 'ult' && a.state !== 'heroult') { a.state = 'recoil'; a.st = 0.3; } return 'block'; }
    if (atk.pierceAll && !(by && by.teacher) && !t.dead && !t.lastStand) return this.trueHit(t, by, atk, ux, uy); // (a teacher's cuts can be read and answered)
    if (t.dead || t.invulnT > 0 || t.lastStand || (!piercing && (t.state === 'transform' || t.state === 'morph' || t.batForm || t.climbing))) return 'immune';
    if (t.def && t.def.camo) t.revealT = Math.max(t.revealT || 0, 0.3); // a hit makes him flicker into view
    // Still Water's stance: blows are caught and stored for the answer
    if (t.stanceT > 0 && t.state === 'heroult') { t.stored = (t.stored || 0) + (atk.dmg || 0); this.emit('stanceblock', t.x, t.y); return 'ward'; }
    // Phase Shield: soaks blows until it breaks
    if (t.shieldHp > 0 && !piercing) {
      t.shieldHp -= atk.dmg || 0;
      this.emit(t.shieldHp > 0 ? 'shieldhit' : 'shieldbreak', t.x, t.y);
      if (t.shieldHp <= 0) { t.shieldHp = 0; t.shieldT = 0; }
      return 'ward';
    }
    // Infinity: the blow slows to nothing just short of him (unless Mahoraga has adapted to it)
    if (!piercing && t.def && t.def.infinity && this.infinityUp(t) && !(by && by.adapt && this.adaptTo(by, 'infinity', 0.2) >= 1)) {
      t.strain = (t.strain || 0) + Math.max(4, atk.dmg || 0);
      if (t.strain >= t.def.strainMax * (t.honored ? 2 : 1)) { t.burnoutT = 3; t.strain = 0; this.emit('burnout', t.x, t.y); }
      else this.emit('infinity', t.x, t.y, { ox: by ? by.x : t.x + ux * -10, oy: by ? by.y : t.y + uy * -10 });
      return 'infinity';
    }
    // Void Walker: phase out for a moment, so a whole flurry passes through
    if (!piercing && this.T(t, 'voidWalk')) {
      if (this.t < (t.voidUntil || 0)) return 'ward';
      if (this.t >= (t.voidAt || 0)) {
        t.voidUntil = this.t + 0.8; t.voidAt = this.t + 4;
        this.emit('ward', t.x, t.y);
        return 'ward';
      }
    }
    // Phase: the Time Administrator flickers out of the moment the blow lands
    if (!piercing && t.def && t.def.phasing && t.state !== 'stun' && t.state !== 'ult' && this.rand() < (t.phase === 2 && t.def.phasing2 ? t.def.phasing2 : t.def.phasing)) {
      this.emit('phased', t.x, t.y);
      return 'ward';
    }
    // Ward: a talisman eats the first hit every 8 seconds
    if (!piercing && t.def && t.def.ward && this.t >= t.wardAt) {
      t.wardAt = this.t + 8;
      this.emit('ward', t.x, t.y);
      return 'ward';
    }
    // Now You See Me: the Magician was never there, only a decoy
    if (!piercing && t.def && t.def.substitute && !t.trueFormed && this.t >= (t.subAt || 0) && t.state !== 'stun') {
      t.subAt = this.t + 7;
      this.substitute(t);
      return 'ward';
    }
    // the Monkey King's spinning staff: shots that reach it go back where they came from
    if (proj && t.spinGuardT > 0 && !atk.unblockable && !piercing) { this.emit('deflect', t.x, t.y); return 'parry'; }
    // Mikiri: the Blind Gentleman reads swarms and flurries before they land
    const many = (by && by.summoner != null) || atk.multiHit || atk.multi > 1 || atk.copy || atk.id === 'ora' || atk.hits > 1 || atk.volley;
    if (!piercing && t.def && t.def.mikiri && many && t.state !== 'stun' && t.state !== 'ult' && this.rand() < (t.phase === 2 ? 0.65 : 0.5)) {
      this.gainFocus(t, 'parry'); this.emit('mikiri', t.x, t.y);
      if (proj) return 'parry';
      if (a && a.state !== 'ult' && a.state !== 'heroult' && !(a.def && a.def.statusImmune)) { a.state = 'recoil'; a.st = 0.25; a.chainAt = 0; }
      return 'miss';
    }
    // Observation Haki: you saw it coming
    if (!piercing && this.T(t, 'observation') && t.state !== 'stun' && this.rand() < 0.2) { this.emit('foreseen', t.x, t.y); return 'miss'; }
    // Sway: the Drunken Master lurches out of some strikes
    if (t.def && t.def.sway && atk.id === 'strike' && t.state !== 'stun' && this.rand() < 0.3) {
      this.emit('sway', t.x, t.y);
      return 'miss';
    }
    const guarding = t.guard && t.state === 'idle';
    if (guarding && !atk.unblockable && !atk.ignoresGuard && !this.ruled(t, 'noblock')) {
      if (this.t - t.guardStart <= PARRY_WIN * (1 + this.T(t, 'parryWin'))) {
        if (t.def && t.def.focusGain) this.gainFocus(t, 'parry');
        t.posture = Math.max(0, t.posture - 15);
        t.energy = Math.min(t.energyMax, t.energy + PARRY_ENERGY);
        t.plan = null;
        this.emit('parry', t.x, t.y, { hero: t === this.p });
        if (me) st.parries++;
        if (a && !proj) {
          a.chainAt = 0; a.chain = 0; // a parry breaks the string
          this.addPosture(a, (atk.parryPosture || 20) + (t.def && t.def.redirect ? 25 : 0));
          this.dealDamage(a, 3, t, 0, 0, 0);
          if (a.state !== 'stun' && !(a.def && a.def.statusImmune) && !this.resists(a)) { a.state = 'recoil'; a.st = 0.3; }
        }
        if (!t.isPlayer && t.def.riposte) { t.counterAt = this.t + 0.02; t.counterFast = true; }
        if (this.T(t, 'riposte')) t.riposteUntil = this.t + 1;
        if (a && this.T(t, 'sharingan') && !(a.def && a.def.statusImmune)) { a.slowT = Math.max(a.slowT || 0, 1.5); this.emit('sharingan', a.x, a.y); }
        return 'parry';
      }
      if (!atk.breaksGuard) {
        if (t.plan) t.plan.hit = true;
        if (me) st.blocks++;
        this.emit('block', t.x, t.y);
        this.addPosture(t, (atk.blockPosture || 8) * (1 + this.T(t, 'blockPosture')) * (1 + this.T(a, 'postureDmg')) * (this.T(a, 'armament') ? 1.5 : 1));
        if (!t.unity && !(t.def && t.def.statusImmune)) { t.kvx += ux * 20 / t.mass; t.kvy += uy * 20 / t.mass; }
        if (!t.isPlayer && t.def.counterOnBlock && !t.counterAt) t.counterAt = this.t + 0.2;
        return 'block';
      }
      t.guard = false;
      if (t.plan) t.plan.hit = true;
      this.emit('guardbreak', t.x, t.y);
      this.addPosture(t, 15);
    }

    // Adaptation: Mahoraga sends back what it has adapted to, and answers blows it knows
    const cat = t.adapt ? this.adaptCat(atk, proj) : null;
    if (cat && (t.adapt[cat] || 0) >= 1 && t.state !== 'stun' && this.rand() < 0.6) {
      this.emit('adaptblock', t.x, t.y, { cat });
      if (proj) return 'parry';
      if (a) { t.counterAt = this.t + 0.05; t.counterFast = true; }
    }
    // clean hit
    let mult = 1;
    if (a) {
      a.combo = this.t - a.lastHitT < COMBO_GAP ? a.combo + 1 : 1;
      a.lastHitT = this.t;
      mult = this.comboMult(a);
      if (a.def && a.def.bloodrage) mult *= 1 + 0.6 * (1 - a.hp / a.maxHp);
    }
    if (t.state === 'stun') mult *= STUN_DMG;
    if (a && a.dmgMul) mult *= a.dmgMul;            // second-form bosses hit harder
    if (a && a.tuneDmg) mult *= a.tuneDmg;          // tuned for its world in the campaign
    if (t.state === 'ult') mult *= t.ult && t.ult.dr != null ? 1 - t.ult.dr : 0.5; // and shrug off half during an ultimate
    if (((by && by.state === 'heroult') || atk.fromSpecial) && t.def && t.def.boss) mult *= 0.6; // bosses stand up to the fighter's special (and what it leaves behind)
    if (t.state === 'heroult') mult *= t.special && (t.special.stage || 1) >= 2 && ['tough', 'berserk'].some(k => (t.special.mods || []).includes(k)) ? 0.25 : 0.5; // the fighter's own special
    if (t.mobileUlt) mult *= 1 - (t.mobileUlt.u.dr || 0);
    if (t.def && t.def.scales && atk.id === 'strike') mult *= 0.5;
    if (t.def && t.def.goldenBody && t.stage === 3) mult *= atk.id === 'strike' ? 0.6 : atk.id === 'heavy' ? 0.75 : 1; // the true body: strikes barely scratch it
    if (t.pearlOpenFrom && this.t >= t.pearlOpenFrom && this.t < t.pearlOpenFrom + 3) mult *= 1.5;                     // ...but the pearl dims after it spends itself
    if (t.def && t.def.resistProj && proj) mult *= t.def.resistProj;
    if (t.past) mult *= 0.5; // the past self is hard to change
    if (t.def && t.def.mystery && !t.lastStand) mult *= 1 - 0.9 * Math.max(0, 1 - t.hp / t.maxHp); // ???: the closer to the end, the less gets through (up to 90%)
    if (by && by.def && by.def.dmgScale) mult *= by.phase === 2 && by.def.dmgScale2 ? by.def.dmgScale2 : by.def.dmgScale; // ???'s attacks are toned down (less so in her second form)
    if (t.unity) mult *= 0.6;                         // man and sword as one
    let body = this.bodyMult(t, atk);                 // shells, stone, armor, arrays
    if (body < 1 && this.T(by, 'armament')) body = 1 - (1 - body) * 0.5; // Armament Haki: through half of it
    mult *= body;
    if (atk.unblockable && this.T(t, 'spiderSense')) mult *= 0.6;
    if (by && by.berserkT > 0) mult *= 1.6;
    if (by && by.worldT > 0) mult *= 1.6; // The World: every blow in stopped time lands at once, and harder
    if (by && this.T(by, 'kaioken') && by.hp > by.maxHp * 0.3) mult *= 1.4;
    if (by && this.T(by, 'ripple') && t.def && isUndead(t)) mult *= 1.25;
    if (by && by.def && by.def.nemesis && (isUndead(t) || isStrange(t))) mult *= by.def.nemesis[(by.stage || by.phase || 1) >= 3 ? 2 : (by.stage || by.phase) >= 2 ? 1 : 0]; // the bane of the unclean
    if (t.wetT > 0 && atk.lightning) mult *= 1.3; // water carries the thunder
    if (t.wetT > 0 && atk.fire) mult *= 0.7;      // and dulls the fire
    if (t.pressureT > 0) { mult *= 1 + t.pressure.def; }                                      // a dragon's majesty: guard comes down
    if (by && by.pressureT > 0 && by.pressureBy === t) mult *= 1 - by.pressure.dmg;            // and hands shake before him
    if (a && atk.id === 'heavy' && this.T(a, 'onePunch') && (a.heavyLands = (a.heavyLands || 0) + 1) % 5 === 0) { mult *= 5; this.emit('seriouspunch', t.x, t.y); }
    if (cat) mult *= 1 - 0.75 * Math.min(1, t.adapt[cat] || 0) - (t.adaptAll || 0);
    if (t.def && t.def.fireImmune && (atk.fire || atk.burn || atk.variant === 'fire' || atk.id === 'breath' || atk.id === 'spray')) { mult = 0; this.emit('fireproof', t.x, t.y); }
    if (by && by.kingWeakened) mult *= 0.5;           // the swarm withers before the King in Yellow
    if (t.kingWeakened) mult *= 1.5;
    if (by && by.focus) mult *= 1 + 0.04 * by.focus;  // the Blind Gentleman's clear mind
    if (by && by.form && by.formDmg) mult *= by.formDmg; // the Shapeshifter's beasts hit harder
    if (by && by.cloneDmg) mult *= by.cloneDmg;        // a hair clone's blows (and everything it casts) are only 25% as strong
    if (((by && by.def && by.def.trueDamage) || atk.trueDmg) && !(by && by.teacher)) // a teacher's swords are only demonstrations
      mult = this.trueMult(t, by); // true damage: nothing on the target's side softens it
    if (by && by.def && by.def.phoenix) mult *= 1 + (by.heat || 0) / 200; // the Phoenix burns hotter
    if (a && a.tal) {
      const T = k => a.tal[k] || 0;
      mult *= 1 + T('allDmg') + (atk.id === 'strike' ? T('strikeDmg') : 0) + (atk.id === 'heavy' ? T('heavyDmg') : 0) + (a.hp < a.maxHp * 0.4 ? T('lowHpDmg') : 0);
      if (a.riposteUntil > this.t) { mult *= 2; a.riposteUntil = 0; this.emit('iaido', a.x, a.y); }
    }
    mult *= Math.max(0.1, 1 + this.T(t, 'dmgTaken'));
    if (this.ruled(t, 'exposed')) mult = Math.max(mult, this.trueMult(t, by)); // nothing shields the flesh: whatever would soften the blow doesn't
    if (by) t.lastHitBy = by;
    const kbOut = by && by.def && by.def.kbOut != null ? by.def.kbOut : 1; // some fighters push less
    const dealt = this.dealDamage(t, (atk.dmg || 0) * mult + (atk.maxHpPct ? t.maxHp * atk.maxHpPct : 0), a, ux, uy, (atk.kb || 0) * kbOut);
    if (cat && dealt > 0) this.adaptTo(t, cat, 0.1 + dealt / t.maxHp);
    if (t.def && t.def.scholar && t.phase === 2 && by && by.team !== t.team) this.recordTechnique(t, atk);
    if (a && dealt > 0 && a.def && a.def.focusGain && this.t - (a.lastDefT || -9) < 0.9) this.gainFocus(a, 'counter');
    if (by && by.isPlayer && by.state === 'heroult' && by.team !== t.team) {
      by.ultDmg = (by.ultDmg || 0) + dealt;
      if (by.special && (by.special.stage || 1) >= 2 && (by.special.mods || []).includes('lifesteal')) by.hp = Math.min(by.maxHp, by.hp + dealt * 0.3);
      if (by.special && (by.special.stage || 1) >= 2 && (by.special.mods || []).includes('berserk')) by.hp = Math.min(by.maxHp, by.hp + dealt * 0.5);
    }
    if (by && by.isPlayer && by.awaken && by.team !== t.team) { if (!(by.awakeT > 0)) by.awakenGauge += dealt * 1.0; if (by.special && by.state !== 'heroult') by.ultGauge += dealt * (by.awakeT > 0 ? 0.9 : 0.5); }
    if (t.isPlayer && t.awaken && !(t.awakeT > 0)) t.awakenGauge += dealt * 0.8;
    if (by) by.dmgOut += dealt;
    this.addPosture(t, (atk.hitPosture || 0) * (1 + this.T(a, 'postureDmg') + (atk.id === 'kick' ? this.T(a, 'kickPosture') : 0)) * (atk.id === 'kick' && t.def && t.def.kickImmune ? 0 : 1));
    // Thorns: melee attackers feel some of it too
    if (a && !proj && dealt > 0 && this.T(t, 'thorns')) { a.lastHitBy = t; this.dealDamage(a, dealt * this.T(t, 'thorns'), t, 0, 0, 0); }
    if (a && dealt > 0) {
      if (a.def && a.def.momentum) this.gainMomentum(a);
      if (a.def && a.def.phoenix) a.heat = Math.min(100, (a.heat || 0) + 3);
      const heal = (a.def && a.def.lifesteal ? dealt * (a.frenzyT > 0 ? 1 : 0.5) : 0) + (a.def && a.def.regen ? 4 : 0) + (atk.heal || 0) + (atk.lifesteal ? dealt * 0.5 : 0) + (a.def && a.def.soulHarvest ? 3 : 0)
        + dealt * this.T(a, 'lifesteal');
      if (heal) { a.hp = Math.min(a.maxHp, a.hp + heal); this.emit('heal', a.x, a.y, { n: Math.round(heal) }); }
    }
    const abId = atk.abilityId || (a && a.ally ? a.abilityId : null); // a summoned beast's hits count for the ability that called it
    if (abId && !this.battle && !this.friendlyToHero(t)) this.stats.abilDmg[abId] = (this.stats.abilDmg[abId] || 0) + dealt;
    if (atk.id && !BASE_MOVES[atk.id]) this.emit('impact', t.x, t.y, { id: atk.id });
    if (atk.root && !(t.def && t.def.statusImmune) && !this.resists(t)) t.rootT = Math.max(t.rootT, atk.root);
    if (t.maskHp > 0 && a && (atk.id === 'heavy' || atk.id === 'kick') && --t.maskHp === 0) { t.postureMul = 1.1; this.emit('maskbreak', t.x, t.y); } // the Pallid Knight's mask cracks off
    this.applyStatus(t, atk, by);
    if (a && dealt > 0 && atk.id === 'strike' && this.T(a, 'venomStrike')) this.applyStatus(t, { poison: 4, poisonT: 3 }, a); // the serpent's fangs
    if (t.heads && dealt > 0) this.hydraWound(t, atk, dealt);
    // Acid Blood: strike a mutant up close and it splashes
    if (a && !proj && dealt > 0 && t.mutations && t.mutations.includes('acid') && this.rand() < 0.4) this.addZone(t, t.team, t.x, t.y, { variant: 'acid', r: 10, life: 2.5, dps: 3 });
    const d = t.def;
    const noFlinch = !this.ruled(t, 'exposed') && ((t.atk && t.atk.steadfast && (t.state === 'wind' || t.state === 'act')) || t.unity || t.giant || t.armorT > 0 || this.T(t, 'unflinching') > 0 || (d && (d.noFlinch || (d.bloodrage && t.hp < t.maxHp / 2) || (d.plating && atk.id === 'strike'))));
    if (t.state === 'wind' && !noFlinch && !atk.noInterrupt && (this.ruled(t, 'exposed') || !this.resists(t))) {
      t.state = 'flinch'; t.st = atk.flinch || 0.25;
      this.emit('interrupt', t.x, t.y);
    }
    return 'hit';
  }

  dealDamage(t, dmg, a, ux, uy, kb) {
    if (dmg <= 0 || t.yieldT > 0) return 0; // (a teacher who has yielded is past being struck)
    if (t.def && t.def.conceptual) dmg = 1; // untouchable on a conceptual level: whatever it was, it was one
    if (t.teacher && !t.yielded && t.hp - dmg <= t.maxHp * 0.1) { // the teacher yields: the lesson is over (see updateYield)
      t.yielded = true; t.yieldT = YIELD_T; dmg = Math.max(0, t.hp - t.maxHp * 0.1);
      t.state = 'idle'; t.atk = null; t.ult = null; t.invulnT = YIELD_T + 1;
      this.hazards = this.hazards.filter(h => h.src !== t); this.proj = this.proj.filter(pr => pr.src !== t); // every sword he had drawn is put away
      if (this.holdYield) this.yieldScene = t; // a watched fight stops here for his last draw (a cutscene); see updateYield
      else this.emit('teacheryield', t.x, t.y);
    }
    if (t.def && t.def.manual && t.phase === 2 && !t.manualDone && !t.teacher && t.hp - dmg < 1) { // the manual is not finished: he will not fall until the Thirteenth Sword is drawn
      dmg = Math.max(0, t.hp - 1);
      if (!t.deathBound) { t.deathBound = true; this.emit('deathbound', t.x, t.y); }
    }
    const bound = t.def && t.def.broodBound && this.enemies.some(m => m.summoner === t.id && !m.dead && !m.def.inferior && !m.spilled); // the frantic spill can't hold her up
    if (bound && t.hp - dmg < 1) { if (!t.broodSpent) this.emit('broodshield', t.x, t.y); t.broodSpent = true; } // the swarm will not let her die, but she has nothing left to give it
    dmg = Math.min(dmg, t.berserkT > 0 || bound ? Math.max(0, t.hp - 1) : t.hp); // the armor won't let you die
    const floor = this.phaseFloor(t); // a gated boss shows every form: no blow carries it past its next threshold
    if (floor) dmg = Math.min(dmg, Math.max(0, t.hp - floor));
    t.hp -= dmg;
    if (t === this.p && t.hp > 0 && t.hp < t.maxHp * 0.05) this.stats.belowFive = true;
    t.dmgIn += dmg;
    t.combo = 0;
    t.lastHurtT = this.t;
    t.flash = 0.12; t.hurtT = 0.25;
    const kbm = this.T(t, 'juggernaut') ? 0 : t.isPlayer ? 0.6 : t.def.floating || t.unity ? 0 : 1;
    const k0 = Math.hypot(t.kvx, t.kvy), add = kb * kbm / t.mass;
    t.kvx += ux * add; t.kvy += uy * add;
    const src = t.lastHitBy, k1 = Math.hypot(t.kvx, t.kvy), cap = Math.max(k0, add) * 1.1;
    if (src && src.summoner != null && k1 > cap) { t.kvx *= cap / k1; t.kvy *= cap / k1; } // a crowd of summons can't juggle someone off the stage
    if (t === this.p) {
      if (!this.battle) this.stats.dmgTaken += dmg;
      this.emit('hurt', t.x, t.y, { dmg: Math.round(dmg) });
    } else {
      if (!this.battle && !this.friendlyToHero(t)) this.stats.dmgDealt += dmg;
      this.emit('hit', t.x, t.y, { dmg: Math.round(dmg), crit: t.state === 'stun', combo: a && a === this.p ? a.combo : 0 });
    }
    return dmg;
  }

  addPosture(t, amount) {
    if ((t.def && t.def.statusImmune) || t.state === 'stun' || t.state === 'egg' || amount <= 0 || (t.state === 'ult' && t.ult && t.ult.unbreakable) || (t.atk && t.atk.steadfast && (t.state === 'wind' || t.state === 'act'))) return;
    if (t.stone) amount *= 1 - 0.12 * t.stone;  // stoneskin
    if (t.armorT > 0) amount *= 0.5;            // super armor
    t.posture += amount * t.postureMul;
    if (t.posture >= t.postureMax) {
      if (this.resists(t)) { t.posture = 0; return; }
      t.posture = t.postureMax;
      t.state = 'stun'; t.st = STUN_TIME; t.guard = false;
      if (!this.battle) { if (t === this.p) this.stats.stunned++; else if (!this.friendlyToHero(t)) this.stats.postureBreaks++; }
      this.emit('postureBreak', t.x, t.y, { hero: t === this.p });
    }
  }

  // Moves an entity by its knockback and keeps it on the stage. Returns true if it fell off.
  // Only a shove faster than slideMin can carry someone over the edge; flyers never fall.
  applyKnockback(e, slideMin = 40) {
    if (e.def && e.def.floating) { e.kvx = e.kvy = 0; }
    if (e.def && e.def.boss) slideMin = Infinity; // bosses dig in at the edge
    e.x += e.kvx * DT; e.y += e.kvy * DT;
    e.kvx *= KB_DECAY; e.kvy *= KB_DECAY;
    const d = Math.hypot(e.x, e.y);
    const sliding = Math.hypot(e.kvx, e.kvy) > slideMin;
    if (sliding) return d > R + 2;
    const max = R - e.r;
    if (d > max) { e.x *= max / d; e.y *= max / d; }
    return false;
  }

  finish(result) {
    this.done = true;
    this.stats.result = result;
    this.stats.time = this.t;
    this.stats.passed = !!(this.sc.pass && this.sc.pass(this.stats));
  }

  claimSummon(m) {
    // Stable precedence prevents opposing Kings from converting a summon every frame.
    const king = this.enemies.find(e => e.def.yellowKing && !e.dead && e.hp > 0);
    if (m.def && m.def.zerg) { m.kingWeakened = !!(king && king.team !== m.team); return; } // the swarm won't kneel, but it withers
    if (!king || m.courtClaimed || m.fateBound || (m.def && m.def.noClaim)) return;
    m.courtClaimed = king.id; m.team = king.team; m.summoner = king.id;
    m.ally = this.p ? m.team === this.p.team : false; m.tgt = null; m.plan = null;
    for (const pr of this.proj) if (pr.src === m) pr.team = m.team;
    for (const h of this.hazards) if (h.src === m) h.team = m.team;
  }

  inflictFear(v, e, duration) {
    if ((v.def && v.def.statusImmune) || v.state === 'egg' || (v.state === 'ult' && v.ult && v.ult.unbreakable) || this.resists(v)) return;
    v.fearT = Math.max(v.fearT || 0, duration); v.fearSource = e;
    v.state = 'idle'; v.guard = false; v.chainAt = 0; v.batForm = v.swordForm = false;
  }

  cosmicHit(e, v, dmg) {
    return this.receiveHit(v, e, { dmg, unblockable: true }, 0, 0, true);
  }

  silkFlight(e, target) {
    if (e.dead || e.hp <= 0) return;
    const x = e.x, y = e.y, a = this.rand() * Math.PI * 2;
    e.x = target.x + Math.cos(a) * 30; e.y = target.y + Math.sin(a) * 30;
    this.applyKnockback(e);
    const heal = Math.min(e.maxHp - e.hp, e.maxHp * 0.04);
    e.hp += heal;
    e.silkUntil = this.t + 0.45;
    if (heal > 0) this.emit('heal', e.x, e.y, { n: Math.round(heal) });
    this.cosmicFields.push({ kind: 'clone', owner: e, x, y, tx: e.x, ty: e.y, age: 0, life: 2, sprite: e.phase === 2 ? e.def.sprite2 : e.def.sprite });
    this.emit('silkflight', x, y);
  }

  updateYellowCourt() {
    for (const e of this.enemies) {
      if (!e.def.yellowKing || !this.active(e) || e.hp <= 0 || e.phase !== 2) continue;
      if (this.t >= (e.cosmicAt || 0)) {
        e.cosmicAt = this.t + 1;
        for (const v of this.hostiles(e)) this.cosmicHit(e, v, v.maxHp * 0.0075);
      }
    }
    for (const h of this.cosmicFields) {
      const e = h.owner;
      if (e.dead || e.hp <= 0) { h.life = 0; continue; }
      h.age += DT; h.life -= DT;
      if (h.kind === 'stars') {
        h.stars = blackStarPositions(h.age);
        for (const v of h.age < BLACK_STAR_MERGE ? this.hostiles(e) : []) {
          const star = this.nearestTo(h.stars, v.x, v.y);
          const dx = star.x - v.x, dy = star.y - v.y, d = Math.hypot(dx, dy) || 1;
          if (!(v.def && v.def.statusImmune)) this.move(v, dx / d, dy / d, 12);
        }
        if (h.age >= BLACK_STAR_MERGE && !h.hit) {
          h.hit = true;
          for (const v of this.hostiles(e)) if (Math.hypot(v.x, v.y) <= BLACK_STAR_BLAST_RADIUS + v.r) this.cosmicHit(e, v, 42 + v.maxHp * 0.08);
          this.emit('ultburst', 0, 0, { color: '#d9c8ff', cosmic: true });
        }
      }
      if (h.kind === 'clone' && h.life <= 0) {
        for (const v of this.hostiles(e)) if (Math.hypot(v.x - h.x, v.y - h.y) < 28 + v.r) { this.cosmicHit(e, v, 16); this.inflictFear(v, e, 0.8); }
        this.cosmicFields.push({ kind: 'dust', owner: e, x: h.x, y: h.y, age: 0, life: 0.6 });
        this.emit('silkflight', h.x, h.y, { dust: true });
      }
      if (h.kind === 'galaxy' && h.age >= 2.5 && !h.hit) {
        h.hit = true;
        for (const v of this.hostiles(e)) this.cosmicHit(e, v, 24 + v.maxHp * 0.10);
        this.emit('ultburst', 0, 0, { color: '#fff23c', cosmic: true });
      }
    }
    this.cosmicFields = this.cosmicFields.filter(h => h.life > 0);
  }

  // ---------- enemies ----------

  spawnEnemy(type, x, y, team = 1) {
    const e = this.makeFighter(type, x, y, team);
    if (e.def.boss) { e.maxHp = e.hp = Math.round(e.def.hp * 0.85); e.dmgMul = 0.85; } // the first form holds back
    if (e.def.tal) e.tal = { ...e.def.tal };
    e.strafe = this.rand() < 0.5 ? 1 : -1;
    e.cds.ai = 0.5 + this.rand() * 0.8;
    for (const s of e.specials) e.cds[s.id] = s.kind === 'summon' ? 5 : 0.6 + this.rand() * 1.2;
    if (e.def.hydra) e.heads = Array.from({ length: e.def.hydra.heads }, (_, i) => this.newHead(i));
    if (e.def.mutates) e.mutations = [];
    if (e.def.adapts) { e.adapt = {}; e.wheel = 0; }
    if (e.def.broodOnSpawn) e.def.broodOnSpawn.forEach((k, i) => { // she never arrives alone
      const a = i / e.def.broodOnSpawn.length * Math.PI * 2, rr = Math.hypot(x, y), m = this.spawnMinion(k, x * Math.min(1, (R - 14) / (rr || 1)) + Math.cos(a) * 16, y * Math.min(1, (R - 14) / (rr || 1)) + Math.sin(a) * 16, e);
      if (m) m.st = 0.6;
    });
    if (e.def.focusGain) e.focus = 0;
    if (e.def.masked) e.maskHp = e.def.masked;
    this.enemies.push(e);
    this.emit('spawn', x, y);
    return e;
  }

  // Campaign tuning: health and damage scaled for a foe's place in the jar (kept through a boss's second form).
  tune(e, w) {
    if (w.hp && w.hp !== 1) { e.maxHp = e.hp = Math.max(1, Math.round(e.maxHp * w.hp)); if (e.baseMaxHp) e.baseMaxHp = e.maxHp; }
    if (w.dmg && w.dmg !== 1) e.tuneDmg = w.dmg;
    if (w.elite) e.elite = true;
    if (w.teacher && e.def.manual) this.makeTeacher(e);
    if (w.finalKeeper && e.type === 'timeadmin') this.makeFinalKeeper(e);
    if (w.modifier === 'shielded') { e.maxHp = Math.round(e.maxHp * 1.25); e.hp = e.maxHp; }
    if (w.modifier === 'swift') e.speedMul *= 1.2;
    if (w.modifier === 'vampiric') e.def = { ...e.def, lifesteal: true };
    if (w.modifier === 'explosive') e.def = { ...e.def, volatile: true };

  }

  // A separate reconstruction for the Bottom of the Jar. Never changes the shared enemy definition.
  makeFinalKeeper(e) {
    const base = e.def;
    e.finalKeeper = true;
    e.maxHp = e.hp = Math.round(e.maxHp * 1.5);
    e.tuneDmg = (e.tuneDmg || 1) * 1.2;
    const hands = { id: 'hands', kind: 'shoot', proj: 'clockhand', shots: 3, spread: 0.28, speed: 220, dmg: 14, minRange: 20, maxRange: 170, wind: 0.5, recover: 0.4, cd: 3 };
    const echo = { id: 'pastecho', kind: 'pastecho', maxRange: 999, wind: 0.65, recover: 0.45, dmg: 18, cd: 6 };
    e.specials = base.specials.map(sp => sp.id === 'hands' ? hands : sp.id === 'timestop' ? { ...sp, dur: 1.9, cd: 10 } : sp.id === 'rift' ? { ...sp, cd: 4.5 } : sp);
    e.specials.push(echo); e.cds.pastecho = 2;
    e.def = { ...base, name: 'The Last Keeper', color: '#e0b778', form2: 'The Finished Gu', lore: 'THE CLOCK RUNS BACKWARD', anyUlt: false,
      ult: { name: 'The Hour Closes', charge: 1.2, dur: 3.5, cd: 15, dark: 'rgba(35,20,40,0.6)', steps: [[0, 'timefreeze', { dur: 2.2 }], [0.5, 'radial', { count: 10, kind: 'clockhand', dmg: 14, speed: 145 }], [1.4, 'pastechoall', { dmg: 16 }], [2.3, 'radial', { count: 12, kind: 'clockhand', dmg: 14, speed: 165, offset: 0.26 }]] },
      ult2: { name: 'A Future Already Written', charge: 1.3, dur: 3.8, cd: 14, dark: 'rgba(30,16,45,0.65)', steps: [[0.3, 'pastechoall', { dmg: 16 }], [1.0, 'rewindall', {}], [1.5, 'timefreeze', { dur: 1.4 }], [2.0, 'radial', { count: 16, kind: 'clockhand', dmg: 15, speed: 165 }], [3.0, 'pastechoall', { dmg: 16 }]] },
      phase2: { ...base.phase2, speedMul: 1.3, cdMul: 0.7, dmgMul: 1.4, add: [{ id: 'yesterday', kind: 'rewindfoe', maxRange: 999, wind: 0.65, recover: 0.45, cd: 9 }], replace: { hands: { ...hands, shots: 5, spread: 0.24 }, timestop: { ...base.specials[0], dur: 2, cd: 9 } } } };
  }

  // The Sword Immortal teaching instead of killing: no true damage, slower draws, a lesson for a second form, and he
  // yields at a tenth of his health instead of falling.
  makeTeacher(e) {
    e.teacher = true;
    e.specials = e.specials.map(s => ({ ...s, wind: (s.wind || 0.3) * TEACHER_WIND }));
  }

  // A summoned minion. Bosses' minions fight bare: no abilities, no passives.
  spawnMinion(type, x, y, summoner, force) {
    const sd = summoner.def || {};
    // some summoners keep only a few minions around (the ult's dragon doesn't count)
    if (sd.minionCap && !force && type !== 'bonedragon' && this.enemies.filter(e => e.summoner === summoner.id && e.type !== 'bonedragon' && !e.dead).length >= sd.minionCap) return null;
    const m = this.spawnEnemy(type, x, y, summoner.team);
    m.summoner = summoner.id;
    if (this.ruled(summoner, 'nosummon')) { m.dead = true; this.emit('unsummon', m.x, m.y); this.emit('inkdissolve', m.x, m.y); return m; } // none stands beside you
    if (sd.boss && !m.def.keepSkills) {
      const def = { ...m.def, specials: [] };
      for (const k of PASSIVE_FLAGS) def[k] = false;
      m.def = def; m.specials = []; m.minion = true;
    }
    if (m.def.hairClone && (type === 'monkeyclone' || type === 'gorillaclone') && sd.trueSight) this.dressClone(m, summoner);
    if (sd.minionScale) { m.maxHp = m.hp = Math.max(1, Math.round(m.maxHp * sd.minionScale)); m.dmgMul = (m.dmgMul || 1) * sd.minionScale; }
    if (sd.multicast) m.fateBound = true;
    if (m.def.lifespan && m.life === undefined) m.life = m.def.lifespan; // some summons only last a while // ???'s summons answer to her dice, not to any king
    this.claimSummon(m);
    return m;
  }

  // A single, temporary first-form boss echo; it cannot phase, revive, summon, or use ultimates.
  openBossProjection(owner) {
    if (this.enemies.some(e => e.summoner === owner.id && e.projection && !e.dead)) return null;
    const pool = ['warlord', 'abbot', 'vampirelord', 'deadeye', 'lich'];
    const type = pool[Math.floor(this.rand() * pool.length)], def = ENEMY_TYPES[type];
    const [x, y] = this.edgePoint(35);
    const m = this.spawnMinion(type, x, y, owner);
    if (!m || m.dead) return null;
    m.projection = true; m.life = 18;
    m.maxHp = m.hp = Math.max(1, Math.round(m.maxHp * 0.3));
    m.dmgMul = (m.dmgMul || 1) * 0.55;
    m.def = { ...m.def, name: def.name + ' Projection', boss: false, phase2: null, ult: null, ult2: null, pastRevive: false, bloodRevive: false, honoredRevive: false };
    m.specials = def.specials.filter(sp => sp.kind !== 'summon').map(sp => ({ ...sp }));
    for (const sp of m.specials) m.cds[sp.id] = 1.5;
    this.emit('rift', x, y);
    return m;
  }

  edgePoint(minFromPlayer) {
    const p = this.p && !this.p.dead ? this.p : { x: 0, y: 0 };
    for (let tries = 0; tries < 20; tries++) {
      const a = this.rand() * Math.PI * 2, rr = R - 10 - this.rand() * 14;
      const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
      if (Math.hypot(x - p.x, y - p.y) > minFromPlayer) return [x, y];
    }
    return [-p.x * 0.8, -p.y * 0.8];
  }

  // Necromancers (and the Lich) raise the fallen as zombies on their own side.
  raiseDead(dead) {
    if (dead.type === 'zombie' || dead.def.boss || this.fighters().length >= 14) return;
    const necro = this.enemies.find(e => e.def.raiseDead && this.active(e) && !(e.cds.raiseDead > 0));
    if (!necro) return;
    if (!this.spawnMinion('zombie', dead.x, dead.y, necro)) return;
    necro.cds.raiseDead = 6;
    this.emit('raise', dead.x, dead.y);
  }

  // A summoner with energy to spare brings a fallen minion back at 30 HP.
  reviveMinion(dead) {
    if (dead.summoner == null) return false;
    const boss = this.enemies.find(e => e.id === dead.summoner && this.active(e) && e.state !== 'stun');
    if (!boss || boss.energy < 40 || boss.cds.revive > 0) return false;
    boss.energy -= 40; boss.cds.revive = 4;
    this.revives.push({ type: dead.type, x: dead.x, y: dead.y, by: boss.id, t: 1.2 });
    this.emit('reviveStart', dead.x, dead.y, { from: boss.x, fromY: boss.y });
    return true;
  }

  updateRevives() {
    for (const r of this.revives) {
      r.t -= DT;
      if (r.t > 0) continue;
      const boss = this.enemies.find(e => e.id === r.by);
      if (!boss) continue; // the summoner fell first
      const m = this.spawnMinion(r.type, r.x, r.y, boss);
      if (!m) continue;
      m.hp = Math.min(30, m.maxHp); m.st = 1.0; m.revived = true;
      this.emit('revive', r.x, r.y);
    }
    this.revives = this.revives.filter(r => r.t > 0);
  }

  updateWaves() {
    if (this.enemies.some(e => !this.friendlyToHero(e)) || this.rewinds.length) return;
    if (this.waveDelay > 0) { this.waveDelay -= DT; return; }
    const sc = this.sc;
    // in training, a boss felled ends the life as a win: the next one would start against whatever health was left
    const wave = sc.custom && this.bossWave ? null : sc.custom ? sc.wave(this.waveIdx, this.opts, this.rand) : (sc.waves || this.opts.waves || [])[this.waveIdx];
    if (this.waveIdx > 0) this.stats.waves = this.waveIdx;
    if (!wave) {
      // credit the remaining time so finishing fast is never worse than stalling
      this.stats.timeBonus = this.timeLimit - this.t;
      return this.finish('clear');
    }
    if (sc.custom && this.opts.healBetweenWaves && this.waveIdx > 0 && this.p && !this.p.dead) {
      this.p.hp = this.p.maxHp;
      this.p.energy = this.p.energyMax; this.p.posture = 0;
      this.p.phoenixUsed = false; this.p.berserkUsed = false; this.p.berserkT = 0;
      this.p.cds.kick = 0; this.p.cds.roll = 0; this.p.abCd = [0, 0];
    }
    const twins = [];
    for (const w of wave) {
      const [x, y] = this.edgePoint(70), e = this.spawnEnemy(typeof w === 'string' ? w : w.type, x, y, 1);
      if (typeof w === 'object') this.tune(e, w);
      if (e.def.paradox) twins.push([e, w]);
    }
    // Paradox Twins are always two: a lone one brings its other, and each is bound to its pair
    if (twins.length % 2) { const [o, w] = twins[twins.length - 1], e = this.spawnEnemy(o.type, -o.x, -o.y, 1); if (typeof w === 'object') this.tune(e, w); twins.push([e, w]); }
    for (let i = 0; i + 1 < twins.length; i += 2) { twins[i][0].partner = twins[i + 1][0]; twins[i + 1][0].partner = twins[i][0]; }
    this.waveIdx++;
    this.waveDelay = 0.8;
    const b = wave.map(w => typeof w === 'string' ? w : w.type).find(t => ENEMY_TYPES[t].boss);
    this.bossWave = !!b;
    this.emit('wave', 0, 0, { n: this.waveIdx, boss: b ? ENEMY_TYPES[b].name : null });
  }

  // The Glitch casts the last ability its target used, a little weaker and a little slower to come out.
  copyAbility(e, s, p) {
    const ab = p && p.lastAbility;
    if (!ab) return null;
    this.emit('glitchcopy', e.x, e.y, { name: ab.name });
    return { ...ab.atk, id: 'glitchcopy', dmg: ab.atk.dmg && Math.round(ab.atk.dmg * 0.6), wind: Math.max(ab.atk.wind || 0.3, 0.45), cd: s.cd };
  }

  canUseSpecial(e, s, d, gap, p) {
    if (e.cds[s.id] > 0) return false;
    if (e.def.manual && e.phase === 2) return false; // the cycle draws his swords, in order
    if (s.energy && (e.energy < s.energy || this.ruled(e, 'noenergy'))) return false;
    if (s.minMomentum && (e.momentum || 0) < s.minMomentum) return false;
    if (s.minHeat && (e.heat || 0) < s.minHeat) return false;
    if (s.vsRooted && !(p.rootT > 0 || p.webT > 0 || p.slowT > 0)) return false;
    switch (s.kind) {
      case 'armor': return gap < s.maxRange && !(e.armorT > 0);
      case 'shield': return !(e.shieldHp > 0) && e.hp < e.maxHp * 0.85;
      case 'inkshield': return !(e.inkShieldT > 0) && ((p.state === 'wind' && Math.hypot(p.x - e.x, p.y - e.y) < 60) || (p.state === 'ult') || this.proj.some(pr => pr.team !== e.team && !pr.lob && Math.hypot(pr.x - e.x, pr.y - e.y) < 50) || this.hazards.some(h => h.team !== e.team && Math.hypot(h.x - e.x, h.y - e.y) < (h.r || 10) + 10));
      case 'scholarstep': return gap < 18 || gap > 70;
      case 'spinguard': return !(e.spinGuardT > 0) && this.proj.some(pr => pr.team !== e.team && !pr.lob && !(pr.delay > 0) && Math.hypot(pr.x - e.x, pr.y - e.y) < 70);
      case 'flurry': return gap < (s.reach || s.range || 16);
      case 'flip': return gap < (s.near || 16);
      case 'climb': return gap > s.minRange && d < s.maxRange;
      case 'swordlight': return d < s.maxRange;
      case 'cleaves': case 'karma': case 'swordformation': case 'hundredshadows': return d < s.maxRange;
      case 'shift': return !e.form;
      case 'elixir': return !e.elixirUsed && e.hp < e.maxHp * 0.45;
      case 'decoy': return d < s.maxRange && this.fighters().length < 14 && this.enemies.filter(o => o.mirrorOf === e.id && !o.dead).length < s.count;
      case 'zone': return d < s.maxRange && !(s.self && this.hazards.some(h => h.kind === 'zone' && h.src === e));
      case 'cloudhop': return gap > s.minRange && d < s.maxRange;
      case 'detonate': return gap < s.range;
      case 'broodbuff': return this.enemies.filter(o => o.summoner === e.id && !o.dead && !o.broodBuffed).length >= 2;
      case 'transfuse': return this.enemies.some(o => o.summoner === e.id && !o.dead && o.hp < o.maxHp * 0.6);
      case 'swap': return gap > s.minRange && d < s.maxRange && Math.hypot(e.x, e.y) > R * 0.5 && !(p.def && p.def.boss);
      case 'slam': return d < s.radius * 0.9;
      case 'melee': return gap < s.range * 0.8 && (!s.vsHeavy || (p.state === 'wind' && p.atk.id === 'heavy'));
      case 'cone': return gap < s.range * 0.8;
      case 'pounce': return gap < s.maxRange && gap > s.minRange;
      case 'multicast': return true;
      case 'copycat': return !!(p && p.lastAbility) && d < s.maxRange;
      case 'resonance': return (p.nails || 0) >= 2;
      case 'speech': return d < s.maxRange && e.hp > e.maxHp * 0.15;
      case 'edgetentacles': return true;
      case 'hasteallies': return this.enemies.some(o => o !== e && !o.dead && o.team === e.team && !(o.hasteT > 0) && Math.hypot(o.x - e.x, o.y - e.y) < s.radius);
      case 'arsenal': return !e.arsenal || e.arsenal.length > 0;
      case 'pastecho': return !!(p.trail && p.trail.length >= 12);
      case 'rewindfoe': { const past = p.trail && p.trail[0]; return !!past && p.trail.length >= 12 && Math.hypot(past.x - p.x, past.y - p.y) > 30; }
      case 'rct': return e.burnoutT > 0 || e.hp < e.maxHp * 0.55;
      case 'gojotp': return gap > s.minRange && d < s.maxRange;
      case 'rewind': { const old = e.hist && e.hist[0]; return !!old && e.hist.length >= 12 && old.hp - e.hp > e.maxHp * 0.1; }
      case 'timestop': return d < s.maxRange && !(this.timeStopT > 0);
      case 'summon': {
        if (!!e.broodSpent !== !!s.desperate) return false; // the true brood until she's at death's door, then only the frantic spill
        const mine = this.enemies.filter(o => o.summoner === e.id && !o.dead).length;
        if (s.projection && this.enemies.some(o => o.summoner === e.id && o.projection && !o.dead)) return false;
        return mine < (s.cap || 2) + (s.desperate ? 8 : 0) && this.fighters().length < (s.desperate ? 20 : 14); // the spill at death's door goes past the usual limits
      }
      default: return d < s.maxRange && gap > (s.minRange || 0);
    }
  }

  // Turns the enemy's read of the situation into the same intent the fighter's brain produces.
  aiIntent(e) {
    const def = e.def, it = { ...NO_INTENT };
    for (const id in e.cds) if (id !== 'kick' && id !== 'roll') e.cds[id] -= DT;
    const p = this.targetOf(e);
    if (!p) { // nobody left to fight: drift toward the middle
      if (e.state === 'idle') { const r = Math.hypot(e.x, e.y); if (r > 20) { it.mx = -e.x / r * 0.4; it.my = -e.y / r * 0.4; } }
      return it;
    }
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
    const ux = dx / d, uy = dy / d, gap = d - e.r - p.r;
    if (def.manual && e.phase === 2 && e.state !== 'ult') e.cycleWait -= DT; // the pause before the next sword of the cycle
    if (e.state !== 'idle') return it;
    if (e.polyT > 0 || e.charmT > 0) { const a = this.t * 2 + e.id; return { ...it, mx: Math.cos(a), my: Math.sin(a) }; } // a rabbit, or smitten
    if (this.ruled(e, 'nomove')) { /* rooted by the scripture: it can still swing at what is in reach */ }
    e.fx = ux; e.fy = uy;
    // the Sword Immortal strings one sword into the next
    if (e.swordChain && this.t >= e.swordChain.at) {
      const c = e.swordChain; e.swordChain = null;
      const s = e.specials.find(x => x.sword === c.n);
      if (s && (e.cds[s.id] || 0) < s.cd * 0.6) { e.cds[s.id] = s.cd * e.cdMul; this.emit('swordchain', e.x, e.y); this.startAttack(e, this.swordCast(e, s)); return it; }
    }
    // the Reaper's hook lands: straight into the sweeping combo
    if (e.reapAt && this.t >= e.reapAt) {
      e.reapAt = 0;
      const s = e.specials.find(x => x.id === 'reap');
      if (s && gap < 45) { e.cds.reap = s.cd * e.cdMul; this.startAttack(e, s); return it; }
    }
    if (def.manual && e.phase === 2) { // Perfect Sword Intent: X, XI, XII, XIII, IX, and round again
      if (e.cycleWait <= 0) {
        const cyc = e.teacher ? LESSON_CYCLE : SWORD_CYCLE, n = cyc[e.cycle % cyc.length], s = e.specials.find(x => x.sword === n);
        e.cycle++; e.cycleWait = e.deathBound ? 0.25 : 1.6; // bound to the manual, he hurries to its end
        if (n === 13) { this.startUlt(e); return it; }
        if (s) { this.startAttack(e, this.swordCast(e, s)); return it; }
      }
    } else if (def.ult && e.phase !== 1.5 && (e.hp < e.maxHp * 0.65 || def.ultAnyHp) && !(e.cds.ult > 0)) { this.startUlt(e); return it; }

    // counters: Riposte after a parry, guardians after a block
    if (e.counterAt && this.t >= e.counterAt) {
      e.counterAt = 0;
      if (e.counterFast) { e.counterFast = false; this.startAttack(e, { ...e.moves.strike, wind: 0.08 }); return it; }
      return { ...it, [this.rand() < def.heavyP ? 'heavy' : 'strike']: true };
    }

    // catches that answer a heavy (Push Hands) take priority over guarding
    for (const s of e.specials) {
      if (s.vsHeavy && !e.plan && this.canUseSpecial(e, s, d, gap, p)) {
        e.cds[s.id] = s.cd * e.cdMul;
        this.startAttack(e, s);
        return it;
      }
    }

    // defence: react to a wind-up its target just started
    const seen = p.id * 100000 + p.windId;
    if (def.humanoid && seen !== e.seenWind) {
      e.seenWind = seen;
      if (p.state === 'wind' && p.atk.range !== undefined && gap < p.atk.range + 25 && !e.plan) {
        const remaining = p.atk.wind - p.windT;
        const r = this.rand();
        if (def.dodgeP && r < (e.phase === 2 ? def.dodgeP2 : def.dodgeP)) {
          e.plan = { rollAt: this.t + def.react * (e.phase === 2 ? 0.2 : 0.4) };
        } else if (def.evasive && p.atk.id === 'heavy' && r < 0.5) {
          e.plan = { rollAt: this.t + def.react * 0.5 };
        } else if (p.atk.id === 'heavy' && r < def.counterP) {
          e.plan = { attackAt: this.t + def.react * 0.6 };
        } else if (p.atk.id !== 'kick' && r < def.counterP + def.blockP) {
          const parry = this.rand() < def.parryP;
          const from = parry ? this.t + Math.max(def.react, remaining - 0.07) : this.t + def.react;
          e.plan = { guardFrom: from, guardTo: parry ? from + 0.15 : this.t + remaining + 0.3, parry, hit: false };
        }
      }
    }
    if (e.plan) {
      const pl = e.plan;
      if (pl.rollAt !== undefined) {
        if (this.t >= pl.rollAt) {
          e.plan = null;
          if (def.focusGain) { this.gainFocus(e, 'dodge'); e.counterAt = this.t + P.rollTime + 0.04; e.counterFast = true; }
          if (def.slipCounter) { e.counterAt = this.t + P.rollTime + 0.04; e.counterFast = true; this.emit('slip', e.x, e.y); } // slip, then counter
          const side = def.slipCounter ? (this.rand() < 0.5 ? 1 : -1) : 0; // a boxer slips sideways, not back
          return { ...it, roll: true, mx: side ? -uy * side : -ux, my: side ? ux * side : -uy };
        }
        return it;
      }
      if (pl.attackAt !== undefined) {
        if (this.t >= pl.attackAt) { e.plan = null; return { ...it, strike: true }; }
        return it;
      }
      if (this.t >= pl.guardFrom && this.t <= pl.guardTo) { it.guard = true; return it; }
      if (this.t > pl.guardTo) {
        e.plan = null;
        if (pl.parry && !pl.hit) { e.state = 'recoil'; e.st = 0.25; this.emit('whiff', e.x, e.y); }
        return it;
      }
      return it; // waiting to raise the guard: the shield drops so the press is fresh
    }

    // the Sword Immortal picks from the whole manual: the deeper swords more often, the same sword twice less often
    if (def.manual && e.phase !== 2) {
      const ok = e.specials.filter(s => this.canUseSpecial(e, s, d, gap, p));
      if (ok.length) {
        const w = ok.map(s => (s.sword >= 10 ? 5 : e.phase === 2 ? 0.6 : 1) * (s.sword === e.lastSword ? 0.3 : 1));
        let r = this.rand() * w.reduce((a, b) => a + b, 0), i = 0;
        while (i < ok.length - 1 && (r -= w[i]) > 0) i++;
        const s = ok[i];
        e.cds[s.id] = s.cd * e.cdMul;
        this.startAttack(e, this.empower(e, s));
        return it;
      }
    }
    // special moves
    for (const s of e.specials) {
      if (this.canUseSpecial(e, s, d, gap, p)) {
        const use = s.kind === 'multicast' ? this.rollMulticast(e, d, gap) : s.kind === 'arsenal' ? this.drawWeapon(e) : s.kind === 'copycat' ? this.copyAbility(e, s, p) : this.empower(e, s);
        if (!use) continue;
        const mc = e.phase === 2 && s.cd2 ? s.cd2 : s.cd; // ???: she casts faster as she weakens, down to every half second
        e.cds[s.id] = s.kind === 'multicast' ? mc - (mc - 0.5) * Math.max(0, 1 - e.hp / e.maxHp) : s.cd * e.cdMul * (1 - 0.015 * (e.focus || 0));
        if (s.energy) e.energy -= s.energy;
        this.startAttack(e, use);
        return it;
      }
    }
    if (def.blinks && gap < 35 && e.blinkCd <= 0) {
      const [x, y] = this.edgePoint(70);
      this.emit('blink', e.x, e.y);
      e.x = x * 0.8; e.y = y * 0.8; e.blinkCd = def.blinkCd || 3.5;
      this.emit('blink', e.x, e.y);
      return it;
    }
    e.blinkCd -= DT;

    // offence
    const reach = e.moves.strike.range;
    if (e.cds.ai <= 0 && gap < reach * 0.9) {
      e.cds.ai = ((1 - def.aggr) * 1.4 + this.rand() * 0.5 + 0.2) * e.cdMul;
      const r = this.rand(), kp = def.kickP || 0;
      if (def.humanoid && e.cds.kick <= 0 && (r < kp || (p.guard && r < kp * (def.cheapShot ? 5 : 2)))) it.kick = true;
      else if (def.humanoid && this.rand() < (def.heavyP || 0) * (p.guard ? 2 : 1)) it.heavy = true;
      else it.strike = true;
      return it;
    }

    // footwork: each role has its own habit
    let vx = 0, vy = 0;
    if (def.shield) it.guard = true;
    // a grab or a cocoon ready (and the prey held fast): walk straight in
    const grab = e.specials.find(s => s.closeIn && !(e.cds[s.id] > 0) && (!s.vsRooted || p.rootT > 0 || p.webT > 0 || p.slowT > 0));
    if (grab) { it.mx = ux; it.my = uy; return it; }
    if (def.ai === 'press') {
      if (gap > reach * 0.6) { vx = ux; vy = uy; }
      vx -= uy * e.strafe * 0.15; vy += ux * e.strafe * 0.15;
    } else if (def.ai === 'duel' || def.ai === 'trick') {
      let want = e.cds.ai <= 0 ? reach * 0.7 : reach + 10;
      if (def.ai === 'trick' && e.cds.ai > 0.4) want = 55; // hit and run
      const radial = gap > want + 3 ? 1 : gap < want - 3 ? -0.6 : 0;
      vx = ux * radial - uy * e.strafe * 0.35; vy = uy * radial + ux * e.strafe * 0.35;
      if (this.rand() < 0.005) e.strafe = -e.strafe;
      if (def.ai === 'trick') {
        const wob = Math.sin(this.t * 3 + e.id) * 0.8;
        vx += -uy * wob; vy += ux * wob;
        if (this.rand() < 0.01) { it.roll = true; const a = this.rand() * Math.PI * 2; vx = Math.cos(a); vy = Math.sin(a); }
      }
    } else if (def.ai === 'kite') {
      if (d < def.near) { vx = -ux; vy = -uy; }
      else if (d > def.far) { vx = ux; vy = uy; }
      else { vx = -uy * e.strafe * 0.7; vy = ux * e.strafe * 0.7; }
      if (Math.hypot(e.x, e.y) > R - 18) { vx = -e.x / R * 0.8 + vx * 0.2; vy = -e.y / R * 0.8 + vy * 0.2; e.strafe = -e.strafe; }
      if (def.flee && gap < 25 && e.cds.roll <= 0) { it.roll = true; vx = -ux; vy = -uy; }
    } else if (def.ai === 'golem') { // plants itself and throws from range; lumbers in only to stomp
      if (gap < 36 || gap > 190) { vx = ux; vy = uy; }
    } else if (def.ai === 'crab') { // scuttles sideways at its reach
      const want = reach + 4, radial = gap > want + 3 ? 0.7 : gap < want - 4 ? -0.5 : 0;
      vx = ux * radial - uy * e.strafe; vy = uy * radial + ux * e.strafe;
      if (this.rand() < 0.012) e.strafe = -e.strafe;
    } else if (def.ai === 'circle' || def.ai === 'serpent') {
      const radial = d > def.orbit + 6 ? 1 : d < def.orbit - 6 ? -1 : 0;
      const weave = def.ai === 'serpent' ? Math.sin(this.t * 2 + e.id) * 0.6 : 0;
      vx = ux * (radial + weave) - uy * e.strafe * 0.8; vy = uy * (radial + weave) + ux * e.strafe * 0.8;
      if (def.ai === 'serpent' && gap < reach * 0.9) { vx = 0; vy = 0; }
    }
    const er = Math.hypot(e.x, e.y);
    if (er > R - 14) { vx -= e.x / er * 0.5; vy -= e.y / er * 0.5; }
    const vm = Math.hypot(vx, vy);
    if (vm > 1) { vx /= vm; vy /= vm; }
    it.mx = vx; it.my = vy;
    return it;
  }

  updateEnemy(e) {
    if (e.yieldT > 0) return this.updateYield(e);
    if (e.def.statusImmune) { e.frozenT = e.rootT = e.fearT = e.posture = 0; e.kvx = e.kvy = 0; }
    if (e.frozenT > 0) { e.frozenT -= DT; return; } // caught in stopped time
    if (e.state === 'gamble') return this.updateGamble(e);
    if (e.state === 'spawn') { e.st -= DT; if (e.st <= 0) e.state = 'idle'; return; }
    if (e.state === 'egg') return this.updateEgg(e);
    if (e.climbing && e.state !== 'act') e.climbing = false;
    if (e.vanished && e.state !== 'ult') e.vanished = false;
    if (e.swordForm && e.state !== 'act' && e.state !== 'ult') e.swordForm = false; // an interrupted vanish shouldn't leave him invisible
    if (e.climbUpT > 0) e.climbUpT -= DT;
    // an illusion lasts only while its master's Blood Moon is up
    if (e.cloneOf != null) { const o = this.enemies.find(m => m.id === e.cloneOf); e.life = o && !o.dead && o.moonT > 0 ? o.moonT : 0; }
    // summons that only last a while (Nature's Call)
    if (e.life !== undefined) { e.life -= DT; if (e.life <= 0) { e.dead = true; this.emit('unsummon', e.x, e.y); return; } }
    e.inkBound = (e.summoner != null || e.cloneOf != null) && this.ruled(e, 'nosummon'); // none stands beside you: bound in ink until the rule passes
    if (e.inkBound) { e.guard = false; if (e.state !== 'stun' && e.state !== 'flinch') { e.state = 'idle'; e.st = 0; } return; }
    const def = e.def;
    if (def.puppet) {
      const v = this.targetOf(e);
      if (v && Math.hypot(v.x - e.x, v.y - e.y) < v.r + 12) {
        e.x = v.x + Math.sin(e.id) * 6; e.y = v.y + Math.cos(e.id) * 6;
        e.latched = v.id;
        if (this.t >= (e.drainAt || 0)) { e.drainAt = this.t + 0.5; this.receiveHit(v, e, { dmg: 2, unblockable: true, noInterrupt: true }, 0, 0, true); } // drains, never interrupts
        return;
      }
      e.latched = null;
    }
    this.passives(e);
    if (e.state === 'morph') return this.updateMorph(e);
    if (e.state === 'transform') return this.updateTransform(e);
    if (e.state === 'ult') return this.updateUlt(e);
    if (e.state === 'act') return this.updateAct(e);
    if (e.chainAt && this.t >= e.chainAt) {
      e.chainAt = 0;
      if (e.state === 'recover') {
        // the next hit of the string: mostly quick strikes, sometimes a kick or heavy to finish
        e.state = 'idle';
        const r = this.rand(), m = e.moves;
        this.startAttack(e, r < 0.15 && e.def.humanoid ? m.kick : r < 0.35 ? m.heavy : m.strike);
        this.emit('chain', e.x, e.y);
      }
    }
    const it = this.aiIntent(e);
    // melee and aimed shots keep tracking their target until just before release
    const p = e.tgt;
    if (p && e.state === 'wind' && (e.atk.kind === 'melee' || e.atk.laser) && e.windT < e.atk.wind - (e.atk.laser ? 0.3 : 0.1)) {
      const px = this.seenX(p), py = this.seenY(p), d = Math.hypot(px - e.x, py - e.y) || 1;
      e.fx = (px - e.x) / d; e.fy = (py - e.y) / d;
    }
    this.updateFighter(e, it, def.speed * e.speedMul);
    e.stillT = e.state === 'idle' && !e.mvx && !e.mvy ? e.stillT + DT : 0;
  }

  // The teacher has yielded: he lowers his sword and stands a moment, then draws the one stroke he held back, into
  // the sky and never at you, and goes. The sky stays cut along it (the Summit's split is the same line).
  updateYield(e) {
    if (e.yieldDone) { this.skySplit = { t: 60, sky: true, age: 9 }; e.lastHitBy = this.p; e.hp = 0; this.kill(e); return; } // the cutscene drew it: he is gone
    if (this.holdYield) { e.state = 'idle'; e.mvx = e.mvy = e.kvx = e.kvy = 0; e.guard = false; e.invulnT = Math.max(e.invulnT || 0, 1); return; } // held while it plays
    const was = e.yieldT;
    e.yieldT -= DT; e.state = 'idle'; e.mvx = e.mvy = e.kvx = e.kvy = 0; e.guard = false; e.invulnT = Math.max(e.invulnT || 0, 1);
    if (this.p && !this.p.dead) { const d = Math.hypot(this.p.x - e.x, this.p.y - e.y) || 1; e.fx = (this.p.x - e.x) / d; e.fy = (this.p.y - e.y) / d; }
    if (was > YIELD_DRAW && e.yieldT <= YIELD_DRAW) { this.skySplit = { t: 60, sky: true }; this.emit('teacherdraw', e.x, e.y); }
    if (e.yieldT <= 0) { e.lastHitBy = this.p; e.hp = 0; this.emit('teacherleave', e.x, e.y); this.kill(e); }
  }

  // Always-on abilities: regen, auras, blessings, boss phases.
  passives(e) {
    const def = e.def;
    if (def.regen) e.hp = Math.min(e.maxHp, e.hp + 2 * DT);
    if (e.heads) this.updateHeads(e);
    if (def.scholar && e.phase === 2 && e.state !== 'transform') this.updatePainting(e);
    if (def.rollingHead && (e.growT = (e.growT ?? 2.2) - DT) <= 0) this.growHead(e);
    if (def.focusGain && this.t >= (e.petalAt || 0) && e.state !== 'spawn') this.sakuraFall(e);
    if (e.adapt && this.t >= (e.adaptAt || 0)) { e.adaptAt = this.t + 10; if ((e.adaptAll || 0) < 0.15) { e.adaptAll = (e.adaptAll || 0) + 0.05; this.emit('wheelturn', e.x, e.y, { cat: 'everything' }); e.wheel++; } }
    if (def.harden) this.updateStone(e);
    if (def.mutates) this.checkMutation(e);
    if (def.phoenix) this.updateHeat(e);
    if (e.momentum > 0 && this.t - (e.momentumAt || 0) > 1.8) { e.momentum--; e.momentumAt = this.t - 1.2; } // cooling off
    if (e.formT > 0 && (e.formT -= DT) <= 0) { if (def.shifts) this.shiftInto(e); else this.revertForm(e); } // the Shapeshifter goes straight into its next skin
    if (def.molts && !e.molted && e.hp < e.maxHp * 0.35 && (e.state === 'idle' || e.state === 'recover')) this.molt(e);
    if (def.trueForm && !e.trueFormed && e.hp < e.maxHp * 0.5 && (e.state === 'idle' || e.state === 'recover')) this.startMorph(e, def.trueForm);
    if (e.apparitionT > 0) e.apparitionT -= DT;
    if (e.moonT > 0) e.moonT -= DT;
    if (e.frenzyT > 0) e.frenzyT -= DT;
    if (def.camo) {
      if (e.revealT > 0) e.revealT -= DT;
      if (this.t >= (e.camoAt || 0)) { e.camoAt = this.t + 0.4; e.camoOx = (this.rand() - 0.5) * 40; e.camoOy = (this.rand() - 0.5) * 40; }
    }
    if (def.infiniteMana) e.energy = e.energyMax;
    if (e.invulnT > 0) e.invulnT -= DT;
    if (e.shieldT > 0 && (e.shieldT -= DT) <= 0) e.shieldHp = 0;
    if (def.infinity) { if (e.burnoutT > 0) e.burnoutT -= DT; if (e.strain > 0) e.strain = Math.max(0, e.strain - 12 * DT); }
    if (e.mobileUlt) { // a mobile ultimate runs its steps alongside whatever else it is doing
      const m = e.mobileUlt, before = m.t;
      m.t += DT;
      if (before < 0 && m.t >= 0) this.emit('ultStart', e.x, e.y, { color: def.color, cosmic: m.u.steps.some(s => s[1] === 'blackstars' || s[1] === 'galaxyfall') });
      const p = this.targetOf(e) || { x: 0, y: 0, fx: 1, fy: 0, r: 0, team: -1 };
      while (m.t >= 0 && m.idx < m.u.steps.length && m.t >= m.u.steps[m.idx][0]) { const [, kind, o] = m.u.steps[m.idx++]; this.ultStep(e, kind, o, p); }
      if (m.t >= m.u.dur) e.mobileUlt = null;
    }
    if (def.specials && def.specials.some(s => s.kind === 'rewind') && this.t >= (e.histAt || 0)) {
      e.histAt = this.t + 0.25;
      (e.hist = e.hist || []).push({ hp: e.hp, x: e.x, y: e.y });
      if (e.hist.length > 16) e.hist.shift(); // about 4 seconds back
    }
    if (def.aura) {
      e.auraT += DT;
      if (e.auraT >= 0.5) {
        e.auraT = 0;
        for (const v of this.hostiles(e)) if (Math.hypot(v.x - e.x, v.y - e.y) < e.r + 22) { v.lastHitBy = e; this.dealDamage(v, 1.5, null, 0, 0, 0); this.emit('burn', v.x, v.y); }
      }
    }
    if (e.rainT > 0) this.updateRain(e);
    if (def.pressure) { // a true bloodline's majesty: whatever stands near it is slower, softer and weaker against it
      const P = def.pressure[Math.min(def.pressure.length, e.stage || (e.phase >= 2 ? 2 : 1)) - 1];
      for (const v of this.hostiles(e)) if (Math.hypot(v.x - e.x, v.y - e.y) < P.r + v.r) { v.pressure = P; v.pressureBy = e; v.pressureT = 0.3; }
    }
    if (def.blessing) {
      e.blessT += DT;
      if (e.blessT >= 1) {
        e.blessT = 0;
        for (const o of this.fighters()) if (o !== e && !o.dead && o.team === e.team && o.hp < o.maxHp && Math.hypot(o.x - e.x, o.y - e.y) < 70) {
          o.hp = Math.min(o.maxHp, o.hp + 4); this.emit('heal', o.x, o.y, { n: 4 });
        }
      }
    }
    if (def.phase2 && e.phase === 1 && e.hp < e.maxHp * (def.phase2At || 0.5) && e.state !== 'ult') {
      // the second form: invulnerable while it transforms
      e.phase = 1.5; e.state = 'transform'; e.st = 1.6; e.guard = false; e.plan = null; e.chainAt = 0;
      this.emit('transformStart', e.x, e.y, { color: def.color, name: def.name, yellowKing: def.yellowKing });
    }
    if (def.phase3 && !e.teacher && e.phase === 2 && e.stage !== 3 && e.hp < e.maxHp * def.phase3.at && e.state !== 'ult' && e.state !== 'transform') {
      // a third stage: the same invulnerable turn, into whatever is under the second form
      e.phase = 1.5; e.toStage = 3; e.state = 'transform'; e.st = def.phase3.dur || 1.8; e.guard = false; e.plan = null; e.chainAt = 0;
      this.emit('transformStart', e.x, e.y, { color: def.color, name: def.form2 || def.name, stage: 3 });
    }
  }

  // The next threshold a gated boss may not be struck past until its transformation has played (0 if none).
  phaseFloor(t) {
    const d = t.def;
    if (!d || !d.phaseGate) return 0;
    if (t.phase === 1 && d.phase2) return Math.max(1, Math.ceil(t.maxHp * (d.phase2At || 0.5)) - 1);
    if (t.phase === 2 && t.stage !== 3 && d.phase3 && !t.teacher) return Math.max(1, Math.ceil(t.maxHp * d.phase3.at) - 1);
    return 0;
  }

  updateTransform(e) {
    e.st -= DT;
    if (e.st > 0) return;
    const def = e.def, third = e.toStage === 3, ph = third ? def.phase3 : def.phase2;
    e.toStage = 0; e.stage = third ? 3 : 2;
    e.phase = 2; e.state = 'idle'; e.speedMul = ph.speedMul || 1; e.cdMul = ph.cdMul || 1; e.dmgMul = ph.dmgMul || 1;
    e.posture = 0;
    // second-form versions of its skills, and whatever it gains
    e.specials = ph.only ? ph.only.slice() : e.specials.map(sp => (ph.replace && ph.replace[sp.id]) || sp); // some forms leave their old arts behind entirely
    if (e.teacher) e.specials = e.specials.map(sp => ({ ...sp, ...(LESSON[sp.sword] || {}), wind: (sp.wind || 0.3) * TEACHER_WIND })); // the lesson
    if (ph.only) for (const sp of e.specials) e.cds[sp.id] = 1;
    for (const s of ph.add || []) { e.specials.push(s); e.cds[s.id] = 1; }
    Object.assign(e, ph.flags || {});
    if (ph.heal) { e.hp = Math.min(e.maxHp, e.hp + e.maxHp * ph.heal); this.emit('heal', e.x, e.y, { n: Math.round(e.maxHp * ph.heal) }); }
    if (def.ult) e.cds.ult = def.ult2Delay != null ? def.ult2Delay : 0.8; // the new form opens with its ultimate (unless it takes its time)
    // the shockwave of the transformation throws everyone nearby back
    for (const v of this.hostiles(e)) {
      const d = Math.hypot(v.x - e.x, v.y - e.y) || 1;
      if (d < 40) { v.kvx += (v.x - e.x) / d * 90; v.kvy += (v.y - e.y) / d * 90; }
    }
    this.emit('phase', e.x, e.y, { name: (third && def.form3) || def.form2 || def.name, stage: e.stage, color: def.color, yellowKing: def.yellowKing, scholar: def.scholar, lore: def.lore });
  }

  startUlt(e) {
    let u = e.honored && e.def.ult3 ? e.def.ult3 : e.stage === 3 && e.def.stage3Ult ? e.def.stage3Ult : e.phase === 2 && e.def.ult2 ? e.def.ult2 : e.def.ult;
    if (e.phase === 2 && e.def.anyUlt) { // the future self has learned every boss's ultimate
      const pool = BOSSES.filter(b => b !== e.type).map(b => ENEMY_TYPES[b].ult).filter(Boolean); // first-form ultimates only
      u = pool[Math.floor(this.rand() * pool.length)];
    }
    e.cds.ult = (e.def.anyUlt && e.phase === 2 ? 8 : u.cd) * e.cdMul;
    if (e.def.goldenBody && e.stage === 3) e.pearlOpenFrom = this.t + u.charge + u.dur; // the pearl dims when the ultimate is spent
    if (u.untouchable) e.invulnT = Math.max(e.invulnT || 0, u.charge + u.dur); // nothing reaches him while he draws
    if (u.iframes) e.invulnT = Math.max(e.invulnT || 0, u.charge + u.iframes);
    if (e.def.manual && e.phase === 2) e.invulnT = Math.max(e.invulnT || 0, 1); // the Thirteenth Sword: untouchable for a moment as he draws
    if (u.mobile) e.mobileUlt = { u, t: -u.charge, idx: 0 }; // cast on the move: it keeps fighting while this plays out
    else { e.state = 'ult'; e.ult = u; e.ultT = -u.charge; e.ultIdx = 0; e.guard = false; e.plan = null; e.chainAt = 0; e.dashT = 0; }
    this.emit('ultCharge', e.x, e.y, { clone: !!e.def.kingClone, name: u.name, cosmic: u.steps.some(s => s[1] === 'blackstars' || s[1] === 'galaxyfall'), color: e.def.color, charge: u.charge, dur: u.dur, dark: u.dark, boss: e.phase === 2 ? e.def.form2 : e.def.name });
  }

  updateUlt(e) {
    const u = e.ult;
    const p = this.targetOf(e) || { x: 0, y: 0, fx: 1, fy: 0, r: 0, team: -1 };
    const before = e.ultT;
    e.ultT += DT; e.flash -= DT;
    if (e.ultT < 0) { // charging: face the target
      const d = Math.hypot(p.x - e.x, p.y - e.y) || 1;
      e.fx = (p.x - e.x) / d; e.fy = (p.y - e.y) / d;
      return;
    }
    if (before < 0) this.emit('ultStart', e.x, e.y, { color: e.def.color, cosmic: u.steps.some(s => s[1] === 'blackstars' || s[1] === 'galaxyfall') });
    if (e.dashT > 0) {
      const o = e.dash;
      e.dashT -= DT;
      e.x += e.fx * o.speed * DT; e.y += e.fy * o.speed * DT;
      const r = Math.hypot(e.x, e.y);
      if (r > R - e.r) { e.x *= (R - e.r) / r; e.y *= (R - e.r) / r; }
      if (!e.dashHit) {
        for (const v of this.hostiles(e)) {
          if (this.airborne(v) || Math.hypot(v.x - e.x, v.y - e.y) >= e.r + v.r + 4) continue;
          e.dashHit = true;
          this.receiveHit(v, e, { id: 'ultdash', ...o }, e.fx, e.fy);
          break;
        }
      }
      if (o.trail) { // the Hellride leaves the ground burning behind it
        e.trailT = (e.trailT || 0) - DT;
        if (e.trailT <= 0) { e.trailT = 0.07; this.hazards.push({ kind: 'sigil', variant: o.trail, x: e.x, y: e.y, r: 10, t: 0.6, delay: 0.6, dmg: 10, team: e.team, src: e }); }
      }
      if (e.dashT <= 0 && o.shock) this.slamHit(e, { id: 'ultshock', radius: o.shock.radius, dmg: o.shock.dmg, kb: 120, unblockable: true, hitPosture: 15 });
    }
    while (e.ultIdx < u.steps.length && e.ultT >= u.steps[e.ultIdx][0]) {
      const [, kind, o] = u.steps[e.ultIdx++];
      this.ultStep(e, kind, o, p);
      // ???'s last gamble: every damaging step lands six times, fanned around the target
      if (e.ultMulti > 1 && MULTI_ULT_STEPS.has(kind)) for (let i = 1; i < e.ultMulti; i++) {
        const q = JITTER_ULT_STEPS.has(kind) ? { ...p, x: p.x + Math.cos(i * 2.1) * 18, y: p.y + Math.sin(i * 2.1) * 18 } : p;
        this.ultStep(e, kind, kind === 'radial' ? { ...o, offset: (o.offset || 0) + i * 0.11 } : o, q);
      }
    }
    if (e.ultT >= u.dur && !(e.dashT > 0)) {
      e.state = 'recover'; e.st = 0.7; e.batForm = false; e.swordForm = false; e.ult = null;
      if (e.exhaustT) { e.state = 'stun'; e.st = e.exhaustT; e.exhaustT = 0; } // spent by the forbidden sword
      if (e.deathBound && e.def.manual) { e.deathBound = false; e.manualDone = true; e.hp = 0; this.emit('manualend', e.x, e.y, { survived: !!(this.p && !this.p.dead) }); } // the last sword is drawn; now he may fall
      if (e.lastStand) { e.lastStand = false; e.ultMulti = 0; e.hp = 0; } // the gamble is spent
    }
  }

  // One beat of an ultimate, aimed at `p`.
  ultStep(e, kind, o, p) {
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    const clampIn = (x, y, m = 8) => { const r = Math.hypot(x, y); return r > R - m ? [x * (R - m) / r, y * (R - m) / r] : [x, y]; };
    switch (kind) {
      case 'blackstars': this.cosmicFields.push({ kind: 'stars', owner: e, age: 0, life: 6, tick: 0 }); this.emit('kingStars', e.x, e.y); break;
      case 'galaxyfall': this.cosmicFields.push({ kind: 'galaxy', owner: e, age: 0, life: 3.2 }); this.emit('kingGalaxy', e.x, e.y); break;
      case 'summon':
        for (const type of o.minions) { const [x, y] = clampIn(e.x + (this.rand() - 0.5) * 40, e.y + (this.rand() - 0.5) * 40); this.spawnMinion(type, x, y, e); }
        this.emit('summon', e.x, e.y);
        break;
      case 'summonEdge':
        for (let i = 0; i < o.count; i++) { const [x, y] = this.edgePoint(40); this.spawnMinion(o.type, x, y, e); this.emit('raise', x, y); }
        break;
      case 'dash':
        e.dash = o; e.dashT = o.time; e.dashHit = false; e.fx = ux; e.fy = uy;
        this.emit('dashcut', e.x, e.y); this.emit('ultdash', e.x, e.y, { fx: ux, fy: uy, color: e.def ? e.def.color : '#ffffff' });
        break;
      case 'swordRing':
        // swords gather around the stage, then fall on the nearest foe one by one
        for (let i = 0; i < o.count; i++) {
          const a = i / o.count * Math.PI * 2;
          const pr = this.fire(e, 0, 1, 210, o.dmg, 'sword');
          pr.x = Math.cos(a) * (R - 6); pr.y = Math.sin(a) * (R - 6); pr.fixed = true;
          pr.delay = o.first + i * o.gap; pr.life = 6;
        }
        break;
      case 'sigil':
        this.castSigil(e, { kind: 'sigil', unblockable: true, ...o, pattern: o.pattern, count: o.count || 1 }, ux, uy, p);
        break;
      case 'radial':
        for (let i = 0; i < o.count; i++) {
          const a = i / o.count * Math.PI * 2 + (o.offset || 0);
          const pr = this.fire(e, Math.cos(a), Math.sin(a), o.speed, o.dmg, o.kind);
          if (o.radius) pr.radius = o.radius;
          if (o.kb) pr.kb = o.kb;
          if (o.homing) pr.homing = o.homing;
          if (o.lifesteal) pr.lifesteal = true;
        }
        this.emit('ultburst', e.x, e.y, { color: e.def ? e.def.color : '#ffffff' });
        break;
      case 'bats': e.batForm = true; this.emit('bats', e.x, e.y); break;
      case 'vanish': e.invulnT = Math.max(e.invulnT || 0, o.dur); e.vanished = true; this.emit('vanish', e.x, e.y); break;
      case 'reappear': e.vanished = false; this.emit('reappear', e.x, e.y); break;
      case 'spacecut': { // a cut in the air itself, somewhere around the target
        const a = this.rand() * Math.PI, ox = (this.rand() - 0.5) * 30, oy = (this.rand() - 0.5) * 30, c = SPACE_CUT, L = c.len;
        const cx = p.x + ox, cy = p.y + oy;
        this.hazards.push({ kind: 'beam', variant: 'cut', x: cx - Math.cos(a) * L / 2, y: cy - Math.sin(a) * L / 2, a, len: L, w: c.width, t: c.delay, delay: c.delay, dmg: o.dmg || c.dmg, kb: c.kb, hitPosture: 8,
          trueDmg: true, pierceAll: true, team: e.team, src: e });
        break;
      }
      case 'beam': { // a long straight strike through (or across) the target
        const a = Math.atan2(uy, ux) + (o.turn || 0), L = o.len;
        const x0 = o.aimed ? p.x - Math.cos(a) * L / 2 : e.x, y0 = o.aimed ? p.y - Math.sin(a) * L / 2 : e.y;
        this.hazards.push({ kind: 'beam', variant: o.variant, x: x0, y: y0, a, len: L, w: o.width, t: o.delay || 0.3, delay: o.delay || 0.3, dmg: o.dmg, kb: o.kb || 80, hitPosture: 20,
          maxHpPct: o.maxHpPct, unblockable: true, trueDmg: o.trueDmg, pierceAll: o.pierceAll, team: e.team, src: e });
        break;
      }
      case 'brushform': e.umbrella = 'brush'; break;
      case 'swordformation': this.swordFormation(e, p, o); break;
      case 'stillness': // every flying sword in the arena stops, then breaks into light
        for (const pr of this.proj) if (['sword', 'moonblade', 'swallow', 'qi'].includes(pr.kind)) { pr.dead = true; this.emit('swordshatter', pr.x, pr.y); }
        this.hazards = this.hazards.filter(h => { const sw = ['sword', 'swordrain', 'afterimage', 'formless'].includes(h.variant); if (sw) this.emit('swordshatter', h.x, h.y); return !sw; });
        e.swordForm = false; this.emit('stillness', e.x, e.y);
        break;
      case 'onesword': { // one finger raised, one ordinary-looking sword, one stroke across everything
        const a0 = Math.atan2(uy, ux);
        for (const da of e.deathBound ? [0, -0.6, 0.6] : [0]) { // the last of the manual: three strokes, wider, crossing at the one who must fall with him
          const a = a0 + da;
          this.hazards.push({ kind: 'beam', variant: 'onesword', x: p.x - Math.cos(a) * 220, y: p.y - Math.sin(a) * 220, a, len: 440, w: e.deathBound ? 48 : 34, t: 0.6, delay: 0.6, dmg: o.dmg, maxHpPct: o.pct, kb: 120, hitPosture: 40,
            unblockable: true, pierceAll: true, trueDmg: true, team: e.team, src: e });
        }
        this.emit('onesworddraw', e.x, e.y);
        break;
      }
      case 'forbidden': // even he cannot draw the Thirteenth Sword without paying for it
        if (e.isPlayer) break;
        e.hp = Math.max(1, e.hp - e.maxHp * 0.15); e.exhaustT = 2.5;
        this.emit('forbidden', e.x, e.y);
        break;
      case 'dragonmerge': // every ink dragon gives up its fight and joins one serpent around the sky
        for (const m of this.enemies) if (m.summoner === e.id && m.type === 'inkdragon' && !m.dead) { m.dead = true; this.emit('dragonmerge', m.x, m.y); }
        this.bigDragon = { t: 0, dur: 6.6, eye: false, owner: e.id };
        this.emit('bigdragon', 0, 0);
        break;
      case 'redeye': if (this.bigDragon) this.bigDragon.eye = true; e.umbrella = 'brush'; this.emit('redeye', 0, 0); break;
      case 'dragonbite': // the whole stage is swallowed
        this.hazards.push({ kind: 'bite', x: 0, y: 0, t: o.delay, delay: o.delay, dmg: o.dmg, pct: o.pct, team: e.team, src: e });
        break;
      case 'skystaff': { // the Ruyi Jingu Bang, grown to the size of the sky, comes straight down
        const [x, y] = clampIn(p.x, p.y, 6);
        this.hazards.push({ kind: 'sigil', variant: 'skystaff', x, y, r: o.r || 24, t: 1.0, delay: 1.0, dmg: o.dmg || 28, kb: 260, team: e.team, src: e });
        // the ground it hits ripples out: a shockwave ring just after impact (wider for the pillar's last drop)
        this.hazards.push({ kind: 'sigil', variant: 'staffquake', x, y, r: (o.r || 24) * (o.quake ? 2.2 : 1.7), t: 1.15, delay: 1.15, dmg: o.quake ? 16 : 10, kb: 160, team: e.team, src: e });
        this.emit('skystaff', x, y);
        break;
      }
      case 'skysplit': this.skySplit = { t: 3.2, a: Math.atan2(uy, ux), x: p.x, y: p.y }; this.emit('skysplit', p.x, p.y, { a: this.skySplit.a }); break;
      case 'monkeyswarm': // ten thousand monkeys from a handful of hair
        for (let i = 0; i < o.count; i++) {
          const a = i / o.count * Math.PI * 2, [x, y] = clampIn(p.x + Math.cos(a) * 34, p.y + Math.sin(a) * 34, 10);
          const m = this.spawnMinion(e.giant ? 'gorillaclone' : 'monkeyclone', x, y, e);
          if (m) { m.state = 'idle'; m.st = 0; m.cds.ai = 0.1 + i * 0.05; if (e.isPlayer) { m.life = 6; m.ally = m.team === e.team; } }
        }
        this.emit('monkeyswarm', e.x, e.y);
        break;
      case 'wheelspin': // the wheel turns for everything at once
        if (e.adapt) { for (const k of Object.keys(e.adapt)) this.adaptTo(e, k, 0.2); e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.04); }
        e.wheel = (e.wheel || 0) + 2;
        this.emit('wheelturn', e.x, e.y, { cat: 'everything', big: true });
        break;
      case 'swarm':
        if (e.broodSpent) break;
        for (let i = 0; i < o.n; i++) {
          const [x, y] = this.edgePoint(30), m = this.spawnMinion(ZERG_BROOD[Math.floor(this.rand() * ZERG_BROOD.length)], x, y, e);
          if (m) { m.state = 'idle'; m.st = 0.2; if (e.isPlayer) { m.life = 7; m.ally = m.team === e.team; } }
        }
        this.emit('swarm', e.x, e.y);
        break;
      case 'timefreeze': this.stopTime(e, o.dur); break;
      case 'pastechoall': for (const f of this.hostiles(e)) this.pastEcho(e, f, o.dmg); break;
      case 'rewindall': for (const f of this.hostiles(e)) this.rewindFoe(f); break;
      case 'domain': { // Domain Expansion: Unlimited Void. Infinite information; nobody inside can move
        this.domainT = o.dur;
        for (const f of this.hostiles(e)) if (!(f.def && (f.def.statusImmune || f.def.timeImmune)) && !this.resists(f)) { f.frozenT = o.freeze; f.guard = false; }
        this.emit('domain', e.x, e.y);
        break;
      }
      case 'voidstrike': { // sure-hit blows inside the domain
        if (!p.id) break;
        const a = this.rand() * Math.PI * 2, gx = e.x, gy = e.y;
        e.x = p.x + Math.cos(a) * 11; e.y = p.y + Math.sin(a) * 11;
        const dd = Math.hypot(p.x - e.x, p.y - e.y) || 1; e.fx = (p.x - e.x) / dd; e.fy = (p.y - e.y) / dd;
        this.emit('voidpunch', p.x, p.y, { black: !!o.black, fx: e.fx, fy: e.fy, gx, gy, ex: e.x, ey: e.y, sprite: e.phase === 2 ? e.def.sprite2 : e.def.sprite });
        p.lastHitBy = e;
        this.receiveHit(p, e, { id: 'voidstrike', dmg: o.dmg, kb: o.kb || (o.black ? 30 : 15), unblockable: true, hitPosture: o.black ? 12 : 5 }, e.fx, e.fy);
        break;
      }
      case 'purplecharge': this.emit('purplecharge', e.x, e.y); break;
      case 'purpleult': {
        const pr = this.fire(e, ux, uy, o.speed, o.dmg, 'purple');
        pr.radius = o.radius; pr.life = 3.2; pr.pierce = true; pr.unblockable = true; pr.erase = true; pr.kb = 260; pr.hitPosture = 50;
        this.emit('purplefire', e.x, e.y, { fx: ux, fy: uy });
        break;
      }
      case 'rift': this.openRift(e); break;
      case 'swordform': e.swordForm = o.on; this.emit(o.on ? 'swordform' : 'iaido', e.x, e.y); break;
      case 'apparition': e.apparitionT = o.dur; this.emit('apparition', e.x, e.y); break;
      case 'palmrain': { // the Thousand-Hand Buddha's palms come down around the target
        const [x, y] = clampIn(p.x + (this.rand() - 0.5) * 56, p.y + (this.rand() - 0.5) * 56);
        this.hazards.push({ kind: 'sigil', variant: 'buddhaSmall', x, y, r: 11, t: 0.55, delay: 0.55, dmg: 12, kb: 120, team: e.team, src: e });
        break;
      }
      case 'bloodmoon': {
        e.moonT = o.dur; this.emit('bloodmoonrise', e.x, e.y);
        if (o.clone && !this.enemies.some(c => c.cloneOf === e.id)) { // an illusion of itself, weaker, until the moon sets
          const [x, y] = clampIn(-e.x * 0.6, -e.y * 0.6);
          const c = this.spawnEnemy(e.type, x, y, e.team);
          c.def = { ...e.def, boss: false, ult: null, ult2: null, phase2: null, lifesteal: false, sway: false, sprite: e.def.sprite2 };
          c.specials = e.specials.filter(sp => sp.kind !== 'summon');
          c.maxHp = c.hp = Math.round(e.maxHp * 0.3); c.dmgMul = 0.5; c.speedMul = e.speedMul; c.cdMul = 1.3;
          c.summoner = e.id; c.cloneOf = e.id; c.illusion = true; c.phase = 2; this.claimSummon(c);
          this.emit('bats', x, y);
        }
        break;
      }
      case 'bonedragon': {
        const [x, y] = this.edgePoint(50);
        const m = this.spawnMinion('bonedragon', x, y, e);
        m.life = 14;
        this.emit('raise', x, y); this.emit('ultburst', x, y, { color: '#5dff9a' });
        break;
      }
      case 'dragonbreath': { // the bone dragon breathes soulfire where its master points
        const dr = this.enemies.find(m => m.summoner === e.id && m.type === 'bonedragon' && !m.dead);
        if (!dr) break;
        const t2 = this.targetOf(dr) || p;
        const bx = t2.x - dr.x, by = t2.y - dr.y, bd = Math.hypot(bx, by) || 1, fx = bx / bd, fy = by / bd;
        dr.fx = fx; dr.fy = fy;
        this.emit('cone', dr.x, dr.y, { fx, fy, range: o.range, angle: o.angle, variant: 'soul' });
        for (const v of this.hostiles(e)) {
          const vx = v.x - dr.x, vy = v.y - dr.y, vd = Math.hypot(vx, vy) || 1;
          if (vd - v.r - dr.r <= o.range && (vx * fx + vy * fy) / vd > Math.cos(o.angle) && !this.airborne(v)) {
            this.receiveHit(v, e, { id: 'ultbreath', dmg: o.dmg, kb: 100, hitPosture: 18, unblockable: true }, vx / vd, vy / vd);
          }
        }
        break;
      }
      case 'drain': { // the Blood Moon drinks from everyone nearby
        let total = 0;
        for (const v of this.hostiles(e)) {
          if (Math.hypot(v.x - e.x, v.y - e.y) > o.range) continue;
          v.lastHitBy = e;
          total += this.dealDamage(v, o.dmg, e, 0, 0, 0);
          this.emit('drain', v.x, v.y, { tx: e.x, ty: e.y });
        }
        if (total) { e.hp = Math.min(e.maxHp, e.hp + total); this.emit('heal', e.x, e.y, { n: Math.round(total) }); }
        break;
      }
      case 'ride': { // gallop a quarter of the way round the ring
        const a = Math.atan2(e.y, e.x) + Math.PI / 2, rr = R - 18;
        const tx = Math.cos(a) * rr, ty = Math.sin(a) * rr, dd = Math.hypot(tx - e.x, ty - e.y) || 1;
        e.dash = { dmg: 16, speed: dd / 0.5, time: 0.5, kb: 120, breaksGuard: true, hitPosture: 20, parryPosture: 30, trail: 'hellfire' };
        e.dashT = 0.5; e.dashHit = false; e.fx = (tx - e.x) / dd; e.fy = (ty - e.y) / dd;
        this.emit('ultdash', e.x, e.y, { fx: e.fx, fy: e.fy, color: e.def.color });
        break;
      }
      case 'chainpull': { // hook the target and drag it in
        if (!p.id) break;
        this.emit('chainpull', e.x, e.y, { tx: p.x, ty: p.y });
        if (!this.airborne(p)) { p.lastHitBy = e; this.dealDamage(p, 6, e, 0, 0, 0); p.kvx += (e.x - p.x) / d * 240; p.kvy += (e.y - p.y) / d * 240; }
        break;
      }
      case 'reform': {
        let bx = p.x - (p.fx || 0) * 16, by = p.y - (p.fy || 0) * 16;
        [bx, by] = clampIn(bx, by);
        e.x = bx; e.y = by; e.batForm = false;
        const d2 = Math.hypot(p.x - e.x, p.y - e.y) || 1;
        e.fx = (p.x - e.x) / d2; e.fy = (p.y - e.y) / d2;
        this.emit('bats', e.x, e.y);
        break;
      }
      case 'bigStrike':
        this.emit('ultslash', e.x + e.fx * 10, e.y + e.fy * 10, { fx: e.fx, fy: e.fy, color: e.def.color });
        for (const v of this.hostiles(e)) {
          if (Math.hypot(v.x - e.x, v.y - e.y) - v.r - e.r <= o.range && !this.airborne(v)) this.receiveHit(v, e, { id: 'ultbite', ...o }, e.fx, e.fy);
        }
        break;
      case 'mines':
        for (let i = 0; i < o.count; i++) {
          const a = i / o.count * Math.PI * 2 + this.rand();
          const [x, y] = clampIn(p.x + Math.cos(a) * o.ring, p.y + Math.sin(a) * o.ring);
          this.hazards.push({ kind: 'mine', team: e.team, src: e, x, y, r: 12, arm: 0.5, life: 10, dmg: 20, t: 1, delay: 1 });
        }
        break;
      case 'shot': {
        e.fx = ux; e.fy = uy;
        const pr = this.fire(e, ux, uy, o.speed, o.dmg, o.proj || 'bullet');
        pr.breaksGuard = o.breaksGuard;
        if (o.burn) pr.burn = true;
        this.emit('muzzle', e.x + ux * 7, e.y + uy * 7, { fx: ux, fy: uy, big: true });
        break;
      }
      case 'cross':
        for (let i = 0; i < 4; i++) {
          const a = o.rot + i * Math.PI / 2;
          this.castSigil(e, { kind: 'sigil', pattern: 'line', count: 7, spacing: 12, step: 0.06, dmg: o.variant ? 20 : 16, radius: 8, delay: 0.45, unblockable: true, variant: o.variant || 'spikes' }, Math.cos(a), Math.sin(a), p);
        }
        this.emit('ultburst', e.x, e.y, { color: e.def ? e.def.color : '#ffffff' });
        break;
      case 'orbs':
        for (let i = 0; i < o.count; i++) {
          const a = i / o.count * Math.PI * 2;
          this.fire(e, Math.cos(a), Math.sin(a), 75, o.dmg, 'orb').homing = 1.8;
        }
        break;
      case 'lightning':
        this.castSigil(e, { kind: 'sigil', pattern: 'scatter', count: o.count, dmg: o.dmg || 20, radius: 13, delay: 0.85, unblockable: true, variant: o.variant || 'lightning' }, ux, uy, p);
        break;
      case 'breath':
        e.fx = ux; e.fy = uy;
        this.emit('cone', e.x, e.y, { fx: ux, fy: uy, range: o.range, angle: o.angle, variant: o.variant || 'fire' });
        this.emit('ultburst', e.x, e.y, { color: e.def ? e.def.color : '#ffffff' });
        for (const v of this.hostiles(e)) {
          const vx = v.x - e.x, vy = v.y - e.y, vd = Math.hypot(vx, vy) || 1;
          if (vd - v.r - e.r <= o.range && (vx * ux + vy * uy) / vd > Math.cos(o.angle) && !this.airborne(v)) {
            this.receiveHit(v, e, { id: 'ultbreath', dmg: o.dmg, kb: o.kb || 120, hitPosture: 20, unblockable: true, wet: o.wet, fire: (o.variant || 'fire') === 'fire' }, vx / vd, vy / vd);
          }
        }
        break;
      case 'rain': this.startRain(e, o.dur); break;
    }
  }

  // Calling Wind and Rain: while it falls everyone he fights is soaked (his thunder bites harder), and he heals in it.
  startRain(e, dur) { e.rainT = Math.max(e.rainT || 0, dur); e.rainTick = 0; this.emit('rain', e.x, e.y, { dur }); }
  updateRain(e) {
    if (!(e.rainT > 0)) return;
    e.rainT -= DT; e.rainTick = (e.rainTick || 0) - DT;
    if (e.rainTick > 0) return;
    e.rainTick = 0.5;
    for (const v of this.hostiles(e)) v.wetT = Math.max(v.wetT || 0, 1);
    if (e.def.rainHeal && e.hp > 0 && e.hp < e.maxHp) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * e.def.rainHeal * 0.5);
  }

  // Breath of the Five Phases: the pearl breathes the next phase in generating order (wood, fire, earth, metal, water).
  breatheWuxing(e, tgt) {
    const [name, steps] = WUXING[(e.wuxing = ((e.wuxing ?? -1) + 1) % WUXING.length)];
    this.emit('wuxing', e.x, e.y, { phase: name });
    for (const [kind, o] of steps) this.ultStep(e, kind, o, tgt);
  }

  // Lunges, leaps and multi-hit spins.
  updateAct(f) {
    const atk = f.atk;
    f.st -= DT; f.flash -= DT;
    if (atk.kind === 'climb') return this.updateClimb(f);
    if (atk.kind === 'cleaves') { if (f.st <= 0) { f.handRaised = false; f.state = 'recover'; f.st = atk.recover; } return; } // the hand stays raised while the air cuts
    if (atk.kind === 'swordlight') { // a streak of sword light through the target, from a new side each time
      if (f.lightLeft > 0 && !f.isPlayer) f.invulnT = Math.max(f.invulnT || 0, 0.1); // as sword light there is nothing to strike
      f.lightT -= DT;
      if (f.lightT <= 0 && f.lightLeft > 0) {
        f.lightLeft--; f.lightT = 0.13;
        const tgt = this.targetOf(f);
        if (tgt) {
          const a = Math.atan2(tgt.y - f.y, tgt.x - f.x) + (f.lightLeft % 2 ? 0.5 : -0.5), x0 = f.x, y0 = f.y;
          let x1 = tgt.x + Math.cos(a) * 22, y1 = tgt.y + Math.sin(a) * 22;
          const r = Math.hypot(x1, y1); if (r > R - 8) { x1 *= (R - 8) / r; y1 *= (R - 8) / r; }
          this.lineHit(f, x0, y0, x1, y1, 5, { ...atk, kind: 'melee', multiHit: true, kb: 30, hitPosture: 10 });
          f.x = x1; f.y = y1; f.fx = Math.cos(a); f.fy = Math.sin(a);
          this.emit('swordlightdash', x0, y0, { x1, y1, last: f.lightLeft === 0 });
          if (f.lightLeft === 0 && atk.crescent) { // materialise behind them, turn, and sweep the moon across them
            const c = atk.crescent, bx = tgt.x - (tgt.x - x0) / (Math.hypot(tgt.x - x0, tgt.y - y0) || 1) * -14, by = tgt.y - (tgt.y - y0) / (Math.hypot(tgt.x - x0, tgt.y - y0) || 1) * -14;
            const r = Math.hypot(bx, by), k = r > R - 8 ? (R - 8) / r : 1;
            f.x = bx * k; f.y = by * k; f.invulnT = 0; f.swordForm = false; // he takes form again to lay the moon down, and can be struck
            const ta = Math.atan2(tgt.y - f.y, tgt.x - f.x); f.fx = Math.cos(ta); f.fy = Math.sin(ta);
            this.hazards.push({ kind: 'crescentzone', x: f.x, y: f.y, a: ta, r0: c.r0, r1: c.r1, t: c.dur, delay: c.dur, dps: c.dps, team: f.team, src: f, tick: 0 });
            this.emit('bigcrescent', f.x, f.y, { a: ta, r0: c.r0, r1: c.r1, dur: c.dur });
          }
        }
      }
      if (f.lightLeft <= 0 && f.lightT <= 0) { f.swordForm = false; f.state = 'recover'; f.st = atk.recover; }
      return;
    }
    if (atk.kind === 'flurry') { // a string of blows, chasing the target
      const tgt = this.targetOf(f);
      if (tgt) {
        const dx = tgt.x - f.x, dy = tgt.y - f.y, d = Math.hypot(dx, dy) || 1;
        f.fx = dx / d; f.fy = dy / d;
        if (d - f.r - tgt.r > (atk.range || 14) * 0.6) { f.x += f.fx * (atk.step || 0) * DT; f.y += f.fy * (atk.step || 0) * DT; }
      }
      f.flurryT -= DT;
      if (f.flurryT <= 0 && f.flurryLeft > 0) {
        f.flurryLeft--; f.flurryT = atk.interval;
        const last = f.flurryLeft === 0 && atk.finisher;
        this.flurryHit(f, last ? { ...atk, ...atk.finisher } : atk, !!last);
        if (f.state !== 'act') return; // parried: the string is broken
      }
      if (f.flurryLeft <= 0 && f.flurryT <= 0) { f.state = 'recover'; f.st = atk.recover; }
      return;
    }
    if (atk.trail && f.state === 'act') { // a blazing dive leaves the ground burning
      f.trailT = (f.trailT || 0) - DT;
      if (f.trailT <= 0) { f.trailT = 0.06; this.hazards.push({ kind: 'sigil', variant: atk.trail, x: f.x, y: f.y, r: 8, t: 0.5, delay: 0.5, dmg: 7, team: f.team, src: f }); }
    }
    if (atk.kind === 'slam') { // whirlwind: keep spinning toward the target
      const tgt = this.targetOf(f);
      if (tgt) {
        const d = Math.hypot(tgt.x - f.x, tgt.y - f.y) || 1, sp = (f.def ? f.def.speed : P.speed) * 0.5;
        f.x += (tgt.x - f.x) / d * sp * DT; f.y += (tgt.y - f.y) / d * sp * DT;
      }
      f.spinT -= DT;
      if (f.spinT <= 0 && f.spinLeft > 0) { f.spinLeft--; f.spinT = atk.interval; this.slamHit(f, atk); }
      if (f.spinLeft <= 0 && f.spinT <= 0) { f.state = 'recover'; f.st = atk.recover; }
      return;
    }
    f.x += f.fx * f.lungeSpeed * DT; f.y += f.fy * f.lungeSpeed * DT;
    if (atk.kind === 'pounce' && !f.lungeHit) {
      for (const v of this.victims(f)) {
        if (this.airborne(v) || Math.hypot(v.x - f.x, v.y - f.y) >= v.r + f.r + 3) continue;
        f.lungeHit = true;
        this.receiveHit(v, f, atk, f.fx, f.fy);
        break;
      }
    }
    if (f.state === 'act' && f.st <= 0) {
      if (atk.kind === 'leap') {
        this.emit('slam', f.x, f.y, { radius: atk.radius, small: true, id: atk.id });
        let hit = false;
        for (const v of this.victims(f)) {
          const d = Math.hypot(v.x - f.x, v.y - f.y) || 1;
          if (d <= atk.radius + v.r) { this.receiveHit(v, f, atk, (v.x - f.x) / d, (v.y - f.y) / d); hit = true; }
        }
        if (!hit) this.countEvade(f);
      } else if (atk.kind === 'flip') { // lands from the backflip and looses an arrow
        const tgt = this.targetOf(f);
        if (tgt) { const dx = tgt.x - f.x, dy = tgt.y - f.y, d = Math.hypot(dx, dy) || 1; f.fx = dx / d; f.fy = dy / d; this.fire(f, f.fx, f.fy, 280, 12, 'arrow'); this.emit('muzzle', f.x + f.fx * 7, f.y + f.fy * 7, { fx: f.fx, fy: f.fy, proj: 'arrow' }); }
      } else if (!f.lungeHit) this.countEvade(f);
      f.state = 'recover'; f.st = atk.recover;
    }
  }

  flurryHit(f, atk, last) {
    const range = atk.range || 14, arc = atk.arc || 0.7;
    let hit = false;
    for (const v of this.victims(f)) {
      if (this.airborne(v, f)) continue;
      const dx = v.x - f.x, dy = v.y - f.y, d = Math.hypot(dx, dy) || 1;
      if (d - v.r - f.r > range) continue;
      if (arc < 3.1 && (dx * f.fx + dy * f.fy) / d < Math.cos(arc)) continue;
      const res = this.receiveHit(v, f, { ...atk, kind: 'melee', multiHit: true }, dx / d, dy / d);
      hit = true;
      if (res === 'parry') break;
    }
    this.emit('flurryhit', f.x + f.fx * 8, f.y + f.fy * 8, { fx: f.fx, fy: f.fy, id: atk.id, range, arc, last, scale: f.fxScale || 1 });
    if (!hit) this.countEvade(f);
  }

  // The Spider Demon's ambush: over the edge, round under the lip of the stage, and up beside its prey.
  updateClimb(f) {
    const atk = f.atk, tgt = this.targetOf(f);
    if (f.climbPhase === 0) { // skitter to the rim
      const rx = Math.cos(f.climbAng) * (R - 2), ry = Math.sin(f.climbAng) * (R - 2), dx = rx - f.x, dy = ry - f.y, d = Math.hypot(dx, dy);
      if (d < 5 || f.st < 0) { f.climbPhase = 1; f.climbing = true; f.st = 1.0; this.emit('climbdown', f.x, f.y); }
      else { f.fx = dx / d; f.fy = dy / d; f.x += f.fx * 170 * DT; f.y += f.fy * 170 * DT; }
      return;
    }
    // under the lip, creeping round toward the target
    if (tgt) {
      let da = Math.atan2(tgt.y, tgt.x) - f.climbAng;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      f.climbAng += clamp(da, -3 * DT, 3 * DT);
    }
    f.x = Math.cos(f.climbAng) * (R - f.r); f.y = Math.sin(f.climbAng) * (R - f.r);
    if (f.st > 0) return;
    f.climbing = false;
    const p = tgt || { x: 0, y: 0 }, dx = p.x - f.x, dy = p.y - f.y, d = Math.hypot(dx, dy) || 1;
    f.fx = dx / d; f.fy = dy / d;
    f.atk = { ...atk, kind: 'leap', lungeTime: 0.35, lunge: 300, maxRange: 999 };
    f.st = 0.35; f.lungeSpeed = Math.min(300, d / 0.35);
    this.emit('climbburst', f.x, f.y);
  }

  slamHit(f, atk) {
    let hit = false;
    this.emit('slam', f.x, f.y, { radius: atk.radius, variant: atk.variant, safe: !atk.unblockable, id: atk.id });
    for (const v of this.victims(f)) {
      const d = Math.hypot(v.x - f.x, v.y - f.y) || 1;
      if (d <= atk.radius + v.r && !this.airborne(v)) { this.receiveHit(v, f, atk, (v.x - f.x) / d, (v.y - f.y) / d); hit = true; }
    }
    return hit;
  }

  special(e) {
    const atk = e.atk;
    if (atk.multi > 1 && !atk.copy) { // multi-cast: the same skill again and again, fanned out around the target
      const fx = e.fx, fy = e.fy;
      for (let i = 1; i < atk.multi; i++) {
        const a = Math.atan2(fy, fx) + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 0.22;
        e.fx = Math.cos(a); e.fy = Math.sin(a);
        e.atk = { ...atk, copy: i };
        this.special(e);
      }
      e.fx = fx; e.fy = fy; e.atk = atk;
    }
    let tgt = this.targetOf(e);
    if (tgt && this.hidden(tgt)) tgt = { ...tgt, x: this.seenX(tgt), y: this.seenY(tgt) }; // spells land on the shimmer
    tgt = tgt || { x: e.x + e.fx * 40, y: e.y + e.fy * 40, fx: e.fx, fy: e.fy, r: 0 };
    if (atk.copy) tgt = { ...tgt, x: tgt.x + Math.cos(atk.copy * 2.1) * 16, y: tgt.y + Math.sin(atk.copy * 2.1) * 16 };
    const dx = tgt.x - e.x, dy = tgt.y - e.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    this.emit('release', e.x, e.y, { id: atk.id, fx: e.fx, fy: e.fy, hero: e.isPlayer, range: atk.range || atk.radius || 0, angle: atk.angle || 0, scale: e.fxScale || 1 });
    if (atk.together && !atk.echo) { // the Outer Disciples fly their swords together
      for (const o of this.enemies) {
        if (o === e || o.dead || o.type !== e.type || o.team !== e.team || o.state !== 'idle' || Math.hypot(o.x - e.x, o.y - e.y) > 90) continue;
        const s = o.specials.find(x => x.id === atk.id);
        if (s && !(o.cds[s.id] > 0)) { o.cds[s.id] = s.cd; this.startAttack(o, { ...s, echo: true, wind: 0.15 }); }
      }
    }
    switch (atk.kind) {
      case 'silkflight': this.silkFlight(e, tgt); break;
      case 'resonance': // the doll is struck, and every nail in its target answers
        for (const v of this.hostiles(e)) {
          if (!(v.nails > 0)) continue;
          const n = v.nails; v.nails = 0;
          this.emit('resonance', v.x, v.y, { n });
          this.receiveHit(v, null, { dmg: (atk.per || 6) * n, unblockable: true, kb: 20, hitPosture: 6 * n, src: e, abilityId: atk.abilityId }, 0, 0, true);
        }
        break;
      case 'speech': { // a cursed word: nothing blocks it, and every word costs the speaker
        const v = this.targetOf(e) || (e.isPlayer ? this.nearestEnemy(e) : null);
        if (!v) break;
        this.emit('speech', e.x, e.y, { word: atk.word });
        this.receiveHit(v, null, { dmg: atk.dmg || 0, unblockable: true, root: atk.root, kb: atk.kb || 0, hitPosture: 10, src: e, abilityId: atk.abilityId }, ux, uy, true);
        if (atk.cost) e.hp = Math.max(1, e.hp - e.maxHp * atk.cost);
        break;
      }
      case 'edgetentacles': { // tentacles rise from the lake at the rim, near the target, and drag toward it
        const a0 = Math.atan2(tgt.y, tgt.x), n = atk.count || 3;
        for (let i = 0; i < n; i++) {
          const a = a0 + (i - (n - 1) / 2) * 0.32, x = Math.cos(a) * (R - 8), y = Math.sin(a) * (R - 8);
          this.hazards.push({ kind: 'sigil', variant: 'tentacle', x, y, r: atk.radius || 12, t: atk.delay || 0.9, delay: atk.delay || 0.9, dmg: atk.dmg, kb: -150, team: e.team, src: e, abilityId: atk.abilityId });
        }
        break;
      }
      case 'hasteallies': // the Chronomancer speeds its allies' clocks
        for (const o of this.enemies) if (o !== e && !o.dead && o.team === e.team && Math.hypot(o.x - e.x, o.y - e.y) < atk.radius) { o.hasteT = atk.dur; this.emit('haste', o.x, o.y); }
        break;
      case 'cosmiceye':
        this.cosmicFields.push({ kind: 'eye', owner: e, age: 0, life: 1.4 });
        for (const v of this.hostiles(e)) { this.cosmicHit(e, v, v.maxHp * 0.12); this.inflictFear(v, e, 1.6); }
        break;
      case 'slam': {
        const hit = this.slamHit(e, atk);
        if (!hit) this.countEvade(e);
        if (atk.hits > 1) { e.state = 'act'; e.spinLeft = atk.hits - 1; e.spinT = atk.interval; }
        break;
      }
      case 'cone': {
        this.emit('cone', e.x, e.y, { fx: e.fx, fy: e.fy, range: atk.range, angle: atk.angle, variant: atk.variant });
        let hit = false;
        for (const v of this.victims(e)) {
          const vx = v.x - e.x, vy = v.y - e.y, vd = Math.hypot(vx, vy) || 1;
          if (vd - v.r - e.r <= atk.range && (vx * e.fx + vy * e.fy) / vd > Math.cos(atk.angle) && !this.airborne(v)) {
            this.receiveHit(v, e, atk, vx / vd, vy / vd); hit = true;
          }
        }
        if (!hit) this.countEvade(e);
        break;
      }
      case 'pounce':
        e.state = 'act'; e.st = atk.lungeTime; e.lungeHit = false; e.fx = ux; e.fy = uy; e.lungeSpeed = atk.lunge;
        if (atk.afterimages) { // Chasing the Wind: afterimages left along the lunge, each slashing a beat later
          const L = atk.lunge * atk.lungeTime;
          for (let i = 1; i <= atk.afterimages; i++) {
            const u = i / (atk.afterimages + 1) * L;
            this.hazards.push({ kind: 'sigil', variant: 'afterimage', x: e.x + ux * u, y: e.y + uy * u, r: 10, t: 0.35 + i * 0.08, delay: 0.35 + i * 0.08, dmg: Math.round(atk.dmg * 0.6), kb: 40, team: e.team, src: e, abilityId: atk.abilityId });
          }
        }
        this.emit(atk.untargetable ? 'bats' : 'dashcut', e.x, e.y);
        break;
      case 'leap':
        e.state = 'act'; e.st = atk.lungeTime; e.fx = ux; e.fy = uy;
        e.lungeSpeed = Math.min(atk.lunge, d / atk.lungeTime);
        e.engaged = true;
        break;
      case 'shoot':
        for (let i = 0; i < atk.shots; i++) {
          const a = Math.atan2(e.fy, e.fx) + (i - (atk.shots - 1) / 2) * (atk.spread || 0.12);
          const pr = this.fire(e, Math.cos(a), Math.sin(a), atk.speed || 170, atk.dmg, atk.proj || 'bullet');
          if (atk.breaksGuard) pr.breaksGuard = true;
          if (atk.kb) pr.kb = atk.kb;
          if (atk.radius) pr.radius = atk.radius;
          if (atk.life) pr.life = atk.life;
          if (atk.blockPosture) pr.blockPosture = atk.blockPosture;
          if (atk.hitPosture) pr.hitPosture = atk.hitPosture;
          if (atk.homing) pr.homing = atk.homing;
          if (atk.pierce) pr.pierce = true;
          if (atk.unblockable) pr.unblockable = true;
          if (atk.erase) pr.erase = true;
          if (atk.bounce) { pr.bounce = atk.bounce; pr.life = atk.life || pr.life; }
          if (atk.pull) pr.pull = true;
          if (atk.burn) pr.burn = true;
          if (atk.lifesteal) pr.lifesteal = true;
          if (atk.reap) pr.reap = true;
          if (atk.shots > 1) pr.volley = true;
          if (atk.burnVariant) pr.burnVariant = atk.burnVariant;
          if (atk.swallow) { // Returning Swallow: thrown wide, it curves round and comes back from behind
            const side = (i % 2 ? 1 : -1) * 0.9, a2 = Math.atan2(pr.vy, pr.vx) + side, sp = Math.hypot(pr.vx, pr.vy);
            pr.vx = Math.cos(a2) * sp; pr.vy = Math.sin(a2) * sp; pr.homing = 6; pr.homeAfter = 0.35;
          }
          Object.assign(pr, statusOf(atk));
          pr.abilityId = atk.abilityId;
        }
        this.emit('muzzle', e.x + e.fx * 7, e.y + e.fy * 7, { fx: e.fx, fy: e.fy, big: !!atk.laser, proj: atk.proj || 'bullet' });
        break;
      case 'orb': {
        const pr = this.fire(e, ux, uy, 70, atk.dmg, 'orb');
        pr.homing = 1.6;
        break;
      }
      case 'volley': {
        const a0 = Math.atan2(uy, ux);
        for (let i = -2; i <= 2; i++) this.fire(e, Math.cos(a0 + i * 0.3), Math.sin(a0 + i * 0.3), 100, atk.dmg, 'fire');
        break;
      }
      case 'swords':
        // swords hover around the caster and launch one after another
        for (let i = 0; i < atk.count; i++) {
          const pr = this.fire(e, ux, uy, 190, atk.dmg, atk.proj || 'sword');
          pr.delay = 0.35 + i * 0.35; pr.orbit = i * (Math.PI * 2 / atk.count); pr.life = 4; pr.abilityId = atk.abilityId;
        }
        break;
      case 'sigil':
        this.castSigil(e, atk, ux, uy, tgt);
        if (atk.homingBlades) for (let i = 0; i < atk.homingBlades; i++) { // Falling Rain, advanced: a storm of blades that hunt
          const pr = this.fire(e, ux, uy, 170, 6, 'sword'); pr.delay = 0.3 + i * 0.08; pr.orbit = i * (Math.PI * 2 / atk.homingBlades); pr.life = 3; pr.homing = 2.4;
        }
        break;
      case 'hundredshadows': // sword shadows strike in from every side at once
        for (let i = 0; i < atk.count; i++) {
          const a = i / atk.count * Math.PI * 2 + this.rand() * 0.4, sx0 = tgt.x + Math.cos(a) * 30, sy0 = tgt.y + Math.sin(a) * 30;
          this.hazards.push({ kind: 'beam', variant: 'shadowcut', x: sx0, y: sy0, a: a + Math.PI, len: 60, w: 6, t: 0.4 + i * 0.06, delay: 0.4 + i * 0.06, dmg: atk.dmg, kb: 40, hitPosture: 10, team: e.team, src: e, abilityId: atk.abilityId });
          this.emit('swordghost', sx0, sy0, { sprite: e.isPlayer ? 'hero' : spriteOfDef(e) });
        }
        break;
      case 'swordformation': this.swordFormation(e, tgt, atk); break;
      case 'cleaves': { // A Sword Without Form: he raises a hand, and cut after cut opens in the air, most of them around the target
        for (let i = 0; i < atk.count; i++) {
          const near = i % 3 !== 2, a = this.rand() * Math.PI, L = (60 + this.rand() * 60) * (atk.lenMul || 1);
          let cx = near ? tgt.x + (this.rand() - 0.5) * 26 : 0, cy = near ? tgt.y + (this.rand() - 0.5) * 26 : 0;
          if (!near) { const ra = this.rand() * Math.PI * 2, rr = this.rand() * (R - 14); cx = Math.cos(ra) * rr; cy = Math.sin(ra) * rr; }
          const d = atk.delay + i * atk.gap;
          this.hazards.push({ kind: 'beam', variant: 'cleave', x: cx - Math.cos(a) * L / 2, y: cy - Math.sin(a) * L / 2, a, len: L, w: 9, t: d, delay: d, dmg: atk.dmg, kb: 40, hitPosture: 6,
            unblockable: true, team: e.team, src: e, abilityId: atk.abilityId });
        }
        if (!e.isPlayer) { e.state = 'act'; e.st = atk.count * atk.gap + atk.delay; e.handRaised = true; }
        this.emit('cleavestorm', e.x, e.y, { dur: atk.count * atk.gap + atk.delay });
        break;
      }
      case 'karma': { // Severing Cause and Effect: the cause is already cut; red lines bind the target, and each second one snaps
        const v = tgt.id != null && this.fighters().find(f => f.id === tgt.id);
        if (!v || v.dead) break;
        (this.karmas = this.karmas || []).push({ target: v, src: e, left: atk.lines, t: atk.every, every: atk.every, dmg: atk.dmg, heal: atk.heal || 0 });
        this.emit('karmalines', v.x, v.y, { id: v.id, n: atk.lines });
        break;
      }
      case 'swordlight': // Man and Sword as One: he becomes sword light and cuts through, again and again
        e.state = 'act'; e.st = 9; e.swordForm = true; e.lightLeft = atk.cuts; e.lightT = 0;
        if (atk.slowmo) { this.slowmo = { t: atk.slowmo, team: e.team }; this.emit('slowmo', e.x, e.y, { dur: atk.slowmo }); } // the world slows to half, so you can see how fast he is
        break;
      case 'mine':
        this.hazards.push({ kind: 'mine', team: e.team, src: e, x: tgt.x + (this.rand() - 0.5) * 30, y: tgt.y + (this.rand() - 0.5) * 30, r: atk.radius, arm: atk.arm, life: atk.life, dmg: atk.dmg, t: 1, delay: 1, ...statusOf(atk) });
        break;
      case 'vortex':
        this.hazards.push({ kind: 'vortex', variant: atk.variant, team: e.team, src: e, x: tgt.x, y: tgt.y, r: atk.radius, t: atk.duration, delay: atk.duration, pull: atk.pull, dmg: atk.dmg, abilityId: atk.abilityId });
        break;
      case 'shield': e.shieldHp = atk.amount || e.maxHp * (atk.amountPct || 0.2); e.shieldT = atk.dur; this.emit('shieldup', e.x, e.y); break;
      case 'iaidraw': { // a draw too fast to see: he is already behind you, and the line is already there
        if (atk.copy && !tgt.id) break;
        const x0 = e.x, y0 = e.y;
        let x1 = tgt.x + ux * 16, y1 = tgt.y + uy * 16;
        const r1 = Math.hypot(x1, y1); if (r1 > R - 8) { x1 *= (R - 8) / r1; y1 *= (R - 8) / r1; }
        e.x = x1; e.y = y1; e.fx = -ux; e.fy = -uy; e.kvx = e.kvy = 0;
        this.lineHit(e, x0, y0, x1, y1, 6, { ...atk, kind: 'melee', trueDmg: true });
        this.emit('iaidraw', x0, y0, { x1, y1, color: e.def.color || '#ffffff' });
        break;
      }
      case 'beam': {
        const a = Math.atan2(uy, ux), len = atk.len || 120, x0 = e.x, y0 = e.y;
        this.hazards.push({ kind: 'beam', variant: atk.variant || 'ruyi', x: x0, y: y0, a, len, w: atk.width || 6, t: atk.delay || 0.05, delay: atk.delay || 0.05, dmg: atk.dmg, kb: atk.kb || 80,
          hitPosture: atk.hitPosture || 15, unblockable: atk.unblockable, breaksGuard: atk.breaksGuard, trueDmg: atk.trueDmg, team: e.team, src: e, abilityId: atk.abilityId });
        break;
      }
      case 'rain': this.startRain(e, atk.dur || 8); break;
      case 'wuxing': this.breatheWuxing(e, tgt); break;
      case 'cloudhop': { // the cloud somersault: over the target in one bound, and down behind it with the staff
        if (!tgt.id || atk.copy) break;
        this.emit('cloud', e.x, e.y, { tx: tgt.x, ty: tgt.y });
        const bx = tgt.fx !== undefined ? tgt.fx : ux, by2 = tgt.fx !== undefined ? tgt.fy : uy;
        let x = tgt.x - bx * 16, y = tgt.y - by2 * 16;
        const r = Math.hypot(x, y); if (r > R - 10) { x *= (R - 10) / r; y *= (R - 10) / r; }
        e.x = x; e.y = y; e.kvx = e.kvy = 0;
        const d2 = Math.hypot(tgt.x - x, tgt.y - y) || 1; e.fx = (tgt.x - x) / d2; e.fy = (tgt.y - y) / d2;
        this.receiveHit(tgt, e, { id: 'somersault', dmg: atk.dmg, kb: atk.kb, hitPosture: 18, breaksGuard: true }, e.fx, e.fy);
        this.emit('cloud', e.x, e.y, { land: true });
        break;
      }
      case 'broodbuff': // the Queen empowers her brood: tougher and deadlier, for good
        for (const m of this.enemies) if (m.summoner === e.id && !m.dead && !m.broodBuffed) {
          m.broodBuffed = true; const n = Math.round(m.maxHp * atk.hpPct); m.maxHp += n; m.hp += n; m.dmgMul = (m.dmgMul || 1) * atk.dmg;
          this.emit('broodbuff', m.x, m.y);
        }
        break;
      case 'transfuse': { // the Queen tops up her most wounded swarmling
        const m = this.enemies.filter(o => o.summoner === e.id && !o.dead).sort((p, q) => p.hp / p.maxHp - q.hp / q.maxHp)[0];
        if (!m) break;
        const n = Math.min(m.maxHp - m.hp, atk.heal);
        m.hp += n; this.emit('transfuse', e.x, e.y, { tx: m.x, ty: m.y }); this.emit('heal', m.x, m.y, { n: Math.round(n) });
        break;
      }
      case 'detonate': this.bloaterBurst(e); e.hp = 0; break;
      case 'inkshield': e.inkShieldT = atk.dur; this.emit('umbrellaopen', e.x, e.y); break;
      case 'scholarstep': { // one step, and it was a hundred
        if (atk.copy) break;
        const x0 = e.x, y0 = e.y, near = tgt.id && Math.hypot(tgt.x - e.x, tgt.y - e.y) < 30;
        let x, y;
        if (near) { const a = Math.atan2(e.y - tgt.y, e.x - tgt.x) + (this.rand() - 0.5) * 1.2; x = tgt.x + Math.cos(a) * 75; y = tgt.y + Math.sin(a) * 75; }
        else { const a = this.rand() * Math.PI * 2; x = tgt.x + Math.cos(a) * 18; y = tgt.y + Math.sin(a) * 18; }
        const r = Math.hypot(x, y); if (r > R - 10) { x *= (R - 10) / r; y *= (R - 10) / r; }
        e.x = x; e.y = y; e.kvx = e.kvy = 0;
        if (tgt.id) { const d = Math.hypot(tgt.x - x, tgt.y - y) || 1; e.fx = (tgt.x - x) / d; e.fy = (tgt.y - y) / d; }
        this.emit('scholarstep', x0, y0, { tx: x, ty: y });
        break;
      }
      case 'spinguard': e.spinGuardT = atk.dur; this.emit('staffspin', e.x, e.y); break;
      case 'armor': e.armorT = atk.dur; e.armorDR = atk.dr; e.armorHaste = atk.haste || 0; this.emit('armorup', e.x, e.y, { id: atk.id }); break;
      case 'flurry':
        e.state = 'act'; e.st = 9; e.flurryT = 0; e.flurryLeft = atk.hits;
        if (atk.consume === 'momentum') { e.flurryLeft += Math.floor((e.momentum || 0) / 2); e.momentum = 0; } // spends the momentum it built
        break;
      case 'lob':
        for (let i = 0; i < (atk.count || 1); i++) {
          const sc = (atk.count || 1) > 1 ? atk.scatter || 20 : 0, a = this.rand() * Math.PI * 2, rr = i === 0 ? sc * 0.3 : sc * Math.sqrt(this.rand());
          this.lob(e, tgt.x + Math.cos(a) * rr, tgt.y + Math.sin(a) * rr, { ...atk, flight: (atk.flight || 0.7) + i * 0.06 });
        }
        break;
      case 'flask': { // a flask of something nasty, chosen off the belt
        const keys = Object.keys(FLASKS);
        for (let i = 0; i < (atk.count || 1); i++) {
          const k = atk.flask || keys[Math.floor(this.rand() * keys.length)], sc = (atk.count || 1) > 1 ? atk.scatter || 20 : 0, a = this.rand() * Math.PI * 2;
          const land = { ...FLASKS[k], dmg: FLASKS[k].dmg * (e.isPlayer ? 1.5 : 1) };
          this.lob(e, tgt.x + Math.cos(a) * sc * (i ? 1 : 0.3), tgt.y + Math.sin(a) * sc * (i ? 1 : 0.3), { proj: 'flask', flask: k, flight: 0.6 + i * 0.08, height: 24, abilityId: atk.abilityId }, land);
        }
        break;
      }
      case 'zone': { const at = atk.self ? e : tgt; this.addZone(e, e.team, at.x, at.y, atk.zone, atk.abilityId); this.emit('zonecast', at.x, at.y, { variant: atk.zone.variant }); break; }
      case 'formation':
        this.hazards.push({ kind: 'formation', x: tgt.x, y: tgt.y, r: atk.radius, t: atk.delay, delay: atk.delay, gate: this.rand() * Math.PI * 2, dmg: atk.dmg, kb: atk.kb, team: e.team, src: e, abilityId: atk.abilityId });
        this.emit('formationcast', tgt.x, tgt.y);
        break;
      case 'swap':
        if (!tgt.id || atk.copy) break;
        this.hazards.push({ kind: 'swap', a: e, b: tgt, x: tgt.x, y: tgt.y, ax: e.x, ay: e.y, r: 9, t: atk.delay, delay: atk.delay, team: e.team, src: e });
        break;
      case 'trick': { // the Archer's quiver: net, explosive and splitting arrows in turn
        if (!atk.copy) e.trickN = (e.trickN || 0) + 1;
        const k = ['net', 'bomb', 'split'][(e.trickN || 0) % 3];
        const pr = this.fire(e, ux, uy, 230, k === 'bomb' ? 8 : 7, 'arrow_' + k);
        if (k === 'net') { pr.root = 1.4; pr.slow = 2; }
        if (k === 'bomb') pr.explode = { r: 16, dmg: 16, kb: 120 };
        if (k === 'split') pr.split = { at: 0.22, n: 5, spread: 0.2 };
        this.emit('muzzle', e.x + e.fx * 7, e.y + e.fy * 7, { fx: e.fx, fy: e.fy, proj: 'arrow' });
        break;
      }
      case 'flip': { // a knife cut, then a backflip away (and a shot on landing)
        for (const v of this.victims(e)) {
          const vx = v.x - e.x, vy = v.y - e.y, vd = Math.hypot(vx, vy) || 1;
          if (vd - v.r - e.r <= 15 && (vx * e.fx + vy * e.fy) / vd > 0.2 && !this.airborne(v, e)) this.receiveHit(v, e, { id: 'knife', dmg: atk.dmg, kb: 40, hitPosture: 10, blockPosture: 14, parryPosture: 22 }, vx / vd, vy / vd);
        }
        if (e.state !== 'recover') break; // parried mid-cut
        e.state = 'act'; e.st = 0.3; e.lungeSpeed = -170; e.fx = ux; e.fy = uy;
        this.emit('backflip', e.x, e.y, { fx: e.fx });
        break;
      }
      case 'climb':
        e.state = 'act'; e.climbPhase = 0; e.climbAng = Math.atan2(e.y, e.x) + (this.rand() - 0.5) * 0.6; e.st = 0.8;
        this.emit('skitter', e.x, e.y);
        break;
      case 'shift': this.shiftInto(e); break;
      case 'decoy': {
        if (atk.copy) break;
        this.emit('poof', e.x, e.y);
        const ms = [];
        for (let i = 0; i < atk.count; i++) {
          const a = i / atk.count * Math.PI * 2 + this.rand();
          let x = e.x + Math.cos(a) * 26, y = e.y + Math.sin(a) * 26;
          const r = Math.hypot(x, y); if (r > R - 10) { x *= (R - 10) / r; y *= (R - 10) / r; }
          const m = this.spawnDecoy(e, x, y);
          if (m) ms.push(m);
        }
        const pick = Math.floor(this.rand() * (ms.length + 1)); // the real one takes any of the places
        if (pick < ms.length) { const m = ms[pick]; [e.x, m.x] = [m.x, e.x]; [e.y, m.y] = [m.y, e.y]; }
        for (const m of ms) this.emit('poof', m.x, m.y);
        break;
      }
      case 'elixir': {
        if (atk.copy) break;
        e.elixirUsed = true;
        const n = Math.min(e.maxHp - e.hp, e.maxHp * atk.heal);
        e.hp += n; this.emit('elixir', e.x, e.y); this.emit('heal', e.x, e.y, { n: Math.round(n) });
        break;
      }
      case 'rct': { // Reverse Cursed Technique: heal, and Infinity comes back up
        if (atk.copy) break; // multi-cast copies don't stack the heal
        const n = Math.min(e.maxHp - e.hp, e.maxHp * (atk.heal || 0.12) * (e.honored ? 1.6 : 1));
        e.hp += n; e.burnoutT = 0; e.strain = 0;
        this.emit('rct', e.x, e.y); if (n > 0) this.emit('heal', e.x, e.y, { n: Math.round(n) });
        break;
      }
      case 'gojotp': { // step through space to just behind the target
        if (atk.copy) break;
        const bx = tgt.fx !== undefined ? tgt.fx : ux, by2 = tgt.fx !== undefined ? tgt.fy : uy;
        let x = tgt.x - bx * 14, y = tgt.y - by2 * 14;
        const r = Math.hypot(x, y);
        if (r > R - 10) { x *= (R - 10) / r; y *= (R - 10) / r; }
        this.emit('tp', e.x, e.y);
        e.x = x; e.y = y; e.kvx = e.kvy = 0;
        const dd = Math.hypot(tgt.x - x, tgt.y - y) || 1; e.fx = (tgt.x - x) / dd; e.fy = (tgt.y - y) / dd;
        this.emit('tp', e.x, e.y);
        break;
      }
      case 'vanish': {
        if (!this.targetOf(e)) break;
        this.emit('smoke', e.x, e.y);
        const tf = tgt.fx !== undefined ? [tgt.fx, tgt.fy] : [ux, uy];
        let bx = tgt.x - tf[0] * 14, by = tgt.y - tf[1] * 14;
        const br = Math.hypot(bx, by);
        if (br > R - 8) { bx *= (R - 8) / br; by *= (R - 8) / br; }
        e.x = bx; e.y = by;
        this.emit('smoke', e.x, e.y);
        const d2 = Math.hypot(tgt.x - e.x, tgt.y - e.y) || 1;
        e.fx = (tgt.x - e.x) / d2; e.fy = (tgt.y - e.y) / d2;
        this.startAttack(e, e.isPlayer ? { ...e.moves.strike, dmg: 14, abilityId: atk.abilityId } : e.moves.strike);
        break;
      }
      case 'timestop': this.stopTime(e, atk.dur); break;
      case 'pastecho': if (tgt.id) this.pastEcho(e, tgt, atk.dmg); break;
      case 'rewindfoe': if (tgt.id) this.rewindFoe(tgt); break;
      case 'rewind': this.rewind(e); break;
      case 'summon': {
        if (atk.random) { this.openRift(e); break; }
        if (atk.projection) { this.openBossProjection(e); break; }
        const list = atk.pick ? Array.from({ length: atk.picks || 1 }, () => atk.minions[Math.floor(this.rand() * atk.minions.length)]) : atk.minions;
        for (const type of list) {
          const a = this.rand() * Math.PI * 2;
          let x = e.x + Math.cos(a) * 16, y = e.y + Math.sin(a) * 16;
          const r = Math.hypot(x, y);
          if (r > R - 10) { x *= (R - 10) / r; y *= (R - 10) / r; }
          const m = this.spawnMinion(type, x, y, e, atk.desperate);
          if (m && atk.desperate) m.spilled = true; // hatched in desperation: they fight, but they don't hold her up
          if (m && e.isPlayer && this.enemies.filter(o => o.summoner === e.id && !o.dead && o !== m).length >= 4) { m.dead = true; this.emit('unsummon', m.x, m.y); continue; } // four at most
          if (m && e.isPlayer) { m.life = atk.life; m.state = 'idle'; m.cds.ai = 0.4; m.ally = m.team === e.team; m.abilityId = atk.abilityId; }
        }
        this.emit('summon', e.x, e.y, { hero: e.isPlayer });
        break;
      }
    }
  }

  castSigil(e, atk, ux, uy, tgt) {
    const p = tgt, base = { kind: 'sigil', variant: atk.variant || 'sigil', r: atk.radius, dmg: atk.dmg, root: atk.root, kb: atk.kb, lift: atk.lift, liftDmg: atk.liftDmg, trueDmg: atk.trueDmg,
      team: e.team, src: e, abilityId: atk.abilityId, follow: atk.follow ? tgt : null, burnAfter: atk.burnAfter, ...statusOf(atk) };
    if (atk.pattern === 'line') {
      for (let i = 0; i < atk.count; i++) {
        const dist = 12 + i * atk.spacing, delay = atk.delay + i * atk.step;
        this.hazards.push({ ...base, x: e.x + ux * dist, y: e.y + uy * dist, t: delay, delay });
      }
    } else if (atk.pattern === 'scatter') {
      for (let i = 0; i < atk.count; i++) {
        const near = i === 0;
        const a = this.rand() * Math.PI * 2, rr = near ? 0 : 20 + this.rand() * 40;
        let x = p.x + Math.cos(a) * rr, y = p.y + Math.sin(a) * rr;
        const r = Math.hypot(x, y);
        if (r > R - 6) { x *= (R - 6) / r; y *= (R - 6) / r; }
        this.hazards.push({ ...base, x, y, t: atk.delay + i * 0.15, delay: atk.delay + i * 0.15 });
      }
    } else {
      this.hazards.push({ ...base, x: p.x, y: p.y, t: atk.delay, delay: atk.delay });
    }
  }

  // the renderer colours shots on the training hero's side differently
  ownerTag(team) { return this.p && team === this.p.team ? 'player' : 'enemy'; }

  fire(e, ux, uy, speed, dmg, kind) {
    const pr = { x: e.x + ux * 6, y: e.y + uy * 6, vx: ux * speed, vy: uy * speed, dmg, team: e.team, owner: this.ownerTag(e.team), src: e, life: 4, kind };
    this.proj.push(pr);
    return pr;
  }

  updateProjectiles() {
    this.wells = this.enemies.filter(e => e.def.horizon && this.active(e));
    this.wards = this.hazards.filter(h => h.kind === 'zone' && h.variant === 'wardarray');
    for (const pr of this.proj) {
      if (pr.dead) continue;
      this.tintNow = pr.tint || null;
      const foes = this.fighters().filter(f => f.team !== pr.team && this.active(f));
      if (pr.delay > 0) {
        // hovering flying sword: circles its caster (or holds its post), then launches at the nearest foe
        pr.delay -= DT;
        const src = pr.src;
        if (pr.fixed) { /* stays where it was placed */ }
        else if (!src || src.dead) { pr.delay = 0; }
        else {
          pr.orbit += DT * 4;
          pr.x = src.x + Math.cos(pr.orbit) * 10; pr.y = src.y + Math.sin(pr.orbit) * 10;
        }
        if (pr.delay <= 0) {
          const aim = this.nearestTo(foes, pr.x, pr.y);
          if (aim) {
            const d = Math.hypot(aim.x - pr.x, aim.y - pr.y) || 1, sp = Math.hypot(pr.vx, pr.vy);
            pr.vx = (aim.x - pr.x) / d * sp; pr.vy = (aim.y - pr.y) / d * sp;
          }
          this.emit('launch', pr.x, pr.y);
        }
        continue;
      }
      if (pr.lob) { // an arcing throw: over everything, down where it was aimed
        pr.arcT += DT;
        const k = Math.min(1, pr.arcT / pr.arcDur);
        pr.x = pr.x0 + (pr.tx - pr.x0) * k; pr.y = pr.y0 + (pr.ty - pr.y0) * k; pr.z = 4 * pr.arcH * k * (1 - k);
        if (k >= 1) { pr.dead = true; this.lobLand(pr); }
        continue;
      }
      if (pr.split && (pr.age = (pr.age || 0) + DT) >= pr.split.at) { // a splitting arrow fans out
        pr.dead = true;
        const a0 = Math.atan2(pr.vy, pr.vx), sp = Math.hypot(pr.vx, pr.vy);
        for (let i = 0; i < pr.split.n; i++) {
          const a = a0 + (i - (pr.split.n - 1) / 2) * pr.split.spread;
          this.proj.push({ ...pr, split: null, dead: false, kind: 'arrow', vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.2, dmg: 6 });
        }
        this.emit('splitarrow', pr.x, pr.y);
        continue;
      }
      for (const m of this.wells) { // Event Horizon: shots bend away from the Gravity Mage
        if (m.team === pr.team) continue;
        const dx = pr.x - m.x, dy = pr.y - m.y, d = Math.hypot(dx, dy);
        if (d > 26 || d < 1) continue;
        const sp = Math.hypot(pr.vx, pr.vy);
        pr.vx += dx / d * 900 * DT; pr.vy += dy / d * 900 * DT;
        const ns = Math.hypot(pr.vx, pr.vy) || 1; pr.vx *= sp / ns; pr.vy *= sp / ns;
      }
      if (this.wards.some(h => h.team !== pr.team && Math.hypot(pr.x - h.x, pr.y - h.y) < h.r)) { // shattered on a barrier array
        pr.dead = true; this.emit('shatter', pr.x, pr.y);
        continue;
      }
      pr.age = (pr.age || 0) + DT;
      const homeOn = pr.homing && !(pr.homeAfter > pr.age) ? this.nearestTo(foes.filter(f => !this.hidden(f)), pr.x, pr.y) : null; // homing shots can't find him
      if (homeOn) {
        const a = Math.atan2(pr.vy, pr.vx), want = Math.atan2(homeOn.y - pr.y, homeOn.x - pr.x);
        let da = want - a;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        const na = a + clamp(da, -pr.homing * DT, pr.homing * DT), sp = Math.hypot(pr.vx, pr.vy);
        pr.vx = Math.cos(na) * sp; pr.vy = Math.sin(na) * sp;
      }
      pr.x += pr.vx * DT; pr.y += pr.vy * DT; pr.life -= DT;
      const pd = Math.hypot(pr.x, pr.y);
      if (pr.bounce > 0 && pd > R - 2) { // ricochet off the edge of the ring
        const nx = pr.x / pd, ny = pr.y / pd, dot = pr.vx * nx + pr.vy * ny;
        if (dot > 0) { pr.vx -= 2 * dot * nx; pr.vy -= 2 * dot * ny; pr.bounce--; pr.x = nx * (R - 3); pr.y = ny * (R - 3); this.emit('ricochet', pr.x, pr.y); }
      }
      if (pr.life <= 0 || pd > R + 30) { if (pr.explode && pr.life <= 0) this.blast(pr); pr.dead = true; continue; }
      const sp = Math.hypot(pr.vx, pr.vy) || 1;
      const shot = { dmg: pr.dmg, blockPosture: pr.breaksGuard ? 0 : pr.blockPosture || 10, hitPosture: pr.hitPosture || 5,
        kb: pr.kb || (pr.kind === 'rocket' ? 90 : 30), breaksGuard: pr.breaksGuard, unblockable: pr.unblockable, abilityId: pr.abilityId, src: pr.src, volley: pr.volley, fromSpecial: pr.fromSpecial, ...statusOf(pr) };
      if (pr.erase) { // Hollow Purple erases whatever it passes through
        for (const o of this.proj) if (o !== pr && !o.dead && o.team !== pr.team && Math.hypot(o.x - pr.x, o.y - pr.y) < (pr.radius || 2) + 3) { o.dead = true; this.emit('erase', o.x, o.y); }
      }
      const reach = pr.radius || 2;
      for (const f of foes) {
        if (this.airborne(f) || Math.hypot(pr.x - f.x, pr.y - f.y) >= f.r + reach) continue;
        if (pr.pierce && pr.hitIds && pr.hitIds.includes(f.id)) continue;
        if (this.hidden(f)) { // a shot at the shimmer: 40% of them pass straight through
          pr.hazeRolls = pr.hazeRolls || {};
          if (pr.hazeRolls[f.id] === undefined) { pr.hazeRolls[f.id] = this.rand() < 0.4; if (pr.hazeRolls[f.id]) this.emit('hazemiss', f.x, f.y); }
          if (pr.hazeRolls[f.id]) continue;
        }
        const r = this.receiveHit(f, null, f.isPlayer ? shot : { ...shot, hitPosture: Math.max(15, shot.hitPosture) }, pr.vx / sp, pr.vy / sp, true);
        if (r === 'parry') {
          // sent back the way it came, now on the parrier's side
          pr.vx *= -1.4; pr.vy *= -1.4; pr.team = f.team; pr.owner = this.ownerTag(f.team); pr.src = f;
          pr.dmg = Math.max(16, pr.dmg); pr.life = 2; pr.homing = 0;
        } else if (pr.pierce && r === 'hit') {
          (pr.hitIds = pr.hitIds || []).push(f.id); // cuts through and keeps going
          if (FUTURE_PROJ.has(pr.kind)) this.emit('projhit', pr.x, pr.y, { kind: pr.kind, fx: pr.vx, fy: pr.vy });
          continue;
        } else {
          pr.dead = true;
          if (pr.kind === 'rocket') this.emit('explode', pr.x, pr.y);
          if (pr.kind === 'red') this.emit('redburst', pr.x, pr.y);
          if (pr.kind === 'palm') this.emit('palmhit', pr.x, pr.y);
          if (pr.explode) this.blast(pr);
          if ((r === 'hit' || r === 'block') && !FUTURE_PROJ.has(pr.kind)) this.emit('projhit', pr.x, pr.y, { kind: pr.kind, fx: pr.vx, fy: pr.vy });
          if (r === 'hit') this.projectileExtras(pr, f);
          if (FUTURE_PROJ.has(pr.kind)) this.emit('projhit', pr.x, pr.y, { kind: pr.kind, fx: pr.vx, fy: pr.vy });
        }
        break;
      }
    }
    this.tintNow = null;
    this.proj = this.proj.filter(pr => !pr.dead);
  }

  // Special projectiles: chains drag, hellfire burns the ground, bats feed their master.
  projectileExtras(pr, f) {
    const src = pr.src;
    if (pr.pull && src && !src.dead) {
      const d = Math.hypot(src.x - f.x, src.y - f.y) || 1;
      f.kvx += (src.x - f.x) / d * 220; f.kvy += (src.y - f.y) / d * 220;
      this.emit('chainpull', src.x, src.y, { tx: f.x, ty: f.y });
    }
    if (pr.burn) this.hazards.push({ kind: 'sigil', variant: pr.burnVariant || 'hellfire', x: f.x, y: f.y, r: 10, t: 0.35, delay: 0.35, dmg: 8, team: pr.team, src });
    if (pr.reap && src && !src.dead) src.reapAt = this.t + 0.3; // reeled in, straight into the scythe
    if (pr.lifesteal && src && !src.dead) { const n = pr.dmg * 0.6 * (src.frenzyT > 0 ? 2 : 1); src.hp = Math.min(src.maxHp, src.hp + n); this.emit('heal', src.x, src.y, { n: Math.round(n) }); }
  }

  // Floor hazards hurt (or pull) everyone not on their caster's team.
  updateHazards() {
    for (const h of this.hazards) {
      this.tintNow = h.tint || null;
      const foes = this.fighters().filter(f => f.team !== h.team && this.active(f) && !this.airborne(f));
      const dist = f => Math.hypot(f.x - h.x, f.y - h.y);
      const dir = f => { const d = dist(f) || 1; return [(f.x - h.x) / d, (f.y - h.y) / d]; };
      const threatensHero = !this.battle && this.p && h.team !== this.p.team;
      if (h.kind === 'crescentzone') { // a half-moon of sword light lying on the stage, cutting whoever is inside it
        h.t -= DT;
        if ((h.tick -= DT) <= 0) {
          h.tick = 0.25;
          for (const f of foes) {
            const d = dist(f), da = Math.abs(((Math.atan2(f.y - h.y, f.x - h.x) - h.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
            if (d >= h.r0 - f.r && d <= h.r1 + f.r && da <= Math.PI / 2) { const [ux, uy] = dir(f); this.receiveHit(f, null, { id: 'mooncrescent', dmg: h.dps * 0.25, kb: 12, hitPosture: 4, unblockable: true, src: h.src }, ux, uy, true); }
          }
        }
        continue;
      }
      if (h.kind === 'zone') { this.updateZone(h); continue; }
      if (h.kind === 'formation' || h.kind === 'swap') { h.t -= DT; if (h.t <= 0) this.triggerArray(h, foes); continue; }
      if (h.kind === 'bite') {
        h.t -= DT;
        if (h.t <= 0) {
          this.emit('dragonbite', 0, 0);
          for (const f of foes) this.receiveHit(f, null, { id: 'dragonbite', dmg: h.dmg, maxHpPct: h.pct, kb: 60, hitPosture: 30, unblockable: true, src: h.src }, 0, 0, true);
        }
        continue;
      }
      if (h.kind === 'beam') {
        h.t -= DT;
        if (h.t <= 0) {
          const x1 = h.x + Math.cos(h.a) * h.len, y1 = h.y + Math.sin(h.a) * h.len;
          this.emit('beamhit', h.x, h.y, { x1, y1, variant: h.variant, w: h.w });
          this.lineHit(h.src && !h.src.dead ? h.src : null, h.x, h.y, x1, y1, h.w / 2, { id: h.variant, dmg: h.dmg, kb: h.kb, hitPosture: h.hitPosture, unblockable: h.unblockable, breaksGuard: h.breaksGuard,
            trueDmg: h.trueDmg, pierceAll: h.pierceAll, maxHpPct: h.maxHpPct, src: h.src, abilityId: h.abilityId, fromSpecial: h.fromSpecial }, h.team);
        }
        continue;
      }
      if (h.kind === 'mine') {
        h.life -= DT;
        if (h.arm > 0) { h.arm -= DT; continue; }
        const v = foes.find(f => dist(f) <= h.r + f.r);
        if (v) {
          h.life = 0;
          this.emit('sigilburst', h.x, h.y, { r: h.r * 1.5, variant: 'mine' });
          const [ux, uy] = dir(v);
          this.receiveHit(v, null, { ...statusOf(h), dmg: h.dmg, unblockable: true, kb: 90, hitPosture: 15, src: h.src }, ux, uy, true);
        }
        continue;
      }
      h.t -= DT;
      if (h.kind === 'vortex') {
        // pulls foes toward the eye while it spins
        for (const f of foes) {
          const d = dist(f);
          if (d < h.r * 1.8 && d > 1 && !(f.def && f.def.floating)) {
            const k = (f.isPlayer ? h.pull : h.pull / Math.sqrt(f.mass)) * DT, [ux, uy] = dir(f);
            f.x -= ux * k; f.y -= uy * k;
          }
        }
        if (h.t <= 0) {
          this.emit('sigilburst', h.x, h.y, { r: h.r * 0.6, variant: h.variant === 'gravity' ? 'gravity' : 'sand' });
          let heroHit = false;
          for (const f of foes) {
            if (dist(f) > h.r * 0.5 + f.r) continue;
            const [ux, uy] = dir(f);
            this.receiveHit(f, null, { dmg: h.dmg, unblockable: true, kb: 80, hitPosture: 15, abilityId: h.abilityId, src: h.src, fromSpecial: h.fromSpecial }, ux, uy, true);
            if (f === this.p) heroHit = true;
          }
          if (threatensHero && !heroHit) this.stats.evades++;
        }
        continue;
      }
      if (h.follow && h.t > 0.35 && !h.follow.dead) { // a crosshair that hunts its target, then locks
        const dx = h.follow.x - h.x, dy = h.follow.y - h.y, dd = Math.hypot(dx, dy);
        if (dd > 1) { const step = Math.min(dd, 80 * DT); h.x += dx / dd * step; h.y += dy / dd * step; }
      }
      if (h.t > 0) continue;
      this.emit('sigilburst', h.x, h.y, { r: h.r, variant: h.variant });
      if (h.burnAfter) this.hazards.push({ kind: 'sigil', variant: 'hellfire', x: h.x, y: h.y, r: 12, t: 0.5, delay: 0.5, dmg: 10, team: h.team, src: h.src });
      let heroHit = false;
      for (const f of foes) {
        if (dist(f) > h.r + f.r) continue;
        const [ux, uy] = dir(f);
        this.receiveHit(f, null, { ...statusOf(h), dmg: h.dmg, unblockable: true, kb: h.kb || 60, hitPosture: f.isPlayer ? (h.kb ? 25 : 10) : 15, root: h.root, abilityId: h.abilityId, src: h.src, lift: h.lift, liftDmg: h.liftDmg, fire: h.variant === 'hellfire', lightning: /lightning/.test(h.variant || ''), wet: h.wet, trueDmg: h.trueDmg, fromSpecial: h.fromSpecial }, ux, uy, true);
        if (f === this.p) heroHit = true;
      }
      if (threatensHero && !heroHit) this.stats.evades++;
    }
    this.tintNow = null;
    this.hazards = this.hazards.filter(h => h.kind === 'mine' || h.kind === 'zone' ? h.life > 0 : h.t > 0);
  }

  // ---------- talents borrowed from stories ----------

  heroTalents(h) {
    if (h.berserkT > 0) h.berserkT -= DT;
    if (h.beastT > 0 && (h.beastT -= DT) <= 0) { h.beast = null; this.emit('shiftform', h.x, h.y, { name: 'BACK TO HUMAN', color: '#c9a66b', back: true }); }
    if (!h.tal) return;
    const T = k => this.T(h, k), fighting = !!this.nearestEnemy(h);
    if (T('shapeshift') && fighting && !(h.beastT > 0) && (h.beastCd = (h.beastCd ?? 1.5) - DT) <= 0) {
      const kinds = Object.keys(BEAST_MODS).filter(b => b !== h.lastBeast), k = h.hp < h.maxHp * 0.35 && h.lastBeast !== 'bear' ? 'bear' : kinds[Math.floor(this.rand() * kinds.length)]; // hurt badly, it reaches for the bear's hide
      h.beast = k; h.lastBeast = k; h.beastT = 9; h.beastCd = 11; h.skinTalent = true;
      h.hp = Math.min(h.maxHp, h.hp + h.maxHp * 0.1); // every new skin closes wounds
      this.emit('shiftform', h.x, h.y, { name: SHIFT_FORMS[k].name, color: SHIFT_FORMS[k].color });
    }
    if (h.beastT > 0 && this.T(h, 'hpRegen') && h.hp < h.maxHp) h.hp = Math.min(h.maxHp, h.hp + this.T(h, 'hpRegen') * DT);
    if (T('healing') && h.hp < h.maxHp) h.hp = Math.min(h.maxHp, h.hp + 1.5 * DT);
    if (T('ripple') && h.guard && h.hp < h.maxHp) h.hp = Math.min(h.maxHp, h.hp + 2 * DT);
    if (T('kaioken') && h.hp > h.maxHp * 0.3 && fighting) h.hp -= h.maxHp * 0.015 * DT; // the body pays for it
    if (h.worldCd > 0) h.worldCd -= DT;
    if (h.worldT > 0) h.worldT -= DT;
    if (T('theWorld') && !(h.worldCd > 0) && h.hp < h.maxHp * 0.35 && fighting) {
      h.worldCd = 35; h.worldT = 5;
      h.hp = Math.min(h.maxHp, h.hp + h.maxHp * 0.2); h.energy = h.energyMax; // time stops, and so does the bleeding
      this.stopTime(h, 5); this.emit('theworld', h.x, h.y);
    }
  }

  // Flash Step: twice as far, or straight behind a nearby foe
  flashStep(f) {
    f.rollMul = 2;
    const e = this.nearestEnemy(f);
    if (!e || Math.hypot(e.x - f.x, e.y - f.y) > 45) return;
    const d = Math.hypot(e.x - f.x, e.y - f.y) || 1, ux = (e.x - f.x) / d, uy = (e.y - f.y) / d;
    let x = e.x + ux * (e.r + f.r + 3), y = e.y + uy * (e.r + f.r + 3);
    const r = Math.hypot(x, y); if (r > R - 8) { x *= (R - 8) / r; y *= (R - 8) / r; }
    this.emit('blink', f.x, f.y); f.x = x; f.y = y; f.fx = -ux; f.fy = -uy; f.st = 0.05;
    this.emit('blink', f.x, f.y);
  }

  // Shadow Clone: a copy that fights beside you for a moment
  shadowClone(f, free) {
    if (!free && this.enemies.filter(m => m.summoner === f.id && m.type === 'shadowclone' && !m.dead).length >= 2) return;
    const m = this.spawnMinion('shadowclone', f.x, f.y, f);
    if (!m) return;
    m.state = 'idle'; m.st = 0; m.life = 4; m.ally = m.team === (this.p ? this.p.team : f.team); m.cloneOf = null; m.skin = f.skin;
    this.emit('poof', f.x, f.y);
  }

  // the strike talents: a phantom barrage every 4th landed strike, and the four elements in turn
  strikeTalents(f, t, ux, uy) {
    if (this.T(f, 'standRush') && (f.strikeLands = (f.strikeLands || 0) + 1) % 4 === 0) this.standRush(f, t, 6);
    if (this.T(f, 'elements')) this.elementBurst(f, t, (f.elemN = (f.elemN || 0) + 1));
  }

  standRush(f, t, n) {
    for (let i = 0; i < n; i++) this.echoes.push({ t: 0.08 + i * 0.07, target: t, src: f, dmg: 4, rush: true });
    this.emit('standrush', f.x, f.y, { fx: f.fx, fy: f.fy });
  }

  elementBurst(f, t, n) {
    if (!t || !t.id || t.dead) return;
    const el = ['fire', 'water', 'earth', 'air'][n % 4], d = Math.hypot(t.x - f.x, t.y - f.y) || 1, ux = (t.x - f.x) / d, uy = (t.y - f.y) / d;
    if (el === 'fire') this.applyStatus(t, { poison: 5, poisonT: 2 }, f);
    if (el === 'water') this.applyStatus(t, { slow: 1.2 }, f);
    if (el === 'earth') this.addPosture(t, 14);
    if (el === 'air' && !(t.def && (t.def.boss || t.def.statusImmune))) { t.kvx += ux * 160 / t.mass; t.kvy += uy * 160 / t.mass; }
    this.emit('element', t.x, t.y, { el });
  }

  // ---------- the newer super bosses ----------

  // True damage: only the attacker's side counts (combo, stun, its own strength).
  trueMult(t, by) {
    let m = by ? this.comboMult(by) : 1;
    if (t.state === 'stun') m *= STUN_DMG;
    if (by && by.dmgMul) m *= by.dmgMul;
    if (by && by.tuneDmg) m *= by.tuneDmg;
    if (by && by.focus) m *= 1 + 0.04 * by.focus;
    return m;
  }

  // Severing the Heavens: past every guard, ward, phase, shield and Infinity.
  trueHit(t, by, atk, ux, uy) {
    if (by) t.lastHitBy = by;
    const dealt = this.dealDamage(t, (atk.dmg || 0) * this.trueMult(t, by) + (atk.maxHpPct ? t.maxHp * atk.maxHpPct : 0), by, ux, uy, atk.kb || 0);
    if (by) by.dmgOut += dealt;
    this.addPosture(t, atk.hitPosture || 0);
    this.emit('truehit', t.x, t.y);
    return 'hit';
  }

  // World Within a Painting: everything that lives in the Scholar's second form
  updatePainting(e) {
    const foes = this.hostiles(e);
    if (this.t >= (e.rainAt || 0)) { // Rain From Another World
      e.rainAt = this.t + 2.6;
      for (let i = 0; i < 5; i++) {
        const v = foes.length && i % 2 === 0 ? foes[Math.floor(this.rand() * foes.length)] : null, a = this.rand() * Math.PI * 2, rr = v ? 4 + this.rand() * 18 : this.rand() * (R - 12);
        let x = (v ? v.x : 0) + Math.cos(a) * rr, y = (v ? v.y : 0) + Math.sin(a) * rr;
        const r = Math.hypot(x, y); if (r > R - 6) { x *= (R - 6) / r; y *= (R - 6) / r; }
        this.hazards.push({ kind: 'sigil', variant: 'inkrain', x, y, r: 7, t: 1.0 + i * 0.1, delay: 1.0 + i * 0.1, dmg: 6, kb: 20, team: e.team, src: e });
      }
    }
    if (this.t >= (e.dragonAt || 0) && e.state !== 'ult') { // ink dragons come to his aid, two at a time
      e.dragonAt = this.t + 8;
      if (this.enemies.filter(m => m.summoner === e.id && m.type === 'inkdragon' && !m.dead).length < 2) {
        const a = this.rand() * Math.PI * 2, m = this.spawnMinion('inkdragon', Math.cos(a) * 50, Math.sin(a) * 50, e, true);
        if (m) { m.state = 'idle'; m.st = 0; this.emit('inkdragonrise', m.x, m.y); }
      }
    }
    if (this.t >= (e.headAt || 0) && e.state !== 'ult') { // a head rolls down from where his own should be
      e.headAt = this.t + 2;
      const a = this.rand() * Math.PI * 2, m = this.spawnMinion('rollinghead', e.x + Math.cos(a) * 8, e.y + Math.sin(a) * 8, e);
      if (m) { m.state = 'idle'; m.st = 0; m.kvx = Math.cos(a) * 60; m.kvy = Math.sin(a) * 60; this.emit('headroll', e.x, e.y); }
    }
    if (this.t >= (e.ruleAt || 0)) { // Polluted Scripture: a rule of combat, rewritten
      e.ruleAt = this.t + 9;
      const R0 = SCHOLAR_RULES.filter(r => !this.scripture || r.rule !== this.scripture.rule), pick = R0[Math.floor(this.rand() * R0.length)];
      this.scripture = { rule: pick.rule, name: pick.name, t: pick.dur || 6, team: e.team };
      this.emit('scripture', e.x, e.y, { name: pick.name });
    }
    if ((e.learned || []).length && this.t >= (e.memoryAt || 0)) { // The Painting Remembers
      e.memoryAt = this.t + 5;
      this.paintingCasts(e, e.learned[Math.floor(this.rand() * e.learned.length)]);
    }
  }

  // The Painting Remembers: count what is used against him; past enough repetitions, it belongs to the painting
  recordTechnique(t, atk) {
    const key = atk.abilityId || (BASE_MOVES[atk.id] ? atk.id : null);
    if (!key) return;
    t.recorded = t.recorded || {}; t.learned = t.learned || [];
    if (t.learned.includes(key)) return;
    if ((t.recorded[key] = (t.recorded[key] || 0) + 1) >= 5) {
      t.learned.push(key);
      this.emit('recorded', t.x, t.y, { name: HERO_ABILITIES[key] ? HERO_ABILITIES[key].name : key });
    }
  }

  paintingCasts(e, key) {
    const tgt = this.targetOf(e);
    if (!tgt) return;
    const ab = HERO_ABILITIES[key], name = ab ? ab.name : key;
    this.emit('paintingremembers', e.x, e.y, { name });
    if (ab && !['pounce', 'leap', 'melee', 'vanish', 'flurry', 'climb', 'flip', 'armor', 'shift'].includes(ab.atk.kind)) {
      const keep = e.atk, st = e.state;
      e.atk = { ...ab.atk, energy: 0, abilityId: null, hero: false };
      this.special(e);
      e.atk = keep; if (e.state === 'recover' || e.state === 'act') e.state = st;
      return;
    }
    // blows (and techniques that are blows) come back as an ink fist out of the painting
    const dmg = ab ? Math.min(24, (ab.atk.dmg || 14)) : key === 'heavy' ? 20 : key === 'kick' ? 6 : 10;
    this.hazards.push({ kind: 'sigil', variant: 'inkfist', x: tgt.x, y: tgt.y, r: 9, t: 0.6, delay: 0.6, dmg, kb: key === 'kick' ? 200 : 80, team: e.team, src: e });
  }

  // a rolled head grows into a whole fighter
  growHead(h) {
    const owner = this.enemies.find(o => o.id === h.summoner && !o.dead);
    h.dead = true;
    if (!owner) return;
    const m = this.spawnMinion(HEAD_FIGHTERS[Math.floor(this.rand() * HEAD_FIGHTERS.length)], h.x, h.y, owner, true);
    if (m) { m.st = 0.7; m.revived = true; this.emit('headgrow', h.x, h.y, { name: m.def.name }); }
  }

  // The Sword Immortal draws a sword from the manual: intent builds (more for a new sword), and a deep enough intent buys the advanced form.
  swordCast(e, s) {
    e.intent = e.intent || 0;
    let use = s, adv = false;
    if (s.adv && e.intent >= 50) { use = { ...s, ...s.adv }; e.intent -= 40; adv = true; }
    e.intent = Math.min(100, e.intent + (e.lastSword === s.sword ? 3 : 14));
    e.lastSword = s.sword;
    if (e.phase !== 2 && SWORD_CHAINS[s.sword] && this.rand() < 0.3 + e.intent / 250) e.swordChain = { n: SWORD_CHAINS[s.sword], at: this.t + s.wind + s.recover + 0.05 };
    if (s.sword >= 12) e.invulnT = Math.max(e.invulnT || 0, 1);
    if (e.deathBound && UNFINISHED[s.sword]) use = { ...use, ...UNFINISHED[s.sword] }; // the Unfinished Manual: what is left of it, drawn with everything he has
    this.emit('swordname', e.x, e.y, { n: s.sword, name: s.swordName, adv, bound: !!e.deathBound });
    return use;
  }

  // Ten Thousand Swords Return to One: a ring of swords around the target, all launching inward together
  swordFormation(e, p, o) {
    for (let i = 0; i < o.count; i++) {
      const a = i / o.count * Math.PI * 2, x = p.x + Math.cos(a) * o.radius, y = p.y + Math.sin(a) * o.radius;
      const pr = this.fire(e, -Math.cos(a), -Math.sin(a), 240, o.dmg, 'sword');
      pr.x = x; pr.y = y; pr.fixed = true; pr.delay = o.delay; pr.orbit = 0; pr.life = 4; pr.abilityId = o.abilityId;
      pr.formation = { x: p.x, y: p.y, i, n: o.count, d0: o.delay };
    }
    this.emit('swordformation', p.x, p.y, { r: o.radius, n: o.count, d0: o.delay });
  }

  // the Blind Gentleman sharpens with every parry, dodge and counter
  gainFocus(f, why) {
    f.focus = Math.min(25, (f.focus || 0) + 1);
    if (why !== 'counter') f.lastDefT = this.t;
    if (f.focus % 5 === 0) this.emit('focus', f.x, f.y, { n: f.focus });
  }

  // sakura over the arena, every petal a cold blade
  sakuraFall(e) {
    const focus = e.focus || 0;
    e.petalAt = this.t + Math.max(2.2, 6 - focus * 0.14 - (e.lives || 0) * 0.4);
    const foes = this.hostiles(e), n = 3 + Math.floor(focus / 4) + (e.lives || 0);
    for (let i = 0; i < n; i++) {
      const v = foes.length && i % 2 === 0 ? foes[Math.floor(this.rand() * foes.length)] : null, a = this.rand() * Math.PI * 2, rr = v ? 6 + this.rand() * 20 : this.rand() * (R - 12);
      let x = (v ? v.x : 0) + Math.cos(a) * rr, y = (v ? v.y : 0) + Math.sin(a) * rr;
      const r = Math.hypot(x, y); if (r > R - 6) { x *= (R - 6) / r; y *= (R - 6) / r; }
      this.hazards.push({ kind: 'sigil', variant: 'sakura', x, y, r: 7, t: 1.1 + i * 0.08, delay: 1.1 + i * 0.08, dmg: 5 + focus * 0.25, kb: 20, trueDmg: true, team: e.team, src: e });
    }
    this.emit('sakura', 0, 0, { n });
  }

  // Mahoraga's wheel: how hard this kind of attack still hurts it
  adaptCat(atk, proj) {
    if (proj) return atk.unblockable ? 'spells' : 'projectiles';
    if (atk.id && BASE_MOVES[atk.id]) return atk.id;
    return atk.abilityId ? 'ab:' + atk.abilityId : atk.id || 'blows';
  }

  adaptTo(f, cat, amt) {
    if (!f.adapt) return 0;
    const before = f.adapt[cat] || 0;
    if (before >= 1) return before;
    if (!before && f.def && f.def.adaptSlots) { // only so many kinds on the wheel: the oldest is let go
      f.adaptOrder = (f.adaptOrder || []).filter(k => f.adapt[k] > 0);
      while (f.adaptOrder.length >= f.def.adaptSlots) { const old = f.adaptOrder.shift(); delete f.adapt[old]; this.emit('forgets', f.x, f.y, { cat: old }); }
      f.adaptOrder.push(cat);
    }
    const after = Math.min(1, before + amt * (f.phase === 2 ? 1.5 : 1));
    f.adapt[cat] = after;
    if (Math.floor(after * 4) > Math.floor(before * 4)) { // a quarter turn: it heals and steadies
      f.wheel = (f.wheel || 0) + 1; f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.025); f.posture = 0;
      this.emit('wheelturn', f.x, f.y, { cat, n: Math.floor(after * 4) });
      if (after >= 1) this.emit('adapted', f.x, f.y, { cat });
    }
    return after;
  }

  // anything long and straight: a staff, a cut through space, the sword of extermination
  lineHit(src, x0, y0, x1, y1, hw, atk, team) {
    const asProj = team !== undefined, side = asProj ? team : src.team, dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1, L = Math.sqrt(L2);
    for (const f of this.fighters()) {
      if (f.team === side || !this.active(f) || (!atk.pierceAll && this.airborne(f, src))) continue;
      const k = clamp(((f.x - x0) * dx + (f.y - y0) * dy) / L2, 0, 1), px = x0 + dx * k, py = y0 + dy * k;
      if (Math.hypot(f.x - px, f.y - py) > hw + f.r) continue;
      this.receiveHit(f, asProj ? null : src, { ...atk, src: atk.src || src }, dx / L, dy / L, asProj);
    }
  }

  // a bloater bursting: acid everywhere
  bloaterBurst(f) {
    f.burst = true;
    for (const v of this.hostiles(f)) {
      const d = Math.hypot(v.x - f.x, v.y - f.y) || 1;
      if (d <= 18 + v.r && !this.airborne(v)) this.receiveHit(v, null, { id: 'bile', dmg: 16, kb: 90, hitPosture: 15, unblockable: true, poison: 3, poisonT: 2, src: f }, (v.x - f.x) / d, (v.y - f.y) / d, true);
    }
    this.addZone(f, f.team, f.x, f.y, { variant: 'acid', r: 12, life: 3, dps: 3 });
    this.emit('bileburst', f.x, f.y);
  }

  // ---------- lingering conditions: poison, slows, polymorph, charm, cocoons, grips ----------

  // is this fighter living under one of the Scholar's rewritten rules right now?
  ruled(f, rule) { const S = this.scripture; return !!(S && S.rule === rule && f && f.team !== S.team); }

  updateStatus(f) {
    if (f.inkShieldT > 0) f.inkShieldT -= DT;
    if (f.hasteT > 0) f.hasteT -= DT;
    if (f.poisonT > 0) {
      f.poisonT -= DT;
      if ((f.poisonTick = (f.poisonTick || 0) - DT) <= 0) { f.poisonTick = 0.5; this.dot(f, f.poisonDps * 0.5, f.poisonBy, 'poison'); }
      if (f.poisonT <= 0) f.poisonDps = 0;
    }
    for (const k of ['spinGuardT', 'creepT', 'slowT', 'polyT', 'charmT', 'liftT', 'cocoonT', 'gravT', 'webT', 'corrodeT', 'wardedT', 'armorT', 'wetT', 'pressureT']) if (f[k] > 0) f[k] -= DT;
  }

  // Damage over time: no flinch, no knockback, no fanfare.
  dot(f, dmg, by, kind) {
    if (f.adapt) { dmg *= 1 - 0.9 * Math.min(1, f.adapt[kind] || 0); this.adaptTo(f, kind, 0.03); }
    if (f.def && f.def.fireImmune && kind === 'fire') return;
    dmg = Math.min(dmg, f.hp);
    if (dmg <= 0 || f.dead || f.invulnT > 0 || f.lastStand) return;
    if (f.def && f.def.conceptual) dmg = 1;
    if (f.def && f.def.broodBound && this.enemies.some(m => m.summoner === f.id && !m.dead && !m.def.inferior && !m.spilled)) dmg = Math.min(dmg, Math.max(0, f.hp - 1));
    if (by) { f.lastHitBy = by; by.dmgOut += dmg; }
    f.hp -= dmg; if (f === this.p && f.hp > 0 && f.hp < f.maxHp * 0.05) this.stats.belowFive = true; f.dmgIn += dmg; f.lastHurtT = this.t;
    if (f === this.p) { if (!this.battle) this.stats.dmgTaken += dmg; }
    else if (!this.battle && !this.friendlyToHero(f)) this.stats.dmgDealt += dmg;
    this.emit('dot', f.x, f.y, { dmg: Math.round(dmg), kind });
  }

  applyStatus(t, atk, by) {
    const exposed = this.ruled(t, 'exposed'); // nothing shields the flesh: no resisting conditions either
    if (t.adapt && !exposed && STATUS_KEYS.some(k => atk[k] && k !== 'poisonT' && k !== 'liftDmg')) { // the wheel learns conditions too
      const resist = 0.5 + 0.5 * Math.min(1, t.adapt.status || 0);
      this.adaptTo(t, 'status', 0.15);
      if (this.rand() < resist) { this.emit('resist', t.x, t.y); return; }
    }
    const immune = t.def && t.def.statusImmune && !exposed;
    if (atk.poison) { t.poisonT = Math.max(t.poisonT || 0, atk.poisonT || 3); t.poisonDps = Math.max(t.poisonDps || 0, atk.poison); t.poisonBy = by; }
    if (atk.corrode) t.corrodeT = Math.max(t.corrodeT || 0, atk.corrode);
    if (atk.wet) t.wetT = Math.max(t.wetT || 0, atk.wet);
    if (atk.nail) t.nails = Math.min(6, (t.nails || 0) + 1); // a nail stays in you, for the doll to find
    if (immune) return;
    if (atk.slow) t.slowT = Math.max(t.slowT || 0, atk.slow);
    if (atk.fear && by && !(t.def && t.def.boss)) this.inflictFear(t, by, atk.fear);
    if (atk.freeze && !(t.def && t.def.boss) && !this.resists(t)) { t.frozenT = Math.max(t.frozenT || 0, atk.freeze); this.emit('freeze', t.x, t.y); }
    // the controls below don't take on bosses, and ??? shrugs off half of them
    if (!(atk.poly || atk.charm || atk.cocoon || atk.lift || atk.grab) || t.dead || (t.def && t.def.boss) || t.state === 'egg' || (!exposed && this.resists(t))) return;
    t.guard = false;
    if (atk.poly) { t.polyT = atk.poly; if (t.state === 'wind') t.state = 'idle'; this.emit('polymorph', t.x, t.y); }
    if (atk.charm && by) { t.charmT = atk.charm; t.charmBy = by; this.emit('charm', t.x, t.y); }
    if (atk.cocoon) { t.cocoonT = atk.cocoon; t.frozenT = Math.max(t.frozenT || 0, atk.cocoon); this.emit('cocoon', t.x, t.y); }
    if (atk.lift) {
      t.liftT = atk.lift; t.frozenT = Math.max(t.frozenT || 0, atk.lift);
      this.hazards.push({ kind: 'sigil', variant: 'gravslam', x: t.x, y: t.y, r: 9, t: atk.lift, delay: atk.lift, dmg: atk.liftDmg || 16, kb: 40, team: by ? by.team : -1, src: by });
      this.emit('lift', t.x, t.y);
    }
    if (atk.grab && by && !by.dead) {
      t.heldT = atk.grab.hold; t.frozenT = Math.max(t.frozenT || 0, atk.grab.hold);
      this.grabs.push({ t: atk.grab.hold, target: t, by, o: atk.grab });
      this.emit('grab', t.x, t.y);
    }
  }

  // Held in a pincer, then thrown.
  updateGrabs() {
    for (const g of this.grabs) {
      const v = g.target, a = g.by;
      g.t -= DT;
      if (a.dead || v.dead || a.state === 'stun') { g.t = -1; v.heldT = 0; v.frozenT = 0; continue; }
      if (g.t > 0) { v.x = a.x + a.fx * (a.r + v.r + 1); v.y = a.y + a.fy * (a.r + v.r + 1); continue; }
      v.heldT = 0; v.frozenT = 0;
      let ux = a.fx, uy = a.fy;
      if (g.o.pushOut) { const r = Math.hypot(v.x, v.y) || 1; ux = v.x / r; uy = v.y / r; }
      this.receiveHit(v, a, { id: 'throw', dmg: g.o.dmg, kb: g.o.kb, hitPosture: g.o.hitPosture, unblockable: true }, ux, uy);
      this.emit('throw', v.x, v.y);
    }
    this.grabs = this.grabs.filter(g => g.t > 0);
  }

  speedFactor(f) {
    let k = 1;
    if (f.slowT > 0) k *= 0.55;
    if (f.pressureT > 0) k *= 1 - f.pressure.slow;
    if (f.hasteT > 0) k *= 1.35;
    if (f.gravT > 0) k *= 0.5;
    if (f.armorT > 0) k *= 1 + (f.armorHaste || 0);
    if (f.momentum) k *= 1 + f.momentum * 0.03;
    if (f.creepT > 0) k *= 1.3;
    if (this.T(f, 'kaioken') && f.hp > f.maxHp * 0.3) k *= 1.25;
    if (this.T(f, 'juggernaut')) k *= 0.9;
    if (f.focus) k *= 1 + f.focus * 0.02;
    return k;
  }

  // What a body or a buff takes off an incoming blow.
  bodyMult(t, atk) {
    let m = 1;
    if (t.armorT > 0) m *= 1 - (t.armorDR || 0);
    if (t.wardedT > 0) m *= 0.6;
    if (t.corrodeT > 0) m *= 1.25;
    const d = t.def;
    if (!d) return m;
    if (d.shell && !t.molted) { // caught mid-attack, the crab is open; otherwise it's all shell
      if (t.state === 'act' && t.atk && t.atk.id === 'shellspin') m *= 0.4;
      else if (t.state !== 'wind' && t.state !== 'recover' && t.state !== 'stun') { m *= 0.5; this.emit('clank', t.x, t.y); }
    }
    if (t.stone > 0) {
      if (atk.id === 'heavy' || atk.id === 'kick' || atk.breaksGuard) { t.stone = Math.max(0, t.stone - 2); this.emit('crack', t.x, t.y, { n: t.stone }); }
      m *= 1 - 0.12 * t.stone;
    }
    if (t.headless) m *= 1.5;
    if (d.dr) m *= 1 - (t.phase === 2 && d.dr2 != null ? d.dr2 : d.dr); // a body that simply takes less
    return m;
  }

  gainMomentum(a) {
    a.momentum = Math.min(10, (a.momentum || 0) + 1); a.momentumAt = this.t;
    if (a.momentum === 5 || a.momentum === 10) this.emit('momentum', a.x, a.y, { n: a.momentum });
  }

  // A skill as this foe would cast it right now: the Phoenix's fire grows with its heat.
  empower(e, s) {
    if (e.def.manual && s.sword) return this.swordCast(e, s);
    if (!e.def.phoenix || !(e.heat > 0)) return s;
    const k = 1 + e.heat / 200;
    return { ...s, shots: s.shots && s.shots + Math.floor(e.heat / 40), radius: s.radius && s.radius * (s.kind === 'slam' ? k : 1), range: s.range && s.range * k };
  }

  // ---------- the Magician's illusions ----------
  spawnDecoy(e, x, y) {
    const m = this.spawnMinion('mirage', x, y, e);
    if (!m) return null;
    m.def = { ...m.def, sprite: e.def.sprite || e.type, name: e.def.name, humanoid: e.def.humanoid, floating: e.def.floating };
    m.r = e.r; m.mirrorOf = e.id; m.state = 'idle'; m.st = 0; m.fx = e.fx; m.fy = e.fy; m.cds.ai = 0.3;
    return m;
  }

  substitute(t) {
    this.spawnDecoy(t, t.x, t.y);
    const a = Math.atan2(t.fy, t.fx) + (this.rand() < 0.5 ? 1.7 : -1.7);
    let x = t.x + Math.cos(a) * 30, y = t.y + Math.sin(a) * 30;
    const r = Math.hypot(x, y); if (r > R - 10) { x *= (R - 10) / r; y *= (R - 10) / r; }
    this.emit('poof', t.x, t.y, { sub: true });
    t.x = x; t.y = y; t.state = 'idle'; t.kvx = t.kvy = 0;
    this.emit('poof', t.x, t.y);
  }

  // ---------- thrown things, and what they leave behind ----------
  lob(e, tx, ty, atk, land) {
    const r = Math.hypot(tx, ty); if (r > R - 4) { tx *= (R - 4) / r; ty *= (R - 4) / r; }
    const T = atk.flight || 0.7;
    const pr = { x: e.x, y: e.y, x0: e.x, y0: e.y, tx, ty, vx: (tx - e.x) / T, vy: (ty - e.y) / T, arcT: 0, arcDur: T, arcH: atk.height || 28, z: 0, lob: true,
      dmg: 0, team: e.team, owner: this.ownerTag(e.team), src: e, life: T + 1, kind: atk.proj || 'boulder', flask: atk.flask, land: land || atk.land || {}, abilityId: atk.abilityId };
    this.proj.push(pr);
    return pr;
  }

  lobLand(pr) {
    const L = pr.land, r = L.r || 8;
    this.tintNow = pr.tint || null;
    this.emit('lobland', pr.x, pr.y, { kind: pr.kind, flask: pr.flask, r, variant: L.variant || (L.zone && L.zone.variant) });
    for (const f of this.fighters()) {
      if (f.team === pr.team || !this.active(f) || this.airborne(f)) continue;
      const d = Math.hypot(f.x - pr.x, f.y - pr.y);
      if (d > r + f.r) continue;
      this.receiveHit(f, null, { id: L.id || pr.kind, dmg: L.dmg || 0, kb: L.kb || 20, hitPosture: L.hitPosture || 8, unblockable: true, src: pr.src, abilityId: pr.abilityId, fromSpecial: pr.fromSpecial, ...statusOf(L) },
        d ? (f.x - pr.x) / d : 0, d ? (f.y - pr.y) / d : 0, true);
    }
    if (L.zone) this.addZone(pr.src, pr.team, pr.x, pr.y, L.zone, pr.abilityId);
  }

  // an explosive arrow going off
  blast(pr) {
    const b = pr.explode;
    pr.explode = null;
    this.emit('lobland', pr.x, pr.y, { kind: 'blast', r: b.r, variant: 'blast' });
    for (const f of this.fighters()) {
      if (f.team === pr.team || !this.active(f) || this.airborne(f)) continue;
      const d = Math.hypot(f.x - pr.x, f.y - pr.y);
      if (d <= b.r + f.r) this.receiveHit(f, null, { id: 'bombarrow', dmg: b.dmg, kb: b.kb, hitPosture: 15, unblockable: true, src: pr.src }, d ? (f.x - pr.x) / d : 0, d ? (f.y - pr.y) / d : 0, true);
    }
  }

  addZone(src, team, x, y, z, abilityId) {
    this.hazards.push({ kind: 'zone', variant: z.variant, x, y, r: z.r, life: z.life, max: z.life, dps: z.dps || 0, ally: !!z.ally, team, src, abilityId, t: 1, delay: 1 });
  }

  // Webs, poison clouds, fire, frost, acid, crushing gravity and barrier arrays.
  updateZone(h) {
    h.life -= DT;
    for (const f of this.fighters()) {
      if (!this.active(f) || Math.hypot(f.x - h.x, f.y - h.y) > h.r + f.r * 0.5) continue;
      if (h.ally) { // allies inside: a barrier's cover, or creep that feeds the swarm (and slows everyone else)
        if (f.team === h.team) { if (h.variant !== 'creep') f.wardedT = 0.1; else if (f.def && f.def.zerg) { f.hp = Math.min(f.maxHp, f.hp + 3 * DT); f.creepT = 0.1; } }
        else if (h.variant === 'creep' && !this.airborne(f) && !(f.def && f.def.statusImmune)) f.slowT = Math.max(f.slowT || 0, 0.15);
        continue;
      }
      if (f.team === h.team || this.airborne(f)) continue;
      const fly = f.def && f.def.floating;
      switch (h.variant) {
        case 'web':
          if (fly || (f.def && f.def.wallCrawler)) break;
          f.webT = 0.2; f.slowT = Math.max(f.slowT || 0, 0.2);
          if (this.t >= (f.webFreeAt || 0) && !(f.def && f.def.statusImmune) && !this.resists(f)) { f.rootT = Math.max(f.rootT, 1.0); f.webFreeAt = this.t + 2.4; this.emit('webbed', f.x, f.y); }
          break;
        case 'poison': f.poisonT = Math.max(f.poisonT || 0, 1.0); f.poisonDps = Math.max(f.poisonDps || 0, h.dps || 4); f.poisonBy = h.src; break;
        case 'acid': f.corrodeT = Math.max(f.corrodeT || 0, 0.5); f.poisonT = Math.max(f.poisonT || 0, 0.6); f.poisonDps = Math.max(f.poisonDps || 0, h.dps || 2); f.poisonBy = h.src; break;
        case 'fire': if (this.t >= (f.burnAt || 0)) { f.burnAt = this.t + 0.5; this.dot(f, (h.dps || 6) * 0.5, h.src, 'fire'); } break;
        case 'frost': if (!(f.def && f.def.statusImmune)) f.slowT = Math.max(f.slowT || 0, 0.3); break;
        case 'rubble': if (!fly && !(f.def && f.def.statusImmune)) f.slowT = Math.max(f.slowT || 0, 0.15); break;
        case 'heavy': if (!(f.def && f.def.statusImmune)) f.gravT = 0.1; break;
      }
    }
  }

  // The Formation Master's arrays going off: the bagua spares only its life gate; the swap exchanges places.
  triggerArray(h, foes) {
    if (h.kind === 'swap') {
      const a = h.a, b = h.b;
      if (a.dead || b.dead || !this.active(a)) return;
      if (Math.hypot(b.x - h.x, b.y - h.y) > 16 || this.airborne(b) || (b.def && (b.def.statusImmune || b.def.boss))) { this.emit('escaped', b.x, b.y); return; }
      this.emit('swap', a.x, a.y, { tx: b.x, ty: b.y });
      [a.x, b.x] = [b.x, a.x]; [a.y, b.y] = [b.y, a.y]; a.kvx = a.kvy = b.kvx = b.kvy = 0;
      return;
    }
    this.emit('baguaburst', h.x, h.y, { r: h.r, gate: h.gate });
    for (const f of foes) {
      const dx = f.x - h.x, dy = f.y - h.y, d = Math.hypot(dx, dy);
      if (d > h.r + f.r) continue;
      let da = Math.atan2(dy, dx) - h.gate;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      if (d > h.r * 0.35 && Math.abs(da) < 0.5) { this.emit('lifegate', f.x, f.y); continue; } // standing in the life gate
      this.receiveHit(f, null, { id: 'bagua', dmg: h.dmg, kb: h.kb, hitPosture: 25, unblockable: true, src: h.src, abilityId: h.abilityId }, d ? dx / d : 0, d ? dy / d : 0, true);
    }
  }

  // ---------- the Hydra's heads ----------
  newHead(i) { return { alive: true, cd: 0.8 + this.rand() * 1.5, wind: 0, kind: HEAD_KINDS[i % 3], grow: 0, act: null }; }

  updateHeads(e) {
    const H = e.heads;
    for (const h of H) if (!h.alive && h.grow > 0 && (h.grow -= DT) <= 0) { // two grow back where one was cut
      h.alive = true; h.cd = 1.2; h.kind = HEAD_KINDS[Math.floor(this.rand() * 3)];
      if (H.length < e.def.hydra.max) H.push(this.newHead(Math.floor(this.rand() * 3)));
      this.emit('regrow', e.x, e.y, { n: H.filter(x => x.alive).length });
    }
    e.headless = !H.some(h => h.alive || h.grow > 0);
    if (e.state === 'stun' || e.state === 'spawn' || e.polyT > 0 || e.cocoonT > 0) return;
    const p = this.targetOf(e);
    if (!p) return;
    const gap = Math.hypot(p.x - e.x, p.y - e.y) - e.r - p.r;
    for (const h of H) {
      if (!h.alive) continue;
      if (h.wind > 0) { if ((h.wind -= DT) <= 0) this.headStrike(e, h, p); continue; }
      if ((h.cd -= DT) > 0) continue;
      let kind = h.kind;
      if (kind === 'spit' && gap < 22) kind = 'bite';
      if (kind === 'flame' && gap > 38) kind = 'spit';
      if ((kind === 'bite' && gap > 26) || (kind === 'spit' && gap > 150) || H.some(o => o.wind > 0.25)) { h.cd = 0.25; continue; } // out of reach, or another head is rearing
      h.act = kind; h.wind = 0.5;
      this.emit('headwind', e.x, e.y, { kind });
    }
  }

  headStrike(e, h, p) {
    h.cd = 1.4 + this.rand() * 1.2;
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    const near = (range, arc) => this.hostiles(e).filter(v => {
      const vx = v.x - e.x, vy = v.y - e.y, vd = Math.hypot(vx, vy) || 1;
      return !this.airborne(v, e) && vd - v.r - e.r <= range && (vx * ux + vy * uy) / vd > Math.cos(arc);
    });
    if (h.act === 'bite') {
      this.emit('headbite', e.x + ux * (e.r + 8), e.y + uy * (e.r + 8), { fx: ux, fy: uy });
      for (const v of near(28, 0.9)) { const vd = Math.hypot(v.x - e.x, v.y - e.y) || 1; this.receiveHit(v, e, { id: 'headbite', dmg: 9, kb: 50, hitPosture: 10, blockPosture: 14, parryPosture: 18 }, (v.x - e.x) / vd, (v.y - e.y) / vd); }
    } else if (h.act === 'spit') {
      const pr = this.fire(e, ux, uy, 160, 6, 'acid');
      pr.poison = 4; pr.poisonT = 3;
      this.emit('headspit', e.x, e.y, { fx: ux, fy: uy });
    } else {
      this.emit('cone', e.x, e.y, { fx: ux, fy: uy, range: 38, angle: 0.4, variant: 'fire' });
      for (const v of near(38, 0.4)) { const vd = Math.hypot(v.x - e.x, v.y - e.y) || 1; this.receiveHit(v, e, { id: 'headflame', dmg: 10, kb: 40, hitPosture: 8, unblockable: true, fire: true }, (v.x - e.x) / vd, (v.y - e.y) / vd); }
    }
  }

  // Wounds sever heads; heavies and fire seal the stumps before they grow back.
  hydraWound(t, atk, dealt) {
    const fire = atk.fire || atk.burn || atk.variant === 'fire' || atk.id === 'breath' || atk.id === 'spray';
    if (atk.id === 'heavy' || fire) {
      const s = t.heads.findIndex(h => !h.alive && h.grow > 0);
      if (s >= 0) { t.heads.splice(s, 1); this.emit('cauterize', t.x, t.y); }
    }
    t.severAcc = (t.severAcc || 0) + dealt;
    if (t.severAcc < t.maxHp * 0.14) return;
    t.severAcc = 0;
    const alive = t.heads.filter(h => h.alive);
    if (!alive.length) return;
    const h = alive[Math.floor(this.rand() * alive.length)];
    h.alive = false; h.grow = 5; h.wind = 0;
    this.emit('sever', t.x, t.y, { i: t.heads.indexOf(h), n: t.heads.length });
  }

  // ---------- bodies that change as the fight goes on ----------
  updateStone(e) {
    e.stone = e.stone || 0;
    const still = e.state !== 'act' && !e.mvx && !e.mvy && Math.hypot(e.kvx, e.kvy) < 5;
    if (still) {
      e.softT = 0;
      if ((e.hardT = (e.hardT || 0) + DT) >= 0.7 && e.stone < 5) { e.hardT = 0; e.stone++; this.emit('harden', e.x, e.y, { n: e.stone }); }
    } else {
      e.hardT = 0;
      if ((e.softT = (e.softT || 0) + DT) >= 1.0 && e.stone > 0) { e.softT = 0; e.stone--; }
    }
  }

  checkMutation(e) {
    const want = Math.min(4, Math.floor((1 - e.hp / e.maxHp) / 0.2 + 1e-6));
    if (want <= e.mutations.length || !(e.state === 'idle' || e.state === 'recover')) return;
    const pool = Object.keys(MUTATIONS).filter(k => !e.mutations.includes(k));
    const k = pool[Math.floor(this.rand() * pool.length)], m = MUTATIONS[k];
    e.mutations.push(k);
    if (m.tal) e.tal = { ...(e.tal || {}), ...m.tal };
    if (m.speed) e.speedMul *= 1 + m.speed;
    if (m.reach) e.moves = { ...e.moves, strike: { ...e.moves.strike, range: e.moves.strike.range + m.reach }, heavy: { ...e.moves.heavy, range: e.moves.heavy.range + m.reach } };
    if (m.add) { e.specials = e.specials.concat([m.add]); e.cds[m.add.id] = 0.5; }
    e.state = 'morph'; e.st = 0.6; e.guard = false; e.plan = null; e.chainAt = 0;
    this.emit('mutate', e.x, e.y, { name: m.name, key: k });
  }

  updateHeat(e) {
    if (e.state === 'egg') return;
    const before = e.heat || 0, lvl = h => h >= 100 ? 3 : h >= 66 ? 2 : h >= 33 ? 1 : 0;
    e.heat = Math.min(100, before + (e.tgt ? 4 : 0) * DT);
    if (lvl(e.heat) > lvl(before)) this.emit('heatup', e.x, e.y, { lvl: lvl(e.heat) });
    if (e.heat >= 90 && this.t >= (e.sunAt || 0)) { // white-hot: standing close burns
      e.sunAt = this.t + 0.5;
      for (const v of this.hostiles(e)) if (!this.airborne(v) && Math.hypot(v.x - e.x, v.y - e.y) < e.r + 16 + v.r) this.dot(v, 2, e, 'fire');
    }
  }

  // the Phoenix's egg: break it in time, or the bird rises again
  updateEgg(e) {
    e.eggT -= DT; e.flash -= DT;
    if (e.eggT > 0) return;
    e.rebirths = (e.rebirths || 0) + 1;
    e.state = 'recover'; e.st = 0.4; e.hp = e.maxHp; e.posture = 0;
    e.heat = Math.min(100, 40 * e.rebirths); e.dmgMul = (e.dmgMul || 1) * 1.3; e.speedMul *= 1.1; e.cdMul *= 0.85;
    e.spriteNow = e.rebirths >= 2 ? 'phoenix3' : 'phoenix2';
    this.slamHit(e, { id: 'rebirth', radius: 36, dmg: 18, kb: 200, unblockable: true, hitPosture: 20, variant: 'sun', fire: true });
    this.emit('rebirth', e.x, e.y, { n: e.rebirths });
  }

  // the Crab Warrior sheds its shell: softer, but faster and angrier
  molt(e) {
    e.molted = true; e.state = 'morph'; e.st = 0.8; e.guard = false; e.plan = null; e.chainAt = 0;
    const n = e.maxHp * 0.2; e.hp = Math.min(e.maxHp, e.hp + n);
    e.speedMul *= 1.35; e.dmgMul = (e.dmgMul || 1) * 1.25; e.spriteNow = 'crab_molt';
    this.emit('molt', e.x, e.y); this.emit('heal', e.x, e.y, { n: Math.round(n) });
  }

  startMorph(e, form) {
    e.trueFormed = true; e.state = 'morph'; e.st = 1.0; e.morphTo = form; e.guard = false; e.plan = null; e.chainAt = 0;
    this.emit('morphStart', e.x, e.y, { name: form.name, color: form.color });
  }

  updateMorph(e) {
    e.st -= DT;
    if (e.st > 0) return;
    e.state = 'idle';
    if (!e.morphTo) return;
    const form = e.morphTo;
    e.morphTo = null;
    this.applyForm(e, form);
    for (const v of this.hostiles(e)) { const d = Math.hypot(v.x - e.x, v.y - e.y) || 1; if (d < 32) { v.kvx += (v.x - e.x) / d * 80; v.kvy += (v.y - e.y) / d * 80; } }
    this.emit('trueform', e.x, e.y, { name: form.name, color: form.color });
  }

  // Take on another shape: its body, reach and moves (the Shapeshifter's beasts, the Kitsune).
  applyForm(e, form) {
    const base = e.baseDef || e.def;
    e.baseDef = base;
    e.def = { ...base, ...form, moves: moveSet(form.moves || {}), specials: form.specials };
    e.moves = e.def.moves; e.r = form.r || base.r; e.mass = form.mass || base.mass; e.postureMul = form.postureMul || base.postureMul;
    e.specials = form.specials.slice();
    for (const s of e.specials) e.cds[s.id] = 0.5 + this.rand() * 0.8;
    if (form.heal) { const n = Math.min(e.maxHp - e.hp, e.maxHp * form.heal); e.hp += n; this.emit('heal', e.x, e.y, { n: Math.round(n) }); }
  }

  // A Monkey King hair clone: indistinguishable from him, casting what he casts (ultimates too), at 30% of the damage.
  dressClone(m, w) {
    const src = w.def, giant = w.phase === 2, u = giant ? src.ult2 : src.ult;
    m.def = { ...m.def, sprite: giant ? src.sprite2 : src.sprite, scale: src.scale || 1, name: src.name, color: src.color, humanoid: true,
      kingClone: true, ultAnyHp: true, kbOut: 0.2, ult: u && { ...u, steps: u.steps.filter(st => st[1] !== 'monkeyswarm') }, ult2: null, specials: [] };
    m.specials = w.specials.filter(sp => sp.kind !== 'summon').map(sp => ({ ...sp }));
    for (const sp of m.specials) m.cds[sp.id] = 1 + this.rand() * 2.5;
    m.cds.ult = 5 + this.rand() * 8;
    m.moves = w.moves; m.r = w.r; m.cloneDmg = 0.25; m.giant = w.giant; m.phase = giant ? 2 : 1;
  }

  // the Shapeshifter's next beast: 50% more health, 35% more damage, and a little healing every time
  shiftInto(e) {
    const keys = Object.keys(SHIFT_FORMS).filter(k => k !== e.lastForm), k = keys[Math.floor(this.rand() * keys.length)], form = SHIFT_FORMS[k];
    if (!e.baseMaxHp) e.baseMaxHp = e.maxHp;
    const frac = e.hp / e.maxHp;
    this.applyForm(e, form); e.form = k; e.lastForm = k; e.formT = 6; e.formDmg = 1.35;
    e.maxHp = Math.round(e.baseMaxHp * 1.5);
    const heal = e.maxHp * 0.15;
    e.hp = Math.min(e.maxHp, e.maxHp * frac + heal);
    this.emit('shiftform', e.x, e.y, { name: form.name, color: form.color }); this.emit('heal', e.x, e.y, { n: Math.round(heal) });
  }

  revertForm(e) {
    if (!e.baseDef) return;
    e.def = e.baseDef; e.moves = e.def.moves; e.r = e.def.r; e.mass = e.def.mass; e.postureMul = e.def.postureMul;
    e.specials = e.def.specials.slice(); e.form = null; e.cds.shift = 2.5;
    this.emit('shiftform', e.x, e.y, { name: e.def.name, color: '#c9a66b', back: true });
  }

  // Bodies push apart; anyone rolling or lunging slips through.
  separate() {
    const all = this.fighters().filter(f => this.active(f));
    for (let i = 0; i < all.length; i++) {
      const a = all[i];
      for (let j = i + 1; j < all.length; j++) {
        const b = all[j];
        if (a.state === 'roll' || b.state === 'roll' || a.state === 'act' || b.state === 'act') continue;
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = a.r + b.r;
        if (d > 0 && d < min) {
          // heavier bodies get moved less
          const push = min - d, ux = dx / d, uy = dy / d, wa = b.mass / (a.mass + b.mass), wb = 1 - wa;
          a.x -= ux * push * wa; a.y -= uy * push * wa; b.x += ux * push * wb; b.y += uy * push * wb;
        }
      }
    }
  }
}

// Reward weights. The learner is paid the change in rewardScore after every decision.
const DEFAULT_REWARDS = {
  dmgDealt: 1, kills: 20, ringOuts: 10, dmgTaken: -1, parries: 6, blocks: 0.5, postureBreaks: 10,
  stunned: -10, evades: 1, whiffs: -0.3, fell: -20, died: -30, survival: 0,
  reach: 1.5, // closing distance and time within striking range of the nearest foe
};

function rewardScore(s, t, w) {
  let r = t * w.survival;
  for (const k in w) if (k !== 'survival' && s[k]) r += s[k] * w[k];
  return r;
}
