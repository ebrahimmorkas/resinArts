const User = require('../models/User');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const Bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const findUser = async (req, res) => {
    try {
        // console.log(req.body);
        const {userId} = req.body;
        console.log(userId);
        if(!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            // UserId is not valid
            return res.status(400).json({message: "Invalid User ID from reqbody"})
        } else {
            // User ID is valid

            // Checking whether the user exists
            try {
                const user = await User.findById(userId);
                if(user) {
                    // Fetch the orders
                    const userAddress = {
                        state: user.state,
                        city: user.city,
                        zipCode: user.zip_code,
                        address: user.address,
                    }
                    try {
                        const orders = await Order.find({user_id: userId});
                        // console.log(orders)
                        if(orders && orders.length != 0) {
                            // console.log(orders)
                            return res.status(200).json(
                                {
                                    message: "Orders Fetched",
                                    orders: orders,
                                    userAddress
                                }
                            )
                        } else {
                            // User has not ordered anything
                            return res.status(200).json({message: "No orders placed"});
                        }
                    } catch (error) {
                        return res.status(400).json({message: "Problem while fetching orders"});
                    }
                    
                } else {
                    // User not found
                    return res.status(400).json({message: "Invalid User ID from else"});
                }
            } catch (error) {
                return res.status(400).json({message: "Invalid User ID from catch"});
            }
        }
    } catch(error) {
        return res.status(500).json({message: "Server problem"});
    }
}

const fetchUsers = async (req, res) => {
    console.log("Request received fro fetching the users");
    try {
        const users = await User.find({});

        if(!users || users.length == 0) {
            console.log("Inside first if block");
            return res.status(200).json({
                message: "No users found",
            });
        }
        console.log(users);
        return res.status(200).json(
            {
                message: "Users fetched successfully",
                users
            }
        )
    } catch(error) {
        console.log("Inside catch block");
        console.log(error.message);
        return res.status(400).json(
            {
                message: "Error fetching users",
                error: error.message,
            }
        );
    }   
};

// This function will be used buy other controllers to check whether the user esxists or not
const findUserById = async (userId) => {
  try {
    const user = await User.findById(userId);
    return user; // will be null if not found
  } catch (err) {
    throw new Error("Error while finding user: " + err.message);
  }
};

const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id; // From authenticate middleware
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid User ID' });
        }
        const user = await User.findById(userId).select('-password -__v');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({
            message: 'User profile fetched successfully',
            user
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({ message: 'Server error while fetching profile' });
    }
};

// Update user profile
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id; // From authenticate middleware
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid User ID' });
        }

        // Check if req.body exists
        if (!req.body) {
            return res.status(400).json({ message: 'Request body is empty' });
        }

        const {
            first_name,
            middle_name,
            last_name,
            email,
            phone_number,
            whatsapp_number,
            address,
            city,
            state,
            zip_code,
            password
        } = req.body;
    // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields if provided
        if (first_name) user.first_name = first_name;
        if (middle_name !== undefined) user.middle_name = middle_name; // Allow empty string
        if (last_name) user.last_name = last_name;
        if (email) user.email = email;
        if (phone_number) user.phone_number = phone_number;
        if (whatsapp_number) user.whatsapp_number = whatsapp_number;
        if (address) user.address = address;
        if (city) user.city = city;
        if (state) user.state = state;
        if (zip_code) user.zip_code = zip_code;

        // Update password if provided
        if (password) {
            const salt = await Bcrypt.genSalt(10);
            user.password = await Bcrypt.hash(password, salt);
        }

        // Save updated user
        await user.save();

        // Return updated user (excluding password)
        const updatedUser = await User.findById(userId).select('-password -__v');
        return res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        return res.status(500).json({ message: 'Server error while updating profile' });
    }
};

// Update admin profile (Company settings and these are totally different)
const updateAdminProfile = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Get user ID from authenticated request
        const userId = req.user.id;
        
        // Find user with password field
        const user = await User.findById(userId).select('+password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Check if user is admin
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }
        
        // Update email if provided
        if (email) {
            // Check if email already exists for another user
            const existingUser = await User.findOne({ email, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use'
                });
            }
            user.email = email;
        }
        
        // Update password if provided - UPDATED SECTION
        if (password) {
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 6 characters long'
                });
            }
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }
        
        await user.save();
        
        // Generate new token if email changed
        if (email) {
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                email: user.email,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Update admin profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
};


module.exports = {
    findUser,
    fetchUsers,
    findUserById,
    getUserProfile,
    updateUserProfile,
    updateAdminProfile
}