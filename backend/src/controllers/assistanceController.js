// backend/src/controllers/assistanceController.js

const prisma = require('../config/db');

/**
 * @desc    Log a new assistance record for a beneficiary
 * @route   POST /api/assistance
 * @access  Private (NGO Staff/Admin only)
 */
const createAssistance = async (req, res) => {
  const { amount, purpose, category, notes, beneficiaryId, dateGiven } = req.body;

  // 1. Basic Validation
  if (!amount || !purpose || !category || !beneficiaryId) {
    return res.status(400).json({
      message: 'Please provide all required fields (amount, purpose, category, beneficiaryId)',
    });
  }

  try {
    // 2. Verify that the target Beneficiary exists in the database
    // Otherwise, we would violate the Foreign Key database constraint!
    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id: beneficiaryId },
    });

    if (!beneficiary) {
      return res.status(404).json({ message: 'Target beneficiary record not found' });
    }

    // 3. Create the assistance record
    const record = await prisma.assistanceRecord.create({
      data: {
        amount: parseFloat(amount),
        purpose,
        category,
        notes: notes || null,
        beneficiaryId,
        dateGiven: dateGiven ? new Date(dateGiven) : new Date(), // Default to today
      },
    });

    res.status(201).json(record);
  } catch (error) {
    console.error('Error creating assistance record:', error);
    res.status(500).json({ message: 'Server error while logging assistance record' });
  }
};

/**
 * @desc    Get all logged assistance records with optional beneficiary filtering
 * @route   GET /api/assistance
 * @access  Private
 */
const getAssistanceRecords = async (req, res) => {
  const { beneficiaryId, category } = req.query;

  try {
    const where = {};
    if (beneficiaryId) {
      where.beneficiaryId = beneficiaryId;
    }
    if (category) {
      where.category = category;
    }

    // Retrieve assistance records and include brief beneficiary profile details (join query)
    const records = await prisma.assistanceRecord.findMany({
      where,
      orderBy: { dateGiven: 'desc' },
      include: {
        beneficiary: {
          select: {
            fullName: true,
            location: true,
          },
        },
      },
    });

    res.json(records);
  } catch (error) {
    console.error('Error fetching assistance records:', error);
    res.status(500).json({ message: 'Server error while fetching assistance records' });
  }
};

/**
 * @desc    Edit an existing assistance log entry
 * @route   PUT /api/assistance/:id
 * @access  Private
 */
const updateAssistance = async (req, res) => {
  const { id } = req.params;
  const { amount, purpose, category, notes, dateGiven } = req.body;

  try {
    // 1. Confirm that this record exists in our database
    const existingRecord = await prisma.assistanceRecord.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      return res.status(404).json({ message: 'Assistance record not found' });
    }

    // 2. Perform updates
    const updatedRecord = await prisma.assistanceRecord.update({
      where: { id },
      data: {
        amount: amount ? parseFloat(amount) : undefined,
        purpose: purpose || undefined,
        category: category || undefined,
        notes: notes !== undefined ? notes : undefined,
        dateGiven: dateGiven ? new Date(dateGiven) : undefined,
      },
    });

    res.json(updatedRecord);
  } catch (error) {
    console.error('Error updating assistance record:', error);
    res.status(500).json({ message: 'Server error while updating assistance log' });
  }
};

module.exports = {
  createAssistance,
  getAssistanceRecords,
  updateAssistance,
};
