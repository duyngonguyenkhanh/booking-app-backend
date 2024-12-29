const express = require('express');
const cors = require('cors');
const connectDB = require('./util/database');
const adminRoutes = require('./routes/adminRoutes');
const clientRoutes = require('./routes/clientRoutes');
const app = express();

// Middleware
app.use(express.json());

// Cấu hình middleware cors
app.use(cors());

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);

// Connect to MongoDB
connectDB();

// Start server
app.listen(5000, () => {
  console.log('Server is running on http://localhost:5000');
});
