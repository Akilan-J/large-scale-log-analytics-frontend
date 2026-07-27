/* ============================= CLIENT-SIDE HASH ROUTER ============================= */
class Router {
  constructor() {
    this.routes = {};
    this.listeners = [];
    
    window.addEventListener('hashchange', () => this.handleRouting());
    window.addEventListener('load', () => this.handleRouting());
  }

  // Subscribe to navigation events
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Parse path and query parameters
  parseUrl() {
    const hash = window.location.hash || '#/dashboard';
    const [pathPart, queryPart] = hash.split('?');
    
    // Convert '#/detection' to 'detection'
    let page = pathPart.replace(/^#\/?/, '') || 'dashboard';
    
    // Parse query string parameters
    const query = {};
    if (queryPart) {
      const pairs = queryPart.split('&');
      for (const pair of pairs) {
        const [key, val] = pair.split('=');
        if (key) {
          query[decodeURIComponent(key)] = decodeURIComponent(val || '');
        }
      }
    }
    
    return { page, query };
  }

  // Navigate to a page with optional parameters
  navigate(page, query = {}) {
    let hash = `#/${page}`;
    
    const queryKeys = Object.keys(query).filter(k => query[k] !== undefined && query[k] !== '');
    if (queryKeys.length > 0) {
      const queryStr = queryKeys
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`)
        .join('&');
      hash += `?${queryStr}`;
    }
    
    window.location.hash = hash;
  }

  // Update query params on current page without replacing history
  updateQueryParams(newParams) {
    const { page, query } = this.parseUrl();
    const mergedQuery = { ...query, ...newParams };
    
    // Remove empty parameters
    Object.keys(mergedQuery).forEach(key => {
      if (mergedQuery[key] === undefined || mergedQuery[key] === '' || mergedQuery[key] === 'all') {
        delete mergedQuery[key];
      }
    });

    let hash = `#/${page}`;
    const queryKeys = Object.keys(mergedQuery);
    if (queryKeys.length > 0) {
      const queryStr = queryKeys
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(mergedQuery[k])}`)
        .join('&');
      hash += `?${queryStr}`;
    }
    
    // Replace hash in-place without generating a new history entry if desired
    history.replaceState(null, '', hash);
    this.notify(page, mergedQuery);
  }

  // Handle page transitions
  handleRouting() {
    const { page, query } = this.parseUrl();
    const validPages = ['dashboard', 'sources', 'detection', 'analytics', 'models', 'settings'];
    
    // Fallback if page is unrecognized
    const targetPage = validPages.includes(page) ? page : 'dashboard';
    
    this.updateDom(targetPage);
    this.notify(targetPage, query);
  }

  notify(page, query) {
    this.listeners.forEach(listener => listener({ page, query }));
  }

  updateDom(page) {
    // 1. Update navigation active state
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      if (item.getAttribute('data-page') === page) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // 2. Display correct page element
    document.querySelectorAll('.page').forEach(pageEl => {
      const expectedId = `page-${page}`;
      if (pageEl.id === expectedId) {
        pageEl.classList.add('active');
      } else {
        pageEl.classList.remove('active');
      }
    });

    // 3. Update breadcrumbs
    const crumbText = document.getElementById('crumbText');
    if (crumbText) {
      const titles = {
        dashboard: 'Dashboard',
        sources: 'Log Sources',
        detection: 'Detection Results',
        analytics: 'Analytics',
        models: 'Model Management',
        settings: 'Settings'
      };
      crumbText.textContent = titles[page] || 'Dashboard';
    }

    // 4. Scroll main content to top
    const mainEl = document.querySelector('.main');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
  }
}

export const router = new Router();
export default router;
