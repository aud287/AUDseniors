/* ===================== VIDEO MEMORIES =====================
   Anyone can post ONE video, up to MAXS seconds (3 minutes). A longer video is refused (no cutting).
   • An MP4 / WebM that is small enough (≤ MAXB) is uploaded exactly as it is (original quality).
   • A bigger file, or another format (e.g. iPhone .mov), is compressed WHOLE in the browser first (no trimming), then uploaded.
   • The file goes to Google Drive in 1 MB pieces (backend: vidstart / vidchunk), then the post is created (backend: video).
   • In the viewer a video plays by itself when its post is on screen; with AUTO on, the viewer moves to the next post when the video ends.
   Needs the app.js globals ($, el, api, toast, MEM, vp, ADM, ADK, RL, VW, GI, VM, AUTO, SOLO, rlStep, bg …). */
window.VID=(function(){
 'use strict';
 const MAXS=180,MAXB=45e6,CH=1048576;                                  // 3 minutes · biggest file (backend MAX_VID is 48 MB) · upload piece (a multiple of 256 KB, as Google Drive needs)
 const mmss=s=>{s=Math.max(0,Math.round(s||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
 const isVid=f=>/^video\//.test(f.type)||(!f.type&&/\.(mp4|mov|m4v|webm|3gp|mkv)$/i.test(f.name));
 const once=(o,ok,bad,ms)=>new Promise((res,rej)=>{let t=setTimeout(()=>rej(new Error('This video took too long to open.')),ms||20000);const a=()=>{clearTimeout(t);o.removeEventListener(ok,a);o.removeEventListener('error',b);res()},b=()=>{clearTimeout(t);o.removeEventListener(ok,a);o.removeEventListener('error',b);rej(new Error(bad||'This video could not be read.'))};o.addEventListener(ok,a);o.addEventListener('error',b)});
 let T=null;                                                           // the chosen video: {file,url,dur,start}

 /* ---------------- the chosen video (preview in the dialog) ---------------- */
 function clear(){const v=$('#vtv');if(v){v.pause();v.removeAttribute('src');v.load()}if(T&&T.url)URL.revokeObjectURL(T.url);T=null;$('#vt').hidden=true}
 function load(f){clear();T={file:f,url:URL.createObjectURL(f),dur:0,start:0};const v=$('#vtv'),mine=T;
  $('#vt').hidden=false;$('#vtt').textContent='';$('#vtl').textContent='Reading the video…';$('#vtn').textContent='Tap the picture to preview.';
  v.onloadedmetadata=()=>{if(T!==mine)return;const d=v.duration;
   if(!isFinite(d)||d<=0){bad();return}
   if(d>MAXS+.5){bad('This video is '+mmss(d)+' long. The longest allowed is '+mmss(MAXS)+'. Please choose a shorter video.');return}
   mine.dur=d;$('#vtl').textContent='Ready to post';$('#vtt').textContent=mmss(d);
   $('#pfn').textContent='Video selected · '+mmss(d)+'.'+(fileCount()>1?' (Photos are ignored: a post is either one video or photos.)':'')};
  v.onerror=()=>{if(T===mine)bad()};
  v.src=mine.url}
 const fileCount=()=>$('#pf').files.length;
 function bad(msg){toast(msg||'This video format cannot be opened by your browser. Try an MP4 video.',6000);clear();try{$('#pf').value=''}catch(e){}$('#pf').onchange()}
 /* called by app.js when the file box changes: true = a video is chosen (app.js then skips its own photo handling) */
 function pick(){const v=[...$('#pf').files].find(isVid);if(!v){if(T)clear();return false}if(!T||T.file!==v)load(v);return true}
 const has=()=>!!T&&T.dur>0&&[...$('#pf').files].indexOf(T.file)>-1;
 (function wire(){const pv=$('#vtv');
  pv.addEventListener('click',()=>{if(!T||!T.dur)return;if(pv.paused)pv.play().catch(()=>{});else pv.pause()});
  $('#am').addEventListener('close',()=>{if(pv)pv.pause()})})();

 /* ---------------- getting the clip ready ---------------- */
 function posterAt(t0,t){return(async()=>{const v=document.createElement('video');v.muted=true;v.playsInline=true;v.preload='auto';v.src=t0.url;
  await once(v,'loadeddata');try{v.currentTime=Math.max(0,Math.min(t,(v.duration||t)-.1))}catch(e){}await once(v,'seeked').catch(()=>{});
  const s=Math.min(1,1000/Math.max(v.videoWidth,v.videoHeight)),c=document.createElement('canvas');c.width=Math.max(2,Math.round(v.videoWidth*s));c.height=Math.max(2,Math.round(v.videoHeight*s));
  c.getContext('2d').drawImage(v,0,0,c.width,c.height);v.removeAttribute('src');v.load();return c.toDataURL('image/jpeg',.82)})()}
 /* compress (whole video, no cutting): the video plays (silently, through the browser's audio graph) onto a canvas and is recorded. It takes as long as the clip (up to 3 minutes) */
 function record(t0,len,prog){return(async()=>{
  if(!window.MediaRecorder)throw new Error('Your browser cannot compress this video. Choose an MP4 video under '+Math.round(MAXB/1e6)+' MB, or use Chrome.');
  const v=document.createElement('video');v.playsInline=true;v.preload='auto';v.src=t0.url;await once(v,'loadeddata');
  const sc=Math.min(1,960/Math.max(v.videoWidth,v.videoHeight)),cw=Math.max(2,Math.round(v.videoWidth*sc/2)*2),ch=Math.max(2,Math.round(v.videoHeight*sc/2)*2);
  const cv=document.createElement('canvas');cv.width=cw;cv.height=ch;const cx=cv.getContext('2d');
  const mime=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));
  if(!mime||!cv.captureStream)throw new Error('Your browser cannot compress this video. Choose an MP4 video under '+Math.round(MAXB/1e6)+' MB, or use Chrome.');
  const tracks=[...cv.captureStream(30).getVideoTracks()];let ac=null;
  try{const AC=window.AudioContext||window.webkitAudioContext;ac=new AC();ac.resume&&ac.resume();const src=ac.createMediaElementSource(v),dst=ac.createMediaStreamDestination();src.connect(dst);tracks.push(...dst.stream.getAudioTracks())}catch(e){}      // not connected to the speakers: the clip is recorded silently
  const rec=new MediaRecorder(new MediaStream(tracks),{mimeType:mime,videoBitsPerSecond:1500000,audioBitsPerSecond:96000}),parts=[];
  rec.ondataavailable=e=>{if(e.data&&e.data.size)parts.push(e.data)};
  v.currentTime=t0.start;await once(v,'seeked').catch(()=>{});
  let live=true;const draw=()=>{if(!live)return;try{cx.drawImage(v,0,0,cw,ch)}catch(e){}v.requestVideoFrameCallback?v.requestVideoFrameCallback(draw):requestAnimationFrame(draw)};
  const stopped=new Promise((res,rej)=>{rec.onstop=res;rec.onerror=()=>rej(new Error('The video could not be processed.'))});
  rec.start(1000);try{await v.play()}catch(e){live=false;try{rec.stop()}catch(x){}throw new Error('The browser did not let the video play. Tap SUBMIT again.')}
  draw();const end=t0.start+len;
  await new Promise(res=>{const tm=setInterval(()=>{prog(Math.max(0,Math.min(1,(v.currentTime-t0.start)/len)));if(v.currentTime>=end-.05||v.ended){clearInterval(tm);res()}},200)});
  v.pause();await new Promise(r=>setTimeout(r,200));live=false;if(rec.state!=='inactive')rec.stop();await stopped;
  try{ac&&ac.close()}catch(e){}v.removeAttribute('src');v.load();
  const blob=new Blob(parts,{type:mime.split(';')[0]});if(!blob.size)throw new Error('The video could not be processed.');
  return{blob:blob,mime:blob.type,dur:len}})()}
 async function prepare(t0,len,prog){const ty=(t0.file.type||'').toLowerCase();
  if(t0.start<=.05&&t0.dur<=MAXS+.5&&/^video\/(mp4|webm)$/.test(ty)&&t0.file.size<=MAXB){prog(1);return{blob:t0.file,mime:ty,dur:t0.dur}}      // already short and small: sent untouched, original quality
  return record(t0,len,prog)}
 const b64=part=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).slice(String(r.result).indexOf(',')+1));r.onerror=()=>rej(new Error('Could not read the video.'));r.readAsDataURL(part)});
 async function upload(blob,mime,prog){const key=ADM?{key:ADK}:{};
  const s=await api(Object.assign({action:'vidstart',size:blob.size,mime:mime},key),{timeout:30000});if(!s.ok)throw s.error||'server';
  let at=0,stuck=0;
  for(;;){const part=blob.slice(at,Math.min(blob.size,at+CH)),r=await api(Object.assign({action:'vidchunk',session:s.session,start:at,total:blob.size,data:await b64(part)},key),{timeout:90000,tries:3});
   if(!r.ok)throw r.error||'server';if(r.done&&r.fileId)return r.fileId;
   const nx=typeof r.next==='number'&&r.next>=0&&r.next<=blob.size?r.next:at+part.size;     // Drive says how much it really kept: continue from there
   stuck=nx<=at?stuck+1:0;if(stuck>4)throw 'server';at=nx;prog(Math.min(1,at/blob.size))}}

 /* ---------------- submit ---------------- */
 async function submit(){const t0=T,btn=$('#afbtn'),spin=$('#afspin'),btxt=$('#afbtxt'),say=t=>{btxt.textContent=t};
  btn.disabled=true;spin.hidden=false;const pv=$('#vtv');pv.pause();let bad='',rr=null;
  const hold=e=>{e.preventDefault();e.returnValue=''};addEventListener('beforeunload',hold);
  try{say('CHECKING…');const bc=await api({action:'bancheck'},{tries:1,timeout:15000});if(bc&&bc.photo&&!ADM){showBan(bc.photo);return}
   const len=t0.dur,nm=clean($('#pn').value,30),cp=clean($('#pp').value,140),cat=$('#pc').value;
   say('PREPARING…');const poster=await posterAt(t0,t0.start+Math.min(1,len/2));
   const clip=await prepare(t0,len,p=>say('PROCESSING VIDEO '+Math.round(p*100)+'%'));
   if(clip.blob.size>MAXB)throw new Error('This video is too large even after compression. Choose a shorter or smaller video.');
   if(BACKEND.enabled){const fid=await upload(clip.blob,clip.mime,p=>say('UPLOADING VIDEO '+Math.round(p*100)+'%'));say('PUBLISHING…');
    rr=await api(Object.assign({action:'video',videoId:fid,image:poster,dur:clip.dur,name:nm,category:cat,caption:cp},ADM?{key:ADK}:{}),{timeout:60000});if(!rr.ok){bad=rr.error;throw 0}}
   const local=URL.createObjectURL(clip.blob);      // this visitor sees it at once from the file in memory
   const it=rr&&rr.item?Object.assign(vp(rr.item),{thumb:poster,mid:poster,url:poster,vid:local}):{pid:'l'+Date.now().toString(36),cat:cat,title:cp||'Memory',cp:cp,name:nm,uid:'',badge:ADM?(ROLE=='founder'?'founder':'team'):'',cap:'By '+nm,date:new Date().toISOString(),thumb:poster,mid:poster,url:poster,vid:local,vdur:Math.round(clip.dur)};
   MEM.unshift(it);setCat('ALL');$('#am').close();$('#af').reset();clear();$('#pf').onchange();
   toast(BACKEND.enabled?'✅ تم رفع الفيديو بنجاح':'Added (demo: connect the Backend link to keep it).',10000)}
  catch(x){if(bad=='banned'&&rr)showBan(rr);else toast(x instanceof Error?x.message:typeof x==='string'?errText(x):bad?errText(bad):'Could not send. Try again.',7000)}
  finally{removeEventListener('beforeunload',hold);btn.disabled=false;spin.hidden=true;btxt.textContent='SUBMIT MEMORY'}}

 /* ---------------- the viewer: a video post ----------------
   Reels-style player (no native controls, no picture-in-picture, no full-screen):
   • tap = play / pause · double-tap the RIGHT / LEFT side = +10 s / −10 s (keep tapping to keep skipping) · double-tap the middle = like (app.js)
   • thin progress bar along the very bottom: touch / drag it to scrub (it grows while you hold it)
   • the 3-bar "settings" button sits under Share: Quality · Captions · Speed · Volume */
 let MUTED=false,VOL=1,SPEED=1,ducked=false,dt=0;
 const SKIP=10,SPEEDS=[.5,.75,1,1.25,1.5,2];
 const SV=p=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+p+'</svg>';
 const IC={
  on:SV('<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6"/><path d="M18 6.5a7.8 7.8 0 0 1 0 11"/>'),
  off:SV('<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="m16 9.5 5 5"/><path d="m21 9.5-5 5"/>'),
  play:SV('<path d="M8 5.2v13.6a.6.6 0 0 0 .9.5l11-6.8a.6.6 0 0 0 0-1L8.9 4.7a.6.6 0 0 0-.9.5z"/>'),
  set:SV('<path d="M4 6.5h16"/><circle cx="9" cy="6.5" r="2.1"/><path d="M4 12h16"/><circle cx="15.5" cy="12" r="2.1"/><path d="M4 17.5h16"/><circle cx="8" cy="17.5" r="2.1"/>'),
  back:SV('<path d="m14.5 6-6 6 6 6"/>'),chev:SV('<path d="m9.5 6 6 6-6 6"/>'),chk:SV('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  fwd:SV('<path d="M20 5v5h-5"/><path d="M20 10a8 8 0 1 0 1.2 5"/>'),rew:SV('<path d="M4 5v5h5"/><path d="M4 10a8 8 0 1 1-1.2 5"/>')};
 const icoSnd=m=>m?IC.off:IC.on;
 const UI=new Set();                                                    // every player's "refresh my controls" function (mute / volume / speed are shared by all posts)
 function ui_(){UI.forEach(f=>{if(!f())UI.delete(f)})}
 function applyMute(){RL.querySelectorAll('video').forEach(v=>{v.muted=MUTED||VOL===0;v.volume=VOL;v.defaultPlaybackRate=v.playbackRate=SPEED});
  RL.querySelectorAll('.rl-snd').forEach(b=>{b.innerHTML=icoSnd(MUTED||VOL===0);b.setAttribute('aria-pressed',String(!(MUTED||VOL===0)));b.setAttribute('aria-label',MUTED?'Turn sound on':'Turn sound off')});ui_();audioCheck()}
 /* the site's background music steps aside while a video with sound is playing, and comes back after (unless the visitor turned it off) */
 function audioCheck(){clearTimeout(dt);dt=setTimeout(()=>{const any=VW.open&&[...RL.querySelectorAll('video')].some(v=>!v.paused&&!v.muted&&!v.ended);
  if(any&&!bg.paused){bg.pause();ducked=true}else if(!any&&ducked){ducked=false;if($('#sb').getAttribute('aria-pressed')==='true')bg.play().catch(()=>{})}},150)}
 function play(v){v.preload='auto';const p=v.play();if(p&&p.catch)p.catch(err=>{if(err&&err.name==='NotAllowedError'&&!v.muted){MUTED=true;applyMute();v.play().catch(()=>{})}})}
 /* plays the video of the post on screen, pauses and rewinds every other one (also when the viewer closes, switches to Grid, or the tab is hidden) */
 function sync(){const cur=VW.open&&VM==='view'&&!document.hidden?RL.children[GI]:null;
  RL.querySelectorAll('video').forEach(v=>{const it=v.closest('.rl-item');
   if(cur&&it===cur){if(v.paused&&!v._user&&!v.ended)play(v)}
   else{if(!v.paused)v.pause();if(v._menu)v._menu(0);if(it!==cur&&v.currentTime>0){try{v.currentTime=0}catch(e){}v._user=0;it&&it.classList.remove('vpaused')}}});
  audioCheck()}
 /* which third of the video was touched: 'l' · 'c' · 'r' (app.js asks, so a double-tap on the sides skips instead of liking) */
 function zone(e,item){const v=item&&item.querySelector('video');if(!v)return'c';const r=v.getBoundingClientRect(),x=(e.clientX-r.left)/Math.max(1,r.width);return x<.34?'l':x>.66?'r':'c'}
 const side=(e,item)=>zone(e,item)!=='c';
 /* the soft glow behind the picture follows the video: a tiny copy of the current frame is painted into the glow layer */
 function glow(v,item){const a=item&&item._amb;if(!a||!v.videoWidth)return;let c=a._c;
  if(!c){c=a._c=document.createElement('canvas');c.width=48;c.height=Math.max(8,Math.round(48*v.videoHeight/v.videoWidth));c.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block';a.insertBefore(c,a.firstChild)}
  try{c.getContext('2d').drawImage(v,0,0,c.width,c.height)}catch(e){}}
 const srcList=m=>{if(/^blob:/.test(m.vid))return[m.vid];const id=m.vfid;if(!(id&&/^[\w-]{10,}$/.test(id)))return[m.vid];
  return['https://drive.usercontent.google.com/download?id='+id+'&export=download&confirm=t',
         'https://drive.google.com/uc?export=download&id='+id+'&confirm=t',
         'https://drive.usercontent.google.com/download?id='+id+'&export=download&confirm=t&authuser=0',m.vid]};
 /* last-but-one resort: the backend sends the file back in 1.5 MB pieces, the page glues them into a file in memory and plays that (works even when Drive refuses to stream to a web page) */
 const BLOBS=new Map();                                              // file id -> Promise<blob url>
 function viaBackend(id,prog){if(BLOBS.has(id))return BLOBS.get(id);
  const pr=(async()=>{const parts=[];let at=0,size=0,mime='video/mp4',fails=0;
   while(!size||at<size){const r=await api({action:'vidget',id:id,start:at},{timeout:60000,tries:3});
    if(!r||!r.ok){if(++fails>2)throw new Error('vidget');continue}
    if(r.next<=at)throw new Error('vidget');size=r.size;mime=r.mime||mime;const bin=atob(r.data),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);parts.push(u);at=r.next;prog&&prog(Math.min(1,at/size))}
   return URL.createObjectURL(new Blob(parts,{type:mime}))})();
  pr.catch(()=>BLOBS.delete(id));BLOBS.set(id,pr);return pr}
 function player(m,item,media,ui){const v=document.createElement('video');v.className='rl-img rl-vid';v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');v.preload='metadata';v.poster=m.url;
  const srcs=srcList(m);let si=0;v.src=srcs[0];v.muted=MUTED||VOL===0;v.volume=VOL;v.defaultPlaybackRate=v.playbackRate=SPEED;
  v.disablePictureInPicture=true;v.disableRemotePlayback=true;v.controls=false;v.setAttribute('controlslist','nodownload nofullscreen noremoteplayback');v.draggable=false;
  v.addEventListener('contextmenu',e=>e.preventDefault());
  v.addEventListener('enterpictureinpicture',()=>{try{document.exitPictureInPicture()}catch(e){}});
  v.addEventListener('webkitbeginfullscreen',()=>{try{v.webkitExitFullscreen()}catch(e){}});
  /* ---- progress bar (bottom edge) ---- */
  const buf=el('i','b'),fill=el('i','f'),knob=el('b',''),trk=el('div','t'),tm=el('span','tm','0:00 / 0:00'),sk=el('div','rl-sk');
  trk.append(buf,fill,knob);sk.append(trk,tm);sk.setAttribute('role','slider');sk.tabIndex=0;sk.setAttribute('aria-label','Seek');
  const paint=()=>{const d=v.duration>0?v.duration:0,p=d?Math.min(100,v.currentTime/d*100):0;fill.style.width=p+'%';knob.style.left=p+'%';
   try{if(d&&v.buffered.length){let e=0;for(let i=0;i<v.buffered.length;i++)if(v.buffered.start(i)<=v.currentTime+.5)e=Math.max(e,v.buffered.end(i));buf.style.width=Math.min(100,e/d*100)+'%'}}catch(x){}
   tm.textContent=mmss(v.currentTime)+' / '+mmss(d);sk.setAttribute('aria-valuenow',String(Math.round(v.currentTime)));sk.setAttribute('aria-valuemax',String(Math.round(d)))};
  let scrub=0,was=false;
  const at=e=>{const r=trk.getBoundingClientRect();return Math.max(0,Math.min(1,(e.clientX-r.left)/Math.max(1,r.width)))};
  const go=e=>{if(!(v.duration>0))return;const f=at(e);try{v.currentTime=f*v.duration}catch(x){}paint()};
  sk.addEventListener('pointerdown',e=>{if(!(v.duration>0))return;e.preventDefault();e.stopPropagation();scrub=1;sk.classList.add('on');was=!v.paused;v.pause();try{sk.setPointerCapture(e.pointerId)}catch(x){}go(e)});
  sk.addEventListener('pointermove',e=>{if(scrub)go(e)});
  const end=e=>{if(!scrub)return;scrub=0;sk.classList.remove('on');if(was&&!v._user)play(v)};
  sk.addEventListener('pointerup',end);sk.addEventListener('pointercancel',end);
  sk.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();e.stopPropagation();jump(e.key==='ArrowLeft'?-5:5)}});
  const jump=s=>{if(!(v.duration>0))return;try{v.currentTime=Math.max(0,Math.min(v.duration-.05,v.currentTime+s))}catch(x){}paint()};
  /* ---- centre play icon · skip hint · buffering ---- */
  const pp=el('div','rl-pp');pp.innerHTML=IC.play;pp.setAttribute('aria-hidden','true');
  const skp=el('div','rl-skp');skp.setAttribute('aria-hidden','true');const bsy=el('div','rl-buf');bsy.hidden=true;
  /* ---- mute (top-right, like Instagram) ---- */
  const snd=el('button','rl-snd');snd.type='button';snd.innerHTML=icoSnd(MUTED||VOL===0);snd.setAttribute('aria-pressed',String(!(MUTED||VOL===0)));snd.setAttribute('aria-label',MUTED?'Turn sound on':'Turn sound off');
  snd.onclick=e=>{e.stopPropagation();if(VOL===0)VOL=1;MUTED=!MUTED;applyMute();if(!MUTED&&v.paused&&!v._user)play(v)};
  /* ---- settings button (goes under Share, app.js puts it there) + its panel ---- */
  const sb=el('button','rl-vs');sb.type='button';sb.innerHTML=IC.set;sb.setAttribute('aria-label','Video settings');sb.setAttribute('aria-haspopup','true');sb.setAttribute('aria-expanded','false');item._vset=sb;
  const pn=el('div','vs-pn');pn.hidden=true;let page='main',openP=0;
  const row=(label,val,fn,dis)=>{const b=el('button','vs-row');b.type='button';b.append(el('span','',label));const r=el('span','vs-v',val||'');r.insertAdjacentHTML('beforeend',IC.chev);b.append(r);if(dis)b.disabled=true;b.onclick=fn;return b};
  const head=t=>{const b=el('button','vs-hd');b.type='button';b.innerHTML=IC.back;b.append(el('span','',t));b.onclick=()=>{page='main';draw()};return b};
  const opt=(label,on,fn,sub)=>{const b=el('button','vs-opt'+(on?' on':''));b.type='button';const s=el('span','',label);b.append(s);if(sub)b.append(el('small','',sub));b.insertAdjacentHTML('beforeend',IC.chk);b.onclick=fn;return b};
  const tracks=()=>[...(v.textTracks||[])].filter(t=>/^(subtitles|captions)$/.test(t.kind));
  const ccOn=()=>tracks().find(t=>t.mode==='showing');
  function draw(){pn.replaceChildren();
   if(page==='main'){
    const h=v.videoHeight;pn.append(row('Quality','Auto'+(h?' · '+h+'p':''),()=>{page='q';draw()}),
     row('Captions',tracks().length?(ccOn()?ccOn().label||'On':'Off'):'Unavailable',()=>{page='cc';draw()}),
     row('Speed',SPEED===1?'Normal':SPEED+'×',()=>{page='sp';draw()}));
    const vr=el('div','vs-vol'),ib=el('button','vs-vb');ib.type='button';ib.innerHTML=icoSnd(MUTED||VOL===0);ib.setAttribute('aria-label','Mute / unmute');
    ib.onclick=()=>{if(VOL===0)VOL=1;MUTED=!MUTED;applyMute()};
    const rg=document.createElement('input');rg.type='range';rg.min=0;rg.max=100;rg.step=1;rg.value=MUTED?0:Math.round(VOL*100);rg.setAttribute('aria-label','Volume');
    const sty=()=>rg.style.setProperty('--p',rg.value+'%');sty();
    rg.oninput=()=>{VOL=rg.value/100;MUTED=VOL===0;sty();v.muted=MUTED;v.volume=VOL;RL.querySelectorAll('video').forEach(x=>{x.muted=MUTED;x.volume=VOL});ib.innerHTML=icoSnd(MUTED);RL.querySelectorAll('.rl-snd').forEach(b=>{b.innerHTML=icoSnd(MUTED);b.setAttribute('aria-pressed',String(!MUTED))});if(!MUTED&&v.paused&&!v._user)play(v);audioCheck()};
    vr.append(ib,rg,el('b','',''));pn.append(vr);const lb=vr.lastChild;lb.textContent=rg.value;rg.addEventListener('input',()=>{lb.textContent=rg.value});vr._rg=rg;vr._lb=lb;vr._ib=ib;pn._vr=vr}
   else if(page==='q'){const h=v.videoHeight;pn.append(head('Quality'),opt('Auto',true,()=>{page='main';draw()},h?h+'p · original':'original'),el('p','vs-n','This video is stored in one quality only.'))}
   else if(page==='cc'){const T=tracks();pn.append(head('Captions'));
    if(!T.length)pn.append(el('p','vs-n','No captions were added to this video.'));
    else{pn.append(opt('Off',!ccOn(),()=>{T.forEach(t=>t.mode='disabled');draw()}));T.forEach(t=>pn.append(opt(t.label||t.language||'Captions',t.mode==='showing',()=>{T.forEach(x=>x.mode=x===t?'showing':'disabled');draw()})))}}
   else if(page==='sp'){pn.append(head('Speed'));SPEEDS.forEach(s=>pn.append(opt(s===1?'Normal':s+'×',s===SPEED,()=>{SPEED=s;applyMute();page='main';draw()})))}}
  /* the panel follows mute / volume changes made elsewhere */
  UI.add(()=>{if(!item.isConnected)return false;const vr=pn._vr;if(vr&&!pn.hidden&&page==='main'){const x=MUTED?0:Math.round(VOL*100);vr._rg.value=x;vr._rg.style.setProperty('--p',x+'%');vr._lb.textContent=x;vr._ib.innerHTML=icoSnd(MUTED||VOL===0)}return true});
  const away=e=>{if(!pn.isConnected){document.removeEventListener('pointerdown',away,true);return}if(!pn.contains(e.target)&&!sb.contains(e.target))menu(0)};
  function menu(on){if(on===undefined)on=!openP;if(!!on===!!openP)return;openP=on?1:0;pn.hidden=!on;sb.setAttribute('aria-expanded',String(!!on));sb.classList.toggle('on',!!on);
   if(on){page='main';draw();document.addEventListener('pointerdown',away,true)}else document.removeEventListener('pointerdown',away,true)}
  v._menu=menu;sb.onclick=e=>{e.stopPropagation();menu()};pn.addEventListener('click',e=>e.stopPropagation());pn.addEventListener('pointerdown',e=>e.stopPropagation());
  pn.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();menu(0);sb.focus()}});
  ui.append(sk,pp,skp,bsy,snd,pn);
  /* ---- skip ±10 s hint (stacks: +10 → +20 → +30 while the taps keep coming) ---- */
  let sT=0,sTot=0,sZ='',sAt=0;
  function skip(z,t){jump(z==='r'?SKIP:-SKIP);if(sZ!==z||t-sAt>700)sTot=0;sTot+=SKIP;sZ=z;sAt=t;
   skp.className='rl-skp '+z;skp.innerHTML=(z==='r'?IC.fwd:IC.rew)+'<b>'+(z==='r'?'+':'−')+sTot+' s</b>';void skp.offsetWidth;skp.classList.add('show');clearTimeout(sT);sT=setTimeout(()=>skp.classList.remove('show'),650)}
  /* ---- taps ---- */
  let tp=0,lastT=0,lastZ='';
  v.addEventListener('click',e=>{const z=zone(e,item),t=e.timeStamp;
   if(z!=='c'&&sAt&&t-sAt<650&&z===sZ){clearTimeout(tp);tp=0;lastT=0;skip(z,t);return}          // already skipping: one more tap skips again
   if(tp&&t-lastT<320){clearTimeout(tp);tp=0;const z0=lastZ;lastT=0;if(z!=='c'&&z0===z)skip(z,t);return}   // double-tap: sides skip · middle = like (app.js)
   lastT=t;lastZ=z;tp=setTimeout(()=>{tp=0;if(v.paused){v._user=0;play(v)}else{v._user=1;v.pause();item.classList.add('vpaused')}},300)});
  /* ---- events ---- */
  v.addEventListener('timeupdate',()=>{if(!scrub)paint();glow(v,item)});
  ['progress','durationchange','seeked'].forEach(t=>v.addEventListener(t,paint));
  v.addEventListener('loadeddata',()=>{paint();glow(v,item);if(!pn.hidden&&page==='main')draw()});
  v.addEventListener('loadedmetadata',()=>{v.playbackRate=SPEED;paint()});
  ['waiting','stalled'].forEach(t=>v.addEventListener(t,()=>{if(!v.paused)bsy.hidden=false}));['playing','pause','canplay','seeked'].forEach(t=>v.addEventListener(t,()=>{bsy.hidden=true}));
  ['play','pause','ended','volumechange'].forEach(t=>v.addEventListener(t,audioCheck));
  v.addEventListener('play',()=>item.classList.remove('vpaused'));
  v.addEventListener('ended',()=>{if(item!==RL.children[GI])return;      // AUTO: on to the next post when the video is over · otherwise it plays again
   if(AUTO&&!SOLO())rlStep(1);else{try{v.currentTime=0}catch(e){}play(v)}});
  let retried=0,tier=0;      // tier 0 = direct addresses · 1 = through the backend · 2 = Drive's own player
  const toDrive=()=>{if(m._vbad)return;m._vbad=1;                      // very last resort: Drive's own player, with its "open in new window" and full-screen buttons covered / switched off
   if(m.vfid&&media.contains(v)){menu(0);const f=document.createElement('iframe');f.className='rl-img rl-vid';f.allow='autoplay';f.setAttribute('referrerpolicy','no-referrer');f.src='https://drive.google.com/file/d/'+m.vfid+'/preview';
    const cv=el('div','rl-fbcover');v.replaceWith(f);media.append(cv);[sk,snd,sb,pp,skp,bsy].forEach(x=>x.hidden=true)}rlSched()};
  const toBackend=()=>{tier=1;if(!m.vfid||!BACKEND.enabled){toDrive();return}
   bsy.hidden=false;const keep=v.currentTime||0;
   viaBackend(m.vfid,p=>{tm.textContent='Loading '+Math.round(p*100)+'%'}).then(u=>{if(!v.isConnected&&!media.contains(v))return;v.src=u;v.load();try{v.currentTime=keep}catch(e){}if(item===RL.children[GI]&&!v._user)play(v)}).catch(()=>{bsy.hidden=true;toDrive()})};
  v.addEventListener('error',()=>{
   if(tier>0){toDrive();return}
   if(si<srcs.length-1){si++;v.src=srcs[si];v.load();if(item===RL.children[GI])play(v);return}      // try the next address for the same file first
   if(!retried&&navigator.onLine!==false){retried=1;si=0;setTimeout(()=>{v.src=srcs[0]+(/\?/.test(srcs[0])?'&':'?')+'r='+Date.now();v.load();if(item===RL.children[GI]&&!v._user)play(v)},1500);return}      // Drive often fails for a moment: one more go before giving up on direct streaming
   toBackend()});
  return v}
 return{pick,has,submit,sync,player,mmss,side}
})();
