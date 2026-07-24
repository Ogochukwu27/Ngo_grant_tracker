// backend/src/controllers/auditController.js

const prisma = require('../config/db');

/**
 * @desc    Fetch audit log entries with pagination, search, and action filters
 * @route   GET /api/audit-logs
 * @access  Private (Admin only)
 */
const getAuditLogs = async (req, res) => {
  // 1. Parse pagination options from query params (default: page 1, 15 logs per page)
  const { page = 1, limit = 15, search, action } = req.query;

  try {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 15;
    const skip = (pageNum - 1) * limitNum; // Calculate offset for database query

    // 2. Build where filter conditions dynamically
    const where = {};

    // Search query: filters user name, user email, or event details case-insensitively
    if (search) {
      where.OR = [
        { userName: { contains: search, mode: 'insensitive' } },
        { userEmail: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Action filter: exact match filtering for specific events (e.g. "USER_LOGIN")
    if (action) {
      where.action = action;
    }

    // 3. Database transaction query
    // Runs both findMany (to fetch subset) and count (to get totals) in parallel for speed.
    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' }, // Newest actions appear first
        skip,
        take: limitNum,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // 4. Return paginated response structure
    res.json({
      logs,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Server error while fetching audit logs' });
  }
};

module.exports = { getAuditLogs };
