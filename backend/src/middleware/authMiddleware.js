// backend/src/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

/**
 * Protect Routes Middleware
 * This function intercepts requests to protected endpoints, verifies the JWT,
 * and attaches the authenticated user's information to the request object.
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Check if the token is present in the Authorization header
  // Standard format: "Authorization: Bearer <token_string>"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get the token from the header by splitting "Bearer <token>" and taking the second part
      token = req.headers.authorization.split(' ')[1];

      // 2. Verify the token using our secret key
      // If the token is invalid or expired, jwt.verify will throw an error and we go to the catch block.
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Find the user in the database based on the ID inside the token payload.
      // We exclude the password from the fetched data for security reasons.
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true, // Select active status to enforce deactivation checks
          createdAt: true,
        },
      });

      // If the user no longer exists in the database
      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // If the user is deactivated, block all request activity immediately
      if (!user.isActive) {
        return res.status(403).json({ message: 'Not authorized, account is deactivated' });
      }

      // 4. Attach the user object to the request (req.user)
      // This makes req.user available to any controller that runs after this middleware!
      req.user = user;

      // Move on to the next middleware or route handler
      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // If no token was found at all in the header
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

/**
 * Role-Based Access Control Guard Middleware
 * This checks if the user's role is one of the allowed roles for this endpoint.
 * Always chain this AFTER the `protect` middleware!
 * 
 * @param {Array<String>} allowedRoles - List of authorized roles (e.g. ['ADMIN', 'STAFF'])
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // 1. Ensure the user object was attached by `protect`
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no user context' });
    }

    // 2. Validate active role exists in allowed list
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
    }

    // 3. Authorized! Move to the next middleware/controller
    next();
  };
};

module.exports = { protect, requireRole };

