const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticate = (req, res, next) => {
    const token = req.cookies.token;
    if(!token) {
        console.log("From authetnticate " + token);
        return res.status(401).json({message: 'Please Login to continue blah'});
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch(err) {
            console.log("From authetnticate catch" + token);
        return res.status(401).json({message: "Please Login to continue blah blah"});
    }
}

module.exports = authenticate;