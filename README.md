# Neuro Arena

One pixel-art fighter learns to duel on a round stage by dying, over and over, and learning from each life.

## Run

Double-click `index.html`, or serve the folder:

```
python serve.py
```

then open http://localhost:8137. No build step and no dependencies: it is plain HTML, CSS and JavaScript (Python is only used for the little local server, which turns off browser caching while you edit).

**Host it for free:** the game is a static site, so it runs as-is on GitHub Pages. In the repository's **Settings → Pages**, set the source to the `main` branch and the root folder; it appears at `https://<your-name>.github.io/<repo>/`. That is also the easiest way to give friends the exact same version for online play.

**Tests:** with Node.js installed, `node tests/newfoes.cjs`, `node tests/yellowking.cjs`, `node tests/campaign.cjs` and `node tests/worldfoes.cjs` run the regression checks (mechanics of every foe and boss, long random duels that must never break, the worlds' rooms, the story's coverage and the teacher). The pages in `tests/` (open them through the local server) preview foes, bosses and effects.

## The Jar

The fighter wakes in a sealed jar with no memory. The gate leads to worlds bound to the jar; their champions hold the seals on its lid. The full plan (lore, all worlds, balance, what comes next) is in `docs/campaign-plan.md`; this is what is built so far.

- **The lobby** is the inside of the jar, drawn like the arena. Click a station and your fighter walks to it (the buttons above the arena do the same):
  - **Station unlocks:** a new jar has the Portal, Tally Wall (level, kills and memories), Memory Urns and Resonance Stone. Meeting the first enemy unlocks the Memory Pavilion. Learning the first ability unlocks the Fireplace (abilities and identity). One thousand deaths across world and Pavilion fights unlock the Talent Altar. Older saves recover only deaths still present in their saved training-life history; existing talent owners retain access. Conquering the first world unlocks the Mirror (lineage rolls and skin shop). Unlocks persist with the fighter, including across cycles; older saves retain access to talents and appearances they already own. Locked stations are absent from the scene and shortcuts, including training, and their child panels cannot be opened.
- **Fighter observations:** the Pavilion and fight footer show recent deaths, falls, timeouts, parries and evades. After at least three comparable encounters of at least five seconds with a ranged foe, a note reports if the fighter never reached striking distance. Ten comparable fights allow a comparison of parry/evasion rates over the last five versus the preceding five. Comparisons use the same mode, opponents and build; these describe measured behavior, not a guaranteed cause of death or proof of neural learning. The last 60 observations are saved with the fighter; training adds one every life, so only its latest ten are kept beside the world and Pavilion fights. The Pavilion puts its four training controls above the six activity buttons; spar shortcuts have been removed.
- **Portal** (门): the worlds (below).
  - **Memory Pavilion** (忆): a room that reconstructs what you have met. The Training Hall (speeds, chart), watching your fighter, fighting it yourself, Simulation (battle mode), Trials and the Codex, plus the training settings (opponents, rewards, learning, thinking). It can only reconstruct foes you have met in the worlds, so a new fighter meets its first foe there before it can train. Techniques are learned half again faster here than in the worlds, but nothing here feeds the level or pays more than a tenth of a bounty. A ghost of a foe you have met flickers inside it.
  - **Talent Altar** (玉) talents and spins, **Mirror** (镜) race rolls and skins, **Fireplace** (火) abilities and identity, **Tally Wall** (刻) level, kills and memories, **Memory Urns** (瓮) saving and loading fighters, **Resonance Stone** (联) online play.
  - **The lid** overhead wears the fifteen seals as paper talismans; each broken seal is a charred stub. The tally marks on the wall grow with your lives, one for every 1,000 completed lives.
- **Portal** (门): every world you can see. Any world can be entered, and nothing says how dangerous it is: some are far deadlier than others, and when the fighter is stuck it is up to you to improve it and its build. The three hidden destinations (Cursed Domain, Black Sea, the Pallid Kingdom) only appear once the Timestream's keeper falls.
- **A run** is a line of rooms, then the world's bosses. Each room is drawn at random from the world's foes within a threat budget: a skirmish, a pack (up to 4 of one kind), a warband (up to 3 different kinds) or an elite (one foe at 150% health and 120% damage). Bosses always fight alone. Your AI fighter fights every room; between rooms you coach it (abilities, talents, skins), or press **N** for the next room. Every room starts at full health, and a lost room is simply retried (**R**). Runs are kept when you reload.
- **Rewards:** a room's first clear pays its share of the world's exploration jade (150 to 1200 by tier); a boss's first defeat breaks one of the lid's 15 seals, unlocks its **Transcendence finale** and pays 400 to 2500 jade; a repeat run pays its foes' bounties and a quarter of the exploration jade.
- **First meetings:** a new foe gets a name card as its room begins, and goes into the **Codex** (典), with its abilities and how many you have felled in the worlds.
- **Bosses are tuned for the campaign** (health and damage), so each fits its tier whatever its base strength.

| Tier | Worlds | Bosses |
| --- | --- | --- |
| I | The Last Frontier | Bandit Warlord, Deadeye |
| II | Red Dust Temple, Night Country | Grand Abbot · Vampire Lord, Lich |
| III | Myriad Sword Peaks, Netherworld Abyss | Sword Immortal · Zerg Queen |
| IV | Eastern Isles, The Nine Heavens | Blind Gentleman · Dragon Emperor, Sun Wukong |
| V (the gate) | Timestream | Time Administrator |
| Hidden | Cursed Domain, Black Sea, The Pallid Kingdom | Gojo, Mahoraga · Headless Scholar · King in Yellow |

- **Memories:** conquering a world for the first time gives a memory back: a card with what that world was and how it ended, and a fragment of who the fighter is. The fragments come in the order you conquer worlds, on three tracks (the seven outer worlds, the Timestream, and the three hidden worlds), so the story always unfolds in the right order. They can be re-read on the Tally Wall, and the lobby remembers too: after the fifth, the older tallies on the wall are crossed out and 蛊 is carved beside them; later, one group is not crossed out, and a name is carved under it.
- **The Codex** gives every foe and boss a line of its own.
- **Promoted foes:** twelve creatures that used to appear only in a boss's retinue now hold worlds of their own, at full strength (boosted) and with their abilities: the Heavenly General in the Nine Heavens; the zergling, spitter, bloater and brute in the Netherworld Abyss; the Scholar's five heads (Chessboard Scholar, Lamp Bearer, Headsman Butcher, Coffin Bearer, Flutist) and the ink dragon as an elite in the Black Sea; the Faceless Courtier in the Pallid Kingdom. They count like any foe: met, felled, level and Codex.
- **The teacher:** in the Myriad Sword Peaks the Sword Immortal is teaching, not killing. His swords are demonstrations: slower to draw, never true damage, never past every defence. His second form is a lesson (the Ninth to the Twelfth Swords, drawn smaller, no Unfinished Manual), and at a tenth of his health he yields. The fight stops and nothing moves while a short scene plays: he says "Enough.", the snow hangs still, and after a pause one flash of sword light leaves a line cut across the sky. The light fills everything; on the white, his words are written out, and when the Peaks return he is gone, the sky stays cut, and the room is won (Skip or Esc goes straight there). Everywhere else (the Pavilion, battles) he is the Sword Immortal at full strength.

Every world now has foes of its own, including 25 made for the worlds (see **The worlds' own foes** below).

## Campaign arenas

Every campaign destination has its own pixel scene behind the stage, its own ground and its own floor, and something that moves while you fight: vultures over the frontier sunset, incense and red dust at the temple, bats across the moon, snow and a passing flying sword over the peaks, embers in the Abyss, falling petals on the Isles, a crane over the celestial palace, light flowing down the Timestream past turning clock hands, curses drifting under the Cursed Domain's dome, a ferry lamp crossing the Black Sea, black stars over the Pallid Kingdom, dust in the light at the Bottom of the Jar, and the split sky at Heaven's End. The two ending scenes have their own illustrations. The stage keeps the same combat boundary everywhere. `tests/arenas-preview.html` shows them all, animated.

Each also has its own **music**: a slide-guitar twang and a shaker on the frontier, temple bells and a wooden fish, a music box over an organ in the Night Country, a bamboo flute on the peaks, war drums under a tritone in the Abyss, a koto on the Isles, bright bells in the heavens, a ticking clock in the Timestream, a heartbeat in the Cursed Domain, near-silence on the Black Sea, an out-of-tune bell and a choir in the Pallid Kingdom. The jar, the lobby and the Pavilion keep the guzheng. Changing place crossfades.

## Races at the hearth

After conquering your first world, open the Mirror and choose Lineage. A race spin costs 100 jade and uses the same White through Black rarity odds as talents, with a separate 30-spin Purple-or-better guarantee. Duplicate races return jade; unlocked races can be equipped freely. Each lineage has its own appearance and a small leaning, never a power: one or two modest strengths for a modest cost (for example Windkin, +4% speed and 10% shorter roll cooldown for -6 health). No race uses a talent's signature effect, and none of its numbers is as large as the talent that grants the same thing; rarer races are more particular, not much stronger. One can be equipped at a time. Race effects stack with talents and apply to the next fight, including training and online matches. Existing fighters begin as Unformed.

## The final door and New Game+

After all 15 seals break, the portal reveals the Bottom of the Jar and the optional Heaven's End Summit. At the summit, the Sword Immortal fights at full strength; defeating him grants the Fourteenth Page and upgrades his Transcendence finale. After clearing the Bottom, the page unlocks the choice to sheathe the sword and begin a new cycle.

New Game+ keeps the fighter's brain, learned abilities, identity, talents, skins, jade and unlocked finales. Worlds, seals, campaign level, story memories and the page reset. The previous fighter returns at the end of the next cycle. Each cycle increases health and damage, room budgets and first-clear jade, and adds an elite room per populated world; from NG+3 regular foes also have a modifier. Older saves without snapshots can still enter the finale.

## How it learns

The fighter is a single neural network trained with PPO (reinforcement learning). Every 1/15 s it reads 52 senses and picks a direction and an action. The **Close distance and stay within reach** reward (+1.5 by default) pays for approaching the nearest foe and for time spent within striking range. Moving away reverses the approach reward. Set it to 0 (or below) for a ranged build. After every batch of decisions (1024 by default) it updates its network toward the choices that went better than expected.

Training happens in the Memory Pavilion's Training Hall (it keeps going while you walk the lobby). Speeds: 1x, 4x and 16x show the arena while it learns. **Max** hides the arena and shows the learning chart, roughly 2,000 decisions a second.

## Battle mode

In the Memory Pavilion (Simulation). Up to 10 fighters on the stage at once. Each slot can be **your AI fighter** (several copies share the trained brain), **you** on the keyboard, or any foe, boss or beast you have met. Put them on teams (up to 5) or switch to **free-for-all**. Presets: 1v1, 2v2, 5v5, and all seven bosses. Everyone targets the nearest fighter not on their team; summons fight for their summoner's side. The battle ends when one team is left (or, at the time limit, the team with the most health left wins), followed by a scoreboard with kills, damage and an MVP. Press R for a rematch.

## Playing online

Find other players by username, form a party of two, and either **duel 1v1** or **fight together** against up to four foes or bosses. Your trained fighters do the fighting: each player brings their own brain, learned abilities, talents, Ultimate Special and skin. Nothing about the fight travels over the network while it plays: when a match starts, both fighters are shared once and **each screen runs the same battle from the same seed**, so lag never matters. (Online fights use the level 1 fighter body, so levels don't carry over.)

### One-time setup (the person hosting does this once)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the project, open **SQL Editor**, paste the whole of `supabase/online.sql`, and run it. It creates the tables, the rules for who can read and write what, and live updates.
3. Open **Authentication → Sign In / Providers** and turn on **Allow anonymous sign-ins** (players sign in with no email; a username is all they need).
4. Open **Project Settings → API** and copy the **Project URL** and the **anon public** key.

### Playing

1. Everyone needs the **same version of the game** (share this folder, or put it on any static host such as GitHub Pages). Both screens must run identical code for the battles to match.
2. Open the **Resonance Stone** (联) in the lobby and choose a username. This copy of the game connects to the project in `js/online-config.js` on its own; to run your own project instead, put your Project URL and anon key there (or clear them, and each player pastes them into the panel once).
3. Type a name in **Find players** and press **Invite**. Your friend sees the invite in their Online panel and presses **Join**.
4. In a full party, press **1v1 duel**, or pick foes (Ctrl-click for several) and press **Fight together**. The match opens on both screens. Press **Share my fighter** first if you have trained since connecting; it is also shared automatically whenever a match starts.

The anon key is safe to share with friends: it only allows what `online.sql` permits (anyone signed in can look up usernames and fighters; only you can change yours; only party members see their invites and matches).

## The duel

Every move except guard costs energy (strike 10, heavy 22, kick 18, roll 20). Energy regenerates over time, and a parry refunds 25. Guard blocks but fills posture; full posture means stunned. Guarding just as a hit lands is a parry. Heavy breaks blocks but can be parried, the kick goes through a guard, and the roll only repositions. Chained hits add 2% damage each, up to +30%.

## Levels

The fighter's health, energy, energy regen and posture come from its **level**, not from settings. It starts at level 1 (100 health, 100 energy, 18 regen, 100 posture) and gains a level for every different foe or boss it fells **in the worlds** (summoned creatures don't count, apart from the twelve promoted to worlds of their own). Training, battles, sparring and trials don't count: they are only memories. There are 96 to fell, so level 97 reaches the caps: 300 health, 300 energy, 30 regen and 250 posture. The Fighter panel shows the level and current stats; new stats apply from the next life. The level is saved with the fighter and survives Forget everything. (Saves from before the worlds start at level 1.)

## Opponents

65 foes in 7 combat roles (the 25 newest, made for the worlds, are listed under **The worlds' own foes**). The role sets how they fight; each foe adds its own passive and active ability. Each role has a boss with a second phase at half health.

| Role | Habit | Foes | Boss |
| --- | --- | --- | --- |
| Bruisers | Rush in, keep the pressure on | Bandit, Berserker, Werewolf, Zombie, Oni, Mutant | Bandit Warlord |
| Duelists | Hold reach, parry and counter | Samurai, Fencer, Spear Master, Sword Cultivator, Boxer, Scythe Reaper | Sword Immortal |
| Guardians | Guard up, counter after blocking | Paladin, Buddhist, Tai Chi Master, Combat Cyborg, Crab Warrior | Grand Abbot |
| Tricksters | Erratic, teleport, hit and run | Ninja, Drunken Master, Vampire, Djinn, Spider Demon, Shapeshifter, Magician | Vampire Lord |
| Marksmen | Keep range, kite | Gunslinger, Sniper, Archer | Deadeye |
| Casters | Zones, summons, flee | Talisman Master, Druid, Necromancer, Angel, Alchemist, Gravity Mage, Formation Master | Lich |
| Colossi | Huge, unflinching, area attacks | Demon, Eastern Dragon, Western Dragon, Stone Golem, Hydra, Phoenix | Dragon Emperor |

The eastern dragons (the Eastern Dragon, both forms of the Dragon Emperor, the Scholar's ink dragons) are drawn as true long dragons: a horned, maned, whiskered head with an open jaw, a scaled serpent body that undulates as it moves, a crested back, clawed legs and a tail fin.

### The newer foes

| Foe | What makes it different |
| --- | --- |
| Oni | Iron kanabo club: a three-swing combo, a guard-crushing ground smash, and Demon Rage (4s of super armor: no flinching, 45% less damage, faster). |
| Mutant | Grows a random mutation every 20% of health lost (up to 4): extra arm (strikes land twice), bone spikes (thorns), acid blood, a tentacle (reach and a pulling lash), carapace, a second maw (lifesteal), a toxic sac (poison spew) or extra legs. Each one shows on its body. |
| Boxer | Slips your attacks sideways and counterpunches. Each landed punch builds momentum (up to 10: faster, harder); at 4+ it spends it all on a flurry ending in an uppercut. Body blows go through guard. |
| Scythe Reaper | Its scythe sweeps a wide arc and reaps health. A hook drags you straight into a four-cut combo ending in a full spin; it also throws soul crescents. |
| Crab Warrior | Takes half damage unless caught mid-attack. Scuttles sideways. An unblockable pincer grip crushes posture and hurls you toward the edge. Bubbles slow you. Molts at 35% health: heals, faster, angrier, no shell. |
| Spider Demon | Webs that root you, web traps, venomous bites, and cocoons anyone stuck in a web. Climbs over the edge and under the lip of the stage to burst up beside you. Knock it off the stage and it climbs back. |
| Shapeshifter | Spends the fight as enhanced beasts (Thunder Tiger, Ironhide Bear, Venom Serpent, Storm Roc, Ember Drake), each with its own body, moves and glow, 50% more health and 35% more damage. Every 6s it shifts into a different one and heals 15%. |
| Magician | The first hit every 7s strikes a decoy. Splits into identical decoys and shuffles among them, turns you into a rabbit, throws razor cards. At half health its true form appears: a nine-tailed kitsune with foxfire, charm and tail sweeps. |
| Archer | A charged piercing arrow; net, explosive and splitting trick arrows in turn; an arcing volley. Up close it knifes you, backflips away and shoots on landing. |
| Alchemist | Lobs fire, venom, frost, acid (corrodes: you take 25% more) and explosive flasks. Drinks an elixir once; its belt of flasks breaks open when it falls. |
| Gravity Mage | A well that pulls, a repulse toward the edge, a crushing field that slows you and stops your rolls, and a lift that holds you helpless, then slams you down. Bends projectiles away. |
| Formation Master | A barrier array (allies inside take 40% less, projectiles shatter), a bagua formation that detonates everywhere except its one green life gate, a sealing array that roots, and a formation that swaps your places. |
| Stone Golem | Hardens while it stands still (up to 5 layers, 12% less damage and posture each); moving sheds them, heavies and kicks crack them. Throws boulders that leave rubble; unblockable stomp. |
| Hydra | Heads that bite, spit acid and breathe fire on their own. Every 14% of health lost severs a head; the stump grows back as two (up to 7) unless a heavy or fire seals it. With no heads it takes 50% more damage. |
| Phoenix | Burns hotter the longer it fights (more feathers, wider fire, a sunburst at high heat, a burning aura at full heat). Falls as an egg: break it within 4s or it is reborn hotter, in blue and then white flame (twice). |

### The worlds' own foes

25 foes made for the worlds of the jar, each with its own ability to learn and a line in the Codex.

| World | Foe | What makes it different |
| --- | --- | --- |
| Red Dust Temple | Staff Monk | Long reach; a wide sweeping form and a long thrust. Drills in lines of up to four. |
| | Bronze Arhat | A golden-bell body (25% less damage, barely moves); a bell toll that throws everyone back, and an iron palm that breaks guard. |
| Night Country | Gargoyle | Turns to stone, layer by layer, while it stands still; dives from afar. |
| | Ghoul | Fast, in packs of four; when anything falls near it, it feeds and heals 40%. |
| Myriad Sword Peaks | Outer Disciple | Weak alone, but disciples fly their swords together: when one looses its sword, the others near it follow. |
| Netherworld Abyss | Imp | Tiny, quick, slips aside; flicks darts of fire. |
| | Hellhound | Circles, then a burning bite; fire doesn't hurt it. |
| Eastern Isles | Yuki-onna | A breath and a ring of ice that slow, and ice mirrors that look just like her. |
| | Tengu | Blinks on the wind; a fan gust that throws you toward the edge, and feather darts. |
| Timestream | Drone Swarm | Tiny drones in fours that dive in turns. |
| | Sentry Drone | Hovers at range: a laser-sighted round that breaks guard, and a burst. |
| | Chronomancer | Time mines that freeze, a field of slow time, haste for its allies, and once a fight it turns a fallen ally's clock back (half health). |
| | Glitch | Casts the last ability you used, back at you. |
| | Paradox Twins | Always two. When one falls the other brings it back three seconds later, unless both fall within those three seconds. |
| Cursed Domain | Fly Head | The smallest curse, in fours. |
| | Cursed Spirit | Packs; a lunge and a corroding spit. |
| | Cursed Corpse | A puppet that gets back up once, unless its core is broken (a posture break or a ring-out). |
| | Straw Doll Sorcerer | Its nails stay in you (up to six); then it strikes the doll and they all resonate, past any guard. |
| | Cursed Speech Sorcerer | "Don't move" roots you; "Blast away" throws you across the stage. Nothing blocks a word, and each one costs it health. |
| | Shikigami Hound | In pairs; leaps out of its shadow and breaks guard. |
| The Pallid Kingdom | Hastur Cultist | The Yellow Sign burns under you and fills you with fear. |
| | Byakhee | Circles on wings, then swoops. |
| | Pallid Dancer | Sways out of blows; a pale kiss that draws you to her, and a spinning kick. |
| | Pallid Knight | While its mask is intact its posture can't break; three heavies or kicks crack it off. |
| | Lake Hali Horror | Barely moves; tentacles rise from the lake at the edge of the stage near you and drag toward the edge. |

New conditions they bring: fear (the Yellow Sign), freezing (time mines), nails (the straw doll) and haste (for the Chronomancer's allies).

Knockback from a crowd of summons doesn't stack: a burst of their blows pushes about as far as the strongest one. New conditions: poison, slow, polymorph, charm, cocoon, levitation, corrosion, webs and pincer grips. They work both ways (several are learnable), and bosses shrug off the controlling ones. ??? can now roll the newer foes' skills too, including the beasts', the kitsune's and the mutations'. A necromancer (or the Lich) that kills a summon raises it on its own side.

### Bosses

Each boss has its own model and a second form it transforms into at half health (invulnerable for 1.6s, then faster, shorter cooldowns, +25% damage). The first form holds back (85% health and damage). The Grand Abbot takes 20% less damage (40% as the Golden Arhat, and far less during his ultimates). Below 65% health they start using a cinematic **ultimate**: the stage darkens, the name appears, a charge-up, then a scripted barrage during which the boss takes half damage. In the second form their skills change and the ultimate is replaced.

| Boss | Ultimate (form one) | Second form | What changes | Ultimate (form two) |
| --- | --- | --- | --- | --- |
| Bandit Warlord | Rampage of the Horde | Blood Tyrant | Harder charge, a lifestealing blood whirl | Tyrant's Massacre: spinning axes thrown in rings |
| Sword Immortal | Ninth Sword: Ten Thousand Swords Return to One | Perfect Sword Intent | The Tenth to Twelfth Swords; no longer needs to swing | Thirteenth Sword: Heaven and Earth, One Sword |
| Grand Abbot | Descent of the Golden Buddha | Golden Arhat | A bigger, harder palm | Ten Thousand Hands of the Buddha: a thousand-armed Buddha rises behind it and rains 24 palms, plus two rings of palms |
| Vampire Lord | Crimson Eclipse | Nosferatu | Bat-swarm lunge; homing bats that feed it. Once per fight it rises from death at 10% health with double lifesteal for 6s | Blood Moon: a 6s domain under a red moon; an illusion clone (30% health, half damage) fights until the moon sets; drains everyone nearby |
| Deadeye | Dead Man's Hand | Reaper of the West | Form one: quickdraw, ricochet shots that bounce off the ring edge, a laser-sighted shot, and High Noon (a crosshair that hunts you, then fires). Form two: rides a hellfire horse, a chain that drags you in, burning ricochets and shots, dynamite | Hellride: gallops round the ring leaving fire, hooks you, then five hellfire shots |
| Lich | Night of the Dead | Lich King | Raises skeletons; green soul spikes | Wyrm of the Dead: a Bone Dragon rises and breathes soulfire three times, plus skeletons and soul orbs |
| Dragon Emperor | Heavenly Tribulation | Celestial Dragon | Golden lightning; the Celestial Court appears in the sky and sends heavenly generals | Wrath of the Celestial Court: generals descend, three storms of golden lightning, a golden breath |

**Deadeye** is half-invisible (Heat Haze): it's drawn as a faint shimmer, and anyone aiming at it aims a little off. Melee swings and shots each have a 40% chance to pass through the shimmer ("MISS"), homing shots can't find it, and even your fighter's senses see it slightly out of place. It flickers into view for a moment whenever it fires or gets hit.

**The Lich** falls to pieces when it dies: **Lich's Head** (floats and casts soul orbs and spikes), **Lich's Torso** (slow and heavy, a soul shockwave from the ribs) and **Lich's Leg** (fast, hopping kicks). They keep fighting and can't be claimed by the King in Yellow.

### Super boss: the Time Administrator

A figure in a dark suit with a glitching clock for a face; its body tears and skips. 340 health (289 in the first form), worth 300 jade.

- **Time Stop:** everyone fighting it freezes for 1.6s (the world goes cold and a clock hangs in the sky).
- **Rift:** pulls a random regular foe through to help, up to 3 at once.
- **Phase:** 30% of attacks pass straight through it (50% as the future self).
- **New arrivals:** its rift can pull through any regular foe, the newer ones included, and the future self borrows the newer bosses' ultimates too.
- **Rewind:** after taking a beating it turns its own clock back about 4 seconds: health and position.
- **Clock Hands:** spinning clock hands thrown as projectiles.
- **Ultimate, The Stopped Clock:** freezes time, fires five guard-breaking shots at you while you can't move, two rings of clock hands and a rift.
- **Second form, You, From the Future:** it is the player from the future. Faster and stronger, it uses a random boss's first-form ultimate every 8 seconds once below 65% health.

### Super boss: the King in Yellow

Once met, select **King in Yellow** under the Pavilion's **Opponents → Bosses** (then use **Watch it fight** to watch a duel), or choose him in a Battle slot. He has 440 base health (374 after the normal first-form boss scaling) and awards 300 jade.

- **Sovereign of Carcosa:** all summoned creatures, including enemy summons and illusions, immediately join his team. Existing summons convert before their next action. With multiple Kings, the first living King owns newly claimed summons; ownership stays stable. Normal battle participants are not converted.
- **Beyond time:** immune to roots, fear, flinching, parry recoil, posture breaks, knockback and time stop. His own attacks bypass phase/ward talents, roll invulnerability and transformation immunity; ordinary guard and parry still work against his basic melee attacks.
- **Silken Exodus:** a 0.65-second wind-up unweaves his silhouette into individually flapping yellow birds with forked silk tails. The flock arcs toward his target and reforms over 0.45 seconds. Each dash restores 4% of his maximum health, capped at full health. A spectral copy stays at the departure point for exactly 2 seconds, then bursts into madness dust within 28 units (16 base damage and 0.8 seconds of fear). Base cooldown: 6 seconds.
- **Yellow Court:** summons two faceless puppets, up to four of his own minions. Yellow strings descend from the sky; each puppet clings to a nearby enemy for 2 damage every half second. Puppets can be killed. Base cooldown: 9 seconds, energy cost: 35.
- **Twin Black Stars:** his first ultimate creates two rapidly accelerating black stars that spiral inward while pulling enemies toward them. At 4.6 seconds they merge and explode once within a marked 90-unit radius for 42 base damage plus 8% of enemy maximum health. The remaining 1.4 seconds show the shockwave and debris; there is no connecting beam. Charge: 1.3 seconds; base cooldown: 18 seconds.
- **True Form Descends:** at half health, the normal 1.6-second boss transformation sheds his mask and robes, revealing tendrils, black stars and cosmic geometry. A grey/black-blue veil covers the arena. Every second, enemies take damage based on 0.75% of their maximum health; allies are spared.
- **Cosmic Eye:** unlocked in true form. After a 1.2-second wind-up, an enormous eye deals damage based on 12% of enemy maximum health and forces them to flee for 1.6 seconds. Base cooldown: 12 seconds.
- **A Galaxy Falls on Carcosa:** the second ultimate charges for 1.6 seconds, then lowers an entire spiral galaxy over the stage. After another 2.5 seconds it impacts all enemies for 24 base damage plus 10% of their maximum health. Base cooldown: 20 seconds.

Damage uses the existing combo, boss-phase and defensive multipliers. True form gains 15% movement speed, 25% damage and 30% shorter cooldowns. Cosmic effects end when their caster dies. Canary yellow and pale gold sprites, pixel scanline displacement and shimmer are drawn at the existing 256×144 resolution.

His artwork includes shaded ceremonial robes, a pallid mask, animated silk trains, a breathing mass of black lobes with thick curling tentacles and tiny suckers, independent accretion rings, a layered iris and a multicolored three-arm falling galaxy. Eleven dedicated synthesized sound cues use detuned bells, rustling silk, breath-like noise and sub-bass. Open `tests/yellowking-preview.html` through the local server for animated previews and sound auditions; its audio check renders every cue offline and checks for silence, invalid samples and clipping. Run `node tests/yellowking.cjs` and `node tests/newfoes.cjs` for combat regression checks; `tests/foes-preview.html` (through the local server) shows any mix of foes fighting, plus a sheet of every sprite.

- **Future arsenal (second form):** every few seconds it pulls a weapon from the future out of thin air, each usable once per fight: Plasma Rifle (five-shot burst), Railgun (laser-sighted, pierces everything), Orbital Strike (a red targeting laser follows you, then a beam from orbit), Gravity Grenade (drags you into a dark well, then bursts), Drone Swarm (five drones that circle and dive), EMP Grenade (a crackling blast that wrecks posture), Phase Shield (soaks 50 damage for 6 seconds).
- **Third form, You, From the Past:** when the future self dies, what's left is you from years ago (half health and no borrowed ultimates, but it hits harder than a normal fighter, takes 50% less damage and is immune to every status effect). It reaches back in time instead: **Past Self** strikes a ghost of you from 3 seconds ago and the wound arrives in the present a moment later; **Yesterday** drags you back to where you stood 3 seconds ago; its ultimate **Paradox** does both to everyone at once.

### Super boss: ???

A figure in a long black windbreaker and a wide-brimmed hat; only two pale eyes show under the brim, and smoke curls at its feet. 260 health (221 in the first form), worth 300 jade. All of its attacks do 50% of their usual damage, in both forms, and it keeps at most 4 summons at once.

- **Multi-cast:** every second it picks any regular foe's skill (no dashes or teleports) that fits the distance, rolls a die, and casts it that many times at once (1-6). The die and the skill appear over its head.
- **Never runs out of energy.** Untouchable while rolling (like Shadow Step) and dodges about 45% of wind-ups.
- **Unstoppable:** a 50% chance to shrug off any stun, root, scare or interrupt (posture breaks, cancelled casts, the King's fear, Gojo's domain); "RESIST" pops up when it does. Time stop always lands.
- **Against the Odds:** the lower her health, the less damage gets through (up to 90% near the end) and the faster she casts (her cast cooldown falls from 1s toward 0.5s). Her last gamble is unchanged: 2 seconds untouchable, a new cast every 0.1s.
- **Second form, Yun Xi, Gambler of Fate:** the disguise falls away and a girl with silver hair stands there in a white aura. "Wait... do I know her?" She still casts every second, the die always shows at least 4, and she casts only bosses' non-ultimate skills (the King in Yellow's and Gojo's included). She dodges about 85% of wind-ups.
- **Last gamble:** at 0 health she goes all in: for 2 seconds she casts a random skill every 0.1s (any non-ultimate, non-dash skill, regular or boss), then falls. She can't be hurt meanwhile.
- **Second form is sharper:** her resist chance rises from 50% to 75%, her skills do 65% damage instead of 50%, and the die never rolls below 4.

### Super boss: the Blind Gentleman

Frail (140 health), but he parries, slips and counters a great deal. Every parry, dodge and counter clears his mind: more damage, speed, shorter cooldowns and more falling petals. Everything he does is true damage (it ignores armor, shells, stone and other reductions).

- **Mikiri:** summons and multi-hit attacks (flurries, spins, volleys, multi-casts, barrages) are deflected 50% of the time (65% in his later lives).
- **Iaijutsu:** a draw too fast to see; he is already behind you, and a white line hangs where he passed.
- **Sakura:** petals fall over the arena now and then and land as cold blades.
- **Undying Heart:** he dies four times before he truly dies. Each time he rises with half the health, but far stronger.
- His ultimates can't be broken off by posture breaks or fear once he starts drawing.
- **Ultimate, lives one and two: Judgment of a Thousand Cuts.** He vanishes and the air is cut again and again around you, then once more, hard, and the picture itself cracks and shatters like a mirror.
- **Ultimate, lives three to five: Severing the Heavens.** He draws once. He is untouchable, the cut passes through every defense (guard, ward, phase, shields, Infinity), the sky splits in two along it, and the half of the world beyond the cut freezes, still and cold, for a moment while everything else moves on, then cracks and falls away like a broken pane. It takes 7% of your maximum health on top.

### Super boss: Sun Wukong, the Monkey King

- **Hair clones:** plucks hairs that become monkeys (up to 9 at once, 24 health each). They are indistinguishable from him (same look, same aura, no health bar) and use his skills and even his ultimates, at 25% of the damage.
- **Light hands:** he and his clones push far less than their blows suggest, so they rarely knock you off the stage.
- **Staff Spin:** when shots come at him he spins the staff into a wheel that sends them back.
- **Ruyi Jingu Bang:** the staff extends across the stage. **Cloud somersault:** one bound and he lands behind you, staff first.
- **Sky Slam:** leaps high and brings the staff straight down.
- **Diamond Body, Fiery Golden Eyes:** 520 health and 25% less damage taken; immune to fire, and he looks straight past decoys and illusions.
- **Second form, Heaven and Earth Dharma Form:** at 30% health he becomes a towering golden gorilla, back to full health; his clones become gorillas too (48 health), taking 45% less damage and never flinching; the staff sweeps the whole stage and his sky slam shakes it.
- **Ultimates** (cast on the move; he is untouchable while they open): Ten Thousand Monkeys (a ring of clones, and the Ruyi Jingu Bang, grown to the size of the sky, dropped on you twice); as the giant, The Pillar That Holds Up Heaven (the staff lowered across the whole stage three times, then dropped straight down, its impact rippling out across the stage).

### Super boss: Mahoraga

Tanky (460 health, 10% damage reduction, hard to break). The Dharma wheel above its head turns whenever a phenomenon hurts it. Each kind of attack is tracked on its own: strikes, heavies, kicks, each learned ability, projectiles, spells, poison, fire, conditions, Infinity and stopped time. Each quarter turn heals it and resets its posture. After a full turn it has adapted: 75% less damage from that kind, projectiles it has adapted to are sent back, and blows it has adapted to are often countered. The wheel only holds three kinds at once: a fourth makes it let go of the oldest, so mixing up your attacks keeps it off balance. It slowly adapts to everything over time, and faster in its second form.

- **Sword of Extermination:** a three-cut combo ending in a true-damage cleave, a divine fist, an unblockable stomp.
- **Ultimate, Divine General's Judgment:** turns the wheel on everything at once, then brings the sword down twice.

### Super boss: the Zerg Queen

- **Brood-Bound:** she arrives with a brood and cannot die while any of it lives. Once the brood is all that holds her up, she spills out elite bladeguards every 0.8s; they fight hard but can't keep her alive. Clear the true brood, then finish her.
- **The endless brood:** hatches every 2s (faster in her second form); she heals a little whenever one of her brood dies (about 1.5% of her health, 3% for a brute, 4.5% for a bladeguard, nothing for broodlings), zerglings (most of them), spitters that shoot from range, bloaters that burst into acid, and armored brutes.
- **Carapace:** hardens into a shield worth 20% of her health for 8s.
- **Creep:** her swarm heals and runs faster on it; you slow down. She transfuses her wounded.
- **Second form, Mother of the Swarm:** a tall humanoid with bone wings and bladed limbs who fights up close, hatches only brutes and elite Bladeguards (scythe-armed, fast), and empowers her brood: every zerg alive gets +40% health and damage, for good.
- **Ultimate, The Swarm Hungers:** zerg pour in from the edges.
- The King in Yellow can't claim the swarm, but against him they deal half damage and take 50% more.

### Boss: the Sword Immortal and the Thirteen Swords of Heaven's End

(Formerly the Sword Saint.) A slender immortal in layered white and pale-blue robes, long black hair with ribbons tied in it and a gold pin in the topknot, standing on a flying sword (gold guard, red tassel). Riding it, he is very fast, and the wind streams off the blade. In his second form his hair turns silver, his eyes and crown burn with sword light, and six small swords circle him under a faint halo. His whole art is one manual that begins with mortal technique and ends with a sword even Heaven cannot withstand. He picks from it freely and strings swords together (the Second's lunge into the Fourth's crescent, the Third's rain into the Eighth's celestial sword...).

| Sword | Name | What it does |
| --- | --- | --- |
| First | Drawing the Sword | An instant, precise draw-slash. |
| Second | Chasing the Wind | A lunge that leaves afterimages, each slashing a beat later. |
| Third | Falling Rain | A rain of small swords onto you and around you. |
| Fourth | Sweeping the Moon | A wide crescent of sword aura that crosses the arena. |
| Fifth | Returning Swallow | A thrown sword that curves wide and comes back from behind. |
| Sixth | Hundred Shadows | Sword shadows strike in from every side at once. |
| Seventh | Severing the River | A towering wave of sword energy across the battlefield. |
| Eighth | Piercing the Heavens | A gigantic celestial sword descends onto you, following you until the last moment. |
| Ninth | Ten Thousand Swords Return to One | His ultimate: two dozen swords ring you in a circle that covers most of the arena, then all converge, then one thrust. |
| Tenth | A Sword Without Form | Second form, beyond the mortal realm: he slowly raises a hand and, without ever swinging, the air itself cuts. Dozens of large invisible cleaves (forty in the advanced form) open across the arena, most of them around you, each one telegraphed for a moment by a warp in the air. |
| Eleventh | Severing Cause and Effect | Second form: a slow stroke that cuts the cause, not you. Five red lines (eight in its advanced form) appear from the edge of the arena and bind you as if you had already been cut; each second one snaps and its wound lands, past every guard, parry, dodge, resistance and untargetable form, and he heals 5% of his health for each one. |
| Twelfth | Man and Sword as One | Second form: he becomes sword light and the world slows to half speed around him; ten cuts through you, then he appears behind you and sweeps a vast half-moon crescent that stays on the stage for a few seconds, cutting whoever stands in it. |
| Thirteenth | Heaven and Earth, One Sword | His second ultimate: every flying sword stops and breaks into light; he raises one finger and makes one ordinary stroke, and the arena comes apart along it. It cuts through every defense. It is forbidden: it costs him 15% of his health and leaves him stunned. |

**Sword Intent:** every sword he draws builds intent, a different sword far more than a repeated one (shown as swords of light over his head). With enough intent he spends it on an advanced form: a faster, guard-breaking draw, six afterimages, a storm of homing blades, three crescents, swallows from three sides, nine shadows, a wider wave, three celestial swords, a formless sword three times over, a deeper wound, seven cuts of sword light.

Every one of his swords deals **true damage**: nothing on your side softens it. The Twelfth and Thirteenth Swords make him invincible for a second as he draws them, he is invincible for the whole of the Thirteenth Sword and for as long as he is sword light in the Twelfth (he takes form, and can be struck, for its closing crescent), and nothing interrupts the Ninth to the Twelfth: no flinch, no posture break. In his second form he leaves the first eight swords behind and draws the rest in a fixed cycle: the Tenth, Eleventh, Twelfth and Thirteenth, then the Ninth (grown to 36 swords in a ring nearly the size of the arena), and round again. He does not open the form with the Thirteenth.

**The Unfinished Manual:** in his second form he cannot die until he has drawn the Thirteenth Sword. A blow that should kill him leaves him at 1 health ("NOT YET"), cracked with red light; he races through the rest of the cycle and falls the moment the Thirteenth Sword ends. Every sword he draws while bound to the manual is drawn in crimson and gold, bigger, and with far more cuts: the Ninth with 54 swords, the Tenth with 48 longer cleaves, the Eleventh with 10 lines snapping every 0.6s, the Twelfth with 16 cuts and a far wider, longer-burning half-moon, and the Thirteenth as three wide strokes crossing at you.

**How the swords look.** Every sword he draws has its name written over the arena in calligraphy (拔剑, 追风, 落雨 ... 天地一剑), with its numeral (gold when it is an advanced form; the Thirteenth in red, marked forbidden). Each one has a look of its own:

| Sword | What you see |
| --- | --- |
| I 拔剑 | A hairline flash, a razor crescent of light, and the click of the sheath after. |
| II 追风 | Wind lines behind him; ghosts of him left along the lunge, a gleam running down each blade before each cuts its own crescent and dissolves into light. |
| III 落雨 | Swords thrown up into the sky, hanging point-down over their marks and glinting, then falling with streaks of light and staying a moment where they land. |
| IV 扫月 | A pale moon rises behind him; true crescent moons fly across the stage, leaving fading echoes and stars. |
| V 归燕 | Swords with a swallow's wings and a forked tail of light, curving round to come back from behind. |
| VI 百影 | Shadow swords hang in a ring round you, each with a shade of him behind it and a dotted line to its mark, then cut through together. |
| VII 断江 | A current of sword energy flows along the line, then a ragged, towering wall of it stands up and crashes down, leaving a glowing scar. |
| VIII 贯天 | The clouds part, a pillar of light comes down onto a turning gold rune circle, and an ornate celestial sword (gold cloud-guard, jade, red tassel) descends and falls, cracking the stone and dissolving into light. |
| IX 万剑归一 | A formation circle that covers most of the arena, its swords appearing one by one round its rim, spokes to its heart; they all converge, then one thrust of sword light. |
| X 无形剑 | He slowly raises a hand and the air around him warps; a crimson-black pall falls over the arena, and cut after cut appears: first a shimmer of distortion, then a razor-white slash outlined in black whose edges spring apart. |
| XI 斩因果 | A slow red stroke; taut red lines run from the arena's edge to you, the next to break glinting; each one snaps back, a wound opens and 果 (effect) is written over it. |
| XII 人剑合一 | The world turns cold blue and slows, still air streaming past; he becomes a comet of light leaving a lattice of cuts, then lays a vast glowing half-moon across the stage. |
| XIII 天地一剑 | The world stills and dims and light rises out of it; his flying swords break into light; he raises one finger and becomes a star; a hairline runs across everything; then one blinding stroke, and the arena comes apart along it. |

**You can learn his manual** (the only boss whose techniques you can learn): fighting him teaches the swords in order, each one taking another half of the usual learning time, and each one only once you have used the sword before it 3 times. The Abilities panel shows the next sword you are working toward. The Thirteenth Sword is forbidden and can never be learned.

### Super boss: the Headless Scholar

A polluted thing from a world painted in ink: a small figure in a clean white immortal's robe, long black hair held by a silver pin and falling down his back, a pale face with its eyes closed, and a traditional umbrella with a starless black sky inside. He makes no sound. When the painting opens his head falls off and rolls away: from then on he is headless, a flat black void where his neck should be, with calligraphy drifting off it.

- **Conceptual Dislocation:** every damage instance against him deals exactly 1, whatever it was. He has about 60 health, so what matters is how many times you hit him: multi-hit builds shine.
- **Umbrella of Ten Thousand Uses:** always the same umbrella, never another weapon. Its tip is the sword flurry and the spear thrust that crush posture; snapped half-open it fans ink wind; its crook is the hook that drags you in; opened wide it is a shield that stops everything (unblockable, undodgeable, even attacks that cut through every defense).
- **Scholar's Step:** one step, and it crosses half the stage.
- **Headless Recitation:** floating chanting heads that shoot homing ink.
- **Ultimate, One Stroke to End the Chapter:** the umbrella as a brush, one stroke the size of the stage laid down as you watch; when the ink dries, it strikes.
- **Second form, World Within a Painting:** his head falls away and the arena becomes an ink painting, drained of colour and silent (no sound effects). Rain From Another World falls as ink, ink dragons rise to fight for him, and every 2 seconds a head rolls down his body, flees from you while it swells, and grows into a fighter: a Chessboard Scholar, a Lamp Bearer, a Headsman Butcher, a Coffin Bearer or a Flutist. Only the world is drained: the fighters, the Scholar and every summon keep their colours. Nothing of his (heads, the fighters they become, ink dragons) can be converted or claimed by anyone.
- **Polluted Scripture:** every 9 seconds he rewrites one rule of combat for his enemies, for 6 seconds: *No Breath Is Drawn* (energy can't be spent or regained, so no heavies, kicks, rolls or abilities; plain strikes still land, for free), *Nothing Shields the Flesh* (no defense, damage reduction or status resistance: talents, armor, buffs and flinch immunity all stop working), *No Step Is Taken* (no movement or rolling, 3 seconds only), *No Guard Stands* (no blocking, so no parrying), *None Stands Beside You* (no new summons or clones: they are erased as they appear, and the ones already out are bound in ink and can't act).
- **The Painting Remembers:** techniques you repeat against him (a learned ability, or your strikes, heavies, kicks) are recorded after five uses, and the painting casts them back at you.
- **Second ultimate, The Dragon Devours the Sun:** his second form opens with it. Every ink dragon abandons the fight and merges into one huge black dragon (thick, crested, horned and whiskered) coiling across the sky while darkness spreads behind it; he paints a single red eye on its forehead; it dives across the stage three times; then its head tears free of the coil and comes at you head-on. The close-up keeps the same coarse ink pixels, pale branched horns, mane and whiskers as the coiling dragon, with narrow red eyes. Its mouth opens into an unlit void and expands until the camera is inside. The swallowed frame is completely opaque black: no teeth, tongue, facial detail, HUD or effects show through. Nothing is spared: the bite hits everything of yours on the stage (only something in the air escapes it) and takes 20% of your maximum health on top. He cannot be touched while the dragon devours. `tests/scholar-dragon-preview.html` previews the approach and checks the pure-black frames.

### Super boss: Satoru Gojo

White hair and a black blindfold; 360 health (306 in the first form), worth 300 jade.

- **Infinity:** hits stop just short of him. It drops while he is winding up, casting or recovering, and if it blocks too much at once it burns out for 3 seconds ("INFINITY DOWN"). Hit him in those windows.
- **Teleport:** steps through space to just behind you.
- **Blue (Lapse):** a point of attraction that drags you in, then implodes.
- **Red (Reversal):** a crimson shot that blasts you across the ring.
- **Hollow Purple:** blue and red collide in his hands (watch the purple line), then a mass of imaginary energy erases everything in its path, projectiles included. Unblockable.
- **Reverse Cursed Technique:** heals himself and restores a burnt-out Infinity.
- **Ultimate, Domain Expansion: Unlimited Void:** the stage becomes a void; everyone inside is frozen by infinite information while he blinks in and out landing a flurry of sure-hit punches. The King in Yellow, the Time Administrator and ??? can't be frozen by it.
- **Second form, The Strongest:** the blindfold comes off (Six Eyes). Maximum Output Blue and Red (bigger, stronger), Hollow Purple with a much shorter charge; inside his domain every punch is a Black Flash (harder hits, black-and-red sparks), and it ends with a Hollow Purple.
- **The Honored One:** the first time he dies, he comes back at 60% health to a quiet piano line, invincible for 3 seconds (he flickers white), with +30% damage, +20% speed, stronger healing, a sturdier Infinity, and a new ultimate, **Hollow Purple 200%**.

Minions a boss summons fight bare-handed: no abilities and no passives. Exceptions are Nosferatu's illusion clone and the Yellow Court's signature puppet latch.

The Druid also summons a tiger, bear or bunny. Summoners pay energy to summon, and can spend 40 energy to bring a fallen minion back at 30 HP.

Enemies chain quick follow-up hits (by role), so a parried first hit is often followed by one you can only block.

## Identity: Awakening and Ultimate Special

Your fighter grows its own identity from how it actually fights; you can't pick it, only shape it through the opponents and rewards you choose.

- **Traits** drift slowly over training lives: aggression, defense, mobility, precision, endurance, versatility (Identity panel).
- **Awakening** (after 2,000 training lives) comes from its strongest trait and only changes if another trait clearly overtakes it. A gauge under the health bar fills as it deals and takes damage; when full it awakens for 8 seconds:

| Trait | Awakening | Effect | Special finisher |
| --- | --- | --- | --- |
| Aggression | Crimson Surge | +35% damage, 10% lifesteal, faster | crimson blast |
| Defense | Still Water | double parry window, blocking barely strains posture, parries ready a double-damage riposte | healing tide |
| Mobility | Gale Step | +45% speed, untouchable while rolling, fast rolls | four-hit blitz |
| Precision | Hawk Eye | +60% posture damage, stronger strikes and heavies | piercing shot |
| Endurance | Unbroken | 45% less damage, can't be interrupted | iron shockwave |
| Versatility | Myriad Forms | ability cooldowns -70%, abilities cost nothing | every equipped ability at once |

- **Ultimate Special** is forged once it's awakened. Its first two abilities are the two the fighter has **equipped** (set the abilities to manual to choose them; the special changes the moment you change them); with fewer than two equipped, it falls back on its two most-used learned abilities (3+ uses each). It chains supercharged casts of those two, then its awakening's finisher, and is named after them (e.g. "Crimson Fan Rush"). A gold gauge fills as it deals damage (faster while awakened) and it fires on its own when an enemy is close.
- **Awakenings escalate within a fight:** each one is stronger and larger than the last (I, II, III): effects +30% per awakening, the fighter grows to 1.2x, 1.4x, then 1.6x, and its moves reach 17%, 33%, then 50% further with bigger hit effects.
- **The Ultimate Special can only fire while awakened**; its gauge keeps what it has filled in between. It also grows with the awakening tier.
- **Its limits:** bosses take 40% less from the special and anything it leaves behind; casts that split into many pieces (lines of spikes, scattered sigils, volleys) share its boost between the pieces; it calls its beasts on every cycle (they last their full time), but the fighter never keeps more than four summons at once. Its gauge also fills more slowly than before. None of the learned abilities themselves were changed.
- **The special evolves in four stages** (Identity panel shows the next stage's requirements):
  1. **Manifestation:** two favourite abilities played to its awakening's rhythm: a flurry (aggression), a stance that soaks blows then answers with them (defense), blinking round the target (mobility), a charge then one perfect cut (precision), slow casts and shockwaves (endurance), every form in turn (versatility).
  2. **Specialization** (defeat a world boss and land this special 10 times after Manifestation): its second-strongest trait and equipped talents add modifiers, e.g. blinking before every cast, 40% harder casts, lifesteal, fire breath, golden lightning, sword qi, untouchable while casting.
  3. **Synthesis** (conquer a world and reach 5,000 training lives; choose any other learned ability as the third at the Fireplace; left on Automatic, it takes the most-used learned ability (3+ uses) from a role neither of the first two shares, and Synthesis waits until one exists): the three traditions fuse: it fires from every blink, seals open where it lands, fire drags into gravity wells, and the third tradition answers every cast. The name takes the third technique (e.g. "Crimson Fan-Tackle Rush").
  4. **Transcendence** (after Synthesis, reach 10,000 training lives, maintain the same awakening for 200 consecutive training lives, land 30 synthesized specials and win three completed fights after dropping below 5% health): its own domain washes the arena in its colour, ten fused casts storm out, then a finale borrowed from a boss: each boss's first defeat in the worlds unlocks its finale, and you pick which one in the Identity panel (golden lightning, a ring of swords, Hollow Purple, a time freeze, two rings of the Warlord's spinning axes, the Scholar's great brush stroke...). Every boss has one; with none unlocked yet, it is one enormous blast. It earns a title, e.g. "the Crimson Warlord".
  Each awakening keeps its own stage and progress; its counters begin after the preceding stage is reached, except training lives, which are the fighter's total and count for every stage at once. Previously earned stages are retained when awakenings change. Every cast, projectile, hazard and boss finale in the special wears its awakening's colour (crimson, pale blue, pale green, gold, steel or violet).
- Both trigger automatically, so the neural network and saved brains are unchanged.
- **Kills** (the 斩 button) lists everything the fighter, its summons and allies have felled, by kind, across training and the fights you watch, play or battle: bosses first (the one whose finale the special ends with is marked), then foes, then summoned creatures. The record is kept in saves and exported files, and Forget everything keeps it.
- **Forget everything** wipes the identity too (traits, awakening and special), so a reset fighter earns them again from scratch. Talents, jade and skins are kept.
- **Saving a fighter** (in the vault, or exported to a file) keeps the whole fighter: its brain, learned abilities and their stats, loadout and ability mode, identity and special, talents, jade, skins and life count. Loading or importing it brings all of that back. Files exported before this change hold only the brain, and still import as before.

## Jade and talents

Defeating foes earns jade ◆ (bigger foes give more, a boss gives 120; summoned minions give none). Kills in the worlds pay in full, on top of their first-clear and boss rewards; kills while training pay a tenth; battles, sparring, trials, watching and playing pay nothing. Spend 100 jade on a spin (or 900 for ten) to draw a talent: Tick **skip animation** next to the spin buttons to see results at once (or click the spinning card to skip that one).

| Tier | Odds | Examples |
| --- | --- | --- |
| White | 40% | Iron Skin, Quick Feet |
| Green | 28% | Thick Hide, Swift Roll |
| Blue | 18% | Vampiric Fist, Parry Master |
| Purple | 9% | Phoenix Feather, Riposte, Thorns |
| Red | 4% | Dragon's Breath, Thunder Palm, Shadow Step |
| Black | 1% | Heavenly Dao, Sword Heart, Asura's Arms, Void Walker |

A purple or better is guaranteed within 30 spins, and duplicates are refunded as jade. You have **10 talent slots**: most talents take 1, purple and red ones 2, black ones (and a few others) 3, shown as ■ in the list. They apply to every fight, including training.

Story-inspired talents for builds of their own:

| Talent | Tier · slots | Effect |
| --- | --- | --- |
| Ripple Breathing (JoJo) | Green · 1 | Heal while guarding; +25% damage to the undead |
| Glass Cannon | Green · 1 | +50% damage, 35% less max health |
| Flash Step (Bleach) | Blue · 1 | Rolls go twice as far; near a foe, a roll ends behind it |
| Spider-Sense | Blue · 1 | Unblockable attacks hurt 40% less |
| Healing Factor | Blue · 2 | Regenerate 1.5 health a second |
| Observation Haki (One Piece) | Purple · 2 | 20% of blows aimed at you miss |
| Armament Haki (One Piece) | Purple · 2 | Ignore half of shells, stone, armor and arrays; crush guards harder |
| Juggernaut | Purple · 2 | Nothing knocks you back or off the stage; 10% slower |
| Gear Second (One Piece) | Purple · 2 | +25% speed, 25% faster strikes, slower energy |
| Kaioken (Dragon Ball) | Red · 2 | +40% damage, +25% speed above 30% health, burning 1.5% health a second |
| Copy Wheel Eye (Naruto) | Red · 2 | Parry window doubled; parried foes are slowed |
| Serious Punch (One Punch Man) | Red · 2 | Every 5th heavy that lands deals 5x damage |
| Four Elements (Avatar) | Red · 2 | Strikes cycle fire, water, earth and air |
| Shadow Clone (Naruto) | Red · 3 | Every roll leaves a clone (in your skin) that fights for 4s |
| Thousand Skins | Black · 3 | A beast for 9s of every 11s, each new skin healing 10%. Any skin gives +20% damage, -20% damage taken and 6% lifesteal; then Thunder Tiger (strikes land twice), Ironhide Bear (armor, regeneration; chosen when you are badly hurt), Venom Serpent (poison, wider parries), Storm Roc (untouchable rolls) or Ember Drake (fire). Never the same skin twice in a row, and speed stays near normal |
| Stand Rush (JoJo) | Black · 3 | Every 4th strike that lands brings a phantom barrage |
| Berserker Armor (Berserk) | Black · 3 | Once per fight, survive a killing blow: unkillable for 4s, +60% damage |
| The World (JoJo) | Black · 3 | Below 35% health, time stops for everyone else for 5s (again every 35s): it restores 20% health and all your energy, and your blows in stopped time hit 60% harder |

These also shape the Ultimate Special from its second stage (Specialization): it can be cast in a beast's skin, under Kaioken, with phantom barrages, opening with stopped time, with shadow clones joining in, with an element after every cast, ending in a serious punch, as true damage (Armament), copying the target's own techniques (Copy Wheel Eye), or feeding on what it deals (Berserker Armor). Its Transcendence finale now draws on the newer bosses too: a thousand cuts, monkeys and a pillar, the sword of extermination, or the swarm.

## Skins

Open **Skins** in the dock to spend jade on new looks for your fighter: Shadow Ninja, Jade Monk, Crimson Warlord, Frost Sage, Sakura Blade, Thunder God, Void Walker, Golden Emperor, Phoenix Ascendant and Celestial (300 to 3000 jade). Each recolours the fighter and adds an effect of its own (smoke, motes, embers, snow, petals, lightning, afterimages, a halo, wings of fire, stars). Skins are looks only and are saved with your progress.

## Learned abilities

After the hero has fought a foe for long enough (45 seconds across all lives by default), it learns that foe's ability. There are 65 in all (plus the twelve swords of the Sword Immortal's manual), and learned techniques hit 1.5x harder than the foe's version. Two can be equipped; each costs energy and has a cooldown, and the network has two extra actions to use them.

- **Me:** pick both slots yourself.
- **Auto:** every 3 lives (or when something new is learned) the hero scores each learned ability by how its lives went compared with the recent average, keeps the best, and tries ones it has not used yet.

In Play mode, Q and E fire the two slots.

## Animation

Every foe has a stride, a wind-up and a swing. The newer ones are hand-drawn (the Oni's kanabo, the Boxer's jab, the Reaper's scythe, the Crab's claw, the Archer's bow and knife) or alive in other ways (hydra heads, spider legs, kitsune tails, mutations, stone plates); the rest lean back into their wind-ups, lean into their blows and stride as they walk.

## Effects and sound

Every ability has its own wind-up, release and impact effects, and sounds synthesized in the browser (no audio files). Sound plays only while you watch at 4x or slower; toggle it with the Sound button.

Ambient music (a drone, pad chords, wind and a melody on each place's own instrument; the jar's is a guzheng in D pentatonic) is also generated live; toggle it with the Music button. Audio starts after your first click, as browsers require.

## Files

- `js/sfx.js`: synthesized sound effects
- `js/agent.js`: neural network with backprop and Adam, the PPO agent, and the trainer loop
- `js/sim.js`: duel mechanics, foes and their AI, trials, senses, reward weights
- `js/campaign.js`: the jar's worlds, their foes and bosses, room plans and the spawner
- `js/lobby.js`: the lobby, the inside of the jar, and its stations
- `js/lore.js`: the story: memory fragments, world vignettes and the Codex's lines
- `js/render.js`: pixel sprites, stage, effects and HUD
- `js/online.js`: usernames, parties and online matches through Supabase (set up by `supabase/online.sql`)
- `js/swordfx.js`: how the Sword Immortal and the Thirteen Swords of Heaven's End look (loaded after render.js)
- `js/main.js`: UI, speeds, chart, settings, trials, battles, save/load
- `serve.py`: local server that never caches, so changes show up on reload

Progress autosaves to the browser's localStorage. Brains are stored compactly: the fighter's own exactly, in packed binary; the earlier selves kept for the Bottom of the Jar (and online fighter cards) as fighting-only 16-bit copies, about a sixth of the old size. Earlier selves are saved after the first, third and fifth distinct world conquests in each cycle. Older life-based snapshots are retired unless a finale run is already in progress. A fighter that conquered worlds before this gets one snapshot of itself as it is now, for the highest milestone it has passed; the lower ones stay empty. The fighter is also saved immediately after the final victory. In the first game the Bottom of the Jar runs earlier selves, the keeper, then Yun Xi. In New Game+ that saved victor opens the run, the cycle's earlier selves follow, then the keeper, and the cycle's latest self (the fifth world's, when kept) waits at the end as the one in the black coat; with no earlier selves this cycle, the victor fights last instead. A new cycle discards the previous cycle's earlier selves.


Station progression and observation regressions: `node tests/progression.cjs`.
