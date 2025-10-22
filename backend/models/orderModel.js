const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  tableNumber: {
    type: Number,
    required: true,
    min: 1
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid'
  },
  customerNotes: {
    type: String,
    default: ''
  },
  estimatedTime: {
    type: Number, // minutes
    default: 20
  },
  preparationStartTime: {
    type: Date,
    default: null
  },
  estimatedCompletionTime: {
    type: Date,
    default: null
  },
  actualPreparationTime: {
    type: Number, // minutes
    default: null
  }
}, {
  timestamps: true
});

// Generate order number automatically
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Find the last order of today
    const lastOrder = await this.constructor.findOne({
      orderNumber: new RegExp(`^${dateStr}`)
    }).sort({ orderNumber: -1 });
    
    let nextNumber = 1;
    if (lastOrder) {
      const lastNumber = parseInt(lastOrder.orderNumber.slice(-3));
      nextNumber = lastNumber + 1;
    }
    
    this.orderNumber = `${dateStr}${nextNumber.toString().padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);