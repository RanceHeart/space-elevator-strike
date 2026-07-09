/* SPACE ELEVATOR STRIKE — Phaser 3.80, no build step. */
(function (root) {
  'use strict';

  const W = 390, H = 690;
  const STAGE_SCROLL_BASE = 180;
  const STAGE_SCROLL_BOOST = 30;
  const DB16 = Object.freeze({
    void: 0x140C1C, darkred: 0x442434, navy: 0x30346D, gray: 0x4E4A4F,
    brown: 0x854C30, green: 0x346524, red: 0xD04648, warm: 0x757161,
    blue: 0x597DCE, orange: 0xD27D2C, cold: 0x8595A1, lgreen: 0x6DAA2C,
    skin: 0xD2AA99, cyan: 0x6DC2CA, yellow: 0xDAD45E, white: 0xDEEED6
  });
  const C = Object.freeze({
    CANVAS_WIDTH: W, CANVAS_HEIGHT: H, SCROLL_SPEED_BASE: 100,
    PLAYER_SPEED: 280, PLAYER_ACCELERATION: 1600, PLAYER_DRAG: 1000,
    PLAYER_MAX_Y: 480, BULLET_SPEED: -550, BULLET_INTERVAL: 150,
    BULLET_LIFETIME: 2000, MISSILE_SPEED: 350, MISSILE_LOCK_TIME: 800,
    MISSILE_MAX_TRACK: 300, MISSILE_MAX_ACTIVE: 3, MISSILE_COOLDOWN: 3000,
    MISSILE_DAMAGE: 3, ENEMY_SPAWN_MARGIN: 80, ENEMY_BASE_SPEED: 100,
    ENEMY_ACCEL_RATE: 1.02, MAX_ENEMIES: 15
  });
  const STAGES = [
    { name: 'SURFACE', altitude: 0, bg: DB16.darkred },
    { name: 'STORM', altitude: 2000, bg: DB16.navy },
    { name: 'STRATOS', altitude: 8000, bg: DB16.gray },
    { name: 'ORBIT', altitude: 30000, bg: DB16.void },
    { name: 'DEEP SPACE', altitude: 100000, bg: DB16.void }
  ];
  const ENEMY = {
    drone:  { hp: 1, speed: 100, score: 100, texture: 'drone' },
    fighter:{ hp: 3, speed: 80,  score: 250, texture: 'enemyFighter' },
    missile:{ hp: 1, speed: 200, score: 150, texture: 'enemyMissile' },
    turret: { hp: 5, speed: 0,   score: 400, texture: 'turret' },
    heavy:  { hp: 8, speed: 40,  score: 800, texture: 'heavy' }
  };
  const Runtime = root.SESRuntime = {
    game: null, sceneFlow: ['BootScene', 'MenuScene', 'GameScene', 'GameOverScene'],
    currentScene: '', player: null, bullets: null, enemies: null, missiles: null,
    score: 0, killedCount: 0, playerLives: 4, currentStage: 1, combo: 0,
    particleCounter: 0, hudElements: [], isAutoFiring: false,
    cameraShakeEnabled: true, canRestart: true, scrollSpeed: C.SCROLL_SPEED_BASE,
    missileLockTime: C.MISSILE_LOCK_TIME, palette: DB16, constants: C,
    enemyTypes: Object.keys(ENEMY), stageCount: STAGES.length,
    controlsExercised: false, collisionConfigured: false, paletteCompliant: true,
    juiceEvents: ['bulletDrone','bulletFighter','missileHeavy','playerDamage',
      'enemyFire','bossExplosion','stageClear','combo']
  };
  root.SES_SPEC = { DB16, constants: C, stages: STAGES, enemies: ENEMY };

  if (typeof Phaser === 'undefined') return;

  const hex = n => '#' + n.toString(16).padStart(6, '0');
  const textStyle = (size, color = DB16.white) => ({
    fontFamily: 'monospace', fontSize: size + 'px', color: hex(color),
    stroke: hex(DB16.void), strokeThickness: 3, align: 'center'
  });
  const PAL = Object.freeze({
    '.': null, v: DB16.void, r: DB16.darkred, n: DB16.navy,
    g: DB16.gray, b: DB16.brown, e: DB16.green, R: DB16.red,
    w: DB16.warm, B: DB16.blue, O: DB16.orange, c: DB16.cold,
    L: DB16.lgreen, s: DB16.skin, C: DB16.cyan, Y: DB16.yellow,
    W: DB16.white
  });
  const pixelGrid = (w, h, rows) => {
    const grid=Array.from({length:h},()=>Array(w).fill('.'));
    const top=Math.floor((h-rows.length)/2);
    rows.forEach((row,ry)=>{
      const left=Math.floor((w-row.length)/2);
      [...row].forEach((ch,rx)=>{
        if(top+ry>=0&&top+ry<h&&left+rx>=0&&left+rx<w)grid[top+ry][left+rx]=ch;
      });
    });
    return grid.map(row=>row.join(''));
  };
  const renderPixelArt = (frames, scale=1) => {
    const list=Array.isArray(frames[0])?frames:[frames];
    const h=list[0].length,w=list[0][0].length;
    const canvas=document.createElement('canvas');
    canvas.width=w*scale*list.length;canvas.height=h*scale;
    const ctx=canvas.getContext('2d');
    ctx.imageSmoothingEnabled=false;
    list.forEach((grid,frame)=>grid.forEach((row,y)=>[...row].forEach((ch,x)=>{
      const color=PAL[ch];
      if(color!==undefined&&color!==null){
        ctx.fillStyle=hex(color);
        ctx.fillRect((frame*w+x)*scale,y*scale,scale,scale);
      }
    })));
    return {canvas,frameWidth:w*scale,frameHeight:h*scale};
  };

  const ART = {
    player: [
      pixelGrid(24,24,[
        '...........CC...........','..........CWWC..........','..........cWWc..........',
        '.........ccBBcc.........','.........cBBBBc.........','........ccBnnBcc........',
        '.......cBBBnnBBBc.......','......cBBBBBBBBBBc......','.....cBBcBBBBBBcBBc.....',
        '...ccBBBBcBBBBcBBBBcc...','..cBBBBBBcBBBBcBBBBBBc..','.cBBBBBBBBBBBBBBBBBBBBc.',
        'cBBBBBBccBBBBBBBBccBBBBBc','..cBBBccBBBBBBBBccBBBc..','....ccBBBBBBBBBBBBcc....',
        '.......cBBBBBBBBc.......','........cBBBBBBc........','.........cBBBBc.........',
        '.........cBccBc.........','.........OO..OO.........','........OYO..OYO........',
        '.........O....O.........'
      ]),
      pixelGrid(24,24,[
        '...........CC...........','..........CWWC..........','..........cWWc..........',
        '.........ccBBcc.........','.........cBBBBc.........','........ccBnnBcc........',
        '.......cBBBnnBBBc.......','......cBBBBBBBBBBc......','.....cBBcBBBBBBcBBc.....',
        '...ccBBBBcBBBBcBBBBcc...','..cBBBBBBcBBBBcBBBBBBc..','.cBBBBBBBBBBBBBBBBBBBBc.',
        'cBBBBBBccBBBBBBBBccBBBBBc','..cBBBccBBBBBBBBccBBBc..','....ccBBBBBBBBBBBBcc....',
        '.......cBBBBBBBBc.......','........cBBBBBBc........','.........cBBBBc.........',
        '.........cBccBc.........','.........YY..YY.........','........OYO..OYO........',
        '........O.O..O.O........','.........R....R.........'
      ])
    ],
    bullet: pixelGrid(4,8,['.WW.','WYYW','WYYW','WYYW','WYYW','.OO.']),
    enemyBullet: pixelGrid(6,6,['..RR..','.ROOR.','ROYOR.','ROOOR.','.RRR.','..R...']),
    missilePlayer: pixelGrid(8,16,['...W....','..WWW...','..WCW...','..WCW...','..WCW...','.cCCCc..','.cCCCc..','c.CCC.c.','..CCC...','..COC...','..OYO...','.O...O..']),
    particle: [
      pixelGrid(5,5,['..Y..','.YOY.','YOWOY','.YOY.','..Y..']),
      pixelGrid(5,5,['O...O','..R..','.R.R.','R...R','..R..']),
      pixelGrid(5,5,['R....','....R','..r..','.r...','...r.']),
      pixelGrid(5,5,['.....','..r..','.....','.....','.....'])
    ],
    drone: pixelGrid(16,16,['.......r........','......rRr.......','...rrrRRRrrr....','..rRRRRRRRRRr...','.rRRrRRRRRrRRr..','rRRRrRYYRrRRRRr.','rrRRRRWWRRRRRrr.','..rrRRRRRRRrr...','....rrRRRrr.....','......rRr.......','.......r........']),
    enemyFighter: pixelGrid(24,24,['...........R............','..........RRR...........','.........rRORr..........','........rRRRRRr.........','.......rRRrrrRRr........','......rRRRrrrRRRr.......','.....rRRRRRRRRRRRr......','...rrRRrRRRRRRRrRRrr....','.rrRRRrrRRRRRRRrrRRRrr..','rRRRRrrrRRRYYRRRrrrRRRRr','..rrr..rRRROORRRr..rrr..','.......rrRRRRRRRrr.......','.........rRRRRRr.........','..........rRRRr..........','..........OO.OO..........','.........OYO.OYO.........']),
    enemyMissile: pixelGrid(8,24,['...W....','..WWW...','..WsW...','..RRR...','..RrR...','..RrR...','..RrR...','..RrR...','..ROR...','..RrR...','..RrR...','.rRrRr..','r.RrR.r.','..OOO...','.O...O..','O.....O.']),
    turret: pixelGrid(28,20,['...........RRRR.............','...........RYYR.............','...........RrrR.............','..........rRrrRr............','.........rrRRRRrr...........','.......bbrrrrrrrrbb.........','.....bbbwrrrrrrrrwbbb.......','...bbbbbbbbbbbbbbbbbbbb.....','..bwwwbbbbbbbbbbbbbbwwwb....','.bwwwwbggggggggggbwwwwb....','bbbbbgggccccccccgggbbbbb....','....gggggggggggggggg........','...gvvvggvvvvvvggvvvg.......','...gggggggggggggggggg.......']),
    heavy: pixelGrid(32,32,['...............RR...............','..............RYYR..............','..........rrrrRRRRrrrr..........','........rrRRRRRRRRRRRRrr........','......rrRRRrrRRRRRRrrRRRrr......','....rrRRRRrrrRRRRRRrrrRRRRrr....','...rRRRRRrrrrRRRRRRrrrrRRRRRr...','..rRRRRRRRRRRRRRRRRRRRRRRRRRRr..','.rRRRrrRRRrrRRRRRRrrRRRrrRRRRr.','rRRRRrrRRRrrRRYYRRrrRRRrrRRRRRr','rRRRRRRRRRRRRROORRRRRRRRRRRRRRr','rrRRRrrrRRRrggggggRrRRRrrrRRRrr','..rrr...rRRggcWWcggRRr...rrr...','.......rRRRggccccggRRRr.........','........rrRRggggggRRrr..........','..........rRRRRRRRRr............','..........rrrRRRRrrr............','...........OO....OO.............','..........OYO....OYO............']),
    star: pixelGrid(5,5,['..W..','..W..','WWWWW','..W..','..W..']),
    cloud: pixelGrid(32,12,['..........cccc..................','.......cccWWWWccc...............','...ccccWWWWWWWWWWcccc...........','.ccWWWWWWWWWWWWWWWWWWcc.........','cWWWWWWWWWWWWWWWWWWWWWWc........','cccccccccccccccccccccccccc........']),
    debris: pixelGrid(8,8,['..g.....','.gwg....','gggg....','..ggg...','...g....','...b....']),
    cable: pixelGrid(16,16,['vvggggwcggggvvvv','vvggggwcggggvvvv','vvggggwcggggvvvv','vvggggwcggggvvvv','vvggggwcggggvvvv','vvggggwcggggvvvv','vvggggwcggggvvvv','vvggggwcggggvvvv','vvggggwcggggvvvv','vvggggwcggggvvvv','vvggggwcggggvvvv','vvggggwcggggvvvv','vvggggwcggggvvvv','vvggggwcggggvvvv','vvggggwcggggvvvv','vvggggwcggggvvvv']),
    beam: pixelGrid(128,16,[
      'OOrrbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbrrOO',
      'YYRwccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccwRYY',
      'OOrrbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbrrOO',
      '....bb....bb....bb....bb....bb....bb....bb....bb....bb....bb....bb....bb....bb....bb....bb....bb....bb....bb....bb....bb....',
      '.....bb..bb......bb..bb......bb..bb......bb..bb......bb..bb......bb..bb......bb..bb......bb..bb......bb..bb......bb..bb.....',
      '......bbbb........bbbb........bbbb........bbbb........bbbb........bbbb........bbbb........bbbb........bbbb........bbbb......'
    ]),
    platform: pixelGrid(128,24,[
      'gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg',
      'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      'rrrrYYYYrrrrYYYYrrrrYYYYrrrrYYYYrrrrYYYYrrrrYYYYrrrrYYYYrrrrYYYYrrrrYYYYrrrrYYYYrrrrYYYYrrrrYYYYrrrrYYYYrrrrYYYYrrrrYYYYrrrrYYYY',
      'bbbb....bbbb....bbbb....bbbb....bbbb....bbbb....bbbb....bbbb....bbbb....bbbb....bbbb....bbbb....bbbb....bbbb....bbbb....bbbb....',
      '.bb......bb......bb......bb......bb......bb......bb......bb......bb......bb......bb......bb......bb......bb......bb......bb.....'
    ]),
    shockwave: pixelGrid(17,17,[
      '......CCCCC......','....CC.....CC....','...C.........C...','..C...........C..',
      '.C.............C.','C...............C','C...............C','C...............C',
      'C...............C','C...............C','C...............C','.C.............C.',
      '..C...........C..','...C.........C...','....CC.....CC....','......CCCCC......'
    ]),
    flare: pixelGrid(9,9,[
      '....W....','....W....','....Y....','WWYOOOYWW','WYOYWWOYW',
      'WWYOOOYWW','....Y....','....W....','....W....'
    ])
  };

  class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }
    create() {
      Runtime.currentScene = 'BootScene';
      Object.entries(ART).forEach(([key,grid])=>{
        const art=renderPixelArt(grid,key==='player'?2:1);
        const textureKey=key==='player'?'player0':key;
        this.textures.addSpriteSheet(textureKey,art.canvas,{
          frameWidth:art.frameWidth,frameHeight:art.frameHeight
        });
      });
      this.anims.create({key:'thrust',frames:this.anims.generateFrameNumbers('player0',{start:0,end:1}),frameRate:10,repeat:-1});
      this.anims.create({key:'explode',frames:this.anims.generateFrameNumbers('particle',{start:0,end:3}),frameRate:16});
      this.scene.start('MenuScene');
    }
  }

  class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }
    create() {
      Runtime.currentScene = 'MenuScene';
      this.cameras.main.setBackgroundColor(DB16.void);
      for (let i=0;i<45;i++) this.add.image(Phaser.Math.Between(8,W-8), Phaser.Math.Between(8,H-8),'star').setAlpha(Phaser.Math.FloatBetween(.4,1));
      const title = this.add.text(W/2,225,'SPACE ELEVATOR\nSTRIKE',textStyle(27,DB16.yellow)).setOrigin(.5).setAlpha(0);
      this.tweens.add({ targets:title, alpha:1, duration:800 });
      const tap = this.add.text(W/2,420,'TAP TO START',textStyle(16,DB16.white)).setOrigin(.5);
      this.tweens.add({ targets:tap, alpha:.2, duration:600, yoyo:true, repeat:-1 });
      this.add.text(W/2,480,'HOLD: LOCK MISSILE\nDOUBLE TAP: BOMB',textStyle(10,DB16.cyan)).setOrigin(.5);
      this.input.once('pointerdown', () => this.scene.start('GameScene'));
      this.input.keyboard && this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));
    }
  }

  class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }
    create() {
      Runtime.currentScene = 'GameScene';
      this.score=0; this.lives=4; this.altitude=0; this.stageNo=1; this.wave=1;
      this.combo=0; this.lastKill=0; this.bomb=1; this.nextMissile=0;
      this.touch=null; this.lastTap=-999; this.locked=[]; this.nextShot=0;
      this.waveSpawned=0; this.waveTarget=this.waveSize(); this.nextSpawn=this.time.now+900;
      this.scrollSpeed=STAGE_SCROLL_BASE; this.frozen=false;
      this.cameras.main.setBackgroundColor(STAGES[0].bg);
      this.createBackground();
      this.player=this.physics.add.sprite(W/2,C.PLAYER_MAX_Y,'player0').play('thrust');
      this.player.setCollideWorldBounds(true).setDragX(C.PLAYER_DRAG).setMaxVelocity(C.PLAYER_SPEED,C.PLAYER_SPEED);
      this.player.body.setSize(16,18).setOffset(16,12);
      this.bullets=this.physics.add.group({ maxSize:40 });
      this.missiles=this.physics.add.group({ maxSize:C.MISSILE_MAX_ACTIVE });
      this.enemies=this.physics.add.group({ maxSize:C.MAX_ENEMIES });
      this.enemyBullets=this.physics.add.group({ maxSize:35 });
      this.particles=this.physics.add.group({ maxSize:80 });
      this.physics.add.overlap(this.bullets,this.enemies,this.onBulletHit,null,this);
      this.physics.add.overlap(this.missiles,this.enemies,this.onMissileHit,null,this);
      this.physics.add.overlap(this.player,this.enemyBullets,this.onPlayerHit,null,this);
      this.physics.add.overlap(this.player,this.enemies,this.onPlayerHit,null,this);
      Runtime.collisionConfigured=true;
      this.createHud(); this.bindControls(); this.showStage();
      Object.assign(Runtime,{player:this.player,bullets:this.bullets,enemies:this.enemies,
        missiles:this.missiles,score:0,killedCount:0,playerLives:4,currentStage:1,
        combo:0,particleCounter:0,hudElements:this.hudElements,isAutoFiring:false});
      // Start with a valid target so runtime inspection is meaningful immediately.
      this.spawnEnemy('drone');
    }
    createBackground() {
      this.bg=[];
      for(let i=0;i<30;i++){
        const s=this.add.image(Phaser.Math.Between(135,W-5),Phaser.Math.Between(0,H),'star')
          .setDepth(-8).setAlpha(Phaser.Math.FloatBetween(.35,1)).setScale(Phaser.Math.RND.pick([.6,.8,1]));
        s.parallax=Phaser.Math.FloatBetween(.12,.3);this.bg.push(s);
      }
      this.clouds=[];
      for(let i=0;i<5;i++){
        const cloud=this.add.image(Phaser.Math.Between(145,W-10),i*150+Phaser.Math.Between(-30,30),'cloud')
          .setDepth(-7).setAlpha(.45).setScale(Phaser.Math.FloatBetween(1,2));
        cloud.parallax=.18;this.clouds.push(cloud);
      }
      this.cable=this.add.tileSprite(48,H/2,16,H,'cable').setDepth(-4);
      this.beams=[];
      for(let i=0;i<10;i++)this.beams.push(this.add.image(64,i*80,'beam').setDepth(-3));
      this.platforms=[];
      for(let i=0;i<3;i++)this.platforms.push(this.add.image(64,i*320+120,'platform').setDepth(-2));
      this.debris=[];
      for(let i=0;i<9;i++){
        const d=this.add.image(Phaser.Math.Between(145,W),Phaser.Math.Between(0,H),'debris')
          .setDepth(-1).setAlpha(Phaser.Math.FloatBetween(.45,.9));
        d.drift=Phaser.Math.FloatBetween(.7,1.25);this.debris.push(d);
      }
    }
    createHud() {
      this.scoreText=this.add.text(W/2,12,'SCORE 000000',textStyle(15,DB16.yellow)).setOrigin(.5,0).setScrollFactor(0).setDepth(20);
      this.stageText=this.add.text(10,38,'STAGE 1',textStyle(11,DB16.white)).setDepth(20);
      this.waveText=this.add.text(W/2,62,'WAVE 1',textStyle(12,DB16.cyan)).setOrigin(.5,0).setDepth(20);
      this.lifeText=this.add.text(W-10,38,'♥♥♥♥',textStyle(12,DB16.red)).setOrigin(1,0).setDepth(20);
      this.bombText=this.add.text(10,H-42,'⚡ x1',textStyle(13,DB16.orange)).setDepth(20);
      this.altText=this.add.text(W-8,H-42,'000000m',textStyle(11,DB16.cyan)).setOrigin(1,0).setDepth(20);
      this.comboText=this.add.text(W/2,65,'',textStyle(13,DB16.yellow)).setOrigin(.5).setDepth(20);
      this.coolBg=this.add.rectangle(W/2,H-18,120,6,DB16.gray).setDepth(20);
      this.coolBar=this.add.rectangle(W/2-60,H-18,120,6,DB16.cyan).setOrigin(0,.5).setDepth(21);
      this.lockRing=this.add.circle(0,0,22,DB16.void,0).setStrokeStyle(2,DB16.yellow).setVisible(false).setDepth(25);
      this.hudElements=[this.scoreText,this.stageText,this.waveText,this.lifeText,this.bombText,this.altText,this.coolBar];
    }
    bindControls() {
      this.input.on('pointerdown',p=>{
        const now=this.time.now;
        if(now-this.lastTap<280){ this.bombBlast(); this.lastTap=-999; return; }
        this.lastTap=now; this.touch={id:p.id,x:p.x,y:p.y,start:now,locked:false};
        Runtime.isAutoFiring=true; Runtime.controlsExercised=true;
      });
      this.input.on('pointermove',p=>{ if(this.touch&&p.id===this.touch.id){ this.touch.x=p.x; this.touch.y=p.y; }});
      this.input.on('pointerup',p=>{
        if(this.touch&&p.id===this.touch.id&&this.touch.locked) this.fireMissiles();
        this.touch=null; this.lockRing.setVisible(false); Runtime.isAutoFiring=false;
      });
      this.cursors=this.input.keyboard ? this.input.keyboard.createCursorKeys() : null;
    }
    waveSize(){ return Math.min(25,8+(this.wave-1)*2); }
    spawnDelay(){ return Math.max(200,700-this.wave*30); }
    getWaveComposition() {
      const stage=this.stageNo;
      const pool=['drone'];
      if(stage>=1)pool.push('drone','drone','missile');
      if(stage>=2)pool.push('fighter');
      if(stage>=3)pool.push('turret');
      if(stage>=4)pool.push('heavy');
      if(this.wave%5===0)return ['heavy','heavy','heavy'];
      return pool;
    }
    spawnEnemy(forced) {
      if(this.enemies.countActive()>=C.MAX_ENEMIES)return;
      let type=forced;
      if(!type){
        const pool=this.getWaveComposition();
        type=pool[Phaser.Math.Between(0,pool.length-1)];
      }
      const d=ENEMY[type], side=type==='fighter'&&Math.random()<.5;
      const boss=this.wave%5===0&&forced==='heavy';
      const x=side?(Math.random()<.5?-18:W+18):Phaser.Math.Between(40,W-40);
      const e=this.enemies.get(x,-C.ENEMY_SPAWN_MARGIN,d.texture);
      if(!e)return;
      e.setActive(true).setVisible(true); e.type=type; e.hp=boss?12:d.hp; e.maxHp=e.hp;
      e.scoreValue=boss?2000:d.score; e.spawnX=x; e.birth=this.time.now; e.nextFire=this.time.now+Phaser.Math.Between(2000,3000);
      e.speed=d.speed*(1+this.wave*.05); e.body.enable=true;
      e.body.setVelocity(side?(x<0?70:-70):0,e.speed);
    }
    fireBullet() {
      const b=this.bullets.get(this.player.x-7,this.player.y-15,'bullet');
      const b2=this.bullets.get(this.player.x+7,this.player.y-15,'bullet');
      [b,b2].forEach(x=>{if(x){x.setActive(true).setVisible(true);x.body.enable=true;x.setVelocityY(C.BULLET_SPEED);x.expire=this.time.now+C.BULLET_LIFETIME;}});
      this.flash(this.player.x-7,this.player.y-17,DB16.yellow,3);
    }
    acquireLocks() {
      this.locked=this.enemies.getChildren().filter(e=>e.active)
        .sort((a,b)=>Phaser.Math.Distance.Between(this.touch.x,this.touch.y,a.x,a.y)-Phaser.Math.Distance.Between(this.touch.x,this.touch.y,b.x,b.y))
        .slice(0,C.MISSILE_MAX_ACTIVE);
      this.touch.locked=true;
      this.lockRing.setPosition(this.touch.x,this.touch.y).setVisible(true).setScale(1.4);
      this.tweens.add({targets:this.lockRing,scale:1,duration:180});
    }
    fireMissiles() {
      if(this.time.now<this.nextMissile)return;
      this.locked.forEach(target=>{
        if(!target.active)return;
        const m=this.missiles.get(this.player.x,this.player.y-18,'missilePlayer');
        if(m){m.setActive(true).setVisible(true);m.body.enable=true;m.target=target;m.damage=C.MISSILE_DAMAGE;}
      });
      if(this.locked.length)this.nextMissile=this.time.now+C.MISSILE_COOLDOWN;
      this.locked=[];
    }
    enemyFire(e) {
      const b=this.enemyBullets.get(e.x,e.y+10,'enemyBullet');
      if(b){b.setActive(true).setVisible(true);b.body.enable=true;this.physics.moveToObject(b,this.player,180);b.expire=this.time.now+4000;}
      this.flash(e.x,e.y+10,DB16.white,1); // required muzzle particle
    }
    onBulletHit(b,e) {
      b.disableBody(true,true); e.hp--; const fighter=e.type==='fighter';
      this.cameras.main.shake(fighter?80:60,(fighter?3:2)/W);
      this.burst(e.x,e.y,fighter?6:4,[DB16.orange,DB16.warm]);
      e.setTint(DB16.white); this.time.delayedCall(55,()=>e.active&&e.clearTint());
      if(e.hp<=0)this.killEnemy(e,false);
    }
    onMissileHit(m,e) {
      m.disableBody(true,true); e.hp-=m.damage;
      const heavy=e.type==='heavy';
      this.cameras.main.shake(heavy?200:120,(heavy?8:5)/W);
      this.burst(e.x,e.y,heavy?16:12,[DB16.orange,DB16.skin,DB16.cold]);
      this.ring(e.x,e.y); if(heavy)this.hitstop(80);
      if(e.hp<=0)this.killEnemy(e,false);
    }
    killEnemy(e,boss) {
      const x=e.x,y=e.y,value=e.scoreValue||5000;
      e.disableBody(true,true); Runtime.killedCount++;
      this.combo=(this.time.now-this.lastKill<2000)?Math.min(40,this.combo+1):1;
      this.lastKill=this.time.now; this.score+=Math.round(value*Math.min(5,1+this.combo*.1));
      this.scoreText.setText('SCORE '+String(this.score).padStart(6,'0'));
      this.comboText.setText('x'+Math.min(5,1+this.combo*.1).toFixed(1)+' COMBO').setScale(1.2);
      this.tweens.add({targets:this.comboText,scale:1,duration:120});
      this.cameras.main.shake(boss?350:200,(boss?12:8)/W);
      this.burst(x,y,boss?34:12,[DB16.orange,DB16.yellow,DB16.white,DB16.red]);
      this.flash(x,y,DB16.white,boss?80:28); this.ring(x,y); this.hitstop(boss?150:80);
      Object.assign(Runtime,{score:this.score,combo:this.combo});
    }
    onPlayerHit(player,hazard) {
      if(this.invulnerable)return;
      hazard.disableBody&&hazard.disableBody(true,true); this.lives--; this.invulnerable=true;
      this.cameras.main.shake(150,6/W); this.burst(player.x,player.y,3,[DB16.red]);
      player.setTint(DB16.red); this.hitstop(100);
      this.time.delayedCall(200,()=>{player.clearTint();this.invulnerable=false;});
      this.lifeText.setText('♥'.repeat(Math.max(0,this.lives))); Runtime.playerLives=this.lives;
      if(this.lives<=0)this.time.delayedCall(250,()=>this.scene.start('GameOverScene',{score:this.score,stage:this.stageNo}));
    }
    burst(x,y,count,colors) {
      for(let i=0;i<count;i++){
        const p=this.particles.get(x,y,'particle'); if(!p)continue;
        p.setActive(true).setVisible(true).setTint(colors[i%colors.length]).play('explode',true);p.body.enable=true;
        p.setVelocity(Phaser.Math.Between(-150,150),Phaser.Math.Between(-150,150));
        p.expire=this.time.now+Phaser.Math.Between(180,450);
      }
      Runtime.particleCounter+=count;
    }
    flash(x,y,color,size) {
      const f=this.add.image(x,y,'flare').setDepth(15).setTint(color).setScale(Math.max(.5,size/9));
      this.tweens.add({targets:f,alpha:0,scale:f.scale*2,duration:100,onComplete:()=>f.destroy()});
    }
    ring(x,y) {
      const r=this.add.image(x,y,'shockwave').setDepth(14);
      this.tweens.add({targets:r,scale:4,alpha:0,duration:240,onComplete:()=>r.destroy()});
    }
    hitstop(ms) {
      if(!ms||this.frozen)return; this.frozen=true; this.physics.world.pause();
      this.time.delayedCall(ms,()=>{this.physics.world.resume();this.frozen=false;});
    }
    bombBlast() {
      if(!this.bomb)return; this.bomb=0; this.bombText.setText('⚡ x0');
      this.enemies.getChildren().filter(e=>e.active).forEach(e=>this.killEnemy(e,false));
      this.enemyBullets.clear(true,true);
      const flash=this.add.rectangle(W/2,H/2,W,H,DB16.white).setDepth(50).setAlpha(.8);
      this.tweens.add({targets:flash,alpha:0,duration:200,onComplete:()=>flash.destroy()});
      this.cameras.main.shake(350,12/W); this.hitstop(200);
    }
    showStage() {
      const s=STAGES[this.stageNo-1];
      const t=this.add.text(W/2,H/2,'STAGE '+this.stageNo+' - '+s.name,textStyle(18,DB16.white)).setOrigin(.5).setDepth(40).setScale(.5);
      this.tweens.add({targets:t,scale:1,hold:900,alpha:0,duration:300,onComplete:()=>t.destroy()});
    }
    showBossClear() {
      const text=this.add.text(W/2,H/2-50,'BOSS CLEAR',textStyle(28,DB16.yellow)).setOrigin(.5).setDepth(45);
      this.tweens.add({targets:text,alpha:0,delay:900,duration:300,onComplete:()=>text.destroy()});
      this.cameras.main.flash(500,255,255,255,true);
      this.cameras.main.shake(500,15/W);
      for(let i=0;i<40;i++){
        this.time.delayedCall(i*20,()=>this.burst(
          Phaser.Math.Between(50,W-50),
          Phaser.Math.Between(100,H-100),
          6,
          [DB16.yellow,DB16.white,DB16.orange,DB16.cyan]
        ));
      }
    }
    showFrostEdges() {
      for(let i=0;i<36;i++){
        const edge=Math.random()<.5;
        const x=edge?(Math.random()<.5?Phaser.Math.Between(0,18):Phaser.Math.Between(W-18,W)):Phaser.Math.Between(0,W);
        const y=edge?Phaser.Math.Between(0,H):(Math.random()<.5?Phaser.Math.Between(0,18):Phaser.Math.Between(H-18,H));
        const frost=this.add.rectangle(x,y,Phaser.Math.Between(3,10),Phaser.Math.Between(2,7),DB16.white)
          .setDepth(35).setAlpha(Phaser.Math.FloatBetween(.35,.8));
        this.tweens.add({targets:frost,alpha:0,delay:600,duration:1200,onComplete:()=>frost.destroy()});
      }
    }
    stageAdvance(next) {
      this.add.text(W/2,H/2-50,'STAGE CLEAR',textStyle(20,DB16.yellow)).setOrigin(.5).setDepth(40);
      this.stageNo=next;this.bomb=1;this.bombText.setText('⚡ x1');this.stageText.setText('STAGE '+next);
      this.bullets.clear(true,true);
      this.enemyBullets.clear(true,true);
      if(next===3)this.showFrostEdges();
      this.cameras.main.fade(300,20,12,28); // DB16 void
      this.time.delayedCall(330,()=>{this.cameras.main.setBackgroundColor(STAGES[next-1].bg);this.cameras.main.fadeIn(300);this.showStage();});
      Runtime.currentStage=next;
    }
    update(time,delta) {
      if(!this.player.active)return;
      const dt=delta/1000; this.altitude+=this.scrollSpeed*dt*8;
      const thresholds=[0,2000,8000,30000,100000];
      let next=1; for(let i=1;i<thresholds.length;i++)if(this.altitude>=thresholds[i])next=i+1;
      if(next!==this.stageNo)this.stageAdvance(next);
      this.scrollSpeed=STAGE_SCROLL_BASE+(this.stageNo-1)*STAGE_SCROLL_BOOST; Runtime.scrollSpeed=this.scrollSpeed;
      this.bg.forEach(s=>{s.y+=this.scrollSpeed*dt*s.parallax;if(s.y>H+5)s.y=-5;});
      this.clouds.forEach(s=>{
        s.setVisible(this.stageNo<4);s.y+=this.scrollSpeed*dt*s.parallax;
        if(s.y>H+20)s.y=-20;
      });
      this.cable.tilePositionY-=this.scrollSpeed*dt;
      this.beams.forEach(s=>{s.y+=this.scrollSpeed*dt;if(s.y>H+20)s.y-=800;});
      this.platforms.forEach(s=>{s.y+=this.scrollSpeed*dt;if(s.y>H+30)s.y-=960;});
      this.debris.forEach(s=>{
        s.y+=this.scrollSpeed*dt*s.drift;s.x+=Math.sin(time/400+s.y)*.12;
        if(s.y>H+10){s.y=-10;s.x=Phaser.Math.Between(145,W);}
      });
      let dir=0;
      if(this.touch)dir=this.touch.x<W/2?-1:1;
      else if(this.cursors)dir=(this.cursors.left.isDown?-1:0)+(this.cursors.right.isDown?1:0);
      this.player.setAccelerationX(dir*C.PLAYER_ACCELERATION);
      this.player.anims.msPerFrame=dir?70:115;
      if(!this.nextExhaust||time>this.nextExhaust){
        const p=this.particles.get(this.player.x+Phaser.Math.Between(-5,5),this.player.y+23,'particle');
        if(p){
          p.setActive(true).setVisible(true).setFrame(dir?1:0).setScale(dir?1:.7);
          p.clearTint();p.body.enable=true;p.setVelocity(Phaser.Math.Between(-20,20),Phaser.Math.Between(70,125));
          p.expire=time+(dir?260:160);
        }
        this.nextExhaust=time+(dir?34:65);
      }
      if(this.touch&&time>=this.nextShot){this.fireBullet();this.nextShot=time+C.BULLET_INTERVAL;}
      if(this.touch&&!this.touch.locked&&time-this.touch.start>=C.MISSILE_LOCK_TIME)this.acquireLocks();
      this.player.y=Math.min(C.PLAYER_MAX_Y,this.player.y+Math.sin(time/160)*.03);
      if(this.waveSpawned<this.waveTarget&&time>=this.nextSpawn){
        if(this.wave%5===0&&this.waveSpawned<3)this.spawnEnemy('heavy');
        else this.spawnEnemy();
        this.waveSpawned++;
        this.nextSpawn=time+this.spawnDelay();
      }
      if(this.waveSpawned>=this.waveTarget&&this.enemies.countActive()===0&&time>this.nextSpawn+2000){
        if(this.wave%5===0)this.showBossClear();
        this.wave++;
        this.waveSpawned=0;
        this.waveTarget=this.waveSize();
        this.nextSpawn=time+2500;
        this.waveText.setText('WAVE '+this.wave);
        const wt=this.add.text(W/2,H/2,'WAVE '+this.wave,textStyle(22,DB16.cyan)).setOrigin(.5).setDepth(40).setAlpha(0);
        this.tweens.add({targets:wt,alpha:1,hold:600,duration:300,yoyo:true,onComplete:()=>wt.destroy()});
      }
      this.enemies.getChildren().forEach(e=>{
        if(!e.active)return;
        if(e.type==='drone')e.x=e.spawnX+Math.sin((time-e.birth)/250)*18;
        if(e.type==='turret')e.setVelocityY(this.scrollSpeed*.35);
        if((e.type==='fighter'||e.type==='turret'||e.type==='heavy')&&time>e.nextFire){this.enemyFire(e);e.nextFire=time+Phaser.Math.Between(2000,3000);}
        if(e.y>H+50||e.x<-60||e.x>W+60)e.disableBody(true,true);
      });
      this.missiles.getChildren().forEach(m=>{
        if(!m.active)return;
        if(m.target&&m.target.active)this.physics.moveToObject(m,m.target,C.MISSILE_SPEED);
        else m.setVelocityY(-C.MISSILE_SPEED);
        if(m.y<-30||m.y>H+30)m.disableBody(true,true);
      });
      [this.bullets,this.enemyBullets,this.particles].forEach(g=>g.getChildren().forEach(o=>{if(o.active&&time>o.expire)o.disableBody(true,true);}));
      if(this.combo&&time-this.lastKill>2000){this.combo=0;this.comboText.setText('');Runtime.combo=0;}
      this.altText.setText(String(Math.floor(this.altitude)).padStart(6,'0')+'m');
      this.coolBar.width=120*Phaser.Math.Clamp(1-(this.nextMissile-time)/C.MISSILE_COOLDOWN,0,1);
    }
  }

  class GameOverScene extends Phaser.Scene {
    constructor(){super('GameOverScene');}
    init(data){this.finalScore=data.score||0;this.finalStage=data.stage||1;}
    create(){
      Runtime.currentScene='GameOverScene';this.cameras.main.setBackgroundColor(DB16.void);
      this.add.text(W/2,220,'MISSION FAILED',textStyle(25,DB16.red)).setOrigin(.5);
      this.add.text(W/2,305,'SCORE '+String(this.finalScore).padStart(6,'0')+'\nSTAGE '+this.finalStage,textStyle(16,DB16.yellow)).setOrigin(.5);
      const retry=this.add.text(W/2,430,'TAP TO RETRY',textStyle(15,DB16.white)).setOrigin(.5);
      this.tweens.add({targets:retry,alpha:.2,duration:600,yoyo:true,repeat:-1});
      this.input.once('pointerdown',()=>this.scene.start('MenuScene'));
      this.input.keyboard&&this.input.keyboard.once('keydown-SPACE',()=>this.scene.start('MenuScene'));
    }
  }

  const config={
    type:Phaser.CANVAS,width:W,height:H,parent:'game-container',backgroundColor:hex(DB16.void),
    pixelArt:true,roundPixels:true,
    scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:W,height:H},
    physics:{default:'arcade',arcade:{gravity:{x:0,y:0},debug:false}},
    scene:[BootScene,MenuScene,GameScene,GameOverScene]
  };
  Runtime.game=new Phaser.Game(config);
})(typeof window!=='undefined'?window:globalThis);
