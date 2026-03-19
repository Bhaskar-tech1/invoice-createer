import { supabase } from '../utils/supabase.js';

export function renderSettings(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const savedCurrency = localStorage.getItem('user_currency') || 'INR';
  const savedTheme = localStorage.getItem('theme') || 'dark';

  container.innerHTML = `
    <div class="card" style="padding: 32px; max-width: 600px;">
      <h2 style="font-size: 1.5rem; margin-bottom: 24px;">App Settings</h2>
      
      <div class="input-group">
        <label>Default Currency</label>
        <select id="settings-currency" class="input">
          <option value="USD" ${savedCurrency === 'USD' ? 'selected' : ''}>USD ($)</option>
          <option value="EUR" ${savedCurrency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
          <option value="GBP" ${savedCurrency === 'GBP' ? 'selected' : ''}>GBP (£)</option>
          <option value="INR" ${savedCurrency === 'INR' ? 'selected' : ''}>INR (₹)</option>
        </select>
        <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">Saved automatically.</p>
      </div>

      <div class="input-group" style="margin-top: 24px;">
        <label>Theme</label>
        <select id="settings-theme" class="input">
          <option value="dark" ${savedTheme === 'dark' ? 'selected' : ''}>Dark Mode (Premium)</option>
          <option value="light" ${savedTheme === 'light' ? 'selected' : ''}>Light Mode</option>
        </select>
      </div>
      
      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--border-subtle);">
        <h3 style="margin-bottom: 16px; font-size: 1rem; color: #ff4f4f;">Danger Zone</h3>
        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 16px;">This will permanently wipe all your invoices and log you out.</p>
        <button id="delete-data-btn" class="btn btn-ghost" style="color: #ff4f4f; border: 1px solid rgba(255, 79, 79, 0.3);">Wipe Data & Logout</button>
      </div>
    </div>
  `;

  // Attach Listeners
  document.getElementById('settings-currency').addEventListener('change', (e) => {
    localStorage.setItem('user_currency', e.target.value);
  });

  document.getElementById('settings-theme').addEventListener('change', (e) => {
    const val = e.target.value;
    localStorage.setItem('theme', val);
    document.documentElement.setAttribute('data-theme', val);
  });

  document.getElementById('delete-data-btn').addEventListener('click', async () => {
    if (confirm('Are you absolutely sure? This will delete all your invoices permanently.')) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('invoices').delete().eq('user_id', user.id);
        await supabase.auth.signOut();
      }
    }
  });
}

window.addEventListener('viewLoaded', (e) => {
  if (e.detail.view === 'settings') {
    renderSettings('view-settings');
  }
});
