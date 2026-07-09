# CODEX_V3 — COMPLETE ART OVERHAUL

## 问题

当前所有精灵用 `Phaser.Graphics.fillTriangle/fillRect` 生成——这是"有颜色的几何图形"，不是像素美术。丑。

## 解决方案

### 管线切换：2D 颜色数组 → Canvas → Phaser texture

**彻底替换所有 `make()` 的绘图方式。** 新的 pipeline：

```
像素字符网格  →  Canvas 2D context  →  scene.textures.addSpriteSheet()
```

每个精灵定义为字符矩阵，每个字符映射到 DB16 调色盘的颜色 key：

```javascript
const PAL = {
  '.': null,  // transparent
  'v': DB16.void,
  'r': DB16.darkred,
  'n': DB16.navy,
  'g': DB16.gray,
  'b': DB16.brown,
  'e': DB16.green,
  'R': DB16.red,
  'w': DB16.warm,
  'B': DB16.blue,
  'O': DB16.orange,
  'c': DB16.cold,
  'L': DB16.lgreen,
  's': DB16.skin,
  'C': DB16.cyan,
  'Y': DB16.yellow,
  'W': DB16.white,
};

function renderPixelArt(grid, pal, scale = 2) {
  // grid: 2D array of characters
  // pal: character→color map
  // scale: each pixel in grid = scale×scale real pixels
  const h = grid.length;
  const w = grid[0].length;
  const c = document.createElement('canvas');
  c.width = w * scale;
  c.height = h * scale;
  const ctx = c.getContext('2d');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const color = pal[grid[y][x]];
      if (color !== undefined && color !== null) {
        ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }
  return c;
}

// Usage:
// const canvas = renderPixelArt(PLAYER_SHIP, PAL, 2);
// scene.textures.addSpriteSheet('player', canvas, { frameWidth: 48, frameHeight: 48 });
```

**所有现有 `make()` 调用必须删除替换。**

---

## 新精灵设计

### 1. 玩家战机 — 48×48 px（原 32×32，太小）

俯视三角翼战斗机，参考 F-22 / Su-57 轮廓。

```javascript
const PLAYER_SHIP = [
  // 48 columns wide, 48 rows tall
]
```

用字符描述：

```
                  nnnn
                nnnnnnnn
               BbbbbbbbB
              BbBbBbBbBbB
             BbbbbbbbbbbB
            BbBbbbbbbBbB
           BbbbbbbbbbbbbB
          BbBbbbbbbbbBbB
         BbbbBbBbbBbBbbbB
        BBBBbbbbbbbbbbBBBB
       BBBBBbbbbbbbbbbBBBBB
      BBBBBBbbbbbbbbbbBBBBBB
     BBBBBBBbbbWbbbWbbbBBBBBBB
    BBBBBBBBBbbbbbbbbbbBBBBBBB
   BBBBBBBBBBBbbbbbbbbBBBBBBBB
  BBBBBBBBBBBBBbbbbbbBBBBBBBBBB
        BBBBBBBBBBBBBBBBB
         BBBBBBBBBBBBBBB
          BBBBBBBBBBBBB
           BBBBBBBBBBB
            BBBBBBBBB
             BBBBBBB
              BBBBB
               OOO
              OOOOO
             OOOOOOO
            OOOOOOOOO
```

实际上这个字符描述只是个示意。关键是让 Codex 理解要用字符网格而不是 `fillTriangle`。我会给出每个精灵的精确网格。

**不对——** 我写 48×48 的精确网格不现实。更好的方法是：

**给 Codex 参考描述 + 参考链接，让它自己设计每个精灵的像素布局。** 参考现有的 shmup 像素风格。

关键约束：
- 只能用 DB16 调色盘的颜色
- 网格绘制
- 玩家战机 48×48，敌机 24×24~32×32

### 2. 敌机 Redesign

```
Drone:     16×16 — 菱形无人机，红色+黄色眼睛
Fighter:   24×24 — 三角翼敌机，深红+橙色引擎
Missile:   8×24  — 细长导弹，红色弹体+白色头部
Turret:    28×20 — 固定在电梯上的炮台，棕色基座+红色炮管
Heavy:     32×32 — 大型战舰，深红装甲+黄色舷窗+炮塔
```

### 3. 电梯背景 Redesign

当前只是两条棕色竖线+横杠。必须重画。

新的电梯在画面左侧 1/3 处（x=0~130），包含：
- **主缆索**：粗黑色/灰色竖条（x=40~55），带高光线
- **横梁结构**：每 40px 一条深棕色横梁，两端带黄/橙色警示灯
- **平台分段**：某些高度有平台（灰色块 + 红色警示条纹）
- **缆绳细节**：斜拉索从主缆斜向边缘

右侧 2/3 视野开阔：天空/太空背景。

实现方法：

```javascript
drawElevator(g, stageNo, scrollY) {
  // 主缆
  g.fillStyle(DB16.gray);
  g.fillRect(40, 0, 15, H);
  g.fillStyle(DB16.cold);  // 高光
  g.fillRect(42, 0, 3, H);
  g.fillStyle(DB16.void);  // 阴影
  g.fillRect(51, 0, 4, H);

  // 横梁 - 根据卷轴偏移
  const beamSpacing = 80;
  const offset = scrollY % beamSpacing;
  for (let y = -offset; y < H; y += beamSpacing) {
    // 横梁
    g.fillStyle(DB16.brown);
    g.fillRect(30, y, 60, 6);
    // 横梁高光
    g.fillStyle(DB16.warm);
    g.fillRect(30, y, 60, 2);
    // 左警示灯
    g.fillStyle(DB16.orange);
    g.fillRect(28, y + 1, 4, 4);
    // 右警示灯
    g.fillRect(88, y + 1, 4, 4);
    // 斜拉索
    g.lineStyle(1, DB16.gray, 0.5);
    g.lineBetween(30, y + 6, 0, y + 40);
    g.lineBetween(90, y + 6, 130, y + 40);
  }
}
```

### 4. 背景层次

三层 parallax：
- **Far（最远）**：渐变天空/太空，星星（用加号+形状代替圆点）
- **Mid（中景）**：电梯结构（左侧）+ 远处山脉/云层（根据阶段）
- **Near（最近）**：卷轴速度最快，碎片粒子飘过

### 5. 爆炸动画

当前 `burst()` 只是纯色圆点四散飞。改为多阶段爆炸：

```javascript
// 小型爆炸：4帧，从黄色→橙色→红色→消失
const EXPLOSION_SMALL = {
  0: ['..Y..','.YYY.','YYYYY','.YYY.','..Y..'],
  1: ['..O..','.OOO.','OOOOO','.OOO.','..O..'],
  2: ['..R..','.RRR.','RRRRR','.RRR.','..R..'],
  3: ['.....','..R..','.....','.....','.....'],
};

// 中型爆炸：6帧
// 大型爆炸：8帧 + 冲击波环
```

### 6. 玩家僚机尾焰

当前只有黄色/橙色的 3×3 方块。改造成：
- 动态尾焰 = 根据玩家速度变化长度
- 加速时尾焰拉长，松手时缩短
- 闪烁粒子从尾焰末端飘出

---

## 修改文件

只改 `game.js`。不修改其他文件。

## 验证

修改后 `node test.js` 必须全部通过（20/20, ≥32分）。
