require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const memberRoutes = require('./routes/members');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

const path = require('path');

// Middleware
const corsOptions = {
  origin: (origin, callback) => {
    const frontendUrl = process.env.FRONTEND_URL || '*';

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if it matches exactly
    if (frontendUrl === '*' || origin === frontendUrl) {
      return callback(null, true);
    }

    // Robust check: If env var is "domain.com", match "https://domain.com"
    if (frontendUrl.indexOf('http') === -1) {
      if (origin === `https://${frontendUrl}` || origin === `http://${frontendUrl}`) {
        return callback(null, true);
      }
    }

    // If we get here, it might be a valid CORS error, but for debugging let's be permissive if likely match
    if (origin.includes(frontendUrl)) {
      return callback(null, true);
    }

    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



// Health check route
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Potter\'s Cathedral Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);



// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
