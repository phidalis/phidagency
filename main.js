/* ===== PHIDAGENCY - MAIN JS ===== */

// ---------- SUPABASE CONFIG ----------
const SUPABASE_URL = 'https://tjagmchpfmbcpjyxxcvd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_PDtIv2aOkpypKJzdcxSJ2g_Z9Q2wAku';

let supabaseClient = null;

function initSupabase() {
  if (window.supabase && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return supabaseClient;
}

function getSupabase() {
  if (!supabaseClient) initSupabase();
  return supabaseClient;
}

// ---------- THEME MANAGEMENT ----------
const THEME_KEY = 'phidagency_theme';

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  updateThemeUI(theme);
}

function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'light';
}

function updateThemeUI(theme) {
  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

function initTheme() {
  const saved = getTheme();
  setTheme(saved);
}

// ---------- TOAST NOTIFICATIONS ----------
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ---------- MOBILE NAV TOGGLE ----------
function initMobileNav() {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      hamburger.textContent = navLinks.classList.contains('active') ? '\u2715' : '\u2630';
    });
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        hamburger.textContent = '\u2630';
      });
    });
  }
}

// ---------- SEARCH ----------
function initSearch() {
  const searchInput = document.querySelector('.search-bar input');
  const searchBtn = document.querySelector('.search-bar button');
  if (searchInput && searchBtn) {
    const doSearch = () => {
      const q = searchInput.value.trim();
      if (q) {
        const activePage = document.body.dataset.page;
        if (activePage === 'projects') {
          filterProjects(q);
        } else if (activePage === 'blogs') {
          filterBlogs(q);
        } else {
          window.location.href = `projects.html?search=${encodeURIComponent(q)}`;
        }
      }
    };
    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('keypress', e => { if (e.key === 'Enter') doSearch(); });
  }
}

// ---------- THEME COG ----------
function initCog() {
  const cog = document.querySelector('.cog-btn');
  const dropdown = document.querySelector('.theme-dropdown');
  if (cog && dropdown) {
    cog.addEventListener('click', e => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
      cog.classList.add('spinning');
      setTimeout(() => cog.classList.remove('spinning'), 600);
    });
    document.addEventListener('click', e => {
      if (!dropdown.contains(e.target) && e.target !== cog) {
        dropdown.classList.remove('active');
      }
    });
    dropdown.querySelectorAll('.theme-option').forEach(btn => {
      btn.addEventListener('click', () => {
        setTheme(btn.dataset.theme);
        dropdown.classList.remove('active');
      });
    });
  }
}

// ---------- ACTIVE NAV LINK ----------
function setActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href === currentPage);
  });
}

// ---------- FOOTER YEAR ----------
function setFooterYear() {
  const el = document.querySelector('.footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSupabase();
  initMobileNav();
  initSearch();
  initCog();
  setActiveNavLink();
  setFooterYear();
  initHeroSlideshow();
  loadContactInfo();
  loadSocialLinks();
  loadBookingInfo();
});

// ---------- HERO SLIDESHOW ----------
let heroCurrentSlide = 0;
let heroSlides = [];
let heroInterval = null;
let heroSlideTime = 5000;

async function initHeroSlideshow() {
  const hero = document.getElementById('heroSlideshow');
  if (!hero) return;

  const sb = getSupabase();
  if (!sb) return;

  // Load slide interval setting
  const { data: settings } = await sb.from('site_settings').select('setting_value').eq('setting_key', 'hero_slide_interval').single();
  if (settings && settings.setting_value) {
    heroSlideTime = parseInt(settings.setting_value) || 5000;
  }

  // Load visible slides
  const { data: slides, error } = await sb.from('hero_slides').select('*').eq('visible', true).order('order_num', { ascending: true });
  if (error || !slides || slides.length === 0) {
    hero.innerHTML = `
      <div class="hero-fallback"></div>
      <div class="hero-content">
        <h1>Welcome to PhidAgency</h1>
        <p>No hero image uploaded yet. Add slides from the admin panel.</p>
        <a href="booking.html" class="hero-btn">Get Started Today</a>
      </div>
    `;
    return;
  }

  heroSlides = slides;

  // Build slides HTML
  hero.innerHTML = slides.map((s, i) => `
    <div class="hero-slide${i === 0 ? ' active' : ''}">
      <img src="${s.image_url}" alt="${s.title || 'Hero'}">
    </div>
  `).join('') + `
    <div class="hero-content">
      <h1 id="heroTitle">${slides[0].title || 'Welcome to PhidAgency'}</h1>
      <p id="heroSubtitle">${slides[0].subtitle || ''}</p>
      ${slides[0].button_text ? `<a href="${slides[0].button_link || '#'}" class="hero-btn" id="heroBtn">${slides[0].button_text}</a>` : ''}
    </div>
    <div class="hero-dots" id="heroDots">
      ${slides.map((_, i) => `<div class="hero-dot${i === 0 ? ' active' : ''}" onclick="goToHeroSlide(${i})"></div>`).join('')}
    </div>
  `;

  // Start auto-advance
  startHeroSlideshow();
}

function startHeroSlideshow() {
  if (heroInterval) clearInterval(heroInterval);
  if (heroSlides.length <= 1) return;
  heroInterval = setInterval(nextHeroSlide, heroSlideTime);
}

function nextHeroSlide() {
  goToHeroSlide((heroCurrentSlide + 1) % heroSlides.length);
}

function goToHeroSlide(index) {
  heroCurrentSlide = index;
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  const title = document.getElementById('heroTitle');
  const subtitle = document.getElementById('heroSubtitle');
  const btn = document.getElementById('heroBtn');

  slides.forEach((s, i) => s.classList.toggle('active', i === index));
  dots.forEach((d, i) => d.classList.toggle('active', i === index));

  if (heroSlides[index]) {
    if (title) title.textContent = heroSlides[index].title || '';
    if (subtitle) subtitle.textContent = heroSlides[index].subtitle || '';
    if (btn) {
      if (heroSlides[index].button_text) {
        btn.textContent = heroSlides[index].button_text;
        btn.href = heroSlides[index].button_link || '#';
        btn.style.display = '';
      } else {
        btn.style.display = 'none';
      }
    }
  }

  // Reset timer
  startHeroSlideshow();
}

// ---------- PROJECT FUNCTIONS ----------
let currentDetailProjectUrl = '';

function filterProjects(query) {
  const cards = document.querySelectorAll('.project-card');
  const q = query.toLowerCase();
  cards.forEach(card => {
    const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
    const desc = card.querySelector('.card-desc')?.textContent.toLowerCase() || '';
    card.style.display = (title.includes(q) || desc.includes(q)) ? '' : 'none';
  });
}

function openProjectModal(url, title) {
  const modal = document.getElementById('projectModal');
  const iframe = document.getElementById('projectIframe');
  const modalTitle = document.getElementById('modalTitle');
  if (modal && iframe) {
    iframe.src = url;
    if (modalTitle) modalTitle.textContent = title || 'Project Preview';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeProjectModal() {
  const modal = document.getElementById('projectModal');
  const iframe = document.getElementById('projectIframe');
  if (modal && iframe) {
    modal.classList.remove('active');
    iframe.src = '';
    document.body.style.overflow = '';
  }
}

function openDetailModal(id) {
  const card = document.querySelector(`[data-project-id="${id}"]`);
  if (!card) return;
  const img = card.querySelector('img')?.src || '';
  const title = card.querySelector('h3')?.textContent || '';
  const desc = card.dataset.description || '';
  const url = card.dataset.projectUrl || '';

  currentDetailProjectUrl = url;
  document.getElementById('detailImage').src = img;
  document.getElementById('detailImage').alt = title;
  document.getElementById('detailTitle').textContent = title;
  document.getElementById('detailDesc').textContent = desc;

  const viewBtn = document.getElementById('detailViewBtn');
  if (url) {
    viewBtn.style.display = '';
    viewBtn.dataset.url = url;
    viewBtn.dataset.title = title;
  } else {
    viewBtn.style.display = 'none';
  }

  document.getElementById('detailModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeDetailModal() {
  document.getElementById('detailModal').classList.remove('active');
  document.body.style.overflow = '';
}

function openProjectFromDetail() {
  closeDetailModal();
  setTimeout(() => {
    openProjectModal(currentDetailProjectUrl, document.getElementById('detailTitle').textContent);
  }, 200);
}

// ---------- BLOG FUNCTIONS ----------
function filterBlogs(query) {
  const cards = document.querySelectorAll('.blog-card');
  const q = query.toLowerCase();
  cards.forEach(card => {
    const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
    const excerpt = card.querySelector('p')?.textContent.toLowerCase() || '';
    card.style.display = (title.includes(q) || excerpt.includes(q)) ? '' : 'none';
  });
}

// ---------- BOOKING FUNCTIONS ----------
function selectTimeSlot(el) {
  document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
}

// ---------- SUPABASE CRUD HELPERS ----------
async function supabaseInsert(table, data) {
  const sb = getSupabase();
  if (!sb) { showToast('Database not connected', 'error'); return null; }
  const { data: result, error } = await sb.from(table).insert(data).select();
  if (error) { showToast(error.message, 'error'); return null; }
  return result;
}

async function supabaseSelect(table, filters = {}) {
  const sb = getSupabase();
  if (!sb) return [];
  let query = sb.from(table).select('*');
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query = query.eq(key, val);
    }
  });
  query = query.order('created_at', { ascending: false });
  const { data, error } = await query;
  if (error) { showToast(error.message, 'error'); return []; }
  return data || [];
}

async function supabaseUpdate(table, id, data) {
  const sb = getSupabase();
  if (!sb) { showToast('Database not connected', 'error'); return null; }
  const { data: result, error } = await sb.from(table).update(data).eq('id', id).select();
  if (error) { showToast(error.message, 'error'); return null; }
  return result;
}

async function supabaseDelete(table, id) {
  const sb = getSupabase();
  if (!sb) { showToast('Database not connected', 'error'); return false; }
  const { error } = await sb.from(table).delete().eq('id', id);
  if (error) { showToast(error.message, 'error'); return false; }
  return true;
}

async function supabaseAuth(email, password) {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) { showToast(error.message, 'error'); return null; }
  return data;
}

async function supabaseSignOut() {
  const sb = getSupabase();
  if (sb) await sb.auth.signOut();
}

// ---------- INITIALIZE PROJECTS PAGE ----------
async function loadProjects() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
  const projects = await supabaseSelect('projects');
  if (projects.length === 0) {
    grid.innerHTML = '<div class="empty-state"><div class="icon">&#128196;</div><h3>No Projects Yet</h3><p>Projects will appear here once added.</p></div>';
    return;
  }
  grid.innerHTML = projects.map(p => `
    <div class="card project-card" data-project-id="${p.id}" data-description="${(p.description || '').replace(/"/g, '&quot;')}" data-project-url="${(p.project_url || '').replace(/"/g, '&quot;')}">
      ${p.image_url
        ? `<img src="${p.image_url}" alt="${p.title}">`
        : `<div style="height:200px;display:flex;align-items:center;justify-content:center;background:var(--bg-tertiary);color:var(--text-muted);font-size:0.95rem;">No image uploaded yet</div>`
      }
      <div class="card-body">
        <h3>${p.title}</h3>
        <div class="card-desc">${p.description || 'No description available.'}</div>
        <button class="btn-secondary btn-small" onclick="openDetailModal('${p.id}')">View More</button>
      </div>
    </div>
  `).join('');
}

// ---------- INITIALIZE BLOGS PAGE ----------
async function loadBlogs() {
  const grid = document.getElementById('blogsGrid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
  const blogs = await supabaseSelect('blogs');
  if (blogs.length === 0) {
    grid.innerHTML = '<div class="empty-state"><div class="icon">&#128221;</div><h3>No Blog Posts Yet</h3><p>No image uploaded yet. Blog posts will appear here once published from the admin panel.</p></div>';
    return;
  }
  grid.innerHTML = blogs.map(b => `
    <div class="card blog-card">
      <div class="blog-image">
        ${b.image_url
          ? `<img src="${b.image_url}" alt="${b.title}">`
          : `<div style="height:200px;display:flex;align-items:center;justify-content:center;background:var(--bg-tertiary);color:var(--text-muted);font-size:0.95rem;">No image uploaded yet</div>`
        }
      </div>
      <div class="card-body">
        <div class="blog-meta">
          <span>&#128197; ${new Date(b.created_at).toLocaleDateString()}</span>
          <span>&#128100; ${b.author || 'PhidAgency'}</span>
        </div>
        <h3>${b.title}</h3>
        <p>${(b.content || '').substring(0, 150)}${(b.content || '').length > 150 ? '...' : ''}</p>
        <button class="btn-secondary btn-small" onclick="viewBlog('${b.id}')">Read More</button>
      </div>
    </div>
  `).join('');
}

function viewBlog(id) {
  window.location.href = `blog-detail.html?id=${id}`;
}

// ---------- INITIALIZE CONTACTS ----------
async function handleContactSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    name: form.querySelector('[name="name"]').value,
    email: form.querySelector('[name="email"]').value,
    subject: form.querySelector('[name="subject"]').value,
    message: form.querySelector('[name="message"]').value,
    status: 'unread'
  };
  const result = await supabaseInsert('contacts', data);
  if (result) {
    showToast('Message sent successfully!');
    form.reset();
  }
}

// ---------- INITIALIZE BOOKING ----------
async function handleBookingSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const selectedSlot = document.querySelector('.time-slot.selected');
  if (!selectedSlot) {
    showToast('Please select a time slot', 'warning');
    return;
  }
  const data = {
    name: form.querySelector('[name="name"]').value,
    email: form.querySelector('[name="email"]').value,
    phone: form.querySelector('[name="phone"]').value,
    service: form.querySelector('[name="service"]').value,
    date: form.querySelector('[name="date"]').value,
    time: selectedSlot.textContent.trim(),
    message: form.querySelector('[name="message"]')?.value || '',
    status: 'pending'
  };
  const result = await supabaseInsert('bookings', data);
  if (result) {
    showToast('Booking submitted successfully!');
    form.reset();
    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
  }
}

// ---------- ADMIN FUNCTIONS ----------
let currentAdminTab = 'projects';

function switchAdminTab(tab) {
  currentAdminTab = tab;
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.toggle('active', p.id === `panel-${tab}`));
  loadAdminData(tab);
}

async function loadAdminData(tab) {
  switch (tab) {
    case 'home': await loadAdminHomeSections(); break;
    case 'hero': await loadAdminHeroSlides(); break;
    case 'projects': await loadAdminProjects(); break;
    case 'blogs': await loadAdminBlogs(); break;
    case 'contacts': await loadAdminContacts(); break;
    case 'bookings': await loadAdminBookings(); break;
    case 'settings': await loadSiteSettings(); break;
  }
}

async function loadAdminProjects() {
  const tbody = document.getElementById('projectsTableBody');
  if (!tbody) return;
  const projects = await supabaseSelect('projects');
  tbody.innerHTML = projects.length === 0
    ? '<tr><td colspan="4" class="text-center">No projects found</td></tr>'
    : projects.map(p => `
      <tr>
        <td>${p.title}</td>
        <td>${(p.description || '').substring(0, 50)}...</td>
        <td><span class="badge badge-success">Active</span></td>
        <td>
          <button class="btn-secondary btn-small" onclick="editProject('${p.id}')">Edit</button>
          <button class="btn-danger btn-small" onclick="deleteRecord('projects', '${p.id}', loadAdminProjects)">Delete</button>
        </td>
      </tr>
    `).join('');
}

async function loadAdminBlogs() {
  const tbody = document.getElementById('blogsTableBody');
  if (!tbody) return;
  const blogs = await supabaseSelect('blogs');
  tbody.innerHTML = blogs.length === 0
    ? '<tr><td colspan="4" class="text-center">No blogs found</td></tr>'
    : blogs.map(b => `
      <tr>
        <td>${b.title}</td>
        <td>${b.author || 'PhidAgency'}</td>
        <td>${new Date(b.created_at).toLocaleDateString()}</td>
        <td>
          <button class="btn-secondary btn-small" onclick="editBlog('${b.id}')">Edit</button>
          <button class="btn-danger btn-small" onclick="deleteRecord('blogs', '${b.id}', loadAdminBlogs)">Delete</button>
        </td>
      </tr>
    `).join('');
}

async function loadAdminContacts() {
  const tbody = document.getElementById('contactsTableBody');
  if (!tbody) return;
  const contacts = await supabaseSelect('contacts');
  tbody.innerHTML = contacts.length === 0
    ? '<tr><td colspan="5" class="text-center">No contacts found</td></tr>'
    : contacts.map(c => `
      <tr>
        <td>${c.name}</td>
        <td>${c.email}</td>
        <td>${(c.subject || '-').substring(0, 30)}</td>
        <td><span class="badge ${c.status === 'read' ? 'badge-success' : 'badge-warning'}">${c.status || 'unread'}</span></td>
        <td>
          <button class="btn-secondary btn-small" onclick="viewContact('${c.id}')" title="View"><i class="fas fa-eye"></i></button>
          <button class="btn-secondary btn-small" onclick="toggleContactReadStatus('${c.id}', '${c.status || 'unread'}')" title="Toggle Status"><i class="fas fa-envelope-open${c.status === 'read' ? '-text' : ''}"></i></button>
          <button class="btn-danger btn-small" onclick="deleteRecord('contacts', '${c.id}', loadAdminContacts)" title="Delete"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
}

let currentContactId = null;

async function viewContact(id) {
  const contacts = await supabaseSelect('contacts');
  const c = contacts.find(x => x.id === id);
  if (!c) return;
  currentContactId = id;
  document.getElementById('contactModalName').textContent = c.name;
  document.getElementById('contactModalEmail').textContent = c.email;
  document.getElementById('contactModalSubject').textContent = c.subject || '-';
  document.getElementById('contactModalMessage').textContent = c.message || '-';
  document.getElementById('contactModalDate').textContent = new Date(c.created_at).toLocaleString();
  const statusBtn = document.getElementById('contactModalStatusBtn');
  statusBtn.textContent = c.status === 'read' ? 'Mark as Unread' : 'Mark as Read';
  statusBtn.dataset.status = c.status || 'unread';
  document.getElementById('contactModal').classList.add('active');
  document.body.style.overflow = 'hidden';
  // Auto-mark as read when viewing
  if (c.status !== 'read') {
    await supabaseUpdate('contacts', id, { status: 'read' });
    loadAdminContacts();
  }
}

function closeContactModal() {
  document.getElementById('contactModal').classList.remove('active');
  document.body.style.overflow = '';
  currentContactId = null;
}

async function toggleContactStatus() {
  if (!currentContactId) return;
  const btn = document.getElementById('contactModalStatusBtn');
  const newStatus = btn.dataset.status === 'read' ? 'unread' : 'read';
  const result = await supabaseUpdate('contacts', currentContactId, { status: newStatus });
  if (result) {
    showToast(`Marked as ${newStatus}`);
    btn.textContent = newStatus === 'read' ? 'Mark as Unread' : 'Mark as Read';
    btn.dataset.status = newStatus;
    loadAdminContacts();
  }
}

async function toggleContactReadStatus(id, currentStatus) {
  const newStatus = currentStatus === 'read' ? 'unread' : 'read';
  const result = await supabaseUpdate('contacts', id, { status: newStatus });
  if (result) {
    showToast(`Marked as ${newStatus}`);
    loadAdminContacts();
  }
}

async function deleteContactFromModal() {
  if (!currentContactId) return;
  if (confirm('Delete this contact message?')) {
    const result = await supabaseDelete('contacts', currentContactId);
    if (result) {
      showToast('Contact deleted');
      closeContactModal();
      loadAdminContacts();
    }
  }
}

async function loadAdminBookings() {
  const tbody = document.getElementById('bookingsTableBody');
  if (!tbody) return;
  const bookings = await supabaseSelect('bookings');
  tbody.innerHTML = bookings.length === 0
    ? '<tr><td colspan="5" class="text-center">No bookings found</td></tr>'
    : bookings.map(b => `
      <tr>
        <td>${b.name}</td>
        <td>${b.service}</td>
        <td>${b.date} ${b.time}</td>
        <td><span class="badge badge-${b.status === 'confirmed' ? 'success' : b.status === 'cancelled' ? 'danger' : 'warning'}">${b.status || 'pending'}</span></td>
        <td>
          <button class="btn-secondary btn-small" onclick="updateBookingStatus('${b.id}', 'confirmed')">Confirm</button>
          <button class="btn-danger btn-small" onclick="deleteRecord('bookings', '${b.id}', loadAdminBookings)">Delete</button>
        </td>
      </tr>
    `).join('');
}

async function updateBookingStatus(id, status) {
  const result = await supabaseUpdate('bookings', id, { status });
  if (result) {
    showToast(`Booking ${status}`);
    loadAdminBookings();
  }
}

async function deleteRecord(table, id, reloadFn) {
  if (confirm('Are you sure you want to delete this record?')) {
    const result = await supabaseDelete(table, id);
    if (result) {
      showToast('Record deleted');
      reloadFn();
    }
  }
}

// ---------- ADMIN PROJECT FORM ----------
async function handleProjectSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const id = form.dataset.editId;
  const data = {
    title: form.querySelector('[name="title"]').value,
    description: form.querySelector('[name="description"]').value,
    image_url: form.querySelector('[name="image_url"]').value,
    project_url: form.querySelector('[name="project_url"]').value
  };
  let result;
  if (id) {
    result = await supabaseUpdate('projects', id, data);
  } else {
    result = await supabaseInsert('projects', data);
  }
  if (result) {
    showToast(id ? 'Project updated' : 'Project created');
    form.reset();
    form.dataset.editId = '';
    loadAdminProjects();
  }
}

async function editProject(id) {
  const projects = await supabaseSelect('projects');
  const p = projects.find(x => x.id === id);
  if (!p) return;
  const form = document.getElementById('projectForm');
  if (!form) return;
  form.dataset.editId = id;
  form.querySelector('[name="title"]').value = p.title || '';
  form.querySelector('[name="description"]').value = p.description || '';
  form.querySelector('[name="image_url"]').value = p.image_url || '';
  form.querySelector('[name="project_url"]').value = p.project_url || '';
  form.scrollIntoView({ behavior: 'smooth' });
}

// ---------- ADMIN BLOG FORM ----------
async function handleBlogSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const id = form.dataset.editId;
  const data = {
    title: form.querySelector('[name="title"]').value,
    content: form.querySelector('[name="content"]').value,
    image_url: form.querySelector('[name="image_url"]').value,
    author: form.querySelector('[name="author"]').value || 'PhidAgency'
  };
  let result;
  if (id) {
    result = await supabaseUpdate('blogs', id, data);
  } else {
    result = await supabaseInsert('blogs', data);
  }
  if (result) {
    showToast(id ? 'Blog updated' : 'Blog published');
    form.reset();
    form.dataset.editId = '';
    loadAdminBlogs();
  }
}

async function editBlog(id) {
  const blogs = await supabaseSelect('blogs');
  const b = blogs.find(x => x.id === id);
  if (!b) return;
  const form = document.getElementById('blogForm');
  if (!form) return;
  form.dataset.editId = id;
  form.querySelector('[name="title"]').value = b.title || '';
  form.querySelector('[name="content"]').value = b.content || '';
  form.querySelector('[name="image_url"]').value = b.image_url || '';
  form.querySelector('[name="author"]').value = b.author || '';
  form.scrollIntoView({ behavior: 'smooth' });
}

// ---------- ADMIN AUTH ----------
async function handleAdminLogin(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.querySelector('[name="email"]').value;
  const password = form.querySelector('[name="password"]').value;
  const data = await supabaseAuth(email, password);
  if (data) {
    showToast('Logged in successfully');
    localStorage.setItem('phidadmin', 'true');
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('adminContent').classList.remove('hidden');
    loadAdminData('projects');
  }
}

function checkAdminAuth() {
  const isLoggedIn = localStorage.getItem('phidadmin');
  if (isLoggedIn) {
    const login = document.getElementById('loginSection');
    const content = document.getElementById('adminContent');
    if (login) login.classList.add('hidden');
    if (content) content.classList.remove('hidden');
  }
}

function adminLogout() {
  localStorage.removeItem('phidadmin');
  supabaseSignOut();
  const login = document.getElementById('loginSection');
  const content = document.getElementById('adminContent');
  if (login) login.classList.remove('hidden');
  if (content) content.classList.add('hidden');
  showToast('Logged out');
}

// ---------- HOME SECTIONS (Frontend Render) ----------
function formatContent(text) {
  if (!text) return '';
  return text
    .split('\n')
    .map(line => {
      line = line.trim();
      if (!line) return '';
      if (line.startsWith('- ') || line.startsWith('– ')) {
        return '<li>' + line.substring(2) + '</li>';
      }
      return '<p>' + line + '</p>';
    })
    .join('')
    .replace(/<\/li>\s*<li>/g, '</li><li>')
    .replace(/<li>/g, '<ul class="policy-list"><li>')
    .replace(/<\/li>(?!.*<li>)/g, '</li></ul>');
}

async function loadHomeSections() {
  const container = document.getElementById('homeSections');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

  const sb = getSupabase();
  if (!sb) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);">Database not connected</p>';
    return;
  }

  const { data: sections, error } = await sb
    .from('home_sections')
    .select('*')
    .eq('visible', true)
    .order('order_num', { ascending: true });

  if (error || !sections || sections.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);">No sections available yet.</p>';
    return;
  }

  container.innerHTML = sections.map(s => {
    const isImageLeft = s.layout === 'image-left';
    const imgHtml = s.image_url
      ? `<img src="${s.image_url}" alt="${s.title}">`
      : `<div style="height:350px;display:flex;align-items:center;justify-content:center;background:var(--bg-tertiary);color:var(--text-muted);font-size:0.95rem;border-radius:16px;">No image uploaded yet</div>`;
    const contentHtml = formatContent(s.content);
    const btnHtml = s.button_text
      ? `<a href="${s.button_link || '#'}" class="btn">${s.button_text}</a>`
      : '';

    return `
      <div class="article-row${isImageLeft ? '' : ' reverse'}">
        <div>${imgHtml}</div>
        <div class="article-text">
          <h3>${s.title}</h3>
          ${contentHtml}
          ${btnHtml}
        </div>
      </div>
    `;
  }).join('');
}

// ---------- ADMIN HOME SECTIONS ----------
async function loadAdminHomeSections() {
  const tbody = document.getElementById('homeSectionsTableBody');
  if (!tbody) return;
  const sections = await supabaseSelect('home_sections');
  tbody.innerHTML = sections.length === 0
    ? '<tr><td colspan="5" class="text-center">No sections found</td></tr>'
    : sections.map(s => `
      <tr>
        <td>${s.section_key}</td>
        <td>${s.title}</td>
        <td>${s.layout === 'image-left' ? 'Image Left' : 'Image Right'}</td>
        <td><span class="badge ${s.visible ? 'badge-success' : 'badge-danger'}">${s.visible ? 'Visible' : 'Hidden'}</span></td>
        <td>
          <button class="btn-secondary btn-small" onclick="editHomeSection('${s.id}')">Edit</button>
          <button class="btn-secondary btn-small" onclick="toggleHomeSectionVisibility('${s.id}', ${!s.visible})">${s.visible ? 'Hide' : 'Show'}</button>
        </td>
      </tr>
    `).join('');
}

async function handleHomeSectionSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const id = form.dataset.editId;
  const data = {
    section_key: form.querySelector('[name="section_key"]').value,
    title: form.querySelector('[name="title"]').value,
    content: form.querySelector('[name="content"]').value,
    image_url: form.querySelector('[name="image_url"]').value,
    button_text: form.querySelector('[name="button_text"]').value,
    button_link: form.querySelector('[name="button_link"]').value,
    order_num: parseInt(form.querySelector('[name="order_num"]').value) || 0,
    layout: form.querySelector('[name="layout"]').value,
    visible: form.querySelector('[name="visible"]').checked
  };
  let result;
  if (id) {
    result = await supabaseUpdate('home_sections', id, data);
  } else {
    result = await supabaseInsert('home_sections', data);
  }
  if (result) {
    showToast(id ? 'Section updated' : 'Section created');
    form.reset();
    form.dataset.editId = '';
    document.getElementById('homeSectionSubmitBtn').textContent = 'Create Section';
    loadAdminHomeSections();
  }
}

async function editHomeSection(id) {
  const sections = await supabaseSelect('home_sections');
  const s = sections.find(x => x.id === id);
  if (!s) return;
  const form = document.getElementById('homeSectionForm');
  if (!form) return;
  form.dataset.editId = id;
  form.querySelector('[name="section_key"]').value = s.section_key || '';
  form.querySelector('[name="title"]').value = s.title || '';
  form.querySelector('[name="content"]').value = s.content || '';
  form.querySelector('[name="image_url"]').value = s.image_url || '';
  form.querySelector('[name="button_text"]').value = s.button_text || '';
  form.querySelector('[name="button_link"]').value = s.button_link || '';
  form.querySelector('[name="order_num"]').value = s.order_num || 0;
  form.querySelector('[name="layout"]').value = s.layout || 'image-left';
  form.querySelector('[name="visible"]').checked = s.visible !== false;
  document.getElementById('homeSectionSubmitBtn').textContent = 'Update Section';
  form.scrollIntoView({ behavior: 'smooth' });
}

async function toggleHomeSectionVisibility(id, visible) {
  const result = await supabaseUpdate('home_sections', id, { visible });
  if (result) {
    showToast(visible ? 'Section now visible' : 'Section hidden');
    loadAdminHomeSections();
  }
}

async function deleteHomeSection(id) {
  if (confirm('Delete this section?')) {
    const result = await supabaseDelete('home_sections', id);
    if (result) {
      showToast('Section deleted');
      loadAdminHomeSections();
    }
  }
}

// ---------- ABOUT PAGE SECTIONS ----------
async function loadAboutSection() {
  const container = document.getElementById('aboutWhoWeAre');
  if (!container) return;

  const sb = getSupabase();
  if (!sb) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);">Database not connected</p>';
    return;
  }

  const { data: section, error } = await sb
    .from('home_sections')
    .select('*')
    .eq('section_key', 'about_who_we_are')
    .eq('visible', true)
    .single();

  if (error || !section) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);">No content available yet. Add "Who We Are" section from the admin panel.</p>';
    return;
  }

  const imgHtml = section.image_url
    ? `<img src="${section.image_url}" alt="${section.title}">`
    : `<div style="height:400px;display:flex;align-items:center;justify-content:center;background:var(--bg-tertiary);color:var(--text-muted);font-size:0.95rem;border-radius:16px;">No image uploaded yet</div>`;
  const contentHtml = formatContent(section.content);

  container.innerHTML = `
    <div class="about-hero">
      <div class="about-image">${imgHtml}</div>
      <div>
        <h2 style="font-size:2rem;margin-bottom:16px;">${section.title}</h2>
        ${contentHtml}
      </div>
    </div>
  `;
}

// ---------- ADMIN HERO SLIDES ----------
async function loadAdminHeroSlides() {
  const tbody = document.getElementById('heroSlidesTableBody');
  if (!tbody) return;
  const slides = await supabaseSelect('hero_slides');
  tbody.innerHTML = slides.length === 0
    ? '<tr><td colspan="5" class="text-center">No slides found</td></tr>'
    : slides.map(s => `
      <tr>
        <td><img src="${s.image_url}" alt="" style="width:80px;height:50px;object-fit:cover;border-radius:6px;"></td>
        <td>${s.title || '-'}</td>
        <td>${s.order_num}</td>
        <td><span class="badge ${s.visible ? 'badge-success' : 'badge-danger'}">${s.visible ? 'Visible' : 'Hidden'}</span></td>
        <td>
          <button class="btn-secondary btn-small" onclick="editHeroSlide('${s.id}')">Edit</button>
          <button class="btn-danger btn-small" onclick="deleteRecord('hero_slides', '${s.id}', loadAdminHeroSlides)">Delete</button>
        </td>
      </tr>
    `).join('');
}

async function handleHeroSlideSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const id = form.dataset.editId;
  const data = {
    image_url: form.querySelector('[name="image_url"]').value,
    title: form.querySelector('[name="title"]').value,
    subtitle: form.querySelector('[name="subtitle"]').value,
    button_text: form.querySelector('[name="button_text"]').value,
    button_link: form.querySelector('[name="button_link"]').value,
    order_num: parseInt(form.querySelector('[name="order_num"]').value) || 0,
    visible: form.querySelector('[name="visible"]').checked
  };
  let result;
  if (id) {
    result = await supabaseUpdate('hero_slides', id, data);
  } else {
    result = await supabaseInsert('hero_slides', data);
  }
  if (result) {
    showToast(id ? 'Slide updated' : 'Slide created');
    form.reset();
    form.dataset.editId = '';
    document.getElementById('heroSlideSubmitBtn').textContent = 'Add Slide';
    loadAdminHeroSlides();
  }
}

async function editHeroSlide(id) {
  const slides = await supabaseSelect('hero_slides');
  const s = slides.find(x => x.id === id);
  if (!s) return;
  const form = document.getElementById('heroSlideForm');
  if (!form) return;
  form.dataset.editId = id;
  form.querySelector('[name="image_url"]').value = s.image_url || '';
  form.querySelector('[name="title"]').value = s.title || '';
  form.querySelector('[name="subtitle"]').value = s.subtitle || '';
  form.querySelector('[name="button_text"]').value = s.button_text || '';
  form.querySelector('[name="button_link"]').value = s.button_link || '';
  form.querySelector('[name="order_num"]').value = s.order_num || 0;
  form.querySelector('[name="visible"]').checked = s.visible !== false;
  document.getElementById('heroSlideSubmitBtn').textContent = 'Update Slide';
  form.scrollIntoView({ behavior: 'smooth' });
}

// ---------- ADMIN SITE SETTINGS ----------
async function loadSiteSettings() {
  const sb = getSupabase();
  if (!sb) return;
  const { data } = await sb.from('site_settings').select('*');
  if (!data) return;
  data.forEach(s => {
    const input = document.querySelector(`[data-setting="${s.setting_key}"]`);
    if (input) input.value = s.setting_value || '';
  });
}

async function saveSiteSettings() {
  const sb = getSupabase();
  if (!sb) return;
  const inputs = document.querySelectorAll('[data-setting]');
  for (const input of inputs) {
    const key = input.dataset.setting;
    const value = input.value;
    const { error } = await sb.from('site_settings').upsert({ setting_key: key, setting_value: value }, { onConflict: 'setting_key' });
    if (error) { showToast(error.message, 'error'); return; }
  }
  showToast('Settings saved');
}

// ---------- LOAD SITE SETTINGS FOR PAGES ----------
let cachedSettings = null;

async function getSiteSettings() {
  if (cachedSettings) return cachedSettings;
  const sb = getSupabase();
  if (!sb) return {};
  const { data } = await sb.from('site_settings').select('setting_key, setting_value');
  if (!data) return {};
  cachedSettings = {};
  data.forEach(s => { cachedSettings[s.setting_key] = s.setting_value; });
  return cachedSettings;
}

function getSetting(settings, key, fallback = '') {
  return settings[key] || fallback;
}

// Load contact info into elements with data-contact attribute
async function loadContactInfo() {
  const settings = await getSiteSettings();
  document.querySelectorAll('[data-contact]').forEach(el => {
    const key = el.dataset.contact;
    const val = getSetting(settings, key);
    if (val && val !== '#') {
      if (el.tagName === 'A') {
        el.href = key === 'contact_email' ? 'mailto:' + val : key === 'contact_phone' ? 'tel:' + val : val;
        el.textContent = val;
      } else {
        el.textContent = val;
      }
    }
  });
}

// Load social links into elements with data-social attribute
async function loadSocialLinks() {
  const settings = await getSiteSettings();
  document.querySelectorAll('[data-social]').forEach(el => {
    const key = el.dataset.social;
    const url = getSetting(settings, key, '#');
    el.href = url;
    if (url === '#' || !url) {
      el.style.display = 'none';
    } else {
      el.style.display = '';
    }
  });
}

// Load booking info into elements with data-booking attribute
async function loadBookingInfo() {
  const settings = await getSiteSettings();
  document.querySelectorAll('[data-booking]').forEach(el => {
    const key = el.dataset.booking;
    const val = getSetting(settings, key);
    if (val) el.textContent = val;
  });
}
