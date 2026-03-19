import { supabase } from '../utils/supabase.js';
import { createIcons, Hexagon, TrendingUp, FilePlus } from 'lucide';

export async function renderDashboard(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  container.innerHTML = `
    <div class="card" style="padding: 32px; margin-bottom: 24px;">
      <h1 style="font-size: 2rem; margin-bottom: 8px;">Welcome back, <span style="color: var(--accent-blue)">${user.email.split('@')[0]}</span></h1>
      <p style="color: var(--text-secondary);">Here is a quick overview of your invoicing activity.</p>
    </div>

    <div class="metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-bottom: 32px;">
      
      <div class="stat-card card hover-glow">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
          <div>
            <p style="color: var(--text-secondary); font-size: 0.875rem;">Total Invoices Issued</p>
            <h2 id="dash-total-count" style="font-size: 2.25rem; font-weight: 700; margin-top: 4px;">--</h2>
          </div>
          <div style="background: rgba(79,142,255,0.1); padding: 12px; border-radius: 12px; color: var(--accent-blue);">
            <i data-lucide="file-text"></i>
          </div>
        </div>
      </div>

      <div class="stat-card card hover-glow">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
          <div>
            <p style="color: var(--text-secondary); font-size: 0.875rem;">Total Revenue</p>
            <h2 id="dash-total-revenue" style="font-size: 2.25rem; font-weight: 700; margin-top: 4px;">₹--.--</h2>
          </div>
          <div style="background: rgba(46,213,115,0.1); padding: 12px; border-radius: 12px; color: #2ed573;">
            <i data-lucide="trending-up"></i>
          </div>
        </div>
      </div>

    </div>

    <div class="card" style="padding: 24px;">
      <h3 style="margin-bottom: 16px;">Recent Invoices</h3>
      <div id="dash-recent-list" style="color: var(--text-secondary); font-size: 0.875rem;">
        Loading active invoices...
      </div>
      <div style="margin-top: 24px;">
        <a href="#new-invoice" class="btn btn-primary"><i data-lucide="file-plus"></i> Create New Invoice</a>
      </div>
    </div>
  `;

  createIcons({ icons: { Hexagon, TrendingUp, FilePlus } });
  
  // Fetch real data
  fetchDashboardMetrics(user.id);
}

async function fetchDashboardMetrics(userId) {
  try {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate metrics
    const totalCount = invoices.length;
    let totalRevenue = 0;

    invoices.forEach(inv => {
      const totalStr = inv.invoice_data?.calculatedTotal || '0';
      totalRevenue += parseFloat(totalStr);
    });

    document.getElementById('dash-total-count').textContent = totalCount;
    document.getElementById('dash-total-revenue').textContent = '₹' + totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Render Recent
    const recentDiv = document.getElementById('dash-recent-list');
    if (totalCount === 0) {
      recentDiv.innerHTML = '<p>You haven\'t created any invoices yet.</p>';
    } else {
      const recentHtml = invoices.slice(0, 3).map(inv => {
        const clientName = inv.invoice_data?.clientName || 'Unknown Client';
        const date = new Date(inv.created_at).toLocaleDateString();
        const amt = '₹' + (parseFloat(inv.invoice_data?.calculatedTotal || '0')).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `
          <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-subtle);">
            <div><strong style="color: var(--text-primary)">${clientName}</strong> <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 8px;">${date}</span></div>
            <div style="font-weight: 600; color: var(--text-primary)">${amt}</div>
          </div>
        `;
      }).join('');
      recentDiv.innerHTML = recentHtml;
    }

  } catch (err) {
    console.error('Failed to load dashboard metrics', err);
  }
}

// Re-render when dashboard is visited
window.addEventListener('viewLoaded', (e) => {
  if (e.detail.view === 'dashboard') {
    renderDashboard('view-dashboard');
  }
});
