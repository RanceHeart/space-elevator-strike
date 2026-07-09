# CODEX_V5 — PC 显示适配

## 问题

390×690 竖屏在 PC 横屏显示器上用 `Phaser.Scale.FIT` 显示——两侧大片黑边，窗口体验很差。

## 方案

### 1. index.html CSS 重写

给页面加上：
- 全屏动态星点背景（canvas 没覆盖到的地方显示星空）
- 游戏画布居中，四周加像素风边框（模拟街机框体效果）
- 边框使用 DB16 色盘的颜色

```html
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: 100%; height: 100%;
    background: #140C1C;
    overflow: hidden;
    touch-action: none;
    user-select: none;
  }
  body {
    /* 星空背景 */
    background-image:
      radial-gradient(1px 1px at 20% 30%, #DEEED6 100%, transparent),
      radial-gradient(1px 1px at 40% 70%, #8595A1 100%, transparent),
      radial-gradient(1.5px 1.5px at 60% 20%, #DEEED6 100%, transparent),
      radial-gradient(1px 1px at 80% 50%, #597DCE 100%, transparent),
      radial-gradient(1px 1px at 10% 80%, #DEEED6 100%, transparent),
      radial-gradient(1.5px 1.5px at 90% 10%, #8595A1 100%, transparent),
      radial-gradient(1px 1px at 50% 50%, #DEEED6 100%, transparent),
      radial-gradient(1px 1px at 70% 90%, #597DCE 100%, transparent),
      radial-gradient(1px 1px at 30% 10%, #DEEED6 100%, transparent);
    background-size: 200px 200px;
    background-color: #140C1C;
  }
  #game-container {
    width: 100%; height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  /* 给 canvas 外层套个像素风边框 */
  #game-container canvas {
    border: 3px solid #30346D;
    box-shadow:
      0 0 0 1px #4E4A4F,
      0 0 20px rgba(89,125,206,0.3);
    border-radius: 2px;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
  }
</style>
```

### 2. Phaser config 调整

在 game.js 的 config 里：
- 保留 `Phaser.Scale.FIT`
- 但加 `autoRound: true` 确保缩放比例是整数（防止像素模糊）
- render 里确保 `antialias: false, pixelArt: true, roundPixels: true`

```javascript
scale: {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
  width: W,
  height: H,
  autoRound: true,    // ← 新增，确保整数缩放
},
```

## 修改文件

只改 `index.html`。

## 不改

- game.js（除了加一行 `autoRound: true`）
- test.js
- 任何游戏逻辑
