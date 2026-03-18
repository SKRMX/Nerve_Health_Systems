// ================================================
// NERVE Health Systems — Core App Router
// ================================================

var APP = {
  currentRole: 'doctor',
  currentUser: {
    superadmin: { name: 'Mauricio CV', initials: 'MC', org: 'NERVE Platform', role: 'Súper Administrador' },
    org_owner: { name: 'Dr. Roberto Sánchez', initials: 'RS', org: 'Hospital Ángeles Metropolitano', role: 'Dueño / Administrador' },
    dept_head: { name: 'Dra. Carmen Ruiz', initials: 'CR', org: 'Hospital Ángeles Metropolitano', role: 'Jefa de Cardiología' },
    doctor: { name: 'Dr. Eduardo González', initials: 'EG', org: 'Hospital Ángeles Metropolitano', role: 'Médico General' },
    asistente: { name: 'Laura Méndez', initials: 'LM', org: 'Hospital Ángeles Metropolitano', role: 'Asistente / Recepcionista' },
    patient: { name: 'Ana Lucía Martínez', initials: 'AM', org: 'Hospital Ángeles Metropolitano', role: 'Paciente' },
  },
  // — Super Admin credentials (platform owner only) —
  superAdminCreds: { username: 'MauricioCV', password: 'palmera22022800' },
  currentModule: 'dashboard',
  sidebarCollapsed: false,
  // Live user data from API (set after login)
  liveUser: null,

  // Throttle/Debounce helper for UI optimizations
  debounce: function (func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },

  navByRole: {
    superadmin: [
      { section: 'Principal' },
      { id: 'dashboard', icon: '📊', label: 'Dashboard Global', fn: 'renderSuperAdminDash' },
      { id: 'tenants', icon: '🏥', label: 'Organizaciones', fn: 'renderTenants' },
      { id: 'subscriptions', icon: '💳', label: 'Suscripciones', fn: 'renderSubscriptions' },
      { section: 'Gestión' },
      { id: 'audit-global', icon: '🔍', label: 'Logs de Auditoría', fn: 'renderAuditLog' },
      { id: 'system', icon: '⚙️', label: 'Configuración', fn: 'renderSystemConfig' },
    ],
    org_owner: [
      { section: 'Principal' },
      { id: 'dashboard', icon: '🏠', label: 'Resumen', fn: 'renderOrgDash' },
      { id: 'staff', icon: '👥', label: 'Personal', fn: 'renderStaff' },
      { id: 'departments', icon: '🏢', label: 'Departamentos', fn: 'renderDepartments' },
      { section: 'Clínico' },
      { id: 'patients', icon: '🫀', label: 'Pacientes', fn: 'renderPatients' },
      { id: 'reports', icon: '📈', label: 'Reportes', fn: 'renderReports' },
      { section: 'Sistema' },
      { id: 'billing', icon: '💳', label: 'Facturación', fn: 'renderBilling' },
      { id: 'importer', icon: '📤', label: 'Importar Datos', fn: 'renderImporter' },
      { id: 'audit', icon: '🔍', label: 'Auditoría', fn: 'renderAuditLog' },
    ],
    dept_head: [
      { section: 'Principal' },
      { id: 'dashboard', icon: '🏠', label: 'Mi Departamento', fn: 'renderDeptHeadDash' },
      { id: 'team', icon: '👥', label: 'Mi Equipo', fn: 'renderStaff' },
      { id: 'patients', icon: '🫀', label: 'Pacientes', fn: 'renderPatients' },
      { section: 'Análisis' },
      { id: 'reports', icon: '📈', label: 'Reportes', fn: 'renderReports' },
      { id: 'audit', icon: '🔍', label: 'Auditoría', fn: 'renderAuditLog' },
    ],
    doctor: [
      { section: 'Principal' },
      { id: 'dashboard', icon: '🏠', label: 'Dashboard', fn: 'renderDoctorDash' },
      { id: 'appointments', icon: '📅', label: 'Agenda', fn: 'renderAppointments' },
      { section: 'Clínico' },
      { id: 'patients', icon: '🫀', label: 'Mis Pacientes', fn: 'renderPatients' },
      { id: 'consultations', icon: '💬', label: 'Consultas', fn: 'renderConsultations' },
      { id: 'prescriptions', icon: '💊', label: 'Recetas', fn: 'renderPrescriptions' },
      { section: 'General' },
      { id: 'reports', icon: '📈', label: 'Mis Reportes', fn: 'renderReports' },
      { id: 'settings', icon: '⚙️', label: 'Mi Perfil', fn: 'renderDoctorSettings' },
    ],
    asistente: [
      { section: 'Principal' },
      { id: 'dashboard', icon: '🏠', label: 'Inicio', fn: 'renderAsistenteDash' },
      { id: 'appointments', icon: '📅', label: 'Agenda', fn: 'renderAppointments' },
      { section: 'Gestión' },
      { id: 'patients', icon: '🫀', label: 'Pacientes', fn: 'renderPatients' },
      { id: 'prescriptions', icon: '💊', label: 'Recetas', fn: 'renderPrescriptions' },
    ],
    patient: [
      { section: 'Mi Portal' },
      { id: 'dashboard', icon: '🏠', label: 'Inicio', fn: 'renderPatientPortal' },
      { id: 'appointments', icon: '📅', label: 'Mis Citas', fn: 'renderPatientAppointments' },
      { id: 'expediente', icon: '📂', label: 'Mi Expediente', fn: 'renderPatientExpediente' },
      { id: 'prescriptions', icon: '💊', label: 'Mis Recetas', fn: 'renderPatientPrescriptions' },
    ],
  }
};

// ---- Login ----
function selectRole(el) {
  // Legacy function - role selection is now automated via API login
}
// On load: highlight default role OR auto-login if coming from register/invite
window.addEventListener('load', async () => {
  try {
    const storedRole = localStorage.getItem('nerve_role');
    const storedToken = localStorage.getItem('nerve_token');

    if (storedToken) {
      // Fetch profile to ensure session is valid and populate currentUser
      const user = await API.getMe();
      APP.liveUser = user;
      APP.currentRole = user.role;

      // Update user data from API
      APP.currentUser[user.role] = {
        name: user.name,
        initials: user.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase(),
        org: user.orgName || 'NERVE Platform',
        role: getRoleLabel(user.role),
        specialty: user.specialty || '',
        license: user.license || '',
      };

      enterApp();
    } else {
      // No session: show login and hide splash
      document.getElementById('login-screen').style.display = 'flex';
      hideSplash();
      const storedEmail = localStorage.getItem('nerve_email');
      if (storedEmail) {
        const emailInput = document.getElementById('loginEmail');
        if (emailInput) emailInput.value = storedEmail;
      }
    }
  } catch (err) {
    console.error('Core init error:', err);
    clearTokens();
    document.getElementById('login-screen').style.display = 'flex';
    hideSplash();
  }
});

// Failsafe: Hide splash if ANY global error occurs during load
window.onerror = function () {
  hideSplash();
};

function doLogin() {
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPass');
  const rememberElement = document.getElementById('rememberMe');
  const typedUser = emailInput ? emailInput.value.trim() : '';
  const typedPass = passInput ? passInput.value.trim() : '';
  const remember = rememberElement ? rememberElement.checked : false;

  if (!typedUser || !typedPass) {
    showNotification('Ingresa tu correo y contraseña', 'warning');
    return;
  }

  // ---- Try API login first (if backend is available) ----
  if (typeof API !== 'undefined') {
    const loginBtn = document.querySelector('.login-card .btn-primary');
    if (loginBtn) { loginBtn.textContent = 'Conectando...'; loginBtn.disabled = true; }

    API.login(typedUser, typedPass)
      .then(user => {
        // ✅ API login success
        APP.liveUser = user;
        APP.currentRole = user.role;

        if (remember) {
          localStorage.setItem('nerve_role', user.role);
          localStorage.setItem('nerve_email', typedUser); // Store the actual typed email
          localStorage.setItem('nerve_name', user.name);
        } else {
          localStorage.removeItem('nerve_role');
          localStorage.removeItem('nerve_email');
          localStorage.removeItem('nerve_name');
        }

        // Update user data from API
        APP.currentUser[user.role] = {
          name: user.name,
          initials: user.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase(),
          org: user.orgName || 'NERVE Platform',
          role: getRoleLabel(user.role),
          specialty: user.specialty || '',
          license: user.license || '',
        };
        enterApp();
      })
      .catch(err => {
        // API failed — try offline fallback if it's superadmin or specific seed
        console.warn('API login failed:', err.message, '— trying offline mode');
        if (loginBtn) { loginBtn.textContent = 'Ingresar al sistema →'; loginBtn.disabled = false; }
        doOfflineLogin(typedUser, typedPass);
      });
  } else {
    doOfflineLogin(typedUser, typedPass);
  }
}

function doOfflineLogin(typedUser, typedPass) {
  // Check superadmin credentials
  const sa = APP.superAdminCreds;
  if (typedUser === sa.username && typedPass === sa.password) {
    APP.currentRole = 'superadmin';
    localStorage.setItem('nerve_role', 'superadmin');
    enterApp();
    return;
  }

  // If no API and no superadmin, we can't guess the role anymore
  showNotification('Credenciales incorrectas o servidor no disponible.', 'error');
}

function getRoleLabel(role) {
  const labels = {
    superadmin: 'Súper Administrador',
    org_owner: 'Dueño / Administrador',
    dept_head: 'Jefe de Departamento',
    doctor: 'Médico',
    asistente: 'Asistente / Recepcionista',
    patient: 'Paciente',
  };
  return labels[role] || role;
}

function enterApp() {
  const user = APP.currentUser[APP.currentRole];
  if (!user) {
    hideSplash();
    return;
  }

  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-layout').style.display = 'flex';

  const isSuperAdmin = APP.currentRole === 'superadmin';
  const displayOrg = isSuperAdmin ? 'NERVE Platform' : user.org;
  const displayInitials = user.initials || user.name.charAt(0);

  document.getElementById('sidebarOrgName').textContent = isSuperAdmin ? user.name : displayOrg;
  document.getElementById('sidebarOrgRole').textContent = user.role;
  document.getElementById('sidebarOrgAvatar').textContent = displayOrg.charAt(0);
  document.getElementById('userAvatarTopbar').textContent = displayInitials;

  if (window.innerWidth <= 900) document.getElementById('mobileMenuBtn').style.display = 'block';
  buildNav();
  history.replaceState({ moduleId: 'dashboard' }, null, "");
  navigate('dashboard', false);

  if (!isSuperAdmin && localStorage.getItem('nerve_firsttime') === '1') {
    setTimeout(() => showOnboarding(), 600);
  }

  // Hide splash after everything is rendered
  setTimeout(() => hideSplash(), 300);
}

function hideSplash() {
  const splash = document.getElementById('splash-screen');
  if (splash) {
    splash.style.opacity = '0';
    splash.style.visibility = 'hidden';
    setTimeout(() => splash.remove(), 500);
  }
}

async function doLogout() {
  const ok = await APP.confirm(
    'Confirmar salida',
    '¿Estás seguro que deseas cerrar sesión? Se cerrará tu acceso actual.',
    { okText: 'Cerrar sesión', variant: 'danger' }
  );
  if (ok) confirmLogout();
}

function confirmLogout() {
  closeModal();
  // Clear API tokens
  if (typeof API !== 'undefined') API.clearTokens();
  APP.liveUser = null;
  localStorage.removeItem('nerve_firsttime');
  localStorage.removeItem('nerve_role');
  localStorage.removeItem('nerve_name');
  localStorage.removeItem('nerve_token'); // Final sweep

  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app-layout').style.display = 'none';
  // Clear password field
  const passInput = document.getElementById('loginPass');
  if (passInput) passInput.value = '';
}

// ---- Utility Helpers ----
APP.confirm = function (title, message, options = {}) {
  return new Promise((resolve) => {
    const { okText = 'Continuar', cancelText = 'Cancelar', variant = 'primary' } = options;
    const body = `<div style="padding:10px 0; color:var(--text-light); line-height:1.5">${message}</div>`;
    const footer = `
      <button class="btn btn-secondary" onclick="APP._resolveConfirm(false)">${cancelText}</button>
      <button class="btn btn-${variant}" id="btnConfirmOk" onclick="APP._resolveConfirm(true)">${okText}</button>
    `;
    openModal(title, body, footer, 'sm');

    APP._resolveConfirm = (val) => {
      closeModal();
      resolve(val);
    };
  });
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// ---- Navigation ----
function buildNav() {
  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = '';
  const items = APP.navByRole[APP.currentRole] || [];
  items.forEach(item => {
    if (item.section) {
      const s = document.createElement('div');
      s.className = 'nav-section'; s.textContent = item.section;
      nav.appendChild(s); return;
    }
    const el = document.createElement('div');
    el.className = 'nav-item';
    el.dataset.id = item.id;
    el.dataset.label = item.label;
    el.setAttribute('title', item.label);
    el.innerHTML = `<span class="nav-icon">${item.icon}</span><span class="nav-label">${item.label}</span>${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}`;
    el.onclick = () => navigate(item.id);
    nav.appendChild(el);
  });
}

function navigate(moduleId, push = true, payload = null) {
  APP.currentModule = moduleId;
  const state = { moduleId, payload };

  // --- History API Support ---
  if (push) {
    history.pushState(state, null, "");
  }

  // Handle special "virtual" views first
  if (moduleId === 'patientDetail' && payload && payload.id) {
    document.getElementById('breadcrumbPage').textContent = 'Expediente';
    if (typeof window.openPatientDetail === 'function') {
      window.openPatientDetail(payload.id, false);
      return;
    }
  }
  if (moduleId === 'rxBuilder') {
    document.getElementById('breadcrumbPage').textContent = 'Nueva Receta';
    if (typeof window.renderRxBuilder === 'function') {
      window.renderRxBuilder(payload, false);
      return;
    }
  }

  // Reset active state in sidebar
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.id === moduleId));

  const item = (APP.navByRole[APP.currentRole] || []).find(i => i.id === moduleId);
  if (item) {
    document.getElementById('breadcrumbSection').textContent = APP.liveUser ? (APP.liveUser.orgName || 'NERVE') : (APP.currentUser[APP.currentRole] || {}).org || '';
    document.getElementById('breadcrumbPage').textContent = item.label;

    // Resolve fn string → global function at runtime
    var fn = item.fn;
    if (typeof fn === 'string' && typeof window[fn] === 'function') {
      window[fn]();
    } else if (typeof fn === 'function') {
      fn();
    } else {
      console.warn('navigate: módulo "' + moduleId + '" — función "' + fn + '" no encontrada');
    }
  }

  // Close mobile sidebar
  try { document.getElementById('sidebar').classList.remove('mobile-open'); } catch (e) { }
  try { closeNotifications(); } catch (e) { }
}

// Handle Browser Back/Forward buttons
window.onpopstate = function (event) {
  if (event.state && event.state.moduleId) {
    navigate(event.state.moduleId, false, event.state.payload);
  }
};

// ---- Sidebar toggle ----
function toggleSidebar() {
  APP.sidebarCollapsed = !APP.sidebarCollapsed;
  document.getElementById('sidebar').classList.toggle('collapsed', APP.sidebarCollapsed);
  const btn = document.querySelector('.sidebar-toggle span:first-child');
  if (btn) btn.textContent = APP.sidebarCollapsed ? '⟩' : '⟨';
}
function toggleMobileSidebar() {
  document.getElementById('sidebar').classList.toggle('mobile-open');
}

// ---- Notifications ----
function toggleNotifications() {
  document.getElementById('notifDrop').classList.toggle('open');
}
function closeNotifications() {
  document.getElementById('notifDrop').classList.remove('open');
}
try {
  document.addEventListener('click', e => {
    const drop = document.getElementById('notifDrop');
    if (drop && !drop.parentElement.contains(e.target)) closeNotifications();
  });
} catch (e) { console.warn('notif click listener:', e); }

window.showNotification = function (msg, type = 'success') {
  const container = document.getElementById('notification-container') || (function () {
    const div = document.createElement('div');
    div.id = 'notification-container';
    div.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
    document.body.appendChild(div);
    return div;
  })();

  const notif = document.createElement('div');
  const bg = type === 'error' ? 'var(--danger)' : (type === 'warning' ? 'var(--warning)' : 'var(--cyan)');
  const icon = type === 'error' ? '❌' : (type === 'warning' ? '⚠️' : '✅');

  notif.style.cssText = `background:${bg};color:#fff;padding:12px 20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);display:flex;align-items:center;gap:10px;font-size:0.9rem;font-weight:500;transform:translateY(20px);opacity:0;transition:all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);`;
  notif.innerHTML = `<span>${icon}</span> <span>${msg}</span>`;

  container.appendChild(notif);

  // Animate in
  setTimeout(() => { notif.style.transform = 'translateY(0)'; notif.style.opacity = '1'; }, 10);

  // Animate out and remove
  setTimeout(() => {
    notif.style.transform = 'translateY(10px)';
    notif.style.opacity = '0';
    setTimeout(() => notif.remove(), 300);
  }, 4000);
}

// ---- Modal ----
function openModal(title, bodyHTML, footerHTML = '', size = '') {
  document.getElementById('modalTitle').textContent = title;
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = bodyHTML;
  modalBody.setAttribute('translate', 'no');

  const modalBox = document.getElementById('modalBox');
  modalBox.setAttribute('translate', 'no');

  document.getElementById('modalFooter').innerHTML = footerHTML;
  const box = document.getElementById('modalBox');
  box.className = 'modal' + (size ? ` modal-${size}` : '');
  document.getElementById('modalOverlay').classList.add('open');
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}
try {
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });
} catch (e) { console.warn('modal click listener:', e); }


// ---- Global search (demo) ----
document.addEventListener('DOMContentLoaded', () => {
  const s = document.getElementById('globalSearch');
  if (s) s.addEventListener('keypress', e => {
    if (e.key === 'Enter' && APP.currentRole !== 'superadmin') navigate('patients');
  });
});

// ================================================
// MODULE IMPLEMENTATIONS (Role-Specific Logic)
// ================================================

async function renderConsultations() {
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted)">⏳ Cargando consultas...</div>`;
  let patients = [];
  try { const res = await API.getPatients(); patients = res.data || []; } catch (e) { }
  pc.innerHTML = `
  <div class="page-header"><div><div class="page-title">💬 Mis Consultas de Hoy</div></div></div>
  <div class="card"><div class="card-header"><span class="card-title">Pacientes en sala de espera</span></div>
  <div style="display:flex;flex-direction:column;gap:10px;">
    ${patients.length === 0 ? '<div class="empty-state" style="padding:30px"><div class="empty-state-icon">💬</div><div class="empty-state-desc">Sin pacientes en espera</div></div>' :
      patients.slice(0, 5).map(p => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid var(--border);border-radius:8px">
      <div>
        <div style="font-weight:600">${p.name}</div>
        <div style="font-size:0.8rem;color:var(--text-muted)">${p.diagnosis || 'Sin diagnóstico'}</div>
      </div>
      <button class="btn btn-primary" onclick="openPatientDetail('${p.id}')">Ver expediente ▶</button>
    </div>`).join('')}
  </div></div>`;
}

async function renderAsistenteDash() {
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted)">⏳ Cargando panel...</div>`;
  let appointments = [], patients = [];
  try {
    const [aRes, pRes] = await Promise.all([API.getAppointments(), API.getPatients()]);
    appointments = aRes.data || [];
    patients = pRes.data || [];
  } catch (e) { }
  const programadas = appointments.filter(a => a.status === 'programada');
  const completadas = appointments.filter(a => a.status === 'completada').length;
  pc.innerHTML = `
  <div class="page-header"><div><div class="page-title">📋 Recepción y Check-In</div><div class="page-subtitle">Panel de Asistente</div></div>
  <div class="page-actions"><button class="btn btn-primary" onclick="navigate('appointments')">+ Agendar Paciente</button></div></div>
  <div class="stats-grid stats-grid-3" style="margin-bottom:24px">
    <div class="stat-card"><div class="stat-icon" style="background:rgba(17,113,139,0.2)">👥</div><div class="stat-value">${appointments.length}</div><div class="stat-label">Citas Total</div></div>
    <div class="stat-card"><div class="stat-icon" style="background:rgba(34,197,94,0.1)">✅</div><div class="stat-value">${completadas}</div><div class="stat-label">Completadas</div></div>
    <div class="stat-card"><div class="stat-icon" style="background:rgba(239,68,68,0.1)">⏳</div><div class="stat-value">${programadas.length}</div><div class="stat-label">Programadas</div></div>
  </div>
  <div class="card"><div class="card-header"><span class="card-title">Citas programadas</span></div>
  ${programadas.length > 0 ? `<table style="width:100%;text-align:left;border-collapse:collapse">
    <thead><tr style="border-bottom:1px solid var(--border)"><th>Paciente</th><th>Hora</th><th>Fecha</th><th>Estado / Check-In</th></tr></thead>
    <tbody>
      ${programadas.slice(0, 10).map(a => `
      <tr style="border-bottom:1px solid var(--border)">
        <td style="padding:12px 0"><div style="font-weight:600">${a.patient?.name || '—'}</div></td>
        <td style="color:var(--cyan)">${a.time}</td>
        <td class="text-muted">${new Date(a.date).toLocaleDateString('es-MX')}</td>
        <td><button class="btn btn-sm btn-primary" onclick="completeAppt('${a.id}')">Marcar Llegada / Completar</button></td>
      </tr>`).join('')}
    </tbody>
  </table>` : '<div class="empty-state" style="padding:30px"><div class="empty-state-icon">📅</div><div class="empty-state-desc">Sin citas programadas</div></div>'}
  </div>`;
}

function renderPatientAppointments() {
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `
  <div class="page-header"><div><div class="page-title">📅 Mis Citas</div><div class="page-subtitle">Gestiona tus consultas futuras</div></div></div>
  <div class="card" style="margin-bottom:20px;text-align:center;padding:40px 20px;">
    <div style="font-size:3rem;margin-bottom:15px">📆</div>
    <h3>Agendar Nueva Cita</h3>
    <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:20px">Selecciona a tu médico de seguimiento para revisar horarios disponibles.</p>
    <div style="display:flex;gap:10px;justify-content:center">
      <select class="form-control" style="width:250px"><option>Dr. Eduardo González - Medicina General</option><option>Dra. Ruiz - Cardiología</option></select>
      <input type="text" id="patientApptDate" class="form-control" placeholder="Seleccionar fecha" style="width:180px" />
      <button class="btn btn-primary" onclick="showNotification('Tu solicitud será confirmada por el consultorio en breve.', 'cyan')">Solicitar Horario</button>
    </div>
    <div class="card"><div class="card-header"><span class="card-title">Historial de Visitas</span></div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <div style="padding:12px;background:var(--dark-4);border-radius:6px;display:flex;justify-content:space-between">
        <div><div style="font-weight:600">Revisión Mensual</div><div style="font-size:0.8rem;color:var(--text-muted)">15 Ene 2026 · Dr. Eduardo González</div></div>
        <span class="badge badge-success">Completada</span>
      </div>
    </div></div>`;

  setTimeout(() => {
    APP.initDatePicker("#patientApptDate", { defaultDate: "today" });
  }, 50);
}

function renderPatientExpediente() {
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `
    < div class="page-header" > <div><div class="page-title">📂 Mi Expediente</div><div class="page-subtitle">Resumen clínico y datos médicos</div></div></div >
      <div class="content-grid content-grid-2-1">
        <div class="card">
          <div class="card-header"><span class="card-title">Diagnósticos Activos</span></div>
          <div style="padding:12px;border:1px solid var(--border);border-radius:6px;margin-bottom:10px">
            <div style="font-weight:600;font-size:1.1rem;color:var(--cyan)">Cefalea Tensional (G44.2)</div>
            <p style="font-size:0.85rem;color:var(--text-muted);margin-top:6px">Control mensual establecido. Evitar episodios prolongados de estrés visual.</p>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Mis Signos Vitales</span></div>
          ${[['Última Medición', '28 Feb 2026'], ['Peso', '68 kg'], ['Presión', '120/80 mmHg']].map(x =>
    `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text-muted)">${x[0]}</span><span style="font-weight:600">${x[1]}</span></div>`
  ).join('')}
        </div>
      </div>`;
}

function renderPatientPrescriptions() {
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `
        < div class="page-header" > <div><div class="page-title">💊 Mis Recetas</div><div class="page-subtitle">Descarga en PDF tus prescripciones oficiales</div></div></div >
  <div class="card" style="margin-bottom:15px;display:flex;justify-content:space-between;align-items:center">
    <div><div style="font-weight:700">Receta RX-2026-0312</div><div style="font-size:0.8rem;color:var(--text-muted)">Emitida: 28 Feb 2026 · Dr. González</div><div style="color:var(--cyan-mid);font-size:0.85rem;margin-top:4px">Paracetamol 500mg, Omeprazol 20mg</div></div>
    <button class="btn btn-secondary">⬇ Descargar PDF</button>
  </div>
  <div class="card" style="display:flex;justify-content:space-between;align-items:center">
    <div><div style="font-weight:700">Receta RX-2025-0901</div><div style="font-size:0.8rem;color:var(--text-muted)">Emitida: 10 Nov 2025 · Dr. González</div><div style="color:var(--cyan-mid);font-size:0.85rem;margin-top:4px">Loratadina 10mg</div></div>
    <button class="btn btn-secondary">⬇ Descargar PDF</button>
  </div>`;
}

async function renderTenants() {
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted)">⏳ Cargando organizaciones...</div>`;
  let orgs = [];
  try {
    const res = await API.getOrganizations();
    orgs = res.data || res.organizations || res || [];
  } catch (e) { console.error('Error fetching orgs:', e); }

  if (!Array.isArray(orgs)) orgs = [];

  pc.innerHTML = `
  <div class="page-header"><div><div class="page-title">🏥 Organizaciones (Tenants)</div><div class="page-subtitle">Control maestro · ${orgs.length} organizaciones</div></div>
  <div class="page-actions"><button class="btn btn-primary" onclick="openNewTenantModal()">+ Nuevo Hospital</button></div></div>
  <div class="card">
    <div class="table-wrap">
      ${orgs.length > 0 ? `<table>
        <thead><tr><th>ID</th><th>Organización</th><th>Plan</th><th>Doctores / Límite</th><th>Acciones</th></tr></thead>
        <tbody>
          ${orgs.map(h => `<tr>
            <td style="font-family:monospace;color:var(--text-muted);font-size:0.75rem">${(h.id || '').substring(0, 8)}...</td>
            <td><a href="#" class="cell-link" onclick="renderTenantDetail('${h.id}')">${h.name || '—'}</a></td>
            <td><span class="badge ${h.plan === 'enterprise' ? 'badge-info' : 'badge-cyan'}">${h.plan || 'starter'}</span></td>
            <td><strong>${h._count?.users || 0}</strong> / ${h.maxDoctors || 0}</td>
            <td>
              <button class="btn btn-sm btn-secondary" onclick="openEditLimitsModal('${h.id}', '${h.name}', '${h.plan || 'starter'}', ${h.maxDoctors || 0})">Límites</button>
              <button class="btn btn-sm btn-danger" onclick="openSuspendTenantModal('${h.name}')">Suspender</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>` : '<div class="empty-state" style="padding:30px"><div class="empty-state-icon">🏥</div><div class="empty-state-desc">Sin organizaciones registradas</div></div>'}
    </div>
  </div>`;
}

async function renderTenantDetail(orgId) {
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted)">⏳ Cargando detalles de organización...</div>`;

  try {
    const [org, users, audit] = await Promise.all([
      API.getOrganization(orgId),
      API.getOrganizationUsers(orgId),
      API.getOrganizationAudit(orgId)
    ]);

    pc.innerHTML = `
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
          <button class="btn btn-secondary btn-sm" onclick="renderTenants()">← Volver</button>
          <div class="page-title">${org.name}</div>
        </div>
        <div class="page-subtitle">Panel de control administrativo para esta entidad</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openEditLimitsModal('${org.id}', '${org.name}', '${org.plan}', ${org.maxDoctors})">Ajustar Plan</button>
      </div>
    </div>

    <div class="stats-grid stats-grid-4" style="margin-bottom:24px">
      <div class="stat-card"><div class="stat-icon" style="background:rgba(59,130,246,0.1)">🏥</div><div class="stat-value">${org.plan.toUpperCase()}</div><div class="stat-label">Plan Actual</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(34,197,94,0.1)">👨‍⚕️</div><div class="stat-value">${users.filter(u => u.role === 'doctor').length}</div><div class="stat-label">Doctores Activos</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(168,85,247,0.1)">🫀</div><div class="stat-value">${org._count?.patients || 0}</div><div class="stat-label">Pacientes Totales</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(234,179,8,0.1)">📅</div><div class="stat-value">Activo</div><div class="stat-label">Estado</div></div>
    </div>

    <div class="content-grid content-grid-2-1">
      <div class="card">
        <div class="card-header"><span class="card-title">Personal y Usuarios</span></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Acción</th></tr></thead>
            <tbody>
              ${users.map(u => `
              <tr>
                <td><div class="cell-primary">${u.name}</div><div class="cell-secondary">${u.email}</div></td>
                <td><span class="badge badge-secondary">${getRoleLabel(u.role)}</span></td>
                <td><span class="badge ${u.active ? 'badge-success' : 'badge-danger'}">${u.active ? 'Activo' : 'Inactivo'}</span></td>
                <td><button class="btn btn-sm btn-secondary" onclick="renderUserDetail('${u.id}', '${orgId}')">Ver Perfil</button></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">Auditoría Reciente</span></div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${audit.length === 0 ? '<div class="text-muted">Sin actividad registrada</div>' :
        audit.slice(0, 10).map(log => `
            <div style="padding:10px;border-bottom:1px solid var(--border)">
              <div style="display:flex;justify-content:space-between;font-size:0.8rem">
                <strong style="color:var(--cyan)">${log.action}</strong>
                <span class="text-muted">${formatDate(log.createdAt)}</span>
              </div>
              <div style="font-size:0.85rem;margin-top:4px">${log.user?.name}: ${log.details || log.entity}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>
    `;
  } catch (err) {
    showNotification('Error al cargar detalles: ' + err.message, 'error');
    renderTenants();
  }
}

async function renderUserDetail(userId, returnOrgId = null) {
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted)">⏳ Cargando detalles de usuario...</div>`;

  try {
    const user = await API.getUserById(userId);
    const audit = await API.getAuditLogs({ userId });

    pc.innerHTML = `
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
          <button class="btn btn-secondary btn-sm" onclick="${returnOrgId ? `renderTenantDetail('${returnOrgId}')` : 'renderTenants()'}">← Volver</button>
          <div class="page-title">Perfil: ${user.name}</div>
        </div>
        <div class="page-subtitle">${getRoleLabel(user.role)} · ${user.email}</div>
      </div>
    </div>

    <div class="content-grid content-grid-1-2">
      <div class="card">
        <div class="card-header"><span class="card-title">Datos Básicos</span></div>
        <div style="display:flex;flex-direction:column;gap:15px;padding-top:10px">
          <div class="info-block"><label>Nombre Completo</label><div>${user.name}</div></div>
          <div class="info-block"><label>Correo Electrónico</label><div>${user.email}</div></div>
          <div class="info-block"><label>Rol</label><div><span class="badge badge-info">${getRoleLabel(user.role)}</span></div></div>
          <div class="info-block"><label>Especialidad</label><div>${user.specialty || '—'}</div></div>
          <div class="info-block"><label>Cédula</label><div>${user.license || '—'}</div></div>
          <div class="info-block"><label>Teléfono</label><div>${user.phone || '—'}</div></div>
          <div class="info-block"><label>Miembro desde</label><div>${formatDate(user.createdAt)}</div></div>
          <div class="info-block"><label>Estado</label><div><span class="badge ${user.active ? 'badge-success' : 'badge-danger'}">${user.active ? 'Cuenta Activa' : 'Cuenta Suspendida'}</span></div></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">Historial de Auditoría (Trazabilidad)</span></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Fecha / Hora</th><th>Acción</th><th>Recurso</th><th>Detalles</th></tr></thead>
            <tbody>
              ${audit.data.map(log => `
              <tr>
                <td style="font-size:0.8rem">${new Date(log.createdAt).toLocaleString('es-MX')}</td>
                <td><span class="badge badge-info">${log.action}</span></td>
                <td>${log.entity}</td>
                <td class="text-muted fs-xs">${log.details || '—'}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    `;
  } catch (err) {
    showNotification('Error al cargar perfil: ' + err.message, 'error');
    if (returnOrgId) renderTenantDetail(returnOrgId); else renderTenants();
  }
}

function openNewTenantModal() {
  openModal('🏥 Nuevo Hospital / Clínica', `
    <div class="form-row form-row-2">
      <div class="form-group"><label class="form-label">Nombre de la organización</label><input class="form-control" placeholder="Ej. Clínica Las Condes" /></div>
      <div class="form-group"><label class="form-label">Plan de suscripción</label>
        <select class="form-control"><option>Starter</option><option>Clínica Pro</option><option>Enterprise</option></select>
      </div>
    </div>
    <div class="form-row form-row-2">
      <div class="form-group"><label class="form-label">Nombre del administrador</label><input class="form-control" placeholder="Ej. Dr. Juan Pérez" /></div>
      <div class="form-group"><label class="form-label">Correo del administrador</label><input type="email" class="form-control" placeholder="admin@clinica.com" /></div>
    </div>
    <div class="form-group"><label class="form-label">Límite de doctores</label><input type="number" class="form-control" value="10" /></div>
`, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="closeModal();showNotification('Organización creada y correo enviado al administrador con éxito','success')">Crear Organización</button>
`);
}

function openEditLimitsModal(orgId, orgName, plan, docs) {
  openModal('⚙️ Modificar Límites: ' + orgName, `
    <div class="form-group"><label class="form-label">Plan Actual</label>
      <select class="form-control" id="limitPlan">
        <option value="enterprise" ${plan === 'enterprise' || plan === 'hospital' ? 'selected' : ''}>Enterprise (Hospital)</option>
        <option value="clinica_pro" ${plan === 'clinica_pro' || plan === 'clinica' ? 'selected' : ''}>Clínica Pro</option>
        <option value="starter" ${plan === 'starter' ? 'selected' : ''}>Starter</option>
      </select>
    </div>
    <div class="form-row form-row-2">
      <div class="form-group"><label class="form-label">Límite de Doctores</label><input type="number" id="limitDocs" class="form-control" value="${docs}" /></div>
      <div class="form-group"><label class="form-label">Límite de Almacenamiento (GB)</label><input type="number" class="form-control" value="50" disabled /></div>
    </div>
    <div class="form-group"><label class="form-label">Características adicionales</label>
      <label style="display:flex;align-items:center;gap:6px;margin-bottom:6px;cursor:pointer"><input type="checkbox" checked style="accent-color:var(--cyan-mid)"> Facturación automática</label>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer"><input type="checkbox" checked style="accent-color:var(--cyan-mid)"> Módulo de analítica avanzada</label>
    </div>
`, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" id="btnSaveLimits" onclick="saveOrgLimits('${orgId}')">Guardar Cambios</button>
`);
}

async function saveOrgLimits(orgId) {
  const plan = document.getElementById('limitPlan').value;
  const maxDoctors = parseInt(document.getElementById('limitDocs').value);
  const btn = document.getElementById('btnSaveLimits');

  // Hard detail: check if we are lowering below current count
  try {
    const users = await API.getOrganizationUsers(orgId);
    const docCount = users.filter(u => u.role === 'doctor').length;

    if (maxDoctors < docCount) {
      const ok = await APP.confirm(
        'Advertencia de Límite',
        `Estás estableciendo un límite de <strong>${maxDoctors}</strong> doctores, pero actualmente hay <strong>${docCount}</strong> registrados. ¿Deseas continuar?`,
        { okText: 'Confirmar y Guardar', variant: 'warning' }
      );
      if (!ok) {
        btn.disabled = false;
        btn.textContent = 'Guardar';
        return;
      }
    }
  } catch (e) { }

  if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

  try {
    await API.updateOrgPlan(orgId, { plan, maxDoctors });
    closeModal();
    showNotification('Límites de la organización actualizados correctamente', 'success');
    renderTenants();
  } catch (err) {
    showNotification(err.message || 'Error al actualizar límites', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Guardar Cambios'; }
  }
}

function openSuspendTenantModal(orgName) {
  openModal('⚠️ Suspender Organización', `
    <div style="padding:4px 0;">
      ¿Estás seguro de que deseas suspender el acceso a <strong style="color:var(--text)">${orgName}</strong>? <br><br>
      <span style="color:var(--text-muted);font-size:0.85rem">Los usuarios de esta organización no podrán acceder al sistema hasta que se reactive la cuenta desde este panel. Sus datos clínicos permanecerán intactos en la base de datos y no serán eliminados.</span>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-danger" onclick="closeModal();showNotification('Organización suspendida temporalmente','warning')">Sí, Suspender</button>
  `);
}

function renderDoctorSettings() { renderGenericSettings(); }
function renderSystemConfig() { renderGenericSettings(); }
function renderBilling() { renderSubscriptions(); }

async function renderSubscriptions() {
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted)">⏳ Cargando suscripción...</div>`;

  const role = APP.currentRole;
  const user = API.getUser();

  if (role === 'superadmin') {
    try {
      const res = await API.getAdminStats();
      const orgs = res.organizations || [];

      pc.innerHTML = `
      <div class="page-header"><div><div class="page-title">💳 Gestión Global de Suscripciones</div><div class="page-subtitle">Control maestro de planes y vigencias</div></div></div>
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Organización</th><th>Plan</th><th>Vence el</th><th>Gestión</th></tr></thead>
            <tbody>
              ${orgs.map(o => `<tr>
                <td><strong>${o.name}</strong></td>
                <td><span class="badge badge-info">${(o.plan || 'starter').toUpperCase()}</span></td>
                <td style="font-family:monospace">${o.subscriptionExpires ? formatDate(o.subscriptionExpires) : '<span style="color:var(--success)">Lifetime</span>'}</td>
                <td>
                  <div style="display:flex;gap:6px">
                    <button class="btn btn-sm btn-secondary" onclick="extendSubscription('${o.id}', 1)">+1 Mes</button>
                    <button class="btn btn-sm btn-cyan" onclick="openCustomExpiryModal('${o.id}', '${o.name}', '${o.subscriptionExpires || ''}')">⚙️</button>
                  </div>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
    } catch (err) { showNotification('Error al cargar suscripciones', 'error'); }
    return;
  }

  // Tenant/Org Owner view
  try {
    const org = await API.getOrganization(user.orgId);
    const isExpired = org.subscriptionExpires && new Date(org.subscriptionExpires) < new Date();

    pc.innerHTML = `
    <div class="page-header"><div><div class="page-title">💳 Mi Suscripción</div><div class="page-subtitle">Estado actual de tu plan NERVE</div></div></div>
    
    <div class="content-grid content-grid-2-1">
      <div class="card">
        <div class="card-header"><span class="card-title">Resumen del Plan</span></div>
        <div style="display:flex;align-items:center;gap:20px;padding:10px 0;">
          <div style="width:80px;height:80px;background:var(--cyan-mid);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:2rem;">💎</div>
          <div style="flex:1">
            <h3 style="margin:0;color:var(--cyan)">Plan ${org.plan ? org.plan.charAt(0).toUpperCase() + org.plan.slice(1) : 'Starter'}</h3>
            <p style="margin:4px 0;font-size:0.9rem;color:var(--text-muted)">Estado: <span class="badge ${isExpired ? 'badge-danger' : 'badge-success'}">${isExpired ? 'Vencido' : 'Activo'}</span></p>
          </div>
        </div>
        <div style="margin-top:20px;padding-top:20px;border-top:1px solid var(--border)">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Próxima renovación:</span> <strong>${org.subscriptionExpires ? formatDate(org.subscriptionExpires) : 'Infinita / Sin límite'}</strong></div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Límite de médicos:</span> <strong>${org.maxDoctors}</strong></div>
          <div style="display:flex;justify-content:space-between"><span>Método de pago:</span> <strong>Mercado Pago / Manual</strong></div>
        </div>
      </div>

      <div class="card" style="background:linear-gradient(135deg, var(--dark-3), var(--dark-2))">
        <div class="card-header"><span class="card-title">Soporte y Ayuda</span></div>
        <p style="font-size:0.85rem;color:var(--text-dim)">Si necesitas cambiar de plan, aumentar tu límite de médicos o tienes dudas con tu facturación, nuestro equipo está listo para ayudarte.</p>
        <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:10px">Contactar a Soporte →</button>
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-header"><span class="card-title">Beneficios Incluidos</span></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(200px, 1fr));gap:15px;padding-top:10px">
        ${['Expediente Clínico ILIMITADO', 'Recetas Digitales con Firma', 'Agenda Multiconsultorio', 'Soporte 24/7 Premium', 'Backups Diarios Automáticos', 'Seguridad Nivel Hospitalario'].map(b => `
          <div style="display:flex;align-items:center;gap:8px;font-size:0.82rem;color:var(--text-light)">
            <span style="color:var(--success)">✓</span> ${b}
          </div>
        `).join('')}
      </div>
    </div>
    `;
  } catch (err) {
    showNotification('Error al cargar datos de suscripción', 'error');
  }
}

async function extendSubscription(orgId, months) {
  const ok = await APP.confirm(
    'Confirmar Regalo',
    `¿Estás seguro de regalar <strong>${months} mes(es)</strong> a esta organización?`,
    { okText: 'Sí, regalar tiempo', variant: 'cyan' }
  );
  if (!ok) return;

  try {
    // We need current expiry or now
    const orgs = (await API.getAdminStats()).organizations;
    const org = orgs.find(o => o.id === orgId);
    let baseDate = org.subscriptionExpires ? new Date(org.subscriptionExpires) : new Date();

    const newExpiry = addMonths(baseDate, months);
    await API.updateOrgPlan(orgId, { subscriptionExpires: newExpiry.toISOString() });
    showNotification('Suscripción extendida con éxito', 'success');
    renderSubscriptions();
  } catch (err) {
    showNotification('Error al extender suscripción', 'error');
  }
}

function openCustomExpiryModal(orgId, orgName, currentExpiry) {
  openModal(`⚙️ Ajustar Vencimiento: ${orgName}`, `
    <div class="form-group">
      <label class="form-label">Nueva Fecha de Vencimiento</label>
      <input type="date" id="newExpiryDate" class="form-control" value="${currentExpiry ? currentExpiry.split('T')[0] : ''}" />
      <p style="font-size:0.8rem;color:var(--text-muted);margin-top:8px">Al establecer esta fecha, el acceso de la organización se mantendrá activo hasta este día independientemente de su estado en Mercado Pago.</p>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="saveCustomExpiry('${orgId}')">Guardar Fecha</button>
  `, 'sm');
}

async function saveCustomExpiry(orgId) {
  const date = document.getElementById('newExpiryDate').value;
  if (!date) return showNotification('Selecciona una fecha', 'error');

  try {
    await API.updateOrgPlan(orgId, { subscriptionExpires: new Date(date).toISOString() });
    closeModal();
    showNotification('Fecha de vencimiento actualizada', 'success');
    renderSubscriptions();
  } catch (err) {
    showNotification('Error al guardar fecha', 'error');
  }
}

function renderDepartments() { renderStaff(); }

function renderGenericSettings() {
  const role = APP.currentRole;
  const user = APP.liveUser || APP.currentUser[role] || {};
  const specList = typeof getSpecialtyList === 'function' ? getSpecialtyList() : [];

  document.getElementById('pageContent').innerHTML = `
  <div class="page-header"><div><div class="page-title">⚙️ Configuración / Perfil</div><div class="page-subtitle">Ajusta las preferencias de tu cuenta</div></div></div>
  <div class="card"><div class="card-header"><span class="card-title">Datos Personales</span></div>
    <div class="form-row form-row-2">
      <div class="form-group"><label class="form-label">Nombre completo</label><input class="form-control" id="profileName" value="${user.name || ''}" /></div>
      <div class="form-group"><label class="form-label">Correo electrónico</label><input class="form-control" type="email" id="profileEmail" value="${user.email || ''}" disabled style="opacity:0.6" /></div>
    </div>
    ${role === 'doctor' || role === 'dept_head' ? `
  <div class="form-group"><label class="form-label">Especialidad</label>
    <select class="form-control" id="profileSpecialty">
      <option value="">-- Seleccionar --</option>
      ${specList.map(s => `<option value="${s.name}" ${user.specialty === s.name ? 'selected' : ''}>${s.icon} ${s.name}</option>`).join('')}
    </select>
  </div>
  <div class="form-row form-row-2">
    <div class="form-group"><label class="form-label">Teléfono</label><input class="form-control" id="profilePhone" value="${user.phone || ''}" placeholder="+52 55 ..." /></div>
    <div class="form-group"><label class="form-label">Cédula Profesional</label><input class="form-control" id="profileCedula" value="${user.cedula || ''}" placeholder="12345678" /></div>
  </div>` : ''}
    <button class="btn btn-primary" id="btnSaveProfile" onclick="saveProfile()">Guardar cambios</button></div>
  <div class="card mt-4"><div class="card-header"><span class="card-title">Ajustes de Notificaciones</span></div>
    <div style="display:flex;flex-direction:column;gap:12px;">
      ${['Notificarme de nuevas citas por Email', 'Recordatorios a mi WhatsApp personal', 'Reporte semanal de actividad'].map(n => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);">
      <span style="font-size:0.88rem;">${n}</span>
      <label style="position:relative;display:inline-block;width:40px;height:22px;cursor:pointer;">
        <input type="checkbox" checked style="opacity:0;width:0;height:0;">
        <span style="position:absolute;inset:0;background:var(--cyan-mid);border-radius:11px;cursor:pointer;transition:.3s;"></span>
      </label>
    </div>`).join('')}
    </div></div>`;
}

async function saveProfile() {
  const name = document.getElementById('profileName')?.value.trim();
  const specialty = document.getElementById('profileSpecialty')?.value;
  const phone = document.getElementById('profilePhone')?.value.trim();
  const btn = document.getElementById('btnSaveProfile');

  if (!name) return showNotification('El nombre es obligatorio', 'error');
  if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

  try {
    const data = { name };
    if (specialty !== undefined) data.specialty = specialty;
    if (phone !== undefined) data.phone = phone;
    await API.request('/users/me', { method: 'PUT', body: data });
    // Update local data
    if (APP.liveUser) {
      APP.liveUser.name = name;
      if (specialty) APP.liveUser.specialty = specialty;
      if (phone) APP.liveUser.phone = phone;
    }
    showNotification('Perfil actualizado con éxito', 'success');
  } catch (err) {
    showNotification(err.message || 'Error al guardar', 'error');
  }
  if (btn) { btn.disabled = false; btn.textContent = 'Guardar cambios'; }
}

// ================================================
// ONBOARDING WIZARD
// ================================================
const ONBOARDING = {
  org_owner: [
    {
      icon: '🏥', title: 'Bienvenido a NERVE', step: 1,
      desc: 'Vamos a configurar tu espacio de trabajo en 4 pasos rápidos. Puedes saltar este proceso y hacerlo después.',
      checklist: [
        { id: 'ob_org', label: 'Completar perfil de la organización', done: false },
        { id: 'ob_logo', label: 'Subir tu logo o foto de perfil', done: false },
        { id: 'ob_addr', label: 'Agregar dirección y teléfono', done: false },
      ],
      nextLabel: 'Agregar mi primer doctor →',
    },
    {
      icon: '👨‍⚕️', title: 'Agrega tu primer doctor', step: 2,
      desc: 'Invita a tus doctores por correo electrónico. Recibirán un link para crear su cuenta y unirse a tu organización.',
      checklist: [
        { id: 'ob_doc1', label: 'Invitar primer doctor por email', done: false },
        { id: 'ob_dept', label: 'Crear departamentos (opcional)', done: false },
        { id: 'ob_perms', label: 'Revisar permisos del equipo', done: false },
      ],
      nextLabel: 'Agregar pacientes →',
    },
    {
      icon: '🫀', title: 'Importa tus pacientes', step: 3,
      desc: 'Puedes agregar pacientes uno a uno o importar tu base de datos actual con un archivo CSV o Excel.',
      checklist: [
        { id: 'ob_pat1', label: 'Agregar primer paciente manualmente', done: false },
        { id: 'ob_csv', label: 'O importa tus pacientes desde CSV/Excel', done: false },
      ],
      nextLabel: 'Agendar primera cita →',
    },
    {
      icon: '📅', title: '¡Ya casi terminas!', step: 4,
      desc: 'Agenda tu primera cita de prueba para ver el flujo completo de consulta, desde la agenda hasta la receta digital.',
      checklist: [
        { id: 'ob_apt', label: 'Agendar una cita de prueba', done: false },
        { id: 'ob_rx', label: 'Generar una receta de ejemplo', done: false },
      ],
      nextLabel: '¡Comenzar a usar NERVE! →',
      isLast: true,
    },
  ],
  doctor: [
    {
      icon: '🩺', title: '¡Bienvenido, Doctor!', step: 1,
      desc: 'Tu cuenta está lista. Completa tu perfil para que tus pacientes y el equipo puedan identificarte correctamente.',
      checklist: [
        { id: 'ob_profile', label: 'Completar tu perfil profesional', done: false },
        { id: 'ob_cedula', label: 'Agregar cédula profesional y especialidad', done: false },
        { id: 'ob_sign', label: 'Subir tu firma digital (para recetas)', done: false },
      ],
      nextLabel: 'Ver mi agenda →',
    },
    {
      icon: '📅', title: 'Explora tu agenda', step: 2,
      desc: 'Aquí verás todas tus citas. Tu administrador puede programarlas, o puedes crearlas tú directamente.',
      checklist: [
        { id: 'ob_viewagenda', label: 'Revisar la agenda de hoy', done: false },
        { id: 'ob_notifs', label: 'Configurar tus recordatorios', done: false },
      ],
      nextLabel: '¡Listo para empezar! →',
      isLast: true,
    },
  ],
  patient: [
    {
      icon: '👤', title: '¡Bienvenido a tu portal!', step: 1,
      desc: 'Aquí puedes consultar tu historial médico, tus recetas y tus próximas citas. Todo en un solo lugar, seguro y privado.',
      checklist: [
        { id: 'ob_info', label: 'Revisar tu información personal', done: false },
        { id: 'ob_appts', label: 'Ver tus próximas citas', done: false },
        { id: 'ob_rxs', label: 'Descargar tus recetas médicas', done: false },
      ],
      nextLabel: '¡Explorar mi portal! →',
      isLast: true,
    },
  ],
};

var _obStep = 0;
var _obSteps = [];

function showOnboarding() {
  _obSteps = ONBOARDING[APP.currentRole] || ONBOARDING.doctor;
  _obStep = 0;
  renderOnboardingStep();
}

function renderOnboardingStep() {
  const s = _obSteps[_obStep];
  if (!s) { closeOnboarding(); return; }

  // Build progress bars
  const bars = _obSteps.map((_, i) =>
    `<div class="ob-prog-bar ${i < _obStep ? 'done' : i === _obStep ? 'current' : ''}"></div>`
  ).join('');

  // Build checklist
  const items = s.checklist.map(c => `
  <div class="ob-check-item ${c.done ? 'done' : ''}" id="${c.id}" onclick="toggleObCheck(this)">
    <div class="ob-check-mark">${c.done ? '✓' : ''}</div>
    <div>${c.label}</div>
  </div>
  `).join('');

  const html = `
  <div class="onboarding-overlay" id="obOverlay">
    <div class="onboarding-card">
      <button class="ob-close" onclick="closeOnboarding()">✕</button>
      <div class="ob-progress">${bars}</div>
      <div class="ob-step">
        <div class="ob-step-icon">${s.icon}</div>
        <h2>${s.title}</h2>
        <p>${s.desc}</p>
        <div class="ob-checklist">${items}</div>
        <div class="ob-actions">
          <span class="ob-skip" onclick="closeOnboarding()">Saltar configuración</span>
          <button class="btn btn-primary" onclick="${s.isLast ? 'closeOnboarding()' : 'nextObStep()'}">
            ${s.nextLabel}
          </button>
        </div>
      </div>
    </div>
  </div>`;

  // Remove existing overlay if any
  const existing = document.getElementById('obOverlay');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', html);
}

function toggleObCheck(el) {
  el.classList.toggle('done');
  const mark = el.querySelector('.ob-check-mark');
  mark.textContent = el.classList.contains('done') ? '✓' : '';
}

function nextObStep() {
  _obStep++;
  if (_obStep >= _obSteps.length) { closeOnboarding(); return; }
  renderOnboardingStep();
}

function closeOnboarding() {
  localStorage.removeItem('nerve_firsttime');
  const ov = document.getElementById('obOverlay');
  if (ov) ov.remove();
}

/**
 * Reusable Autocomplete Component
 * @param {HTMLInputElement} input
  * @param {Object} options {data, onSelect, searchKeys, renderItem}
  */
APP.initAutocomplete = function (input, options = {}) {
  const {
    data = [],
    onSelect = () => { },
    searchKeys = ['name'],
    renderItem = (item) => `<div class="autocomplete-item-name">${item.name}</div>${item.email ? `<div class="autocomplete-item-sub">${item.email}</div>` : ''}`
  } = options;

  if (!input) return;

  // Cleanup existing
  const existingWrapper = input.closest('.autocomplete-wrapper');
  if (existingWrapper) {
    const parent = existingWrapper.parentNode;
    parent.insertBefore(input, existingWrapper);
    existingWrapper.remove();
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'autocomplete-wrapper';
  input.parentNode.insertBefore(wrapper, input);
  wrapper.appendChild(input);

  const dropdown = document.createElement('div');
  dropdown.className = 'autocomplete-dropdown';
  wrapper.appendChild(dropdown);

  let selectedIndex = -1;
  let filteredData = [];

  const showDropdown = () => dropdown.classList.add('open');
  const hideDropdown = () => {
    dropdown.classList.remove('open');
    selectedIndex = -1;
  };

  const renderSuggestions = (list) => {
    filteredData = list;
    if (list.length === 0) {
      hideDropdown();
      return;
    }
    dropdown.innerHTML = list.map((item, i) => `
  <div class="autocomplete-item" data-index="${i}">
    ${renderItem(item)}
  </div>
  `).join('');
    showDropdown();
  };

  input.addEventListener('input', () => {
    const val = input.value.trim().toLowerCase();
    if (!val) {
      hideDropdown();
      return;
    }
    const matches = data.filter(item =>
      searchKeys.some(key => String(item[key] || '').toLowerCase().includes(val))
    ).slice(0, 8);
    renderSuggestions(matches);
  });

  input.addEventListener('keydown', (e) => {
    const items = dropdown.querySelectorAll('.autocomplete-item');
    if (!dropdown.classList.contains('open')) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % filteredData.length;
      updateActive(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + filteredData.length) % filteredData.length;
      updateActive(items);
    } else if (e.key === 'Enter') {
      if (selectedIndex > -1) {
        e.preventDefault();
        selectItem(filteredData[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      hideDropdown();
    }
  });

  const updateActive = (items) => {
    items.forEach((item, i) => {
      item.classList.toggle('active', i === selectedIndex);
      if (i === selectedIndex) item.scrollIntoView({ block: 'nearest' });
    });
  };

  const selectItem = (item) => {
    input.value = item.name;
    onSelect(item);
    hideDropdown();
  };

  dropdown.addEventListener('click', (e) => {
    const itemEl = e.target.closest('.autocomplete-item');
    if (itemEl) {
      const idx = parseInt(itemEl.dataset.index);
      selectItem(filteredData[idx]);
    }
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) hideDropdown();
  });
};

/**
 * Reusable Date Picker (Flatpickr wrapper)
 * @param {string | HTMLElement} selector
  * @param {Object} opts Flatpickr options
  */
APP.initDatePicker = function (selector, opts = {}) {
  if (typeof flatpickr === 'undefined') return;
  return flatpickr(selector, {
    locale: "es",
    dateFormat: "Y-m-d",
    disableMobile: true,
    ...opts
  });
};

/**
 * Reusable Time Picker (Flatpickr wrapper)
 * @param {string | HTMLElement} selector
  * @param {Object} opts Flatpickr options
  */
APP.initTimePicker = function (selector, opts = {}) {
  if (typeof flatpickr === 'undefined') return;
  return flatpickr(selector, {
    enableTime: true,
    noCalendar: true,
    dateFormat: "H:i",
    time_24hr: true,
    disableMobile: true,
    ...opts
  });
};
