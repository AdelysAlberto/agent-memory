document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const statMemories = document.getElementById('stat-memories');
  const statProjects = document.getElementById('stat-projects');
  const statTokens = document.getElementById('stat-tokens');
  const searchInput = document.getElementById('search-input');
  const projectSelect = document.getElementById('project-select');
  const memoriesList = document.getElementById('memories-list');
  const feedCount = document.getElementById('feed-count');

  // Modal & Form Elements
  const btnNewMemory = document.getElementById('btn-new-memory');
  const modalContainer = document.getElementById('modal-container');
  const modalClose = document.getElementById('modal-close');
  const formCancel = document.getElementById('form-cancel');
  const memoryForm = document.getElementById('memory-form');

  // State
  let currentProject = '';
  let searchQuery = '';

  // Initial Load
  loadStats();
  loadProjects();
  fetchMemories();

  // Event Listeners
  searchInput.addEventListener('input', debounce(() => {
    searchQuery = searchInput.value.trim();
    fetchMemories();
  }, 300));

  projectSelect.addEventListener('change', () => {
    currentProject = projectSelect.value;
    fetchMemories();
  });

  btnNewMemory.addEventListener('click', openModal);
  modalClose.addEventListener('click', closeModal);
  formCancel.addEventListener('click', closeModal);
  
  modalContainer.addEventListener('click', (e) => {
    if (e.target === modalContainer) closeModal();
  });

  memoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      project_name: document.getElementById('form-project').value.trim(),
      title: document.getElementById('form-title').value.trim(),
      summary_signature: document.getElementById('form-summary').value.trim(),
      category: document.getElementById('form-category').value,
      tags: document.getElementById('form-tags').value.trim()
    };

    try {
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        closeModal();
        memoryForm.reset();
        loadStats();
        loadProjects();
        fetchMemories();
      } else {
        alert('Error al guardar la memoria.');
      }
    } catch (err) {
      console.error('Error enviando formulario:', err);
    }
  });

  // Data Fetching Functions
  async function loadStats() {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      statMemories.textContent = data.totalMemories.toLocaleString();
      statProjects.textContent = data.totalProjects.toLocaleString();
      statTokens.textContent = `~${data.estimatedTokensSaved.toLocaleString()}`;
    } catch (err) {
      console.error('Error cargando métricas:', err);
    }
  }

  async function loadProjects() {
    try {
      const res = await fetch('/api/projects');
      const projects = await res.json();
      
      const currentSelected = projectSelect.value;
      projectSelect.innerHTML = '<option value="">Todos los Proyectos</option>';
      projects.forEach(proj => {
        const option = document.createElement('option');
        option.value = proj;
        option.textContent = proj;
        if (proj === currentSelected) option.selected = true;
        projectSelect.appendChild(option);
      });
    } catch (err) {
      console.error('Error cargando proyectos:', err);
    }
  }

  async function fetchMemories() {
    try {
      const params = new URLSearchParams();
      if (currentProject) params.append('project', currentProject);
      if (searchQuery) params.append('query', searchQuery);

      const res = await fetch(`/api/memories?${params.toString()}`);
      const memories = await res.json();

      renderMemories(memories);
    } catch (err) {
      console.error('Error buscando memorias:', err);
      memoriesList.innerHTML = `<div class="empty-state">Error cargando memorias</div>`;
    }
  }

  function renderMemories(memories) {
    feedCount.textContent = `${memories.length} ${memories.length === 1 ? 'memoria' : 'memorias'}`;
    memoriesList.innerHTML = '';

    if (memories.length === 0) {
      memoriesList.innerHTML = `
        <div class="empty-state glass" style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted);">
          <p>No se encontraron memorias registradas con estos filtros.</p>
        </div>
      `;
      return;
    }

    memories.forEach(mem => {
      const card = document.createElement('div');
      card.className = 'memory-card glass';

      const formattedDate = new Date(mem.timestamp).toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });

      const tagsList = mem.tags ? mem.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const tagsHtml = tagsList.map(tag => `<span class="tag-chip">#${escapeHtml(tag)}</span>`).join('');

      card.innerHTML = `
        <div>
          <div class="card-header">
            <span class="card-project">${escapeHtml(mem.project_name || 'general')}</span>
            <button class="btn-delete" data-id="${mem.id}" title="Eliminar memoria">🗑️</button>
          </div>
          <h3 class="card-title">${escapeHtml(mem.title)}</h3>
          <div class="card-summary">${escapeHtml(mem.summary_signature)}</div>
        </div>
        <div class="card-footer">
          <div class="tags-container">${tagsHtml}</div>
          <span class="card-date">${formattedDate}</span>
        </div>
      `;

      const deleteBtn = card.querySelector('.btn-delete');
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`¿Estás seguro de eliminar la memoria #${mem.id}?`)) {
          await deleteMemoryItem(mem.id);
        }
      });

      memoriesList.appendChild(card);
    });
  }

  async function deleteMemoryItem(id) {
    try {
      const res = await fetch(`/api/memories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadStats();
        loadProjects();
        fetchMemories();
      }
    } catch (err) {
      console.error('Error eliminando memoria:', err);
    }
  }

  // Modal helpers
  function openModal() {
    modalContainer.classList.remove('hidden');
  }

  function closeModal() {
    modalContainer.classList.add('hidden');
  }

  // Utility
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function escapeHtml(str) {
    return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
});
