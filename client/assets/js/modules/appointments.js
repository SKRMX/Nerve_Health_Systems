// ================================================
// NERVE — Appointments Module
// ================================================

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

let _calView = { year: 2026, month: 1 }; // Feb 2026

const APPOINTMENTS = [
    { date: '2026-02-28', time: '09:00', patient: 'María García L.', type: 'Consulta General', status: 'confirmed', dr: 'Dr. González' },
    { date: '2026-02-28', time: '09:45', patient: 'Carlos Mendoza R.', type: 'Seguimiento', status: 'confirmed', dr: 'Dr. González' },
    { date: '2026-02-28', time: '10:30', patient: 'Ana Ruiz J.', type: 'Primera vez', status: 'pending', dr: 'Dr. González' },
    { date: '2026-02-28', time: '11:15', patient: 'Pedro Hernández T.', type: 'Revisión', status: 'confirmed', dr: 'Dr. González' },
    { date: '2026-03-02', time: '09:00', patient: 'Ana L. Martínez', type: 'Consulta General', status: 'confirmed', dr: 'Dr. González' },
    { date: '2026-03-02', time: '10:00', patient: 'Roberto Soto M.', type: 'Seguimiento', status: 'pending', dr: 'Dr. González' },
    { date: '2026-03-05', time: '11:00', patient: 'Laura Vega T.', type: 'Control', status: 'confirmed', dr: 'Dr. González' },
    { date: '2026-03-10', time: '09:30', patient: 'José Castillo D.', type: 'Post-quirúrgico', status: 'confirmed', dr: 'Dr. González' },
];

function renderAppointments() {
    const pc = document.getElementById('pageContent');
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
            <button class="btn btn-secondary btn-sm" onclick="_calView.month=1;_calView.year=2026;renderAppointments()">Hoy</button>
            <button class="btn btn-secondary btn-sm" onclick="_calView.month++;if(_calView.month>11){_calView.month=0;_calView.year++};renderAppointments()">▶</button>
          </div>
        </div>
        <div class="cal-grid">
          ${DAYS_SHORT.map(d => `<div class="cal-weekday">${d}</div>`).join('')}
          ${buildCalendarDays()}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">📋 Citas del mes</span><span class="badge badge-cyan">${APPOINTMENTS.length} total</span></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Fecha / Hora</th><th>Paciente</th><th>Tipo</th><th>Estado</th><th>Acción</th></tr></thead>
          <tbody>
          ${APPOINTMENTS.slice(0, 8).map(a => `<tr>
            <td><div class="cell-primary">${a.date.split('-').reverse().join('/')} ${a.time}</div></td>
            <td><div class="avatar-row"><div class="avatar sm">${a.patient.split(' ').map(x => x[0]).slice(0, 2).join('')}</div>${a.patient}</div></td>
            <td class="text-muted">${a.type}</td>
            <td><span class="badge ${a.status === 'confirmed' ? 'badge-success' : 'badge-warning'}">${a.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}</span></td>
            <td><div style="display:flex;gap:6px">
              <button class="btn btn-primary btn-sm" onclick="navigate('patients')">Iniciar</button>
              <button class="btn btn-danger btn-sm" onclick="this.closest('tr').style.opacity='0.4'">Cancelar</button>
            </div></td>
          </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
    </div>
    <div>
      <div class="card" style="margin-bottom:20px">
        <div class="card-header"><span class="card-title">📊 Resumen</span></div>
        <div id="apptDonut"></div>
        <div style="margin-top:16px">
          ${[{ l: 'Confirmadas', v: 6, c: 'var(--success)' }, { l: 'Pendientes', v: 2, c: 'var(--warning)' }, { l: 'Canceladas', v: 0, c: 'var(--danger)' }].map(s => `
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
            { label: 'Confirmadas', value: 6, color: 'var(--success)' },
            { label: 'Pendientes', value: 2, color: 'var(--warning)' },
            { label: 'Canceladas', value: 0, color: 'var(--text-dim)' },
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
        const dayApts = APPOINTMENTS.filter(a => a.date === dateStr);
        html += `<div class="cal-day ${isToday ? 'today' : ''}" onclick="calDayClick('${dateStr}')">
      <div class="cal-date">${d}</div>
      ${dayApts.slice(0, 2).map(a => `<div class="cal-event ${a.status}">${a.time} ${a.patient.split(' ')[0]}</div>`).join('')}
      ${dayApts.length > 2 ? `<div style="font-size:0.6rem;color:var(--text-dim);padding:0 4px">+${dayApts.length - 2} más</div>` : ''}
    </div>`;
    }
    return html;
}

function calDayClick(dateStr) {
    const dayApts = APPOINTMENTS.filter(a => a.date === dateStr);
    if (dayApts.length === 0) { openNewApptModal(dateStr); return; }
    openModal(`📅 Citas del ${dateStr.split('-').reverse().join('/')}`,
        dayApts.map(a => `<div style="display:flex;align-items:center;gap:12px;padding:10px;background:var(--dark-4);border-radius:8px;margin-bottom:8px;border-left:3px solid ${a.status === 'confirmed' ? 'var(--cyan-mid)' : 'var(--warning)'}">
      <div style="font-weight:700;color:var(--cyan);width:45px">${a.time}</div>
      <div style="flex:1"><div style="font-weight:600">${a.patient}</div><div style="font-size:0.78rem;color:var(--text-muted)">${a.type}</div></div>
      <span class="badge ${a.status === 'confirmed' ? 'badge-success' : 'badge-warning'}">${a.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}</span>
    </div>`).join('') + `<button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:8px" onclick="closeModal();openNewApptModal('${dateStr}')">+ Agregar cita en esta fecha</button>`,
        `<button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>`);
}

function toggleCalView() { renderAppointments(); }

function openNewApptModal(date = '') {
    openModal('+ Nueva Cita', `
    <div class="form-row form-row-2">
      <div class="form-group"><label class="form-label">Fecha</label><input class="form-control" type="date" value="${date || new Date().toISOString().split('T')[0]}" /></div>
      <div class="form-group"><label class="form-label">Hora</label><input class="form-control" type="time" value="09:00" /></div>
    </div>
    <div class="form-group"><label class="form-label">Paciente</label>
      <select class="form-control">
        <option>-- Seleccionar paciente --</option>
        ${PATIENTS_DATA.map(p => `<option>${p.name}</option>`).join('')}
        <option>+ Nuevo paciente</option>
      </select>
    </div>
    <div class="form-row form-row-2">
      <div class="form-group"><label class="form-label">Tipo de consulta</label>
        <select class="form-control"><option>Primera vez</option><option>Seguimiento</option><option>Urgencias</option><option>Control</option></select>
      </div>
      <div class="form-group"><label class="form-label">Duración</label>
        <select class="form-control"><option>30 min</option><option>45 min</option><option>60 min</option><option>90 min</option></select>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Notas previas</label><textarea class="form-control" placeholder="Motivo de consulta preliminar..."></textarea></div>
    <div class="form-group">
      <label class="form-label">Recordatorios automáticos</label>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        ${['WhatsApp 24h antes', 'Email 48h antes', 'SMS el día de'].map(r => `<label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;cursor:pointer"><input type="checkbox" checked style="accent-color:var(--cyan-mid)"> ${r}</label>`).join('')}
      </div>
    </div>`,
        `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
   <button class="btn btn-primary" onclick="closeModal()">Programar cita →</button>`);
}
