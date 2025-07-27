const jwt = require('jsonwebtoken');
require('dotenv').config();

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

module.exports = authenticate;