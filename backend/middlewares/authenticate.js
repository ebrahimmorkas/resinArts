const jwt = require('jsonwebtoken');
require('dotenv').config();

// Standard authentication - required
const authenticate = (req, res, next) => {
    const token = req.cookies.token;
    if(!token) {
        return res.status(401).json({message: 'Please Login to continue'});
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch(err) {
        return res.status(401).json({message: "Please Login to continue"});
    }
}

// Optional authentication - doesn't block if no token
const authenticateOptional = (req, res, next) => {
    const token = req.cookies.token;
    
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch(err) {
            // Token invalid, but continue anyway as guest
            req.user = null;
        }
    } else {
        req.user = null;
    }
    
    next();
}

module.exports = authenticate;
module.exports.authenticateOptional = authenticateOptional;