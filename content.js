// SAR v12.0 - PRODUCTION READY WITH ERROR HANDLING
console.log('%c[SAR] v12.0: PRODUCTION MODE ACTIVE', 'background: #222; color: #0f0; font-size: 18px; font-weight: bold; padding: 10px;');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ===== KEYWORDS =====
const POLITICS_KEYWORDS = ['chính trị', 'đảng', 'nhà nước', 'phản động', 'biểu tình', 'bầu cử'];
const CONTROVERSIAL_KEYWORDS = ['drama', 'phốt', 'lừa đảo', 'cảnh báo', 'tai nạn', 'tử vong', 'chết'];
const ADS_KEYWORDS = ['cài đặt', 'thiết lập', 'config', 'lỗi hệ thống', 'update', 'quảng cáo', 'mua ngay', 'giảm giá', 'inbox'];
const POSITIVE_KEYWORDS = ['chúc mừng', 'tuyệt vời', 'vui', 'hạnh phúc', 'yêu', 'đẹp', 'ngon', 'xịn', 'thành công'];
const FUNNY_KEYWORDS = ['haha', 'hihi', 'vcl', 'cười', 'hài hước', 'vui nhộn'];

// ===== STATE =====
let currentSettings = {
    contentFilter: { enabled: true, avoidPolitics: true, avoidControversial: true, avoidAds: true },
    reactionType: 'auto',
    maxReactionsPerHour: 30,
    enableSmartDelay: true,
    enableSchedule: false,
    scheduleStart: '09:00',
    scheduleEnd: '23:00'
};

let processedPostIds = new Set();
let lastScanTime = 0;
let isScanRunning = false;
let reactionsThisHour = 0;
let hourStartTime = Date.now();
let totalSkippedDueToLimit = 0;

// ===== REACTION MAP =====
const REACTION_LABELS = {
    'like': { vi: 'Thích', en: 'Like' },
    'love': { vi: 'Yêu thích', en: 'Love' },
    'care': { vi: 'Quan tâm', en: 'Care' },
    'haha': { vi: 'Haha', en: 'Haha' },
    'wow': { vi: 'Wow', en: 'Wow' },
    'sad': { vi: 'Buồn', en: 'Sad' },
    'angry': { vi: 'Phẫn nộ', en: 'Angry' }
};

// ===== LOGGING =====
function log(type, message, data = '') {
    const timestamp = new Date().toLocaleTimeString();
    const styles = {
        info: 'color: #0f0',
        success: 'color: #00ff00; font-weight: bold',
        warn: 'color: #ff9800; font-weight: bold',
        error: 'color: #ff4444; font-weight: bold',
        debug: 'color: #00ccff; font-size: 11px'
    };
    const style = styles[type] || 'color: #fff';
    if (data) {
        console.log(`%c[SAR ${timestamp}] [${type}] ${message}`, style, data);
    } else {
        console.log(`%c[SAR ${timestamp}] [${type}] ${message}`, style);
    }
}

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
                        log('error', 'Storage get error', chrome.runtime.lastError.message);
                        resolve(defaultValue);
                    } else {
                        resolve(result || defaultValue);
                    }
                });
            } else {
                chrome.storage.local.get(key, (result) => {
                    if (chrome.runtime.lastError) {
                        log('error', 'Storage get error', chrome.runtime.lastError.message);
                        resolve(defaultValue);
                    } else {
                        resolve(result[key] !== undefined ? result[key] : defaultValue);
                    }
                });
            }
        } catch (err) {
            log('error', 'Storage get exception', err.message);
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
                    log('error', 'Storage set error', chrome.runtime.lastError.message);
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        } catch (err) {
            log('error', 'Storage set exception', err.message);
            resolve(false);
        }
    });
}

// ===== ACTIVITY LOG =====
async function addActivityLog(status, text, reaction = '') {
    try {
        const entry = {
            timestamp: Date.now(),
            status,
            text: text.substring(0, 100),
            reaction
        };

        const actLog = await safeStorageGet('activityLog', []);
        actLog.push(entry);
        
        if (actLog.length > 100) {
            actLog.shift();
        }

        await safeStorageSet({ activityLog: actLog });
    } catch (err) {
        log('error', 'Error in addActivityLog', err.message);
    }
}

// ===== PERFORMANCE METRICS TRACKING =====
async function trackMetrics(type, value) {
    try {
        const today = new Date().toISOString().split('T')[0];  // YYYY-MM-DD
        const metrics = await safeStorageGet('performanceMetrics', {});
        
        if (!metrics[today]) metrics[today] = { reacted: 0, skipped: 0, errors: 0, scans: 0 };
        
        metrics[today][type] = (metrics[today][type] || 0) + value;
        await safeStorageSet({ performanceMetrics: metrics });
        
        return metrics[today];
    } catch (err) {
        log('warn', 'Metrics tracking error', err.message);
        return null;
    }
}

async function getMetricsStats() {
    try {
        const metrics = await safeStorageGet('performanceMetrics', {});
        const today = new Date().toISOString().split('T')[0];
        const week = Object.keys(metrics).slice(-7);  // Last 7 days
        
        const todayStats = metrics[today] || { reacted: 0, skipped: 0, errors: 0, scans: 0 };
        const weekStats = {
            totalReacted: 0,
            totalSkipped: 0,
            totalErrors: 0,
            totalScans: 0
        };
        
        week.forEach(date => {
            if (metrics[date]) {
                weekStats.totalReacted += metrics[date].reacted || 0;
                weekStats.totalSkipped += metrics[date].skipped || 0;
                weekStats.totalErrors += metrics[date].errors || 0;
                weekStats.totalScans += metrics[date].scans || 0;
            }
        });
        
        return { today: todayStats, week: weekStats, allMetrics: metrics };
    } catch (err) {
        log('error', 'Error getting metrics stats', err.message);
        return null;
    }
}

// ===== DOM VALIDATION HELPERS =====
function isElementValid(el) {
    if (!el) return false;
    try {
        return document.body.contains(el) && el.offsetHeight > 0 && el.offsetWidth > 0;
    } catch (e) {
        return false;
    }
}

function getElementInfo(el) {
    if (!el) return 'null';
    try {
        const tag = el.tagName;
        const id = el.id ? `#${el.id}` : '';
        const classes = el.className ? `.${el.className.split(" ").join(".")}` : '';
        const role = el.getAttribute('role') ? `[role="${el.getAttribute('role')}"]` : '';
        return `${tag}${id}${classes}${role}`;
    } catch (e) {
        return 'invalid-element';
    }
}

// ===== ERROR WRAPPER FOR SAFE EXECUTION =====
async function safeExecute(fn, fnName = 'unknown', fallback = null) {
    try {
        return await fn();
    } catch (err) {
        log('error', `Error in ${fnName}`, err.message);
        await trackMetrics('errors', 1);
        return fallback;
    }
}

// ===== ENHANCED REACTION DETECTION WITH CONSTRAINTS =====
async function findSafeReactionButton(reactionType, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const btn = findReactionButton(reactionType);
            if (isElementValid(btn)) {
                log('success', `Found ${reactionType} button (attempt ${attempt + 1})`);
                return btn;
            }
        } catch (err) {
            log('warn', `Reaction button search attempt ${attempt + 1} failed`, err.message);
        }
        
        if (attempt < maxRetries - 1) {
            await sleep(200);  // Wait before retry
        }
    }
    
    log('error', `${reactionType} button not found after ${maxRetries} attempts`);
    return null;
}

// ===== HELPER: GET POST ID =====
function getPostId(article) {
    const id = article.getAttribute('data-ft') || article.getAttribute('id');
    return id || `post_${Date.now()}_${Math.random()}`;
}

// ===== RATE LIMITING =====
function isRateLimited() {
    const now = Date.now();
    const hourPassed = now - hourStartTime > 3600000;  // 1 hour in ms

    // Reset hourly counter
    if (hourPassed) {
        reactionsThisHour = 0;
        hourStartTime = now;
        totalSkippedDueToLimit = 0;
    }

    const maxReactions = currentSettings.maxReactionsPerHour || 30;
    return reactionsThisHour >= maxReactions;
}

// ===== SCHEDULE CHECK =====
function isScheduleAllowed() {
    if (!currentSettings.enableSchedule) {
        return true;  // Schedule disabled
    }

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;

    const start = currentSettings.scheduleStart || '09:00';
    const end = currentSettings.scheduleEnd || '23:00';

    return currentTime >= start && currentTime < end;
}

// ===== SMART DELAY =====
async function smartDelay() {
    if (!currentSettings.enableSmartDelay) {
        await sleep(5000);  // Default 5 seconds
        return;
    }

    const now = new Date();
    const hour = now.getHours();

    // Prime time (10:00-12:00, 18:00-20:00): longer delay
    const isPrimeTime = (hour >= 10 && hour < 12) || (hour >= 18 && hour < 20);
    const baseDelay = isPrimeTime ? 8000 : 5000;  // 8s or 5s base
    const variance = Math.random() * 12000;  // 0-12s variance

    const totalDelay = baseDelay + variance;

    // Every 10th reaction, add a longer pause (60-120s break)
    if (reactionsThisHour > 0 && reactionsThisHour % 10 === 0) {
        log('warn', `Taking a ${Math.floor(Math.random() * 60 + 60)}s break...`);
        await sleep(60000 + Math.random() * 60000);
    } else {
        await sleep(totalDelay);
    }
}


// ===== MESSAGE LISTENER =====
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'scanAndReact' && message.settings) {
        currentSettings = message.settings;
        log('info', 'Settings updated', currentSettings);
        // Scan ngay khi nhận message
        if (!isScanRunning) {
            runSmartScan();
        }
        sendResponse({ success: true, scanning: isScanRunning });
    }
});

// ===== SCAN INTERVAL =====
// Scan mỗi 15 giây nếu isRunning=true (balance giữa responsiveness & safety)
setInterval(async () => {
    const data = await safeStorageGet('isRunning', false);
    if (data && !isScanRunning) {
        const stored = await safeStorageGet(null, {});
        currentSettings = stored || currentSettings;
        runSmartScan();
    }
}, 15000);

async function runSmartScan() {
    if (isScanRunning) {
        log('warn', 'Scan already running, skipping');
        return;
    }

    // Check if schedule allows running
    if (!isScheduleAllowed()) {
        log('warn', 'Outside scheduled hours, skipping scan');
        return;
    }

    isScanRunning = true;
    lastScanTime = Date.now();
    let processedCount = 0, reactedCount = 0, skippedCount = 0, limitedCount = 0;

    try {
        log('info', `Starting scan... (${reactionsThisHour}/${currentSettings.maxReactionsPerHour || 30} reactions this hour)`);

        // Lấy tất cả bài viết - Chỉ lấy các top-level articles (không phải comment con)
        let articles = Array.from(document.querySelectorAll('[role="article"]')).filter(art => {
            if (art.querySelector('[aria-label="Đang tải..."]')) return false;
            
            // Check nếu là comment con (có phần tử cha cũng là [role="article"])
            let parent = art.parentElement;
            while (parent) {
                if (parent.getAttribute('role') === 'article') {
                    return false; // Đây là comment lồng bên trong post, bỏ qua!
                }
                parent = parent.parentElement;
            }
            return true;
        });

        // FALLBACK 1: data-ft selector
        if (articles.length === 0) {
            log('warn', 'Primary selector failed, trying fallback #1: [data-ft]');
            articles = Array.from(document.querySelectorAll('div[data-ft]'))
                .filter(art => !art.querySelector('[aria-label="Đang tải..."]'))
                .slice(0, 50);
        }

        // FALLBACK 2: story class
        if (articles.length === 0) {
            log('warn', 'Fallback #1 failed, trying fallback #2: [class*="story"]');
            articles = Array.from(document.querySelectorAll('[class*="story"]'))
                .filter(art => !art.querySelector('[aria-label="Đang tải..."]'))
                .slice(0, 50);
        }

        // FALLBACK 3: Any div with buttons (likely post container)
        if (articles.length === 0) {
            log('warn', 'Fallback #2 failed, trying fallback #3: div with buttons');
            articles = Array.from(document.querySelectorAll('div'))
                .filter(art => {
                    const hasButton = art.querySelector('button, [role="button"]') !== null;
                    const isLoading = art.querySelector('[aria-label="Đang tải..."]') !== null;
                    const minHeight = art.offsetHeight > 80;
                    return hasButton && !isLoading && minHeight;
                })
                .slice(0, 50);
        }

        // DEBUG: Log chi tiết về posts tìm được
        log('info', `Found ${articles.length} posts to process`);
        
        // FILTER: Skip garbage posts (UI elements, repeated text)
        articles = articles.filter(art => {
            const text = (art.innerText || '').trim();
            
            // Skip very short posts (likely UI elements)
            if (text.length < 30) {
                return false;
            }
            
            // Skip repeated "Facebook" text (navigation, ads)
            if (text.split('Facebook').length > 5) {
                return false;
            }
            
            // Skip if it's just the same word repeated
            const words = text.split(/\s+/);
            if (words.length > 0) {
                const uniqueWords = new Set(words.slice(0, 10));
                if (uniqueWords.size === 1) {
                    return false;  // All same word = garbage
                }
            }
            
            return true;
        });
        
        log('info', `After filtering: ${articles.length} real posts`);
        
        if (articles.length > 0) {
            articles.slice(0, 3).forEach((art, idx) => {
                const text = (art.innerText || '').substring(0, 60);
                log('info', `Post ${idx + 1} preview`, text);
            });
        }

        if (articles.length === 0) {
            // Deep dive debugging
            const allArticles = document.querySelectorAll('[role="article"]').length;
            const allData = document.querySelectorAll('div[data-ft]').length;
            const allStory = document.querySelectorAll('[class*="story"]').length;
            const allPresentation = document.querySelectorAll('div[role="presentation"]').length;
            
            log('warn', 'No posts passed filters. Checking raw selectors:');
            log('debug', `[role="article"]: ${allArticles} found`);
            log('debug', `[data-ft]: ${allData} found`);
            log('debug', `[class*="story"]: ${allStory} found`);
            log('debug', `[role="presentation"]: ${allPresentation} found`);
            
            // Log DOM info để debug
            const divCount = document.querySelectorAll('div').length;
            log('warn', `DOM debug: ${divCount} divs total, ${allArticles} articles`);
            log('warn', 'Try scrolling Facebook feed to load more posts');
            isScanRunning = false;
            return;
        }

        for (const article of articles) {
            try {
                const postId = getPostId(article);
                const postText = (article.innerText || '').substring(0, 80);

                // SKIP: Bài viết đã xử lý
                if (processedPostIds.has(postId)) {
                    log('warn', 'Post already processed', postId.substring(0, 20));
                    skippedCount++;
                    continue;
                }

                // CHECK RATE LIMIT
                if (isRateLimited()) {
                    log('warn', `Rate limit reached (${reactionsThisHour}/${currentSettings.maxReactionsPerHour || 30}/hour)`);
                    limitedCount++;
                    totalSkippedDueToLimit++;
                    continue;
                }

                const textContent = article.innerText.toLowerCase();
                processedCount++;
                
                // DEBUG: Log article being processed
                log('debug', `[Article ${processedCount}] Processing:`, postText);
                log('debug', `Structure: toolbars=${article.querySelectorAll('[role="toolbar"]').length}, buttons=${article.querySelectorAll('button').length}`);


                // Lọc Group & Fanpage theo cấu hình
                if (currentSettings.ignoreGroup) {
                    const hasGroupLink = Array.from(article.querySelectorAll('a')).some(a => {
                        const href = a.getAttribute('href') || '';
                        return href.includes('/groups/');
                    });
                    if (hasGroupLink) {
                        log('warn', 'Skipping: Group post', postText);
                        await addActivityLog('skipped', postText + ' (Nhóm)', '');
                        skippedCount++;
                        continue;
                    }
                }

                if (currentSettings.ignoreFanpage) {
                    const hasPageLink = Array.from(article.querySelectorAll('a')).some(a => {
                        const href = a.getAttribute('href') || '';
                        return href.includes('/pages/') || href.includes('/permalink.php');
                    });
                    const hasFollowBtn = Array.from(article.querySelectorAll('button, [role="button"]')).some(b => {
                        const label = b.getAttribute('aria-label') || '';
                        return label.includes('Theo dõi') || label.includes('Follow');
                    });
                    if (hasPageLink || hasFollowBtn) {
                        log('warn', 'Skipping: Fanpage post', postText);
                        await addActivityLog('skipped', postText + ' (Trang)', '');
                        skippedCount++;
                        continue;
                    }
                }

                // FILTER LOGIC: Lọc nội dung bài viết
                let shouldReact = true;
                let skipReason = '';

                if (currentSettings?.contentFilter?.enabled !== false) {
                    if (currentSettings?.contentFilter?.avoidPolitics && POLITICS_KEYWORDS.some(w => textContent.includes(w))) {
                        shouldReact = false;
                        skipReason = 'Politics';
                    }
                    else if (currentSettings?.contentFilter?.avoidControversial && CONTROVERSIAL_KEYWORDS.some(w => textContent.includes(w))) {
                        shouldReact = false;
                        skipReason = 'Controversial';
                    }
                    else if (currentSettings?.contentFilter?.avoidAds && ADS_KEYWORDS.some(w => textContent.includes(w))) {
                        shouldReact = false;
                        skipReason = 'Ads';
                    }
                }

                if (!shouldReact) {
                    log('warn', `Skipping: ${skipReason}`, textContent.substring(0, 50));
                    await addActivityLog('skipped', textContent, '');
                    skippedCount++;
                    continue;
                }

                // FIND LIKE BUTTON: Tìm nút Like
                log('info', 'Searching for like button...');
                const likeBtn = findLikeButton(article);
                if (!likeBtn) {
                    log('warn', 'Like button not found for this post');
                    skippedCount++;
                    continue;
                }

                if (likeBtn === 'already_reacted') {
                    processedPostIds.add(postId);
                    skippedCount++;
                    continue;
                }

                // CHECK VISIBILITY: Kiểm tra bài viết có hiện trên màn hình
                let rect = likeBtn.getBoundingClientRect();
                if (rect.top < 0 || rect.bottom > window.innerHeight) {
                    // Thử scroll vào view
                    log('info', 'Post not visible, attempting to scroll into view');
                    likeBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await sleep(1000);  // Wait for scroll
                    rect = likeBtn.getBoundingClientRect();
                    
                    if (rect.top < 0 || rect.bottom > window.innerHeight) {
                        log('warn', 'Post still not visible after scroll, skipping');
                        skippedCount++;
                        continue;
                    }
                }

                // DETERMINE REACTION: Quyết định loại cảm xúc nào
                const reaction = determineReaction(textContent);
                log('info', `Post detected: ${reaction}`, textContent.substring(0, 40));

                // PERFORM REACTION: Thực hiện cảm xúc
                const success = await performReaction(likeBtn, reaction);

                if (success) {
                    reactedCount++;
                    reactionsThisHour++;  // ← INCREMENT HOUR COUNTER
                    processedPostIds.add(postId);  // ← Mark as processed
                    log('success', `Reaction added: ${reaction}`);
                    await addActivityLog('success', textContent, reaction);

                    // SMART DELAY: Delay random để tránh spam detection
                    await smartDelay();
                } else {
                    skippedCount++;
                    log('error', 'Failed to add reaction');
                    await addActivityLog('error', textContent, reaction);
                }

            } catch (err) {
                log('error', 'Error processing post', err.message);
                await addActivityLog('error', err.message, '');
                skippedCount++;
            }
        }

        // UPDATE STATS
        const currentStats = await safeStorageGet(['postsProcessed', 'reactionsAdded', 'postsSkipped'], {});
        const newStats = {
            postsProcessed: (currentStats.postsProcessed || 0) + processedCount,
            reactionsAdded: (currentStats.reactionsAdded || 0) + reactedCount,
            postsSkipped: (currentStats.postsSkipped || 0) + skippedCount
        };
        await safeStorageSet(newStats);

        // Track metrics for performance dashboard
        await trackMetrics('reacted', reactedCount);
        await trackMetrics('skipped', skippedCount);
        await trackMetrics('scans', 1);

        log('success', `Scan complete: ${processedCount} processed, ${reactedCount} reacted, ${skippedCount} skipped, ${limitedCount} rate-limited`);

    } catch (err) {
        log('error', 'Critical scan error', err.message);
    } finally {
        isScanRunning = false;
    }
}

// ===== HELPER: Find Like Button =====
function findLikeButton(article) {
    // SKIP: Loading state articles
    if (article.querySelector('[aria-label="Đang tải..."]')) {
        log('warn', 'Skipping loading state article');
        return null;
    }

    const toolbarCount = article.querySelectorAll('[role="toolbar"]').length;
    const buttonCount = article.querySelectorAll('button').length;
    const interactiveCount = article.querySelectorAll('[role="button"], button, [role="menuitem"]').length;
    
    log('info', `Article structure: ${toolbarCount} toolbars, ${buttonCount} buttons, ${interactiveCount} interactive elements`);

    // Lọc bỏ các button nằm trong comment con (các comment con có role="article") của bài viết này
    const allButtonsInArticle = Array.from(article.querySelectorAll('button, [role="button"]')).filter(btn => {
        let parent = btn.parentElement;
        while (parent && parent !== article) {
            if (parent.getAttribute('role') === 'article') {
                return false; // Button này thuộc về một comment con, bỏ qua!
            }
            parent = parent.parentElement;
        }
        return true;
    });

    // 1. Kiểm tra xem bài viết chính đã được react chưa
    for (const btn of allButtonsInArticle) {
        const label = btn.getAttribute('aria-label') || '';
        if (
            label === 'Gỡ Thích' || 
            label === 'Unlike' || 
            label.startsWith('Gỡ ') || 
            label.startsWith('Remove ') ||
            label.includes('Press Enter to remove')
        ) {
            log('info', 'Post already has reaction, skipping: ' + label);
            return 'already_reacted';
        }
    }

    // 2. Tìm nút Like của bài viết chính (chỉ tìm trong allButtonsInArticle đã lọc sạch)
    // Ưu tiên nút có aria-label là "Thích" hoặc "Like"
    let likeBtn = allButtonsInArticle.find(btn => {
        const label = btn.getAttribute('aria-label') || '';
        return label === 'Thích' || label === 'Like';
    });

    if (likeBtn) {
        log('success', 'Found primary like button');
        return likeBtn;
    }

    // Fallback: Tìm nút có aria-label chứa "Thích" hoặc "Like"
    likeBtn = allButtonsInArticle.find(btn => {
        const label = (btn.getAttribute('aria-label') || '').toLowerCase();
        return label.includes('thích') || label.includes('like');
    });

    if (likeBtn) {
        log('success', 'Found primary like button (fuzzy match)');
        return likeBtn;
    }

    // Last resort: chọn button đầu tiên trong toolbar chính của bài viết
    const toolbars = Array.from(article.querySelectorAll('[role="toolbar"]')).filter(tb => {
        let parent = tb.parentElement;
        while (parent && parent !== article) {
            if (parent.getAttribute('role') === 'article') return false;
            parent = parent.parentElement;
        }
        return true;
    });

    if (toolbars.length > 0) {
        const firstBtn = toolbars[0].querySelector('button, [role="button"]');
        if (firstBtn) {
            log('success', 'Found like button from main toolbar fallback');
            return firstBtn;
        }
    }

    // Error: Could not find like button
    log('error', 'Like button not found!', `Toolbars: ${toolbarCount}, Buttons: ${buttonCount}, Interactive: ${interactiveCount}`);
    return null;
}

// ===== HELPER: Determine Reaction Type =====
function determineReaction(textContent) {
    const reactionType = currentSettings?.reactionType || 'auto';

    // Mode: User chọn cố định
    if (reactionType !== 'auto') {
        return reactionType;  // Return 'love', 'haha', 'care', etc.
    }

    // Mode: Auto (phân tích nội dung)
    if (POSITIVE_KEYWORDS.some(w => textContent.includes(w))) {
        return 'love';
    }
    if (FUNNY_KEYWORDS.some(w => textContent.includes(w))) {
        return 'haha';
    }

    return 'like';  // Default
}

// ===== HELPER: Perform Reaction =====
async function performReaction(likeBtn, reactionType) {
    try {
        log('info', `Attempting reaction: ${reactionType}`);

        // Nếu Like → Click trực tiếp
        if (reactionType === 'like') {
            log('info', 'Executing Like reaction');
            likeBtn.click();
            await sleep(500);
            return true;
        }

        // Nếu reaction khác → Mở popup rồi click
        // Scroll vào vị trí
        log('info', 'Scrolling to like button');
        likeBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await sleep(800);

        // Trigger hover để hiện popup reaction
        log('info', 'Triggering hover to show reaction popup');
        likeBtn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, view: window }));
        await sleep(1200);  // Đợi popup hiện

        // Thử tìm button reaction trong popup
        const reactionBtn = findReactionButton(reactionType);

        if (reactionBtn) {
            log('info', `Clicking ${reactionType} button in popup`);
            reactionBtn.click();
            await sleep(500);
            return true;
        } else {
            log('warn', `${reactionType} button not found, falling back to Like`);
            likeBtn.click();  // Fallback về Like
            await sleep(500);
            return true;
        }

    } catch (err) {
        log('error', 'Error during reaction', err.message);
        return false;
    }
}

// ===== HELPER: Find Reaction Button =====
function findReactionButton(reactionType) {
    const reactionMap = REACTION_LABELS[reactionType];
    if (!reactionMap) {
        log('error', `Unknown reaction type: ${reactionType}`);
        return null;
    }

    // Cách 1: Tìm aria-label Việt Nam
    let btn = document.querySelector(`[aria-label="${reactionMap.vi}"]`);
    if (btn) {
        log('info', `Found reaction button (Vietnamese): ${reactionMap.vi}`);
        return btn;
    }

    // Cách 2: Tìm aria-label English
    btn = document.querySelector(`[aria-label="${reactionMap.en}"]`);
    if (btn) {
        log('info', `Found reaction button (English): ${reactionMap.en}`);
        return btn;
    }

    // Cách 3: Tìm title attribute
    btn = document.querySelector(`[title="${reactionMap.vi}"], [title="${reactionMap.en}"]`);
    if (btn) {
        log('info', `Found reaction button (title)`);
        return btn;
    }

    // Cách 4: Tìm data-testid
    btn = document.querySelector(`[data-testid*="${reactionType}"]`);
    if (btn) {
        log('info', `Found reaction button (data-testid)`);
        return btn;
    }

    // Cách 5: Generic search - tìm các button gần cursor vị trí Like button
    const allButtons = document.querySelectorAll('button, [role="button"]');
    for (const b of allButtons) {
        const label = (b.innerHTML + b.getAttribute('aria-label') || '').toLowerCase();
        if (label.includes(reactionType.toLowerCase())) {
            log('info', `Found reaction button (generic search)`);
            return b;
        }
    }

    log('warn', `Reaction button (${reactionType}) not found, will fallback to Like`);
    return null;
}
