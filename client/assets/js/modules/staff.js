// ================================================
// NERVE — Staff Management Module (API-Connected)
// ================================================

let _staffData = [];
let _staffSearch = '';
let _staffRoleFilter = '';

async function renderStaff() {
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `<div class="page-header">
    <div><div class="page-title">👥 Gestión de Personal</div>
    <div class="page-subtitle">Cargando...</div></div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="renderDepartments()">🏢 Departamentos</button>
      <button class="btn btn-primary" onclick="openNewStaffModal()">+ Agregar personal</button>
    </div>
  </div>
  <div class="card"><div class="table-wrap" style="padding:40px;text-align:center;color:var(--text-muted)">⏳ Cargando personal...</div></div>`;

  try {
    const res = await API.getUsers();
    _staffData = res.data || [];
  } catch (err) {
    pc.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Error al cargar personal</div><div class="empty-state-desc">${err.message}</div></div>`;
    return;
  }

  const roleCount = (r) => _staffData.filter(s => s.role === r).length;

  pc.innerHTML = `
  <div class="page-header">
    <div><div class="page-title">👥 Gestión de Personal</div>
    <div class="page-subtitle">${_staffData.length} miembros del equipo</div></div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="renderDepartments()">🏢 Departamentos</button>
      <button class="btn btn-primary" onclick="openNewStaffModal()">+ Agregar personal</button>
    </div>
  </div>

  <div class="stats-grid stats-grid-4" style="margin-bottom:20px">
    ${[
      { icon: '🩺', label: 'Doctores', val: roleCount('doctor'), color: 'rgba(17,113,139,0.2)' },
      { icon: '👔', label: 'Jefes de Área', val: roleCount('dept_head'), color: 'rgba(6,207,215,0.1)' },
      { icon: '🏥', label: 'Asistentes', val: roleCount('asistente'), color: 'rgba(73,190,174,0.1)' },
      { icon: '✅', label: 'Activos', val: _staffData.filter(s => s.active).length, color: 'rgba(34,197,94,0.1)' },
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
        <select class="form-control" style="width:160px" onchange="_staffRoleFilter=this.value;renderStaffTable()">
          <option value="">Todos los roles</option>
          <option value="doctor">Doctores</option>
          <option value="dept_head">Jefes de Área</option>
          <option value="asistente">Asistentes</option>
          <option value="org_owner">Dueños</option>
        </select>
        <input type="text" class="form-control" style="width:220px" placeholder="Buscar..." id="staffSearch" oninput="_staffSearch=this.value;_debouncedStaffFilter()" />
      </div>
    </div>
    <div class="table-wrap" id="staffTableArea"></div>
  </div>`;
  renderStaffTable();
}

const _debouncedStaffFilter = APP.debounce(() => renderStaffTable(), 300);

function renderStaffTable() {
  const search = _staffSearch.toLowerCase();
  const filtered = _staffData.filter(s =>
    (!_staffRoleFilter || s.role === _staffRoleFilter) &&
    (!search || s.name.toLowerCase().includes(search) || s.email.toLowerCase().includes(search) || (s.specialty || '').toLowerCase().includes(search))
  );
  const area = document.getElementById('staffTableArea');
  if (!area) return;

  const roleLabel = { doctor: '🩺 Doctor', dept_head: '👔 Jefe de Área', asistente: '🏥 Asistente', org_owner: '👑 Dueño', superadmin: '⚡ SuperAdmin' };

  if (filtered.length === 0) {
    area.innerHTML = `<div class="empty-state" style="padding:40px"><div class="empty-state-icon">🔍</div><div class="empty-state-title">Sin resultados</div><div class="empty-state-desc">No se encontró personal con ese criterio.</div></div>`;
    return;
  }

  area.innerHTML = `<table>
    <thead><tr><th>Miembro</th><th>Rol</th><th>Especialidad</th><th>Email</th><th>Miembro desde</th><th>Pacientes</th><th>Estado</th><th>Acciones</th></tr></thead>
    <tbody>
    ${filtered.map(s => `<tr>
      <td><div class="avatar-row">
        <div class="avatar">${s.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</div>
        <div class="cell-primary">${s.name}</div>
      </div></td>
      <td><span class="badge ${s.role === 'doctor' ? 'badge-cyan' : s.role === 'dept_head' ? 'badge-mint' : s.role === 'org_owner' ? 'badge-success' : 'badge-muted'}">${roleLabel[s.role] || s.role}</span></td>
      <td class="text-muted">${s.specialty || '—'}</td>
      <td class="text-muted fs-xs">${s.email}</td>
      <td class="text-muted">${new Date(s.createdAt).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}</td>
      <td>${s._count?.patients > 0 ? s._count.patients : '—'}</td>
      <td><span class="badge ${s.active ? 'badge-success' : 'badge-warning'}">${s.active ? 'Activo' : 'Inactivo'}</span></td>
      <td><div style="display:flex;gap:6px">
        <button class="btn btn-secondary btn-sm" onclick="openEditStaffModal('${s.id}')">✏️ Editar</button>
        <button class="btn ${s.active ? 'btn-danger' : 'btn-primary'} btn-sm" onclick="toggleStaffActive('${s.id}', ${!s.active})">${s.active ? 'Suspender' : 'Activar'}</button>
      </div></td>
    </tr>`).join('')}
    </tbody>
  </table>`;
}

async function toggleStaffActive(id, active) {
  try {
    await API.updateUser(id, { active });
    showNotification(active ? 'Usuario reactivado' : 'Usuario suspendido', active ? 'success' : 'warning');
    renderStaff();
  } catch (err) {
    showNotification(err.message || 'Error al actualizar', 'error');
  }
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
      <div class="form-group"><label class="form-label">Especialidad</label>
        <select class="form-control" id="newStaffSpecialty">
          <option value="">-- Seleccionar especialidad --</option>
          ${typeof getSpecialtyList === 'function' ? getSpecialtyList().map(s => `<option value="${s.name}">${s.icon} ${s.name}</option>`).join('') : '<option>Medicina General</option>'}
        </select>
      </div>
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
  const s = _staffData.find(x => x.id === id);
  if (!s) return;
  openModal(`✏️ Editar: ${s.name}`, `
    <div class="form-row form-row-2">
      <div class="form-group"><label class="form-label">Nombre</label><input class="form-control" id="editStaffName" value="${s.name}" /></div>
      <div class="form-group"><label class="form-label">Rol</label>
        <select class="form-control" id="editStaffRole">
          <option value="doctor" ${s.role === 'doctor' ? 'selected' : ''}>Doctor</option>
          <option value="dept_head" ${s.role === 'dept_head' ? 'selected' : ''}>Jefe de Departamento</option>
          <option value="asistente" ${s.role === 'asistente' ? 'selected' : ''}>Asistente</option>
          <option value="org_owner" ${s.role === 'org_owner' ? 'selected' : ''}>Dueño</option>
        </select>
      </div>
    </div>
    <div class="form-row form-row-2">
      <div class="form-group"><label class="form-label">Especialidad</label>
        <select class="form-control" id="editStaffSpecialty">
          <option value="">-- Seleccionar --</option>
          ${typeof getSpecialtyList === 'function' ? getSpecialtyList().map(sp => `<option value="${sp.name}" ${s.specialty === sp.name ? 'selected' : ''}>${sp.icon} ${sp.name}</option>`).join('') : ''}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Teléfono</label><input class="form-control" id="editStaffPhone" value="${s.phone || ''}" /></div>
    </div>
    <div class="form-group"><label class="form-label">Email</label><input class="form-control" value="${s.email}" disabled style="opacity:0.6" /></div>
    <div class="form-group"><label class="form-label">Estado</label>
      <select class="form-control" id="editStaffActive">
        <option value="true" ${s.active ? 'selected' : ''}>Activo</option>
        <option value="false" ${!s.active ? 'selected' : ''}>Inactivo</option>
      </select>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
   <button class="btn btn-primary" onclick="submitEditStaff('${s.id}')">Guardar cambios</button>`);
}

async function submitEditStaff(id) {
  const name = document.getElementById('editStaffName')?.value.trim();
  const role = document.getElementById('editStaffRole')?.value;
  const specialty = document.getElementById('editStaffSpecialty')?.value.trim();
  const phone = document.getElementById('editStaffPhone')?.value.trim();
  const active = document.getElementById('editStaffActive')?.value === 'true';

  try {
    await API.updateUser(id, { name, role, specialty, phone, active });
    closeModal();
    showNotification('Usuario actualizado correctamente', 'success');
    renderStaff();
  } catch (err) {
    showNotification(err.message || 'Error al actualizar', 'error');
  }
}
