/* ============================= DASHBOARD VIEW CONTROLLER ============================= */
import db from '../data.js';
import router from '../router.js';

export function initDashboard(showToast) {
  // Bind actions
  const btnNewSource = document.querySelector('#page-dashboard .btn-secondary');
  if (btnNewSource) {
    btnNewSource.addEventListener('click', () => {
      router.navigate('sources');
    });
  }

  const btnRunScan = document.querySelector('#page-dashboard .btn-primary');
  if (btnRunScan) {
    btnRunScan.addEventListener('click', () => {
      showToast('Scan initiated', 'Running detection check on recent log sources...');
      db.addActivity('Manual log security scan run by user.', 'var(--primary)');
    });
  }

  // Subscribe to store updates
  db.subscribe((state) => {
    if (state.activePage === 'dashboard' || window.location.hash.includes('dashboard')) {
      renderActivityFeed(state.activity);
      updateKpis(state);
    }
  });

  // Initial draw
  renderActivityFeed(db.state.activity);
}

function renderActivityFeed(activityList) {
  const container = document.getElementById('activityFeed');
  if (!container) return;

  container.innerHTML = activityList.map(a => `
    <div class="feed-item">
      <div class="feed-dot" style="background:${a.c}"></div>
      <div>
        <div class="feed-text">${a.text}</div>
        <div class="feed-time">${a.t}</div>
      </div>
    </div>
  `).join('');
}

function updateKpis(state) {
  // Update candidate details if any on dashboard card
  const progressText = document.querySelector('#page-dashboard .card:last-child div:last-child div:last-child');
  if (progressText && state.candidateModel) {
    const isTr = state.candidateModel.isTraining;
    progressText.innerHTML = isTr 
      ? `Last optimized 2h ago · V3 training <span class="mono">${Math.round(state.candidateModel.progress)}%</span>`
      : `Last optimized Just now · Lineage updated`;
  }
}

export default { initDashboard };
