import './style.css';
import { createIcons, Zap, Hexagon, FileText, Settings, Clock, LogOut } from 'lucide';
import { renderSidebar, refreshSidebarMetrics } from './components/sidebar.js';
import { renderForm } from './pages/form.js';
import { initPreview } from './pages/preview.js';
import { renderAuthPage } from './pages/authPage.js';
import './pages/dashboard.js';
import './pages/history.js';
import './pages/settings.js';
import { initRouter } from './router.js';
import { supabase } from './utils/supabase.js';

// Setup App Theme Early
document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'dark');

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  // Render structure layout components
  renderSidebar('sidebar-container');
  
  // Setup SPA containers
  const viewContainer = document.getElementById('view-container');
  viewContainer.innerHTML = `
    <div id="view-dashboard" class="page-view"></div>
    <div id="view-new-invoice" class="page-view" style="display: none;">
      <div id="invoice-editor-pane" style="flex: 1; overflow-y: auto;"></div>
      <div id="invoice-live-preview-pane" style="flex: 1; background: var(--bg-surface); border-left: 1px solid var(--border-subtle); overflow-y: auto;"></div>
    </div>
    <div id="view-history" class="page-view" style="display: none;"></div>
    <div id="view-settings" class="page-view" style="display: none;"></div>
  `;

  // Render panels
  renderForm('invoice-editor-pane');
  initPreview('invoice-live-preview-pane');
  renderAuthPage('auth-page');

  // Initialize Router
  initRouter();

  // Initialize all lucide icons
  createIcons({
    icons: { Zap, Hexagon, FileText, Settings, Clock, LogOut }
  });

  // Initial Auth Check
  supabase.auth.getSession().then(({ data: { session } }) => {
    currentUser = session?.user || null;
    updateAppVisibility();
  });

  // Listen to Auth State
  supabase.auth.onAuthStateChange(async (event, session) => {
    currentUser = session?.user || null;
    updateAppVisibility();
  });
});

function updateAppVisibility() {
  const appContainer = document.getElementById('app');
  const authPage = document.getElementById('auth-page');
  const loader = document.getElementById('initial-loader');
  
  if (loader) {
    loader.classList.add('loader-hidden');
    setTimeout(() => loader.remove(), 300); // Wait for fade out
  }
  
  if (currentUser) {
    // Authenticated
    authPage.style.display = 'none';
    appContainer.style.display = 'flex';
    
    // Update Sidebar Global Stats
    refreshSidebarMetrics();
    
    // Quick inject of user info into sidebar
    const footerContainer = document.querySelector('.sidebar-footer');
    if (footerContainer && !document.getElementById('sidebar-user-widget')) {
      const widget = document.createElement('div');
      widget.id = 'sidebar-user-widget';
      widget.style.marginTop = '16px';
      widget.innerHTML = `
        <div style="padding: 12px; background: var(--bg-input); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); display: flex; flex-direction: column; gap: 8px;">
          <span style="font-size: 0.8125rem; color: var(--text-secondary); word-break: break-all;">
            ${currentUser.email}
          </span>
          <button id="logout-btn" class="btn btn-ghost" style="padding: 6px; font-size: 0.8125rem; width: 100%;">
            <i data-lucide="log-out" style="width: 14px; height: 14px;"></i> Log Out
          </button>
        </div>
      `;
      footerContainer.appendChild(widget);
      
      document.getElementById('logout-btn').addEventListener('click', () => {
        supabase.auth.signOut();
      });
      createIcons({ icons: { LogOut }, attrs: { 'style': 'width: 14px; height: 14px; margin-right: 4px;' } });
    }
  } else {
    // Unauthenticated
    appContainer.style.display = 'none';
    authPage.style.display = 'block';
    const widget = document.getElementById('sidebar-user-widget');
    if (widget) widget.remove();
  }
}

