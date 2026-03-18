// ================================================
// NERVE — WhatsApp & Integrations Module
// ================================================

let waPollingInterval = null;

async function renderIntegrations() {
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted)">⏳ Cargando integraciones...</div>`;

  try {
    const userRole = API.getUser()?.role;
    if (userRole !== 'org_owner' && userRole !== 'doctor') {
      pc.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-desc">Acceso restringido</div></div>`;
      return;
    }

    await loadWAInterface();
  } catch (err) {
    pc.innerHTML = `<div style="padding:40px;color:red;text-align:center">Error de conexión: ${err.message}</div>`;
  }
}

async function loadWAInterface() {
  const pc = document.getElementById('pageContent');
  
  try {
    const res = await API.get('/whatsapp/status');
    const st = res.status || 'DISCONNECTED';
    
    let contentHtml = '';
    
    if (st === 'CONNECTED') {
      contentHtml = `
        <div class="card" style="padding:40px;text-align:center;max-width:600px;margin:30px auto;border-top:4px solid var(--success)">
          <div style="font-size:3rem;margin-bottom:10px">✅📱</div>
          <h2 style="color:var(--success);margin-bottom:10px">WhatsApp Vinculado Exitosamente</h2>
          <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:20px;line-height:1.6">Tu organización está lista para enviar recordatorios automáticos de citas a los pacientes.</p>
          
          <div style="background:var(--dark-4);padding:15px;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:30px">
            <span style="font-size:1.4rem">💬</span>
            <div>
              <div style="font-size:0.8rem;color:var(--text-dim)">Número Emisor (Organización)</div>
              <div style="font-size:1.1rem;font-weight:700;color:var(--cyan)">+${res.number}</div>
            </div>
          </div>
          
          <p style="font-size:0.8rem;color:var(--text-dim);margin-bottom:20px">Cada nueva consulta agendada disparará automáticamente un recordatorio al número del paciente.</p>
          
          <button class="btn btn-outline" style="border-color:var(--danger);color:var(--danger)" onclick="disconnectWA()">Desvincular Dispositivo</button>
        </div>
      `;
      if(waPollingInterval) { clearInterval(waPollingInterval); waPollingInterval = null; }
    } 
    else if (st === 'QR_READY') {
      contentHtml = `
        <div class="card" style="padding:40px;text-align:center;max-width:600px;margin:30px auto;">
          <h3>Escanea este código</h3>
          <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:20px">1. Abre WhatsApp en el celular de la Clínica.<br/>2. Toca en Menú o Configuración y selecciona "Dispositivos vinculados".<br/>3. Toca en "Vincular un dispositivo" y apunta tu cámara a esta pantalla.</p>
          
          <div style="background:#fff;padding:20px;display:inline-block;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,0.5)">
            <img src="${res.qr}" alt="QR Code" style="width:260px;height:260px;" />
          </div>
          
          <div style="margin-top:20px;color:var(--cyan-mid);font-size:0.85rem">🔄 Esperando escaneo... no recargues la página.</div>
          <button class="btn btn-secondary" style="margin-top:30px" onclick="disconnectWA()">Cancelar vinculación</button>
        </div>
      `;
      // Initiate polling if not active
      if(!waPollingInterval) {
        waPollingInterval = setInterval(() => {
          checkWAStatusPulse();
        }, 3500);
      }
    } 
    else if (st === 'STARTING') {
      contentHtml = `
        <div class="card" style="padding:50px;text-align:center;max-width:600px;margin:30px auto;">
          <div class="spinner" style="margin:0 auto 20px;"></div>
          <h3>Generando sesión segura...</h3>
          <p style="color:var(--text-muted);font-size:0.9rem">Estamos estableciendo conexión con los servidores de mensajería externa. El código QR aparecerá en unos segundos.</p>
        </div>
      `;
      if(!waPollingInterval) {
        waPollingInterval = setInterval(() => {
          checkWAStatusPulse();
        }, 3000);
      }
    } 
    else {
      // DISCONNECTED
      contentHtml = `
        <div class="card" style="padding:40px;max-width:600px;margin:30px auto;">
          <div style="display:flex;align-items:center;gap:15px;margin-bottom:20px">
            <div style="font-size:2.5rem">📱</div>
            <div>
              <h3 style="margin:0">Motor de Recordatorios</h3>
              <div style="color:var(--text-muted);font-size:0.85rem">Vía WhatsApp Empresarial / Personal</div>
            </div>
          </div>
          
          <p style="color:var(--text-muted);font-size:0.9rem;line-height:1.6;margin-bottom:25px">
            Vincule el número telefónico de su práctica médica para automatizar el envío de detalles y avisos de citas directamente al WhatsApp de sus pacientes, de manera inmediata y sin cargos adicionales por SMS o tarifas de Facebook.
          </p>
          
          <div style="background:rgba(6,207,215,0.1);border-left:3px solid var(--cyan);padding:15px;border-radius:0 8px 8px 0;margin-bottom:30px;font-size:0.85rem">
            <strong>Privacidad y Control:</strong> Nosotros usamos la vía Multi-Dispositivo (como si abriera WhatsApp Web). Su sesión se guarda altamente encriptada y usted tiene control total desde su celular para cerrar sesión cuando desee.
          </div>
          
          <button class="btn btn-primary" style="width:100%;justify-content:center;padding:12px;font-size:1rem" onclick="initWAFlow()">
            Generar Código QR y Vincular →
          </button>
        </div>
      `;
      if(waPollingInterval) { clearInterval(waPollingInterval); waPollingInterval = null; }
    }

    pc.innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">Integraciones del Sistema</div>
          <div class="page-subtitle">Herramientas de automatización técnica para Nerve</div>
        </div>
      </div>
      <div>
        ${contentHtml}
      </div>
    `;

  } catch (err) {
    if(waPollingInterval) clearInterval(waPollingInterval);
    console.error(err);
    pc.innerHTML += `<div style="color:red;padding:20px">Error fatal verificando el puente de WhatsApp.</div>`;
  }
}

async function checkWAStatusPulse() {
  // Silent pulse check
  try {
    const res = await API.get('/whatsapp/status');
    const st = res.status;
    if (st === 'CONNECTED' || st === 'QR_READY' || st === 'DISCONNECTED') {
      loadWAInterface(); // Update view
    }
  } catch (e) {
    console.log('Status polling skip', e);
  }
}

async function initWAFlow() {
  document.getElementById('pageContent').innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted)"><div class="spinner" style="margin:0 auto 15px;"></div>Solicitando puente de seguridad...</div>`;
  try {
    await API.post('/whatsapp/connect', {});
    setTimeout(() => {
      loadWAInterface();
    }, 1500);
  } catch (err) {
    window.showNotification('Error al contactar al motor de WebSockets', 'error');
    loadWAInterface();
  }
}

async function disconnectWA() {
  APP.confirm('¿Desvincular WhatsApp?', 'Se destruirá la sesión conectada y las notificaciones a pacientes se detendrán inmediatamente.', async () => {
    if(waPollingInterval) clearInterval(waPollingInterval);
    document.getElementById('pageContent').innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted)"><div class="spinner" style="margin:0 auto 15px;"></div>Cerrando sesión de forma segura...</div>`;
    await API.post('/whatsapp/disconnect', {});
    setTimeout(() => {
      loadWAInterface();
    }, 1500);
  });
}
