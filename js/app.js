(function(){
const $=s=>document.querySelector(s);
const load=(k,d)=>{try{const v=localStorage.getItem('ivana_'+k);return v===null?d:JSON.parse(v)}catch(e){return d}};
const save=(k,v)=>localStorage.setItem('ivana_'+k,JSON.stringify(v));
window.ivana={load,save};


/* V5.2 Supabase authentication — hardened for first-project testing. */
const supabaseClient = (window.supabase && window.IVANA_SUPABASE_URL && window.IVANA_SUPABASE_PUBLISHABLE_KEY)
  ? window.supabase.createClient(window.IVANA_SUPABASE_URL, window.IVANA_SUPABASE_PUBLISHABLE_KEY, {
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
    })
  : null;
window.ivana.supabase = supabaseClient;
window.ivana.version='V5.2';
const isLoginPage = ['0login.html','index.html',''].includes((location.pathname.split('/').pop() || 'index.html'));
const prototypeMode = ()=>localStorage.getItem('ivana_prototype_mode')==='true';

function authMessage(error){
  const m=String(error?.message||error||'');
  const n=String(error?.name||'');
  const s=String(error?.status||'');
  if(/Load failed|Failed to fetch|NetworkError|fetch failed/i.test(m)){
    return 'Ivana could not reach Supabase Auth. The request did not complete. Check Supabase URL Configuration and Auth status, then try again.';
  }
  if(/Invalid login credentials/i.test(m)) return 'We could not sign you in. Check your email and password.';
  if(/Email not confirmed/i.test(m)) return 'Please confirm your email first, then sign in again.';
  if(/already registered|already exists/i.test(m)) return 'An account with this email already exists. Try signing in instead.';
  if(/redirect.*not.*allowed|invalid.*redirect/i.test(m)) return 'Supabase rejected the confirmation redirect. Add this site to Authentication → URL Configuration.';
  if(/rate limit/i.test(m)) return 'Supabase temporarily limited this request. Please wait a moment and try again.';
  return (n||s)?`${m||'Supabase returned an authentication error.'} (${n||'Auth error'}${s?' · '+s:''})`:m||'Something went wrong. Please try again.';
}

function authRedirect(){
  try{return new URL('1index.html',location.href).href}catch(e){return location.href}
}

async function syncProfile(user){
  if(!supabaseClient||!user)return;
  const displayName=String(user.user_metadata?.display_name||'').trim();
  if(!displayName)return;
  try{
    await supabaseClient.from('profiles').upsert(
      {id:user.id,display_name:displayName,updated_at:new Date().toISOString()},
      {onConflict:'id'}
    );
  }catch(e){
    /* The profiles table is optional during first-project setup. Never block Auth. */
    console.warn('Ivana profile sync unavailable; authentication can still work.',e);
  }
}

async function initAuth(){
  if(!supabaseClient){
    if(isLoginPage){const status=document.querySelector('#loginStatus');if(status)status.textContent='Supabase configuration is missing. Check js/supabase-config.js.';}
    return;
  }
  supabaseClient.auth.onAuthStateChange((event,session)=>{
    if(session)syncProfile(session.user);
    if(isLoginPage && event==='SIGNED_IN' && session)location.replace('1index.html');
    if(!isLoginPage && event==='SIGNED_OUT')location.replace('index.html');
  });
  try{
    const {data,error}=await supabaseClient.auth.getSession();
    if(error)console.warn('Ivana Auth session check:',error);
    const session=data?.session;
    if(isLoginPage){if(session)location.replace('1index.html');return;}
    if(!session && !prototypeMode()){location.replace('index.html');return;}
  }catch(e){
    console.error('Ivana Auth session check failed:',e);
    if(!isLoginPage && !prototypeMode())location.replace('index.html');
  }
  document.querySelector('#signOutButton')?.addEventListener('click',async()=>{
    const btn=document.querySelector('#signOutButton');if(btn)btn.disabled=true;
    try{await supabaseClient.auth.signOut();}catch(e){console.warn('Sign out:',e)}
    localStorage.removeItem('ivana_prototype_mode');location.replace('index.html');
  });
}

async function handleLogin(e){
  e.preventDefault();
  const email=document.querySelector('#loginEmail')?.value.trim();
  const password=document.querySelector('#loginPassword')?.value||'';
  const button=document.querySelector('#loginButton');const status=document.querySelector('#loginStatus');
  if(!supabaseClient){if(status)status.textContent='Supabase configuration is missing. Check js/supabase-config.js.';return;}
  if(button){button.disabled=true;button.textContent='Signing in…'}if(status)status.textContent='';
  try{
    const {data,error}=await supabaseClient.auth.signInWithPassword({email,password});
    if(error)throw error;
    if(data?.session){await syncProfile(data.session.user);location.replace('1index.html');return;}
    const check=await supabaseClient.auth.getSession();
    if(check.data?.session){location.replace('1index.html');return;}
    throw new Error('Supabase returned no active session.');
  }catch(error){
    console.error('Ivana sign-in failed:',error);
    if(status)status.textContent=authMessage(error);
    if(button){button.disabled=false;button.textContent='Sign in'}
  }
}

function openAuthModal(mode){
  const modal=document.querySelector('#authModal');if(!modal)return;
  modal.hidden=false;
  const signup=document.querySelector('#signupForm'),reset=document.querySelector('#resetForm');
  const eyebrow=document.querySelector('#authModalEyebrow'),title=document.querySelector('#authModalTitle'),intro=document.querySelector('#authModalIntro');
  if(mode==='reset'){
    signup.hidden=true;reset.hidden=false;eyebrow.textContent='Reset password';title.textContent='Let’s get you back in.';intro.textContent='Enter your email and Supabase will send you a password reset link.';
  }else{
    signup.hidden=false;reset.hidden=true;eyebrow.textContent='Create an account';title.textContent='Begin your study space.';intro.textContent='Create your account and we’ll keep your study space connected to you.';
  }
}
function closeAuthModal(){const modal=document.querySelector('#authModal');if(modal)modal.hidden=true;}

async function handleSignup(e){
  e.preventDefault();
  const displayName=document.querySelector('#signupDisplayName')?.value.trim();
  const email=document.querySelector('#signupEmail')?.value.trim();
  const password=document.querySelector('#signupPassword')?.value||'';
  const confirm=document.querySelector('#signupConfirm')?.value||'';
  const button=document.querySelector('#signupButton'),status=document.querySelector('#signupStatus');
  if(!displayName){status.textContent='Add the study name Ivana should use for you.';return;}
  if(password.length<6){status.textContent='Use a password with at least 6 characters.';return;}
  if(password!==confirm){status.textContent='The passwords do not match.';return;}
  if(!supabaseClient){status.textContent='Supabase configuration is missing. Check js/supabase-config.js.';return;}
  button.disabled=true;button.textContent='Creating account…';status.textContent='Connecting to Supabase…';
  try{
    const {data,error}=await supabaseClient.auth.signUp({
      email,
      password,
      options:{
        data:{display_name:displayName},
        emailRedirectTo:authRedirect()
      }
    });
    if(error)throw error;
    if(data?.user)await syncProfile(data.user);
    if(data?.session){
      localStorage.removeItem('ivana_prototype_mode');
      location.replace('1index.html');
      return;
    }
    status.textContent='Account created. Check your email to confirm your account, then sign in. If no email arrives, check Supabase Auth → Users.';
    button.disabled=false;button.textContent='Create account';
  }catch(error){
    console.error('Ivana account creation failed:',error);
    status.textContent=authMessage(error);
    button.disabled=false;button.textContent='Create account';
  }
}

async function handleReset(e){
  e.preventDefault();
  const email=document.querySelector('#resetEmail')?.value.trim();const button=document.querySelector('#resetButton'),status=document.querySelector('#resetStatus');
  if(!supabaseClient){status.textContent='Supabase configuration is missing. Check js/supabase-config.js.';return;}
  button.disabled=true;button.textContent='Sending…';status.textContent='';
  try{
    const {error}=await supabaseClient.auth.resetPasswordForEmail(email,{redirectTo:authRedirect()});
    if(error)throw error;
    status.textContent='Check your email for the password reset link.';
  }catch(error){console.error('Ivana password reset failed:',error);status.textContent=authMessage(error)}
  button.disabled=false;button.textContent='Send reset link';
}

document.querySelector('#loginForm')?.addEventListener('submit',handleLogin);
document.querySelector('#createAccountLink')?.addEventListener('click',()=>openAuthModal('signup'));
document.querySelector('#forgotPasswordLink')?.addEventListener('click',()=>openAuthModal('reset'));
document.querySelector('#authModalClose')?.addEventListener('click',closeAuthModal);
document.querySelector('#signupForm')?.addEventListener('submit',handleSignup);
document.querySelector('#resetForm')?.addEventListener('submit',handleReset);
document.querySelector('#authModal')?.addEventListener('click',e=>{if(e.target.id==='authModal')closeAuthModal()});
initAuth();

/* V5.2 clickable prototype entry: lets the learner inspect the study workspace while Auth is being configured. */
if(isLoginPage){
  const box=document.querySelector('.box');
  if(box && !document.querySelector('#prototypeLogin')){
    const wrap=document.createElement('div');wrap.className='prototype-entry';
    wrap.innerHTML='<div class="prototype-divider"><span>or</span></div><button type="button" class="text-link prototype-link" id="prototypeLogin">Enter clickable prototype</button><small class="prototype-note">Use this while Supabase account setup is being verified.</small>';
    box.appendChild(wrap);
    document.querySelector('#prototypeLogin')?.addEventListener('click',()=>{localStorage.setItem('ivana_prototype_mode','true');location.replace('1index.html')});
  }
}

/* Course configuration: subjects are curriculum structure, not mock study content. */
let courseConfig=[];
async function loadCourses(){
 try{const r=await fetch('data/courses.json',{cache:'no-store'});const j=await r.json();courseConfig=Array.isArray(j?.courses)?j.courses:[];}catch(e){courseConfig=[];}
 const filter=document.querySelector('#resourceCourseFilter');
 if(filter){filter.innerHTML='<option value="">All courses</option>'+courseConfig.map(c=>`<option value="${escapeHtml(c.code)}">${escapeHtml(c.code)} — ${escapeHtml(c.title)}</option>`).join('');}
 const sel=document.querySelector('#resourceCourse');
 if(sel){sel.innerHTML=courseConfig.map(c=>`<option value="${escapeHtml(c.code)}">${escapeHtml(c.code)} — ${escapeHtml(c.title)}</option>`).join('');}
 renderCourses(); renderResources();
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
let resources=load('resources',[]);
function renderReferenceRegister(){
 const body=$('#referenceTable');if(!body)return;
 if(!resources.length){body.innerHTML='<tr><td colspan="6">No sources added yet.</td></tr>';return}
 body.innerHTML=resources.slice().sort((a,b)=>String(b.addedAt||'').localeCompare(String(a.addedAt||''))).map(r=>`<tr><td>${escapeHtml(sourceTypeName(r.type))}</td><td>${escapeHtml(r.author||'—')}</td><td>${escapeHtml(r.year||'—')}</td><td>${escapeHtml(r.title||'—')}</td><td>${escapeHtml(r.courses?.length?r.courses.map(courseName).join(' · '):'Unassigned')}</td><td>${r.type==='syllabus'?'<span class="map-lens">Course lens only</span>':'<span class="map-eligible">Eligible</span>'}</td></tr>`).join('');
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
 const record={id:Date.now(),title,type,inputMode,fileName:file?.name||'',courses,course:courses[0]||'',size:file?.size||0,mimeType:file?.type||'text/html',blob:file||null,text:pastedText||'',html:pastedHtml||'',author:$('#resourceAuthor')?.value.trim()||'',year:$('#resourceYear')?.value.trim()||'',edition:$('#resourceEdition')?.value.trim()||'',publisher:$('#resourcePublisher')?.value.trim()||'',toc:$('#resourceToc')?.value.trim()||'',inMap:type!=='syllabus',addedAt:new Date().toISOString()};
 try{await putSource(record);resources.push({...record,blob:undefined,html:undefined,text:undefined});save('resources',resources);const modal=$('#addSourceBox');if(modal)modal.style.display='none';resetSourceForm();renderResources();if(status)status.textContent='';}
 catch(e){console.error(e);if(status)status.textContent='Could not save this source in the browser.'}
}
function resetSourceForm(){
 const f=$('#resourceFile');if(f)f.value='';const rich=$('#resourceText');if(rich)rich.innerHTML='';['resourceType','resourceTitleFallback','resourceAuthor','resourceYear','resourceEdition','resourceTitle','resourceTitlePaper','resourcePublisher','resourceTitleOther','resourceTitleSyllabus','resourceInstructor','resourceToc'].forEach(id=>{const el=$('#'+id);if(el)el.value=''});const c=$('#resourceCourse');if(c)Array.from(c.options).forEach(o=>o.selected=false);if($('#hasToc'))$('#hasToc').checked=false;if($('#tocWrap'))$('#tocWrap').hidden=true;updateSourceFields();}
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
  $('#readerDocName').textContent=record.title||record.fileName||'Source';
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
function applyAnnotation(tool){const a=selectionRects();if(!a?.text){$('#readerStatus').textContent='Select text in the PDF first, then choose an annotation tool.';return;}const store=load('annotations',[]);store.push({resourceId:activeSourceRecord?.id,page:pdfPageNumber,type:tool,text:a.text,rects:a.rects,note:tool==='note'?prompt('Add a note for this selection:',''):''});save('annotations',store);window.getSelection()?.removeAllRanges();restoreAnnotations();$('#readerStatus').textContent=tool==='note'?'Note saved to this selection.':(tool==='underline'?'Underline added.':'Highlight added.');}
function restoreAnnotations(){const layer=$('#annotationLayer');if(!layer)return;layer.innerHTML='';const anns=load('annotations',[]).filter(a=>Number(a.resourceId)===Number(activeSourceRecord?.id)&&Number(a.page)===pdfPageNumber);const colors={yellow:'#f5df6d',blue:'#8fb7db',green:'#9fb99b',orange:'#e6a267',red:'#c77d76',purple:'#a58ac0'};anns.forEach(a=>a.rects.forEach(r=>{const el=document.createElement('div');el.className='annotation-mark '+(a.type==='underline'?'annotation-underline':'');el.style.left=r.x+'px';el.style.top=r.y+'px';el.style.width=r.w+'px';el.style.height=r.h+'px';if(a.type!=='underline')el.style.background=colors[a.type]||colors.yellow;el.title=a.note||a.text;layer.appendChild(el)}));}
document.querySelectorAll('[data-annotation-tool]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-annotation-tool]').forEach(x=>x.classList.remove('active'));btn.classList.add('active');activeAnnotationTool=btn.dataset.annotationTool;applyAnnotation(activeAnnotationTool)}));
$('#prevPage')?.addEventListener('click',async()=>{if(pdfDoc&&pdfPageNumber>1){pdfPageNumber--;await renderPdfPage()}});$('#nextPage')?.addEventListener('click',async()=>{if(pdfDoc&&pdfPageNumber<pdfDoc.numPages){pdfPageNumber++;await renderPdfPage()}});
$('#zoomIn')?.addEventListener('click',async()=>{if(pdfDoc){pdfScale=Math.min(2.5,pdfScale+.1);await renderPdfPage()}});$('#zoomOut')?.addEventListener('click',async()=>{if(pdfDoc){pdfScale=Math.max(.5,pdfScale-.1);await renderPdfPage()}});$('#fitWidth')?.addEventListener('click',async()=>{if(pdfDoc){const p=await pdfDoc.getPage(pdfPageNumber);const v=p.getViewport({scale:1});const available=Math.max(320,($('#readerViewport')?.clientWidth||900)-38);pdfScale=available/v.width;await renderPdfPage()}});
$('#readerViewport')?.addEventListener('mouseup',()=>{if(activeAnnotationTool&&activeAnnotationTool!=='none'){const a=selectionRects();if(a?.text)$('#readerStatus').textContent='Selection ready. Choose an annotation tool to apply it.'}});
openStudyResource();

/* Study timer — persistent across pages */
const timerDefaults={sec:1800,mode:'Focus',running:false,endAt:null,sessionStart:null,initialSec:1800};
let timerState=load('timerState',timerDefaults);if(!timerState||typeof timerState!=='object')timerState={...timerDefaults};
let sec=Number(timerState.sec??1800),mode=timerState.mode||'Focus',running=Boolean(timerState.running),interval=null,sessionStart=timerState.sessionStart||null,initialSec=Number(timerState.initialSec??1800),lastActivity=Date.now(),idleTriggered=false;
if(running&&timerState.endAt)sec=Math.max(0,Math.ceil((timerState.endAt-Date.now())/1000));
function persistTimer(){save('timerState',{sec,mode,running,endAt:running?Date.now()+sec*1000:null,sessionStart,initialSec})}
function renderTimer(){const d=$('#timerDisplay');if(!d)return;d.textContent=String(Math.max(0,Math.floor(sec/60))).padStart(2,'0')+':'+String(Math.max(0,sec%60)).padStart(2,'0');if($('#timerLabel'))$('#timerLabel').textContent=mode.toUpperCase();if($('#timerStatus'))$('#timerStatus').textContent=running?'Studying…':'Ready when you are.'}
function logTimerSession(status='Completed'){if(!sessionStart)return;const now=Date.now();const elapsed=Math.max(0,Math.round((now-sessionStart)/60000));if(elapsed<1&&status==='Stopped')return;const sessions=load('timerSessions',[]);const start=new Date(sessionStart),end=new Date(now);sessions.push({start:start.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),end:end.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),focus:Math.max(1,elapsed),break:mode==='Break'?10:0,status});save('timerSessions',sessions);save('sessions',sessions.length);save('focusMinutes',sessions.reduce((a,s)=>a+Number(s.focus||0),0));sessionStart=null}
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
const notes=$('#personalNotes');if(notes){notes.value=load('personalNotes','');$('#saveNotes')?.addEventListener('click',()=>{save('personalNotes',notes.value);if($('#saveStatus'))$('#saveStatus').textContent='Saved locally.'})}

if($('#sessions')){$('#sessions').textContent=load('sessions',0);$('#focusMinutes').textContent=load('focusMinutes',0)+' min';$('#correct').textContent=load('correct',0);const rows=load('timerSessions',[]),body=$('#sessionTable');if(rows.length&&body)body.innerHTML=rows.slice().reverse().map((s,i)=>`<tr><td>${rows.length-i}</td><td>${s.start}</td><td>${s.end}</td><td>${s.focus} min</td><td>${s.break} min</td><td>${s.status}</td></tr>`).join('')}


function updateKnowledgeMapState(){const canvas=$('#knowledgeCanvas');if(!canvas)return;const eligible=resources.filter(r=>r.type!=='syllabus');if(!eligible.length){canvas.classList.add('empty-map');canvas.innerHTML='<div class="map-empty-message"><div class="empty-icon">✦</div><h2>Your map is empty.</h2><p>Syllabi define the course lens, but they do not become knowledge-map concepts by themselves. Add a book, paper, or other knowledge-bearing reference to begin.</p></div>';return;}canvas.classList.add('empty-map');canvas.innerHTML='<div class="map-empty-message"><div class="empty-icon">✦</div><h2>Reference material is ready.</h2><p>'+eligible.length+' knowledge-bearing source'+(eligible.length===1?'':'s')+' can contribute evidence to the map. Concepts and relationships will appear after Ivana processes the material.</p></div>';}
$('#mapReset')?.addEventListener('click',()=>{if($('#mapBreadcrumb'))$('#mapBreadcrumb').textContent='Whole knowledge landscape';if($('#inspectorTitle'))$('#inspectorTitle').textContent='Nothing to explore yet';if($('#inspectorText'))$('#inspectorText').textContent='Concepts and relationships will appear here after Ivana has evidence from your study materials.'});
loadCourses();
updateKnowledgeMapState();
})();
