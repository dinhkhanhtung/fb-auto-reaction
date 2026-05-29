# 🐛 Debug Guide - Smart Auto Reaction

## Vấn đề: Extension không thả cảm xúc

### ✅ Đã sửa!

**Vấn đề**: Logic `scanAndReact` đang ở background.js và được inject vào page, điều này không hoạt động trong Manifest V3.

**Giải pháp**: Di chuyển toàn bộ logic sang `content.js` và sử dụng message passing.

---

## 🔍 Cách kiểm tra extension hoạt động

### Bước 1: Reload Extension

1. Vào `chrome://extensions/`
2. Tìm "Smart Auto Reaction for FB"
3. Click nút **Reload** (icon mũi tên tròn)
4. Kiểm tra không có lỗi

### Bước 2: Mở Facebook

1. Mở tab mới
2. Vào `https://www.facebook.com`
3. Đăng nhập nếu chưa
4. Vào trang chủ (News Feed)

### Bước 3: Mở Console để debug

**Trong tab Facebook:**
1. Nhấn `F12` để mở DevTools
2. Chọn tab **Console**
3. Bạn sẽ thấy log: `Smart Auto Reaction content script loaded`
4. Nếu thấy log này → Content script đã load thành công ✅

**Trong Background Service Worker:**
1. Vào `chrome://extensions/`
2. Tìm extension, click **service worker**
3. Console sẽ mở ra
4. Bạn sẽ thấy: `Smart Auto Reaction for FB - Background service worker loaded`

### Bước 4: Test thủ công

**Mở popup extension và click "Bắt đầu":**

Trong Console tab Facebook, bạn sẽ thấy:
```
Smart Auto Reaction: Scanning newsfeed...
Found X posts
Post 0 text preview: ...
Post X has Y reactions
Adding like reaction to post 123456789
✅ Added like reaction to post 123456789
📊 Summary: 5 processed, 3 reacted, 2 skipped
```

Trong Background Service Worker console:
```
Processing newsfeed...
Found 1 Facebook tab(s)
Content script response: {success: true, processed: 5, reacted: 3, skipped: 2}
```

### Bước 5: Kiểm tra Settings

1. Mở popup extension
2. Click icon Settings (bánh răng)
3. Kiểm tra các settings:
   - ✅ Bật bộ lọc AI
   - ✅ Tránh chính trị
   - ✅ Tránh tranh cãi
   - ✅ Tránh quảng cáo
   - ⏱️ Khoảng thời gian: 5 phút
   - 🎯 Loại cảm xúc: Tự động

4. Click "Lưu cài đặt"
5. Bạn sẽ thấy notification "Đã lưu cài đặt!"

---

## 🔧 Troubleshooting

### ❌ Không thấy log "content script loaded"

**Nguyên nhân**: Content script chưa được inject

**Giải pháp**:
1. Reload extension
2. Đóng và mở lại tab Facebook
3. Kiểm tra `manifest.json` có đúng:
```json
"content_scripts": [
  {
    "matches": ["*://*.facebook.com/*"],
    "js": ["content.js"],
    "run_at": "document_idle"
  }
]
```

### ❌ Không tìm thấy posts

**Nguyên nhân**: Facebook đã thay đổi cấu trúc HTML

**Giải pháp**: Kiểm tra selector
```javascript
// Trong Console tab Facebook
document.querySelectorAll('[role="article"]').length
// Nếu = 0 → Facebook đã thay đổi cấu trúc
```

### ❌ Không click được nút reaction

**Nguyên nhân**: Selector không đúng

**Kiểm tra**:
```javascript
// Trong Console tab Facebook
const post = document.querySelector('[role="article"]');
const btn = post.querySelector('[aria-label*="Like"]') || 
            post.querySelector('[aria-label*="Thích"]');
console.log(btn); // Phải có giá trị
```

### ❌ Extension không chạy tự động

**Kiểm tra**:
1. Mở popup
2. Xem status badge có màu xanh không?
3. Nếu không → Click "Bắt đầu"
4. Kiểm tra alarm:
```javascript
// Trong Background Service Worker console
chrome.alarms.getAll().then(console.log)
// Phải có alarm tên "autoReaction"
```

---

## 📊 Test Cases

### Test 1: Thả cảm xúc vào bài bình thường

1. Scroll newsfeed tìm bài bình thường (không chính trị, không quảng cáo)
2. Bài phải có ≥ 10 reactions
3. Click "Bắt đầu" trong popup
4. Đợi 1-2 giây
5. Kiểm tra: Bài đã có reaction từ bạn ✅

### Test 2: Bỏ qua bài chính trị

1. Tìm bài có từ "chính trị", "politics", "government"
2. Click "Bắt đầu"
3. Kiểm tra Console: `Skipping unsafe post: Political content detected`
4. Bài không được thả reaction ✅

### Test 3: Bỏ qua bài quảng cáo

1. Tìm bài có từ "mua ngay", "sale", "inbox"
2. Click "Bắt đầu"
3. Kiểm tra Console: `Skipping unsafe post: Advertisement detected`
4. Bài không được thả reaction ✅

### Test 4: Bỏ qua bài đã thả

1. Thả reaction thủ công vào 1 bài
2. Click "Bắt đầu"
3. Kiểm tra Console: `Already reacted to post XXX`
4. Không thả lại ✅

### Test 5: Blacklist

1. Thêm UID vào blacklist
2. Tìm bài của user đó
3. Click "Bắt đầu"
4. Kiểm tra Console: `Skipping blacklisted user: XXX`
5. Bài không được thả reaction ✅

---

## 🎯 Expected Behavior

### Khi click "Bắt đầu":

1. Status badge chuyển sang màu xanh
2. Nút chuyển thành "Dừng lại" (màu đỏ)
3. Alarm được tạo với interval = timePeriod
4. Sau 1 phút, extension bắt đầu scan
5. Mỗi lần scan:
   - Tìm tất cả posts
   - Lọc bỏ posts không phù hợp
   - Thả reaction vào posts an toàn
   - Cập nhật thống kê

### Logs mong đợi:

**Background:**
```
Processing newsfeed...
Found 1 Facebook tab(s)
Content script response: {success: true, processed: 10, reacted: 7, skipped: 3}
```

**Content Script:**
```
Smart Auto Reaction: Scanning newsfeed...
Found 15 posts
Post 0 text preview: Hello everyone...
Post 123456789 has 25 reactions
Adding like reaction to post 123456789
✅ Added like reaction to post 123456789
Skipping unsafe post: Political content detected
Skipping unsafe post: Advertisement detected
📊 Summary: 10 processed, 7 reacted, 3 skipped
```

---

## 🚀 Quick Test

**Test nhanh trong Console tab Facebook:**

```javascript
// Gọi trực tiếp function scanAndReact
chrome.runtime.sendMessage({
  action: 'scanAndReact',
  settings: {
    ignoreFanpage: false,
    ignoreGroup: false,
    blacklist: [],
    contentFilter: {
      enabled: true,
      avoidPolitics: true,
      avoidControversial: true,
      avoidAds: true
    },
    reactionType: 'like'
  }
}, (response) => {
  console.log('Response:', response);
});
```

**Kết quả mong đợi:**
```
Response: {success: true, processed: 5, reacted: 3, skipped: 2}
```

---

## ✅ Checklist

- [ ] Extension đã reload
- [ ] Tab Facebook đã mở
- [ ] Console hiển thị "content script loaded"
- [ ] Click "Bắt đầu" thành công
- [ ] Status badge màu xanh
- [ ] Logs hiển thị trong Console
- [ ] Reactions được thả thành công
- [ ] Bộ lọc AI hoạt động
- [ ] Thống kê cập nhật

---

**Nếu tất cả đều ✅ → Extension hoạt động hoàn hảo! 🎉**
