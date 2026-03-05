// ================================================
// NERVE — Reports Module (API-Connected)
// ================================================

async function renderReports() {
  const pc = document.getElementById('pageContent');
  const role = APP.currentRole;
  const isDoctor = (role === 'doctor');
  const user = APP.liveUser;
  const userName = user?.name || APP.currentUser[role]?.name || 'Doctor';

  pc.innerHTML = `<div class="page-header"><div><div class="page-title">📈 ${isDoctor ? 'Mis Reportes' : 'Reportes y Analítica'}</div><div class="page-subtitle">Cargando datos...</div></div></div>
  <div class="card" style="padding:40px;text-align:center;color:var(--text-muted)">⏳ Cargando reportes...</div>`;

  let appointments = [], patients = [], users = [];
  try {
    const [aRes, pRes] = await Promise.all([API.getAppointments(), API.getPatients()]);
    appointments = aRes.data || [];
    patients = pRes.data || [];
    // Org owners / dept heads can see staff list
    if (!isDoctor) {
      try { const uRes = await API.getUsers(); users = uRes.data || uRes || []; } catch (e) { }
    }
  } catch (err) {
    pc.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Error al cargar reportes</div><div class="empty-state-desc">${err.message}</div></div>`;
    return;
  }

  // Stats
  const totalAppts = appointments.length;
  const completed = appointments.filter(a => a.status === 'completada').length;
  const cancelled = appointments.filter(a => a.status === 'cancelada').length;
  const scheduled = appointments.filter(a => a.status === 'programada').length;
  const cancelRate = totalAppts > 0 ? ((cancelled / totalAppts) * 100).toFixed(1) : '0';
  const completionRate = totalAppts > 0 ? ((completed / totalAppts) * 100).toFixed(1) : '0';

  // ---- Doctor View: only their own stats ----
  if (isDoctor) {
    const specialty = user?.specialty || 'Medicina General';
    const specCfg = typeof getSpecialtyConfig === 'function' ? getSpecialtyConfig(specialty) : null;

    pc.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">📈 Mis Reportes</div><div class="page-subtitle">${userName} · ${specCfg ? specCfg.icon + ' ' : ''}${specialty}</div></div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="showNotification('Generando PDF de tus reportes...','cyan')">📥 Exportar PDF</button>
      </div>
    </div>

    <div class="stats-grid stats-grid-4" style="margin-bottom:24px">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(17,113,139,0.2)">📅</div>
        <div class="stat-value">${totalAppts}</div><div class="stat-label">Citas totales</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(34,197,94,0.1)">✅</div>
        <div class="stat-value">${completed}</div><div class="stat-label">Completadas</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(239,68,68,0.1)">❌</div>
        <div class="stat-value">${cancelRate}%</div><div class="stat-label">Tasa de cancelación</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(6,207,215,0.15)">👤</div>
        <div class="stat-value">${patients.length}</div><div class="stat-label">Mis pacientes</div>
      </div>
    </div>

    <div class="content-grid content-grid-1-1" style="margin-bottom:20px">
      <div class="card">
        <div class="card-header"><span class="card-title">📊 Resumen de citas</span></div>
        <div id="myApptDonut"></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">📋 Pacientes recientes</span></div>
        ${patients.length > 0 ? `<div style="display:flex;flex-direction:column;gap:8px">
          ${patients.slice(0, 6).map(p => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <div style="display:flex;align-items:center;gap:10px">
              <div class="avatar">${p.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</div>
              <div><div style="font-weight:600;font-size:0.85rem">${p.name}</div><div style="font-size:0.75rem;color:var(--text-muted)">${p.diagnosis || 'Sin diagnóstico'}</div></div>
            </div>
            <span class="badge ${p.status === 'Activo' ? 'badge-success' : 'badge-warning'}">${p.status}</span>
          </div>`).join('')}
        </div>` : '<div class="empty-state" style="padding:20px"><div class="empty-state-desc">Sin pacientes registrados</div></div>'}
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">📅 Historial de citas</span></div>
      ${appointments.length > 0 ? `<div class="table-wrap"><table>
        <thead><tr><th>Paciente</th><th>Fecha</th><th>Hora</th><th>Tipo</th><th>Estado</th></tr></thead>
        <tbody>
        ${appointments.slice(0, 15).map(a => `<tr>
          <td><div style="font-weight:600">${a.patient?.name || '—'}</div></td>
          <td class="text-muted">${new Date(a.date).toLocaleDateString('es-MX')}</td>
          <td>${a.time}</td>
          <td class="text-muted">${a.type || '—'}</td>
          <td><span class="badge ${a.status === 'completada' ? 'badge-success' : a.status === 'cancelada' ? 'badge-danger' : 'badge-cyan'}">${a.status}</span></td>
        </tr>`).join('')}
        </tbody>
      </table></div>` : '<div class="empty-state" style="padding:20px"><div class="empty-state-desc">Sin citas registradas</div></div>'}
    </div>`;

    setTimeout(() => {
      if (typeof renderDonutChart === 'function') {
        renderDonutChart('myApptDonut', [
          { label: 'Completadas', value: Math.max(completed, 0), color: 'var(--success)' },
          { label: 'Programadas', value: Math.max(scheduled, 0), color: 'var(--cyan-mid)' },
          { label: 'Canceladas', value: Math.max(cancelled, 0), color: 'var(--text-dim)' },
        ]);
      }
    }, 80);
    return;
  }

  // ---- Org Owner / Dept Head / Superadmin: see all doctors ----
  const doctors = users.filter(u => u.role === 'doctor' || u.role === 'dept_head');

  pc.innerHTML = `
  <div class="page-header">
    <div><div class="page-title">📈 Reportes y Analítica</div><div class="page-subtitle">Métricas de rendimiento · ${doctors.length} doctores · ${patients.length} pacientes</div></div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="showNotification('Generando PDF...','cyan')">📥 Exportar PDF</button>
    </div>
  </div>

  <div class="stats-grid stats-grid-4" style="margin-bottom:24px">
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(17,113,139,0.2)">📅</div>
      <div class="stat-value">${totalAppts}</div><div class="stat-label">Citas totales</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(34,197,94,0.1)">👤</div>
      <div class="stat-value">${patients.length}</div><div class="stat-label">Pacientes</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(239,68,68,0.1)">❌</div>
      <div class="stat-value">${cancelRate}%</div><div class="stat-label">Tasa de cancelación</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(6,207,215,0.15)">✅</div>
      <div class="stat-value">${completionRate}%</div><div class="stat-label">Tasa de completado</div>
    </div>
  </div>

  <div class="content-grid content-grid-1-1" style="margin-bottom:20px">
    <div class="card">
      <div class="card-header"><span class="card-title">📊 Estado de citas</span></div>
      <div id="orgApptDonut"></div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">🩺 Distribución por especialidad</span></div>
      <div id="specDonut"></div>
    </div>
  </div>

  <div class="card">
    <div class="card-header"><span class="card-title">🩺 Rendimiento por doctor</span>
    <button class="btn btn-secondary btn-sm" onclick="showNotification('Exportando...','cyan')">📥 Exportar</button></div>
    ${doctors.length > 0 ? `<div class="table-wrap"><table>
      <thead><tr><th>Doctor</th><th>Especialidad</th><th>Pacientes</th><th>Estado</th></tr></thead>
      <tbody>
      ${doctors.map(d => `<tr>
        <td><div class="avatar-row"><div class="avatar">${d.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</div><div class="cell-primary">${d.name}</div></div></td>
        <td class="text-muted">${d.specialty || '—'}</td>
        <td class="fw-700">${d._count?.patients || 0}</td>
        <td><span class="badge ${d.active ? 'badge-success' : 'badge-danger'}">${d.active ? 'Activo' : 'Inactivo'}</span></td>
      </tr>`).join('')}
      </tbody>
    </table></div>` : '<div class="empty-state" style="padding:20px"><div class="empty-state-desc">Sin doctores registrados</div></div>'}
  </div>`;

  setTimeout(() => {
    if (typeof renderDonutChart === 'function') {
      renderDonutChart('orgApptDonut', [
        { label: 'Completadas', value: Math.max(completed, 0), color: 'var(--success)' },
        { label: 'Programadas', value: Math.max(scheduled, 0), color: 'var(--cyan-mid)' },
        { label: 'Canceladas', value: Math.max(cancelled, 0), color: 'var(--text-dim)' },
      ]);
      // Group by specialty
      const specCounts = {};
      doctors.forEach(d => {
        const sp = d.specialty || 'Sin especialidad';
        specCounts[sp] = (specCounts[sp] || 0) + 1;
      });
      const specColors = ['var(--cyan-mid)', 'var(--mint)', 'var(--primary)', 'var(--warning)', 'var(--success)', 'var(--danger)', '#A78BFA', '#EC4899'];
      renderDonutChart('specDonut', Object.entries(specCounts).map(([label, value], i) => ({
        label, value, color: specColors[i % specColors.length],
      })));
    }
  }, 80);
}
