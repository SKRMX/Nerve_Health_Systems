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
        <input type="text" class="form-control" style="width:220px" placeholder="Buscar..." id="staffSearch" oninput="_debouncedFilterStaffTable('')" />
      </div>
    </div>
    <div class="table-wrap" id="staffTableArea"></div>
  </div>`;
  renderStaffTable(STAFF_DATA);
}

const _debouncedFilterStaffTable = APP.debounce((role) => filterStaffTable(role), 300);

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
        <button class="btn btn-danger btn-sm" onclick="showNotification('Usuario suspendido temporalmente','warning');this.closest('tr').style.opacity='0.4'">Suspender</button>
      </div></td>
    </tr>`).join('')}
    </tbody>
  </table>`;
}

function openNewStaffModal() {
  openModal('➕ Agregar Personal', `
    <div class="form-row form-row-2">
      <div class="form-group"><label class="form-label">Nombre completo</label><input class="form-control" id="newStaffName" placeholder="Dr. / Dra. ..." /></div>
      <div class="form-group"><label class="form-label">Rol</label>
        <select class="form-control" id="newStaffRole"><option value="doctor">Doctor</option><option value="dept_head">Jefe de Departamento</option><option value="asistente">Asistente</option></select>
      </div>
    </div>
    <div class="form-row form-row-2">
      <div class="form-group"><label class="form-label">Especialidad</label><input class="form-control" id="newStaffSpecialty" placeholder="Ej. Cardiología" /></div>
      <div class="form-group"><label class="form-label">Cédula Profesional</label><input class="form-control" id="newStaffCedula" placeholder="12345678" /></div>
    </div>
    <div class="form-row form-row-2">
      <div class="form-group"><label class="form-label">Correo institucional</label><input class="form-control" type="email" id="newStaffEmail" placeholder="doctor@hospital.mx" /></div>
      <div class="form-group"><label class="form-label">Teléfono de contacto</label><input class="form-control" id="newStaffPhone" placeholder="+52 55 ..." /></div>
    </div>
    <hr class="divider"/>
    <div class="form-row form-row-2">
      <div class="form-group"><label class="form-label">🔑 Contraseña</label><input class="form-control" type="password" id="newStaffPass" placeholder="Mínimo 6 caracteres" /></div>
      <div class="form-group"><label class="form-label">🔑 Confirmar contraseña</label><input class="form-control" type="password" id="newStaffPassConfirm" placeholder="Repite la contraseña" /></div>
    </div>
    <div style="background:rgba(6,207,215,0.08);border:1px solid rgba(6,207,215,0.25);border-radius:10px;padding:12px 16px;margin-top:6px;font-size:0.82rem;color:var(--text-light)">
      💡 <strong>Tip:</strong> Después de crear la cuenta, podrás compartir el correo y contraseña directamente con el miembro del personal por mensaje o email.
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
   <button class="btn btn-primary" id="btnCreateStaff" onclick="submitNewStaff()">Crear usuario ✓</button>`);
}

async function submitNewStaff() {
  const name = document.getElementById('newStaffName')?.value.trim();
  const email = document.getElementById('newStaffEmail')?.value.trim();
  const role = document.getElementById('newStaffRole')?.value;
  const specialty = document.getElementById('newStaffSpecialty')?.value.trim();
  const phone = document.getElementById('newStaffPhone')?.value.trim();
  const pass = document.getElementById('newStaffPass')?.value;
  const passConfirm = document.getElementById('newStaffPassConfirm')?.value;

  if (!name || !email || !pass) {
    return showNotification('Nombre, correo y contraseña son obligatorios', 'error');
  }
  if (pass.length < 6) {
    return showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
  }
  if (pass !== passConfirm) {
    return showNotification('Las contraseñas no coinciden', 'error');
  }

  const btn = document.getElementById('btnCreateStaff');
  if (btn) { btn.disabled = true; btn.textContent = 'Creando...'; }

  try {
    const res = await API.createUser({ name, email, password: pass, role, specialty, phone });
    closeModal();
    // Show success modal with the credentials to copy
    openModal('✅ Usuario Creado Exitosamente', `
      <div style="text-align:center;padding:10px 0 6px">
        <div style="font-size:3rem;margin-bottom:8px">🎉</div>
        <p style="font-size:0.95rem;margin-bottom:18px;color:var(--text-light)">Comparte estas credenciales con <strong>${res.user.name}</strong> para que pueda iniciar sesión:</p>
        <div style="background:var(--bg-primary);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:18px 20px;text-align:left;font-family:monospace;font-size:0.88rem;line-height:1.8">
          <div>📧 <strong>Correo:</strong> ${res.user.email}</div>
          <div>🔑 <strong>Contraseña:</strong> ${pass}</div>
          <div>🏷️ <strong>Rol:</strong> ${res.user.role}</div>
        </div>
        <button class="btn btn-secondary" style="margin-top:16px" onclick="navigator.clipboard.writeText('Correo: ${res.user.email}\\nContraseña: ${pass}');showNotification('Credenciales copiadas al portapapeles','success')">📋 Copiar credenciales</button>
      </div>`,
      `<button class="btn btn-primary" onclick="closeModal();renderStaff()">Entendido</button>`);
  } catch (err) {
    showNotification(err.message || 'Error al crear usuario', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Crear usuario ✓'; }
  }
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
