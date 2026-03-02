// ================================================
// NERVE — Charts Utility (pure JS/SVG)
// ================================================

function renderBarChart(containerId, data, labels, options = {}) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const max = Math.max(...data, 1);
    const h = options.height || 140;
    const color = options.color || 'var(--cyan-mid)';
    el.innerHTML = `<div class="bar-chart" style="height:${h}px">
    ${data.map((v, i) => `
    <div class="bar-item">
      <div class="bar-fill" style="height:${Math.round((v / max) * 100)}%" title="${labels[i]}: ${v}">
        <span class="bar-val">${v}</span>
      </div>
      <div class="bar-label">${labels[i]}</div>
    </div>`).join('')}
  </div>`;
}

function renderSparkline(containerId, values, trend = 'neutral') {
    const el = document.getElementById(containerId);
    if (!el) return;
    const max = Math.max(...values); const min = Math.min(...values);
    const w = 80; const h = 30;
    const pts = values.map((v, i) => {
        const x = (i / (values.length - 1)) * w;
        const y = h - ((v - min) / (max - min + 0.01)) * h;
        return `${x},${y}`;
    }).join(' ');
    el.innerHTML = `<svg class="sparkline ${trend}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <polyline points="${pts}" fill="none" stroke-width="1.5" stroke="${trend === 'up' ? 'var(--success)' : trend === 'down' ? 'var(--danger)' : 'var(--cyan-mid)'}" />
  </svg>`;
}

function renderDonutChart(containerId, slices) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const total = slices.reduce((a, b) => a + b.value, 0);
    const r = 40; const cx = 50; const cy = 50;
    const circumference = 2 * Math.PI * r;
    let offset = 0;
    const segments = slices.map(s => {
        const pct = s.value / total;
        const dash = pct * circumference;
        const gap = circumference - dash;
        const seg = { ...s, dash, gap, offset };
        offset += dash;
        return seg;
    });
    el.innerHTML = `
  <div class="donut-wrap">
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--dark-4)" stroke-width="14"/>
      ${segments.map(s => `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}"
        stroke-width="14" stroke-dasharray="${s.dash.toFixed(2)} ${s.gap.toFixed(2)}"
        stroke-dashoffset="${(-s.offset + circumference / 4).toFixed(2)}"
        style="transition:stroke-dasharray 0.6s ease"/>
      `).join('')}
      <text x="${cx}" y="${cy + 5}" text-anchor="middle" fill="var(--text)" font-size="14" font-weight="700" font-family="Inter">${total}</text>
    </svg>
    <div class="donut-legend">
      ${slices.map(s => `<div class="donut-legend-item"><div class="donut-legend-dot" style="background:${s.color}"></div><span>${s.label}</span><strong style="margin-left:auto;padding-left:12px">${s.value}</strong></div>`).join('')}
    </div>
  </div>`;
}

function renderLineChart(containerId, datasets, labels, options = {}) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const w = el.clientWidth || 400; const h = options.height || 120;
    const allVals = datasets.flatMap(d => d.values);
    const max = Math.max(...allVals, 1); const min = 0;
    const colors = ['var(--cyan-mid)', 'var(--mint)', 'var(--warning)'];
    const toX = i => 32 + (i / (labels.length - 1)) * (w - 48);
    const toY = v => h - 16 - ((v - min) / (max - min + 0.01)) * (h - 28);
    el.innerHTML = `<svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}" style="overflow:visible">
    <!-- Grid lines -->
    ${[0, 25, 50, 75, 100].map(p => {
        const y = toY((p / 100) * max);
        return `<line x1="32" y1="${y}" x2="${w - 16}" y2="${y}" stroke="var(--border)" stroke-width="1"/>
              <text x="28" y="${y + 4}" text-anchor="end" fill="var(--text-dim)" font-size="9" font-family="Inter">${Math.round((p / 100) * max)}</text>`;
    }).join('')}
    <!-- X labels -->
    ${labels.map((l, i) => `<text x="${toX(i)}" y="${h - 2}" text-anchor="middle" fill="var(--text-dim)" font-size="9" font-family="Inter">${l}</text>`).join('')}
    <!-- Lines -->
    ${datasets.map((ds, di) => {
        const pts = ds.values.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
        const fillPts = `${toX(0)},${toY(0)} ${ds.values.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')} ${toX(ds.values.length - 1)},${toY(0)}`;
        return `<polygon points="${fillPts}" fill="${colors[di]}" opacity="0.08"/>
              <polyline points="${pts}" fill="none" stroke="${colors[di]}" stroke-width="2" stroke-linejoin="round"/>
              ${ds.values.map((v, i) => `<circle cx="${toX(i)}" cy="${toY(v)}" r="3" fill="${colors[di]}" />`).join('')}`;
    }).join('')}
  </svg>`;
}
