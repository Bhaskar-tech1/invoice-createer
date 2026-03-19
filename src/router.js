export function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  
  // Trigger initial route
  if (!window.location.hash) {
    window.location.hash = '#dashboard';
  } else {
    handleRoute();
  }
}

export function navigateTo(hashName) {
  window.location.hash = hashName;
}

function handleRoute() {
  const hash = window.location.hash || '#dashboard';
  
  // Hide all views
  document.querySelectorAll('.page-view').forEach(el => {
    el.style.display = 'none';
  });
  
  // Show active view
  const targetView = document.getElementById(`view-${hash.substring(1)}`);
  if (targetView) {
    if (hash.substring(1) === 'new-invoice') {
      targetView.style.display = 'flex';
    } else {
      targetView.style.display = 'block';
    }
  }
  
  // Update Sidebar active states
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
    el.classList.remove('active');
  });
  
  const activeNavItem = document.querySelector(`.sidebar-nav .nav-item[href="${hash}"]`);
  if (activeNavItem) {
    activeNavItem.classList.add('active');
  }

  // Trigger optional view load event for dynamic data fetching
  window.dispatchEvent(new CustomEvent('viewLoaded', { detail: { view: hash.substring(1) } }));
}
