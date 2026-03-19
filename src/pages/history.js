import { supabase } from '../utils/supabase.js';
import { createIcons, Trash2, Download } from 'lucide';
import { generatePDF } from '../utils/pdf.js';

export async function renderHistory(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="card" style="padding: 32px; min-height: 80vh;">
      <h2 style="font-size: 1.5rem; margin-bottom: 24px;">Invoice History</h2>
      
      <div class="history-table-wrapper" style="overflow-x: auto;">
        <table class="invoice-table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); text-align: left; font-size: 0.8125rem; text-transform: uppercase;">
              <th style="padding: 12px 16px;">Date</th>
              <th style="padding: 12px 16px;">Client</th>
              <th style="padding: 12px 16px;">Amount</th>
              <th style="padding: 12px 16px; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody id="history-tbody">
            <tr><td colspan="4" style="text-align: center; padding: 32px; color: var(--text-muted);">Loading...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    fetchHistoryData(user.id);
  }
}

async function fetchHistoryData(userId) {
  try {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tbody = document.getElementById('history-tbody');
    
    if (invoices.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 32px; color: var(--text-muted);">No invoices found.</td></tr>`;
      return;
    }

    tbody.innerHTML = invoices.map(inv => {
      const clientName = inv.invoice_data?.clientName || 'Unknown Client';
      const date = new Date(inv.created_at).toLocaleDateString();
      const amt = '₹' + parseFloat(inv.invoice_data?.calculatedTotal || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 });
      
      return `
        <tr style="border-bottom: 1px solid var(--border-subtle);">
          <td style="padding: 16px;">${date}</td>
          <td style="padding: 16px; font-weight: 500;">${clientName}</td>
          <td style="padding: 16px;">${amt}</td>
          <td style="padding: 16px; text-align: right; display: flex; justify-content: flex-end; gap: 8px;">
            ${inv.pdf_path ? `
            <button class="btn btn-ghost download-hist-btn" data-path="${inv.pdf_path}" style="color: var(--primary); padding: 6px;" title="Download PDF">
              <i data-lucide="download" style="width: 16px; height: 16px;"></i>
            </button>
            ` : ''}
            <button class="btn btn-ghost delete-hist-btn" data-id="${inv.id}" style="color: #ff4f4f; padding: 6px;" title="Delete Invoice">
              <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    createIcons({ icons: { Trash2, Download } });

    // Attach deletion
    document.querySelectorAll('.delete-hist-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this invoice?')) {
          await supabase.from('invoices').delete().eq('id', id);
          fetchHistoryData(userId); // Refresh
        }
      });
    });

    // Attach download
    document.querySelectorAll('.download-hist-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const path = e.currentTarget.getAttribute('data-path');
        
        // Use the public URL directly
        const a = document.createElement('a');
        a.href = path;
        a.target = '_blank';
        a.download = path.split('/').pop() || 'invoice.pdf';
        
        // Some older rows might still have relative paths, ensure they're handled or just append the base URL
        if (!path.startsWith('http')) {
           const { data } = supabase.storage.from('invoice_assets').getPublicUrl(path);
           a.href = data.publicUrl;
        }

        a.click();
      });
    });

  } catch (err) {
    console.error(err);
  }
}

// Re-render when history is visited
window.addEventListener('viewLoaded', (e) => {
  if (e.detail.view === 'history') {
    renderHistory('view-history');
  }
});
