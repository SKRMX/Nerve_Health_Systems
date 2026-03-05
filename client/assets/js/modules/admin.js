// ================================================
// NERVE — Admin Module (Super Admin Panel)
// ================================================

function renderAuditLog() {
  const pc = document.getElementById('pageContent');
  const isGlobal = APP.currentRole === 'superadmin';
  pc.innerHTML = `
  <div class="page-header">
    <div><div class="page-title">🔍 Logs de Auditoría ${isGlobal ? 'Global' : ''}</div>
    <div class="page-subtitle">Registro de acceso a datos sensibles · Grado médico</div></div>
    <div class="page-actions">
      <select class="form-control" style="width:160px"><option>Todos los eventos</option><option>Lectura</option><option>Escritura</option><option>Eliminación</option><option>Login</option></select>
      <button class="btn btn-secondary" onclick="showNotification('Exportando registros del Log de Auditoría...','cyan')">📥 Exportar CSV</button>
    </div>
  </div>

  <div class="stats-grid stats-grid-4" style="margin-bottom:20px">
    ${[
      { icon: '👁', label: 'Lecturas hoy', val: '1,284', color: 'rgba(59,130,246,0.15)' },
      { icon: '✏️', label: 'Escrituras hoy', val: '342', color: 'rgba(34,197,94,0.15)' },
      { icon: '🗑', label: 'Eliminaciones hoy', val: '12', color: 'rgba(239,68,68,0.15)' },
      { icon: '🔐', label: 'Logins hoy', val: '87', color: 'rgba(73,190,174,0.15)' },
    ].map(s => `<div class="stat-card"><div class="stat-icon" style="background:${s.color}">${s.icon}</div>
    <div class="stat-value">${s.val}</div><div class="stat-label">${s.label}</div></div>`).join('')}
  </div>

  <div class="card">
    <div class="card-header">
      <span class="card-title">Registro de eventos</span>
      <div style="display:flex;gap:8px">
        <input type="text" class="form-control" style="width:220px" placeholder="Buscar usuario o acción..." />
        <input type="text" id="auditDate" class="form-control" placeholder="Seleccionar fecha" style="width:160px"/>
      </div>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Timestamp</th><th>Usuario</th>${isGlobal ? '<th>Organización</th>' : ''}<th>Acción</th><th>Recurso</th><th>Detalles</th><th>IP</th><th>Resultado</th></tr></thead>
      <tbody>
      ${[
      { ts: '14:47:23', user: 'Dr. González', role: 'Doctor', org: 'Hosp. Ángeles', action: 'read', resource: 'Expediente #PAC-00001', detail: 'Acceso a expediente de M. García', ip: '192.168.1.24', ok: true },
      { ts: '14:45:10', user: 'Dr. González', role: 'Doctor', org: 'Hosp. Ángeles', action: 'write', resource: 'Consulta #CON-2026-0312', detail: 'Nueva consulta registrada', ip: '192.168.1.24', ok: true },
      { ts: '14:40:02', user: 'Ana Martínez', role: 'Paciente', org: 'Hosp. Ángeles', action: 'read', resource: 'Receta RX-2026-0312', detail: 'Descarga de PDF', ip: '190.123.45.67', ok: true },
      { ts: '13:15:44', user: 'Enf. Rodríguez', role: 'Asistente', org: 'Hosp. Ángeles', action: 'write', resource: 'Agenda · Cita #524', detail: 'Cita programada para 02/03/2026', ip: '192.168.1.31', ok: true },
      { ts: '12:30:18', user: 'Admin BioMed', role: 'Org Owner', org: 'BioMed Clínica', action: 'login', resource: 'Sistema NERVE', detail: 'Login exitoso', ip: '201.74.12.100', ok: true },
      { ts: '11:22:07', user: 'Unknown', role: '—', org: '—', action: 'login', resource: 'Sistema NERVE', detail: 'Intento de login fallido (3° intento)', ip: '45.33.22.11', ok: false },
      { ts: '10:05:33', user: 'Dr. Torres', role: 'Doctor', org: 'Clínica Santa Fe', action: 'delete', resource: 'Nota interna #N-441', detail: 'Eliminó nota de seguimiento', ip: '187.22.33.44', ok: true },
    ].map(e => `<tr>
        <td style="font-family:monospace;font-size:0.78rem">${new Date().toISOString().split('T')[0]} ${e.ts}</td>
        <td><div class="cell-primary">${e.user}</div><div class="cell-secondary">${e.role}</div></td>
        ${isGlobal ? `<td class="text-muted">${e.org}</td>` : ''}
        <td><div class="audit-icon ${e.action}" style="width:26px;height:26px;font-size:0.72rem;display:inline-flex;align-items:center;justify-content:center;border-radius:6px">
          ${e.action === 'read' ? '👁' : e.action === 'write' ? '✏️' : e.action === 'delete' ? '🗑' : '🔐'}
        </div> <span class="badge ${e.action === 'read' ? 'badge-info' : e.action === 'write' ? 'badge-success' : e.action === 'delete' ? 'badge-danger' : 'badge-mint'}">${e.action}</span></td>
        <td style="font-size:0.8rem">${e.resource}</td>
        <td class="text-muted fs-xs">${e.detail}</td>
        <td style="font-family:monospace;font-size:0.75rem">${e.ip}</td>
        <td><span class="badge ${e.ok ? 'badge-success' : 'badge-danger'}">${e.ok ? '✓ OK' : '✗ Fallido'}</span></td>
      </tr>`).join('')}
      </tbody>
    </table></div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-top:1px solid var(--border)">
      <span style="font-size:0.8rem;color:var(--text-muted)">Mostrando 7 de 4,821 eventos hoy</span>
      <div style="display:flex;gap:6px">
        <button class="btn btn-secondary btn-sm" onclick="showNotification('Cargando página anterior...','cyan')">◀ Anterior</button>
        <button class="btn btn-secondary btn-sm" onclick="showNotification('Cargando siguiente página...','cyan')">Siguiente ▶</button>
      </div>
    </div>
    </div>
  </div>`;

  setTimeout(() => {
    APP.initDatePicker("#auditDate", { defaultDate: "today" });
  }, 50);
}
