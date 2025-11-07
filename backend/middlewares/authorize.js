const authorize = (allowedRoles) => {
    return (req, res, next) => {
        console.log(`allowedRoles ${allowedRoles}`);
        console.log(`req user role ${req.user.role}`)
        if(!allowedRoles.includes(req.user.role)) {
            console.log(allowedRoles)
            console.log(req.user.role)
            return res.status(403).json({message: 'Access Denied'});
        }
    next();
    }
}

module.exports = authorize;

