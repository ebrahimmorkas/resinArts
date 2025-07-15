const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("Connected to database"))
.catch(err => console.log("Problem in connection with database `${err}`"))

app.get('/', (req, res) => {
    res.send("This is home page");
})

app.post('/register', (req, res) => {
    console.log("Debug success");
})

app.use('/api/auth', authRoutes);

app.listen(3000, () => console.log("Server running on port 3000"));