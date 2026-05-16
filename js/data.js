// data.js — localStorage CRUD layer

const CLIENTS_KEY = 'fh_clients';
const INVOICES_KEY = 'fh_invoices';

export function getClients() {
  return JSON.parse(localStorage.getItem(CLIENTS_KEY)) || [];
}
export function saveClients(clients) {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}
export function addClient(client) {
  const clients = getClients();
  clients.push(client);
  saveClients(clients);
}
export function updateClient(id, updates) {
  const clients = getClients();
  const idx = clients.findIndex(c => c.id === id);
  if (idx !== -1) { clients[idx] = { ...clients[idx], ...updates }; saveClients(clients); }
}
export function deleteClient(id) {
  saveClients(getClients().filter(c => c.id !== id));
}
export function getInvoices() {
  return JSON.parse(localStorage.getItem(INVOICES_KEY)) || [];
}
export function saveInvoices(invoices) {
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
}
export function addInvoice(invoice) {
  const invoices = getInvoices(); invoices.push(invoice); saveInvoices(invoices);
}
export function updateInvoice(id, updates) {
  const invoices = getInvoices();
  const idx = invoices.findIndex(inv => inv.id === id);
  if (idx !== -1) { invoices[idx] = { ...invoices[idx], ...updates }; saveInvoices(invoices); }
}
export function deleteInvoice(id) {
  saveInvoices(getInvoices().filter(inv => inv.id !== id));
}
export function toggleInvoicePaid(id) {
  const invoices = getInvoices();
  const idx = invoices.findIndex(inv => inv.id === id);
  if (idx !== -1) { invoices[idx].paid = !invoices[idx].paid; saveInvoices(invoices); }
}
