// backend/src/controllers/analyticsController.js

const prisma = require('../config/db');

/**
 * @desc    Get high-level summary KPIs (Totals, Cases counts, Alerts)
 * @route   GET /api/analytics/stats
 * @access  Private
 */
const getDashboardStats = async (req, res) => {
  try {
    // 1. Get count of total beneficiaries registered
    const totalBeneficiaries = await prisma.beneficiary.count();

    // 2. Sum the total funds disbursed across all assistance logs
    // We use Prisma's aggregate function with the '_sum' operator
    const fundsDisbursedAggregation = await prisma.assistanceRecord.aggregate({
      _sum: {
        amount: true,
      },
    });
    // If the database has no records, _sum.amount will be null. We fall back to 0.
    const totalFundsDisbursed = fundsDisbursedAggregation._sum.amount || 0;

    // 3. Count ACTIVE cases
    const activeCases = await prisma.beneficiary.count({
      where: { status: 'ACTIVE' },
    });

    // 4. Count COMPLETED/RESOLVED cases
    const completedCases = await prisma.beneficiary.count({
      where: { status: 'RESOLVED' },
    });

    // 5. Count upcoming PENDING follow-ups
    const upcomingFollowUps = await prisma.followUp.count({
      where: { status: 'PENDING' },
    });

    // Send back the summarized dashboard statistics object
    res.json({
      totalBeneficiaries,
      totalFundsDisbursed,
      activeCases,
      completedCases,
      upcomingFollowUps,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error while calculating dashboard stats' });
  }
};

/**
 * @desc    Group and sum all disbursements by category (for Pie/Bar Charts)
 * @route   GET /api/analytics/spending-by-category
 * @access  Private
 */
const getSpendingByCategory = async (req, res) => {
  try {
    // Prisma's groupBy allows us to group records by columns and run aggregations on them.
    // This is equivalent to SQL: SELECT category, SUM(amount) FROM "AssistanceRecord" GROUP BY category;
    const groups = await prisma.assistanceRecord.groupBy({
      by: ['category'],
      _sum: {
        amount: true,
      },
    });

    // Format the response array to make it clean for frontend chart rendering
    const formatted = groups.map((item) => ({
      category: item.category,
      totalAmount: item._sum.amount || 0,
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error calculating spending by category:', error);
    res.status(500).json({ message: 'Server error while calculating spending by category' });
  }
};

/**
 * @desc    Group spending trends month-by-month (for Line/Area Charts)
 * @route   GET /api/analytics/spending-by-month
 * @access  Private
 */
const getSpendingByMonth = async (req, res) => {
  try {
    // 1. Fetch only the amount and date fields from all assistance records
    const records = await prisma.assistanceRecord.findMany({
      select: {
        amount: true,
        dateGiven: true,
      },
    });

    // 2. Group the data by month in JavaScript.
    // This approach is much easier for beginners to read and works on any SQL server
    // without writing platform-specific database function calls.
    const monthlyGroups = {};

    records.forEach((record) => {
      const date = new Date(record.dateGiven);
      // Format: YYYY-MM (e.g. "2026-06")
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyGroups[yearMonth]) {
        monthlyGroups[yearMonth] = 0;
      }
      
      monthlyGroups[yearMonth] += record.amount;
    });

    // 3. Convert the key-value dictionary into a sorted array of objects
    const formatted = Object.keys(monthlyGroups)
      .sort() // Sorts chronologically, e.g. "2026-05" before "2026-06"
      .map((key) => ({
        month: key,
        totalAmount: monthlyGroups[key],
      }));

    res.json(formatted);
  } catch (error) {
    console.error('Error calculating spending by month:', error);
    res.status(500).json({ message: 'Server error while calculating spending by month' });
  }
};

/**
 * @desc    Purge all dynamic database records (for clean start/reset)
 * @route   POST /api/analytics/purge-test-data
 * @access  Private
 */
const purgeTestData = async (req, res) => {
  try {
    // Delete in reverse order of dependencies (cascade is enabled, but standard deletion is safest)
    await prisma.notification.deleteMany();
    await prisma.followUp.deleteMany();
    await prisma.evidence.deleteMany();
    await prisma.assistanceRecord.deleteMany();
    await prisma.beneficiary.deleteMany();

    res.json({ message: 'All demo and test data has been successfully purged from the database.' });
  } catch (error) {
    console.error('Error purging database test data:', error);
    res.status(500).json({ message: 'Server error while resetting database data' });
  }
};

module.exports = {
  getDashboardStats,
  getSpendingByCategory,
  getSpendingByMonth,
  purgeTestData,
};
