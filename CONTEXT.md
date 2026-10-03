# Pilgrimage RPG

This context defines the language for an original browser RPG inspired by the design pillars of Final Fantasy 10: authored pilgrimage, tactical turn-order combat, and board-based character growth.

## Language

**Pilgrimage**:
The player's linear journey through authored locations, encounters, and story beats. It is the game's world structure, not an open-world map.
_Avoid_: Campaign, overworld, route

**Pilgrimage Scene**:
A fixed-camera 3D explorable location on the pilgrimage. A scene contains walkable paths, characters, encounter triggers, and exits.
_Avoid_: Level, map, zone

**Turn Timeline**:
The visible ordering of upcoming combat turns. It lets the player reason about speed, delays, swaps, and enemy actions before committing.
_Avoid_: Initiative queue, ATB bar

**Role Counter**:
A party member's tactical answer to a specific enemy class or combat problem. Role counters make party identity matter in battle.
_Avoid_: Class, job, archetype

**Party Swap**:
A battle action that exchanges the active combatant for a reserve party member. It exists so the player can bring the right role counter into the current turn.
_Avoid_: Character switch, bench swap

**Weakness Chain**:
A combat situation where the player can gain advantage by matching attacks, elements, or role counters to enemy vulnerabilities.
_Avoid_: Combo, exploit, vulnerability loop

**Progression Board**:
The character growth system where earned resources unlock adjacent nodes that shape stats, skills, and role drift.
_Avoid_: Sphere Grid, skill tree, leveling screen

**Board Node**:
A single unlockable space on the progression board. A board node grants a concrete character improvement.
_Avoid_: Skill point, upgrade, perk

**Covenant Spirit**:
A summonable story-linked ally that can temporarily reshape combat. Covenant spirits are a later pillar, not part of the first playable slice.
_Avoid_: Aeon, summon, eidolon

**Overdrive**:
A high-impact character action charged through combat momentum. Overdrive is a later pillar once the base turn timeline and role counters are proven.
_Avoid_: Limit break, ultimate
