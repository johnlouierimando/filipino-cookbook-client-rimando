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
let allFoods      = [];
let allCategories = [];
let activeSection = 'home';

// ─────────────────────────────────────────
// UTILITY: fetch wrapper with auth headers
// ─────────────────────────────────────────
async function apiFetch(endpoint) {
  const url = `${API_CONFIG.baseUrl}${endpoint}`;
  const res = await fetch(url, { headers: API_CONFIG.headers });
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
  // hide all page sections
  document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
  document.getElementById('section-home').classList.add('hidden');

  activeSection = name;

  // update nav links
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
      // Always render — data may already be cached from stats, but grid needs to be populated
      if (name === 'foods')      loadFoods();
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
    animateCounter('stat-foods',       foods.length);
    animateCounter('stat-categories',  categories.length);
    animateCounter('stat-ingredients', ingredients.length);
    allFoods      = foods;
    allCategories = categories;
  } catch (e) {
    console.warn('Stats load failed:', e.message);
  }
}

function animateCounter(id, target) {
  const el    = document.getElementById(id);
  let current = 0;
  const step  = Math.ceil(target / 30);
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
  const grid    = document.getElementById('food-grid');
  const loading = document.getElementById('foods-loading');
  const error   = document.getElementById('foods-error');

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

  card.innerHTML = `
    <div class="card-emoji">${emoji}</div>
    <div class="card-body">
      <div class="card-meta">
        <span class="card-category">${food.category_name}</span>
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
  const grid    = document.getElementById('category-grid');
  const loading = document.getElementById('categories-loading');
  const error   = document.getElementById('categories-error');

  grid.innerHTML = '';
  show(loading); hide(error);

  try {
    if (allCategories.length === 0) allCategories = await apiFetch('/api/categories');
    if (allFoods.length === 0)      allFoods      = await apiFetch('/api/foods');
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

  // ── "All Dishes" card first ──────────────────────────────
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

  // ── Individual category cards ─────────────────────────────
  categories.forEach((cat, i) => {
    const count = allFoods.filter(f => f.category_name === cat.category_name).length;
    const card  = document.createElement('div');
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
  // slight delay to let section render
  setTimeout(() => {
    if (categoryName === 'all') {
      // click the All pill
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
  const query   = document.getElementById('search-input').value.trim();
  const results = document.getElementById('search-results');
  const loading = document.getElementById('search-loading');
  const empty   = document.getElementById('search-empty');
  const error   = document.getElementById('search-error');

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
  const overlay      = document.getElementById('modal-overlay');
  const modalLoading = document.getElementById('modal-loading');
  const modalBody    = document.getElementById('modal-body');

  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  show(modalLoading); hide(modalBody);

  try {
    const food = await apiFetch(`/api/foods/${foodId}`);
    hide(modalLoading);

    document.getElementById('modal-title').textContent       = food.food_name;
    document.getElementById('modal-category').textContent    = food.category_name;
    document.getElementById('modal-origin').textContent      = `📍 ${food.origin_name}`;
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
    document.getElementById('modal-title').textContent       = 'Error loading details';
    document.getElementById('modal-instructions').textContent = e.message;
    document.getElementById('modal-ingredients').innerHTML    = '';
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

function getCategoryEmoji(cat) {
  const map = {
    'Main Dish':     '🍖',
    'Soup':          '🍲',
    'Dessert':       '🍮',
    'Appetizer':     '🥢',
    'Noodle Dish':   '🍜',
    'Grilled Dish':  '🔥',
    'Vegetable Dish':'🥦',
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
