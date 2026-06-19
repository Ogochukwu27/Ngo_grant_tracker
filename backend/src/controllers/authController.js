// backend/src/controllers/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

/**
 * Generate JWT Token Helper
 * Takes a user ID and signs it into a token that expires in 30 days.
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  // 1. Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email, and password' });
  }

  try {
    // 2. Check if user already exists in the database
    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // 3. Password Hashing
    // Plaintext passwords should NEVER be saved in a database.
    // We generate a "salt" (random characters) and blend it with the password using bcrypt.
    // This creates a secure, one-way hash. You cannot convert the hash back into the password!
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Save the new user to the database
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword, // Store the secure hashed password
        role: role || 'STAFF',    // Default to STAFF role if not specified
      },
    });

    // 5. Send back the response (excluding password) along with a JWT token
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server error during user registration' });
  }
};

/**
 * @desc    Authenticate a user & get token (Login)
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // 1. Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    // 2. Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 3. Compare passwords
    // Since we cannot decrypt the database password, bcrypt.compare will hash the password 
    // the user entered and check if it matches the hash we stored during registration.
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * @desc    Get user profile (Current logged in user)
 * @route   GET /api/auth/profile
 * @access  Private (Requires JWT token)
 */
const getUserProfile = async (req, res) => {
  // The user object is already attached to 'req.user' from the 'protect' middleware.
  // We can just return it.
  res.json(req.user);
};

/**
 * @desc    Change user password
 * @route   PUT /api/auth/change-password
 * @access  Private (Requires JWT token)
 */
const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Please provide old and new passwords' });
  }

  try {
    // 1. Fetch user from DB with password included
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Compare old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect old password' });
    }

    // 3. Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. Save new password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ message: 'Server error during password update' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  changePassword,
};
