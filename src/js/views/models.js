/* ============================= MODEL MANAGEMENT VIEW CONTROLLER ============================= */
import db from '../data.js';

export function initModels(showToast) {
  const deployBtn = document.getElementById('deployBtn');
  const deployModal = document.getElementById('deployModal');
  const cancelDeploy = document.getElementById('cancelDeploy');
  const confirmDeploy = document.getElementById('confirmDeploy');

  // Trigger modal
  if (deployBtn) {
    deployBtn.addEventListener('click', () => {
      const candidate = db.state.candidateModel;
      if (candidate.progress < 100) {
        showToast('Model training in progress', `${candidate.version} is at ${Math.round(candidate.progress)}% and cannot be deployed yet.`, true);
        return;
      }
      deployModal.classList.add('open');
    });
  }

  // Close modal
  if (cancelDeploy) {
    cancelDeploy.addEventListener('click', () => {
      deployModal.classList.remove('open');
    });
  }

  if (deployModal) {
    deployModal.addEventListener('click', (e) => {
      if (e.target === deployModal) deployModal.classList.remove('open');
    });
  }

  // Confirm deploy
  if (confirmDeploy) {
    confirmDeploy.addEventListener('click', () => {
      deployModal.classList.remove('open');
      const deployedVer = db.state.candidateModel.version;
      
      showToast('Deployment started', `${deployedVer} is rolling out gradually over 30 minutes.`);
      
      // Update store
      db.deployModel();
      db.addActivity(`Rollout initiated for new model generation <b>${deployedVer}</b>.`, 'var(--primary)');
    });
  }

  // Background Model Training Simulator Ticker
  setInterval(() => {
    if (db.state.candidateModel.isTraining) {
      // Increment progress by 1-3%
      const increment = Math.floor(Math.random() * 3) + 1;
      db.incrementTraining(increment);
    }
  }, 4000);

  // Subscribe to store updates
  db.subscribe((state) => {
    if (state.activePage === 'models' || window.location.hash.includes('models')) {
      renderLineageStrand(state);
      renderModelCards(state);
      renderDeployHistory(state.deployHistory);
      renderTimeline(state.timelineData);
    }
  });

  // Initial draw
  renderLineageStrand(db.state);
  renderModelCards(db.state);
  renderDeployHistory(db.state.deployHistory);
  renderTimeline(db.state.timelineData);
}

function renderLineageStrand(state) {
  const container = document.querySelector('#page-models .lineage-strand');
  if (!container) return;

  const candidate = state.candidateModel;
  const isTr = candidate.isTraining;
  
  container.innerHTML = `
    <div class="strand-line"></div>
    <div class="strand-line-fill" style="width: ${isTr ? '62%' : '95%'};"></div>

    <div class="gen-node">
      <div class="gen-dot retired"></div>
      <div class="gen-label">Retired</div>
      <div class="gen-version">V1</div>
      <div class="gen-acc">91.2% acc</div>
      <div class="gen-status"><span class="badge badge-neutral">Archived</span></div>
    </div>

    <div class="gen-node">
      <div class="gen-dot ${isTr ? 'deployed' : 'retired'}"></div>
      <div class="gen-label">${isTr ? 'Deployed' : 'Retired'}</div>
      <div class="gen-version">V2.3</div>
      <div class="gen-acc">95.4% acc</div>
      <div class="gen-status"><span class="badge badge-${isTr ? 'success' : 'neutral'}">${isTr ? '<span class="badge-dot"></span>Active' : 'Archived'}</span></div>
    </div>

    <div class="gen-node">
      <div class="gen-dot ${isTr ? 'candidate' : 'deployed'}"></div>
      <div class="gen-label">${isTr ? 'Candidate' : 'Deployed'}</div>
      <div class="gen-version">${candidate.version}</div>
      <div class="gen-acc">${isTr ? candidate.acc : '96.1% acc'}</div>
      <div class="gen-status">
        <span class="badge badge-${isTr ? 'warning' : 'success'}">
          ${isTr ? `Training · ${Math.round(candidate.progress)}%` : '<span class="badge-dot"></span>Active'}
        </span>
      </div>
    </div>
  `;
}

function renderModelCards(state) {
  const candidate = state.candidateModel;
  
  // Find Deployed Model Version DOM Elements
  const depCardHeader = document.querySelector('#page-models .grid-12 .card:first-child h3');
  const depAccuracy = document.querySelector('#page-models .grid-12 .card:first-child .grid-2 div:first-child .mono');
  const depFitness = document.querySelector('#page-models .grid-12 .card:first-child .grid-2 div:nth-child(2) .mono');
  
  if (candidate.isTraining) {
    if (depCardHeader) depCardHeader.textContent = 'Deployed Model — V2.3';
    if (depAccuracy) depAccuracy.textContent = '95.4%';
    if (depFitness) depFitness.textContent = '0.928';
  } else {
    // V3 is Deployed, V4 is training
    if (depCardHeader) depCardHeader.textContent = 'Deployed Model — V3';
    if (depAccuracy) depAccuracy.textContent = '96.1%';
    if (depFitness) depFitness.textContent = '0.941';
  }

  // Update Candidate Card DOM Elements
  const candHeader = document.querySelector('#page-models .grid-12 .card:nth-child(2) h3');
  const candAccuracy = document.querySelector('#page-models .grid-12 .card:nth-child(2) .grid-2 div:first-child .mono');
  const candFitness = document.querySelector('#page-models .grid-12 .card:nth-child(2) .grid-2 div:nth-child(2) .mono');
  const candProgressText = document.querySelector('#page-models .grid-12 .card:nth-child(2) .grid-2 div:nth-child(3) div:last-child');
  const candProgressBar = document.querySelector('#page-models .grid-12 .card:nth-child(2) .grid-2 .pbar-fill');

  if (candHeader) candHeader.textContent = `Candidate Model — ${candidate.version}`;
  if (candAccuracy) candAccuracy.textContent = candidate.acc;
  if (candFitness) candFitness.textContent = candidate.fit;
  if (candProgressBar) candProgressBar.style.width = `${candidate.progress}%`;
  
  if (candProgressText) {
    if (candidate.isTraining) {
      candProgressText.textContent = `Epoch ${Math.round(candidate.progress * 2)} / 200 · ETA ${Math.round((100 - candidate.progress) * 0.5)} min`;
    } else {
      candProgressText.textContent = 'Training completed. Ready for validation deployment.';
    }
  }

  // Enable/Disable main Deploy Button based on V3 status
  const deployBtn = document.getElementById('deployBtn');
  if (deployBtn) {
    if (candidate.isTraining && candidate.progress < 100) {
      deployBtn.style.opacity = '0.6';
      deployBtn.style.cursor = 'not-allowed';
      deployBtn.title = 'Candidate model training is still in progress.';
    } else {
      deployBtn.style.opacity = '1';
      deployBtn.style.cursor = 'pointer';
      deployBtn.title = 'Deploy validation candidate to production.';
    }
  }
}

function renderDeployHistory(history) {
  const container = document.getElementById('deployHistoryBody');
  if (!container) return;

  container.innerHTML = history.map(d => `
    <tr>
      <td class="row-title mono">${d.v}</td>
      <td class="mono">${d.acc}</td>
      <td class="mono">${d.fit}</td>
      <td class="mono">${d.date}</td>
      <td>
        ${d.status === 'success' 
          ? '<span class="badge badge-success"><span class="badge-dot"></span>Stable</span>' 
          : '<span class="badge badge-danger">Rolled Back</span>'}
      </td>
    </tr>
  `).join('');
}

function renderTimeline(timeline) {
  const container = document.getElementById('modelTimeline');
  if (!container) return;

  container.innerHTML = timeline.map(t => `
    <div class="tl-item">
      <div class="tl-dot ${t.c}"></div>
      <div class="tl-title">${t.title}</div>
      <div class="tl-meta">${t.meta}</div>
      <div class="tl-desc">${t.desc}</div>
    </div>
  `).join('');
}

export default { initModels };
