const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
let W,H,DPR=1;
function resize(){DPR=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*DPR;canvas.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0)}addEventListener('resize',resize);resize();
const aim={x:W*.68,y:H*.52},keys={};let playing=false,health=100,supply=100,ammo=24,reserve=120,shots=0,won=false,flash=0,shake=0;
const player={x:W*.28,y:H*.68,r:10,angle:0};
let enemies=[],bullets=[],particles=[],trails=[];
function reset(){player.x=W*.25;player.y=H*.72;health=supply=100;ammo=24;reserve=120;won=false;bullets=[];particles=[];enemies=[];for(let i=0;i<7;i++)enemies.push({x:W*(.68+Math.random()*.22),y:H*(.25+Math.random()*.48),r:9,hp:3,phase:Math.random()*6});updateHud()}
function spawnEnemy(){if(enemies.length<9&&!won) enemies.push({x:W*(.72+Math.random()*-.08+Math.random()*0.25),y:H*(.2+Math.random()*0.5),r:9,hp:3,phase:Math.random()*6})}
function updateHud(){document.getElementById('ammo').textContent=ammo;document.querySelector('.ammo small').textContent='/ '+reserve;document.getElementById('supplyText').textContent=Math.ceil(supply);document.getElementById('supplyBar').style.width=supply+'%';document.getElementById('healthText').textContent=Math.ceil(health);document.getElementById('healthBar').style.width=health+'%'}
function toast(t){const e=document.getElementById('toast');e.textContent=t;e.style.opacity=1;e.style.transition='none';clearTimeout(toast.t);toast.t=setTimeout(()=>{e.style.opacity=0;e.style.transition='opacity 1s'},1600)}
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.code==='Space'){e.preventDefault();keys.fire=true}if(e.key.toLowerCase()==='r')reload()});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;if(e.code==='Space')keys.fire=false});
addEventListener('mousemove',e=>{aim.x=e.clientX;aim.y=e.clientY;document.getElementById('crosshair').style.left=e.clientX+'px';document.getElementById('crosshair').style.top=e.clientY+'px'});
canvas.addEventListener('touchmove',e=>{e.preventPreventDefault?.();const t=e.touches[0];aim.x=t.clientX;aim.y=t.clientY});
canvas.addEventListener('mousedown',()=>{if(playing)fire()});
function reload(){if(reserve>0&&ammo<24){let n=Math.min(24-ammo,reserve);ammo+=n;reserve-=n;updateHud();toast('MAGAZINE LOADED')}}
function fire(){if(ammo<=0){reload();return}ammo--;shots++;updateHud();let a=Math.atan2(aim.y-player.y,aim.x-player.x);a+= (Math.random()-.5)*.025;bullets.push({x:player.x,y:player.y,vx:Math.cos(a)*14,vy:Math.sin(a)*14,life:70});flash=.08}
function burst(x,y,n=8,color='#c2a66d'){for(let i=0;i<n;i++){let a=Math.random()*6.28,s=Math.random()*3;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:20+Math.random()*20,color})}}
function line(x1,y1,x2,y2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2)}
function drawWorld(t){
 ctx.fillStyle='#30382f';ctx.fillRect(0,0,W,H);
 // muddy grid / terrain
 ctx.strokeStyle='rgba(180,175,145,.025)';ctx.lineWidth=1;for(let x=-H*.2;x<W+H*.2;x+=45){line(x,0,x+H*.25,H);ctx.stroke()}for(let y=0;y<H;y+=45){line(0,y,W,y);ctx.stroke()}
 // distant ridge
 ctx.fillStyle='#252c25';ctx.beginPath();ctx.moveTo(0,H*.28);for(let x=0;x<=W;x+=100)ctx.lineTo(x,H*(.25+.035*Math.sin(x*.013)));ctx.lineTo(W,0);ctx.lineTo(0,0);ctx.fill();
 // trenches
 ctx.strokeStyle='#1a201a';ctx.lineWidth=25;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(W*.08,H*.86);ctx.bezierCurveTo(W*.28,H*.78,W*.45,H*.88,W*.58,H*.72);ctx.stroke();ctx.strokeStyle='#59604b';ctx.lineWidth=3;ctx.stroke();
 // fortifications
 ctx.fillStyle='#1a201a';for(let i=0;i<9;i++){let x=W*(.07+i*.055),y=H*(.78+i*.008);ctx.fillRect(x,y,26,10)}
 // relay objective
 let rx=W*.82,ry=H*.43;ctx.fillStyle='#242921';ctx.fillRect(rx-19,ry-48,38,48);ctx.fillStyle='#69705a';ctx.fillRect(rx-14,ry-43,28,43);ctx.fillStyle='#b6a66f';ctx.fillRect(rx-3,ry-38,6,18);ctx.strokeStyle='rgba(210,173,98,.6)';ctx.beginPath();ctx.arc(rx,ry-48,28+Math.sin(t*.003)*3,0,6.28);ctx.stroke();
 // obstacles / sandbags
 ctx.fillStyle='#777b63';for(let i=0;i<12;i++){let x=W*(.52+i%6*.035),y=H*(.35+Math.floor(i/6)*.14);ctx.beginPath();ctx.ellipse(x,y,13,7,0,0,6.28);ctx.fill()}
}
function drawSoldier(e,enemy=false){let a=enemy?Math.atan2(player.y-e.y,player.x-e.x):Math.atan2(aim.y-e.y,aim.x-e.x);ctx.save();ctx.translate(e.x,e.y);ctx.rotate(a);ctx.fillStyle=enemy?'#565241':'#4d5a44';ctx.beginPath();ctx.arc(0,0,e.r,0,6.28);ctx.fill();ctx.fillStyle=enemy?'#2b2922':'#283026';ctx.fillRect(-5,-3,20,6);ctx.fillStyle=enemy?'#8e8062':'#6e795e';ctx.fillRect(-9,-8,8,16);ctx.restore()}
let last=performance.now(),enemyTimer=0,lastAutoShot=0;
function loop(now){let dt=Math.min(32,now-last);last=now;if(playing&&!won){
 if(keys['fire']&&now-lastAutoShot>180){fire();lastAutoShot=now}
 let sp=(keys['shift']?3.6:2.2)*(dt/16);let dx=(keys['d']?1:0)-(keys['a']?1:0),dy=(keys['s']?1:0)-(keys['w']?1:0);let l=Math.hypot(dx,dy)||1;player.x=Math.max(20,Math.min(W-20,player.x+dx/l*sp));player.y=Math.max(H*.3,Math.min(H*.9,player.y+dy/l*sp));
 enemyTimer+=dt;if(enemyTimer>2200){spawnEnemy();enemyTimer=0}
 enemies.forEach(e=>{e.phase+=dt*.003;let a=Math.atan2(player.y-e.y,player.x-e.x),d=Math.hypot(player.x-e.x,player.y-e.y);if(d>160){e.x+=Math.cos(a)*.35*(dt/16);e.y+=Math.sin(a)*.35*(dt/16)}else if(Math.random()<.008){health-=6;shake=.2;document.getElementById('damage').style.opacity=.45;setTimeout(()=>document.getElementById('damage').style.opacity=0,100)}});
 bullets.forEach(b=>{b.x+=b.vx*(dt/16);b.y+=b.vy*(dt/16);b.life-=dt/16;if(Math.random()<.8)trails.push({x:b.x,y:b.y,life:12});enemies.forEach(e=>{if(Math.hypot(b.x-e.x,b.y-e.y)<e.r+5&&b.life>0){e.hp--;b.life=0;burst(b.x,b.y,5,'#9c8d68');if(e.hp<=0){burst(e.x,e.y,12,'#8d815e');e.dead=true}}})});bullets=bullets.filter(b=>b.life>0&&b.x>-20&&b.x<W+20&&b.y>-20&&b.y<H+20);enemies=enemies.filter(e=>!e.dead);
 particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.life--});particles=particles.filter(p=>p.life>0);trails.forEach(p=>p.life--);trails=trails.filter(p=>p.life>0);
 if(health<=0){health=0;playing=false;document.querySelector('#start h1').textContent='K.I.A.';document.querySelector('#start p').innerHTML='The line has broken.<br/>Regroup and return.';document.querySelector('#play').textContent='REDEPLOY';document.getElementById('start').classList.remove('hidden')}
 if(player.x>W*.76&&player.y<H*.55&&player.y>H*.28){won=true;playing=false;toast('RELAY SECURED');setTimeout(()=>{document.querySelector('#start h1').textContent='OBJECTIVE SECURED';document.querySelector('#start p').innerHTML='Kloster Heights is in friendly hands.';document.querySelector('#play').textContent='RETURN TO LINE';document.getElementById('start').classList.remove('hidden')},500)}
 updateHud();
}
ctx.save();if(shake>0){ctx.translate((Math.random()-.5)*shake*18,(Math.random()-.5)*shake*18);shake*=.8}drawWorld(now);
 particles.forEach(p=>{ctx.globalAlpha=Math.min(1,p.life/15);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,2,2)});ctx.globalAlpha=1;
 trails.forEach(p=>{ctx.fillStyle='rgba(230,205,130,.45)';ctx.fillRect(p.x,p.y,2,2)});
 if(playing||won||health>0)drawSoldier(player,false);enemies.forEach(e=>drawSoldier(e,true));bullets.forEach(b=>{ctx.strokeStyle='#dfcf96';ctx.lineWidth=2;line(b.x,b.y,b.x-b.vx*1.5,b.y-b.vy*1.5);ctx.stroke()});ctx.restore();requestAnimationFrame(loop)}
reset();requestAnimationFrame(loop);
document.getElementById('play').onclick=()=>{reset();document.getElementById('start').classList.add('hidden');playing=true;toast('ADVANCE')};
// touch joystick: moving left side while screen is touched
canvas.addEventListener('touchstart',e=>{if(!playing)return;let t=e.touches[0];if(t.clientX<W*.45){window.touchJoy={x:t.clientX,y:t.clientY}}else aim.x=t.clientX,aim.y=t.clientY},{passive:true});
canvas.addEventListener('touchmove',e=>{let t=e.touches[0];if(window.touchJoy){let dx=t.clientX-window.touchJoy.x,dy=t.clientY-window.touchJoy.y;keys['d']=dx>15;keys['a']=dx<-15;keys['s']=dy>15;keys['w']=dy<-15}else{aim.x=t.clientX;aim.y=t.clientY}},{passive:true});canvas.addEventListener('touchend',()=>{window.touchJoy=null;['w','a','s','d'].forEach(k=>keys[k]=false)});
const stick=document.getElementById('stick');
function stickMove(e){const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy;keys.d=dx>12;keys.a=dx< -12;keys.s=dy>12;keys.w=dy< -12}
stick.addEventListener('pointerdown',e=>{stick.setPointerCapture(e.pointerId);stickMove(e)});stick.addEventListener('pointermove',e=>{if(e.buttons)stickMove(e)});stick.addEventListener('pointerup',()=>['w','a','s','d'].forEach(k=>keys[k]=false));
const mobileFire=document.getElementById('mobileFire');mobileFire.addEventListener('pointerdown',e=>{e.preventDefault();keys.fire=true});['pointerup','pointercancel','pointerleave'].forEach(type=>mobileFire.addEventListener(type,()=>keys.fire=false));document.getElementById('mobileReload').addEventListener('pointerdown',e=>{e.preventDefault();reload()});
