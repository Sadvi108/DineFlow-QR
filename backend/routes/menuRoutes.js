const express = require('express');
const router = express.Router();
const MenuItem = require('../models/menuModel');

// Get all menu items
router.get('/', async (req, res) => {
  try {
    const { category, available } = req.query;
    
    if (req.useInMemory) {
      // In-memory implementation
      let menuItems = [...req.inMemoryMenu];
      
      // Apply filters
      if (category) {
        menuItems = menuItems.filter(item => item.category === category);
      }
      
      if (available !== undefined) {
        menuItems = menuItems.filter(item => item.available === (available === 'true'));
      }
      
      // Sort by category and name
      menuItems.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.name.localeCompare(b.name);
      });
      
      return res.json({
        success: true,
        data: menuItems,
        count: menuItems.length
      });
    }
    
    // MongoDB implementation
    let filter = {};
    
    if (category) {
      filter.category = category;
    }
    
    if (available !== undefined) {
      filter.available = available === 'true';
    }
    
    const menuItems = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    
    res.json({
      success: true,
      data: menuItems,
      count: menuItems.length
    });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menu items',
      error: error.message
    });
  }
});

// Get menu items by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const menuItems = await MenuItem.find({ 
      category: category,
      available: true 
    }).sort({ name: 1 });
    
    res.json({
      success: true,
      data: menuItems,
      category: category,
      count: menuItems.length
    });
  } catch (error) {
    console.error('Error fetching menu items by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menu items by category',
      error: error.message
    });
  }
});

// Get single menu item
router.get('/:id', async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }
    
    res.json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menu item',
      error: error.message
    });
  }
});

// Create new menu item (for admin use)
router.post('/', async (req, res) => {
  try {
    const menuItem = new MenuItem(req.body);
    await menuItem.save();
    
    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: menuItem
    });
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating menu item',
      error: error.message
    });
  }
});

// Update menu item (for admin use)
router.put('/:id', async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Menu item updated successfully',
      data: menuItem
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating menu item',
      error: error.message
    });
  }
});

// Toggle menu item availability
router.patch('/:id/toggle-availability', async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }
    
    menuItem.available = !menuItem.available;
    await menuItem.save();
    
    res.json({
      success: true,
      message: `Menu item ${menuItem.available ? 'enabled' : 'disabled'}`,
      data: menuItem
    });
  } catch (error) {
    console.error('Error toggling menu item availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling menu item availability',
      error: error.message
    });
  }
});

// Delete menu item (for admin use)
router.delete('/:id', async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting menu item',
      error: error.message
    });
  }
});

// Get all categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await MenuItem.distinct('category');
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

module.exports = router;