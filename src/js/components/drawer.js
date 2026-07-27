/* ============================= DRAWER COMPONENT CONTROL ============================= */
class DetailDrawer {
  constructor() {
    this.overlay = null;
    this.drawer = null;
    this.init();
  }

  init() {
    // Create elements if they do not exist
    this.overlay = document.getElementById('drawerOverlay');
    this.drawer = document.getElementById('detailDrawer');

    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.className = 'drawer-overlay';
      this.overlay.id = 'drawerOverlay';
      document.body.appendChild(this.overlay);
    }

    if (!this.drawer) {
      this.drawer = document.createElement('div');
      this.drawer.className = 'drawer';
      this.drawer.id = 'detailDrawer';
      document.body.appendChild(this.drawer);
    }

    // Attach listeners
    this.overlay.addEventListener('click', () => this.close());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
  }

  open(title, bodyHtml, footerHtml = '') {
    this.drawer.innerHTML = `
      <div class="drawer-header">
        <h2 class="drawer-title">${title}</h2>
        <button class="drawer-close" id="drawerCloseBtn" aria-label="Close drawer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="drawer-body">
        ${bodyHtml}
      </div>
      ${footerHtml ? `<div class="drawer-footer">${footerHtml}</div>` : ''}
    `;

    document.getElementById('drawerCloseBtn').addEventListener('click', () => this.close());
    
    // Animate open
    this.overlay.style.display = 'block';
    // Small timeout to allow browser layout calculation before transition
    setTimeout(() => {
      this.overlay.classList.add('open');
      this.drawer.classList.add('open');
    }, 10);
  }

  close() {
    this.overlay.classList.remove('open');
    this.drawer.classList.remove('open');
    setTimeout(() => {
      this.overlay.style.display = 'none';
    }, 280); // match CSS transitions
  }

  // Content Builder: Log Details
  showLogDetails(file) {
    const isSuccess = file.status === 'success' || file.status === 'Processed';
    const isProcessing = file.status === 'processing' || file.status === 'Processing';
    const isFailed = file.status === 'failed' || file.status === 'Failed';

    const badgeClass = isSuccess ? 'success' : isProcessing ? 'warning' : 'danger';
    const badgeText = isSuccess ? 'Processed' : isProcessing ? 'Processing' : 'Failed';

    const schemaPreview = [
      { field: 'timestamp', type: 'datetime (ISO)', sample: '2026-07-27T09:41:22Z' },
      { field: 'level', type: 'string', sample: 'WARN' },
      { field: 'service', type: 'string', sample: 'auth-service' },
      { field: 'message', type: 'string', sample: 'Login failed - Invalid credentials' },
      { field: 'client_ip', type: 'string (ipv4)', sample: '103.42.88.101' },
      { field: 'request_id', type: 'string (uuid)', sample: 'd88b29df-d5b1-4cb5' }
    ];

    const bodyHtml = `
      <div class="drawer-section">
        <div class="drawer-section-title">Source Metadata</div>
        <div class="drawer-meta-list">
          <div class="drawer-meta-item">
            <div class="drawer-meta-label">File Size</div>
            <div class="drawer-meta-value">${file.size}</div>
          </div>
          <div class="drawer-meta-item">
            <div class="drawer-meta-label">Record Count</div>
            <div class="drawer-meta-value">${file.rec}</div>
          </div>
          <div class="drawer-meta-item">
            <div class="drawer-meta-label">Ingested At</div>
            <div class="drawer-meta-value">${file.time}</div>
          </div>
          <div class="drawer-meta-item">
            <div class="drawer-meta-label">Status</div>
            <div class="drawer-meta-value">
              <span class="badge badge-${badgeClass}">
                <span class="badge-dot"></span>${badgeText}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="drawer-section">
        <div class="drawer-section-title">Schema Ingestion Preview</div>
        <div class="table-wrap" style="border: 1px solid var(--border-soft); border-radius: var(--radius-sm); background: var(--card);">
          <table>
            <thead>
              <tr>
                <th style="padding: 8px 12px;">Field</th>
                <th style="padding: 8px 12px;">Type</th>
                <th style="padding: 8px 12px;">Sample</th>
              </tr>
            </thead>
            <tbody>
              ${schemaPreview.map(s => `
                <tr>
                  <td class="row-title mono" style="padding: 8px 12px; font-size:12px;">${s.field}</td>
                  <td class="mono" style="padding: 8px 12px; font-size:11.5px; color: var(--text-lo);">${s.type}</td>
                  <td class="mono" style="padding: 8px 12px; font-size:11.5px; color: var(--text-lo); overflow: hidden; text-overflow: ellipsis; max-width: 140px;">${s.sample}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="drawer-section">
        <div class="drawer-section-title">Parsing Diagnostics</div>
        ${isFailed ? `
          <div class="parse-error-card">
            <div style="font-weight:700; margin-bottom:4px;">FATAL: Malformed JSON stream</div>
            <div>Line 14,033: unexpected token "}" inside key string definition. Ingestion aborted to prevent record pollution.</div>
          </div>
        ` : isProcessing ? `
          <div style="font-size: 13px; color: var(--text-md);">
            Log schema discovery in progress. Parser status: <span class="text-warning font-weight-bold">78% mapped</span>.
          </div>
        ` : `
          <div style="font-size: 13px; color: var(--text-success); display:flex; align-items:center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
            No parse errors. Ingestion successful (100% parse accuracy).
          </div>
        `}
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-ghost btn-sm" id="drawerCloseFooter">Close</button>
      ${isFailed ? '<button class="btn btn-primary btn-sm">Re-verify Parser</button>' : '<button class="btn btn-secondary btn-sm"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg> Export Records</button>'}
    `;

    this.open(`Log Source: ${file.name}`, bodyHtml, footerHtml);
    document.getElementById('drawerCloseFooter').addEventListener('click', () => this.close());
  }

  // Content Builder: Anomaly Details
  showAnomalyDetails(event) {
    const sevBadgeClass = event.sev === 'critical' ? 'danger' : event.sev === 'high' ? 'warning' : 'primary';
    
    // Simulate feature contributions
    const contributions = [
      { name: 'auth_failure_count', val: 54, color: 'var(--danger)' },
      { name: 'geographic_entropy', val: 24, color: 'var(--warning)' },
      { name: 'user_agent_novelty', val: 14, color: 'var(--cyan)' },
      { name: 'access_frequency', val: 8, color: 'var(--primary)' }
    ];

    const bodyHtml = `
      <div class="drawer-section">
        <div class="drawer-section-title">Anomaly Signature</div>
        <div class="drawer-meta-list">
          <div class="drawer-meta-item">
            <div class="drawer-meta-label">Origin Component</div>
            <div class="drawer-meta-value">${event.comp}</div>
          </div>
          <div class="drawer-meta-item">
            <div class="drawer-meta-label">Anomaly Score</div>
            <div class="drawer-meta-value" style="color:var(--danger);">${event.score.toFixed(3)}</div>
          </div>
          <div class="drawer-meta-item">
            <div class="drawer-meta-label">Classification</div>
            <div class="drawer-meta-value">
              <span class="badge badge-${sevBadgeClass}">
                <span class="badge-dot"></span>${event.sev}
              </span>
            </div>
          </div>
          <div class="drawer-meta-item">
            <div class="drawer-meta-label">Attributed IP</div>
            <div class="drawer-meta-value">${event.ip}</div>
          </div>
        </div>
      </div>

      <div class="drawer-section">
        <div class="drawer-section-title">Isolation Forest Feature Contributions</div>
        <div style="background:var(--card); padding:16px; border:1px solid var(--border-soft); border-radius:var(--radius-sm);">
          ${contributions.map(c => `
            <div class="contrib-row">
              <div class="contrib-label" title="${c.name}">${c.name}</div>
              <div class="contrib-bar-wrap">
                <div class="pbar" style="height: 6px;">
                  <div class="pbar-fill" style="width: ${c.val}%; background: ${c.color};"></div>
                </div>
              </div>
              <div class="contrib-value">${c.val}%</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="drawer-section">
        <div class="drawer-section-title">Raw Log Record</div>
        <div class="drawer-code-block">${event.raw || 'No raw payload available.'}</div>
      </div>

      <div class="drawer-section">
        <div class="drawer-section-title">Correlated Activities</div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <div class="source-tile" style="padding:10px 12px; font-size:12px; background:var(--card);">
            <span class="badge badge-primary" style="padding:2px 6px; font-size:9.5px;">Geo IP</span>
            <div style="flex:1; margin-left: 8px;">IP <strong class="mono">${event.ip}</strong> opened 6 sessions to auth-service.</div>
          </div>
          <div class="source-tile" style="padding:10px 12px; font-size:12px; background:var(--card);">
            <span class="badge badge-primary" style="padding:2px 6px; font-size:9.5px;">IAM</span>
            <div style="flex:1; margin-left: 8px;">Admin login attempted from சென்னை, Tamil Nadu, India.</div>
          </div>
        </div>
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-ghost btn-sm" id="drawerCloseFooter">Close</button>
      <button class="btn btn-secondary btn-sm">Suppressed Policy</button>
      <button class="btn btn-primary btn-sm">Escalate Threat</button>
    `;

    this.open(event.ev, bodyHtml, footerHtml);
    document.getElementById('drawerCloseFooter').addEventListener('click', () => this.close());
  }
}

export const drawer = new DetailDrawer();
export default drawer;
