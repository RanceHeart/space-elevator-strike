# CODEX_V1 — SPACE ELEVATOR STRIKE

## 1. Game Identity

**一句话：** 像素风纵版射击游戏，玩家操控战机沿太空电梯从地球表面打到太空，击落敌方无人机和太空残骸。

**核心三体验：**
1. "再往上一点就能到太空了" — 明确的上升目标感，阶段递进
2. "这发锁定导弹打出去好爽" — 锁定→发射→爆炸的节奏感
3. "差一点就躲开了！" — 弹幕擦边的紧张感

## 2. Visual References

**必须参考的现成作品（已帮你选好，不用自己造）：**

- **游戏视觉风格** → Reddit: "Ace Combat 7 in 1995 shmup pixel art style" (r/acecombat, post z3lj2a)
- **像素 shmup 设计教程** → SLYNYRD Pixelblog #31-#32 (slynyrd.com)
- **场景氛围** → 流浪地球 2 太空电梯概念图 (ArtStation: "Wandering Earth 2 - Space Elevator")
- **调色盘** → DawnBringer DB16（16色万能像素盘，见下方精确 hex）
- **纵版参考游戲** → 1945 系列 / Aero Fighters / Mushihimesama（敌人出现节奏、弹幕密度）

## 3. Palette — DawnBringer 16

```
   void    '#140C1C'  // 深空紫黑 - space background, shadows
   darkred '#442434'  // 深红棕 - rust, industrial structure dark
   navy    '#30346D'  // 深蓝 - night sky, shadow
   gray    '#4E4A4F'  // 中灰 - metal, concrete
   brown   '#854C30'  // 铁锈棕 - elevator truss
   green   '#346524'  // 军绿 - ground vegetation (low altitude)
   red     '#D04648'  // 红 - danger, enemy, warning
   warm    '#757161'  // 暖灰 - platform surface
   blue    '#597DCE'  // 钢蓝 - player ship primary color
   orange  '#D27D2C'  // 橙 - engine flame, warning light
   cold    '#8595A1'  // 冷灰蓝 - highlight metal
   lgreen  '#6DAA2C'  // 亮绿 - screen elements
   skin    '#D2AA99'  // 粉 - explosion inner
   cyan    '#6DC2CA'  // 青 - missile trail, energy
   yellow  '#DAD45E'  // 黄 - score number, lock-on ring
   white   '#DEEED6'  // 白 - max highlight, explosion core
```

**规则：游戏中所有像素仅用以上16色，不允许任何其他颜色。**

## 4. Tech Stack

- **Engine:** Phaser 3.x (CDN: https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js)
- **Physics:** Arcade Physics
- **Rendering:** Canvas (WebGL fallback)
- **Project:** Single HTML entry + modular JS files
- **CDN only** — no npm, no build step (V1 simplicity)
- **Deploy:** GitHub Pages

## 5. Project Structure

```
space-elevator-strike/
├── index.html                 # Entry point, Phaser CDN
├── game.js                    # All game code
├── test.js                    # Self-evaluation framework
├── assets/                    # Downloaded sprites (if used)
└── CODEX_V1.md                # This file
```

**Keep game.js as one file for V1.** Codex produces fewer bugs with single-file targets.

## 6. Scene Flow

```
BootScene → MenuScene → GameScene → GameOverScene
                ↑                        │
                └────────────────────────┘ (restart)
```

**BootScene:** Generate all pixel-art textures programmatically, then switch to Menu.
**MenuScene:** Title text "SPACE ELEVATOR STRIKE", fade-in, "TAP TO START" blink.
**GameScene:** Main gameplay — scrolls upward over the space elevator.
**GameOverScene:** Score display, "TAP TO RETRY", returns to MenuScene.

## 7. Canvas & Screen

```
CANVAS_WIDTH  = 390
CANVAS_HEIGHT = 690
Scale: Phaser.Scale.FIT, centered
Orientation: portrait (mobile-first)
```

## 8. Physics & Movement Constants

```
// --- SCROLLING ---
SCROLL_SPEED_BASE = 100      // base upward scroll px/s (increases per stage)

// --- PLAYER ---
PLAYER_SPEED        = 280    // max velocity
PLAYER_ACCELERATION = 1600   // 0→max in ~0.17s — snappy
PLAYER_DRAG         = 1000   // stops fast, no ice sliding
PLAYER_MAX_Y        = 480    // can't go below this (camera follows upward)

// --- BULLETS ---
BULLET_SPEED    = -550       // upward
BULLET_INTERVAL = 150        // ms between shots (auto-fire while touching)
BULLET_LIFETIME = 2000       // ms before auto-destroy

// --- MISSILES ---
MISSILE_SPEED         = -350  // slower than bullets, tracks target
MISSILE_LOCK_TIME     = 800   // ms to lock
MISSILE_MAX_TRACK     = 300   // px turn radius
MISSILE_MAX_ACTIVE    = 3     // max missiles on screen
MISSILE_COOLDOWN      = 3000  // ms between missile salvos
MISSILE_DAMAGE        = 3     // hits to destroy heavy enemies

// --- ENEMIES ---
ENEMY_SPAWN_MARGIN    = 80    // px above top edge to spawn
ENEMY_BASE_SPEED      = 100   // base downward speed
ENEMY_ACCEL_RATE      = 1.02  // speed multiplier per stage
MAX_ENEMIES           = 8     // simultaneous

// --- JUICE ---
SCREENSHAKE_HIT       = { intensity: 4, duration: 100 }
SCREENSHAKE_EXPLODE   = { intensity: 8, duration: 200 }
SCREENSHAKE_BIG_BOOM  = { intensity: 12, duration: 350 }
SCREENSHAKE_DAMAGE    = { intensity: 6, duration: 150 }
HITSTOP_HIT           = 0     // ms — no stop for small hits
HITSTOP_EXPLODE       = 80    // ms — brief freeze on big explosion
HITSTOP_PLAYER_HURT   = 100   // ms — freeze on taking damage
PARTICLE_HIT_COUNT    = 4     // small debris particles
PARTICLE_EXPLODE_COUNT = 12   // medium explosion
PARTICLE_BIG_COUNT    = 24    // boss/large explosion
```

## 9. Player Ship

**Visual:** Top-down fighter jet, 32×32 px, 4 animation frames (thruster flicker pattern).
**Must look like a modern fighter jet, not a generic spaceship.**
- Delta wing shape
- Orange engine glow at rear
- Cockpit in navy/blue

**Controls:**
- **Touch:** Left half screen = move left, Right half = move right (no virtual buttons)
- Tap anywhere to fire bullets (auto-fire while touching)
- Hold same spot 0.8s = lock missile, release = fire
- Double-tap = emergency bomb (once per stage, clears screen)

**Hitbox:** 12×12 px center square (smaller than visual for fairness).

**Animation:** Idle breathing (subtle Y oscillation ±1px), thruster frames cycle.

## 10. Weapons

### 10a. Vulcan Cannon (Primary)
- Auto-fire while touching screen
- Small orange/yellow bullets, 4px circles
- Fire rate: ~6 shots/sec
- Damage: 1 per hit
- Visual: slight muzzle flash at gun ports

### 10b. Lock-On Missile (Secondary)
- Hold touch in same spot 0.8s → lock ring appears → expands → locks
- Up to 3 simultaneous locks on nearest enemies
- Release = fire missiles at locked targets
- Missile visual: white dot + cyan trail
- On hit: medium orange explosion + 12 particles
- Cooldown: 3s between salvos

### 10c. Emergency Bomb (Special)
- Double-tap to activate
- Range: full screen
- Effect: all enemies + bullets destroyed
- Orange-white flash + screen freeze for 200ms
- 1 charge per stage, resets at stage transition

## 11. Enemies & Waves

### Enemy Types

| Type | Size | HP | Speed | Behavior | Score |
|---|---|---|---|---|---|
| **Drone** | 16×16 | 1 | 80-120 | Drop straight down, slight wobble | 100 |
| **Fighter** | 24×24 | 2 | 60-100 | Sweep in from sides, shoot back | 250 |
| **Missile** | 8×16 | 1 | 200 | Fast straight line, no shooting | 150 |
| **Turret** | 28×20 | 3 | 0 | Fixed to elevator structure, rotates to aim | 400 |
| **Heavy** | 32×32 | 5 | 40 | Slow, heavily armored, shoots spread | 800 |

### Wave System

```
Wave {0..N}
  - Predefined sequence of enemy spawns
  - Each wave lasts ~15-20 seconds
  - Between waves: 3s breather
  - Every 5 waves: mid-boss
  - Wave difficulty ramps: more enemies, faster, denser
```

**Wave Pattern Formula:**
```
enemies_per_wave = 3 + floor(waveNumber * 1.5)
spawn_delay = max(500, 2000 - waveNumber * 100)  // ms between spawns
enemy_speed_mult = 1 + waveNumber * 0.05
```

### Enemy Spawning Rules
- Spawn at Y = -margin (above screen)
- X = random between 40 and (CANVAS_WIDTH - 40)
- Fighters can also enter from left/right edges
- Enemies shoot backward periodically (every 2-3s)

## 12. Stage Progression (5 Stages)

Each stage = visual environment change + background color shift.

| Stage | Altitude | BG Color | Features |
|---|---|---|---|
| 1: Surface | 0-2000m | #140C1C→purple dawn | Desert surface, elevator base, first drones |
| 2: Storm | 2000-8000m | #30346D dark blue | Cloud layer, lightning flashes, turbulence |
| 3: Stratos | 8000-30000m | #4E4A4F gray-blue | Thin air, star dots appear, ice on elevator |
| 4: Orbit | 30000-100km | #140C1C void black | Stars visible, debris field, zero-g feel |
| 5: Deep Space | 100km+ | #000000 + starfield | Final boss, space station, victory |

**Stage transition:** Brief fade overlay + text "STAGE X - [NAME]" (1.5s).

## 13. Scoring System

```
Drone kill:    100 × combo_mult
Fighter kill:  250 × combo_mult
Missile kill:  150 × combo_mult
Turret kill:   400 × combo_mult
Heavy kill:    800 × combo_mult
Boss kill:    5000 × combo_mult

Combo_mult = 1.0 + (consecutive_kills_within_2s * 0.1)
Max combo_mult = 5.0
Combo resets if no kill for 2s
```

## 14. Juice Feedback Layer — CRITICAL: Codex 默认会漏，必须检查

每个事件**必须有**对应的反馈：

| Event | Screen Shake | Particles | Hitstop | Visual |
|---|---|---|---|---|
| Bullet hits drone | 2px/60ms | 4 small orange dots | 0ms | Flash white then fade |
| Bullet hits fighter | 3px/80ms | 6 mixed debris | 0ms | Same |
| Missile hits heavy | 8px/200ms | 16 sparks + debris | 80ms | Large flash, ring wave |
| Player takes damage | 6px/150ms | 3 red sparks | 100ms | Ship flash red (tween tint 0xff0000 200ms) |
| Enemy fires bullet | 0 | 1 muzzle flash | 0ms | Small white dot |
| Boss explosion | 12px/350ms | 30+ particles | 150ms | Screen flash white 100ms |
| Stage clear | 0 (gentle rumble) | — | 0ms | "STAGE CLEAR" text pop |
| Combo counter | subtle bounce | — | 0ms | Combo text grows 1.2x on increment |

## 15. HUD Layout

```
┌─────────────────┐
│  SCORE: 012345  │  ← top center
│  STAGE 1        │  ← left
│  ♥♥♥♥           │  ← right (player lives)
│                 │
│                 │
│   [LOCK RING]   │  ← missile lock indicator at touch point
│                 │
│  ⚡ x1          │  ← bomb charge left-bottom
│  ████████░░     │  ← missile cooldown bar
│  0004500        │  ← altitude meter (right edge)
└─────────────────┘
```

## 16. SELF-EVALUATION FRAMEWORK — ⚠️ 必须实现

Codex 完成后必须创建 `test.js`，包含以下结构和自动评分系统。

### test.js 架构

```javascript
// SelfEval = { tests: [], results: {}, score: 0 }
// Each test: { id, category, name, weight, run: function(game) => bool }
// Categories: CRITICAL(×3), HIGH(×2), MEDIUM(×1), LOW(×0.5)

// Test list (all must pass for V1):
```

### 20 项自动检测清单

```javascript
const TESTS = [
  // ───── CRITICAL (weight 3) ─────
  { id: 'T01', cat:'CRITICAL', name:'Phaser boots without errors', weight:3,
    check: () => game !== null && !game.isPaused },
  { id: 'T02', cat:'CRITICAL', name:'Player ship visible on screen', weight:3,
    check: () => player && player.visible && player.y < CANVAS_HEIGHT },
  { id: 'T03', cat:'CRITICAL', name:'Touch left/right moves player', weight:3,
    check: () => player.body.velocity.x !== 0 || player.body.acceleration.x !== 0 },
  { id: 'T04', cat:'CRITICAL', name:'Bullets fire and move upward', weight:3,
    check: () => bulletGroup.countActive() > 0 || bulletGroup.getFirstAlive()?.body.velocity.y < 0 },
  { id: 'T05', cat:'CRITICAL', name:'Enemies spawn', weight:3,
    check: () => enemyGroup.countActive() > 0 },
  { id: 'T06', cat:'CRITICAL', name:'Bullet-enemy collision destroys enemy', weight:3,
    check: () => { /* spy on enemy kill event */ killedCount > 0 } },
  { id: 'T07', cat:'CRITICAL', name:'Player death triggers GameOver scene', weight:3,
    check: () => game.scene.isActive('GameOverScene') || playerLives > 0 },
  { id: 'T08', cat:'CRITICAL', name:'Scene flow: Boot→Menu→Game→GameOver works', weight:3,
    check: () => allScenesRegistered() },

  // ───── HIGH (weight 2) ─────
  { id: 'T09', cat:'HIGH', name:'Ship has acceleration + drag (not instant)', weight:2,
    check: () => PLAYER_ACCELERATION > 0 && PLAYER_DRAG > 0 },
  { id: 'T10', cat:'HIGH', name:'Scrolling background parallax', weight:2,
    check: () => scrollSpeed > 0 },
  { id: 'T11', cat:'HIGH', name:'Score increments on kill', weight:2,
    check: () => score > 0 },
  { id: 'T12', cat:'HIGH', name:'Menu→Game→GameOver→restart cycle', weight:2,
    check: () => canRestart },
  { id: 'T13', cat:'HIGH', name:'Lock-on missile mechanic works', weight:2,
    check: () => missileLockTime > 0 && missiles.countActive() <= MISSILE_MAX_ACTIVE },

  // ───── MEDIUM (weight 1) ─────
  { id: 'T14', cat:'MEDIUM', name:'Screen shake on hit', weight:1,
    check: () => cameraShakeEnabled },
  { id: 'T15', cat:'MEDIUM', name:'Explosion particles on enemy death', weight:1,
    check: () => particleCounter > 0 },
  { id: 'T16', cat:'MEDIUM', name:'All sprites use palette colors only', weight:1,
    check: () => paletteCompliant() },
  { id: 'T17', cat:'MEDIUM', name:'HUD shows score, lives, stage', weight:1,
    check: () => hudElements.length >= 3 },
  { id: 'T18', cat:'MEDIUM', name:'Auto-fire while touching screen', weight:1,
    check: () => isAutoFiring },

  // ───── LOW (weight 0.5) ─────
  { id: 'T19', cat:'LOW', name:'Stage visual progression changes at altitude', weight:0.5,
    check: () => currentStage >= 1 },
  { id: 'T20', cat:'LOW', name:'Combo multiplier text feedback', weight:0.5,
    check: () => combo > 0 && comboText !== null },
];
```

### 评分公式

```
MAX_SCORE = sum of weights × max_per_test
          = (8×3 + 5×2 + 5×1 + 2×0.5) × 1
          = (24 + 10 + 5 + 1) × 1
          = 40

PASS_THRESHOLD = 32  (80%)
CRITICAL_REQUIREMENT = all T01-T08 pass (failure = rebuild)
```

### 执行方式

**Codex 的运行流程：**
1. 写完 game.js
2. `node test.js` 或打开 index.html?test=true → 自动运行评测
3. 读取测试报告
4. 如果总分 < 32 或任何 CRITICAL 失败 → 自我修复 → 重新运行测试
5. 直到全部通过且总分 ≥ 32
6. 输出最终报告到终端

## 17. Codex 执行指令（给你自己看）

### Step 1: 装 Phaser Skills 到 Codex
```bash
# Codex 的 skills 如果支持这个协议
npx skills add phaser basic-arcade-physics
```

### Step 2: 建造 V1
```bash
cd /Users/apple/projects/space-elevator-strike
codex exec "Read CODEX_V1.md. Build index.html, game.js, and test.js according to the spec. Run the self-evaluation tests. Fix all CRITICAL failures and ensure score >= 32/40 before reporting done."
```

### Step 3: 审核
- 打开 index.html 手动玩一局
- 检查 juice 层是否齐全
- 检查色调是否只用 DB16
- 检查锁定导弹手感

### Step 4: 迭代
- 如果有问题 → 写 CODEX_V2.md（只写需要改的部分）
- `codex exec "Read CODEX_V2.md and apply changes"`
- 重复

---

END OF CODEX_V1.md
