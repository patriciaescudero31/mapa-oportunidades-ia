// ============================================================
//  CONFIGURACIÓN DE SUPABASE
//  👉 Reemplaza SUPABASE_URL y SUPABASE_ANON_KEY con tus valores
// ============================================================
const SUPABASE_URL  = 'https://modvmfcrggclhmdxsyyy.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZHZtZmNyZ2djbGhtZHhzeXl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4OTc3ODgsImV4cCI6MjEwNzQ3Mzc4OH0.KPjdzJCBU9VUgPUSo4F1vHiXOc0PUhDeJkiZ6x8_oKY';

// ============================================================
//  CLIENTE SUPABASE (sin librería, solo fetch nativo)
// ============================================================
const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

const api = {
  async get(query = '') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/opportunities?${query}&order=created_at.desc`, { headers });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async insert(data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/opportunities`, {
      method: 'POST', headers, body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async updateLikes(id, likes) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/opportunities?id=eq.${id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ likes })
    });
    if (!res.ok) throw new Error(await res.text());
  }
};

// ============================================================
//  ESTADO GLOBAL
// ============================================================
let allOpportunities = [];
let likedIds = new Set(JSON.parse(localStorage.getItem('likedIds') || '[]'));

// ============================================================
//  DOM REFS
// ============================================================
const grid          = document.getElementById('opportunitiesGrid');
const emptyState    = document.getElementById('emptyState');
const loadingState  = document.getElementById('loadingState');
const modalOverlay  = document.getElementById('modalOverlay');
const form          = document.getElementById('opportunityForm');
const searchInput   = document.getElementById('searchInput');
const filterCity    = document.getElementById('filterCity');
const filterCountry = document.getElementById('filterCountry');
const filterCat     = document.getElementById('filterCategory');
const formNote      = document.getElementById('formNote');
const btnSubmit     = document.getElementById('btnSubmit');

// ============================================================
//  MODAL
// ============================================================
function openModal()  { modalOverlay.classList.add('open'); }
function closeModal() { modalOverlay.classList.remove('open'); form.reset(); formNote.textContent = ''; }

document.getElementById('btnOpenModal').addEventListener('click', openModal);
document.getElementById('btnCloseModal').addEventListener('click', closeModal);
document.getElementById('btnCancel').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

// ============================================================
//  TOAST
// ============================================================
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = (type === 'success' ? '✅ ' : '❌ ') + msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.className = 'toast', 3000);
}

// ============================================================
//  FORMATO DE FECHA
// ============================================================
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ============================================================
//  TAG DE POTENCIAL
// ============================================================
function potentialTag(p) {
  if (p?.includes('Alto'))     return `<span class="tag tag-potential-high">${p}</span>`;
  if (p?.includes('Medio'))    return `<span class="tag tag-potential-med">${p}</span>`;
  return `<span class="tag tag-potential-low">${p || '—'}</span>`;
}

// ============================================================
//  RENDERIZAR TARJETAS
// ============================================================
function renderCards(data) {
  loadingState.style.display = 'none';

  if (!data.length) {
    grid.innerHTML = '';
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';
  const isLiked = id => likedIds.has(id);

  grid.innerHTML = data.map((op, i) => `
    <article class="card" style="animation-delay:${i * 0.05}s">
      <div class="card-header">
        <div class="card-meta">
          <span class="tag tag-category">${op.category || '—'}</span>
          ${potentialTag(op.potential)}
        </div>
        <span class="card-location">📍 ${op.city}, ${op.country}</span>
      </div>
      <h4 class="card-title">${escapeHtml(op.name)}</h4>
      <div class="card-section">
        <span class="card-section-label">🔴 Problema</span>
        <p class="card-section-text">${escapeHtml(op.problem)}</p>
      </div>
      <div class="card-section ai-solution-box">
        <span class="card-section-label">🤖 Solución con IA</span>
        <p class="card-section-text">${escapeHtml(op.ai_solution)}</p>
      </div>
      <div class="card-footer">
        <span class="card-date">${formatDate(op.created_at)}</span>
        <button
          class="like-btn ${isLiked(op.id) ? 'liked' : ''}"
          onclick="handleLike('${op.id}', ${op.likes})"
          id="like-${op.id}">
          <span class="heart">${isLiked(op.id) ? '💜' : '🤍'}</span>
          <span id="likecount-${op.id}">${op.likes || 0}</span>
        </button>
      </div>
    </article>
  `).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ============================================================
//  ACTUALIZAR STATS
// ============================================================
function updateStats(data) {
  document.getElementById('totalCount').textContent    = data.length;
  document.getElementById('totalCities').textContent   = new Set(data.map(d => d.city)).size;
  document.getElementById('totalCountries').textContent = new Set(data.map(d => d.country)).size;
  document.getElementById('totalLikes').textContent    = data.reduce((s, d) => s + (d.likes || 0), 0);
  document.getElementById('resultsCount').textContent  = `${data.length} resultado${data.length !== 1 ? 's' : ''}`;
}

// ============================================================
//  LLENAR FILTROS DINÁMICOS
// ============================================================
function populateFilters(data) {
  const cities    = [...new Set(data.map(d => d.city).filter(Boolean))].sort();
  const countries = [...new Set(data.map(d => d.country).filter(Boolean))].sort();

  const curCity    = filterCity.value;
  const curCountry = filterCountry.value;

  filterCity.innerHTML    = '<option value="">🏙️ Todas las ciudades</option>'
    + cities.map(c => `<option value="${c}" ${c===curCity?'selected':''}>${c}</option>`).join('');
  filterCountry.innerHTML = '<option value="">🌍 Todos los países</option>'
    + countries.map(c => `<option value="${c}" ${c===curCountry?'selected':''}>${c}</option>`).join('');
}

// ============================================================
//  FILTRAR
// ============================================================
function applyFilters() {
  const q   = searchInput.value.toLowerCase().trim();
  const city = filterCity.value;
  const country = filterCountry.value;
  const cat  = filterCat.value;

  const filtered = allOpportunities.filter(op => {
    const matchSearch  = !q || [op.name, op.problem, op.ai_solution, op.city, op.country]
      .some(f => f?.toLowerCase().includes(q));
    const matchCity    = !city    || op.city === city;
    const matchCountry = !country || op.country === country;
    const matchCat     = !cat     || op.category === cat;
    return matchSearch && matchCity && matchCountry && matchCat;
  });

  renderCards(filtered);
  updateStats(filtered);
  document.getElementById('resultsTitle').textContent =
    (city || country || cat || q) ? 'Resultados filtrados' : 'Todas las oportunidades';
}

searchInput.addEventListener('input', applyFilters);
filterCity.addEventListener('change', applyFilters);
filterCountry.addEventListener('change', applyFilters);
filterCat.addEventListener('change', applyFilters);

document.getElementById('btnClearFilters').addEventListener('click', () => {
  searchInput.value = '';
  filterCity.value = '';
  filterCountry.value = '';
  filterCat.value = '';
  applyFilters();
});

// ============================================================
//  CARGAR OPORTUNIDADES DESDE SUPABASE
// ============================================================
async function loadOpportunities() {
  loadingState.style.display = 'flex';
  grid.innerHTML = '';
  emptyState.style.display = 'none';

  try {
    const data = await api.get('select=*');
    allOpportunities = data;
    populateFilters(data);
    applyFilters();
  } catch (err) {
    loadingState.style.display = 'none';
    console.error(err);
    showToast('Error al cargar oportunidades. Revisa la consola.', 'error');
  }
}

// ============================================================
//  PUBLICAR OPORTUNIDAD
// ============================================================
form.addEventListener('submit', async e => {
  e.preventDefault();
  formNote.textContent = '';
  btnSubmit.disabled = true;
  btnSubmit.textContent = '⏳ Publicando...';

  const data = {
    name:        document.getElementById('fieldName').value.trim(),
    city:        document.getElementById('fieldCity').value.trim(),
    country:     document.getElementById('fieldCountry').value.trim(),
    category:    document.getElementById('fieldCategory').value,
    potential:   document.getElementById('fieldPotential').value,
    problem:     document.getElementById('fieldProblem').value.trim(),
    ai_solution: document.getElementById('fieldSolution').value.trim(),
    likes:       0
  };

  try {
    await api.insert(data);
    closeModal();
    showToast('¡Oportunidad publicada! Ya visible para todos. 🎉');
    await loadOpportunities();
  } catch (err) {
    console.error(err);
    formNote.textContent = '❌ Error al publicar. Revisa la consola o la anon key.';
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = '🚀 Publicar oportunidad';
  }
});

// ============================================================
//  LIKE
// ============================================================
async function handleLike(id, currentLikes) {
  if (likedIds.has(id)) {
    showToast('Ya diste like a esta oportunidad 💜', 'error');
    return;
  }

  const newLikes = (currentLikes || 0) + 1;
  likedIds.add(id);
  localStorage.setItem('likedIds', JSON.stringify([...likedIds]));

  // Actualiza UI inmediatamente
  const btn = document.getElementById(`like-${id}`);
  const cnt = document.getElementById(`likecount-${id}`);
  if (btn) { btn.classList.add('liked'); btn.querySelector('.heart').textContent = '💜'; }
  if (cnt) cnt.textContent = newLikes;

  // Actualiza en supabase
  const op = allOpportunities.find(o => o.id === id);
  if (op) op.likes = newLikes;
  updateStats(allOpportunities);

  try {
    await api.updateLikes(id, newLikes);
  } catch (err) {
    console.error(err);
    showToast('Error al guardar el like', 'error');
  }
}

// ============================================================
//  INIT
// ============================================================
loadOpportunities();
