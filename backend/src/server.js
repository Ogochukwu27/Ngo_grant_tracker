// backend/src/server.js

// 1. Load environment variables from our .env file.
// This must be at the very top of the entry file!
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import our routes
const authRoutes = require('./routes/authRoutes');
const beneficiaryRoutes = require('./routes/beneficiaryRoutes');
const assistanceRoutes = require('./routes/assistanceRoutes');
const evidenceRoutes = require('./routes/evidenceRoutes');
const followUpRoutes = require('./routes/followUpRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const auditRoutes = require('./routes/auditRoutes');

// 2. Initialize the Express application
const app = express();

// 3. Mount Middlewares
// CORS (Cross-Origin Resource Sharing) allows requests from other domains 
// (e.g., our React frontend running on port 5173 to reach our Express API on port 5000)
app.use(cors());

// Express Built-in JSON Parser
// Without this middleware, req.body will be undefined! 
// It reads incoming raw JSON text in request bodies and converts it into a JavaScript object.
app.use(express.json());

// Expose the local uploads folder statically
// This means any request to http://localhost:5000/uploads/filename.jpg
// will fetch the file from our local 'backend/uploads' folder.
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 4. Mount Routes
// Any request starting with /api/auth will be redirected to the authRoutes router
app.use('/api/auth', authRoutes);
// Any request starting with /api/beneficiaries will be redirected to beneficiaryRoutes
app.use('/api/beneficiaries', beneficiaryRoutes);
// Mount assistance records routes
app.use('/api/assistance', assistanceRoutes);
// Mount evidence uploads routes
app.use('/api/evidence', evidenceRoutes);
// Mount follow-up and notification routes
app.use('/api/followups', followUpRoutes);
// Mount analytics dashboard routes
app.use('/api/analytics', analyticsRoutes);
// Mount audit log history routes (Guarded: Admin only)
app.use('/api/audit-logs', auditRoutes);

// Basic Health Check Endpoint
app.get('/', (req, res) => {
  res.json({ message: 'NGO Grant Tracker API is active and running!' });
});

// 5. Global Error Handling Middleware (Fallback)
// If any of our controllers crash or throw an error, they will fall into this middleware
// which prevents the server from crashing completely and returns a clean error response.
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    message: 'Something went wrong on the server!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message,
  });
});

// 6. Start the server listening on our port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(` Server is running on: http://localhost:${PORT}`);
  console.log(` Database: Connected via Prisma to PostgreSQL`);
  console.log(`=============================================`);
});
