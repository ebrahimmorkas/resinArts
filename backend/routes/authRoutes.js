const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Route for registering the new user
router.post('/register', async (req, res) => {
    console.log("Request received")
    const {first_name, middle_name, last_name, email, phone_number, state, city, address, password, confirm_password} = req.body;
try {
    const existingEmail = await User.findOne({email});
    if(existingEmail) {
        // email already exists
        console.log("Email exists")
        return res.status(400).json({message: "Email has already been taken"});
    } else{
        console.log("Email not exists checking phone")
        const existingPhoneNumber = await User.findOne({phone_number});
        if(existingPhoneNumber) {
            // Phone number aready exists
            console.log("Phone exists")
            return res.status(400).json({message: 'Phone number has already been taken'});
        }
        else{
            // User does not exits create the new user
            console.log("Adding new user")
                try {
                    const saltRounds = 10;
                    const hashedPassword = await bcrypt.hash(password, saltRounds);
                    
                    const newUser = new User({first_name, middle_name, last_name, state, city, address, email, phone_number, password: hashedPassword});
                    await newUser.save();
                    console.log("User added successfully")
                    return res.status(200).json({message: "User created successfully"});
                } catch(err) {
                    console.log("error in hashing");
                    return res.status(500).json({message: 'Internal server error'});
                }
        }
    }
} catch(err) {
    return res.status(500).json({message: "Server error"});
}
})

router.post('/login', async (req, res) => {
    console.log(req.body.email);
    console.log("Request received for login");
    const {email, password} = req.body;
    try{
        const user = await User.findOne({email});

        if(user && await bcrypt.compare(password, user.password)) {
            // email is present and password is correct
            console.log("Login");
            const token = jwt.sign({
                id: user._id,
                iat: Math.floor(Date.now() / 1000),  // issued at
                type: 'access',     
            },
            process.env.JWT_SECRET,
            {expiresIn: '15d'}
        );

        // Setting cookies:
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'Strict',
            maxAge: 15 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
  message: 'Login successful',
  user: {
    id: user._id,
    name: user.first_name + " " + user.middle_name + " " + user.last_name,
    email: user.email,
    role: user.role
  }
});
        } 
        else {
            // email is not present
            console.log("Email or password is wrong");
        }
    } catch(err) {
        console.log(err);
    }
})

module.exports = router;