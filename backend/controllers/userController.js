const User = require('../models/User');
const Order = require('../models/Order');
const mongoose = require('mongoose');

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

module.exports = {
    findUser,
    fetchUsers
}