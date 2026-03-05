// ================================================
// NERVE — Appointments Module (API-Connected)
// ================================================

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

let _calView = { year: new Date().getFullYear(), month: new Date().getMonth() };
let _appointments = [];

async function renderAppointments() {
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `<div class="page-header">
    <div><div class="page-title">📅 Agenda</div><div class="page-subtitle">Cargando citas...</div></div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="toggleCalView()">📋 Lista</button>
      <button class="btn btn-primary" onclick="openNewApptModal()">+ Nueva cita</button>
    </div>
  </div>
  <div class="card" style="padding:40px;text-align:center;color:var(--text-muted)">⏳ Cargando agenda...</div>`;

  try {
    const res = await API.getAppointments();
    _appointments = res.data || [];
  } catch (err) {
    _appointments = [];
  }

  const confirmed = _appointments.filter(a => a.status === 'completada' || a.status === 'programada').length;
  const pending = _appointments.filter(a => a.status === 'programada').length;
  const cancelled = _appointments.filter(a => a.status === 'cancelada').length;

  pc.innerHTML = `
  <div class="page-header">
    <div><div class="page-title">📅 Agenda</div><div class="page-subtitle">Gestión de citas y recordatorios</div></div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="toggleCalView()">📋 Lista</button>
      <button class="btn btn-primary" onclick="openNewApptModal()">+ Nueva cita</button>
    </div>
  </div>

  <div class="content-grid content-grid-2-1">
    <div>
      <div class="card" style="margin-bottom:20px">
        <div class="cal-header">
          <div class="cal-month">${MONTHS[_calView.month]} ${_calView.year}</div>
          <div class="cal-nav">
            <button class="btn btn-secondary btn-sm" onclick="_calView.month--;if(_calView.month<0){_calView.month=11;_calView.year--};renderAppointments()">◀</button>
            <button class="btn btn-secondary btn-sm" onclick="_calView.month=new Date().getMonth();_calView.year=new Date().getFullYear();renderAppointments()">Hoy</button>
            <button class="btn btn-secondary btn-sm" onclick="_calView.month++;if(_calView.month>11){_calView.month=0;_calView.year++};renderAppointments()">▶</button>
          </div>
        </div>
        <div class="cal-grid">
          ${DAYS_SHORT.map(d => `<div class="cal-weekday">${d}</div>`).join('')}
          ${buildCalendarDays()}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">📋 Citas del mes</span><span class="badge badge-cyan">${_appointments.length} total</span></div>
        <div class="table-wrap">${_appointments.length === 0 ?
      `<div class="empty-state" style="padding:40px"><div class="empty-state-icon">📅</div><div class="empty-state-title">Sin citas</div><div class="empty-state-desc">Aún no hay citas registradas. Crea la primera con el botón "+ Nueva cita".</div></div>` :
      `<table>
          <thead><tr><th>Fecha / Hora</th><th>Paciente</th><th>Tipo</th><th>Estado</th><th>Acción</th></tr></thead>
          <tbody>
          ${_appointments.slice(0, 12).map(a => `<tr>
            <td><div class="cell-primary">${new Date(a.date).toLocaleDateString('es-MX')} ${a.time}</div></td>
            <td><div class="avatar-row"><div class="avatar sm">${(a.patient?.name || 'NN').split(' ').map(x => x[0]).slice(0, 2).join('')}</div>${a.patient?.name || 'Sin paciente'}</div></td>
            <td class="text-muted">${a.type || '—'}</td>
            <td><span class="badge ${a.status === 'programada' ? 'badge-success' : a.status === 'cancelada' ? 'badge-danger' : a.status === 'completada' ? 'badge-cyan' : 'badge-warning'}">${a.status}</span></td>
            <td><div style="display:flex;gap:6px">
              ${a.status !== 'cancelada' && a.status !== 'completada' ? `
              <button class="btn btn-primary btn-sm" onclick="completeAppt('${a.id}')">Completar</button>
              <button class="btn btn-danger btn-sm" onclick="cancelAppt('${a.id}')">Cancelar</button>` : '—'}
            </div></td>
          </tr>`).join('')}
          </tbody>
        </table>`}
        </div>
      </div>
    </div>
    <div>
      <div class="card" style="margin-bottom:20px">
        <div class="card-header"><span class="card-title">📊 Resumen</span></div>
        <div id="apptDonut"></div>
        <div style="margin-top:16px">
          ${[{ l: 'Programadas', v: pending, c: 'var(--success)' }, { l: 'Completadas', v: _appointments.filter(a => a.status === 'completada').length, c: 'var(--cyan-mid)' }, { l: 'Canceladas', v: cancelled, c: 'var(--danger)' }].map(s => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:0.82rem;display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:${s.c};display:inline-block"></span>${s.l}</span>
            <strong>${s.v}</strong>
          </div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">🔔 Recordatorios</span></div>
        <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:14px">Configura recordatorios automáticos para reducir el ausentismo.</p>
        ${[
      { label: 'Recordatorio por WhatsApp', sub: '24h antes de la cita', active: true },
      { label: 'Recordatorio por Email', sub: '48h antes de la cita', active: true },
      { label: 'Confirmación del paciente', sub: 'El paciente confirma vía link', active: true },
      { label: 'Recordatorio 1 hora antes', sub: 'Mensaje final de confirmación', active: false },
    ].map(r => `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="flex:1">
            <div style="font-size:0.84rem;font-weight:600">${r.label}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">${r.sub}</div>
          </div>
          <div style="position:relative;width:40px;height:22px;cursor:pointer" onclick="this.firstElementChild.checked=!this.firstElementChild.checked;this.querySelector('span').style.background=this.firstElementChild.checked?'var(--cyan-mid)':'var(--dark-5)'">
            <input type="checkbox" ${r.active ? 'checked' : ''} style="opacity:0;position:absolute">
            <span style="position:absolute;inset:0;border-radius:11px;background:${r.active ? 'var(--cyan-mid)' : 'var(--dark-5)'};transition:.3s"></span>
            <span style="position:absolute;top:3px;left:${r.active ? '21' : '3'}px;width:16px;height:16px;border-radius:50%;background:#fff;transition:.3s"></span>
          </div>
        </div>`).join('')}
      </div>
    </div>
  </div>`;

  setTimeout(() => {
    renderDonutChart('apptDonut', [
      { label: 'Programadas', value: Math.max(pending, 0), color: 'var(--success)' },
      { label: 'Completadas', value: Math.max(_appointments.filter(a => a.status === 'completada').length, 0), color: 'var(--cyan-mid)' },
      { label: 'Canceladas', value: Math.max(cancelled, 0), color: 'var(--text-dim)' },
    ]);
  }, 60);
}

function buildCalendarDays() {
  const { year, month } = _calView;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date(); const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  let html = '';
  for (let i = 0; i < firstDay; i++) {
    const prevDay = new Date(year, month, -firstDay + i + 1);
    html += `<div class="cal-day other-month"><div class="cal-date">${prevDay.getDate()}</div></div>`;
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;
    const dayApts = _appointments.filter(a => {
      const aDate = new Date(a.date).toISOString().split('T')[0];
      return aDate === dateStr;
    });
    html += `<div class="cal-day ${isToday ? 'today' : ''}" onclick="calDayClick('${dateStr}')">
      <div class="cal-date">${d}</div>
      ${dayApts.slice(0, 2).map(a => `<div class="cal-event ${a.status === 'programada' ? 'confirmed' : a.status}">${a.time} ${(a.patient?.name || '').split(' ')[0]}</div>`).join('')}
      ${dayApts.length > 2 ? `<div style="font-size:0.6rem;color:var(--text-dim);padding:0 4px">+${dayApts.length - 2} más</div>` : ''}
    </div>`;
  }
  return html;
}

function calDayClick(dateStr) {
  const dayApts = _appointments.filter(a => new Date(a.date).toISOString().split('T')[0] === dateStr);
  if (dayApts.length === 0) { openNewApptModal(dateStr); return; }
  openModal(`📅 Citas del ${dateStr.split('-').reverse().join('/')}`,
    dayApts.map(a => `<div style="display:flex;align-items:center;gap:12px;padding:10px;background:var(--dark-4);border-radius:8px;margin-bottom:8px;border-left:3px solid ${a.status === 'programada' ? 'var(--cyan-mid)' : 'var(--warning)'}">
      <div style="font-weight:700;color:var(--cyan);width:45px">${a.time}</div>
      <div style="flex:1"><div style="font-weight:600">${a.patient?.name || 'Sin paciente'}</div><div style="font-size:0.78rem;color:var(--text-muted)">${a.type || ''}</div></div>
      <span class="badge ${a.status === 'programada' ? 'badge-success' : 'badge-warning'}">${a.status}</span>
    </div>`).join('') + `<button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:8px" onclick="closeModal();openNewApptModal('${dateStr}')">+ Agregar cita en esta fecha</button>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>`);
}

function toggleCalView() { renderAppointments(); }

let _apptPatientsList = [];

async function openNewApptModal(date = '') {
  // Load patients list for autocomplete
  _apptPatientsList = [];
  try {
    const res = await API.getPatients();
    _apptPatientsList = res.data || [];
  } catch (e) { /* empty list */ }

  openModal('+ Nueva Cita', `
    <div class="form-row form-row-2">
      <div class="form-group"><label class="form-label">Fecha</label><input class="form-control" type="date" id="apptDate" value="${date || new Date().toISOString().split('T')[0]}" /></div>
      <div class="form-group"><label class="form-label">Hora</label><input class="form-control" type="time" id="apptTime" value="09:00" /></div>
    </div>
    <div class="form-group"><label class="form-label">Paciente</label>
      <input class="form-control" id="apptPatientInput" list="apptPatientList" placeholder="Escribe el nombre o selecciona uno existente..." autocomplete="off" />
      <datalist id="apptPatientList">
        ${_apptPatientsList.map(p => `<option value="${p.name}" data-id="${p.id}">`).join('')}
      </datalist>
      <input type="hidden" id="apptPatientId" />
      <div style="font-size:0.73rem;color:var(--text-dim);margin-top:4px">💡 Si el paciente no está registrado, escribe su nombre y se creará automáticamente.</div>
    </div>
    <div class="form-row form-row-2">
      <div class="form-group"><label class="form-label">Tipo de consulta</label>
        <select class="form-control" id="apptType"><option>consulta</option><option>seguimiento</option><option>primera_vez</option><option>urgencia</option></select>
      </div>
      <div class="form-group"><label class="form-label">Duración</label>
        <select class="form-control"><option>30 min</option><option>45 min</option><option>60 min</option><option>90 min</option></select>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Motivo / Notas</label><textarea class="form-control" id="apptReason" placeholder="Motivo de consulta preliminar..."></textarea></div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
   <button class="btn btn-primary" id="btnCreateAppt" onclick="submitNewAppt()">Programar cita →</button>`);

  // Wire up the input to resolve patient ID
  setTimeout(() => {
    const input = document.getElementById('apptPatientInput');
    if (input) input.addEventListener('input', () => {
      const match = _apptPatientsList.find(p => p.name.toLowerCase() === input.value.toLowerCase());
      document.getElementById('apptPatientId').value = match ? match.id : '';
    });
  }, 50);
}

async function submitNewAppt() {
  const date = document.getElementById('apptDate')?.value;
  const time = document.getElementById('apptTime')?.value;
  const patientName = document.getElementById('apptPatientInput')?.value.trim();
  let patientId = document.getElementById('apptPatientId')?.value;
  const type = document.getElementById('apptType')?.value;
  const reason = document.getElementById('apptReason')?.value;

  if (!date || !time || !patientName) {
    return showNotification('Fecha, hora y paciente son requeridos', 'error');
  }

  const btn = document.getElementById('btnCreateAppt');
  if (btn) { btn.disabled = true; btn.textContent = 'Creando...'; }

  try {
    // If no existing patient matched, create one on the fly
    if (!patientId) {
      const newPat = await API.createPatient({ name: patientName });
      patientId = newPat.id;
      showNotification(`Paciente "${patientName}" registrado automáticamente`, 'success');
    }

    await API.createAppointment({ date, time, type, patientId, reason });
    closeModal();
    showNotification('Cita programada exitosamente', 'success');
    renderAppointments();
  } catch (err) {
    showNotification(err.message || 'Error al crear cita', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Programar cita →'; }
  }
}

async function cancelAppt(id) {
  try {
    await API.updateAppointment(id, { status: 'cancelada' });
    showNotification('Cita cancelada', 'warning');
    renderAppointments();
  } catch (err) {
    showNotification(err.message || 'Error al cancelar', 'error');
  }
}

async function completeAppt(id) {
  try {
    await API.updateAppointment(id, { status: 'completada' });
    showNotification('Cita completada', 'success');
    renderAppointments();
  } catch (err) {
    showNotification(err.message || 'Error al completar', 'error');
  }
}
