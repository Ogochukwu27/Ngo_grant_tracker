// backend/src/controllers/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { logAudit } = require('../config/auditLogger');

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
  // We extract role here to explicitly ignore it, preventing new users from making themselves Admins!
  const { name, email, password } = req.body;

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
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Save the new user to the database
    // Note: Every new registered user is forced to be a "STAFF" by default and "isActive" is true.
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'STAFF', // Force defaults! Choose role is forbidden at sign up.
        isActive: true,
      },
    });

    // Write to our audit log table.
    // Since the request object doesn't have req.user yet, we pass explicit details.
    await logAudit({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      action: 'USER_REGISTER',
      details: `New staff account registered with email: ${user.email}`,
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

    // 3. Compare passwords & validate account status
    if (user && (await bcrypt.compare(password, user.password))) {
      // Security Check: Block deactivated accounts from retrieving tokens
      if (!user.isActive) {
        await logAudit({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          userRole: user.role,
          action: 'FAILED_LOGIN',
          details: `Attempted login to a deactivated account: ${email}`,
        });
        return res.status(403).json({ message: 'Not authorized, account is deactivated' });
      }

      // Log successful login
      await logAudit({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        action: 'USER_LOGIN',
        details: 'User successfully logged into the platform',
      });

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
      });
    } else {
      // Log failed login attempt
      await logAudit({
        userName: 'Anonymous',
        userEmail: email,
        userRole: 'NONE',
        action: 'FAILED_LOGIN',
        details: `Invalid login credentials supplied for: ${email}`,
      });
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

    await logAudit({
      req,
      action: 'PASSWORD_CHANGE',
      details: 'User updated their account password',
    });

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ message: 'Server error during password update' });
  }
};

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/auth/users
 * @access  Private (Admin only)
 */
const getUsers = async (req, res) => {
  const { search, role } = req.query;

  try {
    // Build query conditions
    const where = {};

    // Search filter (searches matching name or email case-insensitively)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Role filter
    if (role) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ message: 'Server error retrieving users' });
  }
};

/**
 * @desc    Update user role (Admin only)
 * @route   PUT /api/auth/users/:id/role
 * @access  Private (Admin only)
 */
const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  // Validate allowed roles
  const validRoles = ['ADMIN', 'STAFF', 'VIEWER'];
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ message: `Please provide a valid role: ${validRoles.join(', ')}` });
  }

  // Prevent self-demotion/self-lockout
  if (id === req.user.id) {
    return res.status(400).json({ message: 'You cannot change your own role to prevent administrator lockout.' });
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldRole = targetUser.role;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Write action to Audit Log
    await logAudit({
      req,
      action: 'USER_ROLE_CHANGE',
      details: `Changed role of user ${targetUser.email} from ${oldRole} to ${role}`,
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update User Role Error:', error);
    res.status(500).json({ message: 'Server error updating user role' });
  }
};

/**
 * @desc    Toggle user account activation status (Admin only)
 * @route   PUT /api/auth/users/:id/status
 * @access  Private (Admin only)
 */
const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (isActive === undefined || typeof isActive !== 'boolean') {
    return res.status(400).json({ message: 'Please specify isActive status as a boolean.' });
  }

  // Prevent self-deactivation (self-lockout)
  if (id === req.user.id) {
    return res.status(400).json({ message: 'You cannot deactivate your own account.' });
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    });

    // Write action to Audit Log
    const statusText = isActive ? 'ACTIVATED' : 'DEACTIVATED';
    await logAudit({
      req,
      action: 'USER_STATUS_CHANGE',
      details: `User account ${targetUser.email} was ${statusText}`,
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update User Status Error:', error);
    res.status(500).json({ message: 'Server error toggling user status' });
  }
};

/**
 * @desc    Delete user account (Admin only)
 * @route   DELETE /api/auth/users/:id
 * @access  Private (Admin only)
 */
const deleteUser = async (req, res) => {
  const { id } = req.params;

  // Prevent deleting oneself
  if (id === req.user.id) {
    return res.status(400).json({ message: 'You cannot delete your own account.' });
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    await prisma.user.delete({ where: { id } });

    // Write action to Audit Log
    await logAudit({
      req,
      action: 'USER_DELETE',
      details: `Deleted user account for email: ${targetUser.email}`,
    });

    res.json({ message: 'User account deleted successfully' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
};

const debugAssistance = async (req, res) => {
  try {
    const records = await prisma.user.findMany().then(async () => {
      return prisma.assistanceRecord.findMany({
        include: {
          beneficiary: {
            select: { fullName: true }
          }
        }
      });
    });
    res.json(records);
  } catch (err) {
    console.error('Debug Assistance Error:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  changePassword,
  getUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  debugAssistance,
};

