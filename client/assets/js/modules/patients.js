// ================================================
// NERVE — Patients Module (Expediente Dinámico)
// ================================================

// Dynamic data from seed
function _getVisiblePatients() {
  const D = window.NERVE_DATA;
  if (!D) return [];
  const role = APP.currentRole;
  if (role === 'doctor') {
    const drId = D.currentUsers.doctor;
    return D.getPatientsByDoctor(drId);
  } else if (role === 'dept_head') {
    const headId = D.currentUsers.dept_head;
    const doc = D.getDoctor(headId);
    return doc ? D.getPatientsByDept(doc.deptId) : [];
  } else if (role === 'org_owner') {
    const hId = D.currentUsers.org_owner;
    return D.getPatientsByHospital(hId);
  }
  return D.patients.slice(0, 30);
}

let _patientSearch = '';
let _patientStatusF = '';

function renderPatients() {
  const pts = _getVisiblePatients();
  const D = window.NERVE_DATA;
  // Build dept options
  const depts = D ? [...new Set(pts.map(p => { const d = D.getDept(p.deptId); return d ? d.name : ''; }).filter(Boolean))] : [];
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `
  <div class="page-header">
    <div><div class="page-title">🫀 Pacientes</div><div class="page-subtitle">${pts.length} pacientes registrados</div></div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="navigate('importer')">📤 Importar CSV</button>
      <button class="btn btn-primary" onclick="openNewPatientModal()">+ Nuevo paciente</button>
    </div>
  </div>

  <div class="card" style="margin-bottom:20px">
    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
      <div class="topbar-search" style="flex:1;max-width:380px">
        <span class="search-icon">🔍</span>
        <input type="text" placeholder="Buscar por nombre, email o diagnóstico..." id="patientSearchInput"
          oninput="_patientSearch=this.value;renderPatientTable()" />
      </div>
      <select class="form-control" style="width:170px" onchange="_patientStatusF=this.value;renderPatientTable()">
        <option value="">Todos los estados</option>
        <option value="Activo">Activo</option>
        <option value="Nuevo">Nuevo</option>
        <option value="Seguimiento">Seguimiento</option>
      </select>
      <select class="form-control" style="width:190px" onchange="_patientDeptF=this.value;renderPatientTable()">
        <option value="">Todos los departamentos</option>
        ${depts.map(d => `<option>${d}</option>`).join('')}
      </select>
    </div>
  </div>

  <div class="card"><div id="patientTableArea"></div></div>`;
  renderPatientTable();
}

let _patientDeptF = '';
function renderPatientTable() {
  const D = window.NERVE_DATA;
  const pts = _getVisiblePatients();
  const search = _patientSearch.toLowerCase();
  const filtered = pts.filter(p =>
    (!search || p.name.toLowerCase().includes(search) || p.diagnosis.toLowerCase().includes(search) || p.email.toLowerCase().includes(search)) &&
    (!_patientStatusF || p.status === _patientStatusF) &&
    (!_patientDeptF || (D && D.getDept(p.deptId) && D.getDept(p.deptId).name === _patientDeptF))
  );
  const area = document.getElementById('patientTableArea');
  if (!area) return;
  if (filtered.length === 0) {
    area.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">Sin resultados</div><div class="empty-state-desc">No se encontraron pacientes con ese criterio.</div></div>`;
    return;
  }
  area.innerHTML = `<div class="table-wrap"><table>
  <thead><tr><th>Paciente</th><th>Edad</th><th>Sangre</th><th>Diagnóstico</th><th>Última visita</th><th>Visitas</th><th>Estado</th><th>Acciones</th></tr></thead>
  <tbody>${filtered.slice(0, 50).map(p => {
    const dept = D ? D.getDept(p.deptId) : null;
    return `<tr>
      <td><div class="avatar-row">
        <div class="avatar">${p.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</div>
        <div><div class="cell-primary">${p.name}</div><div class="cell-secondary">${dept ? dept.name : ''}</div></div>
      </div></td>
      <td>${p.age} · ${p.gender === 'f' ? '♀' : '♂'}</td>
      <td><span class="badge badge-info">${p.blood}</span></td>
      <td style="max-width:200px;font-size:0.82rem;color:var(--text-muted)">${p.diagnosis.substring(0, 40)}</td>
      <td class="text-muted">${p.lastVisit}</td>
      <td class="fw-700">${p.visits}</td>
      <td><span class="badge ${p.status === 'Activo' ? 'badge-success' : p.status === 'Nuevo' ? 'badge-mint' : 'badge-warning'}">${p.status}</span></td>
      <td><div style="display:flex;gap:6px">
        <button class="btn btn-primary btn-sm" onclick="openPatientDetail('${p.id}')">Ver expediente</button>
        <button class="btn btn-secondary btn-sm" onclick="openNewConsultModal('${p.id}')">Consultar</button>
      </div></td>
    </tr>`;
  }).join('')}</tbody>
</table></div>`;
}

function openPatientDetail(id) {
  const D = window.NERVE_DATA;
  const p = D ? D.patients.find(x => x.id === id) : null;
  if (!p) return;
  const doc = D ? D.getDoctor(p.doctorId) : null;
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `
  <div class="page-header">
    <div style="display:flex;align-items:center;gap:12px">
      <button class="btn btn-secondary btn-sm" onclick="renderPatients()">← Volver</button>
      <div><div class="page-title">${p.name}</div><div class="page-subtitle">Expediente clínico · ID #PAC-${String(p.id).padStart(5, '0')}</div></div>
    </div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="navigate('prescriptions')">💊 Nueva receta</button>
      <button class="btn btn-primary" onclick="openNewConsultModal(${p.id})">+ Nueva consulta</button>
    </div>
  </div>

  <div class="content-grid content-grid-2-1" style="margin-bottom:20px">
    <div class="card">
      <div class="patient-header">
        <div class="avatar lg">${p.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</div>
        <div class="patient-meta">
          <div class="patient-name">${p.name}</div>
          <div class="patient-info">
            <span class="patient-info-item">🎂 ${p.age} años (${p.dob})</span>
            <span class="patient-info-item">${p.gender === 'f' ? '♀ Femenino' : '♂ Masculino'}</span>
            <span class="patient-info-item">🩸 ${p.blood}</span>
            <span class="patient-info-item">📱 ${p.phone}</span>
            <span class="patient-info-item">✉️ ${p.email}</span>
          </div>
          <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
            <span class="badge badge-danger">⚠️ Alergias: ${p.allergies}</span>
            <span class="badge badge-success">${p.status}</span>
            <span class="badge badge-cyan">${doc ? doc.specialty : 'Especialidad no especificada'}</span>
            <span class="badge badge-muted">${p.visits} visitas</span>
          </div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:12px">Signos vitales (última consulta)</div>
      ${[
      { label: 'Presión arterial', val: p.bp || '120/80 mmHg', ok: true },
      { label: 'Frecuencia cardíaca', val: '72 lpm', ok: true },
      { label: 'Temperatura', val: '36.8 °C', ok: true },
      { label: 'Saturación O₂', val: '98%', ok: true },
      { label: 'Peso / Talla', val: `${p.weight} kg · ${p.height} cm`, ok: true },
      { label: 'IMC', val: (p.weight / ((p.height / 100) ** 2)).toFixed(1), ok: true },
    ].map(v => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
        <span style="font-size:0.8rem;color:var(--text-muted)">${v.label}</span>
        <span style="font-size:0.82rem;font-weight:600;color:${v.ok ? 'var(--success)' : 'var(--danger)'}">${v.val}</span>
      </div>`).join('')}
    </div>
  </div>

  <!-- Tabs -->
  <div class="tabs" id="expedienteTabs">
    <div class="tab active" onclick="switchExpedienteTab(this,'tabConsultas')">📋 Consultas</div>
    <div class="tab" onclick="switchExpedienteTab(this,'tabExpediente')">📂 Expediente</div>
    <div class="tab" onclick="switchExpedienteTab(this,'tabRecetas')">💊 Recetas</div>
    <div class="tab" onclick="switchExpedienteTab(this,'tabAudit')">🔍 Auditoría</div>
  </div>

  <!-- Tab content: Consultas -->
  <div id="tabConsultas">
    <div class="timeline">
      ${[
      { d: p.lastVisit, dr: doc ? doc.name : 'Dr. González', tipo: 'Seguimiento', s: `Paciente con ${p.diagnosis.toLowerCase()} en control regular.`, o: `PA ${p.bp || '120/80'}, FC 72, peso ${p.weight}kg, talla ${p.height}cm.`, a: p.diagnosis, p_: 'Continuar tratamiento. Control en 4 semanas.' },
      { d: '2026-01-15', dr: doc ? doc.name : 'Dr. González', tipo: 'Consulta General', s: 'Paciente refiere síntomas previos de seguimiento.', o: 'Signos vitales estables.', a: p.diagnosis, p_: 'Ajuste de medicación. Próximo control mensual.' },
    ].map(c => `<div class="timeline-item">
        <div class="timeline-dot active">📋</div>
        <div class="timeline-body">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span class="timeline-title">${c.tipo} · ${c.d}</span>
            <span class="badge badge-muted">${c.dr}</span>
          </div>
          <div style="background:var(--dark-4);border-radius:8px;padding:12px;font-size:0.82rem">
            <div style="display:grid;grid-template-columns:80px 1fr;gap:6px;row-gap:8px">
              <span style="color:var(--cyan-mid);font-weight:700">S:</span><span>${c.s}</span>
              <span style="color:var(--mint);font-weight:700">O:</span><span>${c.o}</span>
              <span style="color:var(--warning);font-weight:700">A:</span><span>${c.a}</span>
              <span style="color:var(--success);font-weight:700">P:</span><span>${c.p_ || c.p || ''}</span>
            </div>
          </div>
          <div style="margin-top:6px;display:flex;gap:6px">
            <button class="btn btn-secondary btn-sm" onclick="openClinicalNoteModal('${c.tipo}', '${c.d}', '${escape(c.s)}', '${escape(c.o)}', '${escape(c.a)}', '${escape(c.p_ || c.p || '')}')">Ver completo</button>
            <button class="btn btn-secondary btn-sm" onclick="navigate('prescriptions')">💊 Ver receta</button>
          </div>
        </div>
      </div>`).join('')}
    </div>
  </div>

  <!-- Tab content: Expediente dinámico -->
  <div id="tabExpediente" style="display:none">
    <div class="field-builder">
      <div class="field-builder-header">
        <span style="font-weight:700;font-size:0.88rem">📂 Expediente Clínico · Medicina General</span>
        <button class="btn btn-primary btn-sm" onclick="openAddFieldModal()">+ Agregar campo</button>
      </div>
      <div id="dynamicFields">
        ${[
      { label: 'Antecedentes heredofamiliares', type: 'textarea', val: 'Madre: HTA. Padre: DM2. Sin antecedentes oncológicos conocidos.' },
      { label: 'Antecedentes patológicos', type: 'textarea', val: 'Rinitis alérgica desde infancia. Niega cirugías previas. No internaciones.' },
      { label: 'Padecimiento actual (cronopatología)', type: 'textarea', val: 'Inicia hace 3 días con cefalea fronto-parietal...' },
      { label: 'Diagnóstico principal (CIE-10)', type: 'text', val: 'G44.2 · Cefalea tensional' },
      { label: 'Diabetes', type: 'select', val: 'No' },
      { label: 'Hipertensión', type: 'select', val: 'No' },
      { label: 'Vacunación al día', type: 'checkbox', val: 'Sí' },
      { label: 'Score de dolor (0-10)', type: 'number', val: '4' },
    ].map(f => `<div class="field-row">
          <span class="field-drag">⋮⋮</span>
          <div style="flex:1">
            <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:3px">${f.label}
              <span class="field-type-badge" style="margin-left:6px">${f.type}</span>
            </div>
            ${f.type === 'textarea' ?
        `<div style="font-size:0.84rem;color:var(--text)">${f.val}</div>` :
        `<div style="font-size:0.84rem;color:var(--text)">${f.val}</div>`}
          </div>
          <button class="btn btn-secondary btn-sm" onclick="openEditFieldModal('${f.label}', '${f.type}', '${escape(f.val)}')">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="openDeleteFieldModal('${f.label}')">🗑</button>
        </div>`).join('')}
      </div>
    </div>
  </div>

  <!-- Tab content: Recetas -->
  <div id="tabRecetas" style="display:none">
    <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
      <button class="btn btn-primary" onclick="navigate('prescriptions')">+ Nueva receta</button>
    </div>
    ${[
      { d: '28 Feb 2026', meds: 'Paracetamol 500mg', dr: 'Dr. González', id: 'RX-2026-0312' },
      { d: '10 Nov 2025', meds: 'Loratadina 10mg', dr: 'Dr. González', id: 'RX-2025-0901' },
    ].map(r => `<div class="card" style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="fw-700">${r.id}</div><div style="font-size:0.8rem;color:var(--text-muted)">${r.meds} · ${r.d} · ${r.dr}</div></div>
        <button class="btn btn-secondary btn-sm" onclick="navigate('prescriptions')">⬇ Descargar PDF</button>
      </div>
    </div>`).join('')}
  </div>

  <!-- Tab content: Audit -->
  <div id="tabAudit" style="display:none">
    ${[
      { icon: '👁', type: 'read', text: '<strong>Dr. González</strong> accedió al expediente completo', ip: '192.168.1.24', time: '28 Feb 2026 · 09:07 AM' },
      { icon: '✏️', type: 'write', text: '<strong>Dr. González</strong> actualizó diagnóstico principal', ip: '192.168.1.24', time: '28 Feb 2026 · 09:15 AM' },
      { icon: '💊', type: 'write', text: '<strong>Dr. González</strong> generó receta RX-2026-0312', ip: '192.168.1.24', time: '28 Feb 2026 · 09:22 AM' },
      { icon: '👁', type: 'read', text: '<strong>Ana Martínez (Paciente)</strong> descargó receta', ip: '190.123.45.67', time: '28 Feb 2026 · 11:40 AM' },
    ].map(a => `<div class="audit-entry">
      <div class="audit-icon ${a.type}">${a.icon}</div>
      <div class="audit-info">
        <div class="audit-text">${a.text}</div>
        <div class="audit-meta">IP: ${a.ip} · ${a.time}</div>
      </div>
    </div>`).join('')}
  </div>
  `;
}

function switchExpedienteTab(tab, targetId) {
  document.querySelectorAll('#expedienteTabs .tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  ['tabConsultas', 'tabExpediente', 'tabRecetas', 'tabAudit'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = id === targetId ? 'block' : 'none';
  });
}

function openAddFieldModal() {
  openModal('➕ Agregar campo dinámico', `
    <p style="font-size:0.84rem;color:var(--text-muted);margin-bottom:16px">Agrega un campo personalizado al expediente de esta especialidad.</p>
    <div class="form-group"><label class="form-label">Nombre del campo</label><input class="form-control" placeholder="Ej: Escala de dolor, Perímetro abdominal..." /></div>
    <div class="form-group"><label class="form-label">Tipo de campo</label>
      <select class="form-control">
        <option>texto corto</option><option>textarea</option><option>número</option>
        <option>fecha</option><option>selección</option><option>checkbox</option>
      </select>
    </div>
    <div class="form-group" id="optionsGroup" style="display:none"><label class="form-label">Opciones (separadas por coma)</label><input class="form-control" placeholder="Sí, No, No aplica" /></div>
    <div class="form-group"><label class="form-label">Requerido</label>
      <select class="form-control"><option>No</option><option>Sí</option></select>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
   <button class="btn btn-primary" onclick="closeModal()">Agregar campo →</button>`);
}

function openNewConsultModal(patId) {
  const p = PATIENTS_DATA.find(x => x.id === patId);
  openModal('💬 Nueva Consulta' + (p ? ` · ${p.name}` : ''), `
    <div class="form-row form-row-2">
      <div class="form-group"><label class="form-label">Fecha</label><input class="form-control" type="date" value="${new Date().toISOString().split('T')[0]}" /></div>
      <div class="form-group"><label class="form-label">Tipo de consulta</label>
        <select class="form-control"><option>Primera vez</option><option>Seguimiento</option><option>Urgencias</option><option>Post-quirúrgico</option></select>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
      ${[['PA (mmHg)', '120/80'], ['FC (lpm)', '72'], ['Temp (°C)', '36.6'], ['Peso (kg)', '68'], ['Talla (cm)', '165'], ['SpO2 (%)', '98']].map(([l, v]) =>
    `<div class="form-group" style="margin-bottom:0"><label class="form-label">${l}</label><input class="form-control" value="${v}" /></div>`
  ).join('')}
    </div>
    <div class="form-group"><label class="form-label">S — Subjetivo (queja del paciente)</label><textarea class="form-control" placeholder="Descripción en palabras del paciente..."></textarea></div>
    <div class="form-group"><label class="form-label">O — Objetivo (exploración física)</label><textarea class="form-control" placeholder="Hallazgos clínicos..."></textarea></div>
    <div class="form-group"><label class="form-label">A — Diagnóstico (CIE-10)</label><input class="form-control" placeholder="Ej: J06.9 Infección aguda de vías respiratorias" /></div>
    <div class="form-group"><label class="form-label">P — Plan de tratamiento</label><textarea class="form-control" placeholder="Indicaciones, medicamentos, estudios..."></textarea></div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
   <button class="btn btn-secondary" onclick="closeModal();navigate('prescriptions')">💊 Guardar y generar receta</button>
   <button class="btn btn-primary" onclick="closeModal()">Guardar consulta →</button>`, 'lg');
}

function openClinicalNoteModal(tipo, date, s, o, a, p) {
  openModal('📄 Nota Clínica Completa: ' + tipo, `
    <div style="margin-bottom:12px;color:var(--text-muted);font-size:0.85rem">Realizada el ${date}</div>
    <div class="form-group"><label class="form-label" style="color:var(--cyan-mid)">S — Subjetivo</label><textarea class="form-control" readonly style="min-height:80px">${unescape(s)}</textarea></div>
    <div class="form-group"><label class="form-label" style="color:var(--mint)">O — Objetivo</label><textarea class="form-control" readonly style="min-height:80px">${unescape(o)}</textarea></div>
    <div class="form-group"><label class="form-label" style="color:var(--warning)">A — Diagnóstico / Análisis</label><textarea class="form-control" readonly style="min-height:60px">${unescape(a)}</textarea></div>
    <div class="form-group"><label class="form-label" style="color:var(--success)">P — Plan de tratamiento</label><textarea class="form-control" readonly style="min-height:80px">${unescape(p)}</textarea></div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>
    <button class="btn btn-primary" onclick="closeModal();navigate('prescriptions')">⚕️ Generar nueva receta</button>
  `, 'lg');
}

function openEditFieldModal(label, type, val) {
  openModal('✏️ Editar Campo Dinámico', `
    <div class="form-group"><label class="form-label">Nombre del campo</label><input class="form-control" value="${label}" readonly style="background:var(--dark-4)" /></div>
    <div class="form-group"><label class="form-label">Valor actual (${type})</label>
      ${type === 'textarea' ? `<textarea class="form-control" style="min-height:100px">${unescape(val)}</textarea>` :
      (type === 'checkbox' ? `<select class="form-control"><option ${unescape(val) === 'Sí' ? 'selected' : ''}>Sí</option><option ${unescape(val) === 'No' ? 'selected' : ''}>No</option></select>` :
        `<input class="form-control" value="${unescape(val)}" />`)}
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="closeModal();showNotification('Campo actualizado','success')">Guardar Cambios</button>
  `);
}

function openDeleteFieldModal(label) {
  openModal('🗑 Eliminar Campo', `
    ¿Estás seguro que deseas eliminar permanentemente el campo <strong>${label}</strong> de este expediente?
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-danger" onclick="closeModal();showNotification('Campo eliminado','warning')">Eliminar Campo</button>
  `);
}
