// server/controllers/order.controller.js
const Order = require('../models/order.model');
const MenuItem = require('../models/menuItem.model');
const Event = require('../models/event.model');

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    console.log("Creating order with data:", JSON.stringify(req.body, null, 2));
    const { eventId, items, deliveryLocation, customerName, notes } = req.body;
    
    // Validate inputs
    if (!eventId || !items || items.length === 0 || !deliveryLocation) {
      return res.status(400).json({ message: 'Event ID, items, and delivery location are required' });
    }
    
    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Process order items
    const orderItems = [];
    let totalAmount = 0;
    
    for (const item of items) {
      // Verify menu item exists
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem) {
        console.error(`Menu item not found: ${item.menuItemId}`);
        return res.status(404).json({ message: `Menu item not found: ${item.menuItemId}` });
      }
      
      // Calculate subtotal for this item
      let itemPrice = menuItem.price;
      const customizations = [];
      
      // Process customizations if any
      if (item.customizations && item.customizations.length > 0) {
        for (const customization of item.customizations) {
          const menuCustomization = menuItem.customizationOptions.find(c => c.name === customization.name);
          if (!menuCustomization) {
            console.error(`Invalid customization: ${customization.name}`);
            return res.status(400).json({ message: `Invalid customization: ${customization.name}` });
          }
          
          const option = menuCustomization.options.find(o => o.name === customization.option);
          if (!option) {
            console.error(`Invalid option: ${customization.option}`);
            return res.status(400).json({ message: `Invalid option: ${customization.option}` });
          }
          
          customizations.push({
            name: customization.name,
            option: customization.option,
            price: option.price
          });
          
          itemPrice += option.price;
        }
      }
      
      const subtotal = itemPrice * item.quantity;
      totalAmount += subtotal;
      
      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        customizations,
        subtotal
      });
    }
    
    console.log("Creating order with items:", JSON.stringify(orderItems, null, 2));
    
    // Create order
    const order = new Order({
      event: eventId,
      user: req.userId,
      items: orderItems,
      deliveryLocation,
      customerName, // Add customer name
      totalAmount,
      notes,
      paymentStatus: 'pending' // This will be updated after payment processing
    });
    
    console.log("Saving order");
    await order.save();
    console.log("Order saved successfully:", order._id);
    
    // If we're using Square integration
    const useSquarePayment = process.env.USE_SQUARE_PAYMENT === 'true';
    
    // Notify admins about new order via socket.io
    if (req.app.get('io')) {
      req.app.get('io').to(`event-${eventId}-admin`).emit('new-order', {
        orderId: order._id,
        orderNumber: order.orderNumber
      });
    }
    
    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        requiresPayment: useSquarePayment
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    console.error('Error stack:', error.stack);
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: 'Server error during order creation', error: error.message });
  }
};

// Get user orders
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .populate('event', 'name');
    
    res.status(200).json({
      orders: orders.map(order => ({
        id: order._id,
        orderNumber: order.orderNumber,
        eventName: order.event.name,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt
      }))
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ message: 'Server error retrieving orders' });
  }
};

// Get order details
exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('event', 'name')
      .populate('user', 'username');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user is authorized (admin, event creator, or order owner)
    if (
      req.userRole !== 'admin' && 
      order.user._id.toString() !== req.userId
    ) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }
    
    res.status(200).json({ order });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ message: 'Server error retrieving order details' });
  }
};

// Update order status (admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Update status
    order.status = status;
    await order.save();
    
    // Notify user about order status update
    if (req.app.get('io')) {
      req.app.get('io').to(`user-${order.user}`).emit('order-status-updated', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status
      });
    }
    
    res.status(200).json({
      message: 'Order status updated successfully',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status
      }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error during status update' });
  }
};

// Get event orders (admin only)
exports.getEventOrders = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const orders = await Order.find({ event: eventId })
      .sort({ createdAt: -1 })
      .populate('user', 'username');
    
    res.status(200).json({
      orders: orders.map(order => ({
        id: order._id,
        orderNumber: order.orderNumber,
        username: order.user.username,
        customerName: order.customerName, // Include customer name in the response
        totalAmount: order.totalAmount,
        status: order.status,
        deliveryLocation: order.deliveryLocation,
        createdAt: order.createdAt
      }))
    });
  } catch (error) {
    console.error('Get event orders error:', error);
    res.status(500).json({ message: 'Server error retrieving event orders' });
  }
};