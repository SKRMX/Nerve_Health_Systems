// ================================================
// NERVE — Staff Management Module
// ================================================

const STAFF_DATA = [
    { id: 1, name: 'Dr. Pedro Torres', role: 'doctor', dept: 'Medicina General', email: 'p.torres@hospital.mx', status: 'active', since: 'Ene 2024', patients: 87 },
    { id: 2, name: 'Dra. Carmen Ruiz', role: 'dept_head', dept: 'Cardiología', email: 'c.ruiz@hospital.mx', status: 'active', since: 'Mar 2022', patients: 142 },
    { id: 3, name: 'Dr. Manuel Lima', role: 'doctor', dept: 'Pediatría', email: 'm.lima@hospital.mx', status: 'active', since: 'Jun 2023', patients: 64 },
    { id: 4, name: 'Enf. Sofía Vargas', role: 'assistant', dept: 'Medicina General', email: 's.vargas@hospital.mx', status: 'active', since: 'Ago 2024', patients: 0 },
    { id: 5, name: 'Dra. Rosa Valdés', role: 'doctor', dept: 'Cirugía', email: 'r.valdes@hospital.mx', status: 'active', since: 'Ene 2023', patients: 98 },
    { id: 6, name: 'Dr. Justo Cruz', role: 'doctor', dept: 'Neurología', email: 'j.cruz@hospital.mx', status: 'inactive', since: 'Feb 2022', patients: 55 },
    { id: 7, name: 'Admin. Karla Soto', role: 'assistant', dept: 'Recepción', email: 'k.soto@hospital.mx', status: 'active', since: 'Nov 2024', patients: 0 },
];

function renderStaff() {
    const pc = document.getElementById('pageContent');
    pc.innerHTML = `
  <div class="page-header">
    <div><div class="page-title">👥 Gestión de Personal</div>
    <div class="page-subtitle">${STAFF_DATA.length} miembros del equipo</div></div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="renderDepartments()">🏢 Departamentos</button>
      <button class="btn btn-primary" onclick="openNewStaffModal()">+ Agregar personal</button>
    </div>
  </div>

  <div class="stats-grid stats-grid-4" style="margin-bottom:20px">
    ${[
            { icon: '🩺', label: 'Doctores', val: STAFF_DATA.filter(s => s.role === 'doctor').length, color: 'rgba(17,113,139,0.2)' },
            { icon: '👔', label: 'Jefes de Área', val: STAFF_DATA.filter(s => s.role === 'dept_head').length, color: 'rgba(6,207,215,0.1)' },
            { icon: '🏥', label: 'Asistentes', val: STAFF_DATA.filter(s => s.role === 'assistant').length, color: 'rgba(73,190,174,0.1)' },
            { icon: '✅', label: 'Activos', val: STAFF_DATA.filter(s => s.status === 'active').length, color: 'rgba(34,197,94,0.1)' },
        ].map(s => `<div class="stat-card">
      <div class="stat-icon" style="background:${s.color}">${s.icon}</div>
      <div class="stat-value">${s.val}</div>
      <div class="stat-label">${s.label}</div>
    </div>`).join('')}
  </div>

  <div class="card">
    <div class="card-header">
      <span class="card-title">Equipo médico</span>
      <div style="display:flex;gap:8px">
        <select class="form-control" style="width:160px" onchange="filterStaffTable(this.value)">
          <option value="">Todos los roles</option>
          <option value="doctor">Doctores</option>
          <option value="dept_head">Jefes de Área</option>
          <option value="assistant">Asistentes</option>
        </select>
        <input type="text" class="form-control" style="width:220px" placeholder="Buscar..." id="staffSearch" oninput="filterStaffTable('')" />
      </div>
    </div>
    <div class="table-wrap" id="staffTableArea"></div>
  </div>`;
    renderStaffTable(STAFF_DATA);
}

function filterStaffTable(role) {
    const search = document.getElementById('staffSearch')?.value.toLowerCase() || '';
    const filtered = STAFF_DATA.filter(s =>
        (!role || s.role === role) &&
        (!search || s.name.toLowerCase().includes(search) || s.dept.toLowerCase().includes(search))
    );
    renderStaffTable(filtered);
}

function renderStaffTable(data) {
    const area = document.getElementById('staffTableArea');
    if (!area) return;
    const roleLabel = { doctor: '🩺 Doctor', dept_head: '👔 Jefe de Área', assistant: '🏥 Asistente' };
    area.innerHTML = `<table>
    <thead><tr><th>Miembro</th><th>Rol</th><th>Departamento</th><th>Email</th><th>Miembro desde</th><th>Pacientes</th><th>Estado</th><th>Acciones</th></tr></thead>
    <tbody>
    ${data.map(s => `<tr>
      <td><div class="avatar-row">
        <div class="avatar">${s.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</div>
        <div class="cell-primary">${s.name}</div>
      </div></td>
      <td><span class="badge ${s.role === 'doctor' ? 'badge-cyan' : s.role === 'dept_head' ? 'badge-mint' : 'badge-muted'}">${roleLabel[s.role] || s.role}</span></td>
      <td class="text-muted">${s.dept}</td>
      <td class="text-muted fs-xs">${s.email}</td>
      <td class="text-muted">${s.since}</td>
      <td>${s.patients > 0 ? s.patients : '—'}</td>
      <td><span class="badge ${s.status === 'active' ? 'badge-success' : 'badge-warning'}">${s.status === 'active' ? 'Activo' : 'Inactivo'}</span></td>
      <td><div style="display:flex;gap:6px">
        <button class="btn btn-secondary btn-sm" onclick="openEditStaffModal(${s.id})">✏️ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="this.closest('tr').style.opacity='0.4'">Suspender</button>
      </div></td>
    </tr>`).join('')}
    </tbody>
  </table>`;
}

function openNewStaffModal() {
    openModal('➕ Agregar Personal', `
    <div class="form-row form-row-2">
      <div class="form-group"><label class="form-label">Nombre completo</label><input class="form-control" placeholder="Dr. / Dra. ..." /></div>
      <div class="form-group"><label class="form-label">Rol</label>
        <select class="form-control"><option>Doctor</option><option>Jefe de Departamento</option><option>Asistente</option></select>
      </div>
    </div>
    <div class="form-row form-row-2">
      <div class="form-group"><label class="form-label">Departamento</label>
        <select class="form-control"><option>Medicina General</option><option>Cardiología</option><option>Pediatría</option><option>Cirugía</option><option>Neurología</option></select>
      </div>
      <div class="form-group"><label class="form-label">Cédula Profesional</label><input class="form-control" placeholder="12345678" /></div>
    </div>
    <div class="form-row form-row-2">
      <div class="form-group"><label class="form-label">Correo institucional</label><input class="form-control" type="email" placeholder="doctor@hospital.mx" /></div>
      <div class="form-group"><label class="form-label">Teléfono de contacto</label><input class="form-control" placeholder="+52 55 ..." /></div>
    </div>
    <hr class="divider"/>
    <div class="form-group"><label class="form-label" style="margin-bottom:10px">Permisos de acceso</label>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${['Ver expedientes de sus pacientes', 'Crear/editar consultas', 'Generar recetas', 'Ver reportes de su área', 'Gestionar su agenda'].map(p => `
        <label style="display:flex;align-items:center;gap:8px;font-size:0.84rem;cursor:pointer">
          <input type="checkbox" checked style="accent-color:var(--cyan-mid)"> ${p}
        </label>`).join('')}
      </div>
    </div>`,
        `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
   <button class="btn btn-primary" onclick="closeModal()">Enviar invitación →</button>`);
}

function openEditStaffModal(id) {
    const s = STAFF_DATA.find(x => x.id === id);
    if (!s) return;
    openModal(`✏️ Editar: ${s.name}`, `
    <div class="form-row form-row-2">
      <div class="form-group"><label class="form-label">Nombre</label><input class="form-control" value="${s.name}" /></div>
      <div class="form-group"><label class="form-label">Departamento</label>
        <select class="form-control"><option ${s.dept === 'Medicina General' ? 'selected' : ''}>Medicina General</option><option ${s.dept === 'Cardiología' ? 'selected' : ''}>Cardiología</option></select>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Email</label><input class="form-control" value="${s.email}" /></div>
    <div class="form-group"><label class="form-label">Estado</label>
      <select class="form-control"><option ${s.status === 'active' ? 'selected' : ''}>Activo</option><option ${s.status !== 'active' ? 'selected' : ''}>Inactivo</option></select>
    </div>`,
        `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
   <button class="btn btn-primary" onclick="closeModal()">Guardar cambios</button>`);
}
