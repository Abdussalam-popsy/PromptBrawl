# PromptBrawl — Product Requirements Document

### Hackathon Edition | Solo Build | 48hrs | Encode AI London 2026

---

## The Soul of This Product

> "Describe anyone. Watch them fight."

This is Mini Militia meets Killer Bean meets Street Fighter — with AI as the character creator.  
The nostalgia is the hook. The AI is the twist. The multiplayer is the reason to stay.

You are not building a fighting game engine.  
You are building a **character imagination machine that happens to be a game.**

---

## 1. What Is PromptBrawl?

A browser-based **2D side-view fighting game** where you describe any character in plain English and AI instantly generates them as a unique playable fighter — applying a personality, color palette, stats, and move loadout to a pre-built character template — then drops them into a dramatic arena to fight a friend or an AI opponent.

**The magic moment:**  
Player 1 types: _"Spongebob but he's absolutely done with everything"_  
Player 2 types: _"Scorpion from Mortal Kombat but tiny and angry"_  
They fight. It's chaos. It's perfect.

---

## 2. Design Principles

### ✅ This IS:

- A 2D side-view fighter (Street Fighter / Mortal Kombat energy, Killer Bean soul)
- An AI character skin + stats + loadout generator
- A vs AI mode (solo, instant) AND local WiFi 2-player mode
- Fast to demo — first fight within 30 seconds of opening the URL
- Stylised, punchy, slightly unhinged

### ❌ This is NOT:

- A 3D game (scope killer)
- A physics simulation
- An online matchmaking system
- A story mode
- Generating custom character art or 3D models from scratch

---

## 3. Core User Flow (Judge Demo Path)

```
Open URL
  ↓
Choose mode: [vs AI] or [vs Player]
  ↓
"Describe your fighter..." input appears
  ↓
Type anything — vague or specific
  ↓
AI generates fighter config in ~3 seconds
  ↓
Template character spawns with AI colors, name, stats, moves
  ↓
vs AI:     opponent auto-generated + controlled by bot
vs Player: second player describes theirs, joins via room code
  ↓
FIGHT
  ↓
Winner gets generated victory line
  ↓
"Play again" — describe someone new
```

**Target time from URL open to first fight: under 30 seconds.**

---

## 4. The Character Template System

This is the architecture decision that makes the game look good AND ship on time.

### The Core Idea

Every character uses the **same base rig** — same skeleton, same proportions, same animation set.  
The AI doesn't generate a new character from scratch. It **configures the template** — selecting from predefined options and applying visual styling.

This means:

- The base character always looks great (you control quality)
- AI expression comes through color, moves, and stats — not generated art
- Animations are always smooth because they're pre-built
- This is exactly how real fighting games work

### Base Template Specs

```
- Single humanoid rig (spritesheet-based, drawn well)
- Animations: idle, walk, jump, crouch, light_attack, heavy_attack,
              special, hurt, block, death, victory
- Neutral default colors — AI palette gets applied as color tint on top
- Size variants: light (small/fast), medium (balanced), heavy (large/slow)
  → AI selects size variant based on description
```

### What AI Configures (The Expression Layer)

```
- Size variant:      light / medium / heavy
- Color palette:     primary + secondary + accent (tinted onto rig)
- Move loadout:      selected from predefined library
- Stats:             speed, damage, defense, chaos (always sum to 24)
- Name, personality, victory line
- Projectile sprite: coins, fire, ice, bubbles, bones, stars, etc.
```

### What Never Changes

- The rig and animation quality
- The hit detection logic
- The arena

---

## 5. AI Generation System

### Input Handling

**Vague prompt:** _"a warrior"_
→ Claude invents something rich:

> Fierce, honourable, uses a broadsword, slow but devastating, war cry stuns enemies

**Specific prompt:** _"Mr Krabs weaponising his greed"_
→ Claude gets literal and funny:

> Shoots coins as projectiles, rains gold as special, gets faster when enemy is low,
> victory line: "That'll be £50 for the beating"

System prompt tells Claude: _"If vague, invent something rich and unexpected. If specific, be faithful and funny."_

### Claude API Output (Strict JSON Schema)

```json
{
  "name": "Admiral Pinch",
  "personality": "Greedy, aggressive, talks about money constantly",
  "victory_line": "That'll be £50 for the beating.",
  "size_variant": "heavy",
  "stats": {
    "speed": 3,
    "damage": 9,
    "defense": 6,
    "chaos": 6
  },
  "color_palette": {
    "primary": "#cc2200",
    "secondary": "#ffcc00",
    "accent": "#ffffff"
  },
  "move_loadout": {
    "light_attack": "claw_swipe",
    "heavy_attack": "body_slam",
    "special": "coin_rain",
    "projectile_sprite": "coins"
  }
}
```

**Stats always sum to 24. This keeps balance.**

### Predefined Move Library (Claude selects from these only)

**Light attacks:** punch, kick, claw_swipe, tail_whip, headbutt  
**Heavy attacks:** body_slam, ground_pound, spinning_strike, lunge  
**Specials:** coin_rain, fire_burst, ice_spike, bubble_shield, dash_strike, heal_pulse, shockwave, teleport_strike  
**Projectile sprites:** coins, fire, ice, bubbles, bones, stars, rocks, lightning

### Claude System Prompt

```
You are a fighting game designer. Convert character descriptions into fighters
using the predefined template system. Output ONLY valid JSON matching the schema exactly.
Stats must sum to exactly 24. Size variant must be: light, medium, or heavy.
All move selections must come from the provided library.
If the prompt is vague, invent a rich personality and fitting moves.
If specific, be faithful and funny.
Victory lines should match the character's vibe — be creative and entertaining.
```

---

## 6. Visual Quality (This Is How You Win on Creative AI)

The quality doesn't come from generated art. It comes from everything around the characters.

### The Base Character Must Look Great

- Clean, expressive sprite with a clear silhouette
- Smooth animation — especially idle (breathing), hurt reaction, and death
- AI palette applied as intentional color tint — not random
- Size variants have distinct body language:
  - Heavy = slow, wide, imposing stance
  - Light = twitchy, upright, alert
  - Medium = balanced, natural

### The Arena Is a Star

- **One arena. Make it beautiful. Never touch it again.**
- Dramatic setting: neon city rooftop at night, ancient colosseum, rain-soaked alley — pick one and commit
- Parallax background (2–3 depth layers) — makes it feel alive and cinematic
- Ground has texture and perspective
- Atmospheric: fog, rain particles, or ambient light shifts

### The Juice (What Makes It Feel Like a Real Game)

- **Screen shake** on heavy hits (GSAP — you know this)
- **Hit freeze** — 3–4 frame pause on impact
- **Impact particles** — small burst on hit, color matches attacker palette
- **Health bar animation** — smooth drain, flashes red when critical
- **Character flash** white on hit
- **Victory screen** — dramatic pose, generated victory line, particle celebration
- **Special move effects** — each special looks and feels different

### UI + Typography

- Bold, clean display font with personality (not default sans-serif)
- Health bars thick, readable, with fighter name above
- Character names displayed in their primary color
- The prompt input screen must feel like a game loading screen — not a website form

### Visual Reference Mood

- Killer Bean: clean geometry, punchy, satisfying
- Street Fighter 3: fluid movement, expressive characters
- Skullgirls: excellent 2D animation quality

**Standard: it should look like a real indie game, not a hackathon project.**  
**This is your design edge over every other team. Use it.**

---

## 7. Gameplay System

### View

**2D side-view** — Street Fighter framing  
Fixed camera. Both characters always visible.

### Controls

```
Player 1:  A/D → move | W → jump | J → light attack | K → heavy | L → special

Player 2 (same device): Arrow keys → move | 1 → light | 2 → heavy | 3 → special

WiFi multiplayer: each player on their own device, own keyboard
```

### Combat Model (Keep It Simple)

```
- Distance check → melee range → deal damage
- Projectiles: spawned object travels across screen, deals damage on contact
- Damage = (attacker.damage × move_multiplier) - defender.defense (min 1)
- Light attack: fast, 1.0× multiplier
- Heavy attack: slow startup, 1.8× multiplier
- Special: cooldown 5s, effect from move_loadout
- Chaos stat: % chance to trigger a random bonus effect on any hit
- Health: 100HP each
- Round ends at 0HP
```

### Stats Wired Directly to Gameplay

- **Speed** → pixels per frame of movement
- **Damage** → base damage per hit
- **Defense** → flat damage reduction
- **Chaos** → % chance of surprise effect (critical hit, projectile bounce, stun)

**Judges will see the AI output directly affecting the fight. That's your story.**

### AI Opponent Behaviour (vs AI mode)

```
Simple state machine:
- Approach if too far
- Attack when in range
- Retreat after taking damage
- Use special when cooldown ready
- Chaos stat increases unpredictability
```

Not trying to be smart. Trying to be fun to fight.

---

## 8. Game Modes

### Mode 1: vs AI (Build This First)

- Player describes their fighter
- Claude auto-generates a contrasting opponent
- AI controls opponent via state machine
- Instant, no waiting, works solo
- **This is your safe demo. Always works.**

### Mode 2: vs Player — Local WiFi (Build Second)

- Host opens game → gets 4-letter room code
- Second player enters code on their device (same WiFi)
- Both describe fighters → load in → fight
- Synced over WebSocket

### Fallback Safety Net

- Same-device split keyboard always works as a backup
- Build this before WiFi multiplayer

---

## 9. Technology Stack

### Frontend

- **Vite + React** — fast setup, you know it
- **PixiJS** — 2D rendering, spritesheet animation, great performance in browser
- **GSAP** — screen shake, UI transitions, hit effects

### AI

- **Claude API** (`claude-sonnet-4-6`) — you have credits
- Single endpoint: `POST /generate-fighter` → returns validated JSON

### Backend (Minimal)

- **Node.js + Express** — one file
- Endpoints: `/generate-fighter` + WebSocket for multiplayer
- Deploy: **Railway** (free tier, instant setup)

### Frontend Deploy

- **Vercel** — you have credits, one command

---

## 10. Folder Structure

```
/promptbrawl
  /client
    /src
      /game
        Arena.ts              ← arena + parallax background
        Fighter.ts            ← character class, takes JSON, applies to template
        CombatSystem.ts       ← hit detection, damage, cooldowns, projectiles
        Controls.ts           ← keyboard input handler
        AIOpponent.ts         ← state machine for vs AI mode
      /assets
        /sprites
          fighter_light.png   ← spritesheet, all animations
          fighter_medium.png
          fighter_heavy.png
          projectiles.png     ← coins, fire, bubbles, bones, etc.
        /arena
          background.png      ← far layer
          midground.png       ← mid layer
          foreground.png      ← near layer
      /ai
        generateFighter.ts    ← calls Claude API, validates JSON
        moveLibrary.ts        ← all predefined move definitions
      /ui
        ModeSelect.tsx        ← vs AI or vs Player
        PromptInput.tsx       ← character description input
        HUD.tsx               ← health bars, names, special cooldown
        VictoryScreen.tsx     ← winner display + victory line + play again
      /network
        multiplayer.ts        ← WebSocket client
    main.ts
  /server
    index.js                  ← Express + WebSocket + Claude proxy
  package.json
  vercel.json
```

---

## 11. Build Timeline (48 Hours)

### Hour 0–3: Foundation

- Vite + PixiJS setup
- Arena renders with parallax layers
- Two colored rectangles move with keyboard controls

### Hour 3–8: Combat Core

- Basic attack with distance check works
- Health bars drain correctly
- Round ends on KO
- Same-device two-player functional
- ✅ **Demo checkpoint: two shapes fighting**

### Hour 8–13: Character Template

- Spritesheet animations playing (idle, walk, attack, hurt, death)
- Color tinting applied from config
- Size variants working correctly

### Hour 13–19: AI Integration

- Server running, Claude endpoint returning valid JSON
- Prompt input screen built and wired up
- Fighter JSON configures the template correctly
- ✅ **Demo checkpoint: type a prompt, watch it affect the fight**

### Hour 19–26: Polish + Juice

- Screen shake, hit flash, impact particles (GSAP)
- Victory screen with generated line
- AI opponent state machine working
- Arena looks beautiful — atmosphere added

### Hour 26–34: WiFi Multiplayer

- WebSocket server on Railway
- Room code flow working
- Two devices fighting on same WiFi

### Hour 34–42: Demo Prep + Deploy

- Deployed on Vercel + Railway
- Test 10+ character combinations
- Record backup demo video (essential safety net)

### Hour 42–48: Buffer

- Bug fixes only
- No new features
- Pitch prep + sleep

---

## 12. The Demo Script

**Say:**

> "Every fighting game lets you pick a character. PromptBrawl lets you _imagine_ one.  
> The AI doesn't generate art — it generates a fighter. Watch."

Type: _"Mr Krabs but he weaponised his greed"_

Let them read the name. The personality. The victory line.  
Then fight.

**The laugh is your standing ovation.**

---

## 13. Track + Sponsor Alignment

| Track / Sponsor | How It Fits                                                                | Work Required    |
| --------------- | -------------------------------------------------------------------------- | ---------------- |
| **Creative AI** | AI generation IS the experience — no prompt, no game                       | Core product     |
| **Vibe Coding** | Built with Claude Code, all commits this weekend, documented               | Log your process |
| **Civic**       | Guardrails on `/generate-fighter` — block prompt injection, harmful inputs | 2–3 hours        |
| **Luffa**       | Bot: send description in chat, get fighter card back                       | Stretch only     |

---

## 14. What You Are NOT Allowed to Do

- **No 3D.** You lose 20 hours instantly.
- **No generating custom character art.** Template + color tint only.
- **No complex physics engine.** Distance checks only.
- **No more than one arena.** Make it beautiful, leave it alone.
- **No online matchmaking.** Local WiFi only.
- **No feature creep after Hour 34.** Polish what exists.

---

## 15. The 2am Sanity Check

**"Can I demo what I have right now?"**

- **Yes** → keep going, you're fine
- **No** → go back one step until the answer is yes

Never build forward on a broken foundation.

---

## 16. Why This Doesn't Look Watered Down

The template approach raises the floor, not lowers it.

Instead of 10 inconsistent generated characters, you get:

- 1 beautiful base rig with smooth, expressive animations
- Infinite character expression through color, loadout, and stats
- A stunning arena with atmosphere and depth
- Juice that makes every hit feel satisfying

**Your design eye goes into the base template, the arena, and the juice.**  
**That's what makes it look like a real game — not generated art you can't control.**

---

## 17. Why This Wins

You're not submitting a fighting game.  
You're submitting **a playable imagination engine.**

The judges will describe a character, watch it come to life, and feel something.  
That feeling is the product.

> _"Language becomes a fighter. Imagination becomes gameplay."_

---

## 18. Stretch Features (Only If All Core Is Done)

- AI trash talk mid-fight (Claude generates taunts based on fight state)
- ElevenLabs voice announcer calling the fight (you have credits)
- Shareable fighter card (screenshot + generated stats card)
- Tournament bracket (4 players, 2 simultaneous fights)

---

_Built at Encode AI London Hackathon 2026_  
_Solo builder. 48 hours. Ship something that matters._
