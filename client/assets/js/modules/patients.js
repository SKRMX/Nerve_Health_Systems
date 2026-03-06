// ================================================
// NERVE — Patients Module (API-Connected)
// ================================================

let _patientsData = [];
let _patientSearch = '';
let _patientStatusF = '';

async function renderPatients() {
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `<div class="page-header">
    <div><div class="page-title">🫀 Pacientes</div><div class="page-subtitle">Cargando...</div></div>
  </div>
  <div class="card" style="padding:40px;text-align:center;color:var(--text-muted)">⏳ Cargando pacientes...</div>`;

  try {
    const res = await API.getPatients();
    _patientsData = res.data || [];
  } catch (err) {
    pc.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Error al cargar pacientes</div><div class="empty-state-desc">${err.message}</div></div>`;
    return;
  }

  pc.innerHTML = `
  <div class="page-header">
    <div><div class="page-title">🫀 Pacientes</div><div class="page-subtitle">${_patientsData.length} pacientes registrados</div></div>
    <div class="page-actions">
      <button class="btn btn-primary" onclick="openNewPatientModal()">+ Nuevo paciente</button>
    </div>
  </div>

  <div class="card" style="margin-bottom:20px">
    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
      <div class="topbar-search" style="flex:1;max-width:380px">
        <span class="search-icon">🔍</span>
        <input type="text" placeholder="Buscar por nombre, email o diagnóstico..." id="patientSearchInput"
          oninput="_patientSearch=this.value;_debouncedRenderPatientTable()" />
      </div>
      <select class="form-control" style="width:170px" onchange="_patientStatusF=this.value;renderPatientTable()">
        <option value="">Todos los estados</option>
        <option value="Activo">Activo</option>
        <option value="Nuevo">Nuevo</option>
        <option value="Seguimiento">Seguimiento</option>
      </select>
    </div>
  </div>

  <div class="card"><div id="patientTableArea"></div></div>`;
  renderPatientTable();
}

const _debouncedRenderPatientTable = APP.debounce(() => renderPatientTable(), 300);

function renderPatientTable() {
  const search = _patientSearch.toLowerCase();
  const filtered = _patientsData.filter(p =>
    (!search || p.name.toLowerCase().includes(search) || (p.email || '').toLowerCase().includes(search) || (p.diagnosis || '').toLowerCase().includes(search)) &&
    (!_patientStatusF || p.status === _patientStatusF)
  );
  const area = document.getElementById('patientTableArea');
  if (!area) return;

  if (filtered.length === 0) {
    area.innerHTML = `<div class="empty-state" style="padding:40px"><div class="empty-state-icon">🔍</div><div class="empty-state-title">Sin resultados</div><div class="empty-state-desc">${_patientsData.length === 0 ? 'Aún no hay pacientes registrados. Crea el primero con el botón "+ Nuevo paciente".' : 'No se encontraron pacientes con ese criterio.'}</div></div>`;
    return;
  }

  const calcAge = (dob) => {
    if (!dob) return '—';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  };

  area.innerHTML = `<div class="table-wrap"><table>
  <thead><tr><th>Paciente</th><th>Edad</th><th>Sangre</th><th>Diagnóstico</th><th>Doctor</th><th>Estado</th><th>Acciones</th></tr></thead>
  <tbody>${filtered.slice(0, 50).map(p => {
    const age = calcAge(p.dob);
    return `<tr>
      <td><div class="avatar-row">
        <div class="avatar">${p.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</div>
        <div><div class="cell-primary">${p.name}</div><div class="cell-secondary">${p.email || '—'}</div></div>
      </div></td>
      <td>${age !== '—' ? age + ' · ' + (p.gender === 'Femenino' || p.gender === 'f' || p.gender === 'F' ? '♀' : '♂') : '—'}</td>
      <td>${p.bloodType ? `<span class="badge badge-info">${p.bloodType}</span>` : '—'}</td>
      <td style="max-width:200px;font-size:0.82rem;color:var(--text-muted)">${(p.diagnosis || '—').substring(0, 40)}</td>
      <td class="text-muted fs-xs">${p.doctor?.name || '—'}</td>
      <td><span class="badge ${p.status === 'Activo' ? 'badge-success' : p.status === 'Nuevo' ? 'badge-mint' : 'badge-warning'}">${p.status}</span></td>
      <td><div style="display:flex;gap:6px">
        <button class="btn btn-primary btn-sm" onclick="openPatientDetail('${p.id}')">Ver expediente</button>
      </div></td>
    </tr>`;
  }).join('')}</tbody>
</table></div>`;
}

async function openPatientDetail(id) {
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted)">⏳ Cargando expediente...</div>`;

  let p;
  try {
    p = await API.getPatient(id);
  } catch (err) {
    pc.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Error</div><div class="empty-state-desc">${err.message}</div></div>`;
    return;
  }

  const calcAge = (dob) => {
    if (!dob) return '—';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  };
  const age = calcAge(p.dob);

  // Init specialty config based on doctor's specialty
  _initSpecialty(p);

  pc.innerHTML = `
  <div class="page-header">
    <div style="display:flex;align-items:center;gap:12px">
      <button class="btn btn-secondary btn-sm" onclick="renderPatients()">← Volver</button>
      <div><div class="page-title">${p.name}</div><div class="page-subtitle">Expediente clínico</div></div>
    </div>
    <div class="page-actions">
      <button class="btn btn-primary" onclick="openNewApptModalForPatient('${p.id}','${p.name}')">+ Nueva cita</button>
    </div>
  </div>

  <div class="content-grid content-grid-2-1" style="margin-bottom:20px">
    <div class="card">
      <div class="patient-header">
        <div class="avatar lg">${p.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</div>
        <div class="patient-meta">
          <div class="patient-name">${p.name}</div>
          <div class="patient-info">
            ${age !== '—' ? `<span class="patient-info-item">🎂 ${age} años${p.dob ? ' (' + new Date(p.dob).toLocaleDateString('es-MX') + ')' : ''}</span>` : ''}
            ${p.gender ? `<span class="patient-info-item">${p.gender === 'Femenino' || p.gender === 'f' || p.gender === 'F' ? '♀ Femenino' : '♂ Masculino'}</span>` : ''}
            ${p.bloodType ? `<span class="patient-info-item">🩸 ${p.bloodType}</span>` : ''}
            ${p.phone ? `<span class="patient-info-item">📱 ${p.phone}</span>` : ''}
            ${p.email ? `<span class="patient-info-item">✉️ ${p.email}</span>` : ''}
          </div>
          <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
            ${p.allergies ? `<span class="badge badge-danger">⚠️ Alergias: ${p.allergies}</span>` : ''}
            <span class="badge badge-success">${p.status}</span>
            ${p.doctor ? `<span class="badge badge-cyan">${p.doctor.specialty || p.doctor.name}</span>` : ''}
          </div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:12px">📋 Información clínica</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
          <span style="font-size:0.8rem;color:var(--text-muted)">Diagnóstico</span>
          <span style="font-size:0.82rem;font-weight:600">${p.diagnosis || 'Sin diagnóstico'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
          <span style="font-size:0.8rem;color:var(--text-muted)">Doctor tratante</span>
          <span style="font-size:0.82rem;font-weight:600">${p.doctor?.name || '—'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
          <span style="font-size:0.8rem;color:var(--text-muted)">Registrado</span>
          <span style="font-size:0.82rem;font-weight:600">${new Date(p.createdAt).toLocaleDateString('es-MX')}</span>
        </div>
      </div>
    </div>
  </div>
  <!-- Tabs -->
  <div class="tabs" id="expedienteTabs">
    <div class="tab active" onclick="switchExpedienteTab(this,'tabClinico')">🩺 Expediente Clínico</div>
    <div class="tab" onclick="switchExpedienteTab(this,'tabCitas')">📅 Citas</div>
    <div class="tab" onclick="switchExpedienteTab(this,'tabRecetas')">${_currentSpecialty?.prescriptionMode === 'none' ? '📋 Plan Terapéutico' : '💊 Recetas'}</div>
    <div class="tab" onclick="switchExpedienteTab(this,'tabNotas')">📝 Notas médicas</div>
  </div>

  <!-- Tab: Expediente Clínico (specialty-specific) -->
  <div id="tabClinico">
    ${_currentSpecialty ? renderVitalsFields(_doctorSpecialtyName, _parsedClinicalData) : ''}
    ${_currentSpecialty ? renderClinicalFields(_doctorSpecialtyName, _parsedClinicalData) : ''}
    <div style="display:flex;gap:10px;margin-top:12px">
      <button class="btn btn-primary" onclick="saveClinicalData('${p.id}')">💾 Guardar Expediente Clínico</button>
      <span style="font-size:0.75rem;color:var(--text-dim);display:flex;align-items:center">${_currentSpecialty ? _currentSpecialty.icon + ' ' + _doctorSpecialtyName : '🩺 General'}</span>
    </div>
  </div>

  <!-- Tab: Citas -->
  <div id="tabCitas" style="display:none">
    ${p.appointments && p.appointments.length > 0 ? `
    <div class="table-wrap"><table>
      <thead><tr><th>Fecha</th><th>Hora</th><th>Tipo</th><th>Estado</th><th>Notas</th></tr></thead>
      <tbody>
      ${p.appointments.map(a => `<tr>
        <td>${new Date(a.date).toLocaleDateString('es-MX')}</td>
        <td>${a.time}</td>
        <td>${a.type || '—'}</td>
        <td><span class="badge ${a.status === 'programada' ? 'badge-success' : a.status === 'cancelada' ? 'badge-danger' : 'badge-cyan'}">${a.status}</span></td>
        <td class="text-muted">${a.notes || a.reason || '—'}</td>
      </tr>`).join('')}
      </tbody>
    </table></div>` : `<div class="empty-state" style="padding:30px"><div class="empty-state-icon">📅</div><div class="empty-state-desc">Sin citas registradas</div></div>`}
  </div>

  <!-- Tab: Recetas / Plan -->
  <div id="tabRecetas" style="display:none">
    ${_currentSpecialty?.prescriptionMode === 'none' ?
      `<div class="card">
        <div class="card-header"><span class="card-title">📋 Plan Terapéutico</span></div>
        <div style="font-size:0.85rem;color:var(--text-light);padding:10px">
          ${_parsedClinicalData.therapeutic_plan || _parsedClinicalData.homework ?
        `<div style="margin-bottom:12px"><strong>Plan:</strong><br><span style="white-space:pre-wrap">${_parsedClinicalData.therapeutic_plan || '—'}</span></div>
             <div><strong>Tareas para el paciente:</strong><br><span style="white-space:pre-wrap">${_parsedClinicalData.homework || '—'}</span></div>` :
        'Sin plan terapéutico registrado. Completa los campos en la pestaña de Expediente Clínico.'}
        </div>
      </div>` :
      (p.prescriptions && p.prescriptions.length > 0 ? p.prescriptions.map(r => `
    <div class="card" style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="fw-700">${r.medication} ${r.dosage}</div><div style="font-size:0.8rem;color:var(--text-muted)">${r.frequency} · ${r.duration} · ${new Date(r.createdAt).toLocaleDateString('es-MX')}</div></div>
        <span class="badge ${r.active ? 'badge-success' : 'badge-muted'}">${r.active ? 'Activa' : 'Finalizada'}</span>
      </div>
    </div>`).join('') : `<div class="empty-state" style="padding:30px"><div class="empty-state-icon">💊</div><div class="empty-state-desc">Sin recetas registradas</div></div>`)}
  </div>

  <!-- Tab: Notas -->
  <div id="tabNotas" style="display:none">
    <div class="card">
      <div style="font-size:0.85rem;color:var(--text-light);white-space:pre-wrap;padding:10px">
        ${(function () {
      if (!p.medicalNotes) return 'Sin notas médicas registradas.';
      try {
        if (p.medicalNotes.trim().startsWith('{')) {
          const data = JSON.parse(p.medicalNotes);
          let html = '<div style="font-weight:600;margin-bottom:8px;color:var(--cyan)">📋 Datos clínicos estructurados:</div>';
          for (const key in data) {
            if (key === '_lastUpdated') continue;
            const label = key.replace(/_/g, ' ').toUpperCase();
            html += `<div style="margin-bottom:5px"><strong>${label}:</strong> ${data[key]}</div>`;
          }
          if (data._lastUpdated) html += `<div style="font-size:0.75rem;color:var(--text-dim);margin-top:10px">Última actualización: ${new Date(data._lastUpdated).toLocaleString('es-MX')}</div>`;
          return html;
        }
      } catch (e) { }
      return p.medicalNotes;
    })()}
      </div>
    </div>
  </div>`;

  // Init any dynamic date pickers in clinical fields
  setTimeout(() => {
    document.querySelectorAll('.flatpickr-date').forEach(el => APP.initDatePicker(el));
  }, 50);
}

// ---- Specialty helpers for patient detail ----
let _doctorSpecialtyName = '';
let _currentSpecialty = null;
let _parsedClinicalData = {};

function _initSpecialty(patient) {
  // Get the doctor's specialty
  const user = APP.liveUser;
  _doctorSpecialtyName = user?.specialty || patient?.doctor?.specialty || 'Medicina General';
  _currentSpecialty = typeof getSpecialtyConfig === 'function' ? getSpecialtyConfig(_doctorSpecialtyName) : null;
  // Parse existing clinical data from medicalNotes (JSON)
  _parsedClinicalData = {};
  try {
    if (patient.medicalNotes && patient.medicalNotes.startsWith('{')) {
      _parsedClinicalData = JSON.parse(patient.medicalNotes);
    }
  } catch (e) { /* not JSON — plain text notes */ }
}

async function saveClinicalData(patientId) {
  const data = typeof collectClinicalData === 'function' ? collectClinicalData() : {};
  // Merge with existing data
  const merged = { ..._parsedClinicalData, ...data, _lastUpdated: new Date().toISOString() };
  try {
    await API.updatePatient(patientId, { medicalNotes: JSON.stringify(merged) });
    _parsedClinicalData = merged;
    showNotification('Expediente clínico guardado exitosamente', 'success');
  } catch (err) {
    showNotification(err.message || 'Error al guardar', 'error');
  }
}

function switchExpedienteTab(tab, targetId) {
  document.querySelectorAll('#expedienteTabs .tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  ['tabClinico', 'tabCitas', 'tabRecetas', 'tabNotas'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = id === targetId ? 'block' : 'none';
  });
}

function openNewApptModalForPatient(patientId, patientName) {
  openModal('+ Nueva Cita: ' + patientName, `
    <div class="form-row form-row-2">
      <div class="form-group"><label class="form-label">Fecha</label><input class="form-control" type="text" id="apptDate" placeholder="Seleccionar fecha..." /></div>
      <div class="form-group"><label class="form-label">Hora</label><input class="form-control" type="text" id="apptTime" placeholder="Seleccionar hora..." /></div>
    </div>
    <div class="form-row form-row-2">
      <div class="form-group"><label class="form-label">Tipo</label>
        <select class="form-control" id="apptType"><option>consulta</option><option>seguimiento</option><option>primera_vez</option><option>urgencia</option></select>
      </div>
      <div class="form-group"><label class="form-label">Motivo</label><input class="form-control" id="apptReason" placeholder="Motivo..." /></div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
   <button class="btn btn-primary" onclick="submitApptForPatient('${patientId}')">Programar cita →</button>`);

  // Init Flatpickr
  setTimeout(() => {
    APP.initDatePicker("#apptDate", { defaultDate: "today" });
    APP.initTimePicker("#apptTime", { defaultDate: "09:00" });
  }, 50);
}

async function submitApptForPatient(patientId) {
  const date = document.getElementById('apptDate')?.value;
  const time = document.getElementById('apptTime')?.value;
  const type = document.getElementById('apptType')?.value;
  const reason = document.getElementById('apptReason')?.value;
  if (!date || !time) return showNotification('Fecha y hora requeridas', 'error');
  try {
    await API.createAppointment({ date, time, type, patientId, reason });
    closeModal();
    showNotification('Cita programada', 'success');
    openPatientDetail(patientId); // Refresh
  } catch (err) {
    showNotification(err.message || 'Error al crear cita', 'error');
  }
}
