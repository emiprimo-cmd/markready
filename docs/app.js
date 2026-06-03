// ─── STATE ───────────────────────────────────────────
const state = {
  files: [],
  activeIndex: -1
};

// ─── DOM REFS ─────────────────────────────────────────
const dropZone        = document.getElementById('dropZone');
const fileInput       = document.getElementById('fileInput');
const panels          = document.getElementById('panels');
const actions         = document.getElementById('actions');
const fileList        = document.getElementById('fileList');
const fileCount       = document.getElementById('fileCount');
const mdPreview       = document.getElementById('mdPreview');
const previewFileName = document.getElementById('previewFileName');
const statusBar       = document.getElementById('statusBar');
const statusMsg       = document.getElementById('statusMsg');
const clearBtn        = document.getElementById('clearBtn');
const convertBtn      = document.getElementById('convertBtn');
const creditsBtn      = document.getElementById('creditsBtn');
const modalOverlay    = document.getElementById('modalOverlay');
const modalClose      = document.getElementById('modalClose');
const progressCount   = document.getElementById('progressCount');
const progressTrack   = document.getElementById('progressTrack');
const progressFill    = document.getElementById('progressFill');
const copyBtn = document.getElementById('copyBtn');

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

  const oversized = newFiles.filter(f => f.size > 20 * 1024 * 1024);
  if (oversized.length > 0) {
    const names = oversized.map(f => f.name).join(', ');
    showStatus(`⚠️ File too large (max 20MB): ${names}`, 'error');
    return;
  }

  const valid = newFiles.filter(f => {
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    return allowed.includes(ext);
  });

  if (valid.length === 0) {
    showStatus('Format not supported. Please use PDF, DOCX, or PPTX. If you have a .doc file, save it as .docx first in Word (File → Save As → .docx).', 'error');
    return;
  }

  valid.forEach(f => {
    const already = state.files.some(existing => existing.name === f.name);
    if (already) return;
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
  copyBtn.style.display = item.markdown ? 'block' : 'none';

  // Token counter
  const existing = document.getElementById('tokenCounter');
  if (existing) existing.remove();

  if (item.markdown && item.file) {
    const originalTokens = Math.round(item.file.size / 4);
    const markdownTokens = Math.round(item.markdown.length / 4);
    const saved = Math.round((1 - markdownTokens / originalTokens) * 100);

    const counter = document.createElement('div');
    counter.id = 'tokenCounter';
    counter.style.cssText = `
      background: #E1F5EE; border: 0.5px solid #9FE1CB;
      border-radius: 8px; padding: 12px 16px;
      display: flex; align-items: center; gap: 16px;
      margin-top: 10px; flex-wrap: wrap;
      font-family: var(--sans);
    `;
    counter.innerHTML = `
      <i class="ti ti-bolt" style="font-size:18px; color:#0F6E56;" aria-hidden="true"></i>
      <div style="display:flex; gap:20px; flex:1; flex-wrap:wrap; align-items:center;">
        <div style="text-align:center;">
          <div style="font-size:11px; color:#0F6E56; margin-bottom:2px;">Original</div>
          <div style="font-size:15px; font-weight:500; color:#085041;">~${originalTokens.toLocaleString()} tokens</div>
        </div>
        <div style="color:#0F6E56; font-size:16px;">→</div>
        <div style="text-align:center;">
          <div style="font-size:11px; color:#0F6E56; margin-bottom:2px;">Markdown</div>
          <div style="font-size:15px; font-weight:500; color:#085041;">~${markdownTokens.toLocaleString()} tokens</div>
        </div>
        <div style="color:#0F6E56; font-size:16px;">→</div>
        <div style="text-align:center;">
          <div style="font-size:11px; color:#0F6E56; margin-bottom:2px;">Saved</div>
          <div style="font-size:16px; font-weight:500; color:#085041;">${saved}% <span style="font-size:12px;">fewer tokens</span></div>
        </div>
      </div>
    `;

    const panelRight = document.querySelector('.panels .panel:last-child');
    panelRight.appendChild(counter);
  }
}


// ─── SHOW PANELS ──────────────────────────────────────
function showPanels() {
  panels.style.display = 'grid';
  actions.style.display = 'flex';
  if (state.activeIndex === -1 && state.files.length > 0) selectFile(0);
}

// ─── CONVERT ──────────────────────────────────────────
convertBtn.addEventListener('click', async () => {
  if (state.files.length === 0) return;

  const total = state.files.filter(f => f.status !== 'done').length;
  if (total === 0) return;

  convertBtn.disabled = true;
  convertBtn.textContent = 'Converting...';

  statusBar.style.display = 'block';
  progressTrack.style.display = 'block';
  progressFill.style.width = '0%';
  progressCount.textContent = `0 / ${total}`;
  statusMsg.textContent = 'Converting...';
  statusBar.style.borderColor = 'var(--teal-mid)';
  statusBar.style.background = 'var(--teal-light)';
  statusBar.style.color = 'var(--teal-dark)';

  let completed = 0;

  for (let i = 0; i < state.files.length; i++) {
    const item = state.files[i];
    if (item.status === 'done') continue;

    item.status = 'converting';
    renderFileList();
    if (state.activeIndex === i) selectFile(i);

    try {
      const formData = new FormData();
      formData.append('file', item.file);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const response = await fetch('https://markready-api.onrender.com/convert', {
        method: 'POST',
        body: formData,
        signal: controller.signal
});

clearTimeout(timeout);

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      item.markdown = data.markdown;
      item.status = 'done';

} catch (err) {
  item.status = 'error';
  item.markdown = err.name === 'AbortError'
    ? 'Error: File too large for the current server. Try a smaller file or wait for the desktop version.'
    : `Error: ${err.message}`;
  console.error(err);
}
 

    completed++;
    const pct = Math.round((completed / total) * 100);
    progressFill.style.width = `${pct}%`;
    progressCount.textContent = `${completed} / ${total}`;
    statusMsg.textContent = completed < total ? 'Converting...' : 'Done — downloading...';

    renderFileList();
    if (state.activeIndex === i) selectFile(i);
  }

  await downloadAll();

  progressCount.textContent = '';
  progressTrack.style.display = 'none';
  const doneCount = state.files.filter(f => f.status === 'done').length;
  showStatus(`✓ ${doneCount} file${doneCount !== 1 ? 's' : ''} converted successfully.`, 'info');

  convertBtn.disabled = false;
  convertBtn.textContent = 'Convert & Download';
});

// ─── DOWNLOAD ─────────────────────────────────────────
async function downloadAll() {
  const done = state.files.filter(f => f.status === 'done' && f.markdown);
  if (done.length === 0) return;

  if (done.length === 1) {
    const item = done[0];
    const blob = new Blob([item.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.name.replace(/\.[^.]+$/, '') + '.md';
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const zip = new JSZip();
  done.forEach(item => {
    const mdName = item.name.replace(/\.[^.]+$/, '') + '.md';
    zip.file(mdName, item.markdown);
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'markready_export.zip';
  a.click();
  URL.revokeObjectURL(url);
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
  statusBar.style.background  = type === 'error' ? '#FCEBEB' : 'var(--teal-light)';
  statusBar.style.color       = type === 'error' ? '#A32D2D' : 'var(--teal-dark)';
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
// ─── SERVER WAKE UP CHECK ─────────────────────────────
async function checkServer() {
  const banner = document.createElement('div');
  banner.id = 'serverBanner';
  banner.style.cssText = `
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    background: #FAEEDA; border: 1px solid #EF9F27; color: #854F0B;
    padding: 10px 20px; border-radius: 10px; font-size: 13px;
    font-family: var(--sans); z-index: 200; text-align: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1); display: none;
  `;
  banner.textContent = '⏳ Server is waking up — this may take up to 60 seconds on first use...';
  document.body.appendChild(banner);

  const timeout = setTimeout(() => {
    banner.style.display = 'block';
  }, 3000);

  try {
    await fetch('https://markready-api.onrender.com');
    clearTimeout(timeout);
    banner.style.display = 'none';
  } catch (err) {
    clearTimeout(timeout);
    banner.textContent = '⚠️ Server is unavailable. Please try again in a moment.';
    banner.style.display = 'block';
    setTimeout(() => banner.style.display = 'none', 6000);
  }
}

checkServer();

// ─── COPY TO CLIPBOARD ────────────────────────────────
copyBtn.addEventListener('click', async () => {
  const item = state.files[state.activeIndex];
  if (!item || !item.markdown) return;

  try {
    await navigator.clipboard.writeText(item.markdown);
    copyBtn.textContent = 'Copied!';
    copyBtn.classList.add('copied');
    setTimeout(() => {
      copyBtn.textContent = 'Copy';
      copyBtn.classList.remove('copied');
    }, 2000);
  } catch (err) {
    copyBtn.textContent = 'Error';
    setTimeout(() => copyBtn.textContent = 'Copy', 2000);
  }
});

// ─── DARK MODE TOGGLE ─────────────────────────────────
const themeBtn  = document.getElementById('themeBtn');
const themeIcon = document.getElementById('themeIcon');

function applyTheme(dark) {
  document.body.classList.toggle('dark', dark);
  themeIcon.className = dark ? 'ti ti-moon' : 'ti ti-sun';
  localStorage.setItem('markready-theme', dark ? 'dark' : 'light');
}

themeBtn.addEventListener('click', () => {
  applyTheme(!document.body.classList.contains('dark'));
});

// Load saved preference
const saved = localStorage.getItem('markready-theme');
if (saved === 'dark') applyTheme(true);