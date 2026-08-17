document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const statMemories = document.getElementById('stat-memories');
  const statProjects = document.getElementById('stat-projects');
  const statTokens = document.getElementById('stat-tokens');
  const searchInput = document.getElementById('search-input');
  const projectSelect = document.getElementById('project-select');
  const categorySelect = document.getElementById('category-select');
  const memoriesList = document.getElementById('memories-list');
  const feedCount = document.getElementById('feed-count');

  // Modal & Form Elements
  const btnNewMemory = document.getElementById('btn-new-memory');
  const btnExportMarkdown = document.getElementById('btn-export-markdown');
  const modalContainer = document.getElementById('modal-container');
  const modalTitleText = document.getElementById('modal-title-text');
  const modalClose = document.getElementById('modal-close');
  const formCancel = document.getElementById('form-cancel');
  const memoryForm = document.getElementById('memory-form');
  const formId = document.getElementById('form-id');
  const formProject = document.getElementById('form-project');
  const formTitle = document.getElementById('form-title');
  const formSummary = document.getElementById('form-summary');
  const formCategory = document.getElementById('form-category');
  const formTags = document.getElementById('form-tags');
  const formSubmit = document.getElementById('form-submit');

  // State
  let currentProject = '';
  let currentCategory = '';
  let searchQuery = '';
  let loadedMemories = [];

  // Initial Load
  loadStats();
  loadProjects();
  fetchMemories();

  // Event Listeners
  searchInput.addEventListener('input', debounce(() => {
    searchQuery = searchInput.value.trim();
    fetchMemories();
  }, 250));

  projectSelect.addEventListener('change', () => {
    currentProject = projectSelect.value;
    fetchMemories();
  });

  categorySelect.addEventListener('change', () => {
    currentCategory = categorySelect.value;
    fetchMemories();
  });

  btnNewMemory.addEventListener('click', () => openModalForCreate());
  btnExportMarkdown.addEventListener('click', exportToMarkdown);

  modalClose.addEventListener('click', closeModal);
  formCancel.addEventListener('click', closeModal);
  
  modalContainer.addEventListener('click', (e) => {
    if (e.target === modalContainer) closeModal();
  });

  memoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = formId.value;
    const payload = {
      project_name: formProject.value.trim(),
      title: formTitle.value.trim(),
      summary_signature: formSummary.value.trim(),
      category: formCategory.value,
      tags: formTags.value.trim()
    };

    try {
      const url = id ? `/api/memories/${id}` : '/api/memories';
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        closeModal();
        memoryForm.reset();
        formId.value = '';
        loadStats();
        loadProjects();
        fetchMemories();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'No se pudo guardar la memoria'}`);
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
      statMemories.textContent = (data.totalMemories || 0).toLocaleString();
      statProjects.textContent = (data.totalProjects || 0).toLocaleString();
      statTokens.textContent = `~${(data.estimatedTokensSaved || 0).toLocaleString()}`;
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
      (projects || []).forEach(proj => {
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
      if (currentCategory) params.append('category', currentCategory);
      if (searchQuery) params.append('query', searchQuery);

      const res = await fetch(`/api/memories?${params.toString()}`);
      loadedMemories = await res.json() || [];

      renderMemories(loadedMemories);
    } catch (err) {
      console.error('Error buscando memorias:', err);
      memoriesList.innerHTML = `<div class="empty-state">Error cargando memorias</div>`;
    }
  }

  function renderMemories(memories) {
    feedCount.textContent = `${memories.length} ${memories.length === 1 ? 'firma' : 'firmas'}`;
    memoriesList.innerHTML = '';

    if (!memories || memories.length === 0) {
      memoriesList.innerHTML = `
        <div class="empty-state glass" style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted);">
          <p>No se encontraron firmas de memoria registradas en Cogni con estos filtros.</p>
        </div>
      `;
      return;
    }

    memories.forEach(mem => {
      const card = document.createElement('div');
      card.className = 'memory-card glass';

      const dateVal = mem.created_at || mem.timestamp || new Date().toISOString();
      const formattedDate = new Date(dateVal).toLocaleString('es-ES', {
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
            <div class="card-actions">
              <button class="btn-card-action btn-edit" title="Editar memoria">✏️</button>
              <button class="btn-card-action btn-delete" title="Eliminar memoria">🗑️</button>
            </div>
          </div>
          <h3 class="card-title">${escapeHtml(mem.title)}</h3>
          <div class="card-summary">${escapeHtml(mem.summary_signature)}</div>
        </div>
        <div class="card-footer">
          <div class="tags-container">${tagsHtml}</div>
          <span class="card-date">${formattedDate} • #${mem.id}</span>
        </div>
      `;

      // Handlers
      card.querySelector('.btn-edit').addEventListener('click', (e) => {
        e.stopPropagation();
        openModalForEdit(mem);
      });

      card.querySelector('.btn-delete').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`¿Estás seguro de eliminar la memoria #${mem.id} ("${mem.title}")?`)) {
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

  function openModalForCreate() {
    formId.value = '';
    memoryForm.reset();
    formProject.value = currentProject || 'general';
    modalTitleText.textContent = '✨ Registrar Firma Semántica en Cogni';
    formSubmit.textContent = 'Guardar en Cogni';
    modalContainer.classList.remove('hidden');
  }

  function openModalForEdit(mem) {
    formId.value = mem.id;
    formProject.value = mem.project_name || '';
    formTitle.value = mem.title || '';
    formSummary.value = mem.summary_signature || '';
    formCategory.value = mem.category || 'general';
    formTags.value = mem.tags || '';
    modalTitleText.textContent = `✏️ Editar Firma Semántica #${mem.id}`;
    formSubmit.textContent = 'Actualizar Firma';
    modalContainer.classList.remove('hidden');
  }

  function closeModal() {
    modalContainer.classList.add('hidden');
  }

  function exportToMarkdown() {
    if (!loadedMemories || loadedMemories.length === 0) {
      alert('No hay memorias para exportar con el filtro actual.');
      return;
    }

    let md = `# 🧠 Cogni Memory Export\n\n`;
    md += `*Fecha: ${new Date().toLocaleString()}* | *Total: ${loadedMemories.length} firmas*\n\n---\n\n`;

    loadedMemories.forEach(m => {
      md += `### [${m.project_name}] ${m.title} (#${m.id})\n`;
      md += `> **Categoría**: \`${m.category || 'general'}\` | **Tags**: ${m.tags ? m.tags.split(',').map(t => '`#' + t.trim() + '`').join(' ') : 'none'}\n\n`;
      md += `${m.summary_signature}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cogni-memories-${currentProject || 'all'}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
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
