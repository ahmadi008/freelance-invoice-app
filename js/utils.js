// utils.js — Helper functions & API fetch logic

export function generateId() { return Date.now(); }

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return '\u2014';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function escapeHtml(str) {
  if (!str) return '';
  const el = document.createElement('div');
  el.textContent = str;
  return el.innerHTML;
}

// ── RandomUser API ───────────────────────────
export async function fetchRandomUsers() {
  try {
    const res = await fetch('https://randomuser.me/api/?results=5&nat=us');
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    return data.results.map(u => ({
      id: generateId() + Math.floor(Math.random() * 9999),
      name: `${u.name.first} ${u.name.last}`,
      email: u.email,
      company: 'Freelance Inc.',
      notes: '',
      createdAt: new Date().toISOString()
    }));
  } catch (err) {
    console.error('fetchRandomUsers failed:', err);
    return [];
  }
}

// ── ZenQuotes API ────────────────────────────
export async function fetchMotivationalQuote() {
  try {
    const res = await fetch('https://zenquotes.io/api/quotes');
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    const pick = data[Math.floor(Math.random() * data.length)];
    return { text: pick.q, author: pick.a || 'Unknown' };
  } catch (err) {
    console.error('fetchMotivationalQuote failed:', err);
    return { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' };
  }
}

// ── Quote Renderer ───────────────────────────
export function renderQuote(quote) {
  const container = document.getElementById('quote-container');
  if (!container) return;
  container.innerHTML = `
    <div class="quote-card">
      <div class="quote-mark">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
          <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
        </svg>
      </div>
      <blockquote class="quote-text">"${escapeHtml(quote.text)}"</blockquote>
      <cite class="quote-author">\u2014 ${escapeHtml(quote.author)}</cite>
    </div>`;
}

// ── Toast ────────────────────────────────────
export function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast toast-${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}
