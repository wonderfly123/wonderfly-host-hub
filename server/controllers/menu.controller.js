// server/controllers/menu.controller.js
const MenuItem = require('../models/menuItem.model');
const Event = require('../models/event.model');

// Create a new menu item (admin only)
exports.createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, customizationOptions, eventId } = req.body;
    
    // Validate inputs
    if (!name || !description || !price || !category || !eventId) {
      return res.status(400).json({ message: 'Name, description, price, category, and event ID are required' });
    }
    
    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Create menu item
    const menuItem = new MenuItem({
      name,
      description,
      price,
      category,
      imageUrl,
      customizationOptions,
      event: eventId,
      createdBy: req.userId
    });
    
    await menuItem.save();
    
    res.status(201).json({
      message: 'Menu item created successfully',
      menuItem: {
        id: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        category: menuItem.category
      }
    });
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({ message: 'Server error during menu item creation' });
  }
};

// Get all menu items for an event
exports.getEventMenu = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Get menu items
    const menuItems = await MenuItem.find({ event: eventId, available: true })
      .sort({ category: 1, name: 1 });
    
    // Group by category
    const menu = menuItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push({
        id: item._id,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        customizationOptions: item.customizationOptions
      });
      return acc;
    }, {});
    
    res.status(200).json({ menu });
  } catch (error) {
    console.error('Get event menu error:', error);
    res.status(500).json({ message: 'Server error retrieving menu' });
  }
};

// Update menu item (admin only)
exports.updateMenuItem = async (req, res) => {
  try {
    const { name, description, price, imageUrl, available, customizationOptions } = req.body;
    
    const menuItem = await MenuItem.findById(req.params.menuItemId);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    // Update fields
    if (name) menuItem.name = name;
    if (description) menuItem.description = description;
    if (price !== undefined) menuItem.price = price;
    if (imageUrl) menuItem.imageUrl = imageUrl;
    if (available !== undefined) menuItem.available = available;
    if (customizationOptions) menuItem.customizationOptions = customizationOptions;
    
    await menuItem.save();
    
    res.status(200).json({
      message: 'Menu item updated successfully',
      menuItem: {
        id: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        available: menuItem.available
      }
    });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ message: 'Server error during menu item update' });
  }
};

// Delete menu item (admin only)
exports.deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.menuItemId);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    await MenuItem.findByIdAndDelete(req.params.menuItemId);
    
    res.status(200).json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ message: 'Server error during menu item deletion' });
  }
};