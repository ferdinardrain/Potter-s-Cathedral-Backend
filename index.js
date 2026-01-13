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
  origin: process.env.FRONTEND_URL || '*', // Allow frontend URL from env variable
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



// Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);



// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
