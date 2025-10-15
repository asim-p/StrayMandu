const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require("./routes/authRoutes");
const dogRoutes = require("./routes/dogRoutes");

connectDB();

const app = express();
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send("Backend is working!");
});

//Routes
app.use('/api/users', authRoutes);
app.use('/api/dogs', dogRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


//mongod --dbpath=D:\afai\data\stray