// ================================================
// NERVE — Dashboard Module (All Roles) — SEED DATA
// ================================================

/* helpers */
function _d() { return window.NERVE_DATA || null; }
function _fmt(n) { return n >= 1000 ? n.toLocaleString('es-MX') : n; }
function _initials(name) { return name.replace('Dr. ', '').replace('Dra. ', '').split(' ').map(w => w[0]).slice(0, 2).join(''); }
function _ratingStars(r) { const f = Math.round(r); return '★'.repeat(f) + '☆'.repeat(5 - f); }

/* -------- Super Admin Dashboard -------- */
function renderSuperAdminDash() {
  const D = _d();
  const gm = D ? D.globalMetrics : null;
  const pc = document.getElementById('pageContent');
  const totalPat = D ? D.patients.length : 617;
  const totalDr = D ? D.doctors.length : 50;
  const totalOrg = D ? D.hospitals.length : 4;
  const mrr = gm ? gm.mrr : 52400;

  pc.innerHTML = `
  <div class="page-header">
    <div><div class="page-title">📊 Dashboard Global</div><div class="page-subtitle">Métricas de toda la plataforma NERVE</div></div>
    <div class="page-actions">
      <button class="btn btn-secondary">📥 Exportar reporte</button>
      <button class="btn btn-primary">+ Nueva organización</button>
    </div>
  </div>

  <div class="stats-grid stats-grid-4" style="margin-bottom:24px">
    ${[
      { icon: '🏥', label: 'Organizaciones activas', val: _fmt(totalOrg), chg: '+0 este mes', up: true, color: 'rgba(17,113,139,0.2)', action: "navigate('tenants')" },
      { icon: '🩺', label: 'Doctores activos', val: _fmt(totalDr), chg: `+${totalDr} registrados`, up: true, color: 'rgba(6,207,215,0.1)', action: "renderGlobalDoctors()" },
      { icon: '👤', label: 'Pacientes registrados', val: _fmt(totalPat), chg: `+${Math.round(totalPat * 0.04)} este mes`, up: true, color: 'rgba(73,190,174,0.1)', action: "renderGlobalPatients()" },
      { icon: '💰', label: 'MRR (MXN)', val: `$${_fmt(mrr)}`, chg: '+8.3% vs anterior', up: true, color: 'rgba(34,197,94,0.1)', action: "navigate('subscriptions')" },
    ].map(s => `<div class="stat-card" style="cursor:pointer;transition:transform 0.2s" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'" onclick="${s.action}">
      <div class="stat-icon" style="background:${s.color}">${s.icon}</div>
      <div class="stat-value">${s.val}</div>
      <div class="stat-label">${s.label}</div>
      <div class="stat-change ${s.up ? 'up' : 'down'}">${s.up ? '↑' : '↓'} ${s.chg}</div>
    </div>`).join('')}
  </div>

  <div class="content-grid content-grid-2-1">
    <div>
      <div class="card" style="margin-bottom:20px">
        <div class="card-header"><span class="card-title">📈 Ingresos mensuales (MXN)</span><span class="badge badge-success">ARR: $${_fmt(mrr * 12)}</span></div>
        <div id="revenueChart"></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">🏥 Organizaciones registradas</span><button class="btn btn-secondary btn-sm" onclick="navigate('tenants')">Ver todas</button></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Hospital / Clínica</th><th>Plan</th><th>Ciudad</th><th>Médicos</th><th>Pacientes</th><th>Estado</th></tr></thead>
            <tbody>
              ${(D ? D.hospitals : []).map(h => {
      const drs = D.getDoctorsByHospital(h.id).length;
      const pts = D.getPatientsByHospital(h.id).length;
      return `<tr>
                  <td><div class="cell-primary">${h.name}</div></td>
                  <td><span class="badge ${h.plan === 'hospital' ? 'badge-cyan' : 'badge-mint'}">${h.plan === 'hospital' ? 'Enterprise' : 'Clínica Pro'}</span></td>
                  <td class="text-muted">${h.city}, ${h.state}</td>
                  <td>${drs}</td>
                  <td>${_fmt(pts)}</td>
                  <td><span class="badge badge-success">Activo</span></td>
                </tr>`;
    }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div>
      <div class="card" style="margin-bottom:20px">
        <div class="card-header"><span class="card-title">🥧 Distribución de planes</span></div>
        <div id="planDonut"></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">⚡ Actividad reciente</span></div>
        <div class="timeline">
          ${[
      { icon: '🏥', txt: `<strong>${D ? D.hospitals[3].name : 'Hospital del Norte'}</strong> — ${D ? D.hospitals[3].doctors : 5} doctores activos`, time: 'Hace 2 min', active: true },
      { icon: '💳', txt: `Renovación automática — ${D ? D.hospitals[1].name : 'Centro Médico'}`, time: 'Hace 18 min', active: false },
      { icon: '👤', txt: `<strong>${D ? _fmt(Math.round(D.patients.length * 0.04)) : 24} nuevos pacientes</strong> registrados hoy`, time: 'Hace 1 hr', active: false },
      { icon: '✅', txt: `Backup completado — ${D ? D.hospitals.length : 4} organizaciones`, time: 'Hace 6 hrs', active: false },
    ].map(t => `<div class="timeline-item">
              <div class="timeline-dot ${t.active ? 'active' : ''}">${t.icon}</div>
              <div class="timeline-body">
                <div class="timeline-desc">${t.txt}</div>
                <div class="timeline-date">${t.time}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>
    </div>
  </div>`;

  setTimeout(() => {
    const vals = gm ? gm.monthlyRevenue : [38000, 41000, 44000, 47000, 50000, 52400];
    const lbls = gm ? gm.revenueLabels : ['Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'];
    renderLineChart('revenueChart', [{ label: 'MRR', values: vals }], lbls, { height: 150 });
    // Count plans
    const entCount = D ? D.hospitals.filter(h => h.plan === 'hospital').length : 2;
    const clnCount = D ? D.hospitals.filter(h => h.plan === 'clinica').length : 2;
    renderDonutChart('planDonut', [
      { label: 'Enterprise', value: entCount, color: 'var(--cyan-mid)' },
      { label: 'Clínica Pro', value: clnCount, color: 'var(--mint)' },
    ]);
  }, 100);
}

/* -------- Org Owner Dashboard -------- */
function renderOrgDash() {
  const D = _d();
  const hId = D ? D.currentUsers.org_owner : 'h1';
  const h = D ? D.getHospital(hId) : null;
  const drs = D ? D.getDoctorsByHospital(hId) : [];
  const pts = D ? D.getPatientsByHospital(hId) : [];
  const apts = D ? D.getApptsByHospital(hId) : [];
  const depts = D ? D.departments.filter(d => d.hospitalId === hId) : [];
  const confApts = apts.filter(a => a.status === 'confirmada').length;
  const pc = document.getElementById('pageContent');

  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const todayApts = apts.filter(a => a.date === '2026-02-28');

  pc.innerHTML = `
  <div class="page-header">
    <div>
      <div class="page-title">🏥 ${h ? h.name : 'Hospital Ángeles Metropolitano'} — Resumen</div>
      <div class="page-subtitle">${today.charAt(0).toUpperCase() + today.slice(1)}</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="navigate('reports')">📈 Ver reportes</button>
      <button class="btn btn-primary" onclick="navigate('staff')">+ Agregar personal</button>
    </div>
  </div>

  <div class="stats-grid stats-grid-4" style="margin-bottom:24px">
    ${[
      { icon: '🩺', label: 'Médicos activos', val: _fmt(drs.length), chg: `${depts.length} departamentos`, color: 'rgba(17,113,139,0.2)' },
      { icon: '👤', label: 'Pacientes totales', val: _fmt(pts.length), chg: `+${Math.round(pts.length * 0.04)} este mes`, color: 'rgba(6,207,215,0.1)' },
      { icon: '📅', label: 'Citas registradas', val: _fmt(apts.length), chg: `${confApts} confirmadas`, color: 'rgba(73,190,174,0.1)' },
      { icon: '⭐', label: 'Satisfacción prom.', val: `${(drs.reduce((a, d) => a + d.rating, 0) / drs.length || 4.8).toFixed(1)}/5`, chg: 'Promedio del equipo', color: 'rgba(34,197,94,0.1)' },
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
        <div class="card-header"><span class="card-title">📅 Citas por departamento (semana)</span></div>
        <div id="deptChart"></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">👩‍⚕️ Médicos del hospital</span><button class="btn btn-secondary btn-sm" onclick="navigate('staff')">Ver todos</button></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Médico</th><th>Departamento</th><th>Rol</th><th>Pacientes</th><th>Rating</th></tr></thead>
            <tbody>
              ${drs.slice(0, 8).map(dr => {
      const dept = D.getDept(dr.deptId);
      const pct = D.getPatientsByDoctor(dr.id).length;
      return `<tr>
                  <td><div class="avatar-row"><div class="avatar">${_initials(dr.name)}</div><div class="cell-primary">${dr.name}</div></div></td>
                  <td class="text-muted">${dept ? dept.name : dr.specialty}</td>
                  <td>${dr.role === 'dept_head' ? '<span class="badge badge-cyan">Jefe de Depto.</span>' : '<span class="badge badge-muted">Médico</span>'}</td>
                  <td>${pct}</td>
                  <td><span class="badge badge-success">⭐ ${dr.rating}</span></td>
                </tr>`;
    }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div>
      <div class="card" style="margin-bottom:20px">
        <div class="card-header"><span class="card-title">🏢 Departamentos</span></div>
        <div style="display:flex;flex-direction:column;gap:12px">
          ${depts.map(d => {
      const dDrs = D.getDoctorsByDept(d.id).length;
      const dAps = D.getApptsByDept(d.id).length;
      const cap = Math.min(98, Math.round((dAps / Math.max(dDrs * 15, 1)) * 100));
      return `<div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <span style="font-size:0.82rem;font-weight:600">${d.name}</span>
                <span style="font-size:0.75rem;color:var(--text-muted)">${dDrs} mds · ${dAps} citas</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" style="width:${cap}%;background:${cap > 85 ? 'linear-gradient(90deg,var(--warning),var(--danger))' : 'linear-gradient(90deg,var(--primary),var(--cyan-mid))'}"></div></div>
            </div>`;
    }).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">⭐ Top médicos</span></div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${[...drs].sort((a, b) => b.rating - a.rating).slice(0, 5).map((dr, i) =>
      `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
              <span style="font-size:1rem;width:20px;color:var(--text-dim);font-weight:700">${i + 1}</span>
              <div class="avatar">${_initials(dr.name)}</div>
              <div style="flex:1"><div style="font-size:0.83rem;font-weight:600">${dr.name}</div>
                <div style="font-size:0.72rem;color:var(--text-muted)">${dr.specialty}</div></div>
              <span style="color:var(--cyan);font-weight:700;font-size:0.85rem">⭐ ${dr.rating}</span>
            </div>`
    ).join('')}
        </div>
      </div>
    </div>
  </div>`;

  setTimeout(() => {
    const deptNames = depts.map(d => d.name.split('/')[0].substring(0, 10));
    const deptAppts = depts.map(d => D.getApptsByDept(d.id).length);
    renderBarChart('deptChart', deptAppts, deptNames, { height: 140 });
  }, 100);
}

/* -------- Dept Head Dashboard -------- */
function renderDeptHeadDash() {
  const D = _d();
  const drId = D ? D.currentUsers.dept_head : 'dr_01';
  const headDoc = D ? D.getDoctor(drId) : null;
  const dept = D && headDoc ? D.getDept(headDoc.deptId) : null;
  const team = D && headDoc ? D.getDoctorsByDept(headDoc.deptId) : [];
  const deptPts = D && headDoc ? D.getPatientsByDept(headDoc.deptId) : [];
  const deptApts = D && headDoc ? D.getApptsByDept(headDoc.deptId) : [];
  const pc = document.getElementById('pageContent');

  const avgRating = team.length ? (team.reduce((a, d) => a + d.rating, 0) / team.length).toFixed(1) : '4.8';
  const confApts = deptApts.filter(a => a.status === 'confirmada').length;

  pc.innerHTML = `
  <div class="page-header">
    <div>
      <div class="page-title">👔 ${dept ? dept.name : 'Cardiología'} — Supervisión</div>
      <div class="page-subtitle">${headDoc ? headDoc.name : 'Dr. Sánchez García'} · ${headDoc ? 'Hospital Ángeles Metropolitano' : ''}</div>
    </div>
    <div class="page-actions"><button class="btn btn-primary" onclick="navigate('reports')">📈 Ver reporte completo</button></div>
  </div>

  <div class="stats-grid stats-grid-4" style="margin-bottom:24px">
    ${[
      { icon: '🩺', label: 'Médicos en mi equipo', val: team.length, chg: `${team.filter(d => d.role === 'dept_head').length} jefes · ${team.filter(d => d.role === 'doctor').length} médicos` },
      { icon: '👤', label: 'Pacientes del depto.', val: _fmt(deptPts.length), chg: `~${Math.round(deptPts.length / team.length || 0)} por médico` },
      { icon: '📅', label: 'Citas registradas', val: _fmt(deptApts.length), chg: `${confApts} confirmadas` },
      { icon: '⭐', label: 'Satisfacción promedio', val: `${avgRating}/5`, chg: 'Promedio del equipo' },
    ].map(s => `<div class="stat-card">
      <div class="stat-icon" style="background:rgba(17,113,139,0.2)">${s.icon}</div>
      <div class="stat-value">${s.val}</div>
      <div class="stat-label">${s.label}</div>
      <div class="stat-change up">${s.chg}</div>
    </div>`).join('')}
  </div>

  <div class="content-grid content-grid-2-1">
    <div>
      <div class="card" style="margin-bottom:20px">
        <div class="card-header"><span class="card-title">📊 Rendimiento de mi equipo</span></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Médico</th><th>Especialidad</th><th>Pacientes</th><th>Citas</th><th>Rating</th><th>Acción</th></tr></thead>
          <tbody>
            ${team.map(dr => {
      const drPts = D.getPatientsByDoctor(dr.id).length;
      const drApts = D.getApptsByDoctor(dr.id).length;
      return `<tr>
                <td><div class="avatar-row"><div class="avatar">${_initials(dr.name)}</div>
                  <div><div class="cell-primary">${dr.name}</div>
                    ${dr.role === 'dept_head' ? '<div style="font-size:0.7rem;color:var(--cyan)">Jefe</div>' : ''}
                  </div>
                </div></td>
                <td class="text-muted" style="font-size:0.82rem">${dr.specialty}</td>
                <td>${drPts}</td>
                <td>${drApts}</td>
                <td><span class="badge badge-success">⭐ ${dr.rating}</span></td>
                <td><button class="btn btn-secondary btn-sm" onclick="navigate('patients')">Ver pacientes</button></td>
              </tr>`;
    }).join('')}
          </tbody>
        </table></div>
      </div>
    </div>
    <div>
      <div class="card" style="margin-bottom:20px">
        <div class="card-header"><span class="card-title">📈 Citas por médico</span></div>
        <div id="teamChart"></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">👤 Últimos pacientes del depto.</span></div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${deptPts.slice(0, 6).map(p =>
      `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
              <div class="avatar">${p.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</div>
              <div style="flex:1">
                <div style="font-size:0.83rem;font-weight:600">${p.name}</div>
                <div style="font-size:0.73rem;color:var(--text-muted)">${p.diagnosis} · ${p.age} años</div>
              </div>
              <span class="badge ${p.status === 'Activo' ? 'badge-success' : p.status === 'Nuevo' ? 'badge-mint' : 'badge-warning'}">${p.status}</span>
            </div>`
    ).join('')}
          <button class="btn btn-secondary" style="width:100%;justify-content:center;margin-top:4px" onclick="navigate('patients')">Ver todos →</button>
        </div>
      </div>
    </div>
  </div>`;

  setTimeout(() => {
    const names = team.map(d => _initials(d.name));
    const vals = team.map(d => D.getApptsByDoctor(d.id).length);
    renderBarChart('teamChart', vals, names, { height: 140 });
  }, 100);
}

/* -------- Doctor Dashboard -------- */
function renderDoctorDash() {
  const D = _d();
  const drId = D ? D.currentUsers.doctor : null;
  const doc = D && drId ? D.getDoctor(drId) : null;
  const myPts = D && drId ? D.getPatientsByDoctor(drId) : [];
  const myApts = D && drId ? D.getApptsByDoctor(drId) : [];
  const myRxs = D && drId ? D.getRxByDoctor(drId) : [];
  const pc = document.getElementById('pageContent');
  const user = APP.currentUser[APP.currentRole];
  const displayName = doc ? doc.name : (user ? user.name : 'Doctor');

  const todayApts = myApts.slice(0, 7);
  const recentPts = myPts.slice(0, 4);
  const recentRxs = myRxs.slice(0, 3);
  const confirmCount = myApts.filter(a => a.status === 'confirmada').length;

  pc.innerHTML = `
  <div class="page-header">
    <div>
      <div class="page-title">Buenos días, ${displayName.replace('Dr. ', '').replace('Dra. ', '')} 👋</div>
      <div class="page-subtitle">${new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${myApts.length} citas programadas</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="navigate('appointments')">📅 Ver agenda</button>
      <button class="btn btn-primary" onclick="openNewPatientModal()">+ Nuevo paciente</button>
    </div>
  </div>

  <div class="stats-grid stats-grid-4" style="margin-bottom:24px">
    ${[
      { icon: '📅', label: 'Citas registradas', val: myApts.length, chg: `${confirmCount} confirmadas`, color: 'rgba(17,113,139,0.2)' },
      { icon: '👤', label: 'Mis pacientes', val: myPts.length, chg: `+${Math.round(myPts.length * 0.02)} este mes`, color: 'rgba(6,207,215,0.1)' },
      { icon: '💊', label: 'Recetas generadas', val: myRxs.length, chg: 'Total histórico', color: 'rgba(73,190,174,0.1)' },
      { icon: '⭐', label: 'Satisfacción', val: `${doc ? doc.rating : '4.9'}/5`, chg: 'Calificación promedio', color: 'rgba(34,197,94,0.1)' },
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
        <div style="display:flex;flex-direction:column;gap:8px">
          ${todayApts.map(a => `
            <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--dark-4);border-radius:8px;border-left:3px solid ${a.status === 'confirmada' ? 'var(--cyan-mid)' : 'var(--warning)'}">
              <div style="font-size:0.78rem;font-weight:700;color:var(--cyan);width:46px">${a.time}</div>
              <div style="flex:1">
                <div style="font-size:0.87rem;font-weight:600">${a.patientName}</div>
                <div style="font-size:0.74rem;color:var(--text-muted)">${a.type} · ${a.room}</div>
              </div>
              <span class="badge ${a.status === 'confirmada' ? 'badge-success' : 'badge-warning'}">${a.status}</span>
              <button class="btn btn-primary btn-sm" onclick="navigate('patients')">Consultar</button>
            </div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">📊 Actividad semanal</span></div>
        <div id="weekChart"></div>
      </div>
    </div>
    <div>
      <div class="card" style="margin-bottom:20px">
        <div class="card-header"><span class="card-title">🫀 Mis pacientes</span></div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${recentPts.map(p => `
            <div style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;cursor:pointer" onclick="navigate('patients')">
              <div class="avatar">${p.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</div>
              <div style="flex:1">
                <div style="font-size:0.85rem;font-weight:600">${p.name}</div>
                <div style="font-size:0.74rem;color:var(--text-muted)">${p.diagnosis.substring(0, 38)} · ${p.age} años</div>
              </div>
              <span class="badge ${p.status === 'Activo' ? 'badge-success' : p.status === 'Nuevo' ? 'badge-mint' : 'badge-warning'}">${p.status}</span>
            </div>`).join('')}
          <button class="btn btn-secondary" style="width:100%;justify-content:center;margin-top:4px" onclick="navigate('patients')">Ver mis ${myPts.length} pacientes →</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">💊 Últimas recetas</span></div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${recentRxs.map(r => `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
              <div class="avatar sm">${r.patientName.split(' ').map(x => x[0]).slice(0, 2).join('')}</div>
              <div style="flex:1">
                <div style="font-size:0.83rem;font-weight:600">${r.patientName.split(' ').slice(0, 2).join(' ')}</div>
                <div style="font-size:0.73rem;color:var(--text-muted)">${r.medications[0].name} · ${r.date}</div>
              </div>
              <span class="badge ${r.status === 'activa' ? 'badge-success' : 'badge-muted'}">${r.status}</span>
              <button class="btn btn-secondary btn-sm" onclick="navigate('prescriptions')">PDF</button>
            </div>`).join('')}
          ${recentRxs.length === 0 ? '<p style="color:var(--text-dim);font-size:0.85rem;text-align:center;padding:16px">Sin recetas recientes</p>' : ''}
        </div>
      </div>
    </div>
  </div>`;

  setTimeout(() => {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const vals = days.map((_, i) => myPts.length > 0 ? 3 + Math.round((myPts.length / 7) * (0.6 + (i * 0.07))) : 0);
    renderBarChart('weekChart', vals, days, { height: 130 });
  }, 100);
}

/* -------- Patient Portal -------- */
function renderPatientPortal() {
  const D = _d();
  const pat = D ? D.patients[0] : null;
  const doc = D && pat ? D.getDoctor(pat.doctorId) : null;
  const pc = document.getElementById('pageContent');
  const name = pat ? pat.name.split(' ')[0] + ' ' + pat.name.split(' ')[1] : 'Ana Lucía';

  pc.innerHTML = `
  <div class="page-header">
    <div><div class="page-title">Hola, ${name} 👋</div><div class="page-subtitle">Tu portal de salud personal · ${new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</div></div>
  </div>
  <div class="stats-grid stats-grid-3" style="margin-bottom:24px">
    ${[
      { icon: '📅', label: 'Próxima cita', val: '2 Mar', chg: `${doc ? doc.name : 'Dr. González'} · 09:00 AM` },
      { icon: '📂', label: 'Consultas', val: pat ? pat.visits : '12', chg: 'Historial completo disponible' },
      { icon: '💊', label: 'Recetas activas', val: '3', chg: 'Última: Feb 25, 2026' },
    ].map(s => `<div class="stat-card">
      <div class="stat-icon" style="background:rgba(17,113,139,0.2)">${s.icon}</div>
      <div class="stat-value">${s.val}</div>
      <div class="stat-label">${s.label}</div>
      <div class="stat-change neutral">${s.chg}</div>
    </div>`).join('')}
  </div>
  <div class="content-grid content-grid-1-1">
    <div class="card">
      <div class="card-header"><span class="card-title">📅 Mis próximas citas</span><button class="btn btn-primary btn-sm" onclick="navigate('appointments')">Solicitar cita</button></div>
      ${[
      { d: '02 Mar 2026', t: '09:00 AM', dr: doc ? doc.name : 'Dr. González', esp: doc ? doc.specialty : 'Pediatría', st: 'confirmed' },
      { d: '15 Mar 2026', t: '11:30 AM', dr: 'Dra. Carmen Alvarado', esp: 'Medicina Interna', st: 'pending' },
    ].map(a => `<div style="padding:14px;background:var(--dark-4);border-radius:8px;margin-bottom:8px;border-left:3px solid ${a.st === 'confirmed' ? 'var(--mint)' : 'var(--warning)'}">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><div style="font-weight:700;font-size:0.92rem">${a.d} · ${a.t}</div><div style="font-size:0.8rem;color:var(--text-muted)">${a.dr} · ${a.esp}</div></div>
          <span class="badge ${a.st === 'confirmed' ? 'badge-success' : 'badge-warning'}">${a.st === 'confirmed' ? 'Confirmada' : 'Pendiente'}</span>
        </div>
      </div>`).join('')}
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">💊 Mis recetas recientes</span></div>
      ${[
      { d: '25 Feb 2026', med: pat ? `${pat.diagnosis.substring(0, 30)}...` : 'Omeprazol 20mg', dr: doc ? doc.name : 'Dr. González' },
      { d: '10 Feb 2026', med: 'Vitamina D 5000UI · 1 semanal', dr: doc ? doc.name : 'Dr. González' },
      { d: '15 Ene 2026', med: 'Metformina 500mg · 2 c/día', dr: 'Dra. Torres Ávila' },
    ].map(r => `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
        <div><div style="font-size:0.85rem;font-weight:600">${r.med}</div><div style="font-size:0.75rem;color:var(--text-muted)">${r.dr} · ${r.d}</div></div>
        <button class="btn btn-secondary btn-sm" onclick="navigate('prescriptions')">⬇ PDF</button>
      </div>`).join('')}
    </div>
  </div>`;
}

/* --- Helper modals --- */
function openNewPatientModal() {
  openModal('➕ Nuevo Paciente', `
  <div class="form-row form-row-2">
    <div class="form-group"><label class="form-label">Nombre(s)</label><input class="form-control" placeholder="Ana Lucía" /></div>
    <div class="form-group"><label class="form-label">Apellidos</label><input class="form-control" placeholder="Martínez García" /></div>
  </div>
  <div class="form-row form-row-2">
    <div class="form-group"><label class="form-label">Fecha de nacimiento</label><input class="form-control" type="date" /></div>
    <div class="form-group"><label class="form-label">Sexo</label>
      <select class="form-control"><option>Femenino</option><option>Masculino</option><option>Otro</option></select>
    </div>
  </div>
  <div class="form-row form-row-2">
    <div class="form-group"><label class="form-label">Teléfono</label><input class="form-control" placeholder="+52 55 1234 5678" /></div>
    <div class="form-group"><label class="form-label">Correo electrónico</label><input class="form-control" type="email" placeholder="paciente@email.com" /></div>
  </div>
  <div class="form-group"><label class="form-label">Alergias</label><input class="form-control" placeholder="Ej: Penicilina, ibuprofeno..." /></div>
  <div class="form-group"><label class="form-label">Tipo de Sangre</label>
    <select class="form-control"><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>O+</option><option>O-</option><option>AB+</option><option>AB-</option></select>
  </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
   <button class="btn btn-primary" onclick="closeModal()">Guardar paciente →</button>`);
}

/* --- Subscriptions page --- */
/* --- Subscriptions page --- */
function renderSubscriptions() {
  const D = _d();
  const pc = document.getElementById('pageContent');

  if (APP.currentRole === 'superadmin') {
    // Global Subscriptions View
    const orgs = D ? D.hospitals : [];
    pc.innerHTML = `
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:12px">
        <button class="btn btn-secondary btn-sm" onclick="navigate('dashboard')">← Volver</button>
        <div><div class="page-title">💳 Resumen Económico Global</div><div class="page-subtitle">Suscripciones y Renovaciones de Tenants</div></div>
      </div>
      <div class="page-actions"><button class="btn btn-primary">Configurar Stripe / MercadoPago</button></div>
    </div>
    
    <div class="stats-grid stats-grid-3" style="margin-bottom:24px">
      <div class="stat-card"><div class="stat-icon" style="background:rgba(34,197,94,0.1)">💰</div><div class="stat-value">$${_fmt(52400)}</div><div class="stat-label">MRR Total</div><div class="stat-change up">Ingreso Recurrente Mensual</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(17,113,139,0.2)">📅</div><div class="stat-value">4</div><div class="stat-label">Renovaciones este mes</div><div class="stat-change neutral">100% de retención</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(239,68,68,0.1)">⏳</div><div class="stat-value">0</div><div class="stat-label">Pagos Atrasados</div><div class="stat-change neutral">Ningún cobro pendiente</div></div>
    </div>
    
    <div class="card">
      <div class="card-header"><span class="card-title">Próximas renovaciones (${orgs.length})</span></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Hospital / Clínica</th><th>Plan</th><th>Costo</th><th>Ultimo cobro</th><th>Próximo cobro</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
          ${orgs.map(h => `<tr>
            <td><div style="font-weight:600">${h.name}</div><div style="font-size:0.75rem;color:var(--text-muted)">Propietario: ${h.owner}</div></td>
            <td><span class="badge ${h.plan === 'hospital' ? 'badge-cyan' : 'badge-mint'}">${h.plan}</span></td>
            <td class="fw-700">$${h.plan === 'hospital' ? 'Personalizado' : '4,999 MXN'}</td>
            <td>01 Feb 2026</td>
            <td style="color:var(--cyan)">01 Mar 2026</td>
            <td><span class="badge badge-success">Pago Automático</span></td>
            <td><button class="btn btn-secondary btn-sm">Ver Factura</button></td>
          </tr>`).join('')}
        </tbody>
      </table></div>
    </div>`;
  } else {
    // Org Owner Local Subscription View
    pc.innerHTML = `
    <div class="page-header"><div><div class="page-title">💳 Suscripción</div><div class="page-subtitle">Plan activo y facturación</div></div></div>
    <div class="stats-grid stats-grid-3" style="margin-bottom:24px">
      ${[
        { icon: '💰', label: 'Plan actual', val: D ? 'Clínica Pro' : 'Enterprise', chg: 'Activo' },
        { icon: '📅', label: 'Próxima renovación', val: '01 Mar 2026', chg: 'Pago automático' },
        { icon: '🩺', label: 'Médicos incluidos', val: D ? `${D.getDoctorsByHospital(D.currentUsers.org_owner || 'h1').length}/10` : '20', chg: 'del plan' },
      ].map(s => `<div class="stat-card"><div class="stat-icon" style="background:rgba(17,113,139,0.2)">${s.icon}</div>
        <div class="stat-value">${s.val}</div><div class="stat-label">${s.label}</div>
        <div class="stat-change up">${s.chg}</div></div>`).join('')}
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">Historial de pagos</span></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Fecha</th><th>Plan</th><th>Monto</th><th>Estado</th><th>Factura</th></tr></thead>
        <tbody>
          ${['Feb 2026', 'Ene 2026', 'Dic 2025', 'Nov 2025', 'Oct 2025'].map((m, i) =>
        `<tr><td>${m}</td><td>${i === 0 ? 'Clínica Pro' : 'Clínica Pro'}</td><td class="fw-700">$1,499 MXN</td>
             <td><span class="badge badge-success">Pagado</span></td>
             <td><button class="btn btn-secondary btn-sm">⬇ CFDI</button></td></tr>`
      ).join('')}
        </tbody>
      </table></div>
    </div>`;
  }
}

/* --- Global Doctors View (Super Admin) --- */
function renderGlobalDoctors() {
  const D = _d();
  const pc = document.getElementById('pageContent');
  const docs = D ? D.doctors : [];

  pc.innerHTML = `
  <div class="page-header">
    <div style="display:flex;align-items:center;gap:12px">
      <button class="btn btn-secondary btn-sm" onclick="navigate('dashboard')">← Volver</button>
      <div><div class="page-title">🩺 Doctores Activos (Global)</div><div class="page-subtitle">${docs.length} médicos en todas las organizaciones</div></div>
    </div>
  </div>
  
  <div class="card">
    <div class="card-header"><span class="card-title">Listado Global de Profesionales</span>
    <input type="text" class="form-control" style="width:250px" placeholder="Buscar doctor, especialidad..." /></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Médico</th><th>Especialidad</th><th>Organización (Tenant)</th><th>Rating General</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>
        ${docs.map(dr => {
    const org = D.getHospital(dr.hospitalId);
    return `<tr>
            <td>
              <div class="avatar-row"><div class="avatar">${_initials(dr.name)}</div>
              <div><div class="cell-primary">${dr.name}</div><div class="cell-secondary">ID: ${dr.id}</div></div>
              </div>
            </td>
            <td>${dr.specialty}</td>
            <td><div style="font-weight:600;font-size:0.85rem">${org ? org.name : 'N/A'}</div></td>
            <td><span class="badge badge-success">⭐ ${dr.rating}</span></td>
            <td><span class="badge badge-success">Licencia Activa</span></td>
            <td><button class="btn btn-secondary btn-sm">Auditar</button></td>
          </tr>`;
  }).join('')}
      </tbody>
    </table></div>
  </div>`;
}

/* --- Global Patients View (Super Admin) --- */
function renderGlobalPatients() {
  const D = _d();
  const pc = document.getElementById('pageContent');
  const pats = D ? D.patients.slice(0, 100) : []; // Slice to avoid rendering too many

  pc.innerHTML = `
  <div class="page-header">
    <div style="display:flex;align-items:center;gap:12px">
      <button class="btn btn-secondary btn-sm" onclick="navigate('dashboard')">← Volver</button>
      <div><div class="page-title">👤 Pacientes Registrados (Global)</div><div class="page-subtitle">${D ? D.patients.length : 0} pacientes en la base de datos</div></div>
    </div>
  </div>
  
  <div class="card">
    <div class="card-header"><span class="card-title">Muestra de Base de Datos Global (Top 100)</span>
    <input type="text" class="form-control" style="width:250px" placeholder="Buscar por ID anonimizado..." /></div>
    <div class="table-wrap"><table>
      <thead><tr><th>ID Plataforma</th><th>Paciente</th><th>Edad/Sexo</th><th>Organización Asignada</th><th>Médico Trarante</th><th>Datos Clinicos</th></tr></thead>
      <tbody>
        ${pats.map(p => {
    const doc = D.getDoctor(p.doctorId);
    const org = doc ? D.getHospital(doc.hospitalId) : null;
    return `<tr>
            <td style="font-family:monospace;font-size:0.75rem;color:var(--text-muted)">pat_${p.id}</td>
            <td><div style="font-weight:600">${p.name.substring(0, 3)}*** (Anonimizado)</div><div style="font-size:0.75rem">Privacidad de datos activa</div></td>
            <td>${p.age} · ${p.gender === 'f' ? 'F' : 'M'}</td>
            <td>${org ? org.name : 'N/A'}</td>
            <td>${doc ? doc.name : 'N/A'}</td>
            <td><span class="badge badge-warning">Acceso Restringido</span></td>
          </tr>`;
  }).join('')}
      </tbody>
    </table></div>
    <div style="padding:15px;text-align:center;color:var(--text-muted);font-size:0.85rem;border-top:1px solid var(--border)">
      ⚠️ Los Super Administradores NO tienen acceso a historiales clínicos detallados por políticas de privacidad médicas internacionales.
    </div>
  </div>`;
}
