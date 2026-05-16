// main.js — Global navigation & UI logic

function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href === page || (page === '' && href === 'index.html'));
  });
}

function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const menu   = document.querySelector('.nav-menu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.navbar')) menu.classList.remove('open');
  });
}

document.addEventListener('DOMContentLoaded', () => { setActiveNav(); initMobileMenu(); });
