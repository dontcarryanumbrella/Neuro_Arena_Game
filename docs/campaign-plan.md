# Neuro Arena: The Jar (campaign plan)

Status: phases 1 (campaign core), 2 (lobby and Pavilion), 4 (original lore) and 5 (promoted foes and the teacher) are built; phase 3 (balance) was dropped; the rest is planned. The Black Sea cosmology, arrival note and campaign wording are now implemented. Section 1 records the earlier audit and draft copy; the live text in js/lore.js is authoritative.

Decisions so far:
- The AI brain fights every room. You coach between rooms.
- The lore is the Gu Jar, a refining vessel within the Black Sea: the space between myriad worlds.
- The portal crosses the Black Sea along protected routes. The hero can travel outside the vessel, but his jade core remains bound to it; crossing the sea is not release.
- The playable Black Sea is one reachable stretch of the greater sea. The Headless Scholar is a traveler within it, not its creator or ruler.
- Every room starts at full health, and a lost room is simply retried.
- Abilities are learned both in worlds and in the Pavilion, faster in the Pavilion.
- A new enemy gets an intro card and a codex entry.
- Each boss breaks a seal on the final door.
- The lobby is a pixel-art scene.
- The thin worlds get filled with new enemies.
- World names and foe placements are yours (section 3).
- The Cursed Domain, the Black Sea and the Pallid Kingdom stay hidden until the Timestream is beaten.
- A first boss victory unlocks that boss's Transcendence finale and pays a large amount of jade.
- Only campaign kills count toward level.
- The hero stays nameless.
- The hidden second ending (stay in the jar) is in.
- The Nine Heavens sit above the Netherworld Abyss.
- The Sword Immortal in the open world is a teacher holding back. His serious form comes later (section 3.13).

---

## 1. The lore

### The premise
He wakes on cold glazed clay, inside a round room with no door. The walls curve up to a mouth far overhead, sealed with a lid and fifteen paper talismans. Scratched into the clay at the height of a man's hand are tally marks, thousands of them. He has no name and no memory. In the middle of the floor stands a gate of moving light.

### The Black Sea, the jar, and the portal
The **Black Sea** is the expanse between myriad worlds. Each world is an island of its own reality, with its own skies, history and laws. It is older and larger than the jar. Some beings can cross it through power, knowledge or protective artifacts; others are refugees, pilgrims or predators. The sea itself is not evil.

The **Gu Jar** is a vessel within that expanse. The Jar-Setter swallowed worlds and bound their surviving echoes to it. The ordinary campaign destinations are those captured echoes, reached through protected passages across the sea. The jar's apparent interior need not contain them as physically adjacent rooms: its seals and routes bind them into one refining apparatus.

The **portal** carries the hero along those passages. Until the Time Administrator falls, the keeper restricts its destinations and hides the crossing. Afterwards, two more captured domains and a route into the sea itself become accessible. The jar has lost its route keeper, not all of its bindings.

**Why this is not already escape:** the hero's jade core remains bound to the jar. His body can travel beyond its walls, but death draws what he learned back to the clay and reconstructs him. Distance cannot sever that bond. The final door releases the completed core into the Jar-Setter's custody; it is a handover, not merely another geographical exit. This is a lore rule, not a new timer, travel limit or combat penalty.

The **Headless Scholar** crossed between worlds without the Jar-Setter's routes. Somewhere beyond his native world, he encountered laws that could no longer recognise his head as part of him. His umbrella shelters him and carries fragments of places he has survived. The painting is his portable domain, leaking into this stretch of sea; it is not the origin of the Black Sea. Leave the precise event that changed him uncertain in player-facing text.

The Jar-Setter binds selected worlds and a reachable corridor of the sea, not the whole cosmology. The Scholar's defeat breaks a seal because the jar harvests the encounter through that corridor, not because he rules the sea. Cursed Domain and Pallid Kingdom remain captured echoes. Clearing Black Sea means surviving the passage and defeating its encountered champion, not conquering the infinite sea.

Both endings stay. Refusal denies delivery of the completed weapon; it does not destroy the jar or establish a third escape route. What lies beyond the Jar-Setter's reach remains an unanswered possibility.

### The truth, built up layer by layer
This is a **Gu jar** (蛊). In the old art, venomous creatures are sealed in one jar to devour each other, and whatever survives becomes the Gu: a living weapon holding everything it ate. Someone (the **Jar-Setter**, never seen) did this with *worlds*. The ordinary worlds behind the portal were swallowed whole, and their strongest are kept as echoes. The later Black Sea passage is the exception: it reaches the expanse those worlds once occupied. The hero is the newest thing being refined.

What the player slowly learns:
1. **None of these worlds are his.** He can't remember a home because he never had one.
2. **The captive worlds were eaten.** Each is a memory of a place that ended the day the jar closed over it. The Black Sea itself was never swallowed.
3. **He grows by devouring.** Every new champion he fells makes him stronger: the level system, reframed as the Gu feeding.
4. **The tally marks are his.** The "Lives" counter is literal. Every training life was a real death, and the network is what survived each one.
5. **He is not the first.** Older tallies sit under his, scratched by other hands, all crossed out.
6. **The Time Administrator is him, finished.** It is the Gu that already left, made the jar's keeper. It rifts champions in to feed the jar (Rift), rewinds what goes wrong (Rewind), and stops time on anything that strays. "You, From the Future" is the Gu he will become, and "You, From the Past" is an earlier iteration. While the keeper stands, it hides the sea crossing and restricts the portal to approved destinations. Its defeat reveals two more captive worlds and the Black Sea passage; the core's binding survives it.
7. **Yun Xi (???) was the Gu before him.** She conquered every world and stood at the door, and she refused to open it. She stayed in the jar as a gambler against fate, nudging dice so the next Gu might find another way. "Wait... do I know her?" He does. She taught him, in an iteration he no longer remembers.
8. **The terrible truth:** release through the final door is not escape. Traveling the sea never freed his core from the jar. Conquering every world is what *completes* him. When the last seal breaks, the door opens onto the Jar-Setter's hand. What walks out is a weapon, and a clock face is already waiting for it. The Time Administrator was never his enemy. It was his future.

### The endings
The final world is the Bottom of the Jar (3.12).

**Ending one, The Door** (always available). After the hero beats Yun Xi, she says (draft): *"Then this time it's you. I'm sorry. I lost the bet again."* The lid lifts and light pours in. The last frame is the hero's face flickering into a glitching clock. Credits roll over the tally wall, with one more mark added.

**Ending two, The Sheathed Sword** (hidden).
- **Unlock:** beat the serious Sword Immortal (3.13). He gives the hero the page torn from the end of his manual. The Thirteenth Sword cuts heaven and earth apart. The Fourteenth is *to sheathe it*: the strength to refuse.
- **At the door:** with that page, a second choice appears beside "Open": *Sheathe the sword.*
- **What happens:** the hero stays, as Yun Xi did. She finally rests, and her name is crossed out at last. The lid stays shut. In the dark, a new set of tallies begins in another hand.
- **New Game+ is repeatable.** Each time you choose to stay, a new cycle begins (NG+1, NG+2, ...), and you play the next iteration.
  - What carries over: the brain, talents, skins, identity, unlocked finales and jade ("what he learned has soaked into the clay").
  - What resets: worlds, seals, level, story fragments, and the Fourteenth Page.
  - **Each cycle is harder than the last.** Every cycle adds one danger step:
    - foe health and damage +15%
    - room budgets +10%
    - one more elite per world
    - every boss's campaign tuning up a notch
  - From NG+3, foes start with one random modifier (shielded, swift, vampiric, explosive...).
  - Rewards rise with the cycle: first-clear and boss jade +25% per cycle, so later cycles stay worth it.
  - **The ??? in the black coat is you:** your fighter as it was when it last chose to stay, wearing her coat. *"Wait... do I know him?"* With each cycle that echo is a stronger past you, so the final fight scales with your own training.
  - The cycle number is carved into the lid and shown on the portal. The tally wall keeps every cycle's marks.

### How clues are delivered
Worlds can be cleared in any order, so fragments come in **completion order** on three tracks:
- **The outer worlds** (the seven before the Timestream, any order): the Nth one you complete reveals fragment N.
- **The Timestream** always gives the same revelation: the keeper is you. Beating it also uncovers the hidden worlds.
- **The hidden worlds** (always after the Timestream): the Nth one you complete reveals hidden fragment N.

On top of that:
- Each world keeps its own vignette of what it was and how it ended.
- Codex entries (one per enemy, on first encounter) carry small lore lines.
- The lobby changes as you go: seals burn off the lid, the tallies multiply, and after fragment 5 the older tallies become readable.

**Outer-world fragments (drafts):**

| # | Fragment |
|---|---|
| 1 | The world you cleared did not end when you won. It ended long before you arrived. You only walked through its memory. Between the gate and that dead sky, you remember a moment with no ground beneath you. |
| 2 | The champions you fell leave something behind, and it settles in you. You are stronger. You did not train for it. |
| 3 | The tally marks on the wall reach as high as your hand. Beside them, someone has written: one mark for a thousand lives. |
| 4 | Under your tallies are older ones, in a different hand. Then another, and another. All crossed out. |
| 5 | A word is carved by the oldest marks: 蛊. A jar. Poisons sealed together until one remains. |
| 6 | The worlds did not fall into this place. They were taken from somewhere, as food. Each time the gate opens, a line of light crosses the dark between them. Something chooses where it ends. |
| 7 | You've seen the woman in the black coat before. She was standing at the door, and she did not open it. |

**The Timestream revelation:** A broken watch in the keeper's hand is engraved with your Lives count, and with a number you haven't reached yet. It fought with your openings, and it learned them first. With the keeper gone, the gate opens without a destination. For a moment you see the crossing: black water, distant worlds like islands, and the thread of light that has carried you between them. Two hidden worlds and a passage into the sea appear. The thread still leads back to the clay.

**Hidden-world fragments:**

| # | Fragment |
|---|---|
| H1 | Under her tallies is a name, the only one in the jar that isn't crossed out: 云汐 (Yun Xi). |
| H2 | The dice. You remember her teaching you to read them, in a life you don't remember living. |
| H3 | You have crossed beyond the walls, but the core always answers the clay. The seals are not keeping your body in. They keep the door from releasing what you are becoming before you are done. |

**A known wrinkle:** a player who beats the Timestream early hears "the keeper is you" before the 蛊 fragment. The revelation is worded to work either way, as foreshadowing early or confirmation late.


### Existing in-game hints: source audit and revision plan
Audited against the working tree on 2026-10-31. The audit below records the original code and proposed follow-up; the live game now contains the revision, with rewritten copy.

| Surface | What currently happens | Source | Black Sea follow-up |
|---|---|---|---|
| First-clear memory | On the first full world clear, a modal shows that world's vignette plus the next fragment on its track. It pauses play. A mid-run boss grants a seal/finale and toast, but no memory yet. Repeat clears do not grant another fragment | `js/main.js`: `finishRoom` logic around `rec.runs === 1`, `nextFragment`, `showMemory`; `js/lore.js`: `FRAGMENTS`, `WORLD_VIGNETTES` | Revise `o1`, `o6`, `t`, `h3` using the drafts above; replace the Black Sea vignette below |
| Memory archive | The Tally Wall lists each earned world's vignette and fragment for rereading | `js/main.js`: `renderMemories`; `index.html`: `memoryList` | Existing entries resolve their text from data keys, so copy changes also update old saved memories without awarding them again |
| Codex | Met enemies show one static lore line, alongside mechanics and campaign kills. Unmet entries show `???`. Lines are not unlocked in stages | `js/lore.js`: `CODEX_LORE`; `js/main.js`: `renderCodex` | Replace the Scholar's origin; add restrained route hints to a few early foes. Avoid putting the full ending revelation in encounter-time entries |
| Encounter cards | First meetings show sprite, name and a generic role/boss label followed by the world name. There are no authored lore paragraphs or unique epithets here yet | `js/main.js`: `meetFoes` | For the Scholar, future wording should say “Encountered in Black Sea” rather than imply sovereignty with “Boss of Black Sea” |
| Portal cards and unlock toast | Cards use each world's `blurb`. The keeper's first defeat announces three hidden worlds below the Timestream | `js/campaign.js`: `WORLDS`; `js/main.js`: campaign reward handler and `renderPortal` | Change Black Sea blurb and keeper toast below; describe three destinations, not three swallowed worlds |
| Lobby clues | Seals burn away; tally strokes grow with Lives. `o5` reveals crossed-out old marks and 蛊; `h1` reveals Yun Xi's name | `js/main.js`: `lobbyInfo`; `js/lobby.js`: `drawSeals`, `drawTallies`, `drawOldMarks` | Preserve these gates. An optional post-keeper portal reflection could show dark water and world-lights; not required for the text revision |
| Combat captions | Boss second forms carry short lore captions. Scholar: “World Within a Painting” / “THE PAINTING OPENS”. Time Administrator also has past/future-self imagery | `js/sim.js`, `js/render.js` | Keep these: the painting is now the Scholar's domain inside the larger sea. Do not rename it to suggest he created the sea |

There is no separate collectible-note system in the audited lore flow. The existing memory modal, archive and codex are enough for this revision. The teacher also has a yield event and a Thirteenth Sword demonstration; these remain compatible with the revised cosmology.

**Earlier draft copy (the implemented text differs):**

- `WORLDS.blacksea.blurb`: *A passage between worlds. Far lights drift like islands; nearer, a scholar's painting leaks into the dark.*
- Keeper-defeat toast in `js/main.js`: *The keeper is gone. The portal reveals two hidden worlds and a passage into the Black Sea.*
- `WORLD_VIGNETTES.blacksea`: *The sea was here before the jar. The lights beyond it are worlds, and the gate has carried you between them all along. The scholar crossed without such a road. Whatever took his head did not stop him; under his umbrella, pieces of the places he passed still live in ink. You follow your own thread home. It ends in the clay, where your core remains bound.*
- `CODEX_LORE.scholar`: *Crossed between worlds beneath an umbrella. Somewhere along the way, the worlds forgot he should have a head. The painting remembers other things.*
- `CODEX_LORE.lampbearer`: *Carries a lamp through the scholar's spilled painting. Beyond its edge, other lights drift on black water.*
- `CODEX_LORE.chessist`: *A head from the scholar's painting that became a chess master. Plays both sides. Loses both.*
- `CODEX_LORE.talisman`: *Writes seals on paper. The ones around the gate mark a safe passage. He will not say through what.*
- `CODEX_LORE.formation`: *Draws arrays to trap demons. The gate's array is stranger: a road with a tether running through it.*
- `CODEX_LORE.timeadmin`: *Keeps the crossings on their appointed paths. Its clock face shows your Lives. Its movements are yours, a little ahead.*
- `WORLD_VIGNETTES.timestream`: *Not a world at all: the river where the jar keeps its time. Moments from the captive worlds drift in it, torn loose. Its keeper pulled champions through the rifts and kept every crossing on its appointed path. The roads outlived it. So did the thing that binds you to their beginning.*
- `WORLD_VIGNETTES.abyss`, opening sentence: replace *The pit under every world* with *A world of pits beneath pits*, so the Abyss is not accidentally established as the substrate of the whole Black Sea cosmology. Match its portal blurb to *A world of pits beneath pits, and the brood that eats its way up.* The Nine Heavens can remain above the Abyss in campaign ordering without defining universal geography.

Other Scholar-retinue entries can keep their painting origins. Frontier, temple, night, peaks, isles, heavens, cursed and pallid vignettes still describe captured echoes and remain compatible. Keep Yun Xi's `h1` and `h2`, the tally revelations, and the Fourteenth Page story intact.

**Reveal order and optional arrival note:**
- Before the keeper: `o1`, `o6`, talisman and formation hint at a crossing and tether without naming the sea or explaining the final door.
- Keeper victory: `t` provides the essential sea revelation for every player, even one who skipped the outer worlds. Do not require having read a codex entry.
- On first Black Sea entry, an optional short route note can say: *No borrowed sky waits beyond the gate. Black water stretches between distant worlds. Behind you, the passage narrows to a thread. Something beneath your ribs pulls toward the clay.* Label this “Beyond the crossing”, not “A memory returns”: it is a present observation.
- This arrival note would be a new feature. Save a separate `blackSeaArrivalSeen` flag, archive it under route observations, and do not add it to `campaign.fragments` or consume `h1`–`h3`. Reset it with story progress in NG+. Existing saves that already cleared Black Sea should receive the archive entry without an intrusive replay.
- Black Sea clear: its own vignette explains the Scholar and confirms the binding, regardless of which hidden fragment accompanies it.
- Third hidden clear: `h3` explains the core/door distinction. It must work even if Black Sea was the first or last hidden destination.
- Keep fragment IDs and track lengths unchanged. The campaign still has **15 boss seals**, seven outer memories, one keeper revelation and three hidden memories. The optional arrival note adds no seal or boss.

**Follow-up verification:** confirm an early Timestream clear, Black Sea first/last among hidden clears, mid-run boss victories, repeat clears, and rereading memories from an existing save. Generic “World conquered” copy should become “Passage cleared” specifically for Black Sea so the victory does not claim dominion over the whole sea.

---

## 2. Structure

### The lobby: inside the jar (a 256×144 pixel scene)
The round clay chamber. The hero idles in the middle and walks to whatever you click.

| Station | Opens | Notes |
|---|---|---|
| **Portal** (moon gate of light) | World select | Rooms cleared, seals, first-clear rewards left. Protected routes across the sea; hidden destinations appear after the Timestream falls. No difficulty labels |
| **Memory Pavilion** (lantern pavilion) | Training, spar, battle sim, trials, codex | See below |
| **Talent Altar** (incense shrine) | Talents + spins | as today |
| **Mirror** | Skins | as today |
| **Tally Wall** | Identity, Kills, level/stats; re-read fragments | where the lore lives |
| **Memory Urns** | Vault: save/load/export fighters | as today |
| **Resonance Stone** | Online | Lore: other jars, other Gu, felt through the clay across the Black Sea |
| **Lid** (overhead) | Final door | 15 seals; opens the final world when all are broken |

Global controls (sound, music, pause) stay in a thin top bar. Ability loadout is reachable from the lobby and between rooms.

### The Memory Pavilion
"A room that reconstructs what you have met." Nothing here pays campaign rewards.
- **Training Hall:** today's Training view: speeds, chart, rewards, learning settings, brain view. Opponents are limited to **enemies you've encountered**. Gives very little jade (cut from 1/5 to 1/10 of bounty).
- **Spar:** watch your fighter against any met enemy.
- **Simulation:** today's Battle mode (10 slots, teams, FFA), using met enemies only. 0 jade.
- **Trials:** today's trials.
- **Codex:** every met enemy with sprite, role, abilities, lore line, kills, and learn progress.
- **Learning abilities:** exposure counts both here and in worlds. The Pavilion is faster because you can train at 16x/Max, and it gets a ×1.5 exposure rate.

### A world run
- **Rooms in a line,** shown as a strip of nodes at the top of the screen. A boss room can sit mid-run (the Last Frontier has one) or at the end.
- **Each room is a battle** (the existing battle sim): your AI fighter on one team, the room's enemies on the other.
- **Every room starts at full health.** A loss offers *Retry room* or *Return to lobby*; the run's progress is kept until you leave.
- **Between rooms you coach:** change abilities, talents and skin, or retreat to the Pavilion. A run in progress is remembered.
- **Room types:**
  - *Skirmish:* 1–2 foes.
  - *Pack:* up to 4 of one kind.
  - *Warband:* up to 3 of different kinds.
  - *Elite:* one foe at higher stats.
  - *Boss:* one boss, alone. Bosses never group.
- **Spawning:** each world has a foe pool with weights and companion tags (who groups with whom). Each room has a **threat budget** that rises through the run, and the spawner randomly draws a valid group that fits it.
- **Group limits:** at most 4 of the same kind; at most 3 when mixed; colossi count as 2 and never more than 2 per room.
- **First encounter:** a name card with an epithet plays as the room starts. The codex entry unlocks, and the enemy becomes available in the Pavilion.

### Rewards

| Source | Reward |
|---|---|
| Training (Pavilion) | 1/10 of kill bounties. Mainly brain and technique growth |
| Simulation, spar, trials | Nothing |
| First clear of a world's rooms | Tier I 150 · II 300 · III 500 · IV 750 · V 1000 · Hidden 1200 jade |
| First victory over each boss | A seal broken, plus **that boss's Transcendence finale unlocked**, plus Tier I 400 · II 700 · III 1000 · IV 1500 · V 2000 · Hidden 2500 jade |
| Repeat runs | Full kill bounties + 25% of the world's first-clear bonus. The reliable income |
| Online | unchanged |

### Transcendence finales
Today the Ultimate Special's last stage borrows a finale from "the boss it has felled most". In the campaign, finales become a **collection**:
- A boss's first campaign defeat unlocks its finale. Training or simulation kills don't.
- **Free choice:** the Tally Wall (Identity) lets you pick any unlocked finale for your special. Until you pick, it uses the most recently unlocked one.
- With none unlocked yet, the finale is the plain enormous blast, as today.
- Every boss in the campaign has a finale, the hidden ones included. The teacher Sword Immortal unlocks the ring of swords.

### Level
- **Only campaign kills count.** The level system otherwise stays as it is: unique kills, with caps of 300/300/30/250 spread across however many foe types exist. In the lore it is *the Gu feeding*, and a Pavilion reconstruction is a memory, so devouring it feeds nothing.
- **Implementation:** a separate campaign kill record drives the level. The Kills page keeps everything.
- **Existing saves start the campaign at level 1.** Their kill history stays visible.

---

## 3. The worlds

**Any non-hidden world is enterable at any time.** The portal shows danger relative to your level.

| Tier | Worlds | Bosses (= seals) |
|---|---|---|
| I · Early | The Last Frontier | Bandit Warlord, Deadeye |
| II | Red Dust Temple, Night Country | Grand Abbot · Vampire Lord, Lich |
| III | Myriad Sword Peaks, Netherworld Abyss | Sword Immortal (as teacher) · Zerg Queen |
| IV | Eastern Isles, The Nine Heavens | Blind Gentleman · Dragon Emperor, Sun Wukong |
| V · The gate | Timestream | Time Administrator |
| Hidden (after the Timestream) | Cursed Domain, Black Sea, The Pallid Kingdom | Gojo, Mahoraga · Headless Scholar · King in Yellow |
| After all 15 seals | Heaven's End Summit (Myriad Sword Peaks) | Sword Immortal, serious (optional; unlocks ending two) |
| Final (all 15 seals) | The Bottom of the Jar | ??? → Yun Xi |

Primordial Wilds is removed, and its foes are spread across the other worlds.

**Why this order.** Your ranking of boss strength is: the Sword Immortal, then Wukong, Mahoraga, the Blind Gentleman and the Scholar, then everyone else.
- The Sword Immortal is the strongest, so the open world gets a teacher who holds back, and the real one waits at the end.
- The Blind Gentleman moves up to Tier IV.
- The Nine Heavens is now above the Netherworld Abyss and is the last open world before the gate, with Wukong as its climax.
- Mahoraga and the Scholar sit in the hidden tier.
- **Base strength doesn't have to match the tier exactly.** Each boss gets a campaign tuning multiplier, set by the balance harness. The Time Administrator is weaker than Wukong at base, so as the gate boss he's tuned up. Wukong may be tuned slightly down for Tier IV.

### 3.1 The Last Frontier (Tier I, merged)
The early-game world: lawless badlands that turn into a frontier town. It's long, but it teaches one thing at a time.

| Stretch | Rooms | Foes | Teaches |
|---|---|---|---|
| The badlands | 1–3 | Bandit, Berserker, Boxer | melee basics; bandit packs up to 4 |
| | **Boss** | **Bandit Warlord** | the first boss: one big body, simple kit |
| The frontier town | 4–6 | Fencer (gambler-duelist), Crab Warrior, Mutant (frontier freak-show) | parries, shells, odd mechanics |
| | | Gunslinger, Sniper, Archer, Alchemist (snake-oil peddler) | ranged pressure, closing distance |
| | **Boss** | **Deadeye** | camo and ranged as a boss |

- 10 foes, all existing, no new art needed.
- Crab and Mutant appear only as late-room elites, because they're the trickiest early foes.

### 3.2 Red Dust Temple (Tier II)
- **Boss:** Grand Abbot
- **Foes:** Buddhist, Tai Chi Master, Drunken Master, Druid (a mountain hermit who rides with tamed tigers and bears), **+ Staff Monk** (new: long reach, temple drill lines of 3–4), **+ Bronze Arhat** (new: golden-bell body, an immovable guardian)
- Teaches breaking guards and posture.

### 3.3 Night Country (Tier II)
- **Bosses:** Vampire Lord, then Lich
- **Foes:** Vampire, Werewolf, Zombie, Necromancer, Spider Demon, **+ Gargoyle** (new: perches stone-hard, then dives), **+ Ghoul** (new: fast pack bruiser, packs of 4, eats corpses to heal)
- Groups: zombie hordes; necromancer + zombies; spider + webs + ghouls

### 3.4 Myriad Sword Peaks (Tier III)
- **Boss: the Sword Immortal, as a teacher.** He knows what the hero is, and he chooses to teach instead of kill. This is a campaign variant of the existing boss:
  - **Holds back:** about 60% damage and no true damage. He opens slowly, and only into openings you can read.
  - **Form one:** the First to Eighth Swords, drawn as demonstrations. Each one gets a clear wind-up, and he names the sword aloud as he draws it.
  - **Form two, The Lesson:** the Ninth to Twelfth Swords, at reduced count and size. No Unfinished Manual.
  - **He doesn't die. He yields.** At about 10% health he lowers his sword: *"Enough. That is all you can carry for now."* That counts as the victory: the seal, the ring-of-swords finale and the jade.
  - **The parting glimpse:** as he leaves, he draws the Thirteenth Sword once, into the sky, never at you. The heavens of his world split along it and stay split. It shows what he was holding back.
- **His manual is learnable, as today,** and this fight is where it naturally happens: each sword he demonstrates counts toward learning it.
- **Foes:** Sword Cultivator, Talisman Master, Formation Master, Spear Master, **+ Outer Disciple** (new: weak swordsman; packs of 4 that fly swords together)
- Groups: cultivator + talisman + formation; disciple packs

### 3.5 Netherworld Abyss (Tier III)
- **Boss:** Zerg Queen
- **Foes:** Demon, Western Dragon, Stone Golem, Scythe Reaper, **+ Zergling, Spitter, Bloater, Brute** (promoted: the abyss's brood, packs up to 4), **+ Imp** (new: tiny and fast, packs of 4, fire darts), **+ Hellhound** (new: beast, packs of 3, burning bite)
- *For later:* the Asura King as a second Abyss boss, before the Zerg Queen. It isn't in the plan for now.

### 3.6 Eastern Isles (Tier IV)
- **Boss:** The Blind Gentleman
- **Foes:** Samurai, Ninja, Oni, Magician (kitsune), Hydra (an eight-headed serpent of the isles), Shapeshifter, **+ Yuki-onna** (new: frost caster, slows, ice mirrors), **+ Tengu** (new: wind trickster, gust ring-outs, feather darts)

### 3.7 The Nine Heavens (Tier IV, the last open world before the gate)
- **Bosses:** Dragon Emperor, then Sun Wukong (who once wrecked heaven)
- **Foes:** Angel, Paladin (holy knight), Phoenix, Eastern Dragon, Djinn, **+ Heavenly General** (promoted from the Emperor's summon)

### 3.8 Timestream (Tier V, the gate)
A river of broken moments: eras torn loose and drifting past each other. The keeper's own world, so it's the hardest of the open worlds.
- **Boss:** Time Administrator. Beating him uncovers the hidden worlds.
- **Foes:**
  - Combat Cyborg, Gravity Mage (existing)
  - **+ Drone Swarm** (new: tiny drones, packs of 4, dive in turns)
  - **+ Sentry Drone** (new: hovering marksman; laser sight, then a burst)
  - **+ Chronomancer** (new: caster; slows you, hastes allies, plants time mines that freeze, rewinds a fallen ally once)
  - **+ Chrono Soldier** (new: rewinds itself to full the first time it dies)
  - **+ Glitch** (new: trickster that copies your last-used ability)
  - **+ Displaced Legionary** (new: a soldier torn out of an older era; shield wall with others of its kind)
  - **+ Paradox Twins** (new: always spawn as a pair; kill one and the other rewinds it unless both fall within 3s)
- Groups: drone swarms under a sentry; a chronomancer behind chrono soldiers; legionary shield lines

### 3.9 Cursed Domain (hidden)
- **Bosses:** Satoru Gojo, then Mahoraga
- **Foes:**
  - **+ Fly Head** (new: grade-4 curse, tiny, packs of 4)
  - **+ Cursed Spirit** (new: grade-3 curse, packs of 3–4, lunges and spits)
  - **+ Finger Bearer** (new: grade-1 curse, a hulking bruiser that grows with each hit it lands)
  - **+ Cursed Corpse** (new: a sorcerer's puppet guardian; fights on until its core is broken)
  - **+ Curse User** (new: caster with a binding vow; stronger the lower its health)
  - **+ Straw Doll Sorcerer** (new: marksman; hammers nails, then resonance hurts you through a doll)
  - **+ Cursed Speech Sorcerer** (new: caster; spoken commands like "Don't move" root and "Blast away" knocks back; each one costs it health)
  - **+ Shikigami Hound** (new: Ten Shadows dog, packs of 2)
- Groups: curse packs; sorcerer + corpse + hounds
- All of these are generic archetypes, not specific characters.

### 3.10 Black Sea (hidden)
One reachable passage through the expanse between worlds. Distant islands are whole realities, not ordinary landmasses. The portal has always carried the hero across this sea; now he can finally see it.
- **Boss:** The Headless Scholar, a traveler whose painted domain has spilled across this passage. Defeating him clears the route and breaks its assigned seal, not the sea itself.
- **Current implemented foes:** Chessboard Scholar, Lamp Bearer, Headsman Butcher, Coffin Bearer, Flutist; ink dragons as elites. Keep these as the inhabitants of his painting and the stretch near his encounter. Their existence and art remain valid.
- **Visual direction:** black water and isolated world-lights across most of the passage; the white sky, brushwork and ink palette intensify near the Scholar. His second form, World Within a Painting, still makes sense: the fight enters his domain.
- **Possible future inhabitants, not committed roster additions:** Ferryman (displacement), Face Collector (stolen identities), Unfinished Man (partial existence), Door That Walks remain reserve ideas. These are not included in the new-foe count or build commitment below.
- **No new travel system required:** existing room nodes represent stops along a crossing. Island exploration, World Drift, moving boundaries and new enemies are separate future scope, not prerequisites for this lore revision.

### 3.11 The Pallid Kingdom (hidden)
A court under twin suns on the shore of a cloud-lake. Bells ring. Everyone wears a mask.
- **Boss:** The King in Yellow
- **Foes:**
  - **Faceless Courtier** (promoted puppet)
  - **+ Hastur Cultist** (new: caster; madness that inflicts fear)
  - **+ Byakhee** (new: flying beast, swooping dives)
  - **+ Pallid Dancer** (new: trickster in a pale mask; charm, hypnotic step)
  - **+ Pallid Knight** (new: guardian in tarnished yellow plate; posture-proof while its mask is intact)
  - **+ Choir of Hali** (new: caster trio; while singing, allies hit harder and a madness aura spreads)
  - **+ Unmasker** (new: trickster; strips your buffs and awakening, then wears them)
  - **+ Lake Hali Horror** (new: colossus; tentacles rise from the cloud-lake at the stage's edge)

### 3.12 The Bottom of the Jar (final, all 15 seals)
- **Rooms:** **Discarded Iterations**, *his own past selves*. The game stores snapshots of the fighter's brain at life milestones (lives 50, 200, 500, 1000...). These rooms are fought against those older networks, wearing his skin, greyed out. You literally fight what your training chart used to be.
- Then the Time Administrator once more. Then ??? and her second form, Yun Xi, and her last gamble. Then the ending.
- Needs snapshot saving (a 64×64 net is about 40 KB; keep ~6) and a foe that runs a brain instead of foe AI. Battle mode's AI slots already do this.

### 3.13 Heaven's End Summit: the serious Sword Immortal (optional; after all 15 seals)
When the last seal breaks, a new peak rises behind the Myriad Sword Peaks, above the sky he split for you. He is waiting there, and this time he isn't teaching.

- **How it's set up:**
  - It's one room: a single duel, no rooms before it.
  - He says (draft): *"I taught you because the jar would finish you either way. Now see what you are being finished into."*
  - It's optional. The Door ending doesn't need it, but ending two does.
- **How he fights:** today's Sword Immortal at full strength, the strongest boss in the game. Then more on top:
  - All thirteen swords, as true damage, with the advanced forms.
  - The Unfinished Manual from the start of his second form, so he can't die until he has drawn the Thirteenth.
  - A campaign tuning above everything else in the game.
  - This is where the "strongest boss" is finally shown, and it should feel like a wall.
- **The Thirteenth Sword, aimed at you this time:** the stroke that cut his sky in 3.4 now comes down on the arena. Surviving it is the fight's climax. After he draws it, his manual makes him fall, as today.
- **Reward:**
  - The torn **Fourteenth Page**, which unlocks ending two.
  - His Transcendence finale upgraded to *Heaven and Earth, One Sword*: a single stage-splitting stroke.
  - A large jade payout.
  - The Thirteenth Sword itself stays unlearnable as a technique, as now. The finale is his gift, not a learned sword.
- **Lore:** he is the one echo in the jar who understood what it is. Teaching the Gu was his way of fighting the Jar-Setter. The serious duel is his last lesson: power is not the way out.

### Every existing foe has a home

| World | Existing | Promoted | New |
|---|---|---|---|
| Last Frontier | Bandit, Berserker, Boxer, Fencer, Crab, Mutant, Gunslinger, Sniper, Archer, Alchemist | | |
| Red Dust Temple | Buddhist, Tai Chi, Drunken Master, Druid | | Staff Monk, Bronze Arhat |
| Night Country | Vampire, Werewolf, Zombie, Necromancer, Spider Demon | | Gargoyle, Ghoul |
| Myriad Sword Peaks | Cultivator, Talisman, Formation, Spear Master | | Outer Disciple |
| Eastern Isles | Samurai, Ninja, Oni, Magician, Hydra, Shapeshifter | | Yuki-onna, Tengu |
| Nine Heavens | Angel, Paladin, Phoenix, Eastern Dragon, Djinn | Heavenly General | |
| Netherworld Abyss | Demon, Western Dragon, Stone Golem, Scythe Reaper | Zergling, Spitter, Bloater, Brute | Imp, Hellhound |
| Timestream | Combat Cyborg, Gravity Mage | | Drone Swarm, Sentry Drone, Chronomancer, Chrono Soldier, Glitch, Displaced Legionary, Paradox Twins |
| Cursed Domain | | | Fly Head, Cursed Spirit, Finger Bearer, Cursed Corpse, Curse User, Straw Doll Sorcerer, Cursed Speech Sorcerer, Shikigami Hound |
| Black Sea | | 5 Scholar heads | |
| Pallid Kingdom | | Faceless Courtier | Hastur Cultist, Byakhee, Pallid Dancer, Pallid Knight, Choir of Hali, Unmasker, Lake Hali Horror |

- All 40 existing foes are placed. The Lich's three pieces appear only when the Lich falls.
- In total: **11 promoted** (art and AI exist; they need foe stats and codex entries) and **31 new**, plus the Discarded Iteration.
- The level caps stay reachable, because the level formula spreads the caps across however many foe types exist.

---

## 4. Balance: making the difficulty jumps real

**Dropped (phase 3).** Kept for reference only: the game shows no difficulty labels, and finding a way through a hard world is part of playing it.

1. **A reference hero.** A scripted fighter in a test harness (approach, strike, guard on enemy wind-up, roll out of zones, use abilities on cooldown) at a given level. It's deterministic, so numbers are comparable between changes.
2. **A threat score per foe.** Run the reference hero against each foe alone a few hundred times. Threat = health it costs the hero per kill, normalized so Bandit = 1. Group threat is measured too, not assumed.
3. **Room budgets from targets.** Each tier's recommended level is set so that *a hero who has felled everything in the earlier tiers lands at it*. Room budgets are then sized so the reference hero at that level wins:
   - early rooms ~85%, late rooms ~65%, elite ~55%
   - bosses ~40% on a first attempt
   - Retries are free, so a hard boss means a few tries or a trip to the Pavilion. That's the intended loop.
4. **Tier jumps.** At the *previous* tier's level, the next tier's first room should still be winnable (~50%), so skipping ahead is hard but possible.
5. **The Last Frontier gets a gentler curve:** first rooms ~95%, Warlord ~60%, Deadeye ~45%. It's the first impression.
6. **The hidden tier is tuned above the Timestream,** since it is only reached after it.
7. **Per-boss campaign tuning.** Each boss gets health and damage multipliers for the campaign. The harness sets them so the boss lands on its tier's target, whatever its base strength.
   - Base ranking from strongest: Sword Immortal (serious), Wukong, Mahoraga, Blind Gentleman, Scholar, then the rest.
   - Expected tuning: the Time Administrator up as the gate boss; Wukong slightly down for Tier IV.
   - The teacher Sword Immortal is aimed at ~55% at Tier III's level. He's a lesson, not a wall.
   - The serious Sword Immortal is aimed at ~15% for a max-level, well-trained fighter. It should feel like the hardest fight in the game, and it's optional.
8. **Script:** `tests/campaign-balance.cjs` prints the threat table and each world's room win-rates, and fails if any tier is out of its band. It runs with the existing regression tests whenever a foe changes.

---

## 5. Build order

Each phase leaves the game playable.

1. **Campaign core.**
   - World and room data, the spawner, and the run flow on top of battle mode.
   - First-encounter cards and the codex.
   - Rewards, seals, and the finale collection.
   - Campaign-only level.
   - Hidden-world unlock and per-boss campaign tuning.
   - Save migration: existing kills mark those enemies as met, and the campaign level starts at 1.
   - The Last Frontier works with existing foes only.
2. **Lobby and Pavilion.** The pixel jar scene and its stations. Today's panels move behind them (Training Hall, Simulation, Trials, Codex), and the top toolbar is retired.
3. **Balance harness: dropped.** Difficulty stays as the first-guess budgets and boss tuning, and the Portal shows no difficulty labels or recommended levels. When the fighter is stuck, it is up to the player to improve it and its build.
4. **Lore.** The original three fragment tracks, world vignettes, codex text, and changing lobby are built. Black Sea copy, arrival note and archive are implemented with fragment keys and completion-order tracking preserved.
5. **Promoted foes and the teacher.** The Heavenly General, the abyss brood, the Scholar's heads and the courtier. This completes the Nine Heavens, the Scholar's current Black Sea encounter roster, and most of the Abyss. Then the teacher Sword Immortal variant, with the yield and the glimpse of the Thirteenth.
6. **New foes, world by world, in tier order.** Temple, Night, Peaks, Abyss, Isles, then the Timestream, Cursed Domain and Pallid Kingdom. Each world gets a balance pass when it's done.
7. **The Bottom of the Jar (built).** Brain snapshots, Discarded Iterations, keeper rematch and ending one. The endings currently use text scenes.
8. **Heaven's End and ending two (built).** The serious Sword Immortal, the Fourteenth Page, the "Sheathe the sword" choice, and repeatable New Game+ cycles; the preceding fighter returns in the black coat.

---

## 6. Still open
Nothing at the moment. Open questions get added here as the build raises them.
