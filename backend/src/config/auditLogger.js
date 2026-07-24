// backend/src/config/auditLogger.js

const prisma = require('./db');

/**
 * Audit Log Helper
 * This function saves administrative and status actions in the AuditLog database table.
 * It is designed to be reusable across all backend controllers.
 * 
 * @param {Object} params
 * @param {Object} [params.req] - Express request object. If passed, the helper will automatically extract the user context and IP address.
 * @param {String} [params.userId] - Optional fallback user ID if req is not available.
 * @param {String} [params.userName] - Optional fallback user name if req is not available.
 * @param {String} [params.userEmail] - Optional fallback user email if req is not available.
 * @param {String} [params.userRole] - Optional fallback user role if req is not available.
 * @param {String} params.action - The type of action performed (e.g. "USER_LOGIN", "CREATE_BENEFICIARY")
 * @param {String} params.details - Detailed human-readable description of what was done.
 */
const logAudit = async ({ req, userId, userName, userEmail, userRole, action, details }) => {
  try {
    // 1. Resolve User details.
    // If a request object `req` is provided, we read the authenticated user's details attached by authMiddleware.
    // Otherwise, we fall back to the explicitly passed values (e.g., during registration before req.user is set).
    const actorId = userId || req?.user?.id || null;
    const actorName = userName || req?.user?.name || 'System';
    const actorEmail = userEmail || req?.user?.email || 'system@ngotracker.org';
    const actorRole = userRole || req?.user?.role || 'SYSTEM';

    // 2. Resolve Client IP address.
    // Standard proxy check: 'x-forwarded-for' header holds the IP if behind a reverse proxy (like Render or Vercel).
    // Fallback: req.socket.remoteAddress is the direct connection IP.
    const ipAddress = req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || null;

    // 3. Save Log to database.
    await prisma.auditLog.create({
      data: {
        userId: actorId,
        userName: actorName,
        userEmail: actorEmail,
        userRole: actorRole,
        action,
        details,
        ipAddress,
      },
    });

    console.log(`📋 Audit Logged: [${action}] by ${actorEmail} - ${details}`);
  } catch (error) {
    console.error('❌ Failed to write audit log in database:', error.message);
  }
};

module.exports = { logAudit };
