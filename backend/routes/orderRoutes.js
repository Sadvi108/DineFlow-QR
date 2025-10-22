const express = require('express');
const router = express.Router();
const Order = require('../models/orderModel');
const MenuItem = require('../models/menuModel');

// Get order statistics (must be before /:id route)
router.get('/stats', async (req, res) => {
  try {
    if (req.useInMemory) {
      // In-memory implementation
      const orders = req.inMemoryOrders;
      
      const stats = {
        totalOrders: orders.length,
        pendingOrders: orders.filter(order => order.status === 'pending').length,
        preparingOrders: orders.filter(order => order.status === 'preparing').length,
        readyOrders: orders.filter(order => order.status === 'ready').length,
        completedOrders: orders.filter(order => order.status === 'completed').length,
        totalRevenue: orders
          .filter(order => order.paymentStatus === 'paid')
          .reduce((sum, order) => sum + order.totalAmount, 0),
        averageOrderValue: orders.length > 0 
          ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length 
          : 0,
        paidOrders: orders.filter(order => order.paymentStatus === 'paid').length,
        unpaidOrders: orders.filter(order => order.paymentStatus === 'unpaid').length
      };
      
      return res.json({
        success: true,
        data: stats
      });
    }

    // MongoDB implementation
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const preparingOrders = await Order.countDocuments({ status: 'preparing' });
    const readyOrders = await Order.countDocuments({ status: 'ready' });
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    
    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    
    const avgResult = await Order.aggregate([
      { $group: { _id: null, average: { $avg: '$totalAmount' } } }
    ]);
    const averageOrderValue = avgResult.length > 0 ? avgResult[0].average : 0;
    
    const paidOrders = await Order.countDocuments({ paymentStatus: 'paid' });
    const unpaidOrders = await Order.countDocuments({ paymentStatus: 'unpaid' });

    const stats = {
      totalOrders,
      pendingOrders,
      preparingOrders,
      readyOrders,
      completedOrders,
      totalRevenue,
      averageOrderValue,
      paidOrders,
      unpaidOrders
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching order statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order statistics',
      error: error.message
    });
  }
});

// Get summary statistics (must be before /:id route)
router.get('/stats/summary', async (req, res) => {
  try {
    if (req.useInMemory) {
      // In-memory implementation
      const orders = req.inMemoryOrders;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      });
      
      const summary = {
        todayOrders: todayOrders.length,
        todayRevenue: todayOrders
          .filter(order => order.paymentStatus === 'paid')
          .reduce((sum, order) => sum + order.totalAmount, 0),
        totalOrders: orders.length,
        totalRevenue: orders
          .filter(order => order.paymentStatus === 'paid')
          .reduce((sum, order) => sum + order.totalAmount, 0)
      };
      
      return res.json({
        success: true,
        data: summary
      });
    }

    // MongoDB implementation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayStats, totalStats] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: today, $lt: tomorrow }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [
                  { $eq: ['$paymentStatus', 'paid'] },
                  '$totalAmount',
                  0
                ]
              }
            }
          }
        }
      ]),
      Order.aggregate([
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [
                  { $eq: ['$paymentStatus', 'paid'] },
                  '$totalAmount',
                  0
                ]
              }
            }
          }
        }
      ])
    ]);

    const summary = {
      todayOrders: todayStats[0]?.count || 0,
      todayRevenue: todayStats[0]?.revenue || 0,
      totalOrders: totalStats[0]?.count || 0,
      totalRevenue: totalStats[0]?.revenue || 0
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching order summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order summary',
      error: error.message
    });
  }
});

// Get all orders
router.get('/', async (req, res) => {
  try {
    const { status, tableNumber, date, paymentStatus } = req.query;
    
    if (req.useInMemory) {
      // In-memory implementation
      let orders = [...req.inMemoryOrders];
      
      // Apply filters
      if (status) {
        orders = orders.filter(order => order.status === status);
      }
      
      if (tableNumber) {
        orders = orders.filter(order => order.tableNumber === parseInt(tableNumber));
      }
      
      if (paymentStatus) {
        orders = orders.filter(order => order.paymentStatus === paymentStatus);
      }
      
      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        
        orders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= startDate && orderDate < endDate;
        });
      }
      
      // Sort by creation date (newest first)
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return res.json({
        success: true,
        data: orders,
        count: orders.length
      });
    }
    
    // MongoDB implementation
    let filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (tableNumber) {
      filter.tableNumber = parseInt(tableNumber);
    }
    
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      filter.createdAt = {
        $gte: startDate,
        $lt: endDate
      };
    }
    
    const orders = await Order.find(filter)
      .populate('items.menuItem', 'name category')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: orders,
      count: orders.length
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.menuItem', 'name category image');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
});

// Get order by order number
router.get('/number/:orderNumber', async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
      .populate('items.menuItem', 'name category image');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order by number:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    const { tableNumber, items, customerNotes } = req.body;
    
    if (!tableNumber || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Table number and items are required'
      });
    }
    
    if (req.useInMemory) {
      // In-memory implementation
      let totalAmount = 0;
      const processedItems = [];
      
      for (const item of items) {
        const menuItem = req.inMemoryMenu.find(m => m._id === item.menuItemId);
        
        if (!menuItem) {
          return res.status(400).json({
            success: false,
            message: `Menu item not found: ${item.menuItemId}`
          });
        }
        
        if (!menuItem.available) {
          return res.status(400).json({
            success: false,
            message: `Menu item not available: ${menuItem.name}`
          });
        }
        
        const itemTotal = menuItem.price * item.quantity;
        totalAmount += itemTotal;
        
        processedItems.push({
          menuItem: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: item.quantity
        });
      }
      
      // Create order
      const order = {
        _id: `order_${req.orderCounter++}`,
        orderNumber: `ORD${String(req.orderCounter).padStart(6, '0')}`,
        tableNumber: parseInt(tableNumber),
        items: processedItems,
        totalAmount: totalAmount,
        customerNotes: customerNotes || '',
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      req.inMemoryOrders.push(order);
      
      // Emit real-time update to dashboard
      if (req.io) {
        req.io.to('dashboard').emit('new-order', {
          order: order,
          message: `New order #${order.orderNumber} from table ${order.tableNumber}`
        });
      }
      
      return res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: order
      });
    }
    
    // MongoDB implementation
    // Validate and process items
    let totalAmount = 0;
    const processedItems = [];
    
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      
      if (!menuItem) {
        return res.status(400).json({
          success: false,
          message: `Menu item not found: ${item.menuItemId}`
        });
      }
      
      if (!menuItem.available) {
        return res.status(400).json({
          success: false,
          message: `Menu item not available: ${menuItem.name}`
        });
      }
      
      const itemTotal = menuItem.price * item.quantity;
      totalAmount += itemTotal;
      
      processedItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity
      });
    }
    
    // Create order
    const order = new Order({
      tableNumber: parseInt(tableNumber),
      items: processedItems,
      totalAmount: totalAmount,
      customerNotes: customerNotes || ''
    });
    
    await order.save();
    
    // Populate the order for response
    await order.populate('items.menuItem', 'name category image');
    
    // Emit real-time update to dashboard
    req.io.to('dashboard').emit('new-order', {
      order: order,
      message: `New order #${order.orderNumber} from table ${order.tableNumber}`
    });
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['pending', 'preparing', 'ready', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    if (req.useInMemory) {
      // In-memory implementation
      const orderIndex = req.inMemoryOrders.findIndex(order => order._id === req.params.id);
      
      if (orderIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
      
      const order = req.inMemoryOrders[orderIndex];
      
      // Prepare update object
      let updateData = { status };
      
      // If changing to preparing, set preparation start time and estimated completion
      if (status === 'preparing') {
        const now = new Date();
        updateData.preparationStartTime = now;
        
        // Calculate total preparation time based on items
        let totalPrepTime = 0;
        order.items.forEach(item => {
          const itemPrepTime = 10; // default 10 minutes for in-memory
          totalPrepTime += itemPrepTime * item.quantity;
        });
        
        // Add some buffer time and set minimum
        const estimatedMinutes = Math.max(totalPrepTime * 0.8, 15); // minimum 15 minutes
        updateData.estimatedTime = Math.round(estimatedMinutes);
        updateData.estimatedCompletionTime = new Date(now.getTime() + estimatedMinutes * 60000);
      }
      
      // If changing to ready, calculate actual preparation time
      if (status === 'ready') {
        if (order.preparationStartTime) {
          const actualTime = (new Date() - new Date(order.preparationStartTime)) / (1000 * 60); // minutes
          updateData.actualPreparationTime = Math.round(actualTime);
        }
      }
      
      // Update the order
      Object.assign(order, updateData, { updatedAt: new Date() });
      
      // Emit real-time update with timing information
      req.io.to('dashboard').emit('order-status-updated', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        tableNumber: order.tableNumber,
        estimatedTime: order.estimatedTime,
        estimatedCompletionTime: order.estimatedCompletionTime,
        preparationStartTime: order.preparationStartTime,
        actualPreparationTime: order.actualPreparationTime
      });
      
      // Notify table if order is ready
      if (status === 'ready') {
        req.io.to(`table-${order.tableNumber}`).emit('order-ready', {
          orderNumber: order.orderNumber,
          message: 'Your order is ready!',
          actualPreparationTime: order.actualPreparationTime
        });
      }
      
      return res.json({
        success: true,
        message: 'Order status updated successfully',
        data: order
      });
    }

    // MongoDB implementation
    // Prepare update object
    let updateData = { status };
    
    // If changing to preparing, set preparation start time and estimated completion
    if (status === 'preparing') {
      const now = new Date();
      updateData.preparationStartTime = now;
      
      // Calculate estimated completion time based on order items
      const order = await Order.findById(req.params.id).populate('items.menuItem');
      if (order) {
        // Calculate total preparation time based on items
        let totalPrepTime = 0;
        order.items.forEach(item => {
          const itemPrepTime = item.menuItem.preparationTime || 10; // default 10 minutes
          totalPrepTime += itemPrepTime * item.quantity;
        });
        
        // Add some buffer time and set minimum
        const estimatedMinutes = Math.max(totalPrepTime * 0.8, 15); // minimum 15 minutes
        updateData.estimatedTime = Math.round(estimatedMinutes);
        updateData.estimatedCompletionTime = new Date(now.getTime() + estimatedMinutes * 60000);
      }
    }
    
    // If changing to ready, calculate actual preparation time
    if (status === 'ready') {
      const order = await Order.findById(req.params.id);
      if (order && order.preparationStartTime) {
        const actualTime = (new Date() - order.preparationStartTime) / (1000 * 60); // minutes
        updateData.actualPreparationTime = Math.round(actualTime);
      }
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('items.menuItem', 'name category preparationTime');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Emit real-time update with timing information
    req.io.to('dashboard').emit('order-status-updated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      tableNumber: order.tableNumber,
      estimatedTime: order.estimatedTime,
      estimatedCompletionTime: order.estimatedCompletionTime,
      preparationStartTime: order.preparationStartTime,
      actualPreparationTime: order.actualPreparationTime
    });
    
    // Notify table if order is ready
    if (status === 'ready') {
      req.io.to(`table-${order.tableNumber}`).emit('order-ready', {
        orderNumber: order.orderNumber,
        message: 'Your order is ready!',
        actualPreparationTime: order.actualPreparationTime
      });
    }
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
});

// Update payment status
router.patch('/:id/payment', async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    
    if (!paymentStatus || !['unpaid', 'paid'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status'
      });
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true }
    ).populate('items.menuItem', 'name category');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Emit real-time update
    req.io.to('dashboard').emit('payment-status-updated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      tableNumber: order.tableNumber
    });
    
    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payment status',
      error: error.message
    });
  }
});

// Get orders by table
router.get('/table/:tableNumber', async (req, res) => {
  try {
    const { tableNumber } = req.params;
    const { status } = req.query;
    
    let filter = { tableNumber: parseInt(tableNumber) };
    
    if (status) {
      filter.status = status;
    }
    
    const orders = await Order.find(filter)
      .populate('items.menuItem', 'name category image')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: orders,
      tableNumber: parseInt(tableNumber),
      count: orders.length
    });
  } catch (error) {
    console.error('Error fetching orders by table:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders by table',
      error: error.message
    });
  }
});



// Cancel order
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    ).populate('items.menuItem', 'name category');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Emit real-time update
    req.io.to('dashboard').emit('order-cancelled', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber
    });
    
    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
});

module.exports = router;