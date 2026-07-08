// Global States
let categoriesData = [];
let selectedCategoryIds = new Set();
let logEventSource = null;
let queueStatusInterval = null;
let isQueueRunning = false;

// DOM Elements
const activeShiftSelect = document.getElementById('activeShiftSelect');
const appsScriptUrlInput = document.getElementById('appsScriptUrl');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('togglePasswordBtn');
const sheetStatusBadge = document.getElementById('sheetStatusBadge');

// Tab Navigation Elements
const tabDashboardBtn = document.getElementById('tabDashboard');
const tabHistoryBtn = document.getElementById('tabHistory');
const contentDashboardDiv = document.getElementById('contentDashboard');
const contentHistoryDiv = document.getElementById('contentHistory');

// History Archive Elements
const archiveMonthSelect = document.getElementById('archiveMonthSelect');
const archiveYearSelect = document.getElementById('archiveYearSelect');
const calendarMonthGrid = document.getElementById('calendarMonthGrid');
const archiveDetailsPanel = document.getElementById('archiveDetailsPanel');
const selectedArchiveDateText = document.getElementById('selectedArchiveDateText');
const selectedArchiveShiftText = document.getElementById('selectedArchiveShiftText');
const btnCloseDetailsPanel = document.getElementById('btnCloseDetailsPanel');
const archiveDetailsSearch = document.getElementById('archiveDetailsSearch');
const archiveDetailsFilter = document.getElementById('archiveDetailsFilter');
const archiveDetailsGrid = document.getElementById('archiveDetailsGrid');

// Settings Elements
const advancedToggle = document.getElementById('advancedToggle');
const advancedContainer = document.getElementById('advancedContainer');
const captureDelayInput = document.getElementById('captureDelay');
const zoomScaleSelect = document.getElementById('zoomScale');
const viewportWidthInput = document.getElementById('viewportWidth');
const viewportHeightInput = document.getElementById('viewportHeight');
const headlessCheckbox = document.getElementById('headless');
const usernameSelectorInput = document.getElementById('usernameSelector');
const passwordSelectorInput = document.getElementById('passwordSelector');
const loginButtonSelectorInput = document.getElementById('loginButtonSelector');
const btnSaveSettings = document.getElementById('btnSaveSettings');

// Control Buttons
const btnRunQueue = document.getElementById('btnRunQueue');
const btnRunSelected = document.getElementById('btnRunSelected');
const btnStopQueue = document.getElementById('btnStopQueue');
const btnResetSession = document.getElementById('btnResetSession');
const btnRefreshList = document.getElementById('btnRefreshList');
const selectCountSpan = document.getElementById('selectedCountText');
const selectAllCheckbox = document.getElementById('selectAllCheckbox');

// Metrics elements
const statTotal = document.getElementById('statTotal');
const statSuccess = document.getElementById('statSuccess');
const statFailed = document.getElementById('statFailed');
const statProgress = document.getElementById('statProgress');

// Terminal & List
const terminalLogs = document.getElementById('terminalLogs');
const btnClearTerminal = document.getElementById('btnClearTerminal');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const categoriesGrid = document.getElementById('categoriesGrid');
const gridSyncStatus = document.getElementById('gridSyncStatus');

// Modals
const imageModal = document.getElementById('imageModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalCloseBtnFooter = document.getElementById('modalCloseBtnFooter');
const modalCategoryName = document.getElementById('modalCategoryName');
const modalUrlLink = document.getElementById('modalUrlLink');
const modalImage = document.getElementById('modalImage');
const modalImagePlaceholder = document.getElementById('modalImagePlaceholder');
const modalCaptureTime = document.getElementById('modalCaptureTime');
const btnOpenDrive = document.getElementById('btnOpenDrive');

const editUrlModal = document.getElementById('editUrlModal');
const editUrlModalBackdrop = document.getElementById('editUrlModalBackdrop');
const editUrlModalCloseBtn = document.getElementById('editUrlModalCloseBtn');
const editUrlModalCloseBtnFooter = document.getElementById('editUrlModalCloseBtnFooter');
const editUrlCategoryName = document.getElementById('editUrlCategoryName');
const editUrlInput = document.getElementById('editUrlInput');
const btnSaveEditedUrl = document.getElementById('btnSaveEditedUrl');

let currentEditingId = null;

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
  initListeners();
  initHistoryTab();
  setTodayDate();
  loadSettings();
  loadCategories();
  startLogStream();
  startQueuePolling();
});

// Event Listeners Initialization
function initListeners() {
  // Auto-detect shift: Pagi (6am - 6pm), Malam (6pm - 6am)
  const currentHour = new Date().getHours();
  const defaultShift = (currentHour >= 6 && currentHour < 18) ? 'Pagi' : 'Malam';
  activeShiftSelect.value = defaultShift;

  activeShiftSelect.addEventListener('change', () => {
    appendTerminalLog(`Shift kerja berganti ke: ${activeShiftSelect.value}`, 'info');
    renderCategoriesGrid();
    updateMetrics();
  });

  // Toggle password visibility
  togglePasswordBtn.addEventListener('click', () => {
    const isPass = passwordInput.type === 'password';
    passwordInput.type = isPass ? 'text' : 'password';
    togglePasswordBtn.innerHTML = isPass ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
  });

  // Expand Advanced settings toggle
  advancedToggle.addEventListener('click', () => {
    advancedToggle.classList.toggle('active');
    advancedContainer.classList.toggle('hidden');
  });

  // Save Settings
  btnSaveSettings.addEventListener('click', saveSettings);

  // Queue Control buttons
  btnRunQueue.addEventListener('click', runAllQueue);
  btnRunSelected.addEventListener('click', runSelectedQueue);
  btnStopQueue.addEventListener('click', stopQueue);
  btnResetSession.addEventListener('click', resetLoginSession);
  btnRefreshList.addEventListener('click', () => loadCategories(true));

  // Clear log
  btnClearTerminal.addEventListener('click', () => {
    terminalLogs.innerHTML = `<div class="log-line log-info">[SYSTEM] Logs cleared. Listening...</div>`;
  });

  // Select all checkbox
  selectAllCheckbox.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    const cards = categoriesGrid.querySelectorAll('.category-card');
    
    selectedCategoryIds.clear();
    cards.forEach(card => {
      const id = card.dataset.id;
      const cb = card.querySelector('.card-cb');
      
      // Only select if it has a URL
      const hasUrl = card.dataset.hasUrl === 'true';
      if (hasUrl) {
        cb.checked = isChecked;
        if (isChecked) {
          card.classList.add('selected');
          selectedCategoryIds.add(id);
        } else {
          card.classList.remove('selected');
        }
      }
    });
    updateSelectedCount();
  });

  // Search & Filter
  searchInput.addEventListener('input', applyFilters);
  statusFilter.addEventListener('change', applyFilters);

  // Close modals
  [modalCloseBtn, modalCloseBtnFooter, modalBackdrop].forEach(el => {
    el.addEventListener('click', () => imageModal.classList.remove('active'));
  });

  [editUrlModalCloseBtn, editUrlModalCloseBtnFooter, editUrlModalBackdrop].forEach(el => {
    el.addEventListener('click', () => editUrlModal.classList.remove('active'));
  });

  btnSaveEditedUrl.addEventListener('click', saveEditedUrl);
}

// 1. SETTINGS CONTROL
async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (data.success && data.settings) {
      const s = data.settings;
      appsScriptUrlInput.value = s.appsScriptUrl || '';
      usernameInput.value = s.username || '';
      passwordInput.value = s.password || '';
      captureDelayInput.value = s.captureDelay || 5000;
      zoomScaleSelect.value = s.zoomScale || 0.5;
      viewportWidthInput.value = s.viewportWidth || 1366;
      viewportHeightInput.value = s.viewportHeight || 768;
      headlessCheckbox.checked = s.headless === true || s.headless === 'true';
      
      usernameSelectorInput.value = s.usernameSelector || '';
      passwordSelectorInput.value = s.passwordSelector || '';
      loginButtonSelectorInput.value = s.loginButtonSelector || '';
    }
  } catch (err) {
    appendTerminalLog(`Error loading settings: ${err.message}`, 'error');
  }
}

async function saveSettings() {
  const payload = {
    appsScriptUrl: appsScriptUrlInput.value.trim(),
    username: usernameInput.value.trim(),
    password: passwordInput.value,
    captureDelay: parseInt(captureDelayInput.value) || 5000,
    zoomScale: parseFloat(zoomScaleSelect.value) || 0.5,
    viewportWidth: parseInt(viewportWidthInput.value) || 1366,
    viewportHeight: parseInt(viewportHeightInput.value) || 768,
    headless: headlessCheckbox.checked,
    usernameSelector: usernameSelectorInput.value.trim(),
    passwordSelector: passwordSelectorInput.value.trim(),
    loginButtonSelector: loginButtonSelectorInput.value.trim()
  };

  try {
    btnSaveSettings.disabled = true;
    btnSaveSettings.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      appendTerminalLog('Konfigurasi disimpan. Menyinkronkan ulang data...', 'success');
      loadCategories(); // Reload category data with the new Apps Script URL
    } else {
      appendTerminalLog(`Gagal menyimpan: ${result.error}`, 'error');
    }
  } catch (err) {
    appendTerminalLog(`Error menyimpan konfigurasi: ${err.message}`, 'error');
  } finally {
    btnSaveSettings.disabled = false;
    btnSaveSettings.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Konfigurasi';
  }
}

// 2. CATEGORIES SYNC
async function loadCategories(force = false) {
  categoriesGrid.innerHTML = `
    <div class="loading-spinner-wrapper">
      <i class="fa-solid fa-circle-notch fa-spin spinner-icon"></i>
      <p>Mengambil data terbaru...</p>
    </div>
  `;
  gridSyncStatus.textContent = 'Menghubungkan...';
  
  try {
    const forceParam = force === true ? 'force=true&' : '';
    const res = await fetch(`/api/categories?${forceParam}t=${Date.now()}`);
    const data = await res.json();
    
    if (data.success) {
      categoriesData = data.data;
      
      if (data.offline) {
        sheetStatusBadge.className = 'sheet-status-badge offline';
        sheetStatusBadge.innerHTML = '<i class="fa-solid fa-circle-nodes"></i> Offline Mode (Default)';
        gridSyncStatus.textContent = 'Menampilkan data template lokal (Spreadsheet belum tersambung)';
      } else {
        sheetStatusBadge.className = 'sheet-status-badge online';
        sheetStatusBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Connected to Sheet';
        gridSyncStatus.textContent = `Sync sukses! Total ${categoriesData.length} baris data ditemukan.`;
      }
      
      renderCategoriesGrid();
      updateMetrics();
    } else {
      throw new Error(data.error);
    }
  } catch (err) {
    gridSyncStatus.textContent = 'Gagal sinkronisasi data!';
    categoriesGrid.innerHTML = `
      <div class="loading-spinner-wrapper">
        <i class="fa-solid fa-circle-exmark text-red" style="font-size: 32px;"></i>
        <p>Gagal memuat data dari Spreadsheet.</p>
        <span class="input-desc" style="text-align: center; max-width: 400px; margin-top: 5px;">
          ${err.message}
        </span>
      </div>
    `;
    sheetStatusBadge.className = 'sheet-status-badge offline';
    sheetStatusBadge.innerHTML = '<i class="fa-solid fa-circle-nodes"></i> Koneksi Gagal';
  }
}

// Render Categories Grid HTML
function renderCategoriesGrid() {
  if (categoriesData.length === 0) {
    categoriesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">Tidak ada kategori terdaftar.</p>';
    return;
  }
  
  categoriesGrid.innerHTML = '';
  const activeShift = activeShiftSelect.value;
  
  categoriesData.forEach(item => {
    const card = document.createElement('div');
    card.className = `category-card ${selectedCategoryIds.has(item.id) ? 'selected' : ''}`;
    card.dataset.id = item.id;
    card.dataset.hasUrl = !!item.url;
    
    const isSelected = selectedCategoryIds.has(item.id);
    const hasUrl = !!item.url;
    
    // Read shift-specific properties
    const statusVal = activeShift === 'Malam' ? item.statusMalam : item.statusPagi;
    const lastCapVal = activeShift === 'Malam' ? item.lastCapturedMalam : item.lastCapturedPagi;
    const ssUrlVal = activeShift === 'Malam' ? item.screenshotUrlMalam : item.screenshotUrlPagi;
    
    // Status badge style
    let badgeClass = 'badge-idle';
    let badgeText = statusVal || 'Idle';
    let badgeIcon = '';
    
    if (!hasUrl) {
      badgeClass = 'badge-empty';
      badgeText = 'NO URL';
    } else if (statusVal === 'Success') {
      badgeClass = 'badge-success';
      badgeText = 'SUCCESS';
    } else if (statusVal === 'Failed') {
      badgeClass = 'badge-failed';
      badgeText = 'FAILED';
    } else if (statusVal === 'Pending') {
      badgeClass = 'badge-pending';
      badgeText = 'PENDING';
    } else if (statusVal === 'Capturing') {
      badgeClass = 'badge-capturing';
      badgeText = 'CAPTURING';
      badgeIcon = '<i class="fa-solid fa-spinner fa-spin"></i> ';
    }
    
    const lastCapTime = lastCapVal ? new Date(lastCapVal).toLocaleDateString('id-ID') + ' ' + new Date(lastCapVal).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) : '-';
    
    card.innerHTML = `
      <div class="card-checkbox-wrapper">
        <input type="checkbox" class="card-cb" ${isSelected ? 'checked' : ''} ${!hasUrl ? 'disabled' : ''}>
      </div>
      <div class="card-header-info">
        <span class="card-title">${item.name}</span>
        <span class="card-url-badge ${!hasUrl ? 'empty-url' : ''}" title="${item.url || 'Tidak ada URL'}">
          ${item.url ? item.url : '(Belum diset)'}
        </span>
      </div>
      
      <!-- IMAGE THUMBNAIL PREVIEW -->
      <div class="card-image-preview">
        ${ssUrlVal ? `
          <img src="${getDirectDriveImageUrl(ssUrlVal)}" class="thumbnail-img" alt="${item.name} SS" title="Double click untuk memperbesar" />
          <div class="img-overlay">Double Click to Zoom</div>
        ` : `
          <div class="no-image-placeholder">
            <i class="fa-solid fa-image-portrait"></i>
            <span>Belum Ada Screenshot</span>
          </div>
        `}
      </div>

      <div class="card-meta">
        <span class="badge ${badgeClass}">${badgeIcon}${badgeText}</span>
        
        <div class="card-actions-wrapper">
          <button class="card-action-btn btn-edit-url" title="Ubah URL Link" onclick="event.stopPropagation(); openEditUrlModal('${item.id}', '${item.name}', '${item.url || ''}')">
            <i class="fa-solid fa-pen"></i>
          </button>
          ${ssUrlVal ? `
            <a href="${ssUrlVal}" target="_blank" class="card-action-btn btn-ss-link" title="Buka Link Gambar" onclick="event.stopPropagation();">
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
            <button class="card-action-btn btn-ss-view" title="Lihat Screenshot" onclick="event.stopPropagation(); openImageModal('${item.name}', '${item.url}', '${ssUrlVal}', '${lastCapVal}')">
              <i class="fa-solid fa-image"></i>
            </button>
          ` : ''}
          ${hasUrl ? `
            <button class="card-action-btn" title="Ambil Screenshot Sekarang" onclick="event.stopPropagation(); captureSingleItem('${item.id}', '${item.name}', '${item.url}')">
              <i class="fa-solid fa-camera"></i>
            </button>
          ` : ''}
        </div>
      </div>
      ${lastCapVal ? `<span class="card-time">Captured: ${lastCapTime}</span>` : ''}
    `;

    // Toggle card selection on click
    card.addEventListener('click', (e) => {
      // Ignore click on action buttons, inputs, links, or image container
      if (e.target.closest('.card-action-btn') || e.target.closest('input') || e.target.closest('a') || e.target.closest('.card-image-preview')) return;
      if (!hasUrl) return;

      const cb = card.querySelector('.card-cb');
      cb.checked = !cb.checked;
      
      if (cb.checked) {
        card.classList.add('selected');
        selectedCategoryIds.add(item.id);
      } else {
        card.classList.remove('selected');
        selectedCategoryIds.delete(item.id);
      }
      updateSelectedCount();
    });

    // Double click to zoom screenshot
    if (ssUrlVal) {
      card.addEventListener('dblclick', (e) => {
        if (e.target.closest('.card-action-btn') || e.target.closest('input') || e.target.closest('a')) return;
        openImageModal(item.name, item.url, ssUrlVal, lastCapVal);
      });
      
      // Also trigger zoom on double-clicking the image preview container directly
      const imgPreview = card.querySelector('.card-image-preview');
      imgPreview.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        openImageModal(item.name, item.url, ssUrlVal, lastCapVal);
      });
    }

    // Checkbox direct change handler
    const cb = card.querySelector('.card-cb');
    cb.addEventListener('change', (e) => {
      if (e.target.checked) {
        card.classList.add('selected');
        selectedCategoryIds.add(item.id);
      } else {
        card.classList.remove('selected');
        selectedCategoryIds.delete(item.id);
      }
      updateSelectedCount();
    });

    categoriesGrid.appendChild(card);
  });
  
  applyFilters();
}

function updateSelectedCount() {
  selectCountSpan.textContent = selectedCategoryIds.size;
  btnRunSelected.disabled = selectedCategoryIds.size === 0 || isQueueRunning;
}

// Update stats metrics boxes
function updateMetrics() {
  if (categoriesData.length === 0) return;
  
  const activeShift = activeShiftSelect.value;
  const total = categoriesData.length;
  
  const success = categoriesData.filter(item => {
    const statusVal = activeShift === 'Malam' ? item.statusMalam : item.statusPagi;
    return statusVal === 'Success' && item.url;
  }).length;
  
  const failed = categoriesData.filter(item => {
    const statusVal = activeShift === 'Malam' ? item.statusMalam : item.statusPagi;
    return statusVal === 'Failed' && item.url;
  }).length;
  
  const captured = categoriesData.filter(item => {
    const statusVal = activeShift === 'Malam' ? item.statusMalam : item.statusPagi;
    return (statusVal === 'Success' || statusVal === 'Failed') && item.url;
  }).length;
  
  const activeUrls = categoriesData.filter(item => item.url).length;
  
  statTotal.textContent = total;
  statSuccess.textContent = success;
  statFailed.textContent = failed;
  
  const percentage = activeUrls > 0 ? Math.round((captured / activeUrls) * 100) : 0;
  statProgress.textContent = `${percentage}%`;
}

// Filter lists client-side based on search and status selects
function applyFilters() {
  const query = searchInput.value.toLowerCase().trim();
  const filter = statusFilter.value;
  const activeShift = activeShiftSelect.value;
  
  const cards = categoriesGrid.querySelectorAll('.category-card');
  cards.forEach(card => {
    const id = card.dataset.id;
    const item = categoriesData.find(d => d.id === id);
    if (!item) return;

    const statusVal = activeShift === 'Malam' ? item.statusMalam : item.statusPagi;
    const matchesSearch = item.name.toLowerCase().includes(query) || (item.url && item.url.toLowerCase().includes(query));
    
    let matchesStatus = true;
    if (filter === 'Success') {
      matchesStatus = statusVal === 'Success';
    } else if (filter === 'Failed') {
      matchesStatus = statusVal === 'Failed';
    } else if (filter === 'Idle') {
      matchesStatus = (statusVal === 'Idle' || !statusVal) && !!item.url;
    } else if (filter === 'Empty') {
      matchesStatus = !item.url;
    }

    if (matchesSearch && matchesStatus) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });
}

// 3. MANUAL EDIT URL MODAL
function openEditUrlModal(id, name, currentUrl) {
  currentEditingId = id;
  editUrlCategoryName.value = name;
  editUrlInput.value = currentUrl;
  editUrlModal.classList.add('active');
}

async function saveEditedUrl() {
  if (!currentEditingId) return;

  const url = editUrlInput.value.trim();
  try {
    btnSaveEditedUrl.disabled = true;
    btnSaveEditedUrl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    
    const res = await fetch('/api/categories/url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: currentEditingId, url })
    });
    
    const data = await res.json();
    if (data.success) {
      appendTerminalLog(`Berhasil merubah URL kategori ID: ${currentEditingId}`, 'success');
      editUrlModal.classList.remove('active');
      loadCategories(); // Reload the data
    } else {
      alert(`Gagal merubah URL: ${data.error}`);
    }
  } catch (err) {
    alert(`Error: ${err.message}`);
  } finally {
    btnSaveEditedUrl.disabled = false;
    btnSaveEditedUrl.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan URL';
  }
}

// Parser to convert Google Drive share link into a direct image source stream
// Local paths (starting with /screenshots/) are passed through as-is
function getDirectDriveImageUrl(url) {
  if (!url) return '';
  // Local server path — use directly, no conversion needed
  if (url.startsWith('/screenshots/') || url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
    return url;
  }
  // Match file ID from format: https://drive.google.com/file/d/FILE_ID/view?usp=drivesdk
  const matchD = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD && matchD[1]) {
    return `https://lh3.googleusercontent.com/d/${matchD[1]}`;
  }
  // Match file ID from format: https://drive.google.com/open?id=FILE_ID
  const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1]) {
    return `https://lh3.googleusercontent.com/d/${matchId[1]}`;
  }
  return url;
}

// 4. IMAGE VIEWER MODAL
function openImageModal(name, url, screenshotUrl, timestamp) {
  modalCategoryName.textContent = name;
  modalUrlLink.href = url;
  modalUrlLink.style.display = url ? 'inline-block' : 'none';
  modalCaptureTime.textContent = timestamp ? `Diambil pada: ${new Date(timestamp).toLocaleString('id-ID')}` : 'Waktu tidak diketahui';
  btnOpenDrive.href = screenshotUrl;

  modalImage.classList.add('hidden');
  modalImagePlaceholder.classList.remove('hidden');

  if (screenshotUrl) {
    modalImage.src = getDirectDriveImageUrl(screenshotUrl);
    modalImage.onload = () => {
      modalImagePlaceholder.classList.add('hidden');
      modalImage.classList.remove('hidden');
    };
    modalImage.onerror = () => {
      // In case image URL can't load directly (cors or access issues), we show placeholder
      modalImagePlaceholder.innerHTML = `<i class="fa-regular fa-circle-exmark placeholder-icon text-red"></i><p>Gagal memuat gambar screenshot secara langsung dari Google Drive. Klik tombol "Buka di Google Drive" di bawah untuk melihat file.</p>`;
    };
  }

  imageModal.classList.add('active');
}

// 5. QUEUE TRIGGERS
async function runAllQueue() {
  if (isQueueRunning) return;
  
  const shift = activeShiftSelect.value;
  try {
    const res = await fetch('/api/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shift })
    });
    const result = await res.json();
    if (result.success) {
      appendTerminalLog(`Memicu seluruh antrean screenshot untuk ${shift} Shift...`, 'info');
      setQueueState(true);
    } else {
      appendTerminalLog(`Gagal menjalankan queue: ${result.error}`, 'error');
    }
  } catch (err) {
    appendTerminalLog(`Error memicu queue: ${err.message}`, 'error');
  }
}

async function runSelectedQueue() {
  if (isQueueRunning || selectedCategoryIds.size === 0) return;

  const ids = Array.from(selectedCategoryIds);
  const shift = activeShiftSelect.value;
  try {
    const res = await fetch('/api/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, shift })
    });
    const result = await res.json();
    if (result.success) {
      appendTerminalLog(`Memicu antrean screenshot untuk ${ids.length} kategori terpilih (${shift} Shift)...`, 'info');
      setQueueState(true);
    } else {
      appendTerminalLog(`Gagal menjalankan antrean: ${result.error}`, 'error');
    }
  } catch (err) {
    appendTerminalLog(`Error: ${err.message}`, 'error');
  }
}

async function stopQueue() {
  try {
    const res = await fetch('/api/stop', { method: 'POST' });
    const data = await res.json();
    appendTerminalLog(data.message, 'warning');
  } catch (err) {
    appendTerminalLog(`Error menghentikan queue: ${err.message}`, 'error');
  }
}

async function resetLoginSession() {
  try {
    const res = await fetch('/api/reset-login', { method: 'POST' });
    const data = await res.json();
    appendTerminalLog(data.message, 'info');
  } catch (err) {
    appendTerminalLog(`Error mereset login: ${err.message}`, 'error');
  }
}

async function captureSingleItem(id, name, url) {
  if (isQueueRunning) return;
  
  const shift = activeShiftSelect.value;
  try {
    appendTerminalLog(`Memicu screenshot manual untuk ${name} (${shift} Shift)...`, 'info');
    
    // Optimistic status update in UI
    const card = categoriesGrid.querySelector(`.category-card[data-id="${id}"]`);
    if (card) {
      const badge = card.querySelector('.badge');
      badge.className = 'badge badge-capturing';
      badge.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> CAPTURING';
    }

     const res = await fetch('/api/capture/single', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, url, shift })
    });
    const data = await res.json();
    if (data && data.message) {
      appendTerminalLog(data.message, 'info');
    }
    
    // Automatically reload categories to reflect successful status and image
    silentReloadCategories();
  } catch (err) {
    appendTerminalLog(`Error: ${err.message}`, 'error');
  }
}

// 6. REALTIME SSE LOGGING
function startLogStream() {
  if (logEventSource) {
    logEventSource.close();
  }

  logEventSource = new EventSource('/api/logs/stream');

  logEventSource.addEventListener('history', (e) => {
    const logs = JSON.parse(e.data);
    terminalLogs.innerHTML = '';
    if (logs.length === 0) {
      appendTerminalLog('Mulai mendengarkan log browser...', 'info');
    } else {
      logs.forEach(log => {
        appendTerminalLogLine(log.message, log.type, log.timestamp);
      });
    }
  });

  logEventSource.addEventListener('log', (e) => {
    const log = JSON.parse(e.data);
    appendTerminalLogLine(log.message, log.type, log.timestamp);
    
    // Automatically trigger list reload when a success/failed log is captured
    if (log.type === 'success' || log.type === 'error') {
      silentReloadCategories();
    }
  });

  // Listen to background Google Sheets cache updates
  logEventSource.addEventListener('categories-updated', () => {
    console.log('[SSE] Google Sheets update detected. Auto-refreshing dashboard...');
    silentReloadCategories();
  });

  logEventSource.onerror = (err) => {
    console.error('SSE connection lost. Reconnecting...', err);
  };
}

function appendTerminalLog(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  appendTerminalLogLine(message, type, timestamp);
}

function appendTerminalLogLine(message, type, timestamp) {
  const line = document.createElement('div');
  line.className = `log-line log-${type}`;
  line.textContent = `[${timestamp}] ${message}`;
  terminalLogs.appendChild(line);
  
  // Auto-scroll to bottom
  terminalLogs.scrollTop = terminalLogs.scrollHeight;
}

// Reload categories without drawing the loading spinner, to keep checkboxes selected
async function silentReloadCategories() {
  console.log('[DEBUG] silentReloadCategories triggered.');
  try {
    const res = await fetch(`/api/categories?t=${Date.now()}`);
    const data = await res.json();
    if (data.success) {
      console.log('[DEBUG] Successfully fetched categories from server:', data.data);
      // Map old statuses and URLs to check if anything changed
      const oldPagiStatuses = new Map(categoriesData.map(c => [c.id, c.statusPagi]));
      const oldMalamStatuses = new Map(categoriesData.map(c => [c.id, c.statusMalam]));
      const oldPagiUrls = new Map(categoriesData.map(c => [c.id, c.screenshotUrlPagi]));
      const oldMalamUrls = new Map(categoriesData.map(c => [c.id, c.screenshotUrlMalam]));
      
      categoriesData = data.data;
      updateMetrics();
      
      // Update individual card elements
      let shouldRedraw = false;
      categoriesData.forEach(item => {
        const oldP = oldPagiStatuses.get(item.id);
        const oldM = oldMalamStatuses.get(item.id);
        const oldPUrl = oldPagiUrls.get(item.id);
        const oldMUrl = oldMalamUrls.get(item.id);
        
        if (
          oldP !== item.statusPagi || 
          oldM !== item.statusMalam ||
          oldPUrl !== item.screenshotUrlPagi ||
          oldMUrl !== item.screenshotUrlMalam
        ) {
          console.log(`[DEBUG] Diff detected on ${item.id}: status(${oldP} -> ${item.statusPagi}), url(${oldPUrl} -> ${item.screenshotUrlPagi})`);
          shouldRedraw = true;
        }
      });
      
      if (shouldRedraw) {
        console.log('[DEBUG] Redrawing grid...');
        renderCategoriesGrid();
      } else {
        console.log('[DEBUG] No status/URL diff detected. Skipping redraw.');
      }
    } else {
      console.error('[DEBUG] Fetch returned failure:', data.error);
    }
  } catch (e) {
    console.error('[DEBUG] Error in silentReloadCategories:', e);
  }
}

// 7. QUEUE RUN STATUS POLLING
function startQueuePolling() {
  if (queueStatusInterval) clearInterval(queueStatusInterval);
  
  queueStatusInterval = setInterval(async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (data.success) {
        setQueueState(data.isProcessing);
        
        // Update capturing status on grid cards
        if (data.isProcessing && data.activeId) {
          const cards = categoriesGrid.querySelectorAll('.category-card');
          cards.forEach(card => {
            const id = card.dataset.id;
            const badge = card.querySelector('.badge');
            
            if (id === data.activeId) {
              if (badge && !badge.classList.contains('badge-capturing')) {
                badge.className = 'badge badge-capturing';
                badge.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> CAPTURING';
              }
            } else {
              // Reset capturing badge if it was capturing but now another is active
              const item = categoriesData.find(d => d.id === id);
              if (item && badge && badge.classList.contains('badge-capturing')) {
                // Restore original badge state
                silentReloadCategories();
              }
            }
          });
        }
      }
    } catch (e) {}
  }, 2000);
}

function setQueueState(running) {
  isQueueRunning = running;
  
  if (running) {
    btnRunQueue.classList.add('hidden');
    btnStopQueue.classList.remove('hidden');
    btnRunSelected.disabled = true;
    btnResetSession.disabled = true;
    selectAllCheckbox.disabled = true;
    
    // Disable checkboxes during queue running
    categoriesGrid.querySelectorAll('.card-cb').forEach(cb => cb.disabled = true);
  } else {
    btnRunQueue.classList.remove('hidden');
    btnStopQueue.classList.add('hidden');
    btnRunSelected.disabled = selectedCategoryIds.size === 0;
    btnResetSession.disabled = false;
    selectAllCheckbox.disabled = false;
    
    // Enable checkboxes
    categoriesGrid.querySelectorAll('.card-cb').forEach(cb => {
      const card = cb.closest('.category-card');
      if (card && card.dataset.hasUrl === 'true') {
        cb.disabled = false;
      }
    });
  }
}

// Global History States
let historySummaryData = [];
let activeArchiveDate = '';
let activeArchiveShift = '';
let activeArchiveDetails = [];

// Initialize History Tab
function initHistoryTab() {
  // Tab toggles
  tabDashboardBtn.addEventListener('click', () => {
    tabDashboardBtn.classList.add('active');
    tabHistoryBtn.classList.remove('active');
    contentDashboardDiv.classList.add('active');
    contentHistoryDiv.classList.remove('active');
  });

  tabHistoryBtn.addEventListener('click', () => {
    tabDashboardBtn.classList.remove('active');
    tabHistoryBtn.classList.add('active');
    contentDashboardDiv.classList.remove('active');
    contentHistoryDiv.classList.add('active');
    loadHistorySummary();
  });

  // Selector changes
  archiveMonthSelect.addEventListener('change', renderCalendarGrid);
  archiveYearSelect.addEventListener('change', renderCalendarGrid);

  // Close details panel
  btnCloseDetailsPanel.addEventListener('click', () => {
    archiveDetailsPanel.classList.add('hidden');
    activeArchiveDate = '';
    activeArchiveShift = '';
    activeArchiveDetails = [];
  });

  // Details search & filters
  archiveDetailsSearch.addEventListener('input', applyArchiveFilters);
  archiveDetailsFilter.addEventListener('change', applyArchiveFilters);
  
  // Set current month/year
  const now = new Date();
  archiveMonthSelect.value = now.getMonth();
  archiveYearSelect.value = now.getFullYear();
}

async function loadHistorySummary() {
  calendarMonthGrid.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px; width: 100%;">
      <i class="fa-solid fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 12px; color: var(--color-primary);"></i>
      <p>Memuat ringkasan riwayat arsip...</p>
    </div>
  `;
  try {
    const res = await fetch(`/api/history/summary?t=${Date.now()}`);
    const data = await res.json();
    if (data.success) {
      historySummaryData = data.data || [];
      renderCalendarGrid();
    }
  } catch (err) {
    console.error('Failed to load history summary:', err);
    calendarMonthGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--error); padding: 40px; width: 100%;">Gagal memuat ringkasan data dari Google Sheets.</p>`;
  }
}

function renderCalendarGrid() {
  calendarMonthGrid.innerHTML = '';
  
  const month = parseInt(archiveMonthSelect.value);
  const year = parseInt(archiveYearSelect.value);
  
  // Get number of days in this month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    // Format date key as yyyy-mm-dd (with leading zeros)
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateKey = `${year}-${monthStr}-${dayStr}`;
    
    // Find summary for Pagi & Malam
    const pagiSummary = historySummaryData.find(s => s.date === dateKey && s.shift === 'Pagi');
    const malamSummary = historySummaryData.find(s => s.date === dateKey && s.shift === 'Malam');
    
    // Determine status classes for indicators
    let pagiClass = 'empty';
    if (pagiSummary) {
      pagiClass = pagiSummary.failedCount > 0 ? 'failed' : (pagiSummary.successCount > 0 ? 'success' : 'empty');
    }
    
    let malamClass = 'empty';
    if (malamSummary) {
      malamClass = malamSummary.failedCount > 0 ? 'failed' : (malamSummary.successCount > 0 ? 'success' : 'empty');
    }
    
    const dayCard = document.createElement('div');
    dayCard.className = 'calendar-day-card';
    
    dayCard.innerHTML = `
      <div class="day-card-number">${dayStr}</div>
      <div class="day-card-shifts">
        <div class="day-shift-row" data-shift="Pagi">
          <span>Pagi</span>
          <span class="shift-indicator ${pagiClass}"></span>
        </div>
        <div class="day-shift-row" data-shift="Malam">
          <span>Malam</span>
          <span class="shift-indicator ${malamClass}"></span>
        </div>
      </div>
    `;
    
    // Bind click handlers to each shift row
    dayCard.querySelectorAll('.day-shift-row').forEach(row => {
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Remove active class from all other shift rows in the calendar
        document.querySelectorAll('.day-shift-row').forEach(r => r.classList.remove('active-shift'));
        // Add active class to this clicked row
        row.classList.add('active-shift');
        
        const selectedShift = row.dataset.shift;
        loadArchiveDetails(dateKey, selectedShift);
      });
    });
    
    // Clicking the day card itself defaults to showing Shift Pagi
    dayCard.addEventListener('click', () => {
      const pagiRow = dayCard.querySelector('.day-shift-row[data-shift="Pagi"]');
      if (pagiRow) {
        document.querySelectorAll('.day-shift-row').forEach(r => r.classList.remove('active-shift'));
        pagiRow.classList.add('active-shift');
        loadArchiveDetails(dateKey, 'Pagi');
      }
    });
    
    calendarMonthGrid.appendChild(dayCard);
  }
}

async function loadArchiveDetails(date, shift) {
  activeArchiveDate = date;
  activeArchiveShift = shift;
  
  // Format readable title date
  const parts = date.split('-');
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const readableDate = `${parts[2]} ${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
  
  selectedArchiveDateText.textContent = readableDate;
  selectedArchiveShiftText.textContent = `Shift ${shift}`;
  
  archiveDetailsPanel.classList.remove('hidden');
  archiveDetailsGrid.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px; width: 100%;">
      <i class="fa-solid fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 12px; color: var(--color-primary);"></i>
      <p>Memuat rincian arsip screenshot...</p>
    </div>
  `;
  
  // Auto-scroll details panel into view
  archiveDetailsPanel.scrollIntoView({ behavior: 'smooth' });
  
  try {
    const res = await fetch(`/api/history/details?date=${date}&shift=${shift}&t=${Date.now()}`);
    const data = await res.json();
    if (data.success) {
      activeArchiveDetails = data.data || [];
      renderArchiveDetailsGrid();
    }
  } catch (err) {
    console.error('Failed to load archive details:', err);
    archiveDetailsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--error); padding: 20px; width: 100%;">Gagal memuat rincian arsip untuk tanggal ini.</p>`;
  }
}

function renderArchiveDetailsGrid() {
  if (activeArchiveDetails.length === 0) {
    archiveDetailsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 30px; width: 100%;">Tidak ada data screenshot tercatat pada shift ini.</p>`;
    return;
  }
  
  archiveDetailsGrid.innerHTML = '';
  
  const query = archiveDetailsSearch.value.toLowerCase().trim();
  const filter = archiveDetailsFilter.value;
  
  const filtered = activeArchiveDetails.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(query) || (item.url && item.url.toLowerCase().includes(query));
    let matchesStatus = true;
    if (filter === 'Success') {
      matchesStatus = item.status === 'Success';
    } else if (filter === 'Failed') {
      matchesStatus = item.status === 'Failed';
    }
    return matchesSearch && matchesStatus;
  });
  
  if (filtered.length === 0) {
    archiveDetailsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 30px; width: 100%;">Tidak ada arsip yang cocok dengan pencarian.</p>`;
    return;
  }
  
  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'archive-detail-card';
    
    // Format timestamp
    const timeFormatted = item.timestamp ? new Date(item.timestamp).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) : '-';
    
    let badgeClass = 'badge-idle';
    if (item.status === 'Success') badgeClass = 'badge-success';
    else if (item.status === 'Failed') badgeClass = 'badge-failed';
    
    card.innerHTML = `
      <div class="detail-title" title="${item.name}">${item.name}</div>
      <div class="detail-time">Waktu: ${timeFormatted}</div>
      
      <!-- IMAGE BOX -->
      <div class="detail-image-box">
        ${item.screenshotUrl ? `
          <img src="${getDirectDriveImageUrl(item.screenshotUrl)}" alt="${item.name} SS" />
          <div class="zoom-overlay">Double Click to Zoom</div>
        ` : `
          <div style="height: 100%; display: flex; align-items: center; justify-content: center; background-color: var(--bg-primary); color: var(--text-muted); font-size: 10px; flex-direction: column; gap: 4px;">
            <i class="fa-solid fa-image-portrait" style="font-size: 18px;"></i>
            <span>No Image</span>
          </div>
        `}
      </div>
      
      <div class="detail-meta">
        <span class="badge ${badgeClass}">${item.status.toUpperCase()}</span>
        ${item.screenshotUrl ? `
          <div style="display: flex; gap: 8px;">
            <a href="${item.screenshotUrl}" target="_blank" class="card-action-btn btn-ss-link" title="Buka Gambar Asli">
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
            <button class="card-action-btn btn-ss-view" title="Perbesar Gambar">
              <i class="fa-solid fa-image"></i>
            </button>
          </div>
        ` : ''}
      </div>
    `;
    
    // Bind zoom actions on button click and double click
    if (item.screenshotUrl) {
      const imgBox = card.querySelector('.detail-image-box');
      imgBox.addEventListener('dblclick', () => {
        openImageModal(item.name, item.url, item.screenshotUrl, item.timestamp);
      });
      
      const viewBtn = card.querySelector('.btn-ss-view');
      if (viewBtn) {
        viewBtn.addEventListener('click', () => {
          openImageModal(item.name, item.url, item.screenshotUrl, item.timestamp);
        });
      }
    }
    
    archiveDetailsGrid.appendChild(card);
  });
}

function applyArchiveFilters() {
  renderArchiveDetailsGrid();
}

// Render current date in Indonesian format for main header
function setTodayDate() {
  const today = new Date();
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  const dayName = days[today.getDay()];
  const dateNum = today.getDate();
  const monthName = months[today.getMonth()];
  const yearNum = today.getFullYear();
  
  const formattedToday = `${dayName}, ${dateNum} ${monthName} ${yearNum}`;
  const el = document.getElementById('titleTodayDate');
  if (el) {
    el.innerHTML = `<i class="fa-regular fa-calendar"></i> ${formattedToday}`;
  }
}
