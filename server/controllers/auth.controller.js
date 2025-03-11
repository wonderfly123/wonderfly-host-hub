const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Register a new user (admin only)
exports.register = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Create new user
    const user = new User({
      username,
      password,
      role: role || 'admin'
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Guest login with event code
exports.guestLogin = async (req, res) => {
  try {
    const { eventCode, name } = req.body;

    // Create or find guest user
    let guestUser = await User.findOne({ 
      username: `guest_${name}_${eventCode}`,
      eventCode 
    });

    if (!guestUser) {
      // Create a new guest user
      const randomPassword = Math.random().toString(36).slice(-8);
      
      guestUser = new User({
        username: `guest_${name}_${eventCode}`,
        password: randomPassword,
        role: 'guest',
        eventCode
      });

      await guestUser.save();
    }

    // Generate token
    const token = generateToken(guestUser._id);

    res.status(200).json({
      message: 'Guest login successful',
      token,
      user: {
        id: guestUser._id,
        username: guestUser.username,
        role: guestUser.role
      }
    });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({ message: 'Server error during guest login' });
  }
};

// Admin login
exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Admin login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
};
