// ================================================
// NERVE — Reports Module
// ================================================

function renderReports() {
    const pc = document.getElementById('pageContent');
    pc.innerHTML = `
  <div class="page-header">
    <div><div class="page-title">📈 Reportes y Analítica</div><div class="page-subtitle">Métricas de rendimiento y actividad clínica</div></div>
    <div class="page-actions">
      <select class="form-control" style="width:140px"><option>Este mes</option><option>Este trimestre</option><option>Este año</option><option>Personalizado</option></select>
      <button class="btn btn-secondary">📥 Exportar PDF</button>
      <button class="btn btn-secondary">📊 Exportar Excel</button>
    </div>
  </div>

  <div class="stats-grid stats-grid-4" style="margin-bottom:24px">
    ${[
            { icon: '📅', label: 'Consultas este mes', val: '284', chg: '+12% vs anterior', up: true },
            { icon: '👤', label: 'Pacientes nuevos', val: '42', chg: '+8% vs anterior', up: true },
            { icon: '❌', label: 'Tasa de cancelación', val: '6.2%', chg: '-1.8% mejoría', up: true },
            { icon: '⭐', label: 'Satisfacción prom.', val: '4.8/5', chg: 'Sin cambios', up: true },
        ].map(s => `<div class="stat-card">
      <div class="stat-icon" style="background:rgba(17,113,139,0.2)">${s.icon}</div>
      <div class="stat-value">${s.val}</div><div class="stat-label">${s.label}</div>
      <div class="stat-change up">↑ ${s.chg}</div>
    </div>`).join('')}
  </div>

  <div class="content-grid content-grid-1-1" style="margin-bottom:20px">
    <div class="card">
      <div class="card-header"><span class="card-title">📈 Consultas por semana</span></div>
      <div id="consultChart"></div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">🥧 Distribución por tipo</span></div>
      <div id="typeDonut"></div>
    </div>
  </div>

  <div class="card">
    <div class="card-header"><span class="card-title">🩺 Rendimiento por doctor</span>
    <button class="btn btn-secondary btn-sm">📥 Exportar</button></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Doctor</th><th>Especialidad</th><th>Consultas</th><th>Pacientes nuevos</th><th>Cancelaciones</th><th>Tasa de asistencia</th><th>Rating</th><th>Tendencia</th></tr></thead>
      <tbody>
      ${[
            { n: 'Dr. González', esp: 'Med. General', c: 84, pn: 12, ca: 5, ta: 94 },
            { n: 'Dra. Torres Ávila', esp: 'Cardiología', c: 68, pn: 8, ca: 3, ta: 96 },
            { n: 'Dr. Lima Castro', esp: 'Pediatría', c: 55, pn: 14, ca: 7, ta: 87 },
            { n: 'Dra. Valdés', esp: 'Cirugía', c: 42, pn: 4, ca: 2, ta: 95 },
            { n: 'Dr. Cruz Rivera', esp: 'Neurología', c: 35, pn: 6, ca: 4, ta: 89 },
        ].map((d, i) => {
            const sparkId = 'spk' + i;
            const vals = Array.from({ length: 6 }, () => Math.floor(Math.random() * 30) + d.c / 6);
            setTimeout(() => renderSparkline(sparkId, vals, 'up'), 60);
            return `<tr>
          <td><div class="avatar-row"><div class="avatar">${d.n.split(' ').map(x => x[0]).slice(0, 2).join('')}</div><div class="cell-primary">${d.n}</div></div></td>
          <td class="text-muted">${d.esp}</td>
          <td class="fw-700">${d.c}</td>
          <td>${d.pn}</td>
          <td class="text-danger">${d.ca}</td>
          <td><div style="display:flex;align-items:center;gap:8px">
            <div class="progress-bar" style="flex:1;height:4px"><div class="progress-fill" style="width:${d.ta}%"></div></div>
            <span style="font-size:0.78rem">${d.ta}%</span>
          </div></td>
          <td><span class="badge badge-success">⭐ ${(4.5 + Math.random() * 0.5).toFixed(1)}</span></td>
          <td><div id="${sparkId}"></div></td>
        </tr>`;
        }).join('')}
      </tbody>
    </table></div>
  </div>`;

    setTimeout(() => {
        renderLineChart('consultChart', [{ label: 'Consultas', values: [52, 68, 59, 84, 71, 74, 90] }],
            ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7'], { height: 140 });
        renderDonutChart('typeDonut', [
            { label: 'Medicina General', value: 120, color: 'var(--cyan-mid)' },
            { label: 'Cardiología', value: 68, color: 'var(--mint)' },
            { label: 'Pediatría', value: 55, color: 'var(--primary)' },
            { label: 'Cirugía', value: 41, color: 'var(--warning)' },
        ]);
    }, 80);
}
