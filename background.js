// Background Service Worker v6.0 - Production Ready with Error Handling
console.log('[SAR Background] Service Worker initialized');

// ===== SAFE STORAGE HELPERS =====
function safeStorageGet(key, defaultValue = null) {
    return new Promise((resolve) => {
        try {
            if (key === null || key === undefined) {
                chrome.storage.local.get(null, (result) => {
                    if (chrome.runtime.lastError) {
                        console.error('[SAR Background] Storage get error:', chrome.runtime.lastError.message);
                        resolve(defaultValue);
                    } else {
                        resolve(result || defaultValue);
                    }
                });
            } else {
                chrome.storage.local.get(key, (result) => {
                    if (chrome.runtime.lastError) {
                        console.error('[SAR Background] Storage get error:', chrome.runtime.lastError.message);
                        resolve(defaultValue);
                    } else {
                        resolve(result[key] !== undefined ? result[key] : defaultValue);
                    }
                });
            }
        } catch (err) {
            console.error('[SAR Background] Storage get exception:', err.message);
            resolve(defaultValue);
        }
    });
}

function safeStorageSet(data = {}) {
    return new Promise((resolve) => {
        try {
            chrome.storage.local.set(data, () => {
                if (chrome.runtime.lastError) {
                    console.error('[SAR Background] Storage set error:', chrome.runtime.lastError.message);
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        } catch (err) {
            console.error('[SAR Background] Storage set exception:', err.message);
            resolve(false);
        }
    });
}

// ===== STARTUP SYNC =====
chrome.runtime.onStartup.addListener(sync);
chrome.runtime.onInstalled.addListener(sync);

async function sync() {
    const data = await safeStorageGet('isRunning', false);
    if (data) {
        console.log('[SAR Background] Restoring alarm on startup');
        createAlarm();
    }
}

function createAlarm() {
    try {
        chrome.alarms.create('autoReaction', { delayInMinutes: 1, periodInMinutes: 3 });
        console.log('[SAR Background] Alarm created: 1min delay, 3min interval');
    } catch (err) {
        console.error('[SAR Background] Alarm creation error:', err.message);
    }
}

// ===== ALARM LISTENER =====
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'autoReaction') {
        const data = await safeStorageGet('isRunning', false);
        if (data) {
            console.log('[SAR Background] Alarm triggered, broadcasting scan request');
            broadcast();
        }
    }
});

// ===== BROADCAST FUNCTION =====
async function broadcast() {
    try {
        const tabs = await chrome.tabs.query({ url: "*://*.facebook.com/*" });
        const storedData = await safeStorageGet(null, {});
        
        // Prepare settings
        const settings = {
            isRunning: storedData.isRunning || false,
            ignoreFanpage: storedData.ignoreFanpage || false,
            ignoreGroup: storedData.ignoreGroup || false,
            timePeriod: storedData.timePeriod || 5,
            contentFilter: storedData.contentFilter || {
                enabled: true,
                avoidPolitics: true,
                avoidControversial: true,
                avoidAds: true
            },
            reactionType: storedData.reactionType || 'auto',
            maxReactionsPerHour: storedData.maxReactionsPerHour || 30,
            enableSmartDelay: storedData.enableSmartDelay !== false,
            enableSchedule: storedData.enableSchedule || false,
            scheduleStart: storedData.scheduleStart || '09:00',
            scheduleEnd: storedData.scheduleEnd || '23:00'
        };

        console.log(`[SAR Background] Broadcasting to ${tabs.length} Facebook tabs`);
        
        tabs.forEach((tab) => {
            try {
                chrome.tabs.sendMessage(tab.id, { action: 'scanAndReact', settings }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log(`[SAR Background] Tab ${tab.id} error: ${chrome.runtime.lastError.message}`);
                        return;
                    }
                    console.log(`[SAR Background] Tab ${tab.id} response:`, response);
                });
            } catch (err) {
                console.error(`[SAR Background] Error sending message to tab ${tab.id}:`, err.message);
            }
        });
    } catch (err) {
        console.error('[SAR Background] Broadcast error:', err.message);
    }
}

// ===== MESSAGE LISTENER =====
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getStatus') {
        (async () => {
            const data = await safeStorageGet('isRunning', false);
            sendResponse({ isRunning: data });
        })();
        return true;
    }

    if (message.action === 'start') {
        (async () => {
            console.log('[SAR Background] Start requested');
            await safeStorageSet({ isRunning: true });
            createAlarm();
            broadcast();
            sendResponse({ success: true });
        })();
        return true;
    }

    if (message.action === 'stop') {
        (async () => {
            console.log('[SAR Background] Stop requested');
            await safeStorageSet({ isRunning: false });
            try {
                chrome.alarms.clear('autoReaction');
            } catch (err) {
                console.error('[SAR Background] Error clearing alarm:', err.message);
            }
            sendResponse({ success: true });
        })();
        return true;
    }

    if (message.action === 'updateSettings') {
        (async () => {
            console.log('[SAR Background] Settings update requested:', message.settings);
            await safeStorageSet(message.settings || {});
            broadcast();
            sendResponse({ success: true });
        })();
        return true;
    }

    return false;
});

console.log('[SAR Background] Fully initialized');
