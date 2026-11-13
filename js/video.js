/* ===================== VIDEO MEMORIES =====================
   Anyone can post ONE video of up to 3 minutes in "ADD YOUR MEMORY".
   • A long video shows a 3-minute bar: drag the gold box to choose where the clip starts. The browser then cuts that part out (and compresses it) before upload.
   • A video that is already ≤ 3 minutes and small is uploaded as it is.
   • The file goes to Google Drive in 1 MB pieces (backend: vidstart / vidchunk), then the post is created (backend: video). The post shows a poster picture everywhere (board, grid).
   • In the viewer (Scroll mode) a video plays by itself when its post is on screen; with AUTO on, the viewer moves to the next post when the video ends.
   Needs the app.js globals ($, el, api, toast, MEM, vp, ADM, ADK, RL, VW, GI, VM, AUTO, SOLO, rlStep, bg …). */
window.VID=(function(){
 'use strict';
 const MAXS=180,MAXB=45e6,CH=1048576;                                  // 3 minutes · biggest file (backend MAX_VID is 48 MB) · upload piece (a multiple of 256 KB, as Google Drive needs)
 const mmss=s=>{s=Math.max(0,Math.round(s||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
 const isVid=f=>/^video\//.test(f.type)||(!f.type&&/\.(mp4|mov|m4v|webm|3gp|mkv)$/i.test(f.name));
 const once=(o,ok,bad,ms)=>new Promise((res,rej)=>{let t=setTimeout(()=>rej(new Error('This video took too long to open.')),ms||20000);const a=()=>{clearTimeout(t);o.removeEventListener(ok,a);o.removeEventListener('error',b);res()},b=()=>{clearTimeout(t);o.removeEventListener(ok,a);o.removeEventListener('error',b);rej(new Error(bad||'This video could not be read.'))};o.addEventListener(ok,a);o.addEventListener('error',b)});
 let T=null;                                                           // the chosen video: {file,url,dur,start}

 /* ---------------- the 3-minute chooser inside the dialog ---------------- */
 const lenOf=t=>Math.min(MAXS,t.dur);
 function layout(){if(!T||!T.dur)return;const len=lenOf(T),w=$('#vtwin');
  w.style.width=(len/T.dur*100)+'%';w.style.left=(T.start/T.dur*100)+'%';
  $('#vtt').textContent=mmss(T.start)+' – '+mmss(T.start+len)+'  ·  '+mmss(len);
  w.setAttribute('aria-valuemax',String(Math.max(0,Math.floor(T.dur-len))));w.setAttribute('aria-valuenow',String(Math.round(T.start)));w.setAttribute('aria-valuetext','from '+mmss(T.start)+' to '+mmss(T.start+len))}
 function setStart(t){if(!T||!T.dur)return;const len=lenOf(T);t=Math.max(0,Math.min(T.dur-len,t));if(Math.abs(t-T.start)<.01)return;T.start=t;layout();
  const v=$('#vtv');try{if(!v.seeking)v.currentTime=t}catch(e){}}
 function clear(){const v=$('#vtv');if(v){v.pause();v.removeAttribute('src');v.load()}if(T&&T.url)URL.revokeObjectURL(T.url);T=null;$('#vt').hidden=true}
 function load(f){clear();T={file:f,url:URL.createObjectURL(f),dur:0,start:0};const v=$('#vtv'),mine=T;
  $('#vt').hidden=false;$('#vtbar').hidden=true;$('#vtt').textContent='';$('#vtl').textContent='Reading the video…';
  v.onloadedmetadata=()=>{if(T!==mine)return;const d=v.duration;
   if(!isFinite(d)||d<=0){bad();return}
   mine.dur=d;const long=d>MAXS+.5;$('#vtbar').hidden=!long;
   $('#vtl').textContent=long?'Choose the 3 minutes to post':'The whole video will be posted';
   $('#vtn').textContent=long?'Drag the gold box along the video to choose where the 3 minutes start. Tap the picture to preview.':'Tap the picture to preview.';
   if(!long)$('#vtt').textContent=mmss(d);else layout();
   $('#pfn').textContent='Video selected · '+mmss(d)+(long?' · choose the 3 minutes below.':'.')+(fileCount()>1?' (Photos are ignored: a post is either one video or photos.)':'')};
  v.onerror=()=>{if(T===mine)bad()};
  v.src=mine.url}
 const fileCount=()=>$('#pf').files.length;
 function bad(){toast('This video format cannot be opened by your browser. Try an MP4 video.',6000);clear();try{$('#pf').value=''}catch(e){}$('#pf').onchange()}
 /* called by app.js when the file box changes: true = a video is chosen (app.js then skips its own photo handling) */
 function pick(){const v=[...$('#pf').files].find(isVid);if(!v){if(T)clear();return false}if(!T||T.file!==v)load(v);return true}
 const has=()=>!!T&&T.dur>0&&[...$('#pf').files].indexOf(T.file)>-1;
 (function wire(){
  const win=$('#vtwin'),bar=$('#vtbar'),pv=$('#vtv');
  win.addEventListener('pointerdown',e=>{if(!T||!T.dur)return;e.preventDefault();try{win.setPointerCapture(e.pointerId)}catch(x){}
   const r=bar.getBoundingClientRect(),x0=e.clientX,s0=T.start;
   const mv=ev=>setStart(s0+(ev.clientX-x0)/r.width*T.dur),up=()=>{win.removeEventListener('pointermove',mv);win.removeEventListener('pointerup',up);win.removeEventListener('pointercancel',up)};
   win.addEventListener('pointermove',mv);win.addEventListener('pointerup',up);win.addEventListener('pointercancel',up)});
  bar.addEventListener('pointerdown',e=>{if(e.target!==bar||!T||!T.dur)return;const r=bar.getBoundingClientRect();setStart((e.clientX-r.left)/r.width*T.dur-lenOf(T)/2)});
  win.addEventListener('keydown',e=>{if(!T)return;const k=e.key,st=e.shiftKey?10:1;if(k==='ArrowLeft'||k==='ArrowDown'){e.preventDefault();setStart(T.start-st)}else if(k==='ArrowRight'||k==='ArrowUp'){e.preventDefault();setStart(T.start+st)}else if(k==='Home'){e.preventDefault();setStart(0)}else if(k==='End'){e.preventDefault();setStart(1e9)}});
  pv.addEventListener('click',()=>{if(!T||!T.dur)return;const len=lenOf(T);if(pv.paused){if(pv.currentTime<T.start-.2||pv.currentTime>=T.start+len-.2)pv.currentTime=T.start;pv.play().catch(()=>{})}else pv.pause()});
  pv.addEventListener('timeupdate',()=>{if(T&&T.dur&&!pv.paused&&pv.currentTime>=T.start+lenOf(T)){pv.pause();pv.currentTime=T.start}});
  $('#am').addEventListener('close',()=>{if(pv)pv.pause()})})();

 /* ---------------- getting the clip ready ---------------- */
 function posterAt(t0,t){return(async()=>{const v=document.createElement('video');v.muted=true;v.playsInline=true;v.preload='auto';v.src=t0.url;
  await once(v,'loadeddata');try{v.currentTime=Math.max(0,Math.min(t,(v.duration||t)-.1))}catch(e){}await once(v,'seeked').catch(()=>{});
  const s=Math.min(1,1000/Math.max(v.videoWidth,v.videoHeight)),c=document.createElement('canvas');c.width=Math.max(2,Math.round(v.videoWidth*s));c.height=Math.max(2,Math.round(v.videoHeight*s));
  c.getContext('2d').drawImage(v,0,0,c.width,c.height);v.removeAttribute('src');v.load();return c.toDataURL('image/jpeg',.82)})()}
 /* cut + compress: the chosen part plays (silently, through the browser's audio graph) onto a canvas and is recorded. It takes as long as the clip (up to 3 minutes) */
 function record(t0,len,prog){return(async()=>{
  if(!window.MediaRecorder)throw new Error('Your browser cannot cut videos. Choose a video that is 3 minutes or shorter (MP4), or use Chrome.');
  const v=document.createElement('video');v.playsInline=true;v.preload='auto';v.src=t0.url;await once(v,'loadeddata');
  const sc=Math.min(1,960/Math.max(v.videoWidth,v.videoHeight)),cw=Math.max(2,Math.round(v.videoWidth*sc/2)*2),ch=Math.max(2,Math.round(v.videoHeight*sc/2)*2);
  const cv=document.createElement('canvas');cv.width=cw;cv.height=ch;const cx=cv.getContext('2d');
  const mime=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));
  if(!mime||!cv.captureStream)throw new Error('Your browser cannot cut videos. Choose a video that is 3 minutes or shorter (MP4), or use Chrome.');
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
   const len=Math.min(MAXS,t0.dur-t0.start),nm=clean($('#pn').value,30),cp=clean($('#pp').value,140),cat=$('#pc').value;
   say('PREPARING…');const poster=await posterAt(t0,t0.start+Math.min(1,len/2));
   const clip=await prepare(t0,len,p=>say('PROCESSING VIDEO '+Math.round(p*100)+'%'));
   if(clip.blob.size>MAXB)throw new Error('This video is too large even after compression. Choose a shorter part.');
   if(BACKEND.enabled){const fid=await upload(clip.blob,clip.mime,p=>say('UPLOADING VIDEO '+Math.round(p*100)+'%'));say('PUBLISHING…');
    rr=await api(Object.assign({action:'video',videoId:fid,image:poster,dur:clip.dur,name:nm,category:cat,caption:cp},ADM?{key:ADK}:{}),{timeout:60000});if(!rr.ok){bad=rr.error;throw 0}}
   const local=URL.createObjectURL(clip.blob);      // this visitor sees it at once from the file in memory
   const it=rr&&rr.item?Object.assign(vp(rr.item),{thumb:poster,mid:poster,url:poster,vid:local}):{pid:'l'+Date.now().toString(36),cat:cat,title:cp||'Memory',cp:cp,name:nm,uid:'',badge:ADM?(ROLE=='founder'?'founder':'team'):'',cap:'By '+nm,date:new Date().toISOString(),thumb:poster,mid:poster,url:poster,vid:local,vdur:Math.round(clip.dur)};
   MEM.unshift(it);setCat('ALL');$('#am').close();$('#af').reset();clear();$('#pf').onchange();
   toast(BACKEND.enabled?'✅ تم رفع الفيديو بنجاح':'Added (demo: connect the Backend link to keep it).',10000)}
  catch(x){if(bad=='banned'&&rr)showBan(rr);else toast(x instanceof Error?x.message:typeof x==='string'?errText(x):bad?errText(bad):'Could not send. Try again.',7000)}
  finally{removeEventListener('beforeunload',hold);btn.disabled=false;spin.hidden=true;btxt.textContent='SUBMIT MEMORY'}}

 /* ---------------- the viewer: a video post ---------------- */
 let MUTED=false,ducked=false,dt=0;
 const icoSnd=m=>m?'🔇':'🔊';
 function applyMute(){RL.querySelectorAll('video').forEach(v=>{v.muted=MUTED});RL.querySelectorAll('.rl-snd').forEach(b=>{b.textContent=icoSnd(MUTED);b.setAttribute('aria-pressed',String(!MUTED));b.setAttribute('aria-label',MUTED?'Turn sound on':'Turn sound off')});audioCheck()}
 /* the site's background music steps aside while a video with sound is playing, and comes back after (unless the visitor turned it off) */
 function audioCheck(){clearTimeout(dt);dt=setTimeout(()=>{const any=VW.open&&[...RL.querySelectorAll('video')].some(v=>!v.paused&&!v.muted&&!v.ended);
  if(any&&!bg.paused){bg.pause();ducked=true}else if(!any&&ducked){ducked=false;if($('#sb').getAttribute('aria-pressed')==='true')bg.play().catch(()=>{})}},150)}
 function play(v){v.preload='auto';const p=v.play();if(p&&p.catch)p.catch(err=>{if(err&&err.name==='NotAllowedError'&&!v.muted){MUTED=true;applyMute();v.play().catch(()=>{})}})}
 /* plays the video of the post on screen, pauses and rewinds every other one (also when the viewer closes, switches to Grid, or the tab is hidden) */
 function sync(){const cur=VW.open&&VM==='view'&&!document.hidden?RL.children[GI]:null;
  RL.querySelectorAll('video').forEach(v=>{const it=v.closest('.rl-item');
   if(cur&&it===cur){if(v.paused&&!v._user&&!v.ended)play(v)}
   else{if(!v.paused)v.pause();if(it!==cur&&v.currentTime>0){try{v.currentTime=0}catch(e){}v._user=0;it&&it.classList.remove('vpaused')}}});
  audioCheck()}
 function player(m,item,media,ui){const v=document.createElement('video');v.className='rl-img rl-vid';v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');v.preload='metadata';v.poster=m.url;v.src=m.vid;v.muted=MUTED;v.disablePictureInPicture=true;v.draggable=false;
  const fill=el('i','');const bar=el('div','rl-vp');bar.append(fill);const pp=el('div','rl-pp','▶');pp.setAttribute('aria-hidden','true');
  const snd=el('button','rl-snd',icoSnd(MUTED));snd.type='button';snd.setAttribute('aria-pressed',String(!MUTED));snd.setAttribute('aria-label',MUTED?'Turn sound on':'Turn sound off');
  snd.onclick=e=>{e.stopPropagation();MUTED=!MUTED;applyMute();if(!MUTED&&v.paused&&!v._user)play(v)};
  ui.append(bar,pp,snd);
  v.addEventListener('timeupdate',()=>{if(v.duration>0)fill.style.width=Math.min(100,v.currentTime/v.duration*100)+'%'});
  ['play','pause','ended','volumechange'].forEach(t=>v.addEventListener(t,audioCheck));
  v.addEventListener('play',()=>item.classList.remove('vpaused'));
  v.addEventListener('ended',()=>{if(item!==RL.children[GI])return;      // AUTO: on to the next post when the video is over · otherwise it plays again
   if(AUTO&&!SOLO())rlStep(1);else{try{v.currentTime=0}catch(e){}play(v)}});
  v.addEventListener('error',()=>{if(m._vbad)return;m._vbad=1;                  // Drive refused to stream it directly: use Drive's own player instead
   if(m.vfid&&media.contains(v)){const f=document.createElement('iframe');f.className='rl-img rl-vid';f.allow='autoplay; fullscreen';f.src='https://drive.google.com/file/d/'+m.vfid+'/preview';v.replaceWith(f);snd.hidden=bar.hidden=true}rlSched()});
  let tp=0;v.addEventListener('click',()=>{if(tp){clearTimeout(tp);tp=0;return}      // one tap = pause / play · a quick second tap is the "like" gesture (handled in app.js), so it does not pause
   tp=setTimeout(()=>{tp=0;if(v.paused){v._user=0;play(v)}else{v._user=1;v.pause();item.classList.add('vpaused')}},280)});
  return v}
 return{pick,has,submit,sync,player,mmss}
})();
