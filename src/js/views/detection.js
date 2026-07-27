/* ============================= DETECTION RESULTS VIEW CONTROLLER ============================= */
import db from '../data.js';
import router from '../router.js';
import { drawer } from '../components/drawer.js';

export function initDetection(showToast) {
  const searchInput = document.getElementById('detectionSearch');
  const severityPills = document.querySelectorAll('#severityFilter .pill');
  const timeFilter = document.querySelector('#page-detection select');

  // Search input change
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value;
      router.updateQueryParams({ q });
    });
  }

  // Severity pill change
  severityPills.forEach(pill => {
    pill.addEventListener('click', () => {
      severityPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const severity = pill.getAttribute('data-sev');
      router.updateQueryParams({ severity });
    });
  });

  // Time filter dropdown change
  if (timeFilter) {
    timeFilter.addEventListener('change', (e) => {
      const range = e.target.value.toLowerCase().replace(/ /g, '-');
      router.updateQueryParams({ range });
    });
  }

  // Row click delegation
  const tableBody = document.getElementById('detectionBody');
  if (tableBody) {
    tableBody.addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      if (row) {
        const title = row.querySelector('.row-title').textContent.trim();
        const timestampFull = row.querySelector('.mono').textContent.trim();
        // Extract time (e.g. 09:41:22)
        const timePart = timestampFull.split(' ')[1];
        
        const eventObj = db.state.events.find(ev => ev.ev === title && ev.t === timePart);
        if (eventObj) {
          drawer.showAnomalyDetails(eventObj);
        }
      }
    });
  }

  // Subscribe to URL parameter updates (routed via main.js coordinator)
  router.subscribe(({ page, query }) => {
    if (page === 'detection') {
      applyFilters(query);
    }
  });

  // Initial load filters
  const { page, query } = router.parseUrl();
  if (page === 'detection') {
    applyFilters(query);
  }

  function applyFilters(query) {
    const q = (query.q || '').toLowerCase();
    const severity = query.severity || 'all';
    const range = query.range || 'last-24-hours';

    // 1. Sync DOM components
    if (searchInput && searchInput.value !== q) {
      searchInput.value = q;
    }

    if (severityPills) {
      severityPills.forEach(p => {
        if (p.getAttribute('data-sev') === severity) {
          p.classList.add('active');
        } else {
          p.classList.remove('active');
        }
      });
    }

    if (timeFilter) {
      const optionMap = {
        'last-24-hours': 'Last 24 hours',
        'last-7-days': 'Last 7 days',
        'last-30-days': 'Last 30 days'
      };
      const expectedText = optionMap[range] || 'Last 24 hours';
      Array.from(timeFilter.options).forEach(opt => {
        opt.selected = opt.text === expectedText;
      });
    }

    // 2. Perform filtering on events list
    let filtered = db.state.events;

    if (severity !== 'all') {
      filtered = filtered.filter(e => e.sev === severity);
    }

    if (q) {
      filtered = filtered.filter(e => 
        e.ev.toLowerCase().includes(q) || 
        e.comp.toLowerCase().includes(q) || 
        e.ip.includes(q)
      );
    }

    // 3. Render filtered results
    renderTable(filtered);
    updateMetrics(filtered);
  }
}

function renderTable(list) {
  const container = document.getElementById('detectionBody');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state" style="padding: 40px; text-align: center;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin:0 auto 8px; opacity:.5;"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <div>No anomalies match the current filters</div>
        </td>
      </tr>
    `;
    return;
  }

  const sevColor = { critical: 'var(--danger)', high: 'var(--warning)', medium: 'var(--cyan)' };
  const sevBadge = s => {
    const badgeType = s === 'critical' ? 'danger' : s === 'high' ? 'warning' : 'primary';
    return `<span class="badge badge-${badgeType}"><span class="badge-dot"></span>${s}</span>`;
  };

  container.innerHTML = list.map(e => `
    <tr style="cursor: pointer;">
      <td class="mono">2026-07-27 ${e.t}</td>
      <td class="row-title">${e.ev}</td>
      <td class="mono">${e.comp}</td>
      <td>
        <div class="score-bar-wrap">
          <div class="score-track">
            <div class="score-fill" style="width:${e.score * 100}%; background:${sevColor[e.sev]};"></div>
          </div>
          <span class="mono" style="font-size:12px;">${e.score.toFixed(2)}</span>
        </div>
      </td>
      <td>${sevBadge(e.sev)}</td>
      <td class="mono">${e.ip}</td>
      <td><button class="btn btn-ghost btn-sm">Investigate</button></td>
    </tr>
  `).join('');
}

function updateMetrics(list) {
  const countEl = document.querySelector('#page-detection .grid-4 .card:nth-child(3) .kpi-value');
  const avgScoreEl = document.querySelector('#page-detection .grid-4 .card:nth-child(4) .kpi-value');
  
  if (countEl) {
    countEl.textContent = list.filter(e => e.score >= 0.75).length.toLocaleString();
  }

  if (avgScoreEl && list.length > 0) {
    const sum = list.reduce((acc, curr) => acc + curr.score, 0);
    avgScoreEl.textContent = (sum / list.length).toFixed(3);
  } else if (avgScoreEl) {
    avgScoreEl.textContent = '0.000';
  }
}

export default { initDetection };
