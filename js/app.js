/* =====================================================
   app.js — Filipino Cookbook Client Application Logic
   Consumes the Filipino Cookbook API (ordono)
   Endpoints: GET /api/foods, GET /api/foods/{id},
              GET /api/foods/search/{name}, GET /api/categories
   ===================================================== */

'use strict';

// ─────────────────────────────────────────
// STATE
// ─────────────────────────────────────────
let allFoods = [];
let allCategories = [];
let activeSection = 'home';

// ─────────────────────────────────────────
// CLIENT-SIDE RATE LIMITER
// ─────────────────────────────────────────
const RATE_LIMIT = {
  maxRequests: 10,      // max requests allowed
  windowMs: 30 * 1000,  // per 30 seconds
  timestamps: [],       // sliding window of request timestamps
};

function checkRateLimit() {
  const now = Date.now();
  // Remove timestamps outside the current window
  RATE_LIMIT.timestamps = RATE_LIMIT.timestamps.filter(
    t => now - t < RATE_LIMIT.windowMs
  );
  if (RATE_LIMIT.timestamps.length >= RATE_LIMIT.maxRequests) {
    const oldest = RATE_LIMIT.timestamps[0];
    const waitMs = RATE_LIMIT.windowMs - (now - oldest);
    const waitSec = Math.ceil(waitMs / 1000);
    showRateLimitPopup(waitSec);
    return false;
  }
  RATE_LIMIT.timestamps.push(now);
  return true;
}

// ─────────────────────────────────────────
// RATE LIMIT POPUP — dynamically injected
// ─────────────────────────────────────────
let _rateLimitCountdownTimer = null;

function showRateLimitPopup(waitSeconds) {
  if (_rateLimitCountdownTimer) clearInterval(_rateLimitCountdownTimer);

  // Remove any existing popup
  const old = document.getElementById('rate-limit-popup');
  if (old) old.remove();

  let remaining = waitSeconds;
  const total   = waitSeconds;

  // Build overlay as a direct <body> child so position:fixed always works
  const overlay = document.createElement('div');
  overlay.id = 'rate-limit-popup';

  // Apply all critical layout styles via cssText — no external CSS dependency
  overlay.style.cssText =
    'position:fixed;top:0;left:0;right:0;bottom:0;' +
    'width:100vw;height:100vh;z-index:999999;' +
    'display:flex;align-items:center;justify-content:center;' +
    'background:rgba(0,0,0,0.72);' +
    'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);' +
    'box-sizing:border-box;padding:1rem;' +
    'opacity:0;transition:opacity 0.25s ease;';

  overlay.innerHTML = `
    <div id="rl-card" style="
      background:#1E1E1E;
      border:1px solid rgba(231,76,60,0.35);
      border-radius:16px;
      box-shadow:0 0 0 1px rgba(231,76,60,0.1),0 12px 56px rgba(0,0,0,0.85),0 0 80px rgba(231,76,60,0.08);
      width:100%;max-width:360px;overflow:hidden;
      font-family:'Inter',system-ui,sans-serif;
      transform:translateY(-20px) scale(0.95);
      transition:transform 0.38s cubic-bezier(0.34,1.45,0.64,1),opacity 0.35s ease;
      opacity:0;">

      <div style="background:#2A2A2A;display:flex;align-items:center;justify-content:center;padding:2rem 1rem;">
        <div style="width:72px;height:72px;border-radius:50%;background:rgba(231,76,60,0.12);border:2px solid rgba(231,76,60,0.4);display:flex;align-items:center;justify-content:center;">
          <span style="font-size:2rem;line-height:1;">⚠️</span>
        </div>
      </div>

      <div style="height:1px;background:rgba(255,255,255,0.08);"></div>

      <div style="padding:1.25rem 1.4rem 1.4rem;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.65rem;">
          <span style="font-size:0.68rem;font-weight:600;letter-spacing:0.09em;color:#E74C3C;background:rgba(231,76,60,0.14);border:1px solid rgba(231,76,60,0.28);border-radius:99px;padding:0.22rem 0.65rem;text-transform:uppercase;">RATE LIMITED</span>
          <span style="font-size:0.8rem;color:#9A8E7E;">🔒 10 req / 30s</span>
        </div>

        <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:1.55rem;font-weight:700;color:#F5F0E8;margin:0 0 0.5rem;line-height:1.2;">Too Many Requests</h2>

        <p style="font-size:0.88rem;color:#9A8E7E;line-height:1.6;margin:0 0 1.1rem;">
          You've hit the request limit. Please wait a moment before continuing to explore Filipino recipes.
        </p>

        <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:99px;overflow:hidden;margin-bottom:1.15rem;">
          <div id="rate-limit-bar" style="height:100%;width:100%;background:linear-gradient(90deg,#7B241C,#E74C3C,#F4A623);border-radius:99px;transition:width 1s linear;"></div>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(255,255,255,0.08);padding-top:1rem;">
          <span style="font-size:0.83rem;color:#9A8E7E;display:flex;align-items:center;gap:0.3rem;">
            ⏱ Try again in
            <strong id="rate-limit-countdown" style="font-family:'Playfair Display',Georgia,serif;font-size:1.15rem;color:#E74C3C;font-weight:700;">${remaining}</strong>s
          </span>
          <button onclick="closeRateLimitPopup()"
            onmouseover="this.style.background='rgba(244,166,35,0.12)';this.style.color='#FFD07A';"
            onmouseout="this.style.background='none';this.style.color='#F4A623';"
            style="background:none;border:none;cursor:pointer;font-family:'Inter',system-ui,sans-serif;font-size:0.85rem;font-weight:600;color:#F4A623;padding:0.35rem 0.7rem;border-radius:8px;transition:all 0.2s ease;">
            Dismiss ✕
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Animate in on next paint frame
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    const card = document.getElementById('rl-card');
    if (card) { card.style.opacity = '1'; card.style.transform = 'translateY(0) scale(1)'; }
  });

  _rateLimitCountdownTimer = setInterval(() => {
    remaining--;
    const cd  = document.getElementById('rate-limit-countdown');
    const bar = document.getElementById('rate-limit-bar');
    if (cd)  cd.textContent  = remaining;
    if (bar) bar.style.width = `${Math.max(0, (remaining / total) * 100)}%`;
    if (remaining <= 0) { clearInterval(_rateLimitCountdownTimer); closeRateLimitPopup(); }
  }, 1000);
}

function closeRateLimitPopup() {
  if (_rateLimitCountdownTimer) clearInterval(_rateLimitCountdownTimer);
  const overlay = document.getElementById('rate-limit-popup');
  if (!overlay) return;
  const card = document.getElementById('rl-card');
  overlay.style.opacity = '0';
  if (card) { card.style.opacity = '0'; card.style.transform = 'translateY(-14px) scale(0.96)'; }
  setTimeout(() => { const el = document.getElementById('rate-limit-popup'); if (el) el.remove(); }, 350);
}

// ─────────────────────────────────────────
// UTILITY: fetch wrapper with auth headers
// ─────────────────────────────────────────
async function apiFetch(endpoint) {
  // Client-side rate limit check
  if (!checkRateLimit()) {
    throw new Error('Rate limit exceeded. Please wait before making more requests.');
  }

  const url = `${API_CONFIG.baseUrl}${endpoint}`;
  const res = await fetch(url, { headers: API_CONFIG.headers });

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get('Retry-After') || '30', 10);
    showRateLimitPopup(retryAfter);
    throw new Error(`Too many requests. Please wait ${retryAfter} seconds and try again.`);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}


// ─────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────
function showSection(name) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
  document.getElementById('section-home').classList.add('hidden');

  activeSection = name;

  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const activeLink = document.getElementById(`nav-${name}`);
  if (activeLink) activeLink.classList.add('active');

  if (name === 'home') {
    document.getElementById('section-home').classList.remove('hidden');
    document.getElementById('section-stats').style.display = 'flex';
  } else {
    document.getElementById('section-stats').style.display = 'none';
    const section = document.getElementById(`section-${name}`);
    if (section) {
      section.classList.remove('hidden');
      if (name === 'foods') loadFoods();
      if (name === 'categories') loadCategories();
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─────────────────────────────────────────
// LOAD STATS (for hero)
// ─────────────────────────────────────────
async function loadStats() {
  try {
    const [foods, categories, ingredients] = await Promise.all([
      apiFetch('/api/foods'),
      apiFetch('/api/categories'),
      apiFetch('/api/ingredients')
    ]);
    animateCounter('stat-foods', foods.length);
    animateCounter('stat-categories', categories.length);
    animateCounter('stat-ingredients', ingredients.length);
    allFoods = foods;
    allCategories = categories;
  } catch (e) {
    console.warn('Stats load failed:', e.message);
  }
}

function animateCounter(id, target) {
  const el = document.getElementById(id);
  let current = 0;
  const step = Math.ceil(target / 30);
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = current;
  }, 40);
}

// ─────────────────────────────────────────
// LOAD ALL FOODS
// ─────────────────────────────────────────
async function loadFoods() {
  const grid = document.getElementById('food-grid');
  const loading = document.getElementById('foods-loading');
  const error = document.getElementById('foods-error');

  grid.innerHTML = '';
  show(loading); hide(error);

  try {
    if (allFoods.length === 0) allFoods = await apiFetch('/api/foods');
    if (allCategories.length === 0) allCategories = await apiFetch('/api/categories');
    hide(loading);
    buildFilterPills(allCategories);
    renderFoodGrid(allFoods, grid);
  } catch (e) {
    hide(loading);
    document.getElementById('foods-error-msg').textContent = `Error: ${e.message}`;
    show(error);
  }
}

function renderFoodGrid(foods, grid) {
  grid.innerHTML = '';
  if (foods.length === 0) {
    grid.innerHTML = '<p class="no-results">No dishes found.</p>';
    return;
  }
  foods.forEach((food, i) => {
    const card = createFoodCard(food, i);
    grid.appendChild(card);
  });
}

function createFoodCard(food, delay = 0) {
  const card = document.createElement('div');
  card.className = 'food-card';
  card.style.animationDelay = `${delay * 0.05}s`;
  card.setAttribute('id', `food-card-${food.food_id}`);

  const emoji = getCategoryEmoji(food.category_name);
  const ingCount = food.ingredients ? food.ingredients.length : 0;
  const imgSrc = getFoodImage(food.food_name);

  card.innerHTML = `
    <div class="card-image-wrap">
      <img
        class="card-image"
        src="${imgSrc}"
        alt="${food.food_name}"
        loading="lazy"
        onerror="this.parentElement.innerHTML='<div class=\'card-emoji\'>${emoji}</div>';"
      />
      <span class="card-category-badge">${emoji} ${food.category_name}</span>
    </div>
    <div class="card-body">
      <div class="card-meta">
        <span class="card-origin">📍 ${food.origin_name}</span>
      </div>
      <h3 class="card-title">${food.food_name}</h3>
      <p class="card-preview">${truncate(food.instructions, 90)}</p>
      <div class="card-footer">
        <span class="card-ingredients">🥬 ${ingCount} ingredient${ingCount !== 1 ? 's' : ''}</span>
        <button class="btn-view" onclick="openFoodDetail(${food.food_id})">View Recipe →</button>
      </div>
    </div>
  `;
  return card;
}

// ─────────────────────────────────────────
// CATEGORY FILTER
// ─────────────────────────────────────────
function buildFilterPills(categories) {
  const bar = document.getElementById('filter-bar');
  bar.innerHTML = '<button class="filter-pill active" data-category="all" onclick="filterByCategory(\'all\', this)">All</button>';
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-pill';
    btn.dataset.category = cat.category_name;
    btn.textContent = `${getCategoryEmoji(cat.category_name)} ${cat.category_name}`;
    btn.onclick = () => filterByCategory(cat.category_name, btn);
    bar.appendChild(btn);
  });
}

function filterByCategory(categoryName, btn) {
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const grid = document.getElementById('food-grid');
  const filtered = categoryName === 'all'
    ? allFoods
    : allFoods.filter(f => f.category_name === categoryName);
  renderFoodGrid(filtered, grid);
}

// ─────────────────────────────────────────
// LOAD CATEGORIES
// ─────────────────────────────────────────
async function loadCategories() {
  const grid = document.getElementById('category-grid');
  const loading = document.getElementById('categories-loading');
  const error = document.getElementById('categories-error');

  grid.innerHTML = '';
  show(loading); hide(error);

  try {
    if (allCategories.length === 0) allCategories = await apiFetch('/api/categories');
    if (allFoods.length === 0) allFoods = await apiFetch('/api/foods');
    hide(loading);
    renderCategoryCards(allCategories, grid);
  } catch (e) {
    hide(loading);
    document.getElementById('categories-error-msg').textContent = `Error: ${e.message}`;
    show(error);
  }
}

function renderCategoryCards(categories, grid) {
  grid.innerHTML = '';

  const allCard = document.createElement('div');
  allCard.className = 'category-card category-card-all';
  allCard.innerHTML = `
    <div class="cat-emoji">🍽️</div>
    <h3 class="cat-name">All Dishes</h3>
    <p class="cat-count">${allFoods.length} dish${allFoods.length !== 1 ? 'es' : ''}</p>
    <button class="btn btn-primary cat-btn" onclick="goToCategoryFoods('all')">
      Browse All →
    </button>
  `;
  grid.appendChild(allCard);

  categories.forEach((cat, i) => {
    const count = allFoods.filter(f => f.category_name === cat.category_name).length;
    const card = document.createElement('div');
    card.className = 'category-card';
    card.style.animationDelay = `${(i + 1) * 0.07}s`;
    card.innerHTML = `
      <div class="cat-emoji">${getCategoryEmoji(cat.category_name)}</div>
      <h3 class="cat-name">${cat.category_name}</h3>
      <p class="cat-count">${count} dish${count !== 1 ? 'es' : ''}</p>
      <button class="btn btn-ghost cat-btn" onclick="goToCategoryFoods('${cat.category_name}')">
        Browse →
      </button>
    `;
    grid.appendChild(card);
  });
}

function goToCategoryFoods(categoryName) {
  showSection('foods');
  setTimeout(() => {
    if (categoryName === 'all') {
      const allPill = document.querySelector('.filter-pill[data-category="all"]');
      if (allPill) filterByCategory('all', allPill);
    } else {
      const pill = [...document.querySelectorAll('.filter-pill')]
        .find(p => p.dataset.category === categoryName);
      if (pill) filterByCategory(categoryName, pill);
    }
  }, 300);
}

// ─────────────────────────────────────────
// SEARCH FOODS
// ─────────────────────────────────────────
async function searchFoods() {
  const query = document.getElementById('search-input').value.trim();
  const results = document.getElementById('search-results');
  const loading = document.getElementById('search-loading');
  const empty = document.getElementById('search-empty');
  const error = document.getElementById('search-error');

  if (!query) {
    document.getElementById('search-input').focus();
    return;
  }

  results.innerHTML = '';
  show(loading); hide(empty); hide(error);

  try {
    const data = await apiFetch(`/api/foods/search/${encodeURIComponent(query)}`);
    hide(loading);
    if (data.length === 0) { show(empty); return; }
    data.forEach((food, i) => results.appendChild(createFoodCard(food, i)));
  } catch (e) {
    hide(loading);
    document.getElementById('search-error-msg').textContent = `Error: ${e.message}`;
    show(error);
  }
}

// Allow Enter key to trigger search
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('search-input');
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') searchFoods();
    });
  }
});

// ─────────────────────────────────────────
// FOOD DETAIL MODAL
// ─────────────────────────────────────────
async function openFoodDetail(foodId) {
  const overlay = document.getElementById('modal-overlay');
  const modalLoading = document.getElementById('modal-loading');
  const modalBody = document.getElementById('modal-body');

  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  show(modalLoading); hide(modalBody);

  try {
    const food = await apiFetch(`/api/foods/${foodId}`);
    hide(modalLoading);

    // ── Dish image ──────────────────────────────────────────
    let modalImg = document.getElementById('modal-dish-image');
    if (!modalImg) {
      modalImg = document.createElement('img');
      modalImg.id = 'modal-dish-image';
      modalImg.className = 'modal-dish-image';
      modalBody.insertBefore(modalImg, modalBody.firstChild);
    }
    const imgSrc = getFoodImage(food.food_name);
    modalImg.src = imgSrc;
    modalImg.alt = food.food_name;
    modalImg.onerror = () => { modalImg.style.display = 'none'; };
    modalImg.style.display = 'block';
    // ────────────────────────────────────────────────────────

    document.getElementById('modal-title').textContent = food.food_name;
    document.getElementById('modal-category').textContent = food.category_name;
    document.getElementById('modal-origin').textContent = `📍 ${food.origin_name}`;
    document.getElementById('modal-instructions').textContent = food.instructions;

    const ingList = document.getElementById('modal-ingredients');
    ingList.innerHTML = '';
    if (food.ingredients && food.ingredients.length > 0) {
      food.ingredients.forEach(ing => {
        const li = document.createElement('li');
        li.textContent = ing;
        ingList.appendChild(li);
      });
    } else {
      ingList.innerHTML = '<li class="no-ingredients">No ingredients listed.</li>';
    }

    show(modalBody);
  } catch (e) {
    hide(modalLoading);
    show(modalBody);
    document.getElementById('modal-title').textContent = 'Error loading details';
    document.getElementById('modal-instructions').textContent = e.message;
    document.getElementById('modal-ingredients').innerHTML = '';
  }
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

// Keyboard close (Escape)
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }
function truncate(str, len) {
  return str && str.length > len ? str.slice(0, len) + '…' : str;
}

// ─────────────────────────────────────────
// DISH IMAGE MAPPER
// Maps food names to local image files in images/
// Returns a placeholder emoji div if no match found.
// ─────────────────────────────────────────
function getFoodImage(foodName) {
  const map = {
    'Adobo':             'images/ADOBO.jpg',
    'Afritada':          'images/AFRITADA.jpg',
    'Bicol Express':     'images/BICOL_EXPRESS.jpg',
    'Bulalo':            'images/BULALO.jpg',
    'Chicken Inasal':    'images/CHICKEN_INASAL.jpg',
    'Chopsuey':          'images/CHOPSUEY.jpg',
    'Dinakdakan':        'images/DINAKDAKAN.jpg',
    'Dinengdeng':        'images/DINENGDENG.jpg',
    'Ginataang Gulay':   'images/GINATAANG_GULAY.jpg',
    'Halo-Halo':         'images/HALO-HALO.jpg',
    'Kare-Kare':         'images/KARE-KARE.jpg',
    'Laing':             'images/LAING.jpg',
    'Lechon Kawali':     'images/LECHONKAWALI.jpg',
    'Lumpiang Shanghai': 'images/LUMPIA.jpg',
    'Menudo':            'images/MENUDO.jpg',
    'Pancit Canton':     'images/PANCIT-CANTON.jpg',
    'Pinakbet':          'images/PINAKBET.jpg',
    'Sinigang':          'images/SINIGANG.jpg',
    'Tinola':            'images/TINOLA.jpg',
  };
  return map[foodName] || null;
}

function getCategoryEmoji(cat) {
  const map = {
    'Main Dish': '🍖',
    'Soup': '🍲',
    'Dessert': '🍮',
    'Appetizer': '🥢',
    'Noodle Dish': '🍜',
    'Grilled Dish': '🔥',
    'Vegetable Dish': '🥦',
  };
  return map[cat] || '🍽️';
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (window.scrollY > 50) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
});

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  showSection('home');
  loadStats();
});
