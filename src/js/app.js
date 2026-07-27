/* ============================= CORE INITIALIZER & COORDINATOR ============================= */
import db from './data.js';
import router from './router.js';
import { initCharts } from './charts.js';
import { initDashboard } from './views/dashboard.js';
import { initSources } from './views/sources.js';
import { initDetection } from './views/detection.js';
import { initModels } from './views/models.js';
import { initSettings } from './views/settings.js';

// Global toast notifier helper
export function showToast(title, sub, isError = false) {
  const toast = document.getElementById('toast');
  const toastTitle = document.getElementById('toastTitle');
  const toastSub = document.getElementById('toastSub');
  
  if (!toast || !toastTitle || !toastSub) return;

  toastTitle.textContent = title;
  toastSub.textContent = sub;
  
  // Custom theme depending on error state
  if (isError) {
    toast.style.borderLeftColor = 'var(--danger)';
    toast.querySelector('svg').setAttribute('stroke', 'var(--danger)');
  } else {
    toast.style.borderLeftColor = 'var(--success)';
    toast.querySelector('svg').setAttribute('stroke', 'var(--success)');
  }

  toast.classList.add('show');
  
  // Clear any existing timeouts if we call toast rapidly
  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

// Bind navigation clicks
function bindNavigation() {
  const navItems = document.querySelectorAll('.nav-item[data-page]');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.getAttribute('data-page');
      router.navigate(page);
    });
  });

  // Sidebar toggle collapse
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebarToggle');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('expanded');
    });
  }

  // Mobile drawer trigger support
  // Add double tap avatar/brand area to toggle mobile overlay if drawer is closed
  const brandMark = document.querySelector('.brand-mark');
  if (brandMark && sidebar) {
    brandMark.addEventListener('click', () => {
      if (window.innerWidth <= 720) {
        sidebar.classList.toggle('mobile-open');
      }
    });
  }
}

// Global Keyboard Shortcut Handlers (CMD+K, ESC)
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // CMD+K or CTRL+K focuses search box
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      
      const searchBoxInput = document.querySelector('.search-box input');
      const detSearchInput = document.getElementById('detectionSearch');
      
      const activeRoute = router.parseUrl().page;
      
      if (activeRoute === 'detection' && detSearchInput) {
        detSearchInput.focus();
      } else if (searchBoxInput) {
        searchBoxInput.focus();
      }
    }
  });
}

// Bootstrap
function init() {
  bindNavigation();
  initKeyboardShortcuts();

  // Initialize page-specific controllers
  initDashboard(showToast);
  initSources(showToast);
  initDetection(showToast);
  initModels(showToast);
  initSettings(showToast);

  // Subscribe to route change triggers to update database page context
  router.subscribe(({ page }) => {
    db.state.activePage = page;
    db.saveState();

    // Re-initialize Chart.js on page rendering (needed since canvas visibility is updated)
    if (page === 'dashboard' || page === 'analytics') {
      // Small delay to let page transition animation complete
      setTimeout(() => {
        initCharts();
      }, 150);
    }
  });

  // Force chart draw on initial landing page if applicable
  const initialPage = router.parseUrl().page;
  if (initialPage === 'dashboard' || initialPage === 'analytics') {
    setTimeout(() => {
      initCharts();
    }, 200);
  }
}

document.addEventListener('DOMContentLoaded', init);
