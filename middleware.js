const jwt = require('jsonwebtoken')

function authMiddleware(req,res,next) {
    const token = req.headers['authorization']
    if (!token) {
        return res.status(401).json({message:'no token'})
    }
    try {
        const decoded = jwt.verify(token,'secret123')
        req.user=decoded
        next()
    } catch (error) {
         return res.status(401).json({message:'invalid token'})
    }
}

module.exports = authMiddleware