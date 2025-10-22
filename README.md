# 🍽️ DineFlow - QR-Based Restaurant Ordering System

A complete local network restaurant ordering system that allows customers to scan QR codes, view menus, place orders, and enables staff to manage orders in real-time with advanced preparation timing features.

## 🌟 Features

### Customer Features
- **QR Code Scanning**: Each table has a unique QR code linking to the table-specific menu
- **Interactive Menu**: Browse food items by category with images, descriptions, and prices
- **Shopping Cart**: Add/remove items, adjust quantities, view live total
- **Order Confirmation**: Review and confirm orders with optional customer notes
- **Real-time Notifications**: Get notified when orders are ready for pickup

### Staff Features
- **Kitchen Dashboard**: Real-time order monitoring with status management
- **Order Management**: Update order status (Pending → Preparing → Ready → Completed)
- **Payment Tracking**: Mark orders as paid/unpaid
- **Order Search & Filter**: Find orders by number, table, or status
- **Statistics**: View order counts, revenue, and performance metrics
- **QR Code Generator**: Generate and print QR codes for tables

### Technical Features
- **Real-time Updates**: Socket.io for instant order notifications
- **Local Network**: Runs entirely within restaurant network
- **Responsive Design**: Works on phones (customers) and desktops (staff)
- **Offline Resilience**: Graceful handling of connection issues
- **Data Persistence**: MongoDB for reliable data storage with in-memory fallback

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Customer      │    │   Kitchen       │    │   QR Code       │
│   (Mobile)      │    │   Dashboard     │    │   Generator     │
│                 │    │   (Desktop)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────┐
         │              Node.js Server                     │
         │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
         │  │   Express   │  │  Socket.io  │  │   API    │ │
         │  │   Routes    │  │  Real-time  │  │  Routes  │ │
         │  └─────────────┘  └─────────────┘  └──────────┘ │
         └─────────────────────────────────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────┐
         │                MongoDB Database                 │
         │  ┌─────────────┐  ┌─────────────┐              │
         │  │    Menu     │  │   Orders    │              │
         │  │  Collection │  │ Collection  │              │
         │  └─────────────┘  └─────────────┘              │
         └─────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
restaurant-ordering-system/
├── backend/
│   ├── server.js                 # Main server file
│   ├── package.json             # Dependencies and scripts
│   ├── .env                     # Environment configuration
│   ├── models/
│   │   ├── menuModel.js         # Menu item schema
│   │   └── orderModel.js        # Order schema
│   ├── routes/
│   │   ├── menuRoutes.js        # Menu API endpoints
│   │   ├── orderRoutes.js       # Order API endpoints
│   │   └── qrRoutes.js          # QR code generation endpoints
│   └── utils/
│       └── generateQR.js        # QR code utilities
├── frontend/
│   ├── pages/
│   │   ├── index.html           # Landing page
│   │   ├── table.html           # Customer menu page
│   │   ├── dashboard.html       # Kitchen dashboard
│   │   └── qr-generator.html    # QR code generator
│   ├── js/
│   │   ├── menu.js              # Menu functionality
│   │   ├── cart.js              # Shopping cart logic
│   │   ├── dashboard.js         # Dashboard functionality
│   │   └── socket.js            # Real-time communication
│   └── css/
│       └── style.css            # Responsive styling
├── frontend-nextjs/             # Next.js version (alternative)
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- A local network (WiFi router)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sadvi108/DineFlow-QR.git
   cd DineFlow-QR
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment**
   Edit `backend/.env` file:
   ```env
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/restaurant-orders
   JWT_SECRET=your-secret-key-here
   SERVER_IP=192.168.1.10
   ```

4. **Start MongoDB (if using local)**
   ```bash
   mongod
   ```

5. **Start the backend server**
   ```bash
   npm start
   ```

6. **Access the system**
   - Main page: `http://localhost:3000`
   - Kitchen Dashboard: `http://localhost:3001/dashboard`
   - QR Generator: `http://localhost:3001/qr-generator`

## 🔧 API Reference

### Menu Endpoints
- `GET /api/menu` - Get all menu items
- `GET /api/menu/category/:category` - Get items by category
- `POST /api/menu` - Create new menu item
- `PUT /api/menu/:id` - Update menu item
- `DELETE /api/menu/:id` - Delete menu item

### Order Endpoints
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get specific order
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id/payment` - Update payment status
- `GET /api/orders/stats` - Get order statistics

### QR Code Endpoints
- `POST /api/qr/generate` - Generate single QR code
- `POST /api/qr/generate-multiple` - Generate multiple QR codes
- `GET /api/qr/table/:tableNumber` - Get QR for specific table

## 🛠️ Troubleshooting

### Common Issues

**1. Cannot access from phones**
- Ensure server IP is correct in `.env`
- Check firewall settings
- Verify phones are on same WiFi network

**2. Orders not appearing on dashboard**
- Check MongoDB connection
- Verify Socket.io is working (check browser console)
- Restart the server

**3. QR codes not working**
- Verify the generated URL is accessible
- Check server IP configuration
- Test URL manually in browser

**4. Database connection issues**
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify database permissions

## 📄 License

This project is open source and available under the MIT License.

---

**Built with ❤️ for restaurants looking to modernize their ordering process while maintaining full control over their data and operations.**
