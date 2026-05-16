// clients.js — Client-specific logic

import { getClients, addClient, updateClient, deleteClient } from './data.js';
import { generateId, validateEmail, fetchRandomUsers, escapeHtml, showToast } from './utils.js';

let sortField = 'name';
let sortDir   = 'asc';
let editingId = null;

// ── Step 1: localStorage + form first, API second ────────────────────────────
// initClientsPage() checks localStorage. Only if empty does it call the API.
// This means: form & CRUD work 100% offline; API is just the seed.

export async function initClientsPage() {
  if (getClients().length === 0) {
    setLoading(true);
    const seeded = await fetchRandomUsers();  // async/await with try-catch inside
    seeded.forEach(c => addClient(c));        // store in localStorage immediately
    setLoading(false);
  }
  renderClients();
  setupForm();
  setupSort();
}

function setLoading(show) {
  const el = document.getElementById('clients-loading');
  if (el) el.style.display = show ? 'flex' : 'none';
}

// ── Render (Read) ─────────────────────────────────────────────────────────────
export function renderClients() {
  const clients = getClients();
  const tbody   = document.getElementById('clients-tbody');
  if (!tbody) return;

  const countEl = document.getElementById('client-count');
  if (countEl) countEl.textContent = clients.length;

  // Sort using array spread + localeCompare
  const sorted = [...clients].sort((a, b) => {
    const va = (a[sortField] || '').toLowerCase();
    const vb = (b[sortField] || '').toLowerCase();
    return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  if (sorted.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="5" class="empty-state"><div>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <p>No clients yet. Add your first client using the form.</p>
      </div></td></tr>`;
    return;
  }

  tbody.innerHTML = sorted.map(c => `
    <tr>
      <td>
        <div class="cell-with-avatar">
          <div class="avatar" aria-hidden="true">${escapeHtml(c.name.charAt(0).toUpperCase())}</div>
          <span>${escapeHtml(c.name)}</span>
        </div>
      </td>
      <td><a href="mailto:${escapeHtml(c.email)}" class="email-link">${escapeHtml(c.email)}</a></td>
      <td>${escapeHtml(c.company || '\u2014')}</td>
      <td class="notes-cell" title="${escapeHtml(c.notes || '')}">${escapeHtml(c.notes || '\u2014')}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-sm btn-ghost btn-edit" data-id="${c.id}" aria-label="Edit ${escapeHtml(c.name)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg> Edit
          </button>
          <button class="btn btn-sm btn-danger-ghost btn-delete" data-id="${c.id}" aria-label="Delete ${escapeHtml(c.name)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg> Delete
          </button>
        </div>
      </td>
    </tr>`).join('');

  tbody.querySelectorAll('.btn-edit').forEach(btn =>
    btn.addEventListener('click', () => openEditForm(Number(btn.dataset.id))));
  tbody.querySelectorAll('.btn-delete').forEach(btn =>
    btn.addEventListener('click', () => handleDelete(Number(btn.dataset.id))));
}

// ── Create / Update (form) ────────────────────────────────────────────────────
function setupForm() {
  const form = document.getElementById('client-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    clearErrors();

    const name    = form['client-name'].value.trim();
    const email   = form['client-email'].value.trim();
    const company = form['client-company'].value.trim();
    const notes   = form['client-notes'].value.trim();

    let valid = true;
    if (!name)                      { setError('client-name',  'Name is required.');            valid = false; }
    if (!email)                     { setError('client-email', 'Email is required.');            valid = false; }
    else if (!validateEmail(email)) { setError('client-email', 'Enter a valid email address.');  valid = false; }
    if (!valid) return;

    if (editingId !== null) {
      updateClient(editingId, { name, email, company, notes });
      cancelEdit();
      showToast('Client updated!');
    } else {
      addClient({ id: generateId(), name, email, company, notes, createdAt: new Date().toISOString() });
      form.reset();
      showToast('Client added!');
    }
    renderClients();
  });

  document.getElementById('cancel-edit')?.addEventListener('click', cancelEdit);
}

function openEditForm(id) {
  const c = getClients().find(cl => cl.id === id);
  if (!c) return;
  editingId = id;
  const form = document.getElementById('client-form');
  form['client-name'].value    = c.name;
  form['client-email'].value   = c.email;
  form['client-company'].value = c.company || '';
  form['client-notes'].value   = c.notes   || '';
  document.getElementById('form-heading').textContent  = 'Edit Client';
  document.getElementById('submit-btn').textContent    = 'Save Changes';
  document.getElementById('cancel-edit').style.display = 'inline-flex';
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cancelEdit() {
  editingId = null;
  document.getElementById('client-form').reset();
  clearErrors();
  document.getElementById('form-heading').textContent  = 'Add New Client';
  document.getElementById('submit-btn').textContent    = 'Add Client';
  document.getElementById('cancel-edit').style.display = 'none';
}

// ── Delete ────────────────────────────────────────────────────────────────────
function handleDelete(id) {
  const c = getClients().find(cl => cl.id === id);
  if (!c) return;
  if (!confirm(`Delete "${c.name}"?\nThis cannot be undone.`)) return;
  deleteClient(id);
  if (editingId === id) cancelEdit();
  renderClients();
  showToast('Client deleted.', 'info');
}

// ── Sort ──────────────────────────────────────────────────────────────────────
function setupSort() {
  document.querySelectorAll('[data-sort]').forEach(btn => {
    btn.addEventListener('click', () => {
      const field = btn.dataset.sort;
      sortDir   = (sortField === field && sortDir === 'asc') ? 'desc' : 'asc';
      sortField = field;
      updateSortUI();
      renderClients();
    });
  });
  updateSortUI();
}
function updateSortUI() {
  document.querySelectorAll('[data-sort]').forEach(btn => {
    btn.classList.remove('sort-asc', 'sort-desc');
    if (btn.dataset.sort === sortField) btn.classList.add(`sort-${sortDir}`);
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
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

document.addEventListener('DOMContentLoaded', () => initClientsPage());
