// backend/src/config/upload.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Configure Multer Local Disk Storage
 * This tells Multer where to save the files locally on the server disk
 * and what to name them.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // We define our local uploads folder in backend/uploads
    const uploadPath = path.join(__dirname, '../../uploads');
    
    // Check if the directory exists, if not, create it automatically!
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename: fieldname + timestamp + random number + original extension
    // E.g., evidence-1780928913-9823129.pdf
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

/**
 * File Type Filter Middleware
 * Limits what file types the server accepts for safety (no executables, etc.)
 */
const fileFilter = (req, file, cb) => {
  // Define allowed extensions
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.pdf', '.doc', '.docx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Only images (PNG, JPG, JPEG), PDFs, and text/doc documents are allowed!'), false); // Reject
  }
};

// Initialize multer middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

module.exports = upload;
