const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

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

module.exports = router;