// Popup Logic - v3.0 Enhanced UX with Error Handling
let isRunning = false;
let settings = {};
let activityLog = [];

// ===== SAFE CHROME API HELPERS =====
function safeStorageGet(key, defaultValue = null) {
    return new Promise((resolve) => {
        try {
            if (!chrome?.storage?.local) {
                resolve(defaultValue);
                return;
            }
            if (key === null || key === undefined) {
                chrome.storage.local.get(null, (result) => {
                    if (chrome.runtime.lastError) {
                        console.error('[SAR Popup] Storage get error:', chrome.runtime.lastError.message);
                        resolve(defaultValue);
                    } else {
                        resolve(result || defaultValue);
                    }
                });
            } else {
                chrome.storage.local.get(key, (result) => {
                    if (chrome.runtime.lastError) {
                        console.error('[SAR Popup] Storage get error:', chrome.runtime.lastError.message);
                        resolve(defaultValue);
                    } else {
                        resolve(result[key] !== undefined ? result[key] : defaultValue);
                    }
                });
            }
        } catch (err) {
            console.error('[SAR Popup] Storage get exception:', err.message);
            resolve(defaultValue);
        }
    });
}

function safeStorageSet(data = {}) {
    return new Promise((resolve) => {
        try {
            if (!chrome?.storage?.local) {
                resolve(false);
                return;
            }
            chrome.storage.local.set(data, () => {
                if (chrome.runtime.lastError) {
                    console.error('[SAR Popup] Storage set error:', chrome.runtime.lastError.message);
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        } catch (err) {
            console.error('[SAR Popup] Storage set exception:', err.message);
            resolve(false);
        }
    });
}

async function safeSendMessage(message, defaultValue = null) {
    try {
        console.log('[SAR Popup] Sending message:', message);
        const response = await chrome.runtime.sendMessage(message);
        console.log('[SAR Popup] Got response:', response);
        return response || defaultValue;
    } catch (err) {
        console.error('[SAR Popup] Message send error:', err.message, err);
        return defaultValue;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    await loadActivityLog();
    await updateStatus();
    setupEvents();
    loadStats();

    // Auto-refresh stats every 2 seconds while popup is open
    setInterval(loadStats, 2000);
    setInterval(loadActivityLog, 5000);  // Refresh log mỗi 5s
});

// ===== LOAD SETTINGS =====
async function loadSettings() {
    const stored = await safeStorageGet(null, {});
    settings = stored;

    // Map settings to UI inputs
    setVal('startup', settings.startup || false);
    setVal('ignore-fanpage', settings.ignoreFanpage || false);
    setVal('ignore-group', settings.ignoreGroup || false);
    setVal('time-period', settings.timePeriod || 5);
    setVal('filter-enabled', settings.contentFilter?.enabled !== false);
    setVal('avoid-politics', settings.contentFilter?.avoidPolitics !== false);
    setVal('avoid-controversial', settings.contentFilter?.avoidControversial !== false);
    setVal('avoid-ads', settings.contentFilter?.avoidAds !== false);
    
    // Safety settings
    setVal('max-reactions-hour', settings.maxReactionsPerHour || 30);
    setVal('enable-smart-delay', settings.enableSmartDelay !== false);
    setVal('enable-schedule', settings.enableSchedule || false);
    setVal('schedule-start', settings.scheduleStart || '09:00');
    setVal('schedule-end', settings.scheduleEnd || '23:00');

    const reaction = settings.reactionType || 'auto';
    const radio = document.querySelector(`input[name="reaction"][value="${reaction}"]`);
    if (radio) radio.checked = true;

    // Show/hide schedule inputs
    toggleScheduleInputs();
}

function setVal(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = value;
    else el.value = value;
}

async function updateStatus() {
    const response = await safeSendMessage({ action: 'getStatus' }, { isRunning: false });
    isRunning = response.isRunning;

    const btn = document.getElementById('btn-toggle');
    if (isRunning) {
        btn.classList.add('active');
        // Optional: Add glow effect via CSS class
    } else {
        btn.classList.remove('active');
    }
}

async function loadActivityLog() {
    try {
        const data = await safeStorageGet('activityLog', []);
        activityLog = (data || []).slice(-50);  // Get last 50 entries
        
        // Tự động render lại nếu người dùng đang ở trang log
        const logPage = document.getElementById('log-page');
        if (logPage && logPage.classList.contains('active')) {
            renderActivityLog();
        }
    } catch (err) {
        console.error('[SAR Popup] Error loading log:', err);
    }
}

async function loadMetricsStats() {
    try {
        const metrics = await safeStorageGet('performanceMetrics', {});
        const today = new Date().toISOString().split('T')[0];
        return {
            today: metrics[today] || { reacted: 0, skipped: 0, errors: 0, scans: 0 },
            allMetrics: metrics
        };
    } catch (err) {
        console.error('[SAR Popup] Error loading metrics:', err);
        return { today: { reacted: 0, skipped: 0, errors: 0, scans: 0 }, allMetrics: {} };
    }
}

function showToast(message, duration = 2000) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #222;
        color: #0f0;
        padding: 12px 20px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 9999;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 1px solid #0f0;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

async function loadStats() {
    try {
        const basicStats = await safeStorageGet(null, {});
        const metricsData = await loadMetricsStats();
        
        const postsProcessed = basicStats.postsProcessed || 0;
        const reactionsAdded = basicStats.reactionsAdded || 0;
        const postsSkipped = basicStats.postsSkipped || 0;
        
        // Update UI with basic stats
        const el1 = document.getElementById('posts-processed');
        const el2 = document.getElementById('reactions-added');
        const el3 = document.getElementById('posts-skipped');
        
        if (el1) el1.textContent = postsProcessed;
        if (el2) el2.textContent = reactionsAdded;
        if (el3) el3.textContent = postsSkipped;
        
        // Update metrics dashboard if it exists
        if (metricsData?.today) {
            const todayReacted = document.getElementById('today-reacted');
            const todayScans = document.getElementById('today-scans');
            const todayErrors = document.getElementById('today-errors');
            
            if (todayReacted) todayReacted.textContent = metricsData.today.reacted || 0;
            if (todayScans) todayScans.textContent = metricsData.today.scans || 0;
            if (todayErrors) todayErrors.textContent = metricsData.today.errors || 0;
        }
    } catch (err) {
        console.error('[SAR Popup] Error in loadStats:', err);
    }
}

function renderActivityLog() {
    const logList = document.getElementById('log-list');
    const filter = document.getElementById('log-filter')?.value || 'all';

    if (activityLog.length === 0) {
        logList.innerHTML = '<div class="log-empty">Chưa có hoạt động</div>';
        return;
    }

    const filtered = activityLog.filter(entry => {
        if (filter === 'all') return true;
        return entry.status === filter;
    }).reverse();

    if (filtered.length === 0) {
        logList.innerHTML = '<div class="log-empty">Không có hoạt động loại này</div>';
        return;
    }

    logList.innerHTML = filtered.map(entry => `
        <div class="log-entry log-${entry.status}">
            <div class="log-time">${new Date(entry.timestamp).toLocaleTimeString()}</div>
            <div class="log-content">
                <div class="log-status">${getStatusIcon(entry.status)} ${entry.status}</div>
                <div class="log-text">${entry.text.substring(0, 60)}...</div>
                <div class="log-reaction">${entry.reaction || ''}</div>
            </div>
        </div>
    `).join('');
}

function getStatusIcon(status) {
    const icons = {
        'success': '✅',
        'skipped': '⏭️',
        'error': '❌'
    };
    return icons[status] || '⚪';
}

function toggleScheduleInputs() {
    const toggle = document.getElementById('enable-schedule');
    const inputs = document.getElementById('schedule-inputs');
    if (toggle && inputs) {
        inputs.style.display = toggle.checked ? 'block' : 'none';
    }
}

function setupEvents() {
    // Power Button
    document.getElementById('btn-toggle').addEventListener('click', async () => {
        console.log('[SAR Popup] Toggle button clicked, isRunning:', isRunning);
        try {
            const action = isRunning ? 'stop' : 'start';
            console.log('[SAR Popup] Sending action:', action);
            const response = await safeSendMessage({ action }, { success: false });
            console.log('[SAR Popup] Response received:', response);
            
            if (response?.success) {
                console.log('[SAR Popup] Action succeeded, updating status');
                await updateStatus();
                const message = action === 'start' ? 'Đã bắt đầu scanning' : 'Đã dừng scanning';
                showToast(message);
            } else {
                console.log('[SAR Popup] Action failed, response:', response);
                showToast('Lỗi khi thay đổi trạng thái', 2000);
            }
        } catch (err) {
            console.error('[SAR Popup] Toggle error:', err);
            showToast('Lỗi: ' + err.message, 2000);
        }
    });

    // Activity Log Button
    const btnLog = document.getElementById('btn-log');
    if (btnLog) {
        btnLog.addEventListener('click', () => {
            renderActivityLog();
            showPage('log-page');
        });
    }

    // Navigation: Settings
    document.getElementById('btn-settings').addEventListener('click', () => {
        showPage('settings-page');
    });

    // Navigation: Back
    document.getElementById('btn-back').addEventListener('click', () => {
        showPage('main-page');
    });

    // Log Filter
    const logFilter = document.getElementById('log-filter');
    if (logFilter) {
        logFilter.addEventListener('change', renderActivityLog);
    }

    // Export Log
    const btnExport = document.getElementById('btn-export-log');
    if (btnExport) {
        btnExport.addEventListener('click', exportActivityLog);
    }

    // Schedule Toggle
    const enableSchedule = document.getElementById('enable-schedule');
    if (enableSchedule) {
        enableSchedule.addEventListener('change', toggleScheduleInputs);
    }

    // Reset Stats Button
    const btnReset = document.getElementById('btn-reset-stats');
    if (btnReset) {
        btnReset.addEventListener('click', async () => {
            if (confirm('⚠️ Bạn chắc chắn muốn reset thống kê?')) {
                await safeStorageSet({
                    postsProcessed: 0,
                    reactionsAdded: 0,
                    postsSkipped: 0
                });
                await loadStats();
                showToast('Thống kê đã reset');
            }
        });
    }

    // Clear Log Button
    const btnClear = document.getElementById('btn-clear-log');
    if (btnClear) {
        btnClear.addEventListener('click', async () => {
            if (confirm('⚠️ Bạn chắc chắn muốn xóa activity log?')) {
                await safeStorageSet({ activityLog: [] });
                activityLog = [];
                renderActivityLog();
                showToast('Log đã xóa');
            }
        });
    }

    // Save Settings
    document.getElementById('btn-save').addEventListener('click', async () => {
        try {
            await saveConfig();
            const btn = document.getElementById('btn-save');
            const originalText = btn.textContent;
            btn.textContent = 'Đã lưu!';
            btn.style.background = '#31a24c';
            showToast('Cấu hình đã lưu', 1500);
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
                showPage('main-page');
            }, 800);
        } catch (err) {
            console.error('[SAR Popup] Save config error:', err);
            showToast('Lỗi khi lưu cấu hình', 2000);
        }
    });
}

function exportActivityLog() {
    if (activityLog.length === 0) {
        showToast('Chưa có hoạt động để export');
        return;
    }

    // Create CSV content
    const headers = ['Thời gian', 'Trạng thái', 'Nội dung', 'Loại cảm xúc'];
    const rows = activityLog.map(entry => [
        new Date(entry.timestamp).toLocaleString(),
        entry.status,
        entry.text,
        entry.reaction || ''
    ]);

    let csv = headers.join(',') + '\n';
    csv += rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sar-log-${Date.now()}.csv`);
    link.click();
    showToast('Log đã export');
}

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    // Show requested page
    document.getElementById(pageId).classList.add('active');

    // Toggle header buttons
    const isMain = pageId === 'main-page';
    const btnLog = document.getElementById('btn-log');
    const btnSettings = document.getElementById('btn-settings');
    const btnBack = document.getElementById('btn-back');

    if (btnLog) btnLog.style.display = isMain ? 'flex' : 'none';
    if (btnSettings) btnSettings.style.display = isMain ? 'flex' : 'none';
    if (btnBack) btnBack.style.display = isMain ? 'none' : 'flex';
}

async function saveConfig() {
    const reactionRadio = document.querySelector('input[name="reaction"]:checked');
    const newSettings = {
        startup: getVal('startup'),
        ignoreFanpage: getVal('ignore-fanpage'),
        ignoreGroup: getVal('ignore-group'),
        timePeriod: parseInt(getVal('time-period')) || 5,
        contentFilter: {
            enabled: getVal('filter-enabled'),
            avoidPolitics: getVal('avoid-politics'),
            avoidControversial: getVal('avoid-controversial'),
            avoidAds: getVal('avoid-ads')
        },
        reactionType: reactionRadio?.value || 'auto',
        // Safety settings
        maxReactionsPerHour: parseInt(getVal('max-reactions-hour')) || 30,
        enableSmartDelay: getVal('enable-smart-delay'),
        enableSchedule: getVal('enable-schedule'),
        scheduleStart: getVal('schedule-start') || '09:00',
        scheduleEnd: getVal('schedule-end') || '23:00'
    };

    await safeStorageSet(newSettings);
    await safeSendMessage({
        action: 'updateSettings',
        settings: newSettings
    });

    settings = newSettings;
}

function getVal(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    return el.type === 'checkbox' ? el.checked : el.value;
}
