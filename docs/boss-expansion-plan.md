# Boss and World Expansion Plan

Status: planned, nothing built. Written 2026-11-02 from a design session. Line references are to the code as of commit `9e1a5a3`.
Companion to `docs/campaign-plan.md` (which stays authoritative for everything not changed here).

Naming note: English names and Japanese names for the Nine-Tailed Fox, and the Yellow Spring Ancestor's skill names, are Tom's. Every other Chinese or English name here is a **suggestion** written to match the existing lore names, and is open to change.

Art rule for everything new: paint at 1x with texture and shading, then scale 4x unsmoothed. Flat vector shapes read as weak.

---

## Progress (as of 2026-11-04)

Build order steps 1 to 8 and the leftover pass are done and committed; steps 9 and 10 are not started. 20 of 20 seals exist. 16 test suites pass.

### Done
| Plan section | What was built | Commit |
|---|---|---|
| 1, 3. Campaign | Temple to Tier III with Sun Wukong (Victorious Fighting Buddha); seal and talisman counts follow the boss list; save migration (saves that reached the door get new seals); Abyss order Queen then Ancestor; Isles order Fox then Blind Gentleman; 4-minute rooms for the four longest bosses | `5e04c3a`, `a275ee6`, `0f23723` |
| 2. Shared tech | Stage system with a third stage; phase gates on every boss; transition heals; pressure; nemesis (UNDEAD/STRANGE); `wet`; pair support and two-bar HUD; lives; fixtures (springs, lanterns, stones); immobile boss; Forgetfulness, confusion, cursed; talent masking; skill and special sealing; rain; day/night dial; whirlpool | `6db4795`, `7f42ad6`, later boss commits |
| 3.1 Temple additions | Temple Macaque, Mountain Ape, elite Sweeping Monk | `20bfcdc` |
| 4. Primordial Forest | Painted arena; 11 new foes plus promoted Tiger, Bear, Bunny; the Rabbit (Ink-Stained Jade Rabbit) and the Life Tree; vignette, fragment o8, Codex lines, techniques | `af5d28b`, `a275ee6` |
| 5. Dragon Emperor | Three stages, 900 HP, Dragon Majesty, Bane of the Unclean, all three kits and ultimates, rain heal, Golden Body, pearl window; humanoid stage 1 sprite; stage 3 drawn twice as big in correct proportions | `ce7425a`, `44aae4b` |
| 6. Venerables | One seal, one room; dial (Extremes Reverse); Mutual Shelter; Five Phases below 55%; merge into the Taiji Venerable; Sun and Moon kits and ultimates; Birth of All Things; models redrawn from Tom's references with halos; heavier transformation effects | `45d00c8`, `c8d5b27` |
| 7. Yellow Spring Ancestor | Both phases, Broth of Forgetting (talents), sealing, nine springs and reforming, Samsara, fishing elites and bosses, The Other Shore, both ultimates (No Return merged with the whirlpool; Wheel of Six Paths) | `f234230` |
| 8. Nine-Tailed Fox | Nine lives with a tail and art each; Dance of a Hundred Foxes (breakable); Nine Tails Eclipse the Moon; Heavenly Fox; The Fox That Cannot Be Caught; unringable; live tails and nine-pip bar | `0f23723` |
| 10. Nine Heavens additions | Frost Maiden, Tiangou, Shade Attendant, Qilin and Jade Toad elites | `20bfcdc` |
| 11. Lore | Vignettes (forest new; temple, abyss, isles, heavens revised), fragment o8, Codex lines for every new foe and boss | various |

### Leftover pass (2026-11-05): done
| Item | What was built | Commit |
|---|---|---|
| Supporting entries | Hero finales for all new bosses (the Emperor gets his own); new bosses in the sandbox list; the Rabbit's Codex line held back until the Black Sea; `petrify` for Killing Stones; README tier table and expansion section. The level curve needs no change (levels count felled types as a share of all types; existing saves sit a little lower until they fell the new foes). | `56339e5` |
| Emperor | Mandate of Heaven (stage 1 decrees can't be interrupted; summons +30%) | `7c6e7a2` |
| Ancestor | Ferries drag you along their lane; phase 2 Forgotten Reflection casts back your special | `7c6e7a2` |
| Fox | Ninefold Sovereignty (two or three tails at once on the ninth life); a wavering dashed edge on Dreamweaver's false sigils | `7c6e7a2` |
| Venerables | Stances (Unyielding, Yielding, Moon in the Water) rotating every 6s with auras; the Five Phases wheel laying hazards every 7s in Act 2; The Two Poles Turn joint ultimate with its turning floor and safe dots | `7c6e7a2` |
| Art | A painted shading pass on every new sprite (lit and shaded edges, grain); a hand-painted, live-drawn Life Tree (roots, bark, a face, a lit crown; blossoms when awake); the Emperor's sky-spanning coils above the stage in his true body; distinct art for each of the five phase beams (leaves, flames, falling stones, sparks, spray) | this pass |
| Fix | Live-drawn dragons were also drawing their plain sprite on top (from the pearl change in `ce7425a`) | this pass |

### Celestial passes (2026-11-07): done
| Item | What was built |
|---|---|
| Life Tree, Rabbit, Emperor, Venerables, Taiji | Painted Life Tree that keeps its elves like the Queen, pale and taller below half, and the White Stag at 0 HP; the Rabbit's moon phases and new kit; the Celestial Dragon at 1.7x; The Golden Dragon Coils the Heavens; unique Sun and Moon arts with enhanced Act 2 ultimates and The Two Poles Turn Back; the Taiji Venerable redrawn with its own kit, Yin/Yang shift and two ultimates (`js/celestial.js`) |
| 16.2 The Last Keeper | Its own definition (800 base HP), drawn as a man of light with a starburst head: three stages (the Keeper of the Jar, the Finished Gu at 60%, What Remains of Him at 25%), He Has Watched Every Life, your Former Selves, The Lid Is Lowered, Ten Thousand Iterations, The Keeper's Last Light. Still the Time Administrator's room with `finalKeeper` (`js/celestial2.js`) |
| 16.4 Sword Immortal stage 3 | At the Summit only: the Thirteenth reveals the Sword Without a Head (black robe, a burst of black blades for a head); stage 2's swords corrupted to ink, each answered by an ink afterimage; Black Sea Tide; the Fourteenth Sword: Cut at 10% (the world becomes a page and folds flat, a pencil line, one bare blade; step off the line and he sheathes and falls, or he draws it again) |
| Ancestor | Painted as the ferryman with a fishing pole under a board of eyes, then the river's shape bound in ribbons of eyes; elites every 6-7.5s, two at a time in his true form; spider lilies, golden water; a Six Paths wheel where every path is its own |
| Fox | Painted as a lady in red with a fan and a crown of fox ears; the Heavenly Fox a vast white fox with nine flame-like tails, and her clones take that shape; The Heavenly Fox Swallows the Moon; fixed her Heavenly stat boost, which a comment had swallowed |
| Third pass (2026-11-08, `js/celestial3.js`) | Tamamo at a cultivator's height, hand-placed, with a working fan; the Heavenly Fox painted pixel by pixel (moonlit fur, red markings, a bell at the throat) with nine bushy tails drawn each frame and foxfire circling it; the Ancestor redrawn small in both phases (the true shape a hooded, faceless spirit with a band of eyes); the Sword Without a Head at the Sword Immortal's own size and shape, all of his swords in ink; the Fourteenth Sword rebuilt as a cinematic (ink drain, seal, focus lines, the lock, impact frames, the page split with motion smear, ink thrown off the cut, his dash past you, the delayed burst when he sheathes) |

### Still open
- Sprites remain compact pixel grids, now shaded; a fuller repaint of individual bosses at larger sizes is still possible later.

**Not started: build steps 9 and 10**
- Section 16 late-game pass: Time Administrator buff; Yun Xi (1,000 HP, 80% cap, the Last Bet). (The Last Keeper and the Sword Immortal's third stage are done, above.)
- Section 13.3 ending rework: Ending three, The Die; Ending two as the Sword Emperor.
- Section 13: the Thousand Skins collection, the Four Symbols secret, and the secret ending with the lobby's open sky.

### Dropped by Tom (not wanted)
- A perfect parry flipping the Venerables' dial early.
- Dried springs becoming safe ground in the Ancestor's final wave.
- Moving the forest's long-necked dinosaurs out from behind the treeline.
- Checking the Emperor's pearl at its wider orbit.
- The Fox's optional Killing Stone death flourish (D7).

---

## 1. What changes at a glance

| Tier | World | Bosses (in order) | Change |
|---|---|---|---|
| I | The Last Frontier | Bandit Warlord, Deadeye | none |
| II | Night Country | Vampire Lord, Lich | none |
| II | **Primordial Forest** | **The Bunny, then the Life Tree** | new world |
| III | Red Dust Temple | Grand Abbot, then **Sun Wukong (the Monkey King)** | moves up from Tier II; gains Wukong; pool changes |
| III | Myriad Sword Peaks | Sword Immortal (teacher) | none |
| III | Netherworld Abyss | Zerg Queen, then **Yellow Spring Ancestor** | gains the Ancestor, awakened by the battle |
| IV | Eastern Isles | **Nine-Tailed Fox (Tamamo)**, then Blind Gentleman | gains the Fox, who comes first |
| IV | The Nine Heavens | Dragon Emperor (reworked), then **True Sun and True Moon Venerables** (one pair, one seal) | loses Wukong; gains the pair; new ice and shadow foes |
| V | Timestream | Time Administrator | none |
| VI hidden | Cursed Domain, Black Sea, Pallid Kingdom | unchanged | none |

Seals: 15 now, plus the Venerable pair (1), Bunny, Life Tree, Ancestor and Fox = **20** (confirmed, D1).
Shelved ideas: Hades, Shuten-dōji, Yamata no Orochi, Raijin and Fujin, the Asura King, and the White Tiger.

---

## 2. Shared technology (build first)

Several bosses need the same pieces. Build them once.

| Piece | Used by | Notes and precedents |
|---|---|---|
| **Stage system** | Emperor | Add `e.stage` (1 to 3) beside `e.phase`. Keep `e.phase` at 1 or 2 so the ~25 existing `phase === 2` branches still work. Stage 3 keeps `phase === 2`. Add `phase3At`, a second transform, `form3`, and a per-stage ultimate list (`ult3` is already used for "honored"). |
| **Phase gates** | Emperor, Ancestor, Bunny, Life Tree, Venerables | Today a big hit can skip phases (`dealDamage`, [sim.js:2992](../js/sim.js)). Hold the boss at 1 HP above the next threshold until its transform plays, as `deathBound` does ([sim.js:3002](../js/sim.js)). |
| **Transition heals** | all multi-phase bosses | The boss heals when it enters a new phase (the existing `phase2.heal`). **No general regen.** The only exceptions are boss-specific passives Tom approved: the Emperor's rain heal (section 5) and the Ancestor's springs (section 7). Values are in each section. |
| **Pair support and merge** | Venerables | Generalize the Paradox Twin `partner` code ([sim.js:3301](../js/sim.js)). Boss room builder (`campaign.js`, around line 237) must place a declared companion. Update the test line "bosses fight alone" to allow declared pairs. Add a two-bar boss HUD. |
| **Lives system** | Nine-Tailed Fox | Generalize Undying Heart ([sim.js:2240](../js/sim.js)): `lives`, a per-life max HP formula, a reincarnation hook that grants the next tail. Nine tail pips in the boss HUD. |
| **Destructible fixtures** | Ancestor springs, Fox lanterns and stones | A summon-type entity with its own HP bar, immobile, `noClaim` (the King in Yellow cannot convert it), not counted as a kill. |
| **Immobile boss** | Life Tree | `ai: 'golem'` is the nearest precedent. Needs a speed-0 flag. The trunk is rooted at the arena centre. |
| **Statuses** | various | Add to `STATUS_KEYS` ([sim.js:773](../js/sim.js)): `wet`, `forget` (Forgetfulness), `confuse`, `cursed`, `petrify`. All must also work for AI fighters (`agent.js`), not just the player. |
| **Talent masking** | Ancestor | Talents are summed into `h.tal` at spawn ([sim.js:1727](../js/sim.js)). Keep each talent's contribution separable so one can be switched off for a few seconds. |
| **Skill sealing** | Ancestor | Track the hero's last-used ability; seal it for N seconds; in phase 2 seal the special instead. |
| **Technique recording** | Ancestor | Extend the Scholar's `recordTechnique` ([sim.js:4950](../js/sim.js)), which only learns after 5 uses, to keep the last few techniques, and add a hook for when the hero's special or ultimate starts. |
| **Beam upgrades** | Emperor, Venerables, Ancestor, Fox | `beam` hazards are static ([sim.js:3833](../js/sim.js)). Add rotating or sweeping beams, drag-along beams, a whirlpool pull, a moving wall hazard, and expanding rings. |
| **Weather layer** | Emperor | A rain particle layer and the `wet` status. **No day/night** (that belongs to the Venerables). |
| **Sky state** | Venerables only | A day/night state with a renderer overlay. The Nine Heavens arena lighting is static today (`arenas.js:690`). |
| **Pressure and nemesis** | Emperor | See section 5. |

Also check for every new boss: `BOSS_OF` role collisions, the ??? boss's skill pool (keep domain, pressure and fixture skills out of `BOSS_MULTICAST_KINDS`), the fighter cap of 14 and `slotsOf` ring slots (decoys, clones and lanterns count), and the arena radius `R` against large hitboxes.

---

## 3. Campaign changes

### 3.1 Red Dust Temple moves to Tier III, gains Sun Wukong
- Tier 2 to 3. Order: Grand Abbot, then the Monkey King (as in Night Country, a lesser boss opens).
- **Sun Wukong:** `form2` renamed **Victorious Fighting Buddha (斗战胜佛)**. Keep his `BOSS_TUNE` of hp 0.9, dmg 0.9 as a start. Lore line updated (section 11).
- **Pool:** buddhist, taichi, drunk, staffmonk, arhat. The Druid leaves for the forest. **Add monkeys and an elite sweeping monk:**
  - Mountain Monkey and Great Ape: promote Wukong's `monkeyclone` and `gorillaclone` into the pool (as the Heavenly General was), or build dedicated foes if the clones' hair-copy behaviour gets in the way.
  - **Sweeping Monk (扫地僧):** a new elite. Calm, a broom for a staff, deceptively strong. Broom sweeps, a dust cloud, and a riposte stance. It echoes the Abbot's broom line.
- Temple arena stays (`arenas.js`).

### 3.2 Netherworld Abyss
Order: **Zerg Queen first, then the Yellow Spring Ancestor**, who is awakened by the battle. Update the world vignette (section 11).

### 3.3 Eastern Isles
Order: **Nine-Tailed Fox first, then the Blind Gentleman.**

### 3.4 The Nine Heavens
Bosses: Emperor, then the Venerable pair. Add **ice and shadow foes** (section 10).

### 3.5 Primordial Forest
New Tier II world. See section 4.

### 3.6 Tier summary of what needs tuning
`BOSS_TUNE` entries for every new boss. Check BOSS_TIME (180s) for the Fox (nine lives) and the Venerables; raise to 240 if needed.

---

## 4. Primordial Forest (Tier II)

Hand-laid rooms like the Frontier, two stretches, nine rooms:

| Stretch | Rooms | Boss |
|---|---|---|
| **Wildwood** (beasts and dinosaurs) | 4 | **The Bunny** |
| **Elven Grove** (elves, treants, elven companions) | 4 | **The Life Tree** |

### Foes
| Group | Foe | Source | Role and kit |
|---|---|---|---|
| Beasts | **Druid** | existing, from the Temple | Warden who rides in with tamed beasts. |
| | **Tiger, Bear** | existing (the Druid's summons), promoted with boosts | Pounce; slow heavy maul. |
| | **Serpent, Roc, Drake** | the Thousand Skins forms ([sim.js:711](../js/sim.js)), as weaker wild foes | Reuse the `sf_*` sprites and specials. The Drake is an elite colossus. |
| | **Bunny** | existing, promoted | A weak pack of 4. |
| | **Mossback Tortoise (苔甲龟)** | **new**, elite colossus. Deliberately low-key name: its Black Tortoise (玄武) identity is only revealed by the Four Symbols secret (section 13.1). | Slow, armored, entwined with a serpent. Water attacks, a shell that hardens when it stands still (the Golem's `harden`), and a serpent tail that bites (reuse the Serpent's specials). |
| Dinosaurs | **Raptor** | new | Pack of 4, fast pounce. |
| | **Triceratops** | new | Colossus, charge and horn toss. |
| | **T-Rex** | new, elite | Colossus, fear roar, crushing bite. |
| Elves | **Elf Ranger** | new | Marksman; multi-shot; vanishes into the trees. |
| | **Elf Spellweaver** | new | Caster; heals allies, casts roots. |
| | **Elf Sentinel** | new | Guardian; spear and shield. |
| | **Elder Treant** | new, elite | Colossus; pinning roots, bark armor. |

Werewolf and Spider Demon stay exclusive to Night Country. Wolf, Boar, Dilophosaurus and Pterosaur are dropped. Add `p(...)` pool entries with weights and pack sizes.

### Boss 1: The Bunny, a corrupted Jade Rabbit
- **Lore:** the Jade Rabbit fell from the Moon Palace, was corrupted by the Black Sea, and became a strange creature. In the Codex its true nature is revealed after you reach the Black Sea.
- **Names:** in a run it reads as "Rabbit"; the Codex name is **Fallen Jade Rabbit (坠月玉兔)**; its second form is **Ink-Stained Jade Rabbit (墨染玉兔)**.
- **Tags:** counts as **strange** for the Emperor's nemesis bonus.
- **Look:** recolor the existing `bunny` sprite in the Black Sea ink style (as `inkdragon` is derived from `eastdragon`), then paint detail on top. Brushstroke-long ears, eyes slightly wrong.
- **Phase 1 (harmless-looking):** tiny, fast hitbox. **Pounding the Elixir (捣药):** pestle taps with small shockwaves.
- **Phase 2:** turns ink-black. Ink-blot sigils reuse the Scholar's `inkrain` and `inkfist` variants. **Moon-Devouring Bite (噬月):** a bite for a percentage of your max health, with an ear-twitch tell and a short wind-up so it stays fair.
- **Tuning:** a Tier II boss. Start at hp 0.9, dmg 0.8. Heal on entering phase 2: 20%.

### Boss 2: The Life Tree (生命之树)
- Rooted at the arena centre, huge and unmovable (immobile boss). Elven guardians defend it.
- **Spring Blessing (回春):** heals the elves every second (the existing `blessing` pulse). **Entangling Roots (缠根):** root sigils. **Vine Lash (藤鞭):** pulls you toward the trunk.
- **Phase 2, World Tree Awakens (世界树苏醒):** roots erupt across the floor in lines and petals fall. Heal on entering phase 2: 20%.
- **Ultimate, Spring Returns to the Earth (大地回春):** summons guardians, a root wave, and a heal wave for the elves.
- Loop: kill the elves first, then close in on the trunk while vines punish you.

---

## 5. Dragon Emperor (龙帝), three stages

HP 416 to about **900** (provisional, tune with the scripted-hero test). Thresholds at **65%** and **30%**. Heal on entering a stage: **20% at stage 2, 30% at stage 3.** Phase gates apply.

**No control of day and night.** That belongs to the Venerables. He keeps rain, lightning, water, fire, and reinforcements.

### Always on: Dragon Majesty (龙威), true dragon bloodline pressure
Everything not on his team, including the hero's allies but not his own summons, is affected.

| | Stage 1 | Stage 2 | Stage 3 |
|---|---|---|---|
| Pressure radius | about 80 | about 130 | whole arena |
| Damage they deal **to him** | −10% | −20% | −30% |
| Their movement speed | −10% | −15% | −25% |
| Their defense (extra damage they take) | +10% | +15% | +25% |
| **Bane of the Unclean (镇邪):** nemesis bonus vs undead and strange | ×1.5 | ×1.75 | ×2 |

Implement as a per-tick pass like the `def.aura` tick ([sim.js:3674](../js/sim.js)) setting `v.pressure`, read in `receiveHit` ([sim.js:2903](../js/sim.js)) and in the movement speed path (the player's speed path is not yet traced).
Nemesis tag sets (`UNDEAD`, `STRANGE`), which the existing `ripple` regex ([sim.js:2930](../js/sim.js)) should also use:
- **Undead:** zombie, skeleton, lich, vampire, bonedragon, ghoul, the Ancestor and his spirits.
- **Strange:** the King in Yellow, courtier, byakhee, horror, cultist, the Zerg Queen and brood, mutant, shapeshifter, the Scholar and ink dragons, the Bunny, the Venerables' shadow summons if any.

### Stage 1: human form, Dragon Emperor (龙帝)
New humanoid sprite (robes, jade crown, seal). Hitbox about r 8 (not the dragon's 13). Needs a humanoid draw path: `EASTERN_DRAGONS.emperor` ([render.js:2333](../js/render.js)) must apply to stage 2 and 3 only.
- **Passive, Mandate of Heaven (天命):** his decrees cannot be interrupted; his summons are 30% tougher.
- **Skills:** Heavenly Edict (天诏), golden lightning marks (the existing `thunder`); Dragon's Claw (龙爪), a three-lane unblockable rake; Jade Seal Suppresses the World (玉玺镇世), a slam; Riding the Clouds (腾云), he vanishes into a cloud and drops a claw strike; Summon Heavenly Soldiers (召天兵), 2 Heavenly Generals.
- **Ultimate, Nine Heavens Thunder Tribulation (九霄雷劫):** a storm darkens the sky (the existing ultimate tint, not a day/night state); nine lightning pillars fall in a bagua pattern; a jade seal drops.

### Stage 2: Celestial Dragon (天龙)
The existing live-drawn eastern dragon, upgraded: azure and gold, four claws, rain and cloud layers.
- **Passive, Thunder Scales (雷鳞):** lightning thorns on melee attackers; immune to fire; flies, so cannot be ringed out; **heals slowly while his rain is falling** (provisional 0.5% of max HP per second, only while Calling Wind and Rain is active, so it is a reason to break up or outlast the storm; tune against hero damage).
- **Skills:** Calling Wind and Rain (呼风唤雨), arena rain that applies `wet`; Thunder Chain (雷链), 6 strikes that punish wet targets; Dragon Tide (龙潮), a water cone that pushes toward the edge; Dragonfire (龙炎), a fire cone and burning pools; Wing Gust (existing); Summon Heavenly Soldiers upgraded to 4 generals plus Dragon Guards (龙卫).
- **Ultimate, Overturning Rivers and Seas (翻江倒海):** he rises into the clouds; three tide waves sweep the arena; nine thunder volleys; a golden breath to finish.

### Stage 3: True Dragon, Golden Body (金身真龙)
Five-clawed, golden, immense, with the **Long Zhu (龙珠)** dragon pearl.
- **Size:** the fighter hitbox is a head-sized circle (r about 22, `giant` flags, high mass, as Wukong's giant form). The immense body is a visual layer above the stage, reusing the serpent code in `drawBigDragon` ([render.js:4784](../js/render.js)) and the Celestial Court backdrop. Check against arena radius `R`.
- **Passives:** **Golden Body (金身):** strikes cut 70%, heavies cut 25%. **Boundless Dragon Pearl (龙珠无尽):** cooldowns ×0.45, so casts chain. When an ultimate ends, the pearl drops for 3 seconds and he takes ×1.5 damage.
- **Skills:** Breath of the Five Phases (五行龙息), one element per cast in order: Wood roots, Fire sweeping beam, Earth quake pillars, Metal piercing blade beam, Water tidal beam. Dragon Pearl Barrage (龙珠流光), five-colour homing orbs. Nine Sons of the Dragon (龙生九子), his reinforcements, scaled-down Eastern Dragons. Rain, thunder and dragonfire stay, and the rain heal from stage 2 carries over.
- **Ultimate, Dragon Pearl Transforms the Five Phases (龙珠化五行):** the pearl rises; five beams rotate from compass points and converge into one pearl beam; a roar leaves a safe wedge.

Docs: README line about "both forms of the Dragon Emperor" must change; codex passive and active text now needs up to three passives.

---

## 6. True Sun and True Moon Venerables (真日尊者, 真月尊者)

One pair, one seal (keyed on the Sun Venerable). Both fight at once, each with its own HP bar. Tuned for the Tier IV climax, below Mahoraga. Day and night belong to them.

### The balance
- **Sun:** the day, fire and lightning. **Moon:** the night, ice and shadow.
- **Taiji dial:** Day empowers the Sun (more damage, less taken) while the Moon withdraws and fights with decoys; Night is the reverse.
- **Extremes Reverse (物极必反):** after about 12 seconds of one side dominating, the dial flips. The newly weakened one is "yielded" for 3 seconds (×1.5 damage taken, posture broken). A well-timed parry on the dominant one flips the dial early.
- **Stances** (each visible and counterable):

| Stance | Effect | Counter |
|---|---|---|
| Unyielding (刚) | Resists strikes (gold aura) | Heavy and posture damage |
| Yielding (柔) | Strikes pass through half the time (blur) | Area and unblockable attacks |
| Moon in the Water (镜花水月) | Returns projectiles (mirror shimmer) | Melee |
| Mutual Shelter (阴阳相护) | −30% damage while the partner is near (a visible tether) | Break the tether by knockback or ring-out |

### Offense
- **Sun:** Golden Crow Fire (金乌之火), pools; Heavenly Thunder (天雷), marked strikes; Corona (日冕), an expanding ring with a gap; a solar flare cone.
- **Moon:** Frost Lotus (寒莲), freezing sigils; Moon Shadow Step (月影步), teleport behind and slash; Shadow Tide (影潮), a slowing zone; Moonbeam Lance (月华枪).
- **Combos:** fire plus ice makes a steam burst; lightning on a frozen or wet target shatters it; shadow plus fire makes an eclipse.

### Three acts
1. **Two Poles (两仪).** Both fight, each with its own HP.
2. **Five Phases (五行)**, below about 55% combined HP. A wheel of Wood, Fire, Earth, Metal and Water turns every 7 seconds or so; the current element empowers the matching Venerable and sets an arena hazard; opposing elements combine.
3. **Taiji (太极), the fusion.** **When either Venerable dies, there is a short animation: the body dissolves into streams of its colour that flow into the survivor, who is invulnerable for about 2.5 seconds, then a shockwave knocks everyone back, and the survivor becomes the Taiji Venerable (太极尊者).** The animation is **Yin and Yang Return to One (阴阳归一).** If the first death happens before Act 2, the survivor skips straight to this form (which already has the five elements). If both reach zero in the same tick, the second is held at 1 HP so the merge still plays. No seed to pick up.

**Taiji Venerable boosts (the strongest stage):**
- heals to at least 50% of max on fusion;
- +40% damage, +25% speed, cooldowns ×0.55;
- 20% damage reduction, no flinching;
- larger body (about 1.3×);
- both Venerables' skills, plus the joint and Taiji ultimates;
- the element wheel at double speed.

### Ultimates
- **Sun, Nine Suns Fall (九日坠空):** nine sun orbs land in a pattern; safe spots shrink.
- **Moon, Eternal Night (永夜):** darkness, ice spreading inward from the edge, shadow clones.
- **Joint, The Two Poles Turn (两仪轮转):** the floor splits into rotating black and white halves, each hurting with the opposite element; the two dots are the only safe islands.
- **Taiji, Birth of All Things (万物化生):** the five elements fire in generating order, then a wave of many small shots.

### Notes
- Lore link: the Emperor's elements are a borrowed echo of theirs (not day and night). The Moon Venerable can carry a pestle motif tying to the Jade Rabbit.
- Needs the two-boss HUD with the dial, the rotating floor hazard, and the Nine Heavens lighting override.
- The `bodyMult`/`receiveHit` stance and dial multipliers go in the same area as the Emperor's pressure.

---

## 7. Yellow Spring Ancestor (黄泉老祖)

Placed second in the Abyss, **awakened by the Zerg Queen's battle.** Tagged **undead** (so is every spirit he summons).

### Three domains
黄泉 death and the underworld; 忘川 forgetting; 轮回 reincarnation. Weapon: a fishing rod.

### Phase 1: Keeper of the Yellow Springs (黄泉守渡), a frail ferryman
- **Passive, Broth of Forgetting (孟婆汤):** contact with his water, and some hits, build visible Forgetfulness stacks that fade when you leave the water. **At 3 stacks one talent is forgotten (lowest tier); at 6 stacks the highest-tier talent is forgotten. Each lasts about 8 seconds. Talents only, not race or level.**
- **Skills:** Yellow Springs Surge (黄泉涌); Forgotten Reflection (忘川倒影), a spectral copy repeats your recorded technique (your special or ultimate in phase 2); **Casting for Lost Souls (垂钓亡魂)**, fishes out an elite creature (in phase 2, a boss in phase-1 form without its ultimate, using `openBossProjection`, [sim.js:3221](../js/sim.js)); Waters of Forgetfulness (忘川水), seals your most recently used skill (in phase 2, your special).
- **Ultimate, No Return from the Yellow Spring (黄泉有去无回)** (the whirlpool is merged into this ultimate; River of No Return is no longer a separate skill):

| Time | Step |
|---|---|
| Charge | Hundreds of lanterns rise, the arena dims to yellow-brown, a ferry silhouette appears, banner. |
| 0.0 | The river wells up and shrinks the dry ground to a central island; standing in water adds Forgetfulness. |
| 0.8 | First ferry: a ghost ferry crosses in a wide lane and drags anyone caught toward the far edge. |
| 1.8 | Second ferry from another angle. |
| 2.8 | A whirlpool swallows the island and pulls everything toward its centre. |
| 3.8 | He rises from the whirlpool at a ripple that marks the spot, and strikes with the rod. |

### Phase 2: Nine Springs Domain (九泉领域)
When Phase 1 ends he dissolves into the river, the arena goes still, nine springs erupt, lanterns rise, and he reforms above the centre, no longer elderly; the rod becomes a long spectral staff. Heal on entering: 25% (provisional).
- **Springs:** 9 fixtures with HP bars. Each regenerates him and strengthens nearby water attacks. Currents push fighters. He can travel between springs, and his skills can erupt from any active spring.
- **Yellow Springs Never Dry (黄泉不竭，老祖不灭):** he cannot truly die while a spring is active. At 0 HP he reforms from a spring after a delay and that spring is consumed. Each revival restores a modest share of HP (provisional 20%) so the fight stays a sensible length.
- **Forgotten Mortal World (忘却凡尘):** contact with the river builds stacks; at higher stacks you lose your special ability for a few seconds; leaving the water reduces them.
- **Samsara Without End (轮回不息):** when his summoned spirits die they leave soul fragments that reincarnate after a delay as different, possibly stronger, spirits (the Chronomancer rewind list, [sim.js:2378](../js/sim.js), is the precedent).
- **The Other Shore (彼岸花开):** spider lilies bloom, trap you briefly, then erupt in spectral flame.
- **Ultimate, Wheel of Six Paths (六道轮回, suggested):**

| Realm | Attack | Existing piece |
|---|---|---|
| Deva (天道) | Golden light pillars; move between safe zones | `sigil` pillars |
| Asura (阿修罗道) | Spectral warriors charge from opposite sides | `summonEdge` |
| Human (人道) | Ghostly images repeat your earlier attacks | `pastechoall` |
| Animal (畜生道) | Spectral beasts rush through, using the forest's | `radial` charge |
| Hungry Ghost (饿鬼道) | Giant hands drain energy and drag you in | `drain` plus a hand sigil |
| Hell (地狱道) | Chains, then fire pillars on marked spots | `sigil`, `hellfire` |

Finale: the six realms collapse into one wheel that falls into the springs; all nine erupt and the river crashes down. **Proposed:** each destroyed spring becomes dry safe ground, so destroying springs earns safe places for this wave.
Shown to the player: a 9-pip spring counter.

---

## 8. Nine-Tailed Fox: Tamamo-no-Mae (玉藻前)

First boss in the Eastern Isles. Role: trickster and caster. Check `BOSS_OF`.

### Nine lives, one tail per life
- She has nine lives. When one ends she reincarnates with the **next tail** and **more max HP** for the new life. Generalize Undying Heart ([sim.js:2240](../js/sim.js)).
- Starting HP per life: about **70 × (1 + 0.18 × (k − 1))**, from 70 to about 171, about 1,080 in total. Tune against measured hero damage.
- A hit can only end one life, so a burst cannot skip a tail.
- **Reincarnation (lives 1 to 8):** her body scatters into petals and foxfire, a spirit fox leaps out, the new tail unfurls, its symbol appears in the sky, and she demonstrates the ability. She is invulnerable for about 1.5 seconds.
- **Life 9, Heavenly Fox:** the full cinematic. The arena darkens, her disguise peels away as sheets of paper, and **all nine tails fill the sky**. She gets the giant flags, the Awakening passives, a cooldown reduction and a full heal.
- **She cannot be ringed out** (she walks on petals and foxfire, like the dragons).
- Boss HUD shows nine tail pips; the bar refills with a gold flash.
- Victory and the seal come only when the ninth life ends.

### The tails
| Tail | Name | Build notes |
|---|---|---|
| 1 | Foxfire (狐火) | The kitsune's homing `foxfire` shots and burn patches ([sim.js:288](../js/sim.js)); orbiting flames are new. |
| 2 | Phantom Guise (幻化) | Two clones that mirror her movement; she can swap with either. Reuse decoys and `swap`. |
| 3 | Bewitching Gaze (魅惑) | A golden eye over a target; if you keep facing her, your controls are confused briefly. The `charm` status only pulls today, so **confusion is a new status**: short and telegraphed. |
| 4 | Thousand-Faced Fan (千面扇) | Crescent wind blades, plus copies around you that launch fan strikes. |
| 5 | Soul Lantern (魂灯) | Lanterns that steal fragments of your spirit; destroying one releases the stored energy. A fixture. |
| 6 | Dreamweaver (夢幻) | Part of the arena becomes a dreamscape with false hazards. Fakes carry a subtle shimmering edge as a tell. |
| 7 | Cursed Moon (呪月) | Reuse the Vampire Lord's `bloodmoon` step; cursed targets take more damage from foxfire and illusions (`cursed` status). |
| 8 | Killing Stone (殺生石) | Cursed stones (fixtures) emit poison mist and gradually petrify. |
| 9 | Heavenly Fox (天狐) | True transformation; tails attack independently. |

Optional flourish (mine, not approved): on her final death she becomes the Killing Stone, which burns anyone near it briefly.

### Ultimates
- **Dance of a Hundred Foxes** (lives 4 to 8). She covers her face with her fan; the arena fills with cherry blossoms and dozens of identical women appear; each gestures differently (foxfire, fan slashes, approaching to charm); the real Tamamo appears behind you and closes her fan; the rest explode into foxfire together. **Identifying the real one and hitting her in that window cancels the explosion.** Give the real one a subtle tell that decoys lack. Mind the fighter cap and ring slots.
- **Nine Tails Eclipse the Moon (九尾蝕月)** (life 9 only): she rises, untouchable, tails spread like a fan; the moon turns blood-red with a seal on each tail; three tails fire blue foxfire meteors, three raise moving walls of illusory foxes, the rest raise stones and lanterns to restrict safe zones; the moon becomes a gigantic fox eye and fires a beam of golden-white foxfire (a sweeping `beam`); she dives through the beam and nine expanding shockwaves follow (dodge by rolling).

### Nine-Tailed Awakening (九尾覚醒), from life 9
All earlier abilities, more aggressive and enhanced, with a cooldown reduction.
- **Ninefold Sovereignty (九尾の権能):** each tail is an independent channel; she combines two or three abilities into combos. Implement combos as short scripted step lists run by the `mobileUlt` runner ([sim.js:3661](../js/sim.js)), not nine simultaneous skills.
- **The Fox That Cannot Be Caught (捉えられぬ狐):** repeating the same technique raises the chance she swaps with an illusion just before the next hit (use `substitute`, [sim.js:5218](../js/sim.js)). Switching technique resets it.
- Tails are drawn live with `n` tails behind her (like the eastern dragons); no nine sprites.

---

## 9. Temple additions
See 3.1.

## 10. Nine Heavens additions: ice and shadow foes
| Foe | Role | Kit |
|---|---|---|
| **Frost Maiden of the Cold Palace (广寒仙子)** | Caster, ice | Slowing frost lotus roots that freeze; ties to the Moon Venerable. |
| **Qilin (麒麟)** | Elite colossus, earth and the centre | **Proposed replacement for the Frost Qilin.** The auspicious beast of the heavens: thunder-hoofed charge, a golden aura, trampling stomps. Needed for the Four Symbols secret (section 13.1). |
| **Jade Toad of the Cold Palace (玉蟾)** | Elite colossus, ice | **Proposed** replacement for the ice elite the Frost Qilin was filling. The Moon Palace's three-legged toad (a pair with the Jade Rabbit): frost breath, freezing hops. |
| **Tiangou (天狗)** | Trickster, shadow | The hound that bites the sun and moon; blinks through shadows. |
| **Shade Attendant (影侍)** | Guardian, shadow | A courtier's shadow that outlasted the courtier; blocks for others. |

---

## 11. Lore, memories and codex (supporting entries)

The story is plain data in `js/lore.js`; `tests/campaign.cjs` fails if any world or foe lacks lore. Every new world, foe and boss needs an entry.

### New world vignettes (shown on first clear, kept on the Tally Wall)
- **forest:** *A forest older than the names of its trees, where the beasts were never afraid and the elves were never alone. When the jar came, the roots drank the last of the sky and held. The elves still tend the great tree, and it still tends them. Only something small and white at the edge of the wood learned a different way to be afraid.*

### Vignettes to revise
- **temple:** add that the Buddha of Victory in Strife sat in the hall and could not stop fighting. The Abbot said a broom does not argue with the weather. The monkey argued anyway.
- **abyss:** add that the swarm ate its way up through the old sleepers until, at the bottom, something older stirred, woken by the noise of the last battle.
- **isles:** add the lady of the lantern court whose fox-step a blind swordsman heard from three islands away.
- **heavens:** remove the monkey; add the sun and moon keeping their palaces beside the court, and the pair who took turns.

### Memory fragments
There are seven outer fragments (`o1` to `o7`) for seven outer worlds. The forest makes **eight**. Add a new fragment (draft, to be placed in the track order so `o7`, the woman in the black coat, stays last):
> *At the edge of the path, something small and white sat pounding at nothing with a stick, as if grinding medicine for someone who had gone. It was wet, though it had not rained. When you looked again, only the ink was left.*
Update "seven outer worlds" in `docs/campaign-plan.md`, `README.md` and `lore.js` comments, and track lengths.

### Codex lines (drafts, one per entry)
**Forest foes**
- tiger: *Walked out of the forest to see what was making the sky so close. Stayed to find out.*
- bear: *Slept through the end of its world. Woke up hungry anyway.*
- bunny: *Nibbles at your boots. The forest raised it to be polite about it.*
- serpent: *Coiled in a branch and waited for the world to end. It did, a little to the left.*
- roc: *Cast a shadow over the whole forest. The lid cast a bigger one.*
- drake: *Not quite a dragon, not quite sorry. The embers in its throat are older than the forest.*
- tortoise: *Carries the north on its back, coiled round by a snake that has never once let go.*
- raptor: *Hunts in a pack because one was never enough, and trusts none of the others to know it.*
- triceratops: *Lowers its horns at everything, on principle. The principle is the lid.*
- trex: *The forest's oldest argument, still settling it with its jaws.*
- elfranger: *Her arrows leave the string before you hear the wind. She counts the trees that still stand.*
- elfsentinel: *Guards a grove that was never threatened from outside. That was the whole mistake.*
- elfspellweaver: *Sings the forest to grow. It listens, mostly.*
- treant: *Rooted since before the elves came, and has opinions about both.*
- Bunny boss (hidden until the Black Sea): *Fell from a moon that no longer rises. Something dark and wet came up to meet it. It still pounds the medicine, for a moon that is gone.*
- lifetree: *The elves planted themselves around it. It forgave them, and kept growing.*

**Temple additions**
- monkey: *Stole peaches from the temple orchard for a hundred years. Learned the rest from the Great Sage.*
- gorilla: *The Great Sage's largest shadow. It does not remember being a shadow.*
- sweepingmonk: *Has swept the same steps since before the Abbot arrived. Nobody remembers asking him to stop.*
- wukong (revised): *Tore through heaven once, laughing. Became a Buddha for it, and tore at the lid anyway. It held, and he stopped laughing.*

**Heavens additions**
- frostmaiden: *Swept the Cold Palace's courts of frost. Found, at last, a floor that stayed cold.*
- qilin: *Walks without bending the grass. It came to bless the court, and has kept the blessing back for the court's sake.*
- jadetoad: *Sat under the moon's osmanthus beside the rabbit. Kept the cold when the rabbit went away.*
- tiangou: *The hound that bites the sun and moon. With no sun to bite, it bites at your shadow.*
- shadeattendant: *A courtier's shadow that outlasted the courtier. Still bowing.*
- sunvenerable: *Burned so the world could see. The world is gone, and he burns anyway.*
- moonvenerable: *Cooled what the sun burned. Keeps the night for no one.*
- taiji: *The two were one before there were two. Closing the lid made it so again.*

**Abyss and Isles**
- ancestor: *The old ferryman of the yellow springs, woken by the brood's war. He offers every passenger a cup of the river. No one has ever got off on the far shore.*
- fox: *A lady, a fox, a stone, in turn. The jar is one more disguise she has not yet worn.*

---

## 12. Hardcoded counts and saves (D1 = 20 is confirmed, so these must change)

- **Seal and talisman counts:** `lobby.js:14` ("Fifteen seals"), `lobby.js:18` (`SEALS_SHOWN = 15`), `lobby.js:448` (talismans around the lid), `ending.js:472` (talisman stubs), `finale-arenas.js:36` (talismans on the lid's rim), `README.md` (lines 29, 32, 64), `docs/campaign-plan.md` (lines 30, 156, 176, 241, 242, 350, 355). The opening text says "fifteen paper talismans".
- **Existing saves:** `ALL_SEALS` is built from the worlds, so adding bosses leaves players who already finished the game with unbroken seals, and the ending gate (`ALL_SEALS.every`, [main.js:934](../js/main.js)) would shut them out. Decide a migration (grant the new seals on load for saves that already reached the end, or exempt them).
- **Level curve:** level caps (300/300/30/250) spread across foe types, so about 25 new foes dilute per-kill progress. Check the curve.
- **Supporting entries per boss:** `heroFinale` switch ([sim.js:2200](../js/sim.js)) and the Tally Wall finale list, the sandbox boss list ([main.js:749](../js/main.js)), `BOSS_TUNE`, the Codex skill table (`campaign.js:149` style), and jade rewards (by tier).
- **Tests:** update `tests/campaign.cjs` (declared pairs, lore coverage); add `tests/emperor.cjs` (stage thresholds, pressure and nemesis multipliers, ultimate steps, no NaN) and preview pages for visual checks, as in `tests/`.

---

## 13. Thousand Skins collection (later)

The talent currently picks one of five hand-built beasts at random (`BEAST_MODS`, [sim.js:2060](../js/sim.js)). Proposed: it transforms into a stronger variation of **any killed beast or monster** (Phoenix and the dragons included), and you **select 5** for the random pool.
- Forms are generated from the foe's definition (body, moves ×~1.3, its specials, plus the hero ability keyed to that foe in `HERO_ABILITIES`) with a capped role bonus. Hand-tune showpieces (Phoenix, the dragons).
- Unlocks on first kill. Open: any kill or campaign kills only; whether bosses qualify.
- Risks: eastern dragons are drawn live, not as sprites; some foe mechanics will not translate and need explicit skill lists; save data needs the five picks and the unlock list.
- The forest beasts become the starter set.

### 13.1 Secret: Four Symbols, Five Phases (四象五行), an easter egg

Equip **exactly these five skins**, in any order:

| Skin | Four Symbols name | Direction | Phase | Source foe |
|---|---|---|---|---|
| Eastern Dragon | Azure Dragon (青龙) | East | Wood | Eastern Dragon (Heavens) |
| Phoenix | Vermilion Bird (朱雀) | South | Fire | Phoenix (Heavens) |
| Qilin | Qilin (麒麟), the centre | Centre | Earth | **new** Qilin (Heavens) |
| Tiger | White Tiger (白虎) | West | Metal | Tiger (Forest) |
| Mossback Tortoise | Black Tortoise (玄武), shown only once the set completes | North | Water | **new** Mossback Tortoise (Forest) |

Nothing in the UI hints at it beforehand. When the set completes: a banner and chime, the talent card is renamed **Four Symbols, Five Phases**, and **its slot cost rises from 3 to 4** (a stronger talent that costs more of the 10 slots; see D9 for an alternate reading). The Ember Drake is a regular skin and not part of the set.

**Proposed effects** (all provisional):
- Each skin becomes a **divine variant** with its element, reusing the Five Phases kit built for the Emperor's stage 3 and the Venerables' Act 2: Wood roots, Fire beam, Earth quake, Metal blade, Water tide.
- **Fixed cycle:** skins follow the generating order Wood, Fire, Earth, Metal, Water (Dragon, Phoenix, Qilin, Tiger, Tortoise) instead of the random draw. Each shift releases a small burst of the new element.
- **Five Phases Complete:** getting through all five skins in one fight triggers a large burst, once per cycle.
- **Four guardians:** the four symbols orbit the fighter at the compass points with the Qilin overhead, and occasionally strike even out of that skin.
- Cost versus benefit tuned so the 4-slot talent is strong but does not dominate.

**Dependencies:** the collection feature (13); the Phoenix showpiece form (heat, rebirth) and the live-drawn dragon path are now mandatory, not optional; the new Mossback Tortoise (Forest) and Qilin (Heavens) foes; the talent screen must recompute slot cost when the selection changes (the talent screen in `main.js` is not yet traced).

**Subtle hints (no spoilers):** the Codex lines for the five name their directions, and the Heavens night sky shows four faint constellations around a fifth.

### 13.2 Secret ending: The Four Symbols (四象), hidden (the fourth ending)

The secret also unlocks a fourth, hidden ending: the one that frees the hero. The other three are in 13.3 (and in [campaign-plan.md](campaign-plan.md)).

**Unlock:** reach the door with all 20 seals broken and Yun Xi fallen, while Four Symbols, Five Phases is active (the five-skin set equipped). The held choice at the door already lists "Open the door", "Sheathe the sword" (with the Fourteenth Page) and "Not yet". A further entry, **"Close the circle"**, appears only when the set is active, so nothing hints at it earlier. **It also requires the Fourteenth Page** (decided), so the path runs through the Summit and the Sword Immortal's new third stage (section 16.4).

**Meaning:** the jar (蛊) was made to leave one poison standing. The Five Phases give birth instead of consuming: the beasts the fighter has worn stand at the four directions and the centre, and the jar becomes a world.

**Scene** (proposed beats, same 256×144 cutscene format; all copy is draft):
1. **The held choice:** five faint silhouettes at the four corners of the lid's rim and one above the hero (the Qilin). Yun Xi notices them.
2. **The array lights:** wood, fire, earth, metal, water in generating order; each beast breathes its element across the burnt talisman stubs.
3. **The worlds return:** one small living window after another, using each world's arena background (the cutscene already bakes them with `cutBg`) and its vignette line. The forest sprouts, the temple bell rings, the court lights up.
4. **The lid:** neither lifted nor sheathed. It turns into a sky; the jar's rim becomes the horizon.
5. **The tally wall:** Yun Xi's name, the only one that was not crossed out, stays.
6. **Title card:** THE FOUR SYMBOLS.

**After (decided):** the lobby gains an open sky (the lid's station and its drawing in `lobby.js`, `SEALS_SHOWN`, and the talismans around the lid change to an open sky once `endingSymbolsSeen` is set), and New Game+ stays available.

**Work:** a `symbolsBeats()` in `ending.js`; a gated entry in `finaleBeats` ([ending.js:572](../js/ending.js)); an `endingSymbolsSeen` flag saved like `endingSeen` ([main.js:839](../js/main.js)); detection of the active set from the talent loadout (not yet traced); README and campaign-plan endings sections.

### 13.3 The four endings: who you become

The endings read as fates. The three main ones have the hero take a role in the jar, and the secret one frees them.

| # | Ending | Choice at the door | Who you become | Needs |
|---|---|---|---|---|
| 1 | The Door | Open the door | The **Time Administrator**: the last frame, your face flickering into a glitching clock (already in the game) | always |
| 2 | The Sheathed Sword | Sheathe the sword | The **Sword Emperor**, the next Sword Immortal, who keeps the sword sheathed | the Fourteenth Page |
| 3 | The Die (new) | Pick up the die | The next **???**, Yun Xi's successor, wearing her coat | always (proposed) |
| 4 | The Four Symbols (secret) | Close the circle | Nobody: **freed** | the Fourteenth Page and the five-skin set |

**Why this is a rework, not just a new scene.** Today's "Sheathe the sword" (`chooseStay`, [main.js:948](../js/main.js)) already makes you the next ???: Yun Xi leaves her coat beside you and rests, the lid stays shut, and the next cycle's last fight is your saved fighter "in her coat" (`previousSelf`, the `echo` room). That behaviour belongs to the new ending three, and ending two needs a scene of its own.

**Ending three, The Die (proposed):**
- The choice "Pick up the die" is offered in the held scene (the die is already at your feet) from the first clear, with no page needed.
- Beats: the current `stayBeats` (you put the sword down; she leaves the coat and rests; the lid stays shut; her name is crossed out; new marks begin in another hand), renamed `dieBeats`, with the title card THE DIE. The coat and `previousSelf` echo flow stays exactly as it works today.
- `chooseStay` loses its Fourteenth Page requirement and becomes `chooseDie`.

**Ending two, The Sheathed Sword (Sword Emperor):**
- A new scene `swordEmperorBeats()`: you sheathe the Fourteenth Sword, the page torn from the manual in your hand. Yun Xi still rests, but there is no coat. The last image is you at the highest peak, the sword never drawn again.
- New Game+ proposal: the previous you waits as the **teacher at the Myriad Sword Peaks**, replacing the Sword Immortal in that role (the teacher variant already exists), and Yun Xi is still the last fight at the Bottom. That keeps the coat for ending three only.
- Needs a separate saved snapshot for the Sword Emperor and its hook at the Peaks.

**Ending one** stays as it is: the glitching-clock frame is the hint that you become the Time Administrator, and the game returns to the jar.

**Work:** `finaleBeats` ([ending.js:533](../js/ending.js)) gains the die choice; `stayBeats` is renamed and retitled; `swordEmperorBeats()` is new; `chooseStay` is split into `chooseDie` and a sword-emperor handler in `main.js`; README and campaign-plan endings sections change.

---

## 14. Build order

1. Campaign moves, Temple to Tier III, the Monkey King, seal-count decision and saves migration, doc updates.
2. Shared technology (section 2).
3. Primordial Forest (foes, Bunny, Life Tree, arena, lore, tests).
4. Temple and Heavens pool additions.
5. Dragon Emperor.
6. Venerables.
7. Yellow Spring Ancestor.
8. Nine-Tailed Fox.
9. Late-game pass (section 16): Sword Immortal's third stage, Time Administrator, Last Keeper, Yun Xi. The ending set rework (13.3) goes with it.
10. Thousand Skins collection and the Four Symbols secret ending.

Steps 2 to 8 all touch `sim.js` and `render.js`, so they run one after another, not in parallel. Each boss lands with its finale, lore, Codex entries and tests.

---

## 15. Decisions still open

| # | Question | Default |
|---|---|---|
| D1 | ~~Seal count~~ **Decided: raise to 20** (lobby, endings and talismans change) | done |
| D2 | Where the new outer-world fragment sits in the track order | before `o7` |
| D3 | Emperor HP 900, Ancestor heal 25% and revival share 20%, Fox HP formula | tune with the scripted-hero test |
| D4 | Player speed path for the pressure effect (not yet traced) | find and hook |
| D5 | Where the player's level feeds in (unused: only talents are taken) | no change |
| D6 | Thousand Skins: any kills or campaign kills; do bosses qualify | any kills, bosses excluded |
| D7 | Fox's optional Killing Stone death flourish | skip unless wanted |
| D9 | "Becomes 4 slot": slot cost 3 to 4 (my reading) or something else | cost 3 to 4 |
| D10 | Qilin as its own foe in the Heavens (replacing the Frost Qilin, with a Jade Toad as the ice elite) versus using the Ember Drake as the fifth | own foe, as proposed |
| D11 | ~~Secret ending prerequisite~~ **Decided:** the Four Symbols set **and** the Fourteenth Page | done |
| D12 | ~~After the secret ending~~ **Decided:** the lobby gains an open sky; New Game+ stays | done |
| D17 | ~~Is "Pick up the die" available from the first clear~~ **Decided:** yes, from the start | done |
| D18 | Does ending two start New Game+ with the previous you as the Peaks teacher | yes |
| D19 | Does ending one change anything afterwards (for example, the Time Administrator's face being yours) | no |
| D8 | Chinese names for the Emperor, Venerables, Bunny, Life Tree and lore lines are suggestions | Tom to approve or change |

---

## 16. Late-game pass: the final bosses (looking ahead)

**Goal:** the Time Administrator, the Last Keeper and Yun Xi sit in the middle of the boss ladder and should not. The Sword Immortal stays the strongest and gains a third stage. Proposed ladder, weakest to strongest (all numbers tuned with the scripted-hero test): rest of the roster < Time Administrator ≈ Mahoraga ≈ Wukong < Last Keeper < Yun Xi < Sword Immortal at the Summit.

**What they are today:**

| Boss | Now |
|---|---|
| Time Administrator | hp 340, campaign tune 1.15/1.1; stage 2 "You, From the Future" casts every boss's first-form ultimate; revives once as "You, From the Past" at half health ([sim.js:951](../js/sim.js), [sim.js:2276](../js/sim.js)). |
| The Last Keeper | The Time Administrator rebuilt for the Bottom of the Jar: ×1.5 HP, ×1.2 damage, extra echo and rift skills, new ultimates ([sim.js:3177](../js/sim.js)). |
| Yun Xi (`unknown`, "???") | hp 260; her damage is scaled to 0.5 (0.65 in stage 2); takes up to 90% less as she weakens; Multi-cast; Last Gamble at 0 HP ([sim.js:996](../js/sim.js), [sim.js:2292](../js/sim.js)). |
| Sword Immortal (`swordsaint`) | hp 260; the Summit multiplies HP ×1.5, damage ×1.4; his second form cannot fall until the Thirteenth Sword is drawn ([sim.js:1474](../js/sim.js)). |

### 16.1 Time Administrator (buff)
- More HP (about 340 to 500 before campaign tuning). He already has three bodies (present, the Future, the Past): give each a heal on entry and a phase gate, using the shared stage tech. Raise the Past revive from 50% to about 70%.
- New skills: **Past, Present and Future**: marks where you were, where you stand and where you are heading, erupting in sequence (the Three Lives Stone idea moved here, using his position history); **Hour Hand**: a rotating beam that sweeps like a clock hand; **Borrowed Time**: resets your last skill to a full cooldown.

### 16.2 The Last Keeper (rework)
**Decided: Keeper of the Iterations, 800 base HP.** Today it is a runtime stat bump of the Time Administrator (`makeFinalKeeper`). It becomes its own definition with 800 base HP (before campaign and cycle scaling):
- He fights with your own saved selves (the brain snapshots in `c.snapshots`, which the rooms before him already use): he calls two at a time as AI allies. His clock face counts your Lives. "The Finished Gu" stage has him absorb the last iteration.
- (The clockwork-finale option was not chosen.)

### 16.3 Yun Xi (buff "hella")
- Remove the toning down: damage scale 0.5/0.65 to about 0.9/1.1. **HP 260 to 1,000** (decided).
- Damage reduction as she weakens is **capped at 80%** (decided; it was up to 90%). With the existing formula her effective durability is about 2,000 damage at 1,000 HP (1,000 × ln 5 / 0.8), roughly three times the old fight, so her damage numbers and the scripted-hero test need care.
- Make the Last Gamble a real third stage, **The Last Bet**: a visible die, each roll sets what she casts that round (telegraphed). **She only rolls good skills** (decided): no duds, so the stage is pure pattern-reading. To keep counterplay it is time-limited (about five rolls) and ends with her spent for a few seconds. Heal on entering: 25%.
- NG+ keeps scaling by cycle.

### 16.4 Sword Immortal: a third stage (Summit only)
The teacher at the Peaks keeps two forms and never reaches it.
- **Stage 2 is unchanged:** it keeps the passive **Unfinished Manual** (he cannot fall until the Thirteenth Sword is drawn) and keeps its existing crimson-and-gold Unfinished Manual look (`SW_BOUND`, [swordfx.js:29](../js/swordfx.js)) with nothing added. **Trigger for stage 3:** when the Thirteenth Sword is complete and the hold ends, instead of becoming mortal the reveal plays: he has no head either, and he has been corrupted by the Black Sea like the Scholar.
- **Stage 3, Sword Without a Head (无首之剑, suggested): the stage 2 moveset, twisted and stronger.** Everything stage 2 draws (the Ninth grown vast, X, XI, XII, and the Thirteenth as his ultimate) returns corrupted: ink-black blades with white edges, Black Sea water at his feet, about 50% more swords and bigger arcs, each sword leaving an ink afterimage that repeats once a moment later, and swords drawn in pairs (a **Corrupted Manual**) instead of one at a time. The corrupted Thirteenth is his regular ultimate for this stage. The full visual overhaul (headless sprite, ink) happens here, not in stage 2. Tuning: heal about 25% on entry, damage ×1.3 over stage 2.
- **The page:** defeating him still yields the Fourteenth Page (needed for ending two and the secret ending), as the ink drains from it.
- **The Fourteenth Sword is his final ultimate, drawn at the very end of stage 3** (proposed trigger: at about 10% HP, like the teacher's yield point). He charges untouchable, then draws the **Fourteenth Sword: Cut (斩)**, a bare blade that stays unsheathed until the end: a long, readable stroke (about two seconds), the biggest attack in the fight. Survive it, or answer it with a perfect parry or a posture break, and he finally sheathes: he falls and the ink drains from the page. A killing blow before it completes leaves him at 1 HP (the same hold as stage 2), so he always draws it. If it lands on you, he draws it again after a cooldown. This ties to the page itself ("the Fourteenth is to sheathe it"). Implementation: a stage ultimate ([sim.js:3720](../js/sim.js)) plus a hold in `dealDamage` ([sim.js:3002](../js/sim.js)) until `fourteenthDone`.
- **The Fourteenth Sword is named Cut (斩), and its look is dimension reduction (降维, decided).** It is still a sword: a plain bare blade drawn in full view, and it stays the only thing with depth. The Thirteenth cuts the world in two along a line of light; the Fourteenth's single stroke removes a dimension. It is the Fourteenth *Page* made literal: the world becomes a page.
  1. The world stills and drains of colour to ink on paper (reusing `paintWorld`, [render.js:4767](../js/render.js)); shadows and parallax drop out.
  2. The stage folds flat: the captured frame (`flatten`, [render.js:2400](../js/render.js)) has its vertical scale tweened from the 3/4 view (`SQ` is 0.58) down to a thin line, as if the arena were turned edge-on and its depth lost, held for a beat in near-silence. **Everything except the blade is flattened.** The sword is drawn on top, in full colour with shading, and stays solid.
  3. A faint pencil line appears across the page through the hero's spot (the telegraph).
  4. The cut: one swing of the visible blade. Where its edge passes, the page is cut open and whatever it crosses is erased (a clean blank slit, not light, unlike the Thirteenth). It ignores airborne dodges.
  5. He sheathes the blade with a click (the sheathing the Fourteenth Page speaks of) and the page closes. The world re-inflates with a small overshoot and the colour returns.
  6. A thin pale scar stays on the floor for the rest of the fight (as the teacher's sky scar does).
  If answered (a perfect parry or posture break) the cut does not land. Needs: new ultimate steps (`pageworld`, `pencil`, `dimcut`), a renderer pass using the buffered frame, a beam flag for ignoring airborne dodges, and a new visual in `swordfx.js` (all thirteen swords have their own there).
  - (The ink-anchor-pages and no-hold alternatives were not chosen.)
- **Lore line:** *The sword needs no hand. It turns out it needs no head either.*
- **Engine:** the shared stage system; a new headless sprite; the Scholar's ink variants; a flag keeping the teacher variant out of stage 3.

### 16.5 Open questions
| # | Question | Default |
|---|---|---|
| D13 | ~~Last Keeper direction~~ **Decided:** Keeper of the Iterations, 800 base HP | done |
| D14 | ~~Yun Xi~~ **Decided:** 1,000 HP, damage reduction capped at 80%, only good skills in the Last Bet. Still open: her damage scale numbers | 0.9 and 1.1 |
| D15 | ~~Sword Immortal stage 3 structure~~ **Decided:** stage 2 keeps Unfinished Manual with no visual upgrade; stage 3 is the twisted stage 2 moveset; the Fourteenth Sword is his final ultimate at the very end. The Fourteenth Sword's look is **decided** (the page and dimension reduction). Open: the exact trigger and names | about 10% HP |
| D16 | The ladder order above | as above |
