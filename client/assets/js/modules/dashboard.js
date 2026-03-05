// ================================================
// NERVE — Dashboard Module (API-Connected)
// ================================================

function _fmt(n) { return n >= 1000 ? n.toLocaleString('es-MX') : n; }
function _initials(name) { return name.replace('Dr. ', '').replace('Dra. ', '').split(' ').map(w => w[0]).slice(0, 2).join(''); }

/* -------- Org Owner Dashboard -------- */
async function renderOrgDash() {
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted)">⏳ Cargando dashboard...</div>`;

  let users = [], patients = [], appointments = [];
  try {
    const [uRes, pRes, aRes] = await Promise.all([
      API.getUsers(),
      API.getPatients(),
      API.getAppointments(),
    ]);
    users = uRes.data || [];
    patients = pRes.data || [];
    appointments = aRes.data || [];
  } catch (err) { /* fallback to empty */ }

  const user = API.getUser();
  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const doctors = users.filter(u => u.role === 'doctor');
  const confApts = appointments.filter(a => a.status === 'programada').length;

  pc.innerHTML = `
  <div class="page-header">
    <div>
      <div class="page-title">🏥 ${user?.name || 'Hospital'} — Resumen</div>
      <div class="page-subtitle">${today.charAt(0).toUpperCase() + today.slice(1)}</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="navigate('reports')">📈 Ver reportes</button>
      <button class="btn btn-primary" onclick="navigate('staff')">+ Agregar personal</button>
    </div>
  </div>

  <div class="stats-grid stats-grid-4" style="margin-bottom:24px">
    ${[
      { icon: '🩺', label: 'Médicos activos', val: _fmt(doctors.length), chg: `${users.length} total personal`, color: 'rgba(17,113,139,0.2)' },
      { icon: '👤', label: 'Pacientes totales', val: _fmt(patients.length), chg: `Registrados en el sistema`, color: 'rgba(6,207,215,0.1)' },
      { icon: '📅', label: 'Citas registradas', val: _fmt(appointments.length), chg: `${confApts} programadas`, color: 'rgba(73,190,174,0.1)' },
      { icon: '✅', label: 'Personal activo', val: `${users.filter(u => u.active).length}/${users.length}`, chg: 'Cuentas activas', color: 'rgba(34,197,94,0.1)' },
    ].map(s => `<div class="stat-card">
      <div class="stat-icon" style="background:${s.color}">${s.icon}</div>
      <div class="stat-value">${s.val}</div>
      <div class="stat-label">${s.label}</div>
      <div class="stat-change up">${s.chg}</div>
    </div>`).join('')}
  </div>

  <div class="content-grid content-grid-2-1">
    <div>
      <div class="card" style="margin-bottom:20px">
        <div class="card-header"><span class="card-title">👩‍⚕️ Equipo médico</span><button class="btn btn-secondary btn-sm" onclick="navigate('staff')">Ver todos</button></div>
        <div class="table-wrap">
          ${doctors.length > 0 ? `<table>
            <thead><tr><th>Médico</th><th>Especialidad</th><th>Pacientes</th><th>Estado</th></tr></thead>
            <tbody>
              ${doctors.slice(0, 8).map(dr => `<tr>
                <td><div class="avatar-row"><div class="avatar">${_initials(dr.name)}</div><div class="cell-primary">${dr.name}</div></div></td>
                <td class="text-muted">${dr.specialty || '—'}</td>
                <td>${dr._count?.patients || 0}</td>
                <td><span class="badge ${dr.active ? 'badge-success' : 'badge-warning'}">${dr.active ? 'Activo' : 'Inactivo'}</span></td>
              </tr>`).join('')}
            </tbody>
          </table>` : '<div class="empty-state" style="padding:30px"><div class="empty-state-icon">🩺</div><div class="empty-state-desc">Sin médicos registrados</div></div>'}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">📅 Próximas citas</span><button class="btn btn-secondary btn-sm" onclick="navigate('appointments')">Ver agenda</button></div>
        ${appointments.length > 0 ? `<div style="display:flex;flex-direction:column;gap:8px">
          ${appointments.filter(a => a.status === 'programada').slice(0, 5).map(a => `
            <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--dark-4);border-radius:8px;border-left:3px solid var(--cyan-mid)">
              <div style="font-size:0.78rem;font-weight:700;color:var(--cyan);width:46px">${a.time}</div>
              <div style="flex:1">
                <div style="font-size:0.87rem;font-weight:600">${a.patient?.name || '—'}</div>
                <div style="font-size:0.74rem;color:var(--text-muted)">${a.type || 'consulta'} · ${new Date(a.date).toLocaleDateString('es-MX')}</div>
              </div>
              <span class="badge badge-success">${a.status}</span>
            </div>`).join('')}
        </div>` : '<div class="empty-state" style="padding:30px"><div class="empty-state-icon">📅</div><div class="empty-state-desc">Sin citas</div></div>'}
      </div>
    </div>
    <div>
      <div class="card" style="margin-bottom:20px">
        <div class="card-header"><span class="card-title">📊 Estado de citas</span></div>
        <div id="dashDonut"></div>
        <div style="margin-top:16px">
          ${[
      { l: 'Programadas', v: confApts, c: 'var(--success)' },
      { l: 'Completadas', v: appointments.filter(a => a.status === 'completada').length, c: 'var(--cyan-mid)' },
      { l: 'Canceladas', v: appointments.filter(a => a.status === 'cancelada').length, c: 'var(--danger)' },
    ].map(s => `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:0.82rem;display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:${s.c};display:inline-block"></span>${s.l}</span>
            <strong>${s.v}</strong>
          </div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">👤 Últimos pacientes</span></div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${patients.slice(0, 5).map(p => `
            <div style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;cursor:pointer" onclick="navigate('patients')">
              <div class="avatar">${p.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</div>
              <div style="flex:1">
                <div style="font-size:0.85rem;font-weight:600">${p.name}</div>
                <div style="font-size:0.74rem;color:var(--text-muted)">${(p.diagnosis || 'Sin diagnóstico').substring(0, 38)}</div>
              </div>
              <span class="badge ${p.status === 'Activo' ? 'badge-success' : 'badge-mint'}">${p.status}</span>
            </div>`).join('')}
          ${patients.length === 0 ? '<p style="color:var(--text-dim);font-size:0.85rem;text-align:center;padding:20px">Sin pacientes</p>' : ''}
          ${patients.length > 0 ? `<button class="btn btn-secondary" style="width:100%;justify-content:center;margin-top:4px" onclick="navigate('patients')">Ver ${patients.length} pacientes →</button>` : ''}
        </div>
      </div>
    </div>
  </div>`;

  setTimeout(() => {
    renderDonutChart('dashDonut', [
      { label: 'Programadas', value: Math.max(confApts, 0), color: 'var(--success)' },
      { label: 'Completadas', value: Math.max(appointments.filter(a => a.status === 'completada').length, 0), color: 'var(--cyan-mid)' },
      { label: 'Canceladas', value: Math.max(appointments.filter(a => a.status === 'cancelada').length, 0), color: 'var(--text-dim)' },
    ]);
  }, 100);
}

/* -------- Doctor Dashboard -------- */
async function renderDoctorDash() {
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted)">⏳ Cargando dashboard...</div>`;

  let patients = [], appointments = [], prescriptions = [];
  try {
    const [pRes, aRes, rxRes] = await Promise.all([
      API.getPatients(),
      API.getAppointments(),
      API.getPrescriptions(),
    ]);
    patients = pRes.data || [];
    appointments = aRes.data || [];
    prescriptions = rxRes.data || [];
  } catch (err) { /* fallback */ }

  const user = API.getUser();
  const displayName = user?.name || 'Doctor';
  const confirmCount = appointments.filter(a => a.status === 'programada').length;

  pc.innerHTML = `
  <div class="page-header">
    <div>
      <div class="page-title">Buenos días, ${displayName.replace('Dr. ', '').replace('Dra. ', '')} 👋</div>
      <div class="page-subtitle">${new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${appointments.length} citas registradas</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="navigate('appointments')">📅 Ver agenda</button>
      <button class="btn btn-primary" onclick="openNewPatientModal()">+ Nuevo paciente</button>
    </div>
  </div>

  <div class="stats-grid stats-grid-4" style="margin-bottom:24px">
    ${[
      { icon: '📅', label: 'Citas registradas', val: appointments.length, chg: `${confirmCount} programadas`, color: 'rgba(17,113,139,0.2)' },
      { icon: '👤', label: 'Mis pacientes', val: patients.length, chg: 'Total registrados', color: 'rgba(6,207,215,0.1)' },
      { icon: '💊', label: 'Recetas generadas', val: prescriptions.length, chg: 'Total histórico', color: 'rgba(73,190,174,0.1)' },
      { icon: '✅', label: 'Completadas', val: appointments.filter(a => a.status === 'completada').length, chg: 'Citas finalizadas', color: 'rgba(34,197,94,0.1)' },
    ].map(s => `<div class="stat-card">
      <div class="stat-icon" style="background:${s.color}">${s.icon}</div>
      <div class="stat-value">${s.val}</div>
      <div class="stat-label">${s.label}</div>
      <div class="stat-change up">↑ ${s.chg}</div>
    </div>`).join('')}
  </div>

  <div class="content-grid content-grid-2-1">
    <div>
      <div class="card" style="margin-bottom:20px">
        <div class="card-header"><span class="card-title">📅 Próximas citas</span><button class="btn btn-secondary btn-sm" onclick="navigate('appointments')">Ver agenda completa</button></div>
        ${appointments.filter(a => a.status === 'programada').length > 0 ? `<div style="display:flex;flex-direction:column;gap:8px">
          ${appointments.filter(a => a.status === 'programada').slice(0, 7).map(a => `
            <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--dark-4);border-radius:8px;border-left:3px solid var(--cyan-mid)">
              <div style="font-size:0.78rem;font-weight:700;color:var(--cyan);width:46px">${a.time}</div>
              <div style="flex:1">
                <div style="font-size:0.87rem;font-weight:600">${a.patient?.name || '—'}</div>
                <div style="font-size:0.74rem;color:var(--text-muted)">${a.type || ''} · ${new Date(a.date).toLocaleDateString('es-MX')}</div>
              </div>
              <span class="badge badge-success">${a.status}</span>
              <button class="btn btn-primary btn-sm" onclick="navigate('patients')">Consultar</button>
            </div>`).join('')}
        </div>` : '<div class="empty-state" style="padding:30px"><div class="empty-state-icon">📅</div><div class="empty-state-desc">Sin citas programadas. ¡Tu agenda está libre!</div></div>'}
      </div>
    </div>
    <div>
      <div class="card" style="margin-bottom:20px">
        <div class="card-header"><span class="card-title">🫀 Mis pacientes</span></div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${patients.slice(0, 4).map(p => `
            <div style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;cursor:pointer" onclick="navigate('patients')">
              <div class="avatar">${p.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</div>
              <div style="flex:1">
                <div style="font-size:0.85rem;font-weight:600">${p.name}</div>
                <div style="font-size:0.74rem;color:var(--text-muted)">${(p.diagnosis || '—').substring(0, 38)}</div>
              </div>
              <span class="badge ${p.status === 'Activo' ? 'badge-success' : 'badge-mint'}">${p.status}</span>
            </div>`).join('')}
          ${patients.length === 0 ? '<p style="color:var(--text-dim);font-size:0.85rem;text-align:center;padding:16px">Sin pacientes registrados</p>' : ''}
          ${patients.length > 0 ? `<button class="btn btn-secondary" style="width:100%;justify-content:center;margin-top:4px" onclick="navigate('patients')">Ver mis ${patients.length} pacientes →</button>` : ''}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">💊 Últimas recetas</span></div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${prescriptions.slice(0, 3).map(r => `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
              <div class="avatar sm">${(r.patient?.name || 'RX').split(' ').map(x => x[0]).slice(0, 2).join('')}</div>
              <div style="flex:1">
                <div style="font-size:0.83rem;font-weight:600">${r.patient?.name || '—'}</div>
                <div style="font-size:0.73rem;color:var(--text-muted)">${r.medication} · ${new Date(r.createdAt).toLocaleDateString('es-MX')}</div>
              </div>
              <span class="badge ${r.active ? 'badge-success' : 'badge-muted'}">${r.active ? 'activa' : 'finalizada'}</span>
            </div>`).join('')}
          ${prescriptions.length === 0 ? '<p style="color:var(--text-dim);font-size:0.85rem;text-align:center;padding:16px">Sin recetas</p>' : ''}
        </div>
      </div>
    </div>
  </div>`;
}

/* -------- Super Admin Dashboard -------- */
async function renderSuperAdminDash() {
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted)">⏳ Cargando dashboard...</div>`;

  let stats = {};
  try {
    stats = await API.getAdminStats();
  } catch (err) {
    stats = { totalOrganizations: 0, totalUsers: 0, totalPatients: 0 };
  }

  pc.innerHTML = `
  <div class="page-header">
    <div><div class="page-title">📊 Dashboard Global</div><div class="page-subtitle">Métricas de toda la plataforma NERVE</div></div>
  </div>

  <div class="stats-grid stats-grid-4" style="margin-bottom:24px">
    ${[
      { icon: '🏥', label: 'Organizaciones', val: _fmt(stats.totalOrganizations || 0), color: 'rgba(17,113,139,0.2)' },
      { icon: '🩺', label: 'Usuarios totales', val: _fmt(stats.totalUsers || 0), color: 'rgba(6,207,215,0.1)' },
      { icon: '👤', label: 'Pacientes', val: _fmt(stats.totalPatients || 0), color: 'rgba(73,190,174,0.1)' },
      { icon: '📅', label: 'Citas', val: _fmt(stats.totalAppointments || 0), color: 'rgba(34,197,94,0.1)' },
    ].map(s => `<div class="stat-card">
      <div class="stat-icon" style="background:${s.color}">${s.icon}</div>
      <div class="stat-value">${s.val}</div>
      <div class="stat-label">${s.label}</div>
    </div>`).join('')}
  </div>

  <div class="card">
    <div class="card-header"><span class="card-title">⚡ Plataforma en línea</span></div>
    <div style="padding:30px;text-align:center;color:var(--text-light)">
      <div style="font-size:2rem;margin-bottom:10px">✅</div>
      <p>El sistema NERVE está funcionando correctamente. Todas las organizaciones están activas.</p>
    </div>
  </div>`;
}

/* -------- Dept Head Dashboard -------- */
async function renderDeptHeadDash() {
  // Similar to org_owner but scoped
  return renderOrgDash();
}

/* -------- Patient Portal -------- */
function renderPatientPortal() {
  const user = API.getUser();
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `
  <div class="page-header">
    <div><div class="page-title">Hola, ${user?.name || 'Paciente'} 👋</div><div class="page-subtitle">Tu portal de salud personal</div></div>
  </div>
  <div class="card">
    <div style="padding:30px;text-align:center;color:var(--text-light)">
      <div style="font-size:2rem;margin-bottom:10px">🏥</div>
      <p>Próximamente: portal de paciente con acceso a tus citas, recetas y expediente.</p>
    </div>
  </div>`;
}

/* --- Helper modals --- */
function openNewPatientModal() {
  openModal('➕ Nuevo Paciente', `
  <div class="form-row form-row-2">
    <div class="form-group"><label class="form-label">Nombre completo</label><input class="form-control" id="newPatName" placeholder="Ana Lucía Martínez García" /></div>
    <div class="form-group"><label class="form-label">Email</label><input class="form-control" type="email" id="newPatEmail" placeholder="paciente@email.com" /></div>
  </div>
  <div class="form-row form-row-2">
    <div class="form-group"><label class="form-label">Fecha de nacimiento</label><input class="form-control" type="date" id="newPatDob" /></div>
    <div class="form-group"><label class="form-label">Sexo</label>
      <select class="form-control" id="newPatGender"><option value="Femenino">Femenino</option><option value="Masculino">Masculino</option><option value="Otro">Otro</option></select>
    </div>
  </div>
  <div class="form-row form-row-2">
    <div class="form-group"><label class="form-label">Teléfono</label><input class="form-control" id="newPatPhone" placeholder="+52 55 1234 5678" /></div>
    <div class="form-group"><label class="form-label">Tipo de Sangre</label>
      <select class="form-control" id="newPatBlood"><option>O+</option><option>O-</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option></select>
    </div>
  </div>
  <div class="form-group"><label class="form-label">Alergias</label><input class="form-control" id="newPatAllergies" placeholder="Ej: Penicilina, ibuprofeno..." /></div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
   <button class="btn btn-primary" id="btnCreatePatient" onclick="submitNewPatient()">Guardar paciente →</button>`);
}

async function submitNewPatient() {
  const name = document.getElementById('newPatName')?.value.trim();
  const email = document.getElementById('newPatEmail')?.value.trim();
  const dob = document.getElementById('newPatDob')?.value;
  const gender = document.getElementById('newPatGender')?.value;
  const phone = document.getElementById('newPatPhone')?.value.trim();
  const bloodType = document.getElementById('newPatBlood')?.value;
  const allergies = document.getElementById('newPatAllergies')?.value.trim();

  if (!name) return showNotification('El nombre es obligatorio', 'error');

  const btn = document.getElementById('btnCreatePatient');
  if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

  try {
    await API.createPatient({ name, email, dob, gender, phone, bloodType, allergies });
    closeModal();
    showNotification('Paciente registrado exitosamente', 'success');
    // Refresh if on patients page
    if (typeof renderPatients === 'function') renderPatients();
  } catch (err) {
    showNotification(err.message || 'Error al crear paciente', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Guardar paciente →'; }
  }
}

/* --- Subscriptions page --- */
function renderSubscriptions() {
  const pc = document.getElementById('pageContent');
  const user = API.getUser();
  pc.innerHTML = `
  <div class="page-header"><div><div class="page-title">💳 Suscripción</div><div class="page-subtitle">Plan activo y facturación</div></div></div>
  <div class="card">
    <div style="padding:30px;text-align:center;color:var(--text-light)">
      <div style="font-size:2rem;margin-bottom:10px">💳</div>
      <p>Módulo de suscripciones próximamente. Contacta a soporte para cambios de plan.</p>
    </div>
  </div>`;
}
