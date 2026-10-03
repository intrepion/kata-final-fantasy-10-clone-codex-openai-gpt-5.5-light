# Pilgrimage RPG

This context defines the language for an original browser RPG inspired by the design pillars of Final Fantasy 10: authored pilgrimage, tactical turn-order combat, and board-based character growth.

## Language

**Tidewake**:
The first pilgrimage scene: a coastal village and beach path where the first playable slice begins. It establishes home, shoreline danger, and the path toward the wider pilgrimage.
_Avoid_: Besaid, starter town, beach level

**Pilgrimage**:
The player's linear journey through authored locations, encounters, and story beats. It is the game's world structure, not an open-world map.
_Avoid_: Campaign, overworld, route

**Pilgrimage Scene**:
A fixed-camera 3D explorable location on the pilgrimage. A scene contains walkable paths, characters, encounter triggers, and exits.
_Avoid_: Level, map, zone

**Battle Arena**:
A staged combat space entered from a pilgrimage scene when an encounter begins. It presents party members, enemies, and the turn timeline without sharing exploration movement rules.
_Avoid_: Combat map, fight screen, battle scene

**Path Encounter**:
A visible enemy presence on a pilgrimage scene path that can trigger combat. Path encounters make the first slice verifiable without relying on hidden random battle timing.
_Avoid_: Random battle, roaming mob, trash encounter

**Boss Encounter**:
A scripted high-stakes battle that tests the slice's core tactics. The first boss encounter must require party swaps and weakness chains rather than raw repeated attacks.
_Avoid_: Boss fight, set-piece fight

**Turn Timeline**:
The visible ordering of upcoming combat turns. It lets the player reason about speed, delays, swaps, and enemy actions before committing.
_Avoid_: Initiative queue, ATB bar

**Role Counter**:
A party member's tactical answer to a specific enemy class or combat problem. Role counters make party identity matter in battle.
_Avoid_: Class, job, archetype

**Party Swap**:
A battle action that exchanges the active combatant for a reserve party member. It exists so the player can bring the right role counter into the current turn.
_Avoid_: Character switch, bench swap

**Fast Striker**:
The starting party role counter for quick enemies and turn-order pressure. The fast striker acts often and can punish enemies before they execute slower plans.
_Avoid_: Thief, rogue, speedster

**Armored Breaker**:
The starting party role counter for protected or shell-heavy enemies. The armored breaker opens enemies that other party members cannot efficiently damage.
_Avoid_: Tank, warrior, armor killer

**Elemental Caster**:
The starting party role counter for enemies with elemental weaknesses. The elemental caster makes reading enemy traits more valuable than repeating the strongest attack.
_Avoid_: Black mage, wizard, magic user

**Weakness Chain**:
A combat situation where the player can gain advantage by matching attacks, elements, or role counters to enemy vulnerabilities.
_Avoid_: Combo, exploit, vulnerability loop

**Echo Shard**:
The progression currency earned from combat and spent on board nodes. Echo shards tie character growth to proven encounter play.
_Avoid_: Experience point, sphere, skill point

**Progression Board**:
The character growth system where earned resources unlock adjacent nodes that shape stats, skills, and role drift.
_Avoid_: Sphere Grid, skill tree, leveling screen

**Board Node**:
A single unlockable space on the progression board. A board node grants a concrete character improvement.
_Avoid_: Skill point, upgrade, perk

**Rite-Singer**:
A pilgrimage figure who performs rituals meant to quiet the sea-born catastrophe. The rite-singer gives the journey a story purpose without using the reference game's summoner identity.
_Avoid_: Summoner, priest, bard

**Guardian**:
A companion sworn to protect the rite-singer through the pilgrimage. Guardians are defined by duty to the pilgrimage, not by a generic party-member slot.
_Avoid_: Escort, bodyguard, party member

**Sea-Born Catastrophe**:
The recurring oceanic threat that motivates the pilgrimage. It is a world condition and story pressure, not just the first boss.
_Avoid_: Sin, calamity, sea monster

**Save Snapshot**:
The persistent slice state restored after reload. For the first slice, it includes scene position, defeated encounters, boss state, party health, echo shards, and unlocked board nodes.
_Avoid_: Save file, checkpoint, profile

**Covenant Spirit**:
A summonable story-linked ally that can temporarily reshape combat. Covenant spirits are a later pillar, not part of the first playable slice.
_Avoid_: Aeon, summon, eidolon

**Overdrive**:
A high-impact character action charged through combat momentum. Overdrive is a later pillar once the base turn timeline and role counters are proven.
_Avoid_: Limit break, ultimate
