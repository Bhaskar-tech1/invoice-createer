import { createIcons, Hexagon, FileText, Zap, Settings, Clock, Menu, X } from 'lucide';

import { supabase } from '../utils/supabase.js';

export function renderSidebar(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="sidebar">
      <div class="sidebar-header-mobile">
        <div class="logo">
          <i data-lucide="zap" class="logo-icon"></i>
          <span>InvoiceAI</span>
        </div>
        <button id="mobile-menu-btn" class="btn btn-ghost mobile-only" style="padding: 8px;">
          <i data-lucide="menu"></i>
        </button>
      </div>
      
      <div id="sidebar-nav-container" class="nav-container-desktop">
        <ul class="nav-links">
          <nav class="sidebar-nav">
          <a href="#dashboard" class="nav-item active">
            <i data-lucide="hexagon"></i> Dashboard
          </a>
          <a href="#new-invoice" class="nav-item">
            <i data-lucide="file-text"></i> New Invoice
          </a>
          <a href="#history" class="nav-item">
            <i data-lucide="clock"></i> History
          </a>
          <a href="#settings" class="nav-item">
            <i data-lucide="settings"></i> Settings
          </a>
          </nav>
        </ul>
        
        <div class="sidebar-footer">
          <div class="stat-pill">
            <span>Invoices</span>
            <span id="side-inv-count" class="stat-value">...</span>
          </div>
          <div class="stat-pill" style="margin-top: 8px;">
            <span>Revenue</span>
            <span id="side-rev-sum" class="stat-value">₹0.00</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach Menu Toggle Logic
  const menuBtn = document.getElementById('mobile-menu-btn');
  const navContainer = document.getElementById('sidebar-nav-container');
  let menuOpen = false;

  if (menuBtn && navContainer) {
    menuBtn.addEventListener('click', () => {
      menuOpen = !menuOpen;
      if (menuOpen) {
        navContainer.classList.add('mobile-menu-open');
        menuBtn.innerHTML = '<i data-lucide="x"></i>';
      } else {
        navContainer.classList.remove('mobile-menu-open');
        menuBtn.innerHTML = '<i data-lucide="menu"></i>';
      }
      createIcons({ icons: { Menu, X } });
    });

    // Close on navigation
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
      el.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          menuOpen = false;
          navContainer.classList.remove('mobile-menu-open');
          menuBtn.innerHTML = '<i data-lucide="menu"></i>';
          createIcons({ icons: { Menu, X } });
        }
      });
    });
  }

  // Initial draw
  createIcons({ icons: { Zap, Menu, X, Hexagon, FileText, Clock, Settings } });
}

export async function refreshSidebarMetrics() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('invoice_data')
      .eq('user_id', user.id);

    if (error) throw error;

    let revenue = 0;
    invoices.forEach(inv => {
      revenue += parseFloat(inv.invoice_data?.calculatedTotal || '0');
    });

    document.getElementById('side-inv-count').textContent = invoices.length;
    document.getElementById('side-rev-sum').textContent = '₹' + revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } catch (err) {
    console.error('Failed to update sidebar metrics', err);
  }
}
