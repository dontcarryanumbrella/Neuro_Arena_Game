// Persistent station milestones and evidence-based observations of autonomous fights.
function stationAccess(c, hasAbility, hasTalents = false, hasAppearance = false) {
  const earned = c.unlocks || {};
  return {
    portal: true, tally: true, urns: true, stone: true, lid: true,
    pavilion: !!earned.pavilion || Object.keys(c.met || {}).length > 0,
    hearth: !!earned.hearth || hasAbility,
    altar: (c.deaths || 0) >= 1000 || hasTalents,
    mirror: !!earned.mirror || (c.order || []).length > 0 || hasAppearance || c.cycle > 0,
  };
}
function fightObservation(sim, mode) {
  const s = sim.stats, o = sim.observation || { foes: {}, ranged: {}, bosses: {} };
  return {
    mode, foes: Object.keys(o.foes).sort(), bosses: Object.keys(o.bosses),
    ranged: Object.fromEntries(Object.entries(o.ranged).map(([t, v]) => [t, { time: v.time, close: v.close }])),
    seconds: sim.t, died: !!s.died, fell: !!s.fell, parries: s.parries || 0,
    evades: s.evades || 0, stunned: s.stunned || 0, result: s.result,
  };
}
function observationNotes(history) {
  if (!history.length) return ['Observations appear after you complete a fight.'];
  const last = history[history.length - 1], notes = [];
  const label = last.mode === 'campaign' ? 'World fight' : 'Memory fight';
  if (last.fell) notes.push(`${label}: fell out of the arena after ${Math.round(last.seconds)} seconds.`);
  else if (last.died) notes.push(`${label}: died after ${Math.round(last.seconds)} seconds; stunned ${last.stunned} times and parried ${last.parries} attacks.`);
  else if (last.result === 'time') notes.push(`${label}: reached the time limit; parried ${last.parries} attacks and evaded ${last.evades}.`);
  else notes.push(`${label}: survived; parried ${last.parries} attacks and evaded ${last.evades}.`);
  // Compare only the same mode, opponent roster and build. These are observations, not causal claims.
  const same = history.filter(x => x.context === last.context).slice(-10);
  for (const t of Object.keys(last.ranged)) {
    const recent = same.filter(x => x.ranged[t] && x.ranged[t].time >= 5).slice(-5);
    if (recent.length >= 3 && recent.every(x => x.ranged[t].close === 0)) {
      const deaths = recent.filter(x => x.died).length;
      notes.push(`Across ${recent.length} recent fights against ${ENEMY_TYPES[t].name}, you never reached striking distance (${deaths} deaths). Try a closing-distance reward or a ranged ability.`);
      break;
    }
  }
  if (same.length === 10) {
    for (const [key, name] of [['parries', 'Parrying'], ['evades', 'Evasion']]) {
      const rate = xs => xs.reduce((n, x) => n + x[key], 0) / Math.max(1, xs.reduce((n, x) => n + x.seconds, 0)) * 60;
      const before = rate(same.slice(0, 5)), after = rate(same.slice(5));
      if (after >= before + 2 && after >= before * 1.3 && same.slice(5).filter(x => x[key] > 0).length >= 4) {
        notes.push(`${name} is becoming more consistent: ${after.toFixed(1)} per minute over the last five comparable fights, up from ${before.toFixed(1)} in the previous five.`);
      }
    }
  }
  return notes;
}
