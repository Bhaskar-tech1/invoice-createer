import { generatePDF, generateAssets } from '../utils/pdf.js';
import { createIcons, X, Download, Save } from 'lucide';
import { supabase } from '../utils/supabase.js';
import { refreshSidebarMetrics } from '../components/sidebar.js';

let lastData = null;

export function initPreview(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div style="padding: 24px; position: sticky; top: 0; display: flex; flex-direction: column; gap: 24px;">
      <div class="preview-footer" style="display: flex; gap: 12px; width: 100%;">
        <button id="save-invoice-btn" class="btn btn-ghost" style="flex: 1;">
          <i data-lucide="save"></i> Save to Cloud
        </button>
        <button id="download-pdf-btn" class="btn btn-primary" style="flex: 1;">
          <i data-lucide="download"></i> Download PDF
        </button>
      </div>

      <div class="preview-content" style="flex: 1; display: flex; justify-content: center;">
      <div id="invoice-paper" class="invoice-a4">
        <!-- Inside the A4 paper - white background -->
        <div class="invoice-paper-header">
          <div class="sender-block">
            <h1 class="invoice-title">INVOICE</h1>
            <p id="pv-sender-company" class="fw-bold">Company Name</p>
            <p id="pv-sender-address">Address</p>
            <p id="pv-sender-email">Email</p>
            <p id="pv-sender-phone">Phone</p>
          </div>
          <div class="meta-block">
            <div class="meta-row"><span>Invoice #:</span> <strong id="pv-inv-number">-</strong></div>
            <div class="meta-row"><span>Date:</span> <strong id="pv-iss-date">-</strong></div>
            <div class="meta-row"><span>Due Date:</span> <strong id="pv-due-date">-</strong></div>
          </div>
        </div>

        <div class="invoice-paper-client">
          <p class="text-sm">Billed To:</p>
          <p id="pv-client-name" class="fw-bold">Client Name</p>
          <p id="pv-client-company">Company</p>
          <p id="pv-client-address">Address</p>
          <p id="pv-client-email">Email</p>
        </div>

        <table class="invoice-table">
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Price</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody id="pv-items-body">
            <!-- Items injected here -->
          </tbody>
        </table>

        <div class="invoice-totals">
          <div class="totals-row"><span>Subtotal:</span> <span id="pv-subtotal">$0.00</span></div>
          <div class="totals-row"><span>Tax (<span id="pv-tax-rate">0</span>%):</span> <span id="pv-tax-amt">$0.00</span></div>
          <div class="totals-row"><span>Discount (<span id="pv-disc-rate">0</span>%):</span> <span id="pv-disc-amt">-$0.00</span></div>
          <div class="totals-row grand-total"><span>Total:</span> <span id="pv-total">$0.00</span></div>
        </div>

        <div class="invoice-notes">
          <p class="text-sm fw-bold">Notes / Terms</p>
          <p id="pv-notes">-</p>
        </div>
      </div>
      </div>
    </div>
  `;

  // Attach event listeners
  document.getElementById('download-pdf-btn').addEventListener('click', () => {
    generatePDF('invoice-paper', document.getElementById('pv-inv-number').textContent || 'draft');
  });
  
  document.getElementById('save-invoice-btn').addEventListener('click', handleSaveInvoice);

  // Listen to form updates
  window.addEventListener('invoiceUpdated', updatePreviewData);

  createIcons({
    icons: { X, Download, Save }
  });
}

async function handleSaveInvoice() {
  if (!lastData) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert('Session expired. Please log in again.');
    window.location.reload();
    return;
  }
  
  const btn = document.getElementById('save-invoice-btn');
  const oldHtml = btn.innerHTML;
  btn.innerHTML = 'Saving...';
  btn.disabled = true;

  try {
    // Generate image and PDF blobs
    btn.innerHTML = 'Generating assets...';
    const { imageBlob, pdfBlob } = await generateAssets('invoice-paper');
    
    const timestamp = Date.now();
    const imagePath = `${user.id}/${timestamp}_preview.png`;
    const pdfPath = `${user.id}/${timestamp}_invoice.pdf`;

    btn.innerHTML = 'Uploading assets...';
    // Upload image
    const { error: imgError } = await supabase.storage
      .from('invoice_assets')
      .upload(imagePath, imageBlob, { contentType: 'image/png' });
    if (imgError) throw imgError;

    const { data: imgUrlData } = supabase.storage
      .from('invoice_assets')
      .getPublicUrl(imagePath);

    // Upload PDF
    const { error: pdfError } = await supabase.storage
      .from('invoice_assets')
      .upload(pdfPath, pdfBlob, { contentType: 'application/pdf' });
    if (pdfError) throw pdfError;

    const { data: pdfUrlData } = supabase.storage
      .from('invoice_assets')
      .getPublicUrl(pdfPath);

    btn.innerHTML = 'Saving to database...';
    // Save record mapping
    const { error } = await supabase.from('invoices').insert({
      user_id: user.id,
      invoice_data: lastData,
      image_path: imgUrlData.publicUrl,
      pdf_path: pdfUrlData.publicUrl
    });
    if (error) throw error;
    
    // Refresh the sidebar globally
    refreshSidebarMetrics();
    // Dispatch an event so the Dashboard also picks up the new invoice if navigated there
    window.dispatchEvent(new CustomEvent('viewLoaded', { detail: { view: 'dashboard' } }));

    btn.innerHTML = '<i data-lucide="save"></i> Saved!';
    setTimeout(() => {
      btn.innerHTML = oldHtml;
      createIcons({ icons: { Save }, attrs: { 'data-lucide': 'save' } });
      btn.disabled = false;
    }, 2000);
  } catch (err) {
    console.error(err);
    alert('Failed to save invoice.');
    btn.innerHTML = oldHtml;
    createIcons({ icons: { Save }, attrs: { 'data-lucide': 'save' } });
    btn.disabled = false;
  }
}

export function updatePreviewData(dataOrEvent) {
  const data = dataOrEvent.detail ? dataOrEvent.detail : dataOrEvent;
  lastData = data;
  const currSrc = data.currency || 'USD';
  const symbols = { 'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹' };
  const sym = symbols[currSrc] || '$';

  // Format money helper
  const fmt = (val) => sym + parseFloat(val).toFixed(2);

  // Update text fields
  const map = {
    'pv-sender-company': data.senderCompany,
    'pv-sender-address': data.senderAddress,
    'pv-sender-email': data.senderEmail,
    'pv-sender-phone': data.senderPhone,
    'pv-inv-number': data.invoiceNumber,
    'pv-iss-date': data.issueDate,
    'pv-due-date': data.dueDate,
    'pv-client-name': data.clientName,
    'pv-client-company': data.clientCompany,
    'pv-client-address': data.clientAddress,
    'pv-client-email': data.clientEmail,
    'pv-notes': data.notes
  };

  for (const [id, val] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '';
  }

  // Update line items
  let subtotal = 0;
  const tbody = document.getElementById('pv-items-body');
  tbody.innerHTML = '';
  
  if (data.items && data.items.length) {
    data.items.forEach(item => {
      const amount = item.quantity * item.price;
      subtotal += amount;
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.description || '-'}</td>
        <td class="text-right">${item.quantity}</td>
        <td class="text-right">${fmt(item.price)}</td>
        <td class="text-right fw-bold">${fmt(amount)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Math
  const taxRate = parseFloat(data.taxPercent) || 0;
  const discRate = parseFloat(data.discountPercent) || 0;
  
  const taxAmt = subtotal * (taxRate / 100);
  const discAmt = subtotal * (discRate / 100);
  const total = subtotal + taxAmt - discAmt;

  document.getElementById('pv-tax-rate').textContent = taxRate;
  document.getElementById('pv-disc-rate').textContent = discRate;
  
  document.getElementById('pv-subtotal').textContent = fmt(subtotal);
  document.getElementById('pv-tax-amt').textContent = fmt(taxAmt);
  document.getElementById('pv-disc-amt').textContent = '-' + fmt(discAmt);
  document.getElementById('pv-total').textContent = fmt(Math.max(0, total));
}
