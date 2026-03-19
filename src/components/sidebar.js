import { Hexagon, FileText, Zap, Settings, Clock } from 'lucide';

import { supabase } from '../utils/supabase.js';

export function renderSidebar(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="sidebar">
      <div class="logo">
        <i data-lucide="zap" class="logo-icon"></i>
        <span>InvoiceAI</span>
      </div>
      
      <ul class="nav-links">
        <nav class="sidebar-nav">
        <a href="#dashboard" class="nav-item">
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
  `;
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
