/**
 * SmartFood - Real-time Food Delivery Platform
 * 
 * Complete implementation guide and architecture overview
 */

# 🍔 SmartFood - Real-time Food Delivery Platform

## 📋 Project Overview

SmartFood is a comprehensive food delivery application featuring:
- **Backend**: Node.js + Express with MySQL Spatial Database
- **Frontend Web**: React with OpenStreetMap & Socket.io
- **Mobile**: React Native Android Driver App
- **Real-time**: Socket.io for order tracking and driver location

### Key Features

1. ✅ **Geolocation-based Store Discovery** (20km radius)
2. ✅ **Real-time Order Tracking** with Driver Location Updates
3. ✅ **6-Stage Order Workflow** (PENDING → COMPLETED)
4. ✅ **Automatic Driver Matching** within 10km radius
5. ✅ **Live Admin Dashboard** with Analytics
6. ✅ **Driver Mobile App** with Location Services
7. ✅ **Payment Processing** (Cash, Card, Wallet)
8. ✅ **Rating & Review System**

---

## 🗂️ Project Structure

```
SmartFood/
├── backend/                    # Node.js Express API
│   ├── src/
│   │   ├── config/            # Database, JWT, Multer configs
│   │   ├── models/            # Sequelize ORM models
│   │   ├── controllers/       # API request handlers
│   │   ├── services/          # Business logic layer
│   │   ├── routes/            # API route definitions
│   │   ├── middleware/        # Auth, error handling
│   │   ├── utils/             # Geo calculations, responses
│   │   └── socket/            # Socket.io handlers
│   ├── uploads/               # User uploaded files
│   ├── server.js              # Express server
│   ├── socket-server.js       # Socket.io server
│   └── package.json
│
├── database/
│   └── schema.sql             # MySQL schema with procedures
│
├── frontend/
│   ├── web/                   # React Dashboard
│   │   ├── src/
│   │   │   ├── components/    # Reusable UI components
│   │   │   ├── pages/         # Page containers
│   │   │   ├── services/      # API & Socket services
│   │   │   ├── store/         # Zustand state management
│   │   │   ├── utils/         # Utilities
│   │   │   ├── styles/        # CSS/styling
│   │   │   └── App.jsx        # Main component
│   │   ├── public/
│   │   └── package.json
│   │
│   └── mobile/                # React Native Android Driver App
│       ├── src/
│       │   ├── screens/       # App screens
│       │   ├── components/    # UI components
│       │   ├── services/      # API & Socket
│       │   ├── store/         # Zustand stores
│       │   └── App.jsx        # Navigation
│       └── package.json
```

---

## 🗄️ Database Schema Highlights

### Spatial Indexing (MySQL)
```sql
-- Stores & Users have POINT(lng, lat) for fast geospatial queries
SPATIAL INDEX spatial_idx (POINT(lng, lat))

-- Find nearby stores
SELECT * FROM stores
WHERE ST_Distance_Sphere(POINT(lng, lat), POINT(?, ?)) / 1000 <= 20;
```

### Order Status Workflow (6 Stages)
```
1. PENDING         → Order placed, waiting for store confirmation
2. CONFIRMED       → Store confirmed the order
3. FINDING_DRIVER  → System searching for available driver
4. DRIVER_ACCEPTED → Driver accepted delivery
5. DELIVERING      → Driver picked up order and delivering
6. COMPLETED       → Order delivered successfully
(+ CANCELLED)
```

### Tables Structure
- **users**: All users (customers, drivers, store owners, admins)
- **stores**: Restaurant/food shop information
- **categories**: Food categories per store
- **foods**: Individual food items
- **orders**: Order records with status tracking
- **order_items**: Items in each order
- **ratings**: User reviews and ratings
- **driver_location_history**: GPS tracking history

---

## 🚀 Setup Instructions

### 1. Database Setup

```bash
# Connect to MySQL
mysql -u root -p

# Import schema
SOURCE database/schema.sql;
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials

# Start API server (Terminal 1)
npm start
# Or development with auto-reload
npm run dev

# Start Socket.io server in separate terminal (Terminal 2)
node socket-server.js
```

### 3. Frontend Web Setup

```bash
cd frontend/web

# Install dependencies
npm install

# Configure API URLs in .env
# REACT_APP_API_URL=http://localhost:5000/api
# REACT_APP_SOCKET_URL=http://localhost:5001

# Start development server
npm start
# Open http://localhost:3000
```

### 4. Mobile Driver App Setup

```bash
cd frontend/mobile

# Install dependencies
npm install

# For Expo (easier setup)
npx expo install

# Run on Android
npx expo start
# Press 'a' for Android emulator
# Or scan QR code with Expo Go app

# Alternative: Direct React Native
npm run android
```

---

## 🔌 Socket.io Events Reference

### Order Management
```javascript
// Client → Server
socket.emit('JOIN_ORDER', { orderId, userId })
socket.emit('LEAVE_ORDER', { orderId })
socket.emit('UPDATE_ORDER_STATUS', { orderId, status })

// Server → Client
socket.on('ORDER_STATUS', (order) => {})
socket.on('ORDER_STATUS_CHANGED', (data) => {})
socket.on('STORE_CONFIRMED', (data) => {})
socket.on('NEW_ORDER_AVAILABLE', (order) => {})
```

### Driver Location Tracking
```javascript
// Driver sends location every 5 seconds
socket.emit('DRIVER_LOCATION_UPDATE', { orderId, lat, lng, driverId })

// Users receive driver location updates
socket.on('DRIVER_LOCATION', (location) => {})
```

### Driver Status
```javascript
socket.emit('DRIVER_ONLINE', { driverId })
socket.emit('DRIVER_OFFLINE', { driverId })

socket.on('DRIVER_STATUS_CHANGED', (data) => {})
```

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/location` - Update location
- `POST /api/auth/driver/toggle-status` - Driver online/offline

### Orders
- `POST /api/orders/checkout` - Create order
- `GET /api/orders/my-orders` - User's orders
- `GET /api/orders/:orderId` - Order details
- `PUT /api/orders/:orderId/status` - Update status
- `GET /api/orders/available` - Available orders (driver)
- `POST /api/orders/:orderId/accept` - Accept order (driver)
- `GET /api/orders/driver/active` - Driver's active orders

### Stores
- `GET /api/stores/nearby` - Nearby stores
- `GET /api/stores/:storeId` - Store details
- `POST /api/stores` - Create store
- `POST /api/stores/:storeId/categories` - Add category
- `POST /api/stores/:storeId/foods` - Add food
- `PUT /api/stores/foods/:foodId` - Update food
- `PATCH /api/stores/foods/:foodId/availability` - Toggle availability

---

## 🔐 Authentication Flow

```
1. User registers/logs in
2. Backend validates and issues JWT token
3. Client stores token in localStorage (web) / AsyncStorage (mobile)
4. All API requests include: Authorization: Bearer {token}
5. Middleware verifies token on protected routes
```

## 💰 Shipping Fee Calculation

```javascript
// Formula:
shippingFee = Math.round(distanceKm) * 15000 (VND)

Example:
- 2.3 km → 2 * 15000 = 30,000 đ
- 5.8 km → 6 * 15000 = 90,000 đ
```

---

## 📱 Key Features Implementation

### 1. Geolocation Search
Uses MySQL ST_Distance_Sphere for efficient spatial queries:
```sql
SELECT stores FROM stores
WHERE ST_Distance_Sphere(POINT(lng, lat), POINT(user_lng, user_lat)) <= 20km
ORDER BY distance ASC
```

### 2. Real-time Driver Location
- Driver app sends GPS every 5 seconds via Socket.io
- Web dashboard receives and broadcasts to all viewers
- Map updates driver marker in real-time

### 3. Automatic Driver Matching
```
When order status → FINDING_DRIVER:
1. Query drivers within 10km of store
2. Sort by distance (closest first)
3. Send NEW_ORDER_AVAILABLE to available drivers
4. First driver to accept gets the order
```

### 4. Image Upload
- Multer handles file uploads to `/uploads` folder
- Supports: JPEG, PNG, GIF, WebP
- Max file size: 5MB

---

## 🛠️ Development Tips

### Testing Socket.io Connection
```javascript
// In browser console
io('http://localhost:5001')
  .on('connect', () => console.log('Connected'))
  .emit('JOIN_ORDER', { orderId: 1, userId: 1 })
```

### Debug Location Services
```bash
# Android emulator geolocation
adb emu geo fix <longitude> <latitude>
```

### Check Database
```bash
# Connect to MySQL
mysql -u root -p smartfood

# View recent orders
SELECT id, status, created_at FROM orders ORDER BY created_at DESC LIMIT 10;

# Check nearby stores
CALL FindStoresNearby(21.0285, 105.8542, 20);
```

---

## 📊 Performance Optimization

1. **Database Indexing**: Spatial indices on coordinates
2. **Caching**: Future Redis integration for frequently accessed data
3. **Pagination**: API responses support pagination
4. **Image Optimization**: Use WebP format for frontend
5. **Socket.io Rooms**: Messages only sent to relevant users

---

## 🚨 Error Handling

All API responses follow standard format:
```json
{
  "success": true/false,
  "data": {},
  "message": "Description"
}
```

---

## 📝 Future Enhancements

- [ ] Payment gateway integration (Stripe, Momo)
- [ ] Advanced route optimization (OSRM integration)
- [ ] Driver rating/review system
- [ ] Push notifications
- [ ] Order scheduling
- [ ] Promo codes and discounts
- [ ] Multi-language support
- [ ] iOS mobile app

---

## 📧 Support & Documentation

For detailed information, refer to:
- `/backend/README.md` - Backend API docs
- `/frontend/web/README.md` - Web dashboard guide
- `/frontend/mobile/README.md` - Mobile app guide
- `/database/schema.sql` - Complete database schema

---

**Happy coding! 🚀**
