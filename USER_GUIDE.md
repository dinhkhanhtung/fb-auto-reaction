# 📖 Smart Auto Reaction for FB - User Guide

## 🎯 Giới Thiệu

**Smart Auto Reaction (SAR)** là một Chrome Extension thông minh giúp bạn tự động thả cảm xúc lên các bài viết Facebook với các tính năng an ninh cao cấp.

### ✨ Đặc Điểm Chính
- ✅ **Tự động phát hiện bài viết** - Quét feed Facebook tự động
- ✅ **Thả cảm xúc thông minh** - Phân tích nội dung để chọn cảm xúc phù hợp
- ✅ **Lọc nội dung** - Tránh chính trị, tranh cãi, quảng cáo
- ✅ **An niền cao** - Rate limiting, smart delays, lịch hoạt động
- ✅ **Dashboard thực tế** - Theo dõi hoạt động hàng ngày
- ✅ **Hỗ trợ tiếng Việt** - Giao diện 100% tiếng Việt

---

## 🚀 Cài Đặt & Khởi Động

### Bước 1: Cài Đặt Extension
1. Tải file extension (`.crx` hoặc thư mục)
2. Mở `chrome://extensions`
3. Bật **"Developer mode"** (góc trên bên phải)
4. Chọn **"Load unpacked"** và chọn thư mục extension
5. Extension sẽ xuất hiện trong danh sách

### Bước 2: Mở Popup SAR
1. Nhấp vào icon SAR trên thanh công cụ Chrome
2. Thấy màn hình chính với nút bật/tắt

### Bước 3: Bật Lên
1. Click nút **Power Button** (tròn xanh ở giữa)
2. Hãy chắc bạn đang ở trang Facebook
3. Extension sẽ bắt đầu quét và thả cảm xúc

---

## ⚙️ Cài Đặt Chi Tiết

### 📌 Thị Trường Chính

#### **Cài Đặt Chung**
- **Tự khởi động**: Tự bật extension khi khởi động Chrome
- **Tần suất (phút)**: Quét feed bao lâu một lần (mặc định: 5 phút)

#### **Bộ Lọc AI**
- **Bật bộ lọc**: Bật/tắt tất cả bộ lọc
- **Tránh chính trị**: Bỏ qua các bài về chính trị
- **Tránh tranh cãi**: Bỏ qua drama, phốt, tai nạn...
- **Tránh quảng cáo**: Bỏ qua quảng cáo, khuyến mãi

#### **Cảm Xúc Thả**
Chọn loại cảm xúc tự động:
- **🤖 Auto** (mặc định): Phân tích nội dung tự động
  - Nội dung tích cực → ❤️ Yêu thích
  - Nội dung hài hước → 😆 Haha
  - Mặc định → 👍 Thích
- **👍 Like**: Luôn thả Like
- **❤️ Love, 🤗 Care, 😆 Haha**: Chọn cảm xúc cụ thể

### 🛡️ An Niệm Nâng Cao

#### **Rate Limiting**
- **Tối đa cảm xúc/giờ**: Mặc định 30, tối đa 100
- Giới hạn này ngăn chặn ban từ Facebook
- Reset tự động mỗi giờ

#### **Smart Delay**
- **Bật Smart Delay**: Bật chế độ delay thông minh
- Delay random 5-8 giây giữa các cảm xúc
- Tăng delay vào giờ cao điểm (10-12h, 18-20h)
- Mỗi 10 cảm xúc: Tạm dừng 1-2 phút

#### **Lịch Hoạt Động**
- **Bật lịch hoạt động**: Chỉ chạy trong khung giờ được phép
- **Giờ bắt đầu/kết thúc**: Ví dụ 09:00 - 23:00

---

## 📊 Dashboard & Thống Kê

### Trên Popup Chính
- **Đã xử lý**: Tổng bài viết đã xử lý
- **Cảm xúc**: Tổng cảm xúc đã thả
- **Bỏ qua**: Tổng bài bị bỏ qua

### Dashboard Hôm Nay
- **Cảm xúc**: Cảm xúc thả trong hôm nay
- **Quét**: Số lần quét feed hôm nay
- **Lỗi**: Số lỗi gặp phải

### Nhật Ký Hoạt Động
- Danh sách 50 bài viết gần nhất
- Hiển thị thời gian, trạng thái, nội dung, cảm xúc
- Các trạng thái:
  - ✅ **success** - Cảm xúc đã thả
  - ⏭️ **skipped** - Bài bị bỏ qua (filter, rate limit)
  - ❌ **error** - Lỗi xảy ra

---

## 🐛 Gỡi Lỗi & Khắc Phục

### Vấn Đề: Extension không quét bất cứ bài nào
**Nguyên nhân**:
- chưa cài đặt đúng
- Chưa bật extension
- Chưa ở trang Facebook

**Giải pháp**:
1. Kiểm tra icon extension đã xuất hiện? (sẽ tất trên thanh công cụ)
2. Bật Power Button (nhất yêu cầu)
3. Đảm bảo đang ở `facebook.com`
4. Reload trang Facebook (Ctrl+R, F5)
5. Mở F12 → Console → Cái các log từ `[SAR]`

### Vấn Đề: Quét nhưng không thả cảm xúc
**Nguyên nhân**:
- Nút Like bị ẩn
- Bị đạt đến rate limit
- Bộ lọc chặn quá nhiều bài

**Giải pháp**:
1. Kiểm tra logs trong Console
2. Tăng **Tối đa cảm xúc/giờ** lên (30 → 50 → 100)
3. Tắt bộ lọc tạm thời để test
4. Reload extension từ `chrome://extensions`

### Vấn Đề: Bị Facebook báo lỗi hoặc chặn
**Nguyên nhân**:
- Rate limit quá cao
- Smart Delay tắt
- Quét quá nhanh

**Giải pháp**:
```
1. Giảm "Tối đa cảm xúc/giờ" xuống 20-25
2. Bật "Smart Delay"
3. Tăng "Tần suất" lên 10 phút
4. Tắt extension một hôm để reset
```

---

## 🔍 Console Logs Là Gì?

### Cách mở Console
1. Vào Facebook
2. Nhấn **F12** hoặc **Ctrl+Shift+I**
3. Chọn tab **Console**
4. Tìm logs bắt đầu bằng `[SAR]`

### Ý Nghĩa Các Log

#### ✅ [SAR] [success] ...
Cảm xúc thả thành công

#### ℹ️ [SAR] [info] ...
Thông tin về hoạt động

#### ⚠️ [SAR] [warn] ...
Cảnh báo (bài bị filter, limit rate)

#### ❌ [SAR] [error] ...  
Lỗi (không tìm nút, xảy ra ngoại lệ)

#### 🔵 [SAR] [debug] ...
Debug info (cấu trúc DOM, số button tìm được)

---

## 💡 Tips & Tricks

### Tối Ưu Hóa Hiệu Suất
```
1. Để tần suất 5-10 phút (cân bằng giữa responsiveness & safety)
2. Bật Smart Delay lúc nào cũng
3. Rate limit mặc định (30/hour) là an toàn nhất
4. Bật lịch hoạt động: 09:00-23:00
```

### Chọn Cảm Xúc
```
• Auto Mode tốt nhất - Facebook thấy tự nhiên
• Fixed Mode nếu muốn cụ thể
• Tránh Love/Care quá nhiều - dễ bị nghi
```

### Tránh Bị Ban
```
1. Luôn dùng Smart Delay
2. Giữ rate limit ≤ 30/hour
3. Bật schedule (9h-23h)
4. Không 24/7 chạy
5. Dùng ngoài giờ cao điểm (không 10-12h, 18-20h)
6. Reset extension 1-2 ngày một lần
```

---

## 📞 Support & Feedback

### Báo Cáo Lỗi
Nếu gặp lỗi:
1. Ghi lại logs từ Console
2. Nêu các bước tái hiện
3. Nói rõ cấu hình hiện tại
4. Liên hệ phát triển viên

### Yêu Cầu Tính Năng
Các tính năng sắp tới:
- [ ] Lưu preset cấu hình
- [ ] Thống kê bằng biểu đồ
- [ ] Hỗ trợ Instagram/TikTok (có thể)
- [ ] Chế độ học máy (AI improvement)

---

## ⚖️ Tuyên Bố Pháp Lý

⚠️ **Lưu Ý Quan Trọng**:
- Extension này **không liên kết với Facebook**
- Sử dụng extension **có thể vi phạm Điều Khoản Dịch Vụ Facebook**
- Tác giả không chịu trách nhiệm cho các tài khoản bị ban
- **Sử dụng có trách nhiệm**

---

## 🎉 Chúc Mừng!

Bạn đã hoàn thành hướng dẫn. Bây giờ:
1. ✅ Cấu hình phù hợp
2. ✅ Bật extension
3. ✅ Trở về Facebook
4. ✅ Xem extension hoạt động!

**Cảm ơn đã sử dụng Smart Auto Reaction!** 🚀

---

*Version: v2.0.0*  
*Last updated: 12/02/2026*  
*Language: 🇻🇳 Tiếng Việt*
