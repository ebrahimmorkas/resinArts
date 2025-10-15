const User = require('../models/User');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const Bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const XLSX = require('xlsx');
const path = require('path');
const sendEmail = require('../utils/sendEmail');

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

// Delete single or multiple users
const deleteUsers = async (req, res) => {
    try {
        const { userIds } = req.body; // Array of user IDs
        
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: "No user IDs provided" });
        }

        // Validate all IDs
        const invalidIds = userIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({ message: "Invalid user IDs found" });
        }

        // Delete users (excluding admins for safety)
        const result = await User.deleteMany({
            _id: { $in: userIds },
            role: { $ne: 'admin' } // Prevent deleting admin accounts
        });

        return res.status(200).json({
            message: `${result.deletedCount} user(s) deleted successfully`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Delete users error:', error);
        return res.status(500).json({ message: "Server error while deleting users" });
    }
};

// Send custom email to users
const sendCustomEmail = async (req, res) => {
    try {
        const { userIds, subject, body } = req.body;
        
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: "No user IDs provided" });
        }
        
        if (!subject || !body) {
            return res.status(400).json({ message: "Subject and body are required" });
        }

        // Find users
        const users = await User.find({ _id: { $in: userIds } });
        
        if (users.length === 0) {
            return res.status(404).json({ message: "No users found" });
        }

        // Send emails
        const emailPromises = users.map(user => 
            sendEmail(user.email, subject, body)
        );
        
        await Promise.all(emailPromises);

        return res.status(200).json({
            message: `Email sent to ${users.length} user(s) successfully`
        });
    } catch (error) {
        console.error('Send email error:', error);
        return res.status(500).json({ message: "Server error while sending emails" });
    }
};

// Import users from Excel
const importUsers = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return res.status(400).json({ message: "Excel file is empty" });
        }

        const errors = [];
        const successfulUsers = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2; // Excel row number (accounting for header)

            try {
                // Validate required fields
                if (!row.email || !row.phone || !row.password) {
                    errors.push(`Row ${rowNumber}: Email, phone, and password are required`);
                    continue;
                }

                // Check if user already exists
                const existingEmail = await User.findOne({ email: row.email });
                if (existingEmail) {
                    errors.push(`Row ${rowNumber}: Email ${row.email} already exists`);
                    continue;
                }

                const existingPhone = await User.findOne({ phone_number: row.phone });
                if (existingPhone) {
                    errors.push(`Row ${rowNumber}: Phone ${row.phone} already exists`);
                    continue;
                }

                if (row.whatsapp) {
                    const existingWhatsapp = await User.findOne({ whatsapp_number: row.whatsapp });
                    if (existingWhatsapp) {
                        errors.push(`Row ${rowNumber}: WhatsApp ${row.whatsapp} already exists`);
                        continue;
                    }
                }

                // Hash password
                const saltRounds = 10;
                const hashedPassword = await Bcrypt.hash(row.password, saltRounds);

                // Create new user
                const newUser = new User({
                    first_name: row.first_name || '',
                    middle_name: row.middle_name || '',
                    last_name: row.last_name || '',
                    email: row.email,
                    phone_number: row.phone,
                    whatsapp_number: row.whatsapp || '',
                    state: row.state || '',
                    city: row.city || '',
                    address: row.address || '',
                    zip_code: row.zip_code || '000000',
                    password: hashedPassword
                });

                await newUser.save();
                successfulUsers.push(row.email);
            } catch (error) {
                errors.push(`Row ${rowNumber}: ${error.message}`);
            }
        }

        // Delete uploaded file
        const fs = require('fs');
        fs.unlinkSync(req.file.path);

        return res.status(200).json({
            message: `Import completed. ${successfulUsers.length} user(s) imported successfully`,
            successCount: successfulUsers.length,
            errorCount: errors.length,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Import users error:', error);
        return res.status(500).json({ message: "Server error while importing users" });
    }
};

// Export users to Excel
const exportUsers = async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } }).select('-password -__v');

        if (users.length === 0) {
            return res.status(404).json({ message: "No users to export" });
        }

        // Format data for Excel
        const excelData = users.map(user => ({
            first_name: user.first_name || '',
            middle_name: user.middle_name || '',
            last_name: user.last_name || '',
            phone: user.phone_number || '',
            whatsapp: user.whatsapp_number || '',
            email: user.email || '',
            state: user.state || '',
            city: user.city || '',
            address: user.address || '',
            zip_code: user.zip_code || ''
        }));

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Set headers and send file
        res.setHeader('Content-Disposition', 'attachment; filename=users_export.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        return res.send(buffer);
    } catch (error) {
        console.error('Export users error:', error);
        return res.status(500).json({ message: "Server error while exporting users" });
    }
};

// Download sample Excel
const downloadSample = async (req, res) => {
    try {
        const sampleData = [
            {
                first_name: 'John',
                middle_name: 'Michael',
                last_name: 'Doe',
                phone: '9876543210',
                whatsapp: '9876543210',
                email: 'john.doe@example.com',
                state: 'Maharashtra',
                city: 'Mumbai',
                address: '123 Sample Street',
                password: 'Password@123'
            }
        ];

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename=sample_customers.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        return res.send(buffer);
    } catch (error) {
        console.error('Download sample error:', error);
        return res.status(500).json({ message: "Server error while downloading sample" });
    }
};

module.exports = {
    findUser,
    fetchUsers,
    findUserById,
    getUserProfile,
    updateUserProfile,
    updateAdminProfile,
    deleteUsers,
    sendCustomEmail,
    importUsers,
    exportUsers,
    downloadSample
}