'use strict';
// Pointer events support multitouch joysticks and are shared by Safari and Android.
const stick=$('joystick'),thumb=$('stickThumb');let stickPointer=null;
function resetStick(){stickPointer=null;touchAxes.x=touchAxes.y=0;thumb.style.transform='translate(-50%,-50%)';}
function moveStick(e){if(e.pointerId!==stickPointer)return;const r=stick.getBoundingClientRect(),radius=r.width*.33;let x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;const d=Math.hypot(x,y);if(d>radius){x*=radius/d;y*=radius/d;}touchAxes.x=x/radius;touchAxes.y=y/radius;thumb.style.transform=`translate(calc(-50% + ${x}px),calc(-50% + ${y}px))`;}
stick.addEventListener('pointerdown',e=>{if(modal||stickPointer!==null)return;e.preventDefault();initAudio();stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);moveTarget=null;moveStick(e);});
stick.addEventListener('pointermove',moveStick);
for(const ev of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(ev,e=>{if(e.pointerId===stickPointer)resetStick();});
$('runTouch').onclick=()=>{touchRun=!touchRun;$('runTouch').setAttribute('aria-pressed',String(touchRun));$('runTouch').querySelector('small').textContent=touchRun?'Бег вкл.':'Бежать';initAudio();};
$('actionTouch').onclick=()=>{initAudio();interact();resetStick();};
for(const [id,code] of [['cameraLeft','ArrowLeft'],['cameraRight','ArrowRight']]){const b=$(id);b.addEventListener('pointerdown',e=>{if(modal)return;e.preventDefault();b.setPointerCapture(e.pointerId);keys[code]=true;});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>keys[code]=false);}
$('questToggle').onclick=()=>{const expanded=$('quest').classList.toggle('expanded');$('questToggle').setAttribute('aria-expanded',String(expanded));};
const fingers=new Map();let touchGesture=null,pinchDistance=0;
const surface=renderer.domElement;
surface.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'||modal||!started)return;e.preventDefault();surface.setPointerCapture(e.pointerId);fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(fingers.size===1){touchGesture={x:e.clientX,y:e.clientY,lastX:e.clientX,moved:false,multi:false};}else{if(touchGesture)touchGesture.multi=true;const p=[...fingers.values()];pinchDistance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);}});
surface.addEventListener('pointermove',e=>{if(!fingers.has(e.pointerId)||!touchGesture)return;fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(fingers.size>=2){const p=[...fingers.values()],dist=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);zoom=clamp(zoom+(pinchDistance-dist)*.045,13,32);pinchDistance=dist;touchGesture.multi=true;}else if(!touchGesture.multi){if(Math.hypot(e.clientX-touchGesture.x,e.clientY-touchGesture.y)>10)touchGesture.moved=true;if(touchGesture.moved)targetAngle-=(e.clientX-touchGesture.lastX)*.008;touchGesture.lastX=e.clientX;}});
function endGesture(e){if(!fingers.has(e.pointerId))return;const tapped=e.type==='pointerup'&&fingers.size===1&&touchGesture&&!touchGesture.moved&&!touchGesture.multi;fingers.delete(e.pointerId);if(tapped)walkToScreen(e.clientX,e.clientY);if(!fingers.size)touchGesture=null;}
for(const ev of ['pointerup','pointercancel','lostpointercapture'])surface.addEventListener(ev,endGesture);
function clearTouch(){resetStick();fingers.clear();touchGesture=null;keys={};}
window.addEventListener('blur',clearTouch);window.addEventListener('orientationchange',clearTouch);document.addEventListener('visibilitychange',clearTouch);
const full=$('fullscreenButton');if(!document.documentElement.requestFullscreen)full.classList.add('hidden');else full.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(e){toast('Полноэкранный режим недоступен в этом браузере');}};
function enableTouchMode(){if(!mobileDevice){mobileDevice=true;qualityTier=Math.min(qualityTier,1);document.body.classList.add('touch-device');applyQuality();updateQuest();resizeGame();}}
document.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')enableTouchMode();},true);
const coarsePointer=matchMedia('(any-pointer: coarse)');coarsePointer.addEventListener?.('change',e=>{if(e.matches)enableTouchMode();});
window.addEventListener('resize',()=>{if(innerWidth<820)enableTouchMode();});
const originalBegin=begin;begin=function(load=false){clearTouch();touchRun=false;$('runTouch').setAttribute('aria-pressed','false');$('runTouch').querySelector('small').textContent='Бежать';originalBegin(load);if(mobileDevice)toast('Джойстик — идти. Правая кнопка — действие. Свайп — камера.');};
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
