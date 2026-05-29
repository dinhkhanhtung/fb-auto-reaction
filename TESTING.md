# Hướng dẫn Test Extension

## 🧪 Các bước test

### 1. Load Extension vào Chrome

```
1. Mở Chrome/Edge
2. Vào chrome://extensions/
3. Bật "Developer mode" (góc trên bên phải)
4. Click "Load unpacked"
5. Chọn thư mục: d:\Dev\Projects\Smart Auto Reaction for FB
```

### 2. Kiểm tra Extension đã load thành công

- ✅ Icon extension xuất hiện trên thanh công cụ
- ✅ Click vào icon, popup hiển thị đúng
- ✅ Không có lỗi trong Console (F12 > Console)

### 3. Test các tính năng

#### A. Test Popup UI
- [ ] Mở popup, kiểm tra giao diện hiển thị đẹp
- [ ] Click nút Settings, chuyển sang trang cài đặt
- [ ] Click nút Back, quay lại trang chính
- [ ] Kiểm tra badge "Premium Unlocked" hiển thị

#### B. Test Settings
- [ ] Bật/tắt các toggle switches
- [ ] Thay đổi khoảng thời gian (1-60 phút)
- [ ] Nhập blacklist UIDs
- [ ] Chọn loại cảm xúc khác nhau
- [ ] Click "Lưu cài đặt" - hiển thị thông báo thành công

#### C. Test Auto Reaction
1. Mở Facebook trong tab mới
2. Đăng nhập vào tài khoản
3. Vào trang chủ (News Feed)
4. Mở popup extension
5. Click "Bắt đầu"
6. Đợi 1-2 phút
7. Kiểm tra:
   - [ ] Status badge chuyển sang "Đang chạy" (màu xanh)
   - [ ] Nút chuyển thành "Dừng lại" (màu đỏ)
   - [ ] Thống kê cập nhật (số bài đã xử lý)

#### D. Test Content Filter
1. Bật tất cả bộ lọc AI
2. Scroll newsfeed, tìm bài viết:
   - Bài chính trị → Không thả cảm xúc ✅
   - Bài quảng cáo → Không thả cảm xúc ✅
   - Bài bình thường → Thả cảm xúc ✅
3. Kiểm tra Console log để xem lý do bỏ qua

#### E. Test Blacklist
1. Thêm UID vào blacklist
2. Tìm bài viết của user đó
3. Kiểm tra không thả cảm xúc vào bài của user trong blacklist

### 4. Kiểm tra Console Logs

Mở Console (F12) và kiểm tra:

```javascript
// Background service worker logs
Smart Auto Reaction for FB - Background service worker loaded
Scanning newsfeed...
Found X posts
Added like reaction to post 123456789
Skipping unsafe post: Political content detected

// Content script logs
Smart Auto Reaction content script loaded
```

### 5. Kiểm tra Storage

Mở DevTools > Application > Storage > Local Storage:

```javascript
{
  "startup": true/false,
  "ignoreFanpage": true/false,
  "ignoreGroup": true/false,
  "timePeriod": 5,
  "blacklist": ["123", "456"],
  "contentFilter": {
    "enabled": true,
    "avoidPolitics": true,
    "avoidControversial": true,
    "avoidAds": true
  },
  "reactionType": "auto",
  "isPremium": true,
  "premiumExpiry": <timestamp>
}
```

## 🐛 Debug

### Nếu extension không load:
1. Kiểm tra manifest.json có lỗi syntax không
2. Xem Console trong chrome://extensions/
3. Click "Errors" để xem chi tiết

### Nếu không thả được cảm xúc:
1. Mở Console trong tab Facebook
2. Xem log "Smart Auto Reaction: Scanning newsfeed..."
3. Kiểm tra lý do bỏ qua bài viết

### Nếu popup không hiển thị:
1. Reload extension
2. Kiểm tra popup.html có lỗi không
3. Xem Console trong popup (Right-click popup > Inspect)

## ✅ Checklist hoàn chỉnh

- [ ] Extension load thành công
- [ ] Popup hiển thị đẹp, không lỗi
- [ ] Settings lưu và load đúng
- [ ] Bắt đầu/Dừng hoạt động
- [ ] Thả cảm xúc tự động
- [ ] Bộ lọc AI hoạt động
- [ ] Blacklist hoạt động
- [ ] Thống kê cập nhật đúng
- [ ] Không có lỗi trong Console

## 📊 Kết quả mong đợi

Sau khi chạy 5-10 phút:
- ✅ Đã thả cảm xúc vào 10-20 bài viết
- ✅ Bỏ qua bài viết không phù hợp
- ✅ Không có lỗi checkpoint từ Facebook
- ✅ Thống kê hiển thị chính xác

## 🎯 Tips

1. **Lần đầu test**: Đặt khoảng thời gian ngắn (1-2 phút) để test nhanh
2. **Kiểm tra an toàn**: Bật tất cả bộ lọc AI
3. **Monitor**: Mở Console để theo dõi hoạt động
4. **Patience**: Đợi ít nhất 1 chu kỳ để thấy kết quả

---

**Good luck! 🚀**
