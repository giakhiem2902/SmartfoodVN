# Admin Panel - SmartFood

## 📊 Giới Thiệu

Admin Panel là công cụ quản lý toàn diện cho nền tảng SmartFood. Nó cho phép quản trị viên quản lý người dùng, thực phẩm, đơn hàng, cửa hàng, và xem thống kê chi tiết.

## 🎯 Tính Năng Chính

### 1. **Dashboard** 📈
- Thống kê tổng quan về Users, Orders, Doanh Thu, Drivers
- Biểu đồ Orders & Doanh Thu (7 ngày)
- Tỷ lệ trạng thái Orders (Completed, Pending, Cancelled)
- Danh sách đơn hàng gần đây

### 2. **Thống Kê Chi Tiết** 📊
- Biểu đồ tuyến tính Orders vs Doanh Thu
- Biểu đồ Area về Users vs Drivers
- Top 5 Foods bán chạy nhất
- Top Stores xuất sắc
- Lọc theo khoảng thời gian (7 ngày, 30 ngày, 90 ngày, Tất cả)

### 3. **Quản Lý Users** 👥
- Xem danh sách tất cả người dùng
- Tìm kiếm người dùng theo tên/email
- Lọc theo Role (Customer, Driver, Store Owner, Admin)
- Thêm/Sửa/Xóa user
- Quản lý trạng thái (Active, Inactive, Banned)
- Xem số đơn hàng của mỗi user

### 4. **Quản Lý Foods** 🍜
- Xem danh sách tất cả món ăn
- Tìm kiếm foods
- Lọc theo danh mục và cửa hàng
- Upload/Thay đổi hình ảnh
- Quản lý giá, trạng thái Hot
- Sắp xếp theo giá, rating
- Thêm/Sửa/Xóa foods

### 5. **Quản Lý Orders** 📦
- Xem tất cả đơn hàng với trạng thái
- Tìm kiếm order theo ID/Khách hàng/Cửa hàng
- Lọc theo trạng thái (Pending, Confirmed, Delivering, Completed, Cancelled)
- Cập nhật trạng thái đơn hàng
- Xem chi tiết từng đơn hàng
- Thống kê: Tổng orders, Hoàn thành, Chờ, Hủy

### 6. **Quản Lý Stores** 🏪
- Xem danh sách cửa hàng
- Thêm/Sửa/Xóa cửa hàng
- Quản lý thông tin chủ cửa hàng, địa chỉ, SĐT
- Lọc theo thành phố
- Xem rating, số reviews, số foods
- Theo dõi thời gian giao hàng trung bình

### 7. **Quản Lý Categories** 🏷️
- Xem danh sách danh mục
- Thêm/Sửa/Xóa danh mục
- Quản lý emoji icon cho danh mục
- Upload hình ảnh danh mục
- Xem số foods trong mỗi danh mục
- Lọc theo trạng thái Active/Inactive

### 8. **Cài Đặt Hệ Thống** ⚙️

#### Cài Đặt Chung
- Tên ứng dụng
- Tagline
- Ngôn ngữ (Tiếng Việt, English, 中文)
- Timezone
- Thông báo (Email, SMS)

#### Bảo Mật
- Two-Factor Authentication
- Hết hạn mật khẩu (ngày)
- Timeout phiên (phút)
- IP Whitelist
- HTTPS yêu cầu
- Đổi mật khẩu admin

#### Giao Diện
- Chủ đề (Sáng, Tối, Tự động)
- Màu sắc chính
- Chế độ Compact

### **Thông Tin Hệ Thống**
- Phiên bản
- Database
- Server
- Trạng thái

## 🔌 Sidebar Navigation

Sidebar được thiết kế thân thiện:
- 🎨 Gradient background (Purple theme)
- ✨ Smooth animations khi hover
- 📱 Responsive - Drawer menu trên mobile
- 🎯 Active state highlighting
- 🔄 Có thể collapse/expand

Menu items:
- Dashboard
- Thống Kê
- Quản Lý Users
- Quản Lý Foods
- Quản Lý Orders
- Quản Lý Stores
- Quản Lý Categories
- Cài Đặt

## 🎨 Giao Diện & Styling

### Màu Sắc
- **Primary**: `#667eea` (Purple)
- **Secondary**: `#764ba2` (Dark Purple)
- **Success**: `#52c41a` (Green)
- **Warning**: `#faad14` (Orange)
- **Error**: `#f5222d` (Red)
- **Background**: `#f5f7fa` (Light Gray)

### Typography
- **Heading**: Bold, 18-20px
- **Body**: Regular, 14px
- **Small**: Regular, 12px

### Components
- Cards với shadow & border
- Tables với alternating rows
- Buttons với gradient & hover effects
- Forms với validation
- Tags & Badges
- Modals & Popconfirm
- Uploads với drag & drop
- Charts (Recharts)

## 📝 Cách Sử Dụng

### Truy Cập Admin Panel
```
URL: http://localhost:3000/admin/dashboard
Yêu cầu: Phải có role = 'admin'
```

### Đăng Nhập
1. Truy cập trang Login
2. Nhập email/SĐT và mật khẩu admin
3. Nếu có 2FA, nhập OTP
4. Sẽ tự điều hướng đến Dashboard

### Quản Lý Người Dùng
1. Vào "Quản Lý Users"
2. Tìm kiếm hoặc lọc user
3. Nhấp "Thêm User" hoặc Edit/Delete icon
4. Điền thông tin và lưu

### Quản Lý Foods
1. Vào "Quản Lý Foods"
2. Tìm kiếm food
3. Click "Thêm Food" hoặc Edit
4. Chọn danh mục, cửa hàng, giá
5. Upload hình ảnh
6. Lưu

### Cập Nhật Orders
1. Vào "Quản Lý Orders"
2. Tìm order cần cập nhật
3. Click icon preview để xem chi tiết
4. Chọn status mới từ dropdown
5. Status sẽ cập nhật tự động

### Xem Thống Kê
1. Vào "Thống Kê"
2. Chọn khoảng thời gian từ dropdown
3. Xem biểu đồ Orders, Revenue, Users, Drivers
4. Xem top foods và top stores

## 🔐 Permissions & Security

- Chỉ admin (role = 'admin') mới có quyền truy cập admin panel
- Protected routes sẽ redirect nếu không đủ quyền
- Có thể cài đặt bảo mật 2FA, HTTPS, session timeout
- Quản lý whitelist IP nếu cần

## 📱 Responsive Design

Admin panel fully responsive:
- **Desktop**: Sidebar + Full layout
- **Tablet**: Sidebar có thể collapse
- **Mobile**: Drawer menu (hamburger)

## 🚀 Performance Features

- Lazy loading images
- Pagination cho tables
- Optimized charts
- Search & filter
- Debounced inputs
- Loading states (Spin)

## 📦 Dependencies

Các thư viện được sử dụng:
- `antd` - UI Components
- `recharts` - Charts & Graphs
- `axios` - API calls
- `react-router-dom` - Routing

## ⚠️ Lưu Ý

- API endpoints cần được implement trên backend:
  - `/api/admin/statistics`
  - `/api/admin/orders/chart`
  - `/api/admin/orders/recent`
  - `/api/users` (CRUD)
  - `/api/foods` (CRUD)
  - `/api/orders` (CRUD)
  - `/api/stores` (CRUD)
  - `/api/categories` (CRUD)
  - `/api/admin/settings` (PUT)

- Hiện tại đang sử dụng mock data nếu API không available
- Cần cấu hình authentication headers đúng cách
- Hình ảnh upload cần backend support multipart/form-data

## 🔗 Routes

```
/admin/dashboard        → Dashboard chính
/admin/statistics       → Thống kê chi tiết
/admin/users           → Quản lý Users
/admin/foods           → Quản lý Foods
/admin/orders          → Quản lý Orders
/admin/stores          → Quản lý Stores
/admin/categories      → Quản lý Categories
/admin/settings        → Cài đặt hệ thống
```

## 💡 Future Enhancements

- [ ] Export reports to PDF/Excel
- [ ] Bulk actions (select multiple)
- [ ] Advanced filters & saved views
- [ ] Real-time notifications
- [ ] Activity logs
- [ ] User permissions management
- [ ] Email templates management
- [ ] SMS templates management
- [ ] Analytics dashboard
- [ ] Custom themes

---

**Version**: 1.0.0  
**Last Updated**: April 2026  
**Author**: SmartFood Team
