// ================================================
// NERVE — CSV/Excel Data Importer Module
// ================================================

let _importFile = null;
let _importStep = 1;
let _mappings = {};

const IMPORT_COLUMNS = ['Nombre', 'Apellidos', 'Fecha nacimiento', 'Sexo', 'Teléfono', 'Email', 'Tipo sangre', 'Alergias', 'Diagnóstico previo'];
const SAMPLE_CSV_HEADERS = ['first_name', 'last_name', 'birthdate', 'gender', 'phone', 'email', 'blood_type', 'allergies', 'diagnosis'];
const SAMPLE_ROWS = [
  ['María', 'García López', '1992-03-15', 'F', '+52 55 1234 5678', 'maria@email.com', 'O+', 'Penicilina', 'HTA'],
  ['Carlos', 'Mendoza Ruiz', '1974-07-28', 'M', '+52 55 2345 6789', 'c.mendoza@email.com', 'A+', '', 'DM2'],
  ['Ana', 'Ruiz Jiménez', '1998-11-04', 'F', '+52 55 3456 7890', 'ana.ruiz@email.com', 'B-', 'Ibuprofeno', ''],
  ['Pedro', 'Hernández Torres', '1959-02-20', 'M', '+52 55 4567 8901', 'pedro.h@email.com', 'AB+', 'Sulfonamidas', 'Cardiopatía'],
  ['Laura', 'Vega Torres', '1981-09-12', 'F', '+52 55 5678 9012', 'lauravega@email.com', 'A-', 'Látex', ''],
];

function renderImporter() {
  const pc = document.getElementById('pageContent');
  _importStep = 1;
  _importFile = null;
  pc.innerHTML = `
  <div class="page-header">
    <div><div class="page-title">📤 Importador de Datos Masivo</div>
    <div class="page-subtitle">Migra tu base de pacientes desde CSV o Excel en minutos</div></div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="downloadTemplate()">📥 Descargar plantilla CSV</button>
    </div>
  </div>

  <!-- Steps -->
  <div style="display:flex;align-items:center;gap:0;margin-bottom:28px" id="importSteps">
    ${[
      { n: 1, label: 'Subir archivo' },
      { n: 2, label: 'Mapear columnas' },
      { n: 3, label: 'Vista previa' },
      { n: 4, label: 'Importar' },
    ].map((s, i, arr) => `
    <div style="display:flex;align-items:center;flex:1">
      <div style="display:flex;align-items:center;gap:8px">
        <div id="step${s.n}Dot" style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;transition:.3s;
          background:${s.n === 1 ? 'var(--cyan-mid)' : 'var(--dark-4)'};
          color:${s.n === 1 ? '#fff' : 'var(--text-muted)'};
          border:2px solid ${s.n === 1 ? 'var(--cyan-mid)' : 'var(--border)'}">
          ${s.n}
        </div>
        <span id="step${s.n}Label" style="font-size:0.82rem;font-weight:${s.n === 1 ? '700' : '400'};color:${s.n === 1 ? 'var(--text)' : 'var(--text-muted)'}">${s.label}</span>
      </div>
      ${i < arr.length - 1 ? `<div style="flex:1;height:1px;background:var(--border);margin:0 12px"></div>` : ''}
    </div>`).join('')}
  </div>

  <div id="importBody">
    ${renderImportStep1()}
  </div>`;
}

function renderImportStep1() {
  return `
  <div class="card">
    <div class="file-drop" id="fileDrop" onclick="document.getElementById('fileInput').click()"
      ondragover="event.preventDefault();this.classList.add('dragover')"
      ondragleave="this.classList.remove('dragover')"
      ondrop="handleFileDrop(event)">
      <div class="file-drop-icon">📂</div>
      <div class="file-drop-label">Arrastra tu archivo aquí o haz clic para seleccionar</div>
      <div class="file-drop-hint">Formatos admitidos: .CSV, .XLSX, .XLS · Máximo 10,000 filas</div>
      <input type="file" id="fileInput" style="display:none" accept=".csv,.xlsx,.xls" onchange="handleFileSelect(event)" />
    </div>
    <div id="fileInfo" style="display:none;margin-top:16px;padding:14px;background:var(--dark-4);border-radius:8px;display:flex;align-items:center;gap:12px">
      <div style="font-size:1.6rem">📄</div>
      <div style="flex:1">
        <div class="fw-700" id="fileName">archivo.csv</div>
        <div class="text-muted fs-xs" id="fileSize">2.4 MB · 847 filas detectadas</div>
      </div>
      <button class="btn btn-danger btn-sm" onclick="clearFile()">✕ Quitar</button>
    </div>
    <div style="margin-top:20px;display:flex;justify-content:flex-end">
      <button class="btn btn-primary" id="nextBtn" disabled onclick="goToStep2()">Siguiente: Mapear columnas →</button>
    </div>
  </div>`;
}

function handleFileDrop(e) {
  e.preventDefault();
  document.getElementById('fileDrop').classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) processFile(file);
}
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) processFile(file);
}
function processFile(file) {
  _importFile = file;
  document.getElementById('fileInfo').style.display = 'flex';
  document.getElementById('fileName').textContent = file.name;
  document.getElementById('fileSize').textContent = `${(file.size / 1024).toFixed(1)} KB · ~847 filas detectadas`;
  const btn = document.getElementById('nextBtn');
  if (btn) { btn.disabled = false; }
}
function clearFile() {
  _importFile = null;
  const fi = document.getElementById('fileInfo'); if (fi) fi.style.display = 'none';
  const btn = document.getElementById('nextBtn'); if (btn) btn.disabled = true;
}
function downloadTemplate() {
  const csv = IMPORT_COLUMNS.join(',') + '\n' + SAMPLE_ROWS.map(r => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'nerve_plantilla_pacientes.csv'; a.click();
}

function activateStep(n) {
  [1, 2, 3, 4].forEach(s => {
    const dot = document.getElementById(`step${s}Dot`);
    const lbl = document.getElementById(`step${s}Label`);
    if (!dot || !lbl) return;
    if (s < n) { dot.style.background = 'var(--success)'; dot.style.borderColor = 'var(--success)'; dot.style.color = '#fff'; dot.innerHTML = '✓'; }
    else if (s === n) { dot.style.background = 'var(--cyan-mid)'; dot.style.borderColor = 'var(--cyan-mid)'; dot.style.color = '#fff'; dot.innerHTML = s; }
    else { dot.style.background = 'var(--dark-4)'; dot.style.borderColor = 'var(--border)'; dot.style.color = 'var(--text-muted)'; dot.innerHTML = s; }
    lbl.style.fontWeight = s === n ? '700' : '400';
    lbl.style.color = s === n ? 'var(--text)' : 'var(--text-muted)';
  });
}

function goToStep2() {
  _importStep = 2; activateStep(2);
  document.getElementById('importBody').innerHTML = `
  <div class="card">
    <div class="card-header"><span class="card-title">🔗 Mapeo de columnas</span>
    <span class="badge badge-mint">Detección automática activa</span></div>
    <p style="font-size:0.84rem;color:var(--text-muted);margin-bottom:16px">
      Hemos detectado ${SAMPLE_CSV_HEADERS.length} columnas en tu archivo. Verifica que el mapeo sea correcto y ajusta donde sea necesario.
    </p>
    <div class="table-wrap"><table>
      <thead><tr><th>Columna en tu archivo</th><th>Muestra</th><th>Campo en NERVE</th><th>Estado</th></tr></thead>
      <tbody>
      ${SAMPLE_CSV_HEADERS.map((col, i) => `<tr>
        <td class="fw-700 text-cyan">${col}</td>
        <td class="text-muted fs-xs">${SAMPLE_ROWS[0][i] || '—'}</td>
        <td><select class="form-control" style="width:180px" id="map_${col}">
          <option value="">-- No importar --</option>
          ${IMPORT_COLUMNS.map(c => `<option value="${c}" ${IMPORT_COLUMNS[i] === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select></td>
        <td><span class="badge ${IMPORT_COLUMNS[i] ? 'badge-success' : 'badge-warning'}">${IMPORT_COLUMNS[i] ? '✓ Mapeado' : '⚠ Revisar'}</span></td>
      </tr>`).join('')}
      </tbody>
    </table></div>
    <div style="display:flex;justify-content:space-between;margin-top:20px">
      <button class="btn btn-secondary" onclick="renderImporter()">← Volver</button>
      <button class="btn btn-primary" onclick="goToStep3()">Vista previa →</button>
    </div>
  </div>`;
}

function goToStep3() {
  _importStep = 3; activateStep(3);
  document.getElementById('importBody').innerHTML = `
  <div class="card">
    <div class="card-header"><span class="card-title">👁 Vista previa (primeras 5 filas)</span>
    <span class="badge badge-cyan">${SAMPLE_ROWS.length} filas de 847 total</span></div>
    <div class="table-wrap"><table>
      <thead><tr>${IMPORT_COLUMNS.map(c => `<th>${c}</th>`).join('')}</tr></thead>
      <tbody>${SAMPLE_ROWS.map(r => `<tr>${r.map(v => `<td class="text-muted">${v || '—'}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>
    <div style="margin-top:16px;padding:12px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);border-radius:8px;font-size:0.84rem">
      ✅ <strong>847 filas listos para importar</strong> · 0 errores de validación detectados
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:20px">
      <button class="btn btn-secondary" onclick="goToStep2()">← Ajustar mapeo</button>
      <button class="btn btn-primary" onclick="goToStep4()">🚀 Iniciar importación</button>
    </div>
  </div>`;
}

function goToStep4() {
  _importStep = 4; activateStep(4);
  document.getElementById('importBody').innerHTML = `
  <div class="card" style="text-align:center">
    <div style="font-size:2rem;margin-bottom:12px">🚀</div>
    <div class="fw-700" style="font-size:1.1rem;margin-bottom:8px">Importando pacientes...</div>
    <div class="text-muted mb-4">Procesando 847 registros. Por favor espera.</div>
    <div class="progress-bar" style="margin:0 auto 20px;max-width:400px">
      <div class="progress-fill" id="importProgress" style="width:0%"></div>
    </div>
    <div id="importStatus" class="text-muted fs-sm">0 / 847 registros procesados</div>
  </div>`;

  let prog = 0;
  const interval = setInterval(() => {
    prog = Math.min(100, prog + Math.random() * 15);
    const pEl = document.getElementById('importProgress');
    const sEl = document.getElementById('importStatus');
    if (pEl) pEl.style.width = prog + '%';
    if (sEl) sEl.textContent = `${Math.round(prog / 100 * 847)} / 847 registros procesados`;
    if (prog >= 100) {
      clearInterval(interval);
      const body = document.getElementById('importBody');
      if (body) body.innerHTML = `
      <div class="card" style="text-align:center;padding:48px">
        <div style="font-size:3rem;margin-bottom:16px">✅</div>
        <div class="fw-700" style="font-size:1.2rem;margin-bottom:8px">¡Importación completada!</div>
        <div class="text-muted mb-4">847 pacientes importados exitosamente. 0 errores.</div>
        <div style="display:flex;justify-content:center;gap:12px">
          <button class="btn btn-secondary" onclick="renderImporter()">Nueva importación</button>
          <button class="btn btn-primary" onclick="navigate('patients')">Ver pacientes →</button>
        </div>
      </div>`;
    }
  }, 200);
}
