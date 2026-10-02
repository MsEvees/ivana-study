(function(){
const $=s=>document.querySelector(s);
const load=(k,d)=>{try{const v=localStorage.getItem('ivana_'+k);return v===null?d:JSON.parse(v)}catch(e){return d}};
const save=(k,v)=>localStorage.setItem('ivana_'+k,JSON.stringify(v));
window.ivana={load,save};


/* Supabase authentication — the publishable key is browser-safe; secrets are never used here. */
const supabaseClient = (window.supabase && window.IVANA_SUPABASE_URL && window.IVANA_SUPABASE_PUBLISHABLE_KEY)
  ? window.supabase.createClient(window.IVANA_SUPABASE_URL, window.IVANA_SUPABASE_PUBLISHABLE_KEY, {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})
  : null;
window.ivana.supabase = supabaseClient;
const isLoginPage = ['0login.html','index.html',''].includes((location.pathname.split('/').pop() || 'index.html'));
const prototypeMode = ()=>localStorage.getItem('ivana_prototype_mode')==='true';

function authMessage(error){
  const m=String(error?.message||'');
  if(/Invalid login credentials/i.test(m)) return 'We could not sign you in. Check your email and password.';
  if(/Email not confirmed/i.test(m)) return 'Please confirm your email first, then try signing in again.';
  if(/already registered|already exists/i.test(m)) return 'An account with this email already exists. Try signing in instead.';
  return m || 'Something went wrong. Please try again.';
}

async function initAuth(){
  if(!supabaseClient){
    if(isLoginPage){ const status=document.querySelector('#loginStatus'); if(status) status.textContent='Sign-in service is not available. Please refresh the page.'; }
    return;
  }
  supabaseClient.auth.onAuthStateChange((event, session)=>{
    if(isLoginPage && event==='SIGNED_IN' && session) location.replace('1index.html');
    if(!isLoginPage && event==='SIGNED_OUT') location.replace('index.html');
  });
  const {data:{session}} = await supabaseClient.auth.getSession();
  if(isLoginPage){ if(session) location.replace('1index.html'); return; }
  if(!session && !prototypeMode()){ location.replace('index.html'); return; }
  document.querySelector('#signOutButton')?.addEventListener('click', async ()=>{
    const btn=document.querySelector('#signOutButton'); if(btn) btn.disabled=true;
    await supabaseClient.auth.signOut();
    localStorage.removeItem('ivana_prototype_mode');
    location.replace('index.html');
  });
}

async function handleLogin(e){
  e.preventDefault();
  const email=document.querySelector('#loginEmail')?.value.trim();
  const password=document.querySelector('#loginPassword')?.value || '';
  const button=document.querySelector('#loginButton'); const status=document.querySelector('#loginStatus');
  if(!supabaseClient){ if(status) status.textContent='Sign-in service is not available. Please refresh the page.'; return; }
  if(button){button.disabled=true;button.textContent='Signing in…'} if(status) status.textContent='';
  const {error}=await supabaseClient.auth.signInWithPassword({email,password});
  if(error){ if(status) status.textContent=authMessage(error); if(button){button.disabled=false;button.textContent='Sign in'} return; }
  const {data:{session}}=await supabaseClient.auth.getSession();
  if(session) location.replace('1index.html');
}

function openAuthModal(mode){
  const modal=document.querySelector('#authModal'); if(!modal)return;
  modal.hidden=false;
  const signup=document.querySelector('#signupForm'), reset=document.querySelector('#resetForm');
  const eyebrow=document.querySelector('#authModalEyebrow'), title=document.querySelector('#authModalTitle'), intro=document.querySelector('#authModalIntro');
  if(mode==='reset'){
    signup.hidden=true; reset.hidden=false; eyebrow.textContent='Reset password'; title.textContent='Let’s get you back in.'; intro.textContent='Enter your email and Supabase will send you a password reset link.';
  }else{
    signup.hidden=false; reset.hidden=true; eyebrow.textContent='Create an account'; title.textContent='Begin your study space.'; intro.textContent='Create your account and we’ll keep your study space connected to you.';
  }
}
function closeAuthModal(){const modal=document.querySelector('#authModal'); if(modal) modal.hidden=true;}

async function handleSignup(e){
  e.preventDefault();
  const email=document.querySelector('#signupEmail')?.value.trim(); const password=document.querySelector('#signupPassword')?.value||''; const confirm=document.querySelector('#signupConfirm')?.value||'';
  const button=document.querySelector('#signupButton'), status=document.querySelector('#signupStatus');
  if(password!==confirm){status.textContent='The passwords do not match.'; return;}
  if(!supabaseClient){status.textContent='Sign-in service is not available. Please refresh the page.'; return;}
  button.disabled=true; button.textContent='Creating account…'; status.textContent='';
  const {data,error}=await supabaseClient.auth.signUp({email,password});
  if(error){status.textContent=authMessage(error); button.disabled=false; button.textContent='Create account'; return;}
  if(data.session){ location.replace('1index.html'); return; }
  status.textContent='Account created. Check your email to confirm your account, then sign in.';
  button.disabled=false; button.textContent='Create account';
}

async function handleReset(e){
  e.preventDefault();
  const email=document.querySelector('#resetEmail')?.value.trim(); const button=document.querySelector('#resetButton'), status=document.querySelector('#resetStatus');
  if(!supabaseClient){status.textContent='Sign-in service is not available. Please refresh the page.'; return;}
  button.disabled=true; button.textContent='Sending…'; status.textContent='';
  const {error}=await supabaseClient.auth.resetPasswordForEmail(email,{redirectTo:new URL('index.html',location.href).href});
  if(error){status.textContent=authMessage(error); button.disabled=false; button.textContent='Send reset link'; return;}
  status.textContent='Check your email for the password reset link.'; button.disabled=false; button.textContent='Send reset link';
}

document.querySelector('#loginForm')?.addEventListener('submit', handleLogin);
document.querySelector('#createAccountLink')?.addEventListener('click', ()=>openAuthModal('signup'));
document.querySelector('#forgotPasswordLink')?.addEventListener('click', ()=>openAuthModal('reset'));
document.querySelector('#authModalClose')?.addEventListener('click', closeAuthModal);
document.querySelector('#signupForm')?.addEventListener('submit', handleSignup);
document.querySelector('#resetForm')?.addEventListener('submit', handleReset);
document.querySelector('#authModal')?.addEventListener('click', e=>{if(e.target.id==='authModal')closeAuthModal()});
initAuth();

/* Temporary prototype entry — remove this block when Supabase authentication is ready to stand alone. */
if(isLoginPage){
  const box=document.querySelector('.box');
  if(box && !document.querySelector('#prototypeLogin')){
    const wrap=document.createElement('div'); wrap.className='prototype-entry';
    wrap.innerHTML='<div class="prototype-divider"><span>or</span></div><button type="button" class="text-link prototype-link" id="prototypeLogin">Enter prototype</button>';
    box.appendChild(wrap);
    document.querySelector('#prototypeLogin')?.addEventListener('click',()=>{localStorage.setItem('ivana_prototype_mode','true');location.replace('1index.html')});
  }
}

/* Course configuration: these are subjects, not mock study content. */
let courseConfig=[];
async function loadCourses(){
 try{const r=await fetch('data/courses.json',{cache:'no-store'});const j=await r.json();courseConfig=Array.isArray(j?.courses)?j.courses:[];}catch(e){courseConfig=[];}
 const selects=[document.querySelector('#resourceCourse'),document.querySelector('#resourceCourseFilter')].filter(Boolean);
 selects.forEach(sel=>{const current=sel.value; const first=sel.id==='resourceCourseFilter'?'<option value="">All courses</option>':'<option value="">Choose course</option>'; sel.innerHTML=first+courseConfig.map(c=>`<option value="${escapeHtml(c.code)}">${escapeHtml(c.code)} — ${escapeHtml(c.title)}</option>`).join(''); if(current)sel.value=current;});
 renderCourses();
 renderResources();
}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));}
function courseName(code){const c=courseConfig.find(x=>x.code===code);return c?`${c.code} — ${c.title}`:(code||'Unassigned');}
function renderCourses(){
 const list=document.querySelector('#courseList'); if(!list)return;
 list.innerHTML=courseConfig.map(c=>`<div class="course-item"><div><div class="course-code">${escapeHtml(c.code)}</div><div class="course-title">${escapeHtml(c.title)}</div></div><div class="course-status">No study materials yet</div></div>`).join('');
}

/* Browser-local source storage for the functional shell. Files are private to this browser for now. */
const DB_NAME='ivana_local'; const DB_VERSION=2; const STORE='sources';
function openSourceDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function putSource(record){const db=await openSourceDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(record);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}
async function getSource(id){const db=await openSourceDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const req=tx.objectStore(STORE).get(id);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function deleteSource(id){const db=await openSourceDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}
function selectedCourses(){return Array.from(document.querySelector('#resourceCourse')?.selectedOptions||[]).map(o=>o.value).filter(Boolean)}
function sourceTypeName(t){return ({syllabus:'Syllabus',book:'Book / book chapter',research_paper:'Research paper',other:'Other academic source'}[t]||'Source')}
const page=location.pathname.split('/').pop()||'index.html';
document.querySelectorAll('.nav a').forEach(a=>{if(a.getAttribute('href')===page)a.classList.add('active')});

let resources=load('resources',[]);
function renderResources(){
 const list=document.querySelector('#libraryList'); if(!list)return;
 const filter=document.querySelector('#resourceCourseFilter')?.value||'';
 const q=(document.querySelector('#resourceSearch')?.value||'').toLowerCase().trim();
 const shown=resources.filter(r=>(!filter||r.courses?.includes(filter)||r.course===filter)&&(!q||`${r.title} ${r.fileName||''} ${r.type||''} ${(r.courses||[]).join(' ')}`.toLowerCase().includes(q)));
 if(!shown.length){list.className='card section empty-state';list.innerHTML='<div class="empty-icon">＋</div><h2>Your library is empty.</h2><p>Add a syllabus, book, research paper, PDF/DOC/DOCX, or copied text to begin building your private study library.</p>';return}
 list.className='card section';
 list.innerHTML='<div class="resource-list">'+shown.map(r=>`<div class="resource-item"><div class="resource-meta"><div class="resource-title">${escapeHtml(r.title)}</div><div class="resource-file">${escapeHtml(sourceTypeName(r.type))}${r.fileName?' · '+escapeHtml(r.fileName):''}</div><div class="resource-course">${escapeHtml((r.courses?.length?r.courses.map(courseName).join(' · '):courseName(r.course)))}</div></div><div class="resource-actions"><button class="btn outline small" data-open-resource="${r.id}">Open</button><button class="btn outline small" data-delete-resource="${r.id}">Remove</button></div></div>`).join('')+'</div>';
 list.querySelectorAll('[data-open-resource]').forEach(b=>b.addEventListener('click',()=>{localStorage.setItem('ivana_currentResource',String(b.dataset.openResource));location.href='3study.html'}));
 list.querySelectorAll('[data-delete-resource]').forEach(b=>b.addEventListener('click',async()=>{const id=Number(b.dataset.deleteResource);await deleteSource(id);resources=resources.filter(r=>Number(r.id)!==id);save('resources',resources);renderResources();}));
}
const upload=$('#addSourceButton'),modal=$('#addSourceBox');
upload?.addEventListener('click',()=>{if(modal)modal.style.display='flex'});
$('#closeAddSource')?.addEventListener('click',()=>modal.style.display='none');
$('#inputMode')?.addEventListener('change',e=>{const text=e.target.value==='text'; if($('#fileInputWrap'))$('#fileInputWrap').style.display=text?'none':'block'; if($('#textInputWrap'))$('#textInputWrap').style.display=text?'block':'none';});
$('#addResource')?.addEventListener('click',async()=>{
 const type=$('#resourceType')?.value||''; const inputMode=$('#inputMode')?.value||'file'; const file=$('#resourceFile')?.files?.[0]; const pasted=$('#resourceText')?.value.trim()||''; const title=$('#resourceTitle')?.value.trim() || file?.name || (pasted? 'Copied text':''); const courses=selectedCourses();
 if(!type){alert('Choose a source type first.');return}
 if(type==='syllabus'&&!courses.length){alert('Select the course this syllabus belongs to.');return}
 if(inputMode==='text'&&!pasted){alert('Paste some text first.');return}
 if(inputMode==='file'&&!file){alert('Choose a PDF, DOC, or DOCX file first.');return}
 const id=Date.now();
 try{await putSource({id,title,type,inputMode,fileName:file?.name||'',courses,course:courses[0]||'',size:file?.size||0,mimeType:file?.type||'text/plain',blob:file||null,text:pasted||'',addedAt:new Date().toISOString()});resources.push({id,title,type,inputMode,fileName:file?.name||'',courses,size:file?.size||0});save('resources',resources);modal.style.display='none';renderResources();alert('Source added to your local Ivana library. It is stored in this browser only for now.');}
 catch(err){console.error(err);alert('The source could not be stored in this browser. Please try again.')} 
});
$('#resourceSearch')?.addEventListener('input',renderResources);
$('#resourceCourseFilter')?.addEventListener('change',renderResources);

/* Open a locally stored source in the Study workspace. PDF is previewed; text is shown; DOC/DOCX is kept for later backend extraction. */
async function renderCurrentResource(){
 const reader=document.querySelector('.reader-empty'); if(!reader)return;
 const id=Number(localStorage.getItem('ivana_currentResource')); if(!id)return;
 const meta=resources.find(r=>Number(r.id)===id); if(!meta)return;
 try{const record=await getSource(id); if(!record){reader.innerHTML='<span>Source not found</span>';return}
   const header=`<div class="reader-title"><strong>${escapeHtml(meta.title)}</strong><small>${escapeHtml(sourceTypeName(meta.type))}${meta.fileName?' · '+escapeHtml(meta.fileName):''}</small></div>`;
   if(record.text){reader.className='reader-empty reader-active';reader.innerHTML=header+`<div class="source-text" style="white-space:pre-wrap;text-align:left;padding:24px;line-height:1.7;background:#fff;border-radius:14px">${escapeHtml(record.text)}</div>`;return}
   if(record.blob && (record.mimeType==='application/pdf'||(record.fileName||'').toLowerCase().endsWith('.pdf'))){const url=URL.createObjectURL(record.blob);reader.className='reader-empty reader-active';reader.innerHTML=header+`<iframe title="PDF reader" src="${url}" style="width:100%;height:70vh;border:0;border-radius:14px;background:#fff"></iframe>`;return}
   if(record.blob){const url=URL.createObjectURL(record.blob);reader.className='reader-empty reader-active';reader.innerHTML=header+`<div style="padding:32px;text-align:center"><p>This ${escapeHtml(sourceTypeName(meta.type))} is stored in your local library.</p><a class="btn primary" href="${url}" download="${escapeHtml(meta.fileName||meta.title)}">Open / download file</a><p class="muted">Full DOC/DOCX content extraction will be handled by Ivana's backend ingestion when Supabase is connected.</p></div>`;return}
 }catch(e){console.error(e);reader.innerHTML='<span>Could not open this source.</span>'}
}
/* Study timer — persistent across pages */
const timerDefaults={sec:1800,mode:'Focus',running:false,endAt:null,sessionStart:null};
let timerState=load('timerState',timerDefaults); if(!timerState||typeof timerState!=='object')timerState={...timerDefaults};
let sec=Number(timerState.sec??1800),mode=timerState.mode||'Focus',running=Boolean(timerState.running),interval=null,sessionStart=timerState.sessionStart||null,lastActivity=Date.now(),idleTriggered=false;
if(running&&timerState.endAt)sec=Math.max(0,Math.ceil((timerState.endAt-Date.now())/1000));
function persistTimer(){save('timerState',{sec,mode,running,endAt:running?Date.now()+sec*1000:null,sessionStart})}
function renderTimer(){const d=$('#timerDisplay');if(!d)return;d.textContent=String(Math.max(0,Math.floor(sec/60))).padStart(2,'0')+':'+String(Math.max(0,sec%60)).padStart(2,'0');if($('#timerLabel'))$('#timerLabel').textContent=mode.toUpperCase();if($('#timerStatus'))$('#timerStatus').textContent=running?'Studying…':'Ready when you are.'}
function addCompletedSession(){const sessions=load('timerSessions',[]);const start=sessionStart?new Date(sessionStart):new Date(Date.now()-1800000);const end=new Date();sessions.push({start:start.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),end:end.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),focus:30,break:10,status:'Completed'});save('timerSessions',sessions);save('sessions',sessions.length);save('focusMinutes',sessions.reduce((a,s)=>a+s.focus,0));sessionStart=null}
function completeTimer(){clearInterval(interval);interval=null;running=false;if(mode==='Focus'){addCompletedSession();mode='Break';sec=600;alert('Focus complete. Take a 10-minute break.')}else{mode='Focus';sec=1800;alert('Break complete. Ready for another focus session.')}persistTimer();renderTimer()}
function startTimer(){if(running)return;running=true;if(!sessionStart)sessionStart=Date.now();lastActivity=Date.now();idleTriggered=false;persistTimer();renderTimer();clearInterval(interval);interval=setInterval(()=>{sec=Math.max(0,sec-1);persistTimer();renderTimer();if(sec<=0)completeTimer()},1000)}
function pauseTimer(){running=false;clearInterval(interval);interval=null;persistTimer();renderTimer()}
function resetTimer(){running=false;clearInterval(interval);interval=null;mode='Focus';sec=1800;sessionStart=null;persistTimer();renderTimer()}
function skipTimer(){running=false;clearInterval(interval);interval=null;if(mode==='Focus'){mode='Break';sec=600}else{mode='Focus';sec=1800}persistTimer();renderTimer()}
window.startTimer=startTimer;window.pauseTimer=pauseTimer;window.resetTimer=resetTimer;window.skipTimer=skipTimer;renderTimer();
if(running){clearInterval(interval);interval=setInterval(()=>{sec=Math.max(0,sec-1);persistTimer();renderTimer();if(sec<=0)completeTimer()},1000)}
window.addEventListener('storage',e=>{if(e.key==='ivana_timerState'){timerState=load('timerState',timerDefaults);sec=Number(timerState.sec??1800);mode=timerState.mode||'Focus';running=Boolean(timerState.running);sessionStart=timerState.sessionStart||null;if(running&&timerState.endAt)sec=Math.max(0,Math.ceil((timerState.endAt-Date.now())/1000));renderTimer()}});

/* Inspire Me — content appears only after the user asks for it. */
const inspiration=[
 {kind:'QUOTE',tag:'STOICISM · PERSEVERANCE',quote:'“The impediment to action advances action. What stands in the way becomes the way.”',author:'— Marcus Aurelius, Meditations',source:'Book 5 · source attribution'},
 {kind:'QUOTE',tag:'STOICISM · CONTROL',quote:'“Some things are in our control and others not.”',author:'— Epictetus, Enchiridion',source:'Chapter 1 · traditional translation'},
 {kind:'QUOTE',tag:'PERSEVERANCE · CHURCHILL',quote:'“Never give in, never give in, never, never, never—in nothing, great or small, large or petty.”',author:'— Winston Churchill, Harrow School, 29 October 1941',source:'Speech · International Churchill Society'},
 {kind:'CONCEPT',tag:'JAPANESE PHILOSOPHY · SHOSHIN',quote:'SHOSHIN — “beginner’s mind.”',author:'A Zen principle associated with openness and curiosity in learning.',source:'Concept card · not presented as a quotation'},
 {kind:'CONCEPT',tag:'JAPANESE PHILOSOPHY · KAIZEN',quote:'KAIZEN — continuous improvement through small, deliberate changes.',author:'A practice-oriented concept of incremental improvement.',source:'Concept card · not presented as a quotation'}
];
let inspirationIndex=Number(load('inspirationIndex',-1));
function showInspiration(){const card=$('#inspireCard');if(!card)return;let next=Math.floor(Math.random()*inspiration.length);if(inspiration.length>1&&next===inspirationIndex)next=(next+1)%inspiration.length;inspirationIndex=next;save('inspirationIndex',inspirationIndex);const q=inspiration[next];$('#inspireKicker').textContent=q.tag;$('#inspireQuote').textContent=q.quote;$('#inspireAuthor').textContent=q.author;$('#inspireSource').textContent=q.source;card.hidden=false}
$('#inspireButton')?.addEventListener('click',showInspiration);$('#inspireNext')?.addEventListener('click',showInspiration);

function makeDraggable(el,key){if(!el)return;const handle=el.querySelector('[data-drag-handle]');if(!handle)return;const savedPos=load('float_'+key,null);if(savedPos&&Number.isFinite(savedPos.left)&&Number.isFinite(savedPos.top)){el.style.left=savedPos.left+'px';el.style.top=savedPos.top+'px';el.style.right='auto';el.style.bottom='auto'}let dragging=false,startX=0,startY=0,baseX=0,baseY=0;const move=(x,y)=>{const maxX=Math.max(8,window.innerWidth-el.offsetWidth-8),maxY=Math.max(8,window.innerHeight-el.offsetHeight-8);el.style.left=Math.min(maxX,Math.max(8,baseX+x-startX))+'px';el.style.top=Math.min(maxY,Math.max(8,baseY+y-startY))+'px';el.style.right='auto';el.style.bottom='auto'};const stop=()=>{if(!dragging)return;dragging=false;el.classList.remove('dragging');document.body.style.userSelect='';save('float_'+key,{left:parseFloat(el.style.left),top:parseFloat(el.style.top)});window.removeEventListener('mousemove',mm);window.removeEventListener('mouseup',stop)};const mm=e=>move(e.clientX,e.clientY);const start=(x,y)=>{dragging=true;startX=x;startY=y;const r=el.getBoundingClientRect();baseX=r.left;baseY=r.top;el.classList.add('dragging');document.body.style.userSelect='none';window.addEventListener('mousemove',mm);window.addEventListener('mouseup',stop)};handle.addEventListener('mousedown',e=>{e.preventDefault();start(e.clientX,e.clientY)})}
makeDraggable($('#postitTimer'),'timer');makeDraggable($('#inspireDevice'),'inspire');

['mousemove','keydown','scroll','click','touchstart'].forEach(ev=>document.addEventListener(ev,()=>{lastActivity=Date.now()}));
setInterval(()=>{if(!running||idleTriggered)return;if(Date.now()-lastActivity>45000){idleTriggered=true}},5000);

let currentPage=1;function renderPage(){if($('#pageNum'))$('#pageNum').textContent=currentPage}$('#prevPage')?.addEventListener('click',()=>{currentPage=Math.max(1,currentPage-1);renderPage()});$('#nextPage')?.addEventListener('click',()=>{currentPage+=1;renderPage()});

document.querySelectorAll('.tool').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.tool').forEach(x=>x.classList.remove('active'));btn.classList.add('active')}));

if($('#sessions')){$('#sessions').textContent=load('sessions',0);$('#focusMinutes').textContent=load('focusMinutes',0)+' min';$('#correct').textContent=load('correct',0);const rows=load('timerSessions',[]),body=$('#sessionTable');if(rows.length&&body)body.innerHTML=rows.slice().reverse().map((s,i)=>`<tr><td>${rows.length-i}</td><td>${s.start}</td><td>${s.end}</td><td>${s.focus} min</td><td>${s.break} min</td><td>${s.status}</td></tr>`).join('')}

const tabs=document.querySelectorAll('.tab'),panels=document.querySelectorAll('.notebook-panel');tabs.forEach(tab=>tab.addEventListener('click',()=>{tabs.forEach(t=>t.classList.remove('active'));tab.classList.add('active');panels.forEach(p=>p.style.display=p.dataset.panel===tab.dataset.tab?'block':'none')}));
const notes=$('#personalNotes');if(notes){notes.value=load('personalNotes','');$('#saveNotes')?.addEventListener('click',()=>{save('personalNotes',notes.value);if($('#saveStatus'))$('#saveStatus').textContent='Saved locally in this browser.'})}
$('#mapReset')?.addEventListener('click',()=>{if($('#mapBreadcrumb'))$('#mapBreadcrumb').textContent='Whole knowledge landscape';if($('#inspectorTitle'))$('#inspectorTitle').textContent='Nothing to explore yet';if($('#inspectorText'))$('#inspectorText').textContent='Concepts and relationships will appear here after Ivana has evidence from your study materials.'});
loadCourses();
renderCurrentResource();
})();
