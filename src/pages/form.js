import { createIcons, Plus, Trash2 } from 'lucide';

export function renderForm(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const savedCurrency = localStorage.getItem('user_currency') || 'INR';

  container.innerHTML = `
    <div class="form-header">
      <h1>Create Invoice</h1>
      <p class="subtitle">Fill in the details below</p>
    </div>

    <!-- 1. Sender Info -->
    <section class="card section-card" style="animation-delay: 0.1s">
      <h2 class="section-header">1. Sender Information</h2>
      <div class="form-row">
        <div class="input-group">
          <label>Company Name</label>
          <input type="text" class="input data-field" data-field="senderCompany" placeholder="Your Company LLC" />
        </div>
        <div class="input-group">
          <label>Email Address</label>
          <input type="email" class="input data-field" data-field="senderEmail" placeholder="billing@company.com" />
        </div>
      </div>
      <div class="form-row">
        <div class="input-group">
          <label>Phone Number</label>
          <input type="text" class="input data-field" data-field="senderPhone" placeholder="+1 (555) 000-0000" />
        </div>
        <div class="input-group">
          <label>Address</label>
          <textarea class="input data-field" data-field="senderAddress" placeholder="123 Business Rd., City, Country"></textarea>
        </div>
      </div>
    </section>

    <!-- 2. Client Info -->
    <section class="card section-card" style="animation-delay: 0.2s">
      <h2 class="section-header">2. Client Information</h2>
      <div class="form-row">
        <div class="input-group">
          <label>Client Name</label>
          <input type="text" class="input data-field" data-field="clientName" placeholder="Client Name" />
        </div>
        <div class="input-group">
          <label>Company Name</label>
          <input type="text" class="input data-field" data-field="clientCompany" placeholder="Client Company Inc" />
        </div>
      </div>
      <div class="form-row">
        <div class="input-group">
          <label>Email Address</label>
          <input type="email" class="input data-field" data-field="clientEmail" placeholder="contact@client.com" />
        </div>
        <div class="input-group">
          <label>Billing Address</label>
          <textarea class="input data-field" data-field="clientAddress" placeholder="Client Address..."></textarea>
        </div>
      </div>
    </section>

    <!-- 3. Invoice Details -->
    <section class="card section-card" style="animation-delay: 0.3s">
      <h2 class="section-header">3. Invoice Details</h2>
      <div class="form-row">
        <div class="input-group">
          <label>Invoice Number</label>
          <input type="text" class="input data-field" data-field="invoiceNumber" placeholder="INV-001" />
        </div>
        <div class="input-group">
          <label>Currency</label>
          <select class="input data-field" data-field="currency">
            <option value="USD" ${savedCurrency === 'USD' ? 'selected' : ''}>USD ($)</option>
            <option value="EUR" ${savedCurrency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
            <option value="GBP" ${savedCurrency === 'GBP' ? 'selected' : ''}>GBP (£)</option>
            <option value="INR" ${savedCurrency === 'INR' ? 'selected' : ''}>INR (₹)</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="input-group">
          <label>Issue Date</label>
          <input type="date" class="input data-field" data-field="issueDate" />
        </div>
        <div class="input-group">
          <label>Due Date</label>
          <input type="date" class="input data-field" data-field="dueDate" />
        </div>
      </div>
    </section>

    <!-- 4. Line Items -->
    <section class="card section-card" style="animation-delay: 0.4s">
      <h2 class="section-header">4. Line Items</h2>
      <div id="line-items-container">
        <!-- Dynamic items go here -->
      </div>
      
      <div style="margin-top: 16px;">
        <button id="add-item-btn" class="btn btn-ghost">
          <i data-lucide="plus"></i> Add Item
        </button>
      </div>

      <div class="totals-section">
        <div class="form-row">
          <div class="input-group">
            <label>Tax (%)</label>
            <input type="number" class="input data-field" data-field="taxPercent" value="0" min="0" step="0.1" />
          </div>
          <div class="input-group">
            <label>Discount (%)</label>
            <input type="number" class="input data-field" data-field="discountPercent" value="0" min="0" step="0.1" />
          </div>
        </div>
      </div>
    </section>

    <!-- 5. Notes -->
    <section class="card section-card" style="animation-delay: 0.5s">
      <h2 class="section-header">5. Notes & Terms</h2>
      <div class="input-group">
        <label>Memo</label>
        <textarea class="input data-field" data-field="notes" placeholder="Thank you for your business. Payment is due within 30 days."></textarea>
      </div>
    </section>
    
  `;

  // Initialize one line item row
  addLineItem();

  // Attach event listeners
  document.getElementById('add-item-btn').addEventListener('click', () => addLineItem());
  container.querySelectorAll('.data-field').forEach(input => {
    input.addEventListener('input', triggerUpdateEvent);
  });
  
  createIcons({
    icons: {
      Plus,
      Trash2
    }
  });

  // Trigger sync on load
  setTimeout(() => triggerUpdateEvent(), 50);
}

function addLineItem() {
  const container = document.getElementById('line-items-container');
  const rowId = 'item-' + Date.now();
  
  const itemHtml = document.createElement('div');
  itemHtml.className = 'line-item-row';
  itemHtml.id = rowId;
  itemHtml.innerHTML = `
    <div class="item-desc">
      <input type="text" class="input data-field item-description" placeholder="Item description" />
    </div>
    <div class="item-qty">
      <input type="number" class="input data-field item-quantity" value="1" min="1" placeholder="Qty" />
    </div>
    <div class="item-price">
      <input type="number" class="input data-field item-price-input" value="0" min="0" step="0.01" placeholder="Price" />
    </div>
    <div class="item-action">
      <button type="button" class="btn btn-danger remove-item-btn" data-id="${rowId}">
        <i data-lucide="trash-2"></i>
      </button>
    </div>
  `;
  
  container.appendChild(itemHtml);
  
  // Attach listeners for new inputs
  itemHtml.querySelectorAll('.data-field').forEach(input => {
    input.addEventListener('input', triggerUpdateEvent);
  });
  
  itemHtml.querySelector('.remove-item-btn').addEventListener('click', (e) => {
    const btn = e.currentTarget;
    document.getElementById(btn.getAttribute('data-id')).remove();
    triggerUpdateEvent();
  });
  
  // Re-run icons for new elements
  createIcons({
    icons: { Trash2 },
    attrs: { 'data-lucide': 'trash-2' }
  });
  
  triggerUpdateEvent();
}

function triggerUpdateEvent() {
  // Collect all data
  const data = {};
  document.querySelectorAll('.data-field:not(.item-description):not(.item-quantity):not(.item-price-input)').forEach(input => {
    data[input.dataset.field] = input.value;
  });
  
  // Collect line items & calculate total natively
  data.items = [];
  let subtotal = 0;
  document.querySelectorAll('.line-item-row').forEach(row => {
    const qty = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const price = parseFloat(row.querySelector('.item-price-input').value) || 0;
    subtotal += (qty * price);
    data.items.push({
      description: row.querySelector('.item-description').value,
      quantity: qty,
      price: price
    });
  });
  
  const taxRate = parseFloat(data.taxPercent) || 0;
  const discRate = parseFloat(data.discountPercent) || 0;
  
  const taxAmt = subtotal * (taxRate / 100);
  const discAmt = subtotal * (discRate / 100);
  data.calculatedTotal = Math.max(0, subtotal + taxAmt - discAmt);
  
  // Dispatch custom event
  const event = new CustomEvent('invoiceUpdated', { detail: data });
  window.dispatchEvent(event);
}
