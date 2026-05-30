// ─── STATE ───────────────────────────────────────────
const state = {
  files: [],       // { file, name, ext, status, markdown }
  activeIndex: -1
};

// ─── DOM REFS ─────────────────────────────────────────
const dropZone    = document.getElementById('dropZone');
const fileInput   = document.getElementById('fileInput');
const panels      = document.getElementById('panels');
const actions     = document.getElementById('actions');
const fileList    = document.getElementById('fileList');
const fileCount   = document.getElementById('fileCount');
const mdPreview   = document.getElementById('mdPreview');
const previewFileName = document.getElementById('previewFileName');
const statusBar   = document.getElementById('statusBar');
const statusMsg   = document.getElementById('statusMsg');
const clearBtn    = document.getElementById('clearBtn');
const convertBtn  = document.getElementById('convertBtn');
const creditsBtn  = document.getElementById('creditsBtn');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose  = document.getElementById('modalClose');

// ─── DRAG & DROP ──────────────────────────────────────
dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  handleFiles(Array.from(e.dataTransfer.files));
});

dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  handleFiles(Array.from(fileInput.files));
  fileInput.value = '';
});

// ─── FILE HANDLING ────────────────────────────────────
function handleFiles(newFiles) {
  const allowed = ['.pdf', '.docx', '.pptx'];
  const valid = newFiles.filter(f => {
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    return allowed.includes(ext);
  });

  if (valid.length === 0) {
    showStatus('No supported files found. Please use PDF, DOCX, or PPTX.', 'error');
    return;
  }

  valid.forEach(f => {
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    state.files.push({ file: f, name: f.name, ext, status: 'waiting', markdown: '' });
  });

  renderFileList();
  showPanels();
}

// ─── RENDER FILE LIST ─────────────────────────────────
function renderFileList() {
  fileCount.textContent = `${state.files.length} file${state.files.length !== 1 ? 's' : ''}`;
  fileList.innerHTML = '';

  state.files.forEach((item, i) => {
    const el = document.createElement('div');
    el.className = `file-item${state.activeIndex === i ? ' active' : ''}`;
    el.innerHTML = `
      <span class="file-ext">${item.ext.replace('.', '').toUpperCase()}</span>
      <span class="file-name" title="${item.name}">${item.name}</span>
      <span class="file-status status-${item.status}">${statusLabel(item.status)}</span>
    `;
    el.addEventListener('click', () => selectFile(i));
    fileList.appendChild(el);
  });
}

function statusLabel(status) {
  const map = { waiting: 'Waiting', converting: 'Converting...', done: 'Ready', error: 'Error' };
  return map[status] || status;
}

// ─── SELECT FILE FOR PREVIEW ──────────────────────────
function selectFile(index) {
  state.activeIndex = index;
  renderFileList();
  const item = state.files[index];
  previewFileName.textContent = item.name;
  mdPreview.textContent = item.markdown || '— not yet converted —';
}

// ─── SHOW/HIDE PANELS ─────────────────────────────────
function showPanels() {
  panels.style.display = 'grid';
  actions.style.display = 'flex';
  if (state.activeIndex === -1 && state.files.length > 0) selectFile(0);
}

// ─── CONVERT ──────────────────────────────────────────
convertBtn.addEventListener('click', async () => {
  if (state.files.length === 0) return;

  convertBtn.disabled = true;
  convertBtn.textContent = 'Converting...';
  showStatus('Sending files to server...', 'info');

  for (let i = 0; i < state.files.length; i++) {
    const item = state.files[i];
    if (item.status === 'done') continue;

    item.status = 'converting';
    renderFileList();
    if (state.activeIndex === i) selectFile(i);

    try {
      const formData = new FormData();
      formData.append('file', item.file);

      const response = await fetch('http://localhost:8000/convert', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      item.markdown = data.markdown;
      item.status = 'done';

    } catch (err) {
      item.status = 'error';
      item.markdown = `Error: ${err.message}`;
      console.error(err);
    }

    renderFileList();
    if (state.activeIndex === i) selectFile(i);
  }

  const doneCount = state.files.filter(f => f.status === 'done').length;
  showStatus(`Done — ${doneCount} file${doneCount !== 1 ? 's' : ''} converted. Downloading...`, 'info');

  downloadAll();

  convertBtn.disabled = false;
  convertBtn.textContent = 'Convert & Download';
});

// ─── DOWNLOAD ─────────────────────────────────────────
function downloadAll() {
  state.files.forEach(item => {
    if (item.status !== 'done' || !item.markdown) return;
    const blob = new Blob([item.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.name.replace(/\.[^.]+$/, '') + '.md';
    a.click();
    URL.revokeObjectURL(url);
  });
}

// ─── CLEAR ────────────────────────────────────────────
clearBtn.addEventListener('click', () => {
  state.files = [];
  state.activeIndex = -1;
  panels.style.display = 'none';
  actions.style.display = 'none';
  statusBar.style.display = 'none';
  fileList.innerHTML = '';
  mdPreview.textContent = 'Select a file to preview its markdown output...';
  previewFileName.textContent = '—';
  fileCount.textContent = '0 files';
});

// ─── STATUS BAR ───────────────────────────────────────
function showStatus(msg, type = 'info') {
  statusBar.style.display = 'block';
  statusMsg.textContent = msg;
  statusBar.style.borderColor = type === 'error' ? '#E24B4A' : 'var(--teal-mid)';
  statusBar.style.background = type === 'error' ? '#FCEBEB' : 'var(--teal-light)';
  statusBar.style.color = type === 'error' ? '#A32D2D' : 'var(--teal-dark)';
}

// ─── MODAL ────────────────────────────────────────────
creditsBtn.addEventListener('click', () => {
  modalOverlay.style.display = 'flex';
});

modalClose.addEventListener('click', () => {
  modalOverlay.style.display = 'none';
});

modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) modalOverlay.style.display = 'none';
});
