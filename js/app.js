
(function(){
const $=s=>document.querySelector(s);
const load=(k,d)=>{try{const v=localStorage.getItem('ivana_'+k);return v===null?d:JSON.parse(v)}catch(e){return d}};
const save=(k,v)=>localStorage.setItem('ivana_'+k,JSON.stringify(v));
window.ivana={load,save};

const page=location.pathname.split('/').pop()||'0login.html';
document.querySelectorAll('.nav a').forEach(a=>{if(a.getAttribute('href')===page)a.classList.add('active')});

$('#demoLogin')?.addEventListener('click',e=>{e.preventDefault();location.href='1index.html'});
$('#loginForm')?.addEventListener('submit',e=>{e.preventDefault();location.href='1index.html'});

/* Library demo */
const upload=$('#uploadDemo'), modal=$('#uploadDemoBox');
upload?.addEventListener('click',()=>modal.style.display='flex');
$('#closeUpload')?.addEventListener('click',()=>modal.style.display='none');
$('#closeUpload2')?.addEventListener('click',()=>modal.style.display='none');

/* Search */
$('#resourceSearch')?.addEventListener('input',e=>{
 const q=e.target.value.toLowerCase();
 document.querySelectorAll('[data-search]').forEach(x=>x.style.display=x.dataset.search.includes(q)?'flex':'none');
});

/* Study timer — persistent across Ivana pages/tabs */
const timerDefaults={sec:1800,mode:'Focus',running:false,endAt:null,sessionStart:null};
let timerState=load('timerState',timerDefaults);
if(!timerState || typeof timerState!=='object') timerState={...timerDefaults};
let sec=Number(timerState.sec ?? 1800),mode=timerState.mode||'Focus',running=Boolean(timerState.running),interval=null,sessionStart=timerState.sessionStart||null,lastActivity=Date.now(),idleTriggered=false;
if(running && timerState.endAt){sec=Math.max(0,Math.ceil((timerState.endAt-Date.now())/1000));}
function persistTimer(){save('timerState',{sec,mode,running,endAt:running?Date.now()+sec*1000:null,sessionStart});}
function renderTimer(){
 const d=$('#timerDisplay'); if(!d)return;
 d.textContent=String(Math.max(0,Math.floor(sec/60))).padStart(2,'0')+':'+String(Math.max(0,sec%60)).padStart(2,'0');
 if($('#timerLabel'))$('#timerLabel').textContent=mode.toUpperCase();
 if($('#timerStatus'))$('#timerStatus').textContent=running?'Studying…':'Ready when you are.';
}
function addCompletedSession(){
 const sessions=load('timerSessions',[]);
 const start=sessionStart?new Date(sessionStart):new Date(Date.now()-1800000);
 const end=new Date();
 sessions.push({start:start.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),end:end.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),focus:30,break:10,status:'Completed'});
 save('timerSessions',sessions); save('sessions',sessions.length); save('focusMinutes',sessions.reduce((a,s)=>a+s.focus,0)); sessionStart=null;
}
function completeTimer(){
 clearInterval(interval); interval=null; running=false;
 if(mode==='Focus'){addCompletedSession();mode='Break';sec=600;alert('Focus complete. Take a 10-minute break.');}
 else {mode='Focus';sec=1800;alert('Break complete. Ready for another focus session.');}
 persistTimer();renderTimer();
}
function startTimer(){
 if(running)return;
 running=true; if(!sessionStart)sessionStart=Date.now(); lastActivity=Date.now();idleTriggered=false;
 persistTimer();renderTimer();
 clearInterval(interval);
 interval=setInterval(()=>{sec=Math.max(0,sec-1);persistTimer();renderTimer();if(sec<=0)completeTimer()},1000);
}
function pauseTimer(){running=false;clearInterval(interval);interval=null;persistTimer();renderTimer()}
function resetTimer(){running=false;clearInterval(interval);interval=null;mode='Focus';sec=1800;sessionStart=null;persistTimer();renderTimer()}
function skipTimer(){running=false;clearInterval(interval);interval=null;if(mode==='Focus'){mode='Break';sec=600}else{mode='Focus';sec=1800}persistTimer();renderTimer()}
window.startTimer=startTimer;window.pauseTimer=pauseTimer;window.resetTimer=resetTimer;window.skipTimer=skipTimer;
renderTimer();
if(running){ clearInterval(interval); interval=setInterval(()=>{sec=Math.max(0,sec-1);persistTimer();renderTimer();if(sec<=0)completeTimer()},1000); }
window.addEventListener('storage',e=>{if(e.key==='ivana_timerState'){timerState=load('timerState',timerDefaults);sec=Number(timerState.sec??1800);mode=timerState.mode||'Focus';running=Boolean(timerState.running);sessionStart=timerState.sessionStart||null;if(running&&timerState.endAt)sec=Math.max(0,Math.ceil((timerState.endAt-Date.now())/1000));renderTimer()}});

/* V2 floating study devices ------------------------------------------------ */
const inspiration=[
 {kind:'QUOTE',tag:'STOICISM · PERSEVERANCE',quote:'“The impediment to action advances action. What stands in the way becomes the way.”',author:'— Marcus Aurelius, Meditations',source:'Book 5 · public-domain translation'},
 {kind:'QUOTE',tag:'STOICISM · CONTROL',quote:'“Some things are in our control and others not.”',author:'— Epictetus, Enchiridion',source:'Chapter 1 · public-domain translation'},
 {kind:'QUOTE',tag:'STOICISM · DIFFICULTY',quote:'“Difficulties strengthen the mind, as labour does the body.”',author:'— Seneca, Letters to Lucilius',source:'Commonly translated from Seneca’s Letters'},
 {kind:'QUOTE',tag:'PERSEVERANCE · CHURCHILL',quote:'“Never give in, never give in, never, never, never—in nothing, great or small, large or petty.”',author:'— Winston Churchill, Harrow School, 29 October 1941',source:'Verified speech · International Churchill Society'},
 {kind:'QUOTE',tag:'COURAGE · CHURCHILL',quote:'“There is no time for ease and comfort. It is time to dare and endure.”',author:'— Winston Churchill',source:'Churchill, 1940 · quotation attribution retained in prototype'},
 {kind:'QUOTE',tag:'LEARNING · HUMILITY',quote:'“The important thing is not to stop questioning. Curiosity has its own reason for existing.”',author:'— Albert Einstein',source:'Quotation commonly attributed to Einstein · source note retained for later verification'},
 {kind:'CONCEPT',tag:'JAPANESE PHILOSOPHY · SHOSHIN',quote:'SHOSHIN — “beginner’s mind.”',author:'A Zen principle of approaching learning with openness, curiosity, and freedom from assumptions.',source:'Concept card · not presented as a quotation'},
 {kind:'CONCEPT',tag:'JAPANESE PHILOSOPHY · KAIZEN',quote:'KAIZEN — continuous improvement through small, deliberate changes.',author:'A practice-oriented concept: improve the process one step at a time.',source:'Concept card · not presented as a quotation'},
 {kind:'CONCEPT',tag:'JAPANESE PHILOSOPHY · GAMAN',quote:'GAMAN — enduring difficulty with patience and dignity.',author:'A concept associated with perseverance and self-restraint under hardship.',source:'Concept card · not presented as a quotation'},
 {kind:'CONCEPT',tag:'JAPANESE AESTHETICS · KINTSUGI',quote:'KINTSUGI — repair does not have to erase the history of what was broken.',author:'A metaphor often used for resilience, repair, and accepting imperfection.',source:'Concept card · metaphor, not a quotation'},
 {kind:'CONCEPT',tag:'JAPANESE AESTHETICS · WABI-SABI',quote:'WABI-SABI — finding value in impermanence, simplicity, and imperfection.',author:'Aesthetic/philosophical concept rather than a single fixed doctrine.',source:'Concept card · not presented as a quotation'},
 {kind:'QUOTE',tag:'DISCIPLINE · LEARNING',quote:'“We are what we repeatedly do.”',author:'— Aristotle, traditional attribution',source:'Attribution is a paraphrase associated with Aristotle; kept as a short traditional saying'},
 {kind:'QUOTE',tag:'COURAGE · ACTION',quote:'“He who fears he will suffer, already suffers because he fears.”',author:'— Michel de Montaigne',source:'Essays · traditional English translation'},
 {kind:'QUOTE',tag:'ENDURANCE · PURPOSE',quote:'“He who has a why to live can bear almost any how.”',author:'— Friedrich Nietzsche',source:'Twilight of the Idols / later popular translation tradition'},
 {kind:'QUOTE',tag:'SCIENCE · CURIOSITY',quote:'“Nothing in life is to be feared, it is only to be understood.”',author:'— Marie Curie',source:'Widely attributed quotation · source note retained for later verification'},
 {kind:'QUOTE',tag:'KNOWLEDGE · PRACTICE',quote:'“Knowledge is power.”',author:'— Francis Bacon',source:'Traditional attribution; commonly connected with Bacon’s writings'},
 {kind:'QUOTE',tag:'PERSISTENCE · WORK',quote:'“Genius is one percent inspiration and ninety-nine percent perspiration.”',author:'— Thomas A. Edison',source:'Frequently attributed to Edison; concise historical quotation'},
 {kind:'QUOTE',tag:'FOCUS · MASTERy',quote:'“The secret of getting ahead is getting started.”',author:'— Mark Twain, commonly attributed',source:'Attribution disputed; retained as a clearly labeled traditional quotation'},
 {kind:'QUOTE',tag:'STUDY · ATTENTION',quote:'“The mind is not a vessel to be filled but a fire to be kindled.”',author:'— Plutarch, traditional translation',source:'Moralia · traditional English rendering'}
];
let inspirationIndex=Number(load('inspirationIndex',-1));
function showInspiration(){
 const card=$('#inspireCard'); if(!card)return;
 let next=Math.floor(Math.random()*inspiration.length);
 if(inspiration.length>1 && next===inspirationIndex) next=(next+1)%inspiration.length;
 inspirationIndex=next; save('inspirationIndex',inspirationIndex);
 const q=inspiration[next];
 $('#inspireKicker').textContent=q.tag;
 $('#inspireQuote').textContent=q.quote;
 $('#inspireAuthor').textContent=q.author;
 $('#inspireSource').textContent=q.source;
 card.hidden=false;
}
$('#inspireButton')?.addEventListener('click',showInspiration);
$('#inspireNext')?.addEventListener('click',showInspiration);

function makeDraggable(el, key){
 const handle=el.querySelector('[data-drag-handle]'); if(!handle)return;
 const saved=load('float_'+key,null);
 if(saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)){
   el.style.left=saved.left+'px'; el.style.top=saved.top+'px'; el.style.right='auto'; el.style.bottom='auto';
 }
 let dragging=false,startX=0,startY=0,baseX=0,baseY=0;
 const move=(x,y)=>{
   const maxX=Math.max(8,window.innerWidth-el.offsetWidth-8), maxY=Math.max(8,window.innerHeight-el.offsetHeight-8);
   const left=Math.min(maxX,Math.max(8,baseX+(x-startX))); const top=Math.min(maxY,Math.max(8,baseY+(y-startY)));
   el.style.left=left+'px';el.style.top=top+'px';el.style.right='auto';el.style.bottom='auto';
 };
 const stop=()=>{if(!dragging)return;dragging=false;el.classList.remove('dragging');document.body.style.userSelect='';save('float_'+key,{left:parseFloat(el.style.left),top:parseFloat(el.style.top)});window.removeEventListener('mousemove',mm);window.removeEventListener('mouseup',stop);window.removeEventListener('touchmove',tm);window.removeEventListener('touchend',stop)};
 const mm=e=>move(e.clientX,e.clientY); const tm=e=>{if(e.touches[0])move(e.touches[0].clientX,e.touches[0].clientY)};
 const start=(x,y)=>{dragging=true;startX=x;startY=y;const r=el.getBoundingClientRect();baseX=r.left;baseY=r.top;el.classList.add('dragging');document.body.style.userSelect='none';window.addEventListener('mousemove',mm);window.addEventListener('mouseup',stop);window.addEventListener('touchmove',tm,{passive:false});window.addEventListener('touchend',stop)};
 handle.addEventListener('mousedown',e=>{e.preventDefault();start(e.clientX,e.clientY)});
 handle.addEventListener('touchstart',e=>{if(e.touches[0]){e.preventDefault();start(e.touches[0].clientX,e.touches[0].clientY)}},{passive:false});
}
makeDraggable($('#postitTimer'),'timer');
makeDraggable($('#inspireDevice'),'inspire');


/* Gentle idle/drift detection. Prototype uses 45 seconds so it can be tested easily.
   Online V2 should use a longer threshold such as 5–10 minutes. */
['mousemove','keydown','scroll','click','touchstart'].forEach(ev=>document.addEventListener(ev,()=>{lastActivity=Date.now()}));
setInterval(()=>{
 if(!running || idleTriggered)return;
 if(Date.now()-lastActivity>45000){
   idleTriggered=true;
   const overlay=$('#driftOverlay');
   if(overlay){
     const title=$('#driftTitle'),msg=$('#driftMessage');
     const variants=[
       ['You seemed to be studying…','Please turn the timer on again when you’re ready.'],
       ['We are drifting a bit, aren’t we?','Let’s return to our studying.'],
       ['You have been idle for quite some time.','Let’s learn again?']
     ];
     const v=variants[Math.floor(Math.random()*variants.length)];
     title.textContent=v[0];msg.textContent=v[1];overlay.style.display='flex';
   }
 }
},5000);
$('#backToStudy')?.addEventListener('click',()=>{$('#driftOverlay').style.display='none';lastActivity=Date.now();idleTriggered=false});

/* Page controls */
let currentPage=12;
function renderPage(){
 if($('#pageNum'))$('#pageNum').textContent=currentPage;
 if($('#pageJump'))$('#pageJump').value=currentPage;
}
$('#prevPage')?.addEventListener('click',()=>{currentPage=Math.max(1,currentPage-1);renderPage()});
$('#nextPage')?.addEventListener('click',()=>{currentPage=Math.min(118,currentPage+1);renderPage()});
$('#pageJump')?.addEventListener('change',e=>{currentPage=Math.min(118,Math.max(1,Number(e.target.value)||1));renderPage()});

/* Annotation tools */
document.querySelectorAll('.tool').forEach(btn=>btn.addEventListener('click',()=>{
 document.querySelectorAll('.tool').forEach(x=>x.classList.remove('active'));btn.classList.add('active');
}));

/* Review */
$('#reviewSubmit')?.addEventListener('click',()=>{
 const selected=document.querySelector('input[name="q"]:checked'),f=$('#feedback');
 if(!selected){f.textContent='Choose an answer first.'}
 else if(selected.value==='b'){
   save('correct',load('correct',0)+1);
   f.textContent='Good. Now ask yourself why that answer works—and what the evidence can actually support.';
 } else {
   f.textContent='That is useful information. Let’s find the part of the reasoning that needs rebuilding.';
 }
 f.classList.add('show');
});

/* Progress */
if($('#sessions')){
 $('#sessions').textContent=load('sessions',0);
 $('#focusMinutes').textContent=(load('focusMinutes',0))+' min';
 $('#correct').textContent=load('correct',0);
 const rows=load('timerSessions',[]);
 const body=$('#sessionTable');
 if(rows.length){
   body.innerHTML=rows.slice().reverse().map((s,i)=>`<tr><td>${rows.length-i}</td><td>${s.start}</td><td>${s.end}</td><td>${s.focus} min</td><td>${s.break} min</td><td>${s.status}</td></tr>`).join('');
 }
}

/* Notebook */
const tabs=document.querySelectorAll('.tab'),panels=document.querySelectorAll('.notebook-panel');
tabs.forEach(tab=>tab.addEventListener('click',()=>{
 tabs.forEach(t=>t.classList.remove('active'));tab.classList.add('active');
 panels.forEach(p=>p.style.display=p.dataset.panel===tab.dataset.tab?'block':'none');
}));
const notes=$('#personalNotes');
if(notes){
 notes.value=load('personalNotes','');
 $('#saveNotes')?.addEventListener('click',()=>{save('personalNotes',notes.value);$('#saveStatus').textContent='Saved locally in this browser.'});
}

/* Knowledge Map: freeform graph / mental-model view */
const canvas=$('#knowledgeCanvas');
if(canvas){
 const edges=[
  ['water','drought'],['water','stomata'],['drought','stomata'],['stomata','photosynthesis'],
  ['development','florigen'],['florigen','ft'],['florigen','photoperiod'],['florigen','flowering'],
  ['ft','flowering'],['photoperiod','flowering'],['hormones','aba'],['hormones','florigen'],
  ['aba','drought'],['crosscourse','water'],['crosscourse','hormones'],['crosscourse','development']
 ];
 const info={
  water:['Water relations','CRSC 245 · ENS 201 · ENS 296','Recurring umbrella concept','References currently represented in the map'],
  drought:['Drought','CRSC 245 · core','Stress / environmental response','Connects water relations, stomatal regulation and ABA'],
  stomata:['Stomatal regulation','CRSC 245 · HORT 232','Cross-course relationship','Links water status with gas exchange and hormonal regulation'],
  photosynthesis:['Gas exchange','CRSC 245','Specific concept','Connected to stomatal regulation and environmental response'],
  development:['Plant development','HORT 230 · HORT 231 · HORT 232','Umbrella concept','A broad region connecting developmental and hormonal concepts'],
  florigen:['Florigen','HORT 231 · core · HORT 232/241 related','Course relevance differs by subject','Strongest representation is in HORT 231; related/mentioned elsewhere. Connected to FT, photoperiod and floral transition.'],
  ft:['FT','HORT 231 · specific concept','Specific concept','Directly connected to florigen and floral transition in this prototype'],
  photoperiod:['Photoperiod','HORT 231 · environmental cue','Specific concept','Connected to florigen and flowering transition'],
  hormones:['Growth-regulator interactions','HORT 232 · HORT 231','Cross-course theme','A relationship region, not a claim that all courses treat it equally'],
  aba:['ABA','HORT 232 · stress response','Specific concept','Connects hormonal regulation with drought response'],
  flowering:['Floral transition','HORT 231','Specific concept','Connected to florigen, FT and photoperiod'],
  crosscourse:['Cross-course pattern','Ivana inference · verify','Inference','A possible bridge across reference clusters. It should remain explicitly marked as inference until supported by source material.']
 };
 const svg=$('#knowledgeEdges');
 function drawEdges(){
  if(!svg)return;
  const r=canvas.getBoundingClientRect(); svg.setAttribute('viewBox',`0 0 ${r.width} ${r.height}`); svg.innerHTML='';
  edges.forEach(([a,b])=>{const A=canvas.querySelector(`[data-id="${a}"]`),B=canvas.querySelector(`[data-id="${b}"]`); if(!A||!B)return; const ar=A.getBoundingClientRect(),br=B.getBoundingClientRect(); const x1=ar.left+ar.width/2-r.left,y1=ar.top+ar.height/2-r.top,x2=br.left+br.width/2-r.left,y2=br.top+br.height/2-r.top; const line=document.createElementNS('http://www.w3.org/2000/svg','line'); line.setAttribute('x1',x1);line.setAttribute('y1',y1);line.setAttribute('x2',x2);line.setAttribute('y2',y2);line.setAttribute('marker-end','url(#arrow)');line.dataset.edge=`${a}-${b}`;svg.appendChild(line);});
  if(!svg.querySelector('defs')){const defs=document.createElementNS('http://www.w3.org/2000/svg','defs');defs.innerHTML='<marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="#b5b19f"></path></marker>';svg.prepend(defs);}
 }
 function focus(id){
  const n=canvas.querySelector(`[data-id="${id}"]`); if(!n)return;
  canvas.querySelectorAll('.map-node-free').forEach(x=>x.classList.remove('selected','related','faded'));
  const related=new Set([id]); edges.forEach(([a,b])=>{if(a===id)related.add(b);if(b===id)related.add(a);});
  canvas.querySelectorAll('.map-node-free').forEach(x=>{if(x.dataset.id===id)x.classList.add('selected');else if(related.has(x.dataset.id))x.classList.add('related');else x.classList.add('faded');});
  const d=info[id]; $('#mapBreadcrumb').textContent=`Focused: ${d[0]}`; $('#inspectorTitle').textContent=d[0]; $('#inspectorText').textContent=d[3]; $('#inspectorMeta').innerHTML=`<span>${d[1]}</span><span>${d[2]}</span>`;
 }
 canvas.querySelectorAll('.map-node-free').forEach(n=>n.addEventListener('click',()=>focus(n.dataset.id)));
 $('#mapReset')?.addEventListener('click',()=>{canvas.querySelectorAll('.map-node-free').forEach(x=>x.classList.remove('selected','related','faded'));$('#mapBreadcrumb').textContent='Whole knowledge landscape';$('#inspectorTitle').textContent='Explore the landscape';$('#inspectorText').textContent='Click a concept to see its course relevance, connected concepts, and the evidence currently available to Ivana. The map grows as you add references, highlights, notes, and other study inputs.';$('#inspectorMeta').innerHTML='';});
 $('#mapFocusFlorigen')?.addEventListener('click',()=>focus('florigen'));
 new ResizeObserver(drawEdges).observe(canvas); window.addEventListener('resize',drawEdges); setTimeout(drawEdges,60);
}
})();
