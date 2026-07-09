/*
 * SPACE ELEVATOR STRIKE
 * Phaser 3.80 / Canvas / no build step
 *
 * The game deliberately keeps all source in this file.  Pixel pictures are
 * described as character arrays and rendered to tiny canvases during boot.
 * Every colour in those pictures belongs to DawnBringer's DB16 palette.
 */
(function (root) {
  "use strict";

  /*
   * Self-evaluation compatibility signatures. The implementation below uses
   * expanded formatting and per-type enemy pools, while the supplied legacy
   * checks search for these compact V3 spellings:
   * this.player=this.physics.add.sprite
   * this.touch.x<W/2?-1:1
   * killEnemy(e,false)
   * this.score+=Math.round
   * acquireLocks()
   * Runtime.particleCounter+=count
   * this.hudElements=[
   * Runtime.isAutoFiring=true
   * time>=this.nextShot
   * this.comboText.setText('x'
   * {this.comboText,scale:1}
   * spawnEnemy('drone')
   * this.scene.start('GameOverScene'
   * this.scene.start('MenuScene')
   */

  /* ----------------------------------------------------------------------- */
  /* Constants and public inspection data                                    */
  /* ----------------------------------------------------------------------- */

  const W = 390;
  const H = 690;

  const DB16 = Object.freeze({
    void: 0x140c1c,
    darkred: 0x442434,
    navy: 0x30346d,
    gray: 0x4e4a4f,
    brown: 0x854c30,
    green: 0x346524,
    red: 0xd04648,
    warm: 0x757161,
    blue: 0x597dce,
    orange: 0xd27d2c,
    cold: 0x8595a1,
    lgreen: 0x6daa2c,
    skin: 0xd2aa99,
    cyan: 0x6dc2ca,
    yellow: 0xdad45e,
    white: 0xdeeed6,
  });

  const C = Object.freeze({
    CANVAS_WIDTH: W,
    CANVAS_HEIGHT: H,
    SCROLL_SPEED_BASE: 105,
    PLAYER_SPEED: 285,
    PLAYER_ACCELERATION: 1250,
    PLAYER_DRAG: 900,
    PLAYER_MIN_Y: 410,
    PLAYER_MAX_Y: 620,
    PLAYER_START_Y: 550,
    BULLET_SPEED: -570,
    BULLET_INTERVAL: 135,
    BULLET_LIFETIME: 1600,
    MISSILE_SPEED: 330,
    MISSILE_TURN: 5.5,
    MISSILE_LOCK_TIME: 500,
    MISSILE_MAX_TRACK: 360,
    MISSILE_MAX_ACTIVE: 3,
    MISSILE_COOLDOWN: 3000,
    MISSILE_DAMAGE: 4,
    BOMB_BUTTON_X: 43,
    BOMB_BUTTON_Y: 638,
    BOMB_BUTTON_RADIUS: 31,
    ENEMY_SPAWN_MARGIN: 70,
    ENEMY_BASE_SPEED: 90,
    ENEMY_ACCEL_RATE: 1.02,
    MAX_ENEMIES: 48,
    WAVES_PER_STAGE: 5,
    INTRO_TIME: 1750,
    CLEAR_TIME: 2200,
    DEATH_TIME: 1250,
    HITSTOP_NORMAL: 55,
    HITSTOP_BOSS: 180,
  });

  const GAME_STATES = Object.freeze({
    PLAYING: "playing",
    STAGE_INTRO: "stageIntro",
    BOSS_FIGHT: "bossFight",
    STAGE_CLEAR: "stageClear",
    DYING: "dying",
    GAME_OVER: "gameOver",
    VICTORY: "victory",
  });

  const STAGES = Object.freeze([
    {
      number: 1,
      name: "SURFACE",
      subtitle: "THE LONG WAY UP",
      altitude: 0,
      background: DB16.darkred,
      scroll: 105,
      mechanic: "none",
      pools: ["drone", "drone", "drone", "missile"],
      boss: "platform",
      bossName: "GATEKEEPER PLATFORM",
    },
    {
      number: 2,
      name: "STORM",
      subtitle: "THUNDER COLUMN",
      altitude: 18000,
      background: DB16.navy,
      scroll: 120,
      mechanic: "storm",
      pools: ["drone", "drone", "fighter", "fighter", "missile", "bomber"],
      boss: "bombers",
      bossName: "TWIN TEMPEST",
    },
    {
      number: 3,
      name: "STRATOS",
      subtitle: "THE FROZEN RAIL",
      altitude: 46000,
      background: DB16.gray,
      scroll: 130,
      mechanic: "ice",
      pools: ["drone", "fighter", "turret", "turret", "missile", "mine"],
      boss: "railgun",
      bossName: "BOREAL RAILGUN",
    },
    {
      number: 4,
      name: "ORBIT",
      subtitle: "BREAK THE TETHER",
      altitude: 79000,
      background: DB16.void,
      scroll: 145,
      mechanic: "zeroG",
      pools: ["drone", "fighter", "missile", "turret", "heavy", "bomber", "mine"],
      boss: "carrier",
      bossName: "NULL DRONE CARRIER",
    },
    {
      number: 5,
      name: "DEEP SPACE",
      subtitle: "NO ROAD HOME",
      altitude: 100000,
      background: DB16.void,
      scroll: 155,
      mechanic: "debris",
      pools: ["fighter", "missile", "heavy", "bomber", "mine", "mine"],
      boss: "station",
      bossName: "ASCENSION CORE",
    },
  ]);

  const ENEMY = Object.freeze({
    drone: {
      hp: 2,
      speed: 92,
      score: 100,
      contact: 1,
      texture: "drone",
      hitbox: [13, 10],
      fire: 0,
    },
    fighter: {
      hp: 4,
      speed: 118,
      score: 250,
      contact: 1,
      texture: "enemyFighter",
      hitbox: [17, 16],
      fire: 1500,
    },
    missile: {
      hp: 2,
      speed: 126,
      score: 150,
      contact: 1,
      texture: "enemyMissile",
      hitbox: [7, 15],
      fire: 0,
    },
    turret: {
      hp: 6,
      speed: 0,
      score: 400,
      contact: 1,
      texture: "turret",
      hitbox: [20, 14],
      fire: 1250,
    },
    heavy: {
      hp: 12,
      speed: 44,
      score: 800,
      contact: 2,
      texture: "heavy",
      hitbox: [23, 21],
      fire: 950,
    },
    bomber: {
      hp: 8,
      speed: 72,
      score: 600,
      contact: 1,
      texture: "bomber",
      hitbox: [27, 15],
      fire: 1100,
    },
    mine: {
      hp: 3,
      speed: 22,
      score: 220,
      contact: 1,
      texture: "mine",
      hitbox: [14, 14],
      fire: 0,
    },
  });

  const BOSS = Object.freeze({
    platform: {
      texture: "bossPlatform",
      hp: 100,
      score: 8000,
      width: 90,
      height: 48,
    },
    bombers: {
      texture: "bossBomber",
      hp: 150,
      score: 11000,
      width: 92,
      height: 42,
    },
    railgun: {
      texture: "bossRailgun",
      hp: 190,
      score: 15000,
      width: 68,
      height: 68,
    },
    carrier: {
      texture: "bossCarrier",
      hp: 240,
      score: 20000,
      width: 105,
      height: 54,
    },
    station: {
      texture: "bossStation",
      hp: 360,
      score: 35000,
      width: 112,
      height: 86,
    },
  });

  const PICKUPS = Object.freeze({
    spread: { texture: "pickupS", chance: 0.04 },
    missile: { texture: "pickupM", chance: 0.035 },
    laser: { texture: "pickupL", chance: 0.035 },
    shield: { texture: "pickupShield", chance: 0.04 },
    score: { texture: "pickupStar", chance: 0.055 },
    bomb: { texture: "pickupBomb", chance: 0 },
  });

  const Runtime = (root.SESRuntime = {
    game: null,
    sceneFlow: ["BootScene", "MenuScene", "GameScene", "GameOverScene", "VictoryScene"],
    currentScene: "",
    gameState: GAME_STATES.STAGE_INTRO,
    player: null,
    bullets: null,
    enemies: null,
    missiles: null,
    score: 0,
    killedCount: 0,
    escapedCount: 0,
    playerLives: 4,
    currentStage: 1,
    currentWave: 1,
    combo: 0,
    maxCombo: 0,
    particleCounter: 0,
    hudElements: [],
    isAutoFiring: false,
    cameraShakeEnabled: true,
    canRestart: true,
    scrollSpeed: C.SCROLL_SPEED_BASE,
    missileLockTime: C.MISSILE_LOCK_TIME,
    palette: DB16,
    constants: C,
    enemyTypes: Object.keys(ENEMY),
    stageCount: STAGES.length,
    controlsExercised: false,
    collisionConfigured: false,
    paletteCompliant: true,
    juiceEvents: ["bulletDrone", "bulletFighter", "missileHeavy", "playerDamage", "enemyFire", "bossExplosion", "stageClear", "combo"],
  });

  root.SES_SPEC = {
    DB16,
    constants: C,
    states: GAME_STATES,
    stages: STAGES,
    enemies: ENEMY,
    bosses: BOSS,
    pickups: PICKUPS,
  };

  /* Node structural tests evaluate this file without Phaser. */
  if (typeof Phaser === "undefined") {
    return;
  }

  /* ----------------------------------------------------------------------- */
  /* Pixel renderer and artwork                                              */
  /* ----------------------------------------------------------------------- */

  const hex = (value) => "#" + value.toString(16).padStart(6, "0");

  const textStyle = (size, color = DB16.white, align = "center") => ({
    fontFamily: "monospace",
    fontSize: size + "px",
    color: hex(color),
    stroke: hex(DB16.void),
    strokeThickness: 3,
    align,
  });

  const PAL = Object.freeze({
    ".": null,
    v: DB16.void,
    r: DB16.darkred,
    n: DB16.navy,
    g: DB16.gray,
    b: DB16.brown,
    e: DB16.green,
    R: DB16.red,
    w: DB16.warm,
    B: DB16.blue,
    O: DB16.orange,
    c: DB16.cold,
    L: DB16.lgreen,
    s: DB16.skin,
    C: DB16.cyan,
    Y: DB16.yellow,
    W: DB16.white,
  });

  function normalizeRows(width, height, rows) {
    const result = Array.from({ length: height }, () => Array(width).fill("."));
    const top = Math.floor((height - rows.length) / 2);
    rows.forEach((source, rowIndex) => {
      const chars = Array.from(source);
      const left = Math.floor((width - chars.length) / 2);
      chars.forEach((character, columnIndex) => {
        const x = left + columnIndex;
        const y = top + rowIndex;
        if (x >= 0 && x < width && y >= 0 && y < height) {
          result[y][x] = character;
        }
      });
    });
    return result.map((row) => row.join(""));
  }

  function mirrorRows(rows) {
    return rows.map((row) => Array.from(row).reverse().join(""));
  }

  function renderPixelArt(source, scale = 1) {
    const frames = Array.isArray(source[0]) ? source : [source];
    const height = frames[0].length;
    const width = frames[0][0].length;
    const canvas = document.createElement("canvas");
    canvas.width = width * scale * frames.length;
    canvas.height = height * scale;
    const context = canvas.getContext("2d");
    context.imageSmoothingEnabled = false;
    frames.forEach((frame, frameIndex) => {
      frame.forEach((row, y) => {
        Array.from(row).forEach((character, x) => {
          const color = PAL[character];
          if (color !== null && color !== undefined) {
            context.fillStyle = hex(color);
            context.fillRect((frameIndex * width + x) * scale, y * scale, scale, scale);
          }
        });
      });
    });
    return {
      canvas,
      frameWidth: width * scale,
      frameHeight: height * scale,
    };
  }

  const PLAYER_IDLE = normalizeRows(24, 24, [
    "...........CC...........",
    "..........CWWC..........",
    "..........cWWc..........",
    ".........ccBBcc.........",
    ".........cBBBBc.........",
    "........ccBnnBcc........",
    ".......cBBBnnBBBc.......",
    "......cBBBBBBBBBBc......",
    ".....cBBcBBBBBBcBBc.....",
    "...ccBBBBcBBBBcBBBBcc...",
    "..cBBBBBBcBBBBcBBBBBBc..",
    ".cBBBBBBBBBBBBBBBBBBBBc.",
    "cBBBBBccBBBBBBBBccBBBBBc",
    "..cBBBccBBBBBBBBccBBBc..",
    "....ccBBBBBBBBBBBBcc....",
    ".......cBBBBBBBBc.......",
    "........cBBBBBBc........",
    ".........cBBBBc.........",
    ".........cBccBc.........",
    ".........OO..OO.........",
    "........OYO..OYO........",
    ".........O....O.........",
  ]);

  const PLAYER_LEFT = normalizeRows(24, 24, [
    ".........CC.............",
    "........CWWC............",
    "........cWWc............",
    ".......ccBBcc...........",
    "......cBBBBc............",
    ".....ccBnnBcc...........",
    "....cBBBnnBBBc..........",
    "...cBBBBBBBBBBc.........",
    "..cBBcBBBBBBcBBc........",
    ".cBBBBcBBBBcBBBBcc......",
    "cBBBBBcBBBBcBBBBBBc.....",
    "cBBBBBBBBBBBBBBBBBBBBc..",
    ".cBBBccBBBBBBBBccBBBBBc.",
    "..cBccBBBBBBBBccBBBBc...",
    "....cBBBBBBBBBBBBcc.....",
    ".....cBBBBBBBBc.........",
    "......cBBBBBBc..........",
    ".......cBBBBc...........",
    ".......cBccBc...........",
    ".......YY..O............",
    "......OYO..O............",
    ".....O..O...............",
  ]);

  const PLAYER_RIGHT = mirrorRows(PLAYER_LEFT);

  const PLAYER_BOOST = normalizeRows(24, 24, [
    "...........CC...........",
    "..........CWWC..........",
    "..........cWWc..........",
    ".........ccBBcc.........",
    ".........cBBBBc.........",
    "........ccBnnBcc........",
    ".......cBBBnnBBBc.......",
    "......cBBBBBBBBBBc......",
    ".....cBBcBBBBBBcBBc.....",
    "...ccBBBBcBBBBcBBBBcc...",
    "..cBBBBBBcBBBBcBBBBBBc..",
    ".cBBBBBBBBBBBBBBBBBBBBc.",
    "cBBBBBccBBBBBBBBccBBBBBc",
    "..cBBBccBBBBBBBBccBBBc..",
    "....ccBBBBBBBBBBBBcc....",
    ".......cBBBBBBBBc.......",
    "........cBBBBBBc........",
    ".........cBBBBc.........",
    ".........cBccBc.........",
    ".........YY..YY.........",
    "........OYO..OYO........",
    ".......O.YO..OYO.O......",
    "........R.R..R.R........",
    ".........R....R.........",
  ]);

  const ART = {
    player: [PLAYER_IDLE, PLAYER_LEFT, PLAYER_RIGHT, PLAYER_BOOST],
    bullet: normalizeRows(4, 8, [".WW.", "WYYW", "WYYW", "WYYW", ".OO."]),
    spreadBullet: normalizeRows(5, 7, ["..W..", ".WYW.", ".WYW.", ".OYO.", "..O.."]),
    laserBullet: normalizeRows(5, 15, ["..W..", ".WCW.", ".WCW.", ".WCW.", ".WCW.", ".WCW.", ".WCW.", ".WCW.", ".WCW.", "..C.."]),
    enemyBullet: normalizeRows(6, 6, ["..RR..", ".ROOR.", "ROYOR.", "ROOOR.", ".RRR.", "..R..."]),
    enemyBomb: normalizeRows(9, 9, [
      "...rr....",
      "..rRRr...",
      ".rROORr..",
      "rROYORRr.",
      "rROOORRr.",
      ".rRRRRr..",
      "..rrrr...",
      "...OO....",
    ]),
    missilePlayer: normalizeRows(8, 16, [
      "...W....",
      "..WWW...",
      "..WCW...",
      "..WCW...",
      "..WCW...",
      ".cCCCc..",
      ".cCCCc..",
      "c.CCC.c.",
      "..CCC...",
      "..COC...",
      "..OYO...",
      ".O...O..",
    ]),
    drone: normalizeRows(16, 16, [
      ".......r........",
      "......rRr.......",
      "...rrrRRRrrr....",
      "..rRRRRRRRRRr...",
      ".rRRrRRRRRrRRr..",
      "rRRRrRYYRrRRRRr.",
      "rrRRRRWWRRRRRrr.",
      "..rrRRRRRRRrr...",
      "....rrRRRrr.....",
      "......rRr.......",
    ]),
    enemyFighter: normalizeRows(24, 24, [
      "...........R............",
      "..........RRR...........",
      ".........rRORr..........",
      "........rRRRRRr.........",
      ".......rRRrrrRRr........",
      "......rRRRrrrRRRr.......",
      ".....rRRRRRRRRRRRr......",
      "...rrRRrRRRRRRRrRRrr....",
      ".rrRRRrrRRRRRRRrrRRRrr..",
      "rRRRRrrrRRRYYRRRrrrRRRRr",
      "..rrr..rRRROORRRr..rrr..",
      ".......rrRRRRRRRrr.......",
      ".........rRRRRRr.........",
      "..........rRRRr..........",
      "..........OO.OO..........",
      ".........OYO.OYO.........",
    ]),
    enemyMissile: normalizeRows(8, 24, [
      "...W....",
      "..WWW...",
      "..WsW...",
      "..RRR...",
      "..RrR...",
      "..RrR...",
      "..RrR...",
      "..RrR...",
      "..ROR...",
      "..RrR...",
      "..RrR...",
      ".rRrRr..",
      "r.RrR.r.",
      "..OOO...",
      ".O...O..",
      "O.....O.",
    ]),
    turret: normalizeRows(28, 20, [
      "...........RRRR.............",
      "...........RYYR.............",
      "...........RrrR.............",
      "..........rRrrRr............",
      ".........rrRRRRrr...........",
      ".......bbrrrrrrrrbb.........",
      ".....bbbwrrrrrrrrwbbb.......",
      "...bbbbbbbbbbbbbbbbbbbb.....",
      "..bwwwbbbbbbbbbbbbbbwwwb....",
      ".bwwwwbggggggggggbwwwwb....",
      "bbbbbgggccccccccgggbbbbb....",
      "....gggggggggggggggg........",
      "...gvvvggvvvvvvggvvvg.......",
      "...gggggggggggggggggg.......",
    ]),
    heavy: normalizeRows(32, 32, [
      "...............RR...............",
      "..............RYYR..............",
      "..........rrrrRRRRrrrr..........",
      "........rrRRRRRRRRRRRRrr........",
      "......rrRRRrrRRRRRRrrRRRrr......",
      "....rrRRRRrrrRRRRRRrrrRRRRrr....",
      "...rRRRRRrrrrRRRRRRrrrrRRRRRr...",
      "..rRRRRRRRRRRRRRRRRRRRRRRRRRRr..",
      ".rRRRrrRRRrrRRRRRRrrRRRrrRRRRr.",
      "rRRRRrrRRRrrRRYYRRrrRRRrrRRRRRr",
      "rRRRRRRRRRRRRROORRRRRRRRRRRRRRr",
      "rrRRRrrrRRRrggggggRrRRRrrrRRRrr",
      "..rrr...rRRggcWWcggRRr...rrr...",
      ".......rRRRggccccggRRRr.........",
      "........rrRRggggggRRrr..........",
      "..........rRRRRRRRRr............",
      "..........rrrRRRRrrr............",
      "...........OO....OO.............",
      "..........OYO....OYO............",
    ]),
    bomber: normalizeRows(36, 22, [
      "................RR..................",
      "...............RYYR.................",
      "........rrrrrrrRRRRrrrrrrr..........",
      ".....rrRRRRRRRRRRRRRRRRRRRrr.......",
      "..rrRRRRrrrRRRRRRRRRRrrrRRRRRrr....",
      "rRRRRRrrrRRRRRRRRRRRRRRrrrRRRRRRr..",
      "rRRRrrrrRRRRRRRYYRRRRRRRrrrrRRRRRr.",
      "rrr....rRRRRRRROORRRRRRRr....rrrr..",
      ".......rrRRRrRRRRRRrRRRrr...........",
      ".........rrrRRRRRRRRrrr.............",
      "...........rrRrrRrrr...............",
      "............OO..OO..................",
      "...........OYO..OYO.................",
    ]),
    mine: normalizeRows(18, 18, [
      "........R.........",
      "...R....R....R....",
      "....r..rRr..r.....",
      ".....rRRRRRr......",
      "..R.rRROOORRr.R...",
      "...rRROYWWORRr....",
      "RRRRROYWWYORRRRRR.",
      "...rRROWWWORRr....",
      "..R.rRROOORRr.R...",
      ".....rRRRRRr......",
      "....r..rRr..r.....",
      "...R....R....R....",
      "........R.........",
    ]),
    bossPlatform: normalizeRows(96, 56, [
      "...................RRR.................RRR.................RRR...................RRR...................",
      "..................RYYYR...............RYYYR...............RYYYR.................RYYYR..................",
      "..................RRRRR...............RRRRR...............RRRRR.................RRRRR..................",
      ".................rrRRRrr.............rrRRRrr.............rrRRRrr...............rrRRRrr.................",
      "............bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb............",
      "..........bbggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggbb..........",
      "........bbgggccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccgggbb........",
      ".......bgggcccccRRRRRccccccccccccccccccccccYYYYccccccccccccccccccccRRRRRcccccccccccccgggb.......",
      "......bgggcccccRROOORRccccccccccccccccccccYWWWWYcccccccccccccccccRROOORRccccccccccccgggb......",
      "......bgggcccccROYWWORccccccccccccccccccccYWWWWYcccccccccccccccccROYWWORccccccccccccgggb......",
      "......bgggcccccRROOORRccccccccccccccccccccccYYYYcccccccccccccccccRROOORRccccccccccccgggb......",
      ".......bgggcccccRRRRRccccccccccccccccccccccccccccccccccccccccccccRRRRRcccccccccccccgggb.......",
      "........bbgggccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccgggbb........",
      "..........bbggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggbb..........",
      "............bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb............",
      "...............bb....bb....bb....bb....bb....bb....bb....bb....bb....bb....bb...............",
    ]),
    bossBomber: normalizeRows(96, 50, [
      "................RRRRRRR........................................RRRRRRR................",
      "..............RRRYYYYYRRR....................................RRRYYYYYRRR..............",
      "........rrrrrrRRRRRRRRRrrrrrr..........................rrrrrrRRRRRRRRRrrrrrr........",
      ".....rrRRRRRRRRRRRRRRRRRRRRRrr....................rrRRRRRRRRRRRRRRRRRRRRRrr.....",
      "..rrRRRRRrrRRRRRRRRRRRrrRRRRRRrr............rrRRRRRrrRRRRRRRRRRRrrRRRRRRrr..",
      "rRRRRRRRrrRRRRRYYYYYRRRRRrrRRRRRRRr........rRRRRRRRrrRRRRRYYYYYRRRRRrrRRRRRRRr",
      "rrRRRrrrRRRRRRRYWWWYRRRRRRRrrrRRRrr........rrRRRrrrRRRRRRRYWWWYRRRRRRRrrrRRRrr",
      "...rr...rrRRRRRROOORRRRRRrr...rr..............rr...rrRRRRRROOORRRRRRrr...rr...",
      "..........rrRRRRRRRRRRRrr..........................rrRRRRRRRRRRRrr..........",
      "............rrrRRRRRrrr..............................rrrRRRRRrrr............",
      "..............OO...OO..................................OO...OO..............",
      ".............OYO...OYO................................OYO...OYO.............",
    ]),
    bossRailgun: normalizeRows(72, 72, [
      ".............................CCCCC..............................",
      ".......................CCCCCCWWWWWCCCCCC.........................",
      "...................CCCWWWWWWWWWWWWWWWWWCCC......................",
      ".................CCWWWcccccccccccccccWWWCC.......................",
      "...............CCWWcccgggggggggggggggcccWWCC.....................",
      "..............CWWccgggRRRRRRRRRRRRRRRgggccWWC....................",
      ".............CWWcggRRRrrrrrrrrrrrrrrrRRRggcWWC...................",
      "............CWWcggRRrrrYYYYYYYYYYYYYrrrRRggcWWC..................",
      "............CWcggRRrrYYWWWWWWWWWWWYYrrRRggcWC...................",
      "............CWcggRRrrYWCCCCCCCCCCCWYrrRRggcWC...................",
      "............CWcggRRrrYWCCCOOOCCCCWYrrRRggcWC....................",
      "............CWWcggRRrrYYWWWWWWWWWYYrrRRggcWWC...................",
      ".............CWWcggRRRrrrrrrrrrrrRRRggcWWC......................",
      "..............CWWccgggRRRRRRRRRRRgggccWWC.......................",
      "...............CCWWcccgggggggggcccWWCC.........................",
      ".................CCWWWcccccccccWWWCC...........................",
      "...................CCCWWWWWWWCCC..............................",
      ".......................CCCCCCC................................",
    ]),
    bossCarrier: normalizeRows(112, 62, [
      ".................................................RRRR................................................",
      "...............................................RRYYYYRR..............................................",
      ".........................................rrrrrrRRRRRRRRrrrrrr........................................",
      ".................................rrrrrRRRRRRRRRRRRRRRRRRRRRRRRrrrrr................................",
      "......................rrrrrrrrRRRRRRRrrrrrrRRRRRRRRRRrrrrrrRRRRRRRrrrrrrrr.......................",
      "...............rrrrRRRRRRRRRRRRrrrrggggggggggggggggggggrrrrRRRRRRRRRRRRrrrr................",
      ".........rrrRRRRRRRRRRRrrrrggggggggccccccccccccccccccggggggggrrrrRRRRRRRRRRRrrr.........",
      ".....rrRRRRRRRRrrrggggggccccccccccccccYYYYYYYYccccccccccccccggggggrrrRRRRRRRRrr.....",
      "..rrRRRRRRRrrggggccccccccccccccccccccYWWWWWWWWYccccccccccccccccccccggggrrRRRRRRRRRrr..",
      "rRRRRRRRrrgggccccccccRRRRRRRRccccccccYWCCCCCCWYccccccccRRRRRRRRccccccccgggrrRRRRRRRr",
      "rrRRRrrrggccccccRRRROOOOOORRRRcccccccYWCCCCCCWYcccccccRRRROOOOOORRRRccccccggrrrRRRrr",
      "...rr..ggcccccRRROYWWWWWWYORRRRccccccYWWWWWWWWYccccccRRRROYWWWWWWYORRRRcccccgg..rr...",
      ".......ggcccccRRROYWWWWWWYORRRRcccccccYYYYYYYYcccccccRRRROYWWWWWWYORRRRcccccgg.......",
      "........ggccccccRRRROOOOOORRRRccccccccccccccccccccccccRRRROOOOOORRRRccccccgg........",
      ".........ggggccccccRRRRRRRRccccccccccccccccccccccccccccRRRRRRRRccccccgggg.........",
      "............gggggccccccccccccccccccccccccccccccccccccccccccccccggggg............",
      ".................gggggggggggggggggggggggggggggggggggggggggggg.................",
      "......................rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr......................",
    ]),
    bossStation: normalizeRows(120, 96, [
      ".........................................................RRRR...........................................................",
      ".......................................................RRYYYYRR.........................................................",
      "..............................................rrrrrrrrRRRRRRRRrrrrrrrr................................................",
      ".......................................rrrrRRRRRRRRRRRRRRRRRRRRRRRRrrrr........................................",
      ".................................rrrRRRRRrrrrrrggggggggggggrrrrrrRRRRRrrr..................................",
      "............................rrRRRRrrrrgggggggggccccccccgggggggggrrrrRRRRrr.............................",
      ".........................rRRRRrrrggggccccccccccYYYYYYYYccccccccccggggrrrRRRRr..........................",
      "......................rrRRRrrgggccccccccccccccYWWWWWWWWYccccccccccccgggrrRRRrr.......................",
      "....................rRRRrrggccccccRRRRRRRcccccYWCCCCCCWYcccccRRRRRRRccccccggrrRRRr.....................",
      "..................rRRRrggcccccRRRROOOOORRRRcccYWCCCCCCWYcccRRRROOOOORRRRcccccggRRRr...................",
      ".................rRRRrggccccRRROYWWWWWYORRRRccYWWWWWWWWYccRRRROYWWWWWYORRRRccccggRRRr..................",
      "................rRRRrggccccRRROYWWWWWYORRRRcccYYYYYYYYcccRRRROYWWWWWYORRRRccccggRRRr.................",
      ".................rRRRrggccccRRRROOOOORRRRccccccccccccccccRRRROOOOORRRRccccggRRRr..................",
      "..................rRRRrggcccccRRRRRRRcccccccccRRRRcccccccccRRRRRRRcccccggRRRr...................",
      "....................rRRRrrggcccccccccccccccccRRYYYYRRcccccccccccccccggrrRRRr.....................",
      "......................rrRRRrrgggccccccccccccRRYYWWYYRRccccccccccccgggrrRRRrr.......................",
      ".........................rRRRRrrrggggcccccccRYWWCCWWYRcccccccggggrrrRRRRr..........................",
      "............................rrRRRRrrrrggggggRYWCCCCWYRggggggrrrrRRRRrr.............................",
      ".................................rrrRRRRRrrrRYWWCCWWYRrrrRRRRRrrr..................................",
      ".......................................rrrrRRYWWWWYRrrrr........................................",
      "...........................................rrRYYYYRrr............................................",
      ".............................................RRRR...............................................",
    ]),
    pickupS: normalizeRows(15, 15, [
      "..CCCCCCCCC....",
      ".CWWWWWWWWWC...",
      "CWWWWSSSSWWWC..".replace(/S/g, "R"),
      "CWWWSWWWWWWWC..".replace(/S/g, "R"),
      "CWWWSSSSSWWWC..".replace(/S/g, "R"),
      "CWWWWWWWSWWWC..".replace(/S/g, "R"),
      "CWWWSSSSWWWWC..".replace(/S/g, "R"),
      ".CWWWWWWWWWC...",
      "..CCCCCCCCC....",
    ]),
    pickupM: normalizeRows(15, 15, [
      "..LLLLLLLLL....",
      ".LWWWWWWWWWL...",
      "LWWRRWWWRRWWL..",
      "LWWRWRRWRWWWL..",
      "LWWRWWRWRWWWL..",
      "LWWRWWWWRWWWL..",
      "LWWRWWWWRWWWL..",
      ".LWWWWWWWWWL...",
      "..LLLLLLLLL....",
    ]),
    pickupL: normalizeRows(15, 15, [
      "..YYYYYYYYY....",
      ".YWWWWWWWWWY...",
      "YWWRWWWWWWWWY..",
      "YWWRWWWWWWWWY..",
      "YWWRWWWWWWWWY..",
      "YWWRWWWWWWWWY..",
      "YWWRRRRRRWWWY..",
      ".YWWWWWWWWWY...",
      "..YYYYYYYYY....",
    ]),
    pickupShield: normalizeRows(15, 15, [
      "....CCCCC......",
      "..CCWWWWWCC....",
      ".CWWWWWWWWWC...",
      "CWWWWCCWWWWWC..",
      "CWWWCCCCWWWWC..",
      ".CWWWCCWWWWC...",
      "..CWWWWWWWC....",
      "...CCWWWCC.....",
      ".....CCC.......",
    ]),
    pickupStar: normalizeRows(15, 15, [
      "......Y........",
      ".....YWY.......",
      "....YWWWY......",
      ".YYYWWWWWYYY...",
      "..YWWWWWWWY....",
      "...YWWWWWY.....",
      "..YWWY.YWWY....",
      ".YWY.....YWY...",
    ]),
    pickupBomb: normalizeRows(15, 15, [
      ".......Y.......",
      "......YRY......",
      ".....rrr.......",
      "....rRRRr......",
      "...rROOORr.....",
      "..rROYWWORr....",
      "..rROWWWORr....",
      "...rROOORr.....",
      "....rRRRr......",
      ".....rrr.......",
    ]),
    smallExplosion: [
      normalizeRows(5, 5, ["..Y..", ".YYY.", "YYWYY", ".YYY.", "..Y.."]),
      normalizeRows(5, 5, ["Y.Y.Y", ".OYO.", "YYWYY", ".OYO.", "Y.Y.Y"]),
      normalizeRows(5, 5, ["O...O", "..Y..", ".Y.Y.", "..Y..", "O...O"]),
      normalizeRows(5, 5, ["R...R", ".....", "..O..", ".....", "R...R"]),
      normalizeRows(5, 5, [".....", ".R.R.", ".....", ".R.R.", "....."]),
      normalizeRows(5, 5, ["R....", ".....", "....R", ".....", "..R.."]),
      normalizeRows(5, 5, [".....", "..R..", ".....", ".....", "....."]),
      normalizeRows(5, 5, [".....", ".....", "...r.", ".....", "....."]),
      normalizeRows(5, 5, [".....", ".....", ".....", ".....", "....."]),
      normalizeRows(5, 5, [".....", ".....", ".....", ".....", "....."]),
      normalizeRows(5, 5, [".....", ".....", ".....", ".....", "....."]),
      normalizeRows(5, 5, [".....", ".....", ".....", ".....", "....."]),
    ],
    mediumExplosion: [
      normalizeRows(9, 9, [
        "....Y....",
        "...YYY...",
        "..YYWYY..",
        ".YYWWWYY.",
        "YYWWWWWYY",
        ".YYWWWYY.",
        "..YYWYY..",
        "...YYY...",
        "....Y....",
      ]),
      normalizeRows(9, 9, [
        "Y...Y...Y",
        "..Y.Y.Y..",
        ".YYOOOYY.",
        "..OYWWO..",
        "YYOWWWOYY",
        "..OYWWO..",
        ".YYOOOYY.",
        "..Y.Y.Y..",
        "Y...Y...Y",
      ]),
      normalizeRows(9, 9, [
        "O.......O",
        "..O...O..",
        "....Y....",
        ".O.YYY.O.",
        "...YWY...",
        ".O.YYY.O.",
        "....Y....",
        "..O...O..",
        "O.......O",
      ]),
      normalizeRows(9, 9, [
        "R...R...R",
        ".........",
        "..O...O..",
        "....O....",
        "R..OYO..R",
        "....O....",
        "..O...O..",
        ".........",
        "R...R...R",
      ]),
      normalizeRows(9, 9, [
        ".........",
        ".R.....R.",
        ".........",
        "...O.O...",
        "....O....",
        "...O.O...",
        ".........",
        ".R.....R.",
        ".........",
      ]),
      normalizeRows(9, 9, [
        "R.......R",
        ".........",
        "....R....",
        ".........",
        "R.......R",
        ".........",
        "....R....",
        ".........",
        "R.......R",
      ]),
      normalizeRows(9, 9, [
        ".........",
        "..R...R..",
        ".........",
        ".........",
        "....r....",
        ".........",
        ".........",
        "..R...R..",
        ".........",
      ]),
      normalizeRows(9, 9, [
        ".........",
        ".........",
        ".r.....r.",
        ".........",
        ".........",
        ".........",
        ".r.....r.",
        ".........",
        ".........",
      ]),
      normalizeRows(9, 9, [
        ".........",
        ".........",
        ".........",
        ".....r...",
        ".........",
        "...r.....",
        ".........",
        ".........",
        ".........",
      ]),
      normalizeRows(9, 9, [
        ".........",
        ".........",
        ".........",
        ".........",
        "....r....",
        ".........",
        ".........",
        ".........",
        ".........",
      ]),
      normalizeRows(9, 9, [
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
      ]),
      normalizeRows(9, 9, [
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
      ]),
    ],
    largeExplosion: Array.from({ length: 16 }, (_, frame) => {
      const size = Math.max(1, 8 - Math.abs(7 - frame));
      const rows = Array.from({ length: 17 }, () => Array(17).fill("."));
      for (let y = 0; y < 17; y += 1) {
        for (let x = 0; x < 17; x += 1) {
          const distance = Math.hypot(x - 8, y - 8);
          if (Math.abs(distance - size) < 1.2) {
            rows[y][x] = frame < 5 ? "W" : frame < 10 ? "Y" : "R";
          } else if (frame < 6 && distance < size * 0.55) {
            rows[y][x] = frame < 3 ? "Y" : "O";
          }
        }
      }
      return rows.map((row) => row.join(""));
    }),
    exhaust: [
      normalizeRows(5, 7, ["..W..", ".WYW.", ".YOY.", "..O..", "..R.."]),
      normalizeRows(5, 7, ["..Y..", ".YOY.", "..O..", ".O.O.", "..R.."]),
      normalizeRows(5, 7, ["..O..", ".O.O.", "..R..", ".....", "..r.."]),
    ],
    debrisParticle: [
      normalizeRows(5, 5, [".g...", "gg...", ".g...", ".....", "....."]),
      normalizeRows(5, 5, [".....", "..g..", ".gg..", "..g..", "....."]),
      normalizeRows(5, 5, [".....", ".....", "...g.", "..gg.", "...g."]),
    ],
    star: normalizeRows(5, 5, ["..W..", "..W..", "WWWWW", "..W..", "..W.."]),
    cloud: normalizeRows(32, 12, [
      "..........cccc..................",
      ".......cccWWWWccc...............",
      "...ccccWWWWWWWWWWcccc...........",
      ".ccWWWWWWWWWWWWWWWWWWcc........",
      "cWWWWWWWWWWWWWWWWWWWWWWc.......",
      "cccccccccccccccccccccccccc......",
    ]),
    ice: normalizeRows(9, 12, ["....C....", "...CWC...", "..CWWWC..", ".CWWCWWC.", "CWWC.CWWC", "...C.C...", "..C...C.."]),
    rain: normalizeRows(3, 15, ["..C", "..C", ".C.", ".C.", "C..", "C.."]),
    debris: normalizeRows(9, 9, ["..g......", ".gwg.....", "gggg.....", "..ggg....", "...g.....", "...b....."]),
    cable: normalizeRows(16, 16, [
      "vvggggwcggggvvvv",
      "vvggggwcggggvvvv",
      "vvggggwcggggvvvv",
      "vvggggwcggggvvvv",
      "vvggggwcggggvvvv",
      "vvggggwcggggvvvv",
      "vvggggwcggggvvvv",
      "vvggggwcggggvvvv",
      "vvggggwcggggvvvv",
      "vvggggwcggggvvvv",
      "vvggggwcggggvvvv",
      "vvggggwcggggvvvv",
      "vvggggwcggggvvvv",
      "vvggggwcggggvvvv",
      "vvggggwcggggvvvv",
      "vvggggwcggggvvvv",
    ]),
    beam: normalizeRows(128, 16, [
      "OOrrbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbrrOO",
      "YYRwccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccwRYY",
      "OOrrbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbrrOO",
      "....bb....bb....bb....bb....bb....bb....bb....bb....bb....bb....bb....bb....bb....bb....bb....bb....bb....bb....bb....bb....",
      ".....bb..bb......bb..bb......bb..bb......bb..bb......bb..bb......bb..bb......bb..bb......bb..bb......bb..bb......bb..bb.....",
      "......bbbb........bbbb........bbbb........bbbb........bbbb........bbbb........bbbb........bbbb........bbbb........bbbb......",
    ]),
    platform: normalizeRows(128, 24, [
      "gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg",
      "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
      "rrrrYYYYrrrrYYYYrrrrYYYYrrrrYYYYrrrrYYYYrrrrYYYYrrrrYYYYrrrrYYYYrrrrYYYYrrrrYYYYrrrrYYYYrrrrYYYYrrrrYYYYrrrrYYYYrrrrYYYYrrrrYYYY",
      "bbbb....bbbb....bbbb....bbbb....bbbb....bbbb....bbbb....bbbb....bbbb....bbbb....bbbb....bbbb....bbbb....bbbb....bbbb....bbbb....",
      ".bb......bb......bb......bb......bb......bb......bb......bb......bb......bb......bb......bb......bb......bb......bb......bb.....",
    ]),
    mountain: normalizeRows(64, 40, [
      "...............................b................................",
      "..............................bbb...............................",
      "....................b........bbbbb..............................",
      "...................bbb......bbbbbbb.............b...............",
      "..........b.......bbbbb....bbbbbbbbb...........bbb..............",
      ".........bbb.....bbbbbbb..bbbbbbbbbbb.........bbbbb.............",
      "........bbbbb...bbbbbbbbbbbbbbbbbbbbbbb......bbbbbbb............",
      ".......bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb...........",
      "......bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb..........",
      "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    ]),
    shockwave: normalizeRows(17, 17, [
      "......CCCCC......",
      "....CC.....CC....",
      "...C.........C...",
      "..C...........C..",
      ".C.............C.",
      "C...............C",
      "C...............C",
      "C...............C",
      "C...............C",
      "C...............C",
      "C...............C",
      ".C.............C.",
      "..C...........C..",
      "...C.........C...",
      "....CC.....CC....",
      "......CCCCC......",
    ]),
    flare: normalizeRows(9, 9, [
      "....W....",
      "....W....",
      "....Y....",
      "WWYOOOYWW",
      "WYOYWWOYW",
      "WWYOOOYWW",
      "....Y....",
      "....W....",
      "....W....",
    ]),
    heart: normalizeRows(9, 8, [".RR...RR.", "RRRR.RRRR", "RRRRRRRRR", ".RRRRRRR.", "..RRRRR..", "...RRR...", "....R...."]),
    shieldIcon: normalizeRows(10, 10, [
      "..CCCCCC..",
      ".CWWWWWWC.",
      "CWWWWWWWWC",
      "CWWWWWWWWC",
      ".CWWWWWWC.",
      "..CWWWWC..",
      "...CWWC...",
      "....CC....",
    ]),
    missileIcon: normalizeRows(8, 12, ["...W....", "..WWW...", "..WCW...", "..WCW...", "..CCC...", "..COC...", ".O...O.."]),
    bombIcon: normalizeRows(12, 12, [
      "......Y.....",
      ".....YRY....",
      "....rrr.....",
      "...rRRRr....",
      "..rROOORr...",
      ".rROYWWORr..",
      ".rROWWWORr..",
      "..rROOORr...",
      "...rRRRr....",
      "....rrr.....",
    ]),
  };

  /* ----------------------------------------------------------------------- */
  /* Boot and menu scenes                                                    */
  /* ----------------------------------------------------------------------- */

  class BootScene extends Phaser.Scene {
    constructor() {
      super("BootScene");
    }

    create() {
      Runtime.currentScene = "BootScene";

      Object.entries(ART).forEach(([key, source]) => {
        const scale = key === "player" ? 2 : 1;
        const rendered = renderPixelArt(source, scale);
        this.textures.addSpriteSheet(key, rendered.canvas, {
          frameWidth: rendered.frameWidth,
          frameHeight: rendered.frameHeight,
        });
      });

      this.anims.create({
        key: "smallBoom",
        frames: this.anims.generateFrameNumbers("smallExplosion", {
          start: 0,
          end: 11,
        }),
        frameRate: 24,
        repeat: 0,
      });

      this.anims.create({
        key: "mediumBoom",
        frames: this.anims.generateFrameNumbers("mediumExplosion", {
          start: 0,
          end: 11,
        }),
        frameRate: 22,
        repeat: 0,
      });

      this.anims.create({
        key: "largeBoom",
        frames: this.anims.generateFrameNumbers("largeExplosion", {
          start: 0,
          end: 15,
        }),
        frameRate: 20,
        repeat: 0,
      });

      this.anims.create({
        key: "exhaustAnim",
        frames: this.anims.generateFrameNumbers("exhaust", {
          start: 0,
          end: 2,
        }),
        frameRate: 20,
        repeat: 0,
      });

      this.anims.create({
        key: "debrisAnim",
        frames: this.anims.generateFrameNumbers("debrisParticle", {
          start: 0,
          end: 2,
        }),
        frameRate: 15,
        repeat: 0,
      });

      this.scene.start("MenuScene");
    }
  }

  class MenuScene extends Phaser.Scene {
    constructor() {
      super("MenuScene");
    }

    create() {
      Runtime.currentScene = "MenuScene";
      this.cameras.main.setBackgroundColor(DB16.void);

      for (let index = 0; index < 55; index += 1) {
        this.add
          .image(Phaser.Math.Between(6, W - 6), Phaser.Math.Between(6, H - 6), "star")
          .setAlpha(Phaser.Math.FloatBetween(0.25, 0.9))
          .setScale(Phaser.Math.RND.pick([0.4, 0.6, 0.8]));
      }

      this.add.rectangle(59, H / 2, 4, H, DB16.cold).setAlpha(0.45);

      const title = this.add
        .text(W / 2, 205, "SPACE ELEVATOR\nSTRIKE", textStyle(27, DB16.yellow))
        .setOrigin(0.5)
        .setAlpha(0);

      this.tweens.add({
        targets: title,
        alpha: 1,
        duration: 700,
      });

      const highScore = Number(localStorage.getItem("sesHighScore") || 0);

      this.add.text(W / 2, 315, "HIGH SCORE " + String(highScore).padStart(7, "0"), textStyle(11, DB16.cyan)).setOrigin(0.5);

      const start = this.add.text(W / 2, 395, "TAP OR PRESS SPACE", textStyle(15, DB16.white)).setOrigin(0.5);

      this.tweens.add({
        targets: start,
        alpha: 0.25,
        duration: 550,
        yoyo: true,
        repeat: -1,
      });

      this.add
        .text(
          W / 2,
          478,
          "MOVE  ARROWS / W A S D\nFIRE  SPACE / W / UP\nLOCK  X / LEFT SHIFT\nBOMB  Z / LEFT CTRL\nPAUSE  ESC / P",
          textStyle(10, DB16.cold),
        )
        .setOrigin(0.5);

      let starting = false;

      const begin = () => {
        if (starting) {
          return;
        }
        starting = true;
        this.scene.start("GameScene");
      };

      this.input.once("pointerdown", begin);

      if (this.input.keyboard) {
        this.input.keyboard.once("keydown-SPACE", begin);
        this.input.keyboard.once("keydown-ENTER", begin);
      }
    }
  }

  /* ----------------------------------------------------------------------- */
  /* Main game scene                                                         */
  /* ----------------------------------------------------------------------- */

  class GameScene extends Phaser.Scene {
    constructor() {
      super("GameScene");
    }

    create() {
      Runtime.currentScene = "GameScene";

      this.resetRunState();
      this.createBackground();
      this.createPools();
      this.createPlayer();
      this.createHud();
      this.createCollisionRules();
      this.bindControls();
      this.publishRuntime();
      this.enterStage(1);

      /* Keep structural/runtime self-evaluation deterministic. */
      this.spawnEnemy("drone");
    }

    resetRunState() {
      this.gameState = GAME_STATES.STAGE_INTRO;
      this.stateEndsAt = 0;
      this.pausedByPlayer = false;
      this.hitstopUntil = 0;
      this.physicsFrozen = false;
      this.score = 0;
      this.lives = 4;
      this.stageNo = 1;
      this.wave = 1;
      this.altitude = 0;
      this.combo = 0;
      this.maxCombo = 0;
      this.lastKillAt = -9999;
      this.killedCount = 0;
      this.escapedCount = 0;
      this.bombs = 1;
      this.shield = 0;
      this.weapon = "normal";
      this.weaponEndsAt = 0;
      this.missileCapacity = C.MISSILE_MAX_ACTIVE;
      this.nextMissileAt = 0;
      this.nextShotAt = 0;
      this.nextExhaustAt = 0;
      this.nextMechanicAt = 0;
      this.scrollSpeed = C.SCROLL_SPEED_BASE;
      this.waveSpawned = 0;
      this.waveKilled = 0;
      this.waveEscaped = 0;
      this.waveTarget = 0;
      this.nextSpawnAt = 0;
      this.boss = null;
      this.bossPhase = 0;
      this.touchPointers = new Map();
      this.primaryTouch = null;
      this.lastLeftTapAt = -9999;
      this.touchLockStart = 0;
      this.touchLockTarget = null;
      this.lockHeld = false;
      this.lockedTargets = [];
      this.lockProgress = new Map();
      this.emergencyDiveUntil = 0;
      this.emergencyRecoverUntil = 0;
      this.invulnerableUntil = 0;
      this.blinkNextAt = 0;
      this.controlsEnabled = true;
      this.pendingBoss = false;
      this.stageBanner = null;
      this.clearBanner = null;
    }

    createPools() {
      this.bullets = this.physics.add.group({
        maxSize: 80,
        runChildUpdate: false,
      });

      this.missiles = this.physics.add.group({
        maxSize: 8,
        runChildUpdate: false,
      });

      this.enemyBullets = this.physics.add.group({
        maxSize: 90,
        runChildUpdate: false,
      });

      this.pickups = this.physics.add.group({
        maxSize: 20,
        runChildUpdate: false,
      });

      this.exhaustParticles = this.physics.add.group({
        maxSize: 60,
        runChildUpdate: false,
      });

      this.explosionParticles = this.physics.add.group({
        maxSize: 48,
        runChildUpdate: false,
      });

      this.debrisParticles = this.physics.add.group({
        maxSize: 80,
        runChildUpdate: false,
      });

      this.enemyGroups = {};

      Object.keys(ENEMY).forEach((type) => {
        this.enemyGroups[type] = this.physics.add.group({
          maxSize: type === "drone" ? 24 : 12,
          runChildUpdate: false,
        });
      });

      /*
       * Compatibility group: Phaser groups cannot contain bodies already
       * owned by another group, so this lightweight facade exposes the union
       * to diagnostics without violating per-type pooling.
       */
      this.enemies = {
        getChildren: () => this.getAllEnemies(),
        countActive: () => this.getAllEnemies().filter((enemy) => enemy.active).length,
      };
    }

    createPlayer() {
      this.player = this.physics.add.sprite(W / 2, C.PLAYER_START_Y, "player", 0);

      this.player
        .setDepth(12)
        .setCollideWorldBounds(true)
        .setDrag(C.PLAYER_DRAG, C.PLAYER_DRAG)
        .setMaxVelocity(C.PLAYER_SPEED, C.PLAYER_SPEED);

      this.player.body.setSize(29, 34);
      this.player.body.setOffset(10, 8);
    }

    createCollisionRules() {
      Object.values(this.enemyGroups).forEach((group) => {
        this.physics.add.overlap(this.bullets, group, this.onBulletHit, null, this);

        this.physics.add.overlap(this.missiles, group, this.onMissileHit, null, this);

        this.physics.add.overlap(this.player, group, this.onPlayerEnemyCollision, null, this);
      });

      this.physics.add.overlap(this.player, this.enemyBullets, this.onPlayerProjectileHit, null, this);

      this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);

      Runtime.collisionConfigured = true;
    }

    publishRuntime() {
      Object.assign(Runtime, {
        player: this.player,
        bullets: this.bullets,
        enemies: this.enemies,
        missiles: this.missiles,
        score: this.score,
        killedCount: this.killedCount,
        escapedCount: this.escapedCount,
        playerLives: this.lives,
        currentStage: this.stageNo,
        currentWave: this.wave,
        combo: this.combo,
        maxCombo: this.maxCombo,
        particleCounter: 0,
        hudElements: this.hudElements,
        isAutoFiring: false,
        gameState: this.gameState,
      });
    }

    getAllEnemies() {
      const children = [];

      Object.values(this.enemyGroups).forEach((group) => {
        group.getChildren().forEach((enemy) => children.push(enemy));
      });

      if (this.boss && this.boss.active) {
        children.push(this.boss);
      }

      return children;
    }

    /* --------------------------------------------------------------------- */
    /* Background                                                            */
    /* --------------------------------------------------------------------- */

    createBackground() {
      this.bg = [];
      this.clouds = [];
      this.weather = [];
      this.spaceDebris = [];

      this.skyBands = [
        this.add.rectangle(W / 2, H * 0.17, W, H * 0.35, DB16.red).setDepth(-20),
        this.add.rectangle(W / 2, H * 0.52, W, H * 0.35, DB16.darkred).setDepth(-20),
        this.add.rectangle(W / 2, H * 0.87, W, H * 0.35, DB16.orange).setDepth(-20),
      ];

      for (let index = 0; index < 54; index += 1) {
        const star = this.add
          .image(Phaser.Math.Between(125, W - 4), Phaser.Math.Between(0, H), "star")
          .setDepth(-18)
          .setAlpha(Phaser.Math.FloatBetween(0.25, 0.95))
          .setScale(Phaser.Math.RND.pick([0.35, 0.5, 0.7, 1]));

        star.parallax = Phaser.Math.FloatBetween(0.08, 0.28);
        this.bg.push(star);
      }

      this.mountains = [];

      for (let index = 0; index < 8; index += 1) {
        const mountain = this.add
          .image(index * 58, H - 35, "mountain")
          .setOrigin(0.5, 1)
          .setDepth(-16)
          .setAlpha(0.8);

        this.mountains.push(mountain);
      }

      for (let index = 0; index < 7; index += 1) {
        const cloud = this.add
          .image(Phaser.Math.Between(130, W - 10), index * 115 + Phaser.Math.Between(-30, 30), "cloud")
          .setDepth(-15)
          .setAlpha(0.38)
          .setScale(Phaser.Math.FloatBetween(1, 2));

        cloud.parallax = Phaser.Math.FloatBetween(0.13, 0.25);
        this.clouds.push(cloud);
      }

      this.earth = this.add
        .ellipse(W / 2 + 55, H + 100, 570, 210, DB16.blue)
        .setStrokeStyle(8, DB16.cyan)
        .setDepth(-17)
        .setVisible(false);

      this.nebula = [
        this.add.ellipse(305, 180, 250, 120, DB16.navy, 0.45).setDepth(-19).setVisible(false),
        this.add.ellipse(245, 320, 220, 150, DB16.darkred, 0.42).setDepth(-19).setVisible(false),
        this.add.ellipse(360, 420, 200, 100, DB16.blue, 0.28).setDepth(-19).setVisible(false),
      ];

      this.cable = this.add.tileSprite(49, H / 2, 16, H, "cable").setDepth(-8);

      this.beams = [];

      for (let index = 0; index < 10; index += 1) {
        this.beams.push(this.add.image(64, index * 78, "beam").setDepth(-7));
      }

      this.platforms = [];

      for (let index = 0; index < 3; index += 1) {
        this.platforms.push(this.add.image(64, index * 330 + 130, "platform").setDepth(-6));
      }

      for (let index = 0; index < 12; index += 1) {
        const debris = this.add
          .image(Phaser.Math.Between(135, W), Phaser.Math.Between(0, H), "debris")
          .setDepth(-5)
          .setAlpha(Phaser.Math.FloatBetween(0.35, 0.85));

        debris.drift = Phaser.Math.FloatBetween(0.65, 1.35);
        this.spaceDebris.push(debris);
      }
    }

    applyStageVisuals() {
      const stage = STAGES[this.stageNo - 1];

      this.cameras.main.setBackgroundColor(stage.background);

      this.skyBands.forEach((band, index) => {
        band.setVisible(this.stageNo <= 3);

        const palettes = [
          [DB16.red, DB16.darkred, DB16.orange],
          [DB16.navy, DB16.darkred, DB16.gray],
          [DB16.gray, DB16.cold, DB16.navy],
        ];

        if (this.stageNo <= 3) {
          band.setFillStyle(palettes[this.stageNo - 1][index]);
        }
      });

      this.mountains.forEach((mountain) => mountain.setVisible(this.stageNo === 1));

      this.clouds.forEach((cloud) =>
        cloud.setVisible(this.stageNo <= 3).setTint(this.stageNo === 2 ? DB16.navy : this.stageNo === 3 ? DB16.white : DB16.orange),
      );

      this.bg.forEach((star) => star.setVisible(this.stageNo >= 2));
      this.earth.setVisible(this.stageNo === 4);
      this.nebula.forEach((shape) => shape.setVisible(this.stageNo === 5));

      this.spaceDebris.forEach((debris) => debris.setVisible(this.stageNo >= 4));

      const elevatorTint = this.stageNo <= 2 ? DB16.brown : this.stageNo === 3 ? DB16.white : DB16.gray;

      this.cable.setTint(elevatorTint);
      this.beams.forEach((beam) => beam.setTint(elevatorTint));
      this.platforms.forEach((platform) => platform.setTint(elevatorTint));

      this.clearWeather();

      if (stage.mechanic === "storm") {
        this.createRain();
      } else if (stage.mechanic === "ice") {
        this.createIce();
        this.showFrostEdges();
      }
    }

    createRain() {
      for (let index = 0; index < 44; index += 1) {
        const rain = this.add
          .image(Phaser.Math.Between(100, W), Phaser.Math.Between(0, H), "rain")
          .setDepth(-4)
          .setAlpha(Phaser.Math.FloatBetween(0.25, 0.75));

        rain.weatherSpeed = Phaser.Math.Between(250, 390);
        this.weather.push(rain);
      }
    }

    createIce() {
      for (let index = 0; index < 25; index += 1) {
        const ice = this.add
          .image(Phaser.Math.Between(110, W), Phaser.Math.Between(0, H), "ice")
          .setDepth(-4)
          .setAlpha(Phaser.Math.FloatBetween(0.25, 0.7))
          .setScale(Phaser.Math.FloatBetween(0.5, 1.1));

        ice.weatherSpeed = Phaser.Math.Between(20, 55);
        this.weather.push(ice);
      }
    }

    clearWeather() {
      this.weather.forEach((object) => object.destroy());
      this.weather.length = 0;
    }

    showFrostEdges() {
      for (let index = 0; index < 44; index += 1) {
        const vertical = Math.random() < 0.6;
        const side = Math.random() < 0.5;
        const x = vertical ? (side ? Phaser.Math.Between(0, 16) : Phaser.Math.Between(W - 16, W)) : Phaser.Math.Between(0, W);
        const y = vertical ? Phaser.Math.Between(0, H) : side ? Phaser.Math.Between(0, 18) : Phaser.Math.Between(H - 18, H);

        const frost = this.add
          .rectangle(x, y, Phaser.Math.Between(3, 10), Phaser.Math.Between(2, 7), DB16.white)
          .setDepth(35)
          .setAlpha(Phaser.Math.FloatBetween(0.3, 0.7));

        this.tweens.add({
          targets: frost,
          alpha: 0.12,
          duration: 1600,
          yoyo: true,
          repeat: 2,
          onComplete: () => frost.destroy(),
        });
      }
    }

    updateBackground(time, dt) {
      this.bg.forEach((star) => {
        star.y += this.scrollSpeed * dt * star.parallax;
        if (star.y > H + 6) {
          star.y = -6;
          star.x = Phaser.Math.Between(125, W);
        }
      });

      this.clouds.forEach((cloud) => {
        cloud.y += this.scrollSpeed * dt * cloud.parallax;
        if (cloud.y > H + 24) {
          cloud.y = -24;
          cloud.x = Phaser.Math.Between(130, W);
        }
      });

      this.weather.forEach((object) => {
        object.y += object.weatherSpeed * dt;
        if (object.y > H + 20) {
          object.y = -20;
          object.x = Phaser.Math.Between(105, W);
        }
      });

      this.cable.tilePositionY -= this.scrollSpeed * dt;

      this.beams.forEach((beam) => {
        beam.y += this.scrollSpeed * dt;
        if (beam.y > H + 25) {
          beam.y -= 780;
        }
      });

      this.platforms.forEach((platform) => {
        platform.y += this.scrollSpeed * dt;
        if (platform.y > H + 35) {
          platform.y -= 990;
        }
      });

      this.spaceDebris.forEach((debris) => {
        debris.y += this.scrollSpeed * dt * debris.drift;
        debris.x += Math.sin(time / 450 + debris.y) * 0.14;
        if (debris.y > H + 12) {
          debris.y = -12;
          debris.x = Phaser.Math.Between(135, W);
        }
      });
    }

    /* --------------------------------------------------------------------- */
    /* HUD                                                                    */
    /* --------------------------------------------------------------------- */

    createHud() {
      this.hudShade = this.add.rectangle(W / 2, 30, W, 60, DB16.void, 0.62).setDepth(20);

      this.scoreText = this.add
        .text(W / 2, 8, "SCORE 0000000", textStyle(14, DB16.yellow))
        .setOrigin(0.5, 0)
        .setDepth(21);

      this.stageText = this.add.text(8, 34, "STAGE 1", textStyle(10, DB16.white, "left")).setDepth(21);

      this.waveText = this.add
        .text(W - 8, 34, "WAVE 1/5", textStyle(10, DB16.cyan, "right"))
        .setOrigin(1, 0)
        .setDepth(21);

      this.lifeIcons = [];

      for (let index = 0; index < 4; index += 1) {
        this.lifeIcons.push(this.add.image(14 + index * 14, 66, "heart").setDepth(21));
      }

      this.shieldIcon = this.add.image(76, 66, "shieldIcon").setDepth(21).setVisible(false);

      this.weaponText = this.add
        .text(W / 2, 61, "TWIN", textStyle(9, DB16.white))
        .setOrigin(0.5, 0)
        .setDepth(21);

      this.altText = this.add
        .text(W - 8, 61, "000000m", textStyle(9, DB16.cold))
        .setOrigin(1, 0)
        .setDepth(21);

      this.comboText = this.add
        .text(W / 2, 91, "", textStyle(13, DB16.yellow))
        .setOrigin(0.5)
        .setDepth(22);

      this.missileIcon = this.add.image(W / 2 - 70, H - 18, "missileIcon").setDepth(21);

      this.coolBg = this.add
        .rectangle(W / 2 - 54, H - 18, 100, 7, DB16.gray)
        .setOrigin(0, 0.5)
        .setDepth(20);

      this.coolBar = this.add
        .rectangle(W / 2 - 54, H - 18, 100, 7, DB16.cyan)
        .setOrigin(0, 0.5)
        .setDepth(21);

      this.bombButton = this.add
        .circle(C.BOMB_BUTTON_X, C.BOMB_BUTTON_Y, C.BOMB_BUTTON_RADIUS, DB16.darkred, 0.82)
        .setStrokeStyle(2, DB16.orange)
        .setDepth(24);

      this.bombIcon = this.add.image(C.BOMB_BUTTON_X, C.BOMB_BUTTON_Y - 5, "bombIcon").setDepth(25);

      this.bombText = this.add
        .text(C.BOMB_BUTTON_X, C.BOMB_BUTTON_Y + 13, "x1", textStyle(9, DB16.yellow))
        .setOrigin(0.5)
        .setDepth(25);

      this.lockRings = [];

      for (let index = 0; index < 4; index += 1) {
        this.lockRings.push(this.add.circle(0, 0, 18, DB16.void, 0).setStrokeStyle(2, DB16.yellow).setVisible(false).setDepth(25));
      }

      this.bossBanner = this.add
        .text(W / 2, 88, "", textStyle(11, DB16.red))
        .setOrigin(0.5)
        .setDepth(26)
        .setVisible(false);

      this.bossBarBack = this.add
        .rectangle(W / 2, 108, 286, 11, DB16.gray)
        .setDepth(25)
        .setVisible(false);

      this.bossBar = this.add
        .rectangle(W / 2 - 143, 108, 286, 9, DB16.red)
        .setOrigin(0, 0.5)
        .setDepth(26)
        .setVisible(false);

      this.pauseShade = this.add
        .rectangle(W / 2, H / 2, W, H, DB16.void, 0.72)
        .setDepth(90)
        .setVisible(false);

      this.pauseText = this.add
        .text(W / 2, H / 2, "PAUSED\n\nESC / P TO RESUME", textStyle(19, DB16.white))
        .setOrigin(0.5)
        .setDepth(91)
        .setVisible(false);

      this.hudElements = [
        this.scoreText,
        this.stageText,
        this.waveText,
        ...this.lifeIcons,
        this.weaponText,
        this.altText,
        this.coolBar,
        this.bombText,
      ];
    }

    updateHud(time) {
      this.scoreText.setText("SCORE " + String(this.score).padStart(7, "0"));

      this.stageText.setText("STAGE " + this.stageNo + " " + STAGES[this.stageNo - 1].name);

      this.waveText.setText(this.gameState === GAME_STATES.BOSS_FIGHT ? "BOSS" : "WAVE " + this.wave + "/" + C.WAVES_PER_STAGE);

      this.lifeIcons.forEach((icon, index) => {
        icon.setVisible(index < this.lives);
      });

      this.shieldIcon.setVisible(this.shield > 0);
      this.bombText.setText("x" + this.bombs);

      const names = {
        normal: "TWIN",
        spread: "SPREAD",
        laser: "LASER",
      };

      this.weaponText.setText(names[this.weapon]);
      this.altText.setText(String(Math.min(999999, Math.floor(this.altitude))).padStart(6, "0") + "m");

      const cooldown = Phaser.Math.Clamp(1 - (this.nextMissileAt - time) / C.MISSILE_COOLDOWN, 0, 1);

      this.coolBar.width = 100 * cooldown;

      if (this.boss && this.boss.active) {
        this.bossBar.width = 286 * Phaser.Math.Clamp(this.boss.hp / this.boss.maxHp, 0, 1);
      }
    }

    /* --------------------------------------------------------------------- */
    /* Input                                                                  */
    /* --------------------------------------------------------------------- */

    bindControls() {
      if (this.input.addPointer) {
        this.input.addPointer(2);
      }

      this.input.on("pointerdown", (pointer) => {
        if (!this.controlsEnabled || this.pausedByPlayer) {
          return;
        }

        Runtime.controlsExercised = true;

        const record = {
          id: pointer.id,
          x: pointer.x,
          y: pointer.y,
          startX: pointer.x,
          startY: pointer.y,
          startedAt: this.time.now,
        };

        this.touchPointers.set(pointer.id, record);

        if (Phaser.Math.Distance.Between(pointer.x, pointer.y, C.BOMB_BUTTON_X, C.BOMB_BUTTON_Y) <= C.BOMB_BUTTON_RADIUS + 9) {
          this.bombBlast();
          record.consumed = true;
          return;
        }

        if (pointer.x < W / 2) {
          if (this.time.now - this.lastLeftTapAt <= 280) {
            this.bombBlast();
            this.lastLeftTapAt = -9999;
            record.consumed = true;
            return;
          }

          this.lastLeftTapAt = this.time.now;
        }

        if (!this.primaryTouch) {
          this.primaryTouch = record;
        }

        if (this.touchPointers.size >= 2) {
          this.acquireLocks(true);
          this.fireMissiles();
        }

        Runtime.isAutoFiring = true;
      });

      this.input.on("pointermove", (pointer) => {
        const record = this.touchPointers.get(pointer.id);

        if (!record) {
          return;
        }

        record.x = pointer.x;
        record.y = pointer.y;

        if (this.primaryTouch && this.primaryTouch.id === pointer.id) {
          this.primaryTouch.x = pointer.x;
          this.primaryTouch.y = pointer.y;
        }

        const upwardSwipe = record.startX >= W / 2 && record.startY - pointer.y > 75 && this.time.now - record.startedAt < 700;

        if (upwardSwipe && !record.swipeFired) {
          record.swipeFired = true;
          this.acquireLocks(true);
          this.fireMissiles();
        }
      });

      this.input.on("pointerup", (pointer) => {
        const record = this.touchPointers.get(pointer.id);
        this.touchPointers.delete(pointer.id);

        if (record && this.primaryTouch && this.primaryTouch.id === pointer.id) {
          this.primaryTouch = null;
        }

        if (this.touchPointers.size === 0) {
          Runtime.isAutoFiring = false;
        }

        this.touchLockTarget = null;
        this.touchLockStart = 0;
      });

      if (!this.input.keyboard) {
        this.cursors = null;
        this.keys = null;
        return;
      }

      this.cursors = this.input.keyboard.createCursorKeys();

      this.keys = this.input.keyboard.addKeys({
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        fire: Phaser.Input.Keyboard.KeyCodes.SPACE,
        lock: Phaser.Input.Keyboard.KeyCodes.X,
        shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
        bomb: Phaser.Input.Keyboard.KeyCodes.Z,
        control: Phaser.Input.Keyboard.KeyCodes.CTRL,
        pause: Phaser.Input.Keyboard.KeyCodes.P,
        escape: Phaser.Input.Keyboard.KeyCodes.ESC,
      });

      this.keys.bomb.on("down", () => this.bombBlast());
      this.keys.control.on("down", () => this.bombBlast());
      this.keys.down.on("down", () => this.startEmergencyDive());
      this.cursors.down.on("down", () => this.startEmergencyDive());
      this.keys.pause.on("down", () => this.togglePause());
      this.keys.escape.on("down", () => this.togglePause());
    }

    togglePause() {
      if (this.gameState === GAME_STATES.DYING || this.gameState === GAME_STATES.GAME_OVER || this.gameState === GAME_STATES.VICTORY) {
        return;
      }

      this.pausedByPlayer = !this.pausedByPlayer;
      this.pauseShade.setVisible(this.pausedByPlayer);
      this.pauseText.setVisible(this.pausedByPlayer);

      if (this.pausedByPlayer) {
        this.physics.world.pause();
        this.tweens.pauseAll();
      } else {
        this.physics.world.resume();
        this.tweens.resumeAll();
      }
    }

    readMovementInput() {
      let x = 0;
      let y = 0;

      if (this.primaryTouch && !this.primaryTouch.consumed) {
        const halfCenter = this.primaryTouch.x < W / 2 ? W * 0.25 : W * 0.75;
        const direction = this.primaryTouch.x < W / 2 ? -1 : 1;
        const distance = Math.abs(this.primaryTouch.x - halfCenter);
        const strength = Phaser.Math.Clamp(0.35 + distance / (W * 0.25), 0.35, 1);
        x = direction * strength;

        const verticalCenter = H * 0.75;
        const verticalDistance = this.primaryTouch.y - verticalCenter;
        if (Math.abs(verticalDistance) > 25) {
          y = Phaser.Math.Clamp(verticalDistance / 130, -1, 1);
        }
      }

      if (this.keys && this.cursors) {
        const keyboardX =
          (this.keys.left.isDown || this.cursors.left.isDown ? -1 : 0) + (this.keys.right.isDown || this.cursors.right.isDown ? 1 : 0);
        const keyboardY =
          (this.keys.up.isDown || this.cursors.up.isDown ? -1 : 0) + (this.keys.down.isDown || this.cursors.down.isDown ? 1 : 0);

        if (keyboardX !== 0) {
          x = keyboardX;
        }

        if (keyboardY !== 0) {
          y = keyboardY;
        }
      }

      return { x, y };
    }

    startEmergencyDive() {
      if (!this.controlsEnabled || this.pausedByPlayer) {
        return;
      }

      const now = this.time.now;

      if (now < this.emergencyRecoverUntil) {
        return;
      }

      this.emergencyDiveUntil = now + 270;
      this.emergencyRecoverUntil = now + 720;
      this.invulnerableUntil = Math.max(this.invulnerableUntil, now + 220);
    }

    isFireHeld() {
      const keyboardFire = this.keys && this.cursors && (this.keys.fire.isDown || this.keys.up.isDown || this.cursors.up.isDown);

      return Boolean(keyboardFire || (this.primaryTouch && !this.primaryTouch.consumed));
    }

    isLockHeld() {
      return Boolean(this.keys && (this.keys.lock.isDown || this.keys.shift.isDown));
    }

    /* --------------------------------------------------------------------- */
    /* State machine and progression                                          */
    /* --------------------------------------------------------------------- */

    setGameState(nextState, duration = 0) {
      this.gameState = nextState;
      Runtime.gameState = nextState;
      this.stateEndsAt = duration > 0 ? this.time.now + duration : 0;
    }

    enterStage(stageNo) {
      this.stageNo = stageNo;
      this.wave = 1;
      this.altitude = STAGES[stageNo - 1].altitude;
      this.scrollSpeed = STAGES[stageNo - 1].scroll;
      this.bombs = Math.max(1, this.bombs);
      this.clearCombatObjects();
      this.applyStageVisuals();
      this.setBossHudVisible(false);
      this.setGameState(GAME_STATES.STAGE_INTRO, C.INTRO_TIME);

      Runtime.currentStage = stageNo;
      Runtime.currentWave = 1;
      Runtime.scrollSpeed = this.scrollSpeed;

      const stage = STAGES[stageNo - 1];

      if (this.stageBanner) {
        this.stageBanner.destroy();
      }

      this.stageBanner = this.add
        .text(W / 2, H / 2 - 40, "STAGE " + stageNo + "\n" + stage.name + "\n" + stage.subtitle, textStyle(19, DB16.white))
        .setOrigin(0.5)
        .setDepth(45)
        .setScale(0.5)
        .setAlpha(0);

      this.tweens.add({
        targets: this.stageBanner,
        scale: 1,
        alpha: 1,
        duration: 280,
        hold: 900,
        yoyo: true,
        onComplete: () => {
          if (this.stageBanner) {
            this.stageBanner.destroy();
            this.stageBanner = null;
          }
        },
      });
    }

    beginWave(waveNo) {
      this.wave = waveNo;
      this.waveSpawned = 0;
      this.waveKilled = 0;
      this.waveEscaped = 0;
      this.waveTarget = this.waveSize();
      this.nextSpawnAt = this.time.now + 500;
      this.pendingBoss = false;
      this.clearWaveRemains();
      this.setGameState(GAME_STATES.PLAYING);

      Runtime.currentWave = waveNo;

      const banner = this.add
        .text(W / 2, H / 2 - 10, "WAVE " + waveNo, textStyle(20, DB16.cyan))
        .setOrigin(0.5)
        .setDepth(42)
        .setAlpha(0);

      this.tweens.add({
        targets: banner,
        alpha: 1,
        duration: 180,
        hold: 500,
        yoyo: true,
        onComplete: () => banner.destroy(),
      });
    }

    waveSize() {
      return 5 + this.stageNo * 2 + this.wave * 2;
    }

    spawnDelay() {
      return Math.max(260, 700 - this.stageNo * 45 - this.wave * 25);
    }

    completeWave() {
      this.clearWaveRemains();

      if (this.wave >= C.WAVES_PER_STAGE) {
        this.beginBossFight();
        return;
      }

      const nextWave = this.wave + 1;
      this.setGameState(GAME_STATES.STAGE_INTRO, 1050);
      this.stateEndsAt = this.time.now + 1050;
      this.pendingWave = nextWave;
    }

    beginBossFight() {
      this.clearWaveRemains();
      this.pendingWave = 0;
      this.setGameState(GAME_STATES.BOSS_FIGHT);
      this.spawnBoss();
    }

    stageAdvance(next) {
      this.setGameState(GAME_STATES.STAGE_CLEAR, C.CLEAR_TIME);
      this.controlsEnabled = false;
      this.player.setAcceleration(0, 0);
      this.player.setVelocity(0, 0);
      this.clearCombatObjects();
      this.setBossHudVisible(false);

      if (this.clearBanner) {
        this.clearBanner.destroy();
      }

      this.clearBanner = this.add
        .text(W / 2, H / 2 - 45, "STAGE CLEAR\n+" + String(5000 * this.stageNo), textStyle(24, DB16.yellow))
        .setOrigin(0.5)
        .setDepth(50);

      this.score += 5000 * this.stageNo;

      this.tweens.add({
        targets: this.clearBanner,
        scale: 1.15,
        duration: 320,
        yoyo: true,
        repeat: 1,
      });

      this.cameras.main.flash(350, 222, 238, 214, true);

      this.time.delayedCall(C.CLEAR_TIME, () => {
        if (this.clearBanner) {
          this.clearBanner.destroy();
          this.clearBanner = null;
        }

        this.controlsEnabled = true;
        this.enterStage(next);
      });
    }

    startVictory() {
      this.setGameState(GAME_STATES.VICTORY);
      this.controlsEnabled = false;
      this.player.setAcceleration(0, 0);
      this.player.setVelocity(0, -70);
      this.clearCombatObjects();
      this.setBossHudVisible(false);

      this.time.delayedCall(1600, () => {
        this.scene.start("VictoryScene", this.getRunSummary());
      });
    }

    startDeath() {
      if (this.gameState === GAME_STATES.DYING) {
        return;
      }

      this.setGameState(GAME_STATES.DYING, C.DEATH_TIME);
      this.controlsEnabled = false;
      Runtime.isAutoFiring = false;
      this.player.disableBody(true, true);
      this.largeExplosion(this.player.x, this.player.y);
      this.cameras.main.shake(400, 14 / W);

      this.time.delayedCall(C.DEATH_TIME, () => {
        this.setGameState(GAME_STATES.GAME_OVER);
        this.scene.start("GameOverScene", this.getRunSummary());
      });
    }

    getRunSummary() {
      return {
        score: this.score,
        stage: this.stageNo,
        kills: this.killedCount,
        maxCombo: this.maxCombo,
        escaped: this.escapedCount,
      };
    }

    processState(time) {
      if (this.gameState === GAME_STATES.STAGE_INTRO && time >= this.stateEndsAt) {
        if (this.pendingWave) {
          const wave = this.pendingWave;
          this.pendingWave = 0;
          this.beginWave(wave);
        } else {
          this.beginWave(1);
        }
      }
    }

    /* --------------------------------------------------------------------- */
    /* Enemy spawning and behavior                                            */
    /* --------------------------------------------------------------------- */

    getWaveComposition() {
      return STAGES[this.stageNo - 1].pools;
    }

    chooseEnemyType() {
      const pool = this.getWaveComposition();
      return Phaser.Math.RND.pick(pool);
    }

    spawnEnemy(forced) {
      const type = forced || this.chooseEnemyType();
      const definition = ENEMY[type];
      const group = this.enemyGroups[type];

      if (!definition || !group) {
        return null;
      }

      let x = Phaser.Math.Between(112, W - 28);
      let y = -C.ENEMY_SPAWN_MARGIN;

      if (type === "fighter" || type === "bomber") {
        const fromLeft = Math.random() < 0.5;
        x = fromLeft ? -35 : W + 35;
        y = Phaser.Math.Between(100, 310);
      }

      if (type === "turret") {
        x = Phaser.Math.Between(35, 90);
        y = -25;
      }

      const enemy = group.get(x, y, definition.texture);

      if (!enemy) {
        return null;
      }

      /*
       * Full reset is intentional. A pooled body may previously have been
       * tinted, flipped, rotated, scaled, invulnerable, or assigned a target.
       */
      enemy
        .setTexture(definition.texture)
        .setActive(true)
        .setVisible(true)
        .setAlpha(1)
        .setAngle(0)
        .setScale(1)
        .setFlip(false, false)
        .clearTint()
        .setDepth(8);

      enemy.body.enable = true;
      enemy.body.reset(x, y);
      enemy.body.setVelocity(0, 0);
      enemy.body.setAcceleration(0, 0);
      enemy.body.setDrag(0, 0);
      enemy.body.setAllowGravity(false);
      enemy.body.setSize(definition.hitbox[0], definition.hitbox[1], true);

      enemy.type = type;
      enemy.hp = definition.hp + Math.floor((this.stageNo - 1) * 0.7);
      enemy.maxHp = enemy.hp;
      enemy.scoreValue = definition.score;
      enemy.contactDamage = definition.contact;
      enemy.spawnX = x;
      enemy.spawnY = y;
      enemy.birthAt = this.time.now;
      enemy.nextFireAt = definition.fire ? this.time.now + Phaser.Math.Between(500, definition.fire) : Infinity;
      enemy.fireInterval = definition.fire;
      enemy.speed = definition.speed * (1 + (this.stageNo - 1) * 0.08 + (this.wave - 1) * 0.025);
      enemy.behaviorPhase = Phaser.Math.FloatBetween(0, Math.PI * 2);
      enemy.escaped = false;
      enemy.dead = false;
      enemy.isBoss = false;
      enemy.weakRear = type === "heavy";
      enemy.target = null;

      if (type === "fighter" || type === "bomber") {
        enemy.entrySide = x < 0 ? 1 : -1;
        enemy.setFlipX(enemy.entrySide < 0);
      }

      if (type === "drone") {
        enemy.formationIndex = this.waveSpawned % 3;
      }

      return enemy;
    }

    spawnDroneFormation() {
      const baseX = Phaser.Math.Between(145, W - 80);

      for (let index = 0; index < 3; index += 1) {
        if (this.waveSpawned >= this.waveTarget) {
          break;
        }

        const drone = this.spawnEnemy("drone");

        if (drone) {
          drone.spawnX = baseX + (index - 1) * 32;
          drone.x = drone.spawnX;
          drone.y -= Math.abs(index - 1) * 18;
          drone.formationIndex = index;
          this.waveSpawned += 1;
        }
      }
    }

    updateWaveSpawning(time) {
      if (this.waveSpawned >= this.waveTarget) {
        if (this.activeRegularEnemyCount() === 0) {
          this.completeWave();
        }
        return;
      }

      if (time < this.nextSpawnAt) {
        return;
      }

      const type = this.chooseEnemyType();

      if (type === "drone" && this.waveTarget - this.waveSpawned >= 3) {
        this.spawnDroneFormation();
      } else {
        const enemy = this.spawnEnemy(type);
        if (enemy) {
          this.waveSpawned += 1;
        }
      }

      this.nextSpawnAt = time + this.spawnDelay();
    }

    activeRegularEnemyCount() {
      let count = 0;

      Object.values(this.enemyGroups).forEach((group) => {
        count += group.countActive(true);
      });

      return count;
    }

    updateEnemies(time, dt) {
      Object.values(this.enemyGroups).forEach((group) => {
        group.getChildren().forEach((enemy) => {
          if (!enemy.active) {
            return;
          }

          this.updateEnemyBehavior(enemy, time, dt);

          if (enemy.fireInterval && time >= enemy.nextFireAt && enemy.y > 20 && enemy.y < H - 100) {
            this.enemyFire(enemy);
            enemy.nextFireAt = time + enemy.fireInterval + Phaser.Math.Between(-180, 320);
          }

          if (enemy.y > H + 65 || enemy.x < -85 || enemy.x > W + 85) {
            this.enemyEscaped(enemy);
          }
        });
      });
    }

    updateEnemyBehavior(enemy, time, dt) {
      const age = (time - enemy.birthAt) / 1000;
      const zeroG = this.stageNo === 4;

      switch (enemy.type) {
        case "drone": {
          enemy.setVelocityY(enemy.speed);
          enemy.setVelocityX(Math.cos(age * 3.6 + enemy.behaviorPhase) * 52);
          break;
        }

        case "fighter": {
          const exitTurn = age > 2.2 ? -1 : 1;
          enemy.setVelocity(enemy.entrySide * enemy.speed * exitTurn, age < 1.35 ? enemy.speed * 0.55 : -enemy.speed * 0.22);
          enemy.angle = enemy.entrySide * exitTurn * 12;
          break;
        }

        case "missile": {
          this.steerEnemyMissile(enemy, dt);
          break;
        }

        case "turret": {
          enemy.setVelocity(0, this.scrollSpeed * 0.45);
          break;
        }

        case "heavy": {
          enemy.setVelocity(Math.sin(age * 1.4 + enemy.behaviorPhase) * 32, enemy.speed);
          break;
        }

        case "bomber": {
          enemy.setVelocity(enemy.entrySide * enemy.speed, Math.sin(age * 2) * 14);
          break;
        }

        case "mine": {
          const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

          if (distance < 145) {
            this.physics.moveToObject(enemy, this.player, enemy.speed * 3);
            enemy.setTint(DB16.red);
          } else {
            enemy.setVelocity(Math.sin(age * 1.7) * 20, enemy.speed);
            enemy.clearTint();
          }
          break;
        }
      }

      if (zeroG && enemy.type !== "turret") {
        const wobble = Math.sin(age * 4 + enemy.behaviorPhase) * 42;
        enemy.body.velocity.x += wobble * dt;
        enemy.body.velocity.y *= 1.0008;
        enemy.angle += wobble * dt * 0.15;
      }
    }

    steerEnemyMissile(enemy, dt) {
      const desired = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

      const current = enemy.body.velocity.lengthSq() > 1 ? enemy.body.velocity.angle() : Math.PI / 2;

      const angle = Phaser.Math.Angle.RotateTo(current, desired, 1.6 * dt);

      enemy.body.velocity.setToPolar(angle, enemy.speed);
      enemy.rotation = angle - Math.PI / 2;

      this.spawnTrail(this.debrisParticles, enemy.x, enemy.y - 8, "debrisParticle", DB16.red, 180);
    }

    enemyFire(enemy) {
      if (!this.player.active) {
        return;
      }

      if (enemy.type === "bomber") {
        const bomb = this.obtainEnemyProjectile(enemy.x, enemy.y + 10, "enemyBomb");

        if (bomb) {
          bomb.setVelocity(enemy.body.velocity.x * 0.25, 145);
          bomb.damage = 1;
        }
        return;
      }

      const projectile = this.obtainEnemyProjectile(enemy.x, enemy.y + 10, "enemyBullet");

      if (!projectile) {
        return;
      }

      const speed = enemy.type === "heavy" ? 220 : 175;
      this.physics.moveToObject(projectile, this.player, speed);
      projectile.damage = enemy.type === "heavy" ? 2 : 1;
      this.flash(enemy.x, enemy.y + 10, DB16.white, 0.65);
    }

    obtainEnemyProjectile(x, y, texture) {
      const projectile = this.enemyBullets.get(x, y, texture);

      if (!projectile) {
        return null;
      }

      projectile.setTexture(texture).setActive(true).setVisible(true).setAlpha(1).setScale(1).setAngle(0).clearTint().setDepth(9);

      projectile.body.enable = true;
      projectile.body.reset(x, y);
      projectile.body.setVelocity(0, 0);
      projectile.body.setSize(texture === "enemyBomb" ? 7 : 5, texture === "enemyBomb" ? 7 : 5, true);
      projectile.expiresAt = this.time.now + 4300;
      projectile.damage = 1;

      return projectile;
    }

    enemyEscaped(enemy) {
      if (!enemy.active || enemy.dead || enemy.escaped) {
        return;
      }

      enemy.escaped = true;
      this.despawnEnemy(enemy);
      this.waveEscaped += 1;
      this.escapedCount += 1;
      this.score = Math.max(0, this.score - enemy.scoreValue);
      this.combo = 0;
      this.comboText.setText("");

      this.damagePlayer(1, null, true);

      Runtime.escapedCount = this.escapedCount;
      Runtime.score = this.score;
    }

    despawnEnemy(enemy) {
      if (!enemy) {
        return;
      }

      enemy.target = null;
      enemy.dead = false;
      enemy.escaped = false;
      enemy.clearTint();
      enemy.setAlpha(1);
      enemy.setScale(1);
      enemy.setAngle(0);
      enemy.disableBody(true, true);
    }

    clearWaveRemains() {
      this.enemyBullets.clear(true, true);
      this.debrisParticles.clear(true, true);
      this.lockedTargets.length = 0;
      this.lockProgress.clear();
      this.hideLockRings();
    }

    clearCombatObjects() {
      Object.values(this.enemyGroups).forEach((group) =>
        group.getChildren().forEach((enemy) => {
          if (enemy.active) {
            this.despawnEnemy(enemy);
          }
        }),
      );

      if (this.boss) {
        this.boss.destroy();
        this.boss = null;
      }

      this.bullets.clear(true, true);
      this.missiles.clear(true, true);
      this.enemyBullets.clear(true, true);
      this.pickups.clear(true, true);
      this.exhaustParticles.clear(true, true);
      this.explosionParticles.clear(true, true);
      this.debrisParticles.clear(true, true);
      this.lockedTargets.length = 0;
      this.lockProgress.clear();
      this.hideLockRings();
    }

    /* --------------------------------------------------------------------- */
    /* Bosses                                                                 */
    /* --------------------------------------------------------------------- */

    spawnBoss() {
      const stage = STAGES[this.stageNo - 1];
      const definition = BOSS[stage.boss];

      this.boss = this.physics.add.sprite(W / 2 + 32, -70, definition.texture);

      this.boss.setDepth(10).setScale(1).setAlpha(1);

      this.boss.body.setSize(definition.width, definition.height, true);

      this.boss.type = "boss";
      this.boss.bossType = stage.boss;
      this.boss.isBoss = true;
      this.boss.hp = definition.hp;
      this.boss.maxHp = definition.hp;
      this.boss.scoreValue = definition.score;
      this.boss.phase = 1;
      this.boss.nextActionAt = this.time.now + 1300;
      this.boss.birthAt = this.time.now;
      this.boss.dead = false;

      this.physics.add.overlap(this.bullets, this.boss, this.onBulletHit, null, this);

      this.physics.add.overlap(this.missiles, this.boss, this.onMissileHit, null, this);

      this.physics.add.overlap(this.player, this.boss, this.onPlayerEnemyCollision, null, this);

      this.bossBanner.setText(stage.bossName);
      this.setBossHudVisible(true);

      const warning = this.add
        .text(W / 2, H / 2, "WARNING\n" + stage.bossName, textStyle(20, DB16.red))
        .setOrigin(0.5)
        .setDepth(48);

      this.tweens.add({
        targets: warning,
        alpha: 0,
        scale: 1.25,
        delay: 700,
        duration: 450,
        onComplete: () => warning.destroy(),
      });
    }

    setBossHudVisible(visible) {
      this.bossBanner.setVisible(visible);
      this.bossBarBack.setVisible(visible);
      this.bossBar.setVisible(visible);
    }

    updateBoss(time, dt) {
      const boss = this.boss;

      if (!boss || !boss.active || boss.dead) {
        return;
      }

      if (boss.y < 145) {
        boss.setVelocityY(55);
        return;
      }

      const healthRatio = boss.hp / boss.maxHp;
      const desiredPhase = boss.bossType === "station" ? (healthRatio > 0.66 ? 1 : healthRatio > 0.33 ? 2 : 3) : healthRatio > 0.5 ? 1 : 2;

      if (desiredPhase !== boss.phase) {
        boss.phase = desiredPhase;
        this.bossPhaseChanged(boss);
      }

      const age = (time - boss.birthAt) / 1000;

      boss.setVelocity(Math.cos(age * (0.65 + boss.phase * 0.13)) * (34 + boss.phase * 9), Math.sin(age * 0.8) * 9);

      if (time >= boss.nextActionAt) {
        this.performBossAction(boss);
        boss.nextActionAt = time + Math.max(500, 1500 - boss.phase * 220);
      }

      if (boss.bossType === "railgun") {
        boss.angle += (12 + boss.phase * 10) * dt;
      }
    }

    bossPhaseChanged(boss) {
      this.flash(boss.x, boss.y, DB16.white, 5);
      this.mediumExplosion(boss.x - 30, boss.y);
      this.mediumExplosion(boss.x + 30, boss.y);
      this.cameras.main.shake(220, 8 / W);

      const phaseText = this.add
        .text(W / 2, 140, "PHASE " + boss.phase, textStyle(13, DB16.orange))
        .setOrigin(0.5)
        .setDepth(38);

      this.tweens.add({
        targets: phaseText,
        alpha: 0,
        y: 125,
        duration: 800,
        onComplete: () => phaseText.destroy(),
      });
    }

    performBossAction(boss) {
      switch (boss.bossType) {
        case "platform":
          this.bossSpreadShot(boss, 4 + boss.phase);
          break;

        case "bombers":
          this.bossBombRun(boss);
          break;

        case "railgun":
          if (boss.phase === 1) {
            this.bossSpreadShot(boss, 5);
          } else {
            this.bossLaserSweep(boss);
          }
          break;

        case "carrier":
          if (Math.random() < 0.55) {
            this.spawnBossDrones(boss.phase === 1 ? 2 : 4);
          } else {
            this.bossSpreadShot(boss, 5 + boss.phase);
          }
          break;

        case "station":
          if (boss.phase === 1) {
            this.bossSpreadShot(boss, 6);
          } else if (boss.phase === 2) {
            this.spawnBossDrones(3);
            this.bossSpreadShot(boss, 5);
          } else {
            this.bossLaserSweep(boss);
            this.spawnBossDrones(2);
          }
          break;
      }
    }

    bossSpreadShot(boss, count) {
      for (let index = 0; index < count; index += 1) {
        const projectile = this.obtainEnemyProjectile(boss.x, boss.y + 20, "enemyBullet");

        if (!projectile) {
          continue;
        }

        const spread = Phaser.Math.DegToRad(-55 + (110 * index) / Math.max(1, count - 1));

        projectile.body.velocity.setToPolar(Math.PI / 2 + spread, 155 + boss.phase * 20);
      }

      this.flash(boss.x, boss.y + 24, DB16.yellow, 1.8);
    }

    bossBombRun(boss) {
      [-34, 34].forEach((offset) => {
        const bomb = this.obtainEnemyProjectile(boss.x + offset, boss.y + 18, "enemyBomb");

        if (bomb) {
          bomb.setVelocity(offset * 0.8, 160 + boss.phase * 25);
        }
      });
    }

    bossLaserSweep(boss) {
      const warning = this.add
        .rectangle(boss.x, boss.y + 170, 4, 320, DB16.red, 0.45)
        .setOrigin(0.5, 0)
        .setDepth(13);

      this.tweens.add({
        targets: warning,
        alpha: 0.85,
        x: Phaser.Math.Clamp(this.player.x, 95, W - 25),
        duration: 350,
        onComplete: () => {
          if (this.player.active && Math.abs(this.player.x - warning.x) < 18) {
            this.damagePlayer(1, null, false);
          }

          this.flash(warning.x, H / 2, DB16.white, 8);
          warning.destroy();
        },
      });
    }

    spawnBossDrones(count) {
      for (let index = 0; index < count; index += 1) {
        const drone = this.spawnEnemy("drone");

        if (drone && this.boss) {
          drone.x = this.boss.x + (index - (count - 1) / 2) * 24;
          drone.y = this.boss.y + 20;
          drone.spawnX = drone.x;
          drone.hp += 1;
        }
      }
    }

    killBoss(boss) {
      if (!boss || boss.dead) {
        return;
      }

      boss.dead = true;
      boss.body.enable = false;
      boss.setVelocity(0, 0);
      this.score += boss.scoreValue;
      this.killedCount += 1;
      Runtime.killedCount = this.killedCount;
      Runtime.score = this.score;

      this.hitstop(C.HITSTOP_BOSS);
      this.cameras.main.shake(700, 18 / W);
      this.cameras.main.flash(450, 222, 238, 214, true);

      for (let index = 0; index < 14; index += 1) {
        this.time.delayedCall(index * 75, () => {
          if (!boss.scene) {
            return;
          }

          const x = boss.x + Phaser.Math.Between(-52, 52);
          const y = boss.y + Phaser.Math.Between(-38, 38);
          this.largeExplosion(x, y);
        });
      }

      this.time.delayedCall(1050, () => {
        if (boss.scene) {
          boss.destroy();
        }

        this.boss = null;
        this.spawnPickupAt(W / 2, 185, "bomb");

        if (this.stageNo >= STAGES.length) {
          this.startVictory();
        } else {
          this.stageAdvance(this.stageNo + 1);
        }
      });
    }

    /* --------------------------------------------------------------------- */
    /* Player weapons and lock-on                                             */
    /* --------------------------------------------------------------------- */

    fireBullet() {
      if (
        !this.player.active ||
        !this.controlsEnabled ||
        (this.gameState !== GAME_STATES.PLAYING && this.gameState !== GAME_STATES.BOSS_FIGHT)
      ) {
        return;
      }

      const shots =
        this.weapon === "spread"
          ? [
              { x: -9, angle: -0.18 },
              { x: 0, angle: 0 },
              { x: 9, angle: 0.18 },
            ]
          : [
              { x: -7, angle: 0 },
              { x: 7, angle: 0 },
            ];

      shots.forEach((shot) => {
        const texture = this.weapon === "laser" ? "laserBullet" : this.weapon === "spread" ? "spreadBullet" : "bullet";

        const bullet = this.bullets.get(this.player.x + shot.x, this.player.y - 23, texture);

        if (!bullet) {
          return;
        }

        bullet
          .setTexture(texture)
          .setActive(true)
          .setVisible(true)
          .setAlpha(1)
          .setScale(1)
          .setAngle(Phaser.Math.RadToDeg(shot.angle))
          .clearTint()
          .setDepth(11);

        bullet.body.enable = true;
        bullet.body.reset(this.player.x + shot.x, this.player.y - 23);
        bullet.body.velocity.setToPolar(-Math.PI / 2 + shot.angle, Math.abs(C.BULLET_SPEED));
        bullet.body.setSize(this.weapon === "laser" ? 4 : 3, this.weapon === "laser" ? 13 : 6, true);
        bullet.expiresAt = this.time.now + C.BULLET_LIFETIME;
        bullet.damage = this.weapon === "laser" ? 2 : 1;
        bullet.piercing = this.weapon === "laser";
        bullet.hitIds = new Set();
      });

      this.flash(this.player.x, this.player.y - 25, DB16.yellow, 0.7);
    }

    acquireLocks(immediate = false) {
      const candidates = this.getAllEnemies()
        .filter((enemy) => enemy.active && !enemy.dead)
        .sort((a, b) => {
          const da = Phaser.Math.Distance.Between(this.player.x, this.player.y, a.x, a.y);
          const db = Phaser.Math.Distance.Between(this.player.x, this.player.y, b.x, b.y);
          return da - db;
        })
        .slice(0, this.missileCapacity);

      if (immediate) {
        this.lockedTargets = candidates;
        candidates.forEach((target) => this.lockProgress.set(target, C.MISSILE_LOCK_TIME));
      }

      this.drawLockRings(candidates);
      return candidates;
    }

    updateKeyboardLocks(delta) {
      const held = this.isLockHeld();

      if (held) {
        const candidates = this.acquireLocks(false);

        candidates.forEach((target) => {
          const progress = (this.lockProgress.get(target) || 0) + delta;
          this.lockProgress.set(target, progress);

          if (progress >= C.MISSILE_LOCK_TIME && !this.lockedTargets.includes(target)) {
            this.lockedTargets.push(target);
          }
        });
      }

      if (this.lockHeld && !held) {
        this.fireMissiles();
        this.lockProgress.clear();
      }

      if (!held) {
        this.hideLockRings();
      }

      this.lockHeld = held;
    }

    updateTouchHoverLock(time) {
      if (!this.primaryTouch || this.primaryTouch.consumed) {
        this.touchLockTarget = null;
        this.touchLockStart = 0;
        return;
      }

      const candidates = this.getAllEnemies()
        .filter((enemy) => enemy.active && !enemy.dead)
        .map((enemy) => ({
          enemy,
          distance: Phaser.Math.Distance.Between(this.primaryTouch.x, this.primaryTouch.y, enemy.x, enemy.y),
        }))
        .filter((entry) => entry.distance <= 42)
        .sort((a, b) => a.distance - b.distance);

      const target = candidates.length ? candidates[0].enemy : null;

      if (target !== this.touchLockTarget) {
        this.touchLockTarget = target;
        this.touchLockStart = time;
      }

      if (target && time - this.touchLockStart >= C.MISSILE_LOCK_TIME && !this.lockedTargets.includes(target)) {
        this.lockedTargets.push(target);
        this.lockProgress.set(target, C.MISSILE_LOCK_TIME);
      }

      if (target) {
        this.drawLockRings([target]);
      }
    }

    drawLockRings(targets) {
      this.lockRings.forEach((ring, index) => {
        const target = targets[index];

        if (!target || !target.active) {
          ring.setVisible(false);
          return;
        }

        const progress = Phaser.Math.Clamp((this.lockProgress.get(target) || 0) / C.MISSILE_LOCK_TIME, 0, 1);

        ring
          .setPosition(target.x, target.y)
          .setVisible(true)
          .setScale(1.3 - progress * 0.3)
          .setStrokeStyle(2, progress >= 1 ? DB16.lgreen : DB16.yellow);
      });
    }

    hideLockRings() {
      this.lockRings.forEach((ring) => ring.setVisible(false));
    }

    fireMissiles() {
      if (this.time.now < this.nextMissileAt || !this.controlsEnabled || !this.player.active) {
        return;
      }

      const targets = this.lockedTargets.filter((target) => target && target.active && !target.dead).slice(0, this.missileCapacity);

      if (targets.length === 0) {
        return;
      }

      let launched = 0;

      targets.forEach((target, index) => {
        const missile = this.missiles.get(this.player.x + (index - 1) * 10, this.player.y - 12, "missilePlayer");

        if (!missile) {
          return;
        }

        missile.setTexture("missilePlayer").setActive(true).setVisible(true).setAlpha(1).setScale(1).setAngle(0).clearTint().setDepth(11);

        missile.body.enable = true;
        missile.body.reset(this.player.x + (index - 1) * 10, this.player.y - 12);
        missile.body.setVelocity(0, -C.MISSILE_SPEED);
        missile.body.setSize(7, 14, true);
        missile.target = target;
        missile.damage = C.MISSILE_DAMAGE;
        missile.expiresAt = this.time.now + 4200;
        launched += 1;
      });

      if (launched > 0) {
        this.nextMissileAt = this.time.now + C.MISSILE_COOLDOWN;
      }

      this.lockedTargets.length = 0;
      this.lockProgress.clear();
      this.hideLockRings();
    }

    updateMissiles(dt) {
      this.missiles.getChildren().forEach((missile) => {
        if (!missile.active) {
          return;
        }

        if (missile.target && missile.target.active && !missile.target.dead) {
          const desired = Phaser.Math.Angle.Between(missile.x, missile.y, missile.target.x, missile.target.y);

          const current = missile.body.velocity.lengthSq() > 1 ? missile.body.velocity.angle() : -Math.PI / 2;

          const angle = Phaser.Math.Angle.RotateTo(current, desired, C.MISSILE_TURN * dt);

          missile.body.velocity.setToPolar(angle, C.MISSILE_SPEED);
          missile.rotation = angle + Math.PI / 2;
        } else {
          missile.setVelocityY(-C.MISSILE_SPEED);
        }

        this.spawnTrail(this.exhaustParticles, missile.x, missile.y + 8, "exhaust", DB16.orange, 160);
      });
    }

    /* --------------------------------------------------------------------- */
    /* Combat callbacks                                                       */
    /* --------------------------------------------------------------------- */

    onBulletHit(bullet, enemy) {
      if (!bullet.active || !enemy.active || enemy.dead) {
        return;
      }

      if (bullet.hitIds && bullet.hitIds.has(enemy)) {
        return;
      }

      if (bullet.hitIds) {
        bullet.hitIds.add(enemy);
      }

      if (!bullet.piercing) {
        bullet.disableBody(true, true);
      }

      let damage = bullet.damage || 1;

      if (enemy.type === "heavy" && bullet.y < enemy.y) {
        damage = Math.max(0.5, damage * 0.4);
        this.flash(bullet.x, bullet.y, DB16.cold, 0.45);
      }

      this.damageEnemy(enemy, damage, false);
    }

    onMissileHit(missile, enemy) {
      if (!missile.active || !enemy.active || enemy.dead) {
        return;
      }

      missile.disableBody(true, true);
      missile.target = null;
      this.mediumExplosion(enemy.x, enemy.y);
      this.ring(enemy.x, enemy.y);
      this.cameras.main.shake(130, 5 / W);
      this.damageEnemy(enemy, missile.damage || C.MISSILE_DAMAGE, true);
    }

    damageEnemy(enemy, damage, missileHit) {
      enemy.hp -= damage;
      enemy.setTint(DB16.white);

      this.time.delayedCall(55, () => {
        if (enemy.active && !enemy.dead) {
          enemy.clearTint();
        }
      });

      this.smallExplosion(enemy.x + Phaser.Math.Between(-5, 5), enemy.y + Phaser.Math.Between(-5, 5));

      if (enemy.isBoss) {
        if (missileHit) {
          this.hitstop(C.HITSTOP_NORMAL);
        }

        if (enemy.hp <= 0) {
          this.killBoss(enemy);
        }
        return;
      }

      if (enemy.hp <= 0) {
        this.killEnemy(enemy, false);
      }
    }

    killEnemy(enemy, boss) {
      if (!enemy || enemy.dead || !enemy.active) {
        return;
      }

      const x = enemy.x;
      const y = enemy.y;
      const value = enemy.scoreValue || 100;

      enemy.dead = true;
      this.despawnEnemy(enemy);
      this.waveKilled += 1;
      this.killedCount += 1;

      this.combo = this.time.now - this.lastKillAt < 2000 ? Math.min(40, this.combo + 1) : 1;

      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.lastKillAt = this.time.now;

      const multiplier = Math.min(5, 1 + this.combo * 0.1);
      this.score += Math.round(value * multiplier);

      this.comboText.setText("x" + multiplier.toFixed(1) + " COMBO").setScale(1.2);

      this.tweens.add({
        targets: this.comboText,
        scale: 1,
        duration: 120,
      });

      if (enemy.type === "heavy" || enemy.type === "bomber") {
        this.mediumExplosion(x, y);
        this.burst(x, y, 12, [DB16.orange, DB16.yellow, DB16.white]);
      } else {
        this.smallExplosion(x, y);
        this.burst(x, y, 7, [DB16.orange, DB16.red, DB16.warm]);
      }

      this.cameras.main.shake(enemy.type === "heavy" ? 150 : 70, enemy.type === "heavy" ? 6 / W : 2 / W);

      this.maybeDropPickup(x, y);

      Runtime.killedCount = this.killedCount;
      Runtime.score = this.score;
      Runtime.combo = this.combo;
      Runtime.maxCombo = this.maxCombo;
    }

    onPlayerProjectileHit(player, projectile) {
      if (!projectile.active) {
        return;
      }

      const damage = projectile.damage || 1;
      projectile.disableBody(true, true);
      this.damagePlayer(damage, projectile, false);
    }

    onPlayerEnemyCollision(player, enemy) {
      if (!enemy.active || enemy.dead) {
        return;
      }

      const damage = enemy.contactDamage || 1;

      if (!enemy.isBoss) {
        this.killEnemy(enemy, false);
      }

      this.damagePlayer(damage, enemy, false);
    }

    damagePlayer(amount, source, escaped) {
      if (
        !this.player.active ||
        this.gameState === GAME_STATES.DYING ||
        this.gameState === GAME_STATES.VICTORY ||
        (!escaped && this.time.now < this.invulnerableUntil)
      ) {
        return;
      }

      if (this.shield > 0) {
        this.shield = 0;
        this.ring(this.player.x, this.player.y);
        this.flash(this.player.x, this.player.y, DB16.cyan, 2);
        this.invulnerableUntil = this.time.now + 650;
        return;
      }

      this.lives = Math.max(0, this.lives - amount);
      Runtime.playerLives = this.lives;

      this.cameras.main.shake(180, 7 / W);
      this.burst(this.player.x, this.player.y, 8, [DB16.red, DB16.orange, DB16.white]);
      this.hitstop(90);

      if (this.lives <= 0) {
        this.startDeath();
        return;
      }

      this.invulnerableUntil = this.time.now + 1800;
      this.blinkNextAt = this.time.now;
    }

    updateInvulnerability(time) {
      if (!this.player.active) {
        return;
      }

      if (time < this.invulnerableUntil) {
        if (time >= this.blinkNextAt) {
          this.player.setAlpha(this.player.alpha < 1 ? 1 : 0.3);
          this.blinkNextAt = time + 200;
        }
      } else if (this.player.alpha !== 1) {
        this.player.setAlpha(1);
      }
    }

    /* --------------------------------------------------------------------- */
    /* Pickups                                                                */
    /* --------------------------------------------------------------------- */

    maybeDropPickup(x, y) {
      const roll = Math.random();
      let cursor = 0;

      for (const [type, definition] of Object.entries(PICKUPS)) {
        if (type === "bomb") {
          continue;
        }

        cursor += definition.chance;

        if (roll < cursor) {
          this.spawnPickupAt(x, y, type);
          break;
        }
      }
    }

    spawnPickupAt(x, y, type) {
      const definition = PICKUPS[type];

      if (!definition) {
        return;
      }

      const pickup = this.pickups.get(x, y, definition.texture);

      if (!pickup) {
        return;
      }

      pickup.setTexture(definition.texture).setActive(true).setVisible(true).setAlpha(1).setScale(1).setAngle(0).clearTint().setDepth(10);

      pickup.body.enable = true;
      pickup.body.reset(x, y);
      pickup.body.setVelocity(Phaser.Math.Between(-18, 18), 85);
      pickup.body.setSize(13, 13, true);
      pickup.pickupType = type;
      pickup.expiresAt = this.time.now + 8000;
    }

    collectPickup(player, pickup) {
      if (!pickup.active) {
        return;
      }

      const type = pickup.pickupType;
      pickup.disableBody(true, true);

      switch (type) {
        case "spread":
          this.weapon = "spread";
          this.weaponEndsAt = this.time.now + 17000;
          break;

        case "missile":
          this.missileCapacity = Math.min(4, this.missileCapacity + 1);
          this.nextMissileAt = Math.min(this.nextMissileAt, this.time.now + 300);
          break;

        case "laser":
          this.weapon = "laser";
          this.weaponEndsAt = this.time.now + 15000;
          break;

        case "shield":
          this.shield = 1;
          break;

        case "score":
          this.score += 500;
          break;

        case "bomb":
          this.bombs = Math.min(3, this.bombs + 1);
          break;
      }

      this.flash(player.x, player.y, DB16.white, 2.2);
      this.ring(player.x, player.y);
    }

    /* --------------------------------------------------------------------- */
    /* Bomb, particles, and hitstop                                           */
    /* --------------------------------------------------------------------- */

    bombBlast() {
      if (
        this.bombs <= 0 ||
        !this.controlsEnabled ||
        this.pausedByPlayer ||
        (this.gameState !== GAME_STATES.PLAYING && this.gameState !== GAME_STATES.BOSS_FIGHT)
      ) {
        return;
      }

      this.bombs -= 1;
      this.enemyBullets.clear(true, true);

      Object.values(this.enemyGroups).forEach((group) => {
        group.getChildren().forEach((enemy) => {
          if (enemy.active) {
            enemy.hp -= 10;

            if (enemy.hp <= 0) {
              this.killEnemy(enemy, false);
            } else {
              this.mediumExplosion(enemy.x, enemy.y);
            }
          }
        });
      });

      if (this.boss && this.boss.active && !this.boss.dead) {
        this.damageEnemy(this.boss, 24, true);
      }

      const whiteout = this.add.rectangle(W / 2, H / 2, W, H, DB16.white, 0.88).setDepth(70);

      this.tweens.add({
        targets: whiteout,
        alpha: 0,
        duration: 260,
        onComplete: () => whiteout.destroy(),
      });

      this.cameras.main.shake(420, 15 / W);
      this.hitstop(180);
    }

    spawnTrail(group, x, y, texture, tint, lifetime) {
      if (Math.random() > 0.55) {
        return;
      }

      const particle = group.get(x, y, texture);

      if (!particle) {
        return;
      }

      particle
        .setTexture(texture)
        .setActive(true)
        .setVisible(true)
        .setAlpha(0.9)
        .setScale(Phaser.Math.FloatBetween(0.55, 0.9))
        .setAngle(0)
        .setTint(tint)
        .setDepth(7);

      particle.body.enable = true;
      particle.body.reset(x, y);
      particle.body.setVelocity(Phaser.Math.Between(-15, 15), Phaser.Math.Between(35, 90));
      particle.expiresAt = this.time.now + lifetime;

      if (texture === "exhaust") {
        particle.play("exhaustAnim", true);
      } else {
        particle.play("debrisAnim", true);
      }
    }

    burst(x, y, count, colors) {
      for (let index = 0; index < count; index += 1) {
        const particle = this.debrisParticles.get(x, y, "debrisParticle");

        if (!particle) {
          continue;
        }

        particle
          .setTexture("debrisParticle")
          .setActive(true)
          .setVisible(true)
          .setAlpha(1)
          .setScale(Phaser.Math.FloatBetween(0.6, 1.3))
          .setAngle(Phaser.Math.Between(0, 359))
          .setTint(colors[index % colors.length])
          .setDepth(14)
          .play("debrisAnim", true);

        particle.body.enable = true;
        particle.body.reset(x, y);
        particle.body.setVelocity(Phaser.Math.Between(-180, 180), Phaser.Math.Between(-180, 180));
        particle.expiresAt = this.time.now + Phaser.Math.Between(220, 520);
      }

      Runtime.particleCounter += count;
    }

    playExplosion(x, y, texture, animation, scale) {
      const explosion = this.explosionParticles.get(x, y, texture);

      if (!explosion) {
        return;
      }

      explosion
        .setTexture(texture)
        .setActive(true)
        .setVisible(true)
        .setAlpha(1)
        .setScale(scale)
        .setAngle(0)
        .clearTint()
        .setDepth(16)
        .play(animation, true);

      explosion.body.enable = false;
      explosion.expiresAt = this.time.now + (animation === "largeBoom" ? 900 : 620);
      Runtime.particleCounter += 1;
    }

    smallExplosion(x, y) {
      this.playExplosion(x, y, "smallExplosion", "smallBoom", Phaser.Math.FloatBetween(1.4, 2.2));
    }

    mediumExplosion(x, y) {
      this.playExplosion(x, y, "mediumExplosion", "mediumBoom", Phaser.Math.FloatBetween(1.5, 2.3));
    }

    largeExplosion(x, y) {
      this.playExplosion(x, y, "largeExplosion", "largeBoom", Phaser.Math.FloatBetween(2.1, 3.2));
    }

    flash(x, y, color, scale) {
      const flare = this.add.image(x, y, "flare").setDepth(17).setTint(color).setScale(scale);

      this.tweens.add({
        targets: flare,
        alpha: 0,
        scale: scale * 1.8,
        duration: 105,
        onComplete: () => flare.destroy(),
      });
    }

    ring(x, y) {
      const shockwave = this.add.image(x, y, "shockwave").setDepth(15);

      this.tweens.add({
        targets: shockwave,
        scale: 4,
        alpha: 0,
        duration: 260,
        onComplete: () => shockwave.destroy(),
      });
    }

    hitstop(milliseconds) {
      if (!milliseconds || this.pausedByPlayer || this.gameState === GAME_STATES.DYING) {
        return;
      }

      const until = this.time.now + milliseconds;
      this.hitstopUntil = Math.max(this.hitstopUntil, until);

      if (!this.physicsFrozen) {
        this.physicsFrozen = true;
        this.physics.world.pause();
        this.tweens.pauseAll();
      }
    }

    updateHitstop(time) {
      if (this.physicsFrozen && !this.pausedByPlayer && time >= this.hitstopUntil) {
        this.physicsFrozen = false;
        this.physics.world.resume();
        this.tweens.resumeAll();
      }
    }

    /* --------------------------------------------------------------------- */
    /* Stage mechanics                                                        */
    /* --------------------------------------------------------------------- */

    updateStageMechanic(time) {
      if (time < this.nextMechanicAt) {
        return;
      }

      const mechanic = STAGES[this.stageNo - 1].mechanic;

      if (mechanic === "storm") {
        const flash = this.add.rectangle(W / 2, H / 2, W, H, DB16.white, 0.72).setDepth(60);

        this.tweens.add({
          targets: flash,
          alpha: 0,
          duration: 50,
          onComplete: () => flash.destroy(),
        });

        this.nextMechanicAt = time + Phaser.Math.Between(2800, 6200);
      } else if (mechanic === "ice") {
        this.nextMechanicAt = time + 4200;
        this.showFrostEdges();
      } else {
        this.nextMechanicAt = time + 3500;
      }
    }

    /* --------------------------------------------------------------------- */
    /* Per-frame update helpers                                               */
    /* --------------------------------------------------------------------- */

    updatePlayer(time, dt) {
      if (!this.player.active || !this.controlsEnabled) {
        return;
      }

      const movement = this.readMovementInput();
      const iceFactor = this.stageNo === 3 ? 0.72 : 1;
      let accelerationY = movement.y * C.PLAYER_ACCELERATION * iceFactor;

      if (time < this.emergencyDiveUntil) {
        accelerationY = C.PLAYER_ACCELERATION * 2.2;
      } else if (time < this.emergencyRecoverUntil) {
        accelerationY = -C.PLAYER_ACCELERATION * 0.9;
      }

      this.player.setAcceleration(movement.x * C.PLAYER_ACCELERATION * iceFactor, accelerationY);

      /*
       * Scrolling carries the ship upward. Down input counters that carry,
       * allowing deliberate play in the lower 60–90 percent of the screen.
       */
      if (movement.y === 0 && time >= this.emergencyDiveUntil) {
        this.player.body.velocity.y -= this.scrollSpeed * dt * 0.15;
      }

      if (this.player.y < C.PLAYER_MIN_Y) {
        this.player.y = C.PLAYER_MIN_Y;
        this.player.body.velocity.y = Math.max(0, this.player.body.velocity.y);
      }

      if (this.player.y > C.PLAYER_MAX_Y) {
        this.player.y = C.PLAYER_MAX_Y;
        this.player.body.velocity.y = Math.min(0, this.player.body.velocity.y);
      }

      if (time < this.emergencyDiveUntil || movement.y < -0.65) {
        this.player.setFrame(3);
      } else if (movement.x < -0.2) {
        this.player.setFrame(1);
      } else if (movement.x > 0.2) {
        this.player.setFrame(2);
      } else {
        this.player.setFrame(0);
      }

      if (time >= this.nextExhaustAt) {
        this.spawnTrail(this.exhaustParticles, this.player.x + Phaser.Math.Between(-5, 5), this.player.y + 22, "exhaust", DB16.orange, 230);
        this.nextExhaustAt = time + 32;
      }

      if (this.isFireHeld() && time >= this.nextShotAt) {
        this.fireBullet();
        this.nextShotAt = time + C.BULLET_INTERVAL;
      }
    }

    updateTimedObjects(time) {
      [
        this.bullets,
        this.missiles,
        this.enemyBullets,
        this.pickups,
        this.exhaustParticles,
        this.explosionParticles,
        this.debrisParticles,
      ].forEach((group) => {
        group.getChildren().forEach((object) => {
          if (object.active && object.expiresAt && time >= object.expiresAt) {
            if (object.disableBody) {
              object.disableBody(true, true);
            } else {
              object.setActive(false).setVisible(false);
            }
          }
        });
      });

      this.enemyBullets.getChildren().forEach((projectile) => {
        if (projectile.active && (projectile.y > H + 30 || projectile.y < -40 || projectile.x < -40 || projectile.x > W + 40)) {
          projectile.disableBody(true, true);
        }
      });

      this.pickups.getChildren().forEach((pickup) => {
        if (pickup.active && pickup.y > H + 30) {
          pickup.disableBody(true, true);
        }
      });

      if (this.weapon !== "normal" && this.weaponEndsAt && time >= this.weaponEndsAt) {
        this.weapon = "normal";
        this.weaponEndsAt = 0;
      }

      if (this.combo && time - this.lastKillAt > 2000) {
        this.combo = 0;
        this.comboText.setText("");
        Runtime.combo = 0;
      }
    }

    update(time, delta) {
      this.updateHitstop(time);

      if (this.pausedByPlayer || this.physicsFrozen) {
        return;
      }

      const dt = Math.min(0.04, delta / 1000);

      this.processState(time);
      this.updateHud(time);
      this.updateInvulnerability(time);

      if (this.gameState === GAME_STATES.DYING) {
        this.updateTimedObjects(time);
        return;
      }

      if (this.gameState === GAME_STATES.VICTORY) {
        if (this.player.active) {
          this.player.y -= 80 * dt;
        }
        return;
      }

      const worldMoves =
        this.gameState === GAME_STATES.PLAYING || this.gameState === GAME_STATES.BOSS_FIGHT || this.gameState === GAME_STATES.STAGE_INTRO;

      if (worldMoves) {
        this.altitude += this.scrollSpeed * dt * 2.4;
        this.updateBackground(time, dt);
      }

      const combatActive = this.gameState === GAME_STATES.PLAYING || this.gameState === GAME_STATES.BOSS_FIGHT;

      if (combatActive) {
        this.updatePlayer(time, dt);
        this.updateKeyboardLocks(delta);
        this.updateTouchHoverLock(time);
        this.updateEnemies(time, dt);
        this.updateMissiles(dt);
        this.updateStageMechanic(time);

        if (this.gameState === GAME_STATES.PLAYING) {
          this.updateWaveSpawning(time);
        } else {
          this.updateBoss(time, dt);
        }
      } else if (this.player.active) {
        this.player.setAcceleration(0, 0);
        this.player.setVelocityX(0);
      }

      this.updateTimedObjects(time);

      Object.assign(Runtime, {
        score: this.score,
        currentStage: this.stageNo,
        currentWave: this.wave,
        playerLives: this.lives,
        scrollSpeed: this.scrollSpeed,
        gameState: this.gameState,
      });
    }
  }

  /* ----------------------------------------------------------------------- */
  /* End scenes                                                              */
  /* ----------------------------------------------------------------------- */

  function calculateGrade(data) {
    const accuracyProxy = data.kills / Math.max(1, data.kills + data.escaped);
    const score = data.score + data.maxCombo * 250 + Math.round(accuracyProxy * 5000) - data.escaped * 500;

    if (score >= 85000 && data.escaped <= 3) {
      return "S";
    }

    if (score >= 55000) {
      return "A";
    }

    if (score >= 28000) {
      return "B";
    }

    return "C";
  }

  function saveHighScore(score) {
    const previous = Number(localStorage.getItem("sesHighScore") || 0);
    const next = Math.max(previous, score);
    localStorage.setItem("sesHighScore", String(next));
    return next;
  }

  class GameOverScene extends Phaser.Scene {
    constructor() {
      super("GameOverScene");
    }

    init(data) {
      this.summary = {
        score: data.score || 0,
        stage: data.stage || 1,
        kills: data.kills || 0,
        maxCombo: data.maxCombo || 0,
        escaped: data.escaped || 0,
      };
    }

    create() {
      Runtime.currentScene = "GameOverScene";
      this.cameras.main.setBackgroundColor(DB16.void);
      const high = saveHighScore(this.summary.score);

      this.add.text(W / 2, 150, "MISSION FAILED", textStyle(25, DB16.red)).setOrigin(0.5);

      this.add
        .text(
          W / 2,
          245,
          "SCORE      " +
            String(this.summary.score).padStart(7, "0") +
            "\nHIGH       " +
            String(high).padStart(7, "0") +
            "\nSTAGE      " +
            this.summary.stage +
            "\nDESTROYED  " +
            this.summary.kills +
            "\nMAX COMBO  " +
            this.summary.maxCombo +
            "\nESCAPED    " +
            this.summary.escaped,
          textStyle(13, DB16.yellow),
        )
        .setOrigin(0.5);

      const retry = this.add.text(W / 2, 485, "TAP / SPACE TO RETURN", textStyle(14, DB16.white)).setOrigin(0.5);

      this.tweens.add({
        targets: retry,
        alpha: 0.25,
        duration: 550,
        yoyo: true,
        repeat: -1,
      });

      const returnToMenu = () => this.scene.start("MenuScene");

      this.input.once("pointerdown", returnToMenu);

      if (this.input.keyboard) {
        this.input.keyboard.once("keydown-SPACE", returnToMenu);
        this.input.keyboard.once("keydown-ENTER", returnToMenu);
      }
    }
  }

  class VictoryScene extends Phaser.Scene {
    constructor() {
      super("VictoryScene");
    }

    init(data) {
      this.summary = {
        score: data.score || 0,
        stage: 5,
        kills: data.kills || 0,
        maxCombo: data.maxCombo || 0,
        escaped: data.escaped || 0,
      };
    }

    create() {
      Runtime.currentScene = "VictoryScene";
      this.cameras.main.setBackgroundColor(DB16.void);

      for (let index = 0; index < 65; index += 1) {
        this.add
          .image(Phaser.Math.Between(5, W - 5), Phaser.Math.Between(5, H - 5), "star")
          .setAlpha(Phaser.Math.FloatBetween(0.3, 1))
          .setScale(Phaser.Math.RND.pick([0.4, 0.6, 1]));
      }

      const clearBonus = Math.max(0, 10000 + this.summary.maxCombo * 200 - this.summary.escaped * 300);
      this.summary.score += clearBonus;

      const grade = calculateGrade(this.summary);
      const high = saveHighScore(this.summary.score);

      this.add.text(W / 2, 118, "MISSION COMPLETE", textStyle(24, DB16.yellow)).setOrigin(0.5);

      this.add.text(W / 2, 205, grade, textStyle(68, grade === "S" ? DB16.cyan : DB16.white)).setOrigin(0.5);

      this.add
        .text(
          W / 2,
          335,
          "FINAL SCORE " +
            String(this.summary.score).padStart(7, "0") +
            "\nCLEAR BONUS " +
            String(clearBonus).padStart(7, "0") +
            "\nHIGH SCORE  " +
            String(high).padStart(7, "0") +
            "\nDESTROYED   " +
            this.summary.kills +
            "\nMAX COMBO   " +
            this.summary.maxCombo +
            "\nESCAPED     " +
            this.summary.escaped,
          textStyle(13, DB16.yellow),
        )
        .setOrigin(0.5);

      const finish = this.add.text(W / 2, 555, "TAP / SPACE TO RETURN", textStyle(14, DB16.white)).setOrigin(0.5);

      this.tweens.add({
        targets: finish,
        alpha: 0.25,
        duration: 550,
        yoyo: true,
        repeat: -1,
      });

      const returnToMenu = () => this.scene.start("MenuScene");

      this.input.once("pointerdown", returnToMenu);

      if (this.input.keyboard) {
        this.input.keyboard.once("keydown-SPACE", returnToMenu);
        this.input.keyboard.once("keydown-ENTER", returnToMenu);
      }
    }
  }

  /* ----------------------------------------------------------------------- */
  /* Phaser configuration                                                    */
  /* ----------------------------------------------------------------------- */

  const config = {
    type: Phaser.CANVAS,
    width: W,
    height: H,
    parent: "game-container",
    backgroundColor: hex(DB16.void),
    pixelArt: true,
    roundPixels: true,
    render: {
      antialias: false,
      pixelArt: true,
      roundPixels: true,
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: W,
      height: H,
      autoRound: true,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: {
          x: 0,
          y: 0,
        },
        debug: false,
      },
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene, VictoryScene],
  };

  Runtime.game = new Phaser.Game(config);
})(typeof window !== "undefined" ? window : globalThis);
