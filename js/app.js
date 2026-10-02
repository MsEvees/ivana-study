(function(){
const $=s=>document.querySelector(s);
const load=(k,d)=>{try{const v=localStorage.getItem('ivana_'+k);return v===null?d:JSON.parse(v)}catch(e){return d}};
const save=(k,v)=>localStorage.setItem('ivana_'+k,JSON.stringify(v));
window.ivana={load,save,version:'V5'};


/* Supabase authentication — the publishable key is browser-safe; secrets are never used here. */
const supabaseClient = (window.supabase && window.IVANA_SUPABASE_URL && window.IVANA_SUPABASE_PUBLISHABLE_KEY)
  ? window.supabase.createClient(window.IVANA_SUPABASE_URL, window.IVANA_SUPABASE_PUBLISHABLE_KEY, {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})
  : null;
window.ivana.supabase = supabaseClient;
const isLoginPage = ['0login.html','index.html',''].includes((location.pathname.split('/').pop() || 'index.html'));

function authMessage(error){
  const m=String(error?.message||'');
  if(/Invalid login credentials/i.test(m)) return 'We could not sign you in. Check your email and password.';
  if(/Email not confirmed/i.test(m)) return 'Please confirm your email first, then try signing in again.';
  if(/already registered|already exists/i.test(m)) return 'An account with this email already exists. Try signing in instead.';
  return m || 'Something went wrong. Please try again.';
}

async function syncProfile(user){
  if(!supabaseClient||!user)return;
  const displayName=String(user.user_metadata?.display_name||'').trim();
  if(displayName){
    try{ await supabaseClient.from('profiles').upsert({id:user.id,display_name:displayName,updated_at:new Date().toISOString()},{onConflict:'id'}); }catch(e){ console.warn('Ivana profile sync unavailable; auth still works.',e); }
  }
}

async function initAuth(){
  if(!supabaseClient){
    if(isLoginPage){ const status=document.querySelector('#loginStatus'); if(status) status.textContent='Sign-in service is not available. Please refresh the page.'; }
    return;
  }
  supabaseClient.auth.onAuthStateChange((event, session)=>{
    if(session) syncProfile(session.user);
    if(isLoginPage && event==='SIGNED_IN' && session) location.replace('1index.html');
    if(!isLoginPage && event==='SIGNED_OUT') location.replace('index.html');
  });
  const {data:{session}} = await supabaseClient.auth.getSession();
  if(isLoginPage){ if(session) { await syncProfile(session.user); location.replace('1index.html'); } return; }
  if(!session){ location.replace('index.html'); return; }
  if(session) await syncProfile(session.user);
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
  if(session){ await syncProfile(session.user); location.replace('1index.html'); }
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
  const displayName=document.querySelector('#signupDisplayName')?.value.trim();
  const email=document.querySelector('#signupEmail')?.value.trim(); const password=document.querySelector('#signupPassword')?.value||''; const confirm=document.querySelector('#signupConfirm')?.value||'';
  const button=document.querySelector('#signupButton'), status=document.querySelector('#signupStatus');
  if(!displayName){status.textContent='Add the study name Ivana should use for you.'; return;}
  if(password.length<6){status.textContent='Use a password with at least 6 characters.'; return;}
  if(password!==confirm){status.textContent='The passwords do not match.'; return;}
  if(!supabaseClient){status.textContent='Sign-in service is not available. Please refresh the page.'; return;}
  button.disabled=true; button.textContent='Creating account…'; status.textContent='';
  const {data,error}=await supabaseClient.auth.signUp({email,password,options:{data:{display_name:displayName}}});
  if(error){status.textContent=authMessage(error); button.disabled=false; button.textContent='Create account'; return;}
  if(data.session){ await syncProfile(data.session.user); localStorage.removeItem('ivana_prototype_mode'); location.replace('1index.html'); return; }
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

/* Course configuration: subjects are curriculum structure, not mock study content. */
let courseConfig=[];
async function loadCourses(){
 try{const r=await fetch('data/courses.json',{cache:'no-store'});const j=await r.json();courseConfig=Array.isArray(j?.courses)?j.courses:[];}catch(e){courseConfig=[];}
 const filter=document.querySelector('#resourceCourseFilter');
 if(filter){filter.innerHTML='<option value="">All courses</option>'+courseConfig.map(c=>`<option value="${escapeHtml(c.code)}">${escapeHtml(c.code)} — ${escapeHtml(c.title)}</option>`).join('');}
 const sel=document.querySelector('#resourceCourse');
 if(sel){sel.innerHTML=courseConfig.map(c=>`<option value="${escapeHtml(c.code)}">${escapeHtml(c.code)} — ${escapeHtml(c.title)}</option>`).join('');}
 renderCourses(); renderResources(); renderHome();
}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function courseName(code){const c=courseConfig.find(x=>x.code===code);return c?`${c.code} — ${c.title}`:(code||'Unassigned');}
function courseGroup(code){return /^HORT|^CROP SCI/.test(code)?'course-hortcrsc':/^ENS/.test(code)?'course-ens':''}
function renderCourses(){
 const list=document.querySelector('#courseList'); if(!list)return;
 list.innerHTML=courseConfig.map(c=>`<div class="course-item ${courseGroup(c.code)}"><div><div class="course-code">${escapeHtml(c.code)}</div><div class="course-title">${escapeHtml(c.title)}</div></div><div class="course-status">No study materials yet</div></div>`).join('');
}
function selectedCourses(){return Array.from(document.querySelector('#resourceCourse')?.selectedOptions||[]).map(o=>o.value).filter(Boolean)}
function sourceTypeName(t){return ({syllabus:'Syllabus',book:'Book / book chapter',research_paper:'Research paper',other:'Other academic source'})[t]||'Source'}
function shortDate(v){if(!v)return '—';const d=new Date(v);if(Number.isNaN(d.getTime()))return '—';return String(d.getDate()).padStart(2,'0')+' '+d.toLocaleString('en',{month:'short'})+' '+String(d.getFullYear()).slice(-2)}
function formatDuration(mins){const m=Math.max(0,Math.round(Number(mins)||0));const h=Math.floor(m/60),mm=m%60;return h?`${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')} (${h} hour${h===1?'':'s'}, ${mm} minute${mm===1?'':'s'} studying)`: `00:${String(mm).padStart(2,'0')} (${mm} minute${mm===1?'':'s'} studying)`}
function masteryStatus(level){
 const raw=load('mastery',{}); const alt=load('masteryStats',{}); const d=raw?.['level'+level]||raw?.[level]||alt?.['level'+level]||alt?.[level]||{};
 const tests=Number(d.tests??d.testCount??0); const score=Number(d.score??d.average??d.averageScore??0);
 if(tests<10)return {label:'Building evidence',class:'neutral',detail:`${tests}/10 tests`,score:score,tests};
 if(score>85)return {label:'Mastered',class:'green',detail:`${Math.round(score)}% average`,score,tests};
 if(score>=70)return {label:'Developing',class:'yellow',detail:`${Math.round(score)}% average`,score,tests};
 if(score>=50)return {label:'Emerging',class:'orange',detail:`${Math.round(score)}% average`,score,tests};
 return {label:'Revisit',class:'red',detail:`${Math.round(score)}% average`,score,tests};
}
async function renderHomeIdentity(){
  const el=$('#homeGreeting'); if(!el||!supabaseClient)return;
  try{const {data:{user}}=await supabaseClient.auth.getUser(); const name=String(user?.user_metadata?.display_name||'').trim(); if(name)el.textContent='Welcome, '+name+'.';}catch(e){}
}

function renderHome(){
 renderHomeIdentity();
 const sourceCount=resources.filter(r=>r.type!=='syllabus').length;
 const allCodes=courseConfig.map(c=>c.code); const hortCodes=allCodes.filter(c=>/^HORT|^CROP SCI/.test(c)); const ensCodes=allCodes.filter(c=>/^ENS/.test(c));
 const coveredCodes=new Set(resources.filter(r=>r.type!=='syllabus').flatMap(r=>r.courses||[]));
 const hort=Math.round((hortCodes.filter(c=>coveredCodes.has(c)).length/Math.max(1,hortCodes.length))*100); const ens=Math.round((ensCodes.filter(c=>coveredCodes.has(c)).length/Math.max(1,ensCodes.length))*100);
 if($('#homeMapSourceCount'))$('#homeMapSourceCount').textContent=sourceCount;
 if($('#homeMapSummary'))$('#homeMapSummary').innerHTML=sourceCount?`You have uploaded <strong>${sourceCount}</strong> knowledge-map reference${sourceCount===1?'':'s'} so far. These are the books, papers, and other knowledge-bearing sources that can feed your map.`:'No knowledge-map references yet. Add books or papers to begin building the evidence base.';
 if($('#homeHortCoverage'))$('#homeHortCoverage').textContent=hort+'%'; if($('#homeEnsCoverage'))$('#homeEnsCoverage').textContent=ens+'%';
 if($('#homeHortBar'))$('#homeHortBar').style.width=hort+'%'; if($('#homeEnsBar'))$('#homeEnsBar').style.width=ens+'%';
 const latest=[...resources].sort((a,b)=>String(b.addedAt||'').localeCompare(String(a.addedAt||''))).slice(0,5); const list=$('#homeLatestResources');
 if(list)list.innerHTML=latest.length?latest.map(r=>`<div class="home-list-row"><div><strong>${escapeHtml(r.title||r.fileName||'Untitled source')}</strong><span>${escapeHtml(sourceTypeName(r.type))}${r.courses?.length?' · '+escapeHtml(r.courses.join(', ')):''}</span></div><time>${shortDate(r.addedAt)}</time></div>`).join(''):'<div class="home-empty">No materials uploaded yet.</div>';
 const sessions=load('timerSessions',[]); const last=sessions.length?sessions[sessions.length-1]:null; const ss=$('#homeSessionState'); if(ss){ss.innerHTML=last?`<strong>${shortDate(last.date||last.endAt||new Date().toISOString())}</strong><span>Last study time<br><b>${formatDuration(last.focus)}</b></span>`:'<strong>—</strong><span>No study session recorded yet.</span>';}
 const levels=$('#homeMasteryLevels'); if(levels)levels.innerHTML=[1,2,3].map(level=>{const m=masteryStatus(level);return `<div class="mastery-row"><div class="mastery-level">Level ${level}</div><div class="mastery-pill ${m.class}"><span class="mastery-dot"></span><strong>${m.label}</strong><small>${m.detail}</small></div></div>`}).join('');
}
let resources=load('resources',[]);
function renderReferenceRegister(){
 const body=$('#referenceTable');if(!body)return;
 if(!resources.length){body.innerHTML='<tr><td colspan="8">No sources added yet.</td></tr>';return}
 body.innerHTML=resources.slice().sort((a,b)=>String(b.addedAt||'').localeCompare(String(a.addedAt||''))).map(r=>{
  const publication=r.edition||r.publisher||'—';
  return `<tr><td>${escapeHtml(sourceTypeName(r.type))}</td><td>${escapeHtml(r.author||r.instructor||'—')}</td><td>${escapeHtml(r.year||'—')}</td><td>${escapeHtml(r.title||'—')}</td><td>${escapeHtml(publication)}</td><td>${escapeHtml(r.courses?.length?r.courses.map(courseName).join(' · '):'Unassigned')}</td><td>${shortDate(r.addedAt)}</td><td>${r.type==='syllabus'?'<span class="map-lens">Course lens</span>':'<span class="map-eligible">Map source</span>'}</td></tr>`;
 }).join('');
}
function renderResources(){
 const list=document.querySelector('#libraryList'); if(!list)return;
 const filter=document.querySelector('#resourceCourseFilter')?.value||'';
 const q=(document.querySelector('#resourceSearch')?.value||'').toLowerCase().trim();
 const shown=resources.filter(r=>(!filter||r.courses?.includes(filter)||r.course===filter)&&(!q||`${r.title} ${r.fileName||''} ${r.type||''} ${(r.courses||[]).join(' ')} ${r.author||''} ${r.year||''}`.toLowerCase().includes(q)));
 if(!shown.length){list.innerHTML='<div class="empty-icon">＋</div><h2>Your library is empty.</h2><p>Add a source to begin building your private study library.</p>';renderReferenceRegister();return}
 list.innerHTML='<div class="resource-list">'+shown.map(r=>`<div class="resource-item"><div class="resource-meta"><div class="resource-title">${escapeHtml(r.title)}</div><div class="resource-file">${escapeHtml(sourceTypeName(r.type))}${r.fileName?' · '+escapeHtml(r.fileName):''}</div><div class="resource-course">${escapeHtml((r.courses?.length?r.courses.map(courseName).join(' · '):courseName(r.course)))}</div>${r.author?`<div class="resource-biblio">${escapeHtml(r.author)}${r.year?' · '+escapeHtml(r.year):''}${r.edition?' · '+escapeHtml(r.edition):''}${r.publisher?' · '+escapeHtml(r.publisher):''}</div>`:''}<div class="resource-map-status">${r.type==='syllabus'?'Course lens only · not a knowledge-map source':'Knowledge-map eligible reference'}</div></div><div class="resource-actions"><button class="btn outline small" data-open-resource="${r.id}">Open</button><button class="btn outline small" data-delete-resource="${r.id}">Remove</button></div></div>`).join('')+'</div>';
 list.querySelectorAll('[data-open-resource]').forEach(b=>b.addEventListener('click',()=>{localStorage.setItem('ivana_currentResource',String(b.dataset.openResource));location.href='3study.html'}));
 list.querySelectorAll('[data-delete-resource]').forEach(b=>b.addEventListener('click',async()=>{const id=Number(b.dataset.deleteResource);await deleteSource(id);resources=resources.filter(r=>Number(r.id)!==id);save('resources',resources);renderResources();}));
 renderReferenceRegister();
}
function currentSourceTitle(){
 const type=$('#resourceType')?.value||'';
 if(type==='book')return $('#resourceTitle')?.value.trim()||$('#resourceTitleFallback')?.value.trim()||'';
 if(type==='research_paper')return $('#resourceTitlePaper')?.value.trim()||$('#resourceTitleFallback')?.value.trim()||'';
 if(type==='syllabus')return $('#resourceTitleSyllabus')?.value.trim()||$('#resourceTitleFallback')?.value.trim()||'';
 if(type==='other')return $('#resourceTitleOther')?.value.trim()||$('#resourceTitleFallback')?.value.trim()||'';
 return $('#resourceTitleFallback')?.value.trim()||'';
}
function updateSourceFields(){
 const type=$('#resourceType')?.value||'';
 ['bookFields','paperFields','otherFields','syllabusFields'].forEach(id=>{const el=document.getElementById(id);if(el)el.hidden=(id!==({book:'bookFields',research_paper:'paperFields',other:'otherFields',syllabus:'syllabusFields'}[type]||''));});
 const bio=$('#bibliographicFields'); if(bio)bio.hidden=!type;
 const titleFallback=$('#resourceTitleFallback'); if(titleFallback)titleFallback.hidden=!!type;
}
async function addResource(){
 const type=$('#resourceType')?.value||''; const inputMode=$('#inputMode')?.value||'file'; const file=$('#resourceFile')?.files?.[0]; const rich=$('#resourceText'); const pastedHtml=inputMode==='text'?(rich?.innerHTML||'').trim():''; const pastedText=inputMode==='text'?(rich?.innerText||'').trim():''; const title=currentSourceTitle() || file?.name || (pastedText?'Copied text':''); const courses=selectedCourses(); const status=$('#sourceFormStatus');
 if(!type){if(status)status.textContent='Choose a source type first.';return}
 if(type==='syllabus'&&!courses.length){if(status)status.textContent='Select the course this syllabus belongs to.';return}
 if(inputMode==='file'&&!file){if(status)status.textContent='Choose a file first.';return}
 if(inputMode==='text'&&!pastedText){if(status)status.textContent='Paste or type the source text first.';return}
 if(!title){if(status)status.textContent='Add a title.';return}
 const record={id:Date.now(),title,type,inputMode,fileName:file?.name||'',courses,course:courses[0]||'',size:file?.size||0,mimeType:file?.type||'text/html',blob:file||null,text:pastedText||'',html:pastedHtml||'',author:$('#resourceAuthor')?.value.trim()||'',year:$('#resourceYear')?.value.trim()||'',edition:$('#resourceEdition')?.value.trim()||'',publisher:$('#resourcePublisher')?.value.trim()||'',identifier:$('#resourceIdentifier')?.value.trim()||'',accessDate:$('#resourceAccessDate')?.value||'',instructor:$('#resourceInstructor')?.value.trim()||'',toc:$('#resourceToc')?.value.trim()||'',inMap:type!=='syllabus',addedAt:new Date().toISOString()};
 try{await putSource(record);resources.push({...record,blob:undefined,html:undefined,text:undefined});save('resources',resources);const modal=$('#addSourceBox');if(modal)modal.style.display='none';resetSourceForm();renderResources();if(status)status.textContent='';}
 catch(e){console.error(e);if(status)status.textContent='Could not save this source in the browser.'}
}
function resetSourceForm(){
 const f=$('#resourceFile');if(f)f.value='';const rich=$('#resourceText');if(rich)rich.innerHTML='';['resourceType','resourceTitleFallback','resourceAuthor','resourceYear','resourceEdition','resourceTitle','resourceTitlePaper','resourcePublisher','resourceTitleOther','resourceTitleSyllabus','resourceInstructor','resourceIdentifier','resourceAccessDate','resourceToc'].forEach(id=>{const el=$('#'+id);if(el)el.value=''});const c=$('#resourceCourse');if(c)Array.from(c.options).forEach(o=>o.selected=false);if($('#hasToc'))$('#hasToc').checked=false;if($('#tocWrap'))$('#tocWrap').hidden=true;updateSourceFields();}
$('#addSourceButton')?.addEventListener('click',()=>{$('#addSourceBox').style.display='flex';updateSourceFields()});
$('#closeAddSource')?.addEventListener('click',()=>{$('#addSourceBox').style.display='none'});
$('#addSourceBox')?.addEventListener('click',e=>{if(e.target.id==='addSourceBox')e.currentTarget.style.display='none'});
$('#resourceType')?.addEventListener('change',updateSourceFields);
$('#inputMode')?.addEventListener('change',e=>{const text=e.target.value==='text';if($('#fileInputWrap'))$('#fileInputWrap').style.display=text?'none':'';if($('#textInputWrap'))$('#textInputWrap').style.display=text?'':'none';});
$('#hasToc')?.addEventListener('change',e=>{if($('#tocWrap'))$('#tocWrap').hidden=!e.target.checked});
$('#addResource')?.addEventListener('click',addResource);
$('#resourceSearch')?.addEventListener('input',renderResources);$('#resourceCourseFilter')?.addEventListener('change',renderResources);

/* Study resource loading and PDF.js reader. */
let activeSourceRecord=null, pdfDoc=null, pdfPageNumber=1, pdfScale=1, activeAnnotationTool='yellow';
async function openStudyResource(){
 const reader=document.querySelector('#readerEmpty');if(!reader)return;
 const wrap=$('#pdfPageWrap'), metaId=Number(localStorage.getItem('ivana_currentResource')||0);if(!metaId)return;
 try{const record=await getSource(metaId);activeSourceRecord=record;if(!record){reader.innerHTML='<span>Source not found</span>';return}
  $('#readerDocName').textContent=record.title||record.fileName||'Source';renderCapturedNotes();
  if(record.text || record.html){
    reader.hidden=true;wrap.hidden=false;$('#pdfPage').innerHTML='<div class="source-text-view">'+(record.html||escapeHtml(record.text||''))+'</div>';$('#pageCount').textContent='1';$('#pageNum').textContent='1';return;
  }
  if(record.blob && ((record.mimeType||'').includes('pdf')||(record.fileName||'').toLowerCase().endsWith('.pdf'))){
    if(!window.pdfjsLib){reader.innerHTML='<span>PDF reader is unavailable.</span>';return}
    pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const bytes=await record.blob.arrayBuffer();pdfDoc=await pdfjsLib.getDocument({data:bytes}).promise;pdfPageNumber=1;pdfScale=1;$('#pageCount').textContent=pdfDoc.numPages;reader.hidden=true;wrap.hidden=false;await renderPdfPage();return;
  }
  reader.innerHTML='<span>This file is stored in your library.</span><a class="btn primary" href="'+URL.createObjectURL(record.blob)+'" download="'+escapeHtml(record.fileName||record.title)+'">Open / download file</a><small>DOC/DOCX content extraction will be handled by the Supabase ingestion layer.</small>';
 }catch(e){console.error(e);reader.hidden=false;reader.innerHTML='<span>Could not open this source.</span><small>'+escapeHtml(e.message||'Unknown reader error')+'</small>'}
}
async function renderPdfPage(){
 if(!pdfDoc)return;const page=await pdfDoc.getPage(pdfPageNumber);const base=page.getViewport({scale:1});const viewport=page.getViewport({scale:pdfScale});const canvas=$('#pdfCanvas'),ctx=canvas.getContext('2d');canvas.width=viewport.width;canvas.height=viewport.height;$('#pdfPage').style.width=viewport.width+'px';$('#pdfPage').style.height=viewport.height+'px';await page.render({canvasContext:ctx,viewport}).promise;
 const textLayer=$('#textLayer');textLayer.innerHTML='';textLayer.style.width=viewport.width+'px';textLayer.style.height=viewport.height+'px';const content=await page.getTextContent();
 pdfjsLib.renderTextLayer({textContentSource:content,container:textLayer,viewport,textDivs:[]});
 $('#pageNum').textContent=pdfPageNumber;$('#zoomLabel').textContent=Math.round(pdfScale*100)+'%';restoreAnnotations();
}
function selectionRects(){const sel=window.getSelection();if(!sel||sel.isCollapsed||!$('#pdfPage')?.contains(sel.anchorNode))return null;const rects=Array.from(sel.getRangeAt(0).getClientRects());const pageRect=$('#pdfPage').getBoundingClientRect();return {text:sel.toString().trim(),rects:rects.map(r=>({x:(r.left-pageRect.left)/pdfScale,y:(r.top-pageRect.top)/pdfScale,w:r.width/pdfScale,h:r.height/pdfScale})).filter(r=>r.w>1&&r.h>1)};}
function renderCapturedNotes(){const box=$('#capturedNotes');if(!box)return;const entries=load('notebookEntries',[]);const relevant=entries.filter(n=>!activeSourceRecord||Number(n.resourceId)===Number(activeSourceRecord.id));box.innerHTML=relevant.length?relevant.slice().reverse().map(n=>`<article class="captured-note"><div class="captured-note-meta">${escapeHtml(n.type==='highlight-note'?'From highlighted text':'Manual note')} · ${escapeHtml(n.sourceTitle||'Current source')}</div><blockquote>${escapeHtml(n.text)}</blockquote>${n.note?`<p>${escapeHtml(n.note)}</p>`:''}</article>`).join(''):'<div class="home-empty">No captured notes yet.</div>';}
function applyAnnotation(tool){const a=selectionRects();if(!a?.text){$('#readerStatus').textContent='Select text in the PDF first, then choose an annotation tool.';return;}const store=load('annotations',[]);let noteText='';if(tool==='note'){noteText=prompt('Add a note to this highlighted passage (optional):','')??'';}store.push({resourceId:activeSourceRecord?.id,page:pdfPageNumber,type:tool,text:a.text,rects:a.rects,note:noteText});save('annotations',store);if(tool==='note'){const entries=load('notebookEntries',[]);entries.push({id:Date.now(),resourceId:activeSourceRecord?.id,sourceTitle:activeSourceRecord?.title||'Current source',type:'highlight-note',text:a.text,note:noteText,createdAt:new Date().toISOString()});save('notebookEntries',entries);renderCapturedNotes();}window.getSelection()?.removeAllRanges();restoreAnnotations();$('#readerStatus').textContent=tool==='note'?'Saved to Notebook. The highlighted passage is now a note.':(tool==='underline'?'Underline added.':'Highlight added.');}
function restoreAnnotations(){const layer=$('#annotationLayer');if(!layer)return;layer.innerHTML='';const anns=load('annotations',[]).filter(a=>Number(a.resourceId)===Number(activeSourceRecord?.id)&&Number(a.page)===pdfPageNumber);const colors={yellow:'#f5df6d',blue:'#8fb7db',green:'#9fb99b',orange:'#e6a267',red:'#c77d76'};anns.forEach(a=>a.rects.forEach(r=>{const el=document.createElement('div');el.className='annotation-mark '+(a.type==='underline'?'annotation-underline':'');el.style.left=r.x+'px';el.style.top=r.y+'px';el.style.width=r.w+'px';el.style.height=r.h+'px';if(a.type!=='underline')el.style.background=colors[a.type]||colors.yellow;el.title=a.note||a.text;layer.appendChild(el)}));}
document.querySelectorAll('[data-annotation-tool]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-annotation-tool]').forEach(x=>x.classList.remove('active'));btn.classList.add('active');activeAnnotationTool=btn.dataset.annotationTool;applyAnnotation(activeAnnotationTool)}));
$('#prevPage')?.addEventListener('click',async()=>{if(pdfDoc&&pdfPageNumber>1){pdfPageNumber--;await renderPdfPage()}});$('#nextPage')?.addEventListener('click',async()=>{if(pdfDoc&&pdfPageNumber<pdfDoc.numPages){pdfPageNumber++;await renderPdfPage()}});
$('#zoomIn')?.addEventListener('click',async()=>{if(pdfDoc){pdfScale=Math.min(2.5,pdfScale+.1);await renderPdfPage()}});$('#zoomOut')?.addEventListener('click',async()=>{if(pdfDoc){pdfScale=Math.max(.5,pdfScale-.1);await renderPdfPage()}});$('#fitWidth')?.addEventListener('click',async()=>{if(pdfDoc){const p=await pdfDoc.getPage(pdfPageNumber);const v=p.getViewport({scale:1});const available=Math.max(320,($('#readerViewport')?.clientWidth||900)-38);pdfScale=available/v.width;await renderPdfPage()}});
$('#readerViewport')?.addEventListener('mouseup',()=>{if(activeAnnotationTool&&activeAnnotationTool!=='none'){const a=selectionRects();if(a?.text)$('#readerStatus').textContent='Selection ready. Choose an annotation tool to apply it.'}});
openStudyResource();

/* V5 Highlight Guide — quiet, floating, and collapsible. */
function initHighlightGuide(){
  const guide=document.querySelector('#highlightGuide'); if(!guide)return;
  const collapsed=document.querySelector('#guideCollapsed'), close=document.querySelector('#guideClose');
  const key='highlightGuideCollapsed';
  const set=(isCollapsed)=>{guide.classList.toggle('collapsed',isCollapsed);localStorage.setItem('ivana_'+key,JSON.stringify(Boolean(isCollapsed)));};
  const saved=load(key,false); set(Boolean(saved));
  collapsed?.addEventListener('click',()=>set(false));
  close?.addEventListener('click',()=>set(true));
}
initHighlightGuide();

/* Study timer — persistent across pages */
const timerDefaults={sec:1800,mode:'Focus',running:false,endAt:null,sessionStart:null,initialSec:1800};
let timerState=load('timerState',timerDefaults);if(!timerState||typeof timerState!=='object')timerState={...timerDefaults};
let sec=Number(timerState.sec??1800),mode=timerState.mode||'Focus',running=Boolean(timerState.running),interval=null,sessionStart=timerState.sessionStart||null,initialSec=Number(timerState.initialSec??1800),lastActivity=Date.now(),idleTriggered=false;
if(running&&timerState.endAt)sec=Math.max(0,Math.ceil((timerState.endAt-Date.now())/1000));
function persistTimer(){save('timerState',{sec,mode,running,endAt:running?Date.now()+sec*1000:null,sessionStart,initialSec})}
function renderTimer(){const d=$('#timerDisplay');if(!d)return;d.textContent=String(Math.max(0,Math.floor(sec/60))).padStart(2,'0')+':'+String(Math.max(0,sec%60)).padStart(2,'0');if($('#timerLabel'))$('#timerLabel').textContent=mode.toUpperCase();if($('#timerStatus'))$('#timerStatus').textContent=running?'Studying…':'Ready when you are.'}
function logTimerSession(status='Completed'){if(!sessionStart)return;const now=Date.now();const elapsed=Math.max(0,Math.round((now-sessionStart)/60000));if(elapsed<1&&status==='Stopped')return;const sessions=load('timerSessions',[]);const start=new Date(sessionStart),end=new Date(now);sessions.push({start:start.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),end:end.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),date:end.toISOString(),focus:Math.max(1,elapsed),break:mode==='Break'?10:0,status});save('timerSessions',sessions);save('sessions',sessions.length);save('focusMinutes',sessions.reduce((a,s)=>a+Number(s.focus||0),0));sessionStart=null;renderHome()}
function completeTimer(){clearInterval(interval);interval=null;running=false;if(mode==='Focus'){logTimerSession('Completed');mode='Break';sec=600;initialSec=600;alert('Focus complete. Take a 10-minute break.')}else{mode='Focus';sec=1800;initialSec=1800;alert('Break complete. Ready for another focus session.')}persistTimer();renderTimer()}
function startTimer(){if(running)return;running=true;if(!sessionStart){sessionStart=Date.now();initialSec=sec}lastActivity=Date.now();idleTriggered=false;persistTimer();renderTimer();clearInterval(interval);interval=setInterval(()=>{sec=Math.max(0,sec-1);persistTimer();renderTimer();if(sec<=0)completeTimer()},1000)}
function pauseTimer(){running=false;clearInterval(interval);interval=null;persistTimer();renderTimer()}
function stopTimer(){if(running||sessionStart){running=false;clearInterval(interval);interval=null;logTimerSession('Stopped');mode='Focus';sec=1800;initialSec=1800;persistTimer();renderTimer();if($('#timerStatus'))$('#timerStatus').textContent='Session saved.'}}
function resetTimer(){running=false;clearInterval(interval);interval=null;mode='Focus';sec=1800;initialSec=1800;sessionStart=null;persistTimer();renderTimer()}
function skipTimer(){running=false;clearInterval(interval);interval=null;if(mode==='Focus'){mode='Break';sec=600;initialSec=600}else{mode='Focus';sec=1800;initialSec=1800}persistTimer();renderTimer()}
window.startTimer=startTimer;window.pauseTimer=pauseTimer;window.stopTimer=stopTimer;window.resetTimer=resetTimer;window.skipTimer=skipTimer;renderTimer();
if(running){clearInterval(interval);interval=setInterval(()=>{sec=Math.max(0,sec-1);persistTimer();renderTimer();if(sec<=0)completeTimer()},1000)}
window.addEventListener('storage',e=>{if(e.key==='ivana_timerState'){timerState=load('timerState',timerDefaults);sec=Number(timerState.sec??1800);mode=timerState.mode||'Focus';running=Boolean(timerState.running);sessionStart=timerState.sessionStart||null;if(running&&timerState.endAt)sec=Math.max(0,Math.ceil((timerState.endAt-Date.now())/1000));renderTimer()}});

/* Inspire Me — quiet, source-based, and closable. */
const inspiration=[
 {kind:'QUOTE',tag:'STOICISM · PERSEVERANCE',quote:'“The impediment to action advances action. What stands in the way becomes the way.”',author:'— Marcus Aurelius, Meditations',source:'Book 5 · source attribution'},
 {kind:'QUOTE',tag:'STOICISM · CONTROL',quote:'“Some things are in our control and others not.”',author:'— Epictetus, Enchiridion',source:'Chapter 1 · traditional translation'},
 {kind:'QUOTE',tag:'PERSEVERANCE · CHURCHILL',quote:'“Never give in, never give in, never, never, never—in nothing, great or small, large or petty.”',author:'— Winston Churchill, Harrow School, 29 October 1941',source:'Speech · International Churchill Society'},
 {kind:'CONCEPT',tag:'JAPANESE PHILOSOPHY · SHOSHIN',quote:'SHOSHIN — “beginner’s mind.”',author:'A Zen principle associated with openness and curiosity in learning.',source:'Concept card · not presented as a quotation'},
 {kind:'CONCEPT',tag:'JAPANESE PHILOSOPHY · KAIZEN',quote:'KAIZEN — continuous improvement through small, deliberate changes.',author:'A practice-oriented concept of incremental improvement.',source:'Concept card · not presented as a quotation'}
];
let inspirationIndex=Number(load('inspirationIndex',-1));
function showInspiration(){const card=$('#inspireCard');if(!card)return;let next=Math.floor(Math.random()*inspiration.length);if(inspiration.length>1&&next===inspirationIndex)next=(next+1)%inspiration.length;inspirationIndex=next;save('inspirationIndex',inspirationIndex);const q=inspiration[next];$('#inspireKicker').textContent=q.tag;$('#inspireQuote').textContent=q.quote;$('#inspireAuthor').textContent=q.author;$('#inspireSource').textContent=q.source;card.hidden=false}
function closeInspiration(){if($('#inspireCard'))$('#inspireCard').hidden=true}
$('#inspireButton')?.addEventListener('click',showInspiration);$('#inspireNext')?.addEventListener('click',showInspiration);$('#inspireClose')?.addEventListener('click',closeInspiration);

function makeDraggable(el,key){if(!el)return;const handle=el.querySelector('[data-drag-handle]');if(!handle)return;const savedPos=load('float_'+key,null);if(savedPos&&Number.isFinite(savedPos.left)&&Number.isFinite(savedPos.top)){el.style.left=savedPos.left+'px';el.style.top=savedPos.top+'px';el.style.right='auto';el.style.bottom='auto'}let dragging=false,startX=0,startY=0,baseX=0,baseY=0;const move=(x,y)=>{const maxX=Math.max(8,window.innerWidth-el.offsetWidth-8),maxY=Math.max(8,window.innerHeight-el.offsetHeight-8);el.style.left=Math.min(maxX,Math.max(8,baseX+x-startX))+'px';el.style.top=Math.min(maxY,Math.max(8,baseY+y-startY))+'px';el.style.right='auto';el.style.bottom='auto'};const stop=()=>{if(!dragging)return;dragging=false;el.classList.remove('dragging');document.body.style.userSelect='';save('float_'+key,{left:parseFloat(el.style.left),top:parseFloat(el.style.top)});window.removeEventListener('mousemove',mm);window.removeEventListener('mouseup',stop)};const mm=e=>move(e.clientX,e.clientY);const start=(x,y)=>{dragging=true;startX=x;startY=y;const r=el.getBoundingClientRect();baseX=r.left;baseY=r.top;el.classList.add('dragging');document.body.style.userSelect='none';window.addEventListener('mousemove',mm);window.addEventListener('mouseup',stop)};handle.addEventListener('mousedown',e=>{e.preventDefault();start(e.clientX,e.clientY)})}
makeDraggable($('#studyFloatDock'),'dock');

['mousemove','keydown','scroll','click','touchstart'].forEach(ev=>document.addEventListener(ev,()=>{lastActivity=Date.now()}));
setInterval(()=>{if(!running||idleTriggered)return;if(Date.now()-lastActivity>45000){idleTriggered=true}},5000);

/* Study side panels */
document.querySelectorAll('.side-tab').forEach(btn=>btn.addEventListener('click',()=>{const key=btn.dataset.tab;document.querySelectorAll('.side-tab').forEach(x=>x.classList.toggle('active',x===btn));document.querySelectorAll('.side-panel').forEach(p=>p.hidden=p.dataset.panel!==key)}));
const notes=$('#personalNotes');if(notes){notes.value='';$('#saveNotes')?.addEventListener('click',()=>{const text=notes.value.trim();if(!text)return;const entries=load('notebookEntries',[]);entries.push({id:Date.now(),resourceId:activeSourceRecord?.id||null,sourceTitle:activeSourceRecord?.title||'Notebook',type:'manual',text,note:'',createdAt:new Date().toISOString()});save('notebookEntries',entries);notes.value='';renderCapturedNotes();if($('#saveStatus'))$('#saveStatus').textContent='Saved to Notebook.'})}

if($('#sessions')){$('#sessions').textContent=load('sessions',0);$('#focusMinutes').textContent=load('focusMinutes',0)+' min';$('#correct').textContent=load('correct',0);const rows=load('timerSessions',[]),body=$('#sessionTable');if(rows.length&&body)body.innerHTML=rows.slice().reverse().map((s,i)=>`<tr><td>${rows.length-i}</td><td>${s.start}</td><td>${s.end}</td><td>${s.focus} min</td><td>${s.break} min</td><td>${s.status}</td></tr>`).join('')}


function updateKnowledgeMapState(){const canvas=$('#knowledgeCanvas');if(!canvas)return;const eligible=resources.filter(r=>r.type!=='syllabus');if(!eligible.length){canvas.classList.add('empty-map');canvas.innerHTML='<div class="map-empty-message"><div class="empty-icon">✦</div><h2>Your map is empty.</h2><p>Syllabi define the course lens, but they do not become knowledge-map concepts by themselves. Add a book, paper, or other knowledge-bearing reference to begin.</p></div>';return;}canvas.classList.add('empty-map');canvas.innerHTML='<div class="map-empty-message"><div class="empty-icon">✦</div><h2>Reference material is ready.</h2><p>'+eligible.length+' knowledge-bearing source'+(eligible.length===1?'':'s')+' can contribute evidence to the map. Concepts and relationships will appear after Ivana processes the material.</p></div>';}
$('#mapReset')?.addEventListener('click',()=>{if($('#mapBreadcrumb'))$('#mapBreadcrumb').textContent='Whole knowledge landscape';if($('#inspectorTitle'))$('#inspectorTitle').textContent='Nothing to explore yet';if($('#inspectorText'))$('#inspectorText').textContent='Concepts and relationships will appear here after Ivana has evidence from your study materials.'});
renderCapturedNotes();
renderHome();
loadCourses();
updateKnowledgeMapState();
})();
