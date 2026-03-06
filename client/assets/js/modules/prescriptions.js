// ================================================
// NERVE — Prescriptions Module (API-Connected)
// ================================================

let _rxSheets = [
  [{ id: Date.now(), name: 'Paracetamol', dose: '500 mg', form: 'Tabletas', freq: 'Cada 8 horas', dur: '5 días', inst: 'Tomar con comida. No exceder 3g/día.' }]
];
let _activeSheetIdx = 0;
let _rxPatients = [];

function renderPrescriptions() {
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `
  <div class="page-header">
    <div><div class="page-title">💊 Recetas Digitales</div><div class="page-subtitle">Historial y gestión de prescripciones</div></div>
    <div class="page-actions">
      <button class="btn btn-primary" onclick="renderRxBuilder()">+ Nueva receta (General)</button>
    </div>
  </div>
  <div id="rxContent"></div>`;
  renderRxHistory();
}

async function renderRxBuilder(data = null) {
  const area = document.getElementById('rxContent');
  area.innerHTML = `<div style="padding:30px;text-align:center;color:var(--text-muted)">⏳ Cargando...</div>`;

  // Reset sheets if starting fresh
  if (!data || !data.keepSheets) {
    _rxSheets = [
      [{ id: Date.now(), name: '', dose: '', form: '', freq: '', dur: '', inst: '' }]
    ];
    _activeSheetIdx = 0;
  }

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
            <input class="form-control" id="rxPatientInput" placeholder="Buscar paciente..." autocomplete="off" />
            <input type="hidden" id="rxPatientId" />
          </div>
          <div class="form-group"><label class="form-label">Fecha</label>
            <input class="form-control" id="rxDate" type="text" placeholder="Seleccionar fecha..." onchange="_debouncedUpdatePreview()"/>
          </div>
        </div>
        <div class="form-row form-row-2">
          <div class="form-group"><label class="form-label">Diagnóstico</label>
            <input class="form-control" id="rxDx" placeholder="CIE-10 o descripción..." oninput="_debouncedUpdatePreview()"/>
          </div>
          <div class="form-group"><label class="form-label">Tamaño de Hoja</label>
            <select class="form-control" id="rxPageSize" onchange="updatePreview()">
              <optgroup label="Formatos Comunes">
                <option value="carta">Carta (8.5" x 11")</option>
                <option value="media">Media Carta (5.5" x 8.5")</option>
                <option value="oficio">Oficio / Legal (8.5" x 14")</option>
                <option value="folio">Folio / Oficio (8.5" x 13")</option>
                <option value="a4" selected>A4 (Estándar)</option>
                <option value="a5">A5 (Pequeño)</option>
              </optgroup>
              <optgroup label="Serie A (ISO)">
                <option value="a0">A0 (Póster)</option>
                <option value="a1">A1</option>
                <option value="a2">A2</option>
                <option value="a3">A3 (Doble Carta)</option>
                <option value="a6">A6 (Postal)</option>
              </optgroup>
              <optgroup label="Serie B / Otros">
                <option value="b4">B4</option>
                <option value="b5">B5</option>
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div class="card-header">
          <span class="card-title">💊 Medicamentos (Hoja ${_activeSheetIdx + 1})</span>
          <div style="display:flex;gap:8px">
            <button class="btn btn-secondary btn-sm" onclick="addRxSheet()">+ Añadir Hoja</button>
            <button class="btn btn-primary btn-sm" onclick="openAddDrugModal()">+ Agregar Medicamento</button>
          </div>
        </div>
        
        <div id="rxSheetTabs" style="display:flex;gap:5px;padding:10px 15px;background:var(--dark-4);border-bottom:1px solid var(--border)">
          ${_rxSheets.map((_, i) => `
            <button class="btn btn-sm ${i === _activeSheetIdx ? 'btn-primary' : 'btn-secondary'}" onclick="setActiveSheet(${i})">Hoja ${i + 1}</button>
          `).join('')}
        </div>

        <div id="rxDrugList" style="padding:15px">
          ${renderDrugItems()}
        </div>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div class="card-header"><span class="card-title">📝 Indicaciones adicionales</span></div>
        <textarea class="form-control" id="rxNotes" rows="3" placeholder="Reposo relativo, dieta blanda, hidratación 2L/día..." oninput="_debouncedUpdatePreview()"></textarea>
      </div>

      <div style="display:flex;gap:10px">
        <button class="btn btn-primary" style="flex:1;justify-content:center" onclick="printPrescription()">🖨 Imprimir Todas las Hojas</button>
        <button class="btn btn-secondary" onclick="saveRxToBackend()">💾 Guardar Todo</button>
      </div>
    </div>

    <div class="card" id="rxPreviewCard" style="font-family:'Inter',sans-serif;background:var(--dark-4)">
      <div class="card-header" style="position:sticky;top:0;z-index:10;background:var(--dark-3)">
        <span class="card-title">👁 Vista previa de receta</span>
        <span class="badge badge-mint">En vivo</span>
      </div>
      <div id="rxPreview" style="padding:20px;max-height:800px;overflow-y:auto;display:flex;flex-direction:column;gap:20px"></div>
    </div>
  </div>`;

  // Init Autocomplete
  const input = document.getElementById('rxPatientInput');
  if (input) {
    APP.initAutocomplete(input, {
      data: _rxPatients,
      searchKeys: ['name', 'email'],
      onSelect: (p) => {
        document.getElementById('rxPatientId').value = p.id;
        updatePreview();
      }
    });
  }

  // Pre-fill data if provided (from Appointment)
  if (data) {
    if (data.patientId) {
      const p = _rxPatients.find(px => px.id === data.patientId);
      if (p) {
        if (input) input.value = p.name;
        document.getElementById('rxPatientId').value = p.id;
      }
    }
    if (data.diagnosis) {
      document.getElementById('rxDx').value = data.diagnosis;
    }
    if (data.notes) {
      document.getElementById('rxNotes').value = data.notes;
    }
  }

  APP.initDatePicker("#rxDate", {
    defaultDate: "today",
    onChange: () => _debouncedUpdatePreview()
  });

  updatePreview();
}

function setActiveSheet(idx) {
  _activeSheetIdx = idx;
  const area = document.getElementById('rxContent');
  // Re-render only the drug list and tabs for better performance
  const tabs = document.getElementById('rxSheetTabs');
  const list = document.getElementById('rxDrugList');
  const title = document.querySelector('.card-title');

  if (tabs) tabs.innerHTML = _rxSheets.map((_, i) => `
    <button class="btn btn-sm ${i === _activeSheetIdx ? 'btn-primary' : 'btn-secondary'}" onclick="setActiveSheet(${i})">Hoja ${i + 1}</button>
  `).join('');

  if (list) list.innerHTML = renderDrugItems();
  // Update title in medical card
  const titleEl = document.querySelectorAll('.card-header .card-title')[1];
  if (titleEl) titleEl.innerText = `💊 Medicamentos (Hoja ${_activeSheetIdx + 1})`;

  updatePreview();
}

function addRxSheet() {
  _rxSheets.push([]);
  _activeSheetIdx = _rxSheets.length - 1;
  renderRxBuilder();
  showNotification('Nueva hoja de prescripción añadida', 'info');
}

const _debouncedUpdatePreview = APP.debounce(() => updatePreview(), 300);

function renderDrugItems() {
  const currentDrugs = _rxSheets[_activeSheetIdx];
  if (currentDrugs.length === 0) return `<div class="empty-state" style="padding:24px"><div class="empty-state-icon">💊</div><div class="empty-state-desc">Sin medicamentos en esta hoja.</div></div>`;

  return currentDrugs.map((d, i) => `
  <div class="rx-drug-item">
    <div class="rx-drug-num">${i + 1}</div>
    <div style="flex:1">
      <div style="font-weight:700;font-size:0.92rem">${d.name} ${d.dose} · ${d.form}</div>
      <div style="font-size:0.8rem;color:var(--text-muted)">🔁 ${d.freq} · ⏱ ${d.dur}</div>
      <div style="font-size:0.78rem;color:var(--text-dim);margin-top:3px">💬 ${d.inst}</div>
    </div>
    <button class="btn btn-danger btn-sm" onclick="removeDrug(${i})">✕</button>
  </div>`).join('');
}

function removeDrug(idx) {
  _rxSheets[_activeSheetIdx].splice(idx, 1);
  document.getElementById('rxDrugList').innerHTML = renderDrugItems();
  updatePreview();
}

function updatePreview() {
  const prev = document.getElementById('rxPreview');
  if (!prev) return;

  const patId = document.getElementById('rxPatientId')?.value;
  const pat = _rxPatients.find(p => p.id === patId) || _rxPatients[0] || { name: '—', bloodType: '—' };
  const date = document.getElementById('rxDate')?.value || new Date().toISOString().split('T')[0];
  const dx = document.getElementById('rxDx')?.value || '—';
  const notes = document.getElementById('rxNotes')?.value || '';
  const pageSize = document.getElementById('rxPageSize')?.value || 'a4';

  const sizeDims = {
    'a0': { w: 841, h: 1189 }, 'a1': { w: 594, h: 841 }, 'a2': { w: 420, h: 594 }, 'a3': { w: 297, h: 420 },
    'a4': { w: 210, h: 297 }, 'a5': { w: 148, h: 210 }, 'a6': { w: 105, h: 148 },
    'carta': { w: 216, h: 279 }, 'oficio': { w: 216, h: 356 }, 'folio': { w: 216, h: 330 },
    'media': { w: 216, h: 140 }, // Media Carta landscape
    'b4': { w: 250, h: 353 }, 'b5': { w: 182, h: 257 }
  };

  const dim = sizeDims[pageSize] || sizeDims['a4'];
  const user = APP.liveUser || APP.currentUser[APP.currentRole] || {};
  const orgName = user.orgName || user.org || 'Clínica Médica';
  const drName = user.name || 'Dr. Médico';
  const drSpecialty = user.specialty || (APP.currentRole === 'doctor' ? 'Médico General' : '');
  const drLicense = user.license ? `Céd. Prof. ${user.license}` : '';
  const rxNumBase = 'RX-' + date.replace(/-/g, '').slice(2);

  // Calculate scaling factor based on area relative to "Carta" (Standard reference)
  // Smaller sheets need smaller fonts and margins
  const refArea = 216 * 279;
  const currentArea = dim.w * dim.h;
  const scale = Math.sqrt(currentArea / refArea);

  // Base values for "Carta" size
  const baseFontSize = 0.82; // rem
  const basePadding = 5; // %

  // Adjusted values
  const fSize = Math.max(0.45, baseFontSize * Math.pow(scale, 0.45)); // dampening with pow
  const padding = Math.max(3, basePadding * scale);

  // Visual Scaling for UI preview
  const baseWidth = 216;
  const visualScale = Math.min(1, dim.w / baseWidth);
  const maxWidthPx = Math.max(300, 500 * visualScale);

  let html = '';

  _rxSheets.forEach((sheet, sheetIdx) => {
    const rxNum = `${rxNumBase}-${sheetIdx + 1}-${String(Math.floor(Math.random() * 90) + 10)}`;

    // Aggressive density scaling to fit up to 10 drugs
    const threshold = pageSize === 'media' ? 2 : 3;
    const shrinkRate = pageSize === 'media' ? 0.08 : 0.06;
    const densityScale = Math.max(0.42, 1 - (Math.max(0, sheet.length - threshold) * shrinkRate));

    html += `
    <div class="prescription-page" style="background:#fff;color:#111;border-radius:4px;padding:${padding * densityScale}%;font-size:${fSize * densityScale}rem;width:100%;max-width:${maxWidthPx}px;margin:0 auto 20px auto;aspect-ratio: ${dim.w} / ${dim.h};box-shadow:0 4px 15px rgba(0,0,0,0.1);display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box;overflow:hidden;line-height:1.2">
      <div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:${1.5 * scale * densityScale}px solid #11718B;padding-bottom:${6 * scale * densityScale}px;margin-bottom:${8 * scale * densityScale}px">
          <div>
            <div style="font-size:${1.1 * scale * densityScale}rem;font-weight:900;color:#11718B;text-transform:uppercase;line-height:1">${orgName}</div>
            <div style="font-size:${0.6 * scale * densityScale}rem;color:#666">Servicios de Salud Profesionales</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:${0.6 * scale * densityScale}rem;color:#666;font-weight:600">HOJA ${sheetIdx + 1}/${_rxSheets.length}</div>
            <div style="font-weight:700;color:#11718B;font-size:${0.7 * scale * densityScale}rem">${rxNum}</div>
            <div style="font-size:${0.6 * scale * densityScale}rem;color:#666">${new Date(date + 'T12:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:${6 * scale * densityScale}px;background:#f0f8ff;border-radius:3px;padding:${5 * scale * densityScale}px;margin-bottom:${8 * scale * densityScale}px">
          <div><div style="font-size:${0.5 * scale * densityScale}rem;color:#666">PACIENTE</div><div style="font-weight:700;font-size:${0.75 * scale * densityScale}rem">${pat.name}</div></div>
          <div><div style="font-size:${0.5 * scale * densityScale}rem;color:#666">TIPO DE SANGRE</div><div style="font-weight:600;font-size:${0.75 * scale * densityScale}rem">${pat.bloodType || '—'}</div></div>
          <div style="grid-column: span 2"><div style="font-size:${0.5 * scale * densityScale}rem;color:#666">DIAGNÓSTICO</div><div style="font-weight:600;font-size:${0.75 * scale * densityScale}rem">${dx || '—'}</div></div>
        </div>
        
        <div style="font-weight:700;margin-bottom:${4 * scale * densityScale}px;color:#11718B;border-bottom:${1 * scale * densityScale}px solid #11718B;padding-bottom:1px;font-size:${0.65 * scale * densityScale}rem">℞ PRESCRIPCIÓN</div>
        
        <div style="flex:1">
          ${sheet.length === 0 ? `<div style="color:#999;font-style:italic;padding:4px 0;text-align:center;font-size:${0.65 * scale * densityScale}rem">Sin medicamentos en esta hoja.</div>` :
        sheet.map((d, i) => `
            <div style="margin-bottom:${3 * scale * densityScale}px;padding:${3 * scale * densityScale}px;border-left:${2 * scale * densityScale}px solid #06CFD7;background:#fafafa">
              <div style="font-weight:700;font-size:${0.75 * scale * densityScale}rem">${i + 1}. ${d.name} ${d.dose}</div>
              <div style="color:#555;font-size:${0.65 * scale * densityScale}rem">${d.freq} por ${d.dur} · ${d.form}</div>
              <div style="color:#777;font-size:${0.55 * scale * densityScale}rem;line-height:1">${d.inst}</div>
            </div>`).join('')}
        </div>
          
        ${notes && sheetIdx === _rxSheets.length - 1 ? `<div style="margin-top:${4 * scale * densityScale}px;padding:${4 * scale * densityScale}px;background:#f9f9f9;border-radius:2px;font-size:${0.55 * scale * densityScale}rem;border:1px solid #eee"><strong>Inc:</strong> ${notes}</div>` : ''}
      </div>
      
      <div style="margin-top:auto">
        <div style="display:flex;justify-content:space-between;border-top:${1 * scale * densityScale}px dashed #ccc;padding-top:${5 * scale * densityScale}px;margin-top:${5 * scale * densityScale}px">
          <div style="font-size:${0.6 * scale * densityScale}rem;color:#666">
            <strong style="color:#111">${drName}</strong><br>
            <span style="font-size:0.9em;font-weight:600;display:block;line-height:1.2">${drSpecialty}</span>
            <span style="font-size:0.85em;display:block;margin-top:1px">${drLicense}</span>
            <span style="font-size:0.85em;display:block">${orgName}</span>
          </div>
          <div style="width:${80 * scale * densityScale}px;height:${30 * scale * densityScale}px;border-bottom:${1 * scale * densityScale}px solid #333;text-align:center;font-size:${0.5 * scale * densityScale}rem;color:#999;display:flex;align-items:flex-end;justify-content:center;padding-bottom:1px">Firma y Sello</div>
        </div>
        <div style="text-align:center;margin-top:${4 * scale * densityScale}px;font-size:${0.45 * scale * densityScale}rem;color:#aaa;line-height:1">
          Gestión por Sistema NERVE · Válida 30 días
        </div>
      </div>
    </div>`;
  });

  prev.innerHTML = html;
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

  _rxSheets[_activeSheetIdx].push({
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
  const patId = document.getElementById('rxPatientId')?.value;
  let totalDrugs = 0;
  _rxSheets.forEach(s => totalDrugs += s.length);

  if (!patId || totalDrugs === 0) {
    return showNotification('Selecciona un paciente y agrega medicamentos', 'error');
  }

  try {
    for (let i = 0; i < _rxSheets.length; i++) {
      for (const d of _rxSheets[i]) {
        await API.createPrescription({
          patientId: patId,
          medication: `${d.name} ${d.dose} (Hoja ${i + 1})`,
          dosage: d.dose,
          frequency: d.freq,
          duration: d.dur,
          notes: d.inst,
        });
      }
    }
    showNotification(`${totalDrugs} medicamento(s) en ${_rxSheets.length} hojas guardados correctamente`, 'success');
  } catch (err) {
    showNotification(err.message || 'Error al guardar receta', 'error');
  }
}

function printPrescription() {
  const prev = document.getElementById('rxPreview');
  if (!prev) return;
  const pageSize = document.getElementById('rxPageSize')?.value || 'a4';

  const sizeMap = {
    'a0': '841mm 1189mm', 'a1': '594mm 841mm', 'a2': '420mm 594mm', 'a3': '297mm 420mm',
    'a4': '210mm 297mm', 'a5': '148mm 210mm', 'a6': '105mm 148mm',
    'carta': 'letter', 'oficio': 'legal', 'folio': '216mm 330mm', 'media': '5.5in 8.5in',
    'b4': '250mm 353mm', 'b5': '182mm 257mm'
  };

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>Imprimir Receta</title>
  <style>
    body{font-family:Inter,sans-serif;margin:0;padding:0;background:#f5f5f5;color:#111}
    .prescription-page { 
      page-break-after: always; 
      margin: auto;
      box-shadow: none !important;
    }
    @page {
      size: ${sizeMap[pageSize] || 'auto'};
      margin: 0;
    }
    @media print {
      body { background: #fff; }
      .prescription-page { 
        padding: 15mm !important;
        min-height: 0 !important;
        height: 100vh;
      }
    }
  </style>
  </head><body><div id="print-content">${prev.innerHTML}</div><script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`);
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
    ${rxData.slice(0, 30).map(r => `<tr>
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

