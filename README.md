# 🍽️ QR-Based Restaurant Ordering System

A complete local network restaurant ordering system that allows customers to scan QR codes, view menus, place orders, and enables staff to manage orders in real-time.

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
- **Data Persistence**: MongoDB for reliable data storage

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
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- A local network (WiFi router)

### Installation

1. **Clone or download the project**
   ```bash
   cd restaurant-ordering-system
   ```

2. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment**
   Edit `backend/.env` file:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/restaurant-orders
   JWT_SECRET=your-secret-key-here
   SERVER_IP=192.168.1.10
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or use MongoDB Atlas cloud connection
   ```

5. **Start the server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

6. **Access the system**
   - Main page: `http://192.168.1.10:3000`
   - Kitchen Dashboard: `http://192.168.1.10:3000/dashboard`
   - QR Generator: `http://192.168.1.10:3000/qr-generator`

### Setting Up Tables

1. **Generate QR Codes**
   - Visit `http://192.168.1.10:3000/qr-generator`
   - Enter your server IP address
   - Generate QR codes for your tables (e.g., Tables 1-20)
   - Download and print the QR codes

2. **Place QR Codes**
   - Print each QR code with the table number
   - Laminate for durability
   - Place on corresponding tables

3. **Test the System**
   - Scan a QR code with your phone
   - Place a test order
   - Check the kitchen dashboard for the order
   - Update order status and verify notifications

## 🔧 Configuration

### Server Configuration

**IP Address Setup**: The system needs to run on your local network IP, not localhost.

1. **Find your local IP**:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. **Update configuration**:
   - Update `SERVER_IP` in `.env` file
   - Use this IP when generating QR codes
   - Access the system using this IP

### Database Configuration

**MongoDB Setup**:
```javascript
// Local MongoDB
MONGODB_URI=mongodb://localhost:27017/restaurant-orders

// MongoDB Atlas (cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/restaurant-orders
```

### Menu Setup

The system includes sample menu items. To customize:

1. **Access the database**:
   ```bash
   mongo restaurant-orders
   db.menuitems.find()
   ```

2. **Add menu items via API**:
   ```bash
   POST /api/menu
   {
     "name": "Burger",
     "description": "Delicious beef burger",
     "price": 12.99,
     "category": "Main Course",
     "image": "burger.jpg",
     "preparationTime": 15
   }
   ```

## 📱 Usage Guide

### For Customers

1. **Scan QR Code**: Use any QR code scanner app
2. **Browse Menu**: View items by category
3. **Add to Cart**: Tap + to add items, adjust quantities
4. **Review Order**: Check cart contents and total
5. **Confirm Order**: Add notes if needed, confirm order
6. **Wait for Notification**: You'll be notified when order is ready
7. **Pickup & Pay**: Mention your order number at the counter

### For Kitchen Staff

1. **Monitor Dashboard**: Keep the dashboard open on a screen
2. **New Orders**: Orders appear automatically with sound notification
3. **Update Status**: 
   - Click "Start Preparing" when you begin cooking
   - Click "Mark Ready" when food is ready
   - Click "Complete" when customer picks up
4. **Payment**: Mark orders as paid when customer pays
5. **Search Orders**: Use the search box to find specific orders

### For Management

1. **Generate QR Codes**: Use the QR generator for new tables
2. **View Statistics**: Check order counts and revenue on dashboard
3. **Manage Menu**: Add/edit menu items via API or database
4. **Export Data**: Orders are stored in MongoDB for reporting

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

### Performance Tips

- **Use local MongoDB** for better performance
- **Optimize images** - compress menu item images
- **Regular cleanup** - archive old orders periodically
- **Monitor resources** - check server CPU/memory usage

## 🔒 Security Considerations

- **Local Network Only**: System is designed for internal use
- **No Internet Required**: Operates completely offline
- **Basic Authentication**: Add JWT authentication for admin features
- **Data Backup**: Regular MongoDB backups recommended
- **Access Control**: Restrict dashboard access to staff devices

## 📈 Scaling & Extensions

### Possible Enhancements

1. **Multi-location Support**: Add restaurant/branch management
2. **Advanced Analytics**: Detailed reporting and insights
3. **Inventory Management**: Track ingredient usage
4. **Customer Accounts**: Optional customer registration
5. **Payment Integration**: POS system integration
6. **Printer Integration**: Automatic kitchen ticket printing
7. **Mobile App**: Native mobile apps for better UX

### Hardware Recommendations

- **Server**: Raspberry Pi 4 or dedicated PC
- **Network**: Reliable WiFi router with good coverage
- **Display**: Tablet/monitor for kitchen dashboard
- **Printer**: Thermal printer for order tickets (optional)

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs for errors
3. Test individual components (database, API, frontend)
4. Verify network connectivity

## 📄 License

This project is open source and available under the MIT License.

---

**Built with ❤️ for restaurants looking to modernize their ordering process while maintaining full control over their data and operations.**