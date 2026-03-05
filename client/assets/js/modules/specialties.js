// ================================================
// NERVE — Specialty Configuration Registry
// Maps each specialty to its UI variations
// ================================================

const SPECIALTIES = {
    // ---- FASE 1 ----
    'Medicina General': {
        icon: '🩺', color: '#11718B',
        aliases: ['Medicina Familiar', 'Family Medicine', 'General Practice', 'Médico General'],
        clinicalFields: [
            { key: 'soap_s', label: 'Subjetivo (S)', type: 'textarea', placeholder: 'Motivo de consulta, síntomas referidos por el paciente...' },
            { key: 'soap_o', label: 'Objetivo (O)', type: 'textarea', placeholder: 'Exploración física, signos vitales, hallazgos...' },
            { key: 'soap_a', label: 'Análisis (A)', type: 'textarea', placeholder: 'Diagnóstico diferencial, impresión diagnóstica...' },
            { key: 'soap_p', label: 'Plan (P)', type: 'textarea', placeholder: 'Tratamiento, estudios, seguimiento...' },
        ],
        vitals: [
            { key: 'bp', label: 'Presión Arterial', unit: 'mmHg', placeholder: '120/80' },
            { key: 'hr', label: 'Frec. Cardíaca', unit: 'bpm', placeholder: '72' },
            { key: 'temp', label: 'Temperatura', unit: '°C', placeholder: '36.5' },
            { key: 'rr', label: 'Frec. Respiratoria', unit: 'rpm', placeholder: '16' },
            { key: 'spo2', label: 'SpO2', unit: '%', placeholder: '98' },
            { key: 'weight', label: 'Peso', unit: 'kg', placeholder: '70' },
            { key: 'height', label: 'Talla', unit: 'cm', placeholder: '170' },
        ],
        dashMetrics: ['patients', 'appointments', 'prescriptions'],
        prescriptionMode: 'standard',
    },

    'Medicina Interna': {
        icon: '🫀', color: '#06CFD7',
        aliases: ['Internal Medicine', 'Internista'],
        clinicalFields: [
            { key: 'soap_s', label: 'Subjetivo', type: 'textarea', placeholder: 'Síntomas, antecedentes...' },
            { key: 'soap_o', label: 'Objetivo', type: 'textarea', placeholder: 'Exploración física...' },
            { key: 'metabolic', label: 'Panel Metabólico', type: 'textarea', placeholder: 'Glucosa, HbA1c, perfil lipídico, función renal...' },
            { key: 'soap_p', label: 'Plan', type: 'textarea', placeholder: 'Tratamiento, interconsultas...' },
        ],
        vitals: [
            { key: 'bp', label: 'Presión Arterial', unit: 'mmHg', placeholder: '120/80' },
            { key: 'hr', label: 'Frec. Cardíaca', unit: 'bpm', placeholder: '72' },
            { key: 'glucose', label: 'Glucosa', unit: 'mg/dL', placeholder: '95' },
            { key: 'hba1c', label: 'HbA1c', unit: '%', placeholder: '5.6' },
            { key: 'weight', label: 'Peso', unit: 'kg', placeholder: '70' },
        ],
        dashMetrics: ['patients', 'appointments', 'prescriptions'],
        prescriptionMode: 'standard',
    },

    'Pediatría': {
        icon: '👶', color: '#49BEAE',
        aliases: ['Pediatrics', 'Pediatra'],
        clinicalFields: [
            { key: 'growth', label: 'Curva de Crecimiento', type: 'textarea', placeholder: 'Percentil peso/talla, perímetro cefálico...' },
            { key: 'vaccines', label: 'Cartilla de Vacunación', type: 'textarea', placeholder: 'Vacunas aplicadas, pendientes, esquema...' },
            { key: 'development', label: 'Desarrollo Psicomotor', type: 'textarea', placeholder: 'Hitos alcanzados, evaluación del desarrollo...' },
            { key: 'feeding', label: 'Alimentación', type: 'textarea', placeholder: 'Lactancia, alimentación complementaria, dieta...' },
        ],
        vitals: [
            { key: 'weight', label: 'Peso', unit: 'kg', placeholder: '12' },
            { key: 'height', label: 'Talla', unit: 'cm', placeholder: '85' },
            { key: 'head_circ', label: 'Perímetro Cefálico', unit: 'cm', placeholder: '47' },
            { key: 'temp', label: 'Temperatura', unit: '°C', placeholder: '36.5' },
            { key: 'hr', label: 'Frec. Cardíaca', unit: 'bpm', placeholder: '110' },
        ],
        dashMetrics: ['patients', 'appointments', 'vaccines'],
        prescriptionMode: 'pediatric', // dosis por kg
    },

    'Psiquiatría': {
        icon: '🧠', color: '#8B5CF6',
        aliases: ['Psychiatry', 'Psiquiatra'],
        clinicalFields: [
            { key: 'phq9', label: 'Escala PHQ-9 (Depresión)', type: 'number', placeholder: '0-27' },
            { key: 'gad7', label: 'Escala GAD-7 (Ansiedad)', type: 'number', placeholder: '0-21' },
            { key: 'risk', label: 'Evaluación de Riesgo', type: 'select', options: ['Bajo', 'Moderado', 'Alto', 'Crítico'] },
            { key: 'session_notes', label: 'Notas de Sesión', type: 'textarea', placeholder: 'Observaciones clínicas, estado mental, evolución...' },
            { key: 'therapeutic_plan', label: 'Plan Terapéutico', type: 'textarea', placeholder: 'Objetivos, tipo de terapia, frecuencia...' },
        ],
        vitals: [],
        dashMetrics: ['patients', 'appointments', 'risk_patients'],
        prescriptionMode: 'controlled', // medicamentos controlados
    },

    'Ginecología': {
        icon: '🩷', color: '#EC4899',
        aliases: ['Ginecología y Obstetricia', 'Obstetricia', 'Gynecology', 'OB-GYN', 'Ginecóloga', 'Ginecólogo'],
        clinicalFields: [
            { key: 'fum', label: 'Fecha Última Menstruación', type: 'date', placeholder: '' },
            { key: 'gestational_weeks', label: 'Semanas de Gestación', type: 'number', placeholder: '0' },
            { key: 'pap', label: 'Último Papanicolaou', type: 'textarea', placeholder: 'Fecha y resultado...' },
            { key: 'mammography', label: 'Última Mamografía', type: 'textarea', placeholder: 'Fecha y resultado...' },
            { key: 'ob_notes', label: 'Notas Obstétricas', type: 'textarea', placeholder: 'Control prenatal, ultrasonidos, G/P/A...' },
        ],
        vitals: [
            { key: 'bp', label: 'Presión Arterial', unit: 'mmHg', placeholder: '120/80' },
            { key: 'weight', label: 'Peso', unit: 'kg', placeholder: '65' },
            { key: 'fetal_hr', label: 'FCF (Frec. Fetal)', unit: 'bpm', placeholder: '140' },
            { key: 'fundal_height', label: 'Altura Uterina', unit: 'cm', placeholder: '28' },
        ],
        dashMetrics: ['patients', 'appointments', 'pregnant_patients'],
        prescriptionMode: 'standard',
    },

    'Cardiología': {
        icon: '❤️', color: '#EF4444',
        aliases: ['Cardiology', 'Cardiólogo', 'Cardióloga'],
        clinicalFields: [
            { key: 'ecg', label: 'Resultado ECG', type: 'textarea', placeholder: 'Ritmo, intervalo PR, QRS, ST...' },
            { key: 'echo', label: 'Ecocardiograma', type: 'textarea', placeholder: 'FEVI, dimensiones, válvulas...' },
            { key: 'stress_test', label: 'Prueba de Esfuerzo', type: 'textarea', placeholder: 'Resultado, capacidad funcional...' },
            { key: 'cv_risk', label: 'Riesgo Cardiovascular', type: 'select', options: ['Bajo', 'Moderado', 'Alto', 'Muy Alto'] },
        ],
        vitals: [
            { key: 'bp_sys', label: 'PA Sistólica', unit: 'mmHg', placeholder: '120' },
            { key: 'bp_dia', label: 'PA Diastólica', unit: 'mmHg', placeholder: '80' },
            { key: 'hr', label: 'Frec. Cardíaca', unit: 'bpm', placeholder: '72' },
            { key: 'ef', label: 'Fracción de Eyección', unit: '%', placeholder: '60' },
        ],
        dashMetrics: ['patients', 'appointments', 'high_risk_patients'],
        prescriptionMode: 'standard',
    },

    'Psicología': {
        icon: '💭', color: '#A78BFA',
        aliases: ['Psychology', 'Psicólogo', 'Psicóloga', 'Clinical Psychology'],
        clinicalFields: [
            { key: 'phq9', label: 'Escala PHQ-9 (Depresión)', type: 'number', placeholder: '0-27' },
            { key: 'gad7', label: 'Escala GAD-7 (Ansiedad)', type: 'number', placeholder: '0-21' },
            { key: 'dass21', label: 'Escala DASS-21', type: 'number', placeholder: '0-63' },
            { key: 'therapy_type', label: 'Tipo de Terapia', type: 'select', options: ['Cognitivo-Conductual', 'Humanista', 'Psicoanalítica', 'Sistémica', 'Gestalt', 'EMDR', 'Otra'] },
            { key: 'session_num', label: 'Número de Sesión', type: 'number', placeholder: '1' },
            { key: 'session_notes', label: 'Notas de Sesión', type: 'textarea', placeholder: 'Observaciones, temas trabajados, estado emocional...' },
            { key: 'therapeutic_plan', label: 'Plan Terapéutico', type: 'textarea', placeholder: 'Objetivos terapéuticos, tareas, progreso...' },
            { key: 'homework', label: 'Tareas para el Paciente', type: 'textarea', placeholder: 'Ejercicios, actividades, registros...' },
        ],
        vitals: [],
        dashMetrics: ['patients', 'sessions', 'active_plans'],
        prescriptionMode: 'none', // Psicólogos no recetan → Plan terapéutico
    },

    'Odontología': {
        icon: '🦷', color: '#06B6D4',
        aliases: ['Dentistry', 'Dentista', 'Odontólogo', 'Odontóloga', 'Cirujano Dentista'],
        clinicalFields: [
            { key: 'odontogram', label: 'Odontograma', type: 'textarea', placeholder: 'Estado por pieza: 11-OK, 12-Caries, 16-Endodoncia...' },
            { key: 'procedure', label: 'Procedimiento Realizado', type: 'select', options: ['Limpieza', 'Endodoncia', 'Extracción', 'Obturación', 'Corona', 'Implante', 'Ortodoncia', 'Blanqueamiento', 'Cirugía', 'Otro'] },
            { key: 'affected_teeth', label: 'Piezas Afectadas', type: 'text', placeholder: 'Ej: 11, 16, 26, 36' },
            { key: 'dental_notes', label: 'Notas del Tratamiento', type: 'textarea', placeholder: 'Hallazgos, procedimiento realizado, indicaciones...' },
            { key: 'next_procedure', label: 'Próximo Procedimiento', type: 'text', placeholder: 'Ej: Corona pieza 16' },
        ],
        vitals: [],
        dashMetrics: ['patients', 'appointments', 'procedures'],
        prescriptionMode: 'standard',
    },
};

// ---- Helper Functions ----

function getSpecialtyConfig(specialtyName) {
    if (!specialtyName) return SPECIALTIES['Medicina General'];
    // Direct match
    if (SPECIALTIES[specialtyName]) return SPECIALTIES[specialtyName];
    // Search by alias
    const lower = specialtyName.toLowerCase();
    for (const [key, cfg] of Object.entries(SPECIALTIES)) {
        if (key.toLowerCase() === lower) return cfg;
        if (cfg.aliases.some(a => a.toLowerCase() === lower)) return cfg;
    }
    // Partial match
    for (const [key, cfg] of Object.entries(SPECIALTIES)) {
        if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return cfg;
        if (cfg.aliases.some(a => lower.includes(a.toLowerCase()) || a.toLowerCase().includes(lower))) return cfg;
    }
    // Fallback to general
    return SPECIALTIES['Medicina General'];
}

function getSpecialtyList() {
    return Object.entries(SPECIALTIES).map(([name, cfg]) => ({
        name, icon: cfg.icon, color: cfg.color,
    }));
}

function renderClinicalFields(specialty, existingData = {}) {
    const cfg = getSpecialtyConfig(specialty);
    if (!cfg.clinicalFields || cfg.clinicalFields.length === 0) return '';

    return `
  <div class="card" style="margin-bottom:16px">
    <div class="card-header">
      <span class="card-title">${cfg.icon} Campos Clínicos — ${specialty || 'General'}</span>
      <span class="badge" style="background:${cfg.color}20;color:${cfg.color}">${cfg.icon} ${specialty}</span>
    </div>
    ${cfg.clinicalFields.map(f => {
        const val = existingData[f.key] || '';
        if (f.type === 'textarea') {
            return `<div class="form-group"><label class="form-label">${f.label}</label><textarea class="form-control clinical-field" data-key="${f.key}" rows="2" placeholder="${f.placeholder}">${val}</textarea></div>`;
        } else if (f.type === 'select') {
            return `<div class="form-group"><label class="form-label">${f.label}</label><select class="form-control clinical-field" data-key="${f.key}">
          <option value="">-- Seleccionar --</option>
          ${f.options.map(o => `<option ${val === o ? 'selected' : ''}>${o}</option>`).join('')}
        </select></div>`;
        } else if (f.type === 'date') {
            return `<div class="form-group"><label class="form-label">${f.label}</label><input class="form-control clinical-field flatpickr-date" data-key="${f.key}" type="text" value="${val}" placeholder="DD/MM/AAAA" /></div>`;
        } else {
            return `<div class="form-group"><label class="form-label">${f.label}</label><input class="form-control clinical-field" data-key="${f.key}" type="${f.type || 'text'}" placeholder="${f.placeholder}" value="${val}" /></div>`;
        }
    }).join('')}
  </div>`;
}

function renderVitalsFields(specialty, existingData = {}) {
    const cfg = getSpecialtyConfig(specialty);
    if (!cfg.vitals || cfg.vitals.length === 0) return '';

    return `
  <div class="card" style="margin-bottom:16px">
    <div class="card-header"><span class="card-title">📊 Signos Vitales</span></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px">
      ${cfg.vitals.map(v => `
        <div class="form-group" style="margin:0">
          <label class="form-label" style="font-size:0.72rem">${v.label} <span style="color:var(--text-dim)">(${v.unit})</span></label>
          <input class="form-control vital-field" data-key="${v.key}" type="text" placeholder="${v.placeholder}" value="${existingData[v.key] || ''}" style="font-size:0.85rem" />
        </div>`).join('')}
    </div>
  </div>`;
}

function collectClinicalData() {
    const data = {};
    document.querySelectorAll('.clinical-field').forEach(el => {
        if (el.value) data[el.dataset.key] = el.value;
    });
    document.querySelectorAll('.vital-field').forEach(el => {
        if (el.value) data[el.dataset.key] = el.value;
    });
    return data;
}
