(function(){
const $=s=>document.querySelector(s);
const load=(k,d)=>{try{const v=localStorage.getItem('ivana_'+k);return v===null?d:JSON.parse(v)}catch(e){return d}};
const save=(k,v)=>localStorage.setItem('ivana_'+k,JSON.stringify(v));
window.ivana={load,save};
const page=location.pathname.split('/').pop()||'index.html';
document.querySelectorAll('.nav a').forEach(a=>{if(a.getAttribute('href')===page)a.classList.add('active')});
$('#demoLogin')?.addEventListener('click',e=>{e.preventDefault();location.href='1index.html'});
$('#loginForm')?.addEventListener('submit',e=>{e.preventDefault();location.href='1index.html'});

/* Empty starter library: no resources are preloaded. */
const resources=load('resources',[]);
function renderLibrary(){
 const empty=$('.empty-state'); const search=$('#resourceSearch');
 if(search)search.disabled=resources.length===0;
 if(empty && resources.length){empty.innerHTML='<h2>Your resources</h2><p>Resources added in this browser will appear here.</p>'}
}
renderLibrary();
const upload=$('#uploadDemo'),modal=$('#uploadDemoBox');
upload?.addEventListener('click',()=>{if(modal)modal.style.display='flex'});
$('#closeUpload')?.addEventListener('click',()=>modal.style.display='none');
$('#addResource')?.addEventListener('click',()=>{
 const file=$('#pdfFile')?.files?.[0]; const title=$('#resourceTitle')?.value.trim() || file?.name || '';
 if(!file){alert('Choose a PDF first.');return}
 resources.push({id:Date.now(),title,fileName:file.name,course:$('#resourceCourse')?.value||'',size:file.size});
 save('resources',resources); modal.style.display='none'; renderLibrary(); alert('Resource added to this browser prototype. Private cloud upload will be connected through Supabase next.');
});
$('#resourceSearch')?.addEventListener('input',e=>{
 const q=e.target.value.toLowerCase();document.querySelectorAll('[data-search]').forEach(x=>x.style.display=x.dataset.search.includes(q)?'flex':'none');
});

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
 {kind:'QUOTE',tag:'STOICISM · PERSEVERANCE',quote:'“The impediment to action advances action. What stands in the way becomes the way.”',author:'— Marcus Aurelius, Meditations',source:'Book 5 · source attribution shown in the prototype'},
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
$('#addCourseDemo')?.addEventListener('click',()=>alert('Course setup will be connected to Supabase next. No courses are preloaded.'));
})();
