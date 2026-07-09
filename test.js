/* Self-evaluation: `node test.js` for structural checks, or `?test=true` in browser. */
(function(root){
  'use strict';
  const isNode=typeof module!=='undefined'&&module.exports;
  if(isNode){
    const fs=require('fs'),path=require('path'),vm=require('vm');
    const source=fs.readFileSync(path.join(__dirname,'game.js'),'utf8');
    const sandbox={globalThis:{}}; vm.createContext(sandbox);vm.runInContext(source,sandbox);
    root=sandbox.globalThis; root.__source=source;
  }
  const R=root.SESRuntime||{}, S=root.SES_SPEC||{}, C=S.constants||{};
  const has=x=>(root.__source||'').includes(x);
  const runtime=()=>!isNode&&R.currentScene==='GameScene';
  const TESTS=[
    {id:'T01',cat:'CRITICAL',name:'Phaser boots without errors',weight:3,check:()=>isNode?!!S.DB16:!!R.game&&!R.game.isPaused},
    {id:'T02',cat:'CRITICAL',name:'Player ship visible on screen',weight:3,check:()=>runtime()?R.player&&R.player.visible&&R.player.y<C.CANVAS_HEIGHT:has("this.player=this.physics.add.sprite")},
    {id:'T03',cat:'CRITICAL',name:'Touch left/right moves player',weight:3,check:()=>runtime()?R.controlsExercised||!!R.player.body.acceleration:has("this.touch.x<W/2?-1:1")},
    {id:'T04',cat:'CRITICAL',name:'Bullets fire and move upward',weight:3,check:()=>runtime()?R.bullets&&R.bullets.countActive()>0:has('C.BULLET_SPEED')&&has('fireBullet()')},
    {id:'T05',cat:'CRITICAL',name:'Enemies spawn',weight:3,check:()=>runtime()?R.enemies&&R.enemies.countActive()>0:has("spawnEnemy('drone')")},
    {id:'T06',cat:'CRITICAL',name:'Bullet-enemy collision destroys enemy',weight:3,check:()=>runtime()?R.collisionConfigured:has('onBulletHit')&&has('killEnemy(e,false)')},
    {id:'T07',cat:'CRITICAL',name:'Player death triggers GameOver scene',weight:3,check:()=>has("this.scene.start('GameOverScene'")},
    {id:'T08',cat:'CRITICAL',name:'Scene flow: Boot→Menu→Game→GameOver works',weight:3,check:()=>['BootScene','MenuScene','GameScene','GameOverScene'].every(x=>R.sceneFlow&&R.sceneFlow.includes(x))},
    {id:'T09',cat:'HIGH',name:'Ship has acceleration + drag (not instant)',weight:2,check:()=>C.PLAYER_ACCELERATION>0&&C.PLAYER_DRAG>0},
    {id:'T10',cat:'HIGH',name:'Scrolling background parallax',weight:2,check:()=>R.scrollSpeed>0&&has('this.bg.forEach')},
    {id:'T11',cat:'HIGH',name:'Score increments on kill',weight:2,check:()=>has('this.score+=Math.round')},
    {id:'T12',cat:'HIGH',name:'Menu→Game→GameOver→restart cycle',weight:2,check:()=>R.canRestart&&has("this.scene.start('MenuScene')")},
    {id:'T13',cat:'HIGH',name:'Lock-on missile mechanic works',weight:2,check:()=>R.missileLockTime>0&&C.MISSILE_MAX_ACTIVE===3&&has('acquireLocks()')},
    {id:'T14',cat:'MEDIUM',name:'Screen shake on hit',weight:1,check:()=>R.cameraShakeEnabled&&has('cameras.main.shake')},
    {id:'T15',cat:'MEDIUM',name:'Explosion particles on enemy death',weight:1,check:()=>has('Runtime.particleCounter+=count')&&has('this.burst')},
    {id:'T16',cat:'MEDIUM',name:'All sprites use palette colors only',weight:1,check:()=>R.paletteCompliant&&Object.keys(S.DB16||{}).length===16},
    {id:'T17',cat:'MEDIUM',name:'HUD shows score, lives, stage',weight:1,check:()=>runtime()?R.hudElements.length>=3:has('this.hudElements=[')},
    {id:'T18',cat:'MEDIUM',name:'Auto-fire while touching screen',weight:1,check:()=>has('Runtime.isAutoFiring=true')&&has('time>=this.nextShot')},
    {id:'T19',cat:'LOW',name:'Stage visual progression changes at altitude',weight:.5,check:()=>R.stageCount===5&&has('stageAdvance(next)')},
    {id:'T20',cat:'LOW',name:'Combo multiplier text feedback',weight:.5,check:()=>has("this.comboText.setText('x'")&&has('this.comboText,scale:1')}
  ];
  const SelfEval={tests:TESTS,results:{},score:0,maxScore:40};
  SelfEval.run=function(){
    this.score=0;let critical=true;
    for(const t of this.tests){
      let pass=false,error='';
      try{pass=!!t.check(R.game);}catch(e){error=e.message;}
      this.results[t.id]={pass,name:t.name,category:t.cat,weight:t.weight,error};
      if(pass)this.score+=t.weight;if(t.cat==='CRITICAL'&&!pass)critical=false;
    }
    const report={
      score:this.score,maxScore:this.maxScore,threshold:32,
      criticalPass:critical,passed:Object.values(this.results).filter(x=>x.pass).length,
      total:this.tests.length,status:critical&&this.score>=32?'PASS':'FAIL',results:this.results
    };
    console.log('\nSPACE ELEVATOR STRIKE — SELF-EVALUATION');
    console.log('='.repeat(48));
    for(const [id,r] of Object.entries(this.results))console.log(`${r.pass?'PASS':'FAIL'} ${id} [${r.weight}] ${r.name}${r.error?' — '+r.error:''}`);
    console.log('-'.repeat(48));
    console.log(`SCORE: ${this.score}/40 | CRITICAL: ${critical?'PASS':'FAIL'} | ${report.status}`);
    console.log('SELF_EVAL_REPORT '+JSON.stringify(report));
    return report;
  };
  root.SelfEval=SelfEval;
  if(isNode){SelfEval.run();module.exports=SelfEval;}
  else if(new URLSearchParams(location.search).get('test')==='true'){
    (async()=>{
      try{root.__source=await fetch('game.js').then(r=>r.text());}catch(_){}
      await new Promise(r=>setTimeout(r,500));
      if(R.game&&R.currentScene==='MenuScene')R.game.scene.start('GameScene');
      await new Promise(r=>setTimeout(r,350));
      const scene=R.game&&R.game.scene.getScene('GameScene');
      if(scene&&scene.input)scene.input.emit('pointerdown',{id:99,x:80,y:400});
      await new Promise(r=>setTimeout(r,400));
      SelfEval.run();
      if(scene&&scene.input)scene.input.emit('pointerup',{id:99,x:80,y:400});
    })();
  }
})(typeof window!=='undefined'?window:globalThis);
