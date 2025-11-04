const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
require('dotenv').config();

// Route for registering the new user
router.post('/register', async (req, res) => {
    console.log("Request received")
    const {first_name, middle_name, last_name, email, phone_number, whatsapp_number, state, city, zip_code, address, password, confirm_password} = req.body;
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
            const existingWhatsappNumber = await User.findOne({whatsapp_number});
            if(existingWhatsappNumber) {
                return res.status(400).json({message: 'Whatsapp number has already been taken'});
            }
            // User does not exits create the new user
            console.log("Adding new user")
                try {
                    const saltRounds = 10;
                    const hashedPassword = await bcrypt.hash(password, saltRounds);
                    
                    const newUser = new User({first_name, middle_name, last_name, state, city, address, email, phone_number, whatsapp_number, password: hashedPassword, zip_code});
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
    const {email, password} = req.body;
    try{
        const user = await User.findOne({email}).select('+password');

        if(user && await bcrypt.compare(password, user.password)) {
            // email is present and password is correct
            console.log("Login");
            const token = jwt.sign({
                id: user._id,
                role: user.role,
                iat: Math.floor(Date.now() / 1000),
                type: 'access',    
            },
            process.env.JWT_SECRET,
            {expiresIn: '8h'}
        );

        // Setting cookies:
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 15 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.first_name + " " + user.middle_name + " " + user.last_name,
                email: user.email,
                phone_number: user.phone_number,
                whatsapp_number: user.whatsapp_number,
                role: user.role
            }
        });
        } 
        else {
            return res.status(401).json({message: "Invalid credentials"});
        }
    } catch(err) {
        return res.status(500).json({message: "Server Problem. Please try again after sometime"})
    }
})

// Route for logout
router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
    });
    res.status(200).json({
        message: "Logout successful",
    })
})

// Route for forgot password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    
    try {
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ message: "No account found with this email address" });
        }

        // Generate reset token (plain, not hashed yet)
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Hash the token before saving to database
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        
        // Set token and expiry (1 hour from now)
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        console.log('Generated Reset Token (plain):', resetToken);
        console.log('Hashed Token (saved in DB):', hashedToken);
        console.log('Token Expires At:', new Date(user.resetPasswordExpires));

        // Create reset URL with PLAIN token (not hashed)
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/reset-password/${resetToken}`;

        // Email message
        const message = `Hello ${user.first_name},

You requested a password reset for your Mouldmarket account.

Please click on the following link to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you did not request this password reset, please ignore this email and your password will remain unchanged.

Best regards,
Mouldmarket Team`;

        try {
            await sendEmail(user.email, 'Password Reset Request - Mouldmarket', message);
            
            return res.status(200).json({ 
                message: "Password reset link has been sent to your email address" 
            });
        } catch (emailError) {
            // If email fails, remove the token from database
            user.resetPasswordToken = null;
            user.resetPasswordExpires = null;
            await user.save();
            
            console.error('Email sending error:', emailError);
            return res.status(500).json({ 
                message: "Error sending email. Please try again later." 
            });
        }
    } catch (err) {
        console.error('Forgot password error:', err);
        return res.status(500).json({ message: "Server error. Please try again later." });
    }
});

// Route for reset password
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        console.log('Received token from URL:', token);
        
        // Hash the token from URL to compare with database
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        console.log('Hashed token to compare:', hashedToken);

        // Find user with valid token and not expired
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        }).select('+password');

        console.log('User found:', user ? 'Yes' : 'No');
        if (user) {
            console.log('Token in DB:', user.resetPasswordToken);
            console.log('Token Expiry:', new Date(user.resetPasswordExpires));
            console.log('Current Time:', new Date(Date.now()));
        }

        if (!user) {
            return res.status(400).json({ 
                message: "Password reset token is invalid or has expired. Please request a new password reset link." 
            });
        }

        // Hash the new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Update user password and clear reset token fields
        user.password = hashedPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        console.log('Password reset successful for user:', user.email);

        return res.status(200).json({ 
            message: "Password has been reset successfully. You can now login with your new password." 
        });
    } catch (err) {
        console.error('Reset password error:', err);
        return res.status(500).json({ message: "Server error. Please try again later." });
    }
});

module.exports = router;