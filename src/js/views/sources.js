/* ============================= LOG SOURCES VIEW CONTROLLER ============================= */
import db from '../data.js';
import { drawer } from '../components/drawer.js';

export function initSources(showToast) {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const browseBtn = document.getElementById('browseBtn');

  if (browseBtn && fileInput) {
    browseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());

    ['dragover'].forEach(evt => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(evt => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file.name, file.size);
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleFileUpload(file.name, file.size);
    });
  }

  // Row selection handler
  const tableBody = document.getElementById('uploadHistoryBody');
  if (tableBody) {
    tableBody.addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      if (row) {
        // Prevent trigger drawer if they click on action buttons
        if (e.target.closest('.icon-btn') || e.target.closest('button')) {
          showToast('Log Action', 'Log source action clicked.');
          return;
        }
        const fileName = row.querySelector('.row-title').textContent.trim();
        const fileObj = db.state.uploads.find(u => u.name === fileName);
        if (fileObj) {
          drawer.showLogDetails(fileObj);
        }
      }
    });
  }

  // Connectors interactive stubs
  document.querySelectorAll('.source-tile button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tile = btn.closest('.source-tile');
      const title = tile.querySelector('.row-title').textContent.trim();
      showToast('Connector Connection', `Connecting pipeline to ${title}...`);
      
      btn.textContent = 'Connecting...';
      btn.disabled = true;
      
      setTimeout(() => {
        btn.textContent = 'Enabled';
        btn.className = 'badge badge-success';
        btn.style.marginLeft = 'auto';
        tile.classList.remove('disabled');
        const desc = tile.querySelector('div div:last-child');
        if (desc) desc.textContent = 'Streaming · connected';
        
        db.addActivity(`Connected new streaming log source: <b>${title}</b>`, 'var(--success)');
        showToast('Connected', `${title} ingestion channel is now live.`);
      }, 1800);
    });
  });

  // Subscribe to changes
  db.subscribe((state) => {
    if (state.activePage === 'sources' || window.location.hash.includes('sources')) {
      renderUploadHistory(state.uploads);
    }
  });

  // Initial draw
  renderUploadHistory(db.state.uploads);

  function handleFileUpload(name, sizeInBytes) {
    const sizeMb = sizeInBytes ? (sizeInBytes / (1024 * 1024)).toFixed(1) + ' MB' : '45 MB';
    const recCount = Math.floor(10000 + Math.random() * 800000).toLocaleString();
    
    // Add to state
    db.addUpload(name, sizeMb, recCount, 'processing');
    db.addActivity(`Queued log file upload <b>${name}</b> for ingestion parsing.`, 'var(--primary)');
    renderUploadHistory(db.state.uploads);

    const progressWrap = document.getElementById('uploadProgressWrap');
    const progressBar = document.getElementById('uploadBar');
    const progressPct = document.getElementById('uploadPct');
    const progressFileName = document.getElementById('uploadFileName');

    if (progressWrap && progressBar && progressPct && progressFileName) {
      progressFileName.textContent = name;
      progressWrap.style.display = 'block';
      progressBar.style.width = '0%';
      progressPct.textContent = '0%';

      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 20;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
          
          const isSuccess = Math.random() > 0.15; // 85% success rate
          const finalStatus = isSuccess ? 'success' : 'failed';
          
          db.updateUploadStatus(name, finalStatus);
          
          if (isSuccess) {
            db.addActivity(`Successfully parsed and loaded <b>${name}</b> (${recCount} events mapped).`, 'var(--success)');
            showToast('Upload complete', `${name} is successfully queued for threat scanning.`);
          } else {
            db.addActivity(`Failed to parse <b>${name}</b> due to syntax errors.`, 'var(--danger)');
            showToast('Ingestion failure', `Failed to parse ${name}. Check diagnostic report.`, true);
          }

          // Small delay before hiding progress slider
          setTimeout(() => {
            progressWrap.style.display = 'none';
          }, 1000);
        }
        
        progressBar.style.width = `${p}%`;
        progressPct.textContent = `${Math.round(p)}%`;
      }, 150);
    }
  }
}

function renderUploadHistory(uploadsList) {
  const container = document.getElementById('uploadHistoryBody');
  if (!container) return;

  const statusBadge = s => {
    if (s === 'success' || s === 'Processed') {
      return '<span class="badge badge-success"><span class="badge-dot"></span>Processed</span>';
    } else if (s === 'processing' || s === 'Processing') {
      return '<span class="badge badge-warning">Processing</span>';
    } else {
      return '<span class="badge badge-danger">Failed</span>';
    }
  };

  container.innerHTML = uploadsList.map(u => `
    <tr style="cursor: pointer;">
      <td class="row-title">${u.name}</td>
      <td>${u.src}</td>
      <td class="mono">${u.size}</td>
      <td class="mono">${u.rec}</td>
      <td class="mono">${u.time}</td>
      <td>${statusBadge(u.status)}</td>
      <td>
        <button class="icon-btn" style="width:28px;height:28px;" aria-label="Ingestion actions">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="12" cy="5" r="1"></circle>
            <circle cx="12" cy="19" r="1"></circle>
          </svg>
        </button>
      </td>
    </tr>
  `).join('');
}

export default { initSources };
