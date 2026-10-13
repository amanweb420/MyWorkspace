
/* MyWorkspace Routine Review Gate */
(function(){
const KEY='mw_routine_sessions_v2';
const OLD='mw_routine_direct_boxes_v1';
const AWAY='mw_routine_gate_away_v2';
const SEEN='mw_routine_gate_seen_v2';
const $=id=>document.getElementById(id);

function read(k){
 try{
  const x=JSON.parse(localStorage.getItem(k)||'[]');
  return Array.isArray(x)?x:[];
 }catch(e){return [];}
}
function write(a){
 try{
  localStorage.setItem(KEY,JSON.stringify(a));
  return true;
 }catch(e){
  alert('Routine review save नहीं हो पाया: browser storage full हो सकता है।');
  return false;
 }
}
function migrate(){
 let a=read(KEY);
 if(a.length)return a;
 const old=read(OLD);
 if(!old.length)return a;
 a=old.map((r,i)=>({
  id:'LEGACY-'+(r.date||i)+'-'+i,
  name:r.name||'पुराना Routine',
  date:r.date||new Date().toISOString().slice(0,10),
  createdAt:r.createdAt||new Date().toISOString(),
  tasks:(r.tasks||[]).map((t,j)=>({
   id:'lt'+j,title:t.title||t.task||'Task',
   start:t.start||'09:00',end:t.end||t.time||'10:00',work:t.work||''
  })),
  endTime:r.endTime||((r.tasks||[]).map(t=>t.end||t.time||'10:00').sort().slice(-1)[0]||'10:00'),
  reviewCompleted:!!r.reviewCompleted,review:r.review||null,motivation:r.motivation||''
 }));
 try{localStorage.setItem(KEY,JSON.stringify(a));}catch(e){}
 return a;
}
function esc(s){
 return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function due(s){
 const now=new Date(),d=s.date||'',end=s.endTime||'23:59';
 const today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
 return !s.deleted&&!s.reviewCompleted&&d&&
  (d<today||(d===today&&end<=now.toTimeString().slice(0,5)));
}
function overdue(){
 return migrate().filter(due).sort((a,b)=>
  (a.date+a.endTime+(a.createdAt||'')).localeCompare(b.date+b.endTime+(b.createdAt||''))
 );
}
function addStyles(){
 if($('mwGateStyles'))return;
 const st=document.createElement('style');
 st.id='mwGateStyles';
 st.textContent=`
 #mwRoutineGate{position:fixed;inset:0;z-index:999999;background:radial-gradient(circle at top right,#1b4171 0,transparent 42%),#071225;color:#f0f5ff;overflow:auto;padding:18px;font-family:system-ui,sans-serif}
 #mwRoutineGate *{box-sizing:border-box}
 #mwRoutineGate .mwbox{max-width:720px;margin:18px auto;background:#101f38;border:1px solid #2b4264;border-radius:20px;padding:20px}
 #mwRoutineGate h1{font-size:clamp(25px,5vw,34px);margin:8px 0}
 #mwRoutineGate p{color:#b9c8df;line-height:1.6}
 #mwRoutineGate .mwitem{background:#09172d;border:1px solid #2b4264;border-radius:14px;padding:14px;margin:12px 0}
 #mwRoutineGate .mwmeta{font-size:12px;color:#9eb3d1}
 #mwRoutineGate .mwstatus{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}
 #mwRoutineGate label.mwchoice{display:inline-flex;align-items:center;gap:6px;background:#172b49;border:1px solid #3a5277;padding:9px 11px;border-radius:10px}
 #mwRoutineGate input[type=radio],#mwRoutineGate input[type=checkbox]{width:auto}
 #mwRoutineGate input[type=text],#mwRoutineGate textarea{width:100%;padding:11px;border-radius:9px;background:#071429;color:#fff;border:1px solid #3a5277;font:inherit;margin-top:8px}
 #mwRoutineGate button{padding:12px 15px;border:0;border-radius:10px;background:#75b2ff;color:#071225;font-weight:800;font:inherit;cursor:pointer}
 #mwRoutineGate .mwerr{color:#ff9eaa;font-size:13px}
 #mwRoutineGate .mwsmall{font-size:12px;color:#9eb3d1}
 #mwRoutineGate .mwbar{height:5px;background:#253d5f;border-radius:99px;overflow:hidden}
 #mwRoutineGate .mwbar span{display:block;height:100%;background:#58ddb0}
 `;
 document.head.appendChild(st);
}
function show(s){
 addStyles();
 if($('mwRoutineGate'))return;
 const root=document.createElement('div');
 root.id='mwRoutineGate';
 root.innerHTML=`
 <div class="mwbox">
 <div style="color:#8fc0ff;font-weight:800">MyWorkspace · ROUTINE REVIEW</div>
 <div class="mwbar"><span style="width:100%"></span></div>
 <p class="mwmeta">Routine ID: ${esc(s.id)} · Final time: ${esc(s.endTime)}</p>
 <h1>अपनी routine का review करें</h1>
 <p><b>${esc(s.name||'My Routine')}</b> का समय पूरा हो चुका है। नीचे इस routine के सभी tasks का status चुनें। यह review केवल इसी Routine ID पर लागू होगा।</p>
 <form id="mwGateForm"><div id="mwGateTasks"></div><p id="mwGateErr" class="mwerr"></p><button type="submit">Review Save करें</button></form>
 </div>`;
 document.body.appendChild(root);

 const box=$('mwGateTasks');
 (s.tasks||[]).forEach((t,i)=>{
  const item=document.createElement('div');
  item.className='mwitem';
  item.innerHTML=`
  <b>${i+1}. ${esc(t.title)}</b>
  <div class="mwmeta">${esc(t.start||'')}–${esc(t.end||'')}${t.work?' · '+esc(t.work):''}</div>
  <div class="mwstatus">${['Done','Partial','Not Done','Skip'].map(v=>
   `<label class="mwchoice"><input type="radio" name="status_${esc(t.id)}" value="${v}" ${v==='Done'?'checked':''}>${v}</label>`
  ).join('')}</div>
  <div class="mwreason" style="display:none">
   <div class="mwsmall">Partial / Not Done का कारण चुनें या लिखें</div>
   <div class="mwstatus">${['समय कम पड़ा','समझ नहीं आया','ध्यान भटका','काम अधूरा रह गया','अन्य कारण'].map(v=>
    `<label class="mwchoice"><input type="checkbox" value="${v}">${v}</label>`
   ).join('')}</div>
   <input type="text" maxlength="220" placeholder="अपना कारण लिखें (जरूरी)">
  </div>`;
  item.querySelectorAll('input[type=radio]').forEach(r=>r.addEventListener('change',()=>{
   const selected=item.querySelector('input[type=radio]:checked').value;
   item.querySelector('.mwreason').style.display=['Partial','Not Done'].includes(selected)?'block':'none';
  }));
  box.appendChild(item);
 });

 $('mwGateForm').onsubmit=function(e){
  e.preventDefault();
  const reviews={};
  let err='';
  [...box.children].forEach((item,i)=>{
   const t=s.tasks[i];
   const status=item.querySelector('input[type=radio]:checked')?.value||'Done';
   const checks=[...item.querySelectorAll('.mwreason input[type=checkbox]:checked')].map(x=>x.value);
   const typed=item.querySelector('.mwreason input[type=text]').value.trim();
   const reason=[...checks,typed].filter(Boolean).join(', ');
   if(['Partial','Not Done'].includes(status)&&!reason)err=`Task ${i+1}: Partial/Not Done के लिए कारण जरूरी है।`;
   reviews[t.id]={status,reason};
  });
  if(err){$('mwGateErr').textContent=err;return;}

  const all=migrate();
  const idx=all.findIndex(x=>x.id===s.id);
  if(idx<0)return;
  all[idx].review=reviews;
  all[idx].reviewCompleted=true;
  all[idx].reviewCompletedAt=new Date().toISOString();

  const vals=Object.values(reviews);
  const done=vals.filter(x=>x.status==='Done').length;
  const partial=vals.filter(x=>x.status==='Partial').length;
  all[idx].motivation=done===vals.length
   ?'शानदार! आपने अपनी routine पूरी की। इसी consistency को बनाए रखें।'
   :partial
   ?'अच्छा प्रयास! जो अधूरा रहा, उसे सीखकर अगली routine में बेहतर करें।'
   :'हर दिन नई शुरुआत है। कारणों से सीखें और अगली routine के लिए छोटा, वास्तविक लक्ष्य बनाएं।';

  if(!write(all))return;

  root.innerHTML=`
  <div class="mwbox" style="margin-top:10vh;text-align:center">
   <div style="font-size:48px">✨</div>
   <div style="color:#8fc0ff;font-weight:800">MyWorkspace</div>
   <h1>Review पूरा हुआ!</h1>
   <p>${esc(all[idx].motivation)}</p>
   <p class="mwmeta">Routine ID: ${esc(s.id)}</p>
   <button id="mwGateNext">आगे बढ़ें</button>
  </div>`;

  $('mwGateNext').onclick=()=>{
   root.remove();
   const next=overdue()[0];
   if(next)show(next);
   else{
    sessionStorage.removeItem(SEEN);
    if(location.pathname.toLowerCase().includes('dashboard'))location.reload();
   }
  };
 };
}
function check(){
 const next=overdue()[0];
 if(next)show(next);
}
function start(){
 migrate();
 if(!sessionStorage.getItem(SEEN)){
  sessionStorage.setItem(SEEN,'1');
  check();
 }
 document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='hidden'){
   sessionStorage.setItem(AWAY,'1');
  }else if(sessionStorage.getItem(AWAY)==='1'){
   sessionStorage.removeItem(AWAY);
   check();
  }
 });
 window.addEventListener('pageshow',()=>{
  if(sessionStorage.getItem(AWAY)==='1'){
   sessionStorage.removeItem(AWAY);
   check();
  }
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);
else start();
})();
