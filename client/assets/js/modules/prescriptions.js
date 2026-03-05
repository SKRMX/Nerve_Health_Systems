// ================================================
// NERVE — Prescriptions Module (API-Connected)
// ================================================

let _rxDrugs = [
  { id: 1, name: 'Paracetamol', dose: '500 mg', form: 'Tabletas', freq: 'Cada 8 horas', dur: '5 días', inst: 'Tomar con comida. No exceder 3g/día.' },
  { id: 2, name: 'Amoxicilina', dose: '500 mg', form: 'Cápsulas', freq: 'Cada 8 horas', dur: '7 días', inst: 'Terminar el tratamiento completo.' },
];

let _rxPatients = [];

function renderPrescriptions() {
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `
  <div class="page-header">
    <div><div class="page-title">💊 Recetas Digitales</div><div class="page-subtitle">Generación de recetas en PDF con branding</div></div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="renderRxHistory()">📋 Historial de recetas</button>
      <button class="btn btn-primary" onclick="renderRxBuilder()">+ Nueva receta</button>
    </div>
  </div>
  <div id="rxContent"></div>`;
  renderRxBuilder();
}

async function renderRxBuilder() {
  const area = document.getElementById('rxContent');
  area.innerHTML = `<div style="padding:30px;text-align:center;color:var(--text-muted)">⏳ Cargando pacientes...</div>`;

  // Load patients
  try {
    const res = await API.getPatients();
    _rxPatients = res.data || [];
  } catch (e) { _rxPatients = []; }

  area.innerHTML = `
  <div class="content-grid content-grid-1-1">
    <div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-header"><span class="card-title">👤 Datos del Paciente</span></div>
        <div class="form-row form-row-2">
          <div class="form-group"><label class="form-label">Paciente</label>
            <select class="form-control" id="rxPatient" onchange="updatePreview()">
              ${_rxPatients.length === 0 ? '<option>Sin pacientes</option>' :
      _rxPatients.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label class="form-label">Fecha</label>
            <input class="form-control" id="rxDate" type="date" value="${new Date().toISOString().split('T')[0]}" oninput="_debouncedUpdatePreview()"/>
          </div>
        </div>
        <div class="form-group"><label class="form-label">Diagnóstico</label>
          <input class="form-control" id="rxDx" placeholder="CIE-10: Ej. J06.9 Infección respiratoria aguda" oninput="_debouncedUpdatePreview()"/>
        </div>
      </div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-header">
          <span class="card-title">💊 Medicamentos</span>
          <button class="btn btn-primary btn-sm" onclick="openAddDrugModal()">+ Agregar</button>
        </div>
        <div id="rxDrugList">
          ${renderDrugItems()}
        </div>
      </div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-header"><span class="card-title">📝 Indicaciones adicionales</span></div>
        <textarea class="form-control" id="rxNotes" rows="3" placeholder="Reposo relativo, dieta blanda, hidratación 2L/día..." oninput="_debouncedUpdatePreview()"></textarea>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-primary" style="flex:1;justify-content:center" onclick="printPrescription()">🖨 Imprimir / Descargar PDF</button>
        <button class="btn btn-secondary" onclick="saveRxToBackend()">💾 Guardar receta</button>
      </div>
    </div>
    <div class="card" id="rxPreviewCard" style="font-family:'Inter',sans-serif">
      <div class="card-header"><span class="card-title">👁 Vista previa de receta</span><span class="badge badge-mint">En vivo</span></div>
      <div id="rxPreview"></div>
    </div>
  </div>`;
  updatePreview();
}

const _debouncedUpdatePreview = APP.debounce(() => updatePreview(), 300);

function renderDrugItems() {
  if (_rxDrugs.length === 0) return `<div class="empty-state" style="padding:24px"><div class="empty-state-icon">💊</div><div class="empty-state-desc">Sin medicamentos. Agrega el primero.</div></div>`;
  return _rxDrugs.map((d, i) => `
  <div class="rx-drug-item">
    <div class="rx-drug-num">${i + 1}</div>
    <div style="flex:1">
      <div style="font-weight:700;font-size:0.92rem">${d.name} ${d.dose} · ${d.form}</div>
      <div style="font-size:0.8rem;color:var(--text-muted)">🔁 ${d.freq} · ⏱ ${d.dur}</div>
      <div style="font-size:0.78rem;color:var(--text-dim);margin-top:3px">💬 ${d.inst}</div>
    </div>
    <button class="btn btn-danger btn-sm" onclick="_rxDrugs.splice(${i},1);document.getElementById('rxDrugList').innerHTML=renderDrugItems();updatePreview()">✕</button>
  </div>`).join('');
}

function updatePreview() {
  const prev = document.getElementById('rxPreview');
  if (!prev) return;
  const patId = document.getElementById('rxPatient')?.value;
  const pat = _rxPatients.find(p => p.id === patId) || _rxPatients[0] || { name: '—', bloodType: '—' };
  const date = document.getElementById('rxDate')?.value || new Date().toISOString().split('T')[0];
  const dx = document.getElementById('rxDx')?.value || '—';
  const notes = document.getElementById('rxNotes')?.value || '';
  const rxNum = 'RX-' + date.replace(/-/g, '').slice(2) + '-' + String(Math.floor(Math.random() * 900) + 100);
  const user = API.getUser();

  prev.innerHTML = `
  <div style="background:#fff;color:#111;border-radius:8px;padding:24px;font-size:0.82rem">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #11718B;padding-bottom:12px;margin-bottom:12px">
      <div>
        <div style="font-size:1.1rem;font-weight:900;color:#11718B">NERVE Health Systems</div>
        <div style="font-size:0.72rem;color:#666">Sistema de Gestión Médica</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:0.75rem;color:#666">RECETA MÉDICA</div>
        <div style="font-weight:700;color:#11718B">${rxNum}</div>
        <div style="font-size:0.72rem;color:#666">${new Date(date + 'T12:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;background:#f0f8ff;border-radius:6px;padding:10px;margin-bottom:12px">
      <div><div style="font-size:0.68rem;color:#666">PACIENTE</div><div style="font-weight:700">${pat.name}</div></div>
      <div><div style="font-size:0.68rem;color:#666">TIPO DE SANGRE</div><div style="font-weight:600">${pat.bloodType || '—'}</div></div>
      <div><div style="font-size:0.68rem;color:#666">DIAGNÓSTICO</div><div style="font-weight:600">${dx || '—'}</div></div>
    </div>
    <div style="font-weight:700;margin-bottom:8px;color:#11718B;border-bottom:1px solid #11718B;padding-bottom:4px">℞ PRESCRIPCIÓN</div>
    ${_rxDrugs.length === 0 ? '<div style="color:#999;font-style:italic;padding:8px 0">Sin medicamentos.</div>' :
      _rxDrugs.map((d, i) => `<div style="margin-bottom:10px;padding:8px;border-left:3px solid #06CFD7">
      <div style="font-weight:700">${i + 1}. ${d.name} ${d.dose} — ${d.form}</div>
      <div style="color:#555">Frecuencia: ${d.freq} por ${d.dur}</div>
      <div style="color:#777;font-size:0.75rem">${d.inst}</div>
    </div>`).join('')}
    ${notes ? `<div style="margin-top:10px;padding:8px;background:#f9f9f9;border-radius:4px"><strong>Indicaciones:</strong> ${notes}</div>` : ''}
    <div style="margin-top:20px;display:flex;justify-content:space-between;border-top:1px dashed #ccc;padding-top:12px">
      <div style="font-size:0.75rem;color:#666"><strong>${user?.name || 'Doctor'}</strong><br>NERVE Health Systems</div>
      <div style="width:80px;height:40px;border-bottom:1px solid #333;text-align:center;font-size:0.65rem;color:#999;padding-top:28px">Firma</div>
    </div>
    <div style="text-align:center;margin-top:10px;font-size:0.65rem;color:#aaa">Receta válida por 30 días · NERVE Health Systems · www.nervehealthsystems.com</div>
  </div>`;
}

function openAddDrugModal() {
  openModal('💊 Agregar Medicamento', `
    <div class="form-row form-row-2">
      <div class="form-group"><label class="form-label">Medicamento</label><input class="form-control" id="drugName" placeholder="Ej: Amoxicilina" /></div>
      <div class="form-group"><label class="form-label">Dosis</label><input class="form-control" id="drugDose" placeholder="Ej: 500 mg" /></div>
    </div>
    <div class="form-row form-row-2">
      <div class="form-group"><label class="form-label">Forma farmacéutica</label>
        <select class="form-control" id="drugForm"><option>Tabletas</option><option>Cápsulas</option><option>Jarabe</option><option>Inyectable</option><option>Crema</option><option>Gotas</option></select>
      </div>
      <div class="form-group"><label class="form-label">Frecuencia</label>
        <select class="form-control" id="drugFreq"><option>Cada 6 horas</option><option>Cada 8 horas</option><option>Cada 12 horas</option><option>Cada 24 horas</option><option>Una sola dosis</option></select>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Duración</label>
      <select class="form-control" id="drugDur"><option>1 día</option><option>3 días</option><option>5 días</option><option>7 días</option><option>10 días</option><option>14 días</option><option>30 días</option><option>Continuo</option></select>
    </div>
    <div class="form-group"><label class="form-label">Instrucciones especiales</label>
      <input class="form-control" id="drugInst" placeholder="Ej: Tomar con alimentos, evitar el sol..." />
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
   <button class="btn btn-primary" onclick="addDrug()">Agregar medicamento</button>`);
}

function addDrug() {
  const name = document.getElementById('drugName')?.value.trim();
  if (!name) { showNotification('Ingresa el nombre del medicamento', 'error'); return; }
  _rxDrugs.push({
    id: Date.now(), name,
    dose: document.getElementById('drugDose')?.value || '',
    form: document.getElementById('drugForm')?.value || 'Tabletas',
    freq: document.getElementById('drugFreq')?.value || 'Cada 8 horas',
    dur: document.getElementById('drugDur')?.value || '7 días',
    inst: document.getElementById('drugInst')?.value || '—',
  });
  closeModal();
  const dl = document.getElementById('rxDrugList');
  if (dl) dl.innerHTML = renderDrugItems();
  updatePreview();
}

async function saveRxToBackend() {
  const patId = document.getElementById('rxPatient')?.value;
  if (!patId || _rxDrugs.length === 0) {
    return showNotification('Selecciona un paciente y agrega al menos un medicamento', 'error');
  }

  // Save each drug as a separate prescription
  try {
    for (const d of _rxDrugs) {
      await API.createPrescription({
        patientId: patId,
        medication: `${d.name} ${d.dose}`,
        dosage: d.dose,
        frequency: d.freq,
        duration: d.dur,
        notes: d.inst,
      });
    }
    showNotification(`${_rxDrugs.length} medicamento(s) guardados exitosamente`, 'success');
  } catch (err) {
    showNotification(err.message || 'Error al guardar receta', 'error');
  }
}

function printPrescription() {
  const prev = document.getElementById('rxPreview');
  if (!prev) return;
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>Receta NERVE</title>
  <style>body{font-family:Inter,sans-serif;margin:32px;background:#fff;color:#111}@media print{body{margin:0}}</style>
  </head><body>${prev.innerHTML}<script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`);
  win.document.close();
}

async function renderRxHistory() {
  const area = document.getElementById('rxContent');
  area.innerHTML = `<div style="padding:30px;text-align:center;color:var(--text-muted)">⏳ Cargando historial...</div>`;

  let rxData = [];
  try {
    const res = await API.getPrescriptions();
    rxData = res.data || [];
  } catch (e) { rxData = []; }

  area.innerHTML = `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
    <h3 class="card-title">📋 Historial de Recetas</h3>
    <button class="btn btn-primary btn-sm" onclick="renderRxBuilder()">+ Nueva receta</button>
  </div>
  <div class="card">
  ${rxData.length === 0 ?
      `<div class="empty-state" style="padding:40px"><div class="empty-state-icon">💊</div><div class="empty-state-title">Sin recetas</div><div class="empty-state-desc">Aún no hay recetas generadas.</div></div>` :
      `<div class="table-wrap"><table>
    <thead><tr><th>Medicamento</th><th>Paciente</th><th>Dosis</th><th>Frecuencia</th><th>Fecha</th><th>Estado</th></tr></thead>
    <tbody>
    ${rxData.map(r => `<tr>
      <td class="fw-700">${r.medication}</td>
      <td><div class="avatar-row"><div class="avatar sm">${(r.patient?.name || 'RX').split(' ').map(x => x[0]).slice(0, 2).join('')}</div>${r.patient?.name || '—'}</div></td>
      <td class="text-muted">${r.dosage}</td>
      <td class="text-muted">${r.frequency}</td>
      <td class="text-muted">${new Date(r.createdAt).toLocaleDateString('es-MX')}</td>
      <td><span class="badge ${r.active ? 'badge-success' : 'badge-muted'}">${r.active ? 'Activa' : 'Finalizada'}</span></td>
    </tr>`).join('')}
    </tbody>
  </table></div>`}
  </div>`;
}
