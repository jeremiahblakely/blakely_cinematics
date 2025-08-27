// Admin Panel Navigation and Tab Management
(function() {
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  
  // Mobile menu toggle functionality (removed for backup restoration)
  function initMobileMenu() {
    // Mobile functionality removed to match original backup structure
    console.log('Mobile menu toggle disabled - using original backup structure');
  }
  
  // Tab switching functionality
  function showTab(tab) {
    // Update URL hash
    location.hash = tab;
    
    // Update tab button states
    $$('.tab-btn').forEach(btn => {
      const active = btn.dataset.tab === tab;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-current', active ? 'page' : 'false');
    });
    
    // Show/hide panels using CSS classes instead of hidden attribute
    $$('.panel').forEach(panel => {
      const shouldShow = panel.id === 'panel-' + tab;
      panel.classList.toggle('active', shouldShow);
    });
  }
  
  // Initialize tab system
  function initTabs() {
    // Handle hash changes
    window.addEventListener('hashchange', () => {
      const tab = location.hash.replace('#', '') || 'dashboard';
      showTab(tab);
    });
    
    // Handle tab button clicks
    $$('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => showTab(btn.dataset.tab));
    });
    
    // Handle quick action buttons that navigate to tabs
    $$('.button[data-goto]').forEach(btn => {
      btn.addEventListener('click', () => showTab(btn.dataset.goto));
    });
    
    // Show initial tab
    const initialTab = location.hash.replace('#', '') || 'dashboard';
    showTab(initialTab);
  }
  
  // Initialize everything when DOM is ready
  function init() {
    initMobileMenu();
    initTabs();
    
    // Add smooth scrolling for better UX
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Log successful initialization
    console.log('Admin panel initialized successfully');
  }
  
  // Initialize when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();