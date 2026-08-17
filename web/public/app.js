document.addEventListener('DOMContentLoaded', () => {
  // Metric elements
  const statMemories = document.getElementById('stat-memories');
  const statProjects = document.getElementById('stat-projects');
  const statTokens = document.getElementById('stat-tokens');

  // Filter elements
  const searchInput = document.getElementById('search-input');
  const sourceSelect = document.getElementById('source-select');
  const projectSelect = document.getElementById('project-select');
  const categorySelect = document.getElementById('category-select');
  const memoriesList = document.getElementById('memories-list');
  const feedCount = document.getElementById('feed-count');

  // Header Actions
  const btnNewMemory = document.getElementById('btn-new-memory');
  const btnExportMarkdown = document.getElementById('btn-export-markdown');

  // Native HTML5 <dialog> Elements
  const detailDialog = document.getElementById('detail-dialog');
  const formDialog = document.getElementById('form-dialog');

  // Detail Dialog Elements
  const btnCloseDetail = document.getElementById('btn-close-detail');
  const detailSourceBadge = document.getElementById('detail-source-badge');
  const detailProjectBadge = document.getElementById('detail-project-badge');
  const detailCategoryBadge = document.getElementById('detail-category-badge');
  const detailTitle = document.getElementById('detail-title');
  const detailSummary = document.getElementById('detail-summary');
  const detailTags = document.getElementById('detail-tags');
  const detailDate = document.getElementById('detail-date');
  const detailId = document.getElementById('detail-id');
  const btnCopySignature = document.getElementById('btn-copy-signature');
  const btnPromote = document.getElementById('btn-promote');
  const btnEditDetail = document.getElementById('btn-edit-detail');
  const btnDeleteDetail = document.getElementById('btn-delete-detail');

  // Form Dialog Elements
  const btnCloseForm = document.getElementById('btn-close-form');
  const btnCancelForm = document.getElementById('btn-cancel-form');
  const memoryForm = document.getElementById('memory-form');
  const formDialogTitle = document.getElementById('form-dialog-title');
  const formId = document.getElementById('form-id');
  const formSource = document.getElementById('form-source');
  const formTarget = document.getElementById('form-target');
  const formProject = document.getElementById('form-project');
  const formTitle = document.getElementById('form-title');
  const formSummary = document.getElementById('form-summary');
  const formCategory = document.getElementById('form-category');
  const formTags = document.getElementById('form-tags');
  const btnSubmitForm = document.getElementById('btn-submit-form');

  // State
  let currentSource = '';
  let currentProject = '';
  let currentCategory = '';
  let searchQuery = '';
  let loadedMemories = [];
  let selectedMemory = null;

  // Initial Load
  loadStats();
  loadProjects();
  fetchMemories();

  // Filter Listeners
  searchInput.addEventListener('input', debounce(() => {
    searchQuery = searchInput.value.trim();
    fetchMemories();
  }, 250));

  sourceSelect.addEventListener('change', () => {
    currentSource = sourceSelect.value;
    fetchMemories();
  });

  projectSelect.addEventListener('change', () => {
    currentProject = projectSelect.value;
    fetchMemories();
  });

  categorySelect.addEventListener('change', () => {
    currentCategory = categorySelect.value;
    fetchMemories();
  });

  // Action Listeners
  btnNewMemory.addEventListener('click', () => openFormForCreate());
  btnExportMarkdown.addEventListener('click', exportToMarkdown);

  // Close Dialogs
  btnCloseDetail.addEventListener('click', () => detailDialog.close());
  btnCloseForm.addEventListener('click', () => formDialog.close());
  btnCancelForm.addEventListener('click', () => formDialog.close());

  // Click outside to close native dialogs
  detailDialog.addEventListener('click', (e) => {
    if (e.target === detailDialog) detailDialog.close();
  });
  formDialog.addEventListener('click', (e) => {
    if (e.target === formDialog) formDialog.close();
  });

  // Detail Dialog Actions
  btnCopySignature.addEventListener('click', () => {
    if (selectedMemory) {
      navigator.clipboard.writeText(selectedMemory.summary_signature);
      btnCopySignature.textContent = '✅ Copiado!';
      setTimeout(() => btnCopySignature.textContent = '📋 Copiar', 1800);
    }
  });

  btnPromote.addEventListener('click', async () => {
    if (!selectedMemory) return;
    const isLocal = selectedMemory.source === 'local';
    const target = isLocal ? 'global' : 'local';
    const actionName = isLocal ? 'promover a la base de datos Global (~/.cogni/)' : 'copiar al proyecto Local (.cogni/)';

    if (confirm(`¿Deseas ${actionName} la memoria #${selectedMemory.id}?`)) {
      await promoteMemoryItem(selectedMemory.id, selectedMemory.source, target);
      detailDialog.close();
    }
  });

  btnEditDetail.addEventListener('click', () => {
    if (selectedMemory) {
      detailDialog.close();
      openFormForEdit(selectedMemory);
    }
  });

  btnDeleteDetail.addEventListener('click', async () => {
    if (selectedMemory && confirm(`¿Estás seguro de eliminar la memoria #${selectedMemory.id} ("${selectedMemory.title}")?`)) {
      await deleteMemoryItem(selectedMemory.id, selectedMemory.source);
      detailDialog.close();
    }
  });

  // Form Submit
  memoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = formId.value;
    const payload = {
      target: formTarget.value,
      project_name: formProject.value.trim(),
      title: formTitle.value.trim(),
      summary_signature: formSummary.value.trim(),
      category: formCategory.value,
      tags: formTags.value.trim()
    };

    try {
      const source = formSource.value || 'local';
      const url = id ? `/api/memories/${id}?source=${source}` : '/api/memories';
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        formDialog.close();
        memoryForm.reset();
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
      if (currentSource) params.append('source', currentSource);
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
          <p>No se encontraron firmas de memoria registradas con estos filtros.</p>
        </div>
      `;
      return;
    }

    memories.forEach(mem => {
      const card = document.createElement('div');
      card.className = 'memory-card glass';

      const isLocal = mem.source === 'local';
      const sourceBadgeClass = isLocal ? 'source-badge local' : 'source-badge global';
      const sourceText = isLocal ? 'LOCAL' : 'GLOBAL';

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
            <div class="badges-wrapper">
              <span class="${sourceBadgeClass}">${sourceText}</span>
              <span class="project-badge">${escapeHtml(mem.project_name || 'general')}</span>
            </div>
            <div class="card-actions">
              <button class="btn-card-action btn-card-promote" title="${isLocal ? 'Promover a Global' : 'Copiar a Local'}">${isLocal ? '🌐' : '📥'}</button>
              <button class="btn-card-action btn-card-delete" title="Eliminar memoria">🗑️</button>
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

      // Click on Card -> Open Native Detail Dialog
      card.addEventListener('click', () => {
        openDetailDialog(mem);
      });

      // Promote Click from card
      const promoteBtn = card.querySelector('.btn-card-promote');
      promoteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const target = isLocal ? 'global' : 'local';
        const msg = isLocal ? `¿Promover #${mem.id} a la base de datos Global?` : `¿Copiar #${mem.id} a la base de datos Local?`;
        if (confirm(msg)) {
          await promoteMemoryItem(mem.id, mem.source, target);
        }
      });

      // Delete Click from card
      const deleteBtn = card.querySelector('.btn-card-delete');
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`¿Eliminar la memoria #${mem.id} (${mem.source})?`)) {
          await deleteMemoryItem(mem.id, mem.source);
        }
      });

      memoriesList.appendChild(card);
    });
  }

  // Open Native HTML5 <dialog> for Memory Details
  function openDetailDialog(mem) {
    selectedMemory = mem;
    const isLocal = mem.source === 'local';

    detailSourceBadge.className = isLocal ? 'source-badge local' : 'source-badge global';
    detailSourceBadge.textContent = isLocal ? '📂 BASE LOCAL (.cogni/)' : '🌐 BASE GLOBAL (~/.cogni/)';

    detailProjectBadge.textContent = mem.project_name || 'general';
    detailCategoryBadge.textContent = mem.category || 'general';
    detailTitle.textContent = mem.title;
    detailSummary.textContent = mem.summary_signature;

    const tagsList = mem.tags ? mem.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    detailTags.innerHTML = tagsList.map(tag => `<span class="tag-chip">#${escapeHtml(tag)}</span>`).join('');

    const dateVal = mem.created_at || mem.timestamp || new Date().toISOString();
    detailDate.textContent = `Registrado: ${new Date(dateVal).toLocaleString('es-ES')}`;
    detailId.textContent = `ID: #${mem.id}`;

    // Update promote button text
    if (isLocal) {
      btnPromote.innerHTML = '<span>🌐</span> Promover a Global (~/.cogni/)';
    } else {
      btnPromote.innerHTML = '<span>📥</span> Copiar a Local (.cogni/)';
    }

    detailDialog.showModal();
  }

  function openFormForCreate() {
    formId.value = '';
    formSource.value = 'local';
    memoryForm.reset();
    formTarget.value = 'local';
    formProject.value = currentProject || 'general';
    formDialogTitle.textContent = '✨ Registrar Firma Semántica en Cogni';
    btnSubmitForm.textContent = 'Guardar en Cogni';
    formDialog.showModal();
  }

  function openFormForEdit(mem) {
    formId.value = mem.id;
    formSource.value = mem.source || 'local';
    formTarget.value = mem.source || 'local';
    formProject.value = mem.project_name || '';
    formTitle.value = mem.title || '';
    formSummary.value = mem.summary_signature || '';
    formCategory.value = mem.category || 'general';
    formTags.value = mem.tags || '';
    formDialogTitle.textContent = `✏️ Editar Firma #${mem.id} (${mem.source || 'local'})`;
    btnSubmitForm.textContent = 'Actualizar Firma';
    formDialog.showModal();
  }

  async function promoteMemoryItem(id, from, to) {
    try {
      const res = await fetch('/api/memories/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: Number(id), from, to })
      });
      if (res.ok) {
        loadStats();
        loadProjects();
        fetchMemories();
      } else {
        const err = await res.json();
        alert(`Error al promover: ${err.error || 'Operación fallida'}`);
      }
    } catch (err) {
      console.error('Error promoviendo memoria:', err);
    }
  }

  async function deleteMemoryItem(id, source) {
    try {
      const res = await fetch(`/api/memories/${id}?source=${source || 'local'}`, { method: 'DELETE' });
      if (res.ok) {
        loadStats();
        loadProjects();
        fetchMemories();
      }
    } catch (err) {
      console.error('Error eliminando memoria:', err);
    }
  }

  function exportToMarkdown() {
    if (!loadedMemories || loadedMemories.length === 0) {
      alert('No hay memorias para exportar con el filtro actual.');
      return;
    }

    let md = `# 🧠 Cogni Memory Export\n\n`;
    md += `*Fecha: ${new Date().toLocaleString()}* | *Total: ${loadedMemories.length} firmas*\n\n---\n\n`;

    loadedMemories.forEach(m => {
      md += `### [${m.source ? m.source.toUpperCase() : 'MEM'} #${m.id}] [${m.project_name}] ${m.title}\n`;
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

  // Utilities
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
