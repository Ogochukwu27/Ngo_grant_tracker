// backend/src/controllers/evidenceController.js

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const prisma = require('../config/db');

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

/**
 * @desc    Upload an evidence file (Image, PDF, Document) and link it to a beneficiary
 * @route   POST /api/evidence
 * @access  Private (NGO Staff/Admin only)
 */
const uploadEvidence = async (req, res) => {
  const { beneficiaryId } = req.body;

  // 1. Check if a file was actually uploaded by Multer
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded. Please upload a valid document or image' });
  }

  // 2. Check if a beneficiary ID was provided
  if (!beneficiaryId) {
    // If validation fails, we should delete the local file Multer saved to avoid wasting disk space!
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'Please provide a beneficiaryId to link this evidence to' });
  }

  try {
    // 3. Confirm target beneficiary exists in PostgreSQL
    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id: beneficiaryId },
    });

    if (!beneficiary) {
      fs.unlinkSync(req.file.path); // Clean up uploaded file
      return res.status(404).json({ message: 'Target beneficiary record not found' });
    }

    const localTempPath = req.file.path; // Absolute path to the locally saved file
    let fileUrl = `/uploads/${req.file.filename}`; // Default URL pointing to local server assets
    let cloudinaryId = null;

    // 4. Handle Cloudinary Upload if keys are available
    if (isCloudinaryConfigured) {
      try {
        console.log('☁️ Uploading to Cloudinary...');
        const result = await cloudinary.uploader.upload(localTempPath, {
          folder: 'ngo_grant_tracker', // Put files in this folder in your Cloudinary console
          resource_type: 'auto',       // Automatically detect file type (PDF, image, doc)
        });

        fileUrl = result.secure_url;   // Cloudinary public HTTPS url
        cloudinaryId = result.public_id; // Unique cloud asset reference ID (needed for deletion)

        // Clean up: Delete the local temporary file from our backend folder
        // now that it has been safely uploaded to Cloudinary
        fs.unlinkSync(localTempPath);
        console.log('✅ Cloudinary upload complete, local temp file deleted.');
      } catch (cloudErr) {
        console.warn('⚠️ Cloudinary upload failed. Falling back to local disk storage:', cloudErr.message);
        // Do NOT delete localTempPath here, as we fall back to using it on the server disk!
      }
    } else {
      console.log('💾 Cloudinary credentials missing. Saved evidence to local disk storage.');
    }

    // 5. Store the evidence file link in the database
    const evidence = await prisma.evidence.create({
      data: {
        fileName: req.file.originalname,
        fileUrl: fileUrl,
        fileType: req.file.mimetype,
        cloudinaryId: cloudinaryId,
        beneficiaryId: beneficiaryId,
      },
    });

    res.status(201).json(evidence);
  } catch (error) {
    console.error('Error uploading evidence:', error);
    // Safety check: delete the file if anything failed in our Prisma queries
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error while uploading evidence record' });
  }
};

/**
 * @desc    Get all evidence uploads with optional beneficiary filter
 * @route   GET /api/evidence
 * @access  Private
 */
const getEvidence = async (req, res) => {
  const { beneficiaryId } = req.query;

  try {
    const where = {};
    if (beneficiaryId) {
      where.beneficiaryId = beneficiaryId;
    }

    const files = await prisma.evidence.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(files);
  } catch (error) {
    console.error('Error fetching evidence:', error);
    res.status(500).json({ message: 'Server error while fetching evidence' });
  }
};

/**
 * @desc    Delete an evidence record and its corresponding physical file
 * @route   DELETE /api/evidence/:id
 * @access  Private
 */
const deleteEvidence = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Confirm that this evidence record exists in PostgreSQL
    const evidence = await prisma.evidence.findUnique({
      where: { id },
    });

    if (!evidence) {
      return res.status(404).json({ message: 'Evidence record not found' });
    }

    // 2. Delete the physical file from where it is stored
    if (evidence.cloudinaryId) {
      // Delete from Cloudinary
      if (isCloudinaryConfigured) {
        console.log(`☁️ Deleting asset from Cloudinary: ${evidence.cloudinaryId}`);
        await cloudinary.uploader.destroy(evidence.cloudinaryId);
      }
    } else {
      // Delete from local server uploads/ folder
      // The fileUrl looks like: "/uploads/evidence-17809281.jpg"
      // We extract the filename using path.basename
      const filename = path.basename(evidence.fileUrl);
      const localFilePath = path.join(__dirname, '../../uploads', filename);

      if (fs.existsSync(localFilePath)) {
        console.log(`💾 Deleting local file: ${localFilePath}`);
        fs.unlinkSync(localFilePath);
      }
    }

    // 3. Delete the record from PostgreSQL
    await prisma.evidence.delete({
      where: { id },
    });

    res.json({ message: 'Evidence record and file successfully deleted' });
  } catch (error) {
    console.error('Error deleting evidence:', error);
    res.status(500).json({ message: 'Server error while deleting evidence record' });
  }
};

module.exports = {
  uploadEvidence,
  getEvidence,
  deleteEvidence,
};
