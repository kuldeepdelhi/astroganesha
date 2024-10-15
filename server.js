const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const cors = require('cors');

dotenv.config();

connectDB();

const app = express();
app.use(cors()); // Enable CORS for all origins
app.use(express.json()); // Parse JSON bodies

app.use('/api', authRoutes); // Mount auth routes on /api

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
