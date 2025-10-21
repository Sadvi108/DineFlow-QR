const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Import routes
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Import models
const MenuItem = require('./models/menuModel');
const Order = require('./models/orderModel');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant_orders';

// In-memory storage for development (when MongoDB is not available)
let inMemoryOrders = [];
let inMemoryMenu = [];
let orderCounter = 1000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/public', express.static(path.join(__dirname, '../frontend/public')));

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  req.inMemoryOrders = inMemoryOrders;
  req.inMemoryMenu = inMemoryMenu;
  req.orderCounter = orderCounter;
  next();
});

// Connect to MongoDB with fallback to in-memory storage
let useInMemory = true; // Start with in-memory mode by default

// Initialize in-memory data immediately
initializeInMemoryData();

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Connected to MongoDB');
  useInMemory = false; // Switch to MongoDB mode only after successful connection
  
  // Initialize sample menu items if none exist
  const menuCount = await MenuItem.countDocuments();
  if (menuCount === 0) {
    await initializeSampleMenu();
  }
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  console.log('Falling back to in-memory storage for development...');
  useInMemory = true; // Keep in-memory mode (already true)
});

// Make database mode accessible to routes
app.use((req, res, next) => {
  req.useInMemory = useInMemory;
  next();
});

// Routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/qr', require('./routes/qrRoutes'));

// Serve table pages
app.get('/table/:tableNumber', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/table.html'));
});

// Serve dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/dashboard.html'));
});

// Serve QR code generation page
app.get('/qr-generator', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/qr-generator.html'));
});

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Join dashboard room for real-time updates
  socket.on('join-dashboard', () => {
    socket.join('dashboard');
    console.log('Client joined dashboard room');
  });
  
  // Join table room
  socket.on('join-table', (tableNumber) => {
    socket.join(`table-${tableNumber}`);
    console.log(`Client joined table ${tableNumber} room`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Initialize sample menu items
async function initializeSampleMenu() {
  const sampleMenuItems = [
    {
      name: 'Margherita Pizza',
      description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
      price: 12.99,
      category: 'main-course',
      image: '/images/margherita-pizza.jpg'
    },
    {
      name: 'Caesar Salad',
      description: 'Fresh romaine lettuce with Caesar dressing, croutons, and parmesan',
      price: 8.99,
      category: 'appetizers',
      image: '/images/caesar-salad.jpg'
    },
    {
      name: 'Grilled Chicken Breast',
      description: 'Tender grilled chicken with herbs and vegetables',
      price: 15.99,
      category: 'main-course',
      image: '/images/grilled-chicken.jpg'
    },
    {
      name: 'Chocolate Cake',
      description: 'Rich chocolate cake with chocolate frosting',
      price: 6.99,
      category: 'desserts',
      image: '/images/chocolate-cake.jpg'
    },
    {
      name: 'Fresh Orange Juice',
      description: 'Freshly squeezed orange juice',
      price: 3.99,
      category: 'beverages',
      image: '/images/orange-juice.jpg'
    },
    {
      name: 'Garlic Bread',
      description: 'Toasted bread with garlic butter and herbs',
      price: 4.99,
      category: 'appetizers',
      image: '/images/garlic-bread.jpg'
    }
  ];

  try {
    await MenuItem.insertMany(sampleMenuItems);
    console.log('Sample menu items initialized');
  } catch (error) {
    console.error('Error initializing sample menu:', error);
  }
}

// Initialize in-memory data for development
function initializeInMemoryData() {
  console.log('Initializing in-memory data...');
  
  // Sample menu items for in-memory storage
  inMemoryMenu = [
    {
      _id: 'main-dishes-nasi-lemak',
      name: 'Nasi Lemak',
      description: 'Fragrant coconut rice served with sambal, fried anchovies, peanuts, boiled egg, and cucumber',
      price: 12.90,
      category: 'main-dishes',
      available: true,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400'
    },
    {
      _id: 'main-dishes-char-kway-teow',
      name: 'Char Kway Teow',
      description: 'Stir-fried flat rice noodles with prawns, Chinese sausage, eggs, and bean sprouts',
      price: 10.50,
      category: 'main-dishes',
      available: true,
      image: 'https://images.unsplash.com/photo-1559847844-d721426d6edc?w=400'
    },
    {
      _id: 'snacks-sides-satay',
      name: 'Chicken Satay',
      description: 'Grilled chicken skewers served with peanut sauce and ketupat',
      price: 8.90,
      category: 'snacks-sides',
      available: true,
      image: 'https://images.unsplash.com/photo-1529563021893-cc83c992d75d?w=400'
    },
    {
      _id: 'drinks-teh-tarik',
      name: 'Teh Tarik',
      description: 'Traditional Malaysian pulled tea with condensed milk',
      price: 3.50,
      category: 'drinks',
      available: true,
      image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400'
    }
  ];
  
  console.log(`Initialized ${inMemoryMenu.length} menu items in memory`);
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Dashboard available at: http://localhost:${PORT}/dashboard`);
  console.log(`QR Generator available at: http://localhost:${PORT}/qr-generator`);
});

module.exports = { app, io };