// Smart Grievance Redressal System v6 - Role-Based
const BASE_URL = "http://localhost:8080";
let allLoaded = [], sortByPriority = false, editingId = null;
const PRIO_ORDER = { HIGH:1, MEDIUM:2, LOW:3 };
const CAT_ICON   = { WATER:'💧', ELECTRICITY:'⚡', ROADS:'🛣️', SANITATION:'🗑️', GENERAL:'📋' };
const PRIO_ICON  = { HIGH:'🔴', MEDIUM:'🟡', LOW:'🟢' };

// ---------- NAVIGATION ----------
function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const sec = document.getElementById(id);
    if (sec) sec.classList.add('active');
    const btn = document.querySelector(`.nav-btn[data-section="${id}"]`);
    if (btn) btn.classList.add('active');
    if (id === 'home')    refreshHome();
    if (id === 'view')    { loadRoleComplaints(); showOfficerBar(); }
    if (id === 'profile') loadProfile();
    if (id === 'complaint') {
        const w = document.getElementById('complainLoginWarning');
        if (w) w.classList.toggle('hidden', !!localStorage.getItem('userId'));
    }
}

// ---------- AUTH UI ----------
function applyAuthUI(role) {
    const loggedIn = !!role;
    const isC = role === 'CITIZEN', isO = role === 'OFFICER', isA = role === 'ADMIN';
    q('.guest-only',   el => el.classList.toggle('hidden', loggedIn));
    q('.auth-only',    el => el.classList.toggle('hidden', !loggedIn));
    q('.citizen-only', el => el.classList.toggle('hidden', !isC));
    q('.officer-only', el => el.classList.toggle('hidden', !isO));
    q('.admin-only',   el => el.classList.toggle('hidden', !isA));
    document.getElementById('userArea').classList.toggle('hidden', !loggedIn);
}
function q(sel, fn) { document.querySelectorAll(sel).forEach(fn); }

function updateUserBadge(name, role, dept) {
    const icons = { CITIZEN:'👤', OFFICER:'🏛️', ADMIN:'🔐' };
    set('userInfoIcon',  icons[role] || '👤');
    set('loggedInName',  name);
    const pill = document.getElementById('rolePill');
    pill.textContent = role;
    pill.className   = 'role-pill ' + role.toLowerCase();
    const dp = document.getElementById('deptPill');
    if (dept && role === 'OFFICER') { dp.textContent = dept; dp.classList.remove('hidden'); }
    else dp.classList.add('hidden');
    const pa = document.getElementById('profileAvatar');
    if (pa) pa.textContent = icons[role] || '👤';
    applyAuthUI(role);
}
function set(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

// ---------- HOME DASHBOARD ----------
function refreshHome() {
    const role = localStorage.getItem('userRole');
    const hide = id => { const e = document.getElementById(id); if (e) e.classList.add('hidden'); };
    const show = id => { const e = document.getElementById(id); if (e) e.classList.remove('hidden'); };
    ['guestHero','citizenDash','officerDash','adminDash'].forEach(hide);
    if (!role)             show('guestHero');
    else if (role==='CITIZEN') { show('citizenDash'); loadCitizenHome(); }
    else if (role==='OFFICER') { show('officerDash'); loadOfficerHome(); }
    else if (role==='ADMIN')   { show('adminDash');   loadAdminHome(); }
}

async function loadCitizenHome() {
    const uid = localStorage.getItem('userId'), name = localStorage.getItem('userName');
    set('citizenWelcome', `Welcome, ${name} 👋`);
    try {
        const list = await getJSON(`${BASE_URL}/complaints/user/${uid}`);
        set('cStatTotal',    list.length);
        set('cStatPending',  list.filter(c=>c.status==='PENDING').length);
        set('cStatProgress', list.filter(c=>c.status==='IN_PROGRESS').length);
        set('cStatResolved', list.filter(c=>c.status==='RESOLVED').length);
        const recent = list.slice(-3).reverse();
        const box = document.getElementById('citizenRecentList');
        if (box) box.innerHTML = recent.length ? recent.map(miniCard).join('') : emptyHTML('No complaints yet.');
    } catch { ['cStatTotal','cStatPending','cStatProgress','cStatResolved'].forEach(id=>set(id,'—')); }
}

async function loadOfficerHome() {
    const dept = localStorage.getItem('userDept'), name = localStorage.getItem('userName');
    set('officerWelcome',  `Welcome, ${name} 👋`);
    set('officerDeptLabel', `Department: ${dept || '—'}`);
    if (!dept) return;
    try {
        const s = await getJSON(`${BASE_URL}/complaints/stats/department/${dept}`);
        set('oStatTotal', s.total); set('oStatPending', s.pending);
        set('oStatProgress', s.inProgress); set('oStatResolved', s.resolved);
    } catch {}
}

async function loadAdminHome() {
    const name = localStorage.getItem('userName');
    set('adminWelcome', `Admin: ${name}`);
    try {
        const s = await getJSON(`${BASE_URL}/complaints/stats`);
        set('aStatTotal', s.total); set('aStatPending', s.pending);
        set('aStatProgress', s.inProgress); set('aStatResolved', s.resolved);
    } catch {}
}

function miniCard(c) {
    const overdue = isOverdue(c) ? '<span class="overdue-badge">OVERDUE</span>' : '';
    return `<div class="complaint-card" style="margin-bottom:0.5rem">
        <div class="card-id">Complaint #${c.id}</div>
        <div class="card-top">
          <span class="card-title">📌 ${escHtml(c.title)}</span>
          <div class="card-badges">
            <span class="status-badge status-${c.status}">${c.status.replace('_',' ')}</span>
            ${c.priority ? `<span class="priority-badge priority-${c.priority}">${PRIO_ICON[c.priority]} ${c.priority}</span>` : ''}
            ${overdue}
          </div>
        </div>
    </div>`;
}

// ---------- REGISTER ----------
function toggleDeptField() {
    const role = document.getElementById('regRole').value;
    document.getElementById('regDeptGroup').classList.toggle('hidden', role !== 'OFFICER');
}

async function registerUser(ev) {
    ev.preventDefault();
    const name=val('regName'), email=val('regEmail'), pw=val('regPassword');
    const role=val('regRole'), dept=val('regDept');
    const msg=document.getElementById('registerMsg');
    let ok=true;
    if (!name)                { fErr('regNameErr','Enter full name.'); ok=false; } else cErr('regNameErr');
    if (!email||!email.includes('@')) { fErr('regEmailErr','Enter valid email.'); ok=false; } else cErr('regEmailErr');
    if (!pw||pw.length<6)    { fErr('regPasswordErr','Min 6 characters.'); ok=false; } else cErr('regPasswordErr');
    if (!ok) return;
    const btn=document.getElementById('registerBtn'); btn.disabled=true; btn.textContent='Creating...';
    try {
        const r = await postJSON(`${BASE_URL}/register`, {name,email,password:pw,role,department:role==='OFFICER'?dept:null});
        if (r.ok) { showMsg(msg,`✅ Registered! ID: ${r.data.userId}`,'success'); showToast('Registered! Please login 🎉'); document.getElementById('registerForm').reset(); }
        else showMsg(msg, `❌ ${r.data.message||'Failed.'}`, 'error');
    } catch { showMsg(msg,'❌ Backend not reachable.','error'); }
    btn.disabled=false; btn.textContent='Create Account →';
}

// ---------- LOGIN ----------
async function loginUser(ev) {
    ev.preventDefault();
    const email=val('loginEmail'), pw=val('loginPassword');
    const msg=document.getElementById('loginMsg');
    let ok=true;
    if (!email||!email.includes('@')) { fErr('loginEmailErr','Valid email required.'); ok=false; } else cErr('loginEmailErr');
    if (!pw) { fErr('loginPasswordErr','Password required.'); ok=false; } else cErr('loginPasswordErr');
    if (!ok) return;
    const btn=document.getElementById('loginBtn'); btn.disabled=true; btn.textContent='Signing in...';
    try {
        const r = await postJSON(`${BASE_URL}/login`, {email, password:pw});
        if (r.ok) {
            const d=r.data;
            localStorage.setItem('userId', d.userId);
            localStorage.setItem('userName', d.name);
            localStorage.setItem('userRole', d.role);
            localStorage.setItem('userDept', d.department||'');
            localStorage.setItem('userEmail', email);
            updateUserBadge(d.name, d.role, d.department);
            showToast(`✅ Welcome, ${d.name}!`);
            document.getElementById('loginForm').reset();
            setTimeout(()=>showSection('home'), 300);
        } else showMsg(msg, `❌ ${r.data.message}`, 'error');
    } catch { showMsg(msg,'❌ Backend not reachable.','error'); }
    btn.disabled=false; btn.textContent='Sign In →';
}

// ---------- LOGOUT ----------
function logout() {
    ['userId','userName','userRole','userDept','userEmail'].forEach(k=>localStorage.removeItem(k));
    applyAuthUI(null);
    showToast('Logged out.');
    showSection('home');
}

// ---------- FILE COMPLAINT ----------
async function fileComplaint(ev) {
    ev.preventDefault();
    const uid=localStorage.getItem('userId'), name=localStorage.getItem('userName');
    const msg=document.getElementById('complaintMsg');
    if (!uid) { showMsg(msg,'❌ Please login first.','error'); return; }
    const title=val('compTitle'), desc=val('compDesc');
    const category=val('compCategory'), priority=val('compPriority');
    let ok=true;
    if (!title)  { fErr('compTitleErr','Title required.'); ok=false; } else cErr('compTitleErr');
    if (!desc)   { fErr('compDescErr','Description required.'); ok=false; } else cErr('compDescErr');
    if (!ok) return;
    const btn=document.getElementById('complaintBtn'); btn.disabled=true; btn.textContent='Submitting...';
    try {
        const r = await postJSON(`${BASE_URL}/complaints`, {title,description:desc,priority,category,userId:parseInt(uid),performedBy:name});
        if (r.ok) {
            showMsg(msg,`✅ Filed! #${r.data.id} → ${r.data.department} dept. Due: ${r.data.dueDate||'N/A'}`,'success');
            showToast('Complaint submitted 📩');
            document.getElementById('complaintForm').reset();
        } else showMsg(msg,'❌ Failed to submit.','error');
    } catch { showMsg(msg,'❌ Backend not reachable.','error'); }
    btn.disabled=false; btn.textContent='Submit Complaint →';
}

// ---------- LOAD COMPLAINTS (role-aware) ----------
async function loadRoleComplaints() {
    const role=localStorage.getItem('userRole'), dept=localStorage.getItem('userDept');
    const uid=localStorage.getItem('userId');
    const container=document.getElementById('complaintsContainer');
    const sub=document.getElementById('viewSubtitle');
    container.innerHTML=loadingHTML(); resetFilters();
    try {
        let list=[];
        if (role==='OFFICER') {
            if (dept) {
                list = await getJSON(`${BASE_URL}/complaints/department/${dept}`);
                if(sub) sub.textContent=`${dept} Department complaints`;
                if(document.getElementById('viewTitle')) document.getElementById('viewTitle').textContent=`🏛️ ${dept} Complaints`;
            } else {
                container.innerHTML=emptyHTML('⚠️ Your officer account has no department assigned. Please contact admin or re-register.');
                return;
            }
        } else if (role==='ADMIN') {
            list = await getJSON(`${BASE_URL}/complaints`);
            if(sub) sub.textContent='All complaints (system-wide)';
        } else {
            if(!uid){container.innerHTML=emptyHTML('🔑 Please login.');return;}
            list = await getJSON(`${BASE_URL}/complaints/user/${uid}`);
            if(sub) sub.textContent='Your complaints';
        }
        allLoaded = list;
        applyFilters();
    } catch { container.innerHTML=emptyHTML('⚠️ Could not load. Is backend running?'); }
}

function showOfficerBar() {
    const role=localStorage.getItem('userRole'), dept=localStorage.getItem('userDept');
    const bar=document.getElementById('officerBar');
    if (!bar) return;
    if (role==='OFFICER' || role==='ADMIN') {
        bar.classList.remove('hidden');
        set('officerBarText',`${role==='ADMIN'?'Admin':'Officer'} Portal ${dept?'— '+dept+' Department':''}. You can update, edit, delete and assign.`);
    } else bar.classList.add('hidden');
}

// ---------- FILTERS + SORT ----------
function applyFilters() {
    const kw=(document.getElementById('searchInput')||{}).value?.trim().toLowerCase()||'';
    const sf=(document.getElementById('statusFilter')||{}).value||'';
    const pf=(document.getElementById('priorityFilter')||{}).value||'';
    const clrBtn=document.getElementById('searchClearBtn');
    if (clrBtn) clrBtn.classList.toggle('hidden', !kw);
    let result = allLoaded.filter(c=>
        (!kw || c.title.toLowerCase().includes(kw)) &&
        (!sf || c.status===sf) &&
        (!pf || c.priority===pf)
    );
    if (sortByPriority) result.sort((a,b)=>(PRIO_ORDER[a.priority]||9)-(PRIO_ORDER[b.priority]||9));
    const rc=document.getElementById('resultCount');
    if (rc) {
        if (kw||sf||pf) { rc.textContent=`Showing ${result.length} of ${allLoaded.length}`; rc.classList.remove('hidden'); }
        else rc.classList.add('hidden');
    }
    const cont=document.getElementById('complaintsContainer');
    if (result.length===0) { cont.innerHTML=emptyHTML('No complaints match your filters.'); return; }
    renderComplaints(result, cont);
}

function clearSearch() { const i=document.getElementById('searchInput'); if(i)i.value=''; applyFilters(); }
function resetFilters() {
    ['searchInput','statusFilter','priorityFilter'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
    const rc=document.getElementById('resultCount'); if(rc) rc.classList.add('hidden');
}
function toggleSortByPriority() {
    sortByPriority=!sortByPriority;
    const btn=document.getElementById('sortPriorityBtn');
    if(btn){btn.classList.toggle('active',sortByPriority); btn.textContent=sortByPriority?'⬇️ Sort: Priority':'⬆️ Sort: Priority';}
    applyFilters();
}

// ---------- RENDER CARDS ----------
function renderComplaints(list, container) {
    container.innerHTML='';
    const role=localStorage.getItem('userRole');
    const isPrivileged = role==='OFFICER' || role==='ADMIN';

    list.forEach(c=>{
        const date=c.createdAt?new Date(c.createdAt).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'N/A';
        const over=isOverdue(c);
        const overBadge=over?'<span class="overdue-badge">⚠️ OVERDUE</span>':'';
        const catBadge=c.category?`<span class="cat-badge">${CAT_ICON[c.category]||''} ${c.category}</span>`:'';
        const prioBadge=c.priority?`<span class="priority-badge priority-${c.priority}">${PRIO_ICON[c.priority]} ${c.priority}</span>`:'';
        const assignedTag=c.assignedTo?`<span class="assigned-tag">👤 Assigned: ${escHtml(c.assignedTo)}</span>`:'';
        const dueTag=c.dueDate?`📅 Due: ${c.dueDate}`:'';

        let controls='<span class="citizen-note">🔒 Status managed by officers</span>';
        if (isPrivileged) {
            controls=`<div class="officer-controls">
              <div class="update-status-wrap">
                <select id="ss-${c.id}">
                  <option value="PENDING" ${c.status==='PENDING'?'selected':''}>⏳ PENDING</option>
                  <option value="IN_PROGRESS" ${c.status==='IN_PROGRESS'?'selected':''}>🔄 IN PROGRESS</option>
                  <option value="RESOLVED" ${c.status==='RESOLVED'?'selected':''}>✅ RESOLVED</option>
                </select>
                <button class="btn btn-officer btn-sm" onclick="updateStatus(${c.id})">Update</button>
              </div>
              <button class="btn btn-edit btn-sm" onclick="openEditModal(${c.id},'${escAttr(c.title)}','${escAttr(c.description)}','${c.priority||'MEDIUM'}')">✏️ Edit</button>
              <button class="btn btn-delete btn-sm" onclick="deleteComplaint(${c.id})">🗑️</button>
              <button class="btn btn-secondary btn-sm" onclick="assignComplaint(${c.id})">👤 Assign</button>
              <button class="btn btn-outline btn-sm" onclick="viewHistory(${c.id})">📜 History</button>
            </div>`;
        }

        const card=document.createElement('div');
        card.className='complaint-card'+(over?' overdue':'');
        card.id=`card-${c.id}`;
        card.innerHTML=`
            <div class="card-id">Complaint #${c.id}</div>
            <div class="card-top">
              <span class="card-title">📌 ${escHtml(c.title)}</span>
              <div class="card-badges">
                <span class="status-badge status-${c.status}">${c.status.replace('_',' ')}</span>
                ${prioBadge}${catBadge}${overBadge}
              </div>
            </div>
            <p class="card-desc">${escHtml(c.description)}</p>
            <div class="card-footer">
              <div class="meta-info">
                <span>👤 #${c.userId}</span><span>📅 ${date}</span>
                ${dueTag?`<span>${dueTag}</span>`:''}
                ${assignedTag}
              </div>
              ${controls}
            </div>`;
        container.appendChild(card);
    });
}

// ---------- OFFICER ACTIONS ----------
async function updateStatus(id) {
    const sel=document.getElementById(`ss-${id}`);
    const status=sel.value, name=localStorage.getItem('userName');
    const msgs={'PENDING':'Moved to PENDING.','IN_PROGRESS':'Now IN PROGRESS — being reviewed.','RESOLVED':'Resolved successfully! ✅'};
    try {
        const r=await putJSON(`${BASE_URL}/complaints/${id}/status`,{status,performedBy:name});
        if(r.ok){
            showToast(`✅ ${msgs[status]||'Updated.'}`);
            const c=allLoaded.find(x=>x.id===id); if(c) c.status=status;
            applyFilters();
        } else showToast(`❌ ${r.data.message}`,'error');
    } catch { showToast('❌ Update failed.','error'); }
}

function openEditModal(id,title,desc,priority) {
    editingId=id;
    document.getElementById('editTitle').value=title;
    document.getElementById('editDesc').value=desc;
    document.getElementById('editPriority').value=priority||'MEDIUM';
    document.getElementById('editModal').classList.remove('hidden');
}
function closeEditModal() { editingId=null; document.getElementById('editModal').classList.add('hidden'); }

async function saveEdit() {
    if(!editingId) return;
    const title=val('editTitle'), description=val('editDesc'), priority=val('editPriority');
    const name=localStorage.getItem('userName');
    if(!title||!description){showToast('❌ Fields cannot be empty.','error');return;}
    const btn=document.getElementById('saveEditBtn'); btn.disabled=true; btn.textContent='Saving...';
    try {
        const r=await putJSON(`${BASE_URL}/complaints/${editingId}`,{title,description,priority,performedBy:name});
        if(r.ok){
            showToast('✅ Complaint updated!');
            const c=allLoaded.find(x=>x.id===editingId);
            if(c){c.title=title;c.description=description;c.priority=priority;}
            closeEditModal(); applyFilters();
        } else showToast(`❌ ${r.data.message||'Failed.'}`, 'error');
    } catch { showToast('❌ Connection error.','error'); }
    btn.disabled=false; btn.textContent='Save Changes';
}

async function deleteComplaint(id) {
    if(!confirm(`Delete Complaint #${id}? This cannot be undone.`)) return;
    try {
        const resp=await fetch(`${BASE_URL}/complaints/${id}`,{method:'DELETE'});
        if(resp.ok){
            showToast(`🗑️ Complaint #${id} deleted.`,'info');
            allLoaded=allLoaded.filter(c=>c.id!==id);
            applyFilters();
        } else showToast('❌ Delete failed.','error');
    } catch { showToast('❌ Connection error.','error'); }
}

async function assignComplaint(id) {
    const name=prompt('Enter officer name to assign this complaint to:');
    if(!name||!name.trim()) return;
    const by=localStorage.getItem('userName');
    try {
        const r=await putJSON(`${BASE_URL}/complaints/${id}/assign`,{assignedTo:name.trim(),performedBy:by});
        if(r.ok){
            showToast(`✅ Assigned to ${name.trim()}`);
            const c=allLoaded.find(x=>x.id===id); if(c) c.assignedTo=name.trim();
            applyFilters();
        } else showToast('❌ Assign failed.','error');
    } catch { showToast('❌ Connection error.','error'); }
}

async function viewHistory(id) {
    document.getElementById('historyModal').classList.remove('hidden');
    document.getElementById('historyTimeline').innerHTML='<p style="color:var(--gray-500)">Loading...</p>';
    try {
        const list=await getJSON(`${BASE_URL}/complaints/${id}/history`);
        if(!list.length){document.getElementById('historyTimeline').innerHTML='<p style="color:var(--gray-500)">No history yet.</p>';return;}
        document.getElementById('historyTimeline').innerHTML=list.map(h=>`
            <div class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-action">${escHtml(h.action)}</div>
                <div class="timeline-meta">By ${escHtml(h.performedBy)} · ${h.timestamp?new Date(h.timestamp).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):''}</div>
              </div>
            </div>`).join('');
    } catch { document.getElementById('historyTimeline').innerHTML='<p style="color:var(--gray-500)">Could not load history.</p>'; }
}
function closeHistoryModal() { document.getElementById('historyModal').classList.add('hidden'); }

// ---------- PROFILE ----------
async function loadProfile() {
    const uid=localStorage.getItem('userId'), name=localStorage.getItem('userName');
    const role=localStorage.getItem('userRole'), dept=localStorage.getItem('userDept');
    set('profileName',name||'—'); set('profileId',uid||'—');
    set('profileRole',role||'—'); set('profileDept',dept||'N/A');
    const rp=document.getElementById('profileRolePill');
    if(rp){rp.textContent=role||'—';rp.className='role-pill '+(role||'').toLowerCase();}
    const dRow=document.getElementById('profileDeptRow');
    if(dRow) dRow.classList.toggle('hidden', role!=='OFFICER');
    if(!uid) return;
    try {
        const d=await getJSON(`${BASE_URL}/users/${uid}`);
        set('profileName',d.name); set('profileEmail',d.email);
        set('profileId',d.id); set('profileRole',d.role); set('profileDept',d.department||'N/A');
    } catch { set('profileEmail',localStorage.getItem('userEmail')||'—'); }
}

// ---------- HELPERS ----------
function isOverdue(c) { return c.dueDate && new Date(c.dueDate)<new Date() && c.status!=='RESOLVED'; }
function val(id) { const e=document.getElementById(id); return e?e.value.trim():''; }
function fErr(id,msg) { const e=document.getElementById(id); if(e) e.textContent=msg; }
function cErr(id) { const e=document.getElementById(id); if(e) e.textContent=''; }
function showMsg(el,msg,type) { el.innerHTML=msg; el.className=`msg-box msg-${type}`; el.classList.remove('hidden'); }
function showToast(msg,type='success') {
    const t=document.getElementById('toast');
    t.textContent=msg; t.className=`toast toast-${type}`; t.classList.remove('hidden');
    clearTimeout(t._t); t._t=setTimeout(()=>t.classList.add('hidden'),3500);
}
function escHtml(s) { const d=document.createElement('div'); d.textContent=s||''; return d.innerHTML; }
function escAttr(s) { return (s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;').replace(/\n/g,' '); }
function loadingHTML() { return '<div class="loading-state"><span style="font-size:2rem">⏳</span><p>Loading...</p></div>'; }
function emptyHTML(m) { return `<div class="empty-state"><span class="empty-icon">📭</span><p>${m}</p></div>`; }

async function getJSON(url) { const r=await fetch(url); if(!r.ok) throw new Error('Request failed'); return r.json(); }
async function postJSON(url,body) { const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); const data=await r.json(); return {ok:r.ok,data}; }
async function putJSON(url,body)  { const r=await fetch(url,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); const data=await r.json(); return {ok:r.ok,data}; }

// ---------- INIT ----------
(function init(){
    const name=localStorage.getItem('userName'), role=localStorage.getItem('userRole'), dept=localStorage.getItem('userDept');
    if(name&&role) updateUserBadge(name,role,dept); else applyAuthUI(null);
    showSection('home');
})();
