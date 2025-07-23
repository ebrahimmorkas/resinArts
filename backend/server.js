const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173', // frontend origin
  credentials: true               // required for cookies
}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("Connected to database"))
.catch(err => console.log("Problem in connection with database `${err}`"))

app.get('/api/auth/me', (req, res) => {
    console.log("Request received");
    const token = req.cookies.token;
    console.log(token)
    if(!token) {
        return res.status(401).json({
            message: "User not logged in",
        });
    }
    else {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return res.status(200).json({
                message: "User logged in",
                user: decoded
            });
        } catch(err) {
            return res.status(401).json({
                message: "User not logged in",
            });
        }
    }
})

app.post('/register', (req, res) => {
    console.log("Debug success");
})

// Login and Signup routes
app.use('/api/auth', authRoutes);
// Categories routes
app.use('/api/category', categoryRoutes);

app.listen(3000, () => console.log("Server running on port 3000"));