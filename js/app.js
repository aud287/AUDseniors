/* ================= SETTINGS — edited from Blogger > Layout (no code needed) ================= */
const G=k=>String((window.SITE||{})[k]||'').trim();
const LN=k=>G(k).split(/\n+/).map(x=>x.trim()).filter(Boolean);
const KV=k=>{const o={};LN(k).forEach(x=>{const i=x.indexOf('=');if(i>0)o[x.slice(0,i).trim().toLowerCase()]=x.slice(i+1).trim()});return o};
const PP=k=>LN(k).map(x=>x.split('|').map(t=>t.trim()));
const DR=(u,img)=>{const m=/drive\.google\.com.*?(?:\/d\/|[?&]id=)([\w-]+)/.exec(u||'');return m?(img?'https://lh3.googleusercontent.com/d/'+m[1]+'=w800':'https://drive.google.com/uc?export=download&id='+m[1]):u};
const CONFIG={className:G('name')||"CLASS OF 2026",graduationDate:G('date')||"2026-12-19T13:00:00",logo:DR(G('logo'),1),frame:DR(G('frame'),1),frameOpens:G('frameOpens'),backgroundMusic:DR(G('music')),graduationSound:DR(G('gradsound')),socials:KV('social')};
const BU=G('backend'),BACKEND={enabled:/^https:\/\/script\.google\.com\//i.test(BU),apiUrl:BU};
const MS=KV('milestones'),COUNTDOWN_MILESTONES={};Object.keys(MS).forEach(k=>COUNTDOWN_MILESTONES[+k]={sound:DR(MS[k])});
const EVENTS=PP('events').filter(a=>a.length>2).map(a=>({e:a[0],t:a[1],d:a[2].replace(' ','T'),l:a[3]||'',x:a[4]||''}));
const POLLS=PP('polls').filter(a=>a.length>2).map(a=>({q:a[0],o:a.slice(1).map(x=>[x,0])}));
const ANNOUNCEMENTS=PP('announce').filter(a=>a.length>3).map(a=>({title:a[0],text:a[1],image:DR(a[2],1),start:a[3],end:a[4]||'2099-12-31'}));
/* Board items. url = full photo, thumb = small photo (used on board), e = emoji shown until you add a photo, ev:1 = event note */
const MEMORIES=[
{cat:"FIRST DAY",title:"Day one. White coats!",date:"2020-10-04",e:"🎒",url:"",thumb:""},
{ev:1,cat:"SENIOR JACKET",title:"Senior Jacket Day",date:"2026-10-12",e:"🧥",cap:"The jackets are finally here."},
{cat:"FRIENDS",title:"The study squad",date:"2022-03-14",e:"📚"},
{cat:"OSCE",title:"Survived the OSCE",date:"2023-06-20",e:"🩺"},
{cat:"HOSPITAL",title:"Night shift snacks",date:"2025-01-09",e:"🍕"},
{ev:1,cat:"GRADUATION",title:"Last Lecture",date:"2026-11-28",e:"🎤",cap:"One more time, doctors."},
{cat:"TRIPS",title:"Sunset trip",date:"2023-08-18",e:"🌅"},
{cat:"PARTIES",title:"Party time",date:"2024-02-02",e:"🎉"},
{cat:"FUNNY MOMENTS",title:"Caught mid-yawn",date:"2024-11-11",e:"😴"},
{ev:1,cat:"EVENTS",title:"Photo Session",date:"2026-12-05",e:"📸",cap:"Smile. It's the last one."},
{cat:"CLINICAL YEARS",title:"First real patient",date:"2025-05-05",e:"🏥"},
{cat:"LECTURES",title:"Back row legends",date:"2021-04-21",e:"🎓"},
{cat:"FRIENDS",title:"Coffee run",date:"2025-09-15",e:"☕"},
{ev:1,cat:"PARTIES",title:"Graduation Party",date:"2026-12-17",e:"🥳",cap:"Dress up. Dance."},
{cat:"GRADUATION",title:"Almost there",date:"2026-09-20",e:"🏁"},
{cat:"FIRST DAY",title:"Lost in the anatomy lab",date:"2020-10-06",e:"🦴"}
];
const MESSAGES=[
{id:"demo1",name:"Dr. Sleepy",message:"We came in as strangers and we leave as a family. 💛",status:"approved",date:"2026-09-19T21:40:00"},
{id:"demo2",name:"Anonymous",message:"Thank you for every 3 AM study call.",status:"approved",date:"2026-09-17T02:15:00"},
{id:"demo3",name:"Coffee Addict",message:"Still can't believe we actually made it!",status:"approved",date:"2026-09-12T18:05:00"},
{id:"demo4",name:"Last Row",message:"Best chaos of my life. Never change.",status:"approved",date:"2026-09-05T14:30:00"},
{id:"demo5",name:"Pending",message:"This one is waiting for approval.",status:"pending",date:"2026-09-20T09:00:00"}
];
/* ================= ENGINE ================= */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
const ok=u=>!!u&&!/^YOUR_/i.test(u),safe=u=>/^(https?:\/\/|data:image\/|\.{0,2}\/|assets\/)/i.test(u||"");
const clean=(s,n)=>String(s||"").replace(/[<>]/g,"").replace(/javascript:/gi,"").trim().slice(0,n);
const fmt=d=>{if(!d)return"";const t=new Date(d);return isNaN(t)?String(d):t.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})};   // a placeholder like SOON is shown as written instead of "Invalid Date"
const ic=(v,c)=>{v=String(v||'');if(/^[a-z0-9_-]+$/.test(v)){const i=new Image();i.src='assets/icons/'+v+'.webp';i.alt='';i.loading='lazy';i.decoding='async';i.className='i3 '+(c||'');return i}return el('span',c||'',v)};
const RM=matchMedia('(prefers-reduced-motion:reduce)').matches,GT=new Date(CONFIG.graduationDate).getTime(),gd=new Date(GT);
document.documentElement.classList.add('js');
/* the toast is a popover so it sits in the browser's top layer: without that, a message shown while the full gallery (a modal dialog) is open would be hidden behind it */
function toast(t,ms){const x=$('#toast');x.textContent=t;
 try{if(x.showPopover){if(!x.hasAttribute('popover'))x.setAttribute('popover','manual');if(x.matches(':popover-open'))x.hidePopover();x.showPopover()}}catch(e){}
 void x.offsetWidth;x.classList.add('on');clearTimeout(x._t);
 x._t=setTimeout(()=>{x.classList.remove('on');x._t=setTimeout(()=>{try{if(x.matches(':popover-open'))x.hidePopover()}catch(e){}},500)},ms||3200)}
$$('.cn').forEach(e=>e.textContent=CONFIG.className);
$$('.gd').forEach(e=>e.textContent=gd.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}).toUpperCase());
$$('.gs').forEach(e=>e.textContent=gd.toLocaleDateString('en-GB').replace(/\//g,'.'));
$$('.class-logo').forEach(d=>{if(ok(CONFIG.logo)){const i=new Image();i.decoding='async';i.src=CONFIG.logo;i.alt='Class logo';d.append(i)}else{d.textContent='YOUR LOGO';d.classList.add('placeholder')}});

/* ---- audio + cinematic intro (runs on EVERY load; music starts automatically, or on the first tap if the browser blocks it) ---- */
const bg=new Audio();bg.loop=true;bg.volume=.55;const HM=ok(CONFIG.backgroundMusic);if(HM)bg.src=CONFIG.backgroundMusic;
const LINES=G('intro').split(/\n+/).map(x=>x.trim()).filter(Boolean);
let started=0,gone=0;
function snd(v){$('#sb').textContent=v?'🔊':'🔇';$('#sb').setAttribute('aria-pressed',v?'true':'false');if(v)bg.play().catch(()=>snd(0));else bg.pause()}
function enter(){if(gone)return;gone=1;const i=$('#intro');if(!i){document.body.classList.remove('lock');return}i.classList.add('out');document.body.classList.remove('lock');setTimeout(()=>{i.remove();mile()},450)}
function begin(){if(started)return;started=1;let i=0;const box=$('#il');
 (function next(){if(gone)return;if(i>=LINES.length){setTimeout(enter,300);return}const last=i==LINES.length-1;box.replaceChildren(el('div','il-line'+(last?' last':''),LINES[i++]));setTimeout(next,last?1500:950)})()}
$('#skip').onclick=enter;$('#sb').onclick=()=>snd(bg.paused);
if(HM)bg.play().then(()=>snd(1)).catch(()=>{});
begin();

/* ---- effects ---- */
function burst(n){if(RM)return;const c=$('#cf'),col=['#8f2440','#c8a25a','#e58a50','#f3cfd0','#6b1a2e'];
 for(let i=0;i<n;i++){const e=el('i');e.style.cssText='left:'+Math.random()*100+'vw;animation-duration:'+(2.4+Math.random()*2.4)+'s;animation-delay:'+Math.random()*.8+'s;background:'+col[i%5];if(i%12==0){e.textContent='🎓';e.style.cssText+=';background:none;font-size:24px;width:auto;height:auto'}c.append(e)}
 setTimeout(()=>c.replaceChildren(),6500)}
if(!RM){const f=$('#fx'),n=innerWidth<700?9:18;for(let i=0;i<n;i++){const s=el('i','sp',['✦','✧','✦','🎓'][i%4]);s.style.cssText='left:'+Math.random()*100+'%;top:'+Math.random()*100+'%;font-size:'+(10+Math.random()*14)+'px;animation-delay:'+Math.random()*6+'s;animation-duration:'+(5+Math.random()*5)+'s';f.append(s)}}

/* ---- countdown + graduation mode ---- */
let grad=0;
function tick(){const ms=GT-Date.now(),t=Math.max(0,Math.floor(ms/1e3));
 [['d',Math.floor(t/86400)],['h',Math.floor(t/3600)%24],['m',Math.floor(t/60)%60],['s',t%60]].forEach(([k,v])=>$('#'+k).textContent=k=='d'?v:String(v).padStart(2,'0'));
 if(ms<=0&&!grad){grad=1;document.body.classList.add('grad');$('#ht').textContent='WE DID IT.';$('#hs').textContent=gd.toLocaleDateString('en-GB').replace(/\//g,'.')+' · THE CHAPTER IS COMPLETE.'}}
tick();setInterval(tick,1000);
/* ---- exam roadmap: horizontal path of stops, auto-checked once each exam day passes 2:00 PM ---- */
function examRoad(){const wrap=$('#stops');if(!wrap)return;
 const EX=PP('exams').filter(a=>a.length>2).map(a=>({icon:a[0],name:a[1],date:a[2]}));
 const now=Date.now();wrap.replaceChildren();let nextSet=0;
 EX.forEach(x=>{const end=new Date(x.date+'T14:00:00').getTime(),done=now>=end,isNext=!done&&!nextSet&&(nextSet=1);
  const s=el('div','stop'+(done?' done':isNext?' next':'')),b=el('div','badge');
  b.append(ic(x.icon));if(done)b.append(el('span','chk','✓'));
  s.append(b,el('b','',x.name),el('small','',fmt(x.date)));wrap.append(s)});
 const gdone=now>=GT,gs=el('div','stop grad'+(gdone?' done':'')),gb=el('div','badge');
 gb.append(ic('grad_cap_flat'));if(gdone)gb.append(el('span','chk','✓'));
 gs.append(gb,el('b','','Graduation'),el('small','',fmt(CONFIG.graduationDate)));wrap.append(gs)}
examRoad();setInterval(examRoad,60000);
/* ---- milestones: every 10 days 100→40, then every day 30→0; once per device ---- */
function mile(){const d=Math.max(0,Math.ceil((GT-Date.now())/864e5));
 if(!(d<=30||(d<=100&&d%10==0)))return;
 try{if(localStorage.getItem('ms'+d))return;localStorage.setItem('ms'+d,'1')}catch(e){}
 const m=COUNTDOWN_MILESTONES[d]||{},o=$('#ov');
 $('#ot').textContent=m.title||(d==0?'WE DID IT!':d==1?'TOMORROW!':d+' DAYS TO GO!');
 $('#op').textContent=m.message||(d==0?'THE CHAPTER IS COMPLETE.':'THE FINAL CHAPTER IS GETTING CLOSER.');
 o.classList.add('on');burst(d?80:220);
 const u=m.sound||(d==0?CONFIG.graduationSound:"");if(ok(u)){try{new Audio(u).play().catch(()=>{})}catch(e){}}
 setTimeout(()=>o.classList.remove('on'),d?4500:7000)}
$('#ov').onclick=e=>e.currentTarget.classList.remove('on');

/* ---- nav / share ---- */
$('#mb').onclick=()=>{const o=$('#nv').classList.toggle('open');$('#mb').setAttribute('aria-expanded',String(o))};
$('#nv').onclick=()=>$('#nv').classList.remove('open');
$('#sh').onclick=()=>{const u={title:document.title,url:location.href};if(navigator.share)navigator.share(u).catch(()=>{});else if(navigator.clipboard)navigator.clipboard.writeText(u.url).then(()=>toast('Link copied!'))};

/* ---- CORKBOARD: photos + events pinned with string; board shows a fixed set, "more" opens a flip-through gallery ---- */
let MEM=MEMORIES,cat='ALL',sortDir='new';const BOARD_N=12;
/* every photo gets a stable id: backend photos already have one; config/demo photos get one from a hash of url+title+date */
const h32=t=>{let h=2166136261;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(36)};
const pidOf=m=>m.pid||(m.pid=m.id||('c'+h32(String(m.url||m.thumb||'')+'|'+(m.title||'')+'|'+(m.date||''))));
function setCat(t){cat=t;$$('.chip').forEach(x=>x.classList.toggle('on',x.dataset.cat==t));board()}
function setSort(v){sortDir=v;$('#psort').value=v;board()}
function openAdd(){$('#am').showModal()}
/* small promise-based confirm (replaces the browser confirm box) */
function ask(t,p,okLabel){return new Promise(res=>{const d=$('#ask');$('#askt').textContent=t;$('#askp').textContent=p||'';d.querySelector('.dng').textContent=okLabel||'DELETE';d.returnValue='';d.onclose=()=>res(d.returnValue==='ok');d.showModal()})}
$$('dialog.sheet').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));
const byDate=(a,b)=>{const A=String(a.date||''),B=String(b.date||'');return sortDir=='new'?(A<B?1:A>B?-1:0):(A<B?-1:A>B?1:0)};
const list=()=>MEM.filter(m=>cat=='ALL'||(m.cat||'').toUpperCase()==cat).slice().sort(byDate);
/* Google Drive sometimes refuses or drops a picture for a moment: try again a few times (1s, 4s, 9s) before giving up; fail() runs if it still does not load */
function retryImg(g,u,fail){if(!/^https?:/i.test(u||'')){g.addEventListener('error',()=>fail&&fail());return{reset(){}}}let n=0;
 g.addEventListener('error',()=>{if(++n>3){fail&&fail();return}setTimeout(()=>{g.removeAttribute('src');g.src=u},600*n*n+400)});return{reset(){n=0}}}
function pic(m,i,big){const u=big?m.url:(m.thumb||m.url);
 if(safe(u)){const g=new Image();g.alt=m.title||'Memory photo';g.decoding='async';if(!big){g.loading=i<4?'eager':'lazy';if(i<2)g.fetchPriority='high'}retryImg(g,u);g.src=u;return g}
 const s=el('span','em',m.e||'📷'),h=(i*47)%360;s.style.background='linear-gradient(135deg,hsl('+h+' 70% 84%),hsl('+(h+40)%360+' 65% 72%))';return s}
function slot(m,i,L){const s=el('div','slot'),b=el('button',m.ev?'note':'pol');b.type='button';
 b.style.setProperty('--r',(((i*53)%9)-4)*.9+'deg');s.style.animationDelay=(i%BOARD_N)*.09+'s';
 b.setAttribute('aria-label',(m.ev?'Event: ':'Photo: ')+m.title);
 if(m.ev)b.append(ic(m.e||'📌','em'),el('small','',fmt(m.date)),el('b','',m.title));
 else{const p=el('div','ph'),r=el('div','mrow');p.append(pic(m,i));r.append(el('span','dt',fmt(m.date)));b.append(el('span','tag',m.cat||''),p,el('div','cap',m.title),r);s.dataset.pid=pidOf(m)}
 b.onclick=()=>m.ev?openLB([m],0):openGallery('view',m);s.append(el('i','pin'),b);if(m.id){const d=el('button','del','✕');d.type='button';d.setAttribute('aria-label','Delete photo');d.onclick=ev=>{ev.stopPropagation();del('photo',m.id)};s.append(d);
  if(m.bn){const k=el('button','banb','🚫');k.type='button';k.setAttribute('aria-label','Block this device');k.title='Block this device';k.onclick=ev=>{ev.stopPropagation();openBan('photo',m)};s.append(k)}}return s}
function strings(){const B=$('#board'),r=B.getBoundingClientRect(),P=$$('#grid .pin').map(p=>{const q=p.getBoundingClientRect();return[q.left+q.width/2-r.left-B.clientLeft,q.top+q.height/2-r.top-B.clientTop]});let h='';
 const ln=(a,b,c)=>{h+='<path pathLength="1" stroke="'+c+'" d="M'+a[0]+' '+a[1]+'Q'+(a[0]+b[0])/2+' '+((a[1]+b[1])/2+Math.hypot(a[0]-b[0],a[1]-b[1])*.12+14)+' '+b[0]+' '+b[1]+'"/>'};
 P.forEach((p,i)=>{if(P[i+1])ln(p,P[i+1],'#b3202e');if(i%2==0&&P[i+2])ln(p,P[i+2],'#2f6b45')});$('#str').innerHTML=h}
function board(){const L=list(),n=Math.min(BOARD_N,L.length),g=$('#grid');g.replaceChildren();
 L.slice(0,n).forEach((m,i)=>g.append(slot(m,i,L)));
 $('#cnt').textContent=n+' / '+L.length+' memories';$('#more').hidden=!L.some(m=>!m.ev);requestAnimationFrame(strings)}
$('#more').onclick=()=>openGallery('grid');
$('#psort').onchange=e=>setSort(e.target.value);
function chipsR(){const c=$('#chips'),p=$('#pc');[c,p].forEach(x=>x.replaceChildren());
 const cs=[...new Set([...G('cats').split(/[,\n]/).map(x=>x.trim().toUpperCase()),...MEM.map(m=>(m.cat||'').toUpperCase())].filter(Boolean))];
 ['ALL',...cs].forEach(t=>{const b=el('button','chip'+(t==cat?' on':''),t);b.type='button';b.dataset.cat=t;b.onclick=()=>setCat(t);c.append(b);if(t!='ALL')p.append(new Option(t,t))})}
let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(strings,200)});addEventListener('load',strings);
/* ---- memories viewer: one photo at a time (swipe / arrows / filmstrip) or a grid of all of them; follows the filter ---- */
let VALL=[],GI=0,VM='view',VC='ALL',VS='new',VG=false;                          // list shown · current index · mode · filter · sort · grid built?
const VW=$('#vw'),vNorm=m=>(m.cat||'').toUpperCase();
function vList(){const A=String,k=(a,b)=>{const x=A(a.date||''),y=A(b.date||'');return VS=='new'?(x<y?1:x>y?-1:0):(x<y?-1:x>y?1:0)};
 return MEM.filter(m=>!m.ev&&(VC=='ALL'||vNorm(m)==VC)).slice().sort(k)}
function vChips(){const all=MEM.filter(m=>!m.ev),n={};all.forEach(m=>{const c=vNorm(m);if(c)n[c]=(n[c]||0)+1});
 const box=$('#vwchips');box.replaceChildren();
 [['ALL',all.length]].concat(Object.keys(n).map(c=>[c,n[c]])).forEach(([c,k])=>{const b=el('button','vw-chip');b.type='button';b.setAttribute('aria-pressed',String(c==VC));
  b.append(el('span','',c),el('i','',String(k)));b.onclick=()=>{if(VC==c)return;VC=c;vRefresh()};box.append(b)})}
/* staff tools for one photo: delete it / block the device that sent it. Same actions as on the board, but reachable from every place a photo is shown in the gallery.
   CSS shows them only while a staff link is active (body.adm), so they also appear if the key is accepted after the gallery was opened. Photos without an id (set in config.js) have nothing to delete. */
function staffTools(m,cls,words){if(!m.id)return null;const w=el('div',cls);
 const d=el('button','vw-del',words?'✕ Delete photo':'✕');d.type='button';d.setAttribute('aria-label','Delete photo');d.title='Delete photo';d.onclick=ev=>{ev.stopPropagation();del('photo',m.id)};w.append(d);
 if(m.bn){const k=el('button','vw-ban',words?'🚫 Block device':'🚫');k.type='button';k.setAttribute('aria-label','Block this device');k.title='Block this device';k.onclick=ev=>{ev.stopPropagation();openBan('photo',m)};w.append(k)}
 return w}
function vGo(d){if(VALL.length<2)return;GI=(GI+d+VALL.length)%VALL.length;vFill()}
function vFill(){const m=VALL[GI];if(!m)return;const f=$('#vwfig'),solo=VW.classList.contains('solo');f.replaceChildren();
 const im=m.ev?ic(m.e||'🎓','em'):pic(m,GI,1);im.classList.add('vw-img');f.classList.remove('ld');
 if(im.tagName=='IMG'&&!im.complete){f.classList.add('ld');const end=()=>f.classList.remove('ld');im.addEventListener('load',end);im.addEventListener('error',()=>setTimeout(end,4000))}
 f.append(im);
 const cap=$('#vwcap');cap.replaceChildren();if(m.title)cap.append(el('h3','',m.title));if(m.cap&&m.cap!==m.title)cap.append(el('p','',m.cap));
 const meta=[m.cat,fmt(m.date)].filter(Boolean).join('  ·  ');if(meta)cap.append(el('small','',meta));
 if(!solo){const t=staffTools(m,'vw-adm',1);if(t)cap.append(t)}
 if(!solo){$('#vwcount').textContent=(GI+1)+' / '+VALL.length;
  const s=$('#vwstrip');[...s.children].forEach((b,i)=>{const on=i===GI;b.classList.toggle('on',on);if(on)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current')});
  const cur=s.children[GI];if(cur)s.scrollTo({left:cur.offsetLeft-(s.clientWidth-cur.offsetWidth)/2,behavior:'smooth'})}
 [1,-1].forEach(d=>{const n=VALL[(GI+d+VALL.length)%VALL.length],u=n&&!n.ev&&n.url;if(safe(u))new Image().src=u})}
function vStrip(){const s=$('#vwstrip');s.replaceChildren();
 VALL.forEach((m,i)=>{const b=el('button');b.type='button';b.setAttribute('aria-label','Photo '+(i+1)+(m.title?': '+m.title:''));
  const g=pic(m,i);g.loading=i<12?'eager':'lazy';g.fetchPriority='low';b.append(g);b.onclick=()=>{GI=i;vFill()};s.append(b)})}
function vGrid(){const g=$('#vwgrid');g.replaceChildren();let last='';VG=true;
 VALL.forEach((m,i)=>{const d=new Date(m.date),k=isNaN(d)?'':d.toLocaleDateString('en-GB',{month:'long',year:'numeric'});
  if(k&&k!==last){last=k;g.append(el('h4','vw-h',k))}
  const b=el('button','vw-cell'+(i===GI?' on':''));b.type='button';b.setAttribute('aria-label','Open photo '+(i+1)+(m.title?': '+m.title:''));
  const p=pic(m,i);p.loading=i<18?'eager':'lazy';b.append(p);if(m.cat)b.append(el('span','vw-cat',m.cat));if(m.title)b.append(el('span','vw-cp',m.title));
  b.onclick=()=>{GI=i;vMode('view')};const w=el('div','vw-w');w.append(b);const t=staffTools(m,'vw-tools');if(t)w.append(t);g.append(w)})}
function vMode(m){VM=m;const grid=m=='grid';$('#vwview').hidden=grid;$('#vwgrid').hidden=!grid;
 $('#vwmv').setAttribute('aria-pressed',String(!grid));$('#vwmg').setAttribute('aria-pressed',String(grid));
 if(grid){if(!VG)vGrid();$$('#vwgrid .vw-cell').forEach((b,i)=>b.classList.toggle('on',i===GI));$('#vwcount').textContent=VALL.length+(VALL.length==1?' photo':' photos');
  const c=$('#vwgrid .vw-cell.on');if(c)requestAnimationFrame(()=>c.scrollIntoView({block:'center'}))}
 else vFill()}
function vRefresh(near){const keep=VALL[GI]&&pidOf(VALL[GI]);VALL=vList();const at=keep?VALL.findIndex(m=>pidOf(m)===keep):-1;GI=at<0?Math.max(0,Math.min(near||0,VALL.length-1)):at;      // near = where the photo that just went away was, so the viewer lands on its neighbour
 vChips();vStrip();VG=false;$('#vwgrid').replaceChildren();$('#vwsort').value=VS;
 const none=!VALL.length;$('#vwstage').hidden=none;
 if(none){$('#vwfig').replaceChildren();$('#vwcap').replaceChildren(el('p','','No photos in this category yet.'));$('#vwcount').textContent='0 photos'}
 vMode(VM)}
function openGallery(mode,m){VW.classList.remove('solo');VC=cat;VS=sortDir;VALL=vList();
 if(m){const at=VALL.findIndex(x=>pidOf(x)===pidOf(m));GI=at<0?0:at}else GI=0;
 VM=mode;vChips();vStrip();VG=false;$('#vwsort').value=VS;vMode(mode);vOpen()}
function openLB(L,i){if(!L.length)return;VW.classList.add('solo');VALL=L;GI=((i%L.length)+L.length)%L.length;$('#vwview').hidden=false;$('#vwgrid').hidden=true;$('#vwstage').hidden=false;vFill();vOpen()}
function vOpen(){if(VW.open)return;document.body.style.overflow='hidden';try{history.pushState({vw:1},'')}catch(e){}VW.showModal()}
VW.addEventListener('close',()=>{document.body.style.overflow='';if(history.state&&history.state.vw)history.back()});
addEventListener('popstate',()=>{if(VW.open)VW.close()});
$('#vwx').onclick=()=>VW.close();$('#vwp').onclick=()=>vGo(-1);$('#vwn').onclick=()=>vGo(1);
$('#vwmv').onclick=()=>vMode('view');$('#vwmg').onclick=()=>vMode('grid');
$('#vwsort').onchange=e=>{VS=e.target.value;vRefresh()};
(function(){const t=$('#vwstage');let sx=0,sy=0,on=0;                     // swipe left / right on the photo
 t.addEventListener('touchstart',e=>{const p=e.touches[0];sx=p.clientX;sy=p.clientY;on=1},{passive:true});
 t.addEventListener('touchend',e=>{if(!on)return;on=0;const p=e.changedTouches[0],dx=p.clientX-sx,dy=p.clientY-sy;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.2)vGo(dx<0?1:-1)},{passive:true})})();
$$('.cl,.x').forEach(b=>b.onclick=()=>b.closest('dialog').close());
addEventListener('keydown',e=>{if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;if(VW.open&&VM=='view')vGo(e.key=='ArrowLeft'?-1:1)});
$('#add').onclick=openAdd;
$('#af').onsubmit=async e=>{e.preventDefault();const f=$('#pf').files[0];if(!f||!/^image\//.test(f.type))return toast('Choose an image.');
 const btn=$('#afbtn'),spin=$('#afspin'),btxt=$('#afbtxt');btn.disabled=true;spin.hidden=false;btxt.textContent='UPLOADING…';let bad='';
 let rr=null;
 try{const [img,bc]=await Promise.all([shrink(f),api({action:'bancheck'},{tries:1,timeout:15000})]);          // is this device blocked from photos? (asked while the photo is being resized, so no extra wait)
  if(bc&&bc.photo){showBan(bc.photo);return}
  const nm=clean($('#pn').value,30),cp=clean($('#pp').value,140),r=rr=await api({action:'photo',name:nm,category:$('#pc').value,caption:cp,image:img},{timeout:60000});
  if(!r.ok&&!r.demo){bad=r.error;throw 0}
  const mine={};
  MEM.unshift(r.item?Object.assign(vp(r.item),{thumb:img,mid:img,url:img}):{pid:'l'+Date.now().toString(36),cat:$('#pc').value,title:cp||'Memory',cp:cp,name:nm,uid:mine.uid||'',cap:'By '+nm,date:new Date().toISOString(),thumb:img,mid:img,url:img});
  setCat('ALL');$('#am').close();e.target.reset();
  toast(r.demo?'Added (demo: connect the Backend link to keep it).':'✅ تم رفع الصورة بنجاح',10000)}catch(x){if(bad=='banned'&&rr)showBan(rr);else toast(bad?errText(bad):'Could not send. Try again.')}
 finally{btn.disabled=false;spin.hidden=true;btxt.textContent='SUBMIT MEMORY'}};

/* ---- frame tool: drag/pinch your photo to fit under the class frame, download as one PNG ---- */
(function(){
 const stage=$('#frameStage'),canvas=$('#frameCanvas');if(!stage||!canvas)return;
 const hint=$('#frameHint'),fileInp=$('#frameFile'),zoomRow=$('#zoomRow'),zoomSlider=$('#frameZoom'),dlBtn=$('#frameDownload');
 const ctx=canvas.getContext('2d'),S=canvas.width;
 const frameImg=new Image();frameImg.crossOrigin='anonymous';let frameReady=false;
 if(ok(CONFIG.frame)){frameImg.onload=()=>{frameReady=true;draw()};
  if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>{if(es[0].isIntersecting){frameImg.src=CONFIG.frame;io.disconnect()}},{rootMargin:'600px'});io.observe(stage)}
  else frameImg.src=CONFIG.frame}
 let img=null,baseScale=1,zoom=1,offX=0,offY=0,drag=null,pinchDist=0,pinchZoom=1,pinchAt=[0,0];
 const pointers=new Map();
 function clampOff(){const dw=img.width*baseScale*zoom,dh=img.height*baseScale*zoom;
  offX=Math.min(0,Math.max(S-dw,offX));offY=Math.min(0,Math.max(S-dh,offY))}
 function draw(){ctx.clearRect(0,0,S,S);
  if(img){const dw=img.width*baseScale*zoom,dh=img.height*baseScale*zoom;ctx.drawImage(img,offX,offY,dw,dh)}
  else{ctx.fillStyle='#f4e6d2';ctx.fillRect(0,0,S,S)}
  if(frameReady)ctx.drawImage(frameImg,0,0,S,S)}
 function loadPhoto(file){if(!file||!/^image\//.test(file.type))return;
  const url=URL.createObjectURL(file),i=new Image();
  i.onload=()=>{img=i;baseScale=Math.max(S/i.width,S/i.height);zoom=1;
   offX=(S-i.width*baseScale)/2;offY=(S-i.height*baseScale)/2;
   hint.hidden=true;zoomRow.hidden=false;dlBtn.hidden=false;zoomSlider.value=1;
   URL.revokeObjectURL(url);draw()};
  i.src=url}
 fileInp.onchange=()=>loadPhoto(fileInp.files[0]);
 zoomSlider.oninput=()=>{if(!img)return;setZoom(+zoomSlider.value,S/2,S/2)};
 function setZoom(nz,cx,cy){nz=Math.min(3,Math.max(1,nz));const oldScale=baseScale*zoom,
  ix=(cx-offX)/oldScale,iy=(cy-offY)/oldScale,newScale=baseScale*nz;
  offX=cx-ix*newScale;offY=cy-iy*newScale;zoom=nz;clampOff();draw()}
 function toCanvasXY(clientX,clientY){const r=canvas.getBoundingClientRect();
  return[(clientX-r.left)*(S/r.width),(clientY-r.top)*(S/r.height)]}
 stage.addEventListener('pointerdown',e=>{if(!img)return;stage.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId,[e.clientX,e.clientY]);
  if(pointers.size===1){const[x,y]=toCanvasXY(e.clientX,e.clientY);drag={x,y,offX,offY}}
  else if(pointers.size===2){drag=null;const pts=[...pointers.values()];
   pinchDist=Math.hypot(pts[0][0]-pts[1][0],pts[0][1]-pts[1][1]);pinchZoom=zoom;
   const mx=(pts[0][0]+pts[1][0])/2,my=(pts[0][1]+pts[1][1])/2;pinchAt=toCanvasXY(mx,my)}});
 stage.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;
  pointers.set(e.pointerId,[e.clientX,e.clientY]);
  if(pointers.size===2){const pts=[...pointers.values()],
   d=Math.hypot(pts[0][0]-pts[1][0],pts[0][1]-pts[1][1]),
   mx=(pts[0][0]+pts[1][0])/2,my=(pts[0][1]+pts[1][1])/2;
   zoomSlider.value=Math.min(3,Math.max(1,pinchZoom*(d/pinchDist)));
   setZoom(+zoomSlider.value,pinchAt[0],pinchAt[1])}
  else if(pointers.size===1&&drag){const[x,y]=toCanvasXY(e.clientX,e.clientY);
   offX=drag.offX+(x-drag.x);offY=drag.offY+(y-drag.y);clampOff();draw()}});
 function endPointer(e){pointers.delete(e.pointerId);if(pointers.size<2)pinchDist=0;if(pointers.size===0)drag=null}
 ['pointerup','pointercancel','pointerleave'].forEach(ev=>stage.addEventListener(ev,endPointer));
 dlBtn.onclick=()=>{if(!img)return;const a=el('a');a.href=canvas.toDataURL('image/png');
  a.download=(CONFIG.className||'class').toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-frame.png';a.click()};
 draw();
})();

/* ---- frame lock: keep Frame Your Photo behind a "coming soon" overlay until the configured date ---- */
(function(){
 const wrap=$('#frameWrap'),lock=$('#frameLock');if(!wrap||!lock)return;
 const has=ok(CONFIG.frameOpens),openAt=has?new Date(CONFIG.frameOpens).getTime():0;
 if(has)$('#frameLockDate').textContent=fmt(CONFIG.frameOpens);
 function check(){const locked=has&&Date.now()<openAt;
  lock.hidden=!locked;wrap.classList.toggle('locked',locked);
  if(locked)wrap.setAttribute('inert','');else wrap.removeAttribute('inert')}
 check();if(has)setInterval(check,30000);
})();

/* ---- by the numbers: days since the start date (live) + infinity stats from the Layout gadget ---- */
const SINCE=new Date(G('since')||'2021-10-10').getTime();
(function(){const d=Math.max(0,Math.floor((Date.now()-SINCE)/864e5)),tot=Math.max(0,Math.round((GT-SINCE)/864e5)),n=x=>x.toLocaleString('en');
 $('#sd').dataset.v=d;$('#sd').textContent=n(d);$('#sn').textContent=n(tot)+' days from day one to graduation';
 $('#sy').textContent='SINCE '+new Date(SINCE).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}).toUpperCase();
 PP('stats').filter(a=>a.length>1).forEach(a=>{const c=el('div','card glass sc');const e=el('div','ei');e.append(ic(a[0]));c.append(e,el('b','nb',a[2]||'∞'),el('small','',a[1]));$('#sg').append(c)})})();
function count(){const e=$('#sd'),v=+e.dataset.v,t0=performance.now();if(RM)return;(function f(t){const k=Math.min(1,(t-t0)/1800);e.textContent=Math.round(v*(1-Math.pow(1-k,3))).toLocaleString('en');if(k<1)requestAnimationFrame(f)})(t0)}

/* ---- polls: one vote per device (remembered in this browser). After voting, the card shows your pick, the results and the total votes ---- */
const PKEY='aud_polls_v1',pollMem={},pollSeen={};
const pollGet=q=>{const k=h32(q);let o={};try{o=JSON.parse(localStorage.getItem(PKEY)||'{}')||{}}catch(e){}return o[k]||pollMem[k]||null};
const pollPut=(q,i,t)=>{const k=h32(q),v=[i,t];pollMem[k]=v;try{const o=JSON.parse(localStorage.getItem(PKEY)||'{}')||{};o[k]=v;localStorage.setItem(PKEY,JSON.stringify(o))}catch(e){}};
function pollsR(P){const w=$('#pl');w.replaceChildren();P.forEach((p,pi)=>{const c=el('div','card glass'),v=p.o.map(o=>o[1]),bs=[],m=el('small','pm'),k=h32(p.q);let mine=-1,msg='';c.append(el('h3','',p.q));
 const saved=()=>{const s=pollGet(p.q);if(!s)return -1;const j=p.o.findIndex(o=>o[0]===s[1]);return j>=0?j:(s[0]>=0&&s[0]<p.o.length?s[0]:-1)};
 const paint=()=>{if(mine>=0)v[mine]=Math.max(v[mine],pollSeen[k]||0,1);const tot=v.reduce((a,b)=>a+b,0),t=tot||1;
  bs.forEach((b,i)=>{const r=Math.round(v[i]/t*100);b.f.style.width=r+'%';b.r.textContent=r+'% · '+v[i]});
  m.replaceChildren(el('span','',msg),el('span','pt','Total votes: '+tot))};
 const lock=(i,fresh)=>{mine=i;msg=fresh?'Your vote has been recorded.':'You already voted here. One vote per device.';bs.forEach((x,j)=>{x.disabled=true;x.classList.toggle('sel',j===i)});paint()};
 p.o.forEach((o,i)=>{const b=el('button','opt'),f=el('i'),s=el('span'),r=el('em');b.type='button';s.append(el('em','',o[0]),r);b.append(f,s);b.f=f;b.r=r;bs.push(b);
  b.onclick=()=>{const j=mine>=0?mine:saved();if(j>=0){lock(j,0);return}         // already voted on this device (even from another tab): no second vote
   v[i]++;pollSeen[k]=v[i];pollPut(p.q,i,o[0]);lock(i,1);api({action:'vote',poll:pi,option:i})};c.append(b)});
 c.append(m);w.append(c);const j=saved();if(j>=0)lock(j,0)})}

/* ---- messages: one scroll box that shows 4 notes at a time (scroll up/down for the rest). Each note = avatar, name, time + a little date leaf ---- */
let msgSort='new',msgFirst=true;const MSG_SHOW=4;
/* NO LIMIT on notes. The first load carries the newest ~200; every older note is fetched automatically (100 at a time) as the reader scrolls toward the end of the box,
   and all of them at once when sorted oldest-first. Only a slice is DRAWN at a time (SHOW_STEP cards, more as you scroll) so thousands of notes stay fast. */
let MORE=0,CURSOR='',OLDER=[],WIN=[],PAGED=0,MLOAD=0,MFAIL=0,TOTAL=0;      // TOTAL = how many notes exist on the server (0 = not known)
let SORTED=[],SHOWN=0,SHOW_N=100;const SHOW_STEP=100;                      // SORTED = every loaded note in display order · SHOWN = how many of them are drawn
const isPin=m=>String(m.pin)==='1';                    // pinned message: always first, and it stays on screen while the wall scrolls
const sortedMsgs=M=>M.filter(m=>m.status!=='pending').slice().sort((a,b)=>{if(isPin(a)!==isPin(b))return isPin(a)?-1:1;const A=String(a.date||''),B=String(b.date||'');return msgSort=='new'?(A<B?1:A>B?-1:0):(A<B?-1:A>B?1:0)});
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const tmFmt=t=>t.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true});
const agoTxt=t=>{const s=(Date.now()-t)/1000;if(s<-60)return'';if(s<60)return'Just now';if(s<3600)return Math.floor(s/60)+' min ago';if(s<86400)return Math.floor(s/3600)+' h ago';if(s<604800)return Math.floor(s/86400)+' d ago';return''};
/* ---- reactions (Telegram style): tap a note -> a small picker; chips with counts sit under the text on the left; nothing shows until someone reacts ----
   one reaction per device per message (tap another to change it, tap yours again to remove it) · counts live on the backend, "mine" is remembered on this device */
const RXS=[['love','❤️','Love'],['haha','😂','Funny'],['sad','😢','Sad'],['party','🎉','Celebrate'],['grad','🎓','Graduation']];
const DEV=(()=>{let d='';try{d=localStorage.getItem('aud_dev')||''}catch(e){}
 if(!d){const m=document.cookie.match(/(?:^|; )aud_dev=([a-z0-9]{6,32})/);if(m)d=m[1]}                                 // this browser's anonymous id is kept in two places: clearing only one of them does not make it a "new device"
 if(!d){try{d=Array.from(crypto.getRandomValues(new Uint8Array(10)),x=>(x%36).toString(36)).join('')}catch(e){d='x'+Math.random().toString(36).slice(2,12)}}
 try{localStorage.setItem('aud_dev',d)}catch(e){}
 try{document.cookie='aud_dev='+d+';max-age=315360000;path=/;SameSite=Lax'+(location.protocol=='https:'?';Secure':'')}catch(e){}
 return d})();
const lsGet=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||d}catch(e){return d}},lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let RX={};const MINE=lsGet('aud_mrx',{}),RXT=lsGet('aud_mrt',{}),PEND=lsGet('aud_mrp',{});      // RX: message id -> {love:n,...} · MINE: my reaction per message · RXT: when I last changed it (a refresh cannot flicker it back for 30 s, even after a reload) · PEND: taps the server has not confirmed yet (id -> the reaction it had before); they are re-sent until confirmed
const saveMine=()=>{lsSet('aud_mrx',MINE);lsSet('aud_mrt',RXT);lsSet('aud_mrp',PEND)};
const msgById=id=>MSG.find(x=>String(x.id)===String(id));
/* ---- replies: a reply is a brand-new message that remembers which message it answers. Tap a note -> the picker (reactions + a reply arrow) -> the form says who you are answering.
   The new note shows a small "Reply to NAME · first 30 characters" line above its name (tap it to jump to the original); the original gets a small reply icon + count left of its reactions. ---- */
let REPLIES={};                                          // message id -> how many replies it has (rebuilt on every render)
const ICO_REPLY='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v3"/></svg>';
function icoReply(){const t=document.createElement('template');t.innerHTML=ICO_REPLY;return t.content.firstChild}
const exc30=s=>{const a=Array.from(String(s||'').replace(/\s+/g,' ').trim());return a.slice(0,30).join('')+(a.length>30?'…':'')};      // first 30 characters of the original (emoji-safe)
function setReply(r){REPLY=r||null;const b=$('#mreply');if(!b)return;b.hidden=!REPLY;if(REPLY){b.querySelector('.rpbar-n').textContent=REPLY.name;b.querySelector('.rpbar-t').textContent=REPLY.text?'· '+REPLY.text:''}}
$('#mreplyx').onclick=()=>{setReply(null);try{$('#mt').focus({preventScroll:true})}catch(e){}};      // the ✕ on the "Replying to" bar
function startReply(m){if(MLOCK&&!ADM)return toast(errText('locked'));if(!m.id)return;
 setReply({id:String(m.id),name:clean(m.name,30)||'Anonymous',text:exc30(m.message)});
 try{($('#mn').value?$('#mt'):$('#mn')).focus({preventScroll:true})}catch(e){}                       // inside the tap, so phones open the keyboard
 $('#mf').scrollIntoView({behavior:'smooth',block:'center'})}
async function revealMsg(id){const k=String(id);      // make sure a note is loaded AND drawn, however old it is (loads older pages until it turns up; false = it really is gone)
 for(let g=0;g<800;g++){const i=SORTED.findIndex(x=>String(x.id)===k);
  if(i>=0){if(i>=SHOWN){SHOW_N=i+SHOW_STEP;msgs(MSG)}return true}
  if(MLOAD){await sleep(250);continue}
  if(!MORE||MFAIL)return false;
  await loadOlder()}
 return false}
async function goMsg(id){const q='.msg[data-id="'+String(id).replace(/"/g,'')+'"]',S='#pinwrap '+q+',#wall '+q;let c=$(S);
 if(!c){toast('Finding the original note…',1800);await revealMsg(id);c=$(S)}
 if(!c)return toast(errText('gone'));closeRx();const w=$('#wall'),sm=RM?'auto':'smooth';
 /* put the original in the MIDDLE of the screen: 1) centre it inside the scrolling box, 2) then scroll the page so that spot is the middle of the screen */
 let top=c.getBoundingClientRect().top;                                                          // where it is on screen right now
 if(w.contains(c)){const to=Math.max(0,Math.min(w.scrollHeight-w.clientHeight,c.offsetTop-(w.clientHeight-c.offsetHeight)/2));
  top-=to-w.scrollTop;w.scrollTo({top:to,behavior:sm})}                                          // ... and where it will be once the box has scrolled
 scrollBy({top:top+c.offsetHeight/2-innerHeight/2,behavior:sm});
 c.classList.remove('flash');void c.offsetWidth;c.classList.add('flash');setTimeout(()=>c.classList.remove('flash'),1900)}
function replyLine(m){const b=el('button','rpl'),n=el('bdi');b.type='button';b.setAttribute('aria-label','Go to the message this replies to');
 n.append(el('b','',clean(m.rname,30)||'Anonymous'));b.append(icoReply(),document.createTextNode(' Reply to '),n);
 if(m.rtext)b.append(document.createTextNode(' · '),el('bdi','',clean(m.rtext,40)));
 b.onclick=ev=>{ev.stopPropagation();goMsg(m.reply)};return b}
function rxFoot(c,m){let f=c.querySelector('.mrx');if(!f){f=el('div','mrx');c.append(f)}
 f.replaceChildren();if(!m.id){f.hidden=true;return}
 const k=RX[m.id]||{},mine=MINE[m.id]||'',open=c.classList.contains('rx-open'),rc=REPLIES[m.id]||0;
 if(rc){const s=el('span','rpc');s.title=rc+(rc==1?' reply':' replies');s.setAttribute('role','img');s.setAttribute('aria-label',rc+(rc==1?' reply':' replies'));s.append(icoReply(),el('span','n',rc));f.append(s)}      // "this was replied to" + how many: leftmost, only when someone replied
 RXS.forEach(([key,em,label])=>{const n=k[key]||0;if(!n)return;
  const b=el('button','rxc'+(mine==key?' me':''));b.type='button';b.title=label;b.setAttribute('aria-pressed',String(mine==key));b.setAttribute('aria-label',label+': '+n);
  b.append(el('span','e',em),el('span','n',n));b.onclick=ev=>{ev.stopPropagation();react(m,mine==key?'':key)};f.append(b)});
 if(open){const p=el('div','rxp');p.setAttribute('role','group');p.setAttribute('aria-label','Choose a reaction');
  RXS.forEach(([key,em,label])=>{const b=el('button',mine==key?'on':'',em);b.type='button';b.title=label;b.setAttribute('aria-label',label);
   b.onclick=ev=>{ev.stopPropagation();c.classList.remove('rx-open');c.setAttribute('aria-expanded','false');react(m,mine==key?'':key)};p.append(b)});
  if(!(MLOCK&&!ADM)){const rb=el('button','rpb');rb.type='button';rb.title='Reply';rb.setAttribute('aria-label','Reply to this message');rb.append(icoReply());      // same rounded box as the reactions
   rb.onclick=ev=>{ev.stopPropagation();c.classList.remove('rx-open');c.setAttribute('aria-expanded','false');rxFoot(c,m);startReply(m)};p.append(rb)}
  f.append(p)}
 f.hidden=!f.childNodes.length}
function closeRx(except){$$('#pinwrap .msg.rx-open,#wall .msg.rx-open').forEach(c=>{if(c===except)return;c.classList.remove('rx-open');c.setAttribute('aria-expanded','false');const m=msgById(c.dataset.id);if(m)rxFoot(c,m)})}
function toggleRx(c,m){if(!m.id)return;const was=c.classList.contains('rx-open');closeRx(c);
 c.classList.toggle('rx-open',!was);c.setAttribute('aria-expanded',String(!was));rxFoot(c,m);
 if(!was&&c.closest('#wall')){const w=$('#wall'),wr=w.getBoundingClientRect(),cr=c.getBoundingClientRect();                       // bring the picker fully into view inside the wall
  if(cr.bottom>wr.bottom-30)w.scrollBy({top:cr.bottom-wr.bottom+34,behavior:'smooth'})}}
const rxDraw=id=>{const q='.msg[data-id="'+String(id).replace(/"/g,'')+'"]',c=$('#pinwrap '+q+',#wall '+q),m=msgById(id);if(c&&m)rxFoot(c,m)};
const RECHK={};const RXB={},RXD={},RXBASE={};                           // per message: a request is in flight · a newer tap is waiting · the state to go back to if the server refuses
const RX_NO=['nomsg','emoji','noauth','action'];          // the only answers that mean "this can never work"; anything else (busy, network, server) is retried
function react(m,key){const id=m.id;if(!id)return;const prev=MINE[id]||'';if(prev===key)return;
 if(!RXB[id])RXBASE[id]={c:Object.assign({},RX[id]||{}),m:prev};
 if(!(id in PEND))PEND[id]=prev;
 const k=RX[id]=RX[id]||{};if(prev&&k[prev])k[prev]=Math.max(0,k[prev]-1);if(key)k[key]=(k[key]||0)+1;
 if(key)MINE[id]=key;else delete MINE[id];RXT[id]=Date.now();saveMine();rxDraw(id);syncRx(id)}
/* one request at a time per message, always carrying the LATEST choice: quick taps (change, remove, change again) can never reach the server out of order.
   A busy server or a bad connection never takes the tap back: it stays on screen, is kept on this device and is sent again (a few times now, and again on the next visit). */
async function syncRx(id){if(RXB[id]){RXD[id]=1;return}RXB[id]=1;
 try{for(let n=0;;){RXD[id]=0;const sent=MINE[id]||'';const r=await api({action:'msgreact',id:String(id),emoji:sent,dev:DEV},{tries:3});
  if(r.ok||r.demo){if(RXD[id]||(MINE[id]||'')!==sent)continue;delete PEND[id];delete RXBASE[id];RXT[id]=Date.now();saveMine();if(r.counts)RX[id]=r.counts;rxDraw(id);return}
  if(RX_NO.indexOf(r.error)>=0){const b=RXBASE[id];if(b){RX[id]=b.c;if(b.m)MINE[id]=b.m;else delete MINE[id]}delete PEND[id];delete RXBASE[id];saveMine();RXD[id]=0;rxDraw(id);console.warn('reaction refused',r);
   toast(r.error=='nomsg'?'That message is no longer there.':r.error=='action'?'Reactions need the updated backend (Code.gs).':'Could not save your reaction.',ADM?9000:undefined);return}
  if(++n>=6){console.warn('reaction will be retried later',r);return}               // stays in PEND: sent again when the page comes back online / on the next visit
  await sleep(Math.min(30000,1500*n*n))}}
 finally{RXB[id]=0}}
function flushPend(){Object.keys(PEND).forEach(id=>{if(!RXB[id])syncRx(id)})}
const mergeRx=rp=>{if(!BACKEND.enabled||!rp.messages)return;const s=rp.mr||{},now=Date.now(),hot=id=>(id in PEND)||now-(RXT[id]||0)<3e4;
 /* server totals win, except for a message I tapped in the last 30 s (or whose tap is not confirmed yet): the server may not have folded my tap into its totals, so show it anyway */
 const inWin=new Set(rp.messages.map(m=>String(m.id)));      // notes loaded from older pages keep their own totals
 new Set([...Object.keys(s),...[...Object.keys(RX),...Object.keys(MINE)].filter(id=>inWin.has(id))]).forEach(id=>{const k=Object.assign({},s[id]||{});
  if(inWin.has(id)&&MINE[id]&&!hot(id)&&!(k[MINE[id]]>0)&&!RECHK[id]){RECHK[id]=1;setTimeout(()=>{if(MINE[id]&&!RXB[id])syncRx(id)},1500)}      // the server does not list MY reaction (lost on its side?): send it again, once per visit. Harmless if it was only a stale copy: the server keeps one reaction per device
  if(hot(id)){const m=MINE[id]||'',p=PEND[id]||'';if(p&&p!==m&&k[p]>0)k[p]--;if(m&&!(k[m]>0))k[m]=1}
  Object.keys(k).forEach(e=>{if(!(k[e]>0))delete k[e]});if(Object.keys(k).length)RX[id]=k;else delete RX[id]})};
addEventListener('click',e=>{if(!e.target.closest('#wall .msg,#pinwrap .msg'))closeRx()});addEventListener('keydown',e=>{if(e.key=='Escape')closeRx()});
/* admin: pin a message (a pinned note stays first and stays on screen while the wall scrolls). Admins can pin / unpin / delete, but never edit what someone wrote. */
async function pinMsg(m,pin){const r=await api({action:'pinmsg',id:m.id,key:ADK,pin:pin});
 if(!r.ok&&!r.demo){toast(r.error=='action'?'Update Code.gs and redeploy it first.':r.error=='nomsg'?'That message no longer exists.':'Not saved. Check the admin key.');return}
 if(pin)MSG.forEach(x=>{x.pin=''});m.pin=pin?'1':'';msgs(MSG,pin?'top':undefined);toast(pin?'Pinned to the top.':'Unpinned.')}
/* ---- staff badges: the class logo used like a verification mark. Tap it -> a tiny popup says who it is. Image files come from config.js (founderBadge / teamBadge) ---- */
const BADGES={founder:{label:'المؤسس',cfg:'founderBadge'},team:{label:'AUD SENIORS 2026',cfg:'teamBadge'}};
function vBadge(k){const d=BADGES[k],u=DR(G(d.cfg),1),use=safe(u)?u:CONFIG.logo,b=el('button','vbadge '+k),w=el('span','vi');
 b.type='button';b.setAttribute('aria-label',d.label);b.setAttribute('aria-expanded','false');
 if(ok(use)){const i=new Image();i.src=use;i.alt='';i.decoding='async';w.append(i)}else w.append(el('span','vt','✓'));      // no image at all: a plain check mark
 b.append(w);b.onclick=ev=>{ev.stopPropagation();bdPop(b,d.label)};return b}
let bdBtn=null,bdT=0;
function closeBd(){const p=$('#bdpop');if(p)p.hidden=true;if(bdBtn){bdBtn.setAttribute('aria-expanded','false');bdBtn=null}clearTimeout(bdT)}
function bdPop(b,label){if(bdBtn===b){closeBd();return}closeBd();let p=$('#bdpop');
 if(!p){p=el('div','bdpop');p.id='bdpop';p.setAttribute('role','tooltip');document.body.append(p)}
 p.textContent=label;p.hidden=false;const r=b.getBoundingClientRect(),w=p.offsetWidth;                         // fixed to the screen, so the scrolling message box can never clip it
 p.style.left=Math.round(Math.min(innerWidth-w-8,Math.max(8,r.left+r.width/2-w/2)))+'px';p.style.top=Math.round(r.bottom+8)+'px';
 bdBtn=b;b.setAttribute('aria-expanded','true');bdT=setTimeout(closeBd,3500)}
addEventListener('click',e=>{if(!e.target.closest('.vbadge'))closeBd()});addEventListener('keydown',e=>{if(e.key=='Escape')closeBd()});
addEventListener('scroll',closeBd,{passive:true,capture:true});addEventListener('resize',closeBd);
/* ---- visitor messages on / off. The BACKEND is the real lock; this only shows it. Staff can always post. ---- */
function msgForm(){const f=$('#mf');if(!f)return;const stop=MLOCK&&!ADM,note=$('#mlocknote'),bar=$('#mlockbar');
 f.classList.toggle('paused',stop);[$('#mn'),$('#mt'),f.querySelector('.btn')].forEach(x=>{if(x)x.disabled=stop});if(stop)setReply(null);
 note.replaceChildren();
 if(stop){note.append(el('b','','Messages are paused for now'),el('span','','إرسال الرسائل متوقف حاليًا'));note.lastChild.lang='ar';note.lastChild.dir='rtl'}
 else if(ADM)note.append(el('b','','Posting as '+(ROLE=='founder'?'the Founder':'the Graduation Team')),el('span','',MLOCK?'Visitors can\'t post right now.':'Your name gets a badge.'));
 note.hidden=!note.childNodes.length;
 if(bar){bar.hidden=!ADM;$('#mlock').hidden=ROLE!=='founder';$('#mlockst').textContent=MLOCK?'Visitor messages are PAUSED':'Visitor messages are open';$('#mlock').textContent=MLOCK?'▶ RESUME VISITOR MESSAGES':'⏸ PAUSE VISITOR MESSAGES';bar.classList.toggle('off',MLOCK)}}
$('#mlock').onclick=async()=>{if(ROLE!=='founder')return;const b=$('#mlock'),want=!MLOCK;b.disabled=true;
 const r=await api({action:'msglock',key:ADK,on:want});b.disabled=false;
 if(!r.ok&&!r.demo){toast(r.error=='action'?'Update Code.gs and redeploy it first.':errText(r.error));return}
 MLOCK=r.demo?want:!!r.locked;msgForm();toast(MLOCK?'Visitor messages are paused.':'Visitor messages are open again.')};
function linkify(text){
  const out=[], re=/(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;
  let last=0, m;
  while((m=re.exec(text))){
    let url=m[0], tail='';
    const t=url.match(/[.,!?؟،:;)\]]+$/);          // شيل علامات الترقيم من آخر اللينك
    if(t){tail=t[0];url=url.slice(0,-tail.length)}
    if(m.index>last) out.push(document.createTextNode(text.slice(last,m.index)));
    const href=/^www\./i.test(url)?'https://'+url:url;
    if(/^https?:\/\//i.test(href)){
      const a=document.createElement('a');
      a.href=href; a.textContent=url;
      a.target='_blank'; a.rel='noopener noreferrer nofollow ugc';
      a.onclick=ev=>ev.stopPropagation();           // عشان الضغط على اللينك ميفتحش قائمة التفاعلات
      out.push(a);
    } else out.push(document.createTextNode(url));
    if(tail) out.push(document.createTextNode(tail));
    last=m.index+m[0].length;
  }
  if(last<text.length) out.push(document.createTextNode(text.slice(last)));
  return out;
}
function msgCard(m,i){const nm=clean(m.name,30)||'Anonymous',tx=clean(m.message,240),t=new Date(m.date),okd=!!m.date&&!isNaN(t);
 const c=el('article','msg a'+(i%3)+(isPin(m)?' pinned':'')),hd=el('div','mh'),who=el('div','who'),b=el('b','',nm);b.dir='auto';who.append(b);
 if(m.badge==='founder'||m.badge==='team'){who.classList.add('vb');who.dir=/[\u0600-\u06FF]/.test(nm)?'rtl':'ltr';who.append(vBadge(m.badge))}      // founder / graduation-team mark right beside the name
 /* header: date + time stacked on the LEFT (plain text), the sender's name on the RIGHT (any language) */
 if(okd){const wh=el('div','when'),tm=el('small','tm'),ag=el('span','ago'),a=agoTxt(t);ag.dataset.t=+t;ag.textContent=a?' · '+a:'';tm.append(el('span','',tmFmt(t)),ag);
  wh.append(el('small','mdt',t.getDate()+' '+MON[t.getMonth()]+(t.getFullYear()!==new Date().getFullYear()?' '+t.getFullYear():'')),tm);wh.title=t.toLocaleString('en-GB',{dateStyle:'long',timeStyle:'short'});hd.append(wh)}
 hd.append(who);
 const p=el('p','mt'+(/[\u0600-\u06FF]/.test(tx)?' ar':''));p.dir='auto';p.append(...linkify(tx));if(isPin(m))c.append(el('small','pinb','\uD83D\uDCCC PINNED'));if(m.reply)c.append(replyLine(m));c.append(hd,p);return c}
function fitWall(){const w=$('#wall'),k=w.children,n=MSG_SHOW-($('#pinwrap').hidden?0:1);w.style.maxHeight='';if(k.length<=n||!k[n].classList.contains('msg'))return;      // a pinned note sits above the box and takes one of the slots
 const cs=getComputedStyle(w),g=parseFloat(cs.rowGap)||0,pb=parseFloat(cs.paddingBottom)||0;w.style.maxHeight=(k[n].offsetTop-g+pb)+'px'}      // exactly 4 notes tall
function addCards(to){const w=$('#wall'),pw=$('#pinwrap');                      // draw SORTED[SHOWN..to)
 SORTED.slice(SHOWN,to).forEach((m,k)=>{const i=SHOWN+k,c=msgCard(m,i);c.tabIndex=0;c.setAttribute('role','button');c.setAttribute('aria-label','React to the message from '+clean(m.name,30));c.setAttribute('aria-expanded','false');if(m.id)c.dataset.id=m.id;
  if(msgFirst){c.classList.add('in');c.style.animationDelay=Math.min(i,5)*80+'ms'}
  c.onclick=e=>{if(!e.target.closest('button'))toggleRx(c,m)};c.onkeydown=e=>{if(e.target===c&&(e.key=='Enter'||e.key==' ')){e.preventDefault();toggleRx(c,m)}};rxFoot(c,m);
  if(m.id){const d=el('button','del','✕');d.type='button';d.setAttribute('aria-label','Delete message');d.onclick=ev=>{ev.stopPropagation();del('message',m.id)};c.append(d);
   const p=el('button','mbtn mp'+(isPin(m)?' on':''),'📌');p.type='button';                              // admin only (hidden for visitors): pin / unpin
   p.setAttribute('aria-label',isPin(m)?'Unpin message':'Pin message');p.title=isPin(m)?'Unpin':'Pin to top';
   p.onclick=ev=>{ev.stopPropagation();pinMsg(m,!isPin(m))};c.append(p);
   if(m.bn&&!m.badge){const k=el('button','mbtn mb','🚫');k.type='button';k.setAttribute('aria-label','Block this device');k.title='Block this device';k.onclick=ev=>{ev.stopPropagation();openBan('message',m)};c.append(k)}}
  (i===0&&isPin(m)?pw:w).append(c)});      // the pinned note lives ABOVE the scrolling box: the rest scrolls below it with the normal gap and never slides under it
 SHOWN=Math.max(SHOWN,to)}
function msgs(M,where){const all=sortedMsgs(M),w=$('#wall'),pw=$('#pinwrap'),st=w.scrollTop;w.replaceChildren();pw.replaceChildren();
 REPLIES={};all.forEach(x=>{if(x.reply)REPLIES[x.reply]=(REPLIES[x.reply]||0)+1});
 SORTED=all;SHOWN=0;SHOW_N=where=='top'?SHOW_STEP:where=='end'?all.length:Math.max(SHOW_N,SHOW_STEP);      // a new note / a re-sort starts from the top; a background refresh keeps what was drawn
 if(!all.length)w.append(el('p','empty','No notes yet. Be the first to leave one ✨'));
 addCards(Math.min(all.length,SHOW_N));
 pw.hidden=!(all.length&&isPin(all[0]));if(all.length)msgFirst=false;fitWall();w.scrollTop=where=='top'?0:where=='end'?w.scrollHeight:st;      // new notes / re-sort jump to the right end; background refreshes keep your place
 const tot=Math.max(all.length,TOTAL);$('#mcnt').textContent=tot+(TOTAL?'':MORE?'+':'')+(tot==1?' message':' messages')+(tot>MSG_SHOW?' · scroll to read them all':'');
 mMore();if(msgSort=='old'&&MORE&&!MLOAD&&!MFAIL)loadOlder(true);else requestAnimationFrame(wallMore)}      // oldest-first needs every page: fetch them all
/* the reader nears the end of what is drawn: draw the next slice; nothing left to draw: fetch the next page of older notes */
function wallMore(){const w=$('#wall');if(!w||!SORTED.length)return;
 if(w.scrollHeight-w.scrollTop-w.clientHeight>1800)return;
 if(SHOWN<SORTED.length){addCards(Math.min(SORTED.length,SHOWN+SHOW_STEP));SHOW_N=Math.max(SHOW_N,SHOWN);requestAnimationFrame(wallMore);return}
 if(MORE&&!MLOAD&&!MFAIL)loadOlder()}
$('#wall').addEventListener('scroll',wallMore,{passive:true});
function mMore(){const b=$('#mmore');if(!b)return;b.hidden=!(MORE&&(MLOAD||MFAIL));b.disabled=!!MLOAD;b.textContent=MLOAD?'LOADING OLDER NOTES…':'COULD NOT LOAD · TAP TO RETRY'}      // normally invisible: older notes load by themselves; it only shows progress / a retry after an error
function withOlder(rp){const w=rp.messages||[],ids=new Set(w.map(m=>String(m.id)));
 const lo=w.reduce((a,m)=>{const d=String(m.date||'');return d&&(!a||d<a)?d:a},'');
 WIN.forEach(m=>{const k=String(m.id||'');if(k&&!ids.has(k)&&String(m.date||'')<=lo&&!OLDER.some(o=>String(o.id)===k))OLDER.push(m)});      // a note that slid out of the newest window (new notes arrived) keeps its place
 WIN=w;OLDER=OLDER.filter(m=>!ids.has(String(m.id)));
 if(!PAGED){CURSOR=rp.oldest||'';MORE=rp.more?1:0}
 if(rp.total!=null)TOTAL=rp.total;
 return w.concat(OLDER)}
async function loadOlder(all){if(MLOAD||!MORE||!CURSOR||!BACKEND.enabled)return;MLOAD=1;MFAIL=0;mMore();
 try{do{const r=await getJSON(BACKEND.apiUrl+'?scope=msgs&before='+encodeURIComponent(CURSOR)+(all?'&n=300':''),{tries:3,timeout:20000});
  if(r.err){MFAIL=1;toast('Could not load older notes. Trying again soon.');setTimeout(()=>{MFAIL=0;mMore();wallMore()},15000);break}
  const j=r.j,seen=new Set(MSG.map(m=>String(m.id))),fresh=(j.messages||[]).filter(m=>!seen.has(String(m.id))),now=Date.now();
  if(j.total!=null)TOTAL=j.total;OLDER.push(...fresh);MSG=MSG.concat(fresh);PAGED=1;CURSOR=j.oldest||CURSOR;MORE=j.more&&j.oldest&&!j.gone?1:0;
  Object.keys(j.mr||{}).forEach(id=>{if(!((id in PEND)||now-(RXT[id]||0)<3e4))RX[id]=j.mr[id]})}while(all&&MORE)}
 finally{MLOAD=0}
 msgs(MSG)}
$('#msort').onchange=e=>{msgSort=e.target.value;MFAIL=0;msgs(MSG,'top')};
{const b=$('#mmore');if(b)b.onclick=()=>{MFAIL=0;loadOlder(msgSort=='old')}}
addEventListener('resize',()=>requestAnimationFrame(fitWall));addEventListener('load',fitWall);if(document.fonts){document.fonts.ready.then(fitWall);document.fonts.addEventListener&&document.fonts.addEventListener('loadingdone',fitWall)}      // re-measure once the handwriting fonts arrive
setInterval(()=>$$('#wall .ago').forEach(s=>{const a=agoTxt(+s.dataset.t);s.textContent=a?' · '+a:''}),60000);
$('#mf').onsubmit=async e=>{e.preventDefault();if(MLOCK&&!ADM)return toast(errText('locked'));const n=clean($('#mn').value,30),t=clean($('#mt').value,240);if(!n||!t)return;
 const rp=REPLY,form=e.target,btn=form.querySelector('.btn'),tmp={name:n,message:t,date:new Date().toISOString(),badge:ADM?(ROLE=='founder'?'founder':'team'):''};
 if(rp){tmp.reply=rp.id;tmp.rname=rp.name;tmp.rtext=rp.text}
 if(btn)btn.disabled=true;MSG.unshift(tmp);if(TOTAL)TOTAL++;msgs(MSG,msgSort=='new'?'top':'end');form.reset();setReply(null);       // shown right away; the server catches up in the background
 const pl={action:'message',name:n,message:t};if(rp)pl.reply=rp.id;if(ADM)pl.key=ADK;const r=await api(pl);if(btn)btn.disabled=false;
 if(!r.ok&&!r.demo){MSG=MSG.filter(m=>m!==tmp);if(TOTAL)TOTAL--;msgs(MSG);$('#mn').value=n;$('#mt').value=t;if(rp&&r.error!=='gone'&&!(r.error=='locked'&&!ADM))setReply(rp);if(r.error=='locked'){MLOCK=true;msgForm()}return r.error=='banned'?showBan(r):toast(errText(r.error))}
 if(r.item){Object.assign(tmp,r.item);msgs(MSG)}toast(r.demo?'Posted (demo: connect the Backend link to keep it).':'Your message is live!')};

/* ---- events ---- */
(function(){const z=n=>String(n).padStart(2,'0'),f=t=>''+t.getFullYear()+z(t.getMonth()+1)+z(t.getDate())+'T'+z(t.getHours())+z(t.getMinutes())+'00';
 EVENTS.slice().sort((a,b)=>a.d<b.d?-1:1).forEach(x=>{const d=new Date(x.d),c=el('article','card glass'),i=el('p','',x.x||''),b=el('button','btn g','MORE INFO'),a=el('a','btn','ADD TO CALENDAR'),bt=el('div','btns');
  i.hidden=true;b.type='button';b.setAttribute('aria-expanded','false');b.onclick=()=>{i.hidden=!i.hidden;b.setAttribute('aria-expanded',String(!i.hidden))};
  a.href='https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(x.t)+'&dates='+f(d)+'/'+f(new Date(d.getTime()+72e5))+'&location='+encodeURIComponent(x.l||'')+'&details='+encodeURIComponent(x.x||'');a.target='_blank';a.rel='noopener';
  bt.append(b,a);const ie=el('div','ei');ie.append(ic(x.e));c.append(ie,el('h3','',x.t),el('p','meta','📅 '+fmt(x.d)+' · '+x.d.slice(11,16)),el('p','meta','📍 '+(x.l||'')),i,bt);$('#ev').append(c)})})();

/* ---- socials + announcements ---- */

/* inline SVG icons (simple-icons, CC0): no icon-font download, no layout shift */
const SOC_PATH = {
  instagram: 'M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077',
  facebook: 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z',
  x: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
  telegram: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z'
};
const socIcon = k => {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'), p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
  p.setAttribute('d', SOC_PATH[k]); p.setAttribute('fill', 'currentColor'); s.append(p); return s;
};

[
  ['instagram', 'Instagram'],
  ['facebook', 'Facebook'],
  ['x', 'X'],
  ['telegram', 'Telegram']
].forEach(([k, name]) => {

  const a = el('a', 'card glass soc');

  a.href = safe(CONFIG.socials[k])
    ? CONFIG.socials[k]
    : '#';

  a.target = '_blank';
  a.rel = 'noopener noreferrer';

  const iconElement = el('i');
  iconElement.append(socIcon(k));

  a.append(
    iconElement,
    el('b', '', name)
  );

  $('#soc').append(a);
});


ANNOUNCEMENTS.forEach(a => {

  const n = Date.now();

  if (
    n < new Date(a.start) ||
    n > new Date(a.end).getTime() + 864e5
  ) return;

  const d = el('div', 'an');

  const x = el(
    'button',
    '',
    '✕'
  );

  if (safe(a.image)) {

    const i = new Image();

    i.loading = 'lazy';
    i.decoding = 'async';
    i.src = a.image;
    i.alt = '';

    d.append(i);
  }

  x.setAttribute(
    'aria-label',
    'Dismiss'
  );

  x.onclick = () => d.remove();

  d.append(
    el('b', '', a.title),
    el('span', '', a.text),
    x
  );

  $('#an').append(d);
});

/* ---- charity project: design image + donation methods (everything comes from config.js) ---- */
async function copyText(t,msg){try{await navigator.clipboard.writeText(t)}catch(e){const x=document.createElement('textarea');x.value=t;x.setAttribute('readonly','');x.style.cssText='position:fixed;top:0;opacity:0';document.body.append(x);x.select();try{document.execCommand('copy')}catch(_){}x.remove()}toast(msg||'تم نسخ الرقم ✓')}
(function(){const fig=$('#chfig'),list=$('#don');if(!fig||!list)return;
 const title=G('charityTitle')||'المشروع الخيري للدفعة';$('#cht').textContent=title;$('#chx').textContent=G('charityText');
 const img=DR(G('charityImage'),1);
 if(safe(img)){const b=el('button','ch-img'),i=new Image();b.type='button';b.setAttribute('aria-label',title);i.alt=title;i.decoding='async';i.loading='lazy';i.onload=()=>b.classList.add('ok');retryImg(i,img);i.src=img;b.append(i);
  b.onclick=()=>openLB([{url:img,thumb:img,title:title,cap:'',cat:'',date:''}],0);fig.append(b)}
 else{fig.classList.add('soon');fig.append(ic('red_heart','ch-ph'),el('b','','التصميم قريبًا'))}
 const SV={vodafone:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M10.5 18.5h3"/><path d="M9.5 8.2a2.6 2.6 0 0 1 5 0c0 2-2.5 2.2-2.5 4"/></svg>',
  instapay:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2.5 5 13.5h6l-1 8 8-11h-6z"/></svg>',
  other:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.4-7 10-7 10z"/></svg>'};
 PP('donate').filter(a=>a[1]).forEach(a=>{
  const kind=/insta/i.test(a[0])?'instapay':/voda/i.test(a[0])?'vodafone':'other',name=a[1],num=/x{3,}/i.test(a[2]||'')?'':(a[2]||''),link=/^https:\/\//i.test(a[3]||'')?a[3]:'';
  const card=el('div','don '+kind+(num||link?'':' soon')),ico=el('span','don-ic'),info=el('span','don-in'),nu=el('span','don-num',num||'قريبًا');
  ico.innerHTML=SV[kind];nu.dir=num?'ltr':'rtl';info.append(el('b','',name),nu);
  let main;
  if(link){main=el('a','don-main');main.href=link;main.target='_blank';main.rel='noopener noreferrer'}
  else{main=el('button','don-main');main.type='button';if(num)main.onclick=()=>copyText(num);else main.disabled=true}
  main.append(ico,info);if(num||link)main.append(el('em','don-go',link?'تبرّع الآن ↗':'اضغط للنسخ'));
  main.setAttribute('aria-label',name+(num?' '+num:'')+(link?' — فتح لينك التبرع':num?' — نسخ الرقم':' — قريبًا'));
  card.append(main);
  if(link&&num){const cp=el('button','don-copy','نسخ الرقم');cp.type='button';cp.onclick=()=>copyText(num);card.append(cp)}
  list.append(card)});
 if(!list.children.length)$('#charity').hidden=true})();

/* ---- fun: ticker, clickable 3D icons ---- */
(function(){const b=el('div','tkin');for(let k=0;k<2;k++)PP('ticker').forEach(a=>{const s=el('span');s.append(ic(a[0]),document.createTextNode(a[1]||''));b.append(s)});$('#tk').append(b);
 $$('.cut').forEach(i=>i.onclick=()=>burst(36))})();

/* ---- reveal + scroll-spy ---- */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);if(e.target.id=='stats')count()}}),{threshold:.12});$$('.rv').forEach(e=>io.observe(e));
const sp=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)$$('nav a').forEach(a=>a.classList.toggle('on',a.hash=='#'+e.target.id))}),{rootMargin:'-45% 0px -50% 0px'});$$('section[id]').forEach(s=>sp.observe(s));

/* ---- data: your Blogger posts (photos) + backend (visitor photos, messages, votes) ---- */
const FID=(id,w)=>'https://lh3.googleusercontent.com/d/'+id+'=w'+w;
let MSG=MESSAGES;
const CID=(()=>{try{let c=sessionStorage.getItem('cid');if(!c){c=Math.random().toString(36).slice(2);sessionStorage.setItem('cid',c)}return c}catch(e){return'x'}})();
/* error codes: 'net' = the request never arrived · 'badjson' = the backend answered with something that is not data (an error page: wrong deployment / script error) · 'busy' = the server is overloaded for a moment
   Every request has a time limit (a hung request can never freeze a button) and every write carries a request id (rid): the backend performs a request only once,
   so an automatic retry after a slow or dropped answer can never post, love or vote twice. */
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function errText(c){return({wait:'Please wait a few seconds before posting again.',image:'That photo could not be used. Try a smaller or different one.',empty:'Please fill in every field.',busy:'The server is busy for a moment. Try again in a few seconds.',locked:'Messages are paused for now · إرسال الرسائل متوقف حاليًا',gone:'The message you replied to is no longer there.',refresh:'Please refresh the page (Ctrl+F5) and try again.',key:'The staff key was not accepted. Reopen your admin / founder link.',founder:'Only the founder link can do this.',server:'The server had a problem. Try again in a moment.',net:'Could not reach the server. Check your connection and try again.',badjson:'The backend is not set up correctly. Re-deploy it (README).'})[c]||'Could not send. Try again.'}
const rid=()=>{const a=new Uint8Array(10);crypto.getRandomValues(a);return[...a].map(x=>(x%36).toString(36)).join('')};
async function api(b,o){if(!BACKEND.enabled)return{ok:0,demo:1};o=o||{};const tries=o.tries||2,ms=o.timeout||40000,body=JSON.stringify({dev:DEV,...b,cid:CID,rid:b.rid||rid()});let last={ok:0,error:'net'};
 for(let i=0;i<tries;i++){if(i)await sleep(1200*i);
  const ac=new AbortController(),to=setTimeout(()=>ac.abort(),ms);let t;
  try{t=await(await fetch(BACKEND.apiUrl,{method:'POST',body:body,headers:{'Content-Type':'text/plain;charset=utf-8'},signal:ac.signal})).text()}catch(e){last={ok:0,error:'net'};continue}finally{clearTimeout(to)}
  let j;try{j=JSON.parse(t)}catch(e){last={ok:0,error:'badjson'};continue}
  if(j&&(j.error==='busy'||j.error==='server')){last=j;continue}
  return j}
 return last}
/* reads: same idea (time limit + retry). Returns {j,txt} or {err} */
async function getJSON(url,o){o=o||{};const tries=o.tries||2,ms=o.timeout||20000;let err='net';
 for(let i=0;i<tries;i++){if(i)await sleep(900*i);
  const ac=new AbortController(),to=setTimeout(()=>ac.abort(),ms);
  try{const txt=await(await fetch(url,{signal:ac.signal})).text();try{const j=JSON.parse(txt);if(j&&j.ok)return{j,txt};err='bad'}catch(e){err='badjson'}}catch(e){err='net'}finally{clearTimeout(to)}}
 return{err}}
async function posts(){return PP('photos').filter(a=>a[0]).map(a=>({cat:a[2]||'',title:a[1]||'Memory',cp:a[1]||'',date:a[3]||'',thumb:DR(a[0],1),url:DR(a[0],1)}))}
/* the home data: v = the version we already show; if nothing changed the backend answers {same:1} and sends nothing else */
async function remote(v){const z={messages:[],photos:[],votes:{}};if(!BACKEND.enabled)return z;const r=await getJSON(BACKEND.apiUrl+(v?'?v='+encodeURIComponent(v):''),{tries:2,timeout:12000});if(r.err){z.failed=1;return z}return r.j}
/* last good copy of the home data: the next visit paints from it instantly, then updates in the background */
const HKEY='aud_home_v2',readHome=()=>{try{const o=JSON.parse(localStorage.getItem(HKEY)||'null');return o&&o.j&&o.j.ok?o.j:null}catch(e){return null}},saveHome=j=>{try{localStorage.setItem(HKEY,JSON.stringify({t:Date.now(),j:j}))}catch(e){}};
function boardSkeleton(){const g=$('#grid');g.replaceChildren();for(let i=0;i<8;i++){const s=el('div','slot sk'),p=el('div','pol');p.style.setProperty('--r',(((i*53)%9)-4)*.9+'deg');p.append(el('div','sk-ph'),el('div','sk-cap'));s.append(el('i','pin'),p);g.append(s)}$('#cnt').textContent='Loading memories…';$('#more').hidden=true;requestAnimationFrame(strings)}
const vp=p=>({id:p.id,pid:p.id,bn:p.bn?1:0,uid:p.uid||'',name:p.name,cat:p.category,title:p.caption||'Memory',cp:p.caption||'',cap:'By '+p.name,date:p.date,thumb:FID(p.fileId,500),mid:FID(p.fileId,1000),url:FID(p.fileId,1600)});
function build(px,rp){const ph=[...rp.map(vp),...px];if(!ph.length)ph.push(...MEMORIES.filter(m=>!m.ev));
 ph.sort((a,b)=>String(a.date)<String(b.date)?1:-1);
 const ev=EVENTS.slice().sort((a,b)=>a.d<b.d?-1:1).map(x=>({ev:1,cat:'EVENTS',title:x.t,date:x.d,e:x.e,cap:x.x})),o=[];
 ph.forEach((p,i)=>{o.push(p);if(i%3==2&&ev.length)o.push(ev.shift())});return o.concat(ev)}
/* admin: open  yoursite/#admin  and enter the key. The key is checked by the backend; nothing is unlocked on a wrong key.
   AS = who the admin posts as: 'official' (the site's own page) or 'me' (this device's normal visitor profile) — the two never mix. */
let ADM=false,ADK='',AS='official',ROLE='',MLOCK=false,REPLY=null;try{AS=sessionStorage.getItem('aud_as')=='me'?'me':'official'}catch(e){}
/* ---- blocking a device from posting. The browser keeps an anonymous id (DEV); the backend remembers which id wrote each message / photo, so the admin or founder can block it from messages, photos or both, for any span.
   Blocked people can still browse everything; when they try to post they see how long the block is and how much is left. Admin or founder lifts a block early from "BLOCKED DEVICES". ---- */
const addCal=(t0,Y,M)=>{const d=new Date(t0),day=d.getUTCDate();d.setUTCDate(1);d.setUTCFullYear(d.getUTCFullYear()+Y);d.setUTCMonth(d.getUTCMonth()+M);d.setUTCDate(Math.min(day,new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate()));return d.getTime()};      // same calendar maths as the backend
function spanOf(a,b){if(b<=a)return{y:0,mo:0,d:0,h:0,m:0,s:0};let y=0,mo=0;while(addCal(a,y+1,0)<=b)y++;while(addCal(a,y,mo+1)<=b)mo++;
 let r=b-addCal(a,y,mo);const d=Math.floor(r/864e5);r-=d*864e5;const h=Math.floor(r/36e5);r-=h*36e5;const m=Math.floor(r/6e4);r-=m*6e4;return{y,mo,d,h,m,s:Math.floor(r/1e3)}}
const UNITS={en:{y:['year','years'],mo:['month','months'],d:['day','days'],h:['hour','hours'],m:['minute','minutes'],s:['second','seconds']},
 ar:{y:['سنة','سنتين','سنوات'],mo:['شهر','شهرين','شهور'],d:['يوم','يومين','أيام'],h:['ساعة','ساعتين','ساعات'],m:['دقيقة','دقيقتين','دقائق'],s:['ثانية','ثانيتين','ثوانٍ']}};
function fmtSpan(sp,lang,secs){const p=[];['y','mo','d','h','m','s'].forEach(k=>{if(k=='s'&&!secs)return;const v=sp[k];if(!v)return;const u=UNITS[lang][k];
  p.push(lang=='ar'?(v==1?u[0]:v==2?u[1]:v<=10?v+' '+u[2]:v+' '+u[0]):v+' '+(v==1?u[0]:u[1]))});
 return p.length?p.join(lang=='ar'?' و ':' '):(lang=='ar'?'أقل من دقيقة':secs?'0 seconds':'less than a minute')}
const when=t=>new Date(t).toLocaleString([],{dateStyle:'medium',timeStyle:'short'});
/* what a blocked visitor sees (English + Arabic, the time left counts down live) */
let bnT=0;const BN_WHAT={msg:['post messages','إرسال رسائل'],photo:['upload photos','رفع صور'],both:['post messages or upload photos','إرسال رسائل أو رفع صور']};
function showBan(i){const dlg=$('#bn'),skew=(i.now||Date.now())-Date.now(),w=BN_WHAT[i.scope]||BN_WHAT.msg,total=spanOf(i.from||i.until-864e5,i.until),live=[];
 const fill=(box,lang,a,l2,l3,z)=>{box.replaceChildren();const p1=el('p','',a),p2=el('p'),p3=el('p'),p4=el('p','',z),b2=el('b','',fmtSpan(total,lang,false)),b3=el('b');
  p2.append(document.createTextNode(l2),b2);p3.append(document.createTextNode(l3),b3);box.append(p1,p2,p3,p4);live.push([b3,lang])};
 fill($('#bnen'),'en',"You can't "+w[0]+' right now.','Blocked for: ','Time left: ','You can still browse the whole site as usual.');
 fill($('#bnar'),'ar','لا يمكنك '+w[1]+' حاليًا.','مدة الحظر: ','الوقت المتبقي: ','يمكنك تصفح الموقع بشكل طبيعي.');
 const tick=()=>{const now=Date.now()+skew,rem=i.until-now;live.forEach(([n,lang])=>{n.textContent=rem>0?fmtSpan(spanOf(now,i.until),lang,rem<36e5):(lang=='ar'?'انتهى الحظر، جرّب مرة أخرى':'Finished. Try again now.')})};
 clearInterval(bnT);tick();bnT=setInterval(tick,1000);if(!dlg.open)dlg.showModal()}
$('#bn').addEventListener('close',()=>clearInterval(bnT));
/* admin / founder: the "Block this device" window */
const BAN_ERR={nodev:"This one was posted before devices were tracked (or by staff), so it can't be blocked.",gone:'That message / photo was already deleted, so its device is unknown.',span:'Enter a duration of at least 1 hour (whole numbers).',what:'Choose what to block.',founder:'Only the admin or founder link can block devices.',key:'The key was not accepted. Reopen the admin / founder link.'};
let BD=null;
function bdRead(){const n=id=>{const v=$(id).value.trim();return v===''?0:Number(v)},Y=n('#bdy'),Mo=n('#bdmo'),D=n('#bdd'),H=n('#bdh'),ok=[Y,Mo,D,H].every(x=>Number.isInteger(x)&&x>=0&&x<=9999);return{Y,Mo,D,H,ok,zero:ok&&!(Y+Mo+D+H)}}
function bdPreview(){const s=bdRead(),u=$('#bduntil'),go=$('#bdgo');
 if(!s.ok){u.textContent='Use whole numbers (0 or more).';go.disabled=true;return}
 if(s.zero){u.textContent='Enter how long (at least 1 hour).';go.disabled=true;return}
 go.disabled=false;u.textContent='Blocked until: '+when(Math.min(addCal(Date.now(),s.Y,s.Mo)+s.D*864e5+s.H*36e5,Date.UTC(9999,11,31)))}
function openBan(type,m){BD={type,id:m.id};$('#bdwho').textContent='From: '+(type=='photo'?(m.name||'Anonymous')+' · photo':(clean(m.name,30)||'Anonymous')+' · '+exc30(m.message));
 $$('input[name=bdw]').forEach(r=>r.checked=r.value==(type=='photo'?'photo':'msg'));['#bdy','#bdmo','#bdh'].forEach(i=>$(i).value=0);$('#bdd').value=1;bdPreview();$('#bd').showModal()}
$$('#bd input[type=number]').forEach(i=>i.addEventListener('input',bdPreview));$('#bdno').onclick=()=>$('#bd').close();
$('#bdf').onsubmit=async e=>{e.preventDefault();if(!BD)return;const s=bdRead();if(!s.ok||s.zero)return bdPreview();
 const w=(document.querySelector('input[name=bdw]:checked')||{}).value||'msg',btn=$('#bdgo');btn.disabled=true;
 const r=await api({action:'ban',key:ADK,type:BD.type,id:BD.id,msg:w!='photo',photo:w!='msg',y:s.Y,mo:s.Mo,d:s.D,h:s.H});btn.disabled=false;
 if(!r.ok&&!r.demo){toast(BAN_ERR[r.error]||errText(r.error));return}
 $('#bd').close();toast(r.demo?'Blocked (demo: connect the Backend link).':'Device blocked until '+when(r.until)+'.',6000)};
/* admin / founder: who is blocked right now, and lift a block early */
let blT=0;
async function openBans(){const dlg=$('#bl'),ul=$('#bllist'),sub=$('#blsub');ul.replaceChildren();sub.textContent='Loading…';if(!dlg.open)dlg.showModal();
 const r=await api({action:'listbans',key:ADK});if(!r.ok&&!r.demo){sub.textContent=BAN_ERR[r.error]||errText(r.error);return}
 const skew=(r.now||Date.now())-Date.now(),count=()=>{const n=ul.children.length;sub.textContent=n?n+(n==1?' device is':' devices are')+' blocked right now.':'No active blocks.'};
 (r.bans||[]).forEach(b=>{const li=el('li','bl-r'),w=el('div','bl-w'),t=el('span','bl-t'),k=el('button','btn g bl-lift','LIFT');k.type='button';
  w.append(el('b','',b.label||'Unknown'),el('small','',b.msg&&b.photo?'Messages + photos':b.msg?'Messages':'Photos'));
  li._tick=()=>{t.textContent=fmtSpan(spanOf(Date.now()+skew,b.until),'en',false)+' left'};li._tick();
  k.onclick=async()=>{k.disabled=true;const x=await api({action:'unban',key:ADK,dev:b.dev});if(!x.ok&&!x.demo){k.disabled=false;return toast(BAN_ERR[x.error]||errText(x.error))}li.remove();count();toast('Block lifted.')};
  li.append(w,t,k);ul.append(li)});count();
 clearInterval(blT);blT=setInterval(()=>ul.querySelectorAll('li').forEach(li=>li._tick&&li._tick()),1000)}
$('#bl').addEventListener('close',()=>clearInterval(blT));$('#blx').onclick=()=>$('#bl').close();$('#banman').onclick=openBans;
async function del(type,id){const what=type=='photo'?'photo':type=='note'?'post':'message';
 if(!await ask('Delete this '+what+'?','It disappears for everyone'+(type=='message'?'.':', along with its comments and loves.')))return;
 const r=await api({action:'delete',type,id,key:ADK});if(!r.ok){toast('Not deleted. Check the admin key.');return}
 if(type=='photo'){const near=VALL.findIndex(x=>x.id==id);MEM=MEM.filter(m=>m.id!=id);board();if(VW.open&&!VW.classList.contains('solo'))vRefresh(near)}else{MSG=MSG.filter(m=>m.id!=id);OLDER=OLDER.filter(m=>m.id!=id);WIN=WIN.filter(m=>m.id!=id);if(TOTAL)TOTAL--;msgs(MSG)}
 toast('Deleted.')}
/* staff links: yoursite/#admin (graduation team) and yoursite/#founder (the founder). Each asks for its own key; the BACKEND decides who the key belongs to (ROLE).
   Both can delete photos / messages, pin, and block devices; only the founder sees the "pause visitor messages" switch. Messages sent from a staff link carry a badge. */
async function adminInit(){const want=location.hash=='#founder'?'founder':location.hash=='#admin'?'admin':'';let k='';
 try{k=sessionStorage.getItem('adk')||'';const sr=sessionStorage.getItem('adr')||'';if(want&&sr&&sr!==want)k=''}catch(e){}      // opened the other staff link in the same tab: ask again
 if(want&&!k)k=prompt(want=='founder'?'Founder key':'Admin key')||'';if(!k)return;
 const r=await api({action:'auth',key:k});
 if(r.ok||r.demo){ADM=true;ADK=k;ROLE=r.role||want||'admin';MLOCK=!!r.locked;try{sessionStorage.setItem('adk',k);sessionStorage.setItem('adr',ROLE)}catch(e){}
  document.body.classList.add('adm');document.body.classList.toggle('founder',ROLE=='founder');msgForm();
  toast(r.demo?'Staff mode (demo: connect the Backend link).':ROLE=='founder'?'Founder mode is on.':'Admin mode is on.')}
 else{try{sessionStorage.removeItem('adk');sessionStorage.removeItem('adr')}catch(e){}toast(r.error=='unset'?'Change ADMIN_KEY / FOUNDER_KEY in Code.gs first.':'Key not accepted.')}}
adminInit();
function shrink(f){return new Promise((res,rej)=>{const i=new Image(),u=URL.createObjectURL(f);i.onload=()=>{const s=Math.min(1,1200/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*s);c.height=Math.round(i.height*s);c.getContext('2d').drawImage(i,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c.toDataURL('image/jpeg',.82))};i.onerror=rej;i.src=u})}
(async()=>{const px=await posts();let cur=BACKEND.enabled?readHome():null,ready=false,psig='',msig='',vsig='';
 const sigP=rp=>h32(JSON.stringify((rp.photos||[]).map(p=>[p.id,p.caption,p.category,p.fileId]))),sigM=rp=>h32(JSON.stringify([(rp.messages||[]).map(m=>[m.id,m.pin||'',m.badge||'']),rp.mr||{},rp.total||0]));
 /* paints only what changed, so the board never flashes or replays its drop-in animation when fresh data arrives after the saved copy */
 const paint=rp=>{
  const p=sigP(rp);if(p!==psig){psig=p;MEM=build(px,rp.photos||[]);chipsR();board();if(VW.open&&!VW.classList.contains('solo'))vRefresh()}
  const lk=!!rp.locked;if(lk!==MLOCK){MLOCK=lk;msgForm()}
  mergeRx(rp);const m=sigM(rp);if(m!==msig){msig=m;MSG=BACKEND.enabled?withOlder(rp):MESSAGES;msgs(MSG)}
  const v=rp.votes||{};POLLS.forEach((q,i)=>q.o.forEach((o,j)=>o[1]=v[i+'_'+j]||0));
  const vg=h32(JSON.stringify(v));if(vg!==vsig){vsig=vg;pollsR(POLLS)}};      // polls are redrawn only when the counts changed; your saved vote is restored from this device
 const show=rp=>{paint(rp);ready=true;window.DATA_READY=1};
 if(!BACKEND.enabled){show({});return}
 if(cur)show(cur);else boardSkeleton();
 let n=0,lastOk=Date.now(),busy=0;
 async function refresh(){if(busy)return;busy=1;
  try{const rp=await remote(cur&&cur.v);
   if(rp.failed){                                             // backend not answering: keep what is on screen, show the sample board if there is nothing yet, keep trying quietly
    if(!ready){show({});toast('The memories are taking a while to load. Retrying…',6000)}
    if(++n<=4)setTimeout(refresh,5000*n);return}
   n=0;lastOk=Date.now();
   if(rp.same)return;                                         // what is on screen is already the latest
   cur=rp;saveHome(rp);show(rp)}
  finally{busy=0}}
 refresh().then(flushPend);                                   // taps that were not confirmed last time are sent again
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&ready&&Date.now()-lastOk>60000){n=0;refresh()}});      // coming back to the tab: catch up (a cheap "same?" question when nothing changed)
 addEventListener('online',()=>{flushPend();n=0;refresh()})})();
