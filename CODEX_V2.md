# CODEX_V2 — WAVE / LEVEL SYSTEM OVERHAUL

## 问题总结

V1 波次系统的几个硬伤：
1. `waveSize()` = `3+floor(wave*1.5)` → 波1才4个敌人，打完15秒就没了
2. 波间间隔 3 秒无敌人 → 空的
3. 敌人类型随机乱出，没有编队感
4. 每5波的"boss"只是一个 heavy，和普通怪没区别
5. 卷轴速度 100px/s 太慢，爬 5 分钟才到 Stage 2
6. 没有波次编号显示，玩家不知道自己在哪

## 需要改的文件

只改 `game.js`。不要动 `index.html`、`test.js` 和 CODEX_V1.md。

## 修改清单

### 1. SCROLL_SPEED 改为逐阶段递增

**找到 GameScene.create() 附近的 this.scrollSpeed 初始化，以及 update() 里的速度计算，改成：**

```javascript
// 替换原先的 scrollSpeed 逻辑
// 在 create() 里：
this.scrollSpeed = STAGE_SCROLL_BASE;  // 不再用 C.SCROLL_SPEED_BASE

// 常量区新增：
STAGE_SCROLL_BASE = 180    // 基础卷轴速度（原100，太慢）
STAGE_SCROLL_BOOST = 30    // 每阶段加速
```

在 `update()` 中找到 `this.scrollSpeed=C.SCROLL_SPEED_BASE+(this.stageNo-1)*18` 替换为：
```javascript
this.scrollSpeed = STAGE_SCROLL_BASE + (this.stageNo - 1) * STAGE_SCROLL_BOOST;
```

### 2. 波次系统完全重写

**替换整个 wave 相关逻辑：**

```javascript
// 替换 waveSize()
// 每波敌人数量：逐渐增多
waveSize() {
  // 波1=8个，之后每波+2，上限25
  return Math.min(25, 8 + (this.wave - 1) * 2);
}

// 替换 spawnDelay() - 敌人生成间隔
spawnDelay() {
  // 波1=700ms，逐渐减到200ms
  return Math.max(200, 700 - this.wave * 30);
}

// 新增：每波敌人类别组成
getWaveComposition() {
  // stage 决定了可用敌人池
  // 每波生成一个混合编队
  const stage = this.stageNo;
  let pool = ['drone'];
  if (stage >= 1) pool.push('drone', 'drone', 'missile');
  if (stage >= 2) pool.push('fighter');
  if (stage >= 3) pool.push('turret');
  if (stage >= 4) pool.push('heavy');
  
  // Boss波（每5波）：全是重型+护卫
  if (this.wave % 5 === 0) {
    return ['heavy', 'heavy', 'heavy'];
  }
  return pool;
}

// 替换 spawnEnemy() 逻辑 - 从 getWaveComposition 取类型
spawnEnemy(forced) {
  if (this.enemies.countActive() >= C.MAX_ENEMIES) return;
  let type = forced;
  if (!type) {
    const pool = this.getWaveComposition();
    type = pool[Phaser.Math.Between(0, pool.length - 1)];
  }
  // ... 其余不变，但新增 BOSS 波特殊处理
  const d = ENEMY[type];
  // Boss波敌人双倍血量
  if (this.wave % 5 === 0 && forced === 'heavy') {
    d.hp = 12;  // 原来5
    d.score = 2000;  // 原来800
  }
  // ... rest of spawn logic unchanged
}
```

**替换 update() 中的波次控制逻辑（约在 line 340-345）：**

```javascript
// 替换这段：
// 老逻辑：
// if(this.waveSpawned<this.waveTarget&&time>=this.nextSpawn){
//   this.spawnEnemy();this.waveSpawned++;this.nextSpawn=time+this.spawnDelay();
// } else if(...)

// 新逻辑：
if (this.waveSpawned < this.waveTarget && time >= this.nextSpawn) {
  // Boss波：一口气生成所有heavy，然后再出护卫
  if (this.wave % 5 === 0 && this.waveSpawned < 3) {
    this.spawnEnemy('heavy');
  } else {
    this.spawnEnemy();
  }
  this.waveSpawned++;
  this.nextSpawn = time + this.spawnDelay();
}

// 波次结束检查：全部敌人生完 + 屏幕上无活跃敌人 + 至少过了3秒
if (this.waveSpawned >= this.waveTarget && this.enemies.countActive() === 0 && time > this.nextSpawn + 2000) {
  // Boss波通关时特殊效果
  if (this.wave % 5 === 0) {
    this.showBossClear();
  }
  this.wave++;
  this.waveSpawned = 0;
  this.waveTarget = this.waveSize();
  this.nextSpawn = time + 2500;  // 波间休息2.5秒
  this.waveText.setText('WAVE ' + this.wave);
  // 波间文字弹出
  const wt = this.add.text(W/2, H/2, 'WAVE ' + this.wave, textStyle(22, DB16.cyan)).setOrigin(0.5).setDepth(40).setAlpha(0);
  this.tweens.add({ targets: wt, alpha: 1, hold: 600, alpha: 0, duration: 300, onComplete: () => wt.destroy() });
}
```

### 3. HUD 增加波次显示

**在 createHud() 里新增：**
```javascript
// 加在 this.stageText 后面
this.waveText = this.add.text(W/2, 62, 'WAVE 1', textStyle(12, DB16.cyan)).setOrigin(0.5, 0).setDepth(20);
// 加入 hudElements
this.hudElements.push(this.waveText);
```

### 4. 波间敌人持续生成

**修复目前「波间3秒无敌人」的问题：**
- 新逻辑里波间只有 2.5 秒，并且在 Wave N 文字弹出期间就开始了下一波
- 确保 `MAX_ENEMIES` 增加到适当数量

**修改常量：**
```javascript
// 找到 const C = Object.freeze({...}); 里面的 MAX_ENEMIES
// 改：
MAX_ENEMIES: 15  // 原来是 8，屏幕太干净
```

### 5. 敌人血量微调

让游戏更长更有挑战性：
```javascript
// 在 ENEMY 配置中：
const ENEMY = {
  drone:   { hp: 1, speed: 100, score: 100, texture: 'drone' },
  fighter: { hp: 3, speed: 80,  score: 250, texture: 'enemyFighter' },  // 原2→3
  missile: { hp: 1, speed: 200, score: 150, texture: 'enemyMissile' },
  turret:  { hp: 5, speed: 0,   score: 400, texture: 'turret' },         // 原3→5
  heavy:   { hp: 8, speed: 40,  score: 800, texture: 'heavy' }           // 原5→8
};
```

### 6. Boss Clear 特效

**新增方法：**
```javascript
showBossClear() {
  // 全屏闪烁+大字"BOSS CLEAR"
  this.add.text(W/2, H/2 - 50, 'BOSS CLEAR', textStyle(28, DB16.yellow)).setOrigin(0.5).setDepth(45);
  this.cameras.main.flash(500, 255, 255, 255, true);
  this.cameras.main.shake(500, 15/W);
  // 全屏粒子爆发
  for (let i = 0; i < 40; i++) {
    this.time.delayedCall(i * 20, () => {
      this.burst(
        Phaser.Math.Between(50, W-50),
        Phaser.Math.Between(100, H-100),
        6,
        [DB16.yellow, DB16.white, DB16.orange, DB16.cyan]
      );
    });
  }
}
```

### 7. 阶段推进速度加快且更明显

**修改 altitude 累加速度：**
```javascript
// 在 update() 中：
this.altitude += this.scrollSpeed * dt * 8;  // 原 * 5，改 * 8
// 这样在180px/s下，Stage 2 (2000m) 约14秒到达，Stage 3 (8000m) 约42秒
```

同时给每个阶段增加一个**门槛事件**，不是悄无声息就过了：
- 阶段切换时除了 showStage() 文字，也清空屏幕所有子弹
- Stage 3 开始给玩家一个额外的视觉效果（屏幕边缘结冰效果 = 白色小矩形随机出现）

---

**不改的内容：** test.js、index.html、所有美术素材、触控方案、得分系统、combo 系统。

修改后运行：`node test.js` 确认 20 项全过且分数 ≥ 32。
