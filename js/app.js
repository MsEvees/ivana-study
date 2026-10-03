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
window.ivana.version='V5.3';
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

function openAuthModal(mode='reset'){
  const modal=document.querySelector('#authModal');if(!modal)return;
  modal.hidden=false;
  const reset=document.querySelector('#resetForm');
  const eyebrow=document.querySelector('#authModalEyebrow'),title=document.querySelector('#authModalTitle'),intro=document.querySelector('#authModalIntro');
  if(reset)reset.hidden=false;
  if(eyebrow)eyebrow.textContent='Password reset';
  if(title)title.textContent='Let’s get you back in.';
  if(intro)intro.textContent='Accounts are provisioned by the administrator. Enter your email and Supabase will send a password reset link if the account exists.';
}
function closeAuthModal(){const modal=document.querySelector('#authModal');if(modal)modal.hidden=true;}

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
document.querySelector('#forgotPasswordLink')?.addEventListener('click',()=>openAuthModal('reset'));
document.querySelector('#authModalClose')?.addEventListener('click',closeAuthModal);
document.querySelector('#resetForm')?.addEventListener('submit',handleReset);
document.querySelector('#authModal')?.addEventListener('click',e=>{if(e.target.id==='authModal')closeAuthModal()});
initAuth();

/* V5.4 login refinement: prototype access is not linked from the public login surface. The entry remains hidden inside Forgot Password. */
if(isLoginPage){
  document.querySelector('#prototypeSecret')?.addEventListener('click',()=>{
    localStorage.setItem('ivana_prototype_mode','true');
  });
}

/* V5.3 Library — Supabase-backed cross-device source library. */
let courseConfig=[];
let resources=[];
const STORAGE_BUCKET='library';
let libraryLoaded=false;

async function loadCourses(){
 try{const r=await fetch('data/courses.json',{cache:'no-store'});const j=await r.json();courseConfig=Array.isArray(j?.courses)?j.courses:[];}catch(e){courseConfig=[];console.warn('Course configuration could not be loaded.',e)}
 const filter=document.querySelector('#resourceCourseFilter');
 if(filter){filter.innerHTML='<option value="">All courses</option>'+courseConfig.map(c=>`<option value="${escapeHtml(c.code)}">${escapeHtml(c.code)} — ${escapeHtml(c.title)}</option>`).join('');}
 const sy=document.querySelector('#resourceSyllabusCourse');
 if(sy){sy.innerHTML='<option value="">Choose course</option>'+courseConfig.map(c=>`<option value="${escapeHtml(c.code)}">${escapeHtml(c.code)} — ${escapeHtml(c.title)}</option>`).join('');}
 const year=document.querySelector('#resourceSchoolYear');
 if(year){const years=[];for(let y=2014;y<=2035;y++)years.push(`<option value="${y}-${y+1}">${y}–${y+1}</option>`);year.innerHTML='<option value="">Choose school year</option>'+years.join('');}
 renderCoursePicker();
 renderCourses();
 await loadRemoteResources();
 renderHome();
 updateKnowledgeMapState();
}

function shortDate(value){if(!value)return '—';try{return new Date(value).toLocaleDateString([], {month:'short',day:'numeric'})}catch(e){return '—'}}
function formatDuration(min){const n=Number(min||0);if(n<60)return `${n} min`;return `${Math.floor(n/60)}h ${n%60}m`}
function renderHome(){
 const sourceRefs=resources.filter(r=>r.type!=='syllabus');
 const allCodes=courseConfig.map(c=>c.code);
 const hortCodes=allCodes.filter(c=>/^HORT|^CROP SCI/.test(c));
 const ensCodes=allCodes.filter(c=>/^ENS/.test(c));
 const covered=new Set(sourceRefs.flatMap(r=>r.courses||[]));
 const hort=Math.round((hortCodes.filter(c=>covered.has(c)).length/Math.max(1,hortCodes.length))*100);
 const ens=Math.round((ensCodes.filter(c=>covered.has(c)).length/Math.max(1,ensCodes.length))*100);
 if($('#homeMapSourceCount'))$('#homeMapSourceCount').textContent=sourceRefs.length;
 if($('#homeMapSummary'))$('#homeMapSummary').innerHTML=sourceRefs.length?`You have uploaded <strong>${sourceRefs.length}</strong> knowledge-map reference${sourceRefs.length===1?'':'s'} so far. These books, papers, and other knowledge-bearing sources can contribute evidence to your map.`:'No knowledge-map references yet. Add books or papers to begin building the evidence base.';
 if($('#homeHortCoverage'))$('#homeHortCoverage').textContent=hort+'%'; if($('#homeEnsCoverage'))$('#homeEnsCoverage').textContent=ens+'%';
 if($('#homeHortBar'))$('#homeHortBar').style.width=hort+'%'; if($('#homeEnsBar'))$('#homeEnsBar').style.width=ens+'%';
 const latest=[...resources].sort((a,b)=>String(b.addedAt||'').localeCompare(String(a.addedAt||''))).slice(0,5);
 const list=$('#homeLatestResources');
 if(list)list.innerHTML=latest.length?latest.map(r=>`<div class="home-list-row"><div><strong>${escapeHtml(r.title||r.fileName||'Untitled source')}</strong><span>${escapeHtml(sourceTypeName(r.type))}${r.courses?.length?' · '+escapeHtml(r.courses.join(', ')):''}</span></div><time>${shortDate(r.addedAt)}</time></div>`).join(''):'<div class="home-empty">No materials uploaded yet.</div>';
 const sessions=load('timerSessions',[]); const last=sessions.length?sessions[sessions.length-1]:null; const ss=$('#homeSessionState');
 if(ss)ss.innerHTML=last?`<strong>${escapeHtml(last.end||last.start||'Recent')}</strong><span>Last study time<br><b>${formatDuration(last.focus)}</b></span>`:'<strong>—</strong><span>No study session recorded yet.</span>';
 const mastery=$('#homeMasteryLevels');
 if(mastery){const tests=Number(load('correct',0));mastery.innerHTML=[['Recognition','Level 1'],['Retrieval','Level 2'],['Synthesis','Level 3']].map(x=>`<div class="mastery-row"><div class="mastery-level">${x[1]} · ${x[0]}</div><div class="mastery-pill"><span class="mastery-dot"></span><strong>${tests?'Developing':'Not tested yet'}</strong></div></div>`).join('');}
}

function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function courseName(code){const c=courseConfig.find(x=>x.code===code);return c?`${c.code} — ${c.title}`:(code||'Unassigned');}
function courseGroup(code){return /^HORT|^CROP SCI/.test(code)?'course-hortcrsc':/^ENS/.test(code)?'course-ens':''}
function renderCourses(){
 const list=document.querySelector('#courseList');if(!list)return;
 list.innerHTML=courseConfig.map(c=>{
   const syllabus=resources.find(r=>r.type==='syllabus'&&(r.course===c.code||r.courses?.includes(c.code)));
   const status=syllabus?`<div class="course-status"><span class="course-syllabus-badge">Syllabus added</span></div>`:`<div class="course-status">No syllabus yet</div>`;
   return `<div class="course-item ${courseGroup(c.code)}"><div><div class="course-code">${escapeHtml(c.code)}</div><div class="course-title">${escapeHtml(c.title)}</div>${syllabus?`<div class="course-syllabus-mini">${escapeHtml(syllabus.schoolYear||'')} ${syllabus.semester?'· '+escapeHtml(syllabus.semester):''}</div>`:''}</div>${status}</div>`;
 }).join('');
 renderClassroomSyllabi();
}
function renderClassroomSyllabi(){
 const box=document.querySelector('#classroomSyllabusList');if(!box)return;
 const syllabi=resources.filter(r=>r.type==='syllabus');
 if(!syllabi.length){box.innerHTML='<div class="classroom-empty">Add a syllabus in Library to anchor a classroom and use it as your course coverage lens.</div>';return;}
 box.innerHTML=syllabi.map(r=>{
   const course=r.course||r.courses?.[0]||'';
   return `<div class="classroom-syllabus"><div class="classroom-syllabus-meta"><div class="classroom-syllabus-title">${escapeHtml(courseName(course))}</div><div class="classroom-syllabus-details">${escapeHtml(r.institution||'')} ${r.schoolYear?'· '+escapeHtml(r.schoolYear):''} ${r.semester?'· '+escapeHtml(r.semester):''} ${r.instructor?'· '+escapeHtml(r.instructor):''}</div><div class="classroom-syllabus-note">Course lens only · open the syllabus to check topics and objectives while studying.</div></div><button class="btn outline small" data-open-syllabus="${escapeHtml(r.id)}">Open syllabus</button></div>`;
 }).join('');
 box.querySelectorAll('[data-open-syllabus]').forEach(b=>b.addEventListener('click',()=>{localStorage.setItem('ivana_currentResource',String(b.dataset.openSyllabus));location.href='3study.html'}));
}
function renderCoursePicker(){
 const picker=document.querySelector('#resourceCoursePicker');if(!picker)return;
 picker.innerHTML=courseConfig.map(c=>`<label class="course-choice ${courseGroup(c.code)}"><input type="checkbox" value="${escapeHtml(c.code)}"><span><strong>${escapeHtml(c.code)}</strong><span>${escapeHtml(c.title)}</span></span></label>`).join('');
}
function selectedCourses(){return Array.from(document.querySelectorAll('#resourceCoursePicker input[type="checkbox"]:checked')).map(x=>x.value).filter(Boolean)}
function setSelectedCourses(codes=[]){const set=new Set(codes);document.querySelectorAll('#resourceCoursePicker input[type="checkbox"]').forEach(x=>x.checked=set.has(x.value));}
function sourceTypeName(t){return ({syllabus:'Syllabus',book:'Book / book chapter',research_paper:'Research paper',other:'Other academic source'})[t]||'Source'}
function isAuthenticated(){return Boolean(supabaseClient?.auth?.getSession)}
function currentUserId(){return supabaseClient?.auth?.getUser ? null : null}

async function getCurrentSession(){
 if(!supabaseClient)return null;
 try{const {data,error}=await supabaseClient.auth.getSession();if(error)throw error;return data?.session||null}catch(e){console.warn('Ivana could not read the current session.',e);return null}
}

function normalizeResource(row){
 return {id:row.id,title:row.title||row.file_name||'Untitled source',type:row.source_type||row.type||'other',inputMode:row.input_mode||'file',fileName:row.file_name||'',storagePath:row.storage_path||'',mimeType:row.mime_type||'',size:Number(row.size_bytes||0),courses:Array.isArray(row.courses)?row.courses:(row.course_code?[row.course_code]:[]),course:row.course_code||'',author:row.author||'',year:row.year||'',edition:row.edition||'',publisher:row.publisher||'',institution:row.institution||'',schoolYear:row.school_year||'',semester:row.semester||'',instructor:row.instructor||'',toc:row.toc||'',text:row.content_text||'',html:row.content_html||'',inMap:row.in_map!==false,addedAt:row.created_at||row.added_at||''};
}
async function loadRemoteResources(){
 const list=document.querySelector('#libraryList');
 if(!supabaseClient){libraryLoaded=true;resources=[];renderResources();return;}
 const session=await getCurrentSession();
 if(!session){libraryLoaded=true;resources=[];renderResources();return;}
 try{
   const {data,error}=await supabaseClient.from('resources').select('*').order('created_at',{ascending:false});
   if(error)throw error;
   resources=(data||[]).map(normalizeResource);libraryLoaded=true;renderResources();
 }catch(e){
   console.error('Ivana Library load failed:',e);resources=[];libraryLoaded=true;
   if(list)list.innerHTML='<div class="library-message error"><h2>Library could not be loaded.</h2><p>'+escapeHtml(e.message||'Check that the V5.3 Library migration has been applied to Supabase.')+'</p><small>Your files are not deleted; Ivana simply could not read the Library database.</small></div>';
   renderReferenceRegister();
 }
}
function renderReferenceRegister(){
 const body=$('#referenceTable');if(!body)return;
 if(!resources.length){body.innerHTML='<tr><td colspan="6">No sources added yet.</td></tr>';return}
 body.innerHTML=resources.map(r=>`<tr><td>${escapeHtml(sourceTypeName(r.type))}</td><td>${escapeHtml(r.author||r.institution||'—')}</td><td>${escapeHtml(r.year||r.schoolYear||'—')}</td><td>${escapeHtml(r.title||'—')}</td><td>${escapeHtml(r.courses?.length?r.courses.map(courseName).join(' · '):'Unassigned')}</td><td>${r.type==='syllabus'?'<span class="map-lens">Course lens only</span>':'<span class="map-eligible">Eligible</span>'}</td></tr>`).join('');
}
function renderResources(){
 const list=document.querySelector('#libraryList');if(!list)return;
 const filter=document.querySelector('#resourceCourseFilter')?.value||'';
 const q=(document.querySelector('#resourceSearch')?.value||'').toLowerCase().trim();
 const shown=resources.filter(r=>(!filter||r.courses?.includes(filter)||r.course===filter)&&(!q||`${r.title} ${r.fileName||''} ${r.type||''} ${(r.courses||[]).join(' ')} ${r.author||''} ${r.institution||''} ${r.year||''} ${r.schoolYear||''}`.toLowerCase().includes(q)));
 if(!shown.length){list.innerHTML='<div class="empty-icon">＋</div><h2>Your library is empty.</h2><p>Add a source to begin building your private study library.</p>';renderReferenceRegister();return}
 list.innerHTML='<div class="resource-list">'+shown.map(r=>`<div class="resource-item"><div class="resource-meta"><div class="resource-title">${escapeHtml(r.title)}</div><div class="resource-file">${escapeHtml(sourceTypeName(r.type))}${r.fileName?' · '+escapeHtml(r.fileName):' · Stored in Ivana'}</div><div class="resource-course">${escapeHtml((r.courses?.length?r.courses.map(courseName).join(' · '):courseName(r.course)))}</div><div class="resource-biblio">${escapeHtml(r.author||r.institution||'')}${r.year?' · '+escapeHtml(r.year):''}${r.schoolYear?' · '+escapeHtml(r.schoolYear):''}${r.semester?' · '+escapeHtml(r.semester):''}${r.edition?' · '+escapeHtml(r.edition):''}${r.publisher?' · '+escapeHtml(r.publisher):''}</div><div class="resource-map-status">${r.type==='syllabus'?'Course lens only · not a knowledge-map source':'Knowledge-map eligible reference'}${r.fileName?' · Cloud stored':''}</div></div><div class="resource-actions"><button class="btn outline small" data-open-resource="${escapeHtml(r.id)}">Open</button><button class="btn outline small" data-delete-resource="${escapeHtml(r.id)}">Remove</button></div></div>`).join('')+'</div>';
 list.querySelectorAll('[data-open-resource]').forEach(b=>b.addEventListener('click',()=>{localStorage.setItem('ivana_currentResource',String(b.dataset.openResource));location.href='3study.html'}));
 list.querySelectorAll('[data-delete-resource]').forEach(b=>b.addEventListener('click',async()=>{await deleteRemoteResource(String(b.dataset.deleteResource));}));
 renderReferenceRegister();
 renderCourses();
 renderHome();
}
function currentSourceTitle(){
 const type=$('#resourceType')?.value||'';
 if(type==='book')return $('#resourceTitle')?.value.trim()||'';
 if(type==='research_paper')return $('#resourceTitlePaper')?.value.trim()||'';
 if(type==='syllabus'){const c=$('#resourceSyllabusCourse')?.value||'';return c?courseName(c):''}
 if(type==='other')return $('#resourceTitleOther')?.value.trim()||'';
 return '';
}
function updateSourceFields(){
 const type=$('#resourceType')?.value||'';
 const map={book:'bookFields',research_paper:'paperFields',other:'otherFields',syllabus:'syllabusFields'};
 ['bookFields','paperFields','otherFields','syllabusFields'].forEach(id=>{const el=document.getElementById(id);if(el)el.hidden=(id!==map[type]);});
 const bio=$('#bibliographicFields');if(bio)bio.hidden=!type;
 const relevance=$('#courseRelevanceBlock');const label=$('#courseRelevanceLabel');
 if(type==='syllabus'){if(relevance)relevance.style.display='none';}else{if(relevance)relevance.style.display='block';if(label)label.textContent='Course relevance';}
 if(type==='syllabus'){
   const sy=$('#resourceSyllabusCourse');if(sy?.value)setSelectedCourses([sy.value]);
 }
}
function validateSourceFields(type,inputMode,file,pastedText){
 if(!type)return 'Choose a source type first.';
 if(type==='syllabus'){
   if(!$('#resourceInstitution')?.value.trim())return 'Add the institution or school.';
   if(!$('#resourceSchoolYear')?.value)return 'Choose the school year.';
   if(!$('#resourceSemester')?.value)return 'Choose the semester.';
   if(!$('#resourceSyllabusCourse')?.value)return 'Choose the course.';
   if(!$('#resourceInstructor')?.value.trim())return 'Add the instructor or coordinator.';
 }else if(type==='book'){
   if(!$('#resourceAuthor')?.value.trim())return 'Add the author or authors.';
   if(!$('#resourceYear')?.value.trim())return 'Add the publication year.';
   if(!$('#resourceTitle')?.value.trim())return 'Add the book or chapter title.';
   if(!selectedCourses().length)return 'Select at least one course relevance.';
 }else if(type==='research_paper'){
   if(!$('#resourceAuthorPaper')?.value.trim())return 'Add the author or authors.';
   if(!$('#resourceYearPaper')?.value.trim())return 'Add the publication year.';
   if(!$('#resourceTitlePaper')?.value.trim())return 'Add the paper title.';
   if(!selectedCourses().length)return 'Select at least one course relevance.';
 }else if(type==='other'&&!$('#resourceTitleOther')?.value.trim())return 'Add a title for this source.';
 if(inputMode==='file'&&!file)return 'Choose a file first.';
 if(inputMode==='text'&&!pastedText)return 'Paste or type the source text first.';
 if(file && file.size>100*1024*1024)return 'This prototype accepts files up to 100 MB.';
 return '';
}
function safeFileName(name){return String(name||'file').replace(/[^a-zA-Z0-9._-]+/g,'_').slice(-180)}
async function addResource(){
 const type=$('#resourceType')?.value||'';const inputMode=$('#inputMode')?.value||'file';const file=$('#resourceFile')?.files?.[0];const rich=$('#resourceText');const pastedHtml=inputMode==='text'?(rich?.innerHTML||'').trim():'';const pastedText=inputMode==='text'?(rich?.innerText||'').trim():'';const status=$('#sourceFormStatus');
 const validation=validateSourceFields(type,inputMode,file,pastedText);if(validation){if(status)status.textContent=validation;return}
 const session=await getCurrentSession();if(!session){if(status)status.textContent='Please sign in before adding a source.';return}
 const id=(crypto?.randomUUID?crypto.randomUUID():`r_${Date.now()}_${Math.random().toString(36).slice(2)}`);
 const syllabusCourse=$('#resourceSyllabusCourse')?.value||'';const courses=type==='syllabus'?[syllabusCourse]:selectedCourses();
 const title=currentSourceTitle()||file?.name||(pastedText?'Copied text':'Untitled source');
 const record={id,title,type,inputMode,fileName:file?.name||'',courses,course:courses[0]||'',size:file?.size||0,mimeType:file?.type||'text/html',author:type==='research_paper'?$('#resourceAuthorPaper')?.value.trim():$('#resourceAuthor')?.value.trim()||'',year:type==='research_paper'?$('#resourceYearPaper')?.value.trim():$('#resourceYear')?.value.trim()||'',edition:$('#resourceEdition')?.value.trim()||'',publisher:$('#resourcePublisher')?.value.trim()||'',institution:$('#resourceInstitution')?.value.trim()||'',schoolYear:$('#resourceSchoolYear')?.value||'',semester:$('#resourceSemester')?.value||'',instructor:$('#resourceInstructor')?.value.trim()||'',toc:$('#resourceToc')?.value.trim()||'',inMap:type!=='syllabus',text:pastedText,html:pastedHtml,storagePath:''};
 let uploaded=false;
 try{
   if(status)status.textContent=file?'Uploading source to your Ivana Library…':'Saving source to your Ivana Library…';
   if(file){record.storagePath=`${session.user.id}/${id}/${safeFileName(file.name)}`;const {error:upError}=await supabaseClient.storage.from(STORAGE_BUCKET).upload(record.storagePath,file,{contentType:file.type||'application/octet-stream',upsert:false});if(upError)throw upError;uploaded=true;}
   const payload={id:record.id,owner_id:session.user.id,source_type:record.type,input_mode:record.inputMode,title:record.title,file_name:record.fileName,storage_path:record.storagePath||null,mime_type:record.mimeType,size_bytes:record.size,author:record.author||null,year:record.year||null,edition:record.edition||null,publisher:record.publisher||null,institution:record.institution||null,school_year:record.schoolYear||null,semester:record.semester||null,course_code:record.course||null,courses:record.courses, instructor:record.instructor||null,toc:record.toc||null,content_text:record.text||null,content_html:record.html||null,in_map:record.inMap};
   const {data,error}=await supabaseClient.from('resources').insert(payload).select('*').single();if(error)throw error;
   resources.unshift(normalizeResource(data));renderResources();const modal=$('#addSourceBox');if(modal)modal.style.display='none';resetSourceForm();if(status)status.textContent='';
 }catch(e){
   console.error('Ivana source upload failed:',e);
   if(uploaded&&record.storagePath){try{await supabaseClient.storage.from(STORAGE_BUCKET).remove([record.storagePath])}catch(cleanup){console.warn('Storage cleanup failed',cleanup)}}
   if(status)status.textContent=`Could not add this source: ${e.message||'The upload did not complete.'}`;
 }
}
async function deleteRemoteResource(id){
 const resource=resources.find(r=>String(r.id)===String(id));if(!resource)return;
 if(!confirm(`Remove “${resource.title}” from your Ivana Library?`))return;
 try{
   if(resource.storagePath)await supabaseClient.storage.from(STORAGE_BUCKET).remove([resource.storagePath]);
   const {error}=await supabaseClient.from('resources').delete().eq('id',resource.id);if(error)throw error;
   resources=resources.filter(r=>String(r.id)!==String(id));renderResources();
 }catch(e){alert(`Could not remove this source. ${e.message||''}`)}
}
async function resetSourceForm(){
 const f=$('#resourceFile');if(f)f.value='';const rich=$('#resourceText');if(rich)rich.innerHTML='';['resourceType','resourceAuthor','resourceAuthorPaper','resourceYear','resourceYearPaper','resourceEdition','resourceTitle','resourceTitlePaper','resourcePublisher','resourceTitleOther','resourceInstitution','resourceInstructor','resourceSchoolYear','resourceSemester','resourceSyllabusCourse','resourceToc'].forEach(id=>{const el=$('#'+id);if(el)el.value=''});setSelectedCourses([]);if($('#hasToc'))$('#hasToc').checked=false;if($('#tocWrap'))$('#tocWrap').hidden=true;updateSourceFields();
}
$('#addSourceButton')?.addEventListener('click',()=>{$('#addSourceBox').style.display='flex';updateSourceFields()});
$('#closeAddSource')?.addEventListener('click',()=>{$('#addSourceBox').style.display='none'});
$('#addSourceBox')?.addEventListener('click',e=>{if(e.target.id==='addSourceBox')e.currentTarget.style.display='none'});
$('#resourceType')?.addEventListener('change',updateSourceFields);
$('#resourceSyllabusCourse')?.addEventListener('change',()=>{if($('#resourceType')?.value==='syllabus')setSelectedCourses([$('#resourceSyllabusCourse').value])});
$('#inputMode')?.addEventListener('change',e=>{const text=e.target.value==='text';if($('#fileInputWrap'))$('#fileInputWrap').style.display=text?'none':'';if($('#textInputWrap'))$('#textInputWrap').style.display=text?'':'none';});
$('#hasToc')?.addEventListener('change',e=>{if($('#tocWrap'))$('#tocWrap').hidden=!e.target.checked});
$('#addResource')?.addEventListener('click',addResource);
$('#resourceSearch')?.addEventListener('input',renderResources);$('#resourceCourseFilter')?.addEventListener('change',renderResources);

/* Study resource loading and PDF.js reader. */
let activeSourceRecord=null, pdfDoc=null, pdfPageNumber=1, pdfScale=1, activeAnnotationTool='yellow';
async function openStudyResource(){
 const reader=document.querySelector('#readerEmpty');if(!reader)return;
 const wrap=$('#pdfPageWrap'), metaId=String(localStorage.getItem('ivana_currentResource')||'');if(!metaId)return;
 try{
   const session=await getCurrentSession();if(!session){reader.innerHTML='<span>Please sign in to open this source.</span>';return}
   const {data,error}=await supabaseClient.from('resources').select('*').eq('id',metaId).single();if(error)throw error;
   activeSourceRecord=normalizeResource(data);$('#readerDocName').textContent=activeSourceRecord.title||activeSourceRecord.fileName||'Source';
   if(activeSourceRecord.text||activeSourceRecord.html){reader.hidden=true;wrap.hidden=false;$('#pdfPage').innerHTML='<div class="source-text-view">'+(activeSourceRecord.html||escapeHtml(activeSourceRecord.text||''))+'</div>';$('#pageCount').textContent='1';$('#pageNum').textContent='1';return;}
   if(activeSourceRecord.storagePath){
     if(activeSourceRecord.mimeType.includes('pdf')||activeSourceRecord.fileName.toLowerCase().endsWith('.pdf')){
       if(!window.pdfjsLib){reader.innerHTML='<span>PDF reader is unavailable.</span>';return}
       const {data:file,error:fileError}=await supabaseClient.storage.from(STORAGE_BUCKET).download(activeSourceRecord.storagePath);if(fileError)throw fileError;
       pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
       const bytes=await file.arrayBuffer();pdfDoc=await pdfjsLib.getDocument({data:bytes}).promise;pdfPageNumber=1;pdfScale=1;$('#pageCount').textContent=pdfDoc.numPages;reader.hidden=true;wrap.hidden=false;await renderPdfPage();return;
     }
     const {data:urlData,error:urlError}=await supabaseClient.storage.from(STORAGE_BUCKET).createSignedUrl(activeSourceRecord.storagePath,600);if(urlError)throw urlError;
     reader.innerHTML='<span>This file is stored in your private Ivana Library.</span><a class="btn primary" href="'+urlData.signedUrl+'" target="_blank" rel="noopener">Open file</a><small>DOC/DOCX content extraction will be handled by the Supabase ingestion layer.</small>';return;
   }
   reader.innerHTML='<span>This source has no stored file.</span>';
 }catch(e){console.error('Ivana source open failed:',e);reader.hidden=false;reader.innerHTML='<span>Could not open this source.</span><small>'+escapeHtml(e.message||'Unknown reader error')+'</small>'}
}
async function renderPdfPage(){
 if(!pdfDoc)return;const page=await pdfDoc.getPage(pdfPageNumber);const base=page.getViewport({scale:1});const viewport=page.getViewport({scale:pdfScale});const canvas=$('#pdfCanvas'),ctx=canvas.getContext('2d');canvas.width=viewport.width;canvas.height=viewport.height;$('#pdfPage').style.width=viewport.width+'px';$('#pdfPage').style.height=viewport.height+'px';await page.render({canvasContext:ctx,viewport}).promise;
 const textLayer=$('#textLayer');textLayer.innerHTML='';textLayer.style.width=viewport.width+'px';textLayer.style.height=viewport.height+'px';const content=await page.getTextContent();
 pdfjsLib.renderTextLayer({textContentSource:content,container:textLayer,viewport,textDivs:[]});
 $('#pageNum').textContent=pdfPageNumber;$('#zoomLabel').textContent=Math.round(pdfScale*100)+'%';restoreAnnotations();
}
function selectionRects(){const sel=window.getSelection();if(!sel||sel.isCollapsed||!$('#pdfPage')?.contains(sel.anchorNode))return null;const rects=Array.from(sel.getRangeAt(0).getClientRects());const pageRect=$('#pdfPage').getBoundingClientRect();return {text:sel.toString().trim(),rects:rects.map(r=>({x:(r.left-pageRect.left)/pdfScale,y:(r.top-pageRect.top)/pdfScale,w:r.width/pdfScale,h:r.height/pdfScale})).filter(r=>r.w>1&&r.h>1)};}
function applyAnnotation(tool){const a=selectionRects();if(!a?.text){$('#readerStatus').textContent='Select text in the PDF first, then choose an annotation tool.';return;}const store=load('annotations',[]);store.push({resourceId:activeSourceRecord?.id,page:pdfPageNumber,type:tool,text:a.text,rects:a.rects,note:tool==='note'?prompt('Add a note for this selection:',''):''});save('annotations',store);window.getSelection()?.removeAllRanges();restoreAnnotations();$('#readerStatus').textContent=tool==='note'?'Note saved to this selection.':(tool==='underline'?'Underline added.':'Highlight added.');}
function restoreAnnotations(){const layer=$('#annotationLayer');if(!layer)return;layer.innerHTML='';const anns=load('annotations',[]).filter(a=>Number(a.resourceId)===Number(activeSourceRecord?.id)&&Number(a.page)===pdfPageNumber);const colors={yellow:'#e5cf61',blue:'#7ea8c8',green:'#86a989',red:'#c4776d'};anns.forEach(a=>a.rects.forEach(r=>{const el=document.createElement('div');el.className='annotation-mark annotation-'+a.type+' '+(a.type==='underline'?'annotation-underline':'');el.style.left=r.x+'px';el.style.top=r.y+'px';el.style.width=r.w+'px';el.style.height=r.h+'px';if(a.type!=='underline')el.style.background=colors[a.type]||colors.yellow;el.title=a.note||a.text;layer.appendChild(el)}));}
document.querySelectorAll('[data-annotation-tool]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-annotation-tool]').forEach(x=>x.classList.remove('active'));btn.classList.add('active');activeAnnotationTool=btn.dataset.annotationTool;applyAnnotation(activeAnnotationTool)}));
$('#prevPage')?.addEventListener('click',async()=>{if(pdfDoc&&pdfPageNumber>1){pdfPageNumber--;await renderPdfPage()}});$('#nextPage')?.addEventListener('click',async()=>{if(pdfDoc&&pdfPageNumber<pdfDoc.numPages){pdfPageNumber++;await renderPdfPage()}});
$('#zoomIn')?.addEventListener('click',async()=>{if(pdfDoc){pdfScale=Math.min(2.5,pdfScale+.1);await renderPdfPage()}});$('#zoomOut')?.addEventListener('click',async()=>{if(pdfDoc){pdfScale=Math.max(.5,pdfScale-.1);await renderPdfPage()}});$('#fitWidth')?.addEventListener('click',async()=>{if(pdfDoc){const p=await pdfDoc.getPage(pdfPageNumber);const v=p.getViewport({scale:1});const available=Math.max(320,($('#readerViewport')?.clientWidth||900)-38);pdfScale=available/v.width;await renderPdfPage()}});
$('#readerViewport')?.addEventListener('mouseup',()=>{if(activeAnnotationTool&&activeAnnotationTool!=='none'){const a=selectionRects();if(a?.text)$('#readerStatus').textContent='Selection ready. Choose an annotation tool to apply it.'}});
openStudyResource();


/* Remember + Guide is deliberately study-page only. */
const guide=document.querySelector('#rememberGuide');
const guideClose=document.querySelector('#rememberGuideClose');
if(guideClose)guideClose.addEventListener('click',()=>{guide.hidden=true;save('rememberGuideClosed',true)});
if(guide && load('rememberGuideClosed',false)!==true)guide.hidden=false;

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

function renderProgressSessions(){
 if(!$('#sessions'))return;
 const rows=load('timerSessions',[]);$('#sessions').textContent=rows.length;$('#focusMinutes').textContent=rows.reduce((a,s)=>a+Number(s.focus||0),0)+' min';$('#correct').textContent=load('correct',0);
 const body=$('#sessionTable');if(!body)return;
 if(!rows.length){body.innerHTML='<tr><td colspan="7">No completed sessions yet.</td></tr>';return}
 body.innerHTML=rows.slice().reverse().map((s,i)=>`<tr><td>${rows.length-i}</td><td>${escapeHtml(s.start)}</td><td>${escapeHtml(s.end)}</td><td>${Number(s.focus||0)} min</td><td>${Number(s.break||0)} min</td><td>${escapeHtml(s.status||'Completed')}</td><td><button class="table-delete" type="button" data-delete-session="${i}">Delete</button></td></tr>`).join('');
 body.querySelectorAll('[data-delete-session]').forEach(btn=>btn.addEventListener('click',()=>{const visibleIndex=Number(btn.dataset.deleteSession);const originalIndex=rows.length-1-visibleIndex;if(!confirm('Delete this study session from Progress?'))return;rows.splice(originalIndex,1);save('timerSessions',rows);save('sessions',rows.length);save('focusMinutes',rows.reduce((a,s)=>a+Number(s.focus||0),0));renderProgressSessions();}));
}
renderProgressSessions()


function updateKnowledgeMapState(){const canvas=$('#knowledgeCanvas');if(!canvas)return;const eligible=resources.filter(r=>r.type!=='syllabus');if(!eligible.length){canvas.classList.add('empty-map');canvas.innerHTML='<div class="map-empty-message"><div class="empty-icon">✦</div><h2>Your map is empty.</h2><p>Syllabi define the course lens, but they do not become knowledge-map concepts by themselves. Add a book, paper, or other knowledge-bearing reference to begin.</p></div>';return;}canvas.classList.add('empty-map');canvas.innerHTML='<div class="map-empty-message"><div class="empty-icon">✦</div><h2>Reference material is ready.</h2><p>'+eligible.length+' knowledge-bearing source'+(eligible.length===1?'':'s')+' can contribute evidence to the map. Concepts and relationships will appear after Ivana processes the material.</p></div>';}
$('#mapReset')?.addEventListener('click',()=>{if($('#mapBreadcrumb'))$('#mapBreadcrumb').textContent='Whole knowledge landscape';if($('#inspectorTitle'))$('#inspectorTitle').textContent='Nothing to explore yet';if($('#inspectorText'))$('#inspectorText').textContent='Concepts and relationships will appear here after Ivana has evidence from your study materials.'});
loadCourses();
updateKnowledgeMapState();
})();
