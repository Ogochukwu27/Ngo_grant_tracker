const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Check if Cloudinary environment variables are configured in the .env file
const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  // Initialize Cloudinary SDK configuration
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const prisma = require('../config/db');
const { logAudit } = require('../config/auditLogger');

/**
 * @desc    Create a new beneficiary record
 * @route   POST /api/beneficiaries
 * @access  Private (NGO Staff/Admin only)
 */
const createBeneficiary = async (req, res) => {
  const { fullName, phoneNumber, email, location, category, description } = req.body;

  // 1. Basic validation - ensure all required fields are provided
  if (!fullName || !phoneNumber || !location || !category || !description) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'Please provide all required fields (fullName, phoneNumber, location, category, description)' });
  }

  // 2. File upload validation (Mandatory)
  if (!req.file) {
    return res.status(400).json({ message: 'No case evidence document uploaded. Please upload a supporting document to register a beneficiary.' });
  }

  try {
    // 3. Create the beneficiary in PostgreSQL
    const beneficiary = await prisma.beneficiary.create({
      data: {
        fullName,
        phoneNumber,
        email: email || null, // Optional field
        location,
        category,
        description,
        status: 'ACTIVE', // All newly registered cases start as ACTIVE
      },
    });

    const localTempPath = req.file.path;
    let fileUrl = `/uploads/${req.file.filename}`;
    let cloudinaryId = null;

    // 4. Handle Cloudinary Upload
    if (isCloudinaryConfigured) {
      try {
        console.log('☁️ Uploading case evidence to Cloudinary...');
        const result = await cloudinary.uploader.upload(localTempPath, {
          folder: 'ngo_grant_tracker',
          resource_type: 'auto',
        });
        fileUrl = result.secure_url;
        cloudinaryId = result.public_id;
        fs.unlinkSync(localTempPath);
      } catch (cloudErr) {
        console.warn('⚠️ Cloudinary upload failed. Falling back to local disk:', cloudErr.message);
      }
    }

    // 5. Store evidence in the database
    await prisma.evidence.create({
      data: {
        fileName: req.file.originalname,
        fileUrl: fileUrl,
        fileType: req.file.mimetype,
        cloudinaryId: cloudinaryId,
        beneficiaryId: beneficiary.id,
      },
    });

    // Write action to Audit Log
    await logAudit({
      req,
      action: 'CREATE_BENEFICIARY',
      details: `Created beneficiary profile: ${beneficiary.fullName} (ID: ${beneficiary.id})`,
    });

    res.status(201).json(beneficiary);
  } catch (error) {
    console.error('Error creating beneficiary:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error while creating beneficiary record' });
  }
};

/**
 * @desc    Get all beneficiaries with optional search and filters
 * @route   GET /api/beneficiaries
 * @access  Private
 */
const getBeneficiaries = async (req, res) => {
  // Query parameters are key-value pairs added to the end of a URL after a question mark:
  // Example: /api/beneficiaries?status=ACTIVE&search=John
  // Express parses these into req.query
  const { search, category, status, startDate, endDate } = req.query;

  try {
    // We build a dynamic query filter object called 'where'.
    // If a filter is provided in the URL, we add it to the 'where' object.
    const where = {};

    // 1. Search filter: Matches names containing the search term.
    // 'contains' creates a SQL 'LIKE' query.
    // 'mode: insensitive' makes it case-insensitive (matching "john", "JOHN", "John").
    if (search) {
      where.fullName = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // 2. Category filter: Exact match (e.g. "Medical assistance")
    if (category) {
      where.category = category;
    }

    // 3. Status filter: Exact match (e.g. "ACTIVE", "INACTIVE", "RESOLVED")
    if (status) {
      where.status = status;
    }

    // 4. Date Range filter: Matches registration date within a start and end date.
    // 'gte' = Greater Than or Equal to (Start Date)
    // 'lte' = Less Than or Equal to (End Date)
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Fetch matching records from the database, ordered by newest first
    const beneficiaries = await prisma.beneficiary.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(beneficiaries);
  } catch (error) {
    console.error('Error fetching beneficiaries:', error);
    res.status(500).json({ message: 'Server error while fetching beneficiaries' });
  }
};

/**
 * @desc    Get a single beneficiary by ID with their complete case history
 * @route   GET /api/beneficiaries/:id
 * @access  Private
 */
const getBeneficiaryById = async (req, res) => {
  // req.params maps placeholders in the route URL.
  // Example: in route '/api/beneficiaries/:id', req.params.id gets the value of :id
  const { id } = req.params;

  try {
    // Fetch the beneficiary by ID and include their related records
    // This is equivalent to performing a JOIN in raw SQL.
    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id },
      include: {
        assistance: true, // Pulls their history of financial assistance
        evidence: true,   // Pulls their uploaded documents
        followUps: true,  // Pulls their Scheduled follow-ups
      },
    });

    if (!beneficiary) {
      return res.status(404).json({ message: 'Beneficiary record not found' });
    }

    res.json(beneficiary);
  } catch (error) {
    console.error('Error fetching beneficiary details:', error);
    res.status(500).json({ message: 'Server error while retrieving beneficiary details' });
  }
};

/**
 * @desc    Update a beneficiary's profile information
 * @route   PUT /api/beneficiaries/:id
 * @access  Private
 */
const updateBeneficiary = async (req, res) => {
  const { id } = req.params;
  const { fullName, phoneNumber, email, location, category, description, status } = req.body;

  try {
    // 1. Confirm the beneficiary exists
    const existingBeneficiary = await prisma.beneficiary.findUnique({
      where: { id },
    });

    if (!existingBeneficiary) {
      return res.status(404).json({ message: 'Beneficiary record not found' });
    }

    // 2. Perform the update
    const updatedBeneficiary = await prisma.beneficiary.update({
      where: { id },
      data: {
        fullName: fullName || undefined,
        phoneNumber: phoneNumber || undefined,
        email: email !== undefined ? email : undefined,
        location: location || undefined,
        category: category || undefined,
        description: description || undefined,
        status: status || undefined, // Can update status between "ACTIVE", "INACTIVE", "RESOLVED"
      },
    });

    // Write action to Audit Log
    await logAudit({
      req,
      action: 'UPDATE_BENEFICIARY',
      details: `Updated beneficiary profile for: ${updatedBeneficiary.fullName} (ID: ${updatedBeneficiary.id})`,
    });

    res.json(updatedBeneficiary);
  } catch (error) {
    console.error('Error updating beneficiary:', error);
    res.status(500).json({ message: 'Server error while updating beneficiary record' });
  }
};

/**
 * @desc    Delete a beneficiary record (and all cascade related records)
 * @route   DELETE /api/beneficiaries/:id
 * @access  Private (Often restricted to ADMIN users only)
 */
const deleteBeneficiary = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Confirm the beneficiary exists
    const existingBeneficiary = await prisma.beneficiary.findUnique({
      where: { id },
    });

    if (!existingBeneficiary) {
      return res.status(404).json({ message: 'Beneficiary record not found' });
    }

    // 2. Delete the record
    // Because of 'onDelete: Cascade' in schema.prisma, deleting the beneficiary
    // will automatically wipe out all their linked assistance, evidence, and follow-ups.
    await prisma.beneficiary.delete({
      where: { id },
    });

    // Write action to Audit Log
    await logAudit({
      req,
      action: 'DELETE_BENEFICIARY',
      details: `Deleted beneficiary profile and all linked records for: ${existingBeneficiary.fullName} (ID: ${id})`,
    });

    res.json({ message: 'Beneficiary record and all associated records deleted successfully' });
  } catch (error) {
    console.error('Error deleting beneficiary:', error);
    res.status(500).json({ message: 'Server error while deleting beneficiary record' });
  }
};

module.exports = {
  createBeneficiary,
  getBeneficiaries,
  getBeneficiaryById,
  updateBeneficiary,
  deleteBeneficiary,
};
