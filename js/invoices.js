// invoices.js — Invoice creation & tracking logic

import { getInvoices, getClients, addInvoice, updateInvoice, deleteInvoice, toggleInvoicePaid } from './data.js';
import { generateId, formatCurrency, formatDate, escapeHtml, showToast } from './utils.js';

let editingId    = null;
let filterStatus = 'all';

export function initInvoicesPage() {
  populateClientDropdown();
  renderInvoices();
  setupForm();
  setupFilters();
}

function populateClientDropdown() {
  const sel = document.getElementById('invoice-client');
  if (!sel) return;
  const clients = getClients();
  if (clients.length === 0) {
    sel.innerHTML = '<option value="">No clients yet \u2014 add clients first</option>';
    return;
  }
  sel.innerHTML = '<option value="">Select a client\u2026</option>' +
    clients.map(c =>
      `<option value="${c.id}">${escapeHtml(c.name)}${c.company ? ` (${escapeHtml(c.company)})` : ''}</option>`
    ).join('');
}

export function renderInvoices() {
  const all     = getInvoices();
  const clients = getClients();

  // filter() for status tab
  const filtered = all.filter(inv => {
    if (filterStatus === 'paid')   return inv.paid;
    if (filterStatus === 'unpaid') return !inv.paid;
    return true;
  });

  const tbody = document.getElementById('invoices-tbody');
  if (!tbody) return;

  if (filtered.length === 0) {
    const msg = filterStatus === 'all'
      ? 'No invoices yet. Create your first invoice using the form above.'
      : `No ${filterStatus} invoices found.`;
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state"><div>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
      <p>${msg}</p>
    </div></td></tr>`;
  } else {
    tbody.innerHTML = filtered.map(inv => {
      const client     = clients.find(c => c.id === inv.clientId);
      const clientName = client ? escapeHtml(client.name) : '<span class="text-muted">Unknown</span>';
      const invNum     = `INV-${String(inv.id).slice(-6)}`;
      return `
        <tr class="${inv.paid ? 'row-paid' : ''}">
          <td><code class="inv-num">${invNum}</code></td>
          <td>${clientName}</td>
          <td>
            <strong>${escapeHtml(inv.serviceTitle)}</strong>
            ${inv.description ? `<br><small class="text-muted">${escapeHtml(inv.description)}</small>` : ''}
          </td>
          <td class="amount-cell">${formatCurrency(parseFloat(inv.amount))}</td>
          <td>${formatDate(inv.date)}</td>
          <td><span class="badge ${inv.paid ? 'badge-paid' : 'badge-unpaid'}">${inv.paid ? 'Paid' : 'Unpaid'}</span></td>
          <td>
            <div class="action-btns">
              <button class="btn btn-sm btn-ghost btn-toggle" data-id="${inv.id}">${inv.paid ? 'Mark Unpaid' : 'Mark Paid'}</button>
              <button class="btn btn-sm btn-ghost btn-edit" data-id="${inv.id}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg> Edit
              </button>
              <button class="btn btn-sm btn-danger-ghost btn-delete" data-id="${inv.id}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg> Delete
              </button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  tbody.querySelectorAll('.btn-toggle').forEach(btn =>
    btn.addEventListener('click', () => { toggleInvoicePaid(Number(btn.dataset.id)); renderInvoices(); showToast('Status updated!'); }));
  tbody.querySelectorAll('.btn-edit').forEach(btn =>
    btn.addEventListener('click', () => openEditForm(Number(btn.dataset.id))));
  tbody.querySelectorAll('.btn-delete').forEach(btn =>
    btn.addEventListener('click', () => handleDelete(Number(btn.dataset.id))));

  renderTotals(all);
}

function renderTotals(invoices) {
  // reduce() for sums
  const total  = invoices.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
  const paid   = invoices.filter(i => i.paid).reduce((s, i) => s + parseFloat(i.amount || 0), 0);
  const unpaid = total - paid;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('total-revenue', formatCurrency(total));
  set('total-paid',    formatCurrency(paid));
  set('total-unpaid',  formatCurrency(unpaid));
  set('invoice-count', invoices.length);
  set('paid-count',    invoices.filter(i => i.paid).length);
  set('unpaid-count',  invoices.filter(i => !i.paid).length);
}

function setupForm() {
  const form = document.getElementById('invoice-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault(); clearErrors();
    const clientId     = parseInt(form['invoice-client'].value);
    const serviceTitle = form['invoice-service'].value.trim();
    const description  = form['invoice-description'].value.trim();
    const amount       = parseFloat(form['invoice-amount'].value);
    const date         = form['invoice-date'].value;
    let valid = true;
    if (!clientId)                               { setError('invoice-client',  'Please select a client.');              valid = false; }
    if (!serviceTitle)                           { setError('invoice-service', 'Service title is required.');            valid = false; }
    if (!amount || isNaN(amount) || amount <= 0) { setError('invoice-amount',  'Enter a valid amount greater than 0.'); valid = false; }
    if (!date)                                   { setError('invoice-date',    'Date is required.');                    valid = false; }
    if (!valid) return;
    if (editingId !== null) {
      updateInvoice(editingId, { clientId, serviceTitle, description, amount, date });
      cancelEdit(); showToast('Invoice updated!');
    } else {
      addInvoice({ id: generateId(), clientId, serviceTitle, description, amount, date, paid: false, createdAt: new Date().toISOString() });
      form.reset(); populateClientDropdown(); showToast('Invoice created!');
    }
    renderInvoices();
  });
  document.getElementById('cancel-edit')?.addEventListener('click', cancelEdit);
}

function openEditForm(id) {
  const inv = getInvoices().find(i => i.id === id);
  if (!inv) return;
  editingId = id;
  const form = document.getElementById('invoice-form');
  form['invoice-client'].value      = inv.clientId;
  form['invoice-service'].value     = inv.serviceTitle;
  form['invoice-description'].value = inv.description || '';
  form['invoice-amount'].value      = inv.amount;
  form['invoice-date'].value        = inv.date;
  document.getElementById('form-heading').textContent  = 'Edit Invoice';
  document.getElementById('submit-btn').textContent    = 'Save Changes';
  document.getElementById('cancel-edit').style.display = 'inline-flex';
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cancelEdit() {
  editingId = null;
  document.getElementById('invoice-form').reset();
  populateClientDropdown(); clearErrors();
  document.getElementById('form-heading').textContent  = 'New Invoice';
  document.getElementById('submit-btn').textContent    = 'Create Invoice';
  document.getElementById('cancel-edit').style.display = 'none';
}

function handleDelete(id) {
  const inv = getInvoices().find(i => i.id === id);
  if (!inv) return;
  if (!confirm(`Delete invoice for "${inv.serviceTitle}"?`)) return;
  deleteInvoice(id);
  if (editingId === id) cancelEdit();
  renderInvoices(); showToast('Invoice deleted.', 'info');
}

function setupFilters() {
  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active'); filterStatus = btn.dataset.filter; renderInvoices();
    });
  });
}

function setError(fieldId, msg) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.classList.add('input-error');
  const errEl = el.closest('.form-group')?.querySelector('.field-error');
  if (errEl) errEl.textContent = msg;
}
function clearErrors() {
  document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
}

document.addEventListener('DOMContentLoaded', () => initInvoicesPage());
